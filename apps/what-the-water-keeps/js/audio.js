// Sound for the ride. Everything except the music is synthesised with the Web Audio API: there are no samples.
//
//   RideAudio(engine)   the live sound engine the boot script and the interface talk to (bottom of this file)
//   SoundGraph(ctx)     the whole synthesis graph, built on any BaseAudioContext, live or offline. The lab page
//                       lab/audio-test.html renders it in OfflineAudioContexts and measures every layer.
//
// Signal flow:
//   music track -> treatment (high-pass, low-pass, "door", gain, duck) -> music bus -+
//   ambience layers (each built only while its level is above 0) -> ambience bus ----+-> mix -> murmur (pause)
//   boat (bow wash, paddle, creak, bump) -> boat bus --------------------------------+     -> fade -> compressor
//   one-shots (panned and attenuated relative to the rider) -> effects bus ----------+     -> limiter -> soft clip
//   every bus also feeds the shared space (convolution reverb), which returns to the mix
//
// THE QUIET MIX (9 November): between what an area asks for and what is heard stands one policy, the QUIET_* tables
// above the ambience layers. The music carries the ride; noise is a trace. Change the tables, not the areas.
//
// Realm authors: see docs/audio.md.

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
const dB = (d) => Math.pow(10, d / 20);
const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
/** A level of 0.5 sounds about half as loud as 1 (-10 dB). */
const taper = (level) => Math.pow(clamp(level, 0, 1.5), 1.6);
/** The rider's volume sliders: 0.8 (where the interface starts them) is the reference level, 1 is 3 dB above it, 0 is silence. */
const VOLUME_REFERENCE = 0.8;
const userGain = (v) => Math.pow(clamp01(v) / VOLUME_REFERENCE, 1.6);

const GLIDE = 1.6;          // time constant (s) of the glide between two realms' settings
const LOOKAHEAD = 0.3;      // how far ahead of the audio clock repeating events are scheduled (s)
const MAX_VOICES = 36;      // one-shot voices sounding at once; more are dropped
const SOON = 0.03;          // "now" for a new sound: far enough ahead that its attack never starts inside the block being rendered

const warned = new Set();
function warnOnce(text) { if (!warned.has(text)) { warned.add(text); console.warn(text); } }

/** Small seeded random generator, so offline renders are repeatable. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ------------------------------------------------------------------------------------------------ envelopes
// Every level change in this file is a ramp or an exponential approach: nothing ever jumps.
/** Glide a parameter toward v from wherever it is now. */
function glide(param, v, t, tc) { param.cancelScheduledValues(t); param.setTargetAtTime(v, t, Math.max(0.005, tc)); }
/** A struck sound: up in `attack` seconds, then dying away with time constant `decay`. */
function hit(param, t, peak, attack, decay) { param.setValueAtTime(0, t); param.linearRampToValueAtTime(peak, t + attack); param.setTargetAtTime(0, t + attack, decay); }
/** A swell: rises over `rise`, holds, falls over `fall` (both about 95 % complete in the time given). */
function swell(param, t, peak, rise, hold, fall) { param.setValueAtTime(0, t); param.setTargetAtTime(peak, t, rise / 3); param.setTargetAtTime(0, t + rise + hold, fall / 3); }

// ------------------------------------------------------------------------------------------------ raw material
/** Stereo noise (two independent channels) that loops without a seam. kind: white | pink | brown. RMS 0.2. */
function makeNoise(ctx, kind, seconds, seed) {
  const sr = ctx.sampleRate, n = Math.floor(seconds * sr), fade = Math.floor(0.09 * sr);
  const buf = ctx.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) {
    const rnd = mulberry32(seed + ch * 7919), raw = new Float32Array(n + fade);
    if (kind === 'white') for (let i = 0; i < raw.length; i++) raw[i] = rnd() * 2 - 1;
    else if (kind === 'pink') {                                   // Paul Kellet's filter: -3 dB per octave
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < raw.length; i++) {
        const w = rnd() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856; b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
        raw[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
      }
    } else {                                                      // brown: -6 dB per octave, leaky so it cannot wander off
      let y = 0;
      for (let i = 0; i < raw.length; i++) { y = (y + 0.02 * (rnd() * 2 - 1)) / 1.02; raw[i] = y; }
    }
    const d = buf.getChannelData(ch);
    // the loop: the first `fade` samples cross from the continuation of the end into the start
    for (let i = 0; i < n; i++) {
      if (i < fade) { const a = (i / fade) * Math.PI * 0.5; d[i] = raw[i] * Math.sin(a) + raw[n + i] * Math.cos(a); } else d[i] = raw[i];
    }
    let mean = 0; for (let i = 0; i < n; i++) mean += d[i]; mean /= n;
    let sq = 0; for (let i = 0; i < n; i++) { d[i] -= mean; sq += d[i] * d[i]; }
    const k = 0.2 / Math.sqrt(sq / n || 1);
    for (let i = 0; i < n; i++) d[i] *= k;
  }
  return buf;
}

/** A slowly wandering control curve between lo and hi: a new random target about every `step` seconds. Periodic. */
function wanderCurve(rnd, seconds, step, lo, hi, hz = 8) {
  const k = Math.max(3, Math.round(seconds / step)), pts = [];
  for (let i = 0; i < k; i++) pts.push(rnd());
  const n = Math.round(seconds * hz), v = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / n) * k, a = Math.floor(x), f = x - a, e = f * f * (3 - 2 * f); v[i] = lo + (hi - lo) * (pts[a % k] * (1 - e) + pts[(a + 1) % k] * e); }
  return v;
}

/** Irregular soft pulses (water lapping against a hull): quick rise, slower fall, never quite regular. Periodic. */
function lapCurve(rnd, seconds, hz, gapMin, gapVar, rise, fall) {
  const n = Math.round(seconds * hz), v = new Float32Array(n);
  let t = rnd() * gapVar;
  while (t < seconds) {
    const a = 0.28 + 0.72 * rnd() * rnd(), up = rise * (0.7 + 0.8 * rnd()), down = fall * (0.6 + 0.9 * rnd());
    const i0 = Math.floor(t * hz), i1 = Math.floor((t + up + down * 5) * hz);
    for (let i = i0; i <= i1; i++) { const x = i / hz - t; v[i % n] += a * (x < up ? smooth(x / up) : Math.exp(-(x - up) / down)); }
    t += gapMin + gapVar * rnd();
  }
  return v;
}

/** A looping stereo texture of many tiny decaying sine "plips": used for rain on water (dense, short, unpitched). */
function makeDrops(ctx, seconds, perSecond, seed) {
  const sr = ctx.sampleRate, n = Math.floor(seconds * sr), buf = ctx.createBuffer(2, n, sr);
  const L = buf.getChannelData(0), R = buf.getChannelData(1), rnd = mulberry32(seed);
  const count = Math.round(seconds * perSecond);
  for (let k = 0; k < count; k++) {
    const at = Math.floor(rnd() * n), f = 1500 * Math.pow(4.6, rnd()), tau = (0.0016 + 0.006 * rnd()) * Math.sqrt(2500 / f) * sr;
    const amp = 0.06 + 0.34 * Math.pow(rnd(), 3), pan = rnd(), gl = Math.cos(pan * Math.PI * 0.5) * amp, gr = Math.sin(pan * Math.PI * 0.5) * amp;
    const len = Math.floor(tau * 6), w = TAU * f / sr, up = 1.25 + 0.5 * rnd(), ph = rnd() * TAU;
    for (let i = 0; i < len; i++) {
      // each drop is a tiny bubble: the pitch rises a little as it rings
      const e = Math.exp(-i / tau) * Math.min(1, i / (0.0004 * sr)), s = Math.sin(ph + w * i * (1 + (up - 1) * i / len)) * e, j = (at + i) % n;
      L[j] += s * gl; R[j] += s * gr;
    }
  }
  return buf;
}

/** A looping stereo texture of faint, very high glassy pings on the given notes: used for the shimmer layer. */
function makeShimmer(ctx, seconds, perSecond, seed, notes) {
  const sr = ctx.sampleRate, n = Math.floor(seconds * sr), buf = ctx.createBuffer(2, n, sr);
  const L = buf.getChannelData(0), R = buf.getChannelData(1), rnd = mulberry32(seed);
  const count = Math.round(seconds * perSecond);
  for (let k = 0; k < count; k++) {
    const at = Math.floor(rnd() * n), f = 440 * Math.pow(2, (notes[Math.floor(rnd() * notes.length)] - 69) / 12);
    const tau = (0.035 + 0.11 * rnd() * rnd()) * sr, amp = 0.12 + 0.6 * Math.pow(rnd(), 2.5), pan = rnd();
    const gl = Math.cos(pan * Math.PI * 0.5) * amp, gr = Math.sin(pan * Math.PI * 0.5) * amp;
    const len = Math.floor(tau * 7), w = TAU * f / sr, att = 0.004 * sr, ph = rnd() * TAU;
    for (let i = 0; i < len; i++) { const e = Math.exp(-i / tau) * Math.min(1, i / att), s = Math.sin(ph + w * i) * e, j = (at + i) % n; L[j] += s * gl; R[j] += s * gr; }
  }
  return buf;
}

// ------------------------------------------------------------------------------------------------ the space
// Impulse responses for the shared reverb, synthesised: three bands of noise that each die away at their own
// rate (stone keeps its lows, air eats the highs), after a pre-delay, with a few discrete early echoes.
//   rt: seconds to fall 60 dB (mid band); low/high: that time multiplied for the low and high bands
//   wet: how loud the space is at mix 1 relative to the dry sound
export const SPACES = {
  room:   { length: 1.3, pre: 0.006, rt: 0.95, low: 1.15, high: 0.55, lowGain: 1.1, highGain: 0.7, damp: 9000, build: 0.012, tail: 1, wet: 0.9,
            echoes: [[0.011, 0.9], [0.019, 0.7], [0.027, 0.75], [0.038, 0.5], [0.047, 0.55], [0.061, 0.35], [0.078, 0.3]], echoLen: 0.0012, hp: 110 },
  hall:   { length: 3.4, pre: 0.022, rt: 2.7, low: 1.2, high: 0.45, lowGain: 1.2, highGain: 0.6, damp: 7500, build: 0.045, tail: 1, wet: 1.1,
            echoes: [[0.031, 0.7], [0.047, 0.55], [0.066, 0.6], [0.089, 0.4], [0.118, 0.42], [0.152, 0.3], [0.21, 0.22]], echoLen: 0.003, hp: 90 },
  cavern: { length: 7.5, pre: 0.045, rt: 6.2, low: 1.25, high: 0.3, lowGain: 1.3, highGain: 0.45, damp: 5500, build: 0.12, tail: 1, wet: 1.4,
            echoes: [[0.07, 0.5], [0.13, 0.42], [0.21, 0.45], [0.33, 0.34], [0.47, 0.3], [0.68, 0.2], [0.93, 0.13]], echoLen: 0.018, hp: 70 },
  open:   { length: 2.6, pre: 0.03, rt: 1.7, low: 0.8, high: 0.4, lowGain: 0.8, highGain: 0.5, damp: 8000, build: 0.25, tail: 0.16, wet: 0.8,
            echoes: [[0.21, 0.55], [0.34, 0.5], [0.52, 0.36], [0.77, 0.26], [1.05, 0.16]], echoLen: 0.06, hp: 220 },
};

function makeImpulse(ctx, kind, seed = 11) {
  const S = SPACES[kind], sr = ctx.sampleRate, n = Math.floor(S.length * sr), buf = ctx.createBuffer(2, n, sr);
  const m1 = 1 - Math.exp(-TAU * 400 / sr), m2 = 1 - Math.exp(-TAU * 2000 / sr);
  let energy = 0;
  for (let ch = 0; ch < 2; ch++) {
    const rnd = mulberry32(seed * 131 + ch * 977 + kind.length * 31), d = buf.getChannelData(ch), pre = Math.floor(S.pre * sr);
    const a1 = 1 - Math.exp(-TAU * 300 / sr), a2 = 1 - Math.exp(-TAU * 3000 / sr);
    const kl = 6.908 / (S.rt * S.low * sr), km = 6.908 / (S.rt * sr), kh = 6.908 / (S.rt * S.high * sr), kb = 1 / (S.build * sr);
    let l1 = 0, l2 = 0;
    for (let i = pre; i < n; i++) {
      const j = i - pre, w = rnd() * 2 - 1;
      l1 += a1 * (w - l1); l2 += a2 * (w - l2);
      d[i] = (l1 * S.lowGain * Math.exp(-j * kl) + (l2 - l1) * Math.exp(-j * km) + (w - l2) * S.highGain * Math.exp(-j * kh)) * (1 - Math.exp(-j * kb)) * S.tail;
    }
    // early echoes: short smeared bursts, a little different in each ear
    const len = Math.max(8, Math.floor(S.echoLen * sr)), ae = 1 - Math.exp(-TAU * 2600 / sr);
    for (const [time, g] of S.echoes) {
      const at = Math.floor((time * (0.9 + 0.2 * rnd())) * sr), amp = g * (0.75 + 0.5 * rnd()) * 0.5 * (rnd() < 0.5 ? -1 : 1);
      let lp = 0;
      for (let i = 0; i < len && at + i < n; i++) { lp += ae * ((rnd() * 2 - 1) - lp); d[at + i] += lp * amp * 3 * Math.sin(Math.PI * i / len); }
    }
    // no rumble (one-pole high-pass), the air eats the very top (one-pole low-pass), and a clean end
    const ah = Math.exp(-TAU * S.hp / sr), ad = 1 - Math.exp(-TAU * S.damp / sr); let x1 = 0, y1 = 0, y2 = 0;
    const fadeFrom = Math.floor(n * 0.9);
    for (let i = 0; i < n; i++) {
      const x = d[i]; y1 = ah * (y1 + x - x1); x1 = x; y2 += ad * (y1 - y2);
      d[i] = y2 * (i > fadeFrom ? (n - i) / (n - fadeFrom) : 1);
    }
    // how much mid-range (400 Hz .. 2 kHz) energy the response carries
    let p1 = 0, p2 = 0;
    for (let i = 0; i < n; i++) { p1 += m1 * (d[i] - p1); p2 += m2 * (d[i] - p2); const y = p2 - p1; energy += y * y; }
  }
  // normalise: a mid-range sound comes back from the space, on average, as loud as it went in
  const ref = m2 * m2 / (1 - (1 - m2) ** 2) + m1 * m1 / (1 - (1 - m1) ** 2) - 2 * m1 * m2 / (1 - (1 - m1) * (1 - m2));
  const k = Math.sqrt(ref / (energy / 2 || 1));
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < n; i++) d[i] *= k; }
  return buf;
}

