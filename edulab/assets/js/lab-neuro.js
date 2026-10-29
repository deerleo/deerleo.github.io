/* EduLab · 神经网络识数字（neuro）
 * 章节：图像就是数字 / 一个神经元 / 多层网络 / 现场训练 / 卷积网络 / AI 也会犯错
 * 实现：手写画板 → 16×16 灰度输入；浏览器内 MLP(256→48→10) 现场训练（SGD）；
 *       three.js 三维网络信号传播；3×3 卷积核扫描演示；旋转/平移/噪点鲁棒性实验。
 */
import {
  THREE, TAU, clamp, loadHDR, loadTexture, loadAll, createApp, cameraTweenTick,
  makeLoader, createSections, createControlsPanel, makeHUD, makeTextSprite,
} from './edu-core.js';

const TEXDIR = '../assets/textures/';
const RES = 16;

/* ---------------- 5×7 数字点阵 ---------------- */

const FONT = [
  ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
];

/* 把点阵按随机变换画到大画布上，再降采样成 RES×RES 归一化向量 */
function renderDigit(digit, rng) {
  const SZ = 128;
  const cv = document.createElement('canvas');
  cv.width = SZ; cv.height = SZ;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.fillStyle = '#000'; c.fillRect(0, 0, SZ, SZ);
  c.save();
  c.translate(SZ / 2, SZ / 2);
  if (rng) {
    c.rotate((rng() - 0.5) * 0.36);                 // ±10°
    const s = 0.85 + rng() * 0.35;
    c.scale(s, s);
    c.translate((rng() - 0.5) * 14, (rng() - 0.5) * 14);
  }
  const cell = 15;
  c.fillStyle = '#fff';
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (FONT[digit][r][col] === '1') {
        const rad = (rng ? 5 + rng() * 3.2 : 6.2);
        c.beginPath();
        c.arc((col - 2) * cell, (r - 3) * cell, rad, 0, TAU);
        c.fill();
      }
    }
  }
  c.restore();
  return sampleCanvas(cv);
}

// 抽取画布 → 裁边居中 → RES×RES 灰度 Float32Array(0~1)
function sampleCanvas(cv) {
  const SZ = cv.width;
  const c = cv.getContext('2d', { willReadFrequently: true });
  const data = c.getImageData(0, 0, SZ, SZ).data;
  // 找墨迹包围盒
  let minX = SZ, minY = SZ, maxX = -1, maxY = -1;
  for (let y = 0; y < SZ; y++) {
    for (let x = 0; x < SZ; x++) {
      if (data[(y * SZ + x) * 4] > 60) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
  }
  const out = new Float32Array(RES * RES);
  if (maxX < 0) return out;
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const s = Math.max(bw, bh) * 1.32;              // 留边
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const small = document.createElement('canvas');
  small.width = RES; small.height = RES;
  const sc = small.getContext('2d', { willReadFrequently: true });
  sc.imageSmoothingEnabled = true;
  sc.drawImage(cv, cx - s / 2, cy - s / 2, s, s, 0, 0, RES, RES);
  const sd = sc.getImageData(0, 0, RES, RES).data;
  for (let i = 0; i < RES * RES; i++) out[i] = sd[i * 4] / 255;
  return out;
}

/* ---------------- 小型多层感知机 ---------------- */

class MLP {
  constructor(nIn, nHid, nOut) {
    this.nIn = nIn; this.nHid = nHid; this.nOut = nOut;
    this.reset();
  }
  reset() {
    const g = (n, m) => {
      const w = new Float32Array(n * m);
      for (let i = 0; i < w.length; i++) w[i] = (Math.random() * 2 - 1) * Math.sqrt(2 / n);
      return w;
    };
    this.W1 = g(this.nHid, this.nIn); this.b1 = new Float32Array(this.nHid);
    this.W2 = g(this.nOut, this.nHid); this.b2 = new Float32Array(this.nOut);
  }
  forward(x) {
    const h = new Float32Array(this.nHid);
    for (let j = 0; j < this.nHid; j++) {
      let s = this.b1[j];
      const off = j * this.nIn;
      for (let i = 0; i < this.nIn; i++) s += this.W1[off + i] * x[i];
      h[j] = Math.tanh(s);
    }
    const o = new Float32Array(this.nOut);
    let max = -1e9;
    for (let k = 0; k < this.nOut; k++) {
      let s = this.b2[k];
      const off = k * this.nHid;
      for (let j = 0; j < this.nHid; j++) s += this.W2[off + j] * h[j];
      o[k] = s; if (s > max) max = s;
    }
    let sum = 0;
    for (let k = 0; k < this.nOut; k++) { o[k] = Math.exp(o[k] - max); sum += o[k]; }
    for (let k = 0; k < this.nOut; k++) o[k] /= sum;
    return { h, o };
  }
  trainEpoch(X, Y, lr) {
    const idx = X.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const gW1 = new Float32Array(this.W1.length), gW2 = new Float32Array(this.W2.length);
    const gb1 = new Float32Array(this.b1.length), gb2 = new Float32Array(this.b2.length);
    let loss = 0;
    const B = 16;
    for (let b = 0; b < idx.length; b++) {
      const n = idx[b];
      const { h, o } = this.forward(X[n]);
      const y = Y[n];
      for (let k = 0; k < this.nOut; k++) loss -= y[k] * Math.log(o[k] + 1e-9);
      const dO = new Float32Array(this.nOut);
      for (let k = 0; k < this.nOut; k++) dO[k] = o[k] - y[k];
      const dH = new Float32Array(this.nHid);
      for (let k = 0; k < this.nOut; k++) {
        const off = k * this.nHid;
        gb2[k] += dO[k];
        for (let j = 0; j < this.nHid; j++) {
          gW2[off + j] += dO[k] * h[j];
          dH[j] += this.W2[off + j] * dO[k];
        }
      }
      for (let j = 0; j < this.nHid; j++) {
        dH[j] *= (1 - h[j] * h[j]);
        gb1[j] += dH[j];
        const off = j * this.nIn;
        for (let i = 0; i < this.nIn; i++) gW1[off + i] += dH[j] * xAt(X, n, i);
      }
      // 每 B 条累积后批量下降
      if ((b + 1) % B === 0 || b === idx.length - 1) {
        const k2 = lr / B;
        for (let i = 0; i < this.W1.length; i++) { this.W1[i] -= gW1[i] * k2; gW1[i] = 0; }
        for (let i = 0; i < this.W2.length; i++) { this.W2[i] -= gW2[i] * k2; gW2[i] = 0; }
        for (let i = 0; i < this.b1.length; i++) { this.b1[i] -= gb1[i] * k2; gb1[i] = 0; }
        for (let i = 0; i < this.b2.length; i++) { this.b2[i] -= gb2[i] * k2; gb2[i] = 0; }
      }
    }
    return loss / idx.length;
  }
  accuracy(X, Y) {
    let ok = 0;
    for (let n = 0; n < X.length; n++) {
      const { o } = this.forward(X[n]);
      let bi = 0, bj = 0;
      for (let k = 0; k < 10; k++) { if (o[k] > o[bi]) bi = k; if (Y[n][k] > Y[n][bj]) bj = k; }
      if (bi === bj) ok++;
    }
    return ok / X.length;
  }
}
// X 存为二维数组，xAt 直取
function xAt(X, n, i) { return X[n][i]; }

/* ---------------- 数据集 ---------------- */

function buildDataset() {
  const X = [], Y = [], Xr = [], Yr = [];
  const rng = Math.random;
  for (let d = 0; d < 10; d++) {
    for (let s = 0; s < 30; s++) {
      X.push(Array.from(renderDigit(d, rng)));
      const y = new Float32Array(10); y[d] = 1; Y.push(y);
    }
    // 留出测试样本（不同随机扰动）
    for (let s = 0; s < 6; s++) {
      Xr.push(Array.from(renderDigit(d, rng)));
      const y = new Float32Array(10); y[d] = 1; Yr.push(y);
    }
  }
  return { X, Y, Xr, Yr };
}

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在准备神经网络实验…');

const app = createApp({
  container: stage, fov: 44, near: 0.1, far: 200,
  cameraPos: [0, 1.6, 6.4], target: [0, 0.2, 0],
  minDistance: 1, maxDistance: 30, exposure: 1.0,
});
const { scene, camera, controls } = app;

scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x55483a, 1.0));
const dl = new THREE.DirectionalLight(0xffffff, 1.6);
dl.position.set(4, 6, 8);
scene.add(dl);

