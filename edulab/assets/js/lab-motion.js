/* EduLab · 运动与力（motion）—— Micro 级建模深改
 * =====================================================================
 * 章节：纸带与 v-t 图 / 光电门测速度 / 自由落体 / 牛顿第二定律 / 滑动摩擦力 /
 *       斜面与力的分解 / 超重与失重 / 机械能守恒 / 动量守恒 / 自由实验台
 *
 * 布局（micro 三件套移植）：真·三栏——左栏章节大纲（点击切章 + ‹01/10› 前后翻 +
 *   ← → 键）/ 中栏 3D 力学实验台（切章相机飞行）/ 右栏 知识点详解 + 实验控件 +
 *   数据坞（实时读数 + 实时图像 + 测量记录，] 键收起展开）；左右栏独立折叠
 *   （28px 竖条）+ 专注模式 + 大屏课堂模式 + 右栏三块手风琴（motion.acc* 记忆，
 *   切章不重置）。
 *
 * 视觉工艺（edu-vfx 接入 + Micro 级建模密度）：
 *   - 实验室语境：木纹实验台（钢框架 + 可调脚杯 + 台面钢包边）、气垫导轨全套
 *     （带刻度贴图导轨 + 出气孔排 + 端盖缓冲 + 支腿脚杯）、道具阵列（槽码盒 /
 *     砝码架 / 工具抽屉 / 电缆桥架），接触阴影贴片。
 *   - 主体建模：打点计时器（壳体 + 振动片 + 复写盘 + 两个接线柱）、光电门
 *     （U 型门架 + 发射/接收透镜 + 状态灯 + 电缆）、力传感器（S 挂钩 + LCD）、
 *     电磁铁释放器（线圈 + 衔铁盘）、电梯（玻璃轿厢 + 钢缆 + 对重 + 曳引机）、
 *     气垫摆（A 字架 + 量角器背板 + 黄铜摆锤）。
 *   - 程序化纹理：木纹 / 导轨刻度尺 / LCD 数字屏（实时刷新）/ 纸带点迹页 /
 *     量角器刻度盘 / 装置铭牌 —— CanvasTexture 矢量绘制 30+ 处。
 *   - 材质工艺：四级材质工厂（matCoat 烤漆 / matStd 金属分区 / matGlass 玻璃 /
 *     matGlow 状态灯）+ makeStudioEnvironment 程序化摄影棚反射。
 *   - 光照氛围：暖主光 + 冷补光 + 正面柔光 + 暖调棚拍背景（studio-warm）。
 *
 * 教学交互（原版功能块 1:1 对齐，文案全部自研改写）：
 *   - 纸带与 v-t 图：释放小车打点 → 计数点间距逐差法 / v-t 斜率双路算 a，
 *     纸带页放大镜看点迹，钩码质量改变再跑一遍。
 *   - 光电门测速度：两只光电门可在导轨上拖动摆位，数字计时器实时记 Δt，
 *     v=d/Δt、a=(v2²−v1²)/2L，挡光片宽度可换。
 *   - 自由落体：电磁铁释放 + 频闪残影 + 两光电门测 g；钢球/乒乓球/羽毛 +
 *     牛顿管抽真空对比，天体 g 三档。
 *   - 牛顿第二定律：平衡摩擦力 / 配重条 / 力传感器三开关，钩码 10~160 g，
 *     a–F 散点 + 最小二乘拟合直线，m 大时图线向下弯（T<mg 系统误差）。
 *   - 滑动摩擦力：电机匀速拉动，F-t 曲线找最大静摩擦峰值，四种接触面 +
 *     加砝码，f-N 分组拟合（斜率=μ）。
 *   - 斜面与力的分解：拖红色摇柄连续调倾角，G 分解箭头 / 静摩擦平衡 /
 *     临界角测定，加砝码再测临界角不变（与质量无关）。
 *   - 超重与失重：上行 / 下行 / 缆绳断开三方式，a-t 曲线对照台秤示数，
 *     完全失重时砝码"漂浮"。
 *   - 机械能守恒：气垫摆能量柱 Ek/Ep/E 此消彼长，关气垫泵后振幅衰减、
 *     内能 Q 增长。
 *   - 动量守恒：弹簧圈 / 橡胶块 / 魔术贴三种缓冲器，碰前碰后动量动能对比，
 *     小车可直接拖住甩出去发射。
 *   - 自由实验台：倾角摇柄 + 钩码 / 槽码盒（点击 ±10 g）+ 第二辆小车 +
 *     两只可拖光电门 + 打点计时器，自设计实验，轨迹数据导出 CSV。
 *
 * 全局：← → 切章 / 空格 开始暂停 / R 复位视角 / ] 数据坞 / F 全屏 /
 *       ↺ 复位实验 / 受力分析 / 频闪残影 / 慢动作 ¼× ⅒× / 音效 / 回放 /
 *       记录数据 / 导出 CSV / 画质优先与流畅度优先切换 / 大屏课堂模式。
 * =====================================================================
 */
import {
  THREE, clamp,
  createApp, makeLoader, createControlsPanel, makeHUD, makeTextSprite, setSpriteText,
} from './edu-core.js';
import {
  attachVFX, PAL,
  matCoat, matStd, matGlass, matGlow,
  makeStudioEnvironment, makeWoodTexture, makeLabelTexture,
} from './edu-vfx.js';

/* ---------------- 场景与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在布置力学实验台…');
const app = createApp({
  container: stage,
  fov: 40, near: 0.1, far: 400,
  cameraPos: [0.6, 4.4, 10.6], target: [0, 1.4, 0],
  minDistance: 1.5, maxDistance: 60,
  exposure: 1.05,
  keepBackground: true,
});
const { scene } = app;
const vfx = attachVFX(app, 'illus', { bg: 'studio-warm' });
scene.environment = makeStudioEnvironment(app.renderer);

/* 灯光：暖主光 + 冷补光 + 正面柔光（金属烤漆的高光走向靠这三层） */
const keyLight = new THREE.DirectionalLight(0xffe4c4, 1.3);
keyLight.position.set(6.5, 11, 7);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xcfe0ff, 0.45);
fillLight.position.set(-8, 6, -5);
scene.add(fillLight);
const frontLight = new THREE.DirectionalLight(0xf2f6ff, 0.32);
frontLight.position.set(0, 3.4, 9);
scene.add(frontLight);
scene.add(new THREE.AmbientLight(0x9aa0a8, 0.4));

/* ---------------- 色族（全部从 PAL 取色；派生档用 Color 运算生成） ---------------- */

const tone = (hex, mul) => {
  const c = new THREE.Color(hex);
  c.multiplyScalar(mul);
  return c.getHex();
};
const CV = {
  steel: PAL.steel,
  steelDeep: tone(PAL.steel, 0.4),
  chrome: PAL.centriole,
  brass: PAL.brass,
  paintBlue: PAL.cytosol,           // 装置烤漆蓝
  paintBlueHi: PAL.cytosolLit,
  paintCream: PAL.starch,           // 装置烤漆米白
  paintOrange: PAL.mitoShell,       // 警示橙（摇柄 / 缓冲橡胶底）
  cartA: PAL.vacuole,               // 小车 A 蓝
  cartB: PAL.golgiHi,               // 小车 B 橙
  rubber: tone(PAL.ink, 6),         // 深橡胶
  benchWood: PAL.membraneDeep,
  trackTop: tone(PAL.steel, 1.25),
  led: 0x39d353,                    // 光电门状态绿
  ledHot: 0xffc93a,                 // 触发黄
  lcd: PAL.stroma,                  // LCD 底
  arrowF: PAL.golgiHi,              // 拉力箭头（暖黄）
  arrowG: PAL.vacuole,              // 重力箭头（蓝）
  arrowN: PAL.lysosome,             // 支持力/分力箭头（洋红）
  arrowFr: PAL.mitoInner,           // 摩擦箭头（深红橙）
  ok: PAL.stroma,
  warn: PAL.mitoShell,
};
const cssHex = (key, mul = 1) => '#' + new THREE.Color(CV[key]).multiplyScalar(mul).getHexString();

/* ---------------- 通用工具 ---------------- */

const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
const box = (w, h, d, mat) => mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 20) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, t) => a + (b - a) * t;
const DEG = Math.PI / 180;
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
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
/* 材质缓存：同一外观全局复用，省 draw call 与内存 */
const MX = {};
function mx(key, make) { if (!MX[key]) MX[key] = make(); return MX[key]; }

/* 同属性集（position/normal/uv + 索引）索引几何拼接，本地实现免引 BufferGeometryUtils */
function mergeGeoms(geos) {
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

/* 静态家具合并：台面/道具/导轨等不动件按材质 bake 世界矩阵后 merge，
   砍 draw call（V3 硬线 <200）。可动件（小车/光电门/挂钩等）不在此类 builder 里，不受影响。 */
function mergeStatics(root) {
  root.updateWorldMatrix(true, true);
  const byMat = new Map();
  const victims = [];
  root.traverse((o) => {
    if (!o.isMesh || o.userData.noMerge) return;
    for (let p = o.parent; p && p !== root; p = p.parent) if (p.userData.dynamic) return;
    victims.push(o);
  });
  if (victims.length < 2) return root;
  for (const m of victims) {
    const geo = m.geometry.clone().applyMatrix4(m.matrixWorld);
    const key = m.material.uuid;
    if (!byMat.has(key)) byMat.set(key, { mat: m.material, geos: [], order: 0 });
    const bucket = byMat.get(key);
    bucket.geos.push(geo);
    bucket.order = Math.max(bucket.order, m.renderOrder);
  }
  const merged = new THREE.Group();
  merged.name = 'statics-merged';
  for (const { mat, geos, order } of byMat.values()) {
    let geo = null;
    try { geo = geos.length > 1 ? mergeGeoms(geos) : geos[0]; } catch (e) { geo = null; }
    if (!geo) { /* 属性集不兼容等异常：原样退回，不打断建场 */ }
    else {
      const m = new THREE.Mesh(geo, mat);
      m.renderOrder = order;
      merged.add(m);
    }
  }
  for (const v of victims) v.parent.remove(v);
  root.add(merged);
  return root;
}

function label(text, color = '#ffe9cf', scale = 0.005) {
  return makeTextSprite(text, { fontSize: 34, color, scale, bg: 'rgba(15,20,26,0.62)' });
}
function retext(sprite, text, color = '#ffe9cf', scale = 0.005) {
  setSpriteText(sprite, text, { fontSize: 34, color, scale, bg: 'rgba(15,20,26,0.62)' });
}

/* 接触阴影贴片（烘焙式椭圆暗斑，避免实时阴影开销） */
function shadowBlob(radius = 1.4, alpha = 0.34) {
  const { tex } = mx('blobTex' + alpha, () => canvasTex(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
    g.addColorStop(0, 'rgba(8,10,14,1)');
    g.addColorStop(0.55, 'rgba(8,10,14,0.42)');
    g.addColorStop(1, 'rgba(8,10,14,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  }, { linear: true }));
  const mat = mx('blobMat' + alpha, () => new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: alpha, depthWrite: false }));
  const m = mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}

/* 力箭头（杆 + 锥头 + 可换文字标签） */
function makeArrow(color) {
  const g = new THREE.Group();
  const hex = '#' + new THREE.Color(color).getHexString();
  const mat = new THREE.MeshBasicMaterial({ color });
  const shaft = mesh(new THREE.CylinderGeometry(0.042, 0.042, 1, 10), mat);
  shaft.geometry.translate(0, 0.5, 0);
  const head = mesh(new THREE.ConeGeometry(0.12, 0.28, 12), mat);
  g.add(shaft, head);
  const lb = label('', hex, 0.0058);
  g.add(lb);
  const up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), dir = new THREE.Vector3();
  g.set = (from, to, text) => {
    dir.subVectors(to, from);
    const len = Math.max(dir.length(), 0.01);
    q.setFromUnitVectors(up, dir.clone().normalize());
    g.quaternion.copy(q);
    g.position.copy(from);
    shaft.scale.y = Math.max(len - 0.26, 0.05);
    head.position.y = len - 0.14;
    g.visible = true;
    if (text !== undefined) retext(lb, text, hex, 0.0058);
    lb.position.set(0, len + 0.3, 0);
  };
  g.hide = () => { g.visible = false; };
  return g;
}

/* 尺寸标注线（双端短须 + 中点文字） */
function makeDim(color) {
  const g = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color });
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V3(0, 0, 0), V3(1, 0, 0)]), mat);
  const lb = label('', '#' + new THREE.Color(color).getHexString(), 0.0045);
  g.add(line, lb);
  g.set = (x1, x2, y, z, text) => {
    line.geometry.setFromPoints([V3(x1, y, z), V3(x2, y, z)]);
    lb.position.set((x1 + x2) / 2, y + 0.16, z);
    if (text !== undefined) retext(lb, text, '#' + new THREE.Color(color).getHexString(), 0.0045);
    g.visible = true;
  };
  g.hide = () => { g.visible = false; };
  return g;
}

/* 绳（两点张紧圆柱） */
function makeRope(color = CV.benchWood, thick = 0.02) {
  const m = mesh(new THREE.CylinderGeometry(thick, thick, 1, 8), mx('rope', () => matStd(CV.benchWood, { roughness: 0.9 })));
  m.geometry.translate(0, 0.5, 0);
  const d = new THREE.Vector3();
  m.set = (p1, p2) => {
    d.subVectors(p2, p1);
    m.position.copy(p1);
    m.scale.set(1, Math.max(d.length(), 0.01), 1);
    m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
  };
  return m;
}

/* 弹簧（螺旋管，压紧时圈距变密） */
function makeSpring(len = 0.3, r = 0.05, coils = 7, thick = 0.014, color = CV.chrome) {
  const pts = [];
  for (let i = 0; i <= coils * 10; i++) {
    const t = i / (coils * 10);
    pts.push(V3(Math.cos(t * coils * Math.PI * 2) * r, t * len, Math.sin(t * coils * Math.PI * 2) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const m = mesh(new THREE.TubeGeometry(curve, coils * 12, thick, 8, false), mx('spring', () => matStd(CV.chrome, { roughness: 0.25, metalness: 0.85 })));
  m.userData.len = len;
  m.setLen = (l) => {
    m.scale.y = l / m.userData.len;
  };
  return m;
}

/* 摇柄卷筒（斜面 / 实验台的红色调节摇柄） */
function makeCrank(color = CV.paintOrange) {
  const g = new THREE.Group();
  const drum = cyl(0.09, 0.09, 0.14, mx('crankDrum', () => matStd(0x8a4a28, { roughness: 0.5, metalness: 0.3 })), 14);
  drum.rotation.x = Math.PI / 2;
  g.add(drum);
  for (let i = 0; i < 2; i++) {
    const rib = box(0.19, 0.02, 0.03, mx('crankRib', () => matStd(CV.chrome, { roughness: 0.3, metalness: 0.8 })));
    rib.position.z = i === 0 ? 0.075 : -0.075;
    g.add(rib);
  }
  const arm = box(0.035, 0.22, 0.035, mx('crankArm', () => matStd(color, { roughness: 0.35, metalness: 0.15 })));
  arm.position.set(0.11, 0.1, 0.12);
  g.add(arm);
  const knob = mesh(new THREE.SphereGeometry(0.045, 12, 10), matCoat(color, { roughness: 0.3 }));
  knob.position.set(0.11, 0.22, 0.12);
  g.add(knob);
  return g;
}

/* ---------------- 程序化纹理 ---------------- */

/* 导轨正面刻度尺：厘米格 + 每 10 cm 大格数字（0 起点可指定） */
function rulerTexture(lenM = 10, tickEvery = 0.1) {
  const W = 2048, H = 128;
  return canvasTex(W, H, (ctx, w, h) => {
    ctx.fillStyle = '#232a32';
    ctx.fillRect(0, 0, w, h);
    const px = w / lenM;
    ctx.textAlign = 'center';
    for (let m = 0; m <= lenM; m += tickEvery) {
      const x = m * px;
      const major = Math.round(m / 1) === m / 1;
      ctx.strokeStyle = major ? '#d8e0ea' : '#8a96a4';
      ctx.lineWidth = major ? 5 : 2.4;
      ctx.beginPath();
      ctx.moveTo(x, h * (major ? 0.34 : 0.6));
      ctx.lineTo(x, h * 0.94);
      ctx.stroke();
      if (major) {
        ctx.fillStyle = '#d8e0ea';
        ctx.font = '600 34px -apple-system, sans-serif';
        ctx.fillText(String(m), x, h * 0.3);
      }
    }
  });
}

/* LCD 数字屏（实时刷新：主行 + 两小行） */
function makeLcd(w = 256, h = 128, main = '0.000', sub = ['—', '—']) {
  const state = { main, sub };
  const t = canvasTex(w, h, (ctx) => paint(ctx, w, h, state), { bg: '#0d1a14', linear: true });
  function paint(ctx, cw, ch) {
    ctx.fillStyle = '#0d1a14';
    ctx.fillRect(0, 0, cw, ch);
    /* 扫描线肌理 */
    ctx.fillStyle = 'rgba(120,255,190,0.03)';
    for (let y = 0; y < ch; y += 4) ctx.fillRect(0, y, cw, 2);
    ctx.fillStyle = '#4dffa0';
    ctx.textAlign = 'center';
    ctx.font = '700 52px ui-monospace, Menlo, monospace';
    ctx.fillText(state.main, cw / 2, ch * 0.46);
    ctx.font = '400 24px ui-monospace, Menlo, monospace';
    ctx.fillStyle = '#2fae72';
    ctx.textAlign = 'left';
    ctx.fillText(state.sub[0] ?? '', 12, ch * 0.74);
    ctx.textAlign = 'right';
    ctx.fillText(state.sub[1] ?? '', cw - 12, ch * 0.74);
  }
  return {
    tex: t.tex,
    set(main2, s1, s2) {
      state.main = main2;
      if (s1 !== undefined) state.sub[0] = s1;
      if (s2 !== undefined) state.sub[1] = s2;
      paint(t.ctx, w, h);
      t.tex.needsUpdate = true;
    },
  };
}

/* 量角器背板刻度盘（0-60° 弧 + 主刻度数字） */
function protractorTexture(maxDeg = 60) {
  const S = 512;
  return canvasTex(S, S, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(240,236,222,0.92)';
    ctx.fillRect(0, 0, w, h);
    const cx = w * 0.5, cy = h * 0.92, R = w * 0.78;
    ctx.strokeStyle = '#5a4630';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, R, Math.PI + 60 * DEG * -1 + Math.PI, Math.PI + 0);
    ctx.stroke();
    ctx.textAlign = 'center';
    for (let d = 0; d <= maxDeg; d += 5) {
      const a = Math.PI - d * DEG;
      const major = d % 10 === 0;
      const r1 = R * (major ? 0.9 : 0.95);
      ctx.strokeStyle = major ? '#5a4630' : '#9a8462';
      ctx.lineWidth = major ? 5 : 2.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R * 0.985, cy - Math.sin(a) * R * 0.985);
      ctx.lineTo(cx + Math.cos(a) * r1, cy - Math.sin(a) * r1);
      ctx.stroke();
      if (major) {
        ctx.fillStyle = '#5a4630';
        ctx.font = '700 30px -apple-system, sans-serif';
        ctx.fillText(String(d), cx + Math.cos(a) * R * 0.8, cy - Math.sin(a) * R * 0.8 + 10);
      }
    }
    ctx.fillStyle = '#8a4030';
    ctx.font = '600 34px -apple-system, sans-serif';
    ctx.fillText('θ', cx - R * 0.62, cy - 12);
  });
}

/* 装置铭牌（名称 + 型号小字） */
function nameplate(lines, accent = '#8a4030', w = 256, h = 128) {
  return makeLabelTexture(lines, { w, h, accent });
}

/* 木纹台面 + 侧面包边 */
function benchTopMaterial() {
  return mx('benchTop', () => {
    const m = matStd(0xffffff, { roughness: 0.62 });
    m.map = makeWoodTexture({ base: '#8a6138', dark: '#5f3d20', light: '#a37b4e', seed: 23, streaks: 120, bands: 8 });
    return m;
  });
}

/* ---------------- 共享装置：实验台 ---------------- */

const BENCH_Y = 1.02;   // 台面高度

function buildBench(gOut, len = 12, withProps = true) {
  const g = new THREE.Group();   // 静态家具子组：建完按材质合并，砍 draw call
  const topM = benchTopMaterial();
  const top = box(len, 0.14, 3.2, topM);
  top.position.y = BENCH_Y;
  g.add(top);
  /* 台面前后钢包边 */
  const trimM = mx('trim', () => matStd(CV.steelDeep, { roughness: 0.4, metalness: 0.6 }));
  [-1.63, 1.63].forEach((z) => {
    const trim = box(len, 0.05, 0.06, trimM);
    trim.position.set(0, BENCH_Y - 0.02, z);
    g.add(trim);
  });
  /* 钢框架腿 + 横梁 + 可调脚杯 */
  const legM = mx('leg', () => matStd(CV.steelDeep, { roughness: 0.5, metalness: 0.55 }));
  const footM = mx('foot', () => matStd(0x1a1e24, { roughness: 0.9 }));
  for (let i = 0; i <= 3; i++) {
    const x = -len / 2 + 0.7 + (i * (len - 1.4)) / 3;
    [-1.1, 1.1].forEach((z) => {
      const leg = box(0.14, BENCH_Y - 0.07, 0.14, legM);
      leg.position.set(x, (BENCH_Y - 0.07) / 2, z);
      g.add(leg);
      const cup = cyl(0.09, 0.075, 0.07, footM, 12);
      cup.position.set(x, 0.035, z);
      g.add(cup);
    });
  }
  [-1.1, 1.1].forEach((z) => {
    const beam = box(len - 1.2, 0.07, 0.07, legM);
    beam.position.set(0, 0.4, z);
    g.add(beam);
  });
  /* 台面底裙板（避免看到穿帮） */
  const skirt = box(len - 0.4, 0.3, 2.7, mx('skirt', () => matStd(tone(CV.steelDeep, 0.7), { roughness: 0.7 })));
  skirt.position.y = BENCH_Y - 0.24;
  g.add(skirt);

  if (withProps) buildBenchProps(g, len);
  mergeStatics(g);
  gOut.add(g);
  return top;
}

/* 台面道具阵列：槽码盒 / 砝码架 / 抽屉柜 / 电缆桥架（语境道具，带接触阴影） */
function buildBenchProps(gOut, len) {
  const g = gOut;   // 直接并入台面静态子组，由 buildBench 统一 merge
  const rnd = mulberry32(41);
  /* 槽码盒：铝盒 + 铰链盖，10 g 槽码一排 */
  const boxG = new THREE.Group();
  const caseM = matCoat(0xb8bcc4, { roughness: 0.32, metalness: 0.5 });
  const base = box(0.42, 0.09, 0.3, caseM);
  base.position.y = 0.045;
  boxG.add(base);
  const lid = box(0.42, 0.02, 0.3, caseM);
  lid.position.set(-0.06, 0.105, -0.14);
  lid.rotation.x = -1.9;
  boxG.add(lid);
  const slotM = matStd(CV.steel, { roughness: 0.35, metalness: 0.7 });
  for (let i = 0; i < 4; i++) {
    const slot = box(0.07, 0.028, 0.24, slotM);
    slot.position.set(-0.12 + i * 0.09, 0.104, 0.01);
    slot.rotation.z = 0.06;
    boxG.add(slot);
  }
  const slotLbl = mesh(new THREE.PlaneGeometry(0.3, 0.11), new THREE.MeshBasicMaterial({ map: nameplate(['槽码 10g×4', '误差 ±0.2g'], '#4a5560', 256, 96), transparent: false }));
  slotLbl.position.set(0.02, 0.001, 0.16);
  slotLbl.rotation.x = -Math.PI / 2;
  boxG.add(slotLbl);
  boxG.position.set(len / 2 - 1.2, BENCH_Y + 0.07, -1.0);
  boxG.rotation.y = -0.5;
  g.add(boxG);
  const sh = shadowBlob(0.5, 0.3);
  sh.position.set(boxG.position.x, BENCH_Y + 0.003, boxG.position.z);
  g.add(sh);
  /* 砝码架：立柱 + 托盘 + 三只砝码 */
  const rack = new THREE.Group();
  const post = cyl(0.02, 0.024, 0.34, slotM, 10);
  post.position.y = 0.17;
  rack.add(post);
  const plate = cyl(0.11, 0.13, 0.02, slotM, 16);
  plate.position.y = 0.02;
  rack.add(plate);
  const wtM = matStd(CV.brass, { roughness: 0.35, metalness: 0.75 });
  [0.055, 0.043, 0.032].forEach((r, i) => {
    const w = cyl(r, r * 0.92, 0.05 - i * 0.008, wtM, 18);
    w.position.set((i - 1) * 0.11, 0.05 + 0.024, 0);
    w.userData.knob = cyl(r * 0.4, r * 0.4, 0.03, wtM, 10);
    w.userData.knob.position.y = 0.028;
    w.add(w.userData.knob);
    rack.add(w);
  });
  rack.position.set(len / 2 - 2.1, BENCH_Y + 0.07, -1.05);
  rack.rotation.y = 0.4;
  g.add(rack);
  const sh2 = shadowBlob(0.42, 0.28);
  sh2.position.set(rack.position.x, BENCH_Y + 0.003, rack.position.z);
  g.add(sh2);
  /* 台面下抽屉柜（左端） */
  const drawer = box(1.1, 0.5, 2.4, mx('drawer', () => matStd(tone(PAL.starch, 0.9), { roughness: 0.55 })));
  drawer.position.set(-len / 2 + 0.9, BENCH_Y - 0.42, 0);
  g.add(drawer);
  for (let i = 0; i < 3; i++) {
    const face = box(1.0, 0.13, 0.02, mx('drawerFace', () => matStd(tone(PAL.starch, 1.08), { roughness: 0.5 })));
    face.position.set(-len / 2 + 0.9, BENCH_Y - 0.28 - i * 0.16, 1.22);
    g.add(face);
    const handle = box(0.2, 0.02, 0.03, slotM);
    handle.position.set(-len / 2 + 0.9, BENCH_Y - 0.28 - i * 0.16 + 0.03, 1.24);
    g.add(handle);
  }
}

/* ---------------- 共享装置：气垫导轨 ---------------- */

