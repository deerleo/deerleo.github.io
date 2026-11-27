// The game itself: two bats, a ball, a score. x runs down the court from your bat (-hx) to theirs (+hx), y is up,
// z is across. While hz is 0 the court is flat, as it starts. Nothing here knows what it looks like.

import { clamp, rand } from './m4.js';

// Where a ball at p moving at v ends up after t, bouncing between -lim and lim.
function fold(p, v, t, lim) {
    if (lim <= 0) return 0;
    let q = (p + v * t + lim) % (4 * lim);
    if (q < 0) q += 4 * lim;
    return q < 2 * lim ? q - lim : 3 * lim - q;
}

export class Court {
    constructor() {
        this.hx = 2;
        this.hy = 1.5;
        this.hz = 0;
        this.inset = 0.22;          // how far in from the ends the bats stand
        this.r = 0.04;              // the ball's half size
        this.speed = 3;             // down the court, units a second
        this.swerve = 0.85;         // how much of that a hit off the bat's edge sends sideways
        this.pad = 0.03;            // how far past the bat's edge still counts: a little more than fair
        this.solid = false;         // both ends are walls and every ball stays in play
        this.leak = false;          // ...except that yours lets them through, and each one is a point to them
        this.out = 0.5;             // how far past an end a ball goes before it's gone
        this.bat = { y: 0, z: 0, hh: 0.22, hw: 0.3 };
        this.cpu = { y: 0, z: 0, hh: 0.22, hw: 0.3, speed: 6, err: 0, ez: 0, chase: 0 };
        this.balls = [];
        this.score = [0, 0];
        this.events = [];
        this.wait = -1;             // seconds until the next serve, when there's one coming
        this.most = 1;
    }

    get batX() { return -this.hx + this.inset; }
    get cpuX() { return this.hx - this.inset; }

    // A new ball from `from` (-1 your end, 0 the middle, 1 theirs) towards `to` (-1 you, 1 them).
    serve(to = -1, from = 0, delay = 0) {
        if (delay > 0) {
            this.wait = delay;
            this.next = [to, from];
            return null;
        }
        this.wait = -1;
        const b = {
            x: from * (this.hx - this.inset - 0.3), y: rand(-0.5, 0.5) * this.hy, z: rand(-0.5, 0.5) * this.hz,
            vx: to * this.speed, vy: rand(-0.35, 0.35) * this.speed, vz: this.hz > 0 ? rand(-0.3, 0.3) * this.speed : 0,
            age: 0, hits: 0
        };
        this.balls.push(b);
        this.events.push({ type: 'serve', ball: b });
        return b;
    }

    clear() {
        this.balls.length = 0;
        this.wait = -1;
    }

    step(dt) {
        const { hx, hy, hz, r } = this;
        if (this.wait > 0 && (this.wait -= dt) <= 0) this.serve(...this.next);

        this.think(dt);

        for (const b of this.balls) {
            const px = b.x;
            b.age += dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.z += b.vz * dt;

            const wy = hy - r, wz = hz - r;
            if (Math.abs(b.y) > wy) {
                const side = Math.sign(b.y);
                b.y = side * (2 * wy - Math.abs(b.y));
                b.vy = -b.vy;
                this.events.push({ type: 'wall', ball: b, axis: 'y', side });
            }
            if (hz <= 0.001) {
                b.z = 0;
                b.vz = 0;
            } else if (Math.abs(b.z) > wz) {
                const side = Math.sign(b.z);
                b.z = side * (2 * wz - Math.abs(b.z));
                b.vz = -b.vz;
                this.events.push({ type: 'wall', ball: b, axis: 'z', side });
            }

            // The bats: the ball has to cross a bat's face this step, with the bat there.
            const mine = this.batX + r, theirs = this.cpuX - r;
            if (b.vx < 0 && px >= mine && b.x < mine && !b.past) {
                if (this.touches(b, this.bat)) this.hit(b, this.bat, 1, mine);
                else b.past = true;
            } else if (b.vx > 0 && px <= theirs && b.x > theirs && !b.past) {
                if (this.cpu.gone) b.past = true;
                else if (this.touches(b, this.cpu)) this.hit(b, this.cpu, -1, theirs);
                else b.past = true;
            }

            if (this.solid) {
                // The ends are walls.
                const side = Math.sign(b.x);
                if (this.leak && side < 0) {
                    if (b.x < -hx - this.out) {
                        b.dead = true;
                        this.score[1]++;
                        this.events.push({ type: 'point', ball: b, who: 1 });
                    }
                } else if (Math.abs(b.x) > hx - r) {
                    b.x = side * (2 * (hx - r) - Math.abs(b.x));
                    b.vx = -b.vx;
                    b.past = false;
                    this.events.push({ type: 'end', ball: b, side });
                }
            } else if (Math.abs(b.x) > hx + this.out) {
                b.dead = true;
                const who = b.x > 0 ? 0 : 1;
                this.score[who]++;
                this.events.push({ type: 'point', ball: b, who });
            }
        }
        if (this.balls.some(b => b.dead)) this.balls = this.balls.filter(b => !b.dead);
    }

