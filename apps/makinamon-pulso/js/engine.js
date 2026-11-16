'use strict';
// ───────── núcleo: lienzo, entrada, tiempo, tweens, partículas, fuente, cajas, diálogo, menús ─────────
const W = 160, H = 144, cv = document.getElementById('c'), g = cv.getContext('2d');
const TEST = location.search.includes('test');
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const INK = '#20202c', PAPER = '#f8f6e8';

// ── entrada ──
const KEYMAP = { ArrowUp: ['up'], KeyW: ['up'], ArrowDown: ['down'], KeyS: ['down'], ArrowLeft: ['left'], KeyA: ['left'], ArrowRight: ['right'], KeyD: ['right'], KeyZ: ['a'], Space: ['a'], Enter: ['a', 'start'], KeyX: ['b'], Backspace: ['b'], Escape: ['b', 'start'], ShiftLeft: ['run'], ShiftRight: ['run'] };
const down = {}, hit = {}, nav = {}, heldT = {};
const TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
let typing = null; // función que recibe teclas mientras se escribe un nombre
function press(b) { if (!down[b]) hit[b] = true; down[b] = true; }
function release(b) { down[b] = false; heldT[b] = 0; }
addEventListener('keydown', e => {
  audioInit();
  if (typing && typing(e) !== false) { e.preventDefault(); return; }
  if (e.code === 'KeyT' && e.altKey) { dbgTime = (dbgTime + 1) % 5; e.preventDefault(); return; }
  if (e.code === 'KeyM') { toggleMute(); return; }
  const m = KEYMAP[e.code]; if (!m) return; e.preventDefault(); if (e.repeat) return; m.forEach(press);
});
addEventListener('keyup', e => { const m = KEYMAP[e.code]; if (m) m.forEach(release); });
addEventListener('pointerdown', () => audioInit());
let dbgTime = 0;

