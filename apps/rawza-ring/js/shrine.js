import * as THREE from 'three';
import { canvasTexture, mergeGeoms, orientOutsideRight, triangulate, rng } from './util.js';

// The shrine precinct. Its outline is the real perimeter footway that runs
// round the shrine park (OSM way/140234718); the paved courtyard is traced
// from the real footway nodes around the mosque; the gates stand where real
// paths cross the perimeter.
export function precinctInfo(map) {
  const ring = map.roads.find((r) => r.id === 'way/140234718');
  let wall;
  if (ring) {
    const p = ring.pts;
    const closed = Math.hypot(p[0] - p[p.length - 2], p[1] - p[p.length - 1]) < 0.5;
    wall = orientOutsideRight(Float32Array.from(closed ? p.slice(0, p.length - 2) : p));
  } else {
    wall = orientOutsideRight(new Float32Array([-179, -94, 168, -162, 242, 194, -104, 269]));
  }
  const plaza = new Float32Array([-49, 3, 4, -6, 55, -16, 89, -21, 115, 0, 123, 52, 131, 104, 95, 111, 68, 116, 61, 127, 29, 133, -23, 143, -57, 22]);
  const gates = [[-6, -128], [209.5, 37], [42, 237], [-143.5, 79.5]];
  return { wall, plaza, gates };
}

function scaleUV(g, su, sv) {
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  return g;
}

function domeGeo(R, seg = 20) {
  const pts = [];
  const t0 = -0.38;
  for (let i = 0; i <= 18; i++) {
    const t = t0 + (Math.PI / 2 - t0) * (i / 18);
    const s = Math.max(0, Math.sin(t));
    pts.push(new THREE.Vector2(Math.max(0.001, R * Math.cos(t)), R * ((Math.sin(t) - Math.sin(t0)) * 1.02 + 0.2 * s ** 8)));
  }
  return new THREE.LatheGeometry(pts, seg);
}

function star(g, x, y, r, fill, stroke) {
  g.beginPath();
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, rr = k % 2 ? r * 0.62 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fillStyle = fill; g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1.2; g.stroke(); }
}

function drawMosaic(g, w, h, cell = 32) {
  g.fillStyle = '#1c4fa3'; g.fillRect(0, 0, w, h);
  for (let y = 0; y <= h; y += cell) for (let x = 0; x <= w; x += cell) {
    star(g, x, y, cell * 0.42, '#27b4c6', '#eaf6ff');
    star(g, x, y, cell * 0.16, '#f2c94c');
    star(g, x + cell / 2, y + cell / 2, cell * 0.24, '#f4f8ff', '#0e2f6e');
    g.fillStyle = '#0f3a86';
    g.fillRect(x + cell / 2 - 1.5, y - 1.5, 3, 3);
    g.fillRect(x - 1.5, y + cell / 2 - 1.5, 3, 3);
  }
}

function archPath(g, x0, x1, yBase, ySpring, yApex) {
  const xm = (x0 + x1) / 2;
  g.beginPath();
  g.moveTo(x0, yBase);
  g.lineTo(x0, ySpring);
  g.quadraticCurveTo(x0, (ySpring + yApex) / 2 - 10, xm, yApex);
  g.quadraticCurveTo(x1, (ySpring + yApex) / 2 - 10, x1, ySpring);
  g.lineTo(x1, yBase);
  g.closePath();
}

function script(g, x0, x1, y, amp, r) {
  g.strokeStyle = '#f6fbff'; g.lineWidth = 2.2; g.lineCap = 'round';
  for (let x = x0; x < x1; x += 13) {
    g.beginPath();
    g.moveTo(x, y + (r() - 0.5) * amp);
    g.bezierCurveTo(x + 4, y - amp * r(), x + 8, y + amp * r(), x + 11, y + (r() - 0.5) * amp);
    g.stroke();
    if (r() < 0.4) { g.beginPath(); g.moveTo(x + 5, y - amp); g.lineTo(x + 5, y + amp * 0.4); g.stroke(); }
  }
}