/** Above `knee` the signal bends over smoothly and can never pass `ceil`: the last safety after the limiter. */
function softClipCurve(n = 4097, knee = 0.8, ceil = 0.96) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1, a = Math.abs(x); c[i] = Math.sign(x) * (a <= knee ? a : knee + (ceil - knee) * Math.tanh((a - knee) / (ceil - knee))); }
  return c;
}

// ------------------------------------------------------------------------------------------------ patches
/** A handful of nodes that belong together (one layer, or one one-shot), with the sources remembered so they can be stopped. */
class Patch {
  constructor(g, t) { this.g = g; this.c = g.ctx; this.t = t; this.srcs = []; }
  gain(v = 1) { const n = this.c.createGain(); n.gain.value = v; return n; }
  filter(type, f, q = 0.7, gainDb = 0) { const n = this.c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; n.gain.value = gainDb; return n; }
  pan(v = 0) { const n = this.c.createStereoPanner(); n.pan.value = clamp(v, -1, 1); return n; }
  delay(s, max = 1) { const n = this.c.createDelay(max); n.delayTime.value = s; return n; }
  osc(type, f, detune = 0, t = this.t) { const o = this.c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; o.start(t); this.srcs.push(o); return o; }
  /** Looping stereo noise from a random place in the shared buffer. */
  noise(kind, rate = 1) { const b = this.g.noise(kind), s = this.c.createBufferSource(); s.buffer = b; s.loop = true; s.playbackRate.value = rate; s.start(this.t, this.g.rand() * b.duration); this.srcs.push(s); return s; }
  /** A short stretch of noise for a one-shot. */
  burst(kind, t, dur) { const b = this.g.noise(kind), s = this.c.createBufferSource(); s.buffer = b; s.start(t, this.g.rand() * (b.duration - dur - 0.2), dur + 0.05); this.srcs.push(s); return s; }
  loop(buffer, rate = 1, at = this.g.rand()) { const s = this.c.createBufferSource(); s.buffer = buffer; s.loop = true; s.playbackRate.value = rate; s.start(this.t, at * buffer.duration); this.srcs.push(s); return s; }
  /** A looping control signal (values sampled hz times a second, read back smoothly). Connect it to an AudioParam. */
  ctl(values, hz) {
    const sr = this.c.sampleRate, b = this.c.createBuffer(1, values.length, sr); b.getChannelData(0).set(values);
    const s = this.c.createBufferSource(); s.buffer = b; s.loop = true; s.playbackRate.value = hz / sr;
    s.start(this.t, this.g.rand() * values.length / sr); this.srcs.push(s); return s;
  }
  wander(seconds, step, lo, hi) { return this.ctl(wanderCurve(this.g.rand, seconds, step, lo, hi), 8); }
  /** Connect nodes in series; returns the last. */
  chain(...nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes[nodes.length - 1]; }
  stop(t) { for (const s of this.srcs) { try { s.stop(t); } catch { /* already stopped */ } } }
}

// ------------------------------------------------------------------------------------------------ the graph
export class SoundGraph {
  /**
   * @param {BaseAudioContext} ctx  live or offline
   * @param {{seed?: number, fadeIn?: boolean, master?: boolean, destination?: AudioNode}} opts
   *   fadeIn false = start at full level (offline renders); master false = no compressor, limiter or clip (measuring)
   */
  constructor(ctx, opts = {}) {
    this.ctx = ctx; this.opts = opts;
    this.rand = mulberry32(opts.seed ?? 20261107);
    this.tuneSemis = 0; this.tuneCents = 0;                 // the tonal layers follow the music's key and speed
    this.listener = { x: 0, z: 0, heading: 0 };              // the rider: position and facing (forward = (-sin h, -cos h))
    this.voices = 0; this.gc = []; this.lastPlayed = {}; this.sounded = {};
    this._noise = {}; this._tex = {}; this._ir = {};
    this.musicVolume = VOLUME_REFERENCE; this.sfxVolume = VOLUME_REFERENCE; this.musicOn = true; this.veil = 0; this.paused = false;
    this.chimeScale = DEFAULT_SCALE;
    this.buildMaster();
    this.spaces = {}; this.space = { size: null, mix: 0 };
    this.layers = {};
    for (const name in LAYERS) this.layers[name] = { name, def: LAYERS[name], level: 0, asked: 0, params: {}, inst: null, gain: null, send: null, offAt: Infinity };
    this.boat = new BoatSound(this);
    this.music = new MusicPlayer(this);
    this.applyVolumes(true);
  }

  get now() { return this.ctx.currentTime; }

  buildMaster() {
    const c = this.ctx, o = this.opts, G = (v = 1) => { const n = c.createGain(); n.gain.value = v; return n; };
    this.mix = G();
    this.musicBus = G(); this.musicSend = G(0);
    this.ambBus = G(); this.ambSend = G(); this.boatBus = G(); this.boatSend = G(0.14); this.fxBus = G(); this.fxSend = G();
    this.sfx = G(); this.sfxSend = G();
    this.reverbIn = G(); this.reverbReturn = G(0);
    this.musicBus.connect(this.mix); this.musicBus.connect(this.musicSend); this.musicSend.connect(this.reverbIn);
    for (const b of [this.ambBus, this.boatBus, this.fxBus]) b.connect(this.sfx);
    this.boatBus.connect(this.boatSend);
    for (const s of [this.ambSend, this.boatSend, this.fxSend]) s.connect(this.sfxSend);
    // "everything muffled and close" (snow), "heard through water": one low-pass over the world and over what it sends to the space
    const LP = () => { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 20000; f.Q.value = 0.5; return f; };
    this.worldLP = LP(); this.worldSendLP = LP();
    this.sfx.connect(this.worldLP); this.worldLP.connect(this.mix); this.sfxSend.connect(this.worldSendLP); this.worldSendLP.connect(this.reverbIn);
    this.reverbReturn.connect(this.mix);
    this.out = G();
    if (o.master === false) this.mix.connect(this.out);
    else {
      this.murmur = c.createBiquadFilter(); this.murmur.type = 'lowpass'; this.murmur.frequency.value = 20000; this.murmur.Q.value = 0.5;
      this.pauseGain = G(); this.fade = G(o.fadeIn === false ? 1 : 0);
      // gentle glue: only the loudest moments are leaned on
      const comp = this.comp = c.createDynamicsCompressor();
      comp.threshold.value = MASTER.comp.threshold; comp.knee.value = MASTER.comp.knee; comp.ratio.value = MASTER.comp.ratio; comp.attack.value = MASTER.comp.attack; comp.release.value = MASTER.comp.release;
      const lim = this.limiter = c.createDynamicsCompressor();
      lim.threshold.value = MASTER.limiter.threshold; lim.knee.value = MASTER.limiter.knee; lim.ratio.value = MASTER.limiter.ratio; lim.attack.value = MASTER.limiter.attack; lim.release.value = MASTER.limiter.release;
      // browsers add make-up gain inside the compressor node; these take it back out so quiet sound passes at unity
      this.compTrim = G(dB(-MASTER.comp.makeup)); this.limTrim = G(dB(-MASTER.limiter.makeup));
      this.clip = c.createWaveShaper(); this.clip.curve = softClipCurve();
      let node = this.mix;
      for (const n of [this.murmur, this.pauseGain, this.fade, comp, this.compTrim, lim, this.limTrim, this.clip, this.out]) { node.connect(n); node = n; }
    }
    this.out.connect(o.destination || c.destination);
  }

  // ---- shared material, made on first use
  noise(kind) { return this._noise[kind] || (this._noise[kind] = makeNoise(this.ctx, kind, { white: 4.3, pink: 7.1, brown: 8.9 }[kind], { white: 101, pink: 202, brown: 303 }[kind])); }
  texture(name) {
    if (!this._tex[name]) this._tex[name] = name === 'drops' ? makeDrops(this.ctx, 8.3, 46, 77) : name === 'shimmer' ? makeShimmer(this.ctx, 10.7, 6.5, 91, SHIMMER_NOTES) : makeShimmer(this.ctx, 7.9, 5, 57, SHIMMER_NOTES);
    return this._tex[name];
  }
  impulse(kind) { return this._ir[kind] || (this._ir[kind] = makeImpulse(this.ctx, kind)); }
  /** Frequency of a MIDI note, moved with the music (see setTune). */
  hz(midi) { return 440 * Math.pow(2, (midi - 69 + this.tuneSemis) / 12 + this.tuneCents / 1200); }
  get cents() { return this.tuneSemis * 100 + this.tuneCents; }

  // ---- levels
  applyVolumes(immediate = false) {
    const t = this.now, tc = immediate ? 0.02 : 0.12, v = this.veil;
    const music = this.musicOn ? userGain(this.musicVolume) : 0, sfx = userGain(this.sfxVolume);
    // inside the veil the world hushes a little. (Until the quiet mix it also came forward by 1.3 when the music was off: no longer.)
    const amb = 1 - 0.3 * v;
    glide(this.musicBus.gain, music, t, immediate ? 0.02 : 0.25);
    glide(this.sfx.gain, sfx, t, tc); glide(this.sfxSend.gain, sfx, t, tc);
    glide(this.ambBus.gain, amb, t, 0.4); glide(this.ambSend.gain, amb, t, 0.4);
  }
  setMusicVolume(v) { this.musicVolume = clamp01(num(v, VOLUME_REFERENCE)); this.applyVolumes(); }
  setSfxVolume(v) { this.sfxVolume = clamp01(num(v, VOLUME_REFERENCE)); this.applyVolumes(); }
  setMusicOn(on) { this.musicOn = !!on; this.applyVolumes(); this.music.refresh(); }
  /** Everything sinks to a murmur behind a closed door, and comes back. */
  setPaused(p) {
    this.paused = !!p; if (!this.murmur) return;
    const t = this.now;
    glide(this.pauseGain.gain, p ? 0.16 : 1, t, p ? 0.3 : 0.45); glide(this.murmur.frequency, p ? 650 : 20000, t, p ? 0.25 : 0.5);
  }
  /** Rise from silence over about `seconds`. */
  fadeIn(seconds = 4) { if (!this.fade) return; const t = this.now, f = this.fade.gain; f.cancelScheduledValues(t); f.setValueAtTime(0, t); f.setTargetAtTime(1, t + 0.05, seconds / 3.5); }
  setHidden(h) { if (this.fade) glide(this.fade.gain, h ? 0 : 1, this.now, h ? 0.12 : 0.6); }

  /** How far into the veil between two realms the boat is (0..1). The music dips behind a curtain (MusicPlayer.setVeil); the hush that used to rise is silent (QUIET_LAYERS). */
  setVeil(v) {
    v = clamp01(num(v, 0));
    if (Math.abs(v - this.veil) < 0.004 && !(v === 0 && this.veil !== 0) && !(v === 1 && this.veil !== 1)) return;
    this.veil = v; this.music.setVeil(v); this.applyVolumes();
    this.setLayer('hush', v > 0.03 ? 0.25 + 0.75 * v : 0, { tc: 0.5 });
  }

  /** The music's key and speed moved: semitones (a track's `transpose`) and cents (from a realm's music.rate). */
  setTune(semis, cents) {
    semis = num(semis, 0); cents = num(cents, 0);
    if (semis === this.tuneSemis && Math.abs(cents - this.tuneCents) < 0.5) return;
    this.tuneSemis = semis; this.tuneCents = cents;
    const t = this.now;
    for (const name in this.layers) { const L = this.layers[name]; if (L.inst && L.inst.retune) L.inst.retune(t); }
  }

  // ---- the space
  /** spec: { size: 'open' | 'room' | 'hall' | 'cavern', mix: 0..1, lowpass: Hz (over everything that is not music) } */
  setSpace(spec = {}, { immediate = false, tc = GLIDE } = {}) {
    if (spec.size !== undefined && !SPACES[spec.size]) warnOnce(`audio: there is no space called "${spec.size}" (open, room, hall or cavern)`);
    const size = SPACES[spec.size] ? spec.size : 'open', mix = clamp01(num(spec.mix, 0.3)), lowpass = clamp(num(spec.lowpass, 20000), 100, 20000);
    const c = this.ctx, t = this.now;
    if (immediate) tc = 0.03;
    glide(this.worldLP.frequency, lowpass, t, tc); glide(this.worldSendLP.frequency, lowpass, t, tc);
    let sp = this.spaces[size];
    if (!sp) {
      sp = this.spaces[size] = { in: c.createGain(), conv: c.createConvolver(), on: false, offAt: Infinity };
      sp.conv.normalize = false; sp.conv.buffer = this.impulse(size); sp.in.gain.value = 0; sp.in.connect(sp.conv);
    }
    if (!sp.on) { this.reverbIn.connect(sp.in); sp.conv.connect(this.reverbReturn); sp.on = true; }
    sp.offAt = Infinity;
    for (const k in this.spaces) {
      const s = this.spaces[k], on = k === size;
      glide(s.in.gain, on ? 1 : 0, t, tc);
      if (!on && s.on && s.offAt === Infinity) s.offAt = t + tc * 5 + SPACES[k].length;      // let its tail ring out, then unplug it
    }
    glide(this.reverbReturn.gain, mix * SPACES[size].wet, t, tc);
    this.space = { size, mix, lowpass };
    this.music.balance(tc);
  }

