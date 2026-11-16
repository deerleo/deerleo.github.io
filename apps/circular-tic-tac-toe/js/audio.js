/* Synthesised sound effects (Web Audio) - no audio files needed. */
(function (root) {
  'use strict';
  var ctx = null, enabled = true;
  try { enabled = localStorage.getItem('cttt.sound') !== 'off'; } catch (e) {}

  function ac() {
    if (!ctx) {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // one enveloped oscillator note
  function tone(freq, dur, opts) {
    var c = ac(); if (!c) return;
    opts = opts || {};
    var t = c.currentTime + (opts.at || 0);
    var osc = c.createOscillator(), g = c.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
    var v = opts.vol || 0.12;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(c.destination);
    osc.start(t); osc.stop(t + dur + 0.03);
  }

  var SOUNDS = {
    hover:  function () { tone(1250, 0.035, { vol: 0.018 }); },
    click:  function () { tone(700, 0.06, { type: 'triangle', vol: 0.07, to: 900 }); },
    placeX: function () { tone(560, 0.13, { type: 'triangle', vol: 0.16, to: 380 }); tone(1120, 0.05, { vol: 0.04 }); },
    placeO: function () { tone(320, 0.16, { type: 'sine', vol: 0.2, to: 460 }); tone(640, 0.06, { vol: 0.04 }); },
    undo:   function () { tone(520, 0.12, { type: 'triangle', vol: 0.09, to: 260 }); },
    redo:   function () { tone(260, 0.12, { type: 'triangle', vol: 0.09, to: 520 }); },
    hint:   function () { tone(880, 0.1, { type: 'sine', vol: 0.1 }); tone(1320, 0.16, { type: 'sine', vol: 0.09, at: 0.09 }); },
    start:  function () { tone(392, 0.09, { type: 'triangle', vol: 0.1 }); tone(587, 0.14, { type: 'triangle', vol: 0.1, at: 0.08 }); },
    error:  function () { tone(160, 0.12, { type: 'square', vol: 0.04 }); },
    win:    function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.22, { type: 'triangle', vol: 0.14, at: i * 0.1 }); }); },
    lose:   function () { [392, 330, 277, 208].forEach(function (f, i) { tone(f, 0.28, { type: 'sawtooth', vol: 0.06, at: i * 0.16 }); }); },
    draw:   function () { tone(440, 0.18, { type: 'triangle', vol: 0.1 }); tone(440, 0.3, { type: 'triangle', vol: 0.1, at: 0.22, to: 392 }); }
  };

  root.Sfx = {
    play: function (name) { if (enabled && SOUNDS[name]) { try { SOUNDS[name](); } catch (e) {} } },
    isEnabled: function () { return enabled; },
    toggle: function () {
      enabled = !enabled;
      try { localStorage.setItem('cttt.sound', enabled ? 'on' : 'off'); } catch (e) {}
      return enabled;
    }
  };
})(window);
