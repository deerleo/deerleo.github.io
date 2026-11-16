// snow: the cast, group "Ice" (stage 3; docs/build/snow/3-cast-ice.md). The frozen flood itself: the pans turning in
// the black road, the rings from the other evening, the far veils drifting, the ice song, the ticking skin.
//
//   11 Pancake pans        the Margins group's 72 (shared.margins.pans: pan_A..C, still) are bodies now: the life
//                          toolkit's drifters (circles that the current carries, that turn once in 20 to 60 s, nudge
//                          one another, knock on trunks and are pushed aside by the hull) move them, and this module
//                          keeps them on open water (plan.openHalf, plan.pondOpen), out of the bay and 9.5 m clear of
//                          the islet. They ride the wake by the set's own float extension. WINTER (the set's layer).
//   16 Rings from the other evening   one ring 0.6 m across every 9 to 14 s on open water 8 to 20 m ahead, with nothing
//                          above it; from the plain until the water lets go (shared.memory.amount)
//   18 Snow veils          the set's six curtains (shared.veils): their pattern is carried along the sheets at 0.5 m/s
//                          (half that with reduced motion)
//   20 The ice song        three hairlines of bark plum that run across the snow at 100 m/s and stay: across the left
//                          plain (260 m, by itself when the boat reaches s 62), and north and south out of the pond down
//                          two cross aisles (the staging's, during the fall; by themselves a few seconds into the fall
//                          until the staging takes them). The life toolkit's hairlines, ink not light, WINTER.
//                          thaw(): plates of broken skin ice along both margins that run with the boat.
//    4 Skin ice            the water's own skin breaks, parts and closes (the realm's water); here: a tick and a small
//                          ring for every plate the bow breaks (a callback: the sound is the staging's)
//   24 Ice fog             stands in set.js (shared.iceFog): nothing is done to it here
//
// WHAT THIS MODULE LEAVES ON shared.cast (for the staging; all of it also under shared.cast.ice):
//   song('plain' | 'north' | 'south', { settled })   a crack runs (settled: true = it lies there already, no show)
//   thaw({ settled })                                the margins' skin breaks into plates that run with the boat
//   ice.onKnock(x, z, strength, what)   a pan knocks ('hull' | 'other' | 'post');   ice.onRing(x, z)   a ring from below
//   ice.onSong(which, from, to, seconds)   a crack begins (its falling note);        ice.onTick(x, z, speed)  the bow breaks a plate
//   ice.auto = { pans, rings, veils, song, ticks }     what the cast does by itself: set one false to take it into a cue
//   ice.pans (the drifters: .things.bodies, .things.nudge(i, vx, vz)), ice.lines (the hairlines), ice.plates
// Developer switch: &ice=name:seconds,...   plain, north, south, thaw, ring at that second of the realm's clock.
import * as THREE from 'three';
import { makeDrifters } from '../../engine/life/floaters.js';
import { makeHairlines } from '../../engine/life/ribbons.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const Q = new URLSearchParams(location.search);