  // ---- ambience
  /** spec: { water: 0.4, wind: { level: 0.3, tone: 0.6 }, ... }; layers that are not named fall to their default (0, water 0.35). */
  setAmbience(spec = {}, opts = {}) {
    for (const name in spec) if (!this.layers[name] || LAYERS[name].internal) warnOnce(`audio: there is no ambience layer called "${name}" (see docs/audio.md)`);
    for (const name in this.layers) {
      if (LAYERS[name].internal) continue;
      this.setLayer(name, spec[name] === undefined ? (LAYERS[name].default || 0) : spec[name], opts);
    }
  }
  setLayer(name, spec, { immediate = false, tc = GLIDE } = {}) {
    const L = this.layers[name]; if (!L) return;
    const p = typeof spec === 'number' ? { level: spec } : { ...(spec || {}) };
    // the quiet mix: what is heard is the level asked for times QUIET_LAYERS[name]. A layer that comes out at 0 is never built
    // (no nodes, nothing ticking), however often it is asked for or moved.
    const asked = clamp(num(p.level, spec && typeof spec === 'object' ? 0.5 : 0), 0, 1.5), level = asked * clamp(num(QUIET_LAYERS[name], 1), 0, 1), c = this.ctx, t = this.now;
    if (immediate) tc = 0.03;
    L.params = p; L.asked = asked;
    if (name === 'chimes') this.chimeScale = Array.isArray(p.scale) && p.scale.length ? p.scale.map((m) => m + 12 * Math.round(num(p.register, 0))) : DEFAULT_SCALE;   // the 'chime' one-shot draws from it too
    if (level > 0 && !L.inst) {
      L.gain = c.createGain(); L.gain.gain.value = 0; L.send = c.createGain(); L.send.gain.value = L.def.send;
      L.gain.connect(this.ambBus); L.gain.connect(L.send); L.send.connect(this.ambSend);
      L.inst = L.def.build(new Patch(this, t), L.gain, p);
    } else if (L.inst && level > 0 && L.inst.set) L.inst.set(p, t);
    if (L.inst) glide(L.gain.gain, taper(level) * L.def.trim, t, tc);
    if (level === 0 && L.level > 0) L.offAt = t + tc * 6 + 0.3;
    else if (level > 0) L.offAt = Infinity;
    L.level = level;
  }
  dropLayer(L, now) { L.inst.patch.stop(now); if (L.inst.dispose) L.inst.dispose(); L.gain.disconnect(); L.send.disconnect(); L.inst = null; L.gain = L.send = null; }

  // ---- one-shots
  /** Where a sound at local (x, z) sits for the rider: pan, loudness, dullness, and how much of it is the space. */
  place(x, z) {
    const L = this.listener, dx = x - L.x, dz = z - L.z, d = Math.hypot(dx, dz);
    const fx = -Math.sin(L.heading), fz = -Math.cos(L.heading), along = dx * fx + dz * fz, side = dx * Math.cos(L.heading) - dz * Math.sin(L.heading);
    const behind = d > 0.01 ? clamp01(-along / d) : 0;
    const gain = PLACE.ref / (PLACE.ref + Math.max(0, d - PLACE.ref));
    return {
      pan: d > 0.01 ? (side / d) * 0.7 * clamp01(d / 2.5) : 0,
      gain, dist: d,
      lp: (17000 / (1 + d / 55)) * (1 - 0.4 * behind),
      wet: Math.min(3, 1 / Math.sqrt(gain)),              // the space fades more slowly with distance than the direct sound
    };
  }

  /**
   * Play a one-shot. opts: { x, z (realm-local position; omit for "here"), gain 0..2, pitch (ratio), note (MIDI, tonal
   * sounds), pan and panTo (-1..1, when there is no position: where it starts and where it has moved to by its end),
   * lowpass (Hz: muffled, as if under water or behind a wall), delay (s), always (true: one staged moment that must
   * not lose its turn to the same sound fired just before it; never from a callback) }. Returns false if it was not played.
   * The quiet mix: QUIET_SHOTS scales it by name (0: never played), QUIET_GAPS says how often one name may sound.
   */
  play(name, opts = {}) {
    const def = VOICES[name]; if (!def || !def.fn) { warnOnce(`audio: there is no one-shot called "${name}" (see docs/audio.md)`); return false; }
    const quiet = clamp(num(QUIET_SHOTS[name], 1), 0, 1); if (quiet <= 0) return false;
    const now = this.now, t = now + SOON + Math.max(0, num(opts.delay, 0));
    if (this.voices >= MAX_VOICES || Math.abs(t - (this.lastPlayed[name] ?? -1)) < 0.03) return false;      // (the same sound twice within 30 ms is one sound; a delayed one does not hold back those that sound before it)
    const lim = QUIET_GAPS[name];
    if (lim) {                                           // no name may become a patter: at most lim[1] of it start within any lim[0] seconds
      const times = this.sounded[name] || (this.sounded[name] = []); let near = 0, kept = 0;
      for (let i = 0; i < times.length; i++) { const s = times[i]; if (s > now - lim[0]) { times[kept++] = s; if (Math.abs(s - t) < lim[0]) near++; } }
      times.length = kept;
      if (near >= lim[1] && opts.always !== true) return false;
      times.push(t);
    }
    this.lastPlayed[name] = t;
    let s = { pan: clamp(num(opts.pan, 0), -1, 1), gain: 1, lp: 20000, wet: 1 };
    if (typeof opts.x === 'number' && typeof opts.z === 'number') s = this.place(opts.x, opts.z);
    this.fire(name, opts, t, this.fxBus, this.fxSend, { pan: s.pan, gain: s.gain * clamp(num(opts.gain, 1), 0, 2) * quiet, lp: s.lp, send: def.send * s.wet });
    return true;
  }

  /** Build one voice at time t into `dest` (and `send`, the reverb). mixo: { pan, gain, lp, send }. Returns when it ends. */
  fire(name, o, t, dest, send, mixo = {}) {
    // (how many of each one-shot have sounded, and the sum of their gains: `&run=` reports it, for finding what a rider hears)
    const tally = this.fired || (this.fired = {}), row = tally[name] || (tally[name] = [0, 0]); row[0]++; row[1] += num(mixo.gain, 1);
    const def = VOICES[name], v = new Patch(this, t), c = this.ctx;
    v.in = v.gain(num(mixo.gain, 1) * def.trim);
    let node = v.in;
    const lp = Math.min(num(mixo.lp, 20000), num(o.lowpass, 20000));
    if (lp < 15000) node = v.chain(node, v.filter('lowpass', Math.max(80, lp), 0.5));
    const pan = v.pan(num(mixo.pan, 0)); node.connect(pan); pan.connect(dest);
    let sendNode = null;
    if (send && mixo.send > 0) { sendNode = v.gain(mixo.send); pan.connect(sendNode); sendNode.connect(send); }
    const pitch = clamp(num(o.pitch, 1), 0.25, 4);
    const end = def.fn(v, t, {
      pitch, side: num(o.side, 0), strength: num(o.strength, 1), r: this.rand,
      hz: (midi) => this.hz(num(o.note, midi)) * pitch,
      scale: this.chimeScale, note: o.note,
    });
    if (typeof o.panTo === 'number' && Number.isFinite(o.panTo)) { pan.pan.setValueAtTime(pan.pan.value, t); pan.pan.linearRampToValueAtTime(clamp(o.panTo, -1, 1), Math.max(t + 0.05, end - 0.2)); }
    v.stop(end + 0.05);
    this.voices++;
    this.gc.push({ at: end + 0.2, fn: () => { pan.disconnect(); if (sendNode) sendNode.disconnect(); this.voices--; } });
    return end;
  }

  // ---- time
  /** Schedule what repeats (drips, chimes, paddle strokes ...) up to `horizon`, and tidy up what has finished. */
  tick(now = this.now, horizon = now + LOOKAHEAD) {
    for (const name in this.layers) {
      const L = this.layers[name]; if (!L.inst) continue;
      if (L.level > 0) { if (L.inst.tick) L.inst.tick(now, horizon); } else if (now > L.offAt) this.dropLayer(L, now);
    }
    for (const k in this.spaces) { const s = this.spaces[k]; if (s.on && now > s.offAt) { this.reverbIn.disconnect(s.in); s.conv.disconnect(); s.on = false; s.offAt = Infinity; } }
    if (this.gc.length) { const keep = []; for (const e of this.gc) { if (e.at <= now) e.fn(); else keep.push(e); } this.gc = keep; }
    this.music.tick(now);
  }
  /** Offline renders: schedule everything for the next `seconds` in one go. */
  prime(seconds) { this.tick(this.now, this.now + seconds); }
}

// ------------------------------------------------------------------------------------------------ constants
// `makeup` is the gain a browser's DynamicsCompressorNode adds by itself at these settings (measured in
// lab/audio-test.html, "calibration"); the graph takes it back out.
export const MASTER = {
  comp: { threshold: -12, knee: 8, ratio: 3, attack: 0.02, release: 0.3, makeup: 3.32 },
  limiter: { threshold: -2.5, knee: 0, ratio: 20, attack: 0.001, release: 0.08, makeup: 1.42 },
};
const PLACE = { ref: 8 };                              // metres inside which a one-shot is at full level
const DEFAULT_SCALE = [74, 77, 79, 81, 84];            // D5 F5 G5 A5 C6: D minor pentatonic, the notes the music leans on most
const SHIMMER_NOTES = [103, 105, 108, 110, 113, 115, 117, 120];     // G7 .. C9, D minor pentatonic
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

/** Give a set of oscillator groups ("slots") their notes. A note that changes dips out, moves, and rises: it never slides. */
function assignNotes(g, slots, notes, t, first) {
  slots.forEach((s, i) => {
    const note = notes[i] ?? null;
    if (note === s.note) return;
    const lvl = note === null ? 0 : 1 / Math.sqrt(notes.length);
    for (const o of s.oscs) o.frequency.cancelScheduledValues(t);
    if (first || s.note === null) {
      for (const o of s.oscs) o.frequency.setValueAtTime(mtof(note ?? 45), t);
      glide(s.on.gain, lvl, t, first ? 0.05 : 0.9);
    } else {
      glide(s.on.gain, 0, t, 0.3);
      if (note !== null) { for (const o of s.oscs) o.frequency.setValueAtTime(mtof(note), t + 1.5); s.on.gain.setTargetAtTime(lvl, t + 1.6, 0.9); }
    }
    s.note = note;
  });
}
const retuneSlots = (g, slots, t) => { for (const s of slots) s.oscs.forEach((o, k) => glide(o.detune, s.spread[k] + g.cents, t, 0.8)); };
/** When the next random event falls: on average `rate` a second, never closer than `min` seconds. */
const gap = (r, rate, min) => clamp(-Math.log(1 - r()) / rate, min, 4 / rate);

// ------------------------------------------------------------------------------------------------ the quiet mix
// 9 November. The client, after his first ride:
//   "ok this game has too much ambient noise like the dripping and the static sounds. remove most of the ambient noise."
// The "static" was the layers made of noise (water, wind, rain, falls, surf, night, the hush in the veil, the bow wash);
// the "dripping" was the drips layer, the rain's plips and the 'drop' and 'tick' one-shots fired from callbacks.
// The areas are untouched and may go on asking: these tables stand between what they ask for and what is heard.
// Measured per area in docs/build/sound-quiet.md; for authors, docs/audio.md ("The quiet mix").

/** Ambience: the level an area asks for is multiplied by this in setLayer (levels are perceptual: 0.3 is 17 dB down, 0.7 is 5 dB). 0: never built. */
export const QUIET_LAYERS = {
  // noise, drops and ticks: all off. (They were water 0.3, rain 0.2, falls 0.25, surf 0.3, ice 0.4 until the client,
  // rowing later the same day, wrote "there's still a strange scratching sound as im rowing through areas": the water
  // bed is laps of swept noise every second or two, in every area. Nothing made of noise is left under the music;
  // if the water is to be heard again it should be a recording of water, not noise shaped to resemble it.)
  water: 0, wind: 0, night: 0, rain: 0, drips: 0, falls: 0, surf: 0, hush: 0, ice: 0,
  birds: 0.6, shimmer: 0.7, chimes: 0.6, bells: 1, drone: 0.75, choir: 0.9, deep: 0.6,                // notes: they sit with the music (the pad and the deep a little further down: in the town they were most of what was left)
};
/** One-shots an area fires through play(): gain by name. 0: never played. The tuned ones (ring, chime, lamp, bell, bloom, sparkle, whale) are not listed: as they were. */
// (the same day, after "a strange scratching sound": the dry tick is gone, 69 of them in that ride; the rustle, the flutter, the knock and the splash, all made of noise, are down again)
export const QUIET_SHOTS = { drop: 0, tick: 0, creak: 0, rustle: 0, flutter: 0, splash: 0.3, breath: 0.25, whump: 0.6, crack: 0.6, knock: 0.25, bird: 0.6 };      // (creak, rustle, flutter: rasps and beaten noise; areas fired 15, 23 and 23 of them in that ride)
/** How often one name may sound through play(): [seconds, how many may start within them]. Noise: once in 1.5 s. Tuned: twice a second. */
const ONCE = [1.5, 1], TWICE = [1, 2];
export const QUIET_GAPS = {
  drop: ONCE, tick: ONCE, splash: ONCE, rustle: ONCE, flutter: ONCE, breath: ONCE, whump: ONCE, crack: ONCE, knock: ONCE, bird: ONCE, creak: ONCE,
  ring: TWICE, chime: TWICE, lamp: TWICE, bell: TWICE, bloom: TWICE, sparkle: TWICE, whale: TWICE,
};
/**
 * The boat's own sounds, as a share of how loud they were (perceptual, like every level here). 0: never made.
 * Later on 9 November the client, rowing: "there's still a strange scratching sound as im rowing through areas. fix
 * that." Counted over a rowed ride of 220 s (`&run=`, the `fired` column): 129 strokes (each a burst of filtered noise),
 * 13 creaks (a rasp of pulses) and 139 bumps, the bump's knock and slap of water being noise too, and a boat that
 * slid along anything under oars bumped again every 0.4 s. (The first measurement of the quiet mix was taken
 * drifting: none of this was in it.) So: no stroke, no creak, no wash; a bump is one soft low thud, once for one
 * meeting (BoatSound.drive), half as loud.
 */