export function buildShrine(scene, map, colliders, info) {
  const S = map.shrine;
  const r = rng(786);
  const out = { center: new THREE.Vector3(S.c[0], 0, S.c[1]) };

  // ------------------------------------------------------------ textures
  const mosaic = canvasTexture(256, 256, (g, w, h) => drawMosaic(g, w, h, 32), { aniso: 8 });
  const arcade = canvasTexture(256, 512, (g, w, h) => {
    drawMosaic(g, w, h, 32);
    g.fillStyle = '#27b0c2'; g.fillRect(0, 16, w, 58);
    g.fillStyle = '#f2c94c'; g.fillRect(0, 14, w, 4); g.fillRect(0, 72, w, 4);
    script(g, 6, w - 6, 45, 14, r);
    archPath(g, 44, 212, 470, 250, 112);
    const gr = g.createLinearGradient(0, 110, 0, 470);
    gr.addColorStop(0, '#12397f'); gr.addColorStop(1, '#0a2050');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = '#2ec4d6'; g.lineWidth = 10; g.stroke();
    g.strokeStyle = '#f4fbff'; g.lineWidth = 2.5; g.stroke();
    archPath(g, 78, 178, 470, 300, 200);
    g.fillStyle = '#071634'; g.fill();
    g.strokeStyle = '#f2c94c'; g.lineWidth = 3; g.stroke();
    g.strokeStyle = 'rgba(70,170,220,0.7)'; g.lineWidth = 1.5;
    for (let y = 300; y < 470; y += 17) { g.beginPath(); g.moveTo(84, y); g.lineTo(172, y); g.stroke(); }
    for (let x = 92; x < 172; x += 16) { g.beginPath(); g.moveTo(x, 262); g.lineTo(x, 470); g.stroke(); }
    g.fillStyle = '#efe7d6'; g.fillRect(0, 470, w, 42);
    g.fillStyle = '#b9ae98'; g.fillRect(0, 470, w, 3);
  }, { aniso: 8 });
  const iwan = canvasTexture(512, 512, (g, w, h) => {
    drawMosaic(g, w, h, 32);
    g.fillStyle = '#27b0c2'; g.fillRect(40, 30, w - 80, 62);
    script(g, 52, w - 52, 61, 16, r);
    g.strokeStyle = '#f2c94c'; g.lineWidth = 5; g.strokeRect(40, 30, w - 80, 62);
    g.strokeRect(14, 12, w - 28, h - 24);
    archPath(g, 86, 426, 512, 300, 122);
    const gr = g.createLinearGradient(0, 120, 0, 512);
    gr.addColorStop(0, '#16449a'); gr.addColorStop(0.6, '#0b2659'); gr.addColorStop(1, '#06132e');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = '#2ec4d6'; g.lineWidth = 16; g.stroke();
    g.strokeStyle = '#f4fbff'; g.lineWidth = 3; g.stroke();
    archPath(g, 186, 326, 512, 400, 330);
    g.fillStyle = '#030a18'; g.fill();
    g.strokeStyle = '#f2c94c'; g.lineWidth = 4; g.stroke();
    for (let k = 0; k < 5; k++) star(g, 256 + (k - 2) * 62, 250 + Math.abs(k - 2) * 26, 16, '#27b4c6', '#f6fbff');
  }, { aniso: 8, clamp: true });
  const domeTex = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#25b2c6'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      const gr = g.createLinearGradient(x, 0, x + 32, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(0.5, 'rgba(0,60,90,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0.22)');
      g.fillStyle = gr; g.fillRect(x, 0, 32, h);
    }
    for (let y = 8; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) {
      g.fillStyle = 'rgba(18,80,150,0.35)';
      g.fillRect(x, y, 3, 3);
    }
    g.fillStyle = '#1c4fa3'; g.fillRect(0, h - 22, w, 22);
    g.fillStyle = '#f2c94c'; g.fillRect(0, h - 24, w, 3);
  }, { aniso: 8 });
  const marble = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#f1ebe0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(150,150,165,${0.05 + r() * 0.1})`;
      g.beginPath();
      let x = r() * w, y = r() * h;
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); }
      g.stroke();
    }
    g.strokeStyle = 'rgba(120,110,100,0.45)'; g.lineWidth = 1.5;
    for (let i = 0; i <= 2; i++) {
      g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke();
      g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke();
    }
    for (let y = 0; y <= h; y += 128) for (let x = 0; x <= w; x += 128) star(g, x, y, 12, '#2a6fbe', '#f6fbff');
    star(g, 64, 64, 7, '#27b4c6'); star(g, 192, 192, 7, '#27b4c6');
  }, { aniso: 8 });
  const panel = canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = '#f0e9da'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1c4fa3'; g.fillRect(0, 0, w, 22);
    g.fillStyle = '#27b0c2'; g.fillRect(0, 22, w, 6);
    for (let x = 16; x < w; x += 32) star(g, x, 11, 8, '#27b4c6', '#f6fbff');
    archPath(g, 78, 178, 122, 70, 36);
    g.fillStyle = '#1e56ac'; g.fill();
    g.strokeStyle = '#27b0c2'; g.lineWidth = 5; g.stroke();
    star(g, 128, 86, 14, '#27b4c6', '#f6fbff');
    g.fillStyle = '#c9bfa9'; g.fillRect(0, 122, w, 6);
  }, { aniso: 8 });

  const tile = (m) => new THREE.MeshStandardMaterial({ map: m, roughness: 0.5, metalness: 0.05, emissive: 0xffffff, emissiveMap: m, emissiveIntensity: 0.3 });
  const mats = {
    mosaic: tile(mosaic), arcade: tile(arcade), iwan: tile(iwan), panel: tile(panel),
    dome: new THREE.MeshStandardMaterial({ map: domeTex, roughness: 0.28, metalness: 0.15, emissive: 0xffffff, emissiveMap: domeTex, emissiveIntensity: 0.34 }),
    stone: new THREE.MeshLambertMaterial({ color: 0xf1e9d8 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xf2c14a, roughness: 0.3, metalness: 0.9, emissive: 0x7a5a10, emissiveIntensity: 0.6 }),
  };
  mats.panel.emissiveIntensity = 0.18;
  const parts = { mosaic: [], arcade: [], iwan: [], panel: [], dome: [], stone: [], gold: [] };
  const T = new THREE.Matrix4();
  const put = (key, geo, frame, x, y, z, ry = 0) => {
    const m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
    parts[key].push({ geometry: geo, matrix: T.clone().copy(frame).multiply(m) });
  };

  function minaret(frame, x, z, H, rad) {
    const hs = H * 0.78;
    put('mosaic', scaleUV(new THREE.CylinderGeometry(rad * 0.8, rad, hs, 14), 4, Math.round(hs / (rad * 1.6))), frame, x, hs / 2, z);
    put('stone', new THREE.CylinderGeometry(rad * 1.55, rad * 1.0, 0.9, 14), frame, x, hs + 0.45, z);
    put('stone', new THREE.CylinderGeometry(rad * 1.6, rad * 1.6, 0.35, 14), frame, x, hs + 1.05, z);
    const hl = H * 0.13;
    put('mosaic', scaleUV(new THREE.CylinderGeometry(rad * 0.6, rad * 0.64, hl, 12), 3, 1), frame, x, hs + 1.2 + hl / 2, z);
    put('dome', scaleUV(domeGeo(rad * 0.86, 14), 8, 1), frame, x, hs + 1.2 + hl, z);
    const top = hs + 1.2 + hl + rad * 0.86 * 1.6;
    put('gold', new THREE.CylinderGeometry(0.05, 0.09, 1.6, 6), frame, x, top + 0.5, z);
    put('gold', new THREE.SphereGeometry(0.22, 8, 6), frame, x, top + 0.9, z);
  }
  function portal(frame, x, z, ry, W, H, D) {
    put('mosaic', scaleUV(new THREE.BoxGeometry(W, H, D), W / 8, H / 8), frame, x, H / 2, z, ry);
    for (const s of [1, -1]) {
      const m = new THREE.Matrix4().makeRotationY(ry).setPosition(x, H / 2, z)
        .multiply(new THREE.Matrix4().makeRotationY(s > 0 ? 0 : Math.PI).setPosition(0, 0, 0))
        .multiply(new THREE.Matrix4().makeTranslation(0, 0, D / 2 + 0.03));
      parts.iwan.push({ geometry: new THREE.PlaneGeometry(W, H), matrix: frame.clone().multiply(m) });
    }
    put('stone', new THREE.BoxGeometry(W + 0.5, 0.5, D + 0.5), frame, x, H + 0.25, z, ry);
  }

  // ------------------------------------------------- main building (real footprint)
  const H = 11.5;
  {
    const p = orientOutsideRight(S.pts);
    const n = p.length / 2;
    const pos = [], nor = [], uv = [], idx = [];
    let u = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ax = p[2 * i], az = p[2 * i + 1], bx = p[2 * j], bz = p[2 * j + 1];
      const len = Math.hypot(bx - ax, bz - az) || 1;
      const nx = -(bz - az) / len, nz = (bx - ax) / len;
      const b = pos.length / 3;
      pos.push(ax, 0, az, bx, 0, bz, bx, H, bz, ax, H, az);
      for (let k = 0; k < 4; k++) nor.push(nx, 0, nz);
      const bays = Math.max(1, Math.round(len / 6.5));
      uv.push(u, 0, u + bays, 0, u + bays, 1, u, 1);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    parts.arcade.push({ geometry: g });

    const rp = [], rn = [], ruv = [];
    const tri = triangulate(p);
    for (const t of tri) { rp.push(p[2 * t], H, p[2 * t + 1]); rn.push(0, 1, 0); ruv.push(0, 0); }
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
    rg.setAttribute('normal', new THREE.Float32BufferAttribute(rn, 3));
    rg.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2));
    parts.stone.push({ geometry: rg });
    colliders.addPolygon(p);
  }

  // ornaments in the building's own frame (x = long axis)
  const frame = new THREE.Matrix4().makeRotationY(-S.angle).setPosition(S.c[0], 0, S.c[1]);
  const L = S.len / 2, W = S.wid / 2;
  for (const [x, rad] of [[-12.5, 8.6], [12.5, 7.4]]) {
    put('mosaic', scaleUV(new THREE.CylinderGeometry(rad * 0.93, rad * 0.97, 6.5, 24), 12, 1), frame, x, H + 3.25, 0);
    put('stone', new THREE.CylinderGeometry(rad * 1.02, rad * 1.02, 0.5, 24), frame, x, H + 6.6, 0);
    put('dome', scaleUV(domeGeo(rad, 28), 16, 1), frame, x, H + 6.8, 0);
    const top = H + 6.8 + rad * 1.62;
    put('gold', new THREE.CylinderGeometry(0.1, 0.22, 3.2, 8), frame, x, top + 1.2, 0);
    put('gold', new THREE.SphereGeometry(0.55, 10, 8), frame, x, top + 1.0, 0);
    put('gold', new THREE.SphereGeometry(0.34, 10, 8), frame, x, top + 2.1, 0);
  }
  portal(frame, 0, W - 0.6, 0, 15, 17, 3.6);
  portal(frame, 0, -W + 0.6, 0, 15, 17, 3.6);
  portal(frame, L - 0.6, 0, Math.PI / 2, 13, 15.5, 3.6);
  portal(frame, -L + 0.6, 0, Math.PI / 2, 13, 15.5, 3.6);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) minaret(frame, sx * (L + 1.5), sz * (W + 1.5), 34, 1.75);
  for (const [x, z] of [[-L * 0.55, W - 1.5], [L * 0.55, W - 1.5], [-L * 0.55, -W + 1.5], [L * 0.55, -W + 1.5], [L - 2, W * 0.55], [L - 2, -W * 0.55], [-L + 2, W * 0.55], [-L + 2, -W * 0.55]]) {
    put('mosaic', scaleUV(new THREE.CylinderGeometry(1.35, 1.35, 2.6, 10), 3, 1), frame, x, H + 1.3, z);
    put('dome', scaleUV(domeGeo(1.5, 12), 8, 1), frame, x, H + 2.6, z);
  }

  // ------------------------------------------------- paved courtyard
  {
    const p = info.plaza;
    const pos = [], nor = [], uv = [];
    for (const t of triangulate(p)) { pos.push(p[2 * t], 0.16, p[2 * t + 1]); nor.push(0, 1, 0); uv.push(p[2 * t] * 0.11, p[2 * t + 1] * 0.11); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: marble, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -12 }));
    m.receiveShadow = true;
    scene.add(m);
  }

  // ------------------------------------------------- precinct wall + gates
  {
    const p = info.wall;
    const n = p.length / 2;
    const WH = 1.75, TH = 0.5;
    const pos = [], nor = [], uv = [], idx = [];
    const ident = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ax = p[2 * i], az = p[2 * i + 1], bx = p[2 * j], bz = p[2 * j + 1];
      const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1;
      const nx = -dz / len, nz = dx / len;
      const reps = Math.max(1, Math.round(len / 3.6));
      const face = (ox, oz, sx, sz, flip) => {
        const b = pos.length / 3;
        const x0 = ax + ox, z0 = az + oz, x1 = bx + ox, z1 = bz + oz;
        pos.push(x0, 0, z0, x1, 0, z1, x1, WH, z1, x0, WH, z0);
        for (let k = 0; k < 4; k++) nor.push(sx, 0, sz);
        uv.push(0, 0, reps, 0, reps, 1, 0, 1);
        if (flip) idx.push(b, b + 2, b + 1, b, b + 3, b + 2); else idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      };
      face(0, 0, nx, nz, false);
      face(-nx * TH, -nz * TH, -nx, -nz, true);
      const b = pos.length / 3;
      pos.push(ax, WH, az, bx, WH, bz, bx - nx * TH, WH, bz - nz * TH, ax - nx * TH, WH, az - nz * TH);
      for (let k = 0; k < 4; k++) nor.push(0, 1, 0);
      uv.push(0, 0.9, 1, 0.9, 1, 0.98, 0, 0.98);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      const posts = Math.max(1, Math.round(len / 18));
      for (let k = 0; k < posts; k++) {
        const t = k / posts;
        const x = ax + dx * t - nx * TH / 2, z = az + dz * t - nz * TH / 2;
        put('mosaic', scaleUV(new THREE.BoxGeometry(0.95, 2.5, 0.95), 0.25, 0.6), ident, x, 1.25, z, -Math.atan2(dz, dx));
        put('dome', new THREE.SphereGeometry(0.62, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.3, 1), ident, x, 2.5, z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    parts.panel.push({ geometry: g });
    colliders.addPolygon(p);

    for (const [gx, gz] of info.gates) {
      // direction of the nearest wall edge
      let best = 1e9, ang = 0;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const ax = p[2 * i], az = p[2 * i + 1], dx = p[2 * j] - ax, dz = p[2 * j + 1] - az;
        const t = Math.max(0, Math.min(1, ((gx - ax) * dx + (gz - az) * dz) / (dx * dx + dz * dz)));
        const d = Math.hypot(gx - ax - dx * t, gz - az - dz * t);
        if (d < best) { best = d; ang = Math.atan2(dz, dx); }
      }
      const gf = new THREE.Matrix4().makeRotationY(-ang).setPosition(gx, 0, gz);
      // local +z points out of the precinct: set the gate back so it stays off the road
      portal(gf, 0, -1.9, 0, 12, 13, 3.6);
      minaret(gf, -8.2, -1.9, 20, 1.2);
      minaret(gf, 8.2, -1.9, 20, 1.2);
    }
  }

  for (const key of Object.keys(parts)) {
    if (!parts[key].length) continue;
    const m = new THREE.Mesh(mergeGeoms(parts[key]), mats[key]);
    m.castShadow = true;
    m.receiveShadow = true;
    m.matrixAutoUpdate = false;
    scene.add(m);
  }
  out.height = H + 6.8 + 8.6 * 1.62 + 3;
  return out;
}
