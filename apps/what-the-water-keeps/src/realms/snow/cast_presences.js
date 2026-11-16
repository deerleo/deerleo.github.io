// The orchard in snow: the cast, group "Presences" (plan: docs/build/snow/3-cast-plan.md; log: docs/build/snow/3-cast-presences.md).
// The presences of the other evening and the one far life of the plain. None is a haunting: each is absorbed in its own
// evening and none looks at the boat.
//
//   THE STAG IN THE WATER (row 14, MEMORY)  the flood orchard's stag (docs/life/beasts.md), drawn only in the water's mirror.
//                         Once: as the boat reaches page s 128 he comes out from under the right-hand ice at s 150 and
//                         wades across the black road, right to left, side-on, and goes under the left-hand ice. There is
//                         no stag above the water: only the rings his chest really makes. His pace is the greater of his
//                         own (0.75 m/s) and the boat's approach (up to 1.8 m/s); the family thins him to nothing inside
//                         9 to 6 m of the hull. THE CUE IS HERE: `stag` (page s 124: he sets out unseen), so that he happens on a ride and
//                         &play=stag shows him; stage.js must not make a second cue of that name (it may call
//                         shared.cast.stag.go() from anywhere, and set shared.cast.stag.onTouch for his sound).
//   THE DEER (row 19, WINTER)  nine red deer in single file on the left plain at d -170, walking EAST (toward smaller s:
//                         the family page's example runs the other way; the plan's page wins), the last a stag, the leader
//                         at s 104 when the boat reaches s 56. They start by distance, without a cue.
//   BATS (row 15, MEMORY) eight of the flood orchard's, only in the mirror: five on beats round the oldest tree, three
//                         skimming the pond's open water, each skimmer dipping every 9 to 15 s (a pin ring that nothing
//                         above the water has made). Drawn while the boat is between s 140 and the thaw.
//   THE ROOST (row 21, MEMORY)  4,000 mirror starlings, hidden: a control for the showstopper only (stage.js).
//
// CRITIQUE, 8 November (docs/build/snow/5-critique.md): the BATS are off (BATS_ON below: shared.cast.bats is then not
// there) and the ROOST is out of the show (stage.js, ROOST_ON): its flock is built only with &roostshow=1 or &roost=...
// (shared.cast.roost is otherwise not there).
//
// shared.cast (for the stager; the log says what each does):
//   stag   { handle, go(), gone(), state, dark, position, chest, onTouch, cue: 'stag' }
//   deer   { herd, object, begin(s), place(metres), halt(seconds), positions, walking }
//   bats   { flock, object, onDip, position(i, out), nearest(x, z, n), dips }
//   roost  { flock, object, show(), hide(), shape(), follow(), pour(), funnel(), centre(out), enter(), paths, ribbon, poured, at }
//
// Developer switches: &pskip=stag,deer,bats,roost leaves kinds out; &roost=run | ring | pour shows the roost at once (for a
//   picture: run = down the second avenue and once round the crown, ring = on the ring, pour = pouring into the vault);
//   &staggain= &stagwave= &stagfrom= &stagcue= &deerscale= &deerair= &batscale= &roostscale= &roostgain= try other numbers.
import * as THREE from 'three';
import { makeStag, makeFarDeer } from '../../engine/life/beasts.js';
import { makeFlock, makeMurmuration } from '../../engine/life/birds.js';

