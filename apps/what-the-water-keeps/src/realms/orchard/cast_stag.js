// The orchard in flood: the cast, group "Presences" (stage 3): THE STAG (docs/art/orchard.md, section 5; the beasts family,
// docs/life/beasts.md). The log of this module is docs/build/orchard/3-cast-presences.md (its second half, "Second look",
// is what changed after the first holder, and why).
//
// He is the area's reserved inhabitant and the nearest thing on the page to a greetings card, so he is never posed: a wet
// dark-plum shape with a low back, going the same way as the boat, seen from behind or from the flank, whose one answer
// to the boat is an ear, and whose last act is to put his head down and drink. ONE UNBROKEN WALK of about 126 m: he
// stands unseen in the growth at (110, -32.5); when the boat passes s 60 he sets off west along d -32.5, through row -28
// at s 125, down the side aisle at d -23.5, half right through row -19 at s 188, waits among the trunks if he is early,
// comes out into the avenue through row -10 at (197.3, -10) slowly, crosses the bow on the tide's clock, turns left
// through row +10 and drinks beside the plank walk at (206.9, +11.5) until the area is left. He is never moved by hand:
// the family's stride carries him, and this module only tells him where, how fast and when. His route is plan.js's
// STAG_ROUTE (arcs, measured against every mound), given to the family as REALM positions: the family's own [s, d] are
// the engine's path, which from the pond on is not the page's frame.
//
// HIS ORDINARY LIFE runs by itself here (the set-off at s 60, the 27 to 45 m he keeps ahead, the wait among the trunks,
// the crossing on a clock that starts when the boat passes s 160, the drink; and whenever he has to stand, what an
// animal does that has stopped: he listens, drinks, shakes his ears: he is never a statue). THE STAGING TAKES IT OVER with
//     const stag = shared.cast.stag;  stag.staged = true;
//     stage.cue('stag', { s: F.pathS(60), settle: () => stag.settle() }, () => stag.setOff());
//     // the roost's clock T:  stag.roost(T);        the tide's clock T:  stag.tide(T);        (both every frame, in update)
// and everything of the family's handle is there besides (look, pace, go, arrive, keepAhead, ears: docs/life/beasts.md).
//
// shared.cast.stag IS THE FAMILY'S HANDLE, with these added:
//   .dark                 (the family's) Vector4 x, y, z, radius 4: his ring of dark, 8 m across, for the fireflies
//   .position, .chest, .muzzle, .heading, .speed, .state, .along      (the family's) where he is and what he is doing
//   .places               metres along his route of: start, row28, aisle, turnIn, row19, wait, avenueIn, quicken, shown, mid,
//                         past, avenueOut, drink, beyond (the route runs on 6 m beyond where he drinks: plan.js says why)
//   .alongOf(s, d)        metres along his route of the place on it nearest the page's (s, d)
//   .pageOf(along, out)   the page's { s, d } of a place that far along
//   .staged               false: he lives by himself.  true: the staging starts him and gives him the two clocks
//   .setOff()             the moment at s 60: he sets off, to drink where his route ends
//   .settle()             a cue's settle: sets him down where a boat that came by the current would find him now
//   .roost(T, { listen: 11, on: 18, pace: 1.6 })   the roost's clock: he stops and listens as the birds pour, walks on at the hush a little quicker
//   .tide(T, { into: 15.4, show: 23, out: 33.5 })   the tide's clock: `into`, wave 2 passing him as he comes out into the avenue;
//                         `show`, wave 3 reaching the boat (he is on the left of the bow lantern until it has gone by, and
//                         crosses behind the lantern in the dark that follows); `out`, through row +10
//   .onTouch, .onState    null: set them to hear him. onTouch(x, z, kind): 'drink' every 0.7 s while he drinks (the page: `drop`),
//                         'quicken' when the boat comes inside 7 m (`splash`, gain 0.4), 'wade' each push of a hind leg (0.73 s
//                         apart at his ordinary pace), 'drip', 'stop', 'shake'. onState(state, stag): 'stand' | 'start' | 'wade' |
//                         'stop' | 'look' | 'drink' | 'shake'. This module plays no sound.
//   .petals               how many petals lie on his back
//
// Developer switches:
//   &stagat=<metres | place>   he is found that far along his route (or at a named place), already wading
//   &stagdo=stand|look|drink|wait   ... and does that there instead of wading on (wait: stands as he waits among the trunks)
//   &stagband=0                he does not keep ahead of the boat (a still picture's boat does not move: he would stop and listen for it)
//   &stagidle=0                he does nothing of his own while he stands (as he was: to compare)
//   &stagtide=<s>  &stagroost=<s>   the tide's / the roost's clock starts at that many seconds of the realm's time (to try stag.tide, stag.roost)
//   &stagscale=1.1 &stagdepth=0.95  a larger animal; the water he stands in (see the log: what was chosen and why)
//   &stagpace=1.37 &stagfar=60 his own pace from the pond on; how far ahead he may be while the boat is in the first avenue
//   &stagwatch=1 &stagfov=12   the eye follows him; a long lens (study only)
//   &stageye=0,6,0             the eye moved off the rider's seat: metres to starboard, up, aft (study only: to look down on his lane)
//   &stagcam=6,1.1,3           the eye goes with HIM: metres to his right, above the water, behind him, looking at him (study only:
//                              his stride from the flank, his wake from behind and above with &stagcam=0,5,9)
//   &staglantern=0.3           the bow lantern eased to that level (study only: what the crossing is without its halo)
//   &stagfine=1                with &staglog: a row every frame, with the heights of his muzzle, poll, withers and croup (his weight in numbers)
//   &stagfeet=1                writes where every crutch's legs go into the water (the page's frame) to .shots/orchard_stag_feet.json
//   &stagpetals=0              none on his back (or a number up to 12)
//   &stagear=0 &staglane=0.75 &stagwave=0.35   his ear does not answer the boat; the half-width of the lane he writes; his chest wave (to compare)
//   &stagdusk=0                his paint as the family lights it, without shared.dusk (then &stagtint=0: without the hour at all)
//   &stagcoat=<rrggbb>         the colour his paint is multiplied by (746c8e: the critique's plum; ffffff: as the family paints him)
//   &staglog=<name>.json       writes where he and the boat are, twice a second, to .shots/<name>.json
import * as THREE from 'three';
import { makeStag } from '../../engine/life/beasts.js';
import { removeStandIn } from '../../engine/modules.js';
import { STAG_ROUTE, stagRoute } from './plan.js';

