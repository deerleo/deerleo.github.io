/* EduLab · 电场与磁场（fields）
 * 章节：电场线与等势面 / 电场力做功与电势能 / 平行板电容器 / 示波管 / 磁感线 / 安培力 /
 *       洛伦兹力 / 质谱仪与回旋加速器 / 电磁感应与楞次定律 / 交流发电机 / 自由实验 / 随堂检测
 * 场线用 RK2 数值积分（拖动电荷节流重建并 dispose 旧 geometry）；
 * 洛伦兹力用绕 B 轴精确旋转（速率恒定），沙盒合场用半隐式积分 F=qE+qv×B。
 */
import {
  THREE, TAU, clamp,
  loadTexture, loadHDR, loadAll, createApp, cameraTweenTick, makeLoader,
  createSections, createControlsPanel, makeHUD, makeTextSprite, makeGlowTexture,
} from './edu-core.js';

/* ---------------- 本实验专属样式（不改动共享 lab.css） ---------------- */

const style = document.createElement('style');
style.textContent = `
.fields-corner2 { position:absolute; left:14px; bottom:82px; z-index:12; width:280px;
  border-radius:14px; overflow:hidden; border:1px solid var(--card-border);
  box-shadow:var(--shadow); background:var(--card); }
.fields-corner2 .cw-head { display:flex; align-items:center; gap:8px; padding:7px 12px;
  font-size:12.5px; color:var(--text-dim); background:var(--chip-bg); }
.fields-corner2 .cw-head b { color:var(--text); }
.fields-corner2 canvas { display:block; width:100%; height:150px; }
@media (max-width: 640px) { .fields-corner2 { left:10px; bottom:74px; width:216px; } }
`;
document.head.appendChild(style);

/* ---------------- 场景 ---------------- */

const stage = document.getElementById('stage');
const loader = makeLoader(stage, '正在搭建电场磁场实验室…');

const app = createApp({
  container: stage,
  fov: 42, near: 0.05, far: 80,
  cameraPos: [0, 3.2, 4.6],
  target: [0, 1.05, 0],
  minDistance: 0.8, maxDistance: 14,
  exposure: 1.0,
  keepBackground: true,
});
const { scene, camera, controls } = app;

scene.add(new THREE.AmbientLight(0xbcc6d4, 0.6));
const sunLight = new THREE.DirectionalLight(0xfff2e2, 1.6);
sunLight.position.set(3.5, 5, 3);
scene.add(sunLight);
const fillLight = new THREE.DirectionalLight(0xdfe8ff, 0.45);
fillLight.position.set(-4, 3, -2.5);
scene.add(fillLight);

const PLANE_Y = 1.06; // 电荷 / 粒子所在水平面高度
const UPV = new THREE.Vector3(0, 1, 0);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
function stdMat(opts) { return new THREE.MeshStandardMaterial(opts); }
function box(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

const worldG = new THREE.Group();
scene.add(worldG);
function buildWorld() {
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9, 48),
    stdMat({ color: 0x9aa2ab, roughness: 0.95, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  worldG.add(floor);
  const grid = new THREE.GridHelper(16, 32, 0x6d7680, 0x8d96a0);
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  worldG.add(grid);
}

/* ---------------- 通用小工具：箭头 / 条形磁铁 / 角落窗 / 提示 ---------------- */

const SHAFT_GEO = new THREE.CylinderGeometry(0.012, 0.012, 0.62, 6);
SHAFT_GEO.translate(0, 0.31, 0);
const HEAD_GEO = new THREE.ConeGeometry(0.036, 0.16, 8);
HEAD_GEO.translate(0, 0.9, 0);

function makeArrow(color = 0x9aa7b5, opacity = 0.9) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
  const shaft = new THREE.Mesh(SHAFT_GEO, mat);
  const head = new THREE.Mesh(HEAD_GEO, mat);
  g.add(shaft, head);
  g.userData.mat = mat;
  return g;
}
function setArrow(g, pos, dir, len) {
  g.position.copy(pos);
  g.quaternion.setFromUnitVectors(UPV, dir);
  g.scale.setScalar(len);
}

function makeBarMagnet(len = 1.1, h = 0.16) {
  const g = new THREE.Group();
  const nMat = stdMat({ color: 0xd34b41, roughness: 0.5, metalness: 0.25 });
  const sMat = stdMat({ color: 0x3b6fc9, roughness: 0.5, metalness: 0.25 });
  const n = box(len / 2, h, h * 0.9, nMat); n.position.x = len / 4;
  const s = box(len / 2, h, h * 0.9, sMat); s.position.x = -len / 4;
  const nLbl = makeTextSprite('N', { fontSize: 60, color: '#ffd9d4', scale: 0.0026 });
  nLbl.position.set(len / 4, h * 0.9, 0);
  const sLbl = makeTextSprite('S', { fontSize: 60, color: '#cfe2ff', scale: 0.0026 });
  sLbl.position.set(-len / 4, h * 0.9, 0);
  g.add(n, s, nLbl, sLbl);
  g.userData.halfLen = len / 2;
  return g;
}

const cornerWins = [];
function makeCorner(title, width = 280) {
  const win = document.createElement('div');
  win.className = 'fields-corner2';
  win.style.width = width + 'px';
  const head = document.createElement('div');
  head.className = 'cw-head';
  const b = document.createElement('b');
  b.textContent = title;
  head.appendChild(b);
  const cv = document.createElement('canvas');
  cv.width = width * 2;
  cv.height = 300;
  win.appendChild(head);
  win.appendChild(cv);
  stage.appendChild(win);
  cornerWins.push(win);
  return { win, cv, ctx: cv.getContext('2d') };
}
function clearCorners() {
  cornerWins.forEach((w) => w.remove());
  cornerWins.length = 0;
}

let hintEl = null;
function setHint(rows) {
  if (!rows || !rows.length) { if (hintEl) { hintEl.remove(); hintEl = null; } return; }
  if (!hintEl) {
    hintEl = document.createElement('div');
    hintEl.className = 'legend';
    stage.appendChild(hintEl);
  }
  hintEl.innerHTML = '';
  rows.forEach((t) => {
    const r = document.createElement('div');
    r.className = 'lg-row';
    r.textContent = t;
    hintEl.appendChild(r);
  });
}

/* ---------------- 电荷场工厂（第 1 章 / 自由实验共用） ---------------- */

const CHARGE_SPHERE_GEO = new THREE.SphereGeometry(0.13, 24, 18);
const SEL_RING_GEO = new THREE.RingGeometry(0.18, 0.23, 32);
const posMat = stdMat({ color: 0xe5484d, emissive: 0x571512, roughness: 0.35, metalness: 0.1 });
const negMat = stdMat({ color: 0x3f7de0, emissive: 0x11295c, roughness: 0.35, metalness: 0.1 });
const selMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
const ARROW_CONE_GEO = new THREE.ConeGeometry(0.02, 0.058, 6);

function fieldVec2D(px, pz, list) {
  let ex = 0, ez = 0;
  for (const c of list) {
    const dx = px - c.pos.x, dz = pz - c.pos.z;
    const r2 = dx * dx + dz * dz;
    if (r2 < 1e-4) return null;
    const e = c.q / (r2 * Math.sqrt(r2));
    ex += e * dx; ez += e * dz;
  }
  return [ex, ez];
}

function integrateLine(seed, sgn, list) {
  const pts = [seed.clone()];
  const p = seed.clone();
  const ds = 0.045;
  for (let s = 0; s < 300; s++) {
    let v = fieldVec2D(p.x, p.z, list);
    if (!v) break;
    let len = Math.hypot(v[0], v[1]);
    if (len < 1e-3) break;
    const k1x = (sgn * v[0]) / len, k1z = (sgn * v[1]) / len;
    v = fieldVec2D(p.x + k1x * ds * 0.5, p.z + k1z * ds * 0.5, list);
    if (!v) break;
    len = Math.hypot(v[0], v[1]);
    if (len < 1e-3) break;
    p.x += (sgn * v[0]) / len * ds;
    p.z += (sgn * v[1]) / len * ds;
    pts.push(p.clone());
    if (Math.abs(p.x) > 4.3 || Math.abs(p.z) > 4.3) break;
    let ended = false;
    for (const c of list) {
      const dx = p.x - c.pos.x, dz = p.z - c.pos.z;
      const r = Math.hypot(dx, dz);
      if (r < 0.15) {
        if (c.q * sgn < 0) { // 终止于异号电荷：吸附到表面
          p.x = c.pos.x + dx * (0.15 / r);
          p.z = c.pos.z + dz * (0.15 / r);
          pts.push(p.clone());
        }
        ended = true;
        break;
      }
    }
    if (ended) break;
  }
  return pts;
}

const _im4 = new THREE.Matrix4();
const _iq = new THREE.Quaternion();
const _idv = new THREE.Vector3();

/** 合成电场的等势线（marching squares）：φ = Σ kq/r，逐格判断电平穿越并线性插值 */
function equipotentialSegs(charges) {
  const NX = 104, NZ = 68, X0 = -3.2, X1 = 3.2, Z0 = -2.2, Z1 = 2.2;
  const dx = (X1 - X0) / (NX - 1), dz = (Z1 - Z0) / (NZ - 1);
  const phi = new Float32Array(NX * NZ);
  for (let j = 0; j < NZ; j++) {
    for (let i = 0; i < NX; i++) {
      const x = X0 + i * dx, z = Z0 + j * dz;
      let p = 0;
      for (const c of charges) {
        const r2 = (x - c.pos.x) * (x - c.pos.x) + (z - c.pos.z) * (z - c.pos.z);
        p += r2 < 0.02 ? NaN : c.q / Math.sqrt(r2);
      }
      phi[j * NX + i] = p;
    }
  }
  const levels = [-3.5, -2.2, -1.2, -0.6, 0.6, 1.2, 2.2, 3.5];
  const segs = [];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0]];
  for (let j = 0; j < NZ - 1; j++) {
    for (let i = 0; i < NX - 1; i++) {
      const v = [phi[j * NX + i], phi[j * NX + i + 1], phi[(j + 1) * NX + i + 1], phi[(j + 1) * NX + i]];
      if (v.some((t) => Number.isNaN(t))) continue;
      const x0 = X0 + i * dx, z0 = Z0 + j * dz;
      const pts = [[x0, z0], [x0 + dx, z0], [x0 + dx, z0 + dz], [x0, z0 + dz]];
      for (const L of levels) {
        const idx = v.reduce((acc, t, k) => acc | (t > L ? 1 << k : 0), 0);
        if (idx === 0 || idx === 15) continue;
        const crossings = [];
        E.forEach(([k1, k2]) => {
          if ((v[k1] > L) !== (v[k2] > L)) {
            const t = (L - v[k1]) / (v[k2] - v[k1]);
            crossings.push([pts[k1][0] + (pts[k2][0] - pts[k1][0]) * t, pts[k1][1] + (pts[k2][1] - pts[k1][1]) * t]);
          }
        });
        if (crossings.length === 2) {
          segs.push(crossings[0][0], 0, crossings[0][1], crossings[1][0], 0, crossings[1][1]);
        } else if (crossings.length === 4) {
          segs.push(crossings[0][0], 0, crossings[0][1], crossings[1][0], 0, crossings[1][1]);
          segs.push(crossings[2][0], 0, crossings[2][1], crossings[3][0], 0, crossings[3][1]);
        }
      }
    }
  }
  return segs;
}

function createChargeField(parent, colors, hidden = false) {
  const grp = new THREE.Group();
  grp.position.y = PLANE_Y;
  parent.add(grp);
  const lineGroup = new THREE.Group();
  const equipGroup = new THREE.Group();
  const chargeGroup = new THREE.Group();
  grp.add(lineGroup, equipGroup, chargeGroup);

  const lineMat = new THREE.LineBasicMaterial({ color: colors.line, transparent: true, opacity: 0.9 });
  const arrowMat = new THREE.MeshBasicMaterial({ color: colors.line });
  const arrowMesh = new THREE.InstancedMesh(ARROW_CONE_GEO, arrowMat, 480);
  arrowMesh.count = 0;
  arrowMesh.frustumCulled = false;
  grp.add(arrowMesh);

  const charges = [];
  const opts = { lines: 14, showLines: true, showEquip: false };

  function addCharge(q, x, z) {
    let mesh, ring = null;
    if (hidden) {
      mesh = new THREE.Object3D(); // 磁单极子等不可见锚点
      mesh.position.set(x, 0, z);
    } else {
      mesh = new THREE.Mesh(CHARGE_SPHERE_GEO, q > 0 ? posMat : negMat);
      mesh.position.set(x, 0, z);
      const lbl = makeTextSprite(q > 0 ? '+' : '−', { fontSize: 64, color: q > 0 ? '#ffd9d4' : '#cfe2ff', scale: 0.0034 });
      lbl.position.set(0, 0.17, 0);
      mesh.add(lbl);
      ring = new THREE.Mesh(SEL_RING_GEO, selMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.13;
      ring.visible = false;
      mesh.add(ring);
    }
    chargeGroup.add(mesh);
    const c = { q, mesh, ring, lines: opts.lines, pos: mesh.position };
    charges.push(c);
    return c;
  }
  function clearCharges() {
    for (const c of charges) {
      c.mesh.traverse((o) => { if (o.isSprite) { o.material.map.dispose(); o.material.dispose(); } });
      chargeGroup.remove(c.mesh);
    }
    charges.length = 0;
  }
  function rebuild() {
    for (const ch of lineGroup.children) ch.geometry.dispose();
    lineGroup.clear();
    for (const ch of equipGroup.children) { ch.geometry.dispose(); ch.material.dispose(); }
    equipGroup.clear();
    const posArr = [];
    let arrowCount = 0;
    if (opts.showLines) {
      for (const c of charges) {
        const hasOpp = charges.some((o) => o.q * c.q < 0);
        if (c.q < 0 && hasOpp) continue; // 负电荷的场线由正电荷一侧积分到达
        const n = Math.round(c.lines);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + 0.19;
          const seed = V3(c.mesh.position.x + Math.cos(a) * 0.19, 0, c.mesh.position.z + Math.sin(a) * 0.19);
          const pts = integrateLine(seed, c.q > 0 ? 1 : -1, charges);
          for (let k = 0; k < pts.length - 1; k++) {
            posArr.push(pts[k].x, 0, pts[k].z, pts[k + 1].x, 0, pts[k + 1].z);
          }
          for (let k = 7; k < pts.length - 3; k += 10) {
            if (arrowCount >= 480) break;
            const dx = pts[k + 1].x - pts[k - 1].x, dz = pts[k + 1].z - pts[k - 1].z;
            const dl = Math.hypot(dx, dz);
            if (dl < 1e-4) continue;
            let near = false;
            for (const o of charges) {
              if (Math.hypot(pts[k].x - o.mesh.position.x, pts[k].z - o.mesh.position.z) < 0.3) { near = true; break; }
            }
            if (near) continue;
            _idv.set(dx / dl, 0, dz / dl);
            _iq.setFromUnitVectors(UPV, _idv);
            _im4.makeRotationFromQuaternion(_iq);
            _im4.setPosition(pts[k].x, 0, pts[k].z);
            arrowMesh.setMatrixAt(arrowCount++, _im4);
          }
        }
      }
    }
    arrowMesh.count = arrowCount;
    arrowMesh.instanceMatrix.needsUpdate = true;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posArr), 3));
    lineGroup.add(new THREE.LineSegments(geo, lineMat));
    if (opts.showEquip && charges.length) {
      // 合成电场的等势线（多电荷时按矢量叠加电势求等值线，处处与电场线垂直）
      const segs = equipotentialSegs(charges);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs), 3));
      const eq = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: colors.equip, transparent: true, opacity: 0.55 }));
      equipGroup.add(eq);
    }
  }
  return {
    grp, charges, opts, addCharge, clearCharges, rebuild,
    markDirty() { this.dirty = true; },
    forceRebuild() { this.force = true; },
    dirty: false, force: true, last: -1,
    tick(time) {
      if (this.force || (this.dirty && time - this.last > 0.12)) {
        this.rebuild();
        this.dirty = this.force = false;
        this.last = time;
      }
    },
  };
}

