/* EduLab · 化学反应 · 微观世界（reaction）— Micro 级 3D 深改
 * =====================================================================
 * 章节：有效碰撞 / 温度与活化分子 / 催化剂 / 浓度与压强 / 化学平衡的建立 / 平衡移动 / 链式反应 / 随堂检测
 *
 * 三栏布局：左课程大纲（8 章列表，点击切章高亮迁移）· 中粒子舞台（实验台叙事）· 右知识点详解（三手风琴）
 * 折叠体系：左右栏 28px 竖条折叠 × 数据图窗折叠为 40px 圆徽标 × 右栏手风琴 × 专注模式（localStorage 记忆）
 *
 * 场景工艺（edu-vfx 接入）：
 *   木质实验台（程序化双变体木纹 + 台缘 + 桌腿）+ 气体采样瓶阵列（Lathe 瓶身 / 弧面标签 /
 *   内气染色 / 接触阴影）+ 试管架（三管带液面）——场景叙事道具带铭牌与液面。
 *   玻璃反应器深雕：双层沿口珠边（CatmullRom 闭环放样）+ 四角金属护柱 + 底托盘 + 加热条
 *   （emissive 随温度联动）+ 前壁刻度贴花；活塞 = 滑板 + 胶圈 + 滚花旋钮（InstancedMesh 齿牙）
 *   + 球头手柄；催化剂 = 铂网纹理板 + 吸附位阵列（发光联动开关）。
 *
 * 图窗（原版 chart 家族 1:1）：MB 分布(dist) / 浓度-时间(conc) / 能量剖面(profile) / 链增长(chain)
 * 原版功能块 1:1：能量+取向两要素（含「取向要求」开关）/ 温度-活化分子 / 催化剂对照 /
 *   浓度·压强（加料按钮 + 活塞）/ 平衡建立（从纯 A / 纯 B 出发）/ 平衡移动（加料·升温·压缩）/
 *   链式反应（光照引爆 + 电火花 + Space）/ 上一节(←) 下一节(→) / 重置视角(R) / 全屏(F)
 * 自研增设：随堂检测（5 题判分解析）
 * =====================================================================
 */
import {
  THREE, clamp, TAU,
  createApp, createControlsPanel, makeHUD, makeLoader,
  makeTextSprite, setSpriteText, makeGlowTexture, circleLine,
} from './edu-core.js';
import {
  attachVFX, makeStudioEnvironment, makeWoodTexture, makeLabelTexture,
  matStd, matCoat, matGlow, PAL,
} from './edu-vfx.js';

/* ---------------- 舞台与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建微观粒子世界…');

const app = createApp({
  container: stage,
  fov: 42, near: 0.05, far: 80,
  cameraPos: [0.4, 0.6, 5.4],
  target: [0, -0.6, 0],
  minDistance: 1.1, maxDistance: 16,
  exposure: 1.05,
  keepBackground: true,
});
const { scene, camera, controls } = app;
const vfx = attachVFX(app, 'illus');            // 后处理管线 + cubic 运镜接管（渲染循环由它驱动）
scene.environment = makeStudioEnvironment(app.renderer);

scene.add(new THREE.HemisphereLight(0xd8e2ec, 0x35291c, 0.62));
const keyLight = new THREE.DirectionalLight(0xfff2e2, 1.35);
keyLight.position.set(3.5, 5.2, 3.2);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.42);
fillLight.position.set(-4, 3, -2.5);
scene.add(fillLight);
const rimLight = new THREE.DirectionalLight(0xbfd8e8, 0.3);
rimLight.position.set(-2.5, 2.2, -5);
scene.add(rimLight);

/* ---------------- 工艺基建（台面 / 纹理 / 阴影 / 色板） ---------------- */

const canvasTex = (w, h, draw) => {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

/* 场景色板（PAL 延展：化学台用冷玻璃 + 暖木族；仅本实验使用） */
const C = {
  bench: 0x5f4426, benchDeep: 0x3d2c18,     // 实验台木族
  glassTint: 0xbcd8e4,                       // 器壁玻璃
  steel: PAL.steel, brass: PAL.brass,        // 金属件走 PAL 通用族
  rubber: 0x2e3338,                          // 活塞胶圈
  ptPlate: 0xc9c2b2,                         // 铂网板
  heatGlow: 0xd8703a,                        // 加热条
  knob: 0x384048,
};

/* 木质材质（台面 / 道具：程序化木纹双 seed 变体） */
const woodTexBench = makeWoodTexture({ base: '#63482a', dark: '#453219', light: '#85633b', streaks: 120, bands: 8, planks: 4, seed: 23 });
woodTexBench.repeat.set(3.0, 2.0);
const woodTexRack = makeWoodTexture({ base: '#8a6a44', dark: '#6a4e2e', light: '#b08c5e', streaks: 60, bands: 4, seed: 71 });
woodTexRack.repeat.set(1.2, 0.7);
function benchMat() {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.04 });
  m.map = woodTexBench;
  return m;
}

/* 玻璃材质（透明经典路线，不开 transmission：粒子群透过器壁渲染负担可控） */
function glassMat(op = 0.1) {
  const m = matCoat(C.glassTint, {
    roughness: 0.05, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12,
    opacity: op, transparent: true, side: THREE.DoubleSide, depthWrite: false,
  });
  m.envMapIntensity = 0.32;   // 压低棚拍反射，防器壁读成奶白笼
  return m;
}

/* 接触阴影贴片（主体/道具落桌的重量感来源） */
function shadowPatch(w, d, opacity = 0.4) {
  const tex = canvasTex(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, 'rgba(6,5,3,' + opacity + ')');
    g.addColorStop(0.62, 'rgba(6,5,3,' + opacity * 0.55 + ')');
    g.addColorStop(1, 'rgba(6,5,3,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}

/* 圆角矩形闭环曲线（器口珠边放样用）：xz 平面、中心 cx/cz、圆角 rr */
function rimLoopCurve(w, d, y, rr = 0.05) {
  const x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
  const pts = [];
  const corner = (cx, cz, a0) => {
    for (let k = 0; k <= 5; k++) {
      const a = a0 + (k / 5) * (Math.PI / 2);
      pts.push(new THREE.Vector3(cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr));
    }
  };
  corner(x0 + rr, z0 + rr, Math.PI);
  corner(x1 - rr, z0 + rr, Math.PI * 1.5);
  corner(x1 - rr, z1 - rr, 0);
  corner(x0 + rr, z1 - rr, Math.PI * 0.5);
  return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
}
function rimBead(w, d, y, mat, r = 0.03) {
  return new THREE.Mesh(new THREE.TubeGeometry(rimLoopCurve(w, d, y), 120, r, 8, true), mat);
}

/* ================= 共享实验台（叙事层：全程可见） ================= */

function buildBench() {
  const g = new THREE.Group();
  /* 台面大板 */
  const top = new THREE.Mesh(new THREE.BoxGeometry(26, 0.5, 15), benchMat());
  top.position.y = -1.97;
  g.add(top);
  /* 台缘（深木包边，前缘微出沿） */
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(26.7, 0.26, 15.7),
    matStd(C.benchDeep, { roughness: 0.62 })
  );
  rim.position.y = -2.24;
  g.add(rim);
  /* 桌腿（四角） */
  const legGeo = new THREE.BoxGeometry(0.34, 2.3, 0.34);
  for (const [lx, lz] of [[-11.6, -6.3], [11.6, -6.3], [-11.6, 6.3], [11.6, 6.3]]) {
    const leg = new THREE.Mesh(legGeo, matStd(C.benchDeep, { roughness: 0.68 }));
    leg.position.set(lx, -3.42, lz);
    g.add(leg);
  }
  /* 台面中央柔影（反应器落位区） */
  const sh = shadowPatch(19, 13, 0.3);
  sh.position.set(0, -1.715, -0.2);
  g.add(sh);
  /* 场景叙事道具：气体采样瓶阵列 + 试管架 */
  g.add(makeGasBottle('NO₂', '#a4552e', '#5e2d16', 2.18, -1.25, 0.16));
  g.add(makeGasBottle('Cl₂', '#7fae4e', '#3f6e2c', 2.72, -1.62, -0.34));
  g.add(makeGasBottle('H₂', '#9fc4d8', '#6e93a8', 2.3, -2.02, 0.28));
  g.add(makeTubeRack());
  return g;
}

/* 道具：气体采样瓶（Lathe 瓶身 + 内气染色 + 金属盖 + 弧面标签 + 接触阴影） */
function makeGasBottle(name, gasColor, labelText, x, z, rotY) {
  const g = new THREE.Group();
  /* 瓶身轮廓：底 → 直筒 → 收肩 → 颈口 → 外翻唇 */
  const prof = [
    [0.0, 0.0], [0.15, 0.0], [0.16, 0.02], [0.16, 0.34], [0.15, 0.4],
    [0.09, 0.47], [0.062, 0.5], [0.062, 0.56], [0.075, 0.58], [0.075, 0.6],
    [0.05, 0.6], [0.05, 0.585], [0.0, 0.585],
  ];
  const bodyGeo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28);
  const body = new THREE.Mesh(bodyGeo, glassMat(0.22));
  g.add(body);
  /* 内气染色柱（气体样品的示色） */
  const gas = new THREE.Mesh(
    new THREE.CylinderGeometry(0.135, 0.135, 0.3, 20),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(gasColor), transparent: true, opacity: 0.42, depthWrite: false })
  );
  gas.position.y = 0.19;
  g.add(gas);
  const gasShoulder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.128, 0.13, 20),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(gasColor), transparent: true, opacity: 0.32, depthWrite: false })
  );
  gasShoulder.position.y = 0.405;
  g.add(gasShoulder);
  /* 金属瓶盖 */
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.05, 18),
    matStd(C.brass, { roughness: 0.32, metalness: 0.85 })
  );
  cap.position.y = 0.625;
  g.add(cap);
  /* 弧面标签（贴合瓶身锥度，θ 居中朝 +Z） */
  const labelTex = makeLabelTexture([name, '样品气·密封'], { w: 256, h: 150, accent: labelText, lineSizes: [44, 22] });
  const labelMat = new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.7 });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.165, 0.22, 26, 1, true, -0.72, 1.44), labelMat);
  label.position.y = 0.21;
  g.add(label);
  g.position.set(x, -1.72, z);
  g.rotation.y = rotY;
  const sh = shadowPatch(0.66, 0.66, 0.34);
  sh.position.set(x, -1.715, z);
  scene.add(sh);
  return g;
}

/* 道具：试管架（木质底座 + 三支试管：玻璃管 + 液面 + 管口珠边） */
function makeTubeRack() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.14, 0.42), (() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.03 });
    m.map = woodTexRack;
    return m;
  })());
  base.position.y = 0.07;
  g.add(base);
  /* 上层插板（带三孔观感：薄板 + 管穿过） */
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.05, 0.34), (() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.03 });
    m.map = woodTexRack;
    return m;
  })());
  board.position.y = 0.34;
  g.add(board);
  const liq = ['#4d8fa8', '#c99a3f', '#a86a8e'];
  liq.forEach((col, i) => {
    const tx = -0.36 + i * 0.36;
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.56, 16, 1, true),
      glassMat(0.26)
    );
    tube.position.set(tx, 0.36, 0);
    g.add(tube);
    const bottom = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2),
      glassMat(0.26)
    );
    bottom.position.set(tx, 0.08, 0);
    g.add(bottom);
    const fill = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.044, 0.2, 14),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.35, transparent: true, opacity: 0.8 })
    );
    fill.position.set(tx, 0.2, 0);
    g.add(fill);
    const meniscus = new THREE.Mesh(
      new THREE.CircleGeometry(0.044, 14),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.35), transparent: true, opacity: 0.5 })
    );
    meniscus.rotation.x = -Math.PI / 2;
    meniscus.position.set(tx, 0.301, 0);
    g.add(meniscus);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.008, 8, 20), matStd(PAL.steel, { roughness: 0.3, metalness: 0.5 }));
    lip.rotation.x = Math.PI / 2;
    lip.position.set(tx, 0.64, 0);
    g.add(lip);
  });
  g.position.set(-2.42, -1.72, -1.72);
  g.rotation.y = -0.5;
  const sh = shadowPatch(1.7, 0.9, 0.32);
  sh.position.set(-2.42, -1.715, -1.72);
  sh.rotation.z = 0.5;
  scene.add(sh);
  return g;
}
scene.add(buildBench());

/* ================= 玻璃反应器（深雕：珠边口沿 + 护柱 + 托盘 + 加热条 + 刻度贴花） ================= */

/* 刻度贴花：前壁玻璃上的容量刻度线（CanvasTexture 矢量绘制） */
function scaleDecal(w, h) {
  const tex = canvasTex(192, 128, (ctx, cw, ch) => {
    ctx.clearRect(0, 0, cw, ch);
    ctx.strokeStyle = 'rgba(205,228,238,0.62)';
    ctx.fillStyle = 'rgba(205,228,238,0.62)';
    ctx.lineWidth = 1.6;
    ctx.font = '600 12px sans-serif';
    const lines = 5;
    for (let i = 0; i <= lines; i++) {
      const y = ch * 0.08 + (i / lines) * ch * 0.84;
      const long = i % 5 === 0 || i % 5 === 2;
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(long ? 34 : 24, y);
      ctx.stroke();
      if (i % 5 === 0) ctx.fillText(String(100 - i * 20), 40, y + 4);
      else if (i % 5 === 2) ctx.fillText(String(100 - i * 20), 40, y + 4);
    }
    ctx.font = '600 11px sans-serif';
    ctx.fillText('mL', 40, ch * 0.08 - 4);
  });
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.3, h * 0.44),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.34, depthWrite: false })
  );
  return m;
}

/* 反应器：opts { w, h, d, cy, tint, scaleMark } → { min, max, tint, heat, cy }
 * 组成：玻璃壳 + 上下珠边口沿 + 四角金属护柱 + 底托盘 + 托盘加热条（emissive 可联动）+ 前壁刻度 */