function buildAirTrack(g, { len = 9, y = BENCH_Y + 0.24, holes = true } = {}) {
  const grp = new THREE.Group();
  /* 导轨主体：铝型材方管（顶面 + 正面刻度） */
  const sideM = matStd(CV.trackTop, { roughness: 0.28, metalness: 0.75 });
  const rail = box(len, 0.1, 0.18, sideM);
  rail.position.y = y;
  grp.add(rail);
  const face = mesh(new THREE.PlaneGeometry(len, 0.1), new THREE.MeshBasicMaterial({ map: rulerTexture(len).tex }));
  face.position.set(0, y, 0.091);
  grp.add(face);
  /* 顶面出气孔排（两排小孔贴图） */
  if (holes) {
    const { tex } = canvasTex(1024, 64, (ctx, w, h) => {
      ctx.fillStyle = '#39424e';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#10151b';
      for (let x = 10; x < w; x += 22) {
        ctx.beginPath(); ctx.arc(x, h * 0.32, 3.2, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 11, h * 0.68, 3.2, 0, 7); ctx.fill();
      }
    }, { repeat: [len / 2, 1], linear: true });
    const topFace = mesh(new THREE.PlaneGeometry(len, 0.18), new THREE.MeshBasicMaterial({ map: tex }));
    topFace.rotation.x = -Math.PI / 2;
    topFace.position.set(0, y + 0.0505, 0);
    grp.add(topFace);
  }
  /* 底座梁 + 支腿脚杯 */
  const baseM = matStd(CV.steelDeep, { roughness: 0.5, metalness: 0.5 });
  const base = box(len - 0.5, 0.06, 0.34, baseM);
  base.position.y = y - 0.13;
  grp.add(base);
  const footM = mx('foot', () => matStd(0x1a1e24, { roughness: 0.9 }));
  for (let i = 0; i <= 2; i++) {
    const x = -len / 2 + 0.8 + (i * (len - 1.6)) / 2;
    const leg = cyl(0.035, 0.045, y - BENCH_Y - 0.1, baseM, 10);
    leg.position.set(x, (y - BENCH_Y - 0.1) / 2 + BENCH_Y, 0.12);
    grp.add(leg);
    const foot = cyl(0.06, 0.05, 0.05, footM, 12);
    foot.position.set(x, BENCH_Y + 0.026, 0.12);
    grp.add(foot);
  }
  /* 两端端盖缓冲（弹簧碰头） */
  const endM = matStd(CV.paintOrange, { roughness: 0.5 });
  [-len / 2 + 0.06, len / 2 - 0.06].forEach((x) => {
    const cap = box(0.09, 0.11, 0.2, endM);
    cap.position.set(x, y, 0);
    grp.add(cap);
  });
  /* 导轨整体阴影 */
  const sh = shadowBlob(len * 0.62, 0.3);
  sh.scale.set(1.25, 0.5, 1);
  sh.position.set(0, BENCH_Y + 0.004, 0);
  grp.add(sh);
  mergeStatics(grp);
  g.add(grp);
  return grp;
}

/* ---------------- 共享装置：气垫小车 ---------------- */

function buildCart(g, color = CV.cartA, { withFlag = true, withHook = true } = {}) {
  const grp = new THREE.Group();
  const paint = matCoat(color, { roughness: 0.3, clearcoatRoughness: 0.2, metalness: 0.1 });
  /* 车身：主壳 + 顶部载物板 + 前后弧形缓冲头 */
  const body = box(0.62, 0.12, 0.26, paint);
  body.position.y = 0.09;
  grp.add(body);
  const nose1 = mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.26, 12), paint);
  nose1.rotation.x = Math.PI / 2;
  nose1.position.set(0.31, 0.09, 0);
  grp.add(nose1);
  const nose2 = nose1.clone();
  nose2.position.x = -0.31;
  grp.add(nose2);
  const deck = box(0.5, 0.025, 0.22, matStd(CV.steel, { roughness: 0.35, metalness: 0.6 }));
  deck.position.y = 0.162;
  grp.add(deck);
  /* 气膜裙边（深色条） */
  const skirt = box(0.6, 0.03, 0.27, mx('cSkirt', () => matStd(0x1c2126, { roughness: 0.95 })));
  skirt.position.y = 0.026;
  grp.add(skirt);
  /* 侧鳍把手 */
  [-1, 1].forEach((s) => {
    const fin = box(0.16, 0.05, 0.02, paint);
    fin.position.set(0.12, 0.09, s * 0.145);
    grp.add(fin);
  });
  if (withFlag) {
    /* 挡光片：立柱 + 黑刃 */
    const post = cyl(0.012, 0.012, 0.2, mx('cPost', () => matStd(CV.chrome, { roughness: 0.3, metalness: 0.8 })), 8);
    post.position.set(-0.18, 0.26, 0);
    grp.add(post);
    const blade = box(0.014, 0.1, 0.16, mx('blade', () => matStd(0x14171b, { roughness: 0.6 })));
    blade.position.set(-0.18, 0.36, 0);
    grp.add(blade);
  }
  if (withHook) {
    const hook = mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 14, Math.PI * 1.3), mx('cHook', () => matStd(CV.chrome, { roughness: 0.3, metalness: 0.85 })));
    hook.rotation.z = Math.PI / 2;
    hook.rotation.y = Math.PI / 2;
    hook.position.set(0.34, 0.09, 0);
    grp.add(hook);
  }
  /* 车身阴影 */
  const sh = shadowBlob(0.62, 0.32);
  sh.scale.set(1.1, 0.5, 1);
  grp.add(sh);
  g.add(grp);
  return grp;
}

/* ---------------- 共享装置：光电门 ---------------- */

function buildGate(g, { withPost = true } = {}) {
  const grp = new THREE.Group();
  const frameM = mx('gateFrame', () => matStd(tone(PAL.starch, 0.85), { roughness: 0.4, metalness: 0.2 }));
  if (withPost) {
    const post = cyl(0.02, 0.026, 0.34, matStd(CV.steelDeep, { roughness: 0.45, metalness: 0.5 }), 10);
    post.position.set(0, 0.17, 0.14);
    grp.add(post);
    const clampC = cyl(0.034, 0.034, 0.05, matStd(CV.steelDeep, { roughness: 0.4, metalness: 0.6 }), 12);
    clampC.position.set(0, 0.06, 0.14);
    grp.add(clampC);
  }
  /* U 型门架：上臂 + 下臂，各端头装发射/接收头 */
  const armT = box(0.045, 0.045, 0.3, frameM);
  armT.position.set(0, 0.34, 0.02);
  grp.add(armT);
  const armB = box(0.045, 0.045, 0.3, frameM);
  armB.position.set(0, 0.1, 0.02);
  grp.add(armB);
  /* 发射头（带凸透镜）/ 接收头 */
  const lensM = matGlass(0xcfe4ee, { roughness: 0.1, transmission: 0.7, thickness: 0.1 });
  [-0.15, 0.15].forEach((z, i) => {
    const head = cyl(0.028, 0.032, 0.05, matStd(0x2a3138, { roughness: 0.5 }), 12);
    head.rotation.x = Math.PI / 2;
    head.position.set(0, i === 0 ? 0.34 : 0.1, z + (i === 0 ? 0.12 : -0.12));
    grp.add(head);
    const lens = cyl(0.02, 0.02, 0.008, lensM, 12);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(head.position.x, head.position.y, head.position.z + (z > 0 ? 0.028 : -0.028));
    grp.add(lens);
  });
  /* 状态灯（触发时闪黄） */
  const ledM = new THREE.MeshStandardMaterial({ color: CV.led, emissive: new THREE.Color(CV.led), emissiveIntensity: 0.9, roughness: 0.4 });
  const led = mesh(new THREE.SphereGeometry(0.02, 10, 8), ledM);
  led.position.set(0, 0.42, 0.1);
  grp.add(led);
  /* 电缆（悬链线管） */
  const cable = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    V3(0, 0.42, 0.16), V3(0.1, 0.3, 0.24), V3(0.12, 0.14, 0.3), V3(0.1, 0.05, 0.34),
  ]), 12, 0.008, 6, false), mx('cable', () => matStd(0x23282e, { roughness: 0.85 })));
  grp.add(cable);
  grp.userData.led = ledM;
  const sh = shadowBlob(0.4, 0.26);
  sh.position.set(0, BENCH_Y + 0.003, 0.14);
  grp.add(sh);
  g.add(grp);
  return grp;
}
function flashGate(gate) {
  const led = gate.userData.led;
  if (!led) return;
  led.color.set(CV.ledHot);
  led.emissive.set(CV.ledHot);
  led.emissiveIntensity = 1.6;
  setTimeout(() => {
    led.color.set(CV.led);
    led.emissive.set(CV.led);
    led.emissiveIntensity = 0.9;
  }, 160);
  sfx('beep');
}

/* ---------------- 共享装置：钩码挂架 + 砝码 ---------------- */

function buildHanger(g) {
  const grp = new THREE.Group();
  const hookM = matStd(CV.chrome, { roughness: 0.3, metalness: 0.85 });
  const hook = mesh(new THREE.TorusGeometry(0.035, 0.01, 8, 16, Math.PI * 1.4), hookM);
  hook.position.y = 0.03;
  grp.add(hook);
  const stem = cyl(0.008, 0.008, 0.1, hookM, 8);
  stem.position.y = -0.02;
  grp.add(stem);
  const pan = cyl(0.085, 0.075, 0.02, matStd(CV.steel, { roughness: 0.4, metalness: 0.6 }), 16);
  pan.position.y = -0.08;
  grp.add(pan);
  /* 钩码堆（按质量显示数量） */
  const weights = new THREE.Group();
  const wtM = matStd(0x8f9aa6, { roughness: 0.4, metalness: 0.7 });
  grp.add(weights);
  grp.userData.weights = weights;
  const sh = shadowBlob(0.3, 0.26);
  grp.add(sh);
  g.add(grp);
  return grp;
}
/* 挂架上的钩码（每枚 10 g，圆柱 + 顶部提环） */
function setHangerMass(hanger, grams) {
  const ws = hanger.userData.weights;
  while (ws.children.length) ws.remove(ws.children[0]);
  const n = Math.round(grams / 10);
  for (let i = 0; i < n; i++) {
    const r = 0.052 - Math.min(i * 0.004, 0.02);
    const w = cyl(r, r * 0.94, 0.032, matStd(0x8f9aa6, { roughness: 0.4, metalness: 0.7 }), 14);
    w.position.y = -0.11 - i * 0.034;
    const ring = mesh(new THREE.TorusGeometry(0.016, 0.005, 6, 10), matStd(CV.chrome, { roughness: 0.3, metalness: 0.85 }));
    ring.position.y = 0.02;
    w.add(ring);
    ws.add(w);
  }
  ws.visible = n > 0;
}

/* ---------------- 音效（WebAudio 极简合成） ---------------- */

const SND = { on: true, ctx: null };
function sfx(kind) {
  if (!SND.on) return;
  try {
    SND.ctx = SND.ctx || new (window.AudioContext || window.webkitAudioContext)();
    const c = SND.ctx;
    if (c.state === 'suspended') c.resume();
    const t0 = c.currentTime;
    const o = c.createOscillator();
    const gn = c.createGain();
    o.connect(gn); gn.connect(c.destination);
    const P = {
      click: [660, 0.05, 'sine', 0.05],
      beep: [988, 0.08, 'square', 0.035],
      thud: [110, 0.16, 'sawtooth', 0.09],
      clack: [520, 0.07, 'triangle', 0.07],
      snap: [1400, 0.05, 'sine', 0.05],
    }[kind] || [440, 0.06, 'sine', 0.04];
    o.type = P[2];
    o.frequency.setValueAtTime(P[0], t0);
    if (kind === 'clack') o.frequency.exponentialRampToValueAtTime(240, t0 + P[1]);
    if (kind === 'thud') o.frequency.exponentialRampToValueAtTime(60, t0 + P[1]);
    gn.gain.setValueAtTime(P[3], t0);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + P[1]);
    o.start(t0); o.stop(t0 + P[1] + 0.02);
  } catch (e) { /* 音频不可用时静默 */ }
}

/* ---------------- 指针拖拽系统（光电门摆位 / 摇柄 / 小车甩出） ---------------- */

const ray = new THREE.Raycaster();
const ptrNdc = new THREE.Vector2();
let dragItem = null;
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const dragHit = new THREE.Vector3();
const dragItems = [];
function registerDrag(item) { dragItems.push(item); return item; }
function clearDrags() { dragItems.length = 0; }

function pickDraggable(ev) {
  const r = app.dom.getBoundingClientRect();
  ptrNdc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptrNdc, app.camera);
  for (const it of dragItems) {
    if (!it.group.visible) continue;
    const hit = ray.intersectObject(it.hitMesh || it.group, true);
    if (hit.length) return { it, hit: hit[0] };
  }
  return null;
}
app.dom.addEventListener('pointerdown', (ev) => {
  if (ev.button !== 0) return;
  const p = pickDraggable(ev);
  if (!p) return;
  dragItem = p.it;
  app.controls.enabled = false;
  app.dom.classList.add('grab');
  if (dragItem.kind === 'fling') {
    dragItem.samples = [{ t: performance.now(), x: ev.clientX }];
    dragItem.grabOffset = p.hit.point.x - (dragItem.follow ? dragItem.follow().x : 0);
  }
  dragPlane.constant = -(p.hit.point.y);
  if (dragItem.onStart) dragItem.onStart(p.hit.point);
});
app.dom.addEventListener('pointermove', (ev) => {
  if (!dragItem) return;
  const r = app.dom.getBoundingClientRect();
  ptrNdc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptrNdc, app.camera);
  if (dragItem.kind === 'knob') {
    if (dragItem.onDrag) dragItem.onDrag(ev.movementX || 0);
    return;
  }
  if (ray.ray.intersectPlane(dragPlane, dragHit)) {
    if (dragItem.kind === 'x') {
      if (dragItem.onDrag) dragItem.onDrag(dragHit.x);
    } else if (dragItem.kind === 'fling') {
      dragItem.samples.push({ t: performance.now(), x: ev.clientX });
      if (dragItem.samples.length > 6) dragItem.samples.shift();
      if (dragItem.onDrag) dragItem.onDrag(dragHit.x - (dragItem.grabOffset || 0));
    }
  }
});
window.addEventListener('pointerup', () => {
  if (!dragItem) return;
  const it = dragItem;
  dragItem = null;
  app.controls.enabled = true;
  app.dom.classList.remove('grab');
  if (it.kind === 'fling' && it.onEnd) {
    let v = 0;
    const s = it.samples || [];
    if (s.length >= 2) {
      const a = s[0], b = s[s.length - 1];
      const dt = Math.max(b.t - a.t, 1) / 1000;
      v = (b.x - a.x) / dt;   // 屏幕像素速度
      v = clamp(v * 0.0022, -3.2, 3.2);   // 像素速度 → 场景速度
    }
    it.onEnd(v);
  } else if (it.onEnd) it.onEnd();
});

/* ---------------- 场景注册（懒建 + 单显） ---------------- */

const scenes = {};
let activeScene = null;
function useScene(key, build) {
  if (activeScene && activeScene !== scenes[key]) activeScene.visible = false;
  if (!scenes[key]) {
    const g = new THREE.Group();
    g.visible = false;
    scene.add(g);
    scenes[key] = g;
  }
  const g = scenes[key];
  if (!g.userData.built) { clearDrags(); build(g); g.userData.built = true; }
  g.visible = true;
  activeScene = g;
  return g;
}

/* ---------------- 2D 图表基建（数据坞内画布） ---------------- */

const chartReg = {};   // key -> canvas
function mkChart(key, h = 168) {
  const wrap = document.getElementById('lcData');
  let cv = chartReg[key];
  if (cv && cv.isConnected) return cv;
  cv = document.createElement('canvas');
  cv.className = 'mot-chart';
  cv.width = 604; cv.height = h * 2;
  cv.style.height = h + 'px';
  cv.dataset.key = key;
  wrap.appendChild(cv);
  bindChartScrub(cv);
  chartReg[key] = cv;
  return cv;
}
function clearCharts() {
  scrubTipHide();
  for (const k of Object.keys(chartReg)) {
    const cv = chartReg[k];
    if (cv.isConnected) cv.remove();
    delete chartReg[k];
  }
}
function chartAxes(cv, { xl, yl, xmin = 0, xmax = 1, ymin = 0, ymax = 1 } = {}) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const st = getComputedStyle(document.documentElement);
  const grid = st.getPropertyValue('--card-border').trim() || 'rgba(140,150,165,0.4)';
  const fg = st.getPropertyValue('--text-faint').trim() || '#8892a0';
  ctx.clearRect(0, 0, W, H);
  const padL = 84, padR = 26, padT = 30, padB = 56;
  ctx.strokeStyle = grid; ctx.fillStyle = fg;
  ctx.lineWidth = 2;
  ctx.font = '20px -apple-system, sans-serif';
  const ox = padL, oy = H - padB, pw = W - padL - padR, ph = oy - padT;
  /* 横网格 */
  for (let i = 0; i <= 4; i++) {
    const y = padT + (ph * i) / 4;
    ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + pw, y); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.beginPath(); ctx.moveTo(ox, padT); ctx.lineTo(ox, oy); ctx.lineTo(ox + pw, oy);
  ctx.lineWidth = 3; ctx.stroke();
  ctx.font = '22px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(yl || '', 8, padT + 2);
  ctx.textAlign = 'right';
  ctx.fillText(xl || '', W - 8, oy + 34);
  /* 轴数值 */
  ctx.font = '19px ui-monospace, monospace';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const v = ymin + ((ymax - ymin) * (4 - i)) / 4;
    ctx.fillText(fmtNum(v), ox - 8, padT + (ph * i) / 4 + 7);
  }
  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i++) {
    const v = xmin + ((xmax - xmin) * i) / 4;
    ctx.fillText(fmtNum(v), ox + (pw * i) / 4, oy + 26);
  }
  return {
    ctx, ox, oy, pw, ph, xmin, xmax, ymin, ymax,
    x(v) { return ox + ((v - xmin) / (xmax - xmin || 1)) * pw; },
    y(v) { return oy - ((v - ymin) / (ymax - ymin || 1)) * ph; },
  };
}
function fmtNum(v) {
  const a = Math.abs(v);
  if (v === 0) return '0';
  if (a >= 100) return v.toFixed(0);
  if (a >= 10) return v.toFixed(1);
  return v.toFixed(2);
}
function chartLine(m, pts, color, w = 4, dash = null) {
  const { ctx } = m;
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.setLineDash(dash || []);
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(m.x(p[0]), m.y(p[1])) : ctx.moveTo(m.x(p[0]), m.y(p[1]))));
  ctx.stroke();
  ctx.setLineDash([]);
}
function chartDots(m, pts, color, r = 6, ring = false) {
  const { ctx } = m;
  ctx.fillStyle = color;
  pts.forEach((p) => {
    ctx.beginPath();
    ctx.arc(m.x(p[0]), m.y(p[1]), r, 0, 7);
    if (ring) { ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(m.x(p[0]), m.y(p[1]), r + 4, 0, 7); ctx.stroke(); }
    else ctx.fill();
  });
}
function chartText(m, text, x, y, color, size = 20, align = 'left') {
  const { ctx } = m;
  ctx.fillStyle = color;
  ctx.font = size + 'px -apple-system, sans-serif';
  ctx.textAlign = align;
  ctx.fillText(text, m.x(x), m.y(y));
}

/* ---------------- HUD 与数据坞（读数 / 测量记录 / CSV） ---------------- */

let hud = null;
function setHudRows(rows) {
  const wrap = document.getElementById('lcData');
  if (hud) { hud.el.remove(); hud = null; }
  clearCharts();
  if (rows && rows.length) {
    hud = makeHUD(wrap, rows);
    rows.forEach(([k]) => hud.set(k, '–'));
  }
  ensureLog(wrap);
}
function hset(key, text) { if (hud) hud.set(key, text); }

const REC = {};   // chapterId -> { cols, rows }
let logBox = null;
function ensureLog(wrap) {
  if (logBox && logBox.isConnected) {
    wrap.appendChild(logBox);
    updateLogButtons();
    return;
  }
  logBox = document.createElement('div');
  logBox.className = 'mot-log';
  logBox.innerHTML = `
    <div class="mot-log-head">测量记录<span class="log-count" id="logCount"></span>
      <span class="log-head-btns">
        <button class="log-btn" type="button" id="recBtn" title="把本次实验的读数记入下方表格">＋ 记录数据</button>
        <button class="log-btn" type="button" id="csvBtn" title="把表格另存为 CSV 文件，可导入表格软件">导出 CSV</button>
        <button class="log-btn" type="button" id="logClearBtn">清空</button>
      </span>
    </div>
    <div class="log-empty" id="logEmpty">还没有数据。自动记录的章节跑完即落一行；其余按「＋ 记录数据」。</div>
    <div class="log-scroll" id="logScroll" style="display:none"><table><thead id="logHead"></thead><tbody id="logBody"></tbody></table></div>
    <canvas class="mot-log-chart" id="logChart" width="604" height="340" style="display:none"></canvas>
    <div class="chart-note" id="chartNote" style="display:none"></div>`;
  logBox.querySelector('#logClearBtn').addEventListener('click', () => {
    const cur = window.__motionChapter;
    if (cur && REC[cur]) { REC[cur].rows = []; paintLog(cur); }
  });
  logBox.querySelector('#recBtn').addEventListener('click', () => {
    const cur = window.__motionChapter;
    const sec = SECTIONS.find((s) => s.id === cur);
    if (sec && sec.recFn) { sec.recFn(); sfx('click'); }
    else toast('本章无需手动记录：数据会自动写入。', 'ok');
  });
  logBox.querySelector('#csvBtn').addEventListener('click', exportCsv);
  wrap.appendChild(logBox);
  updateLogButtons();
}
function logSetCols(chapterId, cols) {
  const rec = REC[chapterId] || (REC[chapterId] = { cols, rows: [] });
  rec.cols = cols;
  paintLog(chapterId);
}
function logAddRow(chapterId, row, opts = {}) {
  const rec = REC[chapterId] || (REC[chapterId] = { cols: [], rows: [] });
  rec.rows.push({ row, bad: !!opts.bad });
  paintLog(chapterId);
}
function paintLog(chapterId) {
  const rec = REC[chapterId];
  if (!logBox || !rec) return;
  const head = logBox.querySelector('#logHead');
  const body = logBox.querySelector('#logBody');
  const empty = logBox.querySelector('#logEmpty');
  const scroll = logBox.querySelector('#logScroll');
  const count = logBox.querySelector('#logCount');
  if (!rec.rows.length) {
    scroll.style.display = 'none';
    empty.style.display = '';
    if (head) head.innerHTML = '';
    if (count) count.textContent = '';
  } else {
    empty.style.display = 'none';
    scroll.style.display = '';
    head.innerHTML = '<tr>' + rec.cols.map((c) => '<th>' + c + '</th>').join('') + '</tr>';
    body.innerHTML = rec.rows.map((r) => '<tr' + (r.bad ? ' class="bad"' : '') + '>' + r.row.map((v) => '<td>' + v + '</td>').join('') + '</tr>').join('');
    scroll.scrollTop = scroll.scrollHeight;
    count.textContent = rec.rows.length + ' 行';
  }
  const sec = SECTIONS.find((s) => s.id === chapterId);
  const chart = logBox.querySelector('#logChart');
  const note = logBox.querySelector('#chartNote');
  if (sec && sec.logChart) {
    chart.style.display = '';
    note.style.display = '';
    note.textContent = sec.logChartNote || '';
    sec.logChart(chart);
  } else {
    chart.style.display = 'none';
    note.style.display = 'none';
  }
}
function updateLogButtons() {
  if (!logBox || !logBox.isConnected) return;
  const cur = window.__motionChapter;
  const sec = SECTIONS.find((s) => s.id === cur);
  const recB = logBox.querySelector('#recBtn');
  if (recB) recB.style.display = sec && sec.recFn ? '' : 'none';
}
function exportCsv() {
  const cur = window.__motionChapter;
  const sec = SECTIONS.find((s) => s.id === cur);
  let lines = [];
  if (cur === 'free' && typeof sec.csvTrajectory === 'function') {
    lines = sec.csvTrajectory();
  } else {
    const rec = REC[cur];
    if (!rec || !rec.rows.length) { toast('暂无可导出的数据，先做一次实验。', 'warn'); return; }
    lines = [rec.cols.join(',')];
    rec.rows.forEach((r) => lines.push(r.row.join(',')));
  }
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'motion-' + cur + '-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('CSV 已导出。', 'ok');
}

/* ---------------- 全局运行态（空格 / 慢动作 / 残影 / 受力 / 回放） ---------------- */

let SPEED = 1;                 // 1 → 0.25 → 0.1 循环
const FORCES = { on: false };  // 受力分析开关
const STROBE = { on: true };   // 频闪残影开关
const REPLAY = { active: false, buf: null, t: 0, apply: null };
let runState = 'ready';        // ready | running | paused | done

const HINT_DONE = '实验结束：横向拖动数据坞的图表可逐帧回放刚才这一趟 · 空格 再来一次 · 或点「＋ 记录数据」留存';
function setStatus(st) {
  runState = st;
  const map = { ready: '就绪', running: '运行中', paused: '已暂停', done: '实验结束' };
  hset('st', map[st] || st);
  if (st === 'done' && hintEl.cur) hintEl.cur.textContent = HINT_DONE;
}
function spaceToggle() {
  if (REPLAY.active) { REPLAY.active = false; toast('回放已中断。', 'ok'); return; }
  const cur = SECTIONS.find((s) => s.id === window.__motionChapter);
  if (cur && cur.space) cur.space();
  else toast('本章无运行态，直接调参数即可。', 'ok');
}
function startReplay() {
  if (!REPLAY.buf || REPLAY.buf.length < 4) { toast('先运行一次实验，才有回放。', 'warn'); return; }
  REPLAY.active = true;
  REPLAY.t = 0;
  setStatus('running');
  toast('正在回放刚才这一趟…再按空格可中断。', 'ok');
}
function recordSample(t, vals) {
  REPLAY.buf = REPLAY.buf || [];
  if (REPLAY.buf.length < 3600) REPLAY.buf.push({ t, vals });
}
function resetReplay() { REPLAY.buf = null; REPLAY.active = false; }

/* ---------------- 图表擦洗回放（语义对齐原版「拖动图表可回放」）：
   实验结束/暂停后，横向拖动数据坞里任何一张图 → 按横轴位置映射到本次采样时长，
   场景状态逐帧套回该时刻（位置/角度/读数），松手停在那一帧。 ---------------- */
const SCRUB = { dragging: false };
let scrubTip = null;
function scrubSamples() {
  return (REPLAY.buf && REPLAY.buf.length >= 2 && REPLAY.apply) ? REPLAY.buf : null;
}
function scrubTo(frac) {
  const buf = scrubSamples();
  if (!buf) return false;
  const t0 = buf[0].t, t1 = buf[buf.length - 1].t;
  if (!(t1 > t0)) return false;
  const f = Math.min(Math.max(frac, 0), 1);
  const tt = t0 + (t1 - t0) * f;
  let best = buf[0];
  for (const s of buf) { if (s.t <= tt) best = s; else break; }
  REPLAY.active = false;
  try { REPLAY.apply(best.vals); } catch (e) { return false; }
  return true;
}
function scrubTipShow(cv, clientX, text) {
  if (!scrubTip) {
    scrubTip = document.createElement('div');
    scrubTip.className = 'mot-scrub-tip';
    document.body.appendChild(scrubTip);
  }
  scrubTip.textContent = text;
  scrubTip.style.left = clientX + 'px';
  scrubTip.style.top = cv.getBoundingClientRect().top - 10 + 'px';
  scrubTip.classList.add('show');
}
function scrubTipHide() { if (scrubTip) scrubTip.classList.remove('show'); }
function scrubMove(ev, cv) {
  const buf = scrubSamples();
  if (!buf) return;
  const r = cv.getBoundingClientRect();
  const padL = 42, padR = 13;   // chartAxes 绘图区内边距（画布 2x，折算 CSS 像素）
  const frac = Math.min(Math.max((ev.clientX - r.left - padL) / Math.max(r.width - padL - padR, 1), 0), 1);
  const t0 = buf[0].t, t1 = buf[buf.length - 1].t;
  if (scrubTo(frac)) scrubTipShow(cv, ev.clientX, 't = ' + (t0 + (t1 - t0) * frac).toFixed(2) + ' s');
}
function bindChartScrub(cv) {
  cv.classList.add('scrubbable');
  cv.addEventListener('pointerdown', (ev) => {
    if (!scrubSamples()) { toast('先跑完一次实验，图表才能拖动回放。', 'warn'); return; }
    SCRUB.dragging = true;
    try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* 捕获失败不阻断拖动 */ }
    scrubMove(ev, cv);
  });
  cv.addEventListener('pointermove', (ev) => { if (SCRUB.dragging) scrubMove(ev, cv); });
  const up = () => { if (SCRUB.dragging) { SCRUB.dragging = false; scrubTipHide(); } };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { if (!SCRUB.dragging) scrubTipHide(); });
}

