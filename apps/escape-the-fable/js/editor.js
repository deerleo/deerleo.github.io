// Level workshop: a top-down editor for rooms, locks and clues, with live validation,
// SCAMPER remixing, JSON import/export and share links.
import { CATALOG, LOCK_NAMES, rectOf, FRONT } from './catalog.js';
import { THEMES, THEME_IDS, DIFFICULTY } from './themes.js';
import { SYMBOLS, SYMBOL_IDS } from './symbols.js';
import { RNG, randomSeed } from './rng.js';
import { newLevel, addProp, removeProp, setLock, clearLock, setClueStyle, setSplit, makeRows, addPhoto, removePhoto, photoDiff, thingsFor, thingsAt, propById, placeTops, slotFor, SLOT_CAP, codeFits } from './levelops.js';
import { checkLevel, thingInfo, lockSummary, propName, snapToWall, wallOf, cleanLevel, parseLevel, encodeShare, solve } from './manifest.js';
import { generate, layoutLevel, scamper, SCAMPER, refreshPhoto, hidePhoto } from './generator.js';
import { isWord } from './words.js';
import { TIERS } from './mergepuzzle.js';
import { el, $, toast, symbolSVG } from './ui.js';

const ROLE_COLOR = { container: '#d9a21b', hide: '#2f8f9c', clue: '#8a63b5', exit: '#c8473c', decor: '#9c9280' };
const roleOf = (c) => (c.container ? (c.container.exit ? 'exit' : 'container') : c.hide ? 'hide' : c.inscribe || c.feature ? 'clue' : 'decor');
const STYLE_NAMES = { logic: 'Code-breaker lines (deduce it)', plain: 'Written out in full', torn: 'Note torn in two halves', clock: 'Stopped clock', books: 'Book count on a shelf', radio: 'Radio dial frequency' };
const SLOT_WORD = { holds: 'Inside the', hidden: 'Hidden at the', shown: 'Written on the', secret: 'Secretly in the disturbed' };
const STORE = 'escape-the-fable/workshop';

export class Editor {
  constructor(app) {
    this.app = app;
    this.rng = new RNG(randomSeed());
    this.sel = null; this.history = []; this.spoilers = false; this.drag = null;
    this.build();
    addEventListener('resize', () => this.draw());
    document.addEventListener('keydown', (e) => this.key(e));
  }

  // ---------------------------------------------------------------- shell
  build() {
    const root = $('#editor');
    const themeSel = el('select', { onchange: (e) => this.edit(() => { this.level.theme = e.target.value; }) }, THEME_IDS.map((id) => el('option', { value: id }, THEMES[id].name)));
    const diffSel = el('select', { onchange: (e) => this.edit(() => { this.level.difficulty = e.target.value; }) }, Object.keys(DIFFICULTY).map((d) => el('option', { value: d }, DIFFICULTY[d].name)));
    const name = el('input', { type: 'text', maxlength: 60, onchange: (e) => this.edit(() => { this.level.name = e.target.value || 'Untitled room'; }) });
    const size = (k) => el('input', { type: 'number', min: 4, max: 13, step: 0.5, onchange: (e) => this.resizeRoom(k, +e.target.value) });
    this.top = { themeSel, diffSel, name, w: size('w'), d: size('d') };
    const file = el('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: async (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) this.importText(await f.text()); } });
    this.canvas = el('canvas');
    this.left = el('aside', { class: 'ed-left' });
    this.right = el('aside', { class: 'ed-right' });
    root.replaceChildren(
      el('header', { class: 'ed-top' },
        el('button', { class: 'btn', onclick: () => this.app.showMenu() }, '← Menu'),
        el('label', {}, 'Room name', name), el('label', {}, 'Setting', themeSel), el('label', {}, 'Difficulty', diffSel), el('label', {}, 'Width m', this.top.w), el('label', {}, 'Depth m', this.top.d),
        el('button', { class: 'btn', title: 'Generate a complete room in this setting and difficulty', onclick: () => this.generate(false) }, 'Generate'),
        el('button', { class: 'btn', title: 'Random setting, random difficulty', onclick: () => this.generate(true) }, 'Surprise me'),
        el('button', { class: 'btn', title: 'Start from an empty room', onclick: () => this.blank() }, 'New'),
        el('button', { class: 'btn', title: 'Undo (Ctrl+Z)', onclick: () => this.undo() }, 'Undo'),
        el('span', { class: 'spacer' }),
        el('button', { class: 'btn', onclick: () => file.click() }, 'Import JSON'), file,
        el('button', { class: 'btn', onclick: () => this.exportJSON() }, 'Export JSON'),
        el('button', { class: 'btn', onclick: () => this.copyLink() }, 'Copy share link'),
        el('button', { class: 'btn primary', onclick: () => this.playtest() }, '▶ Playtest')),
      this.left, el('main', { class: 'ed-map' }, this.canvas, el('div', { class: 'tip' }, 'Click a piece on the left to add it · drag to move · R rotate · Del remove · Ctrl+Z undo')), this.right);
    // palette
    const groups = {};
    for (const id in CATALOG) (groups[CATALOG[id].group] = groups[CATALOG[id].group] || []).push(CATALOG[id]);
    for (const g in groups) {
      this.left.append(el('h4', {}, g));
      for (const c of groups[g]) this.left.append(el('button', { class: 'pal', style: `--c:${ROLE_COLOR[roleOf(c)]}`, title: c.desc, onclick: () => this.add(c.id) }, c.name));
    }
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => this.down(e));
    c.addEventListener('pointermove', (e) => this.move(e));
    c.addEventListener('pointerup', () => this.up());
    c.addEventListener('pointerleave', () => this.up());
  }

