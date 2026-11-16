// The boat: how it moves on the water, and the rig that carries the hull and the rider's eye.
// Forward is the boat's local -Z. Heading is rotation.y, so forward = (-sin h, 0, -cos h).
import * as THREE from 'three';
import { buildBoat } from './boat-hero.js';

export const BOAT = {
  eye: 1.12,              // metres above the water
  seat: 0.45,             // how far behind the boat's centre the rider sits
  radius: 0.95,           // collision radius
  bowReach: 1.85, bowRadius: 0.55,   // a second, smaller circle at the bow, so the nose stays out of banks and solid things
  accel: 1.5,             // m/s^2 at full paddle
  drag: 0.5,              // 1/s: top speed through the water is accel / drag, and a boat left alone loses its way in about 4 s
  hurry: 1.6,             // multiplier with Shift held
  back: 1.2,              // how fast the boat can be backed upstream over the ground, m/s
  turn0: 0.34, turn1: 0.21, // rad/s when still, plus this much per m/s
  slide: 2.6,             // 1/s: how quickly the hull's motion swings round to where the bow points (lower = more slide)
  current: 2.0,           // default pull of the waterway, m/s (the engine passes the realm's)
};

const _loc = {}, _p = {}, _q = {};

export class Boat {
  constructor() {
    this.x = 0; this.z = 0; this.heading = 0;
    this.u = 0;                      // speed through the water along the heading (what the paddle sets)
    this.wx = 0; this.wz = 0;        // velocity through the water: it follows the bow with a little slide
    this.slipX = 0; this.slipZ = 0;  // sideways shove from bumps, decays
    this.yawRate = 0;
    this.s = 0; this.d = 0;          // arc length along the waterway, and offset to the right of its centreline
    this.speed = 0;                  // over the ground
    this.idle = 0;                   // seconds since the rider last touched the controls
    this.bumped = 0;                 // set to the impact strength for one frame when the boat touches something
    this.vx = 0; this.vz = 0;        // velocity over the ground
    this.heave = 0; this.swellPitch = 0;

    this.rig = new THREE.Group();    // position + heading
    this.tilt = new THREE.Group();   // bob, pitch, roll
    this.rig.add(this.tilt);
    this.model = buildBoat();
    this.tilt.add(this.model.group);
    this.eye = new THREE.Group();    // the rider's head
    this.eye.position.set(0, BOAT.eye, BOAT.seat);
    this.tilt.add(this.eye);
    this.motion = 1;                 // 0.25 with reduced motion
    this.t = 0;
  }

  /** Put the boat on a waterway at arc length s, d metres right of the centreline, facing along it (plus `turn` radians). */
  place(path, s, d = 0, turn = 0) {
    const p = path.at(s, _p);
    this.x = p.x + p.rx * d; this.z = p.z + p.rz * d; this.heading = p.heading + turn;
    this.s = s; this.d = d; this.u = 0; this.wx = this.wz = 0; this.slipX = this.slipZ = 0; this.yawRate = 0;
    this.vx = this.vz = 0; this.speed = 0;
    this.sync(0);
  }

