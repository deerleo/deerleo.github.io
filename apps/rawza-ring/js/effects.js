import * as THREE from 'three';

// Tyre smoke, dust and sparks: one point cloud with soft round sprites.
export class Particles {
  constructor(scene, max = 420) {
    this.max = max;
    this.next = 0;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.size = new Float32Array(max);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max).fill(1);
    this.size0 = new Float32Array(max);
    this.alpha0 = new Float32Array(max);
    this.grow = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.uScale = { value: 600 };
    this.points = new THREE.Points(g, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uScale: this.uScale },
      vertexShader: `attribute vec4 aColor; attribute float aSize; uniform float uScale; varying vec4 vColor;
        void main(){ vColor = aColor; vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_PointSize = aSize * uScale / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec4 vColor;
        void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.2, d) * vColor.a;
          if (a < 0.004) discard; gl_FragColor = vec4(vColor.rgb, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }));
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
  }

  emit(x, y, z, vx, vy, vz, size, life, r, g, b, a, grow = 1.5) {
    const i = this.next;
    this.next = (i + 1) % this.max;
    this.pos.set([x, y, z], i * 3);
    this.vel.set([vx, vy, vz], i * 3);
    this.col.set([r, g, b, a], i * 4);
    this.size0[i] = size; this.alpha0[i] = a; this.grow[i] = grow;
    this.life[i] = life; this.maxLife[i] = life;
  }

  update(dt) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.size[i] = 0; continue; }
      this.life[i] -= dt;
      const t = 1 - Math.max(0, this.life[i]) / this.maxLife[i];
      this.pos[3 * i] += this.vel[3 * i] * dt;
      this.pos[3 * i + 1] += this.vel[3 * i + 1] * dt;
      this.pos[3 * i + 2] += this.vel[3 * i + 2] * dt;
      this.vel[3 * i] *= 1 - 1.5 * dt; this.vel[3 * i + 2] *= 1 - 1.5 * dt;
      this.size[i] = this.size0[i] * (1 + this.grow[i] * t);
      this.col[4 * i + 3] = this.alpha0[i] * (1 - t) * (1 - t);
    }
    const a = this.points.geometry.attributes;
    a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = true;
  }
}

// Dark rubber strips left on the road while a car slides.
export class SkidMarks {
  constructor(scene, y, max = 700) {
    this.max = max;
    this.next = 0;
    this.y = y;
    this.pos = new Float32Array(max * 12);
    const idx = new Uint16Array(max * 6);
    for (let i = 0; i < max; i++) idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2], i * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: 0x0a0a0a, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -7, polygonOffsetUnits: -14,
    }));
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.last = new Map();
  }

  // key identifies a wheel; on=false breaks the strip
  track(key, on, x, z) {
    const prev = this.last.get(key);
    if (!on) { if (prev) this.last.delete(key); return; }
    if (!prev) { this.last.set(key, { x, z }); return; }
    const dx = x - prev.x, dz = z - prev.z, len = Math.hypot(dx, dz);
    if (len < 0.6) return;
    if (len < 6) {
      const nx = (-dz / len) * 0.13, nz = (dx / len) * 0.13, y = this.y;
      this.pos.set([prev.x + nx, y, prev.z + nz, prev.x - nx, y, prev.z - nz, x + nx, y, z + nz, x - nx, y, z - nz], this.next * 12);
      this.next = (this.next + 1) % this.max;
      this.mesh.geometry.attributes.position.needsUpdate = true;
    }
    prev.x = x; prev.z = z;
  }
}