  show(level) {
    $('#editor').hidden = false;
    if (level) this.load(level);
    else if (!this.level) {
      let saved = null;
      try { saved = parseLevel(localStorage.getItem(STORE)); } catch (e) { /* nothing saved */ }
      this.load(saved || generate({ difficulty: 'easy' }));
    }
    this.refresh();
  }
  load(level) {
    this.level = parseLevel(JSON.parse(JSON.stringify(level)));
    this.sel = null; this.history = [];
    this.refresh();
  }
  get selected() { return this.sel && propById(this.level, this.sel); }

  // Every mutation goes through edit(): snapshot for undo, drop the generator stamp, re-validate.
  edit(fn, { quiet } = {}) {
    this.history.push(JSON.stringify(this.level));
    if (this.history.length > 60) this.history.shift();
    const plan = () => JSON.stringify([this.level.room, this.level.props.map((p) => [p.id, p.type, p.x, p.z, p.rot])]);
    const before = plan();
    fn();
    delete this.level.gen;
    // moving furniture makes the old photograph wrong: take a fresh one
    if (this.level.photo && plan() !== before) { placeTops(this.level); refreshPhoto(this.level, this.rng); if (!this.level.photo) toast('The photograph puzzle no longer worked with this floor plan and was removed.', 5000); }
    if (!quiet) this.refresh();
  }
  undo() {
    if (!this.history.length) return;
    this.level = JSON.parse(this.history.pop());
    if (!this.selected) this.sel = null;
    this.refresh();
  }
  refresh() {
    if (!this.level) return;
    placeTops(this.level);
    this.result = checkLevel(this.level);
    const t = this.top, L = this.level;
    t.themeSel.value = L.theme; t.diffSel.value = L.difficulty; t.name.value = L.name; t.w.value = L.room.w; t.d.value = L.room.d;
    try { localStorage.setItem(STORE, JSON.stringify(cleanLevel(L))); } catch (e) { /* private mode */ }
    this.draw();
    this.renderSide();
  }

