/* EduLab · 振动与波（waves）— Micro 级 3D 深改
 * =====================================================================
 * 章节（原版 11 章文案块 1:1 + 自研随堂检测）：
 *   弹簧振子 / 单摆 / 简谐运动的能量 / 受迫振动与共振 / 机械波的形成 / 波的反射 /
 *   波的叠加与驻波 / 水波：干涉与衍射 / 多普勒效应 / 声音：特性与共鸣 / 自由实验 / 随堂检测
 *
 * 三栏布局：左课程大纲（12 章列表，点击切章高亮迁移）· 中波动实验台舞台 · 右详解（四手风琴）
 * 折叠体系：左右栏 28px 竖条折叠 × 五张曲线窗折叠为 40px 圆徽标 × 右栏手风琴
 *           × 专注模式（双栏同折）× 课堂模式（舞台放大 + 讲解浮层）——全部 localStorage 记忆
 *
 * 原版功能块 1:1（原版块 → 自研对应）：
 *   弹簧振子台（m/k/A + 纸带 x-t + T-√m 记录）→ 气垫导轨 + 滑块可拖拽 + 纸带窗 + 数据坞记录拟合
 *   单摆（L/θ0/星球 + 光电门测周期 + T²-L 求 g）→ 铁架台 + 黄铜摆球可拖拽 + 光电门数显 + 数据坞拟合
 *   能量（阻尼 + 能量柱 + 总能量线）→ 能量曲线窗
 *   受迫振动（驱动频率/阻尼/幅度 + 扫描 + 清除）→ 电机偏心轮 + 自动扫频 + A-f 记录表
 *   机械波（横/纵 + 频率 + 波速 + 标记质点 + 质点振动图）→ 质点列 + 波形窗
 *   波的反射（固定/自由端 + 发出脉冲）→ 绳波台数值引擎 + 端板/自由环
 *   驻波（两脉冲演示 + 频率 + 波节波腹）→ 弦枕弦钮 + 分量显示 + 两脉冲对撞 + 自动匹配
 *   水波槽（双源/单缝 + 波长/间距/缝宽 + 加强减弱线）→ 全屏 2D 水波槽
 *   多普勒（源速/源频 + 听者位置前/后/侧 + 马赫锥）→ 救护车 + 警灯 + 波前蓝红移 + 马赫锥网格
 *   声音（音调/响度/乐器 + 水位 L + 示波器 + 共鸣管）→ 音叉 + 共鸣管 + 水槽联动 + LED 声强柱
 *   自由实验（参数全开 + 端点 + 慢放）→ 自由绳台 + 连续驱动 + 慢放
 *   全局：上一章(←/,) / 下一章(→/.) / 重置视角(R) / 课堂模式 / 全屏(F) / 数据坞 + 导出 CSV
 * 自研增设：每章任务 chip（对应原版 steps 语义）/ 随堂检测 5 题 / 拖拽互动 / 信号发生器联显
 * =====================================================================
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader, createControlsPanel, makeHUD,
  makeTextSprite, makeGlowTexture,
} from './edu-core.js';
import {
  attachVFX, makeStudioEnvironment,
  matStd, matCoat, matSheen, matGlass, matGlow, PAL,
  makeWoodTexture, makeLabelTexture, fbm3,
} from './edu-vfx.js';

/* ---------------- 舞台与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建波动实验台…');

const app = createApp({
  container: stage,
  fov: 42, near: 0.05, far: 60,
  cameraPos: [0.7, 1.6, 2.6],
  target: [0, 1.05, 0],
  minDistance: 0.5, maxDistance: 12,
  exposure: 1.02,
  keepBackground: true,
});
const { scene, camera, controls } = app;
const vfx = attachVFX(app, 'illus', { bg: 'studio-warm' });
scene.environment = makeStudioEnvironment(app.renderer);

/* 光照氛围：主暖光 + 冷补光 + 半球环境（micro 同款分工） */
scene.add(new THREE.HemisphereLight(0x9db2c4, 0x1a2026, 0.55));
const keyLight = new THREE.DirectionalLight(0xfff1de, 1.25);
keyLight.position.set(3.6, 5.2, 3.2);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xd7e4f4, 0.4);
fillLight.position.set(-4.2, 3, -2.6);
scene.add(fillLight);
const bounceLight = new THREE.DirectionalLight(0xffe8d2, 0.28);
bounceLight.position.set(0.5, 1.2, -3.4);
scene.add(bounceLight);

/* ---------------- 本实验场景色板（PAL 延展：波动物理台族，仅本实验使用） ---------------- */

const C = {
  alu: 0xc3cbd4, aluDeep: 0x8d97a1, aluDark: 0x5c646e,
  steelBlue: 0x5a7fa8, accent: 0xe8674a, accentDeep: 0xc94f36,
  rubber: 0x2b2f36, chalk: 0xe8e4da,
  benchPaint: 0xdfe3e8, benchWood: 0xb98f5e, benchWoodHi: 0xdcb888,
  brass: PAL.brass, steel: PAL.steel, ink: PAL.ink, paper: PAL.paper,
  glassBlue: 0xb9d2e2, water: 0x4f8fb8, waterDeep: 0x2c5f83,
  led: 0x8fffc8, ledOff: 0x24352c, screen: 0x101821,
  roadAsphalt: 0x3a3f46, roadLine: 0xd8d2be,
  ambBody: 0xf2f3f0, ambStripe: 0xe0523f, vest: 0xe08a3c, skin: 0xd8a888,
  beaconR: 0xff3b30, beaconB: 0x2f6bff,
  felt: 0x2e4652, walnut: 0x6e4b2e,
};

/* ---------------- 工艺基建（程序化纹理 / 倒角盒 / 接触阴影） ---------------- */

const canvasTex = (w, h, draw, opts = {}) => {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  if (!opts.linear) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

/* 接触阴影贴片：道具落台的重量感来源 */
function shadowPatch(w, d, opacity = 0.34) {
  const tex = canvasTex(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, 'rgba(16,12,8,' + opacity + ')');
    g.addColorStop(0.6, 'rgba(16,12,8,' + opacity * 0.5 + ')');
    g.addColorStop(1, 'rgba(16,12,8,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }, { linear: true });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

/* 圆角盒：w×d 水平截面画圆角矩形，沿竖直方向挤出 h（签名：宽, 高, 深, 圆角） */
function roundedBoxGeo(w, h, d, r, bevel = 0.012, curveSeg = 6) {
  r = Math.max(0.001, Math.min(r, w / 2 - 0.002, d / 2 - 0.002));
  const bl = Math.min(bevel, h * 0.35);
  const s = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(h - bl * 2, 0.002), bevelEnabled: bl > 0.001, bevelThickness: bl,
    bevelSize: Math.min(bl, r * 0.8), bevelSegments: 2, curveSegments: curveSeg,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  return geo;
}
function roundedBox(w, h, d, r, mat) {
  return new THREE.Mesh(roundedBoxGeo(w, h, d, r), mat);
}

/* 滚花圆柱（调节钮 / 张紧螺栓的防滑纹） */
function knurlTexture(base = '#8d97a1', line = 'rgba(30,36,44,0.55)') {
  return canvasTex(128, 64, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 128, 64);
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    for (let i = -64; i < 128; i += 10) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 24, 64); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i + 24, 0); ctx.lineTo(i, 64); ctx.stroke();
    }
  });
}
function knurledCyl(rt, rb, h, mat, tex) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 20), mat.clone());
  if (tex) {
    m.material.map = tex;
    m.material.color.set(0xffffff);
    m.material.roughness = Math.max(m.material.roughness, 0.5);
  }
  return m;
}

/* 金属端盖（轴头 / 螺栓帽的倒角层次） */
function capDisc(r, t, mat, seg = 20) {
  const g = new THREE.CylinderGeometry(r, r * 0.92, t, seg);
  return new THREE.Mesh(g, mat);
}

/* 米白色烤漆 + 木纹 + 橡胶 + 黄铜 —— 四级材质分工在本实验的落位 */
const M = {
  paint: matCoat(C.benchPaint, { roughness: 0.4 }),
  paintDeep: matCoat(0x9aa3ad, { roughness: 0.46 }),
  alu: matCoat(C.alu, { roughness: 0.32, metalness: 0.82, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
  aluDark: matStd(C.aluDark, { roughness: 0.42, metalness: 0.78 }),
  steelBlue: matCoat(C.steelBlue, { roughness: 0.34, metalness: 0.1 }),
  accent: matCoat(C.accent, { roughness: 0.4, metalness: 0.06 }),
  rubber: matStd(C.rubber, { roughness: 0.92, metalness: 0 }),
  brass: matStd(C.brass, { roughness: 0.3, metalness: 0.88 }),
  brassHi: matStd(0xd8b86a, { roughness: 0.24, metalness: 0.9 }),
  steel: matStd(C.steel, { roughness: 0.34, metalness: 0.85 }),
  steelDark: matStd(0x49505a, { roughness: 0.4, metalness: 0.8 }),
  wood: matStd(C.benchWood, { roughness: 0.62 }),
  walnut: matStd(C.walnut, { roughness: 0.6 }),
  chalk: matStd(C.chalk, { roughness: 0.8 }),
  glass: matGlass(C.glassBlue, { opacity: 0.2 }),
  screenOff: matStd(C.screen, { roughness: 0.28, metalness: 0.1 }),
  ledOn: matGlow(C.led, 0.85),
  beaconR: matGlow(C.beaconR, 1.4),
  beaconB: matGlow(C.beaconB, 1.4),
};
M.woodTex = makeWoodTexture({ base: '#a97e4e', dark: '#7a5834', light: '#d3a86e', streaks: 26, seed: 71 });
M.woodMat = matStd(0xffffff, { roughness: 0.6, metalness: 0.04 });
M.woodMat.map = M.woodTex;
M.walnutTex = makeWoodTexture({ base: '#6e4b2e', dark: '#4b3118', light: '#93683d', streaks: 18, bands: 3, seed: 33 });
M.walnutMat = matStd(0xffffff, { roughness: 0.58 });
M.walnutMat.map = M.walnutTex;

/* ---------------- 实验室环境（地面 / 墙面 / 实验台 + 道具阵列） ---------------- */

const worldG = new THREE.Group();
scene.add(worldG);

const BENCH_Y = 0.9;
const TRACK_Y = 1.0;
const STR_Y = 1.02;

function texFloorTiles() {
  return canvasTex(512, 512, (ctx) => {
    ctx.fillStyle = '#b6bcc2';
    ctx.fillRect(0, 0, 512, 512);
    const n = 4, s = 512 / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const g = 176 + ((i + j) % 2) * 10 + (fbm3(i * 3.1, j * 2.7, 0, 5) * 10);
        ctx.fillStyle = `rgb(${g | 0},${(g + 3) | 0},${(g + 7) | 0})`;
        ctx.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      }
    }
    ctx.fillStyle = 'rgba(70,78,88,0.55)';
    for (let i = 0; i <= n; i++) {
      ctx.fillRect(i * s - 1.5, 0, 3, 512);
      ctx.fillRect(0, i * s - 1.5, 512, 3);
    }
    for (let k = 0; k < 900; k++) {
      const a = fbm3(k * 0.37, k * 1.13, 2, 9);
      ctx.fillStyle = a > 0.45 ? 'rgba(255,255,255,0.05)' : 'rgba(30,34,40,0.05)';
      const x = (Math.abs(Math.sin(k * 12.9898)) * 512) | 0;
      const y = (Math.abs(Math.sin(k * 78.233)) * 512) | 0;
      ctx.fillRect(x, y, 2, 2);
    }
  });
}
function texWallPaint() {
  return canvasTex(512, 256, (ctx) => {
    ctx.fillStyle = '#d5dade';
    ctx.fillRect(0, 0, 512, 256);
    for (let k = 0; k < 500; k++) {
      const v = fbm3(k * 0.21, k * 0.53, 1, 4) * 10;
      ctx.fillStyle = `rgba(120,130,140,${0.03 + v * 0.004})`;
      const x = (Math.abs(Math.sin(k * 3.7)) * 512) | 0;
      const y = (Math.abs(Math.sin(k * 9.1)) * 256) | 0;
      ctx.fillRect(x, y, 3, 2);
    }
    /* 墙裙线与踢脚 */
    ctx.fillStyle = 'rgba(96,108,120,0.5)';
    ctx.fillRect(0, 196, 512, 3);
    ctx.fillStyle = '#9aa4ae';
    ctx.fillRect(0, 236, 512, 20);
    ctx.fillStyle = 'rgba(60,68,78,0.35)';
    ctx.fillRect(0, 236, 512, 3);
  });
}
/* 黑板条：粉笔写的波形示意（装饰，公式不涉教学文案） */
function texChalkBoard() {
  return canvasTex(1024, 300, (ctx) => {
    ctx.fillStyle = '#2c3e3a';
    ctx.fillRect(0, 0, 1024, 300);
    for (let k = 0; k < 2400; k++) {
      ctx.fillStyle = `rgba(220,228,220,${0.012 + fbm3(k * 0.11, 3, 7, 2) * 0.02})`;
      const x = (Math.abs(Math.sin(k * 5.31)) * 1024) | 0;
      const y = (Math.abs(Math.sin(k * 2.17)) * 300) | 0;
      ctx.fillRect(x, y, 1.6, 1.2);
    }
    ctx.strokeStyle = 'rgba(235,238,230,0.75)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let x = 40; x < 400; x += 2) {
      const y = 150 - Math.sin((x - 40) / 34) * 58 * Math.exp(-(x - 40) / 330);
      x === 40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(240,228,180,0.7)';
    ctx.beginPath();
    for (let x = 470; x < 960; x += 2) {
      const y = 130 + Math.sin((x - 470) / 40) * 62;
      x === 470 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let x = 470; x < 960; x += 2) {
      const y = 210 + Math.sin((x - 470) / 40 + Math.PI) * 62;
      x === 470 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(235,238,230,0.8)';
    ctx.font = 'italic 30px Georgia, serif';
    ctx.fillText('λ', 430, 160);
    ctx.fillStyle = 'rgba(240,228,180,0.75)';
    ctx.font = '26px Georgia, serif';
    ctx.fillText('T', 985, 120);
  });
}
/* 2m 标尺（气垫导轨前沿贴尺） */
function texRuler2m() {
  return canvasTex(2048, 40, (ctx) => {
    ctx.fillStyle = '#f2f4f8';
    ctx.fillRect(0, 0, 2048, 40);
    ctx.strokeStyle = '#3a4250';
    ctx.fillStyle = '#3a4250';
    for (let i = 0; i <= 200; i++) {
      const px = 8 + i * ((2048 - 16) / 200);
      const major = i % 10 === 0, mid = i % 5 === 0;
      const h = major ? 22 : mid ? 15 : 9;
      ctx.lineWidth = major ? 3 : 2;
      ctx.beginPath(); ctx.moveTo(px, 4); ctx.lineTo(px, 4 + h); ctx.stroke();
      if (major) {
        ctx.font = '600 17px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((i / 10).toFixed(0), px, 38);
      }
    }
  });
}
/* 量角器盘（±70° 刻度 + 数字） */
function texProtractor() {
  const S = 512;
  return canvasTex(S, S, (ctx) => {
    ctx.fillStyle = '#ddd7c6';
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2 - 4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#8a94a4';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 10, 0, TAU); ctx.stroke();
    const cx = S / 2, cy = S / 2, R = S / 2 - 14;
    for (let a = -180; a < 180; a += 2) {
      const rad = (a - 90) * Math.PI / 180;
      const major = a % 10 === 0;
      const r1 = R, r2 = R - (major ? 30 : a % 5 === 0 ? 18 : 10);
      ctx.strokeStyle = major ? '#3a4250' : '#9aa3ae';
      ctx.lineWidth = major ? 3 : 1.6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * r1, cy + Math.sin(rad) * r1);
      ctx.lineTo(cx + Math.cos(rad) * r2, cy + Math.sin(rad) * r2);
      ctx.stroke();
      if (major && a >= -70 && a <= 70 && a !== 0) {
        ctx.fillStyle = '#3a4250';
        ctx.font = '600 22px sans-serif';
        ctx.textAlign = 'center';
        const rl = (a - 90) * Math.PI / 180;
        ctx.fillText(String(Math.abs(a)), cx + Math.cos(rl) * (R - 52), cy + Math.sin(rl) * (R - 52) + 8);
      }
    }
    ctx.strokeStyle = '#c9402e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 6); ctx.lineTo(cx, cy - R + 20);
    ctx.stroke();
  });
}
/* 光电门数显（实时刷新） */
const gateDisp = { cv: document.createElement('canvas'), tex: null, last: '' };
gateDisp.cv.width = 256; gateDisp.cv.height = 96;
function gateDisplayDraw(txt) {
  if (gateDisp.last === txt) return;
  gateDisp.last = txt;
  const ctx = gateDisp.cv.getContext('2d');
  ctx.fillStyle = '#0d141c';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = 'rgba(140,180,160,0.35)';
  ctx.strokeRect(4, 4, 248, 88);
  ctx.fillStyle = '#8fffc8';
  ctx.font = '600 44px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(txt, 128, 62);
  if (gateDisp.tex) gateDisp.tex.needsUpdate = true;
}
gateDisp.tex = new THREE.CanvasTexture(gateDisp.cv);
gateDisp.tex.colorSpace = THREE.SRGBColorSpace;
/* 信号发生器面板（底板静态 + 数字窗动态） */
function texGenPanel() {
  return canvasTex(512, 256, (ctx) => {
    ctx.fillStyle = '#dfe3e8';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#aab2bb';
    ctx.fillRect(0, 0, 512, 44);
    ctx.fillStyle = '#3a4250';
    ctx.font = '700 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WG-1 型 函数信号发生器', 20, 32);
    ctx.fillStyle = '#0d141c';
    ctx.fillRect(20, 64, 240, 64);
    ctx.fillStyle = '#8fffc8';
    ctx.font = '600 40px ui-monospace, Menlo, monospace';
    ctx.fillText('0.90 Hz', 130, 110);
    for (const kx of [310, 400]) {
      ctx.fillStyle = '#49505a';
      ctx.beginPath(); ctx.arc(kx, 96, 26, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#dfe3e8';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(kx, 96); ctx.lineTo(kx + 16, 78); ctx.stroke();
      for (let i = 0; i < 11; i++) {
        const a = -Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
        ctx.beginPath();
        ctx.moveTo(kx + Math.cos(a) * 32, 96 + Math.sin(a) * 32);
        ctx.lineTo(kx + Math.cos(a) * 38, 96 + Math.sin(a) * 38);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#6a7480';
    ctx.font = '600 17px sans-serif';
    ctx.fillText('频率', 296, 152);
    ctx.fillText('幅度', 388, 152);
    ctx.strokeStyle = '#9aa4ae';
    ctx.strokeRect(20, 150, 472, 86);
    ctx.fillStyle = '#8a94a4';
    ctx.font = '15px sans-serif';
    ctx.fillText('正弦 □  方波 □  三角 □   输出：50Ω', 30, 178);
    ctx.fillText('电源 ⏻   同步输出   计数', 30, 216);
  });
}
/* 信号发生器数字窗（动态刷新层，贴在面板数字区上） */
const genDisp = { cv: document.createElement('canvas'), tex: null, last: '' };
genDisp.cv.width = 192; genDisp.cv.height = 48;
function genDisplayDraw(txt) {
  if (genDisp.last === txt) return;
  genDisp.last = txt;
  const ctx = genDisp.cv.getContext('2d');
  ctx.fillStyle = '#0d141c';
  ctx.fillRect(0, 0, 192, 48);
  ctx.fillStyle = '#8fffc8';
  ctx.font = '600 30px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(txt, 96, 34);
  if (genDisp.tex) genDisp.tex.needsUpdate = true;
}
genDisp.tex = new THREE.CanvasTexture(genDisp.cv);
genDisp.tex.colorSpace = THREE.SRGBColorSpace;
/* 秒表盘面 */
function texWatchFace() {
  const S = 256;
  return canvasTex(S, S, (ctx) => {
    ctx.fillStyle = '#e8eaee';
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a4250'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 10, 0, TAU); ctx.stroke();
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU - Math.PI / 2;
      const major = i % 5 === 0;
      ctx.strokeStyle = major ? '#3a4250' : '#9aa3ae';
      ctx.lineWidth = major ? 4 : 2;
      const r1 = S / 2 - 18, r2 = r1 - (major ? 22 : 11);
      ctx.beginPath();
      ctx.moveTo(S / 2 + Math.cos(a) * r1, S / 2 + Math.sin(a) * r1);
      ctx.lineTo(S / 2 + Math.cos(a) * r2, S / 2 + Math.sin(a) * r2);
      ctx.stroke();
    }
    ctx.fillStyle = '#3a4250';
    ctx.font = '600 26px sans-serif';
    ctx.textAlign = 'center';
    for (const [i, t] of [[1, '10'], [2, '20'], [3, '30'], [4, '40'], [5, '50'], [6, '60']]) {
      const a = (i / 6) * TAU - Math.PI / 2;
      ctx.fillText(t, S / 2 + Math.cos(a) * (S / 2 - 62), S / 2 + Math.sin(a) * (S / 2 - 62) + 9);
    }
    ctx.fillStyle = '#c9402e';
    ctx.beginPath(); ctx.arc(S / 2, S / 2, 10, 0, TAU); ctx.fill();
  });
}
/* 共鸣管刻度带（0-100 cm，套在玻璃管外） */
function texTubeScale() {
  return canvasTex(1024, 128, (ctx) => {
    ctx.clearRect(0, 0, 1024, 128);
    ctx.fillStyle = 'rgba(244,242,234,0.85)';
    ctx.fillRect(0, 30, 1024, 68);
    ctx.strokeStyle = '#3a4250';
    ctx.fillStyle = '#3a4250';
    for (let i = 0; i <= 100; i += 1) {
      const px = 20 + i * ((1024 - 40) / 100);
      const major = i % 10 === 0, mid = i % 5 === 0;
      const h = major ? 34 : mid ? 22 : 12;
      ctx.lineWidth = major ? 3 : 1.6;
      ctx.beginPath(); ctx.moveTo(px, 40); ctx.lineTo(px, 40 + h); ctx.stroke();
      if (major) {
        ctx.font = '600 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i), px, 96);
      }
    }
    ctx.font = 'italic 600 18px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('cm', 960, 30);
  });
}
/* 音叉共鸣箱标签 */
function texForkBoxLabel() {
  return makeLabelTexture([
    ['音叉 440 Hz', 30],
    ['共鸣箱 · A 调', 17],
  ], { paper: '#f2efe6', ink: '#3a3226', border: '#b99f6d', pad: 16 });
}
/* 钩码盒标签 */
function texWeightBoxLabel() {
  return makeLabelTexture([
    ['钩码 · 50 g × 10', 26],
    ['WAVE-LAB 器材', 15],
  ], { paper: '#eee9dc', ink: '#33405a', border: '#8a94a4', pad: 14 });
}
/* 救护车侧面条（编号 + 急救标识，自绘） */
function texAmbulanceSide() {
  return canvasTex(512, 128, (ctx) => {
    ctx.fillStyle = '#f2f3f0';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#e0523f';
    ctx.fillRect(0, 86, 512, 22);
    ctx.fillStyle = '#c2392b';
    ctx.beginPath(); ctx.arc(150, 52, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(144, 40, 12, 24);
    ctx.fillRect(138, 46, 24, 12);
    ctx.fillStyle = '#3a4250';
    ctx.font = '700 30px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('WLB · 07 急救出勤', 200, 62);
    ctx.font = '600 15px sans-serif';
    ctx.fillStyle = '#8a94a4';
    ctx.fillText('仿真道具 · EduLab', 200, 82);
  });
}
/* 道路沥青（中线虚线 + 磨损噪点） */
function texRoad() {
  return canvasTex(512, 256, (ctx) => {
    ctx.fillStyle = '#3a3f46';
    ctx.fillRect(0, 0, 512, 256);
    for (let k = 0; k < 2600; k++) {
      const v = fbm3(k * 0.13, k * 0.71, 4, 8);
      ctx.fillStyle = v > 0.4 ? 'rgba(190,196,204,0.07)' : 'rgba(12,14,18,0.16)';
      const x = (Math.abs(Math.sin(k * 12.9)) * 512) | 0;
      const y = (Math.abs(Math.sin(k * 3.77)) * 256) | 0;
      ctx.fillRect(x, y, 2.4, 1.8);
    }
    ctx.fillStyle = '#d8d2be';
    for (let x = 20; x < 512; x += 84) ctx.fillRect(x, 120, 46, 8);
    ctx.fillStyle = 'rgba(216,210,190,0.5)';
    ctx.fillRect(0, 6, 512, 4);
    ctx.fillRect(0, 246, 512, 4);
  });
}
/* 后墙波形海报（装饰） */
function texWavePoster() {
  return canvasTex(512, 384, (ctx) => {
    ctx.fillStyle = '#f4f1e8';
    ctx.fillRect(0, 0, 512, 384);
    ctx.strokeStyle = '#c9402e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 30; x < 482; x += 2) {
      const y = 110 + Math.sin((x - 30) / 36) * 52;
      x === 30 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#3a6ea8';
    ctx.beginPath();
    for (let x = 30; x < 482; x += 2) {
      const y = 250 - Math.sin((x - 30) / 22) * 66 * Math.exp(-(((x - 30) / 460) ** 2) * 2);
      x === 30 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#8a8272';
    ctx.font = '600 20px sans-serif';
    ctx.fillText('y = A sin(ωt − kx)', 150, 340);
  });
}

const pbr = {};
function buildWorld() {
  /* 地面：程序化方砖 */
  pbr.floorTex = texFloorTiles();
  pbr.floorTex.wrapS = pbr.floorTex.wrapT = THREE.RepeatWrapping;
  pbr.floorTex.repeat.set(7, 5);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), matStd(0xffffff, { roughness: 0.85, metalness: 0.04 }));
  floor.material.map = pbr.floorTex;
  floor.rotation.x = -Math.PI / 2;
  worldG.add(floor);
  floor.receiveShadow = true;

  /* 墙面：程序化墙裙 + 黑板条 + 海报 */
  pbr.wallTex = texWallPaint();
  pbr.wallTex.wrapS = pbr.wallTex.wrapT = THREE.RepeatWrapping;
  pbr.wallTex.repeat.set(4, 1);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), matStd(0xffffff, { roughness: 0.9 }));
  wall.material.map = pbr.wallTex;
  wall.position.set(0, 2.5, -2.4);
  worldG.add(wall);
  const board = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 0.03), matStd(0xffffff, { roughness: 0.85 }));
  board.material.map = texChalkBoard();
  board.position.set(-1.1, 2.35, -2.36);
  worldG.add(board);
  const boardFrame = new THREE.Mesh(roundedBoxGeo(3.5, 1.1, 0.04, 0.045), M.walnutMat);
  boardFrame.position.set(-1.1, 2.35, -2.38);
  worldG.add(boardFrame);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.54), matStd(0xffffff, { roughness: 0.9 }));
  poster.material.map = texWavePoster();
  poster.position.set(1.45, 2.3, -2.37);
  worldG.add(poster);
  const posterFrame = new THREE.Mesh(roundedBoxGeo(0.78, 0.6, 0.02, 0.03), M.aluDark);
  posterFrame.position.set(1.45, 2.3, -2.39);
  worldG.add(posterFrame);

  /* 实验台：柜体（烤漆）+ 木台面（程序化木纹）+ 金属包边 + 抽屉 + 铭牌 */
  const bodyMat = M.paint.clone();
  const benchBody = new THREE.Mesh(roundedBoxGeo(5.4, 0.8, 1.3, 0.05), bodyMat);
  benchBody.position.set(0, 0.44, -0.15);
  worldG.add(benchBody);
  const drawerSeamMat = matStd(0x9aa3ad, { roughness: 0.5, metalness: 0.4 });
  for (const dx of [-1.35, 1.35]) {
    for (const dy of [0.24, 0.6]) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.3, 0.012), drawerSeamMat);
      seam.position.set(dx, dy, 0.505);
      worldG.add(seam);
    }
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 12), M.steel);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(dx, 0.42, 0.52);
    worldG.add(handle);
    for (const hx of [dx - 0.22, dx + 0.22]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.03, 12), M.steel);
      post.rotation.x = Math.PI / 2;
      post.position.set(hx, 0.42, 0.515);
      worldG.add(post);
    }
  }
  const woodTop = new THREE.Mesh(new THREE.BoxGeometry(5.44, 0.05, 1.42), M.woodMat);
  woodTop.position.set(0, 0.875, -0.15);
  woodTop.receiveShadow = true;
  worldG.add(woodTop);
  for (const ez of [-0.845, 0.545]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(5.44, 0.052, 0.022), M.alu);
    edge.position.set(0, 0.875, ez);
    worldG.add(edge);
  }
  const namePlate = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.012), M.brass);
  namePlate.position.set(0, 0.62, 0.512);
  worldG.add(namePlate);
  const plateTex = makeLabelTexture([['WaveLab · 波动台', 17], ['EDULAB 物理系列', 11]],
    { paper: '#e9dcba', ink: '#5a4620', border: '#a8895a', pad: 8 });
  const plateFace = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.088), new THREE.MeshBasicMaterial({ map: plateTex }));
  plateFace.position.set(0, 0.62, 0.5195);
  worldG.add(plateFace);
  for (const lx of [-2.5, -0.85, 0.85, 2.5]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.12, 14), M.steelDark);
    leg.position.set(lx, 0.06, -0.15);
    worldG.add(leg);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.018, 14), M.rubber);
    foot.position.set(lx, 0.01, -0.15);
    worldG.add(foot);
  }
  const benchShadow = shadowPatch(6.4, 2.2, 0.4);
  benchShadow.position.set(0, 0.002, -0.15);
  worldG.add(benchShadow);

  buildProps();
}

