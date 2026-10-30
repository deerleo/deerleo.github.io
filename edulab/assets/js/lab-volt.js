/* EduLab · VoltLab 电学实验台（volt）
 * 章节（22）：串并联 / 欧姆定律 / 测电动势内阻 / 伏安特性 / RC 充放电 / 断电自感 /
 *   LC 振荡 / 桥式整流滤波 / 惠斯通电桥 / RLC 谐振 / 变压器 / 二极管单向导电 /
 *   三极管光控路灯 / 直流电动机 / 短路与保险丝 / 稳压二极管 / 焦耳定律 / 电阻定律 /
 *   多用电表 / 电磁铁 / 太阳能电池 / 空白实验台
 * 架构：节点电压法（MNA）求解内核 + 程序化 3D 元件 + 电路示意图。程序化建模，无外部模型。
 */
import {
  THREE, TAU, clamp,
  loadTexture, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite,
} from './edu-core.js';

const lerp = (a, b, t) => a + (b - a) * t;

/* ================= 基础 ================= */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在铺设电学实验台…');
const app = createApp({
  container: stage,
  fov: 40, near: 0.05, far: 80,
  cameraPos: [0, 3.6, 4.8], target: [0, 1.3, 0],
  minDistance: 0.8, maxDistance: 30,
  keepBackground: true,
});
const { scene, camera, controls } = app;

const M = (color, rough = 0.8, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
const cyl = (rt, rb, h, mat, seg = 18) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function lbl(text, color = '#ffd9a8', scale = 0.0042) {
  return makeTextSprite(text, { fontSize: 30, color, scale, bg: 'rgba(16,20,26,0.62)' });
}
const TABLE_Y = 1.08;

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
  if (!g.userData.built) { build(g); g.userData.built = true; }
  g.visible = true;
  activeScene = g;
  return g;
}

/* ================= MNA 求解内核 ================= */

let CIR = null;   // { N, els: Map, dt }
const G_MIN = 1e-9;

function linSolve(A, b) {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let piv = i, mx = Math.abs(A[i][i]);
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > mx) { mx = Math.abs(A[r][i]); piv = r; }
    if (piv !== i) { const t = A[i]; A[i] = A[piv]; A[piv] = t; const tb = b[i]; b[i] = b[piv]; b[piv] = tb; }
    const d = A[i][i] || 1e-12;
    for (let r = i + 1; r < n; r++) {
      const f = A[r][i] / d;
      if (!f) continue;
      for (let c = i; c < n; c++) A[r][c] -= f * A[i][c];
      b[r] -= f * b[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c];
    x[i] = s / (A[i][i] || 1e-12);
  }
  return x;
}

/** 一次线性求解（电压源类元件以支路电流为未知量） */
function solveOnce() {
  const els = [...CIR.els.values()];
  const N = CIR.N;
  const vsrc = els.filter((e) => e.kind === 'bat' || e.kind === 'ac' || e.kind === 'emf');
  const m = N - 1 + vsrc.length;
  const A = Array.from({ length: m }, () => new Array(m).fill(0));
  const b = new Array(m).fill(0);

  els.forEach((e) => {
    if (e.blown) return;
    const { a, b: nb } = e;
    if (e.kind === 'bat' || e.kind === 'ac' || e.kind === 'emf') {
      const off = N - 1 + vsrc.indexOf(e);
      if (a > 0) A[a - 1][off] += 1;
      if (nb > 0) A[nb - 1][off] -= 1;
      const row = off;
      if (a > 0) A[row][a - 1] += 1;
      if (nb > 0) A[row][nb - 1] -= 1;
      A[row][off] -= e.r || 0;   // v_a − v_b − I·r = E（I 为 KCL 变量，放电时为负）
      b[row] += e.E;
      return;
    }
    let g = 0, Ieq = 0;
    if (e.kind === 'cap') { g = e.C / CIR.dt; Ieq = g * (e.vc || 0); }
    else if (e.kind === 'ind') { g = CIR.dt / Math.max(e.L, 1e-6); Ieq = -(e.iL || 0); }
    else if (e.kind === 'dio' || e.kind === 'zen') { g = e.gN || G_MIN; Ieq = -(e.iEq || 0); }
    else g = 1 / Math.max(e.R, 1e-9);
    if (a > 0) { A[a - 1][a - 1] += g; if (nb > 0) A[a - 1][nb - 1] -= g; b[a - 1] += Ieq; }
    if (nb > 0) { A[nb - 1][nb - 1] += g; if (a > 0) A[nb - 1][a - 1] -= g; b[nb - 1] -= Ieq; }
  });

  const x = linSolve(A, b);
  els.forEach((e) => {
    const va = e.a > 0 ? x[e.a - 1] : 0;
    const vb = e.b > 0 ? x[e.b - 1] : 0;
    e.V = va - vb;
    if (e.kind === 'bat' || e.kind === 'ac' || e.kind === 'emf') {
      e.I = x[N - 1 + vsrc.indexOf(e)];
    } else if (e.kind === 'cap') {
      e.I = (e.C / CIR.dt) * (e.V - (e.vc || 0));
    } else if (e.kind === 'ind') {
      e.iL = (e.iL || 0) + (CIR.dt / Math.max(e.L, 1e-6)) * e.V;
      e.I = e.iL;
    } else if (e.kind === 'dio' || e.kind === 'zen') {
      e.I = e._i || 0;
    } else {
      e.I = e.V / Math.max(e.R, 1e-9);
    }
  });
  els.forEach((e) => { if (e.kind === 'cap') e.vc = e.V; });
}

/** 二极管 / 稳压管牛顿迭代 */
function solveCircuit() {
  if (!CIR) return;
  const els = [...CIR.els.values()];
  const hasNL = els.some((e) => e.kind === 'dio' || e.kind === 'zen');
  if (!hasNL) { solveOnce(); return; }
  els.forEach((e) => {
    if (e.kind === 'dio' && e.vd === undefined) e.vd = (e.VF || 0.7) + 0.05;
    if (e.kind === 'zen' && e.vd === undefined) e.vd = -(e.VZ || 5.1) - 0.3;
  });
  for (let it = 0; it < 24; it++) {
    els.forEach((e) => {
      if (e.kind === 'dio') {
        // 分段线性：正向 VF 门槛 + 5Ω 动态电阻；反向截止（硅管 0.7V，LED 约 1.8~3V）
        const VF = e.VF || 0.7;
        const vd = e.vd !== undefined ? e.vd : VF + 0.05;
        let g, i;
        if (vd > VF) { g = 1 / 5; i = (vd - VF) / 5; }
        else { g = G_MIN; i = 0; }
        e.gN = g; e.iEq = i - g * vd; e._i = i;
      } else if (e.kind === 'zen') {
        const VZ = e.VZ || 5.1, rs = e.rs || 6;
        const vd = e.vd || 0;
        let g, i;
        if (vd > 0.75) { g = 8; i = 8 * (vd - 0.75); }
        else if (vd > -VZ) { g = G_MIN; i = 0; }
        else { g = 1 / rs; i = (vd + VZ) / rs; }
        e.gN = g; e.iEq = i - g * vd; e._i = i;
      }
    });
    solveOnce();
    let err = 0;
    els.forEach((e) => {
      if (e.kind === 'dio' || e.kind === 'zen') {
        const stepMax = e.kind === 'zen' ? 0.5 : 0.4;
        const vn = clamp(e.V, (e.vd || 0) - stepMax, (e.vd || 0) + stepMax);
        err = Math.max(err, Math.abs(vn - (e.vd || 0)));
        e.vd = vn;
      }
    });
    if (err < 1e-4) break;
  }
}

/* ================= 3D 元件工厂 ================= */

const MATS = {
  dark: () => M(0x2e343b, 0.6, 0.3),
  metal: () => M(0x9aa1a8, 0.35, 0.7),
  red: () => M(0xc23b2e, 0.5),
  black: () => M(0x24282e, 0.6),
};
let benchMat;

function buildBenchScene(g, tex) {
  benchMat = new THREE.MeshStandardMaterial({ map: tex.plank, normalMap: tex.plankN, color: 0x8a8f96, roughness: 0.8, metalness: 0.1 });
  const top = box(5.6, 0.1, 1.8, benchMat);
  top.position.y = TABLE_Y - 0.05;
  g.add(top);
  const apron = box(5.5, 0.06, 1.7, M(0x3a4048, 0.8));
  apron.position.y = TABLE_Y - 0.13;
  g.add(apron);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(24, 9), M(0x3a4149, 0.95));
  wall.position.set(0, 4.4, -2.4);
  g.add(wall);
  g.add(new THREE.HemisphereLight(0xdfe8f2, 0x5a5248, 0.85));
  const key = new THREE.DirectionalLight(0xfff2e0, 1.9);
  key.position.set(2, 5, 3);
  g.add(key);
  const fill2 = new THREE.DirectionalLight(0xcfe0f5, 0.6);
  fill2.position.set(-3, 4, -2);
  g.add(fill2);
}

/* 电子流小珠 */
function makeBeads(path, color = 0x66ccff) {
  const curve = new THREE.CatmullRomCurve3(path);
  const n = 6;
  const beads = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.015, 6, 5);
  const mat = new THREE.MeshBasicMaterial({ color });
  const meshes = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(geo, mat);
    beads.add(s);
    meshes.push(s);
  }
  beads.userData = { curve, phase: 0, meshes };
  return beads;
}
function stepBeads(wire, current, dt) {
  const u = wire.userData;
  const speed = clamp(current * 0.5, -1.6, 1.6);
  u.phase = (u.phase + speed * dt) % 1;
  u.meshes.forEach((s, i) => {
    const t = ((i / u.meshes.length) + u.phase + 1) % 1;
    s.position.copy(u.curve.getPointAt(clamp(t, 0, 1)));
    s.visible = Math.abs(current) > 0.015;
  });
}

const ELVIS = new Map();   // id → {grp, parts}

function addElement(g, spec) {
  const grp = new THREE.Group();
  const parts = {};
  const { t, x, z, label } = spec;
  switch (t) {
    case 'bat': {
      const body = box(0.56, 0.3, 0.3, M(0x2b4a3a, 0.5, 0.2));
      body.position.y = 0.15;
      const cap1 = cyl(0.045, 0.045, 0.1, MATS.red(), 12);
      cap1.position.set(-0.22, 0.33, 0);
      const cap2 = cyl(0.045, 0.045, 0.1, MATS.black(), 12);
      cap2.position.set(0.22, 0.33, 0);
      grp.add(body, cap1, cap2);
      break;
    }
    case 'sw': {
      const base = box(0.44, 0.09, 0.24, M(0x3d444c, 0.6));
      base.position.y = 0.045;
      const lever = new THREE.Group();
      const arm = box(0.34, 0.045, 0.06, MATS.metal());
      arm.position.x = 0.17;
      const knob = cyl(0.035, 0.035, 0.05, MATS.red(), 10);
      knob.rotation.x = Math.PI / 2;
      knob.position.x = 0.32;
      lever.add(arm, knob);
      lever.position.set(-0.15, 0.1, 0);
      grp.add(base, lever);
      parts.lever = lever;
      break;
    }
    case 'bulb': {
      const stand = cyl(0.1, 0.13, 0.05, MATS.dark(), 16);
      stand.position.y = 0.025;
      const stem = cyl(0.03, 0.03, 0.09, MATS.metal(), 10);
      stem.position.y = 0.09;
      const holder = cyl(0.055, 0.055, 0.08, M(0x8a9096, 0.4, 0.6), 14);
      holder.position.y = 0.17;
      const glass = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12),
        new THREE.MeshPhysicalMaterial({ color: 0xcfe2ee, roughness: 0.05, transparent: true, opacity: 0.28 }));
      glass.position.y = 0.3;
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xffdca0, emissive: 0xffa030, emissiveIntensity: 0 }));
      core.position.y = 0.3;
      grp.add(stand, stem, holder, glass, core);
      parts.core = core;
      break;
    }
    case 'gauge': {
      const body = cyl(0.16, 0.18, 0.09, M(0x333a42, 0.5, 0.3), 24);
      body.rotation.x = Math.PI / 2;
      body.position.y = 0.1;
      const dial = makeDial(spec.sub || 'A', spec.range || '');
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.14, 24), new THREE.MeshBasicMaterial({ map: dial.tex }));
      face.position.set(0, 0.1, 0.047);
      const needle = new THREE.Group();
      const nbar = box(0.012, 0.11, 0.008, MATS.red());
      nbar.geometry.translate(0, 0.055, 0);
      needle.add(nbar);
      needle.position.set(0, 0.1, 0.052);
      needle.rotation.z = Math.PI * 0.78;
      grp.add(body, face, needle);
      parts.needle = needle;
      break;
    }
    case 'rheo': {
      const base = box(0.62, 0.07, 0.22, MATS.dark());
      base.position.y = 0.035;
      const tube = cyl(0.05, 0.05, 0.5, M(0xb8a06a, 0.6, 0.3), 12);
      tube.rotation.z = Math.PI / 2;
      tube.position.y = 0.16;
      grp.add(base, tube);
      for (let i = 0; i < 14; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.007, 6, 16), M(0xa06830, 0.7, 0.2));
        ring.rotation.y = Math.PI / 2;
        ring.position.set(-0.24 + i * 0.037, 0.16, 0);
        grp.add(ring);
      }
      const slider = new THREE.Group();
      const sArm = box(0.05, 0.1, 0.05, MATS.metal());
      sArm.position.y = 0.2;
      const sKnob = cyl(0.045, 0.045, 0.06, MATS.red(), 12);
      sKnob.rotation.x = Math.PI / 2;
      sKnob.position.y = 0.27;
      slider.add(sArm, sKnob);
      slider.position.x = 0.15;
      grp.add(slider);
      parts.slider = slider;
      break;
    }
    case 'res': {
      const body = cyl(0.045, 0.045, 0.24, M(0xd8c9a0, 0.6), 12);
      body.rotation.z = Math.PI / 2;
      body.position.y = 0.09;
      grp.add(body);
      [[0xe8674a, -0.07], [0x2b2b2b, 0], [0xc9a227, 0.07]].forEach(([c, dx]) => {
        const band = cyl(0.05, 0.05, 0.025, M(c, 0.5), 12);
        band.rotation.z = Math.PI / 2;
        band.position.set(dx, 0.09, 0);
        grp.add(band);
      });
      break;
    }
    case 'cap': {
      const body = cyl(0.07, 0.07, 0.26, M(0x35424e, 0.5, 0.3), 14);
      body.position.y = 0.16;
      const stripe = cyl(0.072, 0.072, 0.05, M(0xd8d3c8, 0.5), 14);
      stripe.position.y = 0.24;
      grp.add(body, stripe);
      break;
    }
    case 'ind': {
      const core = box(0.34, 0.16, 0.14, M(0x5a5f66, 0.5, 0.5));
      core.position.y = 0.08;
      grp.add(core);
      for (let i = 0; i < 5; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 8, 18), M(0xb06838, 0.7, 0.1));
        ring.position.set(-0.12 + i * 0.06, 0.16, 0);
        grp.add(ring);
      }
      break;
    }
    case 'dio':
    case 'led': {
      const body = cyl(0.032, 0.032, 0.16, t === 'led' ? M(0xd05a3a, 0.4) : M(0x2b3138, 0.5, 0.3), 12);
      body.rotation.z = Math.PI / 2;
      body.position.y = 0.07;
      const bandm = cyl(0.035, 0.035, 0.025, MATS.black(), 12);
      bandm.rotation.z = Math.PI / 2;
      bandm.position.set(0.05, 0.07, 0);
      grp.add(body, bandm);
      if (t === 'led') {
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xff5a3a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        glow.position.y = 0.07;
        grp.add(glow);
        parts.glow = glow;
      }
      break;
    }
    case 'motor': {
      const body = cyl(0.1, 0.1, 0.22, M(0x4a525a, 0.5, 0.5), 18);
      body.rotation.x = Math.PI / 2;
      body.position.y = 0.12;
      const rotor = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const blade = box(0.02, 0.16, 0.045, MATS.red());
        blade.position.y = 0.08;
        const holder = new THREE.Group();
        holder.add(blade);
        holder.rotation.z = i * TAU / 3;
        rotor.add(holder);
      }
      const axle = cyl(0.015, 0.015, 0.1, MATS.metal(), 8);
      rotor.add(axle);
      rotor.position.y = 0.26;
      grp.add(body, rotor);
      parts.rotor = rotor;
      break;
    }
    case 'fuse': {
      const clip1 = box(0.05, 0.1, 0.06, MATS.metal());
      clip1.position.set(-0.16, 0.05, 0);
      const clip2 = clip1.clone();
      clip2.position.x = 0.16;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 12),
        new THREE.MeshPhysicalMaterial({ color: 0xd8e4ea, roughness: 0.05, transparent: true, opacity: 0.3 }));
      tube.rotation.z = Math.PI / 2;
      tube.position.y = 0.08;
      const fw = box(0.3, 0.008, 0.008, M(0xb8a050, 0.6, 0.3));
      fw.position.y = 0.08;
      grp.add(clip1, clip2, tube, fw);
      parts.wire = fw;
      break;
    }
    case 'solar': {
      const stand = cyl(0.04, 0.05, 0.14, MATS.dark(), 10);
      stand.position.y = 0.07;
      const panel = box(0.42, 0.26, 0.03, new THREE.MeshStandardMaterial({ color: 0x1a3a6a, roughness: 0.3, metalness: 0.4 }));
      panel.position.y = 0.27;
      panel.rotation.x = -0.35;
      grp.add(stand, panel);
      for (let i = 0; i < 3; i++) {
        const line = box(0.36, 0.014, 0.005, M(0xd8e0ea, 0.4));
        line.position.set(0, 0.21 + i * 0.06, 0.018);
        line.rotation.x = -0.35;
        grp.add(line);
      }
      parts.panel = panel;
      break;
    }
    case 'mag': {
      const core = cyl(0.05, 0.05, 0.34, M(0x8a9096, 0.4, 0.7), 14);
      core.position.y = 0.17;
      const coil = cyl(0.085, 0.085, 0.2, M(0xa06838, 0.7, 0.1), 16);
      coil.position.y = 0.2;
      grp.add(core, coil);
      parts.core = core;
      const nails = [];
      for (let i = 0; i < 6; i++) {
        const nail = cyl(0.012, 0.012, 0.14, MATS.metal(), 8);
        nail.rotation.z = Math.PI / 2;
        nail.position.set(0.12, 0.06, 0);
        grp.add(nail);
        nails.push(nail);
      }
      parts.nails = nails;
      break;
    }
    case 'lamp': {
      const pole = cyl(0.025, 0.03, 0.62, MATS.dark(), 10);
      pole.position.y = 0.31;
      const arm = box(0.26, 0.03, 0.03, MATS.dark());
      arm.position.set(0.11, 0.62, 0);
      const shade = cyl(0.09, 0.15, 0.1, M(0x4a525a, 0.5, 0.3), 16);
      shade.position.set(0.22, 0.57, 0);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xfff2cc, emissive: 0xffb050, emissiveIntensity: 0 }));
      bulb.position.set(0.22, 0.5, 0);
      grp.add(pole, arm, shade, bulb);
      parts.bulb = bulb;
      break;
    }
    case 'thermo': {
      const cup = cyl(0.085, 0.075, 0.2, M(0xd8d3c8, 0.7), 16);
      cup.position.y = 0.1;
      const tm = box(0.03, 0.34, 0.02, M(0xe8eaee, 0.5));
      tm.position.set(0.02, 0.28, 0);
      const col = box(0.012, 0.16, 0.012, MATS.red());
      col.geometry.translate(0, 0.08, 0);
      col.position.set(0.02, 0.16, 0.012);
      grp.add(cup, tm, col);
      parts.col = col;
      break;
    }
    case 'mm': {
      const body = box(0.5, 0.3, 0.3, M(0xe8b23a, 0.5));
      body.position.y = 0.15;
      const dial = makeDial('Ω', '', true);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.24), new THREE.MeshBasicMaterial({ map: dial.tex }));
      face.position.set(0, 0.2, 0.152);
      const needle = new THREE.Group();
      const nbar = box(0.01, 0.08, 0.006, MATS.black());
      nbar.geometry.translate(0, 0.04, 0);
      needle.add(nbar);
      needle.position.set(0, 0.18, 0.156);
      needle.rotation.z = Math.PI * 0.78;
      grp.add(body, face, needle);
      parts.needle = needle;
      parts.dial = dial;
      break;
    }
    case 'ac': {
      const body = box(0.5, 0.26, 0.3, M(0x44505e, 0.6, 0.2));
      body.position.y = 0.13;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), new THREE.MeshBasicMaterial({ map: makeWaveLabel(), transparent: true }));
      face.position.set(0, 0.16, 0.152);
      grp.add(body, face);
      break;
    }
    case 'xfmr': {
      const core = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 10, 28), M(0x8a8f96, 0.45, 0.6));
      core.position.y = 0.22;
      core.rotation.x = Math.PI / 2;
      const c1 = cyl(0.09, 0.09, 0.14, M(0xa06838, 0.7), 18);
      c1.position.set(-0.17, 0.22, 0);
      const c2 = c1.clone();
      c2.position.x = 0.17;
      grp.add(core, c1, c2);
      break;
    }
    case 'npn': {
      const body = box(0.22, 0.16, 0.12, M(0x2b3138, 0.55, 0.2));
      body.position.y = 0.22;
      for (let i = 0; i < 3; i++) {
        const leg = box(0.014, 0.14, 0.014, MATS.metal());
        leg.position.set(-0.06 + i * 0.06, 0.07, 0);
        grp.add(leg);
      }
      grp.add(body);
      break;
    }
  }
  if (label) {
    const t = lbl(label, '#ffcf9c');
    t.position.set(0, 0.55, 0);
    grp.add(t);
  }
  grp.position.set(x, TABLE_Y, z);
  if (spec.ry) grp.rotation.y = spec.ry;
  g.add(grp);
  return { grp, parts };
}