/* 输入体素场（当前画板内容的 3D 呈现） */
const voxelGeo = new THREE.BoxGeometry(0.082, 0.082, 0.082);
const voxels = new THREE.InstancedMesh(voxelGeo, new THREE.MeshBasicMaterial({}), RES * RES);
voxels.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(voxels);
{
  const m = new THREE.Matrix4();
  const sp = 0.1;
  for (let r = 0; r < RES; r++) {
    for (let c = 0; c < RES; c++) {
      const i = r * RES + c;
      m.setPosition((c - (RES - 1) / 2) * sp, ((RES - 1) / 2 - r) * sp, 0);
      voxels.setMatrixAt(i, m);
      voxels.setColorAt(i, new THREE.Color(0x222831));
    }
  }
  voxels.instanceMatrix.needsUpdate = true;
}
function updateVoxels(vec) {
  const col = new THREE.Color();
  for (let i = 0; i < RES * RES; i++) {
    const v = vec ? vec[i] : 0;
    col.setRGB(0.10 + v * 0.92, 0.12 + v * 0.85, 0.16 + v * 0.78);
    voxels.setColorAt(i, col);
  }
  voxels.instanceColor.needsUpdate = true;
}

/* 神经元与连接（多层网络 / 训练章） */
const netG = new THREE.Group();
netG.visible = false;
scene.add(netG);
const hidMeshes = [];
const outMeshes = [];
const outLabels = [];
{
  const sph = new THREE.SphereGeometry(0.085, 14, 12);
  const HCOLS = 2, HROWS = 24;
  for (let j = 0; j < 48; j++) {
    const m = new THREE.Mesh(sph, new THREE.MeshBasicMaterial({ color: 0x3a4254 }));
    m.position.set(-1.15 + (j % HCOLS) * 0.42, ((HROWS - 1) / 2 - ((j / HCOLS) | 0)) * 0.155, 0);
    netG.add(m);
    hidMeshes.push(m);
  }
  for (let k = 0; k < 10; k++) {
    const m = new THREE.Mesh(sph, new THREE.MeshBasicMaterial({ color: 0x3a4254 }));
    m.position.set(1.5, (4.5 - k) * 0.42, 0);
    netG.add(m);
    outMeshes.push(m);
    const sp = makeTextSprite(String(k), { fontSize: 30, color: '#cfe0ff', scale: 0.004 });
    sp.position.set(1.85, (4.5 - k) * 0.42, 0);
    netG.add(sp);
    outLabels.push(sp);
  }
}
// 连接线
let connHO = null, connIH = null;
function buildConnections() {
  if (connHO) { netG.remove(connHO); connHO.geometry.dispose(); }
  if (connIH) { netG.remove(connIH); connIH.geometry.dispose(); }
  const nHO = 48 * 10;
  const posHO = new Float32Array(nHO * 6);
  const colHO = new Float32Array(nHO * 6);
  let p = 0;
  for (let k = 0; k < 10; k++) {
    for (let j = 0; j < 48; j++) {
      const a = hidMeshes[j].position, b = outMeshes[k].position;
      posHO[p] = a.x; posHO[p + 1] = a.y; posHO[p + 2] = a.z;
      posHO[p + 3] = b.x; posHO[p + 4] = b.y; posHO[p + 5] = b.z;
      const w = net ? net.W2[k * 48 + j] : 0;
      const c = w >= 0 ? [0.35, 0.75, 0.5] : [0.85, 0.42, 0.35];
      const mag = Math.min(Math.abs(w) * 1.6, 1) * 0.85 + 0.05;
      colHO[p] = c[0] * mag; colHO[p + 1] = c[1] * mag; colHO[p + 2] = c[2] * mag;
      colHO[p + 3] = colHO[p]; colHO[p + 4] = colHO[p + 1]; colHO[p + 5] = colHO[p + 2];
      p += 6;
    }
  }
  const gHO = new THREE.BufferGeometry();
  gHO.setAttribute('position', new THREE.BufferAttribute(posHO, 3));
  gHO.setAttribute('color', new THREE.BufferAttribute(colHO, 3));
  connHO = new THREE.LineSegments(gHO, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75 }));
  netG.add(connHO);
  // 输入→隐藏：抽前 600 强连接
  if (net) {
    const pairs = [];
    for (let j = 0; j < 48; j++) {
      for (let i = 0; i < RES * RES; i++) pairs.push([Math.abs(net.W1[j * RES * RES + i]), j, i]);
    }
    pairs.sort((a, b) => b[0] - a[0]);
    const top = pairs.slice(0, 640);
    const posIH = new Float32Array(top.length * 6);
    const colIH = new Float32Array(top.length * 6);
    const sp = 0.1;
    top.forEach(([mag, j, i], n) => {
      const r = (i / RES) | 0, c = i % RES;
      const x = -2.35, y = ((RES - 1) / 2 - r) * sp, z = (c - (RES - 1) / 2) * sp - 0.0;
      const b = hidMeshes[j].position;
      posIH.set([x, y, z, b.x, b.y, b.z], n * 6);
      const w = net.W1[j * RES * RES + i];
      const mm = Math.min(mag * 2.4, 1) * 0.5 + 0.05;
      const c3 = w >= 0 ? [0.3, 0.55, 0.75] : [0.75, 0.5, 0.3];
      colIH.set([c3[0] * mm, c3[1] * mm, c3[2] * mm, c3[0] * mm, c3[1] * mm, c3[2] * mm], n * 6);
    });
    const gIH = new THREE.BufferGeometry();
    gIH.setAttribute('position', new THREE.BufferAttribute(posIH, 3));
    gIH.setAttribute('color', new THREE.BufferAttribute(colIH, 3));
    connIH = new THREE.LineSegments(gIH, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55 }));
    netG.add(connIH);
  }
}

