/* Pause menu (Esc): Resume / Restart / Controls / Settings / back to the site, with the graphics settings and the controls list as sub-pages.
   Talks to the engine only through the api object handed in by main.js:
   api.get() -> { preset, res, aa, shadows, refl, fx, blur, veg, police, fps }, api.set(key, value), api.pause(bool), api.restart() */
(function () {
  'use strict';
  const G = window.G = window.G || {};
  const ROWS = [
    { k: 'preset', label: 'Preset', opts: [['auto', 'Auto'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], other: 'Custom' },
    { k: 'res', label: 'Resolution', opts: [[0.5, '50%'], [0.6, '60%'], [0.7, '70%'], [0.8, '80%'], [0.9, '90%'], [1, '100%']], num: v => Math.round(v * 100) + '%' },
    { k: 'aa', label: 'Anti-aliasing', opts: [[0, 'Off'], [2, '2x'], [4, '4x']] },
    { k: 'shadows', label: 'Shadows', opts: [[0, 'Off'], [1, 'Low'], [2, 'Medium'], [3, 'High']] },
    { k: 'refl', label: 'Reflections', opts: [[0, 'Off'], [1, 'Low'], [2, 'Medium'], [3, 'High']] },
    { k: 'fx', label: 'Ambient occlusion & sun rays', opts: [[0, 'Off'], [1, 'On']] },
    { k: 'blur', label: 'Motion blur', opts: [[0, 'Off'], [1, 'On']] },
    { k: 'veg', label: 'Vegetation distance', opts: [[0, 'Near'], [1, 'Far']] },
    { k: 'police', label: 'Police chase', opts: [[0, 'Off'], [1, 'On']] },
    { k: 'fps', label: 'FPS counter', opts: [[0, 'Off'], [1, 'On']] },
  ];
  const KEYS = [['W  /  ↑', 'Gas'], ['S  /  ↓', 'Brake, reverse'], ['A  D  /  ← →', 'Steer'], ['Space', 'Handbrake'], ['E', 'Look behind (tap or hold)'], ['Q', 'Passenger: next move'], ['R', 'Back on the road'], ['M', 'Sound on / off'], ['Esc', 'This menu']];
  const TAPS = [['◀  ▶', 'Steer'], ['▼', 'Brake, reverse'], ['▲', 'More speed (the car holds 60 mph by itself)'], ['HB', 'Handbrake'], ['⇅', 'Look behind (hold)'], ['♪', 'Passenger: next move'], ['↺', 'Back on the road'], ['☰', 'This menu']];
  G.Menu = function (api) {
    const self = this, root = document.getElementById('menu'), list = document.getElementById('menuRows'), info = document.getElementById('menuInfo'), fpsEl = document.getElementById('fps'), title = document.getElementById('menuTitle');
    const TITLE = { root: 'Paused', settings: 'Settings', controls: 'Controls' };
    let sel = 0, rsel = 0, page = 'root'; this.open = false;
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    /* ---- root page ---- */
    const btnsAll = Array.from(document.querySelectorAll('#menuRoot .mbtn'));
    const btns = () => btnsAll.filter(b => getComputedStyle(b).display !== 'none'); // (the link back to the site only exists on the site)
    function paintRoot() { const bs = btns(); rsel = Math.max(0, Math.min(bs.length - 1, rsel)); btnsAll.forEach(b => b.classList.toggle('sel', b === bs[rsel])); }
    function act(a) {
      if (a === 'resume') self.show(false);
      else if (a === 'restart') { self.show(false); api.restart(); }
      else if (a === 'settings' || a === 'controls') go(a);
      else if (a === 'home') location.href = 'https://noclipepe.com/';
    }
    btnsAll.forEach(b => {
      b.addEventListener('pointerenter', () => { const i = btns().indexOf(b); if (i >= 0) { rsel = i; paintRoot(); } });
      b.addEventListener('click', e => { e.stopPropagation(); if (b.dataset.a !== 'home') { e.preventDefault(); act(b.dataset.a); } });
    });
    function go(pg) { page = pg; root.dataset.page = pg; title.textContent = TITLE[pg]; document.getElementById('menuPanel').scrollTop = 0; if (pg === 'root') paintRoot(); else if (pg === 'settings') { paint(); stats(); } }
    /* ---- controls page ---- */
    { const box = document.getElementById('ctlRows'); for (const [k, v] of (document.body.classList.contains('touch') ? TAPS : KEYS)) { const r = el('div', 'crow'); r.append(el('span', 'ckey', k), el('span', 'cdesc', v)); box.appendChild(r); } }
    for (const b of document.querySelectorAll('.mback')) b.addEventListener('click', e => { e.stopPropagation(); go('root'); });
    /* ---- settings page ---- */
    const rows = ROWS.map((r, i) => {
      const row = el('div', 'mrow'), val = el('span', 'mval'), prev = el('span', 'marr', '‹'), next = el('span', 'marr', '›');
      const box = el('span', 'mbox'); box.append(prev, val, next);
      row.append(el('span', 'mlab', r.label), box); list.appendChild(row);
      row.addEventListener('pointerenter', () => { sel = i; paint(); });
      row.addEventListener('click', e => { sel = i; step(e.target === prev ? -1 : 1); e.stopPropagation(); });
      return { r, row, val, prev, next };
    });
    function index(r, v) { // position of the current value among the options; fractional when it sits between two (auto resolution)
      for (let i = 0; i < r.opts.length; i++) if (r.opts[i][0] === v) return i;
      if (typeof v !== 'number') return -1;
      let i = 0; while (i < r.opts.length && r.opts[i][0] < v) i++;
      return i - 0.5;
    }
    function paint() {
      const st = api.get();
      rows.forEach((o, i) => {
        const v = st[o.r.k], ix = index(o.r, v), exact = ix === Math.floor(ix) && ix >= 0;
        o.val.textContent = exact ? o.r.opts[ix][1] : o.r.num ? o.r.num(v) : o.r.other || String(v);
        o.row.classList.toggle('sel', i === sel);
        o.prev.classList.toggle('off', ix <= 0 && ix !== -1); o.next.classList.toggle('off', ix >= o.r.opts.length - 1);
      });
      fpsEl.style.display = st.fps ? 'block' : 'none';
    }
    function step(d) {
      const r = ROWS[sel], ix = index(r, api.get()[r.k]);
      let n = ix === -1 ? (d > 0 ? 1 : r.opts.length - 1) : d > 0 ? Math.floor(ix) + 1 : Math.ceil(ix) - 1;
      if (n < 0 || n >= r.opts.length) return;
      api.set(r.k, r.opts[n][0]); paint();
    }
    this.show = function (on) {
      if (on === self.open) return;
      self.open = on; root.classList.toggle('open', on); document.body.classList.toggle('menu', on); api.pause(on); // body.menu brings the mouse cursor back
      if (on) { rsel = 0; go('root'); }
    };
    /* Esc: back out of a sub-page, or close */
    this.toggle = function () { if (self.open && page !== 'root') go('root'); else self.show(!self.open); };
    this.key = function (e) {
      const c = e.code, up = c === 'ArrowUp' || c === 'KeyW', down = c === 'ArrowDown' || c === 'KeyS', ok = c === 'Enter' || c === 'NumpadEnter' || c === 'Space';
      if (page === 'root') {
        const n = btns().length;
        if (up) { rsel = (rsel + n - 1) % n; paintRoot(); } else if (down) { rsel = (rsel + 1) % n; paintRoot(); } else if (ok) act(btns()[rsel].dataset.a);
      } else if (page === 'settings') {
        if (up) { sel = (sel + rows.length - 1) % rows.length; paint(); } else if (down) { sel = (sel + 1) % rows.length; paint(); }
        else if (c === 'ArrowLeft' || c === 'KeyA') step(-1); else if (c === 'ArrowRight' || c === 'KeyD' || c === 'Space') step(1);
        else if (c === 'Enter' || c === 'NumpadEnter' || c === 'Backspace') go('root');
        else if (c === 'Delete') { api.set('preset', 'auto'); paint(); }
      } else if (ok || c === 'Backspace') go('root');
    };
    function stats() {
      const s = G.stats || {}, f = Math.round(s.fps || 0);
      if (self.open && page === 'settings') info.textContent = (s.w || 0) + ' × ' + (s.h || 0) + '  ·  ' + f + ' fps';
      if (fpsEl.style.display !== 'none') fpsEl.textContent = f + ' FPS';
    }
    setInterval(() => { stats(); if (self.open && page === 'settings' && api.get().preset === 'auto') paint(); }, 500);
    document.getElementById('menuAuto').addEventListener('click', e => { api.set('preset', 'auto'); paint(); e.stopPropagation(); });
    document.getElementById('menuPanel').addEventListener('click', e => e.stopPropagation());
    root.addEventListener('click', () => self.show(false));
    paint();
  };
})();