function makeDial(sub, range, mm = false) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#e8e4da';
  x.beginPath(); x.arc(64, 64, 62, 0, TAU); x.fill();
  x.strokeStyle = '#555'; x.lineWidth = 2;
  x.beginPath(); x.arc(64, 64, 58, 0, TAU); x.stroke();
  x.fillStyle = '#333';
  x.font = 'bold 24px sans-serif';
  x.textAlign = 'center';
  x.fillText(sub, 64, 46);
  x.font = '13px sans-serif';
  x.fillStyle = '#777';
  x.fillText(range || (mm ? '多用电表' : ''), 64, 104);
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * 0.78 - (i / 10) * Math.PI * 0.56;
    x.strokeStyle = '#555'; x.lineWidth = i % 5 === 0 ? 2.4 : 1;
    x.beginPath();
    x.moveTo(64 + Math.cos(a) * 50, 64 - Math.sin(a) * 50);
    x.lineTo(64 + Math.cos(a) * (i % 5 === 0 ? 42 : 46), 64 - Math.sin(a) * (i % 5 === 0 ? 42 : 46));
    x.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex };
}
function setNeedle(id, frac) {
  const rec = ELVIS.get(id);
  if (!rec || !rec.parts.needle) return;
  rec.parts.needle.rotation.z = Math.PI * 0.78 - clamp(frac, -0.08, 1.06) * Math.PI * 0.56;
}
function makeWaveLabel() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 96;
  const x = c.getContext('2d');
  x.strokeStyle = '#9fd3ff';
  x.lineWidth = 3;
  x.beginPath();
  for (let i = 0; i <= 128; i++) {
    const px = 12 + i * 1.8;
    const py = 48 - Math.sin(i / 128 * TAU * 2) * 26;
    if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
  }
  x.stroke();
  x.fillStyle = '#cfe6ff';
  x.font = '20px sans-serif';
  x.fillText('~ AC', 10, 26);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function addWire(g, path, elId) {
  const pts = path.map((p) => V3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(pts.length * 3, 12), 0.011, 6),
    M(0x8a2c22, 0.55, 0.1)
  );
  g.add(tube);
  const beads = makeBeads(pts);
  g.add(beads);
  const w = { tube, beads, elId };
  wires.push(w);
  return w;
}
function bulbGlow(id, frac) {
  const rec = ELVIS.get(id);
  if (rec && rec.parts.core) rec.parts.core.material.emissiveIntensity = clamp(frac, 0, 1.5) * 1.7;
}
function setSwitchVisual(id, closed) {
  const rec = ELVIS.get(id);
  if (rec && rec.parts.lever) rec.parts.lever.rotation.z = closed ? -0.62 : 0;
  const e = CIR.els.get(id);
  if (e) e.R = closed ? 1e-4 : 1e9;
}
function setSliderVisual(id, frac) {
  const rec = ELVIS.get(id);
  if (rec && rec.parts.slider) rec.parts.slider.position.x = lerp(-0.26, 0.26, clamp(frac, 0, 1));
}

/* ================= HUD / 示意图 / 示波器 ================= */

let hud = null;
function setHUD(rows) {
  if (hud) hud.el.remove();
  hud = makeHUD(stage, rows);
  hud.el.style.cssText = 'position:absolute;top:14px;right:14px;z-index:10;min-width:225px;';
  rows.forEach(([k]) => hud.set(k, '–'));
}
function hset(key, text) { if (hud) hud.set(key, text); }

let schemCard = null;
function makeSchem() {
  if (schemCard) { schemCard.el.style.display = ''; return schemCard; }
  const el = document.createElement('div');
  el.className = 'hud-card';
  el.style.cssText = 'position:absolute;top:14px;left:50%;transform:translateX(-64%);z-index:9;';
  const canvas = document.createElement('canvas');
  canvas.width = 500; canvas.height = 320;
  canvas.style.cssText = 'width:250px;display:block;border-radius:6px;background:color-mix(in srgb, var(--bg) 60%, transparent);';
  el.appendChild(canvas);
  stage.appendChild(el);
  schemCard = { el, canvas, ctx: canvas.getContext('2d') };
  return schemCard;
}
function hideSchem() { if (schemCard) schemCard.el.style.display = 'none'; }

function drawSchem(els) {
  const { ctx } = makeSchem();
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.clearRect(0, 0, 250, 160);
  const fg = '#c9d6e2';
  const ac = '#ff9b5e';
  ctx.lineWidth = 1.6;
  els.forEach((e) => {
    ctx.strokeStyle = fg;
    ctx.beginPath();
    if (e.kind === 'wire') {
      ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2);
      ctx.stroke();
      return;
    }
    if (e.kind === 'node') {
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(e.sx, e.sy, 2.5, 0, TAU); ctx.fill();
      return;
    }
    if (e.dir === 'h') {
      ctx.moveTo(e.sx - 24, e.sy); ctx.lineTo(e.sx - 10, e.sy);
      ctx.moveTo(e.sx + 10, e.sy); ctx.lineTo(e.sx + 24, e.sy);
    } else {
      ctx.moveTo(e.sx, e.sy - 24); ctx.lineTo(e.sx, e.sy - 10);
      ctx.moveTo(e.sx, e.sy + 10); ctx.lineTo(e.sx, e.sy + 24);
    }
    ctx.stroke();
    ctx.save();
    ctx.translate(e.sx, e.sy);
    if (e.dir === 'v') ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = fg; ctx.lineWidth = 1.8;
    switch (e.kind) {
      case 'res': case 'rheo': {
        ctx.beginPath(); ctx.rect(-10, -4.5, 20, 9); ctx.stroke();
        if (e.kind === 'rheo') { ctx.beginPath(); ctx.moveTo(-4, -12); ctx.lineTo(-4, -4.5); ctx.stroke(); }
        break;
      }
      case 'bat': {
        ctx.beginPath();
        ctx.moveTo(-8, -9); ctx.lineTo(-8, 9);
        ctx.moveTo(-3, -4); ctx.lineTo(-3, 4);
        ctx.moveTo(3, -9); ctx.lineTo(3, 9);
        ctx.moveTo(8, -4); ctx.lineTo(8, 4);
        ctx.stroke();
        break;
      }
      case 'bulb': {
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-5.6, -5.6); ctx.lineTo(5.6, 5.6);
        ctx.moveTo(-5.6, 5.6); ctx.lineTo(5.6, -5.6);
        ctx.stroke();
        break;
      }
      case 'sw': {
        ctx.beginPath();
        ctx.moveTo(-8, 0); ctx.lineTo(e.closed ? 7 : 5, -8);
        ctx.stroke();
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.arc(-8, 0, 1.6, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(8, 0, 1.6, 0, TAU); ctx.fill();
        break;
      }
      case 'am': case 'vol': case 'gal': {
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke();
        ctx.fillStyle = fg; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(e.kind === 'am' ? 'A' : e.kind === 'vol' ? 'V' : 'G', 0, 0);
        break;
      }
      case 'cap': {
        ctx.beginPath();
        ctx.moveTo(-9, -8); ctx.lineTo(-9, 8);
        ctx.moveTo(9, -8); ctx.lineTo(9, 8);
        ctx.stroke();
        break;
      }
      case 'ind': {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) ctx.arc(-6 + i * 4, 0, 3, Math.PI, 0, false);
        ctx.stroke();
        break;
      }
      case 'dio': {
        ctx.beginPath();
        ctx.moveTo(-8, -6); ctx.lineTo(-8, 6); ctx.lineTo(4, 6); ctx.lineTo(4, -6); ctx.closePath();
        ctx.fillStyle = fg; ctx.fill();
        ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(4, 6); ctx.lineTo(8, 6); ctx.lineTo(8, -6); ctx.lineTo(4, -6);
        ctx.stroke();
        break;
      }
      default: {
        ctx.beginPath(); ctx.rect(-9, -5, 18, 10); ctx.stroke();
      }
    }
    ctx.restore();
    if (e.sub) {
      ctx.fillStyle = ac; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(e.sub, e.sx + (e.dir === 'h' ? 0 : 17), e.sy - (e.dir === 'h' ? 15 : 0));
    }
  });
}

let scopeCard = null;
function makeScope(title) {
  if (scopeCard) {
    scopeCard.el.style.display = '';
    scopeCard.title.textContent = title;
    return scopeCard;
  }
  const el = document.createElement('div');
  el.className = 'hud-card';
  el.style.cssText = 'position:absolute;top:186px;left:14px;z-index:9;';
  el.innerHTML = `<div style="margin-bottom:4px"><b class="sc-title">${title}</b></div>`;
  const canvas = document.createElement('canvas');
  canvas.width = 420; canvas.height = 260;
  canvas.style.cssText = 'width:210px;display:block;border-radius:6px;';
  el.appendChild(canvas);
  stage.appendChild(el);
  scopeCard = { el, canvas, ctx: canvas.getContext('2d'), title: el.querySelector('.sc-title') };
  return scopeCard;
}
function hideScope() { if (scopeCard) scopeCard.el.style.display = 'none'; }
function scopeBase(xl, yl) {
  const { ctx } = makeScope('');
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.fillStyle = '#10161c';
  ctx.fillRect(0, 0, 210, 130);
  ctx.strokeStyle = '#55606a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(24, 10); ctx.lineTo(24, 112); ctx.lineTo(206, 112); ctx.stroke();
  ctx.fillStyle = '#8a98a6'; ctx.font = '9px sans-serif';
  ctx.fillText(xl, 168, 122);
  ctx.fillText(yl, 4, 9);
}

/* ================= 章节脚手架 ================= */

const ctl = createControlsPanel(document.getElementById('controls'));
let wires = [];
let CH = null;
let TEX = null;
let cirG = null;

function enterBench(buildFn) {
  useScene('bench', (g) => buildBenchScene(g, TEX));
  if (!cirG) {
    cirG = new THREE.Group();
    scenes.bench.add(cirG);
  }
  cirG.clear();
  ELVIS.clear();
  wires = [];
  hideSchem(); hideScope();
  CIR = { N: 4, els: new Map(), dt: 0.002 };
  buildFn();
}
function addEl(id, spec) {
  const vis = addElement(cirG, spec);
  let kind = spec.t;
  if (spec.t === 'gauge') kind = spec.sub === 'A' || spec.sub === 'G' ? 'am' : 'vol';
  const el = {
    id, kind, a: spec.a, b: spec.b,
    R: spec.R !== undefined ? spec.R : (kind === 'vol' ? 1e7 : 1),
    E: spec.E || 0, r: spec.r || 0,
    C: spec.C || 0, L: spec.L || 0,
    VZ: spec.VZ, IS: spec.IS, rs: spec.rs, VF: spec.VF, Ir: spec.Ir,
    vc: spec.vc0 || 0, iL: spec.iL0 || 0,
  };
  CIR.els.set(id, el);
  ELVIS.set(id, vis);
  return el;
}
function solveNow() { if (CIR) solveCircuit(); }
window.__voltCir = () => CIR;
function W_(path, elId) { return addWire(cirG, path, elId); }

const SECTIONS = [];
function chap(def) { SECTIONS.push(def); }

/* ---------- 01 串并联 ---------- */
const S1 = { mode: 'ser', closed: true };
function serparRebuild() {
  enterBench(() => buildSerPar());
  setSwitchVisual('sw', S1.closed);
  setSwitchLogic('sw', S1.closed);
  updSerPar();
}
function setSwitchLogic(id, closed) {
  const e = CIR.els.get(id);
  if (e) e.R = closed ? 1e-4 : 1e9;
}
function buildSerPar() {
  addEl('bat1', { t: 'bat', x: -2.0, z: 0.35, label: '电源 3V', E: 3, r: 0.4, a: 1, b: 0 });
  addEl('am', { t: 'gauge', sub: 'A', x: 1.9, z: -0.55, label: '电流表', R: 1e-3, a: 1, b: 4, ry: Math.PI });
  addEl('sw', { t: 'sw', x: -1.1, z: 0.35, label: '开关 S', R: 1e-4, a: 4, b: 2 });
  CIR.N = 5;
  addEl('l1', { t: 'bulb', x: 0.15, z: S1.mode === 'ser' ? 0.35 : 0.62, label: '灯 L1', R: 12, a: 2, b: S1.mode === 'ser' ? 3 : 0 });
  addEl('l2', { t: 'bulb', x: 1.15, z: S1.mode === 'ser' ? 0.35 : 0.08, label: '灯 L2', R: 12, a: S1.mode === 'ser' ? 3 : 2, b: 0 });
  const y0 = TABLE_Y + 0.06;
  W_([[-2.22, TABLE_Y + 0.34, 0.35], [-2.5, y0, 0.35], [-2.5, y0, -0.55], [1.9, y0, -0.55]], 'bat1');
  W_([[-1.78, TABLE_Y + 0.34, 0.35], [-1.4, y0, 0.35], [-1.32, y0, 0.35]], 'bat1');
  W_([[-0.88, y0, 0.35], [-0.55, y0, 0.35]], 'sw');
  if (S1.mode === 'ser') {
    W_([[-0.3, y0, 0.35], [0.0, TABLE_Y + 0.2, 0.35], [0.0, TABLE_Y + 0.4, 0.35]], 'sw');
    W_([[0.3, TABLE_Y + 0.4, 0.35], [0.85, TABLE_Y + 0.4, 0.35]], 'l1');
    W_([[1.3, TABLE_Y + 0.4, 0.35], [1.6, TABLE_Y + 0.3, 0.1], [1.9, TABLE_Y + 0.2, -0.4]], 'l2');
    drawSchem([
      { kind: 'wire', x1: 18, y1: 118, x2: 40, y2: 118 },
      { kind: 'bat', sx: 50, sy: 118, dir: 'v', sub: '3V' },
      { kind: 'wire', x1: 50, y1: 94, x2: 50, y2: 40 },
      { kind: 'sw', sx: 50, sy: 30, dir: 'h', closed: S1.closed, sub: 'S' },
      { kind: 'wire', x1: 58, y1: 30, x2: 92, y2: 30 },
      { kind: 'bulb', sx: 104, sy: 30, dir: 'h', sub: 'L1' },
      { kind: 'wire', x1: 116, y1: 30, x2: 140, y2: 30 },
      { kind: 'bulb', sx: 152, sy: 30, dir: 'h', sub: 'L2' },
      { kind: 'wire', x1: 164, y1: 30, x2: 196, y2: 30 },
      { kind: 'wire', x1: 196, y1: 30, x2: 196, y2: 118 },
      { kind: 'am', sx: 120, sy: 118, dir: 'h', sub: 'A' },
      { kind: 'wire', x1: 110, y1: 118, x2: 18, y2: 118 },
      { kind: 'node', sx: 18, sy: 118 },
    ]);
  } else {
    W_([[-0.3, y0, 0.35], [0.0, y0, 0.62], [0.0, TABLE_Y + 0.4, 0.62]], 'sw');
    W_([[0.3, TABLE_Y + 0.4, 0.62], [0.62, y0, 0.62], [0.62, y0, -0.55], [1.9, y0, -0.55]], 'l1');
    W_([[0.62, y0, 0.62], [0.62, y0, 0.08], [0.9, TABLE_Y + 0.4, 0.08]], 'l1');
    W_([[1.3, TABLE_Y + 0.4, 0.08], [1.62, y0, 0.08], [1.62, y0, -0.55]], 'l2');
    drawSchem([
      { kind: 'wire', x1: 18, y1: 118, x2: 40, y2: 118 },
      { kind: 'bat', sx: 50, sy: 118, dir: 'v', sub: '3V' },
      { kind: 'wire', x1: 50, y1: 94, x2: 50, y2: 40 },
      { kind: 'sw', sx: 50, sy: 30, dir: 'h', closed: S1.closed, sub: 'S' },
      { kind: 'wire', x1: 58, y1: 30, x2: 100, y2: 30 },
      { kind: 'node', sx: 100, sy: 30 },
      { kind: 'wire', x1: 100, y1: 30, x2: 130, y2: 30 },
      { kind: 'am', sx: 142, sy: 30, dir: 'h', sub: 'A' },
      { kind: 'wire', x1: 152, y1: 30, x2: 196, y2: 30 },
      { kind: 'wire', x1: 196, y1: 30, x2: 196, y2: 118 },
      { kind: 'node', sx: 196, sy: 118 },
      { kind: 'wire', x1: 100, y1: 30, x2: 100, y2: 62 },
      { kind: 'bulb', sx: 100, sy: 74, dir: 'v', sub: 'L1' },
      { kind: 'wire', x1: 100, y1: 86, x2: 100, y2: 118 },
      { kind: 'wire', x1: 100, y1: 118, x2: 18, y2: 118 },
      { kind: 'wire', x1: 148, y1: 30, x2: 148, y2: 56 },
      { kind: 'bulb', sx: 148, sy: 68, dir: 'v', sub: 'L2' },
      { kind: 'wire', x1: 148, y1: 80, x2: 148, y2: 118 },
    ]);
  }
}
function updSerPar() {
  solveNow();
  const am = CIR.els.get('am'), l1 = CIR.els.get('l1'), l2 = CIR.els.get('l2');
  const i = Math.abs(am.I);
  setNeedle('am', i / 0.6);
  const f1 = Math.abs(l1.I) / 0.22, f2 = Math.abs(l2.I) / 0.22;
  bulbGlow('l1', f1); bulbGlow('l2', f2);
  hset('top', S1.mode === 'ser' ? '串联：电流只有一条路' : '并联：两灯各自成路');
  hset('i', i.toFixed(3) + ' A（干路）');
  hset('l1', `I₁ = ${Math.abs(l1.I).toFixed(3)} A · ${Math.abs(l1.I) > 0.12 ? '亮' : Math.abs(l1.I) > 0.04 ? '较暗' : '熄'}`);
  hset('l2', `I₂ = ${Math.abs(l2.I).toFixed(3)} A · ${Math.abs(l2.I) > 0.12 ? '亮' : Math.abs(l2.I) > 0.04 ? '较暗' : '熄'}`);
}
chap({
  id: 'serpar', title: '串联与并联电路',
  html: `<p><b>串联</b>：用电器首尾相连，电流只有一条路——各处电流相等；一灯断，全路断。<b>并联</b>：用电器并列接在同两点间——各支路电压相等、干路电流等于各支路之和；一灯断了，另一盏照常亮。</p>
<p>切换「串联/并联」重新接线，开合开关，比较两灯亮度与电流表读数。（实际灯泡的灯丝电阻随温度升高而变大，冷态只有热态的约 1/9——「伏安特性」一章可亲手测。）</p>`,
  enter() {
    serparRebuild();
    app.setCamera([-0.3, 3.2, 4.6], [-0.2, 1.3, 0]);
    ctl.clear();
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === S1.mode));
    [['ser', '串联'], ['par', '并联']].forEach(([v, t]) => {
      const b = ctl.button({ label: t, onClick() { S1.mode = v; serparRebuild(); paint(); } });
      btns.push({ b, v });
    });
    paint();
    ctl.sep();
    ctl.toggle({ label: '开关 S', value: S1.closed, onChange: (v) => { S1.closed = v; setSwitchLogic('sw', v); setSwitchVisual('sw', v); updSerPar(); } });
    setHUD([['top', '连接方式'], ['i', '电流表读数'], ['l1', '灯 L1'], ['l2', '灯 L2']]);
    updSerPar();
  },
});

/* ---------- 02 欧姆定律 ---------- */
const S2 = { E: 3, R: 10 };
function ohmLayout() {
  enterBench(() => {
    addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源', E: S2.E, r: 0.5, a: 1, b: 0 });
    addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '开关', R: 1e-4, a: 1, b: 2 });
    addEl('am', { t: 'gauge', sub: 'A', x: -0.2, z: 0.4, label: '电流表', R: 1e-3, a: 2, b: 3 });
    addEl('rh', { t: 'rheo', x: 0.9, z: 0.4, label: '定值电阻 R', R: S2.R, a: 3, b: 0 });
    addEl('vol', { t: 'gauge', sub: 'V', x: 0.9, z: -0.45, label: '电压表', R: 1e7, a: 3, b: 0, ry: Math.PI });
    const y0 = TABLE_Y + 0.06;
    W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, 0.62], [2.4, y0, 0.62], [2.4, y0, -0.62], [1.9, y0, -0.62], [1.9, TABLE_Y + 0.3, -0.55], [0.9, TABLE_Y + 0.2, -0.3]], 'bat1');
    W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.5, y0, 0.4], [-1.32, y0, 0.4]], 'bat1');
    W_([[-0.88, y0, 0.4], [-0.55, y0, 0.4], [-0.35, TABLE_Y + 0.16, 0.4]], 'sw');
    W_([[-0.05, TABLE_Y + 0.16, 0.4], [0.2, y0, 0.4], [0.62, y0, 0.4]], 'am');
    W_([[1.18, y0, 0.4], [1.7, y0, 0.4], [1.7, y0, 0.62]], 'rh');
    W_([[1.2, TABLE_Y + 0.1, -0.42], [1.2, y0, -0.45], [1.6, y0, -0.45]], 'vol');
    drawSchem([
      { kind: 'wire', x1: 24, y1: 116, x2: 44, y2: 116 },
      { kind: 'bat', sx: 54, sy: 116, dir: 'v' },
      { kind: 'wire', x1: 54, y1: 92, x2: 54, y2: 36 },
      { kind: 'sw', sx: 54, sy: 28, dir: 'h', closed: true, sub: 'S' },
      { kind: 'wire', x1: 62, y1: 28, x2: 96, y2: 28 },
      { kind: 'am', sx: 108, sy: 28, dir: 'h', sub: 'A' },
      { kind: 'wire', x1: 118, y1: 28, x2: 150, y2: 28 },
      { kind: 'node', sx: 150, sy: 28 },
      { kind: 'res', sx: 162, sy: 28, dir: 'h', sub: 'R' },
      { kind: 'wire', x1: 174, y1: 28, x2: 206, y2: 28 },
      { kind: 'wire', x1: 206, y1: 28, x2: 206, y2: 116 },
      { kind: 'vol', sx: 162, sy: 70, dir: 'h', sub: 'V' },
      { kind: 'wire', x1: 150, y1: 28, x2: 150, y2: 70 },
      { kind: 'wire', x1: 174, y1: 70, x2: 206, y2: 70 },
      { kind: 'node', sx: 206, sy: 116 },
      { kind: 'wire', x1: 206, y1: 116, x2: 24, y2: 116 },
    ]);
  });
}
function ohmUpd() {
  const b = CIR.els.get('bat1');
  b.E = S2.E;
  const rh = CIR.els.get('rh');
  rh.R = S2.R;
  setSliderVisual('rh', (S2.R - 2) / 18);
  solveNow();
  const am = CIR.els.get('am'), vol = CIR.els.get('vol');
  const i = Math.abs(am.I), u = Math.abs(vol.V);
  setNeedle('am', i / 1.0);
  setNeedle('vol', u / 6.0);
  hset('law', 'I = U / R');
  hset('u', u.toFixed(2) + ' V（R 两端）');
  hset('i', i.toFixed(3) + ' A');
  hset('calc', `U/I = ${(u / Math.max(i, 1e-9)).toFixed(1)} Ω = R ✓`);
}
chap({
  id: 'ohm', title: '探究欧姆定律',
  html: `<p>通过导体的电流跟它两端的<b>电压成正比</b>、跟它的<b>电阻成反比</b>：<span class="hl">I = U / R</span>（欧姆定律，1826）。</p>
<p>保持 R 不变调电压 → I 随 U 正比增大；保持 U 不变调电阻 → I 随 R 反比减小。电压表并在被测电阻两端，电流表串联在电路里。</p>
<p>拧两个旋钮，核对 U/I 是否总等于 R。</p>`,
  enter() {
    ohmLayout();
    app.setCamera([-0.2, 3.3, 4.8], [0, 1.3, 0]);
    ctl.clear();
    ctl.slider({ label: '电源电压 U₀', min: 1, max: 6, step: 0.5, value: S2.E, fmt: (v) => v.toFixed(1) + ' V', onInput: (v) => { S2.E = v; ohmUpd(); } });
    ctl.slider({ label: '电阻 R', min: 2, max: 20, step: 1, value: S2.R, fmt: (v) => v + ' Ω', onInput: (v) => { S2.R = v; ohmUpd(); } });
    ctl.sep();
    ctl.toggle({ label: '开关', value: true, onChange: (v) => { setSwitchLogic('sw', v); setSwitchVisual('sw', v); ohmUpd(); } });
    setHUD([['law', '欧姆定律'], ['u', '电压 U'], ['i', '电流 I'], ['calc', '验算']]);
    ohmUpd();
  },
});