/* ---------------- 电荷拖拽（Raycaster + 水平面求交，与 OrbitControls 互斥） ---------------- */

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const dragPlane = new THREE.Plane(V3(0, 1, 0), -PLANE_Y);
const dragHit = new THREE.Vector3();
let dragField = null;   // 当前允许拖拽的电荷场（第 1 章 / 自由实验）
let dragCharge = null;
let onSelectCharge = null; // 自由实验的选中回调

function setPointerNdc(e) {
  const rect = app.dom.getBoundingClientRect();
  ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

app.dom.addEventListener('pointerdown', (e) => {
  if (!labReady || !dragField) return;
  setPointerNdc(e);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(dragField.charges.map((c) => c.mesh), false);
  if (!hits.length) return;
  const c = dragField.charges.find((q) => q.mesh === hits[0].object);
  dragCharge = c;
  controls.enabled = false;
  app.dom.setPointerCapture(e.pointerId);
  if (onSelectCharge) onSelectCharge(c);
});
app.dom.addEventListener('pointermove', (e) => {
  if (!dragCharge || !dragField) return;
  setPointerNdc(e);
  raycaster.setFromCamera(ndc, camera);
  if (raycaster.ray.intersectPlane(dragPlane, dragHit)) {
    dragCharge.mesh.position.x = clamp(dragHit.x, -2.9, 2.9);
    dragCharge.mesh.position.z = clamp(dragHit.z, -2.4, 2.4);
    dragField.dirty = true;
  }
});
function endDrag() {
  if (dragCharge && dragField) dragField.force = true;
  dragCharge = null;
  controls.enabled = true;
}
app.dom.addEventListener('pointerup', endDrag);
app.dom.addEventListener('pointerleave', endDrag);

/* ---------------- 第 1 章 · 电场线与等势面 ---------------- */

const g1 = new THREE.Group();
scene.add(g1);
const cf1 = createChargeField(g1, { line: 0xff8a3d, equip: 0x5a9bff });
const st1 = { cfg: 'pair-opp', lines: 14 };

function setCfg1(cfg) {
  st1.cfg = cfg;
  cf1.clearCharges();
  if (cfg === 'single') cf1.addCharge(1, 0, 0);
  else if (cfg === 'pair-opp') { cf1.addCharge(1, -1.15, 0); cf1.addCharge(-1, 1.15, 0); }
  else { cf1.addCharge(1, -1.15, 0); cf1.addCharge(1, 1.15, 0); }
  for (const c of cf1.charges) c.lines = st1.lines;
  cf1.force = true;
}

/* ---------------- 第 2 章 · 电场力做功与电势能 ---------------- */

const g2 = new THREE.Group();
scene.add(g2);
const st2 = { q: 2, E: 4, d: 0.8, path: 'along', anim: null };
let w2 = {};
function buildWork() {
  const plateMat = stdMat({ color: 0xb7413a, roughness: 0.4, metalness: 0.3 });
  const negPlateMat = stdMat({ color: 0x3661a8, roughness: 0.4, metalness: 0.3 });
  const pL = box(0.07, 1.5, 1.15, plateMat); pL.position.set(-1.3, 1.06, 0);
  const pR = box(0.07, 1.5, 1.15, negPlateMat); pR.position.set(1.3, 1.06, 0);
  const lblL = makeTextSprite('＋', { fontSize: 70, color: '#ffd0cb', scale: 0.004 });
  lblL.position.set(-1.3, 1.95, 0);
  const lblR = makeTextSprite('－', { fontSize: 70, color: '#cfe0ff', scale: 0.004 });
  lblR.position.set(1.3, 1.95, 0);
  const arrows = [];
  for (const x of [-0.9, -0.45, 0, 0.45, 0.9]) {
    for (const z of [-0.4, 0, 0.4]) {
      const a = makeArrow(0xc7ccd4, 0.75);
      setArrow(a, V3(x, 1.06, z), V3(1, 0, 0), 0.4);
      g2.add(a); arrows.push(a);
    }
  }
  const probe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 14), stdMat({ color: 0xffd166, emissive: 0x5c430e, roughness: 0.3 }));
  probe.position.set(-1.05, 1.06, 0);
  const probeLbl = makeTextSprite('试探电荷', { fontSize: 30, color: '#ffe2a8', scale: 0.0028 });
  probeLbl.position.set(0, 0.25, 0);
  probe.add(probeLbl);
  g2.add(pL, pR, lblL, lblR, probe);
  w2 = { arrows, probe };
}
function probeStart() {
  if (st2.path === 'along') return { p: V3(-1.05, 1.06, 0), dir: V3(1, 0, 0) };
  if (st2.path === 'against') return { p: V3(1.05, 1.06, 0), dir: V3(-1, 0, 0) };
  if (st2.path === 'bent') {
    // 折线：先沿等势面平移（不做功），再顺场线走 d —— 与直线殊途同归
    return { p: V3(-1.05, 1.06, -0.7), via: V3(-1.05, 1.06, 0.7), dir: V3(1, 0, 0) };
  }
  return { p: V3(0, 1.06, -0.85), dir: V3(0, 0, 1) };
}
function resetProbe() {
  st2.anim = null;
  const s = probeStart();
  w2.probe.position.copy(s.p);
}

/* ---------------- 第 3 章 · 平行板电容器 ---------------- */

const g3 = new THREE.Group();
scene.add(g3);
const st3 = { U: 200, d: 10, S: 100, show: true, mode: 'U', eps: 1, Q: 2 };
const DIELECTRICS = [
  { name: '空气', eps: 1.0 },
  { name: '塑料', eps: 2.5 },
  { name: '玻璃', eps: 5.0 },
];
let w3 = {};
function buildCap() {
  const plateMat = stdMat({ color: 0xc9ccd2, roughness: 0.35, metalness: 0.7 });
  const pL = box(0.05, 0.8, 0.8, plateMat);
  const pR = box(0.05, 0.8, 0.8, plateMat);
  const lblL = makeTextSprite('＋', { fontSize: 64, color: '#ffd0cb', scale: 0.0036 });
  const lblR = makeTextSprite('－', { fontSize: 64, color: '#cfe0ff', scale: 0.0036 });
  const arrows = [];
  for (const x of [-0.35, 0, 0.35]) {
    for (const z of [-0.25, 0.08, 0.33]) {
      const a = makeArrow(0xd8543e, 0.85);
      g3.add(a); arrows.push(a);
    }
  }
  g3.add(pL, pR, lblL, lblR);
  w3 = { pL, pR, lblL, lblR, arrows };
}
function capC() { return (0.885 * st3.eps * st3.S) / st3.d; }          // pF
function capU() { return st3.mode === 'U' ? st3.U : (st3.Q * 1e-9) / (capC() * 1e-12); } // V
function capE() { return capU() / st3.d; }                             // V/mm
function applyCap() {
  const gap = 0.25 + (st3.d - 2) * (0.95 / 18); // 板距视觉映射 2~20mm
  const s = Math.sqrt(st3.S / 100);
  w3.pL.position.set(-gap / 2, 1.06, 0);
  w3.pR.position.set(gap / 2, 1.06, 0);
  w3.pL.scale.set(1, s, s);
  w3.pR.scale.set(1, s, s);
  w3.lblL.position.set(-gap / 2 - 0.06, 1.06 + 0.42 * s, 0);
  w3.lblR.position.set(gap / 2 + 0.06, 1.06 + 0.42 * s, 0);
  const Evm = capE(); // V/mm
  const len = Evm <= 0 ? 0 : 0.18 + clamp(Evm / 60, 0, 1) * 0.5;
  let i = 0;
  for (const x of [-0.35, 0, 0.35]) {
    for (const z of [-0.25, 0.08, 0.33]) {
      const a = w3.arrows[i++];
      a.visible = st3.show && len > 0.02;
      a.scale.setScalar(Math.max(len, 0.001) * s);
      setArrow(a, V3(x * s, 1.06, z * s), V3(1, 0, 0), Math.max(len, 0.001));
    }
  }
}

/* ---------------- 第 4 章 · 示波管 ---------------- */

const g4 = new THREE.Group();
scene.add(g4);
const st4 = { Uy: 60, freq: 1.5, gain: 1.4, sweep: true, U1: 1.5 };
let w4 = {};
function buildScope() {
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xaec6d4, roughness: 0.06, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 3.6, 24, 1, true), glass);
  tube.rotation.x = Math.PI / 2;
  tube.position.set(0, 1.06, -0.45);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.14, 0.5, 24, 1, true), glass);
  cone.rotation.x = -Math.PI / 2;
  cone.position.set(0, 1.06, 1.15);
  const gun = box(0.16, 0.16, 0.3, stdMat({ color: 0x5a6470, roughness: 0.4, metalness: 0.6 }));
  gun.position.set(0, 1.06, -2.0);
  const gunLbl = makeTextSprite('电子枪', { fontSize: 30, color: '#c9d4de', scale: 0.0028 });
  gunLbl.position.set(0.3, 1.4, -2.0);
  const yyTop = box(0.5, 0.02, 0.3, stdMat({ color: 0xb7413a, roughness: 0.4, metalness: 0.4 }));
  yyTop.position.set(0, 1.3, -0.95);
  const yyBot = box(0.5, 0.02, 0.3, stdMat({ color: 0x3661a8, roughness: 0.4, metalness: 0.4 }));
  yyBot.position.set(0, 0.82, -0.95);
  const yyLbl = makeTextSprite('YY′ 竖直偏转板', { fontSize: 30, color: '#e8c9b8', scale: 0.0028 });
  yyLbl.position.set(0.55, 1.5, -0.95);
  const xxL = box(0.02, 0.24, 0.3, stdMat({ color: 0xb7413a, roughness: 0.4, metalness: 0.4 }));
  xxL.position.set(-0.22, 1.06, -0.4);
  const xxR = xxL.clone(); xxR.position.x = 0.22;
  const xxLbl = makeTextSprite('XX′ 扫描板', { fontSize: 30, color: '#e8c9b8', scale: 0.0028 });
  xxLbl.position.set(0.5, 0.72, -0.4);
  const scrCv = document.createElement('canvas');
  scrCv.width = 256; scrCv.height = 256;
  const scrTex = new THREE.CanvasTexture(scrCv);
  scrTex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.CircleGeometry(0.32, 40), new THREE.MeshBasicMaterial({ map: scrTex }));
  screen.position.set(0, 1.06, 1.42);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.035, 10, 40), stdMat({ color: 0x3a4048, roughness: 0.5 }));
  bezel.position.copy(screen.position);
  const scrLbl = makeTextSprite('荧光屏', { fontSize: 30, color: '#a8ffd0', scale: 0.0028 });
  scrLbl.position.set(0, 1.56, 1.42);
  const MAXDOT = 8;
  const beamMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.02, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x9dffc0, transparent: true, opacity: 0.9 }),
    MAXDOT
  );
  beamMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  beamMesh.frustumCulled = false;
  g4.add(tube, cone, gun, gunLbl, yyTop, yyBot, yyLbl, xxL, xxR, xxLbl, screen, bezel, scrLbl, beamMesh);
  const dots = Array.from({ length: MAXDOT }, (_, i) => ({ p: i / MAXDOT }));
  w4 = { scrCv, scrCtx: scrCv.getContext('2d'), scrTex, beamMesh, dots };
  w4.scrCtx.fillStyle = '#04140a';
  w4.scrCtx.fillRect(0, 0, 256, 256);
}
function sig4(t) {
  // 偏转量 ∝ U₂/U₁（y = U₂L²/(4dU₁)，加速电压 U₁ 越高电子越"不易弯"）
  return ((st4.Uy / 100) * st4.gain * Math.sin(TAU * st4.freq * t) * 1.5) / st4.U1;
}

/* ---------------- 第 5 章 · 磁感线（条形磁铁偶极子场） ---------------- */

