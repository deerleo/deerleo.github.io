// The dyers' reach: the route of moments, the showstopper, sound (stage 4). Log: docs/build/reach/4-staging.md.
// The layout left three things here, all kept: the kept lamp in its place (with its stroke and its spark), the passage
// in (the wash through the cream veil), and the list of what the page stages. Stage 4 added the cues, the unpegging on
// one show clock, reduced motion, and the sound that moves. Nothing here makes a creature or a cloth: every moment
// drives a handle the cast left on shared.cast (docs/build/reach/3-cast-*.md, "For the stager"), each call guarded, so
// a cast module that is switched off or fails takes its own moment away and nothing else.
//
// ---- the route of moments (docs/art/reach.md, section 6), each released by where the boat is, the first time only.
// In brackets: the cue's name, for &play=<name>; "by place" = no cue, it follows the boat's place in update().
//   s 0 to 5     through the veil: ctx.wash('#f6e2b8') falls from 1 to 0 (by place); a rustle as the cloths part  [veil]
//   s 8 to 26    the narthex clears: the drips layer rises to 0.4 (by place); the beads are the Falls group's own
//   s 24         first swallows: the nave party asked to cross 9 m ahead                                    [swallows]
//   s 28         the first image; the full music (by place)
//   s 30         (out of sight) the two aisle wringers given their phase                                       [phase]
//   s 40         the first breath: the front, seven rustles from behind to ahead, shaken drops ahead         [breath]
//   s 58, 70     the wringers re-aimed gently so that each is wrung as the boat is abreast          [posts1] [posts2]
//   s 60         the sun takes its first colour: nothing to stage (light.js)
//   s 76         (out of sight) the second dipping beam and the copper given their phase                      [phase2]
//   s 86         the beam re-aimed gently (the green cloths: it lifts as the boat comes out under the west front) [green]
//   s 88, 120    the swallow river, and back to their line                                       [river] [riverback]
//   s 100        the red pour: the copper tips by itself; the rower looks at the fan                           [pour]
//   s 116        a stray crosses: sent by its own module (shared.cast.silks.own); here its sound             [stray]
//   s 126        THE UNPEGGING, on one clock: T = max(seconds since release, (s - 126) / 2)                    [unpeg]
//                  0        the swallows climb; the front leaves s 30 at 17 m/s, cloth behind it HELD; wind 0.3 -> 0.8;
//                           the music opens
//                  6.4      it passes the boat: both lanterns lean, the hull rolls a degree, lint streaks, `breath`
//                  10..12   it reaches the wheel (by itself: the gores read the same front); exposure +12 %
//                  12, 13   the 26 flying silks slip their mast heads; the 34 lighter cloths lift
//                  13..     the ambient strays leave (each when it is far or behind the wheel)
//                  15       the wind begins to drop, from s 30, at 24 m/s: it reaches the boat near clock 21 and the
//                           door at 23; the door's low curtains are down by 26 to 27
//                  15       the last silk sets out (it comes down across the bow from the indigo side and lies on the water near clock 30)
//                  21..     the bar of dyed light is as wide as the reach while the boat is between s 160 and s 200:
//                           when the curtains cover the sun the whole reach drops to dusk, and the lamp is there
//                  22       the swallows come down
//                  31       `whump`; quiet. At s 198 the sun stands bare in the open door (by itself)
//                Afterwards every mast head is bare (the cue's settle leaves it so).
//   s 196        under the rim (by place): rain, drone D2 and deep by the distance to the hub; a knock at each float board
//   s 201        the lamp's note: the engine's
//   s 209        the west door: a rustle under its crown                                                       [door]
//   s 212        the spouts open, one after another                                                          [spouts]
//   s 218        the sun goes into the loft: the music begins to close (by place)
//   s 232        a swallow goes home: NOT STAGED (the Birds group built no handle for it)
//   s 242..252   the first, second and third indigo cloth: a rustle each; the space to a room (by place) [cloth1..3]
//
// Developer switches: &stagelog=<seconds> says, at that time, which cues have fired, the clock, every one-shot played
// so far and the levels of the layers (as a page error, so that the picture tool prints it). &stagequiet=1 leaves only
// the layout's lamp and wash running (for measuring what the rest costs). The engine's: &play=<cue> (or all), &calm=1.
import { makeKeptLamp } from '../../engine/lamp.js';

const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// the unpegging's beats, in seconds of its clock
const U = { pass: 6.4, rose: 10, letGo: 12, lift: 13, strays: 13, drop: 15, dropSpeed: 24, last: 15, dusk: 21, down: 22, close: 34 };

