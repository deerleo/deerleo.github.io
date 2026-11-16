'use strict';
// ───────── combate ─────────
const mkSpr = (x, y) => ({ x, y, ox: 0, oy: 0, sx: 1, sy: 1, white: false, dark: false, clip: 0, vis: false, f1: 0, tint: null });
const B = { t: 0, env: 'hierba', wild: true, en: null, pl: null, pi: 0, foes: [], fi: 0, es: mkSpr(118, 58), ps: mkSpr(38, 102), st: { en: {}, pl: {} }, dhp: { en: 0, pl: 0 }, dxp: 0, hud: { en: 0, pl: 0 }, hudFlash: 0,
  celda: { vis: false, x: 0, y: 0, leds: 0, col: '#58e890', wob: 0 }, part: new Set(), evos: new Set(), tr: null,
  hudSh: { en: 0, pl: 0 },
  update() { this.t++; if (this.es.f1 > 0) this.es.f1--; else if (this.es.vis && Math.random() < .006) this.es.f1 = 12; if (this.hudFlash > 0) this.hudFlash--; if (this.hudSh.en > 0) this.hudSh.en--; if (this.hudSh.pl > 0) this.hudSh.pl--; },
  draw() {
    const t = this.t, lab = this.env !== 'hierba', ph = lab ? 1 : dayPhase();
    g.drawImage(battleBg(this.env, ph), 0, 0);
    if (!lab && ph < 3) for (let i = 0; i < 3; i++) { const x = Math.round(((i * 70 + t * (.06 + i * .02)) % 230) - 40), y = 5 + i * 8, cc = ph === 2 ? '#fcd0a8' : '#ffffff', cs = ph === 2 ? '#e09888' : '#d0e4f4'; g.fillStyle = cs; g.fillRect(x + 1, y + 3, 26, 2); g.fillRect(x + 9, y + 5, 14, 1); g.fillStyle = cc; g.fillRect(x, y, 26, 4); g.fillRect(x + 5, y - 2, 13, 2); g.fillRect(x + 8, y - 3, 6, 1); }
    if (!lab) { // briznas que se mecen junto a las plataformas
      for (const [bx, by, i] of BLADES) { const l = Math.round(Math.sin(t * .05 + i * 1.7)); g.fillStyle = '#3c8c44'; g.fillRect(bx, by - 2, 1, 3); g.fillRect(bx + 2, by - 1, 1, 2); g.fillStyle = '#58a850'; g.fillRect(bx + l, by - 4, 1, 2); g.fillRect(bx + 2 + l, by - 3, 1, 2); g.fillStyle = '#b4ec88'; g.fillRect(bx + l, by - 5, 1, 1); }
      if (ph === 3 && (t & 31) === 0) part({ x: rnd(W), y: rnd(30, 96), vx: rnd(-.1, .1), vy: rnd(-.1, .05), life: 120, c: '#e0f880', kind: 'pollen', drag: 1 });
    }
    // fondo del ataque: el escenario se oscurece con el color del golpe, las criaturas quedan encima
    if (this.bd && this.bd.a > 0) {
      g.globalAlpha = this.bd.a; g.fillStyle = this.bd.c; g.fillRect(0, 0, W, H);
      if (this.bd.lin) { const n = this.bd.n || 10, s = this.bd.lin; g.fillStyle = this.bd.lc || '#ffffff'; for (let i = 0; i < n; i++) { const len = 24 + (i * 37) % 46, y = 4 + ((i * 53) % 96), x = ((t * (12 + (i % 4) * 3) + i * 71) % (W + 120)) - 60, xx = s > 0 ? x : W - x - len; g.globalAlpha = this.bd.a * (i % 3 ? .35 : .6); g.fillRect(xx, y - Math.round((xx - 80) * .12 * s), len, i % 3 ? 1 : 2); } }
      g.globalAlpha = 1;
    }
    // criaturas
    for (const [k, view] of [['en', 'f0'], ['pl', 'back']]) {
      const s = k === 'en' ? this.es : this.ps, m = this[k]; if (!s.vis || !m) continue;
      // respira subiendo y bajando un píxel entero (escalar a medias desdibujaba filas del sprite)
      const br = 1, bob = s.sx === 1 && s.sy === 1 && !s.clip ? -Math.round((Math.sin(t * .09 + (k === 'en' ? 0 : 2)) + 1) * .5) : 0;
      if (s.sx > .3 && !s.clip) ell(g, Math.round(s.x + s.ox * .5), s.y - 2, Math.round(19 * s.sx), 3, 'rgba(16,40,40,.3)');
      drawMon(m.sp, k === 'en' && s.f1 > 0 ? 'f1' : view, Math.round(s.x + s.ox), Math.round(s.y + s.oy) + bob, { sx: s.sx, sy: s.sy * br, white: s.white, dark: s.dark, clip: s.clip, tint: s.tint });
    }
    g.drawImage(TILE.vig, 0, 0); if (this.bd) this.drawHud();
    const c = this.celda; if (c.vis) { if (c.rot & 3) { g.save(); g.translate(Math.round(c.x), Math.round(c.y - 6)); g.rotate((c.rot & 3) * Math.PI / 2); drawCelda(g, -4, -6, c.leds, c.col); g.restore(); } else drawCelda(g, c.x - 4 + Math.round(Math.sin(c.wob) * 2), c.y - 12 + (c.oy || 0), c.leds, c.col); }
  },
  // marcadores: encima de los efectos de ataque
  // marcadores: normalmente encima de todo; mientras dura la animación de un ataque van por debajo de sus efectos, para no taparlos
  drawTop() { if (!this.bd) this.drawHud(); },
  drawHud() {
    const t = this.t;
    const he = this.hud.en, hp = this.hud.pl;
    if (he > 0 && this.en) {
      const sl = he !== 1 || this.hudSh.en > 0; if (sl) noOvf++;
      const x = -86 + he * 88 + (this.hudSh.en > 0 ? (t & 1 ? 1 : -1) * Math.ceil(this.hudSh.en / 3) : 0), m = this.en; box(x, 3, 84, 27); txt(monName(m), x + 6, 9);
      lvTag(m.lv, x + 6, 19); bolt(x + 31, 19); drawHP(x + 37, 20, 41, this.dhp.en / m.max);
      if (m.status) statusChip(x + 6, 31);
      if (this.wild && G.got[m.sp]) drawCelda(g, x + 86, 6, 3);
      if (sl) noOvf--;
    }
    if (hp > 0 && this.pl) {
      const sl = hp !== 1 || this.hudSh.pl > 0; if (sl) noOvf++;
      const x = W + 2 - hp * 86 + (this.hudSh.pl > 0 ? (t & 1 ? 1 : -1) * Math.ceil(this.hudSh.pl / 3) : 0), m = this.pl; box(x, 57, 84, 38, { ac: this.hudFlash > 0 && (this.hudFlash >> 1) & 1 ? '#f8e070' : '#3aa89a', bg: this.hudFlash > 0 && (this.hudFlash >> 2) & 1 ? '#fff8c0' : PAPER });
      txt(monName(m), x + 6, 63); lvTag(m.lv, x + 6, 73); bolt(x + 31, 73); drawHP(x + 37, 74, 41, this.dhp.pl / m.max);
      txtR(`${Math.round(this.dhp.pl)}/${m.max}`, x + 78, 82, '#404050'); if (m.status) statusChip(x + 6, 82);
      g.fillStyle = INK; g.fillRect(x + 6, 90, 72, 2); g.fillStyle = '#48a0e8'; g.fillRect(x + 6, 90, Math.round(72 * clamp(this.dxp, 0, 1)), 2);
      if (sl) noOvf--;
    }
  },
};
const BLADES = [[88, 57, 0], [96, 61, 1], [146, 60, 2], [150, 55, 3], [4, 101, 4], [72, 104, 5], [78, 99, 6], [1, 96, 7]];
const BGC = {};
function battleBg(env, ph) {
  const key = env + ph; if (BGC[key]) return BGC[key];
  const [cv3, c] = mk(W, H), r = rng(11);
  const plat = (cx, cy, rx, ry, cols) => { ell(c, cx + 3, cy + 5, rx, ry, 'rgba(16,40,40,.28)'); ell(c, cx, cy + 3, rx, ry, cols[3]); ell(c, cx, cy + 2, rx, ry, cols[2]); ell(c, cx, cy, rx, ry, cols[1]); ell(c, cx - 2, cy - 1, rx - 6, ry - 2, cols[0]);
    for (let dy = -ry; dy <= 0; dy++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry + .01)))); P(c, cx - w, cy + dy, cols[4]); if (dy < -ry + 2) R(c, cx - w, cy + dy, w, 1, cols[4]); } };
  if (env === 'central' || env === 'centralLuz' || env.startsWith('gym')) {
    const lit = env !== 'central', k = v => lit ? v : dark(v, .45), gt = env.startsWith('gym') ? TYPES[env.slice(4)] : null;
    gradV(c, 0, 0, W, 50, [k('#2c3240'), k('#3a4250'), k('#465060'), k('#3a4250')]);
    for (let x = 0; x < W; x += 20) { R(c, x, 0, 1, 50, k('#2a303a')); R(c, x + 1, 0, 1, 50, k('#5c6676')); for (let y = 6; y < 46; y += 10) { P(c, x + 4, y, k('#7c8694')); P(c, x + 15, y, k('#7c8694')); } }
    for (const [y, hh] of [[8, 5], [30, 4]]) { R(c, 0, y, W, hh, k('#6c7684')); R(c, 0, y, W, 1, k('#9ca6b4')); R(c, 0, y + hh - 1, W, 1, k('#2c323c')); for (let x = 12; x < W; x += 37) { R(c, x, y - 1, 4, hh + 2, k('#4c5462')); R(c, x, y - 1, 4, 1, k('#9ca6b4')); } }
    for (let dy = -16; dy <= 16; dy++) for (let dx = -16; dx <= 16; dx++) { const d = Math.hypot(dx, dy); if (d < 16.5) P(c, 40 + dx, 26 + dy, d > 14 ? k('#14161c') : d > 11 ? k('#8c96a4') : d < 3 ? (lit ? '#f8e070' : '#3c424c') : (Math.floor(Math.atan2(dy, dx) * 3 / Math.PI + 6) & 1) ? k('#5c6674') : k('#20242c')); }
    R(c, 104, 14, 34, 22, '#14161c'); R(c, 105, 15, 32, 20, lit ? '#1c3428' : '#14181c'); for (let i = 0; i < 6; i++) R(c, 107 + i * 5, lit ? 30 - (i * 7 % 11) : 32, 3, lit ? 3 + (i * 7 % 11) : 1, lit ? '#58e890' : '#2c3a30');
    R(c, 0, 48, W, 3, '#14161c'); R(c, 0, 48, W, 1, k('#7c8694'));
    gradV(c, 0, 51, W, 93, [k('#3c424e'), k('#4c5462'), k('#5c6674'), k('#68727f')]);
    for (let kk = 0; kk < 12; kk++) { const y = 51 + Math.round(kk * kk * .7 + kk * 2); if (y < H) R(c, 0, y, W, 1, k('#3a404c')); }
    for (let i = -10; i <= 10; i++) for (let y = 51; y < H; y++) { const x = Math.round(80 + i * (y - 30) * .5); if (x >= 0 && x < W) P(c, x, y, k('#3a404c')); }
    if (!lit) { for (let y = 51; y < H; y++) for (let x = 0; x < W; x++) if (bay(x, y) < .22 + Math.hypot(x - 80, y - 90) / 400) P(c, x, y, 'rgba(6,8,22,.55)'); for (const ex of [6, 150]) { R(c, ex, 4, 4, 3, '#f84848'); c.globalAlpha = .18; ell(c, ex + 2, 6, 10, 8, '#f84848'); c.globalAlpha = 1; } }
    const pl = gt ? [lite(gt.c, .3), gt.c, gt.d, dark(gt.d, .3), '#f8f0c0'] : ['#a8b2c0', '#8c96a4', '#5c6674', '#3c424e', '#f8c830']; plat(118, 55, 32, 7, pl); plat(38, 99, 38, 8, pl);
    if (gt) { for (let x = 0; x < W; x += 20) { R(c, x + 6, 14, 8, 6, dark(gt.c, .3)); R(c, x + 6, 14, 8, 1, gt.c); } R(c, 0, 47, W, 1, gt.c); }
    for (const [px, py, rx] of [[118, 55, 32], [38, 99, 38]]) for (let i = -rx + 6; i < rx - 6; i += 6) { R(c, px + i, py + 1, 3, 1, '#f8c830'); R(c, px + i + 3, py + 1, 3, 1, '#1c1c24'); }
  } else if (env === 'taller') {
    gradV(c, 0, 0, W, 44, ['#64889a', '#84a8b4', '#a4c4cc']); R(c, 0, 0, W, 3, '#486874');
    for (let x = 15; x < W; x += 16) { R(c, x, 3, 1, 39, '#7090a0'); R(c, x + 1, 3, 1, 39, '#b4d0d8'); }
    R(c, 3, 6, 46, 34, '#2c3c4c'); R(c, 4, 7, 44, 32, '#4c6070'); for (let sh = 0; sh < 3; sh++) { R(c, 5, 8 + sh * 10, 42, 9, '#34485a'); let x = 6; while (x < 44) { const bw = 2 + Math.floor(r() * 3), bh = 5 + Math.floor(r() * 3); R(c, x, 17 + sh * 10 - bh, bw, bh, ['#a85848', '#4c9890', '#c8a440', '#5c5088', '#68a050', '#c8c8c0'][Math.floor(r() * 6)]); x += bw + 1; } }
    R(c, 96, 5, 40, 30, '#506878'); R(c, 97, 6, 38, 28, '#f0f4f0'); gradV(c, 99, 8, 34, 24, ['#88ccf8', '#c0e8fc', '#f0fafc']); R(c, 104, 16, 12, 3, '#ffffff'); R(c, 107, 14, 6, 2, '#ffffff'); R(c, 115, 8, 2, 24, '#f0f4f0'); R(c, 99, 19, 34, 2, '#f0f4f0');
    R(c, 0, 40, W, 4, '#486874'); R(c, 0, 40, W, 1, '#7090a0');
    gradV(c, 0, 44, W, 100, ['#c4b898', '#dcd0b0', '#ece4cc', '#f4ecd8']);
    for (let k = 0; k < 10; k++) { const y = 44 + Math.round(k * k * 1.05 + k * 2); if (y < H) R(c, 0, y, W, 1, '#c8bc9c'); }
    for (let i = -9; i <= 9; i++) for (let y = 44; y < H; y++) { const x = Math.round(80 + i * (y - 26) * .6); if (x >= 0 && x < W) P(c, x, y, '#c8bc9c'); }
    for (let j = 0; j < 70; j++) for (let i = 0; i < 46; i++) { const x = Math.round(92 + i - j * .5), y = 44 + j; if (x >= 0 && x < W && bay(x, y) < .4 - j * .004) P(c, x, y, 'rgba(255,250,210,.55)'); }
    const rug = ['#7cd0c8', '#58b8b0', '#2c8078', '#1c5c58', '#f8e070']; plat(118, 55, 32, 7, rug); plat(38, 99, 38, 8, rug);
  } else {
    const sky = [['#f8b890', '#f8d8b0', '#f0ecd8', '#f8f8e8'], ['#6cb4f0', '#98d4f8', '#c8ecf8', '#ecf8f0'], ['#4c4490', '#b05c90', '#f09070', '#f8d488'], ['#0c1030', '#141c48', '#20305c', '#34487c']][ph];
    gradV(c, 0, 0, W, 48, sky);
    if (ph === 3) { for (let i = 0; i < 46; i++) P(c, Math.floor(r() * W), Math.floor(r() * 40), r() < .3 ? '#ffffff' : '#a8b4e8'); ell(c, 30, 14, 7, 7, '#f4f4dc'); ell(c, 33, 12, 6, 6, sky[1]); P(c, 26, 16, '#d0d0b8'); }
    else if (ph === 2) { for (let rr = 13; rr > 8; rr -= 2) ell(c, 124, 40, rr, rr, mix('#f8d488', '#fff8d0', (13 - rr) / 5)); ell(c, 124, 40, 8, 8, '#fff8d0'); }
    else { for (let j = -12; j <= 12; j++) for (let i = -12; i <= 12; i++) { const d = Math.hypot(i, j); if (d < 12 && d >= 6 && bay(26 + i, 13 + j) > (d - 6) / 6) P(c, 26 + i, 13 + j, '#fff8d8'); } ell(c, 26, 13, 6, 6, '#fffbe4'); }
    const far = mix(sky[2], ph === 3 ? '#283868' : '#6888b8', .55), near = mix(sky[3], ph === 3 ? '#1c4048' : '#58a870', .62);
    for (let x = 0; x < W; x++) { const h1 = 10 + vnoise(x / 26, 1.3, 4) * 20 + vnoise(x / 7, 2, 5) * 3; R(c, x, 48 - h1, 1, h1, far); P(c, x, Math.round(48 - h1), lite(far, .3)); if (vnoise((x - 1) / 26, 1.3, 4) < vnoise(x / 26, 1.3, 4)) R(c, x, Math.round(48 - h1) + 1, 1, 3, lite(far, .16)); }
    for (let x = 0; x < W; x++) { const h2 = 5 + vnoise(x / 20, 7, 2) * 11; R(c, x, 48 - h2, 1, h2, near); P(c, x, Math.round(48 - h2), lite(near, .3)); }
    const tl = ph === 3 ? '#143830' : '#3c8c50', tlh = ph === 3 ? '#245848' : '#70c068';
    for (let x = 0; x < W; x++) { const h3 = 3 + Math.abs(Math.sin(x * .42)) * 3.5 + vnoise(x / 4, 3, 1) * 3; R(c, x, 49 - h3, 1, h3 + 1, tl); if (Math.sin(x * .42) > 0 === (x % 7 < 4)) P(c, x, Math.round(49 - h3), tlh); }
    R(c, 0, 49, W, 1, dark(tl, .3));
    gradV(c, 0, 50, W, 94, ['#d0f0a4', '#b4e688', '#9cdc70', '#88d060', '#7cc858']);
    for (let k = 0; k < 16; k++) { const y = 50 + Math.round(k ** 1.75 * .75); if (y >= H) break; for (let x = Math.floor(r() * 14); x < W; x += 6 + Math.floor(r() * 16)) R(c, x, y, 3 + Math.floor(r() * (4 + k)), 1, k & 1 ? '#a8e07c' : '#8cd064'); }
    for (let i = 0; i < 90; i++) { const y = 52 + Math.floor(r() ** .7 * 90), x = Math.floor(r() * W), big = y > 84; P(c, x, y, '#58a850'); P(c, x + 1, y - 1, '#74c458'); P(c, x + 2, y, '#58a850'); if (big) { P(c, x + 1, y - 2, '#b4ec88'); P(c, x + 1, y, '#3c8c44'); P(c, x - 1, y - 1, '#74c458'); P(c, x + 3, y - 1, '#74c458'); } }
    for (let i = 0; i < 9; i++) { const y = 60 + Math.floor(r() * 80), x = Math.floor(r() * W); P(c, x, y, ['#ffffff', '#f890b0', '#f8e060'][i % 3]); P(c, x, y + 1, '#3c8c44'); }
    const gp = ['#98dc74', '#78c860', '#58a850', '#3c8444', '#c4f094']; plat(118, 55, 32, 7, gp); plat(38, 99, 38, 8, gp);
    if (ph !== 1) { c.globalCompositeOperation = 'multiply'; c.fillStyle = ['#ffe6cc', '', '#ffb48c', '#7888d0'][ph]; c.fillRect(0, 49, W, H); c.globalCompositeOperation = 'source-over'; }
  }
  return BGC[key] = cv3;
}
const sideOf = k => ({ k, mon: B[k], spr: k === 'en' ? B.es : B.ps, st: B.st[k], cx: (k === 'en' ? B.es : B.ps).x, cy: (k === 'en' ? B.es : B.ps).y - 26 });
const nm = k => k === 'pl' ? monName(B.pl) : monName(B.en) + (B.wild ? ' salvaje' : ' rival');
const stMul = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
const STAT_N = { atk: 'El ATAQUE', def: 'La DEFENSA', spd: 'La VELOCIDAD', acc: 'La PRECISIÓN' };
const xpFrac = m => (m.xp - m.lv ** 3) / ((m.lv + 1) ** 3 - m.lv ** 3);
const bsay = (t, a = 34) => say(t, { auto: a });