function makeVessel(g, opts) {
  const w = opts.w, h = opts.h, d = opts.d;
  const cx = opts.cx || 0, cy = opts.cy || 0, cz = opts.cz || 0;
  const group = new THREE.Group();
  group.position.set(cx, cy, cz);
  g.add(group);
  /* 玻璃壳 */
  const glass = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMat(opts.op ?? 0.12));
  group.add(glass);
  /* 上下珠边口沿（放样闭环管，细而收敛） */
  const beadMat = matStd(0x9fb4be, { roughness: 0.3, metalness: 0.35, opacity: 0.6, transparent: true });
  group.add(rimBead(w, d, h / 2, beadMat, 0.026));
  group.add(rimBead(w, d, -h / 2, beadMat, 0.026));
  /* 四角金属护柱（深色框架件，不抢玻璃主体） */
  const postGeo = new THREE.BoxGeometry(0.055, h + 0.08, 0.055);
  const postMat = matStd(0x39414a, { roughness: 0.5, metalness: 0.55 });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(sx * (w / 2 + 0.012), 0, sz * (d / 2 + 0.012));
      group.add(post);
    }
  }
  /* 底托盘 + 内嵌加热条（深色金属，防暖光反成粉色地板） */
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.16, 0.09, d + 0.16),
    matStd(0x2e353c, { roughness: 0.55, metalness: 0.45 })
  );
  tray.position.y = -h / 2 - 0.09;
  group.add(tray);
  const heatMat = matGlow(C.heatGlow, 0.08, { roughness: 0.85, color: 0x241408 });
  const heat = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.8, 0.025, d * 0.8),
    heatMat
  );
  heat.position.y = -h / 2 - 0.035;
  group.add(heat);
  /* 前壁刻度贴花 */
  if (opts.scaleMark !== false) {
    const decal = scaleDecal(w, h);
    decal.position.set(-w * 0.27, 0, d / 2 + 0.008);
    group.add(decal);
  }
  /* 内色深度 tint（可选，平衡移动章的红棕色气体） */
  const info = {
    min: new THREE.Vector3(cx - w / 2, cy - h / 2, cz - d / 2),
    max: new THREE.Vector3(cx + w / 2, cy + h / 2, cz + d / 2),
    heat: heatMat,
    cy, w, h, d,
  };
  if (opts.tint) {
    const tint = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xa83818, transparent: true, opacity: 0, depthWrite: false })
    );
    g.add(tint);
    info.tint = tint;
  }
  return info;
}

/* 独立支撑架（双层对照实验：上架托在支架上，不悬空） */
function makeStand(g, x0, y0, y1, w, d) {
  const stand = new THREE.Group();
  const postMat = matStd(0x454b52, { roughness: 0.38, metalness: 0.78 });
  const postGeo = new THREE.CylinderGeometry(0.045, 0.055, y1 - y0, 12);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(sx * (w / 2 - 0.05), (y0 + y1) / 2, sz * (d / 2 - 0.05));
      stand.add(post);
    }
  }
  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.24, 0.07, d + 0.24),
    matStd(0x535a62, { roughness: 0.4, metalness: 0.7 })
  );
  shelf.position.y = y1 - 0.035;
  stand.add(shelf);
  stand.position.set(x0, 0, 0);
  g.add(stand);
  return stand;
}

/* 活塞（深雕）：滑板 + 双胶圈 + 推杆 + 杆箍 + 滚花旋钮（InstancedMesh 齿牙）+ 球头手柄 */
const metalMat = matStd(0x454b52, { roughness: 0.4, metalness: 0.8 });
function makePistonCraft(g, box, h, d) {
  const gp = new THREE.Group();
  /* 滑板主体 */
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, h - 0.08, d - 0.08),
    matStd(0x59616c, { roughness: 0.32, metalness: 0.82 })
  );
  /* 前后密封胶圈 */
  const sealMat = matStd(C.rubber, { roughness: 0.9 });
  const sealGeo = new THREE.BoxGeometry(0.045, h - 0.02, d - 0.02);
  const sealF = new THREE.Mesh(sealGeo, sealMat);
  sealF.position.x = -0.045;
  const sealB = new THREE.Mesh(sealGeo, sealMat);
  sealB.position.x = 0.045;
  /* 推杆 + 杆箍 */
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.62, 12), metalMat);
  rod.rotation.z = Math.PI / 2;
  rod.position.x = 0.34;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 14), metalMat);
  collar.rotation.z = Math.PI / 2;
  collar.position.x = 0.42;
  /* 滚花旋钮（圆盘 + 环向齿牙 InstancedMesh） */
  const knob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.092, 0.092, 0.05, 20),
    matStd(C.knob, { roughness: 0.45, metalness: 0.62 })
  );
  const teeth = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.052, 0.014, 0.02),
    matStd(C.knob, { roughness: 0.4, metalness: 0.7 }),
    16
  );
  const tm = new THREE.Matrix4();
  const tq = new THREE.Quaternion();
  const ts = new THREE.Vector3(1, 1, 1);
  const tpos = new THREE.Vector3();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    tpos.set(0, Math.cos(a) * 0.094, Math.sin(a) * 0.094);
    tq.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -a);
    tm.compose(tpos, tq, ts);
    teeth.setMatrixAt(i, tm);
  }
  teeth.instanceMatrix.needsUpdate = true;
  const knobG = new THREE.Group();
  knobG.add(knob, teeth);
  knobG.rotation.z = Math.PI / 2;
  knobG.position.x = 0.67;
  /* 球头手柄 */
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.062, 18, 14), matStd(0x3d444c, { roughness: 0.35, metalness: 0.7 }));
  ball.position.x = 0.74;
  gp.add(slab, sealF, sealB, rod, collar, knobG, ball);
  g.add(gp);
  gp.position.y = box.cy || 0;   // 活塞组跟器皿中心同高（器皿已落台，cy=-0.8）
  const minX = box.min.x + 0.05;
  const full = box.max.x - 0.12 - minX;
  const st = {
    gp, face: minX + 0.12 + full, target: minX + 0.12 + full, minX, full,
    setVol(v) { this.target = this.minX + 0.12 + this.full * clamp(v, 0.35, 1); },
    vol() { return (this.face - this.minX - 0.12) / this.full; },
    update(dt) {
      this.face += (this.target - this.face) * Math.min(1, dt * 3.5);
      gp.position.x = this.face;
    },
  };
  gp.position.x = st.face;
  return st;
}

/* 催化剂板（深雕）：铂网纹理 + 边沿 lips + 吸附位阵列（发光随开关联动） */
function makeCatalystPlate(g, y) {
  const group = new THREE.Group();
  const netTex = canvasTex(256, 256, (ctx, cw, ch) => {
    ctx.fillStyle = '#8f887a';
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = 'rgba(230,224,206,0.5)';
    ctx.lineWidth = 2;
    for (let i = -ch; i < cw + ch; i += 14) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + ch, ch); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i + ch, 0); ctx.lineTo(i, ch); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(60,52,40,0.28)';
    for (let i = 0; i < 340; i++) {
      ctx.fillRect(Math.random() * cw, Math.random() * ch, 3, 3);
    }
  });
  const plateMat = new THREE.MeshStandardMaterial({
    map: netTex, roughness: 0.42, metalness: 0.72,
    emissive: 0x2a2114, emissiveIntensity: 0.4,
  });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.07, 1.72), plateMat);
  plate.position.y = y;
  group.add(plate);
  /* 边沿 lips（挡条，吸附分子的物理边界感） */
  const lipMat = matStd(0xa89a80, { roughness: 0.45, metalness: 0.6 });
  for (const sz of [-1, 1]) {
    const lip = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.05, 0.05), lipMat);
    lip.position.set(0, y + 0.045, sz * 0.84);
    group.add(lip);
  }
  /* 吸附位阵列（发光小圆片，催化剂开关联动明暗） */
  const siteMat = matGlow(0xe8c88a, 0.85, { roughness: 0.4 });
  const sites = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 10), siteMat, 10);
  const sm = new THREE.Matrix4();
  const seedRnd = (() => { let s = 9; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  for (let i = 0; i < 10; i++) {
    sm.makeTranslation((seedRnd() - 0.5) * 2.4, y + 0.042, (seedRnd() - 0.5) * 1.4);
    sites.setMatrixAt(i, sm);
  }
  sites.instanceMatrix.needsUpdate = true;
  group.add(sites);
  g.add(group);
  return { group, plate, plateMat, siteMat, sites };
}

/* ---------------- 物种表与粒子池 ---------------- */

/* m:1 单球原子；m:0 双原子分子（两球一杆哑铃）；g:1 自由基（发光链载体） */
const KINDS = {
  A:    { m: 1, r: 0.085, c: 0xe0524a },
  B:    { m: 1, r: 0.085, c: 0x3f7fd8 },
  C:    { m: 1, r: 0.085, c: 0x2fa864 },
  inert:{ m: 1, r: 0.072, c: 0x9aa3ad },
  AB:   { m: 0, r: 0.085, c: 0xe0524a, c2: 0x3f7fd8, bc: 0xb9c2cc, len: 0.32 },
  BC:   { m: 0, r: 0.085, c: 0x2fa864, c2: 0x3f7fd8, bc: 0xb9c2cc, len: 0.32 },
  NO2:  { m: 1, r: 0.072, c: 0xc2542e },
  N2O4: { m: 0, r: 0.070, c: 0xd6cec2, c2: 0xd6cec2, bc: 0x9a948c, len: 0.27 },
  H2:   { m: 0, r: 0.060, c: 0xe8e2d6, c2: 0xe8e2d6, bc: 0xb9c2cc, len: 0.21 },
  Cl2:  { m: 0, r: 0.072, c: 0x3fae5a, c2: 0x3fae5a, bc: 0x2f8a48, len: 0.28 },
  HCl:  { m: 0, r: 0.066, c: 0xe8e2d6, c2: 0x3fae5a, bc: 0x8aa89a, len: 0.24 },
  CL:   { m: 1, r: 0.066, c: 0x74e884, g: 1 },
  H:    { m: 1, r: 0.056, c: 0xf2c35e, g: 1 },
};

const R = { parts: [], timeScale: 1 };
const ATOM_CAP = 240, BOND_CAP = 120;

/* 原子：烤漆球质感（clearcoat 高光走向）；键：金属杆 */
const atomMesh = new THREE.InstancedMesh(
  new THREE.SphereGeometry(1, 22, 16),
  new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.28, metalness: 0.06,
    clearcoat: 0.6, clearcoatRoughness: 0.3,
  }),
  ATOM_CAP
);
atomMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
atomMesh.frustumCulled = false;
scene.add(atomMesh);
const bondMesh = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(1, 1, 1, 12),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.38 }),
  BOND_CAP
);
bondMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
bondMesh.frustumCulled = false;
scene.add(bondMesh);
for (let i = 0; i < ATOM_CAP; i++) atomMesh.setColorAt(i, new THREE.Color(1, 1, 1));
for (let i = 0; i < BOND_CAP; i++) bondMesh.setColorAt(i, new THREE.Color(1, 1, 1));

function rUnit(v) {
  v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
  if (v.lengthSq() < 1e-6) v.set(0, 1, 0);
  return v.normalize();
}
function gauss() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

function applyKind(p, kind) {
  const d = KINDS[kind];
  p.kind = kind; p.mono = !!d.m; p.r = d.r;
  p.base.setHex(d.c);
  p.base2.setHex(d.c2 || d.c);
  p.bc.setHex(d.bc || 0xb9c2cc);
  p.len = d.len || 0;
  p.glow = !!d.g;
  p.heat = 0; p.squash = 0; p.ads = 0;
  return p;
}

function makeParticle(kind, x, y, z) {
  const p = {
    kind, mono: true, r: 0.08, len: 0,
    base: new THREE.Color(), base2: new THREE.Color(), bc: new THREE.Color(),
    p: new THREE.Vector3(x, y, z), v: new THREE.Vector3(),
    ax: rUnit(new THREE.Vector3()),
    spinAx: rUnit(new THREE.Vector3()), spinW: 0.7 + Math.random() * 1.5,
    flash: 0, cool: 0, dead: false, heat: 0, glow: false, squash: 0, ads: 0,
    gen: 0, ph: Math.random() * TAU,
  };
  applyKind(p, kind);
  R.parts.push(p);
  return p;
}

function sweepList(arr) {
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i].dead) arr.splice(i, 1);
}

/* ---------------- 渲染：实例矩阵填充（count 裁剪，空闲实例零开销） ---------------- */

const _m4 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _bc = new THREE.Color();
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _v4 = new THREE.Vector3();
const IDQ = new THREE.Quaternion();
const YUP = new THREE.Vector3(0, 1, 0);
const WARM = new THREE.Color(0xffa040);
const WHITE = new THREE.Color(0xffffff);

function renderParts(time) {
  let ai = 0, bi = 0;
  for (const p of R.parts) {
    if (p.dead) continue;
    if (p.mono) {
      _c.copy(p.base);
      if (p.heat > 0) _c.lerp(WARM, p.heat);
      if (p.glow) _c.lerp(WHITE, 0.22 + 0.18 * Math.sin(time * 9 + p.ph));
      if (p.flash > 0) _c.lerp(WHITE, Math.min(1, p.flash * 1.3));
      const pop = (p.flash > 0 ? p.flash * 0.45 : 0) + (p.glow ? 0.05 * Math.sin(time * 9 + p.ph) : 0);
      _s.set(p.r * (1 + pop), p.r * (1 + pop) * (p.squash > 0 ? p.squash : 1), p.r * (1 + pop));
      _m4.compose(p.p, IDQ, _s);
      atomMesh.setMatrixAt(ai, _m4);
      atomMesh.setColorAt(ai, _c);
      ai++;
    } else {
      const h = p.len / 2 - p.r * 0.35;
      const pop = p.flash > 0 ? p.flash * 0.4 : 0;
      const rr = p.r * (1 + pop);
      _v1.copy(p.ax).multiplyScalar(h).add(p.p);
      _v2.copy(p.ax).multiplyScalar(-h).add(p.p);
      _s.setScalar(rr);
      _m4.compose(_v1, IDQ, _s);
      atomMesh.setMatrixAt(ai, _m4);
      atomMesh.setColorAt(ai, _c.copy(p.base));
      ai++;
      _m4.compose(_v2, IDQ, _s);
      atomMesh.setMatrixAt(ai, _m4);
      atomMesh.setColorAt(ai, _c.copy(p.base2));
      ai++;
      _q.setFromUnitVectors(YUP, p.ax);
      _s.set(p.r * 0.24, p.len - p.r * 1.1, p.r * 0.24);
      _m4.compose(p.p, _q, _s);
      bondMesh.setMatrixAt(bi, _m4);
      bondMesh.setColorAt(bi, _bc.copy(p.bc));
      bi++;
    }
  }
  atomMesh.count = Math.min(ai, ATOM_CAP);
  bondMesh.count = Math.min(bi, BOND_CAP);
  atomMesh.instanceMatrix.needsUpdate = true;
  bondMesh.instanceMatrix.needsUpdate = true;
  if (atomMesh.instanceColor) atomMesh.instanceColor.needsUpdate = true;
  if (bondMesh.instanceColor) bondMesh.instanceColor.needsUpdate = true;
}

