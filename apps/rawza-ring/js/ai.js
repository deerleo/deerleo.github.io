import { clamp, wrapAngle } from './util.js';
import { CAR, maxSteer } from './vehicle.js';

// Computer driver: follows the racing line with pure-pursuit steering, obeys a
// speed profile that brakes for corners, and moves off-line to pass slower cars.
export class AIDriver {
  constructor(car, track, opts = {}) {
    this.car = car;
    this.track = track;
    this.skill = opts.skill ?? 1;
    this.lane = opts.lane ?? 0;          // habitual offset from the racing line (m, + = right)
    this.react = opts.react ?? 0.2;      // start reaction time (s)
    this.profile = track.speedProfile(12.8 * this.skill, CAR.maxSpeed * (0.93 + 0.06 * this.skill), 15);
    this.avoid = 0;
    this.stuckT = 0;
    this.troubleT = 0;
    this.reverseT = 0;
    this.wantsReset = false;
    this.out = { throttle: 0, brake: 0, steer: 0, handbrake: false, power: 1 };
  }

  control(h, cars, raceTime, leaderBias = 0) {
    const c = this.car, t = this.track, o = this.out;
    o.power = 1;
    if (raceTime < this.react) { o.throttle = 0; o.brake = 0; o.steer = 0; return o; }
    const v = Math.max(0, c.speed);
    const cs = Math.cos(c.psi), sn = Math.sin(c.psi);

    // --- traffic: look for a car just ahead, slide sideways to go round it
    let want = 0, capSpeed = Infinity;
    for (const other of cars) {
      if (other === c) continue;
      const rx = other.x - c.x, rz = other.z - c.z;
      const ahead = rx * cs + rz * sn, side = -rx * sn + rz * cs;
      if (ahead > 0.5 && ahead < 7 + v * 0.45 && Math.abs(side) < 2.6) {
        if (other.speedAbs < v + 2) want = side > 0 ? -2.7 : 2.7;
        if (ahead < 5.5 && Math.abs(side) < 1.7) capSpeed = Math.min(capSpeed, other.speedAbs + 0.5);
      } else if (Math.abs(ahead) < 4.6 && Math.abs(side) < 2.9) {
        want = side > 0 ? -1.2 : 1.2;       // alongside: leave room
      }
    }
    this.avoid += clamp(want - this.avoid, -5 * h, 5 * h);

    // --- steering: aim at a point on the line some way ahead
    const look = 6.5 + v * 0.3;
    const j = t.wrap(c.ti + Math.ceil(look / t.step));
    const rnx = -t.tz[j], rnz = t.tx[j];
    let off = (t.lx[j] - t.cx[j]) * rnx + (t.lz[j] - t.cz[j]) * rnz + this.lane + this.avoid;
    const lim = Math.max(0.5, t.hw[j] - 1.6);
    off = clamp(off, -lim, lim);
    const tx = t.cx[j] + rnx * off - c.x, tz = t.cz[j] + rnz * off - c.z;
    const lx = tx * cs + tz * sn, ly = -tx * sn + tz * cs;
    const d2 = lx * lx + ly * ly;
    let steer;
    if (lx < 0.5) steer = ly > 0 ? 1 : -1;       // target behind us: turn hard towards it
    else steer = Math.atan((2 * CAR.wheelbase * ly) / d2) / maxSteer(v);
    o.steer = clamp(steer, -1, 1);

    // --- speed
    const ahead = t.wrap(c.ti + Math.round((v * 0.12) / t.step));
    let vt = this.profile[ahead] * (1 + leaderBias);
    vt = Math.min(vt, capSpeed);
    // facing the wrong way or far off the line: go gently
    const headErr = Math.abs(wrapAngle(Math.atan2(t.tz[c.ti], t.tx[c.ti]) - c.psi));
    if (headErr > 1.0) vt = Math.min(vt, 9);
    const dv = vt - v;
    if (dv > 0) { o.throttle = clamp(0.3 + dv * 0.5, 0, 1); o.brake = 0; }
    else if (dv > -1.2) { o.throttle = 0.12; o.brake = 0; }
    else { o.throttle = 0; o.brake = clamp(-dv * 0.2, 0, 1); }
    o.handbrake = false;

    // --- unstick: back off a wall, and as a last resort ask for a reset
    if (c.speedAbs < 1.2) this.stuckT += h; else this.stuckT = Math.max(0, this.stuckT - h * 2);
    if (c.speedAbs < 3) this.troubleT += h; else if (c.speedAbs > 6) this.troubleT = 0;
    if (this.reverseT > 0) {
      this.reverseT -= h;
      o.throttle = 0; o.brake = 1; o.steer = -o.steer;
    } else if (this.stuckT > 1.6) {
      this.reverseT = 1.1;
      this.stuckT = 0;
    }
    this.wantsReset = this.troubleT > 7;
    return o;
  }
}
