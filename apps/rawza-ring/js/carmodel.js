import * as THREE from 'three';
import { canvasTexture } from './util.js';

let shared = null;
function sharedParts() {
  if (shared) return shared;
  const prof = (pts) => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    return s;
  };
  const body = new THREE.ExtrudeGeometry(prof([
    [-2.15, 0.3], [-2.2, 0.64], [-2.04, 0.88], [-1.2, 0.93], [0.78, 0.9], [1.72, 0.76], [2.17, 0.62], [2.2, 0.36], [1.9, 0.24], [-1.9, 0.24],
  ]), { depth: 1.72, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 1 }).translate(0, 0, -0.86);
  const cabin = new THREE.ExtrudeGeometry(prof([[-1.42, 0.9], [-0.98, 1.3], [0.16, 1.33], [0.9, 0.9]]),
    { depth: 1.42, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1, curveSegments: 1 }).translate(0, 0, -0.71);
  const roof = new THREE.BoxGeometry(1.12, 0.05, 1.36).translate(-0.42, 1.345, 0);
  const wing = new THREE.BoxGeometry(0.34, 0.05, 1.7).translate(-2.0, 1.1, 0);
  const wingPost = new THREE.BoxGeometry(0.12, 0.2, 0.08);
  const tyre = new THREE.CylinderGeometry(0.35, 0.35, 0.27, 18).rotateX(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(0.21, 0.21, 0.29, 10).rotateX(Math.PI / 2);
  const blob = canvasTexture(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32);
    gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }, { clamp: true });
  shared = {
    body, cabin, roof, wing, wingPost, tyre, rim,
    glass: new THREE.MeshStandardMaterial({ color: 0x10161f, roughness: 0.12, metalness: 0.6 }),
    tyreMat: new THREE.MeshLambertMaterial({ color: 0x18181a }),
    rimMat: new THREE.MeshStandardMaterial({ color: 0xc9ccd2, roughness: 0.35, metalness: 0.8 }),
    dark: new THREE.MeshLambertMaterial({ color: 0x15171b }),
    headMat: new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.7, 2.0) }),
    head: new THREE.BoxGeometry(0.06, 0.11, 0.38),
    tail: new THREE.BoxGeometry(0.06, 0.1, 0.46),
    blobMat: new THREE.MeshBasicMaterial({ map: blob, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -20 }),
    blobGeo: new THREE.PlaneGeometry(5.6, 3.0).rotateX(-Math.PI / 2),
  };
  return shared;
}

// A low-poly coupe. Local axes: +x forward, +y up.
export function buildCar(color) {
  const S = sharedParts();
  const group = new THREE.Group();
  const tilt = new THREE.Group();
  group.add(tilt);
  const paint = new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.35, envMapIntensity: 0.7 });
  const add = (geo, mat, parent = tilt) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  add(S.body, paint);
  add(S.cabin, S.glass);
  add(S.roof, paint);
  add(S.wing, paint);
  for (const s of [-1, 1]) {
    add(S.wingPost, S.dark).position.set(-2.0, 0.98, s * 0.6);
    const h = add(S.head, S.headMat);
    h.position.set(2.19, 0.6, s * 0.6);
    h.castShadow = false;
  }
  const brakeMat = new THREE.MeshBasicMaterial({ color: 0x551010 });
  for (const s of [-1, 1]) {
    const t = add(S.tail, brakeMat);
    t.position.set(-2.2, 0.7, s * 0.58);
    t.castShadow = false;
  }
  const wheels = [];
  for (const [x, z] of [[1.34, 0.84], [1.34, -0.84], [-1.3, 0.84], [-1.3, -0.84]]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.35, z);
    const spin = new THREE.Group();
    pivot.add(spin);
    add(S.tyre, S.tyreMat, spin);
    add(S.rim, S.rimMat, spin).castShadow = false;
    const spoke = add(new THREE.BoxGeometry(0.4, 0.07, 0.3), S.dark, spin);
    spoke.castShadow = false;
    group.add(pivot);
    wheels.push({ pivot, spin });
  }
  const blob = new THREE.Mesh(S.blobGeo, S.blobMat);
  blob.position.y = 0.03;
  blob.renderOrder = 2;
  group.add(blob);
  return { group, tilt, wheels, brakeMat, paint };
}
