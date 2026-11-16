/* ぽん、と森は灯る — audio (WebAudio synthesis only, no external assets) */
(function (root) {
  'use strict';
  var ctx = null, master = null, sfx = null, music = null, verb = null, started = false;
  var vol = 0.8, muted = false, dawn = 0;
  // pentatonic ladder (D major pentatonic), in semitones from D3
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31, 33, 36];
  function hz(semi) { return 146.83 * Math.pow(2, semi / 12); }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : vol; master.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = 0.9; sfx.connect(master);
    music = ctx.createGain(); music.gain.value = 0.0; music.connect(master);
    // small generated reverb
    verb = ctx.createConvolver();
    var len = Math.floor(ctx.sampleRate * 2.4), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    verb.buffer = buf;
    var vg = ctx.createGain(); vg.gain.value = 0.32; verb.connect(vg); vg.connect(master);
    sfx.connect(verb); music.connect(verb);
    startMusic();
  }

  function tone(type, f, t0, dur, gain, dest, f2) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || sfx);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  var noiseBuf = null;
  function noise(t0, dur, gain, freq, q, type, f2) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.setValueAtTime(freq, t0); f.Q.value = q || 1;
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(sfx);
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
  }

  var A = {
    init: init,
    ready: function () { return !!ctx; },
    setVolume: function (v) { vol = v; if (master) master.gain.value = muted ? 0 : vol; },
    getVolume: function () { return vol; },
    toggleMute: function () { muted = !muted; if (master) master.gain.value = muted ? 0 : vol; return muted; },
    isMuted: function () { return muted; },
    setDawn: function (v) { dawn = v; },

    // mushroom bounce: marimba-like, climbs the scale with the combo
    pon: function (size, combo) {
      if (!ctx) return; var t = ctx.currentTime;
      var idx = Math.min(PENTA.length - 1, (combo - 1) % 11 + (size >= 3 ? 0 : 2));
      var f = hz(PENTA[idx] + (size >= 4 ? -12 : 0) + 12);
      tone('sine', f, t, 0.5, 0.34);
      tone('sine', f * 4, t, 0.09, 0.12);
      tone('triangle', f * 0.5, t, 0.22, 0.18);
      noise(t, 0.04, 0.12, 1800, 0.8);
    },
    bell: function (count) {
      if (!ctx) return; var t = ctx.currentTime;
      var chord = [12, 16, 19, 24, 28, 31];
      var f = hz(chord[Math.min(chord.length - 1, count - 1)] + 12);
      tone('sine', f, t, 2.2, 0.26);
      tone('sine', f * 2.76, t, 1.1, 0.07);
      tone('sine', f * 1.003, t, 2.0, 0.14);
      tone('sine', f * 5.4, t, 0.3, 0.035);
    },
    bellsFade: function () {
      if (!ctx) return; var t = ctx.currentTime;
      tone('sine', hz(28), t, 0.7, 0.07, null, hz(19));
    },
    gate: function (n) {
      if (!ctx) return; var t = ctx.currentTime;
      var seq = [12, 16, 19, 24, 28, 31, 36];
      for (var i = 0; i < Math.min(seq.length, n + 3); i++) {
        tone('sine', hz(seq[i] + 12), t + 0.25 + i * 0.11, 1.6, 0.16);
        tone('triangle', hz(seq[i]), t + 0.25 + i * 0.11, 0.9, 0.07);
      }
      noise(t + 0.1, 1.4, 0.07, 3000, 0.6, 'bandpass', 7000);
      noise(t, 0.9, 0.12, 300, 0.7, 'lowpass', 90);
    },
    launch: function (p) {
      if (!ctx) return; var t = ctx.currentTime;
      noise(t, 0.22 + p * 0.15, 0.10 + p * 0.1, 900 + p * 1500, 0.9, 'bandpass', 300);
      tone('sine', 340 + p * 420, t, 0.16, 0.16, null, 170);
    },
    stretch: function (p) {
      if (!ctx) return; var t = ctx.currentTime;
      tone('triangle', 190 + p * 260, t, 0.05, 0.05);
    },
    sprout: function (floated) {
      if (!ctx) return; var t = ctx.currentTime;
      tone('sine', hz(19), t, 0.12, 0.2, null, hz(24));
      tone('sine', hz(26), t + 0.09, 0.22, 0.22, null, hz(31));
      tone('triangle', hz(7), t, 0.18, 0.1);
      if (floated) tone('sine', hz(36), t + 0.22, 0.5, 0.12);
    },
    grow: function (size) {
      if (!ctx) return; var t = ctx.currentTime;
      var b = size >= 3 ? 12 : 7;
      tone('sine', hz(b), t, 0.14, 0.2); tone('sine', hz(b + 4), t + 0.1, 0.14, 0.2); tone('sine', hz(b + 7), t + 0.2, 0.14, 0.2);
      tone('sine', hz(b + 12), t + 0.3, 0.5, 0.24);
    },
    fizzle: function () {
      if (!ctx) return; var t = ctx.currentTime;
      noise(t, 0.35, 0.07, 2400, 0.7, 'bandpass', 500);
      tone('sine', 300, t, 0.3, 0.07, null, 130);
    },
    splash: function () {
      if (!ctx) return; var t = ctx.currentTime;
      noise(t, 0.3, 0.2, 900, 0.6, 'lowpass', 250);
      for (var i = 0; i < 4; i++) tone('sine', 500 + Math.random() * 700, t + 0.08 + i * 0.07, 0.07, 0.07, null, 1300 + Math.random() * 500);
    },
    bubble: function () {
      if (!ctx) return; var t = ctx.currentTime;
      tone('sine', 420 + Math.random() * 500, t, 0.08, 0.035, null, 1100 + Math.random() * 400);
    },
    sink: function () {
      if (!ctx) return; var t = ctx.currentTime;
      tone('sine', 420, t, 0.5, 0.1, null, 90);
      noise(t, 0.4, 0.08, 500, 0.7, 'lowpass', 120);
    },
    thorn: function () {
      if (!ctx) return; var t = ctx.currentTime;
      noise(t, 0.08, 0.2, 5000, 1.2);
      tone('square', 880, t, 0.12, 0.05, null, 220);
    },
    firefly: function (n) {
      if (!ctx) return; var t = ctx.currentTime;
      var f = hz(PENTA[5 + (n % 8)] + 24);
      tone('sine', f, t, 0.5, 0.12); tone('sine', f * 1.5, t + 0.06, 0.5, 0.08);
    },
    knock: function (kind, sp) {
      if (!ctx) return; var t = ctx.currentTime, g = Math.min(0.22, 0.05 + sp / 4000);
      if (kind === 'log') { tone('sine', 520, t, 0.07, g, null, 380); tone('triangle', 1040, t, 0.03, g * 0.5); }
      else if (kind === 'gate') { tone('triangle', 240, t, 0.09, g, null, 150); noise(t, 0.06, g * 0.6, 1500, 1); }
      else { tone('sine', 190, t, 0.07, g, null, 110); noise(t, 0.035, g * 0.7, 2600, 0.8); }
    },
    uproot: function () {
      if (!ctx) return; var t = ctx.currentTime;
      tone('sine', hz(24), t, 0.14, 0.14, null, hz(12));
      noise(t, 0.1, 0.06, 1200, 0.8);
    },
    select: function () {
      if (!ctx) return; var t = ctx.currentTime;
      tone('sine', hz(31), t, 0.09, 0.07);
    },
    chime: function (i) {  // ending wave
      if (!ctx) return; var t = ctx.currentTime;
      var f = hz(PENTA[(i * 3) % 13] + 12);
      tone('sine', f, t, 1.4, 0.1); tone('sine', f * 2, t, 0.5, 0.04);
    },
    finale: function () {
      if (!ctx) return; var t = ctx.currentTime;
      var seq = [0, 7, 12, 16, 19, 24, 28, 31, 36];
      for (var i = 0; i < seq.length; i++) {
        tone('sine', hz(seq[i] + 12), t + 0.4 + i * 0.16, 3.2, 0.13);
        tone('triangle', hz(seq[i]), t + 0.4 + i * 0.16, 2.0, 0.06);
      }
      noise(t + 0.3, 3.5, 0.06, 2500, 0.5, 'bandpass', 8000);
    }
  };

  /* ---- generative ambience: slow pad + sparse plucks + night insects ---- */
  var CH_NIGHT = [[0, 7, 16, 19], [-3, 7, 12, 16], [-5, 4, 11, 14], [-7, 5, 9, 16], [-2, 5, 12, 17]];
  var CH_DAWN = [[0, 7, 16, 21], [5, 12, 16, 21], [-5, 7, 14, 19], [0, 9, 16, 19]];
  var chordIdx = 0, curChord = CH_NIGHT[0];
  function padNote(semi, t0, dur, g) {
    var o = ctx.createOscillator(), o2 = ctx.createOscillator(), gn = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'triangle'; o2.type = 'sine';
    o.frequency.value = hz(semi); o2.frequency.value = hz(semi) * 1.004;
    f.type = 'lowpass'; f.frequency.value = 700 + dawn * 900;
    gn.gain.setValueAtTime(0.0001, t0);
    gn.gain.linearRampToValueAtTime(g, t0 + dur * 0.35);
    gn.gain.linearRampToValueAtTime(g * 0.7, t0 + dur * 0.7);
    gn.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    o.connect(f); o2.connect(f); f.connect(gn); gn.connect(music);
    o.start(t0); o2.start(t0); o.stop(t0 + dur + 0.1); o2.stop(t0 + dur + 0.1);
  }
  function startMusic() {
    if (started) return; started = true;
    music.gain.setValueAtTime(0.0001, ctx.currentTime);
    music.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 6);
    var next = ctx.currentTime + 0.3;
    function sched() {
      if (!ctx) return;
      while (next < ctx.currentTime + 2) {
        var set = dawn > 0.5 ? CH_DAWN : CH_NIGHT;
        chordIdx = (chordIdx + 1 + (Math.random() < 0.3 ? 1 : 0)) % set.length;
        curChord = set[chordIdx];
        var dur = 11 + Math.random() * 5;
        for (var i = 0; i < curChord.length; i++) {
          if (i > 0 && Math.random() < 0.2) continue;
          padNote(curChord[i] + (i === 0 ? 0 : (Math.random() < 0.3 ? 12 : 0)), next + i * 0.6, dur + 3, i === 0 ? 0.075 : 0.045);
        }
        next += dur;
      }
      setTimeout(sched, 800);
    }
    sched();
    function pluck() {
      if (!ctx) return;
      if (ctx.state === 'running') {
        var t = ctx.currentTime + 0.05, n = curChord[1 + Math.floor(Math.random() * 3)] + 12 + (Math.random() < 0.4 ? 12 : 0);
        tone('sine', hz(n), t, 2.4, 0.035, music);
        if (Math.random() < 0.4) tone('sine', hz(n + (Math.random() < 0.5 ? 7 : 5)), t + 0.35 + Math.random() * 0.4, 2.0, 0.025, music);
      }
      setTimeout(pluck, 2600 + Math.random() * 5200);
    }
    setTimeout(pluck, 4000);
    function cricket() {
      if (!ctx) return;
      if (ctx.state === 'running' && dawn < 0.5) {
        var t = ctx.currentTime + 0.05, f = 4100 + Math.random() * 900, n = 3 + Math.floor(Math.random() * 4);
        for (var i = 0; i < n; i++) tone('sine', f, t + i * 0.085, 0.05, 0.011, music);
      } else if (ctx.state === 'running') {
        var t2 = ctx.currentTime + 0.05, f2 = 2300 + Math.random() * 1200;   // dawn birds
        tone('sine', f2, t2, 0.12, 0.02, music, f2 * 1.25); tone('sine', f2 * 1.2, t2 + 0.16, 0.1, 0.018, music, f2 * 0.95);
      }
      setTimeout(cricket, 1500 + Math.random() * 4200);
    }
    setTimeout(cricket, 2500);
  }

  root.PonAudio = A;
})(window);
