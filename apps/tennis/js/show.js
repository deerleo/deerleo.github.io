// The show: what the game of tennis turns into, and when. It runs the court, decides what happens at each hit,
// and every frame writes out what the renderer should draw.
//
//   plain      two bats and a ball in an old 4:3 picture. Three hits of yours and it ends.
//   break      everything stops. Eyes. "Six! Finger! PUNCH!" The ball goes through their bat and the side of the picture.
//   dimension  the camera swings round behind your bat: the same game down a mirrored chequered floor.
//   tunnel     flat out down a tunnel of signs.
//   trip       the walls go, and it's a slow fall into a fractal that never ends, every colour cycling.
//   zap        side-on again, over television. Every hit changes channel.
//   desk       a mid-nineties desktop: the bats are windows, the ball's a compact disc, and it ends in blue.
//   melt       multiball against the fist, in a kaleidoscope. Every ball that gets past you is a point to them.
//   finale     one ball left. Eyes again. The fist goes. Then plain, as if nothing happened.

import { Court } from './court.js';
import { Boxes, Balls } from './render.js';
import { clamp, mix, rand, lerp3, axisAngle, norm } from './m4.js';

const YELLOW = [1, 0.988, 0], WHITE = [1, 1, 1], PINK = [1, 0.12, 0.55], CYAN = [0.15, 0.9, 1], ORANGE = [1, 0.45, 0.05];
const BACK = [0.165, 0.165, 0.184];       // the shell's grey, round the old picture

const io = k => k * k * (3 - 2 * k);
const out = k => 1 - (1 - k) ** 3;
const into = k => k * k * k;
const hue = h => [0, 0.33, 0.67].map(o => 0.5 + 0.5 * Math.cos(6.2832 * (h + o)));

