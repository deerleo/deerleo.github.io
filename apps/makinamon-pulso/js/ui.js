'use strict';
// ───────── pantallas: título, introducción, menú, equipo, manual, mochila ─────────
function hpCol(k) { return k > .5 ? '#48c858' : k > .2 ? '#f0c020' : '#e84838'; }
function drawHP(x, y, w, k) { g.fillStyle = INK; g.fillRect(x, y, w, 4); g.fillStyle = '#585868'; g.fillRect(x + 1, y + 1, w - 2, 2); const n = Math.max(k > 0 ? 1 : 0, Math.round((w - 2) * k)); g.fillStyle = hpCol(k); g.fillRect(x + 1, y + 1, n, 2); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(x + 1, y + 1, n, 1); }
// nivel como chapita, rayo de PULSO y chapa de estado (mismo idioma en todas las pantallas)
function lvTag(lv, x, y, c = '#606070') { txt('Nv', x, y, c); txt(String(lv), x + 11, y, INK); }
function bolt(x, y, c = '#e0a020') { g.fillStyle = c; for (const [a, b, w] of [[2, 0, 2], [1, 1, 2], [0, 2, 4], [2, 3, 2], [1, 4, 2]]) g.fillRect(x + a, y + b + 1, w, 1); }
function statusChip(x, y) { g.fillStyle = INK; g.fillRect(x, y, 31, 9); g.fillStyle = '#f0c020'; g.fillRect(x + 1, y + 1, 29, 7); txt('CORTO', x + 3, y + 1, INK); }
// barra de LED (la carga de una celda)
function ledBar(x, y, w, h, k, dim) { const n = Math.max(3, Math.floor((w - 2) / 4)), sw = Math.floor((w - 2) / n); g.fillStyle = INK; g.fillRect(x, y, n * sw + 1, h); const on = k > 0 ? Math.max(1, Math.round(n * k)) : 0, col = hpCol(k);
  for (let i = 0; i < n; i++) { g.fillStyle = i < on && !dim ? col : '#3a3a48'; g.fillRect(x + 1 + i * sw, y + 1, sw - 1, h - 2); if (i < on && !dim) { g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x + 1 + i * sw, y + 1, sw - 1, 1); } } }
