// The dyers' reach: the cast, group "Birds" (stage 3): 44 swallows, the reach's only living inhabitants. The toolkit's
// small bird (docs/life/birds.md: makeFlock, species 'swallow', drawn 1.3 times life as that page says of the reach).
// Plan: docs/build/reach/3-cast-plan.md. Log: docs/build/reach/3-cast-birds.md.
//
//   skimmers   16 on four closed eights, 10 m/s, 0.6 to 3 m up: two in the nave (under the hems, inside the trailing
//              bolts, round the rinsing posts), two on the lagoon. Each dips its bill about every 14 s (the toolkit
//              writes the ring and the scratch; never two in one second). 5 m from the rider's eye, which is 3.5 m
//              from the hull and clear of the stern.
//   perchers   22: twelve on the west front's line at 20.5 m, three on each of the side-aisle racks' poles (s 44 left,
//              s 58 right), four on the boom's posts. They leave within 9 m and come back 10 s after the boat is 20 m past.
//   nesters    6: two at the nests on the loft's first beam, four at the nests under the indigo house's eaves, flitting
//              from nest to nest there.
// The 4 moths are the kept lamp's own (stage.js): nothing here.
//
// THE ONE LINE that switches every swallow off: set OFF to true (or &birds=off in the address). Each kind has a line
// of its own in ON below. Since the critique of 8 November only the 16 skimmers are on: the 22 perchers and the 6
// nesters were specks of three to five pixels from anywhere the ride shows them, or were never found.
//
// FOR THE STAGER: shared.cast.birds = {
//   skimmers, perchers, nesters      the toolkit's handles (arrive, gather, settle, flush, tower, resume, nearest, position)
//   first(seconds = 2.4)             the nave party is timed to cross the line 9 m ahead of s 24 (at s 33, 1 m up) in `seconds`
//   river({ stagger = 4 })           the twelve on the west front's line drop off one after another and wheel low over the head of the lagoon
//   riverBack({ over = 12 })         they come back to the line in ones and twos
//   gust({ stagger = 2 })            the skimmers over the lagoon head into the wind and climb 6 to 10 m;  down(): back to the water
//   onFlutter(x, y, z), onDip(x, z)  set these for sound: a bird leaves a perch or passes the rider; a bill touches
// }
// Switches for looking: &birds=off, &birds=river, &birds=gust, &birds=first.
import { makeFlock, figureEight } from '../../engine/life/birds.js';

const OFF = false;
// WHAT IS ON, one line each (the critique of 8 November looked at every kind from where the ride shows it:
// docs/build/reach/5-critique.md). A kind set to false is not built at all.
const ON = {
  skimmers: true,      // seen enlarged in flight, six phases of the beat and three sides: a swallow, dark on the bright water
  front: false,        // the twelve on the west front's line: ticks among the cloth's rings at 28 m, and their river did not show in any picture
  racks: false,        // the seven on the racks' poles: a three-pixel speck from the line at 15 m, and they leave at 9 m, so never nearer
  boom: false,         // the three on the boom's posts: not found at 11 m, in the dusk, beside the kept lamp
  beam: false,         // the two at the loft's beam nests: the cups show, no bird on them in any picture (the nests themselves are the set's and stay)
  house: false,        // the four under the indigo house's eaves: 25 m from the line, never seen
};
const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');

