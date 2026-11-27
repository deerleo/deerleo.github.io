'use strict';
/* Procedural textures. Everything is drawn at load time on canvases - no image files. */
(function () {
  const U = G.U, T = G.T = {};
  const TAU = Math.PI * 2;

  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d', { willReadFrequently: true })]; }
  function ctex(c, o) {
    o = o || {};
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = o.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    t.anisotropy = o.aniso || 4;
    return t;
  }
  function dataTex(ctx, w, h, o) {
    o = o || {};
    const id = ctx.getImageData(0, 0, w, h), d = id.data;
    if (o.bleed) {
      const b = o.bleed;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] < 10) { d[i] = b[0]; d[i + 1] = b[1]; d[i + 2] = b[2]; d[i + 3] = 0; }
    }
    const t = new THREE.DataTexture(new Uint8Array(d.buffer), w, h, THREE.RGBAFormat);
    t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = o.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true; t.anisotropy = o.aniso || 4; t.needsUpdate = true;
    return t;
  }
  function grain(ctx, w, h, amt, rnd) {
    const id = ctx.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const n = (rnd() - 0.5) * amt;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(id, 0, 0);
  }
  /* soft blobs, wrapped so the canvas tiles */
  function blobs(ctx, w, h, n, rnd, rmin, rmax, cols, amin, amax, sy) {
    sy = sy || 1;
    for (let i = 0; i < n; i++) {
      const x = rnd() * w, y = rnd() * h, r = rmin + rnd() * (rmax - rmin);
      const c = cols[(rnd() * cols.length) | 0], a = amin + rnd() * (amax - amin);
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
        const cx = x + ox * w, cy = y + oy * h;
        if (cx + r < 0 || cx - r > w || cy + r * sy < 0 || cy - r * sy > h) continue;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1, sy);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
        g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore();
      }
    }
  }

  /* ---------- tileable noise (RGB = three independent fbm fields) ---------- */
  T.noise = function () {
    const S = 256, d = new Uint8Array(S * S * 4);
    const n1 = U.makeNoise(101), n2 = U.makeNoise(202), n3 = U.makeNoise(303);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S, i = (y * S + x) * 4;
      d[i] = U.clamp(128 + n1.fbm(u * 4, v * 4, 5, 4) * 300, 0, 255);
      d[i + 1] = U.clamp(128 + n2.fbm(u * 8, v * 8, 4, 8) * 300, 0, 255);
      d[i + 2] = U.clamp(128 + n3.fbm(u * 3, v * 3, 5, 3) * 300, 0, 255);
      d[i + 3] = 255;
    }
    const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true; t.needsUpdate = true;
    return t;
  };

  /* ---------- asphalt road: colour + roughness ---------- */
  T.road = function (aniso) {
    const W = 1024, H = 4096, ppm = W / 8.6, rnd = U.rng(11);
    const [c, x] = mk(W, H), [cr, xr] = mk(W / 2, H / 2);
    xr.scale(0.5, 0.5);
    x.fillStyle = 'rgb(92,89,86)'; x.fillRect(0, 0, W, H);
    xr.fillStyle = 'rgb(226,226,226)'; xr.fillRect(0, 0, W, H);
    blobs(x, W, H, 300, rnd, 60, 320, [[70, 68, 66], [126, 122, 114], [84, 82, 80], [116, 110, 100]], 0.07, 0.2);
    // wheel tracks and lane centre oil strip
    for (const lane of [-1.8, 1.8]) {
      const cx = (4.3 + lane) * ppm;
      for (const o of [-0.86, 0.86]) {
        const tx = cx + o * ppm, hw = 0.42 * ppm;
        let g = x.createLinearGradient(tx - hw, 0, tx + hw, 0);
        g.addColorStop(0, 'rgba(44,43,44,0)'); g.addColorStop(0.5, 'rgba(44,43,44,0.26)'); g.addColorStop(1, 'rgba(44,43,44,0)');
        x.fillStyle = g; x.fillRect(tx - hw, 0, hw * 2, H);
        g = xr.createLinearGradient(tx - hw, 0, tx + hw, 0);
        g.addColorStop(0, 'rgba(150,150,150,0)'); g.addColorStop(0.5, 'rgba(150,150,150,0.6)'); g.addColorStop(1, 'rgba(150,150,150,0)');
        xr.fillStyle = g; xr.fillRect(tx - hw, 0, hw * 2, H);
      }
      const g = x.createLinearGradient(cx - 30, 0, cx + 30, 0);
      g.addColorStop(0, 'rgba(30,28,26,0)'); g.addColorStop(0.5, 'rgba(30,28,26,0.13)'); g.addColorStop(1, 'rgba(30,28,26,0)');
      x.fillStyle = g; x.fillRect(cx - 30, 0, 60, H);
    }
    // repair patches
    const patch = (px, py, pw, ph, col, tar) => {
      for (const oy of [-H, 0, H]) {
        x.fillStyle = col; x.fillRect(px, py + oy, pw, ph);
        xr.fillStyle = 'rgb(240,240,240)'; xr.fillRect(px, py + oy, pw, ph);
        if (tar) {
          x.strokeStyle = 'rgba(30,30,32,0.55)'; x.lineWidth = 3 + rnd() * 2; x.lineJoin = 'round'; x.strokeRect(px, py + oy, pw, ph);
          xr.strokeStyle = 'rgb(150,150,150)'; xr.lineWidth = 7; xr.strokeRect(px, py + oy, pw, ph);
        }
      }
    };
    patch((4.3 + 0.45) * ppm, 520, 3.0 * ppm, 5.2 * ppm, 'rgba(78,77,78,0.6)', true);
    patch(0.55 * ppm, 2300, 2.6 * ppm, 3.2 * ppm, 'rgba(80,79,79,0.6)', true);
    patch((4.3 + 1.3) * ppm, 3300, 2.2 * ppm, 2.0 * ppm, 'rgba(112,109,103,0.6)', true);
    patch(0, 1640, W, 0.8 * ppm, 'rgba(76,75,76,0.6)', false);
    grain(x, W, H, 30, rnd);
    for (let i = 0; i < 16000; i++) {
      const v = rnd() < 0.6 ? 150 + rnd() * 50 : 40 + rnd() * 30;
      x.fillStyle = `rgba(${v},${v - 2},${v - 6},${0.35 + rnd() * 0.4})`;
      x.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 1.6, 1 + rnd() * 1.6);
    }
    // paint
    const line = (lx, lw, col) => {
      x.fillStyle = col; x.fillRect(lx - lw / 2, 0, lw, H);
      xr.fillStyle = 'rgb(140,140,140)'; xr.fillRect(lx - lw / 2, 0, lw, H);
      // wear
      for (let i = 0; i < 2600; i++) {
        const v = 82 + rnd() * 30;
        x.fillStyle = `rgba(${v},${v - 2},${v - 5},${0.35 + rnd() * 0.55})`;
        x.fillRect(lx - lw / 2 + rnd() * lw - 1, rnd() * H, 1 + rnd() * 4, 1 + rnd() * 7);
      }
      for (let i = 0; i < 9; i++) {
        x.fillStyle = `rgba(96,93,89,${0.25 + rnd() * 0.3})`;
        x.fillRect(lx - lw / 2 - 1, rnd() * H, lw + 2, 40 + rnd() * 240);
      }
    };
    line(0.30 * ppm, 0.115 * ppm, 'rgb(222,218,206)');
    line(W - 0.30 * ppm, 0.115 * ppm, 'rgb(222,218,206)');
    line(W / 2 - 0.115 * ppm, 0.105 * ppm, 'rgb(226,166,30)');
    line(W / 2 + 0.115 * ppm, 0.105 * ppm, 'rgb(226,166,30)');
    // cracks and tar snakes
    const crack = (x0, y0, ang, len, wob, lw, col, rcol) => {
      const pts = [[x0, y0]]; let a = ang, px = x0, py = y0;
      for (let d = 0; d < len; d += 9) { a += (rnd() - 0.5) * wob; a = ang + (a - ang) * 0.9; px += Math.cos(a) * 9; py += Math.sin(a) * 9; pts.push([px, py]); }
      for (const oy of [-H, 0, H]) {
        for (const [cx2, st, w2] of [[x, col, lw], [xr, rcol, lw + 1]]) {
          cx2.strokeStyle = st; cx2.lineWidth = w2; cx2.lineJoin = 'round'; cx2.lineCap = 'round';
          cx2.beginPath(); cx2.moveTo(pts[0][0], pts[0][1] + oy);
          for (let i = 1; i < pts.length; i++) cx2.lineTo(pts[i][0], pts[i][1] + oy);
          cx2.stroke();
        }
      }
    };
    for (let i = 0; i < 22; i++) crack(rnd() * W, rnd() * H, Math.PI / 2, 300 + rnd() * 1400, 0.7, 1 + rnd() * 1.4, 'rgba(26,25,25,0.75)', 'rgba(250,250,250,0.6)');
    for (let i = 0; i < 12; i++) { const fromL = rnd() < 0.5; crack(fromL ? 0 : W, rnd() * H, fromL ? 0 : Math.PI, 300 + rnd() * 800, 0.8, 1 + rnd() * 1.5, 'rgba(26,25,25,0.75)', 'rgba(250,250,250,0.6)'); }
    for (let i = 0; i < 6; i++) crack(rnd() < 0.5 ? 0 : W / 2, rnd() * H, 0, W * 0.5 + rnd() * W * 0.5, 0.5, 3 + rnd() * 2.5, 'rgba(22,22,24,0.85)', 'rgb(150,150,150)');
    for (let i = 0; i < 5; i++) crack(W * (0.15 + rnd() * 0.7), rnd() * H, Math.PI / 2, 400 + rnd() * 1000, 0.5, 3 + rnd() * 2.5, 'rgba(22,22,24,0.85)', 'rgb(150,150,150)');
    // old tire marks
    for (let i = 0; i < 3; i++) {
      const bx = (4.3 + (rnd() < 0.5 ? -1.8 : 1.8) - 0.78 + (rnd() - 0.5) * 0.5) * ppm, by = rnd() * H, len = (5 + rnd() * 6) * ppm, bend = (rnd() - 0.5) * 150;
      for (const off of [0, 1.56 * ppm]) for (const oy of [-H, 0, H]) {
        const g = x.createLinearGradient(0, by + oy, 0, by + oy + len);
        g.addColorStop(0, 'rgba(14,14,15,0)'); g.addColorStop(0.3, 'rgba(14,14,15,0.42)'); g.addColorStop(0.8, 'rgba(14,14,15,0.3)'); g.addColorStop(1, 'rgba(14,14,15,0)');
        x.strokeStyle = g; x.lineWidth = 0.2 * ppm; x.lineCap = 'butt';
        x.beginPath(); x.moveTo(bx + off, by + oy); x.quadraticCurveTo(bx + off + bend * 0.2, by + oy + len / 2, bx + off + bend, by + oy + len); x.stroke();
      }
    }
    // dusty crumbling edges
    for (const e of [0, 1]) {
      const g = x.createLinearGradient(e ? W : 0, 0, e ? W - 0.5 * ppm : 0.5 * ppm, 0);
      g.addColorStop(0, 'rgba(156,118,86,0.6)'); g.addColorStop(0.35, 'rgba(150,120,92,0.22)'); g.addColorStop(1, 'rgba(150,120,92,0)');
      x.fillStyle = g; x.fillRect(e ? W - 0.5 * ppm : 0, 0, 0.5 * ppm, H);
      for (let i = 0; i < 260; i++) {
        const r = 14 + rnd() * 46, bx = e ? W - rnd() * 34 : rnd() * 34, by = rnd() * H;
        const gg = x.createRadialGradient(bx, by, 0, bx, by, r);
        gg.addColorStop(0, 'rgba(160,120,86,0.3)'); gg.addColorStop(1, 'rgba(160,120,86,0)');
        x.fillStyle = gg; x.fillRect(bx - r, by - r, r * 2, r * 2);
      }
    }
    const map = ctex(c, { aniso }), rough = ctex(cr, { linear: true, aniso });
    return { map, rough };
  };

  /* asphalt aggregate height for sparkle in low sun */
  T.roadBump = function (aniso) {
    const S = 256, rnd = U.rng(15), [c, x] = mk(S, S);
    x.fillStyle = 'rgb(128,128,128)'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) {
      const px = rnd() * S, py = rnd() * S, r = 0.8 + rnd() * 2.2, v = rnd() < 0.5 ? 60 + rnd() * 40 : 170 + rnd() * 70;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { if (px + ox < -4 || px + ox > S + 4 || py + oy < -4 || py + oy > S + 4) continue; x.fillStyle = `rgba(${v | 0},${v | 0},${v | 0},0.75)`; x.beginPath(); x.arc(px + ox, py + oy, r, 0, TAU); x.fill(); }
    }
    grain(x, S, S, 40, rnd);
    return ctex(c, { linear: true, aniso: aniso || 8 });
  };

  /* tyre: u runs around the wheel, v across the profile (sidewall - tread - sidewall) */
  T.tire = function () {
    const W = 512, H = 256, [c, x] = mk(W, H), [cb, xb] = mk(W, H);
    x.fillStyle = 'rgb(34,34,35)'; x.fillRect(0, 0, W, H); xb.fillStyle = 'rgb(150,150,150)'; xb.fillRect(0, 0, W, H);
    const t0 = H * 0.3, t1 = H * 0.7;
    x.fillStyle = 'rgb(27,27,28)'; x.fillRect(0, t0, W, t1 - t0);
    xb.fillStyle = 'rgb(205,205,205)'; xb.fillRect(0, t0, W, t1 - t0);
    xb.strokeStyle = 'rgb(40,40,40)'; x.strokeStyle = 'rgb(8,8,8)';
    for (const f of [0.38, 0.5, 0.62]) { for (const cx of [x, xb]) { cx.lineWidth = 7; cx.beginPath(); cx.moveTo(0, H * f); cx.lineTo(W, H * f); cx.stroke(); } }
    for (let i = 0; i < 16; i++) { // sipes
      const u = i * W / 16;
      for (const cx of [x, xb]) { cx.lineWidth = 4; cx.beginPath(); cx.moveTo(u, t0); cx.lineTo(u + 14, H * 0.38); cx.moveTo(u + 16, H * 0.62); cx.lineTo(u + 2, t1); cx.moveTo(u + 8, H * 0.41); cx.lineTo(u + 18, H * 0.47); cx.moveTo(u + 18, H * 0.53); cx.lineTo(u + 8, H * 0.59); cx.stroke(); }
    }
    for (const [a, b] of [[0, t0], [t1, H]]) { // sidewalls: rings and raised blocks
      xb.strokeStyle = 'rgb(205,205,205)'; xb.lineWidth = 2;
      for (const f of [0.25, 0.75]) { xb.beginPath(); xb.moveTo(0, a + (b - a) * f); xb.lineTo(W, a + (b - a) * f); xb.stroke(); }
      xb.fillStyle = 'rgb(210,210,210)'; x.fillStyle = 'rgb(46,46,47)';
      for (let i = 0; i < 4; i++) { xb.fillRect(i * W / 4 + 20, a + (b - a) * 0.36, 70, (b - a) * 0.28); x.fillRect(i * W / 4 + 20, a + (b - a) * 0.36, 70, (b - a) * 0.28); }
    }
    grain(x, W, H, 10, U.rng(8));
    return { map: ctex(c, { aniso: 8 }), bump: ctex(cb, { linear: true, aniso: 8 }) };
  };

  /* dark asphalt repair patch decal with soft alpha edges */
  T.patch = function () {
    const W = 256, H = 512, rnd = U.rng(77), [c, x] = mk(W, H);
    x.fillStyle = 'rgb(76,75,76)'; x.fillRect(0, 0, W, H);
    blobs(x, W, H, 60, rnd, 20, 90, [[60, 60, 63], [92, 90, 88]], 0.1, 0.25);
    grain(x, W, H, 34, rnd);
    const id = x.getImageData(0, 0, W, H), d = id.data, nz = U.makeNoise(5);
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
      const ex = Math.min(xx, W - 1 - xx) / 16, ey = Math.min(y, H - 1 - y) / 16;
      const e = Math.min(ex, ey) + nz.n2(xx * 0.07, y * 0.07) * 0.5;
      d[(y * W + xx) * 4 + 3] = U.clamp(e * 2.2, 0, 1) * 235;
    }
    x.putImageData(id, 0, 0);
    return ctex(c, { clamp: true, aniso: 8 });
  };

  /* ---------- ground textures ---------- */
  T.grass = function () {
    const S = 512, rnd = U.rng(21), [c, x] = mk(S, S);
    x.fillStyle = 'rgb(70,92,40)'; x.fillRect(0, 0, S, S);
    blobs(x, S, S, 420, rnd, 10, 70, [[52, 78, 30], [84, 104, 44], [98, 108, 50], [118, 114, 60], [60, 86, 34]], 0.15, 0.4);
    for (let i = 0; i < 11000; i++) {
      const bx = rnd() * S, by = rnd() * S, a = -Math.PI / 2 + (rnd() - 0.5) * 2.4, l = 4 + rnd() * 9;
      const k = rnd();
      const col = k < 0.45 ? [50 + rnd() * 20, 78 + rnd() * 22, 28 + rnd() * 10] : k < 0.85 ? [84 + rnd() * 26, 112 + rnd() * 24, 44 + rnd() * 14] : [140 + rnd() * 30, 134 + rnd() * 24, 74 + rnd() * 16];
      x.strokeStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${0.45 + rnd() * 0.4})`;
      x.lineWidth = 0.8 + rnd() * 0.9;
      x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a) * l, by + Math.sin(a) * l); x.stroke();
    }
    grain(x, S, S, 16, rnd);
    return ctex(c, { aniso: 8 });
  };
  T.dirt = function () {
    const S = 512, rnd = U.rng(31), [c, x] = mk(S, S);
    x.fillStyle = 'rgb(162,112,76)'; x.fillRect(0, 0, S, S);
    blobs(x, S, S, 360, rnd, 12, 90, [[178, 126, 88], [140, 88, 56], [186, 140, 104], [150, 100, 68], [168, 100, 62]], 0.15, 0.4);
    for (let i = 0; i < 1300; i++) {
      const px = rnd() * S, py = rnd() * S, r = 0.7 + rnd() * 2.0, v = 112 + rnd() * 50;
      x.fillStyle = 'rgba(70,44,30,0.5)'; x.beginPath(); x.ellipse(px + 1, py + 1, r, r * 0.8, 0, 0, TAU); x.fill();
      x.fillStyle = `rgba(${v + 20 | 0},${v | 0},${v - 14 | 0},0.9)`; x.beginPath(); x.ellipse(px, py, r, r * 0.8, rnd() * 3, 0, TAU); x.fill();
    }
    grain(x, S, S, 24, rnd);
    return ctex(c, { aniso: 8 });
  };

  /* red clay cliff: colour (tonal variation, strata) + height/streak mask. u runs along the road, v is vertical. */
  T.clay = function () {
    const S = 1024, rnd = U.rng(41), [c, x] = mk(S, S), [ch, xh] = mk(S / 2, S / 2);
    xh.scale(0.5, 0.5);
    x.fillStyle = 'rgb(178,80,40)'; x.fillRect(0, 0, S, S);
    xh.fillStyle = 'rgb(168,168,168)'; xh.fillRect(0, 0, S, S);
    blobs(x, S, S, 90, rnd, 90, 300, [[200, 104, 54], [150, 58, 30], [190, 86, 40], [166, 66, 34]], 0.14, 0.3, 1.3);
    blobs(x, S, S, 520, rnd, 14, 90, [[206, 114, 62], [150, 58, 30], [128, 48, 28], [214, 136, 86], [192, 80, 36], [170, 68, 38]], 0.12, 0.3, 1.8);
    blobs(xh, S, S, 240, rnd, 16, 100, [[90, 90, 90], [225, 225, 225]], 0.1, 0.26, 1.5);
    // strata
    for (let i = 0; i < 14; i++) {
      const y0 = rnd() * S, th = 6 + rnd() * 46, k = 1 + ((rnd() * 2) | 0), ph = rnd() * TAU, A = 5 + rnd() * 14;
      const light = rnd() < 0.5;
      const col = light ? `rgba(222,150,100,${0.1 + rnd() * 0.14})` : `rgba(116,44,24,${0.1 + rnd() * 0.16})`;
      for (const oy of [-S, 0, S]) {
        for (const [cx2, st] of [[x, col], [xh, light ? 'rgba(230,230,230,0.2)' : 'rgba(80,80,80,0.2)']]) {
          cx2.strokeStyle = st; cx2.lineWidth = th; cx2.lineCap = 'butt';
          cx2.beginPath();
          for (let px = 0; px <= S; px += 16) { const py = y0 + oy + A * Math.sin(px / S * TAU * k + ph); if (px === 0) cx2.moveTo(px, py); else cx2.lineTo(px, py); }
          cx2.stroke();
        }
      }
    }
    // erosion rills go to the height/streak map: soft wide gullies plus finer runnels
    const rill = (x0, lw, a, k1, p1, A1, k2, p2, A2) => {
      for (const ox of [-S, 0, S]) {
        if (x0 + ox < -80 || x0 + ox > S + 80) continue;
        xh.strokeStyle = `rgba(14,14,14,${a})`; xh.lineWidth = lw; xh.lineCap = 'round'; xh.lineJoin = 'round';
        xh.beginPath();
        for (let py = -16; py <= S + 16; py += 16) { const px = x0 + ox + A1 * Math.sin(py / S * TAU * k1 + p1) + A2 * Math.sin(py / S * TAU * k2 + p2); if (py === -16) xh.moveTo(px, py); else xh.lineTo(px, py); }
        xh.stroke();
      }
    };
    for (let i = 0; i < 26; i++) { const x0 = rnd() * S, lw = 26 + rnd() * 50, p1 = rnd() * TAU, p2 = rnd() * TAU, A1 = 14 + rnd() * 4; for (const [f, a] of [[1, 0.1], [0.62, 0.14], [0.3, 0.2]]) rill(x0, lw * f, a, 1, p1, A1, 3, p2, 5); }
    for (let i = 0; i < 38; i++) rill(rnd() * S, 3 + rnd() * 9, 0.14 + rnd() * 0.3, 1 + ((rnd() * 2) | 0), rnd() * TAU, 5 + rnd() * 12, 3 + ((rnd() * 3) | 0), rnd() * TAU, 1 + rnd() * 4);
    for (let i = 0; i < 1100; i++) {
      const px = rnd() * S, py = rnd() * S, r = 0.8 + rnd() * 2.4;
      x.fillStyle = rnd() < 0.55 ? 'rgba(104,40,22,0.5)' : 'rgba(224,160,120,0.5)';
      x.beginPath(); x.ellipse(px, py, r, r * 0.7, 0, 0, TAU); x.fill();
    }
    grain(x, S, S, 9, rnd);
    return { map: ctex(c, { aniso: 8 }), height: ctex(ch, { linear: true, aniso: 8 }) };
  };

  /* forest canopy seen from above: cellular crowns */
  T.canopy = function () {
    const S = 512, Ncell = 9, rnd = U.rng(51), [c, x] = mk(S, S);
    const pts = [];
    const pal = [[46, 74, 30], [58, 88, 34], [38, 64, 30], [70, 96, 40], [30, 58, 34], [52, 80, 30], [64, 84, 36]];
    for (let j = 0; j < Ncell; j++) for (let i = 0; i < Ncell; i++) pts.push([(i + 0.15 + rnd() * 0.7), (j + 0.15 + rnd() * 0.7), pal[(rnd() * pal.length) | 0], 0.8 + rnd() * 0.4]);
    const id = x.getImageData(0, 0, S, S), d = id.data, nz = U.makeNoise(52);
    for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) {
      const u = xx / S * Ncell, v = y / S * Ncell, ci = Math.floor(u), cj = Math.floor(v);
      let best = 9, bp = null, bdx = 0, bdy = 0;
      for (let oj = -1; oj <= 1; oj++) for (let oi = -1; oi <= 1; oi++) {
        const ii = ((ci + oi) % Ncell + Ncell) % Ncell, jj = ((cj + oj) % Ncell + Ncell) % Ncell, p = pts[jj * Ncell + ii];
        const dx = (p[0] - ii) + ci + oi - u, dy = (p[1] - jj) + cj + oj - v, dd = dx * dx + dy * dy;
        if (dd < best) { best = dd; bp = p; bdx = dx; bdy = dy; }
      }
      const f = Math.sqrt(best);
      let sh = (1.22 - 0.85 * Math.pow(f, 1.4)) * bp[3];
      sh *= 1 + (bdx * 0.5 - bdy * 0.3) * 0.5;
      sh *= 0.9 + 0.2 * nz.n2(xx * 0.12, y * 0.12, 0);
      const i = (y * S + xx) * 4;
      d[i] = U.clamp(bp[2][0] * sh, 0, 255); d[i + 1] = U.clamp(bp[2][1] * sh, 0, 255); d[i + 2] = U.clamp(bp[2][2] * sh, 0, 255); d[i + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    grain(x, S, S, 14, rnd);
    return ctex(c, { aniso: 8 });
  };

  /* ---------- foliage atlas: [leaf cards | pine cards / bark | solid foliage] ---------- */
  T.ATLAS = { leaf: [0.008, 0.008, 0.492, 0.492], pine: [0.508, 0.008, 0.992, 0.492], bark: [0.02, 0.52, 0.48, 0.98], fill: [0.52, 0.52, 0.98, 0.98] };
  T.foliage = function () {
    const S = 1024, Q = 512, rnd = U.rng(61), [c, x] = mk(S, S);
    const leaf = (cx, cy, l, w, a, col) => {
      x.save(); x.translate(cx, cy); x.rotate(a);
      x.fillStyle = col; x.beginPath(); x.moveTo(-l, 0); x.quadraticCurveTo(0, -w * 1.3, l, 0); x.quadraticCurveTo(0, w * 1.3, -l, 0); x.fill();
      x.restore();
    };
    const soft = (cx, cy, r, col, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); };
    // broadleaf spray: solid lobed core, soft clump shading, low-contrast leaves, lacy rim
    x.save(); x.beginPath(); x.rect(4, 4, Q - 8, Q - 8); x.clip();
    const lobes = [];
    for (let i = 0; i < 11; i++) { const a = i / 11 * TAU + rnd() * 0.5, r = 70 + rnd() * 75; lobes.push([Q / 2 + Math.cos(a) * r, Q / 2 + Math.sin(a) * r, 62 + rnd() * 40]); }
    lobes.push([Q / 2, Q / 2, 120]);
    x.fillStyle = 'rgb(52,82,34)'; for (const l of lobes) { x.beginPath(); x.arc(l[0], l[1], l[2], 0, TAU); x.fill(); }
    for (const l of lobes) { soft(l[0] - l[2] * 0.2, l[1] + l[2] * 0.25, l[2] * 1.0, '30,54,24', 0.5); soft(l[0] + l[2] * 0.15, l[1] - l[2] * 0.3, l[2] * 0.8, '84,118,48', 0.42); }
    for (let i = 0; i < 1500; i++) {
      const l = lobes[(rnd() * lobes.length) | 0], a = rnd() * TAU, r = Math.sqrt(rnd()) * (l[2] + 22);
      const px = l[0] + Math.cos(a) * r, py = l[1] + Math.sin(a) * r, up = 1 - (py - l[1] + l[2]) / (2 * l[2]);
      const li = 19 + up * 12 + rnd() * 9;
      leaf(px, py, 9 + rnd() * 8, 4.5 + rnd() * 3.5, rnd() * TAU, `hsla(${92 + rnd() * 20},${34 + rnd() * 14}%,${li}%,0.92)`);
    }
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 700; i++) {
      const a = rnd() * TAU, r = 120 + rnd() * 130, px = Q / 2 + Math.cos(a) * r, py = Q / 2 + Math.sin(a) * r;
      leaf(px, py, 6 + rnd() * 10, 3 + rnd() * 5, rnd() * TAU, 'rgba(0,0,0,1)');
    }
    x.globalCompositeOperation = 'source-over';
    x.restore();
    // pine spray: dense tuft core with needle fringe
    x.save(); x.beginPath(); x.rect(Q + 4, 4, Q - 8, Q - 8); x.clip();
    const tufts = [];
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + rnd() * 0.6, r = 50 + rnd() * 100; tufts.push([Q * 1.5 + Math.cos(a) * r, Q / 2 + Math.sin(a) * r, 46 + rnd() * 34]); }
    tufts.push([Q * 1.5, Q / 2, 80]);
    x.fillStyle = 'rgb(38,62,36)'; for (const t of tufts) { x.beginPath(); x.arc(t[0], t[1], t[2] * 0.8, 0, TAU); x.fill(); }
    for (const t of tufts) {
      soft(t[0], t[1] + t[2] * 0.3, t[2], '22,40,26', 0.5);
      for (let k = 0; k < 150; k++) {
        const a = rnd() * TAU, r0 = rnd() * t[2] * 0.7, nl = 20 + rnd() * 30, li = 17 + rnd() * 13 + (Math.sin(a) < 0 ? 6 : 0);
        x.strokeStyle = `hsla(${104 + rnd() * 24},${28 + rnd() * 14}%,${li}%,0.95)`; x.lineWidth = 1.8 + rnd() * 1.5;
        x.beginPath(); x.moveTo(t[0] + Math.cos(a) * r0, t[1] + Math.sin(a) * r0); x.lineTo(t[0] + Math.cos(a) * (r0 + nl), t[1] + Math.sin(a) * (r0 + nl)); x.stroke();
      }
    }
    x.restore();
    // bark
    x.fillStyle = 'rgb(92,80,68)'; x.fillRect(0, Q, Q, Q);
    for (let i = 0; i < 520; i++) {
      const bx = rnd() * Q, by = Q + rnd() * Q, l = 20 + rnd() * 90, v = rnd() < 0.6 ? 46 + rnd() * 26 : 112 + rnd() * 30;
      x.strokeStyle = `rgba(${v + 8 | 0},${v | 0},${v - 8 | 0},${0.3 + rnd() * 0.4})`; x.lineWidth = 1 + rnd() * 4;
      x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + (rnd() - 0.5) * 8, Math.min(by + l, S)); x.stroke();
    }
    // solid foliage
    x.fillStyle = 'rgb(44,70,30)'; x.fillRect(Q, Q, Q, Q);
    x.save(); x.beginPath(); x.rect(Q, Q, Q, Q); x.clip();
    for (let i = 0; i < 60; i++) soft(Q + rnd() * Q, Q + rnd() * Q, 30 + rnd() * 60, rnd() < 0.5 ? '28,50,22' : '70,100,42', 0.35);
    for (let i = 0; i < 1500; i++) leaf(Q + rnd() * Q, Q + rnd() * Q, 9 + rnd() * 8, 4.5 + rnd() * 3.5, rnd() * TAU, `hsla(${92 + rnd() * 20},${34 + rnd() * 14}%,${18 + rnd() * 14}%,0.9)`);
    x.restore();
    return dataTex(x, S, S, { bleed: [48, 76, 32], aniso: 4 });
  };

  T.grassBlades = function () {
    const W = 256, H = 256, rnd = U.rng(71), [c, x] = mk(W, H);
    for (let i = 0; i < 120; i++) {
      const bx = 10 + rnd() * (W - 20), tall = rnd() < 0.2, hh = H * (tall ? 0.7 + rnd() * 0.28 : 0.28 + rnd() * 0.42), lean = (rnd() - 0.5) * (tall ? 60 : 90), bw = 3 + rnd() * 4;
      const tipx = U.clamp(bx + lean, 3, W - 3), tipy = H - hh;
      const dry = rnd() < 0.24;
      const g = x.createLinearGradient(0, H, 0, tipy);
      if (dry) { g.addColorStop(0, 'rgb(70,84,38)'); g.addColorStop(1, `rgb(${150 + rnd() * 26 | 0},${140 + rnd() * 20 | 0},${82 + rnd() * 16 | 0})`); }
      else { g.addColorStop(0, 'rgb(38,60,24)'); g.addColorStop(1, `rgb(${78 + rnd() * 28 | 0},${108 + rnd() * 24 | 0},${42 + rnd() * 14 | 0})`); }
      x.fillStyle = g;
      x.beginPath(); x.moveTo(bx - bw / 2, H);
      x.quadraticCurveTo(bx - bw / 2 + lean * 0.25, H - hh * 0.55, tipx, tipy);
      x.quadraticCurveTo(bx + bw / 2 + lean * 0.25, H - hh * 0.55, bx + bw / 2, H); x.fill();
      if (tall && rnd() < 0.6) { x.fillStyle = 'rgb(168,150,98)'; x.beginPath(); x.ellipse(tipx, tipy + 7, 2.4, 10, lean * 0.006, 0, TAU); x.fill(); }
    }
    return dataTex(x, W, H, { bleed: [60, 86, 36], aniso: 2 });
  };

  /* ---------- props ---------- */
  T.concrete = function () {
    const S = 512, rnd = U.rng(81), [c, x] = mk(S, S);
    x.fillStyle = 'rgb(158,154,146)'; x.fillRect(0, 0, S, S);
    blobs(x, S, S, 160, rnd, 20, 120, [[130, 126, 118], [176, 172, 164], [120, 112, 100]], 0.1, 0.3);
    for (let i = 0; i < 46; i++) {
      const sx0 = rnd() * S, l = 80 + rnd() * 380, w = 4 + rnd() * 22;
      const g = x.createLinearGradient(0, 0, 0, l);
      g.addColorStop(0, `rgba(70,62,54,${0.12 + rnd() * 0.16})`); g.addColorStop(1, 'rgba(70,62,54,0)');
      x.fillStyle = g; x.fillRect(sx0, 0, w, l);
    }
    x.strokeStyle = 'rgba(70,66,60,0.35)'; x.lineWidth = 2;
    for (let y = 0; y < S; y += 128) { x.beginPath(); x.moveTo(0, y + 1); x.lineTo(S, y + 1); x.stroke(); }
    grain(x, S, S, 22, rnd);
    return ctex(c, { aniso: 8 });
  };
  T.wood = function () {
    const W = 128, H = 512, rnd = U.rng(91), [c, x] = mk(W, H);
    x.fillStyle = 'rgb(104,80,58)'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      const v = rnd() < 0.6 ? 50 + rnd() * 30 : 130 + rnd() * 30;
      x.strokeStyle = `rgba(${v + 14 | 0},${v | 0},${v - 16 | 0},${0.2 + rnd() * 0.35})`; x.lineWidth = 1 + rnd() * 3;
      const bx = rnd() * W, by = rnd() * H;
      x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + (rnd() - 0.5) * 6, by + 40 + rnd() * 200); x.stroke();
    }
    grain(x, W, H, 20, rnd);
    return ctex(c, { aniso: 4 });
  };
  T.curveSign = function (left) {
    const S = 256, [c, x] = mk(S, S);
    const dia = (r, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(S / 2, S / 2 - r); x.lineTo(S / 2 + r, S / 2); x.lineTo(S / 2, S / 2 + r); x.lineTo(S / 2 - r, S / 2); x.closePath(); x.fill(); };
    x.lineJoin = 'round';
    dia(124, '#16130c'); dia(116, '#f3b90c');
    x.save(); x.translate(S / 2, S / 2); if (!left) x.scale(-1, 1);
    x.strokeStyle = '#141210'; x.lineWidth = 17; x.lineCap = 'butt';
    x.beginPath(); x.moveTo(24, 70); x.lineTo(24, 22); x.quadraticCurveTo(24, -16, -22, -34); x.stroke();
    x.fillStyle = '#141210'; x.beginPath(); x.moveTo(-58, -48); x.lineTo(-14, -62); x.lineTo(-24, -10); x.closePath(); x.fill();
    x.restore();
    const t = ctex(c, { clamp: true, aniso: 8 }); return t;
  };
  function signBase(x, W, H, bg, fg, r) {
    x.fillStyle = fg; rr(x, 0, 0, W, H, r); x.fill();
    x.fillStyle = bg; rr(x, 8, 8, W - 16, H - 16, r - 5); x.fill();
    x.strokeStyle = fg; x.lineWidth = 7; rr(x, 22, 22, W - 44, H - 44, r - 12); x.stroke();
  }
  function rr(x, px, py, w, h, r) {
    x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
    x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath();
  }
  const FONT = '"Arial Narrow", "Bahnschrift SemiCondensed", "Helvetica Neue", Arial, sans-serif';
  T.greenSign = function (rows) {
    const W = 1024, H = 512, [c, x] = mk(W, H);
    signBase(x, W, H, '#0b6a43', '#eef2ee', 40);
    x.fillStyle = '#f2f5f2'; x.textBaseline = 'middle';
    const n = rows.length, rh = (H - 110) / n;
    rows.forEach((r, i) => {
      const y = 62 + rh * (i + 0.5);
      x.font = `600 ${Math.min(120, rh * 0.74) | 0}px ${FONT}`;
      x.textAlign = 'left'; x.fillText(r[0], 62, y, r[1] ? W - 280 : W - 124);
      if (r[1]) { x.textAlign = 'right'; x.fillText(r[1], W - 62, y); }
    });
    grain(x, W, H, 10, U.rng(5));
    return ctex(c, { clamp: true, aniso: 8 });
  };
  T.smallSign = function (text, bg, fg) {
    const W = 512, H = 128, [c, x] = mk(W, H);
    x.fillStyle = fg; rr(x, 0, 0, W, H, 16); x.fill(); x.fillStyle = bg; rr(x, 6, 6, W - 12, H - 12, 12); x.fill();
    x.fillStyle = fg; x.font = `600 68px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, W / 2, H / 2 + 4, W - 40);
    return ctex(c, { clamp: true, aniso: 8 });
  };
  T.speedSign = function (n) {
    const W = 256, H = 320, [c, x] = mk(W, H);
    x.fillStyle = '#15130f'; rr(x, 0, 0, W, H, 18); x.fill(); x.fillStyle = '#ecebe4'; rr(x, 7, 7, W - 14, H - 14, 13); x.fill();
    x.fillStyle = '#15130f'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `700 50px ${FONT}`; x.fillText('SPEED', W / 2, 54); x.fillText('LIMIT', W / 2, 108);
    x.font = `700 170px ${FONT}`; x.fillText(String(n), W / 2, 228);
    return ctex(c, { clamp: true, aniso: 8 });
  };
  T.plate = function (txt) {
    const W = 256, H = 128, [c, x] = mk(W, H);
    x.fillStyle = '#d9d9d2'; rr(x, 0, 0, W, H, 14); x.fill();
    x.fillStyle = '#f4f3ec'; rr(x, 5, 5, W - 10, H - 10, 10); x.fill();
    x.fillStyle = '#c8501e'; x.fillRect(5, 5, W - 10, 20);
    x.fillStyle = '#20283c'; x.font = `700 74px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, W / 2, 76, W - 24);
    return ctex(c, { clamp: true, aniso: 8 });
  };
  T.billboard = function (k) {
    const W = 1024, H = 448, [c, x] = mk(W, H), rnd = U.rng(900 + k);
    const V = [['#efe3c4', '#8c2a1c', 'FRESH PEACHES', 'FARM STAND  ·  2 MILES AHEAD', '#d9772e'], ['#1f5a60', '#f3efe2', "MABEL'S DINER", 'PIE  ·  COFFEE  ·  OPEN LATE', '#e3b23c'], ['#d8b24a', '#2a2a26', 'BAIT · TACKLE · ICE', 'SWEETWATER LANDING', '#2a6a7a']][k % 3];
    x.fillStyle = V[0]; x.fillRect(0, 0, W, H);
    x.strokeStyle = V[1]; x.lineWidth = 12; x.strokeRect(22, 22, W - 44, H - 44);
    x.fillStyle = V[4]; x.beginPath(); x.arc(150, H / 2, 82, 0, TAU); x.fill();
    x.fillStyle = V[1]; x.textBaseline = 'middle'; x.textAlign = 'left';
    x.font = `700 118px ${FONT}`; x.fillText(V[2], 270, H * 0.4, W - 320);
    x.font = `600 50px ${FONT}`; x.fillText(V[3], 274, H * 0.7, W - 330);
    for (let i = 0; i < 40; i++) { const sx0 = rnd() * W, l = 60 + rnd() * 300, g = x.createLinearGradient(0, 0, 0, l); g.addColorStop(0, `rgba(60,50,40,${0.1 + rnd() * 0.18})`); g.addColorStop(1, 'rgba(60,50,40,0)'); x.fillStyle = g; x.fillRect(sx0, 0, 6 + rnd() * 26, l); }
    x.strokeStyle = 'rgba(40,30,20,0.22)'; x.lineWidth = 2; for (let px2 = 128; px2 < W; px2 += 128) { x.beginPath(); x.moveTo(px2, 0); x.lineTo(px2, H); x.stroke(); }
    grain(x, W, H, 16, rnd);
    return ctex(c, { clamp: true, aniso: 8 });
  };
  T.radial = function (inner, soft) {
    const S = 128, [c, x] = mk(S, S);
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(inner, `rgba(255,255,255,${soft})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    return ctex(c, { clamp: true, linear: true });
  };
  /* soft occlusion under a car: rounded footprint (hw x hl metres) plus the four tyre contacts; the plane is (hw+0.6)*2 by (hl+0.6)*2 */
  T.carAO = function (hw, hl, wx, zf, zr) {
    const W = 96, H = 192, [c, x] = mk(W, H), im = x.createImageData(W, H), d = im.data, pw = (hw + 0.6) * 2, ph = (hl + 0.6) * 2, rr = 0.45;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const px = ((i + 0.5) / W - 0.5) * pw, pz = (0.5 - (j + 0.5) / H) * ph;
      const qx = Math.abs(px) - (hw - rr), qz = Math.abs(pz) - (hl - rr);
      const sd = Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - rr;
      let a = 0.74 * Math.pow(U.smooth(0.5, -0.4, sd), 1.6);
      for (const wz of [zf, zr]) { const dx = (Math.abs(px) - wx) / 0.17, dz = (pz - wz) / 0.3; a += 0.4 * Math.exp(-(dx * dx + dz * dz)); }
      const o = (j * W + i) * 4; d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = Math.round(255 * Math.min(0.9, a));
    }
    x.putImageData(im, 0, 0);
    return ctex(c, { clamp: true, linear: true });
  };
  T.smoke = function () {
    const S = 128, rnd = U.rng(3), [c, x] = mk(S, S);
    for (let i = 0; i < 26; i++) {
      const a = rnd() * TAU, r = rnd() * 30, br = 16 + rnd() * 20, cx = S / 2 + Math.cos(a) * r, cy = S / 2 + Math.sin(a) * r;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, br);
      g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(cx - br, cy - br, br * 2, br * 2);
    }
    return ctex(c, { clamp: true, linear: true });
  };
  /* water ripple normal map from periodic noise */
  T.waterNormal = function () {
    const S = 256, nz = U.makeNoise(123), hgt = new Float32Array(S * S), d = new Uint8Array(S * S * 4);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) hgt[y * S + x] = nz.fbm(x / S * 5, y / S * 5, 3, 5);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = hgt[y * S + (x + 1) % S] - hgt[y * S + (x + S - 1) % S], dy = hgt[((y + 1) % S) * S + x] - hgt[((y + S - 1) % S) * S + x];
      const nx = -dx * 9, ny = -dy * 9, l = Math.hypot(nx, ny, 1), i = (y * S + x) * 4;
      d[i] = (nx / l * 0.5 + 0.5) * 255; d[i + 1] = (ny / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
    }
    const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
    return t;
  };
})();