/* 一个神经元（3D 决策面） */
const neuG = new THREE.Group();
neuG.visible = false;
scene.add(neuG);
let neuSurface = null;
function buildNeuronSurface() {
  if (neuSurface) neuG.remove(neuSurface);
  const SEG = 56;
  const geo = new THREE.PlaneGeometry(6, 6, SEG, SEG).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  neuSurface = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide,
    transparent: true, opacity: 0.94,
  }));
  neuG.add(neuSurface);
  updateNeuronSurface();
}
function updateNeuronSurface() {
  if (!neuSurface) return;
  const pos = neuSurface.geometry.attributes.position;
  const col = neuSurface.geometry.attributes.color;
  const { w1, w2, b } = neuronState;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const v = 1 / (1 + Math.exp(-(w1 * x + w2 * z + b) * 0.8));
    pos.setY(i, (v - 0.5) * 2.6);
    const t = clamp(v, 0, 1);
    col.setXYZ(i, 0.25 + t * 0.75, 0.45 + 0.25 * Math.abs(t - 0.5), 0.9 - t * 0.65);
  }
  pos.needsUpdate = true; col.needsUpdate = true;
  neuSurface.geometry.computeVertexNormals();
}

/* ---------------- 全局状态 ---------------- */

const state = {
  canvasVec: new Float32Array(RES * RES),   // 当前画板输入
  drawing: false, lastPt: null,
  res: 16,
  showValues: false,
  pulseT: -1, pulseVec: null,
  training: false, epoch: 0, maxEpoch: 12, lr: 0.5,
  lossHist: [],
  conv: { kernelIdx: 0, speed: 1, px: 0, py: 0, running: true },
  robust: { rot: 0, shift: 0, noise: 0, digit: 3 },
};

let net = new MLP(RES * RES, 48, 10);
let DATASET = null;

/* ---------------- DOM 面板：画板 / 像素图 / 卷积 / 置信度 ---------------- */

function makePanel(title, x, y, w) {
  const box = document.createElement('div');
  box.className = 'coastal-window';
  box.style.cssText += `left:${x};right:auto;bottom:${y};width:${w};`;
  box.innerHTML = `<div class="cw-head"><b>${title}</b></div>`;
  stage.appendChild(box);
  return box;
}