/* 频闪残影工厂：等时散点透明球/块 */
function makeGhostMaker(sceneG, geoKind = 'sphere', color = 0xd0763a) {
  const group = new THREE.Group();
  sceneG.add(group);
  const ghosts = [];
  return {
    group, ghosts,
    spawn(pos, scale = 1) {
      if (!STROBE.on || ghosts.length >= 30) return;
      let m;
      if (geoKind === 'sphere') {
        m = mesh(new THREE.SphereGeometry(0.13 * scale, 10, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false }));
      } else {
        m = mesh(new THREE.BoxGeometry(0.62 * scale, 0.12, 0.26), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false }));
      }
      m.position.copy(pos);
      group.add(m);
      ghosts.push(m);
    },
    clear() { ghosts.forEach((m) => group.remove(m)); ghosts.length = 0; },
  };
}

/* ================= 章 1 · 纸带与 v-t 图 ================= */

const TP = {
  mh: 0.05, M: 0.5,        // 钩码 kg / 小车 kg
  t: -1, run: false, vCur: 0, x: -3.6,
  dots: [], vt: [], ghostsT: 0,
};
const TP_X0 = -3.6, TP_END = 3.6, TP_TIMER_X = -4.5;
function tpAcc() { return (TP.mh * 9.8) / (TP.M + TP.mh); }
function tpXOf(t) { return TP_X0 + 0.5 * tpAcc() * t * t * 0.85; }   // 时间 → 位移（视觉缩放）

function buildTape(g) {
  buildBench(g, 12);
  buildAirTrack(g, { len: 9 });
  /* 打点计时器：壳体 + 振动片 + 复写盘 + 接线柱 + 铭牌 */
  const timer = new THREE.Group();
  const shellM = matCoat(CV.paintCream, { roughness: 0.38, metalness: 0.06 });
  const shell = box(0.5, 0.3, 0.34, shellM);
  shell.position.y = 0.15;
  timer.add(shell);
  const base = box(0.54, 0.05, 0.38, matStd(CV.steelDeep, { roughness: 0.45, metalness: 0.5 }));
  base.position.y = 0.025;
  timer.add(base);
  /* 复写盘（黄铜圆盘 + 压纸条） */
  const disc = cyl(0.11, 0.11, 0.018, matStd(CV.brass, { roughness: 0.3, metalness: 0.7 }), 20);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(0, 0.22, 0.19);
  timer.add(disc);
  /* 振动片 */
  const strip = box(0.3, 0.024, 0.05, matStd(CV.chrome, { roughness: 0.25, metalness: 0.85 }));
  strip.position.set(0, 0.3, 0.14);
  timer.add(strip);
  const pencil = cyl(0.016, 0.016, 0.07, matStd(0x2a3138, { roughness: 0.6 }), 10);
  pencil.position.set(0.1, 0.27, 0.17);
  pencil.rotation.x = Math.PI / 2.4;
  timer.add(pencil);
  /* 接线柱（红/黑） */
  [[0xff6a4a, 0.18], [0x30363c, -0.18]].forEach(([c, x]) => {
    const post = cyl(0.018, 0.018, 0.06, matStd(c, { roughness: 0.4, metalness: 0.4 }), 10);
    post.position.set(x, 0.33, -0.1);
    timer.add(post);
    const cap = cyl(0.026, 0.026, 0.02, matStd(c, { roughness: 0.4 }), 10);
    cap.position.set(x, 0.37, -0.1);
    timer.add(cap);
  });
  const plate = mesh(new THREE.PlaneGeometry(0.3, 0.1), new THREE.MeshBasicMaterial({ map: nameplate(['电磁打点计时器', '4~6 V · 50 Hz'], '#5a4030', 320, 110) }));
  plate.position.set(0, 0.16, 0.172);
  timer.add(plate);
  timer.position.set(TP_TIMER_X, BENCH_Y + 0.07, 0);
  g.add(timer);
  const shT = shadowBlob(0.5, 0.3);
  shT.position.set(TP_TIMER_X, BENCH_Y + 0.003, 0);
  g.add(shT);
  /* 纸带：米白条（点迹由运行时打点） */
  TP.tapeMat = matStd(0xf2ecd8, { roughness: 0.9 });
  TP.tape = box(1, 0.008, 0.14, TP.tapeMat);
  TP.tape.geometry.translate(0.5, 0, 0);
  TP.tape.position.set(TP_TIMER_X + 0.28, BENCH_Y + 0.28, 0.1);
  g.add(TP.tape);
  TP.dotsGroup = new THREE.Group();
  g.add(TP.dotsGroup);
  TP.cart = buildCart(g, CV.cartA, { withFlag: false });
  TP.ghosts = makeGhostMaker(g, 'box', CV.cartA);
  /* 滑轮支架：立柱 + 横臂 + 槽轮 */
  const pulG = new THREE.Group();
  const postM = matStd(CV.steelDeep, { roughness: 0.45, metalness: 0.55 });
  const post = box(0.05, 0.5, 0.05, postM);
  post.position.set(0, 0.25, -0.3);
  pulG.add(post);
  const arm = box(0.05, 0.05, 0.34, postM);
  arm.position.set(0, 0.48, -0.14);
  pulG.add(arm);
  const pulley = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.045, 18), matStd(CV.brass, { roughness: 0.3, metalness: 0.65 }));
  pulley.rotation.z = Math.PI / 2;
  pulley.position.set(0, 0.44, 0);
  pulG.add(pulley);
  const hub = cyl(0.02, 0.02, 0.07, matStd(CV.chrome, { roughness: 0.3, metalness: 0.8 }), 10);
  hub.rotation.z = Math.PI / 2;
  hub.position.set(0, 0.44, 0);
  pulG.add(hub);
  pulG.position.set(4.55, BENCH_Y + 0.07, 0);
  g.add(pulG);
  /* 挂钩 + 钩码 */
  TP.hanger = buildHanger(g);
  TP.rope = makeRope(0xcfc2a4, 0.016);
  TP.ropeH = makeRope(0xcfc2a4, 0.016);
  g.add(TP.rope, TP.ropeH);
  /* 拖拽：小车可拖（改变释放前的位置提示用，不参与计算） */
  registerDrag({ kind: 'fling', group: TP.cart, hitMesh: TP.cart, onDrag: (x) => { if (!TP.run) { TP.cart.position.x = clamp(x, TP_X0, TP_END); TP.x = TP.cart.position.x; } }, onEnd: (v) => { if (!TP.run && Math.abs(v) > 0.25) { toast('本章用「空格释放」按公式打点；拖动初位置已生效。', 'ok'); } } });
  tpReset();
}

function tpReset() {
  TP.t = -1; TP.run = false; TP.vt = []; TP.dots.forEach((d) => TP.dotsGroup.remove(d));
  TP.dots = [];
  TP.x = TP_X0;
  TP.cart.position.set(TP_X0, BENCH_Y + 0.31, 0);
  TP.hanger.position.set(4.55, BENCH_Y + 0.52, 0);
  setHangerMass(TP.hanger, TP.mh * 1000);
  TP.rope.set(V3(4.55, BENCH_Y + 0.51, 0), V3(4.55, BENCH_Y + 0.44, 0));
  TP.ropeH.set(V3(TP.cart.position.x + 0.34, BENCH_Y + 0.38, 0), V3(4.55, BENCH_Y + 0.51, 0));
  TP.tape.scale.x = 1;
  TP.ghosts.clear();
  resetReplay();
  if (hud) { hset('a1', tpAcc().toFixed(2) + ' m/s²'); hset('dots', '0'); hset('slope', '释放后自动拟合'); hset('zhucha', '–'); }
  setStatus('ready');
  /* 注意：不清 REPLAY.apply——它由章节 enter() 设置，实验结束后拖图回放（scrubTo）还要用它 */
}

function tpStart() {
  tpReset();
  TP.t = 0; TP.run = true;
  setStatus('running');
  sfx('click');
}

function stepTape(dt) {
  if (REPLAY.active) { replayAdvance(dt); return; }
  if (!TP.run) return;
  TP.t += dt;
  const a = tpAcc();
  const x = clamp(tpXOf(TP.t), TP_X0, TP_END);
  TP.x = x;
  TP.cart.position.x = x;
  /* 纸带随小车伸出：从计时器到车尾 */
  const tapeLen = x - (TP_TIMER_X + 0.28) + 0.1;
  TP.tape.scale.x = Math.max(tapeLen, 0.2);
  /* 钩码下降 + 双段绳 */
  const drop = clamp((x - TP_X0) * 0.32, 0, 1.0);
  TP.hanger.position.y = BENCH_Y + 0.52 - drop;
  TP.rope.set(V3(4.55, BENCH_Y + 0.51, 0), V3(4.55, TP.hanger.position.y - 0.06, 0));
  TP.ropeH.set(V3(x + 0.34, BENCH_Y + 0.38, 0), V3(4.55, BENCH_Y + 0.51, 0));
  /* 打点：每 0.02 s 一个点；每 5 点一个计数点（红圈） */
  const DT0 = 0.02;
  const nShould = Math.floor(TP.t / DT0);
  while (TP.dots.length < nShould && TP.dots.length < 220) {
    const i = TP.dots.length;
    const ti = (i + 1) * DT0;
    const xi = tpXOf(ti);
    const u = xi - (TP_TIMER_X + 0.28);   // 纸带上材料点位置（相对计时器）
    if (u > tapeLen) break;
    const isCounter = (i + 1) % 5 === 0;
    const dot = cyl(isCounter ? 0.02 : 0.012, isCounter ? 0.02 : 0.012, 0.006, matStd(isCounter ? 0xc8452e : 0x2c333a, { roughness: 0.7 }), 8);
    dot.rotation.x = Math.PI / 2;
    dot.position.set(TP_TIMER_X + 0.28 + u, BENCH_Y + 0.288, 0.1);
    TP.dotsGroup.add(dot);
    TP.dots.push(dot);
    if (isCounter) {
      const v = a * ti;
      TP.vt.push({ t: ti, v: v * 0.85, x: xi });
      hset('dots', String(TP.vt.length));
    }
  }
  /* 频闪残影 */
  TP.ghostsT += dt;
  if (TP.ghostsT > 0.14) { TP.ghostsT = 0; TP.ghosts.spawn(TP.cart.position); }
  recordSample(TP.t, [x, TP.hanger.position.y]);
  if (x >= TP_END - 0.02 || TP.t > 4.5) {
    TP.run = false;
    TP.t = -2;
    tpFinish(a);
  }
}

/* 实验完成：拟合 v-t 斜率 + 逐差法算 a，自动落一行记录 */
function tpFinish(a) {
  setStatus('done');
  sfx('thud');
  const pts = TP.vt.map((p) => [p.t, p.v]);
  let slope = 0;
  if (pts.length >= 3) {
    const n = pts.length;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(([x1, y1]) => { sx += x1; sy += y1; sxx += x1 * x1; sxy += x1 * y1; });
    slope = (n * sxy - sx * sy) / Math.max(n * sxx - sx * sx, 1e-9);
  }
  /* 逐差法：s 取相邻计数点间距，a = (s4+s5+s6−s1−s2−s3)/(9T²)，T=0.1s */
  let aZh = 0;
  const n = TP.vt.length;
  if (n >= 7) {
    const s = [];
    for (let i = 1; i < n; i++) s.push(TP.vt[i].x - TP.vt[i - 1].x);
    const m2 = Math.floor(s.length / 2);
    let hi = 0, lo = 0;
    for (let i = m2; i < Math.min(m2 + 3, s.length); i++) hi += s[i];
    for (let i = 0; i < 3; i++) lo += s[i];
    aZh = (hi - lo) / (9 * 0.1 * 0.1) * 0.85;
  }
  hset('slope', slope.toFixed(3) + ' m/s²');
  hset('zhucha', n >= 7 ? aZh.toFixed(3) + ' m/s²' : '点数不足');
  logAddRow('tape', [(TP.mh * 1000).toFixed(0) + ' g', a.toFixed(3), slope.toFixed(3), n >= 7 ? aZh.toFixed(3) : '—']);
  tpDrawPlot();
}

/* 纸带页放大镜：点迹 + 间距标尺 + 逐差法注释（画在数据坞画布） */
function tpDrawPlot() {
  const cv = mkChart('tapePlot', 190);
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  const st = getComputedStyle(document.documentElement);
  const fg = st.getPropertyValue('--text-faint').trim() || '#8892a0';
  const acc = st.getPropertyValue('--accent').trim() || '#e8674a';
  /* 纸带底 */
  ctx.fillStyle = '#f2ecd8';
  ctx.fillRect(20, H * 0.32, W - 40, H * 0.3);
  ctx.strokeStyle = 'rgba(90,64,48,0.4)';
  ctx.strokeRect(20, H * 0.32, W - 40, H * 0.3);
  const n = TP.vt.length;
  if (!n) {
    ctx.fillStyle = fg;
    ctx.font = '24px -apple-system, sans-serif';
    ctx.fillText('释放小车后，计数点会出现在这里（每 0.1 s 一个计数点）。', 30, H * 0.2);
    return;
  }
  /* 相邻计数点等比铺开 */
  const xs = TP.vt.map((p) => p.x);
  const u0 = xs[0], u1 = xs[xs.length - 1];
  const px = (u) => 40 + ((u - u0) / Math.max(u1 - u0, 0.01)) * (W - 90);
  TP.vt.forEach((p, i) => {
    const x = px(p.x);
    ctx.fillStyle = '#c8452e';
    ctx.beginPath(); ctx.arc(x, H * 0.47, 6, 0, 7); ctx.fill();
    ctx.fillStyle = fg;
    ctx.font = '20px ui-monospace, monospace';
    ctx.fillText(String(i + 1), x, H * 0.29);
    if (i < n - 1) {
      const gap = (TP.vt[i + 1].x - p.x) / 0.85 * 100;   // mm（视觉还原）
      ctx.strokeStyle = acc; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 8, H * 0.72); ctx.lineTo(px(TP.vt[i + 1].x) - 8, H * 0.72); ctx.stroke();
      ctx.fillStyle = acc;
      ctx.font = '18px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('s' + (i + 1) + '=' + gap.toFixed(1) + 'mm', (x + px(TP.vt[i + 1].x)) / 2, H * 0.86);
      ctx.textAlign = 'left';
    }
  });
  ctx.fillStyle = fg;
  ctx.font = '21px -apple-system, sans-serif';
  ctx.fillText('计数点 T = 0.1 s · 逐差法 a = [(s₄+s₅+s₆)−(s₁+s₂+s₃)] / 9T²', 30, H * 0.16);
  /* v-t 图线 */
  const m = chartAxes(cv, { xl: 't/s', yl: 'v', xmax: Math.max(TP.vt[n - 1].t, 0.5), ymax: Math.max(TP.vt[n - 1].v, 0.4) });
  ctx.fillStyle = 'rgba(0,0,0,0)';
}

/* v-t 实时图（独立画布，运行中随计数点增长） */
function tpLivePlot() {
  if (!TP.vt.length) return;
  const cv = mkChart('tapeVt', 168);
  const vmax = Math.max(...TP.vt.map((p) => p.v), 0.4);
  const tmax = Math.max(TP.vt[TP.vt.length - 1].t, 0.5);
  const m = chartAxes(cv, { xl: 't/s', yl: 'v/(m·s⁻¹)', xmax: Math.max(tmax, 1), ymax: vmax * 1.15 });
  chartLine(m, TP.vt.map((p) => [p.t, p.v]), cssHex('arrowF'), 4);
  chartDots(m, TP.vt.map((p) => [p.t, p.v]), cssHex('arrowF'), 4);
}

function tapeCtl() {
  ctl.clear();
  ctl.slider({ label: '钩码质量 m', min: 0.02, max: 0.2, step: 0.01, value: TP.mh, fmt: (v) => (v * 1000).toFixed(0) + ' g → ' + (v * 9.8).toFixed(2) + ' N', onInput: (v) => { TP.mh = v; if (!TP.run) { setHangerMass(TP.hanger, v * 1000); hset('a1', tpAcc().toFixed(2) + ' m/s²'); } } });
  ctl.slider({ label: '小车质量 M', min: 0.2, max: 0.8, step: 0.05, value: TP.M, fmt: (v) => (v * 1000).toFixed(0) + ' g', onInput: (v) => { TP.M = v; if (!TP.run) hset('a1', tpAcc().toFixed(2) + ' m/s²'); } });
  ctl.sep();
  hintEl('空格 释放小车 · 数据坞有 纸带页 + v-t 图 · 改变钩码质量再跑一遍比较');
  setHudRows([['st', '状态'], ['a1', 'a = m钩g/(M+m钩)'], ['dots', '计数点'], ['slope', 'v-t 斜率 a'], ['zhucha', '逐差法 a']]);
  hset('a1', tpAcc().toFixed(2) + ' m/s²');
  hset('dots', '0');
  hset('slope', '释放后自动拟合');
  mkChart('tapePlot', 190);
  tpDrawPlot();
  setStatus('ready');
}

/* ================= 章 2 · 光电门测速度 ================= */

const GT = {
  v0: 0.8, acc: 0, d: 0.05, run: false, t: -1,
  g1x: -1.2, g2x: 1.2, vCur: 0,
  in1: false, in2: false, t1: 0, t2: 0, tt1: 0, tt2: 0, v1: 0, v2: 0,
};
function gtL() { return Math.abs(GT.g2x - GT.g1x); }

function buildGates(g) {
  buildBench(g, 12);
  buildAirTrack(g, { len: 9 });
  GT.cart = buildCart(g, CV.cartA);
  GT.cart.userData.vane = GT.cart.children.find((c) => c.userData && c.userData.blade);
  /* 挡光片宽度可视刃 */
  GT.blade = box(0.016, 0.1, 0.16, matStd(0x14171b, { roughness: 0.6 }));
  GT.blade.position.set(-0.18, 0.36, 0);
  GT.cart.add(GT.blade);
  GT.g1 = buildGate(g);
  GT.g2 = buildGate(g);
  /* 数字计时器（LCD 实时刷新） */
  GT.lcd = makeLcd(256, 128, 'ready', ['Δt1 —', 'Δt2 —']);
  const timerBox = new THREE.Group();
  const shellM = matCoat(CV.paintBlue, { roughness: 0.36, metalness: 0.08 });
  const shell = box(0.62, 0.24, 0.4, shellM);
  shell.position.y = 0.12;
  timerBox.add(shell);
  const screen = mesh(new THREE.PlaneGeometry(0.52, 0.17), new THREE.MeshBasicMaterial({ map: GT.lcd.tex }));
  screen.position.set(0, 0.15, 0.201);
  timerBox.add(screen);
  const frame = box(0.56, 0.2, 0.012, matStd(0x14171b, { roughness: 0.5 }));
  frame.position.set(0, 0.15, 0.196);
  timerBox.add(frame);
  const plate = mesh(new THREE.PlaneGeometry(0.3, 0.08), new THREE.MeshBasicMaterial({ map: nameplate(['数字计时器', 'μs 级 · 双通道'], '#3a5560', 300, 90) }));
  plate.position.set(0, 0.03, 0.201);
  timerBox.add(plate);
  timerBox.position.set(-1.6, BENCH_Y + 0.07, -1.15);
  timerBox.rotation.y = 0.32;
  g.add(timerBox);
  const shT = shadowBlob(0.6, 0.3);
  shT.position.set(-1.6, BENCH_Y + 0.003, -1.15);
  g.add(shT);
  /* 电缆（两门 → 计时器） */
  GT.cable1 = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 0, 0), V3(0.3, -0.06, 0.1), V3(0.6, -0.04, 0.2)]), 14, 0.01, 6, false), mx('cable', () => matStd(0x23282e, { roughness: 0.85 })));
  g.add(GT.cable1);
  GT.cable2 = GT.cable1.clone();
  g.add(GT.cable2);
  /* 光电门可拖拽摆位 */
  registerDrag({ kind: 'x', group: GT.g1, hitMesh: GT.g1, onDrag: (x) => { GT.g1x = clamp(x, -4.2, GT.g2x - 0.5); gtPlace(); } });
  registerDrag({ kind: 'x', group: GT.g2, hitMesh: GT.g2, onDrag: (x) => { GT.g2x = clamp(x, GT.g1x + 0.5, 4.2); gtPlace(); } });
  GT.lbl1 = label('G1', '#9fdcb0', 0.0045);
  GT.lbl2 = label('G2', '#9fdcb0', 0.0045);
  g.add(GT.lbl1, GT.lbl2);
  gtReset();
}

function gtPlace() {
  const y = BENCH_Y + 0.24;
  GT.g1.position.set(GT.g1x, y, 0);
  GT.g2.position.set(GT.g2x, y, 0);
  GT.lbl1.position.set(GT.g1x, y + 0.7, 0.2);
  GT.lbl2.position.set(GT.g2x, y + 0.7, 0.2);
  /* 电缆跟随 */
  const tPos = V3(-1.6, BENCH_Y + 0.14, -0.95);
  const c1a = V3(GT.g1x, y + 0.42, 0.3);
  GT.cable1.geometry.dispose();
  GT.cable1.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([c1a, V3((GT.g1x + tPos.x) / 2, BENCH_Y + 0.05, 0.5), tPos]), 16, 0.01, 6, false);
  const c2a = V3(GT.g2x, y + 0.42, 0.3);
  GT.cable2.geometry.dispose();
  GT.cable2.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([c2a, V3((GT.g2x + tPos.x) / 2 - 0.3, BENCH_Y + 0.04, 0.8), tPos]), 16, 0.01, 6, false);
  if (hud) hset('L', gtL().toFixed(1) + ' m');
}

function gtReset() {
  GT.t = -1; GT.run = false;
  GT.vCur = GT.v0;
  GT.in1 = GT.in2 = false; GT.tt1 = GT.tt2 = 0; GT.v1 = GT.v2 = 0;
  GT.cart.position.set(-4.3, BENCH_Y + 0.31, 0);
  retext(GT.lbl1, 'G1', '#9fdcb0', 0.0045);
  retext(GT.lbl2, 'G2', '#9fdcb0', 0.0045);
  GT.blade.scale.y = GT.d / 0.05;
  GT.lcd.set(GT.d.toFixed(3) + ' m', ['d 挡光片', 'L ' + gtL().toFixed(1) + ' m'].join(' '), '待释放');
  gtPlace();
  resetReplay();
  if (hud) {
    hset('d', GT.d.toFixed(2) + ' m'); hset('L', gtL().toFixed(1) + ' m');
    hset('dt', '–'); hset('v', '–'); hset('a', '–');
  }
  setStatus('ready');
}

function gtStart() {
  gtReset();
  GT.t = 0; GT.run = true;
  setStatus('running');
  sfx('click');
}

function stepGates(dt) {
  if (REPLAY.active) { replayAdvance(dt); return; }
  if (!GT.run) { gtLcdIdle(); return; }
  GT.t += dt;
  GT.vCur += GT.acc * dt;
  GT.cart.position.x += GT.vCur * dt * 0.6;
  const x = GT.cart.position.x;
  const y = BENCH_Y + 0.24;
  [[GT.g1, GT.g1x, 1], [GT.g2, GT.g2x, 2]].forEach(([gt, gx, i]) => {
    const inside = Math.abs(x - gx) < GT.d * 0.6 * 0.5 + 0.012;
    const key = 'in' + i;
    if (inside && !GT[key]) {
      GT[key] = true;
      GT['ts' + i] = GT.t;
      flashGate(gt);
    }
    if (GT[key] && Math.abs(x - gx) > GT.d * 0.6 * 0.5 + 0.02) {
      GT[key] = false;
      GT['tt' + i] = GT.t - GT['ts' + i];
      GT['v' + i] = GT.d / Math.max(GT['tt' + i], 1e-4);
      retext(i === 1 ? GT.lbl1 : GT.lbl2, 'v' + i + '=' + GT['v' + i].toFixed(2), '#ffd166', 0.0045);
      GT.lcd.set(GT['v' + i].toFixed(3), 'Δt' + i + '=' + (GT['tt' + i] * 1000).toFixed(2) + ' ms', 'v' + i + '=' + GT['v' + i].toFixed(2) + ' m/s');
      hset('dt', 'Δt1 ' + (GT.tt1 * 1000 || 0).toFixed(1) + ' · Δt2 ' + (GT.tt2 * 1000 || 0).toFixed(1) + ' ms');
      hset('v', 'v1=' + (GT.v1 || 0).toFixed(2) + '  v2=' + (GT.v2 || 0).toFixed(2) + ' m/s');
      if (i === 2 && GT.v1 > 0) {
        const aM = (GT.v2 * GT.v2 - GT.v1 * GT.v1) / (2 * gtL());
        hset('a', (GT.acc === 0 ? '≈0（匀速）' : aM.toFixed(3) + ' m/s²'));
        logAddRow('gates', [GT.d.toFixed(2), gtL().toFixed(1), (GT.tt1 * 1000).toFixed(1), (GT.tt2 * 1000).toFixed(1), GT.v1.toFixed(2), GT.v2.toFixed(2), GT.acc === 0 ? '≈0' : aM.toFixed(3)]);
        setStatus('done');
        sfx('clack');
        GT.run = false;
        GT.t = -2;
      }
    }
  });
  recordSample(GT.t, [GT.cart.position.x]);
  if (x > 4.6) { GT.run = false; setStatus('done'); }
}
function gtLcdIdle() {
  /* 待机时 LCD 显示参数 */
}

function gatesCtl() {
  ctl.clear();
  ctl.slider({ label: '初速度 v₀', min: 0.2, max: 2.2, step: 0.05, value: GT.v0, fmt: (v) => v.toFixed(2) + ' m/s', onInput: (v) => { GT.v0 = v; if (!GT.run) GT.vCur = v; } });
  ctl.slider({ label: '导轨加速度（微倾）', min: 0, max: 0.6, step: 0.05, value: GT.acc, fmt: (v) => v.toFixed(2) + ' m/s²', onInput: (v) => { GT.acc = v; } });
  ctl.slider({ label: '挡光片宽度 d', min: 0.02, max: 0.2, step: 0.01, value: GT.d, fmt: (v) => v.toFixed(2) + ' m', onInput: (v) => { GT.d = v; if (!GT.run) { GT.blade.scale.y = v / 0.05; hset('d', v.toFixed(2) + ' m'); } } });
  ctl.sep();
  hintEl('拖动两只光电门改变间距（画面里直接拖） · 空格 释放 · d 很小时 v=d/Δt 就是瞬时速度');
  setHudRows([['st', '状态'], ['d', '挡光片宽度 d'], ['L', '门间距 L（拖动）'], ['dt', '挡光时间 Δt'], ['v', 'v1 / v2'], ['a', 'a=(v2²−v1²)/2L']]);
  logSetCols('gates', ['d/m', 'L/m', 'Δt1/ms', 'Δt2/ms', 'v1', 'v2', 'a']);
  gtReset();
}

