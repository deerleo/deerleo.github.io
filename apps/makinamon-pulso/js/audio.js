'use strict';
// ───────── sonido: sintetizador chip (2 pulsos + onda + ruido), secuenciador y efectos ─────────
let AC = null, master = null, musicG = null, sfxG = null, muted = false;
const WAVES = {};
// canal de onda de la Game Boy: 32 muestras de 4 bits; los escalones son los que le dan el grano
const TABLAS = {
  tri: p => 1 - 4 * Math.abs(p - .5),
  bajo: p => .72 * (1 - 4 * Math.abs(p - .5)) + .28 * Math.sin(4 * Math.PI * p),
  suave: p => -Math.cos(2 * Math.PI * p),
};
function tabla(fn) {
  const N = 32, K = 16, H = 64, re = new Float32Array(H), im = new Float32Array(H);
  const x = Array.from({ length: N }, (_, i) => Math.round((fn((i + .5) / N) + 1) * 7.5) / 7.5 - 1);
  for (let k = 1; k < H; k++) {
    let a = 0, b = 0;
    for (let i = 0; i < N * K; i++) { const p = 2 * Math.PI * k * i / (N * K), s = x[i / K | 0]; a += s * Math.cos(p); b += s * Math.sin(p); }
    re[k] = 2 * a / (N * K); im[k] = 2 * b / (N * K);
  }
  return AC.createPeriodicWave(re, im);
}
// ctx: solo para renderizar sin ventana (tools/musica.mjs) con un OfflineAudioContext
function audioInit(ctx) {
  if (AC && !ctx) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = ctx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  if (ctx) { cur = null; curName = ''; }
  master = AC.createGain(); master.gain.value = muted ? 0 : .5; master.connect(AC.destination);
  musicG = AC.createGain(); musicG.gain.value = .55; musicG.connect(master);
  sfxG = AC.createGain(); sfxG.gain.value = .8; sfxG.connect(master);
  for (const [n, d] of [['p12', .125], ['p25', .25], ['p50', .5]]) {
    const re = new Float32Array(32), im = new Float32Array(32);
    for (let k = 1; k < 32; k++) re[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * d);
    WAVES[n] = AC.createPeriodicWave(re, im);
  }
  for (const n in TABLAS) WAVES[n] = tabla(TABLAS[n]);
  const mkNoise = (len, period) => { const b = AC.createBuffer(1, len, AC.sampleRate), d = b.getChannelData(0); let v = 0; for (let i = 0; i < len; i++) { if (i % period === 0) v = Math.random() * 2 - 1; d[i] = v; } return b; };
  WAVES.noise = mkNoise(AC.sampleRate, 1); WAVES.noiseLo = mkNoise(AC.sampleRate, 6);
  if (pendingSong) { const s = pendingSong; pendingSong = null; music(s); }
}
function toggleMute() {
  muted = !muted; if (master) master.gain.value = muted ? 0 : .5;
  if (typeof window !== 'undefined' && window.OPT) { window.OPT.mute = muted; try { localStorage.setItem('makinamon-opt', JSON.stringify(window.OPT)); } catch (e) {} }
  if (typeof document !== 'undefined' && document.querySelector) { const b = document.querySelector('.mando .mini'); if (b) b.classList.toggle('apagado', muted); }
}
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function hz(n) { const m = /^([A-G])(#|b)?(\d)$/.exec(n); if (!m) return 0; return 440 * 2 ** ((NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (m[3] - 4) * 12 - 9) / 12); }
function osc(wave, f, t, dur, vol, dest, o = {}) {
  const os = AC.createOscillator(), ga = AC.createGain();
  if (wave === 'tri') os.type = 'triangle'; else if (wave === 'sin') os.type = 'sine'; else if (wave === 'saw') os.type = 'sawtooth'; else os.setPeriodicWave(WAVES[wave]);
  if (Array.isArray(f)) { os.frequency.setValueAtTime(f[0], t); for (let i = 1; i < f.length; i++) os.frequency.exponentialRampToValueAtTime(Math.max(20, f[i]), t + dur * i / (f.length - 1)); }
  else os.frequency.setValueAtTime(f, t);
  if (o.vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 6; lg.gain.value = f * .012; l.connect(lg); lg.connect(os.frequency); l.start(t + .12); l.stop(t + dur + .05); }
  const a = o.atk ?? .004, sus = o.sus ?? .65;
  ga.gain.setValueAtTime(0, t); ga.gain.linearRampToValueAtTime(vol, t + a); ga.gain.linearRampToValueAtTime(vol * sus, t + Math.min(dur * .5, .09));
  ga.gain.setValueAtTime(vol * sus, t + dur * (o.gate ?? .88)); ga.gain.linearRampToValueAtTime(0, t + dur);
  os.connect(ga); ga.connect(dest); os.start(t); os.stop(t + dur + .02);
}
function noise(t, dur, vol, dest, o = {}) {
  const s = AC.createBufferSource(), ga = AC.createGain(), fl = AC.createBiquadFilter();
  s.buffer = o.lo ? WAVES.noiseLo : WAVES.noise; s.loop = true;
  fl.type = o.type || 'highpass'; const f = o.f || 4000;
  if (Array.isArray(f)) { fl.frequency.setValueAtTime(f[0], t); fl.frequency.exponentialRampToValueAtTime(f[1], t + dur); } else fl.frequency.value = f;
  fl.Q.value = o.q || .7;
  ga.gain.setValueAtTime(vol, t); if (o.swell) { ga.gain.setValueAtTime(.001, t); ga.gain.linearRampToValueAtTime(vol, t + dur * .6); } ga.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(fl); fl.connect(ga); ga.connect(dest); s.start(t, Math.random()); s.stop(t + dur + .02);
}
// ── voces de la música ──
// nota de un canal melódico. s = estado de la nota: onda, volumen 0-15, env (cada env/64 s baja un escalón, 0 = sostenida), gate
const VIB = { d: .2, c: 20, r: 6.2 };
function nota(ch, s, f, t, dur) {
  const os = AC.createOscillator(), ga = AC.createGain(), g = ga.gain, v = ch.c.v / 15;
  os.setPeriodicWave(WAVES[s.w]); os.frequency.setValueAtTime(f, t);
  const off = t + Math.max(.02, dur * s.gate - .008); let lv = s.vol;
  g.setValueAtTime(0, t); g.linearRampToValueAtTime(v * lv, t + .003);
  if (s.env) for (let u = t + s.env / 64; lv > 0 && u < off; u += s.env / 64) g.setValueAtTime(v * --lv, u);
  g.setValueAtTime(v * lv, off); g.linearRampToValueAtTime(0, off + .008);
  if (ch.c.vib && dur > VIB.d + .1) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = VIB.r; lg.gain.value = f * (2 ** (VIB.c / 1200) - 1); l.connect(lg); lg.connect(os.frequency); l.start(t + VIB.d); l.stop(off + .03); }
  os.connect(ga); ga.connect(ch.out); os.start(t); os.stop(off + .03);
}
// batería: k bombo · s caja · g caja fantasma · h charles · o charles abierto · t/T timbales · c plato
function golpe(n, t, v, out) {
  if (n === 'k') { osc('sin', [150, 45], t, .11, v * 2.2, out, { sus: 1, gate: .3 }); noise(t, .02, v * .5, out, { f: 900, type: 'lowpass', lo: 1 }); }
  else if (n === 's' || n === 'g') { const k = n === 'g' ? .45 : 1; noise(t, .12, v * 1.2 * k, out, { f: 1600 }); osc('tri', [210, 150], t, .05, v * .9 * k, out, { sus: 1, gate: .4 }); }
  else if (n === 'h') noise(t, .035, v * .7, out, { f: 7000 });
  else if (n === 'o') noise(t, .16, v * .6, out, { f: 6500 });
  else if (n === 't' || n === 'T') { const f = n === 'T' ? 260 : 170; osc('sin', [f, f * .55], t, .13, v * 2, out, { sus: 1, gate: .4 }); }
  else if (n === 'c') noise(t, .55, v * .9, out, { f: 5200 });
}
// ── canciones ──
// notación: "C5:4 E5 -:2" (duración en semicorcheas; si falta, repite la anterior)
const rep = (s, n) => Array(n).fill(s).join(' ');
const drive = (a, b) => `${a}:2 ${a} ${b} ${a} ${a} ${b} ${a} ${b}`;
// ── cómo se compone aquí (criterios de las bandas sonoras de Game Boy Color; las melodías son propias) ──
//  · un motivo corto y cantable por tema, que se repite, se sube en secuencia y se varía; una sola nota cumbre por sección
//  · forma con intro que no se repite + A A' B: la B cambia de color (acordes prestados bVII/bVI, iv menor, dominantes secundarias)
//  · frases de pregunta y respuesta, con anacrusa; donde la melodía descansa, contesta el segundo pulso
//  · el segundo pulso es una voz de verdad: galopa o arpegia en la A y canta en terceras/sextas en la B
//  · el bajo camina: fundamental, octava, quinta y notas de paso hacia el acorde siguiente
//  · la batería cierra cada frase con un redoble; el timbre (ciclo de pulso, volumen, envolvente) cambia entre secciones
//  · el motivo del título (1–5–1·2·3) vuelve en la ruta: un leitmotiv hace que el juego suene a una sola cosa
// órdenes dentro de un canal: @d12/25/50 ciclo de pulso · @wNOMBRE tabla de onda · @v0-15 volumen · @e0-7 caída (0 sostenida) · @g85 duración en % · ^:n liga
const mGal = (a, b, c) => `${a}:2 ${c}:1 ${c} ${b}:2 ${c}:1 ${c}`; // galope de media redonda
const mBr = (a, b, c, d) => `${a}:2 ${b} ${c} ${b} ${d} ${b} ${c} ${b}`; // acorde roto en corcheas
const m16 = (a, b, c) => rep(`${a}:1 ${b} ${c} ${b}`, 4), mTr = (a, b, c) => rep(`${a}:1 ${b} ${a} ${c}`, 4);
const mBs = (r, o, f) => `${r}:3 ${r}:1 ${o}:2 ${r}:2 ${f}:2 ${r}:2 ${o}:2 ${f}:2`, mH = (r, o, f) => `${r}:3 ${r}:1 ${o}:2 ${f}:2`; // bajo que bota
const mTb = (r, f, o) => `${r}:6 ${f}:2 ${o}:4 ${f}:4`, mWb = (r, f, t) => `${r}:4 ${f}:2 ${r}:2 ${t}:4 ${f}:4`; // bajos tranquilos
const mCb = (r, o, x) => `${r}:3 ${r}:3 ${o}:2 -:1 ${r}:1 ${o}:2 ${r}:2 ${x}:2`; // bajo de combate: tresillo, silencio y salto de octava
const mSt = (a, b, c) => `-:2 ${a}:1 ${b} -:2 ${c}:2 -:2 ${a}:1 ${b} -:2 ${c}:2`; // golpes de acorde a contratiempo
const mMq = (a, b) => rep(`${a}:1 ${a} ${b}:2`, 4), mGb = r => rep(`${r}:2 ${r}:1 ${r}`, 4); // pistón de fábrica · bajo al galope
const mV = (a, b) => `-:4 ${a}:2 ${b}:2 ${a}:2 ${b}:2`, bV = (r, f) => `${r}:8 ${f}:4`; // vals (compás de 12)
const m68 = (a, b) => `-:2 ${a}:2 ${b}:2 -:2 ${a}:2 ${b}:2`, b68 = (r, f) => `${r}:6 ${f}:4 ${r}:2`; // 6/8 marinero (compás de 12)
const mOf = (a, b) => `-:2 ${a}:2 -:2 ${b}:2 -:2 ${a}:2 -:2 ${b}:2`, mQ = (r, f) => `${r}:4 ${f}:4 ${r}:4 ${f}:4`; // acordes a contratiempo · bajo de fundamental y quinta
// baterías de la casa (un compás cada una)
const BAT = {
  galope: 'k:2 h:1 h s:2 h:1 h k:1 k h:2 s:2 h:1 h', redoble: 'k:2 h:1 h s:2 h:1 h s:1 s s:2 s:1 s t t', marcha: 'k:4 s:2 s:1 s k:2 k s:2 s:1 s',
  sinc: 'k:3 k:1 s:2 h:1 k:1 h:1 k:1 k:2 s:2 h:1 h:1', cierre: 'k:3 k:1 s:2 h:2 k:2 s:1 s s:2 s:1 s', empuje: 'k:2 h:1 h s:2 h:1 k k:2 h:1 h s:2 o:2',
  paradas: 'k:2 -:1 s:2 -:1 k:2 k:2 -:1 s:2 -:1 k:2', vuelta: 'c:4 -:4 s:1 s s s T T t t',
  fabrica: 'k:2 s:1 k -:1 k:1 s:2 k:2 s:1 k h:2 s:2', pesada: 'k:1 k s:2 k:1 k h:2 k:1 k s:2 k:2 s:2', ciudad: 'k:2 h s:2 h:1 k -:1 k:1 h:2 s:2 h:2',
};
// Ciudad Dinamo: la A suena dos veces con finales distintos
const CIU = 'A5:3 C6:3 F6:2 -:2 C6:2 A5:2 F5:2  A5:3 D6:3 F6:2 E6:4 D6:2 A5:2  Bb5:3 D6:3 G6:2 -:2 D6:2 Bb5:2 G5:2  E5:2 G5 Bb5 C6 E6:4 -:2 C6:2  A5:3 C6:3 F6:2 -:2 A6:2 G6:2 F6:2  E6:3 F6:3 D6:2 A5:6 -:2';
const CIU2 = [mOf('A4', 'C5'), mOf('A4', 'D5'), mOf('Bb4', 'D5'), mOf('G4', 'Bb4'), mOf('A4', 'C5'), mOf('A4', 'D5'), '-:2 Bb4:2 -:2 D5:2 -:2 G4:2 -:2 Bb4:2'].join(' ');
const CIU3 = [mBs('F2', 'F3', 'C3'), mBs('D3', 'D4', 'A3'), mBs('G2', 'G3', 'D3'), mBs('C3', 'C4', 'G3'), mBs('F2', 'F3', 'C3'), mBs('D3', 'D4', 'A3'), mH('G2', 'G3', 'D3'), mH('C3', 'C4', 'G3')].join(' ');
const arp = (r, a, b) => `${r}:2 ${a} ${b} ${a} ${r} ${a} ${b} ${a}`;
const SONGS = {
  // CAMINO DEL RAYO — Mi menor, marcha solemne. El motivo del PULSO en menor; la B sube a mayor y acaba en Mi mayor: ya casi estás
  camino: { bpm: 104, ch: [
    { w: 'p25', v: .15, vib: 1, n: '@v13 E5:6 B4:2 E5:2 F#5 G5:4  G5:6 E5:2 C5:4 E5:2 G5:2  F#5:6 D5:2 F#5:2 G5 A5:4  B5:6 A5:2 F#5:4 D#5:4  G5:6 E5:2 G5:2 A5 B5:4  C6:4 B5:2 G5:2 E5:4 G5:2 C6:2  A5:3 C6:3 E6:2 D#6:3 B5:3 F#5:2  E5:10 -:2 B5:2 D6:2 ' +
      '@v15 D6:6 B5:2 G5:4 B5:2 D6:2  F#6:6 D6:2 A5:6 -:2  G6:6 E6:2 B5:4 E6:2 G6:2  F#6:4 D6:2 B5:2 -:2 B5:1 D6 F#6:4  E6:6 C6:2 E6:2 F#6 G6:4  F#6:6 D6:2 F#6:2 G6 A6:4  B6:6 A6:2 E6:8  G#6:10 -:2 B4:2 D5:2' },
    { w: 'p12', v: .09, n: ['@e2 @v11', mGal('B3', 'E4', 'G4'), mGal('B3', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('A3', 'D4', 'F#4'), mGal('A3', 'D4', 'F#4'), mGal('B3', 'D#4', 'F#4'), mGal('B3', 'D#4', 'F#4'),
      mGal('B3', 'E4', 'G4'), mGal('B3', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('C4', 'E4', 'A4'), mGal('B3', 'D#4', 'F#4'), '@e4 B3:2 E4 G4 B4 E5:4 -:4',
      '@e0 @v8 B5:6 G5:2 D5:4 G5:2 B5:2  D6:6 A5:2 F#5:6 -:2  E6:6 B5:2 G5:4 B5:2 E6:2  D6:4 B5:2 F#5:2 -:2 F#5:1 B5 D6:4',
      '@e2 @v11', mGal('C4', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('A3', 'D4', 'F#4'), mGal('A3', 'D4', 'F#4'), '@e4 B3:2 E4 A4 B4 E5 B4 A4 E4  B3:2 E4 G#4 B4 E5:4 -:4'].join(' ') },
    { w: 'tri', v: .23, n: [mBs('E2', 'E3', 'B2'), mBs('C3', 'C4', 'G3'), mBs('D3', 'D4', 'A3'), mBs('B2', 'B3', 'F#3'), mBs('E2', 'E3', 'B2'), mBs('C3', 'C4', 'G3'), mH('A2', 'A3', 'E3'), mH('B2', 'B3', 'F#3'), 'E2:3 E2:1 E3:2 B2:2 E2:4 F#2:2 G2:2',
      mBs('G2', 'G3', 'D3'), mBs('D3', 'D4', 'A3'), mBs('E2', 'E3', 'B2'), mBs('B2', 'B3', 'F#3'), mBs('C3', 'C4', 'G3'), mBs('D3', 'D4', 'A3'), 'E2:2 E2 E2 E2 E2 E2 E2 E2', 'E2:2 E2 E2 E2 E2:2 E3:2 D3 B2'].join(' ') },
    { w: 'drum', v: .11, n: [rep(BAT.marcha, 7), 'k:4 s:2 s:1 s s:1 s s s s:2 t:2', rep(BAT.marcha, 6), 'k:2 s s s s s s s', 'k:2 s s s s:1 s s s T T t t'].join(' ') },
  ] },
  // GRAN FÁBRICA — Do menor, maquinal: pistones en el segundo pulso. El PULSO suena roto y en menor, y el motivo de APAGÓN asoma al final
  fabrica: { bpm: 112, ch: [
    { w: 'p25', v: .14, vib: 1, n: '@g70 C5:2 -:2 C5:2 Eb5:2 G5:4 F#5:2 G5:2  @g85 C6:6 G5:2 Eb5:4 -:4  @g70 Ab5:2 -:2 Ab5:2 C6:2 Eb6:4 D6:2 Eb6:2  @g85 D6:6 B5:2 G5:4 -:2 G5:2  C6:6 G5:2 C6:2 D6 Eb6:4  F6:6 Eb6:2 C6:8  Eb6:6 C6:2 Eb6:2 F6 G6:4  Ab6:3 G6:3 D6:2 B5:6 -:2 ' +
      'F6:2 -:1 F6:1 Ab6:2 C7:4 Bb6:2 Ab6:2 F6:2  Eb6:2 -:1 Eb6:1 G6:2 C7:4 Bb6:2 G6:2 Eb6:2  Ab6:6 F6:2 C6:3 F6:3 Ab6:2  G6:4 D6:2 B5:2 -:2 B5:1 D6 G6:4  C6:6 Ab5:2 C6:2 D6 Eb6:4  D6:6 Bb5:2 D6:2 Eb6 F6:4  C6:3 Db6:3 C6:2 Gb6:6 F6:2  D6:8 -:2 G5:2 B5:2 D6:2' },
    { w: 'p12', v: .08, n: ['@e1 @v12', mMq('G4', 'C5'), mMq('G4', 'Eb5'), mMq('Ab4', 'Eb5'), mMq('G4', 'D5'), mMq('G4', 'C5'), mMq('Ab4', 'F5'), mMq('Ab4', 'Eb5'), mMq('G4', 'D5'),
      m16('Ab4', 'C5', 'F5'), m16('G4', 'C5', 'Eb5'), m16('Ab4', 'C5', 'F5'), m16('G4', 'B4', 'D5'), m16('Ab4', 'C5', 'Eb5'), m16('Bb4', 'D5', 'F5'), '@e0 @v9 Eb5:3 E5:3 Eb5:2 A5:6 Ab5:2  B4:2 D5 G5 B5 D6:4 -:4'].join(' ') },
    { w: 'tri', v: .24, n: ['@g75', mCb('C3', 'C4', 'G2'), mCb('C3', 'C4', 'Bb2'), mCb('Ab2', 'Ab3', 'Eb3'), mCb('G2', 'G3', 'B2'), mCb('C3', 'C4', 'G2'), mCb('F2', 'F3', 'C3'), mCb('Ab2', 'Ab3', 'Eb3'), mCb('G2', 'G3', 'G2'),
      mCb('F2', 'F3', 'C3'), mCb('C3', 'C4', 'G2'), mCb('F2', 'F3', 'C3'), mCb('G2', 'G3', 'D3'), mCb('Ab2', 'Ab3', 'Eb3'), mCb('Bb2', 'Bb3', 'F3'), 'C3:3 Db3:3 C3:2 Gb3:6 F3:2', 'G2:3 G2:3 G3:2 G2:2 G2 A2 B2'].join(' ') },
    { w: 'drum', v: .12, n: [rep(BAT.fabrica, 7), BAT.cierre, rep(BAT.fabrica, 6), 'k:3 k:3 k:2 s:6 s:2', 'k:2 s:2 k:2 s:2 s:1 s s s t:2 t:2'].join(' ') },
  ] },
  // FULGOR dormido — el PULSO a cámara lenta, casi sin nada alrededor
  fulgorCalma: { bpm: 70, ch: [
    { w: 'p12', v: .09, vib: 1, eco: { t: 6, v: .4 }, n: '@v10 E5:12 B4:4  E5:4 F#5:4 G5:8  -:4 B5:8 A5:4  G5:16  E5:12 B4:4  E5:4 F#5:4 G5:8  -:4 D6:8 B5:4  B5:16' },
    { w: 'p12', v: .05, env: 5, n: rep('E4:4 B4 G4 B4', 2) + ' E4:4 C5 G4 C5 ' + rep('E4:4 B4 G4 B4', 3) + ' D4:4 B4 G4 B4  D#4:4 B4 F#4 B4' },
    { w: 'tri', v: .2, n: '@wsuave E2:32 C3:16 E2:16 E2:32 G2:16 B2:16' },
  ] },
  // FULGOR — el Rayo Madre. El PULSO aumentado (el doble de largo) sobre un chisporroteo de semicorcheas; luego se desata
  fulgor: { bpm: 184, loop: 16, ch: [
    { w: 'p25', v: .15, vib: 1, n: 'E6:1 B5 E6 B5 E6 B5 E6 B5 F6 C6 F6 C6 F6 C6 F6 C6 ' +
      'E6:12 B5:4  E6:4 F#6:4 G6:8  G6:12 E6:4  C6:4 E6:4 G6:8  A6:12 F#6:4  D6:4 F#6:4 A6:8  B6:8 F#6:4 D#6:4  B5:3 D#6:3 F#6:2 B6:2 -:2 B5:1 C6 D6 D#6 ' +
      'E6:3 G6:3 B6:2 -:2 B6:2 A6:2 G6:2  D6:3 G6:3 B6:2 D7:6 B6:2  C#7:3 A6:3 E6:2 A6:3 E6:3 C#6:2  C6:3 E6:3 G6:2 F#6:3 D#6:3 B5:2  E6:3 G6:3 B6:2 -:2 B6:2 A6:2 G6:2  D6:3 G6:3 B6:2 D7:6 B6:2  E7:6 C#7:2 A6:4 C#7:2 E7:2  E7:3 C7:3 G6:2 F#6:1 G6 A6 B6 C7 B6 A6 F#6' },
    { w: 'p12', v: .08, n: ['@e1 @v12 -:16', m16('E5', 'G5', 'B5'), m16('E5', 'G5', 'B5'), m16('E5', 'G5', 'C6'), m16('E5', 'G5', 'C6'), m16('D5', 'F#5', 'A5'), m16('D5', 'F#5', 'A5'), m16('D#5', 'F#5', 'B5'), m16('D#5', 'F#5', 'B5'),
      '@e2', mSt('B4', 'E5', 'G5'), mSt('B4', 'D5', 'G5'), mSt('A4', 'C#5', 'E5'), '-:2 C5:1 E5 -:2 G5:2 -:2 B4:1 D#5 -:2 F#5:2', '@e1', m16('G4', 'B4', 'E5'), m16('G4', 'B4', 'D5'), m16('A4', 'C#5', 'E5'), 'G4:1 C5 E5 C5 G4 C5 E5 C5 F#4:1 B4 D#5 B4 F#4 B4 D#5 B4'].join(' ') },
    { w: 'tri', v: .25, n: [rep('E2:2', 8), mGb('E2'), mGb('E2'), mGb('C3'), mGb('C3'), mGb('D3'), mGb('D3'), mGb('B2'), 'B2:3 B2:3 B2:2 B2:2 -:2 B2:1 C3 D3 D#3',
      '@g75', mCb('E2', 'E3', 'B2'), mCb('G2', 'G3', 'D3'), mCb('A2', 'A3', 'E3'), 'C3:3 C3:3 C4:2 B2:3 B2:3 B3:2', mCb('E2', 'E3', 'B2'), mCb('G2', 'G3', 'D3'), mCb('A2', 'A3', 'E3'), 'C3:3 C3:3 C4:2 B2:1 C3 D3 D#3 E3 D#3 C3 B2'].join(' ') },
    { w: 'drum', v: .15, n: [rep('s:1', 16), rep('k:2 h:1 h s:2 h:1 h k:2 h:1 h s:2 h:1 h', 7), 'k:3 k:3 s:2 s:2 -:2 s:1 s s s', rep(BAT.sinc, 3), 'k:3 s:3 k:2 k:3 s:3 k:2', rep(BAT.sinc, 3), 'k:3 s:3 k:2 s:1 s s s T T t t'].join(' ') },
  ] },
  // FIN — Sol mayor. Vuelve todo: el tema de la ruta (PULSO en mayor), el del pueblo un tono arriba, y un cierre por Mib–Fa–Sol
  fin: { bpm: 112, ch: [
    { w: 'p25', v: .15, vib: 1, n: '@v13 G5:6 D5:2 G5:2 A5 B5:4  A5:6 F#5:2 D5:4 -:2 F#5:2  G5:6 E5:2 G5:2 A5 B5:4  C6:4 B5:2 A5 F#5:3 A5:3 D6:2  B5:6 D6:2 G6:6 F#6:2  D#6:4 B5:2 F#5:2 A5:6 B5:2  G5:3 B5:3 E6:2 E6:3 D6:3 C6:2  D6:10 -:6 ' +
      '@d50 D5:4 G5:2 B5:6 A5:2 G5:2  A5:6 F#5:2 D5:8  E5:4 G5:2 B5:6 C6:2 B5:2  G5:10 -:2 D5:2 G5:2  E6:6 D6:2 C6:4 G5:2 C6:2  B5:6 A5:2 G5:4 D5:4  C6:4 B5:2 A5:2 G5:4 E5:2 G5:2  A5:10 -:2 D5:2 F#5:2 ' +
      '@d25 @v15 G5:6 D5:2 G5:2 A5 B5:4  A5:6 F#5:2 A5:2 B5 C6:4  B5:6 G5:2 B5:2 C6 D6:4  E6:4 D6:2 C6:2 D6:3 F#6:3 A6:2  G6:6 Eb6:2 Bb5:4 Eb6:2 G6:2  A6:6 F6:2 C6:4 F6:2 A6:2  B6:6 G6:2 D6:2 G6:2 B6:2 D7:2  G6:12 -:2 D5:1 F#5:1' },
    { w: 'p12', v: .09, n: ['@e4 @v11', mBr('B3', 'D4', 'G4', 'B4'), mBr('A3', 'D4', 'F#4', 'A4'), mBr('B3', 'E4', 'G4', 'B4'), 'C4:2 E4 G4 E4 A3:2 D4 F#4 D4', mBr('B3', 'D4', 'G4', 'B4'), mBr('A3', 'D#4', 'F#4', 'A4'), 'B3:2 E4 G4 E4 C4:2 E4 G4 E4', 'A3:2 D4 G4 A4 F#4:4 -:4',
      '@e0 @v7 B4:8 D5:8  A4:8 F#4:8  G4:8 B4:8  B4:8 D5:4 B4:4  C5:8 E5:8  B4:8 D5:8  C5:8 E5:8  F#5:8 C5:4 A4:4',
      '@e3 @v11', mGal('B3', 'D4', 'G4'), mGal('B3', 'D4', 'G4'), mGal('A3', 'D4', 'F#4'), mGal('A3', 'D4', 'F#4'), mGal('B3', 'E4', 'G4'), mGal('B3', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('A3', 'D4', 'F#4'),
      mGal('Bb3', 'Eb4', 'G4'), mGal('Bb3', 'Eb4', 'G4'), mGal('C4', 'F4', 'A4'), mGal('C4', 'F4', 'A4'), mGal('B3', 'D4', 'G4'), mGal('B3', 'D4', 'G4'), 'B3:2 D4 G4 B4 D5:4 -:4'].join(' ') },
    { w: 'tri', v: .21, n: [mTb('G2', 'D3', 'G3'), mTb('F#2', 'D3', 'F#3'), mTb('E2', 'B2', 'E3'), 'C3:4 G3:4 D3:4 A3:4', mTb('G2', 'D3', 'G3'), mTb('B2', 'F#3', 'B3'), 'E3:4 B2:4 C3:4 G3:4', 'D3:6 A2:2 D3:4 F#3:4',
      mTb('G2', 'D3', 'G3'), mTb('F#2', 'D3', 'F#3'), mTb('E2', 'B2', 'E3'), mTb('D3', 'G3', 'B3'), mTb('C3', 'G3', 'C4'), mTb('B2', 'D3', 'G3'), mTb('A2', 'E3', 'A3'), 'D3:6 A2:2 D3:4 E3:2 F#3:2',
      mBs('G2', 'G3', 'D3'), mBs('F#2', 'F#3', 'D3'), mBs('E2', 'E3', 'B2'), mH('C3', 'C4', 'G3'), mH('D3', 'D4', 'A3'), mBs('Eb2', 'Eb3', 'Bb2'), mBs('F2', 'F3', 'C3'), mBs('G2', 'G3', 'D3'), 'G2:3 G2:1 G3:2 D3:2 G2:4 -:4'].join(' ') },
    { w: 'drum', v: .09, n: [rep('k:4 h:2 h s:4 h:2 h', 7), 'k:4 h:2 h s:2 s s:1 s s s', rep('k:4 h:4 g:4 h:2 h:2', 8), rep(BAT.galope, 7), BAT.redoble].join(' ') },
  ] },
  // FRAGUA — Re menor, martillo y yunque: la melodía golpea y calla. El Mib (bII) de la B es el calor
  volcan: { bpm: 108, ch: [
    { w: 'p25', v: .14, vib: 1, n: '@g70 D5:2 -:2 D5:2 F5:2 A5:4 G5:2 F5:2  @g85 A5:3 Bb5:3 A5:2 F5:6 -:2  @g70 D6:2 -:2 D6:2 Bb5:2 F5:4 Bb5:2 D6:2  @g85 E6:6 C6:2 G5:6 -:2  @g70 D6:2 -:2 D6:2 F6:2 A6:4 G6:2 F6:2  @g85 A6:3 Bb6:3 A6:2 F6:4 D6:2 F6:2  D6:3 Bb5:3 F5:2 E6:3 C#6:3 A5:2  D6:10 -:2 A5:2 D6:2 ' +
      'F6:6 C6:2 A5:4 C6:2 F6:2  E6:6 C6:2 G5:6 -:2  D6:6 Bb5:2 G5:4 Bb5:2 D6:2  C#6:4 E6:2 A6:6 -:2 A5:2  A6:3 F6:3 C6:2 F6:3 C6:3 A5:2  G6:3 E6:3 C6:2 E6:3 C6:3 G5:2  Bb6:6 G6:2 Eb6:4 G6:2 Bb6:2  A6:8 -:2 E6:2 C#6:2 A5:2' },
    { w: 'p12', v: .08, n: ['@e2 @v12', mSt('A4', 'D5', 'F5'), mSt('A4', 'D5', 'F5'), mSt('Bb4', 'D5', 'F5'), mSt('G4', 'C5', 'E5'), mSt('A4', 'D5', 'F5'), mSt('A4', 'D5', 'F5'), '-:2 Bb4:1 D5 -:2 F5:2 -:2 A4:1 C#5 -:2 E5:2', '@e4 A4:2 D5 F5 A5 D6:4 -:4',
      '@e2 @v11', mGal('A3', 'C4', 'F4'), mGal('A3', 'C4', 'F4'), mGal('G3', 'C4', 'E4'), mGal('G3', 'C4', 'E4'), mGal('Bb3', 'D4', 'G4'), mGal('Bb3', 'D4', 'G4'), mGal('A3', 'C#4', 'E4'), mGal('A3', 'C#4', 'E4'),
      mGal('A3', 'C4', 'F4'), mGal('A3', 'C4', 'F4'), mGal('G3', 'C4', 'E4'), mGal('G3', 'C4', 'E4'), mGal('Bb3', 'Eb4', 'G4'), mGal('Bb3', 'Eb4', 'G4'), '@e4 A3:2 C#4 E4 A4 C#5:4 -:4'].join(' ') },
    { w: 'tri', v: .24, n: ['@g75', mCb('D3', 'D4', 'A2'), mCb('D3', 'D4', 'C3'), mCb('Bb2', 'Bb3', 'F2'), mCb('C3', 'C4', 'G2'), mCb('D3', 'D4', 'A2'), mCb('D3', 'D4', 'C3'), 'Bb2:3 Bb2:3 Bb3:2 A2:3 A2:3 A3:2', mCb('D3', 'D4', 'E3'),
      mCb('F2', 'F3', 'C3'), mCb('C3', 'C4', 'G2'), mCb('G2', 'G3', 'D3'), mCb('A2', 'A3', 'E3'), mCb('F2', 'F3', 'C3'), mCb('C3', 'C4', 'G2'), mCb('Eb3', 'Eb4', 'Bb2'), 'A2:3 A2:3 A3:2 A2:2 A2:1 A2 B2:2 C#3:2'].join(' ') },
    { w: 'drum', v: .12, n: rep(rep('k:4 k:2 s:2 h:2 k s:4', 7) + ' k:4 k:2 s:2 s:1 s s s T:2 t:2', 2) },
  ] },
  // TERMAS — Re mayor, vals (3/4) entre vapor. El Sol menor (iv) del segundo compás de la B es el suspiro
  termas: { bpm: 108, ch: [
    { w: 'p25', v: .13, vib: 1, eco: { t: 4, v: .38 }, n: '@d50 @v12 F#5:8 A5:4  D6:8 B5:4  B5:4 G5:4 D6:4  C#6:8 -:2 A5:2  F#6:8 D6:4  B5:4 D6:4 F#6:4  G6:4 E6:4 C#6:4  D6:10 -:2 ' +
      'B5:4 D6:4 G6:4  Bb5:4 D6:4 G6:4  A5:4 D6:4 F#6:4  A6:8 F#6:4  G6:6 F#6:2 E6:4  E6:4 C#6:4 A5:4  F#6:8 D6:2 A5:2  E6:10 -:2' },
    { w: 'p12', v: .07, env: 4, n: [mV('F#4', 'A4'), mV('F#4', 'B4'), mV('G4', 'B4'), mV('E4', 'A4'), mV('F#4', 'A4'), mV('F#4', 'B4'), '-:4 G4:2 B4:2 E4:2 A4:2', mV('F#4', 'A4'),
      mV('G4', 'B4'), mV('G4', 'Bb4'), mV('F#4', 'A4'), mV('D#4', 'F#4'), mV('G4', 'B4'), mV('E4', 'A4'), mV('F#4', 'A4'), mV('E4', 'A4')].join(' ') },
    { w: 'tri', v: .2, n: ['@wsuave', bV('D3', 'A2'), bV('B2', 'F#3'), bV('G2', 'D3'), bV('A2', 'E3'), bV('D3', 'A2'), bV('B2', 'F#3'), 'E3:8 A2:4', bV('D3', 'A3'),
      bV('G2', 'D3'), bV('G2', 'D3'), bV('F#2', 'D3'), bV('B2', 'F#3'), bV('E3', 'B2'), bV('A2', 'E3'), bV('D3', 'A2'), bV('A2', 'E3')].join(' ') },
    { w: 'drum', v: .05, n: rep('k:4 h:4 h:4', 16) },
  ] },
  // MONTAÑA — Mi menor, saltos de quinta y octava en la melodía: altura y aire
  montana: { bpm: 116, ch: [
    { w: 'p25', v: .14, vib: 1, n: 'E5:4 B5:4 E6:6 D6:2  A5:4 D6:2 F#6:6 -:2 D6:2  E6:4 G6:4 C6:6 E6:2  D#6:4 B5:2 F#5:6 -:2 B4:2  E5:4 B5:4 E6:4 G6:2 B6:2  A6:6 F#6:2 D6:4 F#6:2 A6:2  G6:3 E6:3 C6:2 F#6:3 D6:3 A5:2  E6:10 -:2 B5:2 E6:2 ' +
      'G6:6 D6:2 B5:4 D6:2 G6:2  F#6:6 D6:2 A5:6 -:2  E6:6 C6:2 A5:4 C6:2 E6:2  B5:4 E6:2 G6:6 -:2 E6:2  B6:6 G6:2 D6:3 G6:3 B6:2  A6:6 F#6:2 D6:3 F#6:3 A6:2  C7:3 A6:3 E6:2 D#6:3 F#6:3 B6:2  E6:10 -:6' },
    { w: 'p12', v: .08, n: ['@e4 @v11', mBr('B3', 'E4', 'G4', 'B4'), mBr('A3', 'D4', 'F#4', 'A4'), mBr('G3', 'C4', 'E4', 'G4'), mBr('B3', 'D#4', 'F#4', 'B4'), mBr('B3', 'E4', 'G4', 'B4'), mBr('A3', 'D4', 'F#4', 'A4'), 'G3:2 C4 E4 C4 A3:2 D4 F#4 D4', 'B3:2 E4 G4 B4 E5 B4 G4:4',
      '@e0 @v8 B5:6 G5:2 D5:4 G5:2 B5:2  A5:6 F#5:2 D5:6 -:2  C6:6 A5:2 E5:4 A5:2 C6:2  G5:4 B5:2 E6:6 -:4', '@e4 @v11', mBr('B3', 'D4', 'G4', 'B4'), mBr('A3', 'D4', 'F#4', 'A4'), 'A3:2 C4 E4 C4 B3:2 D#4 F#4 D#4', 'B3:2 E4 G4 B4 E5:4 -:4'].join(' ') },
    { w: 'tri', v: .22, n: [mBs('E2', 'E3', 'B2'), mBs('D3', 'D4', 'A3'), mBs('C3', 'C4', 'G3'), mBs('B2', 'B3', 'F#3'), mBs('E2', 'E3', 'B2'), mBs('D3', 'D4', 'A3'), mH('C3', 'C4', 'G3'), mH('D3', 'D4', 'A3'), 'E2:3 E2:1 E3:2 B2:2 E2:4 F#2:2 G2:2',
      mBs('G2', 'G3', 'D3'), mBs('D3', 'D4', 'A3'), mBs('A2', 'A3', 'E3'), mBs('E2', 'E3', 'B2'), mBs('G2', 'G3', 'D3'), mBs('D3', 'D4', 'A3'), mH('A2', 'A3', 'E3'), mH('B2', 'B3', 'F#3'), 'E2:3 E2:1 E3:2 B2:2 E2:4 B2:2 E2:2'].join(' ') },
    { w: 'drum', v: .1, n: rep(rep('k:4 h:2 h s:4 h:2 k', 7) + ' ' + BAT.redoble, 2) },
  ] },
  // MINA — Mi menor, a oscuras: gotas con eco y un latido de bombo. El motivo de APAGÓN se cuela en el penúltimo compás
  mina: { bpm: 84, ch: [
    { w: 'p12', v: .09, env: 3, eco: { t: 6, v: .5 }, n: '-:4 B5:2 C6 B5:8  -:4 E6:2 D#6 B5:8  -:4 B5:2 C6 E6:4 D6  C6:12 -:4  -:4 A5:2 B5 C6:8  -:4 F#5:2 G5 A5:8  -:4 B5:3 C6:3 B5:2 F6:4  E6:12 -:4' },
    { w: 'tri', v: .24, n: 'E2:12 B2:4  E2:12 B2:4  A2:12 E3:4  E2:16  A2:12 E3:4  D3:12 A2:4  E2:6 F2:6 E2:4  E2:16' },
    { w: 'drum', v: .07, n: rep('k:3 k:3 h:2 -:4 h:2 h', 8) },
  ] },
  // CAMPO — Sol mayor pentatónico, de romería: acordes a contratiempo y bajo de fundamental y quinta
  campo: { bpm: 128, ch: [
    { w: 'p25', v: .14, vib: 1, n: 'D5:1 E5 G5:2 A5:2 B5:2 D6:4 B5:2 A5:2  G5:2 A5 C6 E6 D6:4 C6:2 A5  B5:1 A5 G5:2 A5:2 B5:2 D6:4 E6:2 D6:2  A5:6 F#5:2 D5:4 -:2 D5:1 E5  G5:2 A5 B5 D6 E6:4 D6:2 B5  C6:2 D6 E6 G6 A6:4 G6:2 E6  D6:3 B5:3 G5:2 A5:3 F#5:3 D5:2  G5:8 -:4 B5:2 D6:2 ' +
      'E6:6 B5:2 G5:4 B5:2 E6:2  G6:4 E6:2 C6:2 -:2 C6:1 E6 G6:4  D6:6 B5:2 G5:4 B5:2 D6:2  F#6:4 D6:2 A5:2 -:2 A5:1 D6 F#6:4  G6:3 E6:3 B5:2 E6:3 B5:3 G5:2  E6:3 C6:3 G5:2 C6:3 G5:3 E5:2  C#6:2 E6 G6 A6 G6 E6 C#6 A5  D6:10 -:6' },
    { w: 'p12', v: .08, n: ['@e2 @v12', mOf('B4', 'D5'), mOf('C5', 'E5'), mOf('B4', 'D5'), mOf('A4', 'D5'), mOf('B4', 'D5'), mOf('C5', 'E5'), '-:2 B4:2 -:2 D5:2 -:2 A4:2 -:2 D5:2', '@e4 B4:2 D5 G5 D5 B4:4 -:4',
      '@e2 @v11', mGal('B3', 'E4', 'G4'), mGal('B3', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('B3', 'D4', 'G4'), mGal('B3', 'D4', 'G4'), mGal('A3', 'D4', 'F#4'), mGal('A3', 'D4', 'F#4'),
      mGal('B3', 'E4', 'G4'), mGal('B3', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('A3', 'C#4', 'G4'), mGal('A3', 'C#4', 'G4'), '@e4 A3:2 D4 F#4 A4 D5:4 -:4'].join(' ') },
    { w: 'tri', v: .21, n: [mQ('G2', 'D3'), mQ('C3', 'G2'), mQ('G2', 'D3'), mQ('D3', 'A2'), mQ('G2', 'D3'), mQ('C3', 'G2'), 'G2:4 D3:4 D3:4 A2:4', 'G2:4 D3:4 G2:4 B2:2 D3:2',
      mBs('E2', 'E3', 'B2'), mBs('C3', 'C4', 'G3'), mBs('G2', 'G3', 'D3'), mBs('D3', 'D4', 'A3'), mBs('E2', 'E3', 'B2'), mBs('C3', 'C4', 'G3'), mBs('A2', 'A3', 'E3'), 'D3:3 D3:1 D4:2 A3:2 D3:2 E3:2 F#3:2 D3:2'].join(' ') },
    { w: 'drum', v: .09, n: rep(rep('k:2 h k h s h k h', 7) + ' ' + BAT.redoble, 2) },
  ] },
  // VILLA MUSGO — Sol mayor, pastoral y sin prisa. El Do menor (iv) del compás 14, como en el pueblo: la firma de «hogar»
  villa: { bpm: 96, ch: [
    { w: 'p25', v: .13, vib: 1, n: '@v13 B5:6 A5:2 G5:4 D5:4  E5:4 G5:2 B5:6 -:2 G5:2  E6:6 D6:2 C6:4 G5:4  A5:4 F#5:2 D5:6 -:2 D5:2  B5:6 A5:2 G5:4 B5:2 D6:2  E6:4 D6:2 B5:6 -:2 G5:2  C6:4 B5:2 A5:2 F#5:4 A5:2 D6:2  G5:10 -:2 B5:2 D6:2 ' +
      '@d50 E6:6 G6:2 E6:4 C6:4  D6:6 G6:2 D6:4 B5:4  C6:6 E6:2 C6:4 A5:4  F#5:2 A5 D6:6 -:2 D6:2 F#6:2  G6:6 E6:2 C6:4 E6:4  G6:6 Eb6:2 C6:4 Eb6:4  @d25 D6:4 B5:2 G5:2 C6:3 A5:3 F#5:2  G5:10 -:6' },
    { w: 'p12', v: .08, n: ['@e4 @v11', mBr('B3', 'D4', 'G4', 'B4'), mBr('B3', 'E4', 'G4', 'B4'), mBr('C4', 'E4', 'G4', 'C5'), mBr('A3', 'D4', 'F#4', 'A4'), mBr('B3', 'D4', 'G4', 'B4'), mBr('B3', 'E4', 'G4', 'B4'), 'C4:2 E4 G4 E4 A3:2 D4 F#4 D4', 'B3:2 D4 G4 B4 D5 B4 G4:4',
      '@e0 @v7 C5:8 E5:8  B4:8 D5:8  A4:8 C5:8  A4:8 D5:4 A4:4  C5:8 E5:8  C5:8 Eb5:8  @e4 @v11 B3:2 D4 G4 D4 A3:2 C4 F#4 C4  B3:2 D4 G4 B4 D5:4 -:4'].join(' ') },
    { w: 'tri', v: .2, n: [mTb('G2', 'D3', 'G3'), mTb('E2', 'B2', 'E3'), mTb('C3', 'G3', 'C4'), 'D3:6 A2:2 D3:4 F#2:4', mTb('G2', 'D3', 'G3'), mTb('E2', 'B2', 'E3'), 'C3:4 G3:4 D3:4 A2:4', 'G2:6 D3:2 G3:4 B2:4',
      mTb('C3', 'G3', 'C4'), mTb('B2', 'G3', 'B3'), mTb('A2', 'E3', 'A3'), mTb('D3', 'A3', 'D4'), mTb('C3', 'G3', 'C4'), mTb('C3', 'G3', 'C4'), 'D3:4 G3:4 D3:4 D2:4', 'G2:6 D3:2 G3:4 D3:4'].join(' ') },
    { w: 'drum', v: .06, n: rep('k:4 h:4 g:4 h:2 h:2', 16) },
  ] },
  // COSTA — Re mayor, puntillo de brisa (3+1) en la melodía y arpegios como olas; el Do (bVII) antes de volver
  costa: { bpm: 116, ch: [
    { w: 'p25', v: .14, vib: 1, n: 'A5:3 F#5:1 A5:4 D6:6 A5:2  B5:3 F#5:1 B5:4 D6:4 C#6:2 B5:2  G5:3 B5:1 D6:4 G6:6 D6:2  E6:3 C#6:1 A5:4 -:2 A5:2 C#6:2 E6:2  F#6:3 D6:1 F#6:4 A6:6 F#6:2  D6:3 B5:1 D6:4 F#6:4 E6:2 D6:2  E6:3 G6:1 B6:4 A6:3 G6:1 E6:4  D6:10 -:2 D6:2 E6:2 ' +
      'G6:6 D6:2 B5:4 D6:2 G6:2  A6:6 E6:2 C#6:6 -:2  F#6:6 C#6:2 A5:4 C#6:2 F#6:2  F#6:4 D6:2 B5:2 -:2 B5:2 D6:2 F#6:2  B6:3 A6:3 G6:2 D6:6 G6:2  C#7:3 B6:3 A6:2 E6:6 A6:2  G6:6 E6:2 C6:3 E6:3 G6:2  E6:8 -:2 A5:2 C#6:2 E6:2' },
    { w: 'p12', v: .08, n: ['@e4 @v11', mBr('A3', 'D4', 'F#4', 'A4'), mBr('B3', 'D4', 'F#4', 'B4'), mBr('B3', 'D4', 'G4', 'B4'), mBr('A3', 'C#4', 'E4', 'A4'), mBr('A3', 'D4', 'F#4', 'A4'), mBr('B3', 'D4', 'F#4', 'B4'), 'B3:2 E4 G4 E4 A3:2 C#4 E4 C#4', 'A3:2 D4 F#4 A4 D5 A4 F#4:4',
      '@e0 @v8 B5:6 G5:2 D5:4 G5:2 B5:2  C#6:6 A5:2 E5:6 -:2  A5:6 F#5:2 C#5:4 F#5:2 A5:2  D6:4 B5:2 F#5:2 -:2 F#5:2 B5:2 D6:2', '@e4 @v11', mBr('B3', 'D4', 'G4', 'B4'), mBr('A3', 'C#4', 'E4', 'A4'), mBr('G3', 'C4', 'E4', 'G4'), 'A3:2 C#4 E4 A4 C#5:4 -:4'].join(' ') },
    { w: 'tri', v: .21, n: [mWb('D3', 'A3', 'F#3'), mWb('B2', 'F#3', 'D3'), mWb('G2', 'D3', 'B2'), mWb('A2', 'E3', 'C#3'), mWb('D3', 'A3', 'F#3'), mWb('B2', 'F#3', 'D3'), 'E3:4 B2:2 E3:2 A2:4 E3:4', 'D3:4 A2:2 D3:2 F#3:4 A3:4',
      mBs('G2', 'G3', 'D3'), mBs('A2', 'A3', 'E3'), mBs('F#2', 'F#3', 'C#3'), mBs('B2', 'B3', 'F#3'), mBs('G2', 'G3', 'D3'), mBs('A2', 'A3', 'E3'), mBs('C3', 'C4', 'G3'), 'A2:3 A2:1 A3:2 E3:2 A2:2 B2:2 C#3:2 A2:2'].join(' ') },
    { w: 'drum', v: .09, n: rep('k:4 h:2 h:1 h s:4 h:2 k:1 k', 8) + ' ' + rep(BAT.galope, 7) + ' ' + BAT.redoble },
  ] },
  // PUERTO ROÑA — La menor, 6/8 de canción marinera: bajo que se mece y acordes en las partes débiles
  puerto: { bpm: 132, ch: [
    { w: 'p25', v: .14, vib: 1, n: 'A5:4 C6:2 E6:4 C6:2  D6:4 B5:2 G5:6  A5:4 C6:2 E6:4 A6:2  G#6:4 E6:2 B5:6  C6:4 E6:2 A6:4 G6:2  F6:2 E6 D6 B5:4 G5:2  A5:4 C6:2 B5:4 G#5:2  A5:10 E5:2 ' +
      'E6:6 G6:4 E6:2  D6:6 B5:4 D6:2  C6:6 E6:4 C6:2  B5:4 E6:2 G#6:6  A6:4 F6:2 C6:4 F6:2  G6:4 E6:2 C6:4 E6:2  F6:2 E6 D6 E6:2 D6 B5  A5:10 E5:2' },
    { w: 'p12', v: .08, n: ['@e3 @v11', m68('C5', 'E5'), m68('B4', 'D5'), m68('C5', 'E5'), m68('G#4', 'B4'), m68('C5', 'E5'), m68('B4', 'D5'), '-:2 A4:2 C5:2 -:2 G#4:2 B4:2', m68('C5', 'E5'),
      m68('G4', 'C5'), m68('G4', 'B4'), m68('A4', 'C5'), m68('G#4', 'B4'), m68('A4', 'C5'), m68('G4', 'C5'), '-:2 F4:2 A4:2 -:2 G#4:2 B4:2', m68('A4', 'C5')].join(' ') },
    { w: 'tri', v: .22, n: [b68('A2', 'E3'), b68('G2', 'D3'), b68('A2', 'E3'), b68('E2', 'B2'), b68('A2', 'E3'), b68('G2', 'D3'), 'F2:6 E2:6', 'A2:6 E3:4 A2:2',
      b68('C3', 'G3'), b68('G2', 'D3'), b68('A2', 'E3'), b68('E2', 'B2'), b68('F2', 'C3'), b68('C3', 'G3'), 'D3:6 E3:6', 'A2:6 E2:4 A2:2'].join(' ') },
    { w: 'drum', v: .08, n: rep('k:4 h:2 s:4 h:2', 16) },
  ] },
  // CIUDAD DINAMO — Fa mayor, ajetreo: síncopa 3+3+2, acordes a contratiempo y bajo que camina; la B canta y la A vuelve
  ciudad: { bpm: 116, ch: [
    { w: 'p25', v: .14, vib: 1, n: [CIU, 'Bb5:2 D6 G6:4 E6:2 G6 Bb6:4  A6:6 F6:2 C6:4 -:4',
      'D6:8 F6:4 D6:2 Bb5:2  E6:8 G6:4 E6:2 C6:2  C6:6 E6:2 A6:6 G6:2  F6:4 E6:2 D6:2 A5:6 -:2  D6:3 F6:3 Bb6:2 A6:4 F6:2 D6:2  E6:3 G6:3 C7:2 Bb6:4 G6:2 E6:2  A6:6 G6:1 F6:1 C6:4 F6:4  G6:4 E6:2 C6:2 Bb5:4 -:2 C6:2',
      CIU, 'Bb5:2 D6 G6:4 Bb6:2 A6 G6 E6  F6:10 -:6'].join(' ') },
    { w: 'p12', v: .08, n: ['@e2 @v12', CIU2, '@e4 F5:2 A5 C6 A5 F5:4 -:2 C5:2',
      '@e0 @v8 Bb5:8 D6:4 Bb5:2 F5:2  C6:8 E6:4 C6:2 G5:2  A5:6 C6:2 E6:6 E6:2  D6:4 C6:2 A5:2 F5:6 -:2', '@e3 @v11', mBr('Bb4', 'D5', 'F5', 'Bb5'), mBr('G4', 'C5', 'E5', 'G5'), mBr('A4', 'C5', 'F5', 'A5'), mBr('G4', 'Bb4', 'C5', 'E5'),
      '@e2 @v12', CIU2, '@e4 A4:2 C5 F5 A5 C6:4 -:4'].join(' ') },
    { w: 'tri', v: .22, n: [CIU3, 'F2:3 F2:1 F3:2 C3:2 F2:2 G2:2 A2:2 Bb2:2',
      mWb('Bb2', 'F3', 'D3'), mWb('C3', 'G3', 'E3'), mWb('A2', 'E3', 'C3'), mWb('D3', 'A3', 'F3'), mBs('Bb2', 'Bb3', 'F3'), mBs('C3', 'C4', 'G3'), mBs('F2', 'F3', 'C3'), 'C3:3 C3:1 C4:2 G3:2 C3:2 D3:2 E3:2 C3:2',
      CIU3, 'F2:3 F2:1 F3:2 C3:2 F2:4 C3:2 E3:2'].join(' ') },
    { w: 'drum', v: .1, n: [rep(BAT.ciudad, 7), BAT.redoble, rep('k:4 h:2 h s:4 h:2 h', 4), rep(BAT.ciudad, 3), BAT.redoble, rep(BAT.ciudad, 7), BAT.redoble].join(' ') },
  ] },
  // CENTRAL — La menor a paso tenso; en la B aparece el contorno del PULSO (lo que guardan las Centrales)
  gimnasio: { bpm: 126, ch: [
    { w: 'p25', v: .14, vib: 1, n: '@g70 A5:2 -:2 E5:2 A5:2 C6:4 B5:2 A5:2  @g85 C6:6 A5:2 F5:6 -:2  @g70 B5:2 -:2 G5:2 B5:2 D6:4 C6:2 B5:2  @g85 E6:6 B5:2 G#5:4 -:2 E5:2  @g70 A5:2 -:2 E5:2 A5:2 C6:4 D6:2 E6:2  @g85 F6:6 C6:2 A5:4 C6:2 F6:2  G6:4 F6:2 D6:2 B5:3 D6:3 G6:2  E6:10 -:2 E5:2 G#5:2 ' +
      'A5:6 F5:2 A5:2 B5 C6:4  B5:6 G5:2 B5:2 C6 D6:4  C6:6 A5:2 C6:2 D6 E6:4  A6:8 -:2 E6:2 C6:2 A5:2  F6:4 E6:2 C6:2 A5:4 C6:2 F6:2  G6:4 F6:2 D6:2 B5:4 D6:2 G6:2  G#6:3 E6:3 B5:2 E6:3 B5:3 G#5:2  B5:8 -:4 E5:2 G#5:2' },
    { w: 'p12', v: .08, n: ['@e2 @v11', arp('A4', 'C5', 'E5'), arp('A4', 'C5', 'F5'), arp('G4', 'B4', 'D5'), arp('G#4', 'B4', 'E5'), arp('A4', 'C5', 'E5'), arp('A4', 'C5', 'F5'), arp('G4', 'B4', 'D5'), arp('G#4', 'B4', 'E5'),
      mGal('A4', 'C5', 'F5'), mGal('A4', 'C5', 'F5'), mGal('G4', 'B4', 'D5'), mGal('G4', 'B4', 'D5'), mGal('A4', 'C5', 'E5'), mGal('A4', 'C5', 'E5'), '@e4 A4:2 C5 E5 A5 C6:4 -:4',
      '@e2', mGal('A4', 'C5', 'F5'), mGal('A4', 'C5', 'F5'), mGal('G4', 'B4', 'D5'), mGal('G4', 'B4', 'D5'), mGal('G#4', 'B4', 'E5'), mGal('G#4', 'B4', 'E5'), '@e4 G#4:2 B4 E5 G#5 B5:4 -:4'].join(' ') },
    { w: 'tri', v: .23, n: [mBs('A2', 'A3', 'E3'), mBs('F2', 'F3', 'C3'), mBs('G2', 'G3', 'D3'), mBs('E2', 'E3', 'B2'), mBs('A2', 'A3', 'E3'), mBs('F2', 'F3', 'C3'), mBs('G2', 'G3', 'D3'), 'E2:3 E2:1 E3:2 E2:2 B2:2 E2:2 E3:2 E2:2',
      mBs('F2', 'F3', 'C3'), mBs('G2', 'G3', 'D3'), mBs('A2', 'A3', 'E3'), mBs('A2', 'A3', 'E3'), mBs('F2', 'F3', 'C3'), mBs('G2', 'G3', 'D3'), mBs('E2', 'E3', 'B2'), 'E2:3 E2:1 E3:2 E2:2 B2:2 E2:2 G#2:2 B2:2'].join(' ') },
    { w: 'drum', v: .11, n: rep(rep(BAT.galope, 7) + ' ' + BAT.redoble, 2) },
  ] },
  // FERRETERÍA — Do mayor, saltarina y corta: se te queda mientras compras
  tienda: { bpm: 120, ch: [
    { w: 'p25', v: .13, n: '@g75 E5:2 G5 C6:4 G5:2 E5 G5 -:2  F5:2 A5 C6:4 A5:2 F5 A5 -:2  E5:2 G5 C6:2 E6:2 D6:3 C6:3 G5:2  @g85 B5:6 D6:2 G5:4 -:4  @g75 E6:2 -:2 C6:2 G5:2 E6:2 -:2 C6:2 G5:2  F6:2 -:2 C6:2 A5:2 F6:2 -:2 C6:2 A5:2  @g85 D6:3 F6:3 A6:2 G6:3 F6:3 D6:2  C6:4 E6:2 G6:2 C7:4 -:4' },
    { w: 'p12', v: .08, n: ['@e2 @v12', mOf('E4', 'G4'), mOf('F4', 'A4'), mOf('E4', 'G4'), mOf('D4', 'G4'), mOf('E4', 'G4'), mOf('F4', 'A4'), '-:2 F4:2 -:2 A4:2 -:2 G4:2 -:2 B4:2', '@e4 E4:2 G4 C5 G4 E5:4 -:4'].join(' ') },
    { w: 'tri', v: .2, n: [mQ('C3', 'G2'), mQ('F2', 'C3'), mQ('C3', 'G2'), mQ('G2', 'D3'), mQ('C3', 'G2'), mQ('F2', 'C3'), 'D3:4 A2:4 G2:4 B2:4', 'C3:4 G2:4 C3:4 -:4'].join(' ') },
    { w: 'drum', v: .08, n: rep('k:4 h:2 s:2 k:2 k:2 s:2 h:2', 7) + ' k:4 h:2 s:2 k:2 s:2 s:4' },
  ] },
  // ENTRENADOR — Re menor, pique amistoso: misma firma rítmica que el combate (paradas, carrerilla de vuelta) con otra cara
  entrenador: { bpm: 160, loop: 32, ch: [
    { w: 'p25', v: .15, vib: 1, n: 'D6:1 C6 A5 G5 F5 G5 A5 C6 D6:2 -:2 D6:2 -:2  A5:1 C6 D6 F6 A6:2 -:2 A5:2 A5 C#6:2 E6:2 ' +
      'D6:2 -:1 D6:1 F6:2 A6:4 G6:2 F6:2 D6:2  E6:2 -:1 E6:1 G6:2 C7:4 Bb6:2 G6:2 E6:2  F6:6 D6:2 Bb5:3 D6:3 F6:2  E6:4 C#6:2 A5:2 -:2 A5:1 C#6 E6:2 G6:2  F6:2 -:1 F6:1 A6:2 D7:4 C7:2 A6:2 F6:2  G6:6 E6:2 C6:3 E6:3 G6:2  F6:3 D6:3 Bb5:2 E6:3 C#6:3 A5:2  D6:8 -:2 A5:2 D6:2 F6:2 ' +
      'A6:6 G6:1 F6:1 C6:4 F6:4  G6:6 F6:1 E6:1 C6:4 E6:4  F6:3 E6:3 D6:2 A5:4 D6:2 F6:2  E6:6 G6:2 E6:2 C#6:2 A5:4  D6:2 -:1 D6:1 F6:2 Bb6:4 A6:2 F6:2 D6:2  E6:2 -:1 E6:1 G6:2 C7:4 Bb6:2 G6:2 E6:2  @g60 A6:2 -:1 A6:2 -:1 A6:2 G6:2 -:1 G6:2 -:1 E6:2  @g85 C#6:4 -:4 A5:1 B5 C#6 D6 E6 F6 G6 A6' },
    { w: 'p12', v: .09, n: ['@e0 @v9 -:8 F5:2 -:2 F5:2 -:2  -:4 F6:2 -:2 E5:2 E5 E5:2 G5:2',
      '@e2 @v12', mSt('A4', 'D5', 'F5'), mSt('G4', 'C5', 'E5'), mSt('Bb4', 'D5', 'F5'), mSt('A4', 'C#5', 'E5'), '@e1', m16('A4', 'D5', 'F5'), m16('G4', 'C5', 'E5'), 'Bb4:1 D5 F5 D5 Bb4 D5 F5 D5 A4:1 C#5 E5 C#5 A4 C#5 E5 C#5', '@e4 A4:2 D5 F5 A5 D6:4 -:4',
      '@e0 @v8 F6:6 E6:1 D6:1 A5:4 C6:4  E6:6 D6:1 C6:1 G5:4 C6:4  D6:3 C6:3 A5:2 F5:4 A5:2 D6:2  C#6:6 E6:2 C#6:2 A5:2 E5:4', '@e1 @v12', m16('Bb4', 'D5', 'F5'), m16('G4', 'C5', 'E5'),
      '@e0 @v9 @g60 C#6:2 -:1 C#6:2 -:1 C#6:2 E6:2 -:1 E6:2 -:1 C#6:2  @g85 A5:4 -:4 C#5:1 D5 E5 F5 G5 A5 Bb5 C#6'].join(' ') },
    { w: 'tri', v: .23, n: ['D3:2 D3 D3 D3 D3:2 -:2 D3:2 -:2  D3:2 D3 D3:2 -:2 A2:2 A2 A2:2 A2:2',
      '@g75', mCb('D3', 'D4', 'A2'), mCb('C3', 'C4', 'G2'), mCb('Bb2', 'Bb3', 'F2'), mCb('A2', 'A3', 'C#3'), mCb('D3', 'D4', 'A2'), mCb('C3', 'C4', 'G2'), 'Bb2:3 Bb2:3 Bb3:2 A2:3 A2:3 A3:2', 'D3:3 D3:3 D4:2 -:2 D3:2 E3:2 F3:2',
      mCb('F2', 'F3', 'C3'), mCb('C3', 'C4', 'G2'), mCb('D3', 'D4', 'A2'), mCb('A2', 'A3', 'A2'), mCb('Bb2', 'Bb3', 'F2'), mCb('C3', 'C4', 'G2'), 'A2:2 -:1 A2:2 -:1 A2:2 A2:2 -:1 A2:2 -:1 A2:2', 'A2:4 -:4 A2:1 B2 C#3 D3 E3 F3 G3 A3'].join(' ') },
    { w: 'drum', v: .13, n: ['s:1 s s s s s s s k:2 -:2 k:2 -:2  s:1 s s s k:2 -:2 s:2 s s:1 s s s',
      rep(BAT.sinc, 3), BAT.cierre, rep(BAT.sinc, 3), 'k:3 k:3 s:2 -:2 s:2 s:2 t:2', rep(BAT.empuje, 6), BAT.paradas, BAT.vuelta].join(' ') },
  ] },
  // RECLUTA APAGÓN — Mi frigio. Presenta el motivo de APAGÓN (1–b2–1 · b5–4: un semitono que aprieta y un tritono que se apaga), primero a solas con el bajo
  apagon: { bpm: 150, loop: 32, ch: [
    { w: 'p25', v: .14, n: 'E5:3 F5:3 E5:2 Bb5:6 A5:2  E5:3 F5:3 E5:2 Bb5:4 -:4 ' +
      'E6:3 F6:3 E6:2 -:2 B5:2 E6:2 G6:2  Bb6:6 A6:2 G6:2 E6:2 -:4  F6:3 G6:3 F6:2 -:2 C6:2 F6:2 A6:2  G6:4 F6:2 E6:2 -:2 B5:1 D6 E6:4  E6:3 F6:3 E6:2 -:2 B5:2 E6:2 G6:2  Bb6:4 A6:2 G6:2 B6:6 -:2  C7:3 A6:3 F6:2 A6:3 F6:3 C6:2  D#6:3 F#6:3 A6:2 B6:4 -:2 B5:1 D#6 ' +
      'E6:6 C6:2 A5:4 C6:2 E6:2  G6:6 E6:2 B5:6 -:2  A6:6 E6:2 C6:4 E6:2 A6:2  B6:4 G6:2 E6:2 -:2 E6:1 G6 B6:4  C7:3 G6:3 E6:2 G6:6 E6:2  D7:3 A6:3 F#6:2 A6:6 F#6:2  @g60 F6:2 -:1 F6:2 -:1 F6:2 A6:2 -:1 A6:2 -:1 C7:2  @g85 B6:4 -:4 B5:1 C6 D#6 E6 F#6 G6 A6 B6' },
    { w: 'p12', v: .09, n: ['@e0 @v9 -:16 -:8 E6:1 D#6 D6 C#6 C6 B5 Bb5 A5',
      '@e2 @v12', mSt('B4', 'E5', 'G5'), mSt('B4', 'E5', 'G5'), mSt('C5', 'F5', 'A5'), mSt('B4', 'E5', 'G5'), '@e1', m16('G4', 'B4', 'E5'), m16('G4', 'B4', 'E5'), m16('A4', 'C5', 'F5'), '@e0 @v9 F#5:3 A5:3 B5:2 D#6:4 -:4',
      '@v8 C6:6 A5:2 E5:4 A5:2 C6:2  E6:6 B5:2 G5:6 -:2  E6:6 C6:2 A5:4 C6:2 E6:2  G6:4 E6:2 B5:2 -:2 B5:1 E6 G6:4', '@e1 @v12', m16('G4', 'C5', 'E5'), m16('A4', 'D5', 'F#5'),
      '@e0 @v9 @g60 A5:2 -:1 A5:2 -:1 A5:2 C6:2 -:1 C6:2 -:1 A5:2  @g85 F#6:4 -:4 D#5:1 E5 F#5 G5 A5 B5 C6 D#6'].join(' ') },
    { w: 'tri', v: .24, n: ['E2:3 F2:3 E2:2 Bb2:6 A2:2  E2:3 F2:3 E2:2 Bb2:4 -:4',
      '@g75', mCb('E2', 'E3', 'B2'), 'E2:3 E2:3 E3:2 -:1 E2:1 Bb2:2 A2:2 G2:2', mCb('F2', 'F3', 'C3'), mCb('E2', 'E3', 'B2'), mCb('E2', 'E3', 'B2'), 'E2:3 E2:3 E3:2 -:1 E2:1 Bb2:2 A2:2 G2:2', mCb('F2', 'F3', 'F#2'), 'B2:3 B2:3 B3:2 B2:4 -:2 B2:2',
      mCb('A2', 'A3', 'E3'), mCb('E2', 'E3', 'B2'), mCb('A2', 'A3', 'E3'), mCb('E2', 'E3', 'G2'), mCb('C3', 'C4', 'G2'), mCb('D3', 'D4', 'A2'), 'F2:2 -:1 F2:2 -:1 F2:2 F2:2 -:1 F2:2 -:1 F2:2', 'B2:4 -:4 B2:1 C3 D#3 E3 F#3 G3 A3 B3'].join(' ') },
    { w: 'drum', v: .13, n: ['k:3 k:3 k:2 s:6 -:2  k:3 k:3 k:2 s:4 s:1 s s s', rep(BAT.fabrica, 7), 'k:3 k:3 s:2 s:4 -:2 s:1 s', rep(BAT.sinc, 6), BAT.paradas, BAT.vuelta].join(' ') },
  ] },
  // COBRE — Sol mixolidio, chulo: su motivo es el salto 5–1'–b7–5. La B se pone seria y vuelve por Mib–Fa–Sol
  rival: { bpm: 168, loop: 32, ch: [
    { w: 'p25', v: .15, vib: 1, n: 'G5:1 A5 B5 C6 D6:2 -:2 D6:2 -:2 G6:2 -:2  F6:2 -:1 F6:2 -:1 D6:2 F6:4 -:4 ' +
      'D5:2 G5:4 F5:2 D5:2 F5:2 G5:4  A5:6 G5:2 F5:4 -:2 D5:2  D5:2 G5:4 F5:2 G5:2 B5:2 D6:4  C6:3 A5:3 F5:2 F#5:3 A5:3 D6:2  D6:2 G6:4 F6:2 D6:2 F6:2 G6:4  A6:6 G6:2 F6:2 C6:2 F6:2 A6:2  G6:6 E6:2 C6:3 E6:3 G6:2  F#6:4 D6:2 A5:2 -:2 D6:1 E6 F#6:2 A6:2 ' +
      'B6:6 G6:2 E6:4 G6:2 B6:2  C7:4 G6:2 E6:2 -:2 E6:1 G6 C7:2 G6:2  B6:6 G6:2 E6:3 G6:3 B6:2  A6:6 F#6:2 D6:6 -:2  E6:2 -:1 E6:1 G6:2 C7:4 B6:2 G6:2 E6:2  F#6:2 -:1 F#6:1 A6:2 D7:4 C7:2 A6:2 F#6:2  G6:3 Bb6:3 G6:2 A6:3 C7:3 A6:2  B6:6 -:2 G6:2 D6:2 B5:2 G5:2' },
    { w: 'p12', v: .09, n: ['@e0 @v9 B4:1 C5 D5 E5 G5:2 -:2 G5:2 -:2 B5:2 -:2  A5:2 -:1 A5:2 -:1 A5:2 C6:4 -:4',
      '@e2 @v12', mSt('B4', 'D5', 'G5'), mSt('A4', 'C5', 'F5'), mSt('B4', 'D5', 'G5'), '-:2 A4:1 C5 -:2 F5:2 -:2 A4:1 D5 -:2 F#5:2', '@e1', m16('B4', 'D5', 'G5'), m16('A4', 'C5', 'F5'), m16('G4', 'C5', 'E5'), '@e0 @v9 F#5:4 D5:2 A4:2 -:2 A4:1 D5 F#5:2 D5:2',
      '@v8 G6:6 E6:2 B5:4 E6:2 G6:2  G6:4 E6:2 C6:2 -:2 C6:1 E6 G6:2 E6:2  G6:6 E6:2 B5:3 E6:3 G6:2  F#6:6 D6:2 A5:6 -:2', '@e1 @v12', m16('G4', 'C5', 'E5'), m16('A4', 'D5', 'F#5'), 'Bb4:1 Eb5 G5 Eb5 Bb4 Eb5 G5 Eb5 C5:1 F5 A5 F5 C5 F5 A5 F5', '@e0 @v9 D6:6 -:2 B5:2 G5:2 D5:2 B4:2'].join(' ') },
    { w: 'tri', v: .23, n: ['G2:4 G2:2 -:2 G2:2 -:2 G2:2 -:2  F2:2 -:1 F2:2 -:1 F2:2 F2:4 D2:2 F#2:2',
      '@g75', mCb('G2', 'G3', 'D3'), mCb('F2', 'F3', 'C3'), mCb('G2', 'G3', 'D3'), 'F2:3 F2:3 F3:2 D3:3 D3:3 D2:2', mCb('G2', 'G3', 'D3'), mCb('F2', 'F3', 'C3'), mCb('C3', 'C4', 'G2'), 'D3:3 D3:3 D4:2 D3:2 D3:1 D3 D3:2 D#3:2',
      mCb('E3', 'E4', 'B2'), mCb('C3', 'C4', 'G2'), mCb('E3', 'E4', 'B2'), mCb('D3', 'D4', 'A2'), mCb('C3', 'C4', 'G2'), mCb('D3', 'D4', 'D3'), 'Eb3:3 Eb3:3 Eb4:2 F3:3 F3:3 F4:2', 'G2:6 -:2 G3:2 D3:2 B2:2 G2:2'].join(' ') },
    { w: 'drum', v: .13, n: ['s:1 s s s k:2 -:2 k:2 -:2 k:2 -:2  k:2 -:1 k:2 -:1 k:2 s:2 s s:1 s s s',
      rep(BAT.sinc, 3), BAT.cierre, rep(BAT.sinc, 3), 'k:3 k:1 s:2 h:2 k:2 s:1 s s:2 t:1 t', rep(BAT.empuje, 6), 'k:3 s:3 k:2 k:3 s:3 k:2', 'c:6 -:2 s:2 s:2 t:2 t:2'].join(' ') },
  ] },
  // JEFE DE CENTRAL — Do menor, noble. La segunda mitad es el PULSO en menor heroico, subiendo en secuencia: te estás ganando el fusible
  lider: { bpm: 140, loop: 32, ch: [
    { w: 'p25', v: .15, vib: 1, n: 'C5:1 Eb5 G5 C6 Eb6:2 -:2 D6:1 G5 B5 D6 G6:2 -:2  Ab6:3 G6:3 F6:2 G6:6 -:2 ' +
      'G5:6 Eb5:2 C5:2 Eb5 G5 C6  Eb6:6 C6:2 Ab5:6 -:2  F5:6 D5:2 Bb4:2 D5 F5 Bb5  D6:6 B5:2 G5:4 -:2 G5:2  C6:3 Eb6:3 G6:6 F6:2 Eb6:2  Ab6:6 G6:1 F6:1 Eb6:4 C6:4  F6:3 Ab6:3 C7:2 Ab6:3 F6:3 C6:2  D6:4 B5:2 G5:2 -:2 G5:1 B5 D6:2 G6:2 ' +
      'C6:6 G5:2 C6:2 D6 Eb6:4  D6:6 B5:2 G5:8  Eb6:6 C6:2 Eb6:2 F6 G6:4  Bb6:6 G6:2 Eb6:8  Ab6:6 F6:2 Ab6:2 Bb6 C7:4  Eb7:4 C7:2 G6:2 Eb6:4 G6:2 C7:2  Ab6:3 G6:3 F6:2 Eb6:3 D6:3 C6:2  @g60 B5:2 -:1 B5:2 -:1 D6:2 @g85 G6:4 -:2 D5:2' },
    { w: 'p12', v: .09, n: ['@e0 @v9 -:16  C6:3 B5:3 Ab5:2 B5:6 -:2',
      '@e2 @v11', mGal('G4', 'C5', 'Eb5'), mGal('G4', 'C5', 'Eb5'), mGal('Ab4', 'C5', 'Eb5'), mGal('Ab4', 'C5', 'Eb5'), mGal('F4', 'Bb4', 'D5'), mGal('F4', 'Bb4', 'D5'), mGal('G4', 'B4', 'D5'), mGal('G4', 'B4', 'D5'),
      '@e1 @v12', m16('G4', 'C5', 'Eb5'), m16('Ab4', 'C5', 'Eb5'), m16('Ab4', 'C5', 'F5'), '@e4 @v11 B4:2 D5 G5 B5 D6:4 -:4',
      '@e0 @v8 Eb5:6 Eb5:2 Eb5:2 F5 G5:4  G5:6 G5:2 D5:8  C6:6 Ab5:2 C6:2 D6 Eb6:4  G6:6 Eb6:2 Bb5:8', '@e1 @v12', m16('Ab4', 'C5', 'F5'), m16('G4', 'C5', 'Eb5'), 'Ab4:1 C5 Eb5 C5 Ab4 C5 Eb5 C5 Ab4:1 C5 F5 C5 Ab4 C5 F5 C5', '@e0 @v9 @g60 G5:2 -:1 G5:2 -:1 B5:2 @g85 D6:4 -:4'].join(' ') },
    { w: 'tri', v: .24, n: ['C3:8 G2:8  Ab2:3 Ab2:3 Ab2:2 G2:6 G2:2',
      '@g75', mCb('C3', 'C4', 'G2'), mCb('Ab2', 'Ab3', 'Eb3'), mCb('Bb2', 'Bb3', 'F2'), mCb('G2', 'G3', 'B2'), mCb('C3', 'C4', 'G2'), mCb('Ab2', 'Ab3', 'Eb3'), mCb('F2', 'F3', 'C3'), 'G2:3 G2:3 G3:2 G2:2 G2:1 G2 A2:2 B2:2',
      '@g90', mBs('C3', 'C4', 'G3'), mBs('B2', 'B3', 'G3'), mBs('Ab2', 'Ab3', 'Eb3'), mBs('Eb3', 'Eb4', 'Bb3'), mBs('F2', 'F3', 'C3'), mBs('G2', 'G3', 'Eb3'), 'Ab2:3 Ab2:3 Ab3:2 F2:3 F2:3 F3:2', 'G2:2 -:1 G2:2 -:1 G2:2 G2:4 A2:2 B2:2'].join(' ') },
    { w: 'drum', v: .14, n: ['k:4 s:2 -:2 k:4 s:2 -:2  k:3 k:3 k:2 s:2 s s:1 s s s', rep(BAT.sinc, 3), BAT.cierre, rep(BAT.sinc, 3), BAT.cierre, rep(BAT.galope, 6), 'k:3 s:3 k:2 k:3 s:3 k:2', 'k:2 -:1 k:2 -:1 s:2 c:4 s:1 s t t'].join(' ') },
  ] },
  // MANDO DE APAGÓN — Sib menor. El motivo de APAGÓN entra solo en el bajo, se dobla, y vuelve al final de cada vuelta con una tercera encima
  jefeApagon: { bpm: 156, loop: 64, ch: [
    { w: 'p25', v: .15, vib: 1, n: '-:32  Bb4:3 B4:3 Bb4:2 E5:6 Eb5:2  Bb5:3 B5:3 Bb5:2 E6:4 F6:1 Gb6 Ab6 A6 ' +
      'Bb5:6 F5:2 Db5:4 F5:2 Bb5:2  A5:3 Bb5:3 C6:2 Db6:6 -:2  Db6:4 Bb5:2 Gb5:2 -:2 Gb5:1 Bb5 Db6:2 Bb5:2  A5:6 F5:2 C5:3 F5:3 A5:2  Bb5:6 F5:2 Db5:4 F5:2 Bb5:2  C6:3 Db6:3 Eb6:2 F6:6 -:2  Gb6:4 F6:2 Db6:2 Bb5:3 Db6:3 Gb6:2  F6:6 A6:2 C7:6 -:2 ' +
      'Eb6:2 -:1 Eb6:1 Gb6:2 Bb6:4 Ab6:2 Gb6:2 Eb6:2  Db6:2 -:1 Db6:1 F6:2 Bb6:4 Ab6:2 F6:2 Db6:2  Gb6:6 Eb6:2 Bb5:3 Eb6:3 Gb6:2  F6:4 C6:2 A5:2 -:2 A5:1 C6 F6:2 A6:2  Bb6:6 Gb6:2 Db6:4 Gb6:4  C7:6 Ab6:2 Eb6:4 Ab6:4  Bb6:3 B6:3 Bb6:2 E6:6 Eb6:2  Bb5:3 B5:3 Bb5:2 E6:4 F6:1 Gb6 Ab6 A6' },
    { w: 'p12', v: .09, n: ['@e0 @v9 -:48  Db5:3 D5:3 Db5:2 G5:4 -:4',
      '@e2 @v12', mSt('Db5', 'F5', 'Bb5'), mSt('Db5', 'F5', 'Bb5'), mSt('Db5', 'Gb5', 'Bb5'), mSt('C5', 'F5', 'A5'), '@e1', m16('Bb4', 'Db5', 'F5'), m16('Bb4', 'Db5', 'F5'), m16('Bb4', 'Db5', 'Gb5'), '@e0 @v9 A5:6 C6:2 F6:6 -:2',
      '@e1 @v12', m16('Bb4', 'Eb5', 'Gb5'), m16('Bb4', 'Db5', 'F5'), m16('Bb4', 'Eb5', 'Gb5'), m16('A4', 'C5', 'F5'), '@e0 @v8 Gb6:6 Db6:2 Bb5:4 Db6:4  Ab6:6 Eb6:2 C6:4 Eb6:4  @v9 Db6:3 D6:3 Db6:2 G5:6 Gb5:2  Db5:3 D5:3 Db5:2 G5:4 -:4'].join(' ') },
    { w: 'tri', v: .25, n: [rep('Bb2:3 B2:3 Bb2:2 E3:6 Eb3:2', 4),
      '@g75', mCb('Bb2', 'Bb3', 'F2'), mCb('Bb2', 'Bb3', 'A2'), mCb('Gb2', 'Gb3', 'Db3'), mCb('F2', 'F3', 'A2'), mCb('Bb2', 'Bb3', 'F2'), mCb('Bb2', 'Bb3', 'Ab2'), mCb('Gb2', 'Gb3', 'Gb2'), 'F2:3 F2:3 F3:2 F2:2 F2:1 F2 A2:2 C3:2',
      mCb('Eb3', 'Eb4', 'Bb2'), mCb('Bb2', 'Bb3', 'F2'), mCb('Eb3', 'Eb4', 'Bb2'), mCb('F2', 'F3', 'F2'), mCb('Gb2', 'Gb3', 'Db3'), mCb('Ab2', 'Ab3', 'Eb3'), '@g95 Bb2:3 B2:3 Bb2:2 E3:6 Eb3:2', 'Bb2:3 B2:3 Bb2:2 E3:4 F2:1 Gb2 Ab2 A2'].join(' ') },
    { w: 'drum', v: .14, n: ['k:3 k:3 k:2 -:8  k:3 k:3 k:2 -:6 s:2  k:3 k:3 k:2 s:6 s:2  k:3 k:3 k:2 s:2 s:2 s:1 s s s',
      rep(BAT.pesada, 7), 'k:3 k:3 s:2 s:4 s:1 s s s', rep(BAT.pesada, 6), 'k:3 k:3 k:2 s:6 s:2', 'k:3 k:3 k:2 s:2 s:2 s:1 s s s'].join(' ') },
  ] },
  // FINAL — Mi menor. Los dos motivos se pelean: APAGÓN abre en el bajo, el PULSO le contesta rápido en la A, APAGÓN invade la B y el PULSO gana la C en mayor
  final: { bpm: 176, loop: 64, ch: [
    { w: 'p25', v: .15, vib: 1, n: '-:32  E5:6 B4:2 E5:2 F#5 G5:4  B5:8 -:4 B5:1 C6 D6 D#6 ' +
      'E6:6 B5:2 E6:2 F#6 G6:4  G6:3 E6:3 C6:2 E6:6 -:2  F#6:6 D6:2 F#6:2 G6 A6:4  B6:4 F#6:2 D#6:2 -:2 B5:1 D#6 F#6:2 B6:2  G6:6 E6:2 G6:2 A6 B6:4  C7:4 B6:2 G6:2 E6:3 G6:3 C7:2  A6:3 E6:3 C6:2 E6:3 C6:3 A5:2  B5:3 D#6:3 F#6:2 B6:6 -:2 ' +
      'E6:3 F6:3 E6:2 Bb6:6 A6:2  G6:2 -:1 E6:3 -:2 B5:1 E6 G6 B6 A6:2 G6:2  F6:3 Gb6:3 F6:2 B6:6 Bb6:2  A6:2 -:1 F6:3 -:2 C6:1 F6 A6 C7 A6:2 F6:2  G6:6 B6:2 D7:6 B6:1 G6:1  A6:6 C#7:2 E7:6 C#7:1 A6:1  @g60 B6:2 -:1 B6:2 -:1 B6:2 A6:2 -:1 A6:2 -:1 F#6:2  @g85 D#6:4 -:4 B5:1 C#6 D#6 E6 F#6 G6 A6 B6 ' +
      'C6:6 G5:2 C6:2 D6 E6:4  D6:6 A5:2 D6:2 E6 F#6:4  E6:6 B5:2 E6:2 F#6 G6:4  B6:8 -:2 G6:2 A6:2 B6:2  C7:6 G6:2 E6:4 G6:4  D7:6 A6:2 F#6:4 A6:4  E7:3 B6:3 G#6:2 B6:3 G#6:3 E6:2  F#6:3 F#6:3 F#6:2 B5:1 C#6 D#6 E6 F#6 G6 A6 B6' },
    { w: 'p12', v: .09, n: ['@e0 @v9 -:32  G4:6 G4:2 G4:2 A4 B4:4  D#5:8 -:8',
      '@e2 @v12', mSt('B4', 'E5', 'G5'), mSt('C5', 'E5', 'G5'), mSt('A4', 'D5', 'F#5'), mSt('B4', 'D#5', 'F#5'), '@e1', m16('G4', 'B4', 'E5'), m16('G4', 'C5', 'E5'), m16('A4', 'C5', 'E5'), '@e0 @v9 F#5:3 A5:3 B5:2 D#6:6 -:2',
      'G5:3 Ab5:3 G5:2 Db6:6 C6:2', '@e1 @v12', m16('G4', 'B4', 'E5'), '@e0 @v9 Ab5:3 A5:3 Ab5:2 D6:6 Db6:2', '@e1 @v12', m16('A4', 'C5', 'F5'), m16('G4', 'B4', 'D5'), m16('A4', 'C#5', 'E5'),
      '@e0 @v9 @g60 D#6:2 -:1 D#6:2 -:1 D#6:2 F#6:2 -:1 F#6:2 -:1 D#6:2  @g85 B5:4 -:4 D#5:1 E5 F#5 G5 A5 B5 C6 D#6',
      'E5:6 E5:2 E5:2 F#5 G5:4  F#5:6 F#5:2 F#5:2 G5 A5:4  G5:6 G5:2 G5:2 A5 B5:4  G6:8 -:2 E6:2 F#6:2 G6:2', '@e1 @v12', m16('G4', 'C5', 'E5'), m16('A4', 'D5', 'F#5'), m16('G#4', 'B4', 'E5'), '@e0 @v9 D#6:3 D#6:3 D#6:2 D#5:1 E5 F#5 G5 A5 B5 C6 D#6'].join(' ') },
    { w: 'tri', v: .25, n: [rep('E2:3 F2:3 E2:2 Bb2:6 A2:2', 3), 'B2:2 B2 B2 B2 B2:2 B2 B3 B2',
      '@g75', mCb('E2', 'E3', 'B2'), mCb('C3', 'C4', 'G2'), mCb('D3', 'D4', 'A2'), mCb('B2', 'B3', 'F#2'), mCb('E2', 'E3', 'B2'), mCb('C3', 'C4', 'G2'), mCb('A2', 'A3', 'E3'), 'B2:3 B2:3 B3:2 B2:2 B2:1 B2 D#3:2 F#3:2',
      '@g95 E2:3 F2:3 E2:2 Bb2:6 A2:2', '@g75 E2:2 E2:1 E2 E2:2 E2:1 E2 E3:2 E2:1 E2 G2:2 E2:2', '@g95 F2:3 Gb2:3 F2:2 B2:6 Bb2:2', '@g75 F2:2 F2:1 F2 F2:2 F2:1 F2 F3:2 F2:1 F2 A2:2 F2:2', mCb('G2', 'G3', 'D3'), mCb('A2', 'A3', 'E3'), 'B2:2 -:1 B2:2 -:1 B2:2 B2:2 -:1 B2:2 -:1 B2:2', 'B2:4 -:4 B2:1 C#3 D#3 E3 F#3 G3 A3 B3',
      '@g90', mBs('C3', 'C4', 'G3'), mBs('D3', 'D4', 'A3'), mBs('E3', 'E4', 'B3'), mBs('E3', 'E4', 'B3'), mBs('C3', 'C4', 'G3'), mBs('D3', 'D4', 'A3'), mBs('E3', 'E4', 'B3'), 'B2:3 B2:3 B2:2 B2:1 C#3 D#3 E3 F#3 G3 A3 B3'].join(' ') },
    { w: 'drum', v: .15, n: ['k:3 k:3 k:2 -:8  k:3 k:3 k:2 -:6 s:2  k:3 k:3 k:2 s:6 s:2  s:2 s s s s:1 s s s s s t t',
      rep(BAT.sinc, 3), BAT.cierre, rep(BAT.sinc, 3), 'k:3 k:3 s:2 s:6 s:1 s', rep(BAT.pesada, 6), BAT.paradas, BAT.vuelta, rep(BAT.galope, 7), 'k:3 s:3 k:2 s:1 s s s T T t t'].join(' ') },
  ] },
  // victorias: fanfarria (la cola del PULSO: 1·2·3 → 5) y luego un bucle para leer tranquilo la experiencia
  victoriaE: { bpm: 140, loop: 32, ch: [
    { w: 'p25', v: .16, vib: 1, n: 'C5:2 E5 G5 C6:4 G5:2 C6:4 D6:2 E6:10 -:4  @v13 E6:3 G6:3 E6:2 C6:4 -:2 G5:2  A5:3 C6:3 E6:2 A6:4 G6:2 E6:2  F6:3 E6:3 C6:2 D6:3 E6:3 G6:2  E6:6 C6:2 G5:4 -:4' },
    { w: 'p12', v: .1, n: ['@e0 E4:2 G4 C5 E5:4 C5:2 E5:4 G5:2 G5:10 -:4', '@e2 @v11', mSt('G4', 'C5', 'E5'), mSt('A4', 'C5', 'E5'), '-:2 A4:1 C5 -:2 F5:2 -:2 B4:1 D5 -:2 G5:2', '@e4 G4:2 C5 E5 C5 G4:4 -:4'].join(' ') },
    { w: 'tri', v: .23, n: ['C3:8 G2:8 C3:4 G2:4 C3:4 -:4', mBs('C3', 'C4', 'G3'), mBs('A2', 'A3', 'E3'), mH('F2', 'F3', 'C3'), mH('G2', 'G3', 'D3'), 'C3:3 C3:1 C4:2 G3:2 C3:4 -:4'].join(' ') },
    { w: 'drum', v: .11, n: 'k:4 s:2 s k:4 s:2 s k:2 k s:1 s s s c:8 ' + rep(BAT.galope, 3) + ' k:2 h:1 h s:2 h:1 h s:2 s:2 -:4' },
  ] },
  victoriaL: { bpm: 120, loop: 32, ch: [
    { w: 'p25', v: .16, vib: 1, n: 'C6:6 G5:2 C6:2 D6 E6:4  G6:10 -:6 ' +
      '@v13 E6:6 C6:2 G5:4 C6:2 E6:2  D6:6 B5:2 G5:8  C6:6 A5:2 C6:2 D6 E6:4  F6:4 E6:2 C6:2 D6:3 G6:3 B6:2  C7:6 G6:2 E6:4 G6:4  G#6:4 E6:2 B5:2 D6:6 E6:2  F6:4 A6:2 C7:2 Ab6:4 F6:2 Ab6:2  G6:10 -:2 G5:2 B5:2' },
    { w: 'p12', v: .1, n: ['@e0 E5:6 E5:2 E5:2 G5 C6:4  E6:10 -:6', '@e4 @v10', mBr('G4', 'C5', 'E5', 'G5'), mBr('G4', 'B4', 'D5', 'G5'), mBr('A4', 'C5', 'E5', 'A5'), 'A4:2 C5 F5 C5 B4:2 D5 G5 D5', mBr('G4', 'C5', 'E5', 'G5'), mBr('G#4', 'B4', 'D5', 'E5'), 'A4:2 C5 F5 C5 Ab4:2 C5 F5 C5', 'B4:2 D5 G5 B5 D6:4 -:4'].join(' ') },
    { w: 'tri', v: .23, n: ['C3:6 C3:2 C3:2 C3 C3:4  C3:2 G2 C3 G2 C3:2 -:6', mTb('C3', 'G3', 'C4'), mTb('B2', 'G3', 'B3'), mTb('A2', 'E3', 'A3'), 'F2:4 C3:4 G2:4 D3:4', mTb('C3', 'G3', 'C4'), mTb('E2', 'B2', 'E3'), 'F2:4 C3:4 F2:4 Ab2:4', 'G2:6 D3:2 G3:4 G2:2 B2:2'].join(' ') },
    { w: 'drum', v: .11, n: 'k:6 s:2 k:2 s s:1 s s s  c:10 -:6 ' + rep('k:4 h:2 h s:4 h:2 h', 7) + ' k:4 h:2 h s:2 s s:1 s s s' },
  ] },
  // RUTA 2 — Re mayor. El PULSO del revés (3·2·1 → 5): la misma ruta, pero ya sabes andar
  ruta2: { bpm: 132, ch: [
    { w: 'p25', v: .15, vib: 1, n: 'F#5:3 E5:3 D5:2 A5:6 F#5:2  E5:3 D5:3 C#5:2 A5:6 -:2  D5:3 F#5:3 B5:6 A5:2 F#5:2  G5:4 B5:2 D6:2 C#6:3 A5:3 E5:2  F#5:3 E5:3 D5:2 A5:4 D6:2 F#6:2  E6:6 C#6:2 A#5:4 C#6:2 E6:2  D6:3 B5:3 F#5:2 B5:3 G5:3 D5:2  E5:6 A5:2 C#6:4 -:2 A5:2 ' +
      '@d50 B5:6 G5:2 D5:2 G5 B5 D6  A5:6 F#5:2 D5:6 -:2  G5:6 E5:2 B4:2 E5 G5 B5  A5:4 C#6:2 E6:6 -:2 A5:2  @d25 D6:6 B5:2 G5:2 B5 D6 G6  F#6:6 D6:2 A5:4 D6:2 F#6:2  E6:3 G6:3 E6:2 C6:3 E6:3 G6:2  E6:8 -:2 A5:2 G5:2 E5:2' },
    { w: 'p12', v: .09, n: ['@e2 @v11', mGal('A3', 'D4', 'F#4'), mGal('A3', 'D4', 'F#4'), mGal('A3', 'C#4', 'E4'), mGal('A3', 'C#4', 'E4'), mGal('B3', 'D4', 'F#4'), mGal('B3', 'D4', 'F#4'), mGal('B3', 'D4', 'G4'), mGal('A3', 'C#4', 'E4'),
      mGal('A3', 'D4', 'F#4'), mGal('A3', 'D4', 'F#4'), mGal('A#3', 'C#4', 'E4'), mGal('A#3', 'C#4', 'E4'), mGal('B3', 'D4', 'F#4'), mGal('B3', 'D4', 'G4'), '@e4 A4:2 C#5 E5 A5 C#6:4 -:4',
      '@e0 @v8 G5:6 D5:2 B4:2 D5 G5 B5  F#5:6 D5:2 A4:6 -:2  E5:6 B4:2 G4:2 B4 E5 G5  E5:4 A5:2 C#6:6 -:4',
      '@e2 @v11', mGal('B3', 'D4', 'G4'), mGal('B3', 'D4', 'G4'), mGal('A3', 'D4', 'F#4'), mGal('A3', 'D4', 'F#4'), mGal('C4', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), '@e4 A3:2 C#4 E4 A4 C#5:4 -:4'].join(' ') },
    { w: 'tri', v: .22, n: [mBs('D3', 'D4', 'A3'), mBs('C#3', 'C#4', 'A3'), mBs('B2', 'B3', 'F#3'), mH('G2', 'G3', 'D3'), mH('A2', 'A3', 'E3'), mBs('D3', 'D4', 'A3'), mBs('F#2', 'F#3', 'C#3'), mH('B2', 'B3', 'F#3'), mH('G2', 'G3', 'D3'), 'A2:3 A2:1 A3:2 E3:2 A2:2 B2:2 C#3:2 E3:2',
      mBs('G2', 'G3', 'D3'), mBs('F#2', 'F#3', 'D3'), mBs('E2', 'E3', 'B2'), mBs('A2', 'A3', 'E3'), mBs('G2', 'G3', 'D3'), mBs('F#2', 'F#3', 'D3'), mBs('C3', 'C4', 'G3'), 'A2:3 A2:1 A3:2 E3:2 A2:2 A2:2 B2:2 C#3:2'].join(' ') },
    { w: 'drum', v: .12, n: rep(rep(BAT.galope, 7) + ' ' + BAT.redoble, 2) },
  ] },
  // CENTRAL APAGADA — La menor. APAGÓN despacio y con eco sobre el latido del bombo: la Central sigue viva, pero a oscuras
  central: { bpm: 96, ch: [
    { w: 'p25', v: .12, vib: 1, eco: { t: 6, v: .4 }, n: '-:4 A5:3 Bb5:3 A5:6  Eb6:8 D6:6 -:2  -:4 A5:3 Bb5:3 A5:2 C6:2 E6:2  Eb6:4 D6:4 B5:6 -:2  -:4 C6:3 Db6:3 C6:6  F#6:8 F6:6 -:2  E6:4 D6:2 C6:2 B5:4 A5:2 G#5:2  A5:12 -:4' },
    { w: 'p12', v: .07, n: ['@e3 @v9', arp('A4', 'C5', 'E5'), arp('A4', 'C5', 'E5'), arp('A4', 'C5', 'E5'), arp('G#4', 'B4', 'E5'), arp('A4', 'C5', 'F5'), arp('A4', 'C5', 'F5'), arp('G#4', 'B4', 'E5'), arp('A4', 'C5', 'E5')].join(' ') },
    { w: 'tri', v: .24, n: ['A2', 'A2', 'A2', 'E2', 'F2', 'F2', 'E2', 'A2'].map(r => `${r}:3 ${r}:5 -:8`).join(' ') },
    { w: 'drum', v: .11, n: rep('k:3 k:5 -:8', 8) },
  ] },
  // PUEBLO — Fa mayor, tranquilo. A A' B; el iv menor (Sib menor) del compás 14 es la punzada de nostalgia
  pueblo: { bpm: 104, ch: [
    { w: 'p25', v: .15, vib: 1, n: '@v13 C5:4 F5:2 A5:6 G5:2 F5:2  G5:6 E5:2 C5:8  D5:4 F5:2 A5:6 Bb5:2 A5:2  F5:10 -:2 C5:2 F5:2  D6:6 C6:2 Bb5:4 F5:2 Bb5:2  A5:6 G5:2 F5:4 C5:4  Bb5:4 A5:2 G5:2 F5:4 D5:2 F5:2  G5:10 -:6 ' +
      'C5:4 F5:2 A5:6 G5:2 F5:2  G5:6 E5:2 C5:4 E5:2 G5:2  A5:4 F5:2 D5:6 F5:2 A5:2  C6:10 -:2 A5:2 C6:2  @v15 D6:6 C6:2 Bb5:4 D6:4  Db6:6 C6:2 Bb5:4 F5:4  A5:4 C6:2 F6:2 E6:3 D6:3 Bb5:2  A5:2 G5:2 F5:8 -:2 A5:2 ' +
      '@d12 Bb5:2 D6 F6:4 D6:2 Bb5 F5 Bb5  C6:2 E6 G6:4 E6:2 C6 G5 C6  A5:2 C6 E6:6 D6:2 C6:2 A5:2  D6:4 A5:2 F5:2 A5:6 -:2  Bb5:2 D6 F6:4 G6:2 F6 D6 Bb5  C6:2 E6 G6:4 A6:2 G6 E6 C6  @d25 A6:6 F6:2 C6:4 F6:4  @v13 E6:4 D6:2 C6:2 Bb5:4 G5:2 E5:2' },
    { w: 'p12', v: .09, n: ['@e4 @v11', mBr('A3', 'C4', 'F4', 'A4'), mBr('G3', 'C4', 'E4', 'G4'), mBr('A3', 'D4', 'F4', 'A4'), 'A4:2 C5 F5 A5 G5 F5 C5:4', mBr('Bb3', 'D4', 'F4', 'Bb4'), mBr('A3', 'C4', 'F4', 'A4'), mBr('Bb3', 'D4', 'F4', 'G4'), 'Bb3:2 C4 E4 G4 Bb4:2 G4:2 E4:2 C4:2',
      mBr('A3', 'C4', 'F4', 'A4'), mBr('G3', 'C4', 'E4', 'G4'), mBr('A3', 'D4', 'F4', 'A4'), 'A4:2 C5 F5 C5 A4:4 -:4', mBr('Bb3', 'D4', 'F4', 'Bb4'), mBr('Bb3', 'Db4', 'F4', 'Bb4'), 'A3:2 C4 F4 C4 Bb3:2 C4 E4 G4', 'A3:2 C4 F4 A4 C5:4 -:4',
      '@e0 @v7 D5:8 F5:8  E5:8 G5:8  C5:8 E5:8  F5:8 D5:4 F5:4  D5:8 F5:8  E5:8 G5:8  @e4 @v11 F5:2 A5 C6 A5 F5 A5 C6 A5  @e0 @v7 G4:8 Bb4:4 G4:4'].join(' ') },
    { w: 'tri', v: .2, n: [mTb('F2', 'C3', 'F3'), mTb('E2', 'C3', 'E3'), mTb('D2', 'A2', 'D3'), mTb('C3', 'F3', 'A3'), mTb('Bb2', 'F3', 'Bb3'), mTb('A2', 'C3', 'F3'), mTb('G2', 'D3', 'G3'), 'C3:6 G2:2 C3:4 D3:2 E3:2',
      mTb('F2', 'C3', 'F3'), mTb('E2', 'C3', 'E3'), mTb('D2', 'A2', 'D3'), mTb('C3', 'F3', 'A3'), mTb('Bb2', 'F3', 'Bb3'), mTb('Bb2', 'F3', 'Bb3'), 'C3:6 C3:2 C3:4 C2:4', 'F2:6 C3:2 F3:4 A2:4',
      mWb('Bb2', 'F3', 'D3'), mWb('C3', 'G3', 'E3'), mWb('A2', 'E3', 'C3'), mWb('D3', 'A3', 'F3'), mWb('Bb2', 'F3', 'D3'), mWb('C3', 'G3', 'E3'), mWb('F2', 'C3', 'A2'), 'C3:4 G2:2 C3:2 E3:4 C3:2 E3:2'].join(' ') },
    { w: 'drum', v: .07, n: rep('k:4 h:4 g:4 h:2 h:2', 16) + ' ' + rep('k:4 h:2 h g:4 h:2 h', 7) + ' k:4 h:2 h g:2 g g:1 g g g' },
  ] },
  // RUTA — Sol mayor, marcha con galope. Recoge el motivo del título en mayor; la B se abre con Fa y Mib (bVII, bVI) y vuelve por Re sus4
  ruta: { bpm: 138, loop: 32, ch: [
    { w: 'p25', v: .16, vib: 1, n: 'G5:2 G5:1 G5 B5:2 D6 G6:6 -:2  F#6:2 F#6:1 F#6 E6:2 D6 A5:2 D5:2 E5 F#5 ' +
      '@d25 G5:6 D5:2 G5:2 A5 B5:4  A5:6 F#5:2 D5:4 -:2 F#5:2  G5:6 E5:2 G5:2 A5 B5:4  C6:4 B5:2 A5 F#5:3 A5:3 D6:2  B5:6 D6:2 G6:6 F#6:2  D#6:4 B5:2 F#5:2 A5:6 B5:2  G5:3 B5:3 E6:2 E6:3 D6:3 C6:2  D6:8 -:2 D5:2 E5 F#5 ' +
      'G5:6 D5:2 G5:2 A5 B5:4  A5:6 F#5:2 D5:4 -:2 F#5:2  G5:6 E5:2 G5:2 A5 B5:4  C6:4 B5:2 A5 F#5:3 A5:3 D6:2  E6:6 C6:2 G5:4 C6:2 E6  D6:6 B5:2 G5:4 B5:2 D6  C6:3 B5:3 A5:2 F#5:2 A5 C6 F#6  G6:10 -:2 G5:2 A5 ' +
      '@d50 A5:4 C6:2 F6:6 E6:2 C6:2  D6:2 C6 A5 F5:6 -:2 A5:2  B5:4 D6:2 G6:6 F#6:2 D6:2  E6:2 D6 B5 G5:6 -:2 B5:2  Bb5:4 Eb6:2 G6:6 F6:2 Eb6:2  F6:4 A6:2 G6:2 F6:4 C6:2 F6:2  @d25 G6:6 A6:2 G6:8  F#6:8 -:2 D5:2 E5 F#5' },
    { w: 'p12', v: .09, n: ['@e0 @v10 B4:2 B4:1 B4 D5:2 G5 B5:6 -:2  A5:2 A5:1 A5 G5:2 F#5 D5:2 -:6',
      '@e2 @v11', mGal('B3', 'D4', 'G4'), mGal('B3', 'D4', 'G4'), mGal('A3', 'D4', 'F#4'), mGal('A3', 'D4', 'F#4'), mGal('B3', 'E4', 'G4'), mGal('B3', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('A3', 'D4', 'F#4'),
      mGal('B3', 'D4', 'G4'), mGal('B3', 'D4', 'G4'), mGal('A3', 'D#4', 'F#4'), mGal('A3', 'D#4', 'F#4'), mGal('B3', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), '@e4 G4:2 A4 D5 G5 F#5:4 -:4',
      '@e2', mGal('B3', 'D4', 'G4'), mGal('B3', 'D4', 'G4'), mGal('A3', 'D4', 'F#4'), mGal('A3', 'D4', 'F#4'), mGal('B3', 'E4', 'G4'), mGal('B3', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('A3', 'D4', 'F#4'),
      mGal('C4', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('B3', 'D4', 'G4'), mGal('B3', 'D4', 'G4'), mGal('C4', 'E4', 'A4'), mGal('C4', 'D4', 'F#4'), '@e4 B4:2 D5 G5 B5 D6:4 -:4',
      '@e0 @v8 F5:4 A5:2 C6:6 C6:2 A5:2  Bb5:2 A5 F5 C5:6 -:2 F5:2  G5:4 B5:2 D6:6 D6:2 B5:2  C6:2 B5 G5 D5:6 -:2 G5:2  G5:4 Bb5:2 Eb6:6 D6:2 Bb5:2  C6:4 F6:2 E6:2 C6:4 A5:2 C6:2  @e3 @v11 D5:2 G5 A5 D6 A5 G5 D5 G5  D5:2 F#5 A5 D6 A5:4 -:4'].join(' ') },
    { w: 'tri', v: .22, n: ['G2:2 G2:1 G2 G2:2 G2 G2:6 -:2  D3:2 D3:1 D3 D3:2 D3 D3:2 D2:2 E2 F#2',
      mBs('G2', 'G3', 'D3'), mBs('F#2', 'F#3', 'D3'), mBs('E2', 'E3', 'B2'), mH('C3', 'C4', 'G3'), mH('D3', 'D4', 'A3'), mBs('G2', 'G3', 'D3'), mBs('B2', 'B3', 'F#3'), mH('E2', 'E3', 'B2'), mH('C3', 'C4', 'G3'), 'D3:3 D3:1 D4:2 D3:2 A2:2 D3:2 E3:2 F#3:2',
      mBs('G2', 'G3', 'D3'), mBs('F#2', 'F#3', 'D3'), mBs('E2', 'E3', 'B2'), mH('C3', 'C4', 'G3'), mH('D3', 'D4', 'A3'), mBs('C3', 'C4', 'G3'), mBs('B2', 'B3', 'G3'), mH('A2', 'A3', 'E3'), mH('D3', 'D4', 'A3'), 'G2:3 G2:1 G3:2 D3:2 G2:4 G3:2 G2:2',
      'F2:6 F2:2 C3:4 F3:2 C3:2  F2:6 F2:2 A2:4 C3:4  G2:6 G2:2 D3:4 G3:2 D3:2  G2:6 G2:2 B2:4 D3:4  Eb2:6 Eb2:2 Bb2:4 Eb3:2 Bb2:2  F2:6 F2:2 C3:4 F3:2 C3:2  D3:2 D3 D3 D3 D3 D3 D3 D3  D3:2 D3 D3 D3 D3:2 D2:2 E2 F#2'].join(' ') },
    { w: 'drum', v: .12, n: ['s:1 s s s s:2 s:2 s:1 s s s s:2 s:2  k:4 s:4 s:2 s s:1 s s s',
      rep('k:2 h:1 h s:2 h:1 h k:1 k h:2 s:2 h:1 h', 7), 'k:2 h:1 h s:2 h:1 h s:1 s s:2 s:1 s t t',
      rep('k:2 h:1 h s:2 h:1 h k:1 k h:2 s:2 h:1 h', 7), 'k:2 h:1 h s:2 h:1 h s:1 s s:2 s:1 s t t',
      rep('k:4 h:2 h s:4 h:2 h:1 h', 6), 'k:2 h s h k h s h', 'k:2 s s:1 s s:2 s:1 s s s t:2 t'].join(' ') },
  ] },
  // COMBATE — La menor, rápido. Intro con trino y el bII (Sib) de tensión. El ritmo manda: notas largas ligadas contra carrerillas de semicorcheas,
  // silencios, golpes a contratiempo y un compás de paradas (todos a una) antes de volver; la B cae en la napolitana (Sib) antes del Mi
  combate: { bpm: 172, loop: 64, ch: [
    { w: 'p25', v: .16, vib: 1, n: [mTr('A5', 'G#5', 'E5'), mTr('Bb5', 'A5', 'F5'), mTr('C6', 'B5', 'A5'), 'C6:2 B5 A5 G#5 E5:2 G#5 B5 E6',
      'A5:3 C6:3 E6:8 D6:1 C6:1  B5:2 -:1 A5:3 -:2 E5:1 A5 B5 C6 D6:2 E6:2  F6:6 E6:2 C6:3 A5:3 C6:2  D6:2 -:1 B5:3 -:2 G5:1 B5 D6 G6 F6:2 D6:2',
      'E6:3 A6:3 G6:6 E6:2 C6:2  D6:1 E6 D6 C6 A5:4 -:2 A5:1 C6 E6:2 A6:2  A6:6 F6:2 C6:3 E6:3 F6:2  B5:3 E6:3 G#6:6 -:2 A5:1 C#6:1',
      'D6:6 F6:2 A6:6 G6:1 F6:1  G6:4 D6:2 B5:2 -:2 B5:1 D6 G6:2 B6:2  E6:6 G6:2 C7:6 B6:1 A6:1  A6:4 F6:2 C6:2 -:2 A5:1 C6 F6:2 E6:2',
      'D6:3 F6:3 A6:4 F6:2 D6:2 A5:2  Bb5:3 D6:3 F6:4 Bb6:2 A6:2 F6:2  @g60 E6:2 -:1 E6:2 -:1 E6:2 G#6:2 -:1 G#6:2 -:1 B6:2  @g85 B6:4 -:4 E6:1 F6 G#6 A6 B6 C7 D7 E7'].join(' ') },
    { w: 'p12', v: .09, n: ['@e0 @v9 -:16', mTr('F5', 'E5', 'D5'), mTr('A5', 'G#5', 'E5'), 'E5:2 E5 E5 E5 B4:2 E5 G#5 B5',
      '@e2 @v12', mSt('C5', 'E5', 'A5'), mSt('C5', 'E5', 'A5'), mSt('C5', 'F5', 'A5'), mSt('B4', 'D5', 'G5'), '@e1', m16('A4', 'C5', 'E5'), m16('A4', 'C5', 'E5'), m16('A4', 'C5', 'F5'), '@e0 @v9 G#5:3 B5:3 E6:6 -:4',
      '@v8 F5:6 A5:2 D6:8  B5:4 G5:2 D5:2 -:2 D5:1 G5 B5:2 D6:2  C6:6 E6:2 G6:8  F6:4 C6:2 A5:2 -:2 F5:1 A5 C6:2 C6:2', '@e1 @v12', m16('A4', 'D5', 'F5'), m16('Bb4', 'D5', 'F5'),
      '@e0 @v9 @g60 G#5:2 -:1 G#5:2 -:1 G#5:2 B5:2 -:1 B5:2 -:1 E6:2  @g85 G#6:4 -:4 G#5:1 A5 B5 C6 D6 E6 F6 G#6'].join(' ') },
    { w: 'tri', v: .24, n: [rep('A2:2', 8), rep('Bb2:2', 8), rep('A2:2', 8), 'E2:2 E2 E2 E2 E2:2 E2 E3 E2',
      '@g75', mCb('A2', 'A3', 'E3'), mCb('A2', 'A3', 'G2'), mCb('F2', 'F3', 'C3'), mCb('G2', 'G3', 'G#2'), mCb('A2', 'A3', 'E3'), 'A2:2 A2:1 A2 A2:2 A2:1 A2 A3:2 A2:1 A2 G2:2 E2:2', mCb('F2', 'F3', 'F2'), 'E2:3 E2:3 E3:6 -:2 A2:1 C#3:1',
      mCb('D3', 'D4', 'A2'), mCb('G2', 'G3', 'B2'), mCb('C3', 'C4', 'E3'), mCb('F2', 'F3', 'C3'), 'D3:2 D3:1 D3 D3:2 D3:1 D3 D4:2 D3:1 D3 C3:2 A2:2', 'Bb2:2 Bb2:1 Bb2 Bb2:2 Bb2:1 Bb2 Bb3:2 Bb2:1 Bb2 F2:2 F2:2',
      'E2:2 -:1 E2:2 -:1 E2:2 E2:2 -:1 E2:2 -:1 E2:2  E2:4 -:4 E2:1 F2 G#2 A2 B2 C3 D3 E3'].join(' ') },
    { w: 'drum', v: .14, n: ['k:4 -:4 k:4 -:4  k:4 -:4 k:4 s:2 s  k:2 s k s k s k s  s:2 s s s s:1 s s s s s t t',
      rep('k:3 k:1 s:2 h:1 k:1 h:1 k:1 k:2 s:2 h:1 h:1', 3), 'k:3 k:1 s:2 h:2 k:2 s:1 s s:2 s:1 s', rep('k:3 k:1 s:2 h:1 k:1 h:1 k:1 k:2 s:2 h:1 h:1', 3), 'k:3 k:3 s:6 -:2 s:1 s',
      rep('k:2 h:1 h s:2 h:1 k k:2 h:1 h s:2 o:2', 4), rep('k:1 k h:2 s:2 k:1 k h:1 k h:2 s:2 h:1 s', 2), 'k:2 -:1 s:2 -:1 k:2 k:2 -:1 s:2 -:1 k:2', 'c:4 -:4 s:1 s s s T T t t'].join(' ') },
  ] },
  // TÍTULO — Re menor. Presenta el motivo del juego (1–5–1·2·3); la B se aclara a Fa mayor y cierra en Re mayor (tercera de Picardía)
  titulo: { bpm: 96, ch: [
    { w: 'p25', v: .15, vib: 1, n: '@v12 D5:6 A4:2 D5:2 E5 F5:4  G5:6 F5:2 D5:8  E5:6 C5:2 E5:2 F5 G5:4  A5:6 G5:2 E5:8  @v14 F5:6 D5:2 F5:2 G5 A5:4  Bb5:6 A5:2 F5:4 D5:4  G5:4 Bb5:2 D6:6 C6:2 Bb5:2  A5:6 C#6:2 E6:8 ' +
      '@v15 F6:6 C6:2 A5:4 C6:2 F6:2  E6:6 C6:2 G5:8  D6:6 A5:2 F5:4 A5:2 D6:2  D6:4 C6:2 Bb5:2 F5:8  A5:6 C6:2 F6:6 A6:2  G6:6 E6:2 C6:4 E6:4  D6:4 Bb5:2 G5:2 A5:3 C#6:3 E6:2  D6:12 -:4' },
    { w: 'p12', v: .09, n: ['@e4 @v10', mBr('A3', 'D4', 'F4', 'A4'), mBr('Bb3', 'D4', 'F4', 'Bb4'), mBr('G3', 'C4', 'E4', 'G4'), mBr('A3', 'C4', 'E4', 'A4'), mBr('A3', 'D4', 'F4', 'A4'), mBr('Bb3', 'D4', 'F4', 'Bb4'), mBr('Bb3', 'D4', 'G4', 'Bb4'), mBr('A3', 'C#4', 'E4', 'G4'),
      '@v12', mBr('A3', 'C4', 'F4', 'A4'), mBr('G3', 'C4', 'E4', 'G4'), mBr('A3', 'D4', 'F4', 'A4'), mBr('Bb3', 'D4', 'F4', 'Bb4'), mBr('A3', 'C4', 'F4', 'A4'), mBr('G3', 'C4', 'E4', 'G4'), 'Bb3:2 D4 G4 D4 A3:2 C#4 E4 G4', 'A3:2 D4 F#4 A4 D5 A4 F#4 D4'].join(' ') },
    { w: 'tri', v: .23, n: [mTb('D2', 'A2', 'D3'), mTb('Bb2', 'F3', 'Bb3'), mTb('C3', 'G3', 'C4'), mTb('A2', 'E3', 'A3'), mTb('D2', 'A2', 'D3'), mTb('Bb2', 'F3', 'Bb3'), mTb('G2', 'D3', 'G3'), 'A2:6 E3:2 A3:4 C#3:4',
      mTb('F2', 'C3', 'F3'), mTb('E2', 'C3', 'E3'), mTb('D2', 'A2', 'D3'), mTb('Bb2', 'F3', 'Bb3'), mTb('F2', 'C3', 'F3'), mTb('E2', 'C3', 'E3'), 'G2:4 D3:4 A2:4 E3:4', 'D2:6 A2:2 D3:4 A2:4'].join(' ') },
    { w: 'drum', v: .1, n: rep('k:8 -:4 k:2 k', 8) + ' ' + rep('k:4 h:2 h g:4 h:2 h', 7) + ' k:4 h:2 h s:2 s s:1 s s s' },
  ] },
  victoria: { bpm: 150, loop: 32, ch: [
    { w: 'p25', v: .16, vib: 1, n: 'G5:2 G5:1 G5 A5:2 B5:2 D6:4 B5:2 D6:2 G6:8 -:8  @v13 B5:3 D6:3 G6:2 -:2 D6:2 B5:2 G5:2  C6:3 E6:3 G6:2 -:2 E6:2 C6:2 E6:2  A5:2 C6 E6:4 F#6:2 E6 D6:4  G6:6 D6:2 B5:4 -:4' },
    { w: 'p12', v: .1, n: ['@e0 B4:2 B4:1 B4 C5:2 D5:2 G5:4 G5:2 B5:2 D6:8 -:8', '@e2 @v11', mGal('B3', 'D4', 'G4'), mGal('B3', 'D4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('C4', 'E4', 'G4'), mGal('C4', 'E4', 'A4'), mGal('C4', 'D4', 'F#4'), '@e4 B4:2 D5 G5 D5 B4:4 -:4'].join(' ') },
    { w: 'tri', v: .24, n: ['G2:4 G2:2 G2 D3:4 D3:2 D3 G2:2 D3 G3:4 -:8', mBs('G2', 'G3', 'D3'), mBs('C3', 'C4', 'G3'), mH('A2', 'A3', 'E3'), mH('D3', 'D4', 'A3'), 'G2:3 G2:1 G3:2 D3:2 G2:4 -:4'].join(' ') },
    { w: 'drum', v: .11, n: 'k:4 k:2 k s:4 s:2 s k:2 s s:1 s s s c:8 ' + rep(BAT.galope, 3) + ' k:2 h:1 h s:2 h:1 h s:2 s:2 -:4' },
  ] },
  // sintonías: todas salen del PULSO. acople = el motivo entero; objeto = 5·1·2·3 → 5; carga = dos latidos y sube; reforja = el motivo y un salto por Sib
  acople: { bpm: 160, once: true, ch: [
    { w: 'p25', v: .16, vib: 1, n: 'C5:2 G4:1 G4 C5:2 D5 E5:2 G5:2 C6:6 -:2' }, { w: 'p12', v: .1, env: 0, n: 'E4:2 E4:1 E4 G4:2 B4 C5:2 E5:2 G5:6 -:2' }, { w: 'tri', v: .24, n: 'C3:4 C3:2 G2 C3:2 G2:2 C3:6 -:2' },
    { w: 'drum', v: .1, n: 'k:4 k:2 k s:2 s:2 c:6 -:2' },
  ] },
  carga: { bpm: 140, once: true, ch: [
    { w: 'p25', v: .15, vib: 1, n: 'B4:1 E5:3 B4:1 E5:3 G#5:2 B5:2 E6:6 -:2' }, { w: 'p12', v: .1, env: 0, n: 'G#4:1 B4:3 G#4:1 B4:3 E5:2 G#5:2 B5:6 -:2' }, { w: 'tri', v: .22, n: 'E2:4 E2:4 B2:4 E3:6 -:2' },
  ] },
  objeto: { bpm: 160, once: true, ch: [{ w: 'p25', v: .15, vib: 1, n: 'E5:2 A5:2 B5:2 C#6:2 E6:6 -:2' }, { w: 'p12', v: .1, env: 0, n: 'C#5:2 E5:2 G#5:2 A5:2 C#6:6 -:2' }, { w: 'tri', v: .22, n: 'A2:4 E3:4 A3:6 -:2' }] },
  reforja: { bpm: 150, once: true, ch: [
    { w: 'p25', v: .16, vib: 1, n: 'C5:6 G4:2 C5:2 D5 E5:4  Bb5:2 Bb5:1 Bb5 D6:2 F6 G6:8 -:4' },
    { w: 'p12', v: .1, env: 0, n: 'E4:6 E4:2 E4:2 G4 C5:4  D5:2 D5:1 D5 F5:2 Bb5 E6:8 -:4' },
    { w: 'tri', v: .24, n: 'C3:6 C3:2 C3:4 G2:4  Bb2:8 C3:8 -:4' },
    { w: 'drum', v: .11, n: 'k:6 k:2 s:2 s s:1 s s s  k:2 s:1 s s:2 s c:8 -:4' },
  ] },
};
function parseCh(c, i = 0) {
  const pulso = /^p/.test(c.w), out = []; let len = 4;
  let s = { w: c.w, vol: 15, env: c.env ?? (pulso && i === 1 ? 3 : 0), gate: c.gate ?? (pulso ? .85 : .95) };
  for (const tok of c.n.trim().split(/\s+/)) {
    if (tok[0] === '@') { const k = tok[1], x = tok.slice(2); s = { ...s }; if (k === 'd') s.w = 'p' + x; else if (k === 'w') s.w = x; else if (k === 'v') s.vol = +x; else if (k === 'e') s.env = +x; else if (k === 'g') s.gate = x / 100; continue; }
    const [n, l] = tok.split(':'); if (l) len = +l;
    if (n === '^' && out.length) out[out.length - 1][1] += len; else out.push([n, len, s]);
  }
  return out;
}
// cada canal sale por su sitio en el estéreo; la voz principal lleva un eco al otro lado
function canal(c, i, unit, gn) {
  const out = AC.createGain(), pulso = /^p/.test(c.w);
  const sal = (src, pan) => { if (pan && AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = pan; src.connect(p); p.connect(gn); } else src.connect(gn); };
  const pan = c.pan ?? (!pulso ? 0 : i === 0 ? -.12 : .32); sal(out, pan);
  const eco = c.eco ?? (pulso && i === 0 ? { t: 3, v: .3 } : null);
  if (eco) { const dl = AC.createDelay(1), eg = AC.createGain(); dl.delayTime.value = Math.min(.95, eco.t * unit); eg.gain.value = eco.v; out.connect(dl); dl.connect(eg); sal(eg, eco.pan ?? .45); }
  return { c, out, seq: parseCh(c, i), i: 0, t: AC.currentTime + .06, done: false };
}
let cur = null, pendingSong = null, curName = '', musF0 = 0;
// cuántos pulsos (negras) lleva la canción que suena: por el reloj del audio y, si no hay audio, por fotogramas
function pulsos() { const tf = (frame - musF0) / 60, ta = cur && AC && AC.state === 'running' ? Math.min(AC.currentTime - cur.t0, tf + .4) : tf; return Math.max(0, ta) * ((SONGS[curName] || {}).bpm || 120) / 60; }
async function alPulso(n) { while (pulsos() < n) await wait(1); }
function music(name) {
  if (name === curName && cur) return; curName = name; musF0 = frame;
  if (!AC) { pendingSong = name; return; }
  stopMusic(); if (!name) return;
  const song = SONGS[name], unit = 60 / song.bpm / 4, gn = AC.createGain(); gn.gain.value = 1; gn.connect(musicG);
  const st = { gn, timer: 0, t0: AC.currentTime + .06, chs: song.ch.map((c, i) => canal(c, i, unit, gn)) };
  st.sched = (lim = AC.currentTime + .25) => {
    for (const ch of st.chs) {
      while (!ch.done && ch.t < lim) {
        const [n, l, s] = ch.seq[ch.i], d = l * unit;
        if (n !== '-') { if (ch.c.w === 'drum') golpe(n, ch.t, ch.c.v, ch.out); else nota(ch, s, hz(n), ch.t, d); }
        ch.t += d; ch.i++;
        if (ch.i >= ch.seq.length) { if (song.once) ch.done = true; else { ch.i = 0; if (song.loop) { let u = 0; while (u < song.loop) u += ch.seq[ch.i++][1]; } } }
      }
    }
  };
  st.sched(); st.timer = setInterval(() => st.sched(), 60); cur = st;
}
function stopMusic() { if (!cur) return; clearInterval(cur.timer); const gn = cur.gn; try { gn.gain.setValueAtTime(1, AC.currentTime); gn.gain.linearRampToValueAtTime(0, AC.currentTime + .15); } catch (e) { } setTimeout(() => gn.disconnect(), 400); cur = null; }
const songFrames = name => { const s = SONGS[name]; return Math.ceil(parseCh(s.ch[0]).reduce((a, n) => a + n[1], 0) * 60 / s.bpm / 4 * 60); };
// fanfarria: corta la música, suena y devuelve cuántos fotogramas dura
function jingle(name) { music(name); return songFrames(name) - 16; }

// ── efectos ──
const S = f => (...a) => { if (!AC || muted) return; try { f(AC.currentTime, ...a); } catch (e) { } };
// nota de chip para efectos, con los mismos escalones de volumen que la música
const pi = (n, t, d, v = .1, w = 'p25', env = 2) => nota({ c: { v }, out: sfxG }, { w, vol: 15, env, gate: 1 }, typeof n === 'string' ? hz(n) : n, t, d);
// la interfaz habla con las notas del PULSO en Sol (Sol–Re–La–Si): aceptar sube de Re a Sol, cancelar baja, guardar es el motivo entero
const sfx = {
  blip: S((t, v = 0) => osc('p25', 620 + v * 90 + Math.random() * 30, t, .028, .05, sfxG, { sus: 1 })),
  move: S(t => pi('D6', t, .04, .07, 'p25', 1)),
  sel: S(t => { pi('D6', t, .05, .09, 'p25', 0); pi('G6', t + .05, .1, .09); }),
  back: S(t => { pi('G5', t, .05, .08, 'p25', 0); pi('D5', t + .05, .1, .08); }),
  bump: S(t => osc('p50', [130, 90], t, .09, .12, sfxG)),
  step: S(t => noise(t, .03, .02, sfxG, { f: 2500 })),
  grass: S(t => { noise(t, .09, .07, sfxG, { f: [5000, 2500], type: 'bandpass', q: 2 }); }),
  hop: S(t => osc('p25', [330, 660], t, .14, .09, sfxG)),
  land: S(t => { noise(t, .07, .1, sfxG, { f: 900, type: 'lowpass' }); osc('sin', [120, 60], t, .08, .15, sfxG); }),
  door: S(t => { pi('G4', t, .08, .08, 'p50', 0); pi('D5', t + .08, .14, .08, 'p50', 3); }),
  excl: S(t => { osc('p25', [800, 1600], t, .08, .12, sfxG); osc('p25', 1600, t + .09, .12, .12, sfxG); }),
  save: S(t => [['G5', 0, .09], ['D5', .09, .05], ['G5', .14, .05], ['A5', .19, .05], ['B5', .24, .08], ['D6', .32, .3]].forEach(([n, d, l]) => { pi(n, t + d, l, .09, 'p50', l > .1 ? 4 : 0); })),
  hit: S((t, k = 1) => { noise(t, .1 + .05 * k, .22, sfxG, { f: [1800 / k, 300], type: 'lowpass' }); osc('p50', [200 / k, 60], t, .12, .16, sfxG, { sus: 1 }); }),
  crit: S(t => { noise(t, .22, .3, sfxG, { f: [4000, 200], type: 'lowpass' }); osc('saw', [900, 80], t, .2, .14, sfxG, { sus: 1 }); }),
  weak: S(t => { noise(t, .07, .12, sfxG, { f: 500, type: 'lowpass' }); }),
  lunge: S(t => noise(t, .1, .08, sfxG, { f: [800, 4000], type: 'bandpass', q: 1.5 })),
  hpTick: S((t, f) => osc('p12', f, t, .03, .04, sfxG)),
  low: S(t => { pi('E6', t, .06, .07, 'p50', 0); pi('B5', t + .09, .12, .07, 'p50', 2); }),
  faint: S((t, base) => { osc('p25', [base, base * .3], t, .5, .14, sfxG, { sus: 1 }); noise(t + .35, .25, .12, sfxG, { f: [1200, 150], type: 'lowpass' }); }),
  cry: S((t, c, pm = 1) => { // c: [f0,f1,f2,dur,onda,trémolo]
    const [f0, f1, f2, d, w, tr] = c; osc(w || 'p25', [f0 * pm, f1 * pm, f2 * pm], t, d, .15, sfxG, { sus: .9, gate: .7 });
    osc('p12', [f0 * pm * 1.5, f1 * pm * 1.49, f2 * pm * 1.52], t + .02, d * .8, .06, sfxG);
    if (tr) for (let i = 0; i < d / .05; i++) noise(t + i * .05, .025, .05, sfxG, { f: tr }); }),
  throw: S(t => osc('p12', [400, 1400], t, .3, .07, sfxG)),
  clamp: S(t => { osc('p50', [1200, 200], t, .08, .16, sfxG); noise(t, .06, .2, sfxG, { f: 3000 }); }),
  suck: S(t => { osc('saw', [200, 2400], t, .45, .08, sfxG); noise(t, .45, .08, sfxG, { f: [500, 6000], type: 'bandpass', q: 3, swell: 1 }); }),
  tick: S((t, i) => { osc('p50', 440 * 2 ** (i * 4 / 12), t, .09, .13, sfxG); osc('sin', 110, t, .06, .12, sfxG); }),
  pop: S(t => { noise(t, .2, .25, sfxG, { f: [6000, 600], type: 'lowpass' }); osc('p25', [900, 200], t, .15, .1, sfxG); }),
  lock: S(t => { osc('p50', 1760, t, .05, .12, sfxG); osc('p50', 2640, t + .05, .16, .12, sfxG); noise(t, .03, .15, sfxG, { f: 5000 }); }),
  xp: S((t, k) => osc('p12', 500 + k * 900, t, .035, .035, sfxG)),
  level: S(t => { ['G5', 'A5', 'B5', 'D6'].forEach((n, i) => pi(n, t + i * .06, .06, .12, 'p25', 0)); osc('p25', hz('G6'), t + .24, .36, .12, sfxG, { vib: 1 }); pi('B5', t + .24, .36, .07, 'p12', 5); }),
  statUp: S(t => ['G5', 'B5', 'D6', 'G6', 'B6'].forEach((n, i) => pi(n, t + i * .055, i === 4 ? .16 : .055, .09, 'p25', i === 4 ? 2 : 0))),
  statDown: S(t => ['G5', 'Eb5', 'C5', 'G4', 'Eb4'].forEach((n, i) => pi(n, t + i * .055, i === 4 ? .16 : .055, .09, 'p25', i === 4 ? 2 : 0))),
  heal: S(t => ['G5', 'A5', 'B5', 'D6', 'E6', 'G6'].forEach((n, i) => pi(n, t + i * .05, i === 5 ? .2 : .06, .07, 'p12', i === 5 ? 3 : 0))),
  thunder: S(t => { noise(t, 1.2, .4, sfxG, { f: [3000, 80], type: 'lowpass' }); osc('saw', [90, 30], t, .9, .2, sfxG, { sus: 1 }); }),
  spark: S(t => { for (let i = 0; i < 4; i++) osc('p12', rnd(1500, 4000), t + i * .025, .02, .06, sfxG); }),
  whoosh: S(t => noise(t, .35, .12, sfxG, { f: [300, 5000], type: 'bandpass', q: 1, swell: 1 })),
  wipe: S(t => { for (let i = 0; i < 10; i++) osc('p25', 300 + (i % 2) * 500 + i * 60, t + i * .055, .05, .09, sfxG); }),
  // ataques por tipo
  BRASA: S(t => { noise(t, .5, .2, sfxG, { f: [400, 3000], type: 'bandpass', q: .8 }); noise(t + .1, .4, .1, sfxG, { f: 5000, lo: 1 }); }),
  VAPOR: S(t => { noise(t, .5, .16, sfxG, { f: [7000, 2500], type: 'highpass' }); osc('sin', [1800, 2600], t, .4, .04, sfxG); }),
  CHISPA: S(t => { for (let i = 0; i < 10; i++) osc('p12', rnd(300, 3500), t + i * .035, .03, .1, sfxG); noise(t, .35, .1, sfxG, { f: 6000, lo: 1 }); }),
  MUSGO: S(t => { noise(t, .3, .12, sfxG, { f: [3500, 1200], type: 'bandpass', q: 2 }); [392, 494, 587].forEach((f, i) => osc('tri', f, t + i * .07, .12, .12, sfxG)); }),
  OXIDO: S(t => { noise(t, .45, .2, sfxG, { f: [900, 250], type: 'lowpass', lo: 1 }); osc('saw', [140, 70], t, .4, .08, sfxG, { sus: 1 }); }),
  IMAN: S(t => { for (let i = 0; i < 6; i++) osc('sin', [300 + i * 80, 600 + i * 80], t + i * .06, .09, .12, sfxG); }),
  CHAPA: S(t => noise(t, .1, .08, sfxG, { f: [800, 4000], type: 'bandpass', q: 1.5 })),
  onda: S(t => { for (let i = 0; i < 5; i++) osc('p25', [1200 - i * 60, 1500 - i * 60], t + i * .07, .06, .08, sfxG); }),
};