/* ---------- 03 测电源电动势和内阻 ---------- */
const S3 = { R: 6, pts: [] };
chap({
  id: 'emfr', title: '测电源电动势和内阻',
  html: `<p>电源内部也有电阻（<b>内阻 r</b>）。输出电压（路端电压）<span class="hl">U = E − I·r</span>：电流越大，内阻分掉的电压越多，U 越低。</p>
<p>测出两组 (I, U)，解方程组即得 E 和 r；或在 U–I 图上画直线：<b>纵轴截距 = E，斜率 = −r</b>。</p>
<p>调节 R 得到不同的 I、U，点「记录一组数据」，记两组以上看拟合结果。</p>`,
  enter() {
    enterBench(() => {
      addEl('bat1', { t: 'bat', x: -1.8, z: 0.45, label: '待测电源', E: 3, r: 0.8, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -0.9, z: 0.45, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('am', { t: 'gauge', sub: 'A', x: 0, z: 0.45, label: '电流表', R: 1e-3, a: 2, b: 3 });
      addEl('rh', { t: 'rheo', x: 1.0, z: 0.45, label: '滑动变阻器', R: S3.R, a: 3, b: 0 });
      addEl('vol', { t: 'gauge', sub: 'V', x: 0.1, z: -0.5, label: '电压表', R: 1e7, a: 1, b: 0, ry: Math.PI });
      const y0 = TABLE_Y + 0.06;
      W_([[-2.02, TABLE_Y + 0.34, 0.45], [-2.4, y0, 0.45], [-2.4, y0, 0.68], [2.6, y0, 0.68], [2.6, y0, -0.68], [-0.35, y0, -0.68], [-0.35, TABLE_Y + 0.3, -0.56]], 'bat1');
      W_([[-1.58, TABLE_Y + 0.34, 0.45], [-1.3, y0, 0.45], [-1.12, y0, 0.45]], 'bat1');
      W_([[-0.68, y0, 0.45], [-0.35, y0, 0.45], [-0.15, TABLE_Y + 0.16, 0.45]], 'sw');
      W_([[0.15, TABLE_Y + 0.16, 0.45], [0.4, y0, 0.45], [0.7, y0, 0.45]], 'am');
      W_([[1.3, y0, 0.45], [1.9, y0, 0.45], [1.9, y0, 0.68]], 'rh');
      W_([[-0.12, TABLE_Y + 0.1, -0.48], [0.4, y0, -0.5], [-1.8, y0, -0.5], [-1.8, TABLE_Y + 0.3, 0.4]], 'vol');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 50, y2: 114 },
        { kind: 'bat', sx: 60, sy: 114, dir: 'v', sub: 'E,r' },
        { kind: 'wire', x1: 60, y1: 90, x2: 60, y2: 36 },
        { kind: 'sw', sx: 60, sy: 28, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 68, y1: 28, x2: 100, y2: 28 },
        { kind: 'am', sx: 112, sy: 28, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 122, y1: 28, x2: 152, y2: 28 },
        { kind: 'rheo', sx: 166, sy: 28, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 178, y1: 28, x2: 208, y2: 28 },
        { kind: 'wire', x1: 208, y1: 28, x2: 208, y2: 114 },
        { kind: 'vol', sx: 60, sy: 70, dir: 'h', sub: 'V' },
        { kind: 'wire', x1: 60, y1: 90, x2: 60, y2: 70 },
        { kind: 'wire', x1: 72, y1: 70, x2: 208, y2: 70 },
        { kind: 'node', sx: 208, y2: 0, sy: 114 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0, 1.3, 0]);
    ctl.clear();
    ctl.slider({ label: '变阻器 R', min: 1, max: 20, step: 0.5, value: S3.R, fmt: (v) => v.toFixed(1) + ' Ω', onInput: (v) => { S3.R = v; const e = CIR.els.get('rh'); e.R = v; setSliderVisual('rh', (v - 1) / 19); solveNow(); updEmfr(); } });
    ctl.sep();
    ctl.button({ label: '⌘ 记录一组 (I, U)', onClick() { const am = CIR.els.get('am'), vol = CIR.els.get('vol'); S3.pts.push([Math.abs(am.I), Math.abs(vol.V)]); if (S3.pts.length > 6) S3.pts.shift(); updEmfr(); } });
    ctl.button({ label: '✕ 清除数据', onClick() { S3.pts.length = 0; updEmfr(); } });
    setHUD([['law', 'U = E − I·r'], ['iu', '当前 I / U'], ['fit', '拟合 E 与 r'], ['n', '数据组数']]);
    solveNow();
    updEmfr();
  },
});
function updEmfr() {
  const am = CIR.els.get('am'), vol = CIR.els.get('vol');
  const i = Math.abs(am.I), u = Math.abs(vol.V);
  setNeedle('am', i / 1.5); setNeedle('vol', u / 4);
  hset('iu', `${i.toFixed(3)} A / ${u.toFixed(2)} V`);
  hset('n', S3.pts.length + ' 组');
  if (S3.pts.length >= 2) {
    // 最小二乘拟合 U = E − r I
    const n = S3.pts.length;
    let si = 0, su = 0, sii = 0, siu = 0;
    S3.pts.forEach(([I, U]) => { si += I; su += U; sii += I * I; siu += I * U; });
    const den = n * sii - si * si;
    const rFit = den ? -(n * siu - si * su) / den : 0;
    const eFit = den ? (su + rFit * si) / n : 0;
    hset('fit', `E ≈ ${eFit.toFixed(2)} V，r ≈ ${rFit.toFixed(2)} Ω`);
  } else {
    hset('fit', '至少记录两组数据');
  }
  // U–I 图
  const sc = makeScope('U–I 图线');
  scopeBase('I/A', 'U/V');
  const ctx = sc.ctx;
  const toX = (I) => 24 + clamp(I / 2.5, 0, 1) * 180;
  const toY = (U) => 112 - clamp(U / 4, 0, 1) * 98;
  ctx.strokeStyle = '#8a98a6'; ctx.font = '8px sans-serif';
  ctx.fillText('E', 28, toY(3.4)); ctx.fillText('U₀', 28, toY(3) + 8);
  ctx.fillStyle = '#ff9b5e';
  S3.pts.forEach(([I, U]) => { ctx.beginPath(); ctx.arc(toX(I), toY(U), 3, 0, TAU); ctx.fill(); });
  if (S3.pts.length >= 2) {
    const n = S3.pts.length;
    let si = 0, su = 0, sii = 0, siu = 0;
    S3.pts.forEach(([I, U]) => { si += I; su += U; sii += I * I; siu += I * U; });
    const den = n * sii - si * si;
    if (den) {
      const rFit = -(n * siu - si * su) / den;
      const eFit = (su + rFit * si) / n;
      ctx.strokeStyle = '#ff9b5e'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(eFit));
      ctx.lineTo(toX(2.4), toY(eFit - rFit * 2.4));
      ctx.stroke();
    }
  }
}

/* ---------- 04 伏安特性 ---------- */
const S4 = { pos: 0, pts: [], T: 300 };
const VAH_R = { Rr: 15, Tr: 2800, T0: 300, Pr: 2.4 };   // 灯丝额定参数（辐射热平衡模型）
chap({
  id: 'vah', title: '描绘小灯泡的伏安特性曲线',
  html: `<p>金属的电阻随温度升高而增大。灯泡电压升高 → 灯丝温度飙升（可到上千 K）→ <b>电阻变大</b>，所以 I–U 曲线向电压轴弯曲——<b>不是直线</b>！冷态灯丝电阻只有热态的约 1/9，所以灯丝常在开灯一瞬间烧断。</p>
<p>本电路用滑动变阻器的<b>分压式接法</b>：A、B 两端接电源，从一端 A 与滑片 D 之间取电压——滑片从 A 端起调，灯泡电压能<b>从 0 连续调到电源电压</b>（限流接法做不到从 0 起）。</p>
<p>缓缓右移滑片，每停一处点「记录数据点」，看曲线怎么弯；再对比「探究欧姆定律」里定值电阻的直线。</p>`,
  enter() {
    enterBench(() => {
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 4.5V', E: 4.5, r: 0.2, a: 1, b: 0 });
      addEl('rh', { t: 'rheo', x: -0.5, z: 0.4, label: '滑动变阻器（分压式）', R: 20, a: 0, b: 0 });
      addEl('pA', { t: 'res', x: 0, z: 0, label: '', R: 0.01, a: 1, b: 2 });
      addEl('pB', { t: 'res', x: 0, z: 0, label: '', R: 20, a: 2, b: 0 });
      addEl('bl', { t: 'bulb', x: 0.3, z: 0.4, label: '小灯泡', R: 2, a: 2, b: 3 });
      addEl('am', { t: 'gauge', sub: 'A', x: 1.9, z: 0.4, label: '电流表', R: 1e-3, a: 3, b: 0 });
      addEl('vol', { t: 'gauge', sub: 'V', x: 1.0, z: -0.5, label: '电压表', R: 1e7, a: 2, b: 3, ry: Math.PI });
      const y0 = TABLE_Y + 0.06;
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.3, y0, 0.4], [-1.3, y0, 0.66], [-0.9, y0, 0.66], [-0.85, TABLE_Y + 0.16, 0.55]], 'bat1');
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.6, y0, 0.4], [-2.6, y0, -0.7], [2.4, y0, -0.7]], 'bat1');
      W_([[-0.15, TABLE_Y + 0.18, 0.4], [0.14, TABLE_Y + 0.2, 0.4]], 'pA');
      W_([[0.46, TABLE_Y + 0.4, 0.4], [0.9, y0, 0.4], [1.55, TABLE_Y + 0.16, 0.4]], 'bl');
      W_([[2.25, TABLE_Y + 0.16, 0.4], [2.4, y0, 0.4], [2.4, y0, -0.7]], 'am');
      W_([[0.5, TABLE_Y + 0.1, -0.46], [0.5, y0, -0.5], [0.62, y0, -0.5]], 'bl');
      W_([[0.74, y0, -0.5], [1.4, y0, -0.5]], 'bl');
      drawSchem([
        { kind: 'wire', x1: 36, y1: 116, x2: 60, y2: 116 },
        { kind: 'bat', sx: 70, sy: 116, dir: 'v', sub: '4.5V' },
        { kind: 'wire', x1: 70, y1: 92, x2: 70, y2: 30 },
        { kind: 'wire', x1: 70, y1: 30, x2: 96, y2: 30 },
        { kind: 'wire', x1: 96, y1: 30, x2: 96, y2: 38 },
        { kind: 'res', sx: 96, sy: 50, dir: 'v', sub: 'RA' },
        { kind: 'wire', x1: 96, y1: 62, x2: 96, y2: 76 },
        { kind: 'node', sx: 96, sy: 64 },
        { kind: 'res', sx: 96, sy: 88, dir: 'v', sub: 'RB' },
        { kind: 'wire', x1: 96, y1: 100, x2: 96, y2: 116 },
        { kind: 'node', sx: 96, sy: 116 },
        { kind: 'wire', x1: 36, y1: 116, x2: 226, y2: 116 },
        { kind: 'wire', x1: 96, y1: 64, x2: 130, y2: 64 },
        { kind: 'bulb', sx: 144, sy: 64, dir: 'h', sub: '灯' },
        { kind: 'wire', x1: 156, y1: 64, x2: 186, y2: 64 },
        { kind: 'am', sx: 200, sy: 64, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 212, y1: 64, x2: 226, y2: 64 },
        { kind: 'wire', x1: 226, y1: 64, x2: 226, y2: 116 },
        { kind: 'node', sx: 226, sy: 116 },
        { kind: 'vol', sx: 144, sy: 30, dir: 'h', sub: 'V' },
        { kind: 'wire', x1: 130, y1: 64, x2: 130, y2: 30 },
        { kind: 'wire', x1: 158, y1: 30, x2: 186, y2: 30 },
        { kind: 'node', sx: 186, sy: 64 },
        { kind: 'wire', x1: 186, y1: 30, x2: 186, y2: 64 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0, 1.3, 0]);
    ctl.clear();
    ctl.slider({ label: '滑片位置 A→B（分压）', min: 0, max: 1, step: 0.02, value: S4.pos, fmt: (v) => Math.round(v * 100) + '%', onInput: (v) => { S4.pos = v; updVah(); } });
    ctl.sep();
    ctl.button({ label: '⌘ 记录数据点', onClick() { S4.pts.push([CIR.els.get('vol').V, Math.abs(CIR.els.get('am').I)]); if (S4.pts.length > 24) S4.pts.shift(); updVah(); } });
    ctl.button({ label: '✕ 清除', onClick() { S4.pts.length = 0; S4.T = 300; S4.pos = 0; updVah(); } });
    setHUD([['iu', 'U / I'], ['r', '灯丝电阻'], ['t', '灯丝温度'], ['note', '曲线向 U 轴弯曲']]);
    solveNow();
    updVah();
  },
});
function updVah() {
  const am = CIR.els.get('am'), vol = CIR.els.get('vol'), bl = CIR.els.get('bl');
  // 分压式：上段 RA = pos·20Ω，下段 RB = (1−pos)·20Ω，滑片从 0 起调
  const Rmax = 20;
  const ra = CIR.els.get('pA'), rb = CIR.els.get('pB');
  ra.R = clamp(S4.pos * Rmax, 0.01, Rmax);
  rb.R = clamp((1 - S4.pos) * Rmax, 0.01, Rmax);
  setSliderVisual('rh', S4.pos);
  solveNow();
  const i = Math.abs(am.I), u = Math.abs(vol.V);
  const p = i * u;
  // 灯丝辐射热平衡：C dT/dt = P − k(T⁴−T₀⁴)，R = Rr·T/Tr（钨丝，冷态≈热态 1/9）
  const { Rr, Tr, T0, Pr } = VAH_R;
  const kk = Pr / (Tr ** 4 - T0 ** 4), Cth = 0.05 * 4 * kk * Tr ** 3;
  let T = S4.T;
  const sub = 4, h = 0.016 / sub;
  for (let k = 0; k < sub; k++) {
    T += (p - kk * (T ** 4 - T0 ** 4)) / Cth * h;
    T = clamp(T, T0, 3300);
  }
  S4.T = T;
  bl.R = clamp(Rr * T / Tr, 1.2, 40);
  bulbGlow('bl', p / 0.5);
  setNeedle('am', i / 0.5); setNeedle('vol', u / 4.6);
  hset('iu', `${u.toFixed(2)} V / ${i.toFixed(3)} A`);
  hset('r', bl.R.toFixed(1) + ' Ω');
  hset('t', Math.round(S4.T) + ' K');
  const sc = makeScope('小灯泡 I–U 特性');
  scopeBase('U/V', 'I/A');
  const ctx = sc.ctx;
  const toX = (U) => 24 + clamp(U / 4.6, 0, 1) * 180;
  const toY = (I) => 112 - clamp(I / 0.6, 0, 1) * 98;
  ctx.fillStyle = '#ff9b5e';
  S4.pts.forEach(([U, I]) => { ctx.beginPath(); ctx.arc(toX(U), toY(I), 2.6, 0, TAU); ctx.fill(); });
  ctx.beginPath(); ctx.arc(toX(u), toY(i), 3.6, 0, TAU); ctx.strokeStyle = '#ffd9a8'; ctx.stroke();
}

