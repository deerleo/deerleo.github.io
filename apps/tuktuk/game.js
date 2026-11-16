// توك توك: وسّع يا باشا
// لعبة تلاتية الأبعاد في شارع مصري. كل الأشكال والخامات والأصوات متولّدة بالكود، من غير أي صورة أو ملف صوت جاهز.
// Written by Claude Fable 5.2. Rendering: three.js (MIT).
import * as THREE from "./three.module.js";

const Q = new URLSearchParams(location.search);
const AUTO = Q.get("auto") === "1";          // الكمبيوتر هو اللي بيسوق (للعرض)
const CAP = Q.get("cap") === "1";            // تصوير كادر كادر بخطوة ثابتة
const SEED = Number(Q.get("seed") || 7);
let camMode = Q.get("cam") || "chase";
let autoOn = true;
if (Q.get("hud") === "0") document.body.classList.add("clean");

// ---------- عشوائي ثابت، عشان نفس البذرة تطلع نفس الشارع
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED);
const R = (a, b) => a + rng() * (b - a);
const RI = (a, b) => Math.floor(R(a, b + 1));
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

// ---------- مقاسات الشارع
const LANE = 2.6;
const LANES = [-LANE, 0, LANE];
const ROAD_HALF = 4.8;
const WALK_W = 2.8;
const FACADE_X = ROAD_HALF + WALK_W;         // وش العمارات
const TILE = 6.4;                            // بلاطة الأسفلت
const CHUNK = TILE * 6;                      // 38.4 متر
const NCHUNK = 7;

// ---------- الرندر والمشهد
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: CAP });
renderer.setPixelRatio(CAP ? 1 : Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;

const scene = new THREE.Scene();
const HAZE = 0xf4c391;
scene.fog = new THREE.Fog(HAZE, 45, 185);
const camera = new THREE.PerspectiveCamera(70, 1, 0.3, 600);

function canvasTex(w, h, draw, repeat) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
const glow = (color, k = 1.6) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: k, roughness: 0.6 });
function box(w, h, d, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true;
  return m;
}

// السما: تدرّج غروب مرسوم على كانفاس
scene.background = canvasTex(8, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, "#7f8fc0"); gr.addColorStop(0.3, "#e8a57e");
  gr.addColorStop(0.5, "#f9cf98"); gr.addColorStop(1, "#f4c391");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});

