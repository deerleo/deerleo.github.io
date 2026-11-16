// The answering sea: the route of moments, the showstopper and the sound. STAGE 1 (layout) builds only the passage in
// (our half of it: the last rope from the fly tower); the staging is stage 4's. What the page (docs/art/sea.md,
// section 6) puts here, by s:
//
//    0 to 26   the dark         the veil; the prow lantern at a quarter; the rope's scribble behind; slow swell far off
//   26         first light      (cue 'firstlight' at s 14, set.js) exposure up over 8 s; the bow wave and wake light;
//                               fish dart away as sparks; dead ahead the amber spark in the gate's breathing arch
//   34         the comets       seven dolphins of light converge from 60 m and reach the bow in 7 s; until about s 76
//   46         the pipes wake   one crest is doubled: its light walks through the eleven stacks at about 4 m/s
//   68         the first slow firework   the dolphins drive into shoal 1 at (76, +8); they are gone by s 86
//   80         the gate breathes   three crests, each 1.8 times the usual: light floods the vault to its roof in
//                               1.5 s (drive shared.sea.uniforms.uSeaL.value.z from 0 to 1 and back), drips, petrels
//  108         the galaxy       small bells under the keel to 22 m; shoal 2; the first great jelly at (118, -4)
//  124         the whale beneath   (cue 'whale' at s 112, heroes.js) flukeprints, 25 m of whale under the bow,
//                               shoals 3 and 4, its swell, the buoy rung once with no wind
//  144         the weather turns   a thread of light on the left horizon (set.js brings the front in from 360 m to
//                               150 m between s 144 and 150), cat's-paws, three single drops, the petrels lift
//  150         the answering    THE SHOWSTOPPER, 36 s, on the clock shared.sea.T (cue 'answering', set.js). Its light is
//                               built: the front crosses, L rises, the sky answers, the current eases to 0.8 m/s.
//                               Its beats are staging's (the page's table, t 0 to 36): shoals 5 to 7 under the foot,
//                               the wreck's frames against fire, the floats, the buoy, the whale's blow, roll and
//                               flukes, the footprint and its ring, the lens filling, the beams; the eased gaze
//  196         under the tower  rain to 35 per cent by s 212 and L to 0.45 by s 216 (set.js, plan.rainBy / lightBy);
//                               a beam overhead every 14 s; the lamp's note at 7.2 m (the engine's)
//  224         the wall         shoal 8 in the cleft's mouth; the rain stops at s 236; the swell and the light die
//
// Sound (section 8): the realm file has the resting layers. Moved from update here: the gate's cavern and the deep in
// phase with the surge (s 84 to 110), shimmer from s 106, the deep for the whale, wind and rain from s 144, the glass
// at t 12, rain easing under the tower, the cleft. One-shots are fired by the event that draws them.
// Reduced motion (section 2): the front crosses in 20 s (set.js does), streaks at half count and two thirds speed,
// bursts over 3 s, beams still, exposure changes over 3 s or more.
//
// STAGE 4 (docs/build/sea/4-staging.md). Who begins what:
//   cues that were here        'firstlight' s 14 and 'answering' s 150 (set.js: the one show clock is shared.sea.T, and
//                              NOTHING here makes a second), 'whale' s 112 (heroes.js), 'comets' s 34 and 'firework' s 68
//                              (cast.js), 'petrels-gate' s 83, 'petrels-weather' s 144, 'petrels-wall' s 224 (cast_birds.js).
//                              The cast runs itself on them and tells its events; it plays no sound.
//   cues added here            'pipes' s 46 (one crest doubled), 'gate' s 80 (three great crests), 'galaxy' s 106 (the
//                              bells wake round the bow), 'weather' s 144 (the bell twice, the rags), 'cleft' s 236.
//   the showstopper's beats    read from shared.sea.T and from the events of what is drawn (the front's foot, the whale):
//                              the bell as the foot lights the buoy, the sparkle and the glass as the front arrives, the
//                              hush round the whale from its rising to its footprint, the bells woken by its ring, the
//                              rower's head, and the eased gaze of a rider whose hands are off.
//   sound                      every layer is reckoned each frame from where the boat is, the show clock and the cast's
//                              own numbers (so a ride entered part-way sounds as it should); a one-shot for every event.
// Switches for looking: &stagelog=<seconds> writes what was heard and where the layers stand by then (STAGE_PROBE,
// printed among the page's errors; it is not one); &gaze=1 eases the view in a picture as it does for a rider whose
// hands are off (&gaze=0: never); &hush=0 leaves the sound round the whale as it is everywhere else.
import { smooth, lerp } from './plan.js';