/* ---------- 05 RC 充放电 ---------- */
const S5 = { mode: 'off', speed: 0.3, trace: [], t: 0 };
chap({
  id: 'rc', title: 'RC 电路充放电',
  html: `<p>电容通过电阻充电，电压按指数规律上升：<span class="hl">u_C = E(1 − e^(−t/τ))</span>；放电时 <span class="hl">u_C = E·e^(−t/τ)</span>。时间常数 <b>τ = RC</b>——充到 0.63E 用一个 τ，工程上约 3~5τ 充满。</p>
<p>切换「充电 / 放电 / 断开」，观察电压表读数和指数曲线（慢放 ×0.3）。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.001;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 3V', E: 3, r: 0.2, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '开关 S₁（充电）', R: 1e9, a: 1, b: 2 });
      addEl('res', { t: 'res', x: -0.2, z: 0.4, label: 'R = 100 Ω', R: 100, a: 2, b: 3 });
      addEl('cap', { t: 'cap', x: 0.9, z: 0.4, label: 'C = 1000 μF', C: 1e-3, vc0: 0, a: 3, b: 0 });
      addEl('swd', { t: 'sw', x: 1.7, z: -0.35, label: '开关 S₂（放电）', R: 1e9, a: 3, b: 0, ry: 0.5 });
      addEl('vol', { t: 'gauge', sub: 'V', x: 0.2, z: -0.5, label: '电压表', R: 1e7, a: 3, b: 0, ry: Math.PI });
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.7], [0.2, y0, -0.7], [0.2, TABLE_Y + 0.2, -0.56]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.28, y0, 0.4]], 'bat1');
      W_([[-0.92, y0, 0.4], [-0.55, y0, 0.4], [-0.35, TABLE_Y + 0.16, 0.4]], 'sw');
      W_([[-0.05, TABLE_Y + 0.16, 0.4], [0.3, y0, 0.4], [0.66, TABLE_Y + 0.2, 0.4]], 'res');
      W_([[1.14, TABLE_Y + 0.2, 0.4], [1.6, y0, 0.4], [1.6, y0, -0.2]], 'cap');
      W_([[1.55, TABLE_Y + 0.08, -0.3], [1.15, y0, -0.42], [0.66, y0, -0.52]], 'swd');
      drawSchem([
        { kind: 'wire', x1: 22, y1: 116, x2: 44, y2: 116 },
        { kind: 'bat', sx: 54, sy: 116, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 54, y1: 92, x2: 54, y2: 40 },
        { kind: 'sw', sx: 54, sy: 30, dir: 'h', closed: false, sub: 'S₁' },
        { kind: 'wire', x1: 62, y1: 30, x2: 94, y2: 30 },
        { kind: 'res', sx: 108, sy: 30, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 120, y1: 30, x2: 150, y2: 30 },
        { kind: 'node', sx: 150, sy: 30 },
        { kind: 'cap', sx: 162, sy: 30, dir: 'v', sub: 'C' },
        { kind: 'wire', x1: 162, y1: 42, x2: 162, y2: 116 },
        { kind: 'vol', sx: 106, sy: 74, dir: 'h', sub: 'V' },
        { kind: 'wire', x1: 150, y1: 30, x2: 150, y2: 74 },
        { kind: 'wire', x1: 118, y1: 74, x2: 162, y2: 74 },
        { kind: 'node', sx: 162, sy: 116 },
        { kind: 'wire', x1: 162, y1: 116, x2: 22, y2: 116 },
        { kind: 'sw', sx: 216, sy: 74, dir: 'v', closed: false, sub: 'S₂' },
        { kind: 'wire', x1: 162, y1: 74, x2: 216, y2: 74 },
        { kind: 'wire', x1: 216, y1: 62, x2: 216, y2: 30 },
        { kind: 'wire', x1: 216, y1: 86, x2: 216, y2: 116 },
        { kind: 'node', sx: 216, sy: 116 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0, 1.3, 0]);
    ctl.clear();
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === S5.mode));
    [['off', '断开'], ['chg', '充电'], ['dis', '放电']].forEach(([v, t]) => {
      const b = ctl.button({ label: t, onClick() { setMode5(v); paint(); } });
      btns.push({ b, v });
    });
    paint();
    ctl.sep();
    ctl.button({ label: '↺ 电容清零', onClick() { CIR.els.get('cap').vc = 0; S5.trace.length = 0; S5.t = 0; solveNow(); updRc(); } });
    setHUD([['mode', '状态'], ['uc', '电容电压 u_C'], ['tau', 'τ = RC = 0.1 s'], ['note', '指数充放电']]);
    setMode5('off');
  },
});
function setMode5(m) {
  S5.mode = m;
  setSwitchLogic('sw', m === 'chg');
  setSwitchVisual('sw', m === 'chg');
  setSwitchLogic('swd', m === 'dis');
  setSwitchVisual('swd', m === 'dis');
  S5.trace.length = 0; S5.t = 0;
  drawRcScope();
}
function drawRcScope() {
  const sc = makeScope('u_C – t 曲线');
  scopeBase('t/s', 'u_C/V');
  const ctx = sc.ctx;
  const toX = (t) => 24 + clamp(t / 0.8, 0, 1) * 180;
  const toY = (u) => 112 - clamp(u / 3.3, 0, 1) * 98;
  ctx.strokeStyle = '#55606a'; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(toX(0), toY(3)); ctx.lineTo(toX(0.8), toY(3)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#ff9b5e'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  S5.trace.forEach(([t, u], i) => { const x = toX(t), y = toY(u); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();
  ctx.fillStyle = '#8a98a6'; ctx.font = '8px sans-serif';
  ctx.fillText('E=3V', 30, toY(3) - 3);
}
function updRc() {
  const cap = CIR.els.get('cap');
  const u = cap.V;
  setNeedle('vol', Math.abs(u) / 3.3);
  hset('mode', S5.mode === 'chg' ? '充电中 u_C ↑' : S5.mode === 'dis' ? '放电中 u_C ↓' : '断开（保持）');
  hset('uc', Math.abs(u).toFixed(2) + ' V');
  hset('note', Math.abs(u) > 1.9 ? '充到 63% 用了 1 个 τ' : 'u_C = E(1−e^(−t/τ))');
}

/* ---------- 06 断电自感 ---------- */
const S6 = { closed: true, trace: [] };
chap({
  id: 'selfind', title: '断电自感现象',
  html: `<p>线圈的电流变化时会产生<b>自感电动势</b>阻碍变化（楞次定律）。开关断开瞬间：线圈电流不能突变，它通过灯泡强行续流——<b>灯泡猛地闪亮一下</b>才熄灭，这就是断电自感。</p>
<p>稳态时线圈（电阻小）分流大、灯较暗；断开后线圈像「临时电源」把储存的磁场能倒给灯泡。</p>
<p>开合开关，看灯泡亮度与电流曲线（慢放）。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.001;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 3V', E: 3, r: 0.2, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '开关 S', R: 1e-4, a: 1, b: 2 });
      addEl('blA', { t: 'bulb', x: -0.1, z: 0.4, label: '灯 A', R: 12, a: 2, b: 5 });
      addEl('ind', { t: 'ind', x: 1.0, z: 0.4, label: '线圈 L（电阻小）', L: 2, a: 2, b: 3 });
      addEl('rc', { t: 'res', x: 1.0, z: 0.4, label: '线圈直流电阻 4Ω', R: 4, a: 3, b: 0 });
      addEl('vol', { t: 'gauge', sub: 'A', x: 0.5, z: -0.5, label: '灯 A 电流', R: 1e-3, a: 5, b: 0, ry: Math.PI });
      CIR.N = 6;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.7], [0.5, y0, -0.7], [0.5, TABLE_Y + 0.2, -0.56]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.28, y0, 0.4]], 'bat1');
      W_([[-0.92, y0, 0.4], [-0.6, y0, 0.4], [-0.4, TABLE_Y + 0.4, 0.4]], 'sw');
      W_([[0.2, TABLE_Y + 0.4, 0.4], [0.5, y0, 0.4], [0.72, TABLE_Y + 0.2, 0.4]], 'blA');
      W_([[0.5, y0, 0.4], [0.5, y0, 0.16], [0.78, TABLE_Y + 0.2, 0.16]], 'blA');
      W_([[1.22, TABLE_Y + 0.2, 0.4], [1.7, y0, 0.4], [1.7, y0, -0.7]], 'ind');
      drawSchem([
        { kind: 'wire', x1: 24, y1: 116, x2: 44, y2: 116 },
        { kind: 'bat', sx: 54, sy: 116, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 54, y1: 92, x2: 54, y2: 40 },
        { kind: 'sw', sx: 54, sy: 30, dir: 'h', closed: S6.closed, sub: 'S' },
        { kind: 'wire', x1: 62, y1: 30, x2: 96, y2: 30 },
        { kind: 'node', sx: 96, sy: 30 },
        { kind: 'bulb', sx: 110, sy: 30, dir: 'h', sub: '灯A' },
        { kind: 'wire', x1: 122, y1: 30, x2: 96, y2: 30 },
        { kind: 'wire', x1: 96, y1: 30, x2: 96, y2: 64 },
        { kind: 'ind', sx: 96, sy: 76, dir: 'v', sub: 'L' },
        { kind: 'wire', x1: 96, y1: 88, x2: 96, y2: 116 },
        { kind: 'res', sx: 150, sy: 76, dir: 'h', sub: 'r' },
        { kind: 'wire', x1: 96, y1: 76, x2: 138, y2: 76 },
        { kind: 'wire', x1: 162, y1: 76, x2: 196, y2: 76 },
        { kind: 'wire', x1: 196, y1: 76, x2: 196, y2: 116 },
        { kind: 'node', sx: 196, sy: 116 },
        { kind: 'wire', x1: 196, y1: 116, x2: 24, y2: 116 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0, 1.3, 0]);
    ctl.clear();
    ctl.toggle({ label: '开关 S', value: true, onChange: (v) => { S6.closed = v; setSwitchLogic('sw', v); setSwitchVisual('sw', v); S6.trace.length = 0; updSelf(); } });
    ctl.sep();
    ctl.button({ label: '↺ 复位线圈电流', onClick() { CIR.els.get('ind').iL = 0; S6.trace.length = 0; solveNow(); updSelf(); } });
    setHUD([['sw', '开关'], ['il', '线圈电流'], ['ia', '灯 A 电流'], ['note', '断开瞬间灯闪亮']]);
    updSelf();
  },
});
function updSelf() {
  solveNow();
  const blA = CIR.els.get('blA'), ind = CIR.els.get('ind');
  const ia = Math.abs(blA.I);
  bulbGlow('blA', ia / 0.28);
  setNeedle('vol', ia / 0.8);
  hset('sw', S6.closed ? '闭合（稳态）' : '断开（续流）');
  hset('il', Math.abs(ind.I).toFixed(3) + ' A');
  hset('ia', ia.toFixed(3) + ' A' + (ia > 0.3 ? ' ← 闪亮！' : ''));
  hset('note', S6.closed ? '线圈分流，灯较暗' : ia > 0.3 ? '磁场能倒给灯泡' : '电流指数衰减');
  const sc = makeScope('灯 A 电流 i – t');
  scopeBase('t/s', 'i/A');
  const ctx = sc.ctx;
  S6.trace.push([S6.trace.length * 0.004, ia]);
  if (S6.trace.length > 200) S6.trace.shift();
  const toX = (t) => 24 + (t / 0.8) * 180;
  const toY = (i) => 112 - clamp(i / 0.9, 0, 1) * 98;
  ctx.strokeStyle = '#ff9b5e'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  S6.trace.forEach(([t, i], k) => { const x = toX(t), y = toY(i); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();
}

/* ---------- 07 LC 振荡 ---------- */
const S7 = { running: false, trace: [] };
chap({
  id: 'lc', title: 'LC 振荡电路',
  html: `<p>充了电的电容通过电感放电：电容的<b>电场能</b>与电感的<b>磁场能</b>来回转化，电流和电压按正弦规律振荡——<span class="hl">f = 1 / (2π√(LC))</span>。</p>
<p>理想 LC 回路振荡不停；实际上线圈总有电阻，振荡逐渐衰减（阻尼振荡）——<b>线圈电阻越大，衰减越快</b>。无线电广播正来自这类振荡。</p>
<p>点「合上开关」看电压表指针摆动与波形（慢放 ×0.1）。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.0005;
      addEl('cap', { t: 'cap', x: -1.4, z: 0.4, label: 'C = 0.5 F（已充电 3V）', C: 0.5, vc0: 3, a: 1, b: 2 });
      addEl('ind', { t: 'ind', x: 0, z: 0.4, label: 'L = 0.5 H', L: 0.5, a: 2, b: 0 });
      addEl('sw', { t: 'sw', x: 1.2, z: 0.4, label: '开关 S', R: 1e9, a: 0, b: 1 });
      addEl('vol', { t: 'gauge', sub: 'V', x: 0.4, z: -0.5, label: '电容电压', R: 1e7, a: 1, b: 2, ry: Math.PI });
      const y0 = TABLE_Y + 0.06;
      W_([[-1.16, TABLE_Y + 0.2, 0.4], [-0.75, y0, 0.4], [-0.4, TABLE_Y + 0.2, 0.4]], 'cap');
      W_([[0.4, TABLE_Y + 0.2, 0.4], [0.85, y0, 0.4], [1.0, y0, 0.4]], 'ind');
      W_([[1.42, y0, 0.4], [2.0, y0, 0.4], [2.0, y0, -0.7], [0.4, y0, -0.7], [0.4, TABLE_Y + 0.2, -0.56]], 'sw');
      W_([[-1.64, TABLE_Y + 0.2, 0.4], [-2.1, y0, 0.4], [-2.1, y0, -0.55], [0.4, y0, -0.55], [0.4, TABLE_Y + 0.2, -0.56]], 'cap');
      drawSchem([
        { kind: 'cap', sx: 50, sy: 60, dir: 'v', sub: 'C' },
        { kind: 'wire', x1: 50, y1: 36, x2: 50, y2: 24 },
        { kind: 'wire', x1: 50, y1: 24, x2: 150, y2: 24 },
        { kind: 'ind', sx: 100, sy: 60, dir: 'h', sub: 'L' },
        { kind: 'wire', x1: 150, y1: 24, x2: 150, y2: 60 },
        { kind: 'ind', sx: 120, sy: 96, dir: 'h', sub: ' ' },
        { kind: 'wire', x1: 150, y1: 60, x2: 150, y2: 132 },
        { kind: 'wire', x1: 150, y1: 132, x2: 50, y2: 132 },
        { kind: 'wire', x1: 50, y1: 132, x2: 50, y2: 84 },
        { kind: 'sw', sx: 176, sy: 78, dir: 'v', closed: S7.running, sub: 'S' },
        { kind: 'wire', x1: 150, y1: 78, x2: 168, y2: 78 },
        { kind: 'vol', sx: 100, sy: 60, dir: 'h', sub: 'V' },
        { kind: 'wire', x1: 50, y1: 60, x2: 88, y2: 60 },
        { kind: 'wire', x1: 112, y1: 60, x2: 150, y2: 60 },
      ]);
    });
    app.setCamera([-0.3, 3.3, 4.8], [-0.1, 1.3, 0]);
    ctl.clear();
    ctl.button({ label: '⏻ 合上开关（开始振荡）', onClick() { S7.running = true; setSwitchLogic('sw', true); setSwitchVisual('sw', true); S7.trace.length = 0; } });
    ctl.button({ label: '↺ 重新充电', onClick() { CIR.els.get('cap').vc = 3; CIR.els.get('ind').iL = 0; setSwitchLogic('sw', false); setSwitchVisual('sw', false); S7.running = false; S7.trace.length = 0; solveNow(); updLc(); } });
    setHUD([['f0', '固有频率 f₀'], ['uc', 'u_C'], ['il', 'i_L'], ['note', '电场能 ⇄ 磁场能']]);
    solveNow();
    updLc();
  },
});
function updLc() {
  const cap = CIR.els.get('cap'), ind = CIR.els.get('ind');
  setNeedle('vol', Math.abs(cap.V) / 3.3);
  hset('f0', (1 / (2 * Math.PI * Math.sqrt(0.5 * 0.5))).toFixed(2) + ' Hz');
  hset('uc', Math.abs(cap.V).toFixed(2) + ' V');
  hset('il', Math.abs(ind.I).toFixed(3) + ' A');
  const E = 0.5 * 0.5 * cap.V * cap.V + 0.5 * 0.5 * ind.iL * ind.iL;
  hset('note', '总能量 ' + (E * 1000).toFixed(1) + ' mJ（缓降）');
}

/* ---------- 08 桥式整流与电容滤波 ---------- */
const S8 = { filt: false, trace: [], tt: 0 };
chap({
  id: 'bridge', title: '桥式整流与电容滤波',
  html: `<p>四只二极管组成<b>电桥</b>：正半周 D₁D₃ 导通，负半周 D₂D₄ 导通——两只「轮流值班」，把交流变成<b>脉动直流</b>（方向不变、大小变化）。</p>
<p>再并一只<b>滤波电容</b>：电压升高时存电、下降时放电，把「脉包」填平，输出接近平滑直流。手机充电器里就是这套电路。</p>
<p>切换「滤波电容」，对照示波器上输出波形的变化。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 1e-4;
      addEl('ac', { t: 'ac', x: -2.0, z: 0.4, label: '交流 6V 50Hz', kind: 'ac', E: 6, r: 0.3, a: 1, b: 0 });
      CIR.els.get('ac').kind = 'ac';
      addEl('d1', { t: 'dio', x: -1.1, z: 0.62, label: 'D₁', a: 1, b: 3 });
      addEl('d2', { t: 'dio', x: -1.1, z: 0.18, label: 'D₂', a: 2, b: 3 });
      addEl('d3', { t: 'dio', x: 0.3, z: 0.62, label: 'D₃', a: 4, b: 1 });
      addEl('d4', { t: 'dio', x: 0.3, z: 0.18, label: 'D₄', a: 4, b: 2 });
      addEl('load', { t: 'res', x: 1.2, z: 0.4, label: '负载 R = 200Ω', R: 200, a: 3, b: 4 });
      addEl('cf', { t: 'cap', x: 1.9, z: 0.4, label: '滤波电容 470μF', C: 4.7e-4, vc0: 0, a: 3, b: 4 });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.16, 0.4], [-1.4, y0, 0.62], [-1.25, TABLE_Y + 0.14, 0.62]], 'ac');
      W_([[-2.22, TABLE_Y + 0.16, 0.4], [-1.4, y0, 0.18], [-1.25, TABLE_Y + 0.14, 0.18]], 'ac');
      W_([[-0.94, TABLE_Y + 0.14, 0.62], [0.1, y0, 0.62], [0.14, TABLE_Y + 0.14, 0.62]], 'd1');
      W_([[-0.94, TABLE_Y + 0.14, 0.18], [0.1, y0, 0.18], [0.14, TABLE_Y + 0.14, 0.18]], 'd2');
      W_([[0.46, TABLE_Y + 0.14, 0.62], [1.6, y0, 0.62], [1.9, y0, 0.5]], 'd3');
      W_([[0.46, TABLE_Y + 0.14, 0.18], [1.6, y0, 0.18], [1.9, y0, 0.3]], 'd4');
      W_([[1.34, y0, 0.4], [1.75, y0, 0.4]], 'load');
      W_([[2.1, y0, 0.4], [2.5, y0, 0.4], [2.5, y0, -0.7], [0.2, y0, -0.7], [0.2, TABLE_Y + 0.1, -0.45]], 'cf');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 116, x2: 46, y2: 116 },
        { kind: 'node', sx: 38, sy: 60 },
        { kind: 'wire', x1: 38, y1: 60, x2: 38, y2: 116 },
        { kind: 'wire', x1: 38, y1: 60, x2: 30, y2: 60 },
        { kind: 'wire', x1: 38, y1: 60, x2: 38, y2: 30 },
        { kind: 'wire', x1: 38, y1: 30, x2: 46, y2: 30 },
        { kind: 'dio', sx: 58, sy: 30, dir: 'h', sub: 'D1' },
        { kind: 'wire', x1: 70, y1: 30, x2: 96, y2: 30 },
        { kind: 'node', sx: 96, sy: 30 },
        { kind: 'dio', sx: 58, sy: 88, dir: 'h', sub: 'D3' },
        { kind: 'wire', x1: 70, y1: 88, x2: 82, y2: 88 },
        { kind: 'node', sx: 82, sy: 88 },
        { kind: 'wire', x1: 96, y1: 30, x2: 96, y2: 132 },
        { kind: 'dio', sx: 108, sy: 88, dir: 'h', sub: 'D2' },
        { kind: 'wire', x1: 82, y1: 88, x2: 96, y2: 88 },
        { kind: 'wire', x1: 120, y1: 88, x2: 150, y2: 88 },
        { kind: 'dio', sx: 162, sy: 88, dir: 'h', sub: 'D4' },
        { kind: 'wire', x1: 174, y1: 88, x2: 196, y2: 88 },
        { kind: 'wire', x1: 196, y1: 88, x2: 196, y2: 132 },
        { kind: 'wire', x1: 96, y1: 30, x2: 150, y2: 30 },
        { kind: 'wire', x1: 162, y1: 30, x2: 196, y2: 30 },
        { kind: 'wire', x1: 196, y1: 30, x2: 196, y2: 46 },
        { kind: 'res', sx: 160, sy: 52, dir: 'v', sub: 'R' },
        { kind: 'wire', x1: 196, y1: 62, x2: 196, y2: 88 },
        { kind: 'cap', sx: 222, sy: 52, dir: 'v', sub: 'C' },
        { kind: 'wire', x1: 196, y1: 30, x2: 222, y2: 30 },
        { kind: 'wire', x1: 222, y1: 40, x2: 222, y2: 30 },
        { kind: 'wire', x1: 222, y1: 64, x2: 222, y2: 132 },
        { kind: 'wire', x1: 222, y1: 132, x2: 30, y2: 132 },
        { kind: 'wire', x1: 96, y1: 132, x2: 96, y2: 116 },
        { kind: 'wire', x1: 96, y1: 116, x2: 30, y2: 116 },
        { kind: 'wire', x1: 30, y1: 116, x2: 30, y2: 60 },
      ]);
    });
    app.setCamera([-0.3, 3.4, 5.0], [0, 1.3, 0]);
    ctl.clear();
    ctl.toggle({ label: '滤波电容', value: S8.filt, onChange: (v) => { S8.filt = v; CIR.els.get('cf').blown = !v; CIR.els.get('cf').vc = 0; solveNow(); } });
    CIR.els.get('cf').blown = !S8.filt;   // 初始先看未滤波的脉动直流
    ctl.sep();
    ctl.button({ label: '↺ 复位', onClick() { S8.trace.length = 0; S8.tt = 0; } });
    setHUD([['d', '二极管导通'], ['u2', '输出电压'], ['rip', '纹波'], ['note', 'AC → 脉动直流 → 平滑直流']]);
  },
});
function updBridge() {
  const d1 = CIR.els.get('d1'), d2 = CIR.els.get('d2');
  const ph = CIR.els.get('ac').E >= 0;
  hset('d', d1.I > 1e-4 ? '正半周：D₁ D₃' : d2.I > 1e-4 ? '负半周：D₂ D₄' : '换向瞬间');
  const u2 = CIR.els.get('load').V;
  hset('u2', u2.toFixed(2) + ' V');
  hset('rip', S8.filt ? (CIR.els.get('cf').vc > 4 ? '小（电容已充起）' : '充电中…') : '大（无滤波，50Hz 脉包）');
}