// الشمس وهالتها
const sun = new THREE.Mesh(new THREE.CircleGeometry(13, 48), new THREE.MeshBasicMaterial({ color: 0xfff4d6, fog: false }));
sun.position.set(-7, 31, -300); scene.add(sun);
const halo = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), new THREE.MeshBasicMaterial({
  map: canvasTex(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 8, 128, 128, 128);
    gr.addColorStop(0, "rgba(255,236,190,.9)"); gr.addColorStop(0.35, "rgba(255,205,140,.35)"); gr.addColorStop(1, "rgba(255,190,120,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
halo.position.set(-7, 31, -299); scene.add(halo);

// خط الأفق: عمارات ومآذن وأهرامات بعيدة
const skyline = new THREE.Mesh(new THREE.PlaneGeometry(520, 65), new THREE.MeshBasicMaterial({
  map: canvasTex(2048, 256, (g, w, h) => {
    const r2 = mulberry32(99);
    g.fillStyle = "#d59b78";
    for (const [cx, s] of [[420, 150], [560, 120], [660, 85]]) {      // الأهرامات
      g.beginPath(); g.moveTo(cx - s, h); g.lineTo(cx, h - s * 0.78); g.lineTo(cx + s, h); g.fill();
    }
    g.fillStyle = "#c98c6c";
    for (let x = 0; x < w;) {                                          // عمارات
      const bw = 26 + r2() * 46, bh = 28 + r2() * 78;
      g.fillRect(x, h - bh, bw, bh); x += bw + r2() * 5;
    }
    g.fillStyle = "#bd7f62";
    for (const cx of [980, 1420]) {                                    // جامع: قبة ومئذنتين
      g.beginPath(); g.arc(cx, h - 62, 44, Math.PI, 0); g.fill(); g.fillRect(cx - 52, h - 62, 104, 62);
      for (const dx of [-74, 74]) {
        g.fillRect(cx + dx - 6, h - 170, 12, 170); g.fillRect(cx + dx - 10, h - 122, 20, 6);
        g.beginPath(); g.moveTo(cx + dx - 7, h - 170); g.lineTo(cx + dx, h - 196); g.lineTo(cx + dx + 7, h - 170); g.fill();
      }
    }
  }), transparent: true, fog: false, depthWrite: false }));
skyline.position.set(0, 26, -330); scene.add(skyline);

// الإضاءة: شمس واطية من قدّام الشمال، وضلها طويل على الشارع
scene.add(new THREE.HemisphereLight(0xffe2bf, 0x6b5340, 1.15));
const sunLight = new THREE.DirectionalLight(0xffc790, 2.6);
sunLight.position.set(-34, 30, -46);
sunLight.target.position.set(0, 0, -30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
Object.assign(sunLight.shadow.camera, { left: -70, right: 70, top: 46, bottom: -46, near: 1, far: 190 });
sunLight.shadow.bias = -0.0006; sunLight.shadow.normalBias = 0.05;
scene.add(sunLight, sunLight.target);

const world = new THREE.Group(); scene.add(world);      // الشارع الثابت
const traffic = new THREE.Group(); scene.add(traffic);  // العربيات والفلوس

// ---------- خامات مشتركة
const roadMat = std(0xffffff, { roughness: 0.95, map: canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = "#5d5b5e"; g.fillRect(0, 0, w, h);
  const r2 = mulberry32(5);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${r2() < 0.5 ? "0,0,0" : "255,255,255"},${0.03 + r2() * 0.06})`; g.fillRect(r2() * w, r2() * h, 1 + r2() * 3, 1 + r2() * 2); }
  for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(20,20,22,.35)"; g.beginPath(); g.ellipse(r2() * w, r2() * h, 20 + r2() * 40, 8 + r2() * 14, r2() * 3, 0, 7); g.fill(); }
  const px = w / (ROAD_HALF * 2);
  g.fillStyle = "#e9e4d6";
  for (const lx of [-LANE / 2, LANE / 2]) g.fillRect((lx + ROAD_HALF) * px - 3, 0, 6, h * 0.5);  // خطوط متقطعة
  g.fillStyle = "#e2b93b";
  g.fillRect(0.35 * px, 0, 5, h); g.fillRect(w - 0.35 * px - 5, 0, 5, h);                         // خط الحافة
}, [1, CHUNK / TILE]) });
const walkMat = std(0xffffff, { map: canvasTex(128, 128, (g) => {
  g.fillStyle = "#b9ab97"; g.fillRect(0, 0, 128, 128); g.strokeStyle = "rgba(70,60,50,.5)"; g.lineWidth = 2;
  for (let i = 0; i <= 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
}, [2, CHUNK / 1.4]) });
const curbMat = std(0xffffff, { map: canvasTex(128, 16, (g) => {             // رصيف أصفر وأسود
  g.fillStyle = "#f1c81d"; g.fillRect(0, 0, 64, 16); g.fillStyle = "#151515"; g.fillRect(64, 0, 64, 16);
}, [CHUNK / 2.4, 1]) });
const M = {
  black: std(0x141414, { roughness: 0.45 }), tyre: std(0x101010, { roughness: 0.95 }), yellow: std(0xffd21f, { roughness: 0.5, emissive: 0x7a5c00, emissiveIntensity: 0.55 }),
  white: std(0xecebe4, { roughness: 0.55 }), glass: std(0x1d2733, { roughness: 0.2, metalness: 0.3 }), chrome: std(0xb9bcc0, { roughness: 0.3, metalness: 0.7 }),
  red: glow(0xff3b2f, 1.4), amber: glow(0xffc361, 2.4), gold: std(0xffd447, { roughness: 0.35, metalness: 0.2, emissive: 0xb07a00, emissiveIntensity: 0.9 }),
  trunk: std(0x7a5a3c), leaf: std(0x3f7d46, { side: THREE.DoubleSide }), pole: std(0x3b3f45, { roughness: 0.6 }), roof: std(0x6e6258),
  melon: std(0x2f6b3a, { roughness: 0.6 }), wood: std(0x8a6642), skin: std(0xb98a63), dish: std(0xd9d6cf, { side: THREE.DoubleSide, roughness: 0.5 }),
};
const WALLS = ["#d9b98c", "#c9a273", "#e3c9a1", "#b98d68", "#cfa98a", "#a8573c", "#d8c2a6", "#bfa07a"];
const SIGNS = ["كشري الباشا", "عصير قصب", "فول وطعمية", "سوبر ماركت", "صيدلية", "موبايلات", "قهوة بلدي", "حلاق الشباب", "مخبز", "خضار وفاكهة", "ترزي", "مكتبة"];
const SIGN_BG = ["#b3261e", "#1f6b4a", "#1d4f91", "#7a3b12", "#111111", "#6a1f6e"];
const CLOTH = [0xd9483b, 0x2f6fd0, 0xf2f0e6, 0xf0b429, 0x2f9e6b, 0xe07aa0];


// ---------- الدمج: الأشكال السادة بتتجمّع في 3 شبكات بس (عادي، وشّين، منوّر) بدل مئات الرسمات
const FLAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82 });
const FLAT2 = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, side: THREE.DoubleSide });
const GLOW = new THREE.MeshBasicMaterial({ vertexColors: true });
function bake(group, keep = () => false) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert(), B = { flat: [[], [], []], dbl: [[], [], []], glow: [[], [], []] };
  const gone = [], v = new THREE.Vector3(), mat = new THREE.Matrix4(), nm = new THREE.Matrix3();
  group.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material) || keep(o)) return;
    const m = o.material;
    if (m.map || m.transparent || m.vertexColors) return;
    const key = m.isMeshBasicMaterial || m.emissiveIntensity > 1 ? "glow" : m.side === THREE.DoubleSide ? "dbl" : "flat";
    const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, pos = geo.attributes.position, nor = geo.attributes.normal;
    mat.multiplyMatrices(inv, o.matrixWorld); nm.getNormalMatrix(mat);
    const [P, N, C] = B[key];
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mat); P.push(v.x, v.y, v.z);
      v.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); N.push(v.x, v.y, v.z);
      C.push(m.color.r, m.color.g, m.color.b);
    }
    gone.push(o);
  });
  gone.forEach((o) => o.parent.remove(o));
  for (const [key, material] of [["flat", FLAT], ["dbl", FLAT2], ["glow", GLOW]]) {
    const [P, N, C] = B[key]; if (!P.length) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
    const mesh = new THREE.Mesh(geo, material); mesh.castShadow = key !== "glow"; mesh.receiveShadow = key !== "glow"; group.add(mesh);
  }
  return group;
}

// وش العمارة: شبابيك وبلكونات ومحل تحت، مرسومين على كانفاس
function facadeTex(wM, floors, wall, sign) {
  const P = 30, FH = 96, W = Math.round(wM * P), H = floors * FH, brick = wall === "#a8573c";
  return canvasTex(W, H, (g) => {
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    if (brick) {                                    // طوب أحمر على الهيكل الخرساني
      g.strokeStyle = "rgba(60,25,15,.35)"; g.lineWidth = 1;
      for (let y = 0; y < H; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.fillStyle = "#9c968c";
      for (let f = 0; f <= floors; f++) g.fillRect(0, H - f * FH - 5, W, 9);
      for (let x = 0; x <= W; x += W / Math.max(2, Math.round(wM / 3.2))) g.fillRect(x - 5, 0, 10, H);
    }
    for (let i = 0; i < 7; i++) {                   // تراب وبقع
      const x = R(0, W), gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, "rgba(40,25,15,.22)"); gr.addColorStop(1, "rgba(40,25,15,0)");
      g.fillStyle = gr; g.fillRect(x, 0, R(6, 30), H);
    }
    const n = Math.max(2, Math.round(wM / 2.5)), cw = W / n;
    for (let f = 1; f < floors; f++) {
      const y0 = H - (f + 1) * FH;
      for (let i = 0; i < n; i++) {
        const x = i * cw + cw / 2, ww = 30, wh = 46, wy = y0 + 22;
        g.fillStyle = "rgba(40,28,18,.55)"; g.fillRect(x - ww / 2 - 3, wy - 3, ww + 6, wh + 6);
        const lit = rng() < 0.28;
        g.fillStyle = lit ? "#ffd98a" : "#27313c"; g.fillRect(x - ww / 2, wy, ww, wh);
        if (rng() < 0.55) { g.fillStyle = pick(["#3f6b52", "#5a4632", "#3c5a78"]); g.fillRect(x - ww / 2, wy, ww * (rng() < 0.5 ? 0.5 : 1), wh * R(0.35, 1)); }
        g.strokeStyle = "rgba(20,15,10,.6)"; g.lineWidth = 1.5; g.strokeRect(x - ww / 2, wy, ww, wh);
        if (rng() < 0.3) { g.fillStyle = "#cfd2d4"; g.fillRect(x + ww / 2 + 5, wy + wh - 14, 17, 12); g.fillStyle = "#6d7276"; g.fillRect(x + ww / 2 + 7, wy + wh - 11, 13, 2); g.fillRect(x + ww / 2 + 7, wy + wh - 7, 13, 2); }
      }
    }
    // المحل
    g.fillStyle = "#1c1a19"; g.fillRect(8, H - FH + 30, W - 16, FH - 30);
    g.fillStyle = "rgba(255,214,140,.5)"; g.fillRect(14, H - FH + 36, W - 28, FH - 42);
    g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 2;
    for (let x = 14; x < W - 14; x += 26) { g.beginPath(); g.moveTo(x, H - FH + 36); g.lineTo(x, H); g.stroke(); }
    g.fillStyle = sign.bg; g.fillRect(4, H - FH + 2, W - 8, 30);
    g.fillStyle = "#fff"; g.font = "bold 22px Tahoma, Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.direction = "rtl";
    g.fillText(sign.text, W / 2, H - FH + 18, W - 16);
  });
}

function building(side, z0, wM) {
  const g = new THREE.Group();
  const floors = RI(3, 9), h = floors * 3.1, d = R(8, 12), wall = pick(WALLS);
  const tex = facadeTex(wM, floors, wall, { text: pick(SIGNS), bg: pick(SIGN_BG) });
  const face = std(0xffffff, { map: tex }), plain = std(new THREE.Color(wall).multiplyScalar(0.92));
  const cx = side * (FACADE_X + d / 2), cz = z0 - wM / 2;
  const body = new THREE.Mesh(new THREE.BoxGeometry(d, h, wM), face);   // خامة واحدة = رسمة واحدة
  body.position.set(cx, h / 2, cz); body.castShadow = true; body.receiveShadow = true; g.add(body);
  g.add(box(d + 0.04, 0.1, wM + 0.04, M.roof, cx, h + 0.03, cz, false));
  const fx = side * FACADE_X;
  // تندة المحل
  const aw = box(1.5, 0.08, wM * 0.8, std(pick([0xb3261e, 0x1f6b4a, 0x1d4f91, 0xd9a520])), fx - side * 0.7, 2.75, cz);
  aw.rotation.z = side * 0.32; g.add(aw);
  // بلكونات وغسيل
  for (let i = 0, n = RI(1, 4); i < n; i++) {
    const f = RI(1, floors - 1), by = f * 3.1 + 0.2, bz = cz + R(-wM / 2 + 1.2, wM / 2 - 1.2);
    g.add(box(1.0, 0.14, 2.0, plain, fx - side * 0.5, by, bz), box(0.08, 0.85, 2.0, plain, fx - side * 0.98, by + 0.45, bz));
    if (rng() < 0.7) for (let k = 0; k < 4; k++) {
      const c = box(0.03, R(0.5, 0.8), 0.36, std(pick(CLOTH), { side: THREE.DoubleSide }), fx - side * 1.06, by - 0.45, bz - 0.7 + k * 0.46, false); g.add(c);
    }
  }
  // السطح: أطباق دش، خزان مية، وغيّة حمام
  for (let i = 0, n = RI(1, 3); i < n; i++) {
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.75, 12, 5, 0, Math.PI * 2, 0, 0.62), M.dish);
    dish.position.set(cx + R(-d / 3, d / 3), h + 0.95, cz + R(-wM / 3, wM / 3));
    dish.rotation.set(Math.PI + 0.9, R(0, 6.28), 0); dish.castShadow = true;
    g.add(dish, box(0.07, 0.9, 0.07, M.pole, dish.position.x, h + 0.45, dish.position.z));
  }
  if (rng() < 0.6) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.3, 12), std(pick([0x1b1b1b, 0xe8e6df, 0x2a5db0]))); t.position.set(cx - side * d * 0.2, h + 1.0, cz + wM * 0.25); t.castShadow = true; g.add(t, box(1.4, 0.35, 1.4, M.roof, t.position.x, h + 0.18, t.position.z)); }
  if (rng() < 0.3) {
    const px = cx + side * d * 0.2, pz = cz - wM * 0.2, c = std(pick([0x2f8f83, 0xb3261e, 0xd9a520, 0x3c5a78]));
    for (const [a, b] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) g.add(box(0.09, 2.6, 0.09, M.wood, px + a, h + 1.3, pz + b));
    g.add(box(1.9, 1.7, 1.9, c, px, h + 3.4, pz), box(2.2, 0.1, 2.2, M.wood, px, h + 2.6, pz));
  }
  g.add(box(d, 0.5, 0.25, plain, cx, h + 0.25, cz + wM / 2 - 0.12), box(0.25, 0.5, wM, plain, fx + side * 0.12, h + 0.25, cz));
  return g;
}

function palm(x, z) {
  const g = new THREE.Group(), hgt = R(5.5, 8);
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.26, hgt, 7), M.trunk);
  tr.position.y = hgt / 2; tr.castShadow = true; g.add(tr);
  for (let i = 0; i < 9; i++) {
    const piv = new THREE.Group(), leaf = new THREE.Mesh(new THREE.ConeGeometry(0.42, 3.1, 4), M.leaf);
    leaf.scale.z = 0.16; leaf.position.y = 1.5; leaf.castShadow = true; piv.add(leaf);
    piv.position.y = hgt; piv.rotation.set(0, (i / 9) * Math.PI * 2 + R(-0.2, 0.2), 0); piv.rotateZ(R(1.05, 1.75)); g.add(piv);
  }
  g.position.set(x, 0.25, z); g.rotation.z = R(-0.06, 0.06);
  return g;
}

function lamp(side, z) {
  const g = new THREE.Group(), x = side * (ROAD_HALF + 0.5);
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 7, 8), M.pole); p.position.set(x, 3.7, z); p.castShadow = true;
  const arm = box(1.5, 0.08, 0.08, M.pole, x - side * 0.7, 7.1, z), bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), M.amber);
  bulb.position.set(x - side * 1.4, 6.98, z); g.add(p, arm, bulb);
  return g;
}

// زينة الشارع: حبل مثلثات ملوّنة بين العمارتين
function bunting(z) {
  const N = 26, pos = [], col = [], c = new THREE.Color(), y0 = R(7, 9.5), sag = R(1.2, 2.2), skew = R(-3, 3);
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 0.72) / N, tm = (t0 + t1) / 2;
    const P = (t) => [(-1 + 2 * t) * FACADE_X, y0 - sag * 4 * t * (1 - t), z + skew * (t - 0.5)];
    const a = P(t0), b = P(t1), m = P(tm);
    pos.push(...a, ...b, m[0], m[1] - 0.62, m[2]);
    c.set(CLOTH[i % CLOTH.length]); for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
}

function fruitCart(side, z) {
  const g = new THREE.Group();
  g.add(box(1.3, 0.12, 2.2, M.wood, 0, 0.95, 0), box(1.3, 0.3, 0.08, M.wood, 0, 1.1, 1.1), box(1.3, 0.3, 0.08, M.wood, 0, 1.1, -1.1));
  for (const zz of [-0.6, 0.6]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 14), M.wood); w.rotation.z = Math.PI / 2; w.position.set(side * -0.72, 0.5, zz); g.add(w); }
  const fr = [0xf08a24, 0xd9483b, 0xf2c230, 0x69a83f];
  for (let i = 0; i < 26; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), std(fr[Math.floor(i / 7) % 4])); s.position.set(R(-0.5, 0.5), 1.12 + R(0, 0.22), R(-0.95, 0.95)); g.add(s); }
  g.add(box(1.5, 0.06, 2.4, std(pick([0xb3261e, 0x1f6b4a])), 0, 2.4, 0));
  for (const [a, b] of [[-0.6, -1.05], [0.6, -1.05], [-0.6, 1.05], [0.6, 1.05]]) g.add(box(0.05, 1.4, 0.05, M.wood, a, 1.7, b));
  g.position.set(side * (ROAD_HALF + 1.5), 0.25, z); g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function makeChunk() {
  const g = new THREE.Group();
  const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HALF * 2, CHUNK), roadMat);
  road.rotation.x = -Math.PI / 2; road.position.z = -CHUNK / 2; road.receiveShadow = true; g.add(road);
  for (const s of [-1, 1]) {
    g.add(box(WALK_W, 0.25, CHUNK, walkMat, s * (ROAD_HALF + WALK_W / 2), 0.125, -CHUNK / 2, false));
    g.add(box(0.22, 0.27, CHUNK, curbMat, s * (ROAD_HALF + 0.1), 0.135, -CHUNK / 2, false));
    for (let z = 0; z > -CHUNK + 0.5;) {
      const w = Math.min(R(7, 11.5), CHUNK + z);
      if (w < 4) break;
      g.add(building(s, z, w)); z -= w + (rng() < 0.2 ? R(1.5, 3) : 0.05);
    }
    g.add(lamp(s, -R(4, 14)), lamp(s, -R(22, 34)));
    if (rng() < 0.75) g.add(palm(s * (ROAD_HALF + R(1.3, 2.2)), -R(3, CHUNK - 3)));
    if (rng() < 0.4) g.add(fruitCart(s, -R(6, CHUNK - 6)));
  }
  g.add(bunting(-R(6, 16)));
  if (rng() < 0.7) g.add(bunting(-R(22, 34)));
  return bake(g);
}
const chunks = [];
for (let i = 0; i < NCHUNK; i++) { const c = makeChunk(); c.position.z = -(i - 1) * CHUNK; world.add(c); chunks.push(c); }

// ---------- العربيات
function wheel(r, x, z, w = 0.24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 14), M.tyre);
  m.rotation.z = Math.PI / 2; m.position.set(x, r, z); m.castShadow = true;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, w + 0.02, 10), M.chrome); hub.rotation.z = Math.PI / 2; hub.position.copy(m.position);
  const g = new THREE.Group(); g.add(m, hub); g.userData.spin = [m, hub];
  return g;
}
function plate(band) {                          // لوحة مصرية
  const t = canvasTex(128, 64, (g) => {
    g.fillStyle = "#f4f4f0"; g.fillRect(0, 0, 128, 64); g.fillStyle = band; g.fillRect(0, 0, 128, 20);
    g.fillStyle = "#111"; g.font = "bold 13px Tahoma"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("مصر  EGYPT", 64, 11);
    g.font = "bold 30px Tahoma"; g.direction = "rtl";
    g.fillText(`${pick(["ب ط", "س م", "ر ق", "ن ه", "ع د"])} ${RI(1, 9)}${RI(0, 9)}${RI(0, 9)}${RI(0, 9)}`, 64, 43);
    g.strokeStyle = "#111"; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 125, 61);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.26), new THREE.MeshBasicMaterial({ map: t }));
}
const checkerTex = canvasTex(128, 16, (g) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? "#111" : "#f4f4f0"; g.fillRect(i * 8, j * 8, 8, 8); } });

function microbus() {
  const g = new THREE.Group(), stripe = std(pick([0x2d6cdf, 0xd94f3d, 0x2f9e6b, 0xe0a81c]));
  g.add(box(1.9, 1.55, 4.5, M.white, 0, 1.2, 0), box(1.92, 0.22, 4.52, stripe, 0, 0.95, 0), box(1.93, 0.5, 3.3, M.glass, 0, 1.55, -0.2));
  g.add(box(1.5, 0.55, 0.06, M.glass, 0, 1.55, 2.26), box(0.3, 0.16, 0.06, M.red, -0.72, 0.85, 2.27), box(0.3, 0.16, 0.06, M.red, 0.72, 0.85, 2.27));
  g.add(box(1.7, 0.1, 0.25, M.black, 0, 0.42, 2.3), box(1.5, 0.25, 2.2, M.wood, 0, 2.12, 0.4), box(0.7, 0.4, 0.9, std(0x2a5db0), -0.3, 2.44, 0.2), box(0.6, 0.3, 0.7, std(0xd9483b), 0.4, 2.4, 0.9));
  const p = plate("#e08a1a"); p.position.set(0, 0.62, 2.29); g.add(p);
  g.add(wheel(0.38, -0.86, 1.45), wheel(0.38, 0.86, 1.45), wheel(0.38, -0.86, -1.45), wheel(0.38, 0.86, -1.45));
  g.userData = { hw: 0.97, hl: 2.3 };
  return bake(g);
}
function taxi() {
  const g = new THREE.Group(), chk = new THREE.MeshStandardMaterial({ map: checkerTex, roughness: 0.6 });
  g.add(box(1.76, 0.62, 4.2, M.white, 0, 0.7, 0), box(1.5, 0.52, 2.0, M.glass, 0, 1.26, 0.15), box(1.54, 0.07, 2.04, M.white, 0, 1.55, 0.15));
  g.add(box(1.78, 0.14, 4.0, chk, 0, 0.82, 0), box(1.6, 0.14, 0.04, chk, 0, 0.82, 2.11), box(0.5, 0.2, 0.25, M.yellow, 0, 1.68, 0.1));
  g.add(box(0.34, 0.14, 0.06, M.red, -0.64, 0.86, 2.11), box(0.34, 0.14, 0.06, M.red, 0.64, 0.86, 2.11), box(1.8, 0.14, 0.2, M.black, 0, 0.42, 2.12));
  const p = plate("#e08a1a"); p.position.set(0, 0.6, 2.13); g.add(p);
  g.add(wheel(0.33, -0.8, 1.3), wheel(0.33, 0.8, 1.3), wheel(0.33, -0.8, -1.35), wheel(0.33, 0.8, -1.35));
  g.userData = { hw: 0.9, hl: 2.15 };
  return bake(g);
}
function pickup() {                             // ربع نقل محمّل بطيخ
  const g = new THREE.Group(), c = std(pick([0x2a5db0, 0xecebe4, 0x9a2f2a]), { roughness: 0.5 });
  g.add(box(1.8, 1.25, 1.5, c, 0, 1.1, -1.45), box(1.6, 0.5, 0.06, M.glass, 0, 1.4, -0.69), box(1.8, 0.2, 2.9, c, 0, 0.6, 0.75));
  g.add(box(0.08, 0.55, 2.9, c, -0.86, 0.95, 0.75), box(0.08, 0.55, 2.9, c, 0.86, 0.95, 0.75), box(1.8, 0.55, 0.08, c, 0, 0.95, 2.18));
  g.add(box(0.26, 0.14, 0.06, M.red, -0.7, 0.72, 2.23), box(0.26, 0.14, 0.06, M.red, 0.7, 0.72, 2.23));
  for (let i = 0; i < 13; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), M.melon); m.scale.z = 1.25; m.position.set(-0.52 + (i % 3) * 0.52, 1.02 + Math.floor(i / 9) * 0.5, -0.3 + (Math.floor(i / 3) % 3) * 0.82 + (i > 8 ? 0.4 : 0)); m.castShadow = true; g.add(m); }
  const p = plate("#c0392b"); p.position.set(0, 0.42, 2.24); g.add(p);
  g.add(wheel(0.36, -0.84, 1.5), wheel(0.36, 0.84, 1.5), wheel(0.36, -0.84, -1.45), wheel(0.36, 0.84, -1.45));
  g.userData = { hw: 0.92, hl: 2.25 };
  return bake(g);
}
function coin() {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 22), M.gold);
  m.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(m); g.position.y = 1.0;
  return g;
}
const bumpMat = std(0xffffff, { map: canvasTex(128, 16, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#151515" : "#f1c81d"; g.fillRect(i * 16, 0, 16, 16); } }, [3, 1]) });
function speedBump() {                          // المطب
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, ROAD_HALF * 2, 16, 1, false, 0, Math.PI), bumpMat);
  m.rotation.z = Math.PI / 2; m.position.y = -0.3; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m);
  return g;
}

// ---------- التوك توك
function tuktuk() {
  const g = new THREE.Group();
  g.add(box(1.46, 0.5, 2.5, M.black, 0, 0.62, 0), box(1.5, 0.12, 2.54, M.yellow, 0, 0.9, 0));
  g.add(box(1.46, 0.75, 0.08, M.black, 0, 1.2, 1.2), box(0.08, 0.75, 1.3, M.black, -0.7, 1.2, 0.55), box(0.08, 0.75, 1.3, M.black, 0.7, 1.2, 0.55));
  for (const [x, z] of [[-0.68, 1.18], [0.68, 1.18], [-0.66, -0.75], [0.66, -0.75]]) g.add(box(0.07, 1.1, 0.07, M.black, x, 1.75, z));
  g.add(box(1.62, 0.1, 2.5, M.yellow, 0, 2.32, 0.12), box(1.5, 0.08, 2.3, M.black, 0, 2.24, 0.12));
  const back = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.62), new THREE.MeshBasicMaterial({ map: canvasTex(256, 116, (c) => {
    c.fillStyle = "#151515"; c.fillRect(0, 0, 256, 116); c.strokeStyle = "#ffd21f"; c.lineWidth = 5; c.strokeRect(6, 6, 244, 104);
    c.fillStyle = "#ffd21f"; c.font = "bold 46px Tahoma, Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.direction = "rtl"; c.fillText("وسّع يا باشا", 128, 60, 220);
  }) }));
  back.position.set(0, 1.2, 1.245); g.add(back);
  g.add(box(1.3, 0.5, 0.04, std(0x24303c, { transparent: true, opacity: 0.55, roughness: 0.1 }), 0, 1.92, 1.2));
  g.add(box(0.2, 0.12, 0.05, M.red, -0.58, 0.72, 1.26), box(0.2, 0.12, 0.05, M.red, 0.58, 0.72, 1.26), box(1.5, 0.1, 0.1, M.chrome, 0, 0.4, 1.28));
  const pl = plate("#2a5db0"); pl.scale.setScalar(0.8); pl.position.set(0, 0.56, 1.262); g.add(pl);
  // السواق والدركسيون
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), M.skin); head.position.set(0, 1.78, -0.25);
  g.add(head, box(0.56, 0.6, 0.3, std(0x2f6fd0), 0, 1.34, -0.25), box(0.9, 0.05, 0.05, M.chrome, 0, 1.45, -0.8));
  g.add(box(1.3, 0.7, 0.05, std(0x9fc4d8, { transparent: true, opacity: 0.35, roughness: 0.05 }), 0, 1.75, -0.8));
  g.add(box(0.9, 0.55, 0.7, M.black, 0, 0.75, -1.4), box(0.5, 0.1, 0.72, M.yellow, 0, 1.04, -1.4));
  const hl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), M.amber); hl.position.set(0, 0.95, -1.78); g.add(hl);
  const ant = box(0.02, 1.0, 0.02, M.chrome, 0.72, 2.85, 1.1), ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), M.red); ball.position.set(0.72, 3.36, 1.1);
  g.add(ant, ball);
  const w1 = wheel(0.3, -0.78, 0.75), w2 = wheel(0.3, 0.78, 0.75), w3 = wheel(0.3, 0, -1.45, 0.2);
  g.add(w1, w2, w3); g.userData.wheels = [w1, w2, w3];
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return bake(g, (o) => o.parent.userData.spin);                // العجل بيفضل لوحده عشان يلف
}
const tuk = tuktuk(); scene.add(tuk);

// دخان الشكمان
const puffs = [];
for (let i = 0; i < 14; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 6), new THREE.MeshBasicMaterial({ color: 0xe9e2d6, transparent: true, opacity: 0, depthWrite: false, fog: false })); p.userData.life = 0; scene.add(p); puffs.push(p); }

// ---------- الصوت، كله متولّد بـWebAudio
const sfx = { ctx: null, muted: false, eng: null };
function audioInit() {
  if (sfx.ctx || CAP) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), eg = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o1.type = "sawtooth"; o2.type = "square"; lp.type = "lowpass"; lp.frequency.value = 520; eg.gain.value = 0.0;
    lfo.type = "square"; lfo.frequency.value = 11; lg.gain.value = 0.05;
    o1.connect(lp); o2.connect(lp); lp.connect(eg); eg.connect(master); lfo.connect(lg); lg.connect(eg.gain);
    o1.start(); o2.start(); lfo.start();
    Object.assign(sfx, { ctx, master, eng: { o1, o2, eg, lfo } });
  } catch (e) { /* من غير صوت */ }
}
function tone(type, f0, f1, dur, vol = 0.25, delay = 0) {
  if (!sfx.ctx || sfx.muted) return;
  const t = sfx.ctx.currentTime + delay, o = sfx.ctx.createOscillator(), g = sfx.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(sfx.master); o.start(t); o.stop(t + dur + 0.02);
}
const honk = () => { for (const d of [0, 0.22]) { tone("square", 415, 415, 0.16, 0.16, d); tone("square", 523, 523, 0.16, 0.16, d); } };
function crashSound() {
  if (!sfx.ctx || sfx.muted) return;
  const n = sfx.ctx.sampleRate * 0.5, buf = sfx.ctx.createBuffer(1, n, sfx.ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.2);
  const s = sfx.ctx.createBufferSource(), lp = sfx.ctx.createBiquadFilter(); lp.frequency.value = 900; s.buffer = buf; s.connect(lp); lp.connect(sfx.master); s.start();
  tone("sine", 120, 35, 0.4, 0.5);
}

// ---------- حالة اللعبة
const S = { state: "menu", dist: 0, speed: 16, lane: 1, x: 0, y: 0, vy: 0, lean: 0, fare: 0, t: 0, rows: [], cars: [], coins: [], bumps: [], cursor: -60, nextBump: -220, shake: 0, puffT: 0 };
const V_TRAFFIC = 7;
const $ = (id) => document.getElementById(id);
let best = 0; try { best = Number(localStorage.getItem("tuktuk-best") || 0); } catch (e) { /* خاص */ }

function reset() {
  for (const o of [...S.cars, ...S.coins]) traffic.remove(o);
  for (const b of S.bumps) world.remove(b);
  Object.assign(S, { dist: 0, speed: 16, lane: 1, x: 0, y: 0, vy: 0, lean: 0, fare: 0, t: 0, rows: [], cars: [], coins: [], bumps: [], cursor: -60, nextBump: -220, shake: 0 });
  chunks.forEach((c, i) => { c.position.z = -(i - 1) * CHUNK; });
  tuk.rotation.set(0, 0, 0);
}
function start() { reset(); S.state = "play"; $("menu").hidden = true; $("over").hidden = true; audioInit(); if (sfx.ctx) sfx.ctx.resume(); }
function gameOver() {
  S.state = "over"; S.shake = 0.6; crashSound();
  const d = Math.floor(S.dist); if (d > best) { best = d; try { localStorage.setItem("tuktuk-best", String(best)); } catch (e) { /* خاص */ } }
  $("oDist").textContent = d; $("oFare").textContent = S.fare; $("oBest").textContent = `أحسن مسافة ليك: ${best} متر`;
  S.overT = 0;
}

function spawnRow(z) {
  const prev = S.rows[S.rows.length - 1];
  const blocked = [false, false, false], nBlock = rng() < 0.42 + Math.min(0.25, S.dist / 4000) ? 2 : 1;
  let free = RI(0, 2);
  if (prev && Math.abs(free - prev.free) === 2 && rng() < 0.5) free = 1;   // مايبقاش التحويل كله قفز حارتين
  const others = [0, 1, 2].filter((l) => l !== free);
  if (nBlock === 2) others.forEach((l) => { blocked[l] = true; }); else blocked[pick(others)] = true;
  const row = { z, blocked, free, cars: [] };
  blocked.forEach((b, l) => {
    if (!b) return;
    const c = pick([microbus, taxi, pickup, microbus, taxi])();
    c.position.set(LANES[l] + R(-0.12, 0.12), 0, z + R(-1.2, 1.2)); traffic.add(c); S.cars.push(c); row.cars.push(c);
  });
  if (prev && rng() < 0.8) for (let i = 0; i < 5; i++) {                   // أجرة قبل الصف، في الحارة الفاضية
    const c = coin(); c.position.x = LANES[free]; c.position.z = z + 6 + i * 2.7; traffic.add(c); S.coins.push(c);
  }
  S.rows.push(row);
}

function autopilot() {
  const rel = S.speed - V_TRAFFIC, look = Math.max(17, rel * 0.95 + 8);
  for (const row of S.rows) {
    const rz = row.z + S.dist;
    if (rz > 3 || rz < -look) continue;
    if (row.blocked[S.lane] || (rz < -look * 0.5 && S.lane !== row.free)) S.lane = row.free;
    break;
  }
}

function update(dt) {
  S.t += dt;
  if (S.state === "play") {
    if (AUTO && autoOn) autopilot();
    S.speed = Math.min(34, S.speed + dt * 0.42);
    S.dist += S.speed * dt;
    const tx = LANES[S.lane], k = 1 - Math.exp(-dt * 13);
    S.lean += ((tx - S.x) * 0.16 - S.lean) * (1 - Math.exp(-dt * 10));
    S.x += (tx - S.x) * k;
    S.vy -= 26 * dt; S.y += S.vy * dt; if (S.y < 0) { S.y = 0; S.vy = 0; }
    // صفوف العربيات
    S.cursor -= V_TRAFFIC * dt;
    const gap = Math.max(17, 30 - S.dist / 160);
    while (S.cursor - gap + S.dist > -190) { S.cursor -= gap; spawnRow(S.cursor); }
    for (const row of S.rows) row.z -= V_TRAFFIC * dt;
    while (S.rows.length && S.rows[0].z + S.dist > 16) S.rows.shift();
    for (let i = S.cars.length - 1; i >= 0; i--) {
      const c = S.cars[i]; c.position.z -= V_TRAFFIC * dt;
      const rz = c.position.z + S.dist;
      if (rz > 16) { traffic.remove(c); S.cars.splice(i, 1); continue; }
      if (Math.abs(rz) < c.userData.hl + 1.15 && Math.abs(c.position.x - S.x) < c.userData.hw + 0.62 && S.y < 1.2) gameOver();
    }
    for (let i = S.coins.length - 1; i >= 0; i--) {
      const c = S.coins[i]; c.position.z -= V_TRAFFIC * dt; c.rotation.y += dt * 5;
      const rz = c.position.z + S.dist;
      if (Math.abs(rz) < 1.3 && Math.abs(c.position.x - S.x) < 1.0) { S.fare += 5; tone("sine", 990, 1480, 0.12, 0.2); traffic.remove(c); S.coins.splice(i, 1); }
      else if (rz > 12) { traffic.remove(c); S.coins.splice(i, 1); }
    }
    // المطبات
    if (S.nextBump + S.dist > -190) { const b = speedBump(); b.position.z = S.nextBump; world.add(b); S.bumps.push(b); S.nextBump -= R(150, 260); }
    for (let i = S.bumps.length - 1; i >= 0; i--) {
      const b = S.bumps[i], rz = b.position.z + S.dist;
      if (!b.userData.hit && rz > -0.8) { b.userData.hit = true; S.vy = 6.2; S.speed *= 0.93; S.shake = 0.25; tone("sine", 95, 40, 0.22, 0.45); $("toast").classList.add("on"); S.toastT = S.t; }
      if (rz > 20) { world.remove(b); S.bumps.splice(i, 1); }
    }
    if (S.toastT && S.t - S.toastT > 0.7) { $("toast").classList.remove("on"); S.toastT = 0; }
    $("dist").textContent = `${Math.floor(S.dist)} م`; $("fare").textContent = `${S.fare} ج`;
  }
  if (S.state === "over" && S.overT >= 0) { S.overT += dt; if (S.overT > 0.65) { $("over").hidden = false; S.overT = -1; } }
  const moving = S.state === "play", menuDrift = S.state === "menu" ? S.t * 6 : 0;
  world.position.z = S.dist + menuDrift; traffic.position.z = S.dist;
  for (const c of chunks) if (c.position.z + world.position.z > CHUNK + 12) c.position.z -= NCHUNK * CHUNK;
  for (const b of S.bumps) { /* المطب ثابت في الشارع */ void b; }
  // التوك توك
  const sp = moving ? S.speed : S.state === "menu" ? 6 : 0;
  tuk.position.set(S.x, S.y + Math.sin(S.t * 31) * 0.012 * (sp / 16), 0);
  tuk.rotation.z = -S.lean * 0.5; tuk.rotation.y = -S.lean * 0.45; tuk.rotation.x = S.vy * 0.012;
  if (S.state === "over") { tuk.rotation.y += dt * 4 * S.shake; }
  for (const w of tuk.userData.wheels) w.userData.spin.forEach((m) => { m.rotation.x -= sp * dt / 0.3; });
  S.puffT -= dt;
  if (sp > 0 && S.puffT <= 0) { S.puffT = 0.09; const p = puffs.find((q) => q.userData.life <= 0); if (p) { p.userData.life = 0.7; p.position.set(S.x - 0.5, 0.42 + S.y, 1.35); p.scale.setScalar(0.6); } }
  for (const p of puffs) if (p.userData.life > 0) { p.userData.life -= dt; p.position.z += dt * (sp * 0.45 + 1.5); p.position.y += dt * 0.9; p.scale.addScalar(dt * 1.6); p.material.opacity = Math.max(0, p.userData.life) * 0.32; }
  if (sfx.eng) {
    const on = moving && !sfx.muted;
    sfx.eng.eg.gain.setTargetAtTime(on ? 0.09 : 0, sfx.ctx.currentTime, 0.08);
    sfx.eng.o1.frequency.value = 42 + S.speed * 2.1; sfx.eng.o2.frequency.value = 21 + S.speed * 1.05; sfx.eng.lfo.frequency.value = 8 + S.speed * 0.42;
  }
  // الكاميرا
  S.shake = Math.max(0, S.shake - dt * 1.4);
  const sh = S.shake * 0.35, sx = Math.sin(S.t * 71) * sh, sy = Math.cos(S.t * 83) * sh;
  if (camMode === "hero") {                       // لقطة قريبة بتلف حوالين التوك توك
    const a = S.t * 0.42 + 0.6; camera.position.set(S.x + Math.sin(a) * 5.4, 1.5 + Math.sin(S.t * 0.5) * 0.35, Math.cos(a) * 5.4 - 0.4);
    camera.lookAt(S.x, 1.25, -0.6);
  } else if (camMode === "top") {                 // من فوق الشارع
    camera.position.set(S.x * 0.4 + 9, 24, 10); camera.lookAt(S.x * 0.4 - 1, 0, -22);
  } else if (camMode === "low") {                 // من على الأسفلت، ورا التوك توك
    camera.position.set(S.x * 0.9 + 1.5, 0.75, 4.6); camera.lookAt(S.x * 0.9, 1.5, -14);
  } else {
    camera.position.set(S.x * 0.72 + sx, 4.5 + sy + S.y * 0.3, 7.9); camera.lookAt(S.x * 0.8, 1.6, -12);
  }
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 70 : 52; camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();

// ---------- التحكم
const steer = (d) => { if (S.state === "play" && !AUTO) S.lane = Math.max(0, Math.min(2, S.lane + d)); };
addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") steer(-1);
  else if (e.key === "ArrowRight" || e.key === "d") steer(1);
  else if (e.key === " ") { honk(); if (S.state !== "play") start(); }
  else if (e.key === "Enter" && S.state !== "play") start();
});
let touch = null;
canvas.addEventListener("pointerdown", (e) => { touch = { x: e.clientX, moved: false }; });
canvas.addEventListener("pointermove", (e) => { if (touch && !touch.moved && Math.abs(e.clientX - touch.x) > 28) { steer(e.clientX > touch.x ? 1 : -1); touch.moved = true; } });
canvas.addEventListener("pointerup", (e) => { if (touch && !touch.moved) steer(e.clientX > innerWidth / 2 ? 1 : -1); touch = null; });
$("start").onclick = start; $("again").onclick = start;
$("mute").onclick = () => { sfx.muted = !sfx.muted; $("mute").textContent = sfx.muted ? "الصوت: مقفول" : "الصوت: شغال"; };

// ---------- اللوب
if (CAP) {
  $("menu").hidden = true;
  window.__cap = {
    start, setCam: (m) => { camMode = m; }, setAuto: (v) => { autoOn = v; }, state: () => ({ state: S.state, dist: S.dist, fare: S.fare, speed: S.speed }),
    step(n = 1, dt = 1 / 30) { for (let i = 0; i < n; i++) update(dt); renderer.render(scene, camera); },
    shot: (q = 0.92) => canvas.toDataURL("image/jpeg", q),
  };
  renderer.render(scene, camera);
} else {
  if (AUTO) start();
  let last = performance.now();
  const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; update(dt); renderer.render(scene, camera); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
