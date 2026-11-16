/* backgrounds.js — painted parallax plates. Each scene: { width, light, platforms, hideSpots, init, draw, drawFront } */
(() => {
  'use strict';
  const BD = (window.BD = window.BD || {});
  const U = BD.U, W = BD.W, H = BD.H, GY = BD.GY, TAU = Math.PI * 2;
  const S = {};
  const n0 = (v) => (v > 0 ? Math.min(1, +v) : 0);
  const mx = U.mix, A = U.rgba;
  const FONT_D = "'Dela Gothic One', 'Barlow Condensed', sans-serif";
  const FONT_C = "'Barlow Condensed', sans-serif";

  /* ------------------------------------------------------------ helpers */
  function stops(g, list) { for (let i = 0; i < list.length; i += 2) g.addColorStop(list[i], list[i + 1]); return g; }
  const vg = (ctx, y0, y1, list) => stops(ctx.createLinearGradient(0, y0, 0, y1), list);
  const hg = (ctx, x0, x1, list) => stops(ctx.createLinearGradient(x0, 0, x1, 0), list);
  const rg = (ctx, x, y, r0, r1, list) => stops(ctx.createRadialGradient(x, y, r0, x, y, r1), list);
  function glow(ctx, x, y, r, col, a) {
    if (a <= 0.004) return;
    ctx.fillStyle = rg(ctx, x, y, 0, r, [0, A(col, a), 1, A(col, 0)]);
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function poly(ctx, col, p) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
    ctx.closePath(); ctx.fill();
  }
  function rect(ctx, col, x, y, w, h) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); }
  function rrect(ctx, col, x, y, w, h, r) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
  }
  function ell(ctx, col, x, y, rx, ry, rot = 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill(); }
  function vignette(ctx, a, col = '#000000', inner = 380) {
    ctx.fillStyle = rg(ctx, W / 2, H * 0.52, inner, 860, [0, A(col, 0), 1, A(col, a)]);
    ctx.fillRect(0, 0, W, H);
  }
  /** small tiling grain texture */
  function noiseTile(size, seed, dark, light, a, density = 0.5) {
    const [c, g] = U.canvas(size, size, 1), r = U.seeded(seed);
    for (let i = 0, n = size * size * density; i < n; i++) {
      g.fillStyle = A(r() < 0.5 ? dark : light, a * r());
      g.fillRect((r() * size) | 0, (r() * size) | 0, 1 + ((r() * 2) | 0), 1);
    }
    return c;
  }
  /** scattered items along x, deterministic */
  function scatter(seed, x0, x1, step) {
    const q = U.seeded(seed), a = [];
    for (let x = x0; x < x1; x += step * (0.7 + q() * 0.7)) a.push({ x, a: q(), b: q(), c: q(), d: q() });
    return a;
  }
  /** wrap v into [0, m) */
  const wrap = (v, m) => ((v % m) + m) % m;
  function text(ctx, str, x, y, size, col, font = FONT_D, align = 'center') {
    ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(str, x, y);
  }

  /* =============================================================== HILL */
  function miniHouse(ctx, x, y, w, h, lit, shd, roof) {
    rect(ctx, shd, x, y - h, w, h);
    rect(ctx, lit, x, y - h, w * 0.42, h);
    poly(ctx, roof, [x - w * 0.08, y - h, x + w * 0.5, y - h * 1.75, x + w * 1.08, y - h]);
    poly(ctx, mx(roof, lit, 0.35), [x - w * 0.08, y - h, x + w * 0.5, y - h * 1.75, x + w * 0.5, y - h]);
  }
  S.hill = {
    width: 1600, platforms: [], hideSpots: [],
    light: { ambient: '#f08a4b', amount: 0.18, rim: '#ffb35c', grade: 'none' },
    init() {
      if (this._i) return; this._i = true;
      const r = U.seeded(7);
      this.clouds = [];
      for (let i = 0; i < 12; i++) {
        const puffs = [], w = 180 + r() * 340, n = 5 + ((r() * 4) | 0);
        for (let j = 0; j < n; j++) puffs.push([(j / (n - 1) - 0.5) * w + (r() - 0.5) * 30, (r() - 0.5) * 10, (w / n) * (0.8 + r() * 0.5), 8 + r() * 15]);
        this.clouds.push({ x: r() * 2100, y: 50 + r() * 290, p: 0.03 + r() * 0.06, puffs });
      }
      this.rowA = scatter(21, -720, 1100, 40);
      this.rowB = scatter(22, -720, 1100, 50);
      this.rowC = scatter(23, -720, 1400, 74);
      this.rowD = scatter(24, -720, 1400, 96);
      this.slope = scatter(25, -720, 1700, 64);
      this.tufts = scatter(41, -720, 2320, 22);
      this.front = scatter(42, -720, 2900, 30);
      const c = U.seeded(31); this.canopy = [];
      for (let i = 0; i < 48; i++) {
        const a = c() * TAU, d = Math.sqrt(c());
        this.canopy.push({ x: Math.cos(a) * d * 340, y: Math.sin(a) * d * 150, r: 46 + c() * 44, ph: c() * TAU });
      }
      this.leaves = scatter(51, 0, 17, 1);
    },
    sunPos(cam) { return [350 - (cam.x - 800) * 0.03, 402]; },
    draw(ctx, cam, st) {
      this.init();
      const t = st.t || 0, wind = 1 + n0(st.wind) * 2;
      rect(ctx, vg(ctx, 0, 480, [0, '#211c48', 0.3, '#4d2e66', 0.56, '#b54e6c', 0.78, '#ee864d', 1, '#ffd08a']), 0, 0, W, H);
      const [sx, sy] = this.sunPos(cam);
      glow(ctx, sx, sy, 460, '#ffd890', 0.8);
      ell(ctx, '#fff2c8', sx, sy, 44, 44);
      for (const c of this.clouds) {
        const cx = wrap(c.x - cam.x * c.p * 6 + t * 3, 2100) - 400, k = U.clamp((c.y - 50) / 290, 0, 1);
        const lit = mx('#d9607a', '#ffb070', k), shd = mx('#3a2a5e', '#8a4a70', k);
        for (const p of c.puffs) ell(ctx, lit, cx + p[0], c.y + p[1], p[2], p[3]);
        for (const p of c.puffs) ell(ctx, shd, cx + p[0], c.y + p[1] - p[3] * 0.42, p[2] * 0.97, p[3] * 0.9);
      }
      // far ridge
      cam.push(ctx, 0.12);
      let v = cam.view(0.12);
      ctx.fillStyle = '#a65a70'; ctx.beginPath(); ctx.moveTo(v.x0, 320);
      for (let x = v.x0; x <= v.x1 + 24; x += 24) ctx.lineTo(x, -212 - 12 * Math.sin(x * 0.011) - 6 * Math.sin(x * 0.037 + 1));
      ctx.lineTo(v.x1 + 24, 320); ctx.fill();
      cam.pop(ctx);
      // far suburb
      cam.push(ctx, 0.2);
      v = cam.view(0.2);
      rect(ctx, vg(ctx, -200, 0, [0, '#94506b', 1, '#6f4161']), v.x0, -198, v.x1 - v.x0, 520);
      for (const h of this.rowA) if (h.x > v.x0 - 40 && h.x < v.x1 + 40) {
        if (h.a < 0.3) ell(ctx, '#70405f', h.x, -200, 12 + h.b * 8, 9 + h.c * 6);
        else miniHouse(ctx, h.x, -194, 13 + h.b * 9, 6 + h.c * 4, '#d98a72', '#8a4c68', '#663a5c');
      }
      // water tower
      rect(ctx, '#6a3c5e', 246, -236, 3, 44); rect(ctx, '#6a3c5e', 268, -236, 3, 44);
      ell(ctx, '#7d4664', 258.5, -240, 21, 13); ell(ctx, '#e2907a', 251, -243, 9, 8);
      for (const h of this.rowB) if (h.x > v.x0 - 40 && h.x < v.x1 + 40) {
        if (h.a < 0.35) ell(ctx, '#613a5a', h.x, -178, 15 + h.b * 9, 11 + h.c * 7);
        else miniHouse(ctx, h.x, -170, 17 + h.b * 11, 8 + h.c * 5, '#e6976f', '#84486a', '#5c3558');
      }
      rect(ctx, A('#ffc493', 0.16), v.x0, -166, v.x1 - v.x0, 4);
      cam.pop(ctx);
      rect(ctx, vg(ctx, 372, 590, [0, 'rgba(255,186,120,0.5)', 1, 'rgba(255,160,110,0)']), 0, 372, W, 218);
      // mid suburb
      cam.push(ctx, 0.35);
      v = cam.view(0.35);
      rect(ctx, vg(ctx, -150, 40, [0, '#70465f', 1, '#4c3350']), v.x0, -150, v.x1 - v.x0, 470);
      for (const h of this.rowC) if (h.x > v.x0 - 70 && h.x < v.x1 + 70) {
        if (h.a < 0.3) { ell(ctx, '#463552', h.x, -138, 22 + h.b * 10, 17 + h.c * 9); ell(ctx, '#b97a4c', h.x - 9, -146, 9, 7); }
        else {
          miniHouse(ctx, h.x, -124, 30 + h.b * 16, 14 + h.c * 7, '#f2a26b', '#7c4a63', '#4b3251');
          if (h.d > 0.5) rect(ctx, '#ffe9ad', h.x + 4, -136, 5, 6);
        }
      }
      rect(ctx, A('#ffc493', 0.2), v.x0, -116, v.x1 - v.x0, 6);
      for (const h of this.rowD) if (h.x > v.x0 - 80 && h.x < v.x1 + 80) {
        if (h.a < 0.34) { ell(ctx, '#3b304b', h.x, -100, 28 + h.b * 12, 22 + h.c * 10); ell(ctx, '#c4803f', h.x - 12, -111, 11, 8); }
        else {
          miniHouse(ctx, h.x, -82, 40 + h.b * 18, 18 + h.c * 8, '#f7ab6b', '#744560', '#40294a');
          if (h.d > 0.4) rect(ctx, '#ffe9ad', h.x + 6, -97, 6, 8);
        }
      }
      cam.pop(ctx);
      // hill shoulder
      cam.push(ctx, 0.55);
      v = cam.view(0.55);
      const top = (x) => -62 - 20 * Math.sin(x * 0.004 + 1) - 5 * Math.sin(x * 0.019);
      ctx.fillStyle = vg(ctx, -90, 60, [0, '#6c6336', 0.5, '#3f472a', 1, '#2a3523']);
      ctx.beginPath(); ctx.moveTo(v.x0, 330);
      for (let x = v.x0; x <= v.x1 + 30; x += 30) ctx.lineTo(x, top(x));
      ctx.lineTo(v.x1 + 30, 330); ctx.fill();
      for (const h of this.slope) if (h.a < 0.42 && h.x > v.x0 - 60 && h.x < v.x1 + 60) {
        const y = top(h.x) - 8, r0 = 22 + h.b * 16;
        rect(ctx, '#241b1c', h.x - 2, y, 4, 18);
        ell(ctx, '#27331f', h.x, y - r0 * 0.5, r0, r0 * 0.82);
        ell(ctx, '#c08a3c', h.x - r0 * 0.42, y - r0 * 0.78, r0 * 0.36, r0 * 0.26);
      }
      cam.pop(ctx);
      // crest + oak
      cam.push(ctx, 1);
      v = cam.view(1);
      rect(ctx, vg(ctx, -6, 250, [0, '#bd9c3f', 0.07, '#84883a', 0.32, '#4d602e', 1, '#22301f']), v.x0, -3, v.x1 - v.x0, 290);
      poly(ctx, 'rgba(18,22,30,0.34)', [1046, 3, 1122, 3, 2500, 150, 1700, 190]);
      ell(ctx, 'rgba(18,22,30,0.26)', 1640, 96, 420, 54);
      // trunk
      poly(ctx, '#2a1c1b', [1018, 4, 1048, -30, 1058, -200, 1010, -330, 1040, -338, 1078, -250, 1092, -350, 1124, -348, 1112, -240, 1160, -320, 1184, -308, 1118, -180, 1116, -30, 1146, 4]);
      poly(ctx, '#9c5c31', [1018, 4, 1048, -30, 1058, -200, 1022, -300, 1034, -304, 1068, -200, 1062, -30, 1040, 4]);
      const cx = 1094, cy = -452;
      for (const c of this.canopy) ell(ctx, '#232f1e', cx + c.x + Math.sin(t * 0.8 + c.ph) * 3 * wind, cy + c.y, c.r, c.r * 0.82);
      for (const c of this.canopy) ell(ctx, '#3b4a27', cx + c.x - 11 + Math.sin(t * 0.8 + c.ph) * 3 * wind, cy + c.y - 13, c.r * 0.74, c.r * 0.6);
      for (const c of this.canopy) if (c.x - c.y * 1.2 < -60) ell(ctx, '#cf953d', cx + c.x - c.r * 0.4 + Math.sin(t * 0.8 + c.ph) * 4 * wind, cy + c.y - c.r * 0.36, c.r * 0.36, c.r * 0.24, -0.5);
      // crest tufts
      for (const g of this.tufts) if (g.x > v.x0 && g.x < v.x1) {
        const hh = 8 + g.a * 15, sw = Math.sin(t * 1.5 + g.x * 0.03) * 3 * wind;
        poly(ctx, g.b > 0.5 ? '#a8963c' : '#6f7c33', [g.x - 3, 0, g.x + sw, -hh, g.x + 3, 0]);
        poly(ctx, '#55682e', [g.x + 3, 0, g.x + 7 + sw * 1.3, -hh * 0.7, g.x + 8, 0]);
      }
      cam.pop(ctx);
    },
    drawFront(ctx, cam, st) {
      this.init();
      const t = st.t || 0, wind = 1 + n0(st.wind) * 2;
      cam.push(ctx, 1.14);
      const lv = U.seeded(77);
      for (let i = 0; i < 22; i++) {
        const x = 1250 + lv() * 640, y = -655 + lv() * 90 + Math.sin(t * 0.9 + i) * 3 * wind, r0 = 40 + lv() * 50;
        ell(ctx, '#141c15', x, y, r0, r0 * 0.6);
      }
      cam.pop(ctx);
      cam.push(ctx, 1.3);
      const v = cam.view(1.3);
      for (const g of this.front) if (g.x > v.x0 - 20 && g.x < v.x1 + 20) {
        const hh = 34 + g.a * 46, sw = Math.sin(t * 1.3 + g.x * 0.02) * 6 * wind, y = 118;
        poly(ctx, '#151f17', [g.x - 6, y, g.x + sw, y - hh, g.x + 6, y]);
        if (g.b > 0.5) poly(ctx, '#1c2a1b', [g.x + 6, y, g.x + 16 + sw * 1.4, y - hh * 0.7, g.x + 15, y]);
      }
      cam.pop(ctx);
      for (const l of this.leaves) {
        const x = wrap(l.a * 1500 + t * (50 + l.b * 80) * wind, 1500) - 100;
        const y = 70 + l.c * 500 + Math.sin(t * 1.3 + l.d * 9) * 28;
        ell(ctx, l.d > 0.5 ? '#e5a43c' : '#c4582c', x, y, 6 + l.b * 4, 3.4 + l.b * 1.6, t * (1.5 + l.a) + l.c * 6);
      }
      const [sx, sy] = this.sunPos(cam);
      glow(ctx, sx, sy, 640, '#ffab5e', 0.2);
      vignette(ctx, 0.2, '#190e2a');
    },
  };

  /* ============================================================= GARDEN */
  S.garden = {
    width: 2800, platforms: [], hideSpots: [],
    light: { ambient: '#ffc36b', amount: 0.14, rim: '#ffe6a8', grade: 'none' },
    lightFor(st) {
      const h = n0(st && st.heat);
      return { ambient: mx('#ffc36b', '#ff6a32', h), amount: 0.14 + 0.12 * h, rim: mx('#ffe6a8', '#ffb24a', h), grade: 'none' };
    },
    tents: [240, 900, 1560, 2200],
    tables: [820, 1310, 1830, 2360],
    init() {
      if (this._i) return; this._i = true;
      this.topiary = scatter(61, -700, 2700, 150);
      this.frontHedge = scatter(62, -700, 4700, 90);
      this.cyp = scatter(63, -100, 1400, 70);
    },
    draw(ctx, cam, st) {
      this.init();
      const t = st.t || 0, heat = n0(st.heat);
      const hc = (c, k = 0.32) => (heat ? mx(c, '#e0562c', heat * k) : c);
      rect(ctx, vg(ctx, 0, 470, [0, mx('#6c9bc6', '#591d22', heat), 0.55, mx('#f3d18e', '#df5a2c', heat), 1, mx('#ffe8b2', '#ffb24c', heat)]), 0, 0, W, H);
      const sx = 190 - (cam.x - 1400) * 0.02, sy = 318;
      glow(ctx, sx, sy, 520, mx('#fff3c6', '#ffd070', heat), 0.85);
      for (let i = 0; i < 5; i++) {
        const cx = wrap(i * 420 + 90 - cam.x * 0.05 + t * 2, 2000) - 360, cy = 90 + (i * 53) % 150;
        ell(ctx, A(mx('#fff6dc', '#ffb070', heat), 0.5), cx, cy, 150, 14); ell(ctx, A(mx('#fff6dc', '#ffb070', heat), 0.4), cx + 60, cy + 12, 110, 10);
      }
      // distant trees
      cam.push(ctx, 0.1);
      let v = cam.view(0.1);
      ctx.fillStyle = hc('#9fb89c', 0.5); ctx.beginPath(); ctx.moveTo(v.x0, 330);
      for (let x = v.x0; x <= v.x1 + 20; x += 20) ctx.lineTo(x, -262 - 14 * Math.sin(x * 0.021) - 9 * Math.sin(x * 0.057 + 2));
      ctx.lineTo(v.x1 + 20, 330); ctx.fill();
      cam.pop(ctx);
      // mansion
      cam.push(ctx, 0.45);
      v = cam.view(0.45);
      const m = 630;
      rect(ctx, hc('#b7c476'), v.x0, -152, v.x1 - v.x0, 480);
      for (const c of this.cyp) if (c.x < m - 500 || c.x > m + 500) {
        const hh = 150 + c.a * 90;
        ell(ctx, hc('#4d7a52'), c.x, -150 - hh * 0.5, 17 + c.b * 8, hh * 0.5); ell(ctx, hc('#7fa25c'), c.x - 6, -150 - hh * 0.55, 7, hh * 0.38);
      }
      rect(ctx, hc('#f4e8cb'), m - 470, -330, 940, 180);
      rect(ctx, hg(ctx, m - 470, m + 470, [0, 'rgba(160,120,90,0)', 1, 'rgba(160,120,90,0.32)']), m - 470, -330, 940, 180);
      rect(ctx, hc('#7c8490'), m - 486, -352, 972, 24); rect(ctx, hc('#a5acb5'), m - 486, -352, 972, 6);
      for (let i = 0; i < 2; i++) for (let j = 0; j < 12; j++) {
        if (j > 3 && j < 8) continue;
        const wx = m - 440 + j * 77, wy = -312 + i * 84;
        rect(ctx, hc('#86a6bf'), wx, wy, 30, 58); rect(ctx, hc('#ffe6a6'), wx, wy, 30, 18); rect(ctx, hc('#f4e8cb'), wx + 13, wy, 4, 58);
      }
      rect(ctx, hc('#fbf1d8'), m - 160, -384, 320, 234);
      poly(ctx, hc('#fbf1d8'), [m - 186, -384, m, -446, m + 186, -384]);
      poly(ctx, hc('#d9c6a2'), [m - 150, -390, m, -436, m + 150, -390]);
      rect(ctx, hc('#5f4a40'), m - 26, -262, 52, 112);
      for (let i = 0; i < 6; i++) {
        const cxp = m - 142 + i * 54;
        rect(ctx, hc('#fffaea'), cxp, -376, 16, 222); rect(ctx, hc('#cdb692'), cxp + 10, -376, 6, 222);
      }
      rect(ctx, hc('#e3d3b2'), m - 196, -158, 392, 8);
      rect(ctx, A('#fff1c8', 0.2 * (1 - heat)), v.x0, -152, v.x1 - v.x0, 60);
      cam.pop(ctx);
      // hedge wall, tents, bulbs
      cam.push(ctx, 0.7);
      v = cam.view(0.7);
      for (const tx of this.tents) if (tx > v.x0 - 200 && tx < v.x1 + 200) {
        poly(ctx, hc('#fdf6e6', 0.2), [tx - 176, -300, tx, -424, tx + 176, -300]);
        poly(ctx, hc('#dccdb6', 0.2), [tx + 20, -300, tx, -424, tx + 176, -300]);
        rect(ctx, 'rgba(70,60,60,0.28)', tx - 164, -276, 328, 130);
        for (let s = -6; s < 6; s++) ell(ctx, s % 2 ? hc('#fdf6e6', 0.2) : hc('#f0c9b0', 0.2), tx + s * 29 + 14.5, -298, 15, 20);
        rect(ctx, hc('#fdf6e6', 0.2), tx - 176, -304, 352, 10);
        rect(ctx, '#e9dfcf', tx - 170, -296, 6, 270); rect(ctx, '#bfb19c', tx + 164, -296, 6, 270);
      }
      rect(ctx, vg(ctx, -168, -20, [0, hc('#6b9a48'), 0.12, hc('#3c6b3c'), 1, hc('#284f33')]), v.x0, -162, v.x1 - v.x0, 140);
      for (const o of this.topiary) if (o.x > v.x0 - 60 && o.x < v.x1 + 60) {
        if (o.a < 0.5) { ell(ctx, hc('#346238'), o.x, -176, 34, 32); ell(ctx, hc('#7aa64c'), o.x - 11, -188, 14, 11); }
        else { poly(ctx, hc('#346238'), [o.x - 30, -158, o.x, -246, o.x + 30, -158]); poly(ctx, hc('#7aa64c'), [o.x - 30, -158, o.x, -246, o.x - 6, -158]); }
      }
      rect(ctx, hc('#a9c05a'), v.x0, -24, v.x1 - v.x0, 350);
      rect(ctx, 'rgba(30,60,35,0.28)', v.x0, -24, v.x1 - v.x0, 9);
      for (let i = 0; i < this.tents.length - 1; i++) {
        const x0 = this.tents[i] + 172, x1 = this.tents[i + 1] - 172, n = Math.round((x1 - x0) / 34);
        if (x1 < v.x0 || x0 > v.x1) continue;
        const sag = 46 + Math.sin(t * 0.9 + i) * 5;
        ctx.strokeStyle = 'rgba(50,40,40,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, -302);
        ctx.quadraticCurveTo((x0 + x1) / 2 + Math.sin(t * 0.7 + i * 2) * 8, -302 + sag * 2, x1, -302); ctx.stroke();
        for (let j = 1; j < n; j++) {
          const u = j / n, bx = U.lerp(x0, x1, u) + Math.sin(t * 0.7 + i * 2) * 8 * 2 * u * (1 - u), by = -302 + sag * 4 * u * (1 - u) + 4;
          const fl = heat ? 0.45 + 0.55 * Math.abs(Math.sin(t * (9 + j % 5) + j * 7.3)) : 0.9 + 0.1 * Math.sin(t * 3 + j);
          ell(ctx, A('#ffd98a', 0.24 * fl), bx, by, 14, 14); ell(ctx, A('#fff6d0', fl), bx, by, 5, 5.5);
        }
      }
      cam.pop(ctx);
      // lawn + props on the gameplay plane
      cam.push(ctx, 1);
      v = cam.view(1);
      rect(ctx, vg(ctx, -4, 250, [0, hc('#aec45c'), 0.3, hc('#82a548'), 1, hc('#4c7736')]), v.x0, -3, v.x1 - v.x0, 300);
      ctx.fillStyle = 'rgba(40,84,34,0.13)';
      for (let i = Math.floor((v.x0 - 500) / 130); i * 130 < v.x1 + 500; i++) if (i & 1) {
        const a = i * 130, b = a + 130, k = 1.7;
        ctx.beginPath(); ctx.moveTo(a, -3); ctx.lineTo(b, -3); ctx.lineTo(cam.x + (b - cam.x) * k, 290); ctx.lineTo(cam.x + (a - cam.x) * k, 290); ctx.fill();
      }
      // welcome banner + podium
      rect(ctx, '#c9b79a', 262, -340, 5, 340); rect(ctx, '#a8957a', 573, -340, 5, 340);
      poly(ctx, '#f6ecd6', [267, -338, 573, -338, 573, -282, 420, -274, 267, -282]);
      poly(ctx, 'rgba(120,90,60,0.18)', [420, -338, 573, -338, 573, -282, 420, -274]);
      text(ctx, 'WOODCREST', 420, -309, 31, '#7a2c2a', FONT_D);
      poly(ctx, 'rgba(30,55,35,0.25)', [300, 2, 560, 2, 760, 34, 420, 34]);
      rect(ctx, '#ede1c6', 290, -22, 270, 8); rect(ctx, '#b89e7a', 290, -14, 270, 16);
      poly(ctx, '#8a5e3c', [396, -22, 400, -108, 446, -108, 450, -22]); poly(ctx, '#62412b', [428, -22, 430, -108, 446, -108, 450, -22]);
      rect(ctx, '#a57448', 392, -114, 62, 8); ell(ctx, '#e6c36a', 420, -66, 10, 10);
      rect(ctx, '#2d2d33', 473, -150, 4, 128); rect(ctx, '#2d2d33', 464, -24, 22, 3); ell(ctx, '#3a3a42', 472, -154, 6, 4.5, -0.5);
      // tables
      for (let i = 0; i < this.tables.length; i++) {
        const x = this.tables[i];
        if (x < v.x0 - 200 || x > v.x1 + 200) continue;
        poly(ctx, 'rgba(30,55,35,0.24)', [x - 66, 2, x + 70, 2, x + 250, 30, x + 20, 30]);
        poly(ctx, '#fbf6ea', [x - 62, -74, x + 62, -74, x + 72, -4, x - 72, -4]);
        poly(ctx, '#d9cdbd', [x + 8, -74, x + 62, -74, x + 72, -4, x + 14, -4]);
        poly(ctx, '#efe6d6', [x - 30, -74, x - 22, -74, x - 28, -4, x - 42, -4]);
        ell(ctx, '#fffdf4', x, -74, 62, 11);
        if (i === 1) {
          for (let r0 = 0; r0 < 4; r0++) for (let k = 0; k <= r0; k++) {
            const gx = x + (k - r0 / 2) * 15, gy = -128 + r0 * 15;
            poly(ctx, 'rgba(255,226,150,0.92)', [gx - 6, gy, gx + 6, gy, gx + 2, gy + 9, gx - 2, gy + 9]);
            rect(ctx, 'rgba(255,250,225,0.95)', gx - 5, gy, 3, 6); rect(ctx, 'rgba(230,200,140,0.9)', gx - 1, gy + 9, 2, 5);
          }
          ell(ctx, A('#fff3c0', 0.22), x, -104, 60, 44);
        } else if (i % 2 === 0) {
          rect(ctx, '#c9d6dc', x - 5, -104, 10, 28); ell(ctx, '#d8566a', x - 8, -112, 11, 10); ell(ctx, '#f0a0a8', x + 7, -116, 10, 9); ell(ctx, '#5d8a48', x + 1, -100, 13, 6);
        } else {
          for (let k = 0; k < 3; k++) { ell(ctx, '#e8dcc6', x, -80 - k * 17, 30 - k * 8, 4); rect(ctx, '#c9b79a', x - 1.5, -96 - k * 17, 3, 16); ell(ctx, '#e88a6c', x - 8 + k * 5, -84 - k * 17, 5, 3.5); }
        }
      }
      ctx.strokeStyle = '#f7f1e3'; ctx.lineWidth = 4;
      for (const hx of [1060, 1590, 2110, 2600]) { ctx.beginPath(); ctx.moveTo(hx - 9, 0); ctx.lineTo(hx - 9, -14); ctx.arc(hx, -14, 9, Math.PI, 0); ctx.lineTo(hx + 9, 0); ctx.stroke(); }
      rect(ctx, vg(ctx, -3, 60, [0, 'rgba(255,240,180,0.22)', 1, 'rgba(255,240,180,0)']), v.x0, -3, v.x1 - v.x0, 63);
      cam.pop(ctx);
    },
    drawFront(ctx, cam, st) {
      this.init();
      const t = st.t || 0, heat = n0(st.heat);
      cam.push(ctx, 1.2);
      let v = cam.view(1.2);
      const flag = ['#f6ecd6', '#9db884', '#e88a6c', '#f2cf8c'];
      for (let x = Math.floor(v.x0 / 64) * 64; x < v.x1 + 64; x += 64) {
        const i = Math.round(x / 64), y = -566 + 22 * Math.sin(x * 0.006) + Math.sin(t * 1.4 + i) * 2.5;
        poly(ctx, flag[((i % 4) + 4) % 4], [x - 22, y, x + 22, y + 2, x + Math.sin(t * 2 + i) * 4, y + 44]);
      }
      cam.pop(ctx);
      cam.push(ctx, 1.4);
      v = cam.view(1.4);
      for (const g of this.frontHedge) if (g.x > v.x0 - 120 && g.x < v.x1 + 120) {
        ell(ctx, mx('#1c3724', '#3a1c14', heat * 0.4), g.x, 138 + g.a * 16, 90 + g.b * 40, 58);
        ell(ctx, mx('#2c5031', '#5a2a18', heat * 0.4), g.x - 20, 104 + g.a * 16, 46, 20);
      }
      cam.pop(ctx);
      glow(ctx, 190 - (cam.x - 1400) * 0.02, 318, 700, mx('#ffd58c', '#ff8a3c', heat), 0.2);
      if (heat) rect(ctx, A('#ff4a1c', heat * (0.1 + 0.03 * Math.sin(t * 5))), 0, 0, W, H);
      vignette(ctx, 0.16 + heat * 0.1, mx('#2c1608', '#3a0a06', heat));
    },
  };

  /* ================================================================ INK */
  const INK = '#1e1c1a', PAPER = '#ebe2cf', RED = '#c8102e';
  function ridge(seed, x0, x1, step, base, amp, jag, f) {
    const q = U.seeded(seed), a = [], p1 = q() * 9, p2 = q() * 9;
    for (let x = x0; x <= x1; x += step) a.push([x, base - amp * (0.3 + 0.7 * Math.abs(Math.sin(x * f + p1))) * (0.7 + 0.3 * Math.sin(x * f * 3.1 + p2)) - q() * jag]);
    return a;
  }
  function drawRidge(ctx, pts, v, topY, baseY, a, dy = 0) {
    ctx.fillStyle = vg(ctx, topY, baseY, [0, A(INK, a), 0.6, A(INK, a * 0.32), 1, A(INK, 0)]);
    ctx.beginPath(); let on = false, lx = 0;
    for (const p of pts) {
      if (p[0] < v.x0 - 140 || p[0] > v.x1 + 140) continue;
      if (!on) { ctx.moveTo(p[0], baseY); on = true; }
      ctx.lineTo(p[0], p[1] + dy); lx = p[0];
    }
    if (on) { ctx.lineTo(lx, baseY); ctx.fill(); }
  }
  function mistBand(ctx, x, y, r, a) {
    ctx.save(); ctx.translate(x, y); ctx.scale(3.4, 0.34); glow(ctx, 0, 0, r, PAPER, a); ctx.restore();
  }
  S.ink = {
    width: 1900, platforms: [], hideSpots: [],
    light: { ambient: '#e9e0cd', amount: 0, rim: RED, grade: 'ink' },
    bamboo: [-360, 90, 560, 1120, 1560],
    init() {
      if (this._i) return; this._i = true;
      this.r1 = ridge(101, -760, 1000, 46, -150, 330, 26, 0.0052);
      this.r2 = ridge(102, -760, 1200, 40, -90, 290, 20, 0.0061);
      this.r3 = ridge(103, -760, 1500, 36, -30, 210, 14, 0.0047);
      this.gaps = scatter(104, -760, 2700, 34);
      this.wash = scatter(105, -760, 2700, 150);
      this.petals = scatter(106, 0, 29, 1);
    },
    sun(cam) { return [900 - (cam.x - 950) * 0.04, 232]; },
    draw(ctx, cam, st) {
      this.init();
      const t = st.t || 0;
      rect(ctx, vg(ctx, 0, H, [0, '#e4d9c2', 0.5, PAPER, 1, '#f1e9d8']), 0, 0, W, H);
      const [sx, sy] = this.sun(cam);
      glow(ctx, sx, sy, 230, RED, 0.2);
      ell(ctx, A(RED, 0.92), sx, sy, 150, 150);
      ell(ctx, A('#e2334c', 0.35), sx - 30, sy - 34, 96, 92);
      cam.push(ctx, 0.1); let v = cam.view(0.1);
      drawRidge(ctx, this.r1, v, -480, -150, 0.12, -9); drawRidge(ctx, this.r1, v, -480, -150, 0.3);
      cam.pop(ctx);
      mistBand(ctx, wrap(300 + t * 5 - cam.x * 0.06, 2200) - 400, 356, 190, 0.8);
      cam.push(ctx, 0.22); v = cam.view(0.22);
      drawRidge(ctx, this.r2, v, -380, -90, 0.16, -8); drawRidge(ctx, this.r2, v, -380, -90, 0.46);
      cam.pop(ctx);
      mistBand(ctx, wrap(1300 - t * 7 - cam.x * 0.12, 2400) - 500, 428, 200, 0.85);
      cam.push(ctx, 0.4); v = cam.view(0.4);
      drawRidge(ctx, this.r3, v, -240, -30, 0.2, -7); drawRidge(ctx, this.r3, v, -240, -30, 0.62);
      cam.pop(ctx);
      mistBand(ctx, wrap(800 + t * 9 - cam.x * 0.2, 2400) - 500, 492, 210, 0.8);
      // bamboo, pine, dojo
      cam.push(ctx, 0.6); v = cam.view(0.6);
      { // dojo
        const x = 330;
        if (x > v.x0 - 260 && x < v.x1 + 260) {
          const c = A(INK, 0.58);
          for (const px of [-130, -44, 44, 130]) rect(ctx, c, x + px - 6, -196, 12, 160);
          rect(ctx, c, x - 160, -44, 320, 12); rect(ctx, A(INK, 0.3), x - 180, -32, 360, 10);
          poly(ctx, A(INK, 0.72), [x - 214, -222, x - 176, -200, x + 176, -200, x + 214, -222, x + 150, -214, x + 96, -274, x - 96, -274, x - 150, -214]);
          rect(ctx, A(INK, 0.8), x - 104, -282, 208, 9); rect(ctx, A(INK, 0.8), x - 112, -290, 10, 14); rect(ctx, A(INK, 0.8), x + 102, -290, 10, 14);
          rect(ctx, A(RED, 0.7), x - 34, -150, 68, 6);
        }
      }
      { // pine
        const x = 860;
        if (x > v.x0 - 200 && x < v.x1 + 200) {
          poly(ctx, A(INK, 0.8), [x - 14, -24, x - 2, -118, x - 20, -198, x + 12, -292, x + 24, -288, x - 2, -198, x + 18, -118, x + 14, -24]);
          poly(ctx, A(INK, 0.7), [x - 16, -190, x - 84, -238, x - 82, -244, x - 12, -204]);
          poly(ctx, A(INK, 0.7), [x + 8, -230, x + 86, -262, x + 84, -268, x + 10, -242]);
          for (const p of [[-70, -250, 72, 14], [64, -302, 84, 15], [0, -342, 62, 13], [92, -272, 56, 12], [-58, -196, 46, 10]]) {
            ell(ctx, A(INK, 0.16), x + p[0], p[1] + 12, p[2] * 1.15, p[3] * 1.5);
            ell(ctx, A(INK, 0.78), x + p[0], p[1], p[2], p[3]);
          }
        }
      }
      for (const bx of this.bamboo) if (bx > v.x0 - 220 && bx < v.x1 + 220) {
        const q = U.seeded(bx + 4000), n = 4 + ((q() * 3) | 0);
        for (let i = 0; i < n; i++) {
          const x0 = bx + (q() - 0.5) * 150, hh = 370 + q() * 230, w = 5 + q() * 4, al = 0.34 + q() * 0.34;
          const lean = (q() - 0.5) * 70 + Math.sin(t * 0.7 + bx + i) * 7, segs = Math.floor(hh / 54), col = A(INK, al);
          for (let s = 0; s < segs; s++) {
            const u0 = s / segs, u1 = (s + 0.92) / segs;
            const xa = x0 + lean * u0 * u0, xb = x0 + lean * u1 * u1, ya = -s * 54 + 10, yb = ya - 50, wk = w * (1 - u0 * 0.35);
            poly(ctx, col, [xa - wk / 2, ya, xa + wk / 2, ya, xb + wk / 2, yb, xb - wk / 2, yb]);
            if (s > segs - 5 && q() > 0.25) {
              const dir = q() > 0.5 ? 1 : -1;
              for (let k = 0; k < 3; k++) {
                const an = (dir > 0 ? 0 : Math.PI) + dir * (0.25 + k * 0.32) + Math.sin(t + s + k) * 0.05, len = 34 + q() * 22;
                ell(ctx, A(INK, al + 0.12), xb + Math.cos(an) * len / 2, yb + Math.sin(an) * len / 2, len / 2, 4.4, an);
              }
            }
          }
        }
      }
      cam.pop(ctx);
      rect(ctx, vg(ctx, GY - 260, GY + 10, [0, A(PAPER, 0), 0.75, A(PAPER, 0.62), 1, A(PAPER, 0.5)]), 0, GY - 260, W, 270);
      // dry-brush ground
      cam.push(ctx, 1); v = cam.view(1);
      for (const w0 of this.wash) if (w0.x > v.x0 - 400 && w0.x < v.x1 + 100)
        ell(ctx, A(INK, 0.05 + w0.a * 0.09), w0.x + 120, 60 + w0.b * 150, 150 + w0.c * 200, 9 + w0.d * 16);
      ctx.fillStyle = vg(ctx, -4, 40, [0, A(INK, 0.94), 0.55, A(INK, 0.8), 1, A(INK, 0.2)]);
      ctx.beginPath(); ctx.moveTo(v.x0, -2);
      for (let x = Math.floor(v.x0 / 30) * 30; x <= v.x1 + 30; x += 30) ctx.lineTo(x, -2.5 + 1.8 * Math.sin(x * 0.045) + 1.2 * Math.sin(x * 0.17));
      for (let x = Math.ceil(v.x1 / 30) * 30 + 30; x >= v.x0 - 30; x -= 30) ctx.lineTo(x, 32 + 7 * Math.sin(x * 0.021 + 1) + 4 * Math.sin(x * 0.09));
      ctx.fill();
      ctx.fillStyle = A(PAPER, 0.5);
      for (const g of this.gaps) if (g.x > v.x0 - 240 && g.x < v.x1 + 20) if (g.d > 0.45) ctx.fillRect(g.x, 6 + g.a * 28, 60 + g.b * 190, 3 + g.c * 2.5);
      cam.pop(ctx);
    },
    drawFront(ctx, cam, st) {
      this.init();
      const t = st.t || 0;
      mistBand(ctx, wrap(500 + t * 14 - cam.x * 1.2, 2600) - 600, 706, 230, 0.7);
      for (const p of this.petals) {
        const big = p.d > 0.82, sp = big ? 1.6 : 1;
        const x = wrap(p.a * 1460 + t * (26 + p.b * 44) * sp + Math.sin(t * 0.9 + p.c * 20) * 30 - cam.x * (big ? 0.5 : 0.25), 1460) - 90;
        const y = wrap(p.c * 840 + t * (46 + p.d * 50) * sp, 840) - 60;
        ell(ctx, A(RED, big ? 0.55 : 0.9), x, y, big ? 11 : 6.5, big ? 6.5 : 4, t * (1 + p.a * 2) + p.b * 6);
      }
      const k = Math.floor(t / 1.7), f = t / 1.7 - k, q = U.seeded(k + 9);
      if (q() > 0.4) {
        const ox = q() * W, oy = 80 + q() * 380, al = Math.sin(f * Math.PI) * 0.5;
        for (let i = 0; i < 7; i++) ell(ctx, A(INK, al * (0.4 + q() * 0.6)), ox + (q() - 0.5) * 120, oy + (q() - 0.5) * 70, 2.6 + q() * 3.4, 2.4 + q() * 2.6);
      }
      vignette(ctx, 0.13, '#5c4426', 420);
    },
  };

  /* ============================================================== LOBBY */
  function sqText(ctx, str, x, y, size, col, maxW) {
    ctx.font = `${size}px ${FONT_D}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(str, x, y, maxW);
  }
  const POSTERS = [
    { x: 480, bg: '#1d4f8a', fg: '#ffd23c', ac: '#f4f4f4', l1: 'SOUL JET 2', l2: 'STILL DELAYED' },
    { x: 900, bg: '#7a1f3a', fg: '#f2a0b0', ac: '#fff1c4', l1: "GRANDMA'S", l2: 'REVENGE III' },
    { x: 1250, bg: '#f2c230', fg: '#b02a2a', ac: '#2a1a1a', l1: 'KUNG FU', l2: 'CHURCH' },
    { x: 2150, bg: '#2a5a3c', fg: '#b6e05a', ac: '#f2f2e0', l1: 'BLOCK PARTY', l2: 'OF THE DEAD' },
    { x: 2540, bg: '#e8e0d0', fg: '#d0402c', ac: '#1e2a4a', l1: 'LATE FEE', l2: 'THE MOVIE' },
    { x: 2930, bg: '#3a2a6a', fg: '#ff8a3c', ac: '#ffe9b0', l1: 'TAX SEASON', l2: 'RECKONING' },
  ];
  function posterArt(ctx, i, x, y, p) {
    if (i === 0) { ell(ctx, p.fg, x, y, 46, 46); poly(ctx, p.ac, [x - 70, y + 26, x + 62, y - 30, x + 70, y - 12, x - 40, y + 40]); poly(ctx, p.ac, [x + 4, y - 4, x + 34, y - 52, x + 46, y - 46, x + 30, y - 8]); }
    else if (i === 1) { ell(ctx, p.fg, x, y + 10, 44, 46); ell(ctx, p.ac, x, y - 44, 22, 18); rect(ctx, p.bg, x - 34, y, 28, 16); rect(ctx, p.bg, x + 6, y, 28, 16); rect(ctx, p.bg, x - 16, y + 30, 32, 7); }
    else if (i === 2) { poly(ctx, p.fg, [x - 34, y - 6, x, y - 62, x + 34, y - 6]); rect(ctx, p.fg, x - 34, y - 6, 68, 62); rect(ctx, p.ac, x - 6, y - 48, 12, 34); rect(ctx, p.ac, x - 17, y - 38, 34, 10); poly(ctx, p.ac, [x - 72, y + 44, x + 72, y + 14, x + 72, y + 30, x - 72, y + 58]); }
    else if (i === 3) { ell(ctx, p.ac, x + 30, y - 30, 30, 30); rect(ctx, p.fg, x - 30, y, 50, 60); for (let k = 0; k < 4; k++) rect(ctx, p.fg, x - 30 + k * 13, y - 30 - (k % 2) * 12, 10, 34); rect(ctx, p.fg, x + 22, y + 6, 22, 12); }
    else if (i === 4) { ell(ctx, p.fg, x, y, 54, 54); ell(ctx, p.bg, x, y, 30, 30); ell(ctx, p.ac, x, y, 12, 12); rect(ctx, p.ac, x - 70, y + 34, 140, 12); }
    else { for (let k = 0; k < 4; k++) rect(ctx, p.fg, x - 56 + k * 30, y + 56 - (4 - k) * 26, 22, (4 - k) * 26); poly(ctx, p.ac, [x - 60, y - 54, x + 30, y + 6, x + 40, y - 12, x + 62, y + 46, x + 6, y + 36, x + 20, y + 22, x - 66, y - 38]); }
  }
  S.lobby = {
    width: 3400, platforms: [],
    hideSpots: [{ x: 560, w: 150 }, { x: 1050, w: 150 }, { x: 1540, w: 150 }, { x: 2030, w: 150 }, { x: 2520, w: 150 }, { x: 3000, w: 150 }],
    light: { ambient: '#12343c', amount: 0.35, rim: '#ffd9a0', grade: 'none' },
    init() {
      if (this._i) return; this._i = true;
      const [c, g] = U.canvas(240, 240, 0.5), q = U.seeded(88);
      g.fillStyle = '#211c46'; g.fillRect(0, 0, 240, 240);
      const cols = ['#19a6a0', '#d83c8a', '#f2c230', '#5a4fd0'];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const x = i * 60 + 12 + q() * 18, y = j * 60 + 10 + q() * 18, k = (i + j * 3 + ((q() * 2) | 0)) % 4;
        g.fillStyle = cols[k];
        if (k === 0) { g.beginPath(); g.moveTo(x, y + 26); g.lineTo(x + 12, y); g.lineTo(x + 24, y + 26); g.lineTo(x + 36, y); g.lineTo(x + 36, y + 12); g.lineTo(x + 24, y + 38); g.lineTo(x + 12, y + 12); g.lineTo(x, y + 38); g.fill(); }
        else if (k === 1) { g.beginPath(); g.moveTo(x, y + 30); g.lineTo(x + 17, y); g.lineTo(x + 34, y + 30); g.fill(); }
        else if (k === 2) { g.fillRect(x, y + 10, 32, 11); }
        else { g.beginPath(); g.arc(x + 16, y + 16, 15, 0, TAU); g.fill(); g.fillStyle = '#211c46'; g.beginPath(); g.arc(x + 16, y + 16, 7, 0, TAU); g.fill(); }
      }
      this.tile = c;
    },
    draw(ctx, cam, st) {
      this.init();
      const t = st.t || 0;
      rect(ctx, '#07151a', 0, 0, W, H);
      cam.push(ctx, 1);
      const v = cam.view(1), vw = v.x1 - v.x0;
      rect(ctx, vg(ctx, -620, 0, [0, '#0b1e24', 0.45, '#153a45', 1, '#102c35']), v.x0, -720, vw, 720);
      for (let x = Math.floor(v.x0 / 420) * 420; x < v.x1 + 420; x += 420) rect(ctx, '#19434f', x - 13, -520, 26, 440);
      rect(ctx, '#07151a', v.x0, -720, vw, 200); rect(ctx, '#1d4a56', v.x0, -520, vw, 8);
      for (let x = Math.floor(v.x0 / 420) * 420 + 210; x < v.x1 + 420; x += 420) {
        poly(ctx, 'rgba(255,225,160,0.065)', [x - 24, -518, x + 24, -518, x + 170, 0, x - 170, 0]);
        ell(ctx, '#ffe9b0', x, -520, 24, 7); glow(ctx, x, -516, 120, '#ffe2a0', 0.22);
      }
      // posters
      for (let i = 0; i < POSTERS.length; i++) {
        const p = POSTERS[i], x = p.x;
        if (x < v.x0 - 320 || x > v.x1 + 320) continue;
        glow(ctx, x, -366, 250, p.fg, 0.16);
        rect(ctx, '#f6edd0', x - 92, -488, 184, 248);
        rect(ctx, p.bg, x - 85, -481, 170, 234);
        posterArt(ctx, i, x, -404, p);
        rect(ctx, mx(p.bg, '#000000', 0.45), x - 85, -322, 170, 75);
        sqText(ctx, p.l1, x, -302, 28, p.ac, 156); sqText(ctx, p.l2, x, -268, 28, p.fg, 156);
      }
      // concession
      glow(ctx, 1700, -220, 420, '#ffcf70', 0.2);
      for (let i = 0; i < 3; i++) {
        const bx = 1500 + i * 150;
        rect(ctx, '#ffe2a0', bx, -470, 126, 84); rect(ctx, '#c8303c', bx + 10, -458, 60, 16);
        rect(ctx, '#7a5a30', bx + 10, -432, 106, 9); rect(ctx, '#7a5a30', bx + 10, -414, 80, 9);
      }
      sqText(ctx, 'HOT POPCORN', 1700, -350, 44, '#ff5fa2', 380);
      glow(ctx, 1700, -350, 240, '#ff5fa2', 0.2);
      rect(ctx, '#3a3f48', 1820, -200, 84, 84); rect(ctx, '#5f6772', 1820, -200, 84, 14); rect(ctx, '#c8303c', 1836, -176, 20, 28); rect(ctx, '#2f7a4c', 1868, -176, 20, 28);
      rect(ctx, '#c8a03c', 1638, -268, 124, 152); rect(ctx, '#ffe7a0', 1648, -244, 104, 120);
      for (let k = 0; k < 6; k++) ell(ctx, '#fff6d0', 1660 + k * 16, -150 - (k % 3) * 9, 15, 14);
      rect(ctx, '#fff6d0', 1648, -146, 104, 22); rect(ctx, '#c8303c', 1630, -282, 140, 20);
      rect(ctx, '#f1e4c4', 1440, -124, 520, 14);
      for (let k = 0; k < 13; k++) rect(ctx, k & 1 ? '#96303c' : '#7e2632', 1450 + k * 38.5, -110, 38.5, 110);
      rect(ctx, 'rgba(5,10,20,0.3)', 1450, -30, 500, 30);
      // podium + ropes
      poly(ctx, '#3b2a22', [270, 0, 276, -104, 330, -104, 336, 0]); rect(ctx, '#c8a03c', 266, -112, 74, 10);
      rect(ctx, '#2a2f38', 300, -200, 6, 90); rect(ctx, '#f6edd0', 268, -246, 70, 48); rect(ctx, '#c8303c', 278, -236, 50, 12); rect(ctx, '#7a5a30', 278, -216, 36, 8);
      for (const x0 of [700, 2250]) {
        for (let k = 0; k < 4; k++) {
          const a = x0 + k * 130, b = a + 130;
          ctx.strokeStyle = '#8f2236'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(a, -80); ctx.quadraticCurveTo((a + b) / 2, -34, b, -80); ctx.stroke();
        }
        for (let k = 0; k < 5; k++) { const a = x0 + k * 130; rect(ctx, '#b08a30', a - 4, -86, 8, 86); ell(ctx, '#d8b04a', a, -90, 9, 8); ell(ctx, '#8a6a22', a, -2, 16, 5); }
      }
      // doors
      rect(ctx, '#2a1016', 3130, -340, 240, 340); rect(ctx, '#5c1f28', 3142, -328, 105, 328); rect(ctx, '#6a242e', 3253, -328, 105, 328);
      ell(ctx, '#ffe7a0', 3194, -230, 24, 24); ell(ctx, '#ffe7a0', 3306, -230, 24, 24);
      rect(ctx, '#c8a03c', 3232, -180, 8, 60); rect(ctx, '#c8a03c', 3260, -180, 8, 60);
      rect(ctx, '#fff1c4', 3150, -412, 200, 56); sqText(ctx, 'SCREEN 4', 3250, -383, 32, '#a02030', 180);
      glow(ctx, 3250, -384, 190, '#fff1c4', 0.22);
      rect(ctx, '#0b2027', v.x0, -84, vw, 6);
      // carpet
      if (!this.pat) this.pat = ctx.createPattern(this.tile, 'repeat');
      if (this.pat) { ctx.save(); ctx.scale(2, 1); ctx.fillStyle = this.pat; ctx.fillRect(v.x0 / 2, 0, vw / 2, 300); ctx.restore(); }
      else rect(ctx, '#211c46', v.x0, 0, vw, 300);
      rect(ctx, vg(ctx, 0, 250, [0, 'rgba(5,8,22,0.3)', 1, 'rgba(5,8,22,0.82)']), v.x0, 0, vw, 300);
      for (let x = Math.floor(v.x0 / 420) * 420 + 210; x < v.x1 + 420; x += 420) { ell(ctx, A('#ffe2a0', 0.13), x, 50, 200, 38); ell(ctx, A('#ffe2a0', 0.12), x, 46, 120, 22); }
      glow(ctx, 3250, 6, 190, '#ffe9b0', 0.4 + 0.05 * Math.sin(t * 9)); rect(ctx, '#fff1c4', 3142, -5, 216, 6);
      rect(ctx, 'rgba(4,8,16,0.45)', v.x0, 0, vw, 8);
      cam.pop(ctx);
    },
    drawFront(ctx, cam, st) {
      this.init();
      const t = st.t || 0;
      cam.push(ctx, 1);
      const v = cam.view(1), B = 16;
      for (let i = 0; i < 6; i++) {
        const x = this.hideSpots[i].x;
        if (x < v.x0 - 160 || x > v.x1 + 160) continue;
        ell(ctx, 'rgba(2,4,10,0.5)', x, B, 96, 12);
        if (i === 0) {          // cardboard standee
          rect(ctx, '#151a33', x + 30, -120, 14, 134);
          rrect(ctx, '#262c58', x - 72, -208, 144, 222, 14); rect(ctx, '#3b4488', x - 72, -208, 144, 16);
          ell(ctx, '#f2b23c', x - 6, -150, 24, 24); poly(ctx, '#f2b23c', [x - 44, -52, x - 34, -122, x + 22, -122, x + 30, -52]);
          poly(ctx, '#f2b23c', [x + 14, -116, x + 40, -180, x + 58, -172, x + 32, -100]); ell(ctx, '#f2b23c', x + 50, -182, 13, 13);
          rect(ctx, '#d8463a', x - 72, -52, 144, 44); sqText(ctx, 'SOON', x, -29, 32, '#fff1c4', 128);
        } else if (i === 1) {   // plant
          for (let k = 0; k < 7; k++) {
            const an = -Math.PI / 2 + (k - 3) * 0.36 + Math.sin(t * 0.8 + k) * 0.03, l = 150 - Math.abs(k - 3) * 14;
            ell(ctx, k & 1 ? '#1d5a3c' : '#2a7448', x + Math.cos(an) * l * 0.5, -62 + Math.sin(an) * l * 0.5, l * 0.5, 21, an);
          }
          poly(ctx, '#7e4c36', [x - 50, -66, x + 50, -66, x + 38, B, x - 38, B]); rect(ctx, '#96604a', x - 56, -76, 112, 16); poly(ctx, '#5e3626', [x + 10, -60, x + 50, -66, x + 38, B, x + 6, B]);
        } else if (i === 2) {   // claw machine
          glow(ctx, x, -120, 190, '#9fe8f0', 0.16);
          rect(ctx, '#8e2240', x - 72, -212, 144, 228); rect(ctx, '#c9f2f6', x - 60, -172, 120, 100); rect(ctx, '#eafcff', x - 60, -172, 34, 100);
          ell(ctx, '#f2a03c', x - 30, -86, 20, 16); ell(ctx, '#7a5fd0', x + 4, -90, 20, 18); ell(ctx, '#e05a8a', x + 36, -84, 18, 14);
          rect(ctx, '#5f6772', x + 6, -172, 6, 34); poly(ctx, '#5f6772', [x - 6, -122, x + 9, -140, x + 24, -122, x + 17, -122, x + 9, -131, x + 1, -122]);
          rect(ctx, '#ffd23c', x - 72, -212, 144, 38); sqText(ctx, 'GRAB', x, -192, 28, '#8e2240', 120);
          rect(ctx, '#6a1830', x - 72, -66, 144, 12); ell(ctx, '#ffd23c', x - 30, -30, 12, 12); rect(ctx, '#2a0c16', x + 10, -44, 44, 30);
        } else if (i === 3) {   // recycling station + wet floor sign
          rrect(ctx, '#46525e', x - 76, -196, 104, 212, 12); rect(ctx, '#5c6a78', x - 76, -196, 104, 22); rect(ctx, '#232a32', x - 58, -156, 68, 26);
          rect(ctx, '#38424c', x + 6, -120, 22, 136); ell(ctx, '#7fd08a', x - 24, -80, 18, 18);
          poly(ctx, '#f2c230', [x + 22, B, x + 46, -128, x + 62, -128, x + 86, B]); poly(ctx, '#c79a1e', [x + 54, -128, x + 62, -128, x + 86, B, x + 62, B]);
          poly(ctx, '#2a2210', [x + 54, -92, x + 38, -44, x + 70, -44]); rect(ctx, '#2a2210', x + 40, -34, 28, 9);
        } else if (i === 4) {   // arcade cabinet
          glow(ctx, x, -140, 170, '#58e0c8', 0.2);
          poly(ctx, '#20244a', [x - 68, B, x - 68, -214, x + 68, -214, x + 68, B]); rect(ctx, '#f2c230', x - 68, -214, 9, 230); rect(ctx, '#f2c230', x + 59, -214, 9, 230);
          rect(ctx, '#ff5fa2', x - 59, -214, 118, 38); sqText(ctx, 'FIST', x, -194, 28, '#fff6fa', 100);
          rect(ctx, '#0c3a3a', x - 52, -170, 104, 70); rect(ctx, '#58e0c8', x - 46, -164, 92, 58);
          rect(ctx, '#0c3a3a', x - 30, -146, 22, 24); rect(ctx, '#0c3a3a', x + 6, -152, 26, 30); rect(ctx, '#fff6d0', x - 8, -138, 14, 9);
          poly(ctx, '#34396e', [x - 59, -96, x + 59, -96, x + 59, -76, x - 59, -76]); ell(ctx, '#d8463a', x - 28, -90, 9, 7); ell(ctx, '#f2c230', x + 10, -88, 7, 5); ell(ctx, '#58e0c8', x + 32, -88, 7, 5);
          rect(ctx, '#151833', x - 40, -50, 80, 40);
        } else {                // popcorn cart
          ell(ctx, '#1a1e26', x - 46, 2, 18, 18); ell(ctx, '#1a1e26', x + 46, 2, 18, 18); ell(ctx, '#8a8f98', x - 46, 2, 7, 7); ell(ctx, '#8a8f98', x + 46, 2, 7, 7);
          rect(ctx, '#7a808a', x - 76, -52, 152, 16); rect(ctx, '#565c66', x - 70, -36, 140, 26);
          for (let r0 = 0; r0 < 3; r0++) for (let k = 0; k < 3 - r0; k++) {
            const bx = x - 69 + r0 * 23 + k * 46, by = -104 - r0 * 54;
            ell(ctx, '#fff3c4', bx + 22, by, 21, 11);
            for (let s = 0; s < 4; s++) rect(ctx, s & 1 ? '#f6edd0' : '#c8303c', bx + s * 11, by, 11, 52);
          }
        }
      }
      cam.pop(ctx);
      rect(ctx, vg(ctx, 0, 170, [0, 'rgba(4,8,14,0.5)', 1, 'rgba(4,8,14,0)']), 0, 0, W, 170);
      rect(ctx, vg(ctx, 620, H, [0, 'rgba(4,8,14,0)', 1, 'rgba(4,8,14,0.45)']), 0, 620, W, 100);
      vignette(ctx, 0.16, '#020810');
    },
  };

  /* ============================================================ THEATER */
  const SCR = ['#bfe0ff', '#7fd0e0', '#ffd9a0', '#e8f0ff', '#9fb0ff'];
  S.theater = {
    width: 1500, platforms: [], hideSpots: [],
    light: { ambient: '#0d1020', amount: 0.55, rim: '#bfe0ff', grade: 'none' },
    lightFor(st) { return { ambient: '#0d1020', amount: 0.55, rim: this.screenColor((st && st.t) || 0), grade: 'none' }; },
    screenColor(t) {
      const k = t * 0.23, i = Math.floor(k) % 5, f = Math.round(U.smooth(k - Math.floor(k)) * 16) / 16;
      return mx(SCR[i], SCR[(i + 1) % 5], f);
    },
    init() { if (this._i) return; this._i = true; this.motes = scatter(120, 0, 30, 1); },
    draw(ctx, cam, st) {
      this.init();
      const t = st.t || 0, col = this.screenColor(t), fl = 0.86 + 0.14 * Math.sin(t * 13) * Math.sin(t * 7.3);
      rect(ctx, '#05050a', 0, 0, W, H);
      cam.push(ctx, 0.92);
      let v = cam.view(0.92);
      rect(ctx, '#0a0a14', v.x0, -760, v.x1 - v.x0, 820);
      const cx = 690, x0 = cx - 590, sw = 1180, y0 = -548, sh = 452;
      glow(ctx, cx, -322, 940, col, 0.24 * fl);
      rect(ctx, '#020206', x0 - 12, y0 - 12, sw + 24, sh + 24);
      rect(ctx, mx('#1c2030', col, 0.62 + 0.3 * fl), x0, y0, sw, sh);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, sw, sh); ctx.clip();
      for (let i = 0; i < 4; i++) {
        const bx = cx + Math.sin(t * (0.21 + i * 0.07) + i * 2.1) * 430, by = -322 + Math.cos(t * (0.17 + i * 0.05) + i) * 150;
        glow(ctx, bx, by, 330 + i * 40, SCR[(i * 2 + 1) % 5], 0.5 * fl);
      }
      ell(ctx, A('#10131e', 0.3), cx + Math.sin(t * 0.31) * 320, -150 + Math.sin(t * 0.5) * 20, 240, 120);
      ell(ctx, A('#10131e', 0.22), cx - 300 + Math.cos(t * 0.27) * 200, -200, 150, 170);
      rect(ctx, A('#ffffff', 0.1 * fl), x0, y0, sw, sh * 0.5);
      ctx.restore();
      rect(ctx, '#12121e', v.x0, -84, v.x1 - v.x0, 150); rect(ctx, A(col, 0.3), x0 - 12, -84, sw + 24, 6);
      cam.pop(ctx);
      cam.push(ctx, 1);
      v = cam.view(1);
      const fold = ['#4a0f1c', '#6a1826', '#3a0a14', '#58131f'];
      for (let x = Math.floor(v.x0 / 36) * 36; x < v.x1 + 36; x += 36) {
        if (x >= 150 && x < 1350) continue;
        rect(ctx, fold[(((x / 36) % 4) + 4) % 4], x, -760, 36, 760);
      }
      rect(ctx, hg(ctx, 0, 150, [0, A(col, 0), 1, A(col, 0.3)]), 0, -760, 150, 760);
      rect(ctx, hg(ctx, 1350, 1500, [0, A(col, 0.3), 1, A(col, 0)]), 1350, -760, 150, 760);
      rect(ctx, vg(ctx, 0, 250, [0, mx('#16162a', col, 0.34), 0.5, '#0e0e1a', 1, '#06060a']), v.x0, 0, v.x1 - v.x0, 300);
      ell(ctx, A(col, 0.17 * fl), 750, 22, 540, 30);
      for (let x = 180; x <= 1320; x += 190) { glow(ctx, x, 78, 34, '#ffb84a', 0.3); rect(ctx, '#ffc866', x - 8, 75, 16, 6); }
      rect(ctx, 'rgba(0,0,0,0.4)', v.x0, 0, v.x1 - v.x0, 7);
      cam.pop(ctx);
    },
    drawFront(ctx, cam, st) {
      this.init();
      const t = st.t || 0, col = this.screenColor(t), fl = 0.86 + 0.14 * Math.sin(t * 13) * Math.sin(t * 7.3);
      const ax = -90, ay = -30, g = ctx.createLinearGradient(ax, ay, 1000, 300);
      g.addColorStop(0, A(col, 0.26 * fl)); g.addColorStop(1, A(col, 0.03));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ax, ay - 14); ctx.lineTo(1120, 96); ctx.lineTo(930, 486); ctx.lineTo(ax, ay + 14); ctx.fill();
      for (const m of this.motes) {
        const u = wrap(m.a + t * (0.012 + m.b * 0.02), 1), w0 = (m.c - 0.5) * (30 + 330 * u) + Math.sin(t * (0.6 + m.d) + m.a * 30) * 12;
        const px = U.lerp(ax, 1025, u) - w0 * 0.42, py = U.lerp(ay, 291, u) + w0;
        ell(ctx, A('#ffffff', (0.25 + 0.45 * Math.abs(Math.sin(t * 1.7 + m.d * 20))) * fl), px, py, 2.6 + m.b * 2, 2.6 + m.b * 2);
      }
      const rows = [[1.25, 104, 92, 62], [1.5, 134, 120, 84]];
      for (const [p, sp, sw, ty] of rows) {
        cam.push(ctx, p);
        const v = cam.view(p);
        for (let i = Math.floor(v.x0 / sp) - 1; i * sp < v.x1 + sp; i++) {
          const x = i * sp + (p > 1.3 ? 40 : 0), hsh = ((i * 7919 + (p > 1.3 ? 3 : 0)) % 7 + 7) % 7;
          if (hsh < 3) { ell(ctx, A(col, 0.36), x + sw / 2, ty - 20, 26, 28); ell(ctx, '#07070d', x + sw / 2, ty - 16, 26, 28); }
          rrect(ctx, A(col, 0.42), x, ty - 5, sw, 60, 16); rrect(ctx, '#0a0a12', x, ty, sw, 220, 16);
        }
        cam.pop(ctx);
      }
      vignette(ctx, 0.18, '#000008');
    },
  };

  /* ============================================================== HOUSE */
  S.house = {
    width: 1700, hideSpots: [],
    platforms: [{ x1: 1180, x2: 1700, y: -210 }],
    light: { ambient: '#e8b06a', amount: 0.12, rim: '#ffd9a0', grade: 'none' },
    lightFor(st) {
      const d = n0(st && st.dark), g = n0(st && st.ghost), f = n0(st && st.flash);
      return {
        ambient: mx(mx('#e8b06a', '#16224a', d), '#2f6a34', g * 0.6),
        amount: U.lerp(0.12, 0.5, d) * (1 - f * 0.5) + g * 0.08,
        rim: mx(mx(mx('#ffd9a0', '#9fc0ff', d), '#9dff7a', g), '#ffffff', f), grade: 'none',
      };
    },
    init() { if (this._i) return; this._i = true; this.wisps = scatter(140, 0, 7, 1); },
    draw(ctx, cam, st) {
      this.init();
      const t = st.t || 0, d = n0(st.dark), f = n0(st.flash), gh = n0(st.ghost);
      rect(ctx, '#3a2a1e', 0, 0, W, H);
      cam.push(ctx, 1);
      const v = cam.view(1), vw = v.x1 - v.x0;
      // wall
      rect(ctx, '#d2b07c', v.x0, -760, vw, 760);
      for (let x = Math.floor(v.x0 / 140) * 140; x < v.x1 + 140; x += 140) rect(ctx, '#c8a56f', x, -760, 70, 760);
      rect(ctx, vg(ctx, -620, -100, [0, 'rgba(90,50,30,0.34)', 0.4, 'rgba(90,50,30,0)', 1, 'rgba(255,230,170,0.1)']), v.x0, -760, vw, 660);
      rect(ctx, '#8a6a48', v.x0, -760, vw, 222); rect(ctx, '#f1e2c2', v.x0, -540, vw, 18);
      // upstairs door + picture
      rect(ctx, '#6e5236', 1432, -428, 116, 218); rect(ctx, '#8a6844', 1442, -418, 96, 208); rect(ctx, '#7a5a3c', 1454, -404, 72, 84); rect(ctx, '#7a5a3c', 1454, -306, 72, 84); ell(ctx, '#d8b04a', 1526, -312, 6, 6);
      rect(ctx, '#6e4a2c', 1254, -388, 86, 78); rect(ctx, '#9fc0c8', 1264, -378, 66, 58); poly(ctx, '#5d8a5c', [1264, -320, 1290, -352, 1310, -336, 1330, -356, 1330, -320]);
      // wainscot
      rect(ctx, '#8e6c48', v.x0, -98, vw, 98);
      for (let x = Math.floor(v.x0 / 150) * 150; x < v.x1 + 150; x += 150) rect(ctx, '#9a7852', x + 18, -80, 114, 56);
      rect(ctx, '#b08a5e', v.x0, -106, vw, 10); rect(ctx, '#6e5236', v.x0, -12, vw, 12);
      // window frame + curtains (panes drawn after the darkness pass)
      rect(ctx, '#f6efe0', 198, -412, 264, 284);
      // photos
      const ph = [[548, 0], [630, 1], [712, 2]];
      for (const [px, k] of ph) {
        rect(ctx, '#6e4a2c', px - 36, -392, 72, 88); rect(ctx, '#f1e2c2', px - 28, -384, 56, 72);
        if (k === 0) { ell(ctx, '#2a1c16', px, -356, 21, 20); rect(ctx, '#7a2c2a', px - 13, -334, 26, 22); }
        else if (k === 1) { ell(ctx, '#6a4630', px, -352, 13, 15); rect(ctx, '#2a1c16', px - 13, -368, 26, 9); rect(ctx, '#e9e4d8', px - 15, -336, 30, 24); }
        else { ell(ctx, '#6a4630', px, -352, 14, 16); rect(ctx, '#e9e4d8', px - 17, -356, 9, 12); rect(ctx, '#e9e4d8', px + 8, -356, 9, 12); rect(ctx, '#5d6e46', px - 16, -336, 32, 24); }
      }
      // TV
      rect(ctx, '#5a3c26', 36, -72, 150, 72); rect(ctx, '#6e4c32', 36, -72, 150, 10); rect(ctx, '#4a3020', 48, -54, 58, 44); rect(ctx, '#4a3020', 116, -54, 58, 44);
      rect(ctx, '#16161c', 46, -194, 130, 122); rect(ctx, '#2a3340', 56, -184, 110, 96); poly(ctx, '#3a4656', [56, -184, 112, -184, 76, -88, 56, -88]);
      // couch
      rect(ctx, 'rgba(40,24,14,0.3)', 462, -6, 336, 16);
      rrect(ctx, '#5d6e46', 480, -156, 300, 110, 18); rrect(ctx, '#6f8254', 492, -146, 134, 80, 12); rrect(ctx, '#6f8254', 634, -146, 134, 80, 12);
      rect(ctx, '#788c5c', 486, -80, 288, 44); rect(ctx, '#667a4e', 628, -80, 6, 44); rect(ctx, '#4c5c3a', 480, -38, 300, 30);
      rrect(ctx, '#4c5c3a', 462, -122, 40, 116, 12); rrect(ctx, '#4c5c3a', 758, -122, 40, 116, 12);
      rrect(ctx, '#b0483a', 506, -112, 54, 40, 10);
      // lamp
      rect(ctx, '#3a2f28', 840, -262, 7, 262); ell(ctx, '#3a2f28', 843, -3, 24, 7);
      poly(ctx, mx('#f6dfa6', '#6a6258', d), [814, -262, 872, -262, 860, -332, 826, -332]);
      glow(ctx, 843, -292, 250, '#ffdf9a', 0.34 * (1 - d));
      // stairs
      for (let i = 0; i < 8; i++) {
        const sx = 900 + i * 35, sy = -(i + 1) * 26.25;
        rect(ctx, i & 1 ? '#86643f' : '#8e6c46', sx, sy, 1180 - sx, 26.25); rect(ctx, '#caa672', sx, sy, 39, 6);
        rect(ctx, '#4a3324', sx + 14, sy - 84, 6, 84);
      }
      rect(ctx, '#4a3324', 894, -110, 14, 110); ell(ctx, '#5c4230', 901, -114, 11, 9);
      ctx.strokeStyle = '#4a3324'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(900, -104); ctx.lineTo(1184, -300); ctx.stroke();
      // landing
      rect(ctx, '#a8875c', 1180, -184, 1330, 86);
      rect(ctx, '#6e5236', 1312, -174, 116, 174); rect(ctx, '#8a6844', 1322, -164, 96, 164); ell(ctx, '#d8b04a', 1336, -84, 6, 6);
      for (let x = 1200; x < v.x1 + 40; x += 40) rect(ctx, '#4a3324', x, -284, 6, 74);
      rect(ctx, '#4a3324', 1176, -300, 14, 90); rect(ctx, '#4a3324', 1180, -292, 1330, 9);
      rect(ctx, '#caa672', 1176, -212, 1334, 14); rect(ctx, '#6e5236', 1176, -198, 1334, 14);
      rect(ctx, 'rgba(40,24,14,0.22)', 1180, -184, 1330, 26);
      // floor
      rect(ctx, vg(ctx, 0, 250, [0, '#a8743e', 0.4, '#7e5230', 1, '#4e3220']), v.x0, 0, vw, 300);
      ctx.fillStyle = 'rgba(50,28,14,0.22)';
      const rows = [0, 24, 56, 98, 150, 214, 300];
      for (let r0 = 1; r0 < rows.length - 1; r0++) ctx.fillRect(v.x0, rows[r0], vw, 4);
      for (let r0 = 0; r0 < rows.length - 1; r0++) for (let x = Math.floor(v.x0 / 260) * 260 + ((r0 * 97) % 260); x < v.x1 + 260; x += 260) ctx.fillRect(x, rows[r0], 5, rows[r0 + 1] - rows[r0]);
      poly(ctx, '#c9a05a', [392, 26, 868, 26, 912, 122, 348, 122]); poly(ctx, '#8e3a34', [412, 36, 848, 36, 882, 112, 378, 112]); ell(ctx, '#b0564a', 630, 74, 150, 24);
      rect(ctx, 'rgba(40,24,14,0.3)', v.x0, 0, vw, 8);
      // light shaft on the floor
      poly(ctx, A(mx('#ffe2a0', '#a8c4ff', d), 0.26 - 0.06 * d), [214, 0, 446, 0, 930, 150, 590, 150]);
      // state passes
      if (d) rect(ctx, A('#0a1230', 0.68 * d), v.x0, -760, vw, 1060);
      if (gh) rect(ctx, vg(ctx, -440, 140, [0, A('#7dff5a', 0), 1, A('#7dff5a', (0.26 + 0.05 * Math.sin(t * 3)) * gh)]), v.x0, -440, vw, 740);
      if (f) rect(ctx, A('#dfe8ff', 0.3 * f), v.x0, -760, vw, 1060);
      // emissive: window panes, TV
      const pane = mx(mx('#ffdf9c', '#1c2c5e', d), '#ffffff', f);
      rect(ctx, pane, 210, -400, 240, 260);
      if (d > 0.3 && f < 0.5) ell(ctx, '#e8f0ff', 372, -338, 22, 22);
      rect(ctx, mx('#f6efe0', '#3a4468', d * 0.8), 326, -400, 8, 260); rect(ctx, mx('#f6efe0', '#3a4468', d * 0.8), 210, -274, 240, 8);
      const sw = Math.sin(t * 0.9) * 5, cur = A(mx('#fffaf0', '#8a9ad0', d), 0.62);
      poly(ctx, cur, [204, -410, 270, -410, 250 + sw, -260, 262 + sw, -132, 204, -132]);
      poly(ctx, cur, [456, -410, 390, -410, 410 - sw, -260, 398 - sw, -132, 456, -132]);
      rect(ctx, '#4a3324', 186, -420, 288, 8);
      glow(ctx, 330, -270, 330, mx(mx('#ffe7a8', '#9fb8ff', d), '#ffffff', f), 0.24 + 0.4 * f);
      if (d) { rect(ctx, mx('#2a3340', '#a8c8ff', 0.45 + 0.4 * Math.sin(t * 31) * Math.sin(t * 13)), 56, -184, 110, 96); glow(ctx, 111, -136, 210, '#9fc0ff', 0.26 * d); }
      cam.pop(ctx);
    },
    drawFront(ctx, cam, st) {
      this.init();
      const t = st.t || 0, d = n0(st.dark), f = n0(st.flash), gh = n0(st.ghost);
      cam.push(ctx, 1);
      poly(ctx, A(mx('#fff0c0', '#b8d0ff', d), 0.085), [214, -396, 446, -396, 930, 150, 590, 150]);
      cam.pop(ctx);
      if (gh) {
        cam.push(ctx, 1.06);
        ctx.lineCap = 'round'; ctx.lineWidth = 9;
        for (const w0 of this.wisps) {
          const u = wrap(w0.a + t * (0.05 + w0.b * 0.05), 1), x = w0.c * 1900 - 100 + Math.sin(t * 0.6 + w0.d * 9) * 60, y = 60 - u * 420;
          ctx.strokeStyle = A('#9dff7a', 0.24 * gh * Math.sin(u * Math.PI));
          ctx.beginPath(); ctx.moveTo(x, y);
          ctx.bezierCurveTo(x + 40 * Math.sin(t + w0.d * 5), y - 40, x - 40 * Math.sin(t * 1.3 + w0.a * 5), y - 80, x + 14, y - 124); ctx.stroke();
        }
        cam.pop(ctx);
        rect(ctx, vg(ctx, 440, H, [0, A('#7dff5a', 0), 1, A('#7dff5a', 0.12 * gh)]), 0, 440, W, 280);
      }
      if (f) rect(ctx, A('#ffffff', 0.14 * f), 0, 0, W, H);
      vignette(ctx, 0.14 + 0.08 * d, mx('#2a1408', '#04061a', d));
    },
  };

  /* ============================================================= STREET */
  function nightHouse(ctx, x, w, h, wall, roof, litWin) {
    rect(ctx, wall, x - w / 2, -40 - h, w, h);
    poly(ctx, roof, [x - w / 2 - 22, -40 - h, x, -40 - h - w * 0.26, x + w / 2 + 22, -40 - h]);
    rect(ctx, '#161e36', x - w * 0.3, -40 - h * 0.7, 44, 50); rect(ctx, litWin ? '#ffd98a' : '#161e36', x + w * 0.12, -40 - h * 0.7, 44, 50);
    if (litWin) glow(ctx, x + w * 0.12 + 22, -40 - h * 0.7 + 25, 90, '#ffcf80', 0.3);
  }
  S.street = {
    width: 2200, platforms: [], hideSpots: [],
    light: { ambient: '#1a2740', amount: 0.4, rim: '#ffb45e', grade: 'none' },
    lightFor(st) {
      const f = n0(st && st.flash);
      return { ambient: mx('#1a2740', '#8fa6d8', f * 0.6), amount: 0.4 - 0.15 * f, rim: mx('#ffb45e', '#ffffff', f), grade: 'none' };
    },
    lamps: [300, 1380, 2000],
    init() {
      if (this._i) return; this._i = true;
      this.far = scatter(160, -720, 1500, 90);
      this.rainA = scatter(161, 0, 71, 1); this.rainB = scatter(162, 0, 47, 1);
      this.pud = [[180, 70, 120], [760, 120, 170], [1180, 60, 130], [1640, 150, 190], [2080, 84, 120]];
    },
    draw(ctx, cam, st) {
      this.init();
      const t = st.t || 0, f = n0(st.flash);
      rect(ctx, vg(ctx, 0, 480, [0, mx('#060a18', '#6f86b8', f * 0.6), 0.6, mx('#131d38', '#8fa6d8', f * 0.6), 1, mx('#26344f', '#b8c8e8', f * 0.6)]), 0, 0, W, H);
      for (let i = 0; i < 6; i++) {
        const cx = wrap(i * 380 + t * 6 - cam.x * 0.04, 2200) - 400, cy = 60 + ((i * 71) % 170);
        ell(ctx, mx('#182240', '#c8d8f8', f * 0.7), cx, cy + 12, 260, 34); ell(ctx, '#0b1124', cx, cy, 260, 34);
      }
      cam.push(ctx, 0.3);
      let v = cam.view(0.3);
      ctx.fillStyle = mx('#0e1528', '#3a4a70', f * 0.4); ctx.beginPath(); ctx.moveTo(v.x0, 330);
      for (let x = v.x0; x <= v.x1 + 24; x += 24) ctx.lineTo(x, -176 - 16 * Math.sin(x * 0.017) - 10 * Math.sin(x * 0.043 + 1));
      ctx.lineTo(v.x1 + 24, 330); ctx.fill();
      for (const h of this.far) if (h.a > 0.55 && h.x > v.x0 && h.x < v.x1) rect(ctx, '#e8b860', h.x, -150 + h.b * 30, 6, 7);
      cam.pop(ctx);
      // houses
      cam.push(ctx, 0.8);
      v = cam.view(0.8);
      const hx = 880;
      rect(ctx, '#111f1f', v.x0, -44, v.x1 - v.x0, 380);
      nightHouse(ctx, hx - 660, 340, 230, '#1f2942', '#131a2c', true);
      nightHouse(ctx, hx + 800, 360, 250, '#222c46', '#141b2e', false);
      nightHouse(ctx, hx - 1240, 320, 220, '#1c2640', '#121829', false);
      nightHouse(ctx, hx + 1340, 320, 230, '#1f2942', '#131a2c', true);
      for (const tx of [hx - 390, hx + 520, hx - 960, hx + 1080]) { rect(ctx, '#0a1214', tx - 8, -150, 16, 110); ell(ctx, '#0c1a1c', tx, -220, 96, 110); ell(ctx, '#12262a', tx - 26, -256, 50, 56); }
      // the Freeman house
      rect(ctx, '#34405a', hx + 206, -206, 196, 166); poly(ctx, '#1a2134', [hx + 190, -206, hx + 304, -262, hx + 418, -206]); rect(ctx, '#283250', hx + 228, -160, 152, 120);
      for (let k = 1; k < 4; k++) rect(ctx, '#1f2840', hx + 228, -160 + k * 30, 152, 4);
      rect(ctx, '#3b4964', hx - 210, -332, 420, 292); rect(ctx, '#465678', hx - 210, -332, 130, 292);
      ctx.fillStyle = 'rgba(10,14,30,0.16)'; for (let y = -310; y < -44; y += 24) ctx.fillRect(hx - 210, y, 420, 4);
      poly(ctx, '#1b2236', [hx - 244, -332, hx, -452, hx + 244, -332]); poly(ctx, '#2c3654', [hx - 244, -332, hx, -452, hx - 16, -436, hx - 214, -338]);
      rect(ctx, '#232b42', hx + 110, -440, 34, 70);
      for (let k = -1; k <= 1; k++) {
        const wx = hx + k * 130 - 28, lit = k === 1;
        rect(ctx, '#c8d0e0', wx - 6, -306, 68, 74); rect(ctx, lit ? '#ffd98a' : '#172040', wx, -300, 56, 62);
        if (lit) { rect(ctx, '#e8a85a', wx, -300, 14, 62); rect(ctx, '#e8a85a', wx + 42, -300, 14, 62); glow(ctx, wx + 28, -270, 130, '#ffcf80', 0.34); }
        else rect(ctx, '#2c3c66', wx, -300, 56, 14);
      }
      rect(ctx, '#172040', hx - 172, -168, 70, 80); rect(ctx, '#2c3c66', hx - 172, -168, 70, 14); rect(ctx, '#172040', hx + 102, -168, 70, 80); rect(ctx, '#2c3c66', hx + 102, -168, 70, 14);
      glow(ctx, hx, -150, 230, '#ffcf80', 0.42);
      rect(ctx, '#6e2c2c', hx - 30, -164, 60, 112); rect(ctx, '#ffd98a', hx - 16, -152, 32, 28); rect(ctx, '#fff1c4', hx - 6, -184, 12, 12);
      poly(ctx, '#2a3248', [hx - 170, -196, hx + 170, -196, hx + 156, -214, hx - 156, -214]);
      for (const cxp of [-150, -62, 62, 150]) rect(ctx, '#aab4cc', hx + cxp - 7, -196, 14, 146);
      rect(ctx, '#565e78', hx - 170, -54, 340, 14); rect(ctx, '#454c64', hx - 60, -40, 120, 14);
      poly(ctx, 'rgba(255,207,128,0.14)', [hx - 60, -26, hx + 60, -26, hx + 110, 60, hx - 110, 60]);
      cam.pop(ctx);
      // fence + mailbox
      cam.push(ctx, 0.92);
      v = cam.view(0.92);
      rect(ctx, '#0f1c1c', v.x0, -8, v.x1 - v.x0, 340);
      ctx.fillStyle = '#7482a6';
      for (let x = Math.floor(v.x0 / 20) * 20; x < v.x1 + 20; x += 20) {
        if (x > 960 && x < 1070) continue;
        ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x, -56); ctx.lineTo(x + 6, -66); ctx.lineTo(x + 12, -56); ctx.lineTo(x + 12, -6); ctx.fill();
      }
      rect(ctx, '#5c6a8e', -1400, -48, 2360, 6); rect(ctx, '#5c6a8e', 1082, -48, 2400, 6);
      rect(ctx, '#5c6a8e', -1400, -24, 2360, 6); rect(ctx, '#5c6a8e', 1082, -24, 2400, 6);
      rect(ctx, '#1c2438', 1108, -70, 9, 66); rrect(ctx, '#2e3a58', 1090, -98, 46, 30, 12); rect(ctx, '#c83040', 1130, -106, 7, 20);
      cam.pop(ctx);
      // sidewalk, lamps, car, wet street
      cam.push(ctx, 1);
      v = cam.view(1);
      const vw = v.x1 - v.x0;
      rect(ctx, '#465069', v.x0, -22, vw, 24); rect(ctx, '#59647f', v.x0, -22, vw, 5);
      for (let x = Math.floor(v.x0 / 170) * 170; x < v.x1 + 170; x += 170) rect(ctx, '#39425a', x, -22, 5, 22);
      rect(ctx, '#2c344c', v.x0, 2, vw, 10);
      rect(ctx, vg(ctx, 10, 250, [0, '#1d2539', 0.5, '#121829', 1, '#090d18']), v.x0, 12, vw, 290);
      for (const p of this.pud) {
        ell(ctx, A('#34466c', 0.55), p[0], p[1], p[2], p[2] * 0.14);
        const u = wrap(t * 0.9 + p[0] * 0.01, 1);
        ctx.strokeStyle = A('#8fa6d8', 0.4 * (1 - u)); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(p[0] + (p[2] * 0.4) * Math.sin(p[0]), p[1], 8 + u * 38, (8 + u * 38) * 0.22, 0, 0, TAU); ctx.stroke();
      }
      for (const lx of this.lamps) {
        if (lx < v.x0 - 320 || lx > v.x1 + 320) continue;
        const hxl = lx + 64;
        poly(ctx, A('#ffb45e', 0.085), [hxl - 20, -424, hxl + 20, -424, hxl + 240, 0, hxl - 240, 0]);
        rect(ctx, '#161c2c', lx - 5, -436, 10, 436); rect(ctx, '#161c2c', lx - 5, -440, 86, 9); rrect(ctx, '#222a3e', hxl - 26, -436, 52, 16, 6);
        ell(ctx, '#ffe6b0', hxl, -420, 18, 6); glow(ctx, hxl, -414, 190, '#ffb45e', 0.5);
        ell(ctx, A('#ffb45e', 0.17), hxl, 22, 250, 36); ell(ctx, A('#ffc47e', 0.14), hxl, 14, 140, 18);
        for (let k = 0; k < 6; k++) rect(ctx, A('#ffb45e', 0.32 - k * 0.05), hxl - 13 + Math.sin(t * 2.2 + k * 1.3) * 7, 14 + k * 36, 26, 30);
      }
      for (let k = 0; k < 5; k++) rect(ctx, A('#ffcf80', 0.16 - k * 0.03), 1100 - 40 + Math.sin(t * 1.8 + k) * 8, 16 + k * 34, 80, 28);
      // parked sedan
      ell(ctx, 'rgba(4,6,12,0.55)', 710, 4, 170, 12);
      poly(ctx, '#16203a', [616, -62, 652, -112, 772, -112, 816, -62]); poly(ctx, '#30446c', [630, -64, 658, -102, 706, -102, 706, -64]); poly(ctx, '#30446c', [716, -64, 716, -102, 766, -102, 798, -64]);
      poly(ctx, '#ffb45e', [640, -80, 656, -102, 672, -102, 656, -80]);
      rrect(ctx, '#1f2c48', 556, -66, 308, 56, 16); rect(ctx, '#55689a', 566, -66, 288, 5); rect(ctx, '#55689a', 654, -112, 116, 5);
      rect(ctx, '#111a2e', 556, -28, 308, 16); rect(ctx, '#c83040', 852, -54, 12, 12); rect(ctx, '#ffe6b0', 556, -52, 10, 10);
      ell(ctx, '#070910', 622, -10, 26, 26); ell(ctx, '#070910', 800, -10, 26, 26); ell(ctx, '#3a4460', 622, -10, 11, 11); ell(ctx, '#3a4460', 800, -10, 11, 11);
      if (f) rect(ctx, A('#cfe0ff', 0.26 * f), v.x0, -760, vw, 1060);
      cam.pop(ctx);
    },
    drawFront(ctx, cam, st) {
      this.init();
      const t = st.t || 0, f = n0(st.flash);
      const rain = (list, len, lw, al, vy, par) => {
        ctx.strokeStyle = A('#a8c0f0', al); ctx.lineWidth = lw; ctx.lineCap = 'butt'; ctx.beginPath();
        for (const r0 of list) {
          const y = wrap(r0.b * 900 + t * vy * (0.85 + r0.c * 0.3), 900) - 90;
          const x = wrap(r0.a * 1520 - t * vy * 0.28 - cam.x * par, 1520) - 120;
          ctx.moveTo(x, y); ctx.lineTo(x - len * 0.28, y + len);
        }
        ctx.stroke();
      };
      rain(this.rainA, 28, 3, 0.2, 950, 0.5);
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(wrap(i * 560 + t * 16 - cam.x * 0.7, 2000) - 360, 566 + i * 22); ctx.scale(3.2, 0.36); glow(ctx, 0, 0, 170, '#8fa6d8', 0.13); ctx.restore(); }
      rain(this.rainB, 64, 4, 0.3, 1500, 1.3);
      ctx.fillStyle = A('#b8ccf4', 0.42);
      for (let i = 0; i < 18; i++) {
        const k = Math.floor(t * 7 + i * 0.37), q = U.seeded(k * 31 + i * 977), x = q() * W, y = GY + 6 + q() * (H - GY - 12);
        ctx.fillRect(x - 7, y - 4, 4, 4); ctx.fillRect(x + 3, y - 4, 4, 4); ctx.fillRect(x - 2, y, 4, 3);
      }
      if (f) rect(ctx, A('#ffffff', 0.2 * f), 0, 0, W, H);
      vignette(ctx, 0.2, '#020410');
    },
  };

  BD.Backgrounds = S;
})();
