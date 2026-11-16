import { clamp, lerp } from './util.js';

// Arcade handling model. Speeds in m/s, angles in radians.
// Heading psi is measured from +x (east) towards +z (south).
export const CAR = {
  maxSpeed: 60,        // ~216 km/h
  accel: 12.5,
  brake: 27,
  reverseMax: 11,
  wheelbase: 2.64,
  aSteer: 15.0,        // lateral acceleration full steering asks for at speed
  gripRoad: 17.5,      // lateral acceleration the tyres can give on tarmac
  gripOff: 8.5,
  gripHand: 5.5,       // rear tyres with the handbrake on
  radius: 0.95,
  bodyOffsets: [1.35, 0, -1.35],
};

// Maximum steering angle: big at walking pace (tight turns), small at speed.
export function maxSteer(v) {
  return Math.min(0.6, Math.atan((CAR.wheelbase * CAR.aSteer) / Math.max(v * v, 1)));
}

const GEARS = [0, 13, 24, 35, 46, 61];

export class Vehicle {
  constructor(index, name, color, isPlayer) {
    this.index = index;
    this.name = name;
    this.color = color;
    this.isPlayer = isPlayer;
    this.model = null;
    this.driver = null;
    this.place(0, 0, 0);
    this.resetRace();
  }

  place(x, z, psi) {
    this.x = x; this.z = z; this.psi = psi;
    this.prevX = x; this.prevZ = z;
    this.vx = 0; this.vz = 0;
    this.yawRate = 0; this.steer = 0;
    this.speed = 0; this.speedAbs = 0; this.slip = 0;
    this.grip = 1; this.offroad = false; this.impact = 0; this.impactPeak = 0;
    this.throttle = 0; this.braking = 0; this.handbrake = false;
    this.rpm = 0.2; this.gear = 1;
    this.accelLong = 0; this.accelLat = 0;
    this.roll = 0; this.pitch = 0; this.wheelSpin = 0;
  }

  resetRace() {
    this.lapCount = 0;        // times the start line has been crossed
    this.nextCp = 0;
    this.lastCp = -1;
    this.ti = 0;
    this.progress = 0;
    this.lapTimes = [];
    this.lapStart = 0;
    this.finished = false;
    this.finishTime = null;
    this.place_ = 0;
    this.wrongWay = 0;
    this.stuck = 0;
  }

  step(h, inp, env) {
    this.prevX = this.x; this.prevZ = this.z;
    const sp0 = Math.hypot(this.vx, this.vz);

    // --- steering and yaw
    const steerIn = clamp(inp.steer, -1, 1);
    const rate = (steerIn === 0 || steerIn * this.steer < 0) ? 7.5 : 4.4;
    this.steer += clamp(steerIn - this.steer, -rate * h, rate * h);
    let cs = Math.cos(this.psi), sn = Math.sin(this.psi);
    let vf = this.vx * cs + this.vz * sn;
    const hb = inp.handbrake && Math.abs(vf) > 3;
    const delta = this.steer * maxSteer(Math.abs(vf));
    let yawTarget = (vf / CAR.wheelbase) * Math.tan(delta);
    if (hb) yawTarget *= 1.6;
    this.yawRate += (yawTarget - this.yawRate) * Math.min(1, (hb ? 7 : 12) * h);
    this.psi += this.yawRate * h;

    cs = Math.cos(this.psi); sn = Math.sin(this.psi);
    vf = this.vx * cs + this.vz * sn;
    let vl = -this.vx * sn + this.vz * cs;

    // --- surface
    const off = env.surface.roadDist(this.x + cs * 0.5, this.z + sn * 0.5) > 0.9;
    this.offroad = off;

    // --- engine, brakes, drag
    let a = 0;
    const thr = clamp(inp.throttle, 0, 1), brk = clamp(inp.brake, 0, 1);
    if (thr > 0) {
      if (vf > -0.5) a += thr * CAR.accel * (1 - (vf / CAR.maxSpeed) ** 2) * (inp.power || 1);
      else a += thr * CAR.brake;
    }
    if (brk > 0) {
      if (vf > 0.6) a -= brk * CAR.brake;
      else if (vf > -CAR.reverseMax) a -= brk * 7;
    }
    const sgn = vf > 0.05 ? 1 : vf < -0.05 ? -1 : 0;
    a -= vf * 0.012 + sgn * 0.3;
    if (off) a -= vf * 0.36 + sgn * 1.6;
    if (hb) a -= sgn * 7.0;
    const vfNew = vf + a * h;
    vf = (thr === 0 && vf * vfNew < 0) ? 0 : vfNew;       // brakes do not push the car backwards by themselves
    if (thr === 0 && brk === 0 && Math.abs(vf) < 0.25) vf = 0;

    // --- lateral grip: the tyres can only cancel so much sideways speed per second
    this.grip += ((hb ? 0 : 1) - this.grip) * Math.min(1, (hb ? 18 : 3.0) * h);
    const gmax = lerp(CAR.gripHand, off ? CAR.gripOff : CAR.gripRoad, this.grip);
    const dvl = clamp(-vl, -gmax * h, gmax * h);
    vl += dvl;
    this.slip = Math.abs(vl);
    this.accelLat = dvl / h;
    this.accelLong = a;

    this.vx = cs * vf - sn * vl;
    this.vz = sn * vf + cs * vl;
    this.x += this.vx * h;
    this.z += this.vz * h;

    // --- walls, buildings, trees
    let impact = 0;
    const C = env.colliders;
    for (const k of CAR.bodyOffsets) {
      if (!C.resolve(this.x + cs * k, this.z + sn * k, CAR.radius)) continue;
      const hit = C.hit;
      this.x += hit.px; this.z += hit.pz;
      let nx = hit.px, nz = hit.pz;
      const nl = Math.hypot(nx, nz);
      if (nl > 1e-6) { nx /= nl; nz /= nl; } else { nx = hit.nx; nz = hit.nz; }
      const vn = this.vx * nx + this.vz * nz;
      if (vn < 0) {
        this.vx -= 1.18 * vn * nx;
        this.vz -= 1.18 * vn * nz;
        const f = 1 - Math.min(0.35, -vn * 0.025) - 0.003;
        this.vx *= f; this.vz *= f;
        if (-vn > impact) impact = -vn;
      }
      // a touching corner swings the car parallel to the wall, so it slides
      // along instead of grinding to a halt nose-first
      if (k !== 0) {
        const side = cs * k * nz - sn * k * nx;
        const into = -(cs * nx + sn * nz) * Math.sign(k);
        if (into > 0.02) this.psi += Math.sign(side) * Math.min(1, into * 3) * (1.6 + this.speedAbs * 0.12) * h;
      }
      this.yawRate *= 0.92;
    }
    // edge of the mapped area
    const b = env.bounds;
    if (this.x < b[0]) { this.x = b[0]; if (this.vx < 0) this.vx = 0; }
    if (this.x > b[2]) { this.x = b[2]; if (this.vx > 0) this.vx = 0; }
    if (this.z < b[1]) { this.z = b[1]; if (this.vz < 0) this.vz = 0; }
    if (this.z > b[3]) { this.z = b[3]; if (this.vz > 0) this.vz = 0; }

    this.impact = impact;
    if (impact > this.impactPeak) this.impactPeak = impact;
    this.speed = this.vx * Math.cos(this.psi) + this.vz * Math.sin(this.psi);
    this.speedAbs = Math.hypot(this.vx, this.vz);
    this.throttle = thr; this.braking = brk; this.handbrake = hb;
    this.wheelSpin += (this.speed * h) / 0.35;

    // --- engine speed for sound and the gear readout
    const v = Math.abs(this.speed);
    let g = 0;
    while (g < GEARS.length - 2 && v >= GEARS[g + 1]) g++;
    const lo = GEARS[g] * 0.7, hi = GEARS[g + 1];
    const target = clamp(0.24 + 0.76 * ((v - lo) / (hi - lo)) + (thr > 0 && v < 2 ? 0.25 * thr : 0), 0.18, 1.05);
    this.rpm += (target - this.rpm) * Math.min(1, 9 * h);
    this.gear = this.speed < -0.5 ? 0 : g + 1;
    this.decel = (sp0 - this.speedAbs) / h;
  }

