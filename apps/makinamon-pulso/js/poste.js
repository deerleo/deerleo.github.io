'use strict';
// ───────── POSTE DE CARGA: terminal para recargar y para el ALMACÉN del taller ─────────
const PT = { bg: '#0b1719', bg2: '#10242a', fos: '#58f0b0', fos2: '#2a8c6c', tinta: '#cfffe8', ac: '#30b8a8', amb: '#f8d030' };
function crt(t) { // líneas de barrido, rejilla y viñeta
  g.fillStyle = 'rgba(88,240,176,.05)'; for (let x = 0; x < W; x += 8) g.fillRect(x, 0, 1, H); for (let y = 0; y < H; y += 8) g.fillRect(0, y, W, 1);
  g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = (t >> 1) & 1; y < H; y += 2) g.fillRect(0, y, W, 1);
  const by = (t * 1.3) % (H + 30) - 15; g.fillStyle = 'rgba(88,240,176,.05)'; g.fillRect(0, by, W, 10);
}
function cabecera(tit, sub, t) {
  g.fillStyle = PT.ac; g.fillRect(0, 0, W, 13); g.fillStyle = '#8ce0d4'; g.fillRect(0, 0, W, 1); g.fillStyle = '#1c6c64'; g.fillRect(0, 12, W, 1);
  // icono de rayo que late
  g.fillStyle = (t >> 4) & 1 ? '#fff8c0' : PT.amb; for (const [a, b, w] of [[3, 2, 2], [2, 3, 2], [1, 4, 4], [3, 5, 2], [2, 6, 2], [2, 7, 1]]) g.fillRect(3 + a, 1 + b, w, 1);
  txt(tit, 12, 3, INK); if (sub) txtR(sub, W - 4, 3, '#0c3c38');
}
const iconoMon = (m, x, y, k = 1, view = 'icon') => { const im = MON[m.sp][view]; g.drawImage(im, Math.round(x), Math.round(y), Math.round(im.width * k), Math.round(im.height * k)); };
function corazones(m, x, y, sp = 7) { const a = afecto(m); for (let i = 0; i < 5; i++) { g.globalAlpha = a >= (i + 1) * 51 ? 1 : a >= i * 51 + 25 ? .55 : .18; g.drawImage(emoIcon('corazon'), x + i * sp, y); } g.globalAlpha = 1; }
async function encender(on) { // abrir/cerrar la pantalla como una tele de tubo
  const o = { k: on ? 0 : 1 }, sc = { draw() { const k = o.k; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); if (k <= 0) return; const h = Math.max(1, Math.round(H * Math.max(0, (k - .25) / .75))), w = Math.round(W * Math.min(1, k * 4));
    g.fillStyle = PT.bg; g.fillRect((W - w) / 2, (H - h) / 2, w, h); g.fillStyle = k < .3 ? '#ffffff' : 'rgba(207,255,232,.35)'; g.fillRect((W - w) / 2, H / 2 - 1, w, 2); } };
  ui.push(sc); if (on) sfx.wipe(); else snd(t => osc('saw', [800, 60], t, .25, .06, sfxG));
  await tw(o, { k: on ? 1 : 0 }, on ? 14 : 12, on ? 'out' : 'in'); ui.splice(ui.indexOf(sc), 1);
}
// ── la terminal ──
async function poste(x, y) {
  if (!G.party.length) return talk('Un POSTE DE CARGA. Zumba bajito. Sin Makinamon no hay nada que cargar.');
  dlgOff(); const prev = curName; busy++;
  const st = { sel: 0, t: 0, fill: G.party.map(m => m.hp / m.max), flash: G.party.map(() => 0), hop: G.party.map(() => 0), act: -1, cargando: false, msg: '', typed: 0, okSello: 0 };
  const total = () => { const n = G.party.reduce((a, m) => a + m.hp, 0), d = G.party.reduce((a, m) => a + m.max, 0); return Math.round(n / d * 100); };
  const decir = s => { st.msg = s; st.typed = 0; };
  decir(`> ${G.party.length} MAKINAMON CONECTADOS · CARGA ${total()}%`);
  const OPS = ['RECARGAR', 'ALMACÉN', 'SALIR'];
  const SL = i => ({ x: 2 + (i % 3) * 52, y: 15 + Math.floor(i / 3) * 44 });
  const corto = (s, w) => { while (tw_(s) > w) s = s.slice(0, -1); return s; };
  // bahía de carga: cada Makinamon sobre su plataforma, con su pila; la barra de opciones y la consola debajo
  const sc = { draw() {
    const t = ++st.t; g.fillStyle = PT.bg; g.fillRect(0, 0, W, H); crt(t); cabecera('POSTE DE CARGA', null, t);
    // en la cabecera, el electro del equipo: late más alto cuanta más carga hay
    { const tot = G.party.reduce((a, m, i) => a + (st.fill[i] ?? 1) * m.max, 0) / G.party.reduce((a, m) => a + m.max, 0), tx = Math.round(tot * 100) + '%', x0 = 98, w = W - 8 - tw_(tx) - x0; txtR(tx, W - 4, 3, INK); let py = 0;
      for (let i = 0; i < w; i++) { const v = Math.round(([0, 0, 0, -1, 0, 2, -4, 3, 0, 0, 0][(i + (t >> 1)) % 22] || 0) * (.3 + tot * .7)), a = Math.min(py, v), h = Math.abs(v - py) + 1; py = v; g.fillStyle = '#0c3c38'; g.fillRect(x0 + i, 6 + a, 1, h); } }
    for (let i = 0; i < 6; i++) {
      const { x, y } = SL(i), m = G.party[i], act = st.act === i, px = x + 18, py = y + 37;
      g.fillStyle = INK; g.fillRect(x, y, 51, 43); g.fillStyle = m ? PT.bg2 : '#0e1c1e'; g.fillRect(x + 1, y + 1, 49, 41); g.fillStyle = act ? PT.fos : m ? PT.fos2 : '#1c2c2c'; g.fillRect(x + 1, y + 1, 49, 1);
      ell(g, px, py, 14, 3, INK); ell(g, px, py - 1, 13, 3, m ? '#1c4c44' : '#142424');
      if (!m) { txtC('libre', x + 25, y + 14, '#2c4c48'); continue; }
      const k = st.fill[i], lleno = k >= 1, col = k > .5 ? PT.fos : k > .2 ? PT.amb : '#f85858';
      if (act) { // columna de luz, chispas que suben y un rayo desde arriba
        g.globalAlpha = .16 + .1 * Math.sin(t * .5); g.fillStyle = PT.fos; g.fillRect(x + 1, y + 2, 49, 40); g.globalAlpha = .22; g.fillRect(px - 10, y + 2, 20, 34); g.globalAlpha = 1;
        g.fillStyle = '#ffffff'; for (let j = 0; j < 6; j++) g.fillRect(px - 9 + (j * 7) % 19, y + 35 - Math.floor((t * 1.5 + j * 6) % 32), 1, 2);
        if (t % 3) rayito(px + rnd(-6, 6), y + 2, px + rnd(-2, 2), y + 18, PT.fos);
      }
      // aro de la plataforma: gira mientras carga, se queda encendido cuando está llena
      for (let a = 0; a < 16; a++) { if (!(lleno || (act ? a & 1 : a % 4 === 0))) continue; const an = a / 16 * Math.PI * 2 + (act ? t * .2 : 0); g.fillStyle = act ? '#ffffff' : lleno ? PT.fos : PT.fos2; g.fillRect(Math.round(px + Math.cos(an) * 13), Math.round(py - 1 + Math.sin(an) * 3), 1, 1); }
      // la criatura, como te sigue por el mapa; salta al llenarse
      const hop = st.hop[i] > 0 ? Math.round(Math.sin((14 - st.hop[i]) / 14 * Math.PI) * 7) : 0; if (st.hop[i] > 0) st.hop[i]--;
      const bob = act ? (t >> 2) & 1 : (!hop && (t + i * 17) % 90 < 8 ? 1 : 0);
      if (k <= 0) g.globalAlpha = .5; g.drawImage(MON[m.sp].fw, px - 12, py - 23 - hop - bob); g.globalAlpha = 1;
      if (st.flash[i] > 0) { g.globalAlpha = st.flash[i] / 12; g.drawImage(tintC(MON[m.sp], 'fw', '#ffffff'), px - 12, py - 23 - hop - bob); g.globalAlpha = 1; st.flash[i]--; }
      txt(corto(monName(m), 48), x + 2, y + 3, lleno ? PT.tinta : col); if (i === 0) g.drawImage(emoIcon('corazon'), x + 2, y + 13);
      if (m.status === 'corto' && (t >> 3) & 1) g.drawImage(emoIcon('chispa'), x + 26, y + 13);
      // la pila: cinco tramos
      const gx = x + 37, gy = y + 13; g.fillStyle = INK; g.fillRect(gx, gy, 11, 21); g.fillRect(gx + 3, gy - 2, 5, 2); g.fillStyle = '#16302c'; g.fillRect(gx + 1, gy + 1, 9, 19);
      for (let s2 = 0; s2 < 5; s2++) { const f = clamp(k * 5 - s2, 0, 1); if (f <= 0) continue; const sy2 = gy + 17 - s2 * 4; g.globalAlpha = f < 1 ? (act || (t >> 3) & 1 ? .55 : .3) : 1; g.fillStyle = col; g.fillRect(gx + 2, sy2, 7, 3); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(gx + 2, sy2, 2, 3); g.globalAlpha = 1; }
      txtR('Nv' + m.lv, x + 49, y + 35, PT.fos2);
    }
    // opciones
    OPS.forEach((n, i) => { const on = i === st.sel && !st.cargando, x = 1 + i * 53, y = 104 - (on ? 1 : 0);
      g.fillStyle = INK; g.fillRect(x, y, 52, 15 + (on ? 1 : 0)); g.fillStyle = on ? PT.fos : PT.bg2; g.fillRect(x + 1, y + 1, 50, 13 + (on ? 1 : 0)); g.fillStyle = on ? '#c8ffe8' : PT.fos2; g.fillRect(x + 1, y + 1, 50, 1);
      txtC(n, x + 26, y + 5, on ? INK : PT.tinta); if (on && (t >> 4) & 1) { g.fillStyle = PT.fos; g.fillRect(x + 24, y - 3, 5, 1); g.fillRect(x + 25, y - 2, 3, 1); g.fillRect(x + 26, y - 1, 1, 1); } });
    // consola
    g.fillStyle = INK; g.fillRect(0, 120, W, 24); g.fillStyle = '#061012'; g.fillRect(1, 121, W - 2, 22); g.fillStyle = PT.fos2; g.fillRect(1, 121, W - 2, 1);
    st.typed = Math.min(st.msg.length, st.typed + 1); const lines = wrap(st.msg.slice(0, st.typed), W - 12).slice(0, 2);
    lines.forEach((l, i) => txt(l, 6, 124 + i * 9, PT.fos)); if ((t >> 4) & 1) { const ll = lines[lines.length - 1] || ''; g.fillStyle = PT.fos; g.fillRect(6 + tw_(ll) + 1, 124 + (Math.max(1, lines.length) - 1) * 9, 4, 7); }
    // sello de carga completa
    if (st.okSello > 0) { const k = Math.min(1, st.okSello / 10), s2 = 1 + (1 - k) * 1.2, tx = '¡PULSO AL MÁXIMO!', w2 = tw_(tx) + 14; g.save(); g.translate(80, 58); g.scale(s2, s2); g.globalAlpha = k; g.fillStyle = INK; g.fillRect(-w2 / 2 - 1, -10, w2 + 2, 20); g.fillStyle = PT.fos; g.fillRect(-w2 / 2, -9, w2, 18); g.fillStyle = '#c8ffe8'; g.fillRect(-w2 / 2, -9, w2, 2); txtC(tx, 0, -4, INK); g.restore(); g.globalAlpha = 1; if (st.okSello < 70) st.okSello++; else st.okSello = 0; }
  } };
  music('');
  // en el mapa: NIA mira al poste, suben anillos de energía y el orbe da un fogonazo
  world.pl.dir = world.pl.y > y ? 1 : world.pl.y < y ? 0 : world.pl.x < x ? 3 : 2; posteAct = { x, y, t: 0 };
  snd(t => { osc('saw', [120, 900], t, .45, .06, sfxG, { sus: 1 }); for (let i = 0; i < 6; i++) osc('p12', 1500 + i * 300, t + .3 + i * .03, .03, .06, sfxG); });
  await wait(28); flash('#c8ffe8', .5); burst(x * 16 + 8, y * 16 - 25, 14, { w: 1, c: ['#70f8a0', '#ffffff', '#f8e070'], v0: .6, v1: 2, l0: 10, l1: 20, kind: 'star' }); await wait(8);
  await zoomPoste(x, y, true); posteAct = null; ui.push(sc); sfx.sel();
  try {
    for (;;) {
      const k = await key('up', 'down', 'left', 'right', 'a', 'b');
      if (k !== 'a' && k !== 'b') { st.sel = (st.sel + (k === 'up' || k === 'left' ? 2 : 1)) % 3; sfx.move(); continue; }
      if (k === 'b' || st.sel === 2) { sfx.back(); break; }
      if (st.sel === 0) { // RECARGAR
        st.cargando = true; decir('> ENCHUFANDO CELDAS AL PULSO DEL VALLE…'); sfx.clamp(); await wait(20);
        for (let i = 0; i < G.party.length; i++) { const m = G.party[i], from = st.fill[i], falta = from < 1 || !!m.status, n = falta ? 26 : 8; st.act = i; if (falta) sfx.spark();
          for (let f = 1; f <= n; f++) { st.fill[i] = from + (1 - from) * f / n; if (f % 2 === 0) sfx.xp(st.fill[i]); if (falta && f % 9 === 0) sfx.spark(); await wait(1); }
          m.hp = m.max; m.status = null; st.flash[i] = 12; st.hop[i] = 14; st.act = -1; sfx.cry(SPECIES[m.sp].cry, 1.1); darAfecto(m, 1); await wait(10); }
        const f = jingle('carga'); st.cargando = false; st.okSello = 1; decir(`> CARGA 100%. ${monName(G.party[0])} te mira con las pilas puestas.`);
        G.respawn = { map: G.map, x, y: y + 1, dir: 1 }; await wait(Math.min(f, 30));
        continue;
      }
      if (st.sel === 1) { // ALMACÉN
        sfx.sel(); ui.splice(ui.indexOf(sc), 1); await almacen(); st.fill = G.party.map(m => m.hp / m.max); st.flash = G.party.map(() => 0); st.hop = G.party.map(() => 0); ui.push(sc); decir(`> ${G.party.length} MAKINAMON CONECTADOS · CARGA ${total()}%`);
      }
    }
  } finally { ui.splice(ui.indexOf(sc), 1); await zoomPoste(x, y, false); music(prev); busy--; }
}
async function boxScreen() { return almacen(); }