export async function build(ctx, plan, shared) {
  const cast = shared.cast = shared.cast || {};
  const want = (QS.get('birds') || '').split(',');
  if (OFF || want.includes('off')) { cast.birds = null; return {}; }
  const { kit } = ctx;
  const P = (s, d, y = 0) => { const p = kit.at(s, d, y); return [p.x, p.y, p.z]; };
  // the way an eight must be turned for its length to lie along the route at s
  const along = (s) => { const a = kit.at(s - 5, 0, 0), b = kit.at(s + 5, 0, 0); return Math.atan2(-(b.z - a.z), b.x - a.x); };
  const api = { skimmers: null, perchers: null, nesters: null, onFlutter: null, onDip: null };
  const flutter = (i, x, y, z) => { if (api.onFlutter) api.onFlutter(x, y, z); };
  const common = { species: 'swallow', scale: 1.3, wind: [plan.wind.direction[0], plan.wind.direction[1]], keepOut: 5, calmKeepOut: 9 };

  // ================================================================================================ skimmers
  // Closed eights, low: 0.6 m at the crossing, 3 m at the far ends. In the nave they keep inside d 5.5 (the hems there
  // are 6 m up; the trailing bolts begin at d 6.95) and bulge round the rinsing posts; on the lagoon they keep to open water.
  const eight = (s, d, size) => figureEight({ at: P(s, d, 1.6), size, turn: along(s), rise: 2.4 }).map((q) => [q[0], Math.max(0.45, q[1] - 1.0), q[2]]);
  const posts = plan.rinsing.map((R) => { const p = kit.at(R.at[0], R.at[1], 0); return { x: p.x, y: 0.8, z: p.z, r: 2.4 }; });
  if (ON.skimmers) api.skimmers = makeFlock(ctx, {
    ...common, count: 16, seed: 1601, speed: 10, spacing: 7, jitter: 1.0, avoid: posts,
    routes: [eight(36, 0, [26, 11]), eight(70, 0.4, [28, 11]), eight(132, -2, [50, 26]), eight(168, 5, [40, 24])],
    dip: { every: 14, below: 1.3 },
    onTouch: (x, z) => { if (api.onDip) api.onDip(x, z); },
    onPass: (m, x, y, z) => { if (api.onFlutter) api.onFlutter(x, y, z); },
  });

  // ================================================================================================ perchers
  const places = [];
  // the west front's line, 20.5 m up, between its masts (a metre clear of each)
  if (ON.front) places.push({ line: [P(plan.westFront.s, -(plan.westFront.mast.d - 1), plan.westFront.line + 0.1), P(plan.westFront.s, plan.westFront.mast.d - 1, plan.westFront.line + 0.1)], count: 12, group: 'front', face: 0 });      // (they face up the route, into the wind: a rider in the nave sees their pale fronts)
  // the poles of the two side-aisle racks (kit_yards: shared.racks[].pole is the pole's axis)
  // (the rack seen in postcard 3, 11 m from the boat, is the one at s 70 on the right: two sit there as well)
  for (const [s, side, name, n] of ON.racks ? [[44, -1, 'rackL', 3], [58, 1, 'rackR', 2], [70, 1, 'rack3', 2]] : []) {
    const r = (shared.racks || []).find((q) => Math.abs(q.s - s) < 3 && q.side === side && q.pole);
    if (r) places.push({ line: [[r.pole[0][0], r.pole[0][1] + 0.035, r.pole[0][2]], [r.pole[1][0], r.pole[1][1] + 0.035, r.pole[1][2]]], count: n, group: name, face: -side * Math.PI / 2 });      // (across the pole, facing the channel: from the boat a pale front, not a dark peg)
  }
  // the heads of the boom's posts (kit_frames)
  const boom = (ON.boom && shared.frames && shared.frames.boom && shared.frames.boom.posts) || [];
  for (const p of boom.slice(0, 3)) places.push({ x: p.x, y: p.y + 0.01, z: p.z, group: 'boom', face: 0 });
  const seats = places.reduce((n, q) => n + (q.count || 1), 0);
  if (seats) api.perchers = makeFlock(ctx, {
    ...common, count: Math.min(22, seats), seed: 2203, perches: places, flit: false, prePass: false,
    flush: { within: 9, back: 10, past: 20 }, onLeave: flutter,
  });

  // ================================================================================================ nesters
  const nests = [];
  // (on the beam a bird sits on the front of its nest's rim, its back to the rider who comes down the route: the forked tail hangs)
  for (const p of (ON.beam && shared.loft && shared.loft.nests) || []) nests.push({ x: p.x, y: p.y + (QS.has('ny') ? +QS.get('ny') : 0.1), z: p.z + (QS.has('nz') ? +QS.get('nz') : 0.12), group: 'beam', face: Math.PI });
  for (const p of (ON.house && shared.indigoHouse && shared.indigoHouse.nests) || []) nests.push({ x: p.x, y: p.y + 0.05, z: p.z, group: 'house' });
  if (nests.length) api.nesters = makeFlock(ctx, {
    ...common, count: Math.min(6, nests.length), exact: true, seed: 606, perches: nests, flit: { every: 7, range: [2, 9] }, prePass: false, onLeave: flutter,
  });
  if (api.nesters && nests.some((q) => q.group === 'beam')) api.nesters.seat({ who: [0, 1], to: 'beam' });      // two of the six are the loft's

  // ================================================================================================ for the stager
  const _v = new ctx.THREE.Vector3();
  // (each handle does nothing when its birds are off: staging may call them all)
  api.first = (seconds = 2.4) => { if (api.skimmers) api.skimmers.arrive(P(33, 0, 1), seconds, 0); return api; };
  api.river = (o = {}) => { if (api.perchers && ON.front) api.perchers.gather({ who: 'front', at: P(112, 2, 3.2), radius: [9, 16], turn: 8, stagger: o.stagger ?? 4, seconds: 4 }); return api; };
  api.riverBack = (o = {}) => { if (api.perchers && ON.front) api.perchers.settle({ who: 'front', over: o.over ?? 12 }); return api; };
  api.gust = (o = {}) => {
    if (!api.skimmers) return api;
    const who = [];
    for (let i = 0; i < api.skimmers.count; i++) { api.skimmers.position(i, _v); if (_v.z < -95 && _v.z > -200) who.push(i); }
    api.skimmers.tower({ height: [6, 10], stagger: o.stagger ?? 2, who });
    return api;
  };
  api.down = () => { if (api.skimmers) api.skimmers.resume(); return api; };
  cast.birds = api;
  if (want.includes('log') && api.perchers) { const f = api.perchers, n = api.nesters; console.info('INVALID_ (log) perchers ' + f.count + ' places ' + seats + ' of ' + places.length + ' racks ' + (shared.racks || []).length + ' boom ' + boom.length + ' birds ' + JSON.stringify((f.birds || []).slice(0, 14).map((q) => [q.state, +q.x.toFixed(1), +q.y.toFixed(1), +q.z.toFixed(1), q.show])) + ' nesters ' + (n ? n.count + ' ' + JSON.stringify((n.birds || []).map((q) => [q.state, +q.x.toFixed(1), +q.y.toFixed(1), +q.z.toFixed(1), q.show])) : 'none') + ' perched mesh ' + (f.perched ? f.perched.visible + ' ' + f.perched.count : 'none')); }

  let asked = want.length ? want : null;                             // (the switches for looking act on the first frame)
  return {
    update() {
      if (!asked) return;
      if (asked.includes('river')) api.river();
      if (asked.includes('gust')) api.gust();
      if (asked.includes('first')) api.first();
      asked = null;
    },
  };
}
