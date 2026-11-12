/* EduLab · 细胞 · 三维结构（cell）
 * 章节：细胞全景 / 细胞器详解 / 动物细胞·植物细胞 / 原核细胞·真核细胞 / 流动镶嵌模型 /
 *       物质进出细胞 / 分泌蛋白的合成和转运 / 细胞骨架·胞质环流 / 随堂检测
 * 视觉工艺（edu-vfx 标准接入示范）：
 *       - 后处理管线：bloom 辉光 + 暗角 + 胶片颗粒，illus/fluor 双模式
 *       - 材质分级：膜壳 clearcoat、胞质 sheen 绒面、能量器官 emissive
 *       - 有机几何：fbm 顶点噪声雕刻的剖壳细胞（含壁厚剖面封边）、核孔阵列、
 *         线粒体剖开胶囊、管网内质网、InstancedMesh 核糖体
 * 章节结构 / 交互逻辑 / 随堂检测与旧版一致。
 */
import {
  THREE, TAU, clamp,
  createApp, makeLoader,
  createControlsPanel, makeHUD, makeTextSprite,
} from './edu-core.js';
import {
  PAL, attachVFX, makeStudioEnvironment,
  matSheen, matCoat, matStd, matGlow, matGlass,
  registerGlow, applyGlowMode, ghostify,
  makeCutShell, makeCutCapsule, fbm3,
  makeWoodTexture, makeLabelTexture,
} from './edu-vfx.js';

/* ---------------- 基础与工艺接入 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在装配细胞器…');
const mesh = (geo, mat) => new THREE.Mesh(geo, mat);
function label(text, color = '#ffffff', scale = 0.0052, bg = 'rgba(8,14,20,0.72)') {
  return makeTextSprite(text, { fontSize: 32, color, scale, bg });
}
const app = createApp({
  container: stage,
  fov: 42, near: 0.1, far: 200,
  cameraPos: [0, 2.2, 7.4], target: [0, 0.6, 0],
  minDistance: 0.8, maxDistance: 40,
  keepBackground: true,
});
const { scene, camera } = app;
const vfx = attachVFX(app, 'illus');
scene.environment = makeStudioEnvironment(app.renderer);

/* 灯光：暖主光 + 冷补光 + 低环境（反射主要来自 studio environment） */
const keyLight = new THREE.DirectionalLight(0xffe2bd, 1.55);
keyLight.position.set(5, 8, 6);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x9fc4d8, 0.6);
fillLight.position.set(-6, 3, -5);
scene.add(fillLight);
const ambLight = new THREE.AmbientLight(0x93aec0, 0.5);
scene.add(ambLight);
const rimLight = new THREE.DirectionalLight(0x9ad8e8, 0.45);
rimLight.position.set(-3, 6, -7);
scene.add(rimLight);
const bounceLight = new THREE.PointLight(0xffc9a0, 0.5, 24, 1.8);
bounceLight.position.set(0, -2.4, 1.6);
scene.add(bounceLight);

/* ================= 实验台场景叙事：木质台面 + 培养皿 + 试剂瓶 + 载玻片 + 手绘笔记 =================
 * 细胞悬浮于台面上方的观察区，台面道具交代"实验室里观察活细胞"的语境；
 * 全部纹理程序化生成，无外部资产。 */

const labBench = new THREE.Group();
scene.add(labBench);
{
  const woodTex = makeWoodTexture({ base: '#8a6440', dark: '#5f4026', light: '#a8814f', seed: 23, bands: 9, streaks: 110 });
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.repeat.set(2.4, 1.1);
  const woodMat = matStd(0xffffff, { roughness: 0.62, metalness: 0.04 });
  woodMat.map = woodTex;
  const woodDark = makeWoodTexture({ base: '#6f4c2e', dark: '#4c3018', light: '#8a663c', seed: 71, bands: 7, streaks: 80 });
  woodDark.wrapS = woodDark.wrapT = THREE.RepeatWrapping;
  woodDark.repeat.set(1.6, 0.9);
  const woodDarkMat = matStd(0xffffff, { roughness: 0.68 });
  woodDarkMat.map = woodDark;
  const steelDark = matStd(PAL.steel, { roughness: 0.42, metalness: 0.55 });

  /* 台面：顶板 + 挡板/搁板（同材质烘焙合并）+ 桌腿（钢质烘焙合并） */
  const top = mesh(new THREE.BoxGeometry(8.6, 0.22, 3.7), woodMat);
  top.position.set(0, -3.62, 0.5);
  labBench.add(top);
  {
    const apron = mesh(new THREE.BoxGeometry(8.2, 0.5, 0.16), woodDarkMat);
    apron.position.set(0, -3.95, 2.3);
    const shelf = mesh(new THREE.BoxGeometry(7.6, 0.1, 2.8), woodDarkMat);
    shelf.position.set(0, -5.6, 0.5);
    labBench.add(mesh(bakeMerge([apron, shelf]), woodDarkMat));
    const legParts = [];
    for (const [lx, lz] of [[-3.9, -0.9], [3.9, -0.9], [-3.9, 1.9], [3.9, 1.9]]) {
      const leg = mesh(new THREE.CylinderGeometry(0.09, 0.125, 2.6, 10), steelDark);
      leg.position.set(lx, -4.95, lz + 0.5);
      legParts.push(leg);
    }
    labBench.add(mesh(bakeMerge(legParts), steelDark));
  }
  const benchShadow = makeContactShadow(5.4, 0.5);
  benchShadow.scale.set(1.5, 1, 0.7);
  benchShadow.position.set(0, -6.3, 0.5);
  labBench.add(benchShadow);

  /* --- 培养皿：玻璃盘 + 琼脂面（菌落斑点程序化纹理） + 盖沿 --- */
  const agarTex = (() => {
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const c = cv.getContext('2d');
    c.fillStyle = '#e8d9b0';
    c.beginPath();
    c.arc(S / 2, S / 2, S / 2 - 4, 0, TAU);
    c.fill();
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * TAU;
      const r = 12 + Math.random() * 88;
      const x = S / 2 + Math.cos(a) * r;
      const y = S / 2 + Math.sin(a) * r;
      const rad = 3 + Math.random() * 7;
      const col = Math.random() > 0.5 ? 'rgba(214,150,90,0.85)' : 'rgba(160,178,120,0.8)';
      c.fillStyle = col;
      c.beginPath();
      c.arc(x, y, rad, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(90,60,30,0.35)';
      c.beginPath();
      c.arc(x, y, rad + 1.4, 0, TAU);
      c.stroke();
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const dish = new THREE.Group();
  dish.position.set(-2.7, -3.5, 1.55);
  const dishMat = matGlass(0xdfeef2, { roughness: 0.12, transmission: 0.9, opacity: 0.34 });
  const dishBody = mesh(new THREE.CylinderGeometry(0.62, 0.6, 0.1, 36), dishMat);
  const agar = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 32), matStd(0xffffff, { roughness: 0.5 }));
  agar.material.map = agarTex;
  agar.position.y = 0.03;
  const lid = mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.05, 36, 1, true), dishMat);
  lid.position.y = 0.14;
  const lidTop = mesh(new THREE.CircleGeometry(0.64, 36), dishMat);
  lidTop.rotation.x = -TAU / 4;
  lidTop.position.y = 0.17;
  dish.add(dishBody, agar, mesh(bakeMerge([lid, lidTop]), dishMat));
  const dishShadow = makeContactShadow(0.75, 0.4);
  dishShadow.position.y = -0.09;
  dish.add(dishShadow);
  labBench.add(dish);


  /* --- 试剂瓶 ×3：瓶身/瓶盖实例化（同形），液体 instanceColor 分色，纸标签各一张 --- */
  const bottleSpecs = [
    { x: -1.5, z: 1.9, liquid: 0xc2483e, fill: 0.62, label: ['醋酸洋红', '染色液 50mL'] },
    { x: -0.55, z: 2.0, liquid: 0x2f7d54, fill: 0.48, label: ['健那绿 B', '线粒体活染 25mL'] },
    { x: 2.85, z: 1.85, liquid: 0xb08d4a, fill: 0.55, label: ['碘液', '卢戈氏 100mL'] },
  ];
  const glassMat = matGlass(0xcfe6ea, { roughness: 0.1, transmission: 0.92, opacity: 0.3 });
  {
    const H = 1.05, R = 0.3;
    const prof = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      /* 瓶底圆角 → 直壁 → 收肩 → 瓶颈 */
      let r;
      if (t < 0.06) r = R * (0.55 + t / 0.06 * 0.45);
      else if (t < 0.62) r = R;
      else if (t < 0.8) r = R * (1 - ((t - 0.62) / 0.18) * 0.55);
      else r = R * 0.45;
      prof.push(new THREE.Vector2(Math.max(r, 0.05), t * H));
    }
    prof.push(new THREE.Vector2(0.13, H + 0.04));
    const bodyGeo = new THREE.LatheGeometry(prof, 26);
    const bodies = new THREE.InstancedMesh(bodyGeo, glassMat, 3);
    const caps = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.15, 0.14, 14), matStd(PAL.brass, { roughness: 0.4, metalness: 0.6 }), 3);
    const liqMat = matStd(0xffffff, { roughness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.18 });
    const liquids = new THREE.InstancedMesh(new THREE.CylinderGeometry(R * 0.94, R * 0.82, 1, 20), liqMat, 3);
    const bd = new THREE.Object3D();
    bottleSpecs.forEach((sp, i) => {
      bd.position.set(sp.x, -3.5, sp.z);
      bd.rotation.set(0, 0, 0);
      bd.scale.setScalar(1);
      bd.updateMatrix();
      bodies.setMatrixAt(i, bd.matrix);
      bd.position.y = -3.5 + H + 0.1;
      bd.updateMatrix();
      caps.setMatrixAt(i, bd.matrix);
      const liqH = H * sp.fill;
      bd.position.set(sp.x, -3.5 + 0.04 + liqH / 2, sp.z);
      bd.scale.set(1, liqH, 1);
      bd.updateMatrix();
      liquids.setMatrixAt(i, bd.matrix);
      liquids.setColorAt(i, new THREE.Color(sp.liquid));
    });
    liquids.instanceColor.needsUpdate = true;
    labBench.add(bodies, caps, liquids);
    for (const sp of bottleSpecs) {
      const lblTex = makeLabelTexture(sp.label, { w: 128, h: 128, accent: '#7c4030', fontSize: 22 });
      const lbl = mesh(new THREE.PlaneGeometry(0.36, 0.4), matStd(0xffffff, { roughness: 0.7 }));
      lbl.material.map = lblTex;
      lbl.material.transparent = false;
      lbl.position.set(sp.x, -3.5 + H * 0.42, sp.z + R + 0.012);
      labBench.add(lbl);
    }
  }

  /* --- 显微镜：放样镜臂 + 镜筒 + 物镜转盘 + 载物台 + 调焦旋钮（叙事主角道具） --- */
  const scope = new THREE.Group();
  scope.position.set(3.0, -3.5, 0.7);
  scope.rotation.y = -0.6;
  {
    const bodyMat = matStd(0x3a4656, { roughness: 0.4, metalness: 0.35 });
    const accentMat = matStd(PAL.brass, { roughness: 0.32, metalness: 0.65 });
    /* 底座：马蹄形（放样闭合截面） */
    const baseGeo = loftSkin(
      [new THREE.Vector3(-0.55, 0, 0), new THREE.Vector3(0, 0, 0.16), new THREE.Vector3(0.55, 0, 0), new THREE.Vector3(0, 0, -0.28)],
      () => [[-0.1, -0.14], [0.1, -0.14], [0.1, 0], [-0.1, 0]],
      { segsT: 20 }
    );
    const baseMesh = mesh(baseGeo, bodyMat);
    /* 镜臂：C 形曲线放样（宽截面随弧度渐变，微米级卷边） */
    const armPts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const a = -0.5 + t * 2.6;
      armPts.push(new THREE.Vector3(Math.cos(a) * 0.42, 0.08 + Math.sin(a * 0.9) * 0.02 + t * 0.62, Math.sin(a) * 0.16));
    }
    const armGeo = loftSkin(armPts, (t) => {
      const w = 0.075 + Math.sin(t * Math.PI) * 0.02;
      return [[-w, -w * 0.7], [w, -w * 0.7], [w, w * 0.7], [-w, w * 0.7]];
    }, { segsT: 26 });
    const armMesh = mesh(armGeo, bodyMat);
    /* 镜筒：斜置圆筒（与两颗深色物镜同材质烘焙合并） */
    const barrel = mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.5, 16), bodyMat);
    barrel.position.set(0.06, 0.86, 0.1);
    barrel.rotation.z = 0.32;
    const objB1 = mesh(new THREE.CylinderGeometry(0.016, 0.032, 0.16, 10), bodyMat);
    objB1.position.set(0.1 + Math.cos(2.494) * 0.05, 0.45, 0.1 + Math.sin(2.494) * 0.05);
    objB1.rotation.x = Math.sin(2.494) * 0.18;
    objB1.rotation.z = -Math.cos(2.494) * 0.18;
    const objB2 = mesh(new THREE.CylinderGeometry(0.016, 0.032, 0.16, 10), bodyMat);
    objB2.position.set(0.1 + Math.cos(4.589) * 0.05, 0.45, 0.1 + Math.sin(4.589) * 0.05);
    objB2.rotation.x = Math.sin(4.589) * 0.18;
    objB2.rotation.z = -Math.cos(4.589) * 0.18;
    scope.add(mesh(bakeMerge([baseMesh, armMesh, barrel, objB1, objB2]), bodyMat));
    const eyeglass = mesh(new THREE.CircleGeometry(0.052, 16), matGlass(0xbfe0ea, { roughness: 0.05, transmission: 0.9, opacity: 0.4 }));
    eyeglass.rotation.x = -TAU / 4;
    eyeglass.position.set(-0.02, 1.1, 0.1);
    scope.add(eyeglass);
    /* 物镜转盘：中心盘 + 一颗黄铜物镜 */
    const disc = mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 16), accentMat);
    disc.position.set(0.1, 0.55, 0.1);
    scope.add(disc);
    const objA = mesh(new THREE.CylinderGeometry(0.016, 0.032, 0.16, 10), accentMat);
    objA.position.set(0.1 + Math.cos(0.4) * 0.05, 0.45, 0.1 + Math.sin(0.4) * 0.05);
    objA.rotation.x = Math.sin(0.4) * 0.18;
    objA.rotation.z = -Math.cos(0.4) * 0.18;
    scope.add(objA);
    /* 载物台：黑平台 + 台上待观察的染色涂片 */
    const stagePlate = mesh(new THREE.BoxGeometry(0.5, 0.03, 0.4), matStd(0x1a1e26, { roughness: 0.6 }));
    stagePlate.position.set(0.1, 0.4, 0.12);
    scope.add(stagePlate);
    const sampleSlide = mesh(new THREE.BoxGeometry(0.3, 0.012, 0.14), matGlass(0xd8ecf0, { roughness: 0.05, transmission: 0.95, opacity: 0.25 }));
    sampleSlide.position.set(0.1, 0.425, 0.12);
    scope.add(sampleSlide);
    const stainMat = matStd(0xc05078, { roughness: 0.4, emissive: 0x581430, emissiveIntensity: 0.35 });
    {
      const dotParts = [];
      for (const [sx2, sz2, sr] of [[0.04, 0.1, 0.03], [0.16, 0.13, 0.022]]) {
        const cellDot = mesh(new THREE.SphereGeometry(sr, 10, 8), stainMat);
        cellDot.scale.set(1.3, 0.28, 1);
        cellDot.position.set(sx2, 0.436, sz2);
        dotParts.push(cellDot);
      }
      scope.add(mesh(bakeMerge(dotParts), stainMat));
    }
    /* 调焦旋钮：同轴双钮（粗调在外侧，微调贴内） */
    for (const [side, ky, kr] of [[1, 0.36, 0.075], [-1, 0.26, 0.05]]) {
      const knob = mesh(new THREE.CylinderGeometry(kr, kr, 0.05, 14), accentMat);
      knob.rotation.z = TAU / 4;
      knob.position.set(side * 0.46, ky, 0.08);
      scope.add(knob);
    }
    const scopeShadow = makeContactShadow(0.85, 0.45);
    scopeShadow.position.y = -0.02;
    scope.add(scopeShadow);
  }
  labBench.add(scope);

  /* --- 试管架位已并入台面搁板层（draw call 预算让位给细胞主体） --- */

  /* --- 手绘笔记：摊开的记录本，页面上程序化画一张细胞速写 + 行线 --- */
  const noteTex = (() => {
    const W = 512, H = 320;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.fillStyle = '#f4efe2';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(150,130,100,0.5)';
    c.lineWidth = 1;
    for (let y = 36; y < H; y += 24) {
      c.beginPath();
      c.moveTo(20, y);
      c.lineTo(W - 20, y);
      c.stroke();
    }
    c.strokeStyle = 'rgba(180,60,50,0.6)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(W * 0.62, 20);
    c.lineTo(W * 0.62, H - 14);
    c.stroke();
    /* 细胞速写：圆膜 + 核 + 器官小圈 */
    c.strokeStyle = '#2c4a5a';
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(W * 0.3, H * 0.52, 88, 64, -0.15, 0, TAU);
    c.stroke();
    c.fillStyle = 'rgba(120,90,190,0.35)';
    c.beginPath();
    c.arc(W * 0.27, H * 0.46, 26, 0, TAU);
    c.fill();
    c.strokeStyle = '#7c4a9a';
    c.stroke();
    c.fillStyle = 'rgba(230,140,60,0.6)';
    for (const [ex, ey, er] of [[W * 0.38, H * 0.62, 11], [W * 0.34, H * 0.38, 8], [W * 0.2, H * 0.66, 7]]) {
      c.beginPath();
      c.ellipse(ex, ey, er * 1.4, er * 0.7, 0.5, 0, TAU);
      c.fill();
    }
    c.strokeStyle = 'rgba(60,110,130,0.8)';
    c.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.moveTo(W * 0.66, 52 + i * 34);
      c.bezierCurveTo(W * 0.7, 42 + i * 34, W * 0.8, 62 + i * 34, W * 0.86, 52 + i * 34);
      c.stroke();
    }
    c.fillStyle = '#3a3630';
    c.font = '16px "PingFang SC", sans-serif';
    c.fillText('观察记录 · 第 3 天', 26, 26);
    c.fillText('活染可见 嵴', W * 0.66, 200);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  })();
  const book = new THREE.Group();
  book.position.set(1.7, -3.47, 1.15);
  book.rotation.y = -0.35;
  const coverMat = matStd(0x4a5568, { roughness: 0.55 });
  const pageMat = matStd(0xffffff, { roughness: 0.75 });
  pageMat.map = noteTex;
  const pageL = mesh(new THREE.PlaneGeometry(1.15, 0.78), pageMat);
  pageL.rotation.x = -TAU / 4;
  pageL.rotation.z = 0.02;
  pageL.position.set(-0.58, 0.03, 0);
  const pageR = pageL.clone();
  pageR.material = pageMat;
  pageR.position.set(0.58, 0.03, 0);
  pageR.rotation.z = -0.02;
  const cover = mesh(new THREE.BoxGeometry(2.42, 0.03, 0.84), coverMat);
  const spine = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.84, 8), coverMat);
  spine.rotation.z = TAU / 4;
  book.add(mesh(bakeMerge([pageL, pageR]), pageMat), mesh(bakeMerge([cover, spine]), coverMat));
  const bookShadow = makeContactShadow(1.3, 0.36);
  bookShadow.scale.set(1.6, 1, 0.6);
  bookShadow.position.y = -0.06;
  book.add(bookShadow);
  labBench.add(book);
}

/* 细胞本体的接触阴影（悬浮投影在台面上，仅全景/检测章节显示） */
const cellShadow = makeContactShadow(2.6, 0.5);
cellShadow.position.set(0, -3.42, 0.3);
scene.add(cellShadow);

/* ---------------- 放样 / 阴影 / 程序化纹理工具 ---------------- */

/**
 * 同材质散件烘焙合并：把一组同 parent、同材质的 mesh 局部变换烘进几何后拼成一份
 * BufferGeometry，返回可直接用该材质建一个 mesh 的几何体（大幅省 draw call）。
 */
function bakeMerge(list) {
  const baked = list.map((m) => {
    m.updateMatrix();
    const g0 = m.geometry.clone();
    g0.applyMatrix4(m.matrix);
    return g0.index ? g0.toNonIndexed() : g0;
  });
  let total = 0;
  for (const g of baked) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  let vp = 0, np = 0;
  for (const g of baked) {
    pos.set(g.attributes.position.array, vp);
    nor.set(g.attributes.normal.array, np);
    vp += g.attributes.position.array.length;
    np += g.attributes.normal.array.length;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}

/**
 * 变截面放样：沿 CatmullRom 样条脊线，按 profileAt(站) 返回 2D 轮廓折线，
 * 逐站铺环、连四边形带，生成 BufferGeometry（法线随环计算，UV 沿程展开）。
 * 用于泵体、瓶肩、囊泡鞍座、笔记本书脊等有机曲面件。
 */
function loftSkin(spinePts, profileAt, opts = {}) {
  const spine = new THREE.CatmullRomCurve3(spinePts);
  const segsT = opts.segsT ?? 24;          /* 沿脊线站数 */
  const closed = opts.closed ?? true;      /* 截面是否首尾闭合 */
  const stations = [];
  for (let s = 0; s <= segsT; s++) {
    const t = s / segsT;
    const p = spine.getPointAt(t);
    const tan = spine.getTangentAt(t);
    /* 平行传输框架：以脊线切线为 Z，逐步校正避免绕转 */
    const up = Math.abs(tan.y) > 0.94 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(up, tan).normalize();
    const up2 = new THREE.Vector3().crossVectors(tan, right).normalize();
    const prof = profileAt(t, s);
    stations.push({ p, right, up: up2, prof });
  }
  const rings = [];
  for (const st of stations) {
    const ring = [];
    for (const [px, py] of st.prof) {
      ring.push(new THREE.Vector3(
        st.p.x + st.right.x * px + st.up.x * py,
        st.p.y + st.right.y * px + st.up.y * py,
        st.p.z + st.right.z * px + st.up.z * py
      ));
    }
    rings.push(ring);
  }
  const posArr = [], uvArr = [], idxArr = [];
  const cols = rings[0].length;
  for (let s = 0; s < rings.length; s++) {
    for (let i = 0; i < cols; i++) {
      const v = rings[s][i];
      posArr.push(v.x, v.y, v.z);
      uvArr.push(i / cols, s / segsT);
    }
  }
  for (let s = 0; s < rings.length - 1; s++) {
    for (let i = 0; i < cols; i++) {
      const a = s * cols + i;
      const b = s * cols + (i + 1) % cols;
      const c = (s + 1) * cols + i;
      const d = (s + 1) * cols + (i + 1) % cols;
      idxArr.push(a, c, b, b, c, d);
    }
  }
  /* 端帽：起点/终点各收一扇心形帽 */
  const capCenterA = rings[0].reduce((acc, v) => acc.add(v.clone()), new THREE.Vector3()).multiplyScalar(1 / cols);
  const capCenterB = rings[segsT].reduce((acc, v) => acc.add(v.clone()), new THREE.Vector3()).multiplyScalar(1 / cols);
  const baseA = posArr.length / 3;
  posArr.push(capCenterA.x, capCenterA.y, capCenterA.z); uvArr.push(0.5, 0);
  const baseB = posArr.length / 3;
  posArr.push(capCenterB.x, capCenterB.y, capCenterB.z); uvArr.push(0.5, 1);
  for (let i = 0; i < cols; i++) {
    idxArr.push(baseA, i, (i + 1) % cols);
    idxArr.push(baseB, (rings.length - 1) * cols + (i + 1) % cols, (rings.length - 1) * cols + i);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
  geo.setIndex(idxArr);
  geo.computeVertexNormals();
  return geo;
}

/** 径向渐变贴图（接触阴影 / 光晕共用底层工厂） */
function makeRadialTexture(stops, size = 128) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const cx = cv.getContext('2d');
  const g = cx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, c] of stops) g.addColorStop(o, c);
  cx.fillStyle = g;
  cx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** 接触阴影贴片：径向暗晕 plane，贴地防漂浮 */