  /**
   * @param {number} dt
   * @param {{throttle:number, steer:number, hurry:boolean}} ctl
   * @param {import('./path.js').Waterway} path
   * @param {{current?:number, colliders?:Array<{x:number,z:number,r:number}>, frozen?:boolean, wait?:boolean, heightAt?:(x:number,z:number)=>number}} env
   */
  update(dt, ctl, path, env = {}) {
    this.t += dt; this.bumped = 0;
    const current = env.current ?? BOAT.current;
    const touching = ctl.throttle !== 0 || ctl.steer !== 0;
    this.idle = touching ? 0 : this.idle + dt;

    const loc = path.locate(this.x, this.z, this.s, _loc);
    const fx = -Math.sin(this.heading), fz = -Math.cos(this.heading);
    // --- paddle. Backing water holds the boat against the current and then takes it slowly upstream.
    const accel = BOAT.accel * (ctl.hurry && ctl.throttle > 0 ? BOAT.hurry : 1);
    // (with the rower aboard the boat is driven as her oar drives it: while the blade pushes, and hardly at all while she
    // comes back for the next stroke. The same push on average, so nothing about how the boat handles changes; it gains
    // a little with each push and runs on between them, as a rowed boat does.)
    const rower = this.model && this.model.rower, stroke = rower && rower.effort > 0.05 ? (rower.push ? (rower.force - rower.effort * rower.forceMean) * 1.0 : rower.effort * (Math.abs(Math.cos(rower.phase * Math.PI * 2)) - 0.6366) * 1.1) : 0;
    this.u += (ctl.throttle * accel * (1 + (ctl.throttle > 0 ? stroke : 0)) - BOAT.drag * this.u) * dt;
    this.u = Math.max(this.u, -(current + BOAT.back));
    // --- helm: a boat that is moving answers faster; going astern, the helm is reversed
    const astern = this.wx * fx + this.wz * fz < -0.15;
    const want = -ctl.steer * (BOAT.turn0 + BOAT.turn1 * Math.min(3.2, Math.abs(this.u) + current * 0.6)) * (astern ? -1 : 1);
    this.yawRate += (want - this.yawRate) * (1 - Math.exp(-dt * 4.5));
    // hands off: the current slowly swings the bow downstream, so the ride follows the bends by itself
    if (this.idle > 1.2 && current > 0.05) {
      const target = Math.atan2(-loc.tx, -loc.tz);
      let diff = (target - this.heading) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2; if (diff < -Math.PI) diff += Math.PI * 2;
      const ease = Math.min(1, (this.idle - 1.2) / 2.5);
      this.yawRate += (diff * 0.55 * ease - this.yawRate) * (1 - Math.exp(-dt * 2.0)) * ease;
    }
    // paddled, not steered, and going nowhere (the bow on a wall, a gate leaf, a post the slide could not clear): the bow
    // is eased toward the route some way ahead, as the current would ease a boat left alone, until the boat is under way
    // again. A rider who only ever holds the paddle down is never left on an obstacle (9 November: held forward, the
    // boat sat on the orchard's gate for three minutes). It gives way at once to the helm, and never comes to a boat
    // that is moving, so the water stays free to roam. Once it has taken the bow it keeps it until the boat is under way
    // along the route again (a rider who holds only the paddle would otherwise be put across the channel and left).
    this.unsteered = Math.abs(ctl.steer) > 0.05 ? 0 : (this.unsteered || 0) + dt;
    const pressing = ctl.throttle > 0.3 && this.unsteered > 0.4 && !env.frozen;
    // (how far the boat has really come in the last second or so, whatever moved it or put it back: an area may
    // carry a boat out of its own walls after this function has moved it, and the speed worked out here does not know)
    // (and how far it would have come with nothing in its way: its own way and the current, summed below. A boat that is
    // held makes far less than that; a boat that is merely slow, turning to go upstream say, makes all of it.)
    if (!pressing || this.markT === undefined) { this.markT = 0; this.markX = this.x; this.markZ = this.z; this.wantX = 0; this.wantZ = 0; this.going = 9; this.free = 9; this.stuck = 0; this.helped = false; }
    else if ((this.markT += dt) >= 0.8) {
      this.going = Math.hypot(this.x - this.markX, this.z - this.markZ) / this.markT; this.free = Math.hypot(this.wantX, this.wantZ) / this.markT;
      this.markT = 0; this.markX = this.x; this.markZ = this.z; this.wantX = 0; this.wantZ = 0;
    }
    if (pressing) {
      // held: stopped where it should be moving, or rubbing along something at a fraction of its way (the orchard's
      // soft edge let a boat paddled at it creep along at 0.8 m/s for as long as the paddle was down)
      // (in still water a boat pressed square on a thing is left with under a metre a second of way: that is held too)
      const held = this.going < 0.6 ? this.free > 0.5 : (this.free > 1.5 && this.going < 0.4 * this.free);
      if (held) this.stuck = (this.stuck || 0) + dt; else if (this.going > 1.6 || this.going > 0.7 * this.free) this.stuck = Math.max(0, (this.stuck || 0) - dt * 3);
      if (this.stuck > 1.0 && !this.helped) { this.helped = true; this.touchT = undefined; }      // (helped off: downstream, whatever way it had been glancing)
    }
    if (this.helped) {
      // toward the middle of the route 14 m ahead; if that has not freed it in a second more (a wall right across its
      // way to there: the sky's dyke), toward the middle of the route hardly ahead at all: along the wall, to its end
      // (at a solid thing: along its side, the way the hull is sliding round it, so the helm and the slide pull one way)
      const at = this.touchT !== undefined && this.t - this.touchT < 0.5;
      const a = path.at(Math.min(path.length, loc.s + (this.stuck > 2.0 ? 3 : 14)), _p), dx = at ? this.touchX : a.x - this.x, dz = at ? this.touchZ : a.z - this.z;
      if (at || dx * dx + dz * dz > 1) {
        let diff = (Math.atan2(-dx, -dz) - this.heading) % (Math.PI * 2);
        if (diff > Math.PI) diff -= Math.PI * 2; if (diff < -Math.PI) diff += Math.PI * 2;
        // (nearly a half turn: the bow comes round through downstream, not through upstream)
        if (Math.abs(diff) > 2.4) {
          let down = (Math.atan2(-loc.tx, -loc.tz) - this.heading) % (Math.PI * 2);
          if (down > Math.PI) down -= Math.PI * 2; if (down < -Math.PI) down += Math.PI * 2;
          if (Math.abs(down) > 0.1 && Math.sign(down) !== Math.sign(diff)) diff += Math.sign(down) * Math.PI * 2;
        }
        const reach = BOAT.turn0 + BOAT.turn1 * 2.2, aim = Math.max(-reach, Math.min(reach, diff * 1.4));
        this.yawRate += (aim - this.yawRate) * (1 - Math.exp(-dt * 4));
      }
      // it is let be again once it is under way and pointing along the route
      let off = (Math.atan2(-loc.tx, -loc.tz) - this.heading) % (Math.PI * 2);
      if (off > Math.PI) off -= Math.PI * 2; if (off < -Math.PI) off += Math.PI * 2;
      if (this.going > 1.6 && Math.abs(off) < 0.44 && this.stuck < 0.5) this.helped = false;
    }
    this.heading += this.yawRate * dt;

    // --- the hull has weight: its motion through the water swings round to the bow with a little slide
    const kS = 1 - Math.exp(-dt * BOAT.slide);
    this.wx += (fx * this.u - this.wx) * kS; this.wz += (fz * this.u - this.wz) * kS;
    // --- the water's own motion: along the channel, and a faint drift back toward the middle near the edges
    const edge = Math.max(0, Math.abs(loc.d) / Math.max(1, loc.halfWidth) - 0.62) / 0.38;
    const inward = -Math.sign(loc.d) * edge * edge * (0.5 + current * 0.5) * (this.idle > 0.6 ? 1 : 0.35);
    const cx = loc.tx * current + loc.rx * inward, cz = loc.tz * current + loc.rz * inward;
    const k = Math.exp(-dt * 2.2); this.slipX *= k; this.slipZ *= k;
    let vx = this.wx + cx + this.slipX, vz = this.wz + cz + this.slipZ;
    if (this.wantX !== undefined) { this.wantX += (this.wx + cx) * dt; this.wantZ += (this.wz + cz) * dt; }
    // ends that cannot be passed: the water stills and leans the boat gently back
    if (path.endStop || path.startStop) {
      const along = vx * loc.tx + vz * loc.tz, room = path.endStop ? path.length - 6 - loc.s : Infinity, roomBack = path.startStop ? loc.s - 3 : Infinity;
      if (room < 24 && along > 0) { const k2 = Math.max(0, Math.min(1, room / 24)); vx -= loc.tx * along * (1 - k2); vz -= loc.tz * along * (1 - k2); }
      if (roomBack < 6 && along < 0) { const k2 = Math.max(0, Math.min(1, roomBack / 6)); vx -= loc.tx * along * (1 - k2); vz -= loc.tz * along * (1 - k2); }
    }
    // the area ahead is not ready to be shown yet: the water stills over the last metres of this one, so that the boat
    // comes to the end of the mist slowly instead of being stopped dead in it (it still creeps on: if it does reach
    // the end before the area is ready, the realm manager holds it there)
    if (env.wait) {
      const along = vx * loc.tx + vz * loc.tz, room = path.length - loc.s;
      if (room < 22 && along > 0) { const k2 = Math.max(0.12, Math.min(1, room / 22)); vx -= loc.tx * along * (1 - k2); vz -= loc.tz * along * (1 - k2); }
    }
    if (env.frozen) { vx = 0; vz = 0; }
    let nx = this.x + vx * dt, nz = this.z + vz * dt;

    // --- keep inside the channel
    const l2 = path.locate(nx, nz, loc.s, _loc);
    const limit = Math.max(0.5, l2.halfWidth - BOAT.radius);
    if (Math.abs(l2.d) > limit) {
      const over = Math.abs(l2.d) - limit, side = Math.sign(l2.d);
      if (path.softEdges) {            // open water: no wall, the current just leans on the boat
        const push = Math.min(3, over * 0.6);
        this.slipX -= l2.rx * side * push * dt * 2; this.slipZ -= l2.rz * side * push * dt * 2;
      } else {
        nx -= l2.rx * side * over; nz -= l2.rz * side * over;
        const out = (vx * l2.rx + vz * l2.rz) * side;            // speed into the bank
        if (out > 0) {
          this.slipX -= l2.rx * side * out * 0.6; this.slipZ -= l2.rz * side * out * 0.6;
          this.u *= Math.exp(-dt * 1.2);
          if (out > 0.5) this.bumped = Math.min(1, out / 3);
          // swing the leading end away from the bank a little, so a glancing touch slides along it (bow or stern first)
          const lead = (fx * l2.tx + fz * l2.tz > 0 ? 1 : -1) * (this.u < 0 ? -1 : 1);
          this.yawRate += side * lead * Math.min(0.8, out) * 0.25;
        }
      }
    }
    // Which way round a solid thing the boat goes, 1 or -1 along (-uz, ux), where (ux, uz) points from the thing to the
    // boat. One rule for the hull's slide, the bow's swing and the unsteered boat's helm, so that they never pull two
    // ways (9 November: they did, and a boat nobody steered sat ten seconds on a lone trunk):
    //   - the way asked for: the way the boat already glances, or downstream if it met the thing squarely; for a boat
    //     that is being helped off (nobody steering, going nowhere), always downstream: the way it glances may be the
    //     way back up the current, where it would lie for good (the snow's trunk at s 203);
    //   - the same way as a moment ago, while the boat is still at the thing;
    //   - things too close together for the hull to pass between them are one thing (a wall is a row of circles, a
    //     stile three posts): the boat goes round the nearer end of the whole of it, if one end is clearly the nearer,
    //     and never round an end that lies outside the channel.
    const cluster = (c) => {                            // every solid thing joined to c by gaps the hull cannot pass (kept on c: the things do not move)
      const all = env.colliders;
      if (c._cl && c._cl.n === all.length) return c._cl.list;
      const list = [c];
      for (let i = 0; i < list.length && list.length < 48; i++) {
        const a = list[i];
        for (const b of all) {
          if (b.soft || list.includes(b)) continue;
          const lx = b.x - a.x, lz = b.z - a.z, reach = a.r + b.r + 2 * BOAT.radius - 0.05;
          if (lx * lx + lz * lz < reach * reach) list.push(b);
        }
      }
      c._cl = { n: all.length, list };
      return list;
    };
    const roundWay = (c, ux, uz, prefer) => {
      if (this.helped) prefer = loc.tx * -uz + loc.tz * ux;
      const fresh = this.touchT !== undefined && this.t - this.touchT < 0.6, kept = fresh ? this.touchX * -uz + this.touchZ * ux : 0;
      let way = (Math.abs(kept) > 0.2 ? kept : prefer) >= 0 ? 1 : -1;
      const list = cluster(c);
      if (list.length > 1) {
        // how far the whole of it reaches each way along the boat's side of it, from c's middle; and is that end in the channel?
        const tx = -uz, tz = ux, reach = [0, 0], shut = [false, false];
        for (const m of list) { const a = (m.x - c.x) * tx + (m.z - c.z) * tz; reach[0] = Math.max(reach[0], a + m.r); reach[1] = Math.max(reach[1], -a + m.r); }
        for (let k = 0; k < 2; k++) {
          const sgn = k === 0 ? 1 : -1, e = reach[k] + BOAT.radius, q = path.locate(c.x + tx * sgn * e, c.z + tz * sgn * e, null, _q);
          shut[k] = Math.abs(q.d) > q.halfWidth - 0.3;
        }
        if (shut[0] !== shut[1]) way = shut[0] ? -1 : 1;
        else if (Math.abs(reach[0] - reach[1]) > 0.6 && !(Math.abs(kept) > 0.2)) way = reach[0] < reach[1] ? 1 : -1;
      } else if (!path.softEdges) {
        const q = path.locate(c.x, c.z, null, _q), side = (-uz * l2.rx + ux * l2.rz) * way >= 0 ? 1 : -1, room = (kk) => q.halfWidth - kk * q.d - c.r;
        if (room(side) < 2 * BOAT.radius + 0.4 && room(-side) > room(side)) way = -way;
      }
      return way;
    };
    const touched = (tx, tz) => { this.touchX = tx; this.touchZ = tz; this.touchT = this.t; };
    let hitA = null, hitB = null;                       // the solid things the hull touches this frame (the first two)
    if (env.colliders) for (const c of env.colliders) {
      const dx = nx - c.x, dz = nz - c.z, dist = Math.hypot(dx, dz), min = c.r + BOAT.radius;
      if (c.soft) {                    // shallows, weed, a current's lee: no wall; the water slows the boat and eases it back out
        if (dist < min && dist > 1e-4) {
          const depth = 1 - dist / min, k = c.soft === true ? 1 : c.soft;       // 0 at the rim, 1 in the middle
          this.slipX += dx / dist * depth * k * 6 * dt; this.slipZ += dz / dist * depth * k * 6 * dt;
          this.u *= Math.exp(-dt * 1.2 * depth * k);
        }
        continue;
      }
      if (dist < min && dist > 1e-4) {
        const ux = dx / dist, uz = dz / dist, into = -(vx * ux + vz * uz);
        if (!hitA) hitA = c; else if (!hitB) hitB = c;
        nx = c.x + ux * min; nz = c.z + uz * min;
        // (what the boat loses is the way it was making INTO the thing: square on, as before; sliding along it, next to
        // nothing. Before 9 November a boat lying on a wall in a current lost its way whichever way it pointed, and an
        // unsteered boat took ten seconds to slide five metres to the wall's end.)
        if (into > 0) { const sq = Math.max(0, Math.min(1, -(this.wx * ux + this.wz * uz) / Math.max(0.3, Math.abs(this.u)))); this.slipX += ux * into * 0.7; this.slipZ += uz * into * 0.7; this.u *= Math.exp(-dt * 1.5 * sq); if (into > 0.5) this.bumped = Math.max(this.bumped, Math.min(1, into / 3)); }
        // the current presses the boat against the thing: let it slide round, the way it is already going, and never
        // into a gap between the thing and the bank that the boat cannot pass
        const press = env.frozen ? 0 : -(cx * ux + cz * uz);
        const round = (prefer) => roundWay(c, ux, uz, prefer);
        if (press > 0) {
          const way = round(cx * -uz + cz * ux);
          nx += -uz * way * press * dt; nz += ux * way * press * dt;
        }
        // The paddle presses the boat against it too. A boat driven at a post dead centre used to stay on it for good
        // (found on 9 November by holding the paddle down and nothing else: the orchard's s 221, the sky's s 148): it
        // slides round it, the way it is already glancing, or downstream if it met it squarely, and its bow swings
        // that way.
        const own = env.frozen ? 0 : -(this.wx * ux + this.wz * uz);
        if (own > 0.05) {
          const glance = fx * -uz + fz * ux;             // how far the bow already points along the thing's side
          const way = round(Math.abs(glance) > 0.12 ? glance : loc.tx * -uz + loc.tz * ux);
          const tx = -uz * way, tz = ux * way, k = Math.min(1.5, own);
          nx += tx * k * 0.8 * dt; nz += tz * k * 0.8 * dt;
          this.yawRate += Math.sign(fz * tx - fx * tz) * k * 2.4 * dt;
          touched(tx, tz);
        }
      }
    }
    // A row of solid things too close together for the hull to pass between them is a wall (the sky's dyke is fourteen
    // circles in a line), and a wall made of circles has a hollow between each two. A boat that the current presses on
    // such a wall slides down the flank of the circle it touches into the hollow, and its own way cannot bring it up
    // the next flank: it sat there for good (9 November, found by holding the paddle down along the dyke). So wherever
    // the hull touches one of a pair it is kept out on the straight line across their two rims: a row of circles has a
    // straight face, along which the boat slides freely. (Eased, six centimetres a frame: never a jump.)
    if (hitA) {
      for (const a of (hitB ? [hitA, hitB] : [hitA])) for (const b of env.colliders) {
        if (b === a || b.soft) continue;
        const lx = b.x - a.x, lz = b.z - a.z, L2 = lx * lx + lz * lz, reach = a.r + b.r + 2 * BOAT.radius - 0.05;
        if (L2 > reach * reach || L2 < 1e-6) continue;
        const t = ((nx - a.x) * lx + (nz - a.z) * lz) / L2;
        if (t <= 0 || t >= 1) continue;                  // not abreast of the stretch between the two
        const L = Math.sqrt(L2);
        let px = -lz / L, pz = lx / L;
        const side = (nx - a.x) * px + (nz - a.z) * pz;
        if (side < 0) { px = -px; pz = -pz; }
        const rim = a.r + (b.r - a.r) * t + BOAT.radius, off = Math.abs(side);
        if (off < rim) { const out = Math.min(rim - off, 0.06); nx += px * out; nz += pz * out; }
      }
    }
    // --- the bow reaches 2.4 m ahead of the middle: keep its tip out of banks and solid things as well, and let it swing off them
    if (!env.frozen) {
      const bx = nx + fx * BOAT.bowReach, bz = nz + fz * BOAT.bowReach;
      if (!path.softEdges) {
        const lb = path.locate(bx, bz, l2.s, _q), lim = Math.max(0.5, lb.halfWidth - BOAT.bowRadius);
        if (Math.abs(lb.d) > lim) {
          const over = Math.min(1.5, Math.abs(lb.d) - lim), side = Math.sign(lb.d), wx = -lb.rx * side, wz = -lb.rz * side;
          nx += wx * over * 0.5; nz += wz * over * 0.5;
          // (met squarely the bow has no side to swing to by itself: it swings downstream)
          const cr = fz * wx - fx * wz;
          this.yawRate += (Math.abs(cr) > 0.15 ? Math.sign(cr) : Math.sign(fz * lb.tx - fx * lb.tz) || 1) * over * 2.2 * dt * 8;
          if ((vx * -wx + vz * -wz) > 0.6) this.bumped = Math.max(this.bumped, 0.3);
        }
      }
      if (env.colliders) for (const c of env.colliders) {
        if (c.soft) continue;
        const dx = bx - c.x, dz = bz - c.z, dist = Math.hypot(dx, dz), min = c.r + BOAT.bowRadius;
        if (dist < min && dist > 1e-4) {
          const ux = dx / dist, uz = dz / dist, over = Math.min(1.5, min - dist);
          nx += ux * over * 0.6; nz += uz * over * 0.6;
          // (it swings off the thing the way the hull would slide round it: roundWay, above)
          const glance = fx * -uz + fz * ux, way = roundWay(c, ux, uz, Math.abs(glance) > 0.15 ? glance : loc.tx * -uz + loc.tz * ux), tx = -uz * way, tz = ux * way;
          this.yawRate += (Math.sign(fz * tx - fx * tz) || 1) * over * 2.2 * dt * 8;
          if (this.wx * ux + this.wz * uz < -0.05) touched(tx, tz);
          const into = -(vx * ux + vz * uz);
          if (into > 0) { this.u *= Math.exp(-dt * 1.5); if (into > 0.6) this.bumped = Math.max(this.bumped, Math.min(1, into / 3)); }
        }
      }
    }
    this.vx = (nx - this.x) / Math.max(dt, 1e-5); this.vz = (nz - this.z) / Math.max(dt, 1e-5);
    this.speed = Math.hypot(this.vx, this.vz);
    this.x = nx; this.z = nz;
    const l3 = path.locate(this.x, this.z, loc.s, _loc);
    this.s = l3.s; this.d = l3.d;
    // --- swell: ride the water's own height (zero everywhere except where a realm raises a sea)
    if (env.heightAt) {
      const fx2 = -Math.sin(this.heading), fz2 = -Math.cos(this.heading);
      const hc = env.heightAt(this.x, this.z), hb = env.heightAt(this.x + fx2 * 1.6, this.z + fz2 * 1.6), ha = env.heightAt(this.x - fx2 * 1.4, this.z - fz2 * 1.4);
      this.heave = Number.isFinite(hc) ? hc : 0;
      const slope = Number.isFinite(hb - ha) ? Math.atan2(hb - ha, 3.0) : 0;
      this.swellPitch = Math.max(-0.052, Math.min(0.052, slope));       // capped at 3 degrees
    } else { this.heave = 0; this.swellPitch = 0; }
    this.sync(dt, ctl);
  }