  // visual follow-up, once per rendered frame
  syncModel(dt, y) {
    const m = this.model;
    if (!m) return;
    m.group.position.set(this.x, y, this.z);
    m.group.rotation.y = -this.psi;
    const k = Math.min(1, 8 * dt);
    // body leans out of corners, squats under power and dives under braking
    this.roll += (clamp(-this.accelLat * 0.0045, -0.07, 0.07) - this.roll) * k;
    this.pitch += (clamp(this.accelLong * 0.0028, -0.05, 0.05) - this.pitch) * k;
    m.tilt.rotation.x = this.roll;
    m.tilt.rotation.z = this.pitch;
    const st = this.steer * Math.min(0.5, maxSteer(Math.abs(this.speed)) * 1.6 + 0.06);
    m.wheels[0].pivot.rotation.y = -st;
    m.wheels[1].pivot.rotation.y = -st;
    for (const w of m.wheels) w.spin.rotation.z = -this.wheelSpin;
    const on = this.braking > 0.05 || this.handbrake;
    m.brakeMat.color.setRGB(on ? 4.0 : 0.5, on ? 0.25 : 0.05, on ? 0.2 : 0.05);
  }
}

// Car-against-car contact: two circles per car.
export function collideCars(a, b) {
  let hit = 0;
  const ca = Math.cos(a.psi), sa = Math.sin(a.psi), cb = Math.cos(b.psi), sb = Math.sin(b.psi);
  const dx0 = b.x - a.x, dz0 = b.z - a.z;
  if (dx0 * dx0 + dz0 * dz0 > 36) return 0;
  for (const ka of [1.1, -1.1]) {
    for (const kb of [1.1, -1.1]) {
      const ax = a.x + ca * ka, az = a.z + sa * ka, bx = b.x + cb * kb, bz = b.z + sb * kb;
      const dx = bx - ax, dz = bz - az;
      const d2 = dx * dx + dz * dz;
      const R = 1.96;
      if (d2 >= R * R || d2 < 1e-6) continue;
      const d = Math.sqrt(d2), nx = dx / d, nz = dz / d, pen = R - d;
      a.x -= nx * pen * 0.5; a.z -= nz * pen * 0.5;
      b.x += nx * pen * 0.5; b.z += nz * pen * 0.5;
      const vr = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
      if (vr < 0) {
        const j = -1.25 * vr * 0.5;
        a.vx -= j * nx; a.vz -= j * nz;
        b.vx += j * nx; b.vz += j * nz;
        hit = Math.max(hit, -vr);
      }
      a.psi += clamp((ca * ka * -nz - sa * ka * -nx) * pen * 0.08, -0.02, 0.02);
      b.psi += clamp((cb * kb * nz - sb * kb * nx) * pen * 0.08, -0.02, 0.02);
    }
  }
  return hit;
}
