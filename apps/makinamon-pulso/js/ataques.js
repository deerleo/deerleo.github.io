'use strict';
// ───────── animaciones de ataque: una por movimiento, sacada de lo que dice que hace ─────────
// a = quien ataca, d = quien recibe (sideOf): { k, mon, spr, cx, cy }
const snd = f => S(f)();
const lerp = (p, q, k) => p + (q - p) * k;
const dirOf = a => a.k === 'pl' ? 1 : -1;            // hacia el rival: +x arriba a la derecha
const viewOf = s => s.k === 'pl' ? 'back' : 'f0';
const feet = s => s.spr.y;
function px(x, y, c, s = 1) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), s, s); }
// línea de píxeles (sin antialias)
function pl(x0, y0, x1, y1, c, w = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, o = w >> 1; let e = dx + dy, n = 0;
  g.fillStyle = c; for (;;) { g.fillRect(x0 - o, y0 - o, w, w); if ((x0 === x1 && y0 === y1) || n++ > 400) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
const path = (pts, c, w = 1, ink) => { if (ink || w >= 3) for (let i = 1; i < pts.length; i++) pl(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 'rgba(20,16,32,.85)', w + 2); for (let i = 1; i < pts.length; i++) pl(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], c, w); };
const opl = (x0, y0, x1, y1, c, w = 2) => { pl(x0, y0, x1, y1, 'rgba(20,16,32,.85)', w + 2); pl(x0, y0, x1, y1, c, w); };
function zigzag(x0, y0, x1, y1, n, amp) { const pts = [[x0, y0]]; for (let i = 1; i < n; i++) { const k = i / n, nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1, j = rnd(-amp, amp); pts.push([lerp(x0, x1, k) + nx / l * j, lerp(y0, y1, k) + ny / l * j]); } pts.push([x1, y1]); return pts; }
function zap(pts, t) { g.globalAlpha = .35; for (let i = 1; i < pts.length; i++) pl(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], '#58b8f8', 6); g.globalAlpha = 1; path(pts, t & 1 ? '#f8d030' : '#f8f080', 3); path(pts, '#ffffff', 1); }
function ring(x, y, r, c, w = 2) { const n = Math.max(16, Math.round(r * 4)); for (const [dr, col, ww] of [[0, 'rgba(20,16,32,.7)', w + 2], [0, c, w]]) for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2; px(x + Math.cos(an) * (r + dr) - (ww >> 1), y + Math.sin(an) * (r + dr) * .8 - (ww >> 1), col, ww); } }
// fantasmas del atacante (estelas de movimiento)
function ghosts(s, n = 5) { const tr = []; return () => { tr.push([s.spr.x + s.spr.ox, s.spr.y + s.spr.oy]); if (tr.length > n) tr.shift(); tr.forEach(([x, y], i) => i < tr.length - 1 && drawMon(s.mon.sp, viewOf(s), x, y, { alpha: .1 + i * .07 })); }; }
async function shakeSpr(s, n, m = 2) { for (let i = 0; i < n; i++) { s.spr.ox = (i & 1 ? -m : m); await wait(2); } s.spr.ox = 0; }
async function reposo(s) { await tw(s.spr, { ox: 0, oy: 0, sx: 1, sy: 1 }, 10, 'out'); }
const dust = (x, y, n = 8) => burst(x, y, Math.round(n * 1.4), { c: ['#f8f0d8', '#e0d4b0', '#c8b890'], v0: .4, v1: 1.6, a0: Math.PI, a1: Math.PI * 2, kind: 'puff', s: 4, shrink: 1, l0: 14, l1: 26 });
const sparks = (x, y, n = 10, c = ['#fff8c0', '#f8d030', '#ffffff']) => burst(x, y, Math.round(n * 1.5), { c, v0: 1, v1: 4, ay: .15, l0: 10, l1: 24, s: 3, shrink: 1 });
// figuras pequeñas
function nut(x, y, r, c, ph = 0) { for (let dy = -r; dy <= r; dy++) { const w = Math.round(r - Math.abs(dy) * .5); g.fillStyle = dy === -r || dy === r ? INK : c; g.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1); px(x - w - 1, y + dy, INK); px(x + w + 1, y + dy, INK); } disc(Math.round(x), Math.round(y), Math.max(1, r - 3), INK); px(x - 1 + (ph & 1), y - 2, '#ffffff'); }
function leaf(x, y, c1 = '#2f8244', c2 = '#8ed24a', fl = 0) { x = Math.round(x); y = Math.round(y); const f = fl ? 1 : 0; g.fillStyle = INK; g.fillRect(x - 4, y - 1, 6, 4); g.fillRect(x - 1, y - 3 + f, 6, 4); g.fillStyle = c1; g.fillRect(x - 3, y, 4, 2); g.fillRect(x, y - 2 + f, 4, 2); g.fillStyle = c2; g.fillRect(x - 2, y, 3, 1); g.fillRect(x + 1, y - 2 + f, 3, 1); g.fillStyle = '#e0ffc0'; g.fillRect(x + 2, y - 2 + f, 1, 1); }
function drop(x, y, c = '#5aa8f0', k = 1) { x = Math.round(x); y = Math.round(y); if (k >= 1) { g.fillStyle = INK; g.fillRect(x - 1, y - 5, 3, 2); g.fillRect(x - 3, y - 3, 7, 6); g.fillRect(x - 2, y + 3, 5, 1); g.fillStyle = c; g.fillRect(x, y - 4, 1, 2); g.fillRect(x - 2, y - 2, 5, 4); g.fillRect(x - 1, y + 2, 3, 1); px(x - 1, y - 1, '#e8f8ff', 2); return; } px(x, y - 2, c); px(x - 1, y - 1, c, 3); px(x - 1, y, c, 3); px(x, y + 1, c); px(x, y - 1, '#e8f8ff'); }

// dibujos de píxeles para los ataques: filas de texto donde cada letra es un color de la paleta ('.' = nada).
// dib(id, filas, paleta) lo crea una vez; sello(id, x, y, { k, rot, fx, a }) lo estampa centrado: k = aumento entero, rot = cuartos de vuelta, fx = espejo, a = alfa
const DIB = {};
function dib(id, filas, pal) { if (DIB[id]) return DIB[id]; const [c, x] = mk(Math.max(...filas.map(f => f.length)), filas.length); filas.forEach((f, j) => [...f].forEach((ch, i) => { if (ch !== '.' && ch !== ' ') { x.fillStyle = pal[ch] || INK; x.fillRect(i, j, 1, 1); } })); return DIB[id] = c; }
function sello(id, x, y, o = {}) {
  const im = DIB[id]; if (!im) return; const k = o.k || 1, w = im.width * k, h = im.height * k;
  g.save(); g.translate(Math.round(x), Math.round(y)); if (o.rot) g.rotate((o.rot & 3) * Math.PI / 2); if (o.fx) g.scale(-1, 1); if (o.a != null) g.globalAlpha = o.a;
  g.drawImage(im, -Math.floor(w / 2), -Math.floor(h / 2), w, h); g.restore(); g.globalAlpha = 1;
}

// cada animación dibuja lo que dice el movimiento con objetos de pixel art (dib/sello); están más abajo, agrupadas por tipo
const ANIM = {
};
// cuando falla: el ataque arranca y se tuerce
async function missAnim(a, d) { const s = dirOf(a); snd(t => noise(t, .25, .1, sfxG, { f: [800, 3000], type: 'bandpass', swell: 1 })); await tw(a.spr, { ox: s * 10, oy: -s * 4 }, 6, 'out'); tw(d.spr, { ox: -s * 10 }, 6, 'out'); fx(12, (k) => txtO('¡FALLO!', d.cx - 16, d.cy - 30 - k * 6, '#ffffff')); await wait(10); tw(d.spr, { ox: 0 }, 10, 'out'); await reposo(a); }

// el color del fondo mientras dura cada ataque
const BD = {
  topetazo: ['#3c3448', 0.55], rasguno: ['#2a2430', 0.60], chirrido: ['#3c2a48', 0.65], soplido: ['#2c4858', 0.50], aspazo: ['#2c3440', 0.60], mordisco: ['#1c1824', 0.70], abollar: ['#2a2430', 0.55], campanada: ['#3c2c10', 0.70], turbo: ['#2a1c10', 0.60],
  tostazo: ['#3c1c10', 0.60], fogonazo: ['#3c0c08', 0.75], chisquero: ['#1c1018', 0.70], llamarada: ['#4c1008', 0.78], soldadura: ['#0c1028', 0.78], colada: ['#2c0c08', 0.78],
  pitido: ['#1c3448', 0.60], chorrito: ['#0c2440', 0.60], presion: ['#1c2c3c', 0.65], goteo: ['#0c1c30', 0.70], manguerazo: ['#0c2040', 0.70], hervir: ['#3c1418', 0.65], vaporazo: ['#2c3c48', 0.65], marejada: ['#081830', 0.75],
  destello: ['#100c18', 0.78], raicilla: ['#1c1408', 0.65], enredo: ['#0c2410', 0.70], riego: ['#0c2418', 0.55], echarraiz: ['#1c1408', 0.65], hojarasca: ['#142410', 0.65], fotosintesis: ['#182808', 0.55], selva: ['#06200c', 0.75],
  calambre: ['#141428', 0.70], cortocircuito: ['#100c18', 0.78], latigazo: ['#181424', 0.70], descarga: ['#0c0c28', 0.78], altatension: ['#0c0810', 0.78], apagar: ['#000000', 0.70], rayomadre: ['#06061c', 0.78], sobrecarga: ['#141020', 0.78],
  rona: ['#2a1408', 0.60], corrosion: ['#142008', 0.70], fundir: ['#3c0c08', 0.70], chatarrazo: ['#1c1814', 0.65], herrumbre: ['#2a1408', 0.70],
  imantar: ['#141428', 0.70], tuercazo: ['#1c1c30', 0.60], desorientar: ['#201430', 0.70], agujazo: ['#141428', 0.70], magnetismo: ['#140c28', 0.75], polaridad: ['#141428', 0.70], factura: ['#1c1810', 0.65],
};
async function playAnim(id, a, d, mv) {
  const [c, al] = BD[id] || ['#000', .3]; B.bd = { c, a: 0 }; tw(B.bd, { a: al }, 8, 'out');
  if (mv && mv.pow) Object.assign(B.bd, { lin: dirOf(a), lc: lite(TYPES[mv.t].c, .5), n: mv.pow >= 80 ? 16 : mv.pow >= 55 ? 11 : 7 }); // líneas de acción: más cuanto más fuerte el ataque
  try { await ANIM[id](a, d); } finally { tw(B.bd, { a: 0 }, 10, 'in').then(() => { B.bd = null; }); }
}

// ═════════ CHAPA ═════════
// CHAPA
// ── ayudantes de CHAPA ──
// rejilla de letras para componer dibujos con formas (discos, rectángulos, fórmulas) y ponerles contorno
function chapaG(w, h) {
  const m = Array.from({ length: h }, () => Array(w).fill('.'));
  const G = {
    m, w, h,
    get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? m[y][x] : '.'; },
    set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) m[y][x] = c; return G; },
    rect(x, y, ww, hh, c) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) G.set(x + i, y + j, c); return G; },
    disc(cx, cy, r, c) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) G.set(x, y, c); return G; },
    cada(fn) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y, m[y][x]); if (c) m[y][x] = c; } return G; },
    borde(c = 'k') { const o = m.map(r => r.slice()), at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && o[y][x] !== '.'; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (o[y][x] === '.' && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) m[y][x] = c; return G; },
    filas() { return m.map(r => r.join('')); },
  };
  return G;
}
var CHAPA_M = { k: INK, w: '#ffffff', g: '#c8d0dc', d: '#8890a0', D: '#5c6070', K: '#2a2a34', y: '#f8d030', l: '#fff8c0', o: '#c09018', r: '#e84838', n: '#f8a030', p: '#f8f6e8', b: '#a8d0f0', B: '#806010' };
// texto gordo con contorno, centrado en x
function chapaTexto(s, x, y, sc, col) { const im = bigText(s, sc, col, 1), ik = bigText(s, sc, INK, 1); x = Math.round(x - im.width / 2); y = Math.round(y); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) g.drawImage(ik, x + dx, y + dy); g.drawImage(im, x, y); }
// caída con botes contra el suelo (sin estado: sale de t)
function chapaBote(y0, vy, ay, suelo, t) { for (let i = 0; i < 3; i++) { const q = vy * vy + 2 * ay * (suelo - y0), tl = q <= 0 ? 0 : (-vy + Math.sqrt(q)) / ay; if (t < tl) return y0 + vy * t + .5 * ay * t * t; t -= tl; vy = -(vy + ay * tl) * .45; y0 = suelo; } return suelo; }
// trozos que salen volando dando vueltas: [{ id, x, y, vx, vy, ay, r, vr }]
function chapaTrozos(L, vida, suelo) {
  return fx(vida, (k, t) => { if (k > .78 && (t & 1)) return; for (const p of L) { const ay = p.ay ?? .3, y = suelo != null ? chapaBote(p.y, p.vy, ay, suelo, t) : p.y + p.vy * t + .5 * ay * t * t, enSuelo = suelo != null && y >= suelo - .01; sello(p.id, p.x + p.vx * (enSuelo ? Math.min(t, 26) : t), y, { rot: Math.floor((p.r || 0) + t * (p.vr ?? .25)) }); } });
}
// tajo afilado: gordo en el centro y fino en las puntas; L = cuánto lleva abierto (0..1)
function chapaTajo(x0, y0, x1, y1, L, c, al = 1) {
  if (L <= 0 || al <= 0) return; g.globalAlpha = al; const n = 8;
  for (const paso of [0, 1, 2]) for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n; if (u0 >= L) break; const ub = Math.min(u1, L), w = 1 + Math.round(3 * Math.sin(Math.PI * (u0 + u1) / 2)); if (paso === 2 && w < 3) continue; pl(lerp(x0, x1, u0), lerp(y0, y1, u0), lerp(x0, x1, ub), lerp(y0, y1, ub), paso === 0 ? INK : paso === 1 ? c : '#ffffff', paso === 0 ? w + 2 : paso === 1 ? w : 1); }
  g.globalAlpha = 1;
}
// la zona libre del escenario junto a quien ataca (para relojes, mandos…)
function chapaHueco(a) { return [a.cx + dirOf(a) * 38, a.k === 'pl' ? a.cy - 34 : a.cy + 12]; }

// ── dibujos ──
// tornillo de lado
dib('chapa_tornillo', (() => { const G = chapaG(11, 20); G.rect(1, 1, 9, 4, 'g').rect(2, 1, 6, 1, 'w').rect(1, 4, 9, 1, 'd').set(1, 1, '.').set(9, 1, '.').rect(5, 1, 1, 2, 'D'); G.rect(4, 5, 3, 12, 'g').rect(6, 5, 1, 12, 'd').rect(4, 5, 1, 12, 'w'); for (let y = 7; y < 17; y += 3) G.rect(3, y, 5, 1, 'd').set(3, y, 'g'); G.set(5, 17, 'd'); return G.borde().filas(); })(), CHAPA_M);
// cabeza de tornillo vista de frente, con la cruz en + y en ×
for (const [id, cruz] of [['chapa_cab1', 0], ['chapa_cab2', 1]]) dib(id, (() => { const G = chapaG(13, 13); G.disc(6, 6, 5.3, 'g').cada((x, y, c) => { if (c !== 'g') return; const r = Math.hypot(x - 6, y - 6); if (r > 3.6 && x + y < 11) return 'w'; if (r > 3.6 && x + y > 13) return 'd'; }); for (let i = -3; i <= 3; i++) { if (cruz) G.set(6 + i, 6 + i, 'D').set(6 + i, 6 - i, 'D'); else G.set(6 + i, 6, 'D').set(6, 6 + i, 'D'); } return G.borde().filas(); })(), CHAPA_M);
dib('chapa_tuerca', ['..kkkkkk..', '.kwwggggk.', 'kwggggggdk', 'kgggkkggdk', 'kggk..kgdk', 'kggk..kgdk', 'kgggkkggdk', 'kggggggddk', '.kgdddddk.', '..kkkkkk..'], CHAPA_M);
dib('chapa_muelle', ['.kkkkkk.', 'kwwggggk', 'kkkkkkdk', '.kkgggdk', 'kgggkkkk', 'kwkkkkk.', 'kgggggdk', '.kkkkkdk', 'kwggggdk', 'kgkkkkk.', 'kggggggk', '.kkkkkk.'], CHAPA_M);
// estallido de cómic para el ¡CLONK!
function chapaEstrella(w, h, puntas) { const G = chapaG(w, h), cx = w / 2, cy = h / 2; return G.cada((x, y) => { const dx = (x + .5 - cx) / (cx - 2), dy = (y + .5 - cy) / (cy - 2), r = Math.hypot(dx, dy), tri = Math.abs(((Math.atan2(dy, dx) / (Math.PI * 2) * puntas + 100.25) % 1) - .5) * 2, R = .6 + .4 * tri; if (r < R - .26) return 'w'; if (r < R - .09) return 'y'; if (r < R) return 'n'; }).borde().filas(); }
dib('chapa_clonk', chapaEstrella(62, 40, 11), CHAPA_M);
dib('chapa_clonk0', chapaEstrella(32, 22, 9), CHAPA_M);
// zarpa de chapa: nudillos remachados y tres cuchillas (apunta abajo a la derecha)
dib('chapa_garra', (() => { const G = chapaG(36, 36), q = Math.SQRT1_2; for (let t = 0; t <= 1; t += .05) G.disc(lerp(9, 1, t), lerp(9, 1, t), 3.2, 'd'); for (let i = -1; i <= 1; i++) { const bx = 12 + i * 7, by = 12 - i * 7; for (let t = 0; t <= 1; t += .02) { const c = .9 * t * t; G.disc(bx + (16 * t - c) * q + c * q * -1, by + (16 * t + c) * q, 3.3 * (1 - t) ** .8 + .45, 'g'); } for (let t = 0; t <= .85; t += .02) G.disc(bx + 16 * t * q + 1.1 * (1 - t), by + 16 * t * q - 1.1 * (1 - t), 1.1 * (1 - t), 'w'); for (let t = 0; t <= .8; t += .02) G.disc(bx + 16 * t * q - 1.6 * (1 - t), by + 16 * t * q + 1.6 * (1 - t), .8 * (1 - t), 'd'); } for (let t = 0; t <= 1; t += .03) G.disc(lerp(3, 19, t), lerp(19, 3, t), 3.4, 'D'); for (let t = 0; t <= 1; t += .03) G.disc(lerp(3, 19, t) - .8, lerp(19, 3, t) - .8, 1.6, 'd'); for (let i = -1; i <= 1; i++) G.set(11 + i * 7, 11 - i * 7, 'w').set(12 + i * 7, 11 - i * 7, 'K'); return G.borde().filas(); })(), CHAPA_M);
// rizo de viento
dib('chapa_rizo', (() => { const G = chapaG(36, 22), cx = 24, cy = 10, R = 8; G.rect(6, cy + R - 1, cx - 6, 2, 'w').rect(0, cy + R - 1, 6, 1, 'w'); for (let t = 0; t <= 1; t += .004) { const an = Math.PI / 2 - t * Math.PI * 2 * 1.3, r = R * (1 - .68 * t); G.rect(Math.round(cx + Math.cos(an) * r - .5), Math.round(cy + Math.sin(an) * r - .5), 2, 2, 'w'); } G.cada((x, y, c) => c === 'w' && G.get(x, y + 1) === '.' ? 'b' : null); return G.borde().filas(); })(), CHAPA_M);
// aspas del ventilador (3 palas: con cuartos de vuelta salen pasos de 30°)
dib('chapa_aspas', (() => { const G = chapaG(32, 32); G.cada((x, y) => { const dx = x + .5 - 16, dy = y + .5 - 16; if (Math.hypot(dx, dy) < 3.6) return 'D'; for (let b = 0; b < 3; b++) { const be = b * Math.PI * 2 / 3 - Math.PI / 2, u = dx * Math.cos(be) + dy * Math.sin(be), v = -dx * Math.sin(be) + dy * Math.cos(be); if (((u - 8.6) / 6.3) ** 2 + ((v - 1) / (2.2 + u * .22)) ** 2 <= 1) return v < -1 ? 'w' : v > 2.6 ? 'd' : 'g'; } }); G.set(15, 15, 'w').set(16, 16, 'K').set(15, 16, 'K').set(16, 15, 'd'); return G.borde().filas(); })(), CHAPA_M);
// mandíbula de chapa con dientes (la de arriba; la de abajo es la misma del revés)
dib('chapa_fauces', (() => { const G = chapaG(52, 22); G.rect(1, 1, 50, 9, 'd').rect(3, 1, 46, 1, 'w').rect(1, 2, 50, 4, 'g').rect(1, 8, 50, 2, 'D').set(1, 1, '.').set(50, 1, '.'); for (let i = 0; i < 6; i++) { G.rect(5 + i * 8, 4, 2, 2, 'D').set(5 + i * 8, 4, 'w'); const c = 6 + i * 8; for (let j = 0; j < 11; j++) { const hw = 3.9 * (1 - j / 11.5); for (let x = c - 4; x < c + 4; x++) if (Math.abs(x + .5 - c) <= hw + .05) G.set(x, 10 + j, x + .5 > c + .9 ? 'g' : 'w'); } } return G.borde().filas(); })(), CHAPA_M);
// cabezal de la prensa, con su franja de peligro
dib('chapa_prensa', (() => { const G = chapaG(48, 24); G.rect(1, 1, 46, 22, 'd').rect(1, 1, 46, 4, 'g').rect(2, 1, 44, 1, 'w').rect(1, 5, 2, 9, 'g').rect(45, 2, 2, 12, 'D').rect(1, 5, 46, 1, 'D'); for (const x of [5, 22, 39]) G.rect(x, 8, 3, 3, 'D').set(x, 8, 'w'); G.cada((x, y) => y >= 14 && y <= 20 && x >= 1 && x <= 46 ? (((x + y) >> 2) & 1 ? 'y' : 'K') : null).rect(1, 13, 46, 1, 'K').rect(1, 21, 46, 2, 'D'); return G.borde().filas(); })(), CHAPA_M);
dib('chapa_nota', ['...kkkk', '...kwwk', '...kwkk', '...kwk.', '...kwk.', '.kkkwk.', 'kwwwwk.', 'kwwwwk.', '.kkkk..'], { k: INK, w: '#f8e070' });
dib('chapa_nota2', ['...kkkk', '...kwwk', '...kwkk', '...kwk.', '...kwk.', '.kkkwk.', 'kwwwwk.', 'kwwwwk.', '.kkkk..'], { k: INK, w: '#ffffff' });
// campana: recta y ladeada (la otra ladeada es su espejo)
for (const [id, sh] of [['chapa_campana', 0], ['chapa_campanaL', .3]]) dib(id, (() => { const G = chapaG(60, 34), cx = 30, RW = r => r < 7 ? 2 + Math.round(Math.sqrt(Math.max(0, 1 - ((7 - r) / 7) ** 2)) * 8) : r < 21 ? 10 + Math.round((r - 7) * .2) : 13 + Math.round((r - 20) * 1.05);
  const fila = (y, x0, n, c) => G.rect(x0 + Math.round((y - 2) * sh), y, n, 1, c);
  fila(1, cx - 2, 4, 'o'); fila(2, cx - 3, 6, 'o'); fila(3, cx - 2, 4, 'o'); fila(2, cx - 1, 2, 'K');
  for (let r = 0; r < 28; r++) { const w = RW(r), y = r + 4; fila(y, cx - w, w * 2, r === 27 ? 'o' : r === 19 || r === 20 ? 'o' : 'y'); if (r < 27) { fila(y, cx + w - 4, 4, 'o'); if (r > 1) fila(y, cx - w + 2, r > 22 ? 3 : 2, 'l'); if (r > 3 && r < 19) fila(y, cx - w + 5, 1, 'l'); } if (r < 2) fila(y, cx - w + 1, w, 'l'); if (r === 22) fila(y, cx - w, w * 2 - 4, 'l'); }
  return G.borde().filas(); })(), CHAPA_M);
dib('chapa_badajo', ['..kkkkk..', '.kBBBBBk.', 'kByBBBBBk', 'kBBBBBBBk', 'kBBBBBBBk', '.kBBBBBk.', '..kkkkk..'], CHAPA_M);
// despertador (la esfera; las agujas se pintan encima)
dib('chapa_esfera', (() => { const G = chapaG(28, 31), cx = 14, cy = 17; G.disc(6, 5, 3.2, 'y').disc(21, 5, 3.2, 'y').set(5, 3, 'l').set(20, 3, 'l').rect(13, 2, 2, 3, 'o').rect(4, 27, 3, 3, 'o').rect(21, 27, 3, 3, 'o'); G.cada((x, y) => { const r = Math.hypot(x + .5 - cx, y + .5 - cy); if (r < 10.3) return 'p'; if (r < 12.6) return x + y < 26 ? 'l' : x + y > 36 ? 'o' : 'y'; }); for (let i = 0; i < 12; i++) { const q = i * Math.PI / 6, x = Math.floor(cx + Math.cos(q) * 8.4), y = Math.floor(cy + Math.sin(q) * 8.4); G.set(x, y, 'k'); if (i % 3 === 0) G.set(x - Math.round(Math.cos(q)), y - Math.round(Math.sin(q)), 'k'); } return G.borde().filas(); })(), CHAPA_M);
// cuentarrevoluciones
dib('chapa_taco', (() => { const G = chapaG(32, 32), c = 16; G.cada((x, y) => { const dx = x + .5 - c, dy = y + .5 - c, r = Math.hypot(dx, dy); let q = Math.atan2(dy, dx); if (q < Math.PI * .5) q += Math.PI * 2; const u = (q - Math.PI * .75) / (Math.PI * 1.5); if (r < 11.6) { if (r > 8.4 && u > .72 && u <= 1.02) return 'r'; return 'K'; } if (r < 14.2) return x + y < 30 ? 'w' : x + y > 38 ? 'd' : 'g'; }); for (let i = 0; i <= 8; i++) { const q = Math.PI * (.75 + i * 1.5 / 8); for (const rr of [8.6, 10]) G.set(Math.floor(c + Math.cos(q) * rr), Math.floor(c + Math.sin(q) * rr), i >= 6 ? 'l' : 'w'); } return G.borde().filas(); })(), CHAPA_M);
// tubo de escape (la boca mira a la izquierda) y sus llamas
dib('chapa_escape', (() => { const G = chapaG(18, 11); G.rect(1, 2, 16, 7, 'g').rect(1, 2, 16, 1, 'w').rect(1, 6, 16, 3, 'd').rect(1, 8, 16, 1, 'D').rect(1, 1, 4, 9, 'g').rect(1, 1, 4, 1, 'w').rect(1, 8, 4, 2, 'd').rect(1, 3, 2, 5, 'K').rect(11, 2, 2, 7, 'D').rect(15, 2, 2, 7, 'D'); return G.borde().filas(); })(), CHAPA_M);
function chapaLlama(len, ph, H) { const G = chapaG(len + 3, 19), cy = 9.5, prof = (u, h) => u < 0 || u > 1 ? -1 : h * Math.sin(Math.PI * Math.min(1, u * .92 + .1)) ** .65 * (1 - u * .3) * (1 + .2 * Math.sin(u * 11 + ph)); return G.cada((x, y) => { const u = (len + 1 - x) / len, dy = Math.abs(y + .5 - cy - Math.sin(u * 6 + ph) * 1.6 * u); if (u < .42 && dy < prof(u / .42, H * .26)) return 'w'; if (u < .62 && dy < prof(u / .62, H * .52)) return 'l'; if (u < .82 && dy < prof(u / .82, H * .78)) return 'n'; if (dy < prof(u, H)) return 'r'; }).borde('f').filas(); }
[['chapa_llamaA', 22, 0, 5.4], ['chapa_llamaB', 24, 2.3, 5.8], ['chapa_llamaC', 34, .7, 7.6], ['chapa_llamaD', 37, 3.1, 8]].forEach(([id, len, ph, H]) => dib(id, chapaLlama(len, ph, H), Object.assign({ f: '#5a1410' }, CHAPA_M)));

