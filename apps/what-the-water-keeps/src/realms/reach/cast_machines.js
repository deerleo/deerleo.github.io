// The dyers' reach: THE MACHINES AT WORK (stage 3, the cast, group "Machines").
// Plan: docs/build/reach/3-cast-plan.md. Log: docs/build/reach/3-cast-machines.md. Family: ribbons (docs/life/ribbons.md,
// "Old machinery"; src/engine/life/machines.js, and makePours of src/engine/life/ribbons.js).
//
// The machines themselves are stage 2's (heroes_c.js: shared.machines): every model stands and every shaft already turns
// by the toolkit's clocks. Nothing of that file is edited. This module gives each machine what it lacked:
//
//   WEIGHT      a wringer no longer winds on a smooth curve: it is wound hand over hand, quick at first and harder as the
//               skein tightens, pausing on the ratchet's pawl between its last pulls; let go, it spins back and coasts to a stop
//               (the machine in shared.machines.wringers[i] is given a `value` of this shape: heroes_c.js reads it every
//               frame, so wheel, skein and post all follow). No cycle is quite the length of the last: at every rest a
//               wringer, a river beam and the copper take a pace of their own for the next round (a tenth either way,
//               eased in while nothing moves), so no two stay in step and nothing is a loop.
//   WATER       one draw call of falling drops for all of them (the braid under each skein while it is wrung, flung from
//               the turning rope and falling plumb while it is held; the hem of a dipped cloth streaming as it comes up),
//               and one of pours (the copper's sheet from its lip to the slipway's head; the gutter threads of the four
//               wringers outside the gallery; the lifting wheel's spill board and its header's leaks; the launder's
//               thread into the copper). Whatever lands on the river rings it and leaves its dye in the film:
//               crimson under the skeins, indigo where the green cloths go in, violet at the terrace's wheels, and every
//               48 s one fan of madder 14 m long from the slipway's foot.
//   CONTROLS    shared.cast.machines, for staging (stage.js). Nothing here reacts to the boat or to the showstopper.
//
// shared.cast.machines = {
//   on(kind, fn)                 fn(x, z, { pitch, gain, who }) each time: 'knock' (a wringer's ratchet, pitch 0.6, four to a
//                                winding; a paddle going in, pitch 0.5), 'creak' (a beam, the copper's trunnions, a wringer
//                                taking the strain: pitch 0.5), 'splash' (a cradle going down; the copper's pour: gain 1),
//                                'drop' (a drop on the river, at most six a second, pitch 0.7), 'bucket' (the lifting wheel
//                                tips one, every 1.25 s), 'sluice' ({ open }: the launder's cam lets go, or shuts)
//   fullTwist(i, seconds, o)     wringer i (0 = the nave's right, s 62; 1 = the nave's left, s 78; 2..6 the gallery's; 7, 8
//                                the terrace's) is just wrung, its curtain of drops falling, in `seconds` from now
//   liftBeam(i, seconds, o)      dipping beam i (1 = the second, for s 98) begins to lift in `seconds`
//   tipCopper(seconds, o)        the copper begins to tip in `seconds` (it pours 5 s later, the fan reaches the lagoon 12 s later)
//   openSluice(seconds, o)       the launder's 60 s cam lets go in `seconds` (sluice.open() goes 0 to 1 over 2.5 s and stays 27.5 s)
//                                o: { nudge: 0.2 } the most it may hurry or dawdle (machine.arrive: ask early; it returns the
//                                share of the way it can make), or { hard: true }: its phase is SET (a jump: only out of sight)
//   wringers[i] = { name, s, d, machine, twist(), dripping() 0..1 }, dippers[i] = { name, s, d, machine, streaming() 0..1 },
//   copper = { machine, flowAt(k) 0..1 (0 the tub's lip, 1..3 the slipway's lips, 4 the foot), lip, fan }, sluice = { machine, open(), at },
//   wheels = [{ name, wheel }] (the terrace's two and the lifting wheel), level() 0..1: how much is falling now (for a patter)
// }
// The Falls group's (cast_falls.js), not drawn here: the slipway's three sheets (they follow copper.tilt()), the gallery's
// five gutters, every standing spout, the drips of hems, hanks, launder and gallery floor.
// Developer switches: &mshape=0 the wringers on the toolkit's plain curve; &mrain=0 no drops; &mpour=0 no pours;
//   &copper=<seconds> the copper's cycle begins there (0 = it starts to tip as the picture begins; it pours from 5 to 10).
import * as THREE from 'three';
import { makeMachine } from '../../engine/life/machines.js';
import { makePours } from '../../engine/life/ribbons.js';