function makeContactShadow(radius, opacity = 0.42) {
  const tex = makeRadialTexture([[0, `rgba(6,10,14,${opacity})`], [0.55, `rgba(6,10,14,${opacity * 0.5})`], [1, 'rgba(6,10,14,0)']]);
  const m = mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, opacity: 1,
  }));
  m.rotation.x = -TAU / 4;
  return m;
}

/** 通用点精灵辉光贴图（粒子/闪光复用） */
const glowDotTex = makeRadialTexture([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']], 64);

/* 发光材质登记表：illus 柔光 / fluor 全开 */
const glowList = [];
const G = (mat, i, f, o) => registerGlow(glowList, mat, i, f, o);

/* ================= 剖壳细胞（动物细胞主体） ================= */

const animalCell = new THREE.Group();
scene.add(animalCell);

const organelles = [];

function registerOrg(name, group, info, lblOffset = [0, 0.55, 0]) {
  const lb = label(name, '#eef3fa', 0.0044);
  lb.position.set(lblOffset[0] + group.position.x, lblOffset[1] + group.position.y, lblOffset[2] + group.position.z);
  group.userData.lbl = lb;
  group.userData.info = info;
  group.userData.name = name;
  animalCell.add(lb);
  lb.visible = false;
  organelles.push({ name, group });
  return group;
}

/* --- 细胞膜剖壳：暖膜色 + 深青胞质，fbm 雕刻轮廓，剖面封边露壁厚 --- */

const memMat = ghostify(matCoat(PAL.membrane, { roughness: 0.42, clearcoatRoughness: 0.24, emissive: 0x2a1810, emissiveIntensity: 0.25 }), 0.32);
const cytoMat = ghostify(matSheen(0x173a4c, {
  roughness: 0.58, sheen: 0.55, sheenColor: 0x62aec2,
  emissive: 0x0d3140, emissiveIntensity: 0.85,
}), 0.58);
const bandMat = matStd(0x94603a, { roughness: 0.5, emissive: 0x1c0e06, emissiveIntensity: 0.6 });
bandMat.side = THREE.DoubleSide;

let cellShell = null;

/** 按剖开角度（度）重建剖壳；顶点噪声让轮廓像手雕而非正球 */
function buildCellShell(wedgeDeg) {
  if (cellShell) {
    animalCell.remove(cellShell);
    cellShell.traverse((o) => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  }
  cellShell = makeCutShell({
    radius: 2.5, thickness: 0.2, wedge: wedgeDeg * (Math.PI / 180),
    amp: 0.09, freq: 1.65, seed: 11, segsP: 64, segsT: 44,
    mats: { outer: memMat, inner: cytoMat, band: bandMat },
  });
  /* 开口朝向镜头（+Z）：phi 从 −X 起量，转半圈把缺口转到镜头侧 */
  cellShell.rotation.y = Math.PI;
  animalCell.add(cellShell);
}
buildCellShell(209);

/* --- 细胞核：双层核膜 + 核孔阵列 + 发光核仁 + 染色质管线 --- */

const nucleus = new THREE.Group();
nucleus.position.set(-0.55, 0.55, 0.35);
{
  const envelope = ghostify(matCoat(PAL.nucleus, { roughness: 0.3, opacity: 0.55 }), 0.55);
  nucleus.add(mesh(new THREE.SphereGeometry(0.85, 36, 26), envelope));
  /* 核仁：荧光模式的主角 */
  const nucleolusMat = G(matGlow(PAL.nucleolus, 0.35, { color: 0x8a5ad8 }), 0.35, 2.4);
  const nucleolus = mesh(new THREE.SphereGeometry(0.28, 22, 16), nucleolusMat);
  nucleolus.position.set(0.16, 0.2, 0.2);
  nucleus.add(nucleolus);
  /* 核孔阵列：InstancedMesh 小环贴着外核膜（环面法向 = 径向） */
  const poreGeo = new THREE.TorusGeometry(0.038, 0.013, 6, 10);
  const poreMat = G(matStd(PAL.pore, { roughness: 0.4, emissive: 0x5a4e90, emissiveIntensity: 0.25 }), 0.25, 0.9);
  const pores = new THREE.InstancedMesh(poreGeo, poreMat, 20);
  const dummy = new THREE.Object3D();
  const ZAXIS = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < 20; i++) {
    /* 斐波那契球面分布，避开两极 */
    const y = 1 - (2 * (i + 0.5)) / 20;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * 2.399963;
    const radial = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    dummy.position.copy(radial).multiplyScalar(0.855);
    dummy.quaternion.setFromUnitVectors(ZAXIS, radial);
    dummy.updateMatrix();
    pores.setMatrixAt(i, dummy.matrix);
  }
  nucleus.add(pores);
  /* 染色质：核内的弯管线团（6 根同材质管线烘焙合并为单绘制） */
  const chrMat = G(matGlow(PAL.chromatin, 0.4, { color: 0xa88ae0, roughness: 0.45 }), 0.4, 1.9);
  {
    const chrParts = [];
    for (let i = 0; i < 6; i++) {
      const pts = [];
      const a0 = (i / 6) * TAU, r0 = 0.26 + (i % 3) * 0.12;
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const wob = fbm3(a0 * 3 + t * 4, i * 2.1, t * 2, i * 7) * 0.14;
        pts.push(new THREE.Vector3(
          Math.cos(a0 + t * 2.6) * r0 + wob,
          (t - 0.5) * 0.66 + wob * 0.6,
          Math.sin(a0 + t * 2.6) * r0 - wob
        ));
      }
      chrParts.push(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.028, 6), chrMat));
    }
    nucleus.add(mesh(bakeMerge(chrParts), chrMat));
  }
}
animalCell.add(nucleus);
registerOrg('细胞核', nucleus, '遗传信息库（DNA 所在地），控制细胞代谢与遗传；核膜双层、有核孔；核仁与核糖体的形成有关。');

/* --- 线粒体：剖开胶囊 + 基质 + 嵴片，膜半透明可透视 --- */

const mitoRegistry = [];
function makeMitochondrion(scale = 1, lite = false) {
  const g = new THREE.Group();
  mitoRegistry.push(g);
  const shellMat = ghostify(matCoat(PAL.mitoShell, {
    roughness: 0.34, clearcoatRoughness: 0.2, opacity: 0.42,
    emissive: 0x66200e, emissiveIntensity: 0.3,
  }), 0.42);
  const capMat = matStd(PAL.mitoMatrix, { roughness: 0.55, emissive: 0x7c2a12, emissiveIntensity: 0.4 });
  capMat.side = THREE.DoubleSide;
  const body = makeCutCapsule({
    radius: 0.27, halfLen: 0.5, wedge: Math.PI * 1.3, segs: 22,
    mats: { shell: shellMat, cap: capMat },
  });
  g.add(body);
  /* 基质：内部的发光芯 */
  const matrixMat = G(matGlow(PAL.mitoInner, 0.35, { color: 0xe05a30, roughness: 0.5 }), 0.35, 2.1);
  const matrix = mesh(new THREE.CapsuleGeometry(0.18, 0.44, 6, 14), matrixMat);
  matrix.rotation.z = TAU / 4;
  g.add(matrix);
  /* 嵴片：内膜折叠的弧板（6 片同材质烘焙合并为单绘制） */
  const cristaMat = G(matStd(PAL.cristae, { roughness: 0.42, emissive: 0x501404, emissiveIntensity: 0.4, side: THREE.DoubleSide }), 0.4, 1.8);
  {
    const cristaParts = [];
    for (let i = 0; i < 6; i++) {
      const arc = mesh(new THREE.TorusGeometry(0.17, 0.02, 6, 14, Math.PI * 0.9), cristaMat);
      arc.position.set(-0.36 + i * 0.14, 0, 0);
      arc.rotation.y = TAU / 4;
      arc.rotation.z = 0.25 * (i % 2 ? 1 : -1);
      arc.scale.set(1, 1.35, 1);
      cristaParts.push(arc);
    }
    g.add(mesh(bakeMerge(cristaParts), cristaMat));
  }
  if (lite) {
    /* lite 版：植物/背景位线粒体，只留外壳+基质+嵴（省下的 draw call 让给主角器官） */
    g.scale.setScalar(scale);
    return g;
  }
  /* 基质细节：mtDNA 小团 + ATP 闪粒（随呼吸节奏明暗） */
  const mtDnaMat = G(matStd(PAL.dna, { roughness: 0.45, emissive: 0x6a4a9a, emissiveIntensity: 0.4 }), 0.4, 1.3);
  const mtDna = mesh(new THREE.TorusGeometry(0.055, 0.014, 5, 14), mtDnaMat);
  mtDna.position.set(0.1, -0.06, 0.08);
  mtDna.rotation.set(0.9, 0.3, 0);
  g.add(mtDna);
  const atpDots = [];
  for (let i = 0; i < 2; i++) {
    const dotMat = G(new THREE.SpriteMaterial({ map: glowDotTex, color: 0xffd166, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.7 }), 0.7, 2.4, { illusO: 0.7, fluorO: 1.0 });
    const s = new THREE.Sprite(dotMat);
    s.scale.setScalar(0.1);
    s.position.set((Math.random() - 0.5) * 0.7, 0, (Math.random() - 0.5) * 0.24);
    s.userData.ph = Math.random() * TAU;
    g.add(s);
    atpDots.push(s);
  }
  g.userData.atpDots = atpDots;
  /* 内膜呼吸链：四颗复合体串在嵴缘（单材质实例化，呼吸节律整体脉冲）+ ATP 合成酶旋柄 */
  const etcColors = [0xd0b050, 0x60b0a0, 0xc07850, 0x8098d8];
  const etcMat = matStd(0xd0b050, { roughness: 0.35, emissive: 0xd0b050, emissiveIntensity: 0.3 });
  const etcParts = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 10, 8), etcMat, 4);
  {
    const ed = new THREE.Object3D();
    etcColors.forEach((col, i) => {
      ed.position.set(-0.34 + i * 0.22, 0.2, 0.02);
      ed.scale.setScalar(0.9 + (i % 2) * 0.2);
      ed.updateMatrix();
      etcParts.setMatrixAt(i, ed.matrix);
      etcParts.setColorAt(i, new THREE.Color(col));
    });
    etcParts.instanceColor.needsUpdate = true;
  }
  g.add(etcParts);
  const synthBase = mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.08, 10), matStd(PAL.membraneDeep, { roughness: 0.4 }));
  synthBase.position.set(0.18, 0.2, -0.06);
  const synthStalk = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 6), matStd(0xd8d2c4, { roughness: 0.5 }));
  synthStalk.position.set(0.18, 0.235, -0.06);
  g.add(mesh(bakeMerge([synthBase, synthStalk]), matStd(PAL.membraneDeep, { roughness: 0.4 })));
  const synthHead = mesh(new THREE.SphereGeometry(0.055, 12, 9), matStd(0xf2c979, { roughness: 0.35, emissive: 0x8a6a10, emissiveIntensity: 0.35 }));
  synthHead.scale.set(1.25, 0.8, 1.25);
  synthHead.position.set(0.18, 0.28, -0.06);
  g.add(synthHead);
  g.userData.etcMesh = etcParts;
  g.userData.synthHead = synthHead;
  g.scale.setScalar(scale);
  return g;
}
const mito1 = makeMitochondrion();
mito1.position.set(1.15, 1.25, 0.15);
mito1.rotation.set(0.4, 0.2, 0.5);
const mito2 = makeMitochondrion(0.8);
mito2.position.set(1.5, -0.45, 0.75);
mito2.rotation.set(-0.3, 0.5, -0.4);
animalCell.add(mito1, mito2);
registerOrg('线粒体', mito1, '细胞搞有氧呼吸的主场地——大家都叫它“动力车间”。外膜内膜双层，内层膜折进去叠成嵴，把反应面积撑大。');
registerOrg('线粒体（小）', mito2, '同上：数量多说明该细胞代谢旺盛、耗能多。', [0, 0.5, 0]);

/* --- 内质网：管状缠绕 + 附膜核糖体 --- */

/* 线粒体-内质网接触位点（MAM）：两器之间的短桥，钙与脂质交换的站台 */
{
  const mamMat = ghostify(matStd(PAL.rer, { roughness: 0.5, emissive: 0x1a4a5c, emissiveIntensity: 0.3 }), 0.6);
  const mamPts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    mamPts.push(new THREE.Vector3(
      0.75 + t * 0.42,
      0.78 - t * 0.42,
      -0.35 + Math.sin(t * 3) * 0.05
    ));
  }
  animalCell.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mamPts), 16, 0.028, 5), mamMat));
}

const erGroup = new THREE.Group();
erGroup.position.set(0.75, 0.75, -0.35);
const erTubeMat = ghostify(matCoat(PAL.rer, { roughness: 0.36, opacity: 0.85, clearcoatRoughness: 0.22 }), 0.85);
const erCurves = [];
{
  const erParts = [];
  for (let c = 0; c < 2; c++) {
    const pts = [];
    const off = c * 0.16;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      pts.push(new THREE.Vector3(
        Math.cos(t * TAU * 1.6 + c * 1.2) * 0.55 * (1 - t * 0.3) + off,
        Math.sin(t * TAU * 2.2 + c) * 0.15 + off * 0.5,
        Math.sin(t * TAU * 1.6 + c * 1.2) * 0.35 * (1 - t * 0.3)
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    erCurves.push(curve);
    erParts.push(mesh(new THREE.TubeGeometry(curve, 110, 0.085, 8), erTubeMat));
  }
  erGroup.add(mesh(bakeMerge(erParts), erTubeMat));
}
/* 光面内质网支管：从粗面管网分出的两根光管（无核糖体，管径更细，烘焙合并） */
{
  const serMat = ghostify(matCoat(PAL.ser, { roughness: 0.4, opacity: 0.75 }), 0.75);
  const serParts = [];
  for (let c = 0; c < 2; c++) {
    const pts = [];
    const a0 = c * 2.3 + 0.6;
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push(new THREE.Vector3(
        0.85 + Math.cos(a0 + t * 2.4) * (0.4 + t * 0.5),
        0.55 + Math.sin(t * 4 + c) * 0.28 - t * 0.5,
        -0.35 + Math.sin(a0 + t * 2.2) * 0.45
      ));
    }
    serParts.push(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.055, 6), serMat));
  }
  erGroup.add(mesh(bakeMerge(serParts), serMat));
}
/* 粗面内质网：沿管壁双排螺旋挂核糖体珠（附膜核糖体的真实排布感） */
const erRiboMat = G(matStd(PAL.ribosome, { roughness: 0.42, emissive: 0x8a7638, emissiveIntensity: 0.3 }), 0.3, 0.9);
const erRibo = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), erRiboMat, 36);
{
  const dummy = new THREE.Object3D();
  let k = 0;
  for (const curve of erCurves) {
    for (let i = 0; i < 9; i++) {
      const p = curve.getPoint(0.08 + (i / 9) * 0.84);
      const tan = curve.getTangent(0.08 + (i / 9) * 0.84);
      const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      for (const sgn of [1, -1]) {
        dummy.position.copy(p).add(side.clone().multiplyScalar(sgn * 0.1));
        dummy.position.y += sgn * 0.03;
        dummy.updateMatrix();
        erRibo.setMatrixAt(k++, dummy.matrix);
      }
    }
  }
}
erGroup.add(erRibo);
animalCell.add(erGroup);
registerOrg('内质网', erGroup, '蛋白质合成与加工、脂质合成的“车间”（粗面内质网附着核糖体；光面内质网参与脂质与解毒）。');

/* --- 游离核糖体：InstancedMesh 小球群 --- */

const riboMat = G(matStd(PAL.ribosome, { roughness: 0.45, emissive: 0x8a7638, emissiveIntensity: 0.3 }), 0.3, 0.9);
const ribGroup = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), riboMat, 40);
{
  const dummy = new THREE.Object3D();
  let placed = 0;
  let guard = 0;
  while (placed < 40 && guard++ < 500) {
    const p = new THREE.Vector3((Math.random() - 0.5) * 3.6, (Math.random() - 0.5) * 3.2, (Math.random() - 0.5) * 3.2);
    if (p.length() > 2.05) continue;
    if (p.distanceTo(nucleus.position) < 1.1) continue;
    dummy.position.copy(p);
    dummy.updateMatrix();
    ribGroup.setMatrixAt(placed++, dummy.matrix);
  }
  ribGroup.count = placed;
}
animalCell.add(ribGroup);
registerOrg('核糖体', ribGroup, '“生产蛋白质的机器”——无膜结构，将氨基酸缩合成肽链；附着在内质网上的合成分泌蛋白，游离的合成胞内蛋白。');
/* 游离多聚核糖体：一条 mRNA 弧线上串 5 颗核糖体（同工多机） */
{
  const polyArc = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    polyArc.push(new THREE.Vector3(-0.4 + t * 1.3, -0.7 + Math.sin(t * 4.2) * 0.14, 0.62 + Math.cos(t * 3) * 0.2));
  }
  const polyCurve = new THREE.CatmullRomCurve3(polyArc);
  animalCell.add(mesh(new THREE.TubeGeometry(polyCurve, 30, 0.022, 5), G(matStd(PAL.dna, { roughness: 0.45, emissive: 0x6a4a9a, emissiveIntensity: 0.35 }), 0.35, 1.2)));
  const polyBeads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), G(matStd(PAL.ribosome, { roughness: 0.45, emissive: 0x8a7638, emissiveIntensity: 0.3 }), 0.3, 0.9), 5);
  const pd = new THREE.Object3D();
  for (let i = 0; i < 5; i++) {
    pd.position.copy(polyCurve.getPoint(0.12 + i * 0.18)).y += 0.06;
    pd.updateMatrix();
    polyBeads.setMatrixAt(i, pd.matrix);
  }
  animalCell.add(polyBeads);
}

/* --- 高尔基体：弧形扁囊堆 + 出芽囊泡 --- */

const golgi = new THREE.Group();
golgi.position.set(-1.1, -1.15, 0.15);
golgi.rotation.set(0.2, 0.3, -0.25);
{
  const sacMat = ghostify(matCoat(PAL.golgi, { roughness: 0.32, opacity: 0.92, clearcoatRoughness: 0.2 }), 0.92);
  {
    const sacParts = [];
    for (let i = 0; i < 5; i++) {
      const sac = mesh(new THREE.SphereGeometry(0.42, 22, 12), sacMat);
      sac.scale.set(1.15 - i * 0.06, 0.13, 0.55 - i * 0.04);
      sac.position.y = (i - 2) * 0.15;
      sac.rotation.y = 0.16 * (i - 2);
      sacParts.push(sac);
    }
    golgi.add(mesh(bakeMerge(sacParts), sacMat));
  }
  const vesMat = G(matGlow(PAL.vesicle, 0.3, { color: 0xd8a850, roughness: 0.4 }), 0.3, 1.2);
  {
    const vesParts = [];
    [[0.5, 0.38, 0.1], [0.62, 0.05, -0.12], [-0.5, -0.42, 0.08]].forEach(([x, y, z]) => {
      const v = mesh(new THREE.SphereGeometry(0.085, 12, 10), vesMat);
      v.position.set(x, y, z);
      vesParts.push(v);
    });
    golgi.add(mesh(bakeMerge(vesParts), vesMat));
  }
}
animalCell.add(golgi);
registerOrg('高尔基体', golgi, '“发送站”：把内质网送来的蛋白质进一步加工、分拣与打包，再派囊泡送往各处（植物细胞里还参与细胞壁的构建）。');
/* 高尔基体深改：扁囊边缘窗孔（有孔环箍）+ 成熟面出芽动画 */
{
  const rimMat = G(matStd(PAL.golgiHi, { roughness: 0.35, emissive: 0x6a4a12, emissiveIntensity: 0.3 }), 0.3, 1.1);
  const rims = new THREE.InstancedMesh(new THREE.TorusGeometry(0.36, 0.016, 5, 18, TAU), rimMat, 5);
  const dummyR = new THREE.Object3D();
  for (let i = 0; i < 5; i++) {
    dummyR.position.set(0, (i - 2) * 0.15, 0);
    dummyR.rotation.set(TAU / 4, 0.16 * (i - 2), 0);
    const w = 1.15 - i * 0.06;
    dummyR.scale.set(w, (0.55 - i * 0.04) / 0.55, 1);
    dummyR.updateMatrix();
    rims.setMatrixAt(i, dummyR.matrix);
  }
  golgi.add(rims);
  /* 出芽囊泡：从成熟面（下）出芽 → 离开 → 复位，三个相位错开（实例化单绘制） */
  var golgiBuds = [];
  const budMat = G(matGlow(PAL.vesicle, 0.35, { color: 0xd8a850, roughness: 0.4 }), 0.35, 1.4);
  const budMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 10, 8), budMat, 3);
  golgi.add(budMesh);
  const budDummy = new THREE.Object3D();
  for (let i = 0; i < 3; i++) golgiBuds.push({ ph: i / 3 });
  golgiBuds.tick = (t) => {
    golgiBuds.forEach((b, i) => {
      const k = (t * 0.18 + b.ph) % 1;
      if (k < 0.3) {
        /* 贴囊期：沿最下扁囊边缘爬行 */
        const s = k / 0.3;
        budDummy.position.set(Math.cos(s * 2.2) * 0.42, -0.3 + Math.sin(s * 2.2) * 0.03, Math.sin(s * 2.2) * 0.2);
        budDummy.scale.setScalar(1);
      } else if (k < 0.85) {
        /* 离开期：抛物线漂出 */
        const s = (k - 0.3) / 0.55;
        const a0 = 0.6 + i * 2.1;
        budDummy.position.set(Math.cos(a0) * (0.5 + s * 0.85), -0.3 + s * s * 0.75, Math.sin(a0) * (0.3 + s * 0.5));
        budDummy.scale.setScalar(1);
      } else {
        budDummy.scale.setScalar(0);
      }
      budDummy.updateMatrix();
      budMesh.setMatrixAt(i, budDummy.matrix);
    });
    budMesh.instanceMatrix.needsUpdate = true;
  };
  /* 顺面（接收侧）/ 反面（发货侧）方向标 + 两个工位酶标签 */
  const cisLbl = label('顺面 · 接收', '#f2d9a0', 0.0032);
  cisLbl.position.set(-0.85, -0.45, 0);
  golgi.add(cisLbl);
  const transLbl = label('反面 · 发货', '#f2b9c8', 0.0032);
  transLbl.position.set(0.85, 0.42, 0);
  golgi.add(transLbl);
  const enzymeLbl1 = label('加工酶', '#d8eec8', 0.0026, 'rgba(20,40,16,0.7)');
  enzymeLbl1.position.set(0.05, 0.55, 0.3);
  golgi.add(enzymeLbl1);
  const enzymeLbl2 = label('分拣酶', '#e8d8f2', 0.0026, 'rgba(40,20,40,0.7)');
  enzymeLbl2.position.set(-0.15, -0.55, 0.3);
  golgi.add(enzymeLbl2);
  /* 拴系丝：出芽囊泡与扁囊之间的细牵丝（捕捉/识别的中间态，两根烘焙合并） */
  const tetherMat = ghostify(matStd(PAL.vesicle, { roughness: 0.5, emissive: 0x5a4210, emissiveIntensity: 0.3 }), 0.55);
  {
    const tetherParts = [];
    for (const [tx, ty, tz] of [[0.62, 0.5, 0.05], [-0.58, -0.5, 0.08]]) {
      const tp = [];
      for (let i = 0; i <= 8; i++) {
        const s = i / 8;
        tp.push(new THREE.Vector3(tx * s + Math.sin(s * 4) * 0.04, ty * s, tz + Math.cos(s * 3) * 0.03));
      }
      tetherParts.push(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tp), 16, 0.008, 4), tetherMat));
    }
    golgi.add(mesh(bakeMerge(tetherParts), tetherMat));
  }
}

