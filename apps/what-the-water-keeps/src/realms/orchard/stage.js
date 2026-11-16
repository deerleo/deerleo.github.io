// The orchard in flood: the route of moments, the two set pieces, the staged sound, reduced motion (stage 4).
// The log is docs/build/orchard/4-staging.md. What the page puts here (docs/art/orchard.md, section 6):
//
// Every moment is started by the boat passing a line, fires once, and then runs by the clock at natural speed. The
// page's `s` is its own frame (plan.js): a cue "at s 98" is  stage.cue('roost', { s: F.pathS(98) }, ...)  with
// F = shared.frame, because from the pond onward the engine's path runs about 10 m ahead of the page's s.
//
//   s 14    6 s    the bats leave: fourteen drop from the tie beams at s 16 and s 21 and go out through the door
//   s 26    -      the reveal (postcard 2): the veil clears, the exposure eases up (set.js), petals begin to fall on the
//                  prow, a far bird to the right, the music returns as one phrase, space from room to open (orchard.js)
//   s 40    5 s    the white trunk moves: the egret by the tree at (48.5, +19) stalks, strikes, lifts within 12 m
//   s 54    15 s   the carp: five dark backs come up the lane under the petals and turn aside in one boil; the crate rocks
//   s 60    -      (the stag sets off, far ahead on the left)
//   s 70    10 s   the evening air moves: a front of sway down the avenue at 6 m/s, a line of petals, the last far bird
//   s 84    -      under the crown (postcard 5): the pool, the lamp at s 96 (both lanterns brighten: the engine), F4
//   s 98    28 s   THE ROOST: the flock draws into a ribbon, goes once round the crown, pours down into it; the crown
//                  shivers lobe by lobe; the great petal fall closes the pond (shared.skin.set('pond', 0.2, 10), and
//                  ctx.waterLook.skin.close down to a quarter while it lasts) and puts out the lamp's reflection
//   s 108   -      within the roost: the egret on the daughter stem's mound lifts and flies west under the arch
//   s 140   -      the first fireflies: sixty scouts; the `night` layer rises (orchard.js has it by distance)
//   s 152   -      the hives: the last bees come in
//   s 160   36 s   THE SHOWSTOPPER, THE TIDE THROUGH THE TREES: the hush; one, three, forty; waves 1 to 4 (fronts 19 m
//                  deep travelling east at 14 m/s, ragged, a chevron on the water, climbing what they pass); the stag
//                  crosses in black inside his own ring of dark; the current eases to 1.2 m/s and returns (set.js sets
//                  the current by distance, PLAN.current: take it over here on the show clock)
//   s 184   12 s   the egrets go to the wall
//   s 204   -      the gate (postcard 9): the current picks up, the skin tears into rafts, the stag drinks
//   s 216   12 s   out: lilac mist, the orchard's light as a dim green breathing behind, then nothing
//
// Reduce motion (stage.calm): the fronts become a slow swell of the whole field; the flock stays beyond 60 m and enters
// the tree from the far side at half speed; petal counts halve; bats keep 10 m from the eye; the current does not change.
//
// Sound (page section 8): the bed is the realm's `audio` field and the two things that go by distance are in
// orchard.js (the space, the `night` layer); everything else is staged here: `wind` swelling to 0.6 for the flock's pass
// and falling to 0.1 for the hush, `shimmer` following each firefly front, the one-shots of the page's table, and the
// music's treatment in the two set pieces. The lamp's note (F4, 65) is the engine's.
//
// WHAT STANDS (stage 4, 8 November). The cues, by name (for &play=<name>), each at F.pathS of the page's s:
//   bats 14, reveal 26, egret 40, carpring 49.8, carp 54, stag 60, air 70, crown 84, roost 105, arch 108, fireflies 140,
//   hives 152, tide 160, wall 184, gate 204, out 216.
// TWO SHOW CLOCKS:  roost = max(seconds since its cue, (path s - pathS(105)) / 1.6)   tide = the same from pathS(160), / 1.2
// (THE ROOST BEGINS AT THE PAGE'S s 105, not 98, since the critique: ROOST.at says why; the cue list above reads 105 for it)
// (the clocks the flock, the stag and the fireflies were measured on). A picture of a set piece from where the rider is
// then: let the boat drift from just before the line (&s=<pathS - 1>&drift=1&t=<seconds>); with &play=<cue> on a boat
// that stands further on, the clock starts at what its place asks and the beats before that are not played.
// WHO IS TAKEN OVER (`staged = true`, set at the foot of build(), so that a failure here leaves them living by
// themselves): the flock (birds.roost.run), the stag (setOff, roost, tide), the carp (roll, release), the fireflies
// (level, scouts, tick, the calls and waves). The egrets are NOT: their module plays its own plain version of their
// moments (which is richer than its handles: the early birds to the wall, a retry every frame); a cue here calls a
// handle of theirs only when it was fired away from its place (&play=).
// Developer switch: &orlog=<name>.json writes what fired, when and where, and how many one-shots of each name were asked
// for, to .shots/<name>.json (every two seconds, the whole of it): how a ride is checked without ears.
// &orlantern=<x>: the bow lantern's level during the tide (TIDE.lantern), to compare.
// &orroost=<page s>: the roost begun at another place (98 is the page's; 105 since the critique: ROOST.at).  &orair=<count>: the petals asked of the evening air.
const Q = new URLSearchParams(location.search);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const num = (k, d) => (Q.has(k) && Q.get(k) !== '' && isFinite(+Q.get(k)) ? +Q.get(k) : d);
const q2 = (v) => Math.round(v * 100) / 100;                   // a level in steps of 0.01 (a layer is not told again for less)

