'use strict';
// ───────── el vínculo con el Makinamon que te sigue (como en Amarillo) ─────────
// m.afecto 0..255: sube al caminar juntos, ganar, curarlo, darle objetos y reforjarse; baja si cae agotado.
const AFECTO0 = 70;
const afecto = m => m.afecto ?? AFECTO0;
function darAfecto(m, n) { if (!m) return; m.afecto = clamp(afecto(m) + n, 0, 255); }

// iconos de emoción 9×9 (k tinta, c color, w brillo)
const EMO = {
  corazon: { c: '#e84868', m: ['.kk...kk.', 'kcck.kcck', 'kcwcccccK', 'kcccccccK', '.kcccccK.', '..kcccK..', '...kcK...', '....k....', '.........'] },
  nota: { c: '#3858c8', m: ['....kkkk.', '....kcck.', '....k..k.', '....k..k.', '....k..k.', '.kkkk.kkk', 'kcck.kcck', 'kcck.kcck', '.kk...kk.'] },
  gota: { c: '#5aa8f0', m: ['....k....', '...kck...', '...kck...', '..kccck..', '..kcwck..', '.kccccck.', '.kcccccK.', '..kccck..', '...kkk...'] },
  zzz: { c: '#3858c8', m: ['.....kkkk', '.......k.', '......k..', 'kkkk.kkkk', '...k.....', '..k......', '.k.......', 'kkkk.....', '.........'] },
  enfado: { c: '#e84848', m: ['.kk...kk.', 'kcck.kcck', 'kc.k.k.ck', '.k.....k.', '.........', '.k.....k.', 'kc.k.k.ck', 'kcck.kcck', '.kk...kk.'] },
  excl: { c: '#e84848', m: ['...kkk...', '...kck...', '...kck...', '...kck...', '...kck...', '...kkk...', '.........', '...kck...', '...kkk...'] },
  preg: { c: '#3858c8', m: ['..kkkkk..', '.kccccck.', '.kck.kck.', '....kcck.', '...kcck..', '...kck...', '...kkk...', '...kck...', '...kkk...'] },
  chispa: { c: '#f8d030', m: ['....k....', '...kck...', '...kck...', 'kkkcwckkk', 'kcccwccck', 'kkkcwckkk', '...kck...', '...kck...', '....k....'] },
  puntos: { c: '#606070', m: ['.........', '.........', '.........', '.........', 'kk.kk.kk.', 'kk.kk.kk.', '.........', '.........', '.........'] },
  sudor: { c: '#5aa8f0', m: ['.......k.', '......kck', '......kck', '.....kcck', '.....kwck', '......kk.', '.........', '.........', '.........'] },
};
const EMOC = {};
function emoIcon(id) { if (EMOC[id]) return EMOC[id]; const d = EMO[id], [cv, c] = mk(9, 9); d.m.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; c.fillStyle = ch === 'k' || ch === 'K' ? INK : ch === 'w' ? '#ffffff' : d.c; c.fillRect(x, y, 1, 1); })); return EMOC[id] = cv; }
// las viñetas del mapa admiten iconos además de letras
const EMO_DE = { '♥': 'corazon', '!': 'excl', '?': 'preg', '…': 'puntos', '♪': 'nota', 'z': 'zzz', '#': 'enfado', '*': 'chispa', '~': 'sudor' };
function drawEmote(x, y, ch) {
  const id = EMO[ch] ? ch : EMO_DE[ch];
  box(x, y, 14, 15); g.fillStyle = PAPER; g.fillRect(x + 5, y + 14, 4, 2); g.fillStyle = INK; g.fillRect(x + 5, y + 16, 2, 1); g.fillRect(x + 7, y + 15, 2, 1);
  if (id) g.drawImage(emoIcon(id), x + 3, y + 3); else txt(ch, x + 5, y + 5, '#e84848');
}