// 画板
const boardBox = makePanel('✍️ 手写板（按住鼠标/手指书写）', '14px', '86px', '242px');
const board = document.createElement('canvas');
board.width = 220; board.height = 220;
board.style.cssText = 'position:relative;display:block;width:220px;height:220px;margin:0 auto 8px;touch-action:none;cursor:crosshair;background:#0d1017;border-radius:8px;';
boardBox.appendChild(board);
const bctx = board.getContext('2d', { willReadFrequently: true });
clearBoard();
function clearBoard() {
  bctx.fillStyle = '#0d1017';
  bctx.fillRect(0, 0, 220, 220);
  state.canvasVec.fill(0);
  updateVoxels(state.canvasVec);

}
function boardToVec() {
  const cv = document.createElement('canvas');
  cv.width = 220; cv.height = 220;
  cv.getContext('2d').drawImage(board, 0, 0);
  state.canvasVec = sampleCanvas(cv);
  updateVoxels(state.canvasVec);

}
function boardPos(e) {
  const r = board.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return [(p.clientX - r.left) / r.width * 220, (p.clientY - r.top) / r.height * 220];
}
function strokeTo(x, y) {
  bctx.strokeStyle = '#fff';
  bctx.lineWidth = 15; bctx.lineCap = 'round'; bctx.lineJoin = 'round';
  if (state.lastPt) {
    bctx.beginPath();
    bctx.moveTo(state.lastPt[0], state.lastPt[1]);
    bctx.lineTo(x, y);
    bctx.stroke();
  } else {
    bctx.beginPath();
    bctx.arc(x, y, 7.5, 0, TAU);
    bctx.fill();
  }
  state.lastPt = [x, y];
}
board.addEventListener('pointerdown', (e) => { state.drawing = true; state.lastPt = null; const [x, y] = boardPos(e); strokeTo(x, y); boardToVec(); e.preventDefault(); });
window.addEventListener('pointermove', (e) => { if (!state.drawing) return; const [x, y] = boardPos(e); strokeTo(x, y); boardToVec(); });
window.addEventListener('pointerup', () => { state.drawing = false; state.lastPt = null; boardToVec(); });

// 像素值面板（章 1）
const pxBox = makePanel('🔢 数字视角：像素灰度值', '270px', '86px', '258px');
pxBox.style.display = 'none';
const pxCanvas = document.createElement('canvas');
pxCanvas.width = 256; pxCanvas.height = 256;
pxCanvas.style.cssText = 'position:relative;display:block;width:242px;height:242px;margin:0 auto 8px;';
pxBox.appendChild(pxCanvas);
const pxc = pxCanvas.getContext('2d');
const pxHead = pxBox.querySelector('.cw-head b');
function drawPixelView() {
  const R = state.viewRes;
  pxHead.textContent = `🔢 数字视角：${R}×${R} 灰度值`;
  // 独立重采样（仅展示；模型输入固定 16×16）
  const tmp = document.createElement('canvas');
  tmp.width = 220; tmp.height = 220;
  tmp.getContext('2d').drawImage(board, 0, 0);
  const sc = document.createElement('canvas');
  sc.width = R; sc.height = R;
  const scc = sc.getContext('2d', { willReadFrequently: true });
  scc.drawImage(tmp, 0, 0, R, R);
  const sd = scc.getImageData(0, 0, R, R).data;
  pxc.fillStyle = '#0d1017';
  pxc.fillRect(0, 0, 256, 256);
  const cs = 256 / R;
  pxc.font = '600 9px monospace';
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < R; c++) {
      const val = sd[(r * R + c) * 4] / 255;
      pxc.fillStyle = `rgb(${40 + val * 200},${44 + val * 190},${54 + val * 180})`;
      pxc.fillRect(c * cs, r * cs, cs - 1, cs - 1);
      if (state.showValues && val > 0.05) {
        pxc.fillStyle = val > 0.55 ? '#111' : '#dfe6f2';
        pxc.fillText(Math.round(val * 99), c * cs + 2, r * cs + 9);
      }
    }
  }
}

// 置信度条（章 6）
const confBox = makePanel('🤖 模型判断（各类置信度）', '270px', '86px', '258px');
confBox.style.display = 'none';
const confRows = [];
for (let d = 0; d < 10; d++) {
  const row = document.createElement('div');
  row.className = 'bar-row';
  row.style.padding = '0 10px';
  row.innerHTML = `<span class="bar-label">${d}</span><span class="bar-track"><span class="bar-fill"></span></span><span class="bar-val">0%</span>`;
  confBox.appendChild(row);
  confRows.push({ fill: row.querySelector('.bar-fill'), val: row.querySelector('.bar-val') });
}
function showConfidence(probs) {
  let best = 0;
  probs.forEach((p, i) => { if (p > probs[best]) best = i; });
  probs.forEach((p, i) => {
    confRows[i].fill.style.width = Math.round(p * 100) + '%';
    confRows[i].fill.style.background = i === best ? 'var(--accent)' : 'var(--chip-bg)';
    confRows[i].val.textContent = Math.round(p * 100) + '%';
  });
}

// 损失曲线（章 4）
const lossBox = makePanel('📉 训练损失', '14px', '86px', '300px');
lossBox.style.display = 'none';
const lossCanvas = document.createElement('canvas');
lossCanvas.width = 560; lossCanvas.height = 220;
lossCanvas.style.cssText = 'position:relative;display:block;width:284px;height:112px;margin:0 auto 8px;';
lossBox.appendChild(lossCanvas);
const lctx = lossCanvas.getContext('2d');
function drawLoss() {
  lctx.clearRect(0, 0, 560, 220);
  const H = state.lossHist;
  if (H.length < 2) return;
  const max = Math.max(...H, 0.4);
  lctx.strokeStyle = 'var(--accent)';
  lctx.strokeStyle = '#e8674a';
  lctx.lineWidth = 3;
  lctx.beginPath();
  H.forEach((v, i) => {
    const x = 16 + i / (H.length - 1) * 528;
    const y = 200 - (v / max) * 180;
    i ? lctx.lineTo(x, y) : lctx.moveTo(x, y);
  });
  lctx.stroke();
  lctx.fillStyle = '#8a94a8';
  lctx.font = '500 15px -apple-system,sans-serif';
  lctx.fillText('损失 ' + H[H.length - 1].toFixed(3), 16, 24);
}