    touches(b, bat) {
        const reach = this.r + this.pad;
        if (Math.abs(b.y - bat.y) > bat.hh + reach) return false;
        return this.hz <= 0.001 || Math.abs(b.z - bat.z) <= bat.hw + reach;
    }

    // Off the bat: straight back from its middle, more and more sideways towards its edges.
    hit(b, bat, dir, x) {
        const s = Math.max(this.speed, Math.abs(b.vx));
        const oy = clamp((b.y - bat.y) / (bat.hh + this.r), -1, 1);
        const oz = this.hz > 0.001 ? clamp((b.z - bat.z) / (bat.hw + this.r), -1, 1) : 0;
        b.x = x;
        b.vx = dir * s;
        b.vy = oy * s * this.swerve;
        if (this.hz > 0.001) b.vz = oz * s * this.swerve;
        b.hits++;
        b.past = false;
        const mine = bat === this.bat;
        if (mine) {
            // They misjudge each return by a little. When they're chasing, one off the edge of your bat fools
            // them by a lot: that's how they're beaten.
            const wild = this.cpu.chase ? 0.8 + 2.2 * Math.min(1, Math.hypot(oy, oz)) : 0.75;
            this.cpu.err = rand(-wild, wild);
            this.cpu.ez = rand(-wild, wild);
        }
        this.events.push({ type: 'hit', ball: b, mine, oy });
    }

    // Their bat. Flat, it goes straight for where the nearest ball coming its way will arrive, as fast as it's
    // allowed. With `chase` on it plays more like a person, and can be beaten: it follows the ball about wherever
    // it is, only works out where it's going as it gets close, and a ball sent wide enough gets there first.
    think(dt) {
        const c = this.cpu;
        let best = null, soonest = Infinity;
        for (const b of this.balls) {
            if (b.vx <= 0 || b.past) continue;
            const t = (this.cpuX - b.x) / b.vx;
            if (t >= 0 && t < soonest) { soonest = t; best = b; }
        }
        let ty = 0, tz = 0, pace = best ? 1 : 0.35;
        if (best) {
            ty = fold(best.y, best.vy, soonest, this.hy - this.r) + c.err * c.hh;
            tz = fold(best.z, best.vz, soonest, this.hz - this.r) + c.ez * c.hw;
            if (c.chase) {
                // How sure it is of where the ball's going: not at all at your end, quite sure by three quarters.
                const sure = clamp((best.x + this.hx * c.chase) / this.hx, 0, 1);
                ty = best.y + (ty - best.y) * sure;
                tz = best.z + (tz - best.z) * sure;
            }
        } else if (c.chase && this.balls.length) {
            // Nothing coming: it shadows the ball, most of the way, at a stroll.
            const b = this.balls[0];
            ty = b.y * 0.7;
            tz = b.z * 0.7;
            pace = 0.6;
        }
        const step = c.speed * dt * pace;
        c.y += clamp(ty - c.y, -step, step);
        c.z += clamp(tz - c.z, -step, step);
        c.y = clamp(c.y, -(this.hy - c.hh), this.hy - c.hh);
        c.z = this.hz > 0.001 ? clamp(c.z, -(this.hz - c.hw), this.hz - c.hw) : 0;
    }

    // Your bat goes where it's told, inside the court.
    move(y, z) {
        const b = this.bat;
        b.y = clamp(y, -(this.hy - b.hh), this.hy - b.hh);
        b.z = this.hz > 0.001 ? clamp(z, -Math.max(0, this.hz - b.hw), Math.max(0, this.hz - b.hw)) : 0;
    }
}