  // ---------------------------------------------------------------- top bar actions
  generate(any) {
    try {
      const lvl = generate(any ? {} : { theme: this.level.theme, difficulty: this.level.difficulty });
      this.edit(() => { this.level = lvl; this.sel = null; }, { quiet: true });
      this.level = parseLevel(JSON.parse(JSON.stringify(lvl))); this.level.gen = lvl.gen;
      this.refresh();
      toast(`Generated "${lvl.name}" (room number ${lvl.seed}).`);
    } catch (err) { toast(err.message); }
  }
  blank() {
    this.edit(() => {
      const lvl = newLevel(this.level.theme);
      lvl.difficulty = this.level.difficulty;
      const door = addProp(lvl, 'door', { x: 0, z: -lvl.room.d / 2 });
      snapToWall(lvl, door, 'N');
      setLock(lvl, door, 'key', this.rng);
      this.level = lvl; this.sel = door.id;
    });
    toast('Empty room. The exit needs a key: add a hiding spot or container and place the key in it.');
  }
  resizeRoom(k, v) {
    v = Math.max(4, Math.min(13, v || 6));
    this.edit(() => {
      const L = this.level, walls = new Map(L.props.filter((p) => CATALOG[p.type].place === 'wall').map((p) => [p, wallOf(L, p)]));
      L.room[k] = v;
      for (const p of L.props) {
        const c = CATALOG[p.type];
        if (c.place === 'wall') snapToWall(L, p, walls.get(p));
        else if (c.place !== 'top') { const r = rectOf(p), hw = (r.x1 - r.x0) / 2, hd = (r.z1 - r.z0) / 2; p.x = Math.max(-L.room.w / 2 + hw, Math.min(L.room.w / 2 - hw, p.x)); p.z = Math.max(-L.room.d / 2 + hd, Math.min(L.room.d / 2 - hd, p.z)); }
      }
    });
  }
  exportJSON() {
    const blob = new Blob([JSON.stringify(cleanLevel(this.level), null, 2)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: this.level.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.fable.json' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    if (!this.result.ok) toast('Exported, but note this room still has problems (see Check).');
  }
  importText(text) {
    try { const lvl = parseLevel(text); this.edit(() => { this.level = lvl; this.sel = null; }); toast(`Loaded "${lvl.name}".`); } catch (err) { toast(err.message, 5000); }
  }
  async copyLink() {
    if (!this.result.ok) return toast('Fix the problems listed under Check before sharing.');
    const link = location.origin + location.pathname + '#' + (await encodeShare(this.level));
    try { await navigator.clipboard.writeText(link); toast('Share link copied to the clipboard.'); } catch (e) { prompt('Copy this link:', link); }
  }
  playtest() {
    if (!this.result.ok) return toast('This room cannot be escaped yet: ' + this.result.errors[0], 5000);
    $('#editor').hidden = true;
    this.app.play(JSON.parse(JSON.stringify(this.level)), { fromEditor: true });
  }

  // ---------------------------------------------------------------- adding / removing
  add(type) {
    const c = CATALOG[type], L = this.level;
    if (type === 'door' && L.props.some((p) => p.type === 'door')) return toast('There is already an exit door. Drag it where you want it.');
    let host = null;
    if (c.place === 'top') {
      const sel = this.selected;
      host = sel && CATALOG[sel.type].host ? sel : L.props.find((p) => CATALOG[p.type].host && L.props.filter((q) => q.on === p.id).length < 3);
      if (!host) return toast('Add a desk, side table or lab bench first: this piece sits on top of one.');
    }
    this.edit(() => {
      const p = addProp(L, type);
      if (host) { p.on = host.id; const taken = L.props.filter((q) => q.on === host.id && q !== p).map((q) => q.ox || 0); const w = CATALOG[host.type].w; p.ox = [0, -w / 3, w / 3, -w / 6, w / 6].find((o) => !taken.some((t) => Math.abs(t - o) < 0.2)) ?? 0; }
      else if (c.place === 'wall') {
        // first free stretch of wall
        let ok = false;
        for (const wall of ['N', 'E', 'S', 'W']) { for (let t = -5; t <= 5 && !ok; t += 0.25) { p.x = t; p.z = t; snapToWall(L, p, wall); ok = !this.collides(p); } if (ok) break; }
      } else {
        let ok = false;
        for (let r = 0; r < 6 && !ok; r += 0.4) for (let a = 0; a < 6.28 && !ok; a += 0.5) { p.x = +(Math.cos(a) * r).toFixed(2); p.z = +(Math.sin(a) * r).toFixed(2); ok = c.place === 'rug' || !this.collides(p, 0.3); }
      }
      if (c.container && c.container.must) setLock(L, p, c.container.locks[0], this.rng), this.autoPlace(p);
      this.sel = p.id;
    });
  }
  collides(p, pad = 0.02) {
    const L = this.level, r = rectOf(p, pad), e = 0.03 + pad;
    if (r.x0 < -L.room.w / 2 - e || r.x1 > L.room.w / 2 + e || r.z0 < -L.room.d / 2 - e || r.z1 > L.room.d / 2 + e) return true;
    return L.props.some((q) => q !== p && !['top', 'rug'].includes(CATALOG[q.type].place) && ((a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0)(r, rectOf(q)));
  }
  remove() {
    const p = this.selected;
    if (!p) return;
    this.edit(() => { removeProp(this.level, p.id); this.sel = null; });
  }
  rotate() {
    const p = this.selected;
    if (!p) return;
    const c = CATALOG[p.type];
    if (c.place === 'wall') return this.edit(() => snapToWall(this.level, p, { N: 'E', E: 'S', S: 'W', W: 'N' }[wallOf(this.level, p) || 'W']));
    if (c.place === 'top') return toast('Table-top pieces turn with the furniture they sit on.');
    this.edit(() => { p.rot = (p.rot + 1) % 4; });
  }

  // Put freshly created keys and clues somewhere sensible that keeps the room solvable.
  autoPlace(owner) {
    const L = this.level;
    for (const t of thingsFor(L, owner.id).filter((x) => !x.at)) {
      const spots = this.rng.shuffle(this.spotsFor(t)).sort((a, b) => thingsAt(L, a.prop.id).length - thingsAt(L, b.prop.id).length);
      for (const s of spots) {
        t.at = { prop: s.prop.id, slot: s.slot };
        if (solve(L).ok || !L.things.every((x) => x.at)) break; // keep if solvable (or if other things are still unplaced anyway)
        t.at = null;
      }
    }
  }
  spotsFor(t) {
    const L = this.level;
    return L.props.map((p) => ({ prop: p, slot: slotFor(t, p, L) })).filter((s) => s.slot && (thingsAt(L, s.prop.id, s.slot).filter((x) => x !== t).length < SLOT_CAP[s.slot]));
  }
  setLockType(p, type) {
    this.edit(() => {
      if (!type) return clearLock(this.level, p);
      if (!setLock(this.level, p, type, this.rng)) return toast('Could not build that lock here.');
      this.autoPlace(p);
    });
  }
  setStyle(p, style) {
    const L = this.level;
    this.edit(() => {
      if (['clock', 'books', 'radio'].includes(style)) {
        let host = L.props.find((q) => CATALOG[q.type].feature === style && !thingsAt(L, q.id, 'shown').length);
        if (!host) {
          const type = Object.keys(CATALOG).find((id) => CATALOG[id].feature === style && (CATALOG[id].place !== 'top' || L.props.some((q) => CATALOG[q.type].host)));
          if (!type) return toast('Add a desk or table first: the radio needs something to stand on.');
          const before = new Set(L.props.map((q) => q.id));
          this.history.pop(); this.add(type); // add() takes its own snapshot
          host = L.props.find((q) => !before.has(q.id));
        }
        const [t] = setClueStyle(L, p, style, this.rng);
        t.at = { prop: host.id, slot: 'shown' };
        this.sel = p.id;
      } else { setClueStyle(L, p, style, this.rng); this.autoPlace(p); }
    });
  }

  // ---------------------------------------------------------------- map
  view() {
    const c = this.canvas, r = c.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    if (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr)) { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); }
    const { w, d } = this.level.room, s = Math.min((r.width - 70) / w, (r.height - 70) / d) * dpr;
    return { s, cx: c.width / 2, cy: c.height / 2, dpr, toWorld: (e) => ({ x: ((e.clientX - r.left) * dpr - c.width / 2) / s, z: ((e.clientY - r.top) * dpr - c.height / 2) / s }) };
  }
  draw() {
    if (!this.level || $('#editor').hidden) return;
    const V = this.view(), g = this.canvas.getContext('2d'), L = this.level, { w, d } = L.room, pal = THEMES[L.theme].pal;
    const hex = (n) => '#' + n.toString(16).padStart(6, '0');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#e6dcc0'; g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    g.setTransform(V.s, 0, 0, V.s, V.cx, V.cy);
    g.fillStyle = hex(pal.floor); g.globalAlpha = 0.55; g.fillRect(-w / 2, -d / 2, w, d); g.globalAlpha = 1;
    g.strokeStyle = 'rgba(43,33,24,.12)'; g.lineWidth = 1 / V.s;
    for (let x = Math.ceil(-w / 2); x < w / 2; x += 0.5) { g.beginPath(); g.moveTo(x, -d / 2); g.lineTo(x, d / 2); g.stroke(); }
    for (let z = Math.ceil(-d / 2); z < d / 2; z += 0.5) { g.beginPath(); g.moveTo(-w / 2, z); g.lineTo(w / 2, z); g.stroke(); }
    g.strokeStyle = hex(pal.trim); g.lineWidth = 0.14; g.strokeRect(-w / 2 - 0.07, -d / 2 - 0.07, w + 0.14, d + 0.14);
    const order = [...L.props].sort((a, b) => (['rug', 'floor', 'wall', 'top'].indexOf(CATALOG[a.type].place) - ['rug', 'floor', 'wall', 'top'].indexOf(CATALOG[b.type].place)));
    const badIds = new Set(L.things.filter((t) => !t.at).map((t) => t.for));
    for (const p of order) {
      const c = CATALOG[p.type], r = rectOf(p), role = roleOf(c), rw = r.x1 - r.x0, rd = r.z1 - r.z0;
      // wall pieces are thin: draw them a bit thicker so they can be grabbed
      const vis = c.place === 'wall' ? rectOf({ ...p, type: p.type }, 0.05) : r;
      g.fillStyle = ROLE_COLOR[role]; g.globalAlpha = c.place === 'rug' ? 0.35 : 0.9;
      g.fillRect(vis.x0, vis.z0, vis.x1 - vis.x0, vis.z1 - vis.z0); g.globalAlpha = 1;
      g.lineWidth = (p.id === this.sel ? 4 : 1.5) / V.s; g.strokeStyle = p.id === this.sel ? '#c8473c' : '#2b2118';
      g.strokeRect(vis.x0, vis.z0, vis.x1 - vis.x0, vis.z1 - vis.z0);
      // front marker
      if (c.place === 'floor') { const f = FRONT[p.rot]; g.fillStyle = '#2b2118'; g.beginPath(); g.arc(p.x + f[0] * (f[0] ? rw / 2 - 0.06 : 0), p.z + f[1] * (f[1] ? rd / 2 - 0.06 : 0), 0.045, 0, 7); g.fill(); }
      // label
      if (c.place !== 'top' || p.id === this.sel) {
        g.save(); g.translate(p.x, p.z);
        const fs = Math.max(0.13, Math.min(0.2, Math.max(rw, rd) / 7));
        g.font = `600 ${fs}px "Gill Sans","Trebuchet MS",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2b2118';
        if (c.place === 'wall') { const f = FRONT[p.rot]; g.translate(f[0] * 0.22, f[1] * 0.22); if (f[0]) g.rotate(Math.PI / 2 * f[0]); } else if (rd > rw * 1.3) g.rotate(Math.PI / 2);
        g.fillText(c.name, 0, 0);
        g.restore();
      }
      // lock symbol + contents badge
      const n = thingsAt(L, p.id).length;
      if (p.lock || n) {
        g.save(); g.translate(r.x1 - 0.02, r.z0 + 0.02);
        if (p.lock && p.lock.symbol) { g.fillStyle = '#fff'; g.strokeStyle = badIds.has(p.id) ? '#c8473c' : '#2b2118'; g.lineWidth = 2.5 / V.s; g.beginPath(); g.arc(-0.02, 0.02, 0.13, 0, 7); g.fill(); g.stroke(); if (p.lock.symbol) { g.save(); g.translate(-0.11, -0.07); g.scale(0.18 / 24, 0.18 / 24); g.fillStyle = SYMBOLS[p.lock.symbol].color; g.fill(new Path2D(SYMBOLS[p.lock.symbol].path), 'evenodd'); g.restore(); } }
        if (n) { g.fillStyle = '#2b2118'; g.beginPath(); g.arc(-0.02, rd - 0.06, 0.1, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '700 0.14px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), -0.02, rd - 0.055); }
        g.restore();
      }
    }
    // spawn marker
    const sp = this.result.spawn;
    if (L.props.some((p) => p.type === 'door')) { g.fillStyle = '#c8473c'; g.beginPath(); g.arc(sp.x, sp.z, 0.09, 0, 7); g.fill(); g.font = '600 0.14px sans-serif'; g.textAlign = 'center'; g.fillText('start', sp.x, sp.z + 0.24); }
  }
  hit(pt) {
    const order = ['top', 'wall', 'floor', 'rug'];
    return [...this.level.props].sort((a, b) => order.indexOf(CATALOG[a.type].place) - order.indexOf(CATALOG[b.type].place))
      .find((p) => { const r = rectOf(p, CATALOG[p.type].place === 'wall' ? 0.14 : 0.03); return pt.x > r.x0 && pt.x < r.x1 && pt.z > r.z0 && pt.z < r.z1; });
  }
  down(e) {
    const pt = this.view().toWorld(e), p = this.hit(pt);
    this.sel = p ? p.id : null;
    if (p) { this.drag = { p, dx: p.x - pt.x, dz: p.z - pt.z, moved: false, snap: JSON.stringify(this.level) }; this.canvas.setPointerCapture(e.pointerId); }
    this.draw(); this.renderSide();
  }
  move(e) {
    const D = this.drag;
    if (!D) return;
    const pt = this.view().toWorld(e), L = this.level, c = CATALOG[D.p.type], snap = (v) => Math.round(v * 20) / 20;
    D.moved = true;
    if (c.place === 'wall') { D.p.x = snap(pt.x); D.p.z = snap(pt.z); snapToWall(L, D.p); }
    else if (c.place === 'top') {
      const host = L.props.find((q) => CATALOG[q.type].host && ((r) => pt.x > r.x0 && pt.x < r.x1 && pt.z > r.z0 && pt.z < r.z1)(rectOf(q, 0.1)));
      if (host) { const a = (host.rot * Math.PI) / 2, lx = (pt.x - host.x) * Math.cos(a) - (pt.z - host.z) * Math.sin(a), lim = CATALOG[host.type].w / 2 - c.w / 2; D.p.on = host.id; D.p.ox = +Math.max(-lim, Math.min(lim, lx)).toFixed(2); }
    } else {
      const r = rectOf(D.p), hw = (r.x1 - r.x0) / 2, hd = (r.z1 - r.z0) / 2;
      D.p.x = Math.max(-L.room.w / 2 + hw, Math.min(L.room.w / 2 - hw, snap(pt.x + D.dx)));
      D.p.z = Math.max(-L.room.d / 2 + hd, Math.min(L.room.d / 2 - hd, snap(pt.z + D.dz)));
    }
    placeTops(L);
    this.draw();
  }
  up() {
    const D = this.drag;
    this.drag = null;
    if (D && D.moved) { this.history.push(D.snap); delete this.level.gen; if (this.level.photo) refreshPhoto(this.level, this.rng); this.refresh(); }
  }
  key(e) {
    if ($('#editor').hidden || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'r' || e.key === 'R') this.rotate();
    else if (e.key === 'Delete' || e.key === 'Backspace') this.remove();
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); this.undo(); }
    else if (e.key === 'Escape') { this.sel = null; this.refresh(); }
  }

  // ---------------------------------------------------------------- side panel
  thingRow(t) {
    const L = this.level, info = thingInfo(L, t);
    if (t.style === 'logic') info.lines = [propById(L, t.for).lock.rows.map((r) => r.g).join(', ')];
    const sel = el('select', { onchange: (e) => this.edit(() => { const [pid, slot] = e.target.value.split('/'); t.at = pid ? { prop: pid, slot } : null; }) },
      el('option', { value: '' }, '— not placed yet —'),
      this.spotsFor(t).concat(t.at && !this.spotsFor(t).some((s) => s.prop.id === t.at.prop) && propById(L, t.at.prop) ? [{ prop: propById(L, t.at.prop), slot: t.at.slot }] : []).map((s) => el('option', { value: s.prop.id + '/' + s.slot }, `${SLOT_WORD[s.slot]} ${propName(s.prop)}`)));
    sel.value = t.at ? t.at.prop + '/' + t.at.slot : '';
    return el('div', { class: 'thing' + (t.at ? '' : ' bad') }, el('b', {}, info.name), el('span', { class: 'tiny' }, info.lines.filter((l) => !/^\(|^Combination:$|^One of these/.test(l)).join(' ').slice(0, 90)), sel);
  }
  lockCard(p) {
    const L = this.level, c = CATALOG[p.type], lock = p.lock, kids = [];
    const types = c.container.locks;
    const typeSel = el('select', { onchange: (e) => this.setLockType(p, e.target.value) }, c.container.must ? null : el('option', { value: '' }, 'No lock'), types.map((t) => el('option', { value: t }, LOCK_NAMES[t])));
    typeSel.value = lock ? lock.type : '';
    kids.push(el('div', { class: 'field' }, el('span', {}, 'Lock'), typeSel));
    if (!lock) return kids;
    if (lock.symbol) {
      const used = new Set(L.props.filter((q) => q !== p && q.lock).map((q) => q.lock.symbol));
      kids.push(el('div', { class: 'field' }, el('span', {}, 'Symbol'), el('div', { class: 'syms' }, SYMBOL_IDS.map((s) => el('button', { class: s === lock.symbol ? 'on' : '', disabled: used.has(s), title: SYMBOLS[s].name, html: symbolSVG(s, 20), onclick: () => this.edit(() => { lock.symbol = s; }) })))));
    }
    if (lock.type === 'digits' || lock.type === 'dial') {
      const styles = lock.type === 'digits' ? Object.keys(STYLE_NAMES) : ['plain', 'torn'];
      const styleSel = el('select', { onchange: (e) => this.setStyle(p, e.target.value) }, styles.map((s) => el('option', { value: s }, STYLE_NAMES[s])));
      styleSel.value = lock.style;
      kids.push(el('div', { class: 'field' }, el('span', {}, 'Clue type'), styleSel));
    }
    if (lock.type === 'digits') {
      kids.push(el('div', { class: 'field' }, el('span', {}, 'Code'), el('input', { type: 'text', value: lock.code, maxlength: 4, inputmode: 'numeric', onchange: (e) => { const v = e.target.value.trim(), bad = codeFits(lock.style, v); if (bad) { toast(bad, 5000); e.target.value = lock.code; return; } this.edit(() => { lock.code = v; if (lock.colors) lock.colors = ['red', 'blue', 'green', 'yellow'].slice(0, v.length); if (lock.style === 'logic') { let rows = null; for (let i = 0; i < 30 && !rows; i++) rows = makeRows(this.rng, v); lock.rows = rows || []; } }); } })));
      if (lock.style === 'logic') kids.push(el('p', { class: 'tiny' }, `${lock.rows.length} guess lines with ●/○ feedback that leave only this code. `, el('button', { class: 'linkish', onclick: () => this.edit(() => { lock.rows = makeRows(this.rng, lock.code) || lock.rows; }) }, 'New lines')));
    } else if (lock.type === 'dial') {
      kids.push(el('div', { class: 'field' }, el('span', {}, 'R · L · R'), el('div', { class: 'triple' }, lock.combo.map((v, i) => el('input', { type: 'number', min: 0, max: 39, value: v, onchange: (e) => this.edit(() => { lock.combo[i] = Math.max(0, Math.min(39, Math.round(+e.target.value) || 0)); }) })))));
    } else if (lock.type === 'wheel') {
      const rebuild = (word) => this.edit(() => { const places = thingsFor(L, p.id).map((t) => t.at); if (!setLock(L, p, 'wheel', this.rng, { symbol: lock.symbol, word })) return toast('Could not build a fair word puzzle around that word. Try another.'); thingsFor(L, p.id).forEach((t, i) => { t.at = places[i] || null; }); this.autoPlace(p); });
      kids.push(el('div', { class: 'field' }, el('span', {}, 'Password'), el('input', { type: 'text', value: lock.word, maxlength: 7, onchange: (e) => { const v = e.target.value.trim().toUpperCase(); if (!isWord(v)) { toast('The password must be a single word of 3 to 7 letters.'); e.target.value = lock.word; return; } rebuild(v); } })),
        el('p', { class: 'tiny' }, `Code words: ${lock.candidates.join(', ')} · wheel letters: ${lock.letters}`), el('button', { class: 'linkish', onclick: () => rebuild(lock.word) }, 'Reshuffle decoys and clues'));
    } else if (lock.type === 'merge') {
      const b = lock.board;
      const regen = (lv) => this.edit(() => { const places = thingsFor(L, p.id).map((t) => t.at); setLock(L, p, 'merge', this.rng, { symbol: lock.symbol, level: lv }); thingsFor(L, p.id).forEach((t, i) => { t.at = places[i] || null; }); this.autoPlace(p); });
      kids.push(el('p', { class: 'tiny' }, `${b.pieces.length} solids on a ${b.w}×${b.h} tray → one ${TIERS[b.target].toLowerCase()}, solvable in ${b.par} moves.`), el('div', {}, 'New tray: ', ['Easy', 'Medium', 'Hard'].map((n, i) => el('button', { class: 'linkish', style: 'margin-right:.7em', onclick: () => regen(i) }, n))));
    }
    if (lock.type === 'key' || lock.type === 'tool') {
      const box = el('input', { type: 'checkbox', onchange: (e) => this.edit(() => { setSplit(L, p, e.target.checked); this.autoPlace(p); }) });
      box.checked = !!lock.split;
      kids.push(el('label', { class: 'tiny', style: 'display:flex;gap:.5em;align-items:center;margin:.5em 0' }, box, `Broken in two halves the player must find and join`));
    }
    const needs = thingsFor(L, p.id);
    if (needs.length) kids.push(el('h4', {}, 'Needed to open it'), ...needs.map((t) => this.thingRow(t)));
    return kids;
  }
  renderSide() {
    const L = this.level, p = this.selected, R = this.result, out = [];
    // selected prop
    if (p) {
      const c = CATALOG[p.type];
      const here = thingsAt(L, p.id);
      out.push(el('div', { class: 'card' },
        el('h3', {}, el('span', { class: 'grow' }, c.name), el('button', { class: 'btn small', onclick: () => this.rotate() }, 'Rotate'), el('button', { class: 'btn small', onclick: () => this.remove() }, 'Delete')),
        el('p', { class: 'tiny' }, c.container ? (c.container.exit ? 'The way out. Opening it wins the game.' : 'A container: it can be locked and things can be placed inside.') : c.hide ? `A hiding spot ("${c.hide}").` : c.inscribe ? 'A writing surface: it can display a written clue.' : c.feature ? `Can display a code as a ${c.feature === 'books' ? 'count of coloured books' : c.feature === 'clock' ? 'stopped time' : 'radio frequency'}.` : c.host ? 'Furniture. Table-top pieces can sit on it.' : 'Decoration.'),
        c.container ? this.lockCard(p) : null,
        photoDiff(L, p.id) ? el('p', { class: 'tiny' }, '📷 Disturbed since the photograph was taken' + (L.photo.diffs.find((x) => x.prop === p.id).gone ? ' (it is missing from the photo).' : ' (it stands elsewhere in the photo).')) : null,
        here.length ? [el('h4', {}, 'Placed here'), ...here.map((t) => { const owner = propById(L, t.for); return el('div', { class: 'thing' }, el('b', { html: (owner && owner.lock.symbol ? symbolSVG(owner.lock.symbol, 16) + ' ' : '') + thingInfo(L, t).name }), el('span', { class: 'tiny' }, owner ? `for the ${propName(owner)} · ` : ''), el('button', { class: 'linkish', onclick: () => this.edit(() => { t.at = null; }) }, 'take out')); })] : null));
    } else out.push(el('div', { class: 'card' }, el('h3', {}, 'Nothing selected'), el('p', { class: 'tiny' }, 'Select a piece on the plan to give it a lock or see what is hidden in it. Gold pieces are containers, teal are hiding spots, purple show clues.')));
    // puzzle chain
    const locked = L.props.filter((q) => q.lock);
    out.push(el('div', { class: 'card' }, el('h3', {}, 'Puzzle chain'), locked.length ? locked.map((q) => { const miss = thingsFor(L, q.id).filter((t) => !t.at).length; return el('div', { class: 'chain', onclick: () => { this.sel = q.id; this.refresh(); } }, el('span', { html: q.lock.symbol ? symbolSVG(q.lock.symbol, 20) : '🔧' }), el('b', {}, CATALOG[q.type].name), el('small', {}, miss ? el('span', { class: 'err', style: 'color:#9c2b21' }, `${miss} unplaced`) : `${LOCK_NAMES[q.lock.type]} · ${lockSummary(L, q)}`)); }) : el('p', { class: 'tiny' }, 'No locks yet.')));
    // photograph puzzle
    const photo = L.things.find((t) => t.kind === 'photo');
    out.push(el('div', { class: 'card' }, el('h3', {}, el('span', { class: 'grow' }, 'Photograph puzzle'), L.photo ? el('button', { class: 'btn small', onclick: () => this.edit(() => removePhoto(L)) }, 'Remove') : el('button', { class: 'btn small', onclick: () => this.addPhoto() }, 'Add')),
      L.photo && photo ? [el('p', { class: 'tiny' }, `An old photo of the room. Disturbed since: ${L.photo.diffs.map((x) => propName(propById(L, x.prop))).join(', ')}. Once the player spots all three, disturbed decor can be searched; place things "secretly" in it.`), this.thingRow(photo)]
        : el('p', { class: 'tiny' }, 'Spot the difference: an old photo shows the room before three pieces of furniture were disturbed. Finding them reveals a secret hiding place.')));
    // SCAMPER
    const tip = el('p', { class: 'scamper-tip' }, 'Remix the room with one idea at a time. Each remix keeps the room solvable.');
    out.push(el('div', { class: 'card' }, el('h3', {}, 'Remix (SCAMPER)'), el('div', { class: 'scamper' }, Object.keys(SCAMPER).map((k) => el('button', { title: `${SCAMPER[k].name}: ${SCAMPER[k].tip}`, onmouseenter: () => { tip.innerHTML = `<b>${SCAMPER[k].name}.</b> ${SCAMPER[k].tip}.`; }, onclick: () => this.remix(k) }, k))), tip));
    // check
    out.push(el('div', { class: 'card check ' + (R.ok ? 'ok' : 'bad') },
      el('h3', {}, R.ok ? `✓ Escapable in ${R.steps.length} steps` : `✗ ${R.errors.length} problem${R.errors.length > 1 ? 's' : ''} to fix`),
      R.errors.length ? el('ul', {}, R.errors.map((m) => el('li', { class: 'err' }, m))) : null,
      R.warnings.length ? el('ul', {}, R.warnings.map((m) => el('li', {}, m))) : null,
      R.ok ? el('button', { class: 'linkish', onclick: () => { this.spoilers = !this.spoilers; this.renderSide(); } }, this.spoilers ? 'Hide the solution' : 'Show the solution (spoilers)') : null,
      R.ok && this.spoilers ? el('ol', {}, R.steps.map((s) => el('li', {}, s.text))) : null));
    this.right.replaceChildren(...out.flat());
  }
  addPhoto() {
    if (!this.result.ok) return toast('Fix the problems listed under Check first.');
    let ok = false;
    this.edit(() => { ok = hidePhoto(this.level, this.rng); });
    if (!ok) { this.history.pop(); toast('No good photograph here: the room needs free-standing decor (a chair, stool or lamp) in clear view, and something sitting in an ordinary hiding spot to move behind the puzzle.', 7000); }
  }
  remix(op) {
    if (!this.result.ok) return toast('Fix the problems listed under Check before remixing.');
    const v = scamper(this.level, op);
    if (!v) return toast(`${SCAMPER[op].name} has nothing to work with in this room. Try another letter.`);
    this.edit(() => { this.level = v; if (!this.selected) this.sel = null; });
    toast(`${SCAMPER[op].name}: ${SCAMPER[op].tip}.`);
  }
}