export const QUIET_BOAT = { wash: 0, paddle: 0, creak: 0, bump: taper(0.5) };
/** The music carries the ride: where an area asks for music its gain and low-pass are never below these; in the veil it dips this far behind a curtain. */
export const QUIET_MUSIC = { gain: 0.55, lowpass: 1100, veilDb: -4, veilLowpass: 1200 };

// ------------------------------------------------------------------------------------------------ ambience layers
// build(P, out, params) wires a layer into `out` and returns { patch, set?, tick?, retune? }.
//   send: how much of the layer goes to the space; trim: calibration so that level 1 is the loudness in docs/audio.md
const LAYERS = {};

// Water lapping around the hull: two bands of soft irregular laps, one to each side, over water that is never quite still.
LAYERS.water = { default: 0.35, send: 0.08, trim: 1.29,
  build(P, out) {
    const g = P.g, src = P.noise('pink'), hiss = P.noise('white');
    for (const [pan, seconds, f] of [[-0.55, 37, 470], [0.55, 43, 560]]) {
      const env = P.ctl(lapCurve(g.rand, seconds, 100, 0.9, 1.9, 0.16, 0.5), 100);
      const bp = P.filter('bandpass', f, 1.5), amp = P.gain(0.04), sweep = P.gain(800), wet = P.gain(0), side = P.pan(pan);
      env.connect(amp.gain); env.connect(sweep); sweep.connect(bp.detune); env.connect(wet.gain);      // each lap opens upward as it lands
      P.chain(src, bp, amp, side); P.chain(hiss, P.filter('bandpass', 2100, 0.7), wet, P.gain(0.2), side); side.connect(out);
    }
    P.chain(src, P.filter('highpass', 140, 0.5), P.filter('lowpass', 700, 0.5), P.gain(0.2), out);
    const ripple = P.ctl(lapCurve(g.rand, 29, 100, 0.25, 0.9, 0.03, 0.09), 100), hi = P.gain(0);
    ripple.connect(hi.gain);
    P.chain(hiss, P.filter('bandpass', 3300, 1.4), hi, P.gain(0.3), out);
    return { patch: P };
  } };

// Wind: an airy band whose pitch and strength wander in slow gusts, a thin hiss above it, weight below. params: tone 0..1
LAYERS.wind = { send: 0.05, trim: 0.91,
  build(P, out, p) {
    const base = (tone) => 240 * Math.pow(2, clamp01(num(tone, 0.5)) * 1.7), f0 = base(p.tone);
    const gust = P.wander(47, 4.2, 0.18, 1), drift = P.wander(61, 6.5, -520, 520);
    const body = P.filter('bandpass', f0, 0.6), a1 = P.gain(0); gust.connect(a1.gain); drift.connect(body.detune);
    P.chain(P.noise('pink'), body, a1, out);
    const air = P.filter('bandpass', f0 * 4.4, 0.8), a2 = P.gain(0), k2 = P.gain(0.6); gust.connect(k2); k2.connect(a2.gain); drift.connect(air.detune);
    P.chain(P.noise('white'), air, a2, out);
    const a3 = P.gain(0.1), k3 = P.gain(0.2); gust.connect(k3); k3.connect(a3.gain);
    P.chain(P.noise('brown'), P.filter('highpass', 50, 0.5), P.filter('lowpass', 150, 0.5), a3, out);
    return { patch: P, set(p2, t) { const f = base(p2.tone); glide(body.frequency, f, t, 1.5); glide(air.frequency, f * 4.4, t, 1.5); } };
  } };

// Rain on water: a soft bed, thousands of tiny plips (a baked texture read at two speeds), a low patter underneath.
LAYERS.rain = { send: 0.06, trim: 0.9,
  build(P, out) {
    const amp = P.gain(0), tex = P.g.texture('drops'), hp = P.filter('highpass', 900, 0.5);
    P.wander(53, 6, 0.75, 1.1).connect(amp.gain);
    P.chain(P.noise('pink'), P.filter('highpass', 1100, 0.5), P.filter('lowpass', 7200, 0.5), P.gain(0.5), amp);
    P.chain(P.loop(tex, 1), P.gain(0.8), hp); P.chain(P.loop(tex, 0.83), P.gain(0.6), hp); hp.connect(amp);
    P.chain(P.noise('brown'), P.filter('bandpass', 380, 0.6), P.gain(0.3), amp);
    amp.connect(out);
    return { patch: P };
  } };

// Falling water somewhere near: a broad, steady rush.
LAYERS.falls = { send: 0.05, trim: 0.39,
  build(P, out) {
    const amp = P.gain(0);
    P.wander(31, 3.5, 0.8, 1.05).connect(amp.gain);
    P.chain(P.noise('pink'), P.filter('highpass', 180, 0.5), P.filter('lowpass', 4200, 0.5), amp);
    P.chain(P.noise('white'), P.filter('bandpass', 2400, 0.5), P.gain(0.22), amp);
    P.chain(P.noise('brown'), P.filter('highpass', 45, 0.5), P.filter('lowpass', 240, 0.5), P.gain(0.8), amp);
    amp.connect(out);
    return { patch: P };
  } };

// Single drops into still water, each with a long tail of its own (two delays feeding each other, darker every pass). params: rate
LAYERS.drips = { send: 0.6, trim: 0.71,
  build(P, out, p) {
    const g = P.g, bus = P.gain(1), wet = P.gain(0.45);
    const d1 = P.delay(0.293), d2 = P.delay(0.419), f1 = P.filter('lowpass', 2400, 0.5), f2 = P.filter('lowpass', 2000, 0.5);
    bus.connect(out); bus.connect(d1);
    P.chain(d1, f1, P.gain(0.52), d2); P.chain(d2, f2, P.gain(0.52), d1);
    P.chain(f1, P.pan(-0.6), wet); P.chain(f2, P.pan(0.6), wet); wet.connect(out);
    return { patch: P, p, next: P.t + 0.3 + g.rand() * 1.5,
      set(p2) { this.p = p2; },
      tick(now, horizon) {
        const rate = clamp(num(this.p.rate, 0.35), 0.02, 3), r = g.rand;
        if (this.next < now - 0.5) this.next = now + 0.05;
        while (this.next < horizon) {
          const t = Math.max(this.next, now + SOON);
          g.fire('drop', { pitch: 0.7 + 0.75 * r() }, t, bus, null, { pan: (r() * 2 - 1) * 0.8, gain: 0.3 + 0.7 * r() * r() });
          if (r() < 0.22) g.fire('drop', { pitch: 1.2 + 0.5 * r() }, t + 0.11 + 0.2 * r(), bus, null, { pan: (r() * 2 - 1) * 0.8, gain: 0.2 + 0.2 * r() });
          this.next += gap(r, rate, 0.3);
        }
      } };
  } };

// Sparse glassy notes from the realm's scale: mostly neighbouring notes, now and then a leap or a pair. params: scale, rate, register
LAYERS.chimes = { send: 0.6, trim: 0.74,
  build(P, out, p) {
    const g = P.g;
    return { patch: P, p, next: P.t + 0.4 + g.rand() * 2, idx: 0,
      set(p2) { this.p = p2; },
      tick(now, horizon) {
        const q = this.p, scale = Array.isArray(q.scale) && q.scale.length ? q.scale : DEFAULT_SCALE, r = g.rand;
        const rate = clamp(num(q.rate, 0.22), 0.01, 3), reg = 12 * Math.round(num(q.register, 0)), last = scale.length - 1;
        if (this.next < now - 0.5) this.next = now + 0.05;
        while (this.next < horizon) {
          const t = Math.max(this.next, now + SOON);
          this.idx = r() < 0.25 ? Math.floor(r() * scale.length) : clamp(this.idx + (r() < 0.5 ? -1 : 1) * (r() < 0.7 ? 1 : 2), 0, last);
          g.fire('chime', { note: scale[this.idx] + reg }, t, out, null, { pan: (r() * 2 - 1) * 0.75, gain: 0.35 + 0.65 * r() });
          if (r() < 0.3) g.fire('chime', { note: scale[clamp(this.idx + (r() < 0.5 ? -1 : 1), 0, last)] + reg }, t + 0.22 + 0.4 * r(), out, null, { pan: (r() * 2 - 1) * 0.75, gain: 0.25 + 0.4 * r() });
          this.next += gap(r, rate, 0.5);
        }
      } };
  } };

// A rare low bell, far away. params: notes (MIDI, around 45..57), rate (bells per second, default one in about 30 s)
LAYERS.bells = { send: 0.8, trim: 0.74,
  build(P, out, p) {
    const g = P.g;
    return { patch: P, p, next: P.t + 2 + g.rand() * 5,
      set(p2) { this.p = p2; },
      tick(now, horizon) {
        const q = this.p, notes = Array.isArray(q.notes) && q.notes.length ? q.notes : [50, 45], rate = clamp(num(q.rate, 0.035), 0.005, 0.5), r = g.rand;
        if (this.next < now - 0.5) this.next = now + 1 + r() * 3;
        while (this.next < horizon) {
          g.fire('bell', { note: notes[Math.floor(r() * notes.length)] }, Math.max(this.next, now + SOON), out, null, { pan: (r() * 2 - 1) * 0.6, gain: 0.55 + 0.45 * r(), lp: 1500 + 1500 * r() });
          this.next += (0.6 + 0.8 * r()) / rate;
        }
      } };
  } };

// Ice: little clusters of ticks, the falling "pew" of a sheet singing, a slow groan now and then. params: rate
LAYERS.ice = { send: 0.6, trim: 0.8,
  build(P, out, p) {
    const g = P.g;
    return { patch: P, p, next: P.t + 0.5 + g.rand() * 2,
      set(p2) { this.p = p2; },
      tick(now, horizon) {
        const rate = clamp(num(this.p.rate, 0.3), 0.02, 2), r = g.rand;
        if (this.next < now - 0.5) this.next = now + 0.05;
        while (this.next < horizon) {
          const t = Math.max(this.next, now + SOON), k = r(), pan = (r() * 2 - 1) * 0.85, gain = 0.35 + 0.65 * r() * r();
          if (k < 0.5) { let tt = t; for (let i = 2 + Math.floor(r() * 4); i > 0; i--) { g.fire('tick', { pitch: 0.7 + 0.8 * r() }, tt, out, null, { pan: pan + (r() - 0.5) * 0.3, gain: gain * (0.5 + 0.5 * r()) }); tt += 0.03 + 0.14 * r() * r(); } }
          else g.fire(k < 0.8 ? 'pew' : 'groan', { pitch: 0.7 + 0.65 * r() }, t, out, null, { pan, gain });
          this.next += gap(r, rate, 0.4);
        }
      } };
  } };

// Very high, faint glassy sparkles: two baked textures of pings on the home scale, of different lengths, drifting in and out.
LAYERS.shimmer = { send: 0.5, trim: 0.23,
  build(P, out) {
    const g = P.g, hp = P.filter('highpass', 2200, 0.5);
    const a = P.loop(g.texture('shimmer'), 1), b = P.loop(g.texture('shimmer2'), 1), ga = P.gain(0), gb = P.gain(0);
    P.wander(47, 5, 0.25, 1).connect(ga.gain); P.wander(61, 6, 0.2, 0.9).connect(gb.gain);
    P.chain(a, ga, hp); P.chain(b, gb, hp); hp.connect(out);
    const inst = { patch: P, retune(t) { for (const s of [a, b]) if (s.detune) glide(s.detune, g.cents, t, 1); } };
    for (const s of [a, b]) if (s.detune) s.detune.value = g.cents;
    return inst;
  } };

// Night insects, far off: three narrow trilling bands that swell and fade independently, and a breath of high air. Never a chirp.
LAYERS.night = { send: 0.1, trim: 1.45,
  build(P, out) {
    const src = P.noise('white');
    for (const [f, trill, pan, period] of [[2900, 27, -0.6, 31], [3600, 34, 0.15, 43], [4350, 41, 0.7, 53]]) {
      const band = P.filter('bandpass', f, 34), am = P.gain(0.5), depth = P.gain(0.5), sw = P.gain(0);
      P.chain(P.osc('sine', trill), depth); depth.connect(am.gain);
      P.wander(period, 5, 0, 1).connect(sw.gain); P.wander(period + 9, 7, -30, 30).connect(band.detune);
      P.chain(src, band, am, sw, P.pan(pan), out);
    }
    const air = P.gain(0);
    P.wander(39, 6, 0.3, 1).connect(air.gain);
    P.chain(src, P.filter('bandpass', 6800, 0.9), air, P.gain(0.05), out);
    return { patch: P };
  } };

// A warm pad that breathes: up to four notes, each a pair of detuned saws and a sine, behind a slowly moving low-pass.
// params: notes (MIDI), colour 0 (dark, nearly sines) .. 1 (bright)
LAYERS.drone = { send: 0.3, trim: 0.365,
  build(P, out, p) {
    const g = P.g, lp1 = P.filter('lowpass', 800, 0.5), lp2 = P.filter('lowpass', 1100, 0.7), slots = [];
    P.wander(49, 6, -350, 350).connect(lp1.detune);
    P.chain(lp1, lp2, out);
    for (let i = 0; i < 4; i++) {
      const oscs = [P.osc('sawtooth', 110), P.osc('sawtooth', 110), P.osc('sine', 110)], breathe = P.gain(0), on = P.gain(0);
      P.wander(29 + 7 * i, 4.5, 0.3, 1).connect(breathe.gain);
      oscs.forEach((o, k) => P.chain(o, P.gain(k < 2 ? 0.3 : 0.3), breathe));
      P.chain(breathe, on, P.pan([-0.35, 0.35, -0.15, 0.2][i]), lp1);
      slots.push({ oscs, spread: [-7, 7, 0], on, note: null });
    }
    const inst = { patch: P,
      set(q, t, first = false) {
        const notes = (Array.isArray(q.notes) && q.notes.length ? q.notes : [38, 45, 50]).slice(0, 4), colour = clamp01(num(q.colour, 0.4));
        const cut = clamp(Math.max(200 * Math.pow(2, 3.6 * colour), mtof(Math.min(...notes)) * 2.5), 120, 5000), tc = first ? 0.01 : 1.2;
        glide(lp1.frequency, cut, t, tc); glide(lp2.frequency, cut * 1.4, t, tc);
        assignNotes(g, slots, notes, t, first); retuneSlots(g, slots, t);
      },
      retune(t) { retuneSlots(g, slots, t); } };
    inst.set(p, P.t, true);
    return inst;
  } };