Object.assign(ANIM, {
  async topetazo(a, d) { // embiste con toda la carcasa y suena a chapa abollada
    const s = dirOf(a), vx = d.spr.x - a.spr.x, vy = d.spr.y - a.spr.y, L = Math.hypot(vx, vy), ux = vx / L, uy = vy / L, hx = lerp(a.cx, d.cx, .8), hy = lerp(a.cy, d.cy, .8) - 4;
    snd(t => { noise(t + .12, .22, .14, sfxG, { f: [300, 3000], type: 'bandpass', q: 1.2, swell: 1 }); osc('p50', [90, 50], t + .32, .2, .2, sfxG); osc('p50', [620, 210], t + .32, .14, .12, sfxG); osc('p25', [1240, 700], t + .33, .08, .06, sfxG); noise(t + .32, .1, .2, sfxG, { f: 2400 }); });
    // coge carrerilla: se agacha hacia atrás y levanta polvo con los pies
    for (let i = 0; i < 4; i++) part({ x: a.spr.x - s * (6 + i * 5), y: feet(a) - 2, vx: -s * rnd(.4, 1.2), vy: -rnd(.2, .7), life: 16 + i * 3, c: pick(['#f8f0d8', '#e0d4b0']), s: 4, kind: 'puff', shrink: 1 });
    await tw(a.spr, { ox: -s * 10, oy: s * 4, sx: 1.2, sy: .8 }, 11, 'out');
    // embestida con estela
    const gh = ghosts(a, 6);
    fx(8, (k, t) => { gh(); const x = a.cx + a.spr.ox, y = a.cy + a.spr.oy; for (let i = 0; i < 6; i++) { const o = (i - 2.5) * 9, l0 = 22 + (i % 3) * 5, l1 = l0 + 14 + (i * 7) % 16 + t * 3, bx = x - uy * o, by = y + ux * o; opl(bx - ux * l1, by - uy * l1, bx - ux * l0, by - uy * l0, i & 1 ? '#ffffff' : '#f8e8a0', i % 3 === 0 ? 3 : 2); } });
    await tw(a.spr, { ox: vx * .6, oy: vy * .6, sx: .88, sy: 1.14 }, 7, 'in');
    // ¡clonk!
    shake(6); flash('#fff', .35); d.spr.sx = .78; d.spr.sy = 1.16; tw(d.spr, { sx: 1, sy: 1 }, 14, 'elastic');
    dust(hx, feet(d) - 3, 12);
    chapaTrozos([{ id: 'chapa_tornillo', x: hx, y: hy, vx: s * 1.7, vy: -3.6, vr: .3 }, { id: 'chapa_tuerca', x: hx, y: hy, vx: -s * 1.5, vy: -3, vr: -.22 }, { id: 'chapa_muelle', x: hx, y: hy - 4, vx: s * .4, vy: -4.3, vr: .18 }, { id: 'chapa_tuerca', x: hx, y: hy, vx: s * 2.6, vy: -2.2, vr: .3 }], 30, Math.max(feet(a), feet(d)) - 4);
    fx(24, (k, t) => { if (k > .75 && (t & 1)) return; const jx = t < 8 ? (t & 1 ? 1 : -1) : 0, y = hy - 6 - Math.round(EASE.out(k) * 5); if (t < 2) return sello('chapa_clonk0', hx, y); sello('chapa_clonk', hx + jx, y, {}); const lb = '¡CLONK!', w = tw_(lb); txt(lb, Math.round(hx + jx - w / 2), y - 4, '#c02818'); txt(lb, Math.round(hx + jx - w / 2) + 1, y - 4, '#c02818'); });
    await tw(a.spr, { ox: vx * .42, oy: vy * .42, sx: 1.1, sy: .92 }, 5, 'out'); await wait(4);
    await tw(a.spr, { ox: 0, oy: 0, sx: 1, sy: 1 }, 12, 'io');
  },
  async rasguno(a, d) { // una zarpa de chapa araña la pintura: dos pasadas en aspa
    const s = dirOf(a), pc = TYPES[SPECIES[d.mon.sp].t].c, vir = 'chapa_viruta_' + pc, esc = 'chapa_escama_' + pc, hechos = [];
    dib(vir, ['.kkkk..', 'kaabbk.', 'kbkkabk', '.k..kbk', '...kbbk', '...kkk.'], { k: INK, a: lite(pc, .45), b: pc });
    dib(esc, ['.kkk.', 'kaabk', 'kbbck', '.kkk.'], { k: INK, a: lite(pc, .45), b: pc, c: dark(pc, .3) });
    const tajos = (m, L, al = 1) => { for (let i = 0; i < 3; i++) { const ox = (i - 1) * 9, oy = -(i - 1) * 7; chapaTajo(d.cx + m * (-14 + ox), d.cy - 18 + oy, d.cx + m * (14 + ox), d.cy + 14 + oy, L, i === 1 ? '#fff4c0' : '#e8ecf4', al); } };
    const garra = (m, L, dx = 0) => sello('chapa_garra', d.cx + m * (-19 + 28 * L + dx), d.cy - 23 + 32 * L + dx, { fx: m < 0 });
    await tw(a.spr, { ox: -s * 5, sy: .9, sx: 1.08 }, 6, 'out'); tw(a.spr, { ox: s * 6, sy: 1.04, sx: .96 }, 8, 'out');
    for (const m of [1, -1]) {
      // la zarpa asoma, se levanta y brilla
      await fx(m > 0 ? 9 : 5, (k, t) => { hechos.forEach(h => tajos(h, 1)); garra(m, 0, -4 * EASE.out(k)); if (t > 2 && (t & 2)) { const x = Math.round(d.cx + m * -30), y = Math.round(d.cy - 36); g.fillStyle = '#ffffff'; g.fillRect(x - 4, y, 9, 1); g.fillRect(x, y - 4, 1, 9); g.fillRect(x - 1, y - 1, 3, 3); } });
      snd(t => { noise(t, .12, .2, sfxG, { f: [7000, 2000], type: 'bandpass', q: 3 }); osc('saw', [1800, 900], t, .08, .05, sfxG); osc('saw', [2600, 1500], t + .03, .06, .03, sfxG); });
      fx(7, k => { const L = Math.min(1, k * 1.5); hechos.forEach(h => tajos(h, 1)); tajos(m, L); garra(m, k * 1.5); });
      await wait(2);
      shake(m > 0 ? 4 : 3); d.spr.sx = .88; d.spr.sy = 1.06; tw(d.spr, { sx: 1, sy: 1 }, 8, 'elastic');
      chapaTrozos(Array.from({ length: 7 }, (_, i) => ({ id: i % 3 ? vir : esc, x: d.cx + m * (i - 3) * 4, y: d.cy - 6 + (i - 3) * 4, vx: m * rnd(.3, 2.2) * (i & 1 ? 1 : -.6), vy: -rnd(1.6, 3.6), ay: .26, r: i, vr: i & 1 ? .3 : -.24 })), 30, feet(d) - 2);
      await wait(5); hechos.push(m); await fx(4, () => hechos.forEach(h => tajos(h, 1)));
    }
    reposo(a); await fx(16, k => hechos.forEach(h => tajos(h, 1, 1 - k)));
  },
  async chirrido(a, d) { // un chirrido que afloja los tornillos del rival
    const an = Math.atan2(d.cy - a.cy, d.cx - a.cx), nx = -Math.sin(an), ny = Math.cos(an), suelo = feet(d) - 5;
    snd(t => { for (let i = 0; i < 8; i++) osc('saw', [2600 + (i & 1) * 700, 1900 + (i & 1) * 500], t + i * .07, .07, .07, sfxG); });
    const T = [[-14, -13], [13, -15], [-12, 8], [14, 5]].map(([x, y], i) => ({ x, y, vx: (x < 0 ? -1 : 1) * (.7 + i * .2), vy: -2.6 - (i % 2) * .8, t0: i * 4, vr: x < 0 ? -.3 : .3 }));
    const cabezas = (sal, t) => T.forEach((c, i) => sello(((t >> 2) + i) & 1 ? 'chapa_cab1' : 'chapa_cab2', d.cx + c.x + Math.sign(c.x) * sal, d.cy + c.y - sal * .4));
    const onda = (q, col) => { const cx = lerp(a.cx, d.cx, q), cy = lerp(a.cy, d.cy, q), r = 9 + q * 22, pts = []; for (let i = -7; i <= 7; i++) { const u = i / 7 * .95, rr = r + (i & 1 ? 4 : -3); pts.push([cx + Math.cos(an + u) * rr - Math.cos(an) * r, cy + Math.sin(an + u) * rr - Math.sin(an) * r]); } path(pts, col, 3); };
    await fx(40, (k, t) => { a.spr.ox = (t & 1) ? 1 : -1; a.spr.sx = 1 + Math.sin(t * 1.3) * .06;
      for (let j = 0; j < 4; j++) { const q = t / 22 - j * .25; if (q > 0 && q < 1.5) onda(q % 1, j & 1 ? '#f8e070' : '#ffffff'); }
      [...'ÑIIIC'].forEach((ch, i) => { const q = k * 1.7 - i * .14; if (q > .04 && q < .96) chapaTexto(ch, lerp(a.cx, d.cx, q) + nx * 20 * (a.k === 'pl' ? -1 : 1), lerp(a.cy, d.cy, q) + ny * 20 * (a.k === 'pl' ? -1 : 1) - 6 + ((t + i) & 2 ? -2 : 1), 2, i & 1 ? '#f8e070' : '#ffffff'); });
      if (k > .4) { const kk = (k - .4) / .6; d.spr.ox = (t & 2) ? 1 : -1; cabezas(kk * 5, t); } });
    a.spr.ox = 0; a.spr.sx = 1;
    // los tornillos saltan y caen rebotando
    snd(t => { for (let i = 0; i < 5; i++) osc('p50', [1800 - i * 120, 1200], t + i * .08, .06, .1, sfxG); });
    await fx(38, (k, t) => { if (k > .85 && (t & 1)) return; d.spr.ox = t < 18 ? ((t & 2) ? 2 : -2) : 0; d.spr.sy = 1 - Math.min(.1, t * .01); d.spr.sx = 1 + Math.min(.06, t * .006);
      T.forEach((c, i) => { const u = t - c.t0, x0 = d.cx + c.x + Math.sign(c.x) * 5, y0 = d.cy + c.y - 2; if (u < 0) return sello((t + i) & 1 ? 'chapa_cab1' : 'chapa_cab2', x0, y0); const y = chapaBote(y0, c.vy, .42, suelo, u), q = y >= suelo - .01 && u > 12; sello('chapa_tornillo', x0 + c.vx * Math.min(u, 24), y, { rot: q ? 1 : Math.floor(u * c.vr) }); }); });
    d.spr.ox = 0; await tw(d.spr, { sx: 1, sy: 1 }, 8, 'back');
  },
  async soplido(a, d) { // coge aire y le sopla un vendaval a la cara
    const s = dirOf(a), an = Math.atan2(d.cy - a.cy, d.cx - a.cx), ux = Math.cos(an), uy = Math.sin(an), x0 = a.cx + s * 16, y0 = a.cy - 4, x1 = d.cx + s * 16, y1 = d.cy - 8;
    await tw(a.spr, { sx: 1.16, sy: 1.12, ox: -s * 5 }, 10, 'out');
    snd(t => noise(t, .8, .18, sfxG, { f: [500, 2500], type: 'bandpass', q: .8, swell: 1 })); tw(a.spr, { sx: .9, sy: .95, ox: s * 5 }, 5, 'out');
    const hojas = [0, 1, 2].map(i => ({ t0: 6 + i * 9, o: (i - 1) * 12, ph: i * 2 }));
    await fx(46, (k, t) => {
      for (let j = 0; j < 4; j++) { const q = t / 18 - j * .3; if (q < 0 || q > 2.2) continue; const u = q % 1.1; if (u > 1) continue; const o = [-13, 9, -3, 15][j], x = lerp(x0, x1, u) + Math.sin(u * 6 + j) * 2, y = lerp(y0, y1, u) + o * (.5 + u * .5);
        for (let i = 0; i < 2; i++) { const l0 = 20 + i * 12, l1 = l0 + 16 - i * 6, oo = (i ? 5 : -4); opl(x - ux * l1, y - uy * l1 + oo, x - ux * l0, y - uy * l0 + oo, i ? '#c8e8f8' : '#ffffff', 2); }
        sello('chapa_rizo', x, y, { fx: s < 0 }); }
      for (const h of hojas) { const u = (t - h.t0) / 20; if (u > 0 && u < 1.15) leaf(lerp(x0, x1, u) + h.o * .4, lerp(y0, y1, u) + h.o + Math.sin(u * 9 + h.ph) * 5, '#2f8244', '#8ed24a', (t >> 2) & 1); }
      if (t % 2 === 0) { const u = rnd(.1, .8); part({ x: lerp(x0, x1, u), y: lerp(y0, y1, u) + rnd(-14, 14), vx: ux * 3.4, vy: uy * 3.4, life: 12, c: pick(['#f8f0d8', '#e0d4b0', '#ffffff']), s: 3, kind: 'puff', shrink: 1 }); }
      if (k > .28) { const kk = Math.min(1, (k - .28) * 4); d.spr.ox = s * Math.round(kk * 7) + ((t & 2) ? 1 : 0); d.spr.sx = 1 - kk * .14; d.spr.sy = 1 + kk * .05; if (t % 3 === 0) part({ x: d.cx + rnd(-10, 10), y: d.cy - 8 + rnd(-10, 8), vx: ux * rnd(1, 2.4), vy: uy * rnd(1, 2.4) - .3, life: 16, c: pick(['#e8dcc0', '#d0c4a0']), s: 5, kind: 'puff', shrink: 1 }); } });
    // polvareda en los ojos
    for (let i = 0; i < 9; i++) part({ x: d.cx + rnd(-12, 12), y: d.cy - 8 + rnd(-8, 8), vx: ux * rnd(.4, 1.6) + rnd(-.5, .5), vy: rnd(-1, .2), life: 20 + i, c: pick(['#f8f0d8', '#e0d4b0', '#c8b890']), s: 6, kind: 'puff', shrink: 1 });
    reposo(a); await tw(d.spr, { ox: 0, sx: 1, sy: 1 }, 12, 'elastic');
  },
  async aspazo(a, d) { // pone las aspas a tercera velocidad y se las pasa por encima
    const s = dirOf(a), vx = d.spr.x - a.spr.x, vy = d.spr.y - a.spr.y, [gx, gy] = chapaHueco(a), ROT = [0, 3, 2, 1];
    const P = { x: a.cx + s * 14, y: a.cy - 2, a: 1 }, giro = t => t < 10 ? t / 4 : t < 20 ? 2.5 + (t - 10) / 2 : 7.5 + (t - 20);
    const cortes = [];
    const f = fx(70, (k, t) => { const x = P.x + (t < 34 ? a.spr.ox : 0), y = P.y + (t < 34 ? a.spr.oy : 0), p = Math.floor(giro(t)), v = t < 10 ? 0 : t < 20 ? 1 : 2;
      if (t < 4) { g.globalAlpha = .8; disc(Math.round(x), Math.round(y), 4 + t * 4, '#ffffff'); g.globalAlpha = 1; }
      if (v === 2) { g.globalAlpha = .28 * P.a; disc(Math.round(x), Math.round(y), 15, '#e8f4ff'); g.globalAlpha = 1; sello('chapa_aspas', x, y, { rot: ROT[(p + 2) & 3], a: .4 * P.a }); for (let i = 0; i < 3; i++) { const q = t * .9 + i * 2.1; pl(x + Math.cos(q) * 13, y + Math.sin(q) * 13, x + Math.cos(q + .5) * 16, y + Math.sin(q + .5) * 16, '#ffffff', 2); } }
      sello('chapa_aspas', x, y, { rot: ROT[p & 3], a: (v === 2 ? .85 : 1) * P.a });
      for (const c of cortes) { const u = (t - c.t) / 7; if (u >= 0 && u < 1) chapaTajo(c.x - c.dx, c.y - c.dy, c.x + c.dx, c.y + c.dy, Math.min(1, u * 2.5), '#ffffff', u > .6 ? 1 - (u - .6) * 2.5 : 1); }
      if (t < 36) { // el mando de velocidades
        const x0 = gx - 18, y0 = gy - 8; g.fillStyle = INK; g.fillRect(x0, y0, 37, 17); g.fillStyle = '#5c6070'; g.fillRect(x0 + 1, y0 + 1, 35, 15); g.fillStyle = '#8890a0'; g.fillRect(x0 + 1, y0 + 1, 35, 1);
        for (let i = 0; i < 3; i++) { const on = i === v, bx = x0 + 3 + i * 11, by = y0 + 3 + (on ? 1 : 0); g.fillStyle = INK; g.fillRect(bx, by, 9, 11); g.fillStyle = on ? ((t & 2) || i < 2 ? '#f8e070' : '#ffffff') : '#c8d0dc'; g.fillRect(bx + 1, by + 1, 7, 9 - (on ? 0 : 1)); if (!on) { g.fillStyle = '#8890a0'; g.fillRect(bx + 1, by + 9, 7, 1); } txt(String(i + 1), bx + 2, by + 2, on ? '#c02818' : INK); } } });
    for (let i = 0; i < 3; i++) snd(t => osc('p25', [200 + i * 150, 500 + i * 200], t + i * .167, .17, .06, sfxG)); snd(t => noise(t + .33, .5, .08, sfxG, { f: [900, 2600], type: 'bandpass', q: 1, swell: 1 }));
    await wait(20); await tw(a.spr, { ox: -s * 7, oy: s * 2, sx: 1.08, sy: .94 }, 8, 'out');
    tw(a.spr, { ox: vx * .34, oy: vy * .34, sx: .94, sy: 1.06 }, 6, 'in'); await wait(6); P.x += a.spr.ox; P.y += a.spr.oy;
    await tw(P, { x: d.cx - s * 13, y: d.cy + 4 }, 4, 'in');
    for (let i = 0; i < 3; i++) {
      snd(t => { noise(t, .07, .22, sfxG, { f: 3000 }); osc('saw', [1500 - i * 150, 700], t, .06, .05, sfxG); });
      shake(i === 2 ? 5 : 4); sparks(d.cx - s * 6, d.cy + 2, 7, ['#ffffff', '#c8d0dc', '#f8e070']);
      const q = [-.9, .5, -.2][i]; cortes.push({ t: 38 + i * 6, x: d.cx + (i - 1) * 5, y: d.cy + (1 - i) * 4, dx: Math.cos(q) * 22, dy: Math.sin(q) * 22 });
      d.spr.sx = i & 1 ? 1.1 : .88; d.spr.sy = i & 1 ? .92 : 1.08; P.x = d.cx - s * (13 - i * 5) ; P.y = d.cy + 4 - i * 3; await wait(6);
    }
    tw(d.spr, { sx: 1, sy: 1 }, 10, 'elastic'); tw(P, { x: a.cx + s * 14, y: a.cy - 2, a: 0 }, 12, 'out'); await reposo(a); await f;
  },
  async mordisco(a, d) { // dos mandíbulas de chapa se cierran sobre el rival
    const o = { ab: 14, a: 0 }, s = dirOf(a), by = d.cy + (d.k === 'pl' ? -10 : 4);
    snd(t => { noise(t, .28, .08, sfxG, { f: [400, 2000], type: 'bandpass', swell: 1 }); osc('p50', [1400, 200], t + .3, .1, .2, sfxG); noise(t + .3, .1, .25, sfxG, { f: 3000 }); osc('p50', [1100, 260], t + .5, .07, .12, sfxG); noise(t + .5, .06, .16, sfxG, { f: 3400 }); });
    let fin = false; const f = fx(200, (k, t) => { if (fin) return; const tr = o.tr ? ((t & 1) ? 1 : -1) : 0, ab = Math.round(o.ab);
      sello('chapa_fauces', d.cx + tr, by - 7 - ab, { a: o.a }); sello('chapa_fauces', d.cx + 4 - tr, by + 7 + ab, { rot: 2, fx: 1, a: o.a });
      if (o.tr && (t & 2)) { const x = d.cx - 18, y = by + 3 - ab; g.fillStyle = '#ffffff'; g.fillRect(x - 5, y, 11, 1); g.fillRect(x, y - 5, 1, 11); g.fillRect(x - 1, y - 1, 3, 3); } });
    tw(a.spr, { ox: s * 6, sy: .94 }, 8, 'out');
    await tw(o, { ab: 22, a: 1 }, 8, 'back'); o.tr = 1; await wait(6); o.tr = 0;
    await tw(o, { ab: 0 }, 4, 'in');
    shake(6); flash('#fff', .3); sparks(d.cx, d.cy, 14); d.spr.sy = .76; d.spr.sx = 1.14;
    chapaTrozos([{ id: 'chapa_tuerca', x: d.cx - 10, y: d.cy, vx: -1.8, vy: -3, vr: -.3 }, { id: 'chapa_tornillo', x: d.cx + 10, y: d.cy, vx: 1.9, vy: -3.4, vr: .3 }], 28, feet(d) - 4);
    await wait(5); await tw(o, { ab: 8 }, 4, 'out'); d.spr.sy = .9; d.spr.sx = 1.06; await tw(o, { ab: 0 }, 3, 'in');
    shake(3); sparks(d.cx, d.cy, 8); d.spr.sy = .72; d.spr.sx = 1.16; await wait(5);
    reposo(a); tw(d.spr, { sx: 1, sy: 1 }, 14, 'elastic'); await tw(o, { ab: 24, a: 0 }, 9, 'out'); fin = true;
  },
  async abollar(a, d) { // una prensa lo deja hecho un acordeón
    const suelo = feet(d), alto = suelo - 24, P = { y: -34, tr: 0 }, x = d.cx; let fin = false;
    snd(t => { osc('p25', [1200, 300], t, .34, .05, sfxG); osc('sin', [160, 50], t + .37, .3, .3, sfxG); noise(t + .37, .25, .3, sfxG, { f: [2500, 200], type: 'lowpass' }); osc('p50', [300, 120], t + .37, .12, .12, sfxG); });
    fx(200, (k, t) => { if (fin) return; const y = Math.round(P.y) + (P.tr && (t & 1) ? 1 : 0), top = y - 23;
      const kk = clamp((P.y + 34) / (alto + 34), 0, 1); g.globalAlpha = .4; ell(g, Math.round(x), suelo, Math.round(10 + kk * 18), 3, INK); g.globalAlpha = 1;
      if (top > -6) { g.fillStyle = INK; g.fillRect(x - 8, -6, 16, top + 7); g.fillStyle = '#8890a0'; g.fillRect(x - 7, -6, 14, top + 7); g.fillStyle = '#c8d0dc'; g.fillRect(x - 5, -6, 3, top + 7); g.fillStyle = '#5c6070'; g.fillRect(x + 4, -6, 3, top + 7); for (let yy = top - 5; yy > -6; yy -= 14) { g.fillStyle = INK; g.fillRect(x - 9, yy - 1, 18, 5); g.fillStyle = '#c8d0dc'; g.fillRect(x - 8, yy, 16, 3); g.fillStyle = '#8890a0'; g.fillRect(x - 8, yy + 2, 16, 1); } }
      sello('chapa_prensa', x, y - 12); });
    await tw(P, { y: Math.max(suelo - 56, 17) }, 12, 'out'); P.tr = 1;
    for (let i = 0; i < 3; i++) { for (const m of [-1, 1]) part({ x: x + m * 10, y: P.y - 26, vx: m * rnd(.8, 1.6), vy: -rnd(.2, .8), life: 14, c: '#ffffff', s: 4, kind: 'puff', shrink: 1 }); await wait(3); }
    P.tr = 0; await tw(P, { y: alto }, 4, 'in');
    shake(7); flash('#fff', .35); d.spr.sy = .42; d.spr.sx = 1.42; dust(x - 14, suelo - 2, 8); dust(x + 14, suelo - 2, 8);
    for (const m of [-1, 1]) for (let i = 0; i < 3; i++) part({ x: x + m * 22, y: alto + 4, vx: m * (1.5 + i), vy: -.4 * i, life: 16, c: '#f8f0d8', s: 5, kind: 'puff', shrink: 1, drag: .9 });
    await wait(4); await tw(P, { y: alto - 5 }, 3, 'out'); d.spr.sy = .5; await tw(P, { y: alto + 1 }, 2, 'in'); shake(3); d.spr.sy = .4; d.spr.sx = 1.46; await wait(5);
    tw(P, { y: -40 }, 13, 'in').then(() => { fin = true; });
    // se despliega resoplando como un acordeón
    const notas = [], SY = [1.14, .6, 1.08, .78, 1], SX = [.9, 1.28, .95, 1.12, 1];
    fx(40, (k, t) => { for (const n of notas) { const u = t - n.t; if (u < 22 && !(u > 16 && (u & 1))) sello(n.id, n.x + Math.sin(u * .4 + n.t) * 3 + n.vx * u, n.y - u * 1.1); } });
    let T = 0; for (let i = 0; i < 5; i++) { snd(t => { osc('p25', [330, 392, 494, 392, 523][i], t, .09, .06, sfxG); osc('saw', [165, 196, 247, 196, 262][i], t, .09, .03, sfxG); }); notas.push({ id: i & 1 ? 'chapa_nota2' : 'chapa_nota', t: T, x: d.cx + (i & 1 ? 20 : -22), y: d.cy - 4 - (i % 3) * 5, vx: i & 1 ? .5 : -.5 }); await tw(d.spr, { sy: SY[i], sx: SX[i] }, 5, 'io'); T += 5; }
    await wait(8);
  },
  async campanada(a, d) { // el despertador da las doce y cae una campana. En la cabeza.
    const [gx, gy] = chapaHueco(a), x = d.cx, b = { y: -40, sw: 0 }, posa = d.cy - 18, ondas = [], cy = gy + 2; let fin = false, T = 0;
    snd(t => { for (let i = 0; i < 7; i++) osc('p25', i & 1 ? 900 : 1300, t + i * .045, .02, .05, sfxG); for (let i = 0; i < 6; i++) osc('p50', i & 1 ? 2100 : 1700, t + .3 + i * .03, .03, .05, sfxG); });
    // las agujas corren a las doce y el despertador salta
    await fx(24, (k, t) => { const kk = Math.min(1, k / .72), al = k > .72, jx = al ? ((t & 1) ? 1 : -1) : 0, jy = al ? -2 : 0; sello('chapa_esfera', gx + jx, cy - 2 + jy);
      const h = -Math.PI / 2 - (1 - kk) * 2.4, m = -Math.PI / 2 - (1 - kk) * 12.57, X = gx + jx, Y = cy + jy; pl(X, Y, X + Math.cos(h) * 5, Y + Math.sin(h) * 5, INK, 2); pl(X, Y, X + Math.cos(m) * 8, Y + Math.sin(m) * 8, '#e84848', 1); px(X, Y, INK, 1);
      if (al) { for (const sgn of [-1, 1]) { opl(X + sgn * 15, Y - 12, X + sgn * 19, Y - 15, '#f8e070', 1); opl(X + sgn * 17, Y - 6, X + sgn * 22, Y - 7, '#f8e070', 1); } chapaTexto('¡LAS 12!', X - 37, Y - 6, 1, (t & 2) ? '#f8e070' : '#ffffff'); } });
    fx(200, (k, t) => { if (fin) return; T = t; const y = Math.round(b.y), sw = Math.abs(b.sw) > .34 ? Math.sign(b.sw) : 0;
      for (const o of ondas) { const u = (t - o.t) / 20; if (u >= 0 && u < 1) { const r = 8 + u * 44; if (!(u > .7 && (t & 1))) { ring(x, d.cy - 6, r, o.i & 1 ? '#ffffff' : '#f8e070', 2); if (r > 16) ring(x, d.cy - 6, r - 9, '#fff8c0', 1); } } }
      sello('chapa_badajo', x + sw * 4 - Math.round(b.sw * 3), y + 17); sello(sw ? 'chapa_campanaL' : 'chapa_campana', x, y, { fx: sw < 0 }); });
    await tw(b, { y: posa }, 9, 'in');
    for (let i = 0; i < 3; i++) {
      snd(t => { [523, 1046, 1568, 2093].forEach((fq, j) => osc('sin', fq * (1 - i * .03), t, 1.1, .12 / (j + 1), sfxG, { sus: .5, gate: .2 })); });
      shake(i ? 3 : 6); if (!i) flash('#f8e070', .35); ondas.push({ t: T + 1, i }); tw(b, { sw: i & 1 ? -1 : 1 }, 7, 'out');
      d.spr.sy = i ? .86 : .74; d.spr.sx = i ? 1.06 : 1.14; tw(d.spr, { sy: 1, sx: 1 }, 10, 'elastic');
      const tx = x + (d.k === 'pl' ? 44 : -42), ty = (d.k === 'pl' ? d.cy - 42 : d.cy + 2) + (i ? 6 : 0); fx(14, (k, t) => { if (k > .7 && (t & 1)) return; chapaTexto('¡DONG!', tx, ty - Math.round(EASE.out(k) * 5), i ? 1 : 2, i & 1 ? '#ffffff' : '#f8e070'); });
      if (!i) burst(x, d.cy - 14, 8, { c: ['#fff8c0', '#f8d030', '#ffffff'], v0: 1.5, v1: 3.2, kind: 'star', l0: 12, l1: 20 });
      await wait(13);
    }
    tw(b, { sw: 0 }, 5, 'out'); await tw(b, { y: -44 }, 10, 'in'); fin = true;
  },
  async turbo(a, d) { // se revoluciona: escape en llamas y la aguja en lo rojo
    const s = dirOf(a), [gx, gy] = chapaHueco(a); snd(t => { osc('saw', [70, 420], t, .9, .1, sfxG, { sus: 1 }); noise(t, .9, .14, sfxG, { f: [200, 3000], type: 'bandpass', swell: 1 }); osc('p25', [140, 840], t, .9, .04, sfxG, { sus: 1 }); });
    const linea = (i, t, al) => { const y = 5 + (i * 29) % 94, sp = 7 + (i % 3) * 4, len = 22 + (i % 3) * 14, h = i % 3 === 0 ? 4 : 2, u = (t * sp + i * 53) % 240, x = Math.round(s > 0 ? W + 20 - u : u - 60); g.globalAlpha = al; g.fillStyle = i & 1 ? '#fff0c0' : '#ffffff'; g.fillRect(x, y, len, h); g.fillRect(s > 0 ? x + len : x - (len >> 1), y + (h >> 1), len >> 1, 1); g.globalAlpha = 1; };
    await fx(58, (k, t) => { const q = Math.min(1, k * 1.4), max = k > .68;
      for (let i = 0; i < 10; i++) linea(i, t, .5 + q * .4);
      a.spr.ox = Math.round(Math.sin(t * 2.2) * 1.5) + s * Math.round(q * 14); a.spr.oy = max ? -(t & 1) : 0; a.spr.sx = 1 + q * .05 + (max ? Math.sin(t * 1.9) * .03 : 0); a.spr.sy = 1 - q * .05;
      const ex = a.spr.x + a.spr.ox - s * 15, ey = a.cy + 12 + ((t & 1) && q > .4 ? 1 : 0);
      if (q > .12) { const id = max ? ((t >> 1) & 1 ? 'chapa_llamaC' : 'chapa_llamaD') : ((t >> 1) & 1 ? 'chapa_llamaA' : 'chapa_llamaB'); sello(id, ex - s * (7 + DIB[id].width / 2), ey, { fx: s < 0 }); }
      sello('chapa_escape', ex, ey, { fx: s < 0 });
      if (t % 3 === 0) part({ x: ex - s * (16 + q * 16), y: ey - 2, vx: -s * rnd(.6, 1.6), vy: -rnd(.3, 1), life: 22, c: pick(['#8890a0', '#5c6070', '#c8d0dc']), s: 5, kind: 'puff' });
      if (max && t % 4 === 0) part({ x: ex - s * 12, y: ey, vx: -s * rnd(2, 4), vy: rnd(-1.4, 1.4), ay: .1, life: 12, c: pick(['#fff0a0', '#f8a030']), s: 3, shrink: 1 });
      // cuentarrevoluciones
      const jx = max ? ((t & 1) ? 1 : -1) : 0; sello('chapa_taco', gx + jx, gy); const na = Math.PI * (.75 + q * 1.5) + (max ? Math.sin(t * 2.4) * .12 : 0), X = gx + jx, Y = gy; pl(X, Y, X + Math.cos(na) * 9, Y + Math.sin(na) * 9, '#ff6050', 2); px(X + Math.cos(na) * 9, Y + Math.sin(na) * 9, '#ffffff'); disc(X, Y, 2, '#c8d0dc'); px(X, Y, INK);
      if (max) chapaTexto('¡MAX!', X - 31, Y - 6, 1, (t >> 2) & 1 ? '#f8e070' : '#ff6050'); });
    // sale disparado y vuelve a su sitio
    const gh = ghosts(a, 5); fx(14, () => gh());
    for (let i = 0; i < 6; i++) part({ x: a.spr.x - s * 18, y: a.cy + 10 + rnd(-6, 6), vx: -s * rnd(1, 3), vy: -rnd(0, 1), life: 18 + i * 2, c: pick(['#c8d0dc', '#8890a0', '#f8a030']), s: 6, kind: 'puff', shrink: 1 });
    a.spr.oy = 0; await tw(a.spr, { ox: s * 18, sx: 1.12, sy: .92 }, 4, 'out'); await tw(a.spr, { ox: 0, oy: 0, sx: 1, sy: 1 }, 10, 'back');
  },
});

// ═════════ BRASA ═════════
// BRASA
// ── fuego dibujado: llamas con silueta de llama en 3 tonos (rojo, naranja, amarillo-blanco) y contorno ──
const BRASA_C = ['#d82818', '#f88028', '#f8d040', '#fff8d0'];
const BRASA_CAPAS = [[INK, 1, 1], [BRASA_C[0], 1, 0], [BRASA_C[1], .64, 0], [BRASA_C[2], .38, 0], [BRASA_C[3], .15, 0]];
const brasaFr = v => v - Math.floor(v);
// llamas de pie: L = [[x, yBase, medioAncho, alto, fase], …]; se pintan por capas para que se fundan entre sí
function brasaLlamas(L, t) {
  const perfil = u => u < .3 ? .7 + .3 * Math.sin(u / .3 * Math.PI / 2) : Math.pow(Math.max(0, 1 - (u - .3) / .7), .8);
  for (const [c, f, ex] of BRASA_CAPAS) { g.fillStyle = c;
    for (const [x0, y0, w, h0, ph = 0] of L) { const h = h0 * (1 + .1 * Math.sin(t * .8 + ph * 3)); if (h < 3 || w < 1.5) continue;
      const hh = Math.round(h * (f < 1 ? f * 1.1 : 1)) + ex, x = Math.round(x0), y = Math.round(y0);
      for (let r = -ex; r <= hh; r++) { const u = clamp(r / hh, 0, 1), half = Math.round(w * f * perfil(u)) + ex, v = r / h, sway = Math.round(Math.sin(t * .45 + ph + v * 3.2) * v * v * w * .6);
        if (half < 1 && f < .3) continue; g.fillRect(x - half + sway, y - r, half * 2 + 1, 1); } } }
}
// chorro de fuego de (x0,y0) a (x1,y1): se ensancha de r0 a r1, con lenguas en los bordes; head/tail (0..1) = hasta dónde llega / desde dónde se apaga
function brasaChorro(x0, y0, x1, y1, r0, r1, head, tail, t, amp = 6, n = 5) {
  const N = Math.max(1, Math.abs(Math.round(x1 - x0))), sg = x1 < x0 ? -1 : 1, xr = Math.round(x0); if (head <= tail) return;
  BRASA_CAPAS.forEach(([c, f, ex], li) => { g.fillStyle = c; const hd = head - Math.max(0, li - 1) * .035 + ex * 1.5 / N, tl = tail - ex * 1.5 / N;
    for (let i = -1; i <= N + 12; i++) { const q = i / N; if (q > hd || q < tl) continue;
      const th = lerp(r0, r1, clamp(q, 0, 1)) * f * Math.sqrt(clamp((hd - q) / .18, 0, 1)) * (tail > 0 ? clamp((q - tl) / .15, 0, 1) : 1); if (th < .5) continue;
      const cy = lerp(y0, y1, q) + Math.sin(q * 6 - t * .5) * (1 + q * 3), la = amp * f * clamp(q * 3, .2, 1) * clamp((hd - q) / .1, 0, 1);
      const up = th + la * (1 - brasaFr(q * n - t * .13)), dn = th + la * .6 * (1 - brasaFr(q * n * 1.37 - t * .1 + .5));
      g.fillRect(xr + sg * i, Math.round(cy - up) - ex, 1, Math.round(up + dn) + ex * 2); } });
}
// estrella de impacto
function brasaPum(x, y, r, c = '#fff8d0', c2 = '#f88028') { for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4 + .39, L = i & 1 ? r : r * .62; opl(x + Math.cos(an) * r * .3, y + Math.sin(an) * r * .3, x + Math.cos(an) * L, y + Math.sin(an) * L, i & 1 ? c : c2, 2); } }
// gira un dibujo (vecino más cercano) para sacar fotogramas inclinados
function brasaGira(filas, grados) {
  const h = filas.length, w = filas[0].length, n = Math.ceil(Math.hypot(w, h)) + 2, c = Math.cos(grados * Math.PI / 180), sn = Math.sin(grados * Math.PI / 180), out = [];
  for (let Y = 0; Y < n; Y++) { let r = ''; for (let X = 0; X < n; X++) { const dx = X - n / 2 + .5, dy = Y - n / 2 + .5, sx = Math.floor(dx * c + dy * sn + w / 2), sy = Math.floor(-dx * sn + dy * c + h / 2); r += (filas[sy] && filas[sy][sx]) || '.'; } out.push(r); }
  return out;
}
const brasaR = (ch, n) => ch.repeat(n);

// ── dibujos ──
{
  // rebanada de pan al rojo
  const tostada = ['..kkkk..kkkk..', '.kcccckkcccck.', 'kcoooooooooock', 'kcoyyyyyyyyock', 'kcrrrrrrrrrrck', '.koywwyyyyyok.', '.koywyyyyyyok.', '.krrrrrrrrrrk.', '.koyyyyyyyyok.', '.koyyyyyyyyok.', '.krrrrrrrrrrk.', '.kooooooooook.', '.kcccccccccck.', '..kkkkkkkkkk..'];
  dib('brasa_tostada', tostada, { k: INK, c: '#a85420', r: '#e04818', o: '#f88028', y: '#f8c848', w: '#fff8d0' });
  dib('brasa_tostada2', tostada, { k: INK, c: '#c86828', r: '#f87030', o: '#f8b038', y: '#fff0a0', w: '#ffffff' });
  dib('brasa_tostada_e', tostada, { k: '#f86028', c: '#f86028', r: '#f86028', o: '#f8a038', y: '#f8a038', w: '#f8a038' });
  // tostada de canto (para la voltereta)
  dib('brasa_tostada_c', ['.kkkk.', 'kcrrck', 'kcrock', 'kcrock', 'kcroyk', 'kcroyk', 'kcroyk', 'kcroyk', 'kcroyk', 'kcrock', 'kcrock', 'kcrock', 'kcrrck', '.kkkk.'], { k: INK, c: '#8a4418', r: '#d83818', o: '#f88028', y: '#fff0a0' });

  // horno: cerrado (frío / a punto) y abierto con la puerta abatida
  const K22 = brasaR('k', 22), M = 'k' + brasaR('m', 20) + 'k', V = 'kmk', panel = ['.' + brasaR('k', 20) + '.', 'k' + brasaR('l', 20) + 'k', 'kmkmmkmmkmmmmmmmrrmyymk', M, K22].map(f => f.slice(0, 22));
  panel[2] = 'kmkkmkkmkkmmmmmrrmyymk';
  const cerrado = [...panel, M, 'km' + brasaR('h', 18) + 'mk', M, V + brasaR('k', 16) + V, V + brasaR('v', 16) + V, V + 'vvvuuvvvvvvuuvvv' + V, V + 'vvuuuuvvvvuuuuvv' + V, V + 'vuuuuuuvvuuuuuuv' + V, V + 'uuuuuuuuuuuuuuuu' + V, V + brasaR('k', 16) + V, M, K22, '.kk' + brasaR('.', 16) + 'kk.', brasaR('.', 22), brasaR('.', 22)];
  const hueco = 'kk' + 'y' + brasaR('w', 16) + 'y' + 'kk';
  const abierto = [...panel, 'kk' + brasaR('o', 18) + 'kk', 'kk' + brasaR('y', 18) + 'kk', hueco, hueco, hueco, hueco, hueco, hueco, 'kk' + brasaR('y', 18) + 'kk', 'kk' + brasaR('o', 18) + 'kk', K22, 'k' + brasaR('h', 20) + 'k', M, 'kmm' + brasaR('d', 16) + 'mmk', K22];
  const ph = { k: INK, m: '#5c6070', l: '#c8d0dc', h: '#c8d0dc', d: '#3c3c48', r: '#e84838', y: '#f8d040', o: '#f88028', w: '#fff8d0' };
  dib('brasa_horno', cerrado, { ...ph, v: '#48181c', u: '#c84018' });
  dib('brasa_horno_hot', cerrado, { ...ph, v: '#f88028', u: '#fff8d0', m: '#786068' });
  dib('brasa_horno_ab', abierto, ph);

  // mechero: capuchón de chapa, rueda dentada (2 fotogramas) y depósito rojo
  const dep = 'krh' + brasaR('r', 7) + 'dk..', mech = w => ['..kkkkkk......', '.klsssssk.kkk.', '.klkskskk' + w[0] + 'k.', '.klkskskg' + w[1] + 'k', '.klkskskk' + w[2] + 'k.', '.klsssssk.kkk.', 'kkkkkkkkkkkk..', dep, dep, dep, 'krh' + brasaR('r', 4) + 'wwrdk..', 'krh' + brasaR('r', 4) + 'wwrdk..', dep, dep, dep, dep, 'kr' + brasaR('r', 7) + 'ddk..', 'k' + brasaR('d', 10) + 'k..', 'kkkkkkkkkkkk..'];
  const pm = { k: INK, s: '#a8b0c0', l: '#f0f4f8', r: '#e03828', h: '#f88878', d: '#981c20', w: '#f8d040', g: '#5c6070', G: '#e0e4ec' };
  dib('brasa_mechero', mech(['GgG', 'GkGg', 'gGg']), pm);
  dib('brasa_mechero2', mech(['gGg', 'gkgG', 'GgG']), pm);
  // la llamita: con ojos, que para eso salta
  const pl2 = { k: INK, r: '#d82818', o: '#f88028', y: '#f8d040', w: '#fff8d0' };
  dib('brasa_llamita', ['....kk....', '...krrk...', '...krork..', '..kroork..', '.kroooork.', '.kroyyork.', 'kroyyyyork', 'kroykykork', 'kroykykork', 'kroywwyork', '.kroyyork.', '..kkkkkk..'], pl2);
  dib('brasa_llamita2', ['.....kk...', '....krrk..', '..kkrork..', '..kroork..', '.kroooork.', '.kroyyork.', 'kroyyyyork', 'kroykykork', 'kroykykork', 'kroywwyork', '.kroyyork.', '..kkkkkk..'], pl2);
  dib('brasa_llamita3', ['..........', '..........', '..........', '..........', '..........', '...kkkk...', '.kkrrrrkk.', 'krroooorrk', 'kroyyyyork', 'kroykykork', 'kroywwyork', '.kkkkkkkk.'], pl2);

  // careta de soldar (ventanilla apagada / reflejando el arco)
  const careta = ['....kkkkkkkk....', '..kkllllllllkk..', '.kllmmmmmmmmddk.', '.klmmmmmmmmmmdk.', 'klmmmmmmmmmmmmdk', 'klmkkkkkkkkkkmdk', 'klmkbbcbbbbbkmdk', 'klmkbcbbbbbbkmdk', 'klmkbbbbbbbbkmdk', 'klmkkkkkkkkkkmdk', 'klmmmmmmmmmmmmdk', 'klmmmmmmmmmmmmdk', '.kmmkmmmmmmkmdk.', '.kdmmmmmmmmmmdk.', '..kddmmmmmmddk..', '...kkkkkkkkkk...'];
  dib('brasa_careta', careta, { k: INK, m: '#5c6070', l: '#8890a0', d: '#3c3c48', b: '#182848', c: '#58b8f8' });
  dib('brasa_careta2', careta, { k: INK, m: '#7888a8', l: '#c8e0f8', d: '#3c3c48', b: '#c8f0ff', c: '#ffffff' });
  // destello del arco (2 fotogramas)
  dib('brasa_arco', ['....w....', '....w....', '..b.w.b..', '...bwb...', 'wwwwwwwww', '...bwb...', '..b.w.b..', '....w....', '....w....'], { w: '#ffffff', b: '#9cd8ff' });
  dib('brasa_arco2', ['w.......w', '.w..b..w.', '..w.w.w..', '...www...', '.bwwwwwb.', '...www...', '..w.w.w..', '.w..b..w.', 'w.......w'], { w: '#ffffff', b: '#9cd8ff' });
  // escama del cordón de soldadura, de blanco vivo a hierro frío
  const esc = ['.dcc..', 'dcccc.', 'dchccc', 'dchhcc', 'dchhcc', 'dchhcc', 'dchccc', 'dcccc.', '.dcc..'];
  dib('brasa_cordon_k', ['..kkkk..', '.kkkkkk.', ...Array(7).fill('kkkkkkkk'), '.kkkkkk.', '..kkkk..'], { k: INK });
  [['#ffffff', '#ffffff', '#fff8d0'], ['#f8d040', '#fff8d0', '#f88028'], ['#f88028', '#f8d040', '#d82818'], ['#d82818', '#f88028', '#981c20'], ['#a04838', '#c87050', '#703030'], ['#787080', '#a8a0b0', '#504858']].forEach(([c, h, d], i) => dib('brasa_cordon' + i, esc, { c, h, d }));

  // crisol con pico (a la izquierda), derecho y volcado
  const F = f => f.padEnd(24, '.'), cu = n => '.'.repeat(n) + 'kl' + brasaR('m', 34 - n * 2 - 10) + 'ddk';
  const crisol = ['.......' + brasaR('k', 12), '.....kkyyywwwwyyyyykk', '..kkkyywwwwwyyyyyyoookk', 'kkyyyyyyyyyyyyyyyoooookk', 'kooy' + brasaR('k', 20), '.kkk' + brasaR('h', 18) + 'dk', '...' + brasaR('k', 21),
    '....kl' + brasaR('m', 14) + 'ddk', '....kl' + brasaR('m', 14) + 'ddk', '....klmmmmmkppkmmmmmddk', '.....klmmmmkppkmmmmddk', '.....kl' + brasaR('m', 12) + 'ddk', '.....k' + brasaR('h', 14) + 'dk', '......kl' + brasaR('m', 10) + 'ddk', '......klmmrrrrrrmmddk', '.......klrrooorrrmdk', '.......' + brasaR('k', 13)].map(F);
  const pc = { k: INK, m: '#6c6478', l: '#a8a0b8', d: '#3c3450', h: '#a8a0b8', p: '#c8d0dc', y: '#f8d040', w: '#fff8d0', o: '#f88028', r: '#c84828' };
  dib('brasa_crisol0', crisol, pc); dib('brasa_crisol1', brasaGira(crisol, -24), pc); dib('brasa_crisol2', brasaGira(crisol, -50), pc);
}

