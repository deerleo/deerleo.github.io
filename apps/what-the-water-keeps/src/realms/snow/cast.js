// The orchard in snow: everything alive and moving (stage 3). THIS MODULE IS GROUP "FALLS" (docs/build/snow/3-cast-falls.md):
// rows 1, 2, 3 and 13 of the list below, and the controls of 22 and 23. The other groups are cast_ice.js, cast_birds.js,
// cast_owl.js, cast_presences.js and cast_lights.js. Stage 1 (layout and light) left
// this list of what the page puts here (docs/art/snow.md, section 5: twenty-four kinds; S small, M middle, V vast;
// MEM = memory: seen only in the water, ctx.only(obj, 'mirror')), with where each thing already stands as a stand-in.
// The handles are in `shared`: frame (place by shared.frame.at(s, d, y), never kit.at), here, memory (amount: fade
// every memory thing by it through the thaw; lamp), tree, lamp, outlier, orchard.ends, snowfall, land, mat, seen, inWater.
// A memory thing that shows its own colour (a glow, a point) is authored with shared.inWater(hex), and lit things
// need nothing: while the mirror is drawn the whole realm is lit by the remembered evening (light.js).
//
// Three things stage 1 found that the cast must keep (1-layout.md): (a) a far flake as the toolkit draws it cannot be
// seen on this pale picture: set.js draws them 8.5 px and darker than the sky (keep `minPixels`, `farAlpha`, `sky`);
// (b) the petals' twin draws all 20,000 cards in the mirror (120,000 triangles) for the 4,000 that are seen, and a petal
// close to the surface is a pale shard a hand across beside the hull: look at it from the boat; (c) frost flowers fold
// away where the skin is open by reading the water's trace (kit.js, `onIce`): the cast's collapse should do the same.
//
//  1 Snowfall and the gold globe (S to V)  20,000 flakes in a box 60 x 28 x 60 m that follows the eye; 0.8 m/s; within
//                                         3.5 m of the bow lantern a flake turns gold (#FFD79A at 1.6). HERE (taken over
//                                         from set.js: shared.snowfall, the life toolkit's makeFall, its density by light state).
//  2 Petals rising (S, MEM)               the same field in the water, 4,000 within 30 m, each a flake's reflection, from
//                                         s 76 to 246; a pin ring where they meet. With 1 (its `twin`). HERE.
//  3 Powder sifts (S)                     one within 40 m every 2 to 4 s from a laden bough or birch crown; certain from the
//                                         bridge as the bow passes under; 12 pooled bursts. HERE.
//  4 Skin ice and frost ferns (S)         the water's skin (set.js keeps the road open); lanes close in 60 s; frost flowers
//                                         collapse on a breaking plate (kit.js has the 4,000 tufts, still)
//  5 Fireflies (S, V as fronts; MEM)      the orchard's mirror set (2,500); sixty scouts from s 100; fronts in the showstopper
//  6 Moths (S)                            4 at the lit lamp (MEM; the engine's); 2 pale winter moths to the bow lantern
//                                         when the boat has been still for 6 s
//  7 Apples and crumbs (S)                the apples hang (kit.js, heroes.js, heroes_b.js); a crumb every 2 s under feeding
//                                         birds; the one that falls from the outlier's bough bobs and drifts
//  8 The hives (S)                        six threads of vapour at s 230, d +13.5; a hum within 8 m; in the water the
//                                         orchard's bees coming home (MEM). The hives stand in heroes_b.js.
//  9 Waxwings (M)                         74: 5 on the outlier's bough, 60 in the oldest tree at 10 to 28 m, 9 on the low
//                                         bough at (216.5, +10). Perches: shared.tree.apples, shared.outlier.apples.
// 10 The owl and its egret (M; egret MEM) the owl on the broken birch at (40, -10, 5.5) (kit.js); it flies when the boat
//                                         reaches s 32, across to (43, -3, 2.8), under the bridge at 2.4 m, up into the
//                                         birches at (60, +16, 9): 34 m at 5.5 m/s. plan.owl.
// 11 Pancake pans (M)                     60 in the road and the pond, 12 in the thaw: STAND STILL in kit.js; drift,
//                                         turn, nudge, tilt on the wake here (the life toolkit's floaters)
// 12 River steam (M)                      48 wisps 1.5 to 3 m tall, thickest under the bridge, at the outlier, in the thaw
// 13 Snow slides (M)                      the outlier's bough; four low boughs (plan.slides). HERE (the wood, the slab and
//                                         the spring are the set's: shared.outlier, shared.orchard.slide; the letting go,
//                                         the powder and the rings are here).
// 14 The stag in the water (M, MEM)       once, s 128 to 150, right to left; real rings at his chest; never nearer than 9 m
// 15 Bats (M, MEM)                        8 of the orchard's: 5 round the oldest tree, 3 skimming the pond
// 16 Rings from the other evening (S)     one every 9 to 14 s on open water 8 to 20 m ahead
// 17 The roosting egrets (M, MEM)         two, in the reflected crown: shared.tree.roosts
// 18 Snow veils (V)                       six curtains: STAND STILL in set.js (shared.veils); drift west at 0.5 m/s here
// 19 The deer (V)                         nine in single file at d -170 (plan.deer); not stood in
// 20 The ice song (V)                     three hairlines across the snow; the thaw's plates
// 21 The roost (V, MEM)                   the orchard's 4,000 mirror starlings, showstopper only
// 22 The great petal fall (V, MEM)        the orchard's 9,000 petals under the crown, at the end of the showstopper.
//                                         HERE as a control only: shared.cast.greatFall().
// 23 The fall (V)                         the oldest tree's 44 loads (shared.tree.loads, shared.tree.snow), 30,000 grains.
//                                         HERE as controls only: shared.cast.fall.go() / .clear() (the loads themselves
//                                         are the set's: shared.tree.fall; the order, the powder and the ring zone are here).
// 24 Ice fog (V)                          STANDS in set.js (shared.iceFog)
//
// WHAT THIS MODULE LEAVES ON shared.cast (for the staging; all of it also under shared.cast.falls):
//   sift(at, { count, delay })          a veil of powder from a place ([x, y, z] or a Vector3, in the realm)
//   slide('outlier' | 0..3, { settled })   a bough lets its snow go (settled: true = its after-state at once, no show)
//   fall.go({ over, sifts }) / fall.clear() / fall.reset()      the oldest tree is emptied; bare at once; loaded again
//   greatFall({ count, envelope })      the 9,000 petals, in the mirror only
//   falls.onSift(x, y, z), falls.onRelease(what, where, index), falls.onLand(x, z, strength, what), falls.onFlake(x, z, info)
//                                       callbacks for sound (rustle, whump, the rings); fall.onRelease(index, load) likewise
//   falls.auto = { sifts, bridge, bump, low, outlier }   what the cast does by itself until the staging takes it: set one
//                                       false and call the control from a cue instead
// Developer switch: &falls=name:seconds,...   lets a thing go at that second of the realm's clock, for a picture:
//   sift (over the bow), bridge, outlier, low (the four low boughs), fall, clear, great.   &snow=0: no snowfall.
import * as THREE from 'three';
import { makeFall, canopyMask } from '../../engine/life/falls.js';
import { makeFront } from '../../engine/life/fronts.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const Q = new URLSearchParams(location.search);

