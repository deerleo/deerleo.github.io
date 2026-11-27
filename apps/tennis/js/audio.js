// The sound. The plain game beeps: square waves, as the first machines did. Everything after is recordings made
// with bin/sfx, an announcer made with bin/speech and four tunes made with bin/music (all in source/).

const rand = (a, b) => a + Math.random() * (b - a);
const pick = list => list[(Math.random() * list.length) | 0];

// What the break needs, then everything else.
const FIRST = ['say-punch', 'shing', 'boom', 'smash', 'whoosh', 'hits', 'music-main'];
const REST = ['say-hyper', 'say-far', 'music-trip', 'say-surf', 'say-start', 'startup', 'error', 'music-midi', 'say-multiball', 'say-ultra', 'say-monster', 'say-finish', 'static', 'explosion', 'riser', 'music-melt'];
const MUSIC = 0.5;        // how loud the tunes are, against the sounds at 1

// Every separate sound in a recording of several: where each starts and how long it runs. One starts where the
// loudness jumps to `rise` times what it's been lately. (From Spider.)
function cuts(buffer, { floor = 0.08, rise = 3, gap = 0.12, most = 0.3 } = {}) {
    const data = buffer.getChannelData(0), rate = buffer.sampleRate, hop = Math.round(rate * 0.004);
    const level = [];
    let top = 0;
    for (let i = 0; i < data.length; i += hop) {
        let sum = 0;
        for (let j = i; j < Math.min(i + hop, data.length); j++) sum += data[j] * data[j];
        level.push(Math.sqrt(sum / hop));
        top = Math.max(top, level.at(-1));
    }
    const found = [];
    let last = -Infinity, lately = 0;
    level.forEach((l, i) => {
        const t = (i * hop) / rate;
        if (l > top * floor && l > lately * rise && t - last > gap) {
            found.push(Math.max(0, t - 0.008));
            last = t;
        }
        lately += (l - lately) * 0.08;
    });
    return found.map((t, i) => [t, Math.min(most, (found[i + 1] ?? buffer.duration) - t)]);
}

export class Sound {
    constructor({ muted = false } = {}) {
        // An iPhone's silent switch mutes web audio unless it's playback, as video is.
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
        const AC = window.AudioContext || window.webkitAudioContext;
        const c = (this.ctx = new AC());
        this.master = c.createGain();
        // A safety limiter only: set lower, a compressor adds loudness of its own.
        const limit = c.createDynamicsCompressor();
        limit.threshold.value = -2;
        limit.knee.value = 2;
        limit.ratio.value = 12;
        limit.attack.value = 0.002;
        limit.release.value = 0.2;
        this.master.connect(limit).connect(c.destination);
        this.out = limit;       // the last before the speakers, for recording
        // The tunes go through their own gain, and an analyser so the picture can move with them.
        this.tunes = c.createGain();
        this.tunes.gain.value = MUSIC;
        this.ear = c.createAnalyser();
        this.ear.fftSize = 256;
        this.ear.smoothingTimeConstant = 0.5;
        this.tunes.connect(this.ear);
        this.tunes.connect(this.master);
        this.bins = new Uint8Array(this.ear.frequencyBinCount);

        this.buffers = {};
        this.slices = {};
        this._volume = 0.5;     // it starts quiet
        this._muted = muted;
        this.last = {};
        this.ducked = 1;
        this.level();
    }

    get now() { return this.ctx.currentTime; }
    get running() { return this.ctx.state === 'running'; }
    get volume() { return this._volume; }
    set volume(v) { this._volume = v; this.level(); }
    get muted() { return this._muted; }
    set muted(m) { this._muted = m; this.level(); }

    level() {
        // The slider is squared: ears hear loudness in ratios, and the bottom half of a straight one did nothing.
        this.master.gain.setTargetAtTime(this._muted ? 0 : this._volume * this._volume * 1.6, this.now, 0.05);
    }

