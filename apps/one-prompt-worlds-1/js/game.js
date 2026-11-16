/* ぽん、と森は灯る — game: rendering, input, flow */
(function () {
  'use strict';
  var S = PonSim, C = S.C, A = PonAudio;
  var world = S.buildIndex(PonWorld.build());
  var state = S.newState(world);
  var SAVE_KEY = 'pon-forest-v1';

  var cv = document.getElementById('cv'), g = cv.getContext('2d');
  var dark = document.createElement('canvas'), dg = dark.getContext('2d');
  var cw = 1280, ch = 720, dpr = 1, base = 1;
  var cam = { x: world.mother.x + 120, y: world.mother.y - 40, zoom: 1, manual: false, cine: null };
  var mode = 'title';
  var T = 0;                      // seconds since load
  var activeId = state.mush[0].id;
  var aim = null, flight = null, pan = null, hoverId = 0;
  var particles = [], popups = [], manim = {}, gateAnim = {}, litFade = {};
  var hintsSeen = {}, hintTimer = 0, firstShotDone = false;
  var dawn = 0, dawnTarget = 0, ending = null;
  var keys = {}, mouse = { x: 0, y: 0, down: false };
  var showDebug = false;

  function $(id) { return document.getElementById(id); }
  function rnd(seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mushById(id) { for (var i = 0; i < state.mush.length; i++) if (state.mush[i].id === id) return state.mush[i]; return null; }
  function ffCount() { var n = 0; for (var i = 0; i < state.ff.length; i++) if (state.ff[i]) n++; return n; }
  function previewLen() { return 230 + 55 * ffCount(); }
  function anim(id) { return manim[id] || (manim[id] = { sq: 0, sqv: 0, born: -99, grow: -99, blink: Math.random() * 5 }); }
  function canLaunch(m) { return m && (m.kind === 'own' || m.kind === 'mother'); }

  /* ================= static terrain painting ================= */
  var terrain = null, vines = [];
  function paintTerrain() {
    var c = document.createElement('canvas'); c.width = world.W; c.height = world.H;
    var t = c.getContext('2d'), R = rnd(20261114), i, k;
    t.fillStyle = '#1b1526'; t.fillRect(0, 0, c.width, c.height);
    for (i = 0; i < 520; i++) {
      var bx = R() * world.W, by = R() * world.H, br = 80 + R() * 260;
      var gr = t.createRadialGradient(bx, by, 0, bx, by, br);
      var col = ['34,25,48', '14,11,22', '40,28,44', '20,18,36'][i % 4];
      gr.addColorStop(0, 'rgba(' + col + ',.55)'); gr.addColorStop(1, 'rgba(' + col + ',0)');
      t.fillStyle = gr; t.fillRect(bx - br, by - br, br * 2, br * 2);
    }
    var leafCols = ['#3d2b45', '#4a3340', '#33283f', '#553a45', '#3a3454', '#5c4440', '#2b2238'];
    for (i = 0; i < 9000; i++) {
      t.save(); t.translate(R() * world.W, R() * world.H); t.rotate(R() * 6.28);
      t.globalAlpha = 0.35 + R() * 0.45; t.fillStyle = leafCols[(R() * leafCols.length) | 0];
      t.beginPath(); t.ellipse(0, 0, 4 + R() * 7, 2 + R() * 3, 0, 0, 6.28); t.fill(); t.restore();
    }
    t.globalAlpha = 0.5; t.strokeStyle = '#3a2c3c'; t.lineWidth = 2; t.lineCap = 'round';
    for (i = 0; i < 700; i++) { var tx = R() * world.W, ty = R() * world.H, ta = R() * 6.28, tl = 8 + R() * 22; t.beginPath(); t.moveTo(tx, ty); t.lineTo(tx + Math.cos(ta) * tl, ty + Math.sin(ta) * tl); t.stroke(); }
    t.globalAlpha = 1;
    for (i = 0; i < 1500; i++) {   // pebbles
      var pbx = R() * world.W, pby = R() * world.H, pbr = 2 + R() * 5;
      t.fillStyle = 'rgba(0,0,0,.3)'; t.beginPath(); t.ellipse(pbx + 1, pby + 2, pbr, pbr * 0.7, 0, 0, 6.28); t.fill();
      t.fillStyle = ['#4a4a66', '#3d3d58', '#5a5870'][i % 3]; t.beginPath(); t.ellipse(pbx, pby, pbr, pbr * 0.72, R() * 3, 0, 6.28); t.fill();
    }
    t.lineWidth = 1.6;
    for (i = 0; i < 1100; i++) {   // dry grass tufts
      var gx = R() * world.W, gy = R() * world.H; t.strokeStyle = R() < 0.5 ? '#5a4a4e' : '#4a4460'; t.globalAlpha = 0.7;
      for (k = -2; k <= 2; k++) { t.beginPath(); t.moveTo(gx + k * 1.5, gy); t.quadraticCurveTo(gx + k * 3, gy - 7, gx + k * 5 + (R() - 0.5) * 3, gy - 9 - R() * 6); t.stroke(); }
    }
    t.globalAlpha = 1;

    // rivers
    world.rivers.forEach(function (rv) {
      function path() { t.beginPath(); rv.pts.forEach(function (p, j) { if (j) t.lineTo(p[0], p[1]); else t.moveTo(p[0], p[1]); }); }
      t.lineCap = 'round'; t.lineJoin = 'round';
      path(); t.strokeStyle = '#0a0b18'; t.lineWidth = rv.hw * 2 + 16; t.stroke();
      path(); t.strokeStyle = '#102a55'; t.lineWidth = rv.hw * 2; t.stroke();
      path(); t.strokeStyle = '#153a70'; t.lineWidth = rv.hw * 2 - 26; t.stroke();
      path(); t.strokeStyle = 'rgba(40,96,150,.45)'; t.lineWidth = rv.hw * 1.1; t.stroke();
    });

    // moss
    t.fillStyle = '#0e3a36'; world.moss.forEach(function (m) { t.beginPath(); t.arc(m.x, m.y, m.r + 7, 0, 6.28); t.fill(); });
    t.fillStyle = '#1b6a58'; world.moss.forEach(function (m) { t.beginPath(); t.arc(m.x, m.y, m.r, 0, 6.28); t.fill(); });
    t.fillStyle = 'rgba(38,138,108,.55)'; world.moss.forEach(function (m) { t.beginPath(); t.arc(m.x, m.y, m.r - 16, 0, 6.28); t.fill(); });
    t.save(); t.beginPath(); world.moss.forEach(function (m) { t.moveTo(m.x + m.r, m.y); t.arc(m.x, m.y, m.r, 0, 6.28); }); t.clip();
    world.moss.forEach(function (m) {
      var n = (m.r * m.r / 60) | 0;
      for (k = 0; k < n; k++) {
        var a = R() * 6.28, d = Math.sqrt(R()) * m.r, px = m.x + Math.cos(a) * d, py = m.y + Math.sin(a) * d;
        var v = R();
        t.globalAlpha = 0.2 + R() * 0.45;
        t.fillStyle = v < 0.5 ? '#2f9c7a' : (v < 0.85 ? '#4fd0a0' : '#145246');
        t.beginPath(); t.arc(px, py, 1.2 + R() * 2.6, 0, 6.28); t.fill();
      }
      for (k = 0; k < n / 60; k++) {   // tiny pale flowers
        var a2 = R() * 6.28, d2 = Math.sqrt(R()) * (m.r - 8), fx = m.x + Math.cos(a2) * d2, fy = m.y + Math.sin(a2) * d2;
        t.globalAlpha = 0.75; t.fillStyle = '#d8fff0';
        for (var q = 0; q < 4; q++) { t.beginPath(); t.arc(fx + Math.cos(q * 1.57) * 2.4, fy + Math.sin(q * 1.57) * 2.4, 1.5, 0, 6.28); t.fill(); }
      }
    });
    t.restore(); t.globalAlpha = 1;

    // bare stone rings where bells stand (nothing roots here)
    world.bells.forEach(function (b) {
      var bg = t.createRadialGradient(b.x, b.y, C.BELL_KEEP * 0.5, b.x, b.y, C.BELL_KEEP);
      bg.addColorStop(0, 'rgba(30,26,44,.9)'); bg.addColorStop(1, 'rgba(30,26,44,0)');
      t.fillStyle = bg; t.beginPath(); t.arc(b.x, b.y, C.BELL_KEEP, 0, 6.28); t.fill();
      for (k = 0; k < 12; k++) {
        var pa = k / 12 * 6.28 + b.x, pr = C.BELL_KEEP - 12;
        t.fillStyle = k % 2 ? '#5a5870' : '#474660'; t.beginPath(); t.ellipse(b.x + Math.cos(pa) * pr, b.y + Math.sin(pa) * pr, 6, 4, pa, 0, 6.28); t.fill();
      }
    });

    // faint vines from bells to their gate
    var VR = rnd(77);
    world.bells.forEach(function (b, bi) {
      var gt = null; world.gates.forEach(function (x) { if (x.group === b.group) gt = x; });
      var mx = (b.x + gt.x) / 2, my = (b.y + gt.y) / 2, dx = gt.x - b.x, dy = gt.y - b.y, off = (VR() - 0.5) * 0.5;
      var v = { bx: b.x, by: b.y, cx: mx - dy * off, cy: my + dx * off, gx: gt.x, gy: gt.y };
      vines[bi] = v;
      t.strokeStyle = 'rgba(70,120,96,.5)'; t.lineWidth = 3; t.setLineDash([2, 9]); t.lineCap = 'round';
      t.beginPath(); t.moveTo(v.bx, v.by); t.quadraticCurveTo(v.cx, v.cy, v.gx, v.gy); t.stroke(); t.setLineDash([]);
    });

    // walls: root ridges and logs
    world.walls.forEach(function (wl) {
      var dx = wl.bx - wl.ax, dy = wl.by - wl.ay, len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
      t.lineCap = 'round';
      if (wl.log) {
        t.strokeStyle = '#0c0812'; t.lineWidth = wl.r * 2 + 7; t.beginPath(); t.moveTo(wl.ax, wl.ay); t.lineTo(wl.bx, wl.by); t.stroke();
        t.strokeStyle = '#6a4630'; t.lineWidth = wl.r * 2; t.beginPath(); t.moveTo(wl.ax, wl.ay); t.lineTo(wl.bx, wl.by); t.stroke();
        t.strokeStyle = '#8a6040'; t.lineWidth = 3;
        for (k = -1; k <= 1; k++) { t.beginPath(); t.moveTo(wl.ax - uy * k * 6 + ux * 6, wl.ay + ux * k * 6 + uy * 6); t.lineTo(wl.bx - uy * k * 6 - ux * 10, wl.by + ux * k * 6 - uy * 10); t.stroke(); }
        [[wl.ax, wl.ay], [wl.bx, wl.by]].forEach(function (e) {
          t.fillStyle = '#c79a68'; t.beginPath(); t.arc(e[0], e[1], wl.r - 2, 0, 6.28); t.fill();
          t.strokeStyle = '#8a6040'; t.lineWidth = 1.5; t.beginPath(); t.arc(e[0], e[1], wl.r - 6, 0, 6.28); t.stroke(); t.beginPath(); t.arc(e[0], e[1], wl.r - 10, 0, 6.28); t.stroke();
        });
        t.fillStyle = '#2f9c7a'; for (k = 0; k < len / 40; k++) { t.globalAlpha = 0.8; t.beginPath(); t.ellipse(wl.ax + ux * (20 + R() * (len - 40)) - uy * (R() - 0.5) * 12, wl.ay + uy * (20 + R() * (len - 40)) + ux * (R() - 0.5) * 12, 7 + R() * 6, 4, Math.atan2(uy, ux), 0, 6.28); t.fill(); }
        t.globalAlpha = 1;
        return;
      }
      t.strokeStyle = '#07050c'; t.lineWidth = wl.r * 2 + 10; t.beginPath(); t.moveTo(wl.ax, wl.ay); t.lineTo(wl.bx, wl.by); t.stroke();
      t.strokeStyle = '#2e2028'; t.lineWidth = wl.r * 2; t.beginPath(); t.moveTo(wl.ax, wl.ay); t.lineTo(wl.bx, wl.by); t.stroke();
      var strands = ['#4c362f', '#5e4638', '#3f2c34'];
      for (k = 0; k < 3; k++) {
        t.strokeStyle = strands[k]; t.lineWidth = wl.r * (0.5 - k * 0.08);
        var ph = R() * 6, amp = wl.r * 0.42, off = (k - 1) * wl.r * 0.42;
        t.beginPath();
        for (var s2 = 0; s2 <= len; s2 += 12) {
          var o2 = off + Math.sin(s2 / 46 + ph) * amp * 0.6;
          var px2 = wl.ax + ux * s2 - uy * o2, py2 = wl.ay + uy * s2 + ux * o2;
          if (s2) t.lineTo(px2, py2); else t.moveTo(px2, py2);
        }
        t.stroke();
      }
      for (k = 0; k < len / 90; k++) {   // moss tufts and knots on the ridge
        var s3 = R() * len, o3 = (R() - 0.5) * wl.r;
        t.fillStyle = R() < 0.5 ? 'rgba(47,156,122,.55)' : 'rgba(20,14,20,.7)';
        t.beginPath(); t.ellipse(wl.ax + ux * s3 - uy * o3, wl.ay + uy * s3 + ux * o3, 5 + R() * 8, 3 + R() * 5, R() * 3, 0, 6.28); t.fill();
      }
    });

    // rocks (and the great trunk)
    world.rocks.forEach(function (rk) {
      if (rk.trunk) {
        t.strokeStyle = '#2a1c1c'; t.lineCap = 'round';
        for (k = 0; k < 13; k++) {
          var ra = k / 13 * 6.28 + 0.3, rl = rk.r + 40 + R() * 60;
          t.lineWidth = 30; t.beginPath(); t.moveTo(rk.x + Math.cos(ra) * (rk.r - 14), rk.y + Math.sin(ra) * (rk.r - 14));
          t.lineTo(rk.x + Math.cos(ra + 0.1) * rl, rk.y + Math.sin(ra + 0.1) * rl); t.stroke();
        }
        t.fillStyle = '#08060c'; t.beginPath(); t.arc(rk.x, rk.y, rk.r + 5, 0, 6.28); t.fill();
        var tg = t.createRadialGradient(rk.x - 20, rk.y - 26, 10, rk.x, rk.y, rk.r);
        tg.addColorStop(0, '#5a4034'); tg.addColorStop(0.7, '#3a2824'); tg.addColorStop(1, '#241818');
        t.fillStyle = tg; t.beginPath(); t.arc(rk.x, rk.y, rk.r, 0, 6.28); t.fill();
        t.strokeStyle = 'rgba(20,12,12,.55)'; t.lineWidth = 3;
        for (k = 0; k < 60; k++) { var ba = R() * 6.28, b0 = 30 + R() * 130, b1 = b0 + 20 + R() * 50; t.beginPath(); t.moveTo(rk.x + Math.cos(ba) * b0, rk.y + Math.sin(ba) * b0); t.lineTo(rk.x + Math.cos(ba + 0.05) * Math.min(rk.r - 4, b1), rk.y + Math.sin(ba + 0.05) * Math.min(rk.r - 4, b1)); t.stroke(); }
        t.strokeStyle = 'rgba(120,90,70,.35)'; t.lineWidth = 2;
        for (k = 1; k < 5; k++) { t.beginPath(); t.arc(rk.x, rk.y, k * 16, 0, 6.28); t.stroke(); }
        return;
      }
      t.fillStyle = 'rgba(0,0,0,.45)'; t.beginPath(); t.ellipse(rk.x + 4, rk.y + rk.r * 0.35, rk.r * 1.05, rk.r * 0.8, 0, 0, 6.28); t.fill();
      t.fillStyle = '#0c0b16'; t.beginPath(); t.arc(rk.x, rk.y, rk.r + 3, 0, 6.28); t.fill();
      var rg = t.createRadialGradient(rk.x - rk.r * 0.35, rk.y - rk.r * 0.4, rk.r * 0.1, rk.x, rk.y, rk.r);
      rg.addColorStop(0, '#8e95b8'); rg.addColorStop(0.55, '#565c80'); rg.addColorStop(1, '#2f3350');
      t.fillStyle = rg; t.beginPath(); t.arc(rk.x, rk.y, rk.r, 0, 6.28); t.fill();
      t.strokeStyle = 'rgba(25,27,48,.6)'; t.lineWidth = 2; t.beginPath(); t.moveTo(rk.x - rk.r * 0.2, rk.y - rk.r * 0.6); t.lineTo(rk.x + rk.r * 0.1, rk.y - rk.r * 0.1); t.lineTo(rk.x - rk.r * 0.1, rk.y + rk.r * 0.5); t.stroke();
      t.fillStyle = 'rgba(47,156,122,.6)'; t.beginPath(); t.ellipse(rk.x + rk.r * 0.3, rk.y + rk.r * 0.55, rk.r * 0.45, rk.r * 0.22, -0.3, 0, 6.28); t.fill();
    });

    // thorn bushes
    world.thorns.forEach(function (th) {
      t.fillStyle = 'rgba(0,0,0,.4)'; t.beginPath(); t.arc(th.x + 3, th.y + 6, th.r, 0, 6.28); t.fill();
      t.fillStyle = '#2a0c24'; t.beginPath();
      var n = 13, a0 = R() * 6;
      for (k = 0; k < n * 2; k++) { var rr = k % 2 ? th.r * 0.62 : th.r * 1.0, aa = a0 + k * Math.PI / n; t.lineTo(th.x + Math.cos(aa) * rr, th.y + Math.sin(aa) * rr); }
      t.closePath(); t.fill();
      t.strokeStyle = '#b02a62'; t.lineWidth = 2; t.stroke();
      t.fillStyle = '#4a1238'; t.beginPath(); t.arc(th.x, th.y, th.r * 0.55, 0, 6.28); t.fill();
    });
    return c;
  }

  /* ================= sprites ================= */
  function glowSprite(r, gcol, b) {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(' + r + ',' + gcol + ',' + b + ',1)'); gr.addColorStop(0.35, 'rgba(' + r + ',' + gcol + ',' + b + ',.42)'); gr.addColorStop(1, 'rgba(' + r + ',' + gcol + ',' + b + ',0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return c;
  }
  var GL = { warm: glowSprite(255, 170, 90), blue: glowSprite(150, 180, 255), gold: glowSprite(255, 226, 130), green: glowSprite(200, 255, 130), teal: glowSprite(110, 255, 220), red: glowSprite(255, 80, 130), white: glowSprite(255, 255, 255) };
  var holeSprite = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return c;
  })();

  /* ================= view ================= */
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cw = window.innerWidth; ch = window.innerHeight;
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    dark.width = Math.ceil(cw / 3); dark.height = Math.ceil(ch / 3);
    base = Math.min(cw / 1280, ch / 720);
  }
  function sc() { return base * cam.zoom; }
  function w2s(x, y) { var s = sc(); return { x: (x - cam.x) * s + cw / 2, y: (y - cam.y) * s + ch / 2 }; }
  function s2w(x, y) { var s = sc(); return { x: (x - cw / 2) / s + cam.x, y: (y - ch / 2) / s + cam.y }; }
  function clampCam() {
    var s = sc(), hw = cw / 2 / s, hh = ch / 2 / s;
    cam.x = hw * 2 >= world.W ? world.W / 2 : clamp(cam.x, hw, world.W - hw);
    cam.y = hh * 2 >= world.H ? world.H / 2 : clamp(cam.y, hh, world.H - hh);
  }

  /* ================= particles / popups ================= */
  function burst(x, y, n, col, sp, life, size) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.28, v = sp * (0.3 + Math.random() * 0.7);
      particles.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * (0.6 + Math.random() * 0.6), t: 0, col: col, size: size || 3, drag: 2.5 });
    }
    if (particles.length > 900) particles.splice(0, particles.length - 900);
  }
  function ring(x, y, col, r0, r1, life) { particles.push({ ring: true, x: x, y: y, r0: r0, r1: r1, life: life, t: 0, col: col }); }
  function popup(x, y, text, col, size) { popups.push({ x: x, y: y, text: text, col: col || '#ffe9b8', size: size || 22, t: 0, life: 1.5 }); }

  /* ================= hints ================= */
  function hint(key, text, dur) {
    if (key && hintsSeen[key]) return;
    if (key) hintsSeen[key] = 1;
    var el = $('hint'); el.textContent = text; el.classList.remove('hidden');
    hintTimer = T + (dur || 6);
  }

  /* ================= save / load ================= */
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, state: state, activeId: activeId, hints: hintsSeen, firstShotDone: firstShotDone })); } catch (e) { }
  }
  function loadSave() {
    try {
      var d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!d || d.v !== 2 || !d.state || !d.state.mush || d.state.ff.length !== world.fireflies.length || d.state.bellLit.length !== world.bells.length) return null;
      return d;
    } catch (e) { return null; }
  }
  function newGame() {
    state = S.newState(world); activeId = state.mush[0].id; manim = {}; gateAnim = {}; hintsSeen = {}; firstShotDone = false;
    particles = []; popups = []; flight = null; aim = null; dawn = 0; dawnTarget = 0; ending = null; A.setDawn(0);
    cam.x = world.mother.x + 120; cam.y = world.mother.y - 40; cam.zoom = 1; cam.manual = false; cam.cine = null;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
    updateHud();
  }
  function applySave(d) {
    state = d.state; activeId = d.activeId; hintsSeen = d.hints || {}; firstShotDone = !!d.firstShotDone; manim = {};
    for (var gk in state.gateOpen) gateAnim[gk] = -99;
    if (!mushById(activeId)) activeId = state.mush[0].id;
    if (state.won) { dawn = dawnTarget = 1; A.setDawn(1); }
    var m = mushById(activeId); cam.x = m.x; cam.y = m.y;
    updateHud();
  }
  function updateHud() {
    $('ffcount').textContent = ffCount(); $('fftotal').textContent = '/ ' + world.fireflies.length;
  }

  /* ================= shooting ================= */
  function aimVelocity() {
    var len = Math.sqrt(aim.px * aim.px + aim.py * aim.py);
    if (len < 18) return null;
    var p = clamp((len - 18) / 200, 0, 1), sp = C.VMIN + (C.VMAX - C.VMIN) * p;
    return { vx: -aim.px / len * sp, vy: -aim.py / len * sp, p: p };
  }
  function refreshPreview() {
    var v = aimVelocity();
    if (!v) { aim.preview = null; aim.p = 0; return; }
    if (Math.floor(v.p * 8) !== Math.floor((aim.p || 0) * 8)) A.stretch(v.p);
    aim.p = v.p;
    aim.preview = S.simulate(world, state, aim.m, v.vx, v.vy, { maxLen: previewLen() });
  }
  function startFlight(L, vx, vy, p) {
    var res = S.simulate(world, state, L, vx, vy);
    flight = { res: res, idx: 0, ev: 0, lit: {}, ffGot: {}, mh: {}, L: L, trail: [], bub: 0 };
    A.launch(p || 0.5);
    var a = anim(L.id); a.sqv = -9;
    burst(L.x, L.y - 4, 10, '255,220,160', 120, 0.5, 2.5);
    firstShotDone = true; cam.manual = false;
    if ($('hint').textContent.indexOf('ひっぱり') >= 0) hintTimer = 0;
    return res;
  }
  function flightPos() {
    var p = flight.res.pts, i = Math.min(flight.res.n - 1, Math.floor(flight.idx)), j = Math.min(flight.res.n - 1, i + 1), f = flight.idx - i;
    return { x: lerp(p[i * 2], p[j * 2], f), y: lerp(p[i * 2 + 1], p[j * 2 + 1], f) };
  }
  function handleEvent(e, quiet) {
    if (e.type === 'mush') {
      var m = mushById(e.id), a = anim(e.id); a.sqv = 14; a.hitT = T; flight.mh[e.id] = (flight.mh[e.id] || 0) + 1;
      if (!quiet) {
        A.pon(m.size, e.combo);
        var warm = m.kind === 'own' || m.kind === 'mother';
        burst(e.x, e.y, 9, warm ? '255,200,120' : '170,210,255', 200, 0.5, 3);
        ring(m.x, m.y, warm ? '255,190,110' : '170,200,255', C.MR[m.size], C.MR[m.size] + 34, 0.4);
        if (e.combo >= 2) popup(e.x, e.y - 26, 'ぽん×' + e.combo, '#ffd98a', 16 + Math.min(14, e.combo * 2));
        hint('pon', 'キノコに あたると ぽん、と はじかれる', 5);
      }
    } else if (e.type === 'bell') {
      flight.lit[e.idx] = true;
      if (!quiet) { A.bell(e.count); burst(e.x, e.y, 14, '255,230,140', 160, 0.8, 3); ring(e.x, e.y, '255,226,130', 10, 70, 0.6); }
    } else if (e.type === 'ff') {
      flight.ffGot[e.idx] = true;
      if (!quiet) {
        var f = world.fireflies[e.idx]; A.firefly(ffCount() + Object.keys(flight.ffGot).length);
        burst(f.x, f.y, 12, '220,255,140', 140, 0.9, 2.5);
        hint('ff', 'ほたるが ふえるほど、ねらいの ひかりが 先まで とどく', 6);
      }
      $('ffcount').textContent = ffCount() + Object.keys(flight.ffGot).length;
      var bar = $('ffbar'); bar.classList.add('bump'); setTimeout(function () { bar.classList.remove('bump'); }, 220);
    } else if (e.type === 'splash') {
      if (!quiet) { A.splash(); burst(e.x, e.y, 16, '150,200,255', 170, 0.6, 3); ring(e.x, e.y, '150,200,255', 6, 46, 0.6); }
    } else if (!quiet) {
      A.knock(e.log ? 'log' : (e.type === 'gate' ? 'gate' : 'rock'), e.sp || 300);
      burst(e.x, e.y, 5, '200,200,220', 90, 0.3, 2);
    }
  }
  function finishShot(quiet) {
    var res = flight.res, lit = flight.lit, L = flight.L;
    var out = S.applyShot(world, state, res), e = res.end;
    flight = null;
    if (e.type === 'sprout') {
      var a = anim(out.sprout.id); a.born = T; a.sqv = 10;
      activeId = out.sprout.id;
      if (!quiet) {
        A.sprout(e.floated); burst(e.x, e.y, 14, '160,255,200', 150, 0.6, 3); ring(e.x, e.y, '160,255,200', 4, 50, 0.5);
        if (e.floated) hint('float', '川は 胞子を はこび、苔の岸で 芽ぶかせる', 6);
        else if (state.stats.planted === 1) hint('sprout', 'あたらしいキノコからも とばせる', 6);
        else if (state.stats.planted === 4) hint('ctrl', '右クリックで キノコを ぬける ・ ホイールで ズーム ・ Shiftで 細かく ねらう', 8);
      }
    } else if (!quiet) {
      if (e.type === 'fizzle') { A.fizzle(); burst(e.x, e.y, 10, '190,170,160', 60, 0.8, 3); hint('fizzle', 'かれ地には 根づけない。苔の うえへ', 5); }
      else if (e.type === 'thorn') { A.thorn(); burst(e.x, e.y, 18, '255,90,140', 240, 0.5, 3); hint('thorn', 'いばらに ふれると 胞子は はじけてしまう', 5); }
      else if (e.type === 'sink') { A.sink(); ring(e.x, e.y, '150,200,255', 6, 60, 0.9); }
    }
    out.grown.forEach(function (id, k) {
      var m = mushById(id), a2 = anim(id); a2.grow = T; a2.sqv = 16;
      if (!quiet) {
        setTimeout(function () { A.grow(m.size); }, 200 + k * 120);
        ring(m.x, m.y, '255,230,150', C.MR[m.size], C.MR[m.size] + 60, 0.8); burst(m.x, m.y, 16, '255,230,150', 190, 0.8, 3);
        popup(m.x, m.y - C.MR[m.size] - 18, m.size >= 3 ? 'おおきく そだった！' : 'そだった！', '#fff0b0', 20);
        hint('grow', 'たたかれたキノコは そだち、もっと つよく はじく', 6);
      }
    });
    // bells that did not complete their group fade again
    var faded = false;
    for (var gk in out.partial) {
      var pr = out.partial[gk], gt = null;
      world.gates.forEach(function (x) { if (x.group == gk) gt = x; });
      if (out.opened.indexOf(+gk) < 0) {
        faded = true;
        if (!quiet) { popup(gt.final ? world.arena.x : gt.x - 60, gt.final ? world.arena.y : gt.y, '♪ ' + pr.hit + ' / ' + pr.need, '#cfd8ff', gt.final ? 34 : 26); }
        if (pr.need > 1) hint('bells', '鈴は ひと飛びの あいだに ぜんぶ 鳴らす', 6);
      }
    }
    for (var bi in lit) if (!state.bellLit[bi]) litFade[bi] = T;
    if (faded && !quiet) setTimeout(A.bellsFade, 350);
    out.opened.forEach(function (gk2) {
      var gt2 = null; world.gates.forEach(function (x) { if (x.group === gk2) gt2 = x; });
      gateAnim[gk2] = T;
      if (!quiet) {
        A.gate(world.bells.filter(function (b) { return b.group === gk2; }).length);
        if (!gt2.final) { cam.cine = { x: gt2.x, y: gt2.y, until: T + 2.6 }; burst(gt2.x, gt2.y, 40, '255,230,150', 260, 1.2, 3.5); }
      }
    });
    if (!out.won && !quiet && world.arena) {
      var crowd = 0; state.mush.forEach(function (m) { if (m.kind === 'own' && Math.hypot(m.x - world.arena.x, m.y - world.arena.y) < world.arena.R) crowd++; });
      if (crowd >= 13) hint('crowd', 'こみあってきたら、右クリックで ぬいて 通り道を つくれる', 7);
    }
    if (out.won) startEnding(quiet);
    updateHud(); save();
    return out;
  }
  function doUproot(m) {
    if (!m || m.kind !== 'own' || flight) return false;
    S.uproot(state, m.id);
    A.uproot(); burst(m.x, m.y, 12, '255,210,160', 130, 0.5, 3);
    if (activeId === m.id) {
      var best = null, bd = 1e18;
      state.mush.forEach(function (o) { if (!canLaunch(o)) return; var d = (o.x - m.x) * (o.x - m.x) + (o.y - m.y) * (o.y - m.y); if (d < bd) { bd = d; best = o; } });
      activeId = best.id;
    }
    save(); return true;
  }

  /* ================= ending ================= */
  function startEnding(quiet) {
    dawnTarget = 1; A.setDawn(1);
    var own = state.mush.filter(canLaunch).sort(function (a, b) { return b.x - a.x; });
    ending = { t0: T, own: own, next: 0, done: false };
    if (!quiet) A.finale();
    $('hud').classList.add('hidden'); $('hint').classList.add('hidden');
    $('skip').classList.remove('hidden');
    mode = 'ending';
  }
  function showResult() {
    if (ending) ending.done = true;
    mode = 'result'; $('skip').classList.add('hidden');
    var st = state.stats, n = ffCount();
    $('r-shots').textContent = st.shots + ' こ';
    $('r-planted').textContent = state.mush.filter(function (m) { return m.kind === 'own'; }).length + ' 本';
    $('r-ff').textContent = n + ' / ' + world.fireflies.length;
    $('r-combo').textContent = st.bestCombo + ' れんさ';
    var s = Math.floor(st.time); $('r-time').textContent = Math.floor(s / 60) + ' 分 ' + (s % 60) + ' 秒';
    $('r-note').textContent = n >= world.fireflies.length ? 'ほたるも みんな、あなたの森に あつまりました。' : 'まだ どこかで、ほたるが ' + (world.fireflies.length - n) + ' ひき 光っています。';
    $('result').classList.remove('hidden');
  }

  /* ================= update ================= */
  function update(dt) {
    T += dt;
    if (mode === 'play' && !$('menu').classList.contains('hidden')) return;
    if (mode === 'play') state.stats.time += dt;
    dawn += clamp(dawnTarget - dawn, -dt / 9, dt / 9);

    // mushroom springs
    for (var id in manim) { var a = manim[id]; a.sqv += (-a.sq * 190 - a.sqv * 11) * dt; a.sq += a.sqv * dt; }

    if (flight) {
      var fast = keys[' '] || (mouse.down && !pan) ? 3 : 1;
      flight.idx += dt * 120 * fast;
      var evs = flight.res.events;
      while (flight.ev < evs.length && evs[flight.ev].i <= flight.idx) handleEvent(evs[flight.ev++]);
      if (flight.idx >= flight.res.n - 1) finishShot();
      else {
        var p = flightPos(); flight.trail.push(p.x, p.y); if (flight.trail.length > 44) flight.trail.splice(0, 2);
        if (flight.res.floatFrom >= 0 && flight.idx > flight.res.floatFrom) { flight.bub -= dt; if (flight.bub < 0) { flight.bub = 0.22 + Math.random() * 0.3; A.bubble(); ring(p.x, p.y, '170,215,255', 4, 26, 0.7); } }
      }
    }

    // camera
    var tx = cam.x, ty = cam.y, k = 4;
    if (mode === 'title') { tx = world.mother.x + 150 + Math.sin(T * 0.13) * 70; ty = world.mother.y - 30 + Math.cos(T * 0.1) * 40; k = 1; }
    else if (mode === 'ending' && ending) {
      var et = T - ending.t0, own = ending.own;
      if (et < 4) { tx = world.arena.x; ty = world.arena.y; cam.zoom = lerp(cam.zoom, 0.7, dt * 0.8); k = 2; }
      else {
        var D = clamp(own.length * 0.22, 9, 16), u = clamp((et - 4) / D, 0, 1), us = u * u * (3 - 2 * u);
        tx = lerp(world.arena.x, world.mother.x + 200, us);
        // follow the height of the player's own trail
        var near = null, nd = 1e9; own.forEach(function (m) { var d = Math.abs(m.x - tx); if (d < nd) { nd = d; near = m; } });
        ty = lerp(cam.y, near ? clamp(near.y, 800, 1600) : 1250, dt * 1.2); cam.y = ty;
        cam.zoom = lerp(cam.zoom, 0.6, dt); k = 6;
        while (ending.next < own.length && own[ending.next].x > tx - 80) {
          var m2 = own[ending.next]; anim(m2.id).sqv = 12; A.chime(ending.next);
          ring(m2.x, m2.y, '255,220,150', C.MR[m2.size], C.MR[m2.size] + 50, 0.9); ending.next++;
        }
        if (u >= 1 && et > 4 + D + 1.5 && !ending.done) showResult();
      }
    }
    else if (cam.cine) { tx = cam.cine.x; ty = cam.cine.y; k = 3.5; if (T > cam.cine.until) cam.cine = null; }
    else if (flight) { var fp = flightPos(); tx = fp.x; ty = fp.y; k = 5; }
    else if (!cam.manual && !aim && mode === 'play') { var am = mushById(activeId); if (am) { tx = am.x; ty = am.y; } k = 3; }
    if (mode === 'play' && !aim && !pan) {
      var ps = 620 / cam.zoom * dt, mvx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0), mvy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
      if (mvx || mvy) { cam.manual = true; cam.x += mvx * ps; cam.y += mvy * ps; tx = cam.x; ty = cam.y; }
    }
    if (!(cam.manual && !flight && !cam.cine && mode === 'play') && !aim) { var f = 1 - Math.exp(-k * dt); cam.x += (tx - cam.x) * f; cam.y += (ty - cam.y) * f; }
    clampCam();

    for (var i = particles.length - 1; i >= 0; i--) {
      var q = particles[i]; q.t += dt;
      if (q.t >= q.life) { particles.splice(i, 1); continue; }
      if (!q.ring) { q.vx *= 1 - q.drag * dt; q.vy *= 1 - q.drag * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
    }
    for (i = popups.length - 1; i >= 0; i--) { popups[i].t += dt; if (popups[i].t > popups[i].life) popups.splice(i, 1); }
    if (hintTimer && T > hintTimer) { $('hint').classList.add('hidden'); hintTimer = 0; }
    // ambient dawn motes
    if (dawn > 0.3 && Math.random() < dt * 14) {
      var wp = s2w(Math.random() * cw, Math.random() * ch);
      particles.push({ x: wp.x, y: wp.y, vx: 10 + Math.random() * 20, vy: -8 - Math.random() * 14, life: 3 + Math.random() * 2, t: 0, col: '255,225,150', size: 2, drag: 0 });
    }
  }

  /* ================= draw ================= */
  function drawMushroom(m) {
    var a = anim(m.id), R = C.MR[m.size];
    var bornK = clamp((T - a.born) / 0.35, 0, 1); bornK = 1 - Math.pow(1 - bornK, 3);
    var growK = clamp((T - a.grow) / 0.4, 0, 1);
    if (growK < 1) R = lerp(C.MR[m.size - 1] || R, R, 1 - Math.pow(1 - growK, 3));
    var sx = (1 + a.sq * 0.05) * bornK, sy = (1 - a.sq * 0.05) * bornK;
    var own = m.kind === 'own', mother = m.kind === 'mother', giant = m.kind === 'giant';
    g.save(); g.translate(m.x, m.y + R * 0.9); g.scale(sx, sy); g.translate(0, -R * 0.9);
    // ground shadow
    g.fillStyle = 'rgba(0,0,0,.38)'; g.beginPath(); g.ellipse(0, R * 0.82, R * 0.95, R * 0.34, 0, 0, 6.28); g.fill();
    // stem
    g.fillStyle = (own || mother) ? '#f6e9d2' : '#c9d4ea';
    g.beginPath(); g.moveTo(-R * 0.42, R * 0.1); g.lineTo(-R * 0.5, R * 0.8); g.quadraticCurveTo(0, R * 1.08, R * 0.5, R * 0.8); g.lineTo(R * 0.42, R * 0.1); g.closePath(); g.fill();
    // cap
    var cy = -R * 0.14, ry = R * 0.86;
    var gr = g.createLinearGradient(0, cy - ry, 0, cy + ry);
    if (mother) { gr.addColorStop(0, '#ffe28a'); gr.addColorStop(1, '#f0823c'); }
    else if (own) { gr.addColorStop(0, '#ffb878'); gr.addColorStop(1, '#e8503f'); }
    else if (giant) { gr.addColorStop(0, '#a8f5e6'); gr.addColorStop(1, '#2a8a98'); }
    else { gr.addColorStop(0, '#e6eeff'); gr.addColorStop(1, '#7f98d0'); }
    g.fillStyle = '#120c18'; g.beginPath(); g.ellipse(0, cy, R + 2.5, ry + 2.5, 0, 0, 6.28); g.fill();
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, cy, R, ry, 0, 0, 6.28); g.fill();
    // underside lip + face
    g.fillStyle = (own || mother) ? '#fff3dc' : '#dfe8fa';
    g.beginPath(); g.ellipse(0, cy + ry * 0.62, R * 0.62, ry * 0.3, 0, 0, 6.28); g.fill();
    // spots
    var rs = rnd(m.id * 7919 + 13), ns = 3 + (m.size > 1 ? 2 : 0) + (m.size > 2 ? 2 : 0);
    g.fillStyle = (own || mother) ? 'rgba(255,246,224,.92)' : 'rgba(255,255,255,.8)';
    for (var i = 0; i < ns; i++) {
      var sa = -Math.PI * (0.12 + 0.76 * (i + 0.5) / ns) + (rs() - 0.5) * 0.3, sd = 0.45 + rs() * 0.4;
      g.beginPath(); g.ellipse(Math.cos(sa) * R * sd, cy + Math.sin(sa) * ry * sd * 0.9, R * (0.1 + rs() * 0.08), R * (0.08 + rs() * 0.05), sa, 0, 6.28); g.fill();
    }
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = Math.max(1.5, R * 0.08); g.lineCap = 'round';
    g.beginPath(); g.ellipse(0, cy, R * 0.78, ry * 0.78, 0, Math.PI * 1.12, Math.PI * 1.42); g.stroke();
    // eyes
    var ey = cy + ry * 0.62, ex = R * 0.26, er = Math.max(1.8, R * 0.085);
    g.fillStyle = '#2a1a22'; g.strokeStyle = '#2a1a22'; g.lineWidth = Math.max(1.3, R * 0.06);
    var blink = ((T + a.blink) % 4.2) < 0.12, asleep = !(own || mother);
    var lx = 0, ly = 0;
    if (!asleep) {
      var tgt = flight ? flightPos() : (aim && aim.m === m && aim.preview ? { x: m.x - aim.px, y: m.y - aim.py } : null);
      if (tgt) { var ddx = tgt.x - m.x, ddy = tgt.y - m.y, dl = Math.sqrt(ddx * ddx + ddy * ddy) || 1; lx = ddx / dl * er * 0.7; ly = ddy / dl * er * 0.5; }
    }
    if (asleep || blink) {
      g.beginPath(); g.arc(-ex, ey, er, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
      g.beginPath(); g.arc(ex, ey, er, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    } else {
      g.beginPath(); g.arc(-ex + lx, ey + ly, er, 0, 6.28); g.fill(); g.beginPath(); g.arc(ex + lx, ey + ly, er, 0, 6.28); g.fill();
      if (a.hitT && T - a.hitT < 0.5) { g.beginPath(); g.arc(0, ey + er * 1.6, er * 1.1, 0, Math.PI); g.stroke(); }
    }
    g.restore();
  }

  function drawBell(b, bi, lit) {
    var sway = Math.sin(T * 1.6 + bi * 1.9) * 2.5, x = b.x + sway, y = b.y;
    var fadeK = litFade[bi] ? clamp(1 - (T - litFade[bi]) / 0.9, 0, 1) : 0;
    var L = lit ? 1 : fadeK;
    g.strokeStyle = 'rgba(160,180,255,' + (0.16 + 0.1 * Math.sin(T * 2 + bi)) + ')'; g.lineWidth = 1.5; g.setLineDash([3, 7]);
    g.beginPath(); g.arc(b.x, b.y, C.BELL_R, 0, 6.28); g.stroke(); g.setLineDash([]);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.3 + L * 0.25;
    var gs = 50 + L * 40 + Math.sin(T * 3 + bi) * 4; g.drawImage(L > 0.05 ? GL.gold : GL.blue, x - gs, y - gs, gs * 2, gs * 2);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // five-petal bell flower seen from above
    for (var i = 0; i < 5; i++) {
      var a = i * 1.2566 + T * 0.2 + bi;
      g.fillStyle = L > 0.05 ? 'rgb(' + Math.round(lerp(150, 255, L)) + ',' + Math.round(lerp(165, 226, L)) + ',' + Math.round(lerp(255, 130, L)) + ')' : '#96a5ff';
      g.beginPath(); g.ellipse(x + Math.cos(a) * 10, y + Math.sin(a) * 10, 10.5, 6.5, a, 0, 6.28); g.fill();
    }
    g.fillStyle = L > 0.05 ? '#fff8d8' : '#394078'; g.beginPath(); g.arc(x, y, 6, 0, 6.28); g.fill();
    g.strokeStyle = 'rgba(20,14,40,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 6, 0, 6.28); g.stroke();
  }

  function drawGate(gt) {
    var open = !!state.gateOpen[gt.group], k = open ? clamp((T - (gateAnim[gt.group] || -99)) / 1.3, 0, 1) : 0;
    k = k * k * (3 - 2 * k);
    var bells = [], lit = 0;
    world.bells.forEach(function (b, bi) { if (b.group === gt.group) { bells.push(bi); if (state.bellLit[bi] || (flight && flight.lit[bi])) lit++; } });
    if (gt.final) {
      // five pips on the trunk
      for (var i = 0; i < bells.length; i++) {
        var a = -Math.PI / 2 + i * 6.28 / bells.length, px = gt.x + Math.cos(a) * 52, py = gt.y + 40 + Math.sin(a) * 52, on = i < lit;
        if (on) { g.globalCompositeOperation = 'lighter'; g.drawImage(GL.gold, px - 26, py - 26, 52, 52); g.globalCompositeOperation = 'source-over'; }
        g.fillStyle = on ? '#ffe9a0' : '#1a1016'; g.strokeStyle = on ? '#fff' : '#7a6a5a'; g.lineWidth = 2;
        g.beginPath(); g.arc(px, py, 11, 0, 6.28); g.fill(); g.stroke();
      }
      return;
    }
    // bramble: wavy vines retracting toward both ends when open
    var span = gt.by - gt.ay, half = span / 2 * (1 - k * 0.86);
    g.lineCap = 'round';
    for (var s = 0; s < 2; s++) {
      var y0 = s ? gt.by + 20 : gt.ay - 20, dir = s ? -1 : 1;
      for (var v = 0; v < 3; v++) {
        g.strokeStyle = v === 1 ? '#3d6b4a' : '#27482f'; g.lineWidth = 9 - v * 1.5;
        g.beginPath();
        for (var q = 0; q <= 12; q++) {
          var yy = y0 + dir * (half + 22) * q / 12, xx = gt.x + Math.sin(q * 0.9 + v * 2.1 + s) * (10 + v * 4) * (1 - k * 0.3) + (v - 1) * 6;
          if (q) g.lineTo(xx, yy); else g.moveTo(xx, yy);
        }
        g.stroke();
      }
      if (k < 0.9) {
        g.strokeStyle = '#d24a7a'; g.lineWidth = 2.5;
        for (q = 1; q < 6; q++) {
          var ty = y0 + dir * (half + 22) * q / 6, tx = gt.x + Math.sin(q * 1.8 + s) * 10;
          g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + (q % 2 ? 11 : -11), ty - 5 * dir); g.stroke();
        }
      } else {
        g.fillStyle = '#ffd0e0'; for (q = 1; q < 4; q++) { g.beginPath(); g.arc(gt.x + Math.sin(q * 2.2 + s) * 12, y0 + dir * 10 * q, 4, 0, 6.28); g.fill(); }
      }
    }
    // pips: how many bells this gate wants
    var n = bells.length, px0 = gt.x - 58;
    for (i = 0; i < n; i++) {
      var py2 = gt.y + (i - (n - 1) / 2) * 26, on2 = i < lit || open;
      if (on2) { g.globalCompositeOperation = 'lighter'; g.drawImage(GL.gold, px0 - 24, py2 - 24, 48, 48); g.globalCompositeOperation = 'source-over'; }
      g.fillStyle = on2 ? '#ffe9a0' : '#161222'; g.strokeStyle = on2 ? '#fff' : '#96a5ff'; g.lineWidth = 2;
      g.beginPath(); g.arc(px0, py2, 8, 0, 6.28); g.fill(); g.stroke();
    }
  }

  function draw() {
    var s = sc();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#0b0914'; g.fillRect(0, 0, cw, ch);
    var vx0 = cam.x - cw / 2 / s, vy0 = cam.y - ch / 2 / s, vw = cw / s, vh = ch / s;
    var sx0 = Math.max(0, vx0), sy0 = Math.max(0, vy0), sx1 = Math.min(world.W, vx0 + vw), sy1 = Math.min(world.H, vy0 + vh);
    if (sx1 > sx0 && sy1 > sy0) g.drawImage(terrain, sx0, sy0, sx1 - sx0, sy1 - sy0, (sx0 - vx0) * s, (sy0 - vy0) * s, (sx1 - sx0) * s, (sy1 - sy0) * s);
    function vis(x, y, r) { return x + r > vx0 && x - r < vx0 + vw && y + r > vy0 && y - r < vy0 + vh; }
    function worldT() { g.setTransform(dpr * s, 0, 0, dpr * s, dpr * (cw / 2 - cam.x * s), dpr * (ch / 2 - cam.y * s)); }
    worldT();

    // river shimmer: streaks drifting downstream
    world.rivers.forEach(function (rv, ri) {
      var p = rv.pts, acc = 0; g.lineCap = 'round';
      for (var sg = 0; sg < p.length - 1; sg++) {
        var ax = p[sg][0], ay = p[sg][1], dx = p[sg + 1][0] - ax, dy = p[sg + 1][1] - ay, len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
        if (!vis(ax + dx / 2, ay + dy / 2, len / 2 + rv.hw)) { acc += len; continue; }
        for (var lane = -3; lane <= 3; lane++) {
          var off = lane * rv.hw * 0.26, sp = 90 + (lane * lane % 3) * 30, gap = 150;
          for (var d = ((T * sp + lane * 53 + acc * 0) % gap) - gap; d < len; d += gap) {
            var d0 = Math.max(0, d), d1 = Math.min(len, d + 34 + (lane & 1) * 18);
            if (d1 <= d0) continue;
            g.strokeStyle = 'rgba(160,210,255,' + (0.16 + 0.1 * Math.sin(lane + d * 0.01)) + ')'; g.lineWidth = 3;
            g.beginPath(); g.moveTo(ax + ux * d0 - uy * off, ay + uy * d0 + ux * off); g.lineTo(ax + ux * d1 - uy * off, ay + uy * d1 + ux * off); g.stroke();
          }
        }
        acc += len;
      }
    });

    world.rivers.forEach(function (rv, ri) {
      var p = rv.pts, total = 0, segs = [];
      for (var sg = 0; sg < p.length - 1; sg++) { var l = Math.hypot(p[sg + 1][0] - p[sg][0], p[sg + 1][1] - p[sg][1]); segs.push(l); total += l; }
      for (var lf = 0; lf < 7; lf++) {
        var d = ((T * C.FLOAT_V * 0.45 + lf * total / 7 + ri * 130) % total), sg2 = 0;
        while (d > segs[sg2]) { d -= segs[sg2]; sg2++; }
        var ux = (p[sg2 + 1][0] - p[sg2][0]) / segs[sg2], uy = (p[sg2 + 1][1] - p[sg2][1]) / segs[sg2], off = ((lf * 37) % 9 - 4) / 4 * rv.hw * 0.6;
        var lx = p[sg2][0] + ux * d - uy * off, ly = p[sg2][1] + uy * d + ux * off;
        if (!vis(lx, ly, 20) || S.inMoss(world, lx, ly)) continue;
        g.save(); g.translate(lx, ly); g.rotate(T * 0.6 + lf * 2); g.fillStyle = lf % 2 ? '#c98a4a' : '#d9b05a';
        g.beginPath(); g.ellipse(0, 0, 8, 4.2, 0, 0, 6.28); g.fill(); g.strokeStyle = 'rgba(60,30,20,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-7, 0); g.lineTo(7, 0); g.stroke();
        g.restore();
        g.strokeStyle = 'rgba(170,215,255,.3)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(lx, ly, 13 + Math.sin(T * 3 + lf) * 2, 7, 0, 0, 6.28); g.stroke();
      }
    });

    // ---- darkness with light holes ----
    var dA = lerp(0.7, 0.24, dawn);
    dg.setTransform(1, 0, 0, 1, 0, 0); dg.globalCompositeOperation = 'source-over';
    dg.clearRect(0, 0, dark.width, dark.height);
    dg.fillStyle = 'rgba(' + Math.round(lerp(8, 84, dawn)) + ',' + Math.round(lerp(8, 44, dawn)) + ',' + Math.round(lerp(30, 56, dawn)) + ',' + dA + ')'; dg.fillRect(0, 0, dark.width, dark.height);
    dg.globalCompositeOperation = 'destination-out';
    function hole(x, y, r, a) { if (!vis(x, y, r)) return; var q = w2s(x, y); dg.globalAlpha = a; var rr = r * s / 3; dg.drawImage(holeSprite, q.x / 3 - rr, q.y / 3 - rr, rr * 2, rr * 2); }
    state.mush.forEach(function (m) {
      var own = canLaunch(m), bk = clamp((T - anim(m.id).born) / 0.6, 0, 1);
      hole(m.x, m.y, (own ? 150 + m.size * 45 : (m.kind === 'giant' ? 210 : 100 + m.size * 20)) * bk * (1 + Math.sin(T * 1.3 + m.id) * 0.03), own ? 0.95 : 0.6);
    });
    world.bells.forEach(function (b, bi) { var lit = state.bellLit[bi] || (flight && flight.lit[bi]); hole(b.x, b.y, lit ? 150 : 80, lit ? 0.8 : 0.5); });
    world.fireflies.forEach(function (f, fi) { if (!state.ff[fi] && !(flight && flight.ffGot[fi])) hole(f.x, f.y, 70, 0.6); });
    world.gates.forEach(function (gt) { if (!gt.final) hole(gt.x, gt.y, state.gateOpen[gt.group] ? 230 : 120, state.gateOpen[gt.group] ? 0.85 : 0.5); });
    if (flight) { var fp = flightPos(); hole(fp.x, fp.y, 150, 0.9); }
    if (state.won || dawn > 0) { hole(world.arena.tx, world.arena.ty, 700, dawn); hole(world.arena.x, world.arena.y, 500, dawn); world.moss.forEach(function (m) { hole(m.x, m.y, m.r * 1.5, dawn * 0.8); }); }
    dg.globalAlpha = 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.imageSmoothingEnabled = true; g.drawImage(dark, 0, 0, dark.width, dark.height, 0, 0, dark.width * 3, dark.height * 3);
    worldT();

    // rim light so rocks and logs still read in the dark
    world.rocks.forEach(function (rk) {
      if (!vis(rk.x, rk.y, rk.r) || rk.trunk) return;
      g.strokeStyle = 'rgba(170,185,240,.4)'; g.lineWidth = 2.5; g.lineCap = 'round';
      g.beginPath(); g.arc(rk.x, rk.y, rk.r - 2, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
    });
    world.walls.forEach(function (wl) {
      if (!wl.log || !vis((wl.ax + wl.bx) / 2, (wl.ay + wl.by) / 2, 200)) return;
      g.strokeStyle = 'rgba(230,190,140,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(wl.ax, wl.ay - wl.r + 2); g.lineTo(wl.bx, wl.by - wl.r + 2); g.stroke();
    });

    // thorn glints (danger must read in the dark)
    world.thorns.forEach(function (th, ti) {
      if (!vis(th.x, th.y, 40)) return;
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.22 + 0.08 * Math.sin(T * 2.2 + ti);
      g.drawImage(GL.red, th.x - 42, th.y - 42, 84, 84); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.strokeStyle = '#ff5a8a'; g.lineWidth = 2; g.lineCap = 'round';
      for (var k = 0; k < 7; k++) { var a = k * 0.9 + ti; g.beginPath(); g.moveTo(th.x + Math.cos(a) * th.r * 0.7, th.y + Math.sin(a) * th.r * 0.7); g.lineTo(th.x + Math.cos(a) * th.r * 1.02, th.y + Math.sin(a) * th.r * 1.02); g.stroke(); }
      g.fillStyle = '#ff7aa0'; for (k = 0; k < 3; k++) { var a2 = k * 2.1 + ti * 1.3; g.beginPath(); g.arc(th.x + Math.cos(a2) * th.r * 0.35, th.y + Math.sin(a2) * th.r * 0.35, 3, 0, 6.28); g.fill(); }
    });

    // lit vines
    world.bells.forEach(function (b, bi) {
      var lit = state.bellLit[bi] || (flight && flight.lit[bi]); if (!lit) return;
      var v = vines[bi]; g.strokeStyle = 'rgba(255,226,130,.7)'; g.lineWidth = 3; g.setLineDash([2, 9]); g.lineDashOffset = -T * 30; g.lineCap = 'round';
      g.beginPath(); g.moveTo(v.bx, v.by); g.quadraticCurveTo(v.cx, v.cy, v.gx, v.gy); g.stroke(); g.setLineDash([]);
    });
    world.gates.forEach(function (gt) { if (vis(gt.x, gt.y, 200)) drawGate(gt); });
    world.bells.forEach(function (b, bi) { if (vis(b.x, b.y, 140)) drawBell(b, bi, state.bellLit[bi] || (flight && flight.lit[bi])); });

    // great tree aura
    if (dawn > 0.01) {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = dawn * (0.5 + 0.08 * Math.sin(T * 1.5));
      var ar = 560; g.drawImage(GL.gold, world.arena.tx - ar, world.arena.ty - ar, ar * 2, ar * 2);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }

    // fireflies
    world.fireflies.forEach(function (f, fi) {
      if (state.ff[fi] || (flight && flight.ffGot[fi]) || !vis(f.x, f.y, 60)) return;
      var x = f.x + Math.sin(T * 1.1 + fi * 2.3) * 9 + Math.sin(T * 2.7 + fi) * 3, y = f.y + Math.cos(T * 0.9 + fi * 1.7) * 7;
      var pulse = 0.65 + 0.35 * Math.sin(T * 3.1 + fi * 4);
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = pulse; g.drawImage(GL.green, x - 26, y - 26, 52, 52);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.fillStyle = '#f6ffc8'; g.beginPath(); g.arc(x, y, 3.2, 0, 6.28); g.fill();
    });

    // mushrooms: halo then body, sorted by y
    var ms = state.mush.filter(function (m) { return vis(m.x, m.y, 260); }).sort(function (a, b) { return a.y - b.y; });
    g.globalCompositeOperation = 'lighter';
    ms.forEach(function (m) {
      var own = canLaunch(m), r = (own ? 70 + m.size * 26 : 46 + m.size * 14) * (1 + Math.sin(T * 1.7 + m.id) * 0.05);
      g.globalAlpha = own ? 0.34 : 0.2; g.drawImage(own ? GL.warm : (m.kind === 'giant' ? GL.teal : GL.blue), m.x - r, m.y - r, r * 2, r * 2);
    });
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    ms.forEach(function (m) {
      if (m.id === activeId && mode === 'play' && !flight) {
        var R = C.MR[m.size] + 9 + Math.sin(T * 4) * 1.5;
        g.strokeStyle = 'rgba(255,236,190,.85)'; g.lineWidth = 2.5; g.setLineDash([7, 7]); g.lineDashOffset = -T * 14;
        g.beginPath(); g.arc(m.x, m.y, R, 0, 6.28); g.stroke(); g.setLineDash([]);
      } else if (m.id === hoverId && canLaunch(m) && !flight && !aim) {
        g.strokeStyle = 'rgba(255,236,190,.4)'; g.lineWidth = 2; g.beginPath(); g.arc(m.x, m.y, C.MR[m.size] + 8, 0, 6.28); g.stroke();
      }
      drawMushroom(m);
      // growth pips: how many more knocks until this one grows
      var ga = anim(m.id);
      if (m.size < 3 && m.kind !== 'giant' && ((ga.hitT && T - ga.hitT < 3.2) || (m.id === hoverId && !flight))) {
        var lo = m.size === 1 ? 0 : C.GROW[1], need = C.GROW[m.size] - lo, have = Math.min(need, m.hits + ((flight && flight.mh[m.id]) || 0) - lo);
        var fa = (ga.hitT && T - ga.hitT < 3.2) ? clamp((3.2 - (T - ga.hitT)) / 0.5, 0, 1) : 1, gy = m.y - C.MR[m.size] - 16;
        for (var gi = 0; gi < need; gi++) {
          var gx = m.x + (gi - (need - 1) / 2) * 13;
          g.globalAlpha = fa; g.fillStyle = gi < have ? '#fff0b0' : 'rgba(20,14,30,.75)'; g.strokeStyle = '#fff0b0'; g.lineWidth = 1.8;
          g.beginPath(); g.arc(gx, gy, 4.2, 0, 6.28); g.fill(); g.stroke();
        }
        g.globalAlpha = 1;
      }
    });

    // spore + trail
    if (flight) {
      var tr = flight.trail, fp2 = flightPos(), floating = flight.res.floatFrom >= 0 && flight.idx > flight.res.floatFrom;
      g.lineCap = 'round';
      for (var i = 2; i < tr.length; i += 2) {
        g.strokeStyle = 'rgba(255,225,160,' + (i / tr.length * 0.6) + ')'; g.lineWidth = 1 + i / tr.length * 6;
        g.beginPath(); g.moveTo(tr[i - 2], tr[i - 1]); g.lineTo(tr[i], tr[i + 1]); g.stroke();
      }
      g.globalCompositeOperation = 'lighter'; g.drawImage(floating ? GL.blue : GL.warm, fp2.x - 34, fp2.y - 34, 68, 68); g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(fp2.x, fp2.y + (floating ? Math.sin(T * 6) * 1.5 : 0), C.SPORE_R, 0, 6.28); g.fill();
      g.strokeStyle = '#ffb36b'; g.lineWidth = 2; g.stroke();
    }

    // particles
    g.globalCompositeOperation = 'lighter';
    particles.forEach(function (q) {
      var k = 1 - q.t / q.life;
      if (q.ring) { g.strokeStyle = 'rgba(' + q.col + ',' + (k * 0.8) + ')'; g.lineWidth = 3 * k + 0.5; g.beginPath(); g.arc(q.x, q.y, lerp(q.r0, q.r1, 1 - k * k), 0, 6.28); g.stroke(); }
      else { g.fillStyle = 'rgba(' + q.col + ',' + k + ')'; g.beginPath(); g.arc(q.x, q.y, q.size * (0.4 + k * 0.6), 0, 6.28); g.fill(); }
    });
    g.globalCompositeOperation = 'source-over';

    // aim
    if (aim) {
      var m = aim.m, len = Math.sqrt(aim.px * aim.px + aim.py * aim.py);
      var hx = m.x + aim.px / s, hy = m.y + aim.py / s;   // pull handle in world space
      g.strokeStyle = 'rgba(255,236,190,' + (len < 18 ? 0.3 : 0.8) + ')'; g.lineWidth = 3 + aim.p * 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(hx, hy); g.stroke();
      g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(hx, hy, 7, 0, 6.28); g.fill();
      if (aim.preview) {
        var pts = aim.preview.pts, n = aim.preview.n, acc = 0, next = 16, dot = 0;
        for (i = 1; i < n; i++) {
          var dx = pts[i * 2] - pts[i * 2 - 2], dy = pts[i * 2 + 1] - pts[i * 2 - 1]; acc += Math.sqrt(dx * dx + dy * dy);
          if (acc >= next) {
            next += 20; dot++;
            var fade = clamp((previewLen() - acc) / 140, 0.12, 1), tw = 0.75 + 0.25 * Math.sin(T * 6 - dot * 0.6);
            g.globalCompositeOperation = 'lighter'; g.globalAlpha = fade * tw * 0.8; g.drawImage(GL.green, pts[i * 2] - 11, pts[i * 2 + 1] - 11, 22, 22);
            g.globalCompositeOperation = 'source-over'; g.globalAlpha = fade; g.fillStyle = '#f6ffd0'; g.beginPath(); g.arc(pts[i * 2], pts[i * 2 + 1], 2.4, 0, 6.28); g.fill();
          }
        }
        g.globalAlpha = 1;
        aim.preview.events.forEach(function (e) {
          if (e.type === 'mush' || e.type === 'rock' || e.type === 'wall' || e.type === 'gate') { g.strokeStyle = 'rgba(255,246,208,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(e.x, e.y, 9, 0, 6.28); g.stroke(); }
        });
        var e = aim.preview.end;
        if (e.type === 'sprout') {
          g.strokeStyle = '#9dffc8'; g.lineWidth = 3; g.beginPath(); g.arc(e.x, e.y, 16 + Math.sin(T * 5) * 2, 0, 6.28); g.stroke();
          g.fillStyle = '#9dffc8'; g.beginPath(); g.ellipse(e.x - 5, e.y - 3, 6, 3.5, -0.6, 0, 6.28); g.fill(); g.beginPath(); g.ellipse(e.x + 5, e.y - 3, 6, 3.5, 0.6, 0, 6.28); g.fill();
        } else if (e.type === 'fizzle' || e.type === 'thorn') {
          g.strokeStyle = e.type === 'thorn' ? '#ff5a8a' : '#c9a9a0'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(e.x - 9, e.y - 9); g.lineTo(e.x + 9, e.y + 9); g.moveTo(e.x + 9, e.y - 9); g.lineTo(e.x - 9, e.y + 9); g.stroke();
        } else if (e.type === 'water') {
          g.strokeStyle = '#a8d4ff'; g.lineWidth = 2.5; for (i = 0; i < 2; i++) { g.beginPath(); g.ellipse(e.x, e.y, 10 + i * 9 + Math.sin(T * 4) * 2, 5 + i * 4, 0, 0, 6.28); g.stroke(); }
        }
      }
    }

    // popups
    g.textAlign = 'center'; g.textBaseline = 'middle';
    popups.forEach(function (p) {
      var k = p.t / p.life, a = k < 0.15 ? k / 0.15 : (k > 0.7 ? (1 - k) / 0.3 : 1), sz = p.size * (k < 0.12 ? 0.6 + k / 0.12 * 0.5 : 1.1 - Math.min(0.1, (k - 0.12)));
      g.font = '800 ' + sz + 'px "Hiragino Maru Gothic ProN","BIZ UDPGothic","Yu Gothic UI","Meiryo",sans-serif';
      g.globalAlpha = a; g.lineWidth = 5; g.strokeStyle = 'rgba(20,12,30,.85)'; g.strokeText(p.text, p.x, p.y - k * 34); g.fillStyle = p.col; g.fillText(p.text, p.x, p.y - k * 34);
    });
    g.globalAlpha = 1;

    // first-time drag demonstration
    if (mode === 'play' && !firstShotDone && !aim && !flight) {
      var mo = state.mush[0], ph = (T % 2.6) / 2.6, pull = ph < 0.55 ? ph / 0.55 : (ph < 0.75 ? 1 : 0), dxp = -0.83, dyp = 0.55, L2 = 120 * (1 - Math.pow(1 - pull, 2));
      if (ph < 0.75) {
        g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(mo.x, mo.y); g.lineTo(mo.x + dxp * L2, mo.y + dyp * L2); g.stroke(); g.setLineDash([]);
        g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(mo.x + dxp * L2, mo.y + dyp * L2, 10, 0, 6.28); g.fill();
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.arc(mo.x + dxp * L2, mo.y + dyp * L2, 16, 0, 6.28); g.stroke();
        for (i = 1; i <= 6; i++) { g.fillStyle = 'rgba(240,255,200,' + (pull * (1 - i / 8)) + ')'; g.beginPath(); g.arc(mo.x - dxp * (40 + i * 30) * pull, mo.y - dyp * (40 + i * 30) * pull, 3.5, 0, 6.28); g.fill(); }
      } else {
        var fl = (ph - 0.75) / 0.25; g.fillStyle = 'rgba(255,246,224,' + (1 - fl) + ')'; g.beginPath(); g.arc(mo.x - dxp * (40 + fl * 220), mo.y - dyp * (40 + fl * 220), 6, 0, 6.28); g.fill();
      }
    }

    if (showDebug) {
      g.lineWidth = 1; g.strokeStyle = '#0f0'; state.mush.forEach(function (m) { g.beginPath(); g.arc(m.x, m.y, C.MR[m.size], 0, 6.28); g.stroke(); });
      g.strokeStyle = '#f0f'; world.thorns.forEach(function (o) { g.beginPath(); g.arc(o.x, o.y, o.r, 0, 6.28); g.stroke(); });
      g.strokeStyle = '#ff0'; world.walls.forEach(function (o) { g.lineWidth = o.r * 2; g.globalAlpha = 0.25; g.lineCap = 'round'; g.beginPath(); g.moveTo(o.ax, o.ay); g.lineTo(o.bx, o.by); g.stroke(); g.globalAlpha = 1; });
    }

    // dawn wash
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (dawn > 0.01) {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = dawn * 0.3;
      var dgr = g.createLinearGradient(cw, 0, 0, ch); dgr.addColorStop(0, '#ffcf8a'); dgr.addColorStop(0.55, 'rgba(255,150,110,.25)'); dgr.addColorStop(1, 'rgba(120,80,160,0)');
      g.fillStyle = dgr; g.fillRect(0, 0, cw, ch);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    }
    // vignette
    var vg = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.45, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
    vg.addColorStop(0, 'rgba(5,3,12,0)'); vg.addColorStop(1, 'rgba(5,3,12,' + lerp(0.55, 0.2, dawn) + ')');
    g.fillStyle = vg; g.fillRect(0, 0, cw, ch);
  }

  /* ================= input ================= */
  function pickMushroom(wx, wy, pad) {
    var best = null, bd = 1e9;
    state.mush.forEach(function (m) { var d = Math.sqrt((m.x - wx) * (m.x - wx) + (m.y - wy) * (m.y - wy)) - C.MR[m.size]; if (d < pad && d < bd) { bd = d; best = m; } });
    return best;
  }
  cv.addEventListener('pointerdown', function (e) {
    A.init();
    if (mode === 'ending') { showResult(); return; }
    if (mode !== 'play') return;
    mouse.x = e.clientX; mouse.y = e.clientY;
    var w = s2w(e.clientX, e.clientY);
    if (e.button === 2) {
      if (aim) { aim = null; return; }
      var um = pickMushroom(w.x, w.y, 10); if (um) doUproot(um);
      return;
    }
    if (e.button !== 0) return;
    mouse.down = true; cv.setPointerCapture(e.pointerId);
    if (flight) return;
    var m = pickMushroom(w.x, w.y, 22 / cam.zoom);
    if (m && canLaunch(m)) {
      if (activeId !== m.id) A.select();
      activeId = m.id;
      var ms = w2s(m.x, m.y);
      aim = { m: m, px: e.clientX - ms.x, py: e.clientY - ms.y, p: 0, preview: null };
      refreshPreview(); cv.style.cursor = 'grabbing';
    } else {
      pan = { x: e.clientX, y: e.clientY, moved: 0 };
      if (m && !canLaunch(m)) hint('wild', 'ねむっている 野生のキノコからは とばせない（当てると はじく）', 5);
    }
  });
  cv.addEventListener('pointermove', function (e) {
    var dx = e.clientX - mouse.x, dy = e.clientY - mouse.y; mouse.x = e.clientX; mouse.y = e.clientY;
    if (aim) { var f = e.shiftKey ? 0.2 : 1; aim.px += dx * f; aim.py += dy * f; refreshPreview(); return; }
    if (pan) { var s = sc(); cam.x -= dx / s; cam.y -= dy / s; pan.moved += Math.abs(dx) + Math.abs(dy); if (pan.moved > 6) cam.manual = true; clampCam(); return; }
    if (mode === 'play') {
      var w = s2w(e.clientX, e.clientY), m = pickMushroom(w.x, w.y, 22 / cam.zoom);
      hoverId = m ? m.id : 0; cv.style.cursor = (m && canLaunch(m) && !flight) ? 'grab' : 'default';
    }
  });
  function release() {
    mouse.down = false;
    if (aim) {
      var v = aimVelocity(), m = aim.m; aim = null; cv.style.cursor = 'default';
      if (v) startFlight(m, v.vx, v.vy, v.p);
    }
    pan = null;
  }
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', function () { aim = null; pan = null; mouse.down = false; });
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  cv.addEventListener('wheel', function (e) {
    e.preventDefault(); if (mode !== 'play') return;
    var before = s2w(e.clientX, e.clientY);
    cam.zoom = clamp(cam.zoom * Math.exp(-e.deltaY * 0.0012), 0.35, 1.5);
    if (!aim && !flight) { var after = s2w(e.clientX, e.clientY); cam.x += before.x - after.x; cam.y += before.y - after.y; cam.manual = true; }
    clampCam(); if (aim) refreshPreview();
  }, { passive: false });
  window.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase(); keys[k] = true;
    if (k === ' ' || k.indexOf('arrow') === 0) e.preventDefault();
    if (mode === 'ending') { if (k === 'escape' || k === ' ' || k === 'enter') showResult(); return; }
    if (mode !== 'play') return;
    if (k === 'escape') { if (aim) { aim = null; return; } toggleMenu(); return; }
    if (k === 'm') { setMuteLabel(A.toggleMute()); return; }
    if (k === 'f3') { showDebug = !showDebug; e.preventDefault(); return; }
    if (aim) {
      var rot = (k === 'arrowleft' ? -1 : k === 'arrowright' ? 1 : 0) * 0.0035, scl = k === 'arrowup' ? 1.01 : (k === 'arrowdown' ? 0.99 : 1);
      if (rot || scl !== 1) { var c = Math.cos(rot), s = Math.sin(rot), x = aim.px, y = aim.py; aim.px = (x * c - y * s) * scl; aim.py = (x * s + y * c) * scl; refreshPreview(); }
      return;
    }
    if (k === ' ' && !flight) { cam.manual = false; }
    if (k === 'z' && !flight) {
      var last = null; state.mush.forEach(function (m) { if (m.kind === 'own' && (!last || m.id > last.id)) last = m; });
      if (last) doUproot(last);
    }
  });
  window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', function () { keys = {}; });
  window.addEventListener('resize', resize);

  /* ================= UI wiring ================= */
  function setMuteLabel(m) { $('btn-mute').textContent = m ? '× 音' : '♪ 音'; }
  function toggleMenu() { $('menu').classList.toggle('hidden'); }
  function enterPlay() {
    mode = 'play'; $('title').classList.add('hidden'); $('result').classList.add('hidden'); $('hud').classList.remove('hidden');
    if (!firstShotDone) setTimeout(function () { if (!firstShotDone) hint(null, 'キノコを つかんで ひっぱり、はなす', 600); }, 900);
  }
  $('btn-start').onclick = function () { A.init(); newGame(); enterPlay(); };
  $('btn-continue').onclick = function () { A.init(); var d = loadSave(); if (d) applySave(d); enterPlay(); };
  $('btn-menu').onclick = function () { toggleMenu(); };
  $('btn-mute').onclick = function () { A.init(); setMuteLabel(A.toggleMute()); };
  $('btn-resume').onclick = function () { toggleMenu(); };
  $('btn-restart').onclick = function () { if (confirm('さいしょから やりなおしますか？（いまの森は きえます）')) { newGame(); toggleMenu(); enterPlay(); } };
  $('vol').oninput = function () { A.setVolume(this.value / 100); };
  $('btn-free').onclick = function () { ending = null; cam.zoom = 1; cam.manual = false; enterPlay(); };
  $('btn-again').onclick = function () { newGame(); enterPlay(); };
  if (loadSave()) $('btn-continue').style.display = '';

  /* ================= boot ================= */
  resize();
  terrain = paintTerrain();
  updateHud();
  var lastT = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    update(dt); draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* test hooks (used by the browser verification pass; harmless in normal play) */
  window.__pon = {
    world: world, S: S,
    get state() { return state; }, get mode() { return mode; }, get flight() { return flight; }, get activeId() { return activeId; },
    cam: cam,
    shoot: function (id, deg, p, instant) {
      if (flight) return null;
      var L = mushById(id), sp = C.VMIN + (C.VMAX - C.VMIN) * p, a = deg * Math.PI / 180;
      var res = startFlight(L, Math.cos(a) * sp, Math.sin(a) * sp, p);
      if (instant) { res.events.forEach(function (e) { handleEvent(e, true); }); return { end: res.end, out: finishShot(true) }; }
      return { end: res.end };
    },
    shootV: function (id, vx, vy, instant) {
      if (flight) return null;
      var res = startFlight(mushById(id), vx, vy, 0.8);
      if (instant) { res.events.forEach(function (e) { handleEvent(e, true); }); return { end: res.end, out: finishShot(true) }; }
      return { end: res.end };
    },
    start: function () { newGame(); enterPlay(); },
    update: update, draw: draw
  };
})();