export async function build(ctx, plan, shared) {
  // ---- the kept lamp: at the foot of the west door, 2.5 m in front of its two low indigo curtains, in the wheel's rain.
  // The same lantern as everywhere; note D4; it has its own collider.
  const K = plan.lamp;
  const lamp = makeKeptLamp(ctx.engine, ctx, { position: [K.world[0], 0, K.world[1]], turn: -Math.PI / 2 + 0.3, note: K.note, near: K.near, reach: K.reach, moths: K.moths });
  ctx.addCollider({ x: K.world[0], z: K.world[1], r: K.collide });
  shared.lamp = lamp;
  // Its stroke on the water. In this area's low, rough mirror (0.4 at most) a lantern 22 m off is a pixel of the mirrored
  // picture and grows no column by itself: a halo that only the mirror sees gives the water its light to draw out.
  const stroke = ctx.kit.glow({ position: [K.world[0] + 0.12, 2.25, K.world[1] + 0.4], color: '#FFB45E', size: 2.4, intensity: 3.2 });
  ctx.only(stroke, 'mirror');
  // And its light across the lagoon: the lantern is 0.3 m tall, a pixel and a half at the 33 m from which the page first
  // shows it. A soft spark at the flame that grows fainter as the boat comes near and the lantern itself takes over.
  const spark = ctx.kit.glow({ position: [K.world[0] + 0.12, 2.25, K.world[1] + 0.4], color: '#FFB45E', size: 1.5, intensity: 1.6 });
  const base = spark.material.color.clone();

  // ================================================================================================ staging: the tools
  const stage = ctx.stage, kit = ctx.kit, boat = ctx.boat;
  const logAt = QS.has('stagelog') ? +QS.get('stagelog') : -1, QUIET = QS.has('stagequiet');
  const cast = shared.cast || {};
  const P = cast.presences || null, M = cast.machines || null, F = cast.falls || null, S = cast.silks || null, A = cast.airs || null, B = cast.birds || null;
  const wind = shared.wind || null, sun = shared.sun || null, GU = plan.gusts, HUB = plan.wheel.hub;
  const wdir = wind && wind.direction ? [wind.direction.x, wind.direction.y] : [0, -1];
  const _v = new ctx.THREE.Vector3();
  // a handle of the cast's is called through this: if it throws, the moment goes on without it and it is said once
  const said = {};
  const call = (what, fn) => { try { return fn(); } catch (e) { if (!said[what]) { said[what] = 1; console.error(`reach/stage: ${what} failed: ` + (e && e.message || e)); } return undefined; } };
  const pt = (s, d = 0, y = 0) => kit.at(s, d, y);
  const far = (x, z) => Math.hypot(x - boat.x, z - boat.z);
  // how long until the boat is at s, at the pace it has now (never slower than the current carries it)
  const eta = (s) => Math.max(0.5, (s - ctx.s) / Math.max(1.8, boat.speed || 0));
  // ---- sound: every one-shot goes through play() (counted, for &stagelog); every(key, seconds) keeps a kind from crowding
  const heard = {}, gate = {}, levels = {};
  const when = {};
  const play = (name, o, why) => {
    const k = why ? `${name} (${why})` : name; heard[k] = (heard[k] || 0) + 1;
    if (logAt >= 0 && (when[k] = when[k] || []).length < 5) when[k].push(`${ctx.time.toFixed(1)}s@${ctx.s.toFixed(0)}`);
    const a = ctx.audio; if (a && a.play) a.play(name, o);
  };
  const every = (key, seconds) => { if (ctx.time < (gate[key] || 0)) return false; gate[key] = ctx.time + seconds; return true; };
  const rower = () => (boat && boat.model && boat.model.rower) || null;
  const looks = { asked: 0, given: 0 };
  const rowerLook = (p, seconds) => { const r = rower(); looks.asked++; if (r && r.lookAt) { looks.given++; call('rower.lookAt', () => r.lookAt(p, seconds)); } };
  const dyeOf = (name) => { const i = plan.dye && plan.dye[name]; return plan.dyes && plan.dyes[i] ? plan.dyes[i].color : null; };

  // ================================================================================================ the cast's callbacks
  // (a ring that is drawn is a drop that is heard: each hook is filtered by distance here, as its log asks)
  // (a phase set outright makes a machine's clock jump across its marks and every hook on the way fires at once: for a
  // moment after one, the machines' hooks are not heard)
  const mOn = (kind, fn) => M.on(kind, (x, z, o) => { if (ctx.time < show.mute) return; fn(x, z, o || {}); });
  const hard = (fn) => { show.mute = ctx.time + 0.4; return fn(); };
  if (M && M.on) {
    mOn('knock', (x, z, o) => {
      if (o.pitch === 0.5) { if (far(x, z) < 22 && every('m.paddle', 1.1)) play('knock', { x, z, pitch: 0.5, gain: 0.6 }, 'a paddle'); }      // (two wheels put a float in every third of a second: one in three is heard)
      else if (far(x, z) < 30 && every('m.knock', 0.2)) play('knock', { x, z, pitch: o.pitch || 0.6, gain: 0.8 }, 'a wringer\'s pawl');
    });
    mOn('creak', (x, z) => { if (far(x, z) < 45 && every('m.creak', 3)) play('creak', { x, z, pitch: 0.5, gain: 0.8 }, 'a beam, the copper, a wringer'); });
    mOn('splash', (x, z, o) => {
      const g = o && o.gain != null ? o.gain : 1;
      if (g >= 1) show.pourAt = ctx.time;                                         // the copper's pour is at the slipway's head: the falls layer rises for it
      if (far(x, z) < 70) play('splash', { x, z, pitch: 0.7, gain: 1.2 * g }, g >= 1 ? 'the copper\'s pour' : g > 0.6 ? 'the pour reaches the lagoon' : 'a cradle going down');
    });
    mOn('drop', (x, z) => { if (far(x, z) < 26 && every('m.drop', 0.3)) play('drop', { x, z, pitch: 0.7, gain: 0.5 }, 'a skein\'s or a cloth\'s drop'); });
    mOn('bucket', (x, z) => { if (far(x, z) < 45 && every('m.bucket', 1.2)) play('drop', { x, z, pitch: 0.6, gain: 0.4 }, 'the lifting wheel\'s bucket'); });
    mOn('sluice', (x, z, o) => { if (o && o.open && far(x, z) < 45 && every('m.sluice', 3)) play('knock', { x, z, pitch: 0.5, gain: 0.6 }, 'the sluice'); });
  }
  if (P && P.on) {
    P.on('float', (x, z, o) => { if (o && o.into && !o.gone && far(x, z) < 45) play('knock', { x, z, pitch: 0.4, gain: 0.7 }, 'a float board'); });
    P.on('dip', (x, z) => { if (far(x, z) < 55) play('splash', { x, z, pitch: 0.6, gain: 0.5 }, 'a gore going into the pit'); });
  }
  if (F) F.onDrop = (x, z) => { if (every('f.drop', 0.34)) play('drop', { x, z, gain: 0.5 }, 'a drip landing'); };
  if (B) {
    B.onFlutter = (x, y, z) => { if (far(x, z) < 30 && every('b.flutter', 0.9)) play('flutter', { x, z, gain: 0.45 }, 'a swallow leaves or passes'); };
    B.onDip = (x, z) => { if (far(x, z) < 25 && every('b.dip', 1)) play('drop', { x, z, pitch: 1.5, gain: 0.3 }, 'a swallow\'s bill'); };
  }
  // the wheel's bearings: a creak about every 7 s for whoever is near them
  stage.every(7, () => { if (far(HUB[0], HUB[2]) < 48) play('creak', { x: HUB[0], z: HUB[2], pitch: 0.5, gain: 0.8 }, 'the wheel\'s bearings'); }, 3);

  // ================================================================================================ the route
  const show = { mute: -1, frontT: 0, frontAt: null, dropT: 0, dropAt: null, pourAt: -1e6, beats: {}, rustled: {}, strayGone: {}, lastPast: null, first: true, dusk: 0, gutter: 0, breathAt: -1e6 };

  stage.cue('veil', { s: 1 }, () => { const p = pt(2.5); play('rustle', { x: p.x, z: p.z, pitch: 0.8 }, 'the veil parts'); });

  // s 24: two swallows cross right to left 9 m ahead (the Birds group's handle; unverified there, so only asked)
  stage.cue('swallows', { s: 24 }, () => {
    if (!B) return;
    call('birds.first', () => B.first(2.4));
    stage.after(2.2, () => { const p = pt(33); play('flutter', { x: p.x, z: p.z, gain: 0.5 }, 'the first swallows'); });
  });

  // s 30, behind the first rank and the aisle walls: the two aisle wringers take the phase that has each just wrung as the
  // boat is abreast. A machine is never started: only its place in its round is set, while it cannot be seen.
  stage.cue('phase', { s: 30 }, () => { if (!M) return; call('machines.fullTwist', () => hard(() => { M.fullTwist(0, eta(62.5), { hard: true }); M.fullTwist(1, eta(77), { hard: true }); })); });
  stage.cue('posts1', { s: 58 }, () => { if (M) call('machines.fullTwist', () => M.fullTwist(0, eta(62.5), { nudge: 0.3 })); });
  stage.cue('posts2', { s: 70 }, () => { if (M) call('machines.fullTwist', () => M.fullTwist(1, eta(77), { nudge: 0.3 })); });

  // s 40: the first breath. The front and its mark on the water are the Presences'; the steam and the cloth read it.
  const FRAMES = [26, 37, 48, 59, 70, 81, 92], RANK_DYE = { 48: 'SAFFRON', 59: 'MADDER', 70: 'MADDER', 81: 'CRIMSON', 92: 'CRIMSON' };
  stage.cue('breath', { s: 40 }, () => {
    show.breathAt = ctx.time;
    if (P && P.wind && P.wind.breath) call('presences.wind.breath', () => P.wind.breath());
    FRAMES.forEach((s, i) => {
      const t = Math.max(0, (s - GU.breath.from) / GU.breath.speed);            // when the front lifts that rank
      stage.after(t, () => { const p = pt(s, i % 2 ? 5 : -5); play('rustle', { x: p.x, z: p.z, pitch: 0.8 + 0.04 * ((i * 3) % 5), gain: 0.9 }, 'the breath lifts a rank'); });
      // the shaken drops: a line of rings under each rank ahead of the boat, a moment before it lifts
      if (F && F.shake && s > 44) stage.after(Math.max(0, t - 0.4), () => call('falls.shake', () => F.shake({ from: { s, d: -6 }, to: { s, d: 6 }, count: stage.calm ? 8 : 14, over: 1.1, color: dyeOf(RANK_DYE[s]) })));
    });
  });

  // s 76, behind the west front's cloth: the second dipping beam and the copper take their phase (the copper tips by
  // itself every 48 s: this only says when). The beam begins to lift as the boat comes out under the west front (s 95:
  // the page's green cloths, in the picture of postcard 4). The copper begins to tip while the boat is still in the last
  // bay (s 82), so that its sheet slides down the slipway as the boat comes out (s 92) and the fan is spreading on the
  // right of a rider who looks ahead from s 97, and is full as the boat is abreast of it (the page's s 108).
  stage.cue('phase2', { s: 76 }, () => { if (!M) return; call('machines.liftBeam', () => hard(() => M.liftBeam(1, eta(95), { hard: true }))); call('machines.tipCopper', () => hard(() => M.tipCopper(eta(82), { hard: true }))); });
  stage.cue('green', { s: 86 }, () => { if (M) call('machines.liftBeam', () => M.liftBeam(1, eta(95), { nudge: 0.3 })); });
  stage.cue('pour', { s: 100 }, () => { const c = pt(110, 17); rowerLook([c.x, 0.2, c.z], 7); });

  // s 88: the swallow river (asked of the Birds group; its perched birds are not passed, so nothing else hangs on it)
  stage.cue('river', { s: 88 }, () => {
    if (!B) return;
    // (critique: the twelve on the line are switched off in cast_birds.js, they never showed; wings are heard only when there are wings)
    if (B.perchers) {
      call('birds.river', () => B.river({ stagger: stage.calm ? 6 : 4 }));
      [[0.6, 98, -3], [1.8, 106, 4], [3.0, 114, -2]].forEach(([t, s, d]) => stage.after(t, () => { const p = pt(s, d); play('flutter', { x: p.x, z: p.z, gain: 0.5 }, 'the swallow river'); }));
    }
    stage.after(3.6, () => { const p = pt(160, -28); play('bird', { x: p.x, z: p.z }, 'one far call'); });
  });
  stage.cue('riverback', { s: 120 }, () => { if (B) call('birds.riverBack', () => B.riverBack({ over: 12 })); });

  // s 116: the lagoon's stray. Its own module sends it (shared.cast.silks.own); only if someone has switched that off
  // is it sent from here. Its sound: one rustle from where it is as it comes over the water ahead.
  stage.cue('stray', { s: 116 }, () => {
    if (!S) return;
    if (S.own === false && S.crossing) call('silks.crossing', () => S.crossing());
    stage.after(9, () => { const h = S.strays && S.strays.head ? call('silks.strays.head', () => S.strays.head(1, _v)) : null; if (h && far(h.x, h.z) < 60) play('rustle', { x: h.x, z: h.z, gain: 0.5, pitch: 0.9 }, 'the stray passes'); });
  });

  // s 126: THE UNPEGGING. The cue only starts the clock; update() below drives every beat from it.
  stage.cue('unpeg', { s: GU.great.at, settle: () => {
    if (S) { call('silks.settle', () => S.settle()); if (S.strays && S.strays.gone) call('silks.strays.gone', () => S.strays.gone([0, 1, 2, 3])); if (S.last && !/(^|,)(unpeg|all)(,|$)/.test(new URLSearchParams(location.search).get('play') || '')) call('silks.last', () => S.last({ rest: true })); }      // (not when the show is about to be played from here: it sends its own)
  } }, () => {});

  // s 209: under the crown of the west door
  stage.cue('door', { s: 209 }, () => { const p = pt(209, 1); play('rustle', { x: p.x, z: p.z, pitch: 0.9 }, 'the west door'); });

  // s 212: the spouts open. Until then the terrace's six and the causeway's five run as threads.
  if (F && F.thread) call('falls.thread', () => { F.thread('terrace'); F.thread('causeway'); });
  stage.cue('spouts', { s: 212, settle: () => { if (F && F.flow) call('falls.flow', () => { F.flow('terrace', 1, 0); F.flow('causeway', 0.7, 0); }); } }, () => {
    if (F && F.openTerrace) call('falls.openTerrace', () => F.openTerrace());
    if (M && M.openSluice) call('machines.openSluice', () => M.openSluice(0, { hard: true }));
  });

  // s 242, 247, 252: the prow parts the loft's first three ranks
  [[242, 'cloth1', 1], [247, 'cloth2', 0.8], [252, 'cloth3', 0.65]].forEach(([s, name, gain]) => stage.cue(name, { s }, () => { const p = pt(s + 1.5); play('rustle', { x: p.x, z: p.z, pitch: 0.6, gain }, 'a loft cloth parts'); }));

  // ================================================================================================ the unpegging's beats
  // step(): 'now' in the frame the clock first reaches `at`; 'late' if the clock was already well past it when first asked
  // (a picture taken with &play=unpeg part-way down the lagoon): then the beat's STATE is put in place, without its show.
  const step = (key, T, at) => { const seen = show.beats[key]; if (seen === undefined) { show.beats[key] = T >= at ? 1 : 0; return T >= at ? (T - at < 1.5 ? 'now' : 'late') : null; } if (seen === 0 && T >= at) { show.beats[key] = 1; return 'now'; } return null; };
  const origin = ctx.path.point(GU.great.from, 0, 0);
  const lineAt = (seconds, speed = GU.great.speed) => [origin.x + wdir[0] * speed * seconds, origin.z + wdir[1] * speed * seconds];      // where a line that left s 30 is after so long

  const sendFront = (T) => { wind.front({ from: lineAt(T), speed: GU.great.speed, depth: GU.great.depth, strength: GU.great.strength }); show.frontT = T; show.frontAt = ctx.time; };
  const sendDrop = (T) => { wind.release({ from: lineAt(T - U.drop, U.dropSpeed), speed: U.dropSpeed, depth: U.dropSpeed * 2 }); show.dropT = T; show.dropAt = ctx.time; };

  function unpegging(T) {
    const calm = stage.calm;
    // The front and the wind's drop KEEP TO THE CLOCK. For a rider who stops, the clock is the seconds and the front
    // runs by itself at 17 m/s. For a rider who presses on, the clock runs ahead of the seconds: the front is then sent
    // again from where the clock has it (in steps of under a metre), so it comes on faster, a harder gust, and every
    // beat still falls at the same place.
    let k = step('gust', T, 0);
    if (k) {
      if (k === 'now' && P && P.wind && P.wind.gust) { call('presences.wind.gust', () => P.wind.gust()); show.frontT = T; show.frontAt = ctx.time; }
      else if (wind && wind.front) call('wind.front', () => sendFront(T));
      if (k === 'now' && B && B.gust) call('birds.gust', () => B.gust({ stagger: calm ? 4 : 2 }));
    } else if (T < U.drop && wind && wind.front && show.frontAt != null && (T - show.frontT) - (ctx.time - show.frontAt) > 0.05) call('wind.front', () => sendFront(T));
    if (stage.beat('unpeg.rose', T, U.rose + 0.6)) rowerLook([HUB[0], HUB[1], HUB[2]], 9);
    k = step('letGo', T, U.letGo);
    if (k && S) { if (T < U.down + 2) call('silks.letGo', () => S.letGo({ seconds: calm ? 4.5 : 3 })); else call('silks.settle', () => S.settle()); }
    k = step('lift', T, U.lift);
    if (k && S && S.lift && T < U.down + 2) call('silks.lift', () => S.lift({ seconds: calm ? 6.5 : 5 }));
    // the wind drops: from where it came, so hems come down rank by rank in the order they rose; a little quicker than
    // it came (24 m/s, each rank two seconds in falling), so that the door's low curtains are down by clock 26 to 27
    k = step('drop', T, U.drop);
    if (k && wind && wind.release) call('wind.release', () => sendDrop(T));
    else if (T > U.drop && T < U.drop + 20 && wind && wind.release && show.dropAt != null && (T - show.dropT) - (ctx.time - show.dropAt) > 0.05) call('wind.release', () => sendDrop(T));
    k = step('last', T, U.last);
    if (k && S && S.last) {
      // (critique: it now comes down across the bow from the indigo side, in front of the rider, and finds its own place from where the boat
      // is and how fast it goes: cast_silks.js. Its head is on the water about 9.5 s after it sets out and it lies still about 12.5 s after.)
      call('silks.last', () => S.last());
      const at = S.lastAt;
      if (at) stage.after(12.5 / (calm ? 0.7 : 1), () => { play('whump', { x: at[0], z: at[1], gain: 0.5, pitch: 0.8 }, 'the last silk lies down'); rowerLook([at[0], 0.1, at[1]], 6); });
    }
    if (stage.beat('unpeg.lamp', T, 26)) rowerLook([K.world[0], 2.2, K.world[1]], 7);
    k = step('down', T, U.down);
    if (k && B && B.down) call('birds.down', () => B.down());
    // the ambient strays leave with the rest: the vault's at once (it is up the nave, behind), the wheel's when it is
    // behind the wheel, the far one in the dusk. (A ribbon on a loop cannot be sent away: it can only go.)
    if (S && S.strays && S.strays.gone && T >= U.strays) {
      const go = (i) => { show.strayGone[i] = 1; call('silks.strays.gone', () => S.strays.gone([i])); };
      if (!show.strayGone[0]) go(0);
      if (!show.strayGone[2]) { const h = S.strays.head ? call('silks.strays.head', () => S.strays.head(2, _v)) : null; if (!h || h.z < HUB[2] - 8 || T > 40) go(2); }
      if (!show.strayGone[3] && T > 24) go(3);
    }
    // a rustle from each silk that comes within 10 m of the rider on its way out
    if (S && S.bare && S.flying && S.flying.head && T < 32 && every('silk.near', 0.45)) {
      for (let i = 0; i < 26; i++) {
        if (show.rustled[i]) continue;
        const h = call('silks.flying.head', () => S.flying.head(i, _v));
        if (h && far(h.x, h.z) < 10) { show.rustled[i] = 1; play('rustle', { x: h.x, z: h.z, pitch: 0.65 + 0.05 * (i % 4), gain: 0.7 }, 'a silk passes close'); break; }
      }
    }
  }

  // the front passes the boat: the lint streaks, and for the great gust the breath and rustles all round
  function frontPasses(strength) {
    if (A && A.front) call('airs.front', () => A.front(strength));
    if (strength < 0.9) return;
    play('breath', { gain: 1.2 }, 'the great gust reaches the boat');
    [[0.0, -7, -9], [0.25, 8, -4], [0.5, -9, 6], [0.8, 7, 12], [1.2, -3, 20]].forEach(([t, d, a], i) => stage.after(t, () => { const p = pt(ctx.s + a, d); play('rustle', { x: p.x, z: p.z, pitch: 0.6 + 0.1 * i, gain: 1 }, 'the gust, all round'); }));
  }

  let logged = false;
  const S0 = sun ? sun.spread : 14, ownSpread = !QS.has('spread');
  ctx.onDispose(() => { if (boat && boat.model && boat.model.wind) boat.model.wind.set(0, 0, 0); });

  return {
    update(dtRaw) {
      const dt = Math.min(0.1, Math.max(0, dtRaw || 0)), s = ctx.s, t = ctx.time, calm = stage.calm;
      // ---- through the veil (our half of the passage in): the cream cloths over the eyes, gone by s 5
      const a = 1 - smooth(0.5, 5, s);
      if (a > 0.003) ctx.wash('#f6e2b8', a);
      const d = Math.hypot(boat.x - K.world[0], boat.z - K.world[1]);
      spark.material.color.copy(base).multiplyScalar(smooth(7, 26, d));

      if (QUIET) return;                                                          // (&stagequiet=1, for measuring: the layout's lamp and wash only)
      // ---- the unpegging's clock: -1 before; seconds into it; 1e5 when the boat came in already past it (settled)
      const T = stage.clock('unpeg', (q) => (q - GU.great.at) / GU.great.clock[1]);
      const live = T >= 0 && T < 1e4;
      if (live) unpegging(T);

      // ---- the wind where things stand: at the boat, at the kept lamp
      const fb = wind && wind.frontAt ? clamp01(wind.frontAt(boat.x, boat.z)) : 0;
      const fl = wind && wind.frontAt ? clamp01(wind.frontAt(K.world[0], K.world[1])) : 0;
      const past = P && P.wind && P.wind.past ? call('presences.wind.past', () => P.wind.past()) : null;
      if (past != null) {
        if (show.lastPast != null && show.lastPast < 0 && past >= 0 && past < 40 && wind && wind.state) frontPasses(wind.state.strength);
        show.lastPast = past;
        // the hull rolls a degree as the front goes by (not with reduced motion). The boat eases its own roll every
        // frame; a little added each frame stands as an offset on top of it and dies away with it.
        if (!calm && boat.tilt && past > 0 && past < 80 && wind && wind.state) {
          const bump = smooth(0, 10, past) * (1 - smooth(14, 70, past));
          boat.tilt.rotation.z += 0.0175 * Math.min(1, wind.state.strength) * bump * (1 - Math.exp(-dt * 5));
        }
      }
      // the prow lantern's flame leans with the wind at the boat
      if (boat.model && boat.model.wind) { const m = (calm ? 0.5 : 1) * fb; boat.model.wind.set(wdir[0] * m, 0, wdir[1] * m); }
      // the kept lamp: in the gust its flame leans and gutters (level 0.6) and does not go out; as the wind drops it
      // goes on guttering for a breath and then stands steady
      show.gutter += (fl - show.gutter) * (1 - Math.exp(-dt / (fl > show.gutter ? 0.4 : 2.2)));
      if (lamp && lamp.wind) {
        const g = show.gutter;
        lamp.wind.set(wdir[0] * 0.9 * g * (calm ? 0.5 : 1), 0, wdir[1] * 0.9 * g * (calm ? 0.5 : 1));
        if (lamp.target > 0.05 || g > 0.02) { lamp.target = g > 0.02 ? 1 - 0.4 * g + 0.1 * g * Math.sin(t * 7.1) * Math.sin(t * 2.3 + 1) : 1; lamp.rate = 2.5; }
      }

      // ---- the light. Exposure: up 12 per cent as the rose opens, back as the wind drops (6 with reduced motion).
      // set.js lays the look's states down every frame before this, so the bump is a factor on top of what it wrote.
      const up = live ? smooth(U.rose, U.rose + 2, T) * (1 - smooth(U.down, 28, T)) : 0;
      if (up > 0 && ctx.look && typeof ctx.look.exposure === 'number') ctx.look.exposure *= 1 + (calm ? 0.06 : 0.12) * up;
      // The dusk: once the wind has begun to drop, and while the boat is between the blue yard and the door, the bar of
      // dyed light is as wide as the reach (light.js: sun.spread). Nothing changes until a cloth really covers the sun:
      // then the whole reach takes it. Past the door the bar is the nave's again, and the wheel's far face is in the sun.
      // (A boat that steers for the lamp is still behind the low curtains past s 198: the bar stays wide for it until
      // the cloth is no longer across the sun, so the dusk never lifts with the sun still covered.)
      const behind = s >= 198 && s < 214 && sun && sun.cover > 0.4;
      const wide = T >= U.dusk ? smooth(158, 166, s) * (behind ? 1 : 1 - smooth(198, 204, s)) : 0;
      show.dusk = show.first ? wide : show.dusk + (wide - show.dusk) * (1 - Math.exp(-dt / (calm ? 2.4 : 1.2)));
      if (sun && ownSpread) sun.spread = S0 + (400 - S0) * show.dusk;
      if (A && A.shafts) A.shafts.level = Math.round((1 - 0.7 * show.dusk) * 10) / 10;      // (in tenths: the Airs group lays its lint again at every change)

      // ---- sound that moves
      const au = ctx.audio;
      // the wind follows the wave that moves the cloth: heard coming, held, heard leaving
      const tb = t - show.breathAt;
      const coming = live && T < U.pass + 1.5 ? smooth(0, U.pass, T) : tb >= 0 && tb < 3.5 ? 0.45 * smooth(0, 2.9, tb) : 0;
      levels.wind = (T >= U.down ? 0.25 : 0.3) + 0.5 * Math.max(fb, coming);
      // falling water: the copper's pour for six seconds; the terraces once the spouts are open; the wheel's rising side
      const tp = t - show.pourAt, pour = smooth(0, 1.5, tp) * (1 - smooth(7.5, 11.5, tp)) * (1 - smooth(35, 70, far(pt(108, 23).x, pt(108, 23).z)));
      const terr = stage.done('spouts') ? smooth(0, 6, stage.since('spouts')) * smooth(206, 212, s) * (1 - smooth(238, 250, s)) : 0;
      const rise = 1 - smooth(12, 30, far(HUB[0] + 15.6, HUB[2]));
      levels.falls = Math.max(0.4 * pour, 0.3 * terr, 0.45 * rise);
      levels.rain = 0.35 * (P && P.wheel && P.wheel.rain && P.wheel.rain.level ? clamp01(call('presences.wheel.rain.level', () => P.wheel.rain.level()) || 0) : 0);
      const hub = 1 - smooth(20, 60, far(HUB[0], HUB[2]));
      levels.drone = 0.35 * hub; levels.deep = 0.3 * hub;
      const loft = smooth(238, 244, s);
      levels.drips = lerp(0.12 + 0.28 * smooth(6, 26, s), 0.5, loft);
      // the music: the fullest mix of the ride; it opens round the unpegging and closes as the sun goes into the loft
      const open = live ? smooth(0, 4, T) * (1 - smooth(U.down, U.close, T)) : 0, close = smooth(218, 250, s);
      levels.music = lerp(lerp(0.75 + 0.15 * smooth(8, 28, s), 1.0, open), 0.6, close);
      levels.width = lerp(1.15, 1.4, open);
      levels.lowpass = close > 0.001 ? Math.round(600 * Math.pow(4, 1 - close)) : 20000;      // (the track is dark: only below 2.4 kHz is a low-pass heard)
      if (au && au.layer) {
        au.layer('wind', { level: levels.wind, tone: 0.45 }, 1.5);
        au.layer('falls', levels.falls, 2);
        au.layer('rain', levels.rain, 2);
        au.layer('drone', { level: levels.drone, notes: [38], colour: 0.2 }, 3);
        au.layer('deep', { level: levels.deep, note: 26 }, 3);
        au.layer('drips', { level: levels.drips, rate: lerp(0.6, 0.4, loft) }, 3);
        au.music({ gain: levels.music, width: levels.width, lowpass: levels.lowpass }, 2);
        au.space(s >= 238 ? { size: 'room', mix: 0.35, lowpass: 3000 } : { size: 'open', mix: 0.22, lowpass: 20000 }, 4);
      }

      show.first = false;
      if (logAt >= 0 && !logged && t >= logAt) {
        logged = true;
        const r2 = (v) => +(+v).toFixed(2);
        const say = (line) => console.error('reach/stage (asked with &stagelog): ' + line);
        say(`t ${r2(t)} s ${r2(s)} clock ${r2(T)} calm ${calm} bare ${S ? S.bare : '-'} lastAt ${S && S.lastAt ? S.lastAt.map(r2).join(' ') : '-'} spread ${sun ? r2(sun.spread) : '-'} cover ${sun ? r2(sun.cover) : '-'} exposure ${ctx.look ? r2(ctx.look.exposure) : '-'} front at boat ${r2(fb)} at lamp ${r2(fl)} lamp ${r2(lamp.lit)} rower ${rower() ? 'aboard' : 'none'} looks asked ${looks.asked} given ${looks.given}`);
        say(`fired [${Object.keys(stage.fired).join(', ')}]`);
        say(`levels ${JSON.stringify(Object.fromEntries(Object.entries(levels).map(([k2, v]) => [k2, r2(v)])))}`);
        if (M) say('machines: ' + call('the log', () => `wringer 0 twist ${r2(M.wringers[0].twist())} dripping ${r2(M.wringers[0].dripping())}, wringer 1 twist ${r2(M.wringers[1].twist())}, beam 1 streaming ${r2(M.dippers[1].streaming())}, copper lip ${r2(M.copper.flowAt(0))} foot ${r2(M.copper.flowAt(4))}`));
        { const all = Object.entries(heard).map(([k2, v]) => `${k2}: ${v} [${(when[k2] || []).join(' ')}]`); for (let q = 0; q < all.length; q += 4) say('heard ' + all.slice(q, q + 4).join('; ')); }
      }
    },
  };
}