// A far choir on "ooh": saw pairs with a living vibrato through three vowel formants that drift between "oo" and "oh". params: notes
LAYERS.choir = { send: 0.5, trim: 1.5,
  build(P, out, p) {
    const g = P.g, bank = P.gain(1), sum = P.gain(1), vowel = P.wander(57, 7, 0, 1), slots = [];
    for (const [f, q, lvl, move] of [[340, 4.5, 1, 420], [730, 6, 0.42, 300], [2450, 7, 0.05, 0]]) {
      const bp = P.filter('bandpass', f, q), k = P.gain(move); vowel.connect(k); k.connect(bp.detune);
      P.chain(bank, bp, P.gain(lvl), sum);
    }
    P.chain(sum, P.filter('lowpass', 3000, 0.5), out);
    P.chain(P.noise('pink'), P.gain(0.05), bank);                                   // breath
    for (let i = 0; i < 4; i++) {
      const oscs = [P.osc('sawtooth', 220), P.osc('sawtooth', 220)], vib = P.osc('sine', 4.7 + 0.37 * i), depth = P.gain(0), sw = P.gain(0), on = P.gain(0);
      P.wander(33 + 5 * i, 6, 2, 9).connect(depth.gain);                            // vibrato depth in cents, itself never still
      vib.connect(depth); for (const o of oscs) { depth.connect(o.detune); P.chain(o, P.gain(0.2), sw); }
      P.wander(23 + 6 * i, 4, 0.15, 1).connect(sw.gain);
      P.chain(sw, on, P.pan([-0.4, 0.4, 0.1, -0.15][i]), bank);
      slots.push({ oscs, spread: [-8, 8], on, note: null });
    }
    const inst = { patch: P,
      set(q, t, first = false) { assignNotes(g, slots, (Array.isArray(q.notes) && q.notes.length ? q.notes : [50, 57, 65]).slice(0, 4), t, first); retuneSlots(g, slots, t); },
      retune(t) { retuneSlots(g, slots, t); } };
    inst.set(p, P.t, true);
    return inst;
  } };

// Something vast below: two sub-bass sines beating very slowly, a fifth and an octave above them, and a low rumble. params: note
LAYERS.deep = { send: 0, trim: 0.23,
  build(P, out, p) {
    const g = P.g, sw = P.gain(0), rum = P.gain(0), oscs = [];
    P.wander(41, 7, 0.12, 1).connect(sw.gain); P.wander(53, 6, 0.2, 1).connect(rum.gain);
    for (const [ratio, lvl, cents] of [[1, 0.5, 0], [1, 0.4, 7], [1.5, 0.16, 0], [2, 0.2, -3], [3, 0.07, 2]]) { const o = P.osc('sine', 36.7 * ratio, cents); P.chain(o, P.gain(lvl), sw); oscs.push({ o, ratio, cents }); }
    P.chain(P.noise('brown'), P.filter('highpass', 22, 0.5), P.filter('lowpass', 85, 0.5), rum, P.gain(1.2), out);
    sw.connect(out);
    const inst = { patch: P,
      set(q, t, first = false) { const f = mtof(num(q.note, 26)); for (const x of oscs) glide(x.o.frequency, f * x.ratio, t, first ? 0.01 : 1.5); this.retune(t); },
      retune(t) { for (const x of oscs) glide(x.o.detune, x.cents + g.cents, t, 0.8); } };
    inst.set(p, P.t, true);
    return inst;
  } };

// The sea breathing on rock: each wave gathers low, breaks into a wash a moment later, and hisses as it drains away.
LAYERS.surf = { send: 0.12, trim: 1,
  build(P, out) {
    const wave = P.ctl(lapCurve(P.g.rand, 67, 50, 7, 5, 2.6, 1.4), 50), low = P.gain(0.05), wash = P.gain(0), hiss = P.gain(0), late = P.delay(1.1, 3), later = P.delay(2.4, 3);
    wave.connect(low.gain); P.chain(wave, late); late.connect(wash.gain); P.chain(wave, later); later.connect(hiss.gain);
    P.chain(P.noise('brown'), P.filter('highpass', 60, 0.5), P.filter('lowpass', 320, 0.5), low, P.gain(1.4), out);
    P.chain(P.noise('pink'), P.filter('bandpass', 900, 0.5), wash, out);
    P.chain(P.noise('white'), P.filter('bandpass', 4200, 0.7), hiss, P.gain(0.22), out);
    return { patch: P };
  } };

// Birds a long way off, now and then. params: rate (calls per second, default one in about 8 s)
LAYERS.birds = { send: 0.7, trim: 0.7,
  build(P, out, p) {
    const g = P.g;
    return { patch: P, p, next: P.t + 1 + g.rand() * 4,
      set(p2) { this.p = p2; },
      tick(now, horizon) {
        const rate = clamp(num(this.p.rate, 0.12), 0.01, 1), r = g.rand;
        if (this.next < now - 0.5) this.next = now + 0.5;
        while (this.next < horizon) {
          g.fire('bird', { pitch: 0.8 + 0.5 * r() }, Math.max(this.next, now + SOON), out, null, { pan: (r() * 2 - 1) * 0.9, gain: 0.25 + 0.75 * r() * r(), lp: 2500 + 3500 * r() });
          this.next += gap(r, rate, 1.5);
        }
      } };
  } };

// The hush inside the veil between two realms (driven by the engine, not by realms).
LAYERS.hush = { internal: true, send: 0.15, trim: 0.45,
  build(P, out) {
    const bp = P.filter('bandpass', 520, 0.7), amp = P.gain(0);
    P.wander(23, 3.5, -400, 500).connect(bp.detune); P.wander(19, 3, 0.55, 1).connect(amp.gain);
    P.chain(P.noise('pink'), bp, P.filter('lowpass', 2200, 0.5), amp, out);
    return { patch: P };
  } };

// ------------------------------------------------------------------------------------------------ one-shot voices
// fn(v, t, o) builds one sound at time t into v.in and returns the time it has died away.
//   o: { pitch (ratio), hz(defaultMidi) (the note asked for, or the default, in tune with the music), r (random), strength, scale }
const VOICES = {};

// A single drop into still water: a tiny bubble whose pitch rises as it closes.
VOICES.drop = { send: 0.45, trim: 0.42, fn(v, t, o) {
  const r = o.r, f0 = (700 + 800 * r()) * o.pitch, body = v.osc('sine', f0), a = v.gain(0), ta = v.gain(0);
  body.frequency.setValueAtTime(f0, t); body.frequency.exponentialRampToValueAtTime(f0 * (1.7 + 0.5 * r()), t + 0.065);
  hit(a.gain, t, 0.5, 0.004, 0.035 + 0.03 * r()); v.chain(body, a, v.in);
  hit(ta.gain, t, 0.1, 0.001, 0.004); v.chain(v.burst('white', t, 0.03), v.filter('highpass', 2500, 0.5), ta, v.in);
  return t + 0.55;
} };

// A soft ring, like a small bowl touched once. Default note D5.
VOICES.ring = { send: 0.5, trim: 0.445, fn(v, t, o) {
  const f = o.hz(74);
  for (const [ratio, peak, tau] of [[1, 0.4, 0.75], [1.0028, 0.28, 0.65], [2, 0.11, 0.38], [3.01, 0.05, 0.2], [4.23, 0.025, 0.1]]) {
    if (f * ratio > 15000) continue;
    const a = v.gain(0); hit(a.gain, t, peak, 0.012, tau); v.chain(v.osc('sine', f * ratio), a, v.in);
  }
  return t + 5.2;
} };

// A glassy chime. With no note given it takes one from the realm's chime scale.
VOICES.chime = { send: 0.5, trim: 0.4, fn(v, t, o) {
  const f = o.note == null ? v.g.hz(o.scale[Math.floor(o.r() * o.scale.length)]) * o.pitch : o.hz(81);
  for (const [ratio, peak, tau] of [[1, 0.42, 0.55], [1.0022, 0.22, 0.5], [2.76, 0.13, 0.16], [5.4, 0.05, 0.06]]) {
    if (f * ratio > 15000) continue;
    const a = v.gain(0); hit(a.gain, t, peak, 0.003, tau); v.chain(v.osc('sine', f * ratio), a, v.in);
  }
  return t + 3.9;
} };

// Something slipping into the water: a soft rush that sinks in pitch, a low plunge, a scatter of drops falling back.
VOICES.splash = { send: 0.3, trim: 0.71, fn(v, t, o) {
  const r = o.r, p = o.pitch, bp = v.filter('bandpass', 1900 * p, 0.8), a = v.gain(0), body = v.osc('sine', 170 * p), ba = v.gain(0);
  bp.frequency.setValueAtTime(1900 * p, t); bp.frequency.exponentialRampToValueAtTime(520 * p, t + 0.4);
  hit(a.gain, t, 0.9, 0.014, 0.13); v.chain(v.burst('white', t, 1.0), bp, a, v.in);
  body.frequency.setValueAtTime(170 * p, t); body.frequency.exponentialRampToValueAtTime(85 * p, t + 0.16);
  hit(ba.gain, t, 0.3, 0.008, 0.06); v.chain(body, ba, v.in);
  for (let i = 0; i < 5; i++) {
    const tt = t + 0.12 + 0.5 * r(), f = (1100 + 2200 * r()) * p, d = v.osc('sine', f, 0, tt), da = v.gain(0);
    d.frequency.setValueAtTime(f, tt); d.frequency.exponentialRampToValueAtTime(f * 1.6, tt + 0.05);
    hit(da.gain, tt, 0.06 + 0.08 * r(), 0.003, 0.025); v.chain(d, da, v.in);
  }
  return t + 1.2;
} };

// A slow airy swell, like something large breathing out.
VOICES.breath = { send: 0.55, trim: 1, fn(v, t, o) {
  const p = o.pitch, bp = v.filter('bandpass', 520 * p, 1.1), hi = v.filter('bandpass', 1500 * p, 2), a = v.gain(0), n = v.burst('pink', t, 6.3);
  bp.frequency.setValueAtTime(520 * p, t); bp.frequency.linearRampToValueAtTime(880 * p, t + 1.5); bp.frequency.linearRampToValueAtTime(600 * p, t + 4);
  swell(a.gain, t, 1, 1.5, 0.2, 2.0);
  v.chain(n, bp, a, v.in); v.chain(n, hi, v.gain(0.25), a);
  return t + 6.3;
} };

// A slow, distant call that rises and sinks, with a vibrato that only arrives as it fades. It sets out from its note
// (default D3), leans on the fifth above and sinks home again, so it sits inside the music's key.
VOICES.whale = { send: 0.8, trim: 0.255, fn(v, t, o) {
  const r = o.r, p = o.pitch, f0 = o.hz(50), dur = 4.6 + 1.6 * r(), a = v.gain(0);
  const lp = v.filter('lowpass', 950, 0.6), form = v.filter('peaking', 430 * p, 2.2, 9);
  const oscs = [v.osc('triangle', f0), v.osc('sine', f0 * 2), v.osc('sawtooth', f0)], vib = v.osc('sine', 3.6), depth = v.gain(0);
  const bend = new Float32Array([1, 1.03, 1.3, 1.5, 1.5, 1.42, 1.2, 1].map((x) => 1200 * Math.log2(x)));       // cents
  depth.gain.setValueAtTime(0, t + dur * 0.4); depth.gain.linearRampToValueAtTime(22, t + dur); vib.connect(depth);
  for (const osc of oscs) { osc.detune.setValueCurveAtTime(bend, t, dur); depth.connect(osc.detune); }
  swell(a.gain, t, 0.75, 0.9, dur - 2.6, 1.7);
  oscs[0].connect(lp); v.chain(oscs[1], v.gain(0.22), lp); v.chain(oscs[2], v.gain(0.08), lp); v.chain(lp, form, a, v.in);
  return t + dur + 2.4;
} };

// Ice giving way somewhere: a soft crack, a low knock, and the falling chirp of the sheet singing.
VOICES.crack = { send: 0.6, trim: 0.415, fn(v, t, o) {
  const r = o.r, p = o.pitch, na = v.gain(0), th = v.osc('sine', 110 * p), ta = v.gain(0), f = (2600 + 900 * r()) * p, ch = v.osc('sine', f), ca = v.gain(0);
  hit(na.gain, t, 0.55, 0.002, 0.022); v.chain(v.burst('white', t, 0.25), v.filter('bandpass', 2400 * p, 1.2), na, v.in);
  th.frequency.setValueAtTime(110 * p, t); th.frequency.exponentialRampToValueAtTime(60 * p, t + 0.12);
  hit(ta.gain, t, 0.3, 0.004, 0.05); v.chain(th, ta, v.in);
  ch.frequency.setValueAtTime(f, t + 0.01); ch.frequency.exponentialRampToValueAtTime(f * 0.16, t + 0.42);
  hit(ca.gain, t + 0.01, 0.3, 0.004, 0.14); v.chain(ch, ca, v.in);
  return t + 1.1;
} };

// A handful of tiny, very high glassy pings.
VOICES.sparkle = { send: 0.5, trim: 0.5, fn(v, t, o) {
  const r = o.r, n = 5 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const tt = t + i * (0.04 + 0.07 * r()), f = v.g.hz(SHIMMER_NOTES[Math.floor(r() * SHIMMER_NOTES.length)]) * o.pitch, a = v.gain(0);
    if (f > 15000) continue;
    hit(a.gain, tt, 0.12 + 0.12 * r(), 0.003, 0.05 + 0.08 * r());
    v.chain(v.osc('sine', f, 0, tt), a, v.pan((r() * 2 - 1) * 0.5), v.in);
  }
  return t + 1.7;
} };