const g5 = new THREE.Group();
scene.add(g5);
const cf5 = createChargeField(g5, { line: 0x35b5c9 }, true);
const st5 = { cfg: 'single', flip: false, filings: true, wireDir: 1 };
let w5 = {};
function buildMagnet() {
  const magA = makeBarMagnet(1.1);
  const magB = makeBarMagnet(1.1);
  // 通电直导线（沿 y 轴）+ 同心圆磁感线
  const wire = cyl(0.018, 0.018, 1.3, stdMat({ color: 0xd9a441, roughness: 0.3, metalness: 0.8 }));
  wire.position.set(0, PLANE_Y, 0);
  const wireLbl = makeTextSprite('通电直导线', { fontSize: 28, color: '#e0c9b8', scale: 0.0026 });
  wireLbl.position.set(0, PLANE_Y + 0.8, 0);
  wire.add(wireLbl);
  const circlesG = new THREE.Group();
  const cMat = new THREE.LineBasicMaterial({ color: 0x35b5c9, transparent: true, opacity: 0.75 });
  const wireArrows = [];
  const tangGeo = new THREE.ConeGeometry(0.03, 0.09, 8);
  const tangMat = new THREE.MeshBasicMaterial({ color: 0x35b5c9 });
  for (const R of [0.35, 0.7, 1.1, 1.6, 2.1]) {
    const pts = [];
    for (let k = 0; k <= 60; k++) {
      const aa = (k / 60) * TAU;
      pts.push(V3(Math.cos(aa) * R, PLANE_Y, Math.sin(aa) * R));
    }
    circlesG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), cMat));
    for (let k = 0; k < 4; k++) {
      const cone = new THREE.Mesh(tangGeo, tangMat);
      circlesG.add(cone);
      wireArrows.push({ cone, R, a: (k / 4) * TAU + 0.35 });
    }
  }
  const wireG = new THREE.Group();
  wireG.add(wire, circlesG);
  wireG.visible = false;
  g5.add(magA, magB, wireG);
  w5 = { magA, magB, filingsCv: null, wireG, wireArrows };
}
function magnetPoles() {
  // 返回单极子列表（教学近似）：N=+1、S=−1；flip 通过整体旋转磁铁实现场线反向
  const poles = [];
  const pushMag = (cx, flipRot, on) => {
    if (!on) return;
    const dir = flipRot ? -1 : 1; // N 极在 +x（dir=1）或 −x（dir=-1）
    poles.push({ q: 1, pos: { x: cx + dir * 0.475, z: 0 } });
    poles.push({ q: -1, pos: { x: cx - dir * 0.475, z: 0 } });
  };
  if (st5.cfg === 'single') pushMag(0, st5.flip, true);
  else { pushMag(-1.2, st5.flip, true); pushMag(1.2, !st5.flip, true); }
  return poles;
}
function fieldAt5(x, z) {
  if (st5.cfg === 'wire') {
    // 通电直导线：B = μ₀I/(2πr)，方向按安培定则（I 沿 +y 时 B = I·ŷ×r̂）
    const r2 = x * x + z * z;
    if (r2 < 0.02) return null;
    const s = st5.wireDir;
    return [(s * z) / r2, (-s * x) / r2];
  }
  return fieldVec2D(x, z, magnetPoles());
}
function orientWireArrows() {
  const s = st5.wireDir;
  for (const { cone, R, a } of w5.wireArrows) {
    const x = Math.cos(a) * R, z = Math.sin(a) * R;
    _idv.set(z * s, 0, -x * s).normalize();
    cone.position.set(x, PLANE_Y, z);
    cone.quaternion.setFromUnitVectors(UPV, _idv);
  }
}
function applyMagnet() {
  const wire = st5.cfg === 'wire';
  w5.wireG.visible = wire;
  w5.magA.visible = !wire;
  w5.magB.visible = !wire && st5.cfg !== 'single';
  if (wire) {
    cf5.clearCharges();
    cf5.opts.showLines = false;
    cf5.force = true;
    orientWireArrows();
  } else {
    w5.magA.position.set(st5.cfg === 'single' ? 0 : -1.2, PLANE_Y, 0);
    w5.magB.position.set(1.2, PLANE_Y, 0);
    w5.magA.rotation.y = st5.flip ? Math.PI : 0;
    w5.magB.rotation.y = st5.cfg !== 'single' && !st5.flip ? Math.PI : 0;
    cf5.clearCharges();
    for (const p of magnetPoles()) {
      const c = cf5.addCharge(p.q, p.pos.x, p.pos.z);
      c.lines = 12;
    }
    cf5.opts.showLines = true;
    cf5.force = true;
  }
  if (st5.filings) drawFilings();
}
function drawFilings() {
  if (!w5.filingsCv) w5.filingsCv = makeCorner('铁屑模拟（俯视）');
  const { ctx } = w5.filingsCv;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.fillStyle = '#161a1f';
  ctx.fillRect(0, 0, W, H);
  const poles = st5.cfg === 'wire' ? [] : magnetPoles();
  const NX = 36, NZ = 19;
  ctx.strokeStyle = '#9aa3ac';
  ctx.lineWidth = 2;
  for (let i = 0; i < NX; i++) {
    for (let j = 0; j < NZ; j++) {
      const x = -2.3 + (i / (NX - 1)) * 4.6;
      const z = -1.12 + (j / (NZ - 1)) * 2.24;
      let close = false;
      for (const p of poles) if (Math.hypot(x - p.pos.x, z - p.pos.z) < 0.28) close = true;
      if (close) continue;
      const v = fieldAt5(x, z);
      if (!v) continue;
      const mag = Math.hypot(v[0], v[1]);
      const len = clamp(Math.log10(1 + mag * 40) * 9, 4, 17);
      const ux = v[0] / mag, uz = v[1] / mag;
      const px = (i / (NX - 1)) * (W - 20) + 10;
      const pz = (j / (NZ - 1)) * (H - 20) + 10;
      ctx.beginPath();
      ctx.moveTo(px - ux * len, pz - uz * len);
      ctx.lineTo(px + ux * len, pz + uz * len);
      ctx.stroke();
    }
  }
}

/* ---------------- 第 6 章 · 安培力 ---------------- */

const g6 = new THREE.Group();
scene.add(g6);
const st6 = { I: 1.5, B: 0.8, L: 0.8, dir: 1, z: 0, v: 0 };
let w6 = {};
function buildAmpere() {
  const railMat = stdMat({ color: 0x7a828c, roughness: 0.35, metalness: 0.7 });
  const railA = box(0.06, 0.04, 2.8, railMat); railA.position.set(-0.34, 0.94, 0);
  const railB = railA.clone(); railB.position.x = 0.34;
  const legA = box(0.1, 0.9, 0.1, railMat); legA.position.set(-0.34, 0.45, -1.3);
  const legB = legA.clone(); legB.position.x = 0.34;
  const rod = box(1.0, 0.07, 0.07, stdMat({ color: 0xd9a441, roughness: 0.3, metalness: 0.8 }));
  rod.position.set(0, 1.0, 0);
  const rodG = new THREE.Group();
  rodG.add(rod);
  const curArrows = new THREE.Group();
  const coneGeo = new THREE.ConeGeometry(0.032, 0.1, 8);
  const curMat = new THREE.MeshBasicMaterial({ color: 0x35d07a });
  for (const x of [-0.25, 0, 0.25]) {
    const c = new THREE.Mesh(coneGeo, curMat);
    c.rotation.z = -Math.PI / 2;
    c.position.set(x, 0, 0);
    curArrows.add(c);
  }
  rodG.add(curArrows);
  rodG.position.set(0, 1.0, 0);
  const magTop = box(1.7, 0.16, 1.6, stdMat({ color: 0xd34b41, roughness: 0.5, metalness: 0.25 }));
  magTop.position.set(0, 1.5, 0);
  const magBot = box(1.7, 0.16, 1.6, stdMat({ color: 0x3b6fc9, roughness: 0.5, metalness: 0.25 }));
  magBot.position.set(0, 0.62, 0);
  const nLbl = makeTextSprite('N', { fontSize: 60, color: '#ffd9d4', scale: 0.0026 });
  nLbl.position.set(0, 1.68, 0);
  const sLbl = makeTextSprite('S', { fontSize: 60, color: '#cfe2ff', scale: 0.0026 });
  sLbl.position.set(0, 0.44, 0);
  const arrows = [];
  for (const x of [-0.5, 0, 0.5]) {
    for (const z of [-0.55, 0, 0.55]) {
      const a = makeArrow(0x7fb2ff, 0.6);
      g6.add(a); arrows.push(a);
    }
  }
  const batt = box(0.22, 0.16, 0.22, stdMat({ color: 0x2f3338, roughness: 0.6 }));
  batt.position.set(0, 0.86, -1.45);
  const battLbl = makeTextSprite('电源', { fontSize: 30, color: '#c9d4de', scale: 0.0026 });
  battLbl.position.set(0, 1.12, -1.45);
  g6.add(railA, railB, legA, legB, rodG, magTop, magBot, nLbl, sLbl, batt, battLbl);
  w6 = { rodG, curArrows, arrows };
}
function applyAmpereArrows() {
  let i = 0;
  for (const x of [-0.5, 0, 0.5]) {
    for (const z of [-0.55, 0, 0.55]) {
      setArrow(w6.arrows[i++], V3(x, 0.85, z), V3(0, -1, 0), 0.18 + st6.B * 0.2);
    }
  }
  w6.curArrows.rotation.y = st6.dir > 0 ? 0 : Math.PI;
  w6.rodG.scale.x = st6.L;
}

/* ---------------- 第 7 章 · 洛伦兹力 ---------------- */

const g7 = new THREE.Group();
scene.add(g7);
const st7 = { v: 1.5, B: 0.8, m: 1, q: 1, alpha: 0, active: false, pos: new THREE.Vector3(), vel: new THREE.Vector3() };
let w7 = {};
const TRAIL7 = 240;
function buildLorentz() {
  const frameGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.9, 1.05, 2.9));
  const frame = new THREE.LineSegments(frameGeo, new THREE.LineBasicMaterial({ color: 0x7f8b98, transparent: true, opacity: 0.5 }));
  frame.position.y = 1.06;
  const arrows = [];
  for (const x of [-0.9, -0.3, 0.3, 0.9]) {
    for (const z of [-0.9, -0.3, 0.3, 0.9]) {
      const a = makeArrow(0x7fb2ff, 0.5);
      g7.add(a); arrows.push(a);
    }
  }
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 16, 12),
    stdMat({ color: 0x35e0c8, emissive: 0x0c5e51, roughness: 0.3 })
  );
  particle.position.set(-0.9, PLANE_Y, 0);
  const trailPos = new Float32Array(TRAIL7 * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setDrawRange(0, 0);
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0x35e0c8, transparent: true, opacity: 0.8 }));
  trail.frustumCulled = false;
  g7.add(frame, particle, trail);
  w7 = { arrows, particle, trail, trailPos, trailGeo, trailLen: 0 };
}
function launch7() {
  st7.pos.set(-0.9, PLANE_Y, 0);
  const al = (st7.alpha * Math.PI) / 180;
  st7.vel.set(st7.v * Math.cos(al), st7.v * Math.sin(al), 0);
  st7.active = true;
  w7.trailLen = 0;
  w7.trailGeo.setDrawRange(0, 0);
  w7.particle.visible = true;
}
function pushTrail7() {
  if (w7.trailLen < TRAIL7) {
    w7.trailPos.set([st7.pos.x, st7.pos.y, st7.pos.z], w7.trailLen * 3);
    w7.trailLen++;
  } else {
    w7.trailPos.copyWithin(0, 3);
    w7.trailPos.set([st7.pos.x, st7.pos.y, st7.pos.z], (TRAIL7 - 1) * 3);
  }
  w7.trailGeo.attributes.position.needsUpdate = true;
  w7.trailGeo.setDrawRange(0, w7.trailLen);
}

/* ---------------- 第 8 章 · 质谱仪与回旋加速器 ---------------- */

const g8ms = new THREE.Group();
const g8cyc = new THREE.Group();
scene.add(g8ms, g8cyc);
const st8 = { mode: 'ms', U: 600, B: 0.5, msTime: 0 };
const ISOTOPES = [
  { name: 'C-12', mass: 12, color: 0xffd166 },
  { name: 'C-13', mass: 13, color: 0x8fd48a },
  { name: 'C-14', mass: 14, color: 0x7fb2ff },
];
let w8ms = {};
function buildMS() {
  const src = box(0.3, 0.3, 0.3, stdMat({ color: 0x5a6470, roughness: 0.45, metalness: 0.5 }));
  src.position.set(-2.35, 1.06, 0);
  const srcLbl = makeTextSprite('离子源', { fontSize: 30, color: '#c9d4de', scale: 0.0028 });
  srcLbl.position.set(-2.35, 1.45, 0);
  const plateMat = stdMat({ color: 0xb7413a, roughness: 0.4, metalness: 0.4 });
  const plateMat2 = stdMat({ color: 0x3661a8, roughness: 0.4, metalness: 0.4 });
  const selTop = box(0.7, 0.03, 0.45, plateMat); selTop.position.set(-1.35, 1.28, 0);
  const selBot = box(0.7, 0.03, 0.45, plateMat2); selBot.position.set(-1.35, 0.84, 0);
  const selLbl = makeTextSprite('速度选择器', { fontSize: 30, color: '#e8c9b8', scale: 0.0028 });
  selLbl.position.set(-1.35, 1.62, 0);
  const slit1 = box(0.09, 0.5, 0.09, stdMat({ color: 0x5a6470, roughness: 0.5, metalness: 0.5 }));
  slit1.position.set(-0.62, 1.35, 0);
  const slit2 = slit1.clone(); slit2.position.y = 0.77;
  const slitLbl = makeTextSprite('窄缝', { fontSize: 26, color: '#c9d4de', scale: 0.0026 });
  slitLbl.position.set(-0.62, 1.68, 0);
  const regionGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.6, 0.95, 2.6));
  const region = new THREE.LineSegments(regionGeo, new THREE.LineBasicMaterial({ color: 0x6d8398, transparent: true, opacity: 0.5 }));
  region.position.set(0.85, 1.06, -1.2);
  const arrows = [];
  for (const x of [-0.1, 0.85, 1.8]) {
    for (const z of [-2.0, -1.2, -0.4]) {
      const a = makeArrow(0x7fb2ff, 0.5);
      g8ms.add(a); arrows.push(a);
    }
  }
  const detector = box(0.05, 0.4, 2.5, stdMat({ color: 0xe8e2d2, roughness: 0.9 }));
  detector.position.set(-0.62, 1.06, -1.2);
  const detLbl = makeTextSprite('感光屏', { fontSize: 30, color: '#e8e2d2', scale: 0.0028 });
  detLbl.position.set(-0.62, 1.42, -2.3);
  g8ms.add(src, srcLbl, selTop, selBot, selLbl, slit1, slit2, slitLbl, region, detector, detLbl);
  const ions = [];
  const trails = [];
  const labels = [];
  const TRN = 140;
  ISOTOPES.forEach((iso) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 14, 10),
      new THREE.MeshBasicMaterial({ color: iso.color })
    );
    m.visible = false;
    g8ms.add(m);
    const tPos = new Float32Array(TRN * 3);
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
    tGeo.setDrawRange(0, 0);
    const line = new THREE.Line(tGeo, new THREE.LineBasicMaterial({ color: iso.color, transparent: true, opacity: 0.75 }));
    line.frustumCulled = false;
    g8ms.add(line);
    const lbl = makeTextSprite(iso.name, { fontSize: 30, color: '#ffffff', scale: 0.003 });
    lbl.visible = false;
    g8ms.add(lbl);
    ions.push({ iso, mesh: m, phi: 0, r: 0, active: false, tPos, tGeo, tLen: 0 });
    trails.push(line);
    labels.push(lbl);
  });
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,240,190'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  flash.scale.set(0.28, 0.28, 1);
  flash.visible = false;
  g8ms.add(flash);
  w8ms = { arrows, ions, labels, flash, flashT: -1 };
}
function applyMSArrows() {
  let i = 0;
  for (const x of [-0.1, 0.85, 1.8]) {
    for (const z of [-2.0, -1.2, -0.4]) {
      setArrow(w8ms.arrows[i++], V3(x, 0.72, z), V3(0, -1, 0), 0.16 + st8.B * 0.16);
    }
  }
}
function launchMS() {
  for (let i = 0; i < w8ms.ions.length; i++) {
    const ion = w8ms.ions[i];
    ion.active = false;
    ion.hit = false;
    ion.mesh.visible = false;
    ion.tLen = 0;
    ion.tGeo.setDrawRange(0, 0);
    ion.delay = i * 0.55;
    const mKg = ion.iso.mass * 1.66e-27;
    const rM = Math.sqrt((2 * mKg * st8.U) / (1.6e-19 * st8.B * st8.B));
    ion.rReal = rM;
    ion.r = clamp(rM * 26, 0.15, 2.3);
    ion.speed = 1.5 * Math.sqrt(st8.U / 600);
    w8ms.labels[i].visible = false;
  }
  st8.msTime = 0;
}
function msRadiusText() {
  const mKg = 12 * 1.66e-27;
  const rM = Math.sqrt((2 * mKg * st8.U) / (1.6e-19 * st8.B * st8.B));
  return (rM * 100).toFixed(1) + ' cm';
}

