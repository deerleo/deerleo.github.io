// うしろのハニワ ― 音（すべて WebAudio で合成。外部素材なし）
(function () {
  'use strict';
  var ac = null, master = null, muted = false, ambTimer = 0, started = false;

  function ensure() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.8;
    master.connect(ac.destination);
    return true;
  }
  function out(pan) {
    if (ac.createStereoPanner) {
      var p = ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan || 0));
      p.connect(master); return p;
    }
    return master;
  }
  function tone(o) {
    // o: {f, f2, t(開始遅れ), dur, vol, type, pan, lp}
    var t0 = ac.currentTime + (o.t || 0), osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol, t0 + (o.att || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    var dest = out(o.pan);
    if (o.lp) { var fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; osc.connect(fl); fl.connect(g); }
    else osc.connect(g);
    g.connect(dest);
    osc.start(t0); osc.stop(t0 + o.dur + 0.05);
  }
  var noiseBuf = null;
  function noise(o) {
    // o: {t, dur, vol, f(帯域の中心), q, pan, type}
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var t0 = ac.currentTime + (o.t || 0), src = ac.createBufferSource(), g = ac.createGain(), fl = ac.createBiquadFilter();
    src.buffer = noiseBuf; src.loop = true;
    fl.type = o.type || 'bandpass'; fl.frequency.setValueAtTime(o.f, t0); fl.Q.value = o.q || 1;
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol, t0 + (o.att || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(fl); fl.connect(g); g.connect(out(o.pan));
    src.start(t0, Math.random() * 0.5); src.stop(t0 + o.dur + 0.05);
  }

  var YO = [293.7, 329.6, 392.0, 440.0, 493.9, 587.3, 659.3, 784.0]; // 陽音階ふう
  var S = {
    step: function () { tone({ f: 95, f2: 55, dur: 0.11, vol: 0.16 }); noise({ dur: 0.07, vol: 0.05, f: 700, q: 0.7 }); },
    back: function () { tone({ f: 80, f2: 50, dur: 0.12, vol: 0.14 }); noise({ dur: 0.08, vol: 0.05, f: 500, q: 0.7 }); },
    turn: function () { noise({ dur: 0.12, vol: 0.045, f: 1800, f2: 900, q: 0.8 }); },
    wait: function () { tone({ f: 520, dur: 0.06, vol: 0.03 }); },
    bump: function () { tone({ f: 70, f2: 45, dur: 0.14, vol: 0.2 }); noise({ dur: 0.05, vol: 0.06, f: 300 }); },
    // 赤が動く「ゴト」。pan は左右、vol は近さ、behind は後ろ（こもらせる）
    goto: function (pan, near, behind) {
      var v = 0.10 + 0.34 * near, lp = behind ? 520 : 1400;
      tone({ f: 150, f2: 62, dur: 0.13, vol: v, pan: pan, type: 'triangle', lp: lp });
      tone({ f: 118, f2: 50, dur: 0.16, vol: v * 0.9, pan: pan, type: 'triangle', lp: lp, t: 0.12 });
      noise({ dur: 0.05, vol: v * 0.35, f: behind ? 400 : 900, pan: pan });
      noise({ dur: 0.05, vol: v * 0.3, f: behind ? 350 : 800, pan: pan, t: 0.12 });
    },
    // 青があとずさる「コト」
    koto: function (pan, near) {
      var v = 0.07 + 0.2 * near;
      tone({ f: 420, f2: 300, dur: 0.07, vol: v, pan: pan, type: 'triangle' });
      tone({ f: 520, f2: 360, dur: 0.07, vol: v * 0.8, pan: pan, type: 'triangle', t: 0.08 });
    },
    stuck: function (pan) { tone({ f: 300, f2: 180, dur: 0.16, vol: 0.12, pan: pan, type: 'square', lp: 700 }); },
    wake: function () {
      tone({ f: 392, dur: 0.12, vol: 0.12, type: 'triangle' });
      tone({ f: 587.3, dur: 0.22, vol: 0.13, type: 'triangle', t: 0.1 });
    },
    settle: function () {
      [0, 2, 4, 5, 7].forEach(function (n, i) {
        tone({ f: YO[n], dur: 0.9, vol: 0.12, type: 'sine', t: i * 0.09 });
        tone({ f: YO[n] * 2, dur: 0.5, vol: 0.035, type: 'sine', t: i * 0.09 });
      });
      tone({ f: 73, f2: 55, dur: 0.6, vol: 0.3 });
    },
    door: function () {
      noise({ dur: 1.1, vol: 0.22, f: 160, f2: 70, q: 0.6, type: 'lowpass', att: 0.2 });
      tone({ f: 48, f2: 38, dur: 1.1, vol: 0.22, att: 0.2 });
    },
    exitopen: function () {
      noise({ dur: 1.3, vol: 0.18, f: 200, f2: 80, q: 0.6, type: 'lowpass', att: 0.2 });
      [0, 2, 5].forEach(function (n, i) { tone({ f: YO[n] * 2, dur: 1.4, vol: 0.07, t: 0.5 + i * 0.12 }); });
    },
    gem: function () {
      [5, 7, 6, 7].forEach(function (n, i) { tone({ f: YO[n] * 2, dur: 0.3, vol: 0.09, t: i * 0.07, type: 'triangle' }); });
    },
    caught: function () {
      tone({ f: 620, f2: 180, dur: 0.3, vol: 0.2, type: 'triangle' });
      tone({ f: 90, f2: 45, dur: 0.35, vol: 0.35, t: 0.26 });
      noise({ dur: 0.12, vol: 0.14, f: 500, t: 0.26 });
    },
    undo: function () { tone({ f: 500, f2: 720, dur: 0.09, vol: 0.06, type: 'triangle' }); },
    clear: function () {
      [0, 2, 4, 2, 5, 7].forEach(function (n, i) { tone({ f: YO[n], dur: 0.5, vol: 0.13, type: 'triangle', t: i * 0.14 }); });
      tone({ f: YO[0] / 2, dur: 1.4, vol: 0.12, t: 0.84 });
    },
    ui: function () { tone({ f: 660, dur: 0.07, vol: 0.07, type: 'triangle' }); }
  };

  // 環境音：低いうなりと、ときどき鳴る土笛ふうの音・しずく
  function startAmbient() {
    if (started || !ac) return;
    started = true;
    [55, 82.6].forEach(function (f, i) {
      var o = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.value = 0.035;
      l.frequency.value = 0.07 + i * 0.05; lg.gain.value = 0.02;
      l.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(master); o.start(); l.start();
    });
    var phrase = function () {
      if (!muted && document.visibilityState !== 'hidden') {
        if (Math.random() < 0.45) {
          tone({ f: 1400 + Math.random() * 900, f2: 700, dur: 0.09, vol: 0.03, pan: Math.random() * 2 - 1 });
        } else {
          var n = 1 + ((Math.random() * 3) | 0), base = (Math.random() * 5) | 0, t = 0;
          for (var i = 0; i < n; i++) {
            var idx = Math.max(0, Math.min(7, base + ((Math.random() * 3) | 0) - 1));
            var dur = 0.9 + Math.random() * 0.9;
            tone({ f: YO[idx] / 2, dur: dur, vol: 0.035, type: 'sine', t: t, att: 0.12, pan: Math.random() - 0.5 });
            tone({ f: YO[idx], dur: dur * 0.7, vol: 0.008, type: 'triangle', t: t, att: 0.15 });
            t += dur * 0.7;
          }
        }
      }
      ambTimer = setTimeout(phrase, 3500 + Math.random() * 6500);
    };
    ambTimer = setTimeout(phrase, 2500);
  }

  window.HB_AUDIO = {
    unlock: function () { if (ensure()) startAmbient(); },
    play: function (name, a, b, c) {
      if (!ac || muted) return;
      try { S[name](a, b, c); } catch (e) { /* 音の失敗でゲームを止めない */ }
    },
    toggleMute: function () {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.8;
      return muted;
    },
    isMuted: function () { return muted; }
  };
})();