// ── rangos de combate ──
const TIER = {
  trainer: { song: 'entrenador', win: 'victoriaE', pay: 1, ai: .7, a: '#30b8a8', b: '#e84848' },
  apagon: { song: 'apagon', win: 'victoriaE', pay: 1, ai: .7, a: '#30b8a8', b: '#2a2438', hazard: 1, label: 'COMPAÑÍA APAGÓN' },
  rival: { song: 'rival', win: 'victoriaE', pay: 2, ai: 1, a: '#30b8a8', b: '#e07830', label: 'RIVAL' },
  leader: { song: 'lider', win: 'victoriaL', pay: 3, ai: 1, a: '#30b8a8', b: '#f8d030', label: 'JEFE DE CENTRAL' },
  boss: { song: 'jefeApagon', win: 'victoriaL', pay: 3, ai: 1, a: '#30b8a8', b: '#1c1828', hazard: 1, label: 'MANDO DE APAGÓN', intro: 16 },
  final: { song: 'final', win: 'victoriaL', pay: 4, ai: 1, a: '#30b8a8', b: '#a02048', label: 'COMBATE FINAL', intro: 16 },
};
const tierOf = tr => TIER[tr.tier || (tr.cls && tr.cls.startsWith('RECLUTA') ? 'apagon' : 'trainer')];
// ── transiciones ──
// ── entrada al combate: todo cae en los pulsos de la intro de cada canción (alPulso) ──
const enFot = b => Math.max(4, Math.round(b * 3600 / ((SONGS[curName] || {}).bpm || 150))); // pulsos → fotogramas
// trazo de electrocardiograma: el PULSO cruza la pantalla con un pico por cada negra
const ECG = [[-9, 0], [-7, -3], [-5, 0], [-3, 5], [0, -26], [3, 13], [5, 0]];
function ecgY(x) {
  let best = 0;
  for (let b = 0; b < 4; b++) { const d = x - (22 + b * 39); if (d <= -9 || d >= 5) continue; for (let i = 1; i < ECG.length; i++) if (d <= ECG[i][0]) { const [x0, y0] = ECG[i - 1], [x1, y1] = ECG[i]; best = y0 + (y1 - y0) * (d - x0) / (x1 - x0); break; } }
  return 72 + Math.round(best);
}
async function wipeToBattle(tr) {
  if (tr) return cartel(tr);
  // salvaje: cuatro latidos sobre el mapa y, al quinto, la pantalla se abre por el trazo
  const o = { open: 0, glow: 0 }, f = { t: 0, life: 1e9, draw() {
    const p = pulsos(), hx = Math.min(W, Math.round(W * p / 3.6));
    g.globalAlpha = Math.min(.55, p * .14); g.fillStyle = '#101018'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    let py = ecgY(0);
    for (let x = 0; x < hx; x++) {
      const y = ecgY(x), a = Math.min(py, y), h = Math.abs(y - py) + 2; py = y;
      if (o.open > 0) { const k = Math.round(o.open * 96); g.fillStyle = '#101018'; g.fillRect(x, y - k, 1, k * 2 + 2); g.fillStyle = '#f8e070'; g.fillRect(x, y - k - 2, 1, 2); g.fillRect(x, y + k + 2, 1, 2); g.fillStyle = '#ffffff'; g.fillRect(x, y - k - 1, 1, 1); g.fillRect(x, y + k + 2, 1, 1); }
      else { g.fillStyle = 'rgba(248,224,112,.35)'; g.fillRect(x, a - 2, 1, h + 4); g.fillStyle = INK; g.fillRect(x, a - 1, 1, h + 2); g.fillStyle = o.glow > .5 ? '#ffffff' : '#f8e070'; g.fillRect(x, a, 1, h); }
    }
    if (!o.open && hx < W) { disc(hx, ecgY(hx), 2, '#ffffff'); if (frame & 1) part({ x: hx, y: ecgY(hx), vx: rnd(-1, 0), vy: rnd(-1, 1), life: 10, c: '#f8e070' }); }
  } };
  fxs.push(f);
  for (let b = 0; b < 4; b++) { await alPulso(b); flash('#fff', b === 3 ? .7 : .4); scr.zoom = 1.03 + b * .015; sfx.spark(); o.glow = 1; tw(o, { glow: 0 }, 10, 'lin'); }
  await alPulso(4); sfx.wipe(); flash('#fff', .9); shake(3); tw(o, { open: 1 }, enFot(1.4), 'in');
  await alPulso(5.5); scr.fadeC = '#101018'; scr.fade = 1; fxs.splice(fxs.indexOf(f), 1);
}
// ── cartel de duelo: dos paneles en diagonal, la silueta de la primera criatura de cada uno detrás, y un rayo que cae entre los dos ──
const corteX = y => Math.round(98 - y * 36 / 144), rayoX = y => corteX(y) + Math.round(((y % 36) < 26 ? (y % 36) / 26 : 1 - ((y % 36) - 26) / 10) * 12 - 6);
const vsRango = (lado, y, off) => lado ? [off + corteX(y) + 5, off + W + 70] : [off - 70, off + corteX(y) - 5];
function cintaPeligro(y, h, dx, col = '#f8d030') { g.fillStyle = INK; g.fillRect(0, y - 1, W, h + 2); g.fillStyle = col; g.fillRect(0, y, W, h); g.fillStyle = INK; for (let x = -32 + ((dx % 16) + 16) % 16; x < W + 16; x += 16) for (let j = 0; j < h; j++) g.fillRect(x + h - j, y + j, 7, 1); }
function nombreGrande(s, x, y, der) {
  const esc = tw_(s) * 2 > 96 ? 1 : 2, im = bigText(s, esc, '#ffffff', 1), ik = bigText(s, esc, INK, 1), px = der ? x - im.width : x;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [1, -1], [-1, 1], [0, 2], [1, 2]]) g.drawImage(ik, px + dx, y + dy);
  g.drawImage(im, px, y); return esc;
}
async function cartel(tr) {
  const T2 = tierOf(tr), largo = T2.intro || 8, p0 = largo - 8, cb = tr.tier === 'leader' && tr.type ? TYPES[tr.type].c : T2.b, osc = cb === '#1c1828' || cb === '#2a2438';
  const mio = G.party.find(m => m.hp > 0) || G.party[0], suyo = tr.party[0];
  // 1) la pantalla se cierra en los cuatro golpes del primer compás (3+3+2 y el acento)
  const cierre = { n: 0 }, f = { t: 0, life: 1e9, draw() {
    for (let i = 0; i < 18; i++) { const k = [0, 2, 1, 3][i % 4]; if (k < cierre.n) { g.fillStyle = '#101018'; g.fillRect(0, i * 8, W, 8); if (k === cierre.n - 1 && cierre.t > 0) { g.fillStyle = T2.hazard ? '#f8d030' : cb; g.globalAlpha = cierre.t; g.fillRect(0, i * 8 + 3, W, 2); g.globalAlpha = 1; } } }
  } };
  fxs.push(f);
  for (const [i, b] of [0, .75, 1.5, 2].entries()) { await alPulso(b); cierre.n = i + 1; cierre.t = 1; tw(cierre, { t: 0 }, 8, 'lin'); sfx.bump(); shake(i === 3 ? 3 : 1.5); if (i === 3) flash(T2.hazard ? '#f8d030' : '#fff', .5); }
  await wait(4);
  // 2) el cartel
  const o = { a: -W - 80, b: W + 80, vs: 0, lab: 0, pre: 0, hits: [] }, card = { draw() {
    g.fillStyle = '#101018'; g.fillRect(0, 0, W, H);
    // antesala de los jefes: mientras el motivo suena solo en el bajo, cintas de peligro o anillos, y su rótulo
    if (o.pre > 0 && o.b > 40) {
      if (T2.hazard) for (let i = 0; i < Math.min(3, o.pre); i++) cintaPeligro([22, 104, 63][i], 12, (i & 1 ? -1 : 1) * frame);
      else for (const hf of o.hits) { const r = (frame - hf) * 2.5; if (r < 130) { g.globalAlpha = Math.max(0, 1 - r / 130); g.strokeStyle = cb; g.lineWidth = 3; g.beginPath(); g.arc(80, 72, r, 0, 7); g.stroke(); g.globalAlpha = 1; } }
      if (o.pre >= 4 && T2.label) { const im = bigText(T2.label, 1, T2.hazard ? '#f8d030' : '#ffffff', 1), w = im.width + 12; g.fillStyle = INK; g.fillRect(80 - w / 2, 57, w, 24); g.fillStyle = T2.hazard ? '#f8d030' : cb; g.fillRect(80 - w / 2, 57, w, 1); g.fillRect(80 - w / 2, 80, w, 1); g.drawImage(im, 80 - im.width / 2 + 1, 63); }
    }
    for (const lado of [1, 0]) {
      const off = Math.round(lado ? o.b : o.a), col = lado ? cb : T2.a; if (Math.abs(off) > W + 60) continue;
      for (let y = 0; y < H; y++) { const [x0, x1] = vsRango(lado, y, off); g.fillStyle = col; g.fillRect(x0, y, x1 - x0, 1); if (y > 100 || (y > 76 && (y & 1))) { g.fillStyle = 'rgba(16,16,24,.22)'; g.fillRect(x0, y, x1 - x0, 1); } }
      if (lado && T2.hazard) { g.fillStyle = '#f8d030'; for (let y = 0; y < H; y++) { const [x0, x1] = vsRango(1, y, off); for (let x = x0 - ((x0 + y + (frame >> 1)) % 24 + 24) % 24; x < x1; x += 24) { const a = Math.max(x0, x), b = Math.min(x1, x + 9); if (b > a) g.fillRect(a, y, b - a, 1); } } }
      g.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 7; i++) { const y = 9 + i * 20 + (lado ? 0 : 10), [x0, x1] = vsRango(lado, y, off), len = 26 + (i * 37) % 30, px = lado ? x1 - 70 - ((frame * 6 + i * 53) % 200) : x0 + 70 + ((frame * 6 + i * 53) % 200) - len, a = Math.max(x0, px), b = Math.min(x1, px + len); if (b > a) g.fillRect(a, y, b - a, 2); }
      // detrás, enorme y en sombra, la criatura que va a salir
      g.save(); g.beginPath(); if (lado) { g.moveTo(off + corteX(0) + 5, 0); g.lineTo(off + W + 70, 0); g.lineTo(off + W + 70, H); g.lineTo(off + corteX(H) + 5, H); } else { g.moveTo(off - 70, 0); g.lineTo(off + corteX(0) - 5, 0); g.lineTo(off + corteX(H) - 5, H); g.lineTo(off - 70, H); } g.clip();
      if (lado && (tr.tier === 'leader' || tr.tier === 'final')) { g.globalAlpha = .16; g.fillStyle = '#ffffff'; for (let k = 0; k < 8; k++) { const an = frame * .02 + k * Math.PI / 4; g.beginPath(); g.moveTo(off + 126, 66); g.lineTo(off + 126 + Math.cos(an) * 160, 66 + Math.sin(an) * 160); g.lineTo(off + 126 + Math.cos(an + .2) * 160, 66 + Math.sin(an + .2) * 160); g.fill(); } g.globalAlpha = 1; }
      drawMon(lado ? suyo.sp : mio.sp, lado ? 'f0' : 'back', off + (lado ? 122 : 36), lado ? 108 : 160, osc && lado ? { white: true, alpha: .13, sx: 2, sy: 2 } : { dark: true, alpha: .3, sx: 2, sy: 2 });
      g.restore();
      if (off) noOvf++;
      if (lado) {
        // su Makinamon a todo color es el protagonista; el muñeco del mapa, a su lado
        ell(g, off + 128, 87, 20, 4, 'rgba(16,16,24,.35)'); drawMon(suyo.sp, (frame % 70) < 10 ? 'f1' : 'f0', off + 128, 88);
        ell(g, off + 100, 89, 9, 2, 'rgba(16,16,24,.4)'); g.drawImage(CHARS[tr.style], 2 * 3 * 16, 0, 16, 16, off + 84, 58, 32, 32);
        txtO(tr.cls || '', off + 155 - tw_(tr.cls || ''), 98, osc ? '#f8d030' : '#fff'); nombreGrande(tr.name, off + 156, 105, true);
        tr.party.forEach((m, i) => { g.fillStyle = INK; g.fillRect(off + 148 - i * 9, 90, 8, 5); g.fillStyle = TYPES[SPECIES[m.sp].t].c; g.fillRect(off + 149 - i * 9, 91, 6, 3); });
      } else {
        ell(g, off + 30, 105, 20, 4, 'rgba(16,16,24,.35)'); drawMon(mio.sp, 'back', off + 30, 106);
        ell(g, off + 54, 107, 9, 2, 'rgba(16,16,24,.4)'); g.drawImage(CHARS.nia, 3 * 3 * 16, 0, 16, 16, off + 38, 76, 32, 32);
        G.party.forEach((m, i) => { g.fillStyle = INK; g.fillRect(off + 4 + i * 9, 39, 8, 5); g.fillStyle = m.hp > 0 ? TYPES[SPECIES[m.sp].t].c : '#585868'; g.fillRect(off + 5 + i * 9, 40, 6, 3); });
        txtO('MAKINISTA', off + 4, 4, '#fff'); nombreGrande(G.name, off + 4, 11, false);
      }
      if (off) noOvf--;
    }
    // el rayo cae por la grieta entre los dos
    if (o.vs > 0) {
      const yMax = Math.round(H * Math.min(1, o.vs * 1.15)), blanco = o.vs < 1 || (frame % 10) < 2;
      for (let y = 0; y < yMax; y++) { const x = rayoX(y); g.fillStyle = INK; g.fillRect(x - 5, y, 11, 1); g.fillStyle = '#f8e070'; g.fillRect(x - 3, y, 7, 1); g.fillStyle = blanco ? '#ffffff' : '#fff8c0'; g.fillRect(x - 1, y, blanco ? 3 : 2, 1); }
    }
    // rótulos del rango (y el tipo de la Central), por encima de todo
    if (o.lab > 0) {
      const sl = o.lab !== 1; if (sl) noOvf++;
      if (T2.label) { const lw = tw_(T2.label) + 10, x = W + 2 - Math.round((lw + 2) * o.lab); g.fillStyle = INK; g.fillRect(x - 1, 130, lw + 20, 13); g.fillStyle = osc ? '#f8d030' : '#ffffff'; g.fillRect(x, 131, lw + 20, 11); txt(T2.label, x + 5, 133, INK); }
      if (tr.tier === 'leader' && tr.type) { const ty = TYPES[tr.type], lw = tw_(ty.n) + 8, x = W + 2 - Math.round((lw + 2) * o.lab); g.fillStyle = INK; g.fillRect(x - 1, 5, lw + 20, 11); g.fillStyle = ty.d; g.fillRect(x, 6, lw + 20, 9); txt(ty.n, x + 4, 7, '#fff'); }
      if (sl) noOvf--;
    }
  } };
  ui.push(card); fxs.splice(fxs.indexOf(f), 1); scr.fadeC = '#101018'; scr.fade = 0;
  if (p0 > 0) for (const [i, b] of [4, 4.75, 5.5, 6].entries()) { await alPulso(b); o.pre = i + 1; o.hits.push(frame); sfx.bump(); shake(i === 3 ? 4 : 2); if (i === 3) { flash(T2.hazard ? '#f8d030' : cb, .5); sfx.lock(); } }
  await alPulso(Math.max(2.3, p0)); sfx.whoosh(); tw(o, { a: 0 }, enFot(1.2), 'out'); await tw(o, { b: 0 }, enFot(1.2), 'out'); o.pre = 0;
  await alPulso(p0 + 4 - .15); await tw(o, { vs: 1 }, 7, 'in');
  sfx.thunder(); sfx.crit(); shake(6); flash('#fff', .9); scr.zoom = 1.08; for (const y of [20, 70, 120]) burst(rayoX(y), y, 12, { c: ['#fff', '#f8e070'], v0: 1, v1: 4, kind: 'star' });
  sfx.cry(SPECIES[suyo.sp].cry); tw(o, { lab: 1 }, 12, 'back');
  await alPulso(largo - .5); await fade(1, enFot(.45)); ui.splice(ui.indexOf(card), 1);
}
// ── entradas y salidas ──
async function sendOut(k, first) {
  const s = sideOf(k), sp = s.spr, m = s.mon, c = B.celda;
  B.st[k] = { atk: 0, def: 0, spd: 0, acc: 0 }; B.dhp[k] = m.hp; if (k === 'pl') B.dxp = xpFrac(m);
  sp.vis = false; sp.clip = 0; sp.sx = sp.sy = 0; sp.white = true; sp.dark = false; sp.ox = sp.oy = 0;
  c.vis = true; c.leds = 3; c.col = TYPES[SPECIES[m.sp].t].c; c.wob = 0;
  const x0 = k === 'pl' ? -8 : W + 8, y1 = sp.y - 8; sfx.throw();
  for (let i = 0; i <= 18; i++) { const q = i / 18; c.x = x0 + (sp.x - x0) * q; c.y = y1 - Math.sin(q * Math.PI) * 26 + (1 - q) * 10; c.wob += .9; await wait(1); }
  c.vis = false; sfx.pop(); flash('#fff', .5); sp.vis = true;
  burst(sp.x, sp.y - 20, 18, { c: [c.col, '#fff'], v0: 1, v1: 3, kind: 'star' }); part({ x: sp.x, y: sp.y - 20, kind: 'ring', s: 30, life: 16, c: '#fff' });
  await tw(sp, { sx: 1, sy: 1 }, 14, 'back'); sp.white = false; sp.f1 = 26; sfx.cry(SPECIES[m.sp].cry);
  tw(B.hud, { [k]: 1 }, 14, 'back'); sp.sy = 1.12; await tw(sp, { sy: 1 }, 16, 'elastic');
  if (k === 'en') G.seen[m.sp] = 1;
}
async function recall(k) { const sp = sideOf(k).spr; sp.white = true; sfx.throw(); await tw(sp, { sx: 0, sy: 0 }, 12, 'in'); sp.vis = false; sp.white = false; tw(B.hud, { [k]: 0 }, 10, 'in'); }
async function setHp(k) {
  const m = B[k], from = B.dhp[k], n = clamp(Math.round(Math.abs(from - m.hp) / m.max * 50), 10, 44);
  for (let i = 1; i <= n; i++) { B.dhp[k] = from + (m.hp - from) * i / n; if (i % 3 === 0) sfx.hpTick(300 + 500 * B.dhp[k] / m.max); await wait(1); }
  B.dhp[k] = m.hp;
}
// ── animaciones de ataque ──
function emit(ax, ay, dx, dy, o) {
  const T = o.T || 14;
  for (let k = 0; k < (o.per || 2); k++) part({ x: ax + rnd(-3, 3), y: ay + rnd(-3, 3), vx: (dx - ax) / T + rnd(-.25, .25), vy: (dy - ay) / T - (o.arc ? .5 * o.arc * T : 0) + rnd(-.25, .25), ay: o.arc || 0, life: T + ri(0, 3), c: pick(o.c), s: o.s || 2, drag: 1, shrink: o.shrink, kind: o.kind });
}
async function stream(a, d, o, frames = 14) { for (let i = 0; i < frames; i++) { emit(a.cx, a.cy, d.cx, d.cy, o); await wait(1); } (async () => { for (let i = 0; i < 8; i++) { emit(a.cx, a.cy, d.cx, d.cy, o); await wait(1); } })(); }
const TFX = {
  async CHAPA(a, d) { sfx.lunge(); for (let k = 0; k < 3; k++) { part({ kind: 'ring', x: a.cx, y: a.cy, s: 10 + k * 6, life: 16, c: '#e8e4d0' }); await wait(4); } await stream(a, d, { c: ['#ffffff', '#c8ccd4', '#8890a0'], s: 2, per: 2 }); burst(d.cx, d.cy, 18, { c: ['#ffffff', '#c8ccd4', '#f8e070'], v0: 1, v1: 3 }); shake(3); sfx.crit(); },
  async BRASA(a, d) { sfx.BRASA(); await stream(a, d, { c: ['#fff8c0', '#f8d030', '#f08030', '#e84838'], s: 3, shrink: 1, per: 3 }); burst(d.cx, d.cy + 8, 26, { c: ['#f8d030', '#f08030', '#e84838', '#fff8c0'], v0: .4, v1: 2, a0: Math.PI * 1.1, a1: Math.PI * 1.9, ay: -.04, s: 3, shrink: 1, l0: 16, l1: 30 }); d.spr.tint = '#f08030'; flash('#f8a030', .35); },
  async VAPOR(a, d) { sfx.VAPOR(); await stream(a, d, { c: ['#e8f8ff', '#9cd4f8', '#5aa8f0'], arc: .16, s: 2, per: 3 }); burst(d.cx, d.cy, 16, { c: ['#9cd4f8', '#e8f8ff'], v0: .8, v1: 2.4, ay: .12 }); for (let i = 0; i < 8; i++) part({ x: d.cx + rnd(-14, 14), y: d.cy + rnd(-6, 12), vy: -rnd(.3, .8), life: ri(24, 40), c: pick(['#ffffff', '#e0f0f8']), s: ri(3, 6), kind: 'puff', drag: 1 }); d.spr.tint = '#9cd4f8'; },
  async CHISPA(a, d) {
    sfx.CHISPA(); burst(a.cx, a.cy, 10, { c: ['#f8e070', '#fff'], v0: 1, v1: 2.5 });
    for (let s = 0; s < 2; s++) {
      const pts = [[d.cx + rnd(-20, 20), -4]]; let x = pts[0][0], y = -4; while (y < d.cy) { y += rnd(6, 11); x += rnd(-9, 9) + (d.cx - x) * .35; pts.push([x, Math.min(y, d.cy + 4)]); }
      flash('#f8f0a0', .5); await fx(8, (k, t) => { g.strokeStyle = t & 1 ? '#fff' : '#f8d030'; g.lineWidth = t < 3 ? 3 : 1; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); });
      burst(d.cx, d.cy + 4, 12, { c: ['#f8e070', '#fff', '#f0c020'], v0: 1, v1: 3.5, l0: 6, l1: 14 });
    }
    d.spr.tint = '#f8e070';
  },
  async MUSGO(a, d) {
    sfx.MUSGO(); const leaves = Array.from({ length: 12 }, (_, i) => ({ d: i * 1.5, ph: rnd(7), amp: rnd(6, 14) }));
    await fx(30, (k, t) => { for (const l of leaves) { const q = clamp((t - l.d) / 16, 0, 1); if (q <= 0 || q >= 1) continue; const x = a.cx + (d.cx - a.cx) * q, y = a.cy + (d.cy - a.cy) * q + Math.sin(q * 9 + l.ph) * l.amp * (1 - q); g.fillStyle = '#2f8244'; g.fillRect(x - 1, y, 4, 2); g.fillStyle = '#8ed24a'; g.fillRect(x, y - 1, 2, 2); } });
    fx(18, k => { g.strokeStyle = '#2f8244'; g.lineWidth = 2; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(d.cx + i * 14, d.spr.y); g.quadraticCurveTo(d.cx + i * 22, d.spr.y - 20 * k, d.cx + i * 4, d.spr.y - 38 * Math.min(1, k * 1.6)); g.stroke(); } });
    burst(d.cx, d.cy, 18, { c: ['#8ed24a', '#2f8244', '#c4f094'], v0: .6, v1: 2.2, ay: .06 }); d.spr.tint = '#78c850';
  },
  async OXIDO(a, d) { sfx.OXIDO(); await stream(a, d, { c: ['#c8703c', '#8a4030', '#e8a050', '#5e3c26'], s: 2, per: 4, T: 16 }, 16); for (let i = 0; i < 10; i++) part({ x: d.cx + rnd(-16, 16), y: d.cy + rnd(-12, 14), vy: -rnd(.1, .4), life: ri(20, 36), c: pick(['#c8703c', '#8a4030', '#a85c30']), s: ri(3, 5), kind: 'puff', drag: 1 }); d.spr.tint = '#8a4030'; },
  async IMAN(a, d) {
    sfx.IMAN(); for (let i = 0; i < 3; i++) { part({ x: a.cx, y: a.cy, kind: 'ring', s: 26, life: 14, c: i & 1 ? '#e84848' : '#5878e8' }); await wait(5); }
    const p = { x: a.cx, y: a.cy }; const f = fx(12, (k, t) => { g.fillStyle = INK; const s = t & 2 ? 4 : 3; g.fillRect(p.x - s, p.y - s, s * 2, s * 2); g.fillStyle = '#c8d0e8'; g.fillRect(p.x - s + 1, p.y - s + 1, s * 2 - 2, s * 2 - 2); g.fillStyle = INK; g.fillRect(p.x - 1, p.y - 1, 2, 2); part({ x: p.x, y: p.y, life: 8, c: '#9890d0' }); });
    await tw(p, { x: d.cx, y: d.cy }, 12, 'in'); burst(d.cx, d.cy, 16, { c: ['#c8d0e8', '#fff', '#9890d0'], v0: 1, v1: 3, kind: 'star' }); d.spr.tint = '#9890d0';
  },
};
async function lunge(a, d) { const sgn = a.k === 'pl' ? 1 : -1; sfx.lunge(); burst(a.spr.x, a.spr.y - 2, 6, { c: ['#fff', '#e8e0c0'], v0: .4, v1: 1.4, a0: Math.PI, a1: Math.PI * 2, kind: 'puff', s: 2, shrink: 1 });
  fx(14, (k, t) => { g.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 7; i++) { const y = a.cy - 22 + i * 8 + (i * 5 % 3), x = (a.k === 'pl' ? 0 : W) + sgn * ((t * 14 + i * 37) % 120); g.fillRect(x - 12, y, 24, 1); } }); await tw(a.spr, { ox: -sgn * 5, oy: sgn * 2 }, 6, 'out'); await tw(a.spr, { ox: sgn * 22, oy: -sgn * 12 }, 5, 'in'); tw(a.spr, { ox: 0, oy: 0 }, 14, 'out'); }