/* --- 溶酶体：ghost 粉膜 + 内部水解酶颗粒 --- */

const lysoGroup = new THREE.Group();
lysoGroup.position.set(1.7, 1.35, -0.5);
const lyso1 = new THREE.Group();
{
  const lysoMat = ghostify(matCoat(PAL.lysosome, { roughness: 0.3, opacity: 0.5 }), 0.5);
  const body = mesh(new THREE.SphereGeometry(0.2, 20, 14), lysoMat);
  const granMat = G(matGlow(PAL.granule, 0.3, { color: 0xe88aa8, roughness: 0.5 }), 0.3, 1.1);
  const granules = new THREE.InstancedMesh(new THREE.SphereGeometry(0.038, 8, 6), granMat, 10);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 10; i++) {
    dummy.position.set((Math.random() - 0.5) * 0.24, (Math.random() - 0.5) * 0.24, (Math.random() - 0.5) * 0.24);
    dummy.updateMatrix();
    granules.setMatrixAt(i, dummy.matrix);
  }
  lyso1.add(body, granules);
}
lysoGroup.add(lyso1);
const lysoMat2 = ghostify(matCoat(PAL.lysosome, { roughness: 0.3, opacity: 0.5 }), 0.5);
const lyso2 = mesh(new THREE.SphereGeometry(0.15, 16, 12), lysoMat2);
lyso2.position.set(-1.6, 0.15, -0.4);
lysoGroup.add(lyso2);
animalCell.add(lysoGroup);
registerOrg('溶酶体', lyso1, '“消化车间”：内含多种水解酶，分解衰老的细胞器和吞入的病原体（内部为酸性环境）。');

/* 溶酶体消化场景：吞噬泡包裹一枚"衰老线粒体"，酶颗粒渐浓，细菌残体渐淡（自噬循环） */
{
  const digest = new THREE.Group();
  digest.position.set(1.55, 1.62, -0.62);
  const outer = ghostify(matCoat(PAL.lysosome, { roughness: 0.32, opacity: 0.34 }), 0.34);
  digest.add(mesh(new THREE.SphereGeometry(0.24, 18, 14), outer));
  /* 被吞的残体：迷你杆菌，透明度随消化进度下降 */
  const preyMat = matStd(PAL.capsule, { roughness: 0.5, transparent: true, opacity: 0.85 });
  const prey = mesh(new THREE.CapsuleGeometry(0.05, 0.12, 4, 10), preyMat);
  prey.rotation.z = 0.7;
  digest.add(prey);
  /* 水解酶颗粒：InstancedMesh 向心聚拢，表达酶涌向目标 */
  const enzMat = G(matGlow(PAL.granule, 0.35, { color: 0xe88aa8, roughness: 0.45 }), 0.35, 1.3);
  const enz = new THREE.InstancedMesh(new THREE.SphereGeometry(0.026, 6, 5), enzMat, 12);
  const enzSeeds = [];
  const dummyE = new THREE.Object3D();
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * TAU;
    const ph = Math.acos(2 * Math.random() - 1);
    enzSeeds.push({ a, ph, r: 0.22 });
  }
  digest.add(enz);
  digest.userData.tick = (t) => {
    const cyc = (Math.sin(t * 0.35) + 1) / 2;   /* 0..1 缓慢呼吸 */
    preyMat.opacity = 0.85 - cyc * 0.7;
    for (let i = 0; i < 12; i++) {
      const s = enzSeeds[i];
      const r = s.r * (1 - cyc * 0.75);
      dummyE.position.set(Math.sin(s.ph) * Math.cos(s.a) * r, Math.cos(s.ph) * r, Math.sin(s.ph) * Math.sin(s.a) * r);
      dummyE.updateMatrix();
      enz.setMatrixAt(i, dummyE.matrix);
    }
    enz.instanceMatrix.needsUpdate = true;
  };
  animalCell.add(digest);
  lysoGroup.userData.digest = digest;
}

/* --- 过氧化物酶体 ×2：单层膜小球 + 过氧化氢酶晶格方芯（解毒与脂肪酸氧化） --- */

{
  const peroMat = ghostify(matCoat(0xd0e8b8, { roughness: 0.32, opacity: 0.5, emissive: 0x2a3c18, emissiveIntensity: 0.3 }), 0.5);
  const crystalMat = G(matStd(0xeef4d8, { roughness: 0.3, metalness: 0.15, emissive: 0x3a4a20, emissiveIntensity: 0.3 }), 0.3, 1.0);
  const pero1 = new THREE.Group();
  pero1.position.set(0.55, -1.5, 0.75);
  pero1.add(mesh(new THREE.SphereGeometry(0.17, 16, 12), peroMat));
  const core1 = mesh(new THREE.OctahedronGeometry(0.08, 0), crystalMat);
  core1.rotation.set(0.5, 0.4, 0);
  pero1.add(core1);
  animalCell.add(pero1);
  registerOrg('过氧化物酶体', pero1, '单层膜小体，含过氧化氢酶，把有害的过氧化氢分解成水和氧，还参与脂肪酸的氧化分解。');
}

/* --- 中心体：两个互相垂直的中心粒，各自 9 组三联微管叶片 + 轮毂 + 周围物质云 + 星射线 --- */

const centro = new THREE.Group();
centro.position.set(-1.25, 1.5, -0.2);
{
  const centMat = G(matStd(PAL.centriole, { roughness: 0.35, metalness: 0.25, emissive: 0x6a7288, emissiveIntensity: 0.25 }), 0.25, 0.9);
  const bladeMat = G(matStd(PAL.centriole, { roughness: 0.3, metalness: 0.3, emissive: 0x7a84a0, emissiveIntensity: 0.2 }), 0.2, 0.8);
  const hubMat = matStd(0xc4ccd8, { roughness: 0.4, metalness: 0.35 });

  /* 三联微管叶片：A/B/C 三管并排成一片，9 片风车排布 */
  function makeCentrioleBlades(radius = 0.1) {
    const holder = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(0.028, 0.34, 0.09);
    const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, 9);
    const d = new THREE.Object3D();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      d.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
      d.rotation.set(0, -a, 0);
      d.updateMatrix();
      blades.setMatrixAt(i, d.matrix);
    }
    holder.add(blades);
    const hub = mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.3, 8), hubMat);
    holder.add(hub);
    const endCap = mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 16), centMat);
    endCap.rotation.x = TAU / 4;
    endCap.position.y = 0.17;
    const endCap2 = endCap.clone();
    endCap2.position.y = -0.17;
    holder.add(mesh(bakeMerge([endCap, endCap2]), centMat));
    return holder;
  }
  const c1 = makeCentrioleBlades();
  const c2 = makeCentrioleBlades();
  c2.rotation.x = TAU / 4;
  c2.position.x = 0.27;
  centro.add(c1, c2);
  /* 中心粒周围物质（PCM）：无定形电子致密物，用点云示意 */
  {
    const N = 60;
    const posArr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * TAU;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 0.24 + Math.random() * 0.2;
      posArr[i * 3] = Math.sin(ph) * Math.cos(a) * r;
      posArr[i * 3 + 1] = Math.cos(ph) * r * 0.7;
      posArr[i * 3 + 2] = Math.sin(ph) * Math.sin(a) * r;
    }
    const pcmGeo = new THREE.BufferGeometry();
    pcmGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    const pcmMat = new THREE.PointsMaterial({
      color: 0xaab6d0, size: 0.035, map: glowDotTex, transparent: true,
      opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    centro.add(new THREE.Points(pcmGeo, pcmMat));
  }
  /* 星射线：向四周放射的微管（示纺锤体起点，3 根烘焙合并） */
  const astralMat = ghostify(matStd(PAL.microtubule, { roughness: 0.45, emissive: 0x1c4a66, emissiveIntensity: 0.3 }), 0.55);
  {
    const astralParts = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 0.7;
      const pts = [];
      const len = 1.15 + i * 0.28;
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        pts.push(new THREE.Vector3(Math.cos(a) * t * len, Math.sin(t * 5 + i) * 0.05 - t * 0.35, Math.sin(a) * t * len));
      }
      astralParts.push(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.02, 5), astralMat));
    }
    centro.add(mesh(bakeMerge(astralParts), astralMat));
  }
}
animalCell.add(centro);
registerOrg('中心体', centro, '动物和低等植物细胞特有；由两个互相垂直排列的中心粒组成，与细胞的有丝分裂有关（发出星射线形成纺锤体）。');

/* --- 细胞核深改：核小体串珠 + 核纤层 + 核内 fibrillar 中心 + mRNP 出核流 --- */

{
  /* 核小体串珠：沿染色质管线挂小球（DNA 缠绕组蛋白八聚体的经典形象） */
  const nucleoMat = G(matStd(PAL.chromatin, { roughness: 0.4, emissive: 0x8a68c0, emissiveIntensity: 0.3 }), 0.3, 1.2);
  const N_BEAD = 96;
  const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.034, 10, 8), nucleoMat, N_BEAD);
  const dummyB = new THREE.Object3D();
  let bi = 0;
  for (let i = 0; i < 6 && bi < N_BEAD; i++) {
    const a0 = (i / 6) * TAU, r0 = 0.26 + (i % 3) * 0.12;
    for (let k = 0; k <= 10 && bi < N_BEAD; k++) {
      const t = k / 10;
      const wob = fbm3(a0 * 3 + t * 4, i * 2.1, t * 2, i * 7) * 0.14;
      dummyB.position.set(
        Math.cos(a0 + t * 2.6) * r0 + wob,
        (t - 0.5) * 0.66 + wob * 0.6,
        Math.sin(a0 + t * 2.6) * r0 - wob
      );
      dummyB.position.add(nucleus.position);
      dummyB.updateMatrix();
      beads.setMatrixAt(bi++, dummyB.matrix);
    }
  }
  beads.count = bi;
  animalCell.add(beads);
  /* 核纤层：内核膜下的中间纤维网络（低透网壳 + 环箍） */
  const laminaMat = ghostify(matStd(PAL.nucleoplasm, { roughness: 0.5, emissive: 0x2c2462, emissiveIntensity: 0.4 }), 0.24);
  const lamina = mesh(new THREE.SphereGeometry(0.7, 28, 20, 0, TAU, 0.35, 2.1), laminaMat);
  lamina.position.copy(nucleus.position);
  lamina.scale.setScalar(1.04);
  animalCell.add(lamina);
  /* 核仁纤丝中心：核仁内更亮的 3 个小团（实例化单绘制） */
  const fcMat = G(matGlow(0xb890ff, 0.5, { color: 0xb890ff, roughness: 0.3 }), 0.5, 2.8);
  {
    const fcMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 10, 8), fcMat, 3);
    const fd = new THREE.Object3D();
    [[0.2, 0.26, 0.24], [0.1, 0.12, 0.26], [0.24, 0.18, 0.14]].forEach(([fx, fy, fz], fi) => {
      fd.position.set(nucleus.position.x + fx, nucleus.position.y + fy, nucleus.position.z + fz);
      fd.updateMatrix();
      fcMesh.setMatrixAt(fi, fd.matrix);
    });
    animalCell.add(fcMesh);
  }
  /* 核仁周 rDNA 环：绕核仁的染色质细环（rRNA 基因所在，核仁组织区） */
  const rdnaMat = G(matStd(PAL.chromatin, { roughness: 0.4, emissive: 0x8a68c0, emissiveIntensity: 0.35 }), 0.35, 1.3);
  const rdnaPts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const aa = t * TAU;
    rdnaPts.push(new THREE.Vector3(
      nucleus.position.x + 0.16 + Math.cos(aa) * 0.3,
      nucleus.position.y + 0.2 + Math.sin(aa) * 0.22,
      nucleus.position.z + 0.2 + Math.sin(aa * 1.3) * 0.14
    ));
  }
  animalCell.add(mesh(new THREE.TorusGeometry(0.27, 0.014, 5, 40), rdnaMat));
  animalCell.children[animalCell.children.length - 1].position.set(nucleus.position.x + 0.16, nucleus.position.y + 0.2, nucleus.position.z + 0.2);
  animalCell.children[animalCell.children.length - 1].rotation.x = 1.1;
  animalCell.children[animalCell.children.length - 1].scale.set(1, 0.8, 1);
  /* mRNP 出核流：小颗粒队列从核内经核孔运往胞质，循环播放（InstancedMesh 单绘制） */
  var mRNP = { parts: [], t: 0 };
  const mmat = G(matStd(PAL.ribosome, { roughness: 0.4, emissive: 0x9a8a50, emissiveIntensity: 0.35 }), 0.35, 1.1);
  const mrnpMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), mmat, 12);
  animalCell.add(mrnpMesh);
  const mrnpDummy = new THREE.Object3D();
  for (let i = 0; i < 12; i++) mRNP.parts.push({ k: i / 12 });
  mRNP.tick = (dt) => {
    mRNP.t += dt * 0.12;
    const a = new THREE.Vector3(-0.2, 1.0, 0.2);   /* 核内集结点（核仁附近） */
    const exitDir = new THREE.Vector3(0.86, -0.3, 0.5).normalize();
    mRNP.parts.forEach((p, i) => {
      const k = (mRNP.t + p.k) % 1;
      let show = true;
      if (k < 0.42) {
        const s = k / 0.42;
        mrnpDummy.position.lerpVectors(a, nucleus.position.clone().add(exitDir.clone().multiplyScalar(0.84)), s);
        show = s > 0.15;
      } else if (k < 0.6) {
        mrnpDummy.position.copy(nucleus.position).add(exitDir.clone().multiplyScalar(0.85 + (k - 0.42) * 0.5));
      } else {
        const s = (k - 0.6) / 0.4;
        mrnpDummy.position.copy(nucleus.position).add(exitDir.clone().multiplyScalar(0.95 + s * 0.9));
        mrnpDummy.position.y += Math.sin(s * 6 + i) * 0.06;
        show = s < 0.85;
      }
      mrnpDummy.scale.setScalar(show ? 1 : 0);
      mrnpDummy.updateMatrix();
      mrnpMesh.setMatrixAt(i, mrnpDummy.matrix);
    });
    mrnpMesh.instanceMatrix.needsUpdate = true;
  };
  /* 内质网→核膜延续管：外核膜与内质网膜相连的实据（教材要点可视化） */
  const linkPts = [];
  const erAnchor = new THREE.Vector3(0.62, 1.28, -0.3);
  const nucAnchor = nucleus.position.clone().add(new THREE.Vector3(0.62, 0.55, -0.28));
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const p = new THREE.Vector3().lerpVectors(erAnchor, nucAnchor, t);
    p.y += Math.sin(t * Math.PI) * 0.1;
    linkPts.push(p);
  }
  animalCell.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(linkPts), 30, 0.06, 6),
    ghostify(matCoat(PAL.rer, { roughness: 0.36, opacity: 0.8 }), 0.8)));
  /* 核孔篮：胞质侧的环筐丝（与 20 个核孔同点位），InstancedMesh 单次绘制 */
  const basketMat = ghostify(matStd(PAL.pore, { roughness: 0.4, emissive: 0x4a3a70, emissiveIntensity: 0.3 }), 0.6);
  const baskets = new THREE.InstancedMesh(new THREE.TorusGeometry(0.055, 0.008, 4, 10, Math.PI * 0.8), basketMat, 20);
  {
    const d = new THREE.Object3D();
    for (let i = 0; i < 20; i++) {
      const y = 1 - (2 * (i + 0.5)) / 20;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const a = i * 2.399963;
      const radial = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      d.position.copy(nucleus.position).add(radial.clone().multiplyScalar(0.945));
      d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), radial.clone().negate());
      d.rotateX(Math.PI * 0.62);
      d.updateMatrix();
      baskets.setMatrixAt(i, d.matrix);
    }
  }
  animalCell.add(baskets);
  /* 30nm 染色质螺线管：在一条染色质臂上套一段六聚体螺旋粗管 */
  const solPts = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const a0 = 0;
    const wob = fbm3(a0 * 3 + t * 4, 2.1, t * 2, 7) * 0.14;
    const base = new THREE.Vector3(
      Math.cos(a0 + t * 2.6) * 0.26 + wob,
      (t - 0.5) * 0.66 + wob * 0.6,
      Math.sin(a0 + t * 2.6) * 0.26 - wob
    );
    /* 沿碱线绕 30nm 螺旋（半径 0.05，6 圈） */
    const helixA = t * TAU * 6;
    base.x += Math.cos(helixA) * 0.05;
    base.z += Math.sin(helixA) * 0.05;
    solPts.push(nucleus.position.clone().add(base));
  }
  animalCell.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(solPts), 90, 0.045, 6),
    ghostify(matStd(PAL.chromatin, { roughness: 0.42, emissive: 0x6a4a9a, emissiveIntensity: 0.3 }), 0.72)));
}

const animalLabels = organelles.map((o) => o.group.userData.lbl);

/* --- 胞质基质流氛围：24 颗微光颗粒在胞内缓慢环流（细胞质是流动的） --- */

const cytoFlow = { mesh: null, parts: [], on: true };
{
  const cfMat = G(matGlow(PAL.cytosolLit, 0.25, { color: 0x6aa8bc, roughness: 0.5 }), 0.25, 1.1);
  const cf = new THREE.InstancedMesh(new THREE.SphereGeometry(0.032, 6, 5), cfMat, 24);
  for (let i = 0; i < 24; i++) {
    const a = Math.random() * TAU;
    cytoFlow.parts.push({
      a, r: 1.1 + Math.random() * 0.95,
      y: (Math.random() - 0.5) * 2.2,
      tilt: (Math.random() - 0.5) * 0.6,
      sp: 0.5 + Math.random() * 0.7,
      off: Math.random(),
    });
  }
  animalCell.add(cf);
  cytoFlow.mesh = cf;
  const cfd = new THREE.Object3D();
  cytoFlow.tick = (dt, t) => {
    if (!cytoFlow.on) return;
    cytoFlow.parts.forEach((p, i) => {
      p.off = (p.off + dt * 0.03 * p.sp) % 1;
      const aa = p.a + p.off * TAU * 1.6;
      cfd.position.set(
        Math.cos(aa) * p.r,
        p.y + Math.sin(p.off * TAU * 2 + p.a) * p.tilt * 0.5,
        Math.sin(aa) * p.r * 0.85
      );
      cfd.scale.setScalar(0.7 + Math.sin(p.off * TAU * 3 + t) * 0.3);
      cfd.updateMatrix();
      cf.setMatrixAt(i, cfd.matrix);
    });
    cf.instanceMatrix.needsUpdate = true;
  };
}

/* ================= 植物细胞（壁剖壳 + 大液泡 + 叶绿体） ================= */