/* ---------------- 台面道具阵列（钩码盒 / 砝码 / 线轴 / 信号发生器 / 秒表 / 米尺） ---------------- */

const props = {};
function slottedWeight(r, h, mat, slotW = 0.014) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.06, h, 20), mat);
  g.add(body);
  const knob = new THREE.Mesh(new THREE.TorusGeometry(r * 0.42, r * 0.2, 10, 18), mat);
  knob.position.y = h / 2 + r * 0.16;
  g.add(knob);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(slotW, h * 0.72, r * 2.2), M.screenOff);
  slot.position.y = -h * 0.08;
  g.add(slot);
  return g;
}
function buildProps() {
  const pg = new THREE.Group();
  worldG.add(pg);
  props.group = pg;

  /* 钩码盒（开口木盒 + 内衬 + 四只钩码 + 标签） */
  const boxG = new THREE.Group();
  const bw = 0.34, bd = 0.22, bh = 0.09;
  const wallMat = M.woodMat;
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.012, bd), wallMat);
  const wL = new THREE.Mesh(new THREE.BoxGeometry(0.012, bh, bd), wallMat);
  const wR = new THREE.Mesh(new THREE.BoxGeometry(0.012, bh, bd), wallMat);
  const wB = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.012), wallMat);
  const wF = new THREE.Mesh(new THREE.BoxGeometry(bw, bh * 0.6, 0.012), wallMat);
  wL.position.set(-bw / 2, bh / 2, 0);
  wR.position.set(bw / 2, bh / 2, 0);
  wB.position.set(0, bh / 2, -bd / 2);
  wF.position.set(0, bh * 0.3, bd / 2);
  boxG.add(bottom, wL, wR, wB, wF);
  for (let i = 0; i < 4; i++) {
    const w = slottedWeight(0.028, 0.036, M.steel);
    w.position.set(-0.105 + (i % 2) * 0.21, 0.03, -0.05 + Math.floor(i / 2) * 0.1);
    boxG.add(w);
  }
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.05), new THREE.MeshBasicMaterial({ map: texWeightBoxLabel() }));
  label.position.set(0, bh * 0.3, bd / 2 + 0.002);
  boxG.add(label);
  boxG.position.set(-2.28, BENCH_Y + 0.006, 0.1);
  boxG.rotation.y = 0.16;
  pg.add(boxG);
  const boxShadow = shadowPatch(0.44, 0.3, 0.3);
  boxShadow.position.set(-2.28, BENCH_Y + 0.003, 0.1);
  pg.add(boxShadow);

  /* 砝码组（三只叠放在小托盘上） */
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.014, 22), M.aluDark);
  const ws = new THREE.Group();
  ws.add(tray);
  const w1 = slottedWeight(0.036, 0.04, M.steelDark);
  const w2 = slottedWeight(0.03, 0.034, M.steel);
  const w3 = slottedWeight(0.024, 0.03, M.brass);
  w1.position.y = 0.03; w2.position.y = 0.086; w3.position.y = 0.134;
  ws.add(w1, w2, w3);
  ws.position.set(-1.95, BENCH_Y + 0.007, 0.34);
  pg.add(ws);
  const wsShadow = shadowPatch(0.24, 0.24, 0.28);
  wsShadow.position.set(-1.95, BENCH_Y + 0.003, 0.34);
  pg.add(wsShadow);

  /* 线轴（绕绳） */
  const spool = new THREE.Group();
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 14), M.walnutMat);
  const dA = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.014, 22), M.walnutMat);
  const dB = dA.clone();
  dA.position.y = 0.055; dB.position.y = -0.055;
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.086, 20), matStd(0xd8d2b8, { roughness: 0.9 }));
  spool.add(core, dA, dB, thread);
  spool.rotation.z = Math.PI / 2;
  spool.position.set(-1.62, BENCH_Y + 0.052, 0.3);
  spool.rotation.y = 0.5;
  pg.add(spool);
  const spoolShadow = shadowPatch(0.16, 0.16, 0.22);
  spoolShadow.position.set(-1.62, BENCH_Y + 0.003, 0.3);
  pg.add(spoolShadow);

  /* 信号发生器（面板 + 动态数字窗 + 旋钮 + 支脚） */
  const gen = new THREE.Group();
  const genBody = new THREE.Mesh(roundedBoxGeo(0.42, 0.2, 0.24, 0.03), M.paintDeep);
  genBody.position.y = 0.1;
  gen.add(genBody);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.19), new THREE.MeshStandardMaterial({ map: texGenPanel(), roughness: 0.5 }));
  panel.rotation.y = Math.PI / 2;
  panel.position.set(0.121, 0.1, 0);
  gen.add(panel);
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.024), new THREE.MeshBasicMaterial({ map: genDisp.tex }));
  disp.rotation.y = Math.PI / 2;
  disp.position.set(0.1215, 0.136, -0.055);
  gen.add(disp);
  for (const kz of [-0.05, 0.03]) {
    const knob = knurledCyl(0.024, 0.024, 0.02, M.aluDark, knurlTexture('#6a7480'));
    knob.rotation.z = Math.PI / 2;
    knob.position.set(0.128, 0.12, kz);
    gen.add(knob);
  }
  for (const fx of [-0.17, 0.17]) {
    for (const fz of [-0.09, 0.09]) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.014, 10), M.rubber);
      foot.position.set(fx, 0.007, fz);
      gen.add(foot);
    }
  }
  const bnc = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.014, 10), M.steel);
  bnc.rotation.x = Math.PI / 2;
  bnc.position.set(0.125, 0.05, 0.075);
  gen.add(bnc);
  gen.position.set(2.05, BENCH_Y + 0.001, 0.18);
  gen.rotation.y = -0.35;
  pg.add(gen);
  props.sigGen = gen;
  const genShadow = shadowPatch(0.56, 0.36, 0.34);
  genShadow.position.set(2.05, BENCH_Y + 0.003, 0.18);
  pg.add(genShadow);

  /* 电源线：从机身弯到台沿 */
  const cordPts = [
    new THREE.Vector3(2.05, BENCH_Y + 0.03, 0.02),
    new THREE.Vector3(2.16, BENCH_Y + 0.004, -0.12),
    new THREE.Vector3(2.34, BENCH_Y + 0.004, -0.42),
    new THREE.Vector3(2.5, BENCH_Y + 0.004, -0.6),
  ];
  const cord = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPts), 32, 0.006, 8, false),
    M.rubber
  );
  pg.add(cord);

  /* 秒表（盘面 + 动秒针 + 顶钮） */
  const watch = new THREE.Group();
  const caseM = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.048, 0.02, 24), M.steel);
  caseM.rotation.x = Math.PI / 2;
  caseM.rotation.z = Math.PI / 2;
  watch.add(caseM);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.037, 28), new THREE.MeshBasicMaterial({ map: texWatchFace() }));
  face.rotation.y = Math.PI / 2;
  face.rotation.z = -Math.PI / 2;
  face.position.x = 0.0115;
  watch.add(face);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.03, 0.0035), new THREE.MeshBasicMaterial({ color: 0xc9402e }));
  needle.geometry.translate(0, 0.013, 0);
  needle.rotation.y = Math.PI / 2;
  needle.position.x = 0.0125;
  watch.add(needle);
  props.watchNeedle = needle;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 10), M.steel);
  crown.position.set(0, 0.052, 0);
  watch.add(crown);
  for (const sx of [-0.03, 0.03]) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.01, 10), M.steel);
    btn.position.set(sx, 0.043, 0.032);
    btn.rotation.x = 0.5;
    watch.add(btn);
  }
  watch.position.set(1.62, BENCH_Y + 0.026, 0.3);
  watch.rotation.y = 0.4;
  pg.add(watch);
  const watchShadow = shadowPatch(0.14, 0.14, 0.2);
  watchShadow.position.set(1.62, BENCH_Y + 0.003, 0.3);
  pg.add(watchShadow);

  /* 米尺（平放） */
  const ruler = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.008, 0.035), M.chalk);
  const rulerTex = canvasTex(1024, 40, (ctx) => {
    ctx.fillStyle = '#eef0e6';
    ctx.fillRect(0, 0, 1024, 40);
    ctx.strokeStyle = '#5a4636';
    ctx.fillStyle = '#5a4636';
    for (let i = 0; i <= 100; i++) {
      const px = 10 + i * ((1024 - 20) / 100);
      const major = i % 10 === 0;
      ctx.lineWidth = major ? 3 : 1.5;
      ctx.beginPath(); ctx.moveTo(px, 4); ctx.lineTo(px, 4 + (major ? 22 : 12)); ctx.stroke();
      if (major) {
        ctx.font = '600 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i), px, 38);
      }
    }
  });
  const rulerTop = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.035), new THREE.MeshBasicMaterial({ map: rulerTex }));
  rulerTop.rotation.x = -Math.PI / 2;
  rulerTop.position.y = 0.0045;
  const rulerG = new THREE.Group();
  rulerG.add(ruler, rulerTop);
  rulerG.position.set(-0.85, BENCH_Y + 0.004, 0.4);
  rulerG.rotation.y = -0.1;
  pg.add(rulerG);
  const rulerShadow = shadowPatch(1.1, 0.1, 0.16);
  rulerShadow.position.set(-0.85, BENCH_Y + 0.003, 0.4);
  pg.add(rulerShadow);
}

/* ---------------- 建模与物理工具（弹簧放样 / 绳曲线 / 数值引擎） ---------------- */

function stdMat(opts) { return matStd(0xffffff, opts); }
function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }
function cyl(rt, rb, h, mat, seg = 16) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); }

/** 沿 x 轴的螺旋线（水平弹簧） */
function helixX(x0, x1, y, r, coils) {
  const c = new THREE.Curve();
  c.getPoint = (u) => new THREE.Vector3(
    x0 + (x1 - x0) * u,
    y + Math.cos(u * coils * TAU) * r,
    Math.sin(u * coils * TAU) * r
  );
  return c;
}
/** 沿 y 轴的螺旋线（竖直弹簧） */
function helixY(y0, y1, x, r, coils) {
  const c = new THREE.Curve();
  c.getPoint = (u) => new THREE.Vector3(
    x + Math.cos(u * coils * TAU) * r,
    y0 + (y1 - y0) * u,
    Math.sin(u * coils * TAU) * r
  );
  return c;
}
/** 每帧重建 TubeGeometry（先 dispose 旧几何防泄漏） */
function rebuildTube(mesh, curve, tub, rad, radius) {
  const old = mesh.geometry;
  mesh.geometry = new THREE.TubeGeometry(curve, tub, radius, rad, false);
  if (old) old.dispose();
}
/** 沿一排采样点的绳（CatmullRom） */
function stringCurve(pts) {
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.4);
}

const springMat = stdMat({ color: 0xc7ced6, roughness: 0.32, metalness: 0.85 });

/* ================= 第一/三章 · 弹簧振子台（气垫导轨深改） ================= */

const stSpring = {
  group: new THREE.Group(), playing: true, dragging: false, dragX: 0,
  A: 0.18, m: 0.8, k: 24, gamma: 0, phase: 0, tEnv: 0,
  x: 0, v: 0, tape: [], tapeAcc: 0, eHist: [], eAcc: 0,
};
scene.add(stSpring.group);

let S = {};
function buildSpring() {
  const g = stSpring.group;
  /* 导轨主体：圆角铝型材 + 顶面气孔排 + 两端橡胶缓冲 */
  const railMat = M.alu;
  const rail = new THREE.Mesh(roundedBoxGeo(2.3, 0.055, 0.1, 0.02), railMat);
  rail.position.set(0, 0.945, 0);
  const holeTex = canvasTex(1024, 64, (ctx) => {
    ctx.fillStyle = '#c3cbd4';
    ctx.fillRect(0, 0, 1024, 64);
    ctx.fillStyle = '#5c646e';
    for (let i = 0; i < 46; i++) {
      const px = 14 + i * 22;
      ctx.beginPath(); ctx.arc(px, 32, 3.2, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(px - 1, 30.6, 1.1, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5c646e';
    }
  });
  const holeStrip = new THREE.Mesh(new THREE.PlaneGeometry(2.26, 0.045), new THREE.MeshStandardMaterial({ map: holeTex, roughness: 0.4, metalness: 0.6 }));
  holeStrip.rotation.x = -Math.PI / 2;
  holeStrip.position.set(0, 0.9735, 0);
  g.add(rail, holeStrip);
  /* 支腿 + 底脚 */
  for (const lx of [-0.9, 0.9]) {
    const leg = new THREE.Mesh(roundedBoxGeo(0.07, 0.06, 0.1, 0.025), M.aluDark);
    leg.position.set(lx, 0.912, 0);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.012, 12), M.rubber);
    foot.position.set(lx, 0.906, 0);
    g.add(leg, foot);
  }
  /* 端部限位弹簧挡板（左右） */
  for (const sx of [-1.18, 1.18]) {
    const post = new THREE.Mesh(roundedBoxGeo(0.05, 0.1, 0.02, 0.01, 0.006), M.aluDark);
    post.position.set(sx, 0.975, 0);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.02, 10), M.rubber);
    pad.rotation.z = Math.PI / 2;
    pad.position.set(sx - Math.sign(sx) * 0.03, 0.975, 0);
    g.add(post, pad);
  }
  /* 左端壁挂支架（弹簧固定端）：竖板 + 两颗六角螺栓 + 挂钩环 */
  const bracket = new THREE.Mesh(roundedBoxGeo(0.05, 0.16, 0.09, 0.02, 0.008), M.aluDark);
  bracket.position.set(-1.06, 0.99, 0);
  for (const by of [0.95, 1.03]) {
    const bolt = knurledCyl(0.011, 0.011, 0.014, M.steel, knurlTexture('#8d97a1'));
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(-1.035, by, 0.03);
    g.add(bolt);
  }
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 8, 16), M.steel);
  hook.position.set(-1.045, 1.0, 0);
  hook.rotation.y = Math.PI / 2;
  g.add(bracket, hook);
  /* 滑块：车身倒角 + 顶部提环 + 两侧挡光片 + 底部气垫裙边 */
  const glider = new THREE.Group();
  const gbody = new THREE.Mesh(roundedBoxGeo(0.2, 0.075, 0.1, 0.03), M.steelBlue);
  gbody.position.y = 0.002;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.202, 0.018, 0.102), M.accent);
  stripe.position.y = -0.024;
  const grip = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 8, 18), M.aluDark);
  grip.rotation.x = Math.PI / 2;
  grip.position.y = 0.05;
  for (const sz of [-0.055, 0.055]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.003), new THREE.MeshBasicMaterial({ color: 0x1a1e24 }));
    fin.position.set(0.06, 0.005, sz);
    glider.add(fin);
  }
  glider.add(gbody, stripe, grip);
  glider.position.set(0, TRACK_Y, 0);
  /* 拖拽热区（不可见大球） */
  const grab = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  grab.position.y = 0.01;
  glider.add(grab);
  /* 标尺（贴在导轨前沿） */
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.04), new THREE.MeshBasicMaterial({ map: texRuler2m() }));
  ruler.position.set(0, 0.927, 0.051);
  g.add(ruler);
  /* 弹簧（每帧放样） */
  const spring = new THREE.Mesh(new THREE.BufferGeometry(), springMat);
  const stShadow = shadowPatch(2.5, 0.3, 0.3);
  stShadow.position.set(0, 0.9035, 0);
  g.add(rail, holeStrip, glider, ruler, spring, bracket, hook, stShadow);
  S = { glider, grab, spring, x0: -1.03 };
}

/* ================= 第二章 · 单摆（铁架台 + 光电门深改） ================= */

const stPen = {
  group: new THREE.Group(), L: 0.6, th0: 12 * Math.PI / 180, g: 9.8,
  th: 0, w: 0, t: 0, prevTh: 0, playing: true, dragging: false,
  meas: null, Tm: null, gm: null,
};
scene.add(stPen.group);
const PEN_PIVOT = new THREE.Vector3(0, 2.0, 0);
const UP = new THREE.Vector3(0, 1, 0);

let P = {};
function buildPendulum() {
  const g = stPen.group;
  /* 铸铁底座（圆角 + 倒角沿 + 调平脚） */
  const base = new THREE.Mesh(roundedBoxGeo(0.36, 0.035, 0.28, 0.03), M.steelDark);
  base.position.set(0, 0.925, -0.18);
  const pShadow = shadowPatch(0.55, 0.44, 0.34);
  pShadow.position.set(0, 0.9035, -0.16);
  g.add(base, pShadow);
  for (const fx of [-0.13, 0.13]) {
    for (const fz of [-0.26, -0.1]) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.012, 12), M.rubber);
      foot.position.set(fx, 0.906, fz);
      g.add(foot);
    }
  }
  /* 立杆 + 顶端夹持（带滚花紧定螺） */
  const rod = cyl(0.016, 0.016, 1.14, M.steel, 14);
  rod.position.set(0, 1.47, -0.18);
  g.add(rod);
  const clampBody = new THREE.Mesh(roundedBoxGeo(0.06, 0.06, 0.22, 0.02, 0.008), M.aluDark);
  clampBody.position.set(0, 2.0, -0.1);
  g.add(clampBody);
  const thumb = knurledCyl(0.016, 0.016, 0.02, M.aluDark, knurlTexture('#8d97a1'));
  thumb.rotation.x = Math.PI / 2;
  thumb.position.set(0, 2.0, 0.02);
  g.add(thumb);
  const arm = box(0.02, 0.02, 0.16, M.aluDark);
  arm.position.set(0, 2.0, -0.02);
  g.add(arm);
  /* 量角器盘（纸盘贴图） */
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.26, 40), new THREE.MeshStandardMaterial({ map: texProtractor(), transparent: true, opacity: 0.94, roughness: 0.9, metalness: 0 }));
  dial.position.set(0, PEN_PIVOT.y - 0.02, -0.002);
  g.add(dial);
  /* 摆线 + 线夹 + 黄铜摆球（带挂环） */
  const str = cyl(0.004, 0.004, 1, stdMat({ color: 0xd8dde6, roughness: 0.8 }));
  const bobRing = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.004, 8, 16), M.brass);
  const bob = new THREE.Mesh(new THREE.SphereGeometry(0.048, 26, 20), M.brass);
  const bobHit = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  g.add(str, bobRing, bob, bobHit);
  /* 光电门：U 型叉 + 双发射/接收眼 + 光幕 + 数显模块 */
  const gateG = new THREE.Group();
  const gatePost = cyl(0.01, 0.013, 0.16, M.aluDark, 12);
  /* 横臂梁（薄）+ 两端外露发射/接收眼 + 前置光幕 */
  const gateHead = new THREE.Mesh(roundedBoxGeo(0.17, 0.034, 0.04, 0.012, 0.005), M.alu);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 10), matGlow(0xff5a4a, 1.2));
  eyeL.position.set(-0.062, 0.006, 0.024);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 10), matGlow(0x6fd0ff, 1.2));
  eyeR.position.set(0.062, 0.006, 0.024);
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.115, 0.007), new THREE.MeshBasicMaterial({
    color: 0xff6a5a, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  beam.position.set(0, 0.006, 0.031);
  /* 数显模块：壳体加深，字面外露 3mm */
  const dispPlate = new THREE.Mesh(roundedBoxGeo(0.16, 0.09, 0.026, 0.01, 0.004), M.screenOff);
  dispPlate.position.set(0, -0.078, 0);
  /* 数显字面朝上（教学相机多为俯视，仰面读不到） */
  const dispFace = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.062), new THREE.MeshBasicMaterial({ map: gateDisp.tex }));
  dispFace.position.set(0, -0.031, 0);
  dispFace.rotation.x = -Math.PI / 2;
  gateG.add(gatePost, gateHead, eyeL, eyeR, beam, dispPlate, dispFace);
  gateG.position.set(0, 1.02, 0.12);
  g.add(gateG);
  gateDisplayDraw('T=--');
  P = { str, bob, bobRing, bobHit, gateG, beam };
}