export async function build(ctx, plan, shared) {
  const cast = shared.cast = shared.cast || {};
  const C = plan.chip, here = shared.here || { s: 0, d: 0 }, memory = shared.memory || { amount: 1 };
  const seen = shared.seen || ((c) => new THREE.Color(c));
  const calm = !!ctx.reducedMotion, rnd = ctx.rng(811), boat = ctx.boat, stage = ctx.stage;
  const ice = cast.ice = { auto: { pans: true, rings: true, veils: true, song: true, ticks: true }, onKnock: null, onRing: null, onSong: null, onTick: null };
  const piece = (name, fn) => { try { return fn(); } catch (err) { console.error(`INVALID_CAST snow/ice: ${name} was left out (${(err && err.message) || err})`); return null; } };
  const tell = (fn, ...args) => { if (typeof fn === 'function') { try { fn(...args); } catch (err) { console.error(err); } } };

  // ---- open water, in the page's frame (s >= 58: x = d, z = -s): the black road about the reference line, and the pond's
  // open disc. Positive: metres of open water round the place; negative: skin ice, or the shelf.
  const PO = plan.pondOpen, TA = plan.tree.at;
  const openRoom = (s, d) => Math.max(plan.openHalf(s) - Math.abs(d), PO.r - Math.hypot(s - PO.at[0], d - PO.at[1]));

  // ================================================================================================ 11: the pans
  let pans = null;
  piece('the pans', () => {
    const P = shared.margins && shared.margins.pans;
    if (!P || !P.items || !P.items.length || !P.set) { console.warn('snow/ice: the pans (shared.margins.pans) are not there: nothing drifts'); return; }
    const posts = (ctx.state.colliders || plan.colliders()).map((c) => ({ x: c.x, z: c.z, r: c.r }));
    // (bodies only: the pieces that are drawn are the Margins group's own models, moved through shared.margins.pans.set)
    const things = makeDrifters(ctx, { drift: 0.32, spin: [20, 60], posts, seed: 817, onKnock: (x, z, strength, what) => tell(ice.onKnock, x, z, strength, what) });
    const proxy = P.items.map((it) => ({ position: { x: it.x, y: 0, z: it.z }, rotation: { y: it.turn || 0 } }));
    P.items.forEach((it, i) => things.attach(proxy[i], { radius: it.radius * 0.96 }));
    P.shoulder = false;                                        // (the kit's plain shouldering stands down)
    // each goes at its own pace with the current: 0.2 to 0.5 m/s (the toolkit gives all of them one)
    // (shared.margins.pans.set(i, x, z, turn) recomputes its whole batch's bounds and colours at every call: seventy-two
    // calls a frame cost 2 to 3 ms here. The pans' own instance matrices are written instead, once a frame for each of
    // the three batches, found by the names the Margins group gives them; `set` is the way if one is not found.)
    const batch = {};
    ctx.group.traverse((o) => { const m = /^pan_([ABC]) x\d+ \(winter\)$/.exec(o.name || ''); if (m) batch[m[1]] = o.children.filter((c) => c.isInstancedMesh); });
    const direct = P.items.every((it) => batch[it.variant] && batch[it.variant].length && Number.isInteger(it.slot));
    pans = { things, items: P.items, set: P.set, batch, direct, pace: P.items.map(() => 0.2 + 0.3 * rnd()), last: P.items.map((it) => [it.x, it.z, it.turn || 0]) };
  });
  const pm = new THREE.Matrix4(), pq = new THREE.Quaternion(), pp = new THREE.Vector3(), ps = new THREE.Vector3(), py = new THREE.Vector3(0, 1, 0);
  const panUpdate = (dt) => {
    if (!pans) return;
    const B = pans.things.bodies, e = 0.3, give = 0.15 * dt + 0.002;
    for (let i = 0; i < B.length; i++) {
      const b = B[i], s = -b.z, d = b.x;
      if (ice.auto.pans) {
        // its own pace: what the toolkit's one current gives is scaled, along the way it is going
        const k = Math.min(1, dt * 0.5) * (pans.pace[i] / 0.32 - 1); b.vx += b.vx * k; b.vz += b.vz * k;
        // slack water before the bay's ice: the current dies there, and no pan comes into the bay
        if (s > 88 && s < 104) { const f = smooth(88, 97, s) * Math.min(1, 3 * dt); b.vx -= b.vx * f; b.vz -= b.vz * f; }
        // on open water only: eased back from the skin ice, and what carried it there is taken off
        const room = openRoom(s, d) - b.r - 0.1;
        if (room < 0) {
          const gs = openRoom(s + e, d) - openRoom(s - e, d), gd = openRoom(s, d + e) - openRoom(s, d - e), gl = Math.hypot(gs, gd) || 1, ns = gs / gl, nd = gd / gl, push = Math.min(-room, give);
          b.x += nd * push; b.z -= ns * push;
          const vn = b.vx * nd - b.vz * ns;
          if (vn < 0) { b.vx -= nd * vn; b.vz += ns * vn; }
        }
        // 9.5 m clear of the islet
        const ri = Math.hypot(s - TA[0], d - TA[1]), need = 9.5 + b.r;
        if (ri < need && ri > 0.01) { const q = Math.min(need - ri, give) / ri; b.x += (d - TA[1]) * q; b.z -= (s - TA[0]) * q; }
      }
      const L = pans.last[i];
      if (Math.abs(b.x - L[0]) > 0.002 || Math.abs(b.z - L[1]) > 0.002 || Math.abs(b.a - L[2]) > 0.002) {
        L[0] = b.x; L[1] = b.z; L[2] = b.a;
        if (!pans.direct) { pans.set(i, b.x, b.z, b.a); continue; }
        const it = pans.items[i]; it.x = b.x; it.z = b.z; it.turn = b.a;
        pm.compose(pp.set(b.x, 0, b.z), pq.setFromAxisAngle(py, b.a), ps.set(it.radius * it.squash, 1, it.radius / it.squash));
        for (const mesh of pans.batch[it.variant]) { mesh.setMatrixAt(it.slot, pm); mesh.instanceMatrix.needsUpdate = true; }
      }
    }
  };

  // ================================================================================================ 16: rings from the other evening
  // A single ring 0.6 m across, as of a carp sipping, on open water 8 to 20 m ahead of the bow, with nothing above it.
  let nextRing = 5 + 4 * rnd();
  const otherEvening = (fixedR = 0, fixedA = 0) => {
    const hx = -Math.sin(boat.heading), hz = -Math.cos(boat.heading);
    for (let tries = 0; tries < 12; tries++) {
      const r = fixedR || 8 + 12 * rnd(), a = fixedR ? fixedA : (rnd() * 2 - 1) * 0.6, ca = Math.cos(a), sa = Math.sin(a), x = boat.x + (hx * ca - hz * sa) * r, z = boat.z + (hz * ca + hx * sa) * r;
      if (z > -plan.straight || openRoom(-z, x) < 0.8 || Math.hypot(-z - TA[0], x - TA[1]) < 9) continue;
      ctx.water.ripple(x, z, 0.7, 0.3);
      tell(ice.onRing, x, z);
      return true;
    }
    return false;
  };

  // ================================================================================================ 20: the ice song
  // A hairline of bark plum that runs across the snow at 100 m/s and stays. Laid on the snow (shared.land.snowHeight);
  // a few short branches leave it as it passes. Ink, not light; winter only.
  const songs = {}, BOW = 14, bowAt = [];
  let lines = null, bowNext = 0;
  piece('the ice song', () => {
    const land = shared.land, rc = ctx.rng(823), list = [];
    const yAt = (s, d) => { const side = d < 0 ? -1 : 1, edge = side < 0 ? plan.shelfLeft(s) : plan.shelfRight(s); return (land && land.snowHeight ? land.snowHeight(d, -s, Math.max(0, Math.abs(d) - edge), side) : 0.35) + 0.12; };
    const path = (s0, d0, s1, d1, wander, step) => {
      const len = Math.hypot(s1 - s0, d1 - d0), n = Math.max(2, Math.round(len / step)), us = (s1 - s0) / len, ud = (d1 - d0) / len, p1 = rc() * 6.28, p2 = rc() * 6.28, pts = [];
      for (let i = 0; i <= n; i++) {
        const f = i / n, env = Math.min(1, 5 * f, 5 * (1 - f)), off = wander * env * (0.6 * Math.sin(f * 7 + p1) + 0.4 * Math.sin(f * 19 + p2)) + (i > 0 && i < n ? (rc() - 0.5) * Math.min(0.9, 0.2 * step) : 0);
        const s = s0 + us * len * f - ud * off, d = d0 + ud * len * f + us * off;
        pts.push([d, yAt(s, d), -s]);
      }
      return { pts, len, s0, d0, us, ud };
    };
    const add = (name, s0, d0, s1, d1, wander, step, width, twigs, reach) => {
      const main = path(s0, d0, s1, d1, wander, step), S = songs[name] = { main: list.length, len: main.len, from: main.pts[0], to: main.pts[main.pts.length - 1], twigs: [], sung: false };
      list.push({ points: main.pts, width, taper: 0.35, shown: false });
      // THE SAME LINE IN SHORT PIECES, for when it lies (critique, 8 November). The toolkit's hairline draws a point that is
      // BEHIND the eye as if it were 12 cm in front of it: a crack's point that happened to lie on the line of sight
      // carried backward (85 m behind the boat, the rider looking a little up) crossed the whole picture as a dark band for
      // a few frames (docs/build/snow/5-critique.md). So once a crack has run, the one long line is put away and these
      // pieces lie in its place, and a piece is drawn only while every point of it is in front of the eye (update).
      S.pieces = [];
      for (let a = 0; a < main.pts.length - 1; a += 3) {
        const b = Math.min(main.pts.length - 1, a + 3), fa = a / (main.pts.length - 1), fb = b / (main.pts.length - 1);
        S.pieces.push({ id: list.length, pts: main.pts.slice(a, b + 1), on: false });
        list.push({ points: main.pts.slice(a, b + 1), width: width * (1 - 0.35 * fa), taper: 1 - (1 - 0.35 * fb) / (1 - 0.35 * fa), shown: false });
      }
      for (let k = 0; k < twigs; k++) {
        const f = 0.12 + 0.76 * (k + rc()) / twigs, at = f * main.len, turn = (rc() < 0.5 ? -1 : 1) * (0.55 + 0.5 * rc()), ca = Math.cos(turn), sa = Math.sin(turn), L = reach * (0.4 + 0.6 * rc());
        const vs = main.us * ca - main.ud * sa, vd = main.ud * ca + main.us * sa;
        const j = Math.min(main.pts.length - 2, Math.floor(f * (main.pts.length - 1))), o = main.pts[j], o2 = main.pts[j + 1], fj = f * (main.pts.length - 1) - j;      // (it leaves the line where the line is)
        const sx = -(o[2] + (o2[2] - o[2]) * fj), dx = o[0] + (o2[0] - o[0]) * fj;
        const tw = path(sx, dx, sx + vs * L, dx + vd * L, 0.03 * L, Math.max(2, L / 4));
        tw.pts[0] = [dx, yAt(sx, dx), -sx];
        S.twigs.push({ id: list.length, at, len: tw.len, pts: tw.pts, on: true });
        list.push({ points: tw.pts, width: width * 0.7, taper: 0.8, shown: false });
      }
    };
    // across the left plain: 260 m, from 170 m out by the far orchard's corner TO the shelf's edge beside the road at s 74.
    // (A crack lying 150 m off and along the route, as first laid, cannot be seen from a boat: the eye is 0.7 m above
    // the plain and the ice fog lies over everything beyond 60 m. It comes out of the fog, under the fence, to the water.)
    add('plain', 285, -170, 74, -13.6, 6, 6, 0.1, 5, 22);
    // out of the pond down two cross aisles (between the ranks at s 180.5 / 189.5 and 189.5 / 198.5), north and south
    add('north', 185, 22.9, 185.6, 150, 1.1, 4, 0.08, 4, 5);
    add('south', 194, -22.7, 193.5, -150, 1.1, 4, 0.08, 4, 5);
    // (and a small pool of short ones for the skin under the bow: page cast 4, "crack lines run 1 to 2 m ahead of the bow")
    for (let k = 0; k < BOW; k++) { bowAt.push(list.length); list.push({ points: [[0, -5, 0], [0, -5, 0.1], [0, -5, 0.2], [0, -5, 0.3]], width: 0.028, taper: 0.6, shown: false }); }
    lines = makeHairlines(ctx, { lines: list, color: seen(C.bark), additive: false, mirror: false, width: 0.085, intensity: 1, minPixels: 1.6 });
    ctx.only(lines.object, 'direct');
    lines.object.name = 'the ice song: three cracks (cast 20, winter)';
  });
  /** A crack runs: 'plain', 'north' or 'south'. { settled: true }: it lies there already. Returns false if it has run or is not there. */
  const song = (which, o = {}) => {
    const S = songs[which]; if (!S || !lines || S.sung) return false;
    S.sung = true;
    if (o.settled) { S.lying = true; for (const t of S.twigs) { t.on = false; } return true; }      // (it lies: its pieces and branches are shown by update(), those in front of the eye)
    const seconds = S.len / 100;
    lines.draw(S.main, seconds);
    for (const t of S.twigs) stage.after(t.at / 100, () => lines.draw(t.id, Math.max(0.08, t.len / 100)));
    stage.after(seconds + 0.4, () => { lines.show(S.main, false); S.lying = true; for (const t of S.twigs) t.on = true; });      // (run: from now on it lies in pieces)
    tell(ice.onSong, which, S.from, S.to, seconds);
    return true;
  };

  // ================================================================================================ 20: the thaw's plates
  // At s 224 the skin ice along both margins breaks into plates that run with the boat: thin plates 0.3 to 1.2 m across,
  // paper and frost, lying on the water from s 222 on, carried down the current a little slower than the hull and
  // turning; the hull's own length of water is left clear. One draw, winter. Nothing is drawn until thaw() is called.
  let plates = null;
  piece('the thaw\'s plates', () => {
    const n = ctx.kit.count(150), rp = ctx.rng(829), shape = new THREE.Shape(), k = 7;
    for (let i = 0; i < k; i++) { const a = i / k * 6.2832 + (rp() - 0.5) * 0.5, r = 0.5 * (0.72 + 0.28 * rp()); if (i) shape.lineTo(Math.cos(a) * r, Math.sin(a) * r); else shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
    const mat = ctx.kit.gouache({ color: seen('#ADA8C8'), brush: 0.3, shade: 0.8 });      // (a step darker than the thaw's pale water, which shows the winter sky: paper-white plates could not be told from it; on the last of the dark water they are light on dark)
    const mesh = new THREE.InstancedMesh(geo, mat, n); mesh.name = 'the thaw: plates of skin ice (cast 20, winter)'; mesh.frustumCulled = false; mesh.visible = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const list = [];
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, size = 0.3 + 0.9 * Math.pow(rp(), 1.7);
      list.push({ s: 222 + 62 * rp(), d: side * (5.2 + 3.9 * Math.pow(rp(), 0.7)), size, turn: rp() * 6.28, spin: (rp() - 0.5) * 0.25, pace: 0.78 + 0.2 * rp(), out: (rp() - 0.5) * 0.05, squash: 0.75 + 0.5 * rp() });
    }
    ctx.only(ctx.add(mesh), 'direct');
    plates = { mesh, list, on: 0, going: false, from: 222, span: 62 };
  });
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  /** The margins' skin breaks into plates that run with the boat. { settled: true }: they are out already. */
  const thaw = (o = {}) => { if (!plates) return false; plates.going = true; plates.mesh.visible = true; if (o.settled) plates.on = 1; else tell(ice.onSong, 'thaw', null, null, 0); return true; };
  const plateUpdate = (dt) => {
    if (!plates || !plates.going) return;
    plates.on = Math.min(1, plates.on + dt / 2.5);
    const flow = plan.currentAt(Math.max(224, here.s)) * (calm ? 0.6 : 1), P = plates;
    for (let i = 0; i < P.list.length; i++) {
      const p = P.list[i];
      p.s += flow * p.pace * dt; p.d += p.out * dt; p.turn += p.spin * dt;
      if (p.s > P.from + P.span) p.s -= P.span;
      if (Math.abs(p.d) > 9.2 || Math.abs(p.d) < 4.6) p.out = -p.out;
      // (small where it comes in and where it goes out, and beside the hull: nothing pops, nothing lies under the boat)
      const edge = smooth(0, 4, Math.min(p.s - P.from, P.from + P.span - p.s)), hull = smooth(1.1, 2.4, Math.hypot(p.d - boat.x, -p.s - boat.z) - p.size * 0.5);
      const sc = p.size * edge * hull * smooth(i / P.list.length * 0.6, i / P.list.length * 0.6 + 0.4, P.on);
      m4.compose(p3.set(p.d, 0.004, -p.s), q4.setFromAxisAngle(up, p.turn), s3.set(sc * p.squash, 1, sc / p.squash));
      P.mesh.setMatrixAt(i, m4);
    }
    P.mesh.instanceMatrix.needsUpdate = true;
  };

  // ================================================================================================ what is left for the staging
  Object.assign(ice, { song, thaw, songs, openRoom, get pans() { return pans; }, get lines() { return lines; }, get plates() { return plates; } });
  cast.song = song; cast.thaw = thaw;

  // &ice=name:seconds,... (developer): plain, north, south, thaw, ring at that second of the realm's clock
  const asked = (Q.get('ice') || '').split(',').filter(Boolean).map((kv) => { const [name, at] = kv.split(':'); return { name, at: +at || 0, done: false }; });
  const play = (name) => { if (name === 'thaw') thaw(); else if (name === 'ring') otherEvening(9, 0.12); else song(name); };      // (ring: nine metres ahead, a little to port, so that a picture can find it)

  let frame = 0, lastS = 0, broke = 0, fallSeen = -1;
  const HIDE = Q.get('icehide');
  return {
    update(dt) {
      const t = ctx.time, s = here.s;
      frame++;
      if (frame === 2) {
        // entered part-way: what has happened behind the boat lies as it was left
        if (ice.auto.song && s > 65) song('plain', { settled: true });
        if (ice.auto.song && shared.tree && shared.tree.snow && shared.tree.snow.visible === false) { song('north', { settled: true }); song('south', { settled: true }); }
        if (s > 227) thaw({ settled: true });
        lastS = s;
      }
      if (frame < 2) return;
      for (const a of asked) if (!a.done && t >= a.at) { a.done = true; piece(`&ice=${a.name}`, () => play(a.name)); }
      panUpdate(Math.min(dt, 0.05));
      // ---- the far veils: their pattern is carried along the sheets (half speed with reduced motion)
      if (ice.auto.veils && shared.veils && shared.veils.material.uniforms.uDrift) shared.veils.material.uniforms.uDrift.value += plan.veils.drift * (calm ? 0.5 : 1) * dt;
      // ---- a ring from the other evening every 9 to 14 s, while the water still lies
      if (t >= nextRing) { nextRing = t + 9 + 5 * rnd(); if (ice.auto.rings && memory.amount > 0.3 && s > 60 && s < 246) otherEvening(); }
      // ---- the ice song: the plain's when the boat reaches s 62; the pond's two a few seconds into the fall
      if (ice.auto.song) {
        if (s >= 62 && s < 65) song('plain');
        const fall = cast.fall;
        if (fall && fall.running && fallSeen < 0) fallSeen = t;
        if (fallSeen >= 0) { if (t - fallSeen > 3.5) song('north'); if (t - fallSeen > 5.8) song('south'); }
        if (s >= 224 && s < 227) thaw();
      }
      // ---- the skin ticks: every plate the bow breaks (outside the black road, on the water), a small ring and a callback
      if (ice.auto.ticks && boat.z <= -plan.straight) {
        const bx = boat.x - Math.sin(boat.heading) * 1.85, bz = boat.z - Math.cos(boat.heading) * 1.85, sp = Math.abs(boat.speed || 0);
        if (sp > 0.2 && plan.waterRoom(-bz, bx) > 0.3 && openRoom(-bz, bx) < -0.3) {
          broke += sp * dt;
          if (broke > 0.45) {
            broke = 0; ctx.water.ripple(bx + (rnd() - 0.5) * 0.6, bz + (rnd() - 0.5) * 0.6, 0.12, 0.2); tell(ice.onTick, bx, bz, sp);
            // a crack runs a metre or two ahead of the bow through the skin, and is gone as the lane opens over it
            if (lines && bowAt.length && Q.get('bowcracks') !== '0') {      // (&bowcracks=0, developer: none)
              const id = bowAt[bowNext++ % bowAt.length], hx = -Math.sin(boat.heading), hz = -Math.cos(boat.heading), side = rnd() < 0.5 ? -1 : 1, turn = side * (0.25 + 0.7 * rnd()), L = 1 + rnd();
              let x = bx + hx * 0.5 - hz * side * 0.35 * rnd(), z = bz + hz * 0.5 + hx * side * 0.35 * rnd(), a = turn; const pts = [[x, 0.035, z]];
              for (let k = 0; k < 3; k++) { a += (rnd() - 0.5) * 0.7; const ca = Math.cos(a), sa = Math.sin(a); x += (hx * ca - hz * sa) * L / 3; z += (hz * ca + hx * sa) * L / 3; pts.push([x, 0.035, z]); }
              lines.setPoints(id, pts); lines.draw(id, 0.14);
              // (gone before the eye comes over it: a crack still drawn under or behind the eye is the same fault as above.
              // It was 1.1 + 1.2 / speed seconds and 0.9 s of going: at the current's pace it was still there under the seat)
              stage.after(Math.min(1.1, 0.9 / Math.max(0.5, sp)), () => lines.fade(id, Math.min(0.9, 1 / Math.max(0.5, sp))));
            }
          }
        }
      }
      plateUpdate(dt);
      // ---- the cracks that lie: only what is wholly in front of the eye is drawn (see `pieces` above)
      if (lines) {
        const cam = ctx.engine.camera, e = cam && cam.matrixWorld ? cam.matrixWorld.elements : null;
        if (e) for (const name in songs) {
          const S = songs[name]; if (!S.lying) continue;
          for (const list of [S.pieces, S.twigs]) for (const pc of list) {
            let front = true;
            for (const q of pc.pts) if ((q[0] - e[12]) * -e[8] + (q[1] - e[13]) * -e[9] + (q[2] - e[14]) * -e[10] < 0.5) { front = false; break; }
            if (front !== pc.on || !pc.seen) { pc.on = front; pc.seen = true; lines.show(pc.id, front); }
          }
        }
      }
      if (HIDE) { if (HIDE === 'lines' && lines) lines.object.visible = false; if (HIDE === 'pans' && pans && pans.object) pans.object.visible = false; if (HIDE === 'plates' && plates) plates.mesh.visible = false; }      // (&icehide=lines | pans | plates, developer)
      lastS = s;
    },
  };
}