const plantCell = new THREE.Group();
plantCell.visible = false;
scene.add(plantCell);
{
  /* 细胞壁：厚壁剖壳 */
  const wallOuter = ghostify(matCoat(PAL.cellWall, { roughness: 0.55, opacity: 0.42 }), 0.42);
  const wallBand = matStd(PAL.cellWallDeep, { roughness: 0.6, side: THREE.DoubleSide, emissive: 0x1a2c08, emissiveIntensity: 0.5 });
  const wallShell = makeCutShell({
    radius: 2.75, thickness: 0.3, wedge: Math.PI * 1.16,
    amp: 0.05, freq: 2.1, seed: 41, segsP: 56, segsT: 40,
    mats: { outer: wallOuter, inner: matStd(PAL.cellWall, { roughness: 0.6, opacity: 0.3, transparent: true, depthWrite: false, side: THREE.DoubleSide }), band: wallBand },
  });
  wallShell.rotation.y = Math.PI;
  plantCell.add(wallShell);
  const wallLbl = label('细胞壁（全透性·支持保护）', '#dff0cc', 0.0042);
  wallLbl.position.set(0, 3.35, 0);
  plantCell.add(wallLbl);
  /* 壁三层小标：胞间层 / 初生壁 / 次生壁加厚 */
  const wallLayerLbls = [
    ['胞间层（果胶胶黏）', 2.95, '#e8d8a0'],
    ['初生壁（薄·可延展）', 3.15, '#c8e8a8'],
    ['次生壁（厚·加固）', 3.35, '#a8d888'],
  ];
  for (const [txt, hy, col] of wallLayerLbls) {
    const lb = label(txt, col, 0.0028, 'rgba(16,30,10,0.68)');
    lb.position.set(2.1, hy, 1.2);
    plantCell.add(lb);
  }
  /* 内侧细胞膜 + 胞质 */
  const pm = ghostify(matCoat(PAL.membrane, { roughness: 0.4, opacity: 0.3 }), 0.3);
  const cyto = ghostify(matSheen(0x35606a, { roughness: 0.62, sheen: 0.6, sheenColor: 0x8fd0d8, emissive: 0x0c2228, emissiveIntensity: 0.5 }), 0.5);
  const inner = new THREE.Group();
  inner.add(mesh(new THREE.SphereGeometry(2.4, 44, 30, 0, Math.PI * 1.16, 0, Math.PI), pm));
  inner.add(mesh(new THREE.SphereGeometry(2.32, 40, 28, 0, Math.PI * 1.16, 0, Math.PI), cyto));
  inner.rotation.y = Math.PI;
  plantCell.add(inner);
  /* 大液泡：中央 ghost 水球 */
  const vacMat = G(ghostify(matCoat(PAL.vacuole, { roughness: 0.22, opacity: 0.38, clearcoatRoughness: 0.15, emissive: 0x123a5c, emissiveIntensity: 0.3 }), 0.38), 0.3, 1.4, { illusO: 0.38, fluorO: 0.25 });
  const vac = mesh(new THREE.SphereGeometry(1.32, 36, 26), vacMat);
  vac.position.set(0, -0.35, 0);
  plantCell.add(vac);
  const vacLbl = label('大液泡（细胞液·维持渗透压）', '#bfe2f8', 0.0042);
  vacLbl.position.set(0, -1.95, 0);
  plantCell.add(vacLbl);
  /* 细胞核（贴边小核） */
  const nucMat = ghostify(matCoat(PAL.nucleus, { roughness: 0.32, opacity: 0.6 }), 0.6);
  const nuc = mesh(new THREE.SphereGeometry(0.6, 28, 20), nucMat);
  nuc.position.set(-1.3, 1.15, 0.2);
  plantCell.add(nuc);
  /* 叶绿体 ×6：双凸透镜体 + 类囊体基粒盘 + 淀粉粒 */
  const thylakoidMat = G(matGlow(PAL.thylakoid, 0.3, { color: 0x2a9448, roughness: 0.45 }), 0.3, 1.7);
  plantCell.userData.thylakoidMat = thylakoidMat;
  const thylakoids = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.09, 0.035, 10), thylakoidMat, 30);
  const starchMat = matStd(PAL.starch, { roughness: 0.6 });
  const cpDnaMat = G(matStd(PAL.dna, { roughness: 0.45, emissive: 0x6a4a9a, emissiveIntensity: 0.35 }), 0.35, 1.2);
  const lamellaMat = ghostify(matStd(PAL.thylakoid, { roughness: 0.5, emissive: 0x123c1c, emissiveIntensity: 0.3 }), 0.7);
  const envMat = ghostify(matCoat(PAL.thylakoid, { roughness: 0.42, opacity: 0.4 }), 0.4);
  const envMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.245, 16, 10), envMat, 6);
  const cpDnaMesh = new THREE.InstancedMesh(new THREE.TorusGeometry(0.06, 0.012, 5, 16), cpDnaMat, 6);
  let thIdx = 0;
  let envIdx = 0, dnaIdx = 0;
  const mCh = new THREE.Matrix4();
  const mLocal = new THREE.Matrix4();
  const mOne = new THREE.Vector3(1, 1, 1);
  const mQ = new THREE.Quaternion();
  const mIdent = new THREE.Quaternion();
  const mEnvScale = new THREE.Vector3(1.3, 0.75, 1);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const ch = new THREE.Group();
    ch.position.set(Math.cos(a) * 1.6, Math.sin(a * 1.3) * 1.15, Math.sin(a) * 0.9);
    ch.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    const bodyMat = ghostify(matCoat(PAL.chloroplast, { roughness: 0.4, opacity: 0.55, emissive: 0x0e3a14, emissiveIntensity: 0.4 }), 0.55);
    const body = mesh(new THREE.SphereGeometry(0.28, 18, 12), bodyMat);
    body.scale.set(1.3, 0.75, 1);
    ch.add(body);
    mCh.makeRotationFromEuler(ch.rotation).setPosition(ch.position);
    /* 内被膜与环状 DNA：实例矩阵 = 叶绿体位姿 × 局部位姿（单绘制铺满 6 个叶绿体） */
    mLocal.compose(new THREE.Vector3(0, 0, 0), mIdent, mEnvScale);
    envMesh.setMatrixAt(envIdx++, mCh.clone().multiply(mLocal));
    mLocal.compose(new THREE.Vector3(-0.12, -0.05, 0.12), mQ.setFromEuler(new THREE.Euler(1.1, 0.3, 0)), mOne);
    cpDnaMesh.setMatrixAt(dnaIdx++, mCh.clone().multiply(mLocal));
    for (let k = 0; k < 5; k++) {
      /* 基粒盘实例矩阵 = 叶绿体位姿 × 盘局部位姿（随叶绿体一起转）；5 盘一摞 */
      mLocal.compose(
        new THREE.Vector3(0, -0.16 + k * 0.08, 0),
        mQ.setFromEuler(new THREE.Euler(0, Math.random() * TAU, 0)),
        mOne
      );
      thylakoids.setMatrixAt(thIdx++, mCh.clone().multiply(mLocal));
    }
    /* 基粒间膜（基质类囊体）：两根连管把相邻基粒串起来（同材质合并为单绘制） */
    {
      const lamParts = [];
      for (let s = 0; s < 2; s++) {
        const cp = [];
        for (let k = 0; k <= 6; k++) {
          const t = k / 6;
          cp.push(new THREE.Vector3(
            -0.3 + t * 0.6,
            -0.05 + Math.sin(t * 3.5 + s * 2) * 0.1 + (s - 0.5) * 0.1,
            Math.cos(t * 2.5 + s) * 0.08
          ));
        }
        lamParts.push(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cp), 16, 0.016, 5), lamellaMat));
      }
      ch.add(mesh(bakeMerge(lamParts), lamellaMat));
    }
    const starch = mesh(new THREE.SphereGeometry(0.05, 8, 6), starchMat);
    starch.position.set(0.12, 0.05, 0.1);
    ch.add(starch);
    plantCell.add(ch);
  }
  thylakoids.count = thIdx;
  plantCell.add(thylakoids, envMesh, cpDnaMesh);
  const chLbl = label('叶绿体（类囊体基粒·光合作用）', '#a8e8b4', 0.0042);
  chLbl.position.set(2.9, 1.6, 0);
  plantCell.add(chLbl);
  /* 线粒体一枚 */
  const pm1 = makeMitochondrion(0.7);
  pm1.position.set(1.4, 1.7, -0.4);
  plantCell.add(pm1);
}

/* --- 植物细胞内部补全：内质网 + 高尔基体 + 游离核糖体 + 胞间连丝 + 液泡内含物 --- */

const plantFx = { light: 1.0, turgor: 1.0, bubbles: [] };
{
  /* 植物内质网：两条绕液泡的弯管（同材质烘焙合并） */
  const perMat = ghostify(matCoat(PAL.rer, { roughness: 0.36, opacity: 0.8 }), 0.8);
  {
    const perParts = [];
    for (let c = 0; c < 2; c++) {
      const pts = [];
      for (let i = 0; i <= 34; i++) {
        const t = i / 34;
        const a = t * TAU * (1.1 + c * 0.25) + c * 2.1;
        const rr = 1.9 - c * 0.22;
        pts.push(new THREE.Vector3(Math.cos(a) * rr, 0.55 + Math.sin(t * TAU * 2 + c) * 0.42 - c * 0.3, Math.sin(a) * rr * 0.82));
      }
      perParts.push(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.075, 7), perMat));
    }
    plantCell.add(mesh(bakeMerge(perParts), perMat));
  }
  /* 植物高尔基体：三叠扁囊（贴壁，参与细胞壁构建的站位） */
  const pgG = new THREE.Group();
  pgG.position.set(-1.85, -0.7, 0.55);
  pgG.rotation.set(0.3, 0.5, 0.2);
  const pgMat = ghostify(matCoat(PAL.golgi, { roughness: 0.34, opacity: 0.88 }), 0.88);
  for (let i = 0; i < 3; i++) {
    const sac = mesh(new THREE.SphereGeometry(0.3, 18, 10), pgMat);
    sac.scale.set(1 - i * 0.08, 0.13, 0.5 - i * 0.05);
    sac.position.y = (i - 1) * 0.13;
    pgG.add(sac);
  }
  const pgBud = mesh(new THREE.SphereGeometry(0.06, 10, 8), G(matGlow(PAL.vesicle, 0.3, { color: 0xd8a850, roughness: 0.4 }), 0.3, 1.2));
  pgBud.position.set(0.3, -0.32, 0.1);
  pgG.add(pgBud);
  plantCell.add(pgG);
  /* 游离核糖体：胞质散点 */
  const prMat = G(matStd(PAL.ribosome, { roughness: 0.45, emissive: 0x8a7638, emissiveIntensity: 0.3 }), 0.3, 0.9);
  const pr = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), prMat, 30);
  {
    const d = new THREE.Object3D();
    let n = 0, guard = 0;
    while (n < 30 && guard++ < 400) {
      const p = new THREE.Vector3((Math.random() - 0.5) * 4.2, (Math.random() - 0.5) * 4.2, (Math.random() - 0.5) * 3);
      if (p.length() > 2.15) continue;
      if (p.y < 0.6 && p.length() < 1.7) continue;   /* 避开中央液泡 */
      d.position.copy(p);
      d.updateMatrix();
      pr.setMatrixAt(n++, d.matrix);
    }
    pr.count = n;
  }
  plantCell.add(pr);
  /* 胞间连丝：贯穿细胞壁的细管 ×6（相邻细胞物质通道） */
  const pdMat = ghostify(matStd(PAL.cellWallDeep, { roughness: 0.45, emissive: 0x24400e, emissiveIntensity: 0.4 }), 0.7);
  const pd = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 8), pdMat, 6);
  {
    const d = new THREE.Object3D();
    const OUTER = 2.85;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.3;
      const dir = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.4, Math.sin(a) * 0.75).normalize();
      d.position.copy(dir.clone().multiplyScalar(OUTER));
      d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      d.updateMatrix();
      pd.setMatrixAt(i, d.matrix);
    }
  }
  plantCell.add(pd);
  /* 液泡内含物：花青素旋涡纹（内层染色球）+ 液泡膜高光环 */
  const anthoTex = (() => {
    const S = 256;
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const c = cv.getContext('2d');
    c.fillStyle = 'rgba(60,90,150,0.16)';
    c.fillRect(0, 0, S, S);
    for (let i = 0; i < 5; i++) {
      c.strokeStyle = `rgba(${120 + i * 12},${70 + i * 8},${170 - i * 10},0.30)`;
      c.lineWidth = 10 + i * 3;
      c.beginPath();
      for (let k = 0; k <= 60; k++) {
        const t = k / 60;
        const a = t * TAU * 2.6;
        const r = 18 + t * (100 - i * 12);
        const x = S / 2 + Math.cos(a) * r;
        const y = S / 2 + Math.sin(a) * r * 0.9;
        k === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const anthoMat = ghostify(matStd(0xffffff, { roughness: 0.3 }), 0.26);
  anthoMat.map = anthoTex;
  const antho = mesh(new THREE.SphereGeometry(1.24, 30, 22), anthoMat);
  antho.position.set(0, -0.35, 0);
  plantCell.add(antho);
  plantFx.antho = antho;
  plantFx.vac = plantCell.children.find((o) => o.isMesh && o.geometry && o.geometry.parameters && o.geometry.parameters.radius === 1.32);
  /* 液泡膜水通道蛋白：嵌在液泡表面的小通道 ×6（水分快速进出） */
  const aqpMat = G(matStd(PAL.rer, { roughness: 0.35, emissive: 0x1a4a5c, emissiveIntensity: 0.3 }), 0.3, 1.0);
  const aqp = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8), aqpMat, 6);
  {
    const d = new THREE.Object3D();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.5;
      const dir = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.3 + 0.2, Math.sin(a) * 0.8).normalize();
      d.position.copy(dir.clone().multiplyScalar(1.3)).add(new THREE.Vector3(0, -0.35, 0));
      d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      d.updateMatrix();
      aqp.setMatrixAt(i, d.matrix);
    }
  }
  plantCell.add(aqp);
  const aqpLbl = label('水通道蛋白', '#bfe8f4', 0.0026, 'rgba(10,28,36,0.7)');
  aqpLbl.position.set(1.15, 1.1, 0.4);
  plantCell.add(aqpLbl);
  /* 细胞壁纤维素环箍：三条绕壁的微纤丝加强箍（半透明） */
  const hoopMat = ghostify(matStd(PAL.cellWallDeep, { roughness: 0.55, emissive: 0x24400e, emissiveIntensity: 0.3 }), 0.45);
  for (const [hx, hr, rz] of [[0, 2.92, 0.1], [0.5, 2.88, 1.25], [-0.6, 2.86, 2.35]]) {
    const hoop = mesh(new THREE.TorusGeometry(hr, 0.04, 6, 48), hoopMat);
    hoop.rotation.x = TAU / 4;
    hoop.rotation.y = rz;
    hoop.position.y = hx;
    hoop.scale.set(1, 0.94, 1);
    plantCell.add(hoop);
  }
  /* 光合气泡：叶绿体上方冒出的 O₂ 小泡，升速随光照强度 */
  const bubMat = ghostify(matGlass(0xdff4ff, { roughness: 0.15, transmission: 0.85, opacity: 0.5 }), 0.5);
  const BUB_N = 18;
  const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), bubMat, BUB_N);
  const bd = new THREE.Object3D();
  for (let i = 0; i < BUB_N; i++) plantFx.bubbles.push({ k: Math.random(), a: Math.random() * TAU, ch: i % 6 });
  plantFx.bubbleMesh = bubbles;
  plantFx.bubbleDummy = bd;
  plantCell.add(bubbles);
}

/* 植物细胞逐帧：气泡上升 + 叶绿体随光自旋微动 + 液泡膨压呼吸 */
function tickPlantFx(dt, t) {
  const spd = 0.05 + plantFx.light * 0.11;
  for (let i = 0; i < plantFx.bubbles.length; i++) {
    const b = plantFx.bubbles[i];
    b.k = (b.k + dt * spd) % 1;
    const chA = (b.ch / 6) * TAU;
    const cx = Math.cos(chA) * 1.6, cy = Math.sin(chA * 1.3) * 1.15, cz = Math.sin(chA) * 0.9;
    plantFx.bubbleDummy.position.set(
      cx + Math.sin(b.k * TAU * 2 + b.a) * 0.08,
      cy + 0.15 + b.k * 1.5,
      cz + Math.cos(b.k * TAU * 2 + b.a) * 0.08
    );
    const s = 0.5 + b.k * 0.8;
    plantFx.bubbleDummy.scale.setScalar(s);
    plantFx.bubbleDummy.updateMatrix();
    plantFx.bubbleMesh.setMatrixAt(i, plantFx.bubbleDummy.matrix);
  }
  plantFx.bubbleMesh.instanceMatrix.needsUpdate = true;
  if (plantFx.antho) plantFx.antho.rotation.y = t * 0.12;
  if (plantFx.vac) plantFx.vac.scale.setScalar(0.9 + plantFx.turgor * 0.2);
}

/* ================= 原核细胞（杆菌剖壳 + 拟核 DNA 环） ================= */

const prok = new THREE.Group();
prok.visible = false;
scene.add(prok);
const prokLabels = [];
{
  /* 杆菌壁：剖开胶囊壳 */
  const wallMat = ghostify(matCoat(PAL.capsule, { roughness: 0.45, opacity: 0.42 }), 0.42);
  const bandMatP = matStd(0x5a9a84, { roughness: 0.55, side: THREE.DoubleSide, emissive: 0x123028, emissiveIntensity: 0.5 });
  const shell = makeCutCapsule({ radius: 1.0, halfLen: 1.1, wedge: Math.PI * 1.2, segs: 26, mats: { shell: wallMat, cap: bandMatP } });
  shell.rotation.z = TAU / 4;
  prok.add(shell);
  /* 胞内：半透明青质芯 */
  const innerMat = ghostify(matSheen(0x2e5a58, { roughness: 0.6, sheen: 0.55, sheenColor: 0x86d0c8, emissive: 0x0a2422, emissiveIntensity: 0.5 }), 0.4);
  const innerCap = mesh(new THREE.CapsuleGeometry(0.9, 2.1, 10, 22), innerMat);
  innerCap.rotation.z = TAU / 4;
  prok.add(innerCap);
  /* 拟核：环状 DNA 管线团 */
  const dnaMat = G(matGlow(PAL.dna, 0.45, { color: 0xb28ae0, roughness: 0.4 }), 0.45, 2.2);
  const nucPts = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const wob = fbm3(t * 5, 1.7, t * 3, 91) * 0.12;
    nucPts.push(new THREE.Vector3(
      Math.cos(t * TAU * 2.2) * 0.42 + wob,
      Math.sin(t * TAU * 3.1) * 0.3,
      Math.sin(t * TAU * 2.2) * 0.34 + wob
    ));
  }
  prok.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(nucPts), 120, 0.05, 6), dnaMat));
  const nucLbl = label('拟核：环状 DNA（无核膜包被）', '#e2c8ff', 0.0044);
  nucLbl.position.set(0, 1.75, 0);
  prok.add(nucLbl); prokLabels.push(nucLbl);
  /* 质粒小环 ×2（其中一枚带复制叉：双叉弧 + 新链短枝） */
  const plasmidMat = G(matGlow(PAL.plasmid, 0.35, { color: 0xd88ab4, roughness: 0.45 }), 0.35, 1.9);
  [[0.55, 0.25, 0.3], [-0.5, -0.2, 0.45]].forEach(([x, y, z], pi) => {
    const ring = mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 20), plasmidMat);
    ring.position.set(x, y, z);
    ring.rotation.set(0.8, 0.4, 0);
    prok.add(ring);
    if (pi === 0) {
      const forkMat = G(matStd(PAL.dna, { roughness: 0.4, emissive: 0x7a5ab0, emissiveIntensity: 0.4 }), 0.4, 1.5);
      for (const fa of [0.6, -0.9]) {
        const branch = mesh(new THREE.TorusGeometry(0.09, 0.014, 5, 12, 0.5), forkMat);
        branch.position.set(x, y, z);
        branch.rotation.set(0.8, 0.4, fa);
        prok.add(branch);
      }
    }
  });
  /* 核糖体散点 */
  const riboMatP = G(matStd(PAL.ribosome, { roughness: 0.45, emissive: 0x8a7638, emissiveIntensity: 0.3 }), 0.3, 0.9);
  const ribos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), riboMatP, 26);
  const dummy = new THREE.Object3D();
  let placed = 0, guard = 0;
  while (placed < 26 && guard++ < 200) {
    const p = new THREE.Vector3((Math.random() - 0.5) * 2.1, (Math.random() - 0.5) * 1.15, (Math.random() - 0.5) * 1.2);
    if (p.length() < 0.62) continue;
    dummy.position.copy(p);
    dummy.updateMatrix();
    ribos.setMatrixAt(placed++, dummy.matrix);
  }
  ribos.count = placed;
  prok.add(ribos);
  /* 壁与荚膜标注 */
  const wallLbl = label('细胞壁 + 细胞膜', '#dcecc4', 0.0044);
  wallLbl.position.set(0, -1.75, 0);
  prok.add(wallLbl); prokLabels.push(wallLbl);
  /* 鞭毛：螺旋推进器 */
  const flagPts = [];
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    flagPts.push(new THREE.Vector3(-1.7 - t * 1.5, Math.sin(t * TAU * 3) * 0.16, Math.cos(t * TAU * 3) * 0.16));
  }
  const flag = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(flagPts), 90, 0.03, 6), matStd(PAL.flagellum, { roughness: 0.5 }));
  prok.add(flag);
  prok.userData.flag = flag;
  const flagLbl = label('鞭毛（摆动推进）', '#b8e6ff', 0.0042);
  flagLbl.position.set(-2.6, 0.8, 0);
  prok.add(flagLbl); prokLabels.push(flagLbl);
  /* 菌毛：短须 ×5（同材质烘焙合并） */
  const piliMat = matStd(PAL.pili, { roughness: 0.55 });
  {
    const piliParts = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + 0.4;
      const pilus = mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.42, 5), piliMat);
      pilus.position.set(Math.cos(a) * 1.0, 0.2, Math.sin(a) * 1.0);
      pilus.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2);
      piliParts.push(pilus);
    }
    prok.add(mesh(bakeMerge(piliParts), piliMat));
  }
  /* 性菌毛：更粗更长的一根（接合转移 DNA 用） */
  const sexPilus = mesh(new THREE.CylinderGeometry(0.022, 0.014, 0.85, 7), matStd(0xd8c8a0, { roughness: 0.5 }));
  sexPilus.position.set(0.55, 0.85, -0.75);
  sexPilus.rotation.set(1.1, 0, 0.4);
  prok.add(sexPilus);
  /* 荚膜：壁外黏液层（更大更淡的 ghost 胶囊壳） */
  const slimeMat = ghostify(matSheen(0x9adcc8, { roughness: 0.75, sheen: 0.4, sheenColor: 0xbef0e0, emissive: 0x0e3830, emissiveIntensity: 0.3 }), 0.16);
  const slime = mesh(new THREE.CapsuleGeometry(1.16, 2.3, 8, 24), slimeMat);
  slime.rotation.z = TAU / 4;
  prok.add(slime);
  /* S 层：壁面蛋白晶格小突起，InstancedMesh 贴壁 */
  const slayerMat = matStd(0xb8e0d0, { roughness: 0.5 });
  const slayer = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 6, 5), slayerMat, 64);
  {
    const d = new THREE.Object3D();
    let n = 0;
    for (let i = 0; i < 64; i++) {
      /* 圆柱段均匀布点：角度 × 轴向，两端半球各补一圈 */
      const t = i < 48 ? (i % 24) / 24 : (i < 56 ? 0 : 1);
      const a = (i * 2.399963) % TAU;
      const ax = -1.0 + t * 2.0;
      const rr = Math.abs(ax) < 1.05 ? 1.02 : 1.0;
      d.position.set(ax, Math.cos(a) * rr, Math.sin(a) * rr);
      d.lookAt(d.position.clone().multiplyScalar(2));
      d.updateMatrix();
      slayer.setMatrixAt(n++, d.matrix);
      if (n >= 64) break;
    }
    slayer.count = n;
  }
  prok.add(slayer);
  const slayerLbl = label('S 层蛋白晶格', '#cdeee0', 0.0026, 'rgba(10,30,26,0.7)');
  slayerLbl.position.set(0, 1.35, 0.6);
  prok.add(slayerLbl); prokLabels.push(slayerLbl);
  /* 多聚核糖体：一条 mRNA 弧线挂 5 颗核糖体 ×2 组（两条 mRNA 烘焙合并） */
  const polyMat = G(matStd(PAL.ribosome, { roughness: 0.42, emissive: 0x8a7638, emissiveIntensity: 0.3 }), 0.3, 0.9);
  const polyMrnaMat = G(matStd(PAL.dna, { roughness: 0.45, emissive: 0x6a4a9a, emissiveIntensity: 0.35 }), 0.35, 1.2);
  {
    const polyParts = [];
    const beadSets = [];
    for (let c = 0; c < 2; c++) {
      const pts = [];
      const base = c === 0 ? [0.2, 0.45, 0.55] : [-0.7, -0.35, 0.35];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        pts.push(new THREE.Vector3(base[0] - 0.4 + t * 0.9, base[1] + Math.sin(t * 4) * 0.12, base[2] + Math.cos(t * 3) * 0.18));
      }
      polyParts.push(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.02, 5), polyMrnaMat));
      beadSets.push(pts);
    }
    prok.add(mesh(bakeMerge(polyParts), polyMrnaMat));
    const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), polyMat, 10);
    const d = new THREE.Object3D();
    let bn = 0;
    for (const pts of beadSets) {
      for (let i = 0; i < 5; i++) {
        d.position.copy(pts[2 + i * 2]).y += 0.07;
        d.updateMatrix();
        beads.setMatrixAt(bn++, d.matrix);
      }
    }
    prok.add(beads);
  }
  /* 拟核结合蛋白：拟核区散布的小蛋白簇（帮助 DNA 折叠成核区） */
  const npMat = G(matStd(0xa8c8e8, { roughness: 0.4, emissive: 0x3a5a80, emissiveIntensity: 0.3 }), 0.3, 1.0);
  const nucleoidProt = new THREE.InstancedMesh(new THREE.SphereGeometry(0.042, 8, 6), npMat, 10);
  {
    const d = new THREE.Object3D();
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * TAU;
      const r = 0.15 + Math.random() * 0.3;
      d.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 0.4, Math.sin(a) * r * 0.8);
      d.updateMatrix();
      nucleoidProt.setMatrixAt(i, d.matrix);
    }
  }
  prok.add(nucleoidProt);
}