// estallido de impacto: estrella de puntas con contorno, del color del tipo y corazón blanco
function estallido(cx, cy, r, rot, col) {
  const R2 = Math.ceil(r) + 2;
  for (let y = -R2; y <= R2; y++) for (let x = -R2; x <= R2; x++) {
    const d2 = Math.hypot(x, y), k = .45 + .55 * Math.abs(Math.cos(Math.atan2(y, x) * 4 + rot)) ** 2.2, rr = r * k;
    const c = d2 <= rr * .5 ? '#ffffff' : d2 <= rr ? col : d2 <= rr + 1.6 ? INK : null; if (c) { g.fillStyle = c; g.fillRect(Math.round(cx) + x, Math.round(cy) + y, 1, 1); }
  }
}
async function impact(d, e, crit, mv, enAnim) { // enAnim: el golpe cae en mitad de la animación, que ya mueve a la criatura a su manera
  const big = e > 1 || crit, flojo = e < 1 && !crit, col = TYPES[mv.t].c, sgn = d.k === 'pl' ? -1 : 1, r0 = big ? 22 : flojo ? 9 : 15;
  if (crit) sfx.crit(); else if (flojo) sfx.weak(); else sfx.hit(e > 1 ? .7 : 1);
  d.spr.white = true; shake(big ? 7 : flojo ? 1.5 : 4); if (big) { flash(col, .5); scr.zoom = 1.1; } else if (!flojo) scr.zoom = 1.04; B.hudSh[d.k] = big ? 18 : 10;
  const rot = rnd(3);
  fx(big ? 12 : 9, k => { const r = k < .35 ? r0 * (.6 + k * 1.15) : r0 * (1 - (k - .35) * .9); estallido(d.cx, d.cy, r, rot + k * .5, flojo ? '#c8ccd4' : col);
    if (!flojo) { g.fillStyle = '#ffffff'; for (let i = 0; i < 10; i++) { const an = rot + i * .628, a0 = r0 * (.9 + k * 1.2), a1 = a0 + (big ? 16 : 9) * (1 - k); for (let q = a0; q < a1; q += 1) g.fillRect(Math.round(d.cx + Math.cos(an) * q), Math.round(d.cy + Math.sin(an) * q * .85), i & 1 ? 1 : 2, 1); } } });
  burst(d.spr.x, d.spr.y - 2, big ? 12 : 6, { c: ['#fff', '#e8e0c0', '#c8d8b0'], v0: .5, v1: 1.8, a0: Math.PI, a1: Math.PI * 2, kind: 'puff', s: 3, shrink: 1, ay: .03 });
  if (!flojo) { burst(d.cx, d.cy, big ? 24 : 12, { c: ['#fff', col, lite(col, .4)], v0: 1.2, v1: big ? 4.5 : 3, kind: 'star', l0: 8, l1: 18 }); burst(d.cx, d.cy, big ? 14 : 7, { c: [col, dark(col, .3)], v0: 1, v1: 3, a0: sgn > 0 ? -1.2 : Math.PI - 1.2, a1: sgn > 0 ? .6 : Math.PI + .6, ay: .18, s: 3, l0: 14, l1: 26 }); }
  part({ x: d.cx, y: d.cy, kind: 'ring', s: big ? 38 : 22, life: 12, c: '#fff' }); if (big) part({ x: d.cx, y: d.cy, kind: 'ring', s: 54, life: 18, c: col });
  // la criatura se aplasta y sale despedida hacia atrás; luego vuelve temblando
  if (!enAnim) { d.spr.sx = big ? .8 : .9; d.spr.sy = big ? 1.16 : 1.08; d.spr.oy = -sgn * (big ? 4 : 2); } d.spr.ox = sgn * (big ? 12 : flojo ? 3 : 7);
  await wait(big ? 7 : 4); // parón de impacto
  if (!enAnim) tw(d.spr, { sx: 1, sy: 1, oy: 0 }, 10, 'back');
  const o0 = d.spr.ox; for (let i = 0; i < 6; i++) { d.spr.white = i % 2 === 0; d.spr.ox = o0 * (1 - (i + 1) / 6) + (i % 2 ? -1 : 1) * (5 - i) * .6; await wait(3); }
  d.spr.white = false; d.spr.ox = 0; d.spr.tint = null;
}
function dmgNumber(d, n, col = '#fff', big) { const o = { y: d.cy - 8, s: big ? 3 : 2 }, s = '-' + n; tw(o, { y: d.cy - 30 }, 30, 'out'); tw(o, { s: big ? 2 : 1 }, 8, 'out');
  fx(38, k => { if (k > .85 && (frame & 1)) return; const sc = Math.max(1, Math.round(o.s)); if (sc === 1) return txtO(s, d.cx - tw_(s) / 2, o.y, col); const im = bigText(s, sc, col, 1), ik = bigText(s, sc, INK, 1), x = Math.round(d.cx - im.width / 2), y = Math.round(o.y - sc * 3); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) g.drawImage(ik, x + dx, y + dy); g.drawImage(im, x, y); }); }