function typeTag(t, x, y, w = 36) { const ty = TYPES[t]; g.fillStyle = INK; g.fillRect(x, y, w, 9); g.fillStyle = ty.d; g.fillRect(x + 1, y + 1, w - 2, 7); g.fillStyle = ty.c; g.fillRect(x + 1, y + 1, w - 2, 3); txtC(ty.n, x + w / 2 + .5, y + 1, '#fff'); }
function blueprint(x, y, w, h) {
  g.fillStyle = '#2458a4'; g.fillRect(x, y, w, h); g.fillStyle = '#3068b4';
  for (let i = x + 7; i < x + w; i += 8) g.fillRect(i, y, 1, h); for (let j = y + 7; j < y + h; j += 8) g.fillRect(x, j, w, 1);
  g.fillStyle = '#4480c8'; for (let i = x + 31; i < x + w; i += 32) g.fillRect(i, y, 1, h); for (let j = y + 31; j < y + h; j += 32) g.fillRect(x, j, w, 1);
}
const bigCache = {};
function bigText(s, scale, col, bold) {
  const k = s + scale + col + bold; if (bigCache[k]) return bigCache[k];
  const w = tw_(s) + 1, [a, ax] = mk(w, 12); txt(s, 0, 3, col, ax); if (bold) txt(s, 1, 3, col, ax);
  const [b, bx] = mk(w * scale, 12 * scale); bx.drawImage(a, 0, 0, w * scale, 12 * scale); return bigCache[k] = b;
}
// ── la Gran Fábrica bajo la tormenta (título) ──
const storm = { bolt: null, boltT: 0, pulses: [], rain: Array.from({ length: 70 }, (_, i) => [(i * 37) % 170, (i * 53) % 150, 2 + (i % 3)]), stars: Array.from({ length: 40 }, (_, i) => [(i * 53) % 160, (i * 29) % 50, i % 3]) };
let STORM_BG = null;
function stormBg() {
  if (STORM_BG) return STORM_BG; const [c, x] = mk(W, H), r = rng(5);
  gradV(x, 0, 0, W, 92, ['#100c2c', '#1a1440', '#2a1c58', '#4a2470', '#7c3480', '#b84c7c', '#e87070']);
  // valle lejano con luces del pueblo
  for (let i = 0; i < W; i++) { const h = 10 + Math.sin(i * .045) * 5 + vnoise(i / 9, 1, 3) * 6; R(x, i, 92 - h, 1, h + 4, '#3c2060'); P(x, i, Math.round(92 - h), '#5a3080'); }
  // la Gran Fábrica
  const F = '#1c1030', L = '#2a1848';
  R(x, 48, 64, 64, 28, F); for (let k = 0; k < 4; k++) { for (let j = 0; j < 9; j++) R(x, 48 + k * 16, 64 - j, 16 - Math.round(j * 1.7), 1, F); }
  R(x, 74, 30, 12, 36, F); R(x, 72, 28, 16, 4, L); R(x, 79, 14, 2, 14, '#3c2a58'); R(x, 76, 20, 8, 1, '#3c2a58');
  for (const [cx, ch] of [[54, 22], [60, 30], [100, 26], [106, 18]]) { R(x, cx, 64 - ch, 5, ch, F); R(x, cx - 1, 64 - ch, 7, 2, L); }
  R(x, 40, 88, 80, 4, F);
  for (let i = 0; i < 26; i++) { const wx = 50 + Math.floor(r() * 58), wy = 68 + Math.floor(r() * 18); R(x, wx, wy, 2, 2, '#3c2048'); }
  // colinas cercanas
  for (let i = 0; i < W; i++) { const h = 22 + Math.sin(i * .03 + 1) * 8 + Math.sin(i * .11) * 2; gradV(x, i, 112 - h, 1, h + 40, ['#24143c', '#1a0e2c', '#120a20']); P(x, i, Math.round(112 - h), '#3c2458'); }
  for (const tx of [14, 140]) { const by = 112 - (22 + Math.sin(tx * .03 + 1) * 8); R(x, tx, by - 28, 1, 28, '#120a20'); R(x, tx + 6, by - 28, 1, 28, '#120a20'); for (let k = 0; k < 4; k++) R(x, tx, by - 28 + k * 7, 7, 1, '#120a20'); R(x, tx - 4, by - 26, 15, 1, '#120a20'); }
  return STORM_BG = c;
}
function strike() {
  const pts = [[80 + rnd(-30, 30), -4]]; let px = pts[0][0], y = -4; while (y < 12) { y += rnd(3, 6); px += (80 - px) * .35 + rnd(-4, 4); pts.push([px, Math.min(y, 13)]); }
  storm.bolt = pts; storm.boltT = 16; flash('#fff', .9); sfx.thunder(); shake(3);
  burst(80, 14, 18, { c: ['#fff', '#f8e070'], v0: .5, v1: 2.5, a0: 0, a1: Math.PI * 2, ay: .05 });
  for (let k = 0; k < 6; k++) storm.pulses.push({ t: -k * 6, side: k & 1 ? 1 : -1 });
}
function drawStorm(t) {
  g.drawImage(stormBg(), 0, 0);
  for (const [x, y, k] of storm.stars) if (((t >> 4) + x) % (5 + k) !== 0) { g.fillStyle = k ? '#c8c0f0' : '#fff'; g.fillRect(x, y, 1, 1); }
  for (let i = 0; i < 5; i++) { const x = ((i * 61 + t * (.05 + i * .02)) % 230) - 50, y = 4 + i * 7; g.fillStyle = i & 1 ? '#2a1c50' : '#221642'; g.fillRect(x, y, 44, 5); g.fillRect(x + 8, y - 3, 22, 3); g.fillRect(x + 14, y + 5, 26, 2); }
  // ventanas de la Fábrica que laten
  const beat = (Math.sin(t * .05) + 1) / 2; g.fillStyle = beat > .6 ? '#f8e070' : '#f0a040';
  for (const [wx, wy] of [[52, 70], [60, 70], [68, 74], [92, 70], [100, 74], [108, 70], [78, 40], [78, 48], [78, 56]]) g.fillRect(wx, wy, 2, 2);
  // pulsos que bajan de la Fábrica por los cables hasta el valle
  for (let i = storm.pulses.length - 1; i >= 0; i--) { const p2 = storm.pulses[i]; p2.t++; if (p2.t < 0) continue; const k = p2.t / 70; if (k > 1) { storm.pulses.splice(i, 1); continue; }
    const x = 80 + p2.side * k * 90, y = 64 + Math.sin(k * Math.PI) * -6 + k * 30; g.fillStyle = '#fff8c0'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); g.fillStyle = '#f8d030'; g.fillRect(Math.round(x - p2.side * 3), Math.round(y), 2, 1); }
  g.fillStyle = '#120a20'; for (let x = 0; x < W; x++) { g.fillRect(x, Math.round(80 + Math.abs(x - 80) * .28 + Math.sin(x * .1) * 1.5), 1, 1); }
  // lluvia
  g.fillStyle = 'rgba(200,190,255,.35)'; for (const d of storm.rain) { const x = (d[0] - t * 1.2 * d[2] * .5) % 170, y = (d[1] + t * d[2]) % 150; g.fillRect(Math.round((x + 170) % 170) - 5, Math.round(y) - 5, 1, d[2] + 1); }
  if (storm.boltT > 0) { storm.boltT--; if (storm.boltT > 8 || storm.boltT % 2) { g.strokeStyle = storm.boltT > 10 ? '#fff' : '#f8e070'; g.lineWidth = storm.boltT > 12 ? 2 : 1; g.beginPath(); storm.bolt.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); } }
}
// ── título ──
const title = {
  t: 0, letters: [], ready: false, sub: 0, shine: -40, mons: [{ sp: 'tostik', x: 26, j: 0 }, { sp: 'bulbio', x: 134, j: 0 }, { sp: 'hervi', x: 112, j: 0 }],
  start() {
    this.t = 0; this.ready = false; this.sub = 0; parts.length = 0; storm.pulses.length = 0;
    this.letters = 'MAKINAMON'.split('').map(ch => ({ ch, y: -50, sy: 1 }));
    music('titulo');
    (async () => {
      await wait(30); strike(); await wait(24);
      for (const l of this.letters) { tw(l, { y: 0 }, 22, 'bounce').then(() => sfx.bump()); await wait(4); }
      await wait(26); flash('#f8e070', .6); shake(2); sfx.lock(); this.letters.forEach(l => { l.sy = 1.3; tw(l, { sy: 1 }, 20, 'elastic'); });
      burst(80, 30, 30, { c: ['#fff', '#f8e070', '#f0a040'], v0: 1, v1: 3.5, kind: 'star', l0: 14, l1: 30 }); await tw(this, { sub: 1 }, 16, 'back'); this.ready = true;
      await anyKey(); sfx.sel(); flash();
      const sv = loadGame(); let r = 1;
      if (sv) r = await titleMenu(fixSave(sv));
      await fade(1, 16); parts.length = 0;
      if (r === 0) { G = fixSave(sv); scene = world; world.load(G.map, G.x, G.y, G.dir || 0); await fade(0, 16); }
      else intro();
    })();
  },
  update() { this.t++; if (this.t % 420 === 419) strike(); if (this.ready && this.t % 200 === 0) this.shine = -40; this.shine += 3; for (const m of this.mons) { if (m.j > 0) m.j--; else if (Math.random() < .008) m.j = 24; } },
  draw() {
    drawStorm(this.t);
    // primer plano: los tres iniciales y NIA mirando la Fábrica
    for (const m of this.mons) { const k = m.j / 24, y = Math.sin(k * Math.PI) * 8; drawMon(m.sp, m.j > 0 ? 'f1' : 'f0', m.x, 136 - y, { sx: .8, sy: .8 }); }
    g.drawImage(CHARS.nia, 3 * 16, 0, 16, 16, 64, 102, 32, 32);
    // logotipo de chapa con un rayo
    let x = 10; const grad = ['#ffffff', '#fff8c0', '#f8e070', '#f8c030', '#f0a040', '#e86838'];
    const lws = this.letters.map(l => (FONT[l.ch].cols.length + 1) * 2 + 3), total = lws.reduce((a, b) => a + b, 0); x = Math.round(80 - total / 2);
    this.letters.forEach((l, li) => {
      const yy = 10 + l.y, wv = this.ready ? Math.round(Math.sin(this.t * .07 + x * .08) * 1.2) : 0;
      const dk = bigText(l.ch, 2, '#140c28', 1), h = Math.round(24 * l.sy), dy = Math.round(yy + wv - (h - 24));
      for (const [dx, dy2] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1], [0, 2], [1, 2], [2, 2], [2, 3], [1, 3]]) g.drawImage(dk, x + dx, dy + dy2, dk.width, h);
      for (let i = 0; i < 6; i++) { const c = bigText(l.ch, 2, grad[i], 1), sy0 = 6 + i * 2.5, sh = i === 5 ? 6 : 3; g.drawImage(c, 0, sy0, c.width, sh, x, dy + Math.round(sy0 * h / 24), c.width, Math.ceil(sh * h / 24)); }
      if (Math.abs(x - this.shine) < 6) { const c = bigText(l.ch, 2, '#ffffff', 1); g.globalAlpha = .7; g.drawImage(c, x, dy, c.width, h); g.globalAlpha = 1; }
      x += lws[li];
    });
    if (this.sub > 0) {
      const w = tw_('VERSIÓN PULSO') + 14, bx = Math.round(80 - w / 2), by = Math.round(38 + (1 - this.sub) * -10); g.globalAlpha = Math.min(1, this.sub);
      g.fillStyle = '#140c28'; g.fillRect(bx - 1, by - 1, w + 2, 15); g.fillStyle = '#3aa89a'; g.fillRect(bx, by, w, 13); g.fillStyle = '#8ce0d4'; g.fillRect(bx, by, w, 1); g.fillStyle = '#1c6c64'; g.fillRect(bx, by + 12, w, 1);
      for (const sx of [bx + 2, bx + w - 4]) { g.fillStyle = '#c8d0dc'; g.fillRect(sx, by + 5, 2, 2); } txtC('VERSIÓN PULSO', 80, by + 3, '#140c28'); g.globalAlpha = 1;
    }
    if (this.ready && ui.length <= 1) { if ((this.t >> 4) & 1) { const tx = TOUCH ? 'TOCA PARA EMPEZAR' : 'PULSA ENTER'; txtO(tx, 80 - tw_(tx) / 2, 94, '#fff', '#140c28'); } txtR('v1.0', W - 3, 136, '#6a5890'); }
  },
};
async function titleMenu(sv) {
  const card = { s: 0, draw() { if (this.s !== 0) return; box(14, 54, 132, 40, { ac: '#f0c020' }); txt(sv.name, 22, 61); const nf = sv.fusibles.length; txtR(`${nf} ${nf === 1 ? 'fusible' : 'fusibles'}`, 138, 61, '#806020');
    txt(this.place ??= (() => { const g0 = G; try { G = sv; return MAPS[sv.map] ? MAPS[sv.map].area(sv.y)[0] : ''; } catch (e) { return ''; } finally { G = g0; } })(), 22, 71, '#404050'); txt(`${Object.keys(sv.got || {}).length} Makinamon · ${sv.steps || 0} pasos`, 22, 81, '#808088'); } };
  ui.push(card); const r = await menu(['CONTINUAR', 'NUEVA PARTIDA'], { x: 34, y: 98, w: 92, noCancel: true, onMove: s => card.s = s }); ui.splice(ui.indexOf(card), 1);
  if (r === 1 && !(await ask('Empezar de cero borra la partida guardada. ¿Seguro?'))) { dlgOff(); return titleMenu(sv); }
  dlgOff(); return r;
}
// ── introducción: el taller, la tormenta, los Makinamon y la ficha de makinista ──
async function intro() {
  G = fixSave(newGame()); let tallerBg = null;
  const sc = { t: 0, phase: 'taller', prof: 0, mon: null, ms: 0, name: null, card: 0, stamp: 0, parade: [], update() { this.t++; }, draw() {
    const t = this.t;
    if (this.phase === 'taller') {
      if (!tallerBg) tallerBg = buildMap(MAPS.taller).bg; g.drawImage(tallerBg, 0, 8); g.fillStyle = 'rgba(20,16,40,.35)'; g.fillRect(0, 0, W, H);
      if (this.prof > 0) { const x = Math.round(-60 + this.prof * 66); g.fillStyle = '#140c28'; g.fillRect(x - 1, 9, 58, 70); g.fillStyle = '#f4ecd8'; g.fillRect(x, 10, 56, 68); gradV(g, x + 2, 12, 52, 54, ['#bcd8e8', '#9cc0d4', '#d8c8a8']);
        const blink = t % 120 < 6 ? 1 : 0, br = Math.round(Math.sin(t * .08)); g.drawImage(CHARS.estano, 0, 0, 16, 16 - (blink ? 0 : 0), x + 4, 18 + br, 48, 48); if (blink) { g.fillStyle = '#f0c0a0'; g.fillRect(x + 19, 36 + br, 3, 3); g.fillRect(x + 34, 36 + br, 3, 3); }
        g.fillStyle = '#140c28'; g.fillRect(x, 66, 56, 12); txtC('ESTAÑO', x + 28, 68, '#f8e070'); }
    } else if (this.phase === 'memoria') {
      drawStorm(t); g.globalCompositeOperation = 'color'; g.fillStyle = '#a07040'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(60,30,10,.25)'; g.fillRect(0, 0, W, H);
      txtO('Hace cien años…', 8, 6, '#f8e8c0', '#2a1408');
    } else if (this.phase === 'plano') {
      blueprint(0, 0, W, H); txtC('MAKINAMON', 80, 6, '#f8e070');
      if (this.mon) { disc(80, 70, Math.round(28 * this.ms), 'rgba(248,224,112,.18)'); drawMon(this.mon, (t % 70) < 10 ? 'f1' : 'f0', 80, 92, { sx: this.ms, sy: this.ms * (1 + Math.sin(t * .1) * .03) }); }
      this.parade.forEach((p2, i) => { const x = 16 + i * 32, b = (t + i * 13) % 50 < 6 ? 1 : 0; drawMon(p2, 'f0', x, 60 - b, { sx: .5, sy: .5 }); txtC(SPECIES[p2].n, x, 64 + (i & 1) * 10, '#a8d0f8'); });
    } else if (this.phase === 'ficha') {
      blueprint(0, 0, W, H); const k = this.card, y0 = Math.round(4 + (1 - k) * 140);
      g.fillStyle = '#140c28'; g.fillRect(9, y0 - 1, 142, 86); g.fillStyle = '#f4ecd8'; g.fillRect(10, y0, 140, 84); g.fillStyle = '#3aa89a'; g.fillRect(10, y0, 140, 14); txt('FICHA DE MAKINISTA', 16, y0 + 4, '#140c28');
      g.fillStyle = '#d8ccb0'; g.fillRect(16, y0 + 20, 40, 48); g.drawImage(CHARS.nia, 0, 0, 16, 16, 20, y0 + 24, 32, 32); g.fillStyle = '#a89c80'; g.fillRect(16, y0 + 60, 40, 8); txtC('FOTO', 36, y0 + 60, '#f4ecd8');
      txt('NOMBRE', 62, y0 + 20, '#806020'); g.fillStyle = '#fff'; g.fillRect(62, y0 + 30, 82, 12); g.fillStyle = '#140c28'; g.fillRect(62, y0 + 42, 82, 1);
      if (this.name !== null) { txt(this.name + (this.stamp ? '' : (t >> 4) & 1 ? '_' : ''), 66, y0 + 32, '#c03020'); }
      txt('PUEBLO', 62, y0 + 48, '#806020'); txt('BOBINA', 100, y0 + 48, '#404050'); txt('Nº', 62, y0 + 60, '#806020'); txt('0001', 100, y0 + 60, '#404050');
      if (this.rej) { // rejilla de letras: con el mando, las flechas, el dedo o el teclado
        const R = this.rej; R.cells.forEach((c, i) => { const { x, y } = R.pos(i), on = i === R.i, esp = c.length > 1 || c === '◀';
          g.fillStyle = on ? '#f8e070' : esp ? '#1c4888' : 'rgba(20,40,90,.55)'; g.fillRect(x, y, R.cw - 1, 12); if (on) { g.fillStyle = '#140c28'; g.fillRect(x, y + 11, R.cw - 1, 1); }
          txtC(c, x + (R.cw - 1) / 2, y + 3, on ? '#140c28' : c === 'OK' ? '#f8e070' : '#e0ecff'); });
        txtR(TOUCH ? 'B borra · MENÚ acepta' : 'Escribe o elige · ENTER acepta', W - 4, 136, '#a8c8f0');
      }
      if (this.stamp > 0) { const s2 = Math.max(1, 3 - this.stamp * 2); g.save(); g.translate(110, y0 + 66); g.rotate(-.25); g.strokeStyle = '#e84848'; g.lineWidth = 2; g.strokeRect(-26 * s2, -7 * s2, 52 * s2, 14 * s2); g.scale(s2, s2); txt('APROBADA', -22, -3, '#e84848'); g.restore(); }
    }
  } };
  scene = sc; music('titulo');
  // 1. el taller
  await fade(0, 20); await tw(sc, { prof: 1 }, 20, 'back');
  await say('¡Hola! Te doy la bienvenida al VALLE DE FERRALLA.'); await say('Me llamo ESTAÑO. Por aquí todos me dicen «la profesora de las máquinas». Y no lo dicen por mi altura.');
  dlgOff(); await fade(1, 14); sc.phase = 'memoria'; storm.pulses.length = 0; await fade(0, 14);
  // 2. la tormenta de hace cien años
  await say('Hace cien años, una tormenta cayó sobre la Gran Fábrica MAKINA…', { auto: 60 }); strike(); await wait(30);
  await say('…y el rayo no se fue. Se quedó a vivir dentro de las máquinas. Ese rayo que late lo llamamos PULSO.'); dlgOff();
  await fade(1, 14); sc.phase = 'plano'; await fade(0, 14);
  // 3. los Makinamon
  sc.mon = 'enchufin'; sfx.pop(); flash('#f8e070', .7); burst(80, 70, 24, { c: ['#fff', '#f8e070'], v0: 1, v1: 3, kind: 'star' }); tw(sc, { ms: 1 }, 24, 'elastic'); await wait(14); sfx.cry(SPECIES.enchufin.cry);
  await say('A las máquinas que lo llevan dentro las llamamos… ¡MAKINAMON!'); await tw(sc, { ms: 0 }, 10, 'in'); sc.mon = null;
  for (const p2 of ['tostik', 'grifin', 'ventolin', 'relojin', 'macetin']) { sc.parade.push(p2); sfx.pop(); await wait(10); }
  await say('No se fabrican: nacen. Unas viven en la hierba alta, otras en los desvanes, otras en la cocina de tu abuela.');
  await say('Pero cuidado: hay quien quiere embotellar su Pulso y venderlo por kilovatios. La Compañía APAGÓN.');
  await say('A quien se gana la confianza de un Makinamon se le llama MAKINISTA. Hoy te toca a ti. Rellena tu ficha.'); dlgOff();
  // 4. la ficha
  await fade(1, 12); sc.phase = 'ficha'; sc.parade = []; await fade(0, 12); await tw(sc, { card: 1 }, 18, 'back'); sc.name = '';
  await nombreFicha(sc);
  G.name = sc.name; sfx.clamp(); shake(2); await tw(sc, { stamp: 1 }, 10, 'out'); await wait(30);
  dlgOff(); await fade(1, 12); sc.phase = 'taller'; await fade(0, 12);
  await say(`¡${G.name}! Precioso nombre de makinista. Te espero en mi TALLER de PUEBLO BOBINA: el edificio del engranaje.`);
  await say('Y no tardes, que tengo tres Makinamon esperando en sus celdas. Y uno es muy impaciente.');
  dlgOff(); await fade(1, 24); parts.length = 0; scene = world; world.load('pueblo', 5, 34, 0); await fade(0, 24);
}
// rejilla para escribir el nombre sin teclado (y con él)
async function nombreFicha(sc) {
  const filas = ['ABCDEFGHIJ', 'KLMNÑOPQRS', 'TUVWXYZ'], cells = [...filas.join(''), '-', '◀', 'OK'], cols = 10, cw = 15, x0 = 5, y0 = 92;
  const R = sc.rej = { cells, i: 0, cw, pos: i => ({ x: x0 + (i % cols) * cw, y: y0 + Math.floor(i / cols) * 14 }) };
  const add = ch => { if (sc.name.length < 7) { sc.name += ch; sfx.move(); } else sfx.bump(); }, del = () => { if (sc.name) { sc.name = sc.name.slice(0, -1); sfx.back(); } };
  if (TEST) { sc.name = 'NIA'; sc.rej = null; return; }
  let fin = false;
  typing = e => { if (e.key === 'Enter') { fin = true; return true; } if (e.key === 'Backspace') { del(); return true; } if (e.key.length === 1 && /[a-zA-ZñÑ-]/.test(e.key)) { add(e.key.toUpperCase()); return true; } return false; };
  window.onCanvasTap = (x, y) => { const i = cells.findIndex((c, k) => { const p = R.pos(k); return x >= p.x && x < p.x + cw && y >= p.y && y < p.y + 13; }); if (i < 0) return false; R.i = i; pulsar(); return true; };
  const pulsar = () => { const c = cells[R.i]; if (c === 'OK') fin = true; else if (c === '◀') del(); else add(c); };
  try {
    while (!fin) {
      const k = await until(() => fin ? 'fin' : ['up', 'down', 'left', 'right', 'a', 'b', 'start'].find(n => nav[n]));
      if (k === 'fin') break;
      const n = cells.length, c = R.i % cols, r = Math.floor(R.i / cols);
      if (k === 'left') R.i = (R.i - 1 + n) % n; else if (k === 'right') R.i = (R.i + 1) % n;
      else if (k === 'up') R.i = r > 0 ? R.i - cols : Math.min(n - 1, 2 * cols + c); else if (k === 'down') R.i = r < 2 ? Math.min(n - 1, R.i + cols) : c;
      else if (k === 'a') pulsar(); else if (k === 'b') del(); else if (k === 'start') fin = true;
      if (['left', 'right', 'up', 'down'].includes(k)) sfx.move();
    }
  } finally { typing = null; window.onCanvasTap = null; }
  if (!sc.name) sc.name = 'NIA'; sc.rej = null; sfx.sel();
}
// ── menú principal ──
const fmtT = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' T';
async function startMenu() {
  busy++; sfx.sel();
  const info = { draw() { const w = Math.max(tw_(world.area), tw_(fmtT(G.money)) + 8) + 16; box(0, 106, w, 38, { ac: '#f0c020' }); txt(world.area, 7, 113); txt(PHASE_N[dayPhase()], 7, 123, '#806020'); bolt(7, 133, '#c09018'); txt(fmtT(G.money), 14, 133, '#404050'); } }; ui.push(info);
  let sel = 0;
  for (;;) {
    const r = await menu(['MANUAL', 'EQUIPO', 'MOCHILA', 'FUSIBLES', 'MAPA', 'OPCIONES', 'GUARDAR', 'SALIR'], { sel, w: 70 }); sel = r;
    if (r === 0) await manualScreen(); else if (r === 1) await partyScreen('view'); else if (r === 2) await bagScreen(); else if (r === 3) await fuseScreen(); else if (r === 4) await mapScreen(); else if (r === 5) await optionsScreen();
    else if (r === 6) { G.x = world.pl.x; G.y = world.pl.y; G.dir = world.pl.dir; if (saveGame()) { sfx.save(); await say('Partida guardada. El Pulso recordará dónde estabas.'); } dlgOff(); break; }
    else break;
  }
  ui.splice(ui.indexOf(info), 1); busy--;
}
// ── cuadro de fusibles: seis diferenciales que se van subiendo ──
async function fuseScreen() {
  const sc = { t: 0, draw() {
    this.t++; g.fillStyle = '#d8d4c4'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 4) { g.fillStyle = '#ccc8b8'; g.fillRect(0, y, W, 1); }
    box(4, 3, W - 8, 25, { ac: '#f0c020' }); txtC('CUADRO DE FUSIBLES', 80, 8); txtC(`${G.fusibles.length} de 6`, 80, 17, '#806020');
    g.fillStyle = '#3a3a44'; g.fillRect(8, 30, W - 16, 90); g.fillStyle = '#56565f'; g.fillRect(9, 31, W - 18, 1); g.fillStyle = '#26262e'; g.fillRect(9, 118, W - 18, 1);
    FUSIBLES.forEach(([t, who, where], i) => {
      const x = 13 + i * 23, y = 36, on = G.fusibles.includes(t), ty = TYPES[t];
      g.fillStyle = INK; g.fillRect(x, y, 20, 46); g.fillStyle = '#f4f0e0'; g.fillRect(x + 1, y + 1, 18, 44);
      g.fillStyle = on ? ty.c : '#a8a498'; g.fillRect(x + 1, y + 1, 18, 4);
      g.fillStyle = '#26262e'; g.fillRect(x + 7, y + 10, 6, 26); const ly = on ? y + 11 : y + 27; g.fillStyle = on ? ty.d : '#707074'; g.fillRect(x + 5, ly, 10, 8); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x + 5, ly, 10, 1);
      g.fillStyle = on ? (((this.t >> 4) + i) % 5 ? '#58f890' : '#a8ffc8') : '#5a2a2a'; g.fillRect(x + 8, y + 39, 4, 3);
      g.fillStyle = on ? '#f8f0c0' : '#505058'; g.fillRect(x + 8, y + 51, 4, 4);
      g.fillStyle = on ? ty.c : '#505058'; g.fillRect(x + 2, y + 61, 16, 3);
    });
    const k = G.fusibles.length, ls = wrap(k === 6 ? '¡El cuadro entero! La Gran Fábrica te espera.' : k ? `Siguiente: ${FUSIBLES.find(f => !G.fusibles.includes(f[0]))[2]}.` : 'Ningún diferencial arriba. Todavía.', W - 16);
    box(0, 120, W, 24); ls.forEach((l, i) => txt(l, 8, (ls.length > 1 ? 125 : 129) + i * 9));
  } };
  ui.push(sc); sfx.sel(); await wait(4); await anyKey(); sfx.back(); ui.splice(ui.indexOf(sc), 1);
}
// ── BANCO DE CARGA (equipo) ── modo: 'view' | 'pick' (devuelve índice o -1)
// La primera celda es grande y en vertical: es la que va contigo por el mapa. Las otras cinco, en el banco.
let BANCO_BG = null;
function bancoBg() {
  if (BANCO_BG) return BANCO_BG; const [c, x] = mk(W, H), r = rng(31);
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) P(x, i, y, bay(i, y) > .9 ? '#1e2c3c' : '#182432');
  const pads = []; for (let k = 0; k < 16; k++) { let px = Math.floor(r() * 40) * 4, py = Math.floor(r() * 30) * 4; const len = 4 + Math.floor(r() * 8);
    for (let j = 0; j < len; j++) { const d = r() < .5 ? [4, 0] : [0, 4]; for (let q = 0; q < 4; q++) P(x, px + d[0] * q / 4, py + d[1] * q / 4, '#28405a'); px += d[0]; py += d[1]; } R(x, px - 1, py - 1, 3, 3, '#36587a'); P(x, px, py, '#1c2c3c'); pads.push([px, py]); }
  return BANCO_BG = c;
}
const SLOT = i => i === 0 ? { x: 3, y: 6, w: 64, h: 113 } : { x: 71, y: 3 + (i - 1) * 23, w: 84, h: 21 };
function drawCell(i, m, st) {
  const { x, y, w, h } = SLOT(i), on = st.sel === i, mv = st.moving === i, ox = mv ? -3 : 0, oy = mv ? -2 : 0, X = x + ox, Y = y + oy;
  const dead = m && m.hp <= 0, body = !m ? '#2a3848' : dead ? '#8c8c90' : '#e8e4d0', edge = on ? (st.moving >= 0 ? '#58e890' : '#f8d030') : !m ? '#3a4c60' : INK;
  // casquillo de la pila
  g.fillStyle = edge; if (i === 0) g.fillRect(X + w / 2 - 9, Y - 4, 18, 5); else g.fillRect(X + w, Y + h / 2 - 5, 4, 10);
  g.fillStyle = !m ? '#3a4c60' : '#b8bcc8'; if (i === 0) g.fillRect(X + w / 2 - 8, Y - 3, 16, 3); else g.fillRect(X + w, Y + h / 2 - 4, 3, 8);
  g.fillStyle = edge; g.fillRect(X + 1, Y, w - 2, h); g.fillRect(X, Y + 1, w, h - 2);
  g.fillStyle = body; g.fillRect(X + 2, Y + 1, w - 4, h - 2); g.fillRect(X + 1, Y + 2, w - 2, h - 4);
  if (!m) { txtC('vacía', X + w / 2, Y + h / 2 - 4, '#4c6078'); return; }
  const tc = TYPES[SPECIES[m.sp].t]; g.fillStyle = dead ? '#707074' : tc.c; if (i === 0) g.fillRect(X + 2, Y + 2, w - 4, 3); else g.fillRect(X + 2, Y + 2, 3, h - 4);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(X + 2, Y + 1, w - 4, 1);
  if (mv) { g.fillStyle = '#58e890'; for (let k = 0; k < w; k += 4) if (((k >> 2) + (frame >> 3)) & 1) { g.fillRect(X + k, Y - 2, 2, 1); g.fillRect(X + k, Y + h + 1, 2, 1); } }
  const b = on && !dead && (frame % 30 < 15) ? 1 : 0, name = monName(m), nc = dead ? '#505058' : INK;
  if (i === 0) {
    if (!dead) { g.fillStyle = on ? '#fff8d8' : '#f4f0e0'; g.fillRect(X + 6, Y + 7, w - 12, 41); }
    g.globalAlpha = dead ? .45 : 1; drawMon(m.sp, on && frame % 60 < 8 ? 'f1' : 'f0', X + w / 2, Y + 48 - b, { sx: .78, sy: .78 }); g.globalAlpha = 1;
    txtC(name, X + w / 2, Y + 51, nc); typeTag(SPECIES[m.sp].t, X + w / 2 - 21, Y + 61, 42);
    const lw = tw_('Nv') + 2 + tw_(String(m.lv)); lvTag(m.lv, X + w / 2 - lw / 2, Y + 73, '#606070');
    ledBar(X + 6, Y + 83, w - 12, 6, m.hp / m.max, dead);
    if (dead) txtC('SIN PULSO', X + w / 2, Y + 92, '#c03020'); else if (m.status) statusChip(X + w / 2 - 15, Y + 91); else txtC(`${m.hp}/${m.max}`, X + w / 2, Y + 92, '#404050');
    g.fillStyle = dead ? '#707074' : '#c8c0a8'; g.fillRect(X + 6, Y + 102, w - 12, 1); txtC(dead ? 'descansa' : 'te sigue', X + w / 2, Y + 105, '#8c8070');
  } else {
    g.globalAlpha = dead ? .45 : 1; g.drawImage(MON[m.sp].ow, X + 4, Y + 3 - b); g.globalAlpha = 1;
    if (m.status && !dead) { bolt(X + 15, Y + 1, '#f0a020'); }
    txt(name, X + 22, Y + 3, nc); lvTag(m.lv, X + 22, Y + 12, '#606070'); ledBar(X + 46, Y + 13, w - 50, 5, m.hp / m.max, dead);
  }
}
async function partyScreen(mode, o = {}) {
  const st = { sel: o.sel ?? 0, moving: -1, msg: o.msg || (mode === 'pick' ? 'Elige un Makinamon.' : 'BANCO DE CARGA'), lastR: 1 };
  const sc = { draw() {
    g.drawImage(bancoBg(), 0, 0);
    const px = (frame * 1.2) % 200; g.fillStyle = '#58e890'; g.fillRect(Math.round(68 + Math.sin(px * .05) * 1), Math.round(px % 120), 1, 3);
    for (let i = 0; i < 6; i++) drawCell(i, G.party[i], st);
    // cable que une la primera con el banco
    g.fillStyle = '#58e890'; for (let i = 1; i < G.party.length; i++) { const s2 = SLOT(i); if (((frame >> 2) + i) % 6 < 3) g.fillRect(68, s2.y + 10, 2, 1); }
    box(0, 120, W, 24, { ac: st.moving >= 0 ? '#58e890' : '#3aa89a' }); txt(st.moving >= 0 ? '¿A qué celda lo mueves?' : st.msg, 8, 129);
    if (mode === 'view' && st.moving < 0) txtR('A: opciones', W - 8, 129, '#909098');
  } };
  ui.push(sc); await wait(1); let res = -1;
  const n = () => G.party.length;
  for (;;) {
    const k = await key('up', 'down', 'left', 'right', 'a', 'b');
    if (k === 'left' || k === 'right') { if (st.sel === 0 && n() > 1) st.sel = Math.min(st.lastR, n() - 1); else if (st.sel > 0) { st.lastR = st.sel; st.sel = 0; } sfx.move(); }
    else if (k === 'up' || k === 'down') { if (n() > 1) { const d = k === 'up' ? -1 : 1; st.sel = st.sel === 0 ? (d > 0 ? 1 : n() - 1) : (st.sel - 1 + d + n() - 1) % (n() - 1) + 1; sfx.move(); } }
    else if (k === 'b') {
      if (st.moving >= 0) { st.moving = -1; sfx.back(); continue; }
      if (o.force) { sfx.bump(); continue; } sfx.back(); break;
    } else {
      if (st.moving >= 0) {
        const a = st.moving, b = st.sel; st.moving = -1;
        if (a !== b) { [G.party[a], G.party[b]] = [G.party[b], G.party[a]]; sfx.lock(); flash('#58e890', .25); for (const i of [a, b]) { const s2 = SLOT(i); burst(s2.x + s2.w / 2, s2.y + s2.h / 2, 8, { c: ['#58e890', '#fff'], v0: .6, v1: 1.8 }); } } else sfx.back();
        continue;
      }
      sfx.sel();
      if (mode === 'pick') { if (o.valid && !o.valid(G.party[st.sel], st.sel)) { sfx.bump(); continue; } res = st.sel; break; }
      const sl = SLOT(st.sel), r = await menu(['DATOS', 'MOVER', 'ATRÁS'], { x: st.sel === 0 ? 70 : 2, y: st.sel === 0 ? 40 : Math.min(76, sl.y), w: 62 });
      if (r === 0) await summary(G.party[st.sel]);
      else if (r === 1) { if (n() < 2) { sfx.bump(); continue; } st.moving = st.sel; sfx.sel(); }
    }
  }
  ui.splice(ui.indexOf(sc), 1); return res;
}
// ── ficha: dos páginas (DATOS y ATAQUES) ──
async function summary(m) {
  const S2 = SPECIES[m.sp], st = { p: 0, s: 0 }, sc = { t: 0, draw() {
    this.t++; blueprint(0, 0, W, H); const b = this.t % 80 < 10;
    // pestañas
    ['DATOS', 'ATAQUES'].forEach((n, i) => { const x = 4 + i * 52, on = st.p === i; g.fillStyle = on ? '#f8e070' : '#1c4888'; g.fillRect(x, 2, 48, 11); txtC(n, x + 24, 4, on ? INK : '#a8c8f0'); });
    txtR('◀ ▶', W - 5, 4, '#a8c8f0');
    if (st.p === 0) {
      g.strokeStyle = '#a8c8f0'; g.lineWidth = 1; g.strokeRect(4.5, 16.5, 62, 58); drawMon(m.sp, b ? 'f1' : 'f0', 36, 72);
      txt(S2.n, 72, 19, '#fff'); lvTag(m.lv, 72, 30, '#a8d0f8'); g.fillStyle = '#fff'; typeTag(S2.t, 112, 29, 42);
      txt('PS', 72, 43, '#a8d0f8'); txtR(`${m.hp}/${m.max}`, 154, 43, '#fff'); ledBar(72, 53, 82, 6, m.hp / m.max);
      if (m.status) statusChip(72, 62);
      [['ATAQUE', m.atk], ['DEFENSA', m.def], ['VELOCIDAD', m.spd]].forEach(([n, v], i) => { txt(n, 8, 82 + i * 11, '#a8d0f8'); txtR(v, 74, 82 + i * 11, '#fff'); });
      const need = m.lv >= 100 ? 0 : (m.lv + 1) ** 3 - m.xp; txt('SIG. NV', 86, 82, '#a8d0f8'); txtR(need, 154, 82, '#fff');
      const ev = S2.evo; txt('REFORJA', 86, 93, '#a8d0f8'); txtR(ev ? 'nv ' + ev.lv : '—', 154, 93, '#fff');
      txt('VÍNCULO', 86, 104, '#a8d0f8'); for (let i = 0; i < 5; i++) { const a = afecto(m); g.globalAlpha = a >= (i + 1) * 51 ? 1 : a >= i * 51 + 25 ? .55 : .2; g.drawImage(emoIcon('corazon'), 104 + i * 10, 112); } g.globalAlpha = 1;
      txt('Makinamon' + S2.kind.slice(3), 8, 120, '#f8e070'); txt(`${S2.alt} · ${S2.peso}`, 8, 131, '#a8d0f8');
    } else {
      m.moves.forEach((mv, i) => {
        const M2 = MOVES[mv], y = 15 + i * 19, on = st.s === i;
        g.fillStyle = on ? '#285aa8' : '#1c4888'; g.fillRect(4, y, W - 8, 17); g.fillStyle = TYPES[M2.t].c; g.fillRect(4, y, 3, 17);
        if (on) { g.strokeStyle = '#f8e070'; g.strokeRect(4.5, y + .5, W - 9, 16); txt('▶', 9, y + 5, '#f8e070'); }
        txt(M2.n, on ? 17 : 11, y + 5, '#fff'); typeTag(M2.t, W - 48, y + 4, 42);
      });
      const M2 = MOVES[m.moves[st.s] || m.moves[0]];
      if (M2) {
        g.fillStyle = '#0e2650'; g.fillRect(4, 92, W - 8, 50); g.strokeStyle = '#a8c8f0'; g.strokeRect(4.5, 92.5, W - 9, 49);
        txt(M2.k === 'estado' ? 'ESTADO' : `POT ${M2.pow}`, 9, 96, '#f8e070'); txt(`PRE ${M2.acc}`, 62, 96, '#a8d0f8');
        txtR(M2.k === 'golpe' ? 'cuerpo' : M2.k === 'tiro' ? 'tiro' : 'apoyo', W - 9, 96, '#7898c8');
        g.fillStyle = '#245294'; g.fillRect(8, 106, W - 16, 1);
        wrap(M2.d, 142).slice(0, 3).forEach((l, i) => txt(l, 9, 110 + i * 10, '#e8f0ff'));
      }
    }
  } };
  ui.push(sc); sfx.cry(S2.cry); await wait(4);
  for (;;) {
    const k = await key('up', 'down', 'left', 'right', 'a', 'b');
    if (k === 'left' || k === 'right') { st.p ^= 1; sfx.move(); }
    else if ((k === 'up' || k === 'down') && st.p === 1 && m.moves.length > 1) { st.s = (st.s + (k === 'up' ? -1 : 1) + m.moves.length) % m.moves.length; sfx.move(); }
    else if (k === 'a' || k === 'b') break;
  }
  sfx.back(); ui.splice(ui.indexOf(sc), 1);
}
// ── manual de instrucciones y tabla de tipos ──
async function manualPage(sp, o = {}) {
  const S2 = SPECIES[sp], full = G.got[sp], num = DEX.indexOf(sp) + 1, lines = wrap(full ? S2.desc : 'Acóplalo para rellenar esta página.', 150);
  const sc = { t: 0, in: 0, draw() {
    this.t++; blueprint(0, 0, W, H); const k = this.in;
    g.strokeStyle = '#a8c8f0'; g.strokeRect(5.5, 2.5, 62, 56); g.fillStyle = '#a8c8f0'; g.fillRect(70, 4, 1, 53); g.fillRect(68, 4, 5, 1); g.fillRect(68, 56, 5, 1);
    drawMon(sp, this.t % 80 < 10 ? 'f1' : 'f0', 37, 57, { dark: !full, sx: k, sy: k });
    txt(`Nº ${String(num).padStart(2, '0')}`, 78, 6, '#f8e070'); txt(S2.n, 78, 17, '#fff');
    if (full) { txt(S2.kind, 78, 28, '#a8d0f8'); typeTag(S2.t, 78, 36, 40); txt(S2.alt, 78, 49, '#fff'); txtR(S2.peso, 154, 49, '#fff'); }
    lines.forEach((l, i) => txt(l, 5, 63 + i * 9, '#e8f0ff'));
    if (full) { const wl = wrap(S2.warn, 132), bh = wl.length * 9 + 6, by = 142 - bh; g.fillStyle = '#f8e070'; g.fillRect(4, by, W - 8, bh); g.fillStyle = INK; g.fillRect(5, by + 1, W - 10, bh - 2); g.fillStyle = '#f8e070'; g.fillRect(8, by + 4, 9, 9); txt('!', 11, by + 5, INK); wl.forEach((l, i) => txt(l, 20, by + 5 + i * 9, '#f8e070')); }
    if (o.stamp && this.t > 30) { const s = Math.max(1.5, 4 - (this.t - 30) / 4); const im = bigText('ACOPLADO', 1, '#f85858', 1); g.save(); g.translate(112, 62); g.rotate(-.2); g.strokeStyle = '#f85858'; g.strokeRect(-im.width * s / 2 - 3, -8 * s, im.width * s + 6, 14 * s); g.drawImage(im, -im.width * s / 2, -6 * s, im.width * s, 12 * s); g.restore(); if (this.t === 40) { sfx.clamp(); shake(3); } }
  } };
  ui.push(sc); if (full) sfx.cry(S2.cry); await tw(sc, { in: 1 }, 14, 'back'); await wait(o.stamp ? 60 : 4); await anyKey(); sfx.back(); ui.splice(ui.indexOf(sc), 1);
}
function drawTypeRow(list, x, y) {
  if (!list.length) { txt('— ninguno —', x, y + 1, '#7898c8'); return; }
  let cx = x;
  for (const t of list) { const w = Math.max(30, tw_(TYPES[t].n) + 4); typeTag(t, cx, y, w); cx += w + 2; }
}
async function typeChartTab(st) {
  const tks = Object.keys(TYPES), sc = { draw() {
    blueprint(0, 0, W, H);
    ['MANUAL', 'TIPOS'].forEach((n, i) => { const x = 4 + i * 52, on = i === 1; g.fillStyle = on ? '#f8e070' : '#1c4888'; g.fillRect(x, 2, 48, 11); txtC(n, x + 24, 4, on ? INK : '#a8c8f0'); });
    txtR('◀ ▶', W - 5, 4, '#a8c8f0');
    tks.forEach((tk, i) => {
      const y = 18 + i * 18, on = st.ts === i;
      if (on) { g.fillStyle = '#f8e070'; g.fillRect(2, y - 2, 46, 13); txt('▶', 4, y + 1, INK); typeTag(tk, 11, y, 36); }
      else typeTag(tk, 6, y, 38);
    });
    const cur = tks[st.ts], atk2 = tks.filter(d => eff(cur, d) > 1), atkH = tks.filter(d => eff(cur, d) < 1), def2 = tks.filter(a => eff(a, cur) > 1), defH = tks.filter(a => eff(a, cur) < 1);
    g.fillStyle = '#0e2650'; g.fillRect(50, 16, 106, 124); g.strokeStyle = '#a8c8f0'; g.strokeRect(50.5, 16.5, 105, 123);
    txt('ATACANDO', 55, 20, '#f8e070');
    txt('×2 EFICAZ:', 55, 31, '#78f098'); drawTypeRow(atk2, 55, 40);
    txt('×½ FLOJO:', 55, 53, '#f8b878'); drawTypeRow(atkH, 55, 62);
    g.fillStyle = '#245294'; g.fillRect(54, 76, 98, 1);
    txt('DEFENDIENDO', 55, 80, '#f8e070');
    txt('×2 DÉBIL A:', 55, 91, '#f88888'); drawTypeRow(def2, 55, 100);
    txt('×½ RESISTE:', 55, 113, '#88d0f8'); drawTypeRow(defH, 55, 122);
  } };
  ui.push(sc); await wait(1); let res = 'exit';
  for (;;) {
    const k = await key('up', 'down', 'left', 'right', 'b');
    if (k === 'up' || k === 'down') { st.ts = (st.ts + (k === 'up' ? -1 : 1) + tks.length) % tks.length; sfx.move(); }
    else if (k === 'left' || k === 'right') { sfx.move(); res = 'manual'; break; }
    else { sfx.back(); break; }
  }
  ui.splice(ui.indexOf(sc), 1); return res;
}
async function manualScreen() {
  const st = { sel: 0, ts: 0, tab: 0 };
  for (;;) {
    if (st.tab === 1) { if (await typeChartTab(st) === 'manual') { st.tab = 0; continue; } break; }
    const items = DEX.map((sp, i) => ({ t: `${String(i + 1).padStart(2, '0')} ${G.seen[sp] ? SPECIES[sp].n : '- - - - -'}`, r: G.got[sp] ? '●' : G.seen[sp] ? '○' : '', dis: !G.seen[sp] }));
    const hd = { s: st.sel, draw() { blueprint(0, 0, W, H); txtC('MANUAL', 133, 5, '#f8e070'); const sp = DEX[this.s || 0]; g.strokeStyle = '#a8c8f0'; g.strokeRect(108.5, 16.5, 49, 50); if (G.seen[sp]) drawMon(sp, (frame % 80) < 10 ? 'f1' : 'f0', 133, 64, { dark: !G.got[sp], sx: .85, sy: .85 }); else txtC('?', 133, 38, '#a8c8f0');
      txt('○', 110, 72, '#fff'); txt('vistos', 117, 72, '#a8d0f8'); txtR(Object.keys(G.seen).length, 157, 83, '#fff'); txt('●', 110, 96, '#f8e070'); txt('acopl.', 117, 96, '#a8d0f8'); txtR(Object.keys(G.got).length, 157, 107, '#f8e070');
      g.fillStyle = '#1c4888'; g.fillRect(108, 124, 50, 15); g.strokeStyle = '#f8e070'; g.strokeRect(108.5, 124.5, 49, 14); txtC('◀▶ TIPOS', 133, 128, '#f8e070'); } };
    ui.push(hd);
    const r = await menu(items, { x: 0, y: 0, w: 106, lh: 14, rows: 9, sel: st.sel, keys: ['left', 'right'], onMove: s => { hd.s = st.sel = s; } }); ui.splice(ui.indexOf(hd), 1);
    if (r === 'left' || r === 'right') { st.tab = 1; sfx.move(); continue; }
    if (r < 0) break; st.sel = r; await manualPage(DEX[r]);
  }
}
async function diplomaScreen() {
  const lead = (G.party[0] && G.party[0].sp) || 'fulgor', sc = { t: 0, a: 0, draw() {
    this.t++; g.globalAlpha = this.a;
    g.fillStyle = '#1c1828'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#c89020'; g.fillRect(3, 3, W - 6, H - 6); g.fillStyle = INK; g.fillRect(5, 5, W - 10, H - 10);
    g.fillStyle = '#f8f2dc'; g.fillRect(6, 6, W - 12, H - 12); g.strokeStyle = '#d8b050'; g.strokeRect(8.5, 8.5, W - 17, H - 17);
    for (const [bx, by] of [[10, 10], [W - 13, 10], [10, H - 13], [W - 13, H - 13]]) { g.fillStyle = '#c89020'; g.fillRect(bx, by, 3, 3); g.fillStyle = INK; g.fillRect(bx + 1, by + 1, 1, 1); }
    txtC('★ DIPLOMA MAKINISTA ★', 80, 13, '#985810');
    txtC('TALLER DE PUEBLO BOBINA', 80, 24, '#786850');
    g.fillStyle = '#d8b050'; g.fillRect(20, 33, W - 40, 1);
    txtC(`Otorgado a ${G.name}`, 80, 38, INK);
    txtC('por escuchar y acoplar', 80, 50, '#404050');
    txtC('a los 50 Makinamon', 80, 60, '#404050');
    txtC('del valle del Pulso.', 80, 70, '#404050');
    g.drawImage(CHARS.nia, 0, 0, 16, 16, 14, 96, 32, 32);
    drawMon(lead, this.t % 60 < 10 ? 'f1' : 'f0', 62, 130, { sx: .7, sy: .7 });
    g.fillStyle = '#c03828'; g.fillRect(92, 86, 54, 21); g.fillStyle = '#f8e070'; g.strokeStyle = '#f8e070'; g.strokeRect(93.5, 87.5, 51, 18);
    txtC('50 / 50', 119, 89, '#f8e070'); txtC('COMPLETO', 119, 98, '#fff');
    txtC('Prof.ª ESTAÑO', 118, 118, '#2458a4');
    if (this.t > 30 && ((this.t >> 4) & 1)) txtR('▼', 148, 128, '#985810');
    g.globalAlpha = 1;
  } };
  ui.push(sc); music(''); const f = jingle('reforja'); await tw(sc, { a: 1 }, 20, 'lin');
  burst(80, 30, 32, { c: ['#f8e070', '#58e890', '#58b8f8', '#f86858'], v0: 1, v1: 3.5, kind: 'star', l0: 18, l1: 42 });
  await wait(f); await anyKey(); sfx.sel(); await tw(sc, { a: 0 }, 14, 'lin'); ui.splice(ui.indexOf(sc), 1);
  music(MAPS[G.map].area(world.pl.y)[1]);
}
// ── mochila ── en combate devuelve {item, target}
const itemValid = it => it.heal ? m => m.hp > 0 && m.hp < m.max : it.cure ? m => m.hp > 0 && m.status : it.revive ? m => m.hp <= 0 : null;
async function applyItem(id, t) {
  const it = ITEMS[id], m = G.party[t]; G.bag[id]--; darAfecto(m, 2);
  if (it.heal) { m.hp = Math.min(m.max, m.hp + it.heal); sfx.heal(); return `¡${monName(m)} recupera PS!`; }
  if (it.cure) { m.status = null; sfx.statUp(); return `¡${monName(m)} sale del CORTO!`; }
  if (it.revive) { m.hp = Math.floor(m.max / 2); m.status = null; sfx.heal(); return `¡${monName(m)} vuelve a tener Pulso!`; }
}
// la mochila está en mochila.js
// ── ferretería ──
async function shop(list, o = {}) {
  busy++; await say(o.hello || '¡Bienvenido a la FERRETERÍA! ¿Qué te pongo?'); 
  let sel = 0;
  for (;;) {
    const items = list.map(k => ({ t: ITEMS[k].n, r: ITEMS[k].price + '' }));
    const ds = { s: 0, draw() { box(0, 100, W, 44); const ls = wrap(ITEMS[list[this.s]].d, 144).slice(0, 3), tres = ls.length > 2, my = tres ? 133 : 130; ls.forEach((l, i) => txt(l, 8, (tres ? 105 : 108) + i * (tres ? 9 : 11))); txt(`Tienes: ${G.bag[list[this.s]] || 0}`, 8, my, '#806020'); const mt = fmtT(G.money); txtR(mt, W - 8, my, '#404050'); bolt(W - 15 - tw_(mt), my, '#c09018'); } };
    ui.push(ds); dlg.on = false;
    const r = await menu(items, { x: 34, y: 0, w: 126, sel, onMove: s => ds.s = s }); ui.splice(ui.indexOf(ds), 1);
    if (r < 0) break; sel = r;
    const id = list[r], pr = ITEMS[id].price, max = Math.min(99, Math.floor(G.money / pr));
    if (!max) { await say('Te faltan tuercas. Aquí no se fía, que esto es una ferretería seria.'); continue; }
    let q = 1; const qd = { draw() { box(W - 84, 62, 84, 36, { ac: '#f0c020' }); txt(`× ${q}`, W - 76, 70); txtR(fmtT(q * pr), W - 8, 70, '#404050'); txtC('◀ ▶ cantidad', W - 42, 83, '#909098'); } };
    ui.push(qd); await say(`${ITEMS[id].n}. ¿Cuántos?`, { hold: true });
    let ok = false;
    for (;;) { const k = await key('left', 'right', 'up', 'down', 'a', 'b'); if (k === 'a') { ok = true; break; } if (k === 'b') break; q = clamp(q + (k === 'right' ? 1 : k === 'left' ? -1 : k === 'up' ? 10 : -10), 1, max); sfx.move(); }
    ui.splice(ui.indexOf(qd), 1);
    if (!ok) { sfx.back(); continue; }
    G.money -= q * pr; G.bag[id] = (G.bag[id] || 0) + q; sfx.save();
    if (id === 'celda' && q >= 10) { G.bag.celdaplus = (G.bag.celdaplus || 0) + 1; await say('Por llevarte diez, te regalo una CELDA PLUS. No se lo digas al jefe.'); }
    else await say('¡Hecho! Que te duren.');
  }
  await say(o.bye || '¡Vuelve cuando se te afloje algo!'); dlgOff(); busy--;
}