const Q = new URLSearchParams(location.search);
const num = (k, d) => { const v = parseFloat(Q.get(k)); return Number.isFinite(v) ? v : d; };
const SKIP = new Set((Q.get('pskip') || '').split(',').filter(Boolean));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ---- the numbers (the plan's; what is mine is said)
const STAG_ON = true;                                        // THE ONE LINE: false and there is no stag in the water (the rest of the area does not know him)
const STAG = {
  s: 150, from: num('stagfrom', 12.2), to: -15,              // he crosses on the page's s 150 (the cross aisle between the ranks at 144.5 and 153.5), from d +12.2 under the right-hand ice to d -15 under the left
  open: 9,                                                   // the black road is open 9 m either side there (plan.openHalf)
  // THE CUE IS AT s 124, NOT 128: he sets out UNSEEN, under the ice, so that he comes out from under it, already at his
  // pace, as the boat reaches s 128 (22 m ahead: the page's sentence). Set out at 128 from a standing start he was two
  // seconds late for a boat left to the current, was dead ahead behind the prow at 8 m, and thinned away in front of the bow.
  cue: num('stagcue', 124), across: 140,                     // he is to be across by the time the boat reaches s 140 (he can lengthen his stride to 1.8 m/s and no further: for a boat on the current he is across as it reaches s 146, never nearer than 9 m)
  slow: 0.75, quick: 1.8, vanish: 6,                         // m/s; gone within 6 m of the hull (he thins over the 3 m beyond: never solid nearer than 9 m)
  gain: num('staggain', 1.2),                                // NOT the family's 2.1: at 2.1 he is a pale mauve shape on pale blossom (light on light); at 1.2 he is a dark animal on the pink the water shows
  wave: num('stagwave', 0.28), waveRadius: 1.2,              // the family scales each push by his speed (0.46 of this at his slow pace, 1.7 at his quickest): 0.28 gives the page's ring of about 0.35 to 0.45 for a boat on the current; radius 1.2 m (at 0.5 and 0.75 his own rings broke his picture as he passed nearest)
};
const DEER = {
  from: 196, to: 34,                                         // the line they walk, as page s at d -170 (straight on in the realm's own frame east of s 58, where the page's frame bends with the river and the plain does not)
  // NOT THE FAMILY'S DEFAULTS, for one reason: at life size and with half of the realm's air they were pale marks four
  // pixels high behind the pollards (light on light). They are drawn 1.4 times life (the page: "ink dabs 8 to 12 pixels
  // high"), take a tenth of the air (the wash itself, #7A7194, on white snow), and the fog takes them to the knee only.
  scale: num('deerscale', 1.4), air: num('deerair', 0.1), gaps: [4, 9], mist: [0.1, 0.6, 0.85],
  drawn: [40, 170],                                          // the boat's page s between which they are drawn at all
};
// THE ONE LINE (critique, 8 November): the bats in the water. At three times life no bat could be found in any picture
// from the boat (a thin dark crescent among the dark gaps of the reflected crown); they are first on the page's own list
// of cuts. Off, their dips and the rings and ticks of those dips go with them. &bats=1 (developer) shows them as they were.
const BATS_ON = Q.get('bats') === '1';
const BATS = {
  scale: num('batscale', 3), keepOut: 3, calmKeepOut: 10, dip: 12,         // NOT the flood orchard's 1.4: the water's picture is coarser than the air's and brushes a small thing away (at 1.4 no bat could be found in it); a skimmer dips every 9 to 15 s (the family: 0.75 to 1.25 of `dip`)
  drawn: [140, 240],
  ring: [1.2, 4.6], skim: [0.3, 0.9],                        // metres up: under the level base of the blossom; over the water
  // places in free air, as the page's [s, d, radius]: the first eight are the bats' homes (the family sets bat i down in place i)
  zones: [
    [176, -13, 3.4, 'ring'], [184, -18.5, 3.2, 'ring'], [203, -13, 3.4, 'ring'], [206, 9, 3.4, 'ring'], [174, 12, 3.4, 'ring'],
    [172, -8, 4, 'skim'], [181, -15.5, 4, 'skim'], [199, -15, 4, 'skim'],
    [189, 19, 3.4, 'ring'],
  ],
  // each bat's beat: the places it goes between (never across the arch for a tree bat; the skimmers pass under it)
  beats: [[0, 1], [1, 0], [2, 3], [3, 8, 4], [4, 8, 3], [5, 6], [6, 5, 7], [7, 6]],
};
const ROOST = {
  count: num('roostcount', 4000), scale: num('roostscale', 2.6), detail: Q.get('roostdetail') || 'grain',      // (the family: a flock that lives only in the mirror wants fewer and larger birds: scale 2.6)
  // THEIR TONE. As the family paints starlings they are a dark silhouette, and what stands behind them in this water is
  // the remembered evening's sky, which is ink: dark on dark, they could not be found. `gain` multiplies their paint so
  // that they stand between the ink of that sky and the pale of the blossom (a smoke on the one, grains on the other).
  gain: num('roostgain', 4),
  ribbon: { length: 200, width: 12, depth: 6, fold: 3, speed: 20 },        // the page: a ribbon 12 m deep at 20 m/s
  cloud: { length: 120, width: 40, depth: 14 },
  // the ring round the crown (the flood orchard's, which was settled in pictures from under the tree): its middle 12 m west
  // and 6 m south of the dome's top, 36 m in radius, 28 m up and 9 m lower at its lowest, which is toward 330 degrees
  ring: { off: [12, -6], radius: 36, mid: 28, tilt: 9, lowAt: 330 },
  avenue: [[336, 0, 24], [306, 1.5, 21], [278, -1, 19], [256, -3, 19]],    // down the second avenue, in its strip of dusk sky: page [s, d, y]
  mouth: { up: 3.5, radius: 10 }, into: { y: 11, radii: [20, 5, 20] }, pourFor: 7,
};

export async function build(ctx, plan, shared) {
  const { stage } = ctx, F = shared.frame, here = shared.here || { s: 0, d: 0 }, memory = shared.memory || { amount: 1 };
  const cast = shared.cast = shared.cast || {};
  const updates = [];
  const attempt = async (name, fn) => {
    if (SKIP.has(name)) return;
    try { await fn(); } catch (err) { console.error(`INVALID_CAST snow/cast_presences: ${name} could not be built and is left out (${(err && err.message) || err})`); }
  };
  const tree = shared.tree || {}, T = plan.tree;
  const treeAt = tree.at || F.at(T.at[0], T.at[1], 0), treeTop = tree.top || F.at(T.crownMemory.top[0], T.crownMemory.top[1], T.crownMemory.top[2]);

  // ================================================================================================ the stag in the water
  await attempt('stag', async () => {
    if (!STAG_ON) return;
    const a = F.at(STAG.s, STAG.from, 0), b = F.at(STAG.s, STAG.to, 0);
    const st = { state: 'waiting' };                         // waiting | crossing | gone
    const api = cast.stag = { cue: 'stag', onTouch: null, get state() { return st.state; } };
    const stag = await makeStag(ctx, {
      position: [a.x, a.z], toward: [b.x, b.z],              // facing across: he cannot turn on the spot
      only: 'mirror', vanish: STAG.vanish, speed: STAG.slow, quick: STAG.quick, gain: STAG.gain,
      ear: 0, shy: 0, yield: 0, collide: false,              // (in the mirror only the family's rules of the boat are off anyway: he never answers it)
      marks: { wave: STAG.wave, waveRadius: STAG.waveRadius, lane: 0, rings: true },      // real rings at his chest; NO lane in the skin (the ice is winter's, he is not)
      onTouch: (x, z, kind) => {
        if (api.onTouch) { try { api.onTouch(x, z, kind); } catch (err) { console.error(err); } }
        else if (kind === 'wade') ctx.audio.play('drop', { x, z, pitch: 0.7, lowpass: 800, gain: 0.3 });      // the page's sound, until the staging takes it over
      },
    });
    stag.object.name = 'the stag in the water (MEMORY)';
    stag.fade(0, 0);
    const go = () => {
      if (st.state === 'crossing') return api;
      st.state = 'crossing';
      stag.place({ position: { x: a.x, z: a.z }, toward: [b.x, b.z], going: true });      // set down already wading, under the ice, where he cannot be seen
      stag.pace(STAG.slow).go({ to: { x: b.x, z: b.z } });
      stag.fade(1, 1);
      return api;
    };
    const gone = () => { st.state = 'gone'; stag.fade(0, 0); stag.stop(); return api; };
    const dark = new THREE.Vector4(0, -1000, 0, 0);          // his ring of dark for the fireflies: where he is while he crosses, nowhere otherwise
    Object.assign(api, { handle: stag, go, gone, dark, position: stag.position, chest: stag.chest });
    stage.cue('stag', { s: F.pathS(STAG.cue), settle: gone }, go);
    updates.push(() => {
      if (st.state !== 'crossing') { dark.set(0, -1000, 0, 0); return; }
      dark.copy(stag.dark);
      // his progress is the greater of his own pace and the boat's approach: out from under the far ice by the time the
      // boat reaches s 140 (the family lets him lengthen his stride to 1.8 m/s and no further: he is never moved)
      const d = stag.position.x, left = Math.max(0, d + STAG.open), seconds = (STAG.across - here.s) / Math.max(0.3, ctx.boat.speed || 0);
      stag.pace(clamp(left / Math.max(1, seconds), STAG.slow, STAG.quick));
      if (d < -(STAG.open + 2.6) && !st.leaving) { st.leaving = true; stag.fade(0, 2); }      // all of him is under the left-hand ice
      if (d < STAG.to + 1.2 || (st.leaving && stag.state === 'stand')) { st.leaving = false; gone(); }
    });
  });

  // ================================================================================================ the deer
  await attempt('deer', async () => {
    const P = plan.deer, land = shared.land, x = P.d;
    const ground = (gx, gz) => (land && land.snowHeight ? land.snowHeight(gx, gz, Math.max(0, land.waterEdge(-1, gz) - gx), -1) : 0.3);
    let g = 0, n = 0; for (let s = DEER.to; s <= DEER.from; s += 6) { g += ground(x, -s); n++; } g /= n;
    const lead0 = DEER.from - P.leaderAt;                    // metres along their line where the leader is when the boat reaches s 56
    const herd = await makeFarDeer(ctx, {
      count: P.count, from: { x, z: -DEER.from }, to: { x, z: -DEER.to }, lead: lead0, ground,
      speed: P.speed, gaps: DEER.gaps, stag: 'last', color: plan.chip.wash, scale: DEER.scale, air: DEER.air,
      mist: [g + DEER.mist[0], g + DEER.mist[1], DEER.mist[2]],      // the ice fog their legs are lost in, in the realm's heights
    });
    herd.object.name = `the deer on the plain x${herd.count} (winter)`;
    ctx.only(herd.object, 'direct');                         // winter: nothing of them in the water
    herd.walking = false;                                    // they stand, unseen, until the plain opens
    let begun = false;
    /** The plain opens: the leader is at s 104 when the boat is at s 56 (a boat that enters further on finds them as far on as they would have walked). */
    const begin = (s = here.s) => { begun = true; herd.place(lead0 + Math.max(0, s - P.whenBoatAt) * P.speed / 2.0); herd.walking = true; return cast.deer; };
    cast.deer = {
      herd, object: herd.object, positions: herd.positions, begin,
      place: (metres) => { herd.place(metres); return cast.deer; },
      halt: (seconds = 3) => { herd.halt(seconds); return cast.deer; },
      get walking() { return herd.walking; }, set walking(v) { herd.walking = v; },
    };
    updates.push(() => {
      if (!begun && here.s >= P.whenBoatAt) begin(here.s);
      herd.object.visible = here.s > DEER.drawn[0] && here.s < DEER.drawn[1];
    });
  });

  // ================================================================================================ bats
  await attempt('bats', async () => {
    if (!BATS_ON) return;
    const rnd = ctx.rng(4151), calm = !!ctx.reducedMotion;
    const zones = BATS.zones.map(([s, d, r, kind]) => { const p = F.at(s, d, 0); return { x: p.x, z: p.z, r: r * (calm ? 0.62 : 1), y: (kind === 'skim' ? BATS.skim : BATS.ring).slice() }; });
    // what the family steers them round (it sees no scenery): the bole, the props, the arch and its daughter stem, the low
    // part of the lamp limb, the kept lamp
    const avoid = [{ x: treeAt.x, y: 1.6, z: treeAt.z, r: 4.6 }, { x: treeAt.x, y: 6, z: treeAt.z, r: 3.6 }];
    for (const [s, d, h] of T.props) for (let y = 0.5; y < h; y += 1) { const p = F.at(s, d, y); avoid.push({ x: p.x, y, z: p.z, r: 0.6 }); }
    for (const [s, d, y] of T.arch.line) { const p = F.at(s, d, y); avoid.push({ x: p.x, y, z: p.z, r: 1.2 }); }
    { const [s, d] = T.arch.daughter.at; for (let y = 0.5; y < T.arch.daughter.height; y += 1.2) { const p = F.at(s, d, y); avoid.push({ x: p.x, y, z: p.z, r: 0.8 }); } }
    for (const [s, d, y] of T.lampLimb.line) if (y < 4.7) { const p = F.at(s, d, y); avoid.push({ x: p.x, y, z: p.z, r: 1.1 }); }
    { const L = shared.lamp && shared.lamp.position ? shared.lamp.position : F.at(plan.lamp.flame[0], plan.lamp.flame[1], plan.lamp.flame[2]); avoid.push({ x: L.x, y: L.y + 0.2, z: L.z, r: 1.0 }); }
    const api = cast.bats = { onDip: null, dips: 0 };
    const bats = makeFlock(ctx, {
      species: 'bat', count: BATS.beats.length, exact: true, scale: BATS.scale, seed: 5, habit: 'wander', only: 'mirror',
      zones, keepOut: BATS.keepOut, calmKeepOut: BATS.calmKeepOut, avoid, dip: { every: BATS.dip },
      onTouch: (px, pz, kind, i) => { api.dips++; if (api.onDip) { try { api.onDip(px, pz, i); } catch (err) { console.error(err); } } },
    });
    bats.object.name = 'bats in the water x' + bats.count + ' (MEMORY)';
    const walk = bats.birds.map((b, i) => ({ beat: BATS.beats[i] || [i % zones.length], at: 0, t: 3 + rnd() * 6 }));
    bats.birds.forEach((b, i) => { if (BATS.zones[walk[i].beat[0]][3] !== 'skim') b.dipT = Infinity; });      // only the skimmers come down to the water
    Object.assign(api, { flock: bats, object: bats.object, position: (i, out) => bats.position(i, out), nearest: (px, pz, count) => bats.nearest(px, pz, count) });
    updates.push((dt) => {
      const on = here.s > BATS.drawn[0] && here.s < BATS.drawn[1] && memory.amount > 0.5;      // (they go with the memory, through the thaw)
      bats.object.visible = on;
      if (!on) return;
      bats.birds.forEach((b, i) => {
        const w = walk[i]; w.t -= dt;
        if (w.t > 0) return;
        w.t = 5 + rnd() * 6; w.at = (w.at + 1) % w.beat.length;                                // on to the next place of its beat
        const zi = w.beat[w.at], Z = zones[zi];
        b.zone = zi; if (b.yTo < Z.y[0] || b.yTo > Z.y[1]) b.yTo = Z.y[0] + (Z.y[1] - Z.y[0]) * rnd();
      });
    });
  });

  // ================================================================================================ the roost (a control only)
  await attempt('roost', async () => {
    // (Critique, 8 November: the roost is out of the show, stage.js ROOST_ON. Its 4,000 birds are not built unless someone
    // asks to see them: &roostshow=1 plays the beat as it was, &roost=run | ring | pour shows the flock at once.)
    if (Q.get('roostshow') !== '1' && !Q.get('roost')) return;
    const V = (s, d, y) => { const p = F.at(s, d, y); return [p.x, p.y, p.z]; };
    const top = F.locate(treeTop.x, treeTop.z, {});
    const R = ROOST.ring, ring = [];
    // clockwise seen from above, beginning in the west (the mouth of the second avenue), then north, east, south
    for (let k = 0; k < 16; k++) { const th = k / 16 * Math.PI * 2; ring.push(V(top.s + R.off[0] + R.radius * Math.cos(th), top.d + R.off[1] + R.radius * Math.sin(th), R.mid - R.tilt * Math.cos(th - R.lowAt * Math.PI / 180))); }
    const avenue = ROOST.avenue.map(([s, d, y]) => V(s, d, y));
    const run = [...avenue, ...ring, ring[0], ring[1]];                                       // down the avenue and once round the crown
    const paths = { avenue, ring, run };
    const mouth = [treeTop.x, treeTop.y + ROOST.mouth.up, treeTop.z], into = { at: [treeAt.x, ROOST.into.y, treeAt.z], radii: ROOST.into.radii.slice() };
    const flock = makeMurmuration(ctx, {
      species: 'starling', count: ROOST.count, detail: ROOST.detail, only: 'mirror', hidden: true, scale: ROOST.scale, seed: 3,
      path: run, closed: false, at: 0, speed: ROOST.ribbon.speed, ...ROOST.ribbon, keepOut: 12, fog: 0.3,
      color: new THREE.Color(ROOST.gain, ROOST.gain, ROOST.gain * 1.1),      // (see ROOST.gain)
    });
    flock.object.name = 'the roost in the water: ' + flock.count + ' starlings (MEMORY)';
    flock.object.visible = false;
    let shown = false, since = 0;
    const api = cast.roost = {
      flock, object: flock.object, paths, ribbon: { ...ROOST.ribbon }, cloud: { ...ROOST.cloud }, mouth, into,
      /** Let it be seen (it fades in over 1.5 s); hide() fades it out and it is no longer drawn. */
      show() { shown = true; flock.object.visible = true; flock.show(); return api; },
      hide() { shown = false; since = 0; flock.hide(); return api; },
      /** The family's own: shape({ length, width, depth, fold, speed }, seconds); nothing given = the page's ribbon. */
      shape(to = ROOST.ribbon, seconds = 4) { flock.shape(to, seconds); return api; },
      /** The family's own: follow(points, { seconds, closed, at }); nothing given = down the second avenue and once round the crown. */
      follow(points = run, opts = { seconds: 0.01, closed: false, at: 0 }) { flock.follow(points, opts); return api; },
      /** Where the funnel is, without pouring (then set `poured` 0..1 from the show clock); pour() runs by itself over `seconds`. */
      funnel(o = {}) { flock.funnel({ mouth, radius: ROOST.mouth.radius, into, ...o }); return api; },
      pour(o = {}) { flock.pour({ mouth, radius: ROOST.mouth.radius, into, seconds: ROOST.pourFor, ...o }); return api; },
      centre: (out) => flock.centre(out),
      get poured() { return flock.poured; }, set poured(v) { flock.poured = v; },
      get at() { return flock.at; }, set at(v) { flock.at = v; },
      /** In one call: shown, as the page's ribbon, at the far end of the second avenue, coming on. */
      enter() { api.show(); flock.shape(ROOST.ribbon, 0.01); flock.poured = 0; flock.follow(run, { seconds: 0.01, closed: false, at: 0 }); flock.at = 0; return api; },
    };
    updates.push((dt) => { if (!shown && flock.object.visible) { since += dt; if (since > 1.7) flock.object.visible = false; } });
    // &roost=run | ring | pour (developer): the roost at once, for a picture
    const dev = Q.get('roost');
    if (dev) {
      api.enter();
      if (dev === 'ring' || dev === 'pour') { flock.follow(ring, { seconds: 0.01, closed: true, at: num('roostat', 0.55) }); }
      if (dev === 'pour') stage.after(num('roostt', 0.5), () => api.pour());
    }
  });

  return { update(dt) { for (const u of updates) u(dt); } };
}