/* ---------- 09 惠斯通电桥 ---------- */
const S9 = { R3: 8, balanced: false };
chap({
  id: 'bridgeW', title: '惠斯通电桥测电阻',
  html: `<p>四个电阻组成「桥」：R₁/R₂ 与 R₃/R_x 两个分压臂，中间接灵敏电流计 <b>G</b>。调节 R₃ 使 G 读数为 <b>0</b>（桥平衡），此时两中间点等电位：</p>
<p><span class="hl">R_x = (R₂ / R₁) · R₃</span>——用三个已知电阻精确测出未知电阻，不受电源、电流计精度影响。</p>
<p>调 R₃ 使 G 指零，读出 R_x。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: 0.8, z: 0.62, label: '电源 3V', E: 3, r: 0.3, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: 0.0, z: 0.62, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('r1', { t: 'res', x: -1.3, z: 0.62, label: 'R₁ = 10Ω', R: 10, a: 2, b: 3 });
      addEl('r2', { t: 'res', x: -1.9, z: 0.0, label: 'R₂ = 10Ω', R: 10, a: 3, b: 0 });
      addEl('rh', { t: 'rheo', x: 0.2, z: 0.62, label: '可调 R₃', R: S9.R3, a: 2, b: 4 });
      addEl('rx', { t: 'res', x: 1.7, z: 0.62, label: '待测 Rx', R: 8, a: 4, b: 0 });
      addEl('gal', { t: 'gauge', sub: 'G', x: -0.6, z: 0.0, label: '灵敏电流计', R: 30, a: 3, b: 4, ry: Math.PI });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[1.02, TABLE_Y + 0.34, 0.62], [1.35, y0, 0.62]], 'bat1');
      W_([[0.58, TABLE_Y + 0.34, 0.62], [0.28, y0, 0.62], [0.22, y0, 0.62]], 'sw');
      W_([[-0.22, y0, 0.62], [-1.0, y0, 0.62], [-1.08, TABLE_Y + 0.16, 0.62]], 'sw');
      W_([[-1.52, TABLE_Y + 0.16, 0.62], [-2.2, y0, 0.62], [-2.2, y0, 0.16], [-2.05, TABLE_Y + 0.16, 0.05]], 'r1');
      W_([[-1.74, TABLE_Y + 0.16, 0.0], [-2.2, y0, 0.0], [-2.2, y0, -0.7], [1.9, y0, -0.7], [1.9, y0, 0.62]], 'r2');
      W_([[-1.08, TABLE_Y + 0.16, 0.62], [-0.8, y0, 0.62], [-0.4, y0, 0.62]], 'r1');
      W_([[0.51, y0, 0.62], [1.0, y0, 0.62], [1.42, TABLE_Y + 0.16, 0.62]], 'rh');
      W_([[1.98, TABLE_Y + 0.16, 0.62], [2.5, y0, 0.62], [2.5, y0, -0.7]], 'rx');
      W_([[-0.74, TABLE_Y + 0.1, 0.0], [-1.0, y0, 0.0], [-1.2, y0, 0.0]], 'gal');
      W_([[-0.46, TABLE_Y + 0.1, 0.0], [0.1, y0, 0.0], [0.1, y0, 0.3], [0.1, y0, 0.62]], 'gal');
      drawSchem([
        { kind: 'node', sx: 60, sy: 26 },
        { kind: 'wire', x1: 60, y1: 26, x2: 100, y2: 26 },
        { kind: 'sw', sx: 112, sy: 26, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 120, y1: 26, x2: 150, y2: 26 },
        { kind: 'bat', sx: 160, sy: 60, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 150, y1: 26, x2: 150, y2: 38 },
        { kind: 'wire', x1: 150, y1: 26, x2: 150, y2: 26 },
        { kind: 'wire', x1: 150, y1: 82, x2: 150, y2: 132 },
        { kind: 'wire', x1: 150, y1: 132, x2: 40, y2: 132 },
        { kind: 'wire', x1: 40, y1: 132, x2: 40, y2: 26 },
        { kind: 'wire', x1: 40, y1: 26, x2: 60, y2: 26 },
        { kind: 'node', sx: 40, sy: 26 },
        { kind: 'res', sx: 100, sy: 26, dir: 'h', sub: 'R1' },
        { kind: 'wire', x1: 60, y1: 26, x2: 88, y2: 26 },
        { kind: 'wire', x1: 112, y1: 26, x2: 138, y2: 26 },
        { kind: 'node', sx: 138, sy: 26 },
        { kind: 'rheo', sx: 90, sy: 26, dir: 'v', sub: 'R3' },
        { kind: 'wire', x1: 40, y1: 26, x2: 40, y2: 80 },
        { kind: 'wire', x1: 40, y1: 80, x2: 78, y2: 80 },
        { kind: 'gal', sx: 92, sy: 80, dir: 'h', sub: 'G' },
        { kind: 'wire', x1: 104, y1: 80, x2: 138, y2: 80 },
        { kind: 'wire', x1: 138, y1: 26, x2: 138, y2: 52 },
        { kind: 'rheo', sx: 138, sy: 66, dir: 'v', sub: 'Rx' },
        { kind: 'wire', x1: 138, y1: 80, x2: 138, y2: 88 },
        { kind: 'node', sx: 150, sy: 26 },
      ]);
    });
    app.setCamera([-0.3, 3.4, 4.9], [-0.3, 1.3, 0]);
    ctl.clear();
    ctl.slider({ label: '可调电阻 R₃', min: 1, max: 30, step: 0.25, value: S9.R3, fmt: (v) => v.toFixed(2) + ' Ω', onInput: (v) => { S9.R3 = v; CIR.els.get('rh').R = v; setSliderVisual('rh', (v - 1) / 29); solveNow(); updBridgeW(); } });
    setHUD([['ig', 'G 读数'], ['dir', '偏转方向'], ['rx', 'Rx 读数'], ['tip', 'G 指零即平衡']]);
    solveNow();
    updBridgeW();
  },
});
function updBridgeW() {
  const gal = CIR.els.get('gal');
  const ig = gal.I;
  const frac = clamp(0.5 + ig * 1.2, 0, 1);
  setNeedle('gal', frac);
  const bal = Math.abs(ig) < 0.002;
  hset('ig', Math.abs(ig * 1000).toFixed(1) + ' mA');
  hset('dir', bal ? '✓ 指零——桥平衡！' : ig > 0 ? '右偏 → R₃ 偏大，调小' : '左偏 → R₃ 偏小，调大');
  hset('rx', bal ? `R₂R₃/R₁ = ${S9.R3.toFixed(2)} Ω ✓` : '——（先调平衡）');
  hset('tip', 'R₃ ≈ 8 Ω 附近找指零点');
}

/* ---------- 10 RLC 串联谐振 ---------- */
const S10 = { f: 60, U: 4 };
chap({
  id: 'rlc', title: 'RLC 串联谐振',
  html: `<p>R、L、C 串联后接交流电源：感抗 X_L = 2πfL 随频率升高而增大，容抗 X_C = 1/(2πfC) 随频率升高而减小。当 <span class="hl">X_L = X_C</span> 时二者抵消，阻抗最小（= R），<b>电流最大</b>——这就是谐振，f₀ = 1/(2π√(LC))。</p>
<p>谐振时电容/电感两端电压可达电源电压的 <b>Q 倍</b>（品质因数 Q = √(L/C)/R，本电路 Q ≈ 10，电容上电压可到几十伏——远超电源！）Q 越大，谐振曲线越尖锐、选频越好。收音机的调台，就是靠可变电容改变 f₀ 来选台。</p>
<p>拖频率滑杆，找电流表读数的峰。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('ac', { t: 'ac', x: -1.9, z: 0.4, label: '交流 4V', kind: 'ac', E: 4, r: 0.1, a: 1, b: 0 });
      CIR.els.get('ac').kind = 'ac';
      addEl('r1', { t: 'res', x: -0.9, z: 0.4, label: 'R = 10Ω', R: 10, a: 1, b: 2 });
      addEl('ind', { t: 'ind', x: -0.1, z: 0.4, label: 'L = 0.1 H', L: 0.1, a: 2, b: 3 });
      addEl('cap', { t: 'cap', x: 0.8, z: 0.4, label: 'C = 10 μF', C: 1e-5, a: 3, b: 4 });
      addEl('am', { t: 'gauge', sub: 'A', x: 1.7, z: 0.4, label: '电流表', R: 1e-3, a: 4, b: 0 });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.12, TABLE_Y + 0.16, 0.4], [-1.35, y0, 0.4], [-1.12, TABLE_Y + 0.16, 0.4]], 'ac');
      W_([[-0.68, TABLE_Y + 0.16, 0.4], [-0.45, y0, 0.4], [-0.32, TABLE_Y + 0.2, 0.4]], 'r1');
      W_([[0.12, TABLE_Y + 0.2, 0.4], [0.4, y0, 0.4], [0.56, TABLE_Y + 0.2, 0.4]], 'ind');
      W_([[1.0, TABLE_Y + 0.2, 0.4], [1.25, y0, 0.4], [1.42, TABLE_Y + 0.16, 0.4]], 'cap');
      W_([[1.98, TABLE_Y + 0.16, 0.4], [2.5, y0, 0.4], [2.5, y0, -0.7], [-2.5, y0, -0.7], [-2.12, TABLE_Y + 0.16, 0.4]], 'am');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 46, y2: 114 },
        { kind: 'wire', x1: 30, y1: 114, x2: 30, y2: 30 },
        { kind: 'wire', x1: 30, y1: 30, x2: 46, y2: 30 },
        { kind: 'res', sx: 58, sy: 30, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 70, y1: 30, x2: 92, y2: 30 },
        { kind: 'ind', sx: 106, sy: 30, dir: 'h', sub: 'L' },
        { kind: 'wire', x1: 118, y1: 30, x2: 140, y2: 30 },
        { kind: 'cap', sx: 154, sy: 30, dir: 'h', sub: 'C' },
        { kind: 'wire', x1: 166, y1: 30, x2: 188, y2: 30 },
        { kind: 'am', sx: 200, sy: 30, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 212, y1: 30, x2: 222, y2: 30 },
        { kind: 'wire', x1: 222, y1: 30, x2: 222, y2: 114 },
        { kind: 'wire', x1: 222, y1: 114, x2: 30, y2: 114 },
      ]);
    });
    app.setCamera([-0.2, 3.4, 5.0], [0, 1.3, 0]);
    ctl.clear();
    ctl.slider({ label: '电源频率 f', min: 20, max: 500, step: 5, value: S10.f, fmt: (v) => v + ' Hz', onInput: (v) => { S10.f = v; updRlc(); } });
    ctl.slider({ label: '电源电压', min: 1, max: 6, step: 0.5, value: S10.U, fmt: (v) => v.toFixed(1) + ' V', onInput: (v) => { S10.U = v; updRlc(); } });
    ctl.sep();
    ctl.button({ label: '⇦ 调到 f₀', onClick() { S10.f = 159; const sl = document.querySelector('#controls input[type=range]'); sl.value = 159; sl.dispatchEvent(new Event('input', { bubbles: true })); } });
    setHUD([['f0', '谐振频率'], ['xl', '感抗 X_L'], ['xc', '容抗 X_C'], ['i', '电流 I'], ['q', '品质因数 Q']]);
    updRlc();
  },
});
function updRlc() {
  const w = TAU * S10.f;
  const XL = w * 0.1, XC = 1 / (w * 1e-5);
  const Z = Math.sqrt(100 + (XL - XC) ** 2);
  const i = S10.U / Z;
  const Q = Math.sqrt(0.1 / 1e-5) / 10;
  setNeedle('am', i / 0.5);
  hset('f0', (1 / (2 * Math.PI * Math.sqrt(0.1 * 1e-5))).toFixed(0) + ' Hz');
  hset('xl', XL.toFixed(1) + ' Ω');
  hset('xc', XC.toFixed(1) + ' Ω');
  hset('i', i.toFixed(3) + ' A' + (Math.abs(S10.f - 159) < 6 ? ' ← 谐振峰！' : ''));
  hset('q', `Q = ${Q.toFixed(0)}；谐振时 U_C ≈ Q·U = ${(Q * S10.U).toFixed(0)} V`);
  const sc = makeScope('I – f 谐振曲线');
  scopeBase('f/Hz', 'I/A');
  const ctx = sc.ctx;
  const toX = (f) => 24 + (Math.log(f / 20) / Math.log(25)) * 180;
  const toY = (ii) => 112 - clamp(ii / 0.45, 0, 1) * 98;
  ctx.strokeStyle = '#6fb3e0'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let k = 0; k <= 80; k++) {
    const f = 20 * Math.pow(25, k / 80);
    const w2 = TAU * f;
    const ii = S10.U / Math.sqrt(100 + (w2 * 0.1 - 1 / (w2 * 1e-5)) ** 2);
    const x = toX(f), y = toY(ii);
    if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#ff9b5e';
  ctx.beginPath(); ctx.arc(toX(S10.f), toY(i), 3.6, 0, TAU); ctx.fill();
}

/* ---------- 11 变压器原理 ---------- */
const S11 = { N1: 400, N2: 200, RL: 40 };
chap({
  id: 'xfmr', title: '变压器原理',
  html: `<p>两个线圈绕在同一铁芯上：原线圈通入交流，铁芯中产生<b>变化的磁通</b>，副线圈因<b>电磁感应</b>产生电压。理想变压器：</p>
<p><span class="hl">U₂ / U₁ = N₂ / N₁</span>（变压比 = 匝数比），且 I₁N₁ ≈ I₂N₂（输入功率 ≈ 输出功率）。升压变压器 N₂&gt;N₁，降压则反之。输电网上用升压减损耗、再用降压送到用户。注意：变压器<b>不能改变恒定电压</b>——直流不产生变化的磁通，副线圈没有感应电压。</p>
<p>拧两个匝数旋钮，看副线圈电压与电流怎么变。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('ac', { t: 'ac', x: -1.9, z: 0.4, label: '交流 6V', kind: 'ac', E: 6, r: 0.2, a: 1, b: 0 });
      CIR.els.get('ac').kind = 'ac';
      addEl('am1', { t: 'gauge', sub: 'A', x: -1.0, z: 0.4, label: '原线圈电流', R: 1e-3, a: 1, b: 2 });
      addEl('xf', { t: 'xfmr', x: 0.2, z: 0.4, label: '变压器' });
      addEl('vol1', { t: 'gauge', sub: 'V', x: 0.2, z: -0.55, label: 'U₁', R: 1e7, a: 1, b: 0, ry: Math.PI });
      addEl('vol2', { t: 'gauge', sub: 'V', x: 1.4, z: -0.55, label: 'U₂', R: 1e7, a: 3, b: 0, ry: Math.PI });
      addEl('rl', { t: 'rheo', x: 2.0, z: 0.4, label: '负载 R', R: S11.RL, a: 3, b: 0 });
      addEl('am2', { t: 'gauge', sub: 'A', x: 1.3, z: 0.4, label: '副线圈电流', R: 1e-3, a: 3, b: 4 });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.12, TABLE_Y + 0.16, 0.4], [-1.35, y0, 0.4], [-1.15, TABLE_Y + 0.16, 0.4]], 'ac');
      W_([[-0.85, TABLE_Y + 0.16, 0.4], [-0.55, y0, 0.4], [-0.28, y0, 0.4]], 'am1');
      W_([[-1.9, y0, 0.45], [-1.9, y0, -0.75], [0.2, y0, -0.75], [0.2, TABLE_Y + 0.2, -0.6]], 'ac');
      W_([[0.55, y0, 0.4], [1.15, y0, 0.4], [1.15, TABLE_Y + 0.16, 0.4]], 'xf');
      W_([[1.45, TABLE_Y + 0.16, 0.4], [1.75, y0, 0.4]], 'am2');
      W_([[1.35, TABLE_Y + 0.1, -0.5], [1.4, y0, -0.55], [1.72, y0, -0.55]], 'vol2');
      W_([[2.3, y0, 0.4], [2.6, y0, 0.4], [2.6, y0, -0.75], [-1.9, y0, -0.75]], 'rl');
      drawSchem([
        { kind: 'wire', x1: 34, y1: 118, x2: 50, y2: 118 },
        { kind: 'wire', x1: 34, y1: 118, x2: 34, y2: 30 },
        { kind: 'wire', x1: 34, y1: 30, x2: 50, y2: 30 },
        { kind: 'am', sx: 62, sy: 30, dir: 'h', sub: 'A1' },
        { kind: 'wire', x1: 74, y1: 30, x2: 96, y2: 30 },
        { kind: 'ind', sx: 110, sy: 74, dir: 'v', sub: 'N1' },
        { kind: 'wire', x1: 96, y1: 30, x2: 110, y2: 30 },
        { kind: 'wire', x1: 110, y1: 30, x2: 110, y2: 62 },
        { kind: 'wire', x1: 110, y1: 86, x2: 110, y2: 118 },
        { kind: 'wire', x1: 110, y1: 118, x2: 34, y2: 118 },
        { kind: 'vol', sx: 62, sy: 74, dir: 'h', sub: 'V1' },
        { kind: 'wire', x1: 74, y1: 74, x2: 98, y2: 74 },
        { kind: 'node', sx: 110, sy: 30 },
        { kind: 'ind', sx: 148, sy: 74, dir: 'v', sub: 'N2' },
        { kind: 'wire', x1: 110, y1: 30, x2: 148, y2: 30 },
        { kind: 'wire', x1: 148, y1: 30, x2: 148, y2: 62 },
        { kind: 'wire', x1: 148, y1: 86, x2: 148, y2: 104 },
        { kind: 'am', sx: 166, sy: 96, dir: 'h', sub: 'A2' },
        { kind: 'wire', x1: 148, y1: 96, x2: 154, y2: 96 },
        { kind: 'wire', x1: 178, y1: 96, x2: 210, y2: 96 },
        { kind: 'wire', x1: 210, y1: 96, x2: 210, y2: 118 },
        { kind: 'wire', x1: 210, y1: 118, x2: 110, y2: 118 },
        { kind: 'rheo', sx: 190, sy: 60, dir: 'v', sub: 'R' },
        { kind: 'wire', x1: 210, y1: 96, x2: 190, y2: 96 },
        { kind: 'wire', x1: 190, y1: 48, x2: 190, y2: 30 },
        { kind: 'wire', x1: 190, y1: 30, x2: 148, y2: 30 },
        { kind: 'node', sx: 148, sy: 30 },
        { kind: 'vol', sx: 166, sy: 52, dir: 'h', sub: 'V2' },
        { kind: 'wire', x1: 178, y1: 52, x2: 190, y2: 52 },
        { kind: 'wire', x1: 154, y1: 52, x2: 148, y2: 52 },
      ]);
    });
    app.setCamera([-0.1, 3.4, 5.0], [0.2, 1.3, 0]);
    ctl.clear();
    ctl.slider({ label: '原线圈匝数 N₁', min: 100, max: 1000, step: 20, value: S11.N1, fmt: (v) => v + ' 匝', onInput: (v) => { S11.N1 = v; updXfmr(); } });
    ctl.slider({ label: '副线圈匝数 N₂', min: 50, max: 1200, step: 10, value: S11.N2, fmt: (v) => v + ' 匝', onInput: (v) => { S11.N2 = v; updXfmr(); } });
    ctl.slider({ label: '负载电阻', min: 10, max: 120, step: 5, value: S11.RL, fmt: (v) => v + ' Ω', onInput: (v) => { S11.RL = v; CIR.els.get('rl').R = v; setSliderVisual('rl', (v - 10) / 110); updXfmr(); } });
    setHUD([['n', '匝数比 N₂/N₁'], ['u2', 'U₂ = U₁·n'], ['i2', 'I₂ = U₂/R'], ['i1', 'I₁ ≈ n·I₂']]);
    updXfmr();
  },
});
function updXfmr() {
  CIR.els.get('rl').R = S11.RL;
  solveNow();
  const i1 = Math.abs(CIR.els.get('am1').I);
  const n = S11.N2 / S11.N1;
  const u1 = 6;
  const u2 = u1 * n;
  const i2 = u2 / S11.RL;
  setNeedle('vol1', u1 / 8); setNeedle('vol2', u2 / 24); setNeedle('am2', i2 / 1.2); setNeedle('am1', i1 / 1.2);
  hset('n', n.toFixed(2) + (n > 1 ? '（升压）' : '（降压）'));
  hset('u2', u2.toFixed(2) + ' V');
  hset('i2', i2.toFixed(3) + ' A');
  hset('i1', '≈ ' + (i2 * n).toFixed(3) + ' A');
}

/* ---------- 12 二极管单向导电性 ---------- */
const S12 = { rev: false };
chap({
  id: 'diode', title: '二极管单向导电性',
  html: `<p>二极管只让电流单方向通过：<b>正向偏置</b>（正极接高电位）约 0.7 V 后导通；<b>反向偏置</b>时截止（只有极小的漏电流）。发光二极管 LED 一样单向导通，但<b>导通电压更高</b>：红色约 1.8 V，蓝色约 3 V——不同颜色禁带宽度不同，导通电压也不同。</p>
<p>这就是「交流变直流」的基础——整流用的正是二极管的这个脾气。</p>
<p>点「电池反接」，看 LED 和电流表读数的变化。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 3V', E: 3, r: 0.3, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('dio', { t: 'dio', x: -0.2, z: 0.4, label: '二极管（硅 0.7V）', a: 2, b: 3 });
      addEl('led', { t: 'led', x: 0.7, z: 0.4, label: '发光二极管（红 1.8V）', VF: 1.8, a: 3, b: 4 });
      addEl('res', { t: 'res', x: 1.5, z: 0.4, label: '限流电阻', R: 90, a: 4, b: 5 });
      addEl('am', { t: 'gauge', sub: 'mA', x: 2.2, z: -0.5, label: '毫安表', R: 1, a: 5, b: 0, ry: Math.PI });
      CIR.N = 6;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.7], [2.2, y0, -0.7], [2.2, TABLE_Y + 0.2, -0.56]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.28, y0, 0.4]], 'bat1');
      W_([[-0.92, y0, 0.4], [-0.5, y0, 0.4], [-0.35, TABLE_Y + 0.14, 0.4]], 'sw');
      W_([[-0.05, TABLE_Y + 0.14, 0.4], [0.25, y0, 0.4], [0.5, TABLE_Y + 0.14, 0.4]], 'dio');
      W_([[0.9, TABLE_Y + 0.14, 0.4], [1.25, y0, 0.4], [1.3, TABLE_Y + 0.16, 0.4]], 'led');
      W_([[1.7, TABLE_Y + 0.16, 0.4], [2.3, y0, 0.4], [2.3, y0, 0.62]], 'res');
      W_([[2.2, TABLE_Y + 0.2, -0.44], [2.3, y0, 0.1], [2.3, y0, 0.62]], 'am');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 116, x2: 48, y2: 116 },
        { kind: 'bat', sx: 58, sy: 116, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 58, y1: 92, x2: 58, y2: 40 },
        { kind: 'sw', sx: 58, sy: 30, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 66, y1: 30, x2: 96, y2: 30 },
        { kind: 'dio', sx: 110, sy: 30, dir: 'h', sub: 'D' },
        { kind: 'wire', x1: 122, y1: 30, x2: 144, y2: 30 },
        { kind: 'dio', sx: 158, sy: 30, dir: 'h', sub: 'LED' },
        { kind: 'wire', x1: 170, y1: 30, x2: 192, y2: 30 },
        { kind: 'res', sx: 206, sy: 30, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 218, y1: 30, x2: 226, y2: 30 },
        { kind: 'wire', x1: 226, y1: 30, x2: 226, y2: 116 },
        { kind: 'am', sx: 128, sy: 116, dir: 'h', sub: 'mA' },
        { kind: 'wire', x1: 118, y1: 116, x2: 30, y2: 116 },
        { kind: 'node', sx: 226, sy: 116 },
      ]);
    });
    app.setCamera([-0.1, 3.3, 4.8], [0.1, 1.3, 0]);
    ctl.clear();
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === S12.rev));
    [['fwd', '正接'], ['rev', '电池反接']].forEach(([v, t]) => {
      const b = ctl.button({ label: t, onClick() { S12.rev = v === 'rev'; CIR.els.get('bat1').E = S12.rev ? -3 : 3; solveNow(); updDiode(); paint(); } });
      btns.push({ b, v });
    });
    paint();
    ctl.sep();
    ctl.toggle({ label: '开关', value: true, onChange: (v) => { setSwitchLogic('sw', v); setSwitchVisual('sw', v); solveNow(); updDiode(); } });
    setHUD([['st', '状态'], ['i', '电流'], ['ud', '二极管压降'], ['note', '单向导电']]);
    solveNow();
    updDiode();
  },
});
function updDiode() {
  const d = CIR.els.get('dio'), led = CIR.els.get('led');
  const rec = ELVIS.get('led');
  if (rec && rec.parts.glow) rec.parts.glow.material.opacity = led.I > 0.002 ? 0.7 : 0;
  setNeedle('am', Math.abs(d.I) / 0.03);
  hset('st', d.I > 1e-4 ? '✓ 正向导通（0.7V 门槛）' : '✗ 反向截止');
  hset('i', (Math.abs(d.I) * 1000).toFixed(2) + ' mA');
  hset('ud', d.V.toFixed(2) + ' V');
  hset('note', S12.rev ? '反接：几乎没有电流' : '正接：0.7V 后畅通');
}

