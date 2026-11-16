/* 切りもどし — 音（Web Audio で合成。外部素材なし） */
(function () {
  'use strict';
  var ac = null, master = null, wet = null, muted = false, ambTimer = 2;
  var SCALE = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99, 880.0, 987.77, 1174.66];

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ac.destination);
    // かんたんな残響（遅延の折り返し）
    var d = ac.createDelay(1); d.delayTime.value = 0.23;
    var fb = ac.createGain(); fb.gain.value = 0.32;
    var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    wet = ac.createGain(); wet.gain.value = 0.35;
    wet.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(master);
  }
  function out(g, rev) { g.connect(master); if (rev) g.connect(wet); }

  // 琴のような、はじく音
  function pluck(freq, when, vol, dur) {
    if (!ac) return;
    var t = ac.currentTime + (when || 0), g = ac.createGain(), o = ac.createOscillator(), o2 = ac.createOscillator();
    dur = dur || 0.9; vol = vol || 0.2;
    o.type = 'triangle'; o2.type = 'sine';
    o.frequency.setValueAtTime(freq * 1.012, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
    o2.frequency.value = freq * 2;
    var g2 = ac.createGain(); g2.gain.value = 0.25;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(g2); g2.connect(g); out(g, true);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function bell(freq, when, vol) {
    if (!ac) return;
    var t = ac.currentTime + (when || 0);
    [1, 2.76, 5.4].forEach(function (m, i) {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = freq * m;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime((vol || 0.16) / (i * 1.8 + 1), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6 / (i + 1));
      o.connect(g); out(g, true); o.start(t); o.stop(t + 1.8);
    });
  }
  function noise(when, dur, freq, q, vol, type) {
    if (!ac) return;
    var t = ac.currentTime + (when || 0), n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var s = ac.createBufferSource(); s.buffer = b;
    var f = ac.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    var g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); out(g, false); s.start(t);
  }

  var A = {
    init: init,
    snip: function (big) {           // ちょきん
      noise(0, 0.035, 5200, 1.2, 0.5, 'highpass'); noise(0.045, 0.06, 3600, 3, 0.55);
      pluck(big ? 196 : 262, 0.05, 0.08, 0.25);
      if (big) noise(0.12, 0.35, 900, 0.6, 0.12);
    },
    grow: function (i) { pluck(SCALE[Math.min(SCALE.length - 1, 1 + i * 2)], i * 0.11, 0.17, 0.8); noise(i * 0.11, 0.22, 1400, 0.8, 0.035); },
    bloom: function (i, when) { bell(SCALE[5 + (i % 5)], when || 0, 0.17); },
    dew: function (when) { pluck(1174.66, when || 0, 0.12, 0.5); pluck(1567.98, (when || 0) + 0.09, 0.1, 0.6); },
    dud: function () { pluck(110, 0, 0.14, 0.18); noise(0, 0.05, 300, 1, 0.2); },
    undo: function () { pluck(392, 0, 0.09, 0.3); pluck(329.63, 0.07, 0.09, 0.3); },
    click: function () { pluck(587.33, 0, 0.08, 0.2); },
    clear: function (meiboku) {
      var seq = meiboku ? [3, 5, 6, 8, 10] : [3, 5, 6, 8];
      seq.forEach(function (s, i) { pluck(SCALE[s], 0.25 + i * 0.13, 0.2, 1.4); });
      bell(SCALE[meiboku ? 10 : 8] / 2, 0.25 + seq.length * 0.13, 0.2);
    },
    stamp: function () { noise(0, 0.09, 220, 0.7, 0.7, 'lowpass'); pluck(98, 0, 0.2, 0.3); },
    // ときどき鳴る、まばらな琴（短いループにしない）
    ambient: function (dt) {
      if (!ac || muted) return;
      ambTimer -= dt;
      if (ambTimer > 0) return;
      ambTimer = 3.5 + Math.random() * 6;
      var a = (Math.random() * 6) | 0;
      pluck(SCALE[a] / 2, 0, 0.05, 2.2);
      if (Math.random() < 0.4) pluck(SCALE[a + 2 + ((Math.random() * 2) | 0)] / 2, 0.35 + Math.random() * 0.3, 0.04, 2.2);
    },
    toggleMute: function () { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.8; return muted; },
    setMuted: function (m) { muted = m; if (master) master.gain.value = muted ? 0 : 0.8; },
    isMuted: function () { return muted; }
  };
  window.KIRI_AUDIO = A;
})();