// ── humores ──
const MOODS = {
  adora: { emo: 'corazon', bg: ['#f8c8d8', '#f0a0b8'], anim: 'salta' },
  feliz: { emo: 'nota', bg: ['#fff0b0', '#f8d878'], anim: 'bota' },
  contento: { emo: 'nota', bg: ['#d8f0c8', '#b0dca0'], anim: 'mece' },
  normal: { emo: 'puntos', bg: ['#e0e4ec', '#c4cad8'], anim: 'quieto' },
  distante: { emo: 'puntos', bg: ['#d0ccd8', '#aca8b8'], anim: 'gira' },
  cansado: { emo: 'sudor', bg: ['#c8d0dc', '#a0a8b8'], anim: 'decae' },
  corto: { emo: 'chispa', bg: ['#fff4a0', '#e8c040'], anim: 'tiembla' },
  triste: { emo: 'gota', bg: ['#b8c8e8', '#90a4d0'], anim: 'decae' },
  miedo: { emo: 'excl', bg: ['#4c4868', '#2c2840'], anim: 'tiembla' },
  tenso: { emo: 'enfado', bg: ['#f0b0a0', '#d87868'], anim: 'tenso' },
  sueno: { emo: 'zzz', bg: ['#38406c', '#20284c'], anim: 'duerme' },
  impaciente: { emo: 'chispa', bg: ['#f8e8a0', '#f0c860'], anim: 'brilla' },
  encantado: { emo: 'corazon', bg: ['#c8f0e0', '#90dcc0'], anim: 'salta' },
  incomodo: { emo: 'sudor', bg: ['#e8d8c0', '#c8b498'], anim: 'tiembla' },
  curioso: { emo: 'preg', bg: ['#d8e8f8', '#b0c8e8'], anim: 'gira' },
};
// sitios que gustan o disgustan a cada tipo
const GUSTOS = {
  BRASA: { si: ['fragua', 'forja', 'ruta6', 'casaFragua', 'herreria', 'casaYunque'], no: ['puerto', 'termas', 'balneario', 'barco', 'ruta7', 'casaFaro'] },
  VAPOR: { si: ['termas', 'balneario', 'ruta7', 'caldera', 'puerto'], no: ['poblado', 'mina', 'ruta5', 'salaImanta'] },
  MUSGO: { si: ['villa', 'invernadero', 'ruta4', 'casaMusgo', 'casaTallo', 'casaSemilla'], no: ['fragua', 'forja', 'fabrica', 'fabrica1', 'camino'] },
  CHISPA: { si: ['central', 'ciudad', 'subestacion', 'torre', 'torre2', 'torre3', 'camara'], no: ['puerto', 'barco', 'termas', 'balneario'] },
  OXIDO: { si: ['puerto', 'astillero', 'barco', 'lonja', 'casaPescador'], no: ['invernadero', 'villa'] },
  IMAN: { si: ['mina', 'poblado', 'salaImanta', 'casaMinera', 'ruta5'], no: ['ciudad', 'central', 'subestacion'] },
  CHAPA: { si: ['taller', 'pueblo'], no: [] },
};
const APAGON_SITIOS = ['torre', 'torre2', 'torre3', 'barco', 'fabrica', 'fabrica1', 'camara'];
let ultimaDerrota = -1e9; // en fotogramas