function resetPendulum() {
  stPen.th = stPen.th0;
  stPen.w = 0;
  stPen.t = 0;
  stPen.prevTh = stPen.th;
  stPen.meas = null;
  stPen.Tm = null;
  stPen.gm = null;
}

/* ================= 第四章 · 受迫振动与共振（电机偏心轮深改） ================= */

const stRes = {
  group: new THREE.Group(), f0: 0.9, fd: 0.9, gam: 0.16, amp: 0.8,
  x: 0, v: 0, phiD: 0, sweeping: false, sweepT: 0, Aest: 0,
};
scene.add(stRes.group);

let R = {};
function buildResonance() {
  const g = stRes.group;
  /* 龙门架：双铝柱 + 顶梁 + 底座板 + 四颗螺栓 */
  const basePlate = new THREE.Mesh(roundedBoxGeo(1.2, 0.03, 0.24, 0.02, 0.008), M.aluDark);
  basePlate.position.set(0, 0.915, -0.06);
  const rShadow = shadowPatch(1.4, 0.44, 0.32);
  rShadow.position.set(0, 0.9035, -0.06);
  g.add(basePlate, rShadow);
  for (const bx of [-0.5, 0.5]) {
    for (const bz of [-0.14, 0.02]) {
      const bolt = knurledCyl(0.012, 0.012, 0.012, M.steel, knurlTexture('#8d97a1'));
      bolt.position.set(bx, 0.936, bz);
      g.add(bolt);
    }
  }
  for (const px of [-0.45, 0.45]) {
    const post = cyl(0.02, 0.024, 1.05, M.alu, 16);
    post.position.set(px, 1.45, -0.06);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.007, 8, 18), M.aluDark);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(px, 1.86, -0.06);
    g.add(post, collar);
  }
  const bar = new THREE.Mesh(roundedBoxGeo(1.0, 0.05, 0.06, 0.02, 0.008), M.alu);
  bar.position.set(0, 1.955, -0.06);
  g.add(bar);
  /* 驱动电机：机身（散热鳍片） + 铭牌 + 轴 + 偏心轮（偏心配重块） */
  const motor = new THREE.Group();
  const mBody = new THREE.Mesh(roundedBoxGeo(0.16, 0.12, 0.13, 0.02, 0.008), M.paintDeep);
  mBody.position.y = 0.055;
  motor.add(mBody);
  for (let f = 0; f < 6; f++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.006, 0.135), M.aluDark);
    fin.position.set(0, 0.02 + f * 0.017, 0);
    motor.add(fin);
  }
  const mLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.032), new THREE.MeshBasicMaterial({
    map: makeLabelTexture([['DRIVE-40', 15], ['220V · 50Hz', 11]], { paper: '#dfe3e8', ink: '#3a4250', border: '#8a94a4', pad: 5 }),
  }));
  mLabel.rotation.y = Math.PI / 2;
  mLabel.position.set(0.082, 0.06, 0);
  motor.add(mLabel);
  const shaft = cyl(0.008, 0.008, 0.035, M.steel, 12);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.set(0, 0.055, 0.08);
  motor.add(shaft);
  const disc = cyl(0.05, 0.05, 0.016, M.aluDark, 22);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(0, 0.055, 0.1);
  const cw = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 14), M.brass);
  cw.rotation.x = Math.PI / 2;
  cw.position.set(0.028, 0, 0);
  const discG = new THREE.Group();
  discG.add(disc, cw);
  discG.position.set(0, 0.055, 0.104);
  const pin = cyl(0.007, 0.007, 0.024, M.accent, 10);
  pin.rotation.x = Math.PI / 2;
  motor.add(discG, pin);
  motor.position.set(0, 1.8, 0.02);
  g.add(motor);
  /* 电源线（弯管到台沿） */
  const cordPts = [
    new THREE.Vector3(0.05, 1.82, 0.09),
    new THREE.Vector3(0.3, 1.6, 0.16),
    new THREE.Vector3(0.5, 1.0, 0.14),
    new THREE.Vector3(0.52, 0.915, 0.06),
  ];
  const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPts), 36, 0.005, 8, false), M.rubber);
  g.add(cord);
  /* 悬挂弹簧 + 振子（钩码组） */
  const hanger = cyl(0.006, 0.006, 0.05, M.aluDark);
  hanger.position.set(0, 1.8, 0);
  const spring = new THREE.Mesh(new THREE.BufferGeometry(), springMat);
  const mass = new THREE.Group();
  const mPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.012, 20), M.steelBlue);
  mass.add(mPlate);
  const w1 = slottedWeight(0.042, 0.05, M.steelBlue, 0.02);
  w1.position.y = 0.04;
  const w2 = slottedWeight(0.042, 0.05, M.steel, 0.02);
  w2.position.y = 0.098;
  const hookTop = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.004, 8, 16), M.steel);
  hookTop.position.y = 0.155;
  mass.add(w1, w2, hookTop);
  mass.position.set(0, 1.15, 0);
  g.add(hanger, spring, mass);
  R = { discG, pin, spring, mass, motor };
}

/* ================= 第五章 · 机械波的形成（质点列深改） ================= */

const ROW_N = 24;
const ROW_DX = 0.08;
const ROW_X0 = -0.92;
const ROW_V_DEF = 1.5;

const stRow = {
  group: new THREE.Group(), f: 0.8, A: 0.08, v: ROW_V_DEF, phi: 0, slow: false, playing: true,
  pol: 'transverse',
  balls: [], arrows: [], labels: [], line: null, markIdx: 12,
};
scene.add(stRow.group);

let W5 = {};
function buildRow() {
  const g = stRow.group;
  /* 底轨 + 后侧绒面背景板（提升珠列对比度） */
  const base = new THREE.Mesh(roundedBoxGeo(2.1, 0.024, 0.05, 0.02, 0.006), M.aluDark);
  base.position.set(0, 1.01, -0.02);
  const wShadow = shadowPatch(2.3, 0.32, 0.3);
  wShadow.position.set(0, 0.9035, 0);
  g.add(base, wShadow);
  const felt = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.42), matStd(C.felt, { roughness: 0.95 }));
  felt.position.set(0, 1.22, -0.09);
  g.add(felt);
  /* 驱动单元（左侧小电机 + 驱动杆 + 偏心轮罩） */
  const driverBox = new THREE.Mesh(roundedBoxGeo(0.1, 0.09, 0.08, 0.02, 0.006), M.paintDeep);
  driverBox.position.set(ROW_X0 - 0.16, 1.06, 0);
  const drvLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.026), new THREE.MeshBasicMaterial({
    map: makeLabelTexture([['振源 S', 14]], { paper: '#dfe3e8', ink: '#3a4250', border: '#8a94a4', pad: 4 }),
  }));
  drvLabel.rotation.y = Math.PI / 2;
  drvLabel.position.set(ROW_X0 - 0.109, 1.07, 0);
  const driver = box(0.024, 0.16, 0.024, M.aluDark);
  driver.position.set(ROW_X0 - 0.09, STR_Y, 0);
  g.add(driverBox, drvLabel, driver);
  /* 珠列：玻璃珠与钢珠交替，标记珠红漆 + 白环 */
  const ballGeoG = new THREE.SphereGeometry(0.032, 18, 14);
  const ballGeoS = new THREE.SphereGeometry(0.034, 18, 14);
  const glassBall = matGlass(0xcfe4ee, { opacity: 0.5 });
  const markMat = matCoat(C.accent, { roughness: 0.4 });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ROW_N * 3), 3));
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.75 }));
  line.frustumCulled = false;
  g.add(line);
  for (let i = 0; i < ROW_N; i++) {
    const x = ROW_X0 + i * ROW_DX;
    const b = i === stRow.markIdx
      ? new THREE.Mesh(ballGeoS, markMat)
      : new THREE.Mesh(i % 3 === 0 ? ballGeoG : ballGeoS, i % 3 === 0 ? glassBall : M.steel);
    if (i === stRow.markIdx) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.004, 8, 20), new THREE.MeshBasicMaterial({ color: 0xf2f0e8 }));
      b.add(ring);
    }
    b.position.set(x, STR_Y, 0);
    g.add(b);
    stRow.balls.push(b);
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.055, 10), matCoat(0xffc46b, { roughness: 0.5 }));
    arrow.position.set(x, STR_Y + 0.14, 0);
    arrow.visible = false;
    g.add(arrow);
    stRow.arrows.push(arrow);
    const lbl = makeTextSprite(String(i), { fontSize: 24, color: '#ffd9a8', scale: 0.0021 });
    lbl.position.set(x, STR_Y + 0.22, 0);
    lbl.visible = false;
    g.add(lbl);
    stRow.labels.push(lbl);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.004, 8, 24), M.accent);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(ROW_X0 + stRow.markIdx * ROW_DX, STR_Y - 0.034, 0);
  g.add(ring);
  W5 = { line, ring, driver };
}

/* ================= 绳波数值引擎（第六章 / 第十一章共用） ================= */

function makeStringEngine(N, L) {
  const dx = L / (N - 1);
  const y = new Float32Array(N);
  const v = new Float32Array(N);
  return {
    N, L, dx, y, v, c: 1.2, damp: 0.01,
    reset() { y.fill(0); v.fill(0); },
    /** 注入一个纯右行高斯脉冲：y += G，v += −c·G′（只向右传播） */
    emit(x0 = 0.3, w = 0.15, amp = 0.09) {
      for (let i = 0; i < N; i++) {
        const x = i * dx;
        const g = Math.exp(-((x - x0) * (x - x0)) / (w * w));
        const dg = -(2 * (x - x0) / (w * w)) * g;
        y[i] += amp * g;
        v[i] += -this.c * dg * amp;
      }
    },
    /** 显式波动方程步进（子步保证 CFL 稳定）；drive: [左端位移, 左端速度] 或 null（左端固定） */
    step(dt, rightMode, drive) {
      const c2 = this.c * this.c;
      const nSub = Math.max(1, Math.ceil((this.c * dt) / (0.4 * dx)));
      const h = dt / nSub;
      for (let s = 0; s < nSub; s++) {
        for (let i = 1; i < N - 1; i++) {
          v[i] += (c2 * h) * (y[i - 1] - 2 * y[i] + y[i + 1]) / (dx * dx) - this.damp * v[i] * h;
        }
        for (let i = 1; i < N - 1; i++) y[i] += v[i] * h;
        if (drive) { const d = drive(); y[0] = d[0]; v[0] = d[1]; }
        else { y[0] = 0; v[0] = 0; }
        if (rightMode === 'fixed') { y[N - 1] = 0; v[N - 1] = 0; }
        else { y[N - 1] = y[N - 2]; v[N - 1] = v[N - 2]; }
      }
    },
  };
}

/** 绳波台（两端张紧座 + 右端固定板/自由杆 + 绳） */
function buildStringStation(g) {
  /* 左端：张紧座（底钳 + 立柱 + 滚花张紧螺母） */
  const clampL = new THREE.Mesh(roundedBoxGeo(0.1, 0.05, 0.09, 0.015, 0.006), M.aluDark);
  clampL.position.set(-1.02, 0.928, 0);
  const postL = cyl(0.015, 0.019, 0.17, M.alu, 14);
  postL.position.set(-1.0, 0.995, 0);
  const nutL = knurledCyl(0.02, 0.02, 0.024, M.steel, knurlTexture('#8d97a1'));
  nutL.position.set(-1.0, 1.075, 0);
  g.add(clampL, postL, nutL);
  /* 右端：底钳 + 立柱 + 可换端头（固定板 / 自由杆） */
  const clampR = new THREE.Mesh(roundedBoxGeo(0.1, 0.05, 0.09, 0.015, 0.006), M.aluDark);
  clampR.position.set(1.02, 0.928, 0);
  const postR = cyl(0.015, 0.019, 0.17, M.alu, 14);
  postR.position.set(1.0, 0.995, 0);
  const nutR = nutL.clone();
  nutR.position.set(1.0, 1.075, 0);
  g.add(clampR, postR, nutR);
  for (const sx2 of [-1.02, 1.02]) {
    const cSh = shadowPatch(0.3, 0.3, 0.26);
    cSh.position.set(sx2, 0.9035, 0);
    g.add(cSh);
  }
  const plate = new THREE.Group();
  const plateBody = new THREE.Mesh(roundedBoxGeo(0.035, 0.2, 0.08, 0.015, 0.006), stdMat({ color: 0x39404a, roughness: 0.7 }));
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.19, 0.075), M.rubber);
  pad.position.x = -0.02;
  for (const by of [-0.06, 0.06]) {
    const bolt = knurledCyl(0.01, 0.01, 0.012, M.steel, knurlTexture('#8d97a1'));
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(0.012, by, 0);
    plate.add(bolt);
  }
  plate.add(plateBody, pad);
  plate.position.set(1.04, 1.05, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 20), M.alu);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(1.0, 1.07, 0);
  const rodFree = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 14), M.brass);
  rodFree.position.set(1.1, 1.07, 0);
  rodFree.visible = false;
  g.add(plate, ring, rodFree);
  const string = new THREE.Mesh(new THREE.BufferGeometry(), matGlow(0xdfeeff, 0.5));
  const pts = [];
  for (let i = 0; i < 90; i++) pts.push(new THREE.Vector3(-1 + (i * 2) / 89, STR_Y, 0));
  g.add(string);
  return { string, pts, plate, ring, rodFree };
}

const stRef = {
  group: new THREE.Group(), eng: makeStringEngine(90, 2.0),
  end: 'fixed', cont: false, contAcc: 0, nPulse: 0, fixHits: 0, freeHits: 0,
};
scene.add(stRef.group);
const stFree = {
  group: new THREE.Group(), eng: makeStringEngine(90, 2.0),
  end: 'fixed', driveOn: false, f: 1.2, phi: 0, v: 1.2,
  playing: true, slow: false,
};
scene.add(stFree.group);

let ST6 = null;
let ST11 = null;

/* ================= 第七章 · 波的叠加与驻波（弦枕 + 弦钮 + 双脉冲） ================= */

const STA_L = 1.8;
const STA_M = 100;
const STA_V = 2.0;

const stSta = {
  group: new THREE.Group(), f: 1.667, phi: 0, A: 0.09,
  showComp: true, showNodes: true, playing: true,
  demo: 'standing',           // 'standing' | 'pulses'
  emitT: 0, emitGap: 0.5,     // 两脉冲模式的时间轴
  matchedN: new Set(),
};
scene.add(stSta.group);

let STA = {};
function buildStanding() {
  const g = stSta.group;
  /* 左端：琴头 + 弦钮（调节频率时旋钮跟着转） */
  const head = new THREE.Mesh(roundedBoxGeo(0.1, 0.2, 0.05, 0.02, 0.006), M.walnutMat);
  head.position.set(-1.06, STR_Y, 0);
  g.add(head);
  const pegs = [];
  for (const py of [0.07, -0.07]) {
    for (const pz of [-0.035, 0.035]) {
      const peg = new THREE.Group();
      const shaft = cyl(0.009, 0.009, 0.07, M.brass, 10);
      shaft.rotation.x = Math.PI / 2;
      const ear1 = box(0.004, 0.024, 0.012, M.brass);
      const ear2 = box(0.004, 0.012, 0.024, M.brass);
      ear1.position.z = 0.032;
      ear2.position.z = 0.032;
      peg.add(shaft, ear1, ear2);
      peg.position.set(-1.03, STR_Y + py, pz);
      g.add(peg);
      pegs.push(peg);
    }
  }
  /* 右端：琴桥弦枕（胡桃木嵌线） */
  const wallR = new THREE.Mesh(roundedBoxGeo(0.06, 0.22, 0.09, 0.015, 0.006), M.walnutMat);
  wallR.position.set(0.95, STR_Y, 0);
  const inlay = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.008, 0.094), M.brass);
  inlay.position.set(0.95, STR_Y + 0.09, 0);
  g.add(wallR, inlay);
  /* 底轨分度尺（cm 刻度纹理，读 λ/2 方便） */
  const scaleTex = canvasTex(1024, 36, (ctx) => {
    ctx.fillStyle = '#20282e';
    ctx.fillRect(0, 0, 1024, 36);
    ctx.strokeStyle = '#9fb6cf';
    ctx.fillStyle = '#cfe0ee';
    for (let i = 0; i <= 90; i++) {
      const px = 12 + i * ((1024 - 24) / 90);
      const major = i % 10 === 0;
      ctx.lineWidth = major ? 2.5 : 1.2;
      ctx.beginPath(); ctx.moveTo(px, 6); ctx.lineTo(px, 6 + (major ? 16 : 9)); ctx.stroke();
      if (major) {
        ctx.font = '600 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i), px, 33);
      }
    }
  });
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 0.036), new THREE.MeshBasicMaterial({ map: scaleTex }));
  scale.rotation.x = -Math.PI / 2;
  scale.position.set(0, 0.912, 0.06);
  g.add(scale);
  const string = new THREE.Mesh(new THREE.BufferGeometry(), matGlow(0xffe2a6, 0.55));
  const pts = [];
  for (let i = 0; i < STA_M; i++) pts.push(new THREE.Vector3(-STA_L / 2 + (i * STA_L) / (STA_M - 1), STR_Y, 0));
  function compLine(color) {
    const geo = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(new Float32Array(STA_M * 3), 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', attr);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.42 }));
    line.frustumCulled = false;
    return line;
  }
  const inc = compLine(0x7fd0ff);
  const ref = compLine(0xffb35c);
  const nodeRings = [];
  for (let i = 0; i < 6; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.005, 8, 22), M.accent);
    r.rotation.x = Math.PI / 2;
    r.position.y = STR_Y;
    r.visible = false;
    g.add(r);
    nodeRings.push(r);
  }
  g.add(head, string, inc, ref);
  STA = { string, pts, inc, ref, nodeRings, pegs };
}

/* ================= 第八章 · 水波：干涉与衍射（全屏 2D 水波槽） ================= */

const RW = 240, RH = 160;
const LUTN = 2048, LUTK = LUTN / TAU;
const sinLUT = new Float32Array(LUTN);
for (let i = 0; i < LUTN; i++) sinLUT[i] = Math.sin(i / LUTK);
const colLUT = new Uint8Array(511 * 3 + 3);
for (let i = 0; i <= 510; i++) {
  const t = (i - 255) / 255;
  colLUT[i * 3] = 14 + (t + 1) * 60;
  colLUT[i * 3 + 1] = 46 + (t + 1) * 85;
  colLUT[i * 3 + 2] = 100 + (t + 1) * 75;
}

const tankCanvas = document.createElement('canvas');
tankCanvas.className = 'waves-tank';
stage.appendChild(tankCanvas);
tankCanvas.style.display = 'none';
const tctx = tankCanvas.getContext('2d');
const off = document.createElement('canvas');
off.width = RW; off.height = RH;
const octx = off.getContext('2d');
const img = octx.createImageData(RW, RH);

const tank = {
  mode: 'double', lambda: 0.2, sep: 0.5, slitW: 0.16, v: 0.6,
  phi: 0, paused: false, dirty: true, showLines: true,
  cx: 0, cy: 0, viewW: 2.2, viewH: 1.1,
  wx: null, wy: null, plane: null, rs: [null, null, null, null, null],
};
const TANK_XB = -0.35;

function tankRebuild() {
  const cssW = tankCanvas.clientWidth || 640;
  const cssH = tankCanvas.clientHeight || 320;
  tank.viewH = tank.viewW * cssH / cssW;
  const n = RW * RH;
  if (!tank.wx) {
    tank.wx = new Float32Array(n);
    tank.wy = new Float32Array(n);
    tank.plane = new Uint8Array(n);
  }
  const { wx, wy } = tank;
  for (let j = 0; j < RH; j++) {
    const wyv = tank.cy + (0.5 - j / (RH - 1)) * tank.viewH;
    const base = j * RW;
    for (let i = 0; i < RW; i++) {
      wx[base + i] = tank.cx + (i / (RW - 1) - 0.5) * tank.viewW;
      wy[base + i] = wyv;
    }
  }
  if (tank.mode === 'double') {
    const s1 = -tank.sep / 2, s2 = tank.sep / 2;
    if (!tank.rs[0]) { tank.rs[0] = new Float32Array(n); tank.rs[1] = new Float32Array(n); }
    for (let p = 0; p < n; p++) {
      const dy = wy[p];
      const dx1 = wx[p] - s1, dx2 = wx[p] - s2;
      tank.rs[0][p] = Math.sqrt(dx1 * dx1 + dy * dy);
      tank.rs[1][p] = Math.sqrt(dx2 * dx2 + dy * dy);
    }
  } else {
    for (let q = 0; q < 5; q++) if (!tank.rs[q]) tank.rs[q] = new Float32Array(n);
    const sx = TANK_XB + 0.012;
    for (let q = 0; q < 5; q++) {
      const sy = -tank.slitW / 2 + q * (tank.slitW / 4);
      const r = tank.rs[q];
      for (let p = 0; p < n; p++) {
        const dxy = wx[p] - sx, dyy = wy[p] - sy;
        r[p] = Math.sqrt(dxy * dxy + dyy * dyy);
      }
    }
    for (let p = 0; p < n; p++) tank.plane[p] = wx[p] < TANK_XB ? 1 : 0;
  }
  tank.dirty = false;
}