// 卷积演示（章 5）
const convBox = makePanel('🧮 3×3 卷积核扫描', '50%', '86px', '470px');
convBox.style.cssText += 'transform:translateX(-50%);max-width:calc(100vw - 20px);';
convBox.style.display = 'none';
convBox.innerHTML = `
  <div class="cw-head"><b>🧮 3×3 卷积核扫描</b><span class="cw-info">输入 → 特征图</span></div>
  <div style="display:flex;gap:10px;padding:8px 10px;justify-content:center">
    <div><div style="font-size:11px;color:var(--text-faint);text-align:center;margin-bottom:3px">输入 16×16</div><canvas id="cvIn" width="192" height="192" style="position:relative;width:150px;height:150px;border-radius:6px"></canvas></div>
    <div><div style="font-size:11px;color:var(--text-faint);text-align:center;margin-bottom:3px">卷积核 3×3</div><canvas id="cvK" width="72" height="72" style="position:relative;width:64px;height:64px;border-radius:6px;margin-top:43px"></canvas></div>
    <div><div style="font-size:11px;color:var(--text-faint);text-align:center;margin-bottom:3px">输出特征图 14×14</div><canvas id="cvOut" width="168" height="168" style="position:relative;width:150px;height:150px;border-radius:6px"></canvas></div>
  </div>`;
const cvIn = convBox.querySelector('#cvIn').getContext('2d');
const cvK = convBox.querySelector('#cvK').getContext('2d');
const cvOut = convBox.querySelector('#cvOut').getContext('2d');

const KERNELS = [
  { name: '竖直边缘', k: [-1, 0, 1, -2, 0, 2, -1, 0, 1] },
  { name: '水平边缘', k: [-1, -2, -1, 0, 0, 0, 1, 2, 1] },
  { name: '锐化', k: [0, -1, 0, -1, 5, -1, 0, -1, 0] },
  { name: '轮廓', k: [-1, -1, -1, -1, 8, -1, -1, -1, -1] },
];

function drawConvFrame() {
  const v = state.canvasVec;
  const k = KERNELS[state.conv.kernelIdx].k;
  // 输入
  const cs = 192 / RES;
  cvIn.fillStyle = '#0d1017';
  cvIn.fillRect(0, 0, 192, 192);
  for (let r = 0; r < RES; r++) for (let c = 0; c < RES; c++) {
    const val = v[r * RES + c];
    cvIn.fillStyle = `rgb(${40 + val * 200},${44 + val * 190},${54 + val * 180})`;
    cvIn.fillRect(c * cs, r * cs, cs - 0.6, cs - 0.6);
  }
  // 扫描窗口
  const px = state.conv.px, py = state.conv.py;
  cvIn.strokeStyle = '#e8674a';
  cvIn.lineWidth = 2.4;
  cvIn.strokeRect(px * cs - 1, py * cs - 1, cs * 3 + 2, cs * 3 + 2);
  // 卷积核
  const ks = 72 / 3;
  cvK.fillStyle = '#141821';
  cvK.fillRect(0, 0, 72, 72);
  for (let i = 0; i < 9; i++) {
    const kv = k[i];
    const mag = Math.min(Math.abs(kv) / 5, 1);
    cvK.fillStyle = kv >= 0 ? `rgba(80,190,120,${0.15 + mag * 0.7})` : `rgba(220,90,70,${0.15 + mag * 0.7})`;
    cvK.fillRect((i % 3) * ks, ((i / 3) | 0) * ks, ks - 1, ks - 1);
    cvK.fillStyle = '#e8edf5';
    cvK.font = '600 13px monospace';
    cvK.fillText(String(kv), (i % 3) * ks + 4, ((i / 3) | 0) * ks + 16);
  }
  cvK.strokeStyle = '#e8674a';
  cvK.lineWidth = 2;
  cvK.strokeRect(0.5, 0.5, 71, 71);
  // 输出特征图
  const os = 168 / 14;
  cvOut.fillStyle = '#0d1017';
  cvOut.fillRect(0, 0, 168, 168);
  for (let r = 0; r < 14; r++) for (let c = 0; c < 14; c++) {
    const done = r < py || (r === py && c < px);
    if (!done) continue;
    let s = 0;
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) {
      s += v[(r + dy) * RES + (c + dx)] * k[dy * 3 + dx];
    }
    const val = clamp(s / 4, -1, 1);
    cvOut.fillStyle = val >= 0 ? `rgba(90,200,235,${Math.abs(val)})` : `rgba(230,120,90,${Math.abs(val)})`;
    cvOut.fillRect(c * os, r * os, os - 0.6, os - 0.6);
  }
  // 推进扫描
  if (state.conv.running) {
    state.conv.px += 0.6 * state.conv.speed;
    if (state.conv.px >= 14) { state.conv.px = 0; state.conv.py++; }
    if (state.conv.py >= 14) { state.conv.py = 0; }
  }
}

/* ---------------- 控制 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
const hud = makeHUD(stage, [['a', '读数'], ['b', ''], ['x', '']]);
hud.show(false);

function hidePanels() {
  [pxBox, confBox, lossBox, convBox].forEach((b) => { b.style.display = 'none'; });
}
function boardVisible(v) { boardBox.style.display = v ? '' : 'none'; }
function netVisible(v) {
  netG.visible = v;
  voxels.visible = !v;
}

/* ---------------- 章节 ---------------- */