/* ================= 章 3 · 自由落体 ================= */

const DP = {
  h: 4.6, obj: 'ball', g: 9.8, vac: false,
  gh1: 3.6, gh2: 1.6,          // 两光电门下落高度（m）
  t: -1, run: false, v: 0, y: 4.6,
  past1: false, past2: false, v1: 0, v2: 0, gMeas: 0, ghostT: 0,
};
const DP_OBJS = {
  ball: { name: '钢球', vt: 60, r: 0.13 },
  pp: { name: '乒乓球', vt: 6.8, r: 0.19 },
  feather: { name: '羽毛', vt: 1.35, r: 0.16 },
};

function buildDrop(g) {
  /* 地面 + 落体塔（铝型材立柱 + 刻度贴图 + 顶横臂） */
  const floorM = mx('dropFloor', () => matStd(0x4a4f57, { roughness: 0.85 }));
  const floor = mesh(new THREE.CircleGeometry(5.4, 40), floorM);
  floor.rotation.x = -Math.PI / 2;
  g.add(floor);
  const ring = mesh(new THREE.TorusGeometry(5.4, 0.05, 8, 60), matStd(CV.steelDeep, { roughness: 0.5, metalness: 0.5 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  g.add(ring);
  const tower = new THREE.Group();
  const profM = matStd(CV.trackTop, { roughness: 0.32, metalness: 0.7 });
  const col = box(0.14, DP.h + 0.9, 0.14, profM);
  col.position.set(0, (DP.h + 0.9) / 2, -0.6);
  tower.add(col);
  /* T 槽装饰线 */
  [-0.052, 0.052].forEach((x) => {
    const groove = box(0.02, DP.h + 0.86, 0.02, matStd(CV.steelDeep, { roughness: 0.6, metalness: 0.4 }));
    groove.position.set(x, (DP.h + 0.9) / 2, -0.53);
    tower.add(groove);
  });
  /* 刻度贴图（正面） */
  const scale = mesh(new THREE.PlaneGeometry(0.13, DP.h + 0.7), new THREE.MeshBasicMaterial({ map: rulerTexture(6, 0.5).tex }));
  scale.position.set(0.001, (DP.h + 0.7) / 2, -0.52);
  scale.rotation.y = Math.PI / 2;
  scale.rotation.z = 0;
  tower.add(scale);
  scale.rotation.set(0, Math.PI / 2, 0);
  scale.position.set(0.075, (DP.h + 0.7) / 2, -0.6);
  /* 底座 */
  const baseP = box(1.2, 0.1, 0.7, matStd(CV.steelDeep, { roughness: 0.5, metalness: 0.5 }));
  baseP.position.set(0, 0.05, -0.6);
  tower.add(baseP);
  /* 顶横臂 + 电磁铁释放器 */
  const arm = box(1.0, 0.08, 0.08, profM);
  arm.position.set(0.42, DP.h + 0.78, -0.6);
  tower.add(arm);
  const em = new THREE.Group();
  const coilM = matStd(CV.paintOrange, { roughness: 0.45, metalness: 0.2 });
  const coil = cyl(0.07, 0.09, 0.1, coilM, 16);
  em.add(coil);
  const yoke = box(0.2, 0.04, 0.04, matStd(CV.chrome, { roughness: 0.3, metalness: 0.8 }));
  yoke.position.y = 0.07;
  em.add(yoke);
  em.position.set(0.62, DP.h + 0.68, -0.6);
  tower.add(em);
  DP.emCoil = coil;
  /* 两只夹装光电门（滑块沿塔滑动，滑杆联动） */
  DP.gate1 = buildGate(g, { withPost: false });
  DP.gate2 = buildGate(g, { withPost: false });
  const clampM = matStd(CV.steelDeep, { roughness: 0.45, metalness: 0.55 });
  [DP.gate1, DP.gate2].forEach((gt) => {
    const clamp2 = box(0.1, 0.1, 0.14, clampM);
    clamp2.position.set(-0.03, 0.22, -0.1);
    gt.add(clamp2);
  });
  /* 接球篮 */
  const basket = new THREE.Group();
  const bowlM = matStd(0x8f6a3a, { roughness: 0.6, metalness: 0.3 });
  const bowl = mesh(new THREE.SphereGeometry(0.28, 18, 12, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58), bowlM);
  basket.add(bowl);
  const postB = cyl(0.03, 0.04, 0.5, matStd(CV.steelDeep, { roughness: 0.5, metalness: 0.5 }), 10);
  postB.position.y = -0.2;
  basket.add(postB);
  basket.position.set(0.62, 0.5, -0.6);
  g.add(basket);
  /* 牛顿管（玻璃管 + 羽毛 + 铜片 + 管塞） */
  const tube = new THREE.Group();
  const glass = cyl(0.13, 0.13, 2.2, matGlass(0xd8e8ee, { roughness: 0.08, transmission: 0.9, thickness: 0.2 }), 20);
  glass.position.y = 1.35;
  tube.add(glass);
  const capM = matStd(CV.brass, { roughness: 0.35, metalness: 0.7 });
  const capT = cyl(0.15, 0.15, 0.08, capM, 18);
  capT.position.y = 2.47;
  tube.add(capT);
  const capB = capT.clone();
  capB.position.y = 0.26;
  tube.add(capB);
  /* 管内：羽毛（交叉薄片） + 铜片 */
  const feather = new THREE.Group();
  const fM = new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
  for (let i = 0; i < 4; i++) {
    const blade = mesh(new THREE.CylinderGeometry(0.008, 0.035, 0.34, 6, 1, false, 0, Math.PI), fM);
    blade.position.y = -0.14 + (i % 2) * 0.06;
    blade.rotation.y = (i / 4) * Math.PI;
    blade.rotation.z = 0.2;
    feather.add(blade);
  }
  feather.position.set(0, 0.8, 0);
  tube.add(feather);
  DP.tubeFeather = feather;
  const coin = cyl(0.05, 0.05, 0.012, matStd(CV.brass, { roughness: 0.35, metalness: 0.75 }), 16);
  coin.position.set(0, 1.5, 0);
  tube.add(coin);
  DP.tubeCoin = coin;
  /* 真空泵（小箱 + 软管到管底阀） */
  const pump = new THREE.Group();
  const pumpBody = box(0.42, 0.26, 0.3, matCoat(CV.paintBlue, { roughness: 0.36 }));
  pumpBody.position.y = 0.13;
  pump.add(pumpBody);
  const pumpLcd = mesh(new THREE.PlaneGeometry(0.22, 0.1), new THREE.MeshBasicMaterial({ map: nameplate(['真空泵', '2XZ'], '#3a5560', 240, 100) }));
  pumpLcd.position.set(0, 0.16, 0.151);
  pump.add(pumpLcd);
  const hose = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0.2, 0.2, 0), V3(0.5, 0.3, 0.1), V3(0.8, 0.28, 0)]), 12, 0.02, 8, false), matStd(0x2a3038, { roughness: 0.9 }));
  pump.add(hose);
  pump.position.set(1.6, 0, 0.4);
  pump.visible = false;
  tube.add(pump);
  DP.pump = pump;
  tube.position.set(2.4, 0, 1.1);
  g.add(tube);
  DP.tube = tube;
  DP.tubeLbl = label('牛顿管', '#dfe8ee', 0.005);
  DP.tubeLbl.position.set(2.4, 2.8, 1.1);
  g.add(DP.tubeLbl);
  /* 运动物体（三件套预建，切换显隐） */
  const ballM = matStd(CV.chrome, { roughness: 0.22, metalness: 0.9 });
  DP.ball = mesh(new THREE.SphereGeometry(DP_OBJS.ball.r, 18, 14), ballM);
  const ppM = matCoat(0xf6f2e4, { roughness: 0.35 });
  DP.pp = mesh(new THREE.SphereGeometry(DP_OBJS.pp.r, 16, 12), ppM);
  const featherF = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const blade = mesh(new THREE.CylinderGeometry(0.006, 0.05, 0.4, 6, 1, false, 0, Math.PI), fM);
    blade.rotation.y = (i / 5) * Math.PI * 2;
    blade.rotation.z = 0.15;
    featherF.add(blade);
  }
  DP.feather = featherF;
  g.add(DP.ball, DP.pp, DP.feather);
  DP.lbl = label('', '#ffd166', 0.005);
  g.add(DP.lbl);
  /* 高度标记横杆 */
  DP.mark = box(0.5, 0.02, 0.02, matStd(CV.paintOrange, { roughness: 0.5 }));
  g.add(DP.mark);
  DP.ghosts = makeGhostMaker(g, 'sphere', CV.paintOrange);
  dpReset();
}

function dpObj() { return DP_OBJS[DP.obj]; }
function dpReset() {
  DP.t = -1; DP.run = false; DP.v = 0; DP.y = DP.h;
  DP.past1 = DP.past2 = false; DP.v1 = DP.v2 = 0; DP.gMeas = 0;
  [DP.ball, DP.pp, DP.feather].forEach((m) => { m.visible = false; m.rotation.set(0, 0, 0); });
  const cur = DP[DP.obj];
  cur.visible = true;
  cur.position.set(0.62, DP.h, -0.6);
  DP.mark.position.set(0.62, 0.02, -0.6);
  DP.mark.scale.x = 1;
  DP.gate1.position.set(-0.28, DP.gh1, -0.6);
  DP.gate2.position.set(-0.28, DP.gh2, -0.6);
  DP.gate1.rotation.y = Math.PI;
  DP.gate2.rotation.y = Math.PI;
  DP.ghosts.clear();
  DP.emCoil.emissive = DP.emCoil.emissive || new THREE.Color(0);
  resetReplay();
  if (hud) {
    hset('t', '–'); hset('v', '–'); hset('g', '–');
    hset('eq', DP.vac ? '牛顿管抽真空：真空中羽毛与铜片同时落地' : 'h=½gt²，v=gt');
  }
  /* 牛顿管演示：抽真空时羽毛贴住管顶 */
  DP.tubeFeather.position.y = DP.vac ? 2.3 : 0.8;
  DP.tubeFeather.rotation.set(0, 0, 0);
  DP.tubeCoin.position.y = DP.vac ? 2.42 : 1.5;
  DP.pump.visible = DP.vac;
  DP.tube.children[0].material.opacity = DP.vac ? 0.96 : 0.7;
  setStatus('ready');
}
function dpStart() {
  dpReset();
  DP.t = 0; DP.run = true;
  setStatus('running');
  sfx('snap');
}
function stepDrop(dt) {
  if (REPLAY.active) { replayAdvance(dt); return; }
  /* 羽毛/铜片在管中飘落（背景演示，真空时同步落地） */
  if (DP.tubeFeather.position.y > 0.42) {
    const vf = DP.vac ? 2.4 : 0.55;
    DP.tubeFeather.position.y = Math.max(DP.tubeFeather.position.y - vf * dt, 0.42);
    DP.tubeFeather.rotation.z += dt * (DP.vac ? 0 : 2.2);
    DP.tubeFeather.rotation.x += dt * (DP.vac ? 0 : 1.3);
  }
  if (DP.tubeCoin.position.y > 0.34) DP.tubeCoin.position.y = Math.max(DP.tubeCoin.position.y - (DP.vac ? 2.4 : 1.6) * dt, 0.34);
  if (!DP.run) return;
  DP.t += dt;
  const vt = DP.vac ? Infinity : dpObj().vt;
  DP.v = Math.min((DP.v || 0) + DP.g * dt * (1 - Math.pow((DP.v || 0) / vt, 2)), vt);
  DP.y = Math.max((DP.y || DP.h) - DP.v * dt, 0.14);
  const cur = DP[DP.obj];
  cur.position.set(0.62, DP.y, -0.6);
  cur.rotation.z += dt * (DP.obj === 'feather' ? 3 : 0.6);
  /* 光电门：经过即测 v = d/Δt */
  [[DP.gate1, DP.gh1, 1], [DP.gate2, DP.gh2, 2]].forEach(([gt, gh, i]) => {
    if (!DP['past' + i] && DP.y <= gh) {
      DP['past' + i] = true;
      DP['v' + i] = DP.v;
      flashGate(gt);
    }
  });
  if (DP.past1 && DP.past2 && !DP.gMeas) {
    const dh = Math.max(DP.gh1 - DP.gh2, 0.2);
    DP.gMeas = (DP.v2 * DP.v2 - DP.v1 * DP.v1) / (2 * dh);
    hset('g', 'g = ' + DP.gMeas.toFixed(2) + ' m/s²（两门实测）');
  }
  DP.ghostT += dt;
  if (DP.ghostT > 0.12) { DP.ghostT = 0; DP.ghosts.spawn(cur.position, dpObj().r / 0.13); }
  recordSample(DP.t, [DP.y, DP.v]);
  if (DP.y <= 0.15) {
    DP.run = false; DP.t = -2;
    setStatus('done');
    sfx('thud');
    const showV = DP.vac || vt > 50;
    hset('t', DP.t.toFixed(2) + ' s');
    hset('v', DP.v.toFixed(2) + ' m/s' + (!showV ? '（≈终端速度）' : ''));
    hset('eq', DP.vac || vt > 50 ? 'h = ½gt² → t = √(2h/g)' : '阻力 F∝v²，v 大后 a→0');
    logAddRow('drop', [dpObj().name, DP.vac ? '真空' : DP.g + '', DP.h.toFixed(1), DP.t.toFixed(2), DP.v.toFixed(2), DP.gMeas ? DP.gMeas.toFixed(2) : '—']);
  }
}
function dropCtl() {
  ctl.clear();
  ctl.slider({ label: '下落高度 h', min: 2, max: DP.h + 0.2, step: 0.2, value: DP.h, fmt: (v) => v.toFixed(1) + ' m', onInput: (v) => { DP.h = v; if (!DP.run) dpReset(); } });
  ctl.slider({ label: '1 号门高度', min: 1.2, max: DP.h - 0.2, step: 0.1, value: DP.gh1, fmt: (v) => v.toFixed(1) + ' m', onInput: (v) => { DP.gh1 = Math.max(v, DP.gh2 + 0.3); if (!DP.run) dpReset(); } });
  ctl.slider({ label: '2 号门高度', min: 0.6, max: DP.h - 0.4, step: 0.1, value: DP.gh2, fmt: (v) => v.toFixed(1) + ' m', onInput: (v) => { DP.gh2 = Math.min(v, DP.gh1 - 0.3); if (!DP.run) dpReset(); } });
  ctl.sep();
  const ob = [];
  const paintO = () => ob.forEach(({ b, v }) => b.classList.toggle('active', v === DP.obj));
  [['ball', '钢球'], ['pp', '乒乓球'], ['feather', '羽毛']].forEach(([v, t2]) => {
    const b = ctl.button({ label: t2, onClick: () => { DP.obj = v; if (!DP.run) dpReset(); paintO(); } });
    ob.push({ b, v });
  });
  paintO();
  ctl.toggle({ label: '牛顿管抽真空', value: false, onChange: (v) => { DP.vac = v; if (!DP.run) dpReset(); toast(v ? '已抽真空：管内羽毛与铜片将同时落地。' : '已放气，恢复空气阻力。', 'ok'); } });
  const gb = [];
  const paintG = () => gb.forEach(({ b, v }) => b.classList.toggle('active', v === DP.g));
  [[9.8, '地球 g=9.8'], [3.7, '火星 g=3.7'], [1.6, '月球 g=1.6']].forEach(([v, t2]) => {
    const b = ctl.button({ label: t2, onClick: () => { DP.g = v; if (!DP.run) dpReset(); paintG(); } });
    gb.push({ b, v });
  });
  paintG();
  ctl.sep();
  hintEl('空格 断开电磁铁 · 残影为等时频闪 · 两光电门测 v 算 g · 换羽毛再抽真空比较');
  setHudRows([['st', '状态'], ['t', '下落时间'], ['v', '当前速度'], ['g', 'g 实测（两门）'], ['eq', '公式']]);
  logSetCols('drop', ['物体', 'g/条件', 'h/m', 't/s', '落地 v', 'g 实测']);
  dpReset();
}

/* ================= 章 4 · 牛顿第二定律 ================= */

const NT = {
  mh: 0.02, M: 0.2, bal: true, sensor: false,
  t: -1, run: false, x: -4.2, vCur: 0, passed: [false, false], tt: [0, 0], aExp: 0,
};
const NT_G1X = -1.4, NT_G2X = 1.8;
function ntDrive() { return NT.bal ? NT.mh * 9.8 : Math.max(NT.mh * 9.8 - 0.22 * NT.M * 9.8, 0); }
function ntA() { return Math.max(ntDrive() / (NT.M + NT.mh), 0); }
function ntTension() { return NT.bal ? (NT.M * NT.mh * 9.8) / (NT.M + NT.mh) : Math.max(NT.M * ntA(), 0); }

function buildNewton(g) {
  buildBench(g, 12);
  /* 导轨整组（可随平衡摩擦力微倾） */
  NT.trackG = buildAirTrack(g, { len: 9, holes: true });
  /* 平衡摩擦力的垫块（左端抬高楔木，显隐） */
  NT.wedge = new THREE.Group();
  const wedgeShape = new THREE.Shape();
  wedgeShape.moveTo(-0.3, 0); wedgeShape.lineTo(0.3, 0); wedgeShape.lineTo(0.18, 0.22); wedgeShape.lineTo(-0.18, 0.22);
  wedgeShape.closePath();
  const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, { depth: 0.3, bevelEnabled: false });
  wedgeGeo.rotateY(Math.PI / 2);
  NT.wedge.add(mesh(wedgeGeo, matStd(0x8a6138, { roughness: 0.85 })));
  NT.wedge.position.set(-3.9, BENCH_Y + 0.07, 0.1);
  g.add(NT.wedge);
  NT.cart = buildCart(g, CV.cartB, { withFlag: true });
  /* 配重条（M 大时可见的叠片） */
  NT.ballast = new THREE.Group();
  const bM = matStd(CV.steel, { roughness: 0.4, metalness: 0.6 });
  for (let i = 0; i < 4; i++) {
    const bar = box(0.4, 0.02, 0.18, bM);
    bar.position.y = 0.185 + i * 0.024;
    NT.ballast.add(bar);
  }
  NT.cart.add(NT.ballast);
  /* 钩码挂架（滑轮在轨末端） */
  const pulG = new THREE.Group();
  const postM = matStd(CV.steelDeep, { roughness: 0.45, metalness: 0.55 });
  const post = box(0.05, 0.42, 0.05, postM);
  post.position.set(0, 0.21, -0.3);
  pulG.add(post);
  const arm = box(0.05, 0.05, 0.34, postM);
  arm.position.set(0, 0.4, -0.14);
  pulG.add(arm);
  const pulley = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 18), matStd(CV.brass, { roughness: 0.3, metalness: 0.65 }));
  pulley.rotation.z = Math.PI / 2;
  pulley.position.set(0, 0.37, 0);
  pulG.add(pulley);
  pulG.position.set(4.5, BENCH_Y + 0.07, 0);
  g.add(pulG);
  NT.hanger = buildHanger(g);
  NT.rope = makeRope(0xcfc2a4, 0.014);
  NT.ropeH = makeRope(0xcfc2a4, 0.014);
  g.add(NT.rope, NT.ropeH);
  /* 力传感器（S 挂钩 + LCD 显 T），串在绳上 */
  NT.sensor = new THREE.Group();
  const sShell = box(0.24, 0.4, 0.08, matCoat(CV.paintBlue, { roughness: 0.34 }));
  NT.sensor.add(sShell);
  NT.lcd = makeLcd(200, 100, '0.00 N', ['拉力 T', '50 Hz']);
  const sLcd = mesh(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshBasicMaterial({ map: NT.lcd.tex }));
  NT.sensor.add(sLcd);
  NT.lcdMesh = sLcd;
  const sHook = mesh(new THREE.TorusGeometry(0.04, 0.011, 8, 16), matStd(CV.chrome, { roughness: 0.3, metalness: 0.85 }));
  sHook.position.y = 0.26;
  NT.sensor.add(sHook);
  const sHook2 = sHook.clone();
  sHook2.position.y = -0.26;
  NT.sensor.add(sHook2);
  NT.sensor.position.set(3.2, BENCH_Y + 0.8, -0.5);
  NT.sensor.visible = false;
  g.add(NT.sensor);
  NT.g1 = buildGate(g);
  NT.g2 = buildGate(g);
  NT.ghosts = makeGhostMaker(g, 'box', CV.cartB);
  ntReset();
}
function ntApplyTilt() {
  NT.trackG.rotation.z = NT.bal ? -0.022 : 0;
  NT.wedge.visible = NT.bal;
  NT.sensor.visible = NT.sensorOn;
}
function ntReset() {
  NT.t = -1; NT.run = false; NT.vCur = 0;
  NT.passed = [false, false]; NT.tt = [0, 0]; NT.aExp = 0;
  NT.x = -4.2;
  NT.cart.position.set(-4.2, BENCH_Y + 0.31, 0);
  NT.cart.rotation.z = NT.bal ? -0.022 : 0;
  setHangerMass(NT.hanger, NT.mh * 1000);
  NT.hanger.position.set(4.5, BENCH_Y + 0.48, 0);
  NT.rope.set(V3(4.5, BENCH_Y + 0.44, 0), V3(4.5, NT.hanger.position.y - 0.06, 0));
  NT.ropeH.set(V3(-3.86, BENCH_Y + 0.38, 0), V3(4.5, BENCH_Y + 0.44, 0));
  NT.g1.position.set(NT_G1X, BENCH_Y + 0.24, 0);
  NT.g2.position.set(NT_G2X, BENCH_Y + 0.24, 0);
  NT.ballast.visible = NT.M > 0.4;
  ntApplyTilt();
  resetReplay();
  if (hud) {
    hset('F', (NT.mh * 9.8).toFixed(2) + ' N');
    hset('a', ntA() > 0 ? ntA().toFixed(3) + ' m/s²' : '0（拉不动）');
    hset('T', ntTension() ? ntTension().toFixed(2) + ' N' : '–');
    hset('aexp', '释放后由光电门测出');
  }
  setStatus('ready');
}
function ntStart() {
  ntReset();
  if (ntA() <= 0.001) {
    setStatus('done');
    hset('a', '0 m/s²（摩擦未平衡，拉不动）');
    hset('T', 'T ≤ 0');
    toast('拉不动：钩码重力不足以克服摩擦。先开「平衡摩擦力」。', 'warn');
    sfx('thud');
    return;
  }
  NT.t = 0; NT.run = true;
  setStatus('running');
  sfx('click');
}
function stepNewton(dt) {
  if (REPLAY.active) { replayAdvance(dt); return; }
  if (!NT.run) return;
  NT.t += dt;
  const a = ntA();
  NT.vCur += a * dt;
  NT.x = clamp(NT.x + NT.vCur * dt * 0.62, -4.2, 3.9);
  NT.cart.position.x = NT.x;
  const drop = clamp((NT.x + 4.2) * 0.2, 0, 0.85);
  NT.hanger.position.y = BENCH_Y + 0.48 - drop;
  NT.rope.set(V3(4.5, BENCH_Y + 0.44, 0), V3(4.5, NT.hanger.position.y - 0.06, 0));
  NT.ropeH.set(V3(NT.x + 0.34, BENCH_Y + 0.38, 0), V3(4.5, BENCH_Y + 0.44, 0));
  const T = ntTension();
  NT.lcd.set(T.toFixed(2) + ' N', '拉力 T', 'mg=' + (NT.mh * 9.8).toFixed(2));
  hset('T', T.toFixed(2) + ' N' + (T < NT.mh * 9.8 - 0.005 ? ' < mg=' + (NT.mh * 9.8).toFixed(2) : ' ≈ mg'));
  /* 光电门测速 → a 实测 */
  [[NT.g1, NT_G1X, 0], [NT.g2, NT_G2X, 1]].forEach(([gt, gx, i]) => {
    if (!NT.passed[i] && NT.x >= gx) {
      NT.passed[i] = true;
      NT.tt[i] = NT.t;
      flashGate(gt);
      if (i === 1) {
        const v1 = a * NT.tt[0], v2 = a * NT.tt[1];
        NT.aExp = (v2 * v2 - v1 * v1) / (2 * (NT_G2X - NT_G1X));
        hset('aexp', NT.aExp.toFixed(3) + ' m/s²');
      }
    }
  });
  NT.ghostsT = (NT.ghostsT || 0) + dt;
  if (NT.ghostsT > 0.15) { NT.ghostsT = 0; NT.ghosts.spawn(NT.cart.position); }
  recordSample(NT.t, [NT.x]);
  if (NT.x >= 3.85 || NT.t > 4) {
    NT.run = false; NT.t = -2;
    setStatus('done');
    sfx('beep');
    NT.canRec = true;
    toast('跑完一段：按「＋ 记录数据」存入 a–F 图。', 'ok');
  }
}
/* a-F 散点 + 拟合直线 + 理论线（画在记录区画布） */
NT.scatter = [];
function ntLogChart(cv) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (!NT.scatter.length) return;
  const fmax = Math.max(...NT.scatter.map((p) => p[0]), 0.5) * 1.15;
  const amax = Math.max(...NT.scatter.map((p) => p[1]), 0.5) * 1.25;
  const m = chartAxes(cv, { xl: 'F = mg / N', yl: 'a', xmax: fmax, ymax: amax });
  /* 理论线：a = F/M（当前 M）—— 虚线 */
  chartLine(m, [[0, 0], [fmax, fmax / NT.M]], 'rgba(140,150,165,0.9)', 3, [10, 8]);
  chartText(m, 'a = F/M（忽略 m）', fmax * 0.62, fmax / NT.M * 0.86, 'rgba(160,170,185,0.95)', 19);
  /* 散点 */
  chartDots(m, NT.scatter.map((p) => [p[0], p[1]]), cssHex('arrowF'), 7);
  /* 最小二乘拟合线 */
  if (NT.scatter.length >= 3) {
    const n = NT.scatter.length;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    NT.scatter.forEach(([x1, y1]) => { sx += x1; sy += y1; sxx += x1 * x1; sxy += x1 * y1; });
    const k = (n * sxy - sx * sy) / Math.max(n * sxx - sx * sx, 1e-9);
    const b = (sy - k * sx) / n;
    chartLine(m, [[0, Math.max(b, 0)], [fmax, k * fmax + b]], cssHex('arrowN'), 4);
    chartText(m, '拟合：a = ' + k.toFixed(3) + '·F ' + (Math.abs(b) > 0.004 ? (b > 0 ? '+ ' : '− ') + Math.abs(b).toFixed(3) : ''), 0.3, amax * 0.92, cssHex('arrowN'), 20);
  }
  chartText(m, 'm 大时点落在虚线下方（T < mg 系统误差）', fmax * 0.18, amax * 0.1, 'rgba(200,160,120,0.95)', 18);
}
function newtonCtl() {
  ctl.clear();
  ctl.slider({ label: '钩码质量 m', min: 0.01, max: 0.16, step: 0.005, value: NT.mh, fmt: (v) => (v * 1000).toFixed(0) + ' g → ' + (v * 9.8).toFixed(2) + ' N', onInput: (v) => { NT.mh = v; if (!NT.run) { setHangerMass(NT.hanger, v * 1000); ntHud(); } } });
  ctl.slider({ label: '小车质量 M（配重条）', min: 0.2, max: 0.8, step: 0.05, value: NT.M, fmt: (v) => (v * 1000).toFixed(0) + ' g', onInput: (v) => { NT.M = v; if (!NT.run) { NT.ballast.visible = v > 0.4; ntHud(); } } });
  ctl.toggle({ label: '平衡摩擦力（左端垫高）', value: NT.bal, onChange: (v) => { NT.bal = v; ntApplyTilt(); if (!NT.run) { NT.cart.rotation.z = v ? -0.022 : 0; ntHud(); } } });
  ctl.toggle({ label: '力传感器测拉力 T', value: NT.sensorOn || false, onChange: (v) => { NT.sensorOn = v; ntApplyTilt(); toast(v ? '力传感器串入绳路：LCD 直读真实 T。' : '已移除力传感器。', 'ok'); } });
  ctl.sep();
  hintEl('保持 M 不变 挂 10~60 g 并记录 · 看 a–F 图像与拟合 · 保持钩码不变 加配重条改 M · 挂 150 g 以上看图线弯曲');
  setHudRows([['st', '状态'], ['F', 'F = mg'], ['a', 'a 理论'], ['T', '绳拉力 T'], ['aexp', 'a 光电门实测']]);
  logSetCols('newton', ['m/g', 'F/N', 'M/g', 'a 理论', 'a 实测', 'T/N']);
  const noteEl = document.getElementById('chartNote');
  if (noteEl) noteEl.textContent = '横轴 F=mg · 纵轴 a。虚线为忽略 m 的 a=F/M；散点为每次记录。';
  ntHud();
  NT.canRec = false;
  ntApplyTilt();
}
function ntHud() {
  hset('F', (NT.mh * 9.8).toFixed(2) + ' N');
  hset('a', ntA() > 0.0005 ? ntA().toFixed(3) + ' m/s²' : '0（拉不动）');
  hset('T', ntTension().toFixed(2) + ' N');
  hset('aexp', NT.run || NT.aExp ? NT.aExp.toFixed(3) + ' m/s²' : '释放后由光电门测出');
}

