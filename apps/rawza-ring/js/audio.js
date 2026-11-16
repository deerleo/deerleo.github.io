import { clamp } from './util.js';

// All sound is synthesised with the Web Audio API - there are no audio files.
export class GameAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  // Must be called from a user gesture (the Start button).
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain();
    this.master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6;
    this.master.connect(comp).connect(ctx.destination);

    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;

    this.engine = this._engine(false);
    this.rivals = [0, 1, 2].map(() => this._engine(true));
    this.skid = this._noise('bandpass', 1700, 3.0);
    this.wind = this._noise('lowpass', 650, 0.4);
    this.gravel = this._noise('lowpass', 210, 0.8);
  }

  _engine(rival) {
    const ctx = this.ctx;
    const mix = ctx.createGain();
    const oscs = [['sawtooth', 1, 0.5], ['square', 0.5, 0.32], ['sawtooth', 1.503, 0.16], ['triangle', 2.01, 0.1]].map(([type, mult, gain]) => {
      const o = ctx.createOscillator();
      o.type = type;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g).connect(mix);
      o.start();
      return { o, mult };
    });
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 127.5 - 1; curve[i] = Math.tanh(x * 2.4); }
    shaper.curve = curve;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = 1.2;
    const out = ctx.createGain();
    out.gain.value = 0;
    mix.connect(shaper).connect(lp).connect(out);
    let pan = null;
    if (rival && ctx.createStereoPanner) {
      pan = ctx.createStereoPanner();
      out.connect(pan).connect(this.master);
    } else out.connect(this.master);
    return { oscs, lp, out, pan };
  }

  _noise(type, freq, q) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(f).connect(g).connect(this.master);
    src.start();
    return { f, g };
  }

  _setEngine(e, rpm, throttle, vol, pitchMul = 1) {
    const t = this.ctx.currentTime;
    const f = (34 + rpm * 132) * pitchMul;
    for (const { o, mult } of e.oscs) o.frequency.setTargetAtTime(f * mult, t, 0.03);
    e.lp.frequency.setTargetAtTime(260 + rpm * 1500 + throttle * 1100, t, 0.05);
    e.out.gain.setTargetAtTime(vol * (0.3 + 0.45 * throttle + 0.3 * rpm), t, 0.05);
  }

  // Called every frame while a race is on screen.
  update(player, rivals, cam, active) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const on = active ? 1 : 0;
    this._setEngine(this.engine, player.rpm, player.throttle, 0.26 * on);
    rivals.forEach((c, i) => {
      const e = this.rivals[i];
      if (!e) return;
      const dx = c.x - cam.x, dz = c.z - cam.z;
      const d = Math.hypot(dx, dz);
      const vol = (0.2 / (1 + (d / 14) ** 2)) * on;
      // crude Doppler: closing cars sound higher
      const closing = d > 1 ? -((c.vx - player.vx) * dx + (c.vz - player.vz) * dz) / d : 0;
      this._setEngine(e, c.rpm, c.throttle, vol, 1 + clamp(closing / 340, -0.12, 0.12));
      if (e.pan) e.pan.pan.setTargetAtTime(clamp((dx * cam.rx + dz * cam.rz) / 18, -1, 1), t, 0.08);
    });
    const slide = player.offroad ? 0 : clamp((player.slip - 1.6) / 7, 0, 1) * clamp(player.speedAbs / 12, 0, 1);
    this.skid.g.gain.setTargetAtTime(slide * 0.3 * on, t, 0.04);
    this.skid.f.frequency.setTargetAtTime(1300 + player.speedAbs * 14, t, 0.1);
    this.wind.g.gain.setTargetAtTime(Math.min(0.2, (player.speedAbs / 60) ** 2 * 0.2) * on, t, 0.1);
    this.wind.f.frequency.setTargetAtTime(400 + player.speedAbs * 16, t, 0.1);
    this.gravel.g.gain.setTargetAtTime((player.offroad ? clamp(player.speedAbs / 18, 0, 1) * 0.5 : 0) * on, t, 0.06);
  }

  tone(freq, dur, type = 'sine', vol = 0.3, delay = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  countdown(go) {
    if (go) { this.tone(880, 0.9, 'square', 0.16); this.tone(1320, 0.9, 'sine', 0.14); }
    else this.tone(440, 0.28, 'square', 0.16);
  }

  checkpoint() { this.tone(1046, 0.12, 'sine', 0.16); this.tone(1568, 0.2, 'sine', 0.14, 0.07); }

  lap() { [784, 988, 1175].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.2, i * 0.09)); }

  finish() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone(f, i === 5 ? 0.9 : 0.22, 'triangle', 0.24, i * 0.14)); }

  crash(strength) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const v = clamp(strength / 22, 0.08, 1);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 500 + v * 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(v * 0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25 + v * 0.2);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random()); src.stop(t + 0.6);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.2);
    og.gain.setValueAtTime(v * 0.6, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(og).connect(this.master);
    o.start(t); o.stop(t + 0.35);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.55, this.ctx.currentTime, 0.02);
    return this.muted;
  }
}