/* 原核细胞附加状态：鞭毛转速 */
const prokFx = { flagSpeed: 1 };

/* ================= 章节 5：流动镶嵌模型 ================= */

const gMembrane = new THREE.Group();
gMembrane.visible = false;
scene.add(gMembrane);

const BIL_X = 7, BIL_Y = 5;
const HEAD_N = BIL_X * BIL_Y * 2;
const headMat = matCoat(PAL.membraneHi, { roughness: 0.4, clearcoatRoughness: 0.22, emissive: 0x40230e, emissiveIntensity: 0.35 });
const tailMat = matStd(PAL.membrane, { roughness: 0.6 });
const headMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 12, 9), headMat, HEAD_N);
const tailMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), tailMat, HEAD_N);
gMembrane.add(headMesh, tailMesh);

const lipState = [];
{
  const dummy = new THREE.Object3D();
  for (const layer of [-1, 1]) {
    for (let gx = 0; gx < BIL_X; gx++) {
      for (let gz = 0; gz < BIL_Y; gz++) {
        lipState.push({
          x: (gx - (BIL_X - 1) / 2) * 0.62 + (Math.random() - 0.5) * 0.1,
          z: (gz - (BIL_Y - 1) / 2) * 0.62 + (Math.random() - 0.5) * 0.1,
          layer, phase: Math.random() * TAU, speed: 0.3 + Math.random() * 0.6,
        });
      }
    }
  }
  lipState.forEach((l, k) => {
    dummy.position.set(l.x, l.layer * 0.42, l.z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    headMesh.setMatrixAt(k, dummy.matrix);
    dummy.position.y += -l.layer * 0.3;
    dummy.updateMatrix();
    tailMesh.setMatrixAt(k, dummy.matrix);
  });
}

const proteins = [];
function addProtein(x, z, kind) {
  const g = new THREE.Group();
  if (kind === 'channel') {
    const tube = mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.25, 14, 1, true), ghostify(matCoat(PAL.rer, { roughness: 0.3, opacity: 0.7 }), 0.7));
    g.add(tube);
  } else {
    const blob = mesh(new THREE.SphereGeometry(0.3, 16, 12), matCoat(PAL.ser, { roughness: 0.4 }));
    blob.scale.set(1, 1.35, 1);
    g.add(blob);
  }
  g.position.set(x, 0, z);
  gMembrane.add(g);
  proteins.push({ g, x, z, phase: Math.random() * TAU, speed: 0.15 + Math.random() * 0.3, kind });
  return g;
}
addProtein(-1.7, 0.4, 'channel');
addProtein(1.3, -0.9, 'channel');
addProtein(0.1, 1.2, 'globular');
addProtein(-0.5, -1.4, 'globular');

const sugars = new THREE.Group();
gMembrane.add(sugars);
{
  /* 糖被升级：6 处糖链各自成树（干 2 节 + 分叉），InstancedMesh 单绘制 */
  const sm = G(matStd(PAL.stroma, { roughness: 0.45, emissive: 0x3e5a20, emissiveIntensity: 0.3 }), 0.3, 1.4);
  const cells = [[-1.7, 0.4], [1.3, -0.9], [0.1, 1.2], [-0.5, -1.4], [0.9, 0.6], [-2.2, -0.9]];
  const sg = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), sm, cells.length * 10);
  const sd = new THREE.Object3D();
  let si = 0;
  cells.forEach(([x, z]) => {
    for (let k = 0; k < 10; k++) {
      const lv = Math.floor(k / 4);
      const br = k % 4;
      const a = br * 1.7 + lv * 0.9;
      sd.position.set(
        x + Math.cos(a) * (0.06 + lv * 0.15),
        0.58 + lv * 0.22,
        z + Math.sin(a) * (0.06 + lv * 0.15)
      );
      sd.scale.setScalar(1 - lv * 0.22);
      sd.updateMatrix();
      sg.setMatrixAt(si++, sd.matrix);
    }
  });
  sugars.add(sg);
}
const protLbl = label('磷脂双分子层（支架）· 蛋白质（镶嵌·流动）· 糖被（识别）', '#ffd9a8', 0.0042);
protLbl.position.set(0, 1.85, 0);
gMembrane.add(protLbl);

/* --- 膜章节深改：胆固醇四环小体 + 糖蛋白糖链树 + 膜下皮层微丝拱 + 双层边缘封边 --- */

const fluid = { speed: 1, wave: true, sugar: true, chol: 0.5, flipOn: true, lastFlip: 0, t: 0 };
const _dummy = new THREE.Object3D();
{
  /* 胆固醇：嵌在尾部之间的扁平四环小体（甾核 3 环 + 侧链），InstancedMesh */
  const cholMat = matStd(0xf2d060, { roughness: 0.35, emissive: 0x6a5210, emissiveIntensity: 0.2 });
  const CHOL_N = 56;
  const cholGeo = (() => {
    const parts = [];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.BoxGeometry(0.16, 0.035, 0.1);
      g.translate(i * 0.055 - 0.055, 0, (i % 2 ? 0.012 : -0.012));
      parts.push(g);
    }
    const tailG = new THREE.BoxGeometry(0.09, 0.028, 0.05);
    tailG.translate(0.16, 0, 0.03);
    parts.push(tailG);
    return mergeGeos(parts);
  })();
  function mergeGeos(list) {
    /* 简易几何合并：把多个 BoxGeometry 的位置属性拼接为一个 BufferGeometry（同索引策略按非索引处理） */
    let total = 0;
    for (const g of list) total += (g.index ? g.index.count : g.attributes.position.count);
    const pos = new Float32Array(total * 3);
    const nor = new Float32Array(total * 3);
    let vp = 0, np = 0;
    for (const g of list) {
      const ng = g.toNonIndexed();
      pos.set(ng.attributes.position.array, vp);
      nor.set(ng.attributes.normal.array, np);
      vp += ng.attributes.position.array.length;
      np += ng.attributes.normal.array.length;
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    return out;
  }
  const chols = new THREE.InstancedMesh(cholGeo, cholMat, CHOL_N);
  const cholState = [];
  {
    const d = new THREE.Object3D();
    let n = 0;
    for (const layer of [-1, 1]) {
      for (let i = 0; i < CHOL_N / 2; i++) {
        const gx = (Math.random() - 0.5) * 6.4;
        const gz = (Math.random() - 0.5) * 4.4;
        cholState.push({ x: gx, z: gz, layer, ph: Math.random() * TAU, sp: 0.2 + Math.random() * 0.4, on: n < CHOL_N * 0.5 });
        d.position.set(gx, layer * 0.18, gz);
        d.rotation.set(0, Math.random() * TAU, (Math.random() - 0.5) * 0.3);
        d.updateMatrix();
        chols.setMatrixAt(n, d.matrix);
        n++;
      }
    }
  }
  gMembrane.add(chols);
  fluid.cholMesh = chols;
  fluid.cholState = cholState;
  /* 糖蛋白糖链树：通道蛋白顶上分叉的糖枝（InstancedMesh 串珠） */
  const sugarMat = G(matStd(PAL.stroma, { roughness: 0.42, emissive: 0x3e5a20, emissiveIntensity: 0.25 }), 0.25, 1.2);
  const treeGeo = new THREE.SphereGeometry(0.05, 8, 6);
  const TREE_N = 26;
  const tree = new THREE.InstancedMesh(treeGeo, sugarMat, TREE_N);
  {
    const d = new THREE.Object3D();
    let k = 0;
    for (const [tx, tz, tilt] of [[-1.7, 0.4, 0.3], [1.3, -0.9, -0.4]]) {
      /* 主干 2 节 + 每节分叉 2 枝 ×3 层 */
      for (let lv = 0; lv < 3; lv++) {
        for (let br = 0; br < 4; br++) {
          if (k >= TREE_N) break;
          const a = br * 1.9 + lv;
          d.position.set(
            tx + Math.cos(a) * (0.1 + lv * 0.16),
            0.78 + lv * 0.3,
            tz + Math.sin(a) * (0.1 + lv * 0.16)
          );
          d.scale.setScalar(1 - lv * 0.18);
          d.updateMatrix();
          tree.setMatrixAt(k++, d.matrix);
        }
      }
    }
    tree.count = k;
  }
  gMembrane.add(tree);
  /* 膜下皮层微丝：波浪拱管托住双层（血影蛋白网示意，4 根烘焙合并） */
  const cortexMat = G(matGlow(PAL.actin, 0.3, { color: 0xc4608e, roughness: 0.5 }), 0.3, 1.4);
  {
    const cortexParts = [];
    for (let i = 0; i < 4; i++) {
      const pts = [];
      const y0 = -1.05;
      for (let k = 0; k <= 14; k++) {
        const t = k / 14;
        pts.push(new THREE.Vector3(-3.4 + t * 6.8, y0 + Math.sin(t * TAU * 2.4 + i * 1.3) * 0.12, (i - 1.5) * 0.85));
      }
      cortexParts.push(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 50, 0.03, 5), cortexMat));
    }
    gMembrane.add(mesh(bakeMerge(cortexParts), cortexMat));
  }
  /* 双层边缘封边：界缘处头-尾-头 U 形回折，InstancedMesh 半环 */
  const capMat = matStd(PAL.membrane, { roughness: 0.5 });
  const CAP_N = 10;
  const caps = new THREE.InstancedMesh(new THREE.TorusGeometry(0.31, 0.1, 8, 12, TAU / 2), capMat, CAP_N);
  {
    const d = new THREE.Object3D();
    for (let i = 0; i < CAP_N; i++) {
      const sgn = i % 2 ? 1 : -1;
      const x = -3.55 + Math.floor(i / 2) * 1.58;
      d.position.set(x, 0, sgn * 2.34);
      d.rotation.set(TAU / 4, 0, sgn > 0 ? 0 : TAU / 2);
      d.updateMatrix();
      caps.setMatrixAt(i, d.matrix);
    }
  }
  gMembrane.add(caps);
  /* 脂筏：胆固醇与鞘脂富集的秩序化小区（亮色圆台 + 紧排小柱阵列），随膜慢漂 */
  const raft = new THREE.Group();
  const raftMat = matCoat(PAL.membraneHi, { roughness: 0.28, clearcoatRoughness: 0.15, emissive: 0x5a3c1a, emissiveIntensity: 0.3 });
  const raftBase = mesh(new THREE.CylinderGeometry(0.52, 0.58, 0.88, 22, 1, true), raftMat);
  raftBase.position.y = 0;
  raft.add(raftBase);
  const raftPack = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 6), matStd(0xf7e3b8, { roughness: 0.3 }), 12);
  {
    const d = new THREE.Object3D();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const rr = 0.16 + (i % 3) * 0.12;
      d.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr);
      d.updateMatrix();
      raftPack.setMatrixAt(i, d.matrix);
    }
  }
  raft.add(raftPack);
  raft.position.set(0.2, 0, -0.6);
  gMembrane.add(raft);
  fluid.raft = raft;
}

function tickMembrane(dt) {
  fluid.t += dt;
  /* 胆固醇对流动性的阻尼：含量越高，磷脂侧向漂移幅度越小（流动性下降） */
  const damp = 1 - fluid.chol * 0.62;
  const drift = dt * 0.09 * fluid.speed * damp;
  /* 翻转酶演示：每隔几秒挑 1 颗磷脂做膜内外层翻滚（flip-flop，需酶协助所以慢） */
  if (fluid.flipOn && fluid.t - (fluid.lastFlip || 0) > 3.2) {
    fluid.lastFlip = fluid.t;
    const lucky = lipState[Math.floor(Math.random() * lipState.length)];
    lucky.flipFrom = lucky.layer;
    lucky.flipT = 0;
  }
  lipState.forEach((l, k) => {
    l.phase += drift * l.speed;
    let yLayer = l.layer;
    if (l.flipT !== undefined && l.flipT < 1) {
      l.flipT += dt * 0.6;
      const kk = Math.min(1, l.flipT);
      yLayer = l.flipFrom * (1 - kk) + (-l.flipFrom) * kk;
      if (kk >= 1) { l.layer = -l.flipFrom; l.flipT = undefined; }
    }
    _dummy.position.set(
      l.x + Math.cos(l.phase) * 0.08 * damp,
      yLayer * 0.42 + (fluid.wave ? Math.sin(l.x * 1.2 + fluid.t * 1.6) * 0.07 : 0),
      l.z + Math.sin(l.phase) * 0.08 * damp
    );
    _dummy.rotation.set(0, 0, 0);
    _dummy.updateMatrix();
    headMesh.setMatrixAt(k, _dummy.matrix);
    _dummy.position.y += -yLayer * 0.3;
    _dummy.updateMatrix();
    tailMesh.setMatrixAt(k, _dummy.matrix);
  });
  headMesh.instanceMatrix.needsUpdate = true;
  tailMesh.instanceMatrix.needsUpdate = true;
  proteins.forEach((p) => {
    p.phase += drift * p.speed * 0.6;
    p.g.position.x = p.x + Math.cos(p.phase) * 0.14 * damp;
    p.g.position.z = p.z + Math.sin(p.phase) * 0.14 * damp;
  });
  /* 胆固醇小体：随磷脂轻漂 + 按含量显隐（前 half 显示） */
  fluid.cholState.forEach((c, i) => {
    c.ph += drift * c.sp * 0.5;
    _dummy.position.set(c.x + Math.cos(c.ph) * 0.05 * damp, c.layer * 0.18 + (fluid.wave ? Math.sin(c.x * 1.2 + fluid.t * 1.6) * 0.05 : 0), c.z + Math.sin(c.ph) * 0.05 * damp);
    _dummy.rotation.set(0, 0, 0);
    _dummy.updateMatrix();
    fluid.cholMesh.setMatrixAt(i, _dummy.matrix);
  });
  fluid.cholMesh.instanceMatrix.needsUpdate = true;
  fluid.cholMesh.count = Math.round(fluid.cholState.length * (0.15 + fluid.chol * 0.85));
  /* 脂筏整体慢漂 + 呼吸缩放 */
  if (fluid.raft) {
    fluid.raft.position.x = 0.2 + Math.sin(fluid.t * 0.3) * 0.4;
    fluid.raft.position.z = -0.6 + Math.cos(fluid.t * 0.22) * 0.3;
    fluid.raft.scale.setScalar(1 + Math.sin(fluid.t * 1.1) * 0.04);
  }
}

/* ================= 章节 6：物质进出细胞 ================= */

const gTransport = new THREE.Group();
gTransport.visible = false;
scene.add(gTransport);

{
  /* 膜剖面：双层磷脂板（头排亮 / 尾层暗） */
  const slabTail = mesh(new THREE.BoxGeometry(7.2, 0.34, 2.2), matStd(PAL.membrane, { roughness: 0.58 }));
  gTransport.add(slabTail);
  const slabHead = mesh(new THREE.BoxGeometry(7.2, 0.1, 2.2), matCoat(PAL.membraneHi, { roughness: 0.4, clearcoatRoughness: 0.2, emissive: 0x40230e, emissiveIntensity: 0.35 }));
  slabHead.position.y = 0.22;
  const slabHead2 = slabHead.clone();
  slabHead2.position.y = -0.22;
  gTransport.add(slabHead, slabHead2);
  const hm = matStd(PAL.membraneHi, { roughness: 0.45 });
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 10, 8), hm, 36);
  {
    const d = new THREE.Object3D();
    let hi = 0;
    for (let i = 0; i < 18; i++) {
      for (const hy of [0.32, -0.32]) {
        d.position.set(-3.4 + i * 0.4, hy, 0);
        d.updateMatrix();
        heads.setMatrixAt(hi++, d.matrix);
      }
    }
  }
  gTransport.add(heads);
}
const channelT = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.9, 16, 1, true), ghostify(matCoat(PAL.rer, { roughness: 0.32, opacity: 0.8 }), 0.8));
channelT.position.set(-1.6, 0, 0);
/* 通道蛋白门控内芯：六瓣选通栅（facil 模式开门时旋开） */
const gateMat = ghostify(matCoat(PAL.ser, { roughness: 0.35, opacity: 0.75 }), 0.75);
const gate = new THREE.Group();
{
  const petalGeo = new THREE.BoxGeometry(0.09, 0.86, 0.16);
  const petal = new THREE.InstancedMesh(petalGeo, gateMat, 6);
  const d = new THREE.Object3D();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    d.position.set(Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19);
    d.rotation.set(0, -a, 0);
    d.updateMatrix();
    petal.setMatrixAt(i, d.matrix);
  }
  gate.add(petal);
}
gate.position.set(-1.6, 0, 0);
channelT.add(gate);

/* 载体泵：变截面放样的跨膜泵体（宽底座 → 束腰 → 顶部结合盖），非素盒 */
const pumpB = new THREE.Group();
{
  const pumpMat = matCoat(PAL.lysosome, { roughness: 0.38, clearcoatRoughness: 0.24, emissive: 0x4a1028, emissiveIntensity: 0.35 });
  const spine = [
    new THREE.Vector3(0, -0.52, 0),
    new THREE.Vector3(0, -0.28, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.3, 0),
    new THREE.Vector3(0, 0.44, 0),
  ];
  const pumpGeo = loftSkin(spine, (t) => {
    const w = 0.30 - Math.sin(t * Math.PI) * 0.10;         /* 底宽顶窄、中部束腰 */
    const d = 0.26 - Math.sin(t * Math.PI) * 0.06;
    return [
      [-w, -d], [w, -d], [w * 1.1, 0], [w, d], [-w, d], [-w * 1.1, 0],
    ];
  }, { segsT: 16 });
  pumpB.add(mesh(pumpGeo, pumpMat));
  /* 结合盖：泵顶的铰链盖板（主动运输时翻起） */
  const lidMat = matStd(PAL.granule, { roughness: 0.35, metalness: 0.1 });
  const pumpLid = mesh(new THREE.BoxGeometry(0.34, 0.07, 0.3), lidMat);
  pumpLid.position.set(0, 0.51, 0);
  pumpB.add(pumpLid);
  pumpB.userData.lid = pumpLid;
  /* 泵身装饰箍：显示跨膜段位置 */
  const hoopMat = matStd(PAL.brass, { roughness: 0.4, metalness: 0.5 });
  for (const hy of [-0.2, 0.2]) {
    const hoop = mesh(new THREE.TorusGeometry(0.24, 0.02, 6, 18), hoopMat);
    hoop.rotation.x = TAU / 4;
    hoop.position.y = hy;
    pumpB.add(hoop);
  }
}
pumpB.position.set(1.7, 0, 0);
gTransport.add(channelT, pumpB);

/* ATP → ADP + Pi 分子模型：腺苷圆珠 + 磷酸基链，水解释放的 Pi 可飞走 */
const atpGroup = new THREE.Group();
atpGroup.position.set(1.7, 0.62, 0);
atpGroup.visible = false;
{
  const adenosineMat = matStd(PAL.vesicle, { roughness: 0.4, emissive: 0x6a4a12, emissiveIntensity: 0.2 });
  const phosphateMat = matStd(0xffd166, { roughness: 0.3, emissive: 0x8a6a10, emissiveIntensity: 0.45 });
  const bondMat = matStd(0xd8d2c4, { roughness: 0.5 });
  const bead = (r, mat, x) => {
    const s = mesh(new THREE.SphereGeometry(r, 12, 9), mat);
    s.position.x = x;
    atpGroup.add(s);
    return s;
  };
  bead(0.085, adenosineMat, 0);           /* 腺苷 */
  bead(0.06, phosphateMat, 0.14);         /* α 磷酸 */
  bead(0.06, phosphateMat, 0.27);         /* β 磷酸 */
  const piBead = bead(0.06, phosphateMat, 0.4);   /* γ 磷酸（Pi） */
  for (const [x1, x2] of [[0.06, 0.1], [0.19, 0.22], [0.32, 0.35]]) {
    const bond = mesh(new THREE.CylinderGeometry(0.014, 0.014, x2 - x1, 6), bondMat);
    bond.rotation.z = TAU / 4;
    bond.position.x = (x1 + x2) / 2;
    atpGroup.add(bond);
  }
  atpGroup.userData.pi = piBead;
}
gTransport.add(atpGroup);
const piFly = { m: null, active: false, t: 0 };
{
  const piMat = G(matStd(0xffe08a, { roughness: 0.3, emissive: 0x9a7a18, emissiveIntensity: 0.6 }), 0.6, 1.8);
  piFly.m = mesh(new THREE.SphereGeometry(0.055, 10, 8), piMat);
  piFly.m.visible = false;
  gTransport.add(piFly.m);
}

/* 浓度梯度背景：上下两块渐变板（上浓下淡各留白），直观呈现"高/低浓度侧" */
function makeGradPlaneTexture(flip) {
  const cv = document.createElement('canvas');
  cv.width = 8; cv.height = 128;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, flip ? 128 : 0, 0, flip ? 0 : 128);
  g.addColorStop(0, 'rgba(110,170,230,0.9)');
  g.addColorStop(1, 'rgba(110,170,230,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 8, 128);
  return new THREE.CanvasTexture(cv);
}
const gradHigh = mesh(new THREE.PlaneGeometry(8.2, 2.4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, map: makeGradPlaneTexture(false) }));
gradHigh.position.set(0, 3.6, -0.6);
const gradLow = mesh(new THREE.PlaneGeometry(8.2, 2.4), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, map: makeGradPlaneTexture(true) }));
gradLow.position.set(0, -3.6, -0.6);
gTransport.add(gradHigh, gradLow);
const chLbl = label('通道蛋白', '#b0ccff', 0.0042);
chLbl.position.set(-1.6, 0.9, 0);
const pumpLbl = label('载体蛋白（泵）', '#f2a8c4', 0.0042);
pumpLbl.position.set(1.7, 0.9, 0);
const atpLbl = label('ATP → ADP＋Pi', '#ffd166', 0.0042);
atpLbl.position.set(2.6, 1.5, 0);
atpLbl.visible = false;
const concHigh = label('高浓度（上）', '#a8e4ff', 0.0044);
concHigh.position.set(3.55, 2.3, 0);
const concLow = label('低浓度（下）', '#b9c8dd', 0.0044);
concLow.position.set(3.55, -2.3, 0);
const concArrow = label('顺浓度梯度 ↓', '#a8e4ff', 0.004);
concArrow.position.set(3.55, 0, 0);
gTransport.add(chLbl, pumpLbl, atpLbl, concHigh, concLow, concArrow);