// ── el ALMACÉN: tu equipo a la izquierda, las cajas del taller a la derecha; una garra coge y suelta ──
const CAJA = 20, CW = 22;
async function almacen() {
  const st = { pan: 'box', i: 0, pg: 0, held: null, from: null, t: 0, cx: 0, cy: 0, swing: 0, msg: '', msgT: 0 };
  const pages = () => Math.max(1, Math.ceil((G.box.length + 1) / CAJA));
  const cellPos = (pan, i) => pan === 'eq' ? { x: 3 + (i % 2) * CW, y: 24 + Math.floor(i / 2) * CW } : pan === 'top' ? { x: 118, y: 6 } : { x: 49 + (i % 5) * CW, y: 24 + Math.floor(i / 5) * CW };
  const monAt = (pan, i) => pan === 'eq' ? G.party[i] : pan === 'box' ? G.box[st.pg * CAJA + i] : null;
  const aviso = s => { st.msg = s; st.msgT = 90; };
  { const p = cellPos(st.pan, st.i); st.cx = p.x; st.cy = p.y; }
  const sc = { draw() {
    const t = ++st.t; g.fillStyle = PT.bg; g.fillRect(0, 0, W, H); crt(t); cabecera('ALMACÉN', null, t);
    // selector de caja en la cabecera
    { const cn = `CAJA ${st.pg + 1}/${pages()}`, on = st.pan === 'top', cx = 128, w2 = tw_(cn) + 22; g.fillStyle = on ? '#ffffff' : '#1c6c64'; g.fillRect(cx - w2 / 2, 2, w2, 9); txtC(cn, cx, 3, on ? INK : '#c8fff0'); txt('◀', cx - w2 / 2 + 2, 3, on ? INK : '#8ce0d4'); txt('▶', cx + w2 / 2 - 7, 3, on ? INK : '#8ce0d4'); }
    g.fillStyle = PT.fos2; g.fillRect(3, 21, 43, 1); g.fillRect(49, 21, 109, 1);
    // celdas
    const celda = (pan, i, m) => { const { x, y } = cellPos(pan, i), sel = st.pan === pan && st.i === i;
      g.fillStyle = INK; g.fillRect(x, y, CW - 1, CW - 1); g.fillStyle = sel ? '#1c4c44' : PT.bg2; g.fillRect(x + 1, y + 1, CW - 3, CW - 3); g.fillStyle = sel ? PT.fos : PT.fos2; g.fillRect(x + 1, y + 1, CW - 3, 1); g.fillRect(x + 8, y - 1, 5, 2);
      if (m) { const b = sel && !st.held ? -((t >> 3) & 1) : 0; if (m.hp <= 0) g.globalAlpha = .45; g.drawImage(MON[m.sp].icon, x - 1, y - 2 + b, 22, 22); g.globalAlpha = 1; if (pan === 'eq' && i === 0) g.drawImage(emoIcon('corazon'), x + 13, y + 13); } };
    for (let i = 0; i < 6; i++) celda('eq', i, G.party[i]);
    g.fillStyle = PT.fos2; g.fillRect(47, 22, 1, 88);
    for (let i = 0; i < CAJA; i++) celda('box', i, G.box[st.pg * CAJA + i]);
    // la garra y lo que lleva colgando
    const tp = cellPos(st.pan, st.i); st.cx += (tp.x - st.cx) * .35; st.cy += (tp.y - st.cy) * .35; st.swing *= .9;
    const gx = Math.round(st.cx + 10), gy = Math.round(st.cy) - (st.held ? 16 : 5) + Math.round(Math.sin(t * .15));
    g.fillStyle = '#5c6c70'; g.fillRect(gx, 13, 1, gy - 13);
    if (st.held) { const sw = Math.round(Math.sin(t * .2) * 2 + st.swing); ell(g, Math.round(st.cx + 10), Math.round(st.cy) + 17, 7, 2, 'rgba(0,0,0,.45)'); g.drawImage(MON[st.held.sp].icon, gx - 11 + sw, gy + 3, 22, 22); }
    g.fillStyle = INK; g.fillRect(gx - 7, gy - 3, 15, 5); g.fillStyle = PT.amb; g.fillRect(gx - 6, gy - 2, 13, 3); g.fillStyle = '#fff4b0'; g.fillRect(gx - 6, gy - 2, 13, 1);
    const op = st.held ? 3 : 6; g.fillStyle = INK; g.fillRect(gx - 5 - op, gy + 1, 3, 8); g.fillRect(gx + 3 + op, gy + 1, 3, 8); g.fillRect(gx - 5 - op, gy + 8, 5, 2); g.fillRect(gx + 1 + op, gy + 8, 5, 2); g.fillStyle = '#c8d0dc'; g.fillRect(gx - 4 - op, gy + 2, 1, 6); g.fillRect(gx + 4 + op, gy + 2, 1, 6);
    // ficha del Makinamon señalado (o del que llevas)
    g.fillStyle = INK; g.fillRect(0, 112, W, 32); g.fillStyle = '#061012'; g.fillRect(1, 113, W - 2, 30); g.fillStyle = PT.fos2; g.fillRect(1, 113, W - 2, 1);
    const m = st.held || monAt(st.pan, st.i);
    if (st.msgT > 0) { st.msgT--; wrap(st.msg, W - 12).slice(0, 2).forEach((l, i) => txt(l, 6, 117 + i * 10, PT.amb)); }
    else if (m) { g.drawImage(MON[m.sp].icon, 3, 116); txt(monName(m), 28, 116, PT.tinta); txt('Nv' + m.lv, 28, 127, PT.fos); typeTag(SPECIES[m.sp].t, 50, 126, 38); corazones(m, 92, 127, 9);
      const k = m.hp / m.max; g.fillStyle = INK; g.fillRect(96, 116, 58, 6); g.fillStyle = '#16302c'; g.fillRect(97, 117, 56, 4); g.fillStyle = k > .5 ? PT.fos : k > .2 ? PT.amb : '#f85858'; g.fillRect(97, 117, Math.round(56 * k), 4);
      txtR(st.held ? 'A: soltar  B: devolver' : '', W - 4, 136, PT.fos2); }
    else txt(st.pan === 'top' ? '◀ ▶ cambiar de caja' : st.held ? 'A: soltar aquí' : 'Celda libre.', 6, 121, PT.fos2);
  } };
  ui.push(sc); await wait(1);
  const mover = k => {
    if (st.pan === 'top') { if (k === 'left' || k === 'right') { st.pg = (st.pg + (k === 'left' ? pages() - 1 : 1)) % pages(); sfx.sel(); } else if (k === 'down') { st.pan = 'box'; st.i = 2; } return; }
    if (st.pan === 'eq') { const c = st.i % 2, r = Math.floor(st.i / 2);
      if (k === 'up' && r > 0) st.i -= 2; else if (k === 'down' && r < 2) st.i += 2; else if (k === 'left' && c === 1) st.i--; else if (k === 'right') { if (c === 0) st.i++; else { st.pan = 'box'; st.i = Math.min(3, r) * 5; } } }
    else { const c = st.i % 5, r = Math.floor(st.i / 5);
      if (k === 'up') { if (r > 0) st.i -= 5; else st.pan = 'top'; } else if (k === 'down' && r < 3) st.i += 5; else if (k === 'right' && c < 4) st.i++; else if (k === 'left') { if (c > 0) st.i--; else { st.pan = 'eq'; st.i = Math.min(2, r) * 2 + 1; } } }
    sfx.move();
  };
  const soltar = () => { // devuelve lo que llevas a su sitio
    if (!st.held) return; const { pan, idx } = st.from; if (pan === 'eq' && G.party.length < 6) G.party.splice(Math.min(idx, G.party.length), 0, st.held); else G.box.splice(Math.min(idx, G.box.length), 0, st.held); st.held = null;
  };
  try {
    for (;;) {
      const k = await key('up', 'down', 'left', 'right', 'a', 'b');
      if (['up', 'down', 'left', 'right'].includes(k)) { mover(k); continue; }
      if (k === 'b') { if (st.held) { soltar(); sfx.back(); aviso('Vuelve a su celda.'); continue; } sfx.back(); break; }
      if (st.pan === 'top') continue;
      const idx = st.pan === 'eq' ? st.i : st.pg * CAJA + st.i, arr = st.pan === 'eq' ? G.party : G.box, here = arr[idx];
      if (!st.held) {
        if (!here) { sfx.bump(); continue; }
        if (st.pan === 'eq' && G.party.length <= 1) { sfx.bump(); aviso('¡No puedes quedarte sin Makinamon! ¿Quién te acompañaría?'); continue; }
        if (st.pan === 'eq' && here.hp > 0 && G.party.filter(m => m.hp > 0).length <= 1) { sfx.bump(); aviso('¡Necesitas al menos un Makinamon con Pulso en el equipo!'); continue; }
        st.held = arr.splice(idx, 1)[0]; st.from = { pan: st.pan, idx }; sfx.clamp(); st.swing = 6; continue;
      }
      // soltar o intercambiar
      if (st.pan === 'eq' && !here && G.party.length >= 6) { sfx.bump(); continue; }
      if (here) {
        if (st.pan === 'eq' && st.held.hp <= 0 && here.hp > 0 && G.party.filter(m => m.hp > 0).length <= 1) { sfx.bump(); aviso('¡Necesitas al menos un Makinamon con Pulso en el equipo!'); continue; }
        const out = arr.splice(idx, 1, st.held)[0]; st.held = out; sfx.lock(); st.swing = -6; burst(cellPos(st.pan, st.i).x + 10, cellPos(st.pan, st.i).y + 10, 8, { c: [PT.fos, '#ffffff'], v0: .5, v1: 1.6, kind: 'star', l0: 8, l1: 14 }); continue;
      }
      arr.splice(Math.min(idx, arr.length), 0, st.held); const nm = monName(st.held); st.held = null; sfx.lock(); burst(cellPos(st.pan, st.i).x + 10, cellPos(st.pan, st.i).y + 10, 10, { c: [PT.fos, '#ffffff'], v0: .5, v1: 1.8, kind: 'star', l0: 8, l1: 14 });
      aviso(st.pan === 'eq' ? `${nm} se une a tu equipo.` : `${nm} se queda a cargar en el taller de Estaño.`);
    }
  } finally { soltar(); ui.splice(ui.indexOf(sc), 1); }
}

