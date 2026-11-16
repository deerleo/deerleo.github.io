'use strict';
// ───────── la mochila: bolsillos, iconos y descripción (al estilo de las entregas modernas) ─────────
// iconos de 12×12 en mapas de píxeles: k = tinta, el resto de letras según la paleta de cada objeto
const ICONS = {
  aceite: { p: { a: '#e8c040', b: '#b08820', c: '#fff0a0', r: '#c83828', g: '#8890a0' }, m: [
    '.......kk...', '......kgk...', '.....kgk....', '..kkkkkkk...', '.kcaaaaaak..', '.kaarrrraak.', '.kaarccraak.', '.kaarrrraak.', '.kaaaaaaabk.', '.kbaaaaaabk.', '..kbbbbbbk..', '...kkkkkk...'] },
  grasa: { p: { a: '#5878c8', b: '#3858a0', c: '#a8c0f8', w: '#f8f6e8', y: '#f8d030', g: '#8890a0' }, m: [
    '............', '..kkkkkkkk..', '.kcccccccck.', '.kaaaaaaaak.', '.kkkkkkkkkk.', '.kgwwwwwwgk.', '.kgwyyyywgk.', '.kgwyyyywgk.', '.kgwwwwwwgk.', '.kggggggggk.', '..kkkkkkkk..', '............'] },
  lubricante: { p: { a: '#e84848', b: '#a02830', c: '#f8a0a0', w: '#f8f6e8', g: '#c8d0dc' }, m: [
    '....kkk.....', '....kgkkk...', '....kggggk..', '...kkkkk....', '...kaaak....', '..kcaaabk...', '..kawwwbk...', '..kawwwbk...', '..kaaaabk...', '..kaaaabk...', '..kbbbbbk...', '...kkkkk....'] },
  rearme: { p: { a: '#e84848', b: '#a02830', c: '#f8a0a0', g: '#8890a0', h: '#c8d0dc' }, m: [
    '............', '............', '....kkkk....', '...kccaak...', '..kcaaaabk..', '..kaaaaabk..', '..kbbbbbbk..', '.kkkkkkkkkk.', '.khhhhhhhhk.', '.kggggggggk.', '..kkkkkkkk..', '............'] },
  recarga: { p: { a: '#58c878', b: '#2f8244', c: '#a8f0b8', y: '#f8e070', g: '#8890a0' }, m: [
    '....kkkk....', '....kggk....', '..kkkkkkkk..', '..kccaaabk..', '..kaayyabk..', '..kayyyybk..', '..kaayyabk..', '..kaaaaabk..', '..kaaaaabk..', '..kbbbbbbk..', '..kkkkkkkk..', '............'] },
  celda: { p: { a: '#30b8a8', b: '#1c8078', c: '#90f0e0', w: '#f8f6e8', g: '#8890a0', h: '#c8d0dc' }, m: [
    '....kkkk....', '....khhk....', '..kkkkkkkk..', '..kcaaaabk..', '..kcaaaabk..', '..kwwwwwwk..', '..kwgggwwk..', '..kwwwwwwk..', '..kaaaaabk..', '..kbbbbbbk..', '..kkkkkkkk..', '............'] },
  celdaplus: { p: { a: '#f8c030', b: '#c08010', c: '#fff4b0', w: '#f8f6e8', r: '#e84848', h: '#c8d0dc' }, m: [
    '....kkkk....', '....khhk....', '..kkkkkkkk..', '..kcaaaabk..', '..kcaarabk..', '..kwwrrrwk..', '..kwwwrwwk..', '..kwwwwwwk..', '..kaaaaabk..', '..kbbbbbbk..', '..kkkkkkkk..', '............'] },
  fusible: { p: { g: '#c8d0dc', h: '#8890a0', c: '#e0f4fc', o: '#f08030', y: '#f8e070' }, m: [
    '............', '............', '.kkk....kkk.', 'kghkkkkkkhgk', 'kghcccccchgk', 'kghcyoyocchk', 'kghcoyoyochk', 'kghcccccchgk', 'kghkkkkkkhgk', '.kkk....kkk.', '............', '............'] },
  cable: { p: { a: '#f08838', b: '#a85020', g: '#c8d0dc', h: '#8890a0' }, m: [
    '..kkkk......', '.kaaaak.....', 'kak..kak....', 'kak..kak....', '.kaak.kak...', '..kk..kak...', '.......kakk.', '........kaak', '.......kkkhk', '.......kgggk', '.......kkkkk', '........k.k.'] },
  linterna: { p: { a: '#3c3c48', b: '#202028', y: '#f8e070', w: '#fff8c0', g: '#c8d0dc' }, m: [
    '............', '.........kk.', '.......kkwk.', '..kkkkkgywk.', '.kaaaaagyyk.', 'kaagaaagyyk.', 'kbbbbbbgyyk.', '.kbbbbbgywk.', '..kkkkkkkwk.', '.......kkk..', '............', '............'] },
  reloj: { p: { a: '#e84848', b: '#a02830', w: '#f8f6e8', g: '#8890a0' }, m: [
    '.kk......kk.', 'kaak....kaak', 'kak.kkkk.kak', '...kwwwwk...', '..kwwwkwwk..', '..kwwwkwwk..', '..kwwwkkwk..', '..kwwwwwwk..', '...kwwwwk...', '..k.kkkk.k..', '.k........k.', '............'] },
  pase: { p: { a: '#f8d030', b: '#c09018', w: '#f8f6e8', r: '#e84848' }, m: [
    '............', '............', 'kkkkkkkkkkkk', 'kaaaaaaaaaak', 'kawwwwwwwwak', 'kawkkwwrrwak', 'kawwwwwwwwak', 'kawkkkkwwwak', 'kaaaaaaaaaak', 'kbbbbbbbbbbk', 'kkkkkkkkkkkk', '............'] },
  ancla: { p: { a: '#8890a0', b: '#5c6070', c: '#c8d0dc', r: '#c8703c' }, m: [
    '....kkk.....', '...kc.ak....', '....kak.....', '.kkkkakkkk..', '.kccaaaabk..', '.kkkkakkkk..', '....kak.....', 'kk..kak..kk.', 'kak.kak.kak.', '.kakkaakkak.', '..kaaraaak..', '...kkkkkk...'] },
  regadera: { p: { a: '#58c878', b: '#2f8244', c: '#c4f094', y: '#f8e070', o: '#8a5c34' }, m: [
    '.....k......', '....kck.....', '...kcak.....', '..kcaaak....', '..kaayak....', '.kcayyyak...', '.kaaayaak...', '.kaaaaabk...', '..kbbbbk....', '...kkkk.....', '..kooook....', '.kkkkkkkk...'] },
  llave: { p: { a: '#2a2438', b: '#1c1828', y: '#f8d030', w: '#f8f6e8' }, m: [
    '............', '............', 'kkkkkkkkkkkk', 'kyyayyayyayk', 'kayyayyayyak', 'kaaaaaaaaaak', 'kawwwwaayyak', 'kaaaaaaayyak', 'kbbbbbbbbbbk', 'kkkkkkkkkkkk', '............', '............'] },
  casco: { p: { a: '#f8d030', b: '#c09018', c: '#fff4b0', w: '#fff8c0', g: '#8890a0' }, m: [
    '............', '.....kkk....', '....kwwwk...', '...kkgggkk..', '..kccaaaaak.', '.kcaaaaaaaak', '.kaaaaaaaabk', '.kaaaaaaabbk', 'kkkkkkkkkkkk', 'kbbbbbbbbbbk', '.kkkkkkkkkk.', '............'] },
  valvula: { p: { a: '#e84848', b: '#a02830', c: '#f8a0a0', g: '#8890a0' }, m: [
    '....kkkk....', '..kkaaaakk..', '.kcak..kabk.', '.kak.kk.kak.', 'kak.kggk.kak', 'kakkkggkkkak', 'kak.kggk.kak', '.kak.kk.kak.', '.kcak..kabk.', '..kkbbbbkk..', '....kkkk....', '............'] },
};
const ICONC = {};
function itemIcon(id) {
  if (ICONC[id]) return ICONC[id];
  const def = ICONS[id] || ICONS.celda, [cv, c] = mk(12, 12);
  def.m.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; c.fillStyle = ch === 'k' ? INK : def.p[ch] || '#f0f'; c.fillRect(x, y, 1, 1); }));
  return ICONC[id] = cv;
}
const POCKETS = [
  { n: 'REPARAR', c: '#3ca85c', d: '#1c6c38', l: '#a8f0b8', ok: it => !it.key && !it.ball, icon: 'aceite' },
  { n: 'CELDAS', c: '#e07830', d: '#904010', l: '#f8c898', ok: it => it.ball, icon: 'celda' },
  { n: 'OBJETOS CLAVE', c: '#7858c8', d: '#3c2878', l: '#c8b8f8', ok: it => it.key, icon: 'fusible' },
];
// mochila dibujada: el bolsillo de delante es del color del bolsillo abierto
function drawBag(x, y, P, wob, t) {
  const sq = Math.sin(wob * Math.PI) * .14, sx = 1 + sq, sy = 1 - sq, cx = x + 24, by = y + 62;
  const T = (rx, ry) => [Math.round(cx + (rx - 24) * sx), Math.round(by + (ry - 62) * sy)];
  const RR = (rx, ry, w, h, c, r = 0) => { g.fillStyle = c; for (let j = 0; j < h; j++) { const cut = r ? Math.max(0, r - Math.min(j, h - 1 - j)) : 0, k = cut ? Math.ceil(r - Math.sqrt(r * r - (r - Math.min(j, h - 1 - j)) ** 2)) : 0; const [X, Y] = T(rx + k, ry + j); g.fillRect(X, Y, Math.ceil((w - k * 2) * sx), Math.ceil(sy) + 1); } };
  ell(g, cx, by + 1, 22, 3, 'rgba(10,8,24,.35)');
  // asa
  RR(17, 0, 14, 7, INK, 3); RR(19, 2, 10, 5, 'transparent'); { const [X, Y] = T(19, 2); g.clearRect && 0; g.fillStyle = '#6a4428'; g.fillRect(X, Y, Math.ceil(10 * sx), 1); }
  // bolsillos laterales
  RR(1, 30, 8, 22, INK, 2); RR(2, 31, 6, 20, dark(P.c, .1), 2); RR(39, 30, 8, 22, INK, 2); RR(40, 31, 6, 20, dark(P.c, .1), 2);
  // cuerpo redondeado
  RR(5, 6, 38, 56, INK, 8); RR(6, 7, 36, 54, '#b07c44', 7); RR(6, 7, 36, 4, '#d0a068', 6); RR(36, 12, 5, 46, '#8a5c30', 0); RR(8, 56, 32, 4, '#8a5c30', 0);
  // costuras
  for (let i = 0; i < 9; i++) { const [X, Y] = T(9 + i * 3.4, 13); g.fillStyle = '#d0a068'; g.fillRect(X, Y, 1, 1); }
  // tapa
  RR(6, 7, 36, 18, INK, 7); RR(7, 8, 34, 16, P.d, 6); RR(7, 8, 34, 3, P.c, 5); RR(20, 20, 8, 8, INK, 0); RR(21, 21, 6, 6, '#f8d030', 0); RR(22, 22, 4, 1, '#fff4b0', 0);
  // bolsillo delantero del color del bolsillo abierto
  RR(10, 31, 28, 24, INK, 4); RR(11, 32, 26, 22, P.c, 3); RR(11, 32, 26, 3, P.l, 3); RR(11, 50, 26, 3, P.d, 2);
  for (let i = 0; i < 12; i++) { const [X, Y] = T(12 + i * 2, 36); g.fillStyle = P.d; g.fillRect(X, Y, 1, 1); }
  const ic = itemIcon(P.icon), [ix, iy] = T(18, 38); g.drawImage(ic, ix, iy, Math.round(12 * sx), Math.round(12 * sy));
  // llavero: el primer Makinamon del equipo
  const m = G.party[0]; if (m) { const sw = Math.sin(t * .08) * 3, [kx, ky] = T(44, 14); g.fillStyle = '#c8d0dc'; g.fillRect(kx, ky, 1, 7); drawMon(m.sp, 'f0', kx + sw, ky + 24, { sx: .32, sy: .32 }); }
}
async function bagScreen(inBattle) {
  const st = { pk: 0, sel: [0, 0, 0], top: [0, 0, 0], wob: 0, slide: 0, t: 0 };
  const list = pk => Object.keys(ITEMS).filter(k => G.bag[k] > 0 && POCKETS[pk].ok(ITEMS[k]));
  // abre por el primer bolsillo que tenga algo
  if (!list(0).length) st.pk = list(1).length ? 1 : list(2).length ? 2 : 0;
  const ROWS = 6, LX = 50, LW = 108, RH = 13; // la fila elegida asoma un píxel a la derecha
  const sc = { draw() {
    st.t++; const P = POCKETS[st.pk], ids = list(st.pk), t = st.t;
    // fondo: degradado del bolsillo con franjas diagonales que avanzan
    gradV(g, 0, 0, W, H, [dark(P.d, .35), P.d, dark(P.c, .2)]);
    g.fillStyle = 'rgba(255,255,255,.06)'; for (let i = -H; i < W + H; i += 14) { const o = (i + t * .4) % (W + H * 2) - H; g.beginPath(); g.moveTo(o, 0); g.lineTo(o + 6, 0); g.lineTo(o + 6 - H, H); g.lineTo(o - H, H); g.fill(); }
    // pestañas
    POCKETS.forEach((q, i) => { const on = i === st.pk, x = 4 + i * 15, y = on ? 2 : 4; g.fillStyle = INK; g.fillRect(x - 1, y - 1, 14, 14 + (on ? 2 : 0)); g.fillStyle = on ? q.c : dark(q.c, .35); g.fillRect(x, y, 12, 12 + (on ? 2 : 0)); g.fillStyle = on ? q.l : q.c; g.fillRect(x, y, 12, 1); g.globalAlpha = on ? 1 : .55; g.drawImage(itemIcon(q.icon), x, y + 1); g.globalAlpha = 1; });
    txtO(P.n, 52, 4, '#ffffff'); txtO('◀▶', 52 + tw_(P.n) + 5, 4, (t >> 4) & 1 ? P.l : '#ffffff');
    if (!inBattle) { const mt = fmtT(G.money), mw = tw_(mt) + 11; g.fillStyle = INK; g.fillRect(1, 19, mw + 2, 11); g.fillStyle = 'rgba(248,246,232,.92)'; g.fillRect(2, 20, mw, 9); bolt(3, 21, '#c09018'); txt(mt, 10, 21, '#404050'); }
    // la mochila
    drawBag(0, 34, P, st.wob, t);
    // lista
    if (!ids.length) { txtC('Bolsillo vacío.', LX + LW / 2, 56, P.l); }
    const sel = st.sel[st.pk], top = st.top[st.pk];
    for (let r = 0; r < ROWS; r++) { const i = top + r, id = ids[i]; if (!id) break; const y = 19 + r * RH, on = i === sel, x = LX + (on ? 1 + Math.round(st.slide * 3) : 0);
      g.fillStyle = INK; g.fillRect(x + 1, y, LW - 2, RH - 1); g.fillRect(x, y + 1, LW, RH - 3);
      g.fillStyle = on ? PAPER : 'rgba(248,246,232,.82)'; g.fillRect(x + 1, y + 1, LW - 2, RH - 3); if (on) { g.fillStyle = P.c; g.fillRect(x + 1, y + 1, 3, RH - 3); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x + 1, y + RH - 4, LW - 2, 1); }
      g.drawImage(itemIcon(id), x + 4, y);
      txt(ITEMS[id].n, x + 17, y + 3, on ? INK : '#404050'); if (!ITEMS[id].key) txtR('×' + G.bag[id], x + LW - 4, y + 3, on ? P.d : '#707078'); }
    if (top > 0) txtO('▲', LX + LW / 2 - 3, 13, '#ffffff'); if (top + ROWS < ids.length) txtO('▼', LX + LW / 2 - 3, 19 + ROWS * RH - 1, '#ffffff');
    // descripción con el icono en grande
    box(0, 100, W, 44, { ac: P.c }); const cur = ids[sel];
    if (cur) { g.fillStyle = dark(P.l, .05); g.fillRect(4, 107, 30, 30); g.fillStyle = P.l; g.fillRect(5, 108, 28, 28); g.drawImage(itemIcon(cur), 7, 110, 24, 24); wrap(ITEMS[cur].d, W - 44).slice(0, 4).forEach((l, i) => txt(l, 38, 106 + i * 9)); }
  } };
  const was = dlg.on; dlg.on = false; ui.push(sc); await wait(1); let res = null;
  const fix = () => { const n = list(st.pk).length; st.sel[st.pk] = Math.max(0, Math.min(st.sel[st.pk], n - 1)); const s = st.sel[st.pk]; if (s < st.top[st.pk]) st.top[st.pk] = s; if (s >= st.top[st.pk] + ROWS) st.top[st.pk] = s - ROWS + 1; };
  for (;;) {
    fix(); const k = await key('up', 'down', 'left', 'right', 'a', 'b'), ids = list(st.pk);
    if (k === 'left' || k === 'right') { st.pk = (st.pk + (k === 'left' ? 2 : 1)) % 3; st.wob = 0; tw(st, { wob: 1 }, 14, 'out'); sfx.sel(); continue; }
    if (k === 'up' || k === 'down') { if (ids.length > 1) { st.sel[st.pk] = (st.sel[st.pk] + (k === 'up' ? -1 : 1) + ids.length) % ids.length; st.slide = 1; tw(st, { slide: 0 }, 6, 'out'); sfx.move(); } continue; }
    if (k === 'b') { sfx.back(); break; }
    const id = ids[st.sel[st.pk]]; if (!id) { sfx.bump(); continue; } const it = ITEMS[id]; sfx.sel();
    ui.splice(ui.indexOf(sc), 1);
    if (it.ball) { if (inBattle) { res = { item: id }; break; } await say('Guárdala para un Makinamon salvaje.'); dlgOff(); ui.push(sc); continue; }
    if (it.key) { await say(inBattle ? '¡Ahora no es momento de sacar eso!' : 'Es importante. Mejor llevarlo encima.'); dlgOff(); ui.push(sc); continue; }
    const tg = await partyScreen('pick', { msg: it.revive ? '¿A quién recargas?' : it.cure ? '¿A quién rearmas?' : '¿A quién engrasas?', valid: itemValid(it) });
    if (tg < 0) { ui.push(sc); continue; }
    if (inBattle) { res = { item: id, target: tg }; break; }
    await say(await applyItem(id, tg)); dlgOff(); ui.push(sc);
  }
  const i = ui.indexOf(sc); if (i >= 0) ui.splice(i, 1); dlg.on = was; return res;
}