let w8c = {};
const TRAIL8 = 420;
function buildCyc() {
  const deeMat = stdMat({ color: 0x8f9aa6, roughness: 0.35, metalness: 0.7 });
  const dee1 = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.15, 40, 1, false, 0, Math.PI), deeMat);
  dee1.position.set(0.07, PLANE_Y, 0);
  const dee2 = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.15, 40, 1, false, Math.PI, Math.PI), deeMat);
  dee2.position.set(-0.07, PLANE_Y, 0);
  const d1Lbl = makeTextSprite('D₁', { fontSize: 36, color: '#dfe6ee', scale: 0.003 });
  d1Lbl.position.set(0.65, PLANE_Y + 0.2, 0.65);
  const d2Lbl = makeTextSprite('D₂', { fontSize: 36, color: '#dfe6ee', scale: 0.003 });
  d2Lbl.position.set(-0.65, PLANE_Y + 0.2, -0.65);
  const gapFlash = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.2, 0.5),
    new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0 })
  );
  gapFlash.position.set(0, PLANE_Y, 0);
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  );
  particle.visible = false;
  const trailPos = new Float32Array(TRAIL8 * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setDrawRange(0, 0);
  const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85 }));
  trail.frustumCulled = false;
  g8cyc.add(dee1, dee2, d1Lbl, d2Lbl, gapFlash, particle, trail);
  w8c = { dee1, dee2, gapFlash, particle, trail, trailPos, trailGeo, trailLen: 0, flashT: 0 };
}
function launchCyc() {
  w8c.trailLen = 0;
  w8c.trailGeo.setDrawRange(0, 0);
  st8c.pos.set(-0.32, PLANE_Y, 0);
  st8c.vel.set(0.45 + 0.25 * (st8.U / 600), 0, 0);
  st8c.crossings = 0;
  st8c.active = true;
  st8c.prevX = st8c.pos.x;
  w8c.particle.visible = true;
}
const st8c = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), active: false, crossings: 0, prevX: 0 };

/* ---------------- 第 9 章 · 电磁感应与楞次定律 ---------------- */

const g9 = new THREE.Group();
scene.add(g9);
const st9 = { speed: 1.2, N: 12, action: 'still', magX: 2.4, anim: false, animDir: 0, emf: 0, showArrows: true, mode: 'magnet' };
const st9r = { F: 0.12, B: 0.5, L: 0.8, R: 2, v: 0, x: -0.7 };
let w9 = {};
let w9r = {};
function buildInduction() {
  const coilMat = stdMat({ color: 0xc08040, roughness: 0.35, metalness: 0.7 });
  const coilG = new THREE.Group();
  coilG.position.y = PLANE_Y;
  const tori = [];
  for (let i = 0; i < 18; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.02, 8, 28), coilMat);
    t.rotation.y = Math.PI / 2;
    coilG.add(t);
    tori.push(t);
  }
  const curArrows = new THREE.Group();
  const coneGeo = new THREE.ConeGeometry(0.035, 0.1, 8);
  const curMat = new THREE.MeshBasicMaterial({ color: 0x35d07a });
  for (let k = 0; k < 4; k++) {
    const c = new THREE.Mesh(coneGeo, curMat);
    curArrows.add(c);
  }
  coilG.add(curArrows);
  const track = box(3.6, 0.02, 0.07, stdMat({ color: 0x7a828c, roughness: 0.4, metalness: 0.6 }));
  track.position.set(0.4, 0.9, 0);
  const magnet = makeBarMagnet(1.0, 0.14);
  magnet.rotation.y = Math.PI; // N 极朝 −x，先插入的是 N 极
  const magLbl = makeTextSprite('条形磁铁', { fontSize: 28, color: '#e0c9b8', scale: 0.0026 });
  magLbl.position.set(0, 0.26, 0);
  magnet.add(magLbl);
  g9.add(coilG, track, magnet);
  w9 = { coilG, track, tori, curArrows, magnet, galvCv: null };

  /* 导体棒切割子台（mode='rod' 时显示） */
  const rg = new THREE.Group();
  rg.visible = false;
  const railMat = stdMat({ color: 0x7a828c, roughness: 0.35, metalness: 0.7 });
  const railA = box(2.6, 0.04, 0.06, railMat); railA.position.set(0.1, 0.94, -0.3);
  const railB = railA.clone(); railB.position.z = 0.3;
  const legA = box(0.1, 0.9, 0.1, railMat); legA.position.set(-1.1, 0.45, -0.3);
  const legB = legA.clone(); legB.position.z = 0.3;
  const legC = legA.clone(); legC.position.x = 1.3;
  const legD = legC.clone(); legD.position.z = 0.3;
  const rod = box(0.07, 0.07, 0.66, stdMat({ color: 0xd9a441, roughness: 0.3, metalness: 0.8 }));
  rod.position.y = 1.0;
  const rodG = new THREE.Group();
  rodG.add(rod);
  rodG.position.x = -0.7;
  const pullArr = makeArrow(0x35d07a, 0.9);
  setArrow(pullArr, V3(-0.25, 1.06, 0), V3(1, 0, 0), 0.35);
  rodG.add(pullArr);
  const rodLbl = makeTextSprite('导体棒（受恒定拉力）', { fontSize: 26, color: '#b8ecc9', scale: 0.0024 });
  rodLbl.position.set(0, 0.3, 0);
  rodG.add(rodLbl);
  const bArrows = [];
  for (const x of [-0.7, 0.1, 0.9]) {
    const a = makeArrow(0x7fb2ff, 0.6);
    rg.add(a); bArrows.push(a);
  }
  const resBox = box(0.16, 0.2, 0.2, stdMat({ color: 0x2f3338, roughness: 0.6 }));
  resBox.position.set(-1.35, 1.0, 0);
  const resLbl = makeTextSprite('电阻 R', { fontSize: 26, color: '#c9d4de', scale: 0.0024 });
  resLbl.position.set(-1.35, 1.24, 0);
  rg.add(railA, railB, legA, legB, legC, legD, rodG, resBox, resLbl);
  g9.add(rg);
  w9r = { g: rg, rodG, bArrows };
}
function applyMode9() {
  const rod = st9.mode === 'rod';
  w9.coilG.visible = !rod;
  w9.track.visible = !rod;
  w9.magnet.visible = !rod;
  w9r.g.visible = rod;
  w9r.bArrows.forEach((a) => {
    a.visible = rod;
    setArrow(a, a.position, V3(0, -1, 0), 0.2 + st9r.B * 0.22);
  });
  w9r.bArrows[0].position.set(-0.7, 0.8, 0);
  w9r.bArrows[1].position.set(0.1, 0.8, 0);
  w9r.bArrows[2].position.set(0.9, 0.8, 0);
}
function applyCoilTurns() {
  const N = st9.N;
  for (let i = 0; i < 18; i++) {
    const t = w9.tori[i];
    t.visible = i < N;
    t.position.x = -0.65 + ((i + 0.5) / N) * 1.3;
  }
}
function setAction9(act) {
  st9.action = act;
  if (act === 'insert') { st9.anim = true; st9.animDir = -1; }
  else if (act === 'pull') { st9.anim = true; st9.animDir = 1; }
  else st9.anim = false;
}
function emf9(vx) {
  // Φ(d)=N/(d²+c)^1.5 的解析导数：raw = 3N·d·v·(d²+c)^-2.5，插入为负、拔出为正（归一化时 /900）
  const d = Math.abs(st9.magX);
  return 3 * st9.N * d * vx * Math.pow(d * d + 0.18, -2.5);
}
function drawGalv(needle) {
  if (!w9.galvCv) w9.galvCv = makeCorner('灵敏电流计');
  const { ctx } = w9.galvCv;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.fillStyle = '#161a1f';
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.86, R = H * 0.62;
  ctx.strokeStyle = '#6d7884';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, R, Math.PI + (Math.PI / 6), TAU - (Math.PI / 6));
  ctx.stroke();
  ctx.fillStyle = '#9aa3ac';
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  for (let k = -3; k <= 3; k++) {
    const a = Math.PI / 2 + (k / 3.4) * (Math.PI * 5 / 12);
    const x1 = cx + Math.cos(a) * (R - 12), y1 = cy - Math.sin(a) * (R - 12);
    const x2 = cx + Math.cos(a) * R, y2 = cy - Math.sin(a) * R;
    ctx.strokeStyle = '#9aa3ac';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    if (k % 2 === 0) ctx.fillText(String(Math.abs(k) * 10), cx + Math.cos(a) * (R - 34), cy - Math.sin(a) * (R - 34) + 6);
  }
  ctx.fillStyle = '#c9d4de';
  ctx.fillText('μA', cx, cy - R - 8);
  ctx.fillText('0', cx, cy + 4);
  const ang = Math.PI / 2 + clamp(needle, -1, 1) * (Math.PI * 5 / 12);
  ctx.strokeStyle = '#e5484d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(ang) * (R - 16), cy - Math.sin(ang) * (R - 16));
  ctx.stroke();
  ctx.fillStyle = '#e5484d';
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, TAU);
  ctx.fill();
}

/* ---------------- 第 10 章 · 交流发电机 ---------------- */

