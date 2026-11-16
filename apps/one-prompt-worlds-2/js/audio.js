'use strict';
// 効果音と環境音はすべて WebAudio で合成（外部素材なし）
const Sound = (() => {
  let ac = null, master = null, noiseBuf = null, muted = false;
  const pours = {}; const last = {};
  const PENT = [0, 2, 4, 7, 9];
  const note = (i, base = 261.63) => base * Math.pow(2, (PENT[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5)) / 12);

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.7;
    const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const mk = (type, f, q) => {
      const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const gn = ac.createGain(); gn.gain.value = 0; src.connect(fl); fl.connect(gn); gn.connect(master); src.start();
      return { fl, gn };
    };
    pours.sand = mk('highpass', 3200, 0.5); pours.water = mk('bandpass', 1100, 1.2);
    pours.seed = mk('bandpass', 2400, 4); pours.ember = mk('bandpass', 700, 0.8);
    pours.fire = mk('lowpass', 520, 0.4);
    ambient();
  }
  function ok(key, gap) { if (!ac) return false; const t = ac.currentTime; if (key && last[key] && t - last[key] < gap) return false; if (key) last[key] = t; return true; }
  function tone(f, dur, vol, type = 'sine', when = 0, attack = 0.006, f2 = 0) {
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function burst(f, q, dur, vol, type = 'bandpass', when = 0) {
    const t = ac.currentTime + when, src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl); fl.connect(g); g.connect(master); src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
  }
  function bell(f, vol, when = 0, dur = 1.6) { tone(f, dur, vol, 'sine', when); tone(f * 2.01, dur * 0.6, vol * 0.3, 'sine', when); tone(f * 3.02, dur * 0.3, vol * 0.12, 'sine', when); }
  function ambient() {
    const loop = () => {
      if (!ac) return;
      if (!muted && ac.state === 'running') {
        const i = (Math.random() * 9 | 0) - 5;
        tone(note(i, 196), 7, 0.03, 'sine', 0, 2.5); tone(note(i + 2, 196) * 1.003, 6, 0.016, 'triangle', 0.4, 2.5);
        if (Math.random() < 0.5) for (let k = 0; k < 3; k++) tone(4300 + Math.random() * 300, 0.05, 0.006, 'sine', 1.5 + k * 0.09);
      }
      setTimeout(loop, 3500 + Math.random() * 3500);
    };
    loop();
  }
  return {
    init,
    get muted() { return muted; },
    setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.7; },
    frame(tool, pouring, cnt) {
      if (!ac) return; const t = ac.currentTime;
      for (const k of ['sand', 'water', 'seed', 'ember']) pours[k].gn.gain.setTargetAtTime(pouring && tool === k ? (k === 'water' ? 0.1 : k === 'sand' ? 0.07 : 0.09) : 0, t, 0.05);
      if (pouring && tool === 'water') pours.water.fl.frequency.setTargetAtTime(800 + Math.random() * 900, t, 0.04);
      pours.fire.gn.gain.setTargetAtTime(Math.min(0.2, cnt.burn * 0.004), t, 0.12);
      if (cnt.burn > 0 && Math.random() < Math.min(0.5, 0.05 + cnt.burn * 0.01)) burst(2500 + Math.random() * 3000, 2, 0.03, 0.06 + Math.random() * 0.06, 'highpass');
      if (cnt.grow > 0 && ok('grow', 0.07)) tone(note(Math.floor(cnt.growDepth / 4) % 15, 261.63), 0.22, 0.07, 'triangle');
      if (cnt.hiss > 0 && ok('hiss', 0.06)) burst(5200, 0.7, 0.3, Math.min(0.12, 0.03 + cnt.hiss * 0.02), 'highpass');
      if (cnt.drip > 0 && ok('drip', 0.09)) tone(1500 + Math.random() * 700, 0.09, 0.04, 'sine', 0, 0.003, 900);
      if (cnt.melt > 0 && ok('melt', 0.08)) tone(2200 + Math.random() * 1200, 0.12, 0.03, 'sine', 0, 0.002, 3200);
    },
    sprout() { if (ok('sprout', 0.1)) { tone(520, 0.12, 0.1, 'triangle', 0, 0.004, 780); tone(780, 0.2, 0.08, 'sine', 0.09, 0.004, 1040); } },
    feed(n) { if (ok('feed', 0.05)) tone(note(n + 3, 392), 0.3, 0.09, 'sine'); },
    bloom() { if (!ok()) return;[0, 2, 4, 5, 7].forEach((n, i) => bell(note(n, 523.25), 0.12, i * 0.09)); burst(6000, 0.5, 0.6, 0.03, 'highpass'); },
    lit() { if (!ok()) return; bell(196, 0.2, 0, 2.2); bell(293.66, 0.12, 0.12, 2); burst(900, 0.6, 0.5, 0.1, 'bandpass'); },
    disc() { if (!ok()) return; tone(1318, 0.25, 0.07, 'sine', 0.25); tone(1760, 0.3, 0.07, 'sine', 0.36); tone(2637, 0.5, 0.05, 'sine', 0.47); },
    win() { if (!ok()) return;[0, 2, 4, 7, 5, 7, 9, 10].forEach((n, i) => bell(note(n, 392), 0.1, 0.7 + i * 0.13, 2)); },
    click() { if (ok('click', 0.03)) tone(880, 0.06, 0.05, 'triangle'); },
    select(i) { if (ok('sel', 0.03)) tone(note(i * 2, 523.25), 0.1, 0.06, 'triangle'); },
    empty() { if (ok('empty', 0.4)) tone(180, 0.12, 0.06, 'triangle', 0, 0.005, 120); },
  };
})();