function tankDrawFrame(dt) {
  if (!tank.paused) tank.phi += (TAU / tank.lambda) * tank.v * dt;
  if (tank.dirty) tankRebuild();
  const k = TAU / tank.lambda;
  const ph = tank.phi;
  const mask = LUTN - 1;
  const d = img.data;
  const { wx, wy, plane, rs } = tank;
  const slit = tank.mode === 'slit';
  const halfW = tank.slitW / 2;
  const n = RW * RH;
  for (let p = 0, o = 0; p < n; p++, o += 4) {
    const X = wx[p], Y = wy[p];
    if (slit && Math.abs(X - TANK_XB) < 0.016 && Math.abs(Y) > halfW + 0.004) {
      d[o] = 56; d[o + 1] = 60; d[o + 2] = 70; d[o + 3] = 255;
      continue;
    }
    let h = 0, s = 0.12;
    if (slit) {
      if (plane[p]) {
        h = 0.95 * sinLUT[(((k * X - ph) * LUTK) | 0) & mask];
        s += 0.95;
      } else {
        for (let q = 0; q < 5; q++) {
          const r = rs[q][p];
          const a = 1 / (1 + 4 * r);
          s += a;
          h += a * sinLUT[(((k * r - ph) * LUTK) | 0) & mask];
        }
      }
    } else {
      for (let q = 0; q < 2; q++) {
        const r = rs[q][p];
        const a = 1 / (1 + 4 * r);
        s += a;
        h += a * sinLUT[(((k * r - ph) * LUTK) | 0) & mask];
      }
    }
    const t = h / s;
    let ci = ((t * 255) | 0) + 255;
    if (ci < 0) ci = 0; else if (ci > 510) ci = 510;
    const c3 = ci * 3;
    d[o] = colLUT[c3]; d[o + 1] = colLUT[c3 + 1]; d[o + 2] = colLUT[c3 + 2]; d[o + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  const cw = tankCanvas.width, chh = tankCanvas.height;
  tctx.imageSmoothingEnabled = true;
  tctx.drawImage(off, 0, 0, cw, chh);
  const px = (X) => ((X - tank.cx) / tank.viewW) * cw + cw / 2;
  const py = (Y) => chh / 2 - ((Y - tank.cy) / tank.viewH) * chh;
  tctx.fillStyle = 'rgba(255,255,255,0.95)';
  tctx.font = '600 12px sans-serif';
  tctx.lineWidth = 2;
  const osc = Math.sin(tank.phi * 3);
  if (tank.mode === 'double') {
    tctx.strokeStyle = 'rgba(255,255,255,0.9)';
    const marks = [[-tank.sep / 2, 'S₁'], [tank.sep / 2, 'S₂']];
    for (const [sx, nm] of marks) {
      tctx.beginPath();
      tctx.arc(px(sx), py(0), 5 + osc * 1.5, 0, TAU);
      tctx.fill();
      tctx.stroke();
      tctx.fillText(nm, px(sx) + 8, py(0) - 8);
    }
  } else {
    tctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (const sy of [-halfW, halfW]) {
      tctx.beginPath();
      tctx.arc(px(TANK_XB + 0.012), py(sy), 4 + osc * 1.2, 0, TAU);
      tctx.fill();
    }
    tctx.fillText('缝', px(TANK_XB) + 6, py(0) - 6);
  }
  if (tank.mode === 'double' && tank.showLines) {
    const dd = tank.sep;
    const lam = tank.lambda;
    const drawFam = (c, dashed) => {
      const a = Math.abs(c) / 2;
      if (a >= dd / 2) return;
      tctx.strokeStyle = dashed ? 'rgba(130,185,255,0.8)' : 'rgba(255,214,90,0.92)';
      tctx.lineWidth = dashed ? 1.4 : 2;
      tctx.setLineDash(dashed ? [6, 6] : []);
      tctx.beginPath();
      if (a === 0) {
        tctx.moveTo(px(0), py(tank.cy - tank.viewH / 2));
        tctx.lineTo(px(0), py(tank.cy + tank.viewH / 2));
        tctx.stroke();
        tctx.setLineDash([]);
        return;
      }
      const b2 = (dd * dd) / 4 - a * a;
      const sgn = c > 0 ? -1 : 1;
      let started = false;
      for (let q = 0; q <= 80; q++) {
        const Y = tank.cy - tank.viewH / 2 + (q / 80) * tank.viewH;
        const X = sgn * a * Math.sqrt(1 + (Y * Y) / b2);
        const sx = px(X), sy = py(Y);
        if (sx < -30 || sx > cw + 30) { started = false; continue; }
        if (!started) { tctx.moveTo(sx, sy); started = true; } else tctx.lineTo(sx, sy);
      }
      tctx.stroke();
      tctx.setLineDash([]);
    };
    const K = Math.ceil(dd / lam);
    for (let k2 = -K; k2 <= K; k2++) drawFam((k2 + 0.5) * lam, true);
    for (let k2 = -K; k2 <= K; k2++) drawFam(k2 * lam, false);
  }
  const barPx = (0.5 / tank.viewW) * cw;
  const bx = 16, by = chh - 16;
  tctx.strokeStyle = 'rgba(255,255,255,0.85)';
  tctx.beginPath();
  tctx.moveTo(bx, by - 5); tctx.lineTo(bx, by);
  tctx.lineTo(bx + barPx, by);
  tctx.lineTo(bx + barPx, by - 5);
  tctx.stroke();
  tctx.fillText('0.5 m', bx + barPx + 6, by);
}

let tankDrag = null;
tankCanvas.addEventListener('pointerdown', (e) => {
  tankDrag = { x: e.clientX, y: e.clientY };
  try { tankCanvas.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
});
tankCanvas.addEventListener('pointermove', (e) => {
  if (!tankDrag) return;
  const cw = tankCanvas.clientWidth || 1, chh = tankCanvas.clientHeight || 1;
  tank.cx -= ((e.clientX - tankDrag.x) / cw) * tank.viewW;
  tank.cy += ((e.clientY - tankDrag.y) / chh) * tank.viewH;
  tankDrag.x = e.clientX;
  tankDrag.y = e.clientY;
  tank.dirty = true;
});
tankCanvas.addEventListener('pointerup', () => { tankDrag = null; });
tankCanvas.addEventListener('pointercancel', () => { tankDrag = null; });
tankCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  tank.viewW = clamp(tank.viewW * Math.exp(e.deltaY * 0.0012), 0.5, 5);
  tank.dirty = true;
}, { passive: false });
new ResizeObserver(() => {
  const w = tankCanvas.clientWidth, h = tankCanvas.clientHeight;
  if (w && h && (tankCanvas.width !== w || tankCanvas.height !== h)) {
    tankCanvas.width = w;
    tankCanvas.height = h;
    tank.dirty = true;
  }
}).observe(tankCanvas);

/* ================= 第九章 · 多普勒效应（救护车 + 听者 + 马赫锥深改） ================= */

const DP_V = 1.5;

const stDop = {
  group: new THREE.Group(), vf: 0.4, fEmit: 3, cartX: -1.2, cartV: 0.6,
  rings: [], ringIdx: 0, emitAcc: 0, waveOn: true,
  soundOn: false, tone: null, shockToasted: false, listen: 'front',
};
scene.add(stDop.group);

let DP = {};
function buildDoppler() {
  const g = stDop.group;
  /* 道路：沥青带 + 磨损噪点 + 中线虚线 + 路缘 */
  const roadTex = texRoad();
  roadTex.wrapS = THREE.RepeatWrapping;
  roadTex.repeat.set(3, 1);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.9), matStd(0xffffff, { roughness: 0.94 }));
  road.material.map = roadTex;
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.906, 0);
  g.add(road);
  for (const rz of [-0.46, 0.46]) {
    const curb = new THREE.Mesh(roundedBoxGeo(4.4, 0.02, 0.05, 0.012, 0.004), M.chalk);
    curb.position.set(0, 0.912, rz);
    g.add(curb);
  }
  /* 救护车：车身挤出轮廓 + 侧贴条 + 车窗 + 车轮（带轮毂）+ 顶灯双闪 */
  const cart = new THREE.Group();
  const bodyShape = new THREE.Shape();
  const L2 = 0.14, H2 = 0.1;
  bodyShape.moveTo(-L2, 0);
  bodyShape.lineTo(-L2, H2 * 0.62);
  bodyShape.quadraticCurveTo(-L2, H2, -L2 * 0.62, H2);
  bodyShape.lineTo(L2 * 0.3, H2);
  bodyShape.quadraticCurveTo(L2 * 0.62, H2, L2 * 0.74, H2 * 0.66);
  bodyShape.lineTo(L2 * 0.9, H2 * 0.4);
  bodyShape.lineTo(L2, H2 * 0.32);
  bodyShape.lineTo(L2, 0);
  bodyShape.lineTo(-L2, 0);
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.13, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 8 });
  bodyGeo.translate(0, 0, -0.065);
  const body = new THREE.Mesh(bodyGeo, matCoat(C.ambBody, { roughness: 0.3, metalness: 0.08 }));
  body.position.y = 0.045;
  cart.add(body);
  const sideDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.06), new THREE.MeshStandardMaterial({ map: texAmbulanceSide(), roughness: 0.5 }));
  sideDecal.rotation.y = -Math.PI / 2;
  sideDecal.position.set(-0.074, 0.085, 0);
  cart.add(sideDecal);
  const sideDecal2 = sideDecal.clone();
  sideDecal2.rotation.y = Math.PI / 2;
  sideDecal2.position.x = 0.074;
  cart.add(sideDecal2);
  for (const wz of [-0.042, 0.042]) {
    const win = new THREE.Mesh(roundedBoxGeo(0.075, 0.045, 0.008, 0.012, 0.002), matGlass(0xcfe6f2, { opacity: 0.5 }));
    win.position.set(0.05, 0.115, wz);
    cart.add(win);
  }
  const windshield = new THREE.Mesh(roundedBoxGeo(0.006, 0.045, 0.1, 0.01, 0.002), matGlass(0xcfe6f2, { opacity: 0.55 }));
  windshield.position.set(0.098, 0.108, 0);
  windshield.rotation.z = -0.18;
  cart.add(windshield);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, 0.08), M.aluDark);
  grille.position.set(0.138, 0.055, 0);
  cart.add(grille);
  /* 车轮 ×4：外组控制位置，内网控制自转 */
  DP.wheels = [];
  for (const sx of [-0.085, 0.085]) {
    for (const sz of [-0.062, 0.062]) {
      const hub = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.02, 18), M.rubber);
      tire.rotation.x = Math.PI / 2;
      const spokeTex = canvasTex(64, 64, (ctx) => {
        ctx.fillStyle = '#c8ccd2';
        ctx.beginPath(); ctx.arc(32, 32, 30, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#49505a';
        ctx.lineWidth = 4;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU;
          ctx.beginPath(); ctx.moveTo(32, 32);
          ctx.lineTo(32 + Math.cos(a) * 26, 32 + Math.sin(a) * 26);
          ctx.stroke();
        }
        ctx.fillStyle = '#49505a';
        ctx.beginPath(); ctx.arc(32, 32, 7, 0, TAU); ctx.fill();
      });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.022, 14), new THREE.MeshStandardMaterial({ map: spokeTex, roughness: 0.5, metalness: 0.3 }));
      cap.rotation.x = Math.PI / 2;
      const spin = new THREE.Group();
      spin.add(tire, cap);
      hub.add(spin);
      hub.position.set(sx, 0.026, sz);
      DP.wheels.push(spin);
      cart.add(hub);
    }
  }
  /* 顶灯：底座 + 红蓝双罩（发声时交替爆闪） */
  const beaconBase = new THREE.Mesh(roundedBoxGeo(0.09, 0.012, 0.05, 0.008, 0.003), M.aluDark);
  beaconBase.position.set(0.02, 0.152, 0);
  const bcR = new THREE.Mesh(new THREE.SphereGeometry(0.017, 14, 10, 0, TAU, 0, Math.PI / 2), matGlow(C.beaconR, 0.35));
  bcR.position.set(0.045, 0.152, 0);
  const bcB = new THREE.Mesh(new THREE.SphereGeometry(0.017, 14, 10, 0, TAU, 0, Math.PI / 2), matGlow(C.beaconB, 0.35));
  bcB.position.set(-0.005, 0.152, 0);
  cart.add(beaconBase, bcR, bcB);
  DP.bcR = bcR.material;
  DP.bcB = bcB.material;
  const cartLbl = makeTextSprite('声源', { fontSize: 26, color: '#ffb09a', scale: 0.0026 });
  cartLbl.position.y = 0.26;
  cart.add(cartLbl);
  cart.position.set(-1.2, 0.908, 0);
  /* 观测者：安全背心小人 + 平台圆 + 耳侧声波弧 */
  const obs = new THREE.Group();
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.012, 22), M.aluDark);
  plat.position.y = 0.006;
  obs.add(plat);
  for (const lx of [-0.018, 0.018]) {
    const leg = cyl(0.011, 0.012, 0.11, matStd(0x39404a, { roughness: 0.8 }), 10);
    leg.position.set(lx, 0.067, 0);
    obs.add(leg);
  }
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.075, 6, 12), matStd(C.vest, { roughness: 0.7 }));
  torso.position.y = 0.175;
  const stripeV = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.005, 8, 18), new THREE.MeshStandardMaterial({ color: 0xd8d2be, roughness: 0.8 }));
  stripeV.rotation.x = Math.PI / 2;
  stripeV.position.y = 0.17;
  obs.add(torso, stripeV);
  const headM = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 12), matStd(C.skin, { roughness: 0.6 }));
  headM.position.y = 0.268;
  obs.add(headM);
  const earArcs = [];
  for (let i = 0; i < 2; i++) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.036 + i * 0.024, 0.0035, 8, 24, Math.PI), new THREE.MeshBasicMaterial({
      color: 0x8fd3ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    arc.position.set(0, 0.265, 0);
    arc.rotation.z = -Math.PI / 2;
    obs.add(arc);
    earArcs.push(arc);
  }
  obs.position.set(0, 0.906, 0.42);
  g.add(obs);
  DP.obs = obs;
  DP.earArcs = earArcs;
  const obsLbl = makeTextSprite('听者', { fontSize: 26, color: '#ffd9a8', scale: 0.0026 });
  obsLbl.position.set(0, 1.28, 0.42);
  g.add(obsLbl);
  /* 听者位置标记（前/后/侧三个备选点，选中一个显示） */
  DP.listenMarks = {};
  for (const [key, lx, lz] of [['front', 0.85, 0.42], ['back', -0.85, 0.42], ['side', 0, 0.42 + 0.55]]) {
    const mk = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.005, 8, 22), M.accent);
    mk.rotation.x = Math.PI / 2;
    mk.position.set(lx, 0.916, lz);
    mk.visible = false;
    g.add(mk);
    DP.listenMarks[key] = mk;
  }
  /* 波前圈（发射时按靠近/远离着色：蓝移 / 红移） */
  const ringGeo = new THREE.RingGeometry(0.96, 1, 48);
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: 0x8fd3ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false,
    }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.95;
    m.visible = false;
    g.add(m);
    stDop.rings.push({ mesh: m, r: 0, active: false, blue: true });
  }
  /* 马赫锥（超音速时出现）：加色半透明锥网 */
  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 1, 1.15, 26, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffa060, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    })
  );
  cone.visible = false;
  g.add(cone);
  DP.cone = cone;
  g.add(cart);
  DP.cart = cart;
}

function stopDopTone() {
  if (stDop.tone) { stDop.tone.stop(); stDop.tone = null; }
  stDop.soundOn = false;
}
function resetDoppler() {
  stDop.cartX = -1.2;
  stDop.cartV = stDop.vf * DP_V;
  stDop.emitAcc = 0;
  stDop.rings.forEach((r) => { r.active = false; r.mesh.visible = false; });
  stopDopTone();
  stDop.shockToasted = false;
}

/* ================= 第十章 · 声音：特性与共鸣（音叉 + 共鸣管深改） ================= */

const TUBE_BOT = 0.94, TUBE_H = 1.05;

/** 乐器音色 = 泛音振幅配比表 */
const INSTR = {
  fork: { name: '音叉（纯音）', h: [[1, 1]] },
  flute: { name: '长笛', h: [[1, 1], [2, 0.12], [3, 0.05]] },
  piano: { name: '钢琴', h: [[1, 1], [2, 0.55], [3, 0.3], [4, 0.15], [5, 0.08], [6, 0.04]] },
  violin: { name: '小提琴', h: [[1, 1], [2, 0.6], [3, 0.45], [4, 0.32], [5, 0.22], [6, 0.14], [7, 0.08]] },
};

const stTube = {
  group: new THREE.Group(), f: 440, amp: 0.6, inst: 'fork', L: 0.34,
  phiS: 0, phiV: 0, phiR: 0, soundOn: false, tone: null,
};
scene.add(stTube.group);

let T10 = {};
function buildTube() {
  const g = stTube.group;
  /* 支撑架：铸铁底座 + 立杆 + 双指夹 */
  const base = new THREE.Mesh(roundedBoxGeo(0.3, 0.03, 0.24, 0.025, 0.007), M.steelDark);
  base.position.set(0.28, 0.925, 0);
  for (const fx of [-0.11, 0.11]) {
    for (const fz of [-0.085, 0.085]) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.012, 12), M.rubber);
      foot.position.set(0.28 + fx, 0.906, fz);
      g.add(foot);
    }
  }
  const rod = cyl(0.014, 0.014, 1.15, M.steel, 14);
  rod.position.set(0.1, 1.5, 0);
  const tShadow = shadowPatch(0.72, 0.5, 0.3);
  tShadow.position.set(0.24, 0.9035, 0.05);
  g.add(base, rod, tShadow);
  /* 双指夹（橡胶垫口夹住玻璃管） */
  const clamp = new THREE.Group();
  const clampArm = new THREE.Mesh(roundedBoxGeo(0.2, 0.03, 0.03, 0.012, 0.004), M.alu);
  for (const cz of [-0.062, 0.062]) {
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.05, 12), matStd(0x39404a, { roughness: 0.8 }));
    finger.rotation.x = Math.PI / 2;
    finger.position.set(0.28, 0, cz);
    clamp.add(finger);
  }
  clamp.add(clampArm);
  clamp.position.set(0.28, 1.9, 0);
  clampArm.position.set(0.19, 0, 0);
  g.add(clamp);
  /* 共鸣管（玻璃）+ 刻度带 + 管口水柱 */
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, TUBE_H, 26, 1, true), matGlass(0xb9d2e2, { opacity: 0.26 }));
  tube.position.set(0.28, TUBE_BOT + TUBE_H / 2, 0);
  const scaleTex = texTubeScale();
  scaleTex.wrapS = THREE.RepeatWrapping;
  const scaleBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0525, 0.0525, 0.09, 26, 1, true),
    new THREE.MeshBasicMaterial({ map: scaleTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  scaleBand.position.set(0.28, TUBE_BOT + 0.045, 0);
  scaleBand.rotation.y = Math.PI / 4;
  const water = cyl(0.046, 0.046, 1, matStd(C.water, { roughness: 0.15, transparent: true, opacity: 0.55 }), 22);
  const waterTop = new THREE.Mesh(new THREE.CircleGeometry(0.046, 22), matStd(0x7fb6d8, { roughness: 0.1, transparent: true, opacity: 0.7 }));
  waterTop.rotation.x = -Math.PI / 2;
  g.add(tube, scaleBand, water, waterTop);
  /* 水槽 + 虹吸软管（水位联动的叙事道具） */
  const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.16, 22, 1, true), matGlass(0xb9d2e2, { opacity: 0.22 }));
  beaker.position.set(0.52, 0.985, 0.14);
  const bekWater = cyl(0.068, 0.073, 0.1, matStd(C.waterDeep, { roughness: 0.2, transparent: true, opacity: 0.6 }), 20);
  bekWater.position.set(0.52, 0.955, 0.14);
  const hosePts = [
    new THREE.Vector3(0.28, TUBE_BOT + 0.008, 0),
    new THREE.Vector3(0.32, 0.9, 0.1),
    new THREE.Vector3(0.45, 0.9, 0.14),
    new THREE.Vector3(0.52, 0.912, 0.14),
  ];
  const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hosePts), 32, 0.007, 8, false), matStd(0x9a8a6a, { roughness: 0.85 }));
  g.add(beaker, bekWater, hose);
  /* 音叉：U 形双臂（CatmullRom 放样）+ 木柄 + 共鸣箱 + 小锤 */
  const fork = new THREE.Group();
  const tineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.02, 0.08, 0),
    new THREE.Vector3(-0.02, -0.03, 0),
    new THREE.Vector3(-0.013, -0.062, 0),
    new THREE.Vector3(0, -0.075, 0),
    new THREE.Vector3(0.013, -0.062, 0),
    new THREE.Vector3(0.02, -0.03, 0),
    new THREE.Vector3(0.02, 0.08, 0),
  ]);
  const tines = new THREE.Mesh(new THREE.TubeGeometry(tineCurve, 48, 0.008, 10, false), M.steel);
  const stem = cyl(0.007, 0.007, 0.1, M.steel, 10);
  stem.position.y = -0.125;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.09, 12), M.woodMat);
  handle.position.y = -0.215;
  fork.add(tines, stem, handle);
  fork.position.set(-0.08, 2.06, 0.05);
  fork.rotation.z = -0.5;
  const forkPost = cyl(0.005, 0.007, 0.97, M.steelDark, 10);
  forkPost.position.set(-0.08, BENCH_Y + 0.485, 0.05);
  const forkCollar = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.0045, 8, 16), M.aluDark);
  forkCollar.position.set(-0.08, 1.868, 0.05);
  forkCollar.rotation.x = Math.PI / 2;
  g.add(forkPost, forkCollar);
  const boxBody = new THREE.Mesh(roundedBoxGeo(0.24, 0.12, 0.14, 0.015, 0.006), M.walnutMat);
  boxBody.position.set(-0.08, BENCH_Y + 0.06, 0.12);
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.036, 20), new THREE.MeshBasicMaterial({ color: 0x181310 }));
  mouth.position.set(-0.08, BENCH_Y + 0.06, 0.051);
  const boxLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.05), new THREE.MeshBasicMaterial({ map: texForkBoxLabel() }));
  boxLabel.position.set(-0.08, BENCH_Y + 0.062, 0.192);
  boxLabel.rotation.x = -0.28;
  g.add(boxBody, mouth, boxLabel);
  /* 小锤（立在架上） */
  const mallet = new THREE.Group();
  const mPost = cyl(0.006, 0.008, 0.14, M.aluDark, 10);
  mPost.position.set(-0.36, BENCH_Y + 0.07, 0.16);
  const mStick = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.16, 8), M.walnutMat);
  mStick.rotation.z = 0.9;
  mStick.position.set(-0.33, BENCH_Y + 0.15, 0.16);
  const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 10), matStd(0xd8d2b8, { roughness: 0.95 }));
  mHead.position.set(-0.26, BENCH_Y + 0.19, 0.16);
  mallet.add(mPost, mStick, mHead);
  g.add(mallet);
  /* LED 声强柱（12 段，随共鸣增益点亮） */
  const ledG = new THREE.Group();
  const ledHousing = new THREE.Mesh(roundedBoxGeo(0.035, 0.62, 0.03, 0.01, 0.004), M.screenOff);
  ledG.add(ledHousing);
  const segs = [];
  for (let i = 0; i < 12; i++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.032, 0.008), i < 9 ? M.ledOn : matGlow(0xffc46b, 0.9));
    seg.position.set(0, 0.28 - i * 0.05, 0.014);
    ledG.add(seg);
    segs.push(seg);
  }
  ledG.position.set(0.55, TUBE_BOT + 0.36, -0.1);
  g.add(ledG);
  const tubeLbl = makeTextSprite('共鸣管', { fontSize: 26, color: '#9fd4e8', scale: 0.0026 });
  tubeLbl.position.set(0.28, 2.12, 0);
  g.add(tubeLbl);
  g.add(fork);
  T10 = { water, waterTop, fork, ledSegs: segs, clamp };
}

function stopTubeTone() {
  if (stTube.tone) { stTube.tone.stop(); stTube.tone = null; }
  stTube.soundOn = false;
}
/** 把乐器谐波表写入振荡器（WebAudio PeriodicWave） */
function applyInstrument(tone, instKey) {
  if (!tone) return;
  const harms = INSTR[instKey].h;
  const real = new Float32Array(harms.length + 1);
  const imag = new Float32Array(harms.length + 1);
  harms.forEach(([hh, aa]) => { imag[hh] = aa; });
  try {
    tone.osc.setPeriodicWave(tone.ctx.createPeriodicWave(real, imag));
  } catch (e) { /* 老浏览器兜底：保持默认波形 */ }
}

/* WebAudio：必须在用户点击手势里创建；增益 ≤0.1；离开章节 stop/close */
function createTone() {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  return {
    ctx, osc, gain,
    set(freq, vol) {
      if (freq > 20) osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setTargetAtTime(clamp(vol, 0.0001, 0.1), ctx.currentTime, 0.04);
    },
    stop() {
      try {
        gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.03);
        setTimeout(() => { try { osc.stop(); ctx.close(); } catch (e) { /* noop */ } }, 280);
      } catch (e) { /* noop */ }
    },
  };
}

/* ================= 提示浮条 / 图例 / 读数卡 / 曲线窗 ================= */

let toastTimer = null;
function toast(text, kind = '') {
  let el = stage.querySelector('.waves-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'waves-toast';
    stage.appendChild(el);
  }
  el.textContent = text;
  el.className = 'waves-toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
}

let hintEl = null;
function setHint(text) {
  if (!text) { if (hintEl) hintEl.remove(); hintEl = null; return; }
  if (!hintEl) {
    hintEl = document.createElement('div');
    hintEl.className = 'legend';
    stage.appendChild(hintEl);
  }
  hintEl.innerHTML = '';
  const row = document.createElement('div');
  row.className = 'lg-row';
  row.textContent = text;
  hintEl.appendChild(row);
}

const lcData = document.getElementById('lcData');
let hud = null;
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = rows && rows.length ? makeHUD(lcData, rows) : null;
}

/* 曲线窗基建：头部折叠 → 40px 圆徽标，位置固定右上（每章最多显示一张） */
let palCache = null;
function pal() {
  if (palCache) return palCache;
  const cs = getComputedStyle(document.documentElement);
  const g = (n, fb) => (cs.getPropertyValue(n) || fb).trim();
  palCache = {
    text: g('--text', '#e2e8f0'), dim: g('--text-faint', '#8a95a3'),
    accent: g('--accent', '#e8674a'), border: g('--card-border', 'rgba(200,220,240,0.12)'),
  };
  return palCache;
}
window.addEventListener('edulabtheme', () => { palCache = null; });

const FONT = '10px -apple-system, "PingFang SC", sans-serif';
const FONTB = '600 11px -apple-system, "PingFang SC", sans-serif';

function prepCanvas(cv) {
  const W = cv.clientWidth || 300;
  const hCss = 190;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(hCss * dpr)) {
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(hCss * dpr);
    cv.style.height = hCss + 'px';
  }
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, hCss);
  return { ctx, W, H: hCss };
}

function makeCurveWin(title, badgeText, foldKey) {
  const el = document.createElement('div');
  el.className = 'waves-chart';
  const head = document.createElement('div');
  head.className = 'waves-cv-head';
  const b = document.createElement('b');
  const info = document.createElement('span');
  info.className = 'waves-info';
  const foldBtn = document.createElement('button');
  foldBtn.type = 'button';
  foldBtn.className = 'fold-btn';
  foldBtn.textContent = '−';
  foldBtn.setAttribute('aria-label', '收起' + title);
  head.appendChild(b); head.appendChild(info); head.appendChild(foldBtn);
  const cv = document.createElement('canvas');
  el.appendChild(head); el.appendChild(cv);
  const badgeBtn = document.createElement('button');
  badgeBtn.type = 'button';
  badgeBtn.className = 'waves-badge';
  badgeBtn.textContent = badgeText;
  badgeBtn.setAttribute('aria-label', '展开' + title);
  el.appendChild(badgeBtn);
  stage.appendChild(el);

  let folded = false;
  let shown = false;
  try {
    const saved = localStorage.getItem(foldKey);
    folded = saved !== null ? saved === '1' : window.innerWidth <= 1100;
  } catch (e) { folded = window.innerWidth <= 1100; }
  function apply() {
    el.classList.toggle('folded', folded);
    foldBtn.setAttribute('aria-expanded', String(!folded));
  }
  function toggle() {
    folded = !folded;
    try { localStorage.setItem(foldKey, folded ? '1' : '0'); } catch (e) { /* 忽略 */ }
    apply();
  }
  foldBtn.addEventListener('click', toggle);
  badgeBtn.addEventListener('click', toggle);
  apply();
  return {
    el, cv, info,
    show(v) { shown = v; el.style.display = v ? '' : 'none'; },
    get open() { return shown && !folded; },
    setHead(t, i) { b.textContent = t; info.textContent = i || ''; },
  };
}

