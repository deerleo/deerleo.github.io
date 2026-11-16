// EMBERDEEP — input, loop, HUD, menus, title & ending.
(function () {
  'use strict';
  const EMB = window.EMB, R = EMB.R, A = EMB.A, W = R.W, H = R.H, TAU = Math.PI * 2;
  const FONT = '"Yu Gothic UI","Hiragino Sans","Meiryo","Segoe UI",sans-serif';
  const SAVE_KEY = 'emberdeep.save.v1';
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  let scale = 1;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), ww = window.innerWidth, wh = window.innerHeight;
    const k = Math.min(ww / W, wh / H); cv.style.width = Math.floor(W * k) + 'px'; cv.style.height = Math.floor(H * k) + 'px';
    cv.width = Math.floor(W * k * dpr); cv.height = Math.floor(H * k * dpr); scale = cv.width / W;
  }
  let lastW = 0, lastH = 0;
  window.addEventListener('resize', resize); resize();

  const S = EMB.S = { mode: 'title', g: null, menu: null, toasts: [], banner: null, cards: [], fade: 0, t: 0, titleSel: 0, introT: 0, endT: 0, pendingLamp: false, bossName: '', hintT: 0, hintKey: null, cardT: 0 };
  const keys = {}, pressed = {}; const mouse = { x: W / 2, y: H / 2, down: false, clicked: false, rclicked: false, moved: 0 };

  function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  S.titleSel = hasSave() ? 1 : 0;
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S.g.serialize())); } catch (e) { } }
  function newGame() { S.g = new EMB.Game(null, (Date.now() & 0xffff) + 1); S.g.flags.hints = {}; afterStart(); S.mode = 'intro'; S.introT = 0; }
  function loadGame() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); S.g = new EMB.Game(d, (Date.now() & 0xffff) + 1); if (!S.g.flags.hints) S.g.flags.hints = {}; afterStart(); S.mode = 'play'; S.fade = 1; } catch (e) { newGame(); } }
  function afterStart() { S.toasts = []; S.cards = []; S.banner = null; S.menu = null; R.P.length = 0; R.cam.x = S.g.p.x; R.cam.y = S.g.p.y; drain(); }

  // ------------------------------------------------------------ input
  const MAP = {
    KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
    KeyJ: 'attack', KeyZ: 'attack', Space: 'roll', KeyK: 'roll', KeyX: 'roll', KeyL: 'flare', KeyC: 'flare', ShiftLeft: 'flare', ShiftRight: 'flare',
    KeyF: 'flask', KeyV: 'flask', KeyR: 'flask', KeyE: 'interact', Enter: 'interact', KeyQ: 'swap', Tab: 'equip', KeyI: 'equip', KeyM: 'map', Escape: 'pause', KeyP: 'pause'
  };
  window.addEventListener('keydown', e => {
    const k = MAP[e.code]; if (!k) return; e.preventDefault(); A.init();
    if (!keys[k]) pressed[k] = true; keys[k] = true;
  });
  window.addEventListener('keyup', e => { const k = MAP[e.code]; if (k) keys[k] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  function mpos(e) { const r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * W; mouse.y = (e.clientY - r.top) / r.height * H; }
  cv.addEventListener('mousemove', e => { mpos(e); mouse.moved = 2; });
  cv.addEventListener('mousedown', e => { mpos(e); A.init(); e.preventDefault(); if (e.button === 0) { mouse.clicked = true; mouse.down = true; } else if (e.button === 2) mouse.rclicked = true; });
  window.addEventListener('mouseup', () => { mouse.down = false; });
  cv.addEventListener('contextmenu', e => e.preventDefault());

  // ------------------------------------------------------------ events
  function toast(text, gold) { S.toasts.push({ text: text, t: 0, gold: gold }); if (S.toasts.length > 3) S.toasts.shift(); }
  function banner(big, small, col) { S.banner = { big: big, small: small || '', t: 0, col: col || '#ffe2a0' }; }
  function drain() {
    const g = S.g; if (!g) return; let dirty = false;
    for (const e of g.ev) {
      R.onEvent(e, g); A.ev(e);
      switch (e.t) {
        case 'msg': toast(e.text); break;
        case 'item': S.cards.push(e.item); dirty = true; break;
        case 'lamp': banner('大燈が灯った', e.name, '#ffd98a'); dirty = true; break;
        case 'zone': banner(g.z.def.name, '', '#d8d4f0'); S.fade = 1; break;
        case 'rest': if (e.menu) S.pendingLamp = true; dirty = true; break;
        case 'respawn': S.fade = 1; toast('大燈のそばで目を覚ました'); break;
        case 'warp': S.fade = 1; break;
        case 'boss': S.bossName = EMB.ENEMIES[e.type].name; banner(S.bossName, e.type === 'eater' ? '大燈を喰らったもの' : '坑道の主', '#ff7aa8'); break;
        case 'arena': if (!e.boss) toast('カゲの気配 ― 扉が閉ざされた！'); break;
        case 'cleared': if (e.boss) banner('討伐', S.bossName, '#ffe27a'); else toast('カゲを退けた。扉が開く'); dirty = true; break;
        case 'roomlit': toast('この部屋の火鉢がすべて灯った ― カゲはもう戻らない', true); dirty = true; break;
        case 'crack': toast('壁が崩れた！ 奥に何かある', true); dirty = true; break;
        case 'door': if (e.open && e.mode === 'seal') toast('封じられた扉が開いた', true); if (e.open && e.mode === 'gate') banner('炉心への門が開いた', '', '#ffd98a'); break;
        case 'forge': case 'chest': dirty = true; break;
        case 'roll': g.flags.hints.roll = 1; break;
        case 'heal': g.flags.hints.flask = 1; break;
        case 'flare': g.flags.hints.flare = 1; break;
        case 'swap': g.flags.hints.swap = 1; toast(EMB.WEAPONS[e.w].name); break;
        case 'ending': S.mode = 'ending'; S.endT = 0; dirty = true; break;
      }
    }
    g.ev.length = 0;
    if (dirty) save();
  }

  // ------------------------------------------------------------ menus
  function openLamp() {
    const g = S.g, p = g.p;
    function build() {
      const items = [];
      for (const k of ['blade', 'cloak']) {
        const f = EMB.FORGE[k], lv = p.forge[k], max = lv >= f.cost.length, c = max ? 0 : f.cost[lv];
        items.push({ label: f.name + '  ' + '◆'.repeat(lv) + '◇'.repeat(f.cost.length - lv), right: max ? '最大' : '鉱晶 ' + c, enabled: !max && p.cry >= c, desc: f.desc + (max ? '' : p.cry >= c ? '' : '（鉱晶が足りない）'), act: () => { if (g.buy(k)) { drain(); S.menu.items = build(); } } });
      }
      items.push({ label: '装備・護符を見直す', right: 'Tab', enabled: true, desc: '武器と護符（2 つまで）を付け替える。', act: () => openEquip(true) });
      const lamps = EMB.LAMP_ORDER.filter(l => g.flags.lamps[l] && l !== p.lamp);
      for (const l of lamps) { const lp = g.lampPos(l); items.push({ label: '転移 ― ' + lp.name, right: '', enabled: true, desc: '灯した大燈へ火を渡って移動する。', act: () => { S.menu = null; S.mode = 'play'; g.warp(l); drain(); S.pendingLamp = false; } }); }
      items.push({ label: '立ち去る', right: 'Esc', enabled: true, desc: '', act: closeMenu });
      return items;
    }
    S.menu = { title: '大燈 ― ' + g.lampPos(p.lamp).name, sub: '体力と油瓶が満ちた。倒したカゲは戻ってくる（すべての火鉢を灯した部屋を除く）。', items: build(), sel: 0, kind: 'lamp' };
    S.mode = 'menu';
  }
  function openEquip(fromLamp) {
    const g = S.g, p = g.p; g.flags.hints.charm = 1;
    function build() {
      const items = [];
      p.weapons.forEach((w, i) => { const d = EMB.WEAPONS[w]; items.push({ label: (p.wi === i ? '● ' : '○ ') + d.name, right: '武器', enabled: true, desc: d.desc, act: () => { p.wi = i; p.combo = 0; S.menu.items = build(); } }); });
      p.charms.forEach(c => { const d = EMB.CHARMS[c], on = p.equipped.indexOf(c) >= 0; items.push({ label: (on ? '■ ' : '□ ') + d.name, right: '護符', enabled: on || p.equipped.length < 2, desc: d.desc + (!on && p.equipped.length >= 2 ? '（先に 1 つ外す）' : ''), act: () => { g.toggleCharm(c); S.menu.items = build(); save(); } }); });
      if (!p.charms.length) items.push({ label: '（護符はまだ持っていない）', right: '', enabled: false, desc: '宝箱を探そう。', act: () => { } });
      items.push({ label: '閉じる', right: 'Esc', enabled: true, desc: '', act: () => { if (fromLamp) openLamp(); else closeMenu(); } });
      return items;
    }
    S.menu = { title: '装備', sub: '攻撃力 ' + g.atk() + '　最大HP ' + g.maxhp() + '　Lv ' + p.lvl + '　護符は 2 つまで', items: build(), sel: 0, kind: 'equip', back: () => { if (fromLamp) openLamp(); else closeMenu(); } };
    S.mode = 'menu';
  }
  function openPause() {
    S.menu = {
      title: 'ポーズ', sub: '', kind: 'pause', sel: 0, items: [
        { label: 'ゲームに戻る', right: 'Esc', enabled: true, desc: '', act: closeMenu },
        { label: '効果音　' + (A.sfx ? 'ON' : 'OFF'), right: '', enabled: true, desc: '', act: () => { A.setSfx(!A.sfx); openPause(); S.menu.sel = 1; } },
        { label: '音楽　' + (A.bgm ? 'ON' : 'OFF'), right: '', enabled: true, desc: '', act: () => { A.setBgm(!A.bgm); openPause(); S.menu.sel = 2; } },
        { label: 'タイトルへ戻る', right: '', enabled: true, desc: '進行は最後に休んだ大燈から再開できる。', act: () => { S.menu = null; S.mode = 'title'; S.titleSel = hasSave() ? 1 : 0; } }]
    };
    S.mode = 'menu';
  }
  function closeMenu() { S.menu = null; S.mode = 'play'; }
  const MENU_X = 340, MENU_Y = 130, MENU_W = 600, ROW = 46;
  function menuInput() {
    const m = S.menu; if (!m) return;
    if (pressed.up) { m.sel = (m.sel + m.items.length - 1) % m.items.length; A.ev({ t: 'ui' }); }
    if (pressed.down) { m.sel = (m.sel + 1) % m.items.length; A.ev({ t: 'ui' }); }
    const y0 = MENU_Y + 110;
    if (mouse.moved > 0 || mouse.clicked) for (let i = 0; i < m.items.length; i++) if (mouse.x > MENU_X + 20 && mouse.x < MENU_X + MENU_W - 20 && mouse.y > y0 + i * ROW && mouse.y < y0 + (i + 1) * ROW) { m.sel = i; if (mouse.clicked) pressed.interact = true; }
    if (pressed.interact || pressed.attack) { const it = m.items[m.sel]; if (it.enabled) { A.ev({ t: 'ui', ok: true }); it.act(); } else A.ev({ t: 'deny' }); }
    else if (pressed.pause || (pressed.equip && m.kind !== 'pause')) { if (m.back) m.back(); else closeMenu(); }
  }
  function drawMenu() {
    const m = S.menu, g = S.g, h = 150 + m.items.length * ROW + 70;
    ctx.fillStyle = 'rgba(6,4,14,0.72)'; ctx.fillRect(0, 0, W, H);
    panel(MENU_X, MENU_Y, MENU_W, h);
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffe2a0'; ctx.font = '700 30px ' + FONT; ctx.fillText(m.title, MENU_X + 30, MENU_Y + 48);
    ctx.fillStyle = '#b8b0cc'; ctx.font = '500 16px ' + FONT; wrap(m.sub, MENU_X + 30, MENU_Y + 78, MENU_W - 60, 20);
    if (m.kind === 'lamp') { ctx.textAlign = 'right'; ctx.fillStyle = '#7ee0ff'; ctx.font = '700 22px ' + FONT; ctx.fillText('◆ ' + g.p.cry, MENU_X + MENU_W - 30, MENU_Y + 46); }
    const y0 = MENU_Y + 110;
    m.items.forEach((it, i) => {
      const y = y0 + i * ROW, sel = i === m.sel;
      if (sel) { ctx.fillStyle = 'rgba(255,190,100,0.16)'; rr(MENU_X + 20, y + 2, MENU_W - 40, ROW - 4, 8); ctx.fill(); ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.textAlign = 'left'; ctx.font = (sel ? '700 ' : '500 ') + '21px ' + FONT; ctx.fillStyle = it.enabled ? (sel ? '#fff4d8' : '#e0dcec') : '#6e6880'; ctx.fillText(it.label, MENU_X + 40, y + 30);
      ctx.textAlign = 'right'; ctx.font = '500 17px ' + FONT; ctx.fillStyle = it.enabled ? '#9fe4ff' : '#6e6880'; ctx.fillText(it.right || '', MENU_X + MENU_W - 40, y + 30);
    });
    const d = m.items[m.sel].desc; ctx.textAlign = 'left'; ctx.fillStyle = '#d8d0b8'; ctx.font = '500 17px ' + FONT; wrap(d || '', MENU_X + 30, y0 + m.items.length * ROW + 34, MENU_W - 60, 22);
    ctx.fillStyle = '#7e7892'; ctx.font = '500 14px ' + FONT; ctx.textAlign = 'right'; ctx.fillText('W/S・↑↓ 選ぶ　E・Enter・クリック 決定', MENU_X + MENU_W - 24, MENU_Y + h - 14);
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function panel(x, y, w, h) { ctx.fillStyle = 'rgba(22,16,36,0.96)'; rr(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.strokeStyle = 'rgba(255,200,120,0.18)'; ctx.lineWidth = 1; rr(x + 6, y + 6, w - 12, h - 12, 10); ctx.stroke(); }
  function wrap(text, x, y, w, lh) { let line = '', yy = y; for (const ch of text) { if (ctx.measureText(line + ch).width > w) { ctx.fillText(line, x, yy); line = ch; yy += lh; } else line += ch; } if (line) ctx.fillText(line, x, yy); return yy; }

  // ------------------------------------------------------------ item card
  function cardInfo(it) {
    const i = it.indexOf(':'), k = i < 0 ? it : it.slice(0, i), v = it.slice(i + 1);
    if (k === 'weapon') return { kind: '新しい武器', name: EMB.WEAPONS[v].name, desc: EMB.WEAPONS[v].desc, foot: 'Q でいつでも持ち替えられる', icon: v };
    if (k === 'charm') return { kind: '護符', name: EMB.CHARMS[v].name, desc: EMB.CHARMS[v].desc, foot: S.g.p.equipped.indexOf(v) >= 0 ? '身に着けた（Tab で付け替え）' : 'Tab で付け替えられる（2 つまで）', icon: 'charm' };
    return { kind: k === 'flare' ? '新しい力' : '宝物', name: EMB.ITEMS[k].name, desc: EMB.ITEMS[k].desc, foot: k === 'flare' ? 'L / C / Shift で放つ' : '', icon: k };
  }
  function drawCard() {
    const c = cardInfo(S.cards[0]), t = S.cardT, k = Math.min(1, t / 0.25), e = 1 - Math.pow(1 - k, 3);
    ctx.fillStyle = 'rgba(6,4,14,' + 0.7 * e + ')'; ctx.fillRect(0, 0, W, H);
    const w = 620, h = 330, x = W / 2 - w / 2, y = H / 2 - h / 2 + (1 - e) * 30;
    ctx.globalAlpha = e; panel(x, y, w, h);
    const cx = W / 2, cy = y + 96;
    ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 110); gr.addColorStop(0, 'rgba(255,200,110,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - 110, cy - 110, 220, 220);
    ctx.strokeStyle = 'rgba(255,220,150,0.35)'; ctx.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = S.t * 0.5 + i * TAU / 8; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 46, cy + Math.sin(a) * 46); ctx.lineTo(cx + Math.cos(a) * 78, cy + Math.sin(a) * 78); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over';
    icon(c.icon, cx, cy, 1.6);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffb347'; ctx.font = '700 17px ' + FONT; ctx.fillText(c.kind, cx, y + 182);
    ctx.fillStyle = '#fff4d8'; ctx.font = '700 34px ' + FONT; ctx.fillText(c.name, cx, y + 222);
    ctx.fillStyle = '#d8d0e8'; ctx.font = '500 19px ' + FONT; ctx.fillText(c.desc, cx, y + 258);
    ctx.fillStyle = '#9fe4ff'; ctx.font = '500 16px ' + FONT; ctx.fillText(c.foot, cx, y + 288);
    if (t > 0.5) { ctx.fillStyle = 'rgba(200,190,220,' + (0.6 + 0.4 * Math.sin(S.t * 5)) + ')'; ctx.font = '500 15px ' + FONT; ctx.fillText('J / E / クリック で閉じる', cx, y + h - 14); }
    ctx.globalAlpha = 1;
  }
  function icon(k, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round';
    if (k === 'sword') { ctx.rotate(-0.8); ctx.strokeStyle = '#e8ecf4'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(20, 0); ctx.stroke(); ctx.strokeStyle = '#e0b040'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-14, -7); ctx.lineTo(-14, 7); ctx.stroke(); ctx.strokeStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-15, 0); ctx.stroke(); }
    else if (k === 'spear') { ctx.rotate(-0.8); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(14, 0); ctx.stroke(); ctx.fillStyle = '#e8ecf4'; ctx.beginPath(); ctx.moveTo(12, -6); ctx.lineTo(28, 0); ctx.lineTo(12, 6); ctx.fill(); ctx.strokeStyle = '#e8ecf4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(8, 9); ctx.stroke(); }
    else if (k === 'hammer') { ctx.rotate(-0.8); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(12, 0); ctx.stroke(); ctx.fillStyle = '#9aa0b0'; ctx.fillRect(8, -14, 16, 28); ctx.strokeStyle = '#3a3e4a'; ctx.lineWidth = 2; ctx.strokeRect(8, -14, 16, 28); }
    else if (k === 'charm') { ctx.fillStyle = '#e8d8a8'; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(14, -8); ctx.lineTo(14, 18); ctx.lineTo(-14, 18); ctx.lineTo(-14, -8); ctx.fill(); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = '#ff8a3a'; ctx.beginPath(); ctx.arc(0, 4, 6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, -30); ctx.stroke(); }
    else if (k === 'flask') { ctx.fillStyle = '#8dffb0'; ctx.beginPath(); ctx.arc(0, 6, 14, 0, TAU); ctx.fill(); ctx.fillStyle = '#d8ffe4'; ctx.fillRect(-5, -18, 10, 12); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-6, -23, 12, 6); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-5, 2, 4, 0, TAU); ctx.fill(); }
    else if (k === 'flare') { R.flame(ctx, 0, 16, 13, S.t); }
    ctx.restore();
  }

  // ------------------------------------------------------------ hints
  function hint() {
    const g = S.g, p = g.p, hf = g.flags.hints, z = g.z;
    const near = (k, d, f) => z.objs.some(o => o.k === k && Math.hypot(o.cx - p.x, o.cy - p.y) < d && (!f || f(o)));
    if (!hf.move) { if (Math.hypot(p.x - EMB.START.x, p.y - EMB.START.y) > 2.5) hf.move = 1; else return ['WASD / 矢印キー', '移動']; }
    if (!hf.attack) { if (Object.keys(g.flags.crates).length || Object.keys(g.flags.lit).length) hf.attack = 1; else if (near('crate', 4.5)) return ['J / 左クリック', '攻撃 ― 木箱を壊してみよう']; }
    if (!hf.brazier) { if (Object.keys(g.flags.lit).length) hf.brazier = 1; else if (near('brazier', 5, o => !o.lit)) return ['J / 左クリック', '火鉢を叩いて灯そう。火は周りのカゲを焼き、怯ませる']; }
    if (!hf.roll && z.enemies.some(e => e.aggro)) return ['Space / 右クリック', '回避（一瞬無敵）。敵が赤く光ったら攻撃の合図'];
    if (!hf.pit && z.i === 0 && hf.roll) { const r = g.roomOf(p.x, p.y); if (r && r.id === 'rs') { if (p.x > 45.2) hf.pit = 1; else if (g.nearPit(p.x, p.y) || p.x > 41) return ['Space', '回避で 1 マス幅の穴を飛び越えられる']; } }
    if (!hf.flask && p.hp < g.maxhp() * 0.5 && p.flasks > 0) return ['F', '油瓶を飲んで回復（大燈で休むと満ちる）'];
    if (!hf.flare && p.hasFlare && p.flare >= 100) return ['L / C / Shift', '閃火 ― 溜めた火を放ち、周囲を焼き払う'];
    if (g.arena || z.enemies.some(e => e.aggro)) return null;
    if (!hf.swap && p.weapons.length > 1) return ['Q', '武器を持ち替える'];
    if (!hf.charm && p.charms.length > 2) return ['Tab', '護符を付け替える（2 つまで）'];
    if (!hf.map && Object.keys(g.flags.lamps).length > 1) { if (pressed.map) hf.map = 1; return ['M', '地図を開く']; }
    return null;
  }

  // ------------------------------------------------------------ minimap
  function drawMap(g, zi, ox, oy, s, allLit, showPlayer) {
    const def = g.defs[zi], seen = g.seen[zi], cur = g.z.i === zi; R.prep(def);
    for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) {
      const i = y * def.w + x; if (!seen[i] && !allLit) continue; const t = def.tiles[i]; if (t === EMB.T.ROCK) continue;
      const ri = def._near[i], room = def.rooms[ri], lit = allLit || g.groupLit(room.group);
      ctx.fillStyle = t === EMB.T.PIT ? (lit ? '#5a4630' : '#23223a') : t === EMB.T.SHELF ? '#3a3040' : lit ? '#c9a66a' : '#525a82';
      ctx.fillRect(ox + x * s, oy + y * s, s + 0.5, s + 0.5);
    }
    for (const sp of def.spawns) {
      const i = sp.y * def.w + sp.x; if (!seen[i] && !allLit) continue; const x = ox + (sp.x + 0.5) * s, y = oy + (sp.y + 0.5) * s;
      if (sp.k === 'lamp') { const lit = allLit || sp.lit || g.flags.lamps[sp.lamp]; ctx.fillStyle = lit ? '#fff2b0' : '#8088a8'; ctx.beginPath(); ctx.arc(x, y, Math.max(2.5, s * 0.9), 0, TAU); ctx.fill(); if (lit) { ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 1.5; ctx.stroke(); } }
      else if (sp.k === 'stairs') { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - s * 0.6, y - s * 0.6, s * 1.2, s * 1.2); }
      else if (sp.k === 'brazier' && s >= 5) { ctx.fillStyle = (allLit || g.flags.lit[sp.id]) ? '#ff9a3a' : '#39405e'; ctx.fillRect(x - 2, y - 2, 4, 4); }
      else if (sp.k === 'chest' && s >= 5 && !g.flags.chests[sp.id] && !sp.hidden) { ctx.fillStyle = '#ffe27a'; ctx.fillRect(x - 2.5, y - 2, 5, 4); }
      else if (sp.k === 'door' && cur && !allLit) { const o = g.z.objs.find(q => q.id === sp.id); if (o && !o.open) { ctx.fillStyle = '#ff6a8a'; for (const tl of sp.tiles) ctx.fillRect(ox + tl[0] * s, oy + tl[1] * s, s + 0.5, s + 0.5); } }
      else if (sp.k === 'crack' && s >= 5 && !g.flags.cracks[sp.id]) { ctx.fillStyle = '#9a8a94'; ctx.fillRect(ox + sp.x * s, oy + sp.y * s, s, s); }
    }
    if (cur && showPlayer) { ctx.fillStyle = Math.sin(S.t * 8) > 0 ? '#ffffff' : '#4ff0e0'; ctx.beginPath(); ctx.arc(ox + g.p.x * s, oy + g.p.y * s, Math.max(2.5, s * 0.6), 0, TAU); ctx.fill(); }
  }
  function drawMini(g) {
    const def = g.z.def, s = 2, vw = 190, vh = 112, x = W - vw - 20, y = 18;
    ctx.fillStyle = 'rgba(10,8,22,0.62)'; rr(x - 6, y - 6, vw + 12, vh + 12, 8); ctx.fill(); ctx.strokeStyle = 'rgba(180,150,100,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, vw, vh); ctx.clip();
    const ox = x + vw / 2 - g.p.x * s, oy = y + vh / 2 - g.p.y * s;
    drawMap(g, g.z.i, ox, oy, s, false, true); ctx.restore();
    ctx.textAlign = 'right'; ctx.fillStyle = '#b8b0cc'; ctx.font = '500 13px ' + FONT; ctx.fillText(def.name + '　M: 地図', W - 20, y + vh + 24);
  }
  function drawFullMap(g) {
    ctx.fillStyle = 'rgba(6,4,14,0.88)'; ctx.fillRect(0, 0, W, H);
    const def = g.z.def, s = Math.min(11, (W - 120) / def.w, (H - 170) / def.h), ox = W / 2 - def.w * s / 2, oy = 90 + (H - 170 - def.h * s) / 2;
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffe2a0'; ctx.font = '700 28px ' + FONT; ctx.fillText(def.name, W / 2, 56);
    drawMap(g, g.z.i, ox, oy, s, false, true);
    ctx.font = '500 14px ' + FONT; ctx.fillStyle = '#fff2b0';
    for (const sp of def.spawns) if (sp.k === 'lamp' && g.seen[g.z.i][sp.y * def.w + sp.x]) ctx.fillText(sp.name, ox + (sp.x + 0.5) * s, oy + sp.y * s - 8);
    ctx.fillStyle = '#b8b0cc'; ctx.font = '500 15px ' + FONT;
    ctx.fillText('明るい色：大燈が灯った区画　／　青い色：まだ闇の中　／　◯：大燈　□：階段　赤：閉じた扉　　M / Esc で閉じる', W / 2, H - 28);
  }

  // ------------------------------------------------------------ HUD
  function drawHUD(g) {
    const p = g.p, mh = g.maxhp();
    const bw = Math.min(440, 90 + mh * 7), x = 24, y = 20;
    ctx.fillStyle = 'rgba(10,8,22,0.7)'; rr(x - 4, y - 4, bw + 8, 30, 8); ctx.fill();
    ctx.fillStyle = '#3a1826'; rr(x, y, bw, 22, 5); ctx.fill();
    const f = Math.max(0, p.hp / mh); if (f > 0) { const gr = ctx.createLinearGradient(x, 0, x + bw, 0); gr.addColorStop(0, '#ff5a5a'); gr.addColorStop(1, '#ff9a5a'); ctx.fillStyle = gr; rr(x, y, Math.max(8, bw * f), 22, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x + 3, y + 3, Math.max(2, bw * f - 6), 5); }
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '700 15px ' + FONT; ctx.fillText('HP ' + p.hp + ' / ' + mh, x + 8, y + 17);
    // flasks
    for (let i = 0; i < p.flaskMax; i++) { const fx = x + bw + 22 + i * 26, fy = y + 12, full = i < p.flasks; ctx.fillStyle = full ? '#8dffb0' : 'rgba(80,90,90,0.7)'; ctx.beginPath(); ctx.arc(fx, fy + 3, 8, 0, TAU); ctx.fill(); ctx.fillRect(fx - 3, fy - 11, 6, 8); ctx.strokeStyle = 'rgba(10,8,22,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(fx, fy + 3, 8, 0, TAU); ctx.stroke(); }
    if (p.flaskMax) { ctx.fillStyle = '#9a94ac'; ctx.font = '500 12px ' + FONT; ctx.fillText('F', x + bw + 22 + p.flaskMax * 26 - 6, y + 20); }
    // xp
    const need = EMB.xpNeed(p.lvl), xw = 220; ctx.fillStyle = 'rgba(10,8,22,0.7)'; rr(x - 4, y + 32, xw + 70, 22, 6); ctx.fill();
    ctx.fillStyle = '#ffe27a'; ctx.font = '700 15px ' + FONT; ctx.fillText('Lv ' + p.lvl, x + 4, y + 48);
    ctx.fillStyle = '#3a3020'; ctx.fillRect(x + 58, y + 39, xw, 8); ctx.fillStyle = '#ffb347'; ctx.fillRect(x + 58, y + 39, xw * Math.min(1, p.xp / need), 8);
    // crystals
    ctx.fillStyle = 'rgba(10,8,22,0.7)'; rr(x + xw + 76, y + 32, 90, 22, 6); ctx.fill();
    ctx.fillStyle = '#5ad8ff'; ctx.beginPath(); ctx.moveTo(x + xw + 90, y + 36); ctx.lineTo(x + xw + 96, y + 43); ctx.lineTo(x + xw + 90, y + 50); ctx.lineTo(x + xw + 84, y + 43); ctx.fill();
    ctx.fillStyle = '#d0f6ff'; ctx.font = '700 15px ' + FONT; ctx.fillText(String(p.cry), x + xw + 104, y + 48);
    // flare
    if (p.hasFlare) {
      const full = p.flare >= 100, fw = 220; ctx.fillStyle = 'rgba(10,8,22,0.7)'; rr(x - 4, y + 58, fw + 70, 22, 6); ctx.fill();
      ctx.fillStyle = full ? (Math.sin(S.t * 10) > 0 ? '#fff2b0' : '#ffb347') : '#c88a50'; ctx.font = '700 14px ' + FONT; ctx.fillText('閃火', x + 4, y + 74);
      ctx.fillStyle = '#3a2418'; ctx.fillRect(x + 58, y + 65, fw, 8); ctx.fillStyle = full ? '#fff2b0' : '#ff8a3a'; ctx.fillRect(x + 58, y + 65, fw * p.flare / 100, 8);
      if (full) { ctx.fillStyle = '#fff2b0'; ctx.font = '700 13px ' + FONT; ctx.fillText('L / Shift', x + fw + 76, y + 74); }
    }
    // weapon
    const w = g.weapon(); ctx.fillStyle = 'rgba(10,8,22,0.7)'; rr(20, H - 84, 250, 64, 10); ctx.fill(); ctx.strokeStyle = 'rgba(180,150,100,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    icon(w.id, 54, H - 52, 0.9);
    ctx.textAlign = 'left'; ctx.fillStyle = '#fff4d8'; ctx.font = '700 17px ' + FONT; ctx.fillText(w.name, 90, H - 56);
    ctx.fillStyle = '#9a94ac'; ctx.font = '500 13px ' + FONT; ctx.fillText('攻撃力 ' + Math.round(g.atk() * w.mult) + (p.weapons.length > 1 ? '　Q: 持ち替え' : ''), 90, H - 36);
    if (p.equipped.length) { ctx.fillStyle = '#c8b48a'; ctx.font = '500 13px ' + FONT; ctx.fillText(p.equipped.map(c => EMB.CHARMS[c].name.replace('の護符', '')).join('・'), 24, H - 94); }
    drawMini(g);
    // boss bar
    const boss = g.z.enemies.find(e => e.d.boss && !e.dead);
    if (boss) {
      const bw2 = 560, bx = W / 2 - bw2 / 2, by = H - 64;
      ctx.fillStyle = 'rgba(10,8,22,0.75)'; rr(bx - 6, by - 26, bw2 + 12, 50, 8); ctx.fill();
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffd0e0'; ctx.font = '700 16px ' + FONT; ctx.fillText(boss.d.name + (boss.type === 'eater' ? (boss.state === 'scorch' ? '　― 灼かれて動けない。今だ！' : boss.shroud ? '　― 闇の衣（火鉢を 2 つ以上灯せ）' : '　― 衣が剥がれた！ 四つ灯せば動きを止められる') : ''), W / 2, by - 8);
      ctx.fillStyle = '#3a1830'; ctx.fillRect(bx, by, bw2, 14); ctx.fillStyle = boss.type === 'eater' && boss.shroud ? '#6a5a9a' : '#ff5a8e'; ctx.fillRect(bx, by, bw2 * Math.max(0, boss.hp / boss.maxhp), 14);
      if (boss.type === 'eater') for (let i = 0; i < 4; i++) { ctx.fillStyle = i < (boss.lit || 0) ? '#ffb347' : '#3d3846'; ctx.beginPath(); ctx.arc(W / 2 - 30 + i * 20, by + 28, 6, 0, TAU); ctx.fill(); }
    }
    // prompt
    if (g.prompt && S.mode === 'play') {
      const px = R.sx(g.prompt.x), py = R.sy(g.prompt.y) - (g.prompt.o.k === 'lamp' ? 120 : 52) + Math.sin(S.t * 4) * 3;
      ctx.font = '700 17px ' + FONT; const tw = ctx.measureText(g.prompt.text).width + 56;
      ctx.fillStyle = 'rgba(10,8,22,0.85)'; rr(px - tw / 2, py - 18, tw, 32, 16); ctx.fill(); ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffb347'; rr(px - tw / 2 + 6, py - 13, 24, 22, 6); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.textAlign = 'center'; ctx.fillText('E', px - tw / 2 + 18, py + 4);
      ctx.fillStyle = '#fff4d8'; ctx.textAlign = 'left'; ctx.fillText(g.prompt.text, px - tw / 2 + 38, py + 4);
    }
    // hint
    const h = S.mode === 'play' ? hint() : null;
    if (h) {
      ctx.font = '700 18px ' + FONT; const kw = ctx.measureText(h[0]).width + 24; ctx.font = '500 18px ' + FONT; const tw = ctx.measureText(h[1]).width, tot = kw + tw + 40, hx = W / 2 - tot / 2, hy = H - (boss ? 150 : 100);
      ctx.fillStyle = 'rgba(10,8,22,0.82)'; rr(hx, hy, tot, 40, 20); ctx.fill();
      ctx.fillStyle = '#ffe2a0'; rr(hx + 8, hy + 6, kw, 28, 8); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.font = '700 18px ' + FONT; ctx.textAlign = 'center'; ctx.fillText(h[0], hx + 8 + kw / 2, hy + 26);
      ctx.fillStyle = '#f0ecf8'; ctx.font = '500 18px ' + FONT; ctx.textAlign = 'left'; ctx.fillText(h[1], hx + kw + 20, hy + 26);
    }
    // toasts
    ctx.textAlign = 'center';
    S.toasts.forEach((t, i) => {
      const a = t.t < 0.2 ? t.t / 0.2 : t.t > 3.4 ? Math.max(0, (4 - t.t) / 0.6) : 1, ty = (S.banner ? 230 : 150) + i * 40;
      ctx.font = '600 19px ' + FONT; const tw = ctx.measureText(t.text).width + 44; ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(10,8,22,0.8)'; rr(W / 2 - tw / 2, ty - 24, tw, 34, 17); ctx.fill(); if (t.gold) { ctx.strokeStyle = 'rgba(255,190,100,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.fillStyle = t.gold ? '#ffe2a0' : '#f0ecf8'; ctx.fillText(t.text, W / 2, ty); ctx.globalAlpha = 1;
    });
    // banner
    if (S.banner) {
      const b = S.banner, a = b.t < 0.4 ? b.t / 0.4 : b.t > 2.6 ? Math.max(0, (3.2 - b.t) / 0.6) : 1;
      ctx.globalAlpha = a; ctx.fillStyle = 'rgba(6,4,14,0.55)'; ctx.fillRect(0, 96, W, b.small ? 96 : 72);
      ctx.fillStyle = b.col; ctx.font = '700 40px ' + FONT; ctx.fillText(b.big, W / 2, 146);
      if (b.small) { ctx.fillStyle = '#e0dcec'; ctx.font = '500 20px ' + FONT; ctx.fillText(b.small, W / 2, 178); }
      ctx.globalAlpha = 1;
    }
    if (p.state === 'dead') { const a = Math.min(1, p.t / 1.2); ctx.fillStyle = 'rgba(10,2,10,' + a * 0.75 + ')'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = a; ctx.fillStyle = '#ff8aa0'; ctx.font = '700 46px ' + FONT; ctx.fillText('灯が消えた……', W / 2, H / 2); ctx.fillStyle = '#d8d0e8'; ctx.font = '500 18px ' + FONT; ctx.fillText('最後に休んだ大燈から、やり直す（成長と持ち物はそのまま）', W / 2, H / 2 + 44); ctx.globalAlpha = 1; }
  }

  // ------------------------------------------------------------ title / intro / ending
  const embers = []; for (let i = 0; i < 70; i++) embers.push({ x: Math.random() * W, y: Math.random() * H, s: 1 + Math.random() * 3, v: 12 + Math.random() * 40, p: Math.random() * 6 });
  function drawBackdrop(warm) {
    const gr = ctx.createRadialGradient(W / 2, H * 0.62, 20, W / 2, H * 0.62, 620); gr.addColorStop(0, warm ? '#6a3a20' : '#3a2030'); gr.addColorStop(0.45, warm ? '#2a1420' : '#181028'); gr.addColorStop(1, '#07050f'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const e of embers) { const y = (e.y - S.t * e.v) % H, yy = y < 0 ? y + H : y, x = e.x + Math.sin(S.t * 0.8 + e.p) * 20; ctx.globalAlpha = 0.25 + 0.5 * (yy / H); ctx.fillStyle = '#ffb347'; ctx.fillRect(x, yy, e.s, e.s); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  function drawTitle() {
    drawBackdrop(false);
    const cx = W / 2, cy = 300;
    ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(cx, cy + 60, 0, cx, cy + 60, 260); gr.addColorStop(0, 'rgba(255,170,80,' + (0.5 + 0.05 * Math.sin(S.t * 7)) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - 260, cy - 200, 520, 520); ctx.globalCompositeOperation = 'source-over';
    // lantern
    ctx.fillStyle = '#3a2c20'; ctx.fillRect(cx - 26, cy + 20, 52, 76); ctx.fillStyle = '#ffd98a'; ctx.fillRect(cx - 19, cy + 28, 38, 60); ctx.fillStyle = '#3a2c20'; ctx.fillRect(cx - 2, cy + 28, 4, 60); ctx.fillRect(cx - 32, cy + 12, 64, 10); ctx.fillRect(cx - 32, cy + 94, 64, 10);
    ctx.strokeStyle = '#3a2c20'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy + 8, 20, Math.PI, 0); ctx.stroke();
    R.flame(ctx, cx, cy + 82, 13, S.t);
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffe2a0'; ctx.font = '900 92px "Segoe UI",' + FONT; ctx.shadowColor = '#ff8a3a'; ctx.shadowBlur = 30; ctx.fillText('EMBERDEEP', cx, 170); ctx.shadowBlur = 0;
    ctx.fillStyle = '#d8d0e8'; ctx.font = '600 26px ' + FONT; ctx.fillText('― 燈守りの坑道 ―', cx, 216);
    const items = ['はじめから', 'つづきから'], has = hasSave();
    items.forEach((it, i) => {
      const y = 470 + i * 56, sel = S.titleSel === i, en = i === 0 || has;
      if (sel) { ctx.fillStyle = 'rgba(255,190,100,0.16)'; rr(cx - 170, y - 34, 340, 48, 10); ctx.fill(); ctx.strokeStyle = '#ffb347'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = en ? (sel ? '#fff4d8' : '#c8c0d8') : '#5e586e'; ctx.font = (sel ? '700 ' : '500 ') + '26px ' + FONT; ctx.fillText(it, cx, y);
    });
    ctx.fillStyle = '#9a94ac'; ctx.font = '500 16px ' + FONT;
    ctx.fillText('移動 WASD / 矢印　　攻撃 J・左クリック　　回避 Space・右クリック　　調べる E　　回復 F　　地図 M　　装備 Tab　　ポーズ Esc', cx, 640);
    ctx.fillStyle = '#6e6880'; ctx.fillText('Enter / クリックで決定　・　音が出ます', cx, 668);
  }
  const INTRO = ['山の灯は、ある夜いっせいに消えた。', '坑道の底から這い出た〈カゲ〉が、大燈の火を喰らったのだ。', '残った火種は、ただひとつ。', '燈守り見習いのきみが提げる、小さなランタンだけ。', '', '潜れ。火鉢を叩き、大燈を灯し、炉心に火を返せ。'];
  function drawIntro() {
    drawBackdrop(false); ctx.textAlign = 'center';
    INTRO.forEach((l, i) => { const a = Math.max(0, Math.min(1, S.introT * 1.1 - i * 0.9)); ctx.globalAlpha = a; ctx.fillStyle = i === 5 ? '#ffe2a0' : '#e0dcec'; ctx.font = (i === 5 ? '700 28px ' : '500 24px ') + FONT; ctx.fillText(l, W / 2, 210 + i * 52); });
    ctx.globalAlpha = 1; if (S.introT > 1.2) { ctx.fillStyle = 'rgba(200,190,220,' + (0.6 + 0.4 * Math.sin(S.t * 5)) + ')'; ctx.font = '500 17px ' + FONT; ctx.fillText('Enter / クリック で始める', W / 2, 620); }
  }
  function drawEnding() {
    const g = S.g, t = S.endT;
    if (t < 3.2) { R.draw(ctx, g); const a = Math.min(1, t / 2.6); ctx.fillStyle = 'rgba(255,225,160,' + a + ')'; ctx.fillRect(0, 0, W, H); return; }
    drawBackdrop(true);
    const a0 = Math.min(1, (t - 3.2) / 1.5); ctx.fillStyle = 'rgba(255,225,160,' + (1 - a0) + ')'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = a0;
    // three zone maps, all lit
    const s = 2.9; let my = 40;
    for (let zi = 0; zi < 3; zi++) {
      const def = g.defs[zi]; let y0 = def.h, y1 = 0, x0 = def.w, x1 = 0;
      for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) if (def.tiles[y * def.w + x]) { if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x; }
      drawMap(g, zi, 320 - (x0 + x1 + 1) / 2 * s, my - y0 * s, s, true, false); my += (y1 - y0 + 1) * s + 22;
    }
    ctx.textAlign = 'left'; const x = 660; ctx.fillStyle = '#ffe2a0'; ctx.font = '700 40px ' + FONT; ctx.fillText('炉心に、火が戻った。', x, 150);
    const lines = ['大燈は坑道の底から山の頂までを照らし、', 'カゲは影へ、影はただの影へと還っていった。', '', '見習いの仕事は、これでおしまい。', '今日からきみは ― 一人前の燈守りだ。'];
    ctx.fillStyle = '#f0e8d8'; ctx.font = '500 22px ' + FONT; lines.forEach((l, i) => { ctx.globalAlpha = a0 * Math.max(0, Math.min(1, (t - 4.5) * 0.9 - i * 0.7)); ctx.fillText(l, x, 205 + i * 38); });
    const sa = Math.max(0, Math.min(1, (t - 9) / 1)); ctx.globalAlpha = sa;
    panel(x - 10, 410, 540, 190); const st = g.stats, mm = Math.floor(st.time / 60), ss = Math.floor(st.time % 60);
    const rows = [['冒険の時間', mm + ' 分 ' + ss + ' 秒'], ['レベル', 'Lv ' + g.p.lvl], ['倒したカゲ', st.kills + ' 体'], ['倒れた回数', st.deaths + ' 回'], ['見つけた隠し部屋', st.secrets + ' / 5']];
    rows.forEach((r, i) => { ctx.textAlign = 'left'; ctx.fillStyle = '#b8b0cc'; ctx.font = '500 19px ' + FONT; ctx.fillText(r[0], x + 20, 448 + i * 32); ctx.textAlign = 'right'; ctx.fillStyle = '#fff4d8'; ctx.font = '700 20px ' + FONT; ctx.fillText(r[1], x + 500, 448 + i * 32); });
    ctx.textAlign = 'center'; ctx.fillStyle = '#d8d0e8'; ctx.font = '500 16px ' + FONT; ctx.fillText(st.secrets < 5 ? '「つづきから」で、見落とした隠し部屋を探しに戻れる。' : 'すべての隠し部屋を見つけた！', x + 260, 632);
    if (t > 10.5) { ctx.fillStyle = 'rgba(255,240,200,' + (0.6 + 0.4 * Math.sin(S.t * 5)) + ')'; ctx.font = '600 18px ' + FONT; ctx.fillText('Enter / クリック でタイトルへ', x + 260, 670); }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ loop
  let last = performance.now(), acc = 0; const latch = {};
  function frame(now, manual) {
    if (EMB.debug.hold && manual !== true) { last = now; requestAnimationFrame(frame); return; }
    let dt = Math.min(0.05, (now - last) / 1000); last = now; S.t += dt;
    if (window.innerWidth !== lastW || window.innerHeight !== lastH) { lastW = window.innerWidth; lastH = window.innerHeight; resize(); }
    if (mouse.moved > 0) mouse.moved--;
    const g = S.g, confirm = pressed.interact || pressed.attack || mouse.clicked || pressed.roll;
    if (S.mode !== 'play') for (const k in latch) delete latch[k];
    if (S.mode === 'title') {
      if (pressed.up || pressed.down) { S.titleSel = 1 - S.titleSel; A.ev({ t: 'ui' }); }
      if (mouse.moved > 0 || mouse.clicked) for (let i = 0; i < 2; i++) if (Math.abs(mouse.x - W / 2) < 170 && mouse.y > 436 + i * 56 && mouse.y < 484 + i * 56) S.titleSel = i;
      if (confirm) { A.init(); A.ev({ t: 'ui', ok: true }); if (S.titleSel === 1 && hasSave()) loadGame(); else if (S.titleSel === 0) newGame(); else A.ev({ t: 'deny' }); }
    } else if (S.mode === 'intro') {
      S.introT += dt; if (confirm && S.introT > 0.4) { if (S.introT < 6) S.introT = 7; else { S.mode = 'play'; S.fade = 1; banner(g.z.def.name, '', '#d8d4f0'); } }
    } else if (S.mode === 'ending') {
      S.endT += dt; R.update(dt, g); if (S.endT > 10.5 && confirm) { S.mode = 'title'; S.titleSel = 1; }
    } else if (S.mode === 'menu') { menuInput(); }
    else if (S.mode === 'map') { if (pressed.map || pressed.pause || confirm) S.mode = 'play'; }
    else if (S.mode === 'card') {
      S.cardT += dt; if (S.cardT > 0.5 && (pressed.interact || pressed.attack || mouse.clicked)) { S.cards.shift(); S.cardT = 0; if (!S.cards.length) S.mode = 'play'; }
    } else if (S.mode === 'play') {
      if (S.cards.length) { S.mode = 'card'; S.cardT = 0; }
      else if (S.pendingLamp) { S.pendingLamp = false; openLamp(); }
      else if (pressed.pause) openPause();
      else if (pressed.equip && g.p.state !== 'dead') openEquip(false);
      else if (pressed.map) { S.mode = 'map'; g.flags.hints.map = 1; }
      else {
        acc += dt;
        const wx = (mouse.x - W / 2) / R.TS + R.cam.x, wy = (mouse.y - H / 2) / R.TS + R.cam.y;
        // latch one-shot inputs until a sim step consumes them (a frame may run zero steps on fast displays)
        if (mouse.clicked) { latch.attack = true; latch.aim = Math.atan2(wy - g.p.y, wx - g.p.x); } else if (pressed.attack) { latch.attack = true; latch.aim = undefined; }
        if (pressed.roll || mouse.rclicked) latch.roll = true;
        if (pressed.flare) latch.flare = true; if (pressed.flask) latch.flask = true; if (pressed.interact) latch.interact = true; if (pressed.swap) latch.swap = true;
        while (acc >= 1 / 60) {
          acc -= 1 / 60;
          const inp = { mx: (keys.right ? 1 : 0) - (keys.left ? 1 : 0), my: (keys.down ? 1 : 0) - (keys.up ? 1 : 0) };
          for (const k in latch) { inp[k] = latch[k]; delete latch[k]; }
          const bot = EMB.debug.bot;
          g.update(1 / 60, bot ? bot.step() : inp); if (bot) bot.onEvents(g.ev); drain();
          if (S.mode !== 'play') break;
        }
        R.update(dt, g);
        for (const t of S.toasts) t.t += dt; S.toasts = S.toasts.filter(t => t.t < 4);
        if (S.banner) { S.banner.t += dt; if (S.banner.t > 3.2) S.banner = null; }
        A.danger = g.z.enemies.filter(e => e.aggro && !e.dead).length; A.boss = !!(g.arena && g.arena.room.boss); A.zone = g.z.i;
        const rm = g.roomOf(g.p.x, g.p.y); A.bright = rm && g.groupLit(rm.group) ? 1 : 0;
      }
    }
    A.tick();
    S.fade = Math.max(0, S.fade - dt * 1.6);
    // draw
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (S.mode === 'title') drawTitle();
    else if (S.mode === 'intro') drawIntro();
    else if (S.mode === 'ending') drawEnding();
    else {
      R.draw(ctx, g); drawHUD(g);
      if (S.mode === 'menu') drawMenu(); else if (S.mode === 'map') drawFullMap(g); else if (S.mode === 'card') drawCard();
    }
    if (S.fade > 0) { ctx.fillStyle = 'rgba(6,4,14,' + S.fade + ')'; ctx.fillRect(0, 0, W, H); }
    for (const k in pressed) pressed[k] = false; mouse.clicked = false; mouse.rclicked = false;
    if (manual !== true) requestAnimationFrame(frame);
  }
  // test hook: advance n frames by hand (used when the tab is not being painted)
  EMB.debug = { S: S, save: save, drain: drain, keys: keys, pressed: pressed, mouse: mouse, run: function (n) { for (let i = 0; i < n; i++) frame(last + 1000 / 60, true); } };
  requestAnimationFrame(frame);
})();
