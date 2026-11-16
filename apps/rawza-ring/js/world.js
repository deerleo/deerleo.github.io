import * as THREE from 'three';
import { rng, triangulate, orientOutsideRight, pointInPoly, canvasTexture, mergeGeoms } from './util.js';

// Direction towards the low sun (west-south-west, golden hour).
export const SUN_DIR = new THREE.Vector3(-0.9, 0.34, 0.27).normalize();
export const FOG_COLOR = new THREE.Color(0xd9a07c);

const Y_GREEN = 0.04, Y_WALK = 0.07, Y_PAVE = 0.1, Y_ROAD = 0.12, Y_MARK = 0.15;
export const ROAD_Y = Y_ROAD;

const MAJOR = new Set(['trunk', 'primary', 'secondary', 'tertiary']);
const PAVED_PATH = new Set(['footway', 'pedestrian']);

// ----------------------------------------------------------------- helpers
class Flat {
  constructor() { this.pos = []; this.idx = []; this.col = null; }
  get base() { return this.pos.length / 3; }

  // Ribbon along a polyline with mitred joins.
  ribbon(p, hw, y, offset = 0) {
    const n = p.length / 2;
    if (n < 2) return;
    const base = this.base;
    for (let i = 0; i < n; i++) {
      const x = p[2 * i], z = p[2 * i + 1];
      let ax, az, bx, bz;
      if (i > 0) { ax = x - p[2 * i - 2]; az = z - p[2 * i - 1]; }
      if (i < n - 1) { bx = p[2 * i + 2] - x; bz = p[2 * i + 3] - z; }
      if (i === 0) { ax = bx; az = bz; }
      if (i === n - 1) { bx = ax; bz = az; }
      const la = Math.hypot(ax, az) || 1, lb = Math.hypot(bx, bz) || 1;
      ax /= la; az /= la; bx /= lb; bz /= lb;
      let mx = -(az + bz), mz = ax + bx;
      let ml = Math.hypot(mx, mz);
      if (ml < 1e-4) { mx = -az; mz = ax; ml = 1; }
      mx /= ml; mz /= ml;
      const k = 1 / Math.max(0.5, mx * -az + mz * ax);
      const cx = x + mx * offset * k, cz = z + mz * offset * k;
      this.pos.push(cx + mx * hw * k, y, cz + mz * hw * k, cx - mx * hw * k, y, cz - mz * hw * k);
    }
    for (let i = 0; i < n - 1; i++) {
      const a = base + 2 * i;
      this.idx.push(a + 1, a, a + 2, a + 1, a + 2, a + 3);
    }
  }

  disc(x, z, r, y, seg = 14) {
    const base = this.base;
    this.pos.push(x, y, z);
    for (let k = 0; k < seg; k++) {
      const a = (k / seg) * Math.PI * 2;
      this.pos.push(x + Math.cos(a) * r, y, z + Math.sin(a) * r);
    }
    for (let k = 0; k < seg; k++) this.idx.push(base, base + 1 + ((k + 1) % seg), base + 1 + k);
  }

  poly(p, y, color) {
    const base = this.base;
    const n = p.length / 2;
    for (let i = 0; i < n; i++) this.pos.push(p[2 * i], y, p[2 * i + 1]);
    for (const t of triangulate(p)) this.idx.push(base + t);
    if (color) {
      this.col = this.col || [];
      for (let i = 0; i < n; i++) this.col.push(color.r, color.g, color.b);
    }
  }

  quad(ax, az, bx, bz, cx, cz, dx, dz, y) {
    const base = this.base;
    this.pos.push(ax, y, az, bx, y, bz, cx, y, cz, dx, y, dz);
    this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  // order: higher = drawn later. Top layers are drawn first so the layers
  // underneath are rejected by the depth test instead of being shaded twice.
  mesh(material, uvScale = 0.1, order = 0) {
    const g = new THREE.BufferGeometry();
    const n = this.pos.length / 3;
    const nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      nor[3 * i + 1] = 1;
      uv[2 * i] = this.pos[3 * i] * uvScale;
      uv[2 * i + 1] = this.pos[3 * i + 2] * uvScale;
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    if (this.col) g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    const m = new THREE.Mesh(g, material);
    m.receiveShadow = true;
    m.matrixAutoUpdate = false;
    m.renderOrder = order;
    return m;
  }
}

function layerMat(opts, level) {
  return new THREE.MeshLambertMaterial({ polygonOffset: true, polygonOffsetFactor: -level, polygonOffsetUnits: -level * 2, ...opts });
}

function noiseTex(size, base, amp, extra, aniso = 8) {
  return canvasTexture(size, size, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    const r = rng(size * 7 + amp);
    const img = g.getImageData(0, 0, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const d = (r() - 0.5) * amp;
      img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d;
    }
    g.putImageData(img, 0, 0);
    if (extra) extra(g, w, h, r);
  }, { aniso });
}

