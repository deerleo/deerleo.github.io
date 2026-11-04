/* EduLab · 孟德尔豌豆杂交实验（pea）— Micro 级深改
 * =====================================================================
 * 章节：为什么选豌豆 / 人工异花授粉 / 一对相对性状的杂交 / 测交：验证分离 /
 *       两对相对性状的杂交 / 七对性状自由探究 / 假说—演绎法 / 随堂检测
 *
 * 遗传引擎（7 对相对性状 · 等位基因 · 配子抽样）：
 *   - 7 座位点：茎高 H / 花位 P / 花色 C（种皮联锁）/ 荚形 K / 荚色 L / 种形 R / 子叶 Y
 *   - 表达规则照经典遗传学：种子的形状与子叶颜色是种子自己的基因型；
 *     种皮颜色随母本（C 座位）；豆荚的形状与颜色是母本组织（结荚植株的 K/L 座位）；
 *     花色 / 花位 / 茎高按植株本体基因型表达
 *   - 配子抽样：每座位杂合 50/50，纯合恒定；自由组合 = 座位间独立抽样
 *   - 检验统计：卡方 + p 值（不完全伽马函数实现，df 1..7 通用），亲本基因型不唯一时报「无确定理论比」
 *
 * 场景叙事（修道院豆园）：
 *   - 六行豆畦（Ⅰ~Ⅵ）：木框畦埂 + 畦土 + 品系木牌（CanvasTexture 动态重绘）；
 *     攀援架（A 字架 + 麻绳网格）立在 Ⅲ / Ⅴ 行；石墙背景 + 木门柱 + 碎石小径
 *   - 桌面道具：浇水壶（车削壶身 + 壶嘴扫掠 + 提梁 + 壶盖钮）/ 种子箱（盒体 + 品系纸包 ×6）/
 *     陶盆 ×2 / 工作台（厚木台面 + 四格瓷盘 + 种子样品架 + 剥荚托盘 + 记录本 + 工具）
 *   - 棋盘格展板（木架展板 + 动态画布）/ 孟德尔原始数据展板（西墙挂板）
 *   - 花特写台：陶盆大花（旗瓣 / 翼瓣×2 / 龙骨瓣可开合，10 枚雄蕊逐枚可夹）+ 纸袋 + 工具边桌
 *
 * 建模工艺（edu-vfx 接入，工单 3+ 节逐条）：
 *   - 主体放样：茎 = CatmullRomCurve3 中心线 + 变宽度截面扫掠（自研 sweepTube）；
 *     豆荚 = 两端渐细的扫掠荚体（饱满 / 缢缩两版，缢缩版鼓节凸起）；浇水壶 / 瓷盘 = 车削轮廓放样；
 *     叶 = 贝塞尔叶缘轮廓挤出 + 中脉折起；花瓣 = 参数化凹杯扇面（顶点塑形）
 *   - 程序化贴图：畦土噪点 / 石墙砌缝 / 碎石路面 / 木纹（makeWoodTexture）/
 *     品系纸包标签 / 畦牌 / 记录本纸页 / 方法卡片 / 种子样品卡（CanvasTexture 矢量绘制 60+ 处）
 *   - 材质分级：叶片 matSheen（绒面 sheen）/ 花瓣 matCoat（clearcoat 高光带）/
 *     瓷盘釉面 matCoat（低粗糙 + 高 env）/ 陶盆 matStd 素陶 / 黄铜 metalness 分区 /
 *     柱头 / 花粉 matGlow 微发光
 *   - 光照：暖主光 + 冷补光 + 台面近距 bounce + 半球感环境 + makeStudioEnvironment PMREM 反射；
 *     接触阴影用烘焙径向渐变贴片（免实时 shadowMap）
 *   - 互动可视反馈：时间轴拖动 → 植株逐段抽高 / 展叶 / 现蕾 / 鼓荚 / 转黄（实例矩阵重建）；
 *     镊子悬停花药高亮、点击夹除；毛笔蘸粉后笔尖发光；纸袋 / 挂牌即时显隐
 *
 * 布局：真·三栏（课题目录 / 3D 舞台 / 详解+控件+读数），左右栏独立折叠 + 专注模式 +
 *   右栏三块手风琴（localStorage 记忆，切章不重置）+ 台账浮窗折叠徽标；键盘 ←→ 切章、
 *   空格播放时间轴、R 复位视角、] 折右栏；≤1100px 首访清爽态，≤860px 纵向堆叠。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader, makeHUD, makeTextSprite, setSpriteText,
  createControlsPanel,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matCoat, matStd, matSheen, matGlow, ghostify,
  makeWoodTexture, makeLabelTexture, makeStudioEnvironment,
} from './edu-vfx.js';

/* ---------------- 基础与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在翻土播种…');
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 160,
  cameraPos: [0, 7.6, 14.2], target: [0, 0.6, -0.8],
  minDistance: 0.8, maxDistance: 48,
  keepBackground: true,
});
const vfx = attachVFX(app, 'illus', { bg: 'studio-warm' });
const { scene, camera, controls } = app;
scene.environment = makeStudioEnvironment(app.renderer);

/* 灯光：暖主光（晨光斜照）+ 冷天光补 + 正面柔光 + 地面近距 bounce（插画调性压曝光） */
const keyLight = new THREE.DirectionalLight(0xffe2b0, 1.5);
keyLight.position.set(-7, 11, 8);
scene.add(keyLight);
const skyFill = new THREE.DirectionalLight(0xcfe2f2, 0.55);
skyFill.position.set(6, 7, -4);
scene.add(skyFill);
const frontSoft = new THREE.DirectionalLight(0xf4ead8, 0.4);
frontSoft.position.set(1, 4, 11);
scene.add(frontSoft);
const ambLight = new THREE.AmbientLight(0x9aa08e, 0.34);
scene.add(ambLight);
const groundBounce = new THREE.PointLight(0xffd9a0, 0.42, 12, 1.7);
groundBounce.position.set(0, 1.6, 3.2);
scene.add(groundBounce);
app.renderer.toneMappingExposure = 0.94;

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
function label(text, color = '#ffffff', scale = 0.0042, bg = 'rgba(8,12,18,0.72)') {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg });
}

/* 可播种伪随机（mulberry32）：同种子同结果，贴图与布局均可复现 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- 程序化贴图（畦土 / 石墙 / 碎石 / 纸页 / 卡片） ---------------- */

function canvasTex(w, h, draw, opts = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  if (opts.bg) { ctx.fillStyle = opts.bg; ctx.fillRect(0, 0, w, h); }
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = opts.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (opts.repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(opts.repeat[0], opts.repeat[1]); }
  return { tex, cv, ctx };
}

