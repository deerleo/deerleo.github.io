'use strict';
// ───────── móvil: mando táctil de consola portátil, disposición vertical/horizontal y toques en pantalla ─────────
(() => {
  if (!TOUCH) return;
  document.body.classList.add('tactil');
  const $ = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
  const vib = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { } };
  const mando = $('div', 'mando');
  // cruceta: se desliza entre direcciones sin levantar el dedo
  const cruz = $('div', 'cruz', '<i class="d u"></i><i class="d dn"></i><i class="d l"></i><i class="d r"></i><b></b>');
  const btns = $('div', 'btns'), bB = $('button', 'bt b', '<span>B</span>'), bA = $('button', 'bt a', '<span>A</span>');
  btns.append(bB, bA);
  const pie = $('div', 'pie'), bMenu = $('button', 'pill', 'MENÚ'), bSon = $('button', 'mini', '♪'), bFull = $('button', 'mini', '⛶');
  pie.append(bSon, bMenu, bFull);
  const izq = $('div', 'lado izq'), der = $('div', 'lado der');
  izq.append(cruz); der.append(btns);
  const marca = $('div', 'marca', '<span class="rayo">⚡</span><b>MAKINAMON</b><i>PULSO</i><span class="altavoz"></span>');
  mando.append(marca, izq, pie, der); document.body.append(mando);
  // cruceta
  let dirAct = null;
  const DIRS = ['up', 'down', 'left', 'right'], CLS = { up: 'u', down: 'dn', left: 'l', right: 'r' };
  const setDir = d => { if (d === dirAct) return; if (dirAct) { release(dirAct); cruz.classList.remove('p-' + CLS[dirAct]); } dirAct = d; if (d) { press(d); cruz.classList.add('p-' + CLS[d]); vib(6); } };
  const dirDe = e => { const r = cruz.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2); if (Math.hypot(x, y) < r.width * .12) return dirAct; return Math.abs(x) > Math.abs(y) ? (x < 0 ? 'left' : 'right') : (y < 0 ? 'up' : 'down'); };
  cruz.addEventListener('pointerdown', e => { e.preventDefault(); cruz.setPointerCapture(e.pointerId); audioInit(); setDir(dirDe(e)); });
  cruz.addEventListener('pointermove', e => { if (cruz.hasPointerCapture(e.pointerId)) setDir(dirDe(e)); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) cruz.addEventListener(ev, () => setDir(null));
  // botones
  const boton = (el, keys, ms = 10) => {
    el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); audioInit(); keys.forEach(press); el.classList.add('on'); vib(ms); });
    const up = () => { if (!el.classList.contains('on')) return; keys.forEach(release); el.classList.remove('on'); };
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, up);
    el.addEventListener('contextmenu', e => e.preventDefault());
  };
  boton(bA, ['a']); boton(bB, ['b']); boton(bMenu, ['start'], 14);
  bSon.addEventListener('pointerdown', e => { e.preventDefault(); audioInit(); toggleMute(); bSon.classList.toggle('apagado', muted); vib(8); });
  bSon.classList.toggle('apagado', !!muted);
  const fsOk = document.fullscreenEnabled || document.webkitFullscreenEnabled; if (!fsOk) bFull.style.display = 'none';
  bFull.addEventListener('pointerdown', e => { e.preventDefault(); const d = document, el = d.documentElement; if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d); else (el.requestFullscreen || el.webkitRequestFullscreen).call(el).catch?.(() => { }); vib(8); });
  // tocar la pantalla del juego = A (y en la ficha, elegir letra)
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); audioInit(); const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
    if (window.onCanvasTap && window.onCanvasTap(x, y)) { vib(6); return; }
    // solo pasa texto o arranca desde el título: en los menús se elige con el mando, para no elegir nada sin querer
    if (!(scene === title || (dlg.on && !ui.some(u => u.esMenu)) || (scene !== world && scene !== B && ui.length <= 1))) return;
    press('a'); vib(6); setTimeout(() => release('a'), 60);
  });
  // sin zoom, sin menú contextual y sin rebotes
  for (const ev of ['gesturestart', 'gesturechange', 'dblclick']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  document.addEventListener('contextmenu', e => e.preventDefault());
  // el sonido de iOS solo arranca dentro de un toque
  for (const ev of ['touchend', 'click']) document.addEventListener(ev, () => audioInit(), { passive: true });
  // si la app pasa a segundo plano, suelta todo
  document.addEventListener('visibilitychange', () => { if (document.hidden) { setDir(null); ['a', 'b', 'start'].forEach(release); } });
})();