/* ---------- 13 三极管光控路灯 ---------- */
const S13 = { lux: 300, R2: 10, night: false };
chap({
  id: 'photocell', title: '三极管光控路灯',
  html: `<p>三极管是「以小控大」的电流开关：基极 b 流入小电流 I_B，集电极 c 就能通过 β·I_B 的大电流。光敏电阻 LDR 天黑时阻值飙升，分压点电压升高 → 注入基极 → 三极管导通 → <b>路灯自动点亮</b>。</p>
<p>小电流控制大电流，这正是三极管放大与开关作用的日常应用。</p>
<p>拖「光照」滑杆从白天天黑，看路灯何时点亮；再调「灵敏度」。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 6V', E: 6, r: 0.2, a: 1, b: 0 });
      addEl('r2', { t: 'res', x: -1.1, z: 0.4, label: '上偏置电阻 R₂', R: S13.R2 * 1000, a: 1, b: 2 });
      addEl('ldr', { t: 'res', x: -0.3, z: 0.4, label: '光敏电阻 LDR', R: 2000, a: 2, b: 0 });
      addEl('npn', { t: 'npn', x: 0.5, z: 0.4, label: '三极管 β=100', a: 0, b: 0, R: 1e9 });
      addEl('lamp', { t: 'lamp', x: 1.5, z: 0.2, label: '路灯', a: 0, b: 0, R: 1e9 });
      addEl('rlamp', { t: 'res', x: 1.0, z: 0.62, label: '灯限流电阻', R: 24, a: 3, b: 4 });
      addEl('am', { t: 'gauge', sub: 'mA', x: 1.9, z: 0.62, label: '集电极电流', R: 1, a: 4, b: 0 });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, 0.62], [2.6, y0, 0.62]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.4, y0, -0.7], [2.6, y0, -0.7]], 'bat1');
      W_([[-1.1, TABLE_Y + 0.24, 0.62], [-1.1, y0, 0.58], [-0.98, TABLE_Y + 0.16, 0.44]], 'r2');
      W_([[-0.98, TABLE_Y + 0.16, 0.4], [-0.6, y0, 0.4], [-0.3, y0, 0.4], [-0.3, y0, 0.16], [-0.3, TABLE_Y + 0.2, 0.16]], 'r2');
      W_([[-0.3, TABLE_Y + 0.16, 0.4], [-0.3, y0, 0.3], [-0.55, y0, 0.0], [-0.55, y0, -0.7]], 'ldr');
      W_([[2.4, y0, 0.62], [2.4, y0, -0.55], [2.0, y0, -0.55], [2.0, TABLE_Y + 0.2, -0.5]], 'rlamp');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 30, x2: 216, y2: 30 },
        { kind: 'wire', x1: 40, y1: 30, x2: 40, y2: 60 },
        { kind: 'rheo', sx: 40, sy: 76, dir: 'v', sub: 'R2' },
        { kind: 'wire', x1: 40, y1: 92, x2: 40, y2: 100 },
        { kind: 'node', sx: 40, sy: 100 },
        { kind: 'rheo', sx: 40, sy: 116, dir: 'v', sub: 'LDR' },
        { kind: 'wire', x1: 40, y1: 132, x2: 216, y2: 132 },
        { kind: 'wire', x1: 40, y1: 100, x2: 80, y2: 100 },
        { kind: 'wire', x1: 80, y1: 100, x2: 80, y2: 64 },
        { kind: 'node', sx: 80, sy: 64 },
        { kind: 'wire', x1: 80, y1: 64, x2: 96, y2: 64 },
        { kind: 'wire', x1: 96, y1: 30, x2: 96, y2: 56 },
        { kind: 'wire', x1: 96, y1: 72, x2: 96, y2: 110 },
        { kind: 'wire', x1: 96, y1: 110, x2: 216, y2: 110 },
        { kind: 'wire', x1: 216, y1: 110, x2: 216, y2: 132 },
        { kind: 'res', sx: 130, sy: 88, dir: 'h', sub: 'Rc' },
        { kind: 'wire', x1: 118, y1: 88, x2: 118, y2: 30 },
        { kind: 'wire', x1: 142, y1: 88, x2: 160, y2: 88 },
        { kind: 'node', sx: 160, sy: 88 },
        { kind: 'bulb', sx: 172, sy: 88, dir: 'h', sub: '灯' },
        { kind: 'wire', x1: 184, y1: 88, x2: 216, y2: 88 },
        { kind: 'node', sx: 80, sy: 64 },
      ]);
    });
    app.setCamera([-0.3, 3.3, 4.9], [0.2, 1.4, 0]);
    ctl.clear();
    ctl.slider({ label: '光照强度', min: 0, max: 600, step: 10, value: S13.lux, fmt: (v) => v + ' lux', onInput: (v) => { S13.lux = v; updPhoto(); } });
    ctl.slider({ label: '灵敏度 R₂', min: 4, max: 40, step: 2, value: S13.R2, fmt: (v) => v.toFixed(0) + ' kΩ', onInput: (v) => { S13.R2 = v; CIR.els.get('r2').R = v * 1000; updPhoto(); } });
    ctl.sep();
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === S13.lux));
    [[40, '入夜 40lx'], [300, '傍晚 300lx'], [560, '白天 560lx']].forEach(([v, t]) => {
      const b = ctl.button({ label: t, onClick() { S13.lux = v; const sl = document.querySelectorAll('#controls input[type=range]')[0]; sl.value = v; sl.dispatchEvent(new Event('input', { bubbles: true })); paint(); } });
      btns.push({ b, v });
    });
    paint();
    setHUD([['rldr', 'LDR 阻值'], ['vb', '分压点电压'], ['ib', '基极电流'], ['lamp', '路灯状态']]);
    updPhoto();
  },
});
function updPhoto() {
  const rldr = clamp(60000 / (1 + S13.lux / 12), 400, 80000);
  CIR.els.get('ldr').R = rldr;
  CIR.els.get('r2').R = S13.R2 * 1000;
  // 戴维南等效：Vth = 6·R_LDR/(R₂+R_LDR)，Rth = R₂∥R_LDR；基极 0.7V 钳位
  const R2v = S13.R2 * 1000;
  const vth = 6 * rldr / (R2v + rldr);
  const rth = (R2v * rldr) / (R2v + rldr);
  const ib = Math.max((vth - 0.7) / rth, 0);
  const ic = Math.min(ib * 100, 0.25);
  const on = ic > 0.02;
  const rec = ELVIS.get('lamp');
  if (rec && rec.parts.bulb) rec.parts.bulb.material.emissiveIntensity = clamp(ic / 0.12, 0, 1.6);
  setNeedle('am', ic / 0.3);
  hset('rldr', (rldr / 1000).toFixed(1) + ' kΩ');
  hset('vb', vth.toFixed(2) + ' V');
  hset('ib', (ib * 1000).toFixed(3) + ' mA');
  hset('lamp', on ? `💡 点亮（β·I_B = ${(ic * 1000).toFixed(0)} mA）` : '熄灭');
}

/* ---------- 14 直流电动机 ---------- */
const S14 = { E: 4, R: 2, TL: 0, omega: 0 };
chap({
  id: 'motor', title: '直流电动机',
  html: `<p>通电线圈在磁场中受力转动——这就是电动机。转动起来的线圈又切割磁感线产生<b>反电动势</b> E = kω（方向与电源相反）：</p>
<p><span class="hl">U = I·R + kω</span>。刚启动时 ω=0、电流最大；转得越快，电流越小。卡住电动机轴（堵转），电流猛增——电机发热烧毁常见原因。</p>
<p>调电压与串联电阻，读转速与反电动势。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.001;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源', E: S14.E, r: 0.2, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('rh', { t: 'rheo', x: -0.2, z: 0.4, label: '调速电阻', R: S14.R, a: 2, b: 3 });
      addEl('motR', { t: 'motor', x: 0.9, z: 0.4, label: '电动机（电枢）', R: 1.5, a: 3, b: 4 });
      addEl('emf', { t: 'res', x: 0.9, z: 0.4, label: '反电动势', kind: 'emf', E: 0, r: 0.02, a: 4, b: 5, ry: 0 });
      CIR.els.get('emf').kind = 'emf';
      addEl('am', { t: 'gauge', sub: 'A', x: 1.8, z: -0.5, label: '电流表', R: 1e-3, a: 5, b: 0, ry: Math.PI });
      CIR.N = 6;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.7], [1.8, y0, -0.7], [1.8, TABLE_Y + 0.2, -0.56]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.28, y0, 0.4]], 'bat1');
      W_([[-0.92, y0, 0.4], [-0.55, y0, 0.4], [-0.4, y0, 0.4]], 'sw');
      W_([[0.1, y0, 0.4], [0.4, y0, 0.4], [0.6, y0, 0.4]], 'rh');
      W_([[1.1, y0, 0.4], [1.4, y0, 0.4], [1.7, y0, 0.4], [1.9, y0, 0.5]], 'motR');
      W_([[1.75, y0, 0.4], [2.4, y0, 0.4], [2.4, y0, -0.4], [1.8, y0, -0.7]], 'emf');
      drawSchem([
        { kind: 'wire', x1: 28, y1: 114, x2: 46, y2: 114 },
        { kind: 'bat', sx: 56, sy: 114, dir: 'v', sub: 'U' },
        { kind: 'wire', x1: 56, y1: 90, x2: 56, y2: 40 },
        { kind: 'sw', sx: 56, sy: 30, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 64, y1: 30, x2: 92, y2: 30 },
        { kind: 'rheo', sx: 106, sy: 30, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 118, y1: 30, x2: 140, y2: 30 },
        { kind: 'res', sx: 154, sy: 30, dir: 'h', sub: '电枢' },
        { kind: 'wire', x1: 166, y1: 30, x2: 186, y2: 30 },
        { kind: 'bat', sx: 200, sy: 30, dir: 'h', sub: 'E反' },
        { kind: 'wire', x1: 212, y1: 30, x2: 224, y2: 30 },
        { kind: 'wire', x1: 224, y1: 30, x2: 224, y2: 114 },
        { kind: 'am', sx: 130, sy: 114, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 120, y1: 114, x2: 28, y2: 114 },
        { kind: 'node', sx: 224, sy: 114 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0.2, 1.3, 0]);
    ctl.clear();
    ctl.slider({ label: '电源电压 U', min: 0, max: 6, step: 0.5, value: S14.E, fmt: (v) => v.toFixed(1) + ' V', onInput: (v) => { S14.E = v; CIR.els.get('bat1').E = v; solveNow(); updMotor(); } });
    ctl.slider({ label: '调速电阻', min: 0, max: 12, step: 0.5, value: S14.R, fmt: (v) => v.toFixed(1) + ' Ω', onInput: (v) => { S14.R = v; CIR.els.get('rh').R = v; setSliderVisual('rh', v / 12); solveNow(); updMotor(); } });
    ctl.slider({ label: '负载转矩', min: 0, max: 0.15, step: 0.005, value: S14.TL, fmt: (v) => v.toFixed(3) + ' N·m', onInput: (v) => { S14.TL = v; updMotor(); } });
    ctl.sep();
    ctl.toggle({ label: '开关', value: true, onChange: (v) => { setSwitchLogic('sw', v); setSwitchVisual('sw', v); solveNow(); updMotor(); } });
    setHUD([['eq', 'U = IR + kω'], ['i', '电枢电流'], ['w', '转速'], ['emf', '反电动势 kω'], ['tl', '负载转矩']]);
    updMotor();
  },
});
function updMotor() {
  CIR.els.get('bat1').E = S14.E;
  CIR.els.get('rh').R = S14.R;
  solveNow();
  const i = Math.abs(CIR.els.get('emf').I);
  const stalled = S14.TL > 0 && S14.omega < 0.1 && i > 0.05 && 0.12 * i < S14.TL;
  hset('i', i.toFixed(3) + ' A' + (stalled ? '（堵转！）' : ''));
  hset('w', (S14.omega).toFixed(1) + ' rad/s（' + (S14.omega * 9.55).toFixed(0) + ' rpm）');
  hset('emf', (0.12 * S14.omega).toFixed(2) + ' V');
  hset('tl', S14.TL === 0 ? '空载' : `${S14.TL.toFixed(3)} N·m${stalled ? ' → 堵转，电流最大' : ' → 转速下降、电流上升'}`);
  setNeedle('am', i / 3);
}
function motorTick(dt) {
  const i = Math.abs(CIR.els.get('emf').I);
  const kt = 0.12, b = 0.0018, J = 0.008;
  // 力矩平衡：kt·I − b·ω − TL（负载转矩），堵转时 ω 停在 0
  const net = kt * i - b * S14.omega - S14.TL;
  S14.omega = Math.max(0, S14.omega + net / J * dt * 0.25);
  S14.omega = clamp(S14.omega, 0, 60);
  CIR.els.get('emf').E = 0.12 * S14.omega;
  const rec = ELVIS.get('motR');
  if (rec && rec.parts.rotor) rec.parts.rotor.rotation.z -= S14.omega * dt * 2;
  solveNow();
  updMotor();
}

/* ---------- 15 短路与保险丝 ---------- */
const S15 = { shorted: false, fuseT: 0, blown: false, Ir: 0.3 };
chap({
  id: 'short', title: '短路与保险丝',
  html: `<p>用导线直接把灯泡两端连起来——<b>短路</b>：电流不再走灯泡，全部走「阻力最小」的短路线。电流 I = E/(r₀+r_短) 瞬间飙到十几安，导线发热起火。</p>
<p><b>保险丝</b>是电路的「牺牲品」：低熔点合金丝，电流超限先把它烧断，保住整个电路。选用原则：<b>串联在干路上，额定电流略大于正常工作电流</b>（本例正常约 0.24 A，选 0.3 A）。家庭电路里它进化成了空气开关。</p>
<p>闭合短接开关，看保险丝发光烧断；调大额定电流再试；点「更换保险丝」复位。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 3V（内阻 0.3Ω）', E: 3, r: 0.3, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '主开关', R: 1e-4, a: 1, b: 2 });
      addEl('fu', { t: 'fuse', x: -0.2, z: 0.4, label: '保险丝（额定 0.3A）', R: 0.05, Ir: S15.Ir, a: 2, b: 4 });
      addEl('am', { t: 'gauge', sub: 'A', x: 1.9, z: 0.4, label: '电流表', R: 1e-3, a: 4, b: 3 });
      addEl('bl', { t: 'bulb', x: 0.8, z: 0.4, label: '灯泡', R: 12, a: 3, b: 0 });
      addEl('sh', { t: 'sw', x: 0.8, z: -0.4, label: '短接开关（危险）', R: 1e9, a: 3, b: 0 });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.75], [2.6, y0, -0.75], [2.6, y0, 0.4], [2.1, y0, 0.4]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.28, y0, 0.4]], 'bat1');
      W_([[-0.92, y0, 0.4], [-0.6, y0, 0.4], [-0.35, TABLE_Y + 0.1, 0.4]], 'sw');
      W_([[-0.05, TABLE_Y + 0.1, 0.4], [0.3, y0, 0.4], [0.52, TABLE_Y + 0.4, 0.4]], 'fu');
      W_([[1.08, TABLE_Y + 0.4, 0.4], [1.4, y0, 0.4], [1.68, TABLE_Y + 0.16, 0.4]], 'bl');
      W_([[1.0, TABLE_Y + 0.06, -0.36], [1.4, y0, -0.4], [1.4, y0, -0.75]], 'sh');
      W_([[1.98, TABLE_Y + 0.16, 0.4], [2.4, y0, 0.4], [2.4, y0, 0.4]], 'am');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 46, y2: 114 },
        { kind: 'bat', sx: 56, sy: 114, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 56, y1: 90, x2: 56, y2: 36 },
        { kind: 'sw', sx: 56, sy: 28, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 64, y1: 28, x2: 94, y2: 28 },
        { kind: 'node', sx: 94, sy: 28 },
        { kind: 'wire', x1: 94, y1: 28, x2: 112, y2: 28 },
        { kind: 'wire', x1: 94, y1: 28, x2: 94, y2: 64 },
        { kind: 'wire', x1: 112, y1: 28, x2: 196, y2: 28 },
        { kind: 'res', sx: 130, sy: 52, dir: 'v', sub: '灯' },
        { kind: 'wire', x1: 112, y1: 28, x2: 112, y2: 40 },
        { kind: 'wire', x1: 130, y1: 40, x2: 130, y2: 64 },
        { kind: 'wire', x1: 130, y1: 64, x2: 94, y2: 64 },
        { kind: 'wire', x1: 94, y1: 64, x2: 94, y2: 114 },
        { kind: 'sw', sx: 150, sy: 64, dir: 'h', closed: false, sub: '短路' },
        { kind: 'wire', x1: 162, y1: 64, x2: 94, y2: 64 },
        { kind: 'am', sx: 140, sy: 114, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 130, y1: 114, x2: 30, y2: 114 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0.2, 1.3, 0]);
    ctl.clear();
    ctl.toggle({ label: '短接开关（危险动作）', value: false, onChange: (v) => { S15.shorted = v; setSwitchLogic('sh', v); setSwitchVisual('sh', v); } });
    ctl.slider({ label: '保险丝额定电流', min: 0.2, max: 1.0, step: 0.05, value: S15.Ir, fmt: (v) => v.toFixed(2) + ' A', onInput: (v) => { S15.Ir = v; const f = CIR.els.get('fu'); if (!f.blown) f.Ir = v; updShort(); } });
    ctl.sep();
    ctl.button({ label: '🔧 更换保险丝', onClick() { S15.blown = false; S15.fuseT = 0; const f = CIR.els.get('fu'); f.blown = false; f.R = 0.05; f.Ir = S15.Ir; const rec = ELVIS.get('fu'); rec.parts.wire.visible = true; rec.parts.wire.scale.x = 1; solveNow(); updShort(); } });
    setHUD([['i', '总电流'], ['fuse', '保险丝'], ['bl', '灯泡'], ['warn', '安全提示']]);
    solveNow();
    updShort();
  },
});
function updShort() {
  const am = CIR.els.get('am'), bl = CIR.els.get('bl');
  const i = Math.abs(am.I);
  setNeedle('am', i / 12);
  bulbGlow('bl', Math.abs(bl.I) / 0.25);
  const f = CIR.els.get('fu');
  hset('i', i.toFixed(2) + ' A');
  hset('fuse', f.blown ? '❌ 已熔断（电路断开）' : S15.fuseT > 0 ? '🔥 过热中…' : `✓ 正常（额定 ${(f.Ir || 0.3).toFixed(2)} A）`);
  hset('bl', Math.abs(bl.I) > 0.02 ? '亮' : '熄');
  hset('warn', S15.shorted && !f.blown ? '短路电流 ' + i.toFixed(1) + ' A！保险丝先替你扛' : '家庭电路严禁短路');
}
function shortTick(dt) {
  const am = CIR.els.get('am');
  const i = Math.abs(am.I);
  const f = CIR.els.get('fu');
  const Ir = f.Ir || 0.3;
  if (!f.blown && i > 1.4 * Ir) {
    S15.fuseT += dt;
    const rec = ELVIS.get('fu');
    if (rec && rec.parts.wire) {
      rec.parts.wire.material.color.setHex(0xff5533);
      rec.parts.wire.material.emissive = new THREE.Color(0xff3311);
      rec.parts.wire.material.emissiveIntensity = Math.min(1, S15.fuseT * 3);
    }
    if (S15.fuseT > 0.35) {
      f.blown = true; f.R = 1e9;
      const rec2 = ELVIS.get('fu');
      if (rec2 && rec2.parts.wire) {
        rec2.parts.wire.visible = true;
        rec2.parts.wire.scale.set(0.12, 1, 1);
        rec2.parts.wire.position.x = -0.11;
        rec2.parts.wire.material.emissiveIntensity = 0;
      }
    }
  }
  solveNow();
  updShort();
}

/* ---------- 16 稳压二极管稳压电路 ---------- */
const S16 = { U: 9 };
chap({
  id: 'zener', title: '稳压二极管稳压电路',
  html: `<p>稳压二极管工作在<b>反向击穿区</b>：反向电压达到稳压值 U_Z 后，电流大幅变化而电压几乎不变——利用这一点把波动输入「削平」。</p>
<p>串联电阻 R 负责吃掉多余电压：U_in 变化 → R 上的压降变化 → <span class="hl">U_out = U_Z 保持 5.1 V</span>（只要输入足够高、电流在允许范围）。</p>
<p>拖输入电压滑杆，看输出纹丝不动。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '输入电源（波动）', E: S16.U, r: 0.2, a: 1, b: 0 });
      addEl('rs', { t: 'res', x: -0.9, z: 0.4, label: '限流 R = 100Ω', R: 100, a: 1, b: 2 });
      addEl('zen', { t: 'dio', x: 0.1, z: 0.4, label: '稳压管 5.1V（反向）', kind: 'zen', VZ: 5.1, rs: 6, a: 3, b: 2, R: 1e9 });
      CIR.els.get('zen').kind = 'zen';
      CIR.els.get('zen').a = 3; CIR.els.get('zen').b = 2;
      addEl('rl', { t: 'res', x: 1.1, z: 0.4, label: '负载 R = 400Ω', R: 400, a: 2, b: 0 });
      addEl('vol', { t: 'gauge', sub: 'V', x: 1.1, z: -0.5, label: '输出电压', R: 1e7, a: 2, b: 0, ry: Math.PI });
      addEl('amz', { t: 'gauge', sub: 'mA', x: -0.3, z: -0.5, label: '稳压管电流', R: 1, a: 0, b: 3, ry: Math.PI });
      CIR.N = 4;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.75], [1.5, y0, -0.75], [1.5, y0, -0.55], [1.3, TABLE_Y + 0.2, -0.55]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.15, TABLE_Y + 0.16, 0.4]], 'bat1');
      W_([[-0.65, TABLE_Y + 0.16, 0.4], [0.4, y0, 0.4], [0.4, y0, 0.16], [0.55, TABLE_Y + 0.16, 0.16]], 'rs');
      W_([[-0.25, TABLE_Y + 0.1, -0.45], [-0.25, y0, -0.5], [0.1, y0, -0.5], [0.4, y0, 0.16]], 'amz');
      W_([[0.95, TABLE_Y + 0.16, 0.16], [1.7, y0, 0.16], [1.7, y0, 0.4], [1.4, y0, 0.4]], 'zen');
      W_([[1.5, y0, -0.55], [1.9, y0, -0.55], [1.9, y0, 0.4], [1.7, y0, 0.4]], 'vol');
      W_([[1.35, y0, 0.4], [1.75, y0, 0.4], [1.9, y0, 0.4]], 'rl');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 48, y2: 114 },
        { kind: 'bat', sx: 58, sy: 114, dir: 'v', sub: 'Uin' },
        { kind: 'wire', x1: 58, y1: 90, x2: 58, y2: 30 },
        { kind: 'res', sx: 80, sy: 30, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 92, y1: 30, x2: 130, y2: 30 },
        { kind: 'node', sx: 130, sy: 30 },
        { kind: 'wire', x1: 130, y1: 30, x2: 150, y2: 30 },
        { kind: 'wire', x1: 150, y1: 30, x2: 150, y2: 48 },
        { kind: 'dio', sx: 150, sy: 64, dir: 'v', sub: 'DZ' },
        { kind: 'wire', x1: 150, y1: 80, x2: 150, y2: 114 },
        { kind: 'res', sx: 190, sy: 70, dir: 'v', sub: 'RL' },
        { kind: 'wire', x1: 190, y1: 58, x2: 190, y2: 30 },
        { kind: 'wire', x1: 190, y1: 82, x2: 190, y2: 114 },
        { kind: 'wire', x1: 190, y1: 114, x2: 30, y2: 114 },
        { kind: 'vol', sx: 170, sy: 50, dir: 'h', sub: 'V' },
        { kind: 'wire', x1: 158, y1: 50, x2: 150, y2: 50 },
        { kind: 'wire', x1: 182, y1: 50, x2: 190, y2: 50 },
      ]);
    });
    app.setCamera([-0.3, 3.3, 4.9], [0.1, 1.3, 0]);
    ctl.clear();
    ctl.slider({ label: '输入电压 U_in', min: 3, max: 12, step: 0.5, value: S16.U, fmt: (v) => v.toFixed(1) + ' V', onInput: (v) => { S16.U = v; CIR.els.get('bat1').E = v; solveNow(); updZener(); } });
    setHUD([['uin', '输入电压'], ['uout', '输出电压'], ['iz', '稳压管电流'], ['note', '击穿区稳压']]);
    solveNow();
    updZener();
  },
});
function updZener() {
  const zen = CIR.els.get('zen');
  const vol = CIR.els.get('vol');
  const u = Math.abs(vol.V);
  setNeedle('vol', u / 8);
  setNeedle('amz', Math.abs(zen.I) / 0.05);
  hset('uin', S16.U.toFixed(1) + ' V');
  hset('uout', u.toFixed(2) + ' V' + (Math.abs(u - 5.1) < 0.3 ? ' ✓ 稳定' : '（欠压未击穿）'));
  hset('iz', (Math.abs(zen.I) * 1000).toFixed(1) + ' mA');
  hset('note', S16.U > 6 ? 'U_in 变化，U_out ≈ 5.1 V 不变' : '输入太低，稳压管未进入击穿区');
}