// ── tiempo y esperas ──
let frame = 0; const waits = [];
const wait = n => new Promise(r => waits.push({ n, r }));
const until = f => new Promise(r => waits.push({ f, r }));
const key = (...names) => until(() => names.find(n => nav[n]));
const anyKey = () => until(() => hit.a || hit.b);
const waitOrKey = n => { let c = n; return until(() => --c <= 0 || hit.a || hit.b); };
function runWaits() {
  for (let i = waits.length - 1; i >= 0; i--) {
    const w = waits[i]; let v;
    if (w.f ? (v = w.f()) : --w.n <= 0) { waits.splice(i, 1); w.r(v); }
  }
}
// ── tweens ──
const EASE = {
  lin: t => t, out: t => 1 - (1 - t) ** 3, in: t => t * t * t, io: t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  back: t => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2,
  bounce: t => { const n = 7.5625, d = 2.75; return t < 1 / d ? n * t * t : t < 2 / d ? n * (t -= 1.5 / d) * t + .75 : t < 2.5 / d ? n * (t -= 2.25 / d) * t + .9375 : n * (t -= 2.625 / d) * t + .984375; },
  elastic: t => t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - .75) * 2.0944) + 1,
};
const tweens = [];
function tw(o, props, n, ease = 'out') {
  if (alGolpe && o === alGolpe.spr && ('ox' in props || 'oy' in props)) alGolpe();
  return new Promise(r => { const from = {}; for (const k in props) from[k] = o[k]; tweens.push({ o, props, from, n, t: 0, e: EASE[ease], r }); });
}
function runTweens() {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const T = tweens[i]; T.t++; const k = T.e(Math.min(1, T.t / T.n));
    for (const p in T.props) T.o[p] = T.from[p] + (T.props[p] - T.from[p]) * k;
    if (T.t >= T.n) { for (const p in T.props) T.o[p] = T.props[p]; tweens.splice(i, 1); T.r(); }
  }
}
// ── partículas (pantalla) ──
const parts = [];
function part(p) { parts.push(Object.assign({ vx: 0, vy: 0, ay: 0, ax: 0, life: 30, t: 0, s: 1, c: '#fff', drag: 1 }, p)); }
function burst(x, y, n, o = {}) {
  if (alGolpe && Math.abs(x - alGolpe.cx) < 22 && Math.abs(y - alGolpe.cy) < 30) alGolpe();
  for (let i = 0; i < n; i++) {
    const a = rnd(o.a0 ?? 0, o.a1 ?? Math.PI * 2), sp = rnd(o.v0 ?? .5, o.v1 ?? 2);
    part({ x: x + rnd(-1, 1) * (o.spread ?? 0), y: y + rnd(-1, 1) * (o.spread ?? 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, ay: o.ay ?? 0, life: ri(o.l0 ?? 12, o.l1 ?? 26), c: Array.isArray(o.c) ? pick(o.c) : o.c ?? '#fff', s: o.s ?? 1, drag: o.drag ?? .95, w: o.w, kind: o.kind, shrink: o.shrink });
  }
}
function runParts() {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.t++; p.vx = (p.vx + p.ax) * p.drag; p.vy = (p.vy + p.ay) * p.drag; p.x += p.vx; p.y += p.vy;
    if (p.t >= p.life) parts.splice(i, 1);
  }
}
function drawParts(world, cx = 0, cy = 0, glow = false) {
  for (const p of parts) {
    if (!!p.w !== world || (glow && p.kind !== 'fly')) continue;
    const x = Math.round(p.x - cx), y = Math.round(p.y - cy), k = 1 - p.t / p.life, gordo = !world && typeof B !== 'undefined' && scene === B ? 1 : 0; // en combate las chispas se ven más
    g.fillStyle = p.c;
    if (p.kind === 'star') { const s = (k > .5 ? 2 : 1) + gordo; if (gordo) { g.fillStyle = 'rgba(20,16,32,.6)'; g.fillRect(x - s - 1, y - 1, s * 2 + 3, 3); g.fillRect(x - 1, y - s - 1, 3, s * 2 + 3); g.fillStyle = p.c; } g.fillRect(x - s, y, s * 2 + 1, 1); g.fillRect(x, y - s, 1, s * 2 + 1); }
    else if (p.kind === 'ring') { const r = (1 - k) * p.s; g.strokeStyle = p.c; g.lineWidth = 1; g.beginPath(); g.arc(x + .5, y + .5, r, 0, 7); g.stroke(); }
    else if (p.kind === 'puff') { const r = Math.max(1, Math.round(p.s * (p.shrink ? k : .5 + (1 - k)))); disc(x, y, r, p.c); }
    else if (p.kind === 'fly') { if (!glow) continue; if (Math.sin(p.t * .11 + p.life) > -.3) { g.fillRect(x, y, 1, 1); g.globalAlpha = .3; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); g.globalAlpha = 1; } }
    else if (p.kind === 'pollen') g.fillRect(x, y + Math.round(Math.sin(p.t * .07 + p.life) * 2), 1, 1);
    else { const s = (p.shrink ? Math.max(1, Math.round(p.s * k)) : p.s) + gordo; if (gordo && s > 3) { g.fillStyle = 'rgba(20,16,32,.45)'; g.fillRect(x - 1, y - 1, s + 2, s + 2); g.fillStyle = p.c; } g.fillRect(x, y, s, s); }
  }
}
function disc(x, y, r, c) { g.fillStyle = c; for (let dy = -r; dy <= r; dy++) { const w = Math.floor(Math.sqrt(r * r - dy * dy) + .3); g.fillRect(x - w, y + dy, w * 2 + 1, 1); } }
// ── efectos de pantalla ──
const fxs = []; // objetos {t,life,draw(k)} dibujados encima de la escena
function fx(life, draw) { fxs.push({ t: 0, life, draw }); return wait(life); }
const scr = { shake: 0, flash: 0, flashC: '#fff', fade: 0, fadeC: '#000', zoom: 1 };
// alGolpe: lo pone el combate mientras dura la animación de un ataque; salta en el primer contacto con quien lo recibe
let alGolpe = null;
function shake(m) { if (alGolpe && m >= 3) alGolpe(); scr.shake = Math.max(scr.shake, m); }
function flash(c = '#fff', a = 1) { scr.flash = a; scr.flashC = c; }
async function fade(to, n = 16, c) { if (c) scr.fadeC = c; await tw(scr, { fade: to }, n, 'lin'); }