const TAU = Math.PI * 2;
const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const { kit, path } = ctx, M = shared.machines, sun = shared.sun, D = plan.dyes, PM = plan.machines;
  const hooks = {};
  const fire = (kind, x, z, o) => {
    const l = hooks[kind]; if (!l) return;
    for (const fn of l) { try { fn(x, z, o || {}); } catch (e) { console.error(`reach/cast_machines: a '${kind}' hook threw: ` + (e && e.message || e)); } }
  };
  const out = (shared.cast.machines = { on(kind, fn) { (hooks[kind] = hooks[kind] || []).push(fn); return out; }, wringers: [], dippers: [], wheels: [], copper: null, sluice: null, level: () => 0 });
  if (!M || !PM) { console.error('reach/cast_machines: shared.machines is not there (heroes_c did not build): the machines have no water and no controls'); return {}; }

  // ================================================================================================ the river under them
  const _L = {};
  /** The height of what lies under a place: 0 on the river (the channel and the water outside its edge), else the bank's step. */
  const floorAt = (x, z) => {
    const l = path.locate(x, z, null, _L), outside = Math.abs(l.d) - kit.halfWidth(l.s);
    if (!(outside > 0) || !shared.yards || !shared.yards.level) return 0;
    const y = shared.yards.level(l.s, l.d < 0 ? -1 : 1, outside);
    return y > 0 ? y : 0;
  };
  // the film has two pigments: 'a' the left bank's, 'b' the right's (set.js reads both as more dye); violet is both
  const channelOf = (dye, x, z) => (dye === 4 ? 'ab' : dye === 5 ? 'a' : path.locate(x, z, null, _L).d < 0 ? 'a' : 'b');
  const ring = (x, z, strength, radius) => { if (ctx.water && ctx.water.ripple) ctx.water.ripple(x, z, strength, radius); };
  const grain = (x, z, ch, strength, radius = 0.4) => {
    const t = ctx.water && ctx.water.trace; if (!t || !t.inject || !(strength > 0)) return;
    if (ch === 'ab') { t.inject(x, z, { channel: 'a', radius, strength: strength * 0.5 }); t.inject(x, z, { channel: 'b', radius, strength: strength * 0.5 }); }
    else t.inject(x, z, { channel: ch, radius, strength });
  };
  // a dye as it runs: toward its lit colour (as cast_falls.js pours it: the blue dyes stay deep)
  const liquor = (i) => '#' + new THREE.Color(D[i].color).lerp(new THREE.Color(D[i].back), i >= 4 ? 0.2 : 0.42).getHexString();
  /** Be at p (0..1 of its cycle) in `seconds`: by its own pace (arrive), or set outright (hard: only out of sight). */
  const arriveAt = (m, p, seconds, o = {}) => {
    if (!m || !m.arrive) return 0;
    if (o.hard && m.setPhase && !m.geared) { const rate = m.rate ?? 1 / m.period; m.setPhase(p - rate * seconds); return 1; }
    return m.arrive(p, seconds, { nudge: o.nudge ?? 0.2 });
  };
  const ticks = [];                                                              // each part's own work every frame; one that throws is left out, the rest go on
  const part = (name, fn) => { try { fn(); } catch (e) { console.error(`reach/cast_machines: ${name} was left out: ` + (e && e.stack || e)); } };

  // ================================================================================================ the drops (one draw call)
  // A pool stepped here (they fall from things that move, and each landing is a ring and a grain of dye): a slender
  // stroke of the dye drawn out along its fall, never thinner than a pixel and a half however far (a drop is 4 mm).
  const N = QS.get('mrain') === '0' ? 0 : Math.max(160, kit.count(520));
  const aBead = new Float32Array(Math.max(1, N) * 4), aVel = new Float32Array(Math.max(1, N) * 3), aCol = new Float32Array(Math.max(1, N) * 3);
  const bFloor = new Float32Array(Math.max(1, N)), bKind = new Uint8Array(Math.max(1, N)), bSrc = new Int16Array(Math.max(1, N));
  const sources = [];
  const addSource = (who, ch, dye, ringOf) => { sources.push({ who, ch, dye, ring: ringOf, n: 0, x: 0, z: 0 }); return sources.length - 1; };
  let alive = 0, beads = null, beadAttrs = [];
  part('the drops', () => {
    if (!N) return;
    const bead = new THREE.OctahedronGeometry(1, 0).toNonIndexed(); bead.computeVertexNormals();
    const geo = new THREE.InstancedBufferGeometry(); geo.setAttribute('position', bead.attributes.position); geo.setAttribute('normal', bead.attributes.normal);
    beadAttrs = [['aBead', aBead, 4], ['aBeadV', aVel, 3], ['aBeadC', aCol, 3]].map(([name, arr, size]) => { const a = new THREE.InstancedBufferAttribute(arr, size); a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(name, a); return a; });
    geo.instanceCount = 0;
    const BEAD = {
      vertexPars: /* glsl */`attribute vec4 aBead; attribute vec3 aBeadV; attribute vec3 aBeadC; varying vec3 vBeadC;`,
      vertexWorld: /* glsl */`{
        vec3 vel = aBeadV; float sp = length(vel); vec3 dir = sp > 0.001 ? vel / sp : vec3(0.0, -1.0, 0.0);
        float wide = max(aBead.w, length(aBead.xyz - cameraPosition) * 0.0023);      // never thinner than a pixel and a half
        float al = dot(position, dir), len = wide + 0.03 + 0.014 * sp;
        vec3 p = (position - dir * al) * wide + dir * (al * len * (al < 0.0 ? 1.5 : 0.6));      // drawn out along its fall, its tail above it
        wp.xyz = aBead.xyz + p; wn = normalize(position - dir * al * 0.8);
        vBeadC = aBeadC;
      }`,
      fragmentPars: /* glsl */`varying vec3 vBeadC;`,
      albedo: /* glsl */`albedo = vBeadC;`,
    };
    const mat = kit.gouache({ color: '#ffffff', brush: 0, shade: 0.6, backlight: 0.9, backColor: '#ffd9b4', crisp: true, extend: [BEAD, sun ? sun.extend : null].filter(Boolean) });
    beads = new THREE.Mesh(geo, mat); beads.name = 'machine-drops'; beads.frustumCulled = false; beads.visible = false;
    ctx.add(beads);
    if (sun && sun.solid) sun.solid(beads, false);                               // (they move in a shader of their own: never counted as hiding the sun)
  });
  const emit = (x, y, z, vx, vy, vz, c, size, floor, kind, src) => {
    if (!beads || alive >= N) return;
    const i = alive++, p = i * 4, v = i * 3;
    aBead[p] = x; aBead[p + 1] = y; aBead[p + 2] = z; aBead[p + 3] = size;
    aVel[v] = vx; aVel[v + 1] = vy; aVel[v + 2] = vz;
    aCol[v] = c.r; aCol[v + 1] = c.g; aCol[v + 2] = c.b;
    bFloor[i] = floor; bKind[i] = kind; bSrc[i] = src;
  };
  let dropWait = 0;
  const stepBeads = (dt) => {
    if (!beads) return;
    let rings = 0;
    for (let i = 0; i < alive;) {
      const p = i * 4, v = i * 3;
      aVel[v + 1] -= 9.81 * dt;
      aBead[p] += aVel[v] * dt; aBead[p + 1] += aVel[v + 1] * dt; aBead[p + 2] += aVel[v + 2] * dt;
      if (aBead[p + 1] <= bFloor[i]) {
        if (bKind[i] === 1) {                                                    // on the river: a ring, and its dye (below)
          const s = sources[bSrc[i]]; s.n++; s.x = aBead[p]; s.z = aBead[p + 2];
          if (rings < 6) { rings++; ring(s.x, s.z, s.ring[0], s.ring[1]); }
        }
        const l = --alive;
        if (i !== l) {
          const q = l * 4, w = l * 3;
          aBead[p] = aBead[q]; aBead[p + 1] = aBead[q + 1]; aBead[p + 2] = aBead[q + 2]; aBead[p + 3] = aBead[q + 3];
          aVel[v] = aVel[w]; aVel[v + 1] = aVel[w + 1]; aVel[v + 2] = aVel[w + 2];
          aCol[v] = aCol[w]; aCol[v + 1] = aCol[w + 1]; aCol[v + 2] = aCol[w + 2];
          bFloor[i] = bFloor[l]; bKind[i] = bKind[l]; bSrc[i] = bSrc[l];
        }
        continue;
      }
      i++;
    }
    dropWait -= dt;
    for (const s of sources) {
      if (!s.n) continue;
      grain(s.x, s.z, s.ch, s.dye * s.n, 0.42);
      if (dropWait <= 0) { dropWait = 0.17; fire('drop', s.x, s.z, { pitch: 0.7, gain: 0.5, who: s.who }); }
      s.n = 0;
    }
    beads.geometry.instanceCount = alive; beads.visible = alive > 0;
    for (const a of beadAttrs) a.needsUpdate = true;
  };
  out.level = () => (N ? clamp01(alive / (N * 0.35)) : 0);

  // ================================================================================================ the pours (one draw call)
  const pourDefs = [], pourMeta = [];
  /** A pour of the family's (a rope or a sheet of liquid). meta: { wet: it lands on the river, ch, dye: pigment a second at full flow, ringOf: [strength, radius] }. */
  const addPour = (def, meta = {}) => { pourDefs.push(def); pourMeta.push({ wet: false, ch: 'b', dye: 0, ringOf: [0.2, 0.35], flow: def.flow ?? 0, set: def.flow ?? 0, wait: 0, x: 0, z: 0, ...meta }); return pourDefs.length - 1; };
  let pours = null;
  const setFlow = (i, f) => {
    const m = pourMeta[i]; if (!m) return; m.flow = f;
    if (pours && (Math.abs(f - m.set) > 0.04 || (f === 0 && m.set !== 0))) { pours.flow(i, f, 0.35); m.set = f; }
  };

  // ================================================================================================ the wringers
  // (page: 3.5 turns in 5 s, held 2 s while a curtain of drops falls, unwound in 4 s, at rest 5 s)
  part('the wringers', () => {
    const W = PM.wring, tw = W.steps[0][0], th = W.steps[1][0], tu = W.steps[2][0], cyc = W.steps.reduce((a, s) => a + s[0], 0);
    const held = QS.has('wring') ? Math.max(0, Math.min(W.turns, +QS.get('wring'))) : null, shaped = QS.get('mshape') !== '0', PULLS = 6;
    // the turns of twist at a second of its cycle: wound hand over hand (six pulls), quick at first and harder as it
    // tightens; from the third pull on it slows to a fifth of its pace on the ratchet's pawl between pulls (a narrow
    // pause, no burst after it: its quickest is 1.13 turns a second, the toolkit's plain ease 1.05, and it never turns
    // back); let go, it spins back and coasts out. `heave` is the pace's wobble over one pull, summed (its mean is nought).
    const PI = Math.PI, heave = (x) => -(128 / 93) / 128 * (28 * Math.sin(TAU * x) / PI + 7 * Math.sin(2 * TAU * x) / PI + (4 / 3) * Math.sin(3 * TAU * x) / PI + Math.sin(4 * TAU * x) / (8 * PI));
    const wound = (sec) => {
      if (sec < tw) { let u = sec / tw; u += 0.8 * smooth(0.25, 0.7, u) * heave(PULLS * u) / PULLS; const s = Math.pow(clamp01(u), 1.5); return W.turns * (1 - (1 - s) * (1 - s)); }
      if (sec < tw + th) return W.turns;
      if (sec < tw + th + tu) { const s = 1 - Math.pow((sec - tw - th) / tu, 1.6); return W.turns * s * s; }
      return 0;
    };
    const knocks = [3, 4, 5, 5.98].map((k) => tw * k / PULLS);                   // the pawl drops where each pull ends (2.5, 3.3, 4.2 s and as it stops)
    M.wringers.forEach((w, i) => {
      const m0 = w.machine, rnd = ctx.rng(4100 + i * 13), st = { acc: 0, last: 0, quiet: -1, gutter: 0, thread: -1, drip: 0 };
      if (shaped && m0 && typeof m0.at === 'number') {
        const mine = Object.create(m0);                                          // the toolkit's clock, with a curve of its own
        Object.defineProperty(mine, 'value', { get: () => wound(m0.at * cyc), enumerable: true });
        w.machine = mine;
        w.twist = () => clamp01((held ?? mine.value) / W.turns);
      }
      const turnsNow = () => held ?? w.machine.value;
      st.last = turnsNow();
      // no round quite the length of the last (eased in while it rests: nothing is seen to change pace)
      m0.every((tw + th + tu + 1.2) / cyc, () => { if (ctx.time > st.quiet) m0.ease(0.9 + 0.2 * rnd(), 2.5); });
      for (const k of knocks) m0.every(k / cyc, () => fire('knock', w.hub.x, w.hub.z, { pitch: 0.6, gain: 0.7, who: w.name }));
      m0.every(0.3 / cyc, () => fire('creak', w.hub.x, w.hub.z, { pitch: 0.5, gain: 0.5, who: w.name }));
      // where its drops leave the skein: seven places along it (a wrung rope drips from the low side of its lays), and
      // what lies under each: its gutter under the wheel's end, then the river
      const A = w.drip.a.clone(), B = w.drip.b, B0 = w.hookB(new THREE.Vector3()), ax = B0.clone().sub(A), len0 = ax.length() || 1; ax.multiplyScalar(1 / len0);
      const side = new THREE.Vector3(-ax.z, 0, ax.x), way = w.way || 1;
      const gf = clamp01(w.gutterLip.clone().sub(A).dot(ax) / len0), gy = w.gutterLip.y + 0.04;
      const ch = channelOf(w.dye, B0.x, B0.z), col = new THREE.Color(D[w.dye].color).multiplyScalar(1.35);
      const src = addSource(w.name, ch, 0.1, [0.25, 0.4]);
      const places = [];
      for (let j = 0; j < 7; j++) {
        const f = 0.13 + 0.74 * (j + 0.25 + 0.5 * rnd()) / 7, low = floorAt(A.x + ax.x * len0 * f, A.z + ax.z * len0 * f);
        places.push({ f, gutter: f < gf - 0.03, low, wet: low <= 0.01 });
      }
      // its gutter's thread (the gallery's five gutters are the Falls group's)
      if (!/^gallery/.test(w.name)) {
        const lip = w.gutterLip, low = floorAt(lip.x + ax.x * 0.3, lip.z + ax.z * 0.3);
        st.thread = addPour({ at: [lip.x, lip.y, lip.z], toward: [ax.x, ax.z], speed: 0.45, thick: 0.05, color: liquor(w.dye), to: low, flow: 0, period: 3 + 2 * rnd() }, { wet: low <= 0.01, ch, dye: 0.7, ringOf: [0.18, 0.3] });
      }
      const me = { name: w.name, s: w.s, d: w.d, machine: w.machine, twist: () => w.twist(), dripping: () => st.drip,
        fullTwist: (seconds, o) => { st.quiet = ctx.time + seconds + cyc; return arriveAt(m0, (tw + 0.3) / cyc, seconds, o); } };
      out.wringers.push(me);
      ticks.push({ name: 'wringer ' + w.name, fn(dt) {
        const turns = turnsNow(), k = clamp01(turns / W.turns), spin = (turns - st.last) / dt; st.last = turns;
        st.drip = smooth(0.45, 0.95, k);
        // the gutter fills a second after the skein begins to run, and runs on a little after
        st.gutter += (st.drip - st.gutter) * (1 - Math.exp(-dt / (st.drip > st.gutter ? 0.9 : 1.8)));
        if (st.thread >= 0) setFlow(st.thread, st.gutter < 0.04 ? 0 : st.gutter);
        st.acc += 80 * st.drip * dt;
        while (st.acc >= 1) {
          st.acc -= 1;
          const pl = places[(rnd() * places.length) | 0], f = pl.f + (rnd() - 0.5) * 0.03;
          const phi = -Math.PI / 2 + (rnd() - 0.5) * 2.4, cs = Math.cos(phi), sn = Math.sin(phi);      // where round the rope it lets go: its low side
          const vt = way * spin * TAU * (1 - f) * W.rope * 1.6;                 // the turning rope flings it (the wheel's end turns, the post's is held)
          const x = A.x + (B.x - A.x) * f + side.x * cs * W.rope, y = A.y + (B.y - A.y) * f + sn * W.rope - 0.01, z = A.z + (B.z - A.z) * f + side.z * cs * W.rope;
          const flung = Math.abs(vt) > 0.22, floor = pl.gutter && !flung ? gy : pl.low;
          emit(x, y, z, -sn * vt * side.x, cs * vt - 0.15, -sn * vt * side.z, col, 0.011 + 0.005 * rnd(), floor, floor <= 0.01 ? 1 : 0, src);
        }
      } });
    });
    out.fullTwist = (i, seconds, o) => (out.wringers[i] ? out.wringers[i].fullTwist(seconds, o) : 0);
  });

  // ================================================================================================ the dipping beams
  // (page: down in 4 s, 10 s in the dye, up in 5 s, held 21 s while the cloth turns; "long holds, the colour change is the event")
  part('the dipping beams', () => {
    const DP = PM.dip, cyc = DP.steps.reduce((a, s) => a + s[0], 0), tDown = DP.steps[0][0], tSoak = DP.steps[1][0];
    const fresh = new THREE.Color(DP.fresh), teal = new THREE.Color(DP.teal), col = new THREE.Color();
    M.dippers.forEach((b, i) => {
      const m = b.machine, rnd = ctx.rng(5200 + i * 17), sec0 = m.at * cyc;
      const st = { under: true, leftAt: sec0 > tDown + tSoak + 1.5 ? -(sec0 - tDown - tSoak - 1.5) : -99, acc: 0, wait: 0, v: b.lifted(), hem: new THREE.Vector3(), stream: 0, quiet: -1, first: true };
      const ax = new THREE.Vector3(b.dipAt.x - b.pin.x, 0, b.dipAt.z - b.pin.z).normalize();      // the cloth hangs in the beam's own plane
      const wet = b.deep === 1, ch = channelOf(b.dye, b.dipAt.x, b.dipAt.z), src = addSource(b.name, ch, 0.05, [0.2, 0.32]);
      if (m.every) {
        m.every(0.3 / cyc, () => fire('creak', b.pin.x, b.pin.z, { pitch: 0.5, gain: 0.6, who: b.name }));
        m.every((tDown + tSoak + 0.3) / cyc, () => fire('creak', b.pin.x, b.pin.z, { pitch: 0.5, gain: 0.7, who: b.name }));
        // a river beam's next round a little longer or shorter (eased in while it holds; the terrace's two follow their wheels)
        if (!m.geared && m.ease) m.every((tDown + tSoak + 12) / cyc, () => { if (ctx.time > st.quiet) m.ease(0.94 + 0.12 * rnd(), 4); });
      }
      out.dippers.push({ name: b.name, s: b.s, d: b.d, machine: m, streaming: () => st.stream,
        lift: (seconds, o) => { st.quiet = ctx.time + seconds + cyc; return arriveAt(m, (tDown + tSoak + 0.3) / cyc, seconds, o); } });
      ticks.push({ name: 'dipping beam ' + b.name, fn(dt) {
        b.hem(st.hem);
        const under = st.hem.y <= b.level + 0.03, v = b.lifted(), moving = Math.abs(v - st.v) / dt > 0.004; st.v = v;
        if (st.first) { st.first = false; st.under = under; }
        if (under && !st.under) {                                                // its hem goes in: a soft splash
          if (wet) { ring(b.dipAt.x, b.dipAt.z, 0.7, 0.7); grain(b.dipAt.x, b.dipAt.z, ch, 0.5, 0.7); }
          fire('splash', b.dipAt.x, b.dipAt.z, { pitch: 0.8, gain: 0.5, who: b.name });
        }
        if (!under && st.under) st.leftAt = ctx.time;
        st.under = under;
        if (under) {
          st.stream = 0;
          // while the cloth goes down or is drawn up through the surface it stirs it
          if (wet && moving && (st.wait -= dt) <= 0) { st.wait = 0.3 + 0.2 * rnd(); ring(b.dipAt.x + (rnd() - 0.5) * 0.6, b.dipAt.z + (rnd() - 0.5) * 0.6, 0.32, 0.45); grain(b.dipAt.x, b.dipAt.z, ch, 0.12, 0.6); }
          return;
        }
        // out of the dye it streams from its hem, hard at first, then a drop now and then until it has turned
        const tau = ctx.time - st.leftAt, rate = tau < 26 ? 44 * Math.exp(-tau / 3.2) + 2 * (1 - tau / 26) : 0;
        st.stream = clamp01(rate / 30);
        st.acc += rate * dt;
        col.copy(fresh).lerp(teal, smooth(0, 0.6, b.turned)).multiplyScalar(1.3);
        while (st.acc >= 1) {
          st.acc -= 1;
          const u = (rnd() - 0.5) * (DP.bar || 1) * 0.92;
          emit(st.hem.x + ax.x * u, st.hem.y - 0.02, st.hem.z + ax.z * u, 0, -0.1, 0, col, 0.011 + 0.004 * rnd(), b.level, wet ? 1 : 0, src);
        }
      } });
    });
    out.liftBeam = (i, seconds, o) => (out.dippers[i] ? out.dippers[i].lift(seconds, o) : 0);
  });

  // ================================================================================================ the tipping copper
  // (page: every 48 s it tips 55 degrees in 6 s, pours for 4 s, rights itself in 8 s; "the last of the pour dribbling")
  part('the copper', () => {
    const c = M.copper, m = c.machine, K = PM.copper, cyc = K.steps.reduce((a, s) => a + s[0], 0), rnd = ctx.rng(6300), madder = liquor(2);
    if (QS.has('copper') && m.setPhase) m.setPhase((((+QS.get('copper') || 0) / cyc) % 1 + 1) % 1);
    // where its lip is when it stands tipped: the lip as modelled, turned about the trunnions
    const tubPart = c.model && c.model.parts && c.model.parts.tub, lip0 = c.lip(new THREE.Vector3()), tilt0 = tubPart ? tubPart.rotation.x : 0, to = new THREE.Vector2(c.toward.x, c.toward.z).normalize();
    const base = c.model && c.model.group ? c.model.group.position : new THREE.Vector3(c.head.x + to.x * -1.8, 0, c.head.y + to.y * -1.8);
    const h1 = (lip0.x - base.x) * to.x + (lip0.z - base.z) * to.y, v1 = lip0.y - K.trunnion;
    const h0 = h1 * Math.cos(tilt0) - v1 * Math.sin(tilt0), v0 = h1 * Math.sin(tilt0) + v1 * Math.cos(tilt0);      // as it stands upright
    const th = K.steps[0][1] * Math.PI / 180, h = h0 * Math.cos(th) + v0 * Math.sin(th), v = -h0 * Math.sin(th) + v0 * Math.cos(th);
    const side = (lip0.x - base.x) * -to.y + (lip0.z - base.z) * to.x;
    const lip = new THREE.Vector3(base.x + to.x * h - to.y * side, K.trunnion + v, base.z + to.y * h + to.x * side);
    // how much runs, by the second of its cycle: it begins as the lip comes down, runs full, thins as the tub empties, dribbles as it rights
    const F = (u) => (u < 4.3 ? 0 : u < 6 ? smooth(4.3, 6, u) : u < 8.5 ? 1 : u < 10.5 ? 1 - 0.72 * smooth(8.5, 10.5, u) : u < 13.5 ? 0.28 * (1 - smooth(10.5, 13.5, u)) : 0);
    const late = [0, 0.5, 1.2, 1.9, 2.2];                                        // seconds from the tub's lip to each of the slipway's lips and to the foot (as cast_falls.js runs its sheets)
    const flowAt = (k) => { const sec = m.at * cyc, u = sec - late[k]; return Math.max(F(u), F(u + cyc)); };
    // (the slipway's three sheets are the Falls group's, cast_falls.js: they follow copper.tilt(); `late` is their timing)
    const idx = [addPour({ at: [lip.x, lip.y, lip.z], toward: [to.x, to.y], speed: 1.2, thick: 0.13, wide: 1.0, color: madder, to: c.head.y, flow: 0, period: 2.3 })];
    // the launder's thread into the tub: it never stops (the tub is filling for most of its round)
    if (c.fill) addPour({ at: [c.fill.x, c.fill.y, c.fill.z], toward: [to.x, to.y], speed: 0.06, thick: 0.04, color: madder, to: K.trunnion + 0.6, flow: 0.8, period: 5 });
    m.every(0.3 / cyc, () => fire('creak', base.x, base.z, { pitch: 0.5, gain: 0.8, who: 'copper' }));
    m.every(10.3 / cyc, () => fire('creak', base.x, base.z, { pitch: 0.45, gain: 0.6, who: 'copper' }));
    m.every(5 / cyc, () => fire('splash', c.head.x, c.head.z, { pitch: 0.6, gain: 1, who: 'copper' }));
    m.every(7 / cyc, () => fire('splash', c.foot.x, c.foot.z, { pitch: 0.7, gain: 0.7, who: 'copper foot' }));
    let quiet = -1;
    m.every(32 / cyc, () => { if (ctx.time > quiet) m.ease(0.95 + 0.1 * rnd(), 5); });
    // the fan on the lagoon: five rays from the slipway's foot, a little down the stream, growing to 14 m while it runs
    const a108 = path.at(K.s, {}), fan = [];
    for (let j = -2; j <= 2; j++) {
      const a = j * 0.26 + 0.06 * (rnd() - 0.5), cs = Math.cos(a), sn = Math.sin(a);
      const d = new THREE.Vector2(to.x * cs - to.y * sn + a108.tx * 0.22, to.x * sn + to.y * cs + a108.tz * 0.22).normalize();
      fan.push({ x: d.x, z: d.y, long: 14 * (1 - 0.12 * Math.abs(j)) * (0.9 + 0.2 * rnd()) });
    }
    let ran = 0;
    out.copper = { machine: m, flowAt, lip, fan };
    out.tipCopper = (seconds, o) => { quiet = ctx.time + seconds + cyc; return arriveAt(m, 0, seconds, o); };
    ticks.push({ name: 'the copper', fn(dt) {
      for (let k = 0; k < idx.length; k++) setFlow(idx[k], flowAt(k) < 0.03 ? 0 : flowAt(k));
      const f = flowAt(4);
      ran = f > 0.02 ? ran + dt : 0;
      if (f > 0.02) {
        const t = ctx.water && ctx.water.trace, grow = 0.15 + 0.85 * smooth(0, 7, ran);
        // (not ruled rays: grains scattered through the fan, thick at the foot and thinning outward, so that its edge is soft
        // and its fingers are the film's own)
        if (t) for (let q = 0; q < 6; q++) {
          const r = fan[(rnd() * fan.length) | 0], a2 = (rnd() - 0.5) * 0.3, u = Math.pow(rnd(), 1.6) * r.long * grow, cs = Math.cos(a2), sn = Math.sin(a2);
          grain(c.foot.x + (r.x * cs - r.z * sn) * u, c.foot.z + (r.x * sn + r.z * cs) * u, 'b', 3.6 * f * dt, 0.6 + 0.07 * u);
        }
        grain(c.foot.x + to.x * 0.8, c.foot.z + to.y * 0.8, 'b', 2.5 * f * dt, 1.0);
      }
    } });
  });

  // ================================================================================================ the lifting wheel
  // (page: once in 20 s, a bucket into the launder every 1.25 s.) Its floats' drops and their rings are the toolkit's
  // (heroes_c.js). Here: what the header cannot hold goes back over its spill board in a sheet that thickens as each
  // bucket empties (a rope of water that breaks into beads: as a sheet it stood behind the wheel like a pale plank), and its
  // three leaks dribble.
  part('the lifting wheel', () => {
    const lw = M.liftingWheel, LW = PM.liftingWheel, rnd = ctx.rng(7400), color = '#' + new THREE.Color(LW.dripColor || '#c08a8c').multiplyScalar(0.34).getHexString();      // (the river's own rose, deep: at the wheel's own pale colour it fell as a white pole against the sun)
    const d = new THREE.Vector2(lw.spill.x - lw.tip.x, lw.spill.z - lw.tip.z); if (d.length() < 0.05) d.set(1, 0); d.normalize();
    const hd = new THREE.Vector2(lw.headerOut.x - lw.tip.x, lw.headerOut.z - lw.tip.z).normalize();
    const fallTo = (p, dir, speed) => { const T = Math.sqrt(2 * p.y / 9.81), low = floorAt(p.x + dir.x * speed * T, p.z + dir.y * speed * T); return low; };
    const each = lw.wheel.period / (lw.buckets || 16);
    const low = fallTo(lw.spill, d, 0.5);
    addPour({ at: [lw.spill.x, lw.spill.y, lw.spill.z], toward: [d.x, d.y], speed: 0.5, thick: 0.16, color, to: low, flow: 1, period: each, phase: (0.25 + lw.wheel.phase * (lw.buckets || 16)) % 1 }, { wet: low <= 0.01, ch: 'b', dye: 0.12, ringOf: [0.35, 0.5] });
    lw.leaks.forEach((p, k) => { const l = fallTo(p, hd, 0.05); addPour({ at: [p.x, p.y, p.z], toward: [hd.x, hd.y], speed: 0.05, thick: 0.03 + 0.012 * rnd(), color, to: l, flow: 0.55 + 0.4 * rnd(), period: 4 + 3 * rnd() }, { wet: l <= 0.01, ch: 'b', dye: 0.05, ringOf: [0.14, 0.25] }); });
    out.wheels.push({ name: 'lifting wheel', wheel: lw.wheel });
    let last = Math.floor(lw.wheel.phase * (lw.buckets || 16));
    ticks.push({ name: 'the lifting wheel', fn() {
      const n = Math.floor(lw.wheel.phase * (lw.buckets || 16));
      if (n !== last) { last = n; fire('bucket', lw.tip.x, lw.tip.z, { pitch: 0.8, gain: 0.4, who: 'lifting wheel' }); }
    } });
  });

  // ================================================================================================ the terrace's two wheels
  // (page: 16 s a turn; the floats ring as they go in: the toolkit's ring is on.) Here: the knock of each float, and the
  // terrace's violet carried out from under each wheel into the film.
  part('the undershot wheels', () => {
    const floats = PM.undershot.floats || 16;
    (M.undershot || []).forEach((u) => {
      let last = Math.floor(u.wheel.phase * floats);
      out.wheels.push({ name: u.name, wheel: u.wheel });
      ticks.push({ name: u.name, fn() {
        const n = Math.floor(u.wheel.phase * floats);
        if (n === last) return; last = n;
        fire('knock', u.waterIn.x, u.waterIn.z, { pitch: 0.5, gain: 0.45, who: u.name });
        grain(u.waterOut.x, u.waterOut.z, 'ab', 0.16, 0.7);
      } });
    });
  });

  // ================================================================================================ the launder's sluice cam
  // (page, s 212: "the launder's sluice (on a 60 s cam, phased) lets go": the right terrace's six spouts are the Falls
  // group's and open by its `flow`.) The cam is a clock here: no gate is modelled on the launder (the yards' piece).
  part('the sluice cam', () => {
    const sl = makeMachine(ctx, { steps: [[2.5, 1], [27.5, 1], [4, 0], [26, 0]], phase: 0.55 }), La = plan.launder || { out: 6.5, height: 7.5 };
    const at = shared.yards && shared.yards.land ? shared.yards.land(212, 1, La.out, La.height) : kit.at(212, kit.halfWidth(212) + La.out, La.height);
    sl.every(0, () => fire('sluice', at.x, at.z, { open: true, pitch: 0.5, gain: 0.8, who: 'sluice' }));
    sl.every(30 / 60, () => fire('sluice', at.x, at.z, { open: false, pitch: 0.5, gain: 0.5, who: 'sluice' }));
    out.sluice = { machine: sl, at, open: () => sl.value };
    out.openSluice = (seconds, o) => arriveAt(sl, 0, seconds, o);
  });

  // ================================================================================================ the pours, made once
  part('the pours', () => {
    if (QS.get('mpour') === '0' || !pourDefs.length) return;
    pours = makePours(ctx, { pours: pourDefs, glow: 0.9, rings: false, exact: true, seed: 907 });
    if (pours.object) { pours.object.name = 'machine-pours'; if (sun && sun.solid) sun.solid(pours.object, false); }
    const v = new THREE.Vector3();
    pourMeta.forEach((m, i) => { pours.landing(i, v); m.x = v.x; m.z = v.z; });
  });
  const rndRing = ctx.rng(8500);
  ticks.push({ name: 'the pours on the river', fn(dt) {
    if (!pours) return;
    for (const m of pourMeta) {
      if (!m.wet || m.flow < 0.05) continue;
      if (m.dye > 0) grain(m.x, m.z, m.ch, m.dye * m.flow * dt, 0.5);
      if ((m.wait -= dt) <= 0) { m.wait = 0.22 + 0.2 * rndRing(); ring(m.x + (rndRing() - 0.5) * 0.3, m.z + (rndRing() - 0.5) * 0.3, m.ringOf[0] * (0.4 + 0.6 * m.flow), m.ringOf[1]); }
    }
  } });

  return {
    update(dtRaw) {
      const dt = Math.min(0.05, Math.max(0, dtRaw || 0));
      if (!(dt > 0)) return;
      for (const t of ticks) {
        if (t.dead) continue;
        try { t.fn(dt); } catch (e) { t.dead = true; console.error(`reach/cast_machines: ${t.name} stopped: ` + (e && e.stack || e)); }
      }
      stepBeads(dt);
    },
  };
}