// ---- the numbers of the staging (the page's, section 6 and 8; what is otherwise is argued where it stands and in the log)
const BIRDS_AT = [26, 37, 47, 58];                             // the far bird, four times by place; the fifth is the evening air's
const ROOST = {
  // WHERE IT BEGINS (stage 5, the critique): the page's s 98 put the ribbon's pass (4 to 11 s) and the pour over a boat that
  // is under the crown's east and south skirts, where the forward view is closed by the vault: a rider who looked ahead
  // saw no bird of the roost but a speckle in a corner at 15 s (orchard_crit_roost_ahead.png). Begun 7 m later, the same
  // flock on the same clock comes round low over the south-west as the boat clears the arch and the western sky opens in
  // the top of the forward view (9 to 12 s: orchard_crit_roost_at105_f07.png), and it pours into the west skirt over the
  // mouth of the second avenue as the boat comes to it (14 s: _f09.png). Nothing else was moved. &orroost=98 is the page's.
  at: 105, pace: 1.6,                                          // m/s of path that keeps a paddling rider's clock in step (the birds' own)
  stretch: 2.3,                                                // the roosting egret is told (its wings are open 2.7 s later: the page's 5 s)
  look: [9.5, 6],                                              // the rower looks to where the birds go in: from, for (seconds)
  wings: [4, 0.6, 10], leaves: [4.4, 1, 6],                    // `flutter` x 10 and `rustle` x 6 over 6 s from 4 s: first, seconds apart, how many
  wind: { level: 0.6, tone: 0.6, over: 4, until: 18, back: 1.5 },
  music: { gain: 0.45, from: 4, until: 19, back: 6 },
  pour: 11, pourFor: 7, pourForCalm: 14,                       // the birds' own times (cast_birds.js, FLOCK.times and FLOCK.calm)
  shiver: { amount: 0.25, calm: 0.1, foot: 7 },                // the crown shivers from its top down to this height as they pour
  fall: 12,                                                    // the great petal fall
  pond: [0.2, 10],                                             // shared.skin.set('pond', ...): the pond closes
  lanes: { to: 0.25, from: 12, hold: 22, back: 26 },           // the lanes close four times as fast while it lasts
  hush: 18, ticks: [[18, 12], [22, 6], [28, 3]],               // the fall's ticks a second, from these seconds
  stag: { listen: 11, on: 18, pace: 1.6, far: 30, near: 22, slow: 2.2 },      // his own three numbers (cast_stag.js), and when he is left alone (metres, metres, m/s)
  calmLate: [3, 7],                                            // reduced motion: the birds' first land and their last are in this much later (cast_birds.js): the fall, the hush
  stroke: [18, 8],                                             // the lamp's stroke goes out under the petals: from, over
};
const TIDE = {
  at: 160, pace: 1.2, len: 36,
  one: 3, three: 4.6, forty: 5.8,
  waves: [[7, 1], [14, 1], [28.5, 0.8]], lead: 1.5,            // from the wall: leaves at, strength; asked for `lead` seconds before
  meet: { at: 21, when: 23 },                                  // wave 3: two fronts that cross where the boat is
  steady: 37,
  stag: { into: 15.4, show: 23, out: 33.5 },                   // his own numbers (cast_stag.js): wave 2 passing him, wave 3 at the boat, out through row +10
  fall: 0.25,                                                  // the petal fall thins to a quarter
  current: 1.2, after: 2.0, ease: 4,
  // THE BOW LANTERN (a decision of the staging, 3-cast-presences.md "The bow lantern"): at full it lays its halo over the
  // middle of the avenue, where the stag crosses, and is the brightest warm thing in a picture that is about cool light.
  // Eased down for the tide and back after the last wave. 1 here leaves it alone.
  lantern: 0.4,
  music: { rest: 0.3, full: 0.82, highpass: 140, from: 20, over: 6, back: 8 },
  wind: 0.1, night: { to: 0.15, back: [7, 14] }, shimmer: 0.4,
  dips: [22, 24.4],                                            // a skimming bat comes down: its ring doubles wave 3's light
  out: 17,                                                     // beyond the wall: two more waves (8.5 s apart), then nothing
};