Object.assign(ANIM, {
  async tostazo(a, d) { // la palanca baja, ¡clac!, y la rebanada sale al rojo dando volteretas y echando humo
    const s = dirOf(a), p = { x: a.cx, y: a.cy - 4, on: 0, a: 1 }, tr = []; let hit = 0;
    snd(t => { osc('p50', [300, 900], t + .2, .12, .12, sfxG); noise(t + .2, .06, .2, sfxG, { f: 3500 }); noise(t + .68, .2, .2, sfxG, { f: [2000, 600], type: 'lowpass' }); osc('p50', [180, 60], t + .68, .14, .16, sfxG); });
    await tw(a.spr, { sy: .78, sx: 1.14 }, 8, 'out'); await shakeSpr(a, 2, 1);
    tw(a.spr, { sy: 1.16, sx: .9 }, 3, 'out').then(() => tw(a.spr, { sx: 1, sy: 1 }, 12, 'elastic'));
    p.on = 1; dust(a.cx, a.cy - 10, 5);
    fx(90, (k, t) => { if (!p.on) return; const x = p.x, y = p.y;
      tr.push([x, y]); if (tr.length > 6) tr.shift();
      if (!hit) tr.forEach(([tx, ty], i) => i < tr.length - 1 && i % 2 === 0 && sello('brasa_tostada_e', tx, ty, { k: 2, rot: (t >> 2) - 1, a: .14 + i * .08 }));
      sello(t & 2 ? 'brasa_tostada' : 'brasa_tostada2', x, y, { k: 2, rot: t >> 2, a: p.a });
      const [hx, hy] = tr[0];
      if (t % 3 === 0) part({ x: hx + rnd(-3, 3), y: hy - 8 + rnd(-3, 3), vy: -rnd(.3, .7), vx: -s * .2, life: 24, c: pick(['#6c6470', '#989098', '#c8c0c8']), s: hit ? 3 : 5, kind: 'puff', shrink: 1 });
      if (t % 3 === 1 && !hit) part({ x: x + rnd(-10, 10), y: y + rnd(-10, 10), vy: rnd(.2, .8), life: 10, c: pick(['#f8d040', '#f88028']), s: 2, shrink: 1 }); });
    const top = Math.max(20, a.cy - 38);
    tw(p, { x: a.cx + s * 10 }, 10, 'out'); await tw(p, { y: top }, 10, 'out'); await wait(4);
    tw(p, { x: d.cx - s * 6 }, 12, 'lin'); await tw(p, { y: d.cy }, 12, 'in');
    hit = 1; burst(d.cx, d.cy, 16, { c: ['#a85420', '#e8b060', '#f8d040', '#f88028'], v0: .8, v1: 2.8, ay: .16, s: 3, shrink: 1, l0: 14, l1: 26 }); flash('#f88028', .35); d.spr.tint = '#f08030';
    fx(7, k => brasaPum(d.cx - s * 4, d.cy, 12 + k * 14));
    for (let i = 0; i < 5; i++) part({ x: d.cx + rnd(-10, 10), y: d.cy + rnd(-8, 6), vy: -rnd(.4, .9), life: 28, c: pick(['#6c6470', '#989098']), s: 6, kind: 'puff', shrink: 1 });
    // la tostada rebota hacia arriba y se pierde
    tw(p, { x: d.cx - s * 28 }, 16, 'out'); await tw(p, { y: Math.max(14, d.cy - 34) }, 12, 'out'); await tw(p, { a: 0 }, 4, 'lin'); p.on = 0;
  },

  async fogonazo(a, d) { // el horno tiembla al rojo, la puerta cae de golpe y sale una bocanada ancha
    const s = dirOf(a), o = { y: -14, al: 0, hot: 0, open: 0, head: 0, tail: 0, jx: 0, on: 1 }, hx = a.cx + s * 20, hy = a.cy + (s > 0 ? -8 : 4);
    const fx0 = hx + s * 4, fy0 = hy + 1, fx1 = d.cx + s * 4, fy1 = d.cy + 2;
    snd(t => { for (let i = 0; i < 4; i++) osc('p25', 140 + i * 30, t + .13 + i * .05, .04, .06, sfxG); osc('p50', [200, 120], t + .36, .12, .18, sfxG); noise(t + .4, .7, .3, sfxG, { f: [300, 5000], type: 'bandpass', q: .7 }); osc('saw', [60, 40], t + .4, .6, .12, sfxG, { sus: 1 }); });
    fx(200, (k, t) => { if (!o.on) return;
      sello(o.open ? 'brasa_horno_ab' : o.hot && (t & 2) ? 'brasa_horno_hot' : 'brasa_horno', hx + o.jx, hy + o.y, { k: 2, a: o.al });
      if (o.hot && !o.open && t % 3 === 0) part({ x: hx + rnd(-18, 18), y: hy - 20, vy: -rnd(.4, .9), life: 14, c: '#989098', s: 3, kind: 'puff', shrink: 1 });
      if (o.head > 0) { brasaChorro(fx0, fy0, fx1, fy1, 9, 23, o.head, o.tail, t, 8, 4);
        if (o.head > .95 && o.tail < .5) brasaLlamas([[d.cx - 16, feet(d), 6, 24, 0], [d.cx + 15, feet(d), 6, 28, 2], [d.cx, feet(d) + 1, 7, 18, 4]], t); } });
    tw(o, { al: 1 }, 5, 'out'); await tw(o, { y: 0 }, 8, 'bounce'); dust(hx, hy + 18, 6);
    o.hot = 1; for (let i = 0; i < 6; i++) { o.jx = i & 1 ? -1 : 1; await wait(2); } o.jx = 0;
    o.open = 1; shake(2); flash('#f8a030', .5); sparks(hx, hy + 14, 6, ['#fff8d0', '#f8d040', '#f88028']); a.spr.sx = 1.1; tw(a.spr, { sx: 1 }, 10, 'elastic');
    await tw(o, { head: 1 }, 8, 'lin');
    d.spr.tint = '#e86020'; shake(5); flash('#fff0a0', .45);
    for (let i = 0; i < 8; i++) { if (i % 2 === 0) part({ x: d.cx + rnd(-16, 16), y: d.cy - 14 + rnd(-6, 6), vy: -rnd(.6, 1.2), vx: s * rnd(.2, .8), life: 22, c: pick(['#48404c', '#6c6470']), s: 6, kind: 'puff', shrink: 1 }); await wait(2); }
    await tw(o, { tail: 1.1 }, 10, 'in');
    for (let i = 0; i < 6; i++) part({ x: d.cx + rnd(-14, 14), y: d.cy + rnd(-10, 10), vy: -rnd(.5, 1.1), life: 24, c: pick(['#48404c', '#6c6470', '#989098']), s: 6, kind: 'puff', shrink: 1 });
    o.open = 0; o.hot = 0; await tw(o, { al: 0, y: 4 }, 8, 'in'); o.on = 0;
  },

  async chisquero(a, d) { // rasca la rueda dos veces, a la tercera prende; la llamita mira al rival y salta
    const s = dirOf(a), lx = a.cx + s * 24, ly0 = clamp(a.cy - 6, 30, 74), o = { y: 14, al: 0, w: 0, on: 1 }, L = { x: lx - 5, y: 0, on: 0, k: 1, sq: 0 }, F = { v: 0 };
    const chk = ok => snd(t => { noise(t, .07, .25, sfxG, { f: 4000 }); osc('p12', 3000, t, .02, .08, sfxG); if (ok) osc('tri', [500, 800], t + .03, .2, .07, sfxG); });
    fx(200, (k, t) => { if (o.on) sello(o.w && (t & 1) ? 'brasa_mechero2' : 'brasa_mechero', lx, ly0 + o.y, { k: 2, a: o.al });
      if (L.on === 1) sello(L.sq ? 'brasa_llamita3' : (t >> 2) & 1 ? 'brasa_llamita' : 'brasa_llamita2', L.x, L.y - 6 * L.k, { k: L.k, fx: s < 0 });
      if (L.on === 2) { sello((t >> 1) & 1 ? 'brasa_llamita' : 'brasa_llamita2', L.x, L.y - 12, { k: 2, fx: s < 0 }); if (t & 1) part({ x: L.x + rnd(-5, 5), y: L.y - 6 + rnd(-4, 4), vy: .3, life: 12, c: pick(['#f8d040', '#f88028', '#fff8d0']), s: 2, shrink: 1 }); }
      if (F.v > 0) brasaLlamas([[d.cx - 14, feet(d), 6, 22 * F.v, 1], [d.cx + 14, feet(d), 6, 26 * F.v, 3], [d.cx, d.cy - 6, 8, 34 * F.v, 0], [d.cx - 4, feet(d) + 1, 5, 16 * F.v, 5]], t); });
    tw(o, { al: 1 }, 4, 'out'); await tw(o, { y: 0 }, 6, 'back');
    const top = ly0 - 19;
    for (let i = 0; i < 3; i++) { chk(i === 2); o.w = 1; o.y = 2; sparks(lx + 6, top + 4, i === 2 ? 9 : 5, ['#ffffff', '#fff8d0', '#f8d040']); fx(4, k => brasaPum(lx + 5, top + 2, 6 + k * 6, '#ffffff', '#f8d040')); await wait(4); o.w = 0; o.y = 0; await wait(i === 2 ? 0 : 3); }
    // prende: primero pequeñita, luego se estira y mira al rival
    L.y = top + 1; L.on = 1; L.k = 1; await wait(3); L.k = 2; await wait(6);
    L.sq = 1; await wait(3); L.sq = 0; L.on = 2; snd(t => osc('tri', [600, 1100], t, .3, .08, sfxG));
    tw(o, { y: 20, al: 0 }, 12, 'in').then(() => { o.on = 0; });
    const x0 = L.x, y0 = L.y, x1 = d.cx, y1 = d.cy + 8;
    await fx(16, k => { L.x = lerp(x0, x1, k); L.y = lerp(y0, y1, k) - Math.sin(k * Math.PI) * 16; });
    L.on = 0; burst(d.cx, d.cy, 14, { c: ['#fff8d0', '#f8d040', '#f88028', '#d82818'], v0: .8, v1: 2.6, a0: Math.PI, a1: Math.PI * 2, ay: .1, s: 3, shrink: 1, l0: 12, l1: 24 }); flash('#f88028', .35); d.spr.tint = '#f08030';
    snd(t => noise(t, .4, .2, sfxG, { f: [400, 2000], type: 'bandpass' })); fx(6, k => brasaPum(d.cx, d.cy, 10 + k * 14));
    F.v = .5; await tw(F, { v: 1 }, 5, 'out'); await wait(7); await tw(F, { v: 0 }, 9, 'in');
    for (let i = 0; i < 4; i++) part({ x: d.cx + rnd(-12, 12), y: d.cy + rnd(-12, 4), vy: -rnd(.4, .9), life: 22, c: pick(['#6c6470', '#989098']), s: 5, kind: 'puff', shrink: 1 });
  },

  async llamarada(a, d) { // toma aire, y una lengua de fuego gruesa cruza el campo y envuelve al rival
    const s = dirOf(a), o = { boca: 0, head: 0, tail: 0, env: 0 }, mx = () => a.cx + a.spr.ox + s * 14, my = () => a.cy + a.spr.oy - (s > 0 ? 12 : 4);
    snd(t => { noise(t, .25, .1, sfxG, { f: [3000, 500], type: 'bandpass', q: 1 }); noise(t + .25, 1, .3, sfxG, { f: [200, 2500], type: 'bandpass', q: .6, swell: 1 }); osc('saw', [70, 50], t + .25, .9, .14, sfxG, { sus: 1 }); });
    fx(200, (k, t) => {
      if (o.boca > 0 && o.head <= 0) brasaLlamas([[mx(), my() + 6, 5 * o.boca, 16 * o.boca, 0], [mx() - 5, my() + 7, 3 * o.boca, 9 * o.boca, 2], [mx() + 5, my() + 7, 3 * o.boca, 10 * o.boca, 4]], t);
      if (o.env > 0) { const e = o.env, fy = feet(d); brasaLlamas([[d.cx - 24, fy - 4, 7, 40 * e, 0], [d.cx + 24, fy - 4, 7, 44 * e, 2.5], [d.cx - 13, fy - 12, 8, 50 * e, 1.2], [d.cx + 13, fy - 12, 8, 46 * e, 3.6]], t); }
      if (o.head > 0) brasaChorro(mx(), my(), d.cx + s * 8, d.cy + 2, 6, 15, o.head, o.tail, t, 9, 6);
      if (o.env > 0) { const e = o.env, fy = feet(d); brasaLlamas([[d.cx - 19, fy + 2, 7, 30 * e, 5], [d.cx + 18, fy + 2, 7, 27 * e, 0.7], [d.cx - 7, fy + 3, 6, 18 * e, 2], [d.cx + 6, fy + 3, 6, 21 * e, 4.2]], t);
        if (t % 3 === 0) part({ x: d.cx + rnd(-22, 22), y: d.cy - 20 + rnd(-8, 4), vy: -rnd(.8, 1.6), life: 16, c: pick(['#f8d040', '#f88028']), s: 3, shrink: 1 }); } });
    tw(o, { boca: 1 }, 10, 'out'); await tw(a.spr, { ox: -s * 6, oy: s * 2, sy: 1.12, sx: .92 }, 11, 'out');
    tw(a.spr, { ox: s * 4, oy: -s * 1, sy: .94, sx: 1.08 }, 4, 'out'); flash('#f88028', .25);
    await tw(o, { head: 1 }, 9, 'lin');
    d.spr.tint = '#e84838'; flash('#fff0a0', .5); shake(6); fx(7, k => brasaPum(d.cx, d.cy, 14 + k * 16));
    await tw(o, { env: 1 }, 9, 'out'); await wait(12);
    reposo(a); await tw(o, { tail: 1.1 }, 8, 'in'); o.boca = 0;
    for (let i = 0; i < 6; i++) part({ x: d.cx + rnd(-20, 20), y: d.cy - 10 + rnd(-10, 10), vy: -rnd(.5, 1.1), life: 24, c: pick(['#48404c', '#6c6470', '#989098']), s: 6, kind: 'puff', shrink: 1 });
    await tw(o, { env: 0 }, 10, 'in');
  },

  async soldadura(a, d) { // careta abajo, arco cegador, chispas a chorro y un cordón al rojo que se queda para siempre
    const s = dirOf(a), m = { y: -34, al: 0, on: 1 }, st = { arc: 0, cool: 0, tor: 0, k: 0, al: 1 }, seam = [];
    const P = k => [d.cx - 15 + 30 * k, d.cy + 8 - 14 * k + Math.sin(k * 9) * 2], hx = () => a.cx + a.spr.ox + s * 12, hy = () => a.cy + a.spr.oy + 2;
    fx(200, (k, t) => { if (st.al <= 0) return;
      // cordón: escamas que se van enfriando (primero la silueta, luego el color)
      seam.forEach(q => sello('brasa_cordon_k', q[0], q[1], { a: st.al }));
      seam.forEach((q, i) => { const age = seam.length - 1 - i, c = st.arc ? (age < 1 ? 0 : age < 4 ? 1 : 2) : Math.min(4, 1 + Math.floor(st.cool * 3.6 + (1 - i / seam.length) * .8)); sello('brasa_cordon' + c, q[0], q[1], { a: st.al }); });
      if (st.tor > 0) { const [x, y] = P(st.k), x0 = hx(), y0 = hy(), ex = lerp(x0, x, st.tor), ey = lerp(y0, y, st.tor) - (1 - st.tor) * 6, bx = lerp(x0, ex, .55), by = lerp(y0, ey, .55);
        opl(bx, by, ex, ey, '#c8d0dc', 1); opl(x0, y0, bx, by, '#f8c030', 4); opl(lerp(x0, bx, .75), lerp(y0, by, .75), bx, by, '#5c6070', 4);
        if (st.arc) { g.globalAlpha = .3 + (t & 1) * .25; disc(Math.round(x), Math.round(y), 11, '#9cd8ff'); g.globalAlpha = 1; sello(t & 1 ? 'brasa_arco' : 'brasa_arco2', x, y, { k: 2 }); } }
      if (m.on) sello(st.arc && (t & 1) ? 'brasa_careta2' : 'brasa_careta', a.cx + a.spr.ox, a.cy + a.spr.oy - 8 + m.y, { k: 2, a: m.al }); });
    tw(m, { al: 1 }, 4, 'out'); tw(m, { y: 0 }, 10, 'bounce'); snd(t => osc('p50', [500, 200], t + .15, .05, .12, sfxG));
    await tw(a.spr, { ox: (d.spr.x - a.spr.x) * .3, oy: (d.spr.y - a.spr.y) * .3 }, 10, 'out');
    await tw(st, { tor: 1 }, 5, 'out');
    snd(t => { for (let i = 0; i < 14; i++) noise(t + i * .04, .04, .18, sfxG, { f: 5000 + Math.random() * 3000 }); osc('saw', 2400, t, .58, .03, sfxG, { sus: 1 }); });
    st.arc = 1; shake(4); flash('#e0f8ff', .7); d.spr.tint = '#9cd8ff';
    await fx(34, (k, t) => { st.k = k; const [x, y] = P(k);
      if (t % 3 === 0) seam.push([x, y]);
      if (t % 2 === 0) burst(x, y, 4, { c: ['#ffffff', '#fff8c0', '#f8d040', '#f88028'], v0: 2, v1: 4.5, a0: s > 0 ? Math.PI * .55 : -Math.PI * .1, a1: s > 0 ? Math.PI * 1.1 : Math.PI * .45, ay: .22, l0: 10, l1: 22, s: 2 });
      if (t % 4 === 0) sparks(x, y, 3, ['#ffffff', '#fff8c0', '#f8d040']);
      if (t % 6 === 3) flash('#e0f8ff', .28); d.spr.ox = (t & 2) ? 1 : -1; });
    st.arc = 0; d.spr.ox = 0; d.spr.tint = '#f08030'; d.spr.sy = .9; tw(d.spr, { sy: 1 }, 12, 'elastic');
    snd(t => noise(t, .35, .12, sfxG, { f: [6000, 1500], type: 'bandpass', q: 1 }));
    tw(st, { tor: 0 }, 6, 'in'); tw(m, { y: -30, al: 0 }, 12, 'in').then(() => { m.on = 0; }); reposo(a);
    for (let i = 0; i < 5; i++) part({ x: d.cx - 12 + i * 6, y: d.cy + 4 - i * 3, vy: -rnd(.4, .8), life: 24, c: pick(['#989098', '#c8d0dc']), s: 4, kind: 'puff', shrink: 1 });
    await tw(st, { cool: 1 }, 20, 'lin'); await tw(st, { al: 0 }, 6, 'lin');
  },

  async colada(a, d) { // baja el crisol colgado de su cadena, se vuelca y el hierro fundido hace charco
    const s = dirOf(a), en = d.k === 'en', cx = d.cx + (en ? 26 : 36), cy0 = en ? 19 : d.cy - 30, c = { y: -50, tilt: 0, len: 0, cut: 0, on: 1 }, pool = { r: 0, cool: 0 }, fy = feet(d) - 2;
    const TIP = [[-12, -5], [-13, .3], [-11.5, 6]].map(([x, y]) => [x * 2, y * 2]), tgt = d.cx + (en ? 0 : 2); // pico del crisol en cada inclinación (siempre vuelca hacia la izquierda: es donde hay sitio en pantalla)
    snd(t => { for (let i = 0; i < 5; i++) osc('p25', 900 - i * 60, t + i * .03, .02, .05, sfxG); osc('p50', [200, 150], t + .2, .2, .1, sfxG); noise(t + .42, 1, .28, sfxG, { f: [600, 200], type: 'lowpass', lo: 1 }); noise(t + .42, 1, .1, sfxG, { f: 3000, lo: 1 }); });
    fx(240, (k, t) => {
      // charco incandescente
      if (pool.r > 1) { const r = Math.round(pool.r), q = pool.cool, C = [mix('#d82818', '#5c3038', q), mix('#f88028', '#8a4038', q), mix('#f8d040', '#b86048', q), mix('#fff8d0', '#c88868', q)];
        g.globalAlpha = 1 - Math.max(0, q - .6) * 2.5; ell(g, d.cx, fy, r + 1, Math.round(r * .26) + 1, INK); ell(g, d.cx, fy, r, Math.round(r * .26), C[0]); ell(g, d.cx - 1, fy - 1, Math.round(r * .8), Math.round(r * .19), C[1]); ell(g, d.cx - 2, fy - 1, Math.round(r * .55), Math.round(r * .12), C[2]);
        if (r > 12) { g.fillStyle = C[3]; g.fillRect(d.cx - Math.round(r * .4), fy - 2, Math.round(r * .3), 1); g.fillRect(d.cx + 3, fy, Math.round(r * .2), 1); }
        if (q < .3) for (let i = 0; i < 3; i++) { const b = ((t + i * 9) % 18) / 18, bx = d.cx + Math.round(Math.sin(i * 2.4 + (t / 18 | 0)) * r * .6); if (b < .7) { disc(bx, fy - 1, 1 + Math.round(b * 2), INK); disc(bx, fy - 1, Math.round(b * 2), C[3]); } }
        g.globalAlpha = 1;
        if (q <= 0 && r > 16) brasaLlamas([[d.cx - r * .7, fy, 3, 9, 0], [d.cx + r * .72, fy, 3, 11, 2], [d.cx + r * .2, fy + 3, 3, 8, 4]], t); }
      if (!c.on) return; const y = Math.round(c.y), ti = Math.round(c.tilt), [tx, ty] = TIP[ti], sx0 = cx + tx, sy0 = y + ty;
      // cadena y asa
      for (let yy = y - 30; yy > -4; yy -= 4) { g.fillStyle = INK; g.fillRect(cx - 2, yy - 4, 4, 5); g.fillStyle = (yy >> 2) & 1 ? '#c8d0dc' : '#8890a0'; g.fillRect(cx - 1, yy - 3, 2, 3); }
      opl(cx - 20, y - 6, cx, y - 30, '#8890a0', 2); opl(cx + 20, y - 6, cx, y - 30, '#8890a0', 2);
      // chorro de hierro: cae en parábola desde el pico
      if (c.len > 0) { const H = Math.max(1, fy - sy0), y1 = sy0 + H * c.len, yA = sy0 + H * c.cut;
        for (const [col, w] of [[INK, 5], [BRASA_C[0], 4], [BRASA_C[1], 3], [BRASA_C[2], 2], [BRASA_C[3], 1]]) { g.fillStyle = col;
          for (let yy = Math.round(yA); yy <= y1; yy++) { const u = (yy - sy0) / H, xx = lerp(sx0, tgt, Math.sqrt(Math.max(0, u))) + Math.sin(yy * .35 - t * .9) * (w > 1 ? 1 : .5), ww = w === 1 ? ((yy + t * 3) % 7 < 4 ? 1 : 0) : w + (u > .88 ? Math.round((u - .88) * 30) : 0); if (ww > 0) g.fillRect(Math.round(xx - ww), yy, ww * 2, 1); } } }
      sello('brasa_crisol' + ti, cx, y, { k: 2 });
      if (t % 4 === 0) part({ x: cx + rnd(-10, 10), y: y - 18, vy: -rnd(.4, .9), life: 16, c: pick(['#f88028', '#989098', '#f8d040']), s: 3, kind: 'puff', shrink: 1 });
    });
    await tw(c, { y: cy0 }, 11, 'bounce'); await wait(3);
    c.tilt = 1; await wait(4); c.tilt = 2; await tw(c, { len: 1 }, 7, 'in');
    d.spr.tint = '#f08030'; shake(6); flash('#f8a030', .5); tw(pool, { r: 32 }, 28, 'out'); d.spr.sy = .86; d.spr.sx = 1.1; tw(d.spr, { sy: 1, sx: 1 }, 16, 'elastic');
    for (let i = 0; i < 5; i++) { burst(d.cx, fy - 3, 6, { c: ['#f8d040', '#f88028', '#fff8d0', '#d82818'], v0: 1.2, v1: 3.2, a0: Math.PI * 1.1, a1: Math.PI * 1.9, ay: .22, s: 3, shrink: 1, l0: 14, l1: 24 }); part({ x: d.cx + rnd(-18, 18), y: fy - 6, vy: -rnd(.6, 1.2), life: 26, c: pick(['#989098', '#6c6470', '#c8d0dc']), s: 6, kind: 'puff', shrink: 1 }); shake(2); await wait(5); }
    await tw(c, { cut: 1 }, 6, 'in'); c.len = 0; c.tilt = 1; await wait(3); c.tilt = 0;
    tw(c, { y: -50 }, 12, 'in').then(() => { c.on = 0; });
    await tw(pool, { cool: 1 }, 18, 'lin'); pool.r = 0;
  },
});

// ═════════ VAPOR ═════════
// VAPOR
// agua en tres azules con brillo blanco; vapor en blancos y grises con forma de nube
const VAPOR_C = { a: '#1c4c90', b: '#3c80d8', c: '#8cc8f8', n1: '#f4f8fc', n2: '#bccede', nk: '#3c4858' };
const VAPOR_ESPUMA = { nk: '#1c4c90', n2: '#8cc8f8', n1: '#ffffff' };
// nube de lóbulos [x, y, r]: contorno, sombra, cuerpo y brillo (los lóbulos se funden entre sí)
function vaporNube(L, al = 1, P = VAPOR_C) {
  const M = L.map(([x, y, r]) => [Math.round(x), Math.round(y), Math.round(r)]).filter(l => l[2] >= 1);
  g.globalAlpha = al;
  for (const [x, y, r] of M) disc(x, y, r + 1, P.nk);
  for (const [x, y, r] of M) disc(x, y, r, P.n2);
  for (const [x, y, r] of M) if (r >= 2) disc(x, y - 1, r - 1, P.n1);
  for (const [x, y, r] of M) if (r >= 5) disc(Math.round(x - r * .35), Math.round(y - r * .4), Math.max(1, Math.round(r * .25)), '#ffffff');
  g.globalAlpha = 1;
}
// chorro de agua por una lista de puntos [x, y, r] (juntos, a ~2 px): contorno, tres azules y brillos que corren
function vaporChorro(L, t = 0) {
  const M = L.map(([x, y, r]) => [Math.round(x), Math.round(y), Math.max(1, Math.round(r))]);
  for (const [x, y, r] of M) disc(x, y, r + 1, INK);
  for (const [x, y, r] of M) disc(x, y, r, VAPOR_C.a);
  for (const [x, y, r] of M) if (r >= 2) disc(x, y - 1, r - 1, VAPOR_C.b);
  for (const [x, y, r] of M) if (r >= 3) disc(x, y - Math.round(r * .4), Math.max(1, Math.round(r * .4)), VAPOR_C.c);
  M.forEach(([x, y, r], i) => { if ((((i - t * 2) % 9) + 9) % 9 < 3) px(x - 1, y - Math.round(r * .5) - 1, '#ffffff', 2); });
}
const vaporArco = (x0, y0, x1, y1, h, q) => [lerp(x0, x1, q), lerp(y0, y1, q) - Math.sin(q * Math.PI) * h];
// salpicadura de gotas hacia arriba (no cuenta como golpe)
function vaporSalpica(x, y, n = 10, v = 2.6) { for (let i = 0; i < n; i++) { const w = -Math.PI * rnd(.08, .92); part({ x, y, vx: Math.cos(w) * rnd(.6, v), vy: Math.sin(w) * rnd(.9, v), ay: .22, life: ri(14, 26), c: pick([VAPOR_C.c, VAPOR_C.b, '#ffffff', VAPOR_C.c]), s: pick([2, 3, 3, 4]), shrink: 1 }); } }
function vaporVaho(x, y, n = 1, sp = 10) { for (let i = 0; i < n; i++) part({ x: x + rnd(-sp, sp), y: y + rnd(-sp, sp) * .6, vx: rnd(-.3, .3), vy: -rnd(.4, 1), life: ri(16, 28), c: pick([VAPOR_C.n1, VAPOR_C.n2, '#ffffff']), s: ri(3, 6), kind: 'puff', shrink: 1 }); }

// ── dibujos ──
dib('vapor_gota', ['....k....', '....k....', '...kbk...', '...kbk...', '..kbcbk..', '..kbcbk..', '.kbccbbk.', 'kbwcbbbak', 'kbwcbbbak', 'kbcbbbaak', '.kbbbaak.', '..kkkkk..'], { k: INK, a: VAPOR_C.a, b: VAPOR_C.b, c: VAPOR_C.c, w: '#ffffff' });
dib('vapor_gotita', ['..k..', '.kbk.', '.kbk.', 'kwbbk', 'kbbak', 'kbaak', '.kkk.'], { k: INK, a: VAPOR_C.a, b: VAPOR_C.c, w: '#ffffff' });
dib('vapor_corona', ['...k.....k.....k...', '..kck...kwk...kck..', '..kbk...kck...kbk..', '.kkbkk.kkckk.kkbkk.', 'kcbbbbkbcccbkbbbbck', 'kbbbbbbbbbbbbbbbbbk', '.kaabbbbbbbbbbbaak.', '..kkaaaaaaaaaaakk..', '....kkkkkkkkkkk....'], { k: INK, a: VAPOR_C.a, b: VAPOR_C.b, c: VAPOR_C.c, w: '#ffffff' });
for (const [id, y] of [['vapor_nota', '#f8e070'], ['vapor_notab', '#8cc8f8']]) {
  dib(id, ['....kkkkk', '....kyyyk', '....kykkk', '....kyk..', '....kyk..', '....kyk..', '.kkkkyk..', 'kyyyyyk..', 'kywyyyk..', 'kyyyyyk..', '.kkkkk...'], { k: INK, y, w: '#ffffff' });
  dib(id + '2', ['...kkkkkkkkkk', '...kyyyyyyyyk', '...kykkkkkkyk', '...kyk....kyk', '...kyk....kyk', '...kyk....kyk', '.kkkyk..kkkyk', 'kyyyyk.kyyyyk', 'kywyyk.kywyyk', 'kyyyyk.kyyyyk', '.kkkk...kkkk.'], { k: INK, y, w: '#ffffff' });
}
dib('vapor_pito', ['....kkk....', '...kwyyk...', '..kwyyyok..', '..kyyyyok..', '..kkkkkkk..', '...k...k...', '..kkkkkkk..', '..kwyyyok..', '..kwyyyok..', '..kwyyyok..', '..kwyyyok..', '..kwyyyok..', '..kwyyyok..', '.kkkkkkkkk.', '.kwyyyyyok.', '.kkkkkkkkk.', '...kwyok...', '...kwyok...', '...kkkkk...'], { k: INK, y: '#e8b030', o: '#a86c18', w: '#fff4b0' });
dib('vapor_grifo', [
  '.'.repeat(10) + 'k'.repeat(9) + '.'.repeat(8),
  '.'.repeat(10) + 'kRrrrrrrk' + '.'.repeat(8),
  '.'.repeat(10) + 'kkkkrkkkk' + '.'.repeat(8),
  '.'.repeat(13) + 'krk' + '.'.repeat(11),
  '.'.repeat(12) + 'kkmkk' + '.'.repeat(10),
  '....' + 'k'.repeat(9) + 'mmm' + 'k'.repeat(11),
  '..kk' + 'w'.repeat(20) + 'mmk',
  '.kww' + 'm'.repeat(21) + 'dk',
  'kw' + 'm'.repeat(22) + 'ddk',
  'kwmmm' + 'd'.repeat(20) + 'kk',
  'kwmmd' + 'k'.repeat(21) + '.',
  'kwmmdk', 'kwmmdk', 'kwmmdk', 'kkkkkkk', 'kwmmmdk', 'kkkkkkk',
].map(f => f.padEnd(27, '.')), { k: INK, w: '#f4f8fc', m: '#a8b8cc', d: '#607088', r: '#e84848', R: '#ffb0a0' });
// llave de paso: rueda roja en dos fotogramas (+ y ×)
for (const ph of [0, 1]) dib('vapor_valvula' + ph, Array.from({ length: 17 }, (_, j) => Array.from({ length: 17 }, (_, i) => {
  const dx = i - 8, dy = j - 8, r = Math.hypot(dx, dy);
  if (r > 8.4) return '.'; if (r > 7.3) return 'k'; if (r > 5.3) return dx + dy < -6 ? 'h' : dx + dy > 6 ? 'd' : 'r'; if (r > 4.4) return 'k';
  if (r <= 1.5) return 'y'; if (r <= 2.6) return 'k';
  return (ph ? Math.abs(dx - dy) <= 1 || Math.abs(dx + dy) <= 1 : Math.abs(dx) <= 1 || Math.abs(dy) <= 1) ? 'r' : '.';
}).join('')), { k: INK, r: '#e84848', h: '#ffb0a0', d: '#a02028', y: '#f8d030' });
// manómetro: esfera con zona roja (la aguja se pinta aparte)
dib('vapor_manometro', Array.from({ length: 27 }, (_, j) => Array.from({ length: 27 }, (_, i) => {
  const dx = i - 13, dy = j - 13, r = Math.hypot(dx, dy), A = (Math.atan2(dy, dx) - Math.PI * .8 + Math.PI * 4) % (Math.PI * 2), u = A / (Math.PI * .3375);
  if (r > 13.3) return '.'; if (r > 12.2) return 'k'; if (r > 10.2) return dx + dy < -7 ? 'w' : dx + dy > 8 ? 'o' : 'y'; if (r > 9.3) return 'k';
  if (r > 6 && A > Math.PI * .98 && A < Math.PI * 1.42) return 'r';
  if (r > 6.8 && u < 4.2 && Math.abs(u - Math.round(u)) * r < 1.1) return 'k';
  return dx + dy > 9 ? 'd' : 'p';
}).join('')), { k: INK, y: '#e8b030', o: '#a86c18', w: '#fff4b0', p: '#f8f6e8', d: '#d8d4c0', r: '#e84848' });
dib('vapor_tapa', [
  '.'.repeat(10) + 'kkkkk' + '.'.repeat(10),
  '.'.repeat(9) + 'kkwrrkk' + '.'.repeat(9),
  '.'.repeat(10) + 'kkkkk' + '.'.repeat(10),
  '.....' + 'k'.repeat(15) + '.....',
  '...kk' + 'wwww' + 'm'.repeat(11) + 'kk...',
  '.kkww' + 'm'.repeat(16) + 'dkk.',
  'kw' + 'm'.repeat(19) + 'dddk',
  'k' + 'd'.repeat(23) + 'k',
  '.' + 'k'.repeat(23) + '.',
], { k: INK, w: '#f4f8fc', m: '#a8b8cc', d: '#607088', r: '#e84848' });
dib('vapor_burbuja', ['..ccccc..', '.cfffffb.', 'cfwwffffb', 'cfwfffffb', 'cfffffffb', 'cfffffffb', 'cfffffffb', '.cfffffb.', '..bbbbb..'], { c: '#e8f8ff', b: '#8cc8f8', w: '#ffffff', f: 'rgba(140,200,248,.35)' });
dib('vapor_pop', ['...c...', '.c...c.', '.......', 'c.....c', '.......', '.c...c.', '...c...'], { c: '#e8f8ff' });
dib('vapor_patito', ['.......kkkk....', '......kyyyyk...', '.....kywykyykkk', '.....kyyyyyyooo', '.kk..kyyyyyykkk', 'kyyk.kyyyyyk...', 'kyyykkyyyyyykk.', 'kyyyyyyyyyyyyyk', 'kyyyydddyyyyyyk', 'kyyyyyyddyyyyyk', '.kyyyyyyyyyyyk.', '..kkkkkkkkkkk..'], { k: INK, y: '#f8d030', d: '#d09818', o: '#f08030', w: '#ffffff' });