/* ---------------- 自由基辉光（发光链载体的 halo 池，随粒子呼吸） ---------------- */

const haloTex = makeGlowTexture('255,244,214', [[0, 'rgba(C,0.85)'], [0.35, 'rgba(C,0.4)'], [1, 'rgba(C,0)']]);
const halos = [];
for (let i = 0; i < 16; i++) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0,
  }));
  sp.visible = false;
  scene.add(sp);
  halos.push(sp);
}
function updateHalos(time) {
  let hi = 0;
  for (const p of R.parts) {
    if (p.dead || !p.glow) continue;
    if (hi >= halos.length) break;
    const sp = halos[hi++];
    sp.visible = true;
    sp.position.copy(p.p);
    const pulse = 0.3 + 0.055 * Math.sin(time * 9 + p.ph);
    sp.scale.set(pulse, pulse, 1);
    sp.material.opacity = 0.5 + 0.16 * Math.sin(time * 9 + p.ph);
    sp.material.color.copy(p.base).lerp(WHITE, 0.4);
  }
  for (; hi < halos.length; hi++) halos[hi].visible = false;
}

/* ---------------- 闪光与浮字 ---------------- */

const flashes = [];
for (let i = 0; i < 12; i++) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,240,190', [[0, 'rgba(C,0.95)'], [0.3, 'rgba(C,0.5)'], [1, 'rgba(C,0)']]),
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0,
  }));
  sp.visible = false;
  scene.add(sp);
  flashes.push({ sp, t: 1, dur: 0.5, s0: 0.5 });
}
function flash(x, y, z, color = 0xffe9a8, scale = 0.5, dur = 0.5) {
  const f = flashes.find((q) => q.t >= 1) || flashes[0];
  f.t = 0; f.dur = dur; f.s0 = scale;
  f.sp.visible = true;
  f.sp.position.set(x, y, z);
  f.sp.material.color.set(color);
}

const labels = [];
for (let i = 0; i < 5; i++) {
  const sp = makeTextSprite(' ', { fontSize: 34, color: '#fff', bg: 'rgba(13,18,26,0.78)', scale: 0.0042 });
  sp.visible = false;
  scene.add(sp);
  labels.push({ sp, t: 1 });
}
function label(text, x, y, z, color = '#ffffff') {
  const l = labels.find((q) => q.t >= 1) || labels[0];
  setSpriteText(l.sp, text, { fontSize: 34, color, bg: 'rgba(13,18,26,0.78)', scale: 0.0042 });
  l.sp.visible = true;
  l.sp.position.set(x, y, z);
  l.t = 0;
}

function updateFx(dt, time) {
  for (const p of R.parts) {
    if (p.flash > 0) p.flash = Math.max(0, p.flash - dt * 1.8);
  }
  for (const f of flashes) {
    if (f.t < 1) {
      f.t = Math.min(1, f.t + dt / f.dur);
      f.sp.material.opacity = (1 - f.t) * 0.95;
      const s = f.s0 * (0.5 + f.t * 0.9);
      f.sp.scale.set(s, s, 1);
      if (f.t >= 1) f.sp.visible = false;
    }
  }
  for (const l of labels) {
    if (l.t < 1) {
      l.t = Math.min(1, l.t + dt / 1.5);
      l.sp.material.opacity = l.t < 0.12 ? l.t / 0.12 : Math.max(0, 1 - (l.t - 0.12) / 0.88);
      l.sp.position.y += dt * 0.16;
      if (l.t >= 1) l.sp.visible = false;
    }
  }
  updateHalos(time);
}

/* ---------------- 图表：调色 / 画布 / 图窗工厂（头部折叠 → 40px 圆徽标） ---------------- */

let palCache = null;
function pal() {
  if (palCache) return palCache;
  const cs = getComputedStyle(document.documentElement);
  const g = (n, fb) => (cs.getPropertyValue(n) || fb).trim();
  palCache = {
    text: g('--text', '#2a3441'), dim: g('--text-dim', '#66717e'),
    accent: g('--accent', '#e8674a'), border: g('--card-border', 'rgba(20,32,44,0.09)'),
  };
  return palCache;
}
window.addEventListener('edulabtheme', () => { palCache = null; });

const FONT = '9.5px -apple-system, "PingFang SC", sans-serif';
const FONTB = '600 10.5px -apple-system, "PingFang SC", sans-serif';

function prepCanvas(cv, hCss) {
  const W = cv.clientWidth || 300;
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

/* 图窗：标题栏（含折叠钮）+ 画布；折叠态收成 40px 圆徽标（点击恢复）。
 * 记忆键独立；≤1100px 首访清爽态默认折叠（用户操作后落盘）。 */
function makeChartWin(title, hCss, badgeText, foldKey, posKey) {
  const el = document.createElement('div');
  el.className = 'rx-chart';
  if (posKey) el.dataset.win = posKey;
  const head = document.createElement('div');
  head.className = 'rx-cv-head';
  const b = document.createElement('b');
  b.textContent = title;
  const info = document.createElement('span');
  info.className = 'rx-info';
  const foldBtn = document.createElement('button');
  foldBtn.type = 'button';
  foldBtn.className = 'fold-btn';
  foldBtn.textContent = '−';
  foldBtn.setAttribute('aria-label', '收起' + title + '窗');
  foldBtn.setAttribute('title', '收起' + title + '窗');
  head.appendChild(b);
  head.appendChild(info);
  head.appendChild(foldBtn);
  const cv = document.createElement('canvas');
  el.appendChild(head);
  el.appendChild(cv);
  const badgeBtn = document.createElement('button');
  badgeBtn.type = 'button';
  badgeBtn.className = 'rx-badge';
  badgeBtn.textContent = badgeText;
  badgeBtn.setAttribute('aria-label', '展开' + title + '窗');
  badgeBtn.setAttribute('title', '展开' + title + '窗');
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
  };
}
const mbChart = makeChartWin('麦克斯韦-玻尔兹曼分布', 192, 'ƒ', 'reaction.foldMB', 'mb');
const tChart = makeChartWin('浓度-时间曲线', 240, 'c·t', 'reaction.foldT', 't');
const profChart = makeChartWin('能量剖面 · 反应进程', 196, 'Ea', 'reaction.foldProf', 'prof');
const chainChart = makeChartWin('链增长 · HCl 累计', 210, 'HCl', 'reaction.foldChain', 'chain');
const CHARTS = [mbChart, tChart, profChart, chainChart];

/* MB 分布：f(v) 正比 v^2 exp(-v^2/2sig^2)，sig = 297*sqrt(T/300)（峰值速率 sqrt(2)*sig 约 420 m/s @300K） */
function drawMB() {
  const cfg = mbChart.cfg || {};
  const { ctx, W, H } = prepCanvas(mbChart.cv, 192);
  const P = pal();
  const L = 34, Rp = 10, T = 12, B = 18, pw = W - L - Rp, ph = H - T - B, VMAX = 2000;
  const X = (v) => L + (v / VMAX) * pw;
  const Y = (f) => T + (1 - f) * ph;
  const sig = 297 * Math.sqrt((cfg.T || 300) / 300);
  const fmax = 2 * sig * sig / Math.E;   // 峰值 v²·exp(−1)/(2σ²/e) = 1：曲线满高
  const F = (v) => Math.min(1, (v * v * Math.exp(-v * v / (2 * sig * sig))) / fmax);
  ctx.strokeStyle = P.border;
  ctx.fillStyle = P.dim;
  ctx.lineWidth = 1;
  ctx.font = FONT;
  ctx.textAlign = 'right';
  [0, 0.5, 1].forEach((f) => {
    const y = Y(f);
    ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + pw, y); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(Math.round(f * 100) + '%', L - 4, y + 3);
  });
  ctx.textAlign = 'center';
  for (let v = 0; v <= VMAX; v += 500) ctx.fillText(v === 0 ? '0' : (v / 1000) + 'k', X(v), H - 5);
  ctx.strokeRect(L, T, pw, ph);
  if (cfg.showRef) {
    const sr = 297, srf = 2 * sr * sr / Math.E;
    ctx.save();
    ctx.setLineDash([5, 4]); ctx.strokeStyle = P.dim; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let v = 0; v <= VMAX; v += 25) {
      const y = Y(Math.min(1, (v * v * Math.exp(-v * v / (2 * sr * sr))) / srf));
      if (v) ctx.lineTo(X(v), y); else ctx.moveTo(X(v), y);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = P.dim; ctx.textAlign = 'left';
    ctx.fillText('300K', X(1050), Y(Math.min(1, (1050 * 1050 * Math.exp(-1050 * 1050 / (2 * sr * sr))) / srf)) - 4);
  }
  const eas = [{ va: cfg.va || 900, c: P.accent, a: 0.15, lab: 'Ea' }];
  if (cfg.cat) eas.unshift({ va: (cfg.va || 900) * 0.6, c: '#2fa864', a: 0.17, lab: 'Ea(催)' });
  for (const ea of eas) {
    ctx.beginPath();
    ctx.moveTo(X(ea.va), Y(0));
    for (let v = ea.va; v <= VMAX; v += 25) ctx.lineTo(X(v), Y(F(v)));
    ctx.lineTo(X(VMAX), Y(0));
    ctx.closePath();
    ctx.globalAlpha = ea.a;
    ctx.fillStyle = ea.c;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = ea.c; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(X(ea.va), Y(0)); ctx.lineTo(X(ea.va), Y(0.92)); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = ea.c; ctx.textAlign = 'left'; ctx.font = FONTB;
    ctx.fillText(ea.lab, X(ea.va) + 4, T + 10);
  }
  ctx.strokeStyle = P.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let v = 0; v <= VMAX; v += 25) {
    const y = Y(F(v));
    if (v) ctx.lineTo(X(v), y); else ctx.moveTo(X(v), y);
  }
  ctx.stroke();
  ctx.fillStyle = P.dim; ctx.textAlign = 'right'; ctx.font = FONT;
  ctx.fillText('v/(m/s)', L + pw - 2, H - 5);
}

/* 能量剖面（原版 chart:'profile' 对齐）：反应进程-势能曲线，
 * 无催化峰（Ea）实线 + 催化路径（Ea·0.6）虚线 + 反应物/产物能级 + ΔH 桥注 */