  /** Update the scene objects from the state: bob, lean, lantern flicker. */
  sync(dt, ctl = { throttle: 0, steer: 0 }) {
    const t = this.t, m = this.motion;
    this.rig.position.set(this.x, 0, this.z);
    // The hull answers the rower (9 November). Her oar is out to starboard: each push swings the bow a little to port
    // (two thirds of a degree) and it comes back as she does; the oar bearing down on its crutch heels the boat a touch
    // to that side; and the bow lifts a touch into each push. All of it follows how hard the blade is pushing at this
    // moment (rower.js: force, run), and is scaled by the rider's motion setting. (For the old sculling model, kept in
    // .shots as a fallback: the wag of a sculled boat, as before.)
    const rw = this.model && this.model.rower, work = rw ? rw.effort : 0, ph = rw ? rw.phase * Math.PI * 2 : 0, push = !!(rw && rw.push);
    const force = push ? rw.force : 0, run = push ? rw.run : 0;
    this.rig.rotation.y = this.heading + (push ? 0.012 * run : -work * 0.012 * Math.cos(ph - 0.35)) * m;
    const bob = (Math.sin(t * 1.05) * 0.018 + Math.sin(t * 1.63 + 1.3) * 0.010) * m + this.heave * (0.3 + 0.7 * m);
    const pitch = (Math.sin(t * 0.83 + 0.4) * 0.008 - ctl.throttle * 0.010 * Math.min(1, Math.abs(this.u) * 0.5 + 0.4) + this.swellPitch - (push ? 0.007 * force : work * 0.005 * (0.5 - 0.5 * Math.cos(2 * ph + 0.5)))) * m;
    // the horizon stays level within about a degree and a half; a hard turn must not dip the floor under the water
    const roll = (Math.sin(t * 1.27 + 2.1) * 0.010 + Math.max(-0.016, Math.min(0.016, this.yawRate * 0.05)) + (push ? -0.011 * force : work * 0.016 * Math.sin(ph + 0.32))) * m;
    const f = dt > 0 ? 1 - Math.exp(-dt * 5) : 1;
    this.tilt.position.y += (bob - this.tilt.position.y) * f;
    this.tilt.rotation.x += (pitch - this.tilt.rotation.x) * f;
    this.tilt.rotation.z += (roll - this.tilt.rotation.z) * f;
    this.model.way = this.u;                                        // the rower sculls to this (boat-hero.js, rower.js)
    this.model.update(t, m);
  }

  /** Bow position on the water, for the wake. */
  bow(target = new THREE.Vector3()) {
    return target.set(this.x - Math.sin(this.heading) * 2.25, 0, this.z - Math.cos(this.heading) * 2.25);
  }
}

let _disc = null;
/** A soft radial gradient texture shared by glows. */
export function softDisc() {
  if (_disc) return _disc;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.18, 'rgba(255,255,255,0.62)'); grad.addColorStop(0.45, 'rgba(255,255,255,0.18)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  _disc = new THREE.CanvasTexture(c); _disc.colorSpace = THREE.SRGBColorSpace; _disc.userData.shared = true;
  return _disc;
}
