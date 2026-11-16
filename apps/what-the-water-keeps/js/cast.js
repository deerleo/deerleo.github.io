// The landing: everything alive and moving (stage 3). THIS MODULE IS THE GROUP "BIRDS": the heron and the swifts
// (docs/build/landing/3-cast-birds.md). It is the first cast module, so it makes shared.cast; the other groups
// (cast_mayflies, cast_insects, cast_fish, cast_drift, cast_lines) add to it. It also keeps the page's cast as a list.
//
// The cast (docs/art/landing.md, section 5; counts at high quality; the toolkit is docs/life.md):
//   SMALL
//    1 seed down            2,600 in the air (to 12 m), 280 afloat; drifts with the wind toward the left rear, sinks, never rises
//                           or twinkles; puffs leave the reedmace stands on each wind crest. FORWARD-SCATTER RULE: shared.landing.SCATTER_GLSL
//    2 dragonflies          5 hawkers (four blue, one tawny female) and 24 blue damselflies. Perches: the prow lantern's crook (H1),
//                           the top of M2 (H4: shared.heroes.staithe.M2), a rail post of the bridge at d -3 (H5). Beats: the right
//                           reed edge s 6 to 34 at 1.2 m (H2); pad raft A (H3, the female, dabbing). Damsels: raft A, the gangway's
//                           hand line (shared.heroes.gangway.handLine), reed stems on the right
//    3 pond skaters         140 in five flotillas: the lee of the staithe (30), raft A (35), between gangway and jetty (25), the
//                           right edge s 8 to 24 (25), under the bridge by the inner left tower (25)
//    4 mayflies             before the hatch 210 dancing in three swarms: by the lamp tuft (32, -9.5), in the sun's reeds (36, +12.5),
//                           under the right of the bridge (38.5, +11); 600 at rest on the bridge's soffit, struts and piles for
//                           |d| < 16 (shared.bridge.soffit). After it up to 1,800 in the air and 300 spent on the water. Hatch zones:
//                           circles of 9.5 m radius at (49, 0), (59, 0), (69, 0)
//    5 drops                the wet rope on M2; the nine hems at s 75
//   MIDDLE
//    6 swifts               26: a racing party of 12 on the page's circuit (it shoots the bridge's central span every lap, keeping to
//                           |d| < 2.5 and 1.6 to 2.6 m up) and 14 high birds 25 to 55 m up about (40, -25).              HERE
//    7 fish                 60 rudd in two shoals (under the staithe, under raft A); one pike at (12.6, -9.5), 0.3 m down; rises
//    8 the heron            1, at PLAN.heron.at: (55.9, -11.3), not the page's (50, -12.2), which the prow's crook covers from the
//                           mooring; in 0.2 m of open water (PLAN.fen.heronPool, .lead: keep them open). At 47 m it is 11 pixels
//                           tall: only a dark bird against the bright lead reads.                                         HERE
//    9 ropes, traps, cloth  the wet rope (M2), the boat's painter (M1), nine hanging eel traps (kit.js: shared.kit.traps), the cloths
//   10 the standing plants  reedmace, iris, sedge, pads, withies (kit.js): sway, rock on the ripples, lean from the hull, close
//   11 flames and moths     the kept lamp and its 3 moths (engine: shared.lamp), the mote, the prow lantern
//   VAST
//   12 the reed sea         the travelling lean is already in shared.landing.plant (light.js); to come: stems that lean from the hull
//   13 the sky              the ceiling drifts and the tower's flank warms (set.js); nothing more to do here
//   14 the river blooming, and the vesper flight: rows 4 and 6 at their full (stage.js)
//
// WHAT THIS MODULE LEAVES FOR THE STAGER (shared.cast.swifts, shared.cast.heron): see the two blocks below, and the log.
//
// Developer switches: &birds=heron | party | high (comma list: build only these of the three; &birds=none builds none);
//   &swifts=0.3 puts the party's head that far round its circuit at load (0..1; 0 is the point (-14, 6, 9) behind the
//   mooring, the bridge is at about 0.13); &castlog=1 prints, every five seconds, how the party passed the bridge's
//   central span (the widest and highest any bird went) and how near any swift came to the eye.
import * as THREE from 'three';
import { makeFlock, figureEight } from '../../engine/life/birds.js';
import { makeWader } from '../../engine/life/waders.js';

