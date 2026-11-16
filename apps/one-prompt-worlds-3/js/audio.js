// EMBERDEEP — synthesized sound (WebAudio). No external assets.
(function () {
  'use strict';
  const EMB = window.EMB;
  const A = EMB.A = { ctx: null, sfx: true, bgm: true, danger: 0, zone: 0, boss: false, bright: 0 };
  let ac, master, sfxG, bgmG, noiseBuf, nextBeat = 0, beat = 0;

  A.init = function () {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = A.ctx = new AC();
    master = ac.createGain(); master.gain.value = 0.9;
    const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.gain.value = 0.55; sfxG.connect(master);
    bgmG = ac.createGain(); bgmG.gain.value = 0.3; bgmG.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    nextBeat = ac.currentTime + 0.2;
  };
  A.setSfx = function (v) { A.sfx = v; if (sfxG) sfxG.gain.value = v ? 0.55 : 0; };
  A.setBgm = function (v) { A.bgm = v; if (bgmG) bgmG.gain.value = v ? 0.3 : 0; };

  function tone(f, dur, o) {
    if (!ac) return; o = o || {};
    const t = ac.currentTime + (o.delay || 0), os = ac.createOscillator(), g = ac.createGain();
    os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
    const v = o.vol === undefined ? 0.3 : o.vol, at = o.attack || 0.005;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    os.connect(g); g.connect(o.dest || sfxG); os.start(t); os.stop(t + dur + 0.05);
  }
  function noise(dur, o) {
    if (!ac) return; o = o || {};
    const t = ac.currentTime + (o.delay || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur); f.Q.value = o.q || 1;
    const v = o.vol === undefined ? 0.3 : o.vol;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + (o.attack || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(o.dest || sfxG); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  let pickN = 0, pickT = 0;
  A.ev = function (e) {
    if (!ac) return;
    switch (e.t) {
      case 'swing': if (e.w === 'hammer') noise(0.22, { f: 500, to: 150, vol: 0.35, q: 0.7 }); else if (e.w === 'spear') noise(0.12, { f: 2600, to: 900, vol: 0.22, q: 2 }); else noise(0.1, { f: e.fin ? 1400 : 2000, to: 600, vol: e.fin ? 0.3 : 0.2, q: 1.5 }); break;
      case 'dmg': tone(e.heavy ? 110 : 170, 0.1, { type: 'square', to: 60, vol: e.shroud ? 0.1 : 0.22 }); noise(0.06, { f: e.shroud ? 600 : 3000, vol: 0.25, q: 0.8 }); break;
      case 'kill': tone(e.boss ? 80 : 300, e.boss ? 1.2 : 0.18, { type: 'sawtooth', to: e.boss ? 30 : 80, vol: 0.25 }); noise(e.boss ? 1.0 : 0.15, { f: 800, to: 200, vol: 0.3 }); if (e.boss) [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.6, { delay: 0.5 + i * 0.12, vol: 0.2, type: 'triangle' })); break;
      case 'clang': tone(1900, 0.18, { type: 'square', vol: 0.12 }); tone(2850, 0.22, { type: 'triangle', vol: 0.12 }); break;
      case 'guardbreak': tone(900, 0.25, { type: 'square', to: 200, vol: 0.2 }); noise(0.2, { f: 2500, vol: 0.3 }); break;
      case 'ignite': noise(0.5, { f: 300, to: 1800, vol: 0.4, q: 0.6, type: 'lowpass' }); tone(180, 0.4, { to: 520, vol: 0.2, type: 'triangle' }); tone(784, 0.5, { delay: 0.08, vol: 0.12, type: 'triangle' }); break;
      case 'roomlit': [659, 784, 988].forEach((f, i) => tone(f, 0.7, { delay: 0.25 + i * 0.1, vol: 0.14, type: 'triangle' })); break;
      case 'lamp': noise(1.6, { f: 200, to: 3000, vol: 0.4, q: 0.5, type: 'lowpass' }); [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, 1.8, { delay: i * 0.13, vol: 0.2, type: 'triangle', attack: 0.05 })); break;
      case 'rest': [392, 494, 587].forEach((f, i) => tone(f, 0.8, { delay: i * 0.09, vol: 0.12 })); break;
      case 'pick': { const now = ac.currentTime; if (now - pickT > 0.5) pickN = 0; pickT = now; pickN = Math.min(pickN + 1, 12); tone((e.k === 'xp' ? 660 : 990) * Math.pow(1.0595, pickN), 0.08, { vol: 0.09, type: e.k === 'xp' ? 'triangle' : 'sine' }); break; }
      case 'lvl': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.5, { delay: i * 0.07, vol: 0.2, type: 'triangle' })); break;
      case 'hurt': tone(140, 0.25, { type: 'sawtooth', to: 50, vol: 0.35 }); noise(0.15, { f: 500, vol: 0.4 }); break;
      case 'die': tone(220, 1.2, { type: 'sawtooth', to: 40, vol: 0.3 }); break;
      case 'heal': [440, 554, 659].forEach((f, i) => tone(f, 0.35, { delay: i * 0.06, vol: 0.14 })); break;
      case 'drink': noise(0.3, { f: 700, to: 1400, vol: 0.12, q: 4 }); break;
      case 'deny': tone(120, 0.1, { type: 'square', vol: 0.1 }); break;
      case 'roll': noise(0.18, { f: 900, to: 300, vol: 0.18, q: 0.8 }); break;
      case 'crate': noise(0.15, { f: 700, vol: 0.35, q: 0.6 }); tone(200, 0.08, { type: 'square', to: 90, vol: 0.15 }); break;
      case 'crack': noise(0.6, { f: 300, to: 80, vol: 0.5, q: 0.5, type: 'lowpass' }); tone(70, 0.4, { type: 'sawtooth', to: 30, vol: 0.3 }); break;
      case 'clink': tone(1400, 0.06, { type: 'square', vol: 0.08 }); break;
      case 'chest': [523, 659, 784].forEach((f, i) => tone(f, 0.25, { delay: i * 0.07, vol: 0.16, type: 'triangle' })); break;
      case 'item': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.4, { delay: 0.15 + i * 0.09, vol: 0.18, type: 'triangle' })); break;
      case 'reveal': tone(880, 0.3, { vol: 0.12 }); tone(1320, 0.4, { delay: 0.1, vol: 0.12 }); break;
      case 'flare': noise(0.7, { f: 2000, to: 200, vol: 0.5, q: 0.5, type: 'lowpass' }); tone(90, 0.5, { type: 'sawtooth', to: 40, vol: 0.3 }); tone(660, 0.5, { to: 1320, vol: 0.12 }); break;
      case 'retort': noise(0.3, { f: 1500, to: 300, vol: 0.3 }); break;
      case 'swap': tone(500, 0.06, { type: 'square', vol: 0.08 }); tone(750, 0.06, { type: 'square', vol: 0.08, delay: 0.05 }); break;
      case 'door': if (e.open) { noise(0.5, { f: 200, to: 90, vol: 0.3, type: 'lowpass' }); tone(392, 0.4, { delay: 0.1, vol: 0.1 }); } else { noise(0.3, { f: 150, vol: 0.4, type: 'lowpass' }); tone(98, 0.5, { type: 'sawtooth', vol: 0.2 }); } break;
      case 'aggro': tone(e.type === 'flit' ? 1300 : 420, 0.12, { type: 'triangle', to: e.type === 'flit' ? 1700 : 300, vol: 0.07 }); break;
      case 'lunge': tone(e.big ? 160 : 330, 0.15, { type: 'sawtooth', to: e.big ? 80 : 160, vol: 0.12 }); break;
      case 'dive': case 'charge': noise(0.3, { f: 600, to: 2400, vol: 0.2, q: 2 }); break;
      case 'spit': tone(500, 0.2, { to: 200, type: 'square', vol: 0.08 }); break;
      case 'splash': noise(0.25, { f: 900, to: 300, vol: 0.28 }); break;
      case 'jump': tone(120, 0.5, { to: 500, type: 'triangle', vol: 0.15 }); break;
      case 'slam': case 'crash': noise(0.5, { f: 180, to: 60, vol: 0.6, type: 'lowpass' }); tone(60, 0.4, { type: 'sine', to: 30, vol: 0.5 }); break;
      case 'pitfall': tone(700, 0.5, { to: 90, vol: 0.14 }); break;
      case 'fall': tone(500, 0.5, { to: 80, vol: 0.2 }); break;
      case 'roar': tone(90, 0.8, { type: 'sawtooth', to: 50, vol: 0.3 }); noise(0.8, { f: 400, vol: 0.25, q: 0.4 }); break;
      case 'snuffwarn': tone(300, 0.6, { to: 120, type: 'triangle', vol: 0.12 }); break;
      case 'snuff': noise(0.4, { f: 2000, to: 200, vol: 0.2, type: 'lowpass' }); break;
      case 'scorch': [392, 523, 659, 784].forEach((f, i) => tone(f, 0.9, { delay: i * 0.05, vol: 0.18, type: 'triangle' })); break;
      case 'burst': noise(0.2, { f: 1800, vol: 0.2 }); tone(260, 0.2, { type: 'square', to: 130, vol: 0.1 }); break;
      case 'sweep': noise(0.2, { f: 700, to: 250, vol: 0.3, q: 0.8 }); break;
      case 'arena': tone(98, 0.8, { type: 'sawtooth', vol: 0.18 }); tone(104, 0.8, { type: 'sawtooth', vol: 0.18 }); break;
      case 'cleared': [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.6, { delay: i * 0.1, vol: 0.18, type: 'triangle' })); break;
      case 'forge': tone(1200, 0.25, { type: 'triangle', vol: 0.2 }); tone(1800, 0.35, { delay: 0.12, type: 'triangle', vol: 0.16 }); noise(0.08, { f: 4000, vol: 0.2 }); break;
      case 'ui': tone(e.ok ? 700 : 500, 0.05, { type: 'triangle', vol: 0.08 }); break;
      case 'msg': tone(880, 0.08, { vol: 0.06 }); break;
      case 'ending': [262, 330, 392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 3, { delay: i * 0.2, vol: 0.18, type: 'triangle', attack: 0.1 })); noise(3, { f: 200, to: 4000, vol: 0.3, type: 'lowpass', q: 0.4 }); break;
    }
  };

  // generative ambient: slow pads + sparse plucks; a pulse joins while enemies hunt you
  const ROOTS = [146.83, 130.81, 110.0, 164.81];
  const MINOR = [0, 3, 5, 7, 10, 12, 15], MAJOR = [0, 2, 4, 7, 9, 12, 14];
  A.tick = function () {
    if (!ac || ac.state !== 'running') return;
    while (nextBeat < ac.currentTime + 0.3) {
      const d = Math.max(0, nextBeat - ac.currentTime), root = ROOTS[A.zone % 4], sc = A.bright > 0.5 ? MAJOR : MINOR, bl = A.boss ? 0.3 : 0.46;
      if (beat % 16 === 0) { const ch = [[0, 2, 4], [0, 3, 5], [1, 3, 5], [0, 2, 4]][Math.floor(beat / 16) % 4]; ch.forEach((k, i) => { tone(root * Math.pow(2, sc[k] / 12), bl * 17, { dest: bgmG, vol: 0.085, type: i ? 'sine' : 'triangle', attack: 2.5, delay: d }); }); tone(root / 2, bl * 17, { dest: bgmG, vol: 0.1, attack: 2, delay: d }); }
      if (Math.random() < (A.danger > 0 ? 0.5 : 0.28)) { const k = sc[Math.floor(Math.random() * sc.length)]; tone(root * 2 * Math.pow(2, k / 12), 1.4, { dest: bgmG, vol: 0.06, type: 'triangle', delay: d }); }
      if (A.danger > 0) { if (beat % 2 === 0) { tone(70, 0.22, { dest: bgmG, vol: 0.32, to: 40, delay: d }); } else noise(0.06, { dest: bgmG, f: 5000, vol: A.boss ? 0.09 : 0.05, delay: d }); if (A.boss && beat % 4 === 3) tone(root / 2 * Math.pow(2, sc[(beat >> 2) % 5] / 12), 0.25, { dest: bgmG, vol: 0.16, type: 'sawtooth', delay: d }); }
      nextBeat += bl; beat++;
    }
  };
})();