async function statFx(s, up) {
  up ? sfx.statUp() : sfx.statDown(); const col = up ? '#58aef0' : '#e84848';
  await fx(30, (k, t) => { for (let i = 0; i < 5; i++) { const x = s.cx - 20 + i * 10, y = s.cy + (up ? 20 - ((t * 2 + i * 9) % 44) : -24 + ((t * 2 + i * 9) % 44)); txtO(up ? '↑' : '↓', x, y, col); } });
}
async function wavesFx(a, d) { sfx.onda(); const sgn = a.k === 'pl' ? 1 : -1; fx(34, (k, t) => { g.strokeStyle = INK; g.lineWidth = 1; for (let i = 0; i < 4; i++) { const q = (t / 34 + i * .2) % 1, x = a.cx + (d.cx - a.cx) * q, y = a.cy + (d.cy - a.cy) * q; g.beginPath(); g.arc(x - sgn * 8, y + sgn * 4, 6 + q * 12, sgn > 0 ? -1.3 : 1.9, sgn > 0 ? .3 : 3.5); g.stroke(); } }); await wait(20); for (let i = 0; i < 8; i++) { d.spr.ox = i & 1 ? 2 : -2; await wait(2); } d.spr.ox = 0; }

// deja los dos sprites como estaban tras una animación
async function neutral(a, d, keepTint) { for (const s of [a, d]) { Object.assign(s.spr, { white: false, dark: false }); if (s.spr.ox || s.spr.oy || s.spr.sx !== 1 || s.spr.sy !== 1) tw(s.spr, { ox: 0, oy: 0, sx: 1, sy: 1 }, 6, 'out'); } if (!keepTint) d.spr.tint = null; a.spr.tint = null; await wait(1); }
// ── un movimiento ──
async function doMove(ak, mvId) {
  const a = sideOf(ak), d = sideOf(ak === 'pl' ? 'en' : 'pl'), mv = MOVES[mvId];
  if (a.mon.status === 'corto' && Math.random() < .25) { burst(a.cx, a.cy, 10, { c: ['#f8e070', '#fff'], v0: 1, v1: 2.5 }); sfx.spark(); a.spr.dark = true; await wait(6); a.spr.dark = false; await bsay(`${nm(ak)} está en CORTO. ¡No se mueve!`); return; }
  await bsay(`¡${nm(ak)} usa ${mv.n}!`, 18);
  if (ak === 'en') a.spr.f1 = 40;
  if (Math.random() * 100 >= mv.acc * stMul(a.st.acc)) { await missAnim(a, d); await bsay('¡Pero falla!'); return; }
  if (mv.k === 'estado') {
    const e = mv.e;
    if (ANIM[mvId]) await playAnim(mvId, a, d); else await wavesFx(a, d);
    d.spr.tint = null; await neutral(a, d);
    if (e.heal) { if (a.mon.hp >= a.mon.max) { await bsay('¡Ya está a tope!'); return; } a.mon.hp = Math.min(a.mon.max, a.mon.hp + Math.ceil(a.mon.max * e.heal)); sfx.heal(); burst(a.cx, a.cy, 14, { c: ['#58e890', '#fff'], v0: .5, v1: 2 }); await setHp(a.k); await bsay(`¡${nm(a.k)} recupera PS!`); return; }
    if (e.stat) {
      const t = e.self ? a : d, tk = t.k;
      if ((e.by > 0 && t.st[e.stat] >= 6) || (e.by < 0 && t.st[e.stat] <= -6)) { await bsay('¡No tiene efecto!'); return; }
      t.st[e.stat] = clamp(t.st[e.stat] + e.by, -6, 6); await statFx(t, e.by > 0); await bsay(`¡${STAT_N[e.stat]} de ${nm(tk)} ${e.by > 0 ? 'sube' : 'baja'}!`);
    } else if (e.status) {
      if (d.mon.status || SPECIES[d.mon.sp].t === 'CHISPA') { await bsay('¡No le afecta!'); return; }
      d.mon.status = e.status; await bsay(`¡${nm(d.k)} entra en CORTO!`);
    }
    return;
  }
  // daño
  const am = a.mon, dm = d.mon, ef = eff(mv.t, SPECIES[dm.sp].t), crit = Math.random() < 1 / 16;
  let dmg = Math.floor(Math.floor((2 * am.lv / 5 + 2) * mv.pow * (am.atk * stMul(a.st.atk)) / (dm.def * stMul(d.st.def))) / 50) + 2;
  dmg = Math.max(1, Math.floor(dmg * (SPECIES[am.sp].t === mv.t ? 1.5 : 1) * ef * (crit ? 1.5 : 1) * rnd(.85, 1)));
  // toma impulso: se encoge, se tiñe de su tipo y la energía acude a ella
  const tc = TYPES[mv.t].c; a.spr.tint = tc; part({ x: a.cx, y: a.cy, kind: 'ring', s: 24, life: 10, c: tc });
  for (let i = 0; i < 10; i++) { const an = rnd(7), r = rnd(18, 28); part({ x: a.cx + Math.cos(an) * r, y: a.cy + Math.sin(an) * r, vx: -Math.cos(an) * r / 8, vy: -Math.sin(an) * r / 8, life: 8, c: pick(['#fff', tc]), s: 2, drag: 1 }); }
  await tw(a.spr, { sy: .84, sx: 1.12 }, 6, 'out'); a.spr.tint = null; tw(a.spr, { sy: 1, sx: 1 }, 10, 'back');
  let pega = null; const golpear = () => { if (pega) return; const enAnim = alGolpe === golpear; alGolpe = null; dm.hp = Math.max(0, dm.hp - dmg); dmgNumber(d, dmg, ef > 1 ? '#f8e070' : '#fff', ef > 1 || crit); pega = Promise.all([impact(d, ef, crit, mv, enAnim), setHp(d.k)]); };
  alGolpe = Object.assign(golpear, { spr: d.spr, cx: d.cx, cy: d.cy });
  try { if (ANIM[mvId]) await playAnim(mvId, a, d, mv); else if (mv.k === 'golpe') await lunge(a, d); else await TFX[mv.t](a, d); } finally { alGolpe = null; }
  golpear(); await pega; await neutral(a, d);
  if (crit) await bsay('¡Golpe crítico!');
  if (ef > 1) await bsay('¡Es muy eficaz!'); else if (ef < 1) await bsay('No es muy eficaz…');
  if (dm.hp > 0 && mv.e && Math.random() < (mv.e.ch ?? 1)) {
    if (mv.e.status && !dm.status && SPECIES[dm.sp].t !== 'CHISPA') { dm.status = mv.e.status; sfx.spark(); burst(d.cx, d.cy, 10, { c: ['#f8e070', '#fff'], v0: 1, v1: 2.5 }); await bsay(`¡${nm(d.k)} entra en CORTO!`); }
    else if (mv.e.stat && d.st[mv.e.stat] > -6) { d.st[mv.e.stat] = Math.max(-6, d.st[mv.e.stat] + mv.e.by); await statFx(d, false); await bsay(`¡${STAT_N[mv.e.stat]} de ${nm(d.k)} baja!`); }
  }
}
async function faint(k) {
  const s = sideOf(k); sfx.faint(SPECIES[s.mon.sp].cry[0]); if (k === 'pl') darAfecto(s.mon, -4); await wait(10);
  s.spr.dark = false; await tw(s.spr, { clip: 1 }, 22, 'in'); burst(s.spr.x, s.spr.y - 2, 14, { c: ['#f6e4b0', '#fff', '#c8c8c0'], v0: .5, v1: 2, a0: Math.PI, a1: Math.PI * 2, kind: 'puff', s: 3, shrink: 1 });
  s.spr.vis = false; tw(B.hud, { [k]: 0 }, 12, 'in'); await bsay(`¡${nm(k)} se queda sin Pulso!`, 50);
}
// ── experiencia ──
async function gainXp() {
  const total = Math.floor(SPECIES[B.en.sp].xp * B.en.lv / 5 * (B.wild ? 1 : 1.5) * 1.35), ps = [...B.part].filter(i => G.party[i].hp > 0); if (!ps.length) return;
  const each = Math.max(1, Math.floor(total / ps.length));
  for (const i of ps) {
    const m = G.party[i], act = i === B.pi; darAfecto(m, 2); await bsay(`¡${monName(m)} gana ${each} puntos de EXP!`, 40);
    let n = each;
    while (n > 0) {
      const next = (m.lv + 1) ** 3, take = Math.min(n, next - m.xp); m.xp += take; n -= take;
      if (act) { const to = xpFrac(m), from = B.dxp, fr = Math.max(8, Math.round((to - from) * 50)); for (let f = 1; f <= fr; f++) { B.dxp = from + (to - from) * f / fr; if (f % 2 === 0) sfx.xp(B.dxp); await wait(1); } }
      if (m.xp >= next) await levelUp(m, act);
    }
  }
  if (G.bag.cable) { const half = Math.max(1, Math.floor(total / 2)); for (let i = 0; i < G.party.length; i++) { const m = G.party[i]; if (ps.includes(i) || m.hp <= 0) continue; let n = half; while (n > 0) { const next = (m.lv + 1) ** 3, take = Math.min(n, next - m.xp); m.xp += take; n -= take; if (m.xp >= next) await levelUp(m, false); } }
    if (G.party.some((m, i) => !ps.includes(i) && m.hp > 0)) await bsay('El CABLE COMPARTIDO reparte la experiencia con el resto del equipo.', 30); }
  B.part = new Set([B.pi]);
}
async function levelUp(m, act) {
  const old = [m.max, m.atk, m.def, m.spd]; m.lv++; calcStats(m); m.hp += m.max - old[0];
  if (act) { B.dxp = 0; B.dhp.pl = m.hp; B.hudFlash = 40; burst(B.ps.x, B.ps.y - 26, 20, { c: ['#f8e070', '#fff', '#58aef0'], v0: 1, v1: 3, kind: 'star', a0: Math.PI, a1: Math.PI * 2 }); }
  sfx.level();
  const now = [m.max, m.atk, m.def, m.spd], pn = { draw() { box(60, 1, 100, 56, { ac: '#f0c020' }); ['PS', 'ATAQUE', 'DEFENSA', 'VELOCIDAD'].forEach((n, i) => { txt(n, 67, 10 + i * 12); txtR('+' + (now[i] - old[i]), 138, 10 + i * 12, '#2f8244'); txtR(now[i], 154, 10 + i * 12); }); } };
  ui.push(pn); await say(`¡${monName(m)} sube al nivel ${m.lv}!`); ui.splice(ui.indexOf(pn), 1);
  for (const mv of SPECIES[m.sp].moves[m.lv] || []) await learn(m, mv);
  const ev = SPECIES[m.sp].evo; if (ev && m.lv >= ev.lv) B.evos.add(m);
}
function mvPreview(id) {
  const M = MOVES[id], ls = wrap(M.d, 138).slice(0, 3);
  return { draw() {
    box(4, 4, W - 8, 58, { ac: TYPES[M.t].c });
    txt(M.n, 11, 10); typeTag(M.t, W - 53, 9, 42);
    txt(M.k === 'estado' ? 'ESTADO' : `POT ${M.pow}`, 11, 21, '#606070'); txt(`PRE ${M.acc}`, 62, 21, '#606070');
    txtR(M.k === 'golpe' ? 'cuerpo' : M.k === 'tiro' ? 'tiro' : 'apoyo', W - 11, 21, '#909098');
    ls.forEach((l, i) => txt(l, 11, 32 + i * 9, '#303040'));
  } };
}
async function learn(m, mv) {
  if (m.moves.includes(mv)) return;
  const pv = mvPreview(mv);
  if (m.moves.length < 4) {
    m.moves.push(mv); sfx.statUp();
    ui.push(pv); await say(`¡${monName(m)} aprende ${MOVES[mv].n}!`); ui.splice(ui.indexOf(pv), 1);
    return;
  }
  ui.push(pv); await say(`¡${monName(m)} quiere aprender ${MOVES[mv].n}, pero ya tiene 4 ataques!`); ui.splice(ui.indexOf(pv), 1); dlgOff();
  const items = [...m.moves.map(id => ({ t: MOVES[id].n, r: TYPES[MOVES[id].t].n })), { t: 'NO APRENDER' }];
  const cmp = { s: 0, draw() {
    const cancel = this.s >= m.moves.length, M = MOVES[cancel ? mv : m.moves[this.s]], Mn = MOVES[mv];
    box(0, 72, W, 72, { ac: TYPES[M.t].c });
    txt(cancel ? 'NUEVO:' : 'OLVIDAR:', 8, 78, cancel ? '#2f8244' : '#b84030');
    txt(M.k === 'estado' ? 'ESTADO' : `POT ${M.pow}`, 58, 78, INK); txtR(`PRE ${M.acc}`, W - 8, 78, '#606070');
    wrap(M.d, 144).slice(0, 3).forEach((l, i) => txt(l, 8, 89 + i * 9, '#303040'));
    if (!cancel) {
      g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(6, 120, W - 12, 16);
      txt(`→ ${Mn.n}`, 9, 124, '#2458a4'); txtR(Mn.k === 'estado' ? 'ESTADO' : `POT ${Mn.pow}`, W - 9, 124, '#2f8244');
    }
  } };
  ui.push(cmp);
  const r = await menu(items, { x: 0, y: 0, w: W, lh: 12, top: 7, bot: 5, sel: 0, onMove: s => cmp.s = s });
  ui.splice(ui.indexOf(cmp), 1);
  if (r < 0 || r >= m.moves.length) { await say(`${monName(m)} se queda con los ataques que tenía.`); return; }
  const f = m.moves[r]; m.moves[r] = mv;
  await say(`${monName(m)} olvida ${MOVES[f].n}…`); sfx.statUp(); await say(`¡…y aprende ${MOVES[mv].n}!`);
}
// ── reforja (evolución) ──
async function evolve(m) {
  const from = m.sp, to = SPECIES[from].evo.to, oldN = monName(m), sc = { t: 0, k: 0, done: false, ticking: false, s: 1, draw() {
    this.t++; g.fillStyle = '#101028'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6 + this.t * .02; g.fillStyle = i & 1 ? '#1c1c48' : '#2a2260'; g.beginPath(); g.moveTo(80, 56); g.lineTo(80 + Math.cos(an) * 160, 56 + Math.sin(an) * 160); g.lineTo(80 + Math.cos(an + .26) * 160, 56 + Math.sin(an + .26) * 160); g.fill(); }
    if (!this.done) { if (this.ticking && this.t % 13 === 0) sfx.tick(Math.floor(this.k * 10)); const per = Math.max(2, Math.round(22 - this.k * 20)), alt = Math.floor(this.t / per) & 1; drawMon(alt && this.k > .05 ? to : from, 'f0', 80, 86, { white: this.k > .05, sx: this.s, sy: this.s }); if (this.t % 2 === 0) { const an = rnd(7), r = 50; part({ x: 80 + Math.cos(an) * r, y: 58 + Math.sin(an) * r, vx: -Math.cos(an) * 2.2, vy: -Math.sin(an) * 2.2, life: 20, c: pick(['#f8e070', '#fff', TYPES[SPECIES[from].t].c]), drag: 1 }); } }
    else drawMon(to, this.t % 60 < 12 ? 'f1' : 'f0', 80, 86, { sx: this.s, sy: this.s });
  } };
  ui.push(sc); music(''); await fade(0, 10);
  await say(`¿Eh? ¡${oldN} se está REFORJANDO!`, { auto: 40 }); dlgOff();
  sfx.suck(); sc.ticking = true; await tw(sc, { k: 1 }, 200, 'in'); sc.ticking = false;
  flash('#fff', 1.6); shake(5); sfx.crit(); sc.done = true; sc.s = .3; m.sp = to; const om = m.max; calcStats(m); m.hp += m.max - om; G.seen[to] = G.got[to] = 1; darAfecto(m, 12);
  burst(80, 58, 50, { c: ['#fff', '#f8e070', TYPES[SPECIES[to].t].c], v0: 1, v1: 5, kind: 'star', l0: 16, l1: 40 }); tw(sc, { s: 1 }, 30, 'elastic'); await wait(20); sfx.cry(SPECIES[to].cry);
  const f = jingle('reforja'); await say(`¡${oldN} se ha reforjado en ${SPECIES[to].n}!`, { hold: true }); await wait(f); dlg.arrow = true; await anyKey(); dlg.arrow = false;
  for (const l in SPECIES[to].moves) if (+l <= m.lv) for (const mv of SPECIES[to].moves[l]) await learn(m, mv);
  dlgOff(); ui.splice(ui.indexOf(sc), 1); await manualPage(to, { stamp: true });
}
// ── captura ──
// cable de chispa entre dos puntos: cambia de forma en cada fotograma
function rayito(x0, y0, x1, y1, col = '#f8e070') {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 6)); let px = x0, py = y0;
  for (let i = 1; i <= n; i++) {
    const q = i / n, x = x0 + (x1 - x0) * q + (i < n ? rnd(-3, 3) : 0), y = y0 + (y1 - y0) * q + (i < n ? rnd(-3, 3) : 0), st = Math.max(1, Math.round(Math.max(Math.abs(x - px), Math.abs(y - py))));
    for (let k = 0; k <= st; k++) { const xx = Math.round(px + (x - px) * k / st), yy = Math.round(py + (y - py) * k / st); g.fillStyle = col; g.fillRect(xx - 1, yy, 3, 1); g.fillRect(xx, yy - 1, 1, 3); g.fillStyle = '#ffffff'; g.fillRect(xx, yy, 1, 1); }
    px = x; py = y;
  }
}
async function throwCelda(id = 'celda') {
  const c = B.celda, s = sideOf('en'), sp = s.spr, m = B.en, tc = TYPES[SPECIES[m.sp].t].c, cc = id === 'celdaplus' ? '#f8a030' : '#58e890'; G.bag[id]--;
  await bsay(`¡${G.name} lanza una ${ITEMS[id].n}!`, 8);
  Object.assign(c, { vis: true, leds: 0, col: cc, rot: 0, oy: 0, wob: 0 }); sfx.throw();
  // 1) vuela girando, con estela, y se queda flotando sobre la criatura
  const tx = sp.x - 28, ty = s.cy - 12, suelo = sp.y - 2;
  for (let i = 0; i <= 24; i++) { const q = i / 24; c.x = 30 + (tx - 30) * q; c.y = 84 + (ty - 84) * q - Math.sin(q * Math.PI) * 24; c.rot = i >> 1; part({ x: c.x, y: c.y - 6, life: 12, c: i & 1 ? cc : '#fff', s: 3, kind: 'puff', shrink: 1 }); await wait(1); }
  c.rot = 0; for (let i = 0; i < 6; i++) { c.oy = -Math.round(Math.sin(i / 6 * Math.PI) * 3); await wait(1); } c.oy = 0;
  // 2) el escenario se apaga y un cable de chispa enchufa la celda a la criatura
  sfx.clamp(); flash('#fff', .5); shake(2); const bd = B.bd = { a: 0, c: '#101018' }; tw(bd, { a: .55 }, 12, 'out');
  const cable = { t: 0, life: 1e9, draw() { rayito(c.x, c.y, s.cx, s.cy + sp.oy * .5, cc); } }; fxs.push(cable);
  part({ x: c.x, y: c.y - 4, kind: 'ring', s: 20, life: 12, c: cc });
  for (let i = 0; i < 14; i++) { sp.white = (i & 3) < 2; if (i % 4 === 0) sfx.spark(); sp.ox = i & 1 ? 1 : -1; await wait(1); } sp.white = true; sp.ox = 0;
  // 3) la criatura se hace corriente: se estira, se afina y sube por el cable en espiral
  sfx.suck();
  for (let i = 0; i < 32; i++) {
    const k = i / 32, e = k * k; sp.sx = 1 - e * .92; sp.sy = 1 + Math.sin(k * Math.PI) * .3 - e * .92; sp.oy = -(sp.y - c.y - 6) * e; sp.ox = (c.x - sp.x) * e;
    for (let j = 0; j < 2; j++) { const an = i * .55 + j * Math.PI, r = 24 * (1 - k), px = s.cx + Math.cos(an) * r, py = s.cy + sp.oy * .6 + Math.sin(an) * r * .5; part({ x: px, y: py, vx: (c.x - px) / 9, vy: (c.y - 4 - py) / 9, life: 9, c: pick(['#fff', cc, tc]), s: 2, drag: 1 }); }
    await wait(1);
  }
  sp.vis = false; sp.oy = sp.ox = 0; sp.sx = sp.sy = 1; fxs.splice(fxs.indexOf(cable), 1);
  flash(tc, .45); sfx.lock(); part({ x: c.x, y: c.y - 4, kind: 'ring', s: 26, life: 14, c: tc }); burst(c.x, c.y - 4, 10, { c: ['#fff', tc], v0: .6, v1: 2, l0: 8, l1: 14 });
  for (let i = 0; i < 10; i++) { c.wob = Math.sin(i * 1.6) * (1 - i / 10) * 1.6; await wait(1); } c.wob = 0;
  // 4) cae a plomo y rebota levantando polvo
  const y0 = c.y, x0 = c.x; for (let i = 0; i <= 22; i++) { c.y = y0 + (suelo - y0) * EASE.bounce(i / 22); c.x = x0 + (sp.x - x0) * Math.min(1, i / 14); if (i === 8) { sfx.land(); shake(1.5); burst(c.x, suelo, 8, { w: 1, c: ['#f6e4b0', '#fff'], v0: .4, v1: 1.4, a0: Math.PI, a1: Math.PI * 2, l0: 8, l1: 16 }); } await wait(1); }
  // 5) los tres LED, uno cada dos pulsos de la música, con su latido encima
  const a = (3 * m.max - 2 * m.hp) * SPECIES[m.sp].rate * ITEMS[id].ball / (3 * m.max) * (m.status ? 1.5 : 1), p = Math.min(1, a / 255), ok = Math.random() < p, ticks = ok ? 3 : Math.min(2, Math.floor(Math.random() * 3 * (.4 + p)));
  const lat = { t: 0, life: 1e9, k: 0, draw() {
    ell(g, Math.round(c.x), suelo, 22, 5, 'rgba(248,224,112,.14)');
    if (this.k <= 0) return; g.globalAlpha = Math.min(1, this.k * 1.5); let py = 0;
    for (let dx = -12; dx <= 12; dx++) { const y = dx < -4 || dx > 5 ? 0 : [0, -2, 0, 3, -9, -9, 6, 2, 0, 0][dx + 4], a2 = Math.min(py, y), h = Math.abs(y - py) + 1; py = y; g.fillStyle = INK; g.fillRect(Math.round(c.x) + dx, c.y - 27 + a2 - 1, 1, h + 2); g.fillStyle = c.col; g.fillRect(Math.round(c.x) + dx, c.y - 27 + a2, 1, h); }
    g.globalAlpha = 1;
  } }; fxs.push(lat);
  const pb = Math.ceil(pulsos() + 1.2);
  for (let i = 0; i < ticks; i++) {
    await alPulso(pb + i * 2); c.leds = i + 1; sfx.tick(i); lat.k = 1; tw(lat, { k: 0 }, 26, 'lin');
    part({ x: c.x, y: c.y - 6, kind: 'ring', s: 14 + i * 5, life: 12, c: cc }); burst(c.x, c.y - 6, 5 + i * 2, { c: [cc, '#fff'], v0: .5, v1: 1.5 + i * .4, l0: 6, l1: 12 });
    for (let w = 0; w < 12; w++) { c.oy = -Math.round(Math.sin(w / 12 * Math.PI) * (3 + i)); c.wob = Math.sin(w * 1.2) * (1 - w / 12) * 1.4; await wait(1); } c.oy = 0; c.wob = 0;
  }
  await alPulso(pb + ticks * 2);
  if (!ok) {
    for (let w = 0; w < 12; w++) { c.wob = (w & 1 ? 1 : -1) * (1 + w / 6); if (w % 4 === 0) sfx.spark(); await wait(1); }
    fxs.splice(fxs.indexOf(lat), 1); sfx.pop(); c.vis = false; c.wob = 0; flash('#fff', .5); shake(3); tw(bd, { a: 0 }, 14, 'lin').then(() => { if (B.bd === bd) B.bd = null; });
    burst(c.x, c.y - 6, 18, { c: ['#384868', '#d8dce8', cc], v0: 1, v1: 3.5, ay: .12 }); part({ x: c.x, y: c.y - 6, kind: 'ring', s: 30, life: 14, c: '#fff' });
    sp.vis = true; sp.white = true; sp.sx = sp.sy = 0; await tw(sp, { sx: 1, sy: 1 }, 14, 'back'); sp.white = false; sp.f1 = 30; sfx.cry(SPECIES[m.sp].cry);
    await bsay(['¡Ha escupido la celda!', '¡Casi! Le quedaba Pulso de sobra.', '¡Uy! ¡Por un LED!'][ticks], 50); return false;
  }
  // 6) acoplado: los LED se ponen de oro, rayos alrededor y dos saltitos
  await wait(6); fxs.splice(fxs.indexOf(lat), 1); sfx.lock(); c.col = '#f8e070'; flash(cc, .6); shake(2);
  fx(46, k => { const cx2 = Math.round(c.x), cy2 = c.y - 6 + (c.oy || 0); for (let j = 0; j < 8; j++) { const an = k * 1.4 + j * Math.PI / 4, r0 = 9 + k * 10, r1 = Math.min(64, 12 + k * 120) * (1 - k * .35); g.fillStyle = j & 1 ? '#ffffff' : '#f8e070'; for (let r = r0; r < r1; r += 1) { if (k > .6 && (r & 1)) continue; g.fillRect(Math.round(cx2 + Math.cos(an) * r), Math.round(cy2 + Math.sin(an) * r), 1, 1); } } });
  burst(c.x, c.y - 6, 26, { c: ['#f8e070', '#fff', cc], v0: 1, v1: 3.2, kind: 'star' }); part({ x: c.x, y: c.y - 6, kind: 'ring', s: 30, life: 18, c: '#f8e070' }); part({ x: c.x, y: c.y - 6, kind: 'ring', s: 44, life: 26, c: '#fff' });
  for (let h = 0; h < 2; h++) { for (let w = 0; w < 12; w++) { c.oy = -Math.round(Math.sin(w / 12 * Math.PI) * (6 - h * 2)); await wait(1); } c.oy = 0; sfx.tick(2 + h); burst(c.x, suelo, 4, { w: 1, c: ['#f6e4b0', '#fff'], v0: .3, v1: 1, a0: Math.PI, a1: Math.PI * 2, l0: 6, l1: 12 }); }
  tw(bd, { a: 0 }, 20, 'lin').then(() => { if (B.bd === bd) B.bd = null; });
  await wait(14); const f = jingle('acople'); await say(`¡${monName(m)} se ha acoplado!`, { hold: true }); await wait(f); dlg.arrow = true; await anyKey(); dlg.arrow = false;
  const first = !G.got[m.sp]; G.seen[m.sp] = G.got[m.sp] = 1;
  if (first) { await say(`Su página se añade al MANUAL DE INSTRUCCIONES.`); dlgOff(); await manualPage(m.sp, { stamp: true }); }
  if (G.party.length < 6) G.party.push(m); else { G.box.push(m); await say(`Tu equipo está lleno. ${monName(m)} viaja por el cable hasta el TALLER de Estaño.`); }
  return true;
}
// ── menús de combate ──
async function gridMenu(items, o) {
  const m = { sel: o.sel || 0, draw() { box(o.x, o.y, o.w, o.h, o); items.forEach((t, i) => { const cx = o.x + 13 + (i % 2) * o.cw, cy = o.y + 11 + (i >> 1) * 14; txt(t, cx, cy); if (i === m.sel) txt('▶', cx - 8 + ((frame >> 4) & 1), cy); }); if (o.extra) o.extra(m.sel); } };
  ui.push(m); await wait(1); let r;
  for (;;) {
    const k = await key('up', 'down', 'left', 'right', 'a', 'b'); let n = m.sel;
    if (k === 'left' || k === 'right') n ^= 1; else if (k === 'up' || k === 'down') n ^= 2;
    else if (k === 'a') { sfx.sel(); r = m.sel; break; } else if (o.cancel) { sfx.back(); r = -1; break; }
    if (n !== m.sel && n < items.length) { m.sel = n; sfx.move(); }
  }
  ui.splice(ui.indexOf(m), 1); return r;
}
async function chooseAction() {
  let sel = B.lastSel || 0;
  for (;;) {
    dlg.on = true; dlgTop(); dlg.lines = [`¿Qué hará`, `${monName(B.pl)}?`]; dlg.shown = 99; dlg.arrow = false;
    if (B.pl.hp / B.pl.max <= .2 && !B.beeped) { sfx.low(); B.beeped = 1; }
    const r = await menu(['LUCHAR', 'EQUIPO', 'MOCHILA', 'HUIR'], { x: 100, y: H - 46, w: 60, lh: 10, top: 4, bot: 2, noCancel: true, sel, ac: '#3aa89a' }); sel = B.lastSel = r;
    if (r === 0) {
      let msel = Math.min(B.lastMv || 0, B.pl.moves.length - 1), pickMv = null;
      for (;;) {
        const mvs = B.pl.moves, info = { s: msel, draw() {
          const mv = MOVES[mvs[this.s]], x = 99, y = H - 46; box(x, y, W - x, 46, { ac: TYPES[mv.t].c });
          typeTag(mv.t, x + 6, y + 5, 50); txt('POT', x + 6, y + 16, '#606070'); txtR(mv.pow || '—', x + 55, y + 16); txt('PRE', x + 6, y + 25, '#606070'); txtR(mv.acc, x + 55, y + 25);
          const e = mv.pow ? eff(mv.t, SPECIES[B.en.sp].t) : 1;
          if (!mv.pow) txtC('ESTADO', x + 31, y + 34, '#707890');
          else if (G.seen[B.en.sp]) txtC(e > 1 ? '¡EFICAZ!' : e < 1 ? 'FLOJO' : 'NORMAL', x + 31, y + 34, e > 1 ? '#2f8244' : e < 1 ? '#a06030' : '#909098');
          if (B.mvDesc) {
            box(0, 62, W, 36, { ac: TYPES[mv.t].c });
            wrap(mv.d, 142).slice(0, 3).forEach((l, i) => txt(l, 8, 67 + i * 9, '#303040'));
            g.fillStyle = 'rgba(16,24,32,.78)'; g.fillRect(2, 51, 56, 10); txt('◀▶ ocultar', 5, 52, '#f8e070');
          } else {
            g.fillStyle = 'rgba(16,24,32,.78)'; g.fillRect(2, 86, 46, 10); txt('◀▶ datos', 5, 87, '#f8e070');
          }
        } };
        ui.push(info); dlg.on = false;
        const mi = await menu(mvs.map(m => MOVES[m].n), { x: 0, y: H - 46, w: 99, lh: 10, top: 4, bot: 2, sel: msel, keys: ['left', 'right'], onMove: v => { info.s = msel = v; } });
        ui.splice(ui.indexOf(info), 1);
        if (mi === 'left' || mi === 'right') { B.mvDesc = !B.mvDesc; sfx.move(); continue; }
        if (mi >= 0) { B.lastMv = mi; pickMv = { k: 'move', mv: mvs[mi] }; }
        break;
      }
      if (pickMv) return pickMv;
    } else if (r === 1) {
      const i = await partyScreen('pick', { msg: '¿A quién sacas?', valid: (m, i) => m.hp > 0 && i !== B.pi }); if (i >= 0) return { k: 'switch', i };
    } else if (r === 2) {
      const it = await bagScreen(true);
      if (it) { if (ITEMS[it.item].ball && !B.wild) { await say('¡Ese Makinamon ya tiene makinista!'); continue; } return { k: 'item', ...it }; }
    } else if (r === 3) { if (!B.wild) { await say('¡De un duelo no se huye!'); continue; } return { k: 'run' }; }
  }
}
// ── combate completo ──
async function runBattle(o) {
  if (!G.party.some(m => m.hp > 0)) for (const m of G.party) { m.hp = Math.max(1, Math.floor(m.max / 2)); m.status = null; }
  busy++; const prevScene = scene, tr = o.trainer || null;
  Object.assign(B, { t: 0, wild: !tr, tr, foes: tr ? tr.party : [o.wild], fi: 0, env: (tr && tr.env) || (MAPS[G.map].env === 'gym' ? 'gym:' + MAPS[G.map].type : MAPS[G.map].env) || (G.map === 'taller' ? 'taller' : G.map === 'central' ? (G.flags.luz ? 'centralLuz' : 'central') : 'hierba'), part: new Set(), evos: new Set(), lastSel: 0, lastMv: 0, beeped: 0 });
  B.en = B.foes[0]; B.pi = G.party.findIndex(m => m.hp > 0); B.pl = G.party[B.pi]; B.part.add(B.pi); B.hud.en = B.hud.pl = 0; B.es = mkSpr(118, 58); B.ps = mkSpr(38, 102); B.celda.vis = false;
  B.st = { en: { atk: 0, def: 0, spd: 0, acc: 0 }, pl: { atk: 0, def: 0, spd: 0, acc: 0 } }; B.dhp.en = B.en.hp; B.dhp.pl = B.pl.hp; B.dxp = xpFrac(B.pl);
  music(tr ? tierOf(tr).song : o.song || 'combate'); await wipeToBattle(tr);
  scene = B; parts.length = 0; scr.fadeC = '#101018'; scr.fade = 1; await fade(0, 12);
  if (!tr) {
    const s = B.es; s.vis = true; s.dark = true; s.x = -30; tw(s, { x: 118 }, 34, 'out'); await wait(34); await alPulso(8); // se descubre justo al empezar el tercer compás
    s.dark = false; s.white = true; flash('#fff', .4); await wait(4); s.white = false; s.f1 = 30; sfx.cry(SPECIES[B.en.sp].cry); s.sy = 1.15; tw(s, { sy: 1 }, 18, 'elastic'); tw(B.hud, { en: 1 }, 14, 'back');
    G.seen[B.en.sp] = G.seen[B.en.sp] || 1;
    await say(`¡Un ${monName(B.en)} salvaje sale de la hierba!`);
  } else { await say(`¡${tr.cls} ${tr.name} te desafía!`); await bsay(`${tr.name} saca a ${monName(B.en)}.`, 10); await sendOut('en'); }
  await bsay(`¡Adelante, ${monName(B.pl)}!`, 6); await sendOut('pl');
  let result = null;
  const foeFainted = async () => {
    await faint('en'); if (B.wild) music('victoria'); await gainXp();
    if (B.fi + 1 < B.foes.length) { B.fi++; B.en = B.foes[B.fi]; await bsay(`${tr.name} saca a ${monName(B.en)}.`, 10); await sendOut('en'); return false; }
    return true;
  };
  const plFainted = async () => {
    await faint('pl');
    if (!G.party.some(m => m.hp > 0)) return true;
    const i = await partyScreen('pick', { msg: '¿Quién sale ahora?', force: true, valid: m => m.hp > 0 });
    B.pi = i; B.pl = G.party[i]; B.part.add(i); await bsay(`¡Adelante, ${monName(B.pl)}!`, 6); await sendOut('pl'); return false;
  };
  while (!result) {
    const act = await chooseAction(); dlgOff();
    const TT = tr && tierOf(tr), useItem = !!(TT && (tr.items || 0) > 0 && B.en.hp > 0 && B.en.hp < B.en.max * .3 && Math.random() < .85 && act.k !== 'run');
    const emv = useItem ? '__item' : (() => { const mv = B.en.moves; if (tr && Math.random() < TT.ai) { let best = mv[0], bs = -1; for (const id of mv) { const M2 = MOVES[id], sc = (M2.pow || 25) * (M2.pow ? eff(M2.t, SPECIES[B.pl.sp].t) : 1); if (sc > bs) { bs = sc; best = id; } } return best; } return pick(mv); })();
    let plFirst = true;
    if (act.k === 'run' && o.noRun) { await bsay('¡No hay escapatoria! Te tiembla hasta la gorra.'); continue; }
    if (act.k === 'run') {
      if (B.pl.spd >= B.en.spd || Math.random() < .6) { sfx.whoosh(); await say('¡Escapas sin mirar atrás!'); result = 'run'; break; }
      await bsay('¡No puedes escapar!');
    } else if (act.k === 'switch') {
      await bsay(`¡Vuelve, ${monName(B.pl)}!`, 6); await recall('pl'); B.pi = act.i; B.pl = G.party[act.i]; B.part.add(act.i); B.beeped = 0; await bsay(`¡Adelante, ${monName(B.pl)}!`, 6); await sendOut('pl');
    } else if (act.k === 'item') {
      if (ITEMS[act.item].ball) { if (await throwCelda(act.item)) { result = 'caught'; break; } }
      else { const msg = await applyItem(act.item, act.target); if (act.target === B.pi) { burst(B.ps.x, B.ps.y - 26, 14, { c: ['#58e890', '#fff'], v0: .5, v1: 2, a0: Math.PI, a1: Math.PI * 2 }); await setHp('pl'); } await bsay(msg); }
    } else {
      const ps = B.pl.spd * stMul(B.st.pl.spd) * (B.pl.status ? .5 : 1), es = B.en.spd * stMul(B.st.en.spd) * (B.en.status ? .5 : 1);
      plFirst = ps > es || (ps === es && Math.random() < .5);
    }
    const order = act.k === 'move' ? (plFirst ? ['pl', 'en'] : ['en', 'pl']) : ['en'];
    for (const k of order) {
      if (B[k].hp <= 0) continue;
      if (k === 'en' && emv === '__item') { tr.items--; const h = tr.itemHeal || 60; await bsay(`¡${tr.name} usa ${h >= 60 ? 'una GRASA' : 'un ACEITE'} con ${monName(B.en)}!`); B.en.hp = Math.min(B.en.max, B.en.hp + h); sfx.heal(); burst(B.es.x, B.es.y - 26, 14, { c: ['#58e890', '#fff'], v0: .5, v1: 2 }); await setHp('en'); continue; }
      await doMove(k, k === 'pl' ? act.mv : emv);
      if (B.en.hp <= 0) { if (await foeFainted()) result = 'win'; break; }
      if (B.pl.hp <= 0) { if (await plFainted()) result = 'lose'; break; }
    }
    dlgOff();
  }
  // final
  if (result === 'win' && tr) { const TT = tierOf(tr); music(TT.win); await say(`¡Has vencido a ${tr.cls} ${tr.name}!`); await say(`${tr.name}: ${tr.lose}`);
    const pay = Math.max(...tr.party.map(m => m.lv)) * (tr.base || 24) * TT.pay; G.money += pay; sfx.save(); await say(`Has ganado ${fmtT(pay)}.`); }
  if (result === 'lose') { ultimaDerrota = frame; await say('Tu equipo se ha quedado sin Pulso…'); if (!(tr && tr.noBlackout)) { const lost = Math.floor(G.money / 2); G.money -= lost; if (lost) await say(`Se te caen ${fmtT(lost)} por el camino.`); } if (!(tr && tr.noBlackout)) await say(`${G.name} sale corriendo hacia el poste más cercano.`); }
  dlgOff(); await fade(1, 14); uiClear();
  if (result !== 'lose') for (const m of B.evos) if (m.hp > 0) { scr.fade = 0; await evolve(m); await fade(1, 10); }
  scene = prevScene; parts.length = 0;
  if (result === 'lose' && !(tr && tr.noBlackout)) { for (const m of G.party) { m.hp = m.max; m.status = null; } const r = G.respawn || { map: 'pueblo', x: 13, y: 38, dir: 1 }; world.load(r.map, r.x, r.y, r.dir); }
  music(MAPS[G.map].area(world.pl.y)[1]); world.grace = 5; await fade(0, 14); busy--;
  if (result === 'lose' && !(tr && tr.noBlackout)) run(() => talk('Despiertas junto al POSTE DE CARGA. Alguien te ha traído en brazos. O algo.'));
  return result;
}