// ------------------------------------------------------------------ world
export function buildWorld(scene, map, track, colliders, surface, precinct) {
  const R = rng(20261110);
  const world = { gates: [], glow: null };

  // ---- light
  const hemi = new THREE.HemisphereLight(0xb4bce8, 0xa98463, 1.25);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb267, 3.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const SH = 115;
  Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 1, far: 800 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  scene.add(sun, sun.target);
  scene.fog = new THREE.Fog(FOG_COLOR, 140, 1900);
  world.sun = sun;

  const lightRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), SUN_DIR).normalize();
  const lightUp = new THREE.Vector3().crossVectors(SUN_DIR, lightRight).normalize();
  const texel = (2 * SH) / 2048;
  const focus = new THREE.Vector3();
  world.updateShadow = (p) => {
    focus.copy(p);
    const fx = focus.dot(lightRight), fy = focus.dot(lightUp);
    focus.addScaledVector(lightRight, Math.round(fx / texel) * texel - fx);
    focus.addScaledVector(lightUp, Math.round(fy / texel) * texel - fy);
    sun.target.position.copy(focus);
    sun.position.copy(focus).addScaledVector(SUN_DIR, 380);
    sun.target.updateMatrixWorld();
  };

  // ---- sky: a procedural sunset, baked once into a texture so that it costs
  //      almost nothing per frame (it matters on laptop graphics)
  const SKY_FN = `
    uniform vec3 sunDir; uniform vec3 fogCol;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x), mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x), f.y); }
    float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+vec2(17.0,9.0); a*=0.5; } return s; }
    vec3 skyColor(vec3 d){
      float h = clamp(d.y, 0.0, 1.0);
      float sun = max(dot(d, sunDir), 0.0);
      float toward = dot(normalize(d.xz + 1e-5), normalize(sunDir.xz)) * 0.5 + 0.5;
      vec3 zenith = vec3(0.10, 0.19, 0.46);
      vec3 midSky = mix(vec3(0.40,0.40,0.64), vec3(0.98,0.60,0.40), toward);
      vec3 horizon = mix(vec3(0.74,0.52,0.56), vec3(1.30,0.74,0.34), pow(toward, 1.5));
      vec3 col = mix(horizon, midSky, smoothstep(0.0, 0.24, h));
      col = mix(col, zenith, smoothstep(0.10, 0.85, h));
      col += vec3(1.3,0.60,0.20) * pow(sun, 24.0) * 0.55;
      col += vec3(1.4,0.90,0.50) * pow(sun, 220.0) * 1.1;
      vec2 cp = d.xz / (d.y + 0.12) * 1.5;
      float c = fbm(cp * 1.25);
      float cover = smoothstep(0.50, 0.80, c) * smoothstep(0.015, 0.16, d.y);
      vec3 cloudLit = mix(vec3(0.80,0.54,0.58), vec3(1.55,0.88,0.50), clamp(pow(toward,2.0)*0.8 + pow(sun,6.0)*0.6, 0.0, 1.0));
      vec3 cloudDark = vec3(0.36,0.31,0.45);
      col = mix(col, mix(cloudLit, cloudDark, smoothstep(0.55,0.95,c)*0.75), cover*0.85);
      col += vec3(7.0,4.8,2.6) * smoothstep(0.99950, 0.99985, sun) * (1.0 - cover*0.6);
      return mix(fogCol * mix(1.0, 1.35, pow(toward, 3.0)), col, smoothstep(0.0, 0.07, d.y));
    }`;
  const skyUniforms = { sunDir: { value: SUN_DIR }, fogCol: { value: FOG_COLOR } };
  // (a) procedural version, used once for the reflection map
  world.skyProcedural = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false, uniforms: skyUniforms,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `${SKY_FN} varying vec3 vDir;
      void main(){ gl_FragColor = vec4(skyColor(normalize(vDir)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  // (b) the sky dome actually drawn: one texture lookup, drawn last at the far plane
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { map: { value: null } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform sampler2D map; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir);
        vec2 uv = vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5);
        gl_FragColor = vec4(texture2D(map, uv).rgb, 1.0); }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat);
  sky.renderOrder = 100;
  sky.frustumCulled = false;
  scene.add(sky);
  world.sky = sky;
  world.bakeSky = (renderer) => {
    const rt = new THREE.WebGLRenderTarget(2048, 1024, { depthBuffer: false, generateMipmaps: false });
    rt.texture.wrapS = THREE.RepeatWrapping;
    rt.texture.minFilter = rt.texture.magFilter = THREE.LinearFilter;
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, uniforms: skyUniforms,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `${SKY_FN} varying vec2 vUv;
        #include <tonemapping_pars_fragment>
        void main(){
          float lon = (vUv.x - 0.5) * 6.2831853, lat = (vUv.y - 0.5) * 3.1415927;
          vec3 col = skyColor(vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon)));
          col = ACESFilmicToneMapping(col);
          col = mix(col * 12.92, 1.055 * pow(max(col, vec3(0.0)), vec3(0.41666)) - 0.055, step(vec3(0.0031308), col));
          gl_FragColor = vec4(col, 1.0); }`,
    }));
    quad.frustumCulled = false;
    const s2 = new THREE.Scene();
    s2.add(quad);
    renderer.setRenderTarget(rt);
    renderer.render(s2, new THREE.Camera());
    renderer.setRenderTarget(null);
    skyMat.uniforms.map.value = rt.texture;
    quad.geometry.dispose(); quad.material.dispose();
  };

  // ---- far mountains (the hills south of the city), pure silhouette
  {
    const seg = 220, pos = [], col = [], idx = [];
    const r1 = rng(99);
    const hs = [];
    for (let i = 0; i < seg; i++) hs.push(r1());
    const top = new THREE.Color(0x7d5f84), bot = FOG_COLOR;
    for (let layer = 0; layer < 2; layer++) {
      const rad = layer ? 3300 : 3900;
      const base = pos.length / 3;
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        const j = i % seg;
        const south = Math.max(0, Math.sin(a)) ** 0.7;
        let hgt = 0;
        for (let o = 1; o <= 4; o++) hgt += Math.abs(Math.sin(a * o * (3 + layer) + hs[(j * o) % seg] * 0.6 + layer * 2)) / o;
        hgt = (60 + hgt * (layer ? 120 : 210)) * (0.25 + 0.75 * south);
        pos.push(Math.cos(a) * rad, -20, Math.sin(a) * rad, Math.cos(a) * rad, hgt, Math.sin(a) * rad);
        const c2 = top.clone().lerp(bot, layer ? 0.25 : 0.5);
        col.push(bot.r, bot.g, bot.b, c2.r, c2.g, c2.b);
        if (i < seg) { const b = base + 2 * i; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
    m.frustumCulled = false;
    scene.add(m);
    world.mountains = m;
  }

  // ---- ground
  {
    const tex = noiseTex(512, '#cdb48e', 26, (g, w, h, r) => {
      for (let i = 0; i < 90; i++) {
        g.fillStyle = `rgba(${150 + r() * 60 | 0},${120 + r() * 50 | 0},${80 + r() * 40 | 0},0.10)`;
        g.beginPath();
        g.ellipse(r() * w, r() * h, 10 + r() * 50, 6 + r() * 30, r() * 3, 0, 7);
        g.fill();
      }
    });
    tex.repeat.set(9000 / 45, 9000 / 45);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshLambertMaterial({ map: tex }));
    m.rotation.x = -Math.PI / 2;
    m.receiveShadow = true;
    m.renderOrder = 50;
    scene.add(m);
  }

  // ---- green areas (real park / garden / grass polygons)
  const GREEN = {
    park: new THREE.Color(0x7c9a4e), garden: new THREE.Color(0x86a352), grass: new THREE.Color(0x8fa658),
    forest: new THREE.Color(0x66853f), village_green: new THREE.Color(0x86a352), grassland: new THREE.Color(0x98a763),
  };
  {
    const f = new Flat();
    for (const g of map.greens) f.poly(g.pts, Y_GREEN, GREEN[g.k] || GREEN.grass);
    const tex = noiseTex(256, '#ffffff', 46);
    scene.add(f.mesh(layerMat({ map: tex, vertexColors: true }, 1), 0.16, 40));
  }

  // ---- roads (real centrelines, width by road type)
  {
    const asphalt = new Flat(), walk = new Flat(), paving = new Flat();
    for (const r of map.roads) {
      const p = r.pts, hw = r.w / 2, n = p.length / 2;
      if (PAVED_PATH.has(r.t)) {
        paving.ribbon(p, hw, Y_PAVE);
        continue;
      }
      const side = r.t === 'service' || r.t === 'living_street' ? 0.9 : 1.9;
      asphalt.ribbon(p, hw, Y_ROAD);
      walk.ribbon(p, hw + side, Y_WALK);
      for (const e of [0, n - 1]) {
        asphalt.disc(p[2 * e], p[2 * e + 1], hw, Y_ROAD);
        walk.disc(p[2 * e], p[2 * e + 1], hw + side, Y_WALK);
      }
    }
    const asphaltTex = noiseTex(256, '#57565a', 34, (g, w, h, r) => {
      g.strokeStyle = 'rgba(30,30,34,0.25)';
      for (let i = 0; i < 14; i++) {
        g.beginPath();
        let x = r() * w, y = r() * h;
        g.moveTo(x, y);
        for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); }
        g.stroke();
      }
    });
    const walkTex = noiseTex(128, '#c9bca6', 16, (g, w, h) => {
      g.strokeStyle = 'rgba(90,80,70,0.35)';
      g.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke();
        g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke();
      }
    });
    scene.add(walk.mesh(layerMat({ map: walkTex }, 2), 0.25, 30));
    scene.add(paving.mesh(layerMat({ map: walkTex, color: 0xf0e4d0 }, 3), 0.25, 25));
    scene.add(asphalt.mesh(layerMat({ map: asphaltTex }, 4), 0.11, 20));
  }

  // ---- lane markings, only on the race route so the track reads clearly
  {
    const lines = new Flat();
    const n = track.n;
    const edge = [[], []], seg = [];
    for (let i = 0; i <= n; i++) {
      const j = i % n;
      const rx = -track.tz[j], rz = track.tx[j];
      const e = track.hw[j] - 0.45;
      edge[0].push(track.cx[j] + rx * e, track.cz[j] + rz * e);
      edge[1].push(track.cx[j] - rx * e, track.cz[j] - rz * e);
    }
    lines.ribbon(edge[0], 0.09, Y_MARK);
    lines.ribbon(edge[1], 0.09, Y_MARK);
    for (let i = 0; i < n; i += 4) {
      for (const sgn of [-1, 1]) {
        seg.length = 0;
        for (let k = 0; k <= 2; k++) {
          const j = (i + k) % n;
          const o = (track.hw[j] / 3) * sgn;
          seg.push(track.cx[j] - track.tz[j] * o, track.cz[j] + track.tx[j] * o);
        }
        lines.ribbon(seg, 0.07, Y_MARK);
      }
    }
    scene.add(lines.mesh(layerMat({ color: 0xf2ead8 }, 5), 0.1, 10));

    // start / finish line
    const chk = canvasTexture(256, 32, (g) => {
      for (let y = 0; y < 4; y++) for (let x = 0; x < 32; x++) {
        g.fillStyle = (x + y) % 2 ? '#111' : '#f4f4f4';
        g.fillRect(x * 8, y * 8, 8, 8);
      }
    });
    const cp = track.checkpoints[0];
    const sl = new THREE.Mesh(new THREE.PlaneGeometry(cp.hw * 2, 2.4), layerMat({ map: chk }, 6));
    sl.rotation.set(-Math.PI / 2, -Math.atan2(cp.tz, cp.tx) + Math.PI / 2, 0, 'YXZ');
    sl.position.set(cp.x, Y_MARK + 0.01, cp.z);
    sl.receiveShadow = true;
    scene.add(sl);
  }

  // ---- buildings: every real footprint raised as a low block
  {
    const B = map.buildings;
    let nEdge = 0;
    for (const b of B) nEdge += b.pts.length / 2;
    const pos = new Float32Array(nEdge * 12), nor = new Float32Array(nEdge * 12), col = new Float32Array(nEdge * 12);
    const uv = new Float32Array(nEdge * 8), idx = new Uint32Array(nEdge * 6);
    const rpos = new Float32Array(nEdge * 3), rcol = new Float32Array(nEdge * 3), ridx = [];
    const palette = [0xdcc9a4, 0xd2b88e, 0xe6d9bf, 0xc8ab82, 0xbfa07d, 0xe0d3bb, 0xcdbd9f, 0xb9c6bb, 0xd8bca2, 0xefe6d2, 0xc4b4a0, 0xd9c2a9]
      .map((c) => new THREE.Color(c));
    let e = 0, rv = 0;
    const c = new THREE.Color();
    for (const b of B) {
      const p = orientOutsideRight(b.pts);
      colliders.addPolygon(p);
      const n = p.length / 2, h = b.h;
      c.copy(palette[(R() * palette.length) | 0]).multiplyScalar(0.86 + R() * 0.22);
      let u = R() * 4;
      const v0 = 0;                         // ground floor always starts on the shop-front row
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const ax = p[2 * i], az = p[2 * i + 1], bx = p[2 * j], bz = p[2 * j + 1];
        const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1;
        const nx = -dz / len, nz = dx / len;
        const o = e * 12;
        pos.set([ax, 0, az, bx, 0, bz, bx, h, bz, ax, h, az], o);
        for (let k = 0; k < 4; k++) {
          nor[o + 3 * k] = nx; nor[o + 3 * k + 2] = nz;
          col[o + 3 * k] = c.r; col[o + 3 * k + 1] = c.g; col[o + 3 * k + 2] = c.b;
        }
        const u1 = u + len / 14;
        uv.set([u, v0, u1, v0, u1, v0 + h / 13.2, u, v0 + h / 13.2], e * 8);
        u = u1;
        idx.set([e * 4, e * 4 + 1, e * 4 + 2, e * 4, e * 4 + 2, e * 4 + 3], e * 6);
        e++;
      }
      const shade = 0.78 + R() * 0.12;
      for (const t of triangulate(p)) ridx.push(rv + t);
      for (let i = 0; i < n; i++) {
        rpos[rv * 3] = p[2 * i]; rpos[rv * 3 + 1] = h; rpos[rv * 3 + 2] = p[2 * i + 1];
        rcol[rv * 3] = c.r * shade; rcol[rv * 3 + 1] = c.g * shade; rcol[rv * 3 + 2] = c.b * shade * 0.97;
        rv++;
      }
    }
    // wall texture: 4 x 4 cells, bottom row = shop fronts, above = windows
    const lit = [];
    const rr = rng(4242);
    for (let i = 0; i < 16; i++) lit.push(rr() < (i >= 12 ? 0.6 : 0.3));
    const cell = (g, emissive) => {
      for (let row = 0; row < 4; row++) for (let cx = 0; cx < 4; cx++) {
        const x = cx * 64, y = row * 64, on = lit[row * 4 + cx];
        if (row === 3) {          // canvas bottom row = ground floor
          g.fillStyle = emissive ? (on ? '#ffb45a' : '#000') : (on ? '#8a6a48' : '#3a2f28');
          g.fillRect(x + 7, y + 14, 50, 50);
          if (!emissive) {
            g.fillStyle = ['#8c3b2e', '#2e5d7c', '#5c7a3a', '#a8782e'][cx];
            g.fillRect(x + 4, y + 8, 56, 9);
          } else if (on) {
            g.fillStyle = '#7a4a1c';
            g.fillRect(x + 28, y + 14, 4, 50);
          }
        } else {
          g.fillStyle = emissive ? (on ? '#ffa94d' : '#000') : (on ? '#c9a66e' : '#3d4855');
          g.fillRect(x + 18, y + 14, 28, 34);
          if (!emissive) {
            g.strokeStyle = '#efe9dc'; g.lineWidth = 2;
            g.strokeRect(x + 18, y + 14, 28, 34);
            g.beginPath(); g.moveTo(x + 32, y + 14); g.lineTo(x + 32, y + 48); g.stroke();
            g.fillStyle = 'rgba(120,100,80,0.35)';
            g.fillRect(x + 15, y + 48, 34, 3);
          }
        }
      }
    };
    const wallTex = canvasTexture(256, 256, (g, w, h) => {
      g.fillStyle = '#f4eee2'; g.fillRect(0, 0, w, h);
      const r2 = rng(5);
      for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(120,100,80,${r2() * 0.08})`; g.fillRect(r2() * w, r2() * h, 2 + r2() * 10, 1 + r2() * 3); }
      cell(g, false);
    }, { aniso: 8 });
    const wallEm = canvasTexture(256, 256, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); cell(g, true); }, { aniso: 8 });

    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    wg.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    wg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    wg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    wg.setIndex(new THREE.BufferAttribute(idx, 1));
    const walls = new THREE.Mesh(wg, new THREE.MeshLambertMaterial({
      map: wallTex, vertexColors: true, emissive: 0xffffff, emissiveMap: wallEm, emissiveIntensity: 0.85,
    }));
    const rg = new THREE.BufferGeometry();
    const rn = new Float32Array(rv * 3);
    for (let i = 0; i < rv; i++) rn[3 * i + 1] = 1;
    rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
    rg.setAttribute('normal', new THREE.BufferAttribute(rn, 3));
    rg.setAttribute('color', new THREE.BufferAttribute(rcol, 3));
    rg.setIndex(ridx);
    const roofs = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ vertexColors: true }));
    for (const m of [walls, roofs]) {
      m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.matrixAutoUpdate = false;
      scene.add(m);
    }
    world.buildingTris = (idx.length + ridx.length) / 3;
  }
  colliders.build();     // buildings are now queryable for placing scenery

  // ---- roundabout islands (closed-loop roads in the data)
  const dome = new THREE.MeshStandardMaterial({ color: 0x2bb3c4, roughness: 0.35, metalness: 0.1, emissive: 0x0b4a55, emissiveIntensity: 0.6 });
  const stone = new THREE.MeshLambertMaterial({ color: 0xe9e1d0 });
  {
    const lawn = new Flat(), kerb = [];
    for (const r of map.roads) {
      const p = r.pts, n = p.length / 2;
      if (n < 8 || Math.hypot(p[0] - p[2 * n - 2], p[1] - p[2 * n - 1]) > 0.5 || !MAJOR.has(r.t)) continue;
      let cx = 0, cz = 0, rad = 0;
      for (let i = 0; i < n - 1; i++) { cx += p[2 * i]; cz += p[2 * i + 1]; }
      cx /= n - 1; cz /= n - 1;
      for (let i = 0; i < n - 1; i++) rad += Math.hypot(p[2 * i] - cx, p[2 * i + 1] - cz);
      rad = rad / (n - 1) - r.w / 2 - 2.2;
      if (rad < 5) continue;
      colliders.addCircle(cx, cz, rad);
      lawn.disc(cx, cz, rad - 0.3, 0.42, 28);
      kerb.push({ geometry: new THREE.CylinderGeometry(rad, rad + 0.25, 0.4, 36, 1, true), matrix: new THREE.Matrix4().makeTranslation(cx, 0.2, cz), color: 0xe8e0d0 });
      // small domed pavilion in the middle
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.0, 1.2, 8), stone);
      plinth.position.y = 1.0;
      g.add(plinth);
      for (let k = 0; k < 8; k++) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 4.6, 8), stone);
        col.position.set(Math.cos((k + 0.5) * Math.PI / 4) * 3, 3.9, Math.sin((k + 0.5) * Math.PI / 4) * 3);
        g.add(col);
      }
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.9, 8), new THREE.MeshLambertMaterial({ color: 0x2d62b0, emissive: 0x10305c }));
      ring.position.y = 6.6;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(3.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), dome);
      cap.position.y = 7.0;
      cap.scale.y = 1.25;
      g.add(ring, cap);
      g.position.set(cx, 0, cz);
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(g);
      world.islands = world.islands || [];
      world.islands.push({ x: cx, z: cz, r: rad });
    }
    if (kerb.length) {
      scene.add(lawn.mesh(new THREE.MeshLambertMaterial({ color: 0x7f9c50 })));
      const km = new THREE.Mesh(mergeGeoms(kerb), new THREE.MeshLambertMaterial({ vertexColors: true }));
      km.receiveShadow = true;
      scene.add(km);
    }
  }

  // ---- trees: inside the real green polygons and along the boulevard medians
  const trees = [];
  {
    const DENS = { forest: 1 / 55, park: 1 / 210, garden: 1 / 150, grass: 1 / 420, village_green: 1 / 150, grassland: 1 / 300 };
    const clear = (x, z, pad) => surface.roadDist(x, z) > pad && !colliders.resolve(x, z, 1.4);
    const nearShrine = (x, z) => Math.hypot(x - map.shrine.c[0], z - map.shrine.c[1]) < 44;
    for (const g of map.greens) {
      const p = g.pts;
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); z0 = Math.min(z0, p[i + 1]); z1 = Math.max(z1, p[i + 1]); }
      // the tree belts beside the ring boulevard are thinned so the shrine stays in view
      const belt = g.k === 'forest' && Math.hypot((x0 + x1) / 2 - map.shrine.c[0], (z0 + z1) / 2 - map.shrine.c[1]) < 330;
      const tries = Math.ceil((x1 - x0) * (z1 - z0) * (belt ? 1 / 260 : DENS[g.k] || 1 / 300) * 1.6);
      for (let t = 0; t < tries; t++) {
        const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0);
        if (!pointInPoly(x, z, p) || !clear(x, z, 1.6) || nearShrine(x, z) || pointInPoly(x, z, precinct.plaza)) continue;
        const inside = pointInPoly(x, z, precinct.wall);
        trees.push({ x, z, s: (inside ? 0.55 : 0.8) + R() * (inside ? 0.35 : 0.45), kind: (g.k === 'forest' && !belt) || R() < 0.35 ? 0 : 1, solid: !inside });
      }
    }
    // the islands of the roundabouts
    for (const isl of world.islands || []) {
      const cnt = Math.floor(isl.r * 0.9);
      for (let k = 0; k < cnt; k++) {
        const a = (k / cnt) * Math.PI * 2;
        trees.push({ x: isl.x + Math.cos(a) * (isl.r - 2.4), z: isl.z + Math.sin(a) * (isl.r - 2.4), s: 0.7, kind: 0, solid: false });
      }
    }
    // medians beside the race route (left = shrine side of the outer carriageway)
    for (let i = 0; i < track.n; i += 5) {
      const lx = track.tz[i], lz = -track.tx[i];
      const d = track.hw[i] + 4.6;
      const x = track.cx[i] + lx * d, z = track.cz[i] + lz * d;
      if (Math.hypot(x - map.shrine.c[0], z - map.shrine.c[1]) < 345) continue;      // not on the ring itself
      if (clear(x, z, 2.6) && !pointInPoly(x, z, precinct.wall)) trees.push({ x, z, s: 0.75 + R() * 0.3, kind: 1, solid: true });
    }
    for (const t of trees) if (t.solid) colliders.addCircle(t.x, t.z, 0.32 * t.s);

    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4f3a });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const kinds = [
      { trunk: new THREE.CylinderGeometry(0.16, 0.24, 2.2, 6).translate(0, 1.1, 0), crown: new THREE.ConeGeometry(1.5, 9.5, 8).translate(0, 6.3, 0), tint: [0x3f6b3a, 0x4a7a3e, 0x375f35] },
      { trunk: new THREE.CylinderGeometry(0.2, 0.32, 3.4, 6).translate(0, 1.7, 0), crown: new THREE.IcosahedronGeometry(2.9, 1).scale(1, 0.82, 1).translate(0, 5.0, 0), tint: [0x6d8f3c, 0x7a9a42, 0x5f8438, 0x8a9c40] },
    ];
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const tc = new THREE.Color();
    kinds.forEach((k, ki) => {
      const list = trees.filter((t) => t.kind === ki);
      const tm = new THREE.InstancedMesh(k.trunk, trunkMat, list.length);
      const cm = new THREE.InstancedMesh(k.crown, leafMat, list.length);
      list.forEach((t, i) => {
        Q.setFromAxisAngle(up, R() * 6.28);
        S.set(t.s, t.s * (0.9 + R() * 0.25), t.s);
        M.compose(P.set(t.x, 0, t.z), Q, S);
        tm.setMatrixAt(i, M);
        cm.setMatrixAt(i, M);
        cm.setColorAt(i, tc.set(k.tint[(R() * k.tint.length) | 0]).multiplyScalar(0.85 + R() * 0.3));
      });
      for (const m of [tm, cm]) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; scene.add(m); }
    });
    world.treeCount = trees.length;
  }

  // ---- street lights (lit: it is dusk)
  {
    const lamps = [];
    const add = (x, z, dx, dz) => {
      if (surface.roadDist(x, z) < 0.5 || colliders.resolve(x, z, 0.6)) return;
      lamps.push({ x, z, a: Math.atan2(dz, dx) });
      colliders.addCircle(x, z, 0.16);
    };
    for (let i = 0, k = 0; i < track.n; i += 11, k++) {
      const s = k % 2 ? 1 : -1;
      const rx = -track.tz[i] * s, rz = track.tx[i] * s;
      const d = track.hw[i] + 1.3;
      add(track.cx[i] + rx * d, track.cz[i] + rz * d, -rx, -rz);
    }
    const trackWays = new Set(map.track.ways);
    for (const r of map.roads) {
      if (!MAJOR.has(r.t) || trackWays.has(r.id)) continue;
      const p = r.pts;
      let acc = 20;
      for (let i = 0; i + 3 < p.length; i += 2) {
        const dx = p[i + 2] - p[i], dz = p[i + 3] - p[i + 1], len = Math.hypot(dx, dz);
        while (acc < len) {
          const t = acc / len, nx = -dz / len, nz = dx / len, d = r.w / 2 + 1.3;
          add(p[i] + dx * t + nx * d, p[i + 1] + dz * t + nz * d, -nx, -nz);
          acc += 46;
        }
        acc -= len;
      }
    }
    const poleGeo = mergeGeoms([
      new THREE.CylinderGeometry(0.07, 0.12, 7.6, 6).translate(0, 3.8, 0),
      new THREE.BoxGeometry(1.9, 0.09, 0.1).translate(0.9, 7.55, 0),
    ]);
    const headGeo = new THREE.BoxGeometry(0.7, 0.1, 0.3).translate(1.6, 7.45, 0);
    const poles = new THREE.InstancedMesh(poleGeo, new THREE.MeshLambertMaterial({ color: 0x3c3f46 }), lamps.length);
    const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.3, 1.2) }), lamps.length);
    const glowTex = canvasTexture(64, 64, (g) => {
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,220,170,0.55)'); gr.addColorStop(1, 'rgba(255,180,90,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    }, { clamp: true });
    const pools = new THREE.InstancedMesh(new THREE.CircleGeometry(7.5, 20).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.3, color: 0xffb060, polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -16 }), lamps.length);
    const gp = new Float32Array(lamps.length * 3);
    const M = new THREE.Matrix4();
    lamps.forEach((l, i) => {
      M.makeRotationY(-l.a).setPosition(l.x, 0, l.z);
      poles.setMatrixAt(i, M);
      heads.setMatrixAt(i, M);
      const hx = l.x + Math.cos(l.a) * 1.6, hz = l.z + Math.sin(l.a) * 1.6;
      gp.set([hx, 7.35, hz], i * 3);
      M.makeTranslation(hx, 0.2, hz);
      pools.setMatrixAt(i, M);
    });
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(gp, 3));
    const glow = new THREE.Points(gg, new THREE.PointsMaterial({ map: glowTex, size: 3.4, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffc98a }));
    poles.castShadow = true;
    for (const m of [poles, heads, pools, glow]) { m.frustumCulled = false; scene.add(m); }
    world.lampCount = lamps.length;
    world.glowTex = glowTex;
  }

  // ---- start / finish gantry
  {
    const cp = track.checkpoints[0];
    const g = new THREE.Group();
    const span = cp.hw * 2 + 3;
    const postMat = new THREE.MeshLambertMaterial({ color: 0x2b3340 });
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 7.2, 0.45), postMat);
      post.position.set(0, 3.6, s * span / 2);
      g.add(post);
      colliders.addCircle(cp.x - cp.tz * s * span / 2, cp.z + cp.tx * s * span / 2, 0.35);
    }
    const banner = canvasTexture(1024, 128, (c, w, h) => {
      c.fillStyle = '#12233f'; c.fillRect(0, 0, w, h);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) for (const ox of [0, w - 128]) {
        c.fillStyle = (x + y) % 2 ? '#111' : '#f4f4f4';
        c.fillRect(ox + x * 16, y * 16, 16, 16);
      }
      c.fillStyle = '#ffd98a'; c.font = 'bold 60px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('RAWZA RING  ·  MAZAR-I-SHARIF', w / 2, h / 2 + 4, w - 310);
    }, { clamp: true });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, span + 0.5), [
      new THREE.MeshLambertMaterial({ map: banner, emissive: 0xffffff, emissiveMap: banner, emissiveIntensity: 0.45 }),
      new THREE.MeshLambertMaterial({ map: banner, emissive: 0xffffff, emissiveMap: banner, emissiveIntensity: 0.45 }),
      postMat, postMat, postMat, postMat,
    ]);
    beam.position.y = 7.0;
    g.add(beam);
    g.position.set(cp.x, 0, cp.z);
    g.rotation.y = -Math.atan2(cp.tz, cp.tx);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
  }

  // ---- checkpoint gate markers (re-positioned as the player progresses)
  {
    const curtain = canvasTexture(8, 64, (g) => {
      const gr = g.createLinearGradient(0, 0, 0, 64);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
      g.fillStyle = gr; g.fillRect(0, 0, 8, 64);
    }, { clamp: true });
    for (let k = 0; k < 2; k++) {
      const g = new THREE.Group();
      const colr = k ? 0x9fd8ff : 0x6ff2ff;
      const pm = new THREE.MeshBasicMaterial({ color: colr, transparent: true, opacity: k ? 0.35 : 0.9 });
      const posts = [];
      for (const s of [-1, 1]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 5.5, 8), pm);
        p.position.y = 2.75;
        g.add(p);
        posts.push(p);
      }
      const veil = new THREE.Mesh(new THREE.PlaneGeometry(1, 4.5), new THREE.MeshBasicMaterial({
        map: curtain, color: colr, transparent: true, opacity: k ? 0.1 : 0.28, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      veil.rotation.y = Math.PI / 2;
      veil.position.y = 2.25;
      g.add(veil);
      g.userData = { posts, veil };
      scene.add(g);
      world.gates.push(g);
    }
    world.setGate = (k, cp) => {
      const g = world.gates[k];
      g.visible = !!cp;
      if (!cp) return;
      g.position.set(cp.x, ROAD_Y, cp.z);
      g.rotation.y = -Math.atan2(cp.tz, cp.tx);
      const w = cp.hw + 0.8;
      g.userData.posts[0].position.z = -w;
      g.userData.posts[1].position.z = w;
      g.userData.veil.scale.x = w * 2;
    };
  }

  world.update = (t, camera) => {
    sky.position.copy(camera.position);
    world.mountains.position.set(camera.position.x, 0, camera.position.z);
  };
  return world;
}