// ── fuente 5x7 proporcional con acentos ──
const FONT = {};
(() => {
  const hx = '000000000000005F00000007000700147F147F14242A7F2A12231308646236495620500008070300001C2241000041221C002A1C7F1C2A08083E080800807030000808080808000060600020100804023E5149453E00427F400072494949462141494D331814127F1027454545393C4A49493141211109073649494936464949291E0000140000004034000000081422411414141414004122140802015909063E415D594E7C1211127C7F494949363E414141227F4141413E7F494949417F090909013E414151737F0808087F00417F41002040413F017F081422417F404040407F021C027F7F0408107F3E4141413E7F090909063E4151215E7F09192946264949493203017F01033F4040403F1F2040201F3F4038403F631408146303047804036159494D43007F4141410204081020004141417F04020102044040404040000307080020545478407F284444383844444428384444287F385454541800087E090218A4A49C787F0804047800447D40002040403D007F1028440000417F40007C047804787C080404783844444438FC1824241818242418FC7C08040408485454542404043F44243C4040207C1C2040201C3C4030403C44281028444C9090907C4464544C440008364100000077000000413608000201020402';
  const src = hx.replace(/\s/g, '');
  for (let i = 0; i < 95; i++) { const cols = []; for (let c = 0; c < 5; c++) cols.push(parseInt(src.substr(i * 10 + c * 2, 2), 16) || 0); FONT[String.fromCharCode(32 + i)] = cols; }
  const trim = (cols, keep) => { if (keep) return cols; let a = 0, b = cols.length; while (a < b && !cols[a]) a++; while (b > a && !cols[b - 1]) b--; return cols.slice(a, b); };
  const G = {};
  for (const ch in FONT) G[ch] = { cols: trim(FONT[ch].map(v => v << 3), /[0-9]/.test(ch)) };
  G[' '] = { cols: [0, 0, 0] };
  const acc = (base, pts, dotless) => { const c = FONT[base].map(v => v << 3); if (dotless) c[2] &= ~(1 << 3); for (const [x, y] of pts) c[x] |= 1 << (y + 3); return { cols: trim(c) }; };
  const lowA = [[3, -1], [2, 0]], upA = [[3, -3], [2, -2]];
  'aeou'.split('').forEach((b, i) => G['áéóú'[i]] = acc(b, lowA));
  G['í'] = acc('i', lowA, true);
  'AEIOU'.split('').forEach((b, i) => G['ÁÉÍÓÚ'[i]] = acc(b, upA));
  G['ñ'] = acc('n', [[0, 0], [1, -1], [2, 0], [3, -1]]); G['Ñ'] = acc('N', [[1, -2], [2, -3], [3, -2]]);
  G['ü'] = acc('u', [[1, 0], [3, 0]]);
  const flip = b => ({ cols: trim(FONT[b].map(v => { let o = 0; for (let r = 0; r < 7; r++) if (v >> r & 1) o |= 1 << (7 - r); return o << 3; })) });
  G['¡'] = flip('!'); G['¿'] = flip('?');
  const cust = (ch, cols) => G[ch] = { cols: cols.map(v => v << 3) };
  cust('▶', [0x7F, 0x3E, 0x1C, 0x08]); cust('▼', [0x04, 0x0C, 0x1C, 0x0C, 0x04]); cust('…', [0x40, 0, 0x40, 0, 0x40]);
  cust('º', [0x02, 0x05, 0x02]); cust('×', [0x14, 0x08, 0x14]); cust('●', [0x1C, 0x3E, 0x3E, 0x1C]); cust('○', [0x1C, 0x22, 0x22, 0x1C]);
  cust('♪', [0x60, 0x60, 0x3F, 0x02, 0x04]); cust('↑', [0x04, 0x02, 0x7F, 0x02, 0x04]); cust('↓', [0x10, 0x20, 0x7F, 0x20, 0x10]);
  cust('½', [0x08, 0x1C, 0x3E, 0x7F, 0x3E, 0x1C, 0x08]); // rombo (chispa)
  cust('▲', [0x10, 0x18, 0x1C, 0x18, 0x10]); cust('—', [0x08, 0x08, 0x08, 0x08, 0x08]); cust('«', [0x08, 0x14, 0x08, 0x14]); cust('»', [0x14, 0x08, 0x14, 0x08]); cust('ª', [0x02, 0x05, 0x07]); cust('♥', [0x06, 0x0F, 0x1E, 0x0F, 0x06]); cust('◀', [0x08, 0x1C, 0x3E, 0x7F]); cust('·', [0x08]);
  for (const k in FONT) delete FONT[k]; Object.assign(FONT, G);
})();
function tw_(s) { let w = 0; for (const ch of String(s)) w += (FONT[ch] || FONT['?']).cols.length + 1; return Math.max(0, w - 1); }
let noOvf = 0;
function txt(s, x, y, c = INK, ctx = g) {
  if (TEST && ctx === g && !noOvf && !scr.fade) { const m = ctx.getTransform ? ctx.getTransform() : null, x0 = m ? m.a * x + m.e : x, x1 = x0 + (m ? m.a : 1) * tw_(s); if ((!m || (m.a === 1 && m.b === 0)) && (x0 < -1 || x1 > W + 1)) (window.__ovf = window.__ovf || new Set()).add(String(s)); }
  ctx.fillStyle = c; x = Math.round(x); y = Math.round(y);
  for (const ch of String(s)) {
    const G = FONT[ch] || FONT['?'];
    for (let i = 0; i < G.cols.length; i++) { let v = G.cols[i], r = -3; while (v) { if (v & 1) ctx.fillRect(x + i, y + r, 1, 1); v >>= 1; r++; } }
    x += G.cols.length + 1;
  }
  return x;
}
const txtC = (s, cx, y, c) => txt(s, cx - tw_(s) / 2, y, c);
const txtR = (s, rx, y, c) => txt(s, rx - tw_(s), y, c);
function txtO(s, x, y, c = '#fff', o = INK) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) txt(s, x + dx, y + dy, o); txt(s, x, y, c); }
function wrap(str, maxW) {
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) { const t = line ? line + ' ' + word : word; if (tw_(t) > maxW && line) { out.push(line); line = word; } else line = t; }
    out.push(line);
  }
  return out;
}
// ── cajas ──
function box(x, y, w, h, o = {}) {
  const bg = o.bg || PAPER, ac = o.ac || '#3aa89a';
  g.fillStyle = 'rgba(16,20,48,.3)'; g.fillRect(x + 3, y + h, w - 3, 2); g.fillRect(x + w, y + 3, 2, h - 1);
  g.fillStyle = INK; g.fillRect(x + 2, y, w - 4, h); g.fillRect(x, y + 2, w, h - 4); g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = bg; g.fillRect(x + 2, y + 1, w - 4, h - 2); g.fillRect(x + 1, y + 2, w - 2, h - 4);
  g.fillStyle = 'rgba(120,100,60,.13)'; g.fillRect(x + 2, y + h - 5, w - 4, 4); g.fillRect(x + w - 5, y + 2, 3, h - 4); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x + 2, y + 1, w - 4, 1);
  g.fillStyle = ac; g.fillRect(x + 4, y + 2, w - 8, 1); g.fillRect(x + 4, y + h - 3, w - 8, 1); g.fillRect(x + 2, y + 4, 1, h - 8); g.fillRect(x + w - 3, y + 4, 1, h - 8);
  // tornillos en las esquinas
  for (const [bx, by] of [[x + 3, y + 3], [x + w - 5, y + 3], [x + 3, y + h - 5], [x + w - 5, y + h - 5]]) { g.fillStyle = '#8890a0'; g.fillRect(bx, by, 2, 2); g.fillStyle = INK; g.fillRect(bx + 1, by + 1, 1, 1); }
}
// ── capa de interfaz ──
const ui = [];
const dlgEl = { draw: () => drawDlg() };
const dlgTop = () => { const i = ui.indexOf(dlgEl); if (i >= 0) ui.splice(i, 1); ui.push(dlgEl); };
const uiClear = () => { ui.length = 0; ui.push(dlgEl); };
ui.push(dlgEl);
const dlg = { on: false, lines: ['', ''], shown: 0, arrow: false, y: 100, name: '', k: 1 };
function drawDlg() {
  if (!dlg.on) return;
  if (dlg.k < 1) { const hh = Math.max(8, Math.round((H - dlg.y) * dlg.k)); box(0, dlg.y + ((H - dlg.y - hh) >> 1), W, hh); return; }
  box(0, dlg.y, W, H - dlg.y);
  let n = dlg.shown;
  for (let i = 0; i < 2; i++) { const l = dlg.lines[i] || ''; txt(l.slice(0, Math.max(0, n)), 9, dlg.y + 11 + i * 14); n -= l.length; }
  if (dlg.arrow && (frame >> 4) & 1) txt('▼', 146, dlg.y + 31 + ((frame >> 3) & 1));
}
async function say(str, o = {}) {
  if (!dlg.on) { dlg.k = .2; dlg.lines = ['', '']; dlg.on = true; dlgTop(); await tw(dlg, { k: 1 }, 6, 'out'); }
  dlg.on = true; dlgTop();
  const lines = wrap(str, 140);
  for (let i = 0; i < lines.length; i += 2) {
    dlg.lines = [lines[i], lines[i + 1] || '']; dlg.shown = 0; dlg.arrow = false;
    const total = dlg.lines[0].length + dlg.lines[1].length; let c = 0;
    while (dlg.shown < total) { dlg.shown += ((down.a || down.b) ? 3 : 1) * (window.OPT ? OPT.text : 1); if (c++ % 3 === 0) sfx.blip(o.voice); await wait(1); }
    dlg.shown = total;
    const last = i + 2 >= lines.length;
    if (o.auto != null && last) await waitOrKey(o.auto);
    else if (o.hold && last) { /* se queda abierto */ }
    else { dlg.arrow = true; await anyKey(); sfx.sel(); dlg.arrow = false; }
  }
}
const dlgOff = () => { dlg.on = false; };
async function talk(...lines) { for (const l of lines) await say(l); dlgOff(); }
// menú vertical; devuelve índice o -1
async function menu(items, o = {}) {
  const lh = o.lh || 13, w = o.w || Math.max(...items.map(i => tw_(i.t || i))) + 24, rows = Math.min(items.length, o.rows || items.length), top = o.top ?? 10, h = rows * lh + top + (o.bot ?? 1);
  const m = { esMenu: 1, sel: o.sel || 0, top: 0, x: o.x ?? W - w, y: o.y ?? (o.above ? dlg.y - h : 0), w, h, bob: 0, k: 0 };
  const fit = () => { if (m.sel < m.top) m.top = m.sel; if (m.sel >= m.top + rows) m.top = m.sel - rows + 1; }; fit();
  tw(m, { k: 1 }, 7, 'back');
  m.draw = () => {
    if (m.k < .98) { const hh = Math.max(8, Math.round(m.h * m.k)); box(m.x, m.y, m.w, hh, o); return; }
    box(m.x, m.y, m.w, m.h, o);
    for (let r = 0; r < rows; r++) { const i = m.top + r, it = items[i], t = it.t || it; txt(t, m.x + 15, m.y + top + r * lh, it.dis ? '#a0a098' : INK); if (it.r) txtR(it.r, m.x + m.w - 7, m.y + top + r * lh); }
    if (rows < items.length) { const bob = (frame >> 4) & 1; if (m.top > 0) txtC('▲', m.x + m.w / 2, m.y + 1 - bob, '#808898'); if (m.top + rows < items.length) txtC('▼', m.x + m.w / 2, m.y + m.h - 9 + bob, '#808898'); }
    txt('▶', m.x + 7 + (m.bob > 0 ? 1 : 0), m.y + top + (m.sel - m.top) * lh); if (m.bob > 0) m.bob--;
  };
  ui.push(m); await wait(1);
  let res;
  for (;;) {
    if (o.onMove) o.onMove(m.sel);
    const k = await key('up', 'down', 'a', 'b', ...(o.keys || []));
    if (k === 'up') { m.sel = (m.sel + items.length - 1) % items.length; fit(); sfx.move(); m.bob = 4; }
    else if (k === 'down') { m.sel = (m.sel + 1) % items.length; fit(); sfx.move(); m.bob = 4; }
    else if (k === 'a') { if (items[m.sel].dis) { sfx.bump(); continue; } sfx.sel(); res = m.sel; break; }
    else if (k === 'b') { if (o.noCancel) continue; sfx.back(); res = -1; break; }
    else { res = k; break; }
  }
  if (!o.keep) ui.splice(ui.indexOf(m), 1); else m.frozen = true;
  await wait(1);
  return res;
}
const ask = async (q, yes = 'SÍ', no = 'NO') => { await say(q, { hold: true }); const r = await menu([yes, no], { above: true, x: W - 44, w: 44 }); return r === 0; };