/* 畦土：深壤底色 + 湿斑 + 团粒噪点 + 少量石屑亮斑 */
function soilTexture(seed = 11) {
  const rnd = mulberry32(seed);
  return canvasTex(512, 512, (ctx, S) => {
    const g = ctx.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, '#4a3826'); g.addColorStop(0.5, '#3d2e1e'); g.addColorStop(1, '#332616');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 26; i++) {
      const x = rnd() * S, y = rnd() * S, r = 14 + rnd() * 42;
      const wet = ctx.createRadialGradient(x, y, 1, x, y, r);
      wet.addColorStop(0, `rgba(18,12,6,${0.12 + rnd() * 0.16})`);
      wet.addColorStop(1, 'rgba(18,12,6,0)');
      ctx.fillStyle = wet; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 3400; i++) {
      const v = rnd();
      ctx.fillStyle = v > 0.86 ? 'rgba(186,158,116,0.5)' : v > 0.5 ? 'rgba(16,10,4,0.4)' : 'rgba(96,72,44,0.28)';
      ctx.fillRect(rnd() * S, rnd() * S, 1.2 + rnd() * 2.6, 1 + rnd() * 2);
    }
    for (let i = 0; i < 90; i++) {
      const x = rnd() * S, y = rnd() * S, r = 1.6 + rnd() * 2.6;
      ctx.fillStyle = `rgba(${168 + rnd() * 40 | 0},${148 + rnd() * 30 | 0},${112 + rnd() * 26 | 0},${0.5 + rnd() * 0.3})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(20,14,8,0.35)';
      ctx.beginPath(); ctx.arc(x + r * 0.7, y + r * 0.6, r * 0.8, 0, TAU); ctx.fill();
    }
  }, { repeat: [2, 2] }).tex;
}

/* 石墙：砌块横缝 + 错缝竖线 + 苔痕 + 风化斑 */
function stoneTexture(seed = 5) {
  const rnd = mulberry32(seed);
  return canvasTex(512, 512, (ctx, S) => {
    const g = ctx.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, '#6e6c64'); g.addColorStop(1, '#54514a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    const rows = 8;
    for (let r = 0; r < rows; r++) {
      const y0 = (r / rows) * S, hh = S / rows;
      const off = (r % 2) * 42;
      for (let x = -42; x < S; x += 96) {
        const bx = x + off, bw = 92;
        const tone = 0.86 + rnd() * 0.2;
        ctx.fillStyle = `rgb(${104 * tone | 0},${100 * tone | 0},${90 * tone | 0})`;
        ctx.fillRect(bx + 3, y0 + 3, bw - 6, hh - 6);
        ctx.fillStyle = 'rgba(255,255,250,0.10)';
        ctx.fillRect(bx + 4, y0 + 4, bw - 8, 2.4);
        ctx.fillStyle = 'rgba(14,12,8,0.30)';
        ctx.fillRect(bx + 4, y0 + hh - 6, bw - 8, 2.6);
      }
      ctx.fillStyle = 'rgba(24,20,14,0.5)';
      ctx.fillRect(0, y0 - 1, S, 2.6);
    }
    for (let i = 0; i < 42; i++) {
      const x = rnd() * S, y = rnd() * S, r = 8 + rnd() * 30;
      const moss = ctx.createRadialGradient(x, y, 1, x, y, r);
      moss.addColorStop(0, `rgba(86,108,58,${0.10 + rnd() * 0.16})`);
      moss.addColorStop(1, 'rgba(86,108,58,0)');
      ctx.fillStyle = moss; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 2400; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(20,16,10,0.14)' : 'rgba(220,214,196,0.10)';
      ctx.fillRect(rnd() * S, rnd() * S, 1.4, 1 + rnd() * 1.6);
    }
  }, { repeat: [3, 1] }).tex;
}

/* 碎石小径：暖灰底 + 碎石片 + 边缘草侵 */
function gravelTexture(seed = 17) {
  const rnd = mulberry32(seed);
  return canvasTex(512, 512, (ctx, S) => {
    ctx.fillStyle = '#5c564a'; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 52; i++) {
      const x = rnd() * S, y = rnd() * S, r = 10 + rnd() * 26;
      const shade = ctx.createRadialGradient(x, y, 1, x, y, r);
      shade.addColorStop(0, `rgba(30,26,18,${0.10 + rnd() * 0.14})`);
      shade.addColorStop(1, 'rgba(30,26,18,0)');
      ctx.fillStyle = shade; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 1500; i++) {
      const x = rnd() * S, y = rnd() * S, rr = 1.8 + rnd() * 4.4, a = rnd() * TAU;
      const tone = 118 + rnd() * 70;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = `rgb(${tone | 0},${tone * 0.94 | 0},${tone * 0.82 | 0})`;
      ctx.beginPath(); ctx.ellipse(0, 0, rr, rr * (0.6 + rnd() * 0.4), 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(18,14,8,0.3)';
      ctx.beginPath(); ctx.ellipse(rr * 0.4, rr * 0.5, rr * 0.7, rr * 0.4, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < 26; i++) {
      const y = rnd() * S;
      ctx.strokeStyle = `rgba(96,124,64,${0.12 + rnd() * 0.16})`;
      ctx.lineWidth = 1 + rnd() * 2.4;
      ctx.beginPath();
      const x0 = rnd() < 0.5 ? 0 : S;
      ctx.moveTo(x0, y);
      ctx.quadraticCurveTo(x0 + (x0 ? -1 : 1) * S * 0.12, y + (rnd() - 0.5) * 40, x0 + (x0 ? -1 : 1) * S * (0.1 + rnd() * 0.14), y + (rnd() - 0.5) * 60);
      ctx.stroke();
    }
  }, { repeat: [5, 1] }).tex;
}

/* 记录本纸页：米白 + 横格线 + 装订孔 + 页缘阴影 */
function notebookPageTexture(title) {
  return canvasTex(384, 512, (ctx, W, H) => {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, '#e8dfc8'); g.addColorStop(0.12, '#f2ecd8'); g.addColorStop(1, '#e4dbc2');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(120,96,60,0.16)';
    ctx.fillRect(0, 0, 10, H);
    ctx.fillStyle = 'rgba(90,70,40,0.35)';
    for (let y = 26; y < H; y += 64) { ctx.beginPath(); ctx.arc(24, y, 5, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(146,150,170,0.4)'; ctx.lineWidth = 1;
    for (let y = 78; y < H - 20; y += 26) { ctx.beginPath(); ctx.moveTo(46, y); ctx.lineTo(W - 26, y); ctx.stroke(); }
    ctx.fillStyle = '#3a3428';
    ctx.font = '700 26px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2 + 10, 50);
    ctx.strokeStyle = '#b0603a'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(W * 0.24, 60); ctx.lineTo(W * 0.76, 60); ctx.stroke();
    ctx.fillStyle = 'rgba(70,60,40,0.55)';
    ctx.font = '400 15px "Kaiti SC", "Kaiti", serif';
    ['授粉 / 收获逐条记录', '纸袋口折三折防虫', '摘荚宜在晨露干后'].forEach((t, i) => ctx.fillText(t, W / 2 + 10, 108 + i * 26));
  }).tex;
}

/* 方法卡片纸面：米白 + 标题 + 要点行 + 编号章 */
function methodCardTexture(no, title, lines) {
  return canvasTex(360, 250, (ctx, W, H) => {
    ctx.fillStyle = '#f0e9d4'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = 'rgba(150,120,80,0.05)';
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
    ctx.strokeStyle = '#9c5c34'; ctx.lineWidth = 4;
    ctx.strokeRect(9, 9, W - 18, H - 18);
    ctx.fillStyle = '#b0603a';
    ctx.beginPath(); ctx.arc(44, 46, 21, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f6efdc';
    ctx.font = '800 24px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(no), 44, 55);
    ctx.fillStyle = '#2c2620';
    ctx.font = '700 25px "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, 78, 54);
    ctx.font = '400 16.5px "PingFang SC", sans-serif';
    ctx.fillStyle = '#4a4234';
    lines.forEach((t, i) => ctx.fillText(t, 30, 104 + i * 27));
  }).tex;
}

/* 种子样品卡：样豆（圆 / 皱形）+ 名称 + 基因型小字 */
function specimenCardTexture(title, sub, coatHex, cotHex, wrinkled) {
  return canvasTex(300, 190, (ctx, W, H) => {
    ctx.fillStyle = '#efe8d2'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#8a5a38'; ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.fillStyle = '#2e2820';
    ctx.font = '700 24px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 42);
    ctx.font = '400 14px "PingFang SC", sans-serif';
    ctx.fillStyle = '#6a6050';
    ctx.fillText(sub, W / 2, 66);
    const cx = W / 2, cy = 118, R = 34;
    const g = ctx.createRadialGradient(cx - 10, cy - 12, 4, cx, cy, R + 6);
    g.addColorStop(0, '#fff8ea'); g.addColorStop(0.55, coatHex); g.addColorStop(1, 'rgba(40,30,18,0.4)');
    ctx.fillStyle = g;
    ctx.beginPath();
    if (wrinkled) {
      for (let a = 0; a <= TAU + 0.01; a += TAU / 22) {
        const rr = R * (0.82 + Math.sin(a * 3.1) * 0.1 + Math.cos(a * 5.3) * 0.06);
        const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.86;
        a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else {
      ctx.ellipse(cx, cy, R, R * 0.86, 0, 0, TAU);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,250,0.5)';
    ctx.beginPath(); ctx.ellipse(cx - 12, cy - 13, 9, 5.5, -0.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(90,70,40,0.5)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.5, R * 0.4, 0.4, 0, TAU); ctx.stroke();
    ctx.fillStyle = cotHex;
    ctx.font = '600 13px "PingFang SC", sans-serif';
    ctx.fillText('子叶 ' + (cotHex === '#e8c96a' ? '黄' : '绿') + ' · 种皮' + (coatHex === '#b9ac96' ? '灰' : '白'), W / 2, 172);
  }).tex;
}

/* 畦牌木牌面（直接画进 bed 的 plaque canvas，sowing/清畦时动态重绘） */
function drawPlate(ctx, W, H, no, name, sub) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#e6d9b8'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#6a4a28'; ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, W - 10, H - 10);
  ctx.fillStyle = '#5a4326';
  ctx.font = '800 34px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(no, 14, 47);
  ctx.font = '700 21px "PingFang SC", sans-serif';
  ctx.fillStyle = '#332a1c';
  ctx.fillText(name || '空畦', 56, 46);
  ctx.font = '400 15px "PingFang SC", sans-serif';
  ctx.fillStyle = '#6e6250';
  ctx.fillText((sub || '').slice(0, 13), 14, 82);
  ctx.fillText((sub || '').slice(13, 26), 14, 104);
}

/* 接触阴影：一次性烘焙到地面级贴片（免实时 shadowMap） */
const SHADOW_BLOBS = [];
function bakeContactShadow(x, z, w, d, opacity = 0.36) {
  SHADOW_BLOBS.push({ x, z, w, d, opacity });
}
function buildGroundShadow() {
  const CW = 1024, CH = 1024;
  const cv = document.createElement('canvas');
  cv.width = CW; cv.height = CH;
  const ctx = cv.getContext('2d');
  for (const b of SHADOW_BLOBS) {
    const px = ((b.x + 13) / 26) * CW;
    const pz = ((b.z + 8) / 16) * CH;
    const rx = (b.w / 26) * CW / 2;
    const rz = (b.d / 16) * CH / 2;
    const g = ctx.createRadialGradient(px, pz, 0, px, pz, Math.max(rx, rz));
    g.addColorStop(0, `rgba(10,8,4,${b.opacity})`);
    g.addColorStop(0.55, `rgba(10,8,4,${b.opacity * 0.5})`);
    g.addColorStop(1, 'rgba(10,8,4,0)');
    ctx.save();
    ctx.translate(px, pz);
    ctx.scale(rx / Math.max(rx, rz), rz / Math.max(rx, rz));
    ctx.translate(-px, -pz);
    ctx.fillStyle = g;
    ctx.fillRect(px - Math.max(rx, rz), pz - Math.max(rx, rz), Math.max(rx, rz) * 2, Math.max(rx, rz) * 2);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  const m = mesh(new THREE.PlaneGeometry(26, 16), new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
  }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.012;
  m.renderOrder = -1;
  return m;
}

/* ---------------- 几何工具（放样 / 车削 / 叶缘挤出 / 合并） ---------------- */

/* 圆角矩形轮廓（absarc 四角） */
function roundedRectShape(w, d, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + d - r);
  s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + d);
  s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/* 圆角平板（挤出 + 倒角，rotateX 落平：顶面 y = h + bevel） */
function roundedSlab(w, d, h, r, mat, bevel = 0.02) {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(w, d, r), {
    depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
    bevelSegments: 3, curveSegments: 14,
  });
  g.rotateX(-Math.PI / 2);
  return mesh(g, mat);
}

/* 变宽度截面扫掠：中心线 + Frenet 标架圆环放样，半径随 t 插值（茎 / 花丝 / 壶嘴 / 荚体共用） */
function sweepTube(pts, radius, segs = 10, tubularSegs = 48) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const N = tubularSegs;
  const frames = curve.computeFrenetFrames(N, false);
  const pos = [], nrm = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = curve.getPointAt(t);
    const r = typeof radius === 'function' ? radius(t) : radius;
    const Nv = frames.normals[Math.min(i, N - 1)];
    const Bv = frames.binormals[Math.min(i, N - 1)];
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * TAU;
      const sin = Math.sin(a), cos = Math.cos(a);
      const nx = cos * Nv.x + sin * Bv.x, ny = cos * Nv.y + sin * Bv.y, nz = cos * Nv.z + sin * Bv.z;
      pos.push(p.x + r * nx, p.y + r * ny, p.z + r * nz);
      nrm.push(nx, ny, nz);
      uv.push(j / segs, t * 4);
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * (segs + 1) + j, b = a + segs + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/* 叶片几何：贝塞尔叶缘轮廓 + 中脉折起 + 挤出薄片 */
function leafGeometry(len = 0.3, wid = 0.13, curl = 0.1) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(len * 0.18, wid * 1.05, len * 0.66, wid * 0.92, len, 0);
  shape.bezierCurveTo(len * 0.66, -wid * 0.92, len * 0.18, -wid * 1.05, 0, 0);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false, curveSegments: 16, steps: 1 });
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const k = 1 - Math.min(1, Math.abs(y) / (wid * 1.05));
    p.setZ(i, p.getZ(i) + curl * k * k - Math.abs(x) / len * 0.004);
  }
  g.computeVertexNormals();
  return g;
}

/* 花瓣几何：参数化凹杯扇面（u 沿瓣宽 -1..1，v 沿瓣长 0..1），
 * 宽度中段最宽、瓣尖收圆；沿 v 内凹成杯；边缘微波。origin 在瓣基，+Y 为瓣长方向 */
function petalGeometry(len = 0.3, wid = 0.2, cup = 0.07, segU = 12, segV = 10) {
  const pos = [], uvA = [], idx = [];
  for (let iv = 0; iv <= segV; iv++) {
    const v = iv / segV;
    const wProf = Math.sin(Math.min(1, v * 1.9) * Math.PI * 0.58) * (1 - v * v * 0.35);
    for (let iu = 0; iu <= segU; iu++) {
      const u = (iu / segU) * 2 - 1;
      pos.push(u * wid * wProf, v * len, cup * (0.4 - v) * (1 - u * u) - Math.abs(u) * wid * 0.1 + Math.sin(v * 7) * 0.004);
      uvA.push(iu / segU, v);
    }
  }
  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const a = iv * (segU + 1) + iu, b = a + segU + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvA, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* 同属性集（position/normal/uv + 索引）索引几何拼接，本地实现免引 BufferGeometryUtils */
function mergeGeoms(geos) {
  if (!geos.length) return null;
  const attrNames = Object.keys(geos[0].attributes).sort().join(',');
  for (const g of geos) {
    if (!g.index || Object.keys(g.attributes).sort().join(',') !== attrNames) return null;
    for (const n of Object.keys(g.attributes)) {
      const a = g.attributes[n];
      if (!(a.array instanceof Float32Array)) return null;
    }
  }
  let vCount = 0, iCount = 0;
  for (const g of geos) { vCount += g.attributes.position.count; iCount += g.index.count; }
  const merged = new THREE.BufferGeometry();
  for (const n of attrNames.split(',')) {
    const itemSize = geos[0].attributes[n].itemSize;
    const arr = new Float32Array(vCount * itemSize);
    let off = 0;
    for (const g of geos) { arr.set(g.attributes[n].array, off); off += g.attributes[n].array.length; }
    merged.setAttribute(n, new THREE.BufferAttribute(arr, itemSize));
  }
  const idx = vCount > 65535 ? new Uint32Array(iCount) : new Uint16Array(iCount);
  let vo = 0, io = 0;
  for (const g of geos) {
    const gi = g.index.array;
    for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
    vo += g.attributes.position.count;
    io += gi.length;
  }
  merged.setIndex(new THREE.BufferAttribute(idx, 1));
  return merged;
}

/* 静态家具合并：畦框 / 道具等不动件按材质 bake 矩阵后合并，压 draw call（硬线 <200）
 * 注意：合并组挂回 root.parent，几何必须 bake「父组局部」矩阵（parent.matrixWorld⁻¹ × world），
 * 若直接用 matrixWorld，父组自身带变换时会二次叠加错位（棋盘板 / 立牌立柱 / 工作台曾因此漂移） */
function mergeStatics(root) {
  root.updateWorldMatrix(true, true);
  const parentInv = root.parent
    ? root.parent.matrixWorld.clone().invert()
    : new THREE.Matrix4();
  const byMat = new Map();
  const victims = [];
  root.traverse((o) => {
    if (!o.isMesh || o.userData.noMerge) return;
    for (let p = o.parent; p && p !== root; p = p.parent) if (p.userData.dynamic) return;
    victims.push(o);
  });
  if (victims.length < 2) return root;
  for (const m of victims) {
    const geo = m.geometry.clone().applyMatrix4(parentInv.clone().multiply(m.matrixWorld));
    const key = m.material.uuid;
    if (!byMat.has(key)) byMat.set(key, { mat: m.material, geos: [], order: m.renderOrder });
    byMat.get(key).geos.push(geo);
  }
  const merged = new THREE.Group();
  merged.name = 'statics-merged';
  for (const { mat, geos, order } of byMat.values()) {
    const geo = geos.length > 1 ? mergeGeoms(geos) : geos[0];
    if (geo) {
      const mm = new THREE.Mesh(geo, mat);
      mm.renderOrder = order || 0;
      merged.add(mm);
    }
  }
  merged.position.copy(root.position);
  merged.rotation.copy(root.rotation);
  root.parent.add(merged);
  root.visible = false;
  return merged;
}

/* ================= 材质分级（工单 3+ 节四级工厂） ================= */

/* 叶面绒面：matSheen 深豆绿，实例色可转枯黄 */
const M_LEAF = matSheen(0x4d7d3a, { roughness: 0.52, sheen: 0.62, sheenColor: 0xcfe0b8, sheenRoughness: 0.55 });
/* 茎秆：亚光绿皮 */
const M_STEM = matStd(0x557d3e, { roughness: 0.66, metalness: 0 });
/* 花瓣：白基色 + 实例色染紫 / 白（clearcoat 高光带） */
const M_PETAL_ANY = matCoat(0xffffff, { roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.26 });
/* 花萼 / 托叶：绿萼 */
const M_CALYX = matStd(0x62884a, { roughness: 0.6 });
/* 豆荚：实例色绿转黄褐 */
const M_POD = matCoat(0x7fae5a, { roughness: 0.46, metalness: 0.02, clearcoat: 0.35, clearcoatRoughness: 0.4 });
/* 卷须：细韧茎色 */
const M_TENDRIL = matStd(0x6d9048, { roughness: 0.58 });
/* 种子：子叶奶油 matSheen（皱粒用实例色压暗 + 压扁） */
const M_SEED = matSheen(0xf2dfa2, { roughness: 0.42, sheen: 0.5, sheenColor: 0xfff4d8 });
/* 种皮：灰种皮（遮子叶） */
const M_COAT = matStd(0xb9ac96, { roughness: 0.5 });
/* 木材：桌 / 畦框 / 攀援架 */
const woodTex = makeWoodTexture({ base: '#7a5634', dark: '#5a3d22', light: '#96703f', streaks: 108, bands: 8, seed: 23 });
woodTex.repeat.set(2.0, 1.5);
const M_WOOD = matStd(0xffffff, { roughness: 0.62, metalness: 0.04 });
M_WOOD.map = woodTex;
const M_WOOD_DARK = matStd(0x4e341e, { roughness: 0.7 });
/* 黄铜（展板饰件 / 壶盖钮 / 样品架立柱） */
const M_BRASS = matStd(PAL.brass, { roughness: 0.3, metalness: 0.85 });
/* 麻绳（攀援架绳网 / 牌绳） */
const M_TWINE = matStd(0xb09a68, { roughness: 0.85 });
/* 素陶（花盆 / 陶盆） */
const M_TERRA = matStd(0xa86844, { roughness: 0.82 });
const M_TERRA_DARK = matStd(0x8a4c30, { roughness: 0.86 });
/* 瓷盘釉面：低粗糙 + 高 env 反射 */
const M_PORCELAIN = matCoat(0xf2f0e6, { roughness: 0.14, clearcoat: 0.9, clearcoatRoughness: 0.12 });
M_PORCELAIN.envMapIntensity = 1.3;
const M_PORCELAIN_IN = matCoat(0xe8e4d6, { roughness: 0.2, clearcoat: 0.7, clearcoatRoughness: 0.2 });
/* 纸袋 / 纸包：牛皮纸 */
const M_PAPER = matStd(0xd9cba8, { roughness: 0.88 });
const M_PAPER_DEEP = matStd(0xbfae86, { roughness: 0.9 });
/* 硬纸展板底 */
const M_BOARD = matStd(0x3a3226, { roughness: 0.6, metalness: 0.1 });
/* 金属工具（镊子） */
const M_STEEL = matStd(0xc9ced6, { roughness: 0.22, metalness: 0.95 });
const M_STEEL_DARK = matStd(0x5a6068, { roughness: 0.4, metalness: 0.9 });
/* 毛笔：笔杆漆木 + 棕毫 */
const M_BRUSH_HANDLE = matCoat(0x6a4a2c, { roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3 });
const M_BRISTLE = matStd(0x9a6e3c, { roughness: 0.9 });
/* 柱头 / 花粉微发光 */
const M_STIGMA = matGlow(0xd9f0b0, 0.35, { roughness: 0.4 });
const M_POLLEN = matGlow(0xf2d05e, 0.5, { roughness: 0.45 });
const M_ANTHER = matStd(0xe8c95e, { roughness: 0.5, emissive: 0x6a5410, emissiveIntensity: 0.25 });
/* 花药架（花特写台） */
const M_STAMEN_FIL = matStd(0xe8e2cc, { roughness: 0.6 });
/* 畦土 / 石墙 / 碎石 / 草皮 */
const M_SOIL = matStd(0xffffff, { roughness: 0.95 });
M_SOIL.map = soilTexture(11);
const M_STONE = matStd(0xffffff, { roughness: 0.9 });
M_STONE.map = stoneTexture(5);
const M_GRAVEL = matStd(0xffffff, { roughness: 0.94 });
M_GRAVEL.map = gravelTexture(17);
const M_GRASS = matStd(0x5e7a3c, { roughness: 0.85 });

/* ================= 遗传引擎（7 座位点 · 配子 · 表型 · 卡方） ================= */

/* 座位点定义：显性 allele 大写、隐性小写；plant/pod/seed 指表达载体 */
const LOCI = {
  H: { name: '茎的高度', dom: '高茎', rec: '矮茎', plant: true },
  P: { name: '花的位置', dom: '腋生', rec: '顶生', plant: true },
  C: { name: '花的颜色', dom: '紫花', rec: '白花', plant: true, coat: true },
  K: { name: '豆荚的形状', dom: '荚饱满', rec: '荚缢缩', pod: true },
  L: { name: '豆荚的颜色（未熟）', dom: '绿荚', rec: '黄荚', pod: true },
  R: { name: '种子的形状', dom: '圆粒', rec: '皱粒', seed: true },
  Y: { name: '子叶的颜色', dom: '黄子叶', rec: '绿子叶', seed: true },
};
/* 教学顺序：种子 → 荚 → 花 → 株（对齐原版性状表） */
const TRAIT_ORDER = ['R', 'Y', 'C', 'K', 'L', 'P', 'H'];

/* 纯系品系：标准系 + 7 隐性突变系 + 复合系（对齐原版「与标准品系相同，但…」口径） */
const STRAINS = {
  std: { name: '标准品系', genes: { H: 'HH', P: 'PP', C: 'CC', K: 'KK', L: 'LL', R: 'RR', Y: 'YY' },
    desc: '圆粒 · 黄子叶 · 紫花（灰种皮）· 荚饱满 · 绿荚 · 腋生 · 高茎' },
  wr: { name: '皱粒品系', genes: { H: 'HH', P: 'PP', C: 'CC', K: 'KK', L: 'LL', R: 'rr', Y: 'YY' },
    desc: '唯种子形状改皱缩，其余六对与标准品系一致' },
  gy: { name: '绿子叶品系', genes: { H: 'HH', P: 'PP', C: 'CC', K: 'KK', L: 'LL', R: 'RR', Y: 'yy' },
    desc: '唯子叶改绿色，其余六对与标准品系一致' },
  wf: { name: '白花品系', genes: { H: 'HH', P: 'PP', C: 'cc', K: 'KK', L: 'LL', R: 'RR', Y: 'YY' },
    desc: '唯花瓣改白色（种皮随之偏白），其余六对与标准品系一致' },
  cp: { name: '缢荚品系', genes: { H: 'HH', P: 'PP', C: 'CC', K: 'kk', L: 'LL', R: 'RR', Y: 'YY' },
    desc: '唯豆荚改缢缩（种子间收腰），其余六对与标准品系一致' },
  yp: { name: '黄荚品系', genes: { H: 'HH', P: 'PP', C: 'CC', K: 'KK', L: 'll', R: 'RR', Y: 'YY' },
    desc: '唯嫩荚改黄色，其余六对与标准品系一致' },
  tf: { name: '顶生花品系', genes: { H: 'HH', P: 'pp', C: 'CC', K: 'KK', L: 'LL', R: 'RR', Y: 'YY' },
    desc: '唯花改茎顶簇生，其余六对与标准品系一致' },
  dw: { name: '矮茎品系', genes: { H: 'hh', P: 'PP', C: 'CC', K: 'KK', L: 'LL', R: 'RR', Y: 'YY' },
    desc: '唯植株改矮小，其余六对与标准品系一致' },
  gwr: { name: '绿皱品系', genes: { H: 'HH', P: 'PP', C: 'CC', K: 'KK', L: 'LL', R: 'rr', Y: 'yy' },
    desc: '唯种子改绿色皱缩，其余六对与标准品系一致' },
  all: { name: '全隐性品系', genes: { H: 'hh', P: 'pp', C: 'cc', K: 'kk', L: 'll', R: 'rr', Y: 'yy' },
    desc: '相对性状七对全为隐性' },
};

/* 单座位配子：杂合 50/50，纯合恒定 */
function alleleOf(gene, rnd = Math.random) {
  if (gene[0] === gene[1]) return gene[0];
  return rnd() < 0.5 ? gene[0] : gene[1];
}
/* 全基因型 → 一枚配子（座位间独立抽样 = 自由组合） */
function gameteOf(genes, rnd = Math.random) {
  const out = {};
  for (const k of Object.keys(genes)) out[k] = alleleOf(genes[k], rnd);
  return out;
}
/* 雌雄配子结合 → 合子基因型（按座位点序） */
function zygoteOf(g1, g2) {
  const out = {};
  for (const k of TRAIT_ORDER) {
    out[k] = [g1[k], g2[k]].sort().join('');
  }
  return out;
}
/* 自交（自花授粉）：同一植株抽两枚配子 */
function selfCross(genes, rnd = Math.random) {
  return zygoteOf(gameteOf(genes, rnd), gameteOf(genes, rnd));
}
/* 杂交：母本 × 父本 */
function crossGenes(motherGenes, fatherGenes, rnd = Math.random) {
  return zygoteOf(gameteOf(motherGenes, rnd), gameteOf(fatherGenes, rnd));
}
/* 座位表型：0 = 显性 1 = 隐性 */
function phenotypeAt(genes, locus) {
  const g = genes[locus];
  return g[0] === g[0].toLowerCase() && g[1] === g[1].toLowerCase() ? 1 : 0;
}
/* 种子表型（种子自己的 R/Y）+ 种皮（随母本 C） */
function seedLook(seedGenes, motherGenes) {
  return {
    wrinkled: phenotypeAt(seedGenes, 'R') === 1,
    cot: phenotypeAt(seedGenes, 'Y') === 1 ? 'green' : 'yellow',
    coat: phenotypeAt(motherGenes, 'C') === 1 ? 'white' : 'grey',
  };
}
/* 植株地上部分表型（本体 H/P/C） */
function plantLook(genes) {
  return {
    tall: phenotypeAt(genes, 'H') === 0,
    terminal: phenotypeAt(genes, 'P') === 1,
    whiteFlower: phenotypeAt(genes, 'C') === 1,
  };
}
/* 结荚表型（母本组织 K/L） */
function podLook(plantGenes) {
  return {
    constricted: phenotypeAt(plantGenes, 'K') === 1,
    yellow: phenotypeAt(plantGenes, 'L') === 1,
  };
}

/* ---- 卡方与 p 值（不完全伽马，df 1..7 通用） ---- */
function gammln(x) {
  const cof = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}
/* P(a,x)：级数式（x < a+1 时收敛快）；末尾补 e^{-x}·x^a/Γ(a) 前置因子 */
function gser(a, x) {
  let ap = a, sum = 1 / a, del = sum;
  for (let n = 0; n < 200; n++) {
    ap += 1; del *= x / ap; sum += del;
    if (Math.abs(del) < Math.abs(sum) * 1e-10) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - gammln(a));
}
/* Q(a,x)：连分式（x ≥ a+1 时收敛快）；同补前置因子 */
function gcf(a, x) {
  const FPMIN = 1e-300;
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
  for (let i = 1; i <= 200; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-10) break;
  }
  return h * Math.exp(-x + a * Math.log(x) - gammln(a));
}
/* χ² → p 值（右尾 Q） */
function chiP(x2, df) {
  if (df <= 0 || x2 <= 0) return 1;
  const a = df / 2, xx = x2 / 2;
  return xx < a + 1 ? 1 - gser(a, xx) : gcf(a, xx);
}
function chi2(obs, exp) {
  let v = 0;
  for (let i = 0; i < obs.length; i++) if (exp[i] > 0) v += ((obs[i] - exp[i]) ** 2) / exp[i];
  return v;
}

/* ---- 理论比推演：亲本基因型确定 → 枚举配子组合 → 所选座位点边缘分布 ---- */
function expectedRatio(motherGenes, fatherGenes, traitSel) {
  if (!motherGenes || !fatherGenes) return null;
  const mOpt = traitSel.map((k) => {
    const g = motherGenes[k];
    return g[0] === g[1] ? [g[0]] : [g[0], g[1]];
  });
  const fOpt = traitSel.map((k) => {
    const g = fatherGenes[k];
    return g[0] === g[1] ? [g[0]] : [g[0], g[1]];
  });
  const tally = new Map();
  const mLen = mOpt.reduce((s, o) => s * o.length, 1);
  const fLen = fOpt.reduce((s, o) => s * o.length, 1);
  for (let i = 0; i < mLen; i++) {
    for (let j = 0; j < fLen; j++) {
      const key = [];
      for (let t = 0; t < traitSel.length; t++) {
        const a = mOpt[t][i % mOpt[t].length];
        const b = fOpt[t][j % fOpt[t].length];
        const pair = [a, b].sort().join('');
        key.push(phenotypeAt({ [traitSel[t]]: pair }, traitSel[t]));
      }
      const kk = key.join('');
      tally.set(kk, (tally.get(kk) || 0) + 1);
    }
  }
  const keys = [...tally.keys()].sort();
  const raw = keys.map((k) => tally.get(k));
  const div = raw.reduce((a, b) => gcd2(a, b), 0) || 1;
  const counts = raw.map((v) => v / div);
  const labels = keys.map((kk) => kk.split('').map((ph, t) => phenotypeLabel(traitSel[t], Number(ph))).join('·'));
  return { keys, counts, labels, ratio: counts.join(':') };
}
function gcd2(a, b) { return b ? gcd2(b, a % b) : a; }
function phenotypeLabel(locus, ph) {
  const L = LOCI[locus];
  return ph === 0 ? L.dom : L.rec;
}

/* 通用统计：观测列表 + 亲本基因型 → 卡方快照
 * mode: 'seeds'（R/Y，种子表型）| 'plants'（H/P/C/K/L，植株表型） */
function computeStats(list, traitSel, mode, motherGenes, fatherGenes) {
  if (!list.length) return null;
  const tally = new Map();
  for (const it of list) {
    const key = traitSel.map((k) => (mode === 'seeds'
      ? (k === 'R' ? (it.wrinkled ? 1 : 0) : (it.cot === 'green' ? 1 : 0))
      : phenotypeAt(it.genes, k))).join('');
    tally.set(key, (tally.get(key) || 0) + 1);
  }
  const theo = expectedRatio(motherGenes, fatherGenes, traitSel);
  const keys = theo ? theo.keys : [...tally.keys()].sort();
  const obs = keys.map((k) => tally.get(k) || 0);
  const total = obs.reduce((s, v) => s + v, 0);
  if (!theo) {
    return {
      labels: keys.map((k) => k.split('').map((ph, t) => phenotypeLabel(traitSel[t], Number(ph))).join('·')),
      obs, exp: keys.map(() => 0), ratioArr: null, ratio: null,
      note: '这批材料亲本基因型无法唯一确定，给不出确定的理论比。', chiV: 0, df: 0, p: 1, verdict: 'na',
    };
  }
  const sum = theo.counts.reduce((s, v) => s + v, 0);
  const exp = theo.counts.map((c) => total * c / sum);
  const chiV = chi2(obs, exp);
  const df = keys.length - 1;
  const p = chiP(chiV, df);
  return {
    labels: theo.labels, obs, exp, ratioArr: theo.counts.map(String), ratio: theo.ratio,
    chiV, df, p, note: '', verdict: p > 0.05 ? 'good' : 'bad',
  };
}

/* ================= 豆园世界（六行豆畦 · 石墙 · 小径 · 道具） ================= */

const worldG = new THREE.Group();
scene.add(worldG);

/* 地面：畦区壤土大板 + 草皮边 + 碎石小径 */
{
  const ground = mesh(new THREE.BoxGeometry(26, 0.3, 16), matStd(0x2e3a26, { roughness: 0.92 }));
  ground.position.set(0, -0.17, -1);
  worldG.add(ground);
  const lawn = mesh(new THREE.BoxGeometry(26, 0.06, 16), M_GRASS);
  lawn.position.set(0, 0, -1);
  worldG.add(lawn);
  const path = mesh(new THREE.PlaneGeometry(26, 1.1), M_GRAVEL);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.035, 1.45);
  worldG.add(path);
  const bedLane = mesh(new THREE.PlaneGeometry(26, 8.6), M_SOIL);
  bedLane.rotation.x = -Math.PI / 2;
  bedLane.position.set(0, 0.03, -2.4);
  worldG.add(bedLane);
}

/* 石墙背景 + 木门柱（墙体按材质并入 statics） */
{
  const stoneG = new THREE.Group();
  const wall = mesh(new THREE.BoxGeometry(26, 2.7, 0.6), M_STONE);
  wall.position.set(0, 1.35, -6.8);
  const cap = mesh(new THREE.BoxGeometry(26.2, 0.16, 0.72), M_STONE);
  cap.position.set(0, 2.76, -6.8);
  const pier1 = mesh(new THREE.BoxGeometry(0.8, 3.2, 0.8), M_STONE);
  pier1.position.set(-2.6, 1.6, -6.4);
  const pier2 = pier1.clone();
  pier2.position.x = 2.6;
  stoneG.add(wall, cap, pier1, pier2);
  worldG.add(stoneG);
  mergeStatics(stoneG);

  const woodG = new THREE.Group();
  for (const x of [-1.5, 1.5]) {
    const post = mesh(new THREE.BoxGeometry(0.26, 2.9, 0.26), M_WOOD_DARK);
    post.position.set(x, 1.45, -6.3);
    woodG.add(post);
    const finial = mesh(new THREE.SphereGeometry(0.14, 12, 10), M_BRASS);
    finial.position.set(x, 2.98, -6.3);
    woodG.add(finial);
  }
  const lintel = mesh(new THREE.BoxGeometry(3.6, 0.2, 0.3), M_WOOD_DARK);
  lintel.position.set(0, 2.62, -6.3);
  woodG.add(lintel);
  worldG.add(woodG);
  mergeStatics(woodG);
}

/* 六行豆畦：木框（并入 statics）+ 畦土 + 行牌（动态重绘纹理） */
const BED_XS = [-5.75, -3.45, -1.15, 1.15, 3.45, 5.75];
const BED_Z = -1.2;
const BED_W = 2.06, BED_D = 1.5, BED_H = 0.24;
const ROW_NO = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ'];
const beds = BED_XS.map((bx, i) => {
  const bed = new THREE.Group();
  bed.position.set(bx, 0, BED_Z);
  /* 木框：四条圆角埂 + 四角柱（并入 statics wood） */
  const frameG = new THREE.Group();
  const fLong = BED_W + 0.1, fShort = BED_D + 0.1, fT = 0.09;
  const side1 = mesh(new THREE.BoxGeometry(fLong, BED_H + 0.06, fT), M_WOOD);
  side1.position.set(0, (BED_H + 0.06) / 2, -(BED_D / 2 + fT / 2 - 0.01));
  const side2 = side1.clone();
  side2.position.z = BED_D / 2 + fT / 2 - 0.01;
  const end1 = mesh(new THREE.BoxGeometry(fT, BED_H + 0.06, fShort), M_WOOD);
  end1.position.set(-(BED_W / 2 + fT / 2 - 0.01), (BED_H + 0.06) / 2, 0);
  const end2 = end1.clone();
  end2.position.x = BED_W / 2 + fT / 2 - 0.01;
  const corner1 = mesh(new THREE.CylinderGeometry(0.05, 0.06, BED_H + 0.1, 10), M_WOOD_DARK);
  corner1.position.set(-(BED_W / 2 - 0.02), (BED_H + 0.1) / 2, -(BED_D / 2 - 0.02));
  const corner2 = corner1.clone();
  corner2.position.x = BED_W / 2 - 0.02;
  const corner3 = corner1.clone();
  corner3.position.z = BED_D / 2 - 0.02;
  const corner4 = corner1.clone();
  corner4.position.set(BED_W / 2 - 0.02, (BED_H + 0.1) / 2, BED_D / 2 - 0.02);
  frameG.add(side1, side2, end1, end2, corner1, corner2, corner3, corner4);
  bed.add(frameG);
  /* 畦土 */
  const soil = mesh(new THREE.BoxGeometry(BED_W - 0.04, BED_H, BED_D - 0.04), M_SOIL);
  soil.position.y = BED_H / 2;
  bed.add(soil);
  /* 行牌：前缘小木牌（动态重绘） */
  const plaque = canvasTex(256, 128, () => {});
  const plateMat = matStd(0xffffff, { roughness: 0.85 });
  plateMat.map = plaque.tex;
  const plateBack = mesh(new THREE.BoxGeometry(0.62, 0.33, 0.03), M_WOOD_DARK);
  plateBack.position.set(-0.55, 0.5, BED_D / 2 + 0.07);
  const plateFace = mesh(new THREE.PlaneGeometry(0.58, 0.3), plateMat);
  plateFace.position.set(-0.55, 0.5, BED_D / 2 + 0.09);
  plateFace.rotation.x = -0.28;
  bed.add(plateBack, plateFace);
  worldG.add(bed);
  bakeContactShadow(bx, BED_Z, BED_W + 0.5, BED_D + 0.6, 0.3);
  return {
    group: bed, no: ROW_NO[i], x: bx,
    plaque, plateFace,
    strainKey: null, strainName: null, strainDesc: null, bigSample: false,
    plate(noTxt, nameTxt, subTxt) {
      drawPlate(plaque.ctx, 256, 128, noTxt, nameTxt, subTxt);
      plaque.tex.needsUpdate = true;
    },
  };
});

/* 攀援架：Ⅲ / Ⅴ 行 A 字架 + 麻绳网格（木架并入 statics，绳网并入 statics twine） */
for (const bi of [2, 4]) {
  const bx = BED_XS[bi];
  const treG = new THREE.Group();
  const twG = new THREE.Group();
  for (const dx of [-0.9, 0.9]) {
    for (const dz of [-0.5, 0.5]) {
      const leg = mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.5, 8), M_WOOD_DARK);
      leg.position.set(bx + dx, 1.25, BED_Z + dz);
      leg.rotation.z = dx > 0 ? -0.1 : 0.1;
      treG.add(leg);
    }
  }
  const ridge = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.95, 8), M_WOOD_DARK);
  ridge.rotation.z = Math.PI / 2;
  ridge.position.set(bx, 2.44, BED_Z);
  treG.add(ridge);
  for (const lvl of [0.7, 1.3, 1.9]) {
    const bar = mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.8, 6), M_WOOD_DARK);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(bx, lvl, BED_Z);
    treG.add(bar);
  }
  worldG.add(treG);
  mergeStatics(treG);
  for (const dz of [-0.5, -0.17, 0.17, 0.5]) {
    const tw = mesh(new THREE.CylinderGeometry(0.008, 0.008, 2.3, 5), M_TWINE);
    tw.position.set(bx, 1.18, BED_Z + dz);
    twG.add(tw);
  }
  for (const lvl of [0.7, 1.3, 1.9]) {
    for (const dz of [-0.5, -0.17, 0.17, 0.5]) {
      const knot = mesh(new THREE.SphereGeometry(0.02, 6, 6), M_TWINE);
      knot.position.set(bx, lvl, BED_Z + dz);
      twG.add(knot);
    }
  }
  worldG.add(twG);
  mergeStatics(twG);
}

/* 桌面道具：浇水壶（车削壶身 + 壶嘴扫掠 + 提梁 + 壶盖钮） */
function makeWateringCan(x, z, rotY = 0.5) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  const prof = [
    [0.02, 0], [0.24, 0.02], [0.27, 0.1], [0.3, 0.3], [0.3, 0.52], [0.24, 0.6], [0.22, 0.62],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const bodyMat = matStd(0x7a8488, { roughness: 0.38, metalness: 0.7 });
  const body = mesh(new THREE.LatheGeometry(prof, 24), bodyMat);
  g.add(body);
  const spoutPts = [
    new THREE.Vector3(0.2, 0.34, 0), new THREE.Vector3(0.42, 0.5, 0.02),
    new THREE.Vector3(0.62, 0.72, 0.02), new THREE.Vector3(0.74, 0.9, 0),
  ];
  g.add(mesh(sweepTube(spoutPts, (t) => 0.045 - t * 0.02, 10, 20), bodyMat));
  const rose = mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.1, 12), bodyMat);
  rose.rotation.z = -0.5;
  rose.position.set(0.76, 0.95, 0);
  g.add(rose);
  const handle = mesh(new THREE.TorusGeometry(0.17, 0.02, 8, 20, Math.PI * 1.1), bodyMat);
  handle.position.set(0, 0.62, -0.14);
  handle.rotation.y = Math.PI / 2;
  handle.rotation.z = 0.35;
  g.add(handle);
  const knob = mesh(new THREE.SphereGeometry(0.05, 10, 8), M_BRASS);
  knob.position.set(0, 0.68, 0);
  g.add(knob);
  bakeContactShadow(x, z, 1.0, 0.7, 0.32);
  return g;
}
worldG.add(makeWateringCan(6.95, 1.42, 0.55));

/* 种子箱：盒体 + 隔条 + 品系纸包 ×6（纸包带标签贴图） */
{
  const crateG = new THREE.Group();
  crateG.position.set(-8.35, 0, 1.42);
  crateG.rotation.y = 0.2;
  const base = mesh(new THREE.BoxGeometry(1.6, 0.1, 0.9), M_WOOD);
  base.position.y = 0.14;
  const wallF = mesh(new THREE.BoxGeometry(1.6, 0.34, 0.07), M_WOOD);
  wallF.position.set(0, 0.34, 0.44);
  const wallB = wallF.clone();
  wallB.position.z = -0.44;
  const wallL = mesh(new THREE.BoxGeometry(0.07, 0.34, 0.9), M_WOOD);
  wallL.position.set(-0.78, 0.34, 0);
  const wallR = wallL.clone();
  wallR.position.x = 0.78;
  const divider1 = mesh(new THREE.BoxGeometry(0.05, 0.28, 0.84), M_WOOD_DARK);
  divider1.position.set(-0.26, 0.3, 0);
  const divider2 = divider1.clone();
  divider2.position.x = 0.26;
  crateG.add(base, wallF, wallB, wallL, wallR, divider1, divider2);
  const PACKS = [
    ['标准品系', '圆·黄子叶·紫花'], ['皱粒品系', '种皮皱缩'], ['绿子叶品系', '子叶绿'],
    ['白花品系', '种皮白'], ['矮茎品系', '株高 0.3~0.5 m'], ['黄荚品系', '嫩荚黄'],
  ];
  PACKS.forEach(([nm, sub], i) => {
    const px = -0.52 + (i % 3) * 0.52;
    const pz = i < 3 ? -0.12 : 0.16;
    const pack = mesh(new THREE.BoxGeometry(0.34, 0.2, 0.05), M_PAPER_DEEP);
    pack.position.set(px, 0.5, pz);
    pack.rotation.set(i < 3 ? -0.5 : -0.62, (i % 2 - 0.5) * 0.3, 0);
    crateG.add(pack);
    const lblMat = matStd(0xffffff, { roughness: 0.85 });
    lblMat.map = makeLabelTexture([nm, sub], { w: 220, h: 120, lineSizes: [30, 20], accent: '#7a5a34' });
    const lbl = mesh(new THREE.PlaneGeometry(0.3, 0.17), lblMat);
    lbl.position.set(px, 0.5, pz + (i < 3 ? -0.026 : 0.026));
    lbl.rotation.copy(pack.rotation);
    if (i >= 3) lbl.rotation.y += Math.PI;
    lbl.position.y += i < 3 ? 0.005 : -0.005;
    crateG.add(lbl);
  });
  worldG.add(crateG);
  bakeContactShadow(-8.35, 1.42, 1.7, 1.0, 0.3);
}

/* 陶盆（车削素陶，盆口沿外翻） */
function makePot(x, z, s = 1) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.scale.setScalar(s);
  const prof = [
    [0.16, 0], [0.22, 0.02], [0.3, 0.3], [0.33, 0.42], [0.36, 0.46], [0.34, 0.5],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const pot = mesh(new THREE.LatheGeometry(prof, 22), M_TERRA);
  g.add(pot);
  const rim = mesh(new THREE.TorusGeometry(0.35, 0.025, 8, 22), M_TERRA_DARK);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.48;
  g.add(rim);
  const soilDisc = mesh(new THREE.CircleGeometry(0.3, 18), M_SOIL);
  soilDisc.rotation.x = -Math.PI / 2;
  soilDisc.position.y = 0.44;
  g.add(soilDisc);
  bakeContactShadow(x, z, 0.85 * s, 0.85 * s, 0.3);
  return g;
}
worldG.add(makePot(0.7, 1.5, 1));
worldG.add(makePot(1.35, 1.42, 0.78));

/* 工具边桌（花特写台底座） */
function makeSideTable(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const top = roundedSlab(1.5, 0.8, 0.07, 0.06, M_WOOD);
  top.position.y = 0.92;
  g.add(top);
  for (const [dx, dz] of [[-0.62, -0.28], [0.62, -0.28], [-0.62, 0.28], [0.62, 0.28]]) {
    const leg = mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.92, 10), M_WOOD_DARK);
    leg.position.set(dx, 0.46, dz);
    g.add(leg);
  }
  const rail1 = mesh(new THREE.BoxGeometry(1.28, 0.05, 0.04), M_WOOD_DARK);
  rail1.position.set(0, 0.2, -0.28);
  const rail2 = rail1.clone();
  rail2.position.z = 0.28;
  g.add(rail1, rail2);
  bakeContactShadow(x, z, 1.6, 0.9, 0.3);
  return g;
}
worldG.add(makeSideTable(10.4, 4.5));

/* ================= 植株实例系统（茎 / 叶 / 卷须 / 蕾 / 花 / 荚 全实例化） ================= */

const GROW_DAYS = 96;
const MAX_PLANTS = 32;
const LEAF_PER = 5, FLOWER_PER = 4, POD_PER = 3, TENDRIL_PER = 2;

/* 单位茎：S 微弯中心线 + 变宽截面（底 0.05 → 顶 0.014），instance y 缩放表达株高 */
const stemPts = [];
for (let i = 0; i <= 10; i++) {
  const t = i / 10;
  stemPts.push(new THREE.Vector3(
    Math.sin(t * 3.2) * 0.16 * t,
    t,
    Math.cos(t * 2.4) * 0.1 * t,
  ));
}
const stemGeo = sweepTube(stemPts, (t) => 0.05 - t * 0.036, 9, 40);

/* 三出复叶单元：3 叶片（叶缘挤出 + 中脉折起）+ 叶柄，origin 在叶柄基，+X 指向叶端 */
function trifoliateGeo() {
  const parts = [];
  const petiole = sweepTube(
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1, 0.02, 0), new THREE.Vector3(0.19, 0.045, 0)],
    (t) => 0.012 - t * 0.006, 7, 12,
  );
  parts.push(petiole);
  const leafLen = 0.3, leafWid = 0.13;
  const leaf = leafGeometry(leafLen, leafWid, 0.1);
  const l1 = leaf.clone();
  l1.translate(0.2, 0.05, 0);
  parts.push(l1);
  const l2 = leaf.clone();
  l2.rotateY(0.96);
  l2.translate(0.17, 0.02, 0.1);
  parts.push(l2);
  const l3 = leaf.clone();
  l3.rotateY(-0.96);
  l3.translate(0.17, 0.02, -0.1);
  parts.push(l3);
  return mergeGeoms(parts) || petiole;
}
const trifoliateGeoUnit = trifoliateGeo();

/* 卷须单元：螺旋细管（半径渐细），origin 在基端 */
function tendrilGeo() {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    pts.push(new THREE.Vector3(
      Math.sin(t * 9.5) * 0.055 * t,
      t * 0.42,
      Math.cos(t * 9.5) * 0.055 * t,
    ));
  }
  return sweepTube(pts, (t) => 0.008 - t * 0.005, 6, 36);
}
const tendrilGeoUnit = tendrilGeo();

/* 蝶形花单元：旗瓣 + 翼瓣×2 + 龙骨瓣×2 + 花萼，origin 在花柄端，+Y 上、+Z 朝开面 */
function bloomGeoUnit() {
  const parts = [];
  const pedicel = sweepTube(
    [new THREE.Vector3(0, -0.08, 0), new THREE.Vector3(0.02, -0.02, 0), new THREE.Vector3(0, 0.02, 0)],
    (t) => 0.012 - t * 0.005, 7, 10,
  );
  parts.push(pedicel);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    const sep = new THREE.ConeGeometry(0.022, 0.09, 6);
    sep.translate(0, 0.045, 0);
    sep.rotateX(1.1);
    const m = new THREE.Matrix4().makeRotationY(a).setPosition(Math.cos(a) * 0.035, 0.05, Math.sin(a) * 0.035);
    sep.applyMatrix4(m);
    parts.push(sep);
  }
  const flag = petalGeometry(0.16, 0.11, 0.03);
  flag.rotateX(-0.85);
  flag.translate(0, 0.075, 0.008);
  parts.push(flag);
  for (const s of [-1, 1]) {
    const wing = petalGeometry(0.13, 0.085, 0.035);
    wing.rotateX(-0.5);
    wing.rotateY(s * 0.78);
    wing.rotateZ(s * 0.35);
    wing.translate(s * 0.052, 0.055, 0.02);
    parts.push(wing);
  }
  for (const s of [-1, 1]) {
    const keel = petalGeometry(0.11, 0.07, 0.05);
    keel.rotateX(0.55);
    keel.rotateY(s * 0.22);
    keel.translate(s * 0.02, 0.04, 0.028);
    parts.push(keel);
  }
  return mergeGeoms(parts) || pedicel;
}
const bloomGeoUnit2 = bloomGeoUnit();

/* 蕾单元：水滴形花蕾（缩放球 + 萼片 + 短柄），origin 花柄端 */
function budGeoUnit() {
  const parts = [];
  const bud = new THREE.SphereGeometry(0.052, 12, 10);
  bud.scale(1, 1.5, 0.9);
  bud.translate(0, 0.1, 0);
  parts.push(bud);
  const sep = new THREE.ConeGeometry(0.032, 0.1, 7);
  sep.translate(0, 0.045, 0);
  parts.push(sep);
  const ped = new THREE.CylinderGeometry(0.008, 0.01, 0.06, 6);
  parts.push(ped);
  return mergeGeoms(parts) || bud;
}
const budGeoUnit2 = budGeoUnit();

/* 豆荚单元（饱满版）：扫掠荚体（两端渐细）+ 荚柄 + 喙尖，origin 在柄端，+Y 荚长方向 */
function podGeoSmooth() {
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    pts.push(new THREE.Vector3(Math.sin(t * 1.4) * 0.02, t * 0.4, 0));
  }
  const body = sweepTube(pts, (t) => 0.052 * (0.4 + Math.sin(Math.min(1, t * 1.05) * Math.PI * 0.92) * 0.72), 10, 26);
  const stalk = sweepTube(
    [new THREE.Vector3(0, -0.04, 0), new THREE.Vector3(0, -0.01, 0), new THREE.Vector3(0, 0.01, 0)],
    (t) => 0.011 - t * 0.004, 6, 8,
  );
  const tip = new THREE.ConeGeometry(0.014, 0.05, 6);
  tip.rotateX(Math.PI);
  tip.translate(0, 0.43, 0);
  return mergeGeoms([body, stalk, tip]) || body;
}
const podGeoA = podGeoSmooth();

/* 豆荚单元（缢缩版）：4 枚鼓节 + 节间收腰 */
function podGeoConstricted() {
  const parts = [];
  const stalk = sweepTube(
    [new THREE.Vector3(0, -0.04, 0), new THREE.Vector3(0, -0.01, 0), new THREE.Vector3(0, 0.01, 0)],
    (t) => 0.011 - t * 0.004, 6, 8,
  );
  parts.push(stalk);
  const SEEDS = 4;
  for (let i = 0; i < SEEDS; i++) {
    const y = 0.05 + i * 0.085;
    const bulge = new THREE.SphereGeometry(0.05, 12, 10);
    bulge.scale(1, 1.45, 0.95);
    bulge.translate(0, y, 0);
    parts.push(bulge);
    if (i < SEEDS - 1) {
      const waist = new THREE.CylinderGeometry(0.028, 0.028, 0.03, 10);
      waist.translate(0, y + 0.042, 0);
      parts.push(waist);
    }
  }
  const tip = new THREE.ConeGeometry(0.013, 0.04, 6);
  tip.rotateX(Math.PI);
  tip.translate(0, 0.05 + (SEEDS - 1) * 0.085 + 0.085, 0);
  parts.push(tip);
  return mergeGeoms(parts) || stalk;
}
const podGeoB = podGeoConstricted();

/* ---- 实例化网格池（各 1 draw call；instanceColor 承载花色 / 荚色 / 枯黄） ---- */
function makeInstanced(geo, mat, cap) {
  const im = new THREE.InstancedMesh(geo, mat, cap);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.count = 0;
  im.frustumCulled = false;
  const white = new THREE.Color(1, 1, 1);
  for (let i = 0; i < cap; i++) im.setColorAt(i, white);
  worldG.add(im);
  return im;
}
const instStem = makeInstanced(stemGeo, M_STEM, MAX_PLANTS);
const instLeaf = makeInstanced(trifoliateGeoUnit, M_LEAF, MAX_PLANTS * LEAF_PER);
const instTendril = makeInstanced(tendrilGeoUnit, M_TENDRIL, MAX_PLANTS * TENDRIL_PER);
const instBud = makeInstanced(budGeoUnit2, matStd(0x8fae62, { roughness: 0.55 }), MAX_PLANTS * FLOWER_PER);
const instBloom = makeInstanced(bloomGeoUnit2, M_PETAL_ANY, MAX_PLANTS * FLOWER_PER);
const instPodA = makeInstanced(podGeoA, M_POD, MAX_PLANTS * POD_PER);
const instPodB = makeInstanced(podGeoConstricted(), M_POD, MAX_PLANTS * POD_PER);

/* 植株登记：bed / slot / 基因型 / 播种日 / 显示态 */
const plants = [];
const SLOT_XS = [-0.72, -0.24, 0.24, 0.72];
const SLOT_ZS = [-0.34, 0.34];
function plantPos(p) {
  return new THREE.Vector3(BED_XS[p.bed] + SLOT_XS[p.slot % 4], 0.26, BED_Z + SLOT_ZS[Math.floor(p.slot / 4)]);
}
function addPlant(bed, slot, genes, sowDay) {
  const p = { bed, slot, genes, sowDay, genoSprite: null, id: plants.length };
  plants.push(p);
  return p;
}
function clearPlants(filter) {
  for (let i = plants.length - 1; i >= 0; i--) {
    const p = plants[i];
    if (!filter || filter(p)) {
      if (p.genoSprite) p.genoSprite.visible = false;
      plants.splice(i, 1);
    }
  }
  syncGenoLabels();
}
function plantsOfBed(bi) {
  return plants.filter((p) => p.bed === bi);
}

/* 基因型标签（显示基因型开关用） */
const genoPool = [];
for (let i = 0; i < MAX_PLANTS; i++) {
  const s = label('', '#e8f2d8', 0.0034, 'rgba(10,16,12,0.68)');
  s.visible = false;
  worldG.add(s);
  genoPool.push(s);
}
let showGeno = false;
function genoText(p) {
  const t = [];
  for (const k of TRAIT_ORDER) t.push(k + ':' + p.genes[k]);
  return t.join(' ');
}
function syncGenoLabels() {
  genoPool.forEach((sp, i) => {
    const p = plants[i];
    if (!p) { sp.visible = false; return; }
    p.genoSprite = sp;
    const pos = plantPos(p);
    sp.position.set(pos.x, pos.y + 2.45, pos.z);
    setSpriteText(sp, showGeno ? genoText(p) : '', { fontSize: 26, color: '#e8f2d8', scale: 0.0028, bg: 'rgba(10,16,12,0.68)' });
    sp.visible = showGeno;
  });
}

/* 生长曲线：日 → 各部件比例（供实例矩阵重建） */
const smooth01 = (t) => clamp(t, 0, 1);
function plantGrowth(p, day) {
  const g = clamp((day - p.sowDay) / GROW_DAYS, 0, 1.08);
  return {
    g,
    stem: smooth01(g / 0.52),
    leaves: [0, 1, 2, 3, 4].map((i) => smooth01((g * GROW_DAYS - (6 + i * 8.5)) / 6)),
    tendrils: smooth01((g - 0.56) / 0.14),
    bud: [0, 1, 2, 3].map((i) => smooth01((g * GROW_DAYS - (30 + i * 5.5)) / 5)),
    bloom: [0, 1, 2, 3].map((i) => smooth01((g * GROW_DAYS - (38 + i * 5.5)) / 5)),
    pods: [0, 1, 2].map((i) => smooth01((g * GROW_DAYS - (58 + i * 6)) / 10)),
    ripe: smooth01((g - 0.86) / 0.2),
  };
}
function growthStageName(day) {
  if (day <= 2) return '播种前';
  if (day < 12) return '出苗期';
  if (day < 34) return '营养生长';
  if (day < 58) return '开花期';
  if (day < 88) return '结荚期';
  return '成熟期';
}

/* 颜色插值缓存 */
const C_LEAF_YOUNG = new THREE.Color(0x6a9a4a);
const C_LEAF_RIPE = new THREE.Color(0xa8924a);
const C_POD_GREEN = new THREE.Color(0x7fae5a);
const C_POD_YELLOW = new THREE.Color(0xd9c25e);
const C_POD_RIPE = new THREE.Color(0xc4a86a);
const C_PETAL_PURPLE = new THREE.Color(0x9d6fd9);
const C_PETAL_WHITE = new THREE.Color(0xf2efe6);

const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v3 = new THREE.Vector3();
const _s3 = new THREE.Vector3();
const _e = new THREE.Euler();
const _col = new THREE.Color();

/* 实例重建：day 变化 / 播种 / 收获 / 开关基因型标签时调用（脏标记由主循环消费）。
 * bloom 实例按「每株 FLOWER_PER 槽位」对齐写入（含退化占位），raycast 按 instanceId → 植株映射 */
let growthDirty = true;
function rebuildInstances(day) {
  let si = 0, li = 0, ti = 0, bi = 0, fi = 0, pai = 0, pbi = 0;
  for (const p of plants) {
    const G = plantGrowth(p, day);
    const pos = plantPos(p);
    const look = plantLook(p.genes);
    const look2 = podLook(p.genes);
    const hFull = (look.tall ? 2.05 : 0.82) * (0.92 + (p.id % 5) * 0.03);
    const hNow = Math.max(0.06, hFull * G.stem);
    /* 茎 */
    if (G.g > 0.02) {
      _e.set(0, (p.id % 7) * 0.9, 0);
      _q.setFromEuler(_e);
      _v3.copy(pos);
      _s3.set(1, hNow, 1);
      _m4.compose(_v3, _q, _s3);
      instStem.setMatrixAt(si++, _m4);
    }
    /* 叶 ×5：随节位出现，成熟期下垂转黄 */
    for (let n = 0; n < LEAF_PER; n++) {
      const lf = G.leaves[n];
      if (lf <= 0.01) continue;
      const nodeFrac = 0.14 + n * 0.17;
      const sway = Math.sin(n * 1.7 + p.id) * 0.14;
      _e.set(
        -0.15 + G.ripe * 0.85 + sway * 0.3,
        (p.id * 2.3 + n * 2.4) % TAU,
        0.25 * (n % 2 ? 1 : -1) + sway,
      );
      _q.setFromEuler(_e);
      _v3.set(pos.x, pos.y + Math.max(0.05, nodeFrac * hNow), pos.z);
      const s = 0.75 + lf * 0.5;
      _s3.set(s, s, s * (1 - G.ripe * 0.15));
      _m4.compose(_v3, _q, _s3);
      instLeaf.setMatrixAt(li, _m4);
      _col.copy(C_LEAF_YOUNG).lerp(C_LEAF_RIPE, G.ripe * 0.8);
      instLeaf.setColorAt(li++, _col);
    }
    /* 卷须 ×2（茎顶） */
    if (G.tendrils > 0.02) {
      for (let n = 0; n < TENDRIL_PER && ti < MAX_PLANTS * TENDRIL_PER; n++) {
        _e.set(0.4 * (n - 0.5), (p.id + n) * 1.3, 0.3 * (n - 0.5));
        _q.setFromEuler(_e);
        _v3.set(pos.x + (n - 0.5) * 0.06, pos.y + hNow * 0.94, pos.z);
        _s3.set(1, 1, 1);
        _m4.compose(_v3, _q, _s3);
        instTendril.setMatrixAt(ti++, _m4);
      }
    }
    /* 蕾 / 花：腋生 4 处（节位渐次），顶生一簇 3 处；bloom 槽位对齐写入 */
    const spots = look.terminal
      ? [[0.94, 0], [0.99, 0.09], [0.99, -0.09]]
      : [[0.4, 0.14], [0.72, -0.12], [0.9, 0.1], [0.58, -0.16]];
    for (let n = 0; n < FLOWER_PER; n++) {
      const bd = G.bud[n], bl = G.bloom[n];
      const visible = n < spots.length && (bd > 0.01 || bl > 0.01);
      if (bl > 0.05 && n < spots.length) {
        const [frac, off] = spots[n];
        const outward = (p.id + n) % 2 ? 0.9 : -0.9;
        _e.set(0.5, outward + (n - 1.5) * 0.5, 0);
        _q.setFromEuler(_e);
        const fy = pos.y + Math.max(0.06, frac * hNow);
        _v3.set(pos.x + off * (look.terminal ? 0.3 : 1) * 0.3, fy, pos.z + off * 0.22);
        const s = 0.55 + bl * 0.75;
        _s3.set(s, s, s);
        _m4.compose(_v3, _q, _s3);
        instBloom.setMatrixAt(fi, _m4);
        _col.copy(look.whiteFlower ? C_PETAL_WHITE : C_PETAL_PURPLE);
        instBloom.setColorAt(fi++, _col);
      } else {
        /* 空槽位：退化矩阵占位（缩放 0、沉到地下），保持槽位 → 植株映射成立 */
        _q.identity();
        _v3.set(pos.x, -10, pos.z);
        _s3.set(0, 0, 0);
        _m4.compose(_v3, _q, _s3);
        instBloom.setMatrixAt(fi++, _m4);
      }
      if (bd > 0.01 && bl <= 0.05 && n < spots.length) {
        const [frac, off] = spots[n];
        const outward = (p.id + n) % 2 ? 0.9 : -0.9;
        _e.set(0.5, outward + (n - 1.5) * 0.5, 0);
        _q.setFromEuler(_e);
        _v3.set(pos.x + off * 0.3, pos.y + Math.max(0.06, frac * hNow), pos.z + off * 0.22);
        const s = 0.5 + bd * 0.6;
        _s3.set(s, s, s);
        _m4.compose(_v3, _q, _s3);
        instBud.setMatrixAt(bi++, _m4);
      }
    }
    /* 豆荚 ×3（母本组织：K/L 按结荚植株表达） */
    const podMesh = look2.constricted ? instPodB : instPodA;
    const podIdx = look2.constricted ? pbi : pai;
    for (let n = 0; n < POD_PER; n++) {
      const pf = G.pods[n];
      if (pf <= 0.02) continue;
      _e.set(0.9 + G.ripe * 0.6, ((p.id + n * 2) % 5 - 2) * 0.55, 0);
      _q.setFromEuler(_e);
      const nodeFrac = 0.34 + n * 0.2;
      _v3.set(pos.x, pos.y + Math.max(0.08, nodeFrac * hNow), pos.z + (n - 1) * 0.1);
      const s = 0.4 + pf * 0.85;
      _s3.set(s, s, s);
      _m4.compose(_v3, _q, _s3);
      podMesh.setMatrixAt(podIdx + n, _m4);
      _col.copy(look2.yellow ? C_POD_YELLOW : C_POD_GREEN).lerp(C_POD_RIPE, G.ripe * 0.85);
      podMesh.setColorAt(podIdx + n, _col);
    }
    if (look2.constricted) pbi += POD_PER; else pai += POD_PER;
  }
  instStem.count = si;
  instLeaf.count = li;
  instTendril.count = ti;
  instBud.count = bi;
  instBloom.count = fi;
  instPodA.count = pai;
  instPodB.count = pbi;
  for (const im of [instStem, instLeaf, instTendril, instBud, instBloom, instPodA, instPodB]) {
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }
}

/* 花朵拾取：instanceId → 植株（与 rebuildInstances 的槽位对齐一一对应） */
function pickBloomInstance(instId) {
  let acc = 0;
  for (const p of plants) {
    if (instId < acc + FLOWER_PER) return p;
    acc += FLOWER_PER;
  }
  return null;
}

/* ================= 花特写台（人工异花授粉的交互舞台，仅授粉章可见） ================= */

const flowerStation = new THREE.Group();
flowerStation.position.set(10.4, 0, 3.4);
flowerStation.visible = false;
scene.add(flowerStation);

/* 授粉流程可视状态（章控件驱动） */
const FS = {
  petalsOpen: 0, anthersLeft: 10, bagged: false,
  stigmaRipe: false, pollenOnBrush: false, pollinated: false, tagged: false, done: false,
};

{
  /* 陶盆大花基座：陶盆 + 盆土 + 花枝 */
  const pot = makePot(0, 0, 1.15);
  flowerStation.add(pot);
  const stemPts2 = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    stemPts2.push(new THREE.Vector3(Math.sin(t * 2.2) * 0.09, t * 0.62, Math.cos(t * 1.8) * 0.05));
  }
  flowerStation.add(mesh(sweepTube(stemPts2, (t) => 0.028 - t * 0.012, 9, 30), M_STEM));
  /* 枝顶两片复叶 */
  for (const s of [-1, 1]) {
    const lf = mesh(trifoliateGeoUnit, M_LEAF);
    lf.position.set(s * 0.12, 0.34, 0);
    lf.scale.setScalar(0.85);
    lf.rotation.y = s * 1.2;
    lf.rotation.z = 0.3;
    flowerStation.add(lf);
  }
}

/* 大花头：可开合花瓣组 + 10 枚雄蕊（逐枚可夹）+ 雌蕊 */
const fsFlower = new THREE.Group();
fsFlower.position.set(0, 0.64, 0);
flowerStation.add(fsFlower);

const fsPetals = {};
{
  /* 花萼：5 枚萼片锥围成一圈 */
  const calyxG = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    const sep = mesh(new THREE.ConeGeometry(0.05, 0.2, 7), M_CALYX);
    sep.position.set(Math.cos(a) * 0.07, 0.08, Math.sin(a) * 0.07);
    sep.rotation.x = 0.9;
    sep.rotation.y = -a;
    calyxG.add(sep);
  }
  fsFlower.add(calyxG);

  /* 旗瓣（向后仰开） */
  const flagPivot = new THREE.Group();
  flagPivot.position.y = 0.14;
  const flag = mesh(petalGeometry(0.5, 0.36, 0.1), matCoat(0x9d6fd9, { roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.26 }));
  flag.rotation.x = -0.4;
  flagPivot.add(flag);
  fsFlower.add(flagPivot);
  fsPetals.flag = flagPivot;

  /* 翼瓣 ×2（左右张开） */
  const wingPivots = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.y = 0.1;
    const wing = mesh(petalGeometry(0.42, 0.26, 0.09), matCoat(0xb893e8, { roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.3 }));
    wing.position.set(s * 0.14, 0.02, 0.02);
    wing.rotation.y = s * 0.5;
    wing.rotation.z = s * 0.28;
    pivot.add(wing);
    fsFlower.add(pivot);
    wingPivots.push(pivot);
  }
  fsPetals.wings = wingPivots;

  /* 龙骨瓣 ×2（合抱半透明，下翻露出雄蕊） */
  const keelPivots = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.y = 0.08;
    const keel = mesh(petalGeometry(0.34, 0.2, 0.09), matCoat(0x8f5fd0, { roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.35, opacity: 0.92 }));
    keel.position.set(s * 0.045, 0.02, 0.05);
    keel.rotation.x = 0.5;
    keel.rotation.y = s * 0.16;
    pivot.add(keel);
    fsFlower.add(pivot);
    keelPivots.push(pivot);
  }
  fsPetals.keels = keelPivots;

  /* 雄蕊 10 枚：花丝（弯管）+ 花药（椭圆）；raycast 目标 = 花药 mesh */
  FS.anthers = [];
  const rndA = mulberry32(31);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + rndA() * 0.5;
    const r0 = 0.045 + rndA() * 0.02;
    const filPts = [
      new THREE.Vector3(Math.cos(a) * r0, 0, Math.sin(a) * r0),
      new THREE.Vector3(Math.cos(a) * (r0 + 0.02), 0.09, Math.sin(a) * (r0 + 0.02)),
      new THREE.Vector3(Math.cos(a) * (r0 + 0.01), 0.17, Math.sin(a) * (r0 + 0.01) + 0.02),
    ];
    fsFlower.add(mesh(sweepTube(filPts, (t) => 0.008 - t * 0.003, 6, 14), M_STAMEN_FIL));
    const anther = mesh(new THREE.SphereGeometry(0.028, 10, 8), M_ANTHER);
    anther.scale.set(1.3, 0.8, 0.8);
    anther.position.set(Math.cos(a) * (r0 + 0.01), 0.18, Math.sin(a) * (r0 + 0.01) + 0.02);
    anther.rotation.z = Math.cos(a) * 0.6;
    anther.userData.antherIdx = i;
    fsFlower.add(anther);
    FS.anthers.push(anther);
  }

  /* 雌蕊：花柱（伸出龙骨瓣外）+ 柱头（微发光，成熟后增亮） */
  const stylePts = [
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.02, 0.16, 0.03),
    new THREE.Vector3(0.05, 0.3, 0.06),
  ];
  fsFlower.add(mesh(sweepTube(stylePts, (t) => 0.014 - t * 0.005, 7, 14), matStd(0xc9e8a0, { roughness: 0.55 })));
  const stigma = mesh(new THREE.SphereGeometry(0.032, 10, 8), M_STIGMA);
  stigma.position.set(0.05, 0.32, 0.06);
  fsFlower.add(stigma);
  FS.stigma = stigma;
}

/* 花特写工具组：纸袋 / 镊子 / 毛笔 / 标签（即时显隐 + 移动到目标点） */
const fsTools = {};
{
  /* 纸袋：折口纸筒（DoubleSide 内壁可见） */
  const bag = mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.9, 14, 1, true), matStd(0xd9cba8, {
    roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.55,
  }));
  bag.position.y = 0.42;
  bag.visible = false;
  flowerStation.add(bag);
  const bagFold = mesh(new THREE.TorusGeometry(0.35, 0.03, 8, 16), M_PAPER_DEEP);
  bagFold.rotation.x = Math.PI / 2;
  bagFold.position.y = 0.88;
  bagFold.visible = false;
  flowerStation.add(bagFold);
  fsTools.bag = bag;
  fsTools.bagFold = bagFold;

  /* 镊子：两臂 + 铰结（停在花侧，夹取时移动到花药） */
  const tweezer = new THREE.Group();
  for (const s of [-1, 1]) {
    const arm = mesh(sweepTube(
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.12, s * 0.01), new THREE.Vector3(0, -0.3, s * 0.05)],
      (t) => 0.011 - t * 0.004, 6, 12,
    ), M_STEEL);
    tweezer.add(arm);
  }
  tweezer.add(mesh(new THREE.SphereGeometry(0.02, 8, 6), M_STEEL_DARK));
  tweezer.position.set(0.42, 0.62, 0.18);
  tweezer.rotation.z = -0.5;
  flowerStation.add(tweezer);
  fsTools.tweezer = tweezer;

  /* 毛笔：笔杆 + 铜箍 + 笔毫 + 花粉端（蘸粉后发光） */
  const brush = new THREE.Group();
  brush.add(mesh(sweepTube(
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.01, 0.12, 0), new THREE.Vector3(0.02, 0.26, 0)],
    (t) => 0.014 - t * 0.004, 7, 12,
  ), M_BRUSH_HANDLE));
  const ferrule = mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.05, 8), M_BRASS);
  ferrule.position.set(0.005, -0.02, 0);
  brush.add(ferrule);
  const bristle = mesh(new THREE.ConeGeometry(0.024, 0.1, 8), M_BRISTLE);
  bristle.position.set(0, -0.08, 0);
  brush.add(bristle);
  const pollenTip = mesh(new THREE.SphereGeometry(0.02, 8, 6), matGlow(0xf2d05e, 0.1, { roughness: 0.5 }));
  pollenTip.position.set(0, -0.13, 0);
  pollenTip.visible = false;
  brush.add(pollenTip);
  brush.position.set(-0.4, 0.4, 0.16);
  brush.rotation.z = 0.6;
  flowerStation.add(brush);
  fsTools.brush = brush;
  fsTools.pollenTip = pollenTip;

  /* 标签：小木牌 + 麻绳（挂牌后出现） */
  const tag = new THREE.Group();
  tag.add(mesh(new THREE.BoxGeometry(0.2, 0.12, 0.014), M_WOOD));
  const tagTextMat = matStd(0xffffff, { roughness: 0.9 });
  tagTextMat.map = makeLabelTexture(['圆粒 ♀ × 皱粒 ♂', '人工授粉'], { w: 220, h: 110, lineSizes: [26, 20], accent: '#7a5a34' });
  const tagText = mesh(new THREE.PlaneGeometry(0.18, 0.1), tagTextMat);
  tagText.position.z = 0.008;
  tag.add(tagText);
  tag.add(mesh(sweepTube(
    [new THREE.Vector3(0, 0.06, 0), new THREE.Vector3(0.02, 0.1, 0), new THREE.Vector3(0.05, 0.12, 0)],
    (t) => 0.004, 5, 8,
  ), M_TWINE));
  tag.position.set(0.1, -0.15, 0.1);
  tag.rotation.z = 0.3;
  tag.visible = false;
  flowerStation.add(tag);
  fsTools.tag = tag;
}

/* 花瓣开合目标（0 合拢 / 1 拨开），主循环缓动跟随 */
function fsPetalsOpen(k) {
  FS.petalsOpen = k;
}

/* ================= 工作台（分拣 / 计数台，小径南侧） ================= */

const benchG = new THREE.Group();
benchG.position.set(0.6, 0, 4.5);
benchG.visible = true;
scene.add(benchG);

{
  const benchBody = new THREE.Group();
  const top = roundedSlab(4.4, 2.0, 0.14, 0.07, M_WOOD, 0.025);
  top.position.y = 0.94;
  benchBody.add(top);
  const skirt1 = mesh(new THREE.BoxGeometry(4.4, 0.12, 0.05), M_WOOD_DARK);
  skirt1.position.set(0, 0.82, 0.95);
  const skirt2 = skirt1.clone();
  skirt2.position.z = -0.95;
  benchBody.add(skirt1, skirt2);
  for (const [dx, dz] of [[-1.95, -0.8], [1.95, -0.8], [-1.95, 0.8], [1.95, 0.8]]) {
    const leg = mesh(new THREE.BoxGeometry(0.14, 0.88, 0.14), M_WOOD_DARK);
    leg.position.set(dx, 0.44, dz);
    benchBody.add(leg);
  }
  benchG.add(benchBody);
  mergeStatics(benchBody);
  bakeContactShadow(0.6, 4.5, 4.6, 2.2, 0.34);
}

/* 四格瓷盘：车削外盘 + 十字隔墙 + 分格底（计数走台账，视觉只放样例籽粒） */
const dish = new THREE.Group();
dish.position.set(-1.25, 0.96, -0.3);
dish.rotation.y = 0.18;
benchG.add(dish);
{
  const outerProf = [
    [0.02, 0], [0.52, 0.02], [0.56, 0.06], [0.58, 0.2], [0.56, 0.22], [0.42, 0.2], [0.38, 0.05], [0.3, 0.04], [0.29, 0.16],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const outer = mesh(new THREE.LatheGeometry(outerProf, 36), M_PORCELAIN);
  dish.add(outer);
  for (const rot of [0, Math.PI / 2]) {
    const wall = mesh(new THREE.BoxGeometry(1.06, 0.13, 0.02), M_PORCELAIN_IN);
    wall.position.y = 0.13;
    wall.rotation.y = rot;
    dish.add(wall);
  }
  for (const [cx, cz] of [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]]) {
    const cell = mesh(new THREE.CircleGeometry(0.22, 20), M_PORCELAIN_IN);
    cell.rotation.x = -Math.PI / 2;
    cell.position.set(cx, 0.115, cz);
    dish.add(cell);
  }
  const dishLblMat = matStd(0xffffff, { roughness: 0.9 });
  dishLblMat.map = makeLabelTexture(['分格瓷盘', '按所选性状计数'], { w: 220, h: 110, lineSizes: [28, 19], accent: '#4a6a8a' });
  const dishLbl = mesh(new THREE.PlaneGeometry(0.4, 0.2), dishLblMat);
  dishLbl.position.set(0, 0.005, 0.62);
  dishLbl.rotation.x = -Math.PI / 2;
  dish.add(dishLbl);
}

/* 工作台籽粒实例池（圆 / 皱两池，实例色染种皮灰白） */
const SEED_CAP = 156;
const seedGeoRound = new THREE.SphereGeometry(0.034, 12, 9);
const seedGeoWrinkled = (() => {
  const g = new THREE.SphereGeometry(0.036, 12, 10);
  const p = g.attributes.position;
  const rndW = mulberry32(7);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const lumpy = 0.78 + 0.16 * Math.sin(y * 26 + x * 15) + rndW() * 0.06;
    p.setXYZ(i, x * 1.18, y * 0.66 * lumpy, z * 0.95);
  }
  g.computeVertexNormals();
  return g;
})();
const instSeedRound = makeInstanced(seedGeoRound, M_SEED, SEED_CAP);
const instSeedWrinkled = makeInstanced(seedGeoWrinkled, M_SEED, SEED_CAP);
/* 池挂进工作台（makeInstanced 默认挂 worldG，这里搬到台面） */
benchG.add(instSeedRound);
benchG.add(instSeedWrinkled);

const seedDummy2 = new THREE.Object3D();
const seedCol2 = new THREE.Color();
function laySeeds(list, cx, cz, spanX = 0.9, spanZ = 0.5) {
  const n = Math.min(list.length, SEED_CAP);
  let ri = 0, wi = 0;
  const rndS = mulberry32(2026 + list.length);
  const rows = Math.max(1, Math.ceil(n / 9));
  for (let i = 0; i < n; i++) {
    const it = list[i];
    const px = cx - spanX / 2 + (i % 9) / 8 * spanX + (rndS() - 0.5) * 0.012;
    const pz = cz - spanZ / 2 + Math.floor(i / 9) / rows * spanZ + (rndS() - 0.5) * 0.012;
    const py = 1.115 + Math.floor(i / 81) * 0.032;
    seedDummy2.position.set(px, py, pz);
    seedDummy2.rotation.set(rndS() * TAU, rndS() * TAU, rndS() * TAU);
    const s = 0.85 + rndS() * 0.3;
    seedDummy2.scale.set(s, s, s);
    seedDummy2.updateMatrix();
    seedCol2.set(it.coat === 'white' ? 0xe8e2d4 : 0xb9ac96);
    if (it.wrinkled) {
      instSeedWrinkled.setMatrixAt(wi, seedDummy2.matrix);
      instSeedWrinkled.setColorAt(wi++, seedCol2);
    } else {
      instSeedRound.setMatrixAt(ri, seedDummy2.matrix);
      instSeedRound.setColorAt(ri++, seedCol2);
    }
  }
  instSeedRound.count = ri;
  instSeedWrinkled.count = wi;
  instSeedRound.instanceMatrix.needsUpdate = true;
  instSeedWrinkled.instanceMatrix.needsUpdate = true;
  if (instSeedRound.instanceColor) instSeedRound.instanceColor.needsUpdate = true;
  if (instSeedWrinkled.instanceColor) instSeedWrinkled.instanceColor.needsUpdate = true;
}
function clearSeeds() {
  instSeedRound.count = 0;
  instSeedWrinkled.count = 0;
}

/* 种子样品架：四张样品卡 + 黄铜立柱（灰种皮挡子叶的教学点） */
{
  const standG = new THREE.Group();
  standG.position.set(2.15, 0.96, -0.28);
  benchG.add(standG);
  const back = mesh(new THREE.BoxGeometry(1.15, 0.5, 0.02), M_WOOD_DARK);
  back.position.set(0, 0.26, -0.06);
  standG.add(back);
  const SPECS = [
    ['圆粒 · 黄子叶', '显性 × 显性', '#b9ac96', '#e8c96a', false],
    ['皱粒 · 黄子叶', '隐性 × 显性', '#b9ac96', '#e8c96a', true],
    ['圆粒 · 绿子叶', '显性 × 隐性', '#b9ac96', '#7ea84e', false],
    ['皱粒 · 绿子叶', '隐性 × 隐性', '#b9ac96', '#7ea84e', true],
  ];
  SPECS.forEach(([title, sub, coat, cot, wrinkled], i) => {
    const cx = (i % 2) * 0.58 - 0.29;
    const cz = Math.floor(i / 2) * 0.3 + 0.02;
    const cardMat = matStd(0xffffff, { roughness: 0.88 });
    cardMat.map = specimenCardTexture(title, sub, coat, cot, wrinkled);
    const card = mesh(new THREE.PlaneGeometry(0.52, 0.33), cardMat);
    card.position.set(cx, 0.28, cz + 0.14);
    card.rotation.x = -0.85;
    standG.add(card);
    const holder = mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.16, 6), M_BRASS);
    holder.position.set(cx, 0.1, cz + 0.18);
    standG.add(holder);
  });
  const stLblMat = matStd(0xffffff, { roughness: 0.9 });
  stLblMat.map = makeLabelTexture(['种子样品', '灰种皮挡住子叶 · 剥开才看得到'], { w: 300, h: 110, lineSizes: [30, 18], accent: '#7a5a34' });
  const stLbl = mesh(new THREE.PlaneGeometry(0.56, 0.2), stLblMat);
  stLbl.position.set(0, 0.01, 0.5);
  stLbl.rotation.x = -Math.PI / 2;
  standG.add(stLbl);
}

/* 剥荚托盘：木盘 + 3 个干荚 + 散粒 */
{
  const tray = roundedSlab(1.0, 0.62, 0.05, 0.05, M_WOOD, 0.02);
  tray.position.set(-2.6, 0.94, 0.5);
  tray.rotation.y = -0.3;
  benchG.add(tray);
  for (let i = 0; i < 3; i++) {
    const pod = mesh(i === 2 ? podGeoB : podGeoA, matStd(0xa8925a, { roughness: 0.75 }));
    pod.position.set(-2.75 + i * 0.22, 1.0, 0.42 + (i % 2) * 0.12);
    pod.rotation.set(-Math.PI / 2 + 0.4, i * 1.3, 0.4);
    pod.scale.setScalar(0.8);
    benchG.add(pod);
  }
  for (let i = 0; i < 7; i++) {
    const sd = mesh(new THREE.SphereGeometry(0.032, 10, 8), M_COAT);
    sd.position.set(-2.9 + (i % 4) * 0.18, 1.0, 0.72 - Math.floor(i / 4) * 0.1);
    if (i % 3 === 2) sd.scale.set(1.15, 0.7, 0.95);
    benchG.add(sd);
  }
  const trayLblMat = matStd(0xffffff, { roughness: 0.9 });
  trayLblMat.map = makeLabelTexture(['剥荚托盘'], { w: 160, h: 80, lineSizes: [30] });
  const trayLbl = mesh(new THREE.PlaneGeometry(0.34, 0.17), trayLblMat);
  trayLbl.position.set(-2.6, 0.995, 0.72);
  trayLbl.rotation.x = -Math.PI / 2;
  trayLbl.rotation.z = -0.3;
  benchG.add(trayLbl);
}

/* 记录本（纸页贴图）+ 工具（镊子 / 毛笔 / 纸袋叠） */
{
  const book = new THREE.Group();
  book.position.set(0.35, 0.97, 0.45);
  book.rotation.y = -0.15;
  const cover = roundedSlab(0.62, 0.44, 0.035, 0.03, matCoat(0x6a4a2c, { roughness: 0.5, clearcoat: 0.4 }), 0.012);
  book.add(cover);
  const pageMat = matStd(0xffffff, { roughness: 0.9 });
  pageMat.map = notebookPageTexture('豆园记录');
  const page = mesh(new THREE.PlaneGeometry(0.56, 0.4), pageMat);
  page.rotation.x = -Math.PI / 2;
  page.position.y = 0.02;
  book.add(page);
  benchG.add(book);

  const tweezer2 = new THREE.Group();
  for (const s of [-1, 1]) {
    const arm = mesh(sweepTube(
      [new THREE.Vector3(0, 0, s * 0.008), new THREE.Vector3(0.16, 0, s * 0.012), new THREE.Vector3(0.3, 0, s * 0.005)],
      (t) => 0.009 - t * 0.004, 6, 12,
    ), M_STEEL);
    tweezer2.add(arm);
  }
  tweezer2.position.set(1.3, 1.0, 0.4);
  tweezer2.rotation.y = -0.5;
  benchG.add(tweezer2);
  const brush2 = new THREE.Group();
  brush2.add(mesh(sweepTube(
    [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.015, 0.1, 0), new THREE.Vector3(0.03, 0.2, 0)],
    (t) => 0.012 - t * 0.004, 7, 12,
  ), M_BRUSH_HANDLE));
  const br2 = mesh(new THREE.ConeGeometry(0.02, 0.09, 8), M_BRISTLE);
  br2.position.set(-0.015, -0.06, 0);
  brush2.add(br2);
  brush2.position.set(1.6, 1.0, 0.2);
  brush2.rotation.z = 1.35;
  benchG.add(brush2);
  for (let i = 0; i < 3; i++) {
    const bag2 = mesh(new THREE.BoxGeometry(0.3, 0.06, 0.22), M_PAPER_DEEP);
    bag2.position.set(1.65, 1.0 + i * 0.055, 0.62);
    bag2.rotation.y = 0.2 + i * 0.1;
    benchG.add(bag2);
  }
  const toolLblMat = matStd(0xffffff, { roughness: 0.9 });
  toolLblMat.map = makeLabelTexture(['镊子 · 毛笔 · 纸袋', '授粉四件工具'], { w: 240, h: 100, lineSizes: [28, 20], accent: '#7a5a34' });
  const toolLbl = mesh(new THREE.PlaneGeometry(0.42, 0.18), toolLblMat);
  toolLbl.position.set(1.45, 0.985, 0.05);
  toolLbl.rotation.x = -Math.PI / 2;
  benchG.add(toolLbl);
}

/* ================= 展板：棋盘格（动态画布）+ 孟德尔原始数据（西墙挂板） ================= */

const PC_W = 640, PC_H = 480;
const punnettCv = canvasTex(PC_W, PC_H, () => {}, { bg: '#f4eedd' });
const punnettBoard = new THREE.Group();
punnettBoard.position.set(-9.7, 0, 2.5);
punnettBoard.rotation.y = 0.62;
scene.add(punnettBoard);
{
  const frame = new THREE.Group();
  frame.add(mesh(new THREE.BoxGeometry(2.5, 1.95, 0.07), M_BOARD).translateY(1.55));
  const faceMat = matStd(0xffffff, { roughness: 0.85 });
  faceMat.map = punnettCv.tex;
  const face = mesh(new THREE.PlaneGeometry(2.36, 1.8), faceMat);
  face.position.set(0, 1.55, 0.045);
  frame.add(face);
  const trimT = mesh(new THREE.BoxGeometry(2.6, 0.09, 0.1), M_WOOD_DARK);
  trimT.position.set(0, 2.56, 0);
  const trimB = trimT.clone();
  trimB.position.y = 0.55;
  frame.add(trimT, trimB);
  for (const dx of [-1.05, 1.05]) {
    const leg1 = mesh(new THREE.BoxGeometry(0.09, 1.1, 0.09), M_WOOD_DARK);
    leg1.position.set(dx, 0.55, 0.02);
    leg1.rotation.x = 0.34;
    frame.add(leg1);
    const leg2 = mesh(new THREE.BoxGeometry(0.09, 1.1, 0.09), M_WOOD_DARK);
    leg2.position.set(dx, 0.55, -0.16);
    leg2.rotation.x = -0.3;
    frame.add(leg2);
  }
  const trayBar = mesh(new THREE.CylinderGeometry(0.024, 0.024, 2.3, 8), M_WOOD_DARK);
  trayBar.rotation.z = Math.PI / 2;
  trayBar.position.set(0, 0.62, 0.42);
  frame.add(trayBar);
  punnettBoard.add(frame);
  mergeStatics(frame);
  bakeContactShadow(-9.7, 2.5, 2.7, 2.0, 0.3);
}

/* 棋盘格画布：标题 / 配子行列 / 16 格（可染色）+ 注脚（9:3:3:1 计数教学用） */
function drawPunnett({ title, rows = [], cols = [], cells = [], note = '', tints = null }) {
  const ctx = punnettCv.ctx;
  const W = PC_W, H = PC_H;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#f6f0de');
  g.addColorStop(1, '#ece2c6');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = 'rgba(140,110,70,0.04)';
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2e281e';
  ctx.font = '700 27px "PingFang SC", sans-serif';
  ctx.fillText(title, W / 2, 44);
  ctx.strokeStyle = '#b0603a';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(W * 0.18, 56);
  ctx.lineTo(W * 0.82, 56);
  ctx.stroke();
  const n1 = rows.length, n2 = cols.length;
  if (n1 && n2) {
    const x0 = 118, y0 = 92;
    const cw = Math.min(108, (W - x0 - 34) / n2);
    const ch = Math.min(62, (H - y0 - 118) / n1);
    ctx.font = '700 21px Georgia, serif';
    rows.forEach((r, i) => ctx.fillText(r, x0 - 26, y0 + ch * (i + 0.5) + 8));
    cols.forEach((c, j) => ctx.fillText(c, x0 + cw * (j + 0.5), y0 - 14));
    cells.forEach((row, i) => row.forEach((cell, j) => {
      const cx0 = x0 + j * cw, cy0 = y0 + i * ch;
      if (tints) {
        ctx.fillStyle = tints[i][j];
        ctx.fillRect(cx0 + 2, cy0 + 2, cw - 4, ch - 4);
      }
      ctx.strokeStyle = '#9a8a66';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(cx0 + 2, cy0 + 2, cw - 4, ch - 4);
      ctx.fillStyle = '#332c1e';
      ctx.font = '700 19px Georgia, serif';
      ctx.fillText(cell, cx0 + cw / 2, cy0 + ch / 2 + 7);
    }));
  }
  ctx.fillStyle = '#4a4232';
  ctx.font = '400 18px "PingFang SC", sans-serif';
  note.split('\n').forEach((line, i) => ctx.fillText(line, W / 2, H - 66 + i * 26));
  punnettCv.tex.needsUpdate = true;
}

/* 孟德尔原始数据（1865 年论文实测，七对性状 F₂） */
const MENDEL_DATA = [
  ['种子形状', '圆粒 5474', '皱粒 1850', '2.96 : 1'],
  ['子叶颜色', '黄 6022', '绿 2001', '3.01 : 1'],
  ['种皮颜色（花色）', '灰紫 705', '白 224', '3.15 : 1'],
  ['豆荚形状', '饱满 882', '缢缩 299', '2.95 : 1'],
  ['豆荚颜色（未熟）', '绿 428', '黄 152', '2.82 : 1'],
  ['花的位置', '腋生 651', '顶生 207', '3.14 : 1'],
  ['茎的高度', '高 787', '矮 277', '2.84 : 1'],
];
const MB_W = 560, MB_H = 780;
const mendelCv = canvasTex(MB_W, MB_H, () => {}, { bg: '#f2ecd8' });
const mendelBoard = new THREE.Group();
mendelBoard.position.set(-6.5, 1.62, -6.42);
mendelBoard.visible = false;
scene.add(mendelBoard);
{
  mendelBoard.add(mesh(new THREE.BoxGeometry(1.9, 2.68, 0.06), M_BOARD));
  const faceMat = matStd(0xffffff, { roughness: 0.85 });
  faceMat.map = mendelCv.tex;
  const face = mesh(new THREE.PlaneGeometry(1.8, 2.56), faceMat);
  face.position.z = 0.04;
  mendelBoard.add(face);
  const trimT = mesh(new THREE.BoxGeometry(2.0, 0.08, 0.09), M_WOOD_DARK);
  trimT.position.y = 1.38;
  const trimB = trimT.clone();
  trimB.position.y = -1.38;
  mendelBoard.add(trimT, trimB);
}
function drawMendelBoard() {
  const ctx = mendelCv.ctx;
  const W = MB_W, H = MB_H;
  ctx.fillStyle = '#f2ecd8';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 300; i++) {
    ctx.fillStyle = 'rgba(140,110,70,0.05)';
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2e281e';
  ctx.font = '700 30px "PingFang SC", sans-serif';
  ctx.fillText('孟德尔的原始数据', W / 2, 56);
  ctx.font = '400 17px "PingFang SC", sans-serif';
  ctx.fillStyle = '#6a6048';
  ctx.fillText('摘自 1865 年《植物杂交实验》 · 七对性状 F₂ 全部接近 3 : 1', W / 2, 88);
  let y = 128;
  ctx.strokeStyle = '#8a7a5c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, y - 12);
  ctx.lineTo(W - 30, y - 12);
  ctx.stroke();
  ctx.fillStyle = '#5a5040';
  ctx.font = '700 17px "PingFang SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('性状', 34, y + 14);
  ctx.fillText('显性', 210, y + 14);
  ctx.fillText('隐性', 360, y + 14);
  ctx.fillText('比例', 452, y + 14);
  y += 26;
  for (const [trait, domTxt, recTxt, ratio] of MENDEL_DATA) {
    y += 44;
    ctx.fillStyle = '#332c1e';
    ctx.font = '400 19px "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(trait, 34, y);
    ctx.fillStyle = '#4a6a3a';
    ctx.fillText(domTxt, 210, y);
    ctx.fillStyle = '#8a5a3a';
    ctx.fillText(recTxt, 360, y);
    ctx.fillStyle = '#2e281e';
    ctx.font = '700 19px Georgia, serif';
    ctx.fillText(ratio, 452, y);
    ctx.strokeStyle = 'rgba(150,130,96,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, y + 12);
    ctx.lineTo(W - 30, y + 12);
    ctx.stroke();
  }
  y += 52;
  ctx.fillStyle = '#6a6048';
  ctx.font = '400 16px "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('任何一对相对性状，F₂ 显隐比都落在 3 : 1 附近——', W / 2, y);
  ctx.fillText('分离是普遍规律，不是某一组的巧合。', W / 2, y + 26);
  mendelCv.tex.needsUpdate = true;
}
/* 首绘：孟德尔数据挂板 + 棋盘格占位（免得章节里飞过去看到空白板） */
drawMendelBoard();
drawPunnett({ title: 'PeaLab · 棋盘格', note: '在章节里开始实验吧' });

/* ================= 假说—演绎法展台：五块立牌卡片（东弧排列） ================= */

const METHOD_STEPS = [
  { title: '观察现象', lines: ['F₁ 一律表现显性；', 'F₂ 里隐性重现，比近 3 : 1。', '矮茎（隐性）去哪了？'] },
  { title: '提出假说', lines: ['性状由成对因子控制；', '体细胞里因子成对；', '成配子时彼此分开；', '受精时随机组合。'] },
  { title: '演绎推理', lines: ['若假说成立，', 'F₁ × 隐性纯合子', '后代应为 1 : 1。', '（测交可检验！）'] },
  { title: '实验验证', lines: ['测交后代：', '圆粒 106 : 皱粒 101', '≈ 1 : 1 ✓', '与预测吻合。'] },
  { title: '得出结论', lines: ['分离定律成立；', '两对性状同理 →', '自由组合定律。', '假说—演绎法立范。'] },
];
const methodStands = [];
{
  for (let i = 0; i < METHOD_STEPS.length; i++) {
    const st = METHOD_STEPS[i];
    const ang = (i - 2) * 0.42;
    const x = 10.2 + Math.sin(ang) * 3.1;
    const z = 1.15 + Math.cos(ang) * 1.4;
    const stand = new THREE.Group();
    stand.position.set(x, 0, z);
    stand.rotation.y = -ang * 0.85;
    const postG = new THREE.Group();
    const post = mesh(new THREE.CylinderGeometry(0.03, 0.045, 1.16, 8), M_WOOD_DARK);
    post.position.y = 0.58;
    postG.add(post);
    const foot = mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 12), M_WOOD_DARK);
    foot.position.y = 0.03;
    postG.add(foot);
    const clip = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 10), M_BRASS);
    clip.position.y = 1.14;
    postG.add(clip);
    stand.add(postG);
    mergeStatics(postG);
    const cardMat = matStd(0xffffff, { roughness: 0.85, emissive: 0x000000, emissiveIntensity: 0 });
    cardMat.map = methodCardTexture(i + 1, st.title, st.lines);
    const card = mesh(new THREE.PlaneGeometry(0.94, 0.66), cardMat);
    card.position.y = 1.42;
    card.rotation.x = -0.14;
    stand.add(card);
    scene.add(stand);
    methodStands.push({ group: stand, card, mat: cardMat, pos: stand.position.clone() });
    bakeContactShadow(x, z, 0.5, 0.5, 0.26);
  }
}

/* ================= 小蝴蝶（点睛道具，双翼扑动） ================= */

const butterfly = new THREE.Group();
{
  const wingGeo = new THREE.CircleGeometry(0.12, 8);
  wingGeo.scale(0.72, 1, 1);
  const wingMat = matStd(0xf2ead0, { roughness: 0.6, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
  const wingL = mesh(wingGeo, wingMat);
  const wingR = mesh(wingGeo, wingMat);
  wingL.position.x = -0.07;
  wingR.position.x = 0.07;
  butterfly.add(wingL, wingR);
  const body = mesh(new THREE.CapsuleGeometry(0.016, 0.1, 4, 8), M_STEEL_DARK);
  body.rotation.x = Math.PI / 2;
  butterfly.add(body);
  butterfly.userData.wings = [wingL, wingR];
  scene.add(butterfly);
}

/* ================= 状态：季节 / 时间轴 / 台账 / 统计 ================= */

const garden = {
  season: 1,
  day: 0,
  playing: false,
  nextSowId: 1,
  harvested: [],      /* { genes, mother, father }（收获袋） */
  benchSeedList: [],  /* 台面籽粒（视觉） */
};
const FLOW = {
  mode: 'mono',
  pollTargets: [],    /* { plant, fatherBed } 授粉登记（结杂交荚） */
};
const ledger = { records: [], stats: null };

function addRecord(text) {
  ledger.records.unshift({ season: garden.season, text });
  if (ledger.records.length > 26) ledger.records.pop();
  renderLedger();
}
function renderLedger() {
  const recEl = document.getElementById('ledgerRec');
  recEl.innerHTML = '';
  if (!ledger.records.length) {
    const li = document.createElement('li');
    li.className = 'rec-empty';
    li.textContent = '暂无记录——完成一次授粉或收获后会自动记下。';
    recEl.appendChild(li);
  } else {
    for (const r of ledger.records) {
      const li = document.createElement('li');
      li.innerHTML = `<b>S${r.season}</b> ${r.text}`;
      recEl.appendChild(li);
    }
  }
  document.getElementById('ledgerSeason').textContent = `第 ${garden.season} 季`;
}

/* 统计快照 → 台账表格（表型 / 观测 / 期望 / 观测比 / 理论比 / 合计 + 卡方判定） */
function setStats(stats) {
  ledger.stats = stats;
  const box = document.getElementById('ledgerStats');
  if (!stats) {
    box.innerHTML = '<p class="ledger-empty">收获一行或完成一次分拣后，这里给出观测 / 期望与卡方判定。</p>';
    return;
  }
  const { labels, obs, exp, note, chiV, df, p, verdict, ratioArr, ratio } = stats;
  const obsSum = obs.reduce((s, v) => s + v, 0);
  let html = '<table><tr><th>表型</th><th>观测</th><th>期望</th><th>观测比</th><th>理论比</th></tr>';
  labels.forEach((lb, i) => {
    html += `<tr><td>${lb}</td><td>${obs[i]}</td><td>${exp[i] ? (Math.round(exp[i] * 10) / 10) : '—'}</td><td>${obsSum ? (Math.round(obs[i] / obsSum * 1000) / 10) + '%' : '—'}</td><td>${ratioArr ? ratioArr[i] : '—'}</td></tr>`;
  });
  html += `<tr><td>合计</td><td>${obsSum}</td><td>${Math.round(exp.reduce((s, v) => s + v, 0) * 10) / 10}</td><td>100%</td><td>${ratio || '—'}</td></tr></table>`;
  if (note) html += `<p class="ledger-verdict na">${note}</p>`;
  else if (verdict === 'good') html += `<p class="ledger-verdict good">χ²=${chiV.toFixed(2)}（df=${df}）p=${p.toFixed(3)} &gt; 0.05 —— 与理论比例不存在显著差异。</p>`;
  else if (verdict === 'bad') html += `<p class="ledger-verdict bad">χ²=${chiV.toFixed(2)}（df=${df}）p=${p.toFixed(3)} ≤ 0.05 —— 与理论比例差异显著，检查操作或样本。</p>`;
  box.innerHTML = html;
}

/* ================= DOM 接线：栏折叠 / 手风琴 / 台账 / 时间轴 ================= */

const shellEl = document.getElementById('peaShell');
const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const lcData = document.getElementById('lcData');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const focusBtn = document.getElementById('focusBtn');
const benchBtn = document.getElementById('benchBtn');

const FOLD_KEY = { l: 'pea.foldL', r: 'pea.foldR' };
let foldL = false, foldR = false, focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅本次会话生效 */ }

function applyFold() {
  shellEl.classList.toggle('fold-l', foldL);
  shellEl.classList.toggle('fold-r', foldR);
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
  shellEl.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyFold();
}
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL; else foldR = !foldR;
  try { localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0'); } catch (e) { /* 同上 */ }
  applyFold();
}
foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
applyFold();

/* 右栏三块手风琴：独立 key 记忆，切章不重置；窄屏首访清爽态只收「数据读数」 */
const ACC_KEYS = { lesson: 'pea.accLesson', controls: 'pea.accControls', data: 'pea.accData' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
};
const NARROW_VIEW = window.innerWidth <= 1100;
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 同上 */ }
  accClosed[name] = saved !== null ? saved === '1' : (name === 'data' && NARROW_VIEW);
}
function applyAcc(name) {
  const sec = accSecs[name];
  sec.classList.toggle('closed', accClosed[name]);
  sec.querySelector('.acc-head').setAttribute('aria-expanded', String(!accClosed[name]));
}
function toggleAcc(name) {
  accClosed[name] = !accClosed[name];
  try { localStorage.setItem(ACC_KEYS[name], accClosed[name] ? '1' : '0'); } catch (e) { /* 同上 */ }
  applyAcc(name);
}
for (const name of Object.keys(accSecs)) {
  accSecs[name].querySelector('.acc-head').addEventListener('click', () => toggleAcc(name));
  applyAcc(name);
}

/* 台账浮窗：折叠徽标 / 放大态 / Esc 退出放大 */
const ledgerPanel = document.getElementById('ledgerPanel');
const ledgerFoldBtn = document.getElementById('ledgerFoldBtn');
const ledgerBadge = document.getElementById('ledgerBadge');
const LEDGER_FOLD_KEY = 'pea.foldLedger';
let ledgerFolded = false;
try {
  ledgerFolded = localStorage.getItem(LEDGER_FOLD_KEY) !== null
    ? localStorage.getItem(LEDGER_FOLD_KEY) === '1'
    : window.innerWidth <= 1100;
} catch (e) { ledgerFolded = window.innerWidth <= 1100; }
let ledgerExpanded = false;
function setLedgerExpanded(v) {
  ledgerExpanded = v;
  ledgerPanel.classList.toggle('expanded', v);
}
function applyLedgerFold() {
  if (ledgerFolded) setLedgerExpanded(false);
  ledgerPanel.classList.toggle('folded', ledgerFolded);
  ledgerFoldBtn.textContent = ledgerFolded ? '+' : '−';
  ledgerFoldBtn.setAttribute('aria-expanded', String(!ledgerFolded));
}
function setLedgerFolded(v) {
  ledgerFolded = v;
  try { localStorage.setItem(LEDGER_FOLD_KEY, v ? '1' : '0'); } catch (e) { /* 同上 */ }
  applyLedgerFold();
}
ledgerFoldBtn.addEventListener('click', () => setLedgerFolded(!ledgerFolded));
ledgerBadge.addEventListener('click', () => setLedgerFolded(false));
const ledgerZoomBtn = document.createElement('button');
ledgerZoomBtn.type = 'button';
ledgerZoomBtn.className = 'mini-btn ledger-zoom';
ledgerZoomBtn.textContent = '放大台账';
ledgerZoomBtn.addEventListener('click', () => setLedgerExpanded(!ledgerExpanded));
document.querySelector('.ledger-foot').prepend(ledgerZoomBtn);
const ledgerClearBtn = document.getElementById('ledgerClear');
ledgerClearBtn.addEventListener('click', () => {
  ledger.records = [];
  renderLedger();
});
applyLedgerFold();
renderLedger();

/* 时间轴条：播放/暂停（空格）+ 日数 + 物候 + 拖动 + 下一季 */
const timeBar = document.getElementById('timeBar');
const tbPlay = document.getElementById('tbPlay');
const tbDay = document.getElementById('tbDay');
const tbStage = document.getElementById('tbStage');
const tbRange = document.getElementById('tbRange');
const tbSeason = document.getElementById('tbSeason');
tbRange.addEventListener('input', () => {
  garden.day = Number(tbRange.value);
  growthDirty = true;
});
tbPlay.addEventListener('click', () => setTimelinePlaying(!garden.playing));
function setTimelinePlaying(v) {
  garden.playing = v;
  tbPlay.textContent = v ? '⏸' : '▶';
}
tbSeason.addEventListener('click', () => nextSeason(false));
function nextSeason(silent) {
  garden.season += 1;
  garden.day = 0;
  tbRange.value = 0;
  clearPlants();
  garden.benchSeedList = [];
  clearSeeds();
  FLOW.pollTargets = [];
  for (const bed of beds) bed.plate(bed.no, bed.strainName || '空畦', bed.strainDesc || '');
  growthDirty = true;
  if (!silent) addRecord('新的一季：豆畦已清空，可在每行右侧点「播种」重新开始。');
  renderLedger();
}

/* 工作台视角切换（豆园 ↔ 工作台） */
let benchView = false;
benchBtn.addEventListener('click', () => {
  benchView = !benchView;
  benchBtn.textContent = benchView ? '返回豆园' : '工作台';
  if (benchView) app.setCamera([0.6, 2.3, 7.9], [0.6, 1.05, 4.4]);
  else app.setCamera([0, 7.6, 14.2], [0, 0.6, -0.8]);
});

/* ================= 品系选择浮层（播种） ================= */

const strainPop = document.createElement('div');
strainPop.className = 'pea-pop';
strainPop.hidden = true;
stage.appendChild(strainPop);
let strainPopBed = -1;
function openStrainPicker(bedIdx) {
  strainPopBed = bedIdx;
  strainPop.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'pop-head';
  head.innerHTML = `<span class="pop-title">第 ${beds[bedIdx].no} 行 · 播种品系</span><button class="pop-x" type="button">✕</button>`;
  head.querySelector('.pop-x').addEventListener('click', closeStrainPicker);
  strainPop.appendChild(head);
  const note = document.createElement('p');
  note.className = 'pop-note';
  note.textContent = '点任意纯系品系整行播种；也可播「上一季收获的种子」（若豆袋里有）；或清成空畦。';
  strainPop.appendChild(note);
  const bigRow = document.createElement('div');
  bigRow.className = 'pop-row';
  bigRow.innerHTML = '<label><input type="checkbox" id="popBigSample"> 大样本（播 400 株，显示 6 株）</label>';
  strainPop.appendChild(bigRow);
  for (const key of Object.keys(STRAINS)) {
    const st = STRAINS[key];
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'pop-item';
    item.innerHTML = `<span class="pi-n">${st.name}</span><span class="pi-d">${st.desc}</span>`;
    item.addEventListener('click', () => sowBed(strainPopBed, key, document.getElementById('popBigSample').checked ? 400 : 6));
    strainPop.appendChild(item);
  }
  if (garden.harvested.length) {
    const hv = document.createElement('button');
    hv.type = 'button';
    hv.className = 'pop-item';
    hv.innerHTML = `<span class="pi-n">上一季收获的种子（${garden.harvested.length} 粒）</span><span class="pi-d">按收获袋里的基因型播种（每行最多显示 6 株）</span>`;
    hv.addEventListener('click', () => sowFromHarvest(strainPopBed, document.getElementById('popBigSample').checked ? 400 : 6));
    strainPop.appendChild(hv);
  }
  const empty = document.createElement('button');
  empty.type = 'button';
  empty.className = 'pop-item';
  empty.innerHTML = '<span class="pi-n">空畦</span><span class="pi-d">清空这一行，暂不播种</span>';
  empty.addEventListener('click', () => clearBed(strainPopBed));
  strainPop.appendChild(empty);
  strainPop.hidden = false;
}
function closeStrainPicker() {
  strainPop.hidden = true;
  strainPopBed = -1;
}

function sowBed(bedIdx, strainKey, n = 6) {
  const bed = beds[bedIdx];
  const strain = STRAINS[strainKey];
  clearPlants((p) => p.bed === bedIdx);
  bed.strainKey = strainKey;
  bed.strainName = strain.name;
  bed.strainDesc = strain.desc;
  bed.bigSample = n > 12;
  const shown = bed.bigSample ? 6 : Math.min(6, n);
  const rndP = mulberry32(garden.nextSowId++ * 131);
  for (let i = 0; i < shown; i++) {
    const genes = {};
    for (const k of TRAIT_ORDER) genes[k] = strain.genes[k];
    addPlant(bedIdx, i, genes, garden.day + (rndP() < 0.3 ? -2 : 0));
  }
  bed.plate(bed.no, strain.name, strain.desc);
  growthDirty = true;
  syncGenoLabels();
  addRecord(`第 ${bed.no} 行播种 ${strain.name}（${bed.bigSample ? '大样本 400 株 · 显示 6 株' : '6 株'}）`);
  refreshRowLabels();
  closeStrainPicker();
}
function sowFromHarvest(bedIdx, n = 6) {
  const bed = beds[bedIdx];
  clearPlants((p) => p.bed === bedIdx);
  bed.strainKey = 'harvest';
  bed.strainName = '收获的种子';
  bed.strainDesc = `按上一季收获袋基因型（${garden.harvested.length} 粒）`;
  bed.bigSample = n > 12;
  const shown = bed.bigSample ? 6 : Math.min(6, n);
  const src = garden.harvested;
  for (let i = 0; i < shown; i++) {
    addPlant(bedIdx, i, { ...src[i % src.length].genes }, garden.day);
  }
  bed.plate(bed.no, '收获的种子', bed.strainDesc);
  growthDirty = true;
  syncGenoLabels();
  addRecord(`第 ${bed.no} 行播下收获的种子 × ${shown} 株`);
  refreshRowLabels();
  closeStrainPicker();
}
function clearBed(bedIdx) {
  clearPlants((p) => p.bed === bedIdx);
  const bed = beds[bedIdx];
  bed.strainKey = null;
  bed.strainName = null;
  bed.strainDesc = null;
  bed.bigSample = false;
  bed.plate(bed.no, '空畦', '');
  growthDirty = true;
  addRecord(`第 ${bed.no} 行清成空畦`);
  refreshRowLabels();
  closeStrainPicker();
}
function refreshRowLabels() {
  controlsEl.querySelectorAll('[data-row-strain]').forEach((el, i) => {
    el.textContent = beds[i].strainName || '（空畦）';
  });
}

/* ================= 授粉面板（豆园点花触发） ================= */

const pollPop = document.createElement('div');
pollPop.className = 'pea-pop';
pollPop.hidden = true;
stage.appendChild(pollPop);
let pollTarget = null;   /* { plant, bed } */
function openPollPanel(plantRef) {
  pollTarget = plantRef;
  pollPop.innerHTML = '';
  const bed = beds[plantRef.bed];
  const head = document.createElement('div');
  head.className = 'pop-head';
  head.innerHTML = `<span class="pop-title">第 ${bed.no} 行 · 人工授粉</span><button class="pop-x" type="button">✕</button>`;
  head.querySelector('.pop-x').addEventListener('click', closePollPanel);
  pollPop.appendChild(head);
  const note = document.createElement('p');
  note.className = 'pop-note';
  note.textContent = '这朵花还在蕾期，正是去雄的时机。选一个父本行（可早播 7 天让它先开花），然后逐步完成，或一键整行杂交。';
  pollPop.appendChild(note);
  const rowSel = document.createElement('div');
  rowSel.className = 'pop-row';
  const sel = document.createElement('select');
  sel.id = 'pollFather';
  const selfOpt = document.createElement('option');
  selfOpt.value = '-1';
  selfOpt.textContent = '自花授粉（对照）';
  sel.appendChild(selfOpt);
  beds.forEach((b, i) => {
    if (i === plantRef.bed || !plantsOfBed(i).length) return;
    const op = document.createElement('option');
    op.value = String(i);
    op.textContent = `${b.no} 行 · ${b.strainName || '（已播）'}`;
    sel.appendChild(op);
  });
  rowSel.innerHTML = '<label>父本</label>';
  rowSel.appendChild(sel);
  const early = document.createElement('button');
  early.type = 'button';
  early.className = 'mini-btn';
  early.textContent = '父本行早播 7 天';
  early.addEventListener('click', () => {
    const fi = Number(sel.value);
    if (fi < 0) return;
    for (const p of plantsOfBed(fi)) p.sowDay = Math.max(0, garden.day - 42);
    growthDirty = true;
    pollPopMsg.textContent = `已把 ${beds[fi].no} 行的播种日提前 7 天（现在正值开花，可作父本）。`;
    addRecord(`${beds[fi].no} 行早播 7 天作父本（花期提前）`);
  });
  rowSel.appendChild(early);
  pollPop.appendChild(rowSel);
  const msg = document.createElement('p');
  msg.className = 'pop-msg';
  pollPop.appendChild(msg);
  pollPopMsg = msg;
  const btnRow = document.createElement('div');
  btnRow.className = 'pop-row';
  const stepBtn = document.createElement('button');
  stepBtn.type = 'button';
  stepBtn.className = 'mini-btn';
  stepBtn.textContent = '逐步完成人工授粉';
  stepBtn.addEventListener('click', () => {
    const fi = Number(sel.value);
    if (fi < 0) {
      msg.textContent = '这是自花授粉的对照行，不需要人工授粉。';
      return;
    }
    doGardenPollination(plantRef, fi, true);
    closePollPanel();
  });
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'mini-btn';
  allBtn.textContent = '一键完成整行杂交';
  allBtn.addEventListener('click', () => {
    const fi = Number(sel.value);
    if (fi < 0) {
      msg.textContent = '这是自花授粉的对照行，不需要人工授粉。';
      return;
    }
    doGardenPollination(plantRef, fi, false);
    closePollPanel();
  });
  btnRow.appendChild(stepBtn);
  btnRow.appendChild(allBtn);
  pollPop.appendChild(btnRow);
  pollPop.hidden = false;
}
function closePollPanel() {
  pollPop.hidden = true;
  pollTarget = null;
}
let pollPopMsg = null;

/* 豆园授粉执行：整行登记杂交目标（蕾期校验 → 成熟后结杂交荚） */
const POLL_MSGS = {
  tooLate: '这朵花已经开了——闭花受粉的豌豆在开放前就完成了自交，此时去雄已来不及。',
};
function doGardenPollination(plantRef, fatherBed, stepwise) {
  const g = plantGrowth(plantRef, garden.day);
  if (g.bloom.some((v) => v > 0.2)) {
    pollPopMsg.textContent = POLL_MSGS.tooLate;
    addRecord(`第 ${beds[plantRef.bed].no} 行授粉被驳回：花已开放，去雄太晚`);
    return;
  }
  for (const p of plantsOfBed(plantRef.bed)) {
    FLOW.pollTargets.push({ plant: p, fatherBed });
  }
  addRecord(stepwise
    ? `第 ${beds[plantRef.bed].no} 行 × ${beds[fatherBed].no} 行：去雄→套袋→等 1 天→采粉→授粉→再套袋挂牌（逐步）`
    : `第 ${beds[plantRef.bed].no} 行 × ${beds[fatherBed].no} 行：整行杂交完成（四件工具走完）`);
  if (stepwise) {
    const pos = plantPos(plantRef);
    app.setCamera([pos.x, pos.y + 1.1, pos.z + 2.0], [pos.x, pos.y + 0.75, pos.z]);
  }
}

/* 花朵拾取：点击蕾期花朵（自由探究章）触发授粉面板 */
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
function pickBloom(ev) {
  const rect = app.dom.getBoundingClientRect();
  pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObject(instBloom, false);
  if (!hits.length) return null;
  const instId = hits[0].instanceId;
  if (instId === undefined || instId >= instBloom.count) return null;
  return pickBloomInstance(instId);
}
app.dom.addEventListener('pointerdown', (ev) => {
  if (pollPop.hidden && strainPop.hidden && activeSectionId === 'free') {
    const p = pickBloom(ev);
    if (p && plantGrowth(p, garden.day).bloom.every((v) => v < 0.2)) openPollPanel({ plant: p, bed: p.bed });
  }
  if (activeSectionId === 'cross' && CROSS.step === 3 && CROSS.anthersLeft > 0) {
    const rect = app.dom.getBoundingClientRect();
    pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(FS.anthers.filter((a) => a.visible), false);
    if (hits.length) {
      const an = hits[0].object;
      an.visible = false;
      CROSS.anthersLeft -= 1;
      fsTools.tweezer.position.copy(an.getWorldPosition(new THREE.Vector3()));
      CROSS.msg(CROSS.anthersLeft > 0 ? `已夹去 1 枚花药，还剩 ${CROSS.anthersLeft} 枚。` : '10 枚雄蕊全部夹净，去雄完成。');
      hud.set('b', `花药已夹 ${10 - CROSS.anthersLeft}/10`);
    }
  }
});

/* ================= 相机预设 + 播种 / 收获引擎 ================= */

const CAM = {
  garden: [[0, 7.6, 14.2], [0, 0.6, -0.8]],
  bed12: [[-4.6, 2.1, 3.6], [-4.6, 0.7, -1.2]],
  bed34: [[-0.2, 2.1, 3.6], [-0.2, 0.7, -1.2]],
  bed56: [[4.3, 2.1, 3.6], [4.3, 0.7, -1.2]],
  station: [[10.4, 1.66, 4.42], [10.4, 0.58, 3.42]],
  bench: [[0.6, 2.4, 8.0], [0.6, 1.05, 4.4]],
  benchDish: [[-1.3, 2.2, 6.4], [-1.3, 1.0, 4.2]],
  benchSample: [[2.15, 2.0, 6.9], [2.15, 1.15, 4.2]],
  board: [[-7.28, 1.86, 5.9], [-9.55, 1.36, 2.44]],
  mendel: [[-6.5, 2.02, -2.28], [-6.5, 1.52, -6.3]],
  methodArc: [[9.2, 2.3, 6.4], [10.4, 1.3, 1.6]],
};
function flyCam(preset, immediate = false) {
  app.setCamera(CAM[preset][0], CAM[preset][1], immediate);
}

/* 整行播种（纯系）便捷封装（章节脚本用） */
function sowRow(bedIdx, strainKey, day) {
  const bed = beds[bedIdx];
  const strain = STRAINS[strainKey];
  clearPlants((p) => p.bed === bedIdx);
  bed.strainKey = strainKey;
  bed.strainName = strain.name;
  bed.strainDesc = strain.desc;
  bed.bigSample = false;
  const rndP = mulberry32(garden.nextSowId++ * 131 + 7);
  for (let i = 0; i < 6; i++) {
    addPlant(bedIdx, i, { ...strain.genes }, day !== undefined ? day : garden.day - (rndP() < 0.35 ? 3 : 0));
  }
  bed.plate(bed.no, strain.name, strain.desc);
  growthDirty = true;
  syncGenoLabels();
}

/* 收获：行内成熟植株 → 种子入袋（授粉目标优先，其余自交）→ 上台分拣 */
function harvestBed(bedIdx, opts = {}) {
  const list = plantsOfBed(bedIdx).filter((p) => plantGrowth(p, garden.day).g > 0.88);
  if (!list.length) return { count: 0, seeds: [] };
  const seeds = [];
  for (const p of list) {
    const tgt = FLOW.pollTargets.find((t) => t.plant === p);
    const motherGenes = p.genes;
    const fatherGenes = tgt ? STRAINS[beds[tgt.fatherBed].strainKey || 'std'].genes : p.genes;
    const rndK = mulberry32(p.id * 991 + garden.season * 17);
    for (let i = 0; i < 8; i++) {
      const genes = crossGenes(motherGenes, fatherGenes, rndK);
      const look = seedLook(genes, motherGenes);
      seeds.push({ genes, ...look, mother: motherGenes, father: fatherGenes });
    }
  }
  if (!opts.keepPlants) clearPlants((p) => p.bed === bedIdx);
  FLOW.pollTargets = FLOW.pollTargets.filter((t) => t.plant.bed !== bedIdx);
  garden.harvested.push(...seeds);
  const bed = beds[bedIdx];
  addRecord(`收获第 ${bed.no} 行：${list.length} 株 · ${seeds.length} 粒种子${opts.label ? `（${opts.label}）` : ''}`);
  const mother = seeds[0].mother;
  const father = seeds[0].father;
  const uniformM = seeds.every((s) => JSON.stringify(s.mother) === JSON.stringify(mother));
  const uniformF = seeds.every((s) => JSON.stringify(s.father) === JSON.stringify(father));
  const st = computeStats(seeds, ['R'], 'seeds', uniformM ? mother : null, uniformF ? father : null);
  setStats(st);
  showOnBench(seeds);
  return { count: list.length, seeds };
}
function showOnBench(seeds) {
  garden.benchSeedList = seeds.slice(0, SEED_CAP);
  laySeeds(garden.benchSeedList, -0.1, 0.35, 1.5, 0.72);
}

/* ================= 授粉台流程状态机（花特写台，人工授粉章） ================= */

let activeSectionId = null;
let activeCleanup = null;
const hud = makeHUD(lcData, [
  ['a', '阶段'],
  ['b', '读数'],
  ['c', '提示'],
]);
hud.el.style.display = 'none';
const ctl = createControlsPanel(controlsEl);

const CROSS = {
  step: 0,
  anthersLeft: 10,
  bagged: false,
  waited: false,
  pollen: false,
  done: false,
  fatherKey: 'wr',
  msg: () => {},
};
const CROSS_STEPS = [
  '① 到母本花蕾', '② 拨开花瓣', '③ 镊子夹净 10 枚花药', '④ 套上纸袋',
  '⑤ 等待 1 天（雌蕊成熟）', '⑥ 采父本花粉', '⑦ 授粉', '⑧ 再套袋 + 挂牌',
];
function crossReset() {
  CROSS.step = 0;
  CROSS.anthersLeft = 10;
  CROSS.bagged = false;
  CROSS.waited = false;
  CROSS.pollen = false;
  CROSS.done = false;
  for (const a of FS.anthers) a.visible = true;
  fsTools.bag.visible = false;
  fsTools.bagFold.visible = false;
  fsTools.tag.visible = false;
  fsTools.pollenTip.visible = false;
  fsTools.tweezer.position.set(0.42, 0.62, 0.18);
  fsTools.brush.position.set(-0.4, 0.4, 0.16);
  fsPetalsOpen(0);
  crossApplyStep();
}
function crossApplyStep() {
  const step = CROSS.step;
  fsTools.tweezer.visible = step >= 2 && step <= 3;
  fsTools.brush.visible = step >= 5 && step <= 7;
  fsPetalsOpen(step >= 2 ? 1 : 0);
  fsTools.bag.visible = step >= 4;
  fsTools.bagFold.visible = fsTools.bag.visible;
  fsTools.pollenTip.visible = CROSS.pollen;
  if (CROSS.done) {
    fsTools.tag.visible = true;
    fsTools.tweezer.visible = false;
    fsTools.brush.visible = false;
    fsTools.bag.visible = true;
    fsTools.bagFold.visible = true;
  }
  hud.set('a', step === 0 ? '蕾期' : step >= 8 ? '杂交完成' : CROSS_STEPS[step - 1]);
  hud.set('b', step >= 3 ? `花药已夹 ${10 - CROSS.anthersLeft}/10` : '花药 10 枚待夹');
  hud.set('c', CROSS.done ? '纸袋 + 标签就位，这朵花将结出杂交豆荚' : '按 ① → ⑧ 顺序完成；点错会有提示');
}
function buildCrossControls() {
  ctl.clear();
  const msg = ctl.readout({ label: '提示', value: '到花特写台，从 ① 开始' });
  CROSS.msg = (t) => msg.update(t);
  function stepBtn(idx, labelText, run) {
    ctl.button({
      label: labelText,
      onClick: () => {
        if (idx === 1) { run(); return; }
        if (CROSS.step < idx - 1) {
          CROSS.msg(`顺序不对——先完成「${CROSS_STEPS[Math.min(CROSS.step, 7)]}」`);
          return;
        }
        run();
      },
    });
  }
  stepBtn(1, '① 到母本花蕾', () => {
    CROSS.step = Math.max(CROSS.step, 1);
    flyCam('station');
    CROSS.msg('这是圆粒品系（母本）的花蕾。花瓣还包着雄蕊——正是去雄的好时机。');
    crossApplyStep();
  });
  stepBtn(2, '② 拨开花瓣', () => {
    CROSS.step = 2;
    flyCam('station');
    CROSS.msg('旗瓣后仰、翼瓣张开、龙骨瓣下翻——雄蕊和雌蕊露出来了。');
    crossApplyStep();
  });
  stepBtn(3, '③ 镊子夹净 10 枚花药', () => {
    if (CROSS.step < 2) { CROSS.msg('先把花瓣拨开'); return; }
    CROSS.step = 3;
    CROSS.msg('在 3D 里点击黄色花药，逐枚夹去（镊子会跟过去）。');
    crossApplyStep();
  });
  stepBtn(4, '④ 套上纸袋', () => {
    if (CROSS.anthersLeft > 0) { CROSS.msg(`雄蕊没夹净——还剩 ${CROSS.anthersLeft} 枚`); return; }
    CROSS.step = 4;
    CROSS.bagged = true;
    CROSS.msg('纸袋套上，防止外来花粉干扰。');
    crossApplyStep();
  });
  stepBtn(5, '⑤ 等待 1 天（雌蕊成熟）', () => {
    if (CROSS.step < 4) { CROSS.msg('先套袋，再等雌蕊成熟'); return; }
    CROSS.step = 5;
    CROSS.waited = true;
    garden.day += 1;
    tbRange.value = garden.day;
    growthDirty = true;
    CROSS.msg('雌蕊成熟了——柱头亮起来了，可以授粉。');
    crossApplyStep();
  });
  stepBtn(6, '⑥ 采父本花粉', () => {
    if (CROSS.step < 5) { CROSS.msg('雌蕊还没成熟，先等待 1 天'); return; }
    CROSS.step = 6;
    CROSS.pollen = true;
    fsTools.pollenTip.visible = true;
    CROSS.msg(`毛笔已到 ${STRAINS[CROSS.fatherKey].name}（Ⅱ 行早播 7 天正开花）蘸上花粉——笔尖发亮。`);
    crossApplyStep();
  });
  stepBtn(7, '⑦ 授粉', () => {
    if (!CROSS.pollen) { CROSS.msg('毛笔上还没有花粉——先去父本采集'); return; }
    CROSS.step = 7;
    fsTools.brush.position.set(0.06, 0.96, 0.12);
    fsTools.brush.rotation.z = 1.2;
    CROSS.msg('用毛笔把花粉轻涂到柱头——花柱顶端那颗亮晶晶的小圆头。');
    crossApplyStep();
  });
  stepBtn(8, '⑧ 再套袋 + 挂牌', () => {
    if (CROSS.step < 7) { CROSS.msg('先把花粉授上，再挂标签'); return; }
    CROSS.done = true;
    CROSS.step = 8;
    CROSS.msg('杂交完成！这朵花会结出杂交豆荚（Ⅰ 行整行登记为 × 皱粒）。');
    for (const p of plantsOfBed(0)) FLOW.pollTargets.push({ plant: p, fatherBed: 1 });
    addRecord('花特写台：圆粒 ♀ × 皱粒 ♂ 杂交完成（去雄→套袋→等 1 天→采粉→授粉→再套袋挂牌）');
    crossApplyStep();
  });
  ctl.sep();
  ctl.button({
    label: '一键完成整行杂交',
    onClick: () => {
      crossReset();
      CROSS.step = 8;
      CROSS.done = true;
      CROSS.anthersLeft = 0;
      CROSS.bagged = true;
      CROSS.waited = true;
      CROSS.pollen = true;
      for (const a of FS.anthers) a.visible = false;
      crossApplyStep();
      CROSS.msg('整行杂交完成：去雄→套袋→等 1 天→采粉→授粉→再套袋挂牌。');
      for (const p of plantsOfBed(0)) FLOW.pollTargets.push({ plant: p, fatherBed: 1 });
      addRecord('Ⅰ 行 × Ⅱ 行一键整行杂交完成');
    },
  });
  ctl.button({
    label: '重置',
    onClick: () => {
      crossReset();
      CROSS.msg('已重置，从头再来一遍。');
    },
  });
  ctl.sep();
  ctlSelect({
    options: ['wr', 'gwr', 'dw'].map((k) => ({ label: `父本：${STRAINS[k].name}`, value: k })),
    value: 'wr',
    label: '父本品系',
    onChange: (k) => {
      CROSS.fatherKey = k;
      sowRow(1, k, garden.day - 39);
      CROSS.msg(`父本换成 ${STRAINS[k].name}——Ⅱ 行已重播为该品系。`);
    },
  });
  crossApplyStep();
}

/* ---- 第 3 章 一对相对性状的杂交（四季脚本） ---- */
function sowF2Plants(n) {
  clearPlants((p) => p.bed === 2 || p.bed === 3);
  const desc = `高 : 矮 ≈ 3 : 1（${n} 株显示 6 株）`;
  for (const bi of [2, 3]) {
    beds[bi].strainKey = 'F2';
    beds[bi].strainName = 'F₂（Dd 自交）';
    beds[bi].strainDesc = desc;
    beds[bi].plate(beds[bi].no, 'F₂ 植株', desc);
  }
  const shown = Math.min(6, Math.max(2, Math.round(n / 16)));
  const rndF2 = mulberry32(2027 + n);
  const f1Genes = { ...STRAINS.std.genes, H: 'Dd' };
  for (let i = 0; i < shown; i++) {
    addPlant(i < 3 ? 2 : 3, i, selfCross(f1Genes, rndF2), 2);
  }
  garden.day = Math.max(garden.day, 96);
  growthDirty = true;
  const standing = plantsOfBed(2).concat(plantsOfBed(3));
  const tally = { tall: 0, dwarf: 0 };
  for (const p of standing) (plantLook(p.genes).tall ? tally.tall++ : tally.dwarf++);
  hud.set('a', `F₂ 植株 ${n} 株（显示 ${standing.length} 株）`);
  hud.set('b', `台上 ${tally.tall} 高 / ${tally.dwarf} 矮`);
  hud.set('c', `样本 ${n}：理论高 ${Math.round(n * 3 / 4)} · 矮 ${Math.round(n / 4)}`);
}
function buildMonoControls() {
  ctl.clear();
  let step = 0;
  const msg = ctl.readout({ label: '进度', value: '按 ① → ④ 走完分离定律的两季观察' });
  ctl.button({
    label: '① 收下杂交豆荚（F₁ 种子全圆粒）',
    onClick: () => {
      if (step !== 0) { msg.update('这一步已经做过了——点下一步'); return; }
      if (!plantsOfBed(0).length) sowRow(0, 'std', garden.day - 34);
      if (!plantsOfBed(1).length) sowRow(1, 'wr', garden.day - 41);
      garden.day = Math.max(garden.day, 96);
      growthDirty = true;
      const r = harvestBed(0, { label: 'F₁ 种子' });
      flyCam('benchDish');
      drawPunnett({
        title: '亲本：圆粒（RR）× 皱粒（rr）',
        rows: ['r', 'r'], cols: ['R', 'R'],
        cells: [['Rr 圆', 'Rr 圆'], ['Rr 圆', 'Rr 圆']],
        tints: [['#e8dfa8', '#e8dfa8'], ['#e8dfa8', '#e8dfa8']],
        note: 'F₁ 基因型全是 Rr——种子当季就表现：全圆粒\n（种子的形状是种子自己的基因型；种皮颜色随母本）',
      });
      msg.update(`F₁ 收获 ${r.seeds.length} 粒——全是圆粒。皱粒作父本只提供 r。`);
      hud.set('a', `F₁ 种子 ${r.seeds.length} 粒`);
      hud.set('b', '圆粒 100% · 皱粒 0%');
      hud.set('c', '种子的性状早一代显现');
      step = 1;
    },
  });
  ctl.button({
    label: '② 第 2 季：种下 F₁（植株全高茎）',
    onClick: () => {
      if (step !== 1) { msg.update('先完成 ① 收获 F₁ 种子'); return; }
      nextSeason(true);
      clearPlants((p) => p.bed === 4 || p.bed === 5);
      const f1Genes = { ...STRAINS.std.genes, H: 'Dd' };
      for (let i = 0; i < 6; i++) addPlant(i < 3 ? 4 : 5, i, { ...f1Genes }, 2);
      for (const bi of [4, 5]) {
        beds[bi].strainKey = 'F1-height';
        beds[bi].strainName = 'F₁（高 × 矮）';
        beds[bi].strainDesc = '基因型 Dd · 全部高茎';
        beds[bi].plate(beds[bi].no, 'F₁ 植株', 'Dd · 全高茎');
      }
      garden.day = 44;
      tbRange.value = 44;
      growthDirty = true;
      flyCam('bed56');
      drawPunnett({
        title: '亲本：高茎（DD）× 矮茎（dd）',
        rows: ['d', 'd'], cols: ['D', 'D'],
        cells: [['Dd 高', 'Dd 高'], ['Dd 高', 'Dd 高']],
        tints: [['#d8e4b0', '#d8e4b0'], ['#d8e4b0', '#d8e4b0']],
        note: 'F₁ 植株基因型全是 Dd——表现全高茎\n（植株性状要长成后才看得到）',
      });
      msg.update('F₁ 植株全部高茎——显性性状整齐一致。下一步收获 F₁ 自交的种子。');
      hud.set('a', '第 2 季 · F₁ 全高茎');
      hud.set('b', '基因型 Dd × 6 株');
      hud.set('c', '高茎对矮茎为显性');
      step = 2;
    },
  });
  ctl.button({
    label: '③ 收获 F₁ 自交种子，分拣',
    onClick: () => {
      if (step !== 2) { msg.update('先在 ② 里把 F₁ 种下去'); return; }
      garden.day = 96;
      growthDirty = true;
      const seeds = [];
      for (const p of plantsOfBed(4).concat(plantsOfBed(5))) {
        for (let i = 0; i < 8; i++) {
          const genes = selfCross(p.genes, mulberry32(p.id * 77 + i * 13));
          const look = seedLook(genes, p.genes);
          seeds.push({ genes, ...look, mother: p.genes, father: p.genes });
        }
      }
      garden.harvested.push(...seeds);
      addRecord(`F₁（Dd）自交收获 ${seeds.length} 粒 F₂ 种子，分拣计数`);
      setStats(computeStats(seeds, ['R'], 'seeds', seeds[0].mother, seeds[0].father));
      flyCam('benchDish');
      drawPunnett({
        title: 'F₁（Rr）× F₁（Rr）自交',
        rows: ['R', 'r'], cols: ['R', 'r'],
        cells: [['RR 圆', 'Rr 圆'], ['Rr 圆', 'rr 皱']],
        tints: [['#e8dfa8', '#e8dfa8'], ['#e8dfa8', '#e8d0a0']],
        note: 'F₂ 基因型 RR : Rr : rr = 1 : 2 : 1\n表现型 圆粒 : 皱粒 ≈ 3 : 1',
      });
      msg.update('F₂ 种子分拣完成——看台账：圆 : 皱 ≈ 3 : 1（卡方 p > 0.05 即符合）。');
      hud.set('a', `F₂ 种子 ${seeds.length} 粒`);
      hud.set('b', '圆 : 皱 ≈ 3 : 1');
      hud.set('c', 'χ² 检验看台账');
      step = 3;
    },
  });
  const nSlider = ctl.slider({
    label: 'F₂ 株数', min: 24, max: 400, step: 8, value: 96,
    fmt: (v) => `${v} 株`,
    onInput: (v) => { if (step >= 3) sowF2Plants(v); },
  });
  ctl.button({
    label: '④ 第 3 季：F₂ 入土，量茎的高矮',
    onClick: () => {
      if (step !== 3) { msg.update('先在 ③ 里收获并分拣 F₂ 种子'); return; }
      nextSeason(true);
      sowF2Plants(Number(nSlider.get()));
      flyCam('bed34');
      const seeds = garden.harvested.slice(-96);
      setStats(computeStats(seeds, ['H'], 'plants', seeds[0].mother, seeds[0].father));
      drawPunnett({
        title: 'F₁（Dd）× F₁（Dd）—— 茎的高度',
        rows: ['D', 'd'], cols: ['D', 'd'],
        cells: [['DD 高', 'Dd 高'], ['Dd 高', 'dd 矮']],
        tints: [['#d8e4b0', '#d8e4b0'], ['#d8e4b0', '#c8b098']],
        note: 'F₂ 基因型 DD : Dd : dd = 1 : 2 : 1\n表现型 高茎 : 矮茎 ≈ 3 : 1',
      });
      msg.update('F₂ 植株种下了——等长到成熟，台账按「茎的高度」统计高 : 矮 ≈ 3 : 1。');
      hud.set('a', `第 3 季 · F₂ ${nSlider.get()} 株`);
      hud.set('b', '高 : 矮 ≈ 3 : 1');
      hud.set('c', '拉样本量再看一次，比例更稳');
      step = 4;
    },
  });
  ctl.sep();
  ctl.button({
    label: '重新走一遍（清园重来）',
    onClick: () => {
      nextSeason(true);
      garden.harvested = [];
      clearSeeds();
      setStats(null);
      drawPunnett({ title: 'PeaLab · 棋盘格', note: '在章节里开始实验吧' });
      step = 0;
      msg.update('已清园。重新从 ① 开始。');
      hud.set('a', '—'); hud.set('b', '—'); hud.set('c', '');
    },
  });
}

/* ---- 第 4 章 测交：验证分离（先预测，再动手） ---- */
function buildTestControls() {
  ctl.clear();
  if (!plantsOfBed(0).length) sowRow(0, 'std', garden.day - 36);
  if (!plantsOfBed(1).length) sowRow(1, 'wr', garden.day - 43);
  /* Ⅰ 行重播成 F₁（Rr）植株 */
  clearPlants((p) => p.bed === 0);
  for (let i = 0; i < 6; i++) addPlant(0, i, { ...STRAINS.std.genes, R: 'Rr' }, garden.day - 36);
  beds[0].strainKey = 'F1';
  beds[0].strainName = 'F₁ 圆粒植株（Rr）';
  beds[0].strainDesc = '上一季杂交的 F₁，圆粒';
  beds[0].plate(beds[0].no, 'F₁ 植株（圆）', '基因型 Rr · 待测交');
  garden.day = Math.max(garden.day, 96);
  growthDirty = true;
  let prediction = null;
  const msg = ctl.readout({ label: '预测', value: '先选一个预测，再动手验证' });
  ctl.seg({
    options: [
      { label: '预测：全圆粒', value: 'all-round' },
      { label: '预测：1 : 1', value: 'half' },
      { label: '预测：3 : 1', value: 'three' },
    ],
    value: null,
    onChange: (v) => {
      prediction = v;
      if (v === 'half') msg.update('对！F₁ 产生 R、r 两种等量配子，皱粒只给 r → 后代 1 : 1。');
      else if (v === 'all-round') msg.update('想想：皱粒父本只能提供 r 配子，F₁ 的 r 配子会怎样？');
      else msg.update('3 : 1 是 F₁ 自交的结果——测交不是自交哦。');
    },
  });
  ctl.sep();
  const nSlider = ctl.slider({
    label: '测交样本数', min: 48, max: 400, step: 8, value: 208,
    fmt: (v) => `${v} 粒`,
    onInput: (v) => { if (testDone) runTest(v, true); },
  });
  let testDone = false;
  ctl.button({
    label: '一键测交：Ⅰ 行 ♀ × Ⅱ 行 ♂',
    onClick: () => {
      if (!prediction) { msg.update('先在上方选一个预测再动手'); return; }
      runTest(Number(nSlider.get()));
      testDone = true;
    },
  });
  ctl.button({
    label: '孟德尔的测交数据（106 : 101）',
    onClick: () => {
      const chiV = ((106 - 103.5) ** 2) / 103.5 * 2;
      setStats({
        labels: ['圆粒', '皱粒'],
        obs: [106, 101], exp: [103.5, 103.5],
        ratioArr: ['1', '1'], ratio: '1:1',
        chiV, df: 1, p: chiP(chiV, 1), note: '', verdict: chiP(chiV, 1) > 0.05 ? 'good' : 'bad',
      });
      drawPunnett({
        title: '测交：F₁（Rr）× 皱粒（rr）',
        rows: ['r', 'r'], cols: ['R', 'r'],
        cells: [['Rr 圆', 'rr 皱'], ['Rr 圆', 'rr 皱']],
        tints: [['#e8dfa8', '#e8d0a0'], ['#e8dfa8', '#e8d0a0']],
        note: '后代表型直接暴露 F₁ 配子的种类与比例：1 : 1\n孟德尔实测 106 圆 : 101 皱',
      });
      flyCam('benchDish');
      msg.update('孟德尔的实测 106 : 101——与 1 : 1 预测吻合，假说被验证。');
    },
  });
  ctl.button({
    label: '重置',
    onClick: () => {
      garden.harvested = [];
      clearSeeds();
      setStats(null);
      testDone = false;
      prediction = null;
      msg.update('已重置。先选预测再测交。');
    },
  });
  function runTest(n, quiet = false) {
    const seeds = [];
    const rndT = mulberry32(303 + n);
    const mother = { ...STRAINS.std.genes, R: 'Rr' };
    const father = STRAINS.wr.genes;
    for (let i = 0; i < n; i++) {
      const genes = crossGenes(mother, father, rndT);
      const look = seedLook(genes, mother);
      seeds.push({ genes, ...look, mother, father });
    }
    garden.harvested.push(...seeds);
    setStats(computeStats(seeds, ['R'], 'seeds', mother, father));
    drawPunnett({
      title: '测交：F₁（Rr）× 皱粒（rr）',
      rows: ['r', 'r'], cols: ['R', 'r'],
      cells: [['Rr 圆', 'rr 皱'], ['Rr 圆', 'rr 皱']],
      tints: [['#e8dfa8', '#e8d0a0'], ['#e8dfa8', '#e8d0a0']],
      note: `本次测交 ${n} 粒——看台账 χ² 判定\n预测对了吗？`,
    });
    showOnBench(seeds.slice(0, SEED_CAP));
    flyCam('benchDish');
    addRecord(`测交：Ⅰ 行 ♀（Rr）× Ⅱ 行 ♂（rr）→ ${n} 粒`);
    if (!quiet) msg.update('分拣完成——台账给出 χ² 判定。看棋盘格 4 格：2 圆 2 皱。');
  }
}

/* ---- 第 5 章 两对相对性状的杂交（9:3:3:1 + 1:1:1:1） ---- */
function buildDiControls() {
  ctl.clear();
  sowRow(0, 'std', garden.day - 36);
  sowRow(1, 'gwr', garden.day - 43);
  beds[0].strainName = '黄色圆粒 ♀';
  beds[0].strainDesc = 'YY RR · 上一季已 × Ⅱ';
  beds[0].plate(beds[0].no, '黄圆 ♀', 'YY RR');
  beds[1].strainName = '绿色皱粒 ♂';
  beds[1].strainDesc = 'yy rr · 早播 7 天';
  beds[1].plate(beds[1].no, '绿皱 ♂', 'yy rr · 早播');
  garden.day = Math.max(garden.day, 96);
  growthDirty = true;
  let step = 0;
  const msg = ctl.readout({ label: '进度', value: '① → ④：F₁ 黄圆 → 测交 → F₂ 9:3:3:1' });
  ctl.button({
    label: '① 收获 F₁ 种子（全黄圆）',
    onClick: () => {
      if (step !== 0) { msg.update('这一步已经做过了'); return; }
      const seeds = [];
      for (let i = 0; i < 48; i++) {
        const genes = crossGenes(STRAINS.std.genes, STRAINS.gwr.genes, mulberry32(41 + i));
        const look = seedLook(genes, STRAINS.std.genes);
        seeds.push({ genes, ...look, mother: STRAINS.std.genes, father: STRAINS.gwr.genes });
      }
      garden.harvested.push(...seeds);
      setStats(computeStats(seeds, ['Y', 'R'], 'seeds', STRAINS.std.genes, STRAINS.gwr.genes));
      drawPunnett({
        title: '黄圆（YYRR）× 绿皱（yyrr）',
        rows: ['yr'], cols: ['YR'],
        cells: [['YyRr 黄圆']],
        tints: [['#e8dfa8']],
        note: 'F₁ 全是黄色圆粒（YyRr）——两对显性一起表现',
      });
      flyCam('benchDish');
      msg.update(`F₁ 收 ${seeds.length} 粒全是黄圆。`);
      hud.set('a', `F₁ ${seeds.length} 粒全黄圆`);
      hud.set('b', '基因型 YyRr');
      hud.set('c', '下一步种 F₁ 并做测交');
      step = 1;
    },
  });
  ctl.button({
    label: '② 种下 F₁，部分花 × 绿皱（测交）',
    onClick: () => {
      if (step !== 1) { msg.update('先完成 ①'); return; }
      nextSeason(true);
      clearPlants((p) => p.bed === 0);
      const f1 = { ...STRAINS.std.genes, R: 'Rr', Y: 'Yy' };
      for (let i = 0; i < 6; i++) addPlant(0, i, { ...f1 }, 2);
      beds[0].strainName = 'F₁（YyRr）';
      beds[0].strainDesc = '黄色圆粒 · 正在开花';
      beds[0].plate(beds[0].no, 'F₁ 植株', 'YyRr · 黄圆');
      garden.day = 96;
      growthDirty = true;
      msg.update('F₁ 种下了。Ⅱ 行绿皱（yyrr）已备好作测交父本——进 ③ 分拣测交种子。');
      hud.set('a', '第 2 季 · F₁ 全黄圆');
      hud.set('b', 'YyRr × 6 株');
      hud.set('c', '测交用的绿皱已早播开花');
      step = 2;
    },
  });
  const nSlider = ctl.slider({
    label: '分拣样本数', min: 64, max: 400, step: 8, value: 224,
    fmt: (v) => `${v} 粒`,
    onInput: (v) => { if (step >= 3) sortBatch(v); },
  });
  ctl.button({
    label: '③ 分拣 F₂ 种子：9 : 3 : 3 : 1',
    onClick: () => {
      if (step !== 2) { msg.update('先在 ② 里种下 F₁'); return; }
      sortBatch(Number(nSlider.get()), 'F2');
      step = 3;
    },
  });
  ctl.button({
    label: '④ 分拣测交后代（四型 1:1:1:1）',
    onClick: () => {
      if (step !== 3) { msg.update('先在 ③ 分拣 F₂，再来看测交'); return; }
      sortBatch(Number(nSlider.get()), 'testcross');
    },
  });
  ctl.sep();
  ctl.button({
    label: '看 4×4 棋盘格（16 格数出 9:3:3:1）',
    onClick: () => {
      flyCam('board');
      drawPunnett({
        title: 'F₁（YyRr）× F₁（YyRr）· 4 × 4 棋盘格',
        rows: ['YR', 'Yr', 'yR', 'yr'], cols: ['YR', 'Yr', 'yR', 'yr'],
        cells: [
          ['黄圆', '黄圆', '黄圆', '黄圆'],
          ['黄圆', '黄皱', '黄圆', '黄皱'],
          ['黄圆', '黄圆', '绿圆', '绿圆'],
          ['黄圆', '黄皱', '绿圆', '绿皱'],
        ],
        tints: [
          ['#e8dfa8', '#e8dfa8', '#e8dfa8', '#e8dfa8'],
          ['#e8dfa8', '#e8d0a0', '#e8dfa8', '#e8d0a0'],
          ['#e8dfa8', '#e8dfa8', '#c8dca0', '#c8dca0'],
          ['#e8dfa8', '#e8d0a0', '#c8dca0', '#b8cba0'],
        ],
        note: '数一数：黄圆 9 · 黄皱 3 · 绿圆 3 · 绿皱 1\n每对单独看仍是 3 : 1——两对相乘 (3:1)² = 9:3:3:1',
      });
    },
  });
  ctl.button({
    label: '清园重来',
    onClick: () => {
      nextSeason(true);
      garden.harvested = [];
      clearSeeds();
      setStats(null);
      step = 0;
      msg.update('已清园，从 ① 重来。');
    },
  });
  function sortBatch(n, kind = 'F2') {
    const mother = { ...STRAINS.std.genes, R: 'Rr', Y: 'Yy' };
    const father = kind === 'testcross' ? STRAINS.gwr.genes : mother;
    const title = kind === 'testcross' ? '测交：F₁（YyRr）× 绿皱（yyrr）' : 'F₁（YyRr）自交 → F₂';
    const seeds = [];
    const rndD = mulberry32(kind === 'testcross' ? 404 + n : 505 + n);
    for (let i = 0; i < n; i++) {
      const genes = crossGenes(mother, father, rndD);
      const look = seedLook(genes, mother);
      seeds.push({ genes, ...look, mother, father });
    }
    garden.harvested.push(...seeds);
    setStats(computeStats(seeds, ['Y', 'R'], 'seeds', mother, father));
    drawPunnett({
      title,
      rows: ['YR', 'Yr', 'yR', 'yr'], cols: ['YR', 'Yr', 'yR', 'yr'],
      cells: [
        ['黄圆', '黄圆', '黄圆', '黄圆'],
        ['黄圆', '黄皱', '黄圆', '黄皱'],
        ['黄圆', '黄圆', '绿圆', '绿圆'],
        ['黄圆', '黄皱', '绿圆', '绿皱'],
      ],
      tints: [
        ['#e8dfa8', '#e8dfa8', '#e8dfa8', '#e8dfa8'],
        ['#e8dfa8', '#e8d0a0', '#e8dfa8', '#e8d0a0'],
        ['#e8dfa8', '#e8dfa8', '#c8dca0', '#c8dca0'],
        ['#e8dfa8', '#e8d0a0', '#c8dca0', '#b8cba0'],
      ],
      note: kind === 'testcross'
        ? '测交后代 1 : 1 : 1 : 1——F₁ 配子四种等量的直接证据'
        : 'F₂ 表型 黄圆:绿圆:黄皱:绿皱 ≈ 9:3:3:1\n绿色圆粒与黄色皱粒是新组合',
    });
    showOnBench(seeds.slice(0, SEED_CAP));
    flyCam('benchDish');
    addRecord(kind === 'testcross' ? `测交分拣 ${n} 粒（1:1:1:1）` : `F₂ 分拣 ${n} 粒（9:3:3:1）`);
    if (kind === 'testcross') msg.update('测交分拣完成——台账 χ² 判定是否 1:1:1:1。');
    else msg.update('F₂ 分拣完成——四种表型都在，比值看台账。');
  }
}

/* ================= 下拉选择（edu-core 面板原生无 select，本地补齐） ================= */

function ctlSelect({ label: text, options, value, onChange }) {
  const wrap = document.createElement('div');
  wrap.className = 'ctl';
  const l = document.createElement('label');
  l.textContent = text;
  wrap.appendChild(l);
  const sel = document.createElement('select');
  sel.className = 'ctl-select';
  for (const o of options) {
    const op = document.createElement('option');
    op.value = String(o.value);
    op.textContent = o.label;
    sel.appendChild(op);
  }
  sel.value = String(value);
  sel.addEventListener('change', () => {
    const hit = options.find((o) => String(o.value) === sel.value);
    if (hit) onChange(hit.value);
  });
  wrap.appendChild(sel);
  ctl.el.appendChild(wrap);
  return { el: wrap, set(v) { sel.value = String(v); } };
}

/* ---- 第 1 章 为什么选豌豆（材料认识 · 豆园全景） ---- */

let whyPhenoReadout = null;
function buildWhyControls() {
  ctl.clear();
  const msg = ctl.readout({ label: '任务', value: '认识材料：闭花受粉 → 天然纯系；性状差异分明' });
  ctl.button({
    label: '豆园全景（六行豆畦）',
    onClick: () => {
      flyCam('garden');
      msg.update('布尔诺修道院的后园豆畦——孟德尔的试验豌豆就种在这样的木框畦里。');
    },
  });
  ctl.button({
    label: 'Ⅰ 行近景：看花与荚',
    onClick: () => {
      flyCam('bed12');
      msg.update('蝶形花冠：上有一枚旗瓣，左右各一枚翼瓣，龙骨瓣（拨开才可见）里裹着 10 枚雄蕊与 1 枚雌蕊。');
    },
  });
  ctl.button({
    label: '种子样品架（四种组合）',
    onClick: () => {
      flyCam('benchSample');
      msg.update('圆 / 皱 × 黄 / 绿四种样豆。灰种皮随母本，挡住了子叶颜色——要剥开种皮才看得到子叶。');
    },
  });
  ctl.button({
    label: garden.playing ? '暂停生长（空格）' : '播放生长（空格）',
    onClick: (b) => {
      setTimelinePlaying(!garden.playing);
      b.textContent = garden.playing ? '暂停生长（空格）' : '播放生长（空格）';
      msg.update(garden.playing
        ? '时间轴播放中——出苗、开花、结荚、成熟按物候推进。'
        : '已暂停。也可以直接拖动下方时间轴，逐天看豌豆的一生。');
    },
  });
  ctl.sep();
  const pheno = ctl.readout({ label: '物候', value: '' });
  whyPhenoReadout = pheno;
  ctl.button({
    label: '翻季：清园重播',
    onClick: () => {
      nextSeason(false);
      msg.update('新的一季开始：六行豆畦全部清空了。想任意播种品系，去「七对性状自由探究」章。');
    },
  });
  hud.show(false);
}

/* ---- 第 6 章 七对性状自由探究（六行操作台 · 基因型 · 大样本 · 棋盘格） ---- */

function buildFreeControls() {
  ctl.clear();
  const msg = ctl.readout({ label: '提示', value: '先去豆园收一行豆子，收好的种子会摆上工作台。' });
  /* 六行操作台：行号 + 当前品系 + 播种 / 收获 */
  const rowsBox = document.createElement('div');
  rowsBox.className = 'free-rows';
  for (let i = 0; i < beds.length; i++) {
    const bed = beds[i];
    const row = document.createElement('div');
    row.className = 'row-ops';
    const no = document.createElement('span');
    no.className = 'row-name';
    no.textContent = `${bed.no} 行`;
    const strain = document.createElement('span');
    strain.className = 'row-strain';
    strain.dataset.rowStrain = '';
    strain.textContent = bed.strainName || '（空畦）';
    const sowB = document.createElement('button');
    sowB.type = 'button';
    sowB.className = 'mini-btn';
    sowB.textContent = '播种';
    sowB.addEventListener('click', () => openStrainPicker(i));
    const harB = document.createElement('button');
    harB.type = 'button';
    harB.className = 'mini-btn';
    harB.textContent = '收获';
    harB.addEventListener('click', () => {
      const r = harvestBed(i);
      if (!r.count) {
        msg.update('这一行的豆荚还没成熟——把时间轴拖到成熟期（第 88 天后）再收获。');
        return;
      }
      msg.update(`收获 ${bed.no} 行：${r.count} 株 · ${r.seeds.length} 粒。看工作台分拣盘与台账统计（χ² 判定）。`);
      syncGenoLabels();
    });
    row.append(no, strain, sowB, harB);
    rowsBox.appendChild(row);
  }
  ctl.el.appendChild(rowsBox);
  refreshRowLabels();
  ctl.toggle({
    label: '显示基因型',
    value: showGeno,
    onChange: (v) => { showGeno = v; syncGenoLabels(); },
  });
  ctl.button({
    label: '扩大样本 ×10（已播行 · 400 株）',
    onClick: () => {
      let n = 0;
      beds.forEach((b, i) => {
        if (!b.strainKey) return;
        /* 收获袋行按袋内基因型重播；纯系品系行重播大样本；脚本章的哨兵行（F₂/F₁ 等）不动 */
        if (b.strainKey === 'harvest') {
          if (garden.harvested.length) { sowFromHarvest(i, 400); n++; }
        } else if (STRAINS[b.strainKey]) {
          sowBed(i, b.strainKey, 400);
          n++;
        }
      });
      msg.update(n
        ? `${n} 行已重播为大样本（400 株 · 显示 6 株）——样本越大，F₂ 比例越贴近理论值。`
        : '先播种一行，再来扩大样本。');
    },
  });
  ctl.button({
    label: '一键测交：Ⅰ 行 ♀ × Ⅱ 行 ♂',
    onClick: () => {
      if (!plantsOfBed(0).length || !plantsOfBed(1).length) {
        msg.update('Ⅰ / Ⅱ 两行都要先播种才能测交。');
        return;
      }
      FLOW.pollTargets = FLOW.pollTargets.filter((t) => t.plant.bed !== 0);
      for (const p of plantsOfBed(0)) FLOW.pollTargets.push({ plant: p, fatherBed: 1 });
      addRecord('自由探究：Ⅰ 行整行登记 × Ⅱ 行 ♂（收获时结杂交种子）');
      msg.update('测交已登记。把时间轴拖到成熟期收获 Ⅰ 行——台账按亲本基因型给理论比与卡方判定。');
    },
  });
  ctl.button({
    label: '豆园点花蕾 · 人工授粉',
    onClick: () => {
      msg.update('直接点豆园里蕾期的花（花苞）会弹出授粉面板：选父本（可早播 7 天），逐步或一键整行杂交。花已开的会提示「去雄太晚」。');
    },
  });
  ctl.sep();
  /* 两对性状棋盘格（最多选两对） */
  const traitOpts = TRAIT_ORDER.map((k) => ({ label: `${LOCI[k].name}（${LOCI[k].dom}/${LOCI[k].rec}）`, value: k }));
  let tA = 'R';
  let tB = 'Y';
  ctlSelect({ label: '性状 A', options: traitOpts, value: tA, onChange: (v) => { tA = v; } });
  ctlSelect({ label: '性状 B', options: traitOpts, value: tB, onChange: (v) => { tB = v; } });
  ctl.button({
    label: '两对性状的棋盘格（4×4）',
    onClick: () => {
      if (tA === tB) { msg.update('最多选两对，且要选不同的性状。'); return; }
      drawFreePunnett([tA, tB]);
      flyCam('board');
      msg.update('挂板上是 F₁ 双杂合自交的 4×4 棋盘格——数一数 9 : 3 : 3 : 1。');
    },
  });
  ctl.button({
    label: '比对孟德尔的原始数据',
    onClick: () => {
      flyCam('mendel');
      msg.update('数据出处：孟德尔 1865 年发表的《植物杂交实验》（Versuche über Pflanzenhybriden）——七对性状的 F₂ 比例全部逼近 3 : 1。');
    },
  });
  ctl.sep();
  ctl.button({
    label: '清园重来',
    onClick: () => {
      nextSeason(true);
      garden.harvested = [];
      clearSeeds();
      setStats(null);
      refreshRowLabels();
      syncGenoLabels();
      msg.update('豆畦已清空，收获袋与台账已清——从头探究。');
    },
  });
  hud.set('a', `第 ${Math.round(garden.day)} 天 · ${growthStageName(garden.day)}`);
  hud.set('b', `在田 ${plants.length} 株 · 收获袋 ${garden.harvested.length} 粒`);
  hud.set('c', '收获 / 测交结果进台账，χ² 给判定');

  /* F₁ 双杂合自交的理论棋盘（按所选两座位点展开 4×4，格子标表现型） */
  function drawFreePunnett(traits) {
    const [k1, k2] = traits;
    const gam = (k) => [k, k.toLowerCase()];
    const gams = [];
    for (const a of gam(k1)) for (const b of gam(k2)) gams.push(a + b);
    const tint = (dcount) => ['#c9d8a4', '#e8d0a0', '#e8dfa8'][dcount];
    const cells = [];
    const tints = [];
    for (const r of gams) {
      const rowC = [];
      const rowT = [];
      for (const c of gams) {
        const genes = { [k1]: [r[0], c[0]].sort().join(''), [k2]: [r[1], c[1]].sort().join('') };
        const p1 = phenotypeAt(genes, k1);
        const p2 = phenotypeAt(genes, k2);
        rowC.push(`${phenotypeLabel(k1, p1)}·${phenotypeLabel(k2, p2)}`);
        rowT.push(tint((1 - p1) + (1 - p2)));
      }
      cells.push(rowC);
      tints.push(rowT);
    }
    drawPunnett({
      title: `两对性状的棋盘格：${LOCI[k1].name} × ${LOCI[k2].name}`,
      rows: gams, cols: gams, cells, tints,
      note: 'F₁ 双杂合自交：数格子 → 9 : 3 : 3 : 1\n每对单独看仍是 3 : 1——(3:1)² = 9:3:3:1',
    });
  }
}

/* ---- 第 7 章 假说—演绎法（东弧五立牌 · 逐块点亮） ---- */

const methodHi = { idx: -1 };
function buildHypoControls() {
  ctl.clear();
  const NAMES = METHOD_STEPS.map((s) => s.title);
  for (const s of methodStands) s.mat.emissive.setHex(0xffdf9e);
  const msg = ctl.readout({ label: '方法', value: '观察 → 假说 → 演绎 → 验证 → 结论，沿东弧立牌走一遍。' });
  function goStep(i) {
    methodHi.idx = i;
    if (i < 0) {
      methodStands.forEach((s) => { s.mat.emissiveIntensity = 0; });
      msg.update('方法立牌已熄灭——点右栏按钮重新逐块点亮。');
      hud.set('a', '方法 · 5 块立牌');
      hud.set('b', '观察 假说 演绎 验证 结论');
      hud.set('c', '点右栏按钮逐块点亮');
      return;
    }
    const st = methodStands[i];
    app.setCamera([st.pos.x - 0.3, 1.9, st.pos.z + 2.6], [st.pos.x, 1.3, st.pos.z]);
    const lines = METHOD_STEPS[i].lines.join(' ').replace(/<[^>]+>/g, '');
    msg.update(`第 ${i + 1} 步 · ${NAMES[i]}：${lines}`);
    hud.set('a', `方法 ${i + 1}/5 · ${NAMES[i]}`);
    hud.set('b', lines.length > 26 ? `${lines.slice(0, 26)}…` : lines);
    hud.set('c', i < 4 ? '下一步 →（或直接点下一块按钮）' : '五步闭环——孟德尔由此从现象走到定律。');
  }
  const CIRCLES = ['①', '②', '③', '④', '⑤'];
  NAMES.forEach((n, i) => {
    ctl.button({ label: `${CIRCLES[i]} ${n}`, onClick: () => goStep(i) });
  });
  ctl.sep();
  ctl.button({
    label: '对照测交数据（106 : 101）',
    onClick: () => {
      goStep(3);
      const chiV = ((106 - 103.5) ** 2) / 103.5 * 2;
      setStats({
        labels: ['圆粒', '皱粒'],
        obs: [106, 101], exp: [103.5, 103.5],
        ratioArr: ['1', '1'], ratio: '1:1',
        chiV, df: 1, p: chiP(chiV, 1), note: '',
        verdict: chiP(chiV, 1) > 0.05 ? 'good' : 'bad',
      });
      msg.update('演绎推理 → 实验验证：孟德尔实测 106 : 101 ≈ 1 : 1，预测成立（台账已给卡方）。');
    },
  });
  ctl.button({
    label: '熄灯 · 回豆园全景',
    onClick: () => { goStep(-1); flyCam('garden'); },
  });
  hud.set('a', '方法 · 5 块立牌');
  hud.set('b', '观察 假说 演绎 验证 结论');
  hud.set('c', '点右栏按钮逐块点亮');
}

/* ---- 第 8 章 随堂检测（中栏答题卡） ---- */

const QUIZ = [
  {
    q: '孟德尔选用豌豆做杂交实验，最关键的原因是？',
    opts: ['豌豆生长周期短、易栽培', '豌豆严格闭花受粉，自然状态下都是纯系，且有易区分的相对性状', '豌豆种子大，方便计数', '豌豆花大而鲜艳，便于人工操作'],
    a: 1,
    ex: '闭花受粉保证自然纯系（去雄后人工授粉才可控），加上 7 对界限分明的相对性状，统计才干净。',
  },
  {
    q: '人工异花授粉中「去雄」的正确做法与时机是？',
    opts: ['开花后摘掉全部花瓣', '花蕾期掰开龙骨瓣，把 10 枚雄蕊逐一摘净并套袋', '只去掉花药，保留花丝', '授粉之后再去雄'],
    a: 1,
    ex: '豌豆在开花前花粉就已落到自己柱头上（闭花受粉），必须在蕾期去雄并立即套袋，防止外来花粉混入。',
  },
  {
    q: 'F₁（Rr）测交隐性纯合植株（rr），后代圆粒 : 皱粒 = ？',
    opts: ['全圆粒', '3 : 1', '1 : 1', '9 : 7'],
    a: 2,
    ex: 'F₁ 产生 R、r 两种等量配子，rr 只提供 r → 圆(Rr) : 皱(rr) = 1 : 1。孟德尔实测 106 : 101。',
  },
  {
    q: 'F₂ 出现 3 : 1 的根本原因是？',
    opts: ['显性性状总比隐性多一份', 'F₁ 产出两种配子、数量相同，受精时随机结合', '隐性性状在 F₂ 才出现', '环境对性状的筛选作用'],
    a: 1,
    ex: '成对因子各自分开进入配子，F₁ 产出两种配子且数量相同；随机结合后 RR:Rr:rr = 1:2:1，表现型即 3:1。',
  },
  {
    q: '两对相对性状的 F₂ 出现 9 : 3 : 3 : 1，需要的条件是？',
    opts: ['两对基因位于同一对染色体上', '两对等位基因分离时彼此独立（自由组合）', '亲本必须是同一品系', '样本量必须恰好 16 株'],
    a: 1,
    ex: '非同源染色体上的非等位基因自由组合，F₁ 产生 4 种等量配子 → (3:1)² 展开即 9:3:3:1。',
  },
  {
    q: '假说—演绎法的正确顺序是？',
    opts: ['提出假说 → 观察现象 → 实验验证', '观察现象 → 提出假说 → 演绎推理 → 实验验证 → 得出结论', '实验验证 → 演绎推理 → 提出假说', '观察 → 验证 → 结论（无需假说）'],
    a: 1,
    ex: '孟德尔路线：观察 3:1 → 假说（因子分离）→ 演绎（测交应 1:1）→ 测交验证 → 结论。',
  },
];
function buildQuizControls() {
  ctl.clear();
  const msg = ctl.readout({ label: '检测', value: '6 题速测——答完看得分与解析。' });
  let idx = 0;
  let score = 0;
  const panel = document.createElement('div');
  panel.className = 'quiz-panel';
  stage.appendChild(panel);
  function renderResult() {
    panel.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card q-result';
    const pct = Math.round((score / QUIZ.length) * 100);
    card.innerHTML = `
      <div class="q-progress">检测完成</div>
      <div class="big">${score} / ${QUIZ.length}</div>
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，分离定律与自由组合已经吃透了！' : pct >= 60 ? '，大部分概念清楚了，回顾一下错题。' : '，建议回到前几章再看一遍哦。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'ctl-btn active';
    again.textContent = '重新测验';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'ctl-btn';
    back.textContent = '回到第一章';
    back.addEventListener('click', () => { panel.remove(); selectChapter(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center';
    row.append(back, again);
    card.appendChild(row);
    panel.appendChild(card);
  }
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
      b.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
      b.addEventListener('click', () => {
        const correct = i === item.a;
        if (correct) score++;
        optsBox.querySelectorAll('.quiz-opt').forEach((bb, j) => {
          bb.disabled = true;
          if (j === item.a) bb.classList.add('correct');
          else if (j === i) bb.classList.add('wrong');
        });
        const ex = card.querySelector('.q-explain');
        ex.textContent = `${correct ? '✓ 回答正确。' : '✗ 再想想。'}${item.ex}`;
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
  renderQ();
  activeCleanup = () => panel.remove();
}

/* ================= 章节注册（左栏课题列表驱动） ================= */

const SECTIONS = [
  {
    id: 'why',
    title: '为什么选豌豆',
    home: 'garden',
    usesHud: false,
    html: `<p>孟德尔在<b>布尔诺圣托马斯修道院的后院豆畦</b>里种下豌豆，一测就是八年。选它做材料有两个理由：</p>
<p>① <b>严格自花受粉</b>——花是蝶形：一枚旗瓣居上、两枚翼瓣分列左右，龙骨瓣裹住 10 枚雄蕊与中央 1 枚雌蕊；开花之前花粉就已落在自家柱头完成受粉，即<span class="hl">闭花受粉</span>。自然状态下每一行都是稳定遗传的<b>纯系</b>；人工去雄后授粉，杂交才可控。</p>
<p>② 七对<b>界限分明</b>的相对性状，非此即彼、便于统计：</p>
<table><tr><th>性状</th><th>显性</th><th>隐性</th></tr>${TRAIT_ORDER.map((k) => `<tr><td>${LOCI[k].name}</td><td>${LOCI[k].dom}</td><td>${LOCI[k].rec}</td></tr>`).join('')}</table>
<p>拖动下方时间轴看豌豆一生；右侧按钮带你飞到豆园各处。</p>`,
    enter() { buildWhyControls(); },
  },
  {
    id: 'cross',
    title: '人工异花授粉',
    home: 'station',
    html: `<p>豌豆自花受粉，要让它在人工控制下「异花」，必须抢在<b>花蕾期</b>完成全套操作：</p>
<p><span class="hl">① 去雄</span>：在花蕾期掰开龙骨瓣，以镊子逐一摘除 10 枚花药（免得自花花粉掺进来）→ <span class="hl">② 套袋</span>：立即罩上纸袋（防外来花粉）→ <span class="hl">③ 等 1 天</span>：雌蕊（柱头）成熟 → <span class="hl">④ 采粉</span>：从父本花取花粉 → <span class="hl">⑤ 授粉</span>：把花粉涂在柱头上 → <span class="hl">⑥ 再套袋 + 挂标签</span>：记录父母本。</p>
<p>时机错了会有代价：<b>去雄太晚</b>（花已开）＝可能已自花受粉；<b>授粉过早</b>＝柱头未熟结籽少；<b>去雄后不套袋</b>＝外来花粉混入——这些都会在收获数据里现出原形。</p>`,
    enter() { buildCrossControls(); },
  },
  {
    id: 'mono',
    title: '一对相对性状的杂交',
    home: 'garden',
    html: `<p>以<b>圆粒 × 皱粒</b>为例，跟孟德尔一起走完三个季：</p>
<p><b>第 1 季</b>：去雄授粉 → 收获 F₁ 种子——<span class="hl">全是圆粒</span>（种子的形状是种子自己的基因型，当代表达）。</p>
<p><b>第 2 季</b>：种下 F₁ → 植株全部高茎（基因型 Dd，显性整齐一致）；F₁ 自花受粉结籽。</p>
<p><b>第 3 季</b>：收获 F₁ 自交的 F₂ 种子并分拣——<span class="hl">圆 : 皱 ≈ 3 : 1</span>；再种下 F₂ 看茎的高矮，同样 ≈ 3 : 1。隐性没有消失，只是「躲」了一代。</p>`,
    enter() { buildMonoControls(); },
  },
  {
    id: 'test',
    title: '测交：验证分离',
    home: 'benchDish',
    html: `<p>F₂ 的 3 : 1 只是一个「现象」，孟德尔为它设计了一个可证伪的检验——<span class="hl">测交</span>：</p>
<p>让 F₁（Rr）与<b>隐性纯合子</b>（rr）杂交。若假说成立（F₁ 产生 R、r 两种等量配子），后代应为圆 : 皱 = <span class="hl">1 : 1</span>。</p>
<p>先在上面选你的预测，再做实验；也可直接对照孟德尔的实测：<b>圆粒 106 : 皱粒 101</b>，与预测吻合。台账的 χ² 检验帮你判断「像不像 1 : 1」。</p>`,
    enter() { buildTestControls(); },
  },
  {
    id: 'di',
    title: '两对相对性状的杂交',
    home: 'garden',
    html: `<p>一对性状分完，孟德尔追问：<b>两对性状一起传，会不会互相干扰？</b></p>
<p>黄圆（YYRR）× 绿皱（yyrr）→ F₁ 全是黄圆（YyRr）→ F₁ 自交，F₂ 出现<span class="hl">四种组合</span>：黄圆 9 · 黄皱 3 · 绿圆 3 · 绿皱 1。<b>黄皱、绿圆是新组合</b>——亲本没有的搭配。</p>
<p>4×4 棋盘格里数得清清楚楚；每对单独看仍是 3 : 1——(3:1)² = 9:3:3:1，两对性状<b>自由组合</b>。再对 F₁ 做测交，后代 1:1:1:1，直接暴露 F₁ 的四种等量配子。</p>`,
    enter() { buildDiControls(); },
  },
  {
    id: 'free',
    title: '七对性状自由探究',
    home: 'garden',
    html: `<p>这一章是<b>沙盘</b>：豆园六行随你安排——</p>
<p>· 每行右侧<b>播种</b>：十个纯系品系（含七对全是隐性的<b>全隐性品系</b>），也可播上一季收获的种子；可勾「大样本」一季种 400 株。</p>
<p>· <span class="hl">显示基因型</span>开关：每株头顶标出 7 座位点基因型，表型与基因型当场对照。</p>
<p>· 收获后在工作台分拣计数，台账给观测 / 期望 / <span class="hl">χ²</span> 判定；两对性状可上<b>棋盘格</b>数 9:3:3:1。</p>
<p>· 西墙挂着<b>孟德尔的原始数据</b>（出自其 1865 年论文）——七对性状的 F₂ 比例全部逼近 3 : 1。</p>`,
    enter() { buildFreeControls(); },
  },
  {
    id: 'hypo',
    title: '假说—演绎法',
    home: 'methodArc',
    html: `<p>孟德尔的伟大不止于数据，更在于方法——<span class="hl">假说—演绎法</span>，五步闭环（东弧五块立牌）：</p>
<p><b>① 观察现象</b>：F₁ 显性整齐、F₂ 隐性重现且比近 3 : 1。<b>② 提出假说</b>：生物性状由成对的遗传因子控制；体细胞里因子成对，形成配子时彼此分开，受精时随机组合。<b>③ 演绎推理</b>：若假说成立，F₁ × 隐性纯合子后代应 1 : 1。<b>④ 实验验证</b>：测交实测 106 : 101 ≈ 1 : 1。<b>⑤ 得出结论</b>：分离定律成立；两对性状同理推出自由组合定律。</p>
<p>提出问题 → 假说 → 演绎 → 验证 → 结论，这套范式后来成了现代科学研究的通行证。</p>`,
    enter() { buildHypoControls(); },
  },
  {
    id: 'quiz',
    title: '随堂检测',
    home: 'garden',
    usesHud: false,
    html: `<p>6 题速测：材料选择、去雄时机、测交比例、3:1 根因、9:3:3:1 条件、假说—演绎法顺序。</p>
<p>答完每题有解析；成绩单会给复习建议。错得多的章，回左栏课题列表重走一遍。</p>`,
    enter() { buildQuizControls(); },
  },
];

/* ================= 章节管理（左栏课题列表 + 上一/下一课题 + 键盘） ================= */

let chapterIdx = 0;
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
  chapCount.textContent = `${String(chapterIdx + 1).padStart(2, '0')}/${String(SECTIONS.length).padStart(2, '0')}`;
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  closeStrainPicker();
  closePollPanel();
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  /* 章节级场景显隐：花特写台只在授粉章；孟德尔数据挂板在自由探究 / 假说—演绎法章；
   * 方法立牌只在假说—演绎法章（其余章藏在东弧外，免得白卡片抢镜） */
  flowerStation.visible = sec.id === 'cross';
  mendelBoard.visible = sec.id === 'free' || sec.id === 'hypo';
  for (const s of methodStands) s.group.visible = sec.id === 'hypo';
  methodHi.idx = -1;
  methodStands.forEach((s) => { s.mat.emissiveIntensity = 0; });
  whyPhenoReadout = null;
  timeBar.hidden = sec.id === 'quiz';
  if (garden.playing && sec.id === 'quiz') setTimelinePlaying(false);
  /* 工作台视角复位（每章从豆园视角开始） */
  if (benchView) {
    benchView = false;
    benchBtn.textContent = '工作台';
  }
  hud.show(sec.usesHud !== false);
  hud.set('a', '—');
  hud.set('b', '—');
  hud.set('c', '');
  activeSectionId = sec.id;
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  detailBody.scrollTop = 0;
  flyCam(sec.home || 'garden');
}

document.getElementById('chapPrev').addEventListener('click', () => selectChapter(chapterIdx - 1));
document.getElementById('chapNext').addEventListener('click', () => selectChapter(chapterIdx + 1));

/* 键盘：←→/,/. 切章 · 空格播放时间轴 · R 复位视角 · ] 折右栏 */
window.addEventListener('keydown', (e) => {
  const el = e.target;
  const tag = el && el.tagName ? String(el.tagName).toUpperCase() : '';
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || (el && el.isContentEditable)) return;
  if (e.key === ',' || e.key === 'ArrowLeft') selectChapter(chapterIdx - 1);
  else if (e.key === '.' || e.key === 'ArrowRight') selectChapter(chapterIdx + 1);
  else if (e.key === ' ') {
    if (!timeBar.hidden) {
      e.preventDefault();
      setTimelinePlaying(!garden.playing);
    }
  } else if (e.key === ']') toggleFold('r');
  else if (e.key === 'r' || e.key === 'R') flyCam(SECTIONS[chapterIdx].home || 'garden');
});

/* 镊子悬停花药高亮（授粉章 · 夹药步骤），共享材质 → 用缩放做反馈 */
let hoverAnther = null;
function setAntherHover(an) {
  if (hoverAnther === an) return;
  if (hoverAnther) hoverAnther.scale.set(1.3, 0.8, 0.8);
  hoverAnther = an;
  if (hoverAnther) hoverAnther.scale.set(1.62, 1.02, 1.02);
  app.dom.style.cursor = an ? 'pointer' : '';
}
app.dom.addEventListener('pointermove', (ev) => {
  if (activeSectionId !== 'cross' || CROSS.step !== 2) {
    setAntherHover(null);
    return;
  }
  const rect = app.dom.getBoundingClientRect();
  pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(FS.anthers.filter((a) => a.visible), false);
  setAntherHover(hits.length ? hits[0].object : null);
});

/* ================= 主循环：时间轴播放 · 实例重建 · 点睛动效 · 台账联动 ================= */

app.onFrame((dt, t) => {
  /* 时间轴播放（空格 / 播放键）：按天推进到成熟即停 */
  if (garden.playing && !timeBar.hidden) {
    const maxDay = Number(tbRange.max) || 104;
    const nd = garden.day + dt * 9;
    if (nd >= maxDay) {
      garden.day = maxDay;
      setTimelinePlaying(false);
    } else {
      garden.day = nd;
    }
    tbRange.value = Math.round(garden.day);
    growthDirty = true;
  }
  tbDay.textContent = `第 ${Math.round(garden.day)} 天`;
  tbStage.textContent = growthStageName(garden.day);
  if (growthDirty) {
    growthDirty = false;
    rebuildInstances(garden.day);
  }
  if (whyPhenoReadout && activeSectionId === 'why') {
    whyPhenoReadout.update(`第 ${Math.round(garden.day)} 天 · ${growthStageName(garden.day)}`);
  }
  /* 小蝴蝶：绕豆园游弋 + 双翼扑动（点睛道具） */
  butterfly.position.set(Math.sin(t * 0.21) * 4.6, 1.75 + Math.sin(t * 1.6) * 0.28, 0.4 + Math.cos(t * 0.17) * 2.4);
  butterfly.rotation.y = -t * 0.21 + Math.PI / 2;
  const flap = Math.sin(t * 10) * 0.55;
  butterfly.userData.wings[0].rotation.z = 0.25 + flap;
  butterfly.userData.wings[1].rotation.z = -0.25 - flap;
  /* 假说—演绎立牌：当前步卡片呼吸点亮 */
  if (methodHi.idx >= 0) {
    methodStands.forEach((s, i) => {
      const target = i === methodHi.idx ? 0.4 + Math.sin(t * 3) * 0.08 : 0;
      s.mat.emissiveIntensity += (target - s.mat.emissiveIntensity) * Math.min(1, dt * 6);
    });
  }
});

/* ================= 启动 ================= */

window.__eduSections = { select: selectChapter };
window.__peaDebug = { app, vfx, garden, beds, selectChapter, methodStands };
loader.hide();
selectChapter(0);