    async get(name) {
        try {
            const res = await fetch(`media/audio/${name}.mp3`);
            if (!res.ok) throw new Error(`${name}: ${res.status}`);
            this.buffers[name] = await this.ctx.decodeAudioData(await res.arrayBuffer());
        } catch (err) { console.error(err); }
    }

    // `first` resolves when there's enough for the break, `all` when the lot is in.
    load() {
        this.first ??= Promise.all(FIRST.map(n => this.get(n))).then(() => {
            if (this.buffers.hits) this.slices.hits = cuts(this.buffers.hits, { floor: 0.2, gap: 0.3, most: 0.5 });
            // Where each word of "Six! Finger! PUNCH!" starts: the last is when the fist lands.
            if (this.buffers['say-punch']) this.words = cuts(this.buffers['say-punch'], { floor: 0.25, rise: 2.5, gap: 0.25, most: 1 }).map(c => c[0]);
        });
        this.all ??= this.first.then(() => Promise.all(REST.map(n => this.get(n)))).then(() => {
            if (this.buffers.static) this.slices.static = cuts(this.buffers.static, { floor: 0.2, gap: 0.4, most: 0.45 });
            if (this.buffers['say-finish']) this.lastWords = cuts(this.buffers['say-finish'], { floor: 0.25, rise: 2.5, gap: 0.25, most: 1 }).map(c => c[0]);
        });
        return this.first;
    }

    has(name) { return !!this.buffers[name]; }

    // Called inside every click, tap or key until it's playing: browsers only let sound start there, and an iPhone
    // only at the end of a touch or the click after. Never waited on.
    unlock() {
        if (this.ctx.state === 'running') return;
        this.ctx.resume().catch(() => {});
        const src = this.ctx.createBufferSource();
        src.buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
        src.connect(this.ctx.destination);
        src.start();
    }

    play(name, { gain = 1, pan = 0, rate = 1, offset = 0, length, delay = 0, loop = false, to = this.master } = {}) {
        const buf = typeof name === 'string' ? this.buffers[name] : name;
        if (!buf || this.ctx.state !== 'running') return null;
        const c = this.ctx, src = c.createBufferSource(), g = c.createGain(), p = c.createStereoPanner();
        src.buffer = buf;
        src.loop = loop;
        src.playbackRate.value = rate;
        g.gain.value = gain;
        p.pan.value = Math.max(-1, Math.min(1, pan));
        src.connect(g).connect(p).connect(to);
        const when = this.now + delay;
        if (length) {
            // A slice: faded out at its end, so it never clicks.
            const end = when + length / rate;
            g.gain.setValueAtTime(gain, Math.max(when, end - 0.03));
            g.gain.linearRampToValueAtTime(0, end);
            src.start(when, offset, length + 0.01);
        } else src.start(when, offset % buf.duration);
        return { src, gain: g.gain };
    }

    slice(name, opts) {
        const s = this.slices[name];
        if (!s?.length) return this.play(name, opts);
        const [offset, length] = pick(s);
        return this.play(name, { ...opts, offset, length });
    }

    // Not the same sound twice within a moment: a hundred balls landing at once is just noise.
    spaced(key, gap) {
        if (this.now - (this.last[key] ?? -9) < gap) return false;
        this.last[key] = this.now;
        return true;
    }

    stop(voice, over = 0.05) {
        if (!voice) return;
        voice.gain.cancelScheduledValues(this.now);
        voice.gain.setTargetAtTime(0, this.now, over);
        try { voice.src.stop(this.now + over * 6); } catch {}
    }

    // ------------------------------------------------------------ the plain game

    // A square-wave blip.
    beep(freq, length = 0.05, gain = 0.2) {
        if (this.ctx.state !== 'running') return;
        const c = this.ctx, osc = c.createOscillator(), g = c.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(gain, this.now);
        g.gain.setValueAtTime(gain, this.now + length);
        g.gain.linearRampToValueAtTime(0, this.now + length + 0.005);
        osc.connect(g).connect(this.master);
        osc.start();
        osc.stop(this.now + length + 0.02);
    }