const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
// ONE LINE EACH to switch a bird off (the brief: an empty place is better than a broken animal)
const HERON = true, PARTY = true, HIGH = true;
// the heron's paint: what its ash grey is multiplied by (linear), and how much of the area's rim it takes (&herontint=0.4,0.35,0.3,0.3 tries others)
const HT = (QS.get('herontint') || '').split(',').map(Number), HERON_TINT = HT.length >= 3 && HT.every((v) => v === v) ? HT : [0.30, 0.26, 0.22], HERON_RIM = HT.length >= 4 && HT[3] === HT[3] ? HT[3] : 0.15;
const HERON_FOG = QS.has('heronfog') ? +QS.get('heronfog') : 0.25;              // the share of the air's haze it takes (a far thing needs more contrast than a near one)

export async function build(ctx, plan, shared) {
  const L = shared.landing, P = plan, path = ctx.path, stage = ctx.stage;
  const cast = shared.cast = {};
  const at = (s, d, y = 0) => P.at(path, s, d, y);                              // the page's (s, d, height) as [x, y, z]
  const want = (name) => { const q = QS.get('birds'); return q == null ? true : q.split(',').includes(name); };
  const updates = [];

  // ================================================================================================ the heron (row 8)
  // makeWader: the rigged grey heron, life size (0.95 m standing, 1.85 m span), the sentinel (idle 'hunch') in the open
  // pool of the fen at PLAN.heron.at, side on to the mooring with its bill toward the channel, which is also within
  // 20 degrees of its way out. Every 9 to 14 s it reaches (held 3 to 6 s) or strikes; a step is taken rarely and only
  // while it still stands as it was placed (see `steps` below). When the boat passes s 26 it goes, once, by the
  // shortest way to cover: across the channel in front of the cloth at 2.5 m, over the right-bank reeds at 5.5 m,
  // through the sun's bloom, and down behind the reeds 150 m off.
  if (HERON && want('heron')) {
    const H = P.heron, [hx, , hz] = at(H.at[0], H.at[1]);
    const depth = Math.min(0.3, Math.max(0.08, -P.ground(path, hx, hz).y));        // the fen's floor where it stands (about 0.2 m)
    const bird = await makeWader(ctx, {
      species: 'heron', seed: 5, at: H.at, face: 'along', turn: -0.6, depth, roam: 0.6, idle: 'hunch',
      // the landing's light on it (the shade of the reeds and the cloth, a little of the flame-cream rim), and its ash
      // grey taken DOWN to a dark weathered grey that keeps out of three quarters of the air's haze, left as drawn by
      // the painter's filter: it is never nearer than 29 m; from the mooring it stands against the olive strip of the
      // turf bank behind it, and it flies across the lit cloth and the sun. The family's pale grey bird could not be
      // seen there at all (.shots/landing_birds_03_heron_far_crop.png; after: landing_birds_11_heron_far_fog2_crop.png)
      material: { color: new THREE.Color(HERON_TINT[0], HERON_TINT[1], HERON_TINT[2]), crisp: true,
        extend: [L.extend({ rim: HERON_RIM }), { fog: `fog *= ${HERON_FOG.toFixed(3)};` }] },
      life: { every: [9, 14], actions: { reach: 1, strike: 1, step: 0, preen: 0, alert: 0 } },
      marks: { step: [0.2, 0.3], strike: [0.7, 0.5], leap: [0.5, 0.6], wingtip: [0.5, 0.6] },
      onEvent: (name, b) => { if (name === 'leap') ctx.audio.play('flutter', { x: b.position.x, z: b.position.z, pitch: 0.5, gain: 0.6 }); },
    });
    const route = { via: [at(64, 0, 2.5), at(72, 14.5, 5.5), at(108, 42, 6.5)], to: at(190, 75, 1.2), speed: 10.5 };
    const heron = cast.heron = {
      bird, route, left: false,
      /** true: this module's own cue 'heron' sends it off when the boat passes s 26. The stager sets it false to do so itself. */
      auto: true,
      /** It goes for good, by its route (or one given: { via, to, speed, wait }). Once: a second call does nothing. */
      leave(o = {}) { if (!heron.left && bird.state !== 'gone') { heron.left = true; bird.leave({ ...route, ...o }); } return heron; },
      /** For a boat that starts further on (a cue's settle): it is not there. */
      hide() { heron.left = true; bird.hide(); return heron; },
      /** Back on its place, standing, as at load (for a rider who returns to the mooring, if the stager wants that). */
      show() { heron.left = false; bird.place(0); bird.show(); return heron; },
      /** Do something now: 'reach', 'strike', 'step' (bird.do). */
      do(...names) { bird.do(...names); return heron; },
    };
    if (QS.get('heron') !== 'stay') stage.cue('heron', { s: 26, settle: () => heron.hide() }, () => { if (heron.auto) heron.leave(); });
    else stage.cue('heron', { s: 1e9 }, () => heron.leave());                     // (&heron=stay: it stays wherever the boat is, to look at it from near; &play=heron still sends it off)
    // a step now and then, with the head held still and the foot pinned: the family turns the bird a little with every
    // step and never turns it back, so steps stop once it has turned 14 degrees from the way it was placed (side on to
    // the mooring, 47 m off, a heron seen end on is four pixels wide)
    const rnd = ctx.rng(58), h0 = bird.heading, wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    let stepIn = 20 + rnd() * 14;
    if (QS.has('castlog')) stage.every(5, () => { const q = path.locate(bird.position.x, bird.position.z, null, {}); console.info(`INVALID_ (log) t=${stage.time.toFixed(1)} heron: ${bird.state} (${bird.clip}), turned ${(wrap(bird.heading - h0) * 57.3).toFixed(0)} degrees from its facing, at s ${q.s.toFixed(2)}, d ${q.d.toFixed(2)}`); });
    updates.push((dt) => {
      if (heron.left || bird.state !== 'stand') return;
      stepIn -= dt;
      if (stepIn <= 0) { stepIn = 26 + rnd() * 16; if (Math.abs(wrap(bird.heading - h0)) < 0.25) bird.do('step'); }
    });
  }

  // ================================================================================================ the swifts (row 6)
  // makeFlock, species 'swift', drawn 57 cm across (1.36 times the family's 42 cm bird). They write nothing on the water.
  const swifts = cast.swifts = {
    party: null, high: null, circuit: null, count: 0, laps: 0, guard: true, gathered: false,
    /** Set by the stager: called once each time the party has passed the rider at its nearest: (metres, x, y, z). */
    onPass: null,
    /** Set by the stager: called each time the party's leader shoots the bridge's central span: (x, y, z, speed). */
    onSpan: null,
    place() { return swifts; }, arrive() { return swifts; }, hold() { return swifts; }, gather() { return swifts; }, hide() { return swifts; }, show() { return swifts; },
    position(i, out = new THREE.Vector3()) { return out.set(0, -50, 0); },
  };
  if (PARTY && want('party')) {
    // the page's closed circuit as (s, d, height): in from behind the mooring, down the water, under the central span
    // at 2.0 m (the opening is 8 m wide and 3.1 m high), up over the gate masts, round over the fen and back
    const circuit = swifts.circuit = [[-14, 6, 9], [4, 1, 4], [18, -2, 2.6], [30, -1, 2.2], [39, 0, 2.0], [52, 2, 2.4], [66, 0, 4], [75, -2, 11], [96, -20, 22], [80, -70, 30], [40, -90, 28], [5, -60, 20], [-20, -20, 14]]
      .map(([s, d, h]) => at(s, d, h));
    const start = QS.has('swifts') ? +QS.get('swifts') || 0 : 0.012;             // at load it is just past the page's first point: four seconds in (every postcard's moment) it is strung through the bridge's central span
    const party = swifts.party = makeFlock(ctx, {
      species: 'swift', count: 12, scale: 1.36, speed: 15, spacing: 1.9, jitter: 1.2, seed: 6, route: circuit, start,
      onPass: (m, x, y, z) => { if (swifts.onPass) swifts.onPass(m, x, y, z); },
    });
    swifts.count = party.count;
    /** Where bird i of the party is now (i < swifts.count): for the lanes it opens in the mayflies' dance. */
    swifts.position = (i, out = new THREE.Vector3()) => party.position(i, out);
    /** Put the party's head at u (0..1) of its circuit; time it to reach the point of its circuit nearest `at` in `seconds`. */
    swifts.place = (u) => { party.place(u); return swifts; };
    swifts.arrive = (where, seconds = 4) => { party.arrive(where, seconds); return swifts; };
    /**
     * Hold the party off (the hush): it will not come down the water for `seconds` from now. If it is on its way in it
     * dawdles, or is put back along its circuit where it is out of sight (behind and to the left, 14 to 30 m up);
     * birds already going down the water go on and are gone within six seconds.
     */
    swifts.hold = (seconds = 12) => {
      const r = party.routes[0], len = r.length, head = party.state.head[0], v = party.speed || 15, mod = (a) => ((a % len) + len) % len;
      const entry = r.nearest(circuit[0][0], circuit[0][1], circuit[0][2]), exit = r.nearest(circuit[7][0], circuit[7][1], circuit[7][2]);
      const inRun = mod(head - entry) < mod(exit - entry) + 30;                      // its head, or its tail 30 m behind, is on the low run now
      if (!inRun && mod(entry - head) / v < seconds) party.arrive(circuit[0], seconds);
      return swifts;
    };
    // the leader shooting the central span: for the traps' swing and a sound (and &castlog=1: how the whole party passed)
    const b0 = at(P.bridge.s, 0), b1 = at(P.bridge.s + 1, 0), tx = b1[0] - b0[0], tz = b1[2] - b0[2], q = new THREE.Vector3();
    const was = new Float32Array(party.count).fill(1), log = { wide: 0, high: 0, low: 9, birds: 0 };
    updates.push(() => {
      for (let i = 0; i < party.count; i++) {
        party.position(i, q);
        const along = (q.x - b0[0]) * tx + (q.z - b0[2]) * tz, side = -(q.x - b0[0]) * tz + (q.z - b0[2]) * tx;
        if (was[i] < 0 && along >= 0 && q.y < 6 && Math.abs(side) < 12) {
          if (i === 0) { swifts.laps++; if (swifts.onSpan) swifts.onSpan(q.x, q.y, q.z, party.speed); }
          log.wide = Math.max(log.wide, Math.abs(side)); log.high = Math.max(log.high, q.y); log.low = Math.min(log.low, q.y); log.birds++;
        }
        was[i] = along;
      }
    });
    // THE GUARD (swifts.guard; the stager sets it false to time the party itself). A bird that meets the rider's eye is
    // pushed round or OVER it (3 m; 8 m with reduced motion), and the push lasts twice that far along its way: if the
    // party shoots the span while the boat is within 6.5 m of the bridge (16.5 m with reduced motion) a bird goes
    // through the soffit (measured with &castlog=1&calm=1 at s 30: one crossed the deck's line 4.77 m up). So five
    // seconds before the party reaches the bridge (it is then behind and to the left, 14 to 20 m up) it is asked where
    // the boat will be, and if that is too near the bridge it is put back along its circuit until the boat has gone by.
    const sB = party.routes[0].nearest(circuit[4][0], circuit[4][1], circuit[4][2]), calm = !!ctx.reducedMotion;
    let asked = false;
    updates.push(() => {
      if (!swifts.guard || swifts.gathered) return;
      const r = party.routes[0], len = r.length, v = (party.speed || 15) * (calm ? 0.8 : 1), T = ((((sB - party.state.head[0]) % len) + len) % len) / v;
      if (T > 5.6 || T < 4.4) { asked = false; return; }
      if (asked) return;
      asked = true;
      const Z = 2 * party.keepOut + 0.5, vb = Math.max(0, ctx.boat.speed || 0), s0 = ctx.s, s1 = s0 + vb * (T + 2.2);      // where the boat is from now until the party's tail has passed
      if (s1 > P.bridge.s - Z && s0 < P.bridge.s + Z) party.arrive(circuit[4], Math.min(22, Math.max(7, vb > 0.25 ? (P.bridge.s + Z - s0) / vb + 2 : 14)));
    });
    // THE GUARD AT LOAD (stage 5). At load the party is 3.3 s short of the span, inside the 4.4 s at which the guard asks:
    // a boat that enters the area by the bridge (a picture taken from load between s 32 and 46; a rider put there) had
    // the party shoot the span over it, pushed off the eye into the soffit. In the area's first frame, if the boat is in
    // the guard's zone, the party is put a third of the way round instead (beyond the gate, 25 m up over the fen: where
    // it is once it HAS shot the span) and comes round 21 s later, when the guard asks as it always does. A boat at the
    // mooring is not touched, nor a party the developer placed (&swifts=).
    let entered = false;
    updates.push(() => {
      if (entered) return; entered = true;
      if (!swifts.guard || QS.has('swifts')) return;
      if (Math.abs(ctx.s - P.bridge.s) < 2 * party.keepOut + 1.5) party.place(0.33);
    });
    if (QS.has('castlog')) stage.every(5, () => console.info(`INVALID_ (log) t=${stage.time.toFixed(1)} swifts: ${log.birds} passes of the span, widest |d| ${log.wide.toFixed(2)} m, ${log.low.toFixed(2)} to ${log.high.toFixed(2)} m up (soffit ${shared.bridge ? shared.bridge.soffit(0).toFixed(2) : '?'}); nearest to the eye ${party.state.nearest.toFixed(2)} m; head at ${(party.state.head[0] / party.routes[0].length % 1).toFixed(3)} of ${party.routes[0].length.toFixed(0)} m`));
  }
  if (HIGH && want('high')) {
    // 14 feeding high on three lazy eights about (40, -25), 28 to 54 m up, 10 m/s (never low over the water: left out of the pre-pass)
    const [cx, , cz] = at(40, -25), turn = path.at(40, {}).heading || 0;
    swifts.high = makeFlock(ctx, {
      species: 'swift', count: 14, scale: 1.36, speed: 10, spacing: 9, jitter: 2.5, seed: 9, prePass: false,
      routes: [figureEight({ at: [cx, 30, cz], size: [72, 34], turn: turn + 0.4, rise: 8 }), figureEight({ at: [cx + 10, 40, cz - 18], size: [60, 30], turn: turn + 1.6, rise: 6 }), figureEight({ at: [cx - 14, 47, cz + 14], size: [80, 30], turn: turn + 2.6, rise: 6 })],
    });
  }
  /**
   * The vesper flight: all 26 into one wheel above the gate masts, climbing until they are gone (the page's numbers;
   * give others to change them: { at, radius, turn, climb, seconds, vanish }). They do not come back.
   */
  swifts.gather = (g = {}) => {
    const o = { at: at(80, -4, 14), radius: [17, 24], turn: 10.5, climb: 2.2, seconds: 8, vanish: 24, ...g };
    swifts.gathered = true;
    if (swifts.party) swifts.party.gather(o);
    if (swifts.high) swifts.high.gather(o);
    return swifts;
  };
  if (QS.has('hold')) stage.after(+QS.get('hold') || 2, () => swifts.hold(12));           // (&hold=2: the hush's hold two seconds in, to check it with &castlog=1)
  if (QS.has('vespers')) stage.after(+QS.get('vespers') || 1, () => swifts.gather());      // (&vespers=1: the vesper flight a second in, for a picture)
  /** For a boat that starts beyond the vesper flight (a cue's settle): no swifts. show() brings them back. */
  swifts.hide = () => { for (const f of [swifts.party, swifts.high]) if (f) f.object.visible = false; return swifts; };
  swifts.show = () => { for (const f of [swifts.party, swifts.high]) if (f) f.object.visible = true; return swifts; };

  return { update(dt) { for (const fn of updates) fn(dt); } };
}