const g10 = new THREE.Group();
scene.add(g10);
const st10 = { n: 1.2, B: 0.8, Nt: 12, bulb: true, theta: 0 };
let w10 = {};
function buildGenerator() {
  const statorMat = stdMat({ color: 0x9aa2ab, roughness: 0.45, metalness: 0.3 });
  const poleN = box(0.3, 1.3, 1.3, stdMat({ color: 0xd34b41, roughness: 0.5, metalness: 0.25 }));
  poleN.position.set(-1.5, 1.06, 0);
  const poleS = box(0.3, 1.3, 1.3, stdMat({ color: 0x3b6fc9, roughness: 0.5, metalness: 0.25 }));
  poleS.position.set(1.5, 1.06, 0);
  const nLbl = makeTextSprite('N', { fontSize: 60, color: '#ffd9d4', scale: 0.0026 });
  nLbl.position.set(-1.5, 1.85, 0);
  const sLbl = makeTextSprite('S', { fontSize: 60, color: '#cfe2ff', scale: 0.0026 });
  sLbl.position.set(1.5, 1.85, 0);
  const arrows = [];
  for (const y of [0.68, 1.44]) {
    for (const z of [-0.42, 0, 0.42]) {
      const a = makeArrow(0xc7ccd4, 0.7);
      g10.add(a); arrows.push(a);
    }
  }
  const coilMat = stdMat({ color: 0xc08040, roughness: 0.35, metalness: 0.7 });
  const coilG = new THREE.Group();
  coilG.position.y = PLANE_Y;
  const loopPts = [
    V3(0, -0.34, -0.28), V3(0, 0.34, -0.28), V3(0, 0.34, 0.28), V3(0, -0.34, 0.28),
  ];
  for (const s of [1, 0.88, 0.76]) {
    const pts = loopPts.map((p) => p.clone().multiplyScalar(s));
    const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.6);
    coilG.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.016, 8, true), coilMat));
  }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.7, 10), coilMat);
  shaft.rotation.x = Math.PI / 2;
  coilG.add(shaft);
  for (const z of [-0.1, 0.1]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16), coilMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.z = z;
    coilG.add(ring);
    const brush = box(0.03, 0.1, 0.03, stdMat({ color: 0x2f3338, roughness: 0.7 }));
    brush.position.set(0, 0, z);
    coilG.add(brush);
  }
  const bulbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.08, 14), stdMat({ color: 0x5a6470, roughness: 0.5, metalness: 0.5 }));
  bulbBase.position.set(0.85, 0.86, 0.55);
  const bulbMat = stdMat({ color: 0xffe9b8, emissive: 0xffb347, emissiveIntensity: 0, roughness: 0.25 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 14), bulbMat);
  bulb.position.set(0.85, 0.98, 0.55);
  const bulbGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('255,220,150'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0,
  }));
  bulbGlow.position.copy(bulb.position);
  bulbGlow.scale.set(0.3, 0.3, 1);
  const stand = box(0.18, 0.04, 0.18, stdMat({ color: 0x7a828c, roughness: 0.5, metalness: 0.5 }));
  stand.position.set(0.85, 0.82, 0.55);
  const wireCurve = new THREE.CatmullRomCurve3([
    V3(0, PLANE_Y - 0.1, -0.1), V3(0.3, 0.8, -0.1), V3(0.62, 0.9, 0.3), V3(0.85, 0.9, 0.48),
  ]);
  const wireCurve2 = new THREE.CatmullRomCurve3([
    V3(0, PLANE_Y + 0.1, 0.1), V3(0.35, 1.3, 0.35), V3(0.68, 1.1, 0.55), V3(0.85, 1.02, 0.58),
  ]);
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x3a4048 });
  g10.add(poleN, poleS, nLbl, sLbl, coilG, bulbBase, bulb, bulbGlow, stand,
    new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 32, 0.008, 6), wireMat),
    new THREE.Mesh(new THREE.TubeGeometry(wireCurve2, 32, 0.008, 6), wireMat));
  w10 = { arrows, coilG, bulbMat, bulbGlow, waveCv: null, samples: new Array(160).fill(0) };
}
function applyGenArrows() {
  let i = 0;
  for (const y of [0.68, 1.44]) {
    for (const z of [-0.42, 0, 0.42]) {
      setArrow(w10.arrows[i++], V3(0, y, z), V3(1, 0, 0), 0.22 + st10.B * 0.22);
    }
  }
}
function drawWave(eN) {
  if (!w10.waveCv) w10.waveCv = makeCorner('感应电动势 e(t)');
  w10.samples.push(eN);
  w10.samples.shift();
  const { ctx } = w10.waveCv;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.fillStyle = '#161a1f';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#39424d';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < w10.samples.length; i++) {
    const x = (i / (w10.samples.length - 1)) * (W - 16) + 8;
    const y = H / 2 - clamp(w10.samples[i], -1.1, 1.1) * (H * 0.4);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/* ---------------- 第 11 章 · 自由实验（电荷沙盒 + 合场粒子） ---------------- */

const g11 = new THREE.Group();
scene.add(g11);
const cf2 = createChargeField(g11, { line: 0xff8a3d, equip: 0x5a9bff });
const st11 = { Bon: false, B: 0.8, ptype: 'electron' };
const PTYPE11 = {
  electron: { label: '电子', q: -1, m: 0.5, color: 0x7be0ff },
  proton: { label: '质子', q: 1, m: 1, color: 0xff9a7b },
  alpha: { label: 'α 粒子', q: 2, m: 4, color: 0xffd166 },
};
let w11 = {};
function buildSandbox() {
  const arrows = [];
  for (const x of [-1.6, -0.8, 0, 0.8, 1.6]) {
    for (const z of [-1.6, -0.8, 0, 0.8, 1.6]) {
      const a = makeArrow(0x7fb2ff, 0.45);
      setArrow(a, V3(x, 0.62, z), UPV, 0.34);
      a.visible = false;
      g11.add(a); arrows.push(a);
    }
  }
  const parts = [];
  const PMAX = 4;
  const partGeo = new THREE.SphereGeometry(0.055, 12, 10);
  const partMats = {};
  for (const k of Object.keys(PTYPE11)) {
    partMats[k] = new THREE.MeshBasicMaterial({ color: PTYPE11[k].color });
  }
  const TRP = 240;
  for (let i = 0; i < PMAX; i++) {
    const m = new THREE.Mesh(partGeo, partMats.electron);
    m.visible = false;
    g11.add(m);
    const tPos = new Float32Array(TRP * 3);
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
    tGeo.setDrawRange(0, 0);
    const line = new THREE.Line(tGeo, new THREE.LineBasicMaterial({ color: 0x7be0ff, transparent: true, opacity: 0.7 }));
    line.frustumCulled = false;
    g11.add(line);
    parts.push({ mesh: m, vel: new THREE.Vector3(), active: false, q: -1, mm: 0.5, tPos, tGeo, tLen: 0 });
  }
  w11 = { arrows, parts, TRP, selected: null, partMats };
}
function launchParticle11() {
  const p = w11.parts.find((q) => !q.active);
  if (!p) return;
  const pt = PTYPE11[st11.ptype];
  p.active = true;
  p.q = pt.q;
  p.mm = pt.m;
  p.mesh.material = w11.partMats[st11.ptype];
  p.mesh.visible = true;
  p.mesh.position.set(-2.75, PLANE_Y, (Math.random() - 0.5) * 2.6);
  p.vel.set(1.4 + Math.random() * 0.6, 0, 0);
  p.tLen = 0;
  p.tGeo.setDrawRange(0, 0);
}
function clearSelection11() {
  if (w11.selected) w11.selected.ring.visible = false;
  w11.selected = null;
}
function selectCharge11(c) {
  clearSelection11();
  w11.selected = c;
  if (c && c.ring) c.ring.visible = true;
}
function addSandboxCharge(q) {
  if (cf2.charges.length >= 8) return false;
  let x, z, ok = false;
  for (let t = 0; t < 24 && !ok; t++) {
    x = (Math.random() - 0.5) * 3.6;
    z = (Math.random() - 0.5) * 3.2;
    ok = cf2.charges.every((c) => Math.hypot(c.mesh.position.x - x, c.mesh.position.z - z) > 0.75);
  }
  cf2.addCharge(q, x, z);
  cf2.force = true;
  return true;
}
function removeSelectedCharge11() {
  const c = w11.selected;
  if (!c) return;
  const idx = cf2.charges.indexOf(c);
  if (idx >= 0) cf2.charges.splice(idx, 1);
  c.mesh.traverse((o) => { if (o.isSprite) { o.material.map.dispose(); o.material.dispose(); } });
  const chargeGroup = cf2.grp.children[2];
  chargeGroup.remove(c.mesh);
  w11.selected = null;
  cf2.force = true;
}
function clearSandbox11() {
  clearSelection11();
  cf2.clearCharges();
  cf2.force = true;
  w11.parts.forEach((p) => { p.active = false; p.mesh.visible = false; p.tGeo.setDrawRange(0, 0); p.tLen = 0; });
}

/* ---------------- HUD 卡片 ---------------- */

const hudWrap = document.createElement('div');
hudWrap.className = 'lab-hud';
stage.appendChild(hudWrap);
function mkHud(rows) { const h = makeHUD(hudWrap, rows); h.el.style.display = 'none'; return h; }
const huds = [
  mkHud([['cfg', '配置'], ['lines', '每电荷场线'], ['drag', '电荷可拖动']]),
  mkHud([['f', '电场力 F=qE'], ['w', '做功 W=qEd'], ['ep', 'ΔEp=−W'], ['note', '移动方向']]),
  mkHud([['e', '场强 E'], ['u', '电压 U'], ['c', '电容 C=εrε₀S/d'], ['note', '规律']]),
  mkHud([['u1', '加速电压 U₁'], ['uy', '偏转电压 U₂'], ['dy', '竖直偏转量'], ['sw', '扫描']]),
  mkHud([['cfg', '装置'], ['dir', '磁感线方向'], ['note', '铁屑俯视']]),
  mkHud([['f', '安培力 F=BIL'], ['dir', '力的方向'], ['v', '导体棒速率']]),
  mkHud([['r', '半径 r=mv/qB'], ['t', '周期 T=2πm/qB'], ['pitch', '螺距 v∥·T'], ['st', '状态']]),
  mkHud([['r', 'C-12 偏转半径'], ['law', '分离规律'], ['st', '状态']]),
  mkHud([['t', '周期 T=2πm/qB'], ['n', '加速次数'], ['ek', '最终动能 Ek'], ['st', '状态']]),
  mkHud([['flux', '磁通变化'], ['emf', '感应电动势'], ['cur', '感应电流方向']]),
  mkHud([['em', '峰值 Em=NBSω'], ['f', '频率 f'], ['rms', '有效值 E=Em/√2'], ['e', '瞬时 e']]),
  mkHud([['n', '电荷数'], ['b', '外加磁场'], ['p', '粒子数']]),
];
const hudsRod = mkHud([['e', '电动势 E=BLv'], ['i', '感应电流 I=E/R'], ['fa', '安培力 F=B²L²v/R'], ['v', '速度 v / 收尾速度']]);
function showHud(i) {
  huds.forEach((h, j) => h.el.style.display = j === i ? '' : 'none');
  hudsRod.el.style.display = i === 'rod' ? '' : 'none';
}

/* ---------------- 帧循环 ---------------- */

let labReady = false;
const _m4f = new THREE.Matrix4();
const _zerof = new THREE.Matrix4().makeScale(1e-4, 1e-4, 1e-4);

app.onFrame((dt) => {
  if (!labReady) return;
  cameraTweenTick(app, dt);
  const time = performance.now() * 0.001;

  cf1.tick(time);
  cf5.tick(time);
  cf2.tick(time);

  /* 第 2 章：试探电荷移动动画 */
  if (g2.visible && st2.anim) {
    const a = st2.anim;
    a.t += dt / 1.3;
    const k = Math.min(a.t, 1);
    if (a.via) {
      // 折线两段：第一段沿等势面（W=0），第二段顺场线走 d
      if (k < 0.5) {
        w2.probe.position.lerpVectors(a.from, a.via, k / 0.5);
        a.W = 0;
      } else {
        const k2 = (k - 0.5) / 0.5;
        const e = k2 < 0.5 ? 2 * k2 * k2 : 1 - Math.pow(-2 * k2 + 2, 2) / 2;
        w2.probe.position.lerpVectors(a.via, a.to, e);
        a.W = a.q * a.E * e * a.d; // μC·kV/m·m = mJ
      }
    } else {
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      w2.probe.position.lerpVectors(a.from, a.to, e);
      const traveled = e * a.d;
      a.W = a.q * a.E * traveled; // μC·kV/m·m = mJ
    }
    a.done = k >= 1;
  }

  /* 第 4 章：示波管 */
  if (g4.visible) {
    const ctx = w4.scrCtx;
    ctx.fillStyle = 'rgba(4,20,10,0.20)';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(90,160,120,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 128); ctx.lineTo(256, 128);
    ctx.moveTo(128, 0); ctx.lineTo(128, 256);
    ctx.stroke();
    const t = time;
    const sx = st4.sweep ? ((t * 0.45) % 1) * 256 : 128;
    const sy = 128 - sig4(t) * 80;
    ctx.fillStyle = '#b6ffd6';
    ctx.shadowColor = '#6affa8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.6, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    w4.scrTex.needsUpdate = true;
    let i = 0;
    for (const d of w4.dots) {
      d.p += dt / 1.15;
      if (d.p >= 1) d.p -= 1;
      const z = -2.0 + d.p * 3.45;
      const tt = t - (1 - d.p) * 1.15;
      let y = 0, x = 0;
      if (d.p > 0.58) {
        const k2 = Math.min((d.p - 0.58) / 0.32, 1);
        y = sig4(tt) * 0.26 * k2;
        x = st4.sweep ? ((((t * 0.45) % 1) * 2 - 1) * 0.14) * k2 : 0;
      }
      _m4f.makeTranslation(x, PLANE_Y + y, z);
      w4.beamMesh.setMatrixAt(i++, _m4f);
    }
    w4.beamMesh.instanceMatrix.needsUpdate = true;
  }

  /* 第 6 章：导体棒安培力滑动 */
  if (g6.visible) {
    const F = st6.B * st6.I * st6.L;
    const dirSign = st6.dir > 0 ? -1 : 1; // B=−y：I=+x → F=−z；I 反向 → +z
    st6.v += dirSign * F * 0.4 * dt;
    st6.v = clamp(st6.v, -1.4, 1.4);
    st6.z += st6.v * dt;
    if (st6.z < -1.15) { st6.z = -1.15; if (st6.v < 0) st6.v = 0; }
    if (st6.z > 1.15) { st6.z = 1.15; if (st6.v > 0) st6.v = 0; }
    w6.rodG.position.z = st6.z;
  }

  /* 第 7 章：洛伦兹圆周运动（精确旋转，速率恒定） */
  if (g7.visible && st7.active) {
    const sub = 3;
    const omega = (0.9 * st7.q * st7.B) / st7.m;
    for (let s = 0; s < sub; s++) {
      const ang = -omega * dt / sub;
      st7.vel.applyAxisAngle(UPV, ang);
      st7.pos.addScaledVector(st7.vel, dt / sub);
    }
    w7.particle.position.copy(st7.pos);
    pushTrail7();
    if (Math.abs(st7.pos.x) > 1.55 || Math.abs(st7.pos.z) > 1.55 || Math.abs(st7.pos.y - PLANE_Y) > 0.55) st7.active = false;
  }

  /* 第 8 章：质谱仪离子飞行 */
  if (g8ms.visible) {
    st8.msTime += dt;
    for (const ion of w8ms.ions) {
      if (!ion.active && !ion.hit && st8.msTime >= ion.delay) {
        ion.active = true;
        ion.phi = 0;
        ion.mesh.visible = true;
        ion.mesh.position.set(-0.62, PLANE_Y, 0);
      }
      if (ion.active) {
        ion.phi += (ion.speed / ion.r) * dt;
        if (ion.phi >= Math.PI) {
          ion.phi = Math.PI;
          ion.active = false;
          ion.hit = true;
          ion.mesh.visible = false;
          const zHit = -2 * ion.r;
          const idx = w8ms.ions.indexOf(ion);
          const lbl = w8ms.labels[idx];
          lbl.visible = true;
          lbl.position.set(-0.62, PLANE_Y + 0.14, zHit - 0.22);
          w8ms.flash.visible = true;
          w8ms.flash.position.set(-0.62, PLANE_Y, zHit);
          w8ms.flashT = 0.001;
        } else {
          const cx = -0.62, cz = -ion.r;
          ion.mesh.position.set(cx + Math.sin(ion.phi) * ion.r, PLANE_Y, cz + Math.cos(ion.phi) * ion.r);
          if (ion.tLen < 140) {
            ion.tPos.set([ion.mesh.position.x, PLANE_Y, ion.mesh.position.z], ion.tLen * 3);
            ion.tLen++;
            ion.tGeo.attributes.position.needsUpdate = true;
            ion.tGeo.setDrawRange(0, ion.tLen);
          }
        }
      }
    }
    if (w8ms.flashT > 0) {
      w8ms.flashT += dt;
      const k = w8ms.flashT / 0.5;
      if (k >= 1) { w8ms.flash.visible = false; w8ms.flashT = -1; }
      else w8ms.flash.material.opacity = 0.85 * (1 - k);
    }
  }

  /* 第 8 章：回旋加速器 */
  if (g8cyc.visible && st8c.active) {
    const sub = 3;
    const omega = 2.2 * st8.B;
    for (let s = 0; s < sub; s++) {
      st8c.prevX = st8c.pos.x;
      st8c.vel.applyAxisAngle(UPV, -omega * dt / sub);
      st8c.pos.addScaledVector(st8c.vel, dt / sub);
      if (Math.abs(st8c.pos.x) < 0.14 && ((st8c.prevX > 0) !== (st8c.pos.x > 0))) {
        const sp = st8c.vel.length();
        st8c.vel.multiplyScalar(1 + 0.42 * (st8.U / 600) / (1 + sp / 2.4));
        st8c.crossings++;
        w8c.flashT = 0.14;
      }
    }
    w8c.particle.position.copy(st8c.pos);
    if (w8c.trailLen < TRAIL8) {
      w8c.trailPos.set([st8c.pos.x, st8c.pos.y, st8c.pos.z], w8c.trailLen * 3);
      w8c.trailLen++;
      w8c.trailGeo.attributes.position.needsUpdate = true;
      w8c.trailGeo.setDrawRange(0, w8c.trailLen);
    }
    if (st8c.vel.length() / omega > 1.05) {
      st8c.active = false;
    }
  }
  if (g8cyc.visible && w8c.flashT > 0) {
    w8c.flashT -= dt;
    w8c.gapFlash.material.opacity = Math.max(0, w8c.flashT / 0.14) * 0.75;
  } else if (g8cyc.visible) {
    w8c.gapFlash.material.opacity = 0;
  }

  /* 第 9 章：磁铁插拔 + 检流计 / 导体棒切割 */
  if (g9.visible && st9.mode === 'rod') {
    // 导体棒：恒定拉力 − 安培力（B²L²v/R）→ 收尾速度 v = FR/(B²L²)，E = BLv
    const Fa = (st9r.B * st9r.B * st9r.L * st9r.L * st9r.v) / st9r.R;
    const acc = (st9r.F - Fa) / 0.1;
    st9r.v = clamp(st9r.v + acc * dt, 0, 4);
    st9r.x += st9r.v * dt * 0.4;
    if (st9r.x > 1.0) { st9r.x = 1.0; st9r.v = 0; }
    w9r.rodG.position.x = st9r.x;
    hudsRod.set('e', (st9r.B * st9r.L * st9r.v).toFixed(3) + ' V');
    hudsRod.set('i', ((st9r.B * st9r.L * st9r.v) / st9r.R).toFixed(3) + ' A');
    hudsRod.set('fa', Fa.toFixed(3) + ' N（拉力 ' + st9r.F.toFixed(2) + ' N）');
    hudsRod.set('v', st9r.v.toFixed(2) + ' m/s → 收尾 ' + ((st9r.F * st9r.R) / (st9r.B * st9r.B * st9r.L * st9r.L)).toFixed(2) + ' m/s');
  } else if (g9.visible) {
    let vx = 0;
    if (st9.anim) {
      vx = st9.animDir * st9.speed * 0.85;
      st9.magX += vx * dt;
      if (st9.animDir < 0 && st9.magX <= 0.18) { st9.magX = 0.18; st9.anim = false; vx = 0; }
      if (st9.animDir > 0 && st9.magX >= 2.4) { st9.magX = 2.4; st9.anim = false; vx = 0; }
    }
    st9.emf = st9.anim ? emf9(vx) : st9.emf * Math.max(0, 1 - dt * 4);
    w9.magnet.position.set(st9.magX, PLANE_Y, 0);
    const needle = clamp(st9.emf / 900, -1, 1);
    st9.needle = needle;
    drawGalv(needle);
    const s = needle > 0.05 ? 1 : needle < -0.05 ? -1 : 0;
    if (st9.showArrows && s !== 0) {
      w9.curArrows.visible = true;
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU + 0.4;
        const cone = w9.curArrows.children[k];
        cone.position.set(0, Math.sin(a) * 0.46, Math.cos(a) * 0.46);
        _idv.set(0, -Math.sin(a) * s, Math.cos(a) * s);
        cone.quaternion.setFromUnitVectors(UPV, _idv);
      }
    } else {
      w9.curArrows.visible = false;
    }
  }

  /* 第 10 章：发电机 */
  if (g10.visible) {
    st10.theta += TAU * st10.n * dt;
    w10.coilG.rotation.z = st10.theta;
    const Em = st10.Nt * st10.B * 0.02 * TAU * st10.n;
    const e = Em * Math.sin(st10.theta);
    const eN = Em > 1e-6 ? e / Em : 0;
    w10.bulbMat.emissiveIntensity = st10.bulb ? Math.abs(eN) * 1.9 : 0;
    w10.bulbGlow.material.opacity = st10.bulb ? Math.abs(eN) * 0.85 : 0;
    drawWave(eN);
  }

  /* 第 11 章：沙盒粒子（F = qE + qv×B，半隐式积分） */
  if (g11.visible) {
    for (const p of w11.parts) {
      if (!p.active) continue;
      const list = cf2.charges.map((c) => ({ q: c.q, pos: { x: c.mesh.position.x, z: c.mesh.position.z } }));
      const sub = 3;
      for (let s = 0; s < sub; s++) {
        const ev = fieldVec2D(p.mesh.position.x, p.mesh.position.z, list);
        const ex = ev ? ev[0] * 0.45 : 0;
        const ez = ev ? ev[1] * 0.45 : 0;
        const B = st11.Bon ? st11.B : 0;
        const vx = p.vel.x, vz = p.vel.z;
        // a = (qE + qv×B)/m，电荷与质量按粒子类型取值
        const ax = (p.q * (ex - vz * B)) / p.mm;
        const az = (p.q * (ez + vx * B)) / p.mm;
        p.vel.x += ax * dt / sub;
        p.vel.z += az * dt / sub;
        p.mesh.position.x += p.vel.x * dt / sub;
        p.mesh.position.z += p.vel.z * dt / sub;
      }
      if (p.tLen < w11.TRP) {
        p.tPos.set([p.mesh.position.x, PLANE_Y, p.mesh.position.z], p.tLen * 3);
        p.tLen++;
        p.tGeo.attributes.position.needsUpdate = true;
        p.tGeo.setDrawRange(0, p.tLen);
      }
      if (Math.abs(p.mesh.position.x) > 3.3 || Math.abs(p.mesh.position.z) > 2.8) {
        p.active = false;
        p.mesh.visible = false;
      }
    }
  }

  /* HUD 刷新 */
  if (g1.visible) {
    huds[0].set('cfg', st1.cfg === 'single' ? '单个正电荷' : st1.cfg === 'pair-opp' ? '等量异号' : '等量同号');
    huds[0].set('lines', String(st1.lines) + ' 条');
    huds[0].set('drag', '按住电荷拖动');
  } else if (g2.visible) {
    const a = st2.anim;
    huds[1].set('f', (st2.q * st2.E).toFixed(1) + ' mN');
    huds[1].set('w', a ? a.W.toFixed(2) + ' mJ' : '点击「移动」');
    huds[1].set('ep', a ? '−' + a.W.toFixed(2) + ' mJ' : '−W');
    huds[1].set('note', st2.path === 'along' ? '顺着场线（直线）' : st2.path === 'against' ? '逆着场线' : st2.path === 'bent' ? '折线：先平移再顺场线' : '垂直场线');
  } else if (g3.visible) {
    huds[2].set('e', capE().toFixed(1) + ' V/mm');
    huds[2].set('u', capU().toFixed(0) + ' V');
    huds[2].set('c', capC().toFixed(2) + ' pF');
    huds[2].set('note', st3.mode === 'U'
      ? 'U 不变：d↑ → C↓、Q=CU↓、E=U/d↓'
      : 'Q 不变：d↑ → C↓、U=Q/C↑（静电计偏角大）、E 不变');
  } else if (g4.visible) {
    huds[3].set('u1', st4.U1.toFixed(1) + ' kV');
    huds[3].set('uy', (st4.Uy * st4.gain).toFixed(0) + ' %');
    huds[3].set('dy', (sig4(time) * 10).toFixed(1) + ' 格（∝U₂/U₁）');
    huds[3].set('sw', st4.sweep ? '开（正弦波形）' : '关（竖直亮线）');
  } else if (g5.visible) {
    huds[4].set('cfg', st5.cfg === 'single' ? '单条形磁铁' : st5.cfg === 'wire' ? '通电直导线（安培定则）' : '双磁铁同极相对');
    huds[4].set('dir', st5.cfg === 'wire' ? (st5.wireDir > 0 ? '逆时针（俯视）' : '顺时针（俯视）') : st5.flip ? '已翻转（N/S 互换）' : 'N 出 S 入');
    huds[4].set('note', st5.cfg === 'wire' ? 'B = μ₀I/(2πr) ∝ 1/r' : st5.filings ? '铁屑开（右下角）' : '铁屑关');
  } else if (g6.visible) {
    const F = st6.B * st6.I * st6.L;
    huds[5].set('f', F.toFixed(2) + ' N');
    huds[5].set('dir', F < 0.01 ? '—' : (st6.dir > 0 ? '−z 方向' : '+z 方向'));
    huds[5].set('v', Math.abs(st6.v).toFixed(2) + ' 格/s');
  } else if (g7.visible) {
    const w7om = (0.9 * st7.q * st7.B) / st7.m;
    const T7 = Math.abs(TAU / w7om);
    huds[6].set('r', ((st7.m * st7.v * Math.cos((st7.alpha * Math.PI) / 180)) / (Math.abs(st7.q) * st7.B)).toFixed(2) + '（相对）');
    huds[6].set('t', T7.toFixed(2) + '（相对，与 v 无关）');
    huds[6].set('pitch', st7.alpha > 0 ? (st7.v * Math.sin((st7.alpha * Math.PI) / 180) * T7).toFixed(2) : '—（α=0）');
    huds[6].set('st', st7.active ? (st7.alpha > 0 ? '螺旋线运动中' : '圆周运动中') : '已停止');
  } else if (g8ms.visible) {
    huds[7].set('r', msRadiusText());
    huds[7].set('law', 'r∝√m · √U · 1/B');
    huds[7].set('st', st8.msTime > 0 && st8.msTime < 3 ? '离子飞行中…' : '待发射');
  } else if (g8cyc.visible) {
    const mKg = 12 * 1.66e-27;
    const T = (TAU * mKg) / (1.6e-19 * st8.B) * 1e6;
    const Rcyc = 1.15 / 26;   // D 形盒视觉半径对应的物理半径（与离子轨迹缩放一致）
    const EkkeV = ((1.6e-19 * st8.B * Rcyc) ** 2) / (2 * mKg) / 1.6e-22;
    huds[8].set('t', T.toFixed(2) + ' μs（恒定）');
    huds[8].set('n', st8c.crossings + ' 次（n = Ek/qU）');
    huds[8].set('ek', EkkeV.toFixed(1) + ' keV（与 U 无关）');
    huds[8].set('st', st8c.active ? '螺旋加速中' : st8c.crossings > 0 ? '达到能量上限引出' : '待发射');
  } else if (g9.visible) {
    const nd = st9.needle || 0;
    huds[9].set('flux', st9.anim ? (st9.animDir < 0 ? '增大（插入）' : '减小（拔出）') : '不变（静止）');
    huds[9].set('emf', Math.abs(nd) < 0.02 ? '0' : (Math.abs(nd) * 100).toFixed(0) + '（相对）');
    huds[9].set('cur', Math.abs(nd) < 0.02 ? '无' : nd > 0 ? '正向（拔出）' : '反向（插入）');
  } else if (g10.visible) {
    const Em = st10.Nt * st10.B * 0.02 * TAU * st10.n;
    huds[10].set('em', Em.toFixed(1) + ' V');
    huds[10].set('f', st10.n.toFixed(1) + ' Hz');
    huds[10].set('rms', (Em / Math.SQRT2).toFixed(1) + ' V');
    huds[10].set('e', (Em * Math.sin(st10.theta)).toFixed(1) + ' V');
  } else if (g11.visible) {
    huds[11].set('n', cf2.charges.length + ' / 8');
    huds[11].set('b', st11.Bon ? '开 · B=' + st11.B.toFixed(1) : '关');
    huds[11].set('p', w11.parts.filter((p) => p.active).length + ' / 4');
  }
});

