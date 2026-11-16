import * as THREE from 'three';
import { rng, pointInPoly } from './util.js';

// The white pigeons of the shrine: flocks wheeling over the domes, and groups
// on the ground (courtyard and roadside) that take off when a car comes close.
export class Birds {
  constructor(scene, track, map, precinct) {
    const R = rng(1418);
    const birds = this.birds = [];
    this.center = { x: map.shrine.c[0], z: map.shrine.c[1] };

    // flocks in the air
    this.flocks = [];
    // the outer flocks sweep right across the ring road
    for (let f = 0; f < 4; f++) {
      this.flocks.push({ a0: R() * 6.28, w: (0.2 - f * 0.03) * (f % 2 ? -1 : 1), rad: [52, 100, 150, 205][f], h: [28, 23, 18, 15][f], p: R() * 6.28 });
      for (let i = 0; i < 32; i++) {
        birds.push({
          flock: f, air: 1, x: 0, y: 30, z: 0, px: 0, pz: 0, hd: 0,
          ax: 5 + R() * 6, ay: 1.5 + R() * 3, az: 5 + R() * 6,
          wx: 0.5 + R() * 0.6, wy: 0.4 + R() * 0.5, wz: 0.5 + R() * 0.6,
          p1: R() * 6.28, p2: R() * 6.28, p3: R() * 6.28, phase: R() * 6.28,
        });
      }
    }

    // groups on the ground
    this.groups = [];
    const addGroup = (cx, cz, spread, count, auto) => {
      const g = { x: cx, z: cz, t: -1, auto, next: 6 + R() * 25, members: [] };
      for (let i = 0; i < count; i++) {
        const a = R() * 6.28, d = Math.sqrt(R()) * spread;
        const b = {
          group: g, air: 0, hx: cx + Math.cos(a) * d, hz: cz + Math.sin(a) * d, x: 0, y: 0, z: 0, px: 0, pz: 0,
          hd: R() * 6.28, rad: 6 + R() * 9, hgt: 6 + R() * 9, w: (0.9 + R() * 0.6) * (R() < 0.5 ? -1 : 1),
          p1: R() * 6.28, delay: R() * 0.5, phase: R() * 6.28,
        };
        b.x = b.hx; b.z = b.hz; b.y = 0.2;
        g.members.push(b);
        birds.push(b);
      }
      this.groups.push(g);
    };
    for (const i of [26, 118, 188, 268, 330, 404]) {
      const lx = track.tz[i], lz = -track.tx[i], d = track.hw[i] + 1.5;
      addGroup(track.cx[i] + lx * d, track.cz[i] + lz * d, 3.2, 12, false);
    }
    let placed = 0;
    for (let tries = 0; tries < 400 && placed < 5; tries++) {
      const x = this.center.x + (R() - 0.5) * 170, z = this.center.z + (R() - 0.5) * 170;
      if (!pointInPoly(x, z, precinct.plaza) || Math.hypot(x - this.center.x, z - this.center.z) < 40) continue;
      addGroup(x, z, 5, 14, true);
      placed++;
    }

    // one small instanced mesh; wings flap in the vertex shader
    const s = 2.3;         // drawn larger than life so they read from a moving car
    const N = [0.27, 0, 0], T = [-0.3, 0.02, 0], U = [0, 0.1, 0], D = [0, -0.08, 0], L = [0, 0, 0.09], Rr = [0, 0, -0.09];
    const tris = [
      [N, U, L], [N, Rr, U], [N, L, D], [N, D, Rr], [T, L, U], [T, U, Rr], [T, D, L], [T, Rr, D],     // body
      [[0.12, 0.04, 0.06], [-0.13, 0.04, 0.06], [-0.05, 0.04, 0.52]],                                 // wings
      [[0.12, 0.04, -0.06], [-0.05, 0.04, -0.52], [-0.13, 0.04, -0.06]],
    ];
    const v = [], flap = [], col = [];
    tris.forEach((t, ti) => {
      t.forEach((p) => {
        v.push(p[0] * s, p[1] * s, p[2] * s);
        const tip = Math.abs(p[2]) > 0.3 ? 1 : 0;
        flap.push(tip);
        const shade = ti >= 8 ? (tip ? 0.8 : 1) : [1, 0.94, 0.82, 0.78, 0.96, 0.9, 0.8, 0.76][ti];
        col.push(shade, shade, Math.min(1, shade + 0.03));
      });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    geo.setAttribute('aFlap', new THREE.Float32BufferAttribute(flap, 1));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    this.state = new THREE.InstancedBufferAttribute(new Float32Array(birds.length * 2), 2);
    this.state.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aState', this.state);
    this.uTime = { value: 0 };
    const mat = new THREE.MeshBasicMaterial({ color: 0xfff4e6, vertexColors: true, side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = this.uTime;
      sh.vertexShader = 'attribute float aFlap; attribute vec2 aState; uniform float uTime;\n' + sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         transformed.z *= mix(0.28, 1.0, max(aState.y, 1.0 - aFlap));
         transformed.y += aFlap * aState.y * sin(uTime * 15.0 + aState.x) * 0.95;`,
      );
    };
    this.mesh = new THREE.InstancedMesh(geo, mat, birds.length);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    this.dummy = new THREE.Object3D();
    birds.forEach((b, i) => { this.state.array[2 * i] = b.phase; });
    this.flushed = 0;
  }

  update(t, dt, cars) {
    this.uTime.value = t;
    // ground groups: scare when a car is near, or now and then on their own
    for (const g of this.groups) {
      if (g.t < 0) {
        let scare = false;
        for (const c of cars) {
          const dx = c.x - g.x, dz = c.z - g.z;
          if (dx * dx + dz * dz < 20 * 20 && c.speedAbs > 3) scare = true;
        }
        if (g.auto) { g.next -= dt; if (g.next < 0) { scare = true; g.next = 18 + Math.random() * 30; } }
        if (scare) { g.t = 0; this.flushed++; }
      } else {
        g.t += dt;
        if (g.t > 13) g.t = -1;
      }
    }
    const d = this.dummy, st = this.state.array;
    const birds = this.birds;
    for (let i = 0; i < birds.length; i++) {
      const b = birds[i];
      b.px = b.x; b.pz = b.z;
      let bank = 0, amount = 1;
      if (b.flock !== undefined) {
        const f = this.flocks[b.flock];
        const a = f.a0 + f.w * t;
        const rad = f.rad + (10 + f.rad * 0.1) * Math.sin(0.13 * t + f.p);
        b.x = this.center.x + Math.cos(a) * rad + b.ax * Math.sin(b.wx * t + b.p1);
        b.z = this.center.z + Math.sin(a) * rad + b.az * Math.sin(b.wz * t + b.p3);
        b.y = f.h + 4 * Math.sin(0.21 * t + f.p) + b.ay * Math.sin(b.wy * t + b.p2);
        bank = 0.35 * Math.sign(f.w);
      } else {
        const gt = b.group.t - b.delay;
        if (gt > 0) {
          const e = Math.min(1, gt / 1.6) * Math.min(1, Math.max(0, (12.4 - gt) / 2.6));
          const env = e * e * (3 - 2 * e);
          const a = b.p1 + b.w * gt;
          b.x = b.hx + Math.cos(a) * b.rad * env;
          b.z = b.hz + Math.sin(a) * b.rad * env;
          b.y = 0.2 + b.hgt * env + Math.sin(gt * 2 + b.p1) * 0.6 * env;
          bank = 0.4 * Math.sign(b.w) * env;
          amount = env > 0.02 ? 1 : 0;
        } else {
          b.x = b.hx; b.z = b.hz; b.y = 0.2;
          amount = 0;
        }
      }
      const vx = b.x - b.px, vz = b.z - b.pz;
      if (vx * vx + vz * vz > 1e-6) b.hd = Math.atan2(vz, vx);
      d.position.set(b.x, b.y, b.z);
      d.rotation.set(bank, -b.hd, 0, 'YXZ');
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
      st[2 * i + 1] = amount;
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.state.needsUpdate = true;
  }
}