const atpSpark = new THREE.Sprite(new THREE.SpriteMaterial({
  map: (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const cx = cv.getContext('2d');
    const g = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,214,120,1)'); g.addColorStop(1, 'rgba(255,214,120,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })(),
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0,
}));
atpSpark.position.set(1.7, 0.75, 0);
atpSpark.scale.set(0.9, 0.9, 1);
gTransport.add(atpSpark);

const tParts = [];
{
  const pm1 = G(matGlow(0x8adfff, 0.9, { color: 0x4aa8c8 }), 0.9, 2.2);
  const pm2 = G(matGlow(0x9ae89a, 0.9, { color: 0x4a9a4a }), 0.9, 2.2);
  for (let i = 0; i < 22; i++) {
    const m = mesh(new THREE.SphereGeometry(0.09, 10, 8), i % 2 ? pm1 : pm2);
    m.visible = false;
    gTransport.add(m);
    tParts.push({ m, t: 0, active: false, lane: 0, delay: Math.random() * 3 });
  }
}
const endoVes = mesh(new THREE.SphereGeometry(0.42, 18, 14), ghostify(matCoat(PAL.membraneHi, { roughness: 0.35, opacity: 0.5 }), 0.5));
endoVes.visible = false;
/* 胞吞囊泡内部货物：三颗被吞入的大分子 + 外侧笼形蛋白包被（网格有孔小突起） */
{
  const cargoMat = G(matGlow(PAL.ribosome, 0.5, { color: 0xd8c078, roughness: 0.4 }), 0.5, 1.8);
  for (const [cx, cy, cz] of [[-0.1, 0.05, 0.08], [0.1, -0.08, -0.05], [0.02, 0.12, -0.1]]) {
    const g = mesh(new THREE.SphereGeometry(0.075, 10, 8), cargoMat);
    g.position.set(cx, cy, cz);
    endoVes.add(g);
  }
  const clathMat = matStd(PAL.membraneDeep, { roughness: 0.45 });
  const clath = new THREE.InstancedMesh(new THREE.ConeGeometry(0.045, 0.09, 5), clathMat, 22);
  const cd = new THREE.Object3D();
  for (let i = 0; i < 22; i++) {
    const a = (i * 2.399963) % TAU;
    const y = 1 - (2 * (i + 0.5)) / 22;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const radial = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    cd.position.copy(radial).multiplyScalar(0.44);
    cd.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), radial);
    cd.updateMatrix();
    clath.setMatrixAt(i, cd.matrix);
  }
  endoVes.add(clath);
}
gTransport.add(endoVes);

const trans = { mode: 'free', rate: 1, acc: 0, sparkT: 0, flip: false, t: 0, flux: 0 };

function spawnT(lane) {
  const p = tParts.find((x) => !x.active);
  if (!p) return;
  p.active = true; p.t = 0; p.lane = lane;
  p.m.visible = true;
  p.m.position.set((Math.random() - 0.5) * 4.6, lane >= 0 ? 2.6 : -2.6, (Math.random() - 0.5) * 1.2);
}

function tickTransport(dt) {
  trans.t += dt;
  trans.acc += dt * trans.rate * 0.9;
  if (trans.acc >= 1) {
    trans.acc = 0;
    const m = trans.mode;
    if (m === 'free') spawnT(1);
    else if (m === 'facil') spawnT(1);
    else if (m === 'active') spawnT(-1);
    else if (m === 'endo') spawnT(1);
  }
  trans.sparkT = Math.max(0, trans.sparkT - dt * 2);
  atpSpark.material.opacity = trans.sparkT;
  atpSpark.scale.setScalar(0.5 + trans.sparkT * 0.9);
  /* 门控：协助扩散时六瓣选通栅旋开，其余状态闭合 */
  const gateTarget = trans.mode === 'facil' ? 1.15 : 0;
  gate.rotation.y += (gateTarget - gate.rotation.y) * Math.min(1, dt * 6);
  /* 泵盖：主动运输时结合盖反复翻起（结合→释放） */
  const lidTarget = trans.mode === 'active' ? -0.85 + Math.sin(trans.t * 4) * 0.25 : 0;
  pumpB.userData.lid.rotation.z += (lidTarget - pumpB.userData.lid.rotation.z) * Math.min(1, dt * 5);
  atpGroup.visible = trans.mode === 'active';
  if (atpGroup.visible) atpGroup.rotation.y = Math.sin(trans.t * 2.2) * 0.3;
  /* γ 磷酸（Pi）水解脱落：抛物线飞离 + 轻微脉动 */
  if (piFly.active) {
    piFly.t += dt * 1.5;
    piFly.m.position.set(1.7 + piFly.t * 0.55, 0.66 + piFly.t * 1.05, Math.sin(piFly.t * 5) * 0.12);
    piFly.m.scale.setScalar(1 + Math.sin(Math.min(piFly.t, 1) * Math.PI) * 0.5);
    if (piFly.t > 1.3) { piFly.active = false; piFly.m.visible = false; }
  }
  tParts.forEach((p) => {
    if (!p.active) return;
    p.t += dt * (0.5 + trans.rate * 0.25);
    const m = trans.mode;
    let done = false;
    if (m === 'free') {
      p.m.position.y -= dt * 1.1;
      if (p.m.position.y < -2.6) done = true;
    } else if (m === 'facil') {
      const k = p.t;
      if (k < 0.35) p.m.position.y -= dt * 1.0;
      else if (k < 0.62) {
        p.m.position.x += ((-1.6 - p.m.position.x)) * dt * 5;
        p.m.position.y -= dt * 0.9;
      } else p.m.position.y -= dt * 1.2;
      if (p.m.position.y < -2.6) done = true;
    } else if (m === 'active') {
      const k = p.t;
      if (k < 0.5) {
        p.m.position.x += (1.7 - p.m.position.x) * dt * 3.5;
        if (k > 0.3 && !p.sparked) {
          p.sparked = true;
          trans.sparkT = 1;
          /* 结合 ATP 被水解：γ 磷酸飞离 */
          if (!piFly.active) { piFly.active = true; piFly.t = 0; piFly.m.visible = true; piFly.m.position.set(1.78, 0.68, 0); }
        }
      } else {
        p.m.position.y += dt * 1.25;
        if (p.m.position.y > 2.6) done = true;
      }
    } else {
      const k = p.t;
      if (k < 0.4) p.m.position.y -= dt * 0.8;
      else if (k < 0.45) { endoVes.visible = true; endoVes.position.copy(p.m.position); p.m.visible = false; }
      else if (k < 0.9) { endoVes.position.y -= dt * 0.85; }
      else { endoVes.visible = false; done = true; }
    }
    if (done && p.active) { p.active = false; trans.flux++; }
    if (trans.mode !== 'active') p.sparked = false;
    p.m.visible = p.active;
  });
}

/* ================= 章节 7：分泌蛋白旅程 ================= */

const gSecret = new THREE.Group();
gSecret.visible = false;
scene.add(gSecret);

const secStations = [
  { name: '① 核糖体（合成肽链）', pos: [-3.5, 0.9, 0], info: '游离…不，附着在内质网上的核糖体，按 mRNA 指令把氨基酸连成肽链。' },
  { name: '② 内质网（加工折叠）', pos: [-1.7, 1.2, 0], info: '肽链进入内质网腔，进行折叠、组装、加上糖链，成为较成熟的蛋白质。' },
  { name: '③ 囊泡（运输）', pos: [-0.2, 1.5, 0], info: '内质网“出芽”形成囊泡，包裹蛋白质运往高尔基体。' },
  { name: '④ 高尔基体（包装派发）', pos: [1.4, 1.4, 0], info: '进一步加工分类，包装进分泌囊泡，运向细胞膜。' },
  { name: '⑤ 细胞膜（胞吐释放）', pos: [3.3, 1.0, 0], info: '囊泡与细胞膜融合，把蛋白质分泌到细胞外（如消化酶、抗体、部分激素）。' },
];
{
  /* 内质网：弯管 */
  const erTubeMat = ghostify(matCoat(PAL.rer, { roughness: 0.34, opacity: 0.85 }), 0.85);
  const erPts = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    erPts.push(new THREE.Vector3(secStations[1].pos[0] + Math.cos(t * TAU * 1.2) * 0.75, secStations[1].pos[1] - 0.35 + Math.sin(t * TAU * 2) * 0.2, Math.sin(t * TAU * 1.2) * 0.35));
  }
  gSecret.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(erPts), 90, 0.13, 8), erTubeMat));
  /* 高尔基体：扁囊堆 */
  const gg = new THREE.Group();
  gg.position.set(...secStations[3].pos);
  gg.position.y -= 0.35;
  const sacMat = ghostify(matCoat(PAL.golgi, { roughness: 0.34, opacity: 0.9 }), 0.9);
  for (let i = 0; i < 4; i++) {
    const sac = mesh(new THREE.SphereGeometry(0.44, 20, 12), sacMat);
    sac.scale.set(0.95 - i * 0.07, 0.12, 0.5 - i * 0.04);
    sac.position.y = (i - 1.5) * 0.16;
    gg.add(sac);
  }
  gSecret.add(gg);
  /* 细胞膜：竖直膜板 + 膜外受体 Y 形对（分泌物的着陆点） */
  const memSlab = mesh(new THREE.CapsuleGeometry(2.1, 2.6, 6, 20), ghostify(matCoat(PAL.membrane, { roughness: 0.4, opacity: 0.4 }), 0.4));
  memSlab.scale.set(0.22, 1, 1);
  memSlab.position.set(4.35, -0.35, 0);
  gSecret.add(memSlab);
  const recMat = G(matStd(PAL.membraneHi, { roughness: 0.35, emissive: 0x6a4020, emissiveIntensity: 0.3 }), 0.3, 1.3);
  for (const ry of [0.35, -0.75]) {
    const rec = new THREE.Group();
    const armA = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6), recMat);
    armA.rotation.z = 0.5;
    armA.position.set(0.4, 0.05, 0);
    const armB = armA.clone();
    armB.rotation.z = -0.5;
    armB.position.set(0.4, 0.05, 0);
    armB.position.x = 0.47;
    const stalk = mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.2, 8), recMat);
    stalk.position.set(0.44, -0.1, 0);
    rec.add(armA, armB, stalk);
    rec.position.set(0, ry, 0);
    gSecret.add(rec);
  }
  /* 线粒体供能 */
  const mito = makeMitochondrion(0.65);
  mito.position.set(1.4, -1.3, 0);
  gSecret.add(mito);
  const mitoLbl = label('线粒体供能', '#f0935e', 0.0038);
  gSecret.add(mitoLbl);
  mitoLbl.position.set(1.4, -2.0, 0);
  /* 站点标记 */
  secStations.forEach((s) => {
    const lb = label(s.name, '#eef3fa', 0.004);
    lb.position.set(s.pos[0], s.pos[1] + 0.75, s.pos[2]);
    gSecret.add(lb);
    const dot = mesh(new THREE.SphereGeometry(0.09, 10, 8), G(matGlow(0xe8ecf6, 0.4, { color: 0x9aa8bc, roughness: 0.4 }), 0.4, 1.8));
    dot.position.set(s.pos[0], s.pos[1], s.pos[2]);
    gSecret.add(dot);
    s.lbl = lb;
  });
  /* ER 出芽颈：②站 ER 管上的出芽收口 + 半脱离的过渡囊泡（与 ER 管同材质烘焙合并） */
  const neckMat = erTubeMat;
  const neck = mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.18, 10, 1, true), neckMat);
  neck.rotation.z = 0.9;
  neck.position.set(secStations[2].pos[0] - 0.55, secStations[2].pos[1] - 0.1, 0);
  const halfVes = mesh(new THREE.SphereGeometry(0.13, 14, 10, 0, TAU, 0, Math.PI * 0.62), neckMat);
  halfVes.position.set(secStations[2].pos[0] - 0.78, secStations[2].pos[1] - 0.2, 0);
  halfVes.rotation.z = -1.1;
  gSecret.add(mesh(bakeMerge([neck, halfVes]), neckMat));
}
const secDots = [];
{
  const cargoMat = G(matGlow(PAL.vesicle, 0.7, { color: 0xe8b050, roughness: 0.35 }), 0.7, 2.6);
  const shellMat = ghostify(matCoat(PAL.vesicle, { roughness: 0.3, opacity: 0.42, clearcoatRoughness: 0.18 }), 0.42);
  for (let i = 0; i < 3; i++) {
    const d = mesh(new THREE.SphereGeometry(0.14, 12, 10), cargoMat);
    d.visible = false;
    /* 囊泡膜壳：半透明包膜 + 内部一团蛋白绳结（TorusKnot 示折叠好的球蛋白） */
    const shell = mesh(new THREE.SphereGeometry(0.2, 16, 12), shellMat);
    d.add(shell);
    const cargo = mesh(new THREE.TorusKnotGeometry(0.09, 0.03, 48, 6), G(matGlow(PAL.stroma, 0.4, { color: 0x8ab86a, roughness: 0.45 }), 0.4, 1.5));
    cargo.scale.setScalar(0.75);
    cargo.rotation.set(0.6, 0.4, 0);
    d.add(cargo);
    gSecret.add(d);
    secDots.push({ m: d, t: -i * 1.4, active: false, cargo });
  }
}
const secret = { playing: true, speed: 1, cur: -1, delivered: 0 };

/* --- 分泌起点深改：mRNA 密码子链 + 双亚基核糖体 + 肽链生长（drawRange 逐段揭示） --- */
const transUnit = { t: 0, chain: null, chainTotal: 0, ribo: null, mrna: null };
{
  const st0 = secStations[0];
  /* mRNA：波浪串珠链 + 密码子刻度环 */
  const mrnaPts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    mrnaPts.push(new THREE.Vector3(st0.pos[0] - 1.1 + t * 2.2, st0.pos[1] - 0.55 + Math.sin(t * TAU * 1.6) * 0.1, st0.pos[2] + Math.cos(t * TAU) * 0.14));
  }
  const mrnaCurve = new THREE.CatmullRomCurve3(mrnaPts);
  const mrnaMat = G(matStd(PAL.dna, { roughness: 0.45, emissive: 0x6a4a9a, emissiveIntensity: 0.4 }), 0.4, 1.4);
  transUnit.mrna = mesh(new THREE.TubeGeometry(mrnaCurve, 64, 0.028, 5), mrnaMat);
  gSecret.add(transUnit.mrna);
  /* 5' 端帽小球 + 3' polyA 尾珠串：mRNA 两端的标志结构 */
  const capMat = G(matGlow(0xf2e2a0, 0.4, { color: 0xd8c088, roughness: 0.35 }), 0.4, 1.5);
  const capDot = mesh(new THREE.SphereGeometry(0.05, 10, 8), capMat);
  capDot.position.copy(mrnaCurve.getPoint(0));
  gSecret.add(capDot);
  const polyTail = new THREE.InstancedMesh(new THREE.SphereGeometry(0.032, 8, 6), capMat, 6);
  {
    const d = new THREE.Object3D();
    for (let i = 0; i < 6; i++) {
      d.position.copy(mrnaCurve.getPoint(1 - (i + 1) * 0.012));
      d.updateMatrix();
      polyTail.setMatrixAt(i, d.matrix);
    }
  }
  gSecret.add(polyTail);
  const codonMat = matStd(0xd8c8ff, { roughness: 0.4 });
  const codons = new THREE.InstancedMesh(new THREE.TorusGeometry(0.045, 0.012, 5, 10), codonMat, 8);
  {
    const d = new THREE.Object3D();
    for (let i = 0; i < 8; i++) {
      d.position.copy(mrnaCurve.getPoint(0.25 + i * 0.07));
      d.rotation.set(TAU / 4, 0, Math.random() * 0.8);
      d.updateMatrix();
      codons.setMatrixAt(i, d.matrix);
    }
  }
  gSecret.add(codons);
  /* 核糖体：大小两个亚基团块（上小下大），骑在 mRNA 上往返 */
  const riboMat = matCoat(PAL.ribosome, { roughness: 0.4, clearcoatRoughness: 0.25, emissive: 0x6a5c2a, emissiveIntensity: 0.25 });
  const ribo = new THREE.Group();
  const bigSub = mesh(new THREE.SphereGeometry(0.16, 14, 10), riboMat);
  bigSub.scale.set(1.25, 0.8, 1);
  const smallSub = mesh(new THREE.SphereGeometry(0.11, 12, 9), riboMat);
  smallSub.scale.set(1, 0.72, 0.9);
  smallSub.position.y = 0.19;
  ribo.add(bigSub, smallSub);
  gSecret.add(ribo);
  transUnit.ribo = ribo;
  transUnit.mrnaCurve = mrnaCurve;
  /* 多肽出口隧道：核糖体大亚基背面伸出的短管，新生肽链从隧道钻出 */
  const exitTunnel = mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.12, 10, 1, true), riboMat);
  exitTunnel.position.set(0, 0.05, 0.14);
  exitTunnel.rotation.x = 0.9;
  ribo.add(exitTunnel);
  /* 新生肽链：一条折线管（含自发夹角折叠），drawRange 从 0 生长 */
  const chainPts = [];
  let cp = new THREE.Vector3(st0.pos[0], st0.pos[1] - 0.62, st0.pos[2]);
  for (let i = 0; i < 26; i++) {
    chainPts.push(cp.clone());
    cp = cp.clone().add(new THREE.Vector3(
      Math.sin(i * 1.7) * 0.1,
      -0.055 - Math.sin(i * 2.3) * 0.02,
      Math.cos(i * 1.3) * 0.08
    ));
  }
  const chainCurve = new THREE.CatmullRomCurve3(chainPts);
  const chainGeo = new THREE.TubeGeometry(chainCurve, 120, 0.035, 5);
  const chainMat = G(matGlow(PAL.stroma, 0.4, { color: 0x8ab86a, roughness: 0.45 }), 0.4, 1.5);
  transUnit.chain = mesh(chainGeo, chainMat);
  transUnit.chainTotal = 120;
  chainGeo.setDrawRange(0, 0);
  gSecret.add(transUnit.chain);
  transUnit.tick = (dt) => {
    if (!secret.playing) return;
    transUnit.t += dt * secret.speed * 0.11;
    const cyc = transUnit.t % 1;
    /* 核糖体沿 mRNA 往返滑行（0→1→0） */
    const along = cyc < 0.5 ? cyc * 2 : (1 - cyc) * 2;
    const rp = transUnit.mrnaCurve.getPoint(0.15 + along * 0.7);
    transUnit.ribo.position.set(rp.x, rp.y + 0.16, rp.z);
    /* 肽链长度随核糖体进程呼吸式生长/重置 */
    const grow = Math.floor(along * transUnit.chainTotal);
    transUnit.chain.geometry.setDrawRange(0, grow);
    transUnit.ribo.rotation.y = Math.sin(transUnit.t * 4) * 0.15;
  };
}
/* 站点光环：细环标记可点击站点，脉冲呼吸 */
const stationRings = new THREE.InstancedMesh(new THREE.TorusGeometry(0.2, 0.012, 5, 20), G(matStd(PAL.brass, { roughness: 0.35, metalness: 0.5, emissive: 0x6a5012, emissiveIntensity: 0.4 }), 0.4, 1.4), secStations.length);
{
  const d = new THREE.Object3D();
  secStations.forEach((s, i) => {
    d.position.set(s.pos[0], s.pos[1], s.pos[2]);
    d.rotation.set(TAU / 4, 0, 0);
    d.updateMatrix();
    stationRings.setMatrixAt(i, d.matrix);
  });
}
gSecret.add(stationRings);
/* 胞吐特效：终点站膜外的释放光晕 + 四散小蛋白（颗粒到达第 5 站时触发一轮） */
const exoBurst = [];
{
  const exoMat = G(new THREE.SpriteMaterial({ map: glowDotTex, color: 0xffd9a8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }), 0, 2.0, { illusO: 0, fluorO: 0.9 });
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Sprite(exoMat.clone());
    s.scale.setScalar(0.1);
    s.visible = false;
    gSecret.add(s);
    exoBurst.push({ m: s, ph: i / 5, active: false, t: 0 });
  }
}
const exoFlash = mesh(new THREE.SphereGeometry(0.3, 14, 10), ghostify(matGlow(PAL.membraneHi, 0.6, { color: 0xe8c890, roughness: 0.3, transparent: true, opacity: 0 }), 0.3));
exoFlash.material.transparent = true;
exoFlash.material.opacity = 0;
exoFlash.visible = false;
const exoPoint = secStations[4].pos;
exoFlash.position.set(exoPoint[0], exoPoint[1] - 0.3, exoPoint[2]);
gSecret.add(exoFlash);
const exoState = { t: -1 };
function triggerExo() {
  exoState.t = 0;
  exoFlash.visible = true;
  exoBurst.forEach((b) => { b.active = true; b.t = 0; });
}
function tickExo(dt) {
  if (exoState.t < 0) return;
  exoState.t += dt * 1.4;
  const k = exoState.t;
  /* 膜融合光晕：胀大后淡出 */
  exoFlash.scale.setScalar(0.4 + k * 1.6);
  exoFlash.material.opacity = Math.max(0, 0.55 - k * 0.6);
  if (k > 1.2) { exoState.t = -1; exoFlash.visible = false; }
  /* 释放的小蛋白：向外飞散并缩小 */
  exoBurst.forEach((b, i) => {
    if (!b.active) return;
    b.t += dt * 0.9;
    const a = (i / exoBurst.length) * TAU + 0.6;
    const s = b.t;
    b.m.visible = s < 1.1;
    b.m.position.set(exoPoint[0] + Math.cos(a) * s * 0.9, exoPoint[1] - 0.3 - s * s * 0.2, exoPoint[2] + Math.sin(a) * s * 0.7);
    b.m.material.opacity = Math.max(0, 0.85 - s * 0.8);
    b.m.scale.setScalar(Math.max(0.05, 0.22 - s * 0.1));
    if (s > 1.1) b.active = false;
  });
}