// A low bell, far away: hum, prime, a minor third, fifth and octave, each dying at its own rate. Default note D3.
VOICES.bell = { send: 0.7, trim: 0.385, fn(v, t, o) {
  const f = o.hz(50);
  for (const [ratio, peak, tau] of [[0.5, 0.34, 1.9], [1, 0.4, 1.3], [1.19, 0.2, 0.9], [1.5, 0.1, 0.65], [2, 0.16, 0.5], [2.74, 0.06, 0.3], [3, 0.05, 0.25], [4.07, 0.03, 0.16]]) {
    const a = v.gain(0); hit(a.gain, t, peak, 0.018, tau); v.chain(v.osc('sine', f * ratio), a, v.in);
  }
  return t + 13;
} };

// A soft note that swells in and away, for a light waking or something unfolding. Default note D4.
VOICES.bloom = { send: 0.6, trim: 0.5, fn(v, t, o) {
  const f = o.hz(62), a = v.gain(0), lp = v.filter('lowpass', Math.min(6000, f * 4), 0.6);
  for (const [ratio, lvl, cents] of [[1, 0.32, -5], [1, 0.32, 6], [1.5, 0.14, 2], [2, 0.1, -3]]) v.chain(v.osc(ratio === 1 ? 'triangle' : 'sine', f * ratio, cents), v.gain(lvl), lp);
  swell(a.gain, t, 0.8, 1.3, 0.3, 2.6); v.chain(lp, a, v.in);
  return t + 7.7;
} };

// Soft wings: a short flurry that slows as it passes.
VOICES.flutter = { send: 0.3, trim: 1.2, fn(v, t, o) {
  const r = o.r, p = o.pitch, dur = 0.7 + 0.5 * r(), a = v.gain(0), am = v.gain(0.5), depth = v.gain(0.5), beat = v.osc('sine', 15 * p);
  beat.frequency.setValueAtTime(15 * p, t); beat.frequency.linearRampToValueAtTime(9 * p, t + dur);
  beat.connect(depth); depth.connect(am.gain);
  swell(a.gain, t, 0.8, 0.12, dur - 0.4, 0.3);
  v.chain(v.burst('pink', t, dur + 0.9), v.filter('bandpass', 900 * p, 0.8), am, a, v.in);
  return t + dur + 0.6;
} };

// A lamp's note: a glass rim bowed with a wet finger. It swells, shimmers very slightly and takes a long time to leave. Default D4.
VOICES.lamp = { send: 0.6, trim: 0.24, fn(v, t, o) {
  const f = o.hz(62), a = v.gain(0), bow = v.gain(0);
  for (const [ratio, lvl, cents] of [[1, 0.5, -2.5], [1, 0.42, 2.5], [2, 0.1, 1], [3, 0.045, -2], [4.16, 0.02, 0]]) { if (f * ratio < 12000) v.chain(v.osc('sine', f * ratio, cents), v.gain(lvl), a); }
  swell(bow.gain, t, 0.5, 0.7, 0.3, 2.4); v.chain(v.burst('pink', t, 6.4), v.filter('bandpass', Math.min(9000, f * 2), 12), bow, a);      // the breath of the bow
  swell(a.gain, t, 0.8, 0.9, 0.5, 4.2); a.connect(v.in);
  return t + 11;
} };

// Wood on wood: a basket, a pan, a mooring post. Two hollow notes and a tap.
VOICES.knock = { send: 0.25, trim: 0.33, fn(v, t, o) {
  const r = o.r, p = o.pitch, a = v.gain(0), b = v.gain(0), k = v.gain(0);
  hit(a.gain, t, 0.5, 0.002, 0.03); v.chain(v.osc('sine', (310 + 60 * r()) * p), a, v.in);
  hit(b.gain, t, 0.3, 0.002, 0.018); v.chain(v.osc('sine', (740 + 120 * r()) * p), b, v.in);
  hit(k.gain, t, 0.4, 0.0015, 0.008); v.chain(v.burst('pink', t, 0.1), v.filter('bandpass', 1500 * p, 1.2), k, v.in);
  return t + 0.4;
} };

// Something soft and heavy landing: snow sliding off a bough. A low thud inside a puff of dull noise.
VOICES.whump = { send: 0.2, trim: 0.4, fn(v, t, o) {
  const p = o.pitch, th = v.osc('sine', 85 * p), ta = v.gain(0), na = v.gain(0), lp = v.filter('lowpass', 900 * p, 0.5);
  th.frequency.setValueAtTime(85 * p, t); th.frequency.exponentialRampToValueAtTime(42 * p, t + 0.25);
  hit(ta.gain, t, 0.6, 0.02, 0.11); v.chain(th, ta, v.in);
  lp.frequency.setValueAtTime(900 * p, t); lp.frequency.exponentialRampToValueAtTime(250 * p, t + 0.6);
  swell(na.gain, t, 0.5, 0.05, 0.05, 0.5); v.chain(v.burst('pink', t, 1.6), lp, na, v.in);
  return t + 1.5;
} };

// Cloth or leaves catching the air and letting go: a short irregular flutter of bright noise.
VOICES.rustle = { send: 0.2, trim: 4, fn(v, t, o) {
  const r = o.r, p = o.pitch, dur = 0.6 + 0.8 * r(), a = v.gain(0), am = v.gain(0), pts = new Float32Array(24);
  for (let i = 0; i < 24; i++) pts[i] = 0.15 + 0.85 * r() * r();
  am.gain.setValueCurveAtTime(pts, t, dur + 0.5);
  swell(a.gain, t, 0.7, 0.2, dur - 0.5, 0.4);
  v.chain(v.burst('white', t, dur + 0.9), v.filter('bandpass', 2600 * p, 0.6), v.filter('highpass', 700 * p, 0.5), am, a, v.in);
  return t + dur + 0.7;
} };

// A bird, far off: two to four soft falling whistles. Meant to be placed a long way away.
VOICES.bird = { send: 0.7, trim: 0.45, fn(v, t, o) {
  const r = o.r, p = o.pitch * (0.85 + 0.3 * r()), n = 2 + Math.floor(r() * 3);
  let tt = t, f = (2300 + 900 * r()) * p;
  for (let i = 0; i < n; i++) {
    const len = 0.09 + 0.16 * r(), to = f * (0.78 + 0.3 * r()), w = v.osc('sine', f, 0, tt), a = v.gain(0);
    w.frequency.setValueAtTime(f, tt); w.frequency.exponentialRampToValueAtTime(to, tt + len);
    a.gain.setValueAtTime(0, tt); a.gain.linearRampToValueAtTime(0.3, tt + len * 0.35); a.gain.linearRampToValueAtTime(0, tt + len);
    v.chain(w, a, v.in);
    tt += len + 0.05 + 0.12 * r(); f = to * (0.95 + 0.25 * r());
  }
  return tt + 0.3;
} };

// ---- the boat's own sounds (the engine plays these; realms may too)
// One paddle stroke: the blade goes in, pulls through the water, and drips as it lifts.
VOICES.paddle = { send: 0, trim: 1.15, fn(v, t, o) {
  const r = o.r, n = v.burst('pink', t, 1.5), dip = v.filter('bandpass', 600, 1.0), da = v.gain(0), pull = v.filter('bandpass', 520, 0.9), pa = v.gain(0);
  dip.frequency.setValueAtTime(600, t); dip.frequency.exponentialRampToValueAtTime(1300, t + 0.09);
  hit(da.gain, t, 0.5, 0.02, 0.05); v.chain(n, dip, da, v.in);
  pull.frequency.setValueAtTime(520, t + 0.08); pull.frequency.exponentialRampToValueAtTime(260, t + 0.75);
  swell(pa.gain, t + 0.06, 0.55, 0.22, 0.12, 0.42); v.chain(n, pull, pa, v.in);
  for (let i = 0; i < 3; i++) {
    const tt = t + 0.8 + 0.12 * i + 0.1 * r(), f = 1300 + 1500 * r(), d = v.osc('sine', f, 0, tt), a = v.gain(0);
    d.frequency.setValueAtTime(f, tt); d.frequency.exponentialRampToValueAtTime(f * 1.5, tt + 0.04);
    hit(a.gain, tt, 0.05 + 0.04 * r(), 0.003, 0.02); v.chain(d, a, v.in);
  }
  return t + 1.5;
} };

// A soft wooden bump: a low thud and the hull's own note. (It had a knock and a slap of water as well, both noise:
// taken out on 9 November with the rest of the boat's noise, see QUIET_BOAT.)
VOICES.bump = { send: 0, trim: 0.3, fn(v, t, o) {
  const th = v.osc('sine', 92), ta = v.gain(0), body = v.osc('triangle', 196), ba = v.gain(0);
  th.frequency.setValueAtTime(92, t); th.frequency.exponentialRampToValueAtTime(54, t + 0.14);
  hit(ta.gain, t, 0.7, 0.008, 0.09); v.chain(th, ta, v.in);
  hit(ba.gain, t, 0.12, 0.006, 0.05); v.chain(body, v.filter('lowpass', 600, 0.5), ba, v.in);
  return t + 0.6;
} };

// The hull creaking: stick and slip, a train of pulses whose rate wavers as the wood gives, through two wooden resonances.
VOICES.creak = { send: 0, trim: 0.8, fn(v, t, o) {
  const r = o.r, dur = 0.35 + 0.5 * r(), f = (38 + 30 * r()) * o.pitch, saw = v.osc('sawtooth', f), a = v.gain(0), pts = new Float32Array(9);
  for (let i = 0; i < 9; i++) pts[i] = f * (0.7 + 0.7 * r());
  saw.frequency.setValueCurveAtTime(pts, t, dur);
  swell(a.gain, t, 0.5, 0.08, dur - 0.25, 0.14);
  v.chain(saw, v.filter('bandpass', 480 + 300 * r(), 5), a); v.chain(saw, v.filter('bandpass', 1250 + 500 * r(), 7), v.gain(0.5), a); a.connect(v.in);
  return t + dur + 0.4;
} };

// ---- the pieces of the ice layer. 'tick' is also a small dry tick for anything light landing (lower the pitch for petals and leaves).
VOICES.tick = { send: 0.3, trim: 1, fn(v, t, o) {
  const p = o.pitch, a = v.gain(0), pa = v.gain(0);
  hit(a.gain, t, 0.4, 0.0015, 0.006); v.chain(v.burst('white', t, 0.06), v.filter('bandpass', 3800 * p, 1.5), a, v.in);
  hit(pa.gain, t, 0.12, 0.002, 0.03); v.chain(v.osc('sine', 3200 * p), pa, v.in);
  return t + 0.3;
} };
VOICES.pew = { send: 0, trim: 1, fn(v, t, o) {
  const r = o.r, f = (2400 + 1200 * r()) * o.pitch, dur = 0.3 + 0.35 * r(), ch = v.osc('sine', f), a = v.gain(0), h = v.osc('sine', f * 2), ha = v.gain(0);
  for (const [osc, k] of [[ch, 1], [h, 2]]) { osc.frequency.setValueAtTime(f * k, t); osc.frequency.exponentialRampToValueAtTime(f * k * 0.14, t + dur); }
  hit(a.gain, t, 0.4, 0.004, dur * 0.4); hit(ha.gain, t, 0.07, 0.003, dur * 0.2); v.chain(ch, a, v.in); v.chain(h, ha, v.in);
  return t + dur * 3 + 0.2;
} };
VOICES.groan = { send: 0, trim: 1, fn(v, t, o) {
  const r = o.r, p = o.pitch, dur = 0.9 + 0.9 * r(), f = 62 * p, saw = v.osc('sawtooth', f), a = v.gain(0), bp = v.filter('bandpass', 260 * p, 3.5);
  saw.frequency.setValueAtTime(f, t); saw.frequency.linearRampToValueAtTime(f * (0.75 + 0.6 * r()), t + dur);
  bp.frequency.setValueAtTime(260 * p, t); bp.frequency.linearRampToValueAtTime((180 + 260 * r()) * p, t + dur);
  swell(a.gain, t, 0.45, 0.3, dur - 0.6, 0.4); v.chain(saw, bp, a, v.in);
  return t + dur + 0.6;
} };

/** Names for the test page and the documentation. */
export const LAYER_NAMES = Object.keys(LAYERS).filter((k) => !LAYERS[k].internal);
export const ONE_SHOTS = ['drop', 'ring', 'chime', 'lamp', 'bell', 'bloom', 'sparkle', 'splash', 'breath', 'whale', 'crack', 'tick', 'knock', 'whump', 'rustle', 'flutter', 'bird', 'paddle', 'bump', 'creak'];