function drawProfile() {
  const cfg = profChart.cfg || {};
  const { ctx, W, H } = prepCanvas(profChart.cv, 196);
  const P = pal();
  const L = 30, Rp = 12, T = 14, B = 20, pw = W - L - Rp, ph = H - T - B;
  const X = (k) => L + k * pw;                       // k: 0..1 反应进程
  const E = { R: 0.34, P: 0.2, peak: 0.86, catPeak: 0.62 };   // 归一化势能高度
  const Y = (e) => T + (1 - e) * ph;
  const path = (peak, upK, downK, upEase, downEase) => {
    ctx.beginPath();
    ctx.moveTo(X(0), Y(E.R));
    for (let i = 0; i <= 24; i++) {
      const k = (i / 24) * upK;
      ctx.lineTo(X(k), Y(E.R + (peak - E.R) * upEase(i / 24)));
    }
    for (let i = 1; i <= 24; i++) {
      const k = upK + (i / 24) * (1 - upK);
      ctx.lineTo(X(k), Y(E.P + (peak - E.P) * (1 - downEase(i / 24))));
    }
  };
  const cosIn = (t) => 0.5 - 0.5 * Math.cos(t * Math.PI);
  /* 坐标框 */
  ctx.strokeStyle = P.border;
  ctx.fillStyle = P.dim;
  ctx.lineWidth = 1;
  ctx.font = FONT;
  ctx.strokeRect(L, T, pw, ph);
  ctx.textAlign = 'right';
  ctx.fillText('势能', L - 4, T + 10);
  ctx.textAlign = 'center';
  ctx.fillText('反应进程', L + pw / 2, H - 5);
  /* 能级短横线 */
  ctx.strokeStyle = P.dim;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(L, Y(E.R)); ctx.lineTo(L + pw * 0.2, Y(E.R)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(L + pw * 0.8, Y(E.P)); ctx.lineTo(L + pw, Y(E.P)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.textAlign = 'left';
  ctx.fillText('反应物', L + 2, Y(E.R) + 13);
  ctx.textAlign = 'right';
  ctx.fillText('产物', L + pw - 2, Y(E.P) + 13);
  /* 催化路径（绿虚线，低峰） */
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = '#2fa864';
  ctx.lineWidth = 1.6;
  path(E.catPeak, 0.42, 0.4, cosIn, cosIn);
  ctx.stroke();
  ctx.restore();
  /* 无催化路径（橙实线，高峰） */
  ctx.strokeStyle = P.accent;
  ctx.lineWidth = 2;
  path(E.peak, 0.46, 0.36, cosIn, cosIn);
  ctx.stroke();
  /* 峰顶标注 */
  ctx.font = FONTB;
  ctx.fillStyle = P.accent;
  ctx.textAlign = 'center';
  ctx.fillText('Ea', X(0.46), Y(E.peak) - 5);
  ctx.fillStyle = '#2fa864';
  ctx.fillText('Ea(催)', X(0.42), Y(E.catPeak) - 5);
  /* ΔH 桥注（放热：产物更低） */
  const midX = L + pw * 0.58;
  ctx.strokeStyle = P.dim;
  ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(midX, Y(E.R)); ctx.lineTo(midX, Y(E.P)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = P.dim;
  ctx.font = FONT;
  ctx.textAlign = 'left';
  ctx.fillText('ΔH<0（放热）', midX + 4, (Y(E.R) + Y(E.P)) / 2 + 3);
  if (cfg.cat === false) {
    ctx.fillStyle = P.dim;
    ctx.textAlign = 'center';
    ctx.fillText('催化剂已移除：只剩高能垒路径', L + pw / 2, T + 11);
  }
}

/* 活化分子比例：Ea 滑杆值(0.8~2.4) 映射速率阈值 va = Ea*750 m/s，数值积分 */
function mbFrac(va, T) {
  const sig = 297 * Math.sqrt(T / 300);
  let tot = 0, act = 0;
  for (let v = 0; v < 2400; v += 6) {
    const f = v * v * Math.exp(-v * v / (2 * sig * sig));
    tot += f;
    if (v >= va) act += f;
  }
  return act / tot;
}

/* 时间序列面板（浓度-时间 / 链增长共用） */
function panel(ctx, px, py, pw, ph, o) {
  const P = pal();
  const L = 30, Rp = 8, T = 12, B = 15;
  const iw = pw - L - Rp, ih = ph - T - B;
  const x0 = px + L, y0 = py + T;
  const X = (t) => x0 + (t / o.xMax) * iw;
  const Y = (v) => y0 + (1 - (v - o.yMin) / (o.yMax - o.yMin)) * ih;
  ctx.strokeStyle = P.border;
  ctx.fillStyle = P.dim;
  ctx.lineWidth = 1;
  ctx.font = FONT;
  ctx.textAlign = 'right';
  for (let i = 0; i <= 2; i++) {
    const v = o.yMin + ((o.yMax - o.yMin) * i) / 2, y = Y(v);
    ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + iw, y); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(o.yFmt ? o.yFmt(v) : v.toFixed(1), x0 - 4, y + 3);
  }
  ctx.textAlign = 'center';
  const xs = o.xStep || Math.max(5, Math.ceil(o.xMax / 4 / 5) * 5);
  for (let t = 0; t <= o.xMax + 1e-6; t += xs) ctx.fillText(Math.round(t) + 's', X(t), y0 + ih + 12);
  ctx.strokeRect(x0, y0, iw, ih);
  (o.events || []).forEach((ev) => {
    if (ev.t < 0 || ev.t > o.xMax) return;
    ctx.save();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = ev.c; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(X(ev.t), y0); ctx.lineTo(X(ev.t), y0 + ih); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = ev.c; ctx.textAlign = 'left'; ctx.font = FONTB;
    ctx.fillText(ev.lab, X(ev.t) + 3, y0 + 9);
  });
  (o.series || []).forEach((s) => {
    if (s.pts.length < 2) return;
    ctx.strokeStyle = s.c;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    let started = false;
    for (const pt of s.pts) {
      if (pt[0] < 0) continue;
      const x = X(pt[0]), y = Y(pt[1]);
      if (started) ctx.lineTo(x, y); else { ctx.moveTo(x, y); started = true; }
    }
    ctx.stroke();
  });
  let lx = x0 + 6;
  ctx.textAlign = 'left';
  ctx.font = FONT;
  (o.series || []).forEach((s) => {
    ctx.fillStyle = s.c;
    ctx.fillRect(lx, y0 - 8, 9, 3);
    ctx.fillStyle = P.dim;
    ctx.fillText(s.label, lx + 12, y0 - 4);
    lx += 16 + ctx.measureText(s.label).width;
  });
}

/* 链增长曲线（原版 chart:'chain' 对齐）：HCl 累计（左轴）+ 自由基在场数（右系列） */
function drawChain() {
  const cfg = chainChart.cfg || {};
  const { ctx, W } = prepCanvas(chainChart.cv, 210);
  const s = cfg.samples || [];
  const sHcl = { label: 'HCl 累计', c: '#e8b04a', pts: s.map((p) => [p.t, p.hcl]) };
  const sRad = { label: '自由基在场', c: '#5cc98a', pts: s.map((p) => [p.t, p.rad]) };
  const tMax = Math.max(12, s.length ? s[s.length - 1].t : 12);
  let yMax = 4;
  for (const p of s) yMax = Math.max(yMax, p.hcl, p.rad);
  panel(ctx, 0, 4, W, 202, {
    xMax: tMax, yMin: 0, yMax: yMax * 1.12, yFmt: (v) => String(Math.round(v)),
    series: [sHcl, sRad], events: cfg.events || [],
  });
}

/* ---------------- HUD（读数卡收纳进右栏数据坞）/ 提示 / 图例 ---------------- */

const hudWrap = document.getElementById('lcData');
const hud1 = makeHUD(hudWrap, [['tot', '碰撞总数'], ['eff', '有效碰撞'], ['ori', '取向合适率']]);
const hud3 = makeHUD(hudWrap, [['a', '无催化剂反应'], ['b', '有催化剂反应'], ['t', '对照剩余']]);
const hud4 = makeHUD(hudWrap, [['col', '壁面碰撞频率'], ['eff', '有效碰撞频率'], ['n', '分子数 · 体积']]);
const hud7 = makeHUD(hudWrap, [['rad', '链载体数'], ['hcl', 'HCl 生成'], ['gen', '代数']]);
const HUDS = [hud1, hud3, hud4, hud7];

let toastTimer = null;
function toast(text, kind = '') {
  let el = stage.querySelector('.rx-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'rx-toast';
    stage.appendChild(el);
  }
  el.textContent = text;
  el.className = 'rx-toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
}
function hideToast() {
  const el = stage.querySelector('.rx-toast');
  if (el) el.classList.remove('show');
}

let legendEl = null;
function setLegend(rows) {
  if (!rows) {
    if (legendEl) { legendEl.remove(); legendEl = null; }
    return;
  }
  if (!legendEl) {
    legendEl = document.createElement('div');
    legendEl.className = 'legend';
    stage.appendChild(legendEl);
  }
  legendEl.innerHTML = '';
  for (const row of rows) {
    const r = document.createElement('div');
    r.className = 'lg-row';
    const sw = document.createElement('span');
    sw.className = 'sw dot';
    sw.style.background = row[0];
    r.appendChild(sw);
    r.appendChild(document.createTextNode(row[1]));
    legendEl.appendChild(r);
  }
}

/* ---------------- 气体引擎 ---------------- */

function setBoxSpeeds(parts, s0) {
  const k = s0 / Math.sqrt(3);
  for (const p of parts) p.v.set(gauss(), gauss(), gauss()).multiplyScalar(k);
}
function randPosIn(S, out) {
  out.set(
    S.min.x + 0.15 + Math.random() * (S.max.x - S.min.x - 0.3),
    S.min.y + 0.15 + Math.random() * (S.max.y - S.min.y - 0.3),
    S.min.z + 0.15 + Math.random() * (S.max.z - S.min.z - 0.3)
  );
  return out;
}

function stepGas(S, dt, onWall) {
  for (const p of S.parts) {
    if (p.dead) continue;
    p.p.addScaledVector(p.v, dt);
    if (!p.mono) p.ax.applyAxisAngle(p.spinAx, p.spinW * dt).normalize();
    if (p.cool > 0) p.cool -= dt;
    const r = p.r;
    let hit = false;
    if (p.p.x < S.min.x + r) { p.p.x = S.min.x + r; p.v.x = Math.abs(p.v.x); hit = true; }
    else if (p.p.x > S.max.x - r) { p.p.x = S.max.x - r; p.v.x = -Math.abs(p.v.x); hit = true; }
    if (p.p.y < S.min.y + r) { p.p.y = S.min.y + r; p.v.y = Math.abs(p.v.y); hit = true; }
    else if (p.p.y > S.max.y - r) { p.p.y = S.max.y - r; p.v.y = -Math.abs(p.v.y); hit = true; }
    if (p.p.z < S.min.z + r) { p.p.z = S.min.z + r; p.v.z = Math.abs(p.v.z); hit = true; }
    else if (p.p.z > S.max.z - r) { p.p.z = S.max.z - r; p.v.z = -Math.abs(p.v.z); hit = true; }
    if (hit) { S.wall++; if (onWall) onWall(p); }
  }
}

function pairScan(parts, fn) {
  for (let i = 0; i < parts.length; i++) {
    const a = parts[i];
    if (a.dead) continue;
    for (let j = i + 1; j < parts.length; j++) {
      const b = parts[j];
      if (b.dead || a.dead) continue;
      const dx = a.p.x - b.p.x, dy = a.p.y - b.p.y, dz = a.p.z - b.p.z;
      const rr = a.r + b.r + 0.02;
      if (dx * dx + dy * dy + dz * dz > rr * rr) continue;
      if (a.cool > 0 || b.cool > 0) continue;
      a.cool = b.cool = 0.15;
      if (fn(a, b) === false) a.cool = b.cool = 0;
    }
  }
}

function elastic(a, b) {
  _v1.subVectors(b.p, a.p);
  const d = _v1.length() || 0.001;
  _v1.divideScalar(d);
  _v2.subVectors(a.v, b.v);
  const rel = _v2.dot(_v1);
  if (rel > 0) {
    a.v.addScaledVector(_v1, -rel);
    b.v.addScaledVector(_v1, rel);
  }
  const overlap = (a.r + b.r + 0.02) - d;
  if (overlap > 0) {
    a.p.addScaledVector(_v1, -overlap / 2);
    b.p.addScaledVector(_v1, overlap / 2);
  }
}

/* 加热条联动（升温 → 托盘发热件 emissive 走亮：温度的 3D 可视反馈） */
function setHeat(info, T) {
  if (!info || !info.heat) return;
  info.heat.emissiveIntensity = 0.08 + clamp((T - 300) / 600, 0, 1) * 1.6;
}

/* ---------------- 章节注册与帧循环 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
const CHG = [];
const UPD = {};
let cur = -1;
let activeSectionCleanup = null;

function hideAll() {
  CHG.forEach((g) => { g.visible = false; });
  CHARTS.forEach((c) => c.show(false));
  HUDS.forEach((h) => { h.el.style.display = 'none'; });
  setLegend(null);
  hideToast();
  app.setPaused(false);
  R.timeScale = 1;
  R.parts.length = 0;
  photon.visible = false;
  photonSt.t = -1;
  cur = -1;
}

app.onFrame((dtRaw, time) => {
  const dt = Math.min(dtRaw, 0.05) * R.timeScale;
  updateFx(Math.min(dtRaw, 0.05), time);
  if (cur >= 0 && UPD[cur]) UPD[cur](dt, Math.min(dtRaw, 0.05), time);
  renderParts(time);
});

/* ================= 章节 1 · 有效碰撞 ================= */
/* 模型：AB + C -> A + BC（置换型）。取向正确 = C 沿 A-B 键轴方向撞向 A 端；
 * 能量 >= Ea 且取向正确才反应；E < Ea 一律弹回（能量不足）。
 * 「取向要求」开关 1:1 原版：关掉后能量达标的碰撞一律按有效处理。 */

const st1 = {
  g: new THREE.Group(),
  E: 1.2, Ea: 1.0,
  total: 0, eff: 0, ok: 0,
  auto: false, phase: 'idle', t: 0, wait: 0, mode: 'good',
  orientReq: true,
  C: null, AB: null,
};
scene.add(st1.g);
CHG.push(st1.g);
st1.g.position.y = -0.85;
{
  const zone = circleLine(1.5, 0x7f95a8, 72);
  zone.material.opacity = 0.3;
  st1.g.add(zone);
  const zone2 = circleLine(0.85, 0x7f95a8, 64);
  zone2.material.opacity = 0.14;
  st1.g.add(zone2);
}

function collide1() {
  const S = st1;
  R.parts.length = 0;
  S.AB = makeParticle('AB', 0, -0.85, 0);
  rUnit(S.AB.ax);
  const roll = Math.random();
  S.mode = roll < 0.34 ? 'good' : roll < 0.67 ? 'end' : 'side';
  const ax = S.AB.ax;
  const dir = _v3;
  if (S.mode === 'good') dir.copy(ax);
  else if (S.mode === 'end') dir.copy(ax).multiplyScalar(-1);
  else {
    dir.crossVectors(ax, Math.abs(ax.y) < 0.9 ? YUP : _v4.set(1, 0, 0)).normalize();
    dir.addScaledVector(ax, (Math.random() - 0.5) * 0.6);
  }
  _v1.crossVectors(dir, Math.abs(dir.y) < 0.9 ? YUP : _v4.set(1, 0, 0)).normalize();
  dir.addScaledVector(_v1, (Math.random() - 0.5) * 0.16).normalize();
  const speed = 1.1 + 1.2 * S.E;
  S.C = makeParticle('C', dir.x * 2.7, -0.85 + dir.y * 2.7, dir.z * 2.7);
  S.C.v.copy(dir).multiplyScalar(-speed);
  S.phase = 'approach';
}

function resolve1() {
  const S = st1;
  S.total++;
  const orientOk = S.mode === 'good' || !S.orientReq;
  if (orientOk) S.ok++;
  const cp = S.C.p;
  if (S.E < S.Ea) {
    S.C.v.multiplyScalar(-0.75);
    S.AB.v.copy(S.C.v).multiplyScalar(-0.12);
    label(S.mode === 'good' ? '能量不足：E < Ea，弹回' : '能量不足 · 取向不合', cp.x, cp.y + 0.32, cp.z, '#ffb14a');
    flash(cp.x, cp.y, cp.z, 0xffb14a, 0.5);
    S.phase = 'result';
    S.t = 0;
    return;
  }
  if (orientOk) {
    S.eff++;
    flash(0, -0.85, 0, 0xffe9a8, 1.15);
    label('有效碰撞：生成 A + BC', 0, -0.25, 0, '#7ee2a0');
    const half = S.AB.len / 2 - S.AB.r * 0.35;
    _v1.copy(S.AB.ax).multiplyScalar(half);
    _v2.crossVectors(S.AB.ax, YUP);
    if (_v2.lengthSq() < 1e-4) _v2.set(1, 0, 0);
    _v2.normalize();
    S.AB.dead = true;
    S.C.dead = true;
    const pa = makeParticle('A', _v1.x, -0.85 + _v1.y, _v1.z);
    pa.v.copy(S.AB.ax).multiplyScalar(1.35).addScaledVector(_v2, 0.3);
    const bc = makeParticle('BC', -_v1.x * 0.5, -0.85 - _v1.y * 0.5, -_v1.z * 0.5);
    bc.ax.copy(S.AB.ax);
    bc.v.copy(S.AB.ax).multiplyScalar(-1.0).addScaledVector(_v2, -0.3);
  } else {
    S.C.v.multiplyScalar(-0.75);
    S.AB.v.copy(S.C.v).multiplyScalar(-0.15);
    label('取向不合，弹开', cp.x, cp.y + 0.32, cp.z, '#ffb14a');
    flash(cp.x, cp.y, cp.z, 0x9fb8d8, 0.45);
  }
  S.phase = 'result';
  S.t = 0;
}

UPD[0] = (dt) => {
  const S = st1;
  if (S.phase === 'approach' && S.C) {
    S.C.p.addScaledVector(S.C.v, dt);
    const half = S.AB.len / 2 - S.AB.r * 0.35;
    _v1.set(S.AB.p.x + S.AB.ax.x * half, S.AB.p.y + S.AB.ax.y * half, S.AB.p.z + S.AB.ax.z * half);
    _v2.set(S.AB.p.x - S.AB.ax.x * half, S.AB.p.y - S.AB.ax.y * half, S.AB.p.z - S.AB.ax.z * half);
    const dA = _v1.distanceTo(S.C.p);
    const dB = _v2.distanceTo(S.C.p);
    if (dA < S.C.r + S.AB.r + 0.02 || dB < S.C.r + S.AB.r + 0.02) resolve1();
  } else if (S.phase === 'result') {
    S.t += dt;
    for (const p of R.parts) p.p.addScaledVector(p.v, dt);
    if (S.t > 1.15) {
      S.phase = 'idle';
      S.wait = 0.5;
      sweepList(R.parts);
    }
  } else if (S.auto) {
    S.wait -= dt;
    if (S.wait <= 0) collide1();
  }
  hud1.set('tot', String(S.total));
  hud1.set('eff', String(S.eff));
  hud1.set('ori', S.total ? Math.round((S.ok / S.total) * 100) + '%' : '—');
};

/* ================= 章节 2 · 温度与活化分子 ================= */

const st2 = { g: new THREE.Group(), T: 300, Tt: 300, Ea: 1.2, showRef: false };
scene.add(st2.g);
CHG.push(st2.g);
st2.box = makeVessel(st2.g, { w: 3.0, h: 1.7, d: 2.0, cy: -0.8 });
const S2 = { parts: R.parts, min: st2.box.min, max: st2.box.max, wall: 0, s0: 0.62 };

UPD[1] = (dt) => {
  const S = st2;
  if (Math.abs(S.Tt - S.T) > 0.5) {
    const f = Math.sqrt(S.Tt / S.T);
    for (const p of R.parts) p.v.multiplyScalar(f);
    S.T = S.Tt;
    S2.s0 = 0.62 * Math.sqrt(S.T / 300);
  }
  setHeat(st2.box, S.T);
  stepGas(S2, dt);
  pairScan(R.parts, (a, b) => { elastic(a, b); });
  for (const p of R.parts) {
    const sp = p.v.length();
    p.heat = Math.min(1, (sp / (S2.s0 * 2.1)) * (sp / (S2.s0 * 2.1))) * 0.9;
  }
  const va = S.Ea * 750;
  mbChart.cfg = { T: S.T, va, showRef: S.showRef, cat: false };
  if (mbChart.open) drawMB();
  mbChart.info.textContent = Math.round(S.T) + ' K · v≥Ea：' + (mbFrac(va, S.T) * 100).toFixed(1) + '%';
};

/* ================= 章节 3 · 催化剂 ================= */
/* 上盒无催化剂（对照）、下盒有催化剂表面：分子撞上表面被吸附（贴附+压扁=键削弱），
 * 更容易越过低势垒（Ea 降为 0.6Ea）完成 A+B->AB 后脱附；计时 10 s 对照。
 * 上盒由支撑架托住（不悬空）；能量剖面窗对齐原版 chart:'profile'。 */

const st3 = {
  g: new THREE.Group(),
  T: 300, Tt: 300, cat: true, runT: 0, cTop: 0, cBot: 0, Ea: 1.2,
};
scene.add(st3.g);
CHG.push(st3.g);
st3.top = makeVessel(st3.g, { w: 3.0, h: 1.25, d: 2.0, cy: 0.5 });
st3.bot = makeVessel(st3.g, { w: 3.0, h: 1.25, d: 2.0, cy: -1.02 });
makeStand(st3.g, 0, -1.72, -0.08, 3.0, 2.0);
st3.plateUI = makeCatalystPlate(st3.g, st3.bot.min.y + 0.06);
{
  const lt = makeTextSprite('无催化剂（对照）', { fontSize: 26, color: '#c9ccd2', scale: 0.003 });
  lt.position.set(-2.12, 0.5, 0);
  st3.g.add(lt);
  const lb = makeTextSprite('有催化剂表面', { fontSize: 26, color: '#e8c88a', scale: 0.003 });
  lb.position.set(-2.12, -1.02, 0);
  st3.g.add(lb);
}
const S3T = { parts: [], min: st3.top.min, max: st3.top.max, wall: 0, s0: 0.62 };
const S3B = { parts: [], min: st3.bot.min, max: st3.bot.max, wall: 0, s0: 0.62 };

function fillBox3(list, S) {
  for (let i = 0; i < 16; i++) {
    const pa = makeParticle('A', 0, 0, 0);
    randPosIn(S, pa.p);
    const pb = makeParticle('B', 0, 0, 0);
    randPosIn(S, pb.p);
    list.push(pa, pb);
  }
  setBoxSpeeds(list, S.s0);
}
function resetBoxes3() {
  R.parts.length = 0;
  S3T.parts.length = 0;
  S3B.parts.length = 0;
  fillBox3(S3T.parts, S3T);
  fillBox3(S3B.parts, S3B);
}

function tryReact3(a, b, cat) {
  if ((a.kind !== 'A' && a.kind !== 'B') || (b.kind !== 'A' && b.kind !== 'B') || a.kind === b.kind) {
    elastic(a, b);
    return;
  }
  const s0 = 0.62 * Math.sqrt(st3.T / 300);
  const q2 = _v1.subVectors(a.v, b.v).lengthSq() / (s0 * s0);
  const adsorbed = cat && (a.ads > 0 || b.ads > 0);
  const pr = adsorbed ? 0.85 : clamp((q2 - 4) * 0.5, 0, 0.7);
  if (Math.random() < pr) {
    a.dead = b.dead = true;
    const m = makeParticle('AB', (a.p.x + b.p.x) / 2, (a.p.y + b.p.y) / 2, (a.p.z + b.p.z) / 2);
    m.v.copy(a.v).add(b.v).multiplyScalar(0.5);
    if (adsorbed) m.v.set((Math.random() - 0.5) * 0.3, 0.9 + Math.random() * 0.4, (Math.random() - 0.5) * 0.3);
    flash(m.p.x, m.p.y, m.p.z, 0xffe9a8, 0.5);
    if (cat) st3.cBot++; else st3.cTop++;
  } else {
    elastic(a, b);
  }
}

UPD[2] = (dt, rdt) => {
  const S = st3;
  if (Math.abs(S.Tt - S.T) > 0.5) {
    const f = Math.sqrt(S.Tt / S.T);
    S.T = S.Tt;
    S3T.s0 = S3B.s0 = 0.62 * Math.sqrt(S.T / 300);
    for (const p of R.parts) p.v.multiplyScalar(f);
  }
  setHeat(st3.top, S.T);
  setHeat(st3.bot, S.T);
  stepGas(S3T, dt);
  stepGas(S3B, dt);
  if (S.cat) {
    for (const p of S3B.parts) {
      if (p.mono && p.ads <= 0 && p.p.y < S3B.min.y + 0.24 && Math.random() < dt * 5) {
        p.ads = 0.6 + Math.random() * 0.7;
        p.v.set(0, 0, 0);
      }
      if (p.ads > 0) {
        p.ads -= dt;
        p.v.set(0, 0, 0);
        p.p.y = Math.max(p.p.y, S3B.min.y + p.r * 0.55);
        p.squash = 0.55;
        for (const q of S3B.parts) {
          if (q !== p && q.ads <= 0 && q.kind !== p.kind && (q.kind === 'A' || q.kind === 'B') && q.p.distanceToSquared(p.p) < 0.36) {
            _v1.subVectors(p.p, q.p).normalize();
            q.v.addScaledVector(_v1, dt * 2.2);
          }
        }
        if (p.ads <= 0) {
          p.squash = 0;
          p.v.set((Math.random() - 0.5) * 0.4, 0.9 + Math.random() * 0.5, (Math.random() - 0.5) * 0.4);
        }
      } else if (p.squash > 0) {
        p.squash = 0;
      }
    }
  }
  pairScan(S3T.parts, (a, b) => { tryReact3(a, b, false); });
  pairScan(S3B.parts, (a, b) => { tryReact3(a, b, S.cat); });
  if (S.runT > 0) {
    S.runT -= rdt;
    if (S.runT <= 0) {
      S.runT = 0;
      const ratio = st3.cTop > 0 ? (st3.cBot / st3.cTop) : 0;
      toast('对照结束（10 s）：无催化剂 ' + st3.cTop + ' 次 · 有催化剂 ' + st3.cBot + ' 次' +
        (st3.cTop > 0 && ratio >= 1 ? '，催化后约 ' + (Math.round(ratio * 10) / 10) + ' 倍' : ''), 'ok');
    }
  }
  sweepList(S3T.parts);
  sweepList(S3B.parts);
  sweepList(R.parts);
  hud3.set('a', String(st3.cTop));
  hud3.set('b', String(st3.cBot));
  hud3.set('t', S.runT > 0 ? S.runT.toFixed(1) + ' s' : '—');
  const va = S.Ea * 750;
  mbChart.cfg = { T: S.T, va, showRef: false, cat: S.cat };
  profChart.cfg = { cat: S.cat };
  if (mbChart.open) drawMB();
  if (profChart.open) drawProfile();
  mbChart.info.textContent = '无催化 ' + (mbFrac(va, S.T) * 100).toFixed(1) + '% · 催化 ' + (mbFrac(va * 0.6, S.T) * 100).toFixed(1) + '%';
};

/* ================= 章节 4 · 浓度与压强 ================= */

const st4 = { g: new THREE.Group(), N: 60, flashOn: true, acc: 0, colCnt: 0, effCnt: 0, colLast: 0, effLast: 0, colRate: 0, effRate: 0 };
scene.add(st4.g);
CHG.push(st4.g);
st4.box = makeVessel(st4.g, { w: 3.4, h: 1.7, d: 2.0, cy: -0.8 });
st4.piston = makePistonCraft(st4.g, st4.box, 1.7, 2.0);
const S4 = { parts: R.parts, min: st4.box.min, max: st4.box.max.clone(), wall: 0, s0: 0.62 };
S4.max.x = st4.piston.face - 0.04;

function spawnAB4() {
  const kind = Math.random() < 0.55 ? 'A' : 'B';
  const p = makeParticle(kind, 0, 0, 0);
  randPosIn(S4, p.p);
  const k = S4.s0 / Math.sqrt(3);
  p.v.set(gauss(), gauss(), gauss()).multiplyScalar(k);
  return p;
}

UPD[3] = (dt, rdt) => {
  const S = st4;
  S.piston.update(dt);
  S4.max.x = S.piston.face - 0.04;
  while (R.parts.length > S.N) R.parts.pop().dead = true;
  while (R.parts.length < S.N) spawnAB4();
  stepGas(S4, dt, (p) => {
    if (S.flashOn && Math.random() < 0.18) flash(p.p.x, p.p.y, p.p.z, 0x9fb8d8, 0.13, 0.3);
  });
  pairScan(R.parts, (a, b) => {
    elastic(a, b);
    S.colCnt++;
    if ((a.kind === 'A' && b.kind === 'B') || (b.kind === 'A' && a.kind === 'B')) {
      if (_v1.subVectors(a.v, b.v).lengthSq() > 1.5 * S4.s0 * S4.s0) {
        S.effCnt++;
        if (S.flashOn) flash((a.p.x + b.p.x) / 2, (a.p.y + b.p.y) / 2, (a.p.z + b.p.z) / 2, 0xffe9a8, 0.4);
      }
    }
  });
  S.acc += rdt;
  if (S.acc >= 0.25) {
    const k = S.acc;
    S.acc = 0;
    const ci = (S.colCnt - S.colLast) / k;
    const ei = (S.effCnt - S.effLast) / k;
    S.colLast = S.colCnt;
    S.effLast = S.effCnt;
    S.colRate += (ci - S.colRate) * 0.4;
    S.effRate += (ei - S.effRate) * 0.4;
  }
  hud4.set('col', S.colRate.toFixed(1) + ' 次/s');
  hud4.set('eff', S.effRate.toFixed(1) + ' 次/s');
  hud4.set('n', R.parts.length + ' · V ' + S.piston.vol().toFixed(2));
};

/* ================= 章节 5 · 化学平衡的建立 ================= */
/* A ⇌ B 动力学蒙特卡洛：每个 A 每秒以 kf 概率转化为 B，每个 B 以 kr 概率转回 A。
 * v正 = kf·x(A)、v逆 = kr·x(B)，平衡时 x(B)/x(A) = kf/kr = K。 */

const st5 = { g: new THREE.Group(), kf: 0.10, kr: 0.03, t: 0, rec: 0, showV: true };
scene.add(st5.g);
CHG.push(st5.g);
st5.box = makeVessel(st5.g, { w: 3.0, h: 1.7, d: 2.0, cy: -0.8 });
const S5 = { parts: R.parts, min: st5.box.min, max: st5.box.max, wall: 0, s0: 0.62 };

function reset5(kind) {
  R.parts.length = 0;
  for (let i = 0; i < 60; i++) {
    const p = makeParticle(kind || 'A', 0, 0, 0);
    randPosIn(S5, p.p);
  }
  setBoxSpeeds(R.parts, S5.s0);
  st5.t = 0;
  st5.rec = 0;
}
function flip5(p, kind) {
  applyKind(p, kind);
  p.flash = 0.55;
}
function pushPt(s, t, v) { s.pts.push([t, v]); }

UPD[4] = (dt, rdt) => {
  const S = st5;
  stepGas(S5, dt);
  pairScan(R.parts, (a, b) => { elastic(a, b); });
  for (const p of R.parts) {
    if (p.kind === 'A') { if (Math.random() < S.kf * dt) flip5(p, 'B'); }
    else if (Math.random() < S.kr * dt) flip5(p, 'A');
  }
  S.t += rdt;
  S.rec += rdt;
  let nA = 0;
  for (const p of R.parts) if (p.kind === 'A') nA++;
  const nB = R.parts.length - nA;
  const cfg = tChart.cfg;
  if (S.rec >= 0.3) {
    S.rec = 0;
    const xA = nA / Math.max(R.parts.length, 1);
    pushPt(cfg.sA, S.t, xA);
    pushPt(cfg.sB, S.t, 1 - xA);
    pushPt(cfg.vF, S.t, S.kf * xA);
    pushPt(cfg.vR, S.t, S.kr * (1 - xA));
    const XMAX = 90;
    if (S.t > XMAX) [cfg.sA, cfg.sB, cfg.vF, cfg.vR].forEach((s) => {
      while (s.pts.length && s.pts[0][0] < S.t - XMAX) s.pts.shift();
    });
  }
  if (tChart.open) {
    const xMax = Math.min(Math.max(S.t, 12), 90);
    const { ctx, W, H } = prepCanvas(tChart.cv, 288);
    if (S.showV) {
      panel(ctx, 0, 2, W, 142, {
        xMax, yMin: 0, yMax: 1, yFmt: (v) => Math.round(v * 100) + '%',
        series: [cfg.sA, cfg.sB], events: [],
      });
      panel(ctx, 0, 148, W, 138, {
        xMax, yMin: 0, yMax: Math.max(S.kf, S.kr) * 1.2, yFmt: (v) => v.toFixed(2),
        series: [cfg.vF, cfg.vR], events: [],
      });
    } else {
      panel(ctx, 0, 20, W, 248, {
        xMax, yMin: 0, yMax: 1, yFmt: (v) => Math.round(v * 100) + '%',
        series: [cfg.sA, cfg.sB], events: [],
      });
    }
  }
  tChart.info.textContent = 'K实测 ' + (nB / Math.max(nA, 1)).toFixed(2) + ' · K理论 ' + (S.kf / S.kr).toFixed(2);
};

/* ================= 章节 6 · 平衡移动（2NO2 ⇌ N2O4） ================= */
/* 2NO2 ⇌ N2O4（正反应放热 ΔH<0）。NO2 红棕色、N2O4 无色，盒内色深实时反映 [NO2]。
 * 动力学：正反应事件率 = (a/V)·C(n2,2)，逆反应事件率 = b·n4，Kc = a/(2b)；
 * 范特霍夫：Kc(T) = 0.06·exp(6856·(1/T - 1/300))，ΔH/R = -6856 K；300K 平衡约 18 NO2 + 19 N2O4。 */

function kc6(T) { return 0.06 * Math.exp(6856 * (1 / T - 1 / 300)); }

const st6 = {
  g: new THREE.Group(),
  T: 300, Tt: 300, vol: 1.0, t: 0, rec: 0, fwd: 0, rev: 0,
  told: { c: 0, p: 0 },
};
scene.add(st6.g);
CHG.push(st6.g);
st6.box = makeVessel(st6.g, { w: 3.4, h: 1.7, d: 2.0, cy: -0.8, tint: true });
st6.piston = makePistonCraft(st6.g, st6.box, 1.7, 2.0);
const S6 = { parts: R.parts, min: st6.box.min, max: st6.box.max.clone(), wall: 0, s0: 0.62 };

function load6() {
  R.parts.length = 0;
  for (let i = 0; i < 40; i++) {
    const p = makeParticle('NO2', 0, 0, 0);
    randPosIn(S6, p.p);
  }
  for (let i = 0; i < 8; i++) {
    const p = makeParticle('N2O4', 0, 0, 0);
    randPosIn(S6, p.p);
  }
  setBoxSpeeds(R.parts, S6.s0);
  st6.t = 0; st6.rec = 0; st6.fwd = 0; st6.rev = 0;
  tChart.cfg.events.length = 0;
  tChart.cfg.s2.pts.length = 0;
  tChart.cfg.s4.pts.length = 0;
  st6.T = st6.Tt = 300;
  st6.vol = 1.0;
  st6.piston.setVol(1.0);
  st6.piston.face = st6.piston.target;
}
function ev6(lab, c) {
  const ev = tChart.cfg.events;
  ev.push({ t: st6.t, lab, c });
  if (ev.length > 8) ev.shift();
}
function count6() {
  let n2 = 0, n4 = 0;
  for (const p of R.parts) {
    if (p.kind === 'NO2') n2++;
    else if (p.kind === 'N2O4') n4++;
  }
  return [n2, n4];
}

UPD[5] = (dt, rdt) => {
  const S = st6;
  S.piston.update(dt);
  S6.max.x = S.piston.face - 0.04;
  const Vrel = clamp(S.piston.vol(), 0.38, 1);
  if (Math.abs(S.Tt - S.T) > 0.5) {
    const f = Math.sqrt(S.Tt / S.T);
    for (const p of R.parts) p.v.multiplyScalar(f);
    S.T = S.Tt;
    S6.s0 = 0.62 * Math.sqrt(S.T / 300);
  }
  setHeat(st6.box, S.T);
  stepGas(S6, dt);
  pairScan(R.parts, (a, b) => { elastic(a, b); });
  let n2, n4;
  [n2, n4] = count6();
  const K = kc6(S.T);
  const b = 0.35 * Math.sqrt(S.T / 300);
  const a = 2 * b * K;
  S.fwd += ((a / Vrel) * n2 * (n2 - 1) / 2) * dt;
  S.rev += b * n4 * dt;
  let guard = 0;
  while (S.fwd >= 1 && guard++ < 4) {
    S.fwd--;
    const n2s = R.parts.filter((p) => p.kind === 'NO2' && !p.dead);
    if (n2s.length < 2) break;
    const i1 = Math.floor(Math.random() * n2s.length);
    let i2 = Math.floor(Math.random() * n2s.length);
    if (i2 === i1) i2 = (i2 + 1) % n2s.length;
    const p1 = n2s[i1], p2 = n2s[i2];
    applyKind(p1, 'N2O4');
    p1.p.addVectors(p1.p, p2.p).multiplyScalar(0.5);
    p1.v.addVectors(p1.v, p2.v).multiplyScalar(0.5);
    p2.dead = true;
    p1.flash = 0.7;
    flash(p1.p.x, p1.p.y, p1.p.z, 0xd8d2c4, 0.35, 0.35);
    n2 -= 2; n4 += 1;
  }
  guard = 0;
  while (S.rev >= 1 && guard++ < 4) {
    S.rev--;
    const n4s = R.parts.filter((p) => p.kind === 'N2O4' && !p.dead);
    if (!n4s.length) break;
    const p = n4s[Math.floor(Math.random() * n4s.length)];
    applyKind(p, 'NO2');
    rUnit(_v1);
    rUnit(_v2);
    p.p.addScaledVector(_v1, 0.1);
    p.v.set(gauss(), gauss(), gauss()).multiplyScalar(S6.s0 / Math.sqrt(3)).addScaledVector(_v1, 1.1);
    const q = makeParticle('NO2', p.p.x - _v1.x * 0.2, p.p.y - _v1.y * 0.2, p.p.z - _v1.z * 0.2);
    q.v.copy(p.v).multiplyScalar(0.6).addScaledVector(_v1, -1.1);
    p.flash = 0.7;
    flash(p.p.x, p.p.y, p.p.z, 0xe8a880, 0.35, 0.35);
    n2 += 2; n4 -= 1;
  }
  sweepList(R.parts);
  /* 盒内 NO2 色深 */
  const tint = st6.box.tint;
  const conc = n2 / Vrel;
  tint.visible = conc > 0.4;
  if (tint.visible) {
    tint.material.opacity = clamp(conc * 0.014, 0, 0.42);
    tint.scale.set(S6.max.x - S6.min.x - 0.04, 1.62, 1.92);
    tint.position.set((S6.min.x + S6.max.x) / 2, (S6.min.y + S6.max.y) / 2, 0);
  }
  /* 记录曲线 */
  S.t += rdt;
  S.rec += rdt;
  const cfg = tChart.cfg;
  if (S.rec >= 0.3) {
    S.rec = 0;
    pushPt(cfg.s2, S.t, conc);
    pushPt(cfg.s4, S.t, n4 / Vrel);
    const XMAX = 120;
    if (S.t > XMAX) [cfg.s2, cfg.s4].forEach((s) => {
      while (s.pts.length && s.pts[0][0] < S.t - XMAX) s.pts.shift();
    });
  }
  if (tChart.open) {
    let vmax = 1.2;
    for (const s of [cfg.s2, cfg.s4]) for (const pt of s.pts) if (pt[1] > vmax) vmax = pt[1];
    const { ctx, W } = prepCanvas(tChart.cv, 240);
    panel(ctx, 0, 4, W, 232, {
      xMax: Math.min(Math.max(S.t, 12), 120), yMin: 0, yMax: vmax * 1.12, yFmt: (v) => v.toFixed(0),
      series: [cfg.s2, cfg.s4], events: cfg.events,
    });
  }
  tChart.info.textContent = 'NO2 ' + n2 + ' · N2O4 ' + n4 + ' · T ' + Math.round(S.T) + 'K · Kc ' + K.toFixed(2);
};

/* ================= 章节 7 · 链式反应（H2 + Cl2 光照爆炸） ================= */
/* 光照引爆：光子击中一个 Cl2 断键生成 2 个 Cl·（链引发，自由基高亮发光）；
 * 链传递：Cl· + H2 -> HCl + H·，H· + Cl2 -> HCl + Cl·，每代新自由基再传递（代数计数）；
 * 链终止：自由基相互结合，或撞到器壁/杂质失活。
 * 链增长窗（HCl 累计 + 自由基在场）对齐原版 chart:'chain'；Space 键触发光照。 */

const st7 = { g: new THREE.Group(), nCl2: 8, hcl: 0, gen: 0, termToast: 0, t: 0, rec: 0, samples: [] };
scene.add(st7.g);
CHG.push(st7.g);
st7.box = makeVessel(st7.g, { w: 2.8, h: 1.7, d: 2.0, cy: -0.8 });
const S7 = { parts: R.parts, min: st7.box.min, max: st7.box.max, wall: 0, s0: 0.62 };
const photon = new THREE.Sprite(new THREE.SpriteMaterial({
  map: makeGlowTexture('255,238,150', [[0, 'rgba(C,1)'], [0.35, 'rgba(C,0.55)'], [1, 'rgba(C,0)']]),
  blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
}));
photon.visible = false;
scene.add(photon);
const photonSt = { t: -1, target: null, from: new THREE.Vector3() };

function load7() {
  R.parts.length = 0;
  for (let i = 0; i < st7.nCl2; i++) {
    const p = makeParticle('Cl2', 0, 0, 0);
    randPosIn(S7, p.p);
  }
  for (let i = 0; i < st7.nCl2 * 2; i++) {
    const p = makeParticle('H2', 0, 0, 0);
    randPosIn(S7, p.p);
  }
  setBoxSpeeds(R.parts, S7.s0);
  st7.hcl = 0;
  st7.gen = 0;
  st7.termToast = 0;
  st7.t = 0;
  st7.rec = 0;
  st7.samples = [{ t: 0, hcl: 0, rad: 0 }];
  chainChart.cfg = { samples: st7.samples, events: chainChart.cfg ? chainChart.cfg.events : [] };
  if (chainChart.cfg.events) chainChart.cfg.events.length = 0;
  photonSt.t = -1;
  photon.visible = false;
}
function splitCl2(m) {
  m.dead = true;
  const half = m.len / 2 - m.r * 0.35;
  for (const s of [1, -1]) {
    const r = makeParticle('CL', m.p.x + m.ax.x * half * s, m.p.y + m.ax.y * half * s, m.p.z + m.ax.z * half * s);
    r.gen = 1;
    _v1.copy(m.ax).multiplyScalar(s);
    _v2.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    r.v.copy(_v1).multiplyScalar(0.8).addScaledVector(_v2, 1.5);
  }
  flash(m.p.x, m.p.y, m.p.z, 0xfff3c0, 1.0);
  label('链引发：Cl2 断键生成 2Cl·', m.p.x, m.p.y + 0.45, m.p.z, '#ffe9a8');
  if (chainChart.cfg) {
    chainChart.cfg.events.push({ t: st7.t, lab: '光照', c: '#e8b04a' });
    if (chainChart.cfg.events.length > 6) chainChart.cfg.events.shift();
  }
}
function light7() {
  if (photonSt.t >= 0) return;
  const cl2 = R.parts.filter((p) => p.kind === 'Cl2' && !p.dead);
  if (!cl2.length) {
    toast('Cl2 已耗尽，点「重新装料」再来一次。', 'warn');
    return;
  }
  photonSt.target = cl2[Math.floor(Math.random() * cl2.length)];
  photonSt.from.set(photonSt.target.p.x, 1.6, photonSt.target.p.z);
  photonSt.t = 0;
  photon.visible = true;
}
function prop7(rad, mol) {
  let newKind = null;
  if (rad.kind === 'CL' && mol.kind === 'H2') newKind = 'H';
  else if (rad.kind === 'H' && mol.kind === 'Cl2') newKind = 'CL';
  else { elastic(rad, mol); return; }
  mol.dead = true;
  rad.dead = true;
  const hc = makeParticle('HCl', mol.p.x, mol.p.y, mol.p.z);
  hc.v.copy(mol.v).multiplyScalar(0.5);
  const nr = makeParticle(newKind, mol.p.x, mol.p.y, mol.p.z);
  nr.gen = (rad.gen || 1) + 1;
  st7.gen = Math.max(st7.gen, nr.gen);
  rUnit(nr.v).multiplyScalar(1.5 + Math.random() * 0.8);
  flash(mol.p.x, mol.p.y, mol.p.z, 0xffe9a8, 0.55);
  st7.hcl++;
}

UPD[6] = (dt0, rdt) => {
  const dt = dt0;   // 帧循环已按 timeScale 缩放（慢放 0.25× 语义 = 物理减速 4 倍，不再二次缩放）
  st7.t += rdt;
  stepGas(S7, dt, (p) => {
    if (!p.glow) return;
    if (Math.random() < 0.10) {
      p.dead = true;
      flash(p.p.x, p.p.y, p.p.z, 0xdfe4ea, 0.4);
      if (st7.termToast < 2) {
        st7.termToast++;
        label('链终止（撞壁失活）', p.p.x, p.p.y + 0.32, p.p.z, '#c9ccd2');
      }
    }
  });
  pairScan(R.parts, (a, b) => {
    if (a.glow && b.glow) {
      a.dead = b.dead = true;
      flash((a.p.x + b.p.x) / 2, (a.p.y + b.p.y) / 2, (a.p.z + b.p.z) / 2, 0xdfe4ea, 0.5);
      if (st7.termToast < 3) {
        st7.termToast++;
        label('链终止：自由基结合', a.p.x, a.p.y + 0.32, a.p.z, '#c9ccd2');
      }
      return;
    }
    if (a.glow && !b.glow) return prop7(a, b);
    if (b.glow && !a.glow) return prop7(b, a);
    elastic(a, b);
  });
  if (photonSt.t >= 0) {
    photonSt.t += dt / 0.55;
    if (photonSt.t >= 1 || !photonSt.target || photonSt.target.dead) {
      const m = photonSt.target;
      photon.visible = false;
      photonSt.t = -1;
      if (m && !m.dead) splitCl2(m);
    } else {
      const k = photonSt.t;
      const e = 1 - (1 - k) * (1 - k);
      _v1.lerpVectors(photonSt.from, photonSt.target.p, e);
      photon.position.copy(_v1);
      const s = 0.45 + Math.sin(k * 40) * 0.08;
      photon.scale.set(s, s * 1.7, 1);
    }
  }
  sweepList(R.parts);
  /* 链增长采样（真实时间步进，慢放也按真实秒记录） */
  st7.rec += rdt;
  if (st7.rec >= 0.25) {
    st7.rec = 0;
    let nRad = 0;
    for (const p of R.parts) if (p.glow) nRad++;
    st7.samples.push({ t: st7.t, hcl: st7.hcl, rad: nRad });
    if (st7.samples.length > 600) st7.samples.shift();
  }
  let nRad = 0;
  for (const p of R.parts) if (p.glow) nRad++;
  hud7.set('rad', String(nRad));
  hud7.set('hcl', String(st7.hcl));
  hud7.set('gen', String(st7.gen));
  if (chainChart.open) drawChain();
};

/* ================= 章节 8 · 随堂检测 ================= */

const QUIZ = [
  {
    q: '发生有效碰撞（能引发反应的碰撞）必须同时满足的两个条件是？',
    opts: ['分子数目足够多，碰撞足够频繁', '碰撞能量达到活化能，且碰撞取向合适', '只要能量足够大就行，取向无所谓', '只要有催化剂存在'],
    a: 1,
    ex: '有效碰撞两要素缺一不可：①能量达到活化能 Ea（活化分子）；②取向合适（碰在能成键的部位）。活化分子碰撞若取向不合，仍是无效碰撞。',
  },
  {
    q: '同一气体温度升高时，麦克斯韦-玻尔兹曼速率分布曲线的变化是？',
    opts: ['峰值向高速方向移动且变矮变宽', '峰值向低速方向移动且变高', '曲线形状完全不变，只是整体右移', '峰值位置不变，曲线整体升高'],
    a: 0,
    ex: 'T 升高，速率分布整体右移（峰值速率正比根号T），曲线变矮变宽，大于某速率（如达到 Ea 对应速率）的分子比例显著增大。',
  },
  {
    q: '关于催化剂的说法，正确的是？',
    opts: ['催化剂降低活化能，也同时改变反应热 ΔH', '催化剂使平衡向正反应方向移动，提高转化率', '催化剂降低活化能，但不改变 ΔH 也不改变平衡位置', '催化剂在反应中被消耗，需要不断补充'],
    a: 2,
    ex: '催化剂通过改变反应路径降低活化能、加快反应；但它不改变始末态能量（ΔH 不变），正逆反应速率同等倍数增大，因此不影响平衡位置，本身反应前后质量与化学性质不变。',
  },
  {
    q: '对 2NO2 ⇌ N2O4（正反应放热）的平衡体系压缩体积，红棕色深浅如何变化？',
    opts: ['一直变深，不再恢复', '先变深后变浅，最终仍比压缩前深', '先变浅后变深', '颜色始终不变'],
    a: 1,
    ex: '压缩瞬间 NO2 浓度增大，颜色先变深；随后平衡向气体分子数减小的方向（右，生成 N2O4）移动，NO2 减少而变浅；但因体积缩小、浓度仍高于压缩前，最终颜色比原来深。',
  },
  {
    q: 'H2 与 Cl2 的光照链式反应中，起链传递作用的“链载体”是？',
    opts: ['H2 和 Cl2 分子', 'HCl 分子', '光子', '自由基 Cl· 和 H·'],
    a: 3,
    ex: '光照只是链的引发（Cl2 断键生成 Cl·）。链传递靠自由基：Cl· 撞 H2 生成 HCl + H·，H· 撞 Cl2 生成 HCl + Cl·，自由基不断再生使反应像链条一样持续，直到自由基相互结合或撞壁失活而终止。',
  },
];

function showQuiz() {
  let idx = 0;
  let score = 0;
  const panelEl = document.createElement('div');
  panelEl.className = 'quiz-panel';
  stage.appendChild(panelEl);

  function renderQ() {
    const item = QUIZ[idx];
    panelEl.innerHTML = '';
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
        card.querySelector('.q-score').textContent = '得分：' + score;
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
    panelEl.appendChild(card);
  }

  function renderResult() {
    panelEl.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'quiz-card q-result';
    const pct = Math.round((score / QUIZ.length) * 100);
    card.innerHTML = `
      <div class="q-progress">检测完成</div>
      <div class="big">${score} / ${QUIZ.length}</div>
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，反应速率与化学平衡的要点你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'ctl-btn active';
    again.textContent = '重新测验';
    again.addEventListener('click', () => { idx = 0; score = 0; renderQ(); });
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'ctl-btn';
    back.textContent = '返回第一章节';
    back.addEventListener('click', () => { panelEl.remove(); window.__eduSections.select(0); });
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center';
    row.appendChild(back);
    row.appendChild(again);
    card.appendChild(row);
    panelEl.appendChild(card);
  }

  renderQ();
  activeSectionCleanup = () => panelEl.remove();
}

/* ================= 章节定义（cam/tgt 供驱动器与 R 重置共用） ================= */

let pauseCtl = null;

const SECTIONS = [
  {
    title: '有效碰撞',
    cam: [0.65, -0.05, 4.7], tgt: [0.12, -0.78, 0],
    html: `<p>化学反应的发生要有<b>有效碰撞</b>，两个条件缺一不可：<span class="hl">① 碰撞能量达到活化能 Ea；② 碰撞取向合适</span>。</p>
<p>演示模型：<b>AB + C → A + BC</b>（置换型）。C 原子沿 A—B 键轴方向撞向 A 端为「取向合适」；撞向 B 端或拦腰撞上为「取向不合」，即使能量够也弹开。</p>
<p>拖动「碰撞能量 E」滑杆：当 E &lt; Ea 时，即使取向合适也弹回（能量不足）。关掉「取向要求」开关再试——能量够就一律算有效，取向率读数会拉满，这就是两条缺一不可的对照。点「碰撞一次（随机取向）」累积统计，或打开「自动演示」连续观察；HUD 记录碰撞总数、有效数与取向合适率。</p>`,
    enter() {
      hideAll();
      cur = 0;
      st1.g.visible = true;
      st1.total = 0; st1.eff = 0; st1.ok = 0;
      st1.auto = false; st1.phase = 'idle'; st1.wait = 0;
      st1.orientReq = true;
      R.parts.length = 0;
      st1.AB = makeParticle('AB', 0, -0.85, 0); // 初始摆一个 AB 分子，避免空场
      hud1.el.style.display = '';
      ctl.clear();
      ctl.slider({
        label: '碰撞能量 E', min: 0.2, max: 2, step: 0.05, value: st1.E,
        fmt: (v) => v.toFixed(2) + (v < st1.Ea ? ' · <Ea' : ' · ≥Ea'),
        onInput: (v) => { st1.E = v; },
      });
      ctl.toggle({
        label: '取向要求', value: true,
        onChange: (v) => { st1.orientReq = v; },
      });
      ctl.button({ label: '⚛ 碰撞一次（随机取向）', onClick: () => { if (st1.phase === 'idle') collide1(); } });
      ctl.toggle({ label: '自动演示', value: false, onChange: (v) => { st1.auto = v; if (v) st1.wait = 0.2; } });
      ctl.button({ label: '↺ 计数清零', onClick: () => { st1.total = 0; st1.eff = 0; st1.ok = 0; } });
      setLegend([
        ['#e0524a', 'A 原子'], ['#3f7fd8', 'B 原子'], ['#2fa864', 'C 原子'],
        ['#ffb14a', '无效碰撞（弹开）'], ['#7ee2a0', '有效碰撞（反应）'],
      ]);
    },
  },
  {
    title: '温度与活化分子',
    cam: [0.4, 0.35, 5.0], tgt: [0, -0.75, 0],
    html: `<p>一定温度下，分子速率服从<b>麦克斯韦-玻尔兹曼分布</b>：f(v) ∝ v²·e<sup>−mv²/2kT</sup>。温度升高，曲线峰值<b>向高速方向移动且变矮变宽</b>。</p>
<p>只有能量达到活化能 Ea 的<b>活化分子</b>碰撞才可能反应。图中 Ea 竖线右侧的阴影面积就是<b>活化分子比例</b>（数字实时读出）。</p>
<p>升高温度 → 活化分子比例迅速增大 → 有效碰撞频率提高 → 反应速率加快。打开「300K 对比曲线」看双温度对比；3D 中速度快的分子会被染成暖色，托盘加热条也会随温度亮起。</p>`,
    enter() {
      hideAll();
      cur = 1;
      st2.g.visible = true;
      st2.T = 300; st2.Tt = 300; st2.Ea = 1.2; st2.showRef = false;
      S2.s0 = 0.62;
      const mix = [['A', 38], ['B', 34], ['C', 28], ['inert', 20]];
      for (const item of mix) {
        for (let i = 0; i < item[1]; i++) {
          const p = makeParticle(item[0], 0, 0, 0);
          randPosIn(S2, p.p);
        }
      }
      setBoxSpeeds(R.parts, S2.s0);
      mbChart.show(true);
      ctl.clear();
      pauseCtl = null;
      ctl.slider({
        label: '温度 T', min: 100, max: 900, step: 10, value: 300,
        fmt: (v) => Math.round(v) + ' K',
        onInput: (v) => { st2.Tt = v; },
      });
      ctl.slider({
        label: '活化能 Ea', min: 0.8, max: 2.4, step: 0.05, value: 1.2,
        fmt: (v) => v.toFixed(2) + ' ×10⁻¹⁹ J',
        onInput: (v) => { st2.Ea = v; },
      });
      ctl.toggle({ label: '300K 对比曲线', value: false, onChange: (v) => { st2.showRef = v; } });
      pauseCtl = ctl.toggle({ label: '暂停', value: false, onChange: (v) => app.setPaused(v) });
      setLegend([
        ['#3f7fd8', '慢分子（冷色）'], ['#ffa040', '快分子（暖色）'], ['#e0524a', 'A'], ['#2fa864', 'C'], ['#9aa3ad', '惰性分子'],
      ]);
    },
  },
  {
    title: '催化剂',
    cam: [0.3, 0.25, 6.4], tgt: [0, -0.25, 0],
    html: `<p><b>催化剂</b>通过改变反应路径<span class="hl">降低活化能 Ea</span>，让更多分子成为活化分子，速率大大加快。但它<b>只改变速率</b>：不改变反应热 ΔH、不改变平衡位置，本身的质量和化学性质在反应前后都不变。</p>
<p>上盒无催化剂（对照）、下盒有催化剂表面（铂网板 + 发光吸附位）：分子撞上表面被<b>吸附</b>（短暂贴附、小球被压扁示意键被削弱），更容易越过低势垒完成 A+B→AB 后脱附。</p>
<p>「能量剖面」窗画出两条路径：橙实线是无催化的高能垒，绿虚线是吸附后的低能垒（Ea·0.6）——翻越的分子多，闪光就密。点「开始对照实验」：同温度、同分子数，计时 10 s 比较两盒反应数。</p>`,
    enter() {
      hideAll();
      cur = 2;
      st3.g.visible = true;
      st3.T = 300; st3.Tt = 300; st3.cat = true;
      st3.runT = 0; st3.cTop = 0; st3.cBot = 0;
      st3.plateUI.plate.visible = true;
      st3.plateUI.sites.visible = true;
      S3T.s0 = S3B.s0 = 0.62;
      resetBoxes3();
      hud3.el.style.display = '';
      mbChart.show(true);
      profChart.show(true);
      ctl.clear();
      pauseCtl = null;
      ctl.slider({
        label: '温度 T', min: 150, max: 600, step: 10, value: 300,
        fmt: (v) => Math.round(v) + ' K',
        onInput: (v) => { st3.Tt = v; },
      });
      ctl.toggle({
        label: '底盒催化剂', value: true,
        onChange: (v) => {
          st3.cat = v;
          st3.plateUI.plate.visible = v;
          st3.plateUI.sites.visible = v;
        },
      });
      ctl.button({
        label: '⏱ 开始对照实验（10s）',
        onClick: () => {
          resetBoxes3();
          st3.cTop = 0; st3.cBot = 0;
          st3.runT = 10;
          toast('对照实验开始：同温度、同分子数，计时 10 s…');
        },
      });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[2].enter() });
      setLegend([
        ['#e0524a', 'A 原子'], ['#3f7fd8', 'B 原子'], ['#e0524a ▸', 'AB 产物（红蓝哑铃）'], ['#b0a48e', '催化剂表面（吸附位）'],
      ]);
    },
  },
  {
    title: '浓度与压强',
    cam: [1.35, 0.4, 5.7], tgt: [0.1, -0.78, 0],
    html: `<p>恒容下增大<b>浓度</b>（滑杆调分子数 N，或点「＋ 加入 10 个」），或用<b>活塞压缩</b>增大压强，本质相同：<span class="hl">单位体积内分子数增多 → 碰撞频率升高 → 有效碰撞频率升高 → 反应速率加快</span>。</p>
<p>HUD 实时统计两个读数：<b>壁面碰撞频率</b>（分子撞器壁的次数/秒）和<b>有效碰撞频率</b>（A、B 分子间相对动能达标的碰撞，黄色闪光），它们就是速率的微观标志。</p>
<p>关键辨析：<span class="hl">温度不变时，活化分子的<b>占比</b>并未改变——变的只是单位体积里活化分子的<b>个数</b></span>。浓度（压强）只靠"人多"提速，升温靠"个体更强"提速，两条路不同。</p>
<p>试试：N 不变时拖动活塞压缩——两个频率读数同步上升；再增大 N 对比。</p>`,
    enter() {
      hideAll();
      cur = 3;
      st4.g.visible = true;
      st4.N = 60;
      st4.colCnt = 0; st4.effCnt = 0; st4.colLast = 0; st4.effLast = 0;
      st4.colRate = 0; st4.effRate = 0; st4.acc = 0;
      st4.piston.setVol(1);
      st4.piston.face = st4.piston.target;
      S4.max.x = st4.piston.face - 0.04;
      S4.s0 = 0.62;
      for (let i = 0; i < 60; i++) spawnAB4();
      hud4.el.style.display = '';
      ctl.clear();
      pauseCtl = null;
      const nSlider = ctl.slider({
        label: '分子数 N（浓度）', min: 10, max: 150, step: 2, value: 60,
        fmt: (v) => Math.round(v) + ' 个',
        onInput: (v) => { st4.N = v; },
      });
      ctl.button({
        label: '＋ 加入 10 个',
        onClick: () => {
          st4.N = Math.min(150, st4.N + 10);
          nSlider.set(st4.N);
        },
      });
      ctl.slider({
        label: '活塞体积（压缩）', min: 0.4, max: 1, step: 0.02, value: 1,
        fmt: (v) => (v * 100).toFixed(0) + '%',
        onInput: (v) => { st4.piston.setVol(v); },
      });
      ctl.toggle({ label: '显示碰撞闪烁', value: true, onChange: (v) => { st4.flashOn = v; } });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[3].enter() });
      setLegend([
        ['#e0524a', 'A 分子'], ['#3f7fd8', 'B 分子'], ['#ffe9a8', '有效碰撞（能量达标）'], ['#9fb8d8', '壁面碰撞'],
      ]);
    },
  },
  {
    title: '化学平衡的建立',
    cam: [0.4, 0.3, 5.0], tgt: [0, -0.75, 0],
    html: `<p><b>可逆反应</b> A ⇌ B：正反应 A→B 速率 v正 = k正·c(A)，逆反应 B→A 速率 v逆 = k逆·c(B)。初始全为 A，此时 v正 最大、v逆 为 0。</p>
<p>随着 A 消耗、B 生成，v正 减小、v逆 增大，直到 <span class="hl">v正 = v逆</span>——达到<b>化学平衡</b>：各组分浓度不再随时间变化，但微观上双向转化仍在进行（动态平衡）。</p>
<p>平衡时 [B]/[A] = k正/k逆 = K。上图画 c(A)/c(B) 曲线，下图 v正/v逆 两线<b>汇聚到相等</b>；图窗顶部同时读出 K 实测与 K 理论。拖动 k正/k逆 滑杆，曲线会趋向新的平衡点。</p>
<p><span class="hl">无论从纯 A 还是从纯 B 出发，只要温度不变（k 正、k 逆 不变），最终都会走到同一个平衡状态</span>——点「从全 B 开始」亲手验证。</p>`,
    enter() {
      hideAll();
      cur = 4;
      st5.g.visible = true;
      st5.kf = 0.10; st5.kr = 0.03; st5.showV = true;
      tChart.cfg = {
        sA: { label: 'c(A)', c: '#e0524a', pts: [] },
        sB: { label: 'c(B)', c: '#3f7fd8', pts: [] },
        vF: { label: 'v正', c: '#e8674a', pts: [] },
        vR: { label: 'v逆', c: '#3f8fd2', pts: [] },
        events: [],
      };
      reset5();
      tChart.show(true);
      ctl.clear();
      pauseCtl = null;
      ctl.slider({
        label: '正反应 k正', min: 0.02, max: 0.3, step: 0.01, value: 0.10,
        fmt: (v) => v.toFixed(2) + ' /s',
        onInput: (v) => { st5.kf = v; },
      });
      ctl.slider({
        label: '逆反应 k逆', min: 0.01, max: 0.3, step: 0.01, value: 0.03,
        fmt: (v) => v.toFixed(2) + ' /s',
        onInput: (v) => { st5.kr = v; },
      });
      pauseCtl = ctl.toggle({ label: '暂停', value: false, onChange: (v) => app.setPaused(v) });
      ctl.toggle({ label: '显示速率曲线', value: true, onChange: (v) => { st5.showV = v; } });
      const clear5 = () => {
        [tChart.cfg.sA, tChart.cfg.sB, tChart.cfg.vF, tChart.cfg.vR].forEach((s) => { s.pts.length = 0; });
      };
      ctl.button({
        label: '↺ 重置（全 A）',
        onClick: () => {
          reset5('A');
          clear5();
        },
      });
      ctl.button({
        label: '↺ 从全 B 开始',
        onClick: () => {
          reset5('B');
          clear5();
          toast('从纯 B 出发：v逆 最大、v正 为 0，最终汇入同一个平衡状态（K 只与 k 正/k 逆 有关）。', 'ok');
        },
      });
      setLegend([
        ['#e0524a', 'A（红 ⇌ 蓝 B）'], ['#e8674a', 'v正 = k正·c(A)'], ['#3f8fd2', 'v逆 = k逆·c(B)'],
      ]);
    },
  },
  {
    title: '平衡移动',
    cam: [1.4, 0.4, 5.9], tgt: [0.1, -0.78, 0],
    html: `<p>模型：<b>2NO₂ ⇌ N₂O₄</b>（正反应放热 ΔH&lt;0）。NO₂ 是<b>红棕色</b>气体，N₂O₄ 无色——盒内颜色深浅直接反映 [NO₂] 的高低。</p>
<p><b>勒夏特列原理</b>：改变条件，平衡便会朝<span class="hl">削弱该变动</span>的方向迁移。</p>
<p>三个扰动：① <b>增加 NO₂</b>：Q&lt;K，平衡右移；② <b>升温</b>：放热反应 K 随 T 减小，平衡左移，红棕色<b>加深</b>；③ <b>压缩体积</b>：NO₂ 浓度瞬间增大（颜色<b>先变深</b>），随后平衡向气体分子数减小的方向（右）移动，NO₂ 减少、颜色<b>再变浅</b>——但仍比压缩前深。</p>
<p>「浓度-时间」窗记录每次扰动后的曲线，竖虚线为扰动时刻。也可直接拖动活塞与温度滑杆连续扰动；托盘加热条随温度亮起。</p>`,
    enter() {
      hideAll();
      cur = 5;
      st6.g.visible = true;
      tChart.cfg = {
        s2: { label: 'c(NO₂)', c: '#c2542e', pts: [] },
        s4: { label: 'c(N₂O₄)', c: '#8a94a0', pts: [] },
        events: [],
      };
      S6.s0 = 0.62;
      load6();
      tChart.show(true);
      ctl.clear();
      pauseCtl = null;
      ctl.button({
        label: '＋ 增加 NO₂',
        onClick: () => {
          if (R.parts.length + 6 > 90) { toast('分子太多啦，先重置再来。', 'warn'); return; }
          addNO2(6);
          ev6('+NO₂', '#c2542e');
        },
      });
      ctl.button({
        label: '🔥 升高温度 +30K',
        onClick: () => { st6.Tt = Math.min(400, st6.Tt + 30); ev6('升温', '#e8674a'); },
      });
      ctl.button({
        label: '⇐ 压缩体积',
        onClick: () => {
          st6.vol = Math.max(0.4, st6.vol * 0.75);
          st6.piston.setVol(st6.vol);
          ev6('压缩', '#3f8fd2');
          toast('压缩：颜色先变深（NO₂ 浓度瞬间增大）→ 平衡右移（向分子数减小方向）→ NO₂ 减少，颜色再变浅。', 'ok');
        },
      });
      ctl.slider({
        label: '活塞体积', min: 0.4, max: 1, step: 0.02, value: 1,
        fmt: (v) => (v * 100).toFixed(0) + '%',
        onInput: (v) => { st6.vol = v; st6.piston.setVol(v); },
      });
      ctl.slider({
        label: '温度 T', min: 280, max: 400, step: 5, value: 300,
        fmt: (v) => Math.round(v) + ' K',
        onInput: (v) => { st6.Tt = v; },
      });
      ctl.button({ label: '↺ 重置', onClick: () => SECTIONS[5].enter() });
      setLegend([
        ['#c2542e', 'NO₂（红棕色）'], ['#d6cec2', 'N₂O₄（无色，淡色哑铃）'], ['#e8674a', '升温 → 平衡左移'], ['#3f8fd2', '压缩 → 平衡右移'],
      ]);
    },
  },
  {
    title: '链式反应',
    cam: [0.3, 0.25, 5.0], tgt: [0, -0.75, 0],
    html: `<p><b>H₂ + Cl₂ 光照爆炸</b>是典型的<b>链式反应</b>。链的引发：光子击中 Cl₂，断键产生自由基 <span class="hl">Cl·</span>（高亮发光的绿色小球，带辉光）。</p>
<p>链的传递：Cl· + H₂ → HCl + H·；H· + Cl₂ → HCl + Cl·——自由基（<b>链载体</b>）不断再生，一代一代传递下去（HUD 记录代数），HCl 越积越多。「链增长」窗实时画出 HCl 累计与自由基在场数两条曲线。</p>
<p>链的终止：两个自由基相互结合、或撞到器壁/杂质而失活。点「光照引爆」观察链式生长（<b>Space 键</b>同样触发）；打开「慢放 0.25×」可以看清单步传递。</p>`,
    enter() {
      hideAll();
      cur = 6;
      st7.g.visible = true;
      S7.s0 = 0.62;
      load7();
      hud7.el.style.display = '';
      chainChart.show(true);
      ctl.clear();
      pauseCtl = null;
      ctl.button({ label: '⚡ 光照引爆', onClick: light7 });
      ctl.button({
        label: '💡 电火花点燃',
        onClick: () => { toast('电火花同样把 Cl₂ 拆成自由基——本质都是提供断键能量。', 'ok'); light7(); },
      });
      ctl.slider({
        label: 'Cl₂ 分子数', min: 3, max: 12, step: 1, value: 8,
        fmt: (v) => Math.round(v) + ' 个',
        onInput: (v) => { st7.nCl2 = Math.round(v); load7(); },
      });
      ctl.toggle({
        label: '慢放 0.25×', value: false,
        onChange: (v) => { R.timeScale = v ? 0.25 : 1; },
      });
      ctl.button({ label: '↺ 重新装料', onClick: () => load7() });
      setLegend([
        ['#74e884', 'Cl· 自由基（链载体，发光）'], ['#f2c35e', 'H· 自由基（链载体）'],
        ['#3fae5a', 'Cl₂（绿哑铃）'], ['#e8e2d6', 'H₂ / HCl（白+绿）'],
      ]);
    },
  },
  {
    title: '随堂检测',
    cam: [0, 0.8, 6.8], tgt: [0, -0.7, 0],
    html: `<p>5 道选择题，检验本节课的掌握情况。</p>`,
    enter() {
      hideAll();
      cur = 7;
      ctl.clear();
      pauseCtl = null;
      st2.g.visible = true;
      S2.s0 = 0.62;
      for (let i = 0; i < 30; i++) {
        const p = makeParticle('inert', 0, 0, 0);
        randPosIn(S2, p.p);
      }
      setBoxSpeeds(R.parts, S2.s0);
      showQuiz();
    },
  },
];

/* 背景章节（随堂检测）里让背景盒子继续飘动 */
UPD[7] = (dt) => {
  stepGas(S2, dt);
  pairScan(R.parts, (a, b) => { elastic(a, b); });
};

function addNO2(n) {
  for (let i = 0; i < n; i++) {
    const p = makeParticle('NO2', 0, 0, 0);
    p.p.set(S6.min.x + 0.2 + Math.random() * (S6.max.x - S6.min.x - 0.4), S6.max.y - 0.3, (Math.random() - 0.5) * 1.3);
    p.v.set((Math.random() - 0.5) * 0.4, -0.4 - Math.random() * 0.3, (Math.random() - 0.5) * 0.4);
    p.flash = 0.5;
  }
}

/* ================= 三栏驱动器（左列表 / 右详解 / 相机飞行） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const railNoL = document.getElementById('railNoL');
const railTitleR = document.getElementById('railTitleR');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
const rxShell = document.getElementById('rxShell');
let chapterIdx = 0;

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
  chapCount.textContent = String(chapterIdx + 1).padStart(2, '0') + '/' + String(SECTIONS.length).padStart(2, '0');
  detailNo.textContent = String(chapterIdx + 1).padStart(2, '0');
  detailTitle.textContent = sec.title;
  railNoL.textContent = String(chapterIdx + 1).padStart(2, '0');
  railTitleR.textContent = sec.title;
  lessonEl.innerHTML = sec.html || '';
  if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
  pauseCtl = null;
  sec.enter();
  accSecs.controls.classList.toggle('acc-empty', !controlsEl.children.length);
  const hudVisible = HUDS.some((h) => h.el.style.display !== 'none');
  accSecs.data.classList.toggle('acc-empty', !hudVisible);
  detailBody.scrollTop = 0;
  app.setCamera(sec.cam, sec.tgt);
}

/* ---------------- 原版功能块 1:1：上一节(←)/下一节(→) · 重置视角(R) · 全屏(F) · Space 光照/暂停 ---------------- */

const chapPrev = document.getElementById('chapPrev');
const chapNext = document.getElementById('chapNext');
const camResetBtn = document.getElementById('camResetBtn');
const fullBtn = document.getElementById('fullBtn');

function gotoChapter(i) { selectChapter((i + SECTIONS.length) % SECTIONS.length); }
chapPrev.addEventListener('click', () => gotoChapter(chapterIdx - 1));
chapNext.addEventListener('click', () => gotoChapter(chapterIdx + 1));

function resetView() { app.setCamera(SECTIONS[chapterIdx].cam, SECTIONS[chapterIdx].tgt); }
camResetBtn.addEventListener('click', resetView);

fullBtn.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.querySelector('.lab-stage3d').requestFullscreen().catch(() => { /* 用户拒绝或不支持时静默 */ });
});
document.addEventListener('fullscreenchange', () => {
  fullBtn.textContent = document.fullscreenElement ? '⛶ 退出全屏' : '⛶ 全屏';
});

window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft') gotoChapter(chapterIdx - 1);
  else if (e.key === 'ArrowRight') gotoChapter(chapterIdx + 1);
  else if (e.key === 'r' || e.key === 'R') resetView();
  else if (e.key === 'f' || e.key === 'F') fullBtn.click();
  else if (e.key === ' ') {
    e.preventDefault();
    if (cur === 6) light7();
    else if (pauseCtl) pauseCtl.set(!app.paused);
  }
});

/* ---------------- 栏折叠（左右独立 28px 竖条）× 专注模式（双栏同折） ---------------- */

const foldLBtn = document.getElementById('foldLBtn');
const unfoldLBtn = document.getElementById('unfoldLBtn');
const foldRBtn = document.getElementById('foldRBtn');
const unfoldRBtn = document.getElementById('unfoldRBtn');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'reaction.foldL', r: 'reaction.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null;

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用时仅本次会话生效 */ }

function applyFold() {
  rxShell.classList.toggle('fold-l', foldL);
  rxShell.classList.toggle('fold-r', foldR);
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
  rxShell.classList.toggle('focus-mode', on);
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

const ACC_KEYS = { lesson: 'reaction.accLesson', controls: 'reaction.accControls', data: 'reaction.accData' };
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
function toggleAcc(name) {
  accClosed[name] = !accClosed[name];
  try { localStorage.setItem(ACC_KEYS[name], accClosed[name] ? '1' : '0'); } catch (e) { /* 忽略 */ }
  applyAcc(name);
}

/* ---------------- 启动 ---------------- */

loader.setText('就绪');
const sectionsApi = { select: selectChapter };
window.__eduSections = sectionsApi;
window.__rxStats = () => vfx.stats();   // 质检句柄：draw call / 三角形数
selectChapter(0);
loader.hide();