/* ================= 章 5 · 滑动摩擦力 ================= */

const FR = {
  weights: 2,               // 木块上的砝码个数 ×100 g
  surf: 0,                  // 接触面 0木板 1毛巾 2橡胶 3毛毡
  motorV: 0.5,              // 电机拉动速度（视觉）
  t: -1, run: false, pullT: 0, x: -2.4,
  fCur: 0, fMax: 0, fKin: 0, sliding: false, phase: 0,
};
const FR_SURFS = [
  { name: '木板', mu: 0.30, tex: 'wood' },
  { name: '毛巾', mu: 0.52, tex: 'towel' },
  { name: '橡胶', mu: 0.68, tex: 'rubber' },
  { name: '毛毡', mu: 0.42, tex: 'felt' },
];
function frN() { return 0.6 * 9.8 + FR.weights * 0.1 * 9.8; }   // 木块 600 g + 砝码

/* 接触面纹理（木板纹 / 绒圈 / 橡胶粒 / 毛毡纤维） */
function frSurfaceTexture(kind) {
  const S = 256;
  return canvasTex(S, S, (ctx, w, h) => {
    const rnd = mulberry32(kind.length * 31 + 7);
    if (kind === 'wood') {
      ctx.fillStyle = '#a37b4e'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = `rgba(60,36,18,${0.1 + rnd() * 0.16})`;
        ctx.lineWidth = 1 + rnd() * 2.5;
        ctx.beginPath();
        const y0 = rnd() * h;
        ctx.moveTo(0, y0);
        for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y0 + Math.sin(x / 40 + i) * 3);
        ctx.stroke();
      }
    } else if (kind === 'towel') {
      ctx.fillStyle = '#b8beca'; ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 8) {
        for (let x = 0; x < w; x += 8) {
          ctx.fillStyle = `rgba(255,255,255,${0.1 + rnd() * 0.24})`;
          ctx.beginPath(); ctx.arc(x + rnd() * 4, y + rnd() * 4, 3.4, 0, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(70,80,100,0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x + 4, y + 4, 4, rnd() * 3, rnd() * 3 + 2.4); ctx.stroke();
        }
      }
    } else if (kind === 'rubber') {
      ctx.fillStyle = '#2e3338'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 500; i++) {
        ctx.fillStyle = `rgba(120,130,140,${0.08 + rnd() * 0.2})`;
        ctx.beginPath(); ctx.arc(rnd() * w, rnd() * h, 1 + rnd() * 3, 0, 7); ctx.fill();
      }
    } else {
      ctx.fillStyle = '#9aa0aa'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        ctx.strokeStyle = `rgba(250,250,255,${0.04 + rnd() * 0.12})`;
        ctx.lineWidth = 1;
        const x = rnd() * w, y = rnd() * h, a = rnd() * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); ctx.stroke();
      }
    }
  }, { repeat: [2, 1] });
}

function buildFric(g) {
  buildBench(g, 12, false);
  buildBenchProps(g, 12);
  /* 长木板（接触面贴图可切换） */
  FR.boardMats = FR_SURFS.map((s) => {
    const m = matStd(0xffffff, { roughness: s.tex === 'rubber' ? 0.8 : 0.9 });
    m.map = frSurfaceTexture(s.tex).tex;
    return m;
  });
  const boardEdge = matStd(CV.benchWood, { roughness: 0.7 });
  const board = box(7.2, 0.09, 1.5, boardEdge);
  board.position.set(0, BENCH_Y + 0.12, 0);
  g.add(board);
  FR.face = mesh(new THREE.PlaneGeometry(7.2, 1.5), FR.boardMats[0]);
  FR.face.rotation.x = -Math.PI / 2;
  FR.face.position.set(0, BENCH_Y + 0.171, 0);
  g.add(FR.face);
  const faceLbl = mesh(new THREE.PlaneGeometry(0.7, 0.24), new THREE.MeshBasicMaterial({ map: nameplate(['接触面', '可更换'], '#5a4030', 256, 96) }));
  faceLbl.rotation.x = -Math.PI / 2;
  faceLbl.position.set(-3.2, BENCH_Y + 0.172, 0.55);
  g.add(faceLbl);
  /* 木块（带挂环 + 顶面砝码） */
  FR.blk = new THREE.Group();
  const blkBody = box(0.66, 0.4, 0.62, matStd(0x8a6845, { roughness: 0.85 }));
  blkBody.position.y = 0.2;
  FR.blk.add(blkBody);
  const ringF = mesh(new THREE.TorusGeometry(0.035, 0.012, 8, 16), matStd(CV.chrome, { roughness: 0.3, metalness: 0.85 }));
  ringF.position.set(0.36, 0.3, 0);
  ringF.rotation.y = Math.PI / 2;
  FR.blk.add(ringF);
  FR.wtGroup = new THREE.Group();
  const wtM = matStd(CV.brass, { roughness: 0.35, metalness: 0.7 });
  for (let i = 0; i < 5; i++) {
    const w = cyl(0.095, 0.088, 0.045, wtM, 18);
    w.position.y = 0.42 + i * 0.05;
    w.visible = false;
    FR.wtGroup.add(w);
  }
  FR.blk.add(FR.wtGroup);
  FR.blk.position.set(-2.4, BENCH_Y + 0.17, 0);
  g.add(FR.blk);
  const shB = shadowBlob(0.7, 0.32);
  shB.position.set(-2.4, BENCH_Y + 0.003, 0);
  g.add(shB);
  /* 力传感器（拉环朝右，LCD 显 F） */
  FR.sensor = new THREE.Group();
  const sShell = box(0.34, 0.14, 0.1, matCoat(CV.paintBlue, { roughness: 0.34 }));
  FR.sensor.add(sShell);
  FR.fLcd = makeLcd(256, 110, '0.0 N', ['F', '静/动']);
  const sLcd = mesh(new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshBasicMaterial({ map: FR.fLcd.tex }));
  sLcd.position.set(0, 0.01, 0.052);
  FR.sensor.add(sLcd);
  const sRing = mesh(new THREE.TorusGeometry(0.035, 0.011, 8, 16), matStd(CV.chrome, { roughness: 0.3, metalness: 0.85 }));
  sRing.position.set(0.21, 0, 0);
  sRing.rotation.y = Math.PI / 2;
  FR.sensor.add(sRing);
  FR.sensor.position.set(-3.4, BENCH_Y + 0.35, 0);
  FR.sensor.rotation.z = Math.PI / 2;
  g.add(FR.sensor);
  /* 电机绞盘：箱体 + 旋转卷筒 + 摇臂出绳 */
  const motor = new THREE.Group();
  const mShell = box(0.6, 0.42, 0.5, matCoat(CV.paintCream, { roughness: 0.4 }));
  mShell.position.y = 0.21;
  motor.add(mShell);
  const mPlate = mesh(new THREE.PlaneGeometry(0.4, 0.16), new THREE.MeshBasicMaterial({ map: nameplate(['匀速电机', '驱动绞盘'], '#5a4030', 300, 110) }));
  mPlate.position.set(0, 0.24, 0.252);
  motor.add(mPlate);
  FR.drum = cyl(0.13, 0.13, 0.34, matStd(CV.steelDeep, { roughness: 0.4, metalness: 0.55 }), 18);
  FR.drum.rotation.x = Math.PI / 2;
  FR.drum.position.set(0, 0.5, 0);
  motor.add(FR.drum);
  for (let i = 0; i < 8; i++) {
    const rib = box(0.36, 0.012, 0.02, matStd(CV.chrome, { roughness: 0.3, metalness: 0.7 }));
    rib.position.set(0, 0.5, -0.16 + i * 0.045);
    motor.add(rib);
  }
  const led = mesh(new THREE.SphereGeometry(0.025, 10, 8), matGlow(CV.led, 1.1));
  led.position.set(0.22, 0.1, 0.26);
  motor.add(led);
  FR.motorLed = led.material;
  motor.position.set(4.9, BENCH_Y + 0.07, 0);
  g.add(motor);
  const shM = shadowBlob(0.7, 0.3);
  shM.position.set(4.9, BENCH_Y + 0.003, 0);
  g.add(shM);
  FR.rope = makeRope(0xcfc2a4, 0.014);
  g.add(FR.rope);
  FR.ghosts = makeGhostMaker(g, 'box', 0x8a6845);
  frReset();
}
function frPlace() {
  const sx = FR.x - 0.33 - 0.3;
  FR.sensor.position.x = sx;
  FR.rope.set(V3(sx + 0.24, BENCH_Y + 0.35, 0), V3(FR.x + 0.36, BENCH_Y + 0.37, 0));
  FR.wtGroup.children.forEach((w, i) => { w.visible = i < FR.weights; });
  FR.face.material = FR.boardMats[FR.surf];
}
function frReset() {
  FR.t = -1; FR.run = false; FR.pullT = 0;
  FR.x = -2.4; FR.fCur = 0; FR.fMax = 0; FR.fKin = 0; FR.sliding = false; FR.phase = 0;
  FR.drum.rotation.z = 0;
  FR.motorLed.color.set(CV.led); FR.motorLed.emissive.set(CV.led);
  frPlace();
  FR.ftData = [];
  FR.ghosts.clear();
  resetReplay();
  frHud();
  setStatus('ready');
}
function frHud() {
  const s = FR_SURFS[FR.surf];
  hset('N', frN().toFixed(1) + ' N');
  hset('F', FR.fCur.toFixed(2) + ' N');
  hset('fmax', FR.fMax ? FR.fMax.toFixed(2) + ' N' : '启动后测');
  hset('f', FR.fKin ? FR.fKin.toFixed(2) + ' N' : '–');
  hset('mu', 'μ = ' + s.mu.toFixed(2) + '（' + s.name + '）');
  FR.fLcd && FR.fLcd.set(FR.fCur.toFixed(2) + ' N', 'F', FR.sliding ? '滑动' : '静摩擦');
}
function frStart() {
  frReset();
  FR.t = 0; FR.run = true;
  FR.motorLed.color.set(CV.ledHot); FR.motorLed.emissive.set(CV.ledHot);
  setStatus('running');
  sfx('click');
}
function stepFric(dt) {
  if (REPLAY.active) { replayAdvance(dt); return; }
  if (!FR.run) return;
  FR.t += dt;
  FR.pullT += dt;
  FR.drum.rotation.z -= dt * FR.motorV * 6;
  const s = FR_SURFS[FR.surf];
  const N = frN();
  const muS = s.mu * 1.22;
  if (FR.pullT < 1.3) {
    /* 静摩擦爬升（物块不动） */
    FR.fCur = muS * N * (FR.pullT / 1.3);
    FR.sliding = false;
  } else if (FR.pullT < 1.5) {
    /* 峰值 → 回落 */
    const k = (FR.pullT - 1.3) / 0.2;
    FR.fCur = muS * N + (s.mu * N - muS * N) * k;
    FR.sliding = true;
    if (FR.pullT - dt < 1.3) { FR.fMax = muS * N; sfx('snap'); }
  } else {
    /* 滑动摩擦恒定，物块匀速滑动 */
    FR.fCur = s.mu * N;
    FR.fKin = s.mu * N;
    FR.sliding = true;
    FR.x += dt * FR.motorV * 0.9;
    if (FR.x > 2.6) {
      FR.run = false;
      FR.t = -2;
      setStatus('done');
      FR.motorLed.color.set(CV.led); FR.motorLed.emissive.set(CV.led);
      logAddRow('fric', [s.name, N.toFixed(1), FR.fMax.toFixed(2), FR.fKin.toFixed(2), s.mu.toFixed(2)]);
      toast('本轮结束：已自动记入测量记录。', 'ok');
    }
  }
  FR.blk.position.x = FR.x;
  FR.blk.position.y = BENCH_Y + 0.17;
  FR.ghostsT = (FR.ghostsT || 0) + dt;
  if (FR.sliding && FR.ghostsT > 0.2) { FR.ghostsT = 0; FR.ghosts.spawn(FR.blk.position); }
  frPlace();
  frHud();
  FR.ftData.push([FR.t, FR.fCur]);
  if (FR.ftData.length > 400) FR.ftData.shift();
  frFtPlot();
  recordSample(FR.t, [FR.x, FR.fCur]);
}
/* F-t 实时曲线 */
function frFtPlot() {
  if (!FR.ftData.length) return;
  const cv = mkChart('frFt', 170);
  const tmax = Math.max(FR.ftData[FR.ftData.length - 1][0], 1.5);
  const fmax = Math.max(FR.fMax, FR.fKin, FR_SURFS[FR.surf].mu * frN() * 1.3, 1);
  const m = chartAxes(cv, { xl: 't/s', yl: 'F/N', xmin: 0, xmax: Math.max(tmax, 3), ymin: 0, ymax: fmax * 1.2 });
  chartLine(m, FR.ftData, cssHex('arrowF'), 4);
  if (FR.fMax) {
    chartLine(m, [[0, FR.fMax], [tmax, FR.fMax]], 'rgba(200,120,90,0.75)', 2.5, [8, 7]);
    chartText(m, '最大静摩擦 ' + FR.fMax.toFixed(2) + ' N', 0.2, fmax * 1.08, 'rgba(220,150,110,1)', 19);
  }
  if (FR.fKin) {
    chartLine(m, [[0, FR.fKin], [tmax, FR.fKin]], 'rgba(90,170,140,0.8)', 2.5, [8, 7]);
    chartText(m, '滑动摩擦', tmax * 0.66, FR.fKin * 1.14, 'rgba(120,210,170,1)', 19);
  }
}
/* f-N 分组拟合（斜率 = μ）画在记录区 */
FR.grouped = {};
function frLogChart(cv) {
  const ctx = cv.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  const groups = FR.grouped;
  const keys = Object.keys(groups);
  if (!keys.length) return;
  const nMax = Math.max(...keys.map((k) => Math.max(...groups[k].map((p) => p[0]))), 2) * 1.2;
  const fMax = Math.max(...keys.map((k) => Math.max(...groups[k].map((p) => p[1]))), 1) * 1.3;
  const m = chartAxes(cv, { xl: '压力 N/N', yl: 'f/N', xmin: 0, xmax: nMax, ymin: 0, ymax: fMax });
  const colors = ['#ffb52e', '#5cc8ff', '#ff8a7a', '#9be38c'];
  keys.forEach((k, gi) => {
    const pts = groups[k];
    const col = colors[gi % colors.length];
    chartDots(m, pts, col, 6);
    if (pts.length >= 2) {
      const n1 = pts.length;
      let sx = 0, sy = 0, sxx = 0, sxy = 0;
      pts.forEach(([x1, y1]) => { sx += x1; sy += y1; sxx += x1 * x1; sxy += x1 * y1; });
      const kk = (n1 * sxy - sx * sy) / Math.max(n1 * sxx - sx * sx, 1e-9);
      const bb = (sy - kk * sx) / n1;
      chartLine(m, [[0, Math.max(bb, 0)], [nMax, kk * nMax + bb]], col, 3, [9, 7]);
      chartText(m, k + '：斜率 μ≈' + kk.toFixed(2), 0.1, fMax - gi * fMax * 0.09, col, 18);
    }
  });
}
function fricCtl() {
  ctl.clear();
  ctl.slider({ label: '木块上的砝码', min: 0, max: 5, step: 1, value: FR.weights, fmt: (v) => v + ' 个 × 100 g', onInput: (v) => { FR.weights = v; if (!FR.run) frPlace(); frHud(); } });
  const sb = [];
  const paintS = () => sb.forEach(({ b, v }) => b.classList.toggle('active', v === FR.surf));
  FR_SURFS.forEach((s, i) => {
    const b = ctl.button({ label: s.name, onClick: () => { FR.surf = i; frPlace(); frHud(); paintS(); } });
    sb.push({ b, v: i });
  });
  paintS();
  ctl.slider({ label: '电机拉动速度', min: 0.2, max: 1.2, step: 0.1, value: FR.motorV, fmt: (v) => '×' + v.toFixed(1), onInput: (v) => { FR.motorV = v; } });
  ctl.sep();
  hintEl('空格 启动电机 · 在 F-t 图找最大静摩擦 · 加砝码重复并记录 · 更换接触面比较 μ');
  setHudRows([['st', '状态'], ['N', '压力 N'], ['F', '测力计示数'], ['fmax', '最大静摩擦'], ['f', '滑动摩擦 f'], ['mu', '动摩擦因数']]);
  logSetCols('fric', ['接触面', 'N/N', 'f max/N', 'f 滑/N', 'μ']);
  const noteEl = document.getElementById('chartNote');
  if (noteEl) noteEl.textContent = 'f–N 分组散点与拟合：每种接触面各成一条直线，斜率即该面的 μ。';
  frReset();
}

/* ================= 章 6 · 斜面与力的分解 ================= */

const IN = {
  ang: 24, G: 30, mu: 0.28, weights: 0,
  slidT: -1, sliding: false, slidX: 0,
};
const IN_LEN = 4.6;
function inMuTot() { return IN.mu; }
function inBlockG() { return IN.G + IN.weights; }

function buildIncline(g) {
  buildBench(g, 12, false);
  /* 铰链支座（左端） */
  const hingeM = matStd(CV.steelDeep, { roughness: 0.45, metalness: 0.55 });
  const hingeBase = box(0.3, 0.14, 0.6, hingeM);
  hingeBase.position.set(-3.3, BENCH_Y + 0.11, 0);
  g.add(hingeBase);
  for (let i = 0; i < 3; i++) {
    const knuckle = cyl(0.045, 0.045, 0.05, matStd(CV.chrome, { roughness: 0.3, metalness: 0.8 }), 12);
    knuckle.rotation.x = Math.PI / 2;
    knuckle.position.set(-3.3, BENCH_Y + 0.21, -0.16 + i * 0.16);
    g.add(knuckle);
  }
  const pin = cyl(0.022, 0.022, 0.56, matStd(CV.chrome, { roughness: 0.3, metalness: 0.85 }), 10);
  pin.rotation.x = Math.PI / 2;
  pin.position.set(-3.3, BENCH_Y + 0.21, 0);
  g.add(pin);
  /* 木板（绕铰链转） */
  IN.plank = new THREE.Group();
  const plankM = matStd(0xffffff, { roughness: 0.8 });
  plankM.map = frSurfaceTexture('wood').tex;
  const plank = box(IN_LEN, 0.08, 1.1, plankM);
  plank.geometry.translate(IN_LEN / 2, 0, 0);
  IN.plank.add(plank);
  /* 板面角铁包边 */
  const trim = box(IN_LEN, 0.02, 0.06, matStd(CV.steelDeep, { roughness: 0.5, metalness: 0.5 }));
  trim.geometry.translate(IN_LEN / 2, 0, 0);
  trim.position.y = 0.045;
  IN.plank.add(trim);
  IN.plank.position.set(-3.3, BENCH_Y + 0.21, 0);
  g.add(IN.plank);
  /* 红色摇柄卷筒（右端，支撑杆顶托木板） */
  IN.crank = makeCrank(CV.paintOrange);
  IN.crank.position.set(2.1, BENCH_Y + 0.16, 0.55);
  g.add(IN.crank);
  const crankBase = box(0.3, 0.1, 0.3, matStd(CV.steelDeep, { roughness: 0.5, metalness: 0.5 }));
  crankBase.position.set(2.1, BENCH_Y + 0.11, 0.55);
  g.add(crankBase);
  IN.crankLbl = label('倾角摇柄（拖动）', '#ffb08a', 0.0052);
  IN.crankLbl.position.set(2.1, BENCH_Y + 0.75, 0.55);
  g.add(IN.crankLbl);
  /* 支撑杆（卷筒 → 板底） */
  IN.rod = makeRope(0x9aa4ae, 0.026);
  g.add(IN.rod);
  /* 木块 + 砝码 */
  IN.blk = new THREE.Group();
  const body = box(0.6, 0.36, 0.56, matStd(0x8a6845, { roughness: 0.85 }));
  body.position.y = 0.18;
  IN.blk.add(body);
  IN.wts = new THREE.Group();
  const wtM = matStd(CV.brass, { roughness: 0.35, metalness: 0.7 });
  for (let i = 0; i < 4; i++) {
    const w = cyl(0.085, 0.078, 0.04, wtM, 18);
    w.position.y = 0.38 + i * 0.045;
    w.visible = false;
    IN.wts.add(w);
  }
  IN.blk.add(IN.wts);
  IN.slidG = new THREE.Group();
  IN.slidG.add(IN.blk);
  g.add(IN.slidG);
  /* 量角器背板（铰链处竖立） */
  const pro = mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: protractorTexture(60).tex, transparent: true, opacity: 0.96 }));
  pro.position.set(-3.3, BENCH_Y + 0.95, -0.62);
  g.add(pro);
  IN.needle = box(0.9, 0.03, 0.01, matStd(0xc8452e, { roughness: 0.5 }));
  IN.needle.geometry.translate(0.45, 0, 0);
  IN.needle.position.set(-3.3, BENCH_Y + 0.23, -0.6);
  g.add(IN.needle);
  /* 力箭头（重力 / 两分力 / 支持 / 摩擦） */
  IN.aG = makeArrow(CV.arrowG);
  IN.aG1 = makeArrow(0xe86a5a);
  IN.aG2 = makeArrow(0x8f7fe8);
  IN.aN = makeArrow(CV.arrowN);
  IN.aF = makeArrow(CV.arrowFr);
  g.add(IN.aG, IN.aG1, IN.aG2, IN.aN, IN.aF);
  IN.lbl = label('', '#ffd166', 0.005);
  g.add(IN.lbl);
  IN.critLbl = label('', '#9fdcb0', 0.0048);
  g.add(IN.critLbl);
  registerDrag({
    kind: 'knob', group: IN.crank, hitMesh: IN.crank,
    onDrag: (dx) => {
      IN.ang = clamp(IN.ang - dx * 0.28, 8, 45);
      if (IN.slidT < 0) inPlace();
    },
  });
  inPlace();
}
function inPlace() {
  const th = IN.ang * DEG;
  IN.plank.rotation.z = th;
  IN.crank.rotation.z = -IN.ang * 0.16;
  /* 支撑杆：卷筒顶 → 板底接触点（沿板 0.72 处） */
  const bx = -3.3 + Math.cos(th) * IN_LEN * 0.72;
  const by = BENCH_Y + 0.21 + Math.sin(th) * IN_LEN * 0.72;
  IN.rod.set(V3(2.1, BENCH_Y + 0.3, 0.55), V3(bx, by - 0.05, 0.35));
  IN.needle.rotation.z = th;
  /* 木块位置：滑动时沿板下滑，否则停 0.52 处 */
  const d = IN.slidT >= 0 ? clamp(0.52 + IN.slidX, 0.52, IN_LEN - 0.3) : 0.52;
  IN.blk.position.set(Math.cos(th) * IN_LEN * d, 0.08 + Math.sin(th) * IN_LEN * d, 0);
  IN.blk.rotation.z = th;
  /* 力箭头 */
  const cx = IN.blk.position.x, cy = IN.blk.position.y + 0.3;
  const Gt = inBlockG();
  IN.aG.set(V3(cx, cy, 0.3), V3(cx, cy - Math.min(1.3, Gt / 26), 0.3), 'G=' + Gt.toFixed(0) + ' N');
  if (FORCES.on || true) {
    const g1 = Gt * Math.sin(th), g2 = Gt * Math.cos(th);
    const dirDown = V3(-Math.cos(th), -Math.sin(th), 0);
    const dirPress = V3(Math.sin(th), -Math.cos(th), 0);
    IN.aG1.set(V3(cx, cy, 0.3), V3(cx + dirDown.x * (0.3 + g1 / 34), cy + dirDown.y * (0.3 + g1 / 34), 0.3), 'G∥=' + g1.toFixed(1) + ' N');
    IN.aG2.set(V3(cx, cy, -0.3), V3(cx + dirPress.x * (0.3 + g2 / 40), cy + dirPress.y * (0.3 + g2 / 40), -0.3), 'G⊥=' + g2.toFixed(1) + ' N');
  }
  /* 静摩擦 / 支持力（受力分析开启时） */
  const mu = inMuTot();
  const slides = Math.tan(th) > mu;
  if (FORCES.on) {
    const dirUp = V3(Math.cos(th), Math.sin(th), 0);
    const dirN = V3(-Math.sin(th), Math.cos(th), 0);
    const f = slides ? mu * Gt * Math.cos(th) : Gt * Math.sin(th);
    IN.aF.set(V3(cx, cy - 0.25, 0.3), V3(cx + dirUp.x * (0.25 + f / 34), cy + dirUp.y * (0.25 + f / 34), 0.3), slides ? 'f 滑=' + f.toFixed(1) + ' N' : 'f 静=' + f.toFixed(1) + ' N');
    IN.aN.set(V3(cx, cy, -0.3), V3(cx + dirN.x * (0.3 + Gt * Math.cos(th) / 40), cy + dirN.y * (0.3 + Gt * Math.cos(th) / 40), -0.3), 'N=' + (Gt * Math.cos(th)).toFixed(1) + ' N');
  } else { IN.aF.hide(); IN.aN.hide(); }
  /* 临界角旗标 */
  const critDeg = Math.atan(mu) / DEG;
  const ca = critDeg * DEG;
  IN.critLbl.position.set(-3.3 + Math.cos(ca) * 2.4, BENCH_Y + 0.25 + Math.sin(ca) * 2.4 + 0.25, -0.5);
  retext(IN.critLbl, '临界角 arctanμ = ' + critDeg.toFixed(1) + '°', '#9fdcb0', 0.0048);
  retext(IN.lbl, 'θ = ' + IN.ang.toFixed(0) + '°', '#ffd166', 0.005);
  IN.lbl.position.set(-3.3 + Math.cos(th * 0.5) * 1.3, BENCH_Y + 0.3 + Math.sin(th * 0.5) * 1.3, -0.5);
  if (hud) {
    const G1 = Gt * Math.sin(th), G2 = Gt * Math.cos(th);
    hset('th', IN.ang.toFixed(1) + '°');
    hset('g1', G1.toFixed(1) + ' N（下滑分力）');
    hset('g2', G2.toFixed(1) + ' N（压紧斜面）');
    hset('st2', slides
      ? '下滑！a = ' + (9.8 * (Math.sin(th) - mu * Math.cos(th))).toFixed(2) + ' m/s²'
      : '静止：静摩擦平衡 G∥');
    hset('crit', critDeg.toFixed(1) + '°（与质量无关）');
  }
}
function inStart() {
  /* 释放木块：满足条件则下滑动画，到底后自动记录临界角 */
  const th = IN.ang * DEG;
  const mu = inMuTot();
  IN.slidX = 0;
  if (Math.tan(th) > mu) {
    IN.slidT = 0;
    IN.sliding = true;
    IN.aCur = 9.8 * (Math.sin(th) - mu * Math.cos(th));
    setStatus('running');
    sfx('click');
  } else {
    IN.slidT = -1;
    toast('tanθ = ' + Math.tan(th).toFixed(2) + ' ≤ μ = ' + mu.toFixed(2) + '：木块稳如泰山。', 'ok');
    sfx('beep');
  }
}
function stepIncline(dt) {
  if (IN.slidT < 0) return;
  IN.slidT += dt;
  const th = IN.ang * DEG;
  const mu = inMuTot();
  const a = Math.max(9.8 * (Math.sin(th) - mu * Math.cos(th)), 0.05);
  IN.slidX += 0.5 * a * dt * dt;
  if (IN.slidX >= IN_LEN * 0.4) {
    IN.slidT = -1;
    IN.sliding = false;
    setStatus('done');
    sfx('thud');
    logAddRow('incline', [inBlockG().toFixed(0) + ' N', IN.mu.toFixed(2), IN.ang.toFixed(1) + '°', (Math.atan(mu) / DEG).toFixed(1) + '°']);
    inPlace();
    return;
  }
  inPlace();
}
function inclineCtl() {
  ctl.clear();
  ctl.slider({ label: '倾角 θ（也可拖摇柄）', min: 8, max: 45, step: 1, value: IN.ang, fmt: (v) => v + '°', onInput: (v) => { IN.ang = v; if (IN.slidT < 0) inPlace(); } });
  ctl.slider({ label: '物重 G（木块 30 N 起）', min: 30, max: 70, step: 5, value: IN.G, fmt: (v) => v + ' N', onInput: (v) => { IN.G = v - IN.weights * 5; IN.weights = Math.round((v - 30) / 5); IN.wts.children.forEach((w, i) => { w.visible = i < IN.weights; }); if (IN.slidT < 0) inPlace(); } });
  ctl.slider({ label: '接触面静摩擦因数 μ', min: 0.1, max: 0.8, step: 0.02, value: IN.mu, fmt: (v) => v.toFixed(2), onInput: (v) => { IN.mu = v; if (IN.slidT < 0) inPlace(); } });
  ctl.sep();
  ctl.button({ label: '↺ 木块放回', onClick: () => { IN.slidT = -1; IN.sliding = false; IN.slidX = 0; inPlace(); setStatus('ready'); } });
  hintEl('拖动红色摇柄改变倾角 · 观察 G∥ 与静摩擦变化 · 找到刚要下滑的临界角 · 加砝码再找一次（角度不变！）');
  setHudRows([['st', '状态'], ['th', '倾角 θ'], ['g1', 'G∥ = G·sinθ'], ['g2', 'G⊥ = G·cosθ'], ['st2', '滑/静'], ['crit', '临界角']]);
  logSetCols('incline', ['总重', 'μ', '临界角 θ（实测）', 'arctanμ（理论）']);
  inPlace();
  setStatus('ready');
}