/* ---------- 17 焦耳定律 ---------- */
const S17 = { R3: 4, t: 0, heating: false, T1: 25, T2: 25 };
chap({
  id: 'joule', title: '探究焦耳定律',
  html: `<p>电流通过导体发热：<span class="hl">Q = I²Rt</span>（焦耳定律）。两只烧瓶装<b>等质量的煤油</b>（比热容小，升温更明显——这正是实验用煤油而不用水的原因）。串联电路中电流处处相等——比较两根电阻丝，<b>R 大的发热快</b>；这是「电流相同比电阻」的对照实验。</p>
<p>并联比较则相反：电压相同时，R 小的发热快（P = U²/R）。</p>
<p>点「开始加热」跑 8 秒，比较两只温度计（ΔT₂ : ΔT₁ ≈ R₂ : R₁ = 2 : 1）。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.1, z: 0.4, label: '电源 3V', E: 3, r: 0.3, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.2, z: 0.4, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('rh', { t: 'rheo', x: -0.4, z: 0.4, label: '电流调节', R: S17.R3, a: 2, b: 3 });
      addEl('h1', { t: 'thermo', x: 0.6, z: 0.4, label: '电阻丝 R₁ = 5Ω', R: 5, a: 3, b: 4 });
      addEl('h2', { t: 'thermo', x: 1.7, z: 0.4, label: '电阻丝 R₂ = 10Ω', R: 10, a: 4, b: 5 });
      CIR.N = 6;
      addEl('am', { t: 'gauge', sub: 'A', x: 2.5, z: -0.5, label: '电流表', R: 1e-3, a: 5, b: 0, ry: Math.PI });
      const y0 = TABLE_Y + 0.06;
      W_([[-2.32, TABLE_Y + 0.34, 0.4], [-2.6, y0, 0.4], [-2.6, y0, -0.7], [2.5, y0, -0.7], [2.5, TABLE_Y + 0.2, -0.56]], 'bat1');
      W_([[-1.88, TABLE_Y + 0.34, 0.4], [-1.5, y0, 0.4], [-1.38, y0, 0.4]], 'bat1');
      W_([[-1.02, y0, 0.4], [-0.75, y0, 0.4], [-0.62, y0, 0.4]], 'sw');
      W_([[-0.18, y0, 0.4], [0.15, y0, 0.4], [0.35, TABLE_Y + 0.1, 0.35]], 'rh');
      W_([[0.85, TABLE_Y + 0.1, 0.35], [1.3, y0, 0.4], [1.45, TABLE_Y + 0.1, 0.35]], 'h1');
      W_([[1.95, TABLE_Y + 0.1, 0.35], [2.3, y0, 0.4], [2.5, y0, 0.4]], 'h2');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 46, y2: 114 },
        { kind: 'bat', sx: 56, sy: 114, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 56, y1: 90, x2: 56, y2: 36 },
        { kind: 'sw', sx: 56, sy: 28, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 64, y1: 28, x2: 90, y2: 28 },
        { kind: 'rheo', sx: 104, sy: 28, dir: 'h', sub: 'R₃' },
        { kind: 'wire', x1: 116, y1: 28, x2: 138, y2: 28 },
        { kind: 'res', sx: 152, sy: 28, dir: 'h', sub: 'R1' },
        { kind: 'wire', x1: 164, y1: 28, x2: 184, y2: 28 },
        { kind: 'res', sx: 198, sy: 28, dir: 'h', sub: 'R2' },
        { kind: 'wire', x1: 210, y1: 28, x2: 224, y2: 28 },
        { kind: 'wire', x1: 224, y1: 28, x2: 224, y2: 114 },
        { kind: 'am', sx: 132, sy: 114, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 122, y1: 114, x2: 30, y2: 114 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.8], [0.3, 1.3, 0]);
    ctl.clear();
    ctl.slider({ label: '电流调节 R₃', min: 1, max: 12, step: 0.5, value: S17.R3, fmt: (v) => v.toFixed(1) + ' Ω', onInput: (v) => { S17.R3 = v; CIR.els.get('rh').R = v; setSliderVisual('rh', (v - 1) / 11); solveNow(); updJoule(); } });
    ctl.sep();
    ctl.button({ label: '🔥 开始加热 8 秒', onClick() { S17.heating = true; S17.t = 0; setSwitchLogic('sw', true); setSwitchVisual('sw', true); } });
    ctl.button({ label: '↺ 复位温度', onClick() { S17.T1 = 25; S17.T2 = 25; S17.heating = false; updJoule(); } });
    setHUD([['i', '电流（串联相同）'], ['p1', 'R₁ 功率 I²R₁'], ['p2', 'R₂ 功率 I²R₂'], ['dt', '升温 ΔT₁ / ΔT₂']]);
    solveNow();
    updJoule();
  },
});
function updJoule() {
  const am = CIR.els.get('am');
  const i = Math.abs(am.I);
  setNeedle('am', i / 1.2);
  hset('i', i.toFixed(3) + ' A');
  hset('p1', (i * i * 5).toFixed(2) + ' W');
  hset('p2', (i * i * 10).toFixed(2) + ' W');
  hset('dt', (S17.T1 - 25).toFixed(1) + '°C / ' + (S17.T2 - 25).toFixed(1) + '°C');
  const r1 = ELVIS.get('h1'), r2 = ELVIS.get('h2');
  if (r1 && r1.parts.col) r1.parts.col.scale.y = clamp(0.5 + (S17.T1 - 25) / 14, 0.3, 1.6);
  if (r2 && r2.parts.col) r2.parts.col.scale.y = clamp(0.5 + (S17.T2 - 25) / 14, 0.3, 1.6);
}
function jouleTick(dt) {
  if (!S17.heating) return;
  solveNow();
  const i = Math.abs(CIR.els.get('am').I);
  S17.t += dt;
  const c1 = 14, c2 = 14;
  S17.T1 += i * i * 5 / c1 * dt;
  S17.T2 += i * i * 10 / c2 * dt;
  updJoule();
  if (S17.t > 8) { S17.heating = false; setSwitchLogic('sw', false); setSwitchVisual('sw', false); }
}

/* ---------- 18 电阻定律 ---------- */
const S18 = { mat: 0, L: 1.0, S: 0.5 };
const MATS18 = [
  { n: '铜', rho: 0.017 }, { n: '铁', rho: 0.096 }, { n: '镍铬合金', rho: 1.1 },
];
chap({
  id: 'reslaw', title: '探究影响导体电阻大小的因素',
  html: `<p>导体电阻由材料本身决定：<span class="hl">R = ρL / S</span>——电阻率 ρ 越大、越长 L、越细 S，电阻越大。</p>
<p>ρ 是材料的「电阻身份证」：铜 0.017、铁 0.096、镍铬合金 1.1（单位 Ω·mm²/m，20°C）。同形状下镍铬丝电阻是铜丝的 ~65 倍，所以电炉丝用镍铬。</p>
<p>实验方法：<b>控制变量法</b>——每次只改一个因素（先定材料看长度，再定长度看粗细，最后定长短粗细比材料）。</p>
<p>换材料、拉长、变细，看电流表和公式一起动。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源 3V', E: 3, r: 0.3, a: 1, b: 0 });
      addEl('am', { t: 'gauge', sub: 'A', x: -1.0, z: 0.4, label: '电流表', R: 1e-3, a: 1, b: 2 });
      addEl('rx', { t: 'res', x: 0.3, z: 0.4, label: '测试导线', R: 1, a: 2, b: 3 });
      // 回路经 lb(3→4) → am2(4→0)
      addEl('lb', { t: 'bulb', x: 1.5, z: 0.4, label: '指示灯', R: 12, a: 3, b: 4 });
      addEl('am2', { t: 'res', x: 0, z: 0, label: '', R: 1e-3, a: 4, b: 0 });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.7], [2.3, y0, -0.7], [2.3, y0, 0.4], [1.72, TABLE_Y + 0.4, 0.4]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.45, y0, 0.4], [-1.15, TABLE_Y + 0.16, 0.4]], 'bat1');
      W_([[-0.85, TABLE_Y + 0.16, 0.4], [-0.45, y0, 0.4], [-0.05, TABLE_Y + 0.16, 0.4]], 'am');
      W_([[0.55, TABLE_Y + 0.16, 0.4], [1.0, y0, 0.4], [1.28, TABLE_Y + 0.4, 0.4]], 'rx');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 46, y2: 114 },
        { kind: 'bat', sx: 56, sy: 114, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 56, y1: 90, x2: 56, y2: 40 },
        { kind: 'wire', x1: 56, y1: 40, x2: 56, y2: 36 },
        { kind: 'am', sx: 70, sy: 30, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 82, y1: 30, x2: 130, y2: 30 },
        { kind: 'res', sx: 146, sy: 30, dir: 'h', sub: 'Rx' },
        { kind: 'wire', x1: 158, y1: 30, x2: 196, y2: 30 },
        { kind: 'bulb', sx: 212, sy: 30, dir: 'h', sub: '灯' },
        { kind: 'wire', x1: 224, y1: 30, x2: 236, y2: 30 },
        { kind: 'wire', x1: 236, y1: 30, x2: 236, y2: 114 },
        { kind: 'wire', x1: 236, y1: 114, x2: 30, y2: 114 },
      ]);
    });
    app.setCamera([-0.3, 3.3, 4.8], [0.2, 1.3, 0]);
    ctl.clear();
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === S18.mat));
    MATS18.forEach((mm, k) => {
      const b = ctl.button({ label: mm.n, onClick() { S18.mat = k; updResLaw(); paint(); } });
      btns.push({ b, v: k });
    });
    paint();
    ctl.sep();
    ctl.slider({ label: '长度 L', min: 0.2, max: 2, step: 0.1, value: S18.L, fmt: (v) => v.toFixed(1) + ' m', onInput: (v) => { S18.L = v; updResLaw(); } });
    ctl.slider({ label: '横截面积 S', min: 0.3, max: 2, step: 0.1, value: S18.S, fmt: (v) => v.toFixed(1) + ' mm²', onInput: (v) => { S18.S = v; updResLaw(); } });
    setHUD([['law', 'R = ρL / S'], ['r', '电阻值'], ['i', '电流'], ['note', '同一电路对照']]);
    updResLaw();
  },
});
function updResLaw() {
  const mm = MATS18[S18.mat];
  const R = mm.rho * S18.L / S18.S;
  const rx = CIR.els.get('rx');
  rx.R = clamp(R, 0.05, 200);
  const rec = ELVIS.get('rx');
  if (rec) rec.grp.scale.x = clamp(0.6 + S18.L * 0.5, 0.6, 1.6);
  solveNow();
  const i = Math.abs(CIR.els.get('am').I);
  setNeedle('am', clamp(i / 0.4, 0, 1.1));
  bulbGlow('lb', Math.abs(CIR.els.get('lb').I) / 0.2);
  hset('law', `ρ(${mm.n}) = ${mm.rho}`);
  hset('r', R.toFixed(2) + ' Ω');
  hset('i', i.toFixed(3) + ' A');
  hset('note', '铜最导电 → 电线用铜');
}

/* ---------- 19 多用电表的使用 ---------- */
const S19 = { mode: 'dcv', point: 'r2' };
chap({
  id: 'mm', title: '多用电表的使用',
  html: `<p>多用电表 = 电压表 + 电流表 + 欧姆表。三条铁律：</p>
<p>① 测<b>电压</b>：并联在被测元件两端（表笔搭两端点）；② 测<b>电流</b>：串联进电路（断开一点串入）；③ 测<b>电阻</b>：<b>必须断电</b>测量（表内自带电池）。</p>
<p>选档位 + 选测点，看读数。欧姆档用前要「调零」——两表笔短接调 0 Ω。冷知识：欧姆挡内部电池的正极恰好接<b>红表笔</b>，测电阻时电流是从红表笔流出的。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -1.8, z: 0.4, label: '电源 3V', E: 3, r: 0.3, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -0.9, z: 0.4, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('r1', { t: 'res', x: -0.1, z: 0.4, label: 'R₁ = 10Ω', R: 10, a: 2, b: 3 });
      addEl('r2', { t: 'res', x: 0.9, z: 0.4, label: 'R₂ = 20Ω', R: 20, a: 3, b: 0 });
      addEl('mmr', { t: 'mm', x: 1.9, z: -0.45, label: '多用电表' });
      const y0 = TABLE_Y + 0.06;
      W_([[-2.02, TABLE_Y + 0.34, 0.4], [-2.4, y0, 0.4], [-2.4, y0, -0.75], [2.6, y0, -0.75], [2.6, TABLE_Y + 0.2, -0.5]], 'bat1');
      W_([[-1.58, TABLE_Y + 0.34, 0.4], [-1.25, y0, 0.4], [-1.08, y0, 0.4]], 'bat1');
      W_([[-0.72, y0, 0.4], [-0.4, y0, 0.4], [-0.25, TABLE_Y + 0.16, 0.4]], 'sw');
      W_([[0.05, TABLE_Y + 0.16, 0.4], [0.35, y0, 0.4], [0.65, TABLE_Y + 0.16, 0.4]], 'r1');
      W_([[1.15, TABLE_Y + 0.16, 0.4], [1.6, y0, 0.4], [2.4, y0, 0.4]], 'r2');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 46, y2: 114 },
        { kind: 'bat', sx: 56, sy: 114, dir: 'v', sub: '3V' },
        { kind: 'wire', x1: 56, y1: 90, x2: 56, y2: 40 },
        { kind: 'sw', sx: 56, sy: 30, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 64, y1: 30, x2: 96, y2: 30 },
        { kind: 'res', sx: 110, sy: 30, dir: 'h', sub: 'R1' },
        { kind: 'wire', x1: 122, y1: 30, x2: 150, y2: 30 },
        { kind: 'node', sx: 150, sy: 30 },
        { kind: 'res', sx: 164, sy: 30, dir: 'h', sub: 'R2' },
        { kind: 'wire', x1: 176, y1: 30, x2: 212, y2: 30 },
        { kind: 'wire', x1: 212, y1: 30, x2: 212, y2: 114 },
        { kind: 'wire', x1: 212, y1: 114, x2: 30, y2: 114 },
        { kind: 'node', sx: 150, sy: 30 },
        { kind: 'node', sx: 150, sy: 114 },
      ]);
    });
    app.setCamera([-0.2, 3.3, 4.9], [0.3, 1.3, 0]);
    ctl.clear();
    const btns = [];
    const paint = () => btns.forEach(({ b, v }) => b.classList.toggle('active', v === S19.mode));
    [['off', 'OFF'], ['dcv', '直流电压 5V'], ['dca', '直流电流 250mA'], ['ohm', '电阻 ×1']].forEach(([v, t]) => {
      const b = ctl.button({ label: t, onClick() { S19.mode = v; updMM(); paint(); } });
      btns.push({ b, v });
    });
    paint();
    ctl.sep();
    const pts = [];
    const paint2 = () => pts.forEach(({ b, v }) => b.classList.toggle('active', v === S19.point));
    [['r2', '表笔接 R₂ 两端'], ['main', '表笔串入干路']].forEach(([v, t]) => {
      const b = ctl.button({ label: t, onClick() { S19.point = v; updMM(); paint2(); } });
      pts.push({ b, v });
    });
    paint2();
    setHUD([['mode', '当前档位'], ['probe', '表笔位置'], ['val', '读数'], ['tip', '用法要点']]);
    updMM();
  },
});
function updMM() {
  solveNow();
  const rec = ELVIS.get('mmr');
  let val = '–', tip = '';
  const uR2 = 3 * 20 / 30;
  if (S19.mode === 'off') { val = '表笔拔出/关闭'; tip = '用完关机省电'; }
  else if (S19.mode === 'dcv') {
    val = S19.point === 'r2' ? uR2.toFixed(2) + ' V' : '串在干路测压：示数≈3V';
    tip = '电压档并联接入';
  } else if (S19.mode === 'dca') {
    val = S19.point === 'main' ? (3 / 30 * 1000).toFixed(0) + ' mA' : '并联测电流 → 危险短路！';
    tip = '电流档必须串联，严禁并联';
  } else {
    val = S19.point === 'r2' ? (20).toFixed(1) + ' Ω' : '干路电阻 = R1+R2+内阻';
    tip = '电阻档必须断开电源';
  }
  if (rec && rec.parts.needle) {
    let f = 0.05;
    if (S19.mode === 'dcv') f = 0.1 + (S19.point === 'r2' ? uR2 / 5 * 0.85 : 0.85);
    else if (S19.mode === 'dca') f = S19.point === 'main' ? 0.45 : 0.95;
    else if (S19.mode === 'ohm') f = S19.point === 'r2' ? 0.55 : 0.35;
    rec.parts.needle.rotation.z = Math.PI * 0.78 - f * Math.PI * 0.56;
  }
  hset('mode', { off: 'OFF', dcv: '直流电压 5V', dca: '直流电流 250mA', ohm: '电阻 ×1' }[S19.mode]);
  hset('probe', S19.point === 'r2' ? 'R₂ 两端（并联）' : '干路（串联）');
  hset('val', val);
  hset('tip', tip);
}

/* ---------- 20 电磁铁 ---------- */
const S20 = { E: 3, N: 150, core: true };
chap({
  id: 'mag', title: '影响电磁铁磁性强弱的因素',
  html: `<p>通电螺线管产生磁场，插入铁芯后磁场被大大增强——<b>电磁铁</b>。磁性强弱由<b>三个因素</b>决定：<span class="hl">电流 I 越大、匝数 N 越多、有铁芯，磁性越强</span>（吸引大头针数 ∝ N·I）。</p>
<p>电磁铁的磁性「随电开关」：起重机吸废钢、电磁继电器、磁悬浮列车都用它。</p>
<p>调电流、加匝数，数一数吸起几根大头针；抽掉铁芯再试；再试试断电。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.002;
      addEl('bat1', { t: 'bat', x: -2.0, z: 0.4, label: '电源', E: S20.E, r: 0.4, a: 1, b: 0 });
      addEl('sw', { t: 'sw', x: -1.1, z: 0.4, label: '开关', R: 1e-4, a: 1, b: 2 });
      addEl('rh', { t: 'rheo', x: -0.2, z: 0.4, label: '电流调节', R: 2, a: 2, b: 3 });
      addEl('mag', { t: 'mag', x: 0.9, z: 0.4, label: '电磁铁', R: 6, a: 3, b: 4 });
      addEl('am', { t: 'gauge', sub: 'A', x: 1.9, z: -0.5, label: '电流表', R: 1e-3, a: 4, b: 0, ry: Math.PI });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-2.22, TABLE_Y + 0.34, 0.4], [-2.5, y0, 0.4], [-2.5, y0, -0.7], [1.9, y0, -0.7], [1.9, TABLE_Y + 0.2, -0.56]], 'bat1');
      W_([[-1.78, TABLE_Y + 0.34, 0.4], [-1.4, y0, 0.4], [-1.28, y0, 0.4]], 'bat1');
      W_([[-0.92, y0, 0.4], [-0.55, y0, 0.4], [-0.38, y0, 0.4]], 'sw');
      W_([[0.0, y0, 0.4], [0.3, y0, 0.4], [0.55, TABLE_Y + 0.2, 0.4]], 'rh');
      W_([[1.25, TABLE_Y + 0.2, 0.4], [1.6, y0, 0.4], [1.9, y0, 0.5]], 'mag');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 114, x2: 46, y2: 114 },
        { kind: 'bat', sx: 56, sy: 114, dir: 'v', sub: 'U' },
        { kind: 'wire', x1: 56, y1: 90, x2: 56, y2: 40 },
        { kind: 'sw', sx: 56, sy: 30, dir: 'h', closed: true, sub: 'S' },
        { kind: 'wire', x1: 64, y1: 30, x2: 90, y2: 30 },
        { kind: 'rheo', sx: 104, sy: 30, dir: 'h', sub: 'R' },
        { kind: 'wire', x1: 116, y1: 30, x2: 140, y2: 30 },
        { kind: 'ind', sx: 154, sy: 30, dir: 'h', sub: 'N匝' },
        { kind: 'wire', x1: 166, y1: 30, x2: 210, y2: 30 },
        { kind: 'wire', x1: 210, y1: 30, x2: 210, y2: 114 },
        { kind: 'am', sx: 128, sy: 114, dir: 'h', sub: 'A' },
        { kind: 'wire', x1: 118, y1: 114, x2: 30, y2: 114 },
      ]);
    });
    app.setCamera([-0.3, 3.3, 4.8], [0.4, 1.3, 0]);
    ctl.clear();
    ctl.slider({ label: '电源电压', min: 0, max: 4, step: 0.25, value: S20.E, fmt: (v) => v.toFixed(2) + ' V', onInput: (v) => { S20.E = v; CIR.els.get('bat1').E = v; solveNow(); updMag(); } });
    ctl.slider({ label: '线圈匝数 N', min: 50, max: 300, step: 10, value: S20.N, fmt: (v) => v + ' 匝', onInput: (v) => { S20.N = v; updMag(); } });
    ctl.sep();
    ctl.toggle({ label: '插入铁芯', value: S20.core, onChange: (v) => { S20.core = v; updMag(); } });
    ctl.toggle({ label: '开关', value: true, onChange: (v) => { setSwitchLogic('sw', v); setSwitchVisual('sw', v); solveNow(); updMag(); } });
    setHUD([['i', '电流'], ['ni', '安匝 N·I'], ['nail', '吸起大头针'], ['note', 'I↑ 或 N↑ → 磁性↑']]);
    updMag();
  },
});
function updMag() {
  solveNow();
  const am = CIR.els.get('am');
  const i = Math.abs(am.I);
  setNeedle('am', i / 1.2);
  const ni = i * S20.N;
  const cnt = clamp(Math.floor(ni / 45 * (S20.core ? 1 : 0.15)), 0, 6);
  const rec = ELVIS.get('mag');
  if (rec && rec.parts.core) rec.parts.core.visible = S20.core;
  if (rec && rec.parts.nails) {
    rec.parts.nails.forEach((nail, k) => {
      if (k < cnt) {
        nail.position.set(-0.045 + k * 0.018, 0.02, 0.012 + (k % 2) * 0.02);
        nail.visible = true;
      } else {
        nail.position.set(0.28 + k * 0.05, 0.04, (k % 3) * 0.06 - 0.06);
        nail.rotation.z = Math.PI / 2 + (k % 2) * 0.2;
      }
    });
  }
  hset('i', i.toFixed(2) + ' A');
  hset('ni', ni.toFixed(0) + ' 安·匝');
  hset('nail', cnt + ' 根');
  hset('note', i < 0.05 ? '断电 → 磁性消失' : '吸钉数 ∝ N·I');
}

