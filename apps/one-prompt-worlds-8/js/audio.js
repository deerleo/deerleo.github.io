/*
 * ひつじが いっぴき — 音（Web Audio で合成。外部素材なし）
 */
(function (root) {
  'use strict';
  var ac = null, master = null, muted = false, lastBaa = 0, mode = 'morning', nextNote = 0, nextAmb = 0, on = false;
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
  var ROOT = { morning: 262, noon: 294, evening: 247, dusk: 233, night: 220, title: 262, ending: 196 };

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.8;
    var comp = ac.createDynamicsCompressor();
    master.connect(comp); comp.connect(ac.destination);
    on = true;
  }
  function env(g, t, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function tone(type, f0, f1, dur, vol, when, attack) {
    if (!ac) return;
    var t = ac.currentTime + (when || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, attack || 0.008, vol, dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
    return { o: o, g: g, t: t };
  }
  function noise(dur, vol, freq, q, when) {
    if (!ac) return;
    var t = ac.currentTime + (when || 0), n = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    env(g, t, 0.005, vol, dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t);
  }
  function bell(semi, vol, when) {
    if (!ac) return;
    var f = 523.25 * Math.pow(2, semi / 12);
    tone('sine', f, f, 1.3, vol || 0.22, when);
    tone('sine', f * 2.76, f * 2.76, 0.5, (vol || 0.22) * 0.25, when);
    tone('triangle', f * 2, f * 2, 0.25, (vol || 0.22) * 0.2, when);
  }
  function settle(n) { bell(PENTA[(n - 1) % PENTA.length]); }
  function baa(kind) {
    if (!ac) return;
    var now = ac.currentTime;
    if (now - lastBaa < 0.13) return;
    lastBaa = now;
    var goat = kind === 'goat', f = (goat ? 560 : 400) * (0.9 + Math.random() * 0.25), dur = goat ? 0.24 : 0.36;
    var o = ac.createOscillator(), g = ac.createGain(), bp = ac.createBiquadFilter(), lfo = ac.createOscillator(), lg = ac.createGain();
    o.type = goat ? 'square' : 'sawtooth'; o.frequency.setValueAtTime(f, now); o.frequency.linearRampToValueAtTime(f * 0.86, now + dur);
    lfo.frequency.value = goat ? 17 : 11; lg.gain.value = f * 0.06; lfo.connect(lg); lg.connect(o.frequency);
    bp.type = 'bandpass'; bp.frequency.value = goat ? 1500 : 1100; bp.Q.value = 2.2;
    env(g, now, 0.03, goat ? 0.09 : 0.13, dur);
    o.connect(bp); bp.connect(g); g.connect(master);
    o.start(now); lfo.start(now); o.stop(now + dur + 0.05); lfo.stop(now + dur + 0.05);
  }
  function bark() {
    if (!ac) return;
    tone('square', 330, 170, 0.09, 0.10);
    noise(0.07, 0.16, 900, 0.8);
  }
  function graze() { noise(0.05, 0.05, 2600, 3); }
  function splash() { noise(0.25, 0.08, 700, 0.7); }
  function click() { tone('sine', 660, 880, 0.08, 0.09); }
  function clear() {
    [0, 4, 7, 12, 16].forEach(function (s, i) { bell(s, 0.2, i * 0.13); });
  }
  function star(i) { bell(12 + i * 4, 0.16); }

  // ---- ひかえめな環境音と、まばらな撥弦の音 ----
  function tick() {
    if (!ac || muted) return;
    var now = ac.currentTime;
    if (now > nextNote) {
      var night = mode === 'night' || mode === 'ending';
      nextNote = now + (night ? 1.9 : 1.2) + Math.random() * 1.9;
      var base = ROOT[mode] || 262, s = PENTA[Math.floor(Math.random() * 8)];
      var f = base * Math.pow(2, s / 12);
      tone('triangle', f, f, 1.6, 0.045, 0, 0.01);
      tone('sine', f * 2, f * 2, 0.7, 0.018, 0, 0.01);
      if (Math.random() < 0.35) tone('sine', base / 2, base / 2, 2.6, 0.04, 0, 0.3);
      if (Math.random() < 0.3) { var f2 = base * Math.pow(2, PENTA[Math.floor(Math.random() * 8)] / 12); tone('triangle', f2, f2, 1.4, 0.03, 0.28, 0.01); }
    }
    if (now > nextAmb) {
      if (mode === 'night' || mode === 'ending' || mode === 'dusk') {
        nextAmb = now + 0.9 + Math.random() * 1.6;
        for (var i = 0; i < 4; i++) tone('sine', 4200, 4200, 0.045, 0.012, i * 0.07);
      } else {
        nextAmb = now + 2.5 + Math.random() * 5;
        var b = 2200 + Math.random() * 1600, k = 2 + Math.floor(Math.random() * 3);
        for (var j = 0; j < k; j++) tone('sine', b, b * (1.15 + Math.random() * 0.3), 0.09, 0.018, j * 0.13);
      }
    }
  }
  function setMode(m) { mode = m; }
  function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.8; return muted; }

  root.Snd = {
    init: init, settle: settle, baa: baa, bark: bark, graze: graze, splash: splash, click: click, clear: clear, star: star,
    bell: bell, tick: tick, setMode: setMode, toggleMute: toggleMute, isMuted: function () { return muted; }
  };
})(window);