function humor(m) {
  const map = G.map, t = SPECIES[m.sp].t, gu = GUSTOS[t] || GUSTOS.CHAPA, ev = SPECIES[m.sp].evo, k = m.hp / m.max, a = afecto(m);
  if (m.status === 'corto') return 'corto';
  if (k < .35) return 'cansado';
  if (frame - ultimaDerrota < 60 * 90) return 'triste';
  if (MAPS[map].dark && !(G.bag.linterna || G.flags.luz)) return 'miedo';
  if (APAGON_SITIOS.includes(map) && !(map === 'camara' && G.flags.fin)) return 'tenso';
  if (ev && m.lv >= ev.lv - 1) return 'impaciente';
  if (dayPhase() === 3 && !MAPS[map].indoor && (frame >> 9) % 3 === 0) return 'sueno';
  if (gu.si.includes(map)) return 'encantado';
  if (gu.no.includes(map)) return 'incomodo';
  if (world.M && world.M.at(world.fol.x, world.fol.y) === '"') return 'curioso';
  return a >= 220 ? 'adora' : a >= 150 ? 'feliz' : a >= 90 ? 'contento' : a >= 40 ? 'normal' : 'distante';
}
const FRASES = {
  adora: [n => `${n} se te sube encima de un salto. No piensa bajarse.`, n => `${n} zumba tan contento que se le encienden todos los pilotos.`, n => `${n} te mira como si fueras el mejor enchufe del mundo.`, n => `${n} se frota contra tu pierna. Ronronea a 50 hercios.`],
  feliz: [n => `${n} da vueltas a tu alrededor, muy animado.`, n => `${n} tararea un pitido alegre.`, n => `${n} te enseña lo bien que le brilla la carcasa.`],
  contento: [n => `${n} te mira y le zumba el Pulso.`, n => `${n} se sacude el polvo del camino.`, n => `${n} está deseando seguir.`],
  normal: [n => `${n} te mira. Parece que todavía os estáis conociendo.`, n => `${n} hace un ruidito de motor. Ni bueno ni malo.`, n => `${n} se queda quieto, esperando a ver qué haces.`],
  distante: [n => `${n} mira hacia otro lado. Le cuesta fiarse de ti.`, n => `${n} se aparta un poquito. Igual necesita más paseos contigo.`],
  cansado: [n => `${n} chirría un poco. Le vendría bien un POSTE DE CARGA.`, n => `${n} respira con el ventilador al máximo. Está agotado.`, n => `${n} se apoya en ti. Le pesan las tuercas.`],
  corto: [n => `${n} suelta chispas sin querer. Sigue en CORTO.`, n => `${n} da un respingo cada vez que se mueve. ¡Bzzzt!`],
  triste: [n => `${n} tiene la mirada baja. Todavía le duele lo de antes.`, n => `${n} suelta una gotita de aceite. Quiere la revancha.`],
  miedo: [n => `${n} se pega a ti. Aquí está muy oscuro…`, n => `${n} tiembla. Cada ruido de la oscuridad le hace dar un brinco.`],
  tenso: [n => `${n} gruñe bajito. No le gusta nada este sitio de APAGÓN.`, n => `${n} tiene todos los tornillos en guardia.`, n => `${n} mira a su alrededor como si alguien fuera a desenchufarlo.`],
  sueno: [n => `${n} da una cabezada. Es muy tarde para un Makinamon.`, n => `${n} bosteza con un pitido larguísimo.`],
  impaciente: [n => `${n} vibra entero. ¡Siente que le falta poco para REFORJARSE!`, n => `${n} brilla a ratos. Algo grande se está cociendo dentro.`],
  incomodo: [n => `${n} no está a gusto aquí. Mueve las piezas incómodo.`],
  encantado: [n => `${n} está en su salsa. ¡Le encanta este sitio!`],
  curioso: [n => `${n} husmea entre la hierba alta. ¿Habrá alguien ahí dentro?`, n => `${n} mira la hierba con mucha curiosidad.`],
};
// frases del sitio, según su tipo (cuando le gusta o no le gusta)
const SITIO_TIPO = {
  BRASA: { si: n => `${n} se calienta al calor de las forjas. Ronronea como un horno.`, no: n => `${n} esquiva los charcos. El agua y la brasa no se llevan.` },
  VAPOR: { si: n => `${n} respira el vapor húmedo y suelta un silbido feliz.`, no: n => `${n} tiene la caldera seca. Aquí hay demasiado polvo.` },
  MUSGO: { si: n => `${n} estira las hojas hacia las plantas. Esto es como estar en casa.`, no: n => `${n} protege sus hojas del calor y del hollín.` },
  CHISPA: { si: n => `${n} se carga con la corriente que zumba aquí. ¡Le chispean las orejas!`, no: n => `${n} se aleja del agua. Una mala gota y… ¡pum!` },
  OXIDO: { si: n => `${n} huele el salitre y se le pone la herrumbre de gallina. Le encanta.`, no: n => `${n} no soporta que lo rieguen. Mira las mangueras con desconfianza.` },
  IMAN: { si: n => `${n} siente el hierro de la tierra. Su aguja apunta feliz hacia abajo.`, no: n => `${n} está mareado. Tanto cable le desorienta la aguja.` },
  CHAPA: { si: n => `${n} se siente como recién salido del taller.`, no: n => `${n} mira a su alrededor.` },
};
const FRASE_SITIO = {
  pueblo: n => `${n} saluda a las farolas del pueblo. Se conocen de toda la vida.`,
  taller: n => `${n} mira la mesa del taller. Ahí empezó todo.`,
  ruta2: n => `${n} sigue con la vista los cables de las torres eléctricas.`,
  ciudad: n => `${n} se queda embobado con los escaparates iluminados.`,
  puerto: n => `${n} mira los barcos. A ver si alguno lleva Makinamon.`,
  villa: n => `${n} huele las flores de la villa. Achís.`,
  poblado: n => `${n} escucha el traqueteo de las vagonetas.`,
  fragua: n => `${n} da un respingo con cada martillazo del herrero.`,
  termas: n => `${n} quiere meterse en el agua caliente. No es buena idea.`,
  camino: n => `${n} mira la Gran Fábrica a lo lejos. Algo le llama desde allí.`,
};