// ── el poste vivo en el mapa ──
let posteAct = null; // {x, y, t}: animación de encendido en el mundo
function drawPostes(cx, cy) {
  const M = world.M; if (!M.postes) return; const p = world.pl, party = G.party || [];
  const carga = party.length ? party.reduce((a, m) => a + m.hp, 0) / party.reduce((a, m) => a + m.max, 0) : 1, falta = carga < 1 || party.some(m => m.status);
  for (const o of M.postes) {
    const X = o.x - cx, Y = o.y - cy; if (X < -24 || X > W + 24 || Y < -40 || Y > H + 24) continue;
    const tx = o.x / 16, ty = o.y / 16, dist = Math.abs(p.x - tx) + Math.abs(p.y - ty), cerca = dist <= 2, act = posteAct && posteAct.x === tx && posteAct.y === ty ? posteAct : null, t = frame;
    // halo en el suelo cuando te acercas
    if (cerca || act) { g.globalAlpha = .18 + .08 * Math.sin(t * .1); ell(g, X + 8, Y + 15, 16, 5, '#70f8a0'); g.globalAlpha = 1; g.fillStyle = '#c8ffe8'; for (let a = 0; a < 12; a++) if ((a + (t >> 2)) % 3 === 0) { const an = a / 12 * Math.PI * 2; g.fillRect(Math.round(X + 8 + Math.cos(an) * 18), Math.round(Y + 15 + Math.sin(an) * 6), 1, 1); } }
    // orbe de la bobina
    const pul = (Math.sin(t * .08) + 1) / 2, ob = act ? 5 + (act.t >> 1 & 1) : 3 + Math.round(pul);
    g.globalAlpha = .25 + .2 * pul + (act ? .3 : 0); disc(X + 8, Y - 25, ob + 3, '#70f8a0'); g.globalAlpha = 1;
    disc(X + 8, Y - 25, ob, INK); disc(X + 8, Y - 25, ob - 1, act ? '#ffffff' : '#70f8a0'); g.fillStyle = '#ffffff'; g.fillRect(X + 7, Y - 27, 1, 1);
    if ((t + o.x) % 97 < 3 || (act && t % 3 === 0)) { const an = rnd(7), r = 7 + rnd(4); g.fillStyle = '#fff8c0'; let x0 = X + 8, y0 = Y - 25; for (let k = 0; k < 4; k++) { const x1 = X + 8 + Math.cos(an) * r * (k + 1) / 4 + rnd(-1.5, 1.5), y1 = Y - 25 + Math.sin(an) * r * (k + 1) / 4 + rnd(-1.5, 1.5); g.fillRect(Math.round(x1), Math.round(y1), 1, 1); x0 = x1; y0 = y1; } }
    // pantalla
    const sx = X + 4, sy = Y - 9; g.fillStyle = '#0b1719'; g.fillRect(sx, sy, 8, 7);
    if (act) { g.fillStyle = (act.t >> 1) & 1 ? '#ffffff' : '#70f8a0'; g.fillRect(sx, sy, 8, 7); }
    else if (cerca && party.length) { // te ha visto: tu primer Makinamon y la carga del equipo
      const k = carga, col = k >= 1 ? '#70f8a0' : k > .5 ? '#f8d030' : '#f85858', n = Math.round(6 * k); g.fillStyle = '#16302c'; g.fillRect(sx + 1, sy + 5, 6, 1); g.fillStyle = col; g.fillRect(sx + 1, sy + 5, n, 1);
      if ((t >> 4) & 1 || k >= 1) { g.fillStyle = col; g.fillRect(sx + 3, sy + 1, 2, 1); g.fillRect(sx + 2, sy + 2, 4, 1); g.fillRect(sx + 3, sy + 3, 2, 1); }
    } else { // en reposo: el Pulso del valle, como un electrocardiograma
      const ecg = [0, 0, 0, 1, -2, 2, 0, 0, 0, 0, 0, 0]; for (let i = 0; i < 8; i++) { const v = ecg[(i + (t >> 3) + o.x) % ecg.length]; g.fillStyle = '#58f0b0'; g.fillRect(sx + i, sy + 3 - v, 1, 1); }
    }
    // pilotos
    g.fillStyle = (t >> 5) & 1 ? '#70f8a0' : '#1c6c64'; g.fillRect(X + 4, Y - 1, 1, 1); g.fillStyle = cerca && falta && (t >> 3) & 1 ? '#f8d030' : '#1c6c64'; g.fillRect(X + 11, Y - 1, 1, 1);
    // panel flotante al acercarte: una pila por Makinamon con su carga, y el botón
    o.k = clamp((o.k || 0) + (cerca && !act && party.length && !busy ? .12 : -.2), 0, 1);
    if (o.k > 0) {
      const n = party.length, w = n * 7 + 15, h = 13, lado = Y - 54 < 16, e = Math.round(EASE.back(o.k) * 8), bob = Math.round(Math.sin(t * .08)); // si no cabe encima (poste pegado al borde de arriba), sale a su derecha
      const px = lado ? X + 10 + e : Math.round(X + 8 - w / 2), py = lado ? Y - 16 + bob : Y - 44 - e + bob;
      g.globalAlpha = Math.min(1, o.k * 2); g.fillStyle = INK; g.fillRect(px, py, w, h); if (lado) { g.fillRect(px - 1, py + 4, 1, 5); g.fillRect(px - 2, py + 5, 1, 3); g.fillRect(px - 3, py + 6, 1, 1); } else { g.fillRect(X + 6, py + h, 5, 1); g.fillRect(X + 7, py + h + 1, 3, 1); g.fillRect(X + 8, py + h + 2, 1, 1); }
      g.fillStyle = '#0b1719'; g.fillRect(px + 1, py + 1, w - 2, h - 2); g.fillStyle = '#2a8c6c'; g.fillRect(px + 1, py + 1, w - 2, 1);
      party.forEach((m, i) => { const q = m.hp / m.max, col = m.status ? '#f8d030' : q > .5 ? '#58f0b0' : q > .2 ? '#f8d030' : '#f85858', bx = px + 3 + i * 7, hh = q > 0 ? Math.max(1, Math.round(5 * q)) : 0; g.fillStyle = '#5c8c84'; g.fillRect(bx + 1, py + 3, 3, 1); g.fillRect(bx, py + 4, 5, 7); g.fillStyle = '#0b1719'; g.fillRect(bx + 1, py + 5, 3, 5); g.fillStyle = col; if (q > .2 || (t >> 3) & 1) g.fillRect(bx + 1, py + 10 - hh, 3, hh); });
      const ax = px + w - 10; g.fillStyle = falta && (t >> 4) & 1 ? '#f8d030' : '#58f0b0'; g.fillRect(ax, py + 2, 7, 9); txt('A', ax + 1, py + 3, INK); g.globalAlpha = 1;
    }
    // anillos de energía que suben al activarlo
    if (act) for (let k = 0; k < 3; k++) { const q = ((act.t * 2 + k * 10) % 30) / 30, yy = Y + 10 - q * 36; g.globalAlpha = 1 - q; g.strokeStyle = '#70f8a0'; g.lineWidth = 1; g.beginPath(); g.ellipse(X + 8, yy, 8 - q * 3, 2, 0, 0, 7); g.stroke(); g.globalAlpha = 1; }
  }
  if (posteAct) posteAct.t++;
}
// la pantalla de la terminal sale de la pantallita del poste (y vuelve a entrar al salir)
async function zoomPoste(x, y, abrir) {
  const sx = x * 16 + 4 - world.cam.x, sy = y * 16 - 9 - world.cam.y, o = { k: abrir ? 0 : 1 };
  const sc = { draw() { const k = EASE.io(o.k), x0 = sx + (0 - sx) * k, y0 = sy + (0 - sy) * k, w = 8 + (W - 8) * k, h = 7 + (H - 7) * k;
    g.fillStyle = INK; g.fillRect(Math.round(x0) - 1, Math.round(y0) - 1, Math.round(w) + 2, Math.round(h) + 2); g.fillStyle = PT.bg; g.fillRect(Math.round(x0), Math.round(y0), Math.round(w), Math.round(h));
    g.fillStyle = 'rgba(88,240,176,.25)'; for (let yy = Math.round(y0); yy < y0 + h; yy += 2) g.fillRect(Math.round(x0), yy, Math.round(w), 1); g.fillStyle = PT.fos; g.fillRect(Math.round(x0), Math.round(y0 + h / 2), Math.round(w), 1); } };
  ui.push(sc); if (abrir) sfx.wipe(); else snd(t => osc('saw', [800, 60], t, .25, .06, sfxG));
  await tw(o, { k: abrir ? 1 : 0 }, 16, 'lin'); ui.splice(ui.indexOf(sc), 1);
}
