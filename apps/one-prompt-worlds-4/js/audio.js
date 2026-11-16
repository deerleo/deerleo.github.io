// LUMEN REEL — 音（すべて WebAudio で合成。外部素材なし）
(function () {
  'use strict';
  const A = window.SND = { muted: false };
  let ac = null, master = null, seaGain = null, musicTimer = null, root = 0;
  const PENTA = [0, 2, 4, 7, 9];
  const hz = (semi) => 220 * Math.pow(2, semi / 12);
  const note = (i) => { const o = Math.floor(i / 5), k = ((i % 5) + 5) % 5; return hz(root + PENTA[k] + 12 * o); };

  A.init = function () {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = A.muted ? 0 : 0.8; master.connect(ac.destination);
    // 波の音：ノイズをゆっくり揺らす
    const len = ac.sampleRate * 4, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = last * 0.98 + (Math.random() * 2 - 1) * 0.02; d[i] = last * 6; }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
    seaGain = ac.createGain(); seaGain.gain.value = 0.05;
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 0.035;
    lfo.connect(lg); lg.connect(seaGain.gain); lfo.start();
    src.connect(lp); lp.connect(seaGain); seaGain.connect(master); src.start();
    scheduleMusic();
  };
  A.setMuted = function (m) { A.muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : 0.8, ac.currentTime, 0.05); };
  A.setRoot = function (r) { root = r; };

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!ac) return;
    const t = ac.currentTime + (when || 0);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, freq, when, q) {
    if (!ac) return;
    const t = ac.currentTime + (when || 0);
    const len = Math.max(1, Math.floor(ac.sampleRate * dur)), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(); s.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  // 静かな環境音楽：同じ並びを繰り返さないよう、間隔も音も毎回選ぶ
  function scheduleMusic() {
    if (musicTimer) clearTimeout(musicTimer);
    const step = () => {
      if (ac && !A.muted && ac.state === 'running') {
        const i = Math.floor(Math.random() * 9) - 2;
        tone(note(i), 3.2, 'sine', 0.05);
        tone(note(i) * 2, 2.2, 'sine', 0.012);
        if (Math.random() < 0.4) tone(note(i + 2), 3.0, 'sine', 0.035, 0.6);
        if (Math.random() < 0.25) tone(note(i - 5), 4.5, 'triangle', 0.03);
      }
      musicTimer = setTimeout(step, 2200 + Math.random() * 3200);
    };
    musicTimer = setTimeout(step, 1500);
  }

  A.tick = () => noise(0.025, 0.05, 2600, 0, 3);
  A.spinStart = () => { noise(0.25, 0.08, 900, 0, 0.7); tone(140, 0.2, 'triangle', 0.08, 0, 260); };
  A.stop = (c) => { tone(150 + c * 22, 0.12, 'triangle', 0.22, 0, 90); noise(0.05, 0.14, 1800, 0, 2); tone(note(c * 2), 0.18, 'sine', 0.05); };
  A.reach = () => { for (let i = 0; i < 6; i++) tone(note(5 + i), 0.13, 'square', 0.03, i * 0.11); };
  A.nudge = () => { tone(520, 0.06, 'triangle', 0.12); noise(0.04, 0.08, 2400, 0, 3); };
  A.hold = (on) => tone(on ? 660 : 440, 0.09, 'square', 0.05);
  A.deny = () => { tone(150, 0.12, 'sawtooth', 0.06); tone(120, 0.14, 'sawtooth', 0.06, 0.08); };
  A.click = () => tone(700, 0.05, 'triangle', 0.08);
  A.beam = (power, step) => {
    const i = Math.min(14, Math.floor(Math.log2(1 + power) * 2.2)) + step;
    tone(note(i), 0.35, 'sine', 0.11); tone(note(i) * 2, 0.2, 'triangle', 0.04);
  };
  A.shoot = (power) => { noise(0.3, 0.07 + Math.min(0.1, power * 0.002), 1400 + Math.min(2500, power * 30), 0, 0.8); tone(note(4), 0.5, 'sine', 0.06, 0, note(9)); };
  A.hit = () => tone(note(7), 0.12, 'sine', 0.07);
  A.swallow = () => noise(0.4, 0.08, 400, 0, 0.6);
  A.guided = (k) => { [0, 2, 4, 5 + (k || 0)].forEach((n, i) => tone(note(5 + n), 0.5, 'sine', 0.1, i * 0.07)); };
  A.coin = () => { tone(1320, 0.07, 'square', 0.04); tone(1760, 0.15, 'square', 0.04, 0.06); };
  A.star = () => tone(note(12), 0.3, 'sine', 0.04);
  A.wreck = () => { noise(0.7, 0.25, 220, 0, 0.5); tone(110, 0.6, 'sawtooth', 0.12, 0, 45); };
  A.warn = () => { tone(880, 0.08, 'square', 0.04); tone(880, 0.08, 'square', 0.04, 0.14); };
  A.zoro = () => { [0, 2, 4, 5, 7, 9, 10].forEach((n, i) => { tone(note(5 + n), 0.5, 'triangle', 0.09, i * 0.06); tone(note(n), 0.5, 'sine', 0.07, i * 0.06); }); };
  A.grow = () => { tone(note(6), 0.12, 'sine', 0.09); tone(note(8), 0.2, 'sine', 0.09, 0.09); };
  A.gull = () => { tone(1500, 0.14, 'sawtooth', 0.035, 0, 900); tone(1700, 0.16, 'sawtooth', 0.035, 0.18, 1000); };
  A.buy = () => { tone(note(5), 0.1, 'triangle', 0.1); tone(note(7), 0.1, 'triangle', 0.1, 0.07); tone(note(9), 0.22, 'triangle', 0.1, 0.14); };
  A.spawn = () => tone(note(-3), 0.5, 'sine', 0.05);
  A.dawn = () => { [0, 2, 4, 5, 7, 9].forEach((n, i) => tone(note(n), 1.6, 'sine', 0.08, i * 0.22)); };
  A.fail = () => { [4, 2, 0, -3].forEach((n, i) => tone(note(n), 0.7, 'triangle', 0.09, i * 0.28)); };
  A.thunder = () => noise(1.4, 0.12, 120, 0, 0.4);
})();
