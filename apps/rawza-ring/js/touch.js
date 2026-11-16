/*
 * Touch controls for phones and tablets (v5: fingers tracked at document level, full screen, always landscape).
 * ADDED AFTER THE TEST by Future AI (Hashmatullah Zaher), 15 Nov 2026. NOT written by Claude Fable 5.2.
 * Fable's game code is unchanged: this file only turns taps into the same key presses the game already reads
 * (arrows, Space, C, R, P), and makes the HUD smaller on touch screens. Desktop players never see it.
 */
(function () {
  const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return;

  const css = `
  body.touch { touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  body.touch #tl { transform: scale(0.58); transform-origin: top left; left: 10px; top: 10px; }
  body.touch #minimap { transform: scale(0.55); transform-origin: top right; right: 10px; top: 10px; }
  body.touch #speedo { right: auto; left: 50%; bottom: 4px; transform: translateX(-50%) scale(0.5); transform-origin: bottom center; }
  body.touch #attrib { font-size: 10px; bottom: 4px; left: 50%; transform: translateX(-50%); white-space: nowrap; }
  body.touch #msg { font-size: 64px; }
  #tc { position: fixed; inset: 0; z-index: 30; pointer-events: none; }
  #tc.off .tb:not(.always) { display: none; }
  .tb { position: absolute; pointer-events: auto; touch-action: none; display: flex; align-items: center; justify-content: center;
        border-radius: 50%; border: 2px solid rgba(255,255,255,.55); background: rgba(16,20,32,.45); color: #fff;
        font: 800 26px "Segoe UI", system-ui, sans-serif; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
        box-shadow: 0 4px 16px rgba(0,0,0,.35); transition: transform .06s, background .06s; }
  .tb.on { background: rgba(53,199,230,.55); transform: scale(.93); }
  .tb small { font-size: 12px; font-weight: 800; letter-spacing: .06em; }
  #tLeft  { left: calc(env(safe-area-inset-left) + 18px);  bottom: 30px; width: 88px; height: 88px; }
  #tRight { left: calc(env(safe-area-inset-left) + 120px); bottom: 30px; width: 88px; height: 88px; }
  #tGas   { right: calc(env(safe-area-inset-right) + 18px); bottom: 30px; width: 104px; height: 104px; background: rgba(46,158,91,.5); }
  #tGas.on { background: rgba(125,255,155,.6); }
  #tBrake { right: calc(env(safe-area-inset-right) + 136px); bottom: 24px; width: 76px; height: 76px; background: rgba(200,40,30,.45); }
  #tDrift { right: calc(env(safe-area-inset-right) + 136px); bottom: 112px; width: 66px; height: 66px; border-radius: 18px; }
  .tsm { width: 46px; height: 46px; font-size: 20px; top: calc(env(safe-area-inset-top) + 10px); border-radius: 14px; }
  #tCam { left: calc(50% - 103px); } #tReset { left: calc(50% - 46px); } #tPause { left: calc(50% + 11px); } #tFull { left: calc(50% + 68px); }
  #tToast { position: fixed; left: 50%; top: 30%; transform: translateX(-50%); z-index: 40; display: none; max-width: 86vw; padding: 12px 18px;
            border-radius: 14px; background: rgba(16,20,32,.92); color: #fff; text-align: center; font: 700 15px "Segoe UI", Vazirmatn, Tahoma, sans-serif; line-height: 1.6; }
  #tToast.show { display: block; }
  @media (min-width: 901px) { .tsm { top: calc(env(safe-area-inset-top) + 104px); } }
  #tRotate { position: fixed; left: 50%; top: 42%; transform: translateX(-50%); z-index: 31; pointer-events: none; display: none;
             padding: 10px 16px; border-radius: 12px; background: rgba(16,20,32,.82); color: #fff; text-align: center;
             font: 700 15px "Segoe UI", Vazirmatn, Tahoma, sans-serif; line-height: 1.5; }
  .touchnote { color: #ffd166 !important; font-weight: 700; }
  /* phones: the start, finish and pause cards must fit a short landscape screen */
  body.touch .overlay .card { max-height: calc(100% - 16px); overflow-y: auto; padding: 14px 22px; width: min(640px, 94%); }
  body.touch .card h1 { font-size: 30px; }
  body.touch .card .fa { font-size: 17px; }
  body.touch .card p { font-size: 12.5px; line-height: 1.45; margin: 7px 0; }
  body.touch button.go { padding: 10px 34px; font-size: 17px; }
  body.touch #status { margin-top: 6px; font-size: 11px; }
  body.touch table { margin: 8px 0 10px; } body.touch td { padding: 5px 8px; font-size: 13px; }
  `;
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);
  document.body.classList.add('touch');

  // ---- always landscape: when the phone is held upright, the whole page is drawn turned 90 degrees, so the
  // player turns the phone and gets a normal landscape game. (Android in full screen also locks the screen to landscape.)
  // The game reads its size from window.innerWidth / innerHeight, so those report the landscape size while turned.
  // keep the browser's own size readers (captured once, before we replace them below)
  const own = (k) => Object.getOwnPropertyDescriptor(window, k) || Object.getOwnPropertyDescriptor(Window.prototype, k);
  const dW = own('innerWidth'), dH = own('innerHeight');
  const rawW = () => (dW && dW.get) ? dW.get.call(window) : document.documentElement.clientWidth;
  const realH = () => (dH && dH.get) ? dH.get.call(window) : document.documentElement.clientHeight;
  const upright = () => rawW() < realH();
  try {
    Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => upright() ? realH() : rawW() });
    Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => upright() ? rawW() : realH() });
  } catch (_) {}
  const body = document.body;
  let turned = null;
  function applyTurn(force) {
    const t = upright();
    if (t === turned && !force) return;
    turned = t;
    body.classList.toggle('rot', t);
    if (t) {
      const W = rawW(), H = realH();
      Object.assign(body.style, { position: 'fixed', top: '0', left: '0', width: H + 'px', height: W + 'px',
        transformOrigin: 'top left', transform: 'rotate(90deg) translateY(-100%)', overflow: 'hidden' });
    } else {
      for (const k of ['position', 'top', 'left', 'width', 'height', 'transformOrigin', 'transform', 'overflow']) body.style[k] = '';
    }
    window.dispatchEvent(new Event('resize'));   // let the game re-measure the screen
  }
  let lastWH = '';
  const watch = () => { const k = rawW() + 'x' + realH(); if (k !== lastWH) { lastWH = k; applyTurn(true); } };
  window.addEventListener('orientationchange', () => setTimeout(watch, 250));
  setInterval(watch, 300);
  watch();

  const send = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
  const vis = (id) => { const el = document.getElementById(id); return !!el && !el.classList.contains('hidden'); };

  const tc = document.createElement('div');
  tc.id = 'tc';
  tc.className = 'off';
  document.body.appendChild(tc);

  // v2: the buttons are only pictures. Every finger on the screen is tracked at document level and checked against
  // the button areas (with a margin), so a thumb that lands near a button or slides from one button to another still works.
  const HOLD = [], TAP = [];
  function mk(id, label, cls) {
    const b = document.createElement('div');
    b.id = id; b.className = cls; b.innerHTML = label;
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    tc.appendChild(b);
    return b;
  }
  const hold = (id, code, label) => HOLD.push({ b: mk(id, label, 'tb'), code });
  const tap = (id, code, label, cls) => TAP.push({ b: mk(id, label, 'tb tsm' + (cls ? ' ' + cls : '')), code });

  // ---- full screen (Android and most browsers; iPhone Safari does not allow it, so there we explain Add to Home Screen)
  const root = document.documentElement;
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const canFS = !!(root.requestFullscreen || root.webkitRequestFullscreen);
  const asApp = () => window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const toast = document.createElement('div'); toast.id = 'tToast'; document.body.appendChild(toast);
  let toastT = 0;
  function say(html, ms) { toast.innerHTML = html; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), ms || 6000); }
  const IOS_TIP = 'iPhone: tap <b>Share &#11014;</b> then <b>Add to Home Screen</b>.<br>Open the game from the new icon: it plays full screen.'
    + '<br><span dir="rtl">آیفون: دکمهٔ Share را بزنید، بعد Add to Home Screen. بازی را از آیکون تازه باز کنید تا تمام‌صفحه شود.</span>';
  function goFull() {
    if (asApp() || fsEl() || !canFS) return;
    try {
      const r = root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : root.webkitRequestFullscreen();
      Promise.resolve(r).then(() => { try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (_) {} }).catch(() => {});
    } catch (_) {}
  }
  function toggleFull() {
    if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    if (asApp()) return;
    if (canFS) goFull(); else say(isIOS ? IOS_TIP : 'Full screen is not available in this browser. Try Chrome.', 8000);
  }
  // START RACE and RACE AGAIN switch to full screen by themselves (a tap counts as the user's permission)
  for (const id of ['startBtn', 'restartBtn']) { const b = document.getElementById(id); if (b) b.addEventListener('click', goFull); }

  hold('tLeft', 'ArrowLeft', '&#9664;');
  hold('tRight', 'ArrowRight', '&#9654;');
  hold('tGas', 'ArrowUp', '<div style="text-align:center;line-height:1">&#9650;<br><small>GAS</small></div>');
  hold('tBrake', 'ArrowDown', '<div style="text-align:center;line-height:1">&#9660;<br><small>BRAKE</small></div>');
  hold('tDrift', 'Space', '<small>DRIFT</small>');
  tap('tCam', 'KeyC', '&#128247;');
  tap('tReset', 'KeyR', '&#8634;');
  tap('tPause', 'KeyP', '&#10074;&#10074;', 'always');
  tap('tFull', toggleFull, '&#9974;');

  const pauseText = document.querySelector('#pause p');
  if (pauseText) pauseText.innerHTML += '<br>Tap anywhere to continue.';
  const attrib = document.getElementById('attrib');
  if (attrib) attrib.textContent += ' · touch v6';

  const PAD = 16;
  const shown = (b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const hit = (b, x, y) => { const r = b.getBoundingClientRect(); return r.width > 0 && x >= r.left - PAD && x <= r.right + PAD && y >= r.top - PAD && y <= r.bottom + PAD; };
  const racing = () => vis('hud') && !vis('menu') && !vis('finish') && !vis('pause');

  const fingers = new Map();   // touch id -> {x, y}
  const held = new Set();      // key codes we are holding down now
  function update() {
    const want = new Set();
    if (racing()) for (const f of fingers.values()) {
      // each finger presses one button: the one it is on, or the nearest within the margin
      let best = null, bestD = PAD + 1;
      for (const h of HOLD) {
        if (!shown(h.b)) continue;
        const r = h.b.getBoundingClientRect();
        const dx = Math.max(r.left - f.x, 0, f.x - r.right), dy = Math.max(r.top - f.y, 0, f.y - r.bottom);
        const d = Math.hypot(dx, dy);
        if (d < bestD) { bestD = d; best = h; }
      }
      if (best) want.add(best.code);
    }
    for (const h of HOLD) {
      const on = want.has(h.code);
      if (on && !held.has(h.code)) { send('keydown', h.code); try { if (navigator.vibrate) navigator.vibrate(8); } catch (_) {} }
      if (!on && held.has(h.code)) send('keyup', h.code);
      h.b.classList.toggle('on', on);
    }
    held.clear();
    want.forEach((c) => held.add(c));
  }
  let pendingFn = null;
  const runPending = () => { if (pendingFn) { const f = pendingFn; pendingFn = null; f(); } };
  function tapAt(x, y) {
    for (const t of TAP) {
      if (!shown(t.b) || !hit(t.b, x, y)) continue;
      t.b.classList.add('on'); setTimeout(() => t.b.classList.remove('on'), 160);
      if (typeof t.code === 'function') pendingFn = t.code; else { send('keydown', t.code); send('keyup', t.code); }
      return true;
    }
    return false;
  }
  function start(id, x, y, e) {
    if (tapAt(x, y)) { e.preventDefault(); return; }
    if (vis('pause')) { send('keydown', 'KeyP'); send('keyup', 'KeyP'); e.preventDefault(); return; }   // tap the pause card to continue
    if (!racing()) return;                                  // menus: let the START / RACE AGAIN buttons get their click
    e.preventDefault();
    fingers.set(id, { x, y });
    taps.set(id, { x, y, t: Date.now() });
    update();
  }
  // a short tap away from the driving buttons is passed to the billboards (js/billboards.js), which open their link
  const taps = new Map();
  const nearControl = (x, y) => HOLD.concat(TAP).some((o) => shown(o.b) && hit(o.b, x, y));
  function move(id, x, y) { if (fingers.has(id)) fingers.set(id, { x, y }); }
  function end(id) {
    const f = fingers.get(id), t = taps.get(id);
    fingers.delete(id); taps.delete(id);
    if (f && t && Date.now() - t.t < 450 && Math.hypot(f.x - t.x, f.y - t.y) < 14 && !nearControl(t.x, t.y) && window.__billboardTap) window.__billboardTap(t.x, t.y);
  }

  const opt = { passive: false };
  if ('ontouchstart' in window) {
    document.addEventListener('touchstart', (e) => { for (const t of e.changedTouches) start(t.identifier, t.clientX, t.clientY, e); }, opt);
    document.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) move(t.identifier, t.clientX, t.clientY); if (racing()) e.preventDefault(); update(); }, opt);
    const fin = (e) => { for (const t of e.changedTouches) end(t.identifier); if (racing()) e.preventDefault(); update(); if (e.type === 'touchend') runPending(); else pendingFn = null; };
    document.addEventListener('touchend', fin, opt);
    document.addEventListener('touchcancel', fin, opt);
  } else {
    document.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') start(e.pointerId, e.clientX, e.clientY, e); }, opt);
    document.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') { move(e.pointerId, e.clientX, e.clientY); update(); } }, opt);
    const fin = (e) => { end(e.pointerId); update(); if (e.type === 'pointerup') runPending(); else pendingFn = null; };
    document.addEventListener('pointerup', fin, opt);
    document.addEventListener('pointercancel', fin, opt);
  }
  const releaseAll = () => { fingers.clear(); update(); };
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', releaseAll);

  // title screen: say how to play by touch
  const keysBox = document.querySelector('#menu .keys');
  if (keysBox) {
    const p = document.createElement('p');
    p.className = 'touchnote';
    p.innerHTML = 'On a phone: &#9664; &#9654; steer &middot; GAS &middot; BRAKE &middot; DRIFT &middot; &#128247; camera &middot; &#8634; reset &middot; &#9974; full screen<br>The game always plays sideways: turn your phone.'
      + (isIOS && !asApp() ? '<br><span style="font-weight:600;color:#fff">iPhone full screen: Share &#11014; &rarr; Add to Home Screen, then open the new icon.</span>' : '');
    keysBox.after(p);
    keysBox.style.display = 'none';
  }

  // show the driving buttons only while a race is on screen (not over the menu, finish or pause cards)
  setInterval(() => {
    const on = racing();
    tc.classList.toggle('off', !on);
    document.getElementById('tPause').style.display = on || vis('pause') ? '' : 'none';
    document.getElementById('tFull').style.display = asApp() ? 'none' : '';
    document.getElementById('tFull').innerHTML = fsEl() ? '&#10005;' : '&#9974;';
    document.body.classList.toggle('racing', on);
    if (!on && held.size) releaseAll();
  }, 200);
})();