const winTape = makeCurveWin('纸带 · x–t 图像', '纸带', 'waves.foldTape');
const winEnergy = makeCurveWin('能量转化 · 柱 × 总线', '能量', 'waves.foldEnergy');
const winRes = makeCurveWin('共振曲线 · A–f', '共振', 'waves.foldRes');
const winWave = makeCurveWin('波形 · 质点振动图', '波形', 'waves.foldWave');
const winScope = makeCurveWin('示波器 · 波形 × 频谱', '示波', 'waves.foldScope');
const WINS = [winTape, winEnergy, winRes, winWave, winScope];
let winDraw = null;
function showWin(win, title, info, drawFn) {
  WINS.forEach((w) => { if (w !== win) w.show(false); });
  win.setHead(title, info);
  win.show(true);
  winDraw = drawFn;
}
function hideWins() {
  WINS.forEach((w) => w.show(false));
  winDraw = null;
}

/* ================= 任务系统（原版 steps 1:1 → 行动 chip） ================= */

let taskDefs = [];
const taskDone = new Set();
function renderTasks() {
  let box = document.querySelector('#lesson .lc-tasks');
  if (box) box.remove();
  if (!taskDefs.length) return;
  box = document.createElement('div');
  box.className = 'lc-tasks';
  taskDefs.forEach((t, i) => {
    const chip = document.createElement('div');
    chip.className = 'task-chip' + (taskDone.has(taskKey(i)) ? ' done' : '');
    chip.innerHTML = '<span class="tk-box">✓</span>';
    const txt = document.createElement('span');
    txt.textContent = t.t;
    chip.appendChild(txt);
    box.appendChild(chip);
  });
  document.getElementById('lesson').appendChild(box);
}
function taskKey(i) { return chapterIdx + ':' + i; }
function taskHit(key) {
  taskDefs.forEach((t, i) => {
    if (t.key === key && !taskDone.has(taskKey(i))) {
      taskDone.add(taskKey(i));
      renderTasks();
    }
  });
}

/* ================= 数据坞（原版 dock/CSV 1:1：记录表 + 拟合 + 导出） ================= */

const dockStore = {};   // chapterIdx -> { rows: [[...], ...] }
function dockRows(i) {
  if (!dockStore[i]) dockStore[i] = [];
  return dockStore[i];
}

const DOCKS = {
  0: {
    title: 'T–√m 记录（等时性 · 反推 k）',
    cols: ['√m（kg^½）', 'T（s）'],
    record() {
      const T = TAU * Math.sqrt(stSpring.m / stSpring.k);
      dockRows(0).push([Math.sqrt(stSpring.m), T]);
      return T;
    },
    fit(rows) {
      if (rows.length < 2) return null;
      const n = rows.length;
      let sx = 0, sy = 0, sxy = 0, sxx = 0;
      for (const [x, y] of rows) { sx += x; sy += y; sxy += x * y; sxx += x * x; }
      const den = n * sxx - sx * sx;
      if (Math.abs(den) < 1e-9) return null;
      const a = (n * sxy - sx * sy) / den;
      const kEst = Math.abs(a) > 1e-6 ? (TAU / a) ** 2 : NaN;
      return `线性拟合 T = a·√m，斜率 a = <b>${a.toFixed(3)}</b> s/kg^½ → 反推 k = (2π/a)² ≈ <b>${kEst.toFixed(1)}</b> N/m（当前设定 k = ${stSpring.k.toFixed(0)}）`;
    },
  },
  1: {
    title: 'T²–L 记录（逐点求 g）',
    cols: ['L（m）', 'T²（s²）'],
    record() {
      const p = stPen;
      const s2 = Math.sin(p.th0 / 2) ** 2;
      const T0 = TAU * Math.sqrt(p.L / p.g);
      const T = T0 * (1 + s2 / 4 + (9 * s2 * s2) / 64 + (25 * s2 ** 3) / 256);
      dockRows(1).push([p.L, T * T]);
      return T;
    },
    fit(rows) {
      if (rows.length < 2) return null;
      const n = rows.length;
      let sx = 0, sy = 0, sxy = 0, sxx = 0;
      for (const [x, y] of rows) { sx += x; sy += y; sxy += x * y; sxx += x * x; }
      const den = n * sxx - sx * sx;
      if (Math.abs(den) < 1e-9) return null;
      const a = (n * sxy - sx * sy) / den;
      const gEst = Math.abs(a) > 1e-9 ? (4 * Math.PI * Math.PI) / a : NaN;
      return `拟合 T² = a·L，斜率 a = <b>${a.toFixed(3)}</b> s²/m → g = 4π²/a ≈ <b>${gEst.toFixed(2)}</b> m/s²（设定 g = ${stPen.g.toFixed(1)}）`;
    },
  },
  3: {
    title: 'A–f 扫频记录（共振峰定位）',
    cols: ['f（Hz）', 'A（m）', 'γ'],
    record() {
      dockRows(3).push([stRes.fd, Math.min(stRes.Aest, 1.5), stRes.gam]);
    },
    fit(rows) {
      if (!rows.length) return null;
      let best = rows[0];
      for (const r of rows) if (r[1] > best[1]) best = r;
      return `已记录 <b>${rows.length}</b> 点；峰值 A = <b>${best[1].toFixed(2)}</b> m 出现在 f = <b>${best[0].toFixed(2)}</b> Hz（f₀ = ${stRes.f0.toFixed(2)} Hz）`;
    },
  },
  8: {
    title: '三向听测快照（多普勒公式对照）',
    cols: ['f₀（Hz）', 'vs/v', '前方 f′', '后方 f′', '侧面 f′'],
    record() {
      const r = dopplerThree();
      dockRows(8).push([stDop.fEmit, Math.abs(stDop.cartV) / DP_V, r.front, r.back, r.side]);
    },
    fit(rows) {
      if (!rows.length) return null;
      const r = rows[rows.length - 1];
      return `最近一笔：靠近侧 f′ ≈ <b>${r[2].toFixed(0)}</b> Hz，远离侧 ≈ <b>${r[3].toFixed(0)}</b> Hz（比值 ${r[3] > 0 ? (r[2] / r[3]).toFixed(2) : '—'}）——vs/v 越大差得越悬`;
    },
  },
  9: {
    title: '共鸣位置记录（两次位置测声速）',
    cols: ['L（m）', '谐频次数'],
    record() {
      const s = stTube;
      const lam = 340 / s.f;
      const ratio = (4 * s.L) / lam;
      const mo = Math.round((ratio - 1) / 2) * 2 + 1;
      dockRows(9).push([s.L, (mo + 1) / 2]);
      return mo;
    },
    fit(rows) {
      if (rows.length < 2) return null;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] !== rows[i - 1][1]) {
          const dL = Math.abs(rows[i][0] - rows[i - 1][0]);
          const v = 2 * dL * stTube.f;
          return `两次共鸣位置差 ΔL = <b>${dL.toFixed(3)}</b> m = λ/2 → 声速 v = 2ΔL·f ≈ <b>${v.toFixed(0)}</b> m/s（计算用 340）`;
        }
      }
      return null;
    },
  },
};

