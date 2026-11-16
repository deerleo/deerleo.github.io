// The town below: the route of moments, the showstopper, sound (stage 4). docs/build/town/4-staging.md is this
// module's log; docs/art/town.md, sections 6 and 8, is its brief.
//
// Every moment is begun by the boat's place (the farthest s reached, or its distance to the tower), once, and then
// runs on its own clock. Each cue can be fired for a picture with &play=<name> (and &t=<seconds>):
//
//   window    s 8     the first window      more beads are let go from the first dormer's ridge (s 17.6, to port) and break the
//                                           surface in three rings as the prow comes by, each with its tick; `deep` comes up as
//                                           the veil's door opens
//   street    s 26    the street falls away the three lamp domes kindle (the Presences' own cue, tp-domes; begun here when the
//                                           moment is played by hand), a `bloom` under each; the music arrives
//   school    s 44    the first school      school A is let go up the street (the Fish group's own at s 44; here for &play);
//                                           the `flutter` under the hull as any ribbon passes, front to back; the rower looks
//             s 54    the bird              NOT HERE: the birds are another module's (cast_birds.js), with cues of their own
//   washing   s 73    washing street        the three lines lift as the hull comes over each (the Hangings' own); the air
//                                           caught under each line is let go as it fills: beads that break the surface. Played
//                                           by hand (&play=washing) the three lift in turn, 2.5 s apart
//   carp      s 96    the old carp          crosses the street's end right to left, 9 m down; `deep` swells by 0.1
//   nave      s 116   the nave lights       the pendulum's tick is heard from here on, far off (one every three seconds)
//   drop      s 146   the drop              for the rider who LINGERS here (still short of s 153 nine seconds on): the carp comes
//                                           up the square to port with its one rise, and turns away 14 m ahead; its `breath`.
//                                           A boat that goes on keeps the carp for the stroke (critique, stage 5: that pass lies
//                                           inside the stroke's ground and stood down the carp's turn for every moving rider)
//   ring      s 160   the hour ring         the tick at its full level
//   stroke    26 m from the tower's centre, or s 176: IT STRIKES ONE, on one show clock (see "the stroke" below)
//   poplars   s 204   the poplar road       the music closes back over 8 s
//   sleep     s 212   the square sleeps     rings closing on the tower over 12 s (the Presences' sleepAt on its own clock); the
//                                           lanterns sink back; the sedge flies go home
//   portico   s 218   the portico           a last slow ring from 12 m astern; it laps the six columns in turn, a set of rings
//                                           and a soft `drop` on each; the space closes to a room; the rower looks
//
// THE STROKE (38 s; T = stage.clock('stroke'), which a rider who presses on pushes forward: never less than (s - 172) / 1.2):
//   0     the warning    the Presences' stroke(T) from here on, every frame (the fly, the hands, the town's held breath, the
//                        bell, the waking ring, the settling); the sedge flies settle; `rustle`; the music dips 3 dB; the
//                        carp is put on its rising turn, beside the shaft, 19 m off and 8 m down (unless it is within
//                        18 m of the hull: the rider who lingered at the drop has it on its pass). A boat left to the
//                        current has it cross ahead of the bow at T 17, 5 m down, and pass to port from T 24 to 34,
//                        3.5 to 5 m off and rising (ridden and measured: docs/build/town/5-critique.md)
//   2.98  the stroke     the clapper meets the lip: `bell` D3 from the belfry and a copy from beneath; the lattice on the
//                        whole square for 6 s; a dozen drops fall from the bell and ring the water at the tower's foot
//   3     the waking     (the Presences' ring; its `bloom`); the music opens over 6 s
//   6     the letting go the lanterns let go behind a ring from the tower at 10 m/s; `breath`
//   9     the ring       one slow wide ring leaves the tower (it is not sent under reduced motion); the skiffs answer it
//   18    the rising     the sedge flies lift again (their move to the lanterns is taken out: it could not be seen);
//                        `shimmer` follows the number of lanterns that lie up
//   26    the carp       its one rise, asked by the fish's own place (as its middle comes 3.6 m to port of the composed
//                        line) on a 20 degree slope: its lips are at the surface 12 s on, 8.5 m off on the port quarter
// A boat PUT inside the stroke's place (a picture taken at s 186, a rider who comes back in) finds the hour rung: the
// hands past one and everything at rest. Reduced motion (&calm=1): the lattice at half strength, no slow ring to rock
// the hull; the waking front's longer rise is the Presences' own; every moment still happens.
//
// Sound moved from here (section 8): `deep` follows the depth under the keel (0.35 to 0.6); looking down past 20 degrees
// takes the music further under; the music opens at the stroke and closes after s 204; `shimmer` with the lantern
// ceiling; the space to a room under the portico. The one-shots are listed in the log, each with the event that fires it.
//
// Nothing here edits the cast: every handle is asked for and tried (call, below), and a handle that is missing or
// throws is reported once in the page's errors and the moment goes on without it.
//
// Developer switches:  &stlog=1  print each cue as it fires and the stroke's beats (as page errors, for the shot tool)
//                      &stcarpin=<seconds>  when the carp's snout is beside the shaft, after the warning (0.5; -3.5 under reduced motion)
//                      &stcarprise=s,d,y,tilt  where its rise is asked (its middle beyond s 180 and 3.6 m to port: d -3.6) and how steep (20)
//                      &stflies=1  send the sedge flies to the risen lanterns after all (&stflies=level,share,radius: with those)
//                      &stcensus=<seconds>  print the area's meshes, heaviest first, with their passes (&stcensusn=<how many>)
//                      the cast's own test switches (&tptest, &dprisen, &dpplay, &smtest, &bell) keep the stroke from
//                      firing by the boat's place, so that their held pictures stay as they were
import * as THREE from 'three';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const sm = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const RAD = Math.PI / 180;

