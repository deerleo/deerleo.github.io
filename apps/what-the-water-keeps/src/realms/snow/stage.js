// The orchard in snow: the route of moments, the showstopper, the staged sound (stage 4; docs/build/snow/4-staging.md).
// Stage 1 (layout and light) left this list of what the page puts here (docs/art/snow.md, section 6). Every moment is
// started by where the boat is. THE PAGE'S s IS NOT THE PATH'S FROM s 178 ON (the path goes round the islet, 9 m longer): a
// cue "at s 214" is stage.cue(name, { s: shared.frame.pathS(214) }, ...); before s 178 the two agree to 0.5 m.
// What already happens by distance, without a cue: the light states and the snowfall's thinning (set.js), the current
// (plan.current), the ice, falls and space of the sound (snow.js), the deer, the firefly scouts, the pans, the veils, the
// rings from the other evening and the bow's ticks (the cast).
//
// WHO FIRES WHAT (never both):
//   the cast's own cues, kept:  `owl` (s 27, cast_owl.js), `stag` (page s 124, cast_presences.js, with its own sound)
//   taken over here:            the bridge's sift (falls.auto.bridge = false), the outlier's slide (falls.auto.outlier =
//                               false), the three ice songs and the thaw (ice.auto.song = false)
//
//   cue        where            what
//   lantern    s 0              the lantern recovers: ctx.lantern(1, 4)
//   (white)    s 22             no cue: the exposure is set.js's by distance; shimmer and air come in by distance (update)
//   hush       after `owl`      every layer of the bed falls to half for 6 s (1 s in, 1 s out); the rower looks
//   bridge     s 44 at the latest (earlier for a boat with way on: update)   the sift between the planks; one rustle
//   plain      s 62             the first ice song crosses the left plain; the deer stand still; `crack` 150 m to the left
//   flush      s 78             the outlier's waxwings fly on (before their snow goes)
//   bough      s 80             the bough's snow slides (1.85 s), it springs, 0.3 s later the apple drops; the rower looks
//   bay        s 103            `crack` under the bow, a ring, ticks (the skin's own ticks are the cast's, by the bow)
//   (stag)     page s 124       the cast's
//   (pond)     s 156            no cue: the trill, the bats' dips and their sounds come by distance (callbacks)
//   show       within 8.4 m of the cold lamp (`lampnear`), or page s 180   SHOWSTOPPER, on the clock `show` (below)
//   (avenue)   page s 214       no cue: the current is the plan's, the nine waxwings the cast's, the hives' drone by distance
//   thaw       page s 224       the third ice song: the margins break into plates
//
// THE SHOWSTOPPER (clock T; with reduced motion the fall takes 16 s and everything after it is later: B below)
//   T 0        the lamp's own pass (shared.lamp.pass: bow lantern, lit lamp, its note); the cold lantern turns on its chain
//   T 0.3      the first front of fireflies leaves (262, 0): at the skirts at T 3.5, under the hull at T 6.7; `bloom` at 1.5
//   T 7 / 7.8  the sixty hush, then lift; three flutters (the first snow to go is the fall's own top load)
//   T 8.5      THE FALL (cast.fall.go); `breath`; whumps and rustles by its callback; cracks north (T 12) and south (T 14.3);
//              the picture washed toward paper by up to 0.3 and the fog to 0.012 (T 12 to 17.5); `rain` 0.3 for 6 s
//   T 19       the music opens (width 0.8, gain 0.65, reverb 0.12 over 6 s)
//   T 23       the great petal fall (cast.greatFall); a patter of ticks by its callback; T 26 the waxwings start home;
//              T 28 an egret opens its wings (reduced motion: 33, 36, 38)
//   (THE ROOST IS OUT: ROOST_ON below, and docs/build/snow/5-critique.md. With &roostshow=1 it plays as it was: T 20 the
//   roost, in the water only, LOW (4 m), down the second avenue, past the hull, round the bole under the blossom; T 27 the
//   funnel, poured from the clock over 7 s, the waxwings start home; T 29 the egret; T 34 the great petal fall.)
// Developer switches: &roosty=<m> &roostr=<m> &roostw=<m> &roostl=<m> the roost's height, ring radius, width and length;
//   &roostm=<m> the funnel's mouth at that height (default: the cast's, over the dome); &roostorder=random; &stagelog=1 says each beat
//   in the console (as warnings: tools/shot.py does not print them).
import * as THREE from 'three';
import { ease } from '../../engine/stage.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const Q = new URLSearchParams(location.search);
const num = (k, d) => { const v = parseFloat(Q.get(k)); return Number.isFinite(v) ? v : d; };