export async function build(ctx, plan, shared) {
  const LANTERN = num('orlantern', TIDE.lantern);              // (developer) &orlantern=<x>: the bow lantern's level during the tide, to compare
  const stage = ctx.stage, F = shared.frame, here = shared.here;
  if (!stage || !F || !here) return {};                        // (built without the set: there is no frame to place a cue in)
  const C = shared.cast || {};
  const falls = C.falls || null, B = C.birds || null, W = C.waders || null, carp = C.carp || null, stag = C.stag || null, L = C.fireflies || null, midges = C.midges || null;
  const flies = L && L.flies ? L.flies : null, blossom = shared.blossom || null, tree = shared.tree || null, plants = shared.plants || null;
  const AIR_PETALS = num('orair', 0);                          // (developer) &orair=<count>: the evening air's line of petals asked for at another count (the falls' own: 5250), to compare
  const ROOST_AT = num('orroost', ROOST.at);                   // (developer) &orroost=<page s>: the roost begun at another place, to compare
  const P = (s) => F.pathS(s), psRoost = P(ROOST_AT), psTide = P(TIDE.at);
  const _l = {}, pageS = () => plan.locate(ctx.boat.x, ctx.boat.z, _l).s;      // (a cue fires before set.js has written shared.here this frame)
  const st = { first: true, stagRoost: null, stagOn: false, roostHand: false, shivering: false, lanes: false, outT: 0, outDark: false, airUntil: -1, airRnd: ctx.rng(70), airDue: 0, tideOn: false, tideEnded: false, post: 0, sample: 0 };

  // ---- one thing that throws must not take the route with it: it is reported once, by name, and the rest carries on
  const failed = new Set();
  const call = (what, fn) => { try { return fn(); } catch (err) { if (!failed.has(what)) { failed.add(what); console.error(`orchard stage: ${what} threw: ${(err && err.stack) || err}`); } return undefined; } };

  // ---- the record (&orlog=<name>.json): what fired, when, where; the one-shots asked for, by name
  const LOG = /^[\w-]+\.json$/.test(Q.get('orlog') || '') ? Q.get('orlog') : null;
  const rec = { cues: [], beats: [], heard: {}, now: {}, columns: ['time', 'page s', 'roost clock', 'tide clock', 'wind', 'tone', 'night', 'shimmer', 'water', 'music gain', 'music highpass', 'current', 'fall density', 'pond', 'stag m'], series: [] };
  const note = (list, what, T) => { if (LOG) rec[list].push([+stage.time.toFixed(2), +pageS().toFixed(1), what, ...(T !== undefined ? [+T.toFixed(2)] : [])]); };

  // ---- sound. ctx.audio does nothing in a picture; every one-shot goes through here so that the record can count them
  // (`why` names the event for the record; `within`: a small sound of a living thing is not asked for from further off than that)
  const play = (name, o, why, within) => {
    if (within && o && o.x !== undefined && Math.hypot(o.x - ctx.boat.x, o.z - ctx.boat.z) > within) return;
    const key = why ? `${name} (${why})` : name; rec.heard[key] = (rec.heard[key] || 0) + 1;
    const a = ctx.audio; if (a && a.play) a.play(name, o);
  };
  const playAt = (name, p, o, why, within) => play(name, p ? { x: p.x, z: p.z, ...(o || {}) } : o, why, within);
  const farBird = (k) => { const p = F.at(pageS() + 58 + k * 3, 54 + k * 5); playAt('bird', p, null, 'far, to the right'); };      // 80 m and more, to the right

  // ---- the rower notices what the rider is shown (four moments, no more: the vault, the ribbon, the first wave, the stag)
  const lookTo = (p, seconds) => { const r = ctx.boat && ctx.boat.model && ctx.boat.model.rower; if (r && r.lookAt && p) call('rower.lookAt', () => r.lookAt(p, seconds)); };
  const flockAt = () => (B && B.flock && B.flock.centre ? call('flock.centre', () => B.flock.centre()) : null) || (tree && tree.top) || null;

  // ============================================================================================== the hooks the cast left
  // (a ring that is drawn is a drop that is heard: every one-shot of the page's table that belongs to a living thing)
  if (falls) falls.onTick = (x, z) => play('tick', { x, z, pitch: 0.3, gain: 0.3 }, 'a petal lands');                     // a petal landing within 5 m
  if (B && B.on) {
    B.on.batLeave = (x, y, z, i, k) => { if (k % 5 === 0) play('flutter', { x, z, gain: 0.5 }, 'bats leave'); };       // three of the fourteen, from the beams: overhead to ahead
    B.on.batDip = (x, z) => play('drop', { x, z, pitch: 1.6, gain: 0.3 }, 'a bat dips', 45);
    B.on.roost = (what) => {
      note('beats', 'birds:' + what);
      // the birds entering the crown: from the tree's position, three times while they pour
      if (what === 'pour' && tree && tree.top) for (const [wait, gain] of [[0, 1.4], [2.2, 1.2], [4.6, 1]]) stage.after(wait, () => playAt('rustle', tree.top, { gain }, 'the birds enter the crown'));
    };
  }
  if (W) {
    W.onEvent = (name, bird, i, info) => {
      if (name !== 'leap' && name !== 'land') return;
      const p = bird && bird.position;
      playAt('flutter', p, { gain: 1 }, 'an egret ' + name + 's'); if (info && info.wet) playAt('splash', p, { gain: 0.4 }, 'an egret ' + name + 's');
    };
    W.onTouch = (x, z, kind) => { if (kind === 'strike') play('drop', { x, z }, 'an egret strikes', 45); };
  }
  if (carp && carp.on) {
    carp.on('sip', (x, z) => play('drop', { x, z, pitch: 0.6, gain: 0.4 }, 'a carp sips', 30));
    carp.on('burst', (x, z) => play('drop', { x, z, pitch: 0.6, gain: 0.5 }, 'the carp turn', 40));                           // one for the boil, not six
    carp.on('roll', (x, z) => play('drop', { x, z, pitch: 0.45, gain: 0.3 }, 'a carp rolls', 40));
  }
  if (stag) stag.onTouch = (x, z, kind) => { if (kind === 'drink') play('drop', { x, z, gain: 0.4 }, 'the stag drinks', 45); else if (kind === 'quicken') play('splash', { x, z, gain: 0.4 }, 'the stag quickens'); };
  // (the `knock` of the crate, the plank and the baskets is heroes_b.js's own: shared.made.knocks)

  // ============================================================================================== the route
  const cue = (name, s, fn, settle) => stage.cue(name, { s: P(s), settle: settle ? () => { note('cues', name + ' (settled)'); call(`settle of ${name}`, settle); } : () => note('cues', name + ' (settled)') }, () => { note('cues', name); call(`cue ${name}`, fn); });

  // s 14, the bats leave. They let go by themselves as the boat passes (cast_birds.js has no handle to release them);
  // their three `flutter`s come from the hook above.
  cue('bats', 14, () => {});

  // s 26, the reveal: the far bird on the right. (The veil and the exposure are set.js's, the space is orchard.js's, the
  // petals begin by themselves under the first blossom; the music comes back in update(), by this cue.)
  cue('reveal', 26, () => farBird(0));

  // s 40, the white trunk moves: two stalking steps and a strike (its `drop` is the hook's; the flight is the bird's own)
  cue('egret', 40, () => { if (W) W.whiteTrunk(); });

  // s 54, the carp: a back rolls ahead of the bow, then the lane's five are let go and come up the lane
  if (carp) {
    cue('carpring', 49.8, () => carp.roll('lane'));
    cue('carp', 54, () => carp.release(3), () => carp.settle());
  }

  // s 60, the stag sets off
  if (stag) cue('stag', 60, () => stag.setOff(), () => stag.settle());

  // s 70, the evening air: the front of sway and its line of petals (falls), the plants under it, the midges leaning
  // downwind as it reaches them, the skin shivering under its line (update), `breath` ahead and then behind, two
  // `rustle`s as it passes the boat, the last far bird
  cue('air', 70, () => {
    const s0 = pageS(), calm = stage.calm;
    const len = (falls && falls.eveningAir ? falls.eveningAir(AIR_PETALS ? { petals: AIR_PETALS } : {}) : 0) || 11;
    // seconds until its line is at the bow: it comes on at its own speed and the boat goes to meet it
    const airSpeed = falls && falls.air ? falls.air.speed || 6 : 6, reach = falls && falls.air ? clamp(falls.air.reaches(s0 + 2) * airSpeed / (airSpeed + Math.max(0, ctx.boat.speed || 0)), 1, 12) : 5.5;
    st.airUntil = stage.time + len + 0.5;
    if (plants && plants.gust) { const more = calm ? 2 : 3; stage.tween((v) => plants.gust(v), 1, more, 2.5); stage.after(reach + 1.5, () => stage.tween((v) => plants.gust(v), more, 1, 4.5)); }
    if (midges && midges.lean) {
      const a = F.at(s0, 0), e = F.at(s0 - 10, 0).sub(a).normalize(), lean = calm ? 0.15 : 0.3;         // downwind: the way the boat came
      stage.after(Math.max(0.1, reach - 3), () => call('midges.lean', () => midges.lean(e.x * lean, e.z * lean, 3)));
      stage.after(reach + 3.5, () => call('midges.lean', () => midges.lean(0, 0, 4)));
    }
    // (each is asked for when it sounds, from where the boat then is: a one-shot asked for with a `delay` keeps every
    // other one-shot of its name from starting until it has sounded: src/engine/audio.js, play)
    playAt('breath', F.at(s0 + 40, 0), { gain: 1.2 }, 'the evening air');
    stage.after(Math.max(0, reach - 0.7), () => playAt('rustle', F.at(pageS() + 5, -10), { gain: 1.3 }, 'the evening air'));
    stage.after(reach + 0.8, () => playAt('rustle', F.at(pageS() - 3, 10), { gain: 1.3 }, 'the evening air'));
    stage.after(reach + 1.2, () => playAt('breath', F.at(pageS() - 22, 0), { gain: 0.8 }, 'the evening air'));
    stage.after(reach + 5, () => farBird(4));                                                            // the last: none after
  });

  // s 84, under the crown: the vault, the pool, the lamp (the engine's: both lanterns, its note). The rower looks up.
  // (stage 5: at the dome's very top her neck was at its stop and the seat saw the underside of her chin; she looks into
  // the vault six tenths of the way up)
  cue('crown', 84, () => lookTo(tree && tree.top ? [tree.top.x, tree.top.y * 0.6, tree.top.z] : null, 5));

  // s 98, THE ROOST: everything is on its clock, in update(). The world after it: the flock in the tree, the three
  // hundred on its limbs, the foredeck white, the pond closed, the lamp's stroke out.
  cue('roost', ROOST_AT, () => { st.roostHand = pageS() < ROOST_AT - 2.5; }, () => {
    if (B && B.roost) B.roost.settle();
    if (falls && falls.greatFallSettled) falls.greatFallSettled();
    if (shared.skin) shared.skin.set('pond', ROOST.pond[0], 0);
    shared.lampStroke = 0;
  });

  // s 108, within the roost: the egret on the daughter stem's mound. It is the flush itself (the boat comes within 14 m
  // at about s 107); a boat that has kept away from it sends it now, under the arch.
  cue('arch', 108, () => { const e = W && W.egrets && W.egrets[3]; if (e && e.where && e.where.place === 0) W.sendOn(3, { lane: 'LI' }); });

  // s 140, the first fireflies: all may light, sixty scouts do
  if (flies) cue('fireflies', 140, () => { flies.level(1, 4); flies.scouts(1, 3); }, () => { flies.level(1, 0.5); flies.scouts(1, 0.5); });

  // s 152, the hives: carp turn under the planks (the bees are their own; `night` is 0.15 louder near the stand: update)
  cue('hives', 152, () => { if (carp) carp.roll('walk'); });

  // s 160, THE TIDE THROUGH THE TREES: the hush begins here, everything else is on its clock, in update()
  cue('tide', 160, () => {
    st.tideOn = true;
    if (flies) flies.scouts(0, 1.5);
    if (falls) stage.tween(falls, 'density', TIDE.fall, 1.5);
    if (LANTERN < 1) ctx.lantern(LANTERN, 3);
  }, () => {
    // (a boat set down beyond the line, in the tide or after it: the stag keeps his own clock, which goes by the boat's
    // place, as his module does when nobody stages him; the fireflies get the steady waves)
    st.tideEnded = true; if (stag) stag.staged = false;
  });

  // s 184, the egrets go to the wall: theirs by place; by hand only when this cue is fired away from it
  cue('wall', 184, () => { if (W && pageS() < 181) W.toWall(); });

  // s 204, the gate: the current, the rafts, the drinking stag and the waves are already there; the water is heard (update)
  cue('gate', 204, () => {});

  // s 216, out: two more waves behind, then nothing (update: by the boat's place, so that a rider who turns back finds them)
  cue('out', 216, () => {});

  // ---- the tide's steady waves, once: one from the wall every 8.5 s at 60 per cent from the 37th second of the clock
  if (L && L.steady && flies) call('fireflies.steady', () => L.steady({ from: TIDE.steady }));

  // ---- the takeover, last (see the header)
  if (B) B.staged = true;
  if (stag) stag.staged = true;
  if (carp) carp.staged = true;
  if (L && flies) L.staged = true;

  // ============================================================================================== every frame
  const nightBase = (s) => (s < 134 ? 0 : s < 176 ? 0.45 * (s - 134) / 42 : s < 216 ? 0.45 : 0.45 * Math.max(0, 1 - (s - 216) / 20));      // orchard.js's own, by distance
  const wingKeys = Array.from({ length: ROOST.wings[2] }, (_, k) => 'roost.wing' + k), leafKeys = Array.from({ length: ROOST.leaves[2] }, (_, k) => 'roost.leaf' + k);
  const baseClose = plan.water && plan.water.lane ? plan.water.lane.close : 25;
  const beat = (key, T, at) => { if (stage.beat(key, T, at)) { note('beats', key, T); return true; } return false; };

  const roostNow = (T, calm) => {
    if (B && B.roost) B.roost.run(T);
    if (!(T >= 0 && T < 60)) return;
    // THE STAG stops and listens as the birds pour and walks on at the hush (his own control, stag.roost), but ONLY FOR A
    // BOAT THAT IS NOT PRESSING HIM. Measured (his own log of a ride, &staglog): a rider who paddles at 3 m/s through the
    // pond comes within 16.1 m of him as he lives by himself, and within 13.7 m if he is made to stand for the birds. So he
    // is asked only if, as the moment comes, he is `far` metres off or more and the boat is not being paddled; and while he
    // listens, a boat that comes within `near` metres or takes to the paddle ends it (his own "walk on", given early).
    if (stag && stag.roost && stag.position) {
      const R = ROOST.stag, d = Math.hypot(stag.position.x - ctx.boat.x, stag.position.z - ctx.boat.z), pressed = ctx.boat.speed > R.slow;
      if (st.stagRoost === null && T >= R.listen - 2.1) { st.stagRoost = T < R.listen + 1 && d >= R.far && !pressed; note('beats', st.stagRoost ? 'stag: listens' : 'stag: left alone', T); }
      if (st.stagRoost) {
        if (!st.stagOn && T >= R.listen - 1.8 && T < R.on - 3.8 && (d < R.near || pressed)) { st.stagOn = true; note('beats', 'stag: walks on early', T); }
        stag.roost(st.stagOn ? Math.max(T, R.on - 3.79) : T, R);
      }
    }
    // (with reduced motion the birds come in from the far side at half speed: their first land 3 s later and their last
    // 7 s later, cast_birds.js; what follows the birds here is put back by as much)
    const lateFall = calm ? ROOST.calmLate[0] : 0, late = calm ? ROOST.calmLate[1] : 0;
    // 2.3 s: one of the roosting egrets opens both wings at 5 s (by itself when the boat came by the line)
    if (beat('roost.stretch', T, ROOST.stretch) && st.roostHand && W) W.stretch();
    // 4 s on: the ribbon goes round the crown and over the boat: wings and leaves, panned along its path
    // THE ROWER (stage 5, re-aimed and re-timed). At 4.5 s she was sent to the flock's middle, which is then over the dome
    // and behind her: her neck went to its stop and the seat saw the back of her head (orchard_crit_gaze_sheet.jpg, second).
    // She now looks, as the ribbon comes round low ahead, at the west skirt where the birds go in: ahead of the bow and up.
    // Not with reduced motion: that flock goes in on the far side of the tree, behind her.
    if (beat('roost.look', T, ROOST.look[0]) && !calm) lookTo(B && B.roost && B.roost.into && B.roost.into.at ? B.roost.into.at : null, ROOST.look[1]);
    for (let k = 0; k < wingKeys.length; k++) if (beat(wingKeys[k], T, ROOST.wings[0] + k * ROOST.wings[1])) playAt('flutter', flockAt(), { gain: 1.5, pitch: 0.92 + 0.05 * (k % 4) }, 'the flock');
    for (let k = 0; k < leafKeys.length; k++) if (beat(leafKeys[k], T, ROOST.leaves[0] + k * ROOST.leaves[1])) playAt('rustle', flockAt(), { gain: 1.4 }, 'the flock');
    // 11 s on: the crown shivers lobe by lobe from the top down as the birds pour
    if (blossom && blossom.shiver && tree && tree.top) {
      const pf = calm ? ROOST.pourForCalm : ROOST.pourFor, k = smooth(ROOST.pour, ROOST.pour + 1.2, T) * (1 - smooth(ROOST.pour + pf - 1.5, ROOST.pour + pf + 0.5, T));
      if (k > 0.002) { st.shivering = true; blossom.shiver(lerp(tree.top.y, ROOST.shiver.foot, clamp((T - ROOST.pour) / pf, 0, 1)), (calm ? ROOST.shiver.calm : ROOST.shiver.amount) * k); }
      else if (st.shivering) { st.shivering = false; blossom.shiver(40, 0); }
    }
    // 12 s: the great petal fall, once; the pond closes under it
    if (beat('roost.fall', T, ROOST.fall + lateFall)) {
      if (falls && falls.greatFall) falls.greatFall();
      if (shared.skin) shared.skin.set('pond', ROOST.pond[0], ROOST.pond[1]);
    }
    // ... and the lanes close four times as fast while it lasts
    const sk = ctx.waterLook && ctx.waterLook.skin;
    if (sk && typeof sk === 'object' && 'close' in sk) {
      const R = ROOST.lanes, k = smooth(R.from + lateFall, R.from + lateFall + 1, T) * (1 - smooth(R.hold + lateFall, R.back + lateFall, T));
      if (k > 0.002) { st.lanes = true; sk.close = baseClose * lerp(1, R.to, k); } else if (st.lanes) { st.lanes = false; sk.close = baseClose; }
    }
    // 18 s: the hush: nothing but petals landing
    if (falls) for (let i = 0; i < ROOST.ticks.length; i++) if (beat('roost.ticks' + i, T, ROOST.ticks[i][0] + late)) falls.tickRate = ROOST.ticks[i][1];
    // 18 s on: the lamp's stroke goes out under the petals, last
    if (beat('roost.stroke', T, ROOST.stroke[0] + late)) stage.tween((v) => { shared.lampStroke = v; }, 1, 0, ROOST.stroke[1]);
  };

  const tideNow = (T, calm) => {
    if (flies) flies.tick(T);
    if (stag && stag.tide && stag.staged) stag.tide(T, TIDE.stag);
    if (T > TIDE.len + 60) return;
    if (L && flies) {
      if (beat('tide.one', T, TIDE.one - 0.02)) L.one(TIDE.one);
      if (beat('tide.three', T, TIDE.three - 0.02)) L.three(TIDE.three);
      if (beat('tide.forty', T, TIDE.forty - 0.02)) L.forty(TIDE.forty);
      for (let k = 0; k < TIDE.waves.length; k++) if (beat('tide.wave' + (k === 2 ? 4 : k + 1), T, TIDE.waves[k][0] - TIDE.lead)) L.fromWall({ at: TIDE.waves[k][0], strength: TIDE.waves[k][1] });
      if (beat('tide.wave3', T, TIDE.meet.at)) L.meet({ at: TIDE.meet.at, when: TIDE.meet.when });
    }
    // a `breath` at the wall for each of the first three fronts
    const wall = L && L.places && L.places.wall;
    for (const [k, at] of [[1, TIDE.waves[0][0]], [2, TIDE.waves[1][0]], [3, TIDE.meet.at]]) if (beat('tide.breath' + k, T, at)) playAt('breath', wall, { gain: 1.6 }, 'a front leaves the wall');      // (the wall is 30 to 55 m off: about -36 dBFS at the ear, over a bed that is then at its quietest)
    // the rower: the first wave leaving the wall; the stag stepping out from between the trunks
    // (stage 5: the wall's middle is dead ahead, behind the rider's head from where she stands; carried clear of the rider
    // by the engine's 26 degrees her eyes still read as on the rider. She looks to the wall's port end, well past.)
    if (beat('tide.look1', T, TIDE.waves[0][0] + 0.6)) { const w = F.at(216, -21); lookTo([w.x, 1.4, w.z], 4); }
    if (beat('tide.look2', T, TIDE.stag.into)) lookTo(stag && stag.position, 6);
    // a skimming bat comes down as wave 3 arrives: its ring gives the light back twice
    if (B && B.skim) for (let k = 0; k < TIDE.dips.length; k++) if (beat('tide.dip' + k, T, TIDE.dips[k])) B.skim.dip();
    // 36 s: the set piece ends: the fall returns, the scouts come back between the steady waves, the lantern comes up
    if (beat('tide.end', T, TIDE.len)) {
      st.tideEnded = true;
      if (falls) stage.tween(falls, 'density', 1, 4);
      if (flies) flies.scouts(1, 4);
      if (LANTERN < 1) ctx.lantern(1, 4);
    }
  };

  // The sound that moves with the boat's place and the two clocks. What it asks for is worked out first and kept in
  // `snd` (the record has it, so that a ride can be checked in a picture, where there is no sound engine), then said.
  const snd = { wind: 0.2, tone: 0.35, night: 0, shimmer: 0, water: 0.3, gain: 0.7, highpass: 300 };
  const soundNow = (s, Tr, Tt) => {
    // ---- the far bird, by place (the reveal's and the evening air's are their cues')
    for (let k = 1; k < BIRDS_AT.length; k++) if (stage.beat('bird' + k, s, BIRDS_AT[k])) { note('beats', 'bird' + k); farBird(k); }
    // ---- wind: air in blossom; the far hiss of the flock; almost nothing for the tide's hush
    let wind = 0.2, tone = 0.35;
    const late = stage.calm ? ROOST.calmLate[1] : 0;
    if (Tr >= 0 && Tr < 40) { const R = ROOST.wind, k = smooth(0, R.over, Tr) * (1 - smooth(R.until + late, R.until + late + R.back, Tr)); wind = lerp(wind, R.level, k); tone = lerp(tone, R.tone, k); }
    if (Tt >= 0 && Tt < TIDE.len + 6) wind = lerp(wind, TIDE.wind, smooth(0, 3, Tt) * (1 - smooth(TIDE.len, TIDE.len + 5, Tt)));
    // ---- night: orchard.js gives it by distance; here only where the page moves it (0.15 louder within 15 m of the
    // hives; down to 0.15 for the hush). This module's update runs after the realm's: what is said here stands.
    const base = nightBase(s);
    let night = base + (base > 0.01 && L && L.hives ? 0.15 * (L.hives.near || 0) : 0);
    if (Tt >= 0 && Tt < TIDE.night.back[1] + 1) night = lerp(night, Math.min(night, TIDE.night.to), smooth(0, 1.5, Tt) * (1 - smooth(TIDE.night.back[0], TIDE.night.back[1], Tt)));
    // ---- the music: thin and far in the loft, back as one phrase at the reveal; down for the flock; a rest for the
    // hush, the low strings under wave 3, then as it was
    let gain = 0.7, highpass = 300, over = 4;
    if (!stage.done('reveal')) { gain = 0.3; over = 2; } else if (stage.since('reveal') < 7) over = 5;
    if (Tr >= ROOST.music.from && Tr < ROOST.music.until + late) { gain = ROOST.music.gain; over = 3; } else if (Tr >= ROOST.music.until + late && Tr < ROOST.music.until + late + 8) over = ROOST.music.back;
    const M = TIDE.music;
    if (Tt >= 0 && Tt < M.from) { gain = M.rest; over = 3; }
    else if (Tt >= M.from && Tt < TIDE.steady) { gain = M.full; highpass = M.highpass; over = M.over; }
    else if (Tt >= TIDE.steady && Tt < TIDE.steady + 12) over = M.back;
    snd.wind = q2(wind); snd.tone = q2(tone); snd.night = q2(night); snd.gain = gain; snd.highpass = highpass;
    // ---- shimmer: how lit the air round the boat is, once the tide has begun (the scouts make no sound)
    // (measured on a ride: one front lights the air round the boat to 0.43 of the family's number, since the hull carries
    // its own dark; two that cross, to 0.97. So 0.9 of it, held at the page's 0.4: a front is heard at 0.38, the crossing at 0.4)
    snd.shimmer = Tt >= 0 && L ? q2(Math.min(TIDE.shimmer, 0.9 * clamp(L.shimmer || 0, 0, 1))) : 0;
    // ---- water: the current over the fallen stones at the gap
    snd.water = q2(0.3 + 0.12 * smooth(198, 212, s) * (1 - smooth(222, 236, s)));
    const a = ctx.audio; if (!a || a.silent || !a.layer) return;
    a.layer('wind', { level: snd.wind, tone: snd.tone }, 0.6);
    if (Math.abs(night - base) > 0.004) a.layer('night', snd.night, 1.2);
    a.layer('shimmer', snd.shimmer, 0.5);
    a.layer('water', snd.water, 2);
    a.music({ gain, highpass }, over);
  };

  return {
    update(dt) {
      const s = here.s, calm = stage.calm;
      const Tr = stage.clock('roost', (x) => (x - psRoost) / ROOST.pace);
      let Tt = stage.clock('tide', (x) => (x - psTide) / TIDE.pace);
      if (Tt > 5e4) Tt = 1000 + stage.time;                    // a boat set down beyond it: the steady waves, long under way

      if (Tr >= 0) call('the roost', () => roostNow(Tr, calm));
      if (Tt >= 0) call('the tide', () => tideNow(Tt, calm));

      // ---- the evening air's line on the water: the skin shivers under it (pin rings, as petals make)
      if (stage.time < st.airUntil && falls && falls.air) {
        const fs = falls.air.s, rate = calm ? 6 : 14;
        if (Math.abs(fs - s) < 30) {
          st.airDue += dt * rate;
          while (st.airDue >= 1) { st.airDue -= 1; const p = F.at(fs + (st.airRnd() - 0.5) * 4, (st.airRnd() - 0.5) * 26); ctx.water.ripple(p.x, p.z, calm ? 0.03 : 0.05, 0.3); }
        }
      }

      // ---- the current, on the tide's clock (set.js has written the plan's by distance, a moment ago: 1.2 from s 162
      // to s 202). During the tide it is 1.2 wherever the boat is; when the tide is over it returns to 2.0 in the second
      // avenue. With reduced motion nothing here touches it: the water does not change speed under a rider by the clock.
      // Nor for a boat that was set down beyond the line (the tide was not played): the plan's current stands, which is
      // what the stag's own clock, his again in that case, was measured with.
      if (!calm && Tt >= 0 && st.tideOn) {
        const base = plan.currentAt(s), during = Math.min(base, TIDE.current), after = s >= 138 ? Math.max(base, TIDE.after) : base;
        const cur = Tt < TIDE.len ? lerp(base, during, smooth(0, TIDE.ease, Tt)) : lerp(during, after, smooth(TIDE.len, TIDE.len + TIDE.ease, Tt));
        ctx.look.current = ctx.look.currentNarrow = cur;
      }

      // ---- out: beyond the wall the orchard's light breathes twice more behind, then nothing; back inside, it returns
      if (flies) {
        if (st.first && s > 219) st.outT = 1e3;
        if (s > 216) { st.outT += dt; if (!st.outDark && st.outT > TIDE.out) { st.outDark = true; flies.level(0, st.outT > 500 ? 0.5 : 8); } }
        else { st.outT = 0; if (st.outDark && s < 213) { st.outDark = false; flies.level(1, 4); } }
      }

      call('the sound', () => soundNow(s, Tr, Tt));
      st.first = false;

      // (the record: how near the stag has been to the boat, and when)
      if (LOG && stag && stag.position) { const dd = Math.hypot(stag.position.x - ctx.boat.x, stag.position.z - ctx.boat.z); if (!rec.stagNearest || dd < rec.stagNearest[0]) rec.stagNearest = [+dd.toFixed(1), +s.toFixed(1), +stage.time.toFixed(1), +Tt.toFixed(1)]; }
      if (LOG && stage.time >= st.sample && rec.series.length < 400) {
        st.sample = stage.time + 0.5;
        rec.series.push([+stage.time.toFixed(1), +s.toFixed(1), +Math.min(Tr, 999).toFixed(1), +Math.min(Tt, 9999).toFixed(1), snd.wind, snd.tone, snd.night, snd.shimmer, snd.water, snd.gain, snd.highpass, +(+ctx.look.current).toFixed(2), falls ? +(+falls.density).toFixed(2) : -1, shared.skin && shared.skin.zones ? +shared.skin.zones.pond.toFixed(2) : -1,
          stag && stag.position ? +Math.hypot(stag.position.x - ctx.boat.x, stag.position.z - ctx.boat.z).toFixed(1) : -1]);
      }
      if (LOG && stage.time >= st.post) {
        st.post = stage.time + 2;
        rec.now = { time: +stage.time.toFixed(1), pageS: +s.toFixed(1), pathS: +ctx.s.toFixed(1), roost: +Tr.toFixed(1), tide: +Tt.toFixed(1), calm, current: +(+ctx.look.current).toFixed(2), density: falls ? +(+falls.density).toFixed(2) : null,
          pond: shared.skin && shared.skin.zones ? +shared.skin.zones.pond.toFixed(2) : null, lampStroke: shared.lampStroke ?? 1, shimmer: L ? +(+L.shimmer || 0).toFixed(2) : null, sound: { ...snd }, firefliesOut: st.outDark, beyondWall: +st.outT.toFixed(1), staged: { birds: !!(B && B.staged), stag: !!(stag && stag.staged), carp: !!(carp && carp.staged), fireflies: !!(L && L.staged), waders: !!(W && W.staged) },
          stag: stag && stag.position ? (() => { const p = plan.locate(stag.position.x, stag.position.z, {}); return [+p.s.toFixed(1), +p.d.toFixed(1), +Math.hypot(stag.position.x - ctx.boat.x, stag.position.z - ctx.boat.z).toFixed(1)]; })() : null, failed: [...failed] };
        fetch('/__shot/' + LOG, { method: 'POST', body: JSON.stringify(rec) }).catch(() => {});
      }
    },
  };
}