Object.assign(ANIM, {
  async pitido(a, d) { // el pito de vapor: silba hasta aturdir
    const s = dirOf(a), tx = Math.round(a.cx + s * 24), ty = Math.round(Math.max(22, a.cy - 22)), ry = ty - 8, o = { y: 16, z: 0 };
    const an = Math.atan2(d.cy - 6 - ry, d.cx - tx), ux = Math.cos(an), uy = Math.sin(an);
    snd(t => { osc('p50', [500, 900], t, .1, .06, sfxG); osc('sin', [2200, 2700, 2400], t + .13, .85, .12, sfxG, { vib: 1, sus: 1 }); noise(t + .13, .85, .08, sfxG, { f: 7000 }); for (let i = 0; i < 4; i++) osc('p25', [1500 - i * 150, 1100 - i * 150], t + 1 + i * .09, .07, .06, sfxG); });
    const pito = (t, al) => sello('vapor_pito', tx + (o.z && t & 1 ? 1 : 0), ty + Math.round(o.y), { k: 2, a: al });
    tw(a.spr, { sx: 1.1, sy: .9 }, 8, 'out'); tw(o, { y: 0 }, 8, 'back'); await fx(8, (k, t) => pito(t));
    o.z = 1; tw(a.spr, { sx: 1, sy: 1 }, 8, 'elastic');
    await fx(46, (k, t) => {
      a.spr.ox = t & 2 ? 1 : -1;
      const L = []; for (let i = 0; i < 5; i++) { const q = (t * .05 + i / 5) % 1; L.push([tx - s * q * 14 + Math.sin(i * 2 + t * .2) * 2, ry - 3 - q * 20, 2 + q * 6]); } vaporNube(L); // penacho por la ranura
      pito(t);
      for (let j = 0; j < 3; j++) { // ondas de sonido hacia el rival
        const v = t / 30 - j / 3; if (v < 0) continue; const q = v % 1, cx = lerp(tx, d.cx, q), cy = lerp(ry, d.cy - 6, q), r = 9 + q * 20, pts = [];
        for (let u = -5; u <= 5; u++) { const w = an + u * .2; pts.push([cx + Math.cos(w) * r - ux * r, cy + Math.sin(w) * r - uy * r]); }
        path(pts, j & 1 ? VAPOR_C.c : "#ffffff", 3, 1);
      }
      for (let j = 0; j < 3; j++) { // notas que bailan entre las ondas
        const v = t / 30 - j / 3 - 1 / 6; if (v < 0) continue; const q = v % 1, w = Math.sin(q * 9 + j * 2) * 9;
        sello((j & 1 ? 'vapor_notab' : 'vapor_nota') + (j === 2 ? '2' : ''), lerp(tx, d.cx, q) - uy * w, lerp(ry, d.cy - 6, q) + ux * w, { k: j === 2 ? 1 : 2 });
      }
      if (t > 18) { d.spr.sx = 1 + Math.sin(t * .9) * .06; d.spr.ox = t & 2 ? 1 : -1; }
    });
    a.spr.ox = 0; o.z = 0; tw(o, { y: 12 }, 8, 'in');
    const hy = Math.max(9, d.cy - 26);
    await fx(30, (k, t) => { // el rival se queda viendo notas
      if (t < 8) pito(t, 1 - t / 8);
      for (let i = 0; i < 3; i++) { const w = t * .25 + i * 2.094; sello(i === 1 ? 'vapor_notab2' : i ? 'vapor_notab' : 'vapor_nota', d.cx + Math.cos(w) * 22, hy + Math.sin(w) * 6); }
      d.spr.ox = Math.round(Math.sin(t * .4) * 4 * (1 - k)); d.spr.sx = 1 + Math.sin(t * .4) * .05; d.spr.sy = 1 - Math.sin(k * Math.PI) * .14;
    });
    d.spr.ox = 0; d.spr.sx = 1; d.spr.sy = 1;
  },
  async chorrito(a, d) { // un chorro de agua hirviendo, en arco
    const s = dirOf(a), x0 = a.cx + s * 16, y0 = a.cy - s * 6 - 4, x1 = d.cx - s * 4, y1 = d.cy, h = 24, o = { hd: 0, tl: 0 }; let hit = -1;
    snd(t => { osc('sin', [500, 900], t, .12, .05, sfxG); noise(t + .13, .6, .14, sfxG, { f: [3000, 1500], type: 'bandpass', q: 1.5 }); osc('sin', [900, 500], t + .13, .5, .04, sfxG); noise(t + .34, .25, .12, sfxG, { f: 4000 }); });
    await tw(a.spr, { sx: 1.14, sy: .88, ox: -s * 3 }, 8, 'out');
    tw(a.spr, { sx: .94, sy: 1.06, ox: s * 3 }, 5, 'out');
    const f = fx(36, (k, t) => {
      const P = []; for (let q = o.tl; q <= o.hd; q += .02) { const p = vaporArco(x0, y0, x1, y1, h, q); P.push([p[0], p[1] + Math.sin(q * 18 - t * .9), 3 + q * 2.6]); }
      if (P.length) vaporChorro(P, t);
      for (let j = 0; j < 4; j++) { const q = t / 13 - .15 - j * .3; if (q > 0 && q < 1) { const p = vaporArco(x0, y0, x1, y1, h + 10 + (j & 1) * 5, q); sello(j & 1 ? 'vapor_gotita' : 'vapor_gota', p[0] + (j - 1.5) * 3, p[1] - 4); } } // gotas gordas que saltan
      if (t % 3 === 0 && P.length) { const p = P[ri(0, P.length - 1)]; vaporVaho(p[0], p[1] - 3, 1, 2); } // quema: echa vaho
      if (hit >= 0) { if (t - hit < 7) sello('vapor_corona', d.cx, d.cy + 3, { k: 2 }); if (t % 2 === 0) vaporVaho(d.cx, d.cy - 4, 1, 14); }
    });
    await tw(o, { hd: 1 }, 12, 'in');
    hit = 12; burst(d.cx, d.cy, 8, { c: [VAPOR_C.c, '#ffffff', VAPOR_C.b], v0: 1, v1: 2.8, a0: Math.PI, a1: Math.PI * 2, ay: .2, s: 3, shrink: 1 }); vaporSalpica(d.cx, d.cy, 8); shake(2);
    d.spr.tint = VAPOR_C.c; d.spr.sx = 1.12; d.spr.sy = .88; tw(d.spr, { sx: 1, sy: 1 }, 10, 'elastic'); tw(d.spr, { ox: s * 5 }, 4, 'out');
    await wait(12); tw(d.spr, { ox: 0 }, 10, 'out'); reposo(a); await tw(o, { tl: 1 }, 9, 'in'); await f;
  },
  async presion(a, d) { // la válvula revienta y suelta todo el vapor de una vez
    const s = dirOf(a), gx = clamp(Math.round(a.cx - s * 34), 15, W - 15), gy = Math.round(Math.max(15, a.cy - 22)), x0 = a.cx + s * 14, y0 = a.cy - s * 5 - 4, wx = a.cx, wy = Math.round(Math.max(10, a.cy - 26));
    const o = { n: 0, hd: 0, tl: 0, cl: 0 }, cap = { x: wx, y: wy, vx: -s * 1.6, vy: -4.6 }; let hit = -1;
    snd(t => { osc('saw', [100, 300], t, .47, .05, sfxG); for (let i = 0; i < 5; i++) osc('p25', 1700 + i * 120, t + .2 + i * .05, .03, .04, sfxG); osc('p50', [900, 200], t + .46, .08, .12, sfxG); noise(t + .47, .7, .35, sfxG, { f: [8000, 1500], type: 'highpass' }); });
    const mano = t => { const z = o.n > .75, w = Math.PI * (.8 + o.n * 1.35) + (z ? Math.sin(t * 2.5) * .1 : 0), x = gx + (z && t & 1 ? 1 : 0); sello('vapor_manometro', x, gy); pl(x, gy, x + Math.cos(w) * 9, gy + Math.sin(w) * 9, '#c02020', 2); disc(x, gy, 1, INK); };
    tw(o, { n: 1 }, 28, 'lin');
    await fx(28, (k, t) => { // se hincha, la llave traquetea y la aguja sube al rojo
      a.spr.sx = 1 + k * .22; a.spr.sy = 1 + k * .16; a.spr.ox = Math.round(Math.sin(t * 3) * k * 2); a.spr.tint = k > .35 && (t >> (k > .7 ? 1 : 2)) & 1 ? '#f85858' : null;
      sello('vapor_valvula0', wx + a.spr.ox, wy - Math.round(k * 5) + (t & 1 ? Math.round(k * 2) : 0));
      mano(t);
      if (t % 4 === 0) { const sd = pick([-1, 1]); part({ x: a.cx + sd * 22, y: a.cy + rnd(-10, 8), vx: sd * rnd(.8, 1.6), vy: -.4, life: 12, c: VAPOR_C.n1, s: 3, kind: 'puff', shrink: 1 }); }
    });
    a.spr.tint = null; a.spr.ox = 0; flash('#ffffff', .5); shake(2);
    tw(a.spr, { sx: .84, sy: .9, ox: -s * 6 }, 4, 'out').then(() => tw(a.spr, { sx: 1, sy: 1, ox: 0 }, 14, 'elastic'));
    tw(o, { n: .08 }, 30, 'bounce');
    const f = fx(34, (k, t) => {
      if (k < .9) mano(t);
      const L = []; for (let q = o.tl; q <= o.hd + .001; q += .07) L.push([lerp(x0, d.cx, q) + Math.sin(q * 30 + t * 1.7) * 1.5, lerp(y0, d.cy, q) + Math.cos(q * 23 + t * 1.3) * 1.5, 3 + q * 9]); // cono de vapor a presión
      if (hit >= 0) for (let i = 0; i < 7; i++) { const w = i * .9 + t * .15; L.push([d.cx + Math.cos(w) * 17 * o.cl, d.cy + Math.sin(w) * 12 * o.cl - (t - hit) * .3, (9 + (i % 3) * 2) * o.cl]); }
      vaporNube(L);
      for (let i = 0; i < 4; i++) { const q = (t * .17 + i * .25) % 1; if (q > o.tl && q < o.hd - .08) { const x = lerp(x0, d.cx, q), y = lerp(y0, d.cy, q) + (i - 1.5) * (1 + q * 3); pl(x, y, x + (d.cx - x0) * .07, y + (d.cy - y0) * .07, VAPOR_C.n2, 1); } } // rayas de velocidad
      cap.vy += .32; cap.x += cap.vx; cap.y += cap.vy; sello((t >> 1) & 1 ? 'vapor_valvula1' : 'vapor_valvula0', cap.x, cap.y, { rot: t >> 2 }); // la llave sale volando
      if (hit >= 0 && t > hit + 5 && t < 20) d.spr.ox = s * 9 + (t & 1 ? 1 : -1);
    });
    await tw(o, { hd: 1 }, 6, 'lin');
    hit = 6; shake(5); d.spr.tint = '#e0f0f8'; tw(o, { cl: 1 }, 8, 'back'); await tw(d.spr, { ox: s * 9, oy: -s * 3 }, 5, 'out');
    await wait(9); tw(o, { tl: 1 }, 8, 'in'); await wait(4); tw(o, { cl: 0 }, 10, 'in'); vaporVaho(d.cx, d.cy, 6, 16); await tw(d.spr, { ox: 0, oy: 0 }, 10, 'back'); await f;
  },
  async goteo(a, d) { // un grifo mal cerrado encima del rival: gota a gota
    const fy = Math.round(Math.max(10, d.cy - 42)), gx = Math.round(d.cx + 10), mx = d.cx, my = fy + 9, land = Math.max(d.cy - 4, fy + 30), o = { y: -34, gy: my, sp: 0 }; let st = 0, big = 0;
    snd(t => { osc('p25', [900, 1300], t, .05, .04, sfxG); osc('p25', [1300, 900], t + .08, .05, .04, sfxG); });
    const f = fx(70, (k, t) => {
      const oy = Math.round(o.y); sello('vapor_grifo', gx, fy + oy + (st === 1 && t & 1 ? 1 : 0));
      if (st === 1) sello('vapor_gotita', mx, my + 4 + oy);
      if (st === 2) { sello('vapor_gota', mx, o.gy, { k: big ? 2 : 1 }); px(mx, o.gy - (big ? 18 : 10), '#ffffff'); px(mx, o.gy - (big ? 22 : 13), VAPOR_C.c); }
      if (o.sp > .25) sello('vapor_corona', mx, land + 3, { k: 2 });
    });
    await tw(o, { y: 0 }, 9, 'bounce');
    for (let i = 0; i < 3; i++) {
      st = 1; await wait(5);
      st = 2; big = i === 2; o.gy = my + 6; await tw(o, { gy: land - (big ? 6 : 0) }, 8, 'in');
      st = 0; o.sp = 1; tw(o, { sp: 0 }, 8, 'lin'); snd(t => { osc('sin', [1500 - i * 150, 600 - i * 80], t, .12, .16, sfxG); noise(t, .06, .1, sfxG, { f: 3000 }); });
      if (i === 0) burst(d.cx, d.cy, 6, { c: [VAPOR_C.c, '#ffffff'], v0: .8, v1: 2.2, a0: Math.PI, a1: Math.PI * 2, ay: .2, s: 3, shrink: 1 });
      vaporSalpica(mx, land, big ? 16 : 7, big ? 3.4 : 2.4); if (big) shake(3);
      d.spr.sy = .88 - i * .05; d.spr.sx = 1.08 + i * .03; tw(d.spr, { sx: 1, sy: 1 }, 8, 'out'); d.spr.tint = '#5aa8f0';
      await wait(4);
    }
    await wait(3); await tw(o, { y: -36 }, 8, 'in'); await f;
  },
  async manguerazo(a, d) { // abre la llave de paso del todo: la manguera se retuerce y lo empapa
    const s = dirOf(a), nx = a.cx + s * 20, ny = a.cy - s * 4 - 6, hx = s > 0 ? -6 : W + 6, hy = a.cy + (s > 0 ? 20 : -16), vx = clamp(Math.round(a.cx - s * 26), 18, W - 18), vy = Math.round(Math.max(18, a.cy - 28));
    const an = Math.atan2(d.cy - ny, d.cx - nx), ux = Math.cos(an), uy = Math.sin(an), tx = nx + ux * 12, ty = ny + uy * 12, ex = d.cx - s * 4, ey = d.cy;
    const o = { v: 0, hose: 0, bul: -1, hd: 0, tl: 0, amp: 1, vs: 16 }; let hit = -1;
    snd(t => { for (let i = 0; i < 5; i++) osc('p50', [300 + i * 30, 200 + i * 30], t + i * .045, .04, .06, sfxG); osc('sin', [120, 260], t + .23, .12, .12, sfxG); noise(t + .33, .75, .3, sfxG, { f: [1200, 2500], type: 'bandpass', q: .5 }); noise(t + .42, .2, .2, sfxG, { f: 3500 }); });
    const f = fx(64, (k, t) => {
      // la manguera
      const M = []; for (let u = 0; u <= o.hose; u += .03) { const w = Math.sin(u * 9 - t * .45) * 6 * Math.sin(u * Math.PI) * o.amp; M.push([Math.round(lerp(hx, nx, u) - uy * w), Math.round(lerp(hy, ny, u) + ux * w), Math.abs(u - o.bul) < .1 ? 5 : 3]); }
      for (const [x, y, r] of M) disc(x, y, r + 1, INK); for (const [x, y, r] of M) disc(x, y, r, '#2f6c3c'); for (const [x, y, r] of M) disc(x, y - 1, r - 1, '#58b858');
      M.forEach(([x, y, r], i) => { if (i % 5 === 2) px(x - 1, y - r, '#c4f094', 2); });
      if (o.hose >= .99) { opl(nx - ux * 2, ny - uy * 2, nx + ux * 9, ny + uy * 9, '#e8b030', 5); pl(nx, ny - 1, nx + ux * 8, ny + uy * 8 - 1, '#fff4b0', 1); opl(nx - ux * 3, ny - uy * 3, nx - ux, ny - uy, '#a86c18', 7); opl(nx + ux * 9, ny + uy * 9, tx, ty, '#a86c18', 5); } // boquilla de latón
      // la llave de paso, girando
      if (o.vs < 15) sello(Math.floor(o.v * 2) & 1 ? 'vapor_valvula1' : 'vapor_valvula0', vx, vy - Math.round(o.vs), { k: 2, rot: Math.floor(o.v) });
      // el chorro
      if (o.hd > 0 && o.tl < 1) { const P = []; for (let q = o.tl; q <= o.hd; q += .028) { const w = Math.sin(q * 14 - t * 1.1) * 1.6; P.push([lerp(tx, ex, q) - uy * w, lerp(ty, ey, q) + ux * w, 3.6 + q * 2.4]); } vaporChorro(P, t); }
      if (hit >= 0 && o.tl < .6) { // rompe contra el rival
        const L = []; for (let i = 0; i < 5; i++) { const w = i * 1.257 + t * .5; L.push([ex + Math.cos(w) * 9, ey + Math.sin(w) * 8, 5 + ((i + t) % 3)]); } vaporNube(L, 1, VAPOR_ESPUMA);
        if (t & 1) vaporSalpica(ex, ey, 3, 3.6); d.spr.ox = s * 10 + (t & 1 ? 2 : 0);
      }
    });
    tw(o, { vs: 0 }, 6, 'back'); tw(o, { hose: 1 }, 10, 'out'); await tw(o, { v: 9 }, 15, 'in');
    tw(a.spr, { ox: -s * 4, sx: 1.1, sy: .92 }, 6, 'out'); await tw(o, { bul: 1 }, 6, 'lin'); o.bul = -1; o.amp = 1.8;
    tw(a.spr, { ox: -s * 7, sx: .95, sy: 1.04 }, 4, 'out'); await tw(o, { hd: 1 }, 5, 'lin');
    hit = 26; shake(5); flash('#e8f8ff', .3); d.spr.tint = '#5aa8f0'; await tw(d.spr, { ox: s * 10, oy: -s * 4 }, 4, 'out');
    await wait(18); tw(o, { amp: .6, vs: 40 }, 10, 'in'); await tw(o, { tl: 1 }, 6, 'in');
    reposo(a); tw(o, { hose: 0 }, 10, 'in'); await tw(d.spr, { ox: 0, oy: 0 }, 10, 'back'); await f;
  },
  async hervir(a, d) { // se pone a cien: burbujea, la tapa baila y sale rojo
    const s = dirOf(a), lx = a.cx, ly = Math.round(Math.max(12, a.cy - 20)), tx = clamp(Math.round(a.cx - s * 36), 8, W - 8), ty = Math.round(clamp(a.cy - 4, 30, 90)), o = { up: 0, j: 0 }, bur = [];
    snd(t => { for (let i = 0; i < 20; i++) osc('sin', [300 + Math.random() * 400 + i * 20, 900 + i * 20], t + i * .038, .05, .06, sfxG); noise(t + .77, .3, .2, sfxG, { f: 7000 }); osc('sin', [1800, 2600], t + .77, .25, .06, sfxG); });
    const f = fx(64, (k0, t) => {
      const k = Math.min(1, t / 46);
      a.spr.tint = k < .25 ? null : k < .6 ? ((t >> 2) & 1 ? '#f8a070' : null) : k < 1 ? ((t >> 1) & 1 ? '#f85858' : '#f8a070') : '#f85858';
      a.spr.ox = Math.round(Math.sin(t * 2.6) * k * 1.5); a.spr.sx = 1 + Math.sin(t * 1.1) * .04 * k; a.spr.sy = 1 - Math.sin(t * 1.1) * .04 * k;
      // burbujas que suben y revientan
      if (t % 3 === 0 && t < 52) bur.push({ x: a.cx + rnd(-24, 24), y: feet(a) - rnd(0, 16), v: rnd(.6, 1.3) + k, big: Math.random() < .3 + k * .4, n: ri(10, 20), t: 0, ph: rnd(0, 6) });
      for (const b of bur) { b.t++; if (b.t < b.n) { b.y -= b.v; sello('vapor_burbuja', b.x + Math.sin(b.t * .5 + b.ph) * 1.5, b.y, { k: b.big ? 2 : 1 }); } else if (b.t < b.n + 4) sello('vapor_pop', b.x, b.y, { k: b.big ? 2 : 1 }); }
      // la tapa baila y se le escapa el vapor
      const hop = Math.round(Math.abs(Math.sin(t * (.3 + k * .3))) * (1 + k * 5) + o.up), lxx = lx + Math.round(Math.sin(t * 1.3) * k * 2);
      if (hop >= 3 && t % 2 === 0) { const sd = t & 2 ? 1 : -1; part({ x: lx + sd * 22, y: ly + 7, vx: sd * rnd(.8, 1.8), vy: -rnd(.2, .8), life: ri(10, 18), c: pick([VAPOR_C.n1, VAPOR_C.n2]), s: ri(3, 5), kind: 'puff', shrink: 1 }); }
      if (o.j > .05) { const L = []; for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) L.push([lx + sd * (20 + i * 9 * o.j), ly + 8 - i * 3 * o.j + Math.sin(t * .6 + i) * 1.5, (4 + i * 2.2) * o.j]); vaporNube(L); }
      sello('vapor_tapa', lxx, ly - hop, { k: 2 });
      // termómetro
      const hh = Math.round(22 * k); g.fillStyle = INK; g.fillRect(tx - 4, ty - 26, 8, 30); disc(tx, ty + 6, 6, INK); g.fillStyle = '#f8f6e8'; g.fillRect(tx - 2, ty - 24, 4, 26); disc(tx, ty + 6, 4, '#e84848'); g.fillStyle = '#e84848'; g.fillRect(tx - 1, ty + 2 - hh, 2, hh + 2); px(tx - 2, ty + 4, '#ffb0a0', 2);
      g.fillStyle = INK; for (let i = 0; i < 5; i++) g.fillRect(tx + 1, ty - 2 - i * 5, 1, 1);
      if (k >= 1) txtO('100', clamp(tx - 6, 2, W - 20), ty - 36 < 2 ? ty + 15 : ty - 36, (t >> 2) & 1 ? '#f8e070' : '#ffffff');
    });
    await wait(46); flash('#f85858', .3); shake(2);
    tw(o, { up: 16 }, 6, 'out').then(() => tw(o, { up: 0 }, 10, 'bounce')); tw(o, { j: 1 }, 7, 'out').then(() => tw(o, { j: 0 }, 10, 'in'));
    tw(a.spr, { oy: -4 }, 5, 'out').then(() => tw(a.spr, { oy: 0 }, 9, 'bounce'));
    await f; a.spr.tint = null; a.spr.ox = 0; a.spr.oy = 0; a.spr.sx = 1; a.spr.sy = 1;
  },
  async vaporazo(a, d) { // nube enorme de vapor de caldera que lo engulle
    const s = dirOf(a), x0 = a.cx + s * 12, y0 = a.cy - s * 6, o = { hd: 0, en: 0, out: 0 }, nl = Math.hypot(d.cx - x0, d.cy - y0), nx = -(d.cy - y0) / nl, ny = (d.cx - x0) / nl; let hit = 0;
    snd(t => { osc('saw', [45, 75], t, .28, .09, sfxG, { sus: 1 }); noise(t + .26, 1, .3, sfxG, { f: [6000, 1200], type: 'highpass', swell: 1 }); osc('saw', [55, 45], t + .26, .9, .1, sfxG, { sus: 1 }); osc('sin', [90, 40], t + .48, .25, .25, sfxG); });
    tw(a.spr, { sx: 1.22, sy: 1.16 }, 16, 'out');
    await fx(16, (k, t) => { // coge presión: se hincha y traga jirones
      a.spr.ox = Math.round(Math.sin(t * 3) * k * 2); a.spr.tint = k > .5 && (t >> 1) & 1 ? '#f85858' : null;
      const w = t * 1.9; part({ x: a.cx + Math.cos(w) * 36, y: a.cy + Math.sin(w) * 28, vx: -Math.cos(w) * 2.8, vy: -Math.sin(w) * 2.2, life: 11, c: pick([VAPOR_C.n1, VAPOR_C.n2]), s: 4, kind: 'puff', shrink: 1 });
    });
    a.spr.tint = null; shake(2); flash('#ffffff', .25);
    tw(a.spr, { sx: .86, sy: .92, ox: -s * 6 }, 5, 'out').then(() => tw(a.spr, { sx: 1, sy: 1, ox: 0 }, 16, 'elastic'));
    const f = fx(52, (k, t) => {
      const L = [], g0 = 1 - o.out, up = o.out * 12, hx = lerp(x0, d.cx, o.hd), hy = lerp(y0, d.cy, o.hd);
      for (let i = 0; i <= 8; i++) { const q = i / 8 * o.hd, w = Math.sin(i * 2.4 + t * .1) * 7 * q; L.push([lerp(x0, d.cx, q) + nx * w, lerp(y0, d.cy, q) + ny * w - up, (5 + q * 11 + Math.sin(t * .35 + i * 1.7) * 1.5) * g0]); } // la estela
      for (let i = 0; i < 6; i++) { const w = i * 1.047 + t * .12; L.push([hx + Math.cos(w) * (5 + o.hd * 9), hy + Math.sin(w) * (4 + o.hd * 7) - up, (6 + o.hd * 8) * g0]); } // el frente
      for (let i = 0; i < 10; i++) { const w = i * .628 + t * .07 * (i & 1 ? 1 : -1), rr = (10 + (i % 3) * 8) * o.en; L.push([d.cx + Math.cos(w) * rr * 1.2, d.cy + Math.sin(w) * rr * .8 - up, ((11 + (i % 4) * 2.5) + Math.sin(t * .4 + i)) * o.en * g0]); } // lo engulle
      vaporNube(L);
      if (hit === 1) { d.spr.ox = t & 2 ? 2 : -2; for (let i = 0; i < 3; i++) { const w = t * .9 + i * 2.1, x = d.cx + Math.cos(w) * 18, y = d.cy + Math.sin(w) * 14; pl(x, y, x + Math.cos(w) * 7, y + Math.sin(w) * 7, VAPOR_C.n2, 2); } } // pssss
    });
    await tw(o, { hd: 1 }, 13, 'in');
    hit = 1; shake(6); flash('#ffffff', .45); d.spr.tint = '#e0f0f8'; tw(o, { en: 1 }, 9, 'back');
    await wait(22); hit = 2; d.spr.ox = 0; vaporVaho(d.cx, d.cy, 10, 22); d.spr.sy = .9; tw(d.spr, { sy: 1 }, 12, 'elastic');
    await tw(o, { out: 1 }, 15, 'in'); await f;
  },
  async marejada(a, d) { // el mar se levanta de mal humor: una ola con cresta de espuma (y pasajero)
    const s = dirOf(a), base = H - 28, xs = s > 0 ? -26 : W + 26, xe = d.cx + s * 6, hm = base - Math.max(16, d.cy - 26), o = { p: 0, q: 0, h: 0, br: 0, dr: 0 };
    snd(t => { noise(t, 1.3, .38, sfxG, { f: [200, 1500, 300], type: 'lowpass', swell: 1, lo: 1 }); noise(t + .58, .6, .25, sfxG, { f: 3000 }); osc('sin', [110, 45], t + .58, .3, .25, sfxG); });
    const X = () => lerp(xs, xe, o.p * (.35 + .65 * o.p)) + s * 44 * o.q;
    const hAt = (x, t) => { const dd = (X() - x) * s, sl = 9 * Math.min(1, o.h * 3) * (1 - o.dr), Hc = hm * o.h * (1 - o.dr), k = dd < -22 ? 0 : dd < 0 ? ((dd + 22) / 22) ** 2 : Math.max(0, 1 - (dd / 85) ** 1.5); return Math.max(0, sl + Math.sin(x * .2 + t * .4) * 1.5 + Hc * k); };
    const f = fx(62, (k, t) => {
      const fxx = X(); let prev = null;
      for (let x = 0; x < W; x++) {
        const h = hAt(x, t), top = Math.round(base - h), dd = (fxx - x) * s, cara = dd < 0 && dd > -22; if (h < 1) { prev = null; continue; }
        g.fillStyle = INK; if (prev == null) g.fillRect(x, top - 1, 1, 1); else g.fillRect(x, Math.min(top, prev) - 1, 1, Math.abs(top - prev) + 1); prev = top;
        g.fillStyle = VAPOR_C.a; g.fillRect(x, top, 1, H - top);
        if (cara) { g.fillStyle = VAPOR_C.b; for (let y = top + 2 + (((Math.round(dd) * 2 - t * 3) % 10) + 10) % 10; y < base; y += 10) g.fillRect(x, y, 1, 4); g.fillStyle = VAPOR_C.c; g.fillRect(x, top, 1, 2); } // la cara de la ola: rayas que suben
        else { const hc = Math.max(3, Math.round(h * .12)), hb = Math.round(h * .4); g.fillStyle = VAPOR_C.b; g.fillRect(x, top, 1, hc + hb); g.fillStyle = VAPOR_C.c; g.fillRect(x, top, 1, hc); g.fillStyle = '#ffffff'; g.fillRect(x, top, 1, h > 6 ? 2 : 1);
          if (h > 26) { if ((x + t * 2) % 14 < 8) { g.fillStyle = VAPOR_C.c; g.fillRect(x, top + hc + Math.round(hb * .5), 1, 1); } if ((x + t * 3) % 18 < 10) { g.fillStyle = VAPOR_C.b; g.fillRect(x, top + hc + hb + Math.round(h * .16), 1, 2); } } }
      }
      const gr = Math.min(1, o.h * 1.6) * (1 - o.dr), yc = base - hAt(fxx, t), xk = Math.round(fxx - s * 20);
      if (o.h > .3 && o.dr < .7) sello('vapor_patito', xk, base - hAt(xk, t) - 9 + Math.round(Math.sin(t * .4) * 2), { k: 2, fx: s < 0 }); // un patito de goma surfeando
      const L = [];
      for (let i = 0; i < 4; i++) L.push([fxx + s * (3 + i * 5), yc + 3 + i * i * 2.4, (9 - i * 1.6) * gr]); // el labio que se enrosca
      for (let i = 1; i < 7; i++) { const x = fxx - s * i * 10; L.push([x, base - hAt(x, t) + Math.sin(t * .5 + i) * 1.5, (8 - i * .8) * gr]); } // cresta de espuma
      if (o.br > 0) for (let i = 0; i < 8; i++) { const w = i * .785 + t * .1; L.push([d.cx + Math.cos(w) * (8 + 22 * o.br), d.cy + Math.sin(w) * (6 + 16 * o.br), (9 + (i % 3) * 3) * Math.min(1, o.br * 2) * (1 - o.dr)]); } // rompe
      vaporNube(L, 1, VAPOR_ESPUMA);
      if (t % 2 === 0 && gr > .4) part({ x: fxx + s * rnd(0, 10), y: yc + rnd(-4, 6), vx: s * rnd(.5, 2), vy: -rnd(.5, 2), ay: .15, life: 16, c: pick(['#ffffff', VAPOR_C.c]), s: pick([2, 3]), shrink: 1 });
    });
    tw(a.spr, { oy: -3 }, 12, 'out'); tw(o, { h: 1 }, 26, 'out');
    await tw(o, { p: 1 }, 36, 'lin');
    shake(6); flash('#e8f8ff', .4); vaporSalpica(d.cx, d.cy - 6, 22, 4.2); d.spr.tint = '#4c98e8';
    tw(o, { q: 1 }, 22, 'out'); tw(o, { br: 1 }, 8, 'out'); tw(d.spr, { ox: s * 10, oy: 4 }, 5, 'out');
    await wait(6); tw(o, { dr: 1 }, 18, 'in'); tw(a.spr, { oy: 0 }, 10, 'out');
    await wait(8); await tw(d.spr, { ox: 0, oy: 0 }, 12, 'back'); await f;
  },
});

// ═════════ MUSGO ═════════
// MUSGO
// ── ayudantes de MUSGO ──
const MUSGO_PAL = { k: INK, d: '#1f6a3a', g: '#3c9a50', l: '#8ed24a', w: '#d8f8a0', t: '#6a4428', m: '#8a5c34', c: '#c89058', h: '#f0dcb0', s: '#c8d0dc', n: '#7c8494' };
// contorno oscuro automático alrededor de un dibujo
function musgoBorde(f) {
  const w = Math.max(...f.map(r => r.length)), G = ['.'.repeat(w + 2), ...f.map(r => '.' + r.padEnd(w, '.') + '.'), '.'.repeat(w + 2)];
  return G.map((r, y) => [...r].map((ch, x) => ch !== '.' ? ch : [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const q = G[y + dy]; return q && q[x + dx] && q[x + dx] !== '.'; }) ? 'k' : '.').join(''));
}
// dibujo a partir de una fórmula: fn(x, y) con el origen en el centro devuelve la letra del color (o nada)
function musgoForma(w, h, fn) { const f = []; for (let y = 0; y < h; y++) { let r = ''; for (let x = 0; x < w; x++) r += fn(x + .5 - w / 2, y + .5 - h / 2) || '.'; f.push(r); } return musgoBorde(f); }
// gira un dibujo (sin contorno) un ángulo cualquiera, píxel a píxel
function musgoGira(f, ang) {
  const h = f.length, w = Math.max(...f.map(r => r.length)), n = Math.ceil(Math.hypot(w, h)) + 1, c = Math.cos(ang), s = Math.sin(ang), out = [];
  for (let y = 0; y < n; y++) { let r = ''; for (let x = 0; x < n; x++) { let ch = '.'; for (const [ex, ey] of [[0, 0], [.3, 0], [-.3, 0], [0, .3], [0, -.3]]) { const dx = x + .5 - n / 2 + ex, dy = y + .5 - n / 2 + ey, u = Math.floor(dx * c + dy * s + w / 2), v = Math.floor(-dx * s + dy * c + h / 2), q = f[v] && f[v][u]; if (q && q !== '.') { ch = q; break; } } r += ch; } out.push(r); }
  return out;
}
// tallo, liana o raíz gruesa que se afina: contorno, color y brillo
function musgoTallo(pts, r0, r1, c) {
  const n = pts.length; if (!n) return; const R = i => Math.max(0, Math.round(lerp(r0, r1, n > 1 ? i / (n - 1) : 0)));
  pts.forEach(([x, y], i) => disc(Math.round(x), Math.round(y), R(i) + 1, INK));
  pts.forEach(([x, y], i) => disc(Math.round(x), Math.round(y), R(i), c[0]));
  pts.forEach(([x, y], i) => { const r = R(i); if (r >= 1) disc(Math.round(x) - 1, Math.round(y) - 1, r - 1, c[1]); });
}
// hoja afilada apuntando hacia el ángulo th (16 orientaciones)
function musgoHoja(x, y, th, o, id = 'musgo_hoja') { let i = Math.round(th / (Math.PI / 8)) % 16; if (i < 0) i += 16; sello(id + (i & 7), x, y, Object.assign({ rot: i >= 8 ? 2 : 0 }, o)); }
// polvo sin burst (para no marcar el golpe antes de tiempo)
function musgoPolvo(x, y, n, c = ['#f8f0d8', '#e0d4b0', '#c8b890']) { for (let i = 0; i < n; i++) { const an = rnd(Math.PI, Math.PI * 2), v = rnd(.4, 1.6); part({ x: x + rnd(-3, 3), y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, drag: .95, life: ri(14, 26), c: pick(c), kind: 'puff', s: 4, shrink: 1 }); } }
// hojas que salen despedidas girando
function musgoHojas(x, y, n, vida = 26, v = 2.6) {
  const L = Array.from({ length: n }, (_, i) => { const an = i / n * 6.283 + rnd(-.3, .3), sp = rnd(v * .5, v); return { x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 1, th: rnd(6.28), w: rnd(.2, .5) * (i & 1 ? 1 : -1) }; });
  return fx(vida, (k, t) => { for (const l of L) { l.x += l.vx; l.y += l.vy; l.vy += .09; l.vx *= .96; l.th += l.w; if (k > .7 && (t & 1)) continue; musgoHoja(l.x, l.y, l.th); } });
}
// y de pantalla de la coronilla de una criatura
const MUSGO_TOPE = {};
function musgoTope(s) {
  const id = s.mon.sp + viewOf(s);
  if (MUSGO_TOPE[id] == null) { let top = 14; try { const [, x] = mk(56, 56); x.drawImage(MON[s.mon.sp][viewOf(s)], 0, 0); const dt = x.getImageData(0, 0, 56, 56).data; busca: for (let y = 0; y < 56; y++) for (let i = 0; i < 56; i++) if (dt[(y * 56 + i) * 4 + 3] > 40) { top = y; break busca; } } catch (e) { } MUSGO_TOPE[id] = top; }
  return Math.round(feet(s) + s.spr.oy - (56 - MUSGO_TOPE[id]) * s.spr.sy);
}