// ── almacén del taller (por el cable de cualquier POSTE DE CARGA) ──
// el ALMACÉN está en poste.js

// ── opciones ──
window.OPT = Object.assign({ text: 1, mute: false }, (() => { try { return JSON.parse(localStorage.getItem('makinamon-opt') || '{}'); } catch (e) { return {}; } })());
if (OPT.mute) muted = true;
async function optionsScreen() {
  const TS = [[1, 'NORMAL'], [2, 'RÁPIDO'], [4, 'INSTANTE']];
  for (;;) {
    const items = [{ t: 'TEXTO', r: (TS.find(t => t[0] === OPT.text) || TS[0])[1] }, { t: 'SONIDO', r: muted ? 'NO' : 'SÍ' }, 'VOLVER'];
    const r = await menu(items, { x: W - 110, y: 0, w: 110 }); if (r < 0 || r === 2) break;
    if (r === 0) { const i = Math.max(0, TS.findIndex(t => t[0] === OPT.text)); OPT.text = TS[(i + 1) % TS.length][0]; }
    if (r === 1) toggleMute();
    try { localStorage.setItem('makinamon-opt', JSON.stringify(OPT)); } catch (e) {} sfx.sel();
  }
}
// ── mapa del valle ──
const VALLE = [ // [nombre, x, y, mapas que cuentan como «aquí»]
  ['PUEBLO BOBINA', 26, 112, ['pueblo', 'taller']], ['RUTA 2', 26, 88, ['ruta2', 'central']], ['CIUDAD DINAMO', 52, 76, ['ciudad', 'subestacion', 'ferreteria', 'casaReloj', 'casaVerde', 'casaRosa', 'estacion', 'torre', 'torre2', 'torre3']],
  ['RUTA 3', 52, 98, ['ruta3']], ['PUERTO ROÑA', 52, 120, ['puerto', 'astillero', 'barco', 'lonja', 'casaPescador', 'casaFaro']], ['RUTA 4', 32, 128, ['ruta4']], ['VILLA MUSGO', 12, 128, ['villa', 'invernadero', 'casaMusgo', 'casaTallo', 'casaSemilla']],
  ['RUTA 5', 80, 76, ['ruta5']], ['POBLADO IMANTA', 106, 76, ['poblado', 'mina', 'salaImanta', 'casaMinera', 'casaJacinto']], ['RUTA 6', 126, 88, ['ruta6']], ['FRAGUA', 144, 100, ['fragua', 'forja', 'herreria', 'casaFragua', 'casaYunque']],
  ['RUTA 7', 144, 72, ['ruta7']], ['TERMAS NIEBLA', 144, 46, ['termas', 'balneario', 'caldera', 'casaTermas', 'casaVapor']], ['CAMINO DEL RAYO', 112, 30, ['camino']], ['GRAN FÁBRICA', 80, 18, ['fabrica', 'fabrica1', 'camara']],
];
const VALLE_LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [2, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14]];
async function mapScreen() {
  const here = VALLE.findIndex(v => v[3].includes(G.map)), visto = i => VALLE[i][3].some(m => G.flags['v_' + m]) || i === here;
  const sc = { s: Math.max(0, here), draw() {
    g.fillStyle = '#2a4c38'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 2) for (let x = (y >> 1) & 1; x < W; x += 4) { g.fillStyle = '#305844'; g.fillRect(x, y, 1, 1); }
    g.fillStyle = '#3c78a8'; g.fillRect(0, 132, 70, 12); g.fillRect(40, 124, 30, 8); g.fillStyle = '#5c4c44'; g.fillRect(110, 92, 50, 52);
    for (const [a, b] of VALLE_LINKS) { const A = VALLE[a], B2 = VALLE[b]; g.strokeStyle = visto(a) && visto(b) ? '#e8d8a8' : '#4c6c58'; g.lineWidth = 2; g.beginPath(); g.moveTo(A[1], A[2]); g.lineTo(B2[1], B2[2]); g.stroke(); }
    VALLE.forEach(([n, x, y], i) => { const v = visto(i), town = !n.startsWith('RUTA') && !n.startsWith('CAMINO'); g.fillStyle = INK; g.fillRect(x - 4, y - 4, 9, 9); g.fillStyle = !v ? '#4c6c58' : town ? '#f8e070' : '#e8d8a8'; g.fillRect(x - 3, y - 3, 7, 7);
      if (i === here && (frame >> 4) & 1) { g.fillStyle = '#e84838'; g.fillRect(x - 2, y - 2, 5, 5); } if (i === this.s) { g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(x - 5.5, y - 5.5, 12, 12); } });
    const [n] = VALLE[this.s]; box(0, 0, W, 16, { ac: '#f0c020' }); txtC(visto(this.s) ? n : '¿ ? ?', 80, 5);
    txt('◀ ▶ moverse', 4, 134, '#a8d0b8');
  } };
  ui.push(sc); sfx.sel(); await wait(2);
  for (;;) { const k = await key('left', 'right', 'up', 'down', 'a', 'b'); if (k === 'a' || k === 'b') break; sc.s = (sc.s + (k === 'right' || k === 'down' ? 1 : -1) + VALLE.length) % VALLE.length; sfx.move(); }
  sfx.back(); ui.splice(ui.indexOf(sc), 1);
}
