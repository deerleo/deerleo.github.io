// The standing sky: THE ROUTE OF MOMENTS, the showstopper, sound, the ending (docs/art/sky.md, sections 6 and 8).
// STAGED since 8 November (stage 4: docs/build/sky/4-staging.md). The cues that the LIGHT and the WATER hang on are in
// set.js and heroes.js, the standers' in cast_starbirds.js; every later stage reads one clock. What this module adds
// is marked [stage] below; everything else in the list is where it was.
//
//   cue 'reveal'      s 26    (set.js)     the eye opens: exposure 0.5 to 0.72 over 4 s
//   cue 'falsedawn'   s 96    (set.js)     the aurora unrolls from west to east in 12 s; shared.sky.aurora
//   cue 'wake'        s 100   (heroes.js)  the wader wakes over 16 s (cast_starbirds.js)
//   cue 'bow'         s 150   (heroes.js)  ... and bows across the route over 9 s
//   cue 'standers', 'standers.heads', 'standers.wing'   s 76, 150, 160 (cast_starbirds.js)
//   cue 'lettinggo'   s 216   (set.js)     the showstopper's clock: shared.sky.T = stage.clock('lettinggo', (s) => (s - 216) / 1.1)
//                                          on it by themselves: the wind front (t 22 to 32: shared.sky.front, shared.sky.wind, the
//                                          water's front, the glitter path, the mirror's resolution), the great wader's part
//                                          (cast_starbirds.js: head up, the walk, the wings, the run, gone 24.5 to 31), the hut, the
//                                          sedge, the dust and the feathers (cast_wind.js)
//   by distance alone (set.js): the dawn clock e (s 170 to 290), the mirror's grade (s 170 to 230), the sunline (s 200 on),
//   the aurora's failing (s 170 to 200), the current (1.8 m/s to s 200, 1.0 from s 226), the snow cloud's wall sinking
//
// THE ROUTE (the page's table). [stage] = made here:
//   s 0..26    the mist                 the veil tears from the top down (set.js); `water` 0.3
//   s 26..32   the plumb line           the first image, complete by s 30; music whole; `shimmer` 0.2
//   s 46       [stage] cue 'firstfall'  a streak high on the left, then a point drifting down 8 s to land at s 130, d -34
//   s 60       [stage] cue 'starfall'   a star comes down ahead and to the right and lands at s 80, d +9 seven seconds later,
//                                       as the carried boat reaches s 72 (the page fires it at s 66: the boat is then abeam of
//                                       the place before the star is down): a real ring across the hull; `drop` (pitch 1.3, gain 0.5)
//   s 76       the constellations wake  the standers' cue; [stage] `shimmer` to 0.4 over 6 s
//   s 96       the false dawn           [stage] `drone` { level 0.25, notes [38, 45], colour 0.2 } over 10 s
//   s 100      [stage] cue 'wake.stage' (after 'wake') a falling star lands by the wader's foot (s 198, d +18); `breath` (gain
//                                       1.2); its footfall: `drop` (pitch 0.45, gain 0.9) and a far ring; `deep` to 0.35 over 10 s;
//                                       the rower looks up at it
//   s 128..136 the kept lamp            the engine's: both lamps brighten within 8 m, note 76 (E5)
//   s 138 on   the stakes               each tern lifts its head as the boat passes (the family's); [stage] `flutter` on a shuffle
//   s 150      the wader bows           the gate; [stage] `splash` (gain 0.25, pitch 0.7) at each turn of a sweep
//   s 170      the seam                 [stage] the music dries with e: reverb 0.6 to 0.15, width 1.4 to 1.0, gain 0.85 to 1.0;
//                                       space mix 0.5 to 0.25
//   s 204      [stage] cue 'sleeperlooks'  one of the four in the channel untucks its head and looks at nothing; `rustle` on a preen
//   s 216      THE LETTING GO (38 s)    [stage] on shared.sky.T: t 0 `shimmer` to 0, the first star lifts 15 m ahead; t 1.6 to 4.6
//                                       four more; t 4.9 one is held back; t 5 the wave (the lights' own wave is switched off and
//                                       sent from here); the wader's footfalls rock the hull a little; t 12 the rower watches it
//                                       go; t 18 the last star, 6 m ahead of the prow (its ring rocks the hull 1.5 degrees 1.5 s
//                                       later: none with reduce motion); t 22 the flock lifts with the front, ribbon by ribbon
//                                       (R2, R3 and the sleepers on the wind's own line, R1 on a line FIVE SECONDS AHEAD of it, so
//                                       that it crosses the route at t 34 to 38); t 30 the terns leave; the wind's sound rises as
//                                       the front comes (`wind` 0.6, tone 0.55); as it reaches the boat the lantern flame leans,
//                                       `water` 0.55, space 'open', the shutter knocks; 8 s later `wind` 0.45, `water` 0.5,
//                                       `birds` { level 0.3, rate 0.12 }, `drone` to 0.
//                                       KEPT as the cast has it: the wader's fade is held open during the show and it goes out on
//                                       the show clock from 24.5 to 31 s (not by dawn progress 0.6).
//   s 246      the summit               the sunline reaches the ridge's crest (set.js). (The track's last 40 seconds cannot be
//                                       cued: the sound engine has no call for it. See the log, "Asked of the engine".)
//   s 266      the cold lamp            the jetty ahead and right, its lamp dark against the apricot; `birds` 0.3
//   s 276.4    [stage] cue 'crossing'   the prow lantern within 8.5 m of the far lamp's flame (or the boat past s 278, for a
//                                       rider who passes wide): a mote of flame crosses from the prow lantern (5 s; longer from
//                                       further off), the lamp is lit (setLit(true, 2)), `lamp` note 81 (A5), its moths 4 s
//                                       later, the rower turns her head to it. The boat is not held: the carried boat is at
//                                       s 281.4 when the lamp catches, the lamp ahead and to starboard against the dawn
//                                       (it was 3.2 m and s 283: the lamp caught abeam, behind every view that looks ahead).
//   18 s later [stage] cue 'ending'     ctx.emit('ending') (never before t 40 of the showstopper); the music sinks to 0.3 over
//                                       12 s (the page: wind and water only); 14 s after it the current is held at 0 for "Stay a
//                                       while" (shared.sky.state.still).
// With reduce motion (stage.calm): no hull rock, the lantern leans half as far; set.js widens and slows the front, the
// flock takes its far route (R1 60 m ahead), the wind's group halves its swings. Every moment still happens.
//
// For looking: &play=firstfall, starfall, wake (mine follows it), sleeperlooks, lettinggo (&t= seconds), crossing, ending.
//
// THE PASSAGE IN is mist and nothing else (docs/art/README.md): the snow orchard's half ends in the wall of pale blue
// mist, ours begins in it. Nothing stands between the boat and the sky for the first 60 m.
import * as THREE from 'three';
import { flameCrossing } from '../../engine/lamp.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// Staging's own numbers (places as [s, d]; seconds on the showstopper's clock unless said)
const N = {
  first: { s: 46, to: [130, -34], seconds: 8, from: 'left' },
  second: { s: 60, to: [80, 9], seconds: 7, from: 'right' },                 // (the page's cue is s 66: from there the carried boat is abeam of the place before the star is down. From s 60 it comes down ahead and to the right and lands as the boat reaches s 72, postcard 2's place)
  foot: { to: [198, 18], seconds: 7, from: 'right' },
  wader: [196, 14],
  sleeper: 204,
  // (critique: the page's 34, 26, 20, 15 and 11 m. Beyond 21 m the water mirrors the dawn's band and a star there lifts
  // white on apricot, its ring edge on: the first three could not be found in any picture. Nearer, each breaks dark
  // water with a ring seen from above and is through the band in a second: .shots/sky_crit_singles0_crop.png and _2)
  singles: [[0, 15], [1.6, 13], [2.6, 11], [3.6, 9], [4.6, 7.5]],            // [second, metres ahead]
  hold: 4.9, wave: 5,
  last: { at: 18, ahead: 6, port: 0.6, rock: 1.5, after: 1.5 },               // the last star: 6 m ahead of the prow, 0.6 m to port of the keel's line; the hull rolls 1.5 degrees 1.5 s later
  rock: { period: 2.0, damp: 1.1, lasts: 3.4, foot: 0.8, reach: [20, 60], speed: 5 },      // a footfall's ring: 0.8 degrees within 20 m, nothing beyond 60, arriving at 5 m/s
  lift: 22, r1Lead: 5, terns: 30, late: 75,                                   // late: a clock first seen beyond this finds the birds long gone
  lean: { gust: 0.5, steady: 0.4, across: 0.8, calm: 0.5, lamps: 0.3 },       // the flames in the wind (1 = a stiff gust); across: the share of it that comes across the bow
  flutter: { count: 30, every: 0.47, gain: [0.4, 1.0], within: 10 },
  splash: { count: 12, reach: 70, gain: [0.6, 0.3] },
  // (critique, 8 November: near was 3.2. The carried boat makes 5 m in the mote's five seconds: sent at 3.2 m the flame
  // went back past the rider's shoulder and the lamp caught abeam, out of every view that looks ahead, two seconds after
  // it had left the picture: .shots/sky_stage_cross_a.png. Sent at 8.5 m (the boat at s 276.4) it goes ahead of the
  // boat and the lamp catches 6.5 m off, 25 degrees to starboard of the bow, in front of the dawn; it has steadied two
  // seconds later, still inside a view that looks dead ahead: .shots/sky_crit_cross3_ahead.png. free: the metres that
  // take the plain five seconds (it was 6). ending: 18 s after the mote leaves, which is where it was (12 s after a mote
  // that left six metres later: the carried boat at s 294.5, the lamp 8 m astern).)
  // past: the boat's distance along at which the flame is sent whatever the boat's place (a rider who passes wide). It was
  // 289, two metres beyond the lamp: the lamp then caught ten metres astern of a boat 14 m out, with the mote a speck over
  // open water (.shots/sky_crit_cross_wide.png). From 278 it catches abeam, where a rider who passes the jetty looks.
  crossing: { near: 8.5, free: 9, past: 278, seconds: 5, perMetre: 0.35, most: 10, moths: 4, ending: 18, notBefore: 40, still: 14, note: 81, music: 0.3 },
};

export async function build(ctx, plan, shared) {
  const P = plan, engine = ctx.engine, stage = ctx.stage, kit = ctx.kit, path = ctx.path, boat = ctx.boat, sky = shared.sky || {};
  const cast = shared.cast || {}, lights = cast.lights || null, bed = shared.bed || null, falls = shared.falls || null, rings = shared.rings || null;
  const W = P.show.wind, far = shared.farLamp || null;
  const st = { gone: false, single: [], last: -2, lastUp: false, lifted: false, r1: false, terns: false, riseSound: -1, flutters: 0, flutterAt: 0, splashes: 0,
    windAt: -1, crossed: 0, endAt: -1, ended: false, music: 1, rock: 0, mote: null };
  const loc = {}, v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), prowAt = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  ctx.onDispose(() => { st.gone = true; if (boat.model && boat.model.wind) boat.model.wind.set(0, 0, 0); });

  // one handle of the cast that is not there, or does not take what its log says, must not stop the route
  const said = {};
  const tryTo = (what, fn) => { try { return fn(); } catch (err) { if (!said[what]) { said[what] = true; console.error('sky stage: ' + what, err); } return undefined; } };
  const play = (name, o) => tryTo('a sound', () => { const a = ctx.audio; return a && a.play ? a.play(name, o) : false; });      // (a sound that fails must not stop the moment that asked for it)
  const place = (p, o) => ({ x: p.x, z: p.z, ...o });
  const whereIs = (b) => { const p = b && (Number.isFinite(b.x) ? b : b.position || (b.object && b.object.position)); return p && Number.isFinite(p.x) ? { x: p.x, z: p.z } : {}; };
  const away = (x, z) => Math.hypot(x - boat.x, z - boat.z);

  // ---- the rower (she is nothing when she is ashore). She is given a place to look at for a while; the place is asked
  // again every frame, because what she watches moves.
  const watch = { get: null, until: 0 };
  const look = (get, seconds) => { watch.get = typeof get === 'function' ? get : () => get; watch.until = stage.time + seconds; };
  // (critique: she looks up no steeper than 26 degrees. The wader's crown, its keel and the flock overhead stand 40 to 60
  // degrees up: her head went back as far as a neck goes, and from the rider's seat that is the underside of a chin
  // with the face lost: .shots/sky_crit_gaze_wader2_crop.png. Lower, her chin comes up and her eyes do the rest.)
  const LOOK_UP = Math.tan(26 * Math.PI / 180), HER_EYE = 1.6, lookP = new THREE.Vector3();
  const notSteep = (p) => {
    if (!Number.isFinite(p.y)) return p;
    const top = HER_EYE + LOOK_UP * Math.hypot(p.x - boat.x, p.z - boat.z);
    return p.y > top ? lookP.set(p.x, top, p.z) : p;
  };

  // ---- the hull's rock: a ring passing under it rolls it once and it settles (none with reduce motion)
  const rocks = [];
  const rock = (degrees, after = 0) => { if (!stage.calm && degrees > 0.02) rocks.push({ at: stage.time + after, amp: degrees * Math.PI / 180 }); };

  // =================================================================================================== the route
  // s 46: the first falling star. s 60: a star comes down. (No settle: a star that fell before the picture left nothing
  // but one more light on the bed.)
  stage.cue('firstfall', { s: N.first.s, settle() {} }, () => { if (falls) tryTo('the first falling star', () => falls.fall({ to: kit.at(N.first.to[0], N.first.to[1]), seconds: N.first.seconds, from: N.first.from })); });
  stage.cue('starfall', { s: N.second.s, settle() {} }, () => { if (falls) tryTo('a star comes down', () => falls.fall({ to: kit.at(N.second.to[0], N.second.to[1]), seconds: N.second.seconds, from: N.second.from })); });
  // a star landing within the water's own reach is heard as a drop (the same event that draws its ring)
  if (falls) falls.onLand = (x, z, near) => { if (near || away(x, z) < 48) play('drop', { x, z, pitch: 1.3, gain: 0.5 }); };

  // s 100: the wader wakes (the cue is the set's; the animal is the cast's). Here: the star by its foot, its breath, and
  // the rower, who looks up at it once its neck has begun to rise.
  const waderAt = kit.at(N.wader[0], N.wader[1]), wader = cast.wader || null;
  stage.cue('wake.stage', { after: 'wake', settle() {} }, () => {
    if (falls) tryTo('the star by the wader\'s foot', () => falls.fall({ to: kit.at(N.foot.to[0], N.foot.to[1]), seconds: N.foot.seconds, from: N.foot.from }));
    play('breath', place(waderAt, { gain: 1.2 }));
    stage.after(5, () => look(() => (wader && wader.crown) || waderAt, 12));
  });
  if (wader && wader.on) {
    // its footfalls: a drop, low; a drawn ring where the water's own ripples do not reach; in the show, a small roll of the hull
    wader.on.footfall = (foot, p) => {
      if (!p) return;
      const d = away(p.x, p.z);
      play('drop', place(p, { pitch: 0.45, gain: 0.9 }));
      if (d > 48 && rings) tryTo('the far footfall\'s ring', () => rings.add(p.x, p.z, { size: 30, grow: 3, life: 10, strength: 0.8 }));
      if (sky.T >= 0) rock(N.rock.foot * (1 - smooth(N.rock.reach[0], N.rock.reach[1], d)), d / N.rock.speed);
    };
    wader.on.sweep = (side, p) => { if (p) play('splash', place(p, { pitch: 0.7, gain: 0.25 })); };
    wader.on.glean = (p) => { if (p && Number.isFinite(p.x)) play('tick', place(p, { pitch: 2, gain: 0.3 })); };      // (the beads are not built: this waits for them)
    wader.on.downBeat = (p) => { play('breath', place(p || waderAt, { gain: 1.0 })); };
  }

  // s 138 on: the terns on their stakes. s 204: the sleepers.
  if (cast.terns && cast.terns.on) {
    cast.terns.on.shuffle = (b) => play('flutter', { ...whereIs(b), gain: 0.4 });
    cast.terns.on.leave = (b) => play('flutter', { ...whereIs(b), pitch: 1.3, gain: 0.5 });
  }
  const sleepers = cast.sleepers || null, flock = cast.flock || null;
  // the twelve splashes of the nearest take-off runs (the sleepers' and the near ribbon's footfalls, nearest the boat)
  const runSplash = (x, z, kind, strength, metres) => {
    if (kind !== 'run' || st.splashes >= N.splash.count) return;
    const d = Number.isFinite(metres) ? metres : away(x, z);
    if (d > N.splash.reach) return;
    st.splashes++; play('splash', { x, z, gain: lerp(N.splash.gain[0], N.splash.gain[1], smooth(30, N.splash.reach, d)) });
  };
  if (sleepers && sleepers.on) { sleepers.on.preen = (b) => play('rustle', { ...whereIs(b), gain: 0.4 }); sleepers.on.touch = runSplash; }
  if (flock && flock.on) flock.on.touch = runSplash;
  stage.cue('sleeperlooks', { s: N.sleeper, settle() {} }, () => {
    if (!sleepers || !sleepers.flock || !sleepers.flock.act || !sleepers.groups || !sleepers.groups.channel) return;
    const ch = sleepers.groups.channel, i = ch[ch.length - 1];                // the furthest along of the four: it is still ahead
    tryTo('the sleeper that looks', () => sleepers.flock.act('look', { who: [i], seconds: 8 }));
  });

  // the hut's shutter falls back on its prop a second after the wind reaches it
  if (cast.wind && cast.wind.on) cast.wind.on.knock = (p) => play('knock', { ...whereIs(p), gain: 0.5 });

  // =================================================================================================== the letting go
  // The rising: the lights' own wave is switched off (it would go at t 5 whatever had been held) and sent from update.
  if (lights) lights.auto = false;
  // m metres ahead of where the boat was when the clock said t (a rider who stops: of where it is), on its own side of the line
  const ahead = (t, m) => { const b = path.locate(boat.x, boat.z, null, loc); return kit.at(Math.min(b.s, P.show.s + 1.1 * t) + m, Math.max(-12, Math.min(12, b.d))); };
  const prow = () => { prowAt.set(boat.x, 0.9, boat.z); return boat.model && boat.model.worldPoint ? boat.model.worldPoint('flame', prowAt) : prowAt; };
  if (bed) bed.onRise = (x, z, i) => {
    if (i === st.last && st.lastUp) {                                          // the last star: a heavier ring, a heavier drop, and the hull rolls once as it passes under
      if (rings) tryTo('the last star\'s ring', () => rings.touch(x, z, { ripple: 0.9, radius: 1.2 }));
      play('drop', { x, z, pitch: 0.6, gain: 0.8 });
      rock(N.last.rock, N.last.after);
      return;
    }
    if (away(x, z) < 20 && stage.time - st.riseSound > 1 / 6) { st.riseSound = stage.time; play('tick', { x, z, pitch: 1.8, gain: 0.4 }); play('drop', { x, z, pitch: 1.6, gain: 0.3 }); }
  };
  const rising = (T) => {
    if (!bed) return;
    N.singles.forEach(([t, m], k) => {
      if (T < t || st.single[k]) return;
      st.single[k] = true;
      tryTo('a single star', () => { const p = ahead(t, m), i = bed.nearest(p.x, p.z, true); if (i >= 0) bed.rise(i, t); });
    });
    if (T >= N.hold && st.last === -2) {
      st.last = -1;
      if (T < N.last.at) tryTo('the star held back', () => { const p = ahead(N.hold, 8), i = bed.nearest(p.x, p.z, true); if (i >= 0) { bed.hold(i); st.last = i; } });
    }
    if (T >= N.wave && lights && !lights.waved) tryTo('the wave', () => lights.wave());
    if (T >= N.last.at && st.last >= 0 && !st.lastUp) {
      st.lastUp = true;
      tryTo('the last star', () => {
        // 6 m ahead of the prow, on the boat's own line: the line of its keel, not the line to its lantern, which hangs
        // to starboard of the stem (on that line the star came up behind the lantern's glow), and 0.6 m to port of it,
        // clear of the lantern's crook. Never under a causeway: within 16 m of the route's line.
        const pl = prow(), lx = pl.x - boat.x, lz = pl.z - boat.z, l = Math.hypot(lx, lz) || 1;
        v2.set(0, 0, -1).applyAxisAngle(UP, boat.heading || 0);
        let along = v2.x * lx + v2.z * lz;
        if (along < 0) { v2.negate(); along = -along; }
        if (along < 0.7 * l) { v2.set(lx / l, 0, lz / l); along = l; }               // (a boat whose bow is not where its heading says: the lantern's line after all)
        const reach = along + N.last.ahead, port = N.last.port;
        const q = path.locate(boat.x + v2.x * reach + v2.z * port, boat.z + v2.z * reach - v2.x * port, null, loc), p = kit.at(q.s, Math.max(-16, Math.min(16, q.d)));
        bed.place(st.last, p.x, p.z); bed.rise(st.last, N.last.at);
      });
    }
  };
  // The birds: nothing of them follows the clock by itself. Latches, not beats: a picture that enters the clock late
  // must still find them lifted (the flock puts a bird the line has passed where it would be by now).
  const birds = (T) => {
    if (T >= N.lift && !st.lifted) {
      st.lifted = true;
      const gone = T > N.late;
      if (flock) tryTo('the flock', () => { if (gone) flock.put('gone'); else { flock.lift({ ribbon: 'R3' }); flock.lift({ ribbon: 'R2' }); } });
      if (sleepers && sleepers.lift) tryTo('the sleepers', () => { if (gone) sleepers.put('gone'); else sleepers.lift(); });
      // R1, the near ribbon: on the wind's own line it crosses at t 38 to 46 (the Flock group's log); on a line five
      // seconds ahead of the wind's it crosses at t 34 to 38, as the page has it
      if (flock && !gone) tryTo('the near ribbon', () => { const speed = stage.calm ? W.calmSpeed : W.speed; flock.lift({ ribbon: 'R1', front: { from: [boat.x, sky.front.z + speed * N.r1Lead], dir: [0, 1], speed } }); });
    }
    if (T >= N.terns && !st.terns) {
      st.terns = true;
      if (cast.terns) tryTo('the terns', () => { if (T > N.late) cast.terns.put('gone'); else cast.terns.leave(); });
    }
  };

  // =================================================================================================== the ending
  const farFlame = () => (far ? (far.position && far.position.lengthSq() > 1 ? far.position : far.flame) : null);
  const lightFar = (seconds) => {
    if (!far || !far.setLit) return;
    far.setLit(true, seconds); far.inside = true;                               // (inside: the lamp's own note waits until the boat has left and come back)
    if (cast.shallows && cast.shallows.farMoths) tryTo('the far lamp\'s moths', () => cast.shallows.farMoths(seconds > 0.5 ? N.crossing.moths : 0.1));
  };
  stage.cue('crossing', { s: N.crossing.past, settle() { st.crossed = 2; lightFar(0.1); } }, () => {
    if (st.crossed || !far) return;
    if (far.target > 0.5) { st.crossed = 2; return; }                           // (a lamp a developer's switch has already lit, &farlit=1: no flame is sent to it, and no ending follows)
    st.crossed = 1;
    const to = farFlame(), from = prow().clone(), X = N.crossing;
    const seconds = Math.min(X.most, X.seconds + Math.max(0, from.distanceTo(to) - X.free) * X.perMetre);
    st.endAt = stage.time + seconds + (X.ending - X.seconds);
    const arrived = () => {
      if (st.gone || st.crossed === 2) return;
      st.crossed = 2; lightFar(2);
      play('lamp', { x: to.x, z: to.z, note: X.note });
    };
    look(farFlame, seconds + 10);                                               // the rower: from the mote's leaving (the lamp is then ahead of her and to starboard; once it is lit it falls astern, further round than a head turns)
    const before = ctx.group ? ctx.group.children.length : 0;
    const sent = tryTo('the flame\'s crossing', () => flameCrossing(engine, ctx, from, farFlame, seconds, arrived));
    if (!sent) stage.after(seconds, arrived);                                   // (without the mote the lamp is lit all the same)
    // (the engine's mote is a storm lantern of which only the flame is shown: its brass and glass are hidden again when
    // its model's promise comes back, and in a strip taken with tools/shot.py that is a picture late, so that a whole
    // lantern flew across. They are kept hidden from here: update)
    const g = ctx.group && ctx.group.children.length > before ? ctx.group.children[ctx.group.children.length - 1] : null;
    st.mote = g && g.children.length >= 4 ? g : null;
    if (st.mote) st.mote.visible = false;                                       // (until its flame has come: update)
  });
  stage.cue('ending', { s: 1e9 }, () => {
    if (st.ended) return;
    st.ended = true;
    ctx.emit('ending');
    stage.tween(st, 'music', N.crossing.music, 12);
    stage.after(N.crossing.still, () => { if (sky.state) sky.state.still = true; });
  });

  return {
    update(dt, c) {
      const T = sky.T ?? -1, e = sky.e || 0, s = c.s, calm = stage.calm, show = T >= 0, w = sky.wind || 0;
      // (Every part is tried by itself. The engine switches off for good an update that throws, and the ride must end
      // whatever else fails: a part that throws says so once and the others go on.)

      // ---- the letting go, on the set's clock
      tryTo('the letting go', () => {
        if (show) { rising(T); birds(T); }
        if (stage.beat('lg.watch', T, 12)) look(() => (wader && wader.keel) || waderAt, 9);      // the rower watches the wader open its wings and go
        if (stage.beat('lg.wings', T, 12)) play('breath', place((wader && wader.keel) || waderAt, { gain: 1.5, pitch: 0.8 }));
        // a few of the near ribbon come back and land again (the cast's back(): one in six, over 25 s), so that the last
        // pictures are not empty of birds (the critique, 9 November: the handle was there and nothing called it)
        if (stage.beat('lg.back', T, 52) && flock && flock.back && st.lifted) tryTo('the birds that come back', () => flock.back());
        // the flock's wings: thirty flurries that travel with the near ribbon, right to left (placed on the line to its
        // middle but never further than 10 m: at its own 40 m and more a flurry is under the wind)
        if (flock && flock.centre && st.lifted && st.flutters < N.flutter.count && T < N.late && stage.time >= st.flutterAt) {
          const n = flock.centre(v1);
          if (n > 0) {
            const dx = v1.x - boat.x, dz = v1.z - boat.z, d = Math.hypot(dx, dz) || 1, k = Math.min(1, N.flutter.within / d);
            if (st.flutters === 0) look(() => (flock.centre(v2) > 0 ? v2 : null), 7);          // the rower's third look: the birds crossing
            play('flutter', { x: boat.x + dx * k, z: boat.z + dz * k, gain: lerp(N.flutter.gain[0], N.flutter.gain[1], st.flutters / (N.flutter.count - 1)) });
            st.flutters++; st.flutterAt = stage.time + N.flutter.every;
          }
        }
      });
      // the front reaches the boat
      if (w > 0.5 && st.windAt < 0) st.windAt = T > N.late ? -1e6 : stage.time;
      const since = st.windAt < 0 && st.windAt > -1e5 ? -1 : stage.time - st.windAt;      // seconds since it reached the boat (-1 before)

      // ---- the flames in the wind (west is +z: the wind blows that way)
      tryTo('the flames in the wind', () => {
        if (show && boat.model && boat.model.wind) {
          const t = stage.time, gust = since < 0 ? 0 : N.lean.gust * Math.exp(-since / 2.5), unrest = 1 + 0.22 * Math.sin(t * 1.9) + 0.12 * Math.sin(t * 3.3 + 1.1);
          // (a wind from dead ahead leans the flame straight at the rider, who sees only a shorter flame: a share of it comes
          // across the bow, wavering, so that the lean is seen)
          const k = w * (N.lean.steady + gust) * unrest * (calm ? N.lean.calm : 1);
          boat.model.wind.set(k * N.lean.across * (0.75 + 0.25 * Math.sin(t * 0.9 + 0.4)), 0, k);
        }
        if (show && T >= W.from) for (const lamp of [shared.lamp, far]) {
          if (lamp && lamp.wind && lamp.position) lamp.wind.set(0, 0, N.lean.lamps * (calm ? N.lean.calm : 1) * smooth(0, 40, sky.front.z - lamp.position.z));
        }
      });

      // ---- the hull's rock (the engine eases the boat's roll toward its own every frame, before this: what is added
      // here is what the last frame's has lost)
      tryTo('the hull\'s rock', () => {
        let r = 0;
        for (let i = rocks.length - 1; i >= 0; i--) {
          const q = rocks[i], u = stage.time - q.at;
          if (u > N.rock.lasts) { rocks.splice(i, 1); continue; }
          if (u > 0) r += q.amp * Math.exp(-u / N.rock.damp) * Math.sin(u * 2 * Math.PI / N.rock.period) * (1 - smooth(N.rock.lasts - 0.6, N.rock.lasts, u));
        }
        if ((r !== 0 || st.rock !== 0) && boat.tilt) { boat.tilt.rotation.z += r - st.rock * Math.exp(-5 * Math.max(0, dt)); st.rock = r; }
      });

      // ---- the rower's head
      tryTo('the rower\'s look', () => {
        if (!watch.get) return;
        const left = watch.until - stage.time, rower = boat.model && boat.model.rower;
        if (left <= 0) watch.get = null;
        else if (rower && rower.lookAt) { const p = watch.get(); if (p) rower.lookAt(notSteep(p), Math.max(0.5, left)); }
      });

      // ---- the ending: the flame crosses when the prow lantern is within reach of the cold lamp (a rider who passes
      // wide gets it at s 278, by the cue's own distance); eighteen seconds after it is sent, the ride is over
      tryTo('the crossing', () => {
        if (!st.crossed && far && s > 270) { const f = farFlame(), p = prow(); if (f && Math.hypot(p.x - f.x, p.z - f.z) < N.crossing.near) stage.fire('crossing'); }
      });
      if (st.endAt >= 0 && !st.ended && stage.time >= st.endAt && !(show && T < N.crossing.notBefore)) stage.fire('ending');
      tryTo('the mote', () => {
        if (!st.mote) return;                                                    // the mote is a flame, never a lantern
        const m = st.mote, flame = m.children[2];
        if (!m.parent) st.mote = null;
        else { for (const k of [0, 1, 3]) m.children[k].visible = false; m.visible = !!(flame.geometry && flame.geometry.attributes.position); }
      });

      // ---- sound: the layers that move with the boat's place and with the show
      tryTo('the sound', () => {
        const a = c.audio;
        if (!a || !a.layer) return;
        const after = since >= 8;                                               // the page's "after t 40": eight seconds after the front has reached the boat
        a.layer('shimmer', show ? 0 : s >= 76 ? 0.4 : 0.2, show ? 2 : 6);
        a.layer('drone', { level: s >= 96 && !after ? 0.25 : 0, notes: [38, 45], colour: 0.2 }, after ? 8 : 10);
        a.layer('deep', s < 100 ? 0 : !show || T < 5 ? 0.35 : T < 21 ? 0.45 : 0, show && T >= 21 ? 8 : show && T >= 5 ? 4 : 10);
        // the wind is heard coming: from the line 208 m ahead (t 24) to the boat (t 32)
        const coming = show && T >= W.from ? smooth(-208, 0, sky.front.z - boat.z) : 0;
        a.layer('wind', { level: after ? 0.45 : 0.6 * coming, tone: 0.55 }, after ? 6 : 1);
        a.layer('water', after ? 0.5 : since >= 0 ? 0.55 : 0.3, 3);
        a.layer('birds', { level: after ? 0.3 : 0, rate: 0.12 }, 8);
        a.music({ reverb: lerp(0.6, 0.15, e), width: lerp(1.4, 1.0, e), gain: lerp(0.85, 1.0, e) * st.music }, 2);
        a.space({ size: since >= 0 ? 'open' : 'cavern', mix: lerp(0.5, 0.25, e) }, 3);
      });
    },
  };
}
