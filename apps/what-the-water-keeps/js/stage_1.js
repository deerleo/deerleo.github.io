// The landing: the route of moments, the showstopper and sound (stage 4; docs/build/landing/4-staging.md).
//
//   THE PASSAGE IN (the layout's, kept as it was; there is no veil: the picture fades up on the title view, the boat moored).
//     On 'Push off' the interface sends 'begin' and leaves the boat held (engine.frozen). Here: the mote of flame
//     leaves the kept lamp and crosses 14 m of water to the cold prow lantern in 7 s (the engine's flameCrossing, on
//     this area's own path: it comes down to skim the water, PLAN.crossing.low, and has a halo and a stroke for
//     daylight), the lantern catches, 2.6 s later the boat is let go, and while it is left alone the water eases it
//     from the staithe to d -4 by s 24 and on to the centre line by the bridge (PLAN.line). A rider who steers is
//     not held to it, and a rider who paddles or steers before the lantern has caught is let go at once (9 November:
//     held, a first rider took the boat for stuck); the flame follows the boat. &play=crossing sends the flame without
//     letting the boat go (postcard 2: &t=3.5).
//   THE PASSAGE OUT (the layout's; the door at s 75: nine cream cloths, kit.js; the veil is the reach's cream #f3ddb0).
//     ctx.wash(PLAN.door.wash, a) with a rising from 0 to 1 over the last 6 m, which the reach lets fall again.
//
// THE ROUTE (docs/art/landing.md, section 6), every moment begun by where the boat is (or by 'begin'). Cue names are
// what &play= takes; the numbers are N below.
//   crossing   'begin'    THE HUSH is added to the layout's crossing: the wind to a sixth (shared.landing.wind), seed stops
//                         leaving the stands, the swifts' party is held off, H1 leaves the cold lantern, the gaze is eased to
//                         the lamp (not with reduced motion; the rider's hand wins), wind and `night` to 0.1. THE CATCH: `bloom`
//                         on D3, the wind back, 1 s later the music arrives, 2 s later the painter slips (`knock`, `splash`),
//                         and the swifts are timed for their overtaking (with reduced motion they come by now, 9 m off)
//   afloat     s 15.5     a boat that never moored: H1 is not aboard, the music is in
//   rope       s 18       the wet rope is kicked, H4 lifts from M2, the rudd burst (its drops and their sound are the cast's)
//   lampnote   8 m        the engine's own `near` (lamp.onPass): the note and the two lamps brightening are the engine's;
//                         here the swarm by the tuft swirls up
//   (heron     s 26       cast.js's own cue; here only the rower's glance)
//   bridge     s 24.5     the swifts' party is timed to overtake the boat at 3 m and shoot the span while the boat is still
//                         short of s 32.5 (the birds' log: nearer the bridge a bird is pushed through the soffit; the guard
//                         in cast.js stays on). Their wind swings the traps (cast_lines.js) and the coil (shared.bridge.kickCoil)
//   bloom      s 37       THE SHOWSTOPPER, on one clock T (stage.clock, pushed by the page's own table of s against T):
//                         0 the water-light on the bridge (by place, growing from s 33); 1.5 the wings let go; 1.5 / 5.8 / 12
//                         the three zones begin (rings, flies, rises); 12 the swifts' nearest pass (when the boat is clear of
//                         the bridge), lanes in the dance; 13.5 twelve at the prow lantern; 19 the vesper flight, 120 spent;
//                         25 180 more; 102 the dance thins to 60 per cent. A boat that enters part-way gets the world as it
//                         is at that place (backdated) and the clock goes on from there
//   door       s 72.8     the prow meets the hems: `rustle`; again, softer, as the cloth closes over the rider at s 75
//   Sound by place: the wind's level from the reed wave at the boat (shared.cast.drift.crest); the music silent until the
//   catch, opening from s 34 to s 54; `shimmer` up with the wings; the far birds' voices stop with the vesper flight.
//   The rower looks at four things: the lamp while its flame crosses, the heron's way out, the wings letting go, the
//   vesper flight (each looked at from the seat, stage 5: docs/build/landing/5-critique.md).
//
// Developer switches: &stagelog=<name> prints every cue, beat and one-shot with the stage's time, the boat's s and speed,
// and the mayflies' counts every four seconds of the show (under PAGE ERRORS, as the cast's logs are; whole, in
// .shots/landing_stage_log_<name>.txt); &begin=0.5 with &drift=1 at the mooring pushes off half a second in, as the
// interface does, so that a strip shows the ride from the button to the cloth.
import * as THREE from 'three';
import { flameCrossing } from '../../engine/lamp.js';

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const table = (rows, x) => {
  if (x <= rows[0][0]) return rows[0][1];
  for (let i = 1; i < rows.length; i++) if (x <= rows[i][0]) { const [x0, y0] = rows[i - 1], [x1, y1] = rows[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  return rows[rows.length - 1][1];
};
const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const RAD = Math.PI / 180;

// The staging's own numbers (places and sizes are the plan's).
const N = {
  hush: { wind: 1 / 6, down: 1.5, up: 1.2, hold: 12, level: 0.1 },      // the wind's share; seconds down and back; the swifts held; wind and night's level
  gaze: { yaw: 3, pitch: 1, seconds: 2.5 },
  painter: 2.0,                                                         // seconds after the catch (the release is the plan's 2.6)
  music: { after: 1, over: 6, open: [34, 54], gain: 0.72, lowpass: 20000, width: 1 },
  rope: 18,
  // the swifts' overtaking: the boat must be this far short of the guard's zone until the party's tail (seconds) has shot
  // the span; the least warning (seconds) for a pass; seconds from the catch to the circuit's twelfth point (5, -60, 20),
  // behind the mooring and out of sight, for a boat left alone (it is at s 24.5 11.4 s after the catch, and the party
  // must then be at the circuit's first point, 76 m on; from that twelfth point it flies at its own speed, which is
  // what the guard in cast.js reckons with when it asks, 84 m short of the bridge, where the boat will be); with
  // reduced motion, where and when the party comes by after the catch (s, d, height, seconds)
  bridge: { s: 24.5, short: 1.0, tail: 2.2, lead: 2.2, fromCatch: 6.3, calm: [16, -1.5, 2.8, 4] },
  bloom: {
    s: 37, table: [[37, 0], [39, 1.5], [43, 5], [52, 12], [61, 19], [70, 25], [81, 31]],      // the page: T at s, drifting
    // (hatch.rate: the page's 9 rings a second left 458 of the 990 unborn when the boat reached the cloth and 175 of them in
    // the air at postcard 8; at 22 the counts are the page's: 1,240 in the air at T 16 and 1,560 at T 25. 4-staging.md)
    release: 1.5, zones: [1.5, 5.8, 12], hatch: { ramp: 4, rate: 22 }, rises: 2.5,
    party: 12, attend: 13.5, vespers: 19, spent: [[19, 120, 6], [25, 180, 10]], thin: 102,
    // the bridge's water-light: up from, to; down from, to; how much more (1.2 more could not be told from none, 9.6 more
    // was a gilded bridge: .shots/landing_stage_18_waterlight*.png)
    light: [33, 37.5, 45, 54, 3.0],
  },
  door: { touch: 72.8, letGo: 80 },
};

export async function build(ctx, plan, shared) {
  const P = plan, engine = ctx.engine, stage = ctx.stage, boat = ctx.boat, path = ctx.path, lamp = shared.lamp;
  const st = { moored: false, crossing: false, easing: false, gone: false }, prow = new THREE.Vector3(), loc = {};
  ctx.onDispose(() => { st.gone = true; });

  // ============================================================================ the route's hands (stage 4)
  // Every handle of the cast is asked for where it is used and every call is caught: a cast module that failed to
  // build, or a handle that throws, takes its own part out of a moment and nothing else.
  const C = shared.cast || {}, L = shared.landing || null, B = shared.bridge || null;
  const may = C.mayflies || null, sw = C.swifts || null, ins = C.insects || null, fish = C.fish || null, drift = C.drift || null, lines = C.lines || null, heron = C.heron || null;
  const calm = !!ctx.reducedMotion, LOG = QS.has('stagelog');
  const at = (s, d, y = 0) => P.at(path, s, d, y);
  // (&stagelog=<name>: the lines also go, whole, to .shots/landing_stage_log_<name>.txt, since the picture tool prints only eight)
  const logged = [], logFile = `/__shot/landing_stage_log${QS.get('stagelog') && QS.get('stagelog') !== '1' ? '_' + QS.get('stagelog') : ''}.txt`;
  let posting = false, dirty = false;
  const post = () => { if (posting) { dirty = true; return; } posting = true; dirty = false; fetch(logFile, { method: 'POST', body: logged.join('\n') + '\n' }).catch(() => {}).then(() => { posting = false; if (dirty) post(); }); };
  const say = (m) => {
    if (!LOG) return;
    const line = `t=${stage.time.toFixed(1)} s=${ctx.s.toFixed(1)} v=${(boat.speed || 0).toFixed(2)}: ${m}`;
    console.info('INVALID_ (log) stage ' + line); logged.push(line); post();
  };
  const tryDo = (what, fn) => { try { return fn(); } catch (err) { console.error(`landing stage: ${what} failed`, err); return undefined; } };
  const sound = (name, o = {}) => { tryDo(`the sound ${name}`, () => ctx.audio.play(name, o)); say(`sound ${name} gain ${o.gain ?? 1}${o.pitch ? ' pitch ' + o.pitch : ''}${o.note ? ' note ' + o.note : ''}${o.delay ? ' in ' + o.delay + ' s' : ''}`); };
  const glance = (p, seconds) => tryDo('the rower', () => { const r = engine.boat && engine.boat.model && engine.boat.model.rower; if (r && r.lookAt) r.lookAt(p, seconds); });
  const wind = L && L.wind ? L.wind.value : null, wind0 = wind ? wind.z : 1;
  const windTo = (k, seconds) => { if (wind) stage.tween(wind, 'z', k, seconds); };
  const gaze = { on: false, t: 0, y0: 0, p0: 0 }, lead = new THREE.Vector3();
  const target = () => engine.boat.model.light.getWorldPosition(prow);

  // ---- the swifts are never MOVED in the rider's sight (stage 5). The family's arrive() hurries or slows the party when
  // a third more or less speed will do, and otherwise puts it where it has to be, at once: the birds are gone from one
  // place and fade in at another. At the catch that was twelve birds vanishing from before the cloud, about 85 m off and
  // some 25 degrees left of the lamp the rider is looking at (the hands-off ride: the party 77 m from its mark). timeParty
  // asks first: if the party would have to be put elsewhere and any bird of it is in the picture (within 62 degrees
  // of the way the rider looks and nearer than 220 m), it is left as it is, and the next moment that times it (the
  // bridge cue, when the party is behind the boat) does it unseen. Places are the area's own, as everywhere in this file.
  const eyeP = new THREE.Vector3(), eyeD = new THREE.Vector3(), bird = new THREE.Vector3();
  const inSight = () => {
    if (!sw || !sw.party || !engine.camera) return false;
    engine.camera.getWorldPosition(eyeP); engine.camera.getWorldDirection(eyeD);
    for (let i = 0; i < sw.count; i++) {
      sw.position(i, bird); if (bird.y < -10) continue;
      bird.sub(eyeP); const d = bird.length();
      if (d > 0.01 && d < 220 && bird.dot(eyeD) / d > 0.47) return true;
    }
    return false;
  };
  const wouldMove = (where, seconds) => {      // (the family's own rule, birds.js arrive)
    const r = sw.party.routes && sw.party.routes[0]; if (!r) return false;
    const len = r.length, v = (sw.party.speed || 15) * (calm ? 0.8 : 1);
    let g = (r.nearest(where[0], where[1], where[2]) - sw.party.state.head[0] - v * seconds) % len; if (g > len / 2) g -= len; if (g < -len / 2) g += len;
    return Math.abs(g) > v * seconds * 0.34;
  };
  const timeParty = (where, seconds, what) => {
    if (wouldMove(where, seconds) && inSight()) { say(`${what}: the party would have to be moved in the rider's sight: left as it is`); return false; }
    sw.arrive(where, seconds); return true;
  };

  // ---- the hush (as the flame sets out) and the catch (as it arrives): added to the layout's crossing, below
  const hush = (from) => {
    st.hush = true; say('the hush');
    windTo(wind0 * N.hush.wind, N.hush.down);
    tryDo('the seed held', () => drift && drift.hush && drift.hush(true));
    tryDo('the swifts held off', () => sw && sw.hold && sw.hold(N.hush.hold));
    tryDo('H1 leaving', () => ins && ins.leave && ins.leave());
    if (!calm && engine.input) { gaze.on = true; gaze.t = 0; gaze.y0 = engine.input.lookYaw; gaze.p0 = engine.input.lookPitch; }
    glance(from, P.crossing.seconds);
  };
  const slip = () => {
    const p = lines && lines.painter;
    if (!p || p.state !== 'moored') return;
    tryDo('the painter', () => p.letGo()); say('the painter slips');
    const [x, , z] = at(16.9, -9.0); sound('knock', { x, z, gain: 0.3 }); sound('splash', { x, z, pitch: 1.2, gain: 0.4, delay: 0.45 });
  };
  const caught = () => {
    st.hush = false; say('the catch');
    sound('bloom', { note: 50, gain: 0.8 });
    windTo(wind0, N.hush.up);
    tryDo('the seed let go', () => drift && drift.hush && drift.hush(false));
    stage.after(N.music.after, () => { if (!st.music) { st.music = true; st.musicAt = stage.time; say('the music arrives'); } });
    stage.after(N.painter, slip);
    // (stage 5: no look at the prow lantern as it catches. The lantern is on the far side of the rider from where she
    // stands: the engine carries such a look 26 degrees clear, and from the seat that was her face turned full on the
    // rider for three seconds (.shots/landing_crit_12_gaze_crossing_head_crop.png, the frames at +7.2 to +9.6 s). She goes
    // on looking at the kept lamp, as she does by herself within 30 m of it.)
    // the swifts: left alone the boat is at the bridge cue 11.4 s from now, and the party is put on its circuit to suit
    // (N.bridge.fromCatch; if it is far from there it is moved, far off over the fen); with reduced motion it comes by now, down the
    // middle of the water 9 m off, and shoots the span while the boat is still short of s 20 (the guard's zone for
    // the calm rider begins at s 22.5 and ends at s 55.5: there is no overtaking near the bridge for them)
    if (sw && sw.party) tryDo('the swifts timed', () => (calm ? timeParty(at(N.bridge.calm[0], N.bridge.calm[1], N.bridge.calm[2]), N.bridge.calm[3], 'the catch') : timeParty(sw.circuit[11], N.bridge.fromCatch, 'the catch')));
    if (LOG && sw && sw.party) say(`the swifts timed at the catch: their head ${(sw.party.state.head[0] % sw.party.routes[0].length).toFixed(0)} m round the circuit`);
  };

  // ---- the passage in: the crossing, the catch, the release
  const release = () => {
    if (st.moored) { engine.frozen = false; st.moored = false; }
    st.easing = true;
  };
  // The mote is the engine's (flameCrossing). Its path is this area's: the engine carries it on a line from the lamp to
  // the prow lantern with an arc 0.6 m UP; here it comes down to skim the water (PLAN.crossing.low), so that from the
  // boat the flame and its reflection are a pair, and rises to the lantern at the end. The engine's mote is steered
  // onto that path through its moving target (it asks for `to` every frame). In daylight it also gets what the lamp
  // gets (set.js): a small orange halo in the direct view and a light for the mirror alone, from which the water
  // draws the stroke under it; both go as it nears the bow.
  const X = P.crossing, from = new THREE.Vector3(), steer = new THREE.Vector3(), mote = new THREE.Vector3(), aids = [];
  const easeT = (t) => t * t * (3 - 2 * t);
  const heightAt = (e, y0, y1) => { const low = X.low + (y1 - X.low) * sm(0.7, 1, e); return y0 + (low - y0) * sm(0, 0.4, e); };
  const aid = (o, where) => { const g = ctx.kit.glow({ position: [0, -50, 0], color: o[2], size: o[0], intensity: 1 }); ctx.only(g, where); g.visible = false; aids.push({ glow: g, base: new THREE.Color(o[2]).multiplyScalar(o[1]) }); };
  aid(X.halo, 'direct'); aid(X.stroke, 'mirror');
  stage.cue('crossing', { s: 1e9 }, () => {
    if (st.crossing || !lamp) return;
    st.crossing = true; st.t = 0;
    lamp.lantern.group.getWorldPosition(from); from.y -= 0.2;      // (lamp.position is not set before the lamp's first frame)
    tryDo('the hush', () => hush(from));
    const to = () => {
      const b = target(), e = easeT(st.t);
      if (e < 0.02) return b;
      // the engine puts the mote at from + (to - from) * e, plus sin(e pi) * 0.6 in height: ask for the `to` that lands it on our path
      steer.copy(b); steer.y = from.y + (heightAt(e, from.y, b.y) - Math.sin(e * Math.PI) * 0.6 - from.y) / e;
      return steer;
    };
    flameCrossing(engine, ctx, from, to, X.seconds).then(() => {
      if (st.gone) return;
      st.t = 2; for (const a of aids) a.glow.visible = false;
      ctx.lantern(1, 1.5);
      tryDo('the catch', caught);
      stage.after(X.release, release);
    });
  });
  // the interface says 'begin' when the rider pushes off from the mooring (src/ui.js). An engine listener outlives
  // the realm, so it answers only while this copy of the area is the one in the water.
  engine.on('begin', () => { if (st.gone || !ctx.active) return; st.moored = true; stage.fire('crossing'); });
  // (&begin=<seconds>, with &drift=1 at the mooring: a picture of the whole ride as the rider gets it. The boat is held as
  // the interface holds it and pushed off that many seconds in; the route's update keeps it held until then.)
  if (QS.has('begin')) { st.dev = true; stage.after(+QS.get('begin') || 0.5, () => { st.dev = false; st.moored = true; stage.fire('crossing'); }); }
  // a boat that is already past the mooring carries a burning lantern (a picture taken further on, or a rider who
  // came down from the head of the backwater without pushing off)
  stage.cue('lantern', { s: P.title.s + 1.5, settle: () => ctx.lantern(1, 0) }, () => { if (!st.crossing) ctx.lantern(1, 1.5); st.easing = true; });
  // and for such a boat the dragonfly is not on the lantern's crook and the music is already in
  const afloat = () => {
    if (!st.music) { st.music = true; st.musicAt = stage.time - 100; }
    if (!st.crossing) tryDo('H1 leaving', () => ins && ins.leave && ins.leave());
  };
  stage.cue('afloat', { s: P.title.s + 1.5, settle: afloat }, afloat);

  // ============================================================================ the route
  // ---- s 18: the wet rope. The bow passes M2 at 3 m: its wake sets the rope swinging (the cast quickens its drops and
  // sounds each one), the dragonfly lifts from the post's head, the rudd burst from under the rope.
  stage.cue('rope', { s: N.rope }, () => {
    say('the wet rope');
    tryDo('the rope kicked', () => lines && lines.wet && !lines.wet.dry && lines.wet.kick(calm ? 0.37 : 0.74));
    tryDo('H4 lifting', () => ins && ins.lift && ins.lift());
    tryDo('the rudd bursting', () => fish && fish.burst && fish.burst(0));
  });

  // ---- 8 m from the lamp: the lamp's note. The engine sounds A3 and brightens both lamps (makeKeptLamp's `near`) and
  // looks the rower's head to it; here the swarm by the tuft swirls up a metre and settles. It is a cue only so that
  // it can be played for a picture and asked after (stage.since('lampnote')); the lamp fires it.
  const stir = () => {
    if (stage.time - (st.stirAt ?? -9) < 1) return;                 // (played for a picture beside the lamp, the lamp's own `near` asks too)
    st.stirAt = stage.time; say("the lamp's note"); tryDo('the swarm stirred', () => may && may.stir && may.stir(0));
  };
  stage.cue('lampnote', { s: 1e9 }, () => { if (lamp && lamp.flare < 0.5) { lamp.flare = 1; engine.lanternFlare = 1; } stir(); });
  if (lamp && lamp.onPass) lamp.onPass(() => { if (!stage.done('lampnote')) stage.fired.lampnote = stage.time; stir(); });

  // ---- s 24.5: the whole bridge. The swifts' party overtakes the boat at 3 m and shoots the central span; the traps
  // and the coil swing in its wind. Nearer the bridge than 6.5 m a bird pushed off the rider's eye goes through the
  // soffit (the birds' log), so the pass is placed where the boat is still short of s 32.5 when the party's tail has
  // shot the span: at 1.2 m/s the party's head is abreast at s 28.0 and its tail at about s 30. A boat too fast for
  // that gets no pass here (the guard in cast.js would put it off anyway): the party comes through behind it when it
  // is clear of the bridge.
  const onRun = () => {      // is the party (its head, or its tail 30 m behind) coming down the water now? (cast.js asks the same for the hold)
    const r = sw.party.routes && sw.party.routes[0], c = sw.circuit; if (!r || !c) return false;
    const len = r.length, mod = (v) => ((v % len) + len) % len, head = sw.party.state.head[0];
    const entry = r.nearest(c[0][0], c[0][1], c[0][2]), exit = r.nearest(c[7][0], c[7][1], c[7][2]);
    return mod(head - entry) < mod(exit - entry) + 30;
  };
  if (LOG && sw && sw.party) stage.after(0.2, () => tryDo('the circuit said', () => { const r = sw.party.routes[0], w = at(28, P.lineAt(28) + 2.5, 2.3); say(`the circuit: ${r.length.toFixed(0)} m; its points at ${sw.circuit.map((c) => r.nearest(c[0], c[1], c[2]).toFixed(0)).join(', ')} m; the mark by s 28 at ${r.nearest(w[0], w[1], w[2]).toFixed(0)} m`); }));
  stage.cue('bridge', { s: N.bridge.s }, () => {
    if (!sw || !sw.party || st.gathered) return;
    if (calm) { say('the whole bridge: reduced motion, no overtaking here'); return; }
    if (tryDo('the party asked', onRun)) { say('the whole bridge: the party is on the water already'); return; }
    const vb = boat.speed || 0, vp = sw.party.speed || 15, limit = P.bridge.s - (2 * sw.party.keepOut + 0.5) - N.bridge.short;
    if (vb < 0.6) { if (tryDo('the swifts timed', () => timeParty(at(ctx.s + 2, P.lineAt(ctx.s + 2) + 2.5, 2.3), 4, 'the whole bridge'))) say('the whole bridge: a still boat, the party in 4 s'); return; }
    const sp = (limit - vb * (P.bridge.s / vp + N.bridge.tail)) / (1 - vb / vp), eta = (sp - ctx.s) / vb;      // where the head may be abreast at the latest
    if (eta >= N.bridge.lead) {
      const where = at(sp, P.lineAt(sp) + 2.5, 2.3);
      if (LOG) tryDo('the gap', () => {      // (how far the party is from where it has to be: within a third of the way it hurries or dawdles, else it is put there)
        const r = sw.party.routes[0], len = r.length; let g = (r.nearest(where[0], where[1], where[2]) - sw.party.state.head[0] - vp * eta) % len; if (g > len / 2) g -= len; if (g < -len / 2) g += len;
        say(`the whole bridge: the party is ${g.toFixed(0)} m from its mark (${Math.abs(g) <= vp * eta * 0.34 ? 'it hurries or dawdles' : 'it is put there'})`);
      });
      if (tryDo('the swifts timed', () => timeParty(where, eta, 'the whole bridge'))) say(`the whole bridge: the party abreast at s ${sp.toFixed(1)} in ${eta.toFixed(1)} s`);
    }
    else say('the whole bridge: the boat is too fast for a pass before the bridge');
  });
  // the swifts' sounds and their wind, chained after whatever was there (cast_lines.js has hung the traps' kick on onSpan)
  const call = (delay) => stage.after(delay, () => {      // one thin call from where the leader is by then, if that is more than 20 m off
    if (!sw || st.hush || (st.gathered && stage.time - st.gatheredAt > 6)) return;      // (their calls thin and stop as they gather)
    sw.position(0, lead);
    if (lead.y > -10 && Math.hypot(lead.x - boat.x, lead.z - boat.z) > 20) sound('bird', { x: lead.x, z: lead.z, pitch: 2.4, gain: 0.3 });
  });
  if (sw) {
    const pass0 = sw.onPass, span0 = sw.onSpan;
    sw.onPass = (m, x, y, z) => {
      if (pass0) tryDo('onPass', () => pass0(m, x, y, z));
      const dance = st.partyAt != null && !st.gathered;
      say(`the party passed the rider at ${m.toFixed(2)} m`);
      if (st.hush || stage.time < 1) return;                           // (the family reports a pass in the area's first frame, as the birds are put on their way)
      sound('flutter', { x, z, gain: dance ? 0.7 : 0.5 });
      if (dance) for (const d of [1.4, 2.3, 3.4, 4.8]) call(d);
    };
    sw.onSpan = (x, y, z, v) => {
      if (span0) tryDo('onSpan', () => span0(x, y, z, v));
      say('the party shot the span');
      tryDo('the coil kicked', () => B && B.kickCoil && B.kickCoil(calm ? 3 : 5, 6));
      const t = stage.since('bridge');
      if (t >= 0 && t < 14) { call(1.2); call(3.4); } else call(1.4);
    };
  }

  // ---- s 37: the river blooms. One clock; what it drives is in show() below.
  const Bm = N.bloom, F = (s) => table(Bm.table, s);
  const vespers = () => { st.gathered = true; st.gatheredAt = stage.time; say('the vesper flight'); tryDo('the swifts gathered', () => sw && sw.gather && sw.gather()); glance(at(96, -4, 22), 8); };      // (stage 5: the far side of the wheel, 30 to 40 degrees up; its centre (80, -4, 24) was at and beyond what her neck can do, her head thrown back for eight seconds)
  // the world as it is t seconds into the show: whatever lies more than a second and a half back is put there at once,
  // dated as it would have been (the family takes a time in the past); the rest is left to the beats
  const enter = (t) => {
    if (!(t > 0)) return;
    const ago = (when) => ctx.time - (t - when), past = (when) => t - when >= 1.5;
    say(`the show entered at T ${t.toFixed(1)}`);
    if (may) {
      if (past(Bm.release)) { const [x, , z] = at(P.bridge.s, 0); tryDo('the wings let go (dated)', () => may.release({ from: [x, z], at: ago(Bm.release) })); }
      Bm.zones.forEach((when, i) => { if (past(when)) tryDo('a zone begun (dated)', () => may.hatch(i, { ...Bm.hatch, at: ago(when) })); });
      for (const [when, n, secs] of Bm.spent) if (past(when)) tryDo('the spent (dated)', () => may.spend(n, secs, { at: ago(when) }));
      if (past(Bm.attend)) { tryDo('the lantern attended', () => may.attend(true)); st.attending = true; }
    }
    if (fish && fish.zones) Bm.zones.forEach((when, i) => { if (past(when) && fish.zones[i]) fish.zones[i].rate = Bm.rises; });
    if (past(Bm.vespers)) vespers();
  };
  let own = null;                    // a boat that entered beyond s 37: the clock goes on from where the page puts that place
  const showClock = () => {
    if (own) { own.v = Math.max(own.v + (stage.time - own.at), F(ctx.s)); own.at = stage.time; return own.v; }
    return stage.clock('bloom', F);
  };
  stage.cue('bloom', { s: Bm.s, settle: () => { const t = F(ctx.s); enter(t); own = { v: t, at: stage.time }; } }, () => { say('the river blooms'); enter(F(ctx.s)); });
  const beat = (key, T, when) => stage.beat('bloom.' + key, T, when);
  const show = (T, dt) => {
    // 1.5: the wings let go, in a wave from above the boat
    if (beat('release', T, Bm.release)) {
      say('the wings let go');
      tryDo('the wings let go', () => may && may.release(calm ? { speed: 4 } : {}));
      const [x, , z] = at(P.bridge.s, 0);
      for (let i = 0; i < 3; i++) sound('flutter', { x, z, pitch: 1.6, gain: 0.35, delay: i * 0.9 });
      // (stage 5: she looks up at the deck's downstream edge 4.5 m to starboard, where the wave of wings runs out along the
      // bridge, and turns her head after it as the boat goes by. She was aimed at the soffit straight over the boat's middle:
      // that point is behind her a second later, and from the seat she was a head bent back over her collar with no
      // face for three seconds: .shots/landing_crit_14_gaze_wings_crop.png)
      glance(at(P.bridge.s + 1.5, 4.5, 3.4), 3.5);
    }
    // 1.5, 5.8, 12 (the boat passing s 39, 44, 52): a zone begins: rings and flies (the mayflies), rises (the fish)
    Bm.zones.forEach((when, i) => {
      if (!beat('zone' + i, T, when)) return;
      say(`zone ${i} begins`);
      tryDo('a zone begun', () => may && may.hatch(i, Bm.hatch));
      tryDo('the rises begun', () => fish && fish.hatch && fish.hatch(i, Bm.rises, 4));
    });
    // 12: the swifts' nearest pass. The party is put 60 m behind the boat and comes through in four seconds: only when
    // the boat is clear of the bridge (the guard's zone, which cast.js cannot ask about so late), and not once they have gathered
    if (beat('party', T, Bm.party)) st.partyDue = true;
    if (st.partyDue && sw && sw.party && !st.gathered && ctx.s > P.bridge.s + 2 * sw.party.keepOut + 1) {
      st.partyDue = false; st.partyAt = T; st.partyTime = stage.time;
      const ahead = at(ctx.s + (boat.speed || 0) * 4 + 0.5, 0.5, 3);
      if (tryDo('the party asked', onRun)) say('the swifts are on the water already: they come as they are');      // (never moved while they are in sight)
      else if (tryDo('the swifts sent', () => timeParty(ahead, 4, 'the dance'))) say('the swifts are sent: abreast in 4 s');
    }
    // lanes in the dance where the two nearest swifts go
    if (st.partyAt != null && T < st.partyAt + 8 && may && sw && sw.party) {
      st.lane = (st.lane || 0) - dt;
      if (st.lane <= 0) {
        st.lane = 0.2;
        tryDo('the lanes', () => { for (const i of sw.party.nearest(boat.x, boat.z, 2)) { sw.position(i, lead); if (lead.y > 0 && lead.y < 6 && Math.hypot(lead.x - boat.x, lead.z - boat.z) < 22) may.part(lead.x, lead.y, lead.z, 1.2, 2); } });
      }
    }
    // 13.5: twelve gather at the prow lantern
    if (beat('attend', T, Bm.attend)) { say('the lantern attended'); tryDo('the lantern attended', () => may && may.attend(true)); st.attending = true; }
    // 19: the vesper flight (after the pass, if one is under way), and the first spent
    if (beat('vespers', T, Bm.vespers)) st.vespersDue = true;
    // (the party is 26 m long: its tail is past the boat first; by the stage's own time, since a rider who presses on pushes T)
    if (st.vespersDue && (st.partyAt == null || stage.time >= st.partyTime + 4.5 + 26 / ((sw && sw.party && sw.party.speed || 15) * (calm ? 0.8 : 1)))) { st.vespersDue = false; st.partyDue = false; vespers(); }
    for (const [when, n, secs] of Bm.spent) if (beat('spent' + when, T, when)) { say(`${n} fall spent`); tryDo('the spent', () => may && may.spend(n, secs)); }
    // 102 (ninety seconds of the dance): it thins to 60 per cent for a rider who stays
    if (beat('thin', T, Bm.thin)) tryDo('the dance thinned', () => may && may.strength(0.6, 10));
    if (LOG && may && (st.count = (st.count || 0) - dt) <= 0) { st.count = 4; say(`T ${T.toFixed(1)}: mayflies ${JSON.stringify(may.counts())}`); }
  };

  // ---- s 72.8: the door. The prow meets the hems (the cloth parts by itself: kit.js); and the cloth closes over the rider
  stage.cue('door', { s: N.door.touch }, () => { say('the door'); const [x, , z] = at(P.door.s, 0); sound('rustle', { x, z, gain: 0.6 }); });
  stage.cue('through', { s: P.door.s }, () => sound('rustle', { gain: 0.4 }));

  // ---- everything of the route that runs by the frame
  const wl0 = B && B.waterLight ? B.waterLight.gain.value : 1, bed = P.audio.ambience, M = P.audio.music;
  const WLX = QS.has('wl') ? +QS.get('wl') : 1;      // (&wl=8: eight times the rise of the bridge's water-light, to see that it is live)
  const route = (dt) => {
    if (ctx.active === false) return;                                       // (the reach has the water now: its sound is its own)
    const s = ctx.s, a = ctx.audio;
    if (st.dev || (st.moored && QS.has('begin'))) engine.frozen = true;      // (the developer's &begin: held until the release)
    // the gaze, eased to the lamp as the flame sets out; a hand on the view takes it back
    if (gaze.on) {
      const inp = engine.input; gaze.t += dt;
      if (!inp || inp.dragging || inp.lastLook + 0.15 < gaze.t) gaze.on = false;
      else {
        const k = easeT(Math.min(1, gaze.t / N.gaze.seconds));
        inp.lookYaw = gaze.y0 + (N.gaze.yaw * RAD - gaze.y0) * k; inp.lookPitch = gaze.p0 + (N.gaze.pitch * RAD - gaze.p0) * k;
        if (gaze.t >= N.gaze.seconds) gaze.on = false;
      }
    }
    // the rower watches the heron go (cast.js's cue): ONE look, at where it is going, once it has crossed the bow. (Stage 5:
    // she was aimed at the bird itself every half second from the moment it rose. It rises about 11 degrees to port of the
    // bow and is about 48 to starboard five seconds later (by the plan's numbers), so her head swept through the rider's eye, where the engine carries a
    // look aside, and went to and fro about it: .shots/landing_crit_11_gaze_heron_head_crop.png. Now she turns once, to
    // the place over the reed sea where its way out bends, the third point of its route, well to starboard, and the
    // bird flies through her look and away.)
    const th = stage.since('heron');
    if (heron && heron.left && heron.route && !st.heronLook && th > 1.8 && th < 6) { st.heronLook = true; glance(heron.route.via[2], 6.5); }
    // the show
    const T = showClock();
    if (T >= 0) show(T, dt);
    // the bridge's water-light: the bow wave reaches the towers (it grows from s 33, and is let down beyond the bridge)
    if (B && B.waterLight) B.waterLight.gain.value = wl0 * (1 + WLX * Bm.light[4] * (calm ? 0.6 : 1) * sm(Bm.light[0], Bm.light[1], s) * (1 - sm(Bm.light[2], Bm.light[3], s)));
    // the twelve do not follow the boat into the reach
    if (st.attending && s >= N.door.letGo) { st.attending = false; tryDo('the lantern left', () => may && may.attend(false)); }

    // ---- sound by place and by the show's clock (in pictures ctx.audio does nothing)
    if (st.hush) { a.layer('wind', { level: N.hush.level, tone: bed.wind.tone }, N.hush.down); a.layer('night', N.hush.level, N.hush.down); }
    else {
      const crest = drift && drift.crest ? drift.crest(boat.x, boat.z) : 0.5;                    // each wave of the reeds is heard arriving
      a.layer('wind', { level: Math.round((bed.wind.level - 0.1 + 0.2 * crest) * 40) / 40, tone: bed.wind.tone }, 1.2);
      a.layer('night', bed.night, N.hush.up);
    }
    a.layer('shimmer', T >= Bm.release ? 0.35 : bed.shimmer, 3);
    if (st.gathered) a.layer('birds', { ...bed.birds, level: 0 }, 12); else a.layer('birds', bed.birds, 2);
    if (!st.music) a.music({ gain: 0 }, 0.4);                                                    // silent under the title and through the hush
    else {
      const k = Math.round(sm(N.music.open[0], N.music.open[1], s) * 40) / 40, first = stage.time - st.musicAt < N.music.over;
      a.music({ gain: +(M.gain + (N.music.gain - M.gain) * k).toFixed(3), lowpass: Math.round(M.lowpass * Math.pow(N.music.lowpass / M.lowpass, k)), width: +(M.width + (N.music.width - M.width) * k).toFixed(3) }, first ? N.music.over : 3);
    }
  };

  return {
    update(dt) {
      // ---- the crossing: our copy of the engine's clock (this update runs before the engine's own step in every frame,
      // because the engine's step is added when the crossing begins), and the mote's daylight aids on the same path
      if (st.crossing && st.t < 1) {
        st.t = Math.min(1, st.t + dt / X.seconds);
        const e = easeT(st.t), b = target();
        mote.lerpVectors(from, b, e); mote.y = heightAt(e, from.y, b.y);
        const k = sm(2.2, 5.5, Math.hypot(mote.x - boat.x, mote.z - boat.z)) * sm(0, 0.06, st.t);
        for (const a of aids) { a.glow.visible = k > 0.01; a.glow.position.copy(mote); a.glow.material.color.copy(a.base).multiplyScalar(k); }
      }
      // ---- a rider who paddles or steers is not kept waiting for the flame: the boat is theirs from the moment they ask
      // for it. (The client, 9 November, his first ride: "there's an issue where it can't move at beginning. the user is
      // just stuck": the boat was held for the 9.6 s of the crossing and the catch, and nothing said so.) The painter
      // slips now; the flame goes on crossing to the prow lantern, wherever the boat has taken it. A rider who only
      // watches is still held until the lantern has caught, as before.
      if (st.moored && engine.frozen && engine.input && engine.input.enabled && (Math.abs(engine.input.throttle) > 0.05 || Math.abs(engine.input.steer) > 0.05)) {
        say('pushed off by hand');
        slip(); release();
      }
      // ---- left alone after the release, the boat is eased out to the composed line
      if (st.easing && !engine.frozen) {
        const q = path.locate(boat.x, boat.z, boat.s, loc), want = P.lineAt(q.s), off = want - q.d;
        if (q.s > 40 || boat.idle < 1.0 || Math.abs(off) > 3.2) { if (q.s > 40 || Math.abs(off) > 3.2) st.easing = false; }
        else { const v = Math.max(-0.55, Math.min(0.55, off * 1.1)) * Math.min(1, (boat.idle - 1.0) / 1.5); boat.x += q.rx * v * dt; boat.z += q.rz * v * dt; }
      }
      // ---- the passage out: our wash joins the reach's cream over the last 6 m
      const a = sm(P.door.s, P.door.s + P.door.over, ctx.s);
      if (a > 0) ctx.wash(P.door.wash, a);
      // ---- the route (stage 4). If it ever throws it is stopped and said, and the two passages above go on working
      if (!st.broken) { try { route(dt); } catch (err) { st.broken = true; console.error('landing stage: the route stopped', err); } }
    },
  };
}