// ── dibujos ──
// hojas afiladas en 8 orientaciones (grandes y pequeñas)
for (let i = 0; i < 8; i++) {
  const c = Math.cos(i * Math.PI / 8), s = Math.sin(i * Math.PI / 8);
  const hoja = (L, A) => (x, y) => { const u = x * c + y * s, v = -x * s + y * c, e = 1 - Math.abs(u) / L; if (e <= 0) return; const wd = A * Math.pow(e, .7); if (Math.abs(v) > wd) return; return Math.abs(v) < .6 ? 'd' : v < 0 ? (Math.abs(u + L * .25) < L * .25 && v < -A * .35 && v > -A * .7 ? 'w' : 'l') : 'g'; };
  dib('musgo_hoja' + i, musgoForma(18, 18, hoja(8.5, 3.8)), MUSGO_PAL);
  dib('musgo_hojita' + i, musgoForma(12, 12, hoja(5, 2.6)), MUSGO_PAL);
}
// hoja de monstera enorme (punta hacia abajo, peciolo arriba)
dib('musgo_monstera', musgoForma(32, 32, (x, y) => {
  const R = 15, yy = y / R, ax = Math.abs(x); if (Math.abs(yy) >= 1) return;
  if (ax / R > Math.sqrt(1 - yy * yy) * (yy > 0 ? 1 - .3 * yy : 1)) return;
  if (y < -10 && ax < (-10 - y) * .9 + .6) return;                                        // escotadura del peciolo
  const v = y + ax * .5;                                                                   // nervios y hendiduras en espiga
  if (ax > 5.5 && [-5.5, 0, 5.5, 11].some(m => Math.abs(v - m) < .6 + (ax - 5.5) * .1)) return;
  if (ax > 2.5 && ax < 4.5 && [0, 5.5].some(m => Math.abs(v - m) < .9)) return;            // agujeros
  if (ax < 1) return 'd';
  if ([-8.2, -2.7, 2.8, 8.3].some(m => Math.abs(v - m) < .5)) return 'd';
  return x < 0 ? (y < 3 ? 'l' : 'w') : (y < -3 ? 'w' : 'g');
}), { k: INK, d: '#1f6a3a', g: '#2f8a48', l: '#8ed24a', w: '#58b858' });
// hoja de hiedra
dib('musgo_hiedra', musgoBorde(['.ll...gg.', 'lllg.gggd', 'lwlggggdd', '.llgdggd.', '..lgdgd..', '...gdd...', '....d....']), MUSGO_PAL);
// bombilla de filamento: apagada y encendida
{
  const B = ['.....kkkkk.....', '...kkyyyyykk...', '..kyyyyyyyyek..', '.kyywwyyyyyyek.', '.kywwyyyyyyyek.', 'kyywyyyyyyyyyek', 'kyyyyyyyyyyyyek', 'kyyyyoyyyoyyyek', 'kyyyyooyooyyyek', 'kyyyyoyoyoyyyek', '.kyyyoyyyoyyek.', '.kyyyyoyoyyyek.', '..kyyyoyoyyek..', '..kyyyoyoyyek..', '...kyyoyoyek...', '...kkkkkkkkk...', '....kssssgk....', '...kkgggggkk...', '....kssssgk....', '...kkgggggkk...', '....kssssgk....', '.....kgggk.....', '......kkk......'];
  dib('musgo_bomb0', B, { k: INK, y: '#a4b0c0', e: '#7c8898', w: '#e0e8f0', o: '#4c5460', s: '#c8d0dc', g: '#7c8494' });
  dib('musgo_bomb1', B, { k: INK, y: '#fff8c0', e: '#f8e070', w: '#ffffff', o: '#f08030', s: '#c8d0dc', g: '#7c8494' });
}
dib('musgo_chispa', musgoBorde(['...w...', '...y...', '..yyy..', 'wyyyyyw', '..yyy..', '...y...', '...w...']), { k: INK, y: '#f8d030', w: '#fff8c0' });
// terrón de tierra removida
dib('musgo_terron', musgoBorde(['.....mmmmm......', '...mmccmmmmmt...', '..mccmmmmtmmmt..', '.mmmmmtmmmmmttt.', 'mmtmmmmmmtmmmttt']), MUSGO_PAL);
// regadera (pitorro a la derecha): derecha, a medio inclinar e inclinada
{
  const R = [
    '..........ddddd............',
    '........ddd...ddd..........',
    '.......dd.......dd.........',
    '.......d.........d.....ss..',
    '.......lllllllllll....ssss.',
    '..ddd..lgggggggggd....nsss.',
    '.dd.dd.lgwgggggggd..lgdnn..',
    '.d...ddlgwgggggggd.lgd.....',
    '.d.....lgwgggggggdlgd......',
    '.d.....lgggggggggdgd.......',
    '.d.....lgggggggggdd........',
    '.d...ddlgggggggggd.........',
    '.dd.dd.lgggggggggd.........',
    '..ddd..lgggggggggd.........',
    '.......lggggggggdd.........',
    '........ddddddddd..........'];
  [0, .3, .6].forEach((an, i) => dib('musgo_reg' + i, musgoBorde(musgoGira(R, an)), MUSGO_PAL));
}
dib('musgo_gota', musgoBorde(['..m..', '..m..', '.mcm.', 'mchmt', 'mcmmt', 'mmmmt', '.mtt.']), MUSGO_PAL);
dib('musgo_gotita', musgoBorde(['.m.', 'mcm', 'mmt', '.t.']), MUSGO_PAL);
// sol sonriente
dib('musgo_sol', musgoForma(20, 20, (x, y) => {
  const r = Math.hypot(x, y), xi = Math.floor(x), yi = Math.floor(y); if (r > 9.3) return;
  if ((xi === -4 || xi === 3) && (yi === -3 || yi === -2)) return 'k';
  if ((yi === 2 && (xi === -4 || xi === 3)) || (yi === 3 && xi >= -3 && xi <= 2)) return 'k';
  if ((xi === -6 || xi === 5) && yi === 0) return 'r';
  if (r > 7.6 && x + y > 0) return 'o';
  return Math.hypot(x + 3.5, y + 4.5) < 2.2 ? 'w' : 'y';
}), { k: INK, y: '#f8d030', o: '#f09030', w: '#fff8c0', r: '#f08060' });
dib('musgo_brillo', musgoBorde(['..w..', '.lwl.', 'wwwww', '.lwl.', '..w..']), MUSGO_PAL);
dib('musgo_mas', musgoBorde(['..wl..', '..ll..', 'wlllll', 'llllgg', '..lg..', '..gg..']), MUSGO_PAL);

Object.assign(ANIM, {
  // DESTELLO: una bombilla de filamento parpadea, se enciende de golpe y deslumbra
  async destello(a, d) {
    const bx = Math.round(lerp(a.cx, d.cx, .3)), by = Math.round(lerp(a.cy, d.cy, .3)) - 4, o = { y: 34, fl: 0, on: 0, r: 0, v: 0, st: 0 }, an0 = Math.atan2(d.cy - by, d.cx - bx);
    snd(t => { osc('sin', [2000, 4000], t, .42, .06, sfxG); osc('p50', [180, 90], t + .42, .08, .12, sfxG); noise(t + .43, .25, .2, sfxG, { f: 6000 }); });
    fx(75, (k, t) => {
      const y = by + Math.round(o.y), gy = y - 9;
      if (o.st) for (let i = 0; i < 3; i++) { const an = t * .22 + i * 2.094; sello('musgo_chispa', d.cx + Math.cos(an) * 17, Math.max(8, musgoTope(d) + 6) + Math.sin(an) * 5, { rot: (t >> 2) + i }); }
      if (!o.v || (o.v < 1 && (t & 1))) return;
      if (o.on) {
        g.globalAlpha = .28; disc(bx, gy, 30 + (t & 2), '#fff8c0'); g.globalAlpha = .4; disc(bx, gy, 21, '#fffce0'); g.globalAlpha = 1;
        for (const da of [-.16, 0, .16]) opl(bx + Math.cos(an0 + da) * 24, gy + Math.sin(an0 + da) * 24, bx + Math.cos(an0 + da) * (24 + 64 * o.r), gy + Math.sin(an0 + da) * (24 + 64 * o.r), '#ffffff', da ? 2 : 4);
        for (let i = 0; i < 12; i++) { const an = i * .5236 + t * .03, L = (i & 1 ? 14 : 28) * o.r, c = Math.cos(an), sn = Math.sin(an); opl(bx + c * 21, gy + sn * 21, bx + c * (21 + L), gy + sn * (21 + L), t & 2 ? '#fff8c0' : '#f8e070', i & 1 ? 2 : 4); }
      }
      sello(o.on || (o.fl && t % 6 < 2) ? 'musgo_bomb1' : 'musgo_bomb0', bx, y, { k: 2 });
    });
    o.v = 1; tw(a.spr, { sy: .9, sx: 1.08 }, 6, 'out'); await tw(o, { y: 0 }, 8, 'back');
    await wait(3); o.fl = 1; await wait(15); o.fl = 0;
    o.on = 1; flash('#ffffff', 1.3); shake(2); d.spr.dark = true; a.spr.white = true; tw(a.spr, { sy: 1, sx: 1 }, 8, 'back'); tw(o, { r: 1 }, 7, 'out'); await wait(3); a.spr.white = false; await wait(21);
    o.on = 0; o.v = .5; o.st = 1; await wait(8); o.v = 0;
    for (let i = 0; i < 16; i++) { d.spr.ox = Math.round(Math.sin(i * .8) * 2); await wait(1); }
    d.spr.dark = false; d.spr.ox = 0;
  },
  // RAICILLA: algo escarba bajo tierra hasta el rival, brotan raíces gordas y una le da un latigazo
  async raicilla(a, d) {
    const s = dirOf(a), g0 = Math.min(96, feet(a) - 2), g1 = Math.min(96, feet(d) - 2), o = { q: 0, h: 0, lat: 0 }, C = ['#8a5c34', '#c89058']; let ft = 0, tg = -99;
    snd(t => { for (let i = 0; i < 6; i++) noise(t + i * .05, .06, .12, sfxG, { f: 900, type: 'lowpass', lo: 1 }); osc('tri', [200, 400], t + .3, .2, .08, sfxG); noise(t + .6, .08, .2, sfxG, { f: [5000, 1500], type: 'bandpass', q: 2 }); });
    const raiz = (bx, h, lean, ph, r) => {
      const n = Math.max(1, Math.round(h / 1.5)), pts = []; for (let i = 0; i <= n; i++) { const q = i / n; pts.push([bx + lean * q * q + Math.sin(q * 5 + ph) * 3 * q, g1 - h * q]); }
      if (h > 14) for (const [q, sg] of [[.35, -1], [.6, 1], [.8, -1]]) { const [x, y] = pts[Math.round(n * q)]; opl(x, y, x + sg * 6, y - 4, C[0], 1); }
      musgoTallo(pts, r, 1, C);
    };
    fx(63, (k, t) => {
      ft = t;
      for (let i = 1; i < 12; i++) { const q = i / 12; if (q > o.q || o.h < 0) break; const x = Math.round(lerp(a.cx, d.cx, q)), y = Math.round(lerp(g0, g1, q)); g.fillStyle = INK; g.fillRect(x - 4, y - 2, 9, 5); g.fillRect(x - 2, y - 3, 5, 1); g.fillStyle = '#8a5c34'; g.fillRect(x - 3, y - 1, 7, 3); g.fillRect(x - 1, y - 2, 3, 1); g.fillStyle = '#c89058'; g.fillRect(x - 2, y - 1, 3, 1); }
      if (o.q > 0 && o.q < 1) { const x = lerp(a.cx, d.cx, o.q), y = lerp(g0, g1, o.q); sello('musgo_terron', x, y - 3 - Math.abs(Math.sin(t * .8)) * 2); if (t % 3 === 0) musgoPolvo(x - s * 5, y, 1); }
      if (o.h > 0) {
        raiz(d.cx + s * 23, 36 * o.h, -s * 8 + Math.sin(t * .2) * 2, 1, 5);
        raiz(d.cx - s * 24, 48 * o.h, s * (o.lat < 0 ? o.lat * 12 : o.lat * 42), 0, 6);
        raiz(d.cx + s * 4, 22 * o.h, s * 4 + Math.sin(t * .25) * 2, 2.5, 4);
        for (const bx of [23, -24, 4]) sello('musgo_terron', d.cx + s * bx, g1 - 1);
      }
      if (t - tg < 6) { const e = t - tg, x = d.cx, y = d.cy - 6; for (let i = 0; i < 6; i++) { const an = i * 1.047 + .4; opl(x + Math.cos(an) * (5 + e * 2), y + Math.sin(an) * (5 + e * 2), x + Math.cos(an) * (12 + e * 3), y + Math.sin(an) * (12 + e * 3), '#ffffff', e < 3 ? 3 : 1); } }
    });
    tw(a.spr, { sy: .86, sx: 1.1 }, 6, 'out'); await tw(o, { q: 1 }, 18, 'io');
    tw(a.spr, { sy: 1, sx: 1 }, 8, 'back'); shake(2); for (const bx of [23, -24, 4]) musgoPolvo(d.cx + s * bx, g1, 3, ['#c89058', '#8a5c34', '#e0d4b0']);
    await tw(o, { h: 1 }, 9, 'back'); await tw(o, { lat: -1 }, 7, 'out'); await tw(o, { lat: 1 }, 4, 'in');
    shake(4); tg = ft; flash('#ffffff', .25); burst(d.cx, d.cy - 6, 10, { c: ['#c89058', '#8a5c34', '#f0dcb0'], v0: 1, v1: 3, ay: .15, s: 2, l0: 14, l1: 24 });
    tw(d.spr, { oy: -8, ox: s * 5 }, 5, 'out'); await wait(5); tw(d.spr, { oy: 0, ox: 0 }, 10, 'bounce'); tw(o, { lat: .55 }, 8, 'out'); await wait(8);
    await tw(o, { h: 0 }, 11, 'in'); o.h = -1;
  },
  // ENREDO: dos tallos de hiedra trepan en espiral por el rival y aprietan… y aprietan
  async enredo(a, d) {
    const gy = Math.min(98, feet(d)) - 2, o = { k: 0, ap: 0, v: 1 }, N = 170, C = [['#3c9a50', '#8ed24a'], ['#2f8244', '#58b858']];
    snd(t => { noise(t, .7, .12, sfxG, { f: [800, 2500], type: 'bandpass', q: 2 }); osc('saw', [90, 130], t + .1, .5, .05, sfxG); });
    fx(78, (k, t) => {
      if (!o.v || (o.v < 1 && (t & 1))) return;
      const R = 22 * (1 - o.ap * .3), n = Math.round(N * o.k);
      for (let v = 0; v < 2; v++) {
        let run = []; const hojas = [];
        for (let i = 0; i <= n; i++) {
          const q = i / N, an = q * Math.PI * 5 + v * Math.PI, c = Math.cos(an), sn = Math.sin(an), x = d.cx + c * R * (1 - q * .2), y = gy - q * 46 + sn * 4;
          if (sn > -.3) { run.push([x, y]); if (i % 14 === 7 || i === n) hojas.push([x + (c > 0 ? 5 : -5), y - 3, c < 0]); } else if (run.length) { musgoTallo(run, 2, 2, C[v]); run = []; }
        }
        if (run.length) musgoTallo(run, 2, 2, C[v]);
        for (const [x, y, f] of hojas) sello('musgo_hiedra', x, y, { fx: f });
      }
    });
    tw(a.spr, { sy: .9, sx: 1.08 }, 6, 'out'); musgoPolvo(d.cx - 20, gy, 3, ['#c89058', '#8ed24a', '#e0d4b0']); musgoPolvo(d.cx + 20, gy, 3, ['#c89058', '#8ed24a', '#e0d4b0']);
    tw(d.spr, { sx: .95 }, 30, 'in'); await tw(o, { k: 1 }, 30, 'io'); tw(a.spr, { sy: 1, sx: 1 }, 8, 'back'); await wait(4);
    await tw(o, { ap: 1 }, 5, 'in');
    snd(t => osc('p50', [400, 150], t, .2, .1, sfxG)); shake(4); d.spr.sx = .74; d.spr.sy = 1.1; d.spr.tint = '#78c850'; await wait(6);
    tw(d.spr, { sx: .88, sy: 1.02 }, 5, 'out'); await tw(o, { ap: .45 }, 5, 'out');
    await tw(o, { ap: 1.2 }, 4, 'in'); snd(t => osc('p50', [300, 90], t, .25, .1, sfxG)); shake(2); d.spr.sx = .68; d.spr.sy = 1.14; sparks(d.cx, d.cy - 20, 5, ['#d8f8a0', '#8ed24a', '#ffffff']);
    for (let i = 0; i < 8; i++) { d.spr.ox = i & 1 ? 1 : -1; await wait(1); } d.spr.ox = 0;
    o.v = 0; musgoHojas(d.cx, d.cy, 10, 22); tw(d.spr, { sx: 1, sy: 1 }, 12, 'elastic'); await wait(14);
  },
  // RIEGO: una regadera grande se inclina y riega al rival con agua parda de abono (y huele)
  async riego(a, d) {
    // la regadera va siempre a la derecha del rival, con el pitorro hacia él (a la izquierda la taparía el marcador)
    const s = -1, cx = Math.round(d.cx + 22), cy = Math.max(14, Math.round(d.cy - 36)), gy = Math.min(97, feet(d)) - 1, rx = cx + s * 23, ry = cy + 11, o = { y: -70, f: 0, len: 0, corte: -1, ch: 0, he: 0, v: 1 }, PARDO = ['#8a5c34', '#c89058', '#6a4428', '#f0dcb0']; let ft = 0;
    const G = Array.from({ length: 5 }, (_, i) => ({ vx: -.7 + i * .5, vy: .2 + (i % 2) * .3, ph: i * 2.3 }));
    snd(t => { osc('tri', [500, 700], t, .2, .06, sfxG); noise(t + .25, .75, .12, sfxG, { f: [5000, 3000], type: 'bandpass', q: 1 }); });
    fx(77, (k, t) => {
      ft = t;
      if (o.ch > .05) { const r = Math.round(o.ch * 17); ell(g, d.cx, gy, r + 1, 3, INK); ell(g, d.cx, gy, r, 2, '#8a5c34'); g.fillStyle = '#c89058'; g.fillRect(d.cx - (r >> 1), gy - 1, Math.max(1, r >> 1), 1); }
      if (o.len > 0) for (const c of G) {
        const P = e => [rx + s * c.vx * e, ry + c.vy * e + .11 * e * e], e0 = o.corte >= 0 ? (t - o.corte) * .8 : 0;
        for (let e = Math.ceil(e0); e < o.len; e++) { if ((e + c.ph - t * .8) % 5 > -1.2 && (e + c.ph - t * .8) % 5 < 0) continue; const [x0, y0] = P(e), [x1, y1] = P(Math.min(o.len, e + 1)); opl(x0, y0, x1, y1, (e + (t >> 1)) & 1 ? '#e0b070' : '#b07c4c', 2); pl(x0, y0, x0, y0, '#f0dcb0', 1); }
        const e = (t * .8 + c.ph * 3) % 14; if (e <= o.len && e >= e0) { const [x, y] = P(e); sello('musgo_gota', x, y + 2); }
      }
      if (o.v) sello('musgo_reg' + o.f, cx, cy + Math.round(o.y), { fx: s < 0, k: 2 });
      if (o.he) for (let i = 0; i < 3; i++) { const x0 = d.cx + (i - 1) * 14, y0 = Math.max(20, musgoTope(d) + 10) - ((t + i * 5) % 12), pts = []; for (let j = 0; j < 5; j++) pts.push([x0 + (j & 1 ? 2 : -2), y0 - j * 3]); path(pts, '#c8d838', 1, 1); }
    });
    tw(a.spr, { sy: .92 }, 6, 'out'); await tw(o, { y: 0 }, 10, 'back'); tw(a.spr, { sy: 1 }, 6, 'back');
    o.f = 1; await wait(3); o.f = 2; await tw(o, { len: 14 }, 16, 'lin');
    shake(3); burst(d.cx, d.cy - 6, 12, { c: PARDO, v0: .6, v1: 2.2, a0: Math.PI, a1: Math.PI * 2, ay: .15, s: 3, shrink: 1, l0: 14, l1: 24 }); d.spr.tint = '#8a5c34'; tw(o, { ch: 1 }, 26, 'out');
    for (let i = 0; i < 26; i++) { d.spr.ox = i & 2 ? 1 : -1; d.spr.sy = .95; if (i % 3 === 0) part({ x: d.cx + rnd(-14, 14), y: d.cy + rnd(-12, 4), vx: rnd(-1.2, 1.2), vy: -rnd(.6, 1.8), ay: .15, life: 16, c: pick(PARDO), s: 2 }); await wait(1); }
    d.spr.ox = 0; o.corte = ft; o.f = 1; o.he = 1; tw(d.spr, { sy: 1 }, 8, 'back'); await wait(9); o.f = 0;
    await tw(o, { y: -74 }, 11, 'in'); o.v = 0;
  },
  // ECHAR RAÍZ: pisotón, raíces que se agarran al suelo a los dos lados y un brote en la coronilla
  async echarraiz(a, d) {
    const gy = Math.min(96, feet(a) - 3), o = { r: 0, h: 0, g: 0, v: 1 }, C = ['#8a5c34', '#c89058'];
    snd(t => { osc('sin', [200, 70], t + .15, .6, .2, sfxG); noise(t + .15, .6, .12, sfxG, { f: 600, type: 'lowpass', lo: 1 }); [330, 392, 494].forEach((f, i) => osc('tri', f, t + .4 + i * .15, .15, .06, sfxG)); });
    await tw(a.spr, { oy: -8, sy: 1.08, sx: .94 }, 6, 'out'); await tw(a.spr, { oy: 3, sy: .84, sx: 1.14 }, 4, 'in');
    shake(2); musgoPolvo(a.cx - 14, gy + 2, 5); musgoPolvo(a.cx + 14, gy + 2, 5); tw(a.spr, { sy: .94, sx: 1.04 }, 8, 'back');
    fx(57, (k, t) => {
      if (o.v < 1 && (t & 1)) return;
      if (o.g > 0 && o.g < 1) ring(a.cx, gy - 4, 10 + o.g * 30, '#8ed24a', 2);
      for (const sg of [-1, 1]) {
        for (let j = 0; j < 3; j++) { const L = [34, 26, 17][j] * o.r, n = Math.round(L / 1.5), pts = []; for (let i = 0; i <= n; i++) { const q = i / Math.max(1, n); pts.push([a.cx + sg * (9 + L * q), Math.min(99, gy + (j - 1) * 3 + Math.sin(q * 4 + j * 2) * 2.5 + q * (j - 1) * 5)]); } if (n > 1) musgoTallo(pts, 3, 1, C); }
        if (o.r > .3) sello('musgo_terron', a.cx + sg * 11, gy, { fx: sg < 0 });
      }
      if (o.h > 1) { // el brote
        const x = a.cx, y0 = musgoTope(a) + 4, h = Math.round(o.h), id = h >= 9 ? 'musgo_hoja' : 'musgo_hojita', L = h >= 9 ? 8 : 5, vai = Math.sin(t * .3) * .12;
        opl(x, y0, x, y0 - h, '#3c9a50', 2);
        if (h >= 12) { musgoHoja(x + 5, y0 - h * .45, -.2, null, 'musgo_hojita'); musgoHoja(x - 5, y0 - h * .45, Math.PI + .2, null, 'musgo_hojita'); }
        if (h >= 4) { musgoHoja(x + Math.cos(-.55 + vai) * L, y0 - h + Math.sin(-.55 + vai) * L, -.55 + vai, null, id); musgoHoja(x - Math.cos(-.55 - vai) * L, y0 - h + Math.sin(-.55 - vai) * L, Math.PI + .55 + vai, null, id); }
      }
    });
    tw(o, { r: 1 }, 20, 'out'); await wait(10);
    tw(o, { h: 7 }, 7, 'back'); await wait(10); tw(o, { h: 14 }, 8, 'back'); await wait(9);
    tw(o, { g: 1 }, 14, 'out'); burst(a.cx, a.cy - 6, 12, { c: ['#8ed24a', '#d8f8a0', '#ffffff'], v0: .8, v1: 2.2, kind: 'star', l0: 16, l1: 28 }); a.spr.tint = '#8ed24a'; await wait(4); a.spr.tint = null; await wait(14);
    o.v = .5; await reposo(a);
  },
  // HOJARASCA: un remolino de hojas afiladas se forma, viaja hasta el rival y lo trocea
  async hojarasca(a, d) {
    const s = dirOf(a), o = { x: a.cx, y: a.cy - 4, R: 4, H: 4, v: 1 }, cortes = []; let ft = 0;
    const L = Array.from({ length: 14 }, (_, i) => ({ ph: i * 2.4, hh: ((i * 5) % 14) / 13, sp: .3 + (i % 3) * .06, gi: i * .9 }));
    snd(t => { noise(t, 1, .2, sfxG, { f: [1500, 4000], type: 'bandpass', q: 1.5, swell: 1 }); for (let i = 0; i < 5; i++) noise(t + .43 + i * .1, .05, .15, sfxG, { f: 6000 }); });
    fx(67, (k, t) => {
      ft = t;
      for (let j = 0; j < 4; j++) { const hh = j / 3, yy = o.y + o.H * (1 - 2 * hh), rr = o.R * (.55 + hh * .6); for (let m = 0; m < 9; m++) { const an = t * .5 + j * 1.9 - m * .15; px(o.x + Math.cos(an) * rr - 1, yy + Math.sin(an) * rr * .28 - 1, m < 3 ? '#ffffff' : '#d8f8a0', m < 5 ? 2 : 1); } }
      for (const l of L) { if (o.v < 1 && ((t + l.gi | 0) & 1)) continue; const an = l.ph + t * l.sp, rr = o.R * (.55 + l.hh * .6); musgoHoja(o.x + Math.cos(an) * rr, o.y + o.H * (1 - 2 * l.hh) + Math.sin(an) * rr * .28, t * .45 + l.gi); }
      for (const c of cortes) { const e = t - c.t; if (e > 6) continue; const q = Math.min(1, (e + 1) / 3), x0 = d.cx - c.sg * 22, x1 = x0 + c.sg * 44 * q, y1 = c.y + c.dy * 16 * q; opl(x0, c.y, x1, y1, '#ffffff', e < 4 ? 3 : 1); if (e < 4) pl(x0, c.y + 1, x1, y1 + 1, '#8ed24a', 1); }
    });
    tw(a.spr, { ox: -s * 5, sy: .92 }, 8, 'out'); await tw(o, { R: 18, H: 20 }, 14, 'out');
    tw(a.spr, { ox: s * 4, sy: 1 }, 5, 'out'); await tw(o, { x: d.cx, y: d.cy - 2 }, 11, 'in');
    shake(4); flash('#d8f8a0', .25); tw(o, { R: 25, H: 24 }, 8, 'out'); reposo(a);
    for (let i = 0; i < 5; i++) {
      cortes.push({ t: ft, sg: i & 1 ? -1 : 1, y: d.cy - 16 + ((i * 11) % 26), dy: i % 3 - 1 }); d.spr.ox = i & 1 ? 3 : -3;
      for (let j = 0; j < 4; j++) part({ x: d.cx + rnd(-10, 10), y: d.cy + rnd(-12, 10), vx: rnd(-2, 2), vy: -rnd(.5, 2), ay: .15, life: 18, c: pick(['#8ed24a', '#3c9a50', '#d8f8a0']), s: 2 });
      await wait(6);
    }
    d.spr.ox = 0; o.v = .5; tw(o, { R: 64, H: 40 }, 10, 'in'); await wait(10);
  },
  // FOTOSÍNTESIS: sale un sol sonriente, sus rayos bañan al atacante y brotan destellos verdes
  async fotosintesis(a, d) {
    const s = dirOf(a), sx = Math.round(a.cx + (s > 0 ? 26 : -15)), sy = Math.max(17, Math.round(a.cy - 32)), gy = Math.min(98, feet(a)), o = { y: -48, b: 0, v: 1 };
    snd(t => [523, 659, 784, 988, 1175].forEach((f, i) => osc('tri', f, t + .25 + i * .12, .4, .07, sfxG, { vib: 1 })));
    fx(67, (k, t) => {
      const y = sy + Math.round(o.y);
      if (o.b > 0) {
        const y1 = lerp(y, gy, o.b);
        for (let i = 0; i < 3; i++) { const tx = a.cx + (i - 1) * 17, w1 = 10 + Math.round(Math.sin(t * .2 + i * 2) * 2); g.globalAlpha = (i === 1 ? .45 : .3) * o.v; g.fillStyle = i === 1 ? '#fffce0' : '#fff8c0'; for (let yy = y + 6; yy < y1; yy++) { const q = (yy - y) / (gy - y), w = Math.round(lerp(4, w1, q)); g.fillRect(Math.round(lerp(sx, tx, q)) - (w >> 1), yy, w, 1); } }
        g.globalAlpha = 1;
        if (o.b >= 1 && o.v >= 1) for (let j = 0; j < 8; j++) { const e = (t * 1.1 + j * 7) % 46; sello(j % 3 ? 'musgo_brillo' : 'musgo_mas', a.cx + ((j * 23) % 46) - 23 + Math.sin(t * .1 + j) * 2, gy - 4 - e, { k: j % 4 === 1 ? 2 : 1, a: e > 38 ? .5 : 1 }); }
      }
      for (let i = 0; i < 8; i++) { const an = i * .7854 + t * .05, L = (i + (t >> 3)) & 1 ? 18 : 15, c = Math.cos(an), sn = Math.sin(an); opl(sx + c * 12, y + sn * 12, sx + c * L, y + sn * L, '#f8d030', 3); }
      sello('musgo_sol', sx, y);
    });
    tw(a.spr, { sy: .94 }, 6, 'out'); await tw(o, { y: 0 }, 12, 'back');
    await tw(o, { b: 1 }, 9, 'in'); flash('#fff8c0', .3); tw(a.spr, { sy: 1 }, 6, 'back');
    for (let i = 0; i < 34; i++) { a.spr.tint = (i >> 2) & 1 ? '#c4f094' : null; a.spr.oy = -Math.round(Math.abs(Math.sin(i * .28)) * 3); if (i === 8 || i === 20) burst(a.cx, a.cy, 8, { c: ['#8ed24a', '#c4f094', '#fff8c0'], v0: .6, v1: 1.8, kind: 'star', l0: 18, l1: 30 }); await wait(1); }
    a.spr.tint = null; a.spr.oy = 0; tw(o, { v: 0 }, 8, 'lin'); await tw(o, { y: -52 }, 11, 'in');
  },
  // SELVA: helechos, lianas y monsteras enormes invaden la pantalla y se cierran de golpe sobre el rival
  async selva(a, d) {
    const o = { q: 0, c: 0, j: 0 };
    snd(t => { noise(t, 1, .2, sfxG, { f: [400, 3000], type: 'bandpass', q: .8, swell: 1 }); [196, 247, 294, 392].forEach((f, i) => osc('tri', f, t + .1 + i * .12, .4, .07, sfxG)); osc('sin', [80, 40], t + .66, .4, .3, sfxG); });
    const frond = (x, y, L, an, c1, c2) => { if (L < 3) return; const ex = x + Math.cos(an) * L, ey = y + Math.sin(an) * L; for (let i = 2; i < L; i += 3) { const bx = x + Math.cos(an) * i, by = y + Math.sin(an) * i, w = Math.sin(i / L * Math.PI) * 9 + 1; for (const sg of [-1, 1]) { const tx = bx + Math.cos(an + sg * 1.1) * w, ty = by + Math.sin(an + sg * 1.1) * w; pl(bx, by, tx, ty, INK, 4); } } for (let i = 2; i < L; i += 3) { const bx = x + Math.cos(an) * i, by = y + Math.sin(an) * i, w = Math.sin(i / L * Math.PI) * 9 + 1; for (const sg of [-1, 1]) pl(bx, by, bx + Math.cos(an + sg * 1.1) * w, by + Math.sin(an + sg * 1.1) * w, sg > 0 ? c2 : c1, 2); } pl(x, y, ex, ey, '#1f6a3a', 2); };
    const F = []; for (let i = 0; i < 7; i++) F.push({ x: -2, y: 6 + i * 15, an: -.3 + i * .09, L: 30 + (i * 7) % 14 }, { x: W + 2, y: 4 + i * 15, an: Math.PI + .3 - i * .09, L: 30 + (i * 5) % 14 }); for (let i = 0; i < 6; i++) F.push({ x: 10 + i * 28, y: -2, an: Math.PI / 2 + ((i * 5) % 7 - 3) * .1, L: 22 + (i * 5) % 13 });
    // monsteras: sitio, giro, espejo, por dónde entran y dónde caen sobre el rival
    const M = [[12, 48, 3, 0, -1, 0, -14, -2], [150, 34, 1, 0, 1, 0, 14, 2], [100, 8, 0, 0, 0, -1, 2, -15], [40, 94, 2, 0, 0, 1, -3, 14], [136, 6, 0, 1, 0, -1, -9, -9], [70, 40, 3, 1, -1, -1, 9, 10]];
    fx(63, (k, t) => {
      const q = Math.max(0, o.q);
      g.globalAlpha = .45 * Math.min(1, q); g.fillStyle = '#062810'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
      F.forEach((f, i) => frond(f.x, f.y, f.L * q, f.an + Math.sin(t * .08 + i) * .06 + (o.j ? ((t + i) & 2 ? .05 : -.05) : 0), i & 1 ? '#2f8244' : '#3c9a50', i & 1 ? '#8ed24a' : '#58b858'));
      [22, 58, 96, 142].forEach((x0, i) => { const Ln = (50 + (i * 17) % 30) * q, pts = []; for (let y = 0; y <= Ln; y += 1.5) pts.push([x0 + Math.sin(y * .07 + t * .09 + i * 2) * 5 * (y / 60), y - 3]); if (pts.length < 3) return; musgoTallo(pts, 2, 1, ['#3c9a50', '#8ed24a']); for (let j = 8; j < pts.length; j += 9) musgoHoja(pts[j][0] + (j & 1 ? 7 : -7), pts[j][1] + 3, j & 1 ? .6 : Math.PI - .6); });
      if (o.j && !o.c && (t % 14) > 2) for (const [ex, ey] of [[150, 56], [8, 22]]) { g.fillStyle = INK; g.fillRect(ex - 4, ey - 1, 9, 4); g.fillStyle = '#f8e070'; g.fillRect(ex - 3, ey, 2, 2); g.fillRect(ex + 2, ey, 2, 2); }
      M.forEach(([x, y, rot, fl, ox, oy, dx, dy], i) => { const far = i === 5 ? 90 : 44, hx = x + ox * far * (1 - q), hy = y + oy * far * (1 - q), jx = o.j ? ((t + i) & 2 ? 1 : -1) : 0; sello('musgo_monstera', lerp(hx, d.cx + dx, o.c) + jx, lerp(hy, d.cy + dy, o.c), { rot, fx: fl }); });
    });
    tw(a.spr, { sy: .9, sx: 1.08 }, 8, 'out'); await tw(o, { q: 1 }, 24, 'out'); tw(a.spr, { sy: 1, sx: 1 }, 8, 'back');
    o.j = 1; await wait(8); o.j = 0; await tw(o, { c: 1 }, 7, 'in');
    shake(6); flash('#2f8244', .5); d.spr.tint = '#2f8244'; d.spr.sy = .72; d.spr.sx = 1.15; snd(t => noise(t, .3, .3, sfxG, { f: [2000, 300], type: 'lowpass' })); o.j = 1; await wait(9); o.j = 0;
    musgoHojas(d.cx, d.cy, 14, 24, 3.2); tw(d.spr, { sy: 1, sx: 1 }, 14, 'elastic'); tw(o, { c: 0 }, 8, 'out'); await tw(o, { q: 0 }, 14, 'in');
  },
});

// ═════════ CHISPA ═════════
// CHISPA
// ── dibujos ──
dib('chispa_pum', [
  '.......k.......',
  '......kwk......',
  '..k...kwk...k..',
  '.kyk.kywyk.kyk.',
  '..kykkywykkyk..',
  '...kyyywyyyk...',
  '.kkkyywwwyykkk.',
  'kwwwwwwwwwwwwwk',
  '.kkkyywwwyykkk.',
  '...kyyywyyyk...',
  '..kykkywykkyk..',
  '.kyk.kywyk.kyk.',
  '..k...kwk...k..',
  '......kwk......',
  '.......k.......'], { k: '#1c2c88', y: '#f8d030', w: '#ffffff' });