// ------------------------------------------------------------------------------------------------ the boat
class BoatSound {
  constructor(g) {
    this.g = g; this.wash = null; this.washOff = Infinity; this.level = -1;
    this.paddling = false; this.nextStroke = 0; this.side = 1; this.lastBump = -9; this.nextCreak = null; this.last = null;
  }
  /** Call every frame. s: { speed (m/s over the ground), throttle (-1..1), steer (-1..1), bumped (0..1, one frame) } */
  drive(s, now = this.g.now) {
    const g = this.g, r = g.rand, speed = Math.max(0, num(s.speed, 0)), dt = this.last === null ? 0 : clamp(now - this.last, 0, 0.1);
    this.last = now;
    // --- bow wash: nothing while drifting slowly, a faint rush at full paddle (QUIET_BOAT: every boat sound but the bump is turned down)
    const lv = Math.pow(smooth((speed - 0.4) / 5.2), 1.15);
    if (lv > 0.003 && QUIET_BOAT.wash > 0) { if (!this.wash) this.buildWash(now); this.washOff = Infinity; } else if (this.wash && this.washOff === Infinity) this.washOff = now + 2.5;
    if (this.wash) {
      if (Math.abs(lv - this.level) > 0.003) {
        this.level = lv;
        glide(this.wash.amp.gain, lv * VOICES.wash.trim * QUIET_BOAT.wash, now, 0.35); glide(this.wash.band.frequency, 520 + 170 * speed, now, 0.5); glide(this.wash.hiss.gain, 0.08 + 0.2 * lv, now, 0.5);
      }
      if (now > this.washOff) { this.wash.patch.stop(now); this.wash.live.disconnect(); this.wash = null; this.level = -1; this.washOff = Infinity; }
    }
    // --- paddle strokes, alternating sides, while the rider is paddling. With the rower aboard the stroke is hers: one for
    // every sweep of her oar, from astern (a little to either side), as loud as she is working
    if (typeof s.sweeps === 'number') {
      if (QUIET_BOAT.paddle > 0 && this.sweeps !== undefined && s.sweeps !== this.sweeps && now - (this.lastSweep || -9) > 0.5) {
        this.lastSweep = now;
        g.fire('paddle', {}, now + SOON, g.boatBus, null, { pan: this.side * 0.3, gain: (0.45 + 0.2 * r()) * clamp01(num(s.effort, 0) * 1.4) * QUIET_BOAT.paddle });
        this.side = -this.side;
      }
      this.sweeps = s.sweeps;
      s = { ...s, throttle: 0 };                                       // (and no strokes on the clock)
    }
    const paddling = Math.abs(num(s.throttle, 0)) > 0.05;
    if (paddling && !this.paddling) this.nextStroke = Math.max(this.nextStroke, now + 0.1);
    this.paddling = paddling;
    if (paddling && QUIET_BOAT.paddle > 0) {
      while (this.nextStroke < now + 0.12) {
        const t = Math.max(this.nextStroke, now + SOON);
        g.fire('paddle', {}, t, g.boatBus, null, { pan: this.side * 0.5, gain: (0.7 + 0.3 * r()) * QUIET_BOAT.paddle });
        this.side = -this.side;
        this.nextStroke = t + (speed > 4.2 ? 1.15 : 1.5) * (0.94 + 0.12 * r());
      }
    }
    // --- a bump against a bank or a rock
    // (one for one meeting: a boat that slides along what it met is still touching it, and says nothing more until it
    // has been clear of everything for a second; and never two within three seconds)
    const hitStrength = clamp01(num(s.bumped, 0));
    if (hitStrength > 0) {
      if (QUIET_BOAT.bump > 0 && hitStrength > 0.2 && now - (this.lastTouch ?? -9) > 1.0 && now - this.lastBump > 3.0) {
        this.lastBump = now;
        g.fire('bump', { strength: hitStrength }, now + SOON, g.boatBus, null, { pan: (r() - 0.5) * 0.5, gain: (0.45 + 0.55 * hitStrength) * QUIET_BOAT.bump });
      }
      this.lastTouch = now;
    }
    // --- the hull creaks now and then, sooner when it is being turned hard
    if (this.nextCreak === null) this.nextCreak = now + 12 + 30 * r();
    this.nextCreak -= Math.abs(num(s.steer, 0)) * dt * 2;
    if (now > this.nextCreak && QUIET_BOAT.creak > 0) {
      g.fire('creak', { pitch: 0.8 + 0.5 * r() }, now + SOON, g.boatBus, null, { pan: (r() - 0.5) * 0.8, gain: (0.5 + 0.5 * r()) * QUIET_BOAT.creak });
      this.nextCreak = now + 22 + 45 * r();
    }
  }
  buildWash(now) {
    const P = new Patch(this.g, now), amp = P.gain(0), live = P.gain(0), band = P.filter('bandpass', 700, 0.7), hiss = P.gain(0.1);
    P.wander(17, 1.6, 0.72, 1.08).connect(live.gain);
    P.chain(P.noise('pink'), band, amp); P.chain(P.noise('white'), P.filter('bandpass', 2600, 0.8), hiss, amp);
    P.chain(amp, live, this.g.boatBus);
    this.wash = { patch: P, amp, live, band, hiss };
  }
}
VOICES.wash = { trim: 0.65 };          // not a one-shot: only the calibration of the bow wash lives here

// ------------------------------------------------------------------------------------------------ the music
const yieldFrame = () => new Promise((r) => setTimeout(r, 0));
// Where a track is set (dBFS RMS) at music gain 1 and the reference volume: its average, and its loudest three seconds.
// With the rider's volume at its maximum (3 dB up) the average is still under -14 dBFS.
export const MUSIC_LEVEL = { average: -18.5, loudest: -15 };

/**
 * Get a decoded track ready to loop for ever: find where the sound really starts and ends, melt its last seconds
 * into its first with an equal-power crossfade baked into the buffer (so the loop point itself is sample-continuous),
 * and measure how loud it is. Works in slices so a long track does not stall a frame.
 * Returns { start, loopStart, loopEnd, crossfade (all seconds), rmsDb, loudestDb, peakDb, norm (gain to apply) }.
 */
export async function prepareLoop(buffer, { crossfade = 3, target = MUSIC_LEVEL.average, ceiling = MUSIC_LEVEL.loudest, slice = 1500000 } = {}) {
  const sr = buffer.sampleRate, n = buffer.length, chans = [];
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) chans.push(buffer.getChannelData(ch));
  // one pass: the peak, and the energy of every 0.4 s block
  const block = Math.max(1, Math.floor(0.4 * sr)), blocks = new Float64Array(Math.ceil(n / block));
  let peak = 0;
  for (const d of chans) {
    for (let i0 = 0; i0 < n; i0 += slice) {
      const i1 = Math.min(n, i0 + slice);
      for (let i = i0; i < i1; i++) { const x = d[i], a = x < 0 ? -x : x; if (a > peak) peak = a; blocks[(i / block) | 0] += x * x; }
      if (i1 < n) await yieldFrame();
    }
  }
  if (!(peak > 1e-4)) return { silent: true, start: 0, loopStart: 0, loopEnd: n / sr, crossfade: 0, rmsDb: -Infinity, loudestDb: -Infinity, peakDb: -Infinity, norm: 0 };
  // where the sound starts and ends: the first and last stretch of 60 ms (three 20 ms windows in a row) within 45 dB of
  // the track's average level. Three in a row, so that a stray click (decoders often leave one at the very end) does not count.
  let all = 0; for (let b = 0; b < blocks.length; b++) all += blocks[b];
  const avg = all / (n * chans.length), w = Math.max(1, Math.floor(0.02 * sr)), floor = Math.max(avg * 3.2e-5, 1e-7);
  const power = (i0, len) => { let sum = 0; const i1 = Math.min(n, i0 + len); for (const d of chans) for (let i = Math.max(0, i0); i < i1; i++) sum += d[i] * d[i]; return sum / (Math.max(1, i1 - Math.max(0, i0)) * chans.length); };
  let first = 0, last = n, streak = 0;
  for (let i = 0; i + w <= n; i += w) { if (power(i, w) > floor) { if (++streak >= 3) { first = i - 2 * w; break; } } else streak = 0; }
  streak = 0;
  for (let i = n - w; i >= first; i -= w) { if (power(i, w) > floor) { if (++streak >= 3) { last = i + 3 * w; break; } } else streak = 0; }
  const start = Math.max(0, first - Math.floor(0.02 * sr)), end = Math.min(n, last + Math.floor(0.25 * sr));
  // the crossfade covers the track's own dying away: from where its ending last stood within 8 dB of the average, 3 to 8 seconds
  const q = Math.floor(0.25 * sr); let fall = end;
  while (fall - q > start && end - fall < 8 * sr && power(fall - q, q) < avg * 0.16) fall -= q;
  const X = Math.max(0, Math.floor(Math.min(Math.max(crossfade * sr, end - fall), 8 * sr, (end - start) * 0.2)));
  for (const d of chans) for (let i = 0; i < X; i++) { const a = ((i + 0.5) / X) * Math.PI * 0.5, k = end - X + i; d[k] = d[k] * Math.cos(a) + d[start + i] * Math.sin(a); }
  // loudness over the part that plays: the average, and the loudest three seconds
  const b0 = Math.floor(start / block), b1 = Math.max(b0 + 1, Math.floor(end / block)), per = block * chans.length, win = 8;
  let total = 0, loudest = 0, run = 0;
  for (let b = b0; b < b1; b++) { total += blocks[b]; run += blocks[b]; if (b - b0 >= win) run -= blocks[b - win]; if (b - b0 >= win - 1) loudest = Math.max(loudest, run / (win * per)); }
  if (loudest === 0) loudest = total / ((b1 - b0) * per);
  const rmsDb = 10 * Math.log10(total / ((b1 - b0) * per) + 1e-12), loudestDb = 10 * Math.log10(loudest + 1e-12);
  const norm = clamp(dB(Math.min(target - rmsDb, ceiling - loudestDb)), 0.05, 6);
  return { start: start / sr, loopStart: (start + X) / sr, loopEnd: end / sr, crossfade: X / sr, rmsDb, loudestDb, peakDb: 20 * Math.log10(peak), norm };
}

/** A realm's music treatment, with what is left out filled in. */
const MUSIC_DEFAULTS = { track: null, gain: 0.8, half: 0, lowpass: 20000, highpass: 20, reverb: 0.15, rate: 1, waver: 0, width: 1 };