// ── bucle ──
let scene = null, busy = 0;
function tick() {
  frame++;
  for (const b of ['up', 'down', 'left', 'right']) { heldT[b] = down[b] ? (heldT[b] || 0) + 1 : 0; nav[b] = hit[b] || (heldT[b] > 16 && heldT[b] % 5 === 0); }
  for (const b of ['a', 'b', 'start', 'run']) nav[b] = hit[b];
  if (scene && scene.update) scene.update();
  runTweens(); runParts();
  for (let i = fxs.length - 1; i >= 0; i--) if (++fxs[i].t >= fxs[i].life) fxs.splice(i, 1);
  if (scr.shake > 0) scr.shake = scr.shake < .3 ? 0 : scr.shake * .86;
  if (scr.flash > 0) scr.flash = Math.max(0, scr.flash - .12);
  scr.zoom = scr.zoom < 1.004 ? 1 : 1 + (scr.zoom - 1) * .82;
  runWaits();
  for (const k in hit) hit[k] = false;
}
function draw() {
  g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (scr.shake > 0) g.translate(Math.round(rnd(-1, 1) * scr.shake), Math.round(rnd(-1, 1) * scr.shake));
  if (scr.zoom > 1) { g.translate(80, 60); g.scale(scr.zoom, scr.zoom); g.translate(-80, -60); }
  if (scene) scene.draw();
  for (const f of fxs) f.draw(f.t / f.life, f.t);
  drawParts(false);
  if (scene && scene.drawTop) scene.drawTop();
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const u of ui) u.draw();
  if (scr.flash > 0) { g.globalAlpha = Math.ceil(scr.flash * 4) / 4; g.fillStyle = scr.flashC; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  if (scr.fade > 0) { g.globalAlpha = Math.round(scr.fade * 4) / 4; g.fillStyle = scr.fadeC; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
}
let acc = 0, lastT = 0;
function loop(t) {
  acc += Math.min(100, t - lastT); lastT = t;
  requestAnimationFrame(loop); // primero: un error en un fotograma no congela el juego
  try { let n = 0; while (acc >= 1000 / 60 && n++ < 5) { tick(); acc -= 1000 / 60; } draw(); } catch (e) { acc = 0; if (!loop.err) { loop.err = String(e && e.stack || e).split('\n').slice(0, 2).join(' '); console.error(e); } g.fillStyle = '#a02030'; g.fillRect(0, 0, W, 48); txt('ERROR (haz captura):', 3, 2, '#fff'); const m = loop.err.replace(/https?:\/\/[^/]+\//g, ''); for (let i = 0; i < 4; i++) txt(m.slice(i * 26, i * 26 + 26), 3, 11 + i * 9, '#ffe0a0'); }
}
function fit() {
  let s;
  if (TOUCH) { // en el móvil cabe todo lo que se pueda: la pantalla y el mando
    const vw = innerWidth, vh = innerHeight, land = vw > vh, root = document.documentElement.style;
    if (land) { const side = Math.min(210, vw * .26); s = Math.min((vw - side * 2) / W, (vh - 20) / H); root.setProperty('--cz', Math.min(150, side * .78, vh * .42) + 'px'); root.setProperty('--bz', Math.min(160, side * .82, vh * .46) + 'px'); }
    else { s = Math.min((vw - 16) / W, (vh * .56) / H); const free = vh - H * s - 40, top = vw >= 600 ? 230 : 170; root.setProperty('--cz', Math.max(110, Math.min(top, vw * .4, free * .62)) + 'px'); root.setProperty('--bz', Math.max(120, Math.min(top + 10, vw * .42, free * .7)) + 'px'); root.setProperty('--pant', Math.round(H * s + 30) + 'px'); }
  } else s = Math.max(1, Math.floor(Math.min(innerWidth / W, (innerHeight - 48) / H)));
  cv.style.width = Math.floor(W * s) + 'px'; cv.style.height = Math.floor(H * s) + 'px';
}
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 120)); fit();
// para pruebas: avanzar a mano
const mc = new MessageChannel();
const macrotask = () => new Promise(r => { mc.port1.onmessage = r; mc.port2.postMessage(0); });
async function step(n = 1) { for (let i = 0; i < n; i++) { tick(); await macrotask(); } draw(); }
async function tap(b, n = 2) { press(b); await step(n); release(b); await step(1); }