dib('chispa_pum2', [
  '...............',
  '..k.........k..',
  '.kyk...k...kyk.',
  '..kyk.kwk.kyk..',
  '...kykkwkkyk...',
  '....kywwwyk....',
  '..kkkwwwwwkkk..',
  '.kwwwwwwwwwwwk.',
  '..kkkwwwwwkkk..',
  '....kywwwyk....',
  '...kykkwkkyk...',
  '..kyk.kwk.kyk..',
  '.kyk...k...kyk.',
  '..k.........k..',
  '...............'], { k: '#1c2c88', y: '#fff070', w: '#ffffff' });
{
  const pelado = [
    '...........kcc..',
    'kkkkkkk..kkcck..',
    'krrrrrkkkcckk...',
    'krhhrrkcccccchk.',
    'krrrrrkccccccchk',
    'krrrrrkccccccck.',
    'krssssrkkcckk...',
    'kkkkkkk..kkcck..',
    '...........kcc..'];
  dib('chispa_pelado_r', pelado, { k: INK, r: '#e84848', h: '#ffa8a0', s: '#a02838', c: '#f0a040' });
  dib('chispa_pelado_a', pelado, { k: INK, r: '#4880e8', h: '#a8d0ff', s: '#2848a0', c: '#f0a040' });
  const A = 'kwwwwwwwwwwwwwwk', T = 'kwkwwwwwwwwwwkwk', ST = 'kwwwkkkkkkkkwwwk', SL = 'kwwwkddddddkwwwk';
  dib('chispa_placa', ['.kkkkkkkkkkkkkk.', A, T, A, ST, ...Array(12).fill(SL), ST, A, T, 'kssssssssssssssk', '.kkkkkkkkkkkkkk.'], { k: INK, w: '#f0ece0', s: '#b8b4a8', d: '#3c3c48' });
}
dib('chispa_enchufe', [
  '..kkkkkk......',
  '.kwwwwwwk.kkkk',
  'kwhhwwwwwkmmmk',
  'kwhwwwwwwk.kkk',
  'kwwwwwwwwk....',
  'kwwwwwwwwk....',
  'kwwwwwwwwk.kkk',
  'kwwwwwwsskmmmk',
  '.kssssssk.kkkk',
  '..kkkkkk......'], { k: INK, w: '#e8e4d8', h: '#ffffff', s: '#a8a498', m: '#f0c048' });
dib('chispa_peligro', [
  '..........k..........',
  '.........kyk.........',
  '........kyyyk........',
  '........kyyyk........',
  '.......kyyyyyk.......',
  '.......kyykkyk.......',
  '......kyyykkyyk......',
  '......kyykkyyyk......',
  '.....kyyykkyyyyk.....',
  '.....kyykkkkkyyk.....',
  '....kyyyyykkkyyyk....',
  '....kyyyyykkyyyyk....',
  '...kyyyyykkyyyyyyk...',
  '...kyyyyykyyyyyyyk...',
  '..kyyyyyyyyyyyyyyyk..',
  '..kyyyyyyyyyyyyyyyk..',
  '.kooooooooooooooooook',
  '.kkkkkkkkkkkkkkkkkkkk'], { k: INK, y: '#f8d030', o: '#d09018' });
dib('chispa_aislador', ['.kkk.', 'kgggk', '.kwk.', 'kgggk', '.kwk.', 'kgggk', '.kkk.'], { k: INK, g: '#58c8a0', w: '#e8f8f0' });
dib('chispa_aislador_on', ['.kkk.', 'kgggk', '.kwk.', 'kgggk', '.kwk.', 'kgggk', '.kkk.'], { k: '#1c2c88', g: '#fff070', w: '#ffffff' });
dib('chispa_pila', [
  '.kkkkkkkkkkkkkkkkkk...',
  'kwwwwwwwwwwwwwwwwwwk..',
  'kwkkkkkkkkkkkkkkkkwkk.',
  'kwkddddddddddddddkwkmk',
  'kwkddddddddddddddkwkmk',
  'kwkddddddddddddddkwkmk',
  'kwkddddddddddddddkwkmk',
  'kwkddddddddddddddkwkmk',
  'kwkddddddddddddddkwkmk',
  'kskkkkkkkkkkkkkkkkskk.',
  'kssssssssssssssssssk..',
  '.kkkkkkkkkkkkkkkkkk...'], { k: INK, w: '#e8ecf4', s: '#98a0b4', d: '#2c2c3c', m: '#f0c048' });

// ── ayudantes de CHISPA ──
const chispaH = n => { const v = Math.sin(n * 127.1 + 11.3) * 43758.5453; return v - Math.floor(v); };
// zigzag dibujado (no al azar): dientes alternos a un lado y a otro; la semilla cambia el dibujo
function chispaZig(x0, y0, x1, y1, n, amp, seed = 0) {
  const pts = [[x0, y0]], nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
  for (let i = 1; i < n; i++) { const k = (i + (chispaH(seed + i * 3.7) - .5) * .5) / n, j = (i & 1 ? 1 : -1) * amp * (.55 + .45 * chispaH(seed * 1.3 + i)); pts.push([lerp(x0, x1, k) + nx / l * j, lerp(y0, y1, k) + ny / l * j]); }
  pts.push([x1, y1]); return pts;
}
function chispaCorta(pts, k) { k = clamp(k, 0, 1) * (pts.length - 1); const i = Math.floor(k), f = k - i, out = pts.slice(0, i + 1); if (i < pts.length - 1) out.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]); return out; }
function chispaSeg(pts, c, w) { for (let i = 1; i < pts.length; i++) pl(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], c, w); }
// rayo gordo: halo azul, contorno azul oscuro, cuerpo amarillo, núcleo blanco
function chispaRayo(pts, t, w = 4) {
  if (pts.length < 2) return;
  g.globalAlpha = .4; chispaSeg(pts, '#58b8f8', w + 6); g.globalAlpha = 1;
  chispaSeg(pts, '#1c2c88', w + 2); chispaSeg(pts, t & 1 ? '#f8d030' : '#fff070', w);
  if (w >= 3) chispaSeg(pts, '#ffffff', w >= 5 ? w - 3 : 1);
}
function chispaBola(x, y, r, t) { x = Math.round(x); y = Math.round(y); g.globalAlpha = .4; disc(x, y, r + 4, '#58b8f8'); g.globalAlpha = 1; disc(x, y, r + 1, '#1c2c88'); disc(x, y, r, t & 1 ? '#f8d030' : '#fff070'); if (r > 1) disc(x, y, r - 2, '#ffffff'); }
// chispas sueltas que NO cuentan como golpe (no usan burst)
function chispaChis(x, y, n = 6, v = 3) { for (let i = 0; i < n; i++) { const an = rnd(0, Math.PI * 2), sp = rnd(1, v); part({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, ay: .15, drag: .95, life: 10 + Math.floor(rnd(12)), c: pick(['#fff8c0', '#f8d030', '#ffffff']), s: 3, shrink: 1 }); } }
function chispaHumo(x, y, n = 3) { for (let i = 0; i < n; i++) part({ x: x + rnd(-10, 10), y: y + rnd(-6, 6), vx: rnd(-.3, .3), vy: -rnd(.5, 1.1), life: 26 + Math.floor(rnd(14)), c: pick(['#24242c', '#3c3c48', '#54545e']), s: Math.round(rnd(4, 7)), kind: 'puff' }); }
// púas de «pelos de punta» alrededor de una criatura
function chispaPuas(cx, cy, r, t, n = 12) { for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2 + .26, alt = (i + (t >> 1)) & 1, L = alt ? 10 : 5, c = Math.cos(an), sn = Math.sin(an) * .92; opl(cx + c * r, cy + sn * r, cx + c * (r + L), cy + sn * (r + L), alt ? '#fff070' : '#ffffff', 2); } }
function chispaPum(x, y, t, k = 2) { sello(t & 2 ? 'chispa_pum2' : 'chispa_pum', x, y, { k, rot: (t >> 2) & 1 }); }
function chispaCaja(x, y, w, h, c) { g.fillStyle = INK; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = c; g.fillRect(x, y, w, h); }
// torre de alta tensión (pies en x,y; 50 px de alto)
function chispaTorre(x, y, t, vivo) {
  const c = '#b0b8cc', c2 = '#6c7490', lx = h => 11 - h * 8 / 46;
  for (let h = 0; h < 44; h += 11) { pl(x - lx(h), y - h, x + lx(h + 11), y - h - 11, c2, 1); pl(x + lx(h), y - h, x - lx(h + 11), y - h - 11, c2, 1); pl(x - lx(h), y - h, x + lx(h), y - h, c2, 1); }
  opl(x - 11, y, x - 3, y - 46, c, 2); opl(x + 11, y, x + 3, y - 46, c, 2);
  chispaCaja(x - 16, y - 41, 33, 2, c); chispaCaja(x - 12, y - 29, 25, 2, c); chispaCaja(x - 1, y - 52, 3, 7, c);
  const ais = vivo && (t & 1) ? 'chispa_aislador_on' : 'chispa_aislador';
  sello(ais, x - 15, y - 34); sello(ais, x + 16, y - 34); sello(ais, x - 11, y - 22); sello(ais, x + 12, y - 22);
  chispaCaja(x - 13, y, 5, 2, c2); chispaCaja(x + 9, y, 5, 2, c2);
}

Object.assign(ANIM, {
  async calambre(a, d) { // un rayito gordo y dentado salta al rival y lo deja con los pelos de punta
    const s = dirOf(a), ox = a.cx + s * 14, oy = a.cy - 8;
    snd(t => { osc('p12', [500, 1700], t, .18, .07, sfxG); for (let i = 0; i < 6; i++) osc('p12', 1200 + Math.random() * 1800, t + .2 + i * .06, .05, .1, sfxG); noise(t + .33, .08, .25, sfxG, { f: 5000 }); });
    tw(a.spr, { sx: .9, sy: 1.1 }, 10, 'out');
    await fx(12, (k, t) => { chispaBola(ox, oy, 2 + Math.round(k * 4), t); if (t % 3 === 0) chispaChis(ox, oy, 2, 2); });
    a.spr.sx = 1.12; a.spr.sy = .9; tw(a.spr, { sx: 1, sy: 1 }, 12, 'elastic');
    const rayo = chispaZig(ox, oy, d.cx, d.cy, 5, 13, 3);
    await fx(8, (k, t) => { const p = chispaCorta(rayo, k * 1.15), u = p[p.length - 1]; chispaRayo(p, t, 4); chispaBola(u[0], u[1], 3, t); chispaBola(ox, oy, 5, t); });
    shake(4); flash('#fff8a0', .5); sparks(d.cx, d.cy, 12);
    await fx(24, (k, t) => {
      if (t < 8) chispaRayo(t < 4 ? rayo : rayo.slice(2), t, t < 4 ? 5 : 3);
      d.spr.ox = t < 16 ? (t & 1 ? 2 : -2) : 0; d.spr.white = t < 14 && ((t >> 1) & 1);
      chispaPuas(d.cx, d.cy, 23, t);
      if (t < 6) chispaPum(d.cx, d.cy, t, 2);
      else if ((t >> 2) & 1) chispaRayo(chispaZig(d.cx - 16, d.cy - 12 + (t & 4) * 2, d.cx + 16, d.cy + 10 - (t & 4) * 2, 4, 6, t >> 2), t, 2);
    });
    d.spr.ox = 0; d.spr.white = false; d.spr.tint = '#f8e070';
  },

  async cortocircuito(a, d) { // dos cables pelados se tocan sobre el rival: chispazo y humo negro
    snd(t => { osc('p12', [200, 500], t, .3, .04, sfxG); noise(t + .35, .5, .25, sfxG, { f: 3000 }); for (let i = 0; i < 8; i++) osc('p12', Math.random() * 3000 + 500, t + .35 + i * .06, .03, .1, sfxG); osc('p50', [400, 60], t + .85, .3, .15, sfxG); });
    const y = Math.round(clamp(d.cy - 2, 22, 120)), o = { gap: 70 };
    const cables = () => {
      for (const sd of [-1, 1]) {
        const cx = Math.round(d.cx + sd * (o.gap + 16)), x1 = cx + sd * 10, x0 = sd < 0 ? -8 : W + 8, y0 = y - 30, pts = [];
        for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([lerp(x0, x1, u), y0 + (y - y0) * (1 - (1 - u) * (1 - u))]); }
        chispaSeg(pts, INK, 14); chispaSeg(pts, sd < 0 ? '#e84848' : '#4880e8', 10);
        chispaSeg(pts.map(p => [p[0], p[1] - 3]), sd < 0 ? '#ffa8a0' : '#a8d0ff', 2);
        sello(sd < 0 ? 'chispa_pelado_r' : 'chispa_pelado_a', cx, y, { k: 2, fx: sd > 0 });
      }
    };
    tw(o, { gap: 7 }, 13, 'out'); await fx(13, cables);
    await fx(9, (k, t) => { o.gap = 7 - Math.round(k * 4) + (t & 1); cables(); chispaRayo(chispaZig(d.cx - o.gap, y, d.cx + o.gap, y, 3, 3, t), t, 2); if (t % 3 === 0) chispaChis(d.cx, y, 2, 2); });
    o.gap = 0; flash('#ffffff', .7); shake(5); sparks(d.cx, y, 14);
    await fx(26, (k, t) => {
      d.spr.dark = (t % 6) < 3; d.spr.ox = t < 18 ? (t & 1 ? 2 : -2) : 0;
      for (const sd of [-1, 1]) if ((t >> 1) % 2 === (sd > 0 ? 1 : 0)) chispaRayo(chispaZig(d.cx, y, d.cx + sd * (12 + (t % 5) * 2), Math.min(feet(d), y + 28), 4, 6, t >> 1), t, 3);
      cables(); chispaPum(d.cx, y, t, t < 6 ? 3 : 2);
      if (t % 4 === 0) { chispaChis(d.cx, y, 4, 4); chispaHumo(d.cx, y - 8, 2); }
    });
    d.spr.dark = false; d.spr.ox = 0; chispaHumo(d.cx, d.cy - 8, 6);
    tw(o, { gap: 90 }, 9, 'in'); await fx(9, (k, t) => { cables(); if (t % 3 === 0) chispaHumo(d.cx, d.cy - 10, 2); });
  },

  async latigazo(a, d) { // el cable con enchufe restalla como un látigo y deja la marca
    const s = dirOf(a), hx = a.cx + s * 8, hy = a.cy - 6;
    snd(t => { noise(t + .08, .25, .1, sfxG, { f: [400, 3000], type: 'bandpass', swell: 1 }); noise(t + .33, .05, .4, sfxG, { f: 5000 }); osc('p12', 3000, t + .33, .05, .1, sfxG); osc('p12', [1800, 900], t + .36, .12, .06, sfxG); });
    const atras = [a.cx - s * 30, clamp(a.cy - 30, 12, 200)], alto = [lerp(a.cx, d.cx, .5), Math.max(4, Math.min(a.cy, d.cy) - 40)];
    const tip = { x: hx, y: hy }, estela = [];
    const latigo = (cbx, cby, haciaRival) => {
      const mx = (hx + tip.x) / 2 + cbx, my = (hy + tip.y) / 2 + cby, pts = [];
      for (let i = 0; i <= 12; i++) { const u = i / 12, v = 1 - u; pts.push([v * v * hx + 2 * v * u * mx + u * u * tip.x, v * v * hy + 2 * v * u * my + u * u * tip.y]); }
      chispaSeg(pts, INK, 5); chispaSeg(pts, '#585868', 3); chispaSeg(pts.filter((p, i) => i % 3 === 1).map(p => [p[0], p[1] - 1]), '#9090a4', 1);
      sello('chispa_enchufe', tip.x, tip.y, { k: 2, fx: haciaRival ? s < 0 : s > 0 });
    };
    tw(a.spr, { ox: -s * 5, sx: .92, sy: 1.08 }, 12, 'out'); tw(tip, { x: atras[0], y: atras[1] }, 12, 'out');
    await fx(13, () => latigo(0, 12, false));
    tw(a.spr, { ox: s * 7, sx: 1.08, sy: .94 }, 6, 'out');
    await fx(7, (k, t) => {
      const u = k * k, v = 1 - u; tip.x = v * v * atras[0] + 2 * v * u * alto[0] + u * u * d.cx; tip.y = v * v * atras[1] + 2 * v * u * alto[1] + u * u * d.cy;
      estela.push([tip.x, tip.y]); g.globalAlpha = .7; chispaSeg(estela, '#fff8c0', 4); g.globalAlpha = 1; chispaSeg(estela, '#ffffff', 2);
      latigo(-s * 16 * (1 - k), -22 * Math.sin(k * Math.PI), true);
    });
    tip.x = d.cx; tip.y = d.cy; shake(4); flash('#fff8c0', .5); sparks(d.cx, d.cy, 14); tw(d.spr, { ox: s * 8, oy: -s * 2 }, 4, 'out');
    const marca = chispaZig(d.cx - 17, d.cy - 15, d.cx + 17, d.cy + 13, 5, 7, 2);
    tw(a.spr, { ox: 0, oy: 0, sx: 1, sy: 1 }, 14, 'out');
    await fx(6, (k, t) => { latigo(0, -3, true); chispaPum(d.cx, d.cy, t, 3); d.spr.white = t < 4; });
    d.spr.white = false; tw(d.spr, { ox: 0, oy: 0 }, 12, 'back'); tw(tip, { x: hx, y: hy }, 9, 'in');
    await fx(16, (k, t) => { if (t < 9) latigo(0, 14 * Math.sin(k * 5), false); if (t < 12 || (t & 1)) chispaRayo(marca, t, 3); if (t % 4 === 0) chispaChis(d.cx + rnd(-10, 10), d.cy + rnd(-10, 10), 2, 2); });
  },

  async descarga(a, d) { // arco eléctrico gordo y ramificado entre los dos
    const s = dirOf(a), ax = a.cx + s * 12, ay = a.cy - 6;
    snd(t => { osc('p12', [300, 1500], t, .22, .06, sfxG); noise(t + .26, .6, .2, sfxG, { f: [4000, 2000], type: 'bandpass', q: 3 }); osc('saw', 120, t + .26, .6, .08, sfxG, { sus: 1, vib: 1 }); });
    tw(a.spr, { sx: .92, sy: 1.08 }, 10, 'out');
    await fx(12, (k, t) => {
      for (let i = 0; i < 3; i++) { const an = i * 2.1 + t * .5, r = 22 - k * 9; chispaRayo(chispaZig(ax + Math.cos(an) * r, ay + Math.sin(an) * r, ax, ay, 3, 3, t + i), t, 2); }
      chispaBola(ax, ay, 3 + Math.round(k * 5), t);
    });
    a.spr.sx = 1.1; a.spr.sy = .92; tw(a.spr, { sx: 1, sy: 1 }, 12, 'elastic');
    const arco = n => chispaZig(ax, ay, d.cx, d.cy, 7, 11, n * 7.3);
    await fx(4, (k, t) => { chispaRayo(chispaCorta(arco(0), k + .25), t, 5); chispaBola(ax, ay, 8, t); });
    shake(5); flash('#f8f0a0', .6); sparks(d.cx, d.cy, 10);
    await fx(30, (k, t) => {
      const n = t >> 1, pts = arco(n % 3), w = k > .8 ? 3 : (t & 2 ? 6 : 5);
      for (const i of [2, 4, 5]) { const p = pts[i], h = chispaH(n * 3.1 + i), up = i === 4 ? 1 : -1; chispaRayo(chispaZig(p[0], p[1], p[0] + (h - .5) * 40, clamp(p[1] + up * (14 + h * 14), 3, H - 44), 3, 4, n + i), t, 2); }
      chispaRayo(pts, t, w); chispaBola(ax, ay, 7 + (t & 1), t);
      if (k < .85) chispaPum(d.cx, d.cy, t, t < 6 ? 3 : 2);
      d.spr.white = (t >> 1) & 1; d.spr.ox = k < .8 ? (t & 1 ? 2 : -2) : 0;
      if (t % 8 === 4) flash('#f8f0a0', .2); if (t % 4 === 0) chispaChis(d.cx + rnd(-12, 12), d.cy + rnd(-12, 12), 3);
    });
    d.spr.white = false; d.spr.ox = 0; d.spr.tint = '#f8e070'; chispaChis(d.cx, d.cy, 8, 4);
    await fx(6, (k, t) => { chispaPuas(d.cx, d.cy, 23, t, 10); });
  },

  async altatension(a, d) { // cae la torre, cae el cartel de PELIGRO y la torre suelta un rayo enorme
    const s = dirOf(a), tx = 64, tp = 78;   // en el hueco libre entre los dos, fuera de los marcadores
    const sy1 = Math.round(clamp(d.cy - 4, 22, 200)), o = { ty: -90, sy: -30 };
    const torre = (t, vivo) => chispaTorre(tx, tp + Math.round(o.ty), t, vivo);
    snd(t => { noise(t + .14, .12, .3, sfxG, { f: [900, 120], type: 'lowpass' }); osc('p50', [880, 880], t + .3, .12, .1, sfxG); osc('p50', [880, 880], t + .5, .12, .1, sfxG); osc('saw', [60, 240], t + .3, .45, .05, sfxG, { sus: 1 }); });
    tw(o, { ty: 0 }, 9, 'in'); await fx(9, (k, t) => torre(t, 0));
    shake(2); dust(tx, tp + 2, 10);
    tw(o, { sy: sy1 }, 12, 'bounce');
    await fx(13, (k, t) => { torre(t, 0); sello('chispa_peligro', d.cx, o.sy, { k: 2 }); });
    await fx(13, (k, t) => {
      torre(t, 1); sello('chispa_peligro', d.cx + (t & 2 ? 1 : -1), sy1, { k: 2 });
      if ((t >> 1) & 1) { txtO('!', d.cx - 26, sy1 - 14, '#e84848'); txtO('!', d.cx + 24, sy1 - 14, '#e84848'); }
      if (t % 3 === 0) chispaChis(tx + (t & 1 ? -15 : 16), tp - 34, 2, 2);
      chispaBola(tx + s * 16, tp - 36, 2 + Math.round(k * 4), t);
    });
    snd(t => { noise(t, 1, .4, sfxG, { f: [5000, 100], type: 'lowpass' }); osc('saw', [100, 30], t, .8, .25, sfxG, { sus: 1 }); });
    flash('#ffffff', 1.2); shake(8); sparks(d.cx, d.cy + 4, 22);
    const p0 = [tx + s * 16, tp - 36], p1 = [tx, tp - 52];
    await fx(26, (k, t) => {
      if (t < 4) { g.globalCompositeOperation = 'difference'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
      torre(t, 1);
      const n = t >> 1, w = k > .75 ? 3 : (t & 2 ? 7 : 6);
      chispaRayo(chispaZig(p1[0], p1[1], d.cx - s * 4, d.cy - 12, 5, 9, n * 3 + 1).concat([[d.cx - s * 2, feet(d) - 2]]), t, Math.max(2, w - 3));
      chispaRayo(chispaZig(p0[0], p0[1], d.cx, d.cy, 5, 9, n * 5).concat([[d.cx + s * 3, feet(d) - 2]]), t, w);
      chispaBola(p0[0], p0[1], 5 + (t & 1), t);
      if (k < .8) chispaPum(d.cx, d.cy, t, 3);
      // el cartel sale volando, chamuscado
      sello('chispa_peligro', d.cx + s * t * 2.2, sy1 - t * 3.4 + t * t * .13, { k: t < 8 ? 2 : 1, rot: t >> 1 });
      d.spr.white = t & 1; d.spr.ox = k < .8 ? (t & 1 ? 3 : -3) : 0;
      if (t % 5 === 0) chispaChis(d.cx + rnd(-14, 14), feet(d) - 4, 4, 4);
    });
    d.spr.white = false; d.spr.ox = 0; d.spr.tint = '#f8e070'; chispaHumo(d.cx, d.cy - 6, 5);
    tw(o, { ty: -100 }, 9, 'in'); await fx(9, (k, t) => { torre(t, 0); chispaPuas(d.cx, d.cy, 23, t, 10); });
  },

  async apagar(a, d) { // un interruptor gigante hace «clac» y se va la luz alrededor del rival
    const s = dirOf(a), x = 62, y = 52, o =   // hueco libre del centro, fuera de los marcadores
      { p: 1, yo: -80, r: 130, al: 0 };
    const inter = t => {
      const yy = y + Math.round(o.yo); sello('chispa_placa', x, yy, { k: 2 });
      const ty = Math.round(yy - o.p * 9), top = Math.min(yy, ty), hgt = Math.abs(ty - yy);
      if (hgt > 0) chispaCaja(x - 2, top, 5, hgt, '#888ca0');
      chispaCaja(x - 6, ty - 4, 13, 8, '#e84848'); g.fillStyle = '#ffa8a0'; g.fillRect(x - 5, ty - 3, 11, 2); g.fillStyle = '#a02838'; g.fillRect(x - 6, ty + 2, 13, 2);
      chispaCaja(x - 2, yy - 19, 5, 3, o.p > 0 ? ((t >> 2) & 1 ? '#a0ffc0' : '#58e890') : '#503038');
      if (o.yo === 0) txtO(o.p > 0 ? 'ON' : 'OFF', x + 21, yy - 4, o.p > 0 ? '#a0ffc0' : '#e84848');
    };
    const noche = () => { // negro con un hueco redondo alrededor del rival
      if (o.al <= 0) return; g.globalAlpha = o.al; g.fillStyle = '#04040c'; const r = Math.round(o.r), cx = Math.round(d.cx), cy = Math.round(d.cy);
      for (let yy = 0; yy < H; yy++) { const dy = yy - cy; if (r <= 0 || Math.abs(dy) >= r) { g.fillRect(0, yy, W, 1); continue; } const w = Math.round(Math.sqrt(r * r - dy * dy)); if (cx - w > 0) g.fillRect(0, yy, cx - w, 1); if (cx + w < W) g.fillRect(cx + w, yy, W - cx - w, 1); }
      g.globalAlpha = 1;
    };
    tw(o, { yo: 0 }, 11, 'bounce'); await fx(11, (k, t) => inter(t)); o.yo = 0;
    tw(a.spr, { ox: s * 4, sy: .94 }, 6, 'out'); await fx(8, (k, t) => inter(t));
    snd(t => { osc('p50', [1400, 300], t, .06, .2, sfxG); noise(t, .04, .3, sfxG, { f: 2500 }); osc('saw', [400, 40], t + .12, .6, .08, sfxG); });
    tw(a.spr, { ox: 0, sy: 1 }, 8, 'out'); await tw(o, { p: -1 }, 3, 'in'); shake(2);
    tw(o, { al: .86 }, 5, 'out'); tw(o, { r: 30 }, 14, 'out');
    await fx(22, (k, t) => { noche(); inter(t); d.spr.dark = t > 10 && (t % 6) < 3; if (t < 12) txtO('¡CLAC!', x + 21, y - 16 - Math.min(4, t), '#ffffff'); });
    d.spr.dark = true; tw(o, { r: 0 }, 6, 'in'); tw(d.spr, { sx: 1.06, sy: .9 }, 10, 'out');
    await fx(20, (k, t) => { noche(); inter(t); if (t > 6 && ((t >> 2) & 1)) txtO('...', clamp(d.cx - 5, 4, W - 16), Math.max(4, d.cy - 34), '#9098b0'); });
    tw(d.spr, { sx: 1, sy: 1 }, 8, 'out'); tw(o, { al: 0 }, 8, 'in'); tw(o, { yo: -90 }, 8, 'in');
    await fx(8, (k, t) => { noche(); inter(t); }); d.spr.dark = false;
  },

  async rayomadre(a, d) { // el cielo se abre y cae el rayo más grande del juego
    const s = dirOf(a), gx = Math.round(clamp(d.cx - s * 44, 34, 126)), by = Math.round(Math.min(feet(d) - 4, d.cy + 14)), o = { dk: 0, ab: 0 };
    snd(t => { noise(t, 2, .5, sfxG, { f: [6000, 60], type: 'lowpass' }); osc('saw', [50, 70], t, .5, .1, sfxG, { sus: 1 }); osc('saw', [120, 25], t + .52, 1.2, .3, sfxG, { sus: 1 }); noise(t + .52, .12, .5, sfxG, { f: 6000 }); });
    const cielo = (t, luz) => {
      g.globalAlpha = .5 * o.dk; g.fillStyle = '#0c0a20'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
      const ap = o.ab * 26, base = Math.round(lerp(-30, 0, o.dk));
      if (ap > 1) { // el claro y su foco de luz sobre el rival
        g.globalAlpha = .22; g.fillStyle = '#fff8c0';
        for (let yy = 0; yy < by + 6; yy += 2) { const u = yy / (by + 6), cx = lerp(gx, d.cx, u), w = ap * (.5 + u * .7); g.fillRect(Math.round(cx - w), yy, Math.round(w * 2), 2); }
        g.globalAlpha = 1; g.fillStyle = '#fff8c0'; g.fillRect(Math.round(gx - ap), 0, Math.round(ap * 2), 10 + base);
      }
      const nub = [];
      for (let i = 0; i < 15; i++) { const x0 = i * 12 - 4, sd = x0 < gx ? -1 : 1, near = Math.max(0, 1 - Math.abs(x0 - gx) / 60); nub.push([Math.round(x0 + sd * ap * (.4 + near) + Math.sin(t * .06 + i * 1.7) * 2), base + 3 + (i * 7) % 6, 10 + (i * 5) % 5]); }
      for (const [x, y, r] of nub) disc(x, y + 1, r + 1, INK);
      for (const [x, y, r] of nub) disc(x, y, r, luz ? '#8880c0' : '#3c3660');
      for (const [x, y, r] of nub) disc(x - 2, y - 4, r - 4, luz ? '#c8c0f0' : '#5c5490');
    };
    tw(o, { dk: 1 }, 16, 'out');
    await fx(16, (k, t) => { cielo(t, t % 9 === 7); if (t % 9 === 7) shake(1); });
    tw(o, { ab: 1 }, 10, 'out'); shake(2);
    await fx(14, (k, t) => { cielo(t, 0); if (t > 6) chispaBola(gx, 6, 2 + (t - 6), t); });
    const tronco = n => chispaZig(gx, 2, d.cx, by, 6, 13, n * 4.7 + 1);
    for (let n = 0; n < 3; n++) {
      flash('#ffffff', 1.4 - n * .3); shake(8 - n * 2); if (n === 0) { sparks(d.cx, by, 24); d.spr.sx = 1.2; d.spr.sy = .78; tw(d.spr, { sx: 1, sy: 1 }, 22, 'elastic'); }
      await fx(9, (k, t) => {
        if (t < 3) { g.globalCompositeOperation = 'difference'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
        cielo(t, 1);
        const pts = tronco(n), w = t < 5 ? 9 - n : 5;
        // ramas que se abren hasta los bordes y rayos de acompañamiento por toda la pantalla
        const r1 = pts[2], r2 = pts[4];
        chispaRayo(chispaZig(r1[0], r1[1], clamp(r1[0] - s * 46, 4, W - 4), r1[1] + 52, 4, 7, n + 2), t, 3);
        chispaRayo(chispaZig(r2[0], r2[1], clamp(r2[0] + s * 40, 4, W - 4), Math.min(H - 44, r2[1] + 40), 3, 6, n + 5), t, 3);
        if (n > 0) { const xx = n === 1 ? clamp(gx - s * 52, 8, W - 8) : clamp(gx + s * 24, 8, W - 8); chispaRayo(chispaZig(xx, 6, xx + s * 10, H - 46 - n * 14, 5, 8, n * 9), t, 4); }
        g.globalAlpha = .3; g.fillStyle = '#fff8c0'; chispaSeg(pts, '#fff8c0', w + 14); g.globalAlpha = 1;
        chispaRayo(pts, t, w);
        chispaPum(d.cx, by - 6, t, 3); ring(d.cx, by, 6 + (n * 9 + t) * 1.6, '#fff070', 2);
        d.spr.white = t & 1; d.spr.ox = t & 1 ? 3 : -3;
        if (t % 3 === 0) chispaChis(d.cx + rnd(-16, 16), by, 4, 4);
      });
    }
    d.spr.white = false; d.spr.ox = 0; d.spr.tint = '#f8e070'; chispaHumo(d.cx, d.cy, 6);
    tw(o, { dk: 0 }, 14, 'in'); tw(o, { ab: 0 }, 8, 'out');
    await fx(14, (k, t) => { cielo(t, 0); chispaPuas(d.cx, d.cy, 23, t); if (t < 8 && (t & 2)) chispaRayo(chispaZig(d.cx - 20, by, d.cx + 20, by - 2, 4, 4, t >> 2), t, 2); });
  },

  async sobrecarga(a, d) { // una pila que se llena hasta reventar encima del rival
    const s = dirOf(a), bx = Math.round(d.cx), by = Math.round(clamp(d.cy - 12, 18, 120)), ax = a.cx + s * 10, ay = a.cy - 6;
    snd(t => { osc('saw', [100, 1600], t, .72, .08, sfxG, { sus: 1 }); for (let i = 0; i < 4; i++) osc('p50', 500 + i * 180, t + .1 + i * .11, .05, .08, sfxG); noise(t + .74, .3, .35, sfxG, { f: 2000 }); osc('p50', [300, 60], t + .74, .2, .2, sfxG); });
    const COL = ['#58e890', '#b8e038', '#f8d030', '#e84848'];
    const pila = (lv, t, jx = 0, jy = 0, k2 = 2) => {
      const x = bx + jx, y = by + jy; sello('chispa_pila', x, y, { k: k2, fx: s > 0 }); if (k2 < 2) return;
      const x0 = s > 0 ? x - 12 : x - 16, tope = lv >= 4;   // interior: 28×12 (espejado o no, queda centrado a 1 px)
      for (let i = 0; i < 4; i++) { const f = clamp(lv - i, 0, 1); if (f <= 0) break; const w = Math.max(1, Math.round(6 * f)), c = tope ? ((t >> 1) & 1 ? '#ffffff' : '#e84848') : COL[i], j = s > 0 ? i : 3 - i, sx = x0 + j * 7 + (s > 0 ? 0 : 6 - w); g.fillStyle = c; g.fillRect(sx, y - 6, w, 12); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(sx, y - 6, w, 3); }
    };
    tw(a.spr, { sx: .94, sy: 1.06 }, 6, 'out');
    await fx(4, (k, t) => pila(0, t, 0, 0, t < 2 ? 1 : 2));
    await fx(36, (k, t) => {
      const lv = Math.min(4.2, k * 5.6), tope = lv >= 4, j = tope ? 2 : lv > 3 ? 1 : 0;
      a.spr.sx = 1 + ((t >> 2) & 1 ? .06 : -.03); a.spr.sy = 1 + ((t >> 2) & 1 ? -.05 : .04);
      chispaRayo(chispaZig(ax, ay, bx - s * 22, by, 6, 5 + lv, t >> 1), t, lv > 2.5 ? 3 : 2); chispaBola(ax, ay, 4 + (t & 1), t);
      pila(lv, t, (t & 1 ? j : -j), ((t >> 1) & 1 ? j : -j) >> 1);
      if (tope) { if ((t >> 1) & 1) txtO('!', bx - 1, by - 24, '#e84848'); pl(bx - 9, by - 11, bx - 4, by - 3, INK, 1); pl(bx - 4, by - 3, bx - 7, by + 3, INK, 1); pl(bx + 10, by + 10, bx + 6, by + 2, INK, 1); pl(bx + 6, by + 2, bx + 9, by - 3, INK, 1); if (t % 2 === 0) chispaChis(bx + (t & 2 ? 20 : -20), by, 2, 3); }
      else if (t % 6 === 0) chispaChis(bx - s * 22, by, 2, 2);
    });
    tw(a.spr, { sx: 1, sy: 1 }, 10, 'elastic');
    flash('#fff8c0', .9); shake(6); sparks(d.cx, d.cy, 18);
    for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + .3; part({ x: bx, y: by, vx: Math.cos(an) * rnd(1.5, 3), vy: Math.sin(an) * rnd(1.5, 3) - 1, ay: .22, drag: .97, life: 26, c: pick(['#e8ecf4', '#98a0b4', '#f0c048']), s: 4 }); }
    await fx(20, (k, t) => {
      const R = 10 + EASE.out(k) * 34;
      if (k < .8) for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + (t >> 2) * .39, c = Math.cos(an), sn = Math.sin(an) * .85; chispaRayo(chispaZig(bx + c * 8, by + sn * 8, clamp(bx + c * R, 3, W - 3), clamp(by + sn * R, 3, H - 44), 3, 4, i + (t >> 1)), t, i & 1 ? 2 : 4); }
      if (t < 10) chispaPum(bx, by, t, t < 5 ? 4 : 3);
      ring(bx, by, 8 + k * 40, '#fff070', 2);
      d.spr.white = t < 14 && ((t >> 1) & 1); d.spr.ox = t < 14 ? (t & 1 ? 3 : -3) : 0;
      if (t % 5 === 0) chispaHumo(bx, by, 1);
    });
    d.spr.white = false; d.spr.ox = 0; d.spr.tint = '#f8e070';
  },
});