let dockUI = null;
function renderDock(i) {
  const lcDock = document.getElementById('lcDock');
  lcDock.innerHTML = '';
  const def = DOCKS[i];
  document.getElementById('accDock').classList.toggle('acc-empty', !def);
  dockUI = null;
  if (!def) return;
  const rows = dockRows(i);
  const title = document.createElement('div');
  title.className = 'dock-title';
  title.textContent = def.title;
  lcDock.appendChild(title);

  const table = document.createElement('table');
  table.className = 'dock-table';
  const thead = document.createElement('tr');
  def.cols.forEach((c) => {
    const th = document.createElement('th');
    th.textContent = c;
    thead.appendChild(th);
  });
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  const view = rows.slice(-7);
  view.forEach((r) => {
    const tr = document.createElement('tr');
    r.forEach((v) => {
      const td = document.createElement('td');
      td.textContent = typeof v === 'number' ? (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(3)) : String(v);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  lcDock.appendChild(table);
  if (!rows.length) {
    const empty = document.createElement('div');
    empty.className = 'dock-empty';
    empty.textContent = '还没有数据——点「记录一笔」把当前状态存进来，两笔以上自动出拟合。';
    lcDock.appendChild(empty);
  }

  const fitText = def.fit(rows);
  if (fitText) {
    const fit = document.createElement('div');
    fit.className = 'dock-fit';
    fit.innerHTML = fitText;
    lcDock.appendChild(fit);
  }

  const actions = document.createElement('div');
  actions.className = 'dock-actions';
  const recBtn = document.createElement('button');
  recBtn.type = 'button';
  recBtn.className = 'ctl-btn';
  recBtn.textContent = '✚ 记录一笔';
  recBtn.addEventListener('click', () => {
    def.record();
    if (chapterIdx === 0) taskHit('dockM');
    if (chapterIdx === 1) taskHit('dockL');
    if (chapterIdx === 9) taskHit('dockRes');
    renderDock(chapterIdx);
  });
  const csvBtn = document.createElement('button');
  csvBtn.type = 'button';
  csvBtn.className = 'ctl-btn';
  csvBtn.textContent = '⬇ 导出 CSV';
  csvBtn.addEventListener('click', () => exportCSV(i));
  const clrBtn = document.createElement('button');
  clrBtn.type = 'button';
  clrBtn.className = 'ctl-btn';
  clrBtn.textContent = '清空';
  clrBtn.addEventListener('click', () => { dockStore[i] = []; renderDock(i); });
  actions.appendChild(recBtn);
  actions.appendChild(csvBtn);
  actions.appendChild(clrBtn);
  lcDock.appendChild(actions);
  dockUI = { def, rows };
}

function exportCSV(i) {
  const def = DOCKS[i];
  if (!def) return;
  const rows = dockRows(i);
  const lines = [];
  lines.push('# EduLab WaveLab 数据坞');
  lines.push('# 章节,' + SECTIONS[i].title);
  lines.push('# 导出时间,' + new Date().toLocaleString('zh-CN'));
  lines.push(def.cols.join(','));
  for (const r of rows) lines.push(r.join(','));
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'waves-' + ['spring', 'pendulum', 'energy', 'resonance', 'wave', 'reflect', 'standing', 'ripple', 'doppler', 'sound', 'free', 'quiz'][i] + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('CSV 已导出（' + rows.length + ' 行）', 'ok');
}

/* ================= 各章仿真更新 ================= */

let curSec = 0;
let labReady = false;

/* —— 第一/三章：弹簧振子 —— */
function springSim(dt) {
  const s = stSpring;
  if (s.dragging) {
    s.x = s.dragX;
    s.phase = 0;
    s.tEnv = 0;
    s.A = Math.max(Math.abs(s.x), 0.02);
    s.v = 0;
  } else {
    const w0 = Math.sqrt(s.k / s.m);
    const om = s.gamma > 0 ? Math.sqrt(Math.max(w0 * w0 - s.gamma * s.gamma, 0.04)) : w0;
    if (s.playing) {
      s.phase += om * dt;
      if (s.gamma > 0) s.tEnv += dt;
    }
    const env = s.gamma > 0 ? s.A * Math.exp(-s.gamma * s.tEnv) : s.A;
    s.x = env * Math.cos(s.phase);
    s.v = s.gamma > 0
      ? env * (-s.gamma * Math.cos(s.phase) - om * Math.sin(s.phase))
      : -env * om * Math.sin(s.phase);
  }
  S.glider.position.x = s.x;
  const x1 = Math.max(s.x - 0.1, S.x0 + 0.06);
  rebuildTube(S.spring, helixX(S.x0, x1, TRACK_Y, 0.05, 9), 96, 6, 0.011);
}

function updateSpringChapter(dt) {
  springSim(dt);
  const s = stSpring;
  const w0 = Math.sqrt(s.k / s.m);
  const T = TAU / w0;
  if (curSec === 0) {
    if (s.playing || s.dragging) {
      s.tapeAcc += dt;
      while (s.tapeAcc >= 0.02) {
        s.tapeAcc -= 0.02;
        s.tape.push(s.x);
        if (s.tape.length > 320) s.tape.shift();
      }
    }
    if (s.tape.length > 240) taskHit('readTape');
    if (hud) {
      hud.set('x', s.x.toFixed(3) + ' m');
      hud.set('v', s.v.toFixed(2) + ' m/s');
      hud.set('T', T.toFixed(2) + ' s');
      hud.set('f', (w0 / TAU).toFixed(2) + ' Hz');
    }
    genDisplayDraw((w0 / TAU).toFixed(2) + ' Hz');
  } else {
    const Ep = 0.5 * s.k * s.x * s.x;
    const Ek = 0.5 * s.m * s.v * s.v;
    if (s.playing) {
      s.eAcc += dt;
      while (s.eAcc >= 0.03) {
        s.eAcc -= 0.03;
        s.eHist.push(Ep + Ek);
        if (s.eHist.length > 170) s.eHist.shift();
      }
    }
    if (s.eHist.length > 100) taskHit('watchEnergy');
    if (hud) {
      const E0 = 0.5 * s.k * s.A * s.A;
      hud.set('x', s.x.toFixed(3) + ' m');
      hud.set('Ep', (Ep / E0 * 100).toFixed(0) + '%');
      hud.set('Ek', (Ek / E0 * 100).toFixed(0) + '%');
      hud.set('E', ((Ep + Ek) / E0 * 100).toFixed(0) + '%');
    }
    genDisplayDraw('—');
  }
}

/* —— 第二章：单摆（完整非线性方程 + 光电门 + 秒表联动） —— */
function updatePendulum(dt) {
  const p = stPen;
  if (p.playing && !p.dragging) {
    const accel = p.meas && p.meas.on ? 5 : 1;
    const dtSim = dt * accel;
    const steps = Math.max(1, Math.ceil(dtSim / 0.008));
    const h = dtSim / steps;
    for (let i = 0; i < steps; i++) {
      p.prevTh = p.th;
      p.w += -(p.g / p.L) * Math.sin(p.th) * h;
      p.th += p.w * h;
      p.t += h;
      if (p.meas && p.meas.on) {
        if (p.prevTh < 0 && p.th >= 0 && p.w > 0) {
          if (!p.meas.armed) { p.meas.armed = true; p.meas.t0 = p.t; p.meas.count = 1; }
          else {
            p.meas.count++;
            if (p.meas.count > 30) {
              p.meas.on = false;
              const Tm = (p.t - p.meas.t0) / 30;
              p.Tm = Tm;
              p.gm = (4 * Math.PI * Math.PI * p.L) / (Tm * Tm);
              taskHit('measG');
              toast(`测量完成：T = ${Tm.toFixed(3)} s，g实测 = ${p.gm.toFixed(2)} m/s²${p.th0 > 10 * Math.PI / 180 ? '（摆角偏大，结果略偏小——小角度近似的误差）' : ''}`, 'ok');
              const btn = document.getElementById('measBtn');
              if (btn) btn.textContent = '⏱ 测 g 实验（30T）';
            }
          }
        }
      }
    }
  }
  const bx = PEN_PIVOT.x + p.L * Math.sin(p.th);
  const by = PEN_PIVOT.y - p.L * Math.cos(p.th);
  P.bob.position.set(bx, by, 0);
  P.bobRing.position.set(bx, by + 0.052, 0);
  P.bobHit.position.set(bx, by, 0);
  const dir = new THREE.Vector3(bx - PEN_PIVOT.x, by - PEN_PIVOT.y, 0).normalize();
  P.str.scale.y = p.L;
  P.str.position.copy(PEN_PIVOT).addScaledVector(dir, p.L / 2);
  P.str.quaternion.setFromUnitVectors(UP, dir);
  /* 光电门跟随摆球最低点 */
  P.gateG.position.y = clamp(PEN_PIVOT.y - p.L - 0.055, 0.98, 1.9);
  const crossing = Math.abs(p.th) < 0.06 && Math.abs(p.w) > 0.3;
  P.beam.material.opacity = crossing ? 0.85 : 0.4;
  const w0 = TAU * Math.sqrt(p.L / p.g);
  const s2 = Math.sin(p.th0 / 2) ** 2;
  const Tex = w0 / TAU === 0 ? 0 : (TAU * Math.sqrt(p.L / p.g)) * (1 + s2 / 4 + (9 * s2 * s2) / 64 + (25 * s2 ** 3) / 256);
  gateDisplayDraw(p.meas && p.meas.on
    ? (p.meas.armed ? `${Math.max(0, p.meas.count - 1)}/30` : 'READY')
    : 'T=' + Tex.toFixed(3));
  props.watchNeedle.rotation.z = -(p.t % 60) / 60 * TAU;
  if (hud) {
    hud.set('th', (p.th * 180 / Math.PI).toFixed(1) + '°');
    hud.set('T', (TAU * Math.sqrt(p.L / p.g)).toFixed(2) + ' s');
    hud.set('Tex', Tex.toFixed(2) + ' s');
    hud.set('g', p.g.toFixed(1) + ' m/s²');
    if (p.meas && p.meas.on) hud.set('Tm', p.meas.armed ? `测量中 ${Math.max(0, p.meas.count - 1)}/30` : '待过零…');
    else hud.set('Tm', p.Tm ? p.Tm.toFixed(3) + ' s' : '—');
    hud.set('gm', p.gm ? p.gm.toFixed(2) + ' m/s²' : '—');
  }
}

/* —— 第四章：受迫振动（扫频 + 记录采样） —— */
let sweepSampleAcc = 0;
function updateResonance(dt) {
  const r = stRes;
  const w0 = TAU * r.f0;
  const wd = TAU * r.fd;
  const ad = 0.35 * r.amp;
  if (r.sweeping) {
    r.sweepT += dt;
    r.fd = r.f0 * (0.25 + 1.75 * Math.min(r.sweepT / 16, 1));
    if (window.__waveSweepSlider) window.__waveSweepSlider.set(r.fd.toFixed(2));
    sweepSampleAcc += dt;
    if (sweepSampleAcc >= 0.55) {
      sweepSampleAcc = 0;
      if (DOCKS[3]) DOCKS[3].record();
      if (dockUI && chapterIdx === 3) renderDock(3);
    }
    if (r.sweepT > 17) {
      r.sweeping = false;
      taskHit('sweepDone');
      toast('扫频结束：峰的位置就在 f₀ 附近，去数据坞看记录点。', 'ok');
      const b = document.getElementById('sweepBtn');
      if (b) b.textContent = '⏱ 自动扫频';
    }
  }
  const a = -w0 * w0 * r.x - 2 * r.gam * r.v + ad * Math.cos(r.phiD);
  r.v += a * dt;
  r.x += r.v * dt;
  r.phiD += wd * dt;
  r.Aest = Math.hypot(r.x, Math.abs(wd) > 0.01 ? r.v / wd : 0);
  const xv = 0.3 * Math.tanh(r.x / 0.3);
  const topA = 0.028 * r.amp;
  const yTop = 1.78 + topA * Math.sin(r.phiD);
  const massY = 1.15 + xv;
  R.mass.position.y = massY;
  R.discG.rotation.z = -r.phiD;
  R.pin.position.set(Math.cos(r.phiD) * 0.03, 1.855 + Math.sin(r.phiD) * 0.03, 0.124);
  rebuildTube(R.spring, helixY(yTop, massY + 0.068, 0, 0.045, 8), 90, 6, 0.011);
  if (hud) {
    const Ass = ad / (2 * r.gam * w0);
    hud.set('fd', r.fd.toFixed(2) + ' Hz');
    hud.set('f0', r.f0.toFixed(2) + ' Hz');
    hud.set('Ass', Ass.toFixed(2) + ' m');
    hud.set('An', Math.min(r.Aest, 1.5).toFixed(2) + ' m');
  }
  genDisplayDraw(r.fd.toFixed(2) + ' Hz');
}

/* —— 第五章：质点列（波速可调 + 驱动杆联动） —— */
function updateRow(dt) {
  const s = stRow;
  const rate = (s.slow ? 0.25 : 1) * (s.playing ? 1 : 0);
  s.phi += TAU * s.f * dt * rate;
  const k = TAU / (s.v / s.f);
  const lon = s.pol === 'longitudinal';
  const pos = W5.line.geometry.attributes.position;
  for (let i = 0; i < ROW_N; i++) {
    const x = ROW_X0 + i * ROW_DX;
    const u = s.A * Math.sin(s.phi - k * (x - ROW_X0));
    const vu = s.A * TAU * s.f * Math.cos(s.phi - k * (x - ROW_X0)) * rate;
    const arr = s.arrows[i];
    if (lon) {
      const xx = x + u;
      s.balls[i].position.set(xx, STR_Y, 0);
      pos.setXYZ(i, xx, STR_Y, 0);
      if (arr.visible) {
        arr.position.set(xx + (vu >= 0 ? 0.1 : -0.1), STR_Y, 0);
        arr.rotation.set(0, 0, vu >= 0 ? -Math.PI / 2 : Math.PI / 2);
        arr.scale.setScalar(clamp(0.5 + Math.abs(vu) * 0.9, 0.4, 1.6));
      }
    } else {
      const y = STR_Y + u;
      s.balls[i].position.y = y;
      pos.setXYZ(i, x, y, 0);
      if (arr.visible) {
        arr.position.set(x, y + 0.1, 0);
        arr.rotation.set(vu >= 0 ? 0 : Math.PI, 0, 0);
        arr.scale.setScalar(clamp(0.5 + Math.abs(vu) * 0.9, 0.4, 1.6));
      }
    }
  }
  pos.needsUpdate = true;
  /* 驱动杆随波源振动 */
  if (lon) W5.driver.position.x = ROW_X0 - 0.09 + s.A * Math.sin(s.phi) * 2.2;
  else W5.driver.position.y = STR_Y + s.A * Math.sin(s.phi) * 2.2;
  /* 标记质点位移历史（质点振动图；while 按仿真时间补采样，与纸带同款） */
  if (s.playing) {
    s.histAcc = (s.histAcc || 0) + dt;
    s.hist = s.hist || [];
    while (s.histAcc >= 0.03) {
      s.histAcc -= 0.03;
      const mk = s.balls[s.markIdx].position;
      s.hist.push(lon ? mk.x - (ROW_X0 + s.markIdx * ROW_DX) : mk.y - STR_Y);
      if (s.hist.length > 260) s.hist.shift();
    }
    if (s.hist.length > 120) taskHit('markStill');
  }
  if (hud) {
    hud.set('f', s.f.toFixed(2) + ' Hz');
    hud.set('lam', (s.v / s.f).toFixed(2) + ' m');
    hud.set('v', s.v.toFixed(1) + ' m/s');
  }
  genDisplayDraw(s.f.toFixed(2) + ' Hz');
}

/* —— 第六/十一章：绳波引擎 —— */
function updateRef(dt) {
  const s = stRef;
  if (s.cont) {
    s.contAcc += dt;
    if (s.contAcc >= 1.4) { s.contAcc = 0; s.eng.emit(); s.nPulse++; }
  }
  s.eng.step(dt, s.end, null);
  const pts = ST6.pts;
  for (let i = 0; i < 90; i++) pts[i].y = STR_Y + s.eng.y[i];
  rebuildTube(ST6.string, stringCurve(pts), 110, 5, 0.011);
  if (hud) {
    hud.set('end', s.end === 'fixed' ? '固定端' : '自由端');
    hud.set('c', s.eng.c.toFixed(1) + ' m/s');
    hud.set('flip', s.end === 'fixed' ? '翻转（π）' : '不翻转');
    hud.set('n', String(s.nPulse));
  }
}

function updateFree(dt) {
  const s = stFree;
  const rate = (s.playing ? 1 : 0) * (s.slow ? 0.25 : 1);
  const dtr = dt * rate;
  if (s.driveOn) s.phi += TAU * s.f * dtr;
  s.eng.c = s.v;
  s.eng.step(dtr, s.end, s.driveOn
    ? () => [0.07 * Math.sin(s.phi), 0.07 * TAU * s.f * Math.cos(s.phi)]
    : null);
  const pts = ST11.pts;
  for (let i = 0; i < 90; i++) pts[i].y = STR_Y + s.eng.y[i];
  rebuildTube(ST11.string, stringCurve(pts), 110, 5, 0.011);
  if (hud) {
    hud.set('end', s.end === 'fixed' ? '固定端' : '自由端');
    hud.set('f', s.f.toFixed(2) + ' Hz');
    hud.set('v', s.v.toFixed(1) + ' m/s');
    hud.set('lam', (s.v / s.f).toFixed(2) + ' m');
  }
}

/* —— 第七章：驻波 / 两脉冲对撞 —— */
function updateStanding(dt) {
  const s = stSta;
  const k = TAU * s.f / STA_V;
  const A = s.A;
  const pts = STA.pts;
  const pInc = STA.inc.geometry.attributes.position;
  const pRef = STA.ref.geometry.attributes.position;
  if (s.demo === 'standing') {
    if (s.playing) s.phi += TAU * s.f * dt;
    for (let i = 0; i < STA_M; i++) {
      const xi = (i * STA_L) / (STA_M - 1);
      const y1 = A * Math.sin(s.phi - k * xi);
      const y2 = -A * Math.sin(s.phi + k * xi - 2 * k * STA_L);
      pts[i].y = STR_Y + y1 + y2;
      pInc.setXYZ(i, pts[i].x, STR_Y + y1, 0);
      pRef.setXYZ(i, pts[i].x, STR_Y + y2, 0);
    }
    pInc.needsUpdate = true;
    pRef.needsUpdate = true;
    STA.inc.visible = s.showComp;
    STA.ref.visible = s.showComp;
    const nFloat = (2 * STA_L * s.f) / STA_V;
    const n = Math.round(nFloat);
    const matched = n >= 1 && Math.abs(nFloat - n) < 0.03;
    if (matched && s.showNodes && !s.nodeCounted) {
      s.nodeCounted = true;
      taskHit('countNodes');
      if (n >= 1 && n <= 5) s.matchedN.add(n);
      if (s.matchedN.size >= 5) taskHit('fiveN');
    }
    if (!matched) s.nodeCounted = false;
    STA.nodeRings.forEach((r, i) => {
      if (matched && s.showNodes && i < n - 1) {
        r.visible = true;
        r.position.x = (STA_L * (n - (i + 1)) / n) - STA_L / 2;
      } else r.visible = false;
    });
    if (hud) {
      hud.set('f', s.f.toFixed(2) + ' Hz');
      hud.set('lam', (STA_V / s.f).toFixed(2) + ' m');
      hud.set('node', matched ? String(n + 1) + '（含两端）' : '—');
      hud.set('anti', matched ? String(n) : '—');
      hud.set('st', matched ? '驻波已形成 ✓' : '失谐游移…');
    }
    genDisplayDraw(s.f.toFixed(2) + ' Hz');
  } else {
    /* 两颗相向脉冲：解析叠加，相遇处振幅翻倍，随后各自穿过 */
    if (s.playing) s.emitT += dt;
    const Tcycle = STA_L / STA_V + s.emitGap;
    const tau = s.emitT % Tcycle;
    const w = 0.085;
    const xA = -STA_L / 2 + STA_V * tau;
    const xB = STA_L / 2 - STA_V * tau;
    STA.inc.visible = false;
    STA.ref.visible = false;
    STA.nodeRings.forEach((r) => { r.visible = false; });
    let peak = 0;
    for (let i = 0; i < STA_M; i++) {
      const xi = (i * STA_L) / (STA_M - 1);
      const g1 = tau <= STA_L / STA_V ? A * Math.exp(-((xi - xA) ** 2) / (w * w)) : 0;
      const g2 = tau <= STA_L / STA_V ? A * Math.exp(-((xi - xB) ** 2) / (w * w)) : 0;
      pts[i].y = STR_Y + g1 + g2;
      pInc.setXYZ(i, pts[i].x, STR_Y + g1, 0);
      pRef.setXYZ(i, pts[i].x, STR_Y + g2, 0);
      peak = Math.max(peak, g1 + g2);
    }
    pInc.needsUpdate = true;
    pRef.needsUpdate = true;
    if (peak > A * 1.7) taskHit('collision');
    if (hud) {
      hud.set('f', '—');
      hud.set('lam', '—');
      hud.set('node', '—');
      hud.set('anti', '—');
      hud.set('st', tau <= STA_L / STA_V ? '双脉冲相向行进中…' : '（间歇，即将重新发射）');
    }
  }
  STA.pegs.forEach((peg, i) => { peg.rotation.y = Math.sin(s.phi * 0.5 + i) * 0.3; });
}

/* —— 第八章：水波槽 —— */
function updateTank(dt) {
  if (!tank.paused) tankDrawFrame(dt);
  if (hud) {
    hud.set('mode', tank.mode === 'double' ? '双源干涉' : '单缝衍射');
    hud.set('lam', tank.lambda.toFixed(2) + ' m');
    hud.set('v', tank.v.toFixed(1) + ' m/s');
    hud.set('f', (tank.v / tank.lambda).toFixed(1) + ' Hz');
    hud.set('lines', tank.mode === 'double' ? `${2 * Math.floor(tank.sep / tank.lambda) + 1} 条（由 d/λ 决定）` : '—');
  }
}

/* —— 第九章：多普勒（车轮 / 警灯 / 听者三向 / 马赫锥） —— */
function dopplerThree() {
  const s = stDop;
  const f0 = s.fEmit;
  const calc = (lx, lz) => {
    const dx = lx - s.cartX, dz = lz;
    const dist = Math.hypot(dx, dz);
    if (dist < 1e-4) return NaN;
    const closing = s.cartV * (dx / dist);
    const den = DP_V - closing;
    return den > 0.08 ? (f0 * DP_V) / den : NaN;
  };
  return {
    front: calc(0.85, 0),
    back: calc(-0.85, 0),
    side: calc(0, 0.55),
  };
}
let beaconClock = 0;
function updateDoppler(dt, now) {
  const s = stDop;
  s.cartX += s.cartV * dt;
  if (s.cartX > 1.55) { s.cartX = 1.55; s.cartV = -Math.abs(s.cartV); }
  if (s.cartX < -1.55) { s.cartX = -1.55; s.cartV = Math.abs(s.cartV); }
  DP.cart.position.x = s.cartX;
  DP.cart.rotation.y = s.cartV >= 0 ? 0 : Math.PI;
  /* 车轮滚动 */
  const spin = s.cartV * dt / 0.026;
  DP.wheels.forEach((w) => { w.rotation.y -= spin; });
  /* 警灯爆闪（发声时更急促） */
  beaconClock += dt * (s.soundOn ? 7 : 3);
  const onR = Math.sin(beaconClock * TAU * 0.5) > 0;
  DP.bcR.emissiveIntensity = onR ? 1.6 : 0.25;
  DP.bcB.emissiveIntensity = onR ? 0.25 : 1.6;
  /* 听者标记 + 耳侧声波 */
  for (const key of Object.keys(DP.listenMarks)) {
    DP.listenMarks[key].visible = stDop.listen === key;
  }
  const earOn = s.soundOn ? 0.45 + 0.25 * Math.sin(now * 9) : Math.max(0, (DP.earAlpha || 0) - dt * 2);
  DP.earAlpha = earOn;
  DP.earArcs.forEach((arc, i) => {
    arc.material.opacity = earOn * (1 - i * 0.4);
    const sc = 1 + 0.2 * Math.sin(now * 9 + i);
    arc.scale.set(sc, sc, 1);
  });
  /* 发射波前（颜色按发射时刻的靠近/远离：蓝移 / 红移） */
  s.emitAcc += dt;
  const period = 1 / s.fEmit;
  while (s.emitAcc >= period) {
    s.emitAcc -= period;
    const ring = s.rings[s.ringIdx];
    s.ringIdx = (s.ringIdx + 1) % 24;
    ring.active = true;
    ring.r = 0.03;
    ring.mesh.position.x = s.cartX;
    ring.mesh.position.z = 0;
    const sgn = s.cartX >= 0 ? 1 : -1;
    const closing = s.cartV * sgn;
    ring.blue = closing > 0;
    ring.mesh.material.color.set(ring.blue ? 0x9fc8ff : 0xff9a7a);
  }
  for (const ring of s.rings) {
    if (!ring.active) continue;
    ring.r += DP_V * dt;
    if (ring.r > 2.3) { ring.active = false; ring.mesh.visible = false; continue; }
    ring.mesh.visible = s.waveOn;
    ring.mesh.scale.set(ring.r, ring.r, 1);
    ring.mesh.material.opacity = 0.55 * (1 - ring.r / 2.3);
  }
  /* 马赫锥 */
  const ratio = Math.abs(s.cartV) / DP_V;
  if (ratio > 1) {
    DP.cone.visible = true;
    const mu = Math.asin(1 / ratio);
    const baseR = Math.tan(mu) * 1.15;
    DP.cone.scale.set(baseR, 1, baseR);
    const back = s.cartV >= 0 ? 1 : -1;
    DP.cone.rotation.z = s.cartV >= 0 ? Math.PI / 2 : -Math.PI / 2;
    DP.cone.position.set(s.cartX + back * 0.575, 0.955, 0);
    if (!s.shockToasted) {
      s.shockToasted = true;
      taskHit('supersonic');
      toast(`源速已超过声速（${ratio.toFixed(2)} 倍）：波面叠成马赫锥，sinμ = v/vₛ = 1/${ratio.toFixed(2)}，锥面即激波。`, 'warn');
    }
  } else {
    DP.cone.visible = false;
  }
  /* 观测者（x=0）多普勒 + 三向听测 */
  const sgn = s.cartX >= 0 ? 1 : -1;
  const vr = s.cartV * sgn;
  const den = DP_V + vr;
  const shock = den < 0.15;
  const fp = shock ? 0 : (s.fEmit * DP_V) / den;
  const three = dopplerThree();
  const status = shock
    ? (ratio > 1 ? '马赫锥！波面叠成锥面（激波）' : '贴近声速：波前压缩成「墙」')
    : vr < -0.01 ? '靠近（音调升高）' : vr > 0.01 ? '远离（音调降低）' : '经过听者';
  if (s.tone) {
    const sel = stDop.listen === 'front' ? three.front : stDop.listen === 'back' ? three.back : three.side;
    if (!isFinite(sel) || shock) {
      s.tone.set(200, 0.0001);
      if (!s.shockToasted && ratio > 0.9) { /* 靠近声速由马赫锥分支提示 */ }
    } else {
      s.tone.set(sel * 110, 0.07);
    }
  }
  if (hud) {
    hud.set('f', s.fEmit.toFixed(1) + ' Hz');
    hud.set('vs', ratio.toFixed(2));
    hud.set('ff', isFinite(three.front) ? three.front.toFixed(0) + ' Hz' : '—');
    hud.set('fb', isFinite(three.back) ? three.back.toFixed(0) + ' Hz' : '—');
    hud.set('fs', isFinite(three.side) ? three.side.toFixed(0) + ' Hz' : '—');
    hud.set('st', status);
  }
  genDisplayDraw(s.fEmit.toFixed(1) + ' Hz');
}

/* —— 第十章：共鸣管（LED 声强柱 + 水面） —— */
let ledCount = -1;
function updateTube(dt) {
  const s = stTube;
  s.phiS += TAU * s.f / 10 * dt;
  s.phiV += TAU * 14 * dt;
  const lam = 340 / s.f;
  const ratio = (4 * s.L) / lam;
  const mo = Math.round((ratio - 1) / 2) * 2 + 1;
  const err = Math.abs(ratio - mo);
  const res = 1 / (1 + (err * 7) * (err * 7));
  s.phiR += dt * (0.5 + 1.4 * res);
  if (res > 0.5) taskHit('resonate');
  const fillH = TUBE_H - s.L;
  T10.water.scale.y = Math.max(fillH, 0.001);
  T10.water.position.y = TUBE_BOT + Math.max(fillH, 0.001) / 2;
  T10.waterTop.position.y = TUBE_BOT + Math.max(fillH, 0.001) + 0.002;
  /* 音叉振动（双臂张合） */
  const vib = s.soundOn ? 0.05 * Math.sin(s.phiV) : 0;
  T10.fork.scale.x = 1 + vib * 0.4;
  T10.fork.position.y = 2.06 + (s.soundOn ? Math.sin(s.phiV * 0.5) * 0.004 : 0);
  /* LED 柱 */
  const loud = s.amp * (0.2 + 1.6 * res);
  const cnt = Math.round(clamp(loud, 0, 1) * 12);
  if (cnt !== ledCount) {
    ledCount = cnt;
    T10.ledSegs.forEach((seg, i) => {
      seg.visible = i < cnt;
    });
  }
  if (s.tone) s.tone.set(s.f, Math.min(0.1, 0.05 * s.amp * (1 + 0.8 * res)));
  if (hud) {
    hud.set('f', s.f.toFixed(0) + ' Hz');
    hud.set('lam', lam.toFixed(2) + ' m');
    hud.set('L', s.L.toFixed(2) + ' m');
    hud.set('res', res > 0.5 ? (mo === 1 ? '共鸣！基频 λ/4' : `共鸣！${(mo + 1) / 2} 次谐频`) : err < 0.25 ? '接近共鸣' : '失谐');
  }
  genDisplayDraw((s.f / 1000).toFixed(2) + ' kHz');
}

/* ================= 曲线窗绘制 ================= */

function drawTape() {
  const { ctx, W, H } = prepCanvas(winTape.cv);
  const p = pal();
  ctx.fillStyle = '#f5efdd';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#dcd5c2';
  for (let y = 10; y < H; y += 24) {
    ctx.beginPath(); ctx.arc(12, y, 3.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(W - 12, y, 3.5, 0, TAU); ctx.fill();
  }
  const midY = H / 2;
  ctx.strokeStyle = 'rgba(90,96,108,0.4)';
  ctx.setLineDash([5, 6]);
  ctx.beginPath(); ctx.moveTo(24, midY); ctx.lineTo(W - 24, midY); ctx.stroke();
  ctx.setLineDash([]);
  const tape = stSpring.tape;
  const step = (W - 60) / 319;
  ctx.strokeStyle = '#c9402e';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let i = 0; i < tape.length; i++) {
    const px = W - 30 - (tape.length - 1 - i) * step;
    const py = midY - (tape[i] / 0.32) * (H * 0.38);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  if (tape.length) {
    ctx.fillStyle = '#c9402e';
    ctx.beginPath(); ctx.arc(W - 30, midY - (tape[tape.length - 1] / 0.32) * (H * 0.38), 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a8272';
    ctx.font = FONT;
    ctx.fillText('笔（固定）→ 纸带匀速左移', 30, 20);
  }
}

function drawEnergy() {
  const { ctx, W, H } = prepCanvas(winEnergy.cv);
  ctx.fillStyle = '#131a24';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let gy = 1; gy < 5; gy++) {
    ctx.beginPath(); ctx.moveTo(170, (H - 50) * gy / 5 + 20); ctx.lineTo(W - 16, (H - 50) * gy / 5 + 20); ctx.stroke();
  }
  const E0 = 0.5 * stSpring.k * stSpring.A * stSpring.A || 1;
  const barH = H - 70;
  function bar(x, frac, color, name) {
    frac = clamp(frac, 0, 1);
    ctx.fillStyle = color;
    ctx.fillRect(x, 20 + (1 - frac) * barH, 46, frac * barH);
    ctx.fillStyle = '#dfe6ee';
    ctx.font = FONTB;
    ctx.textAlign = 'center';
    ctx.fillText(name, x + 23, H - 28);
  }
  const Ep = 0.5 * stSpring.k * stSpring.x * stSpring.x;
  const Ek = 0.5 * stSpring.m * stSpring.v * stSpring.v;
  bar(50, Ep / E0, '#ffb35c', 'Ep 势能');
  bar(118, Ek / E0, '#7fd0ff', 'Ek 动能');
  ctx.strokeStyle = '#7ee2a8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  const hist = stSpring.eHist;
  for (let i = 0; i < hist.length; i++) {
    const px = 190 + (i / 169) * (W - 220);
    const py = 20 + (1 - clamp(hist[i] / E0, 0, 1)) * barH;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = '#8a94a4';
  ctx.textAlign = 'left';
  ctx.font = FONT;
  ctx.fillText('总机械能 E（绿线，无阻尼时应为水平直线）', 190, H - 28);
}

function drawResCurve() {
  const { ctx, W, H } = prepCanvas(winRes.cv);
  ctx.fillStyle = '#131a24';
  ctx.fillRect(0, 0, W, H);
  const mL = 40, mR = 14, mT = 16, mB = 30;
  const pw = W - mL - mR, ph2 = H - mT - mB;
  const r = stRes;
  const w0 = TAU * r.f0;
  const ad = 0.35 * r.amp;
  const Aof = (fr) => {
    const w = TAU * r.f0 * fr;
    return ad / Math.sqrt(Math.pow(w0 * w0 - w * w, 2) + Math.pow(2 * r.gam * w, 2));
  };
  const A1 = ad / (2 * r.gam * w0);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.fillStyle = '#8a94a4';
  ctx.font = '11px sans-serif';
  ctx.lineWidth = 1;
  for (const fr of [0.5, 1, 1.5, 2]) {
    const px = mL + ((fr - 0.2) / 1.8) * pw;
    ctx.beginPath(); ctx.moveTo(px, mT); ctx.lineTo(px, mT + ph2); ctx.stroke();
    ctx.fillText(fr === 1 ? 'f₀' : fr + 'f₀', px - 8, H - 12);
  }
  ctx.strokeStyle = '#ffc46b';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const fr = 0.2 + (i / 120) * 1.8;
    const py = mT + (1 - clamp(Aof(fr) / A1, 0, 1.05)) * ph2;
    const px = mL + ((fr - 0.2) / 1.8) * pw;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  /* 数据坞扫频记录点（实测散点） */
  const rows = dockRows(3);
  ctx.fillStyle = '#7ee2a8';
  for (const [fr, A] of rows) {
    const px = mL + ((fr - 0.2) / 1.8) * pw;
    const py = mT + (1 - clamp(A / A1, 0, 1.05)) * ph2;
    ctx.beginPath(); ctx.arc(px, py, 2.6, 0, TAU); ctx.fill();
  }
  const frNow = r.fd / r.f0;
  const mx = mL + ((frNow - 0.2) / 1.8) * pw;
  ctx.strokeStyle = 'rgba(126,226,168,0.8)';
  ctx.setLineDash([4, 5]);
  ctx.beginPath(); ctx.moveTo(mx, mT); ctx.lineTo(mx, mT + ph2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#7ee2a8';
  ctx.beginPath();
  ctx.arc(mx, mT + (1 - clamp(r.Aest / A1, 0, 1.05)) * ph2, 4.5, 0, TAU);
  ctx.fill();
  ctx.fillText('A/A稳态最大', 6, 14);
}

function drawWaveRow() {
  const { ctx, W, H } = prepCanvas(winWave.cv);
  ctx.fillStyle = '#131a24';
  ctx.fillRect(0, 0, W, H);
  const midY = H * 0.42;
  const s = stRow;
  const k = TAU / (s.v / s.f);
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(10, midY); ctx.lineTo(W - 10, midY); ctx.stroke();
  /* 波形快照 */
  ctx.strokeStyle = '#8fd3ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let px = 10; px <= W - 10; px += 2) {
    const xw = ROW_X0 + ((px - 10) / (W - 20)) * (ROW_N - 1) * ROW_DX;
    const lon = s.pol === 'longitudinal';
    const u = lon
      ? 0
      : s.A * Math.sin(s.phi - k * (xw - ROW_X0));
    const y = midY - (u / 0.14) * (H * 0.32);
    if (px === 10) ctx.moveTo(px, y); else ctx.lineTo(px, y);
  }
  ctx.stroke();
  /* 标记质点振动图（时间轴在下方） */
  const hist = s.hist || [];
  const hMid = H - 34;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.moveTo(10, hMid); ctx.lineTo(W - 10, hMid); ctx.stroke();
  ctx.strokeStyle = '#ffc46b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  const step = (W - 20) / 259;
  for (let i = 0; i < hist.length; i++) {
    const px = W - 10 - (hist.length - 1 - i) * step;
    const py = hMid - clamp(hist[i] / 0.14, -1, 1) * 20;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  /* 标记点当前位置 */
  const mkBall = s.balls[s.markIdx];
  if (mkBall) {
    const mx = 10 + ((mkBall.position.x - ROW_X0) / ((ROW_N - 1) * ROW_DX)) * (W - 20);
    ctx.fillStyle = '#e8674a';
    ctx.beginPath();
    ctx.arc(mx, midY - clamp((s.pol === 'longitudinal' ? 0 : mkBall.position.y - STR_Y) / 0.14, -1, 1) * (H * 0.32), 4, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#8a94a4';
  ctx.font = FONT;
  ctx.fillText('上：波形快照（y–x）', 12, 16);
  ctx.fillText('下：红色标记珠的位移–时间线', 12, H - 8);
}

function drawScope() {
  const { ctx, W, H } = prepCanvas(winScope.cv);
  const waveH = H * 0.62;
  ctx.fillStyle = '#10161f';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= 8; gx++) {
    ctx.beginPath(); ctx.moveTo(gx * W / 8, 0); ctx.lineTo(gx * W / 8, waveH); ctx.stroke();
  }
  const midY = waveH / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();
  const harms = INSTR[stTube.inst].h;
  const wave = (ph2) => {
    let acc = 0;
    for (const [hh, aa] of harms) acc += aa * Math.sin(hh * ph2);
    return acc;
  };
  ctx.strokeStyle = '#7fd0ff';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  const maxA = Math.max(...harms.map(([hh, aa]) => aa), 0.001);
  for (let px2 = 0; px2 <= W; px2 += 2) {
    const ph2 = stTube.phiS + (px2 / W) * TAU * 3;
    const y = midY - (wave(ph2) / maxA) * stTube.amp * 0.34 * waveH * 0.5;
    if (px2 === 0) ctx.moveTo(px2, y); else ctx.lineTo(px2, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#8a94a4';
  ctx.font = FONTB;
  ctx.fillText('频谱（各次谐波相对振幅）', 14, waveH + 18);
  const specY = H - 34;
  const barW = 26;
  for (let n = 1; n <= 8; n++) {
    const amp = (harms.find(([hh]) => hh === n) || [0, 0])[1];
    const bx = 14 + (n - 1) * (barW + 10);
    const bh = clamp(amp, 0, 1) * 42;
    ctx.fillStyle = n === 1 ? '#ffc46b' : '#7fd0ff';
    ctx.fillRect(bx, specY - bh, barW, bh);
    ctx.fillStyle = '#8a94a4';
    ctx.font = '10px sans-serif';
    ctx.fillText(n + 'f', bx + 6, specY + 12);
  }
  const lam = 340 / stTube.f;
  const ratio = (4 * stTube.L) / lam;
  const mo = Math.round((ratio - 1) / 2) * 2 + 1;
  const err = Math.abs(ratio - mo);
  const res = 1 / (1 + (err * 7) * (err * 7));
  const gx0 = 14 + 8 * (barW + 10) + 16;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(gx0, specY - 12, W - gx0 - 14, 12);
  ctx.fillStyle = res > 0.5 ? '#7ee2a8' : '#e8674a';
  ctx.fillRect(gx0, specY - 12, (W - gx0 - 14) * clamp(res, 0.02, 1), 12);
  ctx.fillStyle = '#dfe6ee';
  ctx.font = FONTB;
  ctx.fillText(res > 0.5 ? '空气柱共鸣！声强大增' : '共鸣增益', gx0, specY - 18);
}

/* ================= 章节定义（原版 11 章文案块 1:1 改写 + 随堂检测） ================= */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;

function hideAllStations() {
  stSpring.group.visible = false;
  stPen.group.visible = false;
  stRes.group.visible = false;
  stRow.group.visible = false;
  stRef.group.visible = false;
  stSta.group.visible = false;
  stDop.group.visible = false;
  stTube.group.visible = false;
  stFree.group.visible = false;
  hideWins();
  tankCanvas.style.display = 'none';
  setHint(null);
  window.__waveSweepSlider = null;
}

function playBtn(state) {
  const b = ctl.button({
    label: state.playing ? '⏸ 暂停' : '▶ 播放',
    onClick: () => {
      state.playing = !state.playing;
      b.textContent = state.playing ? '⏸ 暂停' : '▶ 播放';
      b.classList.toggle('active', state.playing);
    },
    active: true,
  });
  return b;
}

const SECTIONS = [
  {
    title: '弹簧振子',
    cam: [0.32, 1.62, 1.85], tgt: [0, 1.04, 0],
    html: `<p><b>弹簧振子</b>是最简的振动模型：轻弹簧（劲度系数 k）一头固定，另一头拴着质量 m 的滑块，在气垫导轨上几乎不受摩擦。</p>
<p class="eq">F = −kx　x = A·cos(ωt)　T = 2π√(m/k)</p>
<p>回复力总把滑块往回拉，大小与位移成正比——这正是<b>简谐运动</b>的定义。右侧「纸带」匀速左移，笔在纸上画出的 x–t 曲线是一根标准正弦。</p>
<p>试一试：改 m 或 k，周期跟着变；只动振幅 A，周期<span class="hl">纹丝不动</span>（等时性）。滑块可以<span class="hl">按住直接拖拽</span>拉开再松手。</p>`,
    tasks: [
      { key: 'drag', t: '按住滑块拖开一段距离再松手' },
      { key: 'readTape', t: '盯纸带曲线，读出一个完整周期' },
      { key: 'ampA', t: '只调振幅，验证周期纹丝不动' },
      { key: 'dockM', t: '改 m 并在数据坞记一笔，凑出 T–√m 直线' },
    ],
    enter() {
      hideAllStations();
      stSpring.group.visible = true;
      Object.assign(stSpring, { A: 0.18, m: 0.8, k: 24, gamma: 0, phase: 0, tEnv: 0, playing: true, dragging: false, tape: [], tapeAcc: 0, eHist: [], eAcc: 0 });
      setHUD([['x', '位移 x'], ['v', '速度 v'], ['T', 'T 理论'], ['f', '频率 f']]);
      showWin(winTape, '纸带 · x–t 图像', '振子位移随时间', drawTape);
      ctl.clear();
      ctl.slider({ label: '振幅 A', min: 0.05, max: 0.3, step: 0.01, value: stSpring.A, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { stSpring.x *= v / stSpring.A; stSpring.A = v; taskHit('ampA'); } });
      ctl.slider({ label: '质量 m', min: 0.2, max: 2, step: 0.05, value: stSpring.m, fmt: (v) => v.toFixed(2) + ' kg', onInput: (v) => { stSpring.m = v; } });
      ctl.slider({ label: '劲度 k', min: 5, max: 60, step: 1, value: stSpring.k, fmt: (v) => v + ' N/m', onInput: (v) => { stSpring.k = v; } });
      playBtn(stSpring);
      setHint('T = 2π√(m/k)，跟振幅没关系；滑块能直接拖');
    },
  },
  {
    title: '单摆',
    cam: [1.0, 1.8, 2.3], tgt: [0, 1.5, 0],
    html: `<p><b>单摆</b>：一根细线（长 L）吊着小球。摆角很小（≤10°）时，回复力近似 F ≈ −(mg/L)·x，摆动就是简谐运动。</p>
<p class="eq">T = 2π√(L/g)</p>
<p>周期跟摆球质量、摆幅大小（小角时）都不相干，只看摆长 L 和当地 g——这就是<b>等时性</b>，也是测 g 的入口：把 T²、L 逐点记进数据坞，拟合直线斜率 a = 4π²/g，一除便出 g。</p>
<p>摆角拉到 30° 开外，真实周期会比公式<b>偏大</b>（读数卡「T 大摆角」带级数修正）；换到月球或火星，摆一下子慢下来。</p>
<p>摆球可以<span class="hl">直接拖拽</span>拉开；「测 g 实验」自动计时 30 个全振动（5 倍速），光电门数显同步。</p>`,
    tasks: [
      { key: 'drag', t: '拖住摆球拉开一个角度后放手' },
      { key: 'dockL', t: '换几档摆长，各记一笔 T²' },
      { key: 'fitG', t: '用数据坞拟合斜率倒推出 g' },
      { key: 'bigTheta', t: '把摆角拉大或切到月球，比较周期' },
    ],
    enter() {
      hideAllStations();
      stPen.group.visible = true;
      Object.assign(stPen, { L: 0.6, g: 9.8, playing: true, dragging: false });
      resetPendulum();
      setHUD([['th', '摆角 θ'], ['T', 'T 小角度'], ['Tex', 'T 大摆角'], ['g', 'g 设定'], ['Tm', 'T 实测'], ['gm', 'g 实测']]);
      genDisplayDraw('—');
      ctl.clear();
      ctl.slider({ label: '摆长 L', min: 0.3, max: 1.0, step: 0.02, value: stPen.L, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { stPen.L = v; if (!stPen.meas || !stPen.meas.on) resetPendulum(); } });
      ctl.slider({ label: '初始摆角 θ₀', min: 2, max: 70, step: 1, value: 12, fmt: (v) => v + '°', onInput: (v) => { stPen.th0 = v * Math.PI / 180; if (v > 30) taskHit('bigTheta'); if (!stPen.meas || !stPen.meas.on) resetPendulum(); } });
      ctl.seg({
        options: [{ label: '地球 9.8', value: 9.8 }, { label: '月球 1.62', value: 1.62 }, { label: '火星 3.71', value: 3.71 }, { label: '木星 24.8', value: 24.8 }],
        value: 9.8,
        onChange: (v) => { stPen.g = v; if (v !== 9.8) taskHit('bigTheta'); },
      });
      const mb = ctl.button({
        label: '⏱ 测 g 实验（30T）',
        onClick: () => {
          if (stPen.meas && stPen.meas.on) { stPen.meas = null; mb.textContent = '⏱ 测 g 实验（30T）'; return; }
          resetPendulum();
          stPen.meas = { on: true, armed: false, count: 0, t0: 0 };
          mb.textContent = '测量中…（再点取消）';
          toast('开始测量：自动计时 30 个全振动（5 倍速），从第一次过最低点起算。', 'ok');
        },
      });
      mb.id = 'measBtn';
      playBtn(stPen);
      ctl.button({ label: '↺ 重新释放', onClick: () => resetPendulum() });
      setHint('摆角 ≤10° 才算小角度；θ₀ 越大实测 T 偏得越多');
    },
  },
  {
    title: '简谐运动的能量',
    cam: [0.32, 1.62, 1.85], tgt: [0, 1.04, 0],
    html: `<p>振动的能量在<b>动能</b>与<b>势能</b>之间来回倒手：</p>
<p class="eq">Ep = ½kx²　Ek = ½mv²　E = ½kA²</p>
<p>拉到最远处势能封顶、动能为零；冲过平衡位置时动能封顶、势能为零。无阻尼时总机械能 <span class="hl">一分不减</span>。</p>
<p>合上「阻尼」，机械能一点点变成内能，振幅按指数走低——现实里的振动最终都这样停下。但留心：<b>慢下来的只是振幅，周期几乎不走样</b>。曲线窗里两根能量柱与绿色总线实时对照。</p>`,
    tasks: [
      { key: 'watchEnergy', t: '看两根能量柱轮流登顶' },
      { key: 'dampOn', t: '打开阻尼，看振幅一路走低' },
      { key: 'dampCmp', t: '开关阻尼各跑一遍，对比包络' },
    ],
    enter() {
      hideAllStations();
      stSpring.group.visible = true;
      Object.assign(stSpring, { A: 0.2, m: 0.8, k: 24, gamma: 0, phase: 0, tEnv: 0, playing: true, dragging: false, tape: [], tapeAcc: 0, eHist: [], eAcc: 0, dampStates: new Set(['off']) });
      setHUD([['x', '位移 x'], ['Ep', '势能 Ep'], ['Ek', '动能 Ek'], ['E', '总能量 E']]);
      showWin(winEnergy, '能量转化 · 柱 × 总线', 'Ep / Ek / E', drawEnergy);
      genDisplayDraw('—');
      ctl.clear();
      ctl.slider({ label: '振幅 A', min: 0.05, max: 0.3, step: 0.01, value: stSpring.A, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { stSpring.x *= v / stSpring.A; stSpring.A = v; } });
      ctl.slider({ label: '劲度 k', min: 5, max: 60, step: 1, value: stSpring.k, fmt: (v) => v + ' N/m', onInput: (v) => { stSpring.k = v; } });
      ctl.toggle({
        label: '阻尼', value: false,
        onChange: (v) => {
          stSpring.gamma = v ? 0.12 : 0;
          if (!v) stSpring.tEnv = 0;
          if (v) taskHit('dampOn');
          stSpring.dampStates.add(v ? 'on' : 'off');
          if (stSpring.dampStates.size >= 2) taskHit('dampCmp');
        },
      });
      playBtn(stSpring);
      setHint('Ep 与 Ek 此消彼长；开阻尼只削振幅不改周期');
    },
  },
  {
    title: '受迫振动与共振',
    cam: [0.85, 1.75, 2.2], tgt: [0, 1.5, 0],
    html: `<p>电机带着偏心轮，让弹簧上端周期性上下牵动，振子在<b>驱动力</b>下做受迫振动。稳态后振子的频率就是<span class="hl">驱动频率</span>，跟固有频率无关。</p>
<p class="eq">f₀ = (1/2π)·√(k/m)　A稳 = F₀/(2γω₀)</p>
<p>驱动频率越贴着<b>固有频率</b>，振幅越大；两者重合时振幅最大——<b>共振</b>。点「自动扫频」，机器替你从低到高扫一遍，实测点会落进共振曲线，也存进数据坞。</p>
<p>阻尼越小峰越尖越冲。过桥便步走、洗衣机装减震，都是在躲这根尖峰。改完频率后振幅要过一小段时间才重新稳定（暂态过程）。</p>`,
    tasks: [
      { key: 'chgFd', t: '手动调驱动频率，等振幅稳下来' },
      { key: 'sweep', t: '点自动扫频，扫出整条 A–f 曲线' },
      { key: 'sweepDone', t: '换一档阻尼再扫一次，对比峰形' },
    ],
    enter() {
      hideAllStations();
      stRes.group.visible = true;
      Object.assign(stRes, { fd: 0.9, gam: 0.16, amp: 0.8, x: 0, v: 0, phiD: 0, sweeping: false, sweepT: 0, Aest: 0 });
      setHUD([['fd', 'f 驱动'], ['f0', 'f 固有'], ['Ass', 'A 稳态理论'], ['An', 'A 当前']]);
      showWin(winRes, '共振曲线 · A–f', '理论线 + 扫频实测点', drawResCurve);
      ctl.clear();
      const sl = ctl.slider({ label: '驱动频率', min: 0.18, max: 1.8, step: 0.02, value: stRes.fd, fmt: (v) => v.toFixed(2) + ' Hz', onInput: (v) => { stRes.fd = v; stRes.sweeping = false; taskHit('chgFd'); const b = document.getElementById('sweepBtn'); if (b) b.textContent = '⏱ 自动扫频'; } });
      window.__waveSweepSlider = { set: (v) => sl.set(parseFloat(v)) };
      ctl.slider({ label: '阻尼 γ', min: 0.05, max: 1.2, step: 0.01, value: stRes.gam, fmt: (v) => v.toFixed(2), onInput: (v) => { stRes.gam = v; } });
      ctl.slider({ label: '驱动幅度', min: 0.3, max: 1.5, step: 0.05, value: stRes.amp, fmt: (v) => v.toFixed(2) + '×', onInput: (v) => { stRes.amp = v; } });
      const sb = ctl.button({
        label: '⏱ 自动扫频',
        onClick: () => {
          if (stRes.sweeping) { stRes.sweeping = false; sb.textContent = '⏱ 自动扫频'; return; }
          stRes.sweeping = true;
          stRes.sweepT = 0;
          sweepSampleAcc = 0;
          stRes.x = 0; stRes.v = 0;
          dockStore[3] = [];
          sb.textContent = '扫频中…（再点停止）';
          taskHit('sweep');
        },
      });
      sb.id = 'sweepBtn';
      setHint('f驱 = f固 = 0.90 Hz 时共振；阻尼越小峰越尖');
    },
  },
  {
    title: '机械波的形成',
    cam: [0.35, 2.0, 2.6], tgt: [0, 1.08, 0],
    html: `<p>一列质点被弹性介质牵在一起。最左端的振源一开动，扰动就一棒一棒往外传，<b>机械波</b>由此成形。</p>
<p>盯住<span class="hl">红漆标记珠</span>：它只在原位来回，<b>并不搭着波前进</b>。振动方向跟传播方向相互垂直的，叫<b>横波</b>；振动沿同一条直线的，叫<b>纵波</b>（声波即纵波），纵波里能看到疏部与密部交替。切「波的类型」对比。</p>
<p class="eq">y = A·sin(ωt − kx)　λ = v/f</p>
<p>波长、频率、波速三者一本账：改 f 或 v，λ 就按 v = λf 跟着变。曲线窗上格是波形快照（y–x），下格是标记珠自己的位移–时间线。</p>`,
    tasks: [
      { key: 'markStill', t: '盯红漆标记珠，确认它没有随波走' },
      { key: 'chgPol', t: '横波、纵波各切一遍' },
      { key: 'readWave', t: '对照波形窗读出波长 λ' },
      { key: 'chgFV', t: '改频率或波速，核对 λ = v/f' },
    ],
    enter() {
      hideAllStations();
      stRow.group.visible = true;
      Object.assign(stRow, { f: 0.8, A: 0.08, v: ROW_V_DEF, phi: 0, slow: false, playing: true, pol: 'transverse', hist: [], histAcc: 0 });
      setHUD([['f', '频率 f'], ['lam', '波长 λ'], ['v', '波速 v']]);
      showWin(winWave, '波形 · 质点振动图', '快照 + 标记珠时间线', drawWaveRow);
      ctl.clear();
      ctl.seg({
        options: [{ label: '横波', value: 'transverse' }, { label: '纵波', value: 'longitudinal' }],
        value: 'transverse',
        onChange: (v) => {
          stRow.pol = v;
          taskHit('chgPol');
          setHint(v === 'transverse' ? '横波：质点上下振动，与传播方向垂直' : '纵波：质点沿传播方向振动，疏部密部交替');
        },
      });
      ctl.slider({ label: '频率 f', min: 0.3, max: 2, step: 0.05, value: stRow.f, fmt: (v) => v.toFixed(2) + ' Hz', onInput: (v) => { stRow.f = v; taskHit('chgFV'); } });
      ctl.slider({ label: '波速 v', min: 0.8, max: 2.4, step: 0.1, value: stRow.v, fmt: (v) => v.toFixed(1) + ' m/s', onInput: (v) => { stRow.v = v; taskHit('chgFV'); } });
      ctl.slider({ label: '振幅 A', min: 0.02, max: 0.12, step: 0.005, value: stRow.A, fmt: (v) => v.toFixed(3) + ' m', onInput: (v) => { stRow.A = v; } });
      ctl.toggle({ label: '质点编号', value: false, onChange: (v) => { stRow.labels.forEach((l) => { l.visible = v; }); } });
      ctl.toggle({ label: '运动箭头', value: false, onChange: (v) => { stRow.arrows.forEach((a) => { a.visible = v; }); } });
      ctl.toggle({ label: '慢放', value: false, onChange: (v) => { stRow.slow = v; } });
      playBtn(stRow);
      setHint('红漆标记珠：原地振动，不随波迁移');
    },
  },
  {
    title: '波的反射',
    cam: [0.15, 1.38, 2.05], tgt: [0, 1.05, 0],
    html: `<p>绳端怎么装，决定反射回来的波形：</p>
<p><b>固定端</b>：端头钉死不能动，反射脉冲<span class="hl">上下翻面</span>（半波损失，相位跳 π）；<b>自由端</b>：端头套在光滑竖杆上随便滑，反射脉冲<span class="hl">原样</span>回来。</p>
<p>端点处的账：固定端绳不能动，入射与反射的位移必须正负相抵，所以反射波倒了个身；自由端位移可以放到最大，两列波同相相加。</p>
<p>点「发射脉冲」看它撞上右端怎么折返；入射与反射会短暂交叠——那正是叠加原理在工作。开「连续脉冲」反复看。波速在反射里保持不变。</p>`,
    tasks: [
      { key: 'emit', t: '点发射脉冲' },
      { key: 'fixRef', t: '固定端下看反射波形翻面' },
      { key: 'freeRef', t: '换成自由端再发一次，对比' },
    ],
    enter() {
      hideAllStations();
      stRef.group.visible = true;
      stRef.eng.reset();
      stRef.eng.c = 1.2;
      stRef.eng.damp = 0.008;
      Object.assign(stRef, { end: 'fixed', cont: false, contAcc: 0, nPulse: 0, fixHits: 0 });
      ST6.plate.visible = true;
      ST6.ring.visible = false;
      ST6.rodFree.visible = false;
      setHUD([['end', '右端'], ['c', '波速'], ['flip', '反射相位'], ['n', '已发脉冲']]);
      genDisplayDraw('—');
      ctl.clear();
      ctl.seg({
        options: [{ label: '固定端', value: 'fixed' }, { label: '自由端', value: 'free' }],
        value: 'fixed',
        onChange: (v) => {
          stRef.end = v;
          ST6.plate.visible = v === 'fixed';
          ST6.ring.visible = v === 'free';
          ST6.rodFree.visible = v === 'free';
          stRef.nPulse = 0;
        },
      });
      ctl.button({
        label: '发射脉冲',
        onClick: () => {
          stRef.eng.emit();
          stRef.nPulse++;
          taskHit('emit');
          if (stRef.end === 'fixed') {
            stRef.fixHits++;
            if (stRef.fixHits >= 2) taskHit('fixRef');
          } else taskHit('freeRef');
        },
      });
      ctl.slider({ label: '波速', min: 0.5, max: 3, step: 0.1, value: 1.2, fmt: (v) => v.toFixed(1) + ' m/s', onInput: (v) => { stRef.eng.c = v; } });
      ctl.toggle({ label: '连续脉冲', value: false, onChange: (v) => { stRef.cont = v; } });
      ctl.toggle({ label: '阻尼', value: false, onChange: (v) => { stRef.eng.damp = v ? 0.06 : 0.008; } });
      setHint('固定端反射翻面 · 自由端反射原样');
    },
  },
  {
    title: '波的叠加与驻波',
    cam: [0.45, 1.34, 2.0], tgt: [0, 1.06, 0],
    html: `<p>两列同频同幅的波<span class="hl">迎面相遇</span>，叠加原理照常生效：每个质点的位移是两列波单独贡献的代数和，相遇后各自保持原样继续走。频率对上时合成<b>驻波</b>——有的点永远钉在原地（<b>波节</b>），有的点摆幅最大（<b>波腹</b>）。</p>
<p class="eq">L = n·λ/2　fₙ = n·v/2L　(n = 1, 2, 3…)</p>
<p>切到「两脉冲」演示：两颗脉冲从两端相向而行，相遇瞬间合体长高，随后各自穿身而过。驻波模式下相邻波节相距 <span class="hl">λ/2</span>；开「显示分量」看青（入射）橙（反射）两列怎么合出亮色驻波。吉他与小提琴的发声，正是这组驻波。</p>`,
    tasks: [
      { key: 'twoPulse', t: '切「两脉冲」，看两颗相向而行' },
      { key: 'collision', t: '抓住相遇瞬间：振幅翻倍' },
      { key: 'staF', t: '切回驻波，慢慢调频率' },
      { key: 'fiveN', t: '把 n = 1~5 的谐频各匹配一次' },
      { key: 'countNodes', t: '数一数波节与波腹的个数' },
    ],
    enter() {
      hideAllStations();
      stSta.group.visible = true;
      Object.assign(stSta, { f: 1.667, phi: 0, A: 0.09, showComp: true, showNodes: true, playing: true, demo: 'standing', emitT: 0, matchedN: stSta.matchedN });
      setHUD([['f', '频率 f'], ['lam', '波长 λ'], ['node', '波节'], ['anti', '波腹'], ['st', '状态']]);
      ctl.clear();
      ctl.seg({
        options: [{ label: '驻波', value: 'standing' }, { label: '两脉冲', value: 'pulses' }],
        value: 'standing',
        onChange: (v) => {
          stSta.demo = v;
          stSta.emitT = 0;
          if (v === 'pulses') {
            taskHit('twoPulse');
            setHint('两颗脉冲从两端出发，相遇处叠加长高');
          } else setHint('青=入射 · 橙=反射 · 亮=合成驻波');
        },
      });
      const slF = ctl.slider({ label: '频率 f', min: 0.4, max: 4, step: 0.01, value: stSta.f, fmt: (v) => v.toFixed(2) + ' Hz', onInput: (v) => { stSta.f = v; if (stSta.demo === 'standing') taskHit('staF'); } });
      ctl.toggle({ label: '显示分量', value: true, onChange: (v) => { stSta.showComp = v; STA.inc.visible = v && stSta.demo === 'standing'; STA.ref.visible = v && stSta.demo === 'standing'; setHint(v && stSta.demo === 'standing' ? '青=入射 · 橙=反射 · 亮=合成' : null); } });
      ctl.toggle({ label: '波节标注', value: true, onChange: (v) => { stSta.showNodes = v; } });
      ctl.button({
        label: '⇄ 自动匹配频率',
        onClick: () => {
          const n = Math.max(1, Math.round((2 * STA_L * stSta.f) / STA_V));
          const fNew = (n * STA_V) / (2 * STA_L);
          stSta.f = fNew;
          slF.set(fNew);
          toast(`已对上第 ${n} 谐频：L = ${n}·λ/2（f = ${fNew.toFixed(2)} Hz）`, 'ok');
        },
      });
      playBtn(stSta);
      setHint('青=入射 · 橙=反射 · 亮=合成驻波');
    },
  },
  {
    title: '水波：干涉与衍射',
    cam: [0, 2.9, 3.0], tgt: [0, 0.9, 0],
    html: `<p><b>干涉</b>：一对振动步调完全一致的<span class="hl">相干源</span>同时打水，波程差 Δr = kλ 的地方相互加强，Δr = (2k+1)λ/2 的地方相互抵消——水面出现稳定的明暗条纹相间。黄实线 = 加强线，蓝虚线 = 减弱线；<b>条纹条数由 d/λ 控制</b>：频率越高（λ 越短）或两源离得越远（d 越大），条纹越密。</p>
<p><b>衍射</b>：波绕过障碍继续前传；<b>缝宽跟波长相当或更小</b>时绕射最明显，缝比波长宽得多时几乎直来直去。</p>
<p>画面是水波槽俯视，亮度即水面起伏。双源模式拖「源间距」看条纹疏密；单缝模式把缝宽从大收小，看波钻进缝后向两侧摊开。<span class="hl">拖拽平移 · 滚轮缩放</span>。</p>`,
    tasks: [
      { key: 'linesOn', t: '打开加强线/减弱线' },
      { key: 'chgLS', t: '调振源频率与两源间距，看条纹疏密' },
      { key: 'slitMode', t: '切到单缝，拖缝宽' },
      { key: 'slitMatch', t: '把缝宽调到跟波长差不多，对比衍射角' },
    ],
    enter() {
      hideAllStations();
      tankCanvas.style.display = '';
      tankCanvas.width = tankCanvas.clientWidth || 800;
      tankCanvas.height = tankCanvas.clientHeight || 400;
      Object.assign(tank, { mode: 'double', lambda: 0.2, sep: 0.5, slitW: 0.16, v: 0.6, phi: 0, paused: false, dirty: true, cx: 0, cy: 0, viewW: 2.2, showLines: true });
      setHUD([['mode', '模式'], ['lam', '波长 λ'], ['v', '波速'], ['f', '频率 f'], ['lines', '条纹条数']]);
      genDisplayDraw('—');
      ctl.clear();
      ctl.seg({
        options: [{ label: '双源干涉', value: 'double' }, { label: '单缝衍射', value: 'slit' }],
        value: 'double',
        onChange: (v) => { tank.mode = v; tank.dirty = true; if (v === 'slit') taskHit('slitMode'); },
      });
      ctl.slider({ label: '波长 λ', min: 0.08, max: 0.4, step: 0.01, value: tank.lambda, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { tank.lambda = v; taskHit('chgLS'); } });
      ctl.slider({
        label: '源间距 / 缝宽', min: 0.06, max: 1.0, step: 0.02, value: tank.sep, fmt: (v) => v.toFixed(2) + ' m',
        onInput: (v) => {
          if (tank.mode === 'double') tank.sep = v;
          else {
            tank.slitW = v;
            if (Math.abs(v - tank.lambda) <= 0.02) taskHit('slitMatch');
          }
          tank.dirty = true;
          if (tank.mode === 'double') taskHit('chgLS');
        },
      });
      ctl.slider({ label: '波速', min: 0.3, max: 1.2, step: 0.05, value: tank.v, fmt: (v) => v.toFixed(2) + ' m/s', onInput: (v) => { tank.v = v; } });
      ctl.toggle({ label: '加强/减弱线', value: true, onChange: (v) => { tank.showLines = v; if (v) taskHit('linesOn'); } });
      ctl.button({ label: '⏸ 暂停', onClick: (b) => { tank.paused = !tank.paused; b.textContent = tank.paused ? '▶ 播放' : '⏸ 暂停'; b.classList.toggle('active', !tank.paused); }, active: true });
      setHint('黄实线=加强线（Δr=kλ）· 蓝虚线=减弱线；缝宽 ≈ λ 时衍射最明显');
    },
  },
  {
    title: '多普勒效应',
    cam: [0.15, 2.05, 2.3], tgt: [0, 0.96, 0.05],
    html: `<p>声源动着，前方的波面被<span class="hl">挤</span>密（波长变短、音调升高），后方被拉疏（音调降低）。急救车擦身而过，笛声先尖后闷；测速雷达、彩超用的也是同一件事。</p>
<p class="eq">f′ = f·v / (v ∓ vₛ)</p>
<p>波前圈按发射时刻的靠近/远离着色：<span style="color:#9fc8ff">蓝</span> = 迎面压密，<span style="color:#ff9a7a">红</span> = 离身拉疏。切「听者位置」到前/后/侧，开 🔊 亲耳对比三个方向的音调（发声按 ×110 折算到可听频段）。</p>
<p>把源速推过<b>1 倍声速</b>：波面叠成一个圆锥——<span class="hl">马赫锥</span>（马赫角 sinμ = v/vₛ），锥面就是激波，音爆随之而来。</p>`,
    tasks: [
      { key: 'sndOn', t: '打开声音，听小车经过时音调起伏' },
      { key: 'chgListen', t: '切换听者位置（前/后/侧）对比' },
      { key: 'supersonic', t: '把源速推过 1 倍声速，等马赫锥' },
    ],
    enter() {
      hideAllStations();
      stDop.group.visible = true;
      Object.assign(stDop, { vf: 0.4, fEmit: 3, waveOn: true, listen: 'front' });
      resetDoppler();
      setHUD([['f', 'f 源'], ['vs', 'vs/v'], ['ff', '前方 f′'], ['fb', '后方 f′'], ['fs', '侧面 f′'], ['st', '状态']]);
      ctl.clear();
      ctl.slider({ label: '源速度 vs/v', min: -0.5, max: 1.6, step: 0.05, value: stDop.vf, fmt: (v) => v.toFixed(2), onInput: (v) => { stDop.vf = v; stDop.cartV = v * DP_V; stDop.shockToasted = false; } });
      ctl.slider({ label: '发射频率', min: 1, max: 5, step: 0.1, value: stDop.fEmit, fmt: (v) => v.toFixed(1) + ' Hz', onInput: (v) => { stDop.fEmit = v; } });
      ctl.seg({
        options: [{ label: '听者·前', value: 'front' }, { label: '听者·后', value: 'back' }, { label: '听者·侧', value: 'side' }],
        value: 'front',
        onChange: (v) => { stDop.listen = v; taskHit('chgListen'); },
      });
      ctl.toggle({ label: '波前显示', value: true, onChange: (v) => { stDop.waveOn = v; } });
      ctl.button({
        label: '🔊 发声',
        onClick: (ab) => {
          if (stDop.soundOn) { stopDopTone(); ab.textContent = '🔊 发声'; return; }
          if (Math.abs(stDop.cartV) / DP_V >= 0.95) {
            toast('源速 ≥ 0.95 波速（贴近激波），发声已锁。先把源速调低。', 'warn');
            return;
          }
          stDop.tone = createTone();
          stDop.soundOn = true;
          ab.textContent = '🔇 停止';
          activeSectionCleanup = () => stopDopTone();
          taskHit('sndOn');
          toast('听：小车靠近时音调蹿高，远离时塌低（按所选听者位置发声）。', 'ok');
        },
      });
      setHint('小车往复运动；vs/v 是当前实际值（含反向段）');
    },
  },
  {
    title: '声音：特性与共鸣',
    cam: [0.9, 1.6, 2.0], tgt: [0.1, 1.45, 0],
    html: `<p>声音三件事：<b>音调</b>看频率，<b>响度</b>看振幅（声强），<b>音色</b>看波形里<span class="hl">掺了哪些泛音</span>——音叉的声谱近乎一根纯音线，钢琴与小提琴则层层叠着泛音。切乐器，对照示波器的波形与频谱。</p>
<p>玻璃管是<b>共鸣管</b>：空气柱长 L = <span class="hl">λ/4 的奇数倍</span>（λ = v/f，v = 340 m/s）时管内空气跟着震，声音明显变响：第一共鸣 L₁ = λ/4，第二 L₂ = 3λ/4。把两个共鸣位置记进数据坞，ΔL = λ/2，声速 v = 2ΔL·f 一算便出——这是测声速的经典路数。</p>
<p>拖「管长 L」找共鸣点（右侧 LED 柱会蹿高），点 🔊 听音调、响度、音色的差别。</p>`,
    tasks: [
      { key: 'chgTone', t: '调音调与响度，看波形变化' },
      { key: 'allInst', t: '四种乐器各切一遍，比音色' },
      { key: 'resonate', t: '拖管长找到共鸣点（LED 蹿高）' },
      { key: 'dockRes', t: '记下两次共鸣位置，算出声速' },
    ],
    enter() {
      hideAllStations();
      stTube.group.visible = true;
      Object.assign(stTube, { f: 440, amp: 0.6, inst: 'fork', L: 0.34, phiS: 0, phiV: 0, phiR: 0 });
      stopTubeTone();
      stTube.instSet = new Set(['fork']);
      ledCount = -1;
      setHUD([['f', '频率 f'], ['lam', '波长 λ'], ['L', '管长 L'], ['res', '共鸣判断']]);
      showWin(winScope, '示波器 · 波形 × 频谱', '谐波成分实时对照', drawScope);
      ctl.clear();
      ctl.slider({ label: '频率', min: 150, max: 1000, step: 5, value: stTube.f, fmt: (v) => v + ' Hz', onInput: (v) => { stTube.f = v; taskHit('chgTone'); } });
      ctl.slider({ label: '振幅（响度）', min: 0.2, max: 1, step: 0.05, value: stTube.amp, fmt: (v) => v.toFixed(2), onInput: (v) => { stTube.amp = v; taskHit('chgTone'); } });
      ctl.seg({
        options: [{ label: '音叉', value: 'fork' }, { label: '长笛', value: 'flute' }, { label: '钢琴', value: 'piano' }, { label: '小提琴', value: 'violin' }],
        value: 'fork',
        onChange: (v) => {
          stTube.inst = v;
          applyInstrument(stTube.tone, v);
          if (stTube.instSet) stTube.instSet.add(v);
          if (stTube.instSet && stTube.instSet.size >= 4) taskHit('allInst');
          toast(`乐器：${INSTR[v].name}——看波形和频谱怎么变`, 'ok');
        },
      });
      ctl.slider({ label: '管长 L', min: 0.15, max: 1.0, step: 0.01, value: stTube.L, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { stTube.L = v; } });
      ctl.button({
        label: '🔊 发声',
        onClick: (ab) => {
          if (stTube.soundOn) { stopTubeTone(); ab.textContent = '🔊 发声'; return; }
          stTube.tone = createTone();
          applyInstrument(stTube.tone, stTube.inst);
          stTube.soundOn = true;
          ab.textContent = '🔇 停止';
          activeSectionCleanup = () => stopTubeTone();
          toast('发声中：把「管长 L」拖到 λ/4 附近找共鸣点，LED 柱会蹿高。', 'ok');
        },
      });
      setHint('共鸣条件 L = λ/4（基频）：440 Hz 时 λ ≈ 0.77 m，L ≈ 0.19 m');
    },
  },
  {
    title: '自由实验',
    cam: [0.15, 1.38, 2.05], tgt: [0, 1.05, 0],
    html: `<p>放手玩波：绳上可以发单颗脉冲、也可以加连续驱动，右端固定/自由随你切。</p>
<p>建议线路：① 打开「连续驱动」，点「自动匹配频率」，几秒后驻波自己浮现；② 关掉驱动改发单颗脉冲，对比两种端头的折返；③ 加大阻尼看波在路上耗尽。</p>
<p>驻波条件随端头而变（右端固定：L = n·λ/2；右端自由：L = (2n−1)·λ/4）。「慢放」把时间拨到 1/4 速，逐帧抠细节。</p>`,
    tasks: [
      { key: 'design', t: '自己搭一套组合，先预测结果再验证' },
      { key: 'slowMo', t: '开慢放，逐帧观察细节' },
    ],
    enter() {
      hideAllStations();
      stFree.group.visible = true;
      stFree.eng.reset();
      stFree.eng.c = 1.2;
      stFree.eng.damp = 0.006;
      Object.assign(stFree, { end: 'fixed', driveOn: false, f: 1.2, phi: 0, v: 1.2, playing: true, slow: false, hits: 0 });
      ST11.plate.visible = true;
      ST11.ring.visible = false;
      ST11.rodFree.visible = false;
      setHUD([['end', '右端'], ['f', '频率 f'], ['v', '波速'], ['lam', '波长 λ']]);
      genDisplayDraw('—');
      ctl.clear();
      ctl.seg({
        options: [{ label: '固定端', value: 'fixed' }, { label: '自由端', value: 'free' }],
        value: 'fixed',
        onChange: (v) => {
          stFree.end = v;
          ST11.plate.visible = v === 'fixed';
          ST11.ring.visible = v === 'free';
          ST11.rodFree.visible = v === 'free';
          if (stFree.driveOn) stFree.eng.reset();
          stFree.hits++;
        },
      });
      ctl.button({ label: '发射脉冲', onClick: () => { stFree.eng.emit(0.3, 0.15, 0.1); stFree.hits++; } });
      ctl.toggle({ label: '连续驱动', value: false, onChange: (v) => { stFree.driveOn = v; stFree.phi = 0; if (!v) stFree.eng.reset(); stFree.hits++; } });
      const slFF = ctl.slider({ label: '频率 f', min: 0.3, max: 3, step: 0.05, value: stFree.f, fmt: (v) => v.toFixed(2) + ' Hz', onInput: (v) => { stFree.f = v; stFree.hits++; } });
      ctl.slider({ label: '波速', min: 0.4, max: 3, step: 0.1, value: stFree.v, fmt: (v) => v.toFixed(1) + ' m/s', onInput: (v) => { stFree.v = v; stFree.hits++; } });
      ctl.slider({ label: '阻尼', min: 0, max: 0.5, step: 0.01, value: 0.006, fmt: (v) => v.toFixed(2), onInput: (v) => { stFree.eng.damp = v; stFree.hits++; } });
      ctl.toggle({ label: '慢放', value: false, onChange: (v) => { stFree.slow = v; if (v) taskHit('slowMo'); } });
      ctl.button({
        label: '⇄ 自动匹配频率',
        onClick: () => {
          let fNew;
          if (stFree.end === 'fixed') {
            const n = Math.max(1, Math.round((4.0 * stFree.f) / stFree.v));
            fNew = (n * stFree.v) / 4.0;
          } else {
            const m = Math.max(1, 2 * Math.round((8.0 * stFree.f / stFree.v - 1) / 2) + 1);
            fNew = (m * stFree.v) / 8.0;
          }
          fNew = clamp(fNew, 0.3, 3);
          stFree.f = fNew;
          slFF.set(fNew);
          toast(`已匹配：f = ${fNew.toFixed(2)} Hz，开「连续驱动」等几秒看驻波成形。`, 'ok');
        },
      });
      playBtn(stFree);
      setHint('先「自动匹配频率」再开「连续驱动」，几秒后驻波浮现');
    },
  },
  {
    title: '随堂检测',
    cam: [0.7, 1.6, 2.8], tgt: [0, 1.05, 0],
    html: `<p>5 道选择题，检验「振动与波」这一章的掌握情况。</p>`,
    tasks: [],
    enter() {
      hideAllStations();
      setHUD(null);
      genDisplayDraw('—');
      ctl.clear();
      showQuiz();
    },
  },
];

/* ================= 随堂检测（自研增设） ================= */

const QUIZ = [
  {
    q: '弹簧振子做简谐运动，其周期 T 的正确表达式与说法是？',
    opts: ['T = 2π√(k/m)，劲度越大周期越大', 'T = 2π√(m/k)，且与振幅无关', 'T = 2π√(L/g)，与质量有关', 'T 与振幅成正比，振幅越大周期越长'],
    a: 1,
    ex: '弹簧振子 T = 2π√(m/k)：m 越大、k 越小，周期越长；周期与振幅无关（等时性）。√(L/g) 是单摆的公式。',
  },
  {
    q: '关于受迫振动与共振，下列说法正确的是？',
    opts: ['驱动频率越大，振幅一定越大', '驱动频率等于系统固有频率时，振幅达到最大', '阻尼越大共振越明显', '固有频率会随驱动频率改变而改变'],
    a: 1,
    ex: '受迫振动稳定后频率等于驱动频率；当 f驱 = f固 时振幅最大即共振。固有频率由系统本身决定（如 ω₀=√(k/m)），阻尼越小共振峰越尖。',
  },
  {
    q: '两端固定的弦形成驻波时，相邻波节之间的距离是？',
    opts: ['λ/4', 'λ/2', 'λ', '2λ'],
    a: 1,
    ex: '驻波中相邻波节相距 λ/2，相邻波节与波腹相距 λ/4。两端固定弦的驻波条件为 L = n·λ/2（n = 1, 2, 3…）。',
  },
  {
    q: '你站在路边，警车鸣着笛高速驶来又呼啸而过，你听到的警笛音调变化是？',
    opts: ['一直变高', '一直变低', '先变高后变低', '先变低后变高'],
    a: 2,
    ex: '多普勒效应：靠近时 f′ = fv/(v−vs) > f，音调升高；远离时 f′ = fv/(v+vs) < f，音调降低——所以是先升高后降低。',
  },
  {
    q: '机械波在介质中传播时，介质中的质点如何运动？',
    opts: ['随波一起向传播方向迁移', '只在各自平衡位置附近往复振动，不随波迁移', '沿波形曲线匀速滑动', '保持静止不动'],
    a: 1,
    ex: '波传播的是振动状态和能量，质点并不随波迁移——「机械波的形成」一章里盯住红漆标记珠即可验证。',
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，振动与波的要点你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
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
    row.appendChild(back);
    row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }

  renderQ();
  activeSectionCleanup = () => panel.remove();
}

/* ================= 章节切换 + 布线 ================= */

const wavesShell = document.getElementById('wavesShell');
const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');

const chapBtns = SECTIONS.map((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chap-btn';
  b.dataset.idx = String(i);
  const n = document.createElement('span');
  n.className = 'chap-n';
  n.textContent = String(i + 1).padStart(2, '0');
  const tt = document.createElement('span');
  tt.className = 'chap-t';
  tt.textContent = s.title;
  b.append(n, tt);
  b.addEventListener('click', () => selectChapter(i));
  chapNav.appendChild(b);
  return b;
});

let chapterIdx = 0;
function selectChapter(i, replay = false) {
  chapterIdx = clamp(i, 0, SECTIONS.length - 1);
  const sec = SECTIONS[chapterIdx];
  chapBtns.forEach((b, j) => {
    const on = j === chapterIdx;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'true');
    else b.removeAttribute('aria-current');
  });
  chapCount.textContent = String(chapterIdx + 1).padStart(2, '0') + '/' + String(SECTIONS.length).padStart(2, '0');
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
  lessonEl.innerHTML = sec.html;
  taskDefs = sec.tasks || [];
  renderTasks();
  renderDock(chapterIdx);
  sec.enter();
  controlsEl.children.length ? document.getElementById('accControls').classList.remove('acc-empty') : document.getElementById('accControls').classList.add('acc-empty');
  document.getElementById('accData').classList.toggle('acc-empty', !hud);
  detailBody.scrollTop = 0;
  curSec = chapterIdx;
  if (!replay) app.setCamera(sec.cam, sec.tgt);
}
function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }

/* ---------------- 栏折叠 × 专注模式 × 课堂模式 ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const focusBtn = document.getElementById('focusBtn');
const classroomBtn = document.getElementById('classroomBtn');

const FOLD_KEY = { l: 'waves.foldL', r: 'waves.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
let classroom = false;
let classroomSaved = null;

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* 忽略 */ }

function applyFold() {
  wavesShell.classList.toggle('fold-l', foldL);
  wavesShell.classList.toggle('fold-r', foldR);
  for (const [btn, folded] of [[foldLBtn, foldL], [unfoldLBtn, foldL], [foldRBtn, foldR], [unfoldRBtn, foldR]]) {
    btn.setAttribute('aria-expanded', String(!folded));
  }
}
function setFocus(on) {
  if (on && focusSaved === null) {
    focusSaved = [foldL, foldR];
    foldL = true; foldR = true;
  } else if (!on && focusSaved !== null) {
    [foldL, foldR] = focusSaved;
    focusSaved = null;
  }
  wavesShell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyFold();
}
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL; else foldR = !foldR;
  try { localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyFold();
}
foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
applyFold();

function setClassroom(on) {
  if (on === classroom) return;
  classroom = on;
  if (on) {
    classroomSaved = [foldL, foldR];
    foldL = true;
  } else if (classroomSaved) {
    [foldL, foldR] = classroomSaved;
    classroomSaved = null;
  }
  wavesShell.classList.toggle('classroom', classroom);
  classroomBtn.classList.toggle('active', classroom);
  classroomBtn.textContent = classroom ? '退出课堂' : '课堂模式';
  applyFold();
  toast(classroom ? '课堂模式：舞台放大，讲解浮于右侧。' : '已退出课堂模式。');
}
classroomBtn.addEventListener('click', () => setClassroom(!classroom));

/* ---------------- 右栏四块手风琴（详解 / 控件 / 读数 / 数据坞） ---------------- */

const ACC_KEYS = { lesson: 'waves.accLesson', controls: 'waves.accControls', data: 'waves.accData', dock: 'waves.accDock' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
  dock: document.getElementById('accDock'),
};
const NARROW_VIEW = window.innerWidth <= 1100;
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 忽略 */ }
  accClosed[name] = saved !== null ? saved === '1' : (name === 'data' && NARROW_VIEW);
}
function applyAcc(name) {
  const sec = accSecs[name];
  sec.classList.toggle('closed', accClosed[name]);
  sec.querySelector('.acc-head').setAttribute('aria-expanded', String(!accClosed[name]));
}
for (const name of Object.keys(accSecs)) applyAcc(name);
for (const name of Object.keys(accSecs)) {
  accSecs[name].querySelector('.acc-head').addEventListener('click', () => {
    accClosed[name] = !accClosed[name];
    try { localStorage.setItem(ACC_KEYS[name], accClosed[name] ? '1' : '0'); } catch (e) { /* 忽略 */ }
    applyAcc(name);
  });
}

/* ---------------- 舞台工具 / 键盘（←→ 与 ,. 翻章 · 空格 · Esc · R · F） ---------------- */

const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const camResetBtn = document.getElementById('camResetBtn');
const fullBtn = document.getElementById('fullBtn');
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
function resetView() {
  const sec = SECTIONS[chapterIdx];
  if (sec) app.setCamera(sec.cam, sec.tgt);
}
camResetBtn.addEventListener('click', resetView);
fullBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.querySelector('.lab-stage3d').requestFullscreen().catch(() => { /* 静默 */ });
});
document.addEventListener('fullscreenchange', () => {
  fullBtn.textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏';
});
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft' || e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight' || e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === ' ') { e.preventDefault(); togglePlayState(); }
  else if (e.key === 'Escape') {
    if (classroom) setClassroom(false);
    else if (focusSaved !== null) setFocus(false);
  }
  else if (e.key === 'r' || e.key === 'R') resetView();
  else if (e.key === 'f' || e.key === 'F') fullBtn.click();
});