const Q = new URLSearchParams(location.search);
const num = (k, d) => (Q.has(k) && isFinite(+Q.get(k)) ? +Q.get(k) : d);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// Where a boat left to the current finds him: the boat's page s -> metres along his route. MEASURED on a ride from the
// door to the wall with this module living by itself (&staglog; the log has the table it was taken from): it is what
// settle() uses for a boat that is set down part-way.
const FOUND = [[60, 0], [67.3, 3.2], [74.5, 7.6], [81.5, 12], [88.3, 16.2], [95, 21.7], [101.5, 28.5], [108.5, 37.2], [115.5, 43.8], [122, 50.2], [128.4, 57.3], [135.2, 64.4], [142.2, 69.3], [149.4, 74.3], [156.7, 79.2], [163.3, 85.9], [170.2, 94.9], [174.5, 100.4], [177, 103], [179.5, 104.9], [182.6, 106.8], [185.7, 108.6], [188.8, 110.4], [191.9, 113.1], [195, 117.4], [197.5, 121], [200.6, 125.2], [201.8, 126.35]];      // (second look: measured again with his paces, the crossing and the end as they now are, orchard_stag2_ride7.json)

export async function build(ctx, plan, shared) {
  const F = shared.frame, here = shared.here;
  shared.cast = shared.cast || {};

  // ---------------------------------------------------------------------------------------------- his route
  // (in the realm's own x, z: plan.js lays it in the page's frame and brings it here)
  const line = stagRoute(1.25), route = line.map(([x, z]) => ({ x, z })), acc = [0];
  for (let i = 1; i < line.length; i++) acc.push(acc[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const LENGTH = acc[acc.length - 1];
  const nearest = (x, z) => {
    let best = 0, bd = Infinity;
    for (let i = 0; i < line.length - 1; i++) {
      const ax = line[i][0], az = line[i][1], dx = line[i + 1][0] - ax, dz = line[i + 1][1] - az, L2 = dx * dx + dz * dz || 1;
      const k = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1), d = (x - ax - dx * k) ** 2 + (z - az - dz * k) ** 2;
      if (d < bd) { bd = d; best = acc[i] + k * Math.sqrt(L2); }
    }
    return best;
  };
  const pointAt = (a, out) => {
    a = clamp(a, 0, LENGTH); let i = 0; while (i < acc.length - 2 && acc[i + 1] < a) i++;
    const k = (a - acc[i]) / ((acc[i + 1] - acc[i]) || 1);
    out.x = line[i][0] + (line[i + 1][0] - line[i][0]) * k; out.z = line[i][1] + (line[i + 1][1] - line[i][1]) * k;
    return out;
  };
  const alongOf = (s, d) => { const p = plan.xz(s, d); return nearest(p[0], p[1]); };
  const places = { start: 0 };
  for (const [name, [s, d]] of Object.entries(STAG_ROUTE.places)) places[name] = +alongOf(s, d).toFixed(2);
  places.wait = +(places.avenueIn - 4).toFixed(2);            // among the left-hand trunks, between row -19 and row -10: where he stands if he is early
  // (places.drink is where he drinks: the route itself runs on 6 m beyond it, out of the way: see plan.js)
  const DRINK_AT = places.drink;

  // ---------------------------------------------------------------------------------------------- developer's switches
  const logName = /^[\w-]+\.json$/.test(Q.get('staglog') || '') ? Q.get('staglog') : null, logging = !!logName, events = [], rows = [];
  let logNext = 0, logBusy = false, logDirty = false;
  const post = () => { if (logBusy) { logDirty = true; return; } logBusy = true; logDirty = false; fetch('/__shot/' + logName, { method: 'POST', body: JSON.stringify({ places, length: +LENGTH.toFixed(2), columns: Q.has('stagfine') ? ['t', 'along', 'speed', 'muzzle y', 'poll y', 'withers y', 'croup y', 'state', 'heading'] : ['t', 'boat page s', 'boat page d', 'boat path s', 'boat speed', 'along', 'stag page s', 'stag page d', 'state', 'speed', 'metres from boat', 'degrees left of bow', 'nearest trunk', 'tide clock'], rows, events }) }).catch(() => {}).finally(() => { logBusy = false; if (logDirty) post(); }); };
  const trunks = [...plan.trees.trees, ...plan.trees.far];
  const tideAt = num('stagtide', -1), roostAt = num('stagroost', -1), watch = Q.has('stagwatch'), fov = num('stagfov', 0);
  const devAt = Q.has('stagat') ? (Q.get('stagat') in places ? places[Q.get('stagat')] : num('stagat', 0)) : null, devDo = Q.get('stagdo');
  // &stageye=x,y,z: the developer's eye moved off the rider's seat (metres to starboard, up, aft): to look down on his lane
  if (Q.has('stageye')) { const q = Q.get('stageye').split(',').map(Number), cam = ctx.engine.camera; if (q.length === 3 && q.every(Number.isFinite)) { cam.position.set(q[0], q[1], q[2]); ctx.onDispose(() => cam.position.set(0, 0, 0)); } }
  // &stagcam=right,up,back: the developer's eye goes with HIM (set every frame in update, below)
  const camRel = Q.has('stagcam') ? Q.get('stagcam').split(',').map(Number) : null, camOn = !!(camRel && camRel.length === 3 && camRel.every(Number.isFinite)), _eye = new THREE.Vector3();
  if (camOn) ctx.onDispose(() => ctx.engine.camera.position.set(0, 0, 0));
  const lanternTo = num('staglantern', -1), fine = Q.has('stagfine'), _b = new THREE.Vector3(), _qc = new THREE.Quaternion();
  // &stagfeet=1 (developer): where every crutch's legs go into the water, in the page's frame, to .shots/orchard_stag_feet.json
  // (what stands between the boat's line and his crossing: scratch sight.mjs reads it)
  if (Q.has('stagfeet') && shared.crutchFeet) fetch('/__shot/orchard_stag_feet.json', { method: 'POST', body: JSON.stringify(shared.crutchFeet.map((f) => { const l = plan.locate(f.x, f.z, {}); return [+l.s.toFixed(2), +l.d.toFixed(2), +(f.r || 0.09).toFixed(2), +f.x.toFixed(2), +f.z.toFixed(2)]; })) }).catch(() => {});


  // ---------------------------------------------------------------------------------------------- the stag
  // SCALE AND DEPTH (the director: "choose the scale and the depth of water that read best and say what you chose"): see
  // the log, "His size in this water".
  const SCALE = num('stagscale', 1.1), DEPTH = num('stagdepth', 1.0);
  let api = null;
  // THE HOUR ON HIM. Everything of this orchard wears shared.dusk (set.js): the hour on the paint, the orchard's own ramp
  // (dark paint keeps its plum; the engine's ramp, which he would otherwise wear, turns the side of him that is turned
  // from the west teal), the afterglow's bank, the rim against the band. The family builds his material itself and has
  // no way to be given an extension (asked of the toolkit: see the log). So the kit it is handed here is the area's kit
  // with one call wrapped: when the family asks for his rigged model, the area's light is laid on after the family's own
  // extension. Nothing of the family is changed. (&stagdusk=0: his paint as the family lights it, with the hour laid on
  // his colour only: what was tried first.)
  let dusked = false;
  const kitOfTheHour = Object.create(ctx.kit), ctxOfTheHour = Object.create(ctx);
  ctxOfTheHour.kit = kitOfTheHour;
  if (Q.get('stagdusk') !== '0' && shared.dusk) kitOfTheHour.animated = (url, opts = {}) => {
    const own = [].concat(opts.extend || []);
    dusked = true;
    return ctx.kit.animated(url, { ...opts, extend: own.includes(shared.dusk) ? own : [...own, shared.dusk] });
  };
  const stag = await makeStag(ctxOfTheHour, {
    position: [route[0].x, route[0].z], heading: Math.atan2(route[1].x - route[0].x, route[1].z - route[0].z),      // facing the way his route sets off: he cannot turn on the spot
    route, scale: SCALE, depth: DEPTH,
    // HIS COAT'S VALUE (stage 5, the critique; the client's rule of 8 November: dark against light, hue alone does not
    // carry). As the family paints him he came out a maroon-brown of the same value as the blue-hour water and mist behind
    // him wherever the bow lantern reached him (measured in orchard_crit_tide_ahead_f06.png: his flank 80, the mist 104, the
    // water 94, of 255), a warm brown deer where the page asks for "a black shape and antlers", "dark plum". The family's
    // own tint (docs/life/beasts.md: it multiplies his paint) takes him to the page's plum and under everything he stands
    // against. &stagcoat=ffffff is as he was.
    tint: /^[0-9a-f]{6}$/i.test(Q.get('stagcoat') || '') ? '#' + Q.get('stagcoat') : '#746C8E',
    // (ear: where the answer BEGINS; the family lays the ear fully back at 0.7 of it. The page's "one ear turns to the boat
    // inside 12 m" is ear 15: three quarters back at 12 m. With the family's 12 a boat left to the current, which comes
    // no nearer than 11 m, never saw the one answer he gives.)
    // (his paces are the page's in metres of water a second: 1.25, from 0.7 to 1.8. The family's are for an animal of its
    // own size and it travels `scale` times as far a stride, so they are given divided by his scale.)
    speed: 1.25 / SCALE, slow: 0.7 / SCALE, quick: 1.8 / SCALE, turnRadius: 5, dark: 4, ear: num('stagear', 15), shy: 7, yield: 9, ahead: Q.get('stagband') === '0' ? null : [27, num('stagfar', 60)],
    // on the water (page section 7): a lane 1.5 m wide behind him that closes like the boat's; a ripple of 0.35 and 1.2 m
    // at his chest with every push of a hind leg, which the field turns into a V; rings of 0.2 from his muzzle as he drinks.
    // (lane: the half-width the family WRITES into the trace. The area's petal sheet parts only where the trace is more
    // than half open, so a lane written 1.5 m wide showed 0.85 m of open water, measured from above; written 2.6 m wide
    // it shows the page's 1.5 m: see the log.)
    marks: { wave: num('stagwave', 1.6), waveRadius: num('stagwaver', 1.2), lane: num('staglane', 1.3), rings: true },
    onTouch: (x, z, kind) => {
      if (kind === 'wade' && shared.made && shared.made.wake) shared.made.wake(x, z, 0.5, 6);      // whatever floats or hangs within reach of his bow wave rocks (heroes_b.js)
      if (logging) events.push({ t: +ctx.time.toFixed(2), touch: kind });
      if (api && api.onTouch) { try { api.onTouch(x, z, kind); } catch (err) { console.error(err); } }
    },
    onState: (state) => {
      if (logging) events.push({ t: +ctx.time.toFixed(2), state });
      if (api && api.onState) { try { api.onState(state, api); } catch (err) { console.error(err); } }
    },
  });
  api = stag;

  // ---------------------------------------------------------------------------------------------- petals on his wet back
  // Single petals stuck to his back as he came under the boughs: twelve at most, none on the antlers, none arranged.
  // (One small mesh to each bone of his back that carries any: the family lays each petal on his skin and says which bone.)
  let petals = 0;
  if (Q.get('stagpetals') !== '0') {
    const rnd = ctx.rng(4217), want = Math.round(clamp(num('stagpetals', 7), 0, 12)), L = plan.water.petals.length, byBone = new Map();      // (seven: eleven lay along his skyline like a dotted line)
    // one cupped petal lying flat, its own +Y up: 4 triangles, the area's own petal (a little longer than broad, a crease down it)
    const P0 = [[0, 0, -0.5], [0.34, 0.07, -0.1], [0, 0, 0.5], [0, 0, -0.5], [0, 0, 0.5], [-0.34, 0.07, -0.1], [0.34, 0.07, -0.1], [0.3, 0.1, 0.22], [0, 0, 0.5], [-0.34, 0.07, -0.1], [0, 0, 0.5], [-0.3, 0.1, 0.22]];
    const holder = new THREE.Object3D(), m4 = new THREE.Matrix4(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < want; i++) {
      // (more of them toward the croup, which rides lowest and wettest; a little off the spine; each turned its own way)
      const u = Math.pow(rnd(), 1.4) * 0.92 + 0.03, w = (rnd() * 2 - 1) * 0.85, size = L * (0.8 + rnd() * 0.45);
      holder.position.set(0, 0, 0); holder.quaternion.identity(); holder.rotation.set((rnd() - 0.5) * 0.3, rnd() * 6.283, (rnd() - 0.5) * 0.3);
      stag.attach(holder, u, w);
      const bone = holder.parent; bone.remove(holder);
      m4.compose(holder.position, holder.quaternion, one);
      const list = byBone.get(bone) || []; byBone.set(bone, list);
      for (const p of P0) { v.set(p[0] * size, p[1] * size, p[2] * size).applyMatrix4(m4); list.push(v.x, v.y, v.z); }
      petals++;
    }
    const pale = shared.paint({ color: '#e6dbe2', side: THREE.DoubleSide, brush: 0.2, shade: 0.5 });
    for (const [bone, list] of byBone) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(list, 3)); g.computeVertexNormals();
      const mesh = new THREE.Mesh(g, pale); mesh.name = 'petals on the stag\'s back'; mesh.frustumCulled = false;
      bone.add(mesh); ctx.only(mesh, 'direct');               // (a petal is a fleck: the water's picture does without them)
    }
  }

  // ---------------------------------------------------------------------------------------------- the hour on his coat, without shared.dusk
  // (Only if the wrapped call above was not taken, or with &stagdusk=0: then he is brought into the dusk with what the
  // family does give, the colour his paint is multiplied by: as dark paint of this orchard he keeps `dark` of his own
  // colour: plan.light, 0.74 in the afterglow, 0.62 at blue hour.)
  const coat = [];
  stag.object.traverse((o) => { const m = o.isMesh && o.material; if (m && m.uniforms && m.uniforms.uColor && !coat.includes(m)) coat.push(m); });
  const TINT = !dusked && Q.get('stagtint') !== '0', hueA = new THREE.Color(1, 1, 1), hueB = new THREE.Color(1, 1, 1), hue = new THREE.Color();

  // what he does of his own accord while he stands (see update: "he is never a statue")
  const idle = { t: 0, next: 4 + 3 * 0.5, mine: null, last: null, wasAct: false, still: 0, acts: 0, rnd: ctx.rng(7331), on: Q.get('stagidle') !== '0' };
  // ---------------------------------------------------------------------------------------------- his life
  const life = {
    first: true, started: false, waiting: false, released: false,
    T: -1, ahead: 0, step: -1, t160: null, given: false,       // the tide's clock as last heard; which crossing he is making for; when the boat passed s 160; whether the staging's missing clock has been reported
    roostListen: false, roostOn: false,
    knots: [[13.9, places.avenueIn], [22.5, places.quicken], [25.0, places.shown], [28.4, places.past], [33.5, places.avenueOut]],      // the tide: [its clock, metres along his route] (the times are set in tide())
    was: 'stand',
  };
  const ps160 = F.pathS(160), _l = {}, _p = {};
  const DRINK = { then: 'drink', seconds: 6, repeat: true };     // (with no `seconds` the family's go({ then: 'drink' }) is one bout that never ends: see the log)
  const wading = () => stag.state === 'wade' || stag.state === 'start';
  /** He walks on, to drink where his route ends (and nothing of his own is begun for the next few seconds: see `idle`). */
  const walkOn = () => { idle.t = -4; return stag.go(DRINK); };

  // ---- NOBODY COMES WITHIN SEVEN METRES OF HIM WHILE HE DRINKS (second look). Where he drinks is a pocket: the plank walk
  // to the north, the wall 9 m to the west, the trunks of row +10 to the south, and he cannot turn on the spot. A boat that
  // came inside his 7 m there sent him on by the family's rule ("he leaves at an angle away from the hull"), which knows no
  // scenery: photographed, he waded through the plank walk's end and the orchard wall (orchard_stag2_shy1.json). So the
  // hull is held off: a solid ring of 7 m about him, there from his last four metres to the water on (the boat's own line is 11.5 m
  // away and never feels it; the family's waiting rule has already kept him from coming to the water while a boat lies
  // within 9 m of it). A boat found inside when the ring comes up is eased out at walking pace, never thrown.
  const drinkPlace = pointAt(DRINK_AT, {}), fence = ctx.addCollider({ x: drinkPlace.x, z: drinkPlace.z, r: -9 });      // (r below 0: not there)
  ctx.onDispose(() => { fence.r = -9; });

  Object.assign(api, {
    places, staged: false, onTouch: null, onState: null, petals, routeLine: line, length: LENGTH,
    alongOf,
    pageOf(a, out = {}) { pointAt(a, _p); return plan.locate(_p.x, _p.z, out); },
    /** The moment at s 60: he sets off along his route, to drink where it ends. */
    setOff() { if (!life.started) { life.started = true; walkOn(); } return api; },
    /** A cue's settle (a boat set down part-way; a rider coming back in): he is where a boat that came by the current would find him. */
    settle() {
      const bs = plan.locate(ctx.boat.x, ctx.boat.z, _l).s;
      let a = 0;
      if (bs >= FOUND[FOUND.length - 1][0]) a = DRINK_AT;
      else for (let i = 0; i < FOUND.length - 1; i++) if (bs >= FOUND[i][0] && bs < FOUND[i + 1][0]) { a = FOUND[i][1] + (FOUND[i + 1][1] - FOUND[i][1]) * (bs - FOUND[i][0]) / (FOUND[i + 1][0] - FOUND[i][0]); break; }
      if (a < 0.5) return api;                                   // the boat has not reached s 60: he stands at his place
      life.started = true; life.waiting = false;
      if (a > DRINK_AT - 1.5) { stag.place({ along: DRINK_AT }); stag.drink(Infinity); life.released = true; life.drinking = true; return api; }
      stag.place({ along: a, going: true }); walkOn();
      life.released = a > places.wait - 1.5;
      return api;
    },
    /**
     * The roost's clock (seconds since its cue; -1 before): as the birds pour (`listen`, the page's 11 s) he stops where a
     * hind hoof next comes down and listens, his ears going back one after the other; at the hush (`on`, 18 s) he walks on,
     * a little quicker (`pace`, 1.6 m/s). The two are asked early (1.8 s and 3.8 s): he stands only where a hind hoof next comes
     * down, and a look ends with his head coming down first. Measured: asked for 11 and 18, he stands at 10.5 to 11.5 s and
     * is wading again at 17 to 19 s.
     */
    roost(T, o = {}) {
      const listen = o.listen ?? 11, on = o.on ?? 18;
      if (!(T >= 0)) return api;
      if (!life.roostListen && T >= listen - 1.8) { life.roostListen = true; if (T < on - 4.5 && wading()) stag.look(Math.max(3, on - listen)); }
      if (!life.roostOn && T >= on - 3.8) { life.roostOn = true; if (T < on + 6) { stag.pace((o.pace ?? 1.6) / SCALE); walkOn(); } }      // (second look: 1.6, not the page's 1.5: at 1.5 the seven seconds he stood cost him 17 s at his longest stride before the avenue; at 1.6 he is there on his ordinary wade)
      return api;
    },
    /**
     * The tide's clock (seconds since its cue; -1 before). He steps into the avenue through row -10 at `into` (the page's
     * 15.4 s, as wave 2 passes him); wades slowly out into it and is a third of the way over, 12 to 14 m ahead and a
     * little LEFT of the bow, while wave 3 lights the colonnade (`show`: when wave 3 reaches the boat, the page's 23 s);
     * lengthens his stride and crosses the bow in the dark that follows; is clear on the right for wave 4; and leaves
     * through row +10 at `out` (33.5 s). Then he goes on to the water by the plank walk and drinks. The rules of the boat
     * come first (a boat within 9 m of his way: he waits among the trunks and crosses behind it). From the first call he
     * no longer keeps ahead of the boat: he keeps the clock.
     */
    tide(T, o = {}) {
      if (!(T >= 0)) return api;
      // (THE CROSSING AND THE BOW LANTERN, second look. The rider's own lantern hangs to starboard of the bow, and its halo is
      // laid over whatever is behind it: measured in a rider's picture it warms everything from 1 degree left of the bow to 14
      // right, just under the horizon (strongly from 1 to 11 right), and a dark stag behind it is an orange ghost. In the
      // bend the avenue's middle line 12 to 15 m ahead lies 5 to 7 degrees RIGHT of the bow: the page's "in mid-avenue 12 m
      // ahead" is exactly behind the lantern. The first holder ran him across the middle before wave 3; measured, wave 3
      // (lit from about 22 to 25 s where he is) still found him inside the halo, and from 26 to 31 s the crutch under the
      // low bough of (201.5, +10) stood in front of him while he dawdled behind it. So the other way about: he comes out
      // from between the trunks SLOWLY, as an animal comes out of cover (0.8 m/s: for nine seconds he is on the left of the
      // bow, from the flank, 22 m closing to 12, clear of everything, in the light of waves 2 and 3), is at `shown` (the
      // last place clear of the halo on its left) when wave 3 has gone by, crosses the bow at his long stride in the dark
      // (about three seconds behind the halo), is clear of it on the right at `past` for wave 4 and goes on to the far trunks at
      // the same stride (he no longer dawdles behind the crutch). scratch: design.mjs, sight.mjs. A staging that moves wave 3
      // gives `show`.)
      const into = o.into ?? 15.4, show = o.show ?? 23, out = o.out ?? 33.5, K = life.knots;
      // (He is through row -10 a second and a half BEFORE `into`: the crutch under the low bough of (192.5, -10) stands between
      // the boat and that gap, and for a boat left to the current it passes across him from his head to his tail between
      // 14 and 17 s. Through the row at 13.9 s, it is on his head before wave 2 comes and on his back as it passes him.)
      // (The shear legs under the low bough of (201.5, +10) stand 5 to 7 m ahead of the boat, to its right, when he comes out
      // of the halo, and their near leg sweeps the same way as he does: it is on his head and neck from about 30 s to the
      // edge of the frame. Tried: crossing the bow 0.8 s later, to let the legs go by first. He cannot: at his slowest wade
      // he is at `shown` by 25.3 s whatever he is asked, and a stag who stops in the open to wait is a stag posed.)
      K[0][0] = into - 1.5; K[1][0] = show - 0.5; K[2][0] = show + 2.0; K[3][0] = show + 5.4; K[4][0] = Math.max(out, show + 8.4);
      if (life.T < 0) stag.keepAhead(null);
      // the knot he is making for: the first that is still ahead of him both in time and in place
      let step = 0; while (step < K.length && (T >= K[step][0] || stag.along >= K[step][1] - 0.5)) step++;
      const ahead = T - ctx.time;      // (how far the show's clock stands from the realm's own; it grows when the boat's progress pushes the clock on)
      life.T = T; life.goAt = into - 8.3; life.into = into;
      // (a place to be at a time is given once for each knot, and again whenever the clock has been pushed on a quarter of a second)
      if (step !== life.step || Math.abs(ahead - life.ahead) > 0.25) { life.step = step; life.ahead = ahead; if (step < K.length) stag.arrive(K[step][1], Math.max(0, K[step][0] - T)); else stag.arrive(null); }
      return api;
    },
  });
  shared.cast.stag = api;

  const standInAt = new THREE.Vector3();
  return {
    update(dt) {
      // ---- the stand-in (cast.js: 'standin:stag') goes, now that he lives. It wears the area's shared wood: it is parted
      // from that material first, or removeStandIn would dispose it under every trunk. cast.js still writes its table's
      // place into shared.stagStandIn.at every frame: that is given a vector of its own, set right again below.
      if (shared.stagStandIn && shared.stagStandIn.mesh !== stag.object) {
        ctx.group.traverse((o) => { if (o.name === 'standin:stag') o.material = null; });
        removeStandIn(ctx, /^stag( |$)/);
        shared.stagStandIn = { mesh: stag.object, at: standInAt };
      }
      const bs = here.s;

      // ---- the first frame: a boat set down part-way finds him where he would be
      if (life.first) {
        life.first = false;
        if (devAt !== null) {
          life.started = true; life.released = true;
          if (devDo) { stag.place({ along: devAt, going: false }); if (devDo === 'look') stag.look(60, { resume: false }); else if (devDo === 'drink') { stag.drink(Infinity); life.drinking = true; } else if (devDo === 'wait') { life.released = false; life.waiting = true; } }
          else if (devAt > DRINK_AT - 1.5) { stag.place({ along: DRINK_AT }); stag.drink(Infinity); life.drinking = true; }
          else { stag.place({ along: devAt, going: true }); stag.go(DRINK); }
        } else if (!api.staged && bs > STAG_ROUTE.setOff + 3) api.settle();
        if (bs > 160 && life.t160 === null) life.t160 = ctx.time - Math.max(0, ctx.s - ps160) / 1.2;
        life.entered = bs;
      } else if (life.entered > STAG_ROUTE.setOff + 3 && !life.started && devAt === null && (life.frames = (life.frames || 0) + 1) === 3) api.settle();      // (taken over by a staging whose cue has no settle: he is set down all the same)

      // ---- his ordinary life: he sets off when the boat passes s 60 (the staging's cue does it when it has taken him over;
      // should that cue never come, he goes when the boat is 15 m past the line)
      if (!life.started && devAt === null && bs >= STAG_ROUTE.setOff + (api.staged ? 15 : 0)) api.setOff();

      // ---- how far ahead he keeps. The page: 45 to 60 m ahead while the boat is in the first avenue, 30 to 45 m from the pond
      // on. (With 27 to 45 from the start, as it was, the family held him to his slowest wade for his first ten seconds, "too
      // far ahead" at 48 m, and he then had to press at 1.6 to 1.8 m/s for 25 s to be at the avenue on the tide's second.)
      if (!life.band45 && bs >= 88 && life.T < 0 && Q.get('stagband') !== '0') { life.band45 = true; stag.keepAhead([27, 45]); stag.pace(num('stagpace', 1.37) / SCALE); }

      // ---- the two clocks. The tide's: his own, from the moment the boat passes s 160 (never less than the boat's progress
      // at the tide's 1.2 m/s: a rider who presses on gets the crossing sooner). The staging gives its own with
      // stag.tide(T): then this one only stands behind it, in case that clock never comes.
      if (life.t160 === null && bs >= 160) life.t160 = ctx.time;
      const own = life.t160 === null ? -1 : Math.max(ctx.time - life.t160, (ctx.s - ps160) / 1.2);
      if (tideAt >= 0) { if (ctx.time >= tideAt) api.tide(ctx.time - tideAt); }
      else if (!api.staged) { if (own >= 0) api.tide(own); }
      else if (own > 12 && life.T < 0) { if (!life.given) { life.given = true; console.warn('orchard stag: the staging took him over but the tide\'s clock never came: he crosses on his own'); } api.staged = false; }
      if (roostAt >= 0 && ctx.time >= roostAt) api.roost(ctx.time - roostAt);

      // ---- the wait among the trunks. He does not step into the avenue before the tide lets him: if he comes to the last
      // trunks early he stops there and listens (25 m ahead of a boat left to the current, as wave 1 finds him), and goes
      // on in time to be at row -10 on the second. If he comes late, or the boat has pressed him, he walks straight through.
      if (!life.released && life.started) {
        const T = life.T, into = life.into ?? 15.4, goAt = life.goAt ?? into - 8.3;
        if (life.waiting) {
          // (second look: `stood`. He is still wading for up to half a round after he is asked to stop. As it was written, that
          // counted at once as "he left by himself": the wait was over before it began, and nothing ever sent him on. A rider
          // slower than the current found him standing among the last trunks for good: he never crossed and never drank.)
          if (!wading()) life.stood = true;
          if (life.stood && wading() && devDo !== 'wait') { life.waiting = false; life.released = true; }      // (the boat came too near and he left by himself)
          else if (T >= goAt) { life.waiting = false; life.released = true; walkOn(); }
        } else if (stag.along >= places.wait - 1.5 && wading()) {
          if (T < into - 9.7 && Math.hypot(ctx.boat.x - stag.position.x, ctx.boat.z - stag.position.z) > 13) { life.waiting = true; life.stood = false; stag.look(6, { resume: false }); }
          else life.released = true;
        }
      }

      // ---- he comes to the water. His route runs on beyond the place where he drinks (plan.js: why), so it is here that he
      // is asked to stop and put his head down: a little short of the place, for he halts where a hind hoof is next set down.
      if (life.started && !life.drinking && wading() && stag.routeLength > LENGTH - 1 && stag.along >= DRINK_AT - 1.1) { life.drinking = true; stag.drink(Infinity); }

      // ---- the ring that holds the hull off him at the water (see where it is made)
      if (!life.atWater && life.started && stag.routeLength > LENGTH - 1 && stag.along >= DRINK_AT - 4) life.atWater = true;
      if (life.atWater) {                          // (from his last four metres on it goes with him, wherever he then stands)
        fence.x = stag.position.x; fence.z = stag.position.z;
        const room = Math.hypot(ctx.boat.x - fence.x, ctx.boat.z - fence.z) - 1.15;
        fence.r = fence.r < 0 ? clamp(room, 0.1, 7) : Math.min(7, fence.r + dt * 1.2);
      }

      // ---- HE IS NEVER A STATUE (second look). The family stops him when the boat stops, when the boat lies across his
      // way, when he is too far ahead, and this module stops him among the last trunks until the tide lets him cross: and
      // there he stood, for as long as it lasted, a level-antlered cut-out against the lit bank (33 s were photographed).
      // An animal that has stopped goes on living: after a few seconds of standing he lowers his head and drinks, or lifts it
      // and listens again, or shakes the wet out of his ears, each in its own time (never when the boat is within 10 m: then
      // the family's own rules speak). A drink only while the boat lies still or the tide keeps him: when the boat moves on
      // his head comes up and he goes. Where his route ends he drinks in bouts as the family has him: nothing is added there.
      {
        const st = stag.state, b = ctx.boat, far = Math.hypot(b.x - stag.position.x, b.z - stag.position.z);
        const nearEnd = life.drinking || (life.started && stag.routeLength - stag.along < 2.5);      // (where he drinks, and where a route of his ends: there the family's own bouts are his life)
        idle.still = b.speed < 0.35 ? idle.still + dt : 0;
        if (st === 'stand') idle.t += dt; else { idle.t = 0; if (st === 'wade') { idle.acts = 0; idle.last = null; } }
        // (he sets off, by himself or sent: he is given his way and what he does where it ends, which a drink of his own takes from him)
        if (st === 'start' && life.was !== 'start' && life.started && stag.routeLength - stag.along > 2.5 && devDo == null) stag.go(DRINK);
        // (an act of his own is over)
        if (idle.mine && st === 'stand' && idle.wasAct) { idle.mine = null; if (life.started && !life.waiting && !nearEnd && devDo == null) stag.go(DRINK); }
        idle.wasAct = st === 'drink' || st === 'look' || st === 'shake';
        // (the boat moves on while he drinks: his head comes up, and he goes)
        if (idle.mine === 'drink' && st === 'drink' && life.started && !life.waiting && b.speed > 0.6) { idle.mine = 'going'; walkOn(); }
        const hush = life.waiting && life.T >= 0 && (life.goAt ?? 7.1) - life.T < 10;      // (the tide is about to send him: nothing is begun that would make him late)
        if (st === 'stand' && !nearEnd && !hush && idle.t > idle.next && far > 10 && idle.on && (devDo == null || devDo === 'wait' || devDo === 'stand')) {
          const r = idle.rnd(), canDrink = (idle.still > 3 || (life.waiting && bs < 152) || !life.started) && idle.last !== 'drink';      // (waiting for the tide he drinks only while the boat is still well short of s 160: a drink takes up to twelve seconds)
          const what = canDrink && r < (idle.acts ? 0.6 : 0.8) ? 'drink' : r < 0.9 || idle.last === 'shake' ? 'look' : 'shake';      // (the first thing he does when he has stood a while is, most often, to drink)
          if (what === 'drink') stag.drink(4.5 + idle.rnd() * 3.5, { repeat: false }); else if (what === 'look') stag.look(2.5 + idle.rnd() * 2.5); else stag.shake();
          idle.mine = what; idle.last = what; idle.t = 0; idle.next = 3.5 + idle.rnd() * 4.5; idle.acts++;
          if (logging) events.push({ t: +ctx.time.toFixed(2), idle: what });
        }
        life.was = st;
      }

      // ---- the hour on his coat
      if (TINT && coat.length) {
        const k = shared.hour || 0, L = plan.light, g = L.afterglow.dark + (L.blue.dark - L.afterglow.dark) * k;
        hue.copy(hueA).lerp(hueB, k).multiplyScalar(g);
        for (const m of coat) m.uniforms.uColor.value.copy(hue);
      }
      standInAt.copy(stag.position);

      // ---- developer: the eye on him, a long lens, the log
      if (fov) { const c = ctx.engine.camera; if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); } }
      if (lanternTo >= 0 && !life.lanternSet && ctx.time > 0.2) { life.lanternSet = true; ctx.lantern(lanternTo, 0); }
      if (camOn) {
        // the eye goes with him: so many metres to his right, above the water and behind him, looking at the middle of what shows of him
        const eng = ctx.engine, cam = eng.camera, h = stag.heading, fx = Math.sin(h), fz = Math.cos(h);
        _eye.set(stag.dark.x - fz * camRel[0] - fx * camRel[2], camRel[1], stag.dark.z + fx * camRel[0] - fz * camRel[2]);
        _b.set(stag.dark.x - _eye.x, 0.55 - _eye.y, stag.dark.z - _eye.z);
        cam.parent.updateWorldMatrix(true, false);
        cam.parent.worldToLocal(cam.position.copy(_eye));
        _b.applyQuaternion(cam.parent.getWorldQuaternion(_qc).invert());
        const yaw = Math.atan2(-_b.x, -_b.z), pitch = Math.atan2(_b.y, Math.hypot(_b.x, _b.z));
        eng.input.lookYaw = yaw; eng.input.lookPitch = pitch; cam.rotation.y = yaw; cam.rotation.x = pitch;
      } else if (watch) {
        const eng = ctx.engine, eye = eng.shared.uCameraPos.value, dx = stag.dark.x - eye.x, dy = 0.7 - eye.y, dz = stag.dark.z - eye.z;
        const yaw = Math.atan2(-dx, -dz) - eng.boat.heading, pitch = Math.atan2(dy, Math.hypot(dx, dz));
        eng.input.lookYaw = yaw; eng.input.lookPitch = pitch; eng.camera.rotation.y = yaw; eng.camera.rotation.x = pitch;
      }
      if (logging && fine) {
        // every frame: his weight in numbers (how his speed surges, how far his head and his back rise and fall)
        const B = stag.bones, y = (b) => +b.getWorldPosition(_b).y.toFixed(3);
        rows.push([+ctx.time.toFixed(3), +stag.along.toFixed(3), +stag.speed.toFixed(3), +stag.muzzle.y.toFixed(3), y(B.head), y(B.chest), y(B.hips), stag.state, +(stag.heading * 180 / Math.PI).toFixed(1)]);
        if (ctx.time >= logNext) { logNext = ctx.time + 1; post(); }
      } else if (logging && ctx.time >= logNext) {
        logNext = ctx.time + 0.5;
        const b = ctx.boat, p = plan.locate(stag.position.x, stag.position.z, _l), dx = stag.position.x - b.x, dz = stag.position.z - b.z;
        let near = 1e9; for (const t of trunks) near = Math.min(near, Math.hypot(t.x - stag.position.x, t.z - stag.position.z));
        let bear = Math.atan2(-dx, -dz) - b.heading; bear -= Math.PI * 2 * Math.round(bear / (Math.PI * 2));
        rows.push([+ctx.time.toFixed(1), +bs.toFixed(1), +here.d.toFixed(1), +ctx.s.toFixed(1), +b.speed.toFixed(2), +stag.along.toFixed(1), +p.s.toFixed(1), +p.d.toFixed(1), stag.state + (life.waiting ? ' (waiting)' : ''), +stag.speed.toFixed(2), +Math.hypot(dx, dz).toFixed(1), +(bear * 180 / Math.PI).toFixed(0), +near.toFixed(2), +life.T.toFixed(1)]);
        post();
      }
    },
  };
}