// Numbers out of blocks, three across and five down.
const DIGITS = ['111101101101111', '010010010010010', '111001111100111', '111001111001111', '101101111001001',
    '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];

// How many of your hits each part lasts, and how long before it moves on anyway.
const HITS = { plain: 3, dimension: 4, tunnel: 4, trip: 4, zap: 5, desk: 4 };
const LONGEST = { dimension: 26, tunnel: 22, trip: 24, zap: 20, desk: 20 };
const MELT = 17;        // seconds of multiball
const FIST = 11;        // how big the fist is: it's as deep as this, and most of it wide
// The trip's Julia sets, one after another: each hit of yours melts it into the next. All from the same limb of
// the Mandelbrot set, so three arms meet at the point we fall into.
// What the desktop has to say about each hit of yours.
const ERRORS = [
    ['Ball.exe has performed an illegal', 'return and will be shut down.'],
    ['Bat is not responding.'],
    ['Abort, Retry, Volley?'],
    ['Not enough memory to miss.', 'Close some rallies and try again.'],
    ['General Protection Fault', 'in module NET.DLL']
];
const TRIP = [[0, 1], [-0.19, 1.07], [0.06, 0.93], [-0.3, 0.92], [-0.05, 1.12]];

export class Show {
    constructor({ sound = null, media, track = () => {} }) {
        this.sound = sound;
        this.media = media;
        this.track = track;
        this.court = new Court();
        this.boxes = new Boxes();
        this.balls = new Balls();
        this.ghosts = new Balls();
        this.aspect = 16 / 9;
        this.pointer = null;        // where the mouse or finger is: x and y from -1 to 1, y up
        this.keys = { x: 0, y: 0 };
        this.t = 0;
        this.reset();
    }

    // ------------------------------------------------------------ back to the start

    reset() {
        this.tweens = [];
        this.cues = [];
        this.parts = [];
        this.ripples = [];
        this.blasts = [];
        this.stage = 'plain';
        this.stageT = 0;
        this.hits = 0;
        this.started = false;
        this.frozen = false;
        this.hold = 0;
        this.slow = 1;
        this.bullet = null;
        this.fist = null;
        this.video = null;
        this.channelAt = -1;
        this.cut = null;
        this.splash = null;
        this.bass = 0;
        this.scroll = 0;
        this.said = {};
        this.T = { cx: TRIP[0][0], cy: TRIP[0][1], u: 0, cycle: 0, spin: 1, key: 0, a: [0, 0, 0, 0], b: [0, 0, 0, 0] };
        this.rings = [];
        this.D = null;
        this.court = new Court();
        this.sound?.music(null);
        this.sound?.channel(null);
        this.media.channels.forEach(c => c.el.pause());
        // Everything about how it looks, each a number that can be slid from one value to another.
        this.L = {
            box: 1, lit: 0, depth: 0, view: 0, fov: 1.05, roll: 0, night: 0, tunnel: 0, plasma: 0, trip: 0, desk: 0, floor: 0, walls: 0, wire: 0, ring: 0,
            net: 1, pose: 0, frame: 0, round: 0, outline: 0, speed: 0, bloom: 0.55, glow: 0.4, trail: 0, glitch: 0, split: 0, flash: 0,
            invert: 0, dim: 0, shake: 0, snow: 0, tvRoll: 0, lift: 0.04, pop: 1, hot: 0
        };
    }

    // ------------------------------------------------------------ timing

    to(obj, key, value, dur = 0, ease = io, delay = 0) {
        this.tweens = this.tweens.filter(w => w.obj !== obj || w.key !== key);
        if (dur <= 0 && delay <= 0) { obj[key] = value; return; }
        this.tweens.push({ obj, key, to: value, from: null, t0: this.t + delay, dur, ease });
    }

    look(values, dur = 0, ease = io, delay = 0) {
        for (const key in values) this.to(this.L, key, values[key], dur, ease, delay);
    }

    at(delay, fn) {
        this.cues.push({ t: this.t + delay, fn });
    }

    tick(dt) {
        this.t += dt;
        this.tweens = this.tweens.filter(w => {
            if (this.t < w.t0) return true;
            w.from ??= w.obj[w.key];
            const k = w.dur > 0 ? clamp((this.t - w.t0) / w.dur, 0, 1) : 1;
            w.obj[w.key] = mix(w.from, w.to, w.ease(k));
            return k < 1;
        });
        // Cues can add more cues, so take the due ones out first.
        const due = this.cues.filter(c => this.t >= c.t);
        if (due.length) {
            this.cues = this.cues.filter(c => this.t < c.t);
            for (const c of due) c.fn();
        }
    }

    // Everything that's on its way, done now: for jumping straight to a part.
    flush() {
        for (let i = 0; i < 20 && (this.cues.length || this.tweens.length); i++) {
            for (const w of this.tweens) w.obj[w.key] = w.to;
            this.tweens = [];
            const due = this.cues.sort((a, b) => a.t - b.t);
            this.cues = [];
            for (const c of due) c.fn();
        }
    }

    // ------------------------------------------------------------ sizes

    // The old picture: 4:3, as big as fits with room round it. Its half size, as a part of the window's.
    get picture() {
        const h = Math.min(0.8, (0.94 * this.aspect * 3) / 4);
        return [(h * 4) / 3 / this.aspect, h];
    }

    // How wide the court is once it has three dimensions: as wide as the window lets it be.
    get wide() { return 1.5 * clamp(this.aspect, 0.72, 1.75) * 0.94; }

    // The flat court over the television: as long as the window is wide.
    get long() { return clamp(1.74 * this.aspect - 0.2, 2, 3.5); }

    resize(aspect) {
        this.aspect = aspect;
        const c = this.court;
        if (c.hz > 0.5 && !this.busy) c.hz = this.wide;
        if (this.stage === 'zap' || this.stage === 'desk') c.hx = this.long;
    }

    // ------------------------------------------------------------ a frame

    frame(dt, renderer) {
        dt = Math.min(dt, 0.05);
        this.tick(dt);
        this.stageT += dt;
        const c = this.court, L = this.L, s = this.sound;

        // The tune's kick, or a beat kept in the head when there's no sound to hear.
        const loud = s?.bass() ?? 0;
        const beat = L.lit > 0.5 && !loud && (!s || s.muted || !s.running) ? (1 - ((this.t * 2.2) % 1)) ** 3 * 0.8 : loud;
        this.bass += (beat - this.bass) * Math.min(1, dt * (beat > this.bass ? 40 : 7));

        this.aim(dt, renderer);

        if (this.hold > 0) this.hold -= dt;
        else if (!this.frozen) {
            c.step(dt * this.slow);
            for (const e of c.events.splice(0)) this.on(e);
        }
        c.events.length = 0;

        if (this.bullet) this.fly(dt);
        if (L.trip > 0.001) this.fall(dt);
        if (this.D?.faceT > 0 && (this.D.faceT -= dt) <= 0) this.D.face = 'smile';
        if (this.stage === 'melt') this.melt(dt);
        if (this.stage === 'finale') this.lure(dt);
        if (this.fist) this.punch(dt);
        this.scroll += L.speed * dt;
        L.shake *= Math.exp(-dt * 7);

        this.dust(dt);
        return this.picture3(dt, renderer);
    }

    // Your bat goes to the pointer, or moves with the keys.
    aim(dt, renderer) {
        const c = this.court, L = this.L, p = (this.spot ??= { x: 0, y: 0 });
        if (this.frozen) return;
        if (this.keys.x || this.keys.y) {
            this.pointer = null;
            const b = c.bat;
            c.move(b.y + this.keys.y * dt * 4.5, b.z + this.keys.x * dt * 4.5);
            return;
        }
        if (!this.pointer) return;
        p.x = this.pointer.x; p.y = this.pointer.y;
        const { from, dir } = renderer.ray(p.x, p.y);
        if (!Number.isFinite(dir[0])) return;
        if (L.view < 0.5) {
            if (Math.abs(dir[2]) < 1e-5) return;
            const k = -from[2] / dir[2];
            c.move(from[1] + dir[1] * k, 0);
        } else {
            if (Math.abs(dir[0]) < 1e-5) return;
            const k = (c.batX - from[0]) / dir[0];
            if (k > 0) c.move(from[1] + dir[1] * k, from[2] + dir[2] * k);
        }
    }

    // The first click, tap or key serves.
    start() {
        if (this.started) return;
        this.started = true;
        this.court.serve(-1, 0, 0.6);
    }

    // ------------------------------------------------------------ what the court says happened

    on(e) {
        const c = this.court, s = this.sound, b = e.ball, flat = this.L.view < 0.5;
        const pan = flat ? clamp(b.x / c.hx, -1, 1) * 0.7 : clamp(b.z / Math.max(c.hz, 1), -1, 1) * 0.7;

        if (e.type === 'serve') {
            if (this.stage === 'plain') return;
            if (this.late()) return this.next();
            return;
        }

        if (e.type === 'wall') {
            if (this.L.lit < 0.5) s?.beep(226, 0.03, 0.14);
            else {
                s?.wall(pan);
                if (c.balls.length < 6 || Math.random() < 0.15) this.ripples.push({ x: b.x, y: e.axis === 'y' ? e.side * c.hy : b.y, z: e.axis === 'z' ? e.side * c.hz : b.z, axis: e.axis, age: 0 });
            }
            return;
        }

        if (e.type === 'end') {
            if (e.side < 0) s?.wall(pan);
            return;
        }

        if (e.type === 'point') {
            if (this.stage === 'plain') {
                s?.beep(98, 0.35, 0.16);
                c.serve(-1, 0, 1.1);
            } else if (this.stage === 'zap') {
                s?.snow();
                this.zap();
                c.serve(-1, 0, 0.5);
            } else if (this.stage === 'desk') {
                const D = this.D;
                s?.ding(0.5, 0.45);
                D.face = e.who === 0 ? 'cool' : 'dead';
                D.faceT = 1.2;
                D.wipe++;
                c.serve(-1, 0, 0.6);
            } else if (this.stage === 'melt') {
                // One got past you: a point to them, and the fist throws another.
                if (s?.spaced('lost', 0.1)) s.slice('hits', { gain: 0.3, rate: 0.5 });
                this.L.shake = Math.max(this.L.shake, 0.25);
                const fresh = c.serve(-1, 1);
                if (fresh) fresh.hue = Math.random();
            } else {
                s?.slice('hits', { gain: 0.35, rate: 0.45 });
                if (e.who === 0) this.look({ flash: 0.25 }), this.look({ flash: 0 }, 0.3, out);
                c.serve(-1, 1, 0.5);
            }
            return;
        }

        // A hit.
        if (this.stage === 'plain') {
            s?.beep(e.mine ? 459 : 491, 0.045, 0.16);
            if (e.mine && ++this.hits >= HITS.plain && this.ready()) this.breakOut(b);
            return;
        }

        if (this.stage === 'finale') {
            if (e.mine && b.one) this.finish(b);
            return;
        }

        const hard = e.mine ? 1 : 0.7, desky = this.stage === 'desk';
        if (desky) s?.ding(e.mine ? 1 : 0.75);
        else if (this.L.lit > 0.5) s?.thwack(pan, hard);
        else s?.beep(e.mine ? 459 : 491, 0.045, 0.16);
        if (!desky) this.sparks(b.x, b.y, b.z, e.mine ? 14 : 8, e.mine ? YELLOW : PINK, e.mine ? 1 : -1);
        this.L.shake = Math.max(this.L.shake, e.mine ? 0.35 : 0.15);
        if (e.mine) {
            this.hits++;
            this.L.split = 0.02;
            this.look({ split: 0 }, 0.25, out);
            if (this.stage !== 'melt') this.hold = 0.045;
            // In the tunnel every hit of yours rolls the whole thing right over.
            if (this.stage === 'tunnel') {
                this.L.roll = 0;
                this.look({ roll: Math.PI * 2 * (this.hits % 2 ? 1 : -1) }, 0.8, io, 0.05);
                this.at(0.9, () => { if (this.stage === 'tunnel') this.L.roll = 0; });
            }
        }
        // In the trip every hit sends the colours racing, and yours melts the fractal into another.
        if (this.stage === 'trip') {
            const T = this.T;
            T.spin = e.mine ? 5 : 2.5;
            if (e.mine) {
                const k = TRIP[++T.key % TRIP.length];
                this.to(T, 'cx', k[0], 1.6, out);
                this.to(T, 'cy', k[1], 1.6, out);
            }
        }

        if (this.stage === 'zap') this.zap();

        // On the desktop a hit repaints the screen, and yours earns an error.
        if (desky) {
            const D = this.D, n = D.errors++;
            D.wipe++;
            D.face = 'oh';
            D.faceT = 0.35;
            if (e.mine) D.dialogs.push({ x: 0.36 + (n % 5) * 0.07, y: 0.32 + (n % 5) * 0.075, lines: ERRORS[n % ERRORS.length] });
        }

        if (this.stage === 'melt') {
            if (e.mine) this.split(b);
            return;
        }

        if (e.mine && (this.hits >= HITS[this.stage] || this.late())) this.next();
    }

    late() { return !this.busy && this.stageT > (LONGEST[this.stage] ?? Infinity); }

    // Is everything the break needs here yet? Until it is, it's just tennis.
    ready() {
        return this.media.ready;
    }

    next() {
        if (this.busy) return;
        if (this.stage === 'dimension') this.enterTunnel();
        else if (this.stage === 'tunnel') this.enterTrip();
        else if (this.stage === 'trip') this.media.channels.length >= 2 ? this.enterZap() : this.enterDesk();
        else if (this.stage === 'zap') this.enterDesk();
        else if (this.stage === 'desk') this.crash();
    }

    // ------------------------------------------------------------ the break

    breakOut(b) {
        const c = this.court, s = this.sound;
        this.stage = 'break';
        this.frozen = true;
        this.busy = true;
        this.track('Tennis break');
        c.balls = [];
        this.held = { x: c.batX + c.r, y: b.y };
        s?.play('shing', { gain: 0.6 });
        this.eyes(1, 'punch', s?.words, () => {
            this.bullet = { x: this.held.x, y: this.held.y, z: 0, v: 24, through: false, tail: [] };
            this.held = null;
        });
    }

    // The cut-in: the eyes slide across, the announcer says it, the fist lands on the last word, then `then`.
    eyes(side, line, words, then) {
        const s = this.sound;
        this.look({ dim: 0.72 }, 0.15, out);
        this.cut = { in: 0, open: 0.25, pan: -0.05 * side, side, jolt: 0 };
        this.to(this.cut, 'in', 1, 0.2, out, 0.1);
        this.to(this.cut, 'open', 1, 0.25, out, 0.2);
        this.to(this.cut, 'pan', 0.05 * side, 2.4, k => k, 0.1);
        this.to(this.cut, 'jolt', 1, 1.2, into, 0.3);
        s?.say(line, 0.3, 1);
        const land = 0.3 + (words?.length > 1 ? words.at(-1) : 1.15);
        this.at(land, () => {
            this.cut = null;
            this.splash = { zoom: 1, invert: 1, white: 0, alpha: 1 };
            this.to(this.splash, 'zoom', 1.3, 0.45, out);
            this.to(this.splash, 'invert', 0, 0.001, io, 0.07);
            s?.play('boom', { gain: 0.8 });
            this.L.shake = 1.4;
        });
        this.at(land + 0.42, () => {
            this.splash = null;
            this.frozen = false;
            this.look({ dim: 0 });
            this.look({ flash: 0.8 });
            this.look({ flash: 0 }, 0.25, out);
            then();
        });
    }

    // The punched ball, too fast for the court's rules: straight through their bat and out of the picture.
    fly(dt) {
        const u = this.bullet, c = this.court;
        u.tail.push([u.x, u.y, u.z]);
        if (u.tail.length > 14) u.tail.shift();
        u.x += u.v * dt;
        if (!u.through && u.x >= c.cpuX - 0.2) {
            u.through = true;
            if (this.stage === 'break') {
                c.cpu.gone = true;
                this.sound?.beep(120, 0.08, 0.2);
                for (let i = 0; i < 12; i++) {
                    this.spark({ x: c.cpuX, y: c.cpu.y + rand(-c.cpu.hh, c.cpu.hh), z: 0, vx: rand(2, 7), vy: rand(-4, 4), vz: 0, size: 0.07, life: 0.9, col: WHITE, spin: 0, drag: 0.5 });
                }
            } else if (this.fist) return this.shatter();
        }
        if (this.stage === 'break' && u.x >= c.hx + 0.05) {
            this.bullet = null;
            this.smash(u.y);
        }
    }

    // Through the glass.
    smash(y = 0) {
        const c = this.court, s = this.sound;
        s?.play('smash', { gain: 0.7 });
        s?.music('main');
        c.score[0]++;
        this.L.shake = 1.2;
        for (let i = 0; i < 70; i++) {
            const a = rand(-1.3, 1.3), v = rand(2, 11);
            this.spark({
                x: c.hx, y: y + rand(-0.3, 0.3), z: rand(-0.1, 0.1), vx: Math.cos(a) * v * rand(-0.3, 1), vy: Math.sin(a) * v + 2, vz: rand(-1, 7),
                size: rand(0.04, 0.16), life: rand(1.2, 2.6), col: i % 3 ? WHITE : CYAN, e: 0.35, spin: rand(4, 14), thin: true, gravity: 9
            });
        }
        this.look({ flash: 1 });
        this.look({ flash: 0 }, 0.5, out);
        this.enterDimension();
    }

    // ------------------------------------------------------------ the third dimension

    enterDimension(quick = false) {
        const c = this.court, k = quick ? 0 : 1;
        this.stage = 'dimension';
        this.stageT = 0;
        this.hits = 0;
        this.busy = true;
        this.frozen = false;
        c.clear();
        c.speed = 7.5;
        c.swerve = 0.6;
        c.pad = 0.1;
        // From here their bat chases the ball about, and can be beaten.
        c.cpu.speed = 3.4;
        c.cpu.chase = 0.25;
        c.solid = false;
        this.look({ box: 0, lift: 0 }, 0.45 * k, out);
        this.look({ lit: 1, glow: 0, night: 1 }, 0.7 * k);
        this.look({ depth: 1, pose: 1 }, 1.3 * k);
        this.look({ view: 1 }, 1.9 * k, io, 0.1 * k);
        this.look({ net: 0 }, 0.4 * k);
        this.look({ floor: 1 }, 0.9 * k, io, 0.3 * k);
        this.look({ frame: 1 }, 0.7 * k, io, 0.9 * k);
        this.look({ wire: 1, ring: 1 }, 0.6 * k, io, 1.4 * k);
        this.look({ bloom: 0.9 }, 0.6 * k);
        this.to(c, 'hx', 5.5, 1.5 * k);
        this.to(c, 'hz', this.wide, 1.2 * k, io, 0.4 * k);
        this.to(c, 'inset', 0.3, k);
        for (const bat of [c.bat, c.cpu]) {
            this.to(bat, 'hh', 0.46, k);
            this.to(bat, 'hw', 0.62, k);
        }
        this.at(1.1 * k, () => {
            c.cpu.gone = false;
            c.cpu.y = c.cpu.z = 0;
            this.L.pop = 0;
            this.look({ pop: 1 }, 0.35 * k, out);
        });
        this.at(2.2 * k, () => {
            c.r = 0.17;
            this.L.round = 1;
            this.busy = false;
            this.stageT = 0;
            c.serve(-1, 1);
        });
    }

    enterTunnel() {
        const c = this.court, s = this.sound;
        this.stage = 'tunnel';
        this.stageT = 0;
        this.hits = 0;
        this.track('Tennis tunnel');
        s?.say('hyper');
        s?.play('whoosh', { gain: 0.8 });
        this.look({ walls: 1, tunnel: 1 }, 0.5);
        this.look({ night: 0, floor: 0, wire: 0 }, 0.5);
        this.look({ fov: 1.5 }, 0.9, out);
        this.look({ speed: 75 }, 1.2, out);
        this.look({ glitch: 0.12 });
        this.look({ glitch: 0 }, 0.4);
        this.look({ bloom: 0.75 }, 0.5);
        this.L.shake = 0.8;
        c.speed = 10.5;
        c.cpu.speed = 4.6;
        for (const b of c.balls) this.pace(b);
    }

    // A ball already in play, brought up (or down) to the court's speed.
    pace(b) {
        const k = this.court.speed / Math.max(1, Math.abs(b.vx));
        b.vx *= k; b.vy *= k; b.vz *= k;
    }

    // ------------------------------------------------------------ the trip

    enterTrip() {
        const c = this.court, s = this.sound;
        this.stage = 'trip';
        this.stageT = 0;
        this.hits = 0;
        this.track('Tennis trip');
        s?.say('far', 0, 1.4);
        if (s?.has('music-trip')) s.music('trip');
        this.look({ walls: 0, tunnel: 0 }, 0.9);
        this.look({ trip: 1 }, 0.9);
        this.look({ speed: 0 }, 1.6, out);
        this.look({ fov: 1.25 }, 1.4);
        this.look({ wire: 1 }, 0.8, io, 0.4);
        this.look({ bloom: 0.45 }, 0.6);
        this.look({ flash: 0.5 });
        this.look({ flash: 0 }, 0.5, out);
        // Slow, and the ball swells: nobody's in a hurry here.
        c.speed = 6.2;
        c.cpu.speed = 2.8;
        this.to(c, 'r', 0.25, 0.8, out);
        for (const b of c.balls) this.pace(b);
    }

    // Where the trip's Julia set has its arms meet, and how far down into it we've fallen. Near that point the
    // set is the same shape again every third step, a little bigger and a little further round. So fall one such
    // level, jump back out, and nobody can tell: it never ends.
    fall(dt) {
        const T = this.T;
        // The point that stays put under z*z + c, and how much one step stretches and turns things round it.
        const ax = 1 - 4 * T.cx, ay = -4 * T.cy, m = Math.hypot(ax, ay);
        const lx = 1 - Math.sqrt((m + ax) / 2), ly = (ay < 0 ? 1 : -1) * Math.sqrt((m - ax) / 2);
        const grow = Math.log(Math.hypot(lx, ly)) * 3;
        let round = (Math.atan2(ly, lx) * 3) % (Math.PI * 2);
        if (round > Math.PI) round -= Math.PI * 2;
        if (round < -Math.PI) round += Math.PI * 2;
        T.spin += (1 - T.spin) * Math.min(1, dt * 1.5);
        T.u += ((0.42 + this.bass * 0.4) * T.spin * dt) / grow;
        T.cycle += dt * T.spin;
        const level = Math.floor(T.u), f = T.u - level, size = 0.025 * Math.exp(-f * grow), a = -f * round;
        T.a = [T.cx, T.cy, lx / 2, ly / 2];
        T.b = [size * Math.cos(a), size * Math.sin(a), (level * 3 + T.cycle) % 8, 0.9 + this.bass * 0.1];
    }

    // ------------------------------------------------------------ television

    enterZap() {
        const c = this.court, s = this.sound, was = c.hx;
        this.stage = 'zap';
        this.stageT = 0;
        this.hits = 0;
        this.track('Tennis zap');
        if (s?.playing === 'trip') s.music('main', { on: true });
        s?.duck(0.45, 0.2);
        s?.say('surf');
        this.tweens = [];
        this.look({
            view: 0, lit: 0, depth: 0, walls: 0, tunnel: 0, night: 0, plasma: 0, trip: 0, floor: 0, wire: 0, ring: 0, frame: 0, round: 0, net: 1, pose: 0,
            speed: 0, fov: 1.05, box: 0, outline: 1, glow: 0.25, bloom: 0.5, roll: 0, trail: 0, lift: 0, split: 0, glitch: 0, flash: 0, dim: 0
        });
        c.hz = 0;
        c.hx = this.long;
        c.inset = 0.25;
        c.r = 0.055;
        c.speed = 4.4 * (c.hx / 2) ** 0.5;
        c.swerve = 0.8;
        c.pad = 0.06;
        c.cpu.speed = 4.2;
        c.cpu.chase = 0;
        for (const bat of [c.bat, c.cpu]) { bat.hh = 0.3; bat.z = 0; }
        for (const b of c.balls) {
            b.x *= c.hx / was;
            b.z = 0; b.vz = 0;
            this.pace(b);
        }
        if (!c.balls.length && c.wait < 0) c.serve(-1, 0, 0.4);
        this.zap();
    }

    // Change channel: a burst of snow, the picture rolls, and it's something else.
    zap() {
        const list = this.media.channels;
        if (!list.length) return;
        this.video?.el.pause();
        this.channelAt = (this.channelAt + 1) % list.length;
        const v = (this.video = list[this.channelAt]);
        try { v.el.currentTime = rand(0, Math.max(0, (v.el.duration || 5) - 2.5)); } catch {}
        v.el.play().catch(() => {});
        this.sound?.snow();
        this.sound?.channel(v.audio, v.el.currentTime);
        this.look({ snow: 1, tvRoll: rand(0.3, 0.7) });
        this.look({ snow: 0 }, 0.22, into);
        this.look({ tvRoll: 0 }, 0.3, out);
    }

    // ------------------------------------------------------------ the desktop

    enterDesk() {
        const c = this.court, s = this.sound, was = c.hx;
        this.stage = 'desk';
        this.stageT = 0;
        this.hits = 0;
        this.track('Tennis desk');
        this.video?.el.pause();
        this.video = null;
        s?.channel(null);
        s?.snow();
        if (s?.has('music-midi')) s.music('midi', { gain: 0.7 });
        else if (s?.playing === 'trip') s.music('main', { on: true });
        s?.play('startup', { gain: 0.45 });
        s?.say('start', 0.5);
        this.tweens = [];
        this.look({
            view: 0, lit: 0, depth: 0, walls: 0, tunnel: 0, night: 0, plasma: 0, trip: 0, floor: 0, wire: 0, ring: 0, frame: 0, round: 0, net: 1, pose: 0,
            speed: 0, fov: 1.05, box: 0, outline: 1, glow: 0.25, bloom: 0.3, roll: 0, trail: 0, lift: 0, split: 0, glitch: 0, flash: 0, dim: 0,
            desk: 1, snow: 1, tvRoll: 0.5
        });
        this.look({ snow: 0 }, 0.35, into);
        this.look({ tvRoll: 0 }, 0.4, out);
        c.hz = 0;
        c.hx = this.long;
        c.inset = 0.25;
        c.r = 0.125;
        c.speed = 4.4 * (c.hx / 2) ** 0.5;
        c.swerve = 0.8;
        c.pad = 0.06;
        c.cpu.speed = 4.2;
        c.cpu.chase = 0;
        for (const bat of [c.bat, c.cpu]) { bat.hh = 0.42; bat.z = 0; }
        for (const b of c.balls) {
            b.x *= c.hx / was;
            b.z = 0; b.vz = 0;
            this.pace(b);
        }
        if (!c.balls.length && c.wait < 0) c.serve(-1, 0, 0.4);
        this.D = {
            dialogs: [], errors: 0, wipe: 0, face: 'smile', faceT: 0, blue: false,
            clock: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        };
    }

    // It all goes blue, as it always did in the end. Then multiball.
    crash() {
        const s = this.sound;
        this.busy = true;
        this.frozen = true;
        this.D.blue = true;
        s?.music(null);
        s?.stuck();
        this.at(1.4, () => {
            this.frozen = false;
            this.busy = false;
            this.enterMelt();
        });
    }

    // ------------------------------------------------------------ multiball

    enterMelt() {
        const c = this.court, s = this.sound;
        this.stage = 'melt';
        this.stageT = 0;
        this.hits = 0;
        this.track('Tennis melt');
        this.video?.el.pause();
        this.video = null;
        this.D = null;
        s?.channel(null);
        s?.snow();
        s?.music('melt');
        s?.say('multiball');
        this.tweens = [];
        this.look({
            view: 1, lit: 1, depth: 1, plasma: 1, wire: 1, ring: 0, frame: 1, round: 1, net: 0, pose: 1, outline: 0, glow: 0, walls: 0, tunnel: 0,
            night: 0, trip: 0, desk: 0, tvRoll: 0, floor: 0, speed: 0, fov: 1.3, box: 0, bloom: 1.1, roll: 0, flash: 0.7, lift: 0, split: 0, glitch: 0, dim: 0, snow: 0
        });
        this.look({ flash: 0 }, 0.3, out);
        this.look({ trail: 0.88 }, 1.2);
        c.clear();
        c.hx = 4;
        c.hz = this.wide;
        c.inset = 0.3;
        c.r = 0.15;
        c.speed = 9;
        c.swerve = 0.6;
        c.pad = 0.14;
        c.solid = true;
        // Your end lets them through. Past it they shrink away to nothing, well short of the camera.
        c.leak = true;
        c.out = 1.5;
        c.cpu.gone = true;
        for (const bat of [c.bat, c.cpu]) { bat.hh = 0.5; bat.hw = 0.68; }
        this.fist = { x: c.hx + 0.5 + FIST / 2, y: 0, z: 0, lunge: 0, wait: 1.5, alive: true, in: 0 };
        this.to(this.fist, 'in', 1, 0.7, out);
        for (let i = 0; i < 3; i++) this.at(0.5 + i * 0.35, () => { const b = c.serve(-1, 1); if (b) b.hue = Math.random(); });
    }

    // Every hit of yours makes two of it.
    split(b) {
        const c = this.court;
        c.score[0]++;
        b.hue ??= Math.random();
        if (c.balls.length < 110) {
            const s = c.speed * 0.5;
            c.balls.push({ ...b, vy: -b.vy + rand(-s, s), vz: -b.vz + rand(-s, s), hue: Math.random(), trail: null, age: 0 });
        }
        if (c.score[0] >= 25 && !this.said.ultra) { this.said.ultra = true; this.sound?.say('ultra'); }
        if (c.score[0] >= 70 && !this.said.monster) { this.said.monster = true; this.sound?.say('monster'); }
    }

    melt(dt) {
        const c = this.court;
        // Never an empty court.
        if (!c.balls.length && c.wait < 0 && this.stageT > 2) c.serve(-1, 1, 0.2);
        if (this.stageT > MELT) this.enterFinale();
    }

    // The fist hangs at the far end, drifts to where the balls are heading, and every so often lunges: anything
    // in front of it comes back twice as fast.
    punch(dt) {
        const f = this.fist, c = this.court;
        if (!f.alive) return;
        let y = 0, z = 0, n = 0;
        for (const b of c.balls) if (b.vx > 0 && b.x > 0) { y += b.y; z += b.z; n++; }
        if (n) { y /= n; z /= n; }
        f.y += (y * 0.7 - f.y) * Math.min(1, dt * 3);
        f.z += (z * 0.7 - f.z) * Math.min(1, dt * 3);
        f.lunge = Math.max(0, f.lunge - dt * 3.2);
        if (this.stage !== 'melt') return;
        f.wait -= dt;
        if (f.wait <= 0 && c.balls.some(b => b.vx > 0 && b.x > c.hx - 2.4)) {
            f.wait = rand(0.9, 1.6);
            f.lunge = 1;
            let any = false;
            for (const b of c.balls) {
                if (b.x < c.hx - 2.6) continue;
                b.vx = -c.speed * rand(1.5, 2);
                b.vy = rand(-0.5, 0.5) * c.speed;
                b.vz = rand(-0.5, 0.5) * c.speed;
                any = true;
            }
            if (any) {
                this.sound?.play('boom', { gain: 0.35, rate: 1.5 });
                this.L.shake = Math.max(this.L.shake, 0.6);
                this.ripples.push({ x: c.hx - 1.6, y: f.y * 0.3, z: f.z * 0.3, axis: 'x', age: 0, big: true });
            }
        }
    }

    // ------------------------------------------------------------ the end

    enterFinale() {
        const c = this.court, s = this.sound;
        this.stage = 'finale';
        this.stageT = 0;
        this.busy = true;
        c.leak = false;
        this.track('Tennis finale');
        s?.music(null);
        s?.play('riser', { gain: 0.5 });
        this.to(this, 'slow', 0.12, 0.4, out);
        this.look({ trail: 0.6, plasma: 0.3 }, 0.6);
        // Every ball is drawn in to one spot in front of you, and they become one.
        const at = [c.batX + 3.2, 0, 0];
        for (const b of c.balls) {
            b.drawn = true;
            this.to(b, 'x', at[0], 0.9, into);
            this.to(b, 'y', at[1], 0.9, into);
            this.to(b, 'z', at[2], 0.9, into);
            b.vx = b.vy = b.vz = 0;
        }
        this.at(0.95, () => {
            c.balls = [{ x: at[0], y: 0, z: 0, vx: -1.6, vy: 0, vz: 0, age: 0, hits: 0, one: true }];
            c.r = 0.36;
            c.pad = 0.5;
            this.slow = 1;
            this.look({ flash: 0.6 });
            this.look({ flash: 0 }, 0.4, out);
            this.L.shake = 0.6;
            this.sound?.play('boom', { gain: 0.5, rate: 0.8 });
        });
    }

    // The one ball comes to your bat wherever it is: this one you can't miss.
    lure(dt) {
        const c = this.court, b = c.balls.find(b => b.one);
        if (!b || this.frozen) return;
        b.y += (c.bat.y - b.y) * Math.min(1, dt * 5);
        b.z += (c.bat.z - b.z) * Math.min(1, dt * 5);
    }

    finish(b) {
        const c = this.court, s = this.sound;
        this.frozen = true;
        c.balls = [];
        this.held = { x: c.batX + c.r, y: b.y, z: b.z, big: true };
        s?.play('shing', { gain: 0.6 });
        this.look({ trail: 0 }, 0.2);
        this.eyes(-1, 'finish', s?.lastWords, () => {
            this.bullet = { x: this.held.x, y: this.held.y, z: this.held.z, v: 60, through: false, tail: [], big: true };
            this.held = null;
            this.look({ trail: 0.8 });
        });
    }

    // The fist, hit: it bursts into its own pieces, the picture whites out, and it's 1972 again.
    shatter() {
        const f = this.fist, s = this.sound, u = this.bullet;
        this.bullet = null;
        f.alive = false;
        this.hold = 0.12;
        s?.play('explosion', { gain: 0.9 });
        s?.play('boom', { gain: 0.6 });
        this.L.shake = 2;
        for (let i = 0; i < 520; i++) {
            const d = norm([rand(-1, 0.5), rand(-1, 1), rand(-1, 1)]), v = rand(4, 34);
            this.spark({
                x: f.x + rand(-0.5, 0.3) * FIST, y: f.y + rand(-0.25, 0.25) * FIST, z: f.z + rand(-0.4, 0.4) * FIST, vx: d[0] * v, vy: d[1] * v, vz: d[2] * v,
                size: rand(0.2, 0.95), life: rand(1.2, 2.6), col: i % 5 ? YELLOW : WHITE, e: i % 4 ? 0.15 : 1, spin: rand(3, 16), drag: 0.5
            });
        }
        // The fireball.
        for (let i = 0; i < 7; i++) this.blasts.push({ x: f.x - FIST * 0.3 + rand(-1, 1), y: f.y + rand(-1.5, 1.5), z: f.z + rand(-2, 2), age: -i * 0.05, size: rand(3, 6.5) });
        this.ripples.push({ x: f.x - 1, y: u.y, z: u.z, axis: 'x', age: 0, big: true });
        this.look({ flash: 0.9, hot: 0 });
        this.look({ flash: 0 }, 0.2, out);
        this.look({ flash: 1 }, 0.9, into, 1.1);
        this.at(2.2, () => this.enterEnd());
    }

    enterEnd() {
        const score = this.court.score;
        this.track('Tennis end');
        this.reset();
        // The ball waits at the net, as it did at the very start, until there's a click.
        this.court.score = score;
    }

    // Straight to a part, for testing: ?at=dimension, tunnel, trip, zap, desk, melt or finale.
    jump(name) {
        this.reset();
        this.started = true;
        if (name === 'break') { this.hits = 2; this.court.serve(-1, 0); return; }
        this.sound?.music('main');
        this.enterDimension(true);
        this.flush();
        if (name === 'tunnel' || name === 'trip') this.enterTunnel();
        if (name === 'trip') { this.flush(); this.enterTrip(); }
        if (name === 'zap') { this.court.clear(); this.enterZap(); }
        if (name === 'desk') { this.court.clear(); this.enterDesk(); }
        if (name === 'melt' || name === 'finale') this.enterMelt();
        if (name === 'finale') this.stageT = MELT - 3;
    }

    // ------------------------------------------------------------ bits flying about

    spark(p) {
        if (this.parts.length > 1100) return;
        this.parts.push({ age: 0, e: 0.9, gravity: 0, drag: 0, spin: 8, axis: norm([rand(-1, 1), rand(-1, 1), rand(-1, 1)]), turn: rand(0, 6), ...p });
    }

    sparks(x, y, z, n, col, dir) {
        const flat = this.L.view < 0.5;
        for (let i = 0; i < n; i++) {
            this.spark({
                x, y, z, vx: dir * rand(1, 7) * (flat ? 0.5 : 1), vy: rand(-4, 4) * (flat ? 0.5 : 1), vz: flat ? 0 : rand(-4, 4),
                size: flat ? 0.05 : rand(0.04, 0.1), life: rand(0.25, 0.6), col, drag: 2, spin: flat ? 0 : 10
            });
        }
    }

    dust(dt) {
        const floor = this.L.floor > 0.5 ? -this.court.hy : -Infinity;
        for (const p of this.parts) {
            p.age += dt;
            const k = Math.exp(-p.drag * dt);
            p.vx *= k; p.vy = p.vy * k - p.gravity * dt; p.vz *= k;
            p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
            p.turn += p.spin * dt;
            if (p.y < floor + p.size / 2) { p.y = floor + p.size / 2; p.vy = Math.abs(p.vy) * 0.45; p.spin *= 0.6; }
        }
        this.parts = this.parts.filter(p => p.age < p.life);
        for (const r of this.ripples) r.age += dt;
        this.ripples = this.ripples.filter(r => r.age < 0.5).slice(-14);
        for (const b of this.blasts) b.age += dt;
        this.blasts = this.blasts.filter(b => b.age < 0.9);
    }

    // ------------------------------------------------------------ what to draw

    picture3(dt, renderer) {
        const c = this.court, L = this.L, t = this.t, B = this.boxes, S = this.balls, G = this.ghosts;
        const { hx, hy, hz } = c;
        B.clear(); S.clear(); G.clear();
        const flat = L.view < 0.5, trippy = L.trip > 0.5, desky = L.desk > 0.5;
        const th = mix(0.02, 0.3, L.depth);

        // A flat piece, with a black edge round it when it has to show up over television.
        const slab = (x, y, z, w, h, d, col, e = 0, rot = null) => {
            if (L.outline > 0.5) B.add(x, y, z - 0.04, w + 0.045, h + 0.045, 0.02, 0, 0, 0, -1, rot);
            B.add(x, y, z, w, h, d, col[0], col[1], col[2], e, rot);
        };

        // The net.
        if (L.net > 0.01 && !desky) {
            const n = 15, gap = (2 * hy) / n;
            for (let i = 0; i < n; i++) slab(0, -hy + (i + 0.5) * gap, 0, 0.035 * L.net, gap * 0.5 * L.net, th, WHITE, 0.3);
        }

        // Your bat: solid while it's flat, a frame you can see through from behind it.
        if (!desky) {
            const b = c.bat, x = c.batX - 0.04, f = L.frame;
            if (f < 0.02) slab(x, b.y, 0, 0.08, 2 * b.hh, th, YELLOW, 0.9);
            else {
                const hw = mix(th / 2, b.hw, f), bar = mix(b.hh, 0.05, f), k = 0.9 + this.bass * 0.3;
                B.add(x, b.y + b.hh - bar / 2, b.z, 0.08, bar, 2 * hw, ...YELLOW, k);
                B.add(x, b.y - b.hh + bar / 2, b.z, 0.08, bar, 2 * hw, ...YELLOW, k);
                B.add(x, b.y, b.z - hw + bar / 2, 0.08, 2 * b.hh, bar, ...YELLOW, k);
                B.add(x, b.y, b.z + hw - bar / 2, 0.08, 2 * b.hh, bar, ...YELLOW, k);
                B.add(x, b.y, b.z, 0.03, 0.03, 0.34 * f, ...YELLOW, k);
                B.add(x, b.y, b.z, 0.03, 0.34 * f, 0.03, ...YELLOW, k);
            }
        }

        // Theirs.
        if (!c.cpu.gone && !desky) {
            const b = c.cpu, p = L.pop;
            slab(c.cpuX + 0.04 + (flat ? 0 : 0.03), b.y, b.z, mix(0.08, 0.14, L.depth), 2 * b.hh * p, mix(th, 2 * b.hw, L.depth) * p, PINK, 0.75);
        }

        // The score.
        if (!desky) {
            this.number(c.score[0], -1, slab, th);
            this.number(c.score[1], 1, slab, th);
        }

        // The balls: square, then round, with a trail once there's room for one.
        const near = c.balls.reduce((a, b) => (b.vx < 0 && (!a || b.x < a.x) ? b : a), null) ?? c.balls[0];
        for (const b of desky ? [] : c.balls) {
            const gone = c.leak ? clamp(1 - (-hx - b.x) / c.out, 0, 1) : 1;
            let r = b.one ? c.r * (1 + 0.08 * Math.sin(t * 20)) : c.r * gone, { x, y, z } = b;
            if (trippy) {
                // In the trip it corkscrews down the court, widest in the middle and dead straight by the time it
                // reaches a bat, and it breathes.
                const k = clamp((x - c.batX) / (c.cpuX - c.batX), 0, 1), wide = 0.45 * Math.sin(Math.PI * k) ** 2, a = k * 10 + t * 2;
                y = clamp(y + Math.cos(a) * wide, r - hy, hy - r);
                z = clamp(z + Math.sin(a) * wide, r - hz, hz - r);
                r *= 1 + 0.16 * Math.sin(t * 6);
            }
            if (L.round < 0.5) slab(x, y, z, 2 * r, 2 * r, th, WHITE, 0.6);
            else {
                // In the trip it's a striped cartoon ball.
                const col = b.one ? YELLOW : b.hue !== undefined ? hue(b.hue) : WHITE;
                S.add(x, y, z, r, col[0], col[1], col[2], trippy ? -2 : b.one ? 1.6 : b.hue !== undefined ? 0.5 : 0);
                const tail = (b.trail ??= []), n = tail.length;
                // The trip's tail is measured out by distance, so its links stay evenly spaced.
                if (!trippy || n < 3 || Math.hypot(x - tail[n - 3], y - tail[n - 2], z - tail[n - 1]) > 0.11) tail.push(x, y, z);
                const most = c.balls.length > 30 ? 4 : trippy ? 30 : 10;
                while (tail.length > most * 3) tail.splice(0, 3);
                if (trippy) {
                    // It leaves itself behind: a string of cartoon balls, each a colour on and a size down.
                    for (let i = tail.length / 3 - 4, j = 1; i >= 0; i -= 4, j++) {
                        const tint = hue(t * 0.3 + j * 0.13);
                        S.add(tail[i * 3], tail[i * 3 + 1], tail[i * 3 + 2], r * Math.max(0.2, 1 - j * 0.12), tint[0], tint[1], tint[2], -1);
                    }
                    continue;
                }
                const tint = b.hue !== undefined ? col : b.vx > 0 ? YELLOW : PINK;
                for (let i = 0; i < tail.length; i += 3) {
                    const k = (i / 3 + 1) / (tail.length / 3 + 1);
                    G.add(tail[i], tail[i + 1], tail[i + 2], r * (0.4 + 0.6 * k), tint[0], tint[1], tint[2], k * 0.45);
                }
            }
        }
        // Waiting to start: the ball blinks at the net.
        if (!this.started && (t * 1.6) % 1 < 0.6) slab(0, 0, 0, 2 * c.r, 2 * c.r, th, WHITE, 0.6);
        if (this.held) {
            const h = this.held, r = c.r;
            if (h.big) S.add(h.x, h.y, h.z, r * (1.15 + 0.1 * Math.sin(t * 60)), ...YELLOW, 2);
            else slab(h.x, h.y, 0, 2 * r, 2 * r, th, WHITE, 0.6);
        }
        if (this.bullet) {
            const u = this.bullet, r = c.r;
            if (u.big) {
                S.add(u.x, u.y, u.z, r, ...YELLOW, 2.5);
                u.tail.forEach((p, i) => G.add(p[0], p[1], p[2], r * (0.5 + i / u.tail.length), ...YELLOW, 0.8));
                for (let i = 1; i < 10; i++) G.add(u.x - i * 0.5, u.y, u.z, r * (1.4 - i * 0.1), ...YELLOW, 0.7);
            } else {
                slab(u.x, u.y, 0, 2 * r, 2 * r, th, WHITE, 0.6);
                u.tail.forEach((p, i) => slab(p[0], p[1], 0, 2 * r, 2 * r * ((i + 1) / u.tail.length), th, WHITE, 0.6));
            }
        }

        // A frame round the court where the nearest ball is, so its distance can be read.
        const bar = (x, y, z, sx, sy, sz, col, e) => B.add(x, y, z, sx, sy, sz, col[0], col[1], col[2], e);
        const hoop = (x, w, col, e, in_ = 0) => {
            bar(x, hy - in_, 0, w, w, 2 * (hz - in_), col, e);
            bar(x, -hy + in_, 0, w, w, 2 * (hz - in_), col, e);
            bar(x, 0, hz - in_, w, 2 * (hy - in_), w, col, e);
            bar(x, 0, -hz + in_, w, 2 * (hy - in_), w, col, e);
        };
        if (L.ring > 0.01 && near && hz > 0.5) hoop(near.x, 0.035 * L.ring, trippy ? WHITE : CYAN, 0.9);
        // In the trip the hoop leaves a rainbow of itself behind.
        if (trippy && near) {
            const R = this.rings;
            if (!R.length || Math.abs(near.x - R.at(-1)) > 0.45) R.push(near.x);
            if (R.length > 6) R.shift();
            R.forEach((x, i) => hoop(x, 0.012 + 0.022 * ((i + 1) / R.length), hue(t * 0.3 + i * 0.11), 0.9));
        } else if (this.rings.length) this.rings = [];

        // The court's edges.
        if (L.wire > 0.01 && hz > 0.5) {
            const w = 0.04 * L.wire, col = trippy ? [0.03, 0.03, 0.03] : [0.6, 0.25, 1], e = trippy ? -1 : 0.55 + this.bass * 0.5;
            for (const y of [-hy, hy]) for (const z of [-hz, hz]) bar(0, y, z, 2 * hx, w, w, col, e);
            hoop(hx, w, col, e);
            hoop(-hx, w, col, e);
        }

        // The tunnel's gates, rushing by.
        if (L.walls > 0.01) {
            const every = 9, off = this.scroll % every;
            for (let i = 0; i < 16; i++) {
                const x = -hx - 9 + i * every - off + every;
                hoop(x, 0.16 * L.walls, (Math.floor(this.scroll / every) + i) % 2 ? ORANGE : CYAN, 1.1 + this.bass, 0.08);
            }
        }

        // Where a ball has just come off a wall.
        for (const r of this.ripples) {
            const k = r.age / 0.5, s = (r.big ? 5 : 1.6) * out(k), w = 0.05 * (1 - k), col = r.big ? YELLOW : CYAN;
            if (r.axis === 'y') {
                for (const d of [-1, 1]) { bar(r.x + d * s / 2, r.y, r.z, w, w, s, col, 1); bar(r.x, r.y, r.z + d * s / 2, s, w, w, col, 1); }
            } else if (r.axis === 'z') {
                for (const d of [-1, 1]) { bar(r.x + d * s / 2, r.y, r.z, w, s, w, col, 1); bar(r.x, r.y + d * s / 2, r.z, s, w, w, col, 1); }
            } else {
                for (const d of [-1, 1]) { bar(r.x, r.y + d * s / 2, r.z, w, w, s, col, 1); bar(r.x, r.y, r.z + d * s / 2, w, s, w, col, 1); }
            }
        }

        // A fireball: white hot in the middle, yellow, then orange, swelling and going out.
        for (const b of this.blasts) {
            if (b.age < 0) continue;
            const k = b.age / 0.9, r = b.size * out(k), a = (1 - k) ** 2 * 1.6;
            G.add(b.x, b.y, b.z, r, ...ORANGE, a);
            G.add(b.x, b.y, b.z, r * 0.7, ...YELLOW, a);
            G.add(b.x, b.y, b.z, r * 0.4, ...WHITE, a);
        }

        for (const p of this.parts) {
            const k = 1 - (p.age / p.life) ** 2, s = p.size * k;
            B.add(p.x, p.y, p.z, s, p.thin ? s * 0.2 : s, s, p.col[0], p.col[1], p.col[2], p.e, p.spin ? axisAngle(p.axis, p.turn) : null);
        }

        // ---------------------------------------------------- the camera

        const [pw, ph] = this.picture;
        const flatFov = 0.2, tanF = Math.tan(flatFov / 2);
        // Flat: the court's height fills the old picture, or most of the window once that's gone.
        const fill = L.outline > 0.5 ? Math.min(0.86, (1.5 * this.aspect) / (hx + 0.2)) : ph;
        const far = 1.5 / (fill * tanF);
        const e = L.view, fov = mix(flatFov, L.fov + L.trip * 0.1 * Math.sin(t * 0.8), e), tanB = Math.tan(L.fov / 2);
        const behind = Math.max((hy * 1.14) / tanB, (hz * 1.08) / (tanB * this.aspect)) - c.inset;
        const radius = mix(far, hx + behind, e), turn = (e * Math.PI) / 2;
        const sway = L.walls * Math.sin(t * 0.9) * 0.1 + L.trip * Math.sin(t * 0.55) * 0.22;
        const eye = [-Math.sin(turn) * radius, e * (0.3 + c.bat.y * 0.12), Math.cos(turn) * radius + e * c.bat.z * 0.14];
        const target = [e * hx * 0.5, e * c.bat.y * 0.04, e * c.bat.z * 0.05];
        const roll = L.roll + sway;

        // The fist.
        let fist = null;
        if (this.fist?.alive && renderer.hasFist) {
            const f = this.fist, s = FIST * f.in, x = f.x + (1 - f.in) * 14 - Math.sin(f.lunge * Math.PI) * 2.8 + Math.sin(t * 2.1) * 0.15;
            const y = f.y + Math.sin(t * 1.7) * 0.1, wob = Math.sin(t * 1.3) * 0.06;
            // Knuckles towards you, thumb underneath.
            const cw = Math.cos(wob), sw = Math.sin(wob);
            fist = {
                model: new Float32Array([0, sw * s, cw * s, 0, -s, 0, 0, 0, 0, -cw * s, sw * s, 0, x, y, f.z, 1]),
                tint: YELLOW, hot: L.hot + f.lunge * 0.25
            };
        }

        const shake = L.shake * 0.012;
        return {
            time: t, eye, target, up: [0, Math.cos(roll), Math.sin(roll) * e], fov,
            sky: [L.night, L.tunnel, L.plasma, L.trip], trip: this.T, bass: this.bass,
            video: this.video && flat ? { el: this.video.el, snow: L.snow, roll: L.tvRoll, gain: 0.85 } : null,
            desk: desky && this.D ? {
                ...this.D, fill, time: t, snow: L.snow, roll: L.tvRoll, r: c.r, score: c.score,
                bat: { x: c.batX, y: c.bat.y, hh: c.bat.hh }, cpu: { x: c.cpuX, y: c.cpu.y, hh: c.cpu.hh, gone: c.cpu.gone },
                balls: c.balls.map(b => [b.x, b.y])
            } : null,
            floor: { y: -hy, a: L.floor, scroll: 0, cell: 1, mirror: 0.34, A: [0.015, 0.015, 0.03], B: [0.95, 0.95 - this.bass * 0.1, 0.97] },
            fog: L.tunnel > 0.5 ? [0, 0.03, 0.07] : [0.42 * L.night, 0.1 * L.night, 0.3 * L.night], fogK: L.tunnel > 0.5 ? 0.02 : 0.016 * L.night,
            walls: { a: L.walls, hy, hz, scroll: this.scroll, pulse: this.bass, x0: -hx - 12, x1: 150, light: ORANGE },
            lit: L.lit, flatGlow: L.glow, boxes: B, balls: S, ghosts: G, fist,
            bloom: L.bloom + this.bass * 0.25 * L.lit, glitch: L.glitch, split: L.split + L.walls * 0.004 + L.trip * 0.004 * (1 + Math.sin(t * 1.3)),
            trail: [L.trail, 1 - 0.02 * L.trail, 0.012 * L.trail, 0.08],
            shake: [Math.sin(t * 91) * shake, Math.sin(t * 77 + 2) * shake],
            box: [mix(1.6, pw, L.box), mix(1.6, ph, L.box), 1, 0.045], back: BACK, lift: L.lift,
            flash: L.flash, invert: L.invert, dim: L.dim,
            cutin: this.cut && { in: this.cut.in, open: this.cut.open, pan: this.cut.pan, jolt: [rand(-1, 1) * 0.012 * this.cut.jolt, rand(-1, 1) * 0.012 * this.cut.jolt] },
            splash: this.splash && { tex: 'fist', zoom: this.splash.zoom, invert: this.splash.invert, white: 0, alpha: 1, jolt: [rand(-1, 1) * 0.008, rand(-1, 1) * 0.008] }
        };
    }

    // A score in blocks. Flat, it's in the picture either side of the net; with three dimensions it stands over
    // the far end, turned to face you.
    number(value, side, slab, th) {
        const c = this.court, L = this.L, p = io(L.pose), text = String(Math.min(value, 99999));
        const cells = text.length * 3 + (text.length - 1);
        // Small enough to fit: multiball's scores run to three figures on both sides.
        const cf = Math.min(0.105, 1.3 / cells), c3 = Math.min(0.26, c.hz > 0.5 ? c.hz / cells : 0.26), cell = mix(cf, c3, p);
        const flatAt = [side < 0 ? -0.5 - cells * cf : 0.5, c.hy - 0.2, 0];
        const top = mix(c.hy + 2.1, c.hy - 0.35, L.walls);
        const deepAt = [c.hx + 2.2, top, side * c.hz * 0.55 - (cells * c3) / 2];
        const at = lerp3(flatAt, deepAt, p), a = (p * Math.PI) / 2;
        const right = [Math.cos(a), 0, Math.sin(a)];
        const rot = p > 0.001 ? [right[0], 0, right[2], 0, 1, 0, -right[2], 0, right[0]] : null;
        const col = side < 0 ? YELLOW : PINK;
        [...text].forEach((ch, n) => {
            const glyph = DIGITS[+ch];
            for (let j = 0; j < 5; j++) {
                for (let i = 0; i < 3; i++) {
                    if (glyph[j * 3 + i] !== '1') continue;
                    const u = (n * 4 + i + 0.5) * cell, v = -(j + 0.5) * cell;
                    slab(at[0] + right[0] * u, at[1] + v, at[2] + right[2] * u, cell * 1.02, cell * 1.02, th, col, 0.8, rot);
                }
            }
        });
    }
}