/* ---------------- 章节切换与控件 ---------------- */

const ctl = createControlsPanel(document.getElementById('controls'));
let activeSectionCleanup = null;

/* 第 9 章控件：按模式（磁铁插拔 / 导体棒切割）重建 */
function buildControls9() {
  ctl.clear();
  ctl.seg({
    options: [{ label: '磁铁插拔线圈', value: 'magnet' }, { label: '导体棒切割', value: 'rod' }],
    value: st9.mode,
    onChange: (v) => {
      st9.mode = v;
      applyMode9();
      if (v === 'rod') { st9r.v = 0; st9r.x = -0.7; w9r.rodG.position.x = -0.7; showHud('rod'); }
      else showHud(9);
      buildControls9();
    },
  });
  ctl.sep();
  if (st9.mode === 'magnet') {
    ctl.seg({
      options: [{ label: '插入', value: 'insert' }, { label: '拔出', value: 'pull' }, { label: '静止', value: 'still' }],
      value: 'still',
      onChange: (v) => {
        if (v === 'insert' && st9.magX <= 0.19) st9.magX = 2.4;
        if (v === 'pull' && st9.magX >= 2.39) st9.magX = 0.18;
        setAction9(v);
      },
    });
    ctl.sep();
    ctl.slider({
      label: '磁铁速度', min: 0.5, max: 3, step: 0.1, value: st9.speed,
      fmt: (v) => '×' + v.toFixed(1),
      onInput: (v) => { st9.speed = v; },
    });
    ctl.slider({
      label: '线圈匝数 N', min: 6, max: 18, step: 1, value: st9.N,
      fmt: (v) => v + ' 匝',
      onInput: (v) => { st9.N = v; applyCoilTurns(); },
    });
    ctl.toggle({
      label: '显示感应电流方向', value: st9.showArrows,
      onChange: (v) => { st9.showArrows = v; },
    });
  } else {
    ctl.slider({
      label: '拉力 F', min: 0.02, max: 0.4, step: 0.01, value: st9r.F,
      fmt: (v) => v.toFixed(2) + ' N',
      onInput: (v) => { st9r.F = v; },
    });
    ctl.slider({
      label: '磁感应强度 B', min: 0.2, max: 1, step: 0.05, value: st9r.B,
      fmt: (v) => v.toFixed(2) + ' T',
      onInput: (v) => { st9r.B = v; applyMode9(); },
    });
    ctl.slider({
      label: '导轨间距 L', min: 0.4, max: 1.2, step: 0.05, value: st9r.L,
      fmt: (v) => v.toFixed(2) + ' m',
      onInput: (v) => { st9r.L = v; },
    });
    ctl.slider({
      label: '回路电阻 R', min: 0.5, max: 5, step: 0.1, value: st9r.R,
      fmt: (v) => v.toFixed(1) + ' Ω',
      onInput: (v) => { st9r.R = v; },
    });
    ctl.sep();
    ctl.button({
      label: '↺ 复位导体棒',
      onClick: () => { st9r.v = 0; st9r.x = -0.7; w9r.rodG.position.x = -0.7; },
    });
  }
}

function hideAllChapters() {
  [g1, g2, g3, g4, g5, g6, g7, g8ms, g8cyc, g9, g10, g11].forEach((g) => { g.visible = false; });
  clearCorners();
  if (w5.filingsCv) w5.filingsCv = null;
  if (w9.galvCv) w9.galvCv = null;
  if (w10.waveCv) w10.waveCv = null;
  setHint(null);
  showHud(-1);
  dragField = null;
  onSelectCharge = null;
  st2.anim = null;
  st7.active = false;
  st8c.active = false;
}