export async function build(ctx, plan, shared) {
  const { THREE, kit } = ctx, P = plan;
  // ---- the passage in, our half: the last rope from the fly tower, trailing its end in the water 2.5 m left of the
  // line at s 3 (docs/art/README.md; the theatre builds the tower). Built in code: a tube 6 m long, its tail frayed.
  // It is seen only by a rider who looks back; its end writes a faint scribble into the water's trace.
  const foot = kit.at(P.rope.at[0], P.rope.at[1], 0), top = foot.clone().setY(P.rope.length - 0.9);
  const curve = new THREE.CatmullRomCurve3([top, new THREE.Vector3(foot.x + 0.05, 2.2, foot.z - 0.05), new THREE.Vector3(foot.x + 0.12, 0.3, foot.z - 0.2), new THREE.Vector3(foot.x + 0.3, -0.06, foot.z - 0.75), new THREE.Vector3(foot.x + 0.42, -0.1, foot.z - 1.1)]);
  const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.035, 5, false), shared.sea.rock({ color: '#5a5448', rest: 0.3, pale: 0.6 }));
  rope.name = 'rope end (the passage in)'; ctx.add(rope);
  const end = new THREE.Vector3(foot.x + 0.3, 0, foot.z - 0.75);
  let t = 0;

  // ============================================================================================== stage 4
  const stage = ctx.stage, sea = shared.sea || {}, cast = shared.cast || {}, U = sea.uniforms || null;
  const whale = cast.whale || null, deep = cast.deep || null, edge = cast.edge || null, weather = cast.weather || null, birds = cast.birds || null, comets = cast.comets || null;
  const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const restOnly = params.has('rest'), hushK = params.get('hush') === '0' ? 0 : 1, logAt = +(params.get('stagelog') || 0);
  const DRONE = { gain: 0.2, half: 0.62, highpass: 20, lowpass: 420, reverb: 0.5, width: 1.3 };      // the realm's own resting music (src/realms/sea.js, `audio`): only the half-speed copy
  const DEG = Math.PI / 180, gateAt = kit.at(P.gate.s, 0), tower = shared.tower || null;
  const eng = ctx.engine, input = eng && eng.input;
  const gazeOn = !!input && params.get('gaze') !== '0' && !params.has('cine') && (!eng.dev || params.get('gaze') === '1');      // (in a developer's picture the view is the address's own, unless &gaze=1; the film's camera is its own)
  const rowerOf = (c) => (c.boat && c.boat.model && c.boat.model.rower) || null;                          // (nothing when she is ashore)
  const N = {
    pipes: { z: 0.5, seconds: [2, 11, 15], spray: 2 },      // the doubled crest: how much further the light runs up every foot (0.5: five times the set's own metre, the page's 5 m; at 0.16 the difference could hardly be told in a picture), over how long, and the spray's rate then
    gate: { z: 1.25, seconds: [1, 21, 24], rise: [0.55, 1.2], drain: 1.4, drips: 1.8, spray: 1.8 },      // three great crests (three periods of the swell): the most the vault's light is driven to (the set's own crest gives 1), its rise (calm: slower), the rates
    hush: { beneath: 0.6, near: 28, up: 1.2, down: 3, rain: 0.25, wind: 0.3, surf: 0.3, shots: 0.7, after: 4 },      // the quiet round the whale: how much of each is taken away while it is at the surface (beneath the bow: six tenths of that)
    gaze: { rate: 10, ease: 1.8, hands: 4, reach: 80 },      // the eased gaze: never faster than so many degrees a second; its time constant; seconds the view must have been left alone; a view parked further than this from where the show is, is left where it is
    swell: 4.5,      // m/s at which the whale's swell is taken to run out to the buoy (the cast's own hump travels 3.2: at that the one stroke came ten seconds on, three seconds before the weather's two)
    // (stage 5: bell 9 -> 5. The cast now lets the buoy's own strokes ring every 6 to 11 s, the page's rate, in the picture as in the sound (cast_edge.js, B.own):
    // nine seconds here on top of that left them 9 to 17 s apart. Five keeps one of its own from following a rung stroke at once.)
    splash: [1.6, 0.5], flutter: 1.2, bell: 5, drop: 0.35, bellWithin: 62, knockWithin: 75,      // the least seconds between two splashes of surf (while the pipes wake: the second), between two flurries of wings, between two strokes of the bell's own, between two vault drips (about); and how near the boat must be for the bell's own strokes and the shutter's knock to be heard at all (the cast tells them at any distance: from the first dark, 140 m off and beyond the gate, a bell every few seconds gave the buoy away, and the one stroke the whale's swell rings was one of many)
  };
  const S = { hush: 0, up: false, upUntil: -1, gate: 0, heard: {}, held: 0, lastSplash: -9, lastFlutter: -9, lastBell: -9, lastDrop: -9, rung: [], rungHeard: 0, bellQuiet: -9, ring: false, space: 'rest', music: 'rest', gazeLost: false, lastLook: 0, gazing: false, look: -9, looks: { beneath: 0, front: 0, surface: 0, lens: 0 }, spray: 1, drips: 1, mix: {}, said: false, moved: [] };

  const dropRnd = ctx.rng(4104);
  // ---- one-shots: every one is fired by the event that draws it, at its source. `quiet`: how much of the hush round the whale it takes (0: it is the whale's own)
  const say = (name, o = {}, quiet = 1) => {
    const g = (o.gain ?? 1) * (1 - N.hush.shots * quiet * S.hush * hushK);
    if (g < 0.05) { S.held++; return; }
    S.heard[name] = (S.heard[name] || 0) + 1;
    ctx.audio.play(name, { ...o, gain: Math.min(2, g) });
  };
  const expectBell = (...spans) => { for (const [from, until] of spans) S.rung.push({ from: ctx.time + from, until: ctx.time + until }); };      // a stroke of the bell that this module has asked for will come in each of these spans (seconds from now): one stroke to a span
  const bellGap = (edge && edge.numbers && edge.numbers.buoy && edge.numbers.buoy.gap) || 0.62;      // the cast's own seconds between two strokes rung on demand
  const flurry = (x, z, gain, pitch) => { if (ctx.time - S.lastFlutter > N.flutter) { S.lastFlutter = ctx.time; say('flutter', { x, z, gain, pitch }); } };
  if (comets) comets.onBlow = (x, z) => say('breath', { x, z, pitch: 2.2, gain: 0.45 });                                    // a dolphin's blowhole clears the water
  if (deep) deep.on('burst', (x, z, n, why) => say('sparkle', { x, z, pitch: 0.6, gain: 0.7 }, why === 'whale' ? 0 : 1));   // a shoal bursts (1: the dolphins; 2, 8: the bow; 3, 4: the whale; 5 to 7: the front's foot)
  if (birds) {
    birds.on('lift', (x, z, party, why) => flurry(x, z, why === 'weather' ? 1 : 0.8, 1));                                   // a party of petrels lifts
    birds.on('emerge', (x, y, z) => flurry(x, z, 0.7, 1.15));                                                               // the six leave the gate's crevices
  }
  if (edge) {
    edge.on('drop', (x, z, o = {}) => {                                                                                    // a vault drip lands near the boat (on the boat: a heavier plop). Forty places let a dozen fall a second while the gate breathes: three a second are heard, the nearest loudest, never in time
      if (!o.onBoat && ctx.time - S.lastDrop < N.drop * (0.6 + 0.8 * dropRnd())) { S.held++; return; }
      S.lastDrop = ctx.time; say('drop', { x, z, gain: o.onBoat ? 0.8 : 0.6 * (o.gain ?? 1), pitch: o.onBoat ? 0.8 : 0.9 + 0.3 * dropRnd() });
    });
    // a hammer strikes the buoy's bell. A stroke that was RUNG (the whale's swell, the weather's turn, the front's foot lighting the buoy) is always heard, at
    // the page's level. Where the set gives the buoy a push, a rung stroke is a hammer seen to strike and the cast tells it as one of the buoy's own: so the
    // strokes this module has asked for are known by when they come (expectBell). The buoy's own roll (the page: every 6 to 11 s; in the storm its four
    // hammers strike far oftener) is heard only from near, softer, and never as a peal
    edge.on('bell', (x, z, o = {}) => {
      const now = ctx.time; S.rung = S.rung.filter((w) => now <= w.until);
      const due = S.rung.findIndex((w) => now >= w.from), rung = !o.natural || due >= 0;
      if (due >= 0) S.rung.splice(due, 1);
      if (rung) S.rungHeard++;
      else if (now < S.bellQuiet || S.up || now - S.lastBell < N.bell || (o.distance ?? Math.hypot(x - ctx.boat.x, z - ctx.boat.z)) > N.bellWithin) { S.held++; return; }
      S.lastBell = now;
      say('bell', { x, z, note: o.note ?? 57, gain: Math.min(1, Math.max(0.6, o.gain ?? 0.8)) * (rung ? 1 : 0.8) }, rung ? 0.5 : 1.3);
    });
    edge.on('lit', (x, z, o = {}) => { if (o.kind === 'buoy' && cast.floats) for (let k = 0; k < cast.floats.autoBell; k++) expectBell([0.15 + k * bellGap * 0.88, 0.62 + k * bellGap * 1.18]); });      // the front's foot lights the buoy: its bell twice (the showstopper's t 10)
    edge.on('splash', (x, z, o = {}) => {                                                                                   // a crest strikes a foot within 30 m
      const waking = stage.since('pipes') >= 0 && stage.since('pipes') < N.pipes.seconds[2];
      if (ctx.time - S.lastSplash < N.splash[waking ? 1 : 0]) return;
      S.lastSplash = ctx.time; say('splash', { x, z, pitch: o.pitch ?? 0.7, gain: (waking ? 0.45 : 0.3) + 0.3 * (o.strength ?? 0.5) });
    });
    edge.on('knock', (x, z) => say('knock', { x, z, gain: 0.25, pitch: 1.3 }));                                             // the hull knocks a float or a dan aside
  }
  if (weather) {
    weather.on('drop', (x, y, z, o = {}) => say('drop', { x, z, pitch: o.pitch ?? 1.2, gain: 0.9 }));                       // the three first drops strike the sea
    weather.on('tick', (x, y, z, o = {}) => say('tick', { x, z, pitch: o.pitch ?? 0.5, gain: o.gain ?? 0.3 }));              // rain on the planks (four a second at most: the cast's own rule)
    weather.on('knock', (x, y, z, o = {}) => { if (Math.hypot(x - ctx.boat.x, z - ctx.boat.z) > N.knockWithin) { S.held++; return; } say('knock', { x, z, gain: o.gain ?? 0.3 }); });      // the shutter comes against its stay
    weather.on('lens', (x, y, z, o = {}) => {                                                                               // the lens begins to fill: a breath at the lantern, and the rower looks up to it
      say('breath', { x, z, pitch: o.pitch ?? 1.2, gain: o.gain ?? 0.9 }, 0);
      const r = rowerOf(ctx); if (r && tower && tower.lens) { r.lookAt(tower.lens, 7); S.looks.lens++; }
    });
  }
  if (whale) {
    whale.on('pass', () => { S.bellQuiet = ctx.time + 45; });                                                              // it has begun to pass beneath: from here until its swell has rung the buoy, the buoy's own hammers are not heard (the page: rung ONCE, with no wind)
    whale.on('call', (x, z) => say('whale', { x, z, note: 45, lowpass: 500, gain: 0.8 }, 0));                               // the one call, as its flukes pass under the boat's line
    whale.on('swell', (x, z) => {                                                                                           // its back is under the boat: its swell runs out to the buoy (rung once, no wind) and lifts the floats in turn
      const b = cast.buoy, f = cast.floats, far = b && b.at ? Math.hypot(b.at.x - x, b.at.z - z) : 30, wait = Math.max(1, (far - 2) / N.swell);
      S.bellQuiet = ctx.time + wait + 4;
      if (b) { b.ring(1, { speed: 0.3, delay: wait }); expectBell([wait - 0.05, wait + 0.45]); }
      if (f) f.sequence({ kind: 'lift', over: 3, delay: wait + 0.8, strength: 0.7 });
      S.moved.push('swell');
    });
    whale.on('emerge', (x, z) => { say('splash', { x, z, pitch: 0.7, gain: 1.2, always: true }, 0); S.up = true; S.upUntil = -1; });      // the head parts the water: from here to its footprint the sea is left to it
    whale.on('blow', (x, z) => say('breath', { x, z, pitch: 0.5, gain: 1.8, always: true }, 0));                                          // the blow
    whale.on('footprint', () => { S.upUntil = ctx.time + N.hush.after; S.ring = true; });                                   // the flukes have gone under: no sound (the page); its one long ring is on its way
    whale.on('gone', () => { if (S.up && S.upUntil < 0) S.upUntil = ctx.time + 1; });
  }
  if (cast.floats) cast.floats.autoBell = 2;      // the showstopper's t 10: the bell twice, as the front's foot lights the buoy (the event that draws it; with reduced motion the foot comes later, and the bell with it)

  // ---- the route's own cues (each begun by where the boat is; the cast's cues stand where the cast put them)
  stage.cue('pipes', { s: 46, settle() {} }, () => S.moved.push('pipes'));           // moment 3: one crest doubled (update drives it from stage.since: nothing is left behind it)
  stage.cue('gate', { s: 80, settle() {} }, () => S.moved.push('gate'));             // moment 5: three great crests (the same)
  stage.cue('galaxy', { s: 106, settle() {} }, () => {                               // moment 6: out of the gate the bells round the bow wake at once (the hull wakes those within 5 m by itself from here on)
    const b = ctx.boat, fx = -Math.sin(b.heading), fz = -Math.cos(b.heading);
    if (deep) deep.wakeNear(b.x + fx * 5, b.z + fz * 5, stage.calm ? 7 : 11);
    S.moved.push('galaxy');
  });
  stage.cue('weather', { s: 144, settle() { if (cast.rags && !restOnly) cast.rags.settle(1); } }, () => {      // moment 8: the dans' rags lift, the bell twice (the wind, the cat's-paws, the vane, the three drops and the petrels are the cast's own)
    if (restOnly) return;
    if (cast.rags) cast.rags.lift(0.55);
    if (cast.buoy) { cast.buoy.ring(2, { speed: 0.42, delay: 3.2, gap: 1.3 }); expectBell([3.15, 3.65], [3.15 + 1.3 * 0.88, 3.65 + 1.3 * 1.18]); }
    S.moved.push('weather');
  });
  stage.cue('cleft', { s: 236, settle() {} }, () => S.moved.push('cleft'));          // moment 11: the rain stops as if a door had closed (set.js); the sound follows in update

  const yawTo = (b, x, z) => { let a = Math.atan2(-(x - b.x), -(z - b.z)) - b.heading; a = Math.atan2(Math.sin(a), Math.cos(a)); return a / DEG; };      // degrees to the left of the bow at which a place lies
  const probe = (c) => {
    const r2 = (v) => (typeof v === 'number' ? +v.toFixed(2) : v), m = S.mix;
    console.error(`STAGE_PROBE t=${c.time.toFixed(1)} s=${c.s.toFixed(0)} T=${(sea.T ?? -1).toFixed(1)} heard: ${Object.keys(S.heard).map((k) => k + ' ' + S.heard[k]).join(', ') || 'nothing'}; held back ${S.held}`);
    console.error(`STAGE_PROBE layers: ${Object.keys(m).map((k) => k + ' ' + r2(m[k])).join(', ')}; space ${S.space}; music ${S.music}; hush ${r2(S.hush)}`);
    console.error(`STAGE_PROBE cues: ${Object.keys(stage.fired).map((k) => k + (stage.fired[k] === -Infinity ? ' (settled)' : ' ' + r2(stage.fired[k]))).join(', ')}; moved: ${S.moved.join(' ') || '-'}; rower ${rowerOf(c) ? 'aboard' : 'ashore'}, looked ${JSON.stringify(S.looks)}; gaze ${gazeOn ? (S.gazeLost ? 'given up' : S.gazing ? 'easing' : 'waiting') : 'off'} yaw ${input ? r2(input.lookYaw / DEG) : '-'}`);
    console.error(`STAGE_PROBE handles: ${['comets', 'sparks', 'seaLight', 'whale', 'deep', 'birds', 'edge', 'kelp', 'drips', 'spray', 'buoy', 'floats', 'rags', 'weather', 'catspaws', 'beams'].map((k) => k + (cast[k] ? '' : ' MISSING')).join(' ')}; uSeaL.z ${U ? r2(U.uSeaL.value.z) : '-'}; drips ${r2(S.drips)} spray ${r2(S.spray)}; whale ${whale ? whale.phase + ' ' + JSON.stringify((whale.log || []).map((e) => e[1] + '@' + e[0])).slice(0, 380) : '-'}`);
    console.error(`STAGE_PROBE bell: strokes told at ${edge && edge.afloat && edge.afloat.bellTimes ? edge.afloat.bellTimes.slice(-14).join(' ') : '-'}; of them rung and heard ${S.rungHeard}`);
  };

  return {
    update(dt, c) {
      t += dt;
      rope.visible = c.s < 17;                           // it hangs from the theatre's fly tower, which is not in this realm: it is only there while the veil is
      if (c.s < 40 && c.water.trace) { const a = t * 0.7; c.water.trace.inject(end.x + Math.sin(a) * 0.22, end.z + Math.sin(a * 1.7) * 0.3, { channel: 'glow', radius: 0.14, strength: 0.42, soft: 0.8 }); }

      // ============================================================================================ stage 4
      const s = c.s, boat = c.boat, calm = stage.calm, T = sea.T ?? -1, time = c.time, audio = c.audio;
      const front = sea.front, sd = front ? front.behind(boat.x, boat.z) : -1e5;      // metres the front's foot has gone past the boat (negative: it is still coming)
      const arrive = T < 0 ? 0 : smooth(-6, 10, sd);                                  // 0..1: the rain has reached the boat (set.js reckons its rain the same way)

      // ---- moment 3, the pipes wake: for one crest the light runs up every foot twice as far, and more spray is thrown where it strikes
      const tp = stage.since('pipes'), Np = N.pipes, pipes = tp < 0 || tp > Np.seconds[2] ? 0 : smooth(0, Np.seconds[0], tp) * (1 - smooth(Np.seconds[1], Np.seconds[2], tp));
      // ---- moment 5, the gate breathes: for three periods of the swell every crest that stands in the gate floods the vault to its roof
      // (set.js lets the gate's own crest drive the same number, uSeaL.z, to 1 while the boat is under the vault; here it is driven further, and from the approach)
      const tg = stage.since('gate'), Ng = N.gate, great = tg < 0 || tg > Ng.seconds[2] ? 0 : smooth(0, Ng.seconds[0], tg) * (1 - smooth(Ng.seconds[1], Ng.seconds[2], tg));
      const swellH = (c.waterLook && c.waterLook.swell) || 0, crest = swellH > 0.02 ? smooth(0.16, 0.7, c.water.heightAt(gateAt.x, gateAt.z) / Math.max(0.05, 0.5 * swellH)) : 0;
      { const want = crest * great; S.gate += (want - S.gate) * (1 - Math.exp(-dt / (want > S.gate ? Ng.rise[calm ? 1 : 0] : Ng.drain))); }
      if (U) U.uSeaL.value.z = Math.max(U.uSeaL.value.z, Np.z * pipes, Ng.z * S.gate);      // (after set.js has written it this frame: this module's update runs after the set's)
      { const sp = 1 + (Np.spray - 1) * pipes * (calm ? 0.5 : 1) + (Ng.spray - 1) * great * (calm ? 0.5 : 1), dr = 1 + (Ng.drips - 1) * great;
        if (cast.spray && Math.abs(sp - S.spray) > 0.01) cast.spray.rate = S.spray = sp;
        if (cast.drips && Math.abs(dr - S.drips) > 0.01) cast.drips.rate = S.drips = dr; }

      // ---- the whale: room and quiet. While it passes under the bow, and from the moment its head parts the water until its footprint
      // has been left, the sea's other sounds draw back; the one long ring of its footprint wakes the bells under the hull as it passes
      let hushTo = 0;
      if (whale) {
        if (S.up && S.upUntil >= 0 && time > S.upUntil) S.up = false;
        if (S.up) hushTo = 1;
        else if (whale.phase === 'beneath' && whale.active && whale.state && whale.state.fade > 0.25 && Math.hypot(whale.head.x - boat.x, whale.head.z - boat.z) < N.hush.near) hushTo = N.hush.beneath;
        if (S.ring && whale.lift(boat.x, boat.z) > (calm ? 0.04 : 0.1)) { S.ring = false; if (deep) deep.wakeNear(boat.x, boat.z, 7); S.moved.push('ring'); }
      }
      S.hush += (hushTo - S.hush) * (1 - Math.exp(-dt / (hushTo > S.hush ? N.hush.up : N.hush.down)));
      const hush = S.hush * hushK;

      // ---- the rower's head, at four of the route's moments and no more: the whale beneath, the front coming, the whale at the
      // surface, the lens filling (that one from the lens's own event, above). She looks at the kept lamp by herself.
      const rower = rowerOf(c);
      if (rower && time - S.look > 0.6) {
        if (whale && whale.active && ((whale.phase === 'beneath' && hushTo > 0) || (whale.phase === 'surfacing' && (S.up || whale.depth < 3)))) {
          S.look = time; rower.lookAt(whale.focus, 1.6); S.looks[whale.phase === 'beneath' ? 'beneath' : 'surface']++;      // (asked again every half second: what she looks at moves)
        }
      }
      if (rower && front && stage.beat('answer.rowerFront', T, 2.5)) { rower.lookAt([boat.x - front.nx * 90, 3, boat.z - front.nz * 90], calm ? 14 : 9); S.looks.front++; }      // the front, out to the left, until it is upon her

      // ---- the showstopper's own one-shot: as the front arrives over the boat (the page's t 12; later with reduced motion, with the front)
      if (T >= 0 && stage.beat('answer.arrive', sd, -2)) say('sparkle', { pitch: 0.6, gain: 0.8 });

      // ---- the gaze of a rider whose hands are off, eased (the page's staging rules): left for the front (t 2 to 12), to the whale
      // (about +20, then +30 for the flukes: wherever it really is), back to -10 for the lens at t 30, and home. A hand on the view at
      // any time and the show's gaze is given up for good; paddling or steering only makes it wait. Never with reduced motion.
      S.gazing = false;
      if (input) {
        if (input.dragging || input.lastLook < S.lastLook) { if (T >= 0 && T < 46) S.gazeLost = true; }
        S.lastLook = input.lastLook;
        let want = null;
        if (T >= 2 && T < 46 && !calm && !S.gazeLost) {
          if (T < 12.5) want = T < 9.5 ? 50 * smooth(2, 8, T) : lerp(50, 22, smooth(9.5, 12.5, T));
          else if (T < 30.5) want = whale && whale.active && whale.phase === 'surfacing' ? Math.min(42, Math.max(8, yawTo(boat, whale.focus.x, whale.focus.z))) : 22;
          else if (T < 39) want = -10;
          else want = 0;
        }
        if (gazeOn && want !== null && Math.abs(input.throttle) < 0.01 && Math.abs(input.steer) < 0.01 && input.lastLook > N.gaze.hands && Math.abs(want * DEG - input.lookYaw) < N.gaze.reach * DEG) {
          const cur = input.lookYaw, most = N.gaze.rate * DEG * dt;
          input.lookYaw = cur + Math.max(-most, Math.min(most, (want * DEG - cur) * (1 - Math.exp(-dt / N.gaze.ease))));
          S.gazing = true;
        }
      }

      // ---- the sound that moves: every layer from where the boat is, the show clock and the cast's own numbers
      const wind = weather && weather.wind ? weather.wind : null;      // (nothing if the weather did not build: then by where the boat is)
      const inGate = smooth(84, 87, s) * (1 - smooth(105, 110, s)), cleft = smooth(235.5, 237, s), turn = wind ? wind.turn : restOnly ? 0 : smooth(144, 150, s);
      const m = S.mix;
      // surf: the sea breathing on rock. Up as the pipes wake, loud in the gate, the open sound's own level, small in the cleft
      m.surf = lerp(lerp(lerp(lerp(lerp(0.5, 0.55, smooth(44, 50, s)), 0.7, inGate), 0.5, smooth(110, 126, s)), 0.35, restOnly ? 0 : arrive), 0.2, smooth(234, 238, s)) * (1 - N.hush.surf * hush);      // (under the rain it is a second layer: the rain is the bed)
      // deep: in the gate it follows the surge (the swell booms in the arch); for the whale it is the whale's own number (0.3 to 0.75 and back to 0.35)
      m.deep = (whale ? whale.deep : 0.3) + 0.25 * inGate * Math.max(0, edge && edge.swellAt ? edge.swellAt(gateAt.x, gateAt.z) : crest);
      // shimmer: the galaxy under the keel (0.22 where the water is fullest of bells), then the lit sea's glass (0.5, dying with the sea's light toward the wall)
      m.shimmer = Math.max(0.22 * smooth(104, 122, s) * (deep ? deep.galaxy : 1) * (1 - smooth(196, 216, s)), 0.5 * arrive * P.lightBy(s)) * (1 - smooth(236, 246, s));
      // wind: the weather's own wind (0.28 at rest, 0.55 once it has turned, 0.3 in the breath of stillness, 0.6 with the front, left outside the cleft)
      const windLevel = wind ? wind.level : lerp(0.28, 0.55, turn);
      m.wind = windLevel * (1 - N.hush.wind * hush); m.windTone = lerp(0.3, 0.55, turn);
      // rain: a hiss before anything is seen (0.12 from the weather's turn), growing as the front comes (0.35 as its foot nears), full as it
      // arrives (0.7), easing under the tower (0.35 by s 212, 0.2 by s 228), gone at the cleft as if a door had closed
      const hiss = T < 0 ? 0.12 * turn : lerp(0.12, 0.35, smooth(-140, -8, sd));
      m.rain = lerp(hiss, 0.7 * Math.pow(P.rainBy(s), 0.66), arrive) * (1 - cleft) * (1 - N.hush.rain * hush);
      if (restOnly) { m.rain = 0; m.shimmer = Math.min(m.shimmer, 0.22); }
      audio.layer('surf', m.surf, 2); audio.layer('deep', { level: m.deep, note: 26 }, 1.5); audio.layer('shimmer', m.shimmer, 3);
      audio.layer('wind', { level: m.wind, tone: m.windTone }, 2); audio.layer('rain', m.rain, 1.5);
      // the room: the gate is a cavern (in over 3 s, out over 5); the lit sea rings like one (over 6 s); the cleft
      const space = cleft > 0.5 ? 'cleft' : arrive > 0.5 && !restOnly ? 'lit' : inGate > 0.5 ? 'gate' : 'rest';
      if (space !== S.space) {
        if (space === 'gate') audio.space({ size: 'cavern', mix: 0.65 }, 3); else if (space === 'lit') audio.space({ size: 'cavern', mix: 0.7 }, 6);
        else if (space === 'cleft') audio.space({ size: 'cavern', mix: 0.5 }, 3); else audio.space({ size: 'open', mix: 0.3 }, 5);
        S.space = space;
      }
      // the music: only the half-speed drone until the rain; then it returns as glass (the upper half of the track in the long room); in the cleft back toward the drone
      const music = cleft > 0.5 ? 'cleft' : arrive > 0.5 && !restOnly ? 'glass' : 'rest';
      if (music !== S.music) {
        if (music === 'glass') audio.music({ gain: 0.85, half: 0.3, highpass: 240, lowpass: 20000, reverb: 0.9, width: 1.5 }, 8);
        else if (music === 'cleft') audio.music({ ...DRONE, lowpass: 700 }, 6);      // (the page's { half: 0.6, highpass: 20, reverb: 0.5 } would leave the track open at 0.85 with the copy laid over it: the loudest music of the area, in the cave)
        else audio.music(DRONE, 6);
        S.music = music;
      }

      if (logAt > 0 && !S.said && time >= logAt) { S.said = true; probe(c); }
    },
  };
}
