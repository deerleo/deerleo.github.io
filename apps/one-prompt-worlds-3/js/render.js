// EMBERDEEP — world renderer (Canvas 2D). Cold dark vs warm light.
(function () {
  'use strict';
  const EMB = window.EMB, T = EMB.T, TAU = Math.PI * 2;
  const TS = 48, W = 1280, H = 720;
  const R = EMB.R = { TS: TS, W: W, H: H, cam: { x: 0, y: 0 }, P: [], slashes: [], nums: [], flashes: [], shake: 0, time: 0, tint: 0, hurtFlash: 0 };

  const THEMES = {
    mine: { floor: ['#6b5a50', '#665549', '#705e53'], seam: 'rgba(30,20,24,0.35)', top: '#241c2a', cap: '#3a2e3c', face: '#54434c', brick: 'rgba(20,12,20,0.4)', deco: '#7d6a5c' },
    hub: { floor: ['#6a665e', '#646058', '#706b62'], seam: 'rgba(24,22,28,0.35)', top: '#23212c', cap: '#3b3846', face: '#55515e', brick: 'rgba(16,14,24,0.4)', deco: '#807a6e' },
    fungus: { floor: ['#46605a', '#415a55', '#4b665e'], seam: 'rgba(14,30,30,0.3)', top: '#16232a', cap: '#24393c', face: '#35544f', brick: 'rgba(8,24,24,0.4)', deco: '#5f8a78' },
    archive: { floor: ['#5b5478', '#4f496b', '#5b5478'], seam: 'rgba(20,16,40,0.4)', top: '#1f1a33', cap: '#352d52', face: '#4f4470', brick: 'rgba(16,10,36,0.4)', deco: '#7a70a0' },
    core: { floor: ['#6a443e', '#643f3a', '#704842'], seam: 'rgba(40,10,8,0.4)', top: '#2a1418', cap: '#472026', face: '#6a3230', brick: 'rgba(30,6,8,0.45)', deco: '#8f5a48' }
  };
  const GROUP_THEME = { camp: 'mine', upper: 'mine', hub: 'hub', fungus: 'fungus', archive: 'archive', core: 'core', coretop: 'core', final: 'core', none: 'mine' };
  const DANGER = '#ff3d7f', INK = '#2b1f4d', INK2 = '#7663c9', EYE = '#aef4ff';

  function prep(def) {
    if (def._near) return;
    const n = def.w * def.h, near = def._near = new Int16Array(n).fill(-1), q = [];
    for (let i = 0; i < n; i++) if (def.roomAt[i] >= 0) { near[i] = def.roomAt[i]; q.push(i); }
    for (let qi = 0; qi < q.length; qi++) {
      const c = q[qi], x = c % def.w, y = (c - x) / def.w;
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + d[0], ny = y + d[1]; if (nx < 0 || ny < 0 || nx >= def.w || ny >= def.h) continue; const k = ny * def.w + nx; if (near[k] >= 0) continue; near[k] = near[c]; q.push(k); }
    }
    const h = def._hash = new Uint16Array(n);
    for (let i = 0; i < n; i++) { let v = (i * 2654435761) >>> 0; v ^= v >>> 13; v = Math.imul(v, 0x5bd1e995) >>> 0; h[i] = (v ^ (v >>> 15)) & 0xffff; }
  }
  R.prep = prep;

  function sx(x) { return (x - R.cam.x) * TS + W / 2; }
  function sy(y) { return (y - R.cam.y) * TS + H / 2; }

  // ------------------------------------------------------------ particles / fx
  function part(o) { if (R.P.length < 700) R.P.push(o); }
  function burst(x, y, n, col, sp, life, o) {
    for (let i = 0; i < n; i++) { const a = (o && o.a !== undefined ? o.a + (Math.random() - 0.5) * (o.spread || 1.2) : Math.random() * TAU), s = sp * (0.3 + Math.random() * 0.9); part({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.5 + Math.random() * 0.7), max: life, size: (o && o.size || 4) * (0.6 + Math.random() * 0.8), col: col, add: !o || o.add !== false, grav: o && o.grav || 0, drag: o && o.drag || 3 }); }
  }
  R.onEvent = function (e, g) {
    const p = g.p;
    switch (e.t) {
      case 'swing': R.slashes.push({ x: e.x, y: e.y, a: e.a, w: e.w, fin: e.fin, t: 0 }); break;
      case 'dmg':
        R.nums.push({ x: e.x + (Math.random() - 0.5) * 0.4, y: e.y - 0.5, n: e.n, t: 0, col: e.shroud ? '#8d86b8' : e.burst ? '#ffb347' : e.heavy ? '#fff2b0' : '#ffffff', big: e.heavy || e.burst });
        burst(e.x, e.y, e.heavy ? 12 : 7, e.shroud ? '#6d64a8' : '#ffe9a8', 6, 0.3, { a: e.a, spread: 1.4, size: 4 });
        burst(e.x, e.y, 4, INK2, 3, 0.4, { add: false, size: 5 });
        R.shake = Math.max(R.shake, e.heavy ? 5 : 2); break;
      case 'kill':
        burst(e.x, e.y, e.boss ? 80 : 18, INK, e.boss ? 9 : 5, 0.7, { add: false, size: e.boss ? 10 : 7 });
        burst(e.x, e.y, e.boss ? 60 : 10, '#c9b8ff', e.boss ? 8 : 4, 0.6, { size: 4 });
        R.flashes.push({ x: e.x, y: e.y, r: e.boss ? 9 : 2.5, life: 0.35, max: 0.35 });
        R.shake = Math.max(R.shake, e.boss ? 16 : 4); break;
      case 'pitfall': burst(e.x, e.y, 10, INK2, 2, 0.6, { add: false, size: 5 }); R.nums.push({ x: e.x, y: e.y - 0.4, text: '落下！', t: 0, col: '#ffd27a', big: true }); break;
      case 'clang': burst(e.x, e.y, 10, '#ffffff', 7, 0.25, { a: e.a + Math.PI, spread: 2, size: 3 }); R.nums.push({ x: e.x, y: e.y - 0.6, text: 'ガキン', t: 0, col: '#cfd6e6' }); R.shake = Math.max(R.shake, 3); break;
      case 'guardbreak': burst(e.x, e.y, 16, '#fff', 7, 0.4, { size: 4 }); R.nums.push({ x: e.x, y: e.y - 0.7, text: '殻割り！', t: 0, col: '#ffd27a', big: true }); break;
      case 'ignite':
        R.flashes.push({ x: e.x, y: e.y, r: 7, life: 0.5, max: 0.5 }); R.rings.push({ x: e.x, y: e.y, r: 0.3, max: 2.5, life: 0.35, max0: 0.35, col: '#ffb347' });
        burst(e.x, e.y - 0.3, 26, '#ffcf6b', 6, 0.7, { size: 4, grav: -3 }); R.shake = Math.max(R.shake, 4); break;
      case 'roomlit': R.rings.push({ x: e.x, y: e.y, r: 0.5, max: 9, life: 0.8, max0: 0.8, col: '#ffe2a0' }); break;
      case 'lamp':
        R.flashes.push({ x: e.x, y: e.y, r: 16, life: 1.4, max: 1.4 }); R.tint = 1;
        for (let i = 0; i < 3; i++) R.rings.push({ x: e.x, y: e.y, r: 0.5, max: 14, life: 0.9 + i * 0.35, max0: 0.9 + i * 0.35, col: '#ffe2a0' });
        burst(e.x, e.y - 0.8, 90, '#ffd98a', 9, 1.6, { size: 5, grav: -2, drag: 1.5 }); R.shake = Math.max(R.shake, 8); break;
      case 'rest': burst(p.x, p.y, 24, '#ffd98a', 3, 0.9, { size: 4, grav: -3 }); break;
      case 'lvl':
        R.nums.push({ x: e.x, y: e.y - 0.9, text: 'LEVEL UP!  Lv ' + e.lvl, t: 0, col: '#ffe27a', big: true, slow: true });
        R.rings.push({ x: e.x, y: e.y, r: 0.3, max: 2.8, life: 0.5, max0: 0.5, col: '#ffe27a' }); R.flashes.push({ x: e.x, y: e.y, r: 5, life: 0.6, max: 0.6 });
        burst(e.x, e.y, 40, '#fff0a8', 5, 1.0, { size: 4, grav: -5 }); break;
      case 'hurt': R.hurtFlash = 1; R.shake = Math.max(R.shake, 9); R.nums.push({ x: e.x, y: e.y - 0.7, n: -e.n, t: 0, col: '#ff5a6e', big: true }); burst(e.x, e.y, 10, '#ff5a6e', 5, 0.4, { size: 4 }); break;
      case 'heal': R.nums.push({ x: e.x, y: e.y - 0.7, text: '+' + e.n, t: 0, col: '#8dffb0', big: true }); burst(e.x, e.y, 18, '#8dffb0', 2.5, 0.9, { size: 4, grav: -4 }); break;
      case 'leech': burst(e.x, e.y, 4, '#8dffb0', 2, 0.6, { size: 3, grav: -4 }); break;
      case 'roll': burst(e.x, e.y + 0.2, 6, '#b8a898', 2, 0.35, { add: false, size: 5 }); break;
      case 'crate': burst(e.x, e.y, 12, '#a87a4a', 5, 0.5, { add: false, size: 6, grav: 6 }); R.shake = Math.max(R.shake, 2); break;
      case 'crack': burst(e.x, e.y, 30, '#8a7a84', 7, 0.8, { add: false, size: 8, grav: 5 }); burst(e.x, e.y, 14, '#fff2b0', 5, 0.4); R.shake = Math.max(R.shake, 12); break;
      case 'clink': burst(e.x, e.y, 5, '#fff', 4, 0.2, { size: 3 }); break;
      case 'chest': burst(e.x, e.y - 0.2, 30, '#ffe27a', 5, 0.9, { size: 4, grav: -3 }); R.flashes.push({ x: e.x, y: e.y, r: 5, life: 0.6, max: 0.6 }); break;
      case 'reveal': burst(e.x, e.y, 24, '#ffe27a', 4, 0.8, { size: 4 }); R.rings.push({ x: e.x, y: e.y, r: 0.2, max: 1.6, life: 0.4, max0: 0.4, col: '#ffe27a' }); break;
      case 'flare':
        R.flashes.push({ x: e.x, y: e.y, r: 11, life: 0.6, max: 0.6 }); R.rings.push({ x: e.x, y: e.y, r: 0.3, max: e.r, life: 0.3, max0: 0.3, col: '#ffb347', fill: true });
        burst(e.x, e.y, 70, '#ffb347', 13, 0.6, { size: 6 }); R.shake = Math.max(R.shake, 12); break;
      case 'retort': R.rings.push({ x: e.x, y: e.y, r: 0.3, max: 2.4, life: 0.25, max0: 0.25, col: '#ff8a4a', fill: true }); break;
      case 'slam': R.shake = Math.max(R.shake, 16); burst(e.x, e.y, 30, '#9b8f88', 7, 0.6, { add: false, size: 8 }); break;
      case 'crash': R.shake = Math.max(R.shake, 10); burst(e.x, e.y, 16, '#cfc6c0', 6, 0.5, { add: false, size: 6 }); R.nums.push({ x: e.x, y: e.y - 0.7, text: '激突！', t: 0, col: '#ffd27a', big: true }); break;
      case 'splash': burst(e.x, e.y, 22, '#b06bff', 5, 0.5, { size: 5 }); R.rings.push({ x: e.x, y: e.y, r: 0.2, max: e.r, life: 0.25, max0: 0.25, col: DANGER, fill: true }); R.shake = Math.max(R.shake, 3); break;
      case 'snuff': burst(e.x, e.y, 20, '#3a2a6a', 3, 0.9, { add: false, size: 8, grav: -2 }); break;
      case 'scorch': R.flashes.push({ x: e.x, y: e.y, r: 14, life: 1, max: 1 }); R.shake = Math.max(R.shake, 12); burst(e.x, e.y, 50, '#ffd98a', 8, 0.9, { size: 5 }); break;
      case 'roar': R.shake = Math.max(R.shake, e.big ? 14 : 8); burst(e.x, e.y, 30, '#6d4bd0', 8, 0.6, { size: 6 }); break;
      case 'burst': burst(e.x, e.y, 14, DANGER, 5, 0.3, { size: 4 }); break;
      case 'door': burst(e.x, e.y, 14, e.mode === 'arena' ? '#7a4bd0' : '#b8a898', 3, 0.6, { add: e.mode === 'arena', size: 6 }); break;
      case 'die': burst(e.x, e.y, 40, '#ffb347', 6, 1.2, { size: 5 }); R.shake = 14; break;
      case 'forge': burst(p.x, p.y - 0.3, 24, '#ffe9a8', 5, 0.6, { size: 4 }); break;
      case 'zone': R.P.length = 0; R.slashes.length = 0; R.nums.length = 0; R.rings.length = 0; R.flashes.length = 0; R.cam.x = p.x; R.cam.y = p.y; break;
      case 'pick': if (e.k === 'xp') part({ x: p.x, y: p.y - 0.3, vx: 0, vy: -1.5, life: 0.3, max: 0.3, size: 5, col: '#ffcf6b', add: true, grav: 0, drag: 0 }); break;
    }
  };
  R.rings = [];

  R.update = function (dt, g) {
    R.time += dt;
    const p = g.p, c = R.cam;
    const lx = p.x + Math.cos(p.face) * 0.6, ly = p.y + Math.sin(p.face) * 0.4;
    const k = 1 - Math.exp(-7 * dt); c.x += (lx - c.x) * k; c.y += (ly - c.y) * k;
    R.shake *= Math.exp(-9 * dt); R.tint *= Math.exp(-1.2 * dt); R.hurtFlash *= Math.exp(-5 * dt);
    for (let i = R.P.length - 1; i >= 0; i--) { const q = R.P[i]; q.life -= dt; if (q.life <= 0) { R.P.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.grav * dt; const d = Math.exp(-q.drag * dt); q.vx *= d; q.vy *= d; }
    for (let i = R.slashes.length - 1; i >= 0; i--) { R.slashes[i].t += dt; if (R.slashes[i].t > 0.2) R.slashes.splice(i, 1); }
    for (let i = R.nums.length - 1; i >= 0; i--) { const n = R.nums[i]; n.t += dt * (n.slow ? 0.45 : 1); if (n.t > 0.9) R.nums.splice(i, 1); }
    for (let i = R.rings.length - 1; i >= 0; i--) { R.rings[i].life -= dt; if (R.rings[i].life <= 0) R.rings.splice(i, 1); }
    for (let i = R.flashes.length - 1; i >= 0; i--) { R.flashes[i].life -= dt; if (R.flashes[i].life <= 0) R.flashes.splice(i, 1); }
    // ambient embers from lit braziers / lamps
    if (Math.random() < dt * 14) {
      const os = g.z.objs.filter(o => (o.k === 'brazier' || o.k === 'lamp') && o.lit && Math.abs(o.cx - c.x) < 15 && Math.abs(o.cy - c.y) < 9);
      if (os.length) { const o = os[Math.floor(Math.random() * os.length)]; part({ x: o.cx + (Math.random() - 0.5) * 0.4, y: o.cy - (o.k === 'lamp' ? 1.3 : 0.5), vx: (Math.random() - 0.5) * 0.6, vy: -1 - Math.random(), life: 1.2, max: 1.2, size: 3, col: '#ffbf5a', add: true, grav: -0.5, drag: 0.5 }); }
    }
  };

  // ------------------------------------------------------------ light map
  let LC = null, lctx = null, LC2 = null, l2 = null; const LS = 4, LM = 48;
  function lightPass(ctx, g) {
    if (!LC) { LC = document.createElement('canvas'); LC.width = (W + LM * 2) / LS; LC.height = (H + LM * 2) / LS; lctx = LC.getContext('2d'); LC2 = document.createElement('canvas'); LC2.width = LC.width; LC2.height = LC.height; l2 = LC2.getContext('2d'); }
    const z = g.z, def = z.def, l = lctx;
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.globalAlpha = 1;
    l.fillStyle = 'rgb(7,6,20)'; l.fillRect(0, 0, LC.width, LC.height);
    l.setTransform(1 / LS, 0, 0, 1 / LS, LM / LS, LM / LS);
    l.globalCompositeOperation = 'destination-out';
    const x0 = Math.floor(R.cam.x - W / 2 / TS) - 1, x1 = Math.ceil(R.cam.x + W / 2 / TS) + 1, y0 = Math.floor(R.cam.y - H / 2 / TS) - 1, y1 = Math.ceil(R.cam.y + H / 2 / TS) + 1;
    const litRoom = {};
    for (const r of def.rooms) { litRoom[r.id] = (g.groupLit(r.group) ? 0.62 : 0) + (g.roomLit(r.id) ? (g.groupLit(r.group) ? 0.24 : 0.5) : 0); if (r.group === 'camp') litRoom[r.id] = 0.8; }
    l.fillStyle = '#000';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= z.w || y >= z.h) continue;
      const ri = def._near[y * z.w + x]; if (ri < 0) continue;
      const a = litRoom[def.rooms[ri].id]; if (a <= 0) continue;
      l.globalAlpha = a; l.fillRect(sx(x) - 1, sy(y) - 1, TS + 2, TS + 2);
    }
    function light(x, y, r, a) {
      const px = sx(x), py = sy(y), rr = r * TS; if (px < -rr || py < -rr || px > W + rr || py > H + rr) return;
      const gr = l.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, 'rgba(0,0,0,' + a + ')'); gr.addColorStop(0.5, 'rgba(0,0,0,' + a * 0.6 + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      l.globalAlpha = 1; l.fillStyle = gr; l.fillRect(px - rr, py - rr, rr * 2, rr * 2);
    }
    const fl = 1 + Math.sin(R.time * 9) * 0.02 + Math.sin(R.time * 23) * 0.015;
    const p = g.p; if (p.state !== 'dead') light(p.x, p.y, 5.4 * fl, 0.92); else light(p.x, p.y, 2.5, 0.5);
    for (const o of z.objs) {
      if (o.k === 'brazier') { if (o.lit) light(o.cx, o.cy, 6 * fl, 0.9); else light(o.cx, o.cy, 1.7, 0.42); }
      else if (o.k === 'lamp') light(o.cx, o.cy - 0.5, o.lit ? 9 * fl : 3.4, o.lit ? 0.95 : 0.55);
      else if (o.k === 'chest' && !o.hidden) light(o.cx, o.cy, 1.3, o.open ? 0.2 : 0.4);
      else if (o.k === 'stairs') light(o.cx, o.cy, 2.2, 0.5);
      else if (o.k === 'heart') light(o.cx, o.cy, g.flags.cleared['z2.final'] ? 5 : 2, 0.5);
      else if (o.k === 'crack') light(o.cx, o.cy, 0.9, 0.12 + 0.1 * Math.sin(R.time * 2 + o.x));
    }
    for (const f of z.fires) light(f.x, f.y, 1.6, 0.5 * Math.min(1, f.life));
    for (const f of R.flashes) light(f.x, f.y, f.r * (1.2 - 0.4 * f.life / f.max), 0.95 * f.life / f.max);
    for (const q of z.picks) light(q.x, q.y, 0.9, 0.3);
    l.globalAlpha = 1; l.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    l2.clearRect(0, 0, LC2.width, LC2.height); l2.filter = 'blur(3px)'; l2.drawImage(LC, 0, 0); l2.filter = 'none';
    ctx.globalAlpha = 0.9; ctx.drawImage(LC2, -LM, -LM, W + LM * 2, H + LM * 2); ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ tiles
  function drawTiles(ctx, g) {
    const z = g.z, def = z.def; prep(def);
    const x0 = Math.floor(R.cam.x - W / 2 / TS) - 1, x1 = Math.ceil(R.cam.x + W / 2 / TS), y0 = Math.floor(R.cam.y - H / 2 / TS) - 1, y1 = Math.ceil(R.cam.y + H / 2 / TS);
    ctx.fillStyle = '#0b0914'; ctx.fillRect(0, 0, W, H);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x < 0 || y < 0 || x >= z.w || y >= z.h) continue;
      const i = y * z.w + x, t = z.tiles[i], ri = def._near[i], th = THEMES[GROUP_THEME[ri >= 0 ? def.rooms[ri].group : 'none']], h = def._hash[i];
      const px = Math.round(sx(x)), py = Math.round(sy(y));
      if (t === T.ROCK) {
        const below = y + 1 < z.h ? z.tiles[i + z.w] : 0;
        const near = below !== T.ROCK || (y > 0 && z.tiles[i - z.w] !== T.ROCK) || (x > 0 && z.tiles[i - 1] !== T.ROCK) || (x + 1 < z.w && z.tiles[i + 1] !== T.ROCK);
        if (!near) { // diagonal check for corner fill
          const dg = (y > 0 && x > 0 && z.tiles[i - z.w - 1] !== T.ROCK) || (y > 0 && x + 1 < z.w && z.tiles[i - z.w + 1] !== T.ROCK) || (y + 1 < z.h && x > 0 && z.tiles[i + z.w - 1] !== T.ROCK) || (y + 1 < z.h && x + 1 < z.w && z.tiles[i + z.w + 1] !== T.ROCK);
          if (dg) { ctx.fillStyle = th.top; ctx.fillRect(px, py, TS, TS); }
          continue;
        }
        ctx.fillStyle = th.top; ctx.fillRect(px, py, TS, TS);
        if (below !== T.ROCK) {
          ctx.fillStyle = th.cap; ctx.fillRect(px, py, TS, 16);
          ctx.fillStyle = th.face; ctx.fillRect(px, py + 14, TS, TS - 14);
          ctx.fillStyle = th.brick; ctx.fillRect(px, py + 30, TS, 2); ctx.fillRect(px, py + 14, TS, 2);
          ctx.fillRect(px + (h % 2 ? 12 : 30), py + 16, 2, 14); ctx.fillRect(px + (h % 2 ? 34 : 10), py + 32, 2, 16);
          ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(px, py + TS - 5, TS, 5);
          if (GROUP_THEME[def.rooms[ri].group] === 'fungus' && h % 5 === 0) { ctx.fillStyle = '#7fe0c0'; ctx.beginPath(); ctx.arc(px + 10 + h % 26, py + 30, 3 + h % 3, Math.PI, 0); ctx.fill(); ctx.fillRect(px + 9 + h % 26, py + 30, 2, 6); }
          if (GROUP_THEME[def.rooms[ri].group] === 'mine' && h % 9 === 0) { ctx.fillStyle = '#3d2a22'; ctx.fillRect(px + 20, py + 2, 8, TS - 2); ctx.fillStyle = '#5a3f30'; ctx.fillRect(px + 21, py + 2, 3, TS - 2); }
        } else { ctx.fillStyle = th.cap; ctx.fillRect(px, py, TS, 3); }
      } else if (t === T.PIT) {
        ctx.fillStyle = '#07050d'; ctx.fillRect(px, py, TS, TS);
        if (y > 0 && z.tiles[i - z.w] !== T.PIT) { const gr = ctx.createLinearGradient(0, py, 0, py + 30); gr.addColorStop(0, th.face); gr.addColorStop(1, '#07050d'); ctx.fillStyle = gr; ctx.fillRect(px, py, TS, 30); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(px, py, TS, 2); }
        if (x > 0 && z.tiles[i - 1] !== T.PIT) { ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(px, py, 2, TS); }
        if (x + 1 < z.w && z.tiles[i + 1] !== T.PIT) { ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(px + TS - 2, py, 2, TS); }
      } else {
        const tn = GROUP_THEME[ri >= 0 ? def.rooms[ri].group : 'none'];
        ctx.fillStyle = tn === 'archive' ? th.floor[(x + y) % 2] : th.floor[h % 3]; ctx.fillRect(px, py, TS, TS);
        ctx.fillStyle = th.seam; ctx.fillRect(px, py + TS - 1, TS, 1); ctx.fillRect(px + TS - 1, py, 1, TS);
        const k = h % 23;
        if (k < 3) { ctx.fillStyle = th.deco; ctx.fillRect(px + 8 + (h >> 5) % 26, py + 8 + (h >> 9) % 26, 4, 3); ctx.fillRect(px + 14 + (h >> 7) % 20, py + 20 + (h >> 4) % 16, 3, 2); }
        else if (k === 3) { ctx.strokeStyle = th.seam; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + 8, py + 10); ctx.lineTo(px + 20, py + 22); ctx.lineTo(px + 18, py + 36); ctx.stroke(); }
        else if (k === 4 && tn === 'fungus') { ctx.fillStyle = 'rgba(127,224,192,0.35)'; ctx.beginPath(); ctx.arc(px + 24, py + 24, 5, 0, TAU); ctx.arc(px + 34, py + 30, 3, 0, TAU); ctx.fill(); }
        else if (k === 5 && tn === 'core') { ctx.strokeStyle = 'rgba(255,120,60,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + 6, py + 30); ctx.lineTo(px + 22, py + 18); ctx.lineTo(px + 40, py + 26); ctx.stroke(); }
        if (y > 0 && z.tiles[i - z.w] === T.ROCK) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(px, py, TS, 9); }
        if (t === T.SHELF) drawShelf(ctx, px, py, h);
      }
    }
  }
  function drawShelf(ctx, px, py, h) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px + 2, py + TS - 6, TS - 4, 6);
    ctx.fillStyle = '#3a2a24'; ctx.fillRect(px + 2, py - 14, TS - 4, TS + 8);
    ctx.fillStyle = '#5a4034'; ctx.fillRect(px + 2, py - 14, TS - 4, 5);
    const cols = ['#8a4a4a', '#4a6a8a', '#7a7a4a', '#5a4a8a', '#4a8a6a'];
    for (let r = 0; r < 3; r++) { ctx.fillStyle = '#241814'; ctx.fillRect(px + 5, py - 7 + r * 15, TS - 10, 12); for (let b = 0; b < 6; b++) { ctx.fillStyle = cols[(h + b * 3 + r) % 5]; ctx.fillRect(px + 6 + b * 6, py - 6 + r * 15 + ((h >> b) & 1), 5, 11 - ((h >> b) & 1)); } }
  }

  // ------------------------------------------------------------ objects
  function flame(ctx, x, y, s, t) {
    for (let i = 0; i < 3; i++) {
      const w = s * (1 - i * 0.28), hh = s * (1.9 - i * 0.4) * (1 + Math.sin(t * 11 + i * 2) * 0.12), ox = Math.sin(t * 7 + i) * s * 0.12;
      ctx.fillStyle = ['#ff7a2a', '#ffb347', '#fff2b0'][i];
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w, y - hh * 0.5, x + ox, y - hh); ctx.quadraticCurveTo(x + w, y - hh * 0.5, x + w, y); ctx.quadraticCurveTo(x, y + w * 0.7, x - w, y); ctx.fill();
    }
  }
  function drawObj(ctx, o, g) {
    const x = sx(o.cx), y = sy(o.cy), t = R.time;
    if (o.k === 'brazier') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 14, 17, 7, 0, 0, TAU); ctx.fill();
      if (o.s.far) { ctx.fillStyle = '#3a3040'; ctx.fillRect(x - 13, y - 2, 26, 26); ctx.fillStyle = '#4c4054'; ctx.fillRect(x - 13, y - 2, 26, 5); }
      ctx.strokeStyle = '#2a2228'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 10, y + 14); ctx.lineTo(x - 5, y - 2); ctx.moveTo(x + 10, y + 14); ctx.lineTo(x + 5, y - 2); ctx.stroke();
      ctx.fillStyle = '#4a4048'; ctx.beginPath(); ctx.ellipse(x, y - 4, 16, 9, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#6a5c66'; ctx.beginPath(); ctx.ellipse(x, y - 4, 16, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = o.lit ? '#ff9a3a' : '#1c1620'; ctx.beginPath(); ctx.ellipse(x, y - 4, 12, 3.5, 0, 0, TAU); ctx.fill();
      if (o.lit) flame(ctx, x, y - 4, 9, t + o.x);
      else { ctx.fillStyle = 'rgba(160,200,255,' + (0.35 + 0.25 * Math.sin(t * 3 + o.x)) + ')'; ctx.fillRect(x - 3, y - 6, 2, 2); ctx.fillRect(x + 2, y - 5, 2, 2); }
    } else if (o.k === 'lamp') {
      ctx.save(); ctx.translate(x, y + 16); ctx.scale(1.35, 1.35); ctx.translate(-x, -(y + 16));
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 16, 24, 9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3a3038'; ctx.fillRect(x - 18, y + 4, 36, 14); ctx.fillStyle = '#54464e'; ctx.fillRect(x - 18, y + 4, 36, 4);
      ctx.fillStyle = '#2e262c'; ctx.fillRect(x - 5, y - 40, 10, 46);
      ctx.fillStyle = '#6a5a3a'; ctx.fillRect(x - 16, y - 46, 32, 6); ctx.fillRect(x - 16, y - 82, 32, 6);
      ctx.beginPath(); ctx.moveTo(x - 18, y - 82); ctx.lineTo(x, y - 98); ctx.lineTo(x + 18, y - 82); ctx.fill();
      ctx.fillStyle = o.lit ? 'rgba(255,220,140,0.9)' : 'rgba(60,70,100,0.6)'; ctx.fillRect(x - 13, y - 76, 26, 30);
      ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 3; ctx.strokeRect(x - 13, y - 76, 26, 30); ctx.beginPath(); ctx.moveTo(x, y - 76); ctx.lineTo(x, y - 46); ctx.stroke();
      if (o.lit) flame(ctx, x, y - 50, 8, t);
      ctx.restore();
    } else if (o.k === 'chest') {
      if (o.hidden) return;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 13, 18, 6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6a3f2a'; ctx.fillRect(x - 16, y - 4, 32, 18);
      ctx.fillStyle = '#e0b040'; ctx.fillRect(x - 16, y - 4, 32, 3); ctx.fillRect(x - 16, y + 11, 32, 3); ctx.fillRect(x - 3, y - 4, 6, 18);
      if (o.open) { ctx.fillStyle = '#1a1014'; ctx.fillRect(x - 14, y - 12, 28, 9); ctx.fillStyle = '#8a5236'; ctx.fillRect(x - 16, y - 22, 32, 10); ctx.fillStyle = '#e0b040'; ctx.fillRect(x - 16, y - 22, 32, 3); }
      else { ctx.fillStyle = '#8a5236'; ctx.beginPath(); ctx.moveTo(x - 16, y - 4); ctx.quadraticCurveTo(x, y - 22, x + 16, y - 4); ctx.fill(); ctx.fillStyle = '#e0b040'; ctx.fillRect(x - 3, y - 13, 6, 10); ctx.fillStyle = '#fff2b0'; ctx.fillRect(x - 2, y - 2, 4, 5); }
    } else if (o.k === 'crate') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - 17, y + 10, 34, 8);
      ctx.fillStyle = '#8a6238'; ctx.fillRect(x - 17, y - 20, 34, 34); ctx.fillStyle = '#a87a4a'; ctx.fillRect(x - 17, y - 20, 34, 8);
      ctx.strokeStyle = '#5a3d20'; ctx.lineWidth = 3; ctx.strokeRect(x - 15.5, y - 10.5, 31, 23); ctx.beginPath(); ctx.moveTo(x - 15, y - 10); ctx.lineTo(x + 15, y + 12); ctx.stroke();
    } else if (o.k === 'crack') {
      const px = sx(o.x), py = sy(o.y);
      ctx.fillStyle = '#4a3f48'; ctx.fillRect(px, py, TS, TS); ctx.fillStyle = '#5c4f5a'; ctx.fillRect(px, py, TS, 14);
      ctx.strokeStyle = '#120c14'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + 8, py + 4); ctx.lineTo(px + 20, py + 18); ctx.lineTo(px + 14, py + 30); ctx.lineTo(px + 26, py + 46); ctx.moveTo(px + 20, py + 18); ctx.lineTo(px + 36, py + 24); ctx.lineTo(px + 42, py + 40); ctx.moveTo(px + 36, py + 24); ctx.lineTo(px + 40, py + 8); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,150,' + (0.25 + 0.2 * Math.sin(t * 2 + o.x + o.y)) + ')'; ctx.lineWidth = 1; ctx.stroke();
    } else if (o.k === 'door') {
      if (o.open) return;
      const m = o.s.mode;
      for (const tl of o.tiles) {
        const px = sx(tl[0]), py = sy(tl[1]);
        if (m === 'arena') {
          ctx.fillStyle = 'rgba(60,30,120,0.75)'; ctx.fillRect(px, py, TS, TS);
          ctx.fillStyle = 'rgba(160,110,255,0.6)'; for (let k = 0; k < 4; k++) { const yy = (t * 40 + k * 14 + tl[0] * 7) % TS; ctx.fillRect(px + 4 + k * 11, py + yy - 6, 4, 12); }
        } else if (m === 'oneway') {
          ctx.fillStyle = '#5a3d26'; ctx.fillRect(px + 8, py - 10, TS - 16, TS + 10); ctx.fillStyle = '#74502f'; ctx.fillRect(px + 12, py - 10, 6, TS + 10); ctx.fillRect(px + 30, py - 10, 6, TS + 10);
          ctx.fillStyle = '#2e2a30'; ctx.fillRect(px + 4, py + 14, TS - 8, 7);
        } else {
          ctx.fillStyle = '#2a2630'; ctx.fillRect(px, py - 8, TS, TS + 8);
          ctx.fillStyle = '#4a4452'; for (let k = 0; k < 4; k++) ctx.fillRect(px + 4 + k * 12, py - 8, 5, TS + 8);
          ctx.fillStyle = '#5c5564'; ctx.fillRect(px, py - 8, TS, 5); ctx.fillRect(px, py + 18, TS, 5);
        }
      }
      if (m === 'seal' || m === 'gate') {
        const x2 = sx(o.cx), y2 = sy(o.cy) - 4;
        ctx.fillStyle = '#1a161e'; ctx.beginPath(); ctx.arc(x2, y2, 13, 0, TAU); ctx.fill();
        if (m === 'gate') { ctx.fillStyle = g.flags.lamps.L4 ? '#ffcf6b' : '#3d3846'; ctx.beginPath(); ctx.arc(x2 - 5, y2, 4, 0, TAU); ctx.fill(); ctx.fillStyle = g.flags.lamps.L5 ? '#ffcf6b' : '#3d3846'; ctx.beginPath(); ctx.arc(x2 + 5, y2, 4, 0, TAU); ctx.fill(); }
        else { ctx.fillStyle = '#6a8aba'; ctx.beginPath(); ctx.moveTo(x2 - 5, y2 + 6); ctx.quadraticCurveTo(x2 - 6, y2 - 2, x2, y2 - 8); ctx.quadraticCurveTo(x2 + 6, y2 - 2, x2 + 5, y2 + 6); ctx.fill(); }
      }
    } else if (o.k === 'stairs') {
      const px = sx(o.x), py = sy(o.y), down = o.s.down;
      ctx.fillStyle = '#0a0810'; ctx.fillRect(px, py, TS, TS);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = down ? ['#5a5058', '#463e46', '#322c34', '#1e1a20'][k] : ['#3c3640', '#544c58', '#6c626e', '#847888'][k]; ctx.fillRect(px + 2, py + k * 12, TS - 4, 10); }
      ctx.fillStyle = 'rgba(255,220,150,' + (0.6 + 0.3 * Math.sin(t * 4)) + ')'; ctx.beginPath();
      const yy = py - 14 + Math.sin(t * 4) * 3; if (down) { ctx.moveTo(px + 16, yy); ctx.lineTo(px + 32, yy); ctx.lineTo(px + 24, yy + 10); } else { ctx.moveTo(px + 16, yy + 10); ctx.lineTo(px + 32, yy + 10); ctx.lineTo(px + 24, yy); } ctx.fill();
    } else if (o.k === 'heart') {
      const on = g.ended, ready = g.flags.cleared['z2.final'];
      ctx.save(); ctx.translate(x, y + 18); ctx.scale(1.5, 1.5); ctx.translate(-x, -(y + 18));
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x, y + 18, 34, 11, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3a2a2e'; ctx.fillRect(x - 30, y - 6, 60, 26); ctx.fillStyle = '#54383a'; ctx.fillRect(x - 30, y - 6, 60, 6);
      ctx.fillStyle = '#2a1c20'; ctx.beginPath(); ctx.moveTo(x - 24, y - 6); ctx.lineTo(x - 16, y - 64); ctx.lineTo(x + 16, y - 64); ctx.lineTo(x + 24, y - 6); ctx.fill();
      ctx.fillStyle = on ? '#fff2b0' : ready ? 'rgba(255,150,80,' + (0.5 + 0.3 * Math.sin(t * 3)) + ')' : '#150c12'; ctx.beginPath(); ctx.moveTo(x, y - 56); ctx.lineTo(x + 12, y - 36); ctx.lineTo(x, y - 14); ctx.lineTo(x - 12, y - 36); ctx.fill();
      if (on) flame(ctx, x, y - 30, 14, t);
      ctx.restore();
    }
  }

  // ------------------------------------------------------------ characters
  function eyes(ctx, x, y, a, d, s, col) {
    const ex = Math.cos(a) * d * 0.5, ey = Math.sin(a) * d * 0.3, nx = -Math.sin(a) * d, ny = Math.cos(a) * d * 0.5;
    ctx.fillStyle = col || EYE;
    ctx.beginPath(); ctx.ellipse(x + ex + nx, y + ey + ny, s, s * 1.25, 0, 0, TAU); ctx.ellipse(x + ex - nx, y + ey - ny, s, s * 1.25, 0, 0, TAU); ctx.fill();
  }
  function bodyCol(e) { return e.flash > 0 ? '#ffffff' : (e.state === 'wind' && Math.sin(e.t * 40) > 0.2) ? '#a03070' : INK; }
  function drawEnemy(ctx, e) {
    const t = R.time, x = sx(e.x), r = e.r * TS; let y = sy(e.y);
    if (e.state === 'spawn') { const f = e.t / e.T; ctx.globalAlpha = f; ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x, y + r * 0.3, r * (1.6 - f * 0.6), r * 0.5 * f + 3, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; if (f < 0.5) return; }
    const stun = e.stun > 0, col = bodyCol(e);
    let hop = 0;
    if (e.air) { const k = e.state === 'jump' ? Math.min(1, e.t / 0.3) : 1 - e.t / e.T; hop = k * 330; }
    ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.75, r * (e.air ? 0.6 + 0.5 * (1 - hop / 330) : 1), r * 0.36, 0, 0, TAU); ctx.fill();
    y -= hop;
    ctx.lineWidth = 2.5; ctx.strokeStyle = e.type === 'eater' && e.shroud ? '#120a26' : INK2;
    const fa = (e.state === 'wind' || e.state === 'atk') ? e.aim : e.face;
    if (e.type === 'blob' || e.type === 'brood') {
      let sq = 1 + Math.sin(e.wob * 6) * 0.07, st = 1;
      if (e.state === 'wind') { sq = 1 + 0.3 * (e.t / e.T); st = 1 - 0.3 * (e.t / e.T); } else if (e.state === 'atk') { sq = 0.8; st = 1.25; } else if (e.state === 'rec' && e.type === 'brood') { sq = 1.25; st = 0.7; }
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y + r * (1 - st) * 0.8, r * sq * 1.05, r * st * 0.95, 0, 0, TAU); ctx.fill(); ctx.stroke();
      if (e.type === 'brood') {
        ctx.fillStyle = '#e8e0d0'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * r * 0.3 - 6, y - r * st * 0.8); ctx.lineTo(x + k * r * 0.34, y - r * st * (1.15 + (k % 2 ? 0.1 : 0.3))); ctx.lineTo(x + k * r * 0.3 + 6, y - r * st * 0.8); ctx.fill(); }
        if (!stun) { eyes(ctx, x, y - r * 0.1, fa, r * 0.3, 6); eyes(ctx, x, y + r * 0.2, fa, r * 0.55, 3.5); }
      } else {
        // shadow-flame tuft
        const sw = Math.sin(e.wob * 5) * 3; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 6, y - r * st * 0.8); ctx.quadraticCurveTo(x - 2 + sw, y - r * st * 1.5, x + 3 + sw, y - r * st * 1.75); ctx.quadraticCurveTo(x + 4, y - r * st * 1.2, x + 7, y - r * st * 0.8); ctx.fill();
        if (!stun) eyes(ctx, x, y - 2, fa, r * 0.42, 3.5);
      }
    } else if (e.type === 'flit') {
      const fl = Math.sin(e.wob * 26) * 0.6; y -= 16 + Math.sin(e.wob * 4) * 3;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x - 24, y - 10 - fl * 12); ctx.lineTo(x - 14, y + 6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + 24, y - 10 - fl * 12); ctx.lineTo(x + 14, y + 6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r * 0.75, 0, TAU); ctx.fill(); ctx.stroke();
      if (!stun) { ctx.fillStyle = EYE; ctx.beginPath(); ctx.arc(x + Math.cos(fa) * 3, y + Math.sin(fa) * 2, 4, 0, TAU); ctx.fill(); }
    } else if (e.type === 'spitter') {
      const puff = e.state === 'wind' ? 1 + 0.35 * (e.t / e.T) : 1;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - r * 0.9, y + r * 0.7); ctx.quadraticCurveTo(x - r * 1.1 * puff, y - r * 0.6, x - r * 0.4, y - r * 1.3); ctx.lineTo(x + r * 0.4, y - r * 1.3); ctx.quadraticCurveTo(x + r * 1.1 * puff, y - r * 0.6, x + r * 0.9, y + r * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = e.state === 'wind' ? DANGER : '#b06bff'; ctx.beginPath(); ctx.ellipse(x, y - r * 1.3, r * 0.42, r * 0.2, 0, 0, TAU); ctx.fill();
      if (!stun) eyes(ctx, x, y - r * 0.4, fa, r * 0.4, 3);
    } else if (e.type === 'shell') {
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.9, 0, 0, TAU); ctx.fill(); ctx.stroke();
      if (!stun) eyes(ctx, x, y - 2, e.face, r * 0.3, 3);
      const guard = e.stun <= 0 && e.state !== 'rec';
      ctx.strokeStyle = guard ? '#f0e8d8' : '#8a8478'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.15, r * 1.0, 0, e.face - 1.15, e.face + 1.15); ctx.stroke();
      ctx.strokeStyle = guard ? '#b8ac98' : '#5e5a52'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, r * 1.15, r * 1.0, 0, e.face - 0.6, e.face + 0.6); ctx.stroke(); ctx.lineCap = 'butt';
    } else { // knight / eater
      const big = e.type === 'eater', hh = r * (big ? 2.5 : 2.1), scorch = e.state === 'scorch';
      const bc = e.flash > 0 ? '#fff' : scorch ? '#6a4a3a' : col;
      ctx.fillStyle = bc; ctx.beginPath(); ctx.moveTo(x - r * 1.05, y + r * 0.7); ctx.quadraticCurveTo(x - r * 0.9, y - hh * 0.5, x - r * 0.45, y - hh); ctx.lineTo(x + r * 0.45, y - hh); ctx.quadraticCurveTo(x + r * 0.9, y - hh * 0.5, x + r * 1.05, y + r * 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
      // mask
      ctx.fillStyle = '#efe6d6'; ctx.beginPath(); ctx.ellipse(x + Math.cos(fa) * 4, y - hh * 0.72, r * 0.42, r * 0.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = scorch ? '#ff7a2a' : '#1a1030'; ctx.fillRect(x + Math.cos(fa) * 6 - 7, y - hh * 0.76, 5, 3); ctx.fillRect(x + Math.cos(fa) * 6 + 3, y - hh * 0.76, 5, 3);
      ctx.fillStyle = '#efe6d6'; ctx.beginPath(); ctx.moveTo(x - r * 0.4, y - hh * 0.95); ctx.lineTo(x - r * 0.75, y - hh * 1.3); ctx.lineTo(x - r * 0.15, y - hh); ctx.moveTo(x + r * 0.4, y - hh * 0.95); ctx.lineTo(x + r * 0.75, y - hh * 1.3); ctx.lineTo(x + r * 0.15, y - hh); ctx.fill();
      // blade
      const ba = e.state === 'wind' ? fa - 1.6 + 0.6 * (e.t / e.T) : e.state === 'rec' ? fa + 1.3 : fa + 0.5;
      ctx.strokeStyle = e.state === 'wind' ? DANGER : '#9a90c8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + Math.cos(ba) * r * 0.8, y - r * 0.6 + Math.sin(ba) * r * 0.5); ctx.lineTo(x + Math.cos(ba) * r * 2.6, y - r * 0.6 + Math.sin(ba) * r * 1.9); ctx.stroke();
      if (big && e.shroud) { ctx.strokeStyle = 'rgba(20,10,50,0.8)'; ctx.lineWidth = 6; for (let k = 0; k < 5; k++) { const a = t * 1.5 + k * 1.256; ctx.beginPath(); ctx.arc(x, y - hh * 0.4, r * (1.5 + 0.15 * Math.sin(t * 3 + k)), a, a + 0.8); ctx.stroke(); } }
    }
    if (stun) { ctx.fillStyle = '#ffe27a'; for (let k = 0; k < 3; k++) { const a = t * 6 + k * 2.09; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.8, y - r * 1.3 + Math.sin(a) * 4, 3, 0, TAU); ctx.fill(); } }
    if (!e.d.boss && e.hp < e.maxhp) { const w = Math.max(30, r * 1.8); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - w / 2 - 1, y - r * (e.type === 'knight' ? 2.9 : 1.6) - 9, w + 2, 6); ctx.fillStyle = '#ff5a8e'; ctx.fillRect(x - w / 2, y - r * (e.type === 'knight' ? 2.9 : 1.6) - 8, w * Math.max(0, e.hp / e.maxhp), 4); }
  }
  function drawPlayer(ctx, g) {
    const p = g.p, t = R.time; let x = sx(p.x), y = sy(p.y);
    if (p.state === 'dead') { ctx.fillStyle = '#2f6f74'; ctx.beginPath(); ctx.ellipse(x, y + 8, 18, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffb347'; ctx.globalAlpha = Math.max(0, 1 - p.t); ctx.beginPath(); ctx.arc(x + 12, y + 6, 5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; return; }
    let sc = 1;
    if (p.state === 'fall') { sc = Math.max(0, 1 - p.t / 0.6); }
    if (p.inv > 0 && p.state !== 'roll' && Math.sin(t * 50) > 0) ctx.globalAlpha = 0.45;
    ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.beginPath(); ctx.ellipse(x, y + 12, 14 * sc, 6 * sc, 0, 0, TAU); ctx.fill();
    const bob = p.moving ? Math.abs(Math.sin(t * 13)) * 3 : Math.sin(t * 2.5) * 1;
    ctx.save(); ctx.translate(x, y - bob);
    if (p.state === 'roll') { ctx.rotate(p.t / 0.3 * TAU * (p.rdx >= 0 ? 1 : -1)); ctx.scale(0.85, 0.85); }
    ctx.scale(sc, sc);
    const fx = Math.cos(p.face), fy = Math.sin(p.face);
    // cloak
    ctx.fillStyle = '#2f8f8a'; ctx.strokeStyle = '#12403f'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-13, 12); ctx.quadraticCurveTo(-15, -8, -7, -18); ctx.lineTo(7, -18); ctx.quadraticCurveTo(15, -8, 13, 12); ctx.quadraticCurveTo(0, 17, -13, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3fb0a8'; ctx.beginPath(); ctx.moveTo(-4, 12); ctx.lineTo(-2, -8); ctx.lineTo(2, -8); ctx.lineTo(4, 12); ctx.fill();
    // hood + face
    ctx.fillStyle = '#2f8f8a'; ctx.beginPath(); ctx.arc(0, -20, 11, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, -29); ctx.lineTo(-fx * 6, -38); ctx.lineTo(6, -29); ctx.fill();
    if (fy > -0.6) { ctx.fillStyle = '#ffe6c8'; ctx.beginPath(); ctx.ellipse(fx * 4, -18.5, 7, 6.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2030'; ctx.fillRect(fx * 6 - 4, -20, 2.5, 4); ctx.fillRect(fx * 6 + 2, -20, 2.5, 4); }
    // lantern
    const lx = -fx * 4 + (fy >= 0 ? -13 : 13) * (Math.abs(fx) < 0.5 ? 1 : 0.6), ly = 3 + Math.sin(t * 6) * 1.5;
    ctx.fillStyle = '#5a4a2a'; ctx.fillRect(lx - 4, ly - 6, 8, 11); ctx.fillStyle = '#ffcf6b'; ctx.fillRect(lx - 2.5, ly - 4, 5, 7);
    ctx.restore();
    // weapon
    const w = g.weapon();
    if (p.state !== 'roll' && p.state !== 'fall') {
      let a = p.face + 0.9, len = w.id === 'spear' ? 44 : w.id === 'hammer' ? 34 : 30, ox = 0;
      if (p.state === 'attack') {
        const f = Math.min(1, p.t / (w.wu + 0.1));
        if (w.id === 'spear') { a = p.face; ox = -14 + f * 34; }
        else { const dir = p.combo % 2 ? 1 : -1; a = p.face + dir * (w.arc / 2) * (1 - 2 * f); }
      }
      const hx = x + Math.cos(a) * (10 + ox), hy = y - 8 - bob + Math.sin(a) * (7 + ox * 0.7), tx = x + Math.cos(a) * (10 + ox + len), ty = y - 8 - bob + Math.sin(a) * (7 + (ox + len) * 0.8);
      ctx.lineCap = 'round';
      if (w.id === 'hammer') { ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.fillStyle = '#9aa0b0'; ctx.strokeStyle = '#3a3e4a'; ctx.lineWidth = 2; ctx.save(); ctx.translate(tx, ty); ctx.rotate(a); ctx.fillRect(-7, -11, 14, 22); ctx.strokeRect(-7, -11, 14, 22); ctx.restore(); }
      else if (w.id === 'spear') { ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(hx - Math.cos(a) * 14, hy - Math.sin(a) * 10); ctx.lineTo(tx, ty); ctx.stroke(); ctx.strokeStyle = '#e8ecf4'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(a) * 12, ty + Math.sin(a) * 10); ctx.stroke(); }
      else { ctx.strokeStyle = '#e8ecf4'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.strokeStyle = '#e0b040'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(hx - Math.cos(a) * 3, hy - Math.sin(a) * 3); ctx.lineTo(hx + Math.cos(a) * 3, hy + Math.sin(a) * 3); ctx.stroke(); }
      ctx.lineCap = 'butt';
    }
    if (p.state === 'drink') { ctx.fillStyle = '#8dffb0'; ctx.beginPath(); ctx.arc(x + 10, y - 26, 5, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ emissive (drawn over darkness)
  function capsule(ctx, x, y, a, len, wd, alpha, col) {
    ctx.save(); ctx.translate(sx(x), sy(y)); ctx.rotate(a); ctx.globalAlpha = alpha; ctx.fillStyle = col || DANGER;
    const L = len * TS, w = wd * TS; ctx.beginPath(); ctx.moveTo(0, -w / 2); ctx.lineTo(L, -w / 2); ctx.arc(L, 0, w / 2, -Math.PI / 2, Math.PI / 2); ctx.lineTo(0, w / 2); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = Math.min(1, alpha * 2.2); ctx.strokeStyle = col || DANGER; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
  }
  function sector(ctx, x, y, a, rad, arc, alpha) {
    ctx.globalAlpha = alpha; ctx.fillStyle = DANGER; ctx.beginPath(); ctx.moveTo(sx(x), sy(y)); ctx.arc(sx(x), sy(y), rad * TS, a - arc / 2, a + arc / 2); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = Math.min(1, alpha * 2.2); ctx.strokeStyle = DANGER; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
  }
  function emissive(ctx, g) {
    const z = g.z, t = R.time;
    // telegraphs
    for (const e of z.enemies) {
      if (e.dead) continue;
      if (e.state === 'wind') {
        const f = e.t / e.T, al = 0.12 + 0.3 * f;
        if (e.type === 'blob') capsule(ctx, e.x, e.y, e.aim, 2.1, e.r * 2, al);
        else if (e.type === 'brood') capsule(ctx, e.x, e.y, e.aim, 3.1, e.r * 2, al);
        else if (e.type === 'flit') capsule(ctx, e.x, e.y, e.aim, 4.8, 0.5, al);
        else if (e.type === 'shell') capsule(ctx, e.x, e.y, e.aim, 7.6, 0.95, al);
        else if (e.type === 'knight') { if (e.atk === 'sweep') sector(ctx, e.x, e.y, e.aim, 2.4 + 0.3, 2.9, al); else capsule(ctx, e.x, e.y, e.aim, 4.3, 1.1, al); }
        else if (e.type === 'eater') { if (e.atk === 'sweep') sector(ctx, e.x, e.y, e.aim, 2.9 + 0.3, 3.0, al); else if (e.atk === 'dash') capsule(ctx, e.x, e.y, e.aim, 4.8, 1.9, al); else { ctx.strokeStyle = DANGER; ctx.lineWidth = 3; ctx.globalAlpha = 0.5 + 0.5 * f; ctx.beginPath(); ctx.arc(sx(e.x), sy(e.y), (1.6 - f) * TS, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; } }
        else if (e.type === 'spitter') { ctx.fillStyle = DANGER; ctx.globalAlpha = f; ctx.beginPath(); ctx.arc(sx(e.x), sy(e.y) - e.r * TS * 1.4, 4 + f * 5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      } else if (e.state === 'atk' && e.type === 'shell') capsule(ctx, e.x, e.y, e.aim, 1.2, 0.95, 0.4);
      else if (e.state === 'jump' || e.state === 'fallw') {
        const f = e.state === 'fallw' ? e.t / e.T : 0;
        ctx.strokeStyle = DANGER; ctx.lineWidth = 3; ctx.globalAlpha = 0.4 + 0.5 * f; ctx.beginPath(); ctx.ellipse(sx(e.x), sy(e.y), (e.r + 0.7) * TS, (e.r + 0.7) * TS * 0.8, 0, 0, TAU); ctx.stroke();
        ctx.fillStyle = DANGER; ctx.globalAlpha = 0.15 + 0.35 * f; ctx.fill(); ctx.globalAlpha = 1;
      } else if (e.state === 'roar') { ctx.strokeStyle = DANGER; ctx.lineWidth = 4; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(sx(e.x), sy(e.y), (0.5 + e.t / e.T) * TS, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
      // eyes glow in the dark
      if (!e.air && e.state !== 'spawn' && e.stun <= 0) {
        ctx.globalCompositeOperation = 'lighter'; const fa = (e.state === 'wind' || e.state === 'atk') ? e.aim : e.face, r = e.r * TS;
        const yy = sy(e.y) - (e.type === 'flit' ? 16 : e.type === 'knight' ? r * 1.5 : e.type === 'eater' ? r * 1.8 : 2), wind = e.state === 'wind';
        ctx.globalAlpha = 0.55; eyes(ctx, sx(e.x), yy, fa, r * (e.type === 'flit' ? 0.05 : 0.4), wind ? 4.5 : 3, wind ? DANGER : EYE); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
    }
    for (const l of z.lobs) {
      const f = l.t / l.T, x = sx(l.tx), y = sy(l.ty), rr = l.r * TS;
      ctx.strokeStyle = DANGER; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.86, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = DANGER; ctx.globalAlpha = 0.14 + 0.3 * f; ctx.beginPath(); ctx.ellipse(x, y, rr * f, rr * 0.86 * f, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      const bx = sx(l.x0 + (l.tx - l.x0) * f), by = sy(l.y0 + (l.ty - l.y0) * f) - Math.sin(f * Math.PI) * 120;
      ctx.fillStyle = '#b06bff'; ctx.beginPath(); ctx.arc(bx, by, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8d0ff'; ctx.beginPath(); ctx.arc(bx - 2, by - 2, 4, 0, TAU); ctx.fill();
    }
    for (const r of z.rings) { ctx.strokeStyle = DANGER; ctx.lineWidth = 12; ctx.globalAlpha = 0.55 * Math.min(1, (r.maxR - r.rad) / 1.5 + 0.2); ctx.beginPath(); ctx.ellipse(sx(r.x), sy(r.y), r.rad * TS, r.rad * TS, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#ffd0e0'; ctx.lineWidth = 3; ctx.stroke(); ctx.globalAlpha = 1; }
    for (const s of z.shots) { ctx.fillStyle = DANGER; ctx.beginPath(); ctx.arc(sx(s.x), sy(s.y), s.r * TS + 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffe0ec'; ctx.beginPath(); ctx.arc(sx(s.x), sy(s.y), s.r * TS * 0.5, 0, TAU); ctx.fill(); }
    for (const o of z.objs) if (o.k === 'brazier' && o.snuff > 0) { ctx.strokeStyle = '#7a4bd0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(sx(o.cx), sy(o.cy) - 6, 26, -Math.PI / 2, -Math.PI / 2 + TAU * (o.snuff / 1.3)); ctx.stroke(); }
    // warm wash around fire (soft-light keeps the floor texture)
    ctx.globalCompositeOperation = 'soft-light';
    for (const o of z.objs) {
      if (!((o.k === 'brazier' || o.k === 'lamp') && o.lit)) continue;
      const px = sx(o.cx), py = sy(o.cy), rr = (o.k === 'lamp' ? 9 : 6) * TS; if (px < -rr || py < -rr || px > W + rr || py > H + rr) continue;
      const gr = ctx.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, 'rgba(255,170,70,0.75)'); gr.addColorStop(0.6, 'rgba(255,150,60,0.3)'); gr.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = gr; ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
    }
    { const px = sx(g.p.x), py = sy(g.p.y), rr = 4.5 * TS, gr = ctx.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, 'rgba(255,180,90,0.5)'); gr.addColorStop(1, 'rgba(255,160,70,0)'); ctx.fillStyle = gr; ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
    // additive glows
    ctx.globalCompositeOperation = 'lighter';
    function glow(x, y, r, col, a) { const px = sx(x), py = sy(y), rr = r * TS; if (px < -rr || py < -rr || px > W + rr || py > H + rr) return; const gr = ctx.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = a; ctx.fillStyle = gr; ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2); ctx.globalAlpha = 1; }
    for (const o of z.objs) {
      if (o.k === 'brazier' && o.lit) glow(o.cx, o.cy - 0.3, 2.6, 'rgba(255,150,60,0.5)', 0.5 + 0.06 * Math.sin(t * 10 + o.x));
      else if (o.k === 'lamp' && o.lit) glow(o.cx, o.cy - 1.2, 4.5, 'rgba(255,190,100,0.6)', 0.55);
      else if (o.k === 'lamp') glow(o.cx, o.cy - 1.5, 1.6, 'rgba(120,170,255,0.5)', 0.45 + 0.25 * Math.sin(t * 2.5));
      else if (o.k === 'brazier' && !o.lit) glow(o.cx, o.cy - 0.1, 0.7, 'rgba(120,170,255,0.4)', 0.3 + 0.2 * Math.sin(t * 3 + o.x));
      else if (o.k === 'chest' && !o.open && !o.hidden) glow(o.cx, o.cy, 0.9, 'rgba(255,220,120,0.5)', 0.3 + 0.2 * Math.sin(t * 3));
    }
    const p = g.p; if (p.state !== 'dead') glow(p.x, p.y, 1.5, 'rgba(255,170,80,0.35)', 0.5);
    for (const f of z.fires) { glow(f.x, f.y, 0.8, 'rgba(255,140,50,0.8)', Math.min(1, f.life)); }
    for (const q of z.picks) {
      const x = sx(q.x), y = sy(q.y) - 6 - Math.abs(Math.sin(q.t * 6)) * 3;
      if (q.k === 'xp') { ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = '#5ad8ff'; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 4, y); ctx.fill(); ctx.fillStyle = '#d0f6ff'; ctx.fillRect(x - 1, y - 3, 2, 3); }
    }
    for (const r of R.rings) { const f = 1 - r.life / r.max0, rad = (r.r + (r.max - r.r) * f) * TS; ctx.globalAlpha = (1 - f) * 0.8; if (r.fill) { ctx.fillStyle = r.col; ctx.globalAlpha = (1 - f) * 0.35; ctx.beginPath(); ctx.arc(sx(r.x), sy(r.y), rad, 0, TAU); ctx.fill(); ctx.globalAlpha = (1 - f) * 0.8; } ctx.strokeStyle = r.col; ctx.lineWidth = 5 * (1 - f) + 1; ctx.beginPath(); ctx.arc(sx(r.x), sy(r.y), rad, 0, TAU); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // slashes
    for (const s of R.slashes) {
      const w = EMB.WEAPONS[s.w], f = s.t / 0.2, x = sx(s.x), y = sy(s.y) - 8, rad = w.range * TS;
      ctx.globalAlpha = (1 - f) * 0.9;
      if (s.w === 'spear') { ctx.strokeStyle = '#fff2c8'; ctx.lineWidth = 9 * (1 - f) + 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + Math.cos(s.a) * 18, y + Math.sin(s.a) * 18); ctx.lineTo(x + Math.cos(s.a) * rad, y + Math.sin(s.a) * rad); ctx.stroke(); ctx.lineCap = 'butt'; }
      else {
        const col = s.w === 'hammer' ? '#ffd27a' : s.fin ? '#ffe9a8' : '#eaf6ff';
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, rad, s.a - w.arc / 2, s.a + w.arc / 2); ctx.arc(x - Math.cos(s.a) * rad * 0.22, y - Math.sin(s.a) * rad * 0.22, rad * (0.84 + f * 0.1), s.a + w.arc / 2 * 0.92, s.a - w.arc / 2 * 0.92, true); ctx.closePath(); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (const q of R.P) { if (!q.add) continue; const f = q.life / q.max; ctx.globalAlpha = Math.min(1, f * 1.6); ctx.fillStyle = q.col; const s = q.size * (0.4 + f * 0.6); ctx.fillRect(sx(q.x) - s / 2, sy(q.y) - s / 2, s, s); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // numbers
    ctx.textAlign = 'center';
    for (const n of R.nums) {
      const f = n.t / 0.9, x = sx(n.x), y = sy(n.y) - 30 * (1 - Math.pow(1 - f, 3)), sc = n.t < 0.08 ? 1.5 - n.t * 6 : 1;
      ctx.globalAlpha = f > 0.7 ? (1 - f) / 0.3 : 1; ctx.font = '900 ' + Math.round((n.big ? 26 : 20) * sc) + 'px "Segoe UI","Yu Gothic UI",sans-serif';
      const s = n.text || String(Math.abs(n.n)); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,6,20,0.85)'; ctx.strokeText(s, x, y); ctx.fillStyle = n.col; ctx.fillText(s, x, y);
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ frame
  R.draw = function (ctx, g) {
    const z = g.z;
    ctx.save();
    if (R.shake > 0.3) ctx.translate((Math.random() - 0.5) * R.shake, (Math.random() - 0.5) * R.shake);
    drawTiles(ctx, g);
    // non-additive particles under entities (debris)
    const list = [];
    for (const o of z.objs) if (Math.abs(o.cx - R.cam.x) < 16 && Math.abs(o.cy - R.cam.y) < 11) list.push({ y: o.k === 'stairs' ? -1e9 : o.cy, o: o });
    for (const e of z.enemies) if (!e.dead && Math.abs(e.x - R.cam.x) < 17 && Math.abs(e.y - R.cam.y) < 12) list.push({ y: e.y, e: e });
    list.push({ y: g.p.y, p: 1 });
    list.sort((a, b) => a.y - b.y);
    for (const f of z.fires) { ctx.globalAlpha = Math.min(1, f.life); flame(ctx, sx(f.x), sy(f.y) + 6, 7, R.time + f.x * 3); ctx.globalAlpha = 1; }
    for (const it of list) { if (it.o) drawObj(ctx, it.o, g); else if (it.e) drawEnemy(ctx, it.e); else drawPlayer(ctx, g); }
    for (const q of R.P) { if (q.add) continue; const f = q.life / q.max; ctx.globalAlpha = Math.min(1, f * 1.5); ctx.fillStyle = q.col; const s = q.size * (0.5 + f * 0.5); ctx.fillRect(sx(q.x) - s / 2, sy(q.y) - s / 2, s, s); }
    ctx.globalAlpha = 1;
    lightPass(ctx, g);
    emissive(ctx, g);
    ctx.restore();
    if (R.tint > 0.02) { ctx.fillStyle = 'rgba(255,210,130,' + Math.min(0.5, R.tint * 0.5) + ')'; ctx.fillRect(0, 0, W, H); }
    if (R.hurtFlash > 0.02) { const gr = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8); gr.addColorStop(0, 'rgba(255,40,80,0)'); gr.addColorStop(1, 'rgba(255,40,80,' + R.hurtFlash * 0.4 + ')'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
    const p = g.p, low = p.hp / g.maxhp();
    if (low < 0.3 && p.state !== 'dead') { const gr = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85); gr.addColorStop(0, 'rgba(255,40,80,0)'); gr.addColorStop(1, 'rgba(255,40,80,' + (0.18 + 0.1 * Math.sin(R.time * 6)) + ')'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  };
  R.sx = sx; R.sy = sy; R.flame = flame;
})();