export async function build(ctx, plan, shared) {
  const stage = ctx.stage, F = shared.frame, cast = shared.cast || {}, calm = !!ctx.reducedMotion;
  if (!stage || !F) return {};
  const here = shared.here || { s: 0, d: 0 }, memory = shared.memory || { amount: 1 };
  const { falls, ice, birds, owl, flies, roost, hives, deer, bats } = cast;
  const tree = shared.tree, lamp = shared.lamp, rnd = ctx.rng(4401), LOG = Q.has('stagelog');
  const treeAt = tree && tree.centre ? tree.centre : F.at(plan.pond.at[0], plan.pond.at[1], 0);      // the bole, in the realm
  const P = (s) => F.pathS(s);                                 // the page's s as the path's (for cues)

  // ---- small helpers: one handle that fails must not take the moment with it; no sound in a picture; nothing too often
  const safe = (what, fn) => { try { return fn(); } catch (err) { console.error(`snow/stage: ${what} failed: ${(err && err.stack) || err}`); } return undefined; };
  const say = (what) => { if (LOG) console.warn(`snow/stage ${ctx.time.toFixed(1)} s (page s ${here.s.toFixed(1)}): ${what}`); };
  const sound = (name, o) => { const a = ctx.audio; if (!a || !a.play) return false; try { return a.play(name, o); } catch (err) { return false; } };
  const gate = {};
  const every = (key, seconds) => { const t = ctx.time; if (t - (gate[key] ?? -1e9) < seconds) return false; gate[key] = t; return true; };
  const look = (p, seconds) => { const r = ctx.boat && ctx.boat.model && ctx.boat.model.rower; if (r && r.lookAt && p) safe('rower.lookAt', () => r.lookAt(p, seconds)); };
  const bow = (ahead = 1.85) => { const b = ctx.boat; return [b.x - Math.sin(b.heading) * ahead, b.z - Math.cos(b.heading) * ahead]; };

  // ---- what the staging takes over from the cast (3-cast-falls.md, 3-cast-ice.md: "set one false and call it from a cue")
  if (falls && falls.auto) { falls.auto.bridge = false; falls.auto.outlier = false; }
  if (ice && ice.auto) ice.auto.song = false;

  // ================================================================================================ the sound of what is drawn
  // Every callback the cast left: a ring that is drawn is a drop that is heard. What belongs to the memory is heard as if
  // through the water (low-passed 500 to 900 Hz): the area's rule for the ear.
  const snd = { hush: 1, front: 0, rain: 0, opened: false, sent: false, openOver: 6 };
  let liftAt = -100;
  if (falls) {
    falls.onSift = (x, y, z) => { if (every('rustle', 1.2)) sound('rustle', { x, z, gain: 0.9 }); };                     // powder (the bridge's three veils are one rustle)
    falls.onRelease = (what, where) => {                                                                                  // a bough lets go: whump
      const p = !where ? null : where.a && where.b ? [(where.a.x + where.b.x) / 2, (where.a.z + where.b.z) / 2] : Array.isArray(where) ? [where[0], where[2]] : where.x !== undefined ? [where.x, where.z] : null;
      if (p) sound('whump', { x: p[0], z: p[1], gain: what === 'outlier' ? 0.8 : 0.6, delay: what === 'outlier' ? 0.5 : 0.2 });
    };
    falls.onLand = (x, z, strength, what) => {
      if (what === 'outlier' || what === 'low') { if (every('plip', 0.11)) sound('drop', { x, z, gain: 0.3 + 0.3 * (strength || 0), pitch: 0.8 + 0.5 * rnd() }); }      // the cluster of drops under a slide
      else if (what === 'petal') { if (every('petal', 0.085)) sound('tick', { x, z, pitch: 0.3, gain: 0.3, lowpass: 900 }); }                                        // a ring from below: at most 12 a second
    };
  }
  if (cast.fall) cast.fall.onRelease = (index, load) => {                                                                 // the fall: twelve whumps and eight rustles of its 44 loads
    if (!load || !load.a || !load.b) return;
    const x = (load.a.x + load.b.x) / 2, z = (load.a.z + load.b.z) / 2;
    if (index % 4 === 0 || index === 43) sound('whump', { x, z, gain: 0.4 + 0.3 * rnd(), delay: 0.6 });
    else if (index % 5 === 2 || index === 13) sound('rustle', { x, z, gain: 1 });
  };
  if (ice) {
    ice.onKnock = (x, z, strength) => { if (every('knock', 0.3)) sound('knock', { x, z, gain: 0.3 + 0.5 * (strength || 0) }); };
    ice.onRing = (x, z) => sound('drop', { x, z, pitch: 0.6, lowpass: 900, gain: 0.7 });                                 // a ring from the other evening
    ice.onTick = (x, z) => { if (every('tick', 0.14)) sound('tick', { x, z, gain: 0.55, pitch: 0.85 + 0.3 * rnd() }); };  // the bow breaks a plate
    ice.onSong = (which, from) => {                                                                                       // a crack begins: its falling note
      if (which === 'plain') { const p = F.at(72, -150); sound('crack', { x: p.x, z: p.z, gain: 0.7 }); }
      else if (which === 'thaw') for (const side of [-1, 1]) { const p = F.at(here.s + 100, side * 45); sound('crack', { x: p.x, z: p.z, gain: 0.7, delay: side > 0 ? 0.8 : 0 }); }
      else { const p = Array.isArray(from) ? { x: from[0], z: from[2] } : F.at(plan.pond.at[0], which === 'north' ? 26 : -26); sound('crack', { x: p.x, z: p.z, gain: 0.6 }); }
    };
  }
  if (birds) {
    birds.onLeave = (i, x, y, z, group) => {                                                                              // wings: the bough's twice, a flit now and then
      if (group === 'tree' && ctx.time - liftAt < 6) return;                                                             // (the lift has its own three)
      if (every('flutter_' + group, group === 'tree' ? 1.5 : 0.6)) sound('flutter', { x, z, gain: group === 'tree' ? 0.6 : 1 });
    };
    birds.onTrill = (x, y, z) => sound('sparkle', { x, z, pitch: 1.2, gain: 0.3 });
    birds.onCrumb = (x, z) => { if (every('crumb', 0.9)) sound('drop', { x, z, pitch: 1.6, gain: 0.3 }); };
    birds.onPlop = (x, z) => sound('drop', { x, z, pitch: 0.6, gain: 0.9 });                                             // the apple
  }
  if (bats) bats.onDip = (x, z) => sound('tick', { x, z, pitch: 0.3, lowpass: 800, gain: 0.5 });                         // a ring nothing above has made

  // ================================================================================================ the route
  stage.cue('lantern', { s: 0, settle: () => ctx.lantern(1, 0.1) }, () => { say('lantern'); ctx.lantern(1, 4); });

  // the owl (the cast's cue): the bed falls to half for six seconds, a second in and a second out; no wing is heard
  stage.cue('hush', { after: 'owl', delay: 0.6 }, () => {
    say('hush');
    stage.tween((v) => { snd.hush = v; }, 1, 0.5, 1);
    stage.after(5, () => stage.tween((v) => { snd.hush = v; }, 0.5, 1, 1));
    look(F.at(44, -2, 2.6), 5);
  });

  // the bridge: the sift between the planks as the bow passes under. The veil takes a second to come down to the lantern,
  // which hangs two metres ahead of the eye: update() lets it go that much early for a boat with way on (the cast's rule);
  // the cue's own place is where a boat that creeps gets it.
  const BRIDGE = plan.bridge.s - 2;
  stage.cue('bridge', { s: BRIDGE, rearm: true }, () => { say('bridge'); safe('the bridge\'s sift', () => falls && falls.bridgeSift && falls.bridgeSift()); });

  // the plain opens: the first ice song, and the deer stand still
  stage.cue('plain', { s: 62, settle: () => safe('the plain\'s crack, settled', () => ice && ice.song('plain', { settled: true })) }, () => {
    say('plain');
    safe('the plain\'s crack', () => ice && ice.song('plain'));
    stage.after(0.5, () => safe('deer.halt', () => deer && deer.halt(3)));
  });

  // the bough: the birds fly on FIRST (the two nearest go by themselves at 7 m), then its snow slides, it springs, and
  // 0.3 s after the snow has gone one apple drops
  const slideNow = () => {
    say('the bough slides');
    safe('the outlier\'s slide', () => cast.slide && cast.slide('outlier'));
    safe('the apple', () => birds && birds.apple && birds.apple.drop(2.15));
    look(shared.outlier && shared.outlier.tip, 4);
  };
  stage.cue('flush', { s: 78, settle: () => safe('birds.seatAhead', () => birds && birds.seatAhead()) }, () => { say('flush'); safe('birds.flush', () => birds && birds.flush()); });
  stage.cue('bough', { s: 80, settle: () => {
    safe('the outlier\'s slide, settled', () => cast.slide && cast.slide('outlier', { settled: true }));
    safe('birds.seatAhead', () => birds && birds.seatAhead());
    safe('the apple, settled', () => birds && birds.apple && birds.apple.settle());
  } }, () => {
    const flushed = stage.since('flush');
    if (flushed >= 0.7 || !birds) { slideNow(); return; }
    if (flushed < 0) safe('birds.flush', () => birds.flush());
    stage.after(0.9 - Math.max(0, flushed), slideNow);
  });

  // the bay: the skin gives once under the bow
  stage.cue('bay', { s: 103 }, () => {
    say('bay');
    const [bx, bz] = bow(2.2);
    sound('crack', { x: bx, z: bz, gain: 0.5 });
    safe('the bay\'s ring', () => ctx.water.ripple(bx, bz, 0.5, 1.4));
    for (let k = 0; k < 4; k++) sound('tick', { x: bx, z: bz, gain: 0.5, pitch: 0.8 + 0.1 * k, delay: 0.25 + 0.18 * k });
  });

  // the thaw: the third ice song; the margins break into plates that run with the boat
  stage.cue('thaw', { s: P(224), settle: () => safe('the thaw, settled', () => ice && ice.thaw({ settled: true })) }, () => { say('thaw'); safe('the thaw', () => ice && ice.thaw()); });

  // ================================================================================================ the showstopper
  // One clock. A boat left to the current comes within 8 m of the cold lamp at path s 167 and makes 0.9 m/s: the clock
  // is pushed only by a boat that makes more than 1.25 m/s (a rider who presses on gets it faster).
  const lampAt = lamp && lamp.position ? lamp.position : F.at(plan.lamp.flame[0], plan.lamp.flame[1], plan.lamp.flame[2]);
  let S0 = 167;
  for (let s = 150; s < 190; s += 0.25) { const p = ctx.path.point(s, 0, 0); if (Math.hypot(p.x - lampAt.x, p.z - lampAt.z) <= 8) { S0 = s; break; } }
  // the beats, in seconds of the clock (reduced motion: the fall over 16 s, the roost at half speed, so all that follows is later)
  const B = calm
    ? { fall: 8.5, north: 14.5, south: 18.5, wash: null, rain: [2.5, 13], music: 26, roost: 27, pour: 41, pourFor: 10, great: 52 }
    : { fall: 8.5, north: 12, south: 14.3, wash: [3.5, 5, 6, 9], rain: [1.5, 7.5], music: 19, roost: 20, pour: 27, pourFor: 7, great: 34 };
  // THE ROOST IS OUT OF THE SHOW (critique, 8 November; docs/build/snow/5-critique.md). From the boat it was a violet
  // smudge beside the hull that could pass for a fault: no bird could be made out and the pour was not seen (the water
  // under the crown is a patchwork of pale blossom and dark gaps, and small birds, dark or pale, do not part from it).
  // THE ONE LINE: ROOST_ON. False, the tree stands bare, the mirror re-forms, and the fall goes straight to the great
  // petal fall; the waxwings come home after it. &roostshow=1 (developer) plays the beat as it was, with the page's times.
  const ROOST_ON = Q.get('roostshow') === '1';
  if (ROOST_ON) { B.home = B.pour; B.stretch = B.pour + 2; }
  else { B.great = calm ? 33 : 23; B.home = B.great + 3; B.stretch = B.great + 5; }

  // ---- the roost's way, LOW. The cast's path (19 to 28 m up, round the crown at 36 m) lies above the reflected crown,
  // which the water shows from underneath as a ceiling of blossom: nothing of it can be seen from the boat (3-cast-
  // presences.md, 3-cast-owl.md). Here they come down the second avenue between the ranks at 8 to 5 m, into the pond at
  // 4 m, past the hull on its own (south) side and round the bole under the blossom, one and a half times; with reduced
  // motion at half speed and round the far (north) side only.
  const RY = num('roosty', 4.2), RR = num('roostr', 15), RW = num('roostw', 7);
  const tc = F.locate(treeAt.x, treeAt.z, {});
  const ringAt = (th) => F.at(tc.s + RR * Math.cos(th), tc.d + RR * Math.sin(th), RY).toArray();          // th 0 = west (the second avenue's mouth), +90 degrees = north
  const avenue = [[268, 0, 7.5], [250, -1, 6.5], [232, -2.5, 5.4], [218, -6, RY + 0.4]].map(([s, d, y]) => F.at(s, d, y).toArray());      // (the flock is drawn out BEHIND the place it is given: begun at s 300 its head took 5.5 s to reach the pond)
  const ring = [];
  if (calm) for (let k = 0; k <= 9; k++) ring.push(ringAt((0.08 + k / 9 * 1.0) * Math.PI));              // far side only: west, north, east
  else for (let k = 0; k <= 24; k++) ring.push(ringAt((-0.14 - k / 16 * 2) * Math.PI));                  // south (the hull's side) first, then east, north, west, and half round again
  const way = [...(calm ? avenue.map(([x, y, z]) => [x + 5, y, z]) : avenue), ...ring];
  // The ribbon: the page's 200 m (at 120 m it had passed the hull in three seconds; at 200 the smoke is on the water beside
  // the boat from T 24.5 to about T 30), narrow and shallow so that it stays under the blossom. shape()'s `dabs` and `scale`
  // change nothing on a flock that lives only in the mirror (tried: the pictures are the same to the pixel).
  const ribbon = { length: num('roostl', 200), width: RW, depth: 3, fold: 3, speed: calm ? 10 : 20 };
  const INTO = { at: [treeAt.x, 4.5, treeAt.z], radii: [15, 3, 15] };                                       // where they end: the vault under the blossom, where the water shows them
  const MOUTH = Q.has('roostm') ? { mouth: [treeAt.x, num('roostm', 9), treeAt.z], radius: num('roostmr', 14) } : {};      // &roostm=<m> (developer): the funnel's mouth at that height instead of the cast's (3.5 m over the dome's top)
  const ORDER = Q.get('roostorder') === 'random' ? 'random' : 'head';
  let roostOn = false, funnelSet = false, rushAlt = false;
  const centre = new THREE.Vector3();
  const roostEnter = () => {
    if (!roost || memory.amount < 0.3) return;
    say('the roost enters');
    safe('the roost enters', () => { roost.show(); roost.shape(ribbon, 0.01); roost.poured = 0; roost.follow(way, { seconds: 0.01, closed: false, at: 0 }); roost.at = 0; roostOn = true; });
  };

  let T = -1, settled = false;
  const did = {};
  /** One beat of the clock: `play` the first time T reaches `at`; `late` instead if the clock was already past it (a rider who came in part-way, or pressed on): the world after it, no show. */
  const beat = (key, at, play, late) => {
    if (did[key] || T < at) return;
    did[key] = true;
    if (stage.beat('show.' + key, T, at)) { say(`T ${T.toFixed(1)}: ${key}`); play(); } else if (late) { say(`T ${T.toFixed(1)}: ${key} (late: its after-state)`); late(); }
  };
  const showStart = () => {
    say('show');
    safe('the lamp\'s pass', () => { if (lamp && lamp.pass && memory.amount > 0.5) lamp.pass(); });        // the bow lantern swells, the lit lamp brightens by half, its note (D5, as if from under the water)
    const L = lamp && lamp.cold && lamp.cold.lantern;                                                       // the cold lantern does not light: it turns a few degrees on its chain
    if (L && L.rotation) { const r0 = L.rotation.y, turn = calm ? 0.07 : 0.16; stage.tween((v) => { L.rotation.y = v; }, r0, r0 + turn, 2.4, ease.settle).then(() => stage.tween((v) => { L.rotation.y = v; }, r0 + turn, r0, 5)); }
  };
  const showSettle = () => {                                    // a rider who enters past it: the tree bare, the cracks lying, the music open, nothing in the water
    settled = true;
    safe('fall.clear', () => cast.fall && cast.fall.clear());
    safe('the pond\'s cracks, settled', () => { if (ice) { ice.song('north', { settled: true }); ice.song('south', { settled: true }); } });
    snd.opened = true; snd.openOver = 0.5;
  };
  stage.cue('show', { s: P(180), settle: showSettle }, showStart);
  stage.cue('lampnear', { near: { x: lampAt.x, z: lampAt.z, r: 8.4 } }, () => { if (memory.amount > 0.5) stage.fire('show'); });      // (0.4 m before the set's own pass, which stands down once `show` has fired)
  // the fronts after the first: one every 8.5 s at 60 per cent for as long as the rider stays (they fade with the memory through the thaw).
  // With reduced motion a front is a ten-second swell of the whole field: one every 21 s, so that the water is dark for longer than it is lit
  // (at 8.5 s the swells ran together and the pond was a field of green lights that never went out)
  const WEST = F.at(262, 0, 0).toArray();
  if (flies && flies.set && flies.set.repeat) safe('flies.repeat', () => flies.set.repeat({ from: 8.8, every: calm ? 21 : 8.5, origin: WEST, dir: [0, 0, 1], strength: 0.6 }));

  const showUpdate = () => {
    const tx = treeAt.x, tz = treeAt.z, f = T - B.fall;
    beat('front', 0.3, () => safe('the first front', () => flies && flies.wave({ at: T })));
    beat('bloom', 1.5, () => sound('bloom', { note: 69, gain: 0.4, lowpass: 900 }));
    beat('hush', 7, () => safe('birds.hush', () => birds && birds.hush(true)), () => safe('birds.hush', () => birds && birds.hush(true)));
    const lift = () => safe('birds.lift', () => { if (birds) { liftAt = ctx.time; birds.lift(); } });
    beat('lift', 7.8, () => { lift(); for (let k = 0; k < 3; k++) sound('flutter', { x: tx, z: tz, gain: 1.2, pitch: 1.15 - 0.1 * k, delay: 0.1 + 0.42 * k }); }, () => { if (T < B.home + 20) lift(); });
    beat('fall', B.fall, () => {
      safe('fall.go', () => cast.fall && cast.fall.go());
      // (The cast's ordinary sifts go on through the fall and its late sifts. They were held here for 33 s, because the
      // two together took the cast's pool of far powder over its 2,400 grains; the pool is 6,000 now: cast.js.)
      sound('breath', { x: tx, z: tz, gain: 1 }); look([tx, 22, tz], 9);
    }, () => safe('fall.clear', () => cast.fall && cast.fall.clear()));
    beat('north', B.north, () => safe('the north crack', () => ice && ice.song('north')), () => safe('the north crack, settled', () => ice && ice.song('north', { settled: true })));
    beat('south', B.south, () => safe('the south crack', () => ice && ice.song('south')), () => safe('the south crack, settled', () => ice && ice.song('south', { settled: true })));
    // the whitening: the picture washed toward paper by up to 0.3 (1.5 s in, 3 s out), the fog to 0.012; none with reduced motion
    if (B.wash && f > B.wash[0] && f < B.wash[3] && cast.fall && cast.fall.running) {
      const k = smooth(B.wash[0], B.wash[1], f) * (1 - smooth(B.wash[2], B.wash[3], f));
      ctx.wash(plan.chip.paper, 0.3 * k);
      const fog = ctx.look && ctx.look.fog; if (fog && fog.density < 0.012) fog.density += (0.012 - fog.density) * k;
    }
    snd.rain = f > B.rain[0] && f < B.rain[1] && cast.fall && cast.fall.running ? 0.3 : 0;                // snow into water
    beat('music', B.music, () => { snd.opened = true; snd.openOver = 6; }, () => { snd.opened = true; snd.openOver = 0.5; });
    // the roost, in the water only
    if (ROOST_ON) beat('roost', B.roost, () => { roostEnter(); look(F.at(tc.s + 2, tc.d - 8, 0), 7); }, () => { if (T < B.pour + B.pourFor - 2) roostEnter(); });
    if (roostOn && roost) {
      if (T >= B.pour) {
        if (!funnelSet) { funnelSet = true; say(`T ${T.toFixed(1)}: the funnel`); safe('the funnel', () => roost.funnel({ ...MOUTH, into: INTO, order: ORDER })); }
        safe('the pour', () => { roost.poured = clamp01((T - B.pour) / B.pourFor); });
      }
      // a rush of wings heard from below, moving round the boat, swelling to T+30 and gone within 1.5 s of the last bird
      const end = B.pour + B.pourFor;
      if (T > B.roost + 0.6 && T < end + 1.2 && every('rush', 0.42)) {
        const c = safe('roost.centre', () => roost.centre(centre)) || centre, k = smooth(B.roost, B.pour + 3, T) * (1 - 0.6 * smooth(end - 1, end + 1.2, T));
        rushAlt = !rushAlt;
        sound(rushAlt ? 'flutter' : 'rustle', { x: c.x ?? c[0], z: c.z ?? c[2], lowpass: 600, gain: 0.6 + 1.3 * k });
      }
      if (T > end + 2.5) { roostOn = false; safe('roost.hide', () => roost.hide()); }
    }
    const home = () => safe('birds.settle', () => birds && birds.settle({ over: 40 }));
    beat('home', B.home, home, home);
    beat('stretch', B.stretch, () => safe('the egret\'s stretch', () => owl && owl.roost && owl.roost[0] && owl.roost[0].do('stretch')));
    beat('great', B.great, () => safe('greatFall', () => cast.greatFall && cast.greatFall()));
  };

  // ================================================================================================ every frame
  return {
    update() {
      const s = here.s, boat = ctx.boat;
      // ---- the bridge's sift, early for a boat with way on (the lantern must arrive under the veil)
      if (!stage.done('bridge') && ctx.s < BRIDGE && ctx.s >= BRIDGE - 1.15 * Math.max(0, Math.min(4, boat.speed || 0))) stage.fire('bridge');
      // ---- the showstopper's clock
      T = stage.clock('show', (along) => (along - S0) / 1.25);
      if (flies) safe('flies.tick', () => flies.tick(T));
      if (T >= 0 && !settled) showUpdate();
      snd.front = T >= 0 && T < 1e4 && flies ? clamp01(safe('flies.litNear', () => flies.litNear(boat.x, 0, boat.z, 9)) || 0) : 0;
      // ---- the bed that goes by place and by the clock (the ice, the falls and the space are snow.js's)
      const a = ctx.audio;
      if (a && a.layer && !a.silent) {
        const k = snd.hush, snow = smooth(8, 22, s), air = smooth(14, 26, s);
        a.layer('water', 0.45 * k, 0.5);
        a.layer('shimmer', (0.25 * snow + 0.15 * snd.front) * k, 0.5);                                    // snow falling; it rises with the fireflies' front and falls behind it
        a.layer('wind', { level: 0.2 * air * k, tone: 0.2 }, 0.5);                                        // only air, there so that its going is heard
        a.layer('rain', snd.rain, 1.5);                                                                   // the fall: snow into water
        a.layer('drone', { level: hives ? Math.min(0.25, hives.hum || 0) : 0, notes: [57], colour: 0.2 }, 1.5);      // the hives: A3 alone, by distance
        if (snd.opened && !snd.sent && a.music) { snd.sent = true; a.music({ width: 0.8, gain: 0.65, reverb: 0.12 }, snd.openOver); }
      }
    },
  };
}