const SECTIONS = [
  {
    title: '电场线与等势面',
    html: `<p><b>电场线</b>从正电荷出发、到负电荷终止（或伸向无穷远），<span class="hl">不闭合、不相交</span>；线的疏密表示场强强弱——电荷附近最密、场最强。点电荷场强 E = kQ/r²。</p>
<p>拖动任意电荷试试：电场线会实时重新计算。切换「等量异号 / 等量同号」对比场线形状：异号电荷的线<span class="hl">从一个直接连到另一个</span>，同号电荷的线<b>相互排斥</b>、中间出现「真空」区。</p>
<p><b>等势线</b>（蓝色）按合成电场的电势 φ = ΣkQ/r（标量直接相加）绘出，<span class="hl">处处与电场线垂直</span>；沿电场线方向电势降低，沿等势线移动电荷电场力不做功。异号电荷对的中垂线就是 φ=0 的等势线。</p>`,
    enter() {
      hideAllChapters();
      g1.visible = true;
      dragField = cf1;
      cf1.opts.showLines = true;
      cf1.opts.showEquip = false;
      setCfg1(st1.cfg);
      app.setCamera([0.4, 3.4, 4.4], [0, 1.05, 0]);
      showHud(0);
      ctl.clear();
      ctl.seg({
        options: [
          { label: '单个正电荷', value: 'single' },
          { label: '等量异号', value: 'pair-opp' },
          { label: '等量同号', value: 'pair-same' },
        ],
        value: st1.cfg,
        onChange: (v) => setCfg1(v),
      });
      ctl.sep();
      ctl.slider({
        label: '电荷量（场线密度）', min: 8, max: 20, step: 1, value: st1.lines,
        fmt: (v) => v + ' 条',
        onInput: (v) => {
          st1.lines = v;
          for (const c of cf1.charges) c.lines = v;
          cf1.dirty = true;
        },
      });
      ctl.toggle({
        label: '显示电场线', value: true,
        onChange: (v) => { cf1.opts.showLines = v; cf1.force = true; },
      });
      ctl.toggle({
        label: '显示等势面', value: false,
        onChange: (v) => { cf1.opts.showEquip = v; cf1.force = true; },
      });
    },
  },
  {
    title: '电场力做功与电势能',
    html: `<p>两块平行板间是<span class="hl">匀强电场</span>（箭头均匀、方向一致，E=U/d）。试探电荷（正）受恒定电场力 F=qE，电场力做功 <span class="hl">W=qU=qEd</span>。</p>
<p>关键性质：W <b>只与起点、终点有关，与路径无关</b>——和重力做功一样，所以才能定义电势能 E<sub>p</sub>=qφ：电场力做正功，电势能减少；做负功，电势能增加。选「折线路径」先沿等势面平移（W=0）再顺场线走，与直接走做功相同。</p>
<p>顺着场线 W＞0 电势能减小；逆着场线 W＜0 电势能增大；垂直场线 W=0（沿等势面移动）。点「移动」看动画，HUD 实时累计做功。</p>`,
    enter() {
      hideAllChapters();
      g2.visible = true;
      resetProbe();
      app.setCamera([1.6, 2.2, 3.6], [0, 1.05, 0]);
      showHud(1);
      ctl.clear();
      ctl.seg({
        options: [
          { label: '顺着场线', value: 'along' },
          { label: '逆着场线', value: 'against' },
          { label: '垂直场线', value: 'perp' },
          { label: '折线路径', value: 'bent' },
        ],
        value: st2.path,
        onChange: (v) => { st2.path = v; resetProbe(); },
      });
      ctl.sep();
      ctl.slider({
        label: '移动距离 d', min: 0.2, max: 1.6, step: 0.1, value: st2.d,
        fmt: (v) => v.toFixed(1) + ' m',
        onInput: (v) => { st2.d = v; if (!st2.anim) resetProbe(); },
      });
      ctl.slider({
        label: '电荷量 q', min: 0.5, max: 4, step: 0.1, value: st2.q,
        fmt: (v) => v.toFixed(1) + ' μC',
        onInput: (v) => { st2.q = v; },
      });
      ctl.slider({
        label: '场强 E', min: 1, max: 8, step: 0.5, value: st2.E,
        fmt: (v) => v.toFixed(1) + ' kV/m',
        onInput: (v) => { st2.E = v; },
      });
      ctl.sep();
      const moveBtn = ctl.button({
        label: '▶ 移动',
        onClick: () => {
          const s = probeStart();
          const to = (s.via ? s.via.clone() : s.p.clone()).addScaledVector(s.dir, st2.d);
          w2.probe.position.copy(s.p);
          st2.anim = { t: 0, from: s.p, to, via: s.via || null, W: 0, done: false };
        },
      });
      ctl.button({ label: '↺ 复位', onClick: () => resetProbe() });
      void moveBtn;
    },
  },
  {
    title: '平行板电容器',
    html: `<p>平行板电容器电容 <span class="hl">C = ε<sub>r</sub>ε<sub>0</sub>S / d</span>：正对面积 S 越大、板距 d 越小、插入介质（ε<sub>r</sub>↑）电容越大。C 只由构造决定，与是否带电无关。</p>
<p><b>充电后断开电源（Q 不变）</b>：由 U = Q/C，增大 d、减小 S 或抽出介质 → C 变小 → <b>U 变大（静电计偏角变大）</b>，而板间场强 E = Q/(ε<sub>r</sub>ε<sub>0</sub>S) <b>与 d 无关</b>。</p>
<p><b>始终接电源（U 不变）</b>：改变 d 时 Q = CU 和 E = U/d 都随之变化。两种模式切换对比；记录多组 (C, 1/d)，C–1/d 图像是一条过原点的直线。</p>`,
    enter() {
      hideAllChapters();
      g3.visible = true;
      applyCap();
      app.setCamera([2.2, 1.8, 3.2], [0, 1.05, 0]);
      showHud(2);
      ctl.clear();
      ctl.seg({
        options: [{ label: '接电源（U 不变）', value: 'U' }, { label: '充电后断开（Q 不变）', value: 'Q' }],
        value: st3.mode,
        onChange: (v) => { st3.mode = v; applyCap(); },
      });
      ctl.sep();
      ctl.slider({
        label: '电压 U（U 不变模式）', min: 0, max: 500, step: 10, value: st3.U,
        fmt: (v) => v.toFixed(0) + ' V',
        onInput: (v) => { st3.U = v; applyCap(); },
      });
      ctl.slider({
        label: '电荷量 Q（Q 不变模式）', min: 0.5, max: 5, step: 0.1, value: st3.Q,
        fmt: (v) => v.toFixed(1) + ' nC',
        onInput: (v) => { st3.Q = v; applyCap(); },
      });
      ctl.slider({
        label: '板距 d', min: 2, max: 20, step: 1, value: st3.d,
        fmt: (v) => v.toFixed(0) + ' mm',
        onInput: (v) => { st3.d = v; applyCap(); },
      });
      ctl.slider({
        label: '正对面积 S', min: 20, max: 200, step: 5, value: st3.S,
        fmt: (v) => v.toFixed(0) + ' cm²',
        onInput: (v) => { st3.S = v; applyCap(); },
      });
      ctl.seg({
        options: DIELECTRICS.map((dd) => ({ label: dd.name, value: dd.name })),
        value: '空气',
        onChange: (name) => { st3.eps = DIELECTRICS.find((dd) => dd.name === name).eps; applyCap(); },
      });
      ctl.toggle({
        label: '显示电场箭头', value: st3.show,
        onChange: (v) => { st3.show = v; applyCap(); },
      });
    },
  },
  {
    title: '示波管',
    html: `<p>阴极被灯丝加热发射电子，经加速电压 U₁ 加速（eU₁ = ½mv₀²），穿过 <b>YY′ 竖直偏转板</b>做<b>类平抛运动</b>，出板后匀速直线上屏——看起来像从偏转板中点沿直线射出。偏移量 <span class="hl">y = U₂L²/(4dU₁)</span>：与 U₂ 成正比、与 U₁ 成反比（偏转灵敏度 Y/U₂ ∝ 1/U₁）。</p>
<p><b>扫描开</b>：XX′ 板加锯齿扫描电压，光点从左到右匀速扫过，屏上画出<span class="hl">信号的正弦波形</span>——这就是示波器测电压的原理；<b>扫描关</b>：屏上是一条竖直亮线。</p>
<p>调 U₂ 看幅度、调 U₁ 看灵敏度、调频率看波形疏密。</p>`,
    enter() {
      hideAllChapters();
      g4.visible = true;
      app.setCamera([0.3, 1.7, 4.3], [0, 1.06, -0.3]);
      showHud(3);
      ctl.clear();
      ctl.slider({
        label: '加速电压 U₁', min: 0.5, max: 3, step: 0.1, value: st4.U1,
        fmt: (v) => v.toFixed(1) + ' kV',
        onInput: (v) => { st4.U1 = v; },
      });
      ctl.slider({
        label: '信号电压 U₂（幅度）', min: 0, max: 100, step: 5, value: st4.Uy,
        fmt: (v) => v.toFixed(0) + '%',
        onInput: (v) => { st4.Uy = v; },
      });
      ctl.slider({
        label: '信号频率', min: 0.3, max: 4, step: 0.1, value: st4.freq,
        fmt: (v) => v.toFixed(1) + ' Hz',
        onInput: (v) => { st4.freq = v; },
      });
      ctl.slider({
        label: '增益', min: 0.5, max: 3, step: 0.1, value: st4.gain,
        fmt: (v) => '×' + v.toFixed(1),
        onInput: (v) => { st4.gain = v; },
      });
      ctl.toggle({
        label: '扫描', value: st4.sweep,
        onChange: (v) => { st4.sweep = v; },
      });
      ctl.button({
        label: '↺ 清屏',
        onClick: () => { w4.scrCtx.fillStyle = '#04140a'; w4.scrCtx.fillRect(0, 0, 256, 256); },
      });
    },
  },
  {
    title: '磁感线',
    html: `<p>玻璃板上撒铁屑、轻敲，铁屑沿磁场方向排成曲线——这就是<b>磁感线</b>的显示方法。条形磁铁的磁感线从 N 极出来、回到 S 极（磁体内部从 S 到 N，构成<span class="hl">闭合曲线</span>）。</p>
<p>电流也能产生磁场（<b>奥斯特实验</b>）。<b>通电直导线</b>的磁感线是一圈圈同心圆，B = <span class="hl">μ₀I/(2πr) ∝ 1/r</span>，方向用<b>安培定则</b>（右手螺旋）判断：拇指指电流，四指环绕方向即磁感线方向。通电<b>螺线管</b>的外磁场与条形磁铁相似，内部近似匀强。切到「通电直导线」模式，反转电流方向看磁感线整体反向。</p>
<p>切换「双磁铁·同极相对」看中间的<span class="hl">排斥区</span>：两束磁感线互不相交、彼此推开。</p>`,
    enter() {
      hideAllChapters();
      g5.visible = true;
      applyMagnet();
      app.setCamera([0.3, 3.6, 3.6], [0, 1.0, 0]);
      showHud(4);
      ctl.clear();
      ctl.seg({
        options: [
          { label: '单磁铁', value: 'single' },
          { label: '双磁铁·同极相对', value: 'double' },
          { label: '通电直导线', value: 'wire' },
        ],
        value: st5.cfg,
        onChange: (v) => { st5.cfg = v; applyMagnet(); },
      });
      ctl.toggle({
        label: '磁极翻转（磁铁模式）', value: st5.flip,
        onChange: (v) => { st5.flip = v; applyMagnet(); },
      });
      ctl.toggle({
        label: '电流反向（直导线模式）', value: false,
        onChange: (v) => { st5.wireDir = v ? -1 : 1; applyMagnet(); },
      });
      ctl.toggle({
        label: '铁屑窗（俯视）', value: st5.filings,
        onChange: (v) => {
          st5.filings = v;
          if (!v && w5.filingsCv) { w5.filingsCv.win.remove(); w5.filingsCv = null; cornerWins.length = 0; }
          if (v) drawFilings();
        },
      });
      ctl.toggle({
        label: '显示磁感线', value: cf5.opts.showLines,
        onChange: (v) => { cf5.opts.showLines = v; cf5.force = true; },
      });
      setHint(['铁屑窗 = 俯视的磁场分布', '直导线模式：B ∝ 1/r，方向由安培定则确定']);
    },
  },
  {
    title: '安培力',
    html: `<p>磁场中的通电导体受<span class="hl">安培力 F=BIL</span>。蹄形磁铁 N 上 S 下（磁场竖直向下），导体棒电流沿棒流动——棒沿导轨滑动。</p>
<p><b>左手定则</b>：伸开左手，让磁场穿过掌心（掌心朝上），四指指向电流方向，拇指所指就是安培力方向。切换电流方向，棒立刻反向滑动。</p>
<p>调大 I、B、L 任一个，F 都变大、加速更猛。F=BIL 用国际单位制实时计算。</p>`,
    enter() {
      hideAllChapters();
      g6.visible = true;
      st6.z = 0; st6.v = 0;
      w6.rodG.position.z = 0;
      applyAmpereArrows();
      app.setCamera([1.7, 2.3, 3.4], [0, 1.05, 0]);
      showHud(5);
      setHint([
        '左手定则：磁场垂直穿入掌心（此处掌心朝上）',
        '四指指向电流方向（绿色箭头）',
        '拇指即安培力方向（棒的滑动方向）',
      ]);
      ctl.clear();
      ctl.slider({
        label: '电流 I', min: 0, max: 3, step: 0.1, value: st6.I,
        fmt: (v) => v.toFixed(1) + ' A',
        onInput: (v) => { st6.I = v; },
      });
      ctl.slider({
        label: '磁感应强度 B', min: 0.2, max: 1.5, step: 0.1, value: st6.B,
        fmt: (v) => v.toFixed(1) + ' T',
        onInput: (v) => { st6.B = v; applyAmpereArrows(); },
      });
      ctl.slider({
        label: '导体棒长度 L', min: 0.4, max: 1.2, step: 0.05, value: st6.L,
        fmt: (v) => v.toFixed(2) + ' m',
        onInput: (v) => { st6.L = v; applyAmpereArrows(); },
      });
      ctl.seg({
        options: [{ label: '电流 A→B', value: 'fwd' }, { label: '电流 B→A', value: 'rev' }],
        value: st6.dir > 0 ? 'fwd' : 'rev',
        onChange: (v) => {
          st6.dir = v === 'fwd' ? 1 : -1;
          st6.v = 0;
          applyAmpereArrows();
        },
      });
      ctl.sep();
      ctl.button({
        label: '↺ 复位导体棒',
        onClick: () => { st6.z = 0; st6.v = 0; },
      });
    },
  },
  {
    title: '洛伦兹力',
    html: `<p>磁场里的运动带电粒子受<span class="hl">洛伦兹力 F=qv×B</span>——它始终与速度垂直，<b>只改变方向、不做功</b>，所以粒子做匀速圆周运动。</p>
<p>半径 <b>r=mv/qB</b>：v 越大 r 越大，B 越强 r 越小；周期 <b>T=2πm/qB</b> 与 v 无关。切换电荷正负，旋转方向立刻相反（蓝箭头为竖直向上的匀强磁场）。</p>
<p>把「倾角 α」调大（电子枪不再垂直磁场射入）：平行于 B 的速度分量不受力，粒子一边做圆周运动一边沿磁场方向匀速前进——径迹变成<span class="hl">螺旋线</span>，螺距 = v<sub>∥</sub>·T。</p>
<p>点「发射」观察轨迹尾迹；粒子飞出场区说明 r 太大——调小 v 或增大 B。</p>`,
    enter() {
      hideAllChapters();
      g7.visible = true;
      st7.active = false;
      w7.trailLen = 0;
      w7.trailGeo.setDrawRange(0, 0);
      w7.particle.position.set(-0.9, PLANE_Y, 0);
      app.setCamera([0.2, 3.8, 3.0], [0, 1.0, 0]);
      showHud(6);
      ctl.clear();
      ctl.slider({
        label: '速率 v', min: 0.5, max: 3, step: 0.1, value: st7.v,
        fmt: (v) => v.toFixed(1),
        onInput: (v) => { st7.v = v; },
      });
      ctl.slider({
        label: '磁感应强度 B', min: 0.2, max: 1.5, step: 0.1, value: st7.B,
        fmt: (v) => v.toFixed(1) + ' T',
        onInput: (v) => { st7.B = v; },
      });
      ctl.slider({
        label: '质量 m', min: 0.5, max: 2, step: 0.1, value: st7.m,
        fmt: (v) => v.toFixed(1),
        onInput: (v) => { st7.m = v; },
      });
      ctl.slider({
        label: '电子枪倾角 α（0=垂直 B）', min: 0, max: 50, step: 5, value: st7.alpha,
        fmt: (v) => v.toFixed(0) + '°',
        onInput: (v) => { st7.alpha = v; },
      });
      ctl.seg({
        options: [{ label: '正电荷', value: 'pos' }, { label: '负电荷', value: 'neg' }],
        value: st7.q > 0 ? 'pos' : 'neg',
        onChange: (v) => { st7.q = v === 'pos' ? 1 : -1; },
      });
      ctl.sep();
      ctl.button({ label: '● 发射', onClick: () => launch7() });
      ctl.button({
        label: '↺ 清除轨迹',
        onClick: () => { w7.trailLen = 0; w7.trailGeo.setDrawRange(0, 0); },
      });
      setHint(['α=0：圆周运动；α>0：平行 B 的分量不受力 → 螺旋线']);
    },
  },
  {
    title: '质谱仪与回旋加速器',
    html: `<p><b>质谱仪</b>：离子经电压 U 加速（qU = ½mv²）后进入偏转磁场做半圆运动打在感光屏上：<span class="hl">r = mv/(qB) = √(2mU/q)/B</span>。电荷量相同的同位素质量越大半径越大，r₁:r₂ = √m₁:√m₂，按质荷比分成一条条<b>谱线</b>——阿斯顿就是这样发现了氖的同位素。</p>
<p><b>回旋加速器</b>：粒子每经过 D 形盒缝隙被加速一次，半径螺旋增大，但<span class="hl">周期 T=2πm/qB 恒定</span>（与速率无关），交变电压频率不用变。最终动能 <span class="hl">E<sub>k</sub> = q²B²R²/(2m)</span> 只取决于 B 和 D 形盒半径 R，<b>与加速电压 U 无关</b>——U 越大加速次数 n = E<sub>k</sub>/(qU) 越少，但最终能量一样。</p>
<p>调加速电压 U 与磁场 B，看两种装置里半径/圈数如何变化。</p>`,
    enter() {
      hideAllChapters();
      st8.mode = st8.mode || 'ms';
      const applyMode = (m) => {
        st8.mode = m;
        g8ms.visible = m === 'ms';
        g8cyc.visible = m === 'cyc';
        if (m === 'ms') {
          applyMSArrows();
          launchMS();
          app.setCamera([0.6, 2.6, 3.6], [0.3, 1.0, -0.7]);
        } else {
          app.setCamera([0.3, 3.6, 3.0], [0, 1.0, 0]);
        }
      };
      g8ms.visible = false; g8cyc.visible = false;
      applyMode(st8.mode);
      showHud(st8.mode === 'ms' ? 7 : 8);
      ctl.clear();
      ctl.seg({
        options: [{ label: '质谱仪', value: 'ms' }, { label: '回旋加速器', value: 'cyc' }],
        value: st8.mode,
        onChange: (v) => {
          applyMode(v);
          showHud(v === 'ms' ? 7 : 8);
        },
      });
      ctl.sep();
      ctl.slider({
        label: '加速电压 U', min: 200, max: 1200, step: 20, value: st8.U,
        fmt: (v) => v.toFixed(0) + ' V',
        onInput: (v) => {
          st8.U = v;
          if (st8.mode === 'ms') launchMS();
        },
      });
      ctl.slider({
        label: '磁场 B', min: 0.3, max: 1, step: 0.05, value: st8.B,
        fmt: (v) => v.toFixed(2) + ' T',
        onInput: (v) => {
          st8.B = v;
          if (st8.mode === 'ms') { applyMSArrows(); launchMS(); }
        },
      });
      ctl.sep();
      ctl.button({
        label: '● 发射',
        onClick: () => { if (st8.mode === 'ms') launchMS(); else launchCyc(); },
      });
    },
  },
  {
    title: '电磁感应与楞次定律',
    html: `<p>穿过闭合回路的<b>磁通量</b>发生变化，回路中就产生感应电流——<b>电磁感应</b>（法拉第）。感应电动势 <span class="hl">E = N·ΔΦ/Δt</span>：磁铁插入与拔出，检流计偏转方向相反；静止时磁通不变、无电流；插拔越快，偏转越大。</p>
<p><b>楞次定律</b>：感应电流的磁场总要<b>阻碍</b>磁通变化（增反减同，力学效果即「来拒去留」）——它是能量守恒的体现：插拔磁铁都要克服感应磁场力做功，机械能转化为电能。</p>
<p><b>导体棒切割</b>模式：棒在磁场中切割磁感线，<span class="hl">E = BLv</span>，感应电流使棒受到与运动方向相反的安培力 F = B²L²v/R；恒定拉力下棒最终<b>匀速</b>运动（收尾速度 v = FR/(B²L²)）。</p>`,
    enter() {
      hideAllChapters();
      g9.visible = true;
      st9.magX = 2.4;
      st9.anim = false;
      st9.emf = 0;
      w9.magnet.position.set(2.4, PLANE_Y, 0);
      applyCoilTurns();
      st9.mode = 'magnet';
      st9r.v = 0; st9r.x = -0.7;
      applyMode9();
      app.setCamera([2.4, 2.0, 3.4], [0.2, 1.05, 0]);
      showHud(9);
      setHint(['楞次定律口诀：增反减同 · 来拒去留']);
      buildControls9();
    },
  },
  {
    title: '交流发电机',
    html: `<p>矩形线圈在磁场中匀速转动，从中性面开始计时产生正弦交流电：<span class="hl">e = E<sub>m</sub>·sin ωt，E<sub>m</sub> = NBSω</span>。</p>
<p>线圈平面与磁场垂直的位置叫<b>中性面</b>：此时磁通<b>最大</b>但变化率为零——e=0、电流换向（每经过中性面一次，电流方向改变一次）；线圈平面与磁场平行时 e 最大。</p>
<p>正弦交流电的<b>有效值</b> E = E<sub>m</sub>/√2 ≈ 0.707E<sub>m</sub>：让交流与直流通过相同电阻、相同时间内发热相等——<b>交流电表读数、用电器铭牌电压都是有效值</b>。</p>
<p>右下角波形窗实时滚动 e(t)。调「转速 n」：转速加倍 → 频率 f=n 加倍、峰值 Em=NBSω 也加倍。灯泡亮度随 |e| 闪烁。</p>`,
    enter() {
      hideAllChapters();
      g10.visible = true;
      st10.theta = 0;
      applyGenArrows();
      app.setCamera([2.4, 2.0, 3.4], [0.2, 1.05, 0]);
      showHud(10);
      ctl.clear();
      ctl.slider({
        label: '转速 n', min: 0.3, max: 3, step: 0.1, value: st10.n,
        fmt: (v) => v.toFixed(1) + ' r/s',
        onInput: (v) => { st10.n = v; applyGenArrows(); },
      });
      ctl.slider({
        label: '磁感应强度 B', min: 0.3, max: 1.5, step: 0.1, value: st10.B,
        fmt: (v) => v.toFixed(1) + ' T',
        onInput: (v) => { st10.B = v; applyGenArrows(); },
      });
      ctl.slider({
        label: '匝数 N', min: 5, max: 20, step: 1, value: st10.Nt,
        fmt: (v) => v + ' 匝',
        onInput: (v) => { st10.Nt = v; },
      });
      ctl.toggle({
        label: '灯泡接入', value: st10.bulb,
        onChange: (v) => { st10.bulb = v; },
      });
    },
  },
  {
    title: '自由实验',
    html: `<p>电荷沙盒：<b>添加正/负电荷</b>（最多 8 个），<span class="hl">点击选中、按住拖动</span>，电场线实时重算；「删除选中」「清空」整理台面。试试让电子绕着正电荷转圈。</p>
<p>选择粒子类型（<b>电子 / 质子 / α 粒子</b>，电荷与质量不同）后「发射」：粒子在<span class="hl">合场</span>中按 F = qE + qv×B 运动（慢镜头）——开启匀强磁场后，质子在磁场里转半圈又回来，电子则反向打转。</p>
<p>粒子最多同时 4 个，飞出场区自动消失。</p>`,
    enter() {
      hideAllChapters();
      g11.visible = true;
      dragField = cf2;
      onSelectCharge = (c) => selectCharge11(c);
      cf2.opts.showLines = true;
      cf2.opts.showEquip = false;
      clearSelection11();
      cf2.clearCharges();
      w11.parts.forEach((p) => { p.active = false; p.mesh.visible = false; p.tGeo.setDrawRange(0, 0); p.tLen = 0; });
      cf2.addCharge(1, -1.1, 0);
      cf2.addCharge(-1, 1.1, 0);
      cf2.force = true;
      app.setCamera([0.3, 3.5, 4.2], [0, 1.05, 0]);
      showHud(11);
      setHint(['点击电荷可选中，按住拖动可移动', '粒子受 qE + qv×B 合力（蓝箭头=竖直磁场，慢放播放）']);
      ctl.clear();
      ctl.button({ label: '＋ 添加正电荷', onClick: () => { addSandboxCharge(1); } });
      ctl.button({ label: '－ 添加负电荷', onClick: () => { addSandboxCharge(-1); } });
      ctl.button({
        label: '🗑 删除选中',
        onClick: () => removeSelectedCharge11(),
      });
      ctl.button({ label: '✕ 清空电荷', onClick: () => clearSandbox11() });
      ctl.sep();
      ctl.seg({
        options: [{ label: '电子', value: 'electron' }, { label: '质子', value: 'proton' }, { label: 'α 粒子', value: 'alpha' }],
        value: st11.ptype,
        onChange: (v) => { st11.ptype = v; },
      });
      ctl.toggle({
        label: '匀强磁场（竖直）', value: st11.Bon,
        onChange: (v) => {
          st11.Bon = v;
          w11.arrows.forEach((a) => { a.visible = v; });
        },
      });
      ctl.slider({
        label: '磁感应强度 B', min: 0.3, max: 2, step: 0.1, value: st11.B,
        fmt: (v) => v.toFixed(1) + ' T',
        onInput: (v) => { st11.B = v; },
      });
      ctl.button({ label: '● 发射带电粒子', onClick: () => launchParticle11() });
    },
  },
  {
    title: '随堂检测',
    html: `<p>5 道选择题，覆盖电场线、左手定则、洛伦兹力、楞次定律与交流电。答完看成绩与解析。</p>`,
    enter() {
      hideAllChapters();
      app.setCamera([0.3, 3.2, 4.6], [0, 1.0, 0]);
      showHud(-1);
      ctl.clear();
      showQuiz();
    },
  },
];