const SECTIONS = [
  {
    id: 'pixels', title: '图像就是数字',
    html: `<p>计算机眼里的手写数字不是「形状」，而是一张<b>灰度值表格</b>：把画面切成 16×16 = <b>256 个小格子</b>，每格一个 0~1 的数字（0 = 黑，1 = 白）。「识别数字」由此变成一个纯粹的数学问题。</p>
<p>在左下角手写板上写个数字，中间看它的体素高度图，右侧看每个格子的灰度值。切换「分辨率」感受采样粗细的影响。</p>`,
    enter() {
      netVisible(false);
      neuG.visible = false;
      hidePanels();
      boardVisible(true);
      pxBox.style.display = '';
      hud.show(false);
      ctl.clear();
      ctl.seg({
        options: [{ label: '8×8', value: 8 }, { label: '16×16', value: 16 }, { label: '24×24', value: 24 }],
        value: 16,
        onChange: (v) => { state.viewRes = v; drawPixelView(); },
      });
      ctl.toggle({
        label: '显示数值', value: false,
        onChange: (v) => { state.showValues = v; drawPixelView(); },
      });
      ctl.sep();
      ctl.button({ label: '示例：5', onClick: () => demoDigit(5) });
      ctl.button({ label: '示例：3', onClick: () => demoDigit(3) });
      ctl.button({ label: '清空', onClick: clearBoard });
      app.setCamera([0, 1.2, 4.6], [0, 0.2, 0]);
      state.showValues = false;
      state.viewRes = 16;
    },
    tick() { if (pxBox.style.display !== 'none') drawPixelView(); },
  },
  {
    id: 'neuron', title: '一个神经元',
    html: `<p>神经元做的只有一件事：<b>加权求和 + 非线性</b>。输出 = σ(w₁·x₁ + w₂·x₂ + b)，σ 是 S 形函数。它把平面切成两半——这是「判断」的最小单元。</p>
<p>拖动三个滑杆改变权重，看三维决策面如何翻转；点按钮载入「与/或/异或」问题——注意<b>异或</b>是单个神经元无论如何都切不开的（这正是需要多层网络的原因）。</p>`,
    enter() {
      netVisible(false);
      boardVisible(false);
      hidePanels();
      neuG.visible = true;
      buildNeuronSurface();
      hud.show(false);
      ctl.clear();
      ctl.slider({
        label: '权重 w₁', min: -4, max: 4, step: 0.1, value: neuronState.w1,
        fmt: (v) => v.toFixed(1), onInput: (v) => { neuronState.w1 = v; updateNeuronSurface(); },
      });
      ctl.slider({
        label: '权重 w₂', min: -4, max: 4, step: 0.1, value: neuronState.w2,
        fmt: (v) => v.toFixed(1), onInput: (v) => { neuronState.w2 = v; updateNeuronSurface(); },
      });
      ctl.slider({
        label: '偏置 b', min: -4, max: 4, step: 0.1, value: neuronState.b,
        fmt: (v) => v.toFixed(1), onInput: (v) => { neuronState.b = v; updateNeuronSurface(); },
      });
      ctl.sep();
      const setW = (w1, w2, b) => {
        neuronState.w1 = w1; neuronState.w2 = w2; neuronState.b = b;
        updateNeuronSurface();
      };
      ctl.button({ label: '与 AND', onClick: () => setW(1.5, 1.5, -2.2) });
      ctl.button({ label: '或 OR', onClick: () => setW(1.5, 1.5, -0.6) });
      ctl.button({ label: '异或 XOR(切不开)', onClick: () => setW(2.2, -2.2, 0) });
      app.setCamera([3.4, 3.0, 5.4], [0, 0, 0]);
    },
  },
  {
    id: 'network', title: '多层网络',
    html: `<p>把许多神经元<b>分层</b>串起来：输入层（256 个像素）→ 隐藏层（48 个神经元）→ 输出层（10 个数字的置信度）。信号从左往右逐层传播，每一层都在上一节那把「小刀」的基础上继续切——层层叠加就能拼出复杂边界。</p>
<p>写个数字，点「前向传播」看信号逐层点亮、输出层给出答案。（当前模型已预训练，下一章可以亲手重训它。）</p>`,
    enter() {
      neuG.visible = false;
      netVisible(true);
      boardVisible(true);
      hidePanels();
      buildConnections();
      hud.show(true);
      hud.set('a', '隐藏层 48 个神经元');
      hud.set('b', '输出层 10 类置信度');
      hud.set('x', '');
      ctl.clear();
      ctl.button({
        label: '▶ 前向传播',
        onClick: () => {
          classifyCanvas(true);
        },
      });
      ctl.sep();
      ctl.toggle({
        label: '显示输入连接', value: true,
        onChange: (v) => { if (connIH) connIH.visible = v; },
      });
      ctl.button({ label: '示例：7', onClick: () => demoDigit(7) });
      ctl.button({ label: '清空', onClick: clearBoard });
      app.setCamera([0, 0.6, 7.6], [0, 0, 0]);
    },
  },
  {
    id: 'train', title: '现场训练',
    html: `<p>训练就是<b>不断微调权重</b>：拿一批手写样本让网络猜 → 用「损失」衡量猜得多差 → 沿梯度的反方向微调所有权重（<b>梯度下降</b>）→ 重复。数千次微调后，杂乱连接会自己长出「认数字」的结构。</p>
<p>点「重置为随机」再「开始训练」，看损失曲线下降、测试准确率爬升，连接线从混沌变得有序。整个过程都发生在你的浏览器里。</p>`,
    enter() {
      neuG.visible = false;
      netVisible(true);
      boardVisible(false);
      hidePanels();
      lossBox.style.display = '';
      buildConnections();
      hud.show(true);
      hud.set('a', `轮次 ${state.epoch}`);
      hud.set('b', `测试准确率 ${(net.accuracy(DATASET.Xr, DATASET.Yr) * 100).toFixed(0)}%`);
      hud.set('x', '');
      ctl.clear();
      ctl.button({
        label: state.training ? '⏸ 暂停训练' : '▶ 开始训练',
        onClick(e) {
          state.training = !state.training;
          e.textContent = state.training ? '⏸ 暂停训练' : '▶ 开始训练';
        },
      });
      ctl.button({
        label: '重置为随机',
        onClick: () => {
          net.reset();
          state.epoch = 0; state.lossHist = [];
          buildConnections();
          drawLoss();
        },
      });
      ctl.sep();
      ctl.slider({
        label: '学习率', min: 0.05, max: 2, step: 0.05, value: state.lr,
        fmt: (v) => v.toFixed(2), onInput: (v) => { state.lr = v; },
      });
      app.setCamera([0, 0.6, 7.6], [0, 0, 0]);
      drawLoss();
    },
  },
  {
    id: 'conv', title: '卷积网络',
    html: `<p>普通网络把 256 个像素<b>摊平</b>，丢失了「相邻像素有关系」的空间信息。<b>卷积</b>换个思路：用一个 3×3 的小<b>卷积核</b>在图上滑动，每个位置做加权求和，输出一张「特征图」——它检测的是<b>局部模式</b>（边缘、转角）。</p>
<p>关键在<b>参数共享</b>：全图只用这 9 个权重，参数量骤减，而且数字写在哪儿都能被检测到。看右侧扫描演示：换不同卷积核，特征图响应完全不同。</p>`,
    enter() {
      neuG.visible = false;
      netVisible(false);
      boardVisible(true);
      hidePanels();
      convBox.style.display = '';
      state.conv.running = true; state.conv.px = 0; state.conv.py = 0;
      hud.show(false);
      ctl.clear();
      const seg = ctl.seg({
        options: KERNELS.map((k, i) => ({ label: k.name, value: i })),
        value: 0,
        onChange: (v) => { state.conv.kernelIdx = v; state.conv.px = 0; state.conv.py = 0; },
      });
      state._convSeg = seg;
      ctl.slider({
        label: '扫描速度', min: 0.5, max: 4, step: 0.5, value: 1.5,
        fmt: (v) => v.toFixed(1) + '×',
        onInput: (v) => { state.conv.speed = v; },
      });
      ctl.sep();
      ctl.toggle({
        label: '扫描', value: true,
        onChange: (v) => { state.conv.running = v; },
      });
      ctl.button({ label: '示例：0', onClick: () => demoDigit(0) });
      app.setCamera([0, 1.2, 4.6], [0, 0.2, 0]);
    },
    tick() { if (convBox.style.display !== 'none') drawConvFrame(); },
  },
  {
    id: 'mistake', title: 'AI 也会犯错',
    html: `<p>训练好的网络只认识「它见过的样子」。把数字<b>旋转</b>、<b>平移</b>、撒<b>噪点</b>——人眼轻松识别，置信度却剧烈摇摆甚至认错。这就是为什么自动驾驶要在各种光照、角度下反复训练，也是「对抗样本」攻击的原理。</p>
<p>先写个数字或点示例，再拖三个滑杆，看右侧 10 类置信度如何此消彼长。</p>`,
    enter() {
      neuG.visible = false;
      netVisible(false);
      boardVisible(true);
      hidePanels();
      confBox.style.display = '';
      hud.show(false);
      ctl.clear();
      ctl.slider({
        label: '旋转', min: -40, max: 40, step: 1, value: 0,
        fmt: (v) => v + '°',
        onInput: (v) => { state.robust.rot = v; updateRobust(); },
      });
      ctl.slider({
        label: '平移', min: -4, max: 4, step: 0.5, value: 0,
        fmt: (v) => v.toFixed(1) + ' px',
        onInput: (v) => { state.robust.shift = v; updateRobust(); },
      });
      ctl.slider({
        label: '噪点', min: 0, max: 0.6, step: 0.02, value: 0,
        fmt: (v) => Math.round(v * 100) + '%',
        onInput: (v) => { state.robust.noise = v; updateRobust(); },
      });
      ctl.sep();
      ctl.button({ label: '示例：1', onClick: () => { state.robust.digit = 1; updateRobust(); } });
      ctl.button({ label: '示例：8', onClick: () => { state.robust.digit = 8; updateRobust(); } });
      app.setCamera([0, 1.2, 4.6], [0, 0.2, 0]);
      updateRobust();
    },
  },
];