export async function build(ctx, plan, shared) {
  const stage = ctx.stage, water = ctx.water, path = ctx.path, boat = ctx.boat;
  const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const LOG = Q.has('stlog');
  const say = (msg) => { if (LOG) console.error(`INVALID_ note (stage, &stlog): t ${ctx.time.toFixed(1)} s ${ctx.s.toFixed(1)}: ${msg}`); };
  const played = new Set(String((ctx.engine && ctx.engine.devPlay) || '').split(',').map((v) => v.trim()).filter(Boolean));
  const heldByTests = ['tptest', 'dprisen', 'dpplay', 'smtest', 'bell'].some((k) => Q.has(k));

  // ---- the cast's handles (any of them may be missing: a module that failed, or &skip=)
  const cast = shared.cast || {};
  const pres = cast.presences || null, domes = cast.domes || null, small = cast.small || null, sedges = cast.sedges || null,
    bubbles = cast.bubbles || null, fishes = cast.fishes || null, carp = cast.carp || null, lanterns = cast.lanterns || null,
    hang = cast.hangings || null, cloth = hang && hang.cloth, skiffs = hang && hang.skiffs;
  const failed = {};
  /** Try one of the cast's controls: a handle that is not there or throws is said once, and the moment goes on. */
  const call = (what, fn) => {
    try { return fn(); } catch (err) { if (!failed[what]) { failed[what] = true; console.error(`INVALID_ note (stage): ${what} did not answer: ${(err && err.message) || err}`); } }
    return undefined;
  };
  const has = (o, k) => !!o && typeof o[k] === 'function';
  const sound = (name, opts) => { const a = ctx.audio; return a ? a.play(name, opts) : false; };
  const at = (s, d = 0, y = 0) => path.point(s, d, y);
  const rower = () => (boat.model && boat.model.rower) || null;
  /** The rower notices what the rider is shown (four times along the route; she looks at the kept lamp by herself). */
  const rowerLooks = (p, seconds) => { const r = rower(); say(r ? `the rower looks for ${seconds} s` : 'no rower aboard to look'); if (r && typeof r.lookAt === 'function') call('rower.lookAt', () => r.lookAt(p, seconds)); };

  // ---- places
  const tw = shared.tower ? { x: shared.tower.x, z: shared.tower.z } : (() => { const p = at(plan.tower.s, plan.tower.d); return { x: p.x, z: p.z }; })();
  const bellAt = (() => {
    const t = shared.tower, v = new THREE.Vector3(tw.x, plan.tower.belfry.bell.y, tw.z);
    if (t && t.models && Object.values(t.models).some((m) => m && m.points && m.points.bell_lip)) call('tower.point(bell_lip)', () => t.point('bell_lip', v));
    return v;
  })();
  const columns = (() => {
    const list = shared.portico && shared.portico.columns;
    if (list && list.length) return list.map((c) => (Array.isArray(c) ? { x: c[0], z: c[1] } : { x: c.x, z: c.z }));
    const Po = plan.theatre && plan.theatre.portico; return Po ? Po.columns.map((d) => { const p = at(Po.s, d); return { x: p.x, z: p.z }; }) : [];
  })();
  const st = { T: -1, rung: false, first: true, down: false, musicKey: '', lap: null, shimmerAt: 0, shimmer: 0, flutterAt: -99, sipAt: -99, room: false, kissK: null };
  // the carp at the stroke (critique, stage 5): how many seconds after the warning its snout is on the up-route side of
  // the shaft (&stcarpin=), and where its one rise is asked (&stcarprise=s,d,y,tilt: its middle beyond s, to port of d,
  // shallower than y; the slope of its climb in degrees). No depth is asked by default: the family's rise reckons with
  // a fish that has sunk out of the hull's way
  const numQ = (k, d) => { const v = parseFloat(Q.get(k)); return Number.isFinite(v) ? v : d; };
  const CARP_IN = numQ('stcarpin', stage.calm ? -3.5 : 0.5);      // (under reduced motion the family's carp swims at 0.85 of its speed: put four seconds further on, or it crosses 2 m from the hull, sinks out of its way and rises far astern)
  // The flies over the risen lanterns (critique, stage 5): TAKEN OUT. small.toLanterns() does what its log says (fifteen
  // wheels had each a lantern by T 36: &smlog=lanterns), and nothing of it can be seen: a fly is 3 cm, pale, lit by the
  // lantern under it, over that lantern's own glow (light on light), from 5 to 20 m. Sending them only emptied the lamp
  // domes of the wheels that do show there. They stay over their own lights. &stflies=1 sends them as before, and
  // &stflies=level,share,radius gives small.toLanterns those three (tried 0.1,0.95,0.8: still nothing to see).
  const FLIES = (() => { if (!Q.has('stflies') || Q.get('stflies') === '0') return null; const v = String(Q.get('stflies')).split(',').map((x) => (x === '' ? NaN : Number(x))), o = {}; if (v.length > 1 && Number.isFinite(v[0])) o.level = v[0]; if (Number.isFinite(v[1])) o.share = v[1]; if (Number.isFinite(v[2])) o.radius = v[2]; return o; })();
  const CARP_RISE = (() => { const v = Q.has('stcarprise') ? String(Q.get('stcarprise')).split(',').map((x) => (x === '' ? NaN : Number(x))) : []; return { s: Number.isFinite(v[0]) ? v[0] : 180, d: Number.isFinite(v[1]) ? v[1] : -3.6, y: Number.isFinite(v[2]) ? v[2] : -99, tilt: Number.isFinite(v[3]) ? v[3] : 20 }; })();

  // ============================================================================================ the cast's hooks: sound
  // A ring that is drawn is a drop that is heard. Every one of these is fired by the event that draws the thing.
  if (small) small.onTouch = (x, z, kind) => { if (kind === 'pop') { sound('drop', { x, z, pitch: 1.6, gain: 0.4 }); if (!st.popSaid) { st.popSaid = true; say('a bubble breaks: drop (said once)'); } } };      // a bubble breaks (the module hands on two a second at most, within 14 m)
  if (fishes) fishes.onTouch = (x, z, kind, name, info) => {
    if (kind === 'pass') {                                 // a ribbon passes the hull: the page's flutter, front to back
      if (ctx.time - st.flutterAt < 6) return; st.flutterAt = ctx.time;
      sound('flutter', { x, z, lowpass: 500, gain: 0.5 }); say(`school ${name} passes the hull: flutter`);
      const h = boat.heading || 0, over = Math.min(5, Math.max(1.2, ((info && info.seconds) || 4) * 0.5));
      sound('flutter', { x: boat.x + Math.sin(h) * 6, z: boat.z + Math.cos(h) * 6, lowpass: 500, gain: 0.35, delay: over });      // and astern as it goes by
    } else if (kind === 'burst') sound('drop', { x, z, pitch: 1.8, gain: 0.2 });      // a shoal of fry bursts: five pin rings, one small drop
    else if (kind === 'sip' && ctx.time - st.sipAt > 2.5) { st.sipAt = ctx.time; sound('drop', { x, z, pitch: 2, gain: 0.12 }); }
  };
  if (carp) {
    carp.onNear = (x, z) => { sound('breath', { x, z, gain: 0.5, lowpass: 800 }); say('the carp within 7 m: breath'); };
    carp.onTouch = (x, z, kind) => { if (kind === 'sip') { sound('drop', { x, z, pitch: 0.6, gain: 0.5 }); say('the carp sips'); } };
  }
  if (pres) pres.onBloom = (x, z, what) => { sound('bloom', { x, z, note: 57, gain: 0.4 }); say(`bloom (${what})`); };      // a dome kindles; the waking ring leaves
  // the pendulum: its tick and drop as the bob meets the lake, heard from the nave on; the escapement's tooth, near only
  { const clock = pres && has(pres, 'onKiss') ? pres : shared.clock && has(shared.clock, 'onKiss') ? shared.clock : null;
    if (clock) {
      call('clock.onKiss', () => clock.onKiss((x, z) => {
        if (!stage.done('nave')) return;
        // (the page gives the far tick 0.3: at 70 m the engine's distance law takes 18 dB more and nothing is heard. It
        // sets out at 0.8 and comes down to the page's 0.5 by the hour ring, so that it only ever grows as the boat nears)
        const k = stage.done('ring') ? 1 : sm(116, 160, ctx.s);
        sound('tick', { x, z, pitch: 0.5, gain: 0.8 - 0.3 * k }); sound('drop', { x, z, gain: 0.25 });
        if (!st.kissSaid) { st.kissSaid = true; say('the bob meets the lake: tick and drop (said once)'); }
      }));
      if (has(clock, 'onTick')) call('clock.onTick', () => clock.onTick((x, z) => { if (Math.hypot(boat.x - x, boat.z - z) < 30) sound('tick', { x, z, pitch: 0.8, gain: 0.15 }); }));
    } }
  // washing street: the air caught under a line is let go as the cloth fills, and breaks the surface over it
  if (cloth) cloth.onLift = (x, z, k) => {
    say(`washing line ${k} lifts`);
    if (!has(bubbles, 'burst')) return;
    const rnd = ctx.rng(7800 + k);
    for (let i = 0; i < 5; i++) stage.after(0.9 + i * 0.5 + rnd() * 0.3, () => call('bubbles.burst', () => bubbles.burst(x + (rnd() - 0.5) * 3.2, -2.2, z + (rnd() - 0.5) * 1.2, 2, 0.25)));
  };

  // ============================================================================================ the route
  stage.cue('window', { s: 8 }, () => {
    say('cue window');
    const vent = small && small.chains && small.chains.find((c) => c.kind === 'vent');
    const p = vent && Math.hypot(vent.x - boat.x, vent.z - boat.z) < 16 ? vent : (() => { const q = at(ctx.s + 5.5, 2.6); return { x: q.x, y: -1.6, z: q.z }; })();
    if (has(bubbles, 'burst')) for (let i = 0; i < 5; i++) stage.after(0.3 + i * 0.4, () => call('bubbles.burst', () => bubbles.burst(p.x, Math.max(p.y, -2.2), p.z, 3, 0.2)));
    // Three rings where they break, to port of the prow as it comes by (the first dormer stands at s 17.6, d -3.7), each
    // with the page's tick: in the door's mist the rings are what is seen first, then the beads under them
    const pops = ctx.rng(808);
    [1.5, 2.3, 3.4].forEach((t) => stage.after(t, () => { const x = p.x + (pops() - 0.5) * 0.9, z = p.z + (pops() - 0.5) * 0.9; call('water.ripple', () => water.ripple(x, z, 0.5, 0.45)); sound('drop', { x, z, pitch: 1.6, gain: 0.4 }); }));
  });

  stage.cue('street', { s: 26 }, () => {
    say('cue street');
    // (the domes kindle from the Presences' own cue at this same place; played by hand before it, they are kindled here)
    if (played.has('street') && has(domes, 'kindle')) [0.6, 4.2, 7.8].forEach((t, i) => stage.after(t, () => call('domes.kindle', () => domes.kindle(i, 3))));
  });

  stage.cue('school', { s: 44 }, () => {
    say('cue school');
    const f = fishes && fishes.first;
    if (f && f.waiting && has(f, 'go')) call('fishes.first.go', () => f.go(2));
    // the rower notices the ribbon coming up the street to starboard (she can turn her head from 38 degrees to port
    // round to 116 to starboard of the bow and no further: every look of hers here is ahead or to starboard)
    stage.after(2.5, () => rowerLooks(at(ctx.s + 7, 5.5, -3), 8));
  });

  stage.cue('washing', { s: 73 }, () => {
    say('cue washing');
    // the hull's own passing lifts each line (cloth.auto); a picture that plays the moment lifts them by hand, in turn
    if (played.has('washing') && has(cloth, 'lift')) [0.3, 2.8, 5.3].forEach((t, k) => stage.after(t, () => call('cloth.lift', () => cloth.lift(k))));
  });

  stage.cue('carp', { s: 96 }, () => {
    say('cue carp');
    if (has(carp, 'go')) { call('carp.go(street)', () => carp.go('street', { in: 2 })); if (carp.skipped) say('the carp is near the hull: the crossing is let go'); }
  });

  stage.cue('nave', { s: 116 }, () => { say('cue nave'); });      // (the tick is heard from here: clock.onKiss, above)

  // (critique, stage 5) The pass beside the keel runs UP the square from s 188 to s 163.5: every metre of it lies inside
  // the stroke's own ground (the stroke fires at s 159.5). Sent from here at once, it met a boat left to the current at
  // s 168, nine seconds into the stroke, and the fish's own rule (it is never moved while it is within 18 m of the hull)
  // then stood down its rising turn round the shaft: a rider who drifted never saw the turn. No timing of this line
  // clears the stroke (the fish does 0.6 m/s, the boat 0.9: to be out of sight by the warning it would have to pass the
  // boat at s 148, inside the church). So the turn is the moving rider's carp, whole (see the stroke), and the pass is
  // kept for the rider who LINGERS at the drop: still short of s 153 nine seconds on (the current alone has a boat at
  // s 156 by then). That rider sees it come up the square with its one rise and turn away 14 m ahead.
  const sendPass = () => {
    call('carp.go(under)', () => carp.go('under', { in: 3, at: (carp.underAt && carp.underAt.ahead) ?? 1 }));
    if (carp.skipped) { say('the carp is near the hull: the pass is let go'); return; }
    st.carpPass = true; say('the carp is sent on its pass up the square');
    if (has(carp, 'rise')) stage.after(4, () => { call('carp.rise', () => carp.rise()); say('the carp is asked to rise on its pass'); });
  };
  stage.cue('drop', { s: 146 }, () => {
    say('cue drop');
    if (!has(carp, 'go')) return;
    if (played.has('drop')) { sendPass(); return; }      // (a picture that plays the moment: the pass at once, as the lingering rider gets it)
    stage.after(9, () => { if (ctx.s < 153 && !stage.done('stroke')) sendPass(); else say('the boat has gone on: the carp is kept for its turn at the stroke'); });
  });

  stage.cue('ring', { s: 160 }, () => { say('cue ring'); });      // (the tick at its full level: clock.onKiss, above)

  // ---- the stroke. It is fired by hand from update (26 m from the tower's centre, or s 176): see "the stroke's place".
  const strokeSettled = () => { st.rung = true; };
  stage.cue('stroke', { s: 1e9 }, () => {
    say('cue stroke: the warning');
    if (has(sedges, 'settle')) call('sedges.settle', () => sedges.settle(1, 2));
    sound('rustle', { x: tw.x, z: tw.z, pitch: 0.6, lowpass: 1500, gain: 0.6 });      // the whirr of the fly
    if (has(lanterns, 'tick')) call('lanterns.tick', () => lanterns.tick(0));
    if (has(lanterns, 'releaseBehind')) call('lanterns.releaseBehind', () => lanterns.releaseBehind({ at: 6, speed: 10, rag: 1, from: [tw.x, tw.z] }));
    // the carp: its snout on the up-route side of the shaft five seconds on (it is put on the turn behind the tower's
    // corner, 9 m down and beyond the clear window; a carp within 18 m of the hull is left where it is)
    // (critique: half a second on, not five. The boat does 0.9 m/s here and the fish 0.6 once it is up: sooner, it
    // crosses the composed line ahead of the bow and not under it, is nearer the beam when it takes its rise, and
    // keeps more than the 3 m from the hull inside which the family's carp sinks a metre and a half out of the way
    // (at one second a ride under reduced motion came inside that, and the rise fell ten seconds late). It is put
    // 18.5 m from the hull, 8 m down, as the town dims for the warning)
    if (has(carp, 'go')) { call('carp.go(stroke)', () => carp.go('stroke', { in: CARP_IN, at: (carp.strokeAt && carp.strokeAt.upRoute) ?? 6 })); st.carpOn = !carp.skipped; if (carp.skipped) say('the carp is near the hull: its turn is let go'); else say('the carp is put on its rising turn'); }
  });

  stage.cue('poplars', { s: 204 }, () => { say('cue poplars'); });      // (the music closes: update)

  stage.cue('sleep', { s: 212 }, () => {
    say('cue sleep');
    if (st.T >= 0 && st.T < 1e4 && has(lanterns, 'sink')) { call('lanterns.sink', () => lanterns.sink(st.T + 1.5, 10)); say('the lanterns are sent down'); }
    if (st.T >= 0 && st.T < 1e4 && has(small, 'fromLanterns')) call('small.fromLanterns', () => small.fromLanterns(8));
  });

  stage.cue('portico', { s: 218 }, () => {
    say('cue portico');
    // the page's last slow ring, issued 12 m astern on the centre line. The water's own ring travels slower than the
    // boat drifts here, so the lapping of the columns is timed from this place on the cue's own clock (update)
    const o = at(Math.max(0, ctx.s - 12), 0);
    call('water.ripple', () => water.ripple(o.x, o.z, 0.6, 3));
    const far = columns.map((c, i) => ({ i, x: c.x, z: c.z, r: Math.hypot(c.x - o.x, c.z - o.z) + 0.6 * Math.hypot(c.x - boat.x, c.z - boat.z) * 0.0 })).sort((a, b) => a.r - b.r);
    const r0 = far.length ? far[0].r : 0;
    st.lap = far.map((c, k) => ({ ...c, at: 3.0 + (c.r - r0) / 3 + 0.45 * k }));
    const f0 = path.at(ctx.s), star = far.find((c) => (c.x - boat.x) * f0.rx + (c.z - boat.z) * f0.rz > 1);      // the nearest column to starboard
    if (star) stage.after(2.2, () => rowerLooks([star.x, 1.2, star.z], 7));
  });

  // ============================================================================================ a census (critique, stage 6)
  // &stcensus=<seconds>: so many seconds in, print what the area submits, heaviest first, as notes: triangles (times the
  // instances), whether it is shown, whether its bounds are in the eye's view, and its passes (both = the direct view and
  // the water's mirror; direct; mirror). Measuring only: the perf probe gives totals and no names.
  if (Q.has('stcensus')) stage.after(numQ('stcensus', 2) || 2, () => {
    const camC = ctx.engine.camera, fr = new THREE.Frustum(), m4 = new THREE.Matrix4(), rows = [];
    camC.updateMatrixWorld(); m4.multiplyMatrices(camC.projectionMatrix, camC.matrixWorldInverse); fr.setFromProjectionMatrix(m4);
    ctx.group.traverse((o) => {
      const g = o.geometry; if (!g || !o.isMesh) return;
      let shown = true; for (let q = o; q; q = q.parent) if (!q.visible) { shown = false; break; }
      const n = g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0), cnt = Math.min(n, Number.isFinite(g.drawRange.count) ? g.drawRange.count : n);
      let inst = 1;
      if (o.isInstancedMesh) inst = o.count;
      else if (g.isInstancedBufferGeometry) { inst = Number.isFinite(g.instanceCount) ? g.instanceCount : 1e9; for (const k in g.attributes) { const at = g.attributes[k]; if (at.isInstancedBufferAttribute) inst = Math.min(inst, at.count * (at.meshPerAttribute || 1)); } if (inst === 1e9) inst = 1; }
      let inView = true;
      if (o.frustumCulled) { if (!g.boundingSphere) g.computeBoundingSphere(); const sp = g.boundingSphere.clone().applyMatrix4(o.matrixWorld); inView = fr.intersectsSphere(sp); }
      let name = o.name; for (let q = o.parent; !name && q; q = q.parent) name = q.name && `(in ${q.name})`;
      const top = g.boundingBox || (g.computeBoundingBox(), g.boundingBox), yTop = top ? top.max.y + o.matrixWorld.elements[13] : NaN;
      rows.push({ name: name || '?', tris: Math.round(cnt / 3 * inst), shown, inView, pass: o.layers.mask === 1 ? 'both' : o.layers.mask === 2 ? 'direct' : o.layers.mask === 4 ? 'mirror' : 'mask ' + o.layers.mask, culled: o.frustumCulled, yTop });
    });
    rows.sort((x, y) => y.tris - x.tris);
    const live = rows.filter((r) => r.shown && r.inView), sum = (list, f) => list.filter(f).reduce((t, r) => t + r.tris, 0);
    console.error(`INVALID_ note (stage, &stcensus): ${rows.length} meshes; shown and in view: ${live.length}, ${sum(live, () => true)} triangles once; in both passes ${sum(live, (r) => r.pass === 'both')}, direct only ${sum(live, (r) => r.pass === 'direct')}, mirror only ${sum(live, (r) => r.pass === 'mirror')}; in both passes with its top under the water ${sum(live, (r) => r.pass === 'both' && r.yTop < -0.05)}`);
    rows.slice(0, numQ('stcensusn', 40)).forEach((r, i) => console.error(`INVALID_ note (stage, &stcensus) ${String(i + 1).padStart(2, '0')}: ${r.tris} tris, ${r.pass}${r.shown ? '' : ', HIDDEN'}${r.inView ? '' : ', out of view'}${r.culled ? '' : ', never culled'}, top y ${Number.isFinite(r.yTop) ? r.yTop.toFixed(1) : '?'}: ${r.name}`));
  });

  // ============================================================================================ every frame
  const cam = ctx.engine && ctx.engine.camera;
  const lookedDown = () => { if (!cam) return false; const p = -cam.rotation.x; st.down = st.down ? p > 16 * RAD : p > 20 * RAD; return st.down; };
  const kissUniform = () => { const k = shared.clock && shared.clock.kissLight; const u = k && k.material && k.material.uniforms && k.material.uniforms.uCwKissK; return u && u.value ? u.value : null; };
  const rnd = ctx.rng(4176);
  const strike = () => {
    // the clapper meets the lip: one stroke; the lattice over the whole square; a dozen drops shaken from the bell
    say('the stroke: bell, lattice, drops');
    sound('bell', { x: bellAt.x, z: bellAt.z, note: 50 });
    sound('bell', { x: bellAt.x, z: bellAt.z, note: 50, delay: 0.25, lowpass: 300, gain: 0.7 });      // the same stroke from beneath
    if (typeof water.lattice === 'function') call('water.lattice', () => water.lattice({ x: tw.x, z: tw.z, radius: 36, hold: 6, color: '#FFE3C4', strength: stage.calm ? 0.25 : 0.5 }));      // (at 1, and still at 0.7, the lines beside the hull were broad white strokes; half of it under reduced motion)
    // (the gold on the kiss's own rings stands down while the lattice is on the same water)
    const u = kissUniform(); if (u) { if (st.kissK == null) st.kissK = u.x; stage.tween((v) => { u.x = v; }, u.x, st.kissK * 0.25, 1); }
    // the drops fall 16 m: 1.8 s; they land round the tower's foot, most of them on the side the boat is
    const fall = Math.sqrt(2 * Math.max(1, bellAt.y) / 9.81), toward = Math.atan2(boat.z - tw.z, boat.x - tw.x);
    for (let i = 0; i < 12; i++) {
      const a = toward + (rnd() - 0.5) * 3.6, r = 4.1 + rnd() * 1.6, x = tw.x + Math.cos(a) * r, z = tw.z + Math.sin(a) * r, loud = i % 3 === 0;
      stage.after(fall + (rnd() - 0.5) * 0.9, () => { call('water.ripple', () => water.ripple(x, z, 0.8, 0.7)); if (loud) sound('drop', { x, z, gain: 0.3 }); });      // (the size of the pendulum's kiss: stage 1 found that a ring under 0.7 m does not read on this water)
    }
  };

  return {
    update(dt, c) {
      const s = c.s, a = c.audio, toTower = Math.hypot(boat.x - tw.x, boat.z - tw.z);

      // ---- the stroke's place. A boat that ARRIVES within 26 m of the tower's centre (or at s 176) fires it; a boat that
      // was PUT further in than that (a picture, a rider who comes back in) finds the hour rung, as the engine does with
      // every cue that lies behind the boat at entry
      if (st.first) {
        st.first = false;
        if (!played.has('stroke') && !stage.done('stroke') && (s > 179 || toTower < 23)) strokeSettled();
      }
      if (!st.rung && !heldByTests && !stage.done('stroke') && (toTower <= 26 || s >= 176)) stage.fire('stroke');

      // ---- the stroke, on its one clock
      const T = st.rung ? 1e5 : stage.clock('stroke', (q) => (q - 172) / 1.2);
      st.T = T;
      if (T >= 0 && !heldByTests) {
        if (has(pres, 'stroke')) call('presences.stroke', () => pres.stroke(T));
        if (!st.rung) {
          if (has(lanterns, 'tick')) call('lanterns.tick', () => lanterns.tick(T));
          if (stage.beat('stroke.look', T, 2.2)) rowerLooks(bellAt, 9);
          if (stage.beat('stroke.clapper', T, (pres && pres.times && pres.times.clapper) || 2.98)) strike();
          if (stage.beat('stroke.letgo', T, 6)) { sound('breath', { x: tw.x, z: tw.z, lowpass: 800 }); say('the letting go'); }
          if (stage.beat('stroke.ring', T, 9)) {
            say('the slow ring');
            if (!stage.calm) call('water.ripple', () => water.ripple(tw.x, tw.z, 0.8, 3));      // it rocks the hull as it passes: not under reduced motion
            const u = kissUniform(); if (u && st.kissK != null) stage.tween((v) => { u.x = v; }, u.x, st.kissK, 4);
            if (!stage.calm && has(skiffs, 'rock')) call('skiffs.rock', () => skiffs.rock('all', 0.6, 46 / 1.6, [tw.x, tw.z]));      // the basin is 46 m from the tower
          }
          if (stage.beat('stroke.lift', T, 18) && has(sedges, 'settle')) call('sedges.settle', () => sedges.settle(0, 3));
          if (stage.beat('stroke.flies', T, 20)) {
            say(FLIES ? 'the rising: the flies to the lanterns' : 'the rising (the flies stay over their own lights)');
            if (has(small, 'toLanterns') && FLIES) call('small.toLanterns', () => small.toLanterns(FLIES));
            const q = at(ctx.s + 7, 4, -0.6);      // the rower looks at the water ahead to starboard, where the first lie up
            rowerLooks(q, 10);
          }
          // the carp's one rise, by the fish's own place and not by the clock (critique: asked at T 30 on the family's
          // 12 degree slope its lips reached the surface after T 46, far astern, or never: the line is shallow for 8 m
          // only, and that climb needs 14). Asked as its middle comes out to port of the composed line and level under
          // the surface, on a steeper slope, so that the sip falls at the line's shallowest place, abeam to port
          if (st.carpOn && !st.carpRose && has(carp, 'rise') && carp.place && carp.place.s > CARP_RISE.s && carp.place.d < CARP_RISE.d && carp.place.y > CARP_RISE.y) {
            st.carpRose = true; call('carp.rise', () => carp.rise({ tilt: CARP_RISE.tilt })); say(`the carp is asked to rise (T ${T.toFixed(1)}, its middle at s ${carp.place.s.toFixed(1)} d ${carp.place.d.toFixed(1)} y ${carp.place.y.toFixed(2)})`);
          }
          // (the rider who lingered at the drop has the carp on its pass up the square when the stroke comes: its turn
          // round the shaft is then let go by the Deep group's own rule, and its one rise was asked on that pass)
        }
      }

      // ---- the square's sleep on its own clock (a boat put beyond it keeps the set's own sleep, which goes by its place)
      const S = stage.clock('sleep', (q) => q - 212);
      if (S >= 0 && S < 1e4 && has(pres, 'sleepAt') && !heldByTests) call('presences.sleepAt', () => pres.sleepAt(S));

      // ---- the portico: the ring laps the six columns in turn
      const Pk = stage.clock('portico', (q) => (q - 218) / 1.6);
      if (Pk >= 0 && Pk < 1e4 && st.lap) for (const col of st.lap) if (stage.beat('portico.col' + col.i, Pk, col.at)) {
        const ang = Math.atan2(boat.z - col.z, boat.x - col.x);
        for (let k = -1; k <= 1; k++) call('water.ripple', () => water.ripple(col.x + Math.cos(ang + k * 1.9) * 1.05, col.z + Math.sin(ang + k * 1.9) * 1.05, 0.4, 0.5));
        sound('drop', { x: col.x, z: col.z, pitch: 0.6, gain: 0.4 });
        say(`the ring laps column ${col.i}`);
      }

      // ---- sound that goes by the boat's place and the show clock
      if (!a) return;
      // the low floor: the depth under the keel, coming up as the veil's door opens; the carp's crossing swells it
      const depth = -plan.floorAt(s), crossing = stage.since('carp');
      let deep = (0.35 + 0.25 * sm(10, 21, depth)) * (0.45 + 0.55 * sm(2, 12, s));
      if (crossing >= 0 && crossing < 40) deep += 0.1 * sm(0, 4, crossing) * (1 - sm(22, 30, crossing));
      a.layer('deep', Math.round(deep * 100) / 100, 3);
      // the music: arriving with the street; further under when the rider looks down; dipped for the warning; open from
      // the stroke to the poplar road; closed again behind
      const down = lookedDown();
      let key, part, over;
      if (stage.done('poplars')) { key = 'closed'; part = { gain: 0.62, lowpass: 500, half: 0.5, waver: 0.6 }; over = 8; }
      else if (T >= 3) {
        if (down) { key = 'open-down'; part = { gain: 0.7, lowpass: 1400, half: 0.4, waver: 0.2 }; over = 1.5; }
        else { key = 'open'; part = { gain: 0.8, lowpass: 3000, half: 0.15, waver: 0.2 }; over = st.musicKey === 'open-down' ? 1.5 : 6; }
      } else if (T >= 0) { key = 'warning'; part = { gain: 0.5, lowpass: 700, half: 0.4, waver: 0.6 }; over = 0.8; }      // (3 dB down: the half-speed copy comes down with it)
      else {
        const g = Math.round(0.62 * (0.78 + 0.22 * sm(18, 34, s)) * 50) / 50;
        if (down) { key = 'under' + g; part = { gain: Math.round(g * 0.8 * 50) / 50, lowpass: 420, half: 0.6, waver: 0.6 }; over = 1.5; }      // (the page's half 0.8 measured 3.8 dB LOUDER than the street's music, whatever the gain: the half-speed copy has a level of its own. 0.6 keeps it level: see the log)
        else { key = 'street' + g; part = { gain: g, lowpass: 700, half: 0.5, waver: 0.6 }; over = st.musicKey.startsWith('under') ? 1.5 : 3; }
      }
      if (key !== st.musicKey) { a.music(part, over); st.musicKey = key; }
      // the lantern ceiling: shimmer rises with the number that lie under the surface, and falls with them
      if (c.time >= st.shimmerAt) {
        st.shimmerAt = c.time + 0.5;
        const up = T >= 0 && T < 1e4 && has(lanterns, 'risen') ? (call('lanterns.risen', () => lanterns.risen()) || 0) : 0;
        const lvl = Math.round(0.3 * Math.min(1, up / 150) * 50) / 50;
        if (lvl !== st.shimmer) { st.shimmer = lvl; a.layer('shimmer', lvl, 4); }
      }
      // under the portico the space closes to a room
      if (!st.room && stage.done('portico')) { st.room = true; a.space({ size: 'room', mix: 0.5 }, 4); }
    },
  };
}