/* ---------------- 随堂检测 ---------------- */

const QUIZ = [
  {
    q: '关于电场线，下列说法正确的是？',
    opts: ['电场线是闭合曲线', '电场线从正电荷出发，到负电荷终止', '两条电场线可以相交', '电场线越密的地方场强越小'],
    a: 1,
    ex: '电场线起于正电荷（或无穷远）、止于负电荷（或无穷远），不闭合、不相交；疏密表示场强强弱——越密场强越大。',
  },
  {
    q: '通电直导线电流水平向右，所在处磁场竖直向下，用左手定则判断安培力方向是？',
    opts: ['竖直向上', '竖直向下', '水平指向读者（垂直导线向外）', '水平指离读者（垂直导线向里）'],
    a: 3,
    ex: '左手摊平、掌心朝上接住向下的磁场，四指指向电流（向右），拇指即安培力方向——垂直导线指离读者（也可由 F=IL×B 验证：x̂×(−ŷ)=−ẑ，指向纸内）。',
  },
  {
    q: '带电粒子在匀强磁场中做匀速圆周运动，若速率 v 加倍（m、q、B 不变），半径 r 与周期 T 如何变化？',
    opts: ['r 加倍，T 不变', 'r 加倍，T 加倍', 'r 不变，T 加倍', 'r、T 都不变'],
    a: 0,
    ex: 'r=mv/qB，与 v 成正比，v 加倍则 r 加倍；T=2πm/qB 与 v 无关，保持不变——这也是回旋加速器能用固定频率交变电压的原因。',
  },
  {
    q: '把条形磁铁 N 极插入螺线管使磁通增大时，感应电流的磁场方向与插 入磁场方向的关系是？（楞次定律）',
    opts: ['相同，帮助磁通增大', '相反，阻碍磁通增大', '始终垂直于原磁场', '没有关系'],
    a: 1,
    ex: '楞次定律：感应电流的效果总是阻碍磁通变化——增大时感应磁场与原磁场反向（增反），减小时同向（减同）；从力学效果看即「来拒去留」。',
  },
  {
    q: '交流发电机转速从 n 变为 2n（B、N、S 不变），电动势最大值 Em 与频率 f 的变化是？',
    opts: ['Em 不变，f 加倍', 'Em 加倍，f 不变', 'Em、f 都加倍', 'Em、f 都不变'],
    a: 2,
    ex: 'ω=2πn 加倍 → Em=NBSω 加倍；f=ω/2π=n 也加倍。转速同时抬高峰值与频率。',
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
      <p style="color:var(--text-dim);margin:4px 0 18px">正确率 ${pct}%${pct >= 80 ? '，电场与磁场的要点你已经掌握了！' : pct >= 60 ? '，大部分概念已经清楚，回顾一下错题。' : '，建议回到前面章节再看一遍哦。'}</p>`;
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
    row.appendChild(back); row.appendChild(again);
    card.appendChild(row);
    panel.appendChild(card);
  }

  renderQ();
  activeSectionCleanup = () => panel.remove();
}

/* ---------------- 启动 ---------------- */

const skyHdr = '../assets/textures/sky/sky_court-BLHJ2ADI.hdr';
const skyWebp = '../assets/textures/sky/sky_court-BKHrsJQE.webp';

loadAll([
  { key: 'sky', label: '环境光', job: loadHDR(skyHdr) },
  { key: 'skyBg', label: '背景', job: loadTexture(skyWebp) },
], (d, t, label) => loader.setText(`正在加载 ${d}/${t}（${label}）`)).then((t) => {
  scene.environment = t.sky;
  t.skyBg.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = t.skyBg;

  buildWorld();
  buildWork();
  buildCap();
  buildScope();
  buildMagnet();
  buildAmpere();
  buildLorentz();
  buildMS();
  buildCyc();
  buildInduction();
  buildGenerator();
  buildSandbox();
  labReady = true;

  loader.hide();
  const sections = createSections({
    nav: document.getElementById('sideNav'),
    descPanel: document.getElementById('descPanel'),
    sections: SECTIONS,
    onSelect(i, sec) {
      if (activeSectionCleanup) { activeSectionCleanup(); activeSectionCleanup = null; }
      sec.enter();
    },
  });
  window.__eduSections = sections;
  sections.select(0);
}).catch((err) => {
  loader.setText('资源加载失败：' + err.message);
  console.error(err);
});