/* 空格播放/暂停：切换当前章可暂停状态（振子/摆/共振/珠列/驻波/水槽/绳） */
function togglePlayState() {
  const map = { 0: stSpring, 1: stPen, 2: stSpring, 3: null, 4: stRow, 6: stSta, 7: null, 10: stFree };
  if (curSec === 7) {
    const btn = controlsEl.querySelector('.ctl-btn.active');
    if (btn) btn.click();
    return;
  }
  const st = map[curSec];
  if (!st) return;
  st.playing = !st.playing;
  const btns = Array.from(controlsEl.querySelectorAll('.ctl-btn'));
  for (const b of btns) {
    if (b.textContent === '⏸ 暂停' || b.textContent === '▶ 播放') {
      b.textContent = st.playing ? '⏸ 暂停' : '▶ 播放';
      b.classList.toggle('active', st.playing);
      break;
    }
  }
}

/* ---------------- 拖拽互动（滑块 / 摆球） ---------------- */

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let dragKind = null;
const dragPlaneG = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TRACK_Y);
const dragPlaneB = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const hitP = new THREE.Vector3();

function setNdc(e) {
  const r = app.renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
}
app.renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!labReady) return;
  setNdc(e);
  raycaster.setFromCamera(ndc, camera);
  const targets = [];
  if (curSec === 0 && S.grab && stSpring.group.visible) targets.push(S.grab);
  if (curSec === 1 && P.bobHit && stPen.group.visible) targets.push(P.bobHit);
  const hits = raycaster.intersectObjects(targets, false);
  if (hits.length) {
    dragKind = curSec === 0 ? 'glider' : 'bob';
    controls.enabled = false;
    taskHit('drag');
    app.renderer.domElement.setPointerCapture(e.pointerId);
  }
});
app.renderer.domElement.addEventListener('pointermove', (e) => {
  if (!dragKind) return;
  setNdc(e);
  raycaster.setFromCamera(ndc, camera);
  if (dragKind === 'glider') {
    if (raycaster.ray.intersectPlane(dragPlaneG, hitP)) {
      stSpring.dragging = true;
      stSpring.dragX = clamp(hitP.x, -0.85, 0.85);
    }
  } else {
    if (raycaster.ray.intersectPlane(dragPlaneB, hitP)) {
      const th = Math.atan2(hitP.x - PEN_PIVOT.x, PEN_PIVOT.y - hitP.y);
      const thC = clamp(th, -1.22, 1.22);
      stPen.dragging = true;
      stPen.th = thC;
      stPen.th0 = Math.max(Math.abs(thC), 2 * Math.PI / 180);
      stPen.w = 0;
    }
  }
});
function endDrag() {
  if (!dragKind) return;
  if (dragKind === 'glider') {
    stSpring.dragging = false;
    stSpring.A = Math.max(Math.abs(stSpring.x), 0.02);
    stSpring.phase = stSpring.x >= 0 ? 0 : Math.PI;
    stSpring.tEnv = 0;
  } else {
    stPen.dragging = false;
    stPen.th0 = Math.max(Math.abs(stPen.th), 2 * Math.PI / 180);
    stPen.w = 0;
  }
  controls.enabled = true;
  dragKind = null;
}
app.renderer.domElement.addEventListener('pointerup', endDrag);
app.renderer.domElement.addEventListener('pointercancel', endDrag);
app.renderer.domElement.addEventListener('pointerleave', endDrag);