const neuronState = { w1: 1.5, w2: 1.5, b: -1.0 };

/* ---------------- 逻辑 ---------------- */

function demoDigit(d) {
  clearBoard();
  const img = renderDigit(d, Math.random);
  // 把样本还原到画板上（就近放大显示）
  const tmp = document.createElement('canvas');
  tmp.width = RES; tmp.height = RES;
  const tc = tmp.getContext('2d');
  const id = tc.createImageData(RES, RES);
  for (let i = 0; i < RES * RES; i++) {
    const g = Math.round(img[i] * 255);
    id.data[i * 4] = g; id.data[i * 4 + 1] = g; id.data[i * 4 + 2] = g; id.data[i * 4 + 3] = 255;
  }
  tc.putImageData(id, 0, 0);
  bctx.imageSmoothingEnabled = false;
  bctx.drawImage(tmp, 0, 0, 220, 220);
  boardToVec();
  classifyCanvas(true);
}

function classifyCanvas(animate) {
  const { o } = net.forward(state.canvasVec);
  let best = 0;
  o.forEach((p, i) => { if (p > o[best]) best = i; });
  hud.set('x', `识别为 ${best}（${Math.round(o[best] * 100)}%）`);
  if (animate) { state.pulseT = 0; state.pulseVec = state.canvasVec.slice(); state.pulseProbs = o; }
  if (confBox.style.display !== 'none') showConfidence(o);
  return { best, probs: o };
}

