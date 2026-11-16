// REEL DELVE ― 効果音と環境音（WebAudio で合成。外部素材なし）
(function () {
  'use strict';
  var ac = null, master = null, muted = false, bgmTimer = null, bgmOn = false;

  function ensure() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ac = new AC();
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ac.destination);
    } catch (e) { ac = null; return false; }
    return true;
  }

  function tone(freq, dur, type, vol, when, slide) {
    if (!ac) return;
    var t = ac.currentTime + (when || 0);
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, when, freq, q) {
    if (!ac) return;
    var t = ac.currentTime + (when || 0);
    var n = Math.floor(ac.sampleRate * dur);
    var buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ac.createBufferSource(); src.buffer = buf;
    var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1200; f.Q.value = q || 0.8;
    var g = ac.createGain(); g.gain.value = vol || 0.2;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
  }

  var SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  function note(n) { return 440 * Math.pow(2, (n - 9) / 12); }

  var S = {
    tick: function () { tone(1500, 0.025, 'square', 0.025); },
    rotate: function () { tone(520, 0.05, 'triangle', 0.08); noise(0.04, 0.05, 0, 2400, 2); },
    lever: function () { tone(180, 0.16, 'sawtooth', 0.14, 0, 70); noise(0.12, 0.12, 0.02, 500, 1); tone(660, 0.12, 'triangle', 0.08, 0.1); },
    stop: function (good) {
      tone(120, 0.14, 'sine', 0.4, 0, 60); noise(0.07, 0.22, 0, 700, 1);
      if (good) tone(880, 0.12, 'triangle', 0.1, 0.02);
    },
    step: function () { noise(0.03, 0.05, 0, 400, 1.5); },
    coin: function (n) { var f = note(12 + SCALE[Math.min(9, n + 1)]); tone(f, 0.16, 'triangle', 0.18); tone(f * 2, 0.22, 'sine', 0.09, 0.03); },
    kill: function (n) { noise(0.12, 0.3, 0, 2600, 0.7); tone(note(SCALE[Math.min(9, n)]) * 0.5, 0.2, 'sawtooth', 0.14, 0.02, 80); tone(note(12 + SCALE[Math.min(9, n + 1)]), 0.14, 'triangle', 0.12, 0.08); },
    open: function (n) { var b = 7 + SCALE[Math.min(9, n)]; tone(note(b), 0.1, 'square', 0.08); tone(note(b + 4), 0.1, 'square', 0.08, 0.07); tone(note(b + 7), 0.2, 'triangle', 0.16, 0.14); noise(0.06, 0.1, 0, 900, 1); },
    crystal: function (n) { var b = 16 + SCALE[Math.min(9, n)]; tone(note(b), 0.5, 'sine', 0.16); tone(note(b + 7), 0.6, 'sine', 0.1, 0.05); },
    potion: function () { tone(note(12), 0.12, 'sine', 0.16); tone(note(16), 0.12, 'sine', 0.16, 0.09); tone(note(19), 0.25, 'sine', 0.16, 0.18); },
    disarm: function (n) { noise(0.05, 0.2, 0, 3000, 3); tone(note(9 + SCALE[Math.min(9, n)]), 0.1, 'square', 0.07, 0.04); },
    hurt: function () { tone(160, 0.3, 'sawtooth', 0.3, 0, 50); noise(0.2, 0.3, 0, 300, 0.6); },
    pass: function () { tone(300, 0.05, 'sine', 0.04); },
    stairs: function (up) { var a = up ? [0, 4, 7] : [7, 4, 0]; for (var i = 0; i < 3; i++) tone(note(4 + a[i]), 0.07, 'triangle', 0.1, i * 0.06); },
    bump: function () { tone(140, 0.08, 'square', 0.1); },
    hit: function () { [0, 4, 7, 12].forEach(function (n, i) { tone(note(12 + n), 0.22, 'triangle', 0.2, i * 0.07); tone(note(n), 0.22, 'square', 0.05, i * 0.07); }); },
    jackpot: function () {
      [0, 4, 7, 12, 16, 19, 24, 19, 24, 28].forEach(function (n, i) { tone(note(12 + n), 0.3, 'triangle', 0.2, i * 0.085); tone(note(n), 0.3, 'square', 0.05, i * 0.085); });
      noise(1.0, 0.12, 0.1, 5000, 0.5);
    },
    reach: function () { tone(note(19), 0.09, 'square', 0.06); tone(note(24), 0.09, 'square', 0.06, 0.1); },
    gateOpen: function () {
      tone(60, 1.4, 'sawtooth', 0.25, 0, 40); noise(1.2, 0.2, 0, 200, 0.5);
      [0, 7, 12, 16].forEach(function (n, i) { tone(note(n), 1.2, 'triangle', 0.14, 0.5 + i * 0.12); });
    },
    gateFail: function () { tone(110, 0.5, 'sawtooth', 0.25, 0, 70); tone(116, 0.5, 'sawtooth', 0.2, 0, 74); noise(0.3, 0.2, 0, 250, 0.6); },
    spawn: function (i) { tone(note(-5 + (i % 5) * 2), 0.18, 'sine', 0.1, 0, 60); noise(0.08, 0.06, 0, 800, 1); },
    buy: function () { tone(note(12), 0.08, 'triangle', 0.15); tone(note(19), 0.16, 'triangle', 0.15, 0.07); },
    plant: function () { tone(200, 0.1, 'sine', 0.3, 0, 90); noise(0.08, 0.2, 0, 600, 1); tone(note(16), 0.15, 'triangle', 0.1, 0.06); },
    deny: function () { tone(150, 0.12, 'square', 0.1); tone(120, 0.14, 'square', 0.1, 0.1); },
    select: function () { tone(700, 0.04, 'triangle', 0.07); },
    swap: function () { tone(500, 0.08, 'sine', 0.12, 0, 900); tone(900, 0.08, 'sine', 0.1, 0.07, 500); },
    floor: function () { tone(note(-12), 0.9, 'sine', 0.3); tone(note(-5), 0.9, 'sine', 0.16, 0.1); noise(0.5, 0.08, 0, 300, 0.5); },
    over: function () { [7, 4, 0, -5].forEach(function (n, i) { tone(note(n), 0.5, 'triangle', 0.18, i * 0.28); }); },
    win: function () { [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach(function (n, i) { tone(note(12 + n), 0.5, 'triangle', 0.18, i * 0.14); tone(note(n), 0.6, 'sine', 0.12, i * 0.14); }); }
  };

  // 環境音：間をあけて鳴る低い和音と、ときどきの高い一音。ループさせない。
  function bgmStep() {
    if (!ac || !bgmOn) return;
    var roots = [-12, -15, -17, -10];
    var root = roots[Math.floor(Math.random() * roots.length)];
    var t0 = 0;
    [0, 7, 12].forEach(function (n) {
      var t = ac.currentTime + t0;
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = note(root + n);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.045, t + 1.6);
      g.gain.linearRampToValueAtTime(0.0001, t + 5.5);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 5.6);
    });
    var k = 1 + Math.floor(Math.random() * 3);
    for (var i = 0; i < k; i++) {
      var n2 = root + 24 + SCALE[Math.floor(Math.random() * 6)];
      tone(note(n2), 1.6, 'sine', 0.035, 1 + Math.random() * 3.5);
    }
    bgmTimer = setTimeout(bgmStep, 4200 + Math.random() * 2600);
  }

  window.RD_AUDIO = {
    unlock: function () { if (ensure() && !bgmOn) { bgmOn = true; bgmStep(); } },
    play: function (name, a) { if (!ac || muted) return; try { S[name] && S[name](a); } catch (e) { /* 音が出なくても続行 */ } },
    toggleMute: function () { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.5; return muted; },
    isMuted: function () { return muted; }
  };
})();