/* ================= 帧循环 ================= */

let winClock = 0;
app.onFrame((dt) => {
  if (!labReady) return;
  const now = performance.now() / 1000;
  switch (curSec) {
    case 0:
    case 2: updateSpringChapter(dt); break;
    case 1: updatePendulum(dt); break;
    case 3: updateResonance(dt); break;
    case 4: updateRow(dt); break;
    case 5: updateRef(dt); break;
    case 6: updateStanding(dt); break;
    case 7: updateTank(dt); break;
    case 8: updateDoppler(dt, now); break;
    case 9: updateTube(dt); break;
    case 10: updateFree(dt); break;
    default: break;
  }
  /* 曲线窗节流重绘（20Hz） */
  if (winDraw && curWinPair) {
    winClock += dt;
    if (curWinPair.open() && winClock >= 0.05) {
      winClock = 0;
      curWinPair.draw();
    }
  }
});
/* 记录当前曲线窗与其绘制函数的配对（showWin 时更新） */
let curWinPair = null;
const _origShowWin = showWin;
showWin = function (win, title, info, drawFn) {
  _origShowWin(win, title, info, drawFn);
  curWinPair = { open: () => win.open, draw: drawFn };
};

/* ================= 启动（全程序化纹理，零外部资源加载） ================= */

buildWorld();
buildSpring();
buildPendulum();
buildResonance();
buildRow();
ST6 = buildStringStation(stRef.group);
ST11 = buildStringStation(stFree.group);
buildStanding();
buildDoppler();
buildTube();
labReady = true;

loader.hide();
selectChapter(0);
window.__eduSections = { select: selectChapter };
/* 测试观察口（gate/主控终审用，不影响页面行为） */
window.__wavesState = {
  stSpring, stPen, stRes, stRow, stRef, stSta, stDop, stTube, stFree, tank, DP,
  vfx, get chapterIdx() { return chapterIdx; },
  get foldL() { return foldL; }, get foldR() { return foldR; },
};