/* ================= 章 7 · 超重与失重 ================= */

const LF = {
  mode: 'idle',           // idle | up | down | snap
  m: 2,                   // 砝码 kg
  y: 1.2, v: 0, a: 0, t: -1, run: false,
  phase: 0, phaseT: 0,
};
const LF_TOP = 5.6, LF_BOT = 0.5;

function buildLift(g) {
  /* 井道：导轨 + 楼层板 + 顶部曳引机 */
  const railM = matStd(CV.trackTop, { roughness: 0.3, metalness: 0.7 });
  [-0.95, 0.95].forEach((x) => {
    const rail = box(0.09, LF_TOP + 1.4, 0.09, railM);
    rail.position.set(x, (LF_TOP + 1.4) / 2, -0.55);
    g.add(rail);
  });
  const pitM = matStd(0x3a4048, { roughness: 0.9 });
  const pit = box(2.6, 0.2, 1.6, pitM);
  pit.position.set(0, 0.1, -0.35);
  g.add(pit);
  /* 楼层标记牌（1F/2F/3F） */
  [1.2, 3.2, 5.2].forEach((y, i) => {
    const sign = mesh(new THREE.PlaneGeometry(0.5, 0.22), new THREE.MeshBasicMaterial({ map: nameplate([(i + 1) + 'F', ''], '#5a4030', 200, 90) }));
    sign.position.set(1.35, y, -0.2);
    sign.rotation.y = -0.5;
    g.add(sign);
    const slab = box(2.4, 0.08, 1.4, matStd(tone(PAL.starch, 0.8), { roughness: 0.7 }));
    slab.position.set(0, y - 1.1, -0.35);
    g.add(slab);
  });
  /* 顶部横梁 + 曳引机 */
  const beam = box(3.2, 0.18, 0.3, railM);
  beam.position.set(0, LF_TOP + 1.0, -0.55);
  g.add(beam);
  const mach = new THREE.Group();
  const mBody = box(0.5, 0.36, 0.42, matCoat(CV.paintBlue, { roughness: 0.36 }));
  mach.add(mBody);
  const sheave = cyl(0.16, 0.16, 0.1, matStd(CV.steelDeep, { roughness: 0.4, metalness: 0.6 }), 18);
  sheave.rotation.x = Math.PI / 2;
  sheave.position.set(0, 0.24, 0);
  mach.add(sheave);
  LF.sheave = sheave;
  mach.position.set(0, LF_TOP + 1.28, -0.55);
  g.add(mach);
  const machLbl = label('曳引机', '#dfe8ee', 0.0045);
  machLbl.position.set(0, LF_TOP + 1.7, -0.55);
  g.add(machLbl);
  /* 轿厢（玻璃壳 + 钢框 + 内台秤 + 砝码） */
  const cab = new THREE.Group();
  const glass = box(1.5, 2.0, 1.3, matGlass(0xd6e6ee, { roughness: 0.1, transmission: 0.85, thickness: 0.1, opacity: 0.4 }));
  glass.position.y = 1.1;
  cab.add(glass);
  const frameM = matStd(CV.steelDeep, { roughness: 0.45, metalness: 0.6 });
  [[-0.72, 0.1], [0.72, 0.1], [-0.72, 2.0], [0.72, 2.0]].forEach(([x, y]) => {
    const post = box(0.08, 0.1, 1.3, frameM);
    post.position.set(x, y, 0);
    cab.add(post);
  });
  const cabTop = box(1.6, 0.09, 1.4, frameM);
  cabTop.position.y = 2.12;
  cab.add(cabTop);
  const cabBot = cabTop.clone();
  cabBot.position.y = 0.06;
  cab.add(cabBot);
  /* 台秤（LCD 大屏） */
  const scale = new THREE.Group();
  const sBase = box(0.62, 0.07, 0.5, matStd(CV.steel, { roughness: 0.4, metalness: 0.5 }));
  scale.add(sBase);
  LF.lcd = makeLcd(256, 128, '19.6 N', ['N 台秤示数', 'm=2.0 kg']);
  const sLcd = mesh(new THREE.PlaneGeometry(0.56, 0.2), new THREE.MeshBasicMaterial({ map: LF.lcd.tex }));
  sLcd.position.set(0, 0.15, 0.2);
  sLcd.rotation.x = -0.7;
  scale.add(sLcd);
  scale.position.set(0, 0.1, 0.2);
  cab.add(scale);
  /* 砝码块（完全失重时微微漂浮） */
  LF.weight = new THREE.Group();
  const wBody = cyl(0.16, 0.16, 0.2, matStd(CV.brass, { roughness: 0.35, metalness: 0.7 }), 18);
  LF.weight.add(wBody);
  const knobW = cyl(0.05, 0.05, 0.06, matStd(CV.chrome, { roughness: 0.3, metalness: 0.85 }), 12);
  knobW.position.y = 0.13;
  LF.weight.add(knobW);
  LF.weight.position.set(0, 0.25, 0.2);
  cab.add(LF.weight);
  /* 吊环 + 钢缆 */
  const slingM = matStd(CV.chrome, { roughness: 0.3, metalness: 0.8 });
  [-0.5, 0.5].forEach((x) => {
    const ring = mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 16), slingM);
    ring.position.set(x, 2.2, 0);
    cab.add(ring);
  });
  cab.position.set(0, LF.y, -0.3);
  g.add(cab);
  LF.cab = cab;
  /* 钢缆（轿厢 ↔ 曳引轮）与对重 */
  LF.cable = makeRope(0xb8beca, 0.02);
  g.add(LF.cable);
  LF.cable2 = makeRope(0xb8beca, 0.02);
  g.add(LF.cable2);
  const counter = new THREE.Group();
  const cBlock = box(0.5, 0.9, 0.16, matStd(CV.steelDeep, { roughness: 0.5, metalness: 0.55 }));
  counter.add(cBlock);
  for (let i = 0; i < 3; i++) {
    const rib = box(0.52, 0.02, 0.18, matStd(CV.chrome, { roughness: 0.4, metalness: 0.6 }));
    rib.position.y = -0.3 + i * 0.3;
    counter.add(rib);
  }
  counter.position.set(1.35, LF_TOP - LF.y + 1, -0.55);
  g.add(counter);
  LF.counter = counter;
  /* 缓冲器（坑底） */
  const bufM = matStd(CV.paintOrange, { roughness: 0.55 });
  const buf = cyl(0.16, 0.2, 0.24, bufM, 14);
  buf.position.set(0, 0.32, -0.3);
  g.add(buf);
  LF.aGhost = makeGhostMaker(g, 'sphere', CV.vacuole);
  lfReset();
}
function lfReset() {
  LF.t = -1; LF.run = false; LF.mode = 'idle';
  LF.y = 1.2; LF.v = 0; LF.a = 0; LF.phase = 0; LF.phaseT = 0;
  LF.atData = [];
  LF.aGhost.clear();
  resetReplay();
  lfPlace();
  lfHud();
  setStatus('ready');
}
function lfPlace() {
  LF.cab.position.y = LF.y;
  LF.counter.position.y = clamp(LF_TOP - LF.y + 1, 0.9, LF_TOP);
  LF.sheave.rotation.z -= 0;
  LF.cable.set(V3(-0.5, LF_TOP + 1.14, -0.45), V3(-0.5, LF.y + 2.24, -0.3));
  LF.cable2.set(V3(0.5, LF_TOP + 1.14, -0.45), V3(0.5, LF.y + 2.24, -0.3));
  /* 失重漂浮 */
  const float = LF.mode === 'snap' ? Math.min(0.25, Math.max(0, 0.5 + LF.a * 0.05)) : 0;
  LF.weight.position.set(0, 0.25 + float * (LF.a < -2 ? 1 : 0), 0.2);
}
function lfProfile(mode, t) {
  /* a(t) 阶梯：启动 1.2s 加速 → 匀速 → 到位前减速 */
  const A = 1.1;
  const T1 = 1.3, T2 = mode === 'snap' ? 0 : 1.6;
  if (mode === 'snap') return -9.8;
  if (t < T1) return A;
  if (t < T1 + T2) return 0;
  if (t < T1 + T2 + T1) return -A;
  return 0;
}
function lfStart(mode) {
  lfReset();
  LF.mode = mode;
  LF.run = true;
  LF.t = 0;
  setStatus('running');
  sfx('click');
}
function stepLift(dt) {
  if (REPLAY.active) { replayAdvance(dt); return; }
  if (!LF.run) return;
  LF.t += dt;
  const prevV = LF.v;
  LF.a = lfProfile(LF.mode, LF.t);
  if (LF.mode === 'snap') {
    LF.v += -9.8 * dt;
    LF.y += LF.v * dt;
    if (LF.y <= LF_BOT) {
      LF.y = LF_BOT;
      LF.run = false; LF.t = -2;
      LF.a = 0; LF.v = 0;
      setStatus('done');
      sfx('thud');
      logAddRow('lift', ['缆绳断开', '下坠', '-9.8', '0 → 落底', '完全失重后触底']);
      toast('完全失重：下落全程台秤示数 = 0。', 'warn');
    }
  } else {
    LF.v += LF.a * dt;
    const dir = LF.mode === 'up' ? 1 : -1;
    LF.y += LF.v * dir * dt * 0.9;
    if (LF.t > 1.3 + 1.6 + 1.4 || LF.y >= LF_TOP || LF.y <= LF_BOT) {
      LF.y = clamp(LF.y, LF_BOT, LF_TOP);
      LF.run = false; LF.t = -2;
      LF.a = 0; LF.v = 0;
      setStatus('done');
      sfx('beep');
      logAddRow('lift', [LF.mode === 'up' ? '上行' : '下行', '启动/匀速/制动', '+1.1 → 0 → −1.1', LF.mode === 'up' ? '> mg' : '< mg', '超重→正常→失重']);
    }
  }
  lfPlace();
  lfHud();
  LF.atData.push([LF.t, LF.a]);
  if (LF.atData.length > 500) LF.atData.shift();
  lfAtPlot();
  recordSample(LF.t, [LF.y, LF.a]);
}
function lfHud() {
  const N = Math.max(LF.m * (9.8 + (LF.mode === 'snap' ? -9.8 : LF.a)), 0);
  LF.lcd && LF.lcd.set(N.toFixed(1) + ' N', 'N 台秤示数', 'm=' + LF.m.toFixed(1) + ' kg');
  const st = !LF.run && LF.mode === 'idle' ? '静止'
    : LF.mode === 'snap' ? '完全失重：N = 0'
      : Math.abs(LF.a) < 0.15 ? '匀速：N = mg'
        : LF.a > 0 ? '超重：N = m(g+a)' : '失重：N = m(g−a)';
  hset('st', st);
  hset('N', N.toFixed(1) + ' N');
  hset('mg', (LF.m * 9.8).toFixed(1) + ' N');
  hset('a', LF.a.toFixed(1) + ' m/s²');
}
/* a-t 曲线 */
function lfAtPlot() {
  if (!LF.atData.length) return;
  const cv = mkChart('lfAt', 170);
  const tmax = Math.max(LF.atData[LF.atData.length - 1][0], 2);
  const m = chartAxes(cv, { xl: 't/s', yl: 'a', xmin: 0, xmax: Math.max(tmax, 4), ymin: -10.5, ymax: 3 });
  chartLine(m, LF.atData, cssHex('arrowG'), 4);
  chartLine(m, [[0, 0], [tmax, 0]], 'rgba(140,150,165,0.55)', 2, [8, 8]);
}
function liftCtl() {
  ctl.clear();
  const mb = [];
  const paintM = () => mb.forEach(({ b, v }) => b.classList.toggle('active', v === LF.mode));
  [['up', '▲ 上行'], ['down', '▼ 下行'], ['snap', '⚠ 缆绳断开']].forEach(([v, t2]) => {
    const b = ctl.button({ label: t2, onClick: () => { lfStart(v); paintM(); } });
    mb.push({ b, v });
  });
  paintM();
  ctl.slider({ label: '砝码质量 m', min: 1, max: 5, step: 0.5, value: LF.m, fmt: (v) => v.toFixed(1) + ' kg', onInput: (v) => { LF.m = v; if (!LF.run) lfHud(); } });
  ctl.sep();
  hintEl('选择运行方式 按 空格 启动（或直接点按钮） · 对照 a-t 图看台秤示数 · 试试缆绳断开');
  setHudRows([['st', '状态'], ['N', '台秤示数 N'], ['mg', '砝码重 mg'], ['a', '加速度 a']]);
  logSetCols('lift', ['方式', '阶段', 'a 曲线', 'N 对比 mg', '判定']);
  lfReset();
}

/* ================= 章 8 · 机械能守恒（气垫摆） ================= */

const PD = {
  ang0: 40, len: 2.1, pump: true,
  th: 0, w: 0, t: 0, playing: true,
  E0: 0, Q: 0, logT: 0,
};
function buildPend(g) {
  /* A 字架 + 横梁 + 量角器背板 */
  const frameM = matStd(CV.steelDeep, { roughness: 0.48, metalness: 0.55 });
  const stand = new THREE.Group();
  [-1, 1].forEach((s) => {
    const leg = box(0.12, 3.3, 0.12, frameM);
    leg.position.set(s * 0.75, 1.65, -0.7);
    leg.rotation.z = s * 0.22;
    stand.add(leg);
    const foot = box(0.4, 0.06, 0.3, matStd(0x1a1e24, { roughness: 0.9 }));
    foot.position.set(s * 1.1, 0.03, -0.7);
    stand.add(foot);
  });
  const beam = box(2.4, 0.12, 0.14, frameM);
  beam.position.set(0, 3.15, -0.7);
  stand.add(beam);
  const xbar = box(1.6, 0.08, 0.1, frameM);
  xbar.position.set(0, 1.4, -0.7);
  stand.add(xbar);
  g.add(stand);
  /* 气垫泵装置（底座箱 + LED + 软管到枢轴） */
  const pump = new THREE.Group();
  const pBody = box(0.5, 0.3, 0.36, matCoat(CV.paintCream, { roughness: 0.4 }));
  pBody.position.y = 0.15;
  pump.add(pBody);
  const pPlate = mesh(new THREE.PlaneGeometry(0.34, 0.14), new THREE.MeshBasicMaterial({ map: nameplate(['气垫泵', '枢轴气浮'], '#5a4030', 280, 110) }));
  pPlate.position.set(0, 0.17, 0.182);
  pump.add(pPlate);
  PD.pumpLed = matGlow(CV.led, 1.2);
  const pLed = mesh(new THREE.SphereGeometry(0.03, 10, 8), PD.pumpLed);
  pLed.position.set(0.18, 0.32, 0.1);
  pump.add(pLed);
  const hose = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0.2, 0.24, 0), V3(0.55, 1.2, -0.2), V3(0.55, 2.6, -0.55), V3(0.15, 3.1, -0.7)]), 20, 0.022, 8, false), matStd(0x2a3038, { roughness: 0.9 }));
  pump.add(hose);
  pump.position.set(-1.4, 0, 0.1);
  g.add(pump);
  PD.pumpP = pump;
  const shP = shadowBlob(0.6, 0.3);
  shP.position.set(-1.4, 0.003, 0.1);
  g.add(shP);
  /* 量角器背板（枢轴后方） */
  const pro = mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: protractorTexture(60).tex, transparent: true, opacity: 0.95 }));
  pro.position.set(0, 3.12, -1.15);
  g.add(pro);
  /* 枢轴 + 摆杆 + 黄铜摆锤 */
  PD.pivot = V3(0, 3.05, 0);
  const hub = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.09, 16), matStd(CV.chrome, { roughness: 0.3, metalness: 0.85 }));
  hub.rotation.x = Math.PI / 2;
  hub.position.set(0, 3.05, -0.12);
  g.add(hub);
  PD.rod = mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 10), matStd(CV.chrome, { roughness: 0.3, metalness: 0.8 }));
  PD.rod.geometry.translate(0, 0.5, 0);
  g.add(PD.rod);
  const bobM = matStd(CV.brass, { roughness: 0.3, metalness: 0.7 });
  PD.bob = mesh(new THREE.SphereGeometry(0.2, 20, 16), bobM);
  g.add(PD.bob);
  const bobRing = mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 24), matStd(CV.chrome, { roughness: 0.3, metalness: 0.85 }));
  PD.bob.add(bobRing);
  PD.bobRing = bobRing;
  /* 最低点参考线 + 高度标注 */
  const refLine = makeDim(0x8fd3a0);
  g.add(refLine);
  PD.refLine = refLine;
  PD.ghosts = makeGhostMaker(g, 'sphere', CV.brass);
  pdReset();
}
function pdEnergy() {
  const th0 = PD.ang0 * DEG;
  const hMax = PD.len * (1 - Math.cos(th0));
  const elev = PD.len * (1 - Math.cos(Math.abs(PD.th)));
  const Ep = 9.8 * elev;                       // 单位质量（J/kg 口径，摆角）
  const Ek = Math.max(9.8 * hMax - Ep, 0) * PD.pumpFade;
  return { Ep, Ek, E: Ep + Ek, hMax };
}
PD.pumpFade = 1;
function pdReset() {
  PD.th = PD.ang0 * DEG;
  PD.w = 0;
  PD.t = 0;
  PD.Q = 0;
  PD.E0 = 0;
  PD.pumpFade = 1;
  PD.playing = true;
  PD.logT = 0;
  PD.ghosts.clear();
  resetReplay();
  PD.pumpLed.color.set(PD.pump ? CV.led : 0xc8452e);
  PD.pumpLed.emissive.set(PD.pump ? CV.led : 0xc8452e);
  pdPlace();
  pdHud();
  setStatus('ready');
}
function pdPlace() {
  const bx = PD.pivot.x + Math.sin(PD.th) * PD.len;
  const by = PD.pivot.y - Math.cos(PD.th) * PD.len;
  PD.rod.position.copy(PD.pivot);
  PD.rod.scale.y = PD.len;
  PD.rod.rotation.z = -PD.th;
  PD.bob.position.set(bx, by, 0);
  PD.refLine.set(bx - 1.2, bx + 1.2, PD.pivot.y - PD.len + 0.02, 0, '最低点 Ep=0');
}
function pdHud() {
  const { Ep, Ek, E } = pdEnergy();
  const E0 = 9.8 * PD.len * (1 - Math.cos(PD.ang0 * DEG));
  if (!PD.E0) PD.E0 = E0;
  PD.Q = clamp(E0 - E, 0, E0);
  hset('th', (Math.abs(PD.th) / DEG).toFixed(1) + '°');
  hset('ek', (Ek).toFixed(1) + ' J/kg');
  hset('ep', (Ep).toFixed(1) + ' J/kg');
  hset('E', (E).toFixed(1) + ' J/kg（恒定？）');
  hset('Q', (PD.Q).toFixed(1) + ' J/kg');
  pdBarsPlot(Ep, Ek, PD.Q, E0);
}
/* 能量柱：Ep / Ek / Q 三段堆叠柱 + 总量横线 */
function pdBarsPlot(Ep, Ek, Q, E0) {
  const cv = mkChart('pdBars', 176);
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const st = getComputedStyle(document.documentElement);
  const fg = st.getPropertyValue('--text-faint').trim() || '#8892a0';
  const total = E0 || 1;
  const bx = W * 0.24, bw = W * 0.52, by0 = H * 0.82, bh = H * 0.62;
  const seg = (v, color, yTop) => {
    const hh = (v / total) * bh;
    ctx.fillStyle = color;
    ctx.fillRect(bx, yTop - hh, bw, hh);
    return yTop - hh;
  };
  ctx.fillStyle = 'rgba(140,150,165,0.14)';
  ctx.fillRect(bx - 8, by0 - bh, bw + 16, bh);
  let yTop = by0;
  yTop = seg(Ep, 'rgba(80,160,140,0.9)', yTop);
  yTop = seg(Ek, 'rgba(226,148,74,0.92)', yTop);
  yTop = seg(Q, 'rgba(200,90,70,0.9)', yTop);
  ctx.fillStyle = fg;
  ctx.font = '21px -apple-system, sans-serif';
  ctx.fillText('Ep 势能', bx - 10, by0 - bh * (Ep / total) * 0.5 - 6);
  if (Ek > 1) ctx.fillText('Ek 动能', bx + bw + 10, by0 - (Ep / total) * bh - (Ek / total) * bh * 0.5 - 6, W - bx - bw - 12);
  if (Q > 1) ctx.fillText('Q 内能', bx + bw + 10, yTop + 22, W - bx - bw - 12);
  ctx.strokeStyle = 'rgba(220,200,140,0.85)';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath(); ctx.moveTo(bx - 8, by0 - bh); ctx.lineTo(bx + bw + 8, by0 - bh); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = fg;
  ctx.font = '20px -apple-system, sans-serif';
  ctx.fillText('E 总量（守恒线）', bx, by0 - bh - 14);
}
function stepPend(dt) {
  if (REPLAY.active) { replayAdvance(dt); return; }
  if (!PD.playing) return;
  const w0 = Math.sqrt(9.8 / PD.len);
  PD.t += dt * w0;
  if (PD.pump) {
    /* 气垫：无阻尼谐振 */
    PD.th = PD.ang0 * DEG * Math.cos(PD.t);
    PD.pumpFade = 1;
  } else {
    /* 泵停：指数衰减 + 内能累积 */
    PD.pumpFade = Math.max(Math.exp(-0.22 * PD.t), 0.04);
    PD.th = PD.ang0 * DEG * Math.cos(PD.t) * PD.pumpFade;
    /* Q 以固定速率增长（摩擦耗散），封顶 */
    PD.Q = Math.min(PD.Q + 9.8 * PD.len * (1 - Math.cos(PD.ang0 * DEG)) * 0.22 * Math.exp(-0.22 * PD.t) * dt * w0, 9.8 * PD.len * (1 - Math.cos(PD.ang0 * DEG)));
  }
  pdPlace();
  pdHud();
  /* 泵停时每 4 s 自动记一行衰减数据 */
  if (!PD.pump) {
    PD.logT += dt;
    if (PD.logT > 4) {
      PD.logT = 0;
      const { E } = pdEnergy();
      logAddRow('pend', [(Math.abs(PD.th) / DEG).toFixed(1) + '°', (9.8 * PD.len * (1 - Math.cos(PD.ang0 * DEG))).toFixed(1), E.toFixed(1), PD.Q.toFixed(1)]);
    }
  }
  PD.ghostT = (PD.ghostT || 0) + dt;
  if (PD.ghostT > 0.16) { PD.ghostT = 0; PD.ghosts.spawn(PD.bob.position, 1.4); }
  recordSample(PD.t / w0, [PD.th]);
}
function pendCtl() {
  ctl.clear();
  ctl.slider({ label: '初始摆角', min: 10, max: 60, step: 2, value: PD.ang0, fmt: (v) => v + '°', onInput: (v) => { PD.ang0 = v; if (!PD.playing || true) pdReset(); } });
  ctl.slider({ label: '摆长', min: 1.2, max: 2.8, step: 0.1, value: PD.len, fmt: (v) => v.toFixed(1) + ' m', onInput: (v) => { PD.len = v; pdReset(); } });
  ctl.toggle({ label: '气垫泵（枢轴气浮，关掉会衰减）', value: PD.pump, onChange: (v) => { PD.pump = v; PD.pumpLed.color.set(v ? CV.led : 0xc8452e); PD.pumpLed.emissive.set(v ? CV.led : 0xc8452e); if (!v) { PD.t = 0; PD.logT = 0; logSetCols('pend', ['摆角', 'E 初', 'E 现在', 'Q 内能']); toast('气垫泵已关：枢轴摩擦让摆幅衰减，机械能转内能 Q。', 'warn'); } else { pdReset(); } } });
  ctl.sep();
  hintEl('盯住两根能量柱的高低互换 · 关掉气泵 比较内能 Q 的增长');
  setHudRows([['st', '状态'], ['th', '当前摆角'], ['ek', '动能 Ek'], ['ep', '势能 Ep'], ['E', '机械能 E'], ['Q', '内能 Q']]);
  pdReset();
}

