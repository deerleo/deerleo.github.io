// snow: the cast, group "Birds" (stage 3): the waxwings on the last apples, the crumbs that fall under them, and the one
// apple that drops from the outlier's bough. The plan: docs/build/snow/3-cast-plan.md; the log: 3-cast-birds.md.
// Everything here is WINTER (the direct view only): in the water the same boughs are in blossom and carry no bird.
//
//   the waxwings   ONE flock of 74 (life family `birds`, species `waxwing`), whose places carry three groups' rules:
//     'bough'   5 on the snow on the outlier's bough (shared.outlier.perches), 3 m over the road at s 84. The two nearest
//               the boat's line leave when the boat is 7 m off, the rest at 4 m, all to hidden places 'ahead': the crowns
//               of the first standing pair of trees, (117.5, -10) and (117.5, +10)
//     'tree'    60 in the oldest tree, 10 to 28 m up, in three gatherings, each about a handful of the last apples:
//               one bird on the apple's own twig, leaning to it; the others on twig ends within 2.2 m
//     'low'     9 on the snow of the low bough at (216.5, +10), each on the road side of its apple (so that it looks toward
//               the trunk, never at the boat); they leave only if the hull comes within 3 m, up into that tree's crown
//   the crumbs     life family `falls`, kind `drip`: a crumb of snow or apple lets go under a feeding bird about every 2 s
//               at the bough and at the low bough, oftener under the sixty; a pin ring where it lands. A group that has
//               flown drops none
//   the apple      the middle one of the three under the outlier's bough (the set's own apple, moved with
//               shared.outlier.moveApple): it falls, makes one ring, bobs, drifts down the road with the current as one of
//               `makeDrifters`' bodies (the hull can nudge it) and comes to rest against the skin ice of the bay
//
// FOR THE STAGER (shared.cast.birds; 3-cast-birds.md has them all): hush(), lift(), settle({ over }), flush(), seatAhead(),
// apple.drop(delay), apple.settle(); callbacks onLeave, onLand, onTrill, onCrumb, onPlop (set them: nothing here makes a sound).
//
// Developer switch: &wax=lift@2,back@14,flush@1,drop@1,hush@0   do that at so many seconds of the realm's clock (for strips).
import * as THREE from 'three';
import { makeFlock, SPECIES } from '../../engine/life/birds.js';
import { makeFall } from '../../engine/life/falls.js';
import { makeDrifters } from '../../engine/life/floaters.js';