// ═════════ OXIDO ═════════
// OXIDO
// paleta de óxidos: k tinta · d marrón oscuro · t teja · o naranja · y brillo · w brillo vivo
const OXP = { k: INK, d: '#5a2814', t: '#9c4622', o: '#d0702c', y: '#f0a848', w: '#ffe8b0', n: '#0c0a14', R: '#e04020', a: '#8ec24a', A: '#4c8a2c', L: '#d8f078', g: '#8890a0', G: '#5c6070', l: '#c8d0dc', W: '#ffffff', b: '#58b8f8', B: '#2c68b0', r: '#2c2c38', h: '#4c4c5c' };
const OXHOT = Object.assign({}, OXP, { y: '#ffffff', o: '#f8e070', t: '#f08030', d: '#e04020' });
// pegote de herrumbre
dib('oxido_pegote', ['...kkkkkk...', '.kkoyyoootk.', 'kooywoooottk', 'kooyooootttk', 'kooooootttdk', 'ktoooottttdk', 'kttttttttddk', '.ktttttdddk.', '..kkdddddkk.', '....kkkkk...'], OXP);
// manchurrón estampado
dib('oxido_mancha', ['....k......kk...', '...kok....kotk..', '.kk.kok..kootk..', 'kotkkookkoootk..', '.kotooooooootkkk', '..kooyyoooootttk', '.kkooywooooottk.', 'kotoooooooottk..', 'kttooooooootttk.', '.kkktoootttkkttk', '...kttkkttk..kk.', '...ktk..kk......', '....k...........'], OXP);
dib('oxido_gota', ['..k..', '.kok.', 'kyotk', 'kootk', 'kttdk', '.kkk.'], OXP);
dib('oxido_gotaf', ['..k..', '.kok.', 'kyotk', 'kootk', 'kttdk', '.kkk.'], OXHOT);
// nube de ácido y su gota
dib('oxido_nube', ['....kkk....kkkk.....', '..kkLLLkkkkLLLLkk...', '.kLLaaaLLLaaaaaLLkk.', 'kLaaaaaaaaaaaaaaaLLk', 'kaaaaaaaaaaaaaaaaaak', 'kaaAAaaaaaAAAaaaaaAk', '.kAAAAaaAAAAAAAaAAk.', '.kttAAAAAttAAAAAttk.', '..kkttttkkkttttkkk..', '....kkkk...kkkk.....'], OXP);
dib('oxido_acida', ['..k..', '..k..', '.kLk.', '.kak.', 'kLaak', 'kaaAk', 'kaAAk', '.kkk.'], OXP);
// agujeros en la chapa: tres tamaños
dib('oxido_agujero1', ['.oooo.', 'otkkto', 'tknnkt', 'otkkto', '.tttt.'], OXP);
dib('oxido_agujero2', ['..oo.ooo..', '.otttkttto', 'otkknnkkto', 'tkknnnnkkt', 'otknnnnnkt', 'ttkknnnkto', '.ottkkktt.', '..tt.ttt..'], OXP);
dib('oxido_agujero3', ['...oo..ooo....', '.oottoottttoo.', 'otttkkkkkkttto', 'ottknnnnnkkktt', 'ttkknnnnnnnkto', 'otknnnnnnnnkkt', 'otkknnnnnnnkto', '.ttkknnnnnkktt', 'otttkkknnkktt.', '.oottttkkttto.', '...tt..ttt....'], OXP);
// corazón al rojo vivo
dib('oxido_corazon', ['.kk...kk.', 'kyykkkyok', 'kywyoyook', 'kyyooooRk', 'koooooRRk', '.kooRRRk.', '..koRRk..', '...kRk...', '....k....'], OXP);
// termómetro (el mercurio se pinta aparte)
dib('oxido_termo', ['..kkk..', '.klllk.', '.klllk.', '.klllk.', '.klllk.', '.klllk.', '.klllk.', '.klllk.', '.klllk.', '.klllk.', '.klllk.', '.klllk.', '.klllk.', 'kkRRRkk', 'kRWRRRk', 'kRRRRRk', 'kRRRRRk', '.kkkkk.'], OXP);
// el desguace
dib('oxido_neumatico', ['....kkkkkk....', '..kkhhhhhhkk..', '.khhrrrrrrhhk.', '.khrrkkkkrrhk.', 'khrrkllllkrrhk', 'khrklgkkglkrhk', 'khrklkggklkrhk', 'khrklkggklkrhk', 'khrklgkkglkrhk', 'khrrkllllkrrhk', '.khrrkkkkrrhk.', '.khhrrrrrrhhk.', '..kkhhhhhhkk..', '....kkkkkk....'], OXP);
dib('oxido_lavadora', ['kkkkkkkkkkkkkkkk', 'kWWllllllllllllk', 'klkkkkllRRlyylgk', 'klkbbkllRRlyylgk', 'klkkkkllllllllgk', 'kggggggggggggggk', 'kllllkkkkkkllllk', 'klllkggggggklllk', 'kllkgkkkkkkgkllk', 'klkgkbbbbWbkgklk', 'klkgkbbbWbbkgklk', 'klkgkBbbbbbkgklk', 'klkgkBBbbbbkgklk', 'kllkgkkkkkkgkllk', 'klllkggggggklllk', 'ktlllkkkkkklttgk', 'kttggggggggtttgk', 'kkkkkkkkkkkkkkkk'], OXP);
dib('oxido_tubo', ['kkk............kkk', 'kykkkkkkkkkkkkkkyk', 'kyoyyyyyyyyyyyyoyk', 'kooooootoooooooook', 'kottoooooootttoook', 'kttttttttttttttttk', 'ktkkkkkkkkkkkkkktk', 'kkk............kkk'], OXP);
dib('oxido_escama', ['.kkk.', 'kyotk', 'kottk', '.kkk.'], OXP);
dib('oxido_escama2', ['kkk.', 'kotk', '.kkk'], OXP);
// muelle: zigzag que se encoge y se estira
function oxMuelle(x, y, h) { const pts = [], n = 6; for (let i = 0; i <= n; i++) pts.push([x + (i === 0 || i === n ? 0 : i & 1 ? -5 : 5), y - h * i / n]); path(pts, '#c8d0dc', 2, 1); for (let i = 1; i < n; i += 2) px(pts[i][0], pts[i][1] - 1, '#ffffff', 2); g.fillStyle = INK; g.fillRect(Math.round(x) - 6, Math.round(y) - 1, 13, 3); g.fillRect(Math.round(x) - 6, Math.round(y - h) - 2, 13, 3); g.fillStyle = '#8890a0'; g.fillRect(Math.round(x) - 5, Math.round(y), 11, 1); g.fillRect(Math.round(x) - 5, Math.round(y - h) - 1, 11, 1); }
// chorretón que cuelga
function oxChorro(x, y, L, c = '#9c4622', c2 = '#d0702c') { x = Math.round(x); y = Math.round(y); L = Math.round(L); if (L < 1) return; g.fillStyle = INK; g.fillRect(x - 2, y, 5, L + 3); g.fillRect(x - 3, y + L - 1, 7, 4); g.fillStyle = c; g.fillRect(x - 1, y, 3, L + 2); g.fillRect(x - 2, y + L, 5, 2); g.fillStyle = c2; g.fillRect(x - 1, y, 1, L + 1); }
// humo que sube
const oxHumo = (x, y, c, s = 5) => part({ x, y, vx: rnd(-.25, .25), vy: -rnd(.5, .9), life: 26, c, s, kind: 'puff' });

Object.assign(ANIM, {
  async rona(a, d) { // escupe herrumbre: un pegote que vuela y se estampa
    const s = dirOf(a), mx = a.cx + s * 12, my = a.cy - 8, ty = d.cy - 2;
    snd(t => { osc('p50', [180, 420], t, .2, .08, sfxG); osc('p50', [600, 200], t + .2, .12, .12, sfxG); noise(t + .2, .2, .2, sfxG, { f: [1500, 300], type: 'lowpass' }); });
    // carraspea echándose atrás…
    a.spr.tint = '#9c4622'; await tw(a.spr, { ox: -s * 5, sx: 1.14, sy: .88 }, 9, 'out');
    // …y escupe
    a.spr.tint = null; a.spr.ox = s * 6; a.spr.sx = .9; a.spr.sy = 1.1; tw(a.spr, { ox: 0, sx: 1, sy: 1 }, 14, 'elastic');
    for (let i = 0; i < 5; i++) part({ x: mx, y: my, vx: s * rnd(.5, 2), vy: rnd(-1.5, .5), ay: .12, life: 14, c: pick(['#d0702c', '#9c4622']), s: 3, shrink: 1 });
    const tr = [];
    await fx(18, (k, t) => {
      const x = lerp(mx, d.cx, k), y = lerp(my, ty, k) - Math.sin(k * Math.PI) * 20;
      tr.push([x, y]); if (tr.length > 6) tr.shift();
      tr.forEach(([qx, qy], i) => { if (i < tr.length - 1 && i % 2 === 0) { const r = 2 + (i >> 1); disc(Math.round(qx), Math.round(qy), r + 1, INK); disc(Math.round(qx), Math.round(qy), r, '#9c4622'); } });
      sello('oxido_pegote', x, y, { k: 2, rot: t >> 2 });
      if (t % 4 === 1) part({ x, y: y + 6, vy: .6, ay: .12, life: 16, c: '#9c4622', s: 3, shrink: 1 });
    });
    // ¡chof!
    snd(t => { noise(t, .22, .25, sfxG, { f: [900, 250], type: 'lowpass' }); osc('p50', [220, 90], t, .12, .1, sfxG); });
    burst(d.cx, ty, 16, { c: ['#d0702c', '#9c4622', '#5a2814', '#f0a848'], v0: 1, v1: 3.2, ay: .16, s: 3, shrink: 1, l0: 14, l1: 26 });
    d.spr.sx = 1.14; d.spr.sy = .88; tw(d.spr, { sx: 1, sy: 1 }, 14, 'elastic');
    const sal = [[-19, -12, 0, 2], [20, 8, 1, 4], [-14, 15, 2, 6], [17, -16, 3, 3]], ch = [[-9, 7, 15], [-2, 10, 9], [5, 9, 19], [11, 5, 11]];
    await fx(30, (k, t) => {
      const x = d.cx + d.spr.ox, a1 = k > .8 ? ((t >> 1) & 1 ? 1 : 0) : 1; if (!a1) return;
      for (const [dx, dy, L] of ch) oxChorro(x + dx, ty + dy, Math.min(1, k * 1.5) * L);
      for (const [dx, dy, r, t0] of sal) if (t >= t0) sello('oxido_mancha', x + dx, ty + dy, { k: 1, rot: r });
      if (t < 3) { disc(Math.round(x), Math.round(ty), 15, INK); disc(Math.round(x), Math.round(ty), 14, '#f0a848'); disc(Math.round(x), Math.round(ty), 9, '#ffe8b0'); } else sello('oxido_mancha', x, ty, { k: 2 });
    });
  },

  async corrosion(a, d) { // una nube ácida llueve sobre el rival y le come la chapa a agujeros
    const s = dirOf(a), nx = d.cx, ny = Math.max(12, d.cy - 38), c = { x: a.cx + s * 10, y: a.cy - 16 };
    snd(t => { osc('p50', [140, 320], t, .2, .08, sfxG); for (let i = 0; i < 20; i++) osc('sin', 200 + Math.random() * 600, t + .3 + i * .04, .04, .06, sfxG); noise(t + .3, .9, .1, sfxG, { f: [1200, 400], type: 'bandpass', lo: 1 }); });
    a.spr.sx = 1.12; a.spr.sy = .88; tw(a.spr, { sx: 1, sy: 1 }, 12, 'elastic');
    // el eructo ácido viaja hasta ponerse encima del rival
    let llueve = 0; const nube = (t, al) => sello('oxido_nube', c.x, c.y + (llueve ? Math.round(Math.sin(t * .3)) : 0), { k: llueve || t > 4 ? 2 : 1, a: al });
    const f1 = fx(14, (k, t) => { nube(t); if (t % 3 === 0) part({ x: c.x, y: c.y + 4, life: 14, c: pick(['#8ec24a', '#d8f078']), s: 4, kind: 'puff', shrink: 1 }); });
    tw(c, { x: nx }, 14, 'io'); await tw(c, { y: ny }, 14, 'io'); await f1; llueve = 1;
    // llueve: cada gota gorda abre un agujero que va creciendo
    const hoyos = [[-11, -8, 0], [10, -13, 5], [3, 6, 10], [-13, 13, 15], [15, 10, 20], [-1, -18, 25]].map(([dx, dy, t0]) => ({ dx, dy, t0, t1: t0 + 7 }));
    let pego = 0;
    await fx(52, (k, t) => {
      const ox = d.spr.ox;
      // agujeros
      for (const h of hoyos) {
        const x = d.cx + h.dx + ox, y = d.cy + h.dy, e = t - h.t1;
        if (e < 0) { if (t >= h.t0) { const q = (t - h.t0) / 7; sello('oxido_acida', d.cx + h.dx, lerp(ny + 10, y - 8, q * q), { k: 2 }); } continue; }
        if (e === 0) {
          if (!pego) { pego = 1; burst(d.cx, d.cy, 14, { c: ['#d8f078', '#8ec24a', '#d0702c'], v0: 1, v1: 3, ay: .12, s: 3, shrink: 1 }); flash('#d8f078', .35); d.spr.tint = '#8ec24a'; }
          else { for (let i = 0; i < 5; i++) part({ x, y, vx: rnd(-1.6, 1.6), vy: -rnd(.5, 2), ay: .15, life: 14, c: pick(['#d8f078', '#8ec24a']), s: 3, shrink: 1 }); snd(tt => noise(tt, .08, .12, sfxG, { f: 3000 })); }
        }
        sello(e < 6 ? 'oxido_agujero1' : e < 13 ? 'oxido_agujero2' : 'oxido_agujero3', x, y, { k: e >= 20 && (h.t0 % 10 === 0) ? 2 : 1 });
        if (e % 5 === 2 && k < .9) oxHumo(x, y - 3, pick(['#d8f078', '#e8f0d0', '#a8b890']), e < 13 ? 3 : 5);
      }
      // llovizna de relleno
      for (let i = 0; i < 4; i++) { const q = ((t + i * 5) % 20) / 20, x = nx - 15 + i * 10 + ((t + i * 5) / 20 | 0) % 2 * 4; if (k < .8) { pl(x, lerp(ny + 10, d.cy + 20, q) - 4, x, lerp(ny + 10, d.cy + 20, q), INK, 3); pl(x, lerp(ny + 10, d.cy + 20, q) - 3, x, lerp(ny + 10, d.cy + 20, q) - 1, '#d8f078', 1); } }
      if (pego && t > 16) d.spr.tint = '#9c4622';
      if (k < .85 || (t >> 1) & 1) nube(t);
    });
  },

  async fundir(a, d) { // un abrazo a 400 grados
    const s = dirOf(a), tx = clamp(a.cx - s * 30, 8, W - 8), ty = a.cy + 2;
    snd(t => { osc('saw', [60, 160], t, .4, .07, sfxG, { sus: 1 }); osc('p25', [500, 1500], t, .38, .05, sfxG); noise(t + .52, 1, .2, sfxG, { f: [300, 1200], type: 'bandpass', swell: 1 }); osc('saw', [60, 90], t + .52, 1, .1, sfxG, { sus: 1 }); });
    // 1) se pone al rojo vivo: el termómetro sube hasta 400º
    const hot = k => k < .35 ? '#e04020' : k < .7 ? '#f08030' : '#f8d030';
    await fx(22, (k, t) => {
      a.spr.tint = hot(k); a.spr.ox = t & 1 ? 1 : -1; a.spr.sx = 1 + k * .08;
      sello('oxido_termo', tx, ty, { k: 2 }); const h = Math.round(Math.min(1, k * 1.25) * 22); g.fillStyle = '#e04020'; g.fillRect(tx - 3, ty - 14 + 8 + (22 - h), 4, h + 2); g.fillStyle = '#ffffff'; g.fillRect(tx - 3, ty - 12, 1, 18);
      const lb = Math.round(Math.min(1, k * 1.25) * 400) + 'º'; txtO(lb, clamp(tx - (tw_(lb) >> 1), 2, W - 2 - tw_(lb)), ty - 30, k > .8 && t & 2 ? '#ffffff' : '#f8d030');
      for (let i = 0; i < 4; i++) { const x = a.cx - 21 + i * 14, y0 = a.cy + 8 - ((t * 2 + i * 9) % 34), pts = []; for (let j = 0; j < 5; j++) pts.push([x + (j & 1 ? 2 : -2), y0 - j * 4]); path(pts, i & 1 ? '#f8d030' : '#f08030', 2, 1); }
    });
    // 2) salta a abrazarlo
    const ox = (d.spr.x - a.spr.x) * .76, oy = (d.spr.y - a.spr.y) * .76; a.spr.sx = 1;
    await fx(9, k => { a.spr.ox = ox * k * k; a.spr.oy = oy * k * k - Math.sin(k * Math.PI) * 12; part({ x: a.cx + a.spr.ox, y: a.cy + a.spr.oy, life: 10, c: pick(['#f8d030', '#f08030', '#e04020']), s: 5, kind: 'puff', shrink: 1 }); });
    a.spr.ox = ox; a.spr.oy = oy;
    // 3) ¡tsss! contacto
    burst(d.cx, d.cy, 20, { c: ['#ffffff', '#f8e070', '#f08030', '#e04020'], v0: 1.2, v1: 3.6, ay: .12, s: 3, shrink: 1, l0: 14, l1: 28 }); flash('#f8a040', .5);
    const mx = lerp(a.cx + ox, d.cx, .5), my = lerp(a.cy + oy, d.cy, .5), hx = mx - s * 32, hy = s > 0 ? my + 4 : my - 26;
    const gotas = [[-16, 2], [12, 6], [-4, 11], [20, 15], [-22, 19], [6, 23]];
    await fx(32, (k, t) => {
      const c = hot(.5 + Math.sin(t * .8) * .5); a.spr.tint = d.spr.tint = c; const q = Math.sin(t * .7) * .05; a.spr.sx = 1.06 + q; a.spr.sy = .96 - q; d.spr.sx = .86 - q; d.spr.sy = 1.08 + q;
      // ondas de calor
      for (let i = 0; i < 2; i++) { const r = ((t * 2 + i * 16) % 32) + 8; ring(mx, my, r, r > 28 ? '#e04020' : '#f8a040', 2); }
      // gotas de metal fundido
      for (const [dx, t0] of gotas) { const e = t - t0; if (e < 0) continue; const y = my + 6 + e * e * .22, F = Math.max(feet(d), feet(a) + oy) - 2; if (y < F) sello('oxido_gotaf', mx + dx, y, { k: 1 }); else if (e * e * .22 - (e - 1) * (e - 1) * .22 > 0 && y - (2 * e - 1) * .22 < F) for (let i = 0; i < 4; i++) part({ x: mx + dx, y: F, vx: rnd(-1.4, 1.4), vy: -rnd(.6, 1.8), ay: .15, life: 12, c: pick(['#f8e070', '#f08030']), s: 3, shrink: 1 }); }
      // humo gordo
      if (t % 3 === 0) oxHumo(mx + Math.sin(t * 1.3) * 20, my - 8, t % 2 ? '#6c6c78' : '#9c9ca8', 6);
      // corazón al rojo
      if (t > 3) sello('oxido_corazon', hx, hy + 8 - Math.min(8, t - 3) + Math.round(Math.sin(t * .4)), { k: 2, a: k > .85 && t & 1 ? 0 : 1 });
    });
    // 4) lo suelta, todavía humeando
    a.spr.tint = null; d.spr.tint = '#e04020'; tw(d.spr, { sx: 1, sy: 1 }, 10, 'elastic');
    for (let i = 0; i < 5; i++) oxHumo(d.cx - 16 + i * 8, d.cy - 10, '#9c9ca8', 5);
    await tw(a.spr, { ox: 0, oy: 0, sx: 1, sy: 1 }, 10, 'out'); d.spr.tint = null;
  },

  async chatarrazo(a, d) { // le cae encima medio desguace
    const F = feet(d), cx = d.cx, T0 = 16;
    snd(t => { osc('sin', [1500, 350], t, .27, .06, sfxG); for (let i = 0; i < 7; i++) { noise(t + .27 + i * .07, .12, i ? .2 : .32, sfxG, { f: [2500, 400], type: 'lowpass' }); osc('p50', [300 + i * 70, 120], t + .27 + i * .07, .1, .1, sfxG); } osc('tri', [90, 40], t + .27, .25, .2, sfxG); });
    a.spr.oy = -6; tw(a.spr, { oy: 0 }, 12, 'bounce');
    // qué cae, cuándo llega, dónde queda y cuánto rebota
    const cosas = [
      { id: 'lav', tl: T0, x: 0, y: F - 20, b: 3 },
      { id: 'neu', tl: T0 + 6, x: -23, y: F - 13, b: 9 },
      { id: 'mue', tl: T0 + 10, x: 25, y: F - 1, b: 12 },
      { id: 'tub', tl: T0 + 14, x: 5, y: F - 43, b: 5 },
      { id: 'tu1', tl: T0 + 17, x: -8, y: F - 5, b: 8 },
      { id: 'tu2', tl: T0 + 20, x: 13, y: F - 4, b: 10 },
      { id: 'tu3', tl: T0 + 23, x: -33, y: F - 4, b: 7 },
    ];
    const pinta = (c, t) => {
      const e = t - c.tl, cae = e < 0, q = cae ? 1 + e / 10 : 0; if (q < 0 && cae) return;
      const bote = cae ? 0 : Math.abs(Math.sin(e * .42)) * c.b * Math.max(0, 1 - e / 16), x = cx + c.x, y = cae ? lerp(-34, c.y, q * q) : c.y - bote;
      if (cae) { pl(x - 6, y - 26, x - 6, y - 14, '#ffffff', 1); pl(x + 6, y - 30, x + 6, y - 16, '#ffffff', 1); }
      if (c.id === 'lav') sello('oxido_lavadora', x, y, { k: 2 });
      else if (c.id === 'neu') sello('oxido_neumatico', x, y, { k: 2, rot: cae ? t >> 1 : 0 });
      else if (c.id === 'tub') sello('oxido_tubo', x, y, { k: 2, rot: cae ? (t >> 1) & 1 : 0 });
      else if (c.id === 'mue') oxMuelle(x, y, cae ? 18 : 12 + bote * .8);
      else nut(x, y, 5, c.id === 'tu2' ? '#d0702c' : '#c8d0dc', cae ? t : 0);
      if (e === 0) {
        if (c.id === 'lav') { shake(6); flash('#ffffff', .45); d.spr.sx = 1.22; d.spr.sy = .6; for (const sg of [-1, 1]) for (let i = 0; i < 6; i++) part({ x: cx + sg * 16, y: F - 2, vx: sg * rnd(.6, 2.4), vy: -rnd(.2, 1.2), life: 22, c: pick(['#f8f0d8', '#e0d4b0', '#c8b890']), s: 5, kind: 'puff', shrink: 1 }); sparks(cx, F - 30, 8); }
        else { shake(2); for (let i = 0; i < 4; i++) part({ x: x + rnd(-6, 6), y: Math.min(F - 1, c.y + 8), vx: rnd(-1.2, 1.2), vy: -rnd(.2, 1), life: 16, c: pick(['#f8f0d8', '#c8b890']), s: 4, kind: 'puff', shrink: 1 }); d.spr.sy = .56; tw(d.spr, { sy: .6 }, 5, 'out'); }
      }
    };
    await fx(60, (k, t) => {
      // la sombra avisa
      if (t < T0) { const r = Math.round(6 + t * 1.3); ell(g, cx, F - 1, r, 4, 'rgba(12,10,20,.55)'); if ((t >> 1) & 1) txtO('!', cx - 1, Math.max(2, d.cy - 40), '#f8d030'); }
      if (t > 52 && t & 1) return; // el montón parpadea y se va
      for (const i of [3, 0, 1, 2, 4, 5, 6]) pinta(cosas[i], t);
    });
    for (const sg of [-1, 1]) for (let i = 0; i < 5; i++) part({ x: cx + sg * 10, y: F - 10, vx: sg * rnd(.4, 2), vy: -rnd(.2, 1.4), life: 20, c: pick(['#f8f0d8', '#e0d4b0', '#c8b890']), s: 5, kind: 'puff', shrink: 1 });
    await tw(d.spr, { sx: 1, sy: 1 }, 12, 'elastic');
  },

  async herrumbre(a, d) { // óxido de cien años: la costra sube de los pies a la cabeza
    const s = dirOf(a), view = viewOf(d), F = feet(d);
    snd(t => { osc('tri', [600, 120], t, 1.1, .06, sfxG, { sus: 1 }); noise(t, 1.1, .1, sfxG, { f: [3000, 300], type: 'lowpass' }); for (let i = 0; i < 4; i++) osc('p25', [900 - i * 120, 300], t + .82 + i * .05, .05, .07, sfxG); noise(t + 1.02, .3, .22, sfxG, { f: [1800, 300], type: 'lowpass' }); });
    // la costra: la silueta del rival, picada de óxido
    const [cv, x] = mk(56, 56); x.drawImage(MON[d.mon.sp][view], 0, 0); x.globalCompositeOperation = 'source-atop';
    const tono = ['#3c1a0c', '#5a2814', '#9c4622', '#9c4622', '#d0702c']; x.globalAlpha = .86;
    for (let j = 0; j < 56; j += 2) for (let i = 0; i < 56; i += 2) { const v = vnoise(i / 6, j / 5, 3) * .75 + hsh(i, j, 5) * .3; x.fillStyle = tono[clamp(Math.floor(v * 5), 0, 4)]; x.fillRect(i, j, 2, 2); }
    x.globalAlpha = 1; for (let i = 0; i < 26; i++) { x.fillStyle = i % 3 ? '#3c1a0c' : '#ffd890'; x.fillRect(Math.floor(hsh(i, 1, 9) * 54), Math.floor(hsh(i, 2, 9) * 54), i % 3 ? 2 : 1, i % 3 ? 2 : 1); }
    const alto = Array.from({ length: 14 }, (_, i) => Math.round(Math.sin(i * 1.9) * 4 + hsh(i, 7, 2) * 5));
    const costra = k => { const x0 = Math.round(d.spr.x + d.spr.ox) - 28; for (let i = 0; i < 14; i++) { const h = clamp(Math.round(k * 68 - 6 + alto[i]), 0, 56); if (h > 0) g.drawImage(cv, i * 4, 56 - h, 4, h, x0 + i * 4, F - h, 4, h); } };
    const tx = d.cx + (d.k === 'en' ? 26 : -22), ty = Math.max(13, d.cy - 26), rot = lb => txtO(lb, Math.max(2, Math.min(W - 2 - tw_(lb), tx - tw_(lb) / 2)), ty, '#f0a848');
    // sopla una nube de polvo de óxido
    a.spr.sx = 1.1; a.spr.sy = .9; tw(a.spr, { sx: 1, sy: 1 }, 10, 'back');
    for (let i = 0; i < 8; i++) part({ x: a.cx + s * 10, y: a.cy - 6, vx: (d.cx - a.cx) / 14 + rnd(-.4, .4), vy: (d.cy + 14 - a.cy) / 14 + rnd(-.4, .4), life: 14 + i, c: pick(['#9c4622', '#d0702c', '#5a2814']), s: 5, kind: 'puff', drag: 1 });
    await wait(8);
    // la costra trepa mientras pasan los años
    d.spr.sx = 1.0001; const esc = [];
    await fx(42, (k, t) => {
      const q = Math.min(1, k * 1.12); costra(q); rot(Math.round(q * 100) + ' AÑOS');
      const yb = F - q * 56; for (let i = 0; i < 3; i++) px(d.cx - 20 + ((t * 7 + i * 17) % 40), yb + (i * 3) % 5 - 2, '#ffd890', 2);
      if (t % 5 === 0 && t > 4) esc.push({ x: d.cx - 18 + hsh(t, 1, 4) * 36, y: F - hsh(t, 2, 4) * q * 44, vy: 0, id: t % 2 ? 'oxido_escama' : 'oxido_escama2', ph: t });
      for (const e of esc) { e.vy += .07; e.y += e.vy; if (e.y < F + 4) sello(e.id, e.x + Math.sin((t + e.ph) * .35) * 3, e.y, { k: 1, rot: (t + e.ph) >> 3 }); }
      d.spr.sy = 1;
    });
    // tieso del todo: cruje…
    const f2 = fx(12, (k, t) => { costra(1); if ((t >> 1) & 1) rot('100 AÑOS'); });
    await shakeSpr(d, 6, 1); await f2;
    // …y la costra se desconcha entera
    d.spr.sx = 1; d.spr.tint = '#9c4622'; shake(2); flash('#f0a848', .25);
    const lote = Array.from({ length: 12 }, (_, i) => ({ x: d.cx - 22 + (i % 6) * 9 + hsh(i, 3, 1) * 4, y: d.cy - 20 + (i / 6 | 0) * 22 + hsh(i, 4, 1) * 8, vx: (hsh(i, 5, 1) - .5) * 2.4, vy: -hsh(i, 6, 1) * 1.6, id: i % 3 ? 'oxido_escama' : 'oxido_escama2' }));
    d.spr.sy = .92; tw(d.spr, { sy: 1 }, 12, 'elastic');
    await fx(16, (k, t) => { for (const e of lote) { e.vy += .16; e.x += e.vx; e.y += e.vy; if (e.y < F + 6) sello(e.id, e.x, e.y, { k: 2, rot: (t >> 1) + (e.vx > 0 ? 1 : 0) }); } });
    d.spr.tint = null;
  },
});

// ═════════ IMAN ═════════
// IMAN
// ── colores de imán y de metal ──
const iman_C = { R: '#e83838', r: '#a01c28', Rl: '#ff8878', B: '#3860e0', b: '#203c98', Bl: '#88a8ff', M: '#c8d0dc', m: '#8890a0', mm: '#585e70', oro: '#f8d030' };

// ── dibujos ──
// imán de herradura (polos hacia abajo): rojo a la izquierda, azul a la derecha, puntas de acero
dib('iman_herradura', [
  '.....kkkkkkkkkk.....',
  '...kkrrrrrbbbbbkk...',
  '..krrRRRRRBBBBBbbk..',
  '.krRRwwRRRBBBBBBBbk.',
  '.krRwRRRRRBBBBBBBbk.',
  'krRRwRRkkkkkkBBBBBbk',
  'krRRRRkk....kkBBBBbk',
  'krRRRRk......kBBBBbk',
  'krRRRRk......kBBBBbk',
  'krRRRRk......kBBBBbk',
  'krRRRRk......kBBBBbk',
  'krRRRRk......kBBBBbk',
  'krRRRRk......kBBBBbk',
  'krRRRRk......kBBBBbk',
  'kkkkkkk......kkkkkkk',
  'kmMMMMk......kmMMMMk',
  'kmMwMMk......kmMwMMk',
  'kmMMMMk......kmMMMMk',
  'kmmmmmk......kmmmmmk',
  '.kkkkk........kkkkk.',
], { k: INK, R: iman_C.R, r: iman_C.r, w: '#ffc8b8', B: iman_C.B, b: iman_C.b, M: iman_C.M, m: iman_C.m });
// tuerca hexagonal con su agujero (A: lados arriba y abajo · B: puntas arriba y abajo), luz desde arriba a la izquierda
function iman_hexFilas(R, r, punta) {
  const h = Math.round(R * .866), W2 = punta ? h : R, H2 = punta ? R : h;
  const dentro = (u, v) => { if (punta) [u, v] = [v, u]; u = Math.abs(u); v = Math.abs(v); return v <= h && u <= R - v * .577; };
  const sol = (x, y) => dentro(x, y) && x * x + y * y > r * r, F = [];
  for (let y = -H2 - 1; y <= H2 + 1; y++) { let f = ''; for (let x = -W2 - 1; x <= W2 + 1; x++) {
    if (!sol(x, y)) { f += sol(x - 1, y) || sol(x + 1, y) || sol(x, y - 1) || sol(x, y + 1) ? 'k' : '.'; continue; }
    const d2 = x * x + y * y; f += d2 <= (r + 1.6) * (r + 1.6) ? (x + y < 0 ? 'm' : 'w') : x + y < -R * .62 ? 'w' : x + y > R * .55 ? 'm' : 'M'; } F.push(f); }
  return F;
}
dib('iman_tuercaA', iman_hexFilas(11, 4, 0), { k: INK, w: '#ffffff', M: iman_C.M, m: iman_C.m });
dib('iman_tuercaB', iman_hexFilas(11, 4, 1), { k: INK, w: '#ffffff', M: iman_C.M, m: iman_C.m });
// brújula de bolsillo: aro de latón, esfera crema, marcas y anilla
dib('iman_brujula', (() => { const F = []; for (let y = -22; y <= 22; y++) { let f = ''; for (let x = -18; x <= 18; x++) { const r = Math.hypot(x, y), ra = Math.hypot(x, y + 19); let ch = '.';
  if (r <= 17.5) ch = r > 16.4 ? 'k' : r > 13.4 ? (x + y < -9 ? 'y' : x + y > 11 ? 'O' : 'o') : r > 12.4 ? 'k' : (r > 9.5 && (x === 0 || y === 0)) ? (y < 0 && x === 0 ? 'R' : 'g') : (x + y > 12 ? 'q' : 'p');
  else if (ra <= 3.7) ch = ra > 2.6 ? 'k' : ra > 1.2 ? 'o' : '.';
  f += ch; } F.push(f); } return F; })(), { k: INK, y: '#f8e088', o: '#d8a030', O: '#986818', p: '#f8f6e8', q: '#dcd8c0', g: '#585e70', R: iman_C.R });
// polos
dib('iman_N', [
  '....kkkkk....',
  '..kkRRRRRkk..',
  '.kRRRRRRRRRk.',
  '.kRwRRRRwRRk.',
  'kRRwwRRRwRRRk',
  'kRRwwwRRwRRRk',
  'kRRwRwwRwRRRk',
  'kRRwRRwwwRRRk',
  'kRRwRRRwwRRRk',
  '.kRwRRRRwRRk.',
  '.kRRRRRRRRRk.',
  '..kkrrrrrkk..',
  '....kkkkk....',
], { k: INK, R: iman_C.R, r: iman_C.r, w: '#ffffff' });
dib('iman_S', [
  '....kkkkk....',
  '..kkBBBBBkk..',
  '.kBBBBBBBBBk.',
  '.kBBwwwwwBBk.',
  'kBBwwBBBBBBBk',
  'kBBwwBBBBBBBk',
  'kBBBwwwwBBBBk',
  'kBBBBBBBwwBBk',
  'kBBBBBBBwwBBk',
  '.kBwwwwwwBBk.',
  '.kBBBBBBBBBk.',
  '..kkbbbbbkk..',
  '....kkkkk....',
], { k: INK, B: iman_C.B, b: iman_C.b, w: '#ffffff' });
// destello de cuatro puntas
dib('iman_brillo', [
  '....k....',
  '...kwk...',
  '...kwk...',
  '.kkwwwkk.',
  'kwwwwwwwk',
  '.kkwwwkk.',
  '...kwk...',
  '...kwk...',
  '....k....',
], { k: 'rgba(20,16,32,.7)', w: '#ffffff' });
// chatarra que atrae el imán
dib('iman_yunque', [
  'kkkkkkkkkkkkkkkkkk....',
  'kwwwwwwwwwwwwwwwwMkkk.',
  'kMMMMMMMMMMMMMMMMMMMMk',
  '.kmMMMMMMMMMMMMMMMmkk.',
  '..kkmmMMMMMMMMMmkkk...',
  '....kkkmMMMMMmkk......',
  '......kmMMMMmk........',
  '......kmMMMMmk........',
  '.....kmMMMMMMmk.......',
  '...kkmMMMMMMMMmkk.....',
  '..kwwwwwwwwwwwwwMk....',
  '..kMMMMMMMMMMMMMmk....',
  '..kmmmmmmmmmmmmmmk....',
  '..kkkkkkkkkkkkkkkk....',
], { k: INK, w: '#a8b0c4', M: '#687088', m: '#404860' });
dib('iman_llave', [
  '.kk...kk.',
  'kwMk.kwMk',
  'kwMk.kwMk',
  'kwMkkkMMk',
  'kwMMMMMmk',
  '.kwMMMmk.',
  '..kwMmk..',
  '..kwMmk..',
  '..kwMmk..',
  '..kwMmk..',
  '..kwMmk..',
  '..kwMmk..',
  '..kwMmk..',
  '..kwMmk..',
  '..kwMmk..',
  '..kwMmk..',
  '.kwMMMmk.',
  'kwMMkMMmk',
  'kwMk.kMmk',
  'kwMMkMMmk',
  '.kwMMMmk.',
  '..kkkkk..',
], { k: INK, w: '#ffffff', M: iman_C.M, m: iman_C.m });
dib('iman_sarten', [
  '....kkkkkk................',
  '..kkMMMMMMkk..............',
  '.kMMmmmmmmMMk.............',
  'kMMmmwwmmmmMMk............',
  'kMmmwmmmmmmmMkkkkkkkkkkkk.',
  'kMmmwmmmmmmmMMhhhhhhhhhhhk',
  'kMmmmmmmmmmmMMHHHHHHHHHHHk',
  'kMmmmmmmmmmmMkkkkkkkkkkkk.',
  'kMMmmmmmmmmMMk............',
  '.kMMmmmmmmMMk.............',
  '..kkMMMMMMkk..............',
  '....kkkkkk................',
], { k: INK, M: '#70788c', m: '#343a4c', w: '#a8b0c4', h: '#d87838', H: '#a04c20' });
// la cuenta: rayo del recibo, tampón y monedas
dib('iman_rayo', [
  '...kkkk',
  '..kyyk.',
  '.kyyk..',
  'kyyykkk',
  'kkkyyyk',
  '..kyyk.',
  '.kyyk..',
  '.kyk...',
  '.kk....',
], { k: INK, y: iman_C.oro });
dib('iman_tampon', [
  '.....kkkkkk.....',
  '....kHHHHhhk....',
  '....kHwHHhhk....',
  '....kHwHHhhk....',
  '.....kHHhhk.....',
  '......kHhk......',
  '......kHhk......',
  '.....kHHhhk.....',
  '...kkkkkkkkkk...',
  '..kHHHHHHHhhhk..',
  '.kHHwwHHHHHhhhk.',
  'kkkkkkkkkkkkkkkk',
  'kMMMMMMMMMMMMMmk',
  'kkkkkkkkkkkkkkkk',
  '.kRRRRRRRRRRRRk.',
  '.kkkkkkkkkkkkkk.',
], { k: INK, H: '#c88848', h: '#8a5428', w: '#f0c890', M: iman_C.M, m: iman_C.m, R: iman_C.R });
dib('iman_moneda', [
  '..kkk..',
  '.kywyk.',
  'kywyyok',
  'kyyyyok',
  'kyyyook',
  '.kyook.',
  '..kkk..',
], { k: INK, y: iman_C.oro, w: '#fff8c0', o: '#c09018' });