class MusicPlayer {
  constructor(g) {
    this.g = g; const c = g.ctx;
    this.tracks = {}; this.order = []; this.playing = false; this.current = null; this.lfo = null;
    this.treat = { ...MUSIC_DEFAULTS };
    const F = (type, f, q) => { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
    const G = (v) => { const n = c.createGain(); n.gain.value = v; return n; };
    // in -> width (a mid/side matrix) -> high-pass -> low-pass -> door (the veil's curtain) -> level -> duck (the veil) -> music bus
    this.in = G(1); this.in.channelCount = 2; this.in.channelCountMode = 'explicit';
    const split = c.createChannelSplitter(2), merge = c.createChannelMerger(2);
    this.same = [G(1), G(1)]; this.cross = [G(0), G(0)];
    this.in.connect(split);
    split.connect(this.same[0], 0); this.same[0].connect(merge, 0, 0); split.connect(this.same[1], 1); this.same[1].connect(merge, 0, 1);
    split.connect(this.cross[0], 0); this.cross[0].connect(merge, 0, 1); split.connect(this.cross[1], 1); this.cross[1].connect(merge, 0, 0);
    this.hp = F('highpass', 20, 0.7); this.lp = F('lowpass', 20000, 0.7); this.door = F('lowpass', 20000, 0.5);
    this.level = G(1); this.duck = G(1);
    let node = merge; for (const n of [this.hp, this.lp, this.door, this.level, this.duck, g.musicBus]) { node.connect(n); node = n; }
  }
  /** Add a decoded track that prepareLoop() has already measured. info: an entry of tracks.json ({ id, transpose }). */
  add(id, buffer, loop, info = {}) {
    if (loop.silent) return;
    this.tracks[id] = { id, buffer, loop, transpose: num(info.transpose, 0), voice: null, half: null, pos: loop.start, lastT: 0 };
    this.order.push(id);
    this.refresh();
  }
  /**
   * m: { track, gain 0..1, half 0..1 (a half-speed copy an octave down), lowpass Hz, highpass Hz, reverb 0..1,
   *      rate 0.9..1.1, waver 0..1 (the low-pass sways slowly, as if under water), width 0..1.5 (0 mono, 1 as recorded) }
   */
  setTreatment(m = {}, { immediate = false, tc = GLIDE } = {}) {
    const g = this.g, T = this.treat, t = g.now;
    if (immediate) tc = 0.03;
    T.track = typeof m.track === 'string' ? m.track : null;
    T.gain = clamp01(num(m.gain, MUSIC_DEFAULTS.gain)); T.half = clamp01(num(m.half, 0));
    T.lowpass = clamp(num(m.lowpass, 20000), 80, 20000); T.highpass = clamp(num(m.highpass, 20), 10, 6000);
    // the quiet mix: the music carries the ride, so an area cannot bury it. Its gain is at least 0.45 (a gain of 0, asked
    // for on purpose, stays 0) and its low-pass never closes below 800 Hz. T is what plays; what was asked stays with the area.
    if (T.gain > 0) T.gain = Math.max(QUIET_MUSIC.gain, T.gain);
    T.lowpass = Math.max(QUIET_MUSIC.lowpass, T.lowpass);
    T.reverb = clamp01(num(m.reverb, MUSIC_DEFAULTS.reverb)); T.rate = clamp(num(m.rate, 1), 0.85, 1.15);
    T.waver = clamp01(num(m.waver, 0)); T.width = clamp(num(m.width, 1), 0, 1.5);
    glide(this.hp.frequency, T.highpass, t, tc); glide(this.lp.frequency, T.lowpass, t, tc); glide(g.musicSend.gain, T.reverb, t, tc);
    const a = (1 + T.width) / 2, b = (1 - T.width) / 2;
    for (const n of this.same) glide(n.gain, a, t, tc); for (const n of this.cross) glide(n.gain, b, t, tc);
    if (T.waver > 0 && !this.lfo) {                    // two slow sines that never quite line up, leaning on the low-pass
      const c = g.ctx, depth = c.createGain(); depth.gain.value = 0; depth.connect(this.lp.detune);
      for (const [f, k] of [[0.2, 1], [0.127, 0.6]]) { const o = c.createOscillator(), a2 = c.createGain(); o.frequency.value = f; a2.gain.value = k; o.connect(a2); a2.connect(depth); o.start(t); }
      this.lfo = depth;
    }
    if (this.lfo) glide(this.lfo.gain, T.waver * 350, t, tc);                 // cents: at 1 the cut-off sways by about a third either way
    this.balance(tc); this.refresh(immediate, tc);
  }
  /** The music's own level. The more of it the space returns, and the wider it is spread, the more the dry sound gives way, so its loudness stays put. */
  balance(tc = GLIDE) {
    const g = this.g, T = this.treat, wet = T.reverb * g.space.mix * (SPACES[g.space.size] ? SPACES[g.space.size].wet : 0);
    const spread = T.width > 1 ? 1 + 0.5 * ((1 + T.width * T.width) / 2 - 1) : 1;
    glide(this.level.gain, 1 / Math.sqrt((1 + 1.5 * wet * wet) * spread), g.now, tc);      // 1.5: spaces return lows a little louder than mids
  }
  voiceFor(tr, rate, t) {
    const c = this.g.ctx, src = c.createBufferSource(), gain = c.createGain();
    src.buffer = tr.buffer; src.loop = true; src.loopStart = tr.loop.loopStart; src.loopEnd = tr.loop.loopEnd; src.playbackRate.value = rate;
    gain.gain.value = 0; src.connect(gain); gain.connect(this.in);
    src.start(t, tr.pos);
    return { src, gain, offAt: Infinity };
  }
  /** Make the right track sound (or none), and move the tonal layers into its key. */
  refresh(immediate = false, tc = GLIDE) {
    const g = this.g, T = this.treat, t = g.now, target = this.tracks[T.track] || this.tracks[this.order[0]] || null;
    const want = g.musicOn ? target : null, up = immediate ? 0.05 : Math.min(tc, 0.9);
    // gain and half share the track's level: together they never exceed it
    const tg = taper(T.gain), th = taper(T.half), k = 1 / Math.max(1, Math.hypot(tg, th));
    for (const id of this.order) {
      const tr = this.tracks[id], on = tr === want;
      if (on && !tr.voice) { tr.voice = this.voiceFor(tr, T.rate, t); tr.lastT = t; }
      if (on && th > 0 && !tr.half) tr.half = this.voiceFor(tr, T.rate * 0.5, t);
      for (const [v, level, rate] of [[tr.voice, tg, T.rate], [tr.half, th, T.rate * 0.5]]) {
        if (!v) continue;
        if (on && (level > 0 || v === tr.voice)) { v.offAt = Infinity; glide(v.gain.gain, tr.loop.norm * level * k, t, up); glide(v.src.playbackRate, rate, t, immediate ? 0.05 : 2); }
        else if (v.offAt === Infinity) { glide(v.gain.gain, 0, t, 0.7); v.offAt = t + 4.5; }
      }
    }
    this.current = target; const was = this.playing; this.playing = !!want;
    g.setTune(target ? target.transpose : 0, target ? 1200 * Math.log2(T.rate) : 0);
    if (was !== this.playing) g.applyVolumes();
  }
  /** v 0..1: how far into the veil. A curtain, not a door: the music dips about 4 dB and loses only its top (a low-pass down to 1200 Hz); both come back on the far side. (Until the quiet mix: 10 dB and 320 Hz.) */
  setVeil(v) {
    const s = smooth(v), t = this.g.now;
    glide(this.duck.gain, 1 - (1 - dB(QUIET_MUSIC.veilDb)) * s, t, 0.15);
    glide(this.door.frequency, 20000 * Math.pow(QUIET_MUSIC.veilLowpass / 20000, Math.pow(s, 0.8)), t, 0.15);
  }
  tick(now) {
    for (const id of this.order) {
      const tr = this.tracks[id];
      if (tr.voice) {                                                          // where the playhead is, to pick up from later
        tr.pos += (now - tr.lastT) * this.treat.rate; tr.lastT = now;
        const L = tr.loop; if (tr.pos >= L.loopEnd) tr.pos = L.loopStart + ((tr.pos - L.loopEnd) % (L.loopEnd - L.loopStart));
      }
      for (const key of ['voice', 'half']) {
        const v = tr[key];
        if (v && now > v.offAt) { try { v.src.stop(now); } catch { /* never started */ } v.gain.disconnect(); tr[key] = null; }
      }
    }
  }
}

// ------------------------------------------------------------------------------------------------ the ride's sound
const AUDIO_DIR = new URL('../../assets/audio/', import.meta.url);

/** True when `part` would change `now`: numbers by more than a hair, anything else at all (a realm may call every frame). */
function changed(now, part) {
  for (const k in part) {
    const a = now[k], b = part[k];
    if (typeof a === 'number' && typeof b === 'number') { if (Math.abs(a - b) > 1e-3 * Math.max(1, Math.abs(a))) return true; }
    else if (Array.isArray(a) && Array.isArray(b)) { if (a.length !== b.length || a.some((x, i) => x !== b[i])) return true; }
    else if (a !== b) return true;
  }
  return false;
}

/** What a realm gets when it leaves a part of its `audio` out. */
export const AUDIO_DEFAULTS = {
  music: { ...MUSIC_DEFAULTS },
  space: { size: 'open', mix: 0.3, lowpass: 20000 },
  ambience: { water: 0.35 },
};

export class RideAudio {
  constructor(engine) {
    this.engine = engine;
    this.ctx = null; this.graph = null; this.ready = false;      // made in unlock(), and nowhere else
    this.musicOn = true; this.musicVolume = VOLUME_REFERENCE; this.sfxVolume = VOLUME_REFERENCE; this.paused = false;
    this.realm = { def: {}, id: null };
    this.live = { music: { ...AUDIO_DEFAULTS.music }, space: { ...AUDIO_DEFAULTS.space }, ambience: { ...AUDIO_DEFAULTS.ambience } };
    this.trackList = []; this.hasMusic = false;
    this.loading = this.fetchTracks();                  // network only: no sound is made or prepared before unlock()
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => this.onVisibility());
  }

  get unlocked() { return !!this.graph; }                  // unlock() has been called; `ready` follows a moment later
  get running() { return !!this.ctx && this.ctx.state === 'running'; }

  /** Fetch assets/audio/tracks.json and the files it lists. Missing files are not an error: the ride is simply without music. */
  async fetchTracks() {
    try {
      const res = await fetch(new URL('tracks.json', AUDIO_DIR), { cache: 'no-cache' });
      if (!res.ok) return [];
      const list = ((await res.json()) || {}).tracks;
      if (!Array.isArray(list)) return [];
      const out = await Promise.all(list.map(async (tr) => {
        try {
          if (!tr || typeof tr.id !== 'string' || typeof tr.file !== 'string') return null;
          const r = await fetch(new URL(tr.file, AUDIO_DIR));
          return r.ok ? { ...tr, bytes: await r.arrayBuffer() } : null;
        } catch { return null; }
      }));
      this.trackList = out.filter(Boolean);
    } catch { this.trackList = []; }
    return this.trackList;
  }

  /**
   * Start the sound. Call it directly from the "begin" click or key handler (browsers only let sound start from a
   * gesture). Safe to call again. Resolves to true when sound is running. Only the context and the master chain are
   * made inside the gesture; the heavier preparation follows in small pieces so the click does not stall the picture.
   */
  async unlock() {
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return false;
    try {
      if (!this.ctx) {
        let ctx; try { ctx = new AC({ latencyHint: 'balanced' }); } catch { ctx = new AC(); }
        this.ctx = ctx;
        const g = this.graph = new SoundGraph(ctx, {});
        g.musicVolume = this.musicVolume; g.sfxVolume = this.sfxVolume; g.musicOn = this.musicOn; g.applyVolumes(true);
        if (this.paused) g.setPaused(true);
        this.preparing = this.prepare();
      }
      if (this.ctx.state !== 'running') await this.ctx.resume();
      return this.ctx.state === 'running';
    } catch (err) { console.warn('Sound could not start:', err && err.message); return false; }
  }

  /** After unlock(): build the raw material piece by piece, bring the realm in under a slow fade, then decode the music. */
  async prepare() {
    const ctx = this.ctx, g = this.graph, rest = (ms = 0) => new Promise((r) => setTimeout(r, ms));
    try {
      for (const kind of ['pink', 'white', 'brown']) { await rest(); g.noise(kind); }
      await rest();
      this.ready = true;
      this.applyRealm(true); g.fadeIn(4.5);
      const list = [...(await this.loading)], wanted = (this.realm.def.music || {}).track;
      list.sort((a, b) => (b.id === wanted) - (a.id === wanted));            // the track this realm wants first
      for (const tr of list) {
        try {
          const buffer = await new Promise((res, rej) => { const p = ctx.decodeAudioData(tr.bytes, res, rej); if (p && p.catch) p.catch(rej); });
          tr.bytes = null;
          const loop = await prepareLoop(buffer);
          g.music.add(tr.id, buffer, loop, tr);
          this.hasMusic = this.hasMusic || !loop.silent;
        } catch (err) { console.warn(`Music track "${tr.id}" could not be decoded:`, err && err.message); }
      }
      // the rest, while nothing needs it yet: the other spaces and the baked textures
      for (const size of Object.keys(SPACES)) { await rest(80); g.impulse(size); }
      for (const name of ['drops', 'shimmer', 'shimmer2']) { await rest(80); g.texture(name); }
    } catch (err) { console.warn('Sound preparation failed:', err && err.message); }
  }

  /** A realm became the current one. def is the realm's `audio` field (see docs/audio.md). */
  setRealm(def, { id = null, immediate = false } = {}) {
    def = def || {};
    this.realm = { def, id };
    // the working copy: what the realm declared, which its update() may then move (music(), layer(), space())
    this.live = { music: { ...(def.music || AUDIO_DEFAULTS.music) }, space: { ...(def.space || AUDIO_DEFAULTS.space) }, ambience: { ...(def.ambience || AUDIO_DEFAULTS.ambience) } };
    if (this.ready) this.applyRealm(immediate);
  }
  applyRealm(immediate) {
    const a = this.live, g = this.graph;
    g.setAmbience(a.ambience, { immediate }); g.setSpace(a.space, { immediate }); g.music.setTreatment(a.music, { immediate });
  }

  // ---- for a realm's update(): move the sound while the boat is in the realm. Everything set here lasts until the next realm.
  /** Change part of the music treatment over `seconds`: audio.music({ lowpass: 3000 }, 4). */
  music(part, seconds = 2) {
    if (!part || !changed(this.live.music, part)) return;
    Object.assign(this.live.music, part);
    if (this.ready) this.graph.music.setTreatment(this.live.music, { tc: Math.max(0.03, seconds / 3) });
  }
  /** Change one ambience layer over `seconds`: audio.layer('rain', 0.6, 5) or audio.layer('wind', { level: 0.5, tone: 0.8 }). */
  layer(name, spec, seconds = 2) {
    const next = typeof spec === 'number' ? { level: spec } : { ...(spec || {}) }, was = this.live.ambience[name], prev = typeof was === 'number' ? { level: was } : (was || {});
    if (!changed(prev, next) && Object.keys(prev).length === Object.keys(next).length) return;
    this.live.ambience[name] = next;
    if (this.ready) this.graph.setLayer(name, next, { tc: Math.max(0.03, seconds / 3) });
  }
  /** Change the space over `seconds`: audio.space({ mix: 0.8 }, 6) or audio.space({ lowpass: 900 }). */
  space(part, seconds = 2) {
    if (!part || !changed(this.live.space, part)) return;
    Object.assign(this.live.space, part);
    if (this.ready) this.graph.setSpace(this.live.space, { tc: Math.max(0.03, seconds / 3) });
  }

  /** Every frame while the ride runs. */
  update(dt, engine = this.engine) {
    const g = this.graph;
    if (!this.ready || this.ctx.state !== 'running') return;
    const boat = engine.boat, input = engine.input, now = this.ctx.currentTime;
    if (boat) {
      // the rider's ears: where the boat is, facing where the rider is looking
      g.listener.x = boat.x; g.listener.z = boat.z; g.listener.heading = boat.heading + (engine.camera ? engine.camera.rotation.y : 0);
      // (with the rower aboard, the oar is heard when her blade works: `sweeps` counts her sweeps, src/engine/rower.js)
      const rower = boat.model && boat.model.rower;
      g.boat.drive({ speed: boat.speed, throttle: input ? input.throttle : 0, steer: input ? input.steer : 0, bumped: boat.bumped, sweeps: rower ? rower.sweeps : undefined, effort: rower ? rower.effort : 0 }, now);
    }
    g.setVeil(engine.realms ? engine.realms.veil : 0);
    g.tick(now);
  }

  /**
   * Play a one-shot from a realm's update(): audio.play('drop', { x, z, gain, pitch }).
   * x, z are realm-local metres; leave them out for a sound that is simply "here". Does nothing before unlock().
   */
  play(name, opts) { return this.ready && this.ctx.state === 'running' ? this.graph.play(name, opts) : false; }

  setMusicOn(on) { this.musicOn = !!on; if (this.graph) this.graph.setMusicOn(this.musicOn); }
  setMusicVolume(v) { this.musicVolume = clamp01(num(v, this.musicVolume)); if (this.graph) this.graph.setMusicVolume(this.musicVolume); }
  setSfxVolume(v) { this.sfxVolume = clamp01(num(v, this.sfxVolume)); if (this.graph) this.graph.setSfxVolume(this.sfxVolume); }
  /** true: everything glides down to a murmur. false: it comes back. Nothing is suspended. */
  setPaused(p) { this.paused = !!p; if (this.graph) this.graph.setPaused(this.paused); }

  /** A hidden tab falls silent and, a moment later, stops working; it wakes when the tab is shown again. */
  onVisibility() {
    if (!this.graph) return;
    const hidden = document.hidden, ctx = this.ctx;
    this.graph.setHidden(hidden);
    clearTimeout(this.sleepTimer);
    if (hidden) this.sleepTimer = setTimeout(() => { if (document.hidden && ctx.state === 'running') ctx.suspend().catch(() => {}); }, 1200);
    else if (ctx.state !== 'running') ctx.resume().catch(() => {});
  }

  /** For the lab page and the console: what is sounding right now. */
  debug() {
    const g = this.graph;
    if (!g) return { unlocked: false };
    const layers = {}, asked = {}; for (const k in g.layers) { if (g.layers[k].inst) layers[k] = g.layers[k].level; if (g.layers[k].asked > 0) asked[k] = g.layers[k].asked; }
    // layers: what is sounding, at the level heard; asked: what the area asked for (the quiet mix stands between the two)
    return { unlocked: true, ready: this.ready, state: this.ctx.state, time: this.ctx.currentTime, sampleRate: this.ctx.sampleRate, layers, asked, voices: g.voices,
      space: g.space, music: { tracks: g.music.order, playing: g.music.playing, current: g.music.current && g.music.current.id, treatment: g.music.treat }, tune: g.cents };
  }
}