/* ================= 章 9 · 动量守恒 ================= */

const CL = {
  m1: 1.0, v1: 1.4, m2: 1.6, v2: 0,
  kind: 'elas',
  t: -1, run: false, done: false,
  x1: -3.4, x2: 1.4, u1: 0, u2: 0, squash: 0,
};
const CL_E = { elas: 1, partial: 0.5, inel: 0 };
function clAfter() {
  const { m1, v1, m2, v2 } = CL;
  const e = CL_E[CL.kind] ?? 1;
  const dv = v1 - v2;
  const u1 = v1 - (1 + e) * m2 * dv / (m1 + m2);
  const u2 = v2 + (1 + e) * m1 * dv / (m1 + m2);
  return [u1, u2];
}
function buildCollide(g) {
  buildBench(g, 12);
  buildAirTrack(g, { len: 9 });
  CL.c1 = buildCart(g, CV.cartA, { withFlag: false, withHook: false });
  CL.c2 = buildCart(g, CV.cartB, { withFlag: false, withHook: false });
  /* 缓冲器三件套（显隐切换）：弹簧圈 / 橡胶块 / 魔术贴 */
  CL.bufSpring = new THREE.Group();
  [-0.09, 0.09].forEach((z) => {
    const sp = makeSpring(0.16, 0.05, 5, 0.013);
    sp.rotation.x = Math.PI / 2;
    sp.position.set(-0.34, 0.09, z);
    CL.bufSpring.add(sp);
  });
  const spPlate = box(0.03, 0.14, 0.24, matStd(CV.chrome, { roughness: 0.3, metalness: 0.8 }));
  spPlate.position.set(-0.44, 0.09, 0);
  CL.bufSpring.add(spPlate);
  CL.c1.add(CL.bufSpring);
  CL.bufRubber = new THREE.Group();
  const rb = box(0.1, 0.12, 0.24, matStd(0x3a3f45, { roughness: 0.85 }));
  rb.position.set(-0.37, 0.09, 0);
  CL.bufRubber.add(rb);
  CL.c1.add(CL.bufRubber);
  CL.bufVelcro = new THREE.Group();
  const vc = box(0.06, 0.1, 0.24, matStd(0x5a5148, { roughness: 0.95 }));
  vc.position.set(-0.35, 0.09, 0);
  CL.bufVelcro.add(vc);
  CL.c1.add(CL.bufVelcro);
  CL.target = new THREE.Group();
  const tgt = box(0.05, 0.12, 0.26, matStd(CV.chrome, { roughness: 0.4, metalness: 0.6 }));
  tgt.position.set(0.34, 0.09, 0);
  CL.target.add(tgt);
  const vcT = box(0.04, 0.1, 0.24, matStd(0x5a5148, { roughness: 0.95 }));
  vcT.position.set(0.33, 0.09, 0);
  CL.target.add(vcT);
  CL.c2.add(CL.target);
  /* 质量可视砝码（叠在车顶） */
  CL.wt1 = new THREE.Group();
  CL.wt2 = new THREE.Group();
  const wtM = matStd(CV.brass, { roughness: 0.35, metalness: 0.7 });
  [CL.wt1, CL.wt2].forEach((grp, gi) => {
    for (let i = 0; i < 4; i++) {
      const w = cyl(0.08, 0.074, 0.04, wtM, 16);
      w.position.set(0, 0.185 + i * 0.043, 0);
      w.visible = false;
      grp.add(w);
    }
  });
  CL.c1.add(CL.wt1);
  CL.c2.add(CL.wt2);
  CL.lbl1 = label('', '#9fc8ff', 0.0048);
  CL.lbl2 = label('', '#ffc9a0', 0.0048);
  g.add(CL.lbl1, CL.lbl2);
  CL.ghosts1 = makeGhostMaker(g, 'box', CV.cartA);
  CL.ghosts2 = makeGhostMaker(g, 'box', CV.cartB);
  /* 拖拽甩出：A / B 车均可拖，松手速度转为初速 */
  registerDrag({
    kind: 'fling', group: CL.c1, hitMesh: CL.c1, follow: () => ({ x: CL.x1 }),
    onDrag: (x) => { if (!CL.run) { CL.x1 = clamp(x, -4.4, CL.x2 - 0.75); clPlace(); } },
    onEnd: (v) => { if (!CL.run && Math.abs(v) > 0.3) { CL.v1 = clamp(Math.abs(v), 0.3, 3); if (CL.v2 > 0) CL.v2 = -CL.v2; clStart(); toast('甩出去了！v1=' + CL.v1.toFixed(2) + ' m/s', 'ok'); } else if (!CL.run) clPlace(); },
  });
  registerDrag({
    kind: 'fling', group: CL.c2, hitMesh: CL.c2, follow: () => ({ x: CL.x2 }),
    onDrag: (x) => { if (!CL.run) { CL.x2 = clamp(x, CL.x1 + 0.75, 4.4); clPlace(); } },
    onEnd: (v) => { if (!CL.run && Math.abs(v) > 0.3) { CL.v1 = clamp(Math.abs(v), 0.3, 3); clStart(); } else if (!CL.run) clPlace(); },
  });
  clReset();
}
function clKindVis() {
  CL.bufSpring.visible = CL.kind === 'elas';
  CL.bufRubber.visible = CL.kind === 'partial';
  CL.bufVelcro.visible = CL.kind === 'inel';
  CL.target.children[1].visible = CL.kind === 'inel';
  CL.target.children[0].visible = CL.kind !== 'inel';
}
function clPlace() {
  CL.c1.position.set(CL.x1, BENCH_Y + 0.31, 0);
  CL.c2.position.set(CL.x2, BENCH_Y + 0.31, 0);
  const s1 = 0.6 + (CL.m1 - 1) * 0.14, s2 = 0.6 + (CL.m2 - 1) * 0.14;
  CL.c1.scale.setScalar(clamp(s1, 0.7, 1.15));
  CL.c2.scale.setScalar(clamp(s2, 0.7, 1.15));
  CL.wt1.children.forEach((w, i) => { w.visible = CL.m1 > 1 + i * 0.5; });
  CL.wt2.children.forEach((w, i) => { w.visible = CL.m2 > 1 + i * 0.5; });
  retext(CL.lbl1, 'm1=' + CL.m1.toFixed(1) + 'kg', '#9fc8ff', 0.0048);
  retext(CL.lbl2, 'm2=' + CL.m2.toFixed(1) + 'kg', '#ffc9a0', 0.0048);
  CL.lbl1.position.set(CL.x1, BENCH_Y + 0.85, 0);
  CL.lbl2.position.set(CL.x2, BENCH_Y + 0.85, 0);
  clKindVis();
}
function clReset() {
  CL.t = -1; CL.run = false; CL.done = false; CL.squash = 0;
  CL.x1 = -3.4; CL.x2 = 1.4;
  clPlace();
  resetReplay();
  clHud(true);
  setStatus('ready');
}
function clStart() {
  clReset();
  CL.t = 0; CL.run = true;
  setStatus('running');
  sfx('click');
}
function clHud(idle = false) {
  const [u1, u2] = clAfter();
  const p0 = CL.m1 * CL.v1 + CL.m2 * CL.v2;
  const p1 = CL.m1 * u1 + CL.m2 * u2;
  const ek0 = 0.5 * CL.m1 * CL.v1 * CL.v1 + 0.5 * CL.m2 * CL.v2 * CL.v2;
  const ek1 = 0.5 * CL.m1 * u1 * u1 + 0.5 * CL.m2 * u2 * u2;
  const names = { elas: '弹性（弹簧圈）', partial: '一般（橡胶块）', inel: '完全非弹性（魔术贴）' };
  hset('p0', p0.toFixed(2) + ' kg·m/s');
  hset('p1', p1.toFixed(2) + ' kg·m/s（守恒 ✓）');
  hset('ek', ek0.toFixed(2) + ' → ' + ek1.toFixed(2) + ' J');
  hset('loss', ((ek0 - ek1) / Math.max(ek0, 1e-6) * 100).toFixed(0) + '%');
  hset('kind', names[CL.kind]);
  if (!idle) {
    hset('v', 'v1′=' + u1.toFixed(2) + ' · v2′=' + u2.toFixed(2) + ' m/s');
  }
}
function stepCollide(dt) {
  if (REPLAY.active) { replayAdvance(dt); return; }
  if (!CL.run) return;
  CL.t += dt;
  const k = 0.62;
  if (!CL.done) {
    CL.x1 += CL.v1 * k * dt;
    CL.x2 += CL.v2 * k * dt;
    if (CL.x2 - CL.x1 <= 0.78) {
      CL.done = true;
      [CL.u1, CL.u2] = clAfter();
      CL.squash = 1;
      sfx('clack');
      const ek0 = 0.5 * CL.m1 * CL.v1 * CL.v1 + 0.5 * CL.m2 * CL.v2 * CL.v2;
      const ek1 = 0.5 * CL.m1 * CL.u1 * CL.u1 + 0.5 * CL.m2 * CL.u2 * CL.u2;
      const names = { elas: '弹性', partial: '一般', inel: '完全非弹性' };
      logAddRow('collide', [names[CL.kind], (CL.m1 * CL.v1 + CL.m2 * CL.v2).toFixed(2), (CL.m1 * CL.u1 + CL.m2 * CL.u2).toFixed(2), ek0.toFixed(2), ek1.toFixed(2), ((ek0 - ek1) / Math.max(ek0, 1e-6) * 100).toFixed(0) + '%']);
    }
  } else {
    if (CL.kind === 'inel') {
      CL.x1 += CL.u1 * k * dt;
      CL.x2 = CL.x1 + 0.78;
    } else {
      CL.x1 += CL.u1 * k * dt;
      CL.x2 += CL.u2 * k * dt;
    }
    CL.squash = Math.max(CL.squash - dt * 2.4, 0);
  }
  clPlace();
  /* 碰撞压缩动画（弹簧/橡胶视觉回弹） */
  if (CL.done && CL.squash > 0) {
    const q = CL.squash * (CL.kind === 'elas' ? 0.05 : CL.kind === 'partial' ? 0.03 : 0);
    CL.c1.scale.x = clamp(0.6 + (CL.m1 - 1) * 0.14, 0.7, 1.15) + q;
  }
  CL.lbl1.position.set(CL.x1, BENCH_Y + 0.85, 0);
  CL.lbl2.position.set(CL.x2, BENCH_Y + 0.85, 0);
  CL.ghostT = (CL.ghostT || 0) + dt;
  if (CL.ghostT > 0.16) { CL.ghostT = 0; CL.ghosts1.spawn(CL.c1.position); CL.ghosts2.spawn(CL.c2.position); }
  recordSample(CL.t, [CL.x1, CL.x2]);
  if (Math.abs(CL.x1) > 4.4 || Math.abs(CL.x2) > 4.4 || CL.t > 5) {
    CL.run = false; CL.t = -2;
    setStatus('done');
    clHud();
  }
}
CL.ghosts1 = null; CL.ghosts2 = null;
function collideCtl() {
  ctl.clear();
  ctl.slider({ label: 'A 质量 m1', min: 0.5, max: 3, step: 0.1, value: CL.m1, fmt: (v) => v.toFixed(1) + ' kg', onInput: (v) => { CL.m1 = v; if (!CL.run) clPlace(); clHud(true); } });
  ctl.slider({ label: 'A 初速 v1（发射）', min: 0.3, max: 3, step: 0.1, value: CL.v1, fmt: (v) => v.toFixed(1) + ' m/s', onInput: (v) => { CL.v1 = v; clHud(true); } });
  ctl.slider({ label: 'B 质量 m2', min: 0.5, max: 3, step: 0.1, value: CL.m2, fmt: (v) => v.toFixed(1) + ' kg', onInput: (v) => { CL.m2 = v; if (!CL.run) clPlace(); clHud(true); } });
  ctl.sep();
  const kb = [];
  const paintK = () => kb.forEach(({ b, v }) => b.classList.toggle('active', v === CL.kind));
  [['elas', '弹簧圈'], ['partial', '橡胶块'], ['inel', '魔术贴']].forEach(([v, t2]) => {
    const b = ctl.button({ label: t2, onClick: () => { CL.kind = v; clKindVis(); clHud(true); paintK(); } });
    kb.push({ b, v });
  });
  paintK();
  ctl.sep();
  hintEl('选缓冲器 按 空格 让 A 撞向 B · 对比碰前碰后动量与动能 · 也可以捏住滑块甩出去');
  setHudRows([['st', '状态'], ['p0', '碰前总动量'], ['p1', '碰后总动量'], ['ek', '总动能 前→后'], ['loss', '动能损失'], ['kind', '缓冲器'], ['v', '碰后速度']]);
  logSetCols('collide', ['类型', 'p 前', 'p 后', 'Ek 前/J', 'Ek 后/J', '损失']);
  clReset();
}

/* ================= 章 10 · 自由实验台 ================= */

const FB = {
  v0: 1.2, mh: 30,            // 初速 / 钩码质量 g
  ang: 0, cartB: false, timer: true, fric: false,
  t: -1, run: false, x: -3.6, vCur: 0,
  g1x: -0.8, g2x: 1.6, past: [false, false], tt: [0, 0],
  traj: [],
};
const FB_HOOK_MAX = 100;

function buildFree(g) {
  buildBench(g, 12);
  /* 导轨带左端铰链 + 红色摇柄调倾角 */
  FB.trackG = buildAirTrack(g, { len: 9 });
  FB.hingeBase = box(0.3, 0.14, 0.6, matStd(CV.steelDeep, { roughness: 0.45, metalness: 0.55 }));
  FB.hingeBase.position.set(-4.2, BENCH_Y + 0.11, 0);
  g.add(FB.hingeBase);
  FB.crank = makeCrank(CV.paintOrange);
  FB.crank.position.set(-3.4, BENCH_Y + 0.16, 0.55);
  g.add(FB.crank);
  const crankBase = box(0.3, 0.1, 0.3, matStd(CV.steelDeep, { roughness: 0.5, metalness: 0.5 }));
  crankBase.position.set(-3.4, BENCH_Y + 0.11, 0.55);
  g.add(crankBase);
  FB.crankLbl = label('倾角摇柄（拖动）', '#ffb08a', 0.0052);
  FB.crankLbl.position.set(-3.4, BENCH_Y + 0.75, 0.55);
  g.add(FB.crankLbl);
  /* 滑轮 + 挂钩码（点击钩码 −10 g / 槽码盒 +10 g） */
  const pulG = new THREE.Group();
  const postM = matStd(CV.steelDeep, { roughness: 0.45, metalness: 0.55 });
  const post = box(0.05, 0.42, 0.05, postM);
  post.position.set(0, 0.21, -0.3);
  pulG.add(post);
  const arm = box(0.05, 0.05, 0.34, postM);
  arm.position.set(0, 0.4, -0.14);
  pulG.add(arm);
  const pulley = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 18), matStd(CV.brass, { roughness: 0.3, metalness: 0.65 }));
  pulley.rotation.z = Math.PI / 2;
  pulley.position.set(0, 0.37, 0);
  pulG.add(pulley);
  pulG.position.set(4.5, BENCH_Y + 0.07, 0);
  g.add(pulG);
  FB.hanger = buildHanger(g);
  FB.hanger.position.set(4.5, BENCH_Y + 0.5, 0);
  FB.rope = makeRope(0xcfc2a4, 0.014);
  FB.ropeH = makeRope(0xcfc2a4, 0.014);
  g.add(FB.rope, FB.ropeH);
  /* 主车 A + 可选 B 车 */
  FB.cart = buildCart(g, CV.cartA);
  FB.cartB2 = buildCart(g, CV.cartB);
  FB.cartB2.visible = false;
  /* 槽码盒（点击 +10 g） */
  FB.slotBox = new THREE.Group();
  const caseM = matCoat(0xb8bcc4, { roughness: 0.32, metalness: 0.5 });
  const sb = box(0.4, 0.08, 0.28, caseM);
  sb.position.y = 0.04;
  FB.slotBox.add(sb);
  const slotM = matStd(CV.steel, { roughness: 0.35, metalness: 0.7 });
  for (let i = 0; i < 3; i++) {
    const slot = box(0.07, 0.026, 0.22, slotM);
    slot.position.set(-0.1 + i * 0.09, 0.093, 0.01);
    FB.slotBox.add(slot);
  }
  const sbLbl = mesh(new THREE.PlaneGeometry(0.32, 0.1), new THREE.MeshBasicMaterial({ map: nameplate(['槽码盒', '点击 +10g'], '#4a5560', 256, 90) }));
  sbLbl.rotation.x = -Math.PI / 2;
  sbLbl.position.set(0, 0.001, 0.17);
  FB.slotBox.add(sbLbl);
  FB.slotBox.position.set(-4.6, BENCH_Y + 0.07, -1.05);
  FB.slotBox.rotation.y = 0.5;
  g.add(FB.slotBox);
  FB.slotLbl = label('槽码盒 +10g', '#9fdcb0', 0.0042);
  FB.slotLbl.position.set(-4.6, BENCH_Y + 0.45, -1.05);
  g.add(FB.slotLbl);
  FB.hangerLbl = label('钩码 点击−10g', '#9fdcb0', 0.0042);
  g.add(FB.hangerLbl);
  /* 打点计时器（可开关） */
  FB.timerG = new THREE.Group();
  const tShell = box(0.42, 0.26, 0.3, matCoat(CV.paintCream, { roughness: 0.4 }));
  tShell.position.y = 0.13;
  FB.timerG.add(tShell);
  const tPlate = mesh(new THREE.PlaneGeometry(0.28, 0.09), new THREE.MeshBasicMaterial({ map: nameplate(['打点计时器', '50 Hz'], '#5a4030', 260, 90) }));
  tPlate.position.set(0, 0.14, 0.151);
  FB.timerG.add(tPlate);
  FB.timerG.position.set(-4.2, BENCH_Y + 0.07, -0.5);
  g.add(FB.timerG);
  /* 两只可拖光电门 */
  FB.g1 = buildGate(g);
  FB.g2 = buildGate(g);
  registerDrag({ kind: 'x', group: FB.g1, hitMesh: FB.g1, onDrag: (x) => { FB.g1x = clamp(x, -3.8, FB.g2x - 0.5); fbGates(); } });
  registerDrag({ kind: 'x', group: FB.g2, hitMesh: FB.g2, onDrag: (x) => { FB.g2x = clamp(x, FB.g1x + 0.5, 4.2); fbGates(); } });
  registerDrag({
    kind: 'knob', group: FB.crank, hitMesh: FB.crank,
    onDrag: (dx) => { FB.ang = clamp(FB.ang - dx * 0.2, 0, 8); fbTilt(); },
  });
  registerDrag({
    kind: 'x', group: FB.slotBox, hitMesh: FB.slotBox,
    onStart: () => { FB.mh = Math.min(FB.mh + 10, FB_HOOK_MAX); setHangerMass(FB.hanger, FB.mh); fbHud(); sfx('snap'); toast('槽码盒 +10 g（挂上钩码）。', 'ok'); },
  });
  registerDrag({
    kind: 'x', group: FB.hanger, hitMesh: FB.hanger,
    onStart: () => { FB.mh = Math.max(FB.mh - 10, 0); setHangerMass(FB.hanger, FB.mh); fbHud(); sfx('click'); toast('钩码 −10 g。', 'ok'); },
  });
  registerDrag({
    kind: 'fling', group: FB.cart, hitMesh: FB.cart, follow: () => ({ x: FB.x }),
    onDrag: (x) => { if (!FB.run) { FB.x = clamp(x, -4.2, 4.3); FB.cart.position.x = FB.x; } },
    onEnd: (v) => { if (!FB.run && Math.abs(v) > 0.3) { FB.v0 = clamp(Math.abs(v), 0.3, 3); fbStart(); toast('甩出去了！v0=' + FB.v0.toFixed(2) + ' m/s', 'ok'); } },
  });
  FB.ghosts = makeGhostMaker(g, 'box', CV.cartA);
  fbReset();
}
function fbTilt() {
  const th = FB.ang * DEG;
  FB.trackG.rotation.z = -th;
  FB.trackG.position.y = Math.sin(th) * 4.5 * 0.5;
  FB.crank.rotation.z = -FB.ang * 0.2;
}
function fbGates() {
  FB.g1.position.set(FB.g1x, BENCH_Y + 0.24, 0);
  FB.g2.position.set(FB.g2x, BENCH_Y + 0.24, 0);
}
function fbReset() {
  FB.t = -1; FB.run = false; FB.vCur = FB.v0;
  FB.x = -3.6;
  FB.past = [false, false]; FB.tt = [0, 0];
  FB.traj = [];
  FB.cart.visible = true;
  FB.cartB2.visible = FB.cartB;
  FB.cart.position.set(-3.6, BENCH_Y + 0.31, 0);
  FB.cartB2.position.set(-2.8, BENCH_Y + 0.31, 0);
  FB.cartB2.rotation.z = 0;
  setHangerMass(FB.hanger, FB.mh);
  FB.hanger.position.set(4.5, BENCH_Y + 0.5, 0);
  FB.rope.set(V3(4.5, BENCH_Y + 0.44, 0), V3(4.5, FB.hanger.position.y - 0.06, 0));
  FB.ropeH.set(V3(FB.x + 0.34, BENCH_Y + 0.38, 0), V3(4.5, BENCH_Y + 0.44, 0));
  FB.timerG.visible = FB.timer;
  fbGates();
  fbTilt();
  resetReplay();
  fbHud();
  setStatus('ready');
}
function fbStart() {
  fbReset();
  FB.vCur = FB.v0;
  FB.t = 0; FB.run = true;
  setStatus('running');
  sfx('click');
}
function fbAcc() {
  const mh = FB.mh / 1000, M = 0.3 + (FB.cartB ? 0.3 : 0);
  let a = (mh * 9.8) / (M + mh);
  if (FB.ang > 0) a += 9.8 * Math.sin(FB.ang * DEG) * 0.6;
  if (FB.fric) a -= 0.35;
  return a;
}
function fbHud() {
  hset('v0', FB.v0.toFixed(2) + ' m/s');
  hset('mh', FB.mh + ' g');
  hset('ang', FB.ang.toFixed(1) + '°');
  hset('a', fbAcc().toFixed(2) + ' m/s²');
  hset('xv', FB.run || FB.t >= 0 ? 'x=' + FB.x.toFixed(2) + ' · v=' + FB.vCur.toFixed(2) : '–');
}
function stepFree(dt) {
  if (REPLAY.active) { replayAdvance(dt); return; }
  if (!FB.run) return;
  FB.t += dt;
  const a = fbAcc();
  FB.vCur = Math.max(FB.vCur + a * dt, FB.v0 > 0 ? -1 : 0);
  FB.x += FB.vCur * dt * 0.6;
  FB.cart.position.x = FB.x;
  const drop = clamp((FB.x + 3.6) * 0.18, 0, 0.9);
  FB.hanger.position.y = BENCH_Y + 0.5 - drop;
  FB.rope.set(V3(4.5, BENCH_Y + 0.44, 0), V3(4.5, FB.hanger.position.y - 0.06, 0));
  FB.ropeH.set(V3(FB.x + 0.34, BENCH_Y + 0.38, 0), V3(4.5, BENCH_Y + 0.44, 0));
  if (FB.cartB) FB.cartB2.position.x = FB.x - 0.85;
  [[FB.g1, FB.g1x, 0], [FB.g2, FB.g2x, 1]].forEach(([gt, gx, i]) => {
    if (!FB.past[i] && FB.x >= gx) {
      FB.past[i] = true;
      FB.tt[i] = FB.t;
      flashGate(gt);
      if (i === 1 && FB.past[0]) {
        const v1 = FB.v0 + a * FB.tt[0], v2 = FB.v0 + a * FB.tt[1];
        const aExp = (v2 * v2 - v1 * v1) / (2 * Math.max(FB.g2x - FB.g1x, 0.3));
        logAddRow('free', [FB.mh + 'g', FB.ang.toFixed(1) + '°', FB.fric ? '有' : '无', FB.v0.toFixed(2), v1.toFixed(2), v2.toFixed(2), aExp.toFixed(2)]);
      }
    }
  });
  FB.traj.push({ t: FB.t, x: FB.x, v: FB.vCur, a });
  FB.ghostT = (FB.ghostT || 0) + dt;
  if (FB.ghostT > 0.18) { FB.ghostT = 0; FB.ghosts.spawn(FB.cart.position); }
  recordSample(FB.t, [FB.x, FB.vCur]);
  fbHud();
  if (FB.x > 4.3 || FB.x < -4.3 || FB.t > 5) {
    FB.run = false; FB.t = -2;
    setStatus('done');
    sfx('beep');
  }
}
function freeCtl() {
  ctl.clear();
  ctl.slider({ label: '初速度 v0', min: 0, max: 2.5, step: 0.05, value: FB.v0, fmt: (v) => v.toFixed(2) + ' m/s', onInput: (v) => { FB.v0 = v; } });
  ctl.slider({ label: '钩码质量（0 = 不挂钩）', min: 0, max: FB_HOOK_MAX, step: 10, value: FB.mh, fmt: (v) => v + ' g', onInput: (v) => { FB.mh = v; setHangerMass(FB.hanger, v); fbHud(); } });
  ctl.slider({ label: '导轨倾角（拖摇柄更直观）', min: 0, max: 8, step: 0.5, value: FB.ang, fmt: (v) => v.toFixed(1) + '°', onInput: (v) => { FB.ang = v; fbTilt(); fbHud(); } });
  ctl.toggle({ label: '第二辆小车 B', value: FB.cartB, onChange: (v) => { FB.cartB = v; if (!FB.run) fbReset(); } });
  ctl.toggle({ label: '打点计时器', value: FB.timer, onChange: (v) => { FB.timer = v; FB.timerG.visible = v; } });
  ctl.toggle({ label: '开摩擦（减速）', value: FB.fric, onChange: (v) => { FB.fric = v; fbHud(); } });
  ctl.sep();
  hintEl('设计实验并预测结果 · 点钩码 −10 g / 点槽码盒 +10 g · 拖光电门摆位 · 拖住小车甩出去 · 空格运行');
  setHudRows([['st', '状态'], ['v0', '初速度'], ['mh', '钩码'], ['ang', '倾角'], ['a', '加速度'], ['xv', 'x · v']]);
  logSetCols('free', ['钩码', '倾角', '摩擦', 'v0', '过门1 v', '过门2 v', 'a 实测']);
  fbReset();
}