// ── ayudantes ──
// polígono relleno a píxel (par-impar), con contorno opcional
function iman_poli(pts, c, ink) {
  let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); } g.fillStyle = c;
  for (let y = Math.ceil(y0); y <= Math.floor(y1); y++) { const xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + (y - ay) / (by - ay) * (bx - ax)); }
    xs.sort((p, q) => p - q); for (let i = 0; i + 1 < xs.length; i += 2) { const xa = Math.round(xs[i]), xb = Math.round(xs[i + 1]); g.fillRect(xa, y, Math.max(1, xb - xa + 1), 1); } }
  if (ink) path([...pts, pts[0]], ink, 1);
}
// aguja de brújula: mitad roja (apunta a q) y mitad blanca, con su eje
function iman_aguja(x, y, q, L, w) {
  const C = iman_C, c = Math.cos(q), s = Math.sin(q), T = [x + c * L, y + s * L], K = [x - c * L, y - s * L]; let P1 = [x - s * w, y + c * w], P2 = [x + s * w, y - c * w]; if (P1[1] > P2[1]) [P1, P2] = [P2, P1];
  const O = [x, y]; iman_poli([T, P1, O], C.Rl); iman_poli([T, P2, O], C.R); iman_poli([K, P1, O], '#ffffff'); iman_poli([K, P2, O], '#b0b8cc');
  path([T, P1, K, P2, T], INK, 1); pl(x, y, T[0] - c * 3, T[1] - s * 3, C.r); pl(x, y, K[0] + c * 3, K[1] + s * 3, C.m);
  const e = Math.max(1, Math.round(w / 3)); disc(Math.round(x), Math.round(y), e + 1, INK); disc(Math.round(x), Math.round(y), e, C.oro);
}
// arco de campo magnético
function iman_onda(x, y, r, a0, a1, c, w = 2) { const n = Math.max(4, Math.ceil(r * (a1 - a0))); for (const [col, ww] of [['rgba(20,16,32,.7)', w + 2], [c, w]]) for (let i = 0; i <= n; i++) { const an = lerp(a0, a1, i / n); px(x + Math.cos(an) * r - (ww >> 1), y + Math.sin(an) * r - (ww >> 1), col, ww); } }
// chispas sin pasar por burst (para no adelantar el golpe)
function iman_chis(x, y, n, c, v = 3.2) { for (let i = 0; i < n; i++) { const an = rnd(0, 6.283), sp = rnd(1, v); part({ x, y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, ay: .15, life: ri(10, 22), c: pick(c), s: 3, shrink: 1, drag: .95 }); } }
// espiral de mareo
function iman_espiral(x, y, R, ph, c) { disc(Math.round(x), Math.round(y), R + 2, 'rgba(20,16,32,.75)'); for (let i = 0; i <= 30; i++) { const u = i / 30, an = ph + u * 3.4 * Math.PI, r = u * R; px(x + Math.cos(an) * r - 1, y + Math.sin(an) * r - 1, c, 2); } }

Object.assign(ANIM, {
  // ── IMÁN ──
  async imantar(a, d) { // un imán de herradura lo imanta y las limaduras lo cubren como una armadura
    const C = iman_C, en = a.k === 'en', dx = en ? 1 : 0, dy = en ? 0 : 1, hx = en ? a.cx - 40 : a.cx, hy = en ? a.cy + 6 : a.cy - 36, th = Math.atan2(dy, dx), m = { o: 70 };
    snd(t => { osc('sin', [150, 300], t, .95, .12, sfxG, { vib: 1 }); for (let i = 0; i < 16; i++) noise(t + .25 + i * .035, .03, .1, sfxG, { f: 7000 }); osc('p25', [1800, 2600], t + .9, .14, .09, sfxG); osc('p50', [2400, 1800], t + .9, .2, .07, sfxG); });
    const fil = Array.from({ length: 32 }, (_, i) => { const an = i / 32 * 6.283 + rnd(-.08, .08), r = rnd(74, 104); return { an, x0: a.cx + Math.cos(an) * r, y0: a.cy + Math.sin(an) * r, x1: a.cx + Math.cos(an) * rnd(14, 20), y1: a.cy + 3 + Math.sin(an) * rnd(16, 23), t0: 12 + ((i * 7) % 32) * .55, L: rnd(3, 5), ok: 0 }; });
    const lima = (f, x, y) => { const ex = Math.cos(f.an) * f.L, ey = Math.sin(f.an) * f.L; opl(x - ex, y - ey, x + ex, y + ey, C.m, 2); pl(x, y, x + ex, y + ey, C.M, 2); px(x + ex, y + ey, '#ffffff'); };
    const limas = t => { for (const f of fil) { const q = clamp((t - f.t0) / 13, 0, 1); if (q <= 0) continue; const e = EASE.in(q); lima(f, lerp(f.x0, f.x1, e), lerp(f.y0, f.y1, e)); if (q >= 1 && !f.ok) { f.ok = 1; part({ x: f.x1, y: f.y1, life: 6, c: '#ffffff', s: 2 }); } } };
    tw(m, { o: 0 }, 12, 'back'); tw(a.spr, { sx: 1.08, sy: .93 }, 10, 'out');
    await fx(46, (k, t) => {
      const x = hx - dx * m.o, y = hy - dy * m.o, j = t > 10 && t & 2 ? 1 : 0;
      if (t > 10 && t < 38) for (let i = 0; i < 2; i++) { const r = ((t * 1.4 + i * 13) % 26) + 6; g.globalAlpha = 1 - r / 36; iman_onda(x + dx * 18 - dy * 14, y + dy * 18 + dx * 14, r, th - 1.2, th + .5, C.R); iman_onda(x + dx * 18 + dy * 14, y + dy * 18 - dx * 14, r, th - .5, th + 1.2, C.B); g.globalAlpha = 1; }
      sello('iman_herradura', x + j * dy, y + j * dx, { k: 2, rot: en ? 3 : 0 }); limas(t);
      if (t > 24) { a.spr.tint = C.m; a.spr.ox = (t & 1) ? 1 : -1; }
      if (t === 36) tw(m, { o: 80 }, 10, 'in'); });
    a.spr.ox = 0; a.spr.tint = C.M; flash('#ffffff', .35); shake(2); a.spr.sx = 1.2; a.spr.sy = .86; tw(a.spr, { sx: 1, sy: 1 }, 16, 'elastic');
    burst(a.cx, a.cy, 12, { c: [C.M, '#ffffff', C.m], v0: 1.2, v1: 3, kind: 'star' });
    await fx(20, (k, t) => { g.globalAlpha = 1 - k * k; for (const f of fil) lima(f, f.x1, f.y1); g.globalAlpha = 1;
      const sw = -30 + k * 60; g.globalAlpha = .75; pl(a.cx + sw - 9, a.cy + 22, a.cx + sw + 9, a.cy - 22, '#ffffff', 3); pl(a.cx + sw - 3, a.cy + 22, a.cx + sw + 15, a.cy - 22, '#ffffff', 1); g.globalAlpha = 1;
      [[-17, -14, 0], [16, -4, 5], [-8, 14, 10]].forEach(([dx, dy, t0]) => { const u = t - t0; if (u >= 0 && u < 9) sello('iman_brillo', a.cx + dx, a.cy + dy, { k: u > 1 && u < 6 ? 2 : 1 }); }); });
    a.spr.tint = null;
  },
  async tuercazo(a, d) { // una tuerca gorda coge vueltas junto al atacante y sale disparada
    const C = iman_C, s = dirOf(a), x0 = a.cx + s * 24, y0 = a.cy - s * 12 - 8, tr = [];
    const tuerca = (x, y, f, o) => sello(f & 1 ? 'iman_tuercaB' : 'iman_tuercaA', x, y, o);
    snd(t => { osc('sin', [400, 900], t, .46, .08, sfxG); for (let i = 0; i < 6; i++) noise(t + .1 + i * .06, .03, .07, sfxG, { f: 5000 }); osc('p50', [2400, 1800], t + .5, .22, .16, sfxG); osc('p50', [3600, 2700], t + .5, .22, .08, sfxG); noise(t + .5, .08, .25, sfxG, { f: 2500 }); });
    tw(a.spr, { ox: -s * 7, oy: s * 2, sx: 1.12, sy: .9 }, 10, 'out'); let gi = 0;
    await fx(20, (k, t) => { const y = y0 - Math.round(EASE.out(Math.min(1, k * 2)) * 5); if (t % (k < .4 ? 3 : k < .75 ? 2 : 1) === 0) gi++;
      for (let i = 0; i < 2; i++) { const r = 20 - ((t * 1.2 + i * 9) % 18); iman_onda(x0, y, r, Math.PI * .6, Math.PI * 1.4, C.R); iman_onda(x0, y, r, -Math.PI * .4, Math.PI * .4, C.B); }
      tuerca(x0 + (k > .6 && t & 1 ? 1 : 0), y, gi); if (t === 2 || t === 12) sello('iman_brillo', x0 - 7, y - 7); });
    tw(a.spr, { ox: s * 9, oy: -s * 3, sx: .94, sy: 1.06 }, 4, 'out'); const p = { k: 0 }; tw(p, { k: 1 }, 9, 'in');
    await fx(9, (k, t) => { const x = lerp(x0, d.cx, p.k), y = lerp(y0 - 5, d.cy, p.k) - Math.sin(p.k * Math.PI) * 6; tr.push([x, y]); if (tr.length > 4) tr.shift();
      g.globalAlpha = .5; pl(x0, y0 - 5, x, y, '#ffffff', 3); g.globalAlpha = 1; tr.forEach(([qx, qy], i) => i < tr.length - 1 && tuerca(qx, qy, t + i, { a: .18 + i * .14 })); tuerca(x, y, t); });
    shake(5); flash('#ffffff', .3); iman_chis(d.cx, d.cy, 14, ['#ffffff', C.M, C.oro]); d.spr.sx = .84; d.spr.sy = 1.14; tw(d.spr, { sx: 1, sy: 1 }, 14, 'elastic'); reposo(a);
    const b = { x: d.cx - s * 4, y: d.cy - 4, vx: -s * 1.5, vy: -3.6 };
    await fx(24, (k, t) => { b.vy += .34; b.x += b.vx; b.y += b.vy; g.globalAlpha = k > .7 ? (1 - k) / .3 : 1; tuerca(b.x, b.y, t >> 1); g.globalAlpha = 1;
      if (t < 14) { const tx = clamp(d.cx - s * 34 - 16, 2, W - 40), ty = d.cy - (d.k === 'en' ? 2 : 30) - Math.round(EASE.out(Math.min(1, t / 5)) * 4); txtO('¡CLONC!', tx, ty, t & 2 ? '#ffffff' : C.oro); } });
  },
  async desorientar(a, d) { // una brújula enorme junto al rival: la aguja se vuelve loca y él se marea
    const C = iman_C, s = dirOf(a), cx = 79 + s * 8, cy0 = 41, c = { y: -30, al: 1 }, th = Math.atan2(d.cy - cy0, d.cx - cx); let an = -Math.PI / 2;
    const hy = Math.max(9, d.cy - 26);
    snd(t => { for (let i = 0; i < 11; i++) osc('sin', [800 + (i & 1) * 400, 600 + (i & 1) * 300], t + .1 + i * .09, .09, .07, sfxG); osc('p25', [500, 1500], t + .05, .1, .05, sfxG); osc('saw', [900, 200], t + 1.02, .2, .05, sfxG); });
    tw(c, { y: cy0 }, 12, 'bounce'); tw(a.spr, { sx: 1.08, sy: .94 }, 8, 'out');
    const bruj = (t, loca) => { const x = cx + (loca && t & 2 ? 1 : 0), y = Math.round(c.y); sello('iman_brujula', x, y, { a: c.al }); g.globalAlpha = c.al; txt('N', x - 2, y - 9, C.R); if (loca > 1) { for (let j = 1; j <= 2; j++) { g.globalAlpha = c.al * (.4 - j * .12); iman_aguja(x, y, an - j * .5, 11, 3); } g.globalAlpha = c.al; } iman_aguja(x, y, an, 11, 3); g.globalAlpha = 1; };
    await fx(12, (k, t) => bruj(t, 0));
    await fx(46, (k, t) => { const v = .22 + k * .5 + Math.sin(t * .31) * .45; an += v * (Math.sin(t * .13) > -.2 ? 1 : -1.4);
      for (let i = 0; i < 3; i++) { const r = ((t * 1.5 + i * 9) % 27) + 20; g.globalAlpha = 1 - (r - 20) / 30; iman_onda(cx, c.y, r, th - .55, th + .55, i & 1 ? C.B : C.R); g.globalAlpha = 1; }
      bruj(t, 2);
      d.spr.ox = Math.round(Math.sin(t * .28) * (2 + k * 4)); d.spr.sx = 1 + Math.sin(t * .56) * .07; d.spr.sy = 1 - Math.sin(t * .56) * .05;
      for (let i = 0; i < 3; i++) { const o = t * .16 + i * 2.094, ex = d.cx + d.spr.ox + Math.cos(o) * 20, ey = hy + Math.sin(o) * 6; if (k * 3 > i * .5) iman_espiral(ex, ey, 6, -t * .5 + i, i === 1 ? '#ffffff' : C.oro); }
      if (t % 12 === 6) part({ x: d.cx + rnd(-14, 14), y: hy + 4, vy: -.5, life: 16, c: '#ffffff', s: 2 }); });
    tw(c, { al: 0, y: cy0 - 8 }, 10, 'in'); for (let i = 0; i < 6; i++) part({ x: cx + rnd(-10, 10), y: cy0 + rnd(-10, 10), vx: rnd(-.8, .8), vy: -rnd(.2, 1), life: ri(12, 20), c: pick(['#ffffff', '#f8e088']), s: 5, kind: 'puff', shrink: 1 });
    tw(d.spr, { ox: 0, sx: 1, sy: 1 }, 12, 'elastic');
    await fx(14, (k, t) => { bruj(t, 1); an += .5 * (1 - k); g.globalAlpha = 1 - k; for (let i = 0; i < 3; i++) { const o = (46 + t) * .16 + i * 2.094; iman_espiral(d.cx + Math.cos(o) * 20, hy + Math.sin(o) * 6 - k * 5, 6, -t * .5 + i, i === 1 ? '#ffffff' : C.oro); } g.globalAlpha = 1; });
    d.spr.ox = 0; d.spr.sx = 1; d.spr.sy = 1;
  },
  async agujazo(a, d) { // la aguja gigante busca el norte del rival, se carga y se clava
    const C = iman_C, s = dirOf(a), ang = Math.atan2(d.cy - a.cy, d.cx - a.cx), ux = Math.cos(ang), uy = Math.sin(ang), L = 26, A = 6;
    const n = { x: a.cx + s * 31, y: a.cy - s * 21 - 9, back: 0 }, bx = d.cx, by = Math.max(9, d.cy - 30);
    snd(t => { osc('sin', [300, 1200], t, .4, .06, sfxG); osc('p25', 1600, t + .4, .05, .1, sfxG); osc('p25', 2400, t + .46, .08, .08, sfxG); osc('saw', [1500, 400], t + .6, .12, .08, sfxG); noise(t + .7, .08, .3, sfxG, { f: 4000 }); osc('sin', [220, 180], t + .72, .3, .08, sfxG, { vib: 1 }); });
    const esfera = al => { g.globalAlpha = al; for (let i = 0; i < 12; i++) { const q = i * Math.PI / 6; px(n.x + Math.cos(q) * 31 - 1, n.y + Math.sin(q) * 31 - 1, 'rgba(20,16,32,.8)', 4); px(n.x + Math.cos(q) * 31, n.y + Math.sin(q) * 31, i % 3 ? C.m : '#ffffff', 2); } g.globalAlpha = 1; };
    const norte = (t, y = 0) => { sello('iman_N', bx, by + y, { k: t < 3 ? 2 : 1 }); if (t >= 3 && (t >> 2) & 1) txtO('▼', bx - 2, by + 8 + y, C.R); };
    tw(a.spr, { sx: 1.08, sy: .93 }, 8, 'out');
    await fx(24, k => { const q = ang + (1 - EASE.out(k)) * Math.PI * 7; esfera(Math.min(1, k * 4)); for (let j = 2; j >= 1; j--) { g.globalAlpha = .3 * (1 - k); iman_aguja(n.x, n.y, q - j * .7 * (1 - k), L, A); } g.globalAlpha = 1; iman_aguja(n.x, n.y, q, L, A); });
    tw(n, { back: 13 }, 12, 'out'); tw(a.spr, { ox: -s * 6, oy: s * 2 }, 12, 'out');
    await fx(12, (k, t) => { esfera(1 - k); norte(t); const j = t & 1 ? 1 : 0, x = n.x - ux * n.back, y = n.y - uy * n.back + j;
      for (let i = 0; i < 3; i++) { const r = 16 - ((t * 2 + i * 6) % 16); iman_onda(x + ux * L, y + uy * L, r, ang + 1.9, ang + 4.4, C.Rl, 1); }
      iman_aguja(x, y, ang, L, A); sello('iman_brillo', x + ux * L, y + uy * L, { k: t & 2 ? 2 : 1 }); });
    const p = { k: 0 }, x0 = n.x - ux * 13, y0 = n.y - uy * 13, x1 = d.cx - ux * 18, y1 = d.cy - uy * 18; tw(p, { k: 1 }, 6, 'in'); tw(a.spr, { ox: s * 7, oy: -s * 2, sx: .95, sy: 1.05 }, 4, 'out');
    await fx(6, (k, t) => { const x = lerp(x0, x1, p.k), y = lerp(y0, y1, p.k); norte(12 + t); g.globalAlpha = .55; pl(x0 - ux * L, y0 - uy * L, x, y, '#ffffff', 5); g.globalAlpha = 1; pl(x0 - ux * L, y0 - uy * L, x, y, C.Rl, 1); iman_aguja(x, y, ang, L, A); });
    shake(5); flash('#ffffff', .35); iman_chis(d.cx, d.cy, 14, [C.R, '#ffffff', C.Rl]); d.spr.sx = .86; d.spr.sy = 1.12; tw(d.spr, { sx: 1, sy: 1 }, 14, 'elastic'); reposo(a);
    const nb = { y: 0, vy: -3 };
    await fx(20, (k, t) => { const w = Math.sin(t * 1.7) * .26 * (1 - k), q = ang + w, tx = d.cx + ux * 7, ty = d.cy + uy * 7; nb.vy += .4; nb.y += nb.vy;
      if (t < 12) { g.globalAlpha = 1 - t / 12; sello('iman_N', bx + s * t, by + nb.y, { rot: t >> 1 }); g.globalAlpha = 1; }
      g.globalAlpha = k > .65 ? (1 - k) / .35 : 1; iman_aguja(tx - Math.cos(q) * L, ty - Math.sin(q) * L, q, L, A); g.globalAlpha = 1; });
  },
  async magnetismo(a, d) { // un imán gigante baja del cielo, se lleva la chatarra y la suelta sobre el rival
    const C = iman_C, s = dirOf(a), mx = d.cx, my0 = d.k === 'en' ? 12 : d.cy - 34, m = { y: -28 }, sy = feet(d);
    snd(t => { osc('sin', [100, 400], t, .75, .14, sfxG, { vib: 1, sus: 1 }); [.33, .43, .53].forEach((q, i) => { osc('p50', [2000 + i * 300, 1500], t + q, .06, .09, sfxG); noise(t + q, .03, .12, sfxG, { f: 6000 }); }); osc('sin', [500, 120], t + .75, .22, .08, sfxG);
      osc('p50', [300, 90], t + 1.03, .16, .2, sfxG); noise(t + 1.03, .1, .3, sfxG, { f: 1200 }); osc('p50', [1500, 1100], t + 1.12, .12, .12, sfxG); osc('p50', [900, 700], t + 1.22, .25, .14, sfxG); osc('p50', [1350, 1050], t + 1.22, .25, .07, sfxG); });
    const ob = [
      { id: 'iman_yunque', k: 2, x0: mx < 80 ? W + 30 : -30, y0: my0 + 64, cx: 2, cy: 33, t0: 19, td: 0, ty: d.cy - 16, bx: s * 1.1, by: -2.4, sp: 0 },
      { id: 'iman_llave', k: 1, x0: -20, y0: my0 + 50, cx: -25, cy: 20, t0: 8, td: 6, ty: d.cy - 14, bx: -s * 1.9, by: -3.4, sp: 1 },
      { id: 'iman_sarten', k: 1, x0: W + 28, y0: my0 + 40, cx: 30, cy: 22, t0: 13, td: 12, ty: d.cy - 10, bx: s * 2.3, by: -3.6, sp: 1 },
    ];
    tw(m, { y: my0 }, 10, 'back'); tw(a.spr, { sx: 1.08, sy: .93 }, 10, 'out');
    const iman = t => sello('iman_herradura', mx + (t & 2 ? 1 : 0), m.y, { k: 2 });
    await fx(36, (k, t) => {
      if (t > 8) for (let i = 0; i < 2; i++) { const r = ((t * 1.4 + i * 13) % 26) + 6; g.globalAlpha = 1 - r / 36; iman_onda(mx - 14, m.y + 18, r, .4, Math.PI - .5, C.R); iman_onda(mx + 14, m.y + 18, r, .5, Math.PI - .4, C.B); g.globalAlpha = 1; }
      iman(t);
      for (const o of ob) { const q = clamp((t - o.t0) / 12, 0, 1); if (q <= 0) continue; const e = EASE.in(q), x = lerp(o.x0, mx + o.cx, e), y = lerp(o.y0, m.y + o.cy, e);
        if (q < 1) { g.globalAlpha = .45; pl(lerp(o.x0, x, .6), lerp(o.y0, y, .6), x, y, '#ffffff', 2); g.globalAlpha = 1; }
        sello(o.id, x, y, { k: o.k, rot: q < 1 && o.sp ? t >> 1 : 0 }); if (q >= 1 && !o.ok) { o.ok = 1; shake(2); for (let i = 0; i < 5; i++) part({ x: x + rnd(-6, 6), y: y - 6, vx: rnd(-2, 2), vy: rnd(-1, 2), ay: .1, life: ri(8, 14), c: pick(['#ffffff', C.oro]), s: 2 }); } } });
    tw(m, { y: -64 }, 8, 'in'); reposo(a);
    await fx(8, (k, t) => { iman(0); for (const o of ob) sello(o.id, mx + o.cx, m.y + o.cy, { k: o.k }); });
    const sombra = r => { g.globalAlpha = .5; ell(g, Math.round(d.cx), Math.round(sy) - 1, Math.round(r), Math.max(1, Math.round(r / 5)), '#0c0a18'); g.globalAlpha = 1; };
    await fx(6, k => sombra(4 + k * 10));
    await fx(32, (k, t) => { if (!ob[0].st) sombra(14 + t);
      for (const o of ob) { const u = t - o.td; if (u < 0) continue;
        if (!o.st) { const q = Math.min(1, (u + 1) / 6), y = lerp(-24, o.ty, q * q); o.x = d.cx + o.cx * .3; o.y = y; g.globalAlpha = .5; pl(o.x, y - 30, o.x, y - 10, '#ffffff', 3); g.globalAlpha = 1;
          if (q >= 1) { o.st = 1; o.vx = o.bx; o.vy = o.by; iman_chis(o.x, o.y + 6, 8, ['#ffffff', C.M, C.oro]);
            if (o === ob[0]) { shake(6); flash('#ffffff', .4); d.spr.sx = 1.25; d.spr.sy = .68; tw(d.spr, { sx: 1, sy: 1 }, 16, 'elastic'); dust(d.cx - 24 * s, sy - 2, 6); } else { shake(3); d.spr.sy = .84; d.spr.sx = 1.1; tw(d.spr, { sx: 1, sy: 1 }, 10, 'elastic'); } } }
        else { o.vy += .42; o.x += o.vx; o.y += o.vy; o.n = (o.n || 0) + 1; }
        g.globalAlpha = o.st && o.n > 10 ? Math.max(0, 1 - (o.n - 10) / 8) : 1; sello(o.id, o.x, o.y, { k: o.k, rot: o.st && o.sp ? o.n >> 1 : 0 }); g.globalAlpha = 1; } });
    d.spr.sx = 1; d.spr.sy = 1;
  },
  async polaridad(a, d) { // los polos N y S giran a su alrededor, se alinean y sale disparado hacia el norte
    const C = iman_C, s = dirOf(a), rx = 28, ry = 20, nx = a.cx + s * rx, sx = a.cx - s * rx, fin = s > 0 ? 0 : Math.PI;
    snd(t => { osc('sin', [300, 600], t, .4, .1, sfxG); osc('p25', 1800, t + .4, .08, .1, sfxG); osc('p50', [1200, 900], t + .4, .08, .08, sfxG); osc('sin', [450, 900], t + .42, .34, .1, sfxG); noise(t + .78, .22, .14, sfxG, { f: [1200, 6000], type: 'bandpass', swell: 1 }); osc('p25', [900, 2400], t + .78, .18, .07, sfxG); });
    await fx(24, (k, t) => { const e = 1 - EASE.out(k), rot = fin - e * Math.PI * 5;
      for (let j = 3; j >= 0; j--) { const q = rot + j * .32 * e, al = j ? .32 - j * .08 : 1; if (j && e < .05) continue; sello('iman_N', a.cx + Math.cos(q) * rx, a.cy + Math.sin(q) * ry, { a: al, k: j ? 1 : 2 }); sello('iman_S', a.cx - Math.cos(q) * rx, a.cy - Math.sin(q) * ry, { a: al, k: j ? 1 : 2 }); }
      a.spr.sx = 1 - .08 * Math.abs(Math.sin(rot)); a.spr.ox = Math.round(Math.cos(rot) * 2 * e); });
    a.spr.ox = 0; shake(2); flash('#ffffff', .25); a.spr.sx = 1.2; a.spr.sy = .84; tw(a.spr, { sx: 1.08, sy: .94 }, 10, 'elastic');
    const polos = (dx, al = 1) => { sello('iman_N', nx + s * dx, a.cy, { k: 2, a: al }); sello('iman_S', sx - s * dx, a.cy, { k: 2, a: al }); };
    const campo = (t, al) => { g.globalAlpha = al; for (let j = 1; j <= 3; j++) for (const sg of [-1, 1]) for (let i = 0; i <= 22; i++) { if ((i + 44 - (t >> 1)) % 4 === 0) continue; const u = i / 22, x = lerp(nx, sx, u), y = a.cy + sg * Math.sin(u * Math.PI) * (4 + j * 8); px(x - 1, y - 1, 'rgba(20,16,32,.7)', 4); px(x, y, u < .5 ? (j & 1 ? C.R : C.Rl) : (j & 1 ? C.B : C.Bl), 2); } g.globalAlpha = 1; };
    await fx(20, (k, t) => { campo(t, Math.min(1, k * 4)); polos(t < 3 ? 3 - t : 0); a.spr.tint = (t >> 2) & 1 ? C.B : C.R; if (t < 4) { sello('iman_brillo', nx, a.cy - 13, { k: 2 }); sello('iman_brillo', sx, a.cy + 13, { k: 2 }); } });
    a.spr.tint = null; flash('#e0e8ff', .4); const gh = ghosts(a, 6);
    burst(a.cx, a.cy, 12, { c: [C.R, C.B, '#ffffff'], v0: 1.5, v1: 3.5, kind: 'star' });
    fx(20, (k, t) => { gh(); campo(20 + t, 1 - k); polos(k * 14, 1 - k);
      g.fillStyle = '#ffffff'; for (let i = 0; i < 7; i++) { const lx = a.cx - s * (((t * 13 + i * 29) % 70) - 20), ly = a.cy - 24 + i * 8; g.globalAlpha = (1 - k) * .8; g.fillRect(Math.round(lx) - 9, ly, 18, i & 1 ? 1 : 2); } g.globalAlpha = 1; });
    await tw(a.spr, { ox: s * 20, oy: -s * 7, sx: 1.12, sy: .92 }, 4, 'out'); await tw(a.spr, { ox: -s * 8, oy: s * 3, sx: .96, sy: 1.04 }, 5, 'io'); await tw(a.spr, { ox: s * 10, oy: -s * 3 }, 3, 'out'); await reposo(a);
  },
  // ── la cuenta ──
  async factura(a, d) { // el recibo de la luz le cae delante de las narices, la cifra se dispara y un tampón lo sella: PAGAR
    const C = iman_C, fc = d.cx, Wd = 46, Hh = 54, X0 = fc - 23, Y0 = d.k === 'en' ? 1 : 43, cyT = Y0 + 14, st = { h: 5, x: 30, y: -90, mark: 0, fall: 0, al: 1, n: -1, jit: 0 };
    const cifras = ['12', '99', '480', '999', '9.999', '99.999', '999.999', '9.999.999'];
    snd(t => { for (let i = 0; i < 12; i++) osc('p25', 1400 + (i % 3) * 200, t + i * .04, .03, .06, sfxG); for (let i = 0; i < 8; i++) osc('p25', [700 + i * 180, 760 + i * 180], t + .28 + i * .033, .03, .07, sfxG);
      noise(t + .68, .1, .34, sfxG, { f: 1800 }); osc('p50', [180, 70], t + .68, .16, .2, sfxG); osc('p50', [1000, 1400], t + .86, .1, .1, sfxG); osc('p50', [700, 500], t + 1.0, .22, .1, sfxG); });
    const hoja = t => { const h = Math.round(st.h), x = X0 + (st.jit && t & 1 ? 1 : 0), y = Math.round(Y0 + st.fall), ve = q => q <= h; if (st.al < .03) return; g.globalAlpha = st.al;
      g.fillStyle = 'rgba(12,10,24,.45)'; g.fillRect(x + 3, y + 3, Wd, h); g.fillStyle = INK; g.fillRect(x - 1, y - 1, Wd + 2, h + 2); for (let i = 0; i < Wd; i += 4) g.fillRect(x + i, y + h, 4, 3);
      g.fillStyle = PAPER; g.fillRect(x, y, Wd, h); for (let i = 0; i < Wd; i += 4) g.fillRect(x + i + 1, y + h, 2, 2); g.fillStyle = '#dcd8c0'; g.fillRect(x + Wd - 3, y, 3, h);
      if (ve(13)) { sello('iman_rayo', x + 7, y + 7, { a: st.al }); g.globalAlpha = st.al; txt('LUZ', x + 14, y + 4, INK); g.fillStyle = C.oro; g.fillRect(x + 32, y + 4, 9, 7); g.fillStyle = INK; g.fillRect(x + 34, y + 6, 5, 1); g.fillRect(x + 34, y + 8, 5, 1); }
      if (ve(15)) { g.fillStyle = INK; g.fillRect(x + 3, y + 14, Wd - 8, 1); }
      for (let i = 0; i < 3; i++) if (ve(20 + i * 5)) { g.fillStyle = '#a8a494'; g.fillRect(x + 4, y + 18 + i * 5, 13 + (i * 7) % 9, 2); g.fillStyle = '#686456'; g.fillRect(x + Wd - 8 - (6 + i * 4), y + 18 + i * 5, 6 + i * 4, 2); }
      if (ve(35)) { g.fillStyle = INK; g.fillRect(x + 3, y + 32, Wd - 8, 1); g.fillRect(x + 3, y + 34, Wd - 8, 1); }
      if (ve(44)) txt('TOTAL', x + 4, y + 36, '#686456');
      if (ve(53) && st.n >= 0) { const c = cifras[Math.min(7, st.n)], cw = tw_(c), nx = x + Wd - 5 - cw, col = st.n >= 7 ? (t & 2 ? C.R : '#ff9020') : C.R; if (nx < x + 3) txtO(c, nx, y + 45, col, PAPER); else txt(c, nx, y + 45, col); }
      if (st.mark) { const L = fc - 19, yt = y + 16, dy = i => Math.round(5 - i * 5 / 38); g.fillStyle = PAPER; for (let i = 0; i <= 38; i++) g.fillRect(L + i, yt + dy(i) + 1, 1, 12);
        for (const o of [0, 13]) { pl(L, yt + 5 + o, L + 38, yt + o, C.R, 2); } pl(L, yt + 5, L, yt + 18, C.R, 2); pl(L + 38, yt, L + 38, yt + 13, C.R, 2);
        let qx = L + 5; for (const ch of 'PAGAR') { txt(ch, qx, yt + dy(qx - L) + 4, C.R); txt(ch, qx + 1, yt + dy(qx - L) + 4, C.R); qx += tw_(ch) + 2; } }
      g.globalAlpha = 1; };
    const tampon = () => sello('iman_tampon', fc + 1 + st.x, cyT + st.y, { k: 2 });
    tw(st, { h: Hh }, 16, 'out'); tw(a.spr, { sx: 1.08, sy: .93 }, 6, 'out');
    await fx(16, (k, t) => { a.spr.ox = t & 1 ? 1 : -1; hoja(t); if (t % 3 === 0) part({ x: X0 + rnd(4, Wd - 4), y: Y0 + st.h, vy: .6, life: 8, c: PAPER, s: 2 }); });
    a.spr.ox = 0; reposo(a); st.jit = 1; tw(st, { y: -8 }, 10, 'back');
    await fx(17, (k, t) => { st.n = Math.min(7, Math.floor(t / 2)); hoja(t); tampon(); if (t % 5 === 2) for (const q of [-1, 1]) part({ x: fc + q * 26, y: Y0 + 20 + rnd(0, 14), vx: q * 1.4, vy: -1.2, ay: .12, life: 14, c: '#9cd4f8', s: 3, shrink: 1 }); });
    st.jit = 0; const pre = fx(8, (k, t) => { hoja(t); tampon(); }); await tw(st, { x: 36, y: -17 }, 5, 'out'); await tw(st, { x: 0, y: 0 }, 3, 'in'); await pre;
    shake(5); flash('#ffffff', .4); st.mark = 1; d.spr.sx = 1.16; d.spr.sy = .8; tw(d.spr, { sx: 1, sy: 1 }, 14, 'elastic');
    for (let i = 0; i < 8; i++) part({ x: fc + rnd(-18, 18), y: Y0 + 30 + rnd(-3, 3), vx: rnd(-1.8, 1.8), vy: rnd(-1.2, .6), life: ri(10, 18), c: pick(['#ffffff', '#f0d0d0']), s: 4, kind: 'puff', shrink: 1 });
    const mon = Array.from({ length: 7 }, (_, i) => ({ t0: 14 + i * 2, h: 16 + (i * 7) % 14, sx: ((i * 5) % 7) - 3 }));
    tw(st, { x: 14, y: -90 }, 12, 'in');
    await fx(40, (k, t) => { if (t === 13) tw(st, { fall: 46, al: 0 }, 9, 'in');
      hoja(t); if (t < 12) tampon();
      if (t > 2 && t < 34) { d.spr.white = true; d.spr.sx = 1 + (t & 1 ? .04 : -.04); } else if (t >= 34) { d.spr.white = false; d.spr.sx = 1; }
      for (const m of mon) { const q = (t - m.t0) / 14; if (q < 0 || q > 1) continue; const x = lerp(d.cx + m.sx * 3, a.cx, q), y = lerp(d.cy - 6, a.cy - 4, q) - Math.sin(q * Math.PI) * m.h; sello('iman_moneda', x, y, { fx: (t >> 1) & 1 }); if (q > .9) part({ x, y, life: 6, c: '#fff8c0', s: 2 }); } });
    d.spr.white = false; d.spr.sx = 1; d.spr.sy = 1;
  },
});
BD.imantar = ['#141428', 0.72]; BD.tuercazo = ['#1c1c30', 0.62]; BD.desorientar = ['#201430', 0.70]; BD.agujazo = ['#141428', 0.72]; BD.magnetismo = ['#140c28', 0.75]; BD.polaridad = ['#141428', 0.72]; BD.factura = ['#1c1810', 0.68];