const Q = new URLSearchParams(location.search);
const SINK = 0.012;                                             // a perched bird's feet are in the snow, not on it
// THE SNOW'S WAXWING IS AN INK BIRD. The family's waxwing is painted for a dusk pond; this area's light is the brightest of
// the ride (gain 1.52) and lifts its buff to cream: pale birds on pale snow against a pale sky (the client: "hard to see
// because its light on light"). The body, back and wings are painted two to three steps down, so that the whole bird is a
// dark shape on the white from where the rider meets it; the mask, the bib, the gold band and the red wax tips keep their chips.
const INK = { top: '#3b3336', belly: '#544948', head: '#5e463d', rump: '#403e47', vent: '#4a241b', wingTop: '#2f2a2e', wingTrail: '#1a171e', handTop: '#111016', wingUnder: '#443f45', wingUnderTrail: '#322e36', tail: '#1c1a21', tailUnder: '#232027', armEdge: '#d4cfca', bar: '#d4cfca' };

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const F = shared.frame, O = shared.orchard, T = shared.tree, OL = shared.outlier, here = shared.here;
  if (!F) return {};
  const rnd = ctx.rng(9311), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const unit = (a, b) => { const d = [b.x - a.x, b.y - a.y, b.z - a.z], l = Math.hypot(...d) || 1; return d.map((v) => v / l); };
  const places = [], crumbAt = { bough: [], tree: [], low: [] };
  const SNOW_CRUMB = shared.seen ? shared.seen('#F3ECE8') : '#F3ECE8', APPLE_CRUMB = shared.seen ? shared.seen('#E3D2B4') : '#E3D2B4';
  const crumb = (group, a, k) => crumbAt[group].push({ x: a.x, y: a.y - 0.05, z: a.z, color: k % 2 ? APPLE_CRUMB : SNOW_CRUMB });

  // ================================================================================================ the outlier's bough
  // Five places on the snow on its back (the set's own). A bird with an apple within reach leans to it and so stands along
  // the bough, side-on to the road; the others are turned down the route, away from the boat that is coming.
  const LOW_UP = Q.has('waxlow') ? +Q.get('waxlow') : 0.03;                                       // (the loaf stands a little higher than the script's rule says: seen in the ride, a bird at the rule's height was in snow to its breast)
  const LIFT = Q.has('waxy') ? +Q.get('waxy') : 0.03, EAST = Q.has('waxz') ? +Q.get('waxz') : 0.06;      // (developer: &waxy= &waxz= metres)
  if (OL && OL.perches && OL.perches.length) {
    const P = OL.perches, apples = OL.apples || [], line = plan.lineD(plan.outlier.bough.s);
    const byLine = P.map((p, i) => i).sort((a, b) => Math.abs(P[a].x - line) - Math.abs(P[b].x - line));      // (x is d from s 58 on)
    P.forEach((p, i) => {
      const along = unit(P[Math.max(0, i - 1)], P[Math.min(P.length - 1, i + 1)]);
      let look, best = 0.48;
      for (const a of apples) { const d = Math.hypot(a.x - p.x, a.z - p.z); if (d < best) { best = d; look = [a.x, a.y, a.z]; } }
      // (on the ridge's east shoulder, the side the boat comes from: a bird in the middle of a loaf of snow 26 cm wide, seen from 2 m below, is a head)
      places.push({ x: p.x, y: p.y + LIFT, z: p.z + EAST, along, look, face: look ? undefined : Math.PI + (rnd() - 0.5) * 1.1, group: 'bough', within: byLine.indexOf(i) < 2 ? 7 : 4, to: 'ahead' });
    });
    apples.forEach((a, k) => crumb('bough', a, k));
  }
  // where they fly on to: near-level wood in the crowns of the first standing pair, hidden places (nothing flits there)
  const treeAt = (s, d) => (O && O.trees ? O.trees.find((e) => e.t && Math.abs(e.t.s - s) < 0.6 && Math.abs(e.t.d - d) < 0.6) : null);
  {
    let n = 0;
    for (const d of [-10, 10]) {
      const e = treeAt(117.5, d), list = e ? O.perches(e.t).filter((p) => p.y > 4.3).sort((a, b) => b.y - a.y) : [];
      for (const p of list.slice(0, 4)) { places.push({ x: p.x, y: p.y + 0.03, z: p.z, group: 'ahead', hide: true }); n++; }
    }
    for (; n < 6; n++) { const p = F.at(117.5 + n * 0.4, n % 2 ? 10.5 : -10.5, 5.2 + 0.3 * n); places.push({ x: p.x, y: p.y, z: p.z, group: 'ahead', hide: true }); }      // (the trees' numbers did not load)
  }

  // ================================================================================================ the low bough at (216.5, +10)
  // The bough's own line (the design's), with its ridge of snow on it; the nine apples the kit hung under it.
  {
    const K = plan.kitApples || { most: [216.5, 10] }, e = treeAt(K.most[0], K.most[1]), design = e && O.models[e.model], low = design && design.limbs.find((l) => l.k === 'low');
    const apples = e && O.apples ? O.apples.filter((a) => Math.abs(-a.z - K.most[0]) < 1.6 && Math.abs(a.x - K.most[1]) < 6.2 && a.y > 2.6 && a.y < 4.4) : [];
    if (low && apples.length) {
      // samples every 2 cm along the top of its snow, from 1.2 m out to the tip
      const pts = []; for (let i = 0; i < low.p.length; i += 4) pts.push({ p: O.toRealm(e.t, [low.p[i], low.p[i + 1], low.p[i + 2]], V(0, 0, 0)), r: low.p[i + 3], out: low.p[i] });
      const top = [];
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1], len = a.p.distanceTo(b.p), steps = Math.max(1, Math.round(len / 0.02));
        for (let k = 0; k < steps; k++) {
          const t = k / steps, r = a.r + (b.r - a.r) * t, out = a.out + (b.out - a.out) * t;
          if (out < 1.2) continue;
          const ridge = Math.min(0.032 + 0.7 * r, 0.14) * 0.86;                    // (source-art/models/snow/apple_snow.py, ridge_dims: the loaf on a level limb)
          top.push({ x: a.p.x + (b.p.x - a.p.x) * t, y: a.p.y + (b.p.y - a.p.y) * t + r + ridge + LOW_UP, z: a.p.z + (b.p.z - a.p.z) * t });
        }
      }
      const alongAt = (k) => unit(top[Math.max(0, k - 6)], top[Math.min(top.length - 1, k + 6)]);
      const taken = [];
      apples.forEach((a, n) => {
        let best = 0, bd = 1e9; for (let k = 0; k < top.length; k++) { const d = Math.hypot(top[k].x - a.x, top[k].z - a.z); if (d < bd) { bd = d; best = k; } }
        const k = Math.min(top.length - 1, best + 5);                             // a hand toward the tip, the road's side: it looks back along the bough at its apple
        const p = top[k]; taken.push(k);
        places.push({ x: p.x, y: p.y, z: p.z, along: alongAt(k), look: [a.x, a.y, a.z], group: 'low', within: 3, to: 'crown' });
        if (n % 2 === 0) crumb('low', a, n >> 1);
      });
      // four more places with no apple, for a flit along the bough: turned toward the trunk
      for (let tries = 0, n = 0; tries < 200 && n < 4; tries++) {
        const k = Math.floor(rnd() * top.length);
        if (taken.some((q) => Math.abs(q - k) < 16)) continue;
        const p = top[k]; taken.push(k); n++;
        places.push({ x: p.x, y: p.y, z: p.z, along: alongAt(k), face: Math.PI / 2 + (rnd() - 0.5) * 1.0, group: 'low', within: 3, to: 'crown' });
      }
      // up into the crown: near-level wood above the bough
      const up = O.perches(e.t).filter((p) => p.y > 4.5).sort((a, b) => a.y - b.y).slice(0, 12);
      for (const p of up) places.push({ x: p.x, y: p.y + 0.03, z: p.z, group: 'crown', hide: true });
    } else console.warn('snow/cast_birds: the low bough at (216.5, +10) or its apples were not found: its nine waxwings are left out');
  }

  // ================================================================================================ the oldest tree
  // Three gatherings in the crown, each about the apples nearest its middle: on an apple's own twig end one bird that
  // leans to it; on up to five twig ends within 2.2 m of it, birds that wait their turn.
  if (T && T.apples && T.apples.length && T.tips) {
    const tips = T.tips.filter((t) => !t.low && t.y > 9.5 && t.y < 30), used = new Uint8Array(tips.length), done = new Set();
    const middles = [[0, 26, 10], [-14, 18, 1], [9, 22, -14]].map(([x, y, z]) => V(T.at.x + x, T.at.y + y, T.at.z + z));
    middles.forEach((mid, c) => {
      const list = T.apples.map((a, i) => ({ a, i, d: a.distanceTo(mid) })).filter((q) => !done.has(q.i)).sort((p, q) => p.d - q.d);
      let n = 0, crumbs = 0;
      for (const { a, i } of list) {
        if (n >= 28) break;
        done.add(i);
        const near = [];
        for (let k = 0; k < tips.length; k++) { if (used[k]) continue; const t = tips[k], d = Math.hypot(t.x - a.x, t.y - a.y, t.z - a.z); if (d < 2.2) near.push({ k, d }); }
        near.sort((p, q) => p.d - q.d);
        const mine = [];
        for (const { k, d } of near) {
          const t = tips[k];
          if (d < 0.09 && !mine.length) {                                         // the apple's own twig: the bird that feeds
            const an = rnd() * 6.283; used[k] = 1; mine.push(t);
            places.push({ x: t.x, y: t.y, z: t.z, look: [a.x + Math.cos(an) * 0.07, a.y, a.z + Math.sin(an) * 0.07], group: 'treeA' + c });
            if (crumbs < 4 && plan.waterRoom(-a.z, a.x) > 1) { crumb('tree', a, crumbs + c); crumbs++; }
            n++; continue;
          }
          if (d < 0.28 || mine.length >= 6 || mine.some((q) => Math.hypot(q.x - t.x, q.y - t.y, q.z - t.z) < 0.32)) continue;
          used[k] = 1; mine.push(t); n++;
          places.push({ x: t.x, y: t.y, z: t.z, group: 'treeS' + c });
        }
      }
    });
  }

  // ================================================================================================ the flock
  const api = shared.cast.birds = { onLeave: null, onLand: null, onTrill: null, onCrumb: null, onPlop: null, hushed: false, places, crumbsLanded: 0 };
  const groupOf = [];
  let homing = 0;                                                 // seconds until the wheel over the tree is taken down again (see update)
  const wax = makeFlock(ctx, {
    species: Q.get('waxink') === '0' ? 'waxwing' : { ...SPECIES.waxwing, paint: { ...SPECIES.waxwing.paint, ...INK } }, count: plan.outlier.waxwings + plan.tree.waxwings + 9, seed: 5, perches: places, fluff: 0.25, silhouette: 1, scale: Q.has('waxscale') ? +Q.get('waxscale') : 1.25, flit: { every: 3, range: [2, 6] },
    only: 'direct', prePass: false,                                               // winter; and never low over the water beside the rider
    onLeave: (i, x, y, z) => { if (api.onLeave) api.onLeave(i, x, y, z, groupOf[i]); },
    onLand: (i, x, y, z) => { if (api.onLand) api.onLand(i, x, y, z, groupOf[i]); },
  });
  api.flock = wax;
  // Who sits where. The family deals birds over ALL places at random, the hidden ones too: here every bird is given its
  // group (5 : 60 : 9 of however many the quality setting leaves), the feeding places first.
  {
    const n = wax.count, has = (g) => wax.perches.some((p) => p.group === g);
    const nb = has('bough') ? Math.max(Math.min(n, 2), Math.round(n * 5 / 74)) : 0, nl = has('low') ? Math.round(n * 9 / 74) : 0, nt = n - nb - nl;
    for (const p of wax.perches) p.taken = -1;
    const seat = (i, groups) => { for (const g of groups) { if (!has(g)) continue; const was = wax.birds[i].perch; wax.seat({ who: [i], to: g }); if (wax.perches[wax.birds[i].perch].taken === i && wax.perches[wax.birds[i].perch].group === g) return true; wax.birds[i].perch = was; } return false; };
    let i = 0, lost = 0;
    for (let k = 0; k < nb; k++, i++) { groupOf[i] = 'bough'; if (!seat(i, ['bough'])) lost++; }
    for (let k = 0; k < nt; k++, i++) {
      const c = k % 3, feeds = Math.floor(k / 3) % 5 < 2;                         // two in five on an apple's own twig
      groupOf[i] = 'tree';
      if (!seat(i, feeds ? ['treeA' + c, 'treeS' + c, 'treeS' + (c + 1) % 3, 'treeA' + (c + 1) % 3, 'treeS' + (c + 2) % 3, 'treeA' + (c + 2) % 3] : ['treeS' + c, 'treeA' + c, 'treeS' + (c + 1) % 3, 'treeS' + (c + 2) % 3, 'treeA' + (c + 1) % 3, 'treeA' + (c + 2) % 3])) lost++;
    }
    for (let k = 0; k < nl; k++, i++) { groupOf[i] = 'low'; if (!seat(i, ['low'])) lost++; }
    // (a bird with no place of its own kind is put out of sight: an empty place is better than two birds in one)
    wax.birds.forEach((b, j) => { const p = wax.perches[b.perch]; if (!p || p.taken !== j) { b.show = 0; b.showTo = 0; } });
    if (lost) console.warn(`snow/cast_birds: ${lost} of ${n} waxwings found no place of their group and are hidden`);
    for (const p of wax.perches) if (/^tree[AS]/.test(p.group)) { p.cluster = +p.group.slice(5); p.feeds = p.group[4] === 'A'; p.group = 'tree'; }      // one group from here on: a flit may cross from one gathering to the next
    api.counts = { birds: n, bough: nb, tree: nt, low: nl, places: wax.perches.length, hidden: lost, placesBy: wax.perches.reduce((o, p) => { o[p.group] = (o[p.group] || 0) + 1; return o; }, {}), feeding: wax.perches.filter((p) => p.feeds).length };
  }

  // ================================================================================================ the crumbs
  const crumbList = () => ['bough', 'tree', 'low'].flatMap((g) => (crumbOn[g] ? crumbAt[g] : []));
  const crumbOn = { bough: true, tree: true, low: true };
  const crumbs = makeFall(ctx, {
    kind: 'drip', points: crumbList(), every: [4, 7.5], swell: 0.2, size: 0.03, seed: 77,
    landings: { within: 30, perSecond: 8, ring: [0.06, 0.1], onLand: (x, z, info) => { api.crumbsLanded++; if (api.onCrumb) api.onCrumb(x, z, info); } },
  });
  if (crumbs.object) { ctx.only(crumbs.object, 'direct'); crumbs.object.name = 'crumbs under feeding waxwings (winter)'; }
  const sitting = (g) => wax.perches.some((p) => p.group === g && p.taken >= 0);

  // ================================================================================================ the apple that falls
  const things = makeDrifters(ctx, { drift: 2.2 });
  const AP = { i: 1, state: 'hung', t: 0, v: 0, wait: -1, body: null, dummy: new THREE.Object3D(), pos: V(0, 0, 0), spin: 0 };
  const spot = () => (OL && OL.apple ? OL.apple[AP.i] : null);
  const FLOAT_Y = -0.012, REST = F.at(102.4, 0.3, 0);
  const dropCap = (a) => { OL.moveApple(AP.i, V(a.at.x, -40, a.at.z), true); };          // its cap of snow goes with the bough's slide: out of the picture
  const afloat = (x, z) => { AP.dummy.position.set(x, 0, z); AP.body = things.attach(AP.dummy, { radius: 0.05 }); };
  api.apple = {
    position: AP.pos,
    get state() { return AP.state; },
    /** It lets go (after `delay` seconds): falls, one ring, bobs, drifts down the road, rests against the bay's ice. */
    drop(delay = 0) { if (AP.state === 'hung' && spot()) AP.wait = Math.max(0, delay); return api.apple; },
    /** The after-state at once (for a cue's settle): lying against the skin ice of the bay. */
    settle() {
      const a = spot(); if (!a || AP.state === 'rest') return api.apple;
      if (AP.state === 'hung') { a.fallen = true; AP.pos.copy(a.at); dropCap(a); a.lean = [1.32, 0.3]; }
      if (!AP.body) afloat(REST.x, REST.z); else { AP.body.x = REST.x; AP.body.z = REST.z; }
      AP.body.home = true; AP.body.hx = REST.x; AP.body.hz = REST.z; AP.body.vx = AP.body.vz = 0; AP.state = 'rest'; AP.t = 9;
      return api.apple;
    },
  };

  // ================================================================================================ what the staging asks
  const treeTop = T ? (T.top || V(T.at.x, 33, T.at.z)) : null;
  /** The trill stops (true) or goes on again (false). */
  api.hush = (on = true) => { api.hushed = !!on; return api; };
  /** The sixty lift together from the oldest tree into one loose wheel over its top and climb. */
  api.lift = (g = {}) => { if (treeTop) wax.lift({ at: [T.at.x, treeTop.y + 3, T.at.z], radius: [8, 14], turn: 9, climb: 1.5, top: treeTop.y + 11, stagger: 0.8, who: 'tree', ...g }); api.hushed = true; return api; };
  /** They come back to their own places in ones and twos over `over` seconds. */
  api.settle = ({ over = 40 } = {}) => { wax.settle({ over }); api.hushed = false; homing = over + 12; return api; };
  /** The outlier's five fly on now, ahead to the orchard (they go by themselves at 7 m and 4 m: this is for the slide). */
  api.flush = () => { wax.flush({ who: 'bough', to: 'ahead' }); return api; };
  /** The after-state of the bough at once: its birds sit ahead in the orchard (for a cue's settle). */
  api.seatAhead = () => { wax.seat({ who: 'bough', to: 'ahead' }); return api; };
  /** How many are perched in a group now ('bough', 'tree', 'low', 'ahead', 'crown'). */
  api.perched = (g) => wax.perches.reduce((n, p) => n + (p.group === g && p.taken >= 0 ? 1 : 0), 0);

  // &wax=lift@2,back@14,flush@1,drop@1,hush@0 (developer)
  const todo = (Q.get('wax') || '').split(',').filter(Boolean).map((w) => { const [what, at] = w.split('@'); return { what, at: +at || 0, done: false }; });
  const act = { lift: () => api.lift(), back: () => api.settle(), flush: () => api.flush(), drop: () => api.apple.drop(), hush: () => api.hush(), ahead: () => api.seatAhead(), rest: () => api.apple.settle() };

  // &waxlog=<name>.json (developer): where every bird is and what it is doing, written to .shots/ at &t seconds
  const LOG = /^[\w-]+\.json$/.test(Q.get('waxlog') || '') ? Q.get('waxlog') : null, LOG_T = +(Q.get('t') || 2);
  let logged = false;
  const writeLog = () => {
    const rows = wax.birds.map((b, i) => ({ i, group: groupOf[i], state: b.state, perch: b.perch, on: wax.perches[b.perch] ? wax.perches[b.perch].group : null, at: [+b.x.toFixed(2), +b.y.toFixed(2), +b.z.toFixed(2)], show: +b.show.toFixed(2) }));
    fetch('/__shot/' + LOG, { method: 'POST', body: JSON.stringify({ time: +ctx.time.toFixed(2), here: here && { s: +here.s.toFixed(1), d: +here.d.toFixed(1) }, counts: api.counts, perched: Object.fromEntries(['bough', 'tree', 'low', 'ahead', 'crown'].map((g) => [g, api.perched(g)])), crumbs: Object.fromEntries(Object.entries(crumbAt).map(([g, l]) => [g, l.length])), crumbsLanded: api.crumbsLanded, crumbsOn: { ...crumbOn }, wheel: !!wax.state.wheel, hushed: api.hushed, apple: { state: AP.state, at: AP.pos.toArray().map((v) => +v.toFixed(2)) }, rows }) }).catch(() => {});
  };

  let first = true, trillIn = 2 + rnd() * 3, look = 0;
  return {
    update(dt) {
      const t = ctx.time;
      if (LOG && !logged && t >= LOG_T - 0.3) { logged = true; writeLog(); }
      if (first) { first = false; if (here && here.s > 92) api.seatAhead(); }      // entered beyond the bough: its birds have flown on (the apple and the snow are the staging's to settle)
      for (const w of todo) if (!w.done && t >= w.at) { w.done = true; if (act[w.what]) act[w.what](); }
      // ---- the trill: a thin one every 2 to 5 s from some perched bird within hearing (the staging gives it its sound)
      trillIn -= dt;
      if (trillIn <= 0) {
        trillIn = 2 + rnd() * 3;
        if (!api.hushed && api.onTrill) {
          const b = wax.birds[Math.floor(rnd() * wax.count)], p = b && wax.perches[b.perch];
          if (p && p.taken === b.i && Math.hypot(b.x - ctx.boat.x, b.z - ctx.boat.z) < 60) api.onTrill(b.x, b.y, b.z, p.group);
        }
      }
      // ---- the wheel is taken down once the sixty are home (the family keeps it for good, and while there is a wheel no bird flits)
      if (homing > 0) { homing -= dt; if (homing <= 0) { if (api.perched('tree') >= api.counts.tree) wax.state.wheel = null; else homing = 3; } }
      // ---- crumbs fall only where birds still sit
      look -= dt;
      if (look <= 0) {
        look = 0.5; let changed = false;
        for (const g of ['bough', 'tree', 'low']) { const on = sitting(g); if (on !== crumbOn[g]) { crumbOn[g] = on; changed = true; } }
        if (changed) crumbs.setPoints(crumbList());
      }
      // ---- the apple
      const a = spot();
      if (!a) return;
      if (AP.wait >= 0 && AP.state === 'hung') { AP.wait -= dt; if (AP.wait < 0) { a.fallen = true; AP.pos.copy(a.at); dropCap(a); AP.state = 'fall'; AP.v = 0; AP.t = 0; } }
      if (AP.state === 'fall') {
        AP.v += 9.81 * dt; AP.pos.y -= AP.v * dt; AP.t += dt;
        a.lean = [Math.min(1.32, AP.t * 2.4), 0.3 * Math.min(1, AP.t * 2)];        // it turns on to its cheek as it falls
        if (AP.pos.y <= 0.02) {
          AP.pos.y = 0.02; AP.state = 'float'; AP.t = 0;
          ctx.water.ripple(AP.pos.x, AP.pos.z, 0.7, 0.4);                          // the one ring
          if (api.onPlop) api.onPlop(AP.pos.x, AP.pos.z);
          afloat(AP.pos.x, AP.pos.z);
        }
        OL.moveApple(AP.i, AP.pos);
      } else if (AP.state === 'float' || AP.state === 'rest') {
        AP.t += dt;
        const b = AP.body, s = -b.z;
        if (AP.state === 'float' && s > 101.6) { AP.state = 'rest'; b.home = true; b.hx = b.x; b.hz = b.z - 0.5; }      // against the bay's skin ice
        AP.pos.set(AP.dummy.position.x, FLOAT_Y - 0.075 * Math.exp(-2.4 * AP.t) * Math.cos(7.5 * AP.t) + (ctx.reducedMotion ? 0 : 0.005 * Math.sin(t * 2.2)), AP.dummy.position.z);
        a.turn += dt * 0.25 * Math.exp(-AP.t * 0.05);
        OL.moveApple(AP.i, AP.pos);
      }
    },
  };
}