function tickSecret(dt) {
  if (!secret.playing) return;
  if (transUnit.tick) transUnit.tick(dt);
  tickExo(dt);
  /* 站点光环脉冲 */
  const ringScale = 1 + Math.sin(transUnit.t * 5) * 0.1;
  stationRings.scale.setScalar(ringScale);
  /* 已送达计数：任一颗粒过最后一站即记一次 */
  const T = secStations.length - 1;
  secDots.forEach((d) => {
    d.t += dt * secret.speed * 0.55;
    if (d.t > T + 0.6) {
      if (d.active) { secret.delivered++; triggerExo(); }
      d.t = -Math.random() * 2.5;
      d.active = false;
      d.m.visible = false;
    }
    if (d.t < 0) { d.m.visible = false; return; }
    d.m.visible = true;
    d.active = true;
    const seg = Math.min(Math.floor(d.t), T - 1);
    const k = clamp(d.t - seg, 0, 1);
    const a = new THREE.Vector3(...secStations[seg].pos);
    const b = new THREE.Vector3(...secStations[seg + 1].pos);
    d.m.position.lerpVectors(a, b, k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    d.m.position.y += Math.sin(k * Math.PI) * 0.25;
    /* 途中小尾迹：朝运动反方向拉长成短棒（零位移时跳过避免退化朝向） */
    const prevK = clamp(k - 0.08, 0, 1);
    const a2 = new THREE.Vector3(...secStations[seg].pos);
    const b2 = new THREE.Vector3(...secStations[seg + 1].pos);
    const tail = new THREE.Vector3().lerpVectors(a2, b2, prevK < 0.5 ? 2 * prevK * prevK : 1 - Math.pow(-2 * prevK + 2, 2) / 2);
    tail.y += Math.sin(prevK * Math.PI) * 0.25;
    const stretch = Math.min(tail.distanceTo(d.m.position) * 4, 1.6);
    if (stretch > 0.05) {
      d.m.lookAt(tail);
      d.m.scale.set(1, 1, 1 + stretch);
    } else {
      d.m.scale.set(1, 1, 1);
    }
  });
}

/* ================= 章节 8：细胞骨架·胞质环流 ================= */

const gSkello = new THREE.Group();
gSkello.visible = false;
scene.add(gSkello);

const mtubes = [];
{
  const center = new THREE.Vector3(0, 0.3, 0);
  const cs = mesh(new THREE.SphereGeometry(0.18, 14, 10), matCoat(PAL.centriole, { roughness: 0.35, metalness: 0.2 }));
  cs.position.copy(center);
  gSkello.add(cs);
  /* 微管：荧光管（12 根同材质烘焙合并为单绘制；曲线保留给马达蛋白走路） */
  const mtMat = G(matGlow(PAL.microtubule, 0.5, { color: 0x4a9ac4, roughness: 0.4 }), 0.5, 2.4);
  {
    const mtParts = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const dir = new THREE.Vector3(Math.cos(a), (Math.random() - 0.35) * 0.8, Math.sin(a)).normalize();
      const len = 2.0 + Math.random() * 1.2;
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        pts.push(center.clone().add(dir.clone().multiplyScalar(t * len)).add(new THREE.Vector3(0, 0, Math.sin(t * 6 + i) * 0.05)));
      }
      mtParts.push(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.045, 6), mtMat));
      mtubes.push({ pts, curve: new THREE.CatmullRomCurve3(pts) });
    }
    gSkello.add(mesh(bakeMerge(mtParts), mtMat));
  }
  /* 微丝 */
  const actinMat = G(matGlow(PAL.actin, 0.45, { color: 0xc4608e, roughness: 0.45 }), 0.45, 2.0);
  const actinCurves = [];
  {
    const actinParts = [];
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * TAU;
      const pts = [];
      for (let k = 0; k <= 16; k++) {
        const t = k / 16;
        pts.push(new THREE.Vector3(
          Math.cos(a) * (0.6 + t * 1.8) + Math.sin(t * 9) * 0.18,
          -0.9 + Math.sin(t * 7 + i * 2) * 0.35,
          Math.sin(a) * (0.6 + t * 1.8) * 0.7
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      actinCurves.push(curve);
      actinParts.push(mesh(new THREE.TubeGeometry(curve, 40, 0.025, 6), actinMat));
    }
    gSkello.add(mesh(bakeMerge(actinParts), actinMat));
  }
  /* 交联蛋白小结：把头三根微丝横向捆成束（成束蛋白） */
  const xlinkMat = G(matStd(PAL.actin, { roughness: 0.4, emissive: 0x8a3a60, emissiveIntensity: 0.3 }), 0.3, 1.2);
  for (let i = 0; i < 3; i++) {
    const c = actinCurves[i];
    for (const tt of [0.35, 0.7]) {
      const p = c.getPoint(tt);
      const tan = c.getTangent(tt);
      const xlink = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 6), xlinkMat);
      xlink.position.copy(p);
      xlink.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan.clone().normalize());
      gSkello.add(xlink);
    }
  }
}

const motor = new THREE.Group();
{
  const footMat = matCoat(PAL.actin, { roughness: 0.4 });
  const footL = mesh(new THREE.BoxGeometry(0.1, 0.06, 0.12), footMat);
  footL.position.set(-0.075, 0, 0);
  const footR = mesh(new THREE.BoxGeometry(0.1, 0.06, 0.12), footMat);
  footR.position.set(0.075, 0, 0);
  const body = mesh(new THREE.SphereGeometry(0.1, 12, 8), matGlow(PAL.granule, 0.4, { color: 0xd88aa8 }));
  body.position.y = 0.16;
  const cargo = mesh(new THREE.SphereGeometry(0.22, 14, 10), G(ghostify(matCoat(PAL.vacuole, { roughness: 0.3, opacity: 0.8 }), 0.8), 0.3, 1.6, { illusO: 0.8, fluorO: 0.6 }));
  cargo.position.y = 0.42;
  motor.add(footL, footR, body, cargo);
  motor.userData.footL = footL;
  motor.userData.footR = footR;
}
gSkello.add(motor);
const motorLbl = label('驱动蛋白（马达蛋白）“步行”运货', '#ffd9ec', 0.0038);
motorLbl.position.set(0, 1.5, 0);
gSkello.add(motorLbl);

const flowParts = [];
const flowDummy = new THREE.Object3D();
let flowMesh = null;
{
  const fm = G(matGlow(PAL.vacuole, 0.35, { color: 0x5aa0c8, roughness: 0.45 }), 0.35, 1.8);
  flowMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6), fm, 20);
  gSkello.add(flowMesh);
  for (let i = 0; i < 20; i++) {
    flowParts.push({ off: Math.random(), r: 1.4 + Math.random() * 0.7, y: (Math.random() - 0.5) * 1.4, tilt: Math.random() * 0.4 });
  }
}

const skel = { flowSpeed: 1, motorOn: true, motorT: 0, tubeMats: [], motorPath: mtubes[0].curve };

/* --- 骨架章节深改：微管条纹贴图 + γ-TuRC 成核环 + 反向动力蛋白 + 中间纤维辫索 --- */
{
  /* 微管条纹纹理：沿管面的原纤丝纵条（CanvasTexture 斜条 + RepeatWrapping） */
  const mtTex = (() => {
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    const c = cv.getContext('2d');
    c.fillStyle = '#3a88ad';
    c.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 13; i++) {
      c.fillStyle = i % 2 ? 'rgba(160,215,240,0.55)' : 'rgba(20,70,100,0.4)';
      c.fillRect(i * 5, 0, 2.4, 64);
    }
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 3);
    return t;
  })();
  const mtStripeMat = G(matStd(0xffffff, { roughness: 0.42, emissive: 0x1c4a66, emissiveIntensity: 0.35 }), 0.35, 1.9);
  mtStripeMat.map = mtTex;
  /* 再铺两根条纹微管（在 12 根素管之外补密度） */
  for (let i = 0; i < 2; i++) {
    const a = (i / 2) * TAU + 1.2;
    const dir = new THREE.Vector3(Math.cos(a), 0.25, Math.sin(a)).normalize();
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      pts.push(new THREE.Vector3(0, 0.3, 0).add(dir.clone().multiplyScalar(t * (2.4 + i * 0.5))).add(new THREE.Vector3(0, 0, Math.sin(t * 5 + i) * 0.06)));
    }
    gSkello.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, 0.05, 6), mtStripeMat));
  }
  /* γ-TuRC：中心体处的微管成核环（环 + 轮毂 + 辐条同材质烘焙合并） */
  const turcMat = G(matStd(PAL.centriole, { roughness: 0.35, metalness: 0.3, emissive: 0x5a6480, emissiveIntensity: 0.3 }), 0.3, 1.0);
  {
    const turcParts = [];
    const ring = mesh(new THREE.TorusGeometry(0.26, 0.03, 8, 20), turcMat);
    ring.rotation.x = 0.4;
    ring.position.set(0, 0.3, 0);
    turcParts.push(ring);
    const hub = mesh(new THREE.SphereGeometry(0.09, 12, 9), turcMat);
    hub.scale.set(1, 0.6, 1);
    hub.position.set(0, 0.3, 0);
    turcParts.push(hub);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      const spoke = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 5), turcMat);
      spoke.position.set(Math.cos(a) * 0.14, 0.32, Math.sin(a) * 0.14);
      spoke.rotation.z = Math.cos(a) * 1.3;
      spoke.rotation.x = -Math.sin(a) * 1.3;
      turcParts.push(spoke);
    }
    gSkello.add(mesh(bakeMerge(turcParts), turcMat));
  }
  /* 反向动力蛋白：沿另一根微管逆向行走（微管正端朝外，动力蛋白载货回中心体） */
  const dynein = new THREE.Group();
  const dyMat = matCoat(PAL.actin, { roughness: 0.42 });
  const dyFeet = mesh(new THREE.BoxGeometry(0.2, 0.05, 0.1), dyMat);
  const dyBody = mesh(new THREE.SphereGeometry(0.085, 12, 8), matGlow(PAL.granule, 0.35, { color: 0xd88aa8 }));
  dyBody.position.y = 0.13;
  const dyCargo = mesh(new THREE.SphereGeometry(0.16, 12, 9), G(ghostify(matCoat(PAL.lysosome, { roughness: 0.32, opacity: 0.8 }), 0.8), 0.3, 1.3, { illusO: 0.8, fluorO: 0.6 }));
  dyCargo.position.y = 0.34;
  dynein.add(dyFeet, dyBody, dyCargo);
  gSkello.add(dynein);
  skel.dynein = dynein;
  skel.dynT = 0.7;
  skel.dynPath = mtubes[2].curve;
  /* 中间纤维：三股绞辫索（角蛋白，韧性支架），6 股烘焙合并为单绘制 */
  const interMat = G(matStd(PAL.intermediate, { roughness: 0.55 }), 0.25, 0.9);
  {
    const interParts = [];
    for (let f = 0; f < 2; f++) {
      const pts = [];
      const y0 = -0.6 - f * 0.5;
      const a0 = f * 2.1;
      for (let k = 0; k <= 24; k++) {
        const t = k / 24;
        pts.push(new THREE.Vector3(
          -1.8 + t * 3.8,
          y0 + Math.sin(t * 6 + f) * 0.22,
          Math.sin(t * TAU * 3 + a0) * 0.12
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      /* 三股：沿主曲线取点后按相位横向偏移成辫 */
      for (let s = 0; s < 3; s++) {
        const strand = [];
        for (let k = 0; k <= 40; k++) {
          const t = k / 40;
          const p = curve.getPoint(t);
          const tan = curve.getTangent(t);
          const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
          const wob = Math.sin(t * TAU * 7 + s * 2.09);
          strand.push(p.clone().add(side.multiplyScalar(wob * 0.045)).add(new THREE.Vector3(0, wob * 0.02, 0)));
        }
        interParts.push(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strand), 60, 0.02, 4), interMat));
      }
    }
    gSkello.add(mesh(bakeMerge(interParts), interMat));
  }
  /* 微管正端帽：4 根微管末端挂发光小珠（+ 端合成/解聚动态端） */
  const tipMat = G(new THREE.SpriteMaterial({ map: glowDotTex, color: 0x8ee6ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }), 0.8, 2.2, { illusO: 0.8, fluorO: 1.0 });
  [0, 1, 5, 9].forEach((ti) => {
    const cur = mtubes[ti].curve;
    const s = new THREE.Sprite(tipMat.clone());
    s.scale.setScalar(0.16);
    s.position.copy(cur.getPoint(1));
    gSkello.add(s);
  });
  /* 货物交接站：小平台 + 3 件待运货物（各自同材质烘焙合并） */
  const dock = new THREE.Group();
  dock.position.set(1.6, -1.15, 0.4);
  const dockMat = matStd(PAL.membraneDeep, { roughness: 0.5 });
  {
    const dockParts = [mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.1, 18), dockMat)];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + 0.5;
      const leg = mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.28, 8), dockMat);
      leg.position.set(Math.cos(a) * 0.3, -0.18, Math.sin(a) * 0.3);
      dockParts.push(leg);
    }
    dock.add(mesh(bakeMerge(dockParts), dockMat));
  }
  const goodsMat = G(matGlow(PAL.granule, 0.3, { color: 0xd88aa8, roughness: 0.45 }), 0.3, 1.2);
  {
    const goodParts = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU;
      const good = mesh(new THREE.SphereGeometry(0.1, 10, 8), goodsMat);
      good.scale.set(1.2, 0.85, 1);
      good.position.set(Math.cos(a) * 0.2, 0.14, Math.sin(a) * 0.2);
      goodParts.push(good);
    }
    dock.add(mesh(bakeMerge(goodParts), goodsMat));
  }
  const dockLbl = label('货物交接站', '#ffd9ec', 0.0034);
  dockLbl.position.set(0, 0.55, 0);
  dock.add(dockLbl);
  gSkello.add(dock);
}

/* ---------------- 模式切换（illus / fluor） ---------------- */

let cellMode = 'illus';
function setCellMode(mode) {
  cellMode = mode;
  vfx.setMode(mode);
  applyGlowMode(glowList, mode);
  /* 荧光模式压暗膜与胞质，让发光器官跳出来 */
  const dim = mode === 'fluor';
  memMat.opacity = dim ? 0.14 : 0.4;
  memMat.emissiveIntensity = dim ? 0.05 : 0.25;
  cytoMat.opacity = dim ? 0.15 : 0.4;
  cytoMat.emissiveIntensity = dim ? 0.12 : 0.85;
  bandMat.emissiveIntensity = dim ? 0.15 : 0.6;
  keyLight.intensity = dim ? 0.55 : 1.55;
  fillLight.intensity = dim ? 0.2 : 0.6;
  ambLight.intensity = dim ? 0.1 : 0.5;
}

