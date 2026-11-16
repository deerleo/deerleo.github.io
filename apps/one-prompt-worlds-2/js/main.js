'use strict';
(() => {
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const VW = 1280, VH = 720, S = 5, JX = 220, JY = 118, JW = W * S, JH = H * S;
  const FONT = '"Zen Maru Gothic","Hiragino Maru Gothic ProN","BIZ UDPGothic","Yu Gothic UI","Meiryo",sans-serif';
  let K = 1;
  function resize() {
    const dpr = window.devicePixelRatio || 1, sc = Math.min(innerWidth / VW, innerHeight / VH);
    cv.style.width = Math.floor(VW * sc) + 'px'; cv.style.height = Math.floor(VH * sc) + 'px';
    cv.width = Math.round(VW * sc * dpr); cv.height = Math.round(VH * sc * dpr); K = cv.width / VW;
  }
  addEventListener('resize', resize); resize();

  // ---------- セーブ ----------
  const KEY = 'hitotsubu-teien.v1';
  let save = { done: [], disc: {}, thumbs: {}, ended: false, muted: false };
  try { Object.assign(save, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { } }
  Sound.setMuted(!!save.muted);

  // ---------- 粒の描画 ----------
  const C = (r, g, b, a = 255) => (a << 24 | b << 16 | g << 8 | r) >>> 0;
  const SANDC = [C(232, 205, 146), C(222, 192, 130), C(240, 216, 160), C(210, 180, 120)];
  const PLANTC = [C(64, 150, 78), C(78, 170, 88), C(54, 128, 70), C(92, 184, 96)];
  const RICHC = [C(120, 180, 70), C(140, 196, 80), C(104, 160, 60), C(156, 206, 90)];
  const BRAMC = [C(116, 82, 56), C(92, 62, 44), C(138, 100, 64), C(74, 50, 38)];
  const ASHC = [C(150, 150, 158), C(128, 128, 138), C(170, 170, 176), C(110, 110, 122)];
  const WATC = [C(58, 140, 214, 205), C(64, 150, 222, 205), C(52, 130, 206, 205), C(70, 158, 226, 205)];
  const cellCv = document.createElement('canvas'); cellCv.width = W; cellCv.height = H;
  const cellCtx = cellCv.getContext('2d'), cellImg = cellCtx.createImageData(W, H), cell32 = new Uint32Array(cellImg.data.buffer);
  const lightCv = document.createElement('canvas'); lightCv.width = W; lightCv.height = H;
  const lightCtx = lightCv.getContext('2d'), lightImg = lightCtx.createImageData(W, H), light32 = new Uint32Array(lightImg.data.buffer);

  function renderCells(sim, fr) {
    const g = sim.g, a = sim.a, d = sim.d, n = W * H, sh = (fr >> 2) * 37;
    for (let p = 0; p < n; p++) {
      const t = g[p]; let c = 0, l = 0; const nz = NOISE[p];
      switch (t) {
        case ROCK: c = sim.rock[p]; break;
        case SAND: c = SANDC[nz & 3]; break;
        case WATER: {
          const up = p >= W ? g[p - W] : EMPTY;
          if (up === EMPTY || up === STEAM || up === FLAME) c = C(170, 226, 250, 235);
          else c = (NOISE[(p + sh) % n] & 15) === 0 ? C(110, 190, 240, 215) : WATC[nz & 3];
          break;
        }
        case SEED: c = (nz & 1) ? C(214, 178, 120) : C(190, 150, 96); break;
        case PLANT: {
          const av = a[p];
          if (av & 4) { c = C(255, 160, 200); l = C(255, 150, 200, 120); }
          else if (av & 1) c = C(132, 222, 128);
          else c = (av & 2 ? RICHC : PLANTC)[(nz + d[p]) & 3];
          break;
        }
        case FLAME: { const life = a[p]; c = life > 9 ? C(255, 244, 170) : life > 4 ? C(255, 176, 64) : C(232, 84, 40, 220); l = C(255, 150, 60, 255); break; }
        case BURN: c = ((nz + fr) & 3) < 2 ? C(255, 208, 90) : C(255, 120, 40); l = C(255, 140, 50, 255); break;
        case EMBER: c = ((nz + (fr >> 1)) & 3) ? C(255, 120, 50) : C(255, 200, 100); l = C(255, 110, 40, 255); break;
        case ASH: c = ASHC[nz & 3]; break;
        case STEAM: c = C(236, 244, 252, 90 + (nz & 63)); break;
        case BRAMBLE: c = BRAMC[(nz + ((p % W) >> 1) + ((p / W) | 0)) & 3]; break;
        case ICE: c = nz < 36 ? C(240, 252, 255, 245) : (nz & 1 ? C(176, 222, 246, 235) : C(160, 212, 242, 235)); break;
        case BUD: { const b = sim.buds[d[p]]; if (b.done) { c = C(255, 190, 220); l = C(255, 170, 210, 200); } else c = C(70, 140, 90); break; }
        case LANTERN: { const L = sim.lanterns[d[p]]; if (L.lit) { c = C(255, 214, 120); l = C(255, 190, 90, 255); } else c = C(84, 78, 110); break; }
      }
      cell32[p] = c; light32[p] = l;
    }
    // つるの葉（見た目だけ。空いた隣のマスに描く）
    for (let p = W; p < n - W; p++) {
      if (g[p] !== PLANT) continue;
      const h = (NOISE[p] + d[p] * 7) & 15;
      if (h > 3) continue;
      const q = p + ((h & 1) ? 1 : -1);
      if (g[q] === EMPTY) { cell32[q] = (a[p] & 2) ? C(150, 200, 84, 235) : C(96, 190, 104, 235); if (h < 2 && g[q - W] === EMPTY) cell32[q - W] = C(70, 160, 86, 200); }
    }
    cellCtx.putImageData(cellImg, 0, 0); lightCtx.putImageData(lightImg, 0, 0);
  }

  // ---------- 状態 ----------
  let mode = 'shelf';
  let sim = null, stageIdx = 0, tool = 'water', pouring = false, cursorX = W >> 1, cursorIn = false;
  let frame = 0, winT = -1, outT = 0, hintOpen = false, journalOpen = false, endingOpen = false, introT = 0;
  let everPoured = false, toasts = [], parts = [], buttons = [], mouse = { x: 0, y: 0 }, shake = 0;
  const thumbs = [];
  const TOOLINFO = {
    sand: { name: 'すな', col: '#e8cd92' }, water: { name: 'みず', col: '#5fb4ea' },
    seed: { name: 'たね', col: '#c9a26b' }, ember: { name: 'ひだね', col: '#ff7a3c' },
  };
  const TOOLORDER = ['sand', 'water', 'seed', 'ember'];
  const stageTools = () => TOOLORDER.filter(k => k in sim.stage.tools);
  const unlocked = (i) => i === 0 || (i === 9 ? !!save.done[8] : !!save.done[i - 1]);

  function makeThumb(i) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; thumbs[i] = c;
    const cx = c.getContext('2d');
    if (save.thumbs[i]) { const im = new Image(); im.onload = () => { cx.clearRect(0, 0, W, H); cx.drawImage(im, 0, 0); }; im.src = save.thumbs[i]; }
    else { const s = new Sim().load(STAGES[i]); renderCells(s, 0); cx.drawImage(cellCv, 0, 0); }
  }
  for (let i = 0; i < STAGES.length; i++) makeThumb(i);

  function startStage(i) {
    stageIdx = i; sim = new Sim().load(STAGES[i]);
    const ts = stageTools(); tool = ts.includes('water') ? 'water' : ts[0];
    mode = 'play'; winT = -1; outT = 0; hintOpen = false; pouring = false; parts = []; toasts = []; introT = 0;
  }
  function leaveStage() {
    if (sim) {
      renderCells(sim, frame);
      const cx = thumbs[stageIdx].getContext('2d'); cx.clearRect(0, 0, W, H); cx.drawImage(cellCv, 0, 0);
      if (save.done[stageIdx] && sim.won) { try { save.thumbs[stageIdx] = cellCv.toDataURL(); } catch (e) { } persist(); }
      else if (!save.thumbs[stageIdx]) makeThumb(stageIdx);
    }
    mode = 'shelf'; pouring = false; parts = [];
    if (!save.ended && [0, 1, 2, 3, 4, 5, 6, 7, 8].every(i => save.done[i])) { endingOpen = true; save.ended = true; persist(); Sound.win(); }
  }
  function toast(title, sub) { toasts.push({ title, sub, t: 0 }); }
  const sx = (x) => JX + (x + 0.5) * S, sy = (y) => JY + (y + 0.5) * S;
  function spark(x, y, n, col, sp = 2.2, life = 60) {
    for (let i = 0; i < n; i++) { const an = Math.random() * 6.283, v = Math.random() * sp; parts.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 0.6, life: life * (0.5 + Math.random()), max: life, col, size: 1.5 + Math.random() * 2.5, g: 0.01 }); }
  }
  function handleEvents() {
    for (const ev of sim.events) {
      switch (ev[0]) {
        case 'disc': if (!save.disc[ev[1]]) { save.disc[ev[1]] = 1; persist(); const D = DISCOVERIES.find(d => d.id === ev[1]); toast(D.name, D.formula); Sound.disc(); } break;
        case 'sprout': Sound.sprout(); spark(sx(ev[1]), sy(ev[2]), 8, '180,255,160', 1.6, 40); break;
        case 'feed': Sound.feed(ev[1].water); spark(sx(ev[1].x), sy(ev[1].y), 2, '170,230,255', 1.2, 30); break;
        case 'bloom': Sound.bloom(); spark(sx(ev[1].x), sy(ev[1].y), 46, '255,200,230', 3.4, 90); spark(sx(ev[1].x), sy(ev[1].y), 20, '255,240,170', 2, 70); break;
        case 'lit': Sound.lit(); spark(sx(ev[1].x), sy(ev[1].y), 40, '255,200,110', 3, 80); break;
        case 'win': winT = 0; save.done[stageIdx] = true; persist(); Sound.win(); break;
      }
    }
    sim.events.length = 0;
  }
  function tickSim() {
    let poured = 0;
    if (pouring && !journalOpen) {
      poured = sim.pour(tool, cursorX); if (poured) everPoured = true;
      if (!(sim.budget[tool] > 0) && !poured) { if (frame % 20 === 0) { Sound.empty(); shake = 10; } }
    }
    sim.step(); handleEvents();
    Sound.frame(tool, poured > 0 || (pouring && sim.budget[tool] > 0), sim.cnt);
    const c = sim.cnt; c.grow = c.hiss = c.drip = c.melt = 0; c.growDepth = 0;
    if (winT >= 0) winT++;
    let out = false; for (const k in sim.budget) if (sim.budget0[k] !== Infinity && sim.budget[k] <= 0) out = true;
    outT = out && !sim.won ? outT + 1 : 0;
  }

  // ---------- 描画ヘルパ ----------
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function text(s, x, y, size, col, align = 'left', weight = 600) { ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
  function wrap(s, x, y, maxW, size, col, lh, align = 'left') {
    ctx.font = `600 ${size}px ${FONT}`; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle';
    let line = '', yy = y;
    for (const ch of s) { if (ctx.measureText(line + ch).width > maxW && line) { ctx.fillText(line, x, yy); yy += lh; line = ch; } else line += ch; }
    if (line) ctx.fillText(line, x, yy); return yy + lh;
  }
  function button(x, y, w, h, label, fn, o = {}) {
    const hov = mouse.x >= x && mouse.x <= x + w && mouse.y >= y && mouse.y <= y + h;
    rr(x, y, w, h, Math.min(14, h / 2));
    ctx.fillStyle = o.primary ? (hov ? '#ffd98a' : '#f2c46a') : (hov ? 'rgba(150,180,255,0.30)' : 'rgba(120,150,230,0.16)'); ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = o.pulse ? `rgba(255,220,140,${0.5 + 0.5 * Math.sin(frame * 0.15)})` : 'rgba(190,210,255,0.35)'; ctx.stroke();
    text(label, x + w / 2, y + h / 2 + 1, o.size || 16, o.primary ? '#3a2a10' : '#e6ecff', 'center');
    buttons.push({ x, y, w, h, fn });
  }
  const stars = []; { const r = mulberry32(5); for (let i = 0; i < 90; i++) stars.push([r() * VW, r() * 420, r() * 1.4 + 0.4, r() * 6.28]); }
  function drawBG(moonX, moonY, moonR) {
    const gr = ctx.createLinearGradient(0, 0, 0, VH); gr.addColorStop(0, '#0d1230'); gr.addColorStop(0.6, '#161c40'); gr.addColorStop(1, '#1d1b3a');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
    for (const s of stars) { ctx.globalAlpha = 0.35 + 0.3 * Math.sin(frame * 0.02 + s[3]); ctx.fillStyle = '#dfe8ff'; ctx.beginPath(); ctx.arc(s[0], s[1], s[2], 0, 6.3); ctx.fill(); }
    ctx.globalAlpha = 1;
    const mg = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 5); mg.addColorStop(0, 'rgba(200,215,255,0.28)'); mg.addColorStop(1, 'rgba(200,215,255,0)');
    ctx.fillStyle = mg; ctx.fillRect(moonX - moonR * 5, moonY - moonR * 5, moonR * 10, moonR * 10);
    ctx.fillStyle = '#eef2ff'; ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, 6.3); ctx.fill();
    ctx.fillStyle = 'rgba(180,195,235,0.5)'; ctx.beginPath(); ctx.arc(moonX - moonR * 0.3, moonY - moonR * 0.2, moonR * 0.18, 0, 6.3); ctx.arc(moonX + moonR * 0.25, moonY + moonR * 0.3, moonR * 0.25, 0, 6.3); ctx.fill();
  }
  function wood(x, y, w, h) {
    const gr = ctx.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#7a563d'); gr.addColorStop(0.15, '#5e4130'); gr.addColorStop(1, '#3a2820');
    ctx.fillStyle = gr; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(255,220,180,0.18)'; ctx.fillRect(x, y, w, 2);
  }
  function drawParts() {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.life--; if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.fly) { p.vx += (Math.random() - 0.5) * 0.12; p.vy += (Math.random() - 0.5) * 0.12 - 0.002; p.vx *= 0.97; p.vy *= 0.97; if (p.x < JX + 10 || p.x > JX + JW - 10) p.vx *= -1; if (p.y < 40) p.vy += 0.05; }
      else { p.vy += p.g; p.vx *= 0.98; p.vy *= 0.98; }
      p.x += p.vx; p.y += p.vy;
      const al = p.fly ? (0.5 + 0.5 * Math.sin(p.life * 0.12 + p.size * 9)) * Math.min(1, p.life / 40) : p.life / p.max;
      ctx.fillStyle = `rgba(${p.col},${al.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.3); ctx.fill();
      if (p.fly) { ctx.fillStyle = `rgba(${p.col},${(al * 0.25).toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 4, 0, 6.3); ctx.fill(); }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  function glow(x, y, r, col, al) {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${al})`); gr.addColorStop(1, `rgba(${col},0)`);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.globalCompositeOperation = 'source-over';
  }
  function drawBud(b) {
    const x = sx(b.x), y = sy(b.y), ang = { up: 0, down: Math.PI, right: Math.PI / 2, left: -Math.PI / 2 }[b.dir];
    const f = Math.min(1, b.water / b.need);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.sin(frame * 0.03 + b.x) * 0.06); ctx.scale(1.3, 1.3);
    ctx.strokeStyle = '#3c8a58'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(0, 4); ctx.stroke();
    ctx.fillStyle = '#4c9c62'; ctx.beginPath(); ctx.ellipse(-7, 11, 7, 3, -0.5, 0, 6.3); ctx.ellipse(7, 11, 7, 3, 0.5, 0, 6.3); ctx.fill();
    if (!b.done) {
      const w = 8 + f * 4, h = 13 + f * 3;
      ctx.fillStyle = `rgb(${104 + f * 130 | 0},${190 + f * 30 | 0},${128 + f * 70 | 0})`;
      ctx.beginPath(); ctx.moveTo(0, -h); ctx.bezierCurveTo(w * 1.2, -h * 0.3, w, 8, 0, 9); ctx.bezierCurveTo(-w, 8, -w * 1.2, -h * 0.3, 0, -h); ctx.fill();
      ctx.strokeStyle = 'rgba(20,60,40,0.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -h + 2); ctx.quadraticCurveTo(w * 0.4, 0, 0, 8); ctx.stroke();
      ctx.fillStyle = '#ffb8d6'; ctx.beginPath(); ctx.ellipse(0, -h + 3, 2.6, 3.6, 0, 0, 6.3); ctx.fill();
      ctx.restore();
      // 水のたまり具合
      if (b.water > 0) { ctx.strokeStyle = 'rgba(150,220,255,0.9)'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, 24, -Math.PI / 2, -Math.PI / 2 + f * 6.283); ctx.stroke(); }
      else { ctx.strokeStyle = `rgba(150,220,255,${0.3 + 0.2 * Math.sin(frame * 0.06)})`; ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(x, y, 24, frame * 0.01, frame * 0.01 + 6.3); ctx.stroke(); ctx.setLineDash([]); }
    } else {
      const age = (sim.tick - b.t) / 50, o = age >= 1 ? 1 : Math.max(0.05, 1 + 2.2 * Math.pow(age - 1, 3) + 1.2 * Math.pow(age - 1, 2));
      for (let i = 0; i < 6; i++) {
        ctx.save(); ctx.rotate(i * Math.PI / 3 + 0.2); ctx.translate(0, -9 * o);
        ctx.fillStyle = i & 1 ? '#ffc4dd' : '#ffa8cc'; ctx.beginPath(); ctx.ellipse(0, 0, 6 * o, 11 * o, 0, 0, 6.3); ctx.fill(); ctx.restore();
      }
      ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.arc(0, 0, 5 * o, 0, 6.3); ctx.fill();
      ctx.restore();
      glow(x, y, 70 + Math.sin(frame * 0.05 + b.x) * 6, '255,190,220', 0.35);
    }
  }
  function drawLantern(l) {
    const x = sx(l.x), y = sy(l.y) - 2;
    ctx.strokeStyle = '#2c2840'; ctx.lineWidth = 2.5; ctx.beginPath();
    if (l.hang) { ctx.moveTo(x, y - 16); ctx.lineTo(x, y - 11); } else { ctx.moveTo(x - 6, y + 12); ctx.lineTo(x + 6, y + 12); }
    ctx.stroke();
    rr(x - 8, y - 11, 16, 22, 5); ctx.fillStyle = l.lit ? '#ffdc8c' : '#57507a'; ctx.fill();
    ctx.strokeStyle = l.lit ? 'rgba(200,120,40,0.6)' : 'rgba(30,26,50,0.7)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = -1; i <= 1; i++) { ctx.moveTo(x - 8, y + i * 5.5); ctx.lineTo(x + 8, y + i * 5.5); } ctx.stroke();
    ctx.fillStyle = '#2c2840'; ctx.fillRect(x - 6, y - 13, 12, 3); ctx.fillRect(x - 6, y + 10, 12, 3);
    if (l.lit) glow(x, y, 86 + Math.sin(frame * 0.3) * 5 + Math.sin(frame * 0.11) * 5, '255,180,90', 0.5);
    else { ctx.strokeStyle = `rgba(255,190,110,${0.3 + 0.2 * Math.sin(frame * 0.06)})`; ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(x, y, 24, frame * 0.01, frame * 0.01 + 6.3); ctx.stroke(); ctx.setLineDash([]); }
  }
  function jarPath(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h - r); ctx.arcTo(x, y + h, x + r, y + h, r); ctx.lineTo(x + w - r, y + h); ctx.arcTo(x + w, y + h, x + w, y + h - r, r); ctx.lineTo(x + w, y); }

  // ---------- びんの画面 ----------
  function drawPlay() {
    drawBG(1010, 62, 26);
    wood(0, 690, VW, 30);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(JX + JW / 2, 694, JW / 2 + 30, 9, 0, 0, 6.3); ctx.fill();
    // びんの中
    jarPath(JX, JY, JW, JH, 45); ctx.closePath();
    const jg = ctx.createLinearGradient(0, JY, 0, JY + JH); jg.addColorStop(0, 'rgba(34,48,98,0.55)'); jg.addColorStop(1, 'rgba(14,20,48,0.8)'); ctx.fillStyle = jg; ctx.fill();
    renderCells(sim, frame);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(cellCv, JX, JY, JW, JH);
    ctx.imageSmoothingEnabled = true;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.filter = 'blur(9px)'; ctx.globalAlpha = 0.9; ctx.drawImage(lightCv, JX, JY, JW, JH); ctx.restore();
    for (const b of sim.buds) drawBud(b);
    for (const l of sim.lanterns) drawLantern(l);
    drawParts();
    // ガラス
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    jarPath(JX - 4, JY - 14, JW + 8, JH + 18, 50); ctx.strokeStyle = 'rgba(170,215,255,0.5)'; ctx.lineWidth = 7; ctx.stroke();
    jarPath(JX - 4, JY - 14, JW + 8, JH + 18, 50); ctx.strokeStyle = 'rgba(235,248,255,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = 'rgba(200,230,255,0.75)'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(JX - 16, JY - 16); ctx.lineTo(JX - 2, JY - 16); ctx.moveTo(JX + JW + 2, JY - 16); ctx.lineTo(JX + JW + 16, JY - 16); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(JX + 22, JY + 40); ctx.lineTo(JX + 22, JY + JH - 120); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(JX + JW - 18, JY + 90); ctx.lineTo(JX + JW - 18, JY + 260); ctx.stroke();

    // 注ぎ口とガイド
    const overlay = journalOpen;
    if (cursorIn && !overlay) {
      const x = sx(cursorX), col = TOOLINFO[tool].col, have = sim.budget[tool] > 0;
      let ly = 1; while (ly < H - 1 && sim.g[ly * W + cursorX] === EMPTY) ly++;
      ctx.setLineDash([3, 7]); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, JY + 4); ctx.lineTo(x, JY + ly * S); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(x + 16, JY - 40 + (pouring ? 3 : 0) + Math.sin(frame * 0.08) * 1.5); ctx.rotate(pouring ? -2.2 : -1.9);
      rr(-22, -11, 40, 22, 9); ctx.fillStyle = 'rgba(200,230,255,0.22)'; ctx.fill(); ctx.strokeStyle = 'rgba(220,240,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
      if (have) { rr(-4, -8, 19, 16, 6); ctx.fillStyle = col; ctx.fill(); }
      ctx.fillStyle = '#8a6244'; ctx.fillRect(-27, -8, 6, 16);
      ctx.restore();
      ctx.fillStyle = have ? col : 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(x - 6, JY - 12); ctx.lineTo(x + 6, JY - 12); ctx.lineTo(x, JY - 3); ctx.fill();
    }

    // 左：びんの名前と粒
    text(sim.stage.free ? '∞' : `${stageIdx + 1} / 9`, 24, 40, 15, '#9fb0e6');
    text(sim.stage.name, 24, 72, sim.stage.name.length > 7 ? 19 : 24, '#f2f4ff');
    wrap(sim.stage.poem, 24, 112, 184, 13, '#aab6e8', 20);
    const ts = stageTools();
    ts.forEach((k, i) => {
      const x = 22 + (k === tool && shake > 0 ? Math.sin(shake * 2) * 4 : 0), y = 232 + i * 96, w = 172, h = 82, sel = k === tool;
      const b0 = sim.budget0[k], b = sim.budget[k], f = b0 === Infinity ? 1 : b / b0;
      rr(x, y, w, h, 18); ctx.fillStyle = sel ? 'rgba(150,180,255,0.24)' : 'rgba(120,150,230,0.10)'; ctx.fill();
      ctx.lineWidth = sel ? 3 : 1.5; ctx.strokeStyle = sel ? '#ffe2a0' : 'rgba(190,210,255,0.3)'; ctx.stroke();
      // 小びん
      const vx = x + 16, vy = y + 14, vw = 44, vh = 54;
      ctx.save(); rr(vx, vy, vw, vh, 12); ctx.clip();
      ctx.fillStyle = 'rgba(20,28,60,0.8)'; ctx.fillRect(vx, vy, vw, vh);
      ctx.fillStyle = TOOLINFO[k].col; ctx.fillRect(vx, vy + vh * (1 - f * 0.92), vw, vh);
      if (k === 'ember') { ctx.fillStyle = 'rgba(255,230,150,0.5)'; for (let j = 0; j < 4; j++) ctx.fillRect(vx + ((j * 13 + frame / 6) % vw), vy + vh - 8 - j * 9, 3, 3); }
      ctx.restore();
      rr(vx, vy, vw, vh, 12); ctx.strokeStyle = 'rgba(220,240,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
      text(TOOLINFO[k].name, x + 74, y + 30, 20, f > 0 ? '#f2f4ff' : '#7b84ad');
      text(b0 === Infinity ? 'たっぷり' : (b <= 0 ? 'からっぽ' : `のこり ${Math.ceil(f * 100)}%`), x + 74, y + 56, 13, b <= 0 ? '#ff9a8a' : '#aab6e8');
      text(String(i + 1), x + w - 16, y + 16, 12, 'rgba(200,215,255,0.6)', 'center');
      buttons.push({ x, y, w, h, fn: () => { tool = k; Sound.select(i); } });
    });
    if (shake > 0) shake--;

    // 右：目標とボタン
    const px = 1082;
    if (!sim.stage.free) {
      text('めざめを待つもの', px, 40, 14, '#9fb0e6');
      let ix = px + 14;
      for (const b of sim.buds) {
        ctx.fillStyle = b.done ? '#ffa8cc' : 'rgba(120,150,130,0.6)'; ctx.beginPath();
        for (let i = 0; i < 5; i++) ctx.ellipse(ix + Math.cos(i * 1.257) * 7, 72 + Math.sin(i * 1.257) * 7, 6, 6, 0, 0, 6.3); ctx.fill();
        ctx.fillStyle = b.done ? '#fff2b0' : 'rgba(60,80,70,0.9)'; ctx.beginPath(); ctx.arc(ix, 72, 4, 0, 6.3); ctx.fill();
        if (b.done) glow(ix, 72, 26, '255,190,220', 0.35);
        ix += 40;
      }
      for (const l of sim.lanterns) {
        rr(ix - 9, 60, 18, 24, 5); ctx.fillStyle = l.lit ? '#ffdc8c' : 'rgba(87,80,122,0.9)'; ctx.fill();
        if (l.lit) glow(ix, 72, 28, '255,180,90', 0.45);
        ix += 40;
      }
    } else text('目標のないびん', px, 40, 14, '#9fb0e6');
    button(px, 500, 176, 40, 'ヒント  (H)', () => { hintOpen = !hintOpen; Sound.click(); });
    button(px, 548, 176, 40, 'やりなおす  (R)', () => { startStage(stageIdx); Sound.click(); }, { pulse: outT > 300 });
    button(px, 596, 176, 40, '発見ノート  (N)', () => { journalOpen = true; Sound.click(); });
    button(px, 644, 176, 40, '← 棚へもどる', () => { Sound.click(); leaveStage(); });
    if (outT > 300) wrap('粒がなくなったら、やりなおして別の手を。', px, 440, 176, 13, '#ffcf9a', 19);

    // 最初の案内
    if (stageIdx === 0 && !save.done[0] && !everPoured) {
      rr(JX + JW / 2 - 230, JY + 60, 460, 54, 16); ctx.fillStyle = 'rgba(10,14,36,0.7)'; ctx.fill();
      text('びんの上で押しっぱなし → 粒をそそぐ', JX + JW / 2, JY + 88, 19, '#f2f4ff', 'center');
    }
    if (hintOpen) {
      rr(JX + 110, JY + 24, JW - 220, 96, 18); ctx.fillStyle = 'rgba(10,14,36,0.88)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,220,140,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      wrap(sim.stage.hint, JX + 134, JY + 54, JW - 268, 17, '#fff0cf', 26);
    }
    // クリア演出
    if (winT >= 0 && !sim.stage.free) {
      if (winT === 1 || (winT < 400 && winT % 14 === 0 && parts.length < 160)) for (let i = 0; i < (winT === 1 ? 14 : 2); i++) parts.push({ x: JX + 40 + Math.random() * (JW - 80), y: JY + JH - 30 - Math.random() * 200, vx: 0, vy: -0.3, life: 600 + Math.random() * 600, max: 1, col: '220,255,150', size: 1.6 + Math.random(), fly: true });
      const a1 = Math.min(1, winT / 30) * (winT > 170 ? Math.max(0, 1 - (winT - 170) / 40) : 1);
      if (a1 > 0) { ctx.globalAlpha = a1; text('まんかい', JX + JW / 2, JY + 290 - Math.min(20, winT * 0.4), 64, '#fff2c8', 'center', 700); ctx.globalAlpha = 1; }
      if (winT > 190) {
        const last = stageIdx === 8, w = last ? 270 : 500, x0 = JX + JW / 2 - w / 2;
        rr(x0, JY + 16, w, 104, 20); ctx.fillStyle = 'rgba(10,14,36,0.86)'; ctx.fill();
        if (!last) button(x0 + 14, JY + 28, 232, 56, 'つぎのびんへ →', nextFromPanel, { primary: true, size: 19 });
        button(x0 + w - 246, JY + 28, 232, 56, last ? '棚へもどる' : 'もうすこし眺める', () => { if (last) nextFromPanel(); else { Sound.click(); winT = -1; } }, last ? { primary: true, size: 19 } : {});
        text('Enter でも進めます', x0 + w / 2, JY + 102, 13, 'rgba(210,222,255,0.7)', 'center');
      }
    }
    drawToasts();
  }
  function drawToasts() {
    for (let i = toasts.length - 1; i >= 0; i--) {
      const t = toasts[i]; t.t++; if (t.t > 300) { toasts.splice(i, 1); continue; }
      const al = Math.min(1, t.t / 18) * Math.min(1, (300 - t.t) / 30), x = 1082 + (1 - Math.min(1, t.t / 18)) * 30, y = 112 + i * 76;
      ctx.globalAlpha = al; rr(x, y, 176, 66, 16); ctx.fillStyle = 'rgba(30,34,72,0.95)'; ctx.fill(); ctx.strokeStyle = '#ffe2a0'; ctx.lineWidth = 1.5; ctx.stroke();
      text('✦ 発見', x + 14, y + 17, 12, '#ffd98a'); text(t.title, x + 14, y + 38, 17, '#fff0cf'); text(t.sub, x + 162, y + 17, 11, '#b9c6f2', 'right'); ctx.globalAlpha = 1;
    }
  }

  // ---------- 棚の画面 ----------
  function drawShelf() {
    drawBG(1120, 100, 44);
    text('ひとつぶ庭園', 64, 78, 54, '#f4f1ff', 'left', 700);
    text('四つの粒をそそいで、びんの中に夜の庭をひらく', 68, 126, 16, '#aab6e8');
    const nd = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(i => save.done[i]).length, nj = DISCOVERIES.filter(d => save.disc[d.id]).length;
    text(`咲いたびん ${nd} / 9　　発見 ${nj} / ${DISCOVERIES.length}`, 68, 156, 14, '#8fa0d8');
    const next = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(i => !save.done[i]);
    for (let row = 0; row < 2; row++) wood(50, 372 + row * 222, VW - 100, 18);
    for (let i = 0; i < 10; i++) {
      if (i === 9 && !unlocked(9)) continue;
      const row = (i / 5) | 0, cxp = 190 + (i % 5) * 225, by = 372 + row * 222, w = 168, h = 112, x = cxp - w / 2;
      const un = unlocked(i), hov = un && mouse.x > x - 10 && mouse.x < x + w + 10 && mouse.y > by - h - 30 && mouse.y < by + 44;
      const y = by - h - 5 - (hov ? 6 : 0);
      if (save.done[i]) glow(cxp, y + h / 2, 130, '255,200,150', 0.22 + 0.05 * Math.sin(frame * 0.04 + i));
      ctx.save(); jarPath(x, y, w, h, 12); ctx.closePath(); ctx.clip();
      ctx.fillStyle = 'rgba(24,32,70,0.9)'; ctx.fillRect(x, y, w, h);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(thumbs[i], x, y, w, h); ctx.imageSmoothingEnabled = true;
      if (!un) { ctx.fillStyle = 'rgba(8,10,26,0.82)'; ctx.fillRect(x, y, w, h); }
      ctx.restore();
      jarPath(x - 2, y - 8, w + 4, h + 10, 14); ctx.strokeStyle = un ? 'rgba(190,225,255,0.6)' : 'rgba(150,170,220,0.25)'; ctx.lineWidth = 3.5; ctx.stroke();
      if (i === next && un) { jarPath(x - 2, y - 8, w + 4, h + 10, 14); ctx.strokeStyle = `rgba(255,226,160,${0.45 + 0.4 * Math.sin(frame * 0.08)})`; ctx.lineWidth = 2.5; ctx.stroke(); }
      if (!un) { ctx.fillStyle = '#7a563d'; rr(x + 30, y - 16, w - 60, 14, 5); ctx.fill(); text('？', cxp, y + h / 2, 30, 'rgba(180,195,240,0.5)', 'center'); }
      text(un ? (i === 9 ? '∞  ' : `${i + 1}  `) + STAGES[i].name : '・・・', cxp, by + 38, 15, un ? (hov ? '#fff2c8' : '#dfe6ff') : '#66709c', 'center');
      if (save.done[i]) text('✿', x + w - 4, y - 2, 18, '#ffb4d4', 'center');
      if (un) buttons.push({ x: x - 10, y: by - h - 30, w: w + 20, h: h + 74, fn: () => { Sound.click(); startStage(i); } });
    }
    button(880, 652, 150, 40, '発見ノート', () => { journalOpen = true; Sound.click(); });
    button(1040, 652, 110, 40, save.muted ? '音 OFF' : '音 ON', () => { save.muted = !save.muted; Sound.setMuted(save.muted); persist(); Sound.click(); });
    button(1160, 652, 70, 40, '消去', () => { if (confirm('すべての記録を消して最初からにしますか？')) { localStorage.removeItem(KEY); location.reload(); } }, { size: 13 });
    text('クリック／タップでびんを選ぶ　・　M 音の切替', 64, 672, 13, '#6f7cae');
    if (endingOpen) {
      ctx.fillStyle = 'rgba(6,8,22,0.6)'; ctx.fillRect(0, 0, VW, VH);
      if (frame % 10 === 0 && parts.length < 120) parts.push({ x: 200 + Math.random() * 880, y: 200 + Math.random() * 400, vx: 0, vy: 0, life: 500, max: 1, col: '220,255,150', size: 2, fly: true });
      drawParts();
      rr(340, 210, 600, 300, 28); ctx.fillStyle = 'rgba(18,22,54,0.95)'; ctx.fill(); ctx.strokeStyle = '#ffe2a0'; ctx.lineWidth = 2; ctx.stroke();
      text('九つのびんに、花と灯がともりました', 640, 268, 26, '#fff2c8', 'center', 700);
      text('砂、水、種、火種。たった四つの粒が', 640, 318, 16, '#cdd6ff', 'center');
      text('この小さな夜の庭を、ぜんぶつくりました。', 640, 344, 16, '#cdd6ff', 'center');
      text(`発見ノート ${nj} / ${DISCOVERIES.length}` + (nj < DISCOVERIES.length ? '　— まだ知らない反応があります' : '　— すべて見つけました'), 640, 392, 15, '#ffcfa0', 'center');
      text('棚に「じゆうのびん」がふえました。', 640, 420, 15, '#aab6e8', 'center');
      button(560, 448, 160, 44, 'とじる', () => { endingOpen = false; parts = []; Sound.click(); }, { primary: true, size: 18 });
    }
  }
  function drawJournal() {
    ctx.fillStyle = 'rgba(6,8,22,0.72)'; ctx.fillRect(0, 0, VW, VH);
    const x0 = 170, y0 = 60, w = 940, h = 600;
    rr(x0, y0, w, h, 26); ctx.fillStyle = 'rgba(22,26,60,0.97)'; ctx.fill(); ctx.strokeStyle = 'rgba(190,210,255,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    const nj = DISCOVERIES.filter(d => save.disc[d.id]).length;
    text('発見ノート', x0 + 36, y0 + 44, 28, '#f4f1ff', 'left', 700); text(`${nj} / ${DISCOVERIES.length}`, x0 + 200, y0 + 48, 16, '#9fb0e6');
    DISCOVERIES.forEach((d, i) => {
      const col = i % 2, row = (i / 2) | 0, x = x0 + 30 + col * 445, y = y0 + 84 + row * 70, f = save.disc[d.id];
      rr(x, y, 435, 62, 14); ctx.fillStyle = f ? 'rgba(130,160,240,0.16)' : 'rgba(120,130,180,0.07)'; ctx.fill();
      if (f) { text(d.name, x + 18, y + 21, 18, '#ffe9b8'); text(d.formula, x + 418, y + 21, 13, '#9fd0ff', 'right'); text(d.desc, x + 18, y + 45, 13, '#c6cff5'); }
      else { text('？？？', x + 18, y + 21, 18, '#6a75a6'); text(d.q, x + 18, y + 45, 13, '#5d6796'); }
    });
    button(x0 + w - 150, y0 + 24, 120, 40, 'とじる', () => { journalOpen = false; Sound.click(); });
  }

  // ---------- ループ ----------
  let lastT = performance.now(), acc = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    acc += Math.min(100, now - lastT); lastT = now;
    let steps = 0;
    while (acc >= 16.6 && steps < 3) { acc -= 16.6; steps++; frame++; if (mode === 'play' && !journalOpen) tickSim(); }
    if (!steps) return;
    buttons = [];
    ctx.setTransform(K, 0, 0, K, 0, 0);
    if (mode === 'play') drawPlay(); else drawShelf();
    if (journalOpen) { buttons = []; drawJournal(); }
    else if (endingOpen && mode === 'shelf') buttons = buttons.slice(-1);
    updCursor();
    cv.style.cursor = buttons.some(b => mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) ? 'pointer' : (mode === 'play' && cursorIn ? 'none' : 'default');
  }
  requestAnimationFrame(loop);

  // ---------- 入力 ----------
  function pos(e) { const r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * VW; mouse.y = (e.clientY - r.top) / r.height * VH; }
  // クリア後の選択パネルが出ているあいだは「注ぐ」を止め、ふつうのマウス操作にする
  function panelUp() { return mode === 'play' && sim && winT > 190 && !sim.stage.free; }
  function nextFromPanel() { Sound.click(); const last = stageIdx === 8; leaveStage(); if (!last) startStage(stageIdx + 1); }
  function updCursor() {
    if (panelUp()) { cursorIn = false; pouring = false; return; }
    cursorIn = mode === 'play' && mouse.x > JX - 12 && mouse.x < JX + JW + 12 && mouse.y > 20 && mouse.y < JY + JH + 10;
    if (cursorIn || pouring) cursorX = Math.max(3, Math.min(W - 4, Math.floor((mouse.x - JX) / S)));
  }
  cv.addEventListener('pointermove', (e) => { pos(e); updCursor(); });
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault(); Sound.init(); pos(e); updCursor();
    for (let i = buttons.length - 1; i >= 0; i--) { const b = buttons[i]; if (mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h) { b.fn(); return; } }
    if (journalOpen || endingOpen) return;
    if (hintOpen) { hintOpen = false; }
    if (mode === 'play' && cursorIn) { pouring = true; try { cv.setPointerCapture(e.pointerId); } catch (er) { } }
  });
  const stop = () => { pouring = false; };
  cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);
  cv.addEventListener('pointerleave', () => { if (!pouring) cursorIn = false; });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('wheel', (e) => { if (mode !== 'play') return; e.preventDefault(); const ts = stageTools(); const i = (ts.indexOf(tool) + (e.deltaY > 0 ? 1 : ts.length - 1)) % ts.length; tool = ts[i]; Sound.select(i); }, { passive: false });
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'm') { save.muted = !save.muted; Sound.setMuted(save.muted); persist(); return; }
    if (journalOpen) { if (k === 'escape' || k === 'n' || k === 'j') journalOpen = false; return; }
    if (endingOpen) { if (k === 'escape' || k === 'enter') { endingOpen = false; parts = []; } return; }
    if (k === 'n' || k === 'j') { journalOpen = true; return; }
    if (mode !== 'play') return;
    if (panelUp() && (k === 'enter' || k === ' ')) { e.preventDefault(); nextFromPanel(); return; }
    const ts = stageTools();
    if (k >= '1' && k <= '4' && ts[+k - 1]) { tool = ts[+k - 1]; Sound.init(); Sound.select(+k - 1); }
    else if (k === 'r') startStage(stageIdx);
    else if (k === 'h') hintOpen = !hintOpen;
    else if (k === 'escape') { if (hintOpen) hintOpen = false; else leaveStage(); }
  });

  // ---------- 検証用フック（遊びには不要） ----------
  window.__t = {
    get sim() { return sim; }, get save() { return save; },
    start(i) { startStage(i); },
    pour(tl, x, n) { for (let i = 0; i < n; i++) { sim.pour(tl, x); sim.step(); handleEvents(); if (winT >= 0) winT++; } },
    run(n) { for (let i = 0; i < n; i++) { sim.step(); handleEvents(); if (winT >= 0) winT++; } },
    state() { return { tick: sim.tick, won: sim.won, buds: sim.buds.map(b => [b.x, b.y, b.water, b.done]), lanterns: sim.lanterns.map(l => [l.x, l.y, l.lit]), budget: sim.budget, found: Object.keys(sim.found) }; },
    count(t) { let n = 0; for (let i = 0; i < W * H; i++) if (sim.g[i] === t) n++; return n; },
  };
})();
