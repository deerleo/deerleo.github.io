/* ui.js — title screen, the corkboard mission graph, the mission wrapper (pause), results */
(() => {
  'use strict';
  const BD = window.BD, U = BD.U, cam = BD.cam, In = BD.Input, T = BD.Text, Px = BD.Px;
  const A = () => BD.Audio;
  const FW = BD.FBW, FH = BD.FBH;
  const S = (BD.Scenes = {});
  const cleared = (id) => BD.Save.data.cleared[id];
  const unlocked = (m) => BD.cheat || m.needs.every((n) => !!cleared(n));
  const blink = (hz) => ((BD.time * (hz || 2.5)) | 0) % 2 === 0;
  const RANKS = 'SABC';

  /* ----------------------------------------------------------------- title */
  S.title = {
    enter() {
      this.t = 0; this.st = { t: 0, wind: 0.6 };
      this.bg = BD.Backgrounds.hill; this.bg.init();
      const L = this.bg.light;
      const mk = (id, pose, expr, x, k, f, prop) => { const r = new BD.Rig(id, { prop: prop === undefined ? null : prop }); r.setLight(L); r.snap(pose); r.expr = expr; return { r, x, y: 268, k, f }; };
      this.cast = [
        mk('slick', 'caneLean', 'sly', 50, 0.62, 1, 'cane'),
        mk('ruckus', 'stand', 'grin', 432, 0.62, -1),
        mk('granddad', 'handsHips', 'scowl', 348, 0.74, -1),
        mk('riley', 'aim', 'smirk', 138, 0.86, 1, 'pistol'),
        mk('huey', 'armsCrossed', 'neutral', 242, 1.02, 1),
      ];
      A().music('title'); A().intensity(0.7);
    },
    update(dt, rdt) {
      this.t += rdt; this.st.t += rdt;
      cam.set(900, 0, 1);
      for (const c of this.cast) c.r.update(rdt, 0, 0);
      if (this.t > 0.5 && In.take('confirm')) { A().init(); A().sfx('ui_select'); BD.setScene(S.mission, BD.HUB); }
    },
    render(g) {
      const ps = BD.pixelScale;
      this.bg.draw(g, cam, this.st);
      Px.dither(g, 28);
      for (const c of this.cast) { g.setTransform(c.k, 0, 0, c.k, 0, 0); c.r.draw(g, c.x / c.k, c.y / c.k, c.f, {}); }
      g.setTransform(ps, 0, 0, ps, 0, 0);
      this.bg.drawFront(g, cam, this.st);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const drop = Math.max(0, 1 - this.t * 2.2), logo = T.banner('THE BOONDOCKS', 5, '#fff2a8', '#f08a1e', '#2a0d0a', 0.22);
      g.drawImage(logo, Math.round((FW - logo.width) / 2), Math.round(8 - drop * 80 + Math.sin(this.t * 1.6) * 1.5));
      if (this.t > 0.45) { // ribbon
        const w = 246, x = (FW - w) / 2, y = 62;
        g.fillStyle = '#5a0f14'; g.fillRect(x - 10, y + 4, 12, 15); g.fillRect(x + w - 2, y + 4, 12, 15);
        g.fillStyle = '#14060a'; g.fillRect(x - 1, y - 1, w + 2, 19);
        g.fillStyle = '#b3262d'; g.fillRect(x, y, w, 17); g.fillStyle = '#e04a45'; g.fillRect(x, y, w, 2); g.fillStyle = '#7a161c'; g.fillRect(x, y + 15, w, 2);
        T.draw(g, 'THE WOODCREST FILES', FW / 2, y + 2, { align: 'center', scale: 2, color: '#fff3d6', shadow: '#5a0f14' });
      }
      if (this.t > 0.9 && blink(2.2)) T.draw(g, 'PRESS ENTER', FW / 2, 92, { align: 'center', color: '#ffffff', outline: '#14060a' });
      T.draw(g, 'UNOFFICIAL FAN GAME  -  NOT FOR SALE', FW / 2, 260, { align: 'center', color: '#f1e6d2', outline: '#14060a' });
    },
  };

  /* ----------------------------------------------------------------- board */
  const THUMB = { garden: ['garden', 560, { heat: 0.4 }], dinner: ['house', 640, {}], fight: ['ink', 900, {}], inspector: ['street', 1300, {}], itis: ['house', 900, {}], theater: ['lobby', 1700, {}], home: ['house', 640, {}], strikes: ['house', 640, { dark: 1, ghost: 1 }], hate: ['street', 1300, {}] };
  const SHORT = { garden: 'GARDEN', dinner: 'DINNER', fight: 'FIGHT', inspector: 'INSPECT', itis: 'THE ITIS', theater: 'OR DIE', home: 'HOME', strikes: 'STRIKE', hate: 'HATE' };
  let cork = null;
  const thumbs = {};
  function buildCork() {
    const [c, g] = U.canvas(FW, FH), r = U.seeded(77);
    g.fillStyle = '#a9743f'; g.fillRect(0, 0, FW, FH);
    for (let i = 0; i < 5200; i++) { g.fillStyle = r() < 0.5 ? '#8f5f31' : r() < 0.6 ? '#c08a52' : '#9a6a38'; g.fillRect((r() * FW) | 0, (r() * FH) | 0, r() < 0.2 ? 2 : 1, 1); }
    g.fillStyle = '#3a2416'; g.fillRect(0, 0, FW, 14); g.fillRect(0, 0, 5, FH); g.fillRect(FW - 5, 0, 5, FH); g.fillRect(0, 190, FW, FH - 190);
    g.fillStyle = '#5a3a22'; g.fillRect(0, 12, FW, 2); g.fillRect(3, 0, 2, 190); g.fillRect(FW - 5, 0, 2, 190); g.fillRect(0, 190, FW, 2);
    const note = (x, y, w, h, col, lines) => { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 2, y + 2, w, h); g.fillStyle = col; g.fillRect(x, y, w, h); g.fillStyle = '#c7352e'; g.fillRect(x + (w >> 1) - 1, y - 1, 3, 3); lines.forEach((l, i) => T.draw(g, l, x + 3, y + 5 + i * 9, { color: '#3a2416' })); };
    note(8, 22, 76, 34, '#f2df7a', ['FOLLOW THE', 'MONEY >', 'WUNCLER']);
    note(166, 94, 84, 16, '#bfe3f2', ['TRUST NOBODY.']);
    note(392, 150, 78, 34, '#f1e6d2', ['WHO LETS', 'STINKMEANER', 'OUT OF HELL?']);
    note(398, 20, 70, 25, '#f2c0c0', ['ASK RUCKUS', '(DO NOT)']);
    return c;
  }
  function thumb(m) {
    if (thumbs[m.id]) return thumbs[m.id];
    const t = THUMB[m.id], bg = BD.Backgrounds[t[0]], [c, g] = U.canvas(44, 26);
    bg.init();
    const sx = cam.x, sy = cam.y, sz = cam.zoom;
    cam.set(t[1], 0, 1.25);
    g.setTransform(44 / BD.W, 0, 0, 44 / BD.W, 0, -1);
    try { bg.draw(g, cam, Object.assign({ t: 3 }, t[2])); } catch (e) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#444'; g.fillRect(0, 0, 44, 26); }
    cam.set(sx, sy, sz);
    return (thumbs[m.id] = c);
  }
  function line(g, x0, y0, x1, y1, col, dash) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
    g.fillStyle = col;
    for (let i = 0; i <= n; i++) { if (dash && ((i / 3) | 0) % 2) continue; const k = i / n, sag = Math.sin(k * Math.PI) * 5; g.fillRect((x0 + (x1 - x0) * k) | 0, (y0 + (y1 - y0) * k + sag) | 0, 1, 1); }
  }
  S.board = {
    enter(prev) {
      const M = BD.MISSIONS;
      this.t = 0;
      let i = M.findIndex((m) => unlocked(m) && !cleared(m.id));
      if (i < 0) i = prev ? M.indexOf(prev) : 0;
      this.sel = Math.max(0, i);
      if (!cork) cork = buildCork();
      A().music('board'); A().intensity(0.5);
    },
    update(dt, rdt) {
      const M = BD.MISSIONS, cur = M[this.sel];
      this.t += rdt;
      const go = (dx, dy) => {
        let best = -1, bd = 1e9;
        M.forEach((m, i) => {
          if (i === this.sel) return;
          const ax = (m.x - cur.x) * dx + (m.y - cur.y) * dy, off = Math.abs((m.x - cur.x) * dy) + Math.abs((m.y - cur.y) * dx);
          if (ax <= 4) return;
          const d = ax + off * 2.2;
          if (d < bd) { bd = d; best = i; }
        });
        if (best >= 0) { this.sel = best; A().sfx('ui_move'); }
      };
      if (In.take('left')) go(-1, 0); if (In.take('right')) go(1, 0); if (In.take('up')) go(0, -1); if (In.take('down')) go(0, 1);
      if (In.take('confirm')) {
        if (unlocked(cur)) { A().sfx('ui_select'); BD.setScene(S.mission, cur); }
        else A().sfx('ui_locked');
      } else if (In.take('cancel') || In.take('map')) { A().sfx('ui_back'); BD.setScene(S.mission, BD.HUB); }
    },
    render(g) {
      const M = BD.MISSIONS;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(cork, 0, 0);
      T.draw(g, 'HUEY\'S BOARD', 10, 3, { color: '#f2df7a' });
      T.draw(g, 'ARROWS PICK   ENTER START   ESC STREET', FW - 10, 3, { color: '#b99a72', align: 'right' });
      for (const m of M) for (const n of m.needs) { // the red string
        const a = M.find((x) => x.id === n), on = unlocked(m);
        line(g, a.x, a.y - 27, m.x, m.y - 27, on ? '#5a0f14' : '#6a5238', !on);
        if (on) line(g, a.x, a.y - 28, m.x, m.y - 28, '#e03a36', false);
      }
      M.forEach((m, i) => {
        const x = m.x - 26, y = m.y - 26 + (i === this.sel ? -2 : 0), on = unlocked(m), cl = cleared(m.id);
        g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 3, y + 4, 52, 50);
        if (on) {
          g.fillStyle = '#f4efe2'; g.fillRect(x, y, 52, 50); g.fillStyle = '#d8d0bc'; g.fillRect(x, y + 48, 52, 2);
          g.drawImage(thumb(m), x + 4, y + 4);
          T.draw(g, m.ep.replace('EPISODE ', 'EP '), x + 4, y + 33, { color: '#b3262d' });
          T.draw(g, SHORT[m.id].slice(0, 8), x + 4, y + 41, { color: '#3a2416' });
          if (cl) { // rank stamp
            g.fillStyle = '#f4efe2'; g.fillRect(x + 37, y + 31, 13, 15); g.fillStyle = '#c7352e'; g.fillRect(x + 37, y + 31, 13, 1); g.fillRect(x + 37, y + 45, 13, 1); g.fillRect(x + 37, y + 31, 1, 15); g.fillRect(x + 49, y + 31, 1, 15);
            T.draw(g, cl.rank, x + 39, y + 33, { color: '#c7352e', scale: 1 }); T.draw(g, cl.rank, x + 40, y + 33, { color: '#c7352e' });
            T.draw(g, cl.rank, x + 41, y + 35, { color: '#c7352e' });
          } else if (blink(3)) { g.fillStyle = '#ffe36e'; g.fillRect(x + 38, y + 33, 12, 9); T.draw(g, '!', x + 42, y + 34, { color: '#3a2416' }); }
        } else {
          g.fillStyle = '#b08a58'; g.fillRect(x, y, 52, 50); g.fillStyle = '#8f6d42'; g.fillRect(x, y + 48, 52, 2); g.fillRect(x + 4, y + 4, 44, 26);
          T.draw(g, '?', x + 21, y + 9, { color: '#5a4126', scale: 2 });
          T.draw(g, 'LOCKED', x + 8, y + 37, { color: '#7a2a22' });
        }
        g.fillStyle = '#14101a'; g.fillRect(x + 24, y - 3, 5, 5); g.fillStyle = on ? '#e03a36' : '#8a8a92'; g.fillRect(x + 25, y - 2, 3, 3); // push pin
        if (i === this.sel) {
          const o = blink(4) ? 0 : 1; g.fillStyle = '#ffe36e';
          for (const [cx, cy, sx, sy] of [[x - 3 - o, y - 3 - o, 1, 1], [x + 54 + o, y - 3 - o, -1, 1], [x - 3 - o, y + 52 + o, 1, -1], [x + 54 + o, y + 52 + o, -1, -1]]) { g.fillRect(cx, cy, sx * 6, sy * 2); g.fillRect(cx, cy, sx * 2, sy * 6); }
        }
      });
      // case file panel
      const m = M[this.sel], on = unlocked(m), cl = cleared(m.id);
      Px.panel(g, 6, 196, FW - 12, 70, '#15121c', '#07060a', on ? '#b3262d' : '#5a5564');
      T.draw(g, on ? m.title : 'CASE LOCKED', 14, 202, { color: on ? '#fff3d6' : '#8a8496', scale: 2 });
      T.draw(g, on ? m.ep + '   ' + m.src : 'finish ' + m.needs.filter((n) => !cleared(n)).map((n) => '"' + M.find((x) => x.id === n).title + '"').join(' and ') + ' first', 14, 220, { color: '#b3262d' });
      if (on) T.wrap(m.blurb, 62).forEach((l, i) => T.draw(g, l, 14, 232 + i * 10, { color: '#d9d0c0' }));
      if (cl) { T.draw(g, 'BEST', FW - 44, 204, { color: '#8a8496', align: 'right' }); T.draw(g, cl.rank, FW - 34, 200, { color: '#ffe36e', scale: 3, outline: '#07060a' }); }
      if (on && blink(2.2)) T.draw(g, 'ENTER: START', FW - 14, 254, { color: '#ffe36e', align: 'right' });
    },
  };

  /* --------------------------------------------------------------- mission */
  const HELP = ['A/D or ARROWS  move', 'SPACE / W      jump', 'J              strike (x3 combo)', 'K              kick   (S+K launcher)', 'L              guard / tap to parry', 'SHIFT          dash through attacks', 'F              Clarity (full meter)', 'S              crouch / hide', 'E              talk / use', 'TAB            case board'];
  S.mission = {
    enter(m) { this.m = m; this.w = new BD.World(m); this.paused = false; this.psel = 0; },
    exit() { BD.timeScale = 1; BD.hitstop = 0; A().muffle(false); if (A().shush) A().shush(); BD.FX.clear(); },
    menu() {
      const m = this.m, voices = A().voices !== false;
      return [
        ['RESUME', () => {}],
        ['SPOKEN VOICES: ' + (voices ? 'ON' : 'OFF'), () => { if (A().setVoices) A().setVoices(!voices); BD.Save.data.opts.voices = !voices; BD.Save.write(); return true; }],
        m.hub ? ['OPEN THE CASE BOARD', () => BD.setScene(S.board, null)] : ['RESTART EPISODE', () => BD.setScene(S.mission, m)],
        m.hub ? ['BACK TO THE TITLE', () => BD.setScene(S.title)] : ['BACK TO THE STREET', () => BD.setScene(S.mission, BD.HUB)],
      ];
    },
    update(dt, rdt) {
      const w = this.w;
      if (this.paused) {
        const opts = this.menu();
        if (In.take('up')) { this.psel = (this.psel + opts.length - 1) % opts.length; A().sfx('ui_move'); }
        if (In.take('down')) { this.psel = (this.psel + 1) % opts.length; A().sfx('ui_move'); }
        if (In.take('pause') || In.take('cancel')) { this.paused = false; A().muffle(false); return; }
        if (In.take('confirm')) {
          A().sfx('ui_select');
          if (opts[this.psel][1]() === true) return;      // toggles keep the menu open
          A().muffle(false); this.paused = false;
        }
        return;
      }
      if (!w.cineOn && !w.card && !w.over && In.take('pause')) { this.paused = true; this.psel = 0; A().muffle(true); A().sfx('ui_back'); In.clear(); return; }
      if (this.m.hub && !w.cineOn && In.take('map')) { A().sfx('paper'); BD.hubX = w.player.x; BD.setScene(S.board, null); return; }
      w.update(dt, rdt);
      if (w.done) BD.setScene(S.results, { m: this.m, stats: w.stats });
    },
    render(g) {
      this.w.render(g);
      if (!this.paused) return;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = 'rgba(8,6,14,0.8)'; g.fillRect(0, 0, FW, FH);
      const b = T.banner('PAUSED', 4, '#fff3d6', '#ffb21e', '#1a0d10', 0.2);
      g.drawImage(b, Math.round((FW - b.width) / 2), 22);
      this.menu().forEach((o, i) => { const on = i === this.psel; T.draw(g, (on ? '▶ ' : '  ') + o[0], 40, 78 + i * 14, { color: on ? '#ffe36e' : '#d9d0c0', outline: '#07060a' }); });
      Px.panel(g, 232, 66, 236, 122, '#15121c', '#07060a', '#b3262d');
      HELP.forEach((s2, i) => T.draw(g, s2, 240, 74 + i * 11, { color: '#d9d0c0' }));
    },
  };

  /* --------------------------------------------------------------- results */
  const QUIPS = {
    S: 'That was pimpin\' at a PROFESSIONAL level. And I would know. I am A Pimp Named Slickback.',
    A: 'Clean work, lil\' man. A Pimp Named Slickback has seen worse. A Pimp Named Slickback has DONE worse.',
    B: 'It\'s like I always say: a bruise is just a receipt for a lesson. That\'ll be fifty dollars.',
    C: 'You got hit so much I felt it in MY hat. And it\'s "A Pimp Named Slickback". All four words. You say the whole thing.',
  };
  S.results = {
    enter(o) {
      const s = o.stats, m = o.m;
      this.m = m; this.s = s; this.t = 0; this.stamped = false; this.shown = 0;
      this.rank = s.retries === 0 && s.dmg <= 22 ? 'S' : (s.retries === 0 && s.dmg <= 60) || (s.retries <= 1 && s.dmg <= 30) ? 'A' : s.retries <= 2 ? 'B' : 'C';
      const old = cleared(m.id);
      this.fresh = BD.MISSIONS.filter((x) => !unlocked(x));
      if (!old || RANKS.indexOf(this.rank) < RANKS.indexOf(old.rank)) BD.Save.data.cleared[m.id] = { rank: this.rank, time: Math.round(s.time) };
      BD.Save.write();
      this.fresh = this.fresh.filter((x) => unlocked(x));
      const mm = (s.time / 60) | 0, ss = ('0' + ((s.time | 0) % 60)).slice(-2);
      this.rows = [['TIME IN THE FIGHT', mm + ':' + ss], ['DAMAGE TAKEN', String(Math.round(s.dmg))], ['BEST COMBO', s.combo + ' HITS'], ['PARRIES', String(s.parries)], ['TIMES WHOOPED', String(s.retries)]];
      this.quip = T.wrap(QUIPS[this.rank], 21);
      A().music('board'); A().intensity(0.2); A().sting('victory');
    },
    update(dt, rdt) {
      this.t += rdt;
      const n = Math.min(this.rows.length, ((this.t - 0.5) / 0.3) | 0);
      if (n > this.shown) { this.shown = n; A().sfx('type'); }
      if (this.t > 2.3 && !this.stamped) { this.stamped = true; A().sfx('stamp'); cam.shake(0.5); if (this.fresh.length) A().sting('unlock'); }
      if (this.t > 2.8 && In.take('confirm')) { A().sfx('ui_select'); BD.setScene(S.mission, BD.HUB); }
    },
    render(g) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#120f18'; g.fillRect(0, 0, FW, FH);
      g.fillStyle = '#1b1624'; for (let y = 0; y < FH; y += 8) g.fillRect(0, y, FW, 1);
      const b = T.banner('CASE CLOSED', 4, '#fff3d6', '#ffb21e', '#1a0d10', 0.2);
      g.drawImage(b, 14, 8);
      T.draw(g, '"' + this.m.title + '"', 18, 48, { color: '#b3262d' });
      Px.panel(g, 12, 62, 232, 112, '#efe6d2', '#07060a', '#ffffff'); // the case sheet
      for (let i = 0; i < this.shown; i++) {
        const r = this.rows[i], y = 74 + i * 18;
        T.draw(g, r[0], 22, y, { color: '#3a2416' }); T.draw(g, r[1], 176, y, { color: '#14101a', align: 'right' });
        g.fillStyle = '#c9bfa8'; g.fillRect(22, y + 10, 154, 1);
      }
      if (this.stamped) { // rank stamp
        const k = Math.min(1, (this.t - 2.3) / 0.1), sc = 6 + Math.round((1 - k) * 4), x = 190, y = 86;
        g.fillStyle = '#c7352e'; g.fillRect(x - 6, y - 6, 54, 3); g.fillRect(x - 6, y + 51, 54, 3); g.fillRect(x - 6, y - 6, 3, 60); g.fillRect(x + 45, y - 6, 3, 60);
        T.draw(g, this.rank, x + 21, y + 2, { align: 'center', color: '#c7352e', scale: sc });
        T.draw(g, 'RANK', x + 21, y + 56, { align: 'center', color: '#c7352e' });
      }
      // A Pimp Named Slickback reviews your work
      const def = BD.CAST.slick;
      Px.panel(g, 258, 62, 210, 112, '#15121c', '#07060a', def.color);
      Px.panel(g, 264, 68, 62, 76, U.shade(def.color, -0.45), '#07060a', def.color);
      g.save(); g.beginPath(); g.rect(267, 71, 56, 70); g.clip();
      BD.Portrait.draw(g, 'slick', 295, 110, 14, 1, this.rank === 'C' ? 'deadpan' : 'sly', this.t > 2.4 && this.t < 5 ? Math.max(0, Math.sin(this.t * 24)) * 0.8 : 0, 0.016);
      g.restore();
      T.draw(g, 'A PIMP NAMED', 266, 148, { color: '#e8c33a' }); T.draw(g, 'SLICKBACK', 266, 158, { color: '#e8c33a' });
      if (this.t > 2.4) { const n = ((this.t - 2.4) * 40) | 0; let c = 0; this.quip.forEach((l, i) => { const s = l.slice(0, Math.max(0, n - c)); c += l.length + 1; T.draw(g, s, 332, 70 + i * 10, { color: '#f4ecdc' }); }); }
      if (this.t > 2.8) {
        this.fresh.forEach((m, i) => T.draw(g, 'NEW CASE FILE: ' + m.title, 14, 184 + i * 11, { color: '#ffe36e', outline: '#07060a' }));
        if (blink(2.2)) T.draw(g, 'ENTER: BACK TO THE STREET', FW - 14, 252, { color: '#ffe36e', align: 'right', outline: '#07060a' });
      }
    },
  };

  /* ------------------------------------------------------------------ boot */
  BD.start = () => {
    BD.boot();
    const q = new URLSearchParams(location.search), o = BD.Save.data.opts;
    A().setVolumes(o.music, o.sfx);
    if (o.voices === false && A().setVoices) A().setVoices(false);
    BD.onFirstGesture = () => A().init();
    if (q.get('unlock')) BD.cheat = true;
    if (q.get('reset')) BD.Save.reset();
    const m = q.get('m') && BD.MISSIONS.find((x) => x.id === q.get('m'));
    if (m) { BD.cheat = true; BD.setScene(S.mission, m); }
    else BD.setScene(q.get('board') ? S.board : q.get('hub') ? (BD.hubSeen = true, S.mission) : S.title, q.get('hub') ? BD.HUB : undefined);
  };
})();