/* ---------------- 提示条 / 控件面板 / 相机 ---------------- */

function toast(text, kind = 'ok') {
  const old = stage.querySelector('.motion-toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'motion-toast ' + kind;
  el.textContent = text;
  stage.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, kind === 'warn' ? 4200 : 3000);
}
function hintEl(text) {
  const d = document.createElement('div');
  d.className = 'mot-hint';
  const i = document.createElement('i');
  i.textContent = '任务';
  const s = document.createElement('span');
  s.innerHTML = text;
  d.append(i, s);
  ctl.el.appendChild(d);
  hintEl.cur = s;   // 记住文案节点：实验结束态由 setStatus 换成回放提示
}
hintEl.cur = null;
const ctl = createControlsPanel(document.getElementById('controls'));

/* ---------------- 回放推进 ---------------- */

function replayAdvance(dt) {
  REPLAY.t += dt;
  const buf = REPLAY.buf;
  const last = buf[buf.length - 1];
  if (REPLAY.t >= last.t) {
    REPLAY.active = false;
    if (last.apply) last.apply();
    setStatus('done');
    return;
  }
  let i = 0;
  let lo = 0, hi = buf.length - 1;
  const t = REPLAY.t;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (buf[mid].t < t) lo = mid + 1; else hi = mid;
  }
  i = lo;
  const s = buf[i];
  if (s.apply) s.apply();
}

/* ================= 回放 apply（把采样值套回场景） ================= */

const REPLAY_APPLY = {
  tape: (v) => { TP.cart.position.x = v[0]; TP.hanger.position.y = v[1]; },
  gates: (v) => { GT.cart.position.x = v[0]; },
  drop: (v) => { DP[DP.obj].position.set(0.62, v[0], -0.6); },
  newton: (v) => { NT.cart.position.x = v[0]; },
  fric: (v) => { FR.x = v[0]; FR.blk.position.x = v[0]; FR.fCur = v[1]; frPlace(); frHud(); },
  lift: (v) => { LF.y = v[0]; LF.a = v[1] || 0; lfPlace(); lfHud(); },
  pend: (v) => { PD.th = v[0]; pdPlace(); },
  collide: (v) => { CL.x1 = v[0]; CL.x2 = v[1]; clPlace(); },
  free: (v) => { FB.x = v[0]; FB.cart.position.x = v[0]; FB.vCur = v[1] || 0; fbHud(); },
};

/* ================= 章节表 ================= */

const CAM_DEFAULTS = {
  /* 台面场景（12 宽台）：FOV40 × 竖长画幅，机位距离按「半跨 ÷ tan20° ÷ 画幅比」推算；机位压低让台面近画面中线 */
  tape: [[0.4, 3.5, 14.0], [0.2, 1.6, 0]],
  gates: [[0, 3.1, 13.0], [0, 1.5, 0]],
  drop: [[4.4, 3.6, 8.4], [0.8, 2.5, -0.5]],
  newton: [[0.4, 3.3, 13.6], [0.2, 1.5, 0]],
  fric: [[0.6, 3.2, 14.6], [0.4, 1.4, 0]],
  incline: [[-0.6, 3.6, 12.4], [-0.6, 1.7, 0]],
  lift: [[5.4, 4.4, 9.4], [0, 3.0, -0.3]],
  pend: [[1.8, 3.4, 6.8], [0, 2.2, 0]],
  collide: [[0, 3.1, 12.8], [0, 1.5, 0]],
  free: [[0.2, 3.7, 16.2], [0.3, 1.4, 0]],
};
function camTo(pos, target) { app.setCamera(pos, target); }

const secTape = {
  id: 'tape', title: '纸带与 v-t 图',
  html: `<p>打点计时器每隔 <b>0.02 s</b> 在纸带上打一个点，每 5 个间隔取一个<b>计数点</b>（T = 0.1 s）。小车拖纸带做匀加速时，相邻计数点的间隔越来越宽。</p>
<p>两条路算加速度：① 量出间距用 <span class="hl">逐差法 a = [(s₄+s₅+s₆)−(s₁+s₂+s₃)] / 9T²</span>；② 算出各点速度画 <span class="hl">v–t 图</span>，过原点直线，<b>斜率即 a</b>。系统整体满足 <span class="hl">a = m<sub>钩</sub>g / (M<sub>车</sub>+m<sub>钩</sub>)</span>。</p>
<p>空格释放小车：数据坞里会同时出现「纸带页」（点迹与间距）和 v-t 图线。改变钩码质量再跑一次，比较斜率。</p>`,
  enter() {
    useScene('tape', buildTape);
    camTo(...CAM_DEFAULTS.tape);
    REPLAY.apply = REPLAY_APPLY.tape;
    chapterTick = stepTape;
    tapeCtl();
  },
  space() {
    if (TP.run) { TP.run = false; setStatus('paused'); }
    else if (runState === 'paused') { TP.run = true; setStatus('running'); }
    else tpStart();
  },
};
const secGates = {
  id: 'gates', title: '光电门测速度',
  html: `<p>光电门记录挡光片遮光时间 <b>Δt</b>。挡光片宽度 d 很小时，<span class="hl">v = d/Δt</span> 就是极短时间里的平均速度——即<b>瞬时速度</b>，这是极限思想的实验化身。</p>
<p>两只光电门可以<b>直接在导轨上拖动摆位</b>，门距 L 随之变化。加速度为 0 时 v₁ = v₂（匀速）；把「导轨加速度」调大（导轨微倾），v₂ > v₁，用 <span class="hl">a = (v₂²−v₁²)/2L</span> 求加速度。换更宽/更窄的挡光片，看 Δt 怎么变、v 稳不稳。</p>`,
  enter() {
    useScene('gates', buildGates);
    camTo(...CAM_DEFAULTS.gates);
    REPLAY.apply = REPLAY_APPLY.gates;
    chapterTick = stepGates;
    gatesCtl();
  },
  space() {
    if (GT.run) { GT.run = false; setStatus('paused'); }
    else if (runState === 'paused') { GT.run = true; setStatus('running'); }
    else gtStart();
  },
};
const secDrop = {
  id: 'drop', title: '自由落体',
  html: `<p>只受重力、由静止下落即<b>自由落体运动</b>：初速为零的匀加速运动，a = g。<span class="hl">h = ½gt²，v = gt</span>。频闪残影间距越落越大——和纸带计数点同构。</p>
<p>立柱上两只光电门可以设不同高度，分别测出 v₁、v₂，用 <span class="hl">g = (v₂²−v₁²) / 2Δh</span> 实测重力加速度。换<b>羽毛</b>：空气阻力让它很快到终端速度；打开<b>牛顿管抽真空</b>——真空中羽毛与铜片同时落地。g 只随天体而变。</p>`,
  enter() {
    useScene('drop', buildDrop);
    camTo(...CAM_DEFAULTS.drop);
    REPLAY.apply = REPLAY_APPLY.drop;
    chapterTick = stepDrop;
    dropCtl();
  },
  space() {
    if (DP.run) { DP.run = false; setStatus('paused'); }
    else if (runState === 'paused') { DP.run = true; setStatus('running'); }
    else dpStart();
  },
};
const secNewton = {
  id: 'newton', title: '牛顿第二定律',
  html: `<p>探究 <span class="hl">a = F/m</span> 要<b>控制变量</b>：M 不变改拉力，或拉力不变改 M。先把导轨左端垫高<b>平衡摩擦力</b>（重力沿斜面分力抵消摩擦）。</p>
<p>用钩码重力 mg 代替绳拉力有系统误差：实际 <span class="hl">T = M·m·g/(M+m) &lt; mg</span>，只有 m ≪ M 才近似。打开「力传感器」直读真实 T；挂 <b>150 g 以上</b>钩码再记录——a–F 图上的点会落到虚线下方，图线向下弯。</p>
<p>两只光电门测 v₁、v₂，用 v₂²−v₁² = 2aL 算实测 a，与理论值对照。</p>`,
  enter() {
    useScene('newton', buildNewton);
    camTo(...CAM_DEFAULTS.newton);
    REPLAY.apply = REPLAY_APPLY.newton;
    chapterTick = stepNewton;
    newtonCtl();
    paintLog('newton');
  },
  space() {
    if (NT.run) { NT.run = false; setStatus('paused'); }
    else if (runState === 'paused') { NT.run = true; setStatus('running'); }
    else ntStart();
  },
  recFn() {
    if (!NT.canRec) { toast('先完整跑一次（小车过两道门）再记录。', 'warn'); return; }
    NT.canRec = false;
    NT.scatter.push([NT.mh * 9.8, ntA()]);
    logAddRow('newton', [(NT.mh * 1000).toFixed(0), (NT.mh * 9.8).toFixed(2), (NT.M * 1000).toFixed(0), ntA().toFixed(3), NT.aExp ? NT.aExp.toFixed(3) : '—', ntTension().toFixed(2)]);
    paintLog('newton');
    toast('已记录第 ' + NT.scatter.length + ' 组数据。', 'ok');
  },
  logChart(cv) { ntLogChart(cv); },
  logChartNote: '横轴 F = mg · 纵轴 a。虚线为忽略 m 的 a = F/M；散点为每次记录的 (F, a)。m 大时点落在虚线下方。',
};
const secFric = {
  id: 'fric', title: '滑动摩擦力',
  html: `<p>电机经力传感器匀速拉木块：示数从 0 爬升——<b>静摩擦</b>随外力增大；到<b>最大静摩擦</b>峰值瞬间木块被拉动，示数随即回落并稳定下来——<b>滑动摩擦力</b>。</p>
<p><span class="hl">f = μN</span>（水平面 N = G）。在 F–t 图上读峰值；给木块<b>加砝码</b>（每片 100 g）再拉一轮，看 N 变大后 f 怎么变；换<b>四种接触面</b>（木板/毛巾/橡胶/毛毡），每面记几组 (N, f)——f–N 分组直线的<b>斜率就是各自的 μ</b>。</p>`,
  enter() {
    useScene('fric', buildFric);
    camTo(...CAM_DEFAULTS.fric);
    REPLAY.apply = REPLAY_APPLY.fric;
    chapterTick = stepFric;
    fricCtl();
    paintLog('fric');
  },
  space() {
    if (FR.run) { FR.run = false; setStatus('paused'); }
    else if (runState === 'paused') { FR.run = true; setStatus('running'); }
    else frStart();
  },
  recFn() {
    if (!FR.fKin) { toast('先完整拉一轮（出现稳定滑动段）再记录。', 'warn'); return; }
    const s = FR_SURFS[FR.surf];
    FR.grouped[s.name] = FR.grouped[s.name] || [];
    FR.grouped[s.name].push([frN(), FR.fKin]);
    logAddRow('fric', [s.name, frN().toFixed(1), FR.fMax.toFixed(2), FR.fKin.toFixed(2), s.mu.toFixed(2)]);
    paintLog('fric');
    toast('已记录（' + s.name + '）。换砝码或接触面继续。', 'ok');
  },
  logChart(cv) { frLogChart(cv); },
  logChartNote: 'f–N 分组散点与拟合直线：不同接触面的斜率 = 各自动摩擦因数 μ。',
};
const secIncline = {
  id: 'incline', title: '斜面与力的分解',
  html: `<p>斜面上的物体，重力产生两个效果：<b>沿斜面下滑</b>（G∥ = G·sinθ）和<b>压紧斜面</b>（G⊥ = G·cosθ = N）。</p>
<p><b>拖动红色摇柄</b>连续改变倾角。角度小时静摩擦与 G∥ 平衡，木块不动；当 <span class="hl">G·sinθ &gt; μ·G·cosθ，即 tanθ &gt; μ</span> 时开始下滑，a = g(sinθ−μcosθ)。<b>临界角只由 μ 决定</b>：点「木块放回」，加砝码再找一次临界角——角度一个样。</p>
<p>打开「受力」看完整的 N 与摩擦力箭头。</p>`,
  enter() {
    useScene('incline', buildIncline);
    camTo(...CAM_DEFAULTS.incline);
    chapterTick = stepIncline;
    inclineCtl();
    paintLog('incline');
  },
  space() { inStart(); },
  onForces() { inPlace(); },
};
const secLift = {
  id: 'lift', title: '超重与失重',
  html: `<p>电梯里的台秤示数 N 并不总等于 mg：<b>视重</b>取决于加速度。向上加速 N = m(g+a) &gt; mg——<b>超重</b>；向下加速 N = m(g−a) &lt; mg——<b>失重</b>；a = −g 时 N = 0——<b>完全失重</b>。</p>
<p>三种运行方式：上行 / 下行 / <b>缆绳断开</b>。对照 a–t 图看示数怎么走：启动段超重、匀速段正常、制动段反向。断绳后砝码会"漂浮"在秤上方——重力没变，变的是支持力。</p>`,
  enter() {
    useScene('lift', buildLift);
    camTo(...CAM_DEFAULTS.lift);
    REPLAY.apply = REPLAY_APPLY.lift;
    chapterTick = stepLift;
    liftCtl();
  },
  space() {
    if (LF.run) { LF.run = false; setStatus('paused'); }
    else if (runState === 'paused') { LF.run = true; setStatus('running'); }
    else lfStart('up');
  },
  onForces() { lfHud(); },
};
const secPend = {
  id: 'pend', title: '机械能守恒',
  html: `<p>气垫摆摆动中，动能与重力势能相互转化，总和不变（只有重力/支持力做功）：<span class="hl">Ek + Ep = 恒量</span>。最低点势能最小、动能最大；最高点动能为零。把最低点取作零势能点，能量柱实时显示三段：Ep / Ek / <b>Q 内能</b>。</p>
<p><b>关掉气垫泵</b>：枢轴摩擦开始耗散——振幅一圈圈变小，能量柱里的红色 Q 段一格格长高。机械能没消失，变成了内能。再开泵、重置摆角，回到守恒线。</p>`,
  enter() {
    useScene('pend', buildPend);
    camTo(...CAM_DEFAULTS.pend);
    REPLAY.apply = REPLAY_APPLY.pend;
    chapterTick = stepPend;
    pendCtl();
    logSetCols('pend', ['摆角', 'E 初', 'E 现在', 'Q 内能']);
  },
  space() {
    PD.playing = !PD.playing;
    setStatus(PD.playing ? 'running' : 'paused');
  },
  recFn() {
    const { E } = pdEnergy();
    logAddRow('pend', [(Math.abs(PD.th) / DEG).toFixed(1) + '°', PD.E0.toFixed(1), E.toFixed(1), (PD.E0 - E).toFixed(1)]);
    paintLog('pend');
  },
};
const secCollide = {
  id: 'collide', title: '动量守恒',
  html: `<p>气垫导轨上两车相碰，系统合外力为零，<b>总动量保持不变</b>：<span class="hl">m₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′</span>。</p>
<p>三种缓冲器：<b>弹簧圈</b>——弹性碰撞，动能也守恒，等质量交换速度；<b>橡胶块</b>——一般碰撞，动能有损失；<b>魔术贴</b>——碰后粘成一体，完全非弹性碰撞，动能损失最大（变成变形与内能）。</p>
<p>点「发射」用滑杆初速；也可以<b>直接拖住一辆车甩出去</b>——甩的速度就是它的初速。改质量再试，看动量始终守恒、动能只有弹性碰撞保得住。</p>`,
  enter() {
    useScene('collide', buildCollide);
    camTo(...CAM_DEFAULTS.collide);
    REPLAY.apply = REPLAY_APPLY.collide;
    chapterTick = stepCollide;
    collideCtl();
  },
  space() {
    if (CL.run) { CL.run = false; setStatus('paused'); }
    else if (runState === 'paused') { CL.run = true; setStatus('running'); }
    else clStart();
  },
};
const secFree = {
  id: 'free', title: '自由实验台',
  html: `<p>所有元件都开放：红色摇柄调倾角、钩码/槽码盒配重、第二辆小车、两只可拖光电门、打点计时器——自己设计实验。</p>
<p>· <b>点击钩码 −10 g，点击槽码盒 +10 g</b>（也可用滑杆）<br>· <b>拖动光电门</b>改变测量位置；<b>拖住小车甩出去</b>获得初速<br>· 空格运行，数据坞自动记下过门速度与实测 a；「导出 CSV」可把整条轨迹数据拿去进一步分析</p>
<p>光滑导轨匀速（牛顿第一定律）；开摩擦匀减速；挂钩码变加速——<b>力是改变运动状态的原因</b>。</p>`,
  enter() {
    useScene('free', buildFree);
    camTo(...CAM_DEFAULTS.free);
    REPLAY.apply = REPLAY_APPLY.free;
    chapterTick = stepFree;
    freeCtl();
    paintLog('free');
  },
  space() {
    if (FB.run) { FB.run = false; setStatus('paused'); }
    else if (runState === 'paused') { FB.run = true; setStatus('running'); }
    else fbStart();
  },
  csvTrajectory() {
    const lines = ['t/s,x/m,v/(m·s⁻¹),a/(m·s⁻²)'];
    FB.traj.forEach((s) => lines.push(s.t.toFixed(3) + ',' + s.x.toFixed(3) + ',' + s.v.toFixed(3) + ',' + s.a.toFixed(3)));
    return lines;
  },
};

const SECTIONS = [secTape, secGates, secDrop, secNewton, secFric, secIncline, secLift, secPend, secCollide, secFree];

/* ================= 布局驱动（三栏 / 折叠 / 专注 / 手风琴 / 快捷键 / 舞台工具） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const shell = document.getElementById('motionShell');
let chapterIdx = 0;
let chapterTick = null;
let activeCleanup = null;

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

function selectChapter(i) {
  chapterIdx = clamp(i, 0, SECTIONS.length - 1);
  const sec = SECTIONS[chapterIdx];
  window.__motionChapter = sec.id;
  chapBtns.forEach((b, j) => {
    const on = j === chapterIdx;
    b.classList.toggle('on', on);
    if (on) {
      b.setAttribute('aria-current', 'true');
      b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else b.removeAttribute('aria-current');
  });
  chapCount.textContent = `${String(chapterIdx + 1).padStart(2, '0')}/${String(SECTIONS.length).padStart(2, '0')}`;
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  REPLAY.active = false;
  resetReplay();
  FORCES.on = false;
  forceBtn.classList.remove('on');
  forceBtn.setAttribute('aria-pressed', 'false');
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  chapterTick = null;
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  accSecs.data.classList.toggle('acc-empty', !document.querySelector('#lcData .hud-card'));
  detailBody.scrollTop = 0;
}

/* 栏折叠 × 专注模式 × 大屏 */
const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const focusBtn = document.getElementById('focusBtn');
const FOLD_KEY = { l: 'motion.foldL', r: 'motion.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;
try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅会话内生效 */ }
function applyShellFold() {
  shell.classList.toggle('fold-l', foldL);
  shell.classList.toggle('fold-r', foldR);
  for (const [btn, folded] of [[foldLBtn, foldL], [unfoldLBtn, foldL], [foldRBtn, foldR], [unfoldRBtn, foldR]]) {
    btn.setAttribute('aria-expanded', String(!folded));
  }
}
function setFocus(on) {
  if (on && focusSaved === null) {
    focusSaved = [foldL, foldR];
    foldL = true;
    foldR = true;
  } else if (!on && focusSaved !== null) {
    [foldL, foldR] = focusSaved;
    focusSaved = null;
  }
  shell.classList.toggle('focus-mode', on);
  focusBtn.textContent = on ? '退出专注' : '专注模式';
  focusBtn.setAttribute('aria-pressed', String(on));
  applyShellFold();
}
function toggleFold(side) {
  if (focusSaved !== null) setFocus(false);
  if (side === 'l') foldL = !foldL;
  else foldR = !foldR;
  try { localStorage.setItem(FOLD_KEY[side], (side === 'l' ? foldL : foldR) ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyShellFold();
}
foldLBtn.addEventListener('click', () => toggleFold('l'));
unfoldLBtn.addEventListener('click', () => toggleFold('l'));
foldRBtn.addEventListener('click', () => toggleFold('r'));
unfoldRBtn.addEventListener('click', () => toggleFold('r'));
focusBtn.addEventListener('click', () => setFocus(focusSaved === null));
applyShellFold();

/* 右栏三块手风琴，localStorage 记忆、切章不重置；≤1100px 首访清爽态（数据坞默认收） */
const ACC_KEYS = { lesson: 'motion.accLesson', controls: 'motion.accControls', data: 'motion.accData' };
const accSecs = {
  lesson: document.getElementById('accLesson'),
  controls: document.getElementById('accControls'),
  data: document.getElementById('accData'),
};
const NARROW_VIEW = window.innerWidth <= 1100;
const accClosed = {};
for (const name of Object.keys(accSecs)) {
  let saved = null;
  try { saved = localStorage.getItem(ACC_KEYS[name]); } catch (e) { /* 忽略 */ }
  accClosed[name] = saved !== null ? saved === '1' : (name === 'data' && NARROW_VIEW);
}
function applyAcc(name) {
  const sec2 = accSecs[name];
  sec2.classList.toggle('closed', accClosed[name]);
  sec2.querySelector('.acc-head').setAttribute('aria-expanded', String(!accClosed[name]));
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

/* 舞台工具：复位 / 受力 / 残影 / 慢动作 / 音效 / 回放 / 视角 / 画质 / 大屏 / 全屏 */
const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const resetBtn = document.getElementById('resetBtn');
const forceBtn = document.getElementById('forceBtn');
const strobeBtn = document.getElementById('strobeBtn');
const slowBtn = document.getElementById('slowBtn');
const soundBtn = document.getElementById('soundBtn');
const replayBtn = document.getElementById('replayBtn');
const viewBtn = document.getElementById('viewBtn');
const qualBtn = document.getElementById('qualBtn');
const bigBtn = document.getElementById('bigBtn');
const fsBtn = document.getElementById('fsBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));
resetBtn.addEventListener('click', () => {
  const cur = SECTIONS[chapterIdx].id;
  if (REC[cur]) REC[cur].rows = [];
  selectChapter(chapterIdx);
  toast('实验已复位：装置归位，本轮数据清空。', 'ok');
});
forceBtn.addEventListener('click', () => {
  FORCES.on = !FORCES.on;
  forceBtn.classList.toggle('on', FORCES.on);
  forceBtn.setAttribute('aria-pressed', String(FORCES.on));
  const sec = SECTIONS[chapterIdx];
  if (sec.onForces) sec.onForces();
  else toast(FORCES.on ? '本章的受力以标注与传感器读数一体化呈现。' : '已隐藏受力。', 'ok');
});
strobeBtn.addEventListener('click', () => {
  STROBE.on = !STROBE.on;
  strobeBtn.classList.toggle('on', STROBE.on);
  strobeBtn.setAttribute('aria-pressed', String(STROBE.on));
});
slowBtn.addEventListener('click', () => {
  SPEED = SPEED === 1 ? 0.25 : SPEED === 0.25 ? 0.1 : 1;
  slowBtn.textContent = SPEED === 1 ? '1×' : SPEED === 0.25 ? '¼×' : '⅒×';
  toast(SPEED === 1 ? '恢复正常速度。' : '慢动作 ×' + (1 / SPEED).toFixed(0).replace('4', '¼').replace('10', '⅒') + '。', 'ok');
});
soundBtn.addEventListener('click', () => {
  SND.on = !SND.on;
  soundBtn.classList.toggle('on', SND.on);
  soundBtn.setAttribute('aria-pressed', String(SND.on));
});
replayBtn.addEventListener('click', () => startReplay());
viewBtn.addEventListener('click', () => {
  const d = CAM_DEFAULTS[SECTIONS[chapterIdx].id];
  camTo(d[0], d[1]);
  toast('视角已复位。', 'ok');
});
let qualityHigh = true;
function applyQuality() {
  const bloomPass = vfx.composer.passes.find((p) => p.strength !== undefined);
  const finishPass = vfx.composer.passes.find((p) => p.uniforms && p.uniforms.uGrainAmt);
  if (bloomPass) bloomPass.enabled = qualityHigh;
  if (finishPass) {
    finishPass.uniforms.uGrainAmt.value = qualityHigh ? 0.028 : 0;
    finishPass.uniforms.uCA.value = 0;
  }
  qualBtn.textContent = qualityHigh ? '画质优先' : '流畅度优先';
  qualBtn.classList.toggle('on', qualityHigh);
  qualBtn.setAttribute('aria-pressed', String(qualityHigh));
}
qualBtn.addEventListener('click', () => {
  qualityHigh = !qualityHigh;
  applyQuality();
  toast(qualityHigh ? '已切到画质优先：辉光与颗粒后期已打开。' : '已切到流畅度优先：后期效果已关，低配置设备更流畅。', 'ok');
});
let bigMode = false;
function applyBig() {
  document.body.classList.toggle('motion-big', bigMode);
  bigBtn.classList.toggle('on', bigMode);
  bigBtn.setAttribute('aria-pressed', String(bigMode));
}
bigBtn.addEventListener('click', () => {
  bigMode = !bigMode;
  setFocus(bigMode);
  applyBig();
});
fsBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen().catch(() => {});
});

/* 键盘：← → , . 切章 / 空格 开始暂停 / R 视角 / ] 数据坞 / F 全屏 */
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft' || e.key === ',') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight' || e.key === '.') gotoChapter(chapterIdx + 1);
  else if (e.key === ' ') { e.preventDefault(); spaceToggle(); }
  else if (e.key === ']') toggleAcc('data');
  else if (e.key === 'r' || e.key === 'R') viewBtn.click();
  else if (e.key === 'f' || e.key === 'F') fsBtn.click();
});

/* ================= 帧循环与启动 ================= */

app.onFrame((rawDt) => {
  const dt = rawDt * SPEED;
  if (chapterTick) chapterTick(dt);
  if (REPLAY.active) { /* 回放由章节 tick 内的 replayAdvance 处理 */ }
});

try {
  if (localStorage.getItem('motion.sound') === '0') { SND.on = false; soundBtn.classList.remove('on'); soundBtn.setAttribute('aria-pressed', 'false'); }
  if (localStorage.getItem('motion.strobe') === '0') { STROBE.on = false; strobeBtn.classList.remove('on'); strobeBtn.setAttribute('aria-pressed', 'false'); }
} catch (e) { /* 忽略 */ }
soundBtn.addEventListener('click', () => { try { localStorage.setItem('motion.sound', SND.on ? '1' : '0'); } catch (e) { /* 忽略 */ } });
strobeBtn.addEventListener('click', () => { try { localStorage.setItem('motion.strobe', STROBE.on ? '1' : '0'); } catch (e) { /* 忽略 */ } });

applyQuality();
applyBig();
setTimeout(() => {
  loader.hide();
  window.__eduSections = { select: selectChapter };
  window.__motionDebug = { vfx, app, PAL, CV, REPLAY, CH: { TP, GT, DP, NT, FR, IN, LF, PD, CL, FB } };
  selectChapter(0);
}, 60);
