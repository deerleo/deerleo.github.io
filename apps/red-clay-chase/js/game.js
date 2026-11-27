'use strict';
/* Gameplay layer: traffic and police cars as physical bodies (crashes with impulses and spin), damage, the pursuit
   (cruisers that ram and shoot and cannot be shaken off), game over and restart. */
(function () {
  const U = G.U;
  G.Game = function (api) {
    const R = G.road, P = G.player, scene = api.scene, cam = api.cam, cmr = api.camera, V = G.traffic, game = this;
    const f = {}, f2 = {}, q = {}, sf = {}, sf2 = {}, hit = {};
    const VCOP = 68, MAXCOPS = 4;
    const S = this.state = { hp: 100, dead: false, deadT: 0, police: 1, arm: -1, pursuit: false, heat: 0, heatT: 0, time: 0, dist: 0, wrecked: 0, flash: 0, flashL: 0, flashR: 0, calm: 0, spawnT: 0, dirP: 1, blockT: 25, intro: 0, introT: 0, introFast: false, fireCd: 0, surv: 60, won: false, wonT: 0, free: false };
    const INTRO = 5.4, HEAT = [15, 35, 60, 90]; // length of the opening shot (s); pursuit time at which each further star is added
    /* what each wanted level means. lean: how hard the cars alongside turn into the player (0 = they never touch it); ram: the same for the car on its tail;
       brake: a car gets in front and brake-checks; fire: how much shooting (0 = none); hang: how far back they sit between moves */
    const LV = [null,
      { cops: 2, lean: 0.25, ram: 0.45, brake: 0, fire: 0, hang: 8 },     // *      close company: a brush door to door, a tap on the bumper now and then
      { cops: 2, lean: 0.4, ram: 0.6, brake: 0, fire: 0.3, hang: 8 },     // **     the same a little firmer, the odd warning shot
      { cops: 3, lean: 0.55, ram: 0.72, brake: 0, fire: 0.5, hang: 8 },   // ***    a third car, real nudges
      { cops: 4, lean: 0.75, ram: 0.86, brake: 1, fire: 0.75, hang: 9 },  // ****   they mean it: shoves, a car in front brake-checking
      { cops: 4, lean: 1, ram: 1, brake: 1, fire: 1, hang: 10 }];         // *****  everything they have - and the clock starts: hold out and they give up
    const lvl = () => LV[U.clamp(S.heat, 1, 5)];
    const soft = () => G.touchMode ? 0.7 : 1;       // on a phone everything is a notch gentler
    const survive = () => G.touchMode ? 45 : 60;    // seconds to last at five stars
    this.timeScale = 1;
    this.uScale = { value: 800 };
    const rand = (a, b) => a + Math.random() * (b - a);

    /* ================= particles: sparks, muzzle flashes, fire (additive points) ================= */
    const FX = (function () {
      const MAX = 360, pos = new Float32Array(MAX * 3), dat = new Float32Array(MAX * 2), col = new Float32Array(MAX * 3), vel = new Float32Array(MAX * 3), life = new Float32Array(MAX).fill(9), dur = new Float32Array(MAX).fill(1), grav = new Float32Array(MAX), size = new Float32Array(MAX);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aDat', new THREE.BufferAttribute(dat, 2)); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
      const m = new THREE.ShaderMaterial({
        uniforms: { uScale: game.uScale },
        vertexShader: `attribute vec2 aDat; attribute vec3 aCol; uniform float uScale; varying vec3 vC; varying float vA;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(aDat.x * uScale / max(0.1, -mv.z), 1.5, 72.0); vC = aCol; vA = aDat.y; }`,
        fragmentShader: `varying vec3 vC; varying float vA;
void main(){ vec2 p = gl_PointCoord - 0.5; float d = dot(p, p) * 4.0; if (d > 1.0 || vA < 0.003) discard; float a = (1.0 - d); gl_FragColor = vec4(vC * a * a * vA, 1.0); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 6; scene.add(pts);
      let cur = 0;
      return {
        emit(x, y, z, vx, vy, vz, sz, d, r, gg, b, gr) {
          const i = cur++ % MAX;
          pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
          life[i] = 0; dur[i] = d; size[i] = sz; grav[i] = gr === undefined ? 9 : gr; col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = b;
        },
        sparks(x, y, z, vx, vz, n, pw) {
          for (let k = 0; k < n; k++) this.emit(x, y, z, vx * 0.5 + rand(-1, 1) * pw, rand(0.5, 1) * pw * 0.8, vz * 0.5 + rand(-1, 1) * pw, rand(0.05, 0.11), rand(0.18, 0.5), 9, 5 + rand(0, 2), 1.2);
        },
        update(dt) {
          for (let i = 0; i < MAX; i++) {
            if (life[i] > dur[i]) { dat[i * 2 + 1] = 0; continue; }
            life[i] += dt; const t = life[i] / dur[i];
            vel[i * 3 + 1] -= grav[i] * dt;
            pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
            dat[i * 2] = size[i] * (grav[i] < 0 ? 1 + t * 1.6 : 1); dat[i * 2 + 1] = t >= 1 ? 0 : (1 - t * t);
          }
          g.attributes.position.needsUpdate = true; g.attributes.aDat.needsUpdate = true; g.attributes.aCol.needsUpdate = true;
        },
      };
    })();
    const fire = (x, y, z, vx, vz, n, big) => { // flames (buoyant, short-lived) + smoke
      for (let k = 0; k < n; k++) FX.emit(x + rand(-0.4, 0.4) * big, y + rand(0, 0.3), z + rand(-0.4, 0.4) * big, vx * 0.6 + rand(-0.5, 0.5), rand(1.2, 3.2) * big, vz * 0.6 + rand(-0.5, 0.5), rand(0.35, 0.75) * big, rand(0.25, 0.55), 7, 2.4 + rand(0, 1.6), 0.35, -3);
      if (G.smoke) G.smoke.emit(x, y + 0.5, z, vx * 0.5 + rand(-0.4, 0.4), rand(1.6, 2.8), vz * 0.5 + rand(-0.4, 0.4), 0.9 * big, 0.5, 0.05, 0.05, 0.055);
    };

    /* ================= tracers ================= */
    const TR = (function () {
      const MAX = 28, pos = new Float32Array(MAX * 6), list = [];
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.LineBasicMaterial({ color: new THREE.Color().setRGB(7, 4.6, 1.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      const ls = new THREE.LineSegments(g, m); ls.frustumCulled = false; ls.renderOrder = 6; scene.add(ls);
      for (let i = 0; i < MAX; i++) list.push({ on: false, ox: 0, oy: 0, oz: 0, dx: 0, dy: 0, dz: 0, len: 0, t: 0, hit: 0 });
      return {
        add(ox, oy, oz, ex, ey, ez, hitDmg) {
          let b = null; for (const t of list) if (!t.on) { b = t; break; } if (!b) return;
          const dx = ex - ox, dy = ey - oy, dz = ez - oz, l = Math.hypot(dx, dy, dz) || 1;
          b.on = true; b.ox = ox; b.oy = oy; b.oz = oz; b.dx = dx / l; b.dy = dy / l; b.dz = dz / l; b.len = l; b.t = 0; b.hit = hitDmg;
        },
        update(dt) {
          list.forEach((b, i) => {
            let a0 = 0, a1 = 0;
            if (b.on) {
              b.t += 270 * dt; a1 = Math.min(b.len, b.t); a0 = Math.max(0, b.t - 11);
              if (a0 >= b.len) { b.on = false; a0 = a1 = 0; impact(b); }
            }
            pos[i * 6] = b.ox + b.dx * a0; pos[i * 6 + 1] = b.oy + b.dy * a0; pos[i * 6 + 2] = b.oz + b.dz * a0;
            pos[i * 6 + 3] = b.ox + b.dx * a1; pos[i * 6 + 4] = b.oy + b.dy * a1; pos[i * 6 + 5] = b.oz + b.dz * a1;
          });
          g.attributes.position.needsUpdate = true;
        },
        clear() { for (const b of list) b.on = false; },
      };
    })();
    function impact(b) { // a round arrives: sparks on the car, or a puff where it hit the ground
      const x = b.ox + b.dx * b.len, y = b.oy + b.dy * b.len, z = b.oz + b.dz * b.len;
      if (b.hit > 0 && !S.dead) {
        FX.sparks(P.x + rand(-0.7, 0.7), P.y + rand(0.5, 1.0), P.z + rand(-0.7, 0.7), P.vx, P.vz, 5, 3.2);
        G.sound.ping(); hurt(b.hit, 0.5, sideOf(-b.dx, -b.dz));
      } else if (G.smoke) G.smoke.emit(x, Math.max(y, 0) + 0.1, z, rand(-0.5, 0.5), 1.2, rand(-0.5, 0.5), 0.35, 0.3, 0.62, 0.55, 0.46);
    }

    /* ================= vehicles ================= */
    const blobMat = new THREE.MeshBasicMaterial({ map: api.blobTex, color: 0x000000, transparent: true, opacity: 0.62, depthWrite: false });
    function mkVehicle(kind, type, color) {
      const m = G.buildTrafficCar(type, color, api.env);
      const blob = new THREE.Mesh(new THREE.PlaneGeometry(m.w + 1.1, m.len * 2 + 1.2).rotateX(-Math.PI / 2), blobMat);
      blob.position.y = 0.04; blob.renderOrder = 2; m.root.add(blob);
      m.root.traverse(o => { if (o.material) o.material.shadowSide = THREE.DoubleSide; }); // open shells must not leak light into their own shadow
      m.root.rotation.order = 'YXZ'; scene.add(m.root);
      const hw = m.w / 2, hl = m.len, mass = type === 'van' ? 2400 : type === 'pickup' ? 2100 : 1550;
      return { kind, type, m, hw, hl, mass, inertia: mass * (hw * hw + hl * hl) / 3, mode: 'lane', on: true, x: 0, y: 0, z: 0, yaw: 0, vx: 0, vz: 0, w: 0, v: 0, s: 0, br: 0, d: 0, dir: 1, v0: 20, hp: 100,
        spin: 0, hint: -1, pitch: 0, roll: 0, t: 0, fork: null, near: false, fixed: false, smokeT: 0 };
    }
    const CIV = [
      ['pickup', 0xdcdad3, -1, 330, 24], ['sedan', 0x20355c, -1, 1180, 23], ['van', 0xe8e6e0, -1, 2050, 22.5], ['sedan', 0x9aa0a6, -1, 2900, 24.5],
      ['sedan', 0x23252a, 1, 270, 20.5], ['pickup', 0x35523f, 1, 1500, 20], ['van', 0xc2ad82, 1, 2600, 19.5],
      ['sedan', 0x6e1a1c, -1, 760, 23.5], ['pickup', 0x2c2f33, -1, 1650, 22], ['van', 0x31506b, 1, 920, 19], ['sedan', 0xd9d4c5, 1, 2060, 21], ['sedan', 0x4f5a4a, -1, 3260, 24], ['pickup', 0xa9a39a, 1, 3180, 20.5],
    ];
    const civs = [], cops = this.cops = [];
    function placeCiv(t, s) {
      t.mode = 'lane'; t.on = true; t.s = R.wrapS(s); t.v = t.v0; t.hp = 100; t.w = 0; t.t = 0; t.fixed = false; t.m.root.visible = true;
      const F = R.forkOf(t.s); t.fork = F; t.br = F && Math.random() < 0.4 ? 1 : 0;
      laneStep(t, 0);
    }
    for (const [type, color, dir, ds, v] of CIV) {
      const t = mkVehicle('civ', type, color); t.dir = dir; t.v0 = v; t.home = R.start * R.DS + ds;
      civs.push(t); V.push(t);
    }
    /* ---- police cruiser: black and white sedan, light bar, push bar ---- */
    const copMat = (function () {
      const c = document.createElement('canvas'); c.width = 256; c.height = 64; const cx = c.getContext('2d');
      cx.clearRect(0, 0, 256, 64); cx.fillStyle = '#16233f'; cx.font = '700 44px "Bahnschrift","Arial Narrow",Arial,sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('SHERIFF', 128, 35);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
      return {
        white: new THREE.MeshStandardMaterial({ color: 0xe6e6e0, roughness: 0.36, metalness: 0.3, envMap: api.env, envMapIntensity: 0.5 }),
        black: new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.5, metalness: 0.4, envMap: api.env, envMapIntensity: 0.4 }),
        red: new THREE.MeshStandardMaterial({ color: 0x3a0505, emissive: 0xff1408, emissiveIntensity: 0, roughness: 0.25 }),
        blue: new THREE.MeshStandardMaterial({ color: 0x050a3a, emissive: 0x1038ff, emissiveIntensity: 0, roughness: 0.25 }),
        text: new THREE.MeshStandardMaterial({ map: tx, alphaTest: 0.5, roughness: 0.5, metalness: 0.1 }),
        haloR: new THREE.SpriteMaterial({ map: api.blobTex, color: new THREE.Color().setRGB(2.4, 0.16, 0.1), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
        haloB: new THREE.SpriteMaterial({ map: api.blobTex, color: new THREE.Color().setRGB(0.12, 0.34, 3.0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
      };
    })();
    function mkCop(n) {
      const c = mkVehicle('cop', 'sedan', 0x0b0c0f); c.mass = 1450; c.inertia = c.mass * (c.hw * c.hw + c.hl * c.hl) / 3;
      const b = c.m.body, bx = (w, h, d, x, y, z) => U.tf(new THREE.BoxGeometry(w, h, d), x, y, z, 0, 0, 0);
      const add = (g, m) => { const ms = new THREE.Mesh(g, m); ms.receiveShadow = true; b.add(ms); return ms; };
      add(U.merge([bx(0.016, 0.5, 1.72, 0.922, 0.63, -0.3), bx(0.016, 0.5, 1.72, -0.922, 0.63, -0.3), bx(1.16, 0.014, 1.2, 0, 1.452, -0.36)]), copMat.white);
      add(U.merge([bx(1.1, 0.05, 0.28, 0, 1.485, -0.3), bx(1.36, 0.07, 0.07, 0, 0.62, 2.47), bx(1.36, 0.07, 0.07, 0, 0.36, 2.47), bx(0.07, 0.42, 0.07, 0.45, 0.5, 2.47), bx(0.07, 0.42, 0.07, -0.45, 0.5, 2.47)]), copMat.black);
      add(bx(0.5, 0.1, 0.24, 0.27, 1.555, -0.3), copMat.red); add(bx(0.5, 0.1, 0.24, -0.27, 1.555, -0.3), copMat.blue);
      const tp = sx => U.tf(new THREE.PlaneGeometry(1.0, 0.25), sx * 0.932, 0.64, -0.3, 0, sx * Math.PI / 2, 0);
      add(U.merge([tp(1), tp(-1)]), copMat.text);
      c.hR = new THREE.Sprite(copMat.haloR); c.hR.position.set(0.3, 1.62, -0.3); c.hB = new THREE.Sprite(copMat.haloB); c.hB.position.set(-0.3, 1.62, -0.3); b.add(c.hR); b.add(c.hB);
      c.slot = [0, 1, -1, 0][n % 4]; c.on = false; c.mode = 'off'; c.m.root.visible = false; c.fireT = 1; c.burst = 0; c.shotT = 0; c.stuck = 0; c.backT = 0; c.revT = 0; c.wantBr = 0; c.freeT = 0; c.vl = 0; c.wImp = 0; c.wCmd = 0; c.ramT = 2; c.side = n % 2 ? 1 : -1; c.role = 'tail'; c.sd = 1; c.ph = 0; c.phT = 0; c.brk = false; c.holdT = 0; c.lane = 1.85; c.gapT = 20;
      cops.push(c); V.push(c);
    }
    for (let n = 0; n < MAXCOPS; n++) mkCop(n);

    /* ---------- ground contact for bodies that are not on rails ---------- */
    function ground(b, dt) {
      const fx = Math.sin(b.yaw), fz = Math.cos(b.yaw);
      G.surface(b.x, b.z, b.hint, sf); b.hint = sf.i; b.s = sf.s; b.d = sf.d; b.br = sf.br; b.road = sf.road;
      for (let si = 0; si < 2; si++) {
        if (!R.rail[si][sf.i]) continue;
        const side = si ? 1 : -1, off = R.railOff(sf.i), rel = side * sf.dm - off;
        if (Math.abs(rel) < 0.95 && b.dmP !== undefined) {
          R.frame(sf.s, f2);
          const push = ((side * b.dmP - off <= 0 ? -0.95 : 0.95) - rel) * side;
          b.x += f2.rx * push; b.z += f2.rz * push; sf.dm += push;
          const vn = b.vx * f2.rx + b.vz * f2.rz; if (vn * push < 0) { b.vx -= f2.rx * vn * 1.2; b.vz -= f2.rz * vn * 1.2; }
          if (b.mode === 'ai') { b.v *= 1 - Math.min(0.5, dt * 1.5); b.yaw += U.clamp(U.angDiff(Math.atan2(f2.tx * Math.sign(b.vx * f2.tx + b.vz * f2.tz || 1), f2.tz * Math.sign(b.vx * f2.tx + b.vz * f2.tz || 1)), b.yaw), -1, 1) * Math.min(1, dt * 6); }
        }
      }
      b.dmP = sf.dm;
      const y0 = sf.y, yF = G.surface(b.x + fx * 1.4, b.z + fz * 1.4, b.hint, sf2).y, yL = G.surface(b.x + fz * 0.8, b.z - fx * 0.8, b.hint, sf2).y;
      const k = Math.min(1, dt * 10 + (dt === 0 ? 1 : 0));
      b.y += (y0 - b.y) * Math.min(1, dt * 16 + (dt === 0 ? 1 : 0));
      b.pitch += (-Math.atan((yF - y0) / 1.4) - b.pitch) * k; b.roll += (Math.atan((yL - y0) / 0.8) - b.roll) * k;
      b.pitch = U.clamp(b.pitch, -0.7, 0.7); b.roll = U.clamp(b.roll, -0.7, 0.7);
    }
    function trees(b, rad) { // trunks, poles, piers
      const cx = Math.floor(b.x / 8), cz = Math.floor(b.z / 8); let hitV = 0;
      for (let a = -1; a <= 1; a++) for (let c2 = -1; c2 <= 1; c2++) {
        const l = G.colliders.get((cx + a) + ',' + (cz + c2)); if (!l) continue;
        for (let k = 0; k < l.length; k += 3) {
          const dx = b.x - l[k], dz = b.z - l[k + 1], rr = l[k + 2] + rad, d2 = dx * dx + dz * dz;
          if (d2 < rr * rr && d2 > 1e-6) {
            const d = Math.sqrt(d2), nx = dx / d, nz = dz / d; b.x += nx * (rr - d); b.z += nz * (rr - d);
            const vn = b.vx * nx + b.vz * nz; if (vn < 0) { b.vx -= nx * vn * 1.3; b.vz -= nz * vn * 1.3; b.vx *= 0.8; b.vz *= 0.8; hitV = Math.max(hitV, -vn); }
          }
        }
      }
      return hitV;
    }
    function show(b) {
      const r = b.m.root; r.position.set(b.x, b.y, b.z); r.rotation.set(b.pitch, b.yaw, b.roll);
      b.spin += b.v / b.m.r * (show.dt || 0); for (const w of b.m.wheels) w.rotation.x = b.spin;
    }
    /* ---------- civilians on rails: lane following, queueing, choosing a branch at forks ---------- */
    function laneStep(t, dt) {
      let vt = t.v0;
      const fx = Math.sin(t.yaw), fz = Math.cos(t.yaw);
      for (const o of V) {
        if (o === t || !o.on) continue;
        const rx = o.x - t.x, rz = o.z - t.z, a = rx * fx + rz * fz; if (a < 1 || a > 62) continue;
        const l = Math.abs(rx * fz - rz * fx);
        if (o.mode === 'lane') {
          if (o.dir !== t.dir || a > 32 || l > 2.6) continue; // (an oncoming car is merely passing in a bend)
          vt = Math.min(vt, Math.max(0, o.v - (30 - a) * 0.15 - (a < 9 ? 3 : 0)));
        } else {
          if (l > 1.25 + o.hw + (o.hl - o.hw) * Math.abs(Math.sin(o.yaw - t.yaw))) continue;
          vt = Math.min(vt, Math.max(0, o.vx * fx + o.vz * fz) + Math.sqrt(12 * Math.max(0, a - 8)));
        }
      }
      { const rx = P.x - t.x, rz = P.z - t.z, a = rx * fx + rz * fz, pvf = P.vx * fx + P.vz * fz;
        if (a > 1 && a < 28 && Math.abs(rx * fz - rz * fx) < 2.45 && pvf < t.v) vt = Math.min(vt, Math.max(0, pvf - 0.5 + (a - 9) * 0.5)); }
      t.v += U.clamp(vt - t.v, -11 * dt, 2.5 * dt); if (t.v < 0) t.v = 0;
      const F = R.forkOf(t.s);
      if (F !== t.fork) { t.fork = F; t.br = F && Math.random() < 0.4 ? 1 : 0; }
      R.frameOn(t.s, t.br, f);
      t.s = R.wrapS(t.s + t.dir * t.v * dt / (f.stretch || 1));
      R.frameOn(t.s, t.br, f);
      const d = t.dir * 1.85;
      t.x = f.x + f.rx * d; t.z = f.z + f.rz * d; t.y = f.y + f.bank * d; t.hint = f.i;
      t.yaw = Math.atan2(f.tx * t.dir, f.tz * t.dir); t.vx = f.tx * t.dir * t.v; t.vz = f.tz * t.dir * t.v; t.w = 0;
      t.pitch = -Math.atan(f.slope) * t.dir; t.roll = -f.bank * t.dir;
      t.m.body.position.y = Math.sin(t.s * 0.31) * 0.008; t.m.body.rotation.x = Math.sin(t.s * 0.23 + 1) * 0.004;
    }
    /* ---------- a body that has been knocked loose: slides, spins, scrubs speed on its tyres ---------- */
    function freeStep(b, dt) {
      const fx = Math.sin(b.yaw), fz = Math.cos(b.yaw), lx = fz, lz = -fx;
      let vf = b.vx * fx + b.vz * fz, vl = b.vx * lx + b.vz * lz;
      vl += U.clamp(-vl * 9, -8.5, 8.5) * (b.anchor ? 1.7 : 1) * dt;
      const brake = b.mode === 'wreck' || b.hp <= 0 || b.kind === 'civ' || b.anchor ? 6.5 : 2.6; // (anchor: it was standing as a roadblock when it was hit)
      vf -= Math.sign(vf) * Math.min(Math.abs(vf), brake * dt);
      b.vx = fx * vf + lx * vl; b.vz = fz * vf + lz * vl;
      b.w *= Math.exp(-dt * (Math.abs(vl) > 2 ? 1.2 : 3.2));
      const ox = b.x, oz = b.z, oy = b.y;
      b.yaw += b.w * dt; b.x += b.vx * dt; b.z += b.vz * dt;
      trees(b, 1.0);
      const st = Math.hypot(b.x - ox, b.z - oz);
      if (st > 0.02 && ((G.surface(b.x, b.z, b.hint, sf).y - oy) / st > 0.85 || (Math.abs(sf.d) > 55 && G.canopy(b.x, b.z, b.hint) > 0.05))) { b.x = ox; b.z = oz; b.vx *= -0.25; b.vz *= -0.25; } // steep bank or closed forest = wall
      b.v = vf;
      ground(b, dt);
    }
    /* ---------- collision of two oriented boxes: normal (from B to A), depth, contact point ---------- */
    function sat(A, B, o) {
      const afx = Math.sin(A.yaw), afz = Math.cos(A.yaw), bfx = Math.sin(B.yaw), bfz = Math.cos(B.yaw), dx = A.x - B.x, dz = A.z - B.z;
      let best = 1e9, nx = 0, nz = 0;
      for (let k = 0; k < 4; k++) {
        const ux = k === 0 ? afx : k === 1 ? afz : k === 2 ? bfx : bfz, uz = k === 0 ? afz : k === 1 ? -afx : k === 2 ? bfz : -bfx;
        const ra = A.hl * Math.abs(afx * ux + afz * uz) + A.hw * Math.abs(afz * ux - afx * uz), rb = B.hl * Math.abs(bfx * ux + bfz * uz) + B.hw * Math.abs(bfz * ux - bfx * uz);
        const dd = dx * ux + dz * uz, ov = ra + rb - Math.abs(dd);
        if (ov <= 0) return false;
        if (ov < best) { best = ov; const sg = dd < 0 ? -1 : 1; nx = ux * sg; nz = uz * sg; }
      }
      let cx = 0, cz = 0, cn = 0;
      for (let k = 0; k < 4; k++) {
        const sl = k & 1 ? 1 : -1, sw = k & 2 ? 1 : -1;
        let x = A.x + afx * A.hl * sl + afz * A.hw * sw, z = A.z + afz * A.hl * sl - afx * A.hw * sw;
        if (Math.abs((x - B.x) * bfx + (z - B.z) * bfz) <= B.hl + 0.03 && Math.abs((x - B.x) * bfz - (z - B.z) * bfx) <= B.hw + 0.03) { cx += x; cz += z; cn++; }
        x = B.x + bfx * B.hl * sl + bfz * B.hw * sw; z = B.z + bfz * B.hl * sl - bfx * B.hw * sw;
        if (Math.abs((x - A.x) * afx + (z - A.z) * afz) <= A.hl + 0.03 && Math.abs((x - A.x) * afz - (z - A.z) * afx) <= A.hw + 0.03) { cx += x; cz += z; cn++; }
      }
      o.nx = nx; o.nz = nz; o.pen = best;
      if (cn) { o.cx = cx / cn; o.cz = cz / cn; } else { o.cx = (A.x + B.x) / 2; o.cz = (A.z + B.z) / 2; }
      return true;
    }
    /* impulse exchange with friction; returns the normal impulse (kg m/s) */
    function resolve(A, B, c) {
      const ka = A.brace > 0 ? 2.6 : 1, kb = B.brace > 0 ? 2.6 : 1; // a roadblock car stands on its brakes: it takes the hit like something far heavier
      const ima = A.fixed ? 0 : 1 / (A.mass * ka), imb = B.fixed ? 0 : 1 / (B.mass * kb), iia = A.fixed ? 0 : 1 / (A.inertia * ka), iib = B.fixed ? 0 : 1 / (B.inertia * kb), tot = ima + imb;
      if (tot === 0) return 0;
      const push = Math.max(0, c.pen - 0.01);
      A.x += c.nx * push * ima / tot; A.z += c.nz * push * ima / tot; B.x -= c.nx * push * imb / tot; B.z -= c.nz * push * imb / tot;
      const rax = c.cx - A.x, raz = c.cz - A.z, rbx = c.cx - B.x, rbz = c.cz - B.z;
      const rvx = A.vx + A.w * raz - B.vx - B.w * rbz, rvz = A.vz - A.w * rax - B.vz + B.w * rbx, vn = rvx * c.nx + rvz * c.nz;
      if (vn >= 0) return 0;
      const can = raz * c.nx - rax * c.nz, cbn = rbz * c.nx - rbx * c.nz;
      const j = -1.18 * vn / (tot + can * can * iia + cbn * cbn * iib);
      const tx = -c.nz, tz = c.nx, vt = rvx * tx + rvz * tz, cat = raz * tx - rax * tz, cbt = rbz * tx - rbx * tz;
      const jt = U.clamp(-vt / (tot + cat * cat * iia + cbt * cbt * iib), -0.4 * j, 0.4 * j);
      const jx = c.nx * j + tx * jt, jz = c.nz * j + tz * jt;
      A.vx += jx * ima; A.vz += jz * ima; A.w += (raz * jx - rax * jz) * iia;
      B.vx -= jx * imb; B.vz -= jz * imb; B.w -= (rbz * jx - rbx * jz) * iib;
      return j;
    }
    const pb = { isPlayer: true, hw: 0.95, hl: 2.19, mass: 1700, inertia: 1700 * (0.95 * 0.95 + 2.19 * 2.19) / 3, x: 0, z: 0, yaw: 0, vx: 0, vz: 0, w: 0, fixed: false, mode: 'player', on: true };
    function knock(b, dv) { // a vehicle takes a hit of dv m/s
      if (b.isPlayer) return;
      b.hp -= b.kind === 'cop' ? (dv < 3 ? 0 : dv * 5.0) : dv * 7.5; // rubbing door to door costs a cruiser nothing (it is in contact every frame while it leans), a real crash does
      if (b.kind === 'cop') {
        if (b.hp <= 0 && b.mode !== 'wreck') { b.mode = 'wreck'; b.t = 0; S.wrecked++; fire(b.x, b.y + 0.9, b.z, b.vx, b.vz, 14, 1.3); G.sound.crash(16); }
        else if (b.mode !== 'wreck' && dv > 3) { b.anchor = b.brace > 0; b.mode = 'free'; b.freeT = U.clamp(0.35 + dv * 0.09, 0.4, 1.5); b.backT = 1.1; }
        else if (b.mode === 'ai') { // it keeps driving, but whatever the knock did to it stays: sideways speed (scrubbed off by its tyres) and spin
          const hx = Math.sin(b.yaw), hz = Math.cos(b.yaw);
          b.v = b.vx * hx + b.vz * hz; b.vl = b.vx * hz - b.vz * hx; b.wImp = U.clamp(b.w - (b.wCmd || 0), -2.5, 2.5);
        }
      } else if (b.mode !== 'wreck') { b.mode = 'free'; b.t = 0; }
    }
    function pair(A, B) {
      const dx = A.x - B.x, dz = A.z - B.z, rr = A.hl + B.hl + 0.6; if (dx * dx + dz * dz > rr * rr) return;
      if (!sat(A, B, hit)) return;
      // a civilian still on its rails only yields to a real hit; a light touch just stops the other car
      for (const X of [A, B]) {
        if (X.mode !== 'lane') { X.fixed = false; continue; }
        const O = X === A ? B : A, cl = Math.abs((A.vx - B.vx) * hit.nx + (A.vz - B.vz) * hit.nz);
        X.fixed = cl < 2.4 && !(O.kind === 'cop');
      }
      const vax = A.vx, vaz = A.vz, vbx = B.vx, vbz = B.vz;
      const j = resolve(A, B, hit); if (j <= 0) return;
      const dvA = Math.hypot(A.vx - vax, A.vz - vaz), dvB = Math.hypot(B.vx - vbx, B.vz - vbz), dv = Math.max(dvA, dvB);
      if (!A.fixed) knock(A, dvA); if (!B.fixed) knock(B, dvB);
      if (game.onHit) game.onHit(A, B, dvA, dvB); // test hook
      const pl = A.isPlayer || B.isPlayer, dP = Math.hypot(hit.cx - P.x, hit.cz - P.z);
      if (dv > 1.2 && dP < 90) {
        const y = (A.isPlayer ? P.y : A.y) + 0.55;
        FX.sparks(hit.cx, y, hit.cz, (vax + vbx) / 2, (vaz + vbz) / 2, Math.min(16, 3 + (dv * 1.6 | 0)), 2.5 + dv * 0.25);
        if (dv > 3 && G.smoke) for (let k = 0; k < 3; k++) G.smoke.emit(hit.cx, y, hit.cz, rand(-2, 2), rand(0.5, 1.5), rand(-2, 2), 0.7, 0.3, 0.5, 0.5, 0.5);
        G.sound.crash(dv * (pl ? 1 : 0.6) / (1 + dP * dP / 900));
      }
      if (pl) {
        const d = A.isPlayer ? dvA : dvB;
        cam.kick = Math.max(cam.kick, Math.min(1, d / 9));
        if (d > 3.2) hurt(Math.min(34, (d - 3.2) * 1.5), Math.min(1, 0.35 + d / 12), sideOf(hit.cx - P.x, hit.cz - P.z));
        { // which panel took it: the nose, or one flank
          const rx = hit.cx - P.x, rz = hit.cz - P.z, lf = rx * Math.sin(P.yaw) + rz * Math.cos(P.yaw), ll = rx * Math.cos(P.yaw) - rz * Math.sin(P.yaw);
          if (lf > 1.5) PN.hit('front', d); else if (Math.abs(ll) > 0.5 && lf > -1.9) PN.hit(ll > 0 ? 'L' : 'R', d);
          if (ll > 0.5 && d > 4) S.fallHit = true;
          const o2 = A.isPlayer ? B : A;
          if (o2.kind === 'cop' && lf < -1.4 && d > 0.6) { o2.backT = 0.9; o2.chg = false; o2.ramT = rand(3, 5.5) * (1.8 - 0.8 * lvl().ram); } // it has had its hit: drop back
        }
      }
    }

    /* ================= loose panels =================
       hood:  a hit on the nose springs it; the wind then holds it up against its stops, shivering, and at speed finally rips it off (so does another hit on the nose)
       doors: each takes the hits on its own side - enough of them and it swings open on a broken latch, more and it comes off */
    const PN = (function () {
      const src = G.car.parts, body = G.car.body, root = G.car.root, list = [], up = new THREE.Vector3(0, 1, 0), v3 = new THREE.Vector3(), ax = new THREE.Vector3(), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion();
      const OPEN = 4, OFF_DOOR = 16, OFF_HOOD = 13, WIND = 6; // (m/s of impact soaked up; seconds of full-speed wind)
      const mk = name => { const p = src[name], o = { name, g: p.g, home: p.home, c: p.c, sx: p.sx, dmg: 0, wind: 0, cool: 0, last: 0, st: 0, a: 0, av: 0, t: 0, deb: new THREE.Group(), v: new THREE.Vector3(), w: new THREE.Vector3(), rest: false, clk: 0 }; scene.add(o.deb); list.push(o); return o; };
      const hood = mk('hood'), dL = mk('doorL'), dR = mk('doorR');
      let tN = 0;
      function attach(o) {
        body.add(o.g); o.g.position.set(o.home[0], o.home[1], o.home[2]); o.g.quaternion.identity(); o.g.scale.set(1, 1, 1); o.g.visible = true;
        o.g.traverse(m => { if (m.isMesh) { m.layers.enable(2); m.castShadow = false; } });
        o.st = 0; o.a = 0; o.av = 0; o.t = 0; o.rest = false; o.dmg = 0; o.wind = 0; o.cool = 0; o.last = 0;
      }
      function detach(o, boom) {
        o.g.updateWorldMatrix(true, false);
        v3.set(o.c[0], o.c[1], o.c[2]); o.g.localToWorld(v3);
        v3.x += P.x - root.position.x; v3.y += P.y - root.position.y; v3.z += P.z - root.position.z; // (the model is still where the car was a frame ago)
        o.g.getWorldQuaternion(o.deb.quaternion); o.deb.position.copy(v3); o.deb.updateMatrixWorld(true);
        o.deb.add(o.g); o.g.position.set(-o.c[0], -o.c[1], -o.c[2]); o.g.quaternion.identity();
        o.g.traverse(m => { if (m.isMesh) { m.layers.disable(2); m.castShadow = true; } });
        const lx = Math.cos(P.yaw), lz = -Math.sin(P.yaw), k = boom ? 1.7 : 1;
        if (o.sx) o.v.set(P.vx * 0.84 + lx * o.sx * rand(2.5, 5) * k, rand(2, 4.5) * k, P.vz * 0.84 + lz * o.sx * rand(2.5, 5) * k);
        else o.v.set(P.vx * 0.5 + lx * rand(-1.2, 1.2), rand(6, 8.5) * k, P.vz * 0.5 + lz * rand(-1.2, 1.2));      // the wind takes the hood up and back over the car
        o.w.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(3, 7));
        if (!o.sx) o.w.addScaledVector(v3.set(lx, 0, lz), -7); else o.w.y -= o.sx * 4;
        o.st = 2; o.t = 0; o.rest = false; o.hint = P.hint;
        FX.sparks(o.deb.position.x, o.deb.position.y, o.deb.position.z, P.vx, P.vz, 8, 4); G.sound.crash(boom ? 4 : 9);
      }
      return {
        list,
        reset() { for (const o of list) attach(o); },
        peek() { return hood.st === 1 ? U.smooth(0.3, 0.75, hood.a) : 0; },
        gone(name) { const o = list.find(q => q.name === name); return !!o && o.st >= 2; },
        /* the car took a knock of dv m/s: where = 'front', 'L' or 'R' */
        hit(where, dv) {
          const o = where === 'front' ? hood : where === 'L' ? dL : dR; if (o.st >= 2 || dv < 1.5) return;
          dv = Math.min(dv, 8);                                   // one crash counts once, however long the car stays pressed against the thing
          if (o.cool > 0) { if (dv > o.last) { o.dmg += dv - o.last; o.last = dv; } } else { o.dmg += dv; o.last = dv; o.cool = 0.6; }
        },
        update(dt) {
          tN += dt;
          const sp = P.speed;
          for (const o of list) {
            o.cool -= dt;
            if (o.st === 0) {
              if (o.dmg >= OPEN || S.dead) { o.st = 1; o.t = 0; o.a = 0.06; o.av = o.sx ? 5 : 4.5; G.sound.crack(10); cam.kick = Math.max(cam.kick, 0.4); }
            } else if (o.st === 1) {
              o.t += dt; o.clk -= dt;
              const nz = Math.sin(tN * 9.1 + o.sx * 2) + Math.sin(tN * 14.7 + 1.3 + o.sx) + Math.sin(tN * 23.3 + o.sx * 4);
              if (o.sx) {
                // door on a broken latch: thrown open and shut by cornering, braking and the wind, bouncing off the frame and the hinge stop
                o.av += ((0.8 - o.a) * 14 - o.av * 1.6 - o.sx * P.latAcc * Math.cos(o.a) * 0.9 - P.acc * Math.sin(o.a) * 0.55 + nz * (2.5 + sp * 0.22)) * dt;
                o.a += o.av * dt;
                if (o.a < 0.03) { o.a = 0.03; if (o.av < -1.6 && o.clk <= 0) { G.sound.hit(8); o.clk = 0.25; } o.av = Math.abs(o.av) * 0.45; }
                if (o.a > 1.25) { o.a = 1.25; o.av = -Math.abs(o.av) * 0.4; }
                o.g.rotation.set(0, -o.sx * o.a, 0);
              } else {
                // hood: gravity drops it when the car is slow; at speed the wind gets under it and holds it hard against its stops, shivering more the longer it lasts
                const at = 0.1 + 1.02 * U.smooth(3, 17, sp);
                o.wind += U.smooth(19, 29, sp) * dt;
                o.av += ((at - o.a) * 70 - o.av * 10 + nz * (0.5 + sp * 0.07) * (1 + 2.5 * o.wind / WIND)) * dt;
                o.a += o.av * dt;
                if (o.a < 0.05) { o.a = 0.05; if (o.av < -1.6 && o.clk <= 0) { G.sound.hit(8); o.clk = 0.25; } o.av = Math.abs(o.av) * 0.3; }
                if (o.a > 1.16) { o.a = 1.16; o.av = -Math.abs(o.av) * 0.3; }
                o.g.rotation.set(-o.a, 0, 0);
              }
              if (S.dead || (o.sx ? o.dmg >= OFF_DOOR && o.t > 1.2 : (o.dmg >= OFF_HOOD && o.t > 0.8) || o.wind >= WIND)) detach(o, S.dead);
            } else if (o.st === 2) {
              o.t += dt;
              const p = o.deb.position;
              o.v.y -= 15 * dt; const dr = Math.exp(-dt * 0.7); o.v.x *= dr; o.v.z *= dr; p.addScaledVector(o.v, dt);
              const wl = o.w.length(); if (wl > 1e-3) { q1.setFromAxisAngle(ax.copy(o.w).multiplyScalar(1 / wl), wl * dt); o.deb.quaternion.premultiply(q1).normalize(); }
              const gy = G.surface(p.x, p.z, o.hint, sf2).y + (o.rest ? (o.sx ? 0.1 : 0.06) : 0.3); o.hint = sf2.i;
              if (p.y < gy) {
                p.y = gy;
                if (o.v.y < -2) { if (Math.hypot(p.x - P.x, p.z - P.z) < 60) G.sound.hit(-o.v.y); o.v.y *= -0.32; } else o.v.y = 0;
                const fr = Math.exp(-dt * 6); o.v.x *= fr; o.v.z *= fr; o.w.multiplyScalar(Math.exp(-dt * 5));
                if (o.v.x * o.v.x + o.v.z * o.v.z < 2 && wl < 2.5) o.rest = true;
              }
              if (o.rest) { // settle flat on the ground
                ax.set(0, 0, 1).applyQuaternion(o.deb.quaternion); q2.setFromAxisAngle(up, Math.atan2(ax.x, ax.z));
                if (o.sx) { ax.set(1, 0, 0).applyQuaternion(o.deb.quaternion); q2.multiply(q1.setFromAxisAngle(v3.set(0, 0, 1), ax.y >= 0 ? Math.PI / 2 : -Math.PI / 2)); }
                else { ax.set(0, 1, 0).applyQuaternion(o.deb.quaternion); if (ax.y < 0) q2.multiply(q1.setFromAxisAngle(v3.set(0, 0, 1), Math.PI)); }
                o.deb.quaternion.slerp(q2, Math.min(1, dt * 9)); o.w.set(0, 0, 0);
                if (o.deb.quaternion.angleTo(q2) < 0.02 && o.v.lengthSq() < 0.05) o.st = 3;
              }
            }
          }
        },
      };
    })();
    this.panels = PN;

    /* ================= damage, death, restart ================= */
    const sideOf = (dx, dz) => { const l = dx * Math.cos(P.yaw) - dz * Math.sin(P.yaw), n = Math.hypot(dx, dz) || 1; return l / n > 0.3 ? -1 : l / n < -0.3 ? 1 : 0; };
    /* flash: how hard the screen edges flare red (0..1); side: -1 the hit came from the left, +1 from the right, 0 / undefined both */
    function hurt(d, flash, side) {
      if (S.dead || d <= 0) return;
      const f = flash === undefined ? 0.5 : flash;
      if (G.touchMode) d *= 0.65;
      S.hp -= d; S.calm = 0; S.flash = Math.max(S.flash, f * 0.6); if (side) S.lastSide = side;
      if (side !== 1) S.flashL = Math.max(S.flashL, side ? Math.min(1, f * 1.5) : f); if (side !== -1) S.flashR = Math.max(S.flashR, side ? Math.min(1, f * 1.5) : f);
      if (S.hp <= 0) { S.hp = 0; die(); }
    }
    function die() {
      S.dead = true; S.deadT = 0; G.dead = true; game.timeScale = 0.22;
      fire(P.x, P.y + 0.8, P.z, P.vx, P.vz, 26, 1.6); FX.sparks(P.x, P.y + 0.8, P.z, P.vx, P.vz, 24, 7);
      G.sound.crash(22); cam.kick = 1; P.vy += 2.2;
      api.input.up = api.input.down = api.input.left = api.input.right = api.input.hand = 0;
    }
    this.hurt = hurt;
    /* held out at five stars: the cruisers give up */
    function win() {
      S.won = true; S.wonT = 0; S.free = false; G.won = true; S.pursuit = false; game.timeScale = 0.3; TR.clear();
      api.input.up = api.input.down = api.input.left = api.input.right = api.input.hand = 0; P.auto = true; G.lookBack = false; // the car drives itself while the panel is up
    }
    this.keepDriving = function () { if (!S.won) return; S.free = true; G.won = false; hud(true); };
    this.restart = function () {
      S.hp = 100; S.dead = false; S.deadT = 0; G.dead = false; game.timeScale = 1; S.pursuit = false; S.arm = S.police ? 2.5 : -1; S.heat = 0; S.heatT = 0; S.time = 0; S.dist = 0; S.wrecked = 0; S.flash = S.flashL = S.flashR = 0; S.spawnT = 0; S.blockT = 25; S.dirP = 1; S.surv = survive(); S.won = false; S.wonT = 0; S.free = false; G.won = false; endIntro(true);
      for (const c of cops) { c.on = false; c.mode = 'off'; c.m.root.visible = false; }
      for (const t of civs) placeCiv(t, t.home);
      TR.clear(); G.camOrbit = 0; P.yawImp = 0; P.imp = 0; PN.reset(); S.lastSide = 0; G.lookBack = false; G.autoV = 0; S.fallT = 0; S.fallHit = false; if (G.people) G.people.seat();
      api.placeOnRoad(R.start, 21.5); P.auto = true;
      if (G.posts) G.posts.reset();
      hud(true);
    };
    this.setPolice = function (on) {
      S.police = on ? 1 : 0;
      if (on && !S.pursuit && S.intro <= 0 && !S.dead) S.arm = 3;
      if (!on) { for (const c of cops) { c.on = false; c.mode = 'off'; c.m.root.visible = false; } S.pursuit = false; S.arm = -1; S.heat = 0; TR.clear(); hud(true); }
    };

    /* ================= police ================= */
    /* jobs: two cruisers come alongside (one per side) and lean on the car, one gets in front and brake-checks it, one sits on its tail */
    function assignRole(c) {
      const used = {}; for (const o of cops) if (o !== c && o.on && o.mode !== 'wreck') used[o.role + (o.role === 'side' ? o.sd : '')] = 1;
      const order = S.heat >= 4 ? ['side1', 'side-1', 'front', 'tail'] : ['tail', 'side1', 'side-1', 'front']; // early on the first car just follows
      let r = order.find(k => !used[k]) || 'tail'; if (r === 'front' && !lvl().brake) r = 'tail';
      c.role = r.startsWith('side') ? 'side' : r; c.sd = r === 'side-1' ? -1 : r === 'front' ? (Math.random() < 0.5 ? 1 : -1) : 1;
      c.ph = 0; c.phT = 0; c.brk = false; c.holdT = 0;
    }
    const sideTaken = (c, sd) => cops.some(o => o !== c && o.on && o.mode !== 'wreck' && o.role === 'side' && o.sd === sd);
    function resetCop(c) {
      c.vx = Math.sin(c.yaw) * c.v; c.vz = Math.cos(c.yaw) * c.v; c.w = 0; c.vl = 0; c.wImp = 0; c.wCmd = 0; c.anchor = false; c.brace = 0; c.hp = 100; c.on = true; c.m.root.visible = true; c.pitch = c.roll = 0; c.dmP = undefined;
      c.fireT = rand(1.5, 3); c.burst = 0; c.stuck = 0; c.backT = 0; c.revT = 0; c.t = 0; c.smokeT = 0; c.ramT = rand(2, 5);
      assignRole(c); ground(c, 0);
    }
    function placeBehind(c, gapM, lane) { // straight onto the road behind the car (opening shot)
      R.frame(P.s - S.dirP * gapM, f);
      c.x = f.x + f.rx * lane; c.z = f.z + f.rz * lane; c.y = f.y; c.hint = f.i; c.yaw = Math.atan2(f.tx * S.dirP, f.tz * S.dirP); c.v = Math.hypot(P.vx, P.vz); c.mode = 'ai'; c.fork = null; c.wantBr = 0;
      resetCop(c); c.lane = lane;
    }
    function spawnCop(c, block) {
      const dP = S.dirP, Fp = R.forkOf(P.s);
      let s = P.s + dP * (block ? rand(250, 300) : -rand(70, 95)), ok = false;
      for (let n = 0; n < 5 && !ok; n++) {
        const Fs = R.forkOf(s), br = Fs && Fs === Fp && P.br ? 1 : 0;
        R.frameOn(s, br, f); c.wantBr = br; c.fork = Fs;
        const lane = dP * 1.85; c.x = f.x + f.rx * lane; c.z = f.z + f.rz * lane; ok = true;
        for (const o of V) if (o !== c && o.on && Math.hypot(o.x - c.x, o.z - c.z) < 10) ok = false;
        if (R.onBridge(R.wrapS(s)) && block) ok = false;
        if (!ok) s += dP * (block ? 22 : -18);
      }
      c.yaw = Math.atan2(f.tx * dP, f.tz * dP); c.hint = f.i; c.y = f.y; c.pitch = c.roll = 0; c.dmP = undefined;
      if (block) { // square across the road, nose towards the centre line, covering the car's lane
        const lane = dP * 1.2; c.x = f.x + f.rx * lane; c.z = f.z + f.rz * lane;
        c.yaw = Math.atan2(-dP * f.rx, -dP * f.rz); c.v = 0; c.mode = 'block'; c.seen = undefined;
      } else { c.v = U.clamp(P.speed + 7, 24, 58); c.mode = 'ai'; }
      resetCop(c);
    }
    function copAI(c, dt) {
      const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), dx = P.x - c.x, dz = P.z - c.z, dist = Math.hypot(dx, dz), gap = R.dS(P.s, c.s);
      const behind = gap * S.dirP; // metres of road the cruiser is behind the car (negative: it is ahead of it)
      let tx, tz, vt;
      c.holdT -= dt;
      let onc = false; // is something coming the other way, close enough to matter?
      for (const o of V) { if (!o.on || o.mode !== 'lane' || o.dir !== -S.dirP) continue; const g = R.dS(o.s, c.s) * S.dirP; if (g > 0 && g < (c.v + o.v) * 2.8 + 20 && (!o.br || o.br === c.br)) { onc = true; break; } }
      const own = S.dirP * 1.85; // centre of the lane that runs the car's way
      if (S.dead || S.won) { tx = c.x + fx * 10; tz = c.z + fz * 10; vt = 0; }
      else if (S.intro > 0 || c.holdT > 0) {
        // opening shot and the first moments after it: in formation behind the car, closing in
        R.frameOn(c.s + S.dirP * (9 + c.v * 0.45), 0, f);
        const lane = onc ? own : c.lane + (S.intro > 0 ? Math.sin(S.introT * 2.6 + c.slot * 2) * 0.9 : 0);
        tx = f.x + f.rx * lane; tz = f.z + f.rz * lane;
        vt = U.clamp(P.speed + (behind - c.gapT) * 0.8, 0, VCOP);
      } else if (dist < 75 && behind > -60 && behind < 95) {
        // position wanted in the car's own frame: aT metres ahead of it, lT metres to its left
        const pfx = Math.sin(P.yaw), pfz = Math.cos(P.yaw), ps = P.speed, hx = ps > 5 ? P.vx / ps : pfx, hz = ps > 5 ? P.vz / ps : pfz, lx = hz, lz = -hx;
        const along = -(dx * hx + dz * hz), latL = -(dx * lx + dz * lz), pvf = P.vx * fx + P.vz * fz;
        const room = l => Math.abs(P.d - l * S.dirP) < 3.9; // is there road at that offset from the car? (rails and banks start just past the edge)
        let aT, lT, look = 7 + c.v * 0.2;
        const L = lvl(), lean = L.lean * soft(), ram = L.ram * soft();
        c.phT -= dt; c.ramT -= dt; if (c.ramT < -2.6) { c.ramT = rand(3, 5.5) * (1.8 - 0.8 * L.ram); c.chg = Math.random() < U.clamp((L.ram - 0.45) * 1.2, 0, 0.7) * soft(); }
        // the car on the tail: hangs back; when the level allows it, comes in every so often - close enough to touch only higher up
        const tapping = ram > 0 && !(c.ramT > 0 || c.backT > 0), tailA = tapping ? -U.lerp(4.85, 3.6, ram) : -L.hang; // nose into the bumper: a touch low down, a shunt at the top
        if (c.role === 'side') {
          let sd = c.sd;
          if (c.ph !== 1 && !room(sd * 3.05) && room(-sd * 3.05) && !sideTaken(c, -sd)) sd = c.sd = -sd;
          if (c.backT > 0 && c.ph === 1) { c.ph = 2; c.phT = rand(1.2, 2.2); }
          if (c.ph === 0) { aT = 0.4; lT = sd * 3.05; if (lean > 0 && Math.abs(along - aT) < 1.8 && Math.abs(latL - lT) < 0.85) { c.ph = 1; c.phT = rand(0.7, 1.25) * (0.55 + 0.45 * lean); } } // draw level, door to door
          else if (c.ph === 1) { aT = 0.5; lT = sd * U.lerp(2.05, 1.45, lean); look = 10 + c.v * 0.22; if (c.phT <= 0 || Math.abs(P.d) > 4.5) { c.ph = 2; c.phT = rand(1.3, 2.6) * (2.2 - 1.2 * lean); } }  // swerve in: a brush at three stars, a full shove at five (once the car is on the shoulder the job is done)
          else { aT = 0.2; lT = sd * 3.4; if (c.phT <= 0) c.ph = 0; }                                                                                        // ease off, then again
          if (c.ph !== 1 && !room(sd * 3.05)) { aT = tailA; lT = sd * 0.5; } // no room on that side right now: work on the tail instead
        } else if (c.role === 'front') {
          if (along < 6.5) { // overtake wide
            let sd = Math.abs(latL) > 1.6 ? Math.sign(latL) : c.sd; if (Math.abs(latL) < 1.6 && !room(sd * 3.1) && room(-sd * 3.1)) sd = -sd;
            c.sd = sd; aT = 12; lT = sd * 3.1; if (!room(sd * 3.1)) { aT = -10; lT = 0; } c.brk = false; c.phT = rand(1, 2);
          } else { aT = 10; lT = 0; if (c.phT <= 0) { c.brk = !c.brk; c.phT = c.brk ? rand(0.9, 1.5) : rand(2.5, 4.5) * (2 - soft()); } } // in front: brake-check every few seconds
        } else {
          // the car on the tail: between taps it rides on the rear quarter, where the player can see it (straight behind it would be out of sight behind the camera)
          if (!tapping && (sideTaken(c, c.side) || !room(c.side * 2.7)) && !sideTaken(c, -c.side) && room(-c.side * 2.7)) c.side = -c.side;
          if (tapping) { aT = tailA; lT = c.side * 0.3; }
          else if (!sideTaken(c, c.side) && room(c.side * 2.7)) { aT = -3.1; lT = c.side * 2.7; }
          else { aT = -L.hang; lT = c.side * 0.35; }
        }
        if (onc && (P.d - lT * S.dirP) * S.dirP < 0.6 && !(c.role === 'side' && c.ph === 1)) { aT = Math.min(aT, -8); lT = 0; if (c.ph === 0) c.phT = 0; } // the place it wants is in the oncoming lane: drop in behind the car until the road is clear
        if (Math.abs(lT) > 2 && along < -3.9 && Math.abs(latL) < 2.25) aT = Math.min(aT, -7.5); // still tucked in behind: pull out to the side first, then draw level
        if (dist > 26) {
          // closing in: stay on the road (a straight line to the car would cut across the outside of every bend), in the lane the move starts from
          const Fc = R.forkOf(c.s), br = Fc && Fc === R.forkOf(P.s) ? P.br : Fc ? c.wantBr : 0;
          R.frameOn(c.s + S.dirP * (9 + c.v * 0.45), br, f);
          let lat = U.clamp(P.d - (Math.abs(lT) > 2 ? lT : 0) * S.dirP, -3.4, 3.4); if (onc && lat * S.dirP < 0.6) lat = own;
          tx = f.x + f.rx * lat; tz = f.z + f.rz * lat;
          vt = U.clamp(P.speed + U.clamp((behind + aT) * 0.7, -12, 12) + 1, 0, VCOP);
          const cv = Math.abs(f.curv); if (cv > 1e-4) vt = Math.min(vt, Math.sqrt(21 / cv));
        } else {
          tx = P.x + hx * (along + look) + lx * lT; tz = P.z + hz * (along + look) + lz * lT;
          vt = U.clamp(pvf + U.clamp((aT - along) * 1.6, -9, 8), 0, VCOP);
          if (c.chg && tapping && Math.abs(latL) < 1.3 && along < -3.9) vt = pvf + (2.5 + 4 * ram); // the charge: it keeps its speed up all the way into the bumper
          if (c.role === 'front' && c.brk && along > 6.5) vt = Math.max(6, pvf - 8);
        }
        // a stopped car: boxed in at five stars; below that they hold off, and any cruiser sitting right on it backs away to let it get going again
        if (ps < 3) { if (S.heat >= 5) { if (dist < 13) vt = 0; } else if (dist < 10) { vt = -5; c.back = true; } else if (dist < 20) vt = 0; }
      } else {
        // far: follow the road towards the car, on whichever branch it took
        const dirS = gap >= 0 ? 1 : -1, F = R.forkOf(c.s);
        if (F !== c.fork) { c.fork = F; c.wantBr = F && R.forkOf(P.s) === F ? P.br : 0; }
        R.frameOn(c.s + dirS * (10 + c.v * 0.55), c.wantBr, f);
        const lane = dirS * 1.85;
        tx = f.x + f.rx * lane; tz = f.z + f.rz * lane;
        vt = Math.min(VCOP + (Math.abs(gap) > 110 ? 10 : 0), Math.max(P.speed + 16, 34) + Math.abs(gap) * 0.12);
        const cv = Math.abs(f.curv); if (cv > 1e-4) vt = Math.min(vt, Math.sqrt(21 / cv));
        if (f.br && f.stretch) vt = Math.min(vt, 34);
      }
      // go round whatever is in the way (positions compared along the road: on a bend nothing is dead ahead until it is too late)
      {
        R.frameOn(c.s, c.br, f2);
        const td = fx * f2.tx + fz * f2.tz >= 0 ? 1 : -1; let av = 0, ad = 99, an = 99;
        for (const o of V) {
          if (o === c || !o.on) continue;
          const g = R.dS(o.s, c.s) * td; if (g < 2 || g > 150) continue;
          if ((o.br || 0) !== (c.br || 0) && R.forkOf(o.s)) continue;
          const vs = (o.mode === 'lane' ? o.dir * o.v : o.vx * f2.tx + o.vz * f2.tz) * td, cs = c.v - vs; if (cs < 0.5) continue;
          const ttc = g / cs; if (ttc > 2.4 && g > 8) continue;
          const dl = (o.mode === 'lane' ? o.dir * 1.85 : o.d) - c.d; if (Math.abs(dl) > 2.5) continue;
          if (ttc < ad) { ad = ttc; an = g; av = dl >= 0 ? -1 : 1; }
        }
        if (av) {
          if (Math.abs(c.d + av * 3.6) > 3.9 && Math.abs(c.d - av * 3.6) < 3.9) av = -av; // stay on the road if the other side is open
          tx += f2.rx * av * 3.6; tz += f2.rz * av * 3.6; if (an < 14) vt = Math.min(vt, Math.max(8, c.v - 4));
        }
      }
      if (!c.road) vt = Math.min(vt, 27);
      let a = U.angDiff(Math.atan2(tx - c.x, tz - c.z), c.yaw);
      if (c.back) { a = 0; c.back = false; }
      if (c.revT > 0) { vt = -6; a = -a; }
      const sp = Math.abs(c.v);
      if (Math.abs(a) > 1.9 && sp < 9 && c.revT <= 0) { c.yaw += Math.sign(a) * 2.4 * dt; vt = 4; a = 0; } // spin the car round
      const lim = Math.min(0.6, Math.atan(2.8 * 22 / Math.max(1, sp * sp)));
      const st = U.clamp(Math.atan(2 * 2.8 * Math.sin(a) / Math.max(4, Math.hypot(tx - c.x, tz - c.z))), -lim, lim);
      c.v += U.clamp(vt - c.v, -16 * dt, (c.road ? 12 : 6) * (1 - Math.pow(Math.max(0, c.v) / (VCOP + 16), 2)) * dt);
      c.vl += U.clamp(-c.vl * 12, -12, 12) * dt;             // sideways slide left over from being hit: its tyres have less bite than the player's
      c.wImp *= Math.exp(-dt * 5);
      c.wCmd = c.v / 2.8 * Math.tan(st); c.w = c.wCmd + c.wImp;
      const ox = c.x, oz = c.z, oy = c.y;
      c.yaw += c.w * dt;
      { const hx = Math.sin(c.yaw), hz = Math.cos(c.yaw); c.vx = hx * c.v + hz * c.vl; c.vz = hz * c.v - hx * c.vl; }
      c.x += c.vx * dt; c.z += c.vz * dt;
      const hv = trees(c, 1.0); if (hv > 0.5) { c.v *= 0.55; c.hp -= hv * 0.6; }
      const stp = Math.hypot(c.x - ox, c.z - oz);
      if (stp > 0.02 && ((G.surface(c.x, c.z, c.hint, sf).y - oy) / stp > 0.85 || (Math.abs(sf.d) > 55 && G.canopy(c.x, c.z, c.hint) > 0.05))) { c.x = ox; c.z = oz; c.v *= 0.4; }
      ground(c, dt);
      // stuck: back up, and if that does not help either, the director replaces the car
      if (sp < 2 && Math.abs(vt) > 6 && !S.dead) c.stuck += dt; else c.stuck = Math.max(0, c.stuck - dt * 2);
      if (c.stuck > 1.6 && c.revT <= 0) { c.revT = 1.3; }
      c.revT -= dt; c.backT -= dt;
    }
    function shoot(c, dt, dist) {
      c.fireT -= dt;
      if (c.burst > 0) {
        c.shotT -= dt;
        if (c.shotT <= 0) {
          c.shotT = 0.115; c.burst--;
          const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), rgx = -fz, rgz = fx, sd = ((P.x - c.x) * rgx + (P.z - c.z) * rgz) >= 0 ? 1 : -1;
          const ox = c.x + rgx * sd * 0.98 + fx * 0.35, oy = c.y + 1.12, oz = c.z + rgz * sd * 0.98 + fz * 0.35;
          const tof = dist / 270, rel = Math.hypot(P.vx - c.vx, P.vz - c.vz);
          const spread = (0.04 + rel * 0.0012) * (1.3 - 0.08 * S.heat) * dist + 0.55; // even at point-blank range not every round lands
          const e1 = (Math.random() + Math.random() + Math.random() - 1.5) * 1.15 * spread, e2 = (Math.random() + Math.random() - 1) * 0.6 * spread;
          const ax = P.x + P.vx * tof - c.x, az = P.z + P.vz * tof - c.z, al = Math.hypot(ax, az) || 1;
          let ex = P.x + P.vx * tof + (-az / al) * e1, ey = P.y + 0.72 + e2, ez = P.z + P.vz * tof + (ax / al) * e1;
          const isHit = Math.abs(e1) < 1.05 && Math.abs(e2) < 0.5;
          if (!isHit) { const k = 1 + 14 / Math.max(6, dist); ex = ox + (ex - ox) * k; ey = Math.max(P.y + 0.02, oy + (ey - oy) * k); ez = oz + (ez - oz) * k; }
          TR.add(ox, oy, oz, ex, ey, ez, isHit ? 0.6 + 0.05 * S.heat : 0);
          FX.emit(ox, oy, oz, c.vx, 0, c.vz, 0.42, 0.05, 8, 5.5, 2, 0);
          G.sound.shot(dist);
        }
      } else if (c.fireT <= 0 && S.fireCd <= 0) { const fr = lvl().fire * soft(); c.burst = S.heat >= 4 ? 3 : 2; c.shotT = 0; c.fireT = (rand(3.5, 6) - 0.3 * S.heat) / fr; S.fireCd = (2.4 - 0.2 * S.heat) / fr; } // one cruiser at a time, with pauses
    }
    function startPursuit() { S.pursuit = true; S.heat = 1; S.heatT = 0; S.spawnT = 0; S.blockT = 24; S.arm = -1; }
    /* ---- opening shot: the camera starts in front of the car, looking back at the cruisers behind it, and swings round to the driving position ---- */
    function endIntro(quiet) {
      if (S.intro <= 0 && !G.intro) return;
      S.intro = 0; G.intro = null; document.body.classList.remove('intro');
      if (quiet) return;
      if (S.police) { startPursuit(); cops.forEach((c, k) => { if (c.on) c.holdT = 0.3 + k * 0.5; }); /* they come up to the car straight after the opening shot */ }
      const i = api.input; if (i.up || i.down || i.left || i.right || i.hand) P.auto = false;
      hud(true);
    }
    this.intro = function () {
      S.intro = 1; S.introT = 0; S.introFast = false; document.body.classList.add('intro');
      const sp = 30; G.autoV = sp; P.vx = Math.sin(P.yaw) * sp; P.vz = Math.cos(P.yaw) * sp;
      // first shot: from the roadside ahead, on the far side from the car's lane
      R.frame(P.s + S.dirP * 43, f);
      const d = -S.dirP * 6.3, cx = f.x + f.rx * d, cz = f.z + f.rz * d;
      G.intro = { k: 0, px: cx, py: Math.max(G.surface(cx, cz, f.i, sf).y, f.y - 0.4) + 0.62, pz: cz };
      if (S.police) for (let k = 0; k < 2; k++) { placeBehind(cops[k], 15 + k * 11, k ? -1.85 : 1.85); cops[k].gapT = 9 + k * 8; cops[k].ramT = 1 + k * 3; }
    };
    this.skipIntro = function () { if (S.intro > 0) S.introFast = true; };
    function police(dt) {
      if (!S.police) return;
      if (S.dead) { for (const c of cops) if (c.on) { if (c.mode === 'ai') copAI(c, dt); else if (c.mode !== 'block') freeStep(c, dt); } return; } // they pull up around the wreck
      if (S.won) { // they have given up: lights out, coast to a stop, gone once the car is out of sight
        for (const c of cops) if (c.on) { if (c.mode === 'ai') copAI(c, dt); else if (c.mode !== 'block') freeStep(c, dt); if (Math.hypot(c.x - P.x, c.z - P.z) > 260) { c.on = false; c.mode = 'off'; c.m.root.visible = false; } }
        return;
      }
      S.fireCd -= dt;
      if (!S.pursuit) {
        if (S.intro > 0) { for (const c of cops) if (c.on && c.mode === 'ai') copAI(c, dt); return; }
        if (S.arm < 0) return;
        S.arm -= dt; if (S.arm > 0) return;
        startPursuit();
      }
      S.heatT += dt; { let h = 1; for (const th of HEAT) if (S.heatT >= th) h++; S.heat = h; }
      if (S.heat >= 5) { S.surv -= dt; if (S.surv <= 0) { win(); return; } }
      const want = Math.min(lvl().cops, G.touchMode ? 3 : 4);
      let n = 0; for (const c of cops) if (c.on && c.mode !== 'wreck') n++;
      S.spawnT -= dt; S.blockT -= dt;
      if (n < want && S.spawnT <= 0) {
        const c = cops.find(o => !o.on);
        if (c) { const block = S.blockT <= 0 && P.speed > 15 && S.heat >= 2; if (block) S.blockT = rand(20, 32); spawnCop(c, block); S.spawnT = 3.5; }
      }
      for (const c of cops) {
        if (!c.on) continue;
        const dist = Math.hypot(P.x - c.x, P.z - c.z), gap = R.dS(P.s, c.s);
        c.brace = c.mode === 'block' ? 0.9 : (c.brace || 0) - dt; // still braced for a moment after it stops being a roadblock (it turns to give chase just before the car reaches it)
        if (c.mode === 'block') {
          {
            // how hard it works to stay in the way depends on the wanted level: two stars - it just stands there; three - it edges across;
            // four - it moves smartly; five - it also reads where the car is heading
            const lv = S.heat - (G.touchMode ? 1 : 0), vmax = lv <= 2 ? 0 : lv === 3 ? 1.8 : lv === 4 ? 3.4 : 5.6, acc = lv === 3 ? 2.5 : lv === 4 ? 6 : 11, togo = -gap * S.dirP;
            const hx = Math.sin(c.yaw), hz = Math.cos(c.yaw); let vt = 0;
            if (vmax > 0 && togo < 190 && c.d !== undefined) {
              R.frameOn(c.s, c.br, f);
              const vd = P.vx * f.rx + P.vz * f.rz, lead = lv >= 5 ? Math.min(togo / Math.max(8, P.speed), 1.1) : lv === 4 ? Math.min(togo / Math.max(8, P.speed), 0.4) : 0;
              if (c.seen === undefined) c.seen = P.d; c.seen += (P.d - c.seen) * Math.min(1, dt * (lv === 3 ? 1.6 : lv === 4 ? 3.5 : 9)); // reaction lag
              const want = U.clamp(c.seen + vd * lead, -3.0, 3.0), err = (want - c.d) * (hx * f.rx + hz * f.rz >= 0 ? 1 : -1);
              if (Math.abs(err) > 0.3) vt = U.clamp(err * 2.4, -vmax, vmax);
            }
            c.v += U.clamp(vt - c.v, -acc * dt, acc * dt);
            c.x += hx * c.v * dt; c.z += hz * c.v * dt; c.vx = hx * c.v; c.vz = hz * c.v; c.w = 0;
          }
          ground(c, dt);
          if (gap * S.dirP > -7 || dist < 9 || c.hp < 100) { c.mode = 'ai'; c.stuck = 0; } // the car got past (or hit) the roadblock
        } else if (c.mode === 'ai') copAI(c, dt);
        else if (c.mode === 'free') { freeStep(c, dt); c.freeT -= dt; if (c.freeT <= 0 && Math.abs(c.w) < 2.2) { c.mode = 'ai'; c.v = c.vx * Math.sin(c.yaw) + c.vz * Math.cos(c.yaw); c.vl = c.vx * Math.cos(c.yaw) - c.vz * Math.sin(c.yaw); c.wImp = 0; c.stuck = 0; } }
        else if (c.mode === 'wreck') {
          freeStep(c, dt); c.t += dt; c.smokeT -= dt;
          if (c.smokeT <= 0 && dist < 160) { c.smokeT = 0.07; fire(c.x + Math.sin(c.yaw) * 1.5, c.y + 0.85, c.z + Math.cos(c.yaw) * 1.5, c.vx, c.vz, 1, 0.9); }
          if (c.t > 16 || (c.t > 5 && dist > 130)) { c.on = false; c.mode = 'off'; c.m.root.visible = false; }
          continue;
        }
        // nobody is left behind: a cruiser that falls too far back, or wedges itself somewhere, is replaced
        if (dist > 330 || Math.abs(gap) > 330 || c.stuck > 5 || c.hp <= 0 && c.mode !== 'wreck') {
          if (c.hp <= 0) { c.mode = 'wreck'; c.t = 0; S.wrecked++; } else { c.on = false; c.mode = 'off'; c.m.root.visible = false; S.spawnT = Math.min(S.spawnT, 1); }
          continue;
        }
        if (dist < 48 && c.mode !== 'free' && c.holdT <= 0 && lvl().fire > 0 && (S.heat >= 5 || P.speed > 4)) { // (below five stars they hold their fire on a car that has stopped)
          const ang = Math.abs(U.angDiff(Math.atan2(P.x - c.x, P.z - c.z), c.yaw));
          if (ang < 2.1 || c.mode === 'block') shoot(c, dt, dist);
        }
      }
    }

    /* ================= HUD (health, pursuit level, damage flash, game over) ================= */
    const el = id => document.getElementById(id);
    const hpFill = el('hpFill'), hpBox = el('hp'), stars = el('stars'), dmg = el('dmg'), dmgL = el('dmgL'), dmgR = el('dmgR'), over = el('over'), overStats = el('overStats'), overTitle = el('overTitle'), overBtn = el('overBtn'), overKeys = el('overKeys'), goal = el('goal');
    let lastGoal = '', lastHp = -1, lastHeat = -1, lastOver = false, lastFlash = -1, lastL = -1, lastR = -1, lastRad = -1;
    const mmss = t => Math.floor(t / 60) + ':' + ('0' + Math.floor(t % 60)).slice(-2);
    function hud(force) {
      const hp = Math.ceil(S.hp);
      if (hp !== lastHp || force) { lastHp = hp; hpFill.style.width = hp + '%'; hpBox.classList.toggle('low', hp <= 30); }
      const heat = S.pursuit ? S.heat : 0;
      if (heat !== lastHeat || force) {
        stars.classList.toggle('on', heat > 0);
        for (let k = 0; k < 5; k++) stars.children[k].className = k < heat ? (k >= lastHeat && lastHeat >= 0 && !force ? 'on new' : 'on') : '';
        lastHeat = heat;
      }
      // red at the edges of the screen: a flare on the side a hit came from, and a standing glow that deepens and creeps inwards as the car falls apart
      const low = S.dead ? 1 : U.clamp((82 - S.hp) / 82, 0, 1), beat = S.hp < 40 && !S.dead ? (0.5 + 0.5 * Math.sin(performance.now() * (0.005 + 0.006 * (1 - S.hp / 40)))) * (0.1 + 0.14 * (1 - S.hp / 40)) : 0;
      const fl = Math.round(Math.min(1, low * 0.72 + beat + S.flash) * 25), rad = Math.round(66 - 22 * low);
      if (fl !== lastFlash) { lastFlash = fl; dmg.style.opacity = (fl / 25).toFixed(2); }
      if (rad !== lastRad) { lastRad = rad; dmg.style.setProperty('--r', rad + '%'); }
      const fL = Math.round(S.flashL * 20), fR = Math.round(S.flashR * 20);
      if (fL !== lastL) { lastL = fL; dmgL.style.opacity = (fL / 20).toFixed(2); }
      if (fR !== lastR) { lastR = fR; dmgR.style.opacity = (fR / 20).toFixed(2); }
      const gt = S.pursuit && S.heat >= 5 && !S.dead ? 'Hold out ' + mmss(Math.max(0, Math.ceil(S.surv))) : '';
      if (gt !== lastGoal || force) { lastGoal = gt; goal.textContent = gt; goal.classList.toggle('on', !!gt); }
      const ov = S.dead ? S.deadT > 1.6 : S.won && !S.free && S.wonT > 1.1;
      if (ov !== lastOver || force) {
        lastOver = ov; over.classList.toggle('on', ov); over.classList.toggle('win', ov && S.won); document.body.classList.toggle('over', ov);
        if (ov) {
          const tail = mmss(S.time) + '  \u00B7  ' + (S.dist / 1609.34).toFixed(1) + ' mi  \u00B7  ' + S.wrecked + (S.wrecked === 1 ? ' cruiser' : ' cruisers') + ' wrecked';
          overTitle.textContent = S.won ? 'You got away' : 'Wrecked'; overStats.textContent = (S.won ? 'Five stars outlasted  \u00B7  ' : 'Survived ') + tail;
          overBtn.textContent = S.won ? 'Play again' : 'Restart'; overKeys.textContent = S.won ? 'Enter: play again  \u00B7  Esc: keep driving' : 'Enter or R';
        }
      }
    }
    el('overBtn').addEventListener('click', e => { game.restart(); e.stopPropagation(); });
    el('overBtn').addEventListener('touchstart', e => { game.restart(); e.preventDefault(); }, { passive: false });
    for (const ev of ['click', 'touchstart']) el('overBtn2').addEventListener(ev, e => { game.keepDriving(); e.preventDefault(); e.stopPropagation(); }, { passive: false });

    /* ================= frame ================= */
    this.update = function (dt, rdt) {
      show.dt = dt;
      if (S.intro > 0) { S.introT += dt * (S.introFast ? 5 : 1); G.intro.k = Math.min(1, S.introT / INTRO); if (G.intro.k >= 1) endIntro(false); }
      // travel direction of the player along the road (kept while slow)
      R.frame(P.s, f); const vs = P.vx * f.tx + P.vz * f.tz; if (Math.abs(vs) > 4) S.dirP = vs > 0 ? 1 : -1;
      if (dt > 0) {
        for (const t of civs) {
          if (!t.on) continue;
          if (t.mode === 'lane') laneStep(t, dt);
          else {
            freeStep(t, dt); t.t += dt;
            if (t.mode === 'free' && Math.hypot(t.vx, t.vz) < 1.2 && Math.abs(t.w) < 0.4) { t.mode = 'wreck'; t.t = 0; }
            if (t.mode === 'wreck') {
              if (t.hp < 45) { t.smokeT -= dt; if (t.smokeT <= 0 && G.smoke) { t.smokeT = 0.12; G.smoke.emit(t.x + Math.sin(t.yaw) * 1.6, t.y + 0.9, t.z + Math.cos(t.yaw) * 1.6, rand(-0.3, 0.3), rand(1, 1.8), rand(-0.3, 0.3), 0.8, 0.3, 0.2, 0.2, 0.2); } }
              const dP = Math.hypot(t.x - P.x, t.z - P.z);
              if (t.t > 9 && dP > 150) placeCiv(t, P.s + S.dirP * (t.dir > 0 ? -1 : 1) * rand(330, 520)); // towed away once out of sight; a fresh car joins the traffic
            }
          }
        }
        police(dt);
        PN.update(dt);
        // right door gone: a hard left-hander (or a hit from the left) and the passenger goes out through the gap
        if (G.people && !G.people.fallen() && !S.dead && PN.gone('doorR')) {
          S.fallT = P.latAcc > 7 && P.speed > 11 ? (S.fallT || 0) + dt : Math.max(0, (S.fallT || 0) - dt * 2);
          if (S.fallT > 0.5 || S.fallHit) { G.people.fallOut(); G.sound.hit(8); cam.kick = Math.max(cam.kick, 0.5); }
        }
        S.fallHit = false;
        // collisions
        pb.x = P.x; pb.z = P.z; pb.yaw = P.yaw; pb.vx = P.vx; pb.vz = P.vz; pb.w = P.yawRate || 0;
        const w0 = pb.w;
        for (const o of V) if (o.on) pair(pb, o);
        for (let i = 0; i < V.length; i++) { const A = V[i]; if (!A.on) continue; for (let k = i + 1; k < V.length; k++) { const B = V[k]; if (!B.on) continue; if (A.mode === 'lane' && B.mode === 'lane') continue; if (A.mode === 'wreck' && B.mode === 'wreck') continue; pair(A, B); } }
        P.x = pb.x; P.z = pb.z; P.vx = pb.vx; P.vz = pb.vz; P.yawImp = U.clamp((P.yawImp || 0) + (pb.w - w0), -3.5, 3.5);
        // walls, rails and trees hurt too (the driving code reports the speed it lost against them)
        if (P.imp > 5) { hurt(Math.min(26, (P.imp - 5) * 1.0), Math.min(1, 0.3 + P.imp / 14)); if (game.onHit) game.onHit(pb, null, P.imp, 0); FX.sparks(P.x + Math.sin(P.yaw) * 1.6, P.y + 0.5, P.z + Math.cos(P.yaw) * 1.6, P.vx, P.vz, 8, 4); G.sound.crash(P.imp); cam.kick = Math.max(cam.kick, Math.min(1, P.imp / 10)); }
        if (P.imp > 1.5) { // walls, rails, trees: the car was pushed away from whatever it hit
          const dF = P.impX * Math.sin(P.yaw) + P.impZ * Math.cos(P.yaw), dL2 = P.impX * Math.cos(P.yaw) - P.impZ * Math.sin(P.yaw);
          if (-dF > Math.abs(dL2)) PN.hit('front', -dF); else if (Math.abs(dL2) > Math.abs(dF)) PN.hit(dL2 > 0 ? 'R' : 'L', Math.abs(dL2));
        }
        P.imp = 0; P.impX = P.impZ = 0;
        // state of the car
        if (S.won && !S.dead) { S.wonT += rdt; game.timeScale = Math.min(1, 0.3 + S.wonT * 0.6); }
        if (!S.dead) {
          S.calm += dt; if (S.pursuit) { S.time += dt; S.dist += P.speed * dt; }
          if (S.calm > 7 && S.hp < 100) S.hp = Math.min(100, S.hp + 1.6 * dt);
          if (S.hp < 55) { S.smk = (S.smk || 0) - dt; if (S.smk <= 0 && G.smoke) { S.smk = S.hp < 28 ? 0.05 : 0.11; const k = S.hp < 28 ? 0.12 : 0.42; G.smoke.emit(P.x + Math.sin(P.yaw) * 1.7, P.y + 0.75, P.z + Math.cos(P.yaw) * 1.7, P.vx * 0.5, 1.2, P.vz * 0.5, 0.6, 0.34, k, k, k); } }
        } else {
          S.deadT += rdt; G.camOrbit = S.deadT * 0.22;
          S.smk = (S.smk || 0) - dt; if (S.smk <= 0) { S.smk = 0.03; fire(P.x + Math.sin(P.yaw) * 1.3, P.y + 0.8, P.z + Math.cos(P.yaw) * 1.3, P.vx, P.vz, 1, 1.1); }
          if (S.deadT > 2.4) game.timeScale = Math.min(1, game.timeScale + rdt * 0.5);
        }
      }
      for (const b of V) {
        if (!b.on) continue;
        const far = Math.hypot(b.x - P.x, b.z - P.z) > 520, cdx = cmr.position.x - b.x, cdz = cmr.position.z - b.z, bfx = Math.sin(b.yaw), bfz = Math.cos(b.yaw),
          inLens = !G.camRel && !G.camOverride && Math.abs(cdx * bfx + cdz * bfz) < b.hl + 0.35 && Math.abs(cdx * bfz - cdz * bfx) < b.hw + 0.35 && cmr.position.y - b.y < (b.type === 'van' ? 2.3 : b.type === 'pickup' ? 2.1 : 1.75);
        b.m.root.visible = !far && !inLens; if (far) continue;
        show(b);
        { const dx = b.x - P.x, dz = b.z - P.z, d2 = dx * dx + dz * dz, rel = Math.hypot(b.vx - P.vx, b.vz - P.vz); if (d2 < 30 && !b.near && rel > 25) cam.kick = Math.max(cam.kick, Math.min(1, rel / 55)); b.near = d2 < 30; }
      }
      // light bars: red and blue alternate in double flashes
      { const ph = (performance.now() * 0.001 * 2.6) % 1, on = (ph % 0.25) < 0.14, r = ph < 0.5 && on ? 1 : 0, b = ph >= 0.5 && on ? 1 : 0;
        copMat.red.emissiveIntensity = r * 9; copMat.blue.emissiveIntensity = b * 11;
        for (const c of cops) if (c.on) { const live = c.mode !== 'wreck' && !S.won ? 1 : 0, sz = U.clamp(0.5 + Math.hypot(c.x - cmr.position.x, c.z - cmr.position.z) * 0.022, 0.5, 2.4); c.hR.scale.setScalar(0.01 + r * live * sz); c.hB.scale.setScalar(0.01 + b * live * sz); } }
      let near = 1e9; if ((S.pursuit || S.intro > 0) && !S.dead) for (const c of cops) if (c.on && c.mode !== 'wreck') near = Math.min(near, Math.hypot(c.x - P.x, c.z - P.z));
      G.sound.siren(near < 400 ? (0.02 + 0.11 / (1 + near * near / 2600)) * (S.intro > 0 ? 1.5 : 1) : 0);
      S.flash = Math.max(0, S.flash - rdt * 1.4); S.flashL = Math.max(0, S.flashL - rdt * 1.7); S.flashR = Math.max(0, S.flashR - rdt * 1.7);
      FX.update(dt); TR.update(dt);
      hud(false);
    };
    for (const t of civs) placeCiv(t, t.home);
  };
})();