// ── el retrato (como el de Pikachu en Amarillo) ──
function retrato(m, md) {
  const M2 = MOODS[md], a = afecto(m);
  return { t: 0, draw() {
    const t = ++this.t, x = 42, y = 4, w = 76, h = 86, cx = x + w / 2;
    box(x, y, w, h, { ac: M2.bg[1] }); gradV(g, x + 4, y + 4, w - 8, h - 20, [M2.bg[0], M2.bg[1]]);
    g.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 4; i++) g.fillRect(x + 4, y + 10 + i * 14, w - 8, 1);
    // animación según el humor
    let dx = 0, dy = 0, sx = 1, sy = 1, view = 'f0', tint = null, white = false;
    const an = M2.anim;
    if (an === 'salta') { const p = (t % 28) / 28; dy = -Math.round(Math.abs(Math.sin(p * Math.PI)) * 10); if (p < .08) { sy = .88; sx = 1.1; } view = p > .2 && p < .6 ? 'f1' : 'f0'; }
    else if (an === 'bota') { dy = -Math.round(Math.abs(Math.sin(t * .12)) * 4); view = (t % 50) < 8 ? 'f1' : 'f0'; }
    else if (an === 'mece') { dx = Math.round(Math.sin(t * .06) * 3); view = (t % 90) < 8 ? 'f1' : 'f0'; }
    else if (an === 'quieto') { view = (t % 120) < 6 ? 'f1' : 'f0'; }
    else if (an === 'gira') { dx = Math.round(Math.sin(t * .04) * 6); sx = Math.sin(t * .04) > .7 ? .9 : 1; }
    else if (an === 'decae') { sy = .92; dy = 2 + Math.round(Math.sin(t * .05)); tint = md === 'triste' ? '#90a4d0' : null; }
    else if (an === 'tiembla') { dx = (t & 2) ? 1 : -1; if (md === 'corto' && (t % 14) < 3) white = true; }
    else if (an === 'tenso') { sy = .94; sx = 1.05; dx = (t % 40) < 4 ? ((t & 1) ? 1 : -1) : 0; tint = (t % 60) < 6 ? '#e84848' : null; }
    else if (an === 'duerme') { sy = 1 - Math.abs(Math.sin(t * .04)) * .05; tint = '#38406c'; }
    else if (an === 'brilla') { white = (t % 24) < 3; dy = -Math.round(Math.abs(Math.sin(t * .2)) * 2); }
    ell(g, cx, y + h - 22, 18, 3, 'rgba(20,20,40,.25)');
    g.save(); g.beginPath(); g.rect(x + 4, y + 4, w - 8, h - 20); g.clip();
    drawMon(m.sp, view, cx + dx, y + h - 20 + dy, { sx, sy, tint, tintA: .45, white });
    if (md === 'adora' || md === 'encantado') { for (let i = 0; i < 3; i++) { const q = ((t * 1.2 + i * 30) % 90) / 90; g.globalAlpha = 1 - q; g.drawImage(emoIcon('corazon'), Math.round(x + 12 + i * 22 + Math.sin(q * 6 + i) * 3), Math.round(y + h - 26 - q * 52)); } g.globalAlpha = 1; }
    if (md === 'sueno') { for (let i = 0; i < 2; i++) { const q = ((t * .8 + i * 40) % 80) / 80; g.globalAlpha = 1 - q; txtO('z', Math.round(cx + 12 + q * 10), Math.round(y + 26 - q * 18 + i * 4), '#a8b8f8'); } g.globalAlpha = 1; }
    if (md === 'corto' && t % 6 === 0) burst(cx + rnd(-12, 12), y + 40 + rnd(-10, 10), 3, { c: ['#fff8c0', '#f8d030'], v0: .6, v1: 1.6, l0: 6, l1: 12 });
    if (md === 'impaciente' && t % 8 === 0) part({ x: cx + rnd(-18, 18), y: y + 60, vy: -.7, life: 22, c: pick(['#fff8c0', '#f8e070']), kind: 'star' });
    if (md === 'cansado' && (t % 50) < 25) g.drawImage(emoIcon('sudor'), cx + 10, y + 22);
    g.restore();
    // la emoción en su bocadillo
    const bob = Math.round(Math.sin(t * .15)); drawEmote(x + w - 22, y + 6 + bob, M2.emo);
    // vínculo: cinco corazones
    for (let i = 0; i < 5; i++) { const full = a >= (i + 1) * 51, half = !full && a >= i * 51 + 25; g.globalAlpha = full ? 1 : half ? .55 : .2; g.drawImage(emoIcon('corazon'), Math.round(x + 10 + i * 12), y + h - 15); }
    g.globalAlpha = 1;
  } };
}
async function folTalk(m) {
  const f = world.fol, md = humor(m), nm = monName(m), t = SPECIES[m.sp].t, gu = GUSTOS[t] || GUSTOS.CHAPA;
  f.dir = world.pl.dir ^ 1; f.pop = 0; sfx.cry(SPECIES[m.sp].cry, md === 'cansado' || md === 'triste' || md === 'sueno' ? .8 : md === 'adora' || md === 'feliz' ? 1.12 : 1);
  await emote(f, MOODS[md].emo);
  const p = retrato(m, md); ui.push(p);
  const lines = [pick(FRASES[md])(nm)];
  if (md === 'encantado') lines.push(SITIO_TIPO[t].si(nm)); else if (md === 'incomodo') lines.push(SITIO_TIPO[t].no(nm));
  else if (['adora', 'feliz', 'contento', 'normal', 'curioso'].includes(md) && FRASE_SITIO[G.map] && Math.random() < .5) lines.push(FRASE_SITIO[G.map](nm));
  // hablarle de vez en cuando también une
  if (!m._charla || frame - m._charla > 60 * 60) { m._charla = frame; darAfecto(m, 1); }
  try { await talk(...lines); } finally { ui.splice(ui.indexOf(p), 1); }
}
// reacciones espontáneas mientras paseáis
let vinculoT = 0, quietoT = 0, ultimaHierba = -1;
function vinculoTick() {
  const m = world.folMon && world.folMon(); if (!m || busy) return;
  const f = world.fol, p = world.pl; vinculoT++; quietoT = p.moving ? 0 : quietoT + 1;
  if (world.emotes.some(e => e.e === f)) return;
  const md = humor(m), M = world.M, enHierba = M.at(f.x, f.y) === '"';
  if (enHierba && f.x * 100 + f.y !== ultimaHierba && Math.random() < .08) { ultimaHierba = f.x * 100 + f.y; emoteSuave(f, 'excl'); return; }
  if (vinculoT % 60) return;
  const r = Math.random();
  if (md === 'sueno' && quietoT > 240 && r < .5) emoteSuave(f, 'zzz');
  else if (md === 'miedo' && r < .3) { emoteSuave(f, 'excl'); f.pop = 3; }
  else if (md === 'cansado' && r < .2) emoteSuave(f, 'sudor');
  else if (md === 'tenso' && r < .15) emoteSuave(f, 'enfado');
  else if ((md === 'adora' || md === 'encantado') && quietoT > 90 && r < .35) emoteSuave(f, 'corazon');
  else if (md === 'feliz' && quietoT > 150 && r < .2) emoteSuave(f, 'nota');
  else if (md === 'impaciente' && r < .2) emoteSuave(f, 'chispa');
}
// viñeta sin sonido de alarma, para no molestar mientras andas
async function emoteSuave(e, ch) { const o = { e, ch, s: 0 }; world.emotes.push(o); await tw(o, { s: 1 }, 8, 'back'); await wait(40); const i = world.emotes.indexOf(o); if (i >= 0) world.emotes.splice(i, 1); }