    // ------------------------------------------------------------ everything after. pan: -1 left to 1 right

    thwack(pan = 0, hard = 1) {
        if (this.spaced('thwack', 0.03)) this.slice('hits', { gain: 0.55 * hard, rate: rand(0.9, 1.15), pan });
    }

    wall(pan = 0) {
        if (this.spaced('wall', 0.05)) this.slice('hits', { gain: 0.22, rate: rand(1.5, 1.9), pan });
    }

    // A burst of television snow: a quarter of a second from somewhere in the recording.
    snow() {
        const b = this.buffers.static;
        if (b && this.spaced('snow', 0.08)) this.play('static', { gain: 0.6, offset: rand(0, Math.max(0, b.duration - 0.4)), length: 0.24, rate: rand(0.9, 1.1) });
    }

    // The desktop's ding: higher for you, lower for them, lower still when it's gone wrong.
    ding(rate = 1, gain = 0.4) {
        if (this.spaced('ding', 0.05)) this.play('error', { gain, rate, length: 0.9 });
    }

    // A sound card that's stuck: the same sliver of the ding over and over.
    stuck(times = 16) {
        for (let i = 0; i < times; i++) this.play('error', { gain: 0.4, offset: 0.02, length: 0.055, delay: i * 0.055 });
    }

    // The announcer. One line at a time: a new one cuts the last off.
    // The lines came out quiet, so they're turned up, and the tune steps back while he speaks.
    say(line, delay = 0, gain = 1) {
        const b = this.buffers[`say-${line}`];
        if (!b) return;
        this.stop(this.saying, 0.03);
        this.saying = this.play(b, { gain: gain * 2.2, delay });
        const g = this.tunes.gain, t = this.now + delay;
        g.setTargetAtTime(MUSIC * this.ducked * 0.5, t, 0.04);
        g.setTargetAtTime(MUSIC * this.ducked, t + b.duration * 0.8, 0.25);
    }

    // ------------------------------------------------------------ the tunes

    // `on` picks a tune up where it would have got to if it had never stopped.
    music(name, { delay = 0, gain = 1, on = false } = {}) {
        this.stop(this.tune, 0.02);
        const b = name && this.buffers[`music-${name}`];
        this.began ??= {};
        const offset = b && on && name in this.began ? (this.now - this.began[name]) % b.duration : 0;
        if (b) this.began[name] = this.now + delay - offset;
        this.tune = b ? this.play(b, { loop: true, delay, gain, offset, to: this.tunes }) : null;
        this.playing = this.tune ? name : null;
        this.duck(1, 0.01);
    }

    // The tune's loudness, as a part of its usual.
    duck(k, over = 0.3) {
        this.ducked = k;
        this.tunes.gain.cancelScheduledValues(this.now);
        this.tunes.gain.setTargetAtTime(MUSIC * k, this.now, over);
    }

    // How hard the bottom end of the tune is hitting right now, 0 to 1.
    bass() {
        if (!this.tune || this.ctx.state !== 'running') return 0;
        this.ear.getByteFrequencyData(this.bins);
        return Math.min(1, ((this.bins[1] + this.bins[2] + this.bins[3]) / 765) ** 2 * 1.4);
    }

    // ------------------------------------------------------------ the channels

    // A video's own soundtrack, out of the same file: decoded once, then looped from wherever the picture is.
    async track(data) {
        try { return await this.ctx.decodeAudioData(data); } catch { return null; }
    }

    channel(buffer, offset = 0, gain = 0.55) {
        this.stop(this.tv, 0.01);
        this.tv = buffer ? this.play(buffer, { loop: true, offset, gain }) : null;
    }
}