/* ---------- 21 太阳能电池驱动电动机 ---------- */
const S21 = { light: 0.8, tilt: 0, sw: true, omega: 0 };
chap({
  id: 'solar', title: '太阳能电池驱动电动机',
  html: `<p>太阳能电池板把<b>光能 → 电能</b>（光伏效应），电动机再把<b>电能 → 机械能</b>。太阳能电池近似「<b>恒流源</b>」：<span class="hl">短路电流与光照强度成正比</span>；光照越弱，能输出的电流越小，电动机变慢甚至停转。</p>
<p>面板正对阳光（倾角合适）时接收功率最大——这就是太阳能电站追着太阳转的原因。</p>
<p>拖「光照」和「倾角」看转速变化；断开开关，电压表读数就是<b>开路电压</b>；晚上（光照=0）就全停了。</p>`,
  enter() {
    enterBench(() => {
      CIR.dt = 0.001;
      addEl('pv', { t: 'solar', x: -1.6, z: 0.4, label: '太阳能板', E: 2.5, r: 10, a: 1, b: 0 });
      CIR.els.get('pv').kind = 'bat';
      addEl('motR', { t: 'motor', x: -0.3, z: 0.4, label: '电动机', R: 4, a: 1, b: 2 });
      addEl('emf', { t: 'res', x: -0.3, z: 0.4, label: '反电动势', kind: 'emf', E: 0, r: 0.02, a: 2, b: 3 });
      CIR.els.get('emf').kind = 'emf';
      addEl('sw', { t: 'sw', x: 0.8, z: 0.4, label: '开关 S', R: S21.sw ? 1e-4 : 1e9, a: 3, b: 4 });
      addEl('am', { t: 'gauge', sub: 'mA', x: 1.5, z: -0.5, label: '电流表', R: 1, a: 4, b: 0, ry: Math.PI });
      CIR.N = 5;
      const y0 = TABLE_Y + 0.06;
      W_([[-1.82, TABLE_Y + 0.3, 0.4], [-2.3, y0, 0.4], [-2.3, y0, -0.7], [1.5, y0, -0.7], [1.5, TABLE_Y + 0.2, -0.56]], 'pv');
      W_([[-1.38, TABLE_Y + 0.3, 0.4], [-1.0, y0, 0.4], [-0.55, y0, 0.4]], 'pv');
      W_([[-0.05, y0, 0.4], [0.4, y0, 0.4], [0.6, TABLE_Y + 0.14, 0.4]], 'motR');
      W_([[1.0, TABLE_Y + 0.14, 0.4], [1.3, y0, 0.4], [1.3, y0, -0.55], [1.5, y0, -0.55]], 'sw');
      drawSchem([
        { kind: 'wire', x1: 30, y1: 30, x2: 44, y2: 30 },
        { kind: 'bat', sx: 54, sy: 30, dir: 'h', sub: 'PV' },
        { kind: 'wire', x1: 66, y1: 30, x2: 90, y2: 30 },
        { kind: 'res', sx: 104, sy: 30, dir: 'h', sub: '电机' },
        { kind: 'wire', x1: 116, y1: 30, x2: 140, y2: 30 },
        { kind: 'bat', sx: 154, sy: 30, dir: 'h', sub: 'E反' },
        { kind: 'wire', x1: 166, y1: 30, x2: 190, y2: 30 },
        { kind: 'sw', sx: 204, sy: 30, dir: 'h', closed: S21.sw, sub: 'S' },
        { kind: 'wire', x1: 216, y1: 30, x2: 232, y2: 30 },
        { kind: 'wire', x1: 232, y1: 30, x2: 232, y2: 114 },
        { kind: 'am', sx: 140, sy: 114, dir: 'h', sub: 'mA' },
        { kind: 'wire', x1: 130, y1: 114, x2: 30, y2: 114 },
        { kind: 'wire', x1: 30, y1: 114, x2: 30, y2: 30 },
      ]);
    });
    app.setCamera([-0.4, 3.3, 4.8], [-0.1, 1.3, 0]);
    ctl.clear();
    ctl.slider({ label: '光照强度', min: 0, max: 100, step: 5, value: S21.light * 100, fmt: (v) => v + ' %', onInput: (v) => { S21.light = v / 100; updSolar(); } });
    ctl.slider({ label: '面板倾角（0=正对阳光）', min: -60, max: 60, step: 5, value: S21.tilt, fmt: (v) => v + '°', onInput: (v) => { S21.tilt = v; updSolar(); } });
    ctl.sep();
    ctl.toggle({ label: '开关 S', value: S21.sw, onChange: (v) => { S21.sw = v; setSwitchLogic('sw', v); setSwitchVisual('sw', v); solveNow(); updSolar(); } });
    setHUD([['u', '板端电压'], ['i', '电流'], ['w', '电机转速'], ['note', '光能→电能→机械能']]);
    updSolar();
  },
});
function updSolar() {
  const eff = Math.cos(S21.tilt * Math.PI / 180) * 0.92 + 0.08;
  const E = 3.2 * S21.light * eff;
  CIR.els.get('pv').E = E;
  const rec = ELVIS.get('pv');
  if (rec && rec.parts.panel) rec.parts.panel.rotation.x = -0.35 - S21.tilt * Math.PI / 180;
  solveNow();
  const i = Math.abs(CIR.els.get('emf').I);
  hset('u', CIR.els.get('pv').V.toFixed(2) + ' V' + (S21.sw ? '' : '（开路）'));
  hset('i', (i * 1000).toFixed(0) + ' mA');
  hset('w', S21.omega.toFixed(1) + ' rad/s');
  hset('note', S21.light === 0 ? '夜晚：光伏无输出' : !S21.sw ? '开关断开：电压表读数 = 开路电压' : (Math.abs(S21.tilt) > 30 ? '倾角大：受光面积减小' : '光照↑ → 短路电流成正比↑'));
}
function solarTick(dt) {
  const i = Math.abs(CIR.els.get('emf').I);
  S21.omega += (0.3 * i - 0.002 * S21.omega) / 0.008 * dt * 0.15;
  S21.omega = clamp(S21.omega, 0, 40);
  CIR.els.get('emf').E = 0.3 * S21.omega;
  const rec = ELVIS.get('motR');
  if (rec && rec.parts.rotor) rec.parts.rotor.rotation.z -= S21.omega * dt * 1.5;
  solveNow();
  updSolar();
}

/* ---------- 22 空白实验台 ---------- */
const S22 = { E: 3, R: 6, sw: true, bulb: true, motor: false };
chap({
  id: 'free', title: '空白实验台',
  html: `<p>实验台交给你：电源、开关、滑动变阻器、小灯泡、电动机、电流表、电压表已就位。开关灯泡/电动机的接入，调电源电压与变阻器，自由搭建你的电路。</p>
<p>试一试：把电动机和灯泡接入，调低电压——谁先「罢工」？灯泡和电动机是什么连接关系？（并联）</p>
<p>这就是电学实验的全部自由度，祝你玩得开心。</p>`,
  enter() {
    freeRebuild();
    app.setCamera([-0.2, 3.4, 4.9], [0.1, 1.3, 0]);
    ctl.clear();
    ctl.slider({ label: '电源电压', min: 0, max: 6, step: 0.25, value: S22.E, fmt: (v) => v.toFixed(2) + ' V', onInput: (v) => { S22.E = v; CIR.els.get('bat1').E = v; solveNow(); updFree(); } });
    ctl.slider({ label: '滑动变阻器', min: 0, max: 20, step: 0.5, value: S22.R, fmt: (v) => v.toFixed(1) + ' Ω', onInput: (v) => { S22.R = v; CIR.els.get('rh').R = v; setSliderVisual('rh', v / 20); solveNow(); updFree(); } });
    ctl.sep();
    ctl.toggle({ label: '开关 S', value: S22.sw, onChange: (v) => { S22.sw = v; setSwitchLogic('sw', v); setSwitchVisual('sw', v); solveNow(); updFree(); } });
    ctl.toggle({ label: '灯泡支路', value: S22.bulb, onChange: (v) => { S22.bulb = v; freeRebuild(); } });
    ctl.toggle({ label: '电动机支路', value: S22.motor, onChange: (v) => { S22.motor = v; freeRebuild(); } });
    setHUD([['i', '干路电流'], ['u', '并联部分电压'], ['st', '支路状态'], ['note', '自由探索']]);
    updFree();
  },
});
function freeRebuild() {
  enterBench(() => {
    CIR.dt = 0.002;
    CIR.N = 6;
    addEl('bat1', { t: 'bat', x: -2.2, z: 0.4, label: '电源', E: S22.E, r: 0.3, a: 1, b: 0 });
    addEl('am', { t: 'gauge', sub: 'A', x: -1.35, z: 0.4, label: '电流表', R: 1e-3, a: 1, b: 2 });
    addEl('sw', { t: 'sw', x: -0.6, z: 0.4, label: '开关 S', R: S22.sw ? 1e-4 : 1e9, a: 2, b: 3 });
    addEl('rh', { t: 'rheo', x: 0.3, z: 0.4, label: '滑动变阻器', R: S22.R, a: 3, b: 4 });
    addEl('lb', { t: 'bulb', x: 1.25, z: 0.72, label: '灯泡', R: 12, a: 4, b: 0 });
    addEl('motR', { t: 'motor', x: 1.25, z: 0.08, label: '电动机', R: 4, a: 4, b: 5 });
    addEl('emf', { t: 'res', x: 2.05, z: 0.08, label: '', kind: 'emf', E: 0, r: 0.02, a: 5, b: 0 });
    CIR.els.get('emf').kind = 'emf';
    addEl('vol', { t: 'gauge', sub: 'V', x: 1.9, z: -0.55, label: '电压表', R: 1e7, a: 4, b: 0, ry: Math.PI });
    const y0 = TABLE_Y + 0.06;
    W_([[-2.42, TABLE_Y + 0.34, 0.4], [-2.7, y0, 0.4], [-2.7, y0, -0.8], [2.6, y0, -0.8], [2.6, y0, 0.1], [2.27, y0, 0.08]], 'bat1');
    W_([[-1.98, TABLE_Y + 0.34, 0.4], [-1.7, y0, 0.4], [-1.5, TABLE_Y + 0.16, 0.4]], 'bat1');
    W_([[-1.2, TABLE_Y + 0.16, 0.4], [-0.95, y0, 0.4], [-0.78, y0, 0.4]], 'am');
    W_([[-0.42, y0, 0.4], [-0.1, y0, 0.4], [0.0, y0, 0.4]], 'sw');
    W_([[0.6, y0, 0.4], [0.9, y0, 0.4], [1.0, y0, 0.4]], 'rh');
    W_([[1.03, y0, 0.62], [0.95, y0, 0.72], [1.0, TABLE_Y + 0.4, 0.72]], 'rh');
    W_([[1.0, y0, 0.18], [0.95, y0, 0.08], [1.0, TABLE_Y + 0.2, 0.08]], 'rh');
    W_([[1.5, TABLE_Y + 0.4, 0.72], [2.2, y0, 0.72], [2.7, y0, 0.72]], 'lb');
    W_([[1.5, TABLE_Y + 0.2, 0.08], [1.9, y0, 0.08], [2.27, y0, 0.08]], 'motR');
    W_([[1.66, TABLE_Y + 0.1, -0.5], [1.7, y0, -0.55], [2.2, y0, -0.55], [2.6, y0, -0.5]], 'vol');
    drawSchem([
      { kind: 'wire', x1: 30, y1: 116, x2: 46, y2: 116 },
      { kind: 'bat', sx: 56, sy: 116, dir: 'v', sub: 'U' },
      { kind: 'wire', x1: 56, y1: 92, x2: 56, y2: 36 },
      { kind: 'am', sx: 70, sy: 28, dir: 'h', sub: 'A' },
      { kind: 'wire', x1: 56, y1: 36, x2: 56, y2: 28 },
      { kind: 'wire', x1: 82, y1: 28, x2: 96, y2: 28 },
      { kind: 'sw', sx: 108, sy: 28, dir: 'h', closed: S22.sw, sub: 'S' },
      { kind: 'wire', x1: 120, y1: 28, x2: 136, y2: 28 },
      { kind: 'rheo', sx: 150, sy: 28, dir: 'h', sub: 'R' },
      { kind: 'wire', x1: 162, y1: 28, x2: 186, y2: 28 },
      { kind: 'node', sx: 186, sy: 28 },
      { kind: 'bulb', sx: 186, sy: 62, dir: 'v', sub: '灯' },
      { kind: 'wire', x1: 186, y1: 28, x2: 186, y2: 50 },
      { kind: 'wire', x1: 186, y1: 74, x2: 186, y2: 116 },
      { kind: 'wire', x1: 186, y1: 28, x2: 232, y2: 28 },
      { kind: 'res', sx: 246, sy: 28, dir: 'h', sub: '电机' },
      { kind: 'wire', x1: 258, y1: 28, x2: 274, y2: 28 },
      { kind: 'wire', x1: 274, y1: 28, x2: 274, y2: 116 },
      { kind: 'wire', x1: 274, y1: 116, x2: 30, y2: 116 },
      { kind: 'node', sx: 186, sy: 116 },
      { kind: 'vol', sx: 240, sy: 74, dir: 'h', sub: 'V' },
      { kind: 'wire', x1: 228, y1: 74, x2: 186, y2: 74 },
      { kind: 'wire', x1: 252, y1: 74, x2: 274, y2: 74 },
    ]);
  });
  setSwitchVisual('sw', S22.sw);
  solveNow();
  updFree();
}
function updFree() {
  solveNow();
  const am = CIR.els.get('am'), vol = CIR.els.get('vol');
  const i = Math.abs(am.I);
  const u = Math.abs(vol.V);
  setNeedle('am', clamp(i / 1.2, 0, 1.1));
  setNeedle('vol', clamp(u / 6, 0, 1.05));
  bulbGlow('lb', Math.abs(CIR.els.get('lb').I) / 0.2);
  hset('i', i.toFixed(3) + ' A');
  hset('u', u.toFixed(2) + ' V（并联部分）');
  hset('st', [
    S22.bulb ? '灯 ✓' : '灯 ✗',
    S22.motor ? '电机 ✓（' + (S22.freeW || 0).toFixed(0) + ' rpm）' : '电机 ✗',
  ].join(' · '));
  hset('note', '并联支路互不影响');
}

/* ================= 帧循环 ================= */

app.onFrame((dt) => {
  cameraTweenTick(app, dt);
  if (activeScene !== scenes.bench || !CIR) return;
  // 导线电流小珠
  wires.forEach((w) => {
    const el = CIR.els.get(w.elId);
    stepBeads(w.beads, el ? el.I || 0 : 0, dt);
  });
  // 各章动态
  if (CH === null) return;
  switch (CH.id) {
    case 'rc': {
      if (S5.mode !== 'off') {
        const n = Math.max(1, Math.round(dt * S5.speed / CIR.dt));
        for (let k = 0; k < n; k++) solveCircuit();
        S5.t += n * CIR.dt;
        if (S5.trace.length === 0 || S5.t - S5.trace[S5.trace.length - 1][0] > 0.004) {
          S5.trace.push([S5.t, CIR.els.get('cap').V]);
          if (S5.trace.length > 220) S5.trace.shift();
          drawRcScope();
        }
        updRc();
      }
      break;
    }
    case 'selfind': {
      if (!S6.closed || Math.abs(CIR.els.get('ind').iL) > 1e-4) {
        const n = Math.max(1, Math.round(dt * 0.35 / CIR.dt));
        for (let k = 0; k < n; k++) solveCircuit();
        updSelf();
      }
      break;
    }
    case 'lc': {
      if (S7.running) {
        const n = Math.max(1, Math.round(dt * 0.08 / CIR.dt));
        for (let k = 0; k < n; k++) solveCircuit();
        S7.trace.push([S7.trace.length * 0.005, CIR.els.get('cap').V, CIR.els.get('ind').iL]);
        if (S7.trace.length > 240) S7.trace.shift();
        const sc = makeScope('u_C 与 i_L 波形');
        scopeBase('t/s', 'u/V i/A');
        const ctx = sc.ctx;
        const toX = (t) => 24 + (t / 1.2) * 180;
        const toY = (v) => 112 - clamp(v / 3.3, -1, 1) * 48;
        ctx.strokeStyle = '#ff9b5e'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        S7.trace.forEach(([t, u], k) => { const x = toX(t), y = toY(u); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
        ctx.stroke();
        ctx.strokeStyle = '#6fb3e0';
        ctx.beginPath();
        ctx.beginPath();
        let doneFirst = false;
        S7.trace.forEach(([t, , il], k) => {
          const x = toX(t), y = toY(clamp(il * 2.5, -3.2, 3.2));
          if (!doneFirst) { ctx.moveTo(x, y); doneFirst = true; } else ctx.lineTo(x, y);
        });
        ctx.stroke();
        updLc();
      }
      break;
    }
    case 'bridge': {
      const n = Math.max(1, Math.round(dt * 0.018 / CIR.dt));
      for (let k = 0; k < n; k++) {
        CIR.els.get('ac').E = 6 * Math.sin(TAU * 50 * S8.tt);
        S8.tt += CIR.dt;
        solveCircuit();
      }
      const u2 = CIR.els.get('load').V;
      S8.trace.push([S8.tt % 0.04, u2, CIR.els.get('ac').E]);
      if (S8.trace.length > 200) S8.trace.shift();
      const sc = makeScope('输出波形（整流/滤波）');
      scopeBase('t/ms', 'u/V');
      const ctx = sc.ctx;
      const toX = (t) => 24 + (t / 0.04) * 180;
      const toY = (u) => 61 - clamp(u / 7.5, -1, 1) * 48;
      ctx.strokeStyle = '#6fb3e0'; ctx.lineWidth = 1;
      ctx.beginPath();
      let first = true;
      S8.trace.forEach(([t, , e]) => { const x = toX(t), y = toY(e); if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); });
      ctx.stroke();
      ctx.strokeStyle = '#ff9b5e'; ctx.lineWidth = 1.6;
      ctx.beginPath();
      first = true;
      S8.trace.forEach(([t, u]) => { const x = toX(t), y = toY(u); if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); });
      ctx.stroke();
      updBridge();
      break;
    }
    case 'motor': motorTick(dt); break;
    case 'solar': solarTick(dt); break;
    case 'short': shortTick(dt * 0.25); break;
    case 'joule': jouleTick(dt); break;
    case 'free': {
      if (S22.motor) {
        const i = Math.abs(CIR.els.get('emf').I);
        S22.freeW = (S22.freeW || 0) + ((0.15 * i / 0.004) * 0.4 - (S22.freeW || 0)) * dt * 1.2;
        S22.freeW = clamp(S22.freeW, 0, 2000);
        CIR.els.get('emf').E = clamp((S22.freeW || 0) / 9.55 * 0.05, 0, 4);
        const rec = ELVIS.get('motR');
        if (rec && rec.parts.rotor) rec.parts.rotor.rotation.z -= (S22.freeW || 0) * dt * 0.04;
        solveNow();
        updFree();
      }
      break;
    }
  }
});

/* ================= 启动 ================= */

loadAll([
  { key: 'plank', label: '台面', job: loadTexture('../assets/textures/pbr/plank_diff-DPUnSb0W.webp', { colorSpace: null, wrap: true }) },
  { key: 'plankN', label: '台面细节', job: loadTexture('../assets/textures/pbr/plank_nor-BoGKkjWD.webp', { colorSpace: null, wrap: true }) },
], (d, t, label) => loader.setText(`正在加载实验台 ${d}/${t}（${label}）`)).then((t) => {
  TEX = t;
  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      CH = sec;
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