export async function build(ctx, plan, shared) {
  const cast = shared.cast = shared.cast || {};
  const F = shared.frame, C = plan.chip, here = shared.here || { s: 0, d: 0 }, air = shared.air || { open: 1, thaw: 0 }, memory = shared.memory || { amount: 1 };
  const seen = shared.seen || ((c) => new THREE.Color(c));
  const calm = !!ctx.reducedMotion, rnd = ctx.rng(601), boat = ctx.boat;
  const orch = shared.orchard || null, tree = shared.tree || null, outl = shared.outlier || null, river = shared.river || null;
  const birches = shared.margins && shared.margins.birches;
  const falls = cast.falls = { auto: { sifts: true, bridge: true, bump: true, low: true, outlier: true }, onFlake: null, onSift: null, onRelease: null, onLand: null };
  const piece = (name, fn) => { try { return fn(); } catch (err) { console.error(`INVALID_CAST snow/falls: ${name} was left out (${(err && err.message) || err})`); return null; } };
  const tell = (fn, ...args) => { if (typeof fn === 'function') { try { fn(...args); } catch (err) { console.error(err); } } };

  // ================================================================================================ 1, 2: the snowfall
  // Snowfall, and in the water the petal that rises to meet every flake (page cast 1 and 2: the SAME buffer and the same
  // function, never a second simulation: the life toolkit's fall with its twin). Taken over from set.js as it stood
  // there, with the layout's three findings kept: (a) far flakes 8.5 px and at 0.9, and darker than the sky against it;
  // the gold globe now has its fine snow (`fill`: flakes too small to see until the lantern is on them: without it the
  // lantern's reach holds a dozen gold flakes of 20,000); the nearest landings write their pin rings.
  const SKY = { color: seen('#A39DC2'), from: -0.02, to: 0.1, overhead: [0.7, 0.92] };      // (the page: chip 3 where a flake is seen against the sky; a step darker than the chip, from just above the horizon: 1-layout.md)
  const GOLD = (Q.get('gold') || '').split(',');               // (&gold=E0A848,1.0, developer: the globe's colour and gain)
  // (The page's gold, #FFD79A at 1.6, is cream on the black water and, against the pearl sky, light on light: it could be
  // told from the sky by hue alone, which does not carry (the director, 8 November 22:35). A deeper gold at 1.0 is a
  // step DARKER than the sky and far lighter than the water: it reads as gold against both.)
  const GLOBE = { radius: 3.5, color: /^[0-9a-fA-F]{6}$/.test(GOLD[0] || '') ? '#' + GOLD[0] : '#D8A552', gain: +GOLD[1] > 0 ? +GOLD[1] : 1.0 };
  const FILL = Q.has('fill') ? Math.max(0, +Q.get('fill') || 0) : 3000;      // (the toolkit's 400 is a globe at night; on this pale picture 1,200 was a dozen gold flakes and 6,000 a globe; looking up from the avenue 4,000 strewed the whole sky with gold dots: 3-cast-falls.md. &fill=<n>, developer: how many fine flakes the lantern's globe holds)
  const PETAL = Q.has('petal') ? +Q.get('petal') || 0 : 1.0, inWater = shared.inWater || seen;
  let snow = null, twinU = null, twinCore = 1, twinShare = 1;
  if (Q.get('snow') !== '0') {
    snow = makeFall(ctx, {
      kind: 'flake', count: plan.count.flakes, box: [60, 28, 60], color: [seen(C.paper)], opacity: 0.92, minPixels: 8.5, farAlpha: 0.9,
      sky: SKY, globe: { ...GLOBE, fill: FILL },      // (fill: the toolkit's 400 is a globe at night; in this pale picture, at the plain's six tenths of the fall, it was five or six gold flakes: 3-cast-falls.md)
      // (the petals show their own colour, as the blossom the water shows does: lit only by the remembered dusk they were
      // dull specks, dark on the dark water, and could not be seen from the boat. &petal=<0..2>, developer: how much)
      twin: { kind: 'petal', count: plan.count.petals, within: 30, size: 0.03, minPixels: ctx.quality && ctx.quality.density < 0.75 ? 2 : 3, emissive: inWater(C.blossom), emissiveIntensity: PETAL },      // (at low quality the mirror is coarser: three of its pixels were a pink square)
      landings: { within: 8, perSecond: 12, onLand: (x, z, info) => tell(falls.onFlake, x, z, info) },
    });
    shared.snowfall = snow;
    const u = snow.twin && snow.twin.material && snow.twin.material.uniforms && snow.twin.material.uniforms.uFallTwin;
    if (u) { twinU = u.value; twinCore = twinU.y; twinShare = twinU.z; }
  }
  const ST = plan.light.states, LS = plan.light;
  const snowUpdate = () => {
    if (!snow) return;
    const s = here.s, open = air.open;
    // 20,000 in the river, 12,000 on the plain and in the orchard, thinning to 3,000 by s 250; in the cave only single
    // flakes drift in, and the fall begins under the icicle fringe (set.js's rule, as it was)
    snow.density = (ST.birch.flakes + (ST.plain.flakes - ST.birch.flakes) * open + (ST.thaw.flakes - ST.plain.flakes) * smooth(LS.thaw.from, 250, s)) / plan.count.flakes
      * (0.02 + 0.98 * smooth(plan.cave.white + 2, plan.cliff.s + 4, s));
    // petals rise from s 76 to s 246, and go with the memory: fewer and fewer through the thaw, the nearest last
    if (snow.twin) {
      const k = memory.amount * smooth(70, 76, s);
      snow.twin.visible = k > 0.02;
      if (twinU) { twinU.y = Math.max(0.05, twinCore * k); twinU.z = twinShare * k; }
    }
  };

  // ================================================================================================ rings to come
  // Whatever of this group reaches the water writes on it a moment later: [time, x, z, strength, radius, what].
  const events = [], loc = {}, isletR = ((plan.tree.islet && plan.tree.islet.across) || 13) / 2;
  const onWater = (x, z) => {
    if (z <= -plan.straight) return plan.waterRoom(-z, x) > 0.2 && Math.hypot(-z - plan.tree.at[0], x - plan.tree.at[1]) > isletR;
    F.locate(x, z, loc); return plan.band(loc.s) - Math.abs(loc.d) > 0.3;
  };
  const ring = (delay, x, z, strength, radius, what) => events.push([ctx.time + delay, x, z, strength, radius, what]);

  // ================================================================================================ 3: powder
  // One pooled fall of powder for everything that sifts, slides or is emptied (the page's 30,000 grains): grey against
  // the sky and gold in the lantern's reach, as the flakes are. Winter only (the toolkit draws it in the direct view).
  // (against the sky a veil of powder takes the wash, chip 4, a step darker than the flakes' own sky colour: at an eighth
  // of a puff's strength the flakes' lavender on this pearl sky could not be seen at all, and the bough's slide showed
  // only where it crossed the water)
  const POWDER_SKY = { color: seen(C.wash), from: -0.02, to: 0.08, overhead: [0.7, 0.92] };
  const powder = piece('the powder', () => makeFall(ctx, { kind: 'powder', pool: plan.count.powder, sky: POWDER_SKY, globe: GLOBE, opacity: 0.1,      // (a sift beside the lantern at the flakes' gain and the toolkit's 0.13 was a dozen gold discs on the black water: fainter, and no brighter than paper)
    color: [seen(C.paper), seen('#EAE4EC')], seed: 613 }));
  // A sift seen from further off than the hull's own length or two is a thin grey wisp against the sky, and at the
  // powder's faintness it could not be seen at all (seventeen let go in six seconds in front of the eye: three were
  // seen, the three that crossed dark water or a trunk). So what sifts further than 9 m from the eye is a second, small
  // pool (the page's own: twelve bursts of 200) of smaller, closer, stronger puffs: a streak, dark on the pale sky and
  // white on the water. Near the eye the faint powder above is used: there a strong puff is a disc.
  // THE POOL (critique, 8 November): 6,000, not the page's 2,400 ("12 pooled bursts" of 200). A grain is up to six seconds
  // in the air and a far sift is 200 to 480 grains: while the oldest tree's late sifts fall (one every 0.6 to 1.5 s for
  // twenty seconds) beside the ordinary ones (one every 2 to 4 s, and three more for a bumped trunk) the 2,400 ran over
  // by a few grains on a ride through the show (INVALID_POOL: grains vanishing in mid-air). At 6,000 it has not, on six
  // rides. (&wisppool=2400, developer: the pool as it was.)
  const wisps = piece('the far sifts', () => makeFall(ctx, { kind: 'powder', pool: Math.max(200, +Q.get('wisppool') || 6000), size: 0.45, grow: 2.0, opacity: 0.22, veil: 0.6, spread: 0.8, life: [2.5, 6], sky: { ...POWDER_SKY, color: seen('#958FB5') }, globe: GLOBE,      // (their sky colour a step lighter than the powder's: where these stronger puffs lie over one another the wash was soot)
    color: [seen(C.paper), seen('#EAE4EC')], seed: 631 }));
  /** A sift: a veil of 200 grains 0.4 m wide from a place ([x, y, z] or a Vector3). Returns how many grains went. */
  const sift = (at, o = {}) => {
    if (!powder || !at) return 0;
    const x = at.isVector3 ? at.x : at[0], y = at.isVector3 ? at.y : at[1], z = at.isVector3 ? at.z : at[2], delay = o.delay || 0;
    const eye = ctx.engine.shared.uCameraPos.value, far = wisps && Math.hypot(x - eye.x, z - eye.z) > 9;
    const dist = Math.hypot(x - eye.x, z - eye.z), count = o.count ?? (far ? Math.round(Math.min(480, 200 + 12 * (dist - 9))) : 200);      // (a far one needs more to be seen at all)
    const n = (far ? wisps : powder).burst({ at: [x, y - (o.drop ?? 0.1), z], radius: o.radius ?? 0.2, height: 0.2, count, over: o.over ?? 0.5, delay });
    if (!n) return 0;
    tell(falls.onSift, x, y, z);
    // (from a bridge or a low bough the veil reaches the water as a breath: two faint rings; from a crown it has thinned away)
    if (y < 5.5) for (let k = 0; k < 2; k++) ring(delay + 1.1 + y / 2.4 + 0.4 * k, x + (rnd() - 0.5) * 0.5, z + (rnd() - 0.5) * 0.5, 0.1, 0.3, 'sift');
    return n;
  };

  // ---- where a sift may fall from: twig ends of the avenue's trees, the birches' sprays, the oldest tree, the outlier
  // (kind 0: any time; 1: the oldest tree, until it is bare; 2: the outlier's bough, until its snow has gone)
  const CELL = 8, cells = new Map();
  const put = (x, y, z, kind) => { if (!(y > 2.4)) return; const k = Math.floor(-z / CELL); let c = cells.get(k); if (!c) cells.set(k, c = []); c.push(x, y, z, kind); };
  piece('the places sifts fall from', () => {
    if (orch && orch.ends) for (let i = 0; i < orch.ends.length; i += 3) { const e = orch.ends[i]; put(e.x, e.y, e.z, 0); }
    if (birches && birches.sprays) for (const e of birches.sprays) put(e[0], e[1], e[2], 0);
    if (tree && tree.ends) for (let i = 0; i < tree.ends.length; i += 3) { const e = tree.ends[i]; put(e.x, e.y, e.z, 1); }
    if (outl) { for (const e of outl.crown || []) put(e.x, e.y, e.z, 0); for (const e of outl.ends || []) put(e.x, e.y, e.z, 2); }
  });
  let bare = false, slid = false;                              // the oldest tree is emptied; the outlier's bough has let go
  const tmp = new THREE.Vector3();
  /** A laden place within 40 m of the eye, in front of it if there is one there. */
  const somewhere = () => {
    const eye = ctx.engine.shared.uCameraPos.value, cam = ctx.engine.camera, e = cam && cam.matrixWorld ? cam.matrixWorld.elements : null;
    const fx = e ? -e[8] : -Math.sin(boat.heading), fz = e ? -e[10] : -Math.cos(boat.heading), fl = Math.hypot(fx, fz) || 1, k0 = Math.floor(-eye.z / CELL);
    for (let tries = 0; tries < 44; tries++) {
      const c = cells.get(k0 + Math.round((rnd() * 2 - 1) * 5)); if (!c || !c.length) continue;
      const i = Math.floor(rnd() * (c.length / 4)) * 4, x = c[i], z = c[i + 2], kind = c[i + 3];
      if ((kind === 1 && bare) || (kind === 2 && slid)) continue;
      const dx = x - eye.x, dz = z - eye.z, d = Math.hypot(dx, dz);
      if (d > 40 || d < 2.5) continue;
      if (tries < 30 && (dx * fx + dz * fz) / (d * fl) < 0.45) continue;
      return tmp.set(x, c[i + 1], z);
    }
    return null;
  };
  let nextSift = 1.2;
  const EVERY = +Q.get('sifts') || 0;                          // (&sifts=<seconds>, developer: a sift that often, to look at many at once)

  // ---- certain: from the bridge as the bow passes under (the set's named gaps between its planks), nearest the bow first
  let bridgeDone = null;
  const bridgeSift = () => {
    const br = river && river.bridge; if (!br || !br.point) return false;
    const bx = boat.x - Math.sin(boat.heading) * 1.85, bz = boat.z - Math.cos(boat.heading) * 1.85;
    const pts = ['sift_1', 'sift_2', 'sift_3'].map((n) => br.point(n)).filter(Boolean).map((p) => p.clone()).sort((a, b) => Math.hypot(a.x - bx, a.z - bz) - Math.hypot(b.x - bx, b.z - bz));
    pts.forEach((p, i) => sift([p.x, Math.min(p.y, plan.bridge.clear + 0.1), p.z], { delay: i * 0.5, count: i ? 160 : 220 }));
    return pts.length > 0;
  };
  // ---- certain: from the crown above when the hull knocks a trunk (the Trees group tells: shared.orchard.onBump)
  if (orch && orch.onBump) orch.onBump((t) => {
    if (!falls.auto.bump || !orch.endsOf) return;
    const ends = orch.endsOf(t).filter((e) => e.y > 3 && e.y < 9).sort((a, b) => Math.hypot(a.x - boat.x, a.z - boat.z) - Math.hypot(b.x - boat.x, b.z - boat.z));
    for (let i = 0; i < Math.min(3, ends.length); i++) { const e = ends[Math.min(ends.length - 1, i * 3)]; sift([e.x, e.y, e.z], { delay: 0.15 + 0.4 * i }); }
  });

  // ================================================================================================ 13: snow slides
  // The four long low boughs (plan.slides). The wood, the slab and the spring are the Trees group's (shared.orchard.slide:
  // the bough rises a quarter of a metre and settles in three swings; its two metres of ridge crack, roll off and fall).
  // Here: WHEN (once the hull has gone by and its wake's rings have had time to reach the trunk: never while the hull is
  // within 4.5 m of where the slab comes down), the powder, the cluster of rings.
  const lows = ((orch && orch.slides) || []).map((t, i) => ({ t, i, state: 0, due: 0 }));      // state 0 waiting, 1 the rings are on their way, 2 gone
  const letGo = (low, o = {}) => {
    if (!orch || !low) return false;
    if (o.settled) { orch.slide(low.t, { settled: true }); low.state = 2; return true; }
    if (low.state === 2) return false;
    const at = orch.slide(low.t); low.state = 2;
    if (!at) return false;
    const hx = at.alongX * 0.5, hz = at.alongZ * 0.5;
    if (powder) powder.burst({ line: [[at.x - hx, at.y - 0.35, at.z - hz], [at.x + hx, at.y - 0.35, at.z + hz]], radius: 0.25, height: 0.3, count: 260, over: 0.5, delay: 0.5 });
    for (let k = 0; k < 5; k++) { const u = (k + 0.5) / 5 - 0.5; ring(1.35 + 0.07 * k + 0.1 * rnd(), at.x + at.alongX * u + (rnd() - 0.5) * 0.5, at.z + at.alongZ * u + (rnd() - 0.5) * 0.5, 0.55 + 0.4 * rnd(), 0.5, 'low'); }
    tell(falls.onRelease, 'low', at, low.i);
    return true;
  };
  // The outlier's bough (page moment s 76: at s 80 its snow goes toward its tip in one long slide). The lumps and the
  // spring are the set's (shared.outlier.letGo: 1.85 s, the bough rising 0.45 m in three swings). Here: the powder that
  // leaves along the bough as the letting-go runs out to the tip, and the rings where it comes down on the road.
  const slideOutlier = (o = {}) => {
    if (!outl || !outl.letGo) return false;
    if (o.settled) { outl.settle(); slid = true; return true; }
    if (slid) return false;
    slid = true; outl.letGo();
    const a = outl.base, b = outl.tip, len = Math.max(0.5, a.distanceTo(b));
    const along = (x, y, z) => clamp(((x - a.x) * (b.x - a.x) + (z - a.z) * (b.z - a.z)) / (len * len), 0, 1) * 0.75;
    if (powder) powder.burst({ line: [[a.x, a.y - 0.3, a.z], [b.x, b.y - 0.3, b.z]], radius: 0.3, height: 0.4, count: Math.round(len * 110), over: 0.9, delay: 0.55, order: along });
    // (most of it goes over the far side from the arriving boat: west)
    for (let k = 0; k < 7; k++) { const u = (k + 0.5) / 7; ring(1.5 + 0.75 * u + 0.25 * rnd(), a.x + (b.x - a.x) * u + (rnd() - 0.5) * 0.6, a.z + (b.z - a.z) * u - 0.3 - 0.5 * rnd(), 0.5 + 0.4 * rnd(), 0.5, 'outlier'); }
    tell(falls.onRelease, 'outlier', { a, b, clear: 1.85 }, -1);
    return true;
  };
  /** A bough lets its snow go: 'outlier', or one of the four low boughs (0..3, or the plan's tree). { settled: true }: its after-state at once. */
  const slide = (which = 'outlier', o = {}) => (which === 'outlier' ? slideOutlier(o) : letGo(typeof which === 'number' ? lows[which] : lows.find((l) => l.t === which), o));

  // ================================================================================================ 23: the fall (controls)
  // The oldest tree is emptied. The 44 loads, cut into pieces that crack, roll off and crumble, are the monument's
  // (shared.tree.fall). Here: the ORDER (the lights family's front: a plane coming straight down from the top of the
  // tree at 3.4 m/s, later by 0.28 s for every metre out from the bole; 1.9 m/s with reduced motion), the POWDER each
  // load turns into, the RINGS where it comes down, the ring zone under the whole crown, and the late sifts.
  const tf = tree && tree.fall;
  const shed = makeFront(ctx, { name: 'shed', shape: 'plane', speed: calm ? 1.9 : 3.4, lateral: 0.28, rag: 0.5, rise: 0.6, calm: { rise: 2 } });
  const fall = { running: false, began: -1, over: 9, lateUntil: -1, nextLate: 0, zone: null, rate: 30, strength: 0.8, radius: 29, perMetre: 110, onRelease: null, onLand: null, front: shed };
  const begin = (over, sifts) => {
    fall.running = true; fall.began = ctx.time; fall.over = over; fall.lateUntil = ctx.time + over + (sifts ?? 20); fall.nextLate = ctx.time + over * 0.8;
    if (!fall.zone && ctx.water.rainZone) fall.zone = piece('the fall\'s ring zone', () => ctx.water.rainZone({ x: tree.centre.x, z: tree.centre.z, radius: fall.radius, rate: 0.01, strength: fall.strength }));
  };
  const onLoad = (index, load) => {
    if (!fall.running) begin(tf.over || (calm ? 16 : 9));                  // (someone let the loads go without go(): the powder and the rings still follow)
    const a = load.a, b = load.b, len = Math.max(0.3, a.distanceTo(b)), peel = load.peel || 1, drop = 0.45;
    const dx = (b.x - a.x) / len, dy = (b.y - a.y) / len, dz = (b.z - a.z) / len;
    const along = (x, y, z) => clamp(((x - a.x) * dx + (y - a.y + drop) * dy + (z - a.z) * dz) / len, 0, 1) * peel;
    // the powder leaves where the pieces come apart, a little under the limb, each stretch as the release reaches it
    if (powder) powder.burst({ line: [[a.x, a.y - drop, a.z], [b.x, b.y - drop, b.z]], radius: (load.width || 0.3) * 0.9, height: 0.5, count: Math.round(len * fall.perMetre), over: 0.9, delay: 1.0, order: along });
    // where it comes down (nothing solid: what it drags down with it): a ripple of 0.6 to 1.0, three to a load
    const h = Math.max(0.2, Math.min(a.y, b.y)), tFall = 1.2 + Math.min(h, 9) / 2.3;
    for (let k = 0; k < 3; k++) { const u = (k + 0.5) / 3; ring(tFall + u * peel + 0.07 * k, a.x + (b.x - a.x) * u + (rnd() - 0.5) * 0.8, a.z + (b.z - a.z) * u + (rnd() - 0.5) * 0.8, clamp(0.35 + 0.25 * len, 0.6, 1.0), 0.5, 'fall'); }
    tell(fall.onRelease, index, load);
  };
  if (tf) { const theirs = tf.onRelease; tf.onRelease = (i, l) => { tell(theirs, i, l); onLoad(i, l); }; }
  /** The tree is emptied: from the top down and the bole outward, over 9 s (16 with reduced motion). `sifts`: seconds of late sifts after it (20). */
  fall.go = ({ over = calm ? 16 : 9, sifts = 20 } = {}) => {
    if (!tf || fall.running || bare) return false;
    shed.clear(); shed.tick(0);
    const k = shed.launch({ at: 0, origin: [tree.centre.x, Math.max(...tf.loads.map((l) => l.high)), tree.centre.z], dir: [0, -1, 0] });
    const when = tf.loads.map((l, i) => Math.max(0, shed.arrival((l.a.x + l.b.x) / 2, l.high, (l.a.z + l.b.z) / 2, (i * 0.6180339) % 1, k)));
    const last = Math.max(1e-3, ...when);
    begin(over, sifts);
    tf.loads.forEach((l, i) => tf.release(i, when[i] / last * over));
    return true;
  };
  /** The tree bare at once, with no show (a rider who enters past it; the settle of the showstopper's cue). */
  fall.clear = () => { if (tf) tf.clear(); bare = true; fall.running = false; fall.lateUntil = -1; if (fall.zone) { fall.zone.remove(); fall.zone = null; } for (let i = events.length - 1; i >= 0; i--) if (events[i][5] === 'fall') events.splice(i, 1); };
  /** Every load back on its limb (for looking at it again). */
  fall.reset = () => { if (tf) tf.reset(); bare = false; fall.running = false; fall.lateUntil = -1; if (fall.zone) { fall.zone.remove(); fall.zone = null; } };
  const fallUpdate = (t) => {
    if (!fall.running) return;
    const since = t - fall.began, over = fall.over;
    // the surface all rings under the whole crown: rising to about 30 a square metre a second and back, so that the mirror breaks and its return is an event
    if (fall.zone) { fall.zone.rate = Math.max(0.01, fall.rate * smooth(0, 0.45 * over, since) * (1 - smooth(0.85 * over, over + 3, since))); if (since > over + 3.2) { fall.zone.remove(); fall.zone = null; } }
    if (since > over * 0.9) bare = true;
    // late sifts: what was left on the twigs keeps coming down for twenty seconds
    if (t >= fall.nextLate && t < fall.lateUntil && tree && tree.ends && tree.ends.length) {
      fall.nextLate = t + 0.6 + 0.9 * rnd();
      const e = tree.ends[Math.floor(rnd() * tree.ends.length)];
      if (e.y > 3.5) sift(e, { count: 110 + Math.round(90 * rnd()) });
    }
    if (t > fall.lateUntil && !fall.zone) fall.running = false;
  };

  // ================================================================================================ 22: the great petal fall (control)
  // The orchard's second pool of 9,000 petals under the whole crown, drawn ONLY in the water's mirror: let go from the
  // undersides of the blossom the water shows (shared.tree.lobes), they are seen in the water rising to the surface,
  // and where each arrives a ring opens that nothing above has caused. Nothing of it is drawn until it is asked for.
  let great = null, greatZone = null, greatAt = -1, greatFor = 0, warm = 3;
  const qn = (k, d) => { const v = parseFloat(Q.get(k)); return Number.isFinite(v) ? v : d; };
  // (Critique, 8 November: at 1.6 rings a square metre a second, strength 0.3, the pond was a blur for the fall's first eight
  // seconds and no petal could be made out in it until the dimpling had died; at 0.4 and 0.2 the rings are single rings on a
  // mirror that holds, and the petals are in it from the second second. The petals a little finer (2.8 of the mirror's pixels,
  // not 3.5: at 5 they were pink squares) and half as bright again. &greatsize= &greatpx= &greatgain= &greatrate=
  // &greatstrength= (developer) try other numbers; 1.6 and 0.3 with 3.5 and 1.4 is how it was.)
  const GREAT = { size: qn('greatsize', 0.06), px: qn('greatpx', 2.8), gain: qn('greatgain', 2.0), rate: qn('greatrate', 0.4), strength: qn('greatstrength', 0.2) };
  piece('the great petal fall', () => {
    if (!tree || !tree.lobes || !tree.lobes.length) return;
    const mask = canopyMask(ctx, { crowns: tree.lobes.map((l) => ({ x: l.x, z: l.z, r: l.r * 1.15, under: clamp(l.y - 0.6 * l.r, 1.2, 9) })), size: 256, ceiling: 12 });
    great = makeFall(ctx, { kind: 'petal', shape: 'kite', crisp: false, count: 0, pool: plan.count.petalsGreatFall, size: GREAT.size, minPixels: GREAT.px, mirror: true, mask, seed: 677, emissive: inWater(C.blossom), emissiveIntensity: PETAL * GREAT.gain,      // (the orchard's own petal, 6 cm: at the twin's 3 cm the water's soft mirror kept nothing of them beyond the hull)
     
      landings: { within: 30, perSecond: 30, onLand: (x, z, info) => tell(falls.onLand, x, z, 0.05, 'petal') } });
    ctx.only(great.object, 'mirror');
  });
  /** The great petal fall, in the mirror only: 9,000 over 16 s (rising 2 s, full for 4, thinning over 10). Returns how many went. */
  const greatFall = ({ count = plan.count.petalsGreatFall, envelope = [2, 4, 10], radius = 29, rate = GREAT.rate, strength = GREAT.strength } = {}) => {      // (rate: at 5 rings a square metre a second the mirror broke and the petals in it could not be seen until the dimpling had died)
    if (!great || memory.amount < 0.05) return 0;
    great.object.visible = true; warm = 0;
    const n = great.burst({ disc: { x: tree.centre.x, z: tree.centre.z, r: radius }, mask: true, from: [0.1, 1], count, envelope });
    greatAt = ctx.time; greatFor = envelope[0] + envelope[1] + envelope[2];
    if (Q.has('fallsdebug')) console.warn(`snow/falls debug: greatFall let ${n} go of ${great.pool}`);
    // the pond dimpled from rim to rim for four seconds, thinning over ten more
    if (!greatZone && ctx.water.rainZone) greatZone = piece('the great fall\'s rings', () => ctx.water.rainZone({ x: tree.centre.x, z: tree.centre.z, radius: plan.pond.r, rate: 0.01, strength }));
    if (greatZone) greatZone.peak = rate;
    return n;
  };
  const greatUpdate = (t) => {
    if (!great) return;
    if (warm > 0) { warm--; great.object.visible = warm > 0; return; }       // (drawn for its first frames so that its paint is ready when it is asked for)
    if (greatAt < 0) return;
    const since = t - greatAt;
    if (greatZone) { greatZone.rate = Math.max(0.01, greatZone.peak * smooth(0.5, 3, since) * (1 - smooth(7, greatFor + 2, since))); if (since > greatFor + 2.5) { greatZone.remove(); greatZone = null; } }
    great.object.visible = memory.amount > 0.02 && since < greatFor + 30;
    if (since > greatFor + 30) greatAt = -1;
  };

  // ================================================================================================ what is left for the staging
  Object.assign(falls, { snow, powder, wisps, sift, slide, fall, greatFall, lows, bridgeSift, get great() { return great; } });
  cast.sift = sift; cast.slide = slide; cast.fall = fall; cast.greatFall = greatFall;

  // &falls=name:seconds,... (developer): let a thing go at that second of the realm's clock, for a picture
  const asked = (Q.get('falls') || '').split(',').filter(Boolean).map((kv) => { const [name, at] = kv.split(':'); return { name, at: +at || 0, done: false }; });
  const play = (name) => {
    if (name === 'sift') { const lp = ctx.engine.shared.uLanternPos ? ctx.engine.shared.uLanternPos.value : null; sift(lp ? [lp.x + 0.3, 4.2, lp.z - 0.6] : [boat.x, 4.2, boat.z - 3]); }
    else if (name === 'bridge') bridgeSift();
    else if (name === 'outlier') slideOutlier();
    else if (name === 'low') lows.forEach((l) => letGo(l));
    else if (name === 'fall') fall.go();
    else if (name === 'clear') fall.clear();
    else if (name === 'great') greatFall();
  };

  let frame = 0;
  return {
    update() {
      const t = ctx.time, s = here.s;
      snowUpdate();
      frame++;
      if (frame === 2) {
        // entered part-way: what lies behind the boat is in its after-state, with no show
        if (falls.auto.outlier && s > 83) slideOutlier({ settled: true });
        if (falls.auto.low) for (const l of lows) if (s > l.t.s + 4.6) letGo(l, { settled: true });
        bridgeDone = s > plan.bridge.s - 1.5;
      }
      if (frame < 2) return;
      for (const a of asked) if (!a.done && t >= a.at) { a.done = true; piece(`&falls=${a.name}`, () => play(a.name)); }
      // ---- a sift somewhere within 40 m every 2 to 4 s, from s 26 to the thaw (fewer as the snow stops)
      if (t >= nextSift) {
        nextSift = t + (EVERY > 0 ? EVERY : 2 + 2 * rnd()) / Math.max(0.3, 1 - 0.7 * air.thaw);
        if (falls.auto.sifts && s > 24 && s < 256) { const p = somewhere(); if (p) sift(p); }
      }
      // ---- the bridge: as the bow passes under
      if (falls.auto.bridge && bridgeDone !== null) {
        const sB = plan.bridge.s;
        // (the veil is a second coming down to the lantern, which hangs two metres ahead of the eye: it is let go that much
        // early, by the boat's own speed, so that the lantern arrives under it; a boat that creeps gets it as the lantern passes under)
        const lead = 2.0 + 1.15 * Math.max(0, Math.min(4, boat.speed || 0));
        if (!bridgeDone && s >= sB - lead && s < sB + 1) bridgeDone = bridgeSift() || true;
        else if (bridgeDone && s < sB - 14) bridgeDone = false;
      }
      // ---- the outlier: at s 80, with the bow 2 m short of the bough (until the staging takes it: auto.outlier = false)
      if (falls.auto.outlier && !slid && s >= 80 && s < 83 && Math.abs(here.d) < 9) slideOutlier();
      // ---- the four low boughs: the hull has gone by; its rings take a few seconds to reach the trunk; then the bough lets go
      if (falls.auto.low) for (const l of lows) {
        if (l.state === 2) continue;
        const ts = l.t.s, td = l.t.d, sx = td - Math.sign(td) * 5;                // (the slab hangs about five metres from the trunk toward the road)
        if (l.state === 0) { if (s > ts + 1.6 && s < ts + 30) { l.state = 1; l.due = t + clamp((Math.abs(td - here.d) - 1) / 1.6, 2.5, 6.5); } }
        else if (t >= l.due && Math.hypot(s - ts, here.d - sx) > 4.5 + 1.9) letGo(l);
      }
      // ---- the rings that were on their way
      for (let i = events.length - 1; i >= 0; i--) {
        const e = events[i]; if (e[0] > t) continue;
        events.splice(i, 1);
        if (!onWater(e[1], e[2])) continue;
        ctx.water.ripple(e[1], e[2], e[3], e[4]);
        tell(e[5] === 'fall' ? fall.onLand : null, e[1], e[2], e[3]);
        tell(falls.onLand, e[1], e[2], e[3], e[5]);
      }
      fallUpdate(t);
      greatUpdate(t);
    },
  };
}