/* ---------------- 章节定义 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionId = null;
let activeCleanup = null;
let lastSectionIdx = -1;
let focusOrg = null;

const hud = makeHUD(document.getElementById('lcData'), [['a', '读数'], ['b', '要点'], ['c', '提示']]);
hud.visibleNow = false;

function clearFocus() {
  if (focusOrg) { focusOrg.scale.setScalar(focusOrg.userData.baseScale || 1); focusOrg = null; }
}

function focusOn(org) {
  clearFocus();
  focusOrg = org;
  org.userData.baseScale = org.userData.baseScale || org.scale.x;
  const k = org.userData.baseScale;
  org.scale.setScalar(k * 1.12);
}

const SECTIONS = [
  {
    id: 'overview',
    title: '细胞全景',
    html: `<p>动物细胞剖开看：最外面是<span class="hl">细胞膜</span>（选择透过性），里面是胶态的细胞质基质，悬浮着形态各异的<b>细胞器</b>。</p>
<p>找一找：<b>细胞核</b>（紫，含染色质）、<b>线粒体</b>（橙色带嵴）、<b>内质网</b>（青色管网）、<b>高尔基体</b>（橙黄扁囊）、<b>核糖体</b>（小点）、<b>溶酶体</b>（粉色小泡）、<b>中心体</b>（两个垂直中心粒）。</p>
<p>打开「标注」按钮认识它们，或<b>直接点选</b>任一细胞器聚焦看详情；「荧光显微」切换暗视野观感；下一章逐个走近观察。</p>`,
    enter() {
      animalCell.visible = true;
      plantCell.visible = false; prok.visible = false;
      gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
      animalLabels.forEach((l) => { l.visible = true; });
      app.setCamera([0, 2.0, 7.6], [0, 0.3, 0]);
      hud.visibleNow = false;
      ctl.clear();
      ctl.toggle({
        label: '标注', value: true,
        onChange: (v) => { animalLabels.forEach((l) => { l.visible = v; }); },
      });
      ctl.toggle({
        label: '自转', value: true,
        onChange: (v) => { stateOV.spin = v; },
      });
      ctl.slider({
        label: '剖开角度', min: 30, max: 359, step: 1, value: 209,
        fmt: (v) => v + '°',
        onInput: (v) => {
          buildCellShell(v);
          hud.set('c', '已剖开 ' + v + '° · 开口越大内部看得越全');
        },
      });
      ctl.sep();
      ctl.seg({
        options: [{ label: '插画', value: 'illus' }, { label: '荧光', value: 'fluor' }],
        value: cellMode,
        onChange: (v) => { setCellMode(v); },
      });
      ctl.button({ label: '重置视角', onClick: () => app.setCamera([0, 2.0, 7.6], [0, 0.3, 0]) });
      /* 点选拾取：射线打中哪个细胞器就聚焦哪个（拖拽/旋转不算点选），触屏同样生效 */
      const ray = new THREE.Raycaster();
      const ptr = new THREE.Vector2();
      let downXY = null;
      const onDown = (e) => { downXY = [e.clientX, e.clientY]; };
      const onUp = (e) => {
        if (!downXY) return;
        const dx = e.clientX - downXY[0], dy = e.clientY - downXY[1];
        downXY = null;
        if (dx * dx + dy * dy > 36) return;
        const r = stage.getBoundingClientRect();
        ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        ray.setFromCamera(ptr, camera);
        const hits = ray.intersectObjects(organelles.map((o) => o.group), true);
        if (!hits.length) return;
        let g = hits[0].object;
        while (g && !g.userData.info) g = g.parent;
        if (g && g.userData.info) {
          focusOn(g);
          hud.visibleNow = true;
          hud.set('a', g.userData.name);
          hud.set('b', g.userData.info);
          hud.set('c', '「总览视角」可回到全景');
        }
      };
      stage.addEventListener('pointerdown', onDown);
      stage.addEventListener('pointerup', onUp);
      /* 悬停高亮：划过哪个细胞器，它就整体微微提亮（材质先存后还） */
      let hovered = null;
      const hoverSaved = new Map();
      const onMove = (e) => {
        const r = stage.getBoundingClientRect();
        ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        ray.setFromCamera(ptr, camera);
        const hits = ray.intersectObjects(organelles.map((o) => o.group), true);
        let g = hits.length ? hits[0].object : null;
        while (g && !g.userData.info) g = g.parent;
        if (g === hovered) return;
        if (hovered) {
          hoverSaved.forEach((v, m) => { m.emissiveIntensity = v; });
          hoverSaved.clear();
          hovered = null;
        }
        if (g) {
          hovered = g;
          g.traverse((n) => {
            if (n.isMesh && n.material && n.material.emissive) {
              if (!hoverSaved.has(n.material)) hoverSaved.set(n.material, n.material.emissiveIntensity);
              n.material.emissiveIntensity = Math.min(1.6, hoverSaved.get(n.material) + 0.5);
            }
          });
        }
      };
      stage.addEventListener('pointermove', onMove);
      activeCleanup = () => {
        stage.removeEventListener('pointerdown', onDown);
        stage.removeEventListener('pointerup', onUp);
        stage.removeEventListener('pointermove', onMove);
        if (hovered) {
          hoverSaved.forEach((v, m) => { m.emissiveIntensity = v; });
          hovered = null;
        }
      };
    },
    leave() {
      setCellMode('illus');
    },
  },
  {
    id: 'organelles',
    title: '细胞器详解',
    html: `<p>逐个放大观察细胞器，右侧面板给出<b>结构与功能</b>要点。点击下方按钮切换目标（相机自动拉近）。</p>
<p>结构联想：<b>线粒体</b>内膜折叠成嵴；<b>高尔基体</b>是扁平囊堆；<b>中心体</b>两个中心粒互相垂直；<b>内质网</b>是膜连接成的管网。</p>`,
    enter() {
      animalCell.visible = true;
      plantCell.visible = false; prok.visible = false;
      gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
      animalLabels.forEach((l) => { l.visible = true; });
      hud.visibleNow = true;
      ctl.clear();
      const pickables = organelles;
      pickables.forEach((o, i) => {
        if (i === 3 || i === 6) ctl.sep();
        ctl.button({
          label: o.name,
          active: false,
          onClick: () => {
            focusOn(o.group);
            hud.set('a', o.name);
            hud.set('b', o.group.userData.info);
            hud.set('c', '拖动旋转 · 滚轮缩放');
          },
        });
      });
      ctl.sep();
      ctl.button({ label: '总览视角', onClick: () => { clearFocus(); app.setCamera([0, 2.0, 7.6], [0, 0.3, 0]); } });
      hud.set('a', '线粒体');
      hud.set('b', organelles[1].group.userData.info);
      hud.set('c', '提示');
      focusOn(mito1);
      app.setCamera([2.2, 2.4, 3.2], [1.15, 1.25, 0.15]);
    },
  },
  {
    id: 'animal-vs-plant',
    title: '动物细胞·植物细胞',
    html: `<p>左边动物细胞，右边植物细胞。植物细胞特有的三样：<span class="hl">细胞壁</span>（最外层，全透性）、<span class="hl">叶绿体</span>（光合作用，内含类囊体基粒）、<span class="hl">大液泡</span>（细胞液）。</p>
<p>双方都有：细胞膜、细胞质、细胞核、线粒体、核糖体、内质网、高尔基体。<b>中心体</b>：动物有，高等植物没有。</p>`,
    enter() {
      animalCell.visible = true;
      animalCell.scale.setScalar(0.72);
      animalCell.position.x = -3.1;
      plantCell.visible = true;
      plantCell.scale.setScalar(0.78);
      plantCell.position.x = 3.1;
      prok.visible = false;
      gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
      animalLabels.forEach((l) => { l.visible = true; });
      hud.visibleNow = true;
      hud.set('a', '动物细胞 ←→ 植物细胞');
      hud.set('b', '共有：膜/质/核/线粒体/核糖体/内质网/高尔基体');
      hud.set('c', '植物特有：细胞壁·叶绿体·液泡');
      app.setCamera([0, 2.2, 10.4], [0, 0.2, 0]);
      ctl.clear();
      ctl.toggle({
        label: '标注', value: true,
        onChange: (v) => { animalLabels.forEach((l) => { l.visible = v; }); },
      });
      ctl.toggle({
        label: '自转', value: true,
        onChange: (v) => { stateAP.spin = v; },
      });
      ctl.slider({
        label: '光照强度', min: 0, max: 2, step: 0.05, value: plantFx.light,
        fmt: (v) => '×' + v.toFixed(2),
        onInput: (v) => {
          plantFx.light = v;
          hud.set('c', '光照 ×' + v.toFixed(2) + ' · 光合越旺气泡升得越快');
        },
      });
      ctl.slider({
        label: '液泡膨压', min: 0, max: 1, step: 0.05, value: plantFx.turgor,
        fmt: (v) => (v * 100).toFixed(0) + '%',
        onInput: (v) => {
          plantFx.turgor = v;
          hud.set('c', '膨压 ' + (v * 100).toFixed(0) + '% · 越满细胞越坚挺');
        },
      });
      ctl.button({ label: '恢复总览视角', onClick: () => app.setCamera([0, 2.2, 10.4], [0, 0.2, 0]) });
    },
    leave() {
      animalCell.scale.setScalar(1);
      animalCell.position.x = 0;
    },
  },
  {
    id: 'pro-vs-eu',
    title: '原核细胞·真核细胞',
    html: `<p>原核细胞（左，细菌）与真核细胞（右，动物细胞）最本质的区别：<span class="hl">有没有核膜围成的成形细胞核</span>。</p>
<p>原核细胞：拟核是环状 DNA，<b>没有核膜、没有染色体</b>；只有核糖体一种细胞器；有细胞壁、鞭毛。代表：细菌、蓝细菌。真核细胞：细胞器种类齐全。共性：都有细胞膜、核糖体、DNA。</p>`,
    enter() {
      animalCell.visible = true;
      animalCell.scale.setScalar(0.62);
      animalCell.position.x = 4.6;
      prok.visible = true;
      prok.position.x = -3.4;
      plantCell.visible = false;
      gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
      animalLabels.forEach((l) => { l.visible = false; });
      prokLabels.forEach((l) => { l.visible = true; });
      hud.visibleNow = true;
      hud.set('a', '左：原核（细菌）· 右：真核');
      hud.set('b', '本质区别：无核膜包被的细胞核');
      hud.set('c', '共性：细胞膜 · 核糖体 · DNA');
      app.setCamera([0, 1.8, 10.2], [0, 0.2, 0]);
      ctl.clear();
      ctl.toggle({
        label: '鞭毛摆动', value: true,
        onChange: (v) => { statePE.flag = v; },
      });
      ctl.toggle({
        label: '原核标注', value: true,
        onChange: (v) => { prokLabels.forEach((l) => { l.visible = v; }); },
      });
      ctl.slider({
        label: '鞭毛转速', min: 0, max: 3, step: 0.1, value: prokFx.flagSpeed,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => {
          prokFx.flagSpeed = v;
          hud.set('c', '鞭毛 ×' + v.toFixed(1) + ' · 转得快游得快');
        },
      });
      ctl.button({ label: '恢复总览视角', onClick: () => app.setCamera([0, 1.8, 10.2], [0, 0.2, 0]) });
    },
    leave() {
      animalCell.scale.setScalar(1);
      animalCell.position.x = 0;
      prok.visible = false;
    },
  },
  {
    id: 'fluid-mosaic',
    title: '流动镶嵌模型',
    html: `<p>生物膜的<span class="hl">流动镶嵌模型</span>：<b>磷脂双分子层</b>构成基本支架（亲水“头”朝外、疏水“尾”相对），<b>蛋白质</b>镶、嵌、贯穿其中，外侧糖链形成<b>糖被</b>（细胞识别）。</p>
<p><b>流动性</b>是结构特点：磷脂和大多数蛋白质都能侧向流动。调高「流动性（温度）」看分子运动加快——低温下流动变慢，膜的功能也随之下降。</p>
<p>加<b>胆固醇</b>会夹在磷脂之间“锁住”摆动，膜变稳但变僵；单个磷脂想从一层翻到另一层极慢，得靠<b>翻转酶</b>帮忙（右侧开关可看演示）。</p>`,
    enter() {
      animalCell.visible = false;
      showOnly(gMembrane);
      hud.visibleNow = false;
      app.setCamera([0, 0.6, 6.4], [0, 0, 0]);
      ctl.clear();
      ctl.slider({
        label: '流动性（温度）', min: 0, max: 5, step: 0.1, value: fluid.speed,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { fluid.speed = v; },
      });
      ctl.toggle({
        label: '膜面波动', value: true,
        onChange: (v) => { fluid.wave = v; },
      });
      ctl.toggle({
        label: '糖被（糖链）', value: true,
        onChange: (v) => { sugars.visible = v; },
      });
      ctl.slider({
        label: '胆固醇含量', min: 0, max: 1, step: 0.05, value: fluid.chol,
        fmt: (v) => (v * 100).toFixed(0) + '%',
        onInput: (v) => {
          fluid.chol = v;
          hud.set('c', '胆固醇 ' + (v * 100).toFixed(0) + '% · 膜变"稳"但流动性下降');
        },
      });
      ctl.toggle({
        label: '翻转酶演示', value: true,
        onChange: (v) => { fluid.flipOn = v; },
      });
      ctl.button({ label: '俯视磷脂阵列', onClick: () => app.setCamera([0, 5.4, 0.01], [0, 0, 0]) });
    },
  },
  {
    id: 'transport',
    title: '物质进出细胞',
    html: `<p>跨膜运输四种方式（上=高浓度侧，下=低浓度侧）：</p>
<p>① <b>自由扩散</b>：顺浓度直接穿过磷脂双层（O₂、CO₂、乙醇）；② <b>协助扩散</b>：顺浓度、经<span class="hl">通道/载体蛋白</span>（葡萄糖进红细胞）；③ <b>主动运输</b>：<b>逆浓度</b>、需载体蛋白并消耗 <span class="hl">ATP</span>（离子、葡萄糖进小肠）——看泵上的橙色 ATP 闪光；④ <b>胞吞/胞吐</b>：大分子经膜泡运输，也消耗能量。</p>
<p>切换下方按钮观察各自动画，注意「是否需要载体 / 是否耗能」。</p>`,
    enter() {
      animalCell.visible = false;
      showOnly(gTransport);
      endoVes.visible = false;
      hud.visibleNow = true;
      app.setCamera([0, 0.4, 8.6], [0, 0, 0]);
      ctl.clear();
      const modes = [
        { label: '自由扩散', value: 'free', b: '顺浓度 · 不需载体 · 不耗能' },
        { label: '协助扩散', value: 'facil', b: '顺浓度 · 需通道/载体 · 不耗能' },
        { label: '主动运输', value: 'active', b: '逆浓度 · 需载体 · 消耗 ATP' },
        { label: '胞吞胞吐', value: 'endo', b: '大分子 · 膜泡运输 · 耗能' },
      ];
      const modeBtns = [];
      modes.forEach((m) => {
        const btn = ctl.button({
          label: m.label,
          active: trans.mode === m.value,
          onClick: () => {
            trans.mode = m.value;
            modeBtns.forEach(({ b, v }) => b.classList.toggle('active', v === m.value));
            tParts.forEach((p) => { p.active = false; p.m.visible = false; p.sparked = false; });
            endoVes.visible = false;
            atpLbl.visible = m.value === 'active';
            concArrow.visible = m.value !== 'active';
            hud.set('b', m.b);
            hud.set('a', m.value === 'active' ? '主动运输（逆浓度）' : m.value === 'endo' ? '膜泡运输（耗能）' : '被动运输（顺浓度）');
          },
        });
        modeBtns.push({ b: btn, v: m.value });
      });
      ctl.sep();
      ctl.slider({
        label: '粒子速率', min: 0.5, max: 4, step: 0.1, value: trans.rate,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { trans.rate = v; },
      });
      hud.set('a', trans.mode === 'active' ? '主动运输（逆浓度）' : '被动运输（顺浓度）');
      hud.set('b', '顺浓度 · 不需载体 · 不耗能');
      hud.set('c', '注意 ATP 闪光的时机');
    },
  },
  {
    id: 'secret-path',
    title: '分泌蛋白的合成和转运',
    html: `<p>分泌蛋白（消化酶、抗体、部分激素）的旅程：<span class="hl">核糖体合成肽链 → 内质网加工 → 囊泡运输 → 高尔基体加工包装 → 囊泡 → 细胞膜胞吐</span>，全程由线粒体供能。</p>
<p>按压「播放」，跟随金色颗粒走完全程；右侧面板同步显示当前站点的作用。放射状思路：附着核糖体 ≠ 游离核糖体——分泌蛋白走的是“附着”路线。</p>`,
    enter() {
      animalCell.visible = false;
      showOnly(gSecret);
      hud.visibleNow = true;
      app.setCamera([0, 1.2, 9.0], [0, 0.6, 0]);
      ctl.clear();
      const playBtn = ctl.button({
        label: secret.playing ? '⏸ 暂停' : '▶ 播放',
        onClick: () => {
          secret.playing = !secret.playing;
          playBtn.textContent = secret.playing ? '⏸ 暂停' : '▶ 播放';
          playBtn.classList.toggle('active', !secret.playing);
        },
      });
      ctl.slider({
        label: '旅程速度', min: 0.3, max: 3, step: 0.1, value: secret.speed,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { secret.speed = v; },
      });
      ctl.button({
        label: '重新出发',
        onClick: () => { secDots.forEach((d) => { d.t = -Math.random() * 2; }); },
      });
      ctl.sep();
      /* 站点跳转：相机飞到对应工位并给出该站说明 */
      secStations.forEach((s) => {
        ctl.button({
          label: '走近 ' + s.name.slice(2, 7),
          onClick: () => {
            const p = s.pos;
            app.setCamera([p[0] + 1.0, p[1] + 1.3, p[2] + 3.6], [p[0], p[1], p[2]]);
            hud.set('a', s.name);
            hud.set('b', s.info);
          },
        });
      });
      secret.updateHud = () => {
        const lead = secDots.reduce((mx, d) => Math.max(mx, d.t), -99);
        const i = clamp(Math.round(lead), 0, secStations.length - 1);
        hud.set('a', secStations[i].name);
        hud.set('b', secStations[i].info);
        hud.set('c', '例：胰岛 B 细胞分泌胰岛素');
      };
    },
  },
  {
    id: 'cytoskeleton',
    title: '细胞骨架·胞质环流',
    html: `<p><b>细胞骨架</b>：由微管（蓝）、微丝（粉）等蛋白纤维组成，既维持形态，又是细胞内运输的“轨道”。</p>
<p><b>马达蛋白</b>（驱动蛋白）沿着微管“行走”，驮着囊泡把“货物”运到指定位置；细胞质中的颗粒随<span class="hl">胞质环流</span>缓缓流动，加速物质交换。</p>
<p>试试「荧光显微风格」：切换为暗视野荧光效果——这就是实验室里观察细胞骨架的经典成像方式。</p>`,
    enter() {
      animalCell.visible = false;
      showOnly(gSkello);
      hud.visibleNow = false;
      app.setCamera([2.6, 1.6, 5.2], [0, 0.3, 0]);
      ctl.clear();
      ctl.slider({
        label: '环流 / 步行速度', min: 0, max: 4, step: 0.1, value: skel.flowSpeed,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { skel.flowSpeed = v; },
      });
      ctl.toggle({
        label: '马达蛋白', value: true,
        onChange: (v) => { skel.motorOn = v; },
      });
      ctl.toggle({
        label: '荧光显微风格', value: false,
        onChange: (v) => { setCellMode(v ? 'fluor' : 'illus'); },
      });
      ctl.button({ label: '重置视角', onClick: () => app.setCamera([2.6, 1.6, 5.2], [0, 0.3, 0]) });
    },
    leave() {
      setCellMode('illus');
    },
  },
  {
    id: 'quiz',
    title: '随堂检测',
    html: `<p>5 道选择题，检验一下本节课的掌握情况。答完可重新开始。</p>`,
    enter() {
      animalCell.visible = true;
      plantCell.visible = prok.visible = false;
      gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
      animalLabels.forEach((l) => { l.visible = false; });
      app.setCamera([0, 2.0, 7.6], [0, 0.3, 0]);
      ctl.clear();
      hud.visibleNow = false;
      showQuiz();
    },
  },
];

function showOnly(g) {
  gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
  g.visible = true;
}

/* 杂项状态 */
const stateOV = { spin: true };
const stateAP = { spin: true };
const statePE = { flag: true };

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '下列属于植物细胞特有、动物细胞没有的结构是？',
    opts: ['线粒体', '核糖体', '叶绿体和液泡', '高尔基体'],
    a: 2,
    back: 2,
    ex: '植物细胞特有：细胞壁、叶绿体、液泡；线粒体、核糖体、高尔基体动植物细胞都有。',
  },
  {
    q: '原核细胞相比真核细胞，本质的不同点是？',
    opts: ['有无细胞膜', '有无核糖体', '有无核膜围成的成形细胞核', '大小不同'],
    a: 2,
    back: 3,
    ex: '原核细胞的遗传物质集中在核区，没有核膜围成的成形细胞核（只有拟核）；两类细胞都具备细胞膜、核糖体和 DNA。',
  },
  {
    q: '流动镶嵌模型中，构成生物膜基本支架的是？',
    opts: ['蛋白质', '磷脂双分子层', '糖被', '胆固醇'],
    a: 1,
    back: 4,
    ex: '磷脂双分子层构成膜的基本支架，蛋白质镶、嵌、贯穿其中，糖链分布在膜外侧（糖被）。',
  },
  {
    q: '小肠上皮细胞吸收葡萄糖（逆浓度梯度）的方式属于？',
    opts: ['自由扩散', '协助扩散', '主动运输', '胞吞'],
    a: 2,
    back: 5,
    ex: '逆浓度梯度吸收须依靠载体蛋白，并靠细胞呼吸供能（ATP），属于主动运输。',
  },
  {
    q: '分泌蛋白合成与运输的正确路径是？',
    opts: ['核糖体→高尔基体→内质网→细胞膜', '核糖体→内质网→高尔基体→细胞膜', '内质网→核糖体→高尔基体→细胞膜', '高尔基体→内质网→核糖体→细胞膜'],
    a: 1,
    back: 6,
    ex: '附着核糖体合成肽链 → 内质网加工 → 囊泡 → 高尔基体加工包装 → 囊泡 → 细胞膜胞吐，全程线粒体供能。',
  },
];

function showQuiz() {
  let idx = 0;
  let score = 0;
  const wrongList = [];
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
        else wrongList.push(idx);
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
    const stars = Math.max(1, Math.round((score / QUIZ.length) * 5));
    const starRow = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    card.innerHTML = `
      <div class="q-progress">检测完成</div>
      <div class="big">${score} / ${QUIZ.length}</div>
      <div class="q-stars" style="letter-spacing:4px;color:var(--accent);font-size:20px;margin:2px 0 6px">${starRow}</div>
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，掌握得很扎实！' : pct >= 60 ? '，大部分概念已经清楚了，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
    /* 错题回看：点哪条跳回对应章节（从错处学会） */
    if (wrongList.length) {
      const wTitle = document.createElement('div');
      wTitle.textContent = '错题回看：';
      wTitle.style.cssText = 'color:var(--text-dim);font-size:13px;margin:0 0 8px';
      card.appendChild(wTitle);
      wrongList.forEach((qi) => {
        const wbtn = document.createElement('button');
        wbtn.type = 'button';
        wbtn.className = 'ctl-btn';
        wbtn.textContent = '回看 · 第' + (qi + 1) + '题';
        wbtn.addEventListener('click', () => { panel.remove(); window.__eduSections.select(QUIZ[qi].back); });
        const wrow = document.createElement('div');
        wrow.style.cssText = 'display:flex;justify-content:center;margin:0 0 8px';
        wrow.appendChild(wbtn);
        card.appendChild(wrow);
      });
    }
    const again = document.createElement('button');
    again.type = 'button';
    again.className = 'ctl-btn active';
    again.textContent = '重新测验';
    again.addEventListener('click', () => { idx = 0; score = 0; wrongList.length = 0; renderQ(); });
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
  activeCleanup = () => panel.remove();
}

/* ---------------- 主循环 ---------------- */

app.onFrame((dt, t) => {
  hud.el.style.display = hud.visibleNow ? '' : 'none';
  accSecs.data.classList.toggle('acc-empty', !hud.visibleNow);   /* 读数隐藏时数据块一并收走 */
  /* 动物细胞章节里跑"细胞活着"的微观动画：mRNP 出核 / 高尔基出芽 / 溶酶体消化 / ATP 闪粒 */
  const animalAlive = activeSectionId === 'overview' || activeSectionId === 'organelles'
    || activeSectionId === 'animal-vs-plant' || activeSectionId === 'pro-vs-eu' || activeSectionId === 'quiz';
  if (animalAlive) {
    labBench.visible = true;
    if (mRNP && mRNP.tick) mRNP.tick(dt);
    if (golgiBuds && golgiBuds.tick) golgiBuds.tick(t);
    const digest = lysoGroup.userData.digest;
    if (digest && digest.userData.tick) digest.userData.tick(t);
    /* 线粒体呼吸节律：复合体随相位脉冲，ATP 合成酶旋柄匀速转 */
    mitoRegistry.forEach((g) => {
      if (g.userData.etcMesh) g.userData.etcMesh.material.emissiveIntensity = 0.2 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.4));
      if (g.userData.synthHead) g.userData.synthHead.rotation.y = t * 1.8;
    });
    organelles.forEach((o) => {
      o.group.traverse((n) => {
        if (n.isSprite && n.userData.ph !== undefined) {
          n.userData.ph += dt * 2.2;
          n.position.y += Math.sin(n.userData.ph) * dt * 0.02;
        }
      });
    });
    if (cytoFlow.tick) cytoFlow.tick(dt, t);
  }
  cellShadow.visible = animalAlive && (activeSectionId === 'overview' || activeSectionId === 'quiz');
  if (activeSectionId === 'overview' || activeSectionId === 'quiz') {
    if (stateOV.spin) animalCell.rotation.y = t * 0.22;
  } else if (activeSectionId === 'organelles') {
    animalCell.rotation.y = t * 0.1;
  } else if (activeSectionId === 'animal-vs-plant') {
    if (stateAP.spin) {
      animalCell.rotation.y = t * 0.24;
      plantCell.rotation.y = t * 0.24;
    }
    tickPlantFx(dt, t);
    /* 光照联动：类囊体基粒随光强增亮，O₂ 气泡升速由 tickPlantFx 内部读取 */
    const thylMat = plantCell.userData.thylakoidMat;
    if (thylMat) thylMat.emissiveIntensity = 0.3 + plantFx.light * 0.55;
  } else if (activeSectionId === 'pro-vs-eu') {
    prok.rotation.y = t * 0.18;
    animalCell.rotation.y = t * 0.18;
    if (statePE.flag) {
      const f = prok.userData.flag;
      f.rotation.x = Math.sin(t * 6 * prokFx.flagSpeed) * 0.3;
      f.rotation.z = Math.cos(t * 6 * prokFx.flagSpeed) * 0.3;
    }
  } else if (activeSectionId === 'fluid-mosaic') {
    labBench.visible = false;   /* 特写章节收起台面，视线聚焦膜面 */
    tickMembrane(dt);
  } else if (activeSectionId === 'transport') {
    labBench.visible = false;
    tickTransport(dt);
    if (hud.visibleNow) {
      if (trans.mode === 'active' && trans.sparkT > 0.5) hud.set('c', 'ATP 水解供能 → 逆浓度泵运 · 通量 ' + trans.flux);
      else hud.set('c', '累计运完 ' + trans.flux + ' 个 · 注意是否耗载体/能量');
    }
  } else if (activeSectionId === 'secret-path') {
    labBench.visible = false;
    tickSecret(dt);
    if (secret.updateHud) secret.updateHud();
    if (hud.visibleNow) hud.set('c', '已送达分泌泡 ' + secret.delivered + ' 个');
  } else if (activeSectionId === 'cytoskeleton') {
    labBench.visible = false;
    tickSkello(dt, t);
  }
});

/* 骨架章节 tick（马达蛋白沿微管步行 + 胞质环流 + 动力蛋白逆向回运） */
function tickSkello(dt, t) {
  flowParts.forEach((p, i) => {
    p.off = (p.off + dt * 0.08 * skel.flowSpeed) % 1;
    const a = p.off * TAU;
    flowDummy.position.set(Math.cos(a) * p.r, p.y + Math.sin(a * 2) * p.tilt, Math.sin(a) * p.r * 0.8);
    flowDummy.updateMatrix();
    flowMesh.setMatrixAt(i, flowDummy.matrix);
  });
  flowMesh.instanceMatrix.needsUpdate = true;
  if (skel.motorOn) {
    skel.motorT += dt * 0.045 * skel.flowSpeed;
    skel.motorT %= 1;
    const pos = skel.motorPath.getPoint(skel.motorT);
    const ahead = skel.motorPath.getPoint((skel.motorT + 0.02) % 1);
    motor.position.copy(pos).y += 0.05;
    motor.lookAt(ahead.x, pos.y + 0.05, ahead.z);
    motor.position.y += 0.05;
    motor.visible = true;
    /* 步行踏步：两脚交替抬落（手牵手"行走"的经典形象） */
    const stepPh = skel.motorT * TAU * 9;
    motor.userData.footL.position.y = Math.max(0, Math.sin(stepPh)) * 0.055;
    motor.userData.footR.position.y = Math.max(0, Math.sin(stepPh + Math.PI)) * 0.055;
    /* 动力蛋白：参数从高向低走（逆向），载货朝中心体回运 */
    skel.dynT -= dt * 0.03 * skel.flowSpeed;
    if (skel.dynT < 0.1) skel.dynT = 0.95;
    const dpos = skel.dynPath.getPoint(skel.dynT);
    const dAhead = skel.dynPath.getPoint((skel.dynT - 0.02 + 1) % 1);
    skel.dynein.position.copy(dpos).y += 0.05;
    skel.dynein.lookAt(dAhead.x, dpos.y + 0.05, dAhead.z);
    skel.dynein.position.y += 0.05;
    skel.dynein.visible = true;
  } else {
    motor.visible = false;
    skel.dynein.visible = false;
  }
}

/* ---------------- 启动 ---------------- */

animalCell.visible = true;
plantCell.visible = prok.visible = false;
gMembrane.visible = gTransport.visible = gSecret.visible = gSkello.visible = false;
setCellMode('illus');

/* 调试句柄（自动化自查：模式切换 / 渲染统计） */
window.__cellDebug = { vfx, setCellMode, scene, camera, labBench, animalCell, plantCell, prok, gMembrane, gTransport, gSecret, gSkello, cellShadow };
loader.hide();

/* ================= 三栏布局驱动（左栏章节列表 / 右栏详解联动 / 栏折叠 / 专注模式） ================= */

const chapNav = document.getElementById('chapNav');
const chapCount = document.getElementById('chapCount');
const detailNo = document.getElementById('detailNo');
const detailTitle = document.getElementById('detailTitle');
const lessonEl = document.getElementById('lesson');
const detailBody = document.getElementById('detailBody');
const controlsEl = document.getElementById('controls');
let chapterIdx = 0;

/* 9 章竖排按钮：序号 + 标题，点击切章，当前章 .on 高亮 */
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
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  if (lastSectionIdx >= 0 && SECTIONS[lastSectionIdx].leave) SECTIONS[lastSectionIdx].leave();
  lastSectionIdx = chapterIdx;
  activeSectionId = sec.id;
  sec.enter();
  /* 本章无控件时整块手风琴收走（不动用户的手风琴偏好；数据块由帧循环按 visibleNow 同步） */
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
const shellEl = document.getElementById('cellShell');
const focusBtn = document.getElementById('focusBtn');

const FOLD_KEY = { l: 'cell.foldL', r: 'cell.foldR' };
let foldL = false;
let foldR = false;
let focusSaved = null; /* 进入专注模式前的独立折叠状态 [foldL, foldR]，退出时恢复 */

try {
  foldL = localStorage.getItem(FOLD_KEY.l) === '1';
  foldR = localStorage.getItem(FOLD_KEY.r) === '1';
} catch (e) { /* localStorage 不可用（隐私模式等）时仅本次会话内生效 */ }

function applyFold() {
  shellEl.classList.toggle('fold-l', foldL);
  shellEl.classList.toggle('fold-r', foldR);
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
  shellEl.classList.toggle('focus-mode', on);
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

const ACC_KEYS = { lesson: 'cell.accLesson', controls: 'cell.accControls', data: 'cell.accData' };
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

window.__eduSections = { select: selectChapter };
selectChapter(0);
