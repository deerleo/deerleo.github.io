/* audio.js — every sound in the game is synthesized here at runtime. No samples, no network. */
(() => {
  'use strict';
  const BD = (window.BD = window.BD || {});

  /* ================================================================ state */
  let ac = null;
  let master, musicBus, musicDuck, musicFilter, musicVol, musicRev, sfxBus, sfxVol, sfxRev;
  let noiseBuf = null, crackleBuf = null, tremLfo = null;
  let volMusic = 0.7, volSfx = 0.85;
  let pending = null;        // music request made before init()
  let curName = null;
  let players = [];
  let inten = 0, intenTarget = 0;
  let timer = null, hidden = false, lastBlip = -1;
  const lastAt = {}, warned = {};
  const MUSIC_GAIN = 0.5, SFX_GAIN = 0.72;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  /** 'C#4' -> midi number (C4 = 60) */
  function nn(s) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
    if (!m) return null;
    return SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
  }
  function warnOnce(key, e) {
    if (warned[key]) return;
    warned[key] = 1;
    if (typeof console !== 'undefined') console.warn('[audio] ' + key, e || '');
  }

  /* ========================================================= node helpers */
  function G(v = 1) { const g = ac.createGain(); g.gain.value = v; return g; }
  function F(type, freq, q = 0.7) {
    const f = ac.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    return f;
  }
  /** started oscillator; caller must .stop() it */
  function O(type, freq, t0) {
    const o = ac.createOscillator();
    o.type = type; o.frequency.value = freq; o.start(t0);
    return o;
  }
  /** looping white noise from the one shared buffer */
  function N(t0, t1, rate = 1) {
    const s = ac.createBufferSource();
    s.buffer = noiseBuf; s.loop = true; s.playbackRate.value = rate;
    s.start(t0, Math.random() * 1.5); s.stop(t1);
    return s;
  }
  function chain(...nodes) {
    for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
    return nodes[nodes.length - 1];
  }
  /** when `src` finishes, unhook the nodes it was feeding */
  function fin(src, ...nodes) {
    src.onended = () => { for (const n of nodes) { try { n.disconnect(); } catch (e) { /* already gone */ } } };
  }
  /** percussive envelope: quick attack, exponential fall to silence */
  function perc(p, t, peak, dec, att = 0.002) {
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(Math.max(peak, 0.0002), t + att);
    p.exponentialRampToValueAtTime(0.0001, t + att + dec);
  }
  /** sustained envelope; returns the time it is safe to stop the sources */
  function adsr(p, t, peak, a, d, s, dur, r) {
    const off = t + Math.max(a + 0.01, dur);
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    p.setTargetAtTime(Math.max(peak * s, 0.0001), t + a, d / 3);
    p.setTargetAtTime(0.0001, off, r / 3);
    return off + r * 1.8;
  }
  function glide(p, t, f0, f1, dur) {
    p.setValueAtTime(Math.max(1, f0), t);
    p.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  }
  /**
   * Filtered noise burst. `f` is a frequency, [from, to] or [from, peak, to].
   * Returns the envelope gain (already connected to dst) so it can feed a reverb send too.
   */
  function burst(t, dst, type, f, q, peak, dec, att = 0.002) {
    const arr = Array.isArray(f);
    const n = N(t, t + att + dec + 0.03), fl = F(type, arr ? f[0] : f, q), g = G(0);
    if (arr) {
      const end = t + att + dec;
      fl.frequency.setValueAtTime(f[0], t);
      if (f.length === 2) fl.frequency.exponentialRampToValueAtTime(f[1], end);
      else {
        fl.frequency.exponentialRampToValueAtTime(f[1], t + (att + dec) * 0.4);
        fl.frequency.exponentialRampToValueAtTime(f[2], end);
      }
    }
    perc(g.gain, t, peak, dec, att);
    n.connect(fl); fl.connect(g); g.connect(dst);
    fin(n, g);
    g.src = n;
    return g;
  }
  /** single oscillator ping with optional pitch glide to f1 over gl seconds */
  function ping(t, dst, type, f, peak, dec, att = 0.002, f1 = 0, gl = 0) {
    const o = O(type, f, t), g = G(0);
    o.stop(t + att + dec + 0.03);
    if (f1) glide(o.frequency, t, f, f1, gl || dec);
    perc(g.gain, t, peak, dec, att);
    o.connect(g); g.connect(dst);
    fin(o, g);
    g.src = o;
    return g;
  }
  const curves = {};
  function shaper(drive) {
    let c = curves[drive];
    if (!c) {
      c = curves[drive] = new Float32Array(1024);
      const k = Math.tanh(drive);
      for (let i = 0; i < 1024; i++) c[i] = Math.tanh(drive * (i / 511.5 - 1)) / k;
    }
    const w = ac.createWaveShaper();
    w.curve = c;
    return w;
  }
  function comp(thr, knee, ratio, att, rel) {
    const c = ac.createDynamicsCompressor();
    c.threshold.value = thr; c.knee.value = knee; c.ratio.value = ratio; c.attack.value = att; c.release.value = rel;
    return c;
  }
  function rampTo(param, v, now, secs) {
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
    else { const cur = param.value; param.cancelScheduledValues(now); param.setValueAtTime(cur, now); }
    param.linearRampToValueAtTime(v, now + secs);
  }
  function wake() {
    if (ac && ac.state === 'suspended' && !hidden && ac.resume) {
      const p = ac.resume();
      if (p && p.catch) p.catch(() => {});
    }
  }

  /* ============================================================== buffers */
  function makeNoise() {
    const len = Math.floor(ac.sampleRate * 2), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  /** dusty record surface: sparse pops over a faint hiss */
  function makeCrackle() {
    const sr = ac.sampleRate, len = Math.floor(sr * 3.7), b = ac.createBuffer(1, len, sr), d = b.getChannelData(0);
    let pop = 0, hiss = 0;
    for (let i = 0; i < len; i++) {
      const r = Math.random();
      if (r < 0.00035) pop = (Math.random() * 2 - 1) * (0.25 + Math.random() * 0.75);
      else if (r < 0.004) pop += (Math.random() * 2 - 1) * 0.1;
      hiss += 0.35 * (Math.random() * 2 - 1 - hiss);
      d[i] = pop + hiss * 0.03;
      pop *= 0.55;
    }
    return b;
  }
  /** small warm room: decaying noise that darkens over time, plus a few early reflections */
  function makeIR() {
    const sr = ac.sampleRate, len = Math.floor(sr * 1.9), b = ac.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / sr;
        const env = Math.exp(-t * 3.4) * Math.min(1, t / 0.012);
        const k = 0.75 * Math.exp(-t * 2.2) + 0.08;
        lp += k * (Math.random() * 2 - 1 - lp);
        d[i] = lp * env;
      }
      for (let r = 0; r < 6; r++) {
        const at = Math.floor(sr * (0.007 + Math.random() * 0.05));
        d[at] += (Math.random() < 0.5 ? -1 : 1) * (0.5 - r * 0.06);
      }
      // unit energy, so a send of 0.3 really means "30% as loud as the dry signal"
      let e = 0;
      for (let i = 0; i < len; i++) e += d[i] * d[i];
      const k = 1 / Math.sqrt(e || 1);
      for (let i = 0; i < len; i++) d[i] *= k;
    }
    return b;
  }
  function reverb(ir) {
    const c = ac.createConvolver();
    c.normalize = false;   // we normalized the impulse ourselves; browsers disagree about theirs
    c.buffer = ir;
    return c;
  }
  /** Karplus-Strong plucked string, rendered once per pitch and cached */
  const ksCache = new Map();
  function ksBuffer(m, kind) {
    const key = kind + m;
    let e = ksCache.get(key);
    if (e) return e;
    const sr = ac.sampleRate, f = mtof(m), shami = kind === 'shami';
    const n = Math.max(2, Math.round(sr / f - 0.5));
    const len = Math.floor(sr * (shami ? 0.8 : m > 76 ? 1.1 : 1.9));
    const b = ac.createBuffer(1, len, sr), d = b.getChannelData(0);
    const bright = shami ? 0.95 : 0.55, rho = shami ? 0.986 : 0.9968;
    let lp = 0, mean = 0;
    for (let i = 0; i < n && i < len; i++) { lp += bright * (Math.random() * 2 - 1 - lp); d[i] = lp; mean += lp; }
    mean /= n;
    let peak = 0;
    for (let i = 0; i < n && i < len; i++) { d[i] -= mean; peak = Math.max(peak, Math.abs(d[i])); }
    for (let i = n; i < len; i++) d[i] = rho * 0.5 * (d[i - n] + (i - n - 1 >= 0 ? d[i - n - 1] : 0));
    const k = 0.9 / (peak || 1), fade = Math.min(600, len);
    for (let i = 0; i < len; i++) d[i] *= k;
    for (let i = 0; i < fade; i++) d[len - 1 - i] *= i / fade;
    // the averaging filter adds half a sample of delay; correct the tuning with playback rate
    e = { b, rate: f / (sr / (n + 0.5)) };
    ksCache.set(key, e);
    return e;
  }

  /* ================================================================ drums */
  /* Every voice takes a bus B = { d: dry in, w: light reverb send, ww: heavy reverb send, k?: keys bus } */
  const Drum = {
    kick(t, v, B) {
      const o = O('sine', 150, t), g = G(0);
      o.stop(t + 0.42);
      glide(o.frequency, t, 158, 46, 0.11);
      perc(g.gain, t, 0.92 * v, 0.3, 0.003);
      o.connect(g); g.connect(B.d);
      const c = ping(t, B.d, 'triangle', 1100, 0.22 * v, 0.02, 0.001, 200, 0.02);
      fin(o, g, c);
    },
    snare(t, v, B) {
      const n = N(t, t + 0.26), hp = F('highpass', 950, 0.6), lp = F('lowpass', 7200, 0.6), g = G(0);
      perc(g.gain, t, 0.42 * v, 0.17, 0.002);
      chain(n, hp, lp, g); g.connect(B.d); g.connect(B.w);
      fin(n, g);
      ping(t, B.d, 'triangle', 236, 0.38 * v, 0.1, 0.002, 172, 0.06);
      ping(t, B.d, 'sine', 331, 0.16 * v, 0.06, 0.002);
    },
    hat(t, v, B, open) {
      const dec = open ? 0.26 : 0.038;
      const n = N(t, t + dec + 0.04, rnd(0.9, 1.1)), hp = F('highpass', 7000, 0.7), pk = F('peaking', 9600, 1.4), lp = F('lowpass', 11500, 0.5), g = G(0);
      pk.gain.value = 6;
      perc(g.gain, t, (open ? 0.19 : 0.2) * v, dec, 0.001);
      chain(n, hp, pk, lp, g); g.connect(B.d);
      fin(n, g);
    },
    ohat(t, v, B) { Drum.hat(t, v, B, true); },
    rim(t, v, B) {
      ping(t, B.d, 'triangle', 830, 0.4 * v, 0.035, 0.001).connect(B.w);
      ping(t, B.d, 'square', 1650, 0.05 * v, 0.02, 0.001);
      burst(t, B.d, 'bandpass', 1900, 3, 0.28 * v, 0.018, 0.0005);
    },
    clap(t, v, B) {
      const n = N(t, t + 0.22), bp = F('bandpass', 1250, 1.1), g = G(0), pk = Math.max(0.55 * v, 0.0005);
      g.gain.setValueAtTime(0.0001, t);
      for (let i = 0; i < 3; i++) {
        g.gain.setValueAtTime(pk, t + i * 0.011);
        g.gain.exponentialRampToValueAtTime(pk * 0.2, t + i * 0.011 + 0.009);
      }
      g.gain.setValueAtTime(pk, t + 0.033);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
      chain(n, bp, g); g.connect(B.d); g.connect(B.w);
      fin(n, g);
    },
    taiko(t, v, B, low) {
      const f0 = low ? 96 : 132, f1 = low ? 43 : 66, dec = low ? 1.2 : 0.62;
      ping(t, B.d, 'sine', f0 * 1.25, 0.66 * v, dec, 0.003, f1, 0.15).connect(B.w);
      ping(t, B.d, 'sine', f1 * 1.59, 0.2 * v, 0.24, 0.003);
      burst(t, B.d, 'lowpass', 720, 0.8, 0.4 * v, 0.065, 0.001).connect(B.w);
      burst(t, B.d, 'bandpass', 2500, 1.2, 0.13 * v, 0.014, 0.0005);
    },
    odaiko(t, v, B) { Drum.taiko(t, v, B, true); },
    shaker(t, v, B) { burst(t, B.d, 'highpass', 5200, 0.6, 0.16 * v, 0.045, 0.012); },
    tom(t, v, B) {
      ping(t, B.d, 'sine', 178, 0.5 * v, 0.24, 0.003, 96, 0.16).connect(B.w);
      burst(t, B.d, 'lowpass', 900, 0.8, 0.15 * v, 0.03, 0.001);
    },
    crash(t, v, B) {
      const n = N(t, t + 1.5), hp = F('highpass', 4200, 0.5), pk = F('peaking', 8000, 1), g = G(0);
      pk.gain.value = 5;
      perc(g.gain, t, 0.3 * v, 1.3, 0.003);
      chain(n, hp, pk, g); g.connect(B.d); g.connect(B.w);
      fin(n, g);
    },
    wood(t, v, B) {
      ping(t, B.d, 'sine', 1120, 0.32 * v, 0.045, 0.001).connect(B.w);
      ping(t, B.d, 'sine', 1690, 0.13 * v, 0.03, 0.001);
      burst(t, B.d, 'bandpass', 2600, 1.5, 0.12 * v, 0.012, 0.0005);
    },
  };

  /* ============================================================ melodic */
  const Mel = {
    /** round finger bass */
    bass(t, m, dur, v, B) {
      const f = mtof(m), lp = F('lowpass', 1000, 1.4), g = G(0);
      const end = adsr(g.gain, t, 0.3 * v, 0.006, 0.3, 0.65, dur, 0.07);
      lp.frequency.setValueAtTime(1300, t);
      lp.frequency.exponentialRampToValueAtTime(280, t + 0.25);
      const a = O('sawtooth', f, t), b = O('sine', f, t), ag = G(0.42);
      a.stop(end); b.stop(end);
      a.connect(ag); ag.connect(lp); b.connect(lp); lp.connect(g); g.connect(B.d);
      fin(a, g);
    },
    /** palm-muted bass thunk for sneaking */
    mbass(t, m, dur, v, B) {
      const f = mtof(m), lp = F('lowpass', 520, 2), g = G(0);
      lp.frequency.setValueAtTime(950, t);
      lp.frequency.exponentialRampToValueAtTime(240, t + 0.09);
      perc(g.gain, t, 0.6 * v, 0.15, 0.003);
      const a = O('triangle', f, t), b = O('sawtooth', f, t), bg = G(0.3);
      a.stop(t + 0.2); b.stop(t + 0.2);
      a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(B.d);
      fin(a, g);
    },
    /** 808-style sub with a little saturation so it survives laptop speakers */
    sub(t, m, dur, v, B) {
      const f = mtof(m), o = O('sine', f, t), sh = shaper(1.8), lp = F('lowpass', 1700, 0.5), g = G(0);
      const dec = Math.max(0.28, dur * 1.15);
      o.frequency.setValueAtTime(f * 1.7, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
      perc(g.gain, t, 0.58 * v, dec, 0.005);
      o.stop(t + dec + 0.05);
      chain(o, sh, lp, g); g.connect(B.d);
      fin(o, g);
    },
    /** growling distorted bass */
    dbass(t, m, dur, v, B) {
      const f = mtof(m), lp = F('lowpass', 420, 4), sh = shaper(4), lp2 = F('lowpass', 1500, 0.5), g = G(0);
      const end = adsr(g.gain, t, 0.22 * v, 0.01, 0.3, 0.75, dur, 0.1);
      lp.frequency.setValueAtTime(950, t);
      lp.frequency.exponentialRampToValueAtTime(300, t + 0.3);
      const a = O('sawtooth', f, t), b = O('sawtooth', f * 1.007, t);
      a.stop(end); b.stop(end);
      a.connect(lp); b.connect(lp); chain(lp, sh, lp2, g); g.connect(B.d);
      fin(a, g);
    },
    /** FM electric piano: the modulation index decays, so hard notes bark and then mellow */
    rhodes(t, m, dur, v, B) {
      const f = mtof(m), g = G(0), out = B.k || B.d;
      const end = adsr(g.gain, t, 0.15 * v, 0.004, 0.7, 0.4, dur, 0.28);
      const car = O('sine', f, t), mod = O('sine', f, t), mg = G(0), car2 = O('sine', f * 1.003, t), c2 = G(0.5);
      mg.gain.setValueAtTime(f * (0.6 + 1.3 * v), t);
      mg.gain.exponentialRampToValueAtTime(f * 0.18, t + 0.5);
      mod.connect(mg); mg.connect(car.frequency);
      car.connect(g); car2.connect(c2); c2.connect(g);
      car.stop(end); mod.stop(end); car2.stop(end);
      g.connect(out);
      fin(car, g);
      ping(t, out, 'sine', f * 4.02, 0.03 * v, 0.09, 0.002);   // the tine
    },
    /** clavinet through an envelope "wah" */
    clav(t, m, dur, v, B) {
      const f = mtof(m), lp = F('lowpass', 600, 5), g = G(0);
      const dec = clamp(dur, 0.12, 0.3);
      lp.frequency.setValueAtTime(500, t);
      lp.frequency.exponentialRampToValueAtTime(3400, t + 0.018);
      lp.frequency.exponentialRampToValueAtTime(800, t + 0.16);
      perc(g.gain, t, 0.2 * v, dec, 0.003);
      const a = O('sawtooth', f, t), b = O('square', f * 0.997, t), bg = G(0.4);
      a.stop(t + dec + 0.04); b.stop(t + dec + 0.04);
      a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(B.d);
      fin(a, g);
    },
    /** two detuned saws: spiccato string machine, or a slow dark pad when soft */
    strings(t, m, dur, v, B, soft) {
      const f = mtof(m), lp = F('lowpass', soft ? 950 : 2700, 0.8), g = G(0);
      const end = adsr(g.gain, t, (soft ? 0.11 : 0.1) * v, soft ? 0.5 : 0.014, 0.25, 0.8, dur, soft ? 0.8 : 0.07);
      let last;
      for (const c of [-9, 8]) {
        last = O('sawtooth', f, t);
        last.detune.value = c; last.stop(end); last.connect(lp);
      }
      lp.connect(g); g.connect(B.d); g.connect(B.w);
      fin(last, g);
    },
    pad(t, m, dur, v, B) { Mel.strings(t, m, dur, v, B, true); },
    pizz(t, m, dur, v, B) {
      const f = mtof(m), lp = F('lowpass', 3200, 1), g = G(0);
      lp.frequency.setValueAtTime(Math.min(5000, f * 7), t);
      lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.3), t + 0.1);
      perc(g.gain, t, 0.38 * v, 0.26, 0.003);
      const a = O('triangle', f, t), b = O('sawtooth', f, t), bg = G(0.35);
      a.stop(t + 0.32); b.stop(t + 0.32);
      a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(B.d); g.connect(B.w);
      fin(a, g);
    },
    /** plucked string with the little pitch settle a koto has */
    koto(t, m, dur, v, B, kind) {
      const e = ksBuffer(m, kind || 'koto'), s = ac.createBufferSource(), lvl = Math.max(0.55 * v, 0.0005), g = G(lvl);
      const hold = Math.max(dur, kind === 'shami' ? 0.2 : 0.5);
      s.buffer = e.b; s.playbackRate.value = e.rate;
      if (s.detune) { s.detune.setValueAtTime(24, t); s.detune.linearRampToValueAtTime(0, t + 0.09); }
      g.gain.setValueAtTime(lvl, t);
      g.gain.setTargetAtTime(0.0001, t + hold, 0.18);
      s.start(t); s.stop(t + hold + 0.9);
      s.connect(g); g.connect(B.d); g.connect(B.w);
      fin(s, g);
      if (kind === 'shami') burst(t, B.d, 'bandpass', 1500, 1.5, 0.12 * v, 0.02, 0.0005);   // plectrum on skin
    },
    shami(t, m, dur, v, B) { Mel.koto(t, m, dur, v, B, 'shami'); },
    /** breathy bamboo flute: scooped attack, delayed vibrato, air noise riding on top */
    flute(t, m, dur, v, B) {
      const f = mtof(m), g = G(0), lp = F('lowpass', 3800, 0.5);
      const end = adsr(g.gain, t, 0.24 * v, 0.07, 0.3, 0.8, dur, 0.18);
      const a = O('sine', f, t), b = O('triangle', f * 2, t), bg = G(0.14);
      const lfo = O('sine', 5.2 + Math.random() * 0.5, t), lg = G(0), lg2 = G(2);
      a.frequency.setValueAtTime(f * 0.972, t); a.frequency.linearRampToValueAtTime(f, t + 0.09);
      b.frequency.setValueAtTime(f * 1.944, t); b.frequency.linearRampToValueAtTime(f * 2, t + 0.09);
      lg.gain.setValueAtTime(0, t + 0.14); lg.gain.linearRampToValueAtTime(f * 0.011, t + 0.5);
      lfo.connect(lg); lg.connect(a.frequency); lg.connect(lg2); lg2.connect(b.frequency);
      const n = N(t, end), bp = F('bandpass', Math.min(9000, f * 2.02), 1.6), ng = G(0);
      ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(0.55, t + 0.025); ng.gain.setTargetAtTime(0.11, t + 0.03, 0.07);
      a.connect(g); b.connect(bg); bg.connect(g); n.connect(bp); bp.connect(ng); ng.connect(g);
      a.stop(end); b.stop(end); lfo.stop(end);
      g.connect(lp); lp.connect(B.d); lp.connect(B.ww);
      fin(a, lp);
    },
    /** bright hero lead */
    lead(t, m, dur, v, B) {
      const f = mtof(m), lp = F('lowpass', 900, 2), g = G(0);
      const end = adsr(g.gain, t, 0.15 * v, 0.012, 0.2, 0.75, dur, 0.1);
      lp.frequency.setValueAtTime(700, t);
      lp.frequency.exponentialRampToValueAtTime(2800, t + 0.06);
      lp.frequency.setTargetAtTime(1900, t + 0.06, 0.2);
      const a = O('sawtooth', f, t), b = O('square', f, t), bg = G(0.45), lfo = O('sine', 5.6, t), lg = G(0);
      b.detune.value = 7;
      lg.gain.setValueAtTime(0, t + 0.16); lg.gain.linearRampToValueAtTime(f * 0.008, t + 0.4);
      lfo.connect(lg); lg.connect(a.frequency); lg.connect(b.frequency);
      a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(B.d); g.connect(B.w);
      a.stop(end); b.stop(end); lfo.stop(end);
      fin(a, g);
    },
    /** rubbery cartoon lead: every note boings up into pitch */
    goof(t, m, dur, v, B) {
      const f = mtof(m), lp = F('lowpass', 1900, 2.5), g = G(0);
      const end = adsr(g.gain, t, 0.15 * v, 0.006, 0.14, 0.55, dur, 0.06);
      const a = O('square', f, t), b = O('triangle', f * 2, t), bg = G(0.3);
      a.frequency.setValueAtTime(f * 0.93, t); a.frequency.exponentialRampToValueAtTime(f, t + 0.05);
      b.frequency.setValueAtTime(f * 1.86, t); b.frequency.exponentialRampToValueAtTime(f * 2, t + 0.05);
      a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(B.d); g.connect(B.w);
      a.stop(end); b.stop(end);
      fin(a, g);
    },
    /** FM bell; inharmonic and beating unless `clean` */
    bell(t, m, dur, v, B, clean) {
      const f = mtof(m), dec = Math.max(clean ? 0.7 : 1.3, dur * 1.5), g = G(0);
      const car = O('sine', f, t), mod = O('sine', f * (clean ? 4 : 3.51), t), mg = G(0);
      mg.gain.setValueAtTime(f * (clean ? 1.1 : 2.2), t);
      mg.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.6);
      perc(g.gain, t, 0.26 * v, dec, 0.003);
      mod.connect(mg); mg.connect(car.frequency); car.connect(g);
      car.stop(t + dec + 0.05); mod.stop(t + dec + 0.05);
      g.connect(B.d); g.connect(B.ww);
      fin(car, g);
      if (!clean) ping(t, B.ww, 'sine', f * 1.012, 0.12 * v, dec * 0.8, 0.003);
    },
    vibe(t, m, dur, v, B) { Mel.bell(t, m, dur, v, B, true); },
    /** soul horn section: three saws whose filter blooms open */
    horn(t, m, dur, v, B) {
      const f = mtof(m), lp = F('lowpass', 500, 1.2), g = G(0);
      const end = adsr(g.gain, t, 0.11 * v, 0.02, 0.15, 0.8, dur, 0.12);
      lp.frequency.setValueAtTime(480, t);
      lp.frequency.exponentialRampToValueAtTime(900 + 2300 * v, t + 0.055);
      lp.frequency.setTargetAtTime(1700, t + 0.06, 0.15);
      let last;
      for (const c of [-7, 0, 7]) {
        last = O('sawtooth', f, t);
        last.detune.value = c;
        last.frequency.setValueAtTime(f * 0.97, t); last.frequency.exponentialRampToValueAtTime(f, t + 0.04);
        last.stop(end); last.connect(lp);
      }
      lp.connect(g); g.connect(B.d); g.connect(B.w);
      fin(last, g);
    },
  };

  /* =============================================================== tracks */
  /*
   * chords: one per bar, 'bassRoot | voicing'.
   * Layers:  { d: drum }  16-step strings: X accent, x hit, o ghost, r/t = 2/3-stroke roll ( | and spaces ignored)
   *          { k: inst }  same strings; every hit plays the bar's voicing for `len` steps
   *          { m: inst }  'step note len [vel]' events; note = name, r±n (bar root), cK±n (chord tone K)
   * lvl [a, b]: layer gain at intensity 0 and 1.  g [i0, i1]: intensity window the layer fades in over.
   */
  const TRACKS = {
    /* sunset on the hill: wistful, a little proud */
    title: {
      bpm: 82, swing: 0.18, bars: 8, crackle: 0.55,
      chords: ['D2 | F3 A3 C4 E4', 'Bb1 | A3 C4 D4 F4', 'G1 | F3 A3 Bb3 D4', 'A1 | G3 C#4 F4',
        'D2 | A3 C4 E4 F4', 'Bb1 | A3 C4 D4 F4', 'G1 | Bb3 D4 F4 A4', 'C2 | Bb3 D4 F4 G4'],
      layers: [
        { k: 'rhodes', p: ['X...|....|..o.|....', 'X...|...o|..x.|....'], len: 6, strum: 0.014, lvl: [0.9, 1] },
        { m: 'sub', p: ['0 r 6, 10 r 3, 14 r+7 2', '0 r 5, 7 r+12 1, 10 r 4, 14 r+10 2'], lvl: [0.8, 1] },
        { d: 'kick', p: ['x...|....|..x.|....', 'x...|...x|..x.|....'], lvl: [0.55, 1] },
        { d: 'snare', p: ['....|x...|....|x...', '....|x...|....|x..o'], lvl: [0.5, 1] },
        { d: 'hat', p: ['x.x.|x.x.|x.x.|x.x.', 'x.x.|x.xo|x.x.|x.xo'], lvl: [0.35, 0.9] },
        { d: 'ohat', p: [null, null, null, '....|....|....|..x.'], lvl: [0.25, 0.7] },
        { m: 'flute', lvl: [0.8, 0.9], p: [
          '0 A4 3, 4 C5 2, 6 D5 7', '0 C5 2, 2 A4 2, 4 F4 8',
          '2 G4 2, 4 A4 2, 6 Bb4 4, 10 A4 2, 12 G4 3', '0 F4 5, 6 C#5 2, 8 A4 6',
          '0 D5 3, 4 F5 2, 6 E5 7', '0 D5 2, 2 C5 2, 4 A4 8',
          '2 Bb4 2, 4 D5 2, 6 C5 3, 10 A4 2, 12 G4 3', '0 G4 4, 4 F4 4, 8 D4 6'] },
        { m: 'koto', lvl: [0.5, 0.9], p: ['2 c0+12 2, 5 c2+12 2, 8 c1+12 2, 11 c3+12 3', null, '2 c1+12 2, 5 c3+12 2, 8 c2+12 3', null] },
      ],
    },
    /* the corkboard: head-nod, curious, a little sneaky */
    board: {
      bpm: 88, swing: 0.22, bars: 8, crackle: 0.6,
      chords: ['E2 | D3 F#3 G3 B3', 'A1 | G3 B3 C#4 F#4', 'C2 | E3 Bb3 D4', 'B1 | D#3 A3 D4',
        'E2 | G3 B3 D4 F#4', 'A1 | G3 C#4 F#4', 'F#1 | A3 C4 E4', 'B1 | D#3 A3 C4'],
      layers: [
        { k: 'rhodes', p: ['..x.|..x.|....|x...', '..x.|.x..|....|x.x.'], len: 2, strum: 0.008, lvl: [0.8, 1] },
        { m: 'bass', lvl: [0.8, 1], p: ['0 r 3, 3 r 1, 6 r+7 2, 10 r+12 1, 11 r+10 1, 14 r+7 2', '0 r 3, 4 r+12 1, 7 r+10 1, 8 r+7 2, 12 r+3 1, 14 r+5 2'] },
        { d: 'kick', p: ['x..x|....|..x.|....', 'x...|..x.|..x.|.x..'], lvl: [0.6, 1] },
        { d: 'snare', p: ['....|x...|....|x...', '....|x..o|....|x...'], lvl: [0.55, 1] },
        { d: 'hat', p: ['x.xx|x.x.|x.xx|x.x.'], lvl: [0.4, 0.9] },
        { d: 'shaker', p: ['xoxo|xoxo|xoxo|xoxo'], lvl: [0, 0.6], g: [0.4, 1] },
        { m: 'pizz', lvl: [0.6, 0.85], p: [
          '4 B4 1, 6 D5 1, 7 E5 2, 12 G5 1, 14 F#5 2', '6 E5 1, 8 C#5 2, 12 B4 3',
          '4 Bb4 1, 6 D5 1, 7 E5 2, 12 G5 1, 13 E5 2', '2 D#5 2, 6 D5 1, 8 B4 2, 12 A4 3',
          '4 B4 1, 6 D5 1, 7 F#5 2, 12 A5 1, 14 G5 2', '6 F#5 1, 8 E5 2, 12 C#5 3',
          '4 C5 1, 6 E5 1, 7 A5 2, 12 G5 1, 13 E5 2', '2 D#5 2, 6 C5 1, 8 A4 2, 10 F#4 1, 12 B4 3'] },
        { m: 'flute', lvl: [0.4, 0.6], p: [null, null, null, '10 D5 2, 12 D#5 4', null, null, null, '12 B5 4 .6'] },
      ],
    },
    /* a string quartet for rich people, until the drums show up */
    garden: {
      bpm: 104, swing: 0.1, bars: 8,
      chords: ['G2 | B3 D4 G4', 'F#2 | A3 C4 D4', 'E2 | G3 B3 E4', 'C2 | G3 C4 E4',
        'B1 | D4 G4 B4', 'A1 | G3 C4 E4', 'D2 | G3 A3 C4', 'D2 | F#3 A3 C4'],
      layers: [
        { m: 'pizz', vol: 1.5, pan: -0.3, lvl: [0.75, 0.65], p: ['0 c0 1, 2 c1 1, 4 c2 1, 6 c1 1, 8 c0 1, 10 c1 1, 12 c2 1, 14 c1 1'] },
        { m: 'pizz', vol: 1.6, pan: 0.1, lvl: [0.9, 0.8], p: ['0 r 2, 8 r+7 2', '0 r 2, 8 r+7 2, 12 r+12 1'] },
        { m: 'strings', gate: 0.5, vol: 1.7, pan: 0.3, lvl: [0.75, 0.85], p: [
          '0 D5 1, 2 G5 1, 4 B5 2, 8 A5 1, 10 G5 1, 12 D5 2', '0 C5 1, 2 F#5 1, 4 A5 2, 8 G5 1, 10 F#5 1, 12 D5 2',
          '0 B4 1, 2 E5 1, 4 G5 2, 8 F#5 1, 10 E5 1, 12 B4 2', '0 C5 1, 2 E5 1, 4 G5 1, 6 E5 1, 8 C6 2, 12 B5 1, 14 A5 1',
          '0 B5 2, 4 D6 1, 6 B5 1, 8 G5 2, 12 D5 2', '0 C6 2, 4 E6 1, 6 C6 1, 8 A5 2, 12 E5 2',
          '0 D5 1, 2 G5 1, 4 A5 1, 6 C6 1, 8 D6 4', '0 C6 1, 2 A5 1, 4 F#5 1, 6 D5 1, 8 F#5 1, 10 A5 1, 12 D6 1, 14 F#6 1'] },
        { d: 'kick', p: ['x...|..x.|..x.|....', 'x..x|..x.|..x.|..x.'], lvl: [0, 1], g: [0.25, 0.6] },
        { d: 'snare', p: ['....|x...|....|x...', '....|x...|....|x.xx'], lvl: [0, 1], g: [0.25, 0.6] },
        { d: 'hat', p: ['x.x.|x.x.|x.x.|x.x.', 'x.x.|x.xx|x.x.|x.xx'], lvl: [0, 0.9], g: [0.2, 0.6] },
        { d: 'clap', p: ['....|x...|....|x...'], lvl: [0, 0.7], g: [0.6, 1] },
        { d: 'crash', p: ['x...|....|....|....', null, null, null, null, null, null, null], lvl: [0, 0.8], g: [0.4, 0.8] },
        { m: 'sub', lvl: [0, 0.85], g: [0.4, 0.9], p: ['0 r 3, 6 r 2, 10 r 3, 14 r+7 2', '0 r 3, 6 r 2, 10 r+12 1, 12 r 3'] },
      ],
    },
    /* ink-wash duel: drum, plucked string, breath. The 808 only arrives when blades cross */
    ink: {
      bpm: 76, swing: 0.06, bars: 8,
      chords: ['D2 | D2 A2 D3', 'D2 | D2 A2 D3', 'D2 | D2 A2 D3', 'D2 | D2 A2 D3',
        'D2 | D2 A2 D3', 'Eb2 | Eb2 Bb2 Eb3', 'D2 | D2 A2 D3', 'A1 | A2 D3 A3'],
      layers: [
        { k: 'pad', p: ['x...|....|....|....'], len: 15, lvl: [0.7, 0.55] },
        { d: 'taiko', lvl: [0.75, 0.9], p: [
          'X...|....|....|o...', 'X...|....|x...|..o.', 'X...|....|....|o...', 'X...|..x.|x..x|.x.x',
          'X...|....|....|o...', 'X...|....|x...|..o.', 'X...|....|....|o...', 'X..x|..x.|x.x.|xxxx'] },
        { d: 'odaiko', p: ['X...|....|....|....', null, null, null], lvl: [0.6, 0.8] },
        { d: 'wood', lvl: [0.5, 0.7], p: [null, '....|....|....|..x.', null, '....|....|....|x.x.', null, '....|....|....|..x.', null, '....|....|x...|x.xx'] },
        { m: 'koto', lvl: [0.85, 0.9], p: [
          '0 D4 2, 2 A4 2, 4 Bb4 4, 10 A4 2, 12 G4 4', '0 A4 3, 3 Bb4 1, 4 A4 2, 6 G4 2, 8 Eb4 4, 12 D4 4',
          '0 D5 2, 2 Eb5 2, 4 D5 2, 6 Bb4 2, 8 A4 6', '0 G4 2, 2 A4 2, 4 Bb4 2, 6 D5 2, 8 Eb5 1, 9 D5 1, 10 Bb4 2, 12 A4 4',
          '0 D3 3, 4 A3 2, 8 D4 2, 12 A3 2', '0 Eb3 3, 4 Bb3 2, 8 Eb4 2, 12 Bb3 2',
          '0 D3 3, 4 A3 2, 8 D4 2, 12 G3 2', '0 A2 3, 4 A3 2, 8 Bb3 2, 10 A3 2, 12 G3 1, 13 A3 3'] },
        { m: 'flute', lvl: [0.7, 0.8], p: [null, null, null, null,
          '0 A4 6, 8 Bb4 2, 10 A4 6', '0 G4 4, 4 Eb4 10', '0 D5 5, 6 Eb5 2, 8 D5 2, 10 Bb4 2, 12 A4 4', '0 A4 12'] },
        { d: 'hat', p: ['x.x.|x.xr|x.x.|x.xt', 'x.x.|xrx.|x.x.|rrxx'], lvl: [0, 0.75], g: [0.35, 0.8] },
        { d: 'kick', p: ['x...|....|..x.|..x.', 'x...|..x.|..x.|....'], lvl: [0, 0.85], g: [0.35, 0.8] },
        { d: 'snare', p: ['....|....|x...|....', '....|....|x...|...o'], lvl: [0, 0.9], g: [0.35, 0.8] },
        { d: 'clap', p: ['....|....|x...|....'], lvl: [0, 0.6], g: [0.6, 1] },
        { m: 'sub', lvl: [0, 1], g: [0.4, 0.9], p: ['0 r 6, 10 r 3, 14 r 2', '0 r 4, 6 r+12 1, 8 r 5, 14 r+1 2'] },
      ],
    },
    /* sneaking through the lobby: lots of air, one nervous bass */
    stealth: {
      bpm: 92, swing: 0.1, bars: 8,
      chords: ['F#1 | A3 C#4 E4 G#4', 'F#1 | A3 C#4 E4 G#4', 'D2 | F#3 C4 E4', 'C#2 | F3 B3 E4',
        'F#1 | A3 C#4 E4 G#4', 'F#1 | A3 C#4 E4', 'G1 | F#3 B3 D4', 'C#2 | F3 B3 D4'],
      layers: [
        { m: 'mbass', oct: 12, lvl: [0.9, 1], p: [
          '0 r 1, 3 r 1, 6 r+12 1, 8 r 1, 11 r+10 1, 14 r+7 1', '0 r 1, 3 r 1, 6 r+12 1, 8 r 1, 11 r+10 1, 14 r+7 1',
          '0 r 1, 3 r 1, 6 r+12 1, 8 r 1, 11 r+10 1, 14 r+7 1', '0 r 1, 3 r 1, 6 r+12 1, 8 r 1, 10 r+3 1, 12 r+5 1, 14 r+6 1'] },
        { d: 'rim', p: ['....|x...|....|x...', '....|x..x|....|x.x.'], lvl: [0.7, 0.9] },
        { d: 'hat', p: ['..x.|..x.|..x.|..x.'], lvl: [0.3, 0.7] },
        { d: 'kick', p: ['x...|....|..x.|....', 'x...|....|.x..|....'], lvl: [0.35, 1] },
        { k: 'rhodes', p: [null, '....|....|....|..x.', null, '....|..x.|....|....'], len: 3, lvl: [0.9, 1] },
        { m: 'vibe', vol: 1.5, lvl: [0.45, 0.7], p: [null, null, '8 C5 1, 10 E5 1, 12 F#5 4', null, null, null, '8 B4 1, 10 D5 1, 12 F#5 2, 14 G5 2', null] },
        { d: 'shaker', p: ['xoxo|xoxo|xoxo|xoxo'], lvl: [0, 0.7], g: [0.45, 1] },
        { d: 'tom', p: [null, '....|....|....|..xx'], lvl: [0, 0.7], g: [0.5, 1] },
        { m: 'strings', gate: 0.6, vol: 1.4, lvl: [0, 0.6], g: [0.6, 1], p: ['0 c0 1, 2 c0 1, 4 c1 1, 6 c0 1, 8 c0 1, 10 c0 1, 12 c2 1, 14 c1 1'] },
      ],
    },
    /* kung-fu flick funk: breakbeat, wah clav, a bass that will not sit still */
    duel: {
      bpm: 112, swing: 0.12, bars: 8,
      chords: ['E2 | G3 B3 D4', 'E2 | G3 B3 D4', 'E2 | G3 B3 D4', 'A1 | G3 C#4 E4',
        'E2 | G3 B3 D4', 'E2 | G3 B3 D4', 'G1 | F3 B3 D4', 'B1 | D#3 A3 D4'],
      layers: [
        { d: 'kick', p: ['x.x.|....|..xx|....', 'x.x.|...x|..x.|....'], lvl: [0.6, 1] },
        { d: 'snare', p: ['....|x..o|.o..|x..o', '....|x..o|.o..|x.xx'], lvl: [0.55, 1] },
        { d: 'hat', p: ['x.x.|x.x.|x.x.|x.x.'], lvl: [0.4, 0.9] },
        { d: 'ohat', p: ['....|....|....|..x.'], lvl: [0.3, 0.7] },
        { k: 'clav', p: ['x..x|..x.|..x.|x...', '..x.|.x.x|..x.|..x.'], len: 1, vol: 1.15, lvl: [0.45, 0.9] },
        { m: 'bass', lvl: [0.7, 1], p: [
          '0 r 1, 2 r 1, 3 r+12 1, 6 r+10 1, 7 r+12 1, 10 r 1, 12 r+3 1, 13 r+5 1, 14 r+7 1',
          '0 r 1, 3 r 1, 4 r+7 1, 6 r+10 1, 8 r+12 2, 11 r+10 1, 12 r+7 1, 14 r+5 1, 15 r+3 1'] },
        { m: 'horn', vol: 1.4, lvl: [0, 0.85], g: [0.5, 1], p: [
          '0 E5 1, 2 E5 1, 3 G5 1, 6 A5 2, 10 G5 1, 12 E5 2', '0 D5 1, 2 E5 3, 8 B4 1, 10 D5 1, 12 E5 3',
          '0 E5 1, 2 E5 1, 3 G5 1, 6 A5 2, 10 G5 1, 12 E5 2', '0 A5 1, 2 A5 1, 3 C#6 1, 6 E6 2, 10 C#6 1, 12 A5 2',
          '0 E5 1, 2 E5 1, 3 G5 1, 6 A5 2, 10 G5 1, 12 E5 2', '0 D5 1, 2 E5 3, 8 B4 1, 10 D5 1, 12 E5 3',
          '0 G5 1, 2 B5 1, 4 D6 2, 8 F6 2, 12 D6 2', '0 D#6 2, 4 B5 2, 8 A5 1, 10 F#5 1, 12 D#5 1, 14 B4 1'] },
        { m: 'flute', lvl: [0.45, 0.6], p: [null, null, null, '8 E5 1, 9 G5 1, 10 A5 1, 11 B5 1, 12 D6 4', null, null, null, '8 B5 1, 9 A5 1, 10 F#5 1, 11 D#5 1, 12 B4 4'] },
        { d: 'wood', p: ['..x.|..x.|..x.|..x.'], lvl: [0, 0.5], g: [0.4, 0.9] },
        { d: 'crash', p: ['x...|....|....|....', null, null, null], lvl: [0, 0.6], g: [0.5, 1] },
      ],
    },
    /* two brothers, one house, no adults: bouncy and petty */
    house: {
      bpm: 98, swing: 0.2, bars: 8,
      chords: ['C2 | E3 Bb3 D4', 'C2 | E3 Bb3 D4', 'F2 | A3 C4 Eb4 G4', 'F2 | A3 C4 Eb4 G4',
        'C2 | E3 Bb3 D4', 'A1 | G3 C#4 E4', 'D2 | F#3 C4 E4', 'G1 | F3 B3 E4'],
      layers: [
        { k: 'rhodes', p: ['..x.|..x.|..x.|..x.', '..x.|..x.|.x..|x.x.'], len: 1, lvl: [0.8, 1] },
        { m: 'bass', lvl: [0.75, 1], p: [
          '0 r 2, 4 r+4 2, 8 r+7 2, 12 r+9 1, 14 r+10 2', '0 r 2, 4 r+4 2, 8 r+7 2, 12 r+9 1, 14 r+10 2',
          '0 r 2, 4 r+4 2, 8 r+7 2, 12 r+9 1, 14 r+10 2', '0 r 2, 3 r 1, 6 r+12 1, 8 r+7 2, 11 r+9 1, 12 r+10 2, 14 r+11 1'] },
        { d: 'kick', p: ['x..x|..x.|..x.|....', 'x..x|..x.|..x.|.x..'], lvl: [0.6, 1] },
        { d: 'snare', p: ['....|x...|....|x...'], lvl: [0.5, 1] },
        { d: 'clap', p: ['....|x...|....|x...'], lvl: [0.3, 0.8] },
        { d: 'hat', p: ['x.xx|x.xx|x.xx|x.xx'], lvl: [0.4, 0.85] },
        { d: 'wood', p: ['..x.|....|x.x.|....', '..x.|....|x.x.|..x.'], lvl: [0.4, 0.7] },
        { m: 'goof', lvl: [0.5, 0.85], p: [
          '0 G5 2, 3 G5 1, 4 E5 2, 8 A5 2, 10 G5 2, 12 E5 3', '4 C5 1, 6 D5 1, 8 E5 1, 10 G5 1, 12 Bb5 2, 14 A5 2',
          '0 A5 2, 3 A5 1, 4 F5 2, 8 C6 2, 10 A5 2, 12 G5 3', '4 Eb5 1, 6 F5 1, 8 G5 1, 10 A5 1, 12 C6 3',
          '0 G5 2, 3 G5 1, 4 E5 2, 8 A5 2, 10 G5 2, 12 E5 3', '0 E5 1, 2 G5 1, 4 A5 2, 8 C#6 2, 12 A5 3',
          '0 F#5 1, 2 A5 1, 4 C6 2, 8 E6 2, 12 D6 3', '0 D6 1, 2 B5 1, 4 G5 1, 6 F5 1, 8 E5 1, 10 D5 1, 12 B4 1, 14 G4 1'] },
      ],
    },
    /* something else is wearing Tom's body */
    possessed: {
      bpm: 90, swing: 0.04, bars: 8,
      chords: ['E1 | G3 B3 C4', 'E1 | G3 Bb3 E4', 'F1 | A3 C4 E4', 'B1 | D#3 A3 C4',
        'E1 | G3 B3 D#4', 'E1 | G3 Bb3 Db4', 'F1 | A3 C4 F4', 'F#1 | A3 C4 Eb4'],
      layers: [
        { k: 'pad', p: ['x...|....|....|....'], len: 15, lvl: [0.55, 0.5] },
        { m: 'bell', lvl: [0.6, 0.7], p: [
          '0 B4 4, 6 C5 6', '0 Bb4 4, 6 E5 2, 10 Db5 4', '0 C5 4, 6 E5 6', '0 D#5 4, 6 C5 2, 10 A4 4',
          '0 B4 2, 4 D#5 2, 8 G5 6', '0 Bb4 2, 4 Db5 2, 8 E5 6', '0 A4 2, 4 C5 2, 8 F5 6', '0 Eb5 4, 6 C5 2, 10 A4 2, 12 F#4 4'] },
        { m: 'strings', gate: 1, vol: 1.2, lvl: [0, 0.75], g: [0.3, 0.9], p: [
          '0 E3 2, 2 F3 2, 4 F#3 2, 6 G3 2, 8 G#3 2, 10 G3 2, 12 F#3 2, 14 F3 2',
          '0 E3 2, 2 F3 2, 4 F#3 2, 6 G3 2, 8 Bb3 4, 12 A3 2, 14 G#3 2',
          '0 A3 2, 2 Bb3 2, 4 B3 2, 6 C4 2, 8 C#4 2, 10 C4 2, 12 B3 2, 14 Bb3 2',
          '0 A3 2, 2 G#3 2, 4 G3 2, 6 F#3 2, 8 F3 4, 12 D#3 4'] },
        { m: 'dbass', lvl: [0.5, 1], p: ['0 r 6, 10 r 2, 13 r+1 3', '0 r 6, 8 r+12 1, 10 r 3, 14 r+6 2'] },
        { d: 'kick', p: ['x...|....|..x.|....', 'x...|...x|..x.|..x.'], lvl: [0.5, 1] },
        { d: 'snare', p: ['....|....|X...|....'], lvl: [0.4, 1] },
        { d: 'clap', p: ['....|....|x...|....'], lvl: [0, 0.6], g: [0.5, 1] },
        { d: 'hat', p: ['x.x.|x.x.|x.x.|x.x.', 'x.x.|x.xr|x.x.|x.rr'], lvl: [0, 0.7], g: [0.3, 0.8] },
        { d: 'tom', p: [null, null, null, '....|....|....|x.xx'], lvl: [0.3, 0.8] },
        { d: 'odaiko', p: ['X...|....|....|....', null], lvl: [0.5, 0.8] },
      ],
    },
    /* the Hateocracy: everything at once */
    finale: {
      bpm: 118, swing: 0.08, bars: 8,
      chords: ['D2 | D4 F4 A4', 'Bb1 | D4 F4 Bb4', 'C2 | E4 G4 C5', 'A1 | E4 A4 C5',
        'D2 | F4 A4 D5', 'Bb1 | F4 Bb4 D5', 'G1 | G4 Bb4 D5', 'A1 | E4 A4 C#5'],
      layers: [
        { m: 'strings', gate: 0.7, vol: 1.5, lvl: [0.6, 0.85], p: [
          '0 c0 1, 1 c0 1, 2 c1 1, 3 c0 1, 4 c2 1, 5 c0 1, 6 c1 1, 7 c0 1, 8 c0 1, 9 c0 1, 10 c1 1, 11 c0 1, 12 c2 1, 13 c1 1, 14 c2 1, 15 c1 1'] },
        { m: 'bass', lvl: [0.7, 1], p: ['0 r 2, 3 r 1, 6 r 2, 8 r 2, 11 r 1, 14 r+12 2'] },
        { m: 'sub', lvl: [0, 0.9], g: [0.5, 1], p: ['0 r 6, 8 r 6'] },
        { d: 'taiko', lvl: [0.6, 0.85], p: ['X..x|..x.|X..x|..x.', 'X..x|..x.|X..x|..x.', 'X..x|..x.|X..x|..x.', 'X..x|..x.|x.x.|xxxx'] },
        { d: 'odaiko', p: ['X...|....|....|....', null, null, null], lvl: [0.7, 1] },
        { d: 'kick', p: ['x...|..x.|..x.|.x..'], lvl: [0, 1], g: [0.3, 0.7] },
        { d: 'snare', p: ['....|x..o|.o..|x..o', '....|x..o|.o..|x.xx'], lvl: [0, 1], g: [0.3, 0.7] },
        { d: 'hat', p: ['Xxxx|Xxxx|Xxxx|Xxxx'], lvl: [0, 0.7], g: [0.35, 0.8] },
        { d: 'crash', p: ['x...|....|....|....', null, null, null], lvl: [0, 0.8], g: [0.3, 0.7] },
        { m: 'lead', lvl: [0, 0.9], g: [0.55, 1], p: [
          '0 D5 3, 4 F5 2, 6 A5 6, 12 G5 2, 14 F5 2', '0 D5 3, 4 F5 2, 6 Bb5 6, 12 A5 2, 14 G5 2',
          '0 E5 3, 4 G5 2, 6 C6 6, 12 Bb5 2, 14 A5 2', '0 A5 8, 8 E5 4, 12 C5 4',
          '0 D5 3, 4 F5 2, 6 A5 4, 10 D6 6', '0 D6 3, 4 C6 2, 6 Bb5 6, 12 A5 2, 14 Bb5 2',
          '0 D6 4, 4 Bb5 4, 8 G5 4, 12 Bb5 4', '0 A5 6, 6 C#6 2, 8 E6 8'] },
        { m: 'koto', lvl: [0.7, 0.8], p: ['0 c0+12 2, 6 c2+12 2, 12 c1+12 2', '0 c1+12 2, 6 c0+12 2, 10 c2+12 2'] },
      ],
    },
    /* roll credits: warm, resolved */
    credits: {
      bpm: 86, swing: 0.2, bars: 8, crackle: 0.6,
      chords: ['Eb2 | G3 Bb3 D4 F4', 'C2 | Eb3 G3 Bb3 D4', 'Ab1 | G3 Bb3 C4 Eb4', 'Bb1 | Ab3 C4 Eb4',
        'Eb2 | G3 Bb3 D4 F4', 'G1 | F3 Bb3 D4', 'Ab1 | G3 C4 Eb4', 'Bb1 | Ab3 C4 Eb4 G4'],
      layers: [
        { k: 'rhodes', p: ['X...|..x.|..x.|....', 'X..x|....|..x.|..x.'], len: 5, strum: 0.016, lvl: [0.9, 1] },
        { m: 'bass', lvl: [0.8, 1], p: ['0 r 4, 6 r+7 2, 10 r+12 2, 13 r+7 1, 14 r+9 2', '0 r 3, 3 r 1, 6 r+12 2, 10 r+7 3, 14 r+5 2'] },
        { d: 'kick', p: ['x...|..x.|..x.|....', 'x..x|....|..x.|.x..'], lvl: [0.7, 1] },
        { d: 'snare', p: ['....|x...|....|x...', '....|x...|.o..|x...'], lvl: [0.65, 1] },
        { d: 'hat', p: ['x.x.|x.x.|x.x.|x.x.', 'x.x.|x.xo|x.x.|x.xo'], lvl: [0.45, 0.9] },
        { d: 'ohat', p: [null, '....|....|....|..x.'], lvl: [0.3, 0.6] },
        { m: 'flute', lvl: [0.7, 0.8], p: [
          '0 Bb4 3, 4 G4 2, 6 Bb4 2, 8 D5 6', '0 Eb5 2, 2 D5 2, 4 Bb4 4, 10 G4 4',
          '0 C5 3, 4 Eb5 2, 6 G5 6, 12 F5 2, 14 Eb5 2', '0 F5 6, 8 Eb5 2, 10 C5 4',
          '0 Bb4 3, 4 G4 2, 6 Bb4 2, 8 F5 6', '0 D5 2, 2 F5 2, 4 Bb5 6, 12 G5 4',
          '0 Eb5 3, 4 C5 2, 6 Eb5 2, 8 G5 4, 12 Ab5 4', '0 G5 4, 4 F5 4, 8 Eb5 8'] },
        { m: 'koto', lvl: [0.8, 0.9], p: [null, '10 c2+12 1, 12 c3+12 1, 14 c1+12 2', null, '8 c0+12 1, 10 c1+12 1, 12 c2+12 3'] },
      ],
    },
  };

  /* ------------------------------------------------------ pattern compile */
  const DRUM_VEL = { X: 1, x: 0.78, o: 0.4, r: 0.72, t: 0.72 };
  /* where each instrument sits unless a layer says otherwise; kick, snare and bass stay centred */
  const PAN = { hat: 0.25, ohat: 0.25, shaker: -0.3, wood: 0.35, rim: -0.2, clap: -0.12, tom: -0.3, crash: 0.2,
    koto: -0.3, shami: -0.3, flute: 0.22, clav: -0.25, horn: 0.2, vibe: 0.3, bell: -0.25, goof: 0.15, lead: 0.12, pizz: -0.2, strings: 0.18 };
  function parseNote(s) {
    let m;
    if ((m = /^r([+-]\d+)?$/.exec(s))) return { r: m[1] ? parseInt(m[1], 10) : 0 };
    if ((m = /^c(\d)([+-]\d+)?$/.exec(s))) return { c: parseInt(m[1], 10), o: m[2] ? parseInt(m[2], 10) : 0 };
    const n = nn(s);
    return { a: n === null ? 60 : n, bad: n === null };
  }
  function compile(T) {
    if (T._c) return T;
    T.cho = T.chords.map((s) => {
      const parts = s.split('|');
      return { root: nn(parts[0].trim()), notes: parts[1].trim().split(/\s+/).map(nn) };
    });
    for (const L of T.layers) {
      L.kind = L.d ? 'drum' : L.k ? 'keys' : 'mel';
      L.inst = L.d || L.k || L.m;
      if (L.vol === undefined) L.vol = 1;
      if (L.pan === undefined) L.pan = PAN[L.inst] || 0;
      L.ev = L.p.map((bar) => {
        if (!bar) return null;
        const steps = new Array(16).fill(null);
        if (L.kind === 'mel') {
          for (const tok of bar.split(',')) {
            const a = tok.trim().split(/\s+/);
            if (a.length < 3) continue;
            const s = parseInt(a[0], 10) & 15;
            (steps[s] = steps[s] || []).push({ n: parseNote(a[1]), d: parseFloat(a[2]), v: a[3] ? parseFloat(a[3]) : 0.85 });
          }
        } else {
          const str = bar.replace(/[|\s]/g, '');
          for (let s = 0; s < 16 && s < str.length; s++) {
            const ch = str[s], v = DRUM_VEL[ch];
            if (v) steps[s] = [{ v, x: ch === 'r' ? 2 : ch === 't' ? 3 : 1 }];
          }
        }
        return steps;
      });
    }
    T._c = true;
    return T;
  }
  function resolve(n, ch) {
    if (n.a !== undefined) return n.a;
    if (n.r !== undefined) return ch.root + n.r;
    return ch.notes[n.c % ch.notes.length] + n.o;
  }
  function layerLevel(L) {
    let x = inten;
    if (L.g) x = clamp((inten - L.g[0]) / (L.g[1] - L.g[0]), 0, 1);
    return L.lvl ? L.lvl[0] + (L.lvl[1] - L.lvl[0]) * x : 1;
  }

  /* ------------------------------------------------------------ sequencer */
  function makePlayer(name, now, fade) {
    const def = compile(TRACKS[name]);
    const P = { name, def, step: 0, stepDur: 60 / def.bpm / 4, next: now + 0.08, dieAt: 0, crackle: null, pans: {} };
    P.fade = G(0); P.fade.connect(musicBus);
    P.wetFade = G(0); P.wetFade.connect(musicRev);
    for (const g of [P.fade, P.wetFade]) {
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(1, now + fade);
    }
    const dry = G(1), w = G(0.22), ww = G(0.6);
    dry.connect(P.fade); w.connect(P.wetFade); ww.connect(P.wetFade);
    // electric piano bus: slow tremolo and a soft top
    const k = G(1), klp = F('lowpass', 3000, 0.5);
    P.trem = G(0.09);
    tremLfo.connect(P.trem); P.trem.connect(k.gain);
    k.connect(klp); klp.connect(dry); klp.connect(w);
    P.bus = { d: dry, w, ww, k };
    if (def.crackle) {
      const s = ac.createBufferSource(), hp = F('highpass', 900, 0.5), g = G(def.crackle * 0.16);
      s.buffer = crackleBuf; s.loop = true; s.start(now);
      chain(s, hp, g, dry);
      P.crackle = s;
    }
    return P;
  }
  /** the player's bus, with the dry signal placed left or right of centre */
  function busAt(P, pan) {
    if (!pan || !ac.createStereoPanner) return P.bus;
    let b = P.pans[pan];
    if (!b) {
      // equal-power panning costs up to 3 dB against an unpanned mono voice; give most of it back
      const g = G(1.4 - 0.3 * Math.abs(pan)), sp = ac.createStereoPanner();
      sp.pan.value = pan;
      g.connect(sp); sp.connect(P.bus.d);
      b = P.pans[pan] = { d: g, w: P.bus.w, ww: P.bus.ww, k: P.bus.k };
    }
    return b;
  }
  function killPlayer(P) {
    try { if (P.crackle) P.crackle.stop(); } catch (e) { /* never started */ }
    for (const n of [P.fade, P.wetFade, P.trem]) { try { n.disconnect(); } catch (e) { /* gone */ } }
  }
  function scheduleStep(P, t) {
    const T = P.def, bar = Math.floor(P.step / 16) % T.bars, s = P.step % 16;
    const tt = t + (s & 1 ? T.swing * P.stepDur : 0);
    const ch = T.cho[bar % T.cho.length];
    for (const L of T.layers) {
      const lv = layerLevel(L) * L.vol;
      if (lv < 0.03) continue;
      const B = busAt(P, L.pan);
      const steps = L.ev[bar % L.ev.length];
      const list = steps && steps[s];
      if (!list) continue;
      for (const e of list) {
        const vel = e.v * lv * rnd(0.9, 1.04);
        if (L.kind === 'drum') {
          const fn = Drum[L.inst], n = e.x || 1;
          for (let i = 0; i < n; i++) fn(tt + (i * P.stepDur) / n + rnd(0, 0.004), vel * (i ? 0.75 : 1), B);
        } else if (L.kind === 'keys') {
          const fn = Mel[L.inst], dur = (L.len || 2) * P.stepDur;
          for (let i = 0; i < ch.notes.length; i++) fn(tt + i * (L.strum || 0), ch.notes[i] + (L.oct || 0), dur, vel * 0.85, B);
        } else {
          Mel[L.inst](tt, resolve(e.n, ch) + (L.oct || 0), e.d * P.stepDur * (L.gate || 0.95), vel, B);
        }
      }
    }
  }
  /** look-ahead scheduler; `horizon`/`force` are only passed by offline tests */
  function tick(horizon, force) {
    if (!ac) return;
    inten = force !== undefined ? force : inten + (intenTarget - inten) * 0.07;
    const now = ac.currentTime, until = now + (horizon || 0.14), cap = horizon ? 1e6 : 64;
    for (let i = players.length - 1; i >= 0; i--) {
      const P = players[i];
      if (P.dieAt && now > P.dieAt) { killPlayer(P); players.splice(i, 1); continue; }
      if (P.next < now - 0.1) {   // tab was throttled: jump ahead, staying on the grid
        const missed = Math.ceil((now + 0.03 - P.next) / P.stepDur);
        P.step += missed; P.next += missed * P.stepDur;
      }
      for (let n = 0; P.next < until && n < cap; n++) {
        try { scheduleStep(P, P.next); } catch (e) { warnOnce('track ' + P.name, e); }
        P.step++; P.next += P.stepDur;
      }
    }
  }

  /* ================================================================== sfx */
  /** per-call output: volume, optional pan, lazily created reverb sends */
  function callBus(vol, pan) {
    const d = G(vol), nodes = [d];
    let tail = d;
    if (pan && ac.createStereoPanner) {
      const p = ac.createStereoPanner();
      p.pan.value = pan = clamp(pan, -1, 1);
      d.gain.value = vol * (1.4 - 0.4 * Math.abs(pan));   // keep panned sounds as loud as centred ones
      d.connect(p); tail = p; nodes.push(p);
    }
    tail.connect(sfxBus);
    let w = null, ww = null;
    return {
      d,
      get w() { if (!w) { w = G(vol * 0.3); w.connect(sfxRev); nodes.push(w); } return w; },
      get ww() { if (!ww) { ww = G(vol * 0.85); ww.connect(sfxRev); nodes.push(ww); } return ww; },
      kill() { for (const n of nodes) { try { n.disconnect(); } catch (e) { /* gone */ } } },
    };
  }
  function scratch(t, o) {
    // three strokes of a record being dragged: forward, back, forward
    for (const [at, dur, f0, f1] of [[0, 0.07, 500, 3200], [0.085, 0.09, 3000, 450], [0.195, 0.06, 600, 2800]]) {
      burst(t + at, o.d, 'bandpass', [f0, f1], 2.5, 0.55, dur, 0.004);
      const lp = F('lowpass', 2400, 0.7);
      lp.connect(o.d);
      const g = ping(t + at, lp, 'sawtooth', f0 * 0.3, 0.13, dur, 0.004, f1 * 0.3, dur);
      fin(g.src, g, lp);
    }
  }
  function stab(t, o, freqs, dec) {
    const lp = F('lowpass', 3600, 0.8), g = G(0);
    perc(g.gain, t, 0.085, dec, 0.004);
    let last;
    for (const f of freqs) for (const c of [-8, 8]) {
      last = O('sawtooth', f, t);
      last.detune.value = c; last.stop(t + dec + 0.05); last.connect(lp);
    }
    lp.connect(g); g.connect(o.d); g.connect(o.w);
    fin(last, g);
  }

  /* loudness trims, set by rendering each sound offline and reading its peak */
  const TRIM = { hit_light: 0.85, hit_heavy: 0.75, hit_final: 0.8, parry: 0.85, hurt: 0.9, slap: 0.55, special_release: 0.8, type: 0.8,
    jump: 1.8, dash: 1.25, ui_move: 1.4, ui_back: 1.7, chain: 2, crowd: 1.6, sword_draw: 1.5, card_whoosh: 1.5, paper: 1.5, detect: 1.3,
    whoosh: 1.35, whoosh_heavy: 1.2, ghost: 1.6 };
  const STING_TRIM = { victory: 0.55 };

  /* each sfx gets (start time, pitch multiplier, call bus) and returns its length in seconds */
  const SFX = {
    /* ---- combat ---- */
    whoosh(t, p, o) {
      const r = rnd(0.9, 1.1) * p;
      burst(t, o.d, 'bandpass', [500 * r, 2400 * r, 900 * r], 1.3, 0.4, 0.15, 0.05);
      burst(t, o.d, 'highpass', 5000, 0.5, 0.06, 0.12, 0.05);
      return 0.25;
    },
    whoosh_heavy(t, p, o) {
      const r = rnd(0.92, 1.08) * p;
      burst(t, o.d, 'bandpass', [250 * r, 1500 * r, 400 * r], 0.9, 0.55, 0.26, 0.07);
      burst(t, o.d, 'highpass', 3500, 0.5, 0.08, 0.2, 0.08);
      ping(t, o.d, 'sine', 95 * r, 0.14, 0.2, 0.06, 60 * r);
      return 0.4;
    },
    hit_light(t, p, o) {
      const r = rnd(0.92, 1.08) * p;
      burst(t, o.d, 'highpass', 1100 * r, 0.7, 0.5, 0.05, 0.001);
      burst(t, o.d, 'bandpass', 1900 * r, 2, 0.35, 0.035, 0.001);
      ping(t, o.d, 'sine', 210 * r, 0.75, 0.1, 0.002, 95 * r, 0.06);
      return 0.2;
    },
    hit_heavy(t, p, o) {
      const r = rnd(0.94, 1.06) * p;
      ping(t, o.d, 'sine', 150 * r, 1.0, 0.26, 0.003, 50 * r, 0.14).connect(o.w);
      const lp = F('lowpass', 300, 0.7);
      lp.connect(o.d);
      const g = ping(t, lp, 'square', 80 * r, 0.3, 0.16, 0.003, 45 * r, 0.12);
      fin(g.src, g, lp);
      burst(t, o.d, 'lowpass', 3200 * r, 0.7, 0.75, 0.1, 0.001).connect(o.w);
      burst(t, o.d, 'bandpass', 900 * r, 1.5, 0.4, 0.07, 0.001);
      return 0.45;
    },
    hit_final(t, p, o) {
      ping(t, o.d, 'sine', 130, 1.0, 1.0, 0.004, 30, 0.55).connect(o.w);
      burst(t, o.d, 'lowpass', 6000, 0.5, 0.9, 0.16, 0.001).connect(o.ww);
      burst(t, o.d, 'lowpass', 220, 0.8, 0.9, 0.7, 0.005);
      [523.25, 784, 1174.7].forEach((f, i) => ping(t, o.ww, 'sine', f * p, 0.07, 1.3 - i * 0.25, 0.004));
      // the air rushing back in after the blow
      const n = N(t + 0.04, t + 0.95), bp = F('bandpass', 500, 1.2), g = G(0);
      bp.frequency.setValueAtTime(500, t + 0.04);
      bp.frequency.exponentialRampToValueAtTime(4200, t + 0.62);
      g.gain.setValueAtTime(0.0001, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.62);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      chain(n, bp, g); g.connect(o.d); g.connect(o.w);
      fin(n, g);
      return 1.6;
    },
    block(t, p, o) {
      const r = rnd(0.93, 1.07) * p;
      ping(t, o.d, 'sine', 130 * r, 0.6, 0.09, 0.002, 70 * r, 0.06);
      burst(t, o.d, 'lowpass', 900, 0.8, 0.4, 0.05, 0.001);
      ping(t, o.d, 'triangle', 420 * r, 0.25, 0.03, 0.001);
      return 0.2;
    },
    parry(t, p, o) {
      const b = 1568 * p * rnd(0.985, 1.015);
      // a consonant stack (root, fifth, octave) for the sweetness, inharmonic uppers for the steel
      for (const [ratio, amp, dec] of [[1, 0.22, 0.9], [1.498, 0.16, 0.7], [2, 0.12, 0.55], [2.57, 0.09, 0.4], [3.36, 0.07, 0.3], [4.21, 0.05, 0.2]]) {
        ping(t, o.d, 'sine', b * ratio, amp, dec, 0.001).connect(o.ww);
      }
      const car = O('sine', b, t), mod = O('sine', b * 1.414, t), mg = G(0), cg = G(0);
      mg.gain.setValueAtTime(b * 0.9, t); mg.gain.exponentialRampToValueAtTime(1, t + 0.08);
      perc(cg.gain, t, 0.18, 0.12, 0.001);
      mod.connect(mg); mg.connect(car.frequency); car.connect(cg); cg.connect(o.d);
      car.stop(t + 0.16); mod.stop(t + 0.16);
      fin(car, cg);
      burst(t, o.d, 'highpass', 6500, 0.7, 0.4, 0.02, 0.0005);
      burst(t, o.ww, 'bandpass', 7200, 9, 0.12, 0.35, 0.004);
      ping(t, o.d, 'triangle', 320, 0.3, 0.03, 0.001);
      return 1.1;
    },
    dash(t, p, o) {
      burst(t, o.d, 'bandpass', [3200 * p, 700 * p], 2.2, 0.45, 0.13, 0.008);
      burst(t, o.d, 'highpass', 4000, 0.5, 0.1, 0.1, 0.01);
      ping(t, o.d, 'sine', 900 * p, 0.07, 0.1, 0.004, 280 * p);
      return 0.25;
    },
    jump(t, p, o) {
      burst(t, o.d, 'bandpass', [420 * p, 1300 * p], 1.4, 0.22, 0.11, 0.02);
      ping(t, o.d, 'sine', 240 * p, 0.1, 0.08, 0.005, 380 * p);
      return 0.2;
    },
    land(t, p, o) {
      ping(t, o.d, 'sine', 120 * p, 0.4, 0.08, 0.002, 58 * p, 0.06);
      burst(t, o.d, 'lowpass', 700, 0.7, 0.3, 0.06, 0.001);
      return 0.15;
    },
    step(t, p, o) {
      burst(t, o.d, 'lowpass', rnd(500, 950) * p, 0.8, 0.09, 0.035, 0.001);
      ping(t, o.d, 'sine', rnd(85, 110), 0.06, 0.03, 0.001);
      return 0.08;
    },
    hurt(t, p, o) {
      ping(t, o.d, 'sine', 110, 0.85, 0.16, 0.002, 48, 0.1);
      const lp = F('lowpass', 1300, 1);
      lp.connect(o.d);
      const g = ping(t, lp, 'sawtooth', 340 * p, 0.22, 0.2, 0.004, 150 * p, 0.2);
      fin(g.src, g, lp);
      burst(t, o.d, 'highpass', 1500, 0.7, 0.3, 0.04, 0.001);
      return 0.35;
    },
    ko(t, p, o) {
      ping(t, o.d, 'sine', 320 * p, 0.7, 0.2, 0.002, 70 * p, 0.08);
      burst(t, o.d, 'bandpass', 2600 * p, 1.5, 0.4, 0.05, 0.001);
      ping(t + 0.01, o.d, 'triangle', 660 * p, 0.14, 0.16, 0.002, 880 * p, 0.12).connect(o.w);
      return 0.35;
    },
    stagger(t, p, o) {
      const g = G(0), lfo = O('sine', 9, t), lg = G(42 * p);
      perc(g.gain, t, 0.2, 0.62, 0.012);
      lfo.connect(lg); lfo.stop(t + 0.7);
      let last;
      for (const [mul, a] of [[1, 1], [1.5, 0.4]]) {
        last = O('sine', 560 * p * mul, t);
        const sg = G(a);
        glide(last.frequency, t, 560 * p * mul, 330 * p * mul, 0.6);
        lg.connect(last.frequency);
        last.stop(t + 0.7); last.connect(sg); sg.connect(g);
      }
      g.connect(o.d); g.connect(o.w);
      fin(last, g);
      return 0.8;
    },

    /* ---- weapons ---- */
    sword_draw(t, p, o) {
      burst(t, o.d, 'bandpass', [2400 * p, 7600 * p], 11, 0.9, 0.42, 0.07).connect(o.w);
      ping(t, o.d, 'sine', 2800 * p, 0.05, 0.34, 0.03, 5400 * p, 0.32);
      ping(t + 0.26, o.ww, 'sine', 6200 * p, 0.05, 0.5, 0.01);
      ping(t + 0.26, o.ww, 'sine', 4650 * p, 0.04, 0.4, 0.01);
      return 0.9;
    },
    slash(t, p, o) {
      const r = rnd(0.93, 1.07) * p;
      burst(t, o.d, 'bandpass', [6500 * r, 1300 * r], 1.6, 0.7, 0.15, 0.004).connect(o.w);
      burst(t, o.d, 'highpass', 3000, 0.6, 0.2, 0.08, 0.002);
      ping(t, o.d, 'sine', 4400 * r, 0.06, 0.09, 0.002, 2300 * r);
      return 0.3;
    },
    cane(t, p, o) {
      const r = rnd(0.92, 1.08) * p;
      ping(t, o.d, 'sine', 640 * r, 0.4, 0.05, 0.001);
      ping(t, o.d, 'sine', 965 * r, 0.25, 0.035, 0.001);
      ping(t, o.d, 'sine', 1510 * r, 0.15, 0.022, 0.001);
      ping(t, o.d, 'sine', 185 * r, 0.4, 0.05, 0.001, 120 * r);
      burst(t, o.d, 'bandpass', 2400, 1.2, 0.2, 0.012, 0.0005);
      return 0.15;
    },
    bb_shot(t, p, o) {
      const r = rnd(0.94, 1.06) * p;
      burst(t, o.d, 'bandpass', 1700 * r, 1, 0.5, 0.03, 0.004);          // pft: the spring's puff of air
      ping(t, o.d, 'sine', 150 * r, 0.3, 0.035, 0.002, 90 * r);
      burst(t + 0.028, o.d, 'highpass', 3200, 0.7, 0.4, 0.012, 0.0005);  // tak: plastic slide
      ping(t + 0.028, o.d, 'square', 2300 * r, 0.08, 0.012, 0.0005);
      return 0.12;
    },
    bb_ricochet(t, p, o) {
      const f = rnd(2800, 3900) * p;
      ping(t, o.d, 'sine', f, 0.2, 0.13, 0.001, f * 1.35, 0.09).connect(o.w);
      ping(t, o.d, 'sine', f * 1.52, 0.08, 0.07, 0.001, f * 2, 0.07);
      return 0.25;
    },
    chain(t, p, o) {
      for (let i = 0; i < 8; i++) {
        const tt = t + i * 0.045 + rnd(0, 0.02), f = rnd(2200, 4800) * p, a = 1 - i * 0.08;
        burst(tt, o.d, 'bandpass', f, 7, 0.5 * a, 0.022, 0.0005);
        ping(tt, o.d, 'sine', f * 0.71, 0.07 * a, 0.035, 0.0005);
      }
      return 0.5;
    },
    thud(t, p, o) {
      ping(t, o.d, 'sine', 95 * p, 0.85, 0.2, 0.003, 44 * p, 0.12);
      burst(t, o.d, 'lowpass', 420, 0.8, 0.5, 0.12, 0.002);
      ping(t + 0.1, o.d, 'sine', 80 * p, 0.35, 0.12, 0.003, 46 * p);     // the bounce
      burst(t + 0.1, o.d, 'lowpass', 350, 0.8, 0.2, 0.07, 0.002);
      return 0.4;
    },
    glass(t, p, o) {
      burst(t, o.d, 'highpass', 3200, 0.7, 0.6, 0.05, 0.0005).connect(o.w);
      for (let i = 0; i < 9; i++) {
        ping(t + rnd(0, 0.28), o.d, 'sine', rnd(3000, 9000) * p, rnd(0.04, 0.1), rnd(0.04, 0.16), 0.0005).connect(o.w);
      }
      return 0.6;
    },
    slap(t, p, o) {
      burst(t, o.d, 'highpass', 1300 * p, 0.7, 1.0, 0.03, 0.0005).connect(o.ww);
      burst(t, o.d, 'bandpass', 2900 * p, 1.4, 0.7, 0.07, 0.0005);
      ping(t, o.d, 'sine', 400 * p, 0.4, 0.025, 0.0005, 220 * p);
      return 0.5;
    },

    /* ---- specials / atmosphere ---- */
    focus_full(t, p, o) {
      [1318.5, 1661.2, 1975.5, 2637].forEach((f, i) => {
        ping(t + i * 0.05, o.d, 'sine', f * p, 0.12, 0.55, 0.003).connect(o.ww);
        ping(t + i * 0.05, o.d, 'triangle', f * p * 0.5, 0.04, 0.3, 0.003);
      });
      burst(t, o.ww, 'highpass', 8000, 0.7, 0.08, 0.5, 0.25);
      return 1;
    },
    special_charge(t, p, o) {
      const lp = F('lowpass', 400, 3), g = G(0);
      lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(5000, t + 0.5);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.46); g.gain.linearRampToValueAtTime(0.0001, t + 0.52);
      let last;
      for (const type of ['sawtooth', 'sine']) {
        last = O(type, 110 * p, t);
        glide(last.frequency, t, 110 * p, 990 * p, 0.5);
        last.stop(t + 0.55); last.connect(lp);
      }
      lp.connect(g); g.connect(o.d); g.connect(o.w);
      fin(last, g);
      // everything in the room being sucked toward one point
      const n = N(t, t + 0.55), bp = F('bandpass', 300, 1.5), ng = G(0);
      bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(5200, t + 0.5);
      ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(0.55, t + 0.48); ng.gain.linearRampToValueAtTime(0.0001, t + 0.52);
      chain(n, bp, ng); ng.connect(o.d);
      fin(n, ng);
      return 0.7;
    },
    special_release(t, p, o) {
      burst(t, o.d, 'bandpass', [7500, 900], 1.2, 0.9, 0.32, 0.003).connect(o.ww);
      burst(t, o.d, 'highpass', 2500, 0.6, 0.35, 0.12, 0.001);
      ping(t, o.d, 'sine', 95, 1.0, 1.1, 0.004, 30, 0.6);
      burst(t, o.d, 'lowpass', 260, 0.8, 0.9, 0.75, 0.004).connect(o.w);
      [1975.5, 2960, 3951].forEach((f, i) => ping(t, o.ww, 'sine', f * p, 0.06, 1.1 - i * 0.2, 0.002));
      return 1.8;
    },
    thunder(t, p, o) {
      const dur = 2.3, n = N(t, t + dur + 0.1, 0.6), lp = F('lowpass', 180, 0.6), g = G(0);
      lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(170 * p, t + 0.25);
      const c = new Float32Array(48);
      for (let i = 1; i < 47; i++) c[i] = 0.95 * Math.exp((-i / 47) * 3.4) * (0.55 + 0.45 * Math.random());
      c[1] = 0.95;
      g.gain.setValueCurveAtTime(c, t, dur);
      chain(n, lp, g); g.connect(o.d); g.connect(o.w);
      fin(n, g);
      ping(t, o.d, 'sine', 52 * p, 0.5, 1.6, 0.02, 34 * p, 1.2);
      return 2.6;
    },
    ghost(t, p, o) {
      const end = t + 1.25, bp = F('bandpass', 900, 4), g = G(0), lfo = O('sine', 5.5, t), lg = G(8);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.24, t + 0.35); g.gain.setTargetAtTime(0.0001, t + 0.6, 0.2);
      lfo.connect(lg); lfo.stop(end);
      let last;
      for (const det of [-7, 0, 9]) {
        last = O('sine', 400 * p + det, t);
        last.frequency.setValueAtTime(400 * p + det, t);
        last.frequency.exponentialRampToValueAtTime(520 * p + det, t + 0.4);
        last.frequency.exponentialRampToValueAtTime(350 * p + det, t + 1.1);
        lg.connect(last.frequency); last.stop(end); last.connect(bp);
      }
      const saw = O('sawtooth', 200 * p, t), sg = G(0.3);
      glide(saw.frequency, t, 200 * p, 175 * p, 1.1);
      saw.stop(end); saw.connect(sg); sg.connect(bp);
      bp.connect(g); g.connect(o.d); g.connect(o.ww);
      fin(last, g);
      burst(t, o.ww, 'bandpass', [1100, 1500, 900], 6, 0.12, 0.9, 0.3);
      return 1.6;
    },
    alert(t, p, o) {
      stab(t, o, [587.3 * p, 830.6 * p, 1174.7 * p], 0.1);
      stab(t + 0.11, o, [622.3 * p, 880 * p, 1244.5 * p], 0.32);
      ping(t, o.d, 'sine', 150, 0.3, 0.1, 0.002, 80);
      return 0.7;
    },
    detect(t, p, o) {
      ping(t, o.d, 'sine', 620 * p, 0.14, 0.06, 0.003);
      ping(t, o.d, 'triangle', 1240 * p, 0.04, 0.03, 0.001);
      return 0.1;
    },
    bell(t, p, o) {
      const f0 = 98 * p;
      for (const [r, a, dec] of [[1, 0.5, 3.6], [1.007, 0.25, 3.2], [2, 0.22, 2.4], [2.41, 0.16, 1.8], [3, 0.12, 1.5], [4.19, 0.08, 1.1], [5.43, 0.05, 0.8], [6.8, 0.03, 0.5]]) {
        ping(t, o.d, 'sine', f0 * r, a, dec, 0.004).connect(o.w);
      }
      burst(t, o.d, 'lowpass', 500, 0.8, 0.5, 0.05, 0.002);
      return 4;
    },
    heartbeat(t, p, o) {
      ping(t, o.d, 'sine', 62 * p, 0.75, 0.11, 0.006, 40 * p, 0.08);
      burst(t, o.d, 'lowpass', 180, 0.8, 0.2, 0.06, 0.004);
      ping(t + 0.2, o.d, 'sine', 70 * p, 0.5, 0.1, 0.006, 44 * p, 0.08);
      burst(t + 0.2, o.d, 'lowpass', 200, 0.8, 0.12, 0.05, 0.004);
      return 0.45;
    },
    crowd(t, p, o) {
      // the gasp: three vowel formants opening upward
      const n = N(t, t + 1.15), mix = G(0);
      mix.gain.setValueAtTime(0.0001, t); mix.gain.linearRampToValueAtTime(0.5, t + 0.1);
      mix.gain.exponentialRampToValueAtTime(0.1, t + 0.45); mix.gain.exponentialRampToValueAtTime(0.0001, t + 1.05);
      for (const [f0, f1, w] of [[650, 900, 1], [1150, 1500, 0.7], [2500, 2900, 0.4]]) {
        const bp = F('bandpass', f0 * p, 5), wg = G(w);
        bp.frequency.setValueAtTime(f0 * p, t); bp.frequency.exponentialRampToValueAtTime(f1 * p, t + 0.18);
        n.connect(bp); bp.connect(wg); wg.connect(mix);
      }
      mix.connect(o.d); mix.connect(o.w);
      fin(n, mix);
      // the murmur that follows
      const n2 = N(t + 0.2, t + 1.25, 0.5), am = G(0.6), env = G(0), lfo = O('sine', 6.5, t + 0.2), lg = G(0.4);
      env.gain.setValueAtTime(0.0001, t + 0.2); env.gain.linearRampToValueAtTime(0.3, t + 0.45); env.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      lfo.connect(lg); lg.connect(am.gain); lfo.stop(t + 1.25);
      for (const f of [320, 520]) { const bp = F('bandpass', f * p, 3); n2.connect(bp); bp.connect(am); }
      am.connect(env); env.connect(o.d);
      fin(n2, env);
      return 1.3;
    },

    /* ---- interface ---- */
    ui_move(t, p, o) {
      ping(t, o.d, 'triangle', 1180 * p, 0.13, 0.025, 0.001);
      burst(t, o.d, 'bandpass', 3200, 1.5, 0.1, 0.012, 0.0005);
      return 0.06;
    },
    ui_select(t, p, o) {
      ping(t, o.d, 'triangle', 660 * p, 0.2, 0.09, 0.002);
      ping(t + 0.065, o.d, 'triangle', 990 * p, 0.2, 0.14, 0.002).connect(o.w);
      ping(t, o.d, 'sine', 160, 0.3, 0.06, 0.002, 90);
      return 0.3;
    },
    ui_back(t, p, o) {
      ping(t, o.d, 'triangle', 660 * p, 0.16, 0.08, 0.002);
      ping(t + 0.06, o.d, 'triangle', 440 * p, 0.16, 0.12, 0.002);
      return 0.25;
    },
    ui_locked(t, p, o) {
      const lp = F('lowpass', 420, 1);
      lp.connect(o.d);
      ping(t, lp, 'square', 105 * p, 0.3, 0.07, 0.004);
      const g = ping(t + 0.1, lp, 'square', 105 * p, 0.3, 0.07, 0.004);
      fin(g.src, g, lp);
      return 0.25;
    },
    stamp(t, p, o) {
      ping(t, o.d, 'sine', 105 * p, 0.95, 0.13, 0.002, 52 * p, 0.08);
      burst(t, o.d, 'lowpass', 1300, 0.8, 0.5, 0.05, 0.001);
      ping(t, o.d, 'triangle', 245 * p, 0.3, 0.06, 0.001);
      burst(t, o.d, 'highpass', 3000, 0.7, 0.12, 0.015, 0.0005);
      return 0.25;
    },
    pin(t, p, o) {
      const r = rnd(0.92, 1.08) * p;
      ping(t, o.d, 'sine', 2600 * r, 0.16, 0.012, 0.0005);
      burst(t, o.d, 'highpass', 5000, 0.7, 0.18, 0.008, 0.0003);
      ping(t, o.d, 'sine', 300 * r, 0.22, 0.035, 0.001, 180 * r);
      return 0.08;
    },
    paper(t, p, o) {
      const n = N(t, t + 0.3, rnd(0.8, 1.2)), hp = F('highpass', 1600, 0.5), bp = F('bandpass', 3600 * p, 0.7), g = G(0);
      const c = new Float32Array(24);
      for (let i = 1; i < 23; i++) c[i] = 0.2 * Math.sin((i / 23) * Math.PI) * (0.4 + 0.6 * Math.random());
      g.gain.setValueCurveAtTime(c, t, 0.24);
      chain(n, hp, bp, g); g.connect(o.d);
      fin(n, g);
      return 0.3;
    },
    type(t, p, o) {
      const r = rnd(0.85, 1.15);
      burst(t, o.d, 'highpass', 2600, 0.7, 0.32, 0.012, 0.0004);
      ping(t, o.d, 'sine', 1900 * r * p, 0.08, 0.016, 0.0005);
      ping(t, o.d, 'sine', 290 * r, 0.28, 0.03, 0.001, 170 * r);
      return 0.06;
    },
    card_whoosh(t, p, o) {
      burst(t, o.d, 'bandpass', [800 * p, 3000 * p, 1100 * p], 1.1, 0.28, 0.2, 0.06);
      return 0.3;
    },
  };

  /* =============================================================== stings */
  const STING = {
    /* episode title card: one enormous drum, then the needle gets dragged */
    card(t, o) {
      ping(t, o.d, 'sine', 118, 1.0, 1.7, 0.004, 38, 0.2).connect(o.w);
      ping(t, o.d, 'sine', 96, 0.4, 0.5, 0.004, 62, 0.1);
      burst(t, o.d, 'lowpass', 900, 0.8, 0.7, 0.09, 0.001).connect(o.ww);
      burst(t, o.d, 'bandpass', 2600, 1.2, 0.2, 0.02, 0.0005);
      const s = O('sine', 36, t), g = G(0);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.7, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      s.stop(t + 1.55); s.connect(g); g.connect(o.d);
      fin(s, g);
      scratch(t + 0.62, o);
      return 2.2;
    },
    /* IV - V - I with the horns leaning into it */
    victory(t, o) {
      const chord = (at, ms, dur, v) => { for (const m of ms) Mel.horn(t + at, m, dur, v, o); };
      chord(0, [63, 67, 70, 74], 0.1, 0.9);
      chord(0.2, [65, 69, 72, 75], 0.1, 0.9);
      chord(0.45, [58, 65, 69, 72, 77], 1.15, 1);
      chord(1.85, [70, 74, 77, 82], 0.16, 1);
      Mel.bass(t, 39, 0.12, 1, o); Mel.bass(t + 0.2, 41, 0.12, 1, o); Mel.bass(t + 0.45, 34, 1.2, 1, o); Mel.bass(t + 1.85, 46, 0.2, 1, o);
      Drum.kick(t, 0.9, o); Drum.snare(t + 0.2, 0.9, o); Drum.kick(t + 0.45, 1, o); Drum.crash(t + 0.45, 0.9, o);
      Drum.snare(t + 1.6, 0.5, o); Drum.snare(t + 1.72, 0.7, o); Drum.kick(t + 1.85, 1, o); Drum.snare(t + 1.85, 1, o);
      [70, 72, 74, 77, 79, 82].forEach((m, i) => Mel.koto(t + 0.62 + i * 0.09, m, 0.3, 0.6, o));
      return 3;
    },
    /* three sinking notes through a plunger mute */
    defeat(t, o) {
      for (const [m, at, dur] of [[63, 0, 0.26], [62, 0.3, 0.26], [61, 0.6, 0.95]]) {
        const f = mtof(m), tt = t + at, bp = F('bandpass', 700, 2.6), g = G(0);
        const end = adsr(g.gain, tt, 0.5, 0.02, 0.2, 0.8, dur, 0.12);
        bp.frequency.setValueAtTime(600, tt);
        bp.frequency.exponentialRampToValueAtTime(1700, tt + dur * 0.35);
        bp.frequency.exponentialRampToValueAtTime(520, tt + dur);
        let last;
        for (const c of [-6, 6]) {
          last = O('sawtooth', f, tt);
          last.detune.value = c;
          if (dur > 0.5) { last.frequency.setValueAtTime(f, tt + 0.25); last.frequency.exponentialRampToValueAtTime(f * 0.84, tt + dur); }
          last.stop(end); last.connect(bp);
        }
        bp.connect(g); g.connect(o.d); g.connect(o.w);
        fin(last, g);
      }
      Mel.bass(t + 0.6, 37, 0.9, 0.8, o);
      return 2;
    },
    unlock(t, o) {
      [81, 85, 88, 93].forEach((m, i) => Mel.bell(t + i * 0.075, m, 0.4, 0.75, o, true));
      burst(t + 0.2, o.ww, 'highpass', 7500, 0.7, 0.05, 0.5, 0.2);
      return 1.6;
    },
  };

  /* ============================================================ lifecycle */
  function build() {
    noiseBuf = makeNoise();
    crackleBuf = makeCrackle();
    const ir = makeIR();

    master = G(0.9);
    const limiter = comp(-3, 0, 20, 0.002, 0.09);
    master.connect(limiter); limiter.connect(ac.destination);

    // music: players -> glue compressor -> duck -> pause filter -> volume
    musicBus = G(1);
    musicDuck = G(1);
    musicFilter = F('lowpass', Math.min(20000, ac.sampleRate / 2 - 200), 0.5);
    musicVol = G(volMusic * MUSIC_GAIN);
    chain(musicBus, comp(-18, 12, 3, 0.012, 0.22), musicDuck, musicFilter, musicVol, master);
    musicRev = reverb(ir);
    chain(musicRev, G(0.8), musicBus);

    // sfx: per-call buses -> compressor -> volume
    sfxBus = G(1);
    sfxVol = G(volSfx * SFX_GAIN);
    chain(sfxBus, comp(-12, 6, 5, 0.002, 0.12), sfxVol, master);
    sfxRev = reverb(ir);
    chain(sfxRev, G(0.9), sfxBus);

    tremLfo = ac.createOscillator();
    tremLfo.frequency.value = 4.7;
    tremLfo.start();
  }

  function init(injected) {
    if (ac) { wake(); return; }
    try {
      if (injected && injected.createGain) ac = injected;
      else {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        try { ac = new AC({ latencyHint: 'interactive' }); } catch (e) { ac = new AC(); }
      }
      build();
    } catch (e) {
      warnOnce('init failed, running silent', e);
      ac = null;
      return;
    }
    if (typeof setInterval === 'function' && !(injected && injected.createGain)) timer = setInterval(() => tick(), 25);
    wake();
    if (pending) { const p = pending; pending = null; music(p.name, p.opts); }
  }

  function music(name, opts) {
    if (name === undefined) name = null;
    if (name !== null && !TRACKS[name]) { warnOnce('unknown track ' + name); return; }
    if (!ac) { pending = { name, opts }; return; }
    wake();
    if (name === curName) return;
    const fade = opts && opts.fade !== undefined ? Math.max(0.03, opts.fade) : 1.2;
    const now = ac.currentTime;
    for (const P of players) {
      if (P.dieAt) continue;
      rampTo(P.fade.gain, 0, now, fade);
      rampTo(P.wetFade.gain, 0, now, fade);
      P.dieAt = now + fade + 0.4;
    }
    curName = name;
    if (name) {
      try { players.push(makePlayer(name, now, fade)); } catch (e) { warnOnce('track ' + name, e); }
    }
  }

  function setVolumes(m, s) {
    if (typeof m === 'number' && isFinite(m)) volMusic = clamp(m, 0, 1);
    if (typeof s === 'number' && isFinite(s)) volSfx = clamp(s, 0, 1);
    if (!ac) return;
    musicVol.gain.setTargetAtTime(volMusic * MUSIC_GAIN, ac.currentTime, 0.05);
    sfxVol.gain.setTargetAtTime(volSfx * SFX_GAIN, ac.currentTime, 0.05);
  }

  function intensity(v) { if (typeof v === 'number' && isFinite(v)) intenTarget = clamp(v, 0, 1); }

  function duck(amount = 0.6, seconds = 0.6) {
    if (!ac) return;
    const g = musicDuck.gain, now = ac.currentTime;
    g.cancelScheduledValues(now);
    g.setTargetAtTime(1 - clamp(amount, 0, 1), now, 0.012);
    g.setTargetAtTime(1, now + 0.06, Math.max(0.05, seconds) / 3.2);
  }

  function muffle(on) {
    if (!ac) return;
    const top = Math.min(20000, ac.sampleRate / 2 - 200);
    musicFilter.frequency.cancelScheduledValues(ac.currentTime);
    musicFilter.frequency.setTargetAtTime(on ? 520 : top, ac.currentTime, on ? 0.07 : 0.16);
  }

  function sfx(name, opts) {
    if (!ac) return;
    const fn = SFX[name];
    if (!fn) return;
    const now = ac.currentTime;
    if (lastAt[name] !== undefined && now - lastAt[name] < 0.03 && now >= lastAt[name]) return;
    lastAt[name] = now;
    wake();
    const vol = (opts && typeof opts.vol === 'number' ? Math.max(0, opts.vol) : 1) * (TRIM[name] || 1);
    const pitch = opts && opts.pitch > 0 ? opts.pitch : 1;
    const pan = opts && typeof opts.pan === 'number' ? opts.pan : 0;
    if (vol <= 0) return;
    let len = 0.5, o = null;
    try {
      o = callBus(vol, pan);
      len = fn(now + 0.004, pitch, o) || 0.5;
    } catch (e) { warnOnce('sfx ' + name, e); }
    if (o) setTimeout(o.kill, (len + 0.35) * 1000);
  }

  function sting(name) {
    if (!ac) return;
    const fn = STING[name];
    if (!fn) return;
    wake();
    let len = 1, o = null;
    try {
      o = callBus(STING_TRIM[name] || 1, 0);
      len = fn(ac.currentTime + 0.01, o) || 1;
    } catch (e) { warnOnce('sting ' + name, e); }
    duck(0.65, len);
    if (o) setTimeout(o.kill, (len + 2.2) * 1000);
  }

  /** one tiny syllable per typed character; pitch ~0.55 (old man) to ~1.6 (kid) */
  function blip(pitch = 1) {
    if (!ac) return;
    const now = ac.currentTime;
    if (now - lastBlip < 0.028 && now >= lastBlip) return;
    lastBlip = now;
    try {
      const f = 290 * pitch * rnd(0.94, 1.07), t = now + 0.003;
      const o = O('square', f, t), lp = F('lowpass', 700 + 800 * pitch, 0.8), g = G(0);
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 0.86, t + 0.05);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.075, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
      o.stop(t + 0.07);
      chain(o, lp, g, sfxBus);
      fin(o, g);
    } catch (e) { warnOnce('blip', e); }
  }

  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('visibilitychange', () => {
      hidden = !!document.hidden;
      if (!ac) return;
      try {
        const p = hidden ? ac.suspend && ac.suspend() : ac.resume && ac.resume();
        if (p && p.catch) p.catch(() => {});
      } catch (e) { /* context closed */ }
    });
  }

  BD.Audio = {
    init, music, intensity, duck, muffle, sting, sfx, blip, setVolumes,
    get ready() { return !!ac; },
    get track() { return curName; },
    /* test hooks */
    _tick: tick,
    _tracks: TRACKS,
    _sfx: SFX,
    _compile: compile,
  };
})();