// 章 6：对样本施加旋转/平移/噪点后推理
function updateRobust() {
  const d = state.robust.digit;
  const SZ = 128;
  const cv = document.createElement('canvas');
  cv.width = SZ; cv.height = SZ;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.fillStyle = '#000'; c.fillRect(0, 0, SZ, SZ);
  c.save();
  c.translate(SZ / 2, SZ / 2);
  c.rotate(state.robust.rot * Math.PI / 180);
  c.translate(state.robust.shift * 3, state.robust.shift * 2);
  const cell = 15;
  c.fillStyle = '#fff';
  for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) {
    if (FONT[d][r][col] === '1') {
      c.beginPath(); c.arc((col - 2) * cell, (r - 3) * cell, 6.2, 0, TAU); c.fill();
    }
  }
  c.restore();
  // 噪点
  if (state.robust.noise > 0) {
    const n = state.robust.noise * 500;
    for (let i = 0; i < n; i++) {
      c.fillStyle = Math.random() > 0.5 ? '#fff' : '#333';
      c.fillRect(Math.random() * SZ, Math.random() * SZ, 3, 3);
    }
  }
  const vec = sampleCanvas(cv);
  state.canvasVec = vec;
  updateVoxels(vec);
  const { o } = net.forward(vec);
  showConfidence(o);
  let best = 0;
  o.forEach((p, i) => { if (p > o[best]) best = i; });
  hud.show(true);
  hud.set('a', `样本：${d}`);
  hud.set('b', `旋转 ${state.robust.rot}° / 噪点 ${Math.round(state.robust.noise * 100)}%`);
  hud.set('x', `识别为 ${best}（${Math.round(o[best] * 100)}%）`);
}

// 训练循环（每帧 1 轮）
function trainingTick() {
  if (!state.training) return;
  state.epoch++;
  const loss = net.trainEpoch(DATASET.X, DATASET.Y, state.lr);
  state.lossHist.push(loss);
  drawLoss();
  buildConnections();
  const acc = net.accuracy(DATASET.Xr, DATASET.Yr);
  hud.set('a', `轮次 ${state.epoch}`);
  hud.set('b', `测试准确率 ${(acc * 100).toFixed(0)}%`);
  if (state.epoch >= state.maxEpoch + 18) state.training = false;
}

/* ---------------- 启动 ---------------- */

loadAll([
  { key: 'sky', label: '环境光', job: loadHDR(TEXDIR + 'sky/sky_court-BLHJ2ADI.hdr') },
  { key: 'skyBg', label: '天空', job: loadTexture(TEXDIR + 'sky/sky_court-BKHrsJQE.webp') },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  scene.environment = t.sky;
  scene.background = t.skyBg;

  // 数据集 + 预训练（分帧进行，避免卡首屏）
  loader.setText('正在生成手写样本…');
  setTimeout(() => {
    DATASET = buildDataset();
    loader.setText('正在预训练模型…');
    let e = 0;
    const pre = () => {
      const t0 = performance.now();
      while (e < 14 && performance.now() - t0 < 30) {
        state.lossHist.push(net.trainEpoch(DATASET.X, DATASET.Y, 0.6));
        e++;
      }
      if (e < 14) requestAnimationFrame(pre);
      else {
        state.epoch = 14;
        buildConnections();
        drawLoss();
        loader.hide();
      }
    };
    pre();

    const sections = createSections({
      nav: document.getElementById('sideNav'),
      descPanel: document.getElementById('descPanel'),
      sections: SECTIONS,
      onSelect(i, sec) {
        activeSectionCleanup();
        activeSectionCleanup = () => {};
        state.training = false;
        hidePanels();
        boardVisible(false);
        netVisible(false);
        sec.enter();
      },
    });
    window.__eduSections = sections;
    sections.select(0);
  }, 30);

  app.onFrame((dt) => {
    cameraTweenTick(app, dt);
    // 体素场慢速自转（章 1/5/6 背景）
    if (voxels.visible) voxels.rotation.y += dt * 0.16;
    trainingTick();
    // 当前章节的每帧更新（像素视图 / 卷积扫描）
    if (window.__eduSections) {
      const sec = SECTIONS[window.__eduSections.buttons.findIndex((b) => b.classList.contains('active'))];
      if (sec && sec.tick) sec.tick();
    }
    // 信号传播动画
    if (state.pulseT >= 0) {
      state.pulseT += dt;
      const t = state.pulseT;
      // 输入层
      const col = new THREE.Color();
      for (let i = 0; i < RES * RES; i++) {
        const v = state.pulseVec[i];
        col.setRGB(0.10 + v * 0.92, 0.12 + v * 0.85, 0.16 + v * 0.78);
        voxels.setColorAt(i, col);
      }
      voxels.instanceColor.needsUpdate = true;
      const g1 = Math.exp(-Math.pow((t - 0.45) * 2.4, 2));
      if (t < 3.4) {
        if (t > 0.1 && t < 0.3 && !state._hidDone) {
          state._hidDone = true;
          const { h, o } = net.forward(state.pulseVec);
          state._h = h; state._o = o;
        }
        if (state._h) {
          hidMeshes.forEach((m, j) => {
            const a = state._h[j];
            const glow = 0.25 + Math.abs(a) * g1 * 1.2;
            m.material.color.setRGB(0.22 + glow * 0.5, 0.26 + glow * 0.7, 0.34 + glow * 0.6);
          });
          const g2 = Math.exp(-Math.pow((t - 0.9) * 2.2, 2));
          outMeshes.forEach((m, k) => {
            const a = state._o[k];
            const glow = 0.25 + a * g2 * 2.2;
            m.material.color.setRGB(0.22 + glow * 0.55, 0.26 + glow * 0.4, 0.34 + glow * 0.2);
          });
        }
      } else {
        state.pulseT = -1;
        state._hidDone = false;
        hidMeshes.forEach((m) => { m.material.color.setRGB(0.22, 0.26, 0.34); });
        outMeshes.forEach((m) => { m.material.color.setRGB(0.22, 0.26, 0.34); });
      }
    }
  });
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});

let activeSectionCleanup = () => {};
