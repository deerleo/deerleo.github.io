// The orchard in flood: the cast, group "Waders" (stage 3): THE SIX EGRETS (docs/art/orchard.md, section 5; the family
// is docs/life/waders.md; this module's log, with every strip, is docs/build/orchard/3-cast-waders.md).
//
// "The white trunk that moves." Four low birds, each with two or three places in ride order (a planting mound beside
// its trunk, the islet's shore, the plank walk, the stile, the wall's top), and two that roost high in the oldest tree.
// Each is the family's bird (makeWader): it stands, turns its head slowly aside, reaches, strikes, preens, stands tall,
// on a schedule of its own; this module adds only what the family cannot know about the place:
//   - WHERE: every place is a realm position from plan.js (EGRET_WAYS, in the page's frame), beside the REAL trunk, on
//     the real deck, stone and coping (their heights are found on the models here, not typed in);
//   - THE WAYS THEY FLY: the family knows no scenery and its own flush flies one arc with no route, so the flush is
//     done here: at 14 m (10 m while the boat moves slower than 1 m/s; 1.2 times that with reduced motion; on the
//     plank walk 11.5 m and 9 m) a bird is sent, with flyTo and a route of `via` points down a side aisle, to the first
//     of its places ahead that is 30 m or more from the boat. Each pair of places has one to three lanes; the first that
//     keeps 6 m from where the boat will be and 6 m from wherever on HIS route the stag can be by then is taken. On the
//     wall's top and the stile it lets the boat go by; a boat brought within 4 m of its stone sends it off for good.
//     (plan.js, EGRET_WAYS: how the lanes were laid and measured.)
//   - STALKING STEPS only where the next step stays on the mound and out of the trunk (the family's own roaming is a
//     wander of up to 1.2 m about the place, which would carry a bird through its tree);
//   - THE HOUR: their paint wears shared.dusk (the family takes an `extend`), and holds the light as limewash does.
// Nothing here plays a sound: the hooks are .onEvent and .onTouch below.
//
// shared.cast.waders (for the staging; the log has which moment drives which):
//   .egrets  [6]              the family's handles (docs/life/waders.md, "The bird"): 0..3 the low birds in the page's
//                             order, 4 and 5 the two that roost. .low, .high: the same, apart. Each has `position` (the
//                             fireflies' pool of dark reads it) and .where = { place, name, wet } (kept current here)
//   .staged                   false: they live by themselves, with a plain version of the page's moments (below).
//                             true (set it in the staging's build): only their ordinary life and the flush are left
//   .flushing                 true: they leave for the boat. false: nobody leaves (a study picture)
//   .whiteTrunk()             s 40, "the white trunk moves": the first bird takes two stalking steps and strikes
//   .sendOn(i, { to, lane, wait, force })   bird i (0..3) flies on to its next place (or place `to`), by its lanes;
//                             false if it cannot go now (in the air, nowhere left, or the boat or the stag in its way
//                             and not `force`). s 108 is the flush itself (the fourth bird: the boat comes within 14 m)
//   .toWall({ gap: 1.8, apart: 2.5, force })   s 184, "the egrets go to the wall": every low bird not yet on the wall,
//                             in turn (the NEAREST behind the boat first, `gap` seconds apart or more, so that they pass
//                             it 4 to 5 s apart; one that stands ahead of the boat last; each put back until its landing
//                             falls `apart` seconds from every other's); returns how many were told
//   .stretch(k = 0)           the roost: one of the two high birds opens both wings and resettles. Hunched, it raises
//                             its neck first: its wings are open from 2.7 s to 3.7 s after the call. 0 (the default) is
//                             the one a boat on the lane can see then, and it keeps itself free for this call while the
//                             boat is between s 90 and s 112
//   .settle(s)                a cue's settle: every low bird stands where a boat left to the current would find it at
//                             the page's s (default: where the boat is)
//   .onEvent(name, bird, i, info), .onTouch(x, z, kind, strength, i)   null: set them to hear the birds. Events:
//                             'flush' (it has decided to go), 'leap' (its feet leave: `flutter`, and `splash` at gain 0.4
//                             if info.wet), 'land' (the same), 'settled', 'act:step' | 'act:strike' | 'act:preen' ...
//                             Touches: 'strike' (the bill goes in: `drop`), 'step', 'wingtip', 'leap', 'land'
//   .ways, .route(i, from, to, lane), .lanes(i, from, to)   plan.js's table and its flights, as realm points
// By themselves (staged === false): the first bird steps and strikes when the boat passes s 40; the first and the second
// bird, whose places lie 18 m off the boat's line and are never flushed from it, fly on down their aisles once the boat
// has gone by (s 54 and s 76), so that the second avenue has its birds; one of the roosting pair stretches 5 s after the
// boat passes s 98; the second bird goes to the wall when the boat passes s 176, down the avenue's own left edge (LA),
// so that it passes the boat 7.6 m off at about s 187 and is in a rider's picture to the wall; the others at s 184.
//
// Developer switches (study only):
//   &wdstay=1                 nobody leaves for the boat, and no moment plays by itself
//   &wdset=0:1,3:2            the first frame: bird 0 stands on its place 1, bird 3 on its place 2
//   &wddo=0:step,step,strike  half a second in, bird 0 does these (step | reach | strike | preen | alert | shift | stretch)
//   &wdgo=0  &wdgo=0:2  &wdlane=RO  &wdat=1.5   bird 0 is sent on (to its place 2) at 1.5 s (0.5), by that lane
//   &wdplay=trunk | wall | stretch | stretch1   that moment, half a second in (or at &wdat)
//   &wdroost=29,-1.4,118,0.5  the two that roost by other perches of the tree (counted from 0), so many metres along
//   &wdpart=0                 they leave no window in the petals (rings only)
//   &wdwatch=3  &wdfov=14     the rider's eye follows bird 3; a long lens
//   &wdcam=3,6,1.2,0          the eye goes WITH bird 3: metres to its right, above the water, behind it, looking at it
//   &wdeye=x,y,z              the eye moved off the rider's seat: metres to starboard, up, aft
//   &wdlife=0                 no private life (they only stand);   &wddusk=0  their paint without shared.dusk
//   &wdhold=0                 their paint without the hold under the bloom (a bird beside the bow lantern then burns)
//   &wdroutes=1 | 0:0:1       every flight (or bird 0's from place 0 to place 1) drawn as a line in the air
//   &wdlog=<name>.json        what happened (events, touches, where each bird is twice a second) to .shots/<name>.json
import * as THREE from 'three';
import { makeWader } from '../../engine/life/waders.js';
import { removeStandIn } from '../../engine/modules.js';
import { EGRET_WAYS, egretPlace, egretRoute, egretLanes } from './plan.js';

const Q = new URLSearchParams(location.search);
const num = (k, d) => (Q.has(k) && isFinite(+Q.get(k)) ? +Q.get(k) : d);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const wrap = (a) => { a = (a + Math.PI) % (Math.PI * 2); return (a < 0 ? a + Math.PI * 2 : a) - Math.PI; };

const FLUSH = 14, FLUSH_SLOW = 10, CLEAR = 30;                // the page: it leaves at 14 m (10 m under 1 m/s) for a place 30 m or more from the boat
const STEP = 0.24;                                            // metres an egret's stalking step carries it (docs/life/waders.md)
// Where a boat left to the current finds each low bird: [the page's s from which it stands on its second place, ... on
// its last]: where the boat is when each has landed (the ride's logs, orchard_wd2_ride1.json and _ride2.json). A boat
// set down while one would still be in the air finds it where it stood, and it is sent at once by the rules below.
const FOUND = [[92, 197], [98, 192], [100, 201], [112, 204]];      // (the third and the fourth: from where the boat no longer flushes them from their first places)
const WALLED = Math.max(...FOUND.map((f) => f[1]));          // from here a boat that is set down finds all four on the wall
const MOVE_ON = [54, 76];                                     // by themselves: the first and the second bird fly on when the boat passes these (the page's s)
// The wall (the page: s 184, "those still behind or beside the boat lift in turn, pass it low on either side ... and
// settle on the wall ahead"). A bird on a side aisle comes abreast 14.5 m off, outside the rider's picture, and the wall
// is only 32 m beyond s 184: sent then, a bird that stands 37 or 45 m behind catches the boat only where its lane ends.
// So, by themselves, two go before the page's line, each down an edge of the avenue itself, where it passes the boat
// 7.6 m off inside the picture:
//   the THIRD (the third holder's), on the right, when the boat passes EARLY_R: by RA; abreast of the boat at about s 181;
//   the SECOND, on the left, when the boat passes EARLY and the third has been in the air APART seconds (two birds
//   abreast of the boat in one second, one on each hand, are a fly-past: the family's page): by LA; abreast at about s 187.
// A bird that is preening when its turn comes goes when it has done (the family begins a flight only from standing): the
// third may go as late as EARLY_R + LATE; after that it goes with the others at s 184, by a side aisle.
const EARLY_R = 172, EARLY = 176, WALL = 184, APART = 4.2, LATE = 6;
const CLOSE_LANES = new Set(['LA', 'RA']);                    // lanes that pass within 8 m of a boat on the lane
// The roost (the page: it begins at s 98, and 5 s in "one of the roosting egrets opens both wings and resettles"). Which:
// the FIRST (plan.js, EGRET_WAYS.roost: the end of the south bough, over the boat's line at s 111.5). At 5 s a boat left
// to the current is at s 104 and the flock is coming over the crown from the west: the bird is then 11 degrees left of
// the bow and 41 degrees up, 14.6 m off, side on, with the sky behind it: where a rider looks who looks up at the flock.
// (The second holder's two places, by perch_030 and perch_119, went behind blossom when the crown was remade.)
// It does nothing of its own while the boat is between the page's s KEEPS[0] and KEEPS[1], until it has stretched.
// Its wings are open from OPEN.stand seconds after it is told (from OPEN.hunch if it stands hunched: the neck comes up first).
const ROOST = 98, STRETCHER = 0, KEEPS = [90, 112], OPEN = { stand: 1.4, hunch: 2.7 }, ROOST_AT = 5;
const CALM_FAR = 1.2;                                         // reduced motion: they leave this many times as far off (see the flush, below)
const TOO_NEAR = 4;                                           // on the wall it lets the boat go by (the page); a boat brought within this of its stone is another matter

/**
 * Where the two that roost stand (plan.js, EGRET_WAYS.roost): on top of the wood by one of the tree's own perches, so
 * many metres along the bough from it. The wood is the tree's own (shared.tree.paths: its limbs and great boughs; and
 * the lesser boughs from the numbers the tree's script wrote beside its model). Nothing is typed in.
 */
async function roostPlaces(ctx, plan, shared) {
  const T = shared.tree, F = shared.frame, defs = EGRET_WAYS.roost;
  const own = (def) => { const at = (T && T.roosts && T.roosts[def.roost]) || F.at(...plan.egrets.roost[def.roost]); return { at: at.clone ? at.clone() : at, heading: Math.PI / 2, name: 'roost_' + (def.roost + 1) + ' (the tree\'s own)', slope: 0, radius: 0 }; };
  if (!T || !T.perches || !T.at) return defs.map(own);
  const wood = (T.paths || []).map((p) => ({ path: p.path, radius: p.radius }));
  try {
    const r = await fetch('assets/models/orchard/oldest_crown.json'), j = r.ok ? await r.json() : null;
    for (const b of (j && j.boughs) || []) wood.push({ path: b.path.map((p) => new THREE.Vector3(p[0] + T.at.x, p[1] + T.at.y, p[2] + T.at.z)), radius: b.path.map((p) => p[3] || 0.06) });
  } catch (err) { /* the limbs alone */ }
  const dev = Q.has('wdroost') ? Q.get('wdroost').split(',').map(Number) : null;      // (developer) &wdroost=29,-1.4,118,1.3: other perches, other distances along
  const devAt = Q.has('wdroostat') ? Q.get('wdroostat').split(',').map((v) => v.split(':')) : null;      // (developer) &wdroostat=s_w:13:45,west:16.5:0: on a named limb of the tree, so many metres from its root, turned so many degrees to its left from the way out along the limb
  const a = new THREE.Vector3(), q = new THREE.Vector3();
  // (third holder) a place on a NAMED limb of the tree (shared.tree.paths: the names are the tree's own), so many metres
  // from the limb's root, on top of the wood; `turn` degrees: 0 it looks out along the limb, 90 across it to its left
  const onLimb = (name, metres, turn) => {
    const w = (T.paths || []).find((p) => p.name === name);
    if (!w || w.path.length < 2 || !(metres > 0)) return null;
    const len = [0]; for (let i = 1; i < w.path.length; i++) len.push(len[i - 1] + w.path[i].distanceTo(w.path[i - 1]));
    if (metres > len[len.length - 1] - 0.3) return null;         // (the limb has been cut back since: the caller falls back)
    let i = 0; while (i < w.path.length - 2 && len[i + 1] < metres) i++;
    const t = (metres - len[i]) / Math.max(1e-6, len[i + 1] - len[i]), r = w.radius[i] + (w.radius[i + 1] - w.radius[i]) * t;
    a.copy(w.path[i + 1]).sub(w.path[i]).normalize(); q.copy(w.path[i]).lerp(w.path[i + 1], t);
    const flat = Math.hypot(a.x, a.z) || 1e-6, slope = Math.atan2(a.y, flat);
    return { at: new THREE.Vector3(q.x, q.y + r / Math.max(0.6, Math.cos(slope)), q.z), heading: Math.atan2(a.x, a.z) + (turn || 0) * Math.PI / 180, name: `${name}, ${metres.toFixed(1)} m from its root`, slope: +(slope * 57.3).toFixed(0), radius: +r.toFixed(2), limb: name, metres };
  };
  return defs.map((def, k) => {
    if (devAt && devAt[k] && devAt[k][0]) { const p = onLimb(devAt[k][0], +devAt[k][1] || 0, +devAt[k][2] || 0); if (p) return p; }
    if (def.limb && !dev) {
      let p = onLimb(def.limb, def.at, def.turn);
      // (the starlings roost on the wood that shows, as these two do, and their module builds first and knows only the
      // tree's own roost_1 and roost_2: where one of its seats lies within 0.6 m of this place, the bird stands up to 0.6 m
      // along the bough from it, between two seats. Asked of the Birds group in the log: 1.3 m clear of these places.)
      const seats = p && shared.cast && shared.cast.birds && shared.cast.birds.roosted && shared.cast.birds.roosted.perches;
      if (seats && seats.length) {
        const clearOf = (c) => { let m = 9; for (const q of seats) { const d = Math.hypot(q.x - c.at.x, q.y - c.at.y, q.z - c.at.z); if (d < m) m = d; } return m; };
        let best = p, bestC = clearOf(p);
        if (bestC < 0.6) for (let o = -0.6; o <= 0.601; o += 0.1) { const c = onLimb(def.limb, def.at + o, def.turn), k = c ? clearOf(c) : 0; if (k > bestC + 0.02) { best = c; bestC = k; } }
        p = best; p.name += ` (the nearest starling's seat ${bestC.toFixed(2)} m off)`;
      }
      if (p) return p;
    }
    const idx = dev && isFinite(dev[k * 2]) ? dev[k * 2] : def.perch, along = dev && isFinite(dev[k * 2 + 1]) ? dev[k * 2 + 1] : def.along, P = T.perches[idx];
    if (!P) return own(def);
    let best = null;
    for (const w of wood) for (let i = 0; i + 1 < w.path.length; i++) {
      a.copy(w.path[i + 1]).sub(w.path[i]); const L2 = a.lengthSq() || 1e-9, t = clamp(q.copy(P).sub(w.path[i]).dot(a) / L2, 0, 1);
      q.copy(w.path[i]).addScaledVector(a, t); const r = w.radius[i] + (w.radius[i + 1] - w.radius[i]) * t, off = Math.abs(q.distanceTo(P) - r);
      if (!best || off < best.off) best = { off, w, i, t };
    }
    if (!best || best.off > 0.4) return { at: P.clone(), heading: Math.PI / 2, name: `perch_${String(idx + 1).padStart(3, '0')} itself (no bough found under it)`, slope: 0, radius: 0 };
    // walk `along` metres along that bough
    const w = best.w, len = [0]; for (let i = 1; i < w.path.length; i++) len.push(len[i - 1] + w.path[i].distanceTo(w.path[i - 1]));
    const s0 = len[best.i] + (len[best.i + 1] - len[best.i]) * best.t, s1 = clamp(s0 + along, 0.15, len[len.length - 1] - 0.15);
    let i = 0; while (i < w.path.length - 2 && len[i + 1] < s1) i++;
    const t = (s1 - len[i]) / Math.max(1e-6, len[i + 1] - len[i]), r = w.radius[i] + (w.radius[i + 1] - w.radius[i]) * t;
    a.copy(w.path[i + 1]).sub(w.path[i]).normalize(); q.copy(w.path[i]).lerp(w.path[i + 1], t);
    const flat = Math.hypot(a.x, a.z) || 1e-6, slope = Math.atan2(a.y, flat), out = Math.sign((q.x - T.at.x) * a.x + (q.z - T.at.z) * a.z) || 1, f = out * def.face;
    return { at: new THREE.Vector3(q.x, q.y + r / Math.max(0.6, Math.cos(slope)), q.z), heading: Math.atan2(a.x * f, a.z * f), name: `${Math.abs(s1 - s0).toFixed(1)} m ${s1 > s0 ? 'out' : 'in'} from perch_${String(idx + 1).padStart(3, '0')}`, slope: +(slope * 57.3).toFixed(0), radius: +r.toFixed(2) };
  });
}

export async function build(ctx, plan, shared) {
  const F = shared.frame, here = shared.here, cast = shared.cast = shared.cast || {};
  const calm = !!ctx.reducedMotion, stay = Q.has('wdstay');
  const log = [], logName = /^[\w-]+\.json$/.test(Q.get('wdlog') || '') ? Q.get('wdlog') : null;
  const note = (...a) => { if (logName) log.push(`${ctx.time.toFixed(2)} ${a.join(' ')}`); };

  // ---------------------------------------------------------------------------------------------- the hour on them
  // Everything of this orchard wears shared.dusk (set.js): the hour on the paint, the orchard's own ramp, the last
  // light, the afterglow's bank. The family takes gouache options for its bird, `extend` among them. Pale paint (all of
  // an egret but its bill and legs) also holds what light is left, exactly as the limewash on the trunks does: the page
  // has the egrets "luminous without blooming", and a bird beside a trunk must be that trunk's white.
  // AND NOTHING ON AN EGRET BLOOMS (the page: the egrets are "luminous without blooming"). shared.dusk holds what the sky
  // lights under the bloom and leaves lamp light out of that, whole; a white bird 4 m from the bow lantern at blue hour
  // was a bird of orange fire with a halo (the second holder's orchard_wd2_near_crop.png, before). So here the whole of
  // the light on the bird, lamps and all, is eased in under the same limit (plan.light.limit), keeping its hue: beside
  // the lantern it is a warm white bird, never a lamp. (&wdhold=0: without, to compare.)
  // (third holder) AND A BIRD OVERHEAD IS NOT A BLUE BIRD. shared.dusk shades what is turned to the water (its `under`),
  // and the family lights a far bird as one touch, turned to the eye: so a bird 10 m up a tree, looked up at, was all
  // underside, a slate blue a step DARKER than the petals round it, and nobody found it. Over open water the water is a
  // second sky: what looks down is lit from below. For the two that roost (`up` 0.75; the low birds 0: their bellies keep
  // their shade) three quarters of that shade is given back before the hold: looked up at, they are the whitest things
  // in the tree, as limewash is the whitest thing at its foot. (&wdup=0: without, to compare.)
  const LIM = plan.light.limit || [0.6, 0.8], holdOn = Q.get('wdhold') !== '0', UP = num('wdup', 0.75);
  const holdsFor = (up) => (shared.blossomSelf ? { uniforms: { uSelf: shared.blossomSelf, uEgretHold: { value: holdOn ? new THREE.Vector2(LIM[0], LIM[1]) : new THREE.Vector2(1e3, 1e3 + 1) }, uEgretUp: { value: up } }, fragmentPars: 'uniform vec3 uSelf; uniform vec2 uEgretHold; uniform float uEgretUp;',
    light: `c += albedo * (vec3(1.0) - uUnder) * (clamp(-N.y * 1.7, 0.0, 1.0) * uEgretUp * duskPale);
      { float egMax = max(c.r, max(c.g, c.b)); if (egMax > uEgretHold.x) c *= (uEgretHold.x + (uEgretHold.y - uEgretHold.x) * (1.0 - exp(-(egMax - uEgretHold.x) / (uEgretHold.y - uEgretHold.x)))) / egMax; }
      glow += uSelf * 0.9 * smoothstep(0.45, 0.8, min(ownColour.r, min(ownColour.g, ownColour.b)));` } : null);
  const dusked = Q.get('wddusk') !== '0' && !!shared.dusk;
  const paintOf = (more, up = 0) => { const holds = holdsFor(up); return { ...(more || {}), ...(dusked ? { extend: holds ? [shared.dusk, holds] : [shared.dusk] } : {}) }; };

  // ---------------------------------------------------------------------------------------------- the places
  // A deck, a stone, the wall's coping: the height a bird stands at is the model's own (found from above, once).
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
  ctx.group.updateMatrixWorld(true);
  const solid = [];
  ctx.group.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh && o.visible && !/^standin:|petal|blossom|spray|crowd:|water|mist|sky|star|firefl|midge|bee/i.test(o.name || '') && o.geometry && o.geometry.attributes.position && !(o.material && o.material.transparent)) solid.push(o); });
  const topAt = (x, z, guess) => {
    ctx.group.localToWorld(from.set(x, guess + 0.9, z));
    ray.set(from, down); ray.near = 0; ray.far = 1.6;
    let best = null;
    for (const o of solid) {
      // (only what stands near: an instanced batch is tested instance by instance by three.js itself)
      const hits = ray.intersectObject(o, false);
      if (hits.length && (!best || hits[0].distance < best.distance)) best = hits[0];
    }
    return best ? { y: guess + 0.9 - best.distance, on: best.object.name || '?' } : null;
  };
  const found = [];
  // A plank walk is two planks with a gap between them, a coping is stones set on edge. So the place is looked for:
  //   'plank'   across the walk (40 cm either way) for the planks' tops; the bird stands on the middle of the plank
  //             nearest the channel (both feet on one board);
  //   others    the highest stone within a hand of the place (its feet do not sink into a stone that stands proud).
  const placeOf = (st) => {
    const p = egretPlace(st);
    if (!st.dry) return { ...p, y: -st.depth, wet: true };
    const th = plan.turned(p.s), rx = Math.cos(th), rz = Math.sin(th);                       // to the right of the reference line
    let x = p.x, z = p.z, y = null, on = null;
    if (st.dry === 'plank') {
      const runs = []; let run = null;
      for (let k = -22; k <= 22; k++) {
        const o = k * 0.02, t = topAt(p.x + rx * o, p.z + rz * o, st.y);
        if (t && run && Math.abs(t.y - run.y) < 0.03) { run.to = o; run.y = t.y; run.sum += t.y; run.n++; } else { if (run) runs.push(run); run = t ? { from: o, to: o, y: t.y, sum: t.y, n: 1, on: t.on } : null; }
      }
      if (run) runs.push(run);
      const boards = runs.filter((r) => r.to - r.from > 0.12).sort((a, c) => (Math.sign(p.d) * (a.from - c.from)));       // the one nearest the channel first
      if (boards.length) { const r = boards[0], o = (r.from + r.to) / 2; x = p.x + rx * o; z = p.z + rz * o; y = r.sum / r.n; on = r.on + ` (a board ${(r.to - r.from + 0.02).toFixed(2)} m wide, ${o.toFixed(2)} m off the walk's middle)`; }
    } else {
      for (const [ox, oz] of [[0, 0], [0.07, 0], [-0.07, 0], [0, 0.07], [0, -0.07], [0.05, 0.05], [-0.05, 0.05], [0.05, -0.05], [-0.05, -0.05]]) { const t = topAt(p.x + ox, p.z + oz, st.y); if (t && (y === null || t.y > y)) { y = t.y; on = t.on; } }
    }
    found.push({ name: st.name, guess: st.y, y: y === null ? null : +y.toFixed(3), on });
    const l = plan.locate(x, z);
    return { ...p, x, z, s: l.s, d: l.d, y: y === null ? st.y : y, wet: false };
  };

  // ---------------------------------------------------------------------------------------------- the birds
  const api = {
    egrets: [], low: [], high: [], roosts: [], staged: false, flushing: !stay, wary: true, onEvent: null, onTouch: null,
    ways: EGRET_WAYS, route: egretRoute, lanes: egretLanes,
  };
  const birds = [];                                            // the low birds, with what this module keeps about each
  const tell = (i, name, bird) => {
    const b = birds[i];
    note('bird', i, name);
    if (!b) return;
    // (what the staging hears with it: whether the place it leaves, or comes down on, is water; from where; to where)
    const from = bird.station, to = b.sent && b.sent.to >= 0 ? b.sent.to : bird.station, at = name === 'land' || name === 'settled' ? to : from;
    const info = { wet: !!(b.places[at] && b.places[at].wet), place: from, to, lane: b.sent ? b.sent.lane : null };
    if (name === 'settled') { b.sent = null; b.steps = b.clock + 20 + b.rnd() * 30; b.minded = false; b.wary = false; b.bird.where = whereOf(b); }
    if (name === 'gone') b.sent = null;
    if (api.onEvent) { try { api.onEvent(name, bird, i, info); } catch (err) { console.error(err); } }
  };
  // What an egret leaves in the petals (the page gives it rings only; the family writes those). Where its feet push off
  // or come down, and where its bill goes in, the petals lying there are parted: a small dark window that closes like
  // every other (a lane written at 1 is shut after nine tenths of plan.water.lane.close seconds).
  const PARTS = { leap: [0.3, 0.8], land: [0.32, 0.85], strike: [0.15, 0.7] }, partOn = Q.get('wdpart') !== '0';
  const touched = (i, x, z, kind, strength) => {
    note('bird', i, 'touch', kind, strength.toFixed(2));
    const part = partOn && strength > 0 && PARTS[kind], tr = ctx.water && ctx.water.trace;
    if (part && tr && tr.inject) tr.inject(x, z, { channel: 'lane', radius: part[0], strength: part[1], soft: 0.7 });
    if (api.onTouch) { try { api.onTouch(x, z, kind, strength, i); } catch (err) { console.error(err); } }
  };
  const whereOf = (b) => ({ place: b.bird.station, name: b.def.stations[b.bird.station] ? b.def.stations[b.bird.station].name : '', wet: !!(b.places[b.bird.station] || {}).wet });
  const lifeOn = Q.get('wdlife') !== '0';

  for (let i = 0; i < EGRET_WAYS.low.length; i++) {
    const def = EGRET_WAYS.low[i], places = def.stations.map(placeOf);
    const bird = await makeWader(ctx, {
      species: 'egret', name: 'egret ' + (i + 1), seed: def.seed, flush: 0, clear: CLEAR, speed: 6.5, height: [1.2, 2.5],
      // (roam 0: the family then never walks by itself and turns on its feet by shuffling where it stands; the stalking
      // steps are given below, one at a time, where they are safe. flush 0: the flush is this module's, with a route)
      stations: places.map((p) => (p.wet ? { position: [p.x, p.y, p.z], depth: -p.y, face: p.heading, roam: 0 } : { position: [p.x, p.y, p.z], dry: true, face: p.heading, roam: 0 })),
      // the page: every 12 to 20 s one of step, strike, preen, alert. The steps are this module's (about two in seven),
      // so the family's own turn comes every 17 to 28 s
      life: lifeOn ? { every: [17, 28], actions: { step: 0, reach: 1, strike: 1, preen: 2, alert: 1, shift: 0.6, stretch: 0 } } : false,
      material: paintOf(),
      onEvent: (name, b) => tell(i, name, b), onTouch: (x, z, kind, strength) => touched(i, x, z, kind, strength),
    });
    const rnd = ctx.rng(4100 + i * 17);
    const b = { i, def, places, bird, rnd, sent: null, clock: 0, tryAt: 0, steps: 14 + rnd() * 30, minded: false, moved: false, wary: false, wall: null };
    birds.push(b); bird.where = whereOf(b);
    api.low.push(bird); api.egrets.push(bird);
  }
  // the two that roost: dry, on the tree's own wood, moving with the bough (the high wood sways: they take its numbers).
  // The second has the family's own life (shift, preen, stretch, and now and then the other way of standing). The first
  // is the one that opens its wings when the starlings come (stretch(), below): the family begins what it is told only
  // when the bird stands idle, and a preen is five seconds long, so this one's life is given from here, the same things
  // as often, and nothing is begun while the boat is where the roost begins (KEEPS): it is then always free for it.
  const high = await roostPlaces(ctx, plan, shared);
  for (let k = 0; k < EGRET_WAYS.roost.length; k++) {
    const def = EGRET_WAYS.roost[k], at = high[k].at;
    const bird = await makeWader(ctx, {
      species: 'egret', name: 'egret ' + (5 + k), seed: def.seed, position: [at.x, at.y, at.z], dry: true, face: high[k].heading, idle: (Q.get('wdidle') || '').split(',')[k] || def.idle || 'hunch', flush: 0,
      life: lifeOn && k !== STRETCHER ? { every: [14, 26], actions: { step: 0, reach: 0, strike: 0, preen: 2, alert: 0, shift: 2, stretch: 0.7, hunch: 0.5 } } : false,
      material: paintOf({ ...(shared.tree && shared.tree.sway ? { sway: shared.tree.sway } : {}), ...(Q.has('wdmark') ? { color: '#ff20e0' } : {}) }, UP),      // (&wdmark=1, developer: the two that roost in a loud colour, to find them in a study picture)
      onEvent: (name, b) => { note('high', k, name); if (api.onEvent) { try { api.onEvent(name, b, 4 + k, { wet: false, place: 0, to: 0 }); } catch (err) { console.error(err); } } },
    });
    bird.where = { place: 0, name: high[k].name, wet: false };
    found.push({ name: 'roost ' + (k + 1) + ': ' + high[k].name, at: (() => { const l = plan.locate(at.x, at.z); return [+l.s.toFixed(2), +l.d.toFixed(2), +at.y.toFixed(2)]; })(), slope: high[k].slope, radius: high[k].radius });
    api.high.push(bird); api.egrets.push(bird); api.roosts.push({ position: at.clone(), name: high[k].name, limb: high[k].limb || null, metres: high[k].metres || 0, heading: high[k].heading });
  }

  // ---------------------------------------------------------------------------------------------- the stand-in goes
  // cast.js: 'standin:egret x6 (and one on the wall for postcard 9)'. It wears the area's shared wood: parted from that
  // material first, or removeStandIn would dispose it under every trunk (as heroes_b.js found).
  if (!Q.has('keepstand')) { ctx.group.traverse((o) => { if (o.name && o.name.startsWith('standin:egret x6')) o.material = null; }); removeStandIn(ctx, /^egret x6/); }

  // ---------------------------------------------------------------------------------------------- where a step is safe
  // A stalking step carries a bird 0.24 m the way it faces, turning it by up to 0.4 rad about the foot that stands (with
  // roam 0 the family turns it toward its place, or, standing exactly on it, toward the realm's +Z). A step is given
  // only when wherever it can end lies inside the bird's ground: within `reach` of its place, clear of its trunk, and
  // at the islet in water between 3 and 30 cm deep.
  const islet = shared.tree && shared.tree.islet;
  const ground = (b, x, z) => {
    const st = b.def.stations[b.bird.station], p = b.places[b.bird.station];
    if (!p || !p.wet) return false;
    if (Math.hypot(x - p.x, z - p.z) > 0.75) return false;
    if (p.tree) { const off = Math.hypot(x - p.tree[0], z - p.tree[1]); if (off < 0.85 || off > 1.8) return false; }      // clear of the trunk, and by its mound (the first bird's two steps at s 40 end 1.7 m from its trunk)
    if (st.shore && islet) { const h = islet.heightAt(x, z); if (h > -0.03 || h < -0.3) return false; }
    return true;
  };
  const canStep = (b, n = 1) => {
    const p = b.places[b.bird.station];
    let x = b.bird.position.x, z = b.bird.position.z, h = b.bird.heading;
    for (let k = 0; k < n; k++) {
      const off = Math.hypot(p.x - x, p.z - z), turn = clamp(wrap((off < 1e-3 ? 0 : Math.atan2(p.x - x, p.z - z)) - h), -0.4, 0.4);
      for (const t of [0, 0.5, 1]) if (!ground(b, x + Math.sin(h + turn * t) * STEP * 1.1, z + Math.cos(h + turn * t) * STEP * 1.1)) return false;
      x += Math.sin(h + turn * 0.6) * STEP; z += Math.cos(h + turn * 0.6) * STEP; h += turn;
    }
    return true;
  };
  const idle = (b) => b.bird.state === 'stand' && b.bird.clip === 'stand' && !b.sent;

  // ---------------------------------------------------------------------------------------------- the ways they fly
  // A flight from one place to another is one of the lanes they share (plan.js). Which: the first whose way keeps 6 m
  // from where the boat will be and 6 m from the stag; failing that, the one that keeps furthest. (The bird and the boat
  // both move: each point of the way is weighed against where the boat, and the stag, will be when the bird is there.)
  const stagOf = () => (cast.stag && cast.stag.position && cast.stag.position.isVector3 ? cast.stag : null);
  const prev = { bx: 0, bz: 0, sx: 0, sz: 0, has: false }, vel = { bx: 0, bz: 0, sx: 0, sz: 0 };
  // WHERE THE STAG WILL BE. He walks a route with corners (down his aisle, half right through two rows, across the
  // avenue), and the left-hand lanes lie on it: LO IS his aisle, LI crosses his diagonal at s 193, LA crosses the place
  // where he comes out into the avenue. Straight on from where he is (the first holder's guess) says nothing of that: a
  // bird sent down LA with the stag "89 m away" passed 7 m behind him ten seconds later, and with other luck would have
  // passed through him. He tells how far along his route he is and where any place on it lies (cast_stag.js: along,
  // speed, pageOf), so each point of a bird's way is weighed against the stretch of HIS way he can have reached by then:
  // from 0.7 of his present pace to 1.3 of it (of a slow wade at least: he may be about to set off) and 2 m.
  // He goes no further than where he drinks (his route runs on 6 m beyond it, to within 4 m of the stile, for a stag
  // whom a boat presses: cast_stag.js): unless he is already past it, the stretch ends at his water.
  const STAG_CLEAR = 6, WAY = 44, _way = { ok: false, v: 0, n: WAY, x: new Float32Array(WAY), z: new Float32Array(WAY) }, _pg = {};
  const stagWay = (stag) => {                                   // his way ahead of him, a metre at a time (once a weighing)
    _way.ok = !!stag && typeof stag.pageOf === 'function' && Number.isFinite(stag.along);
    if (!_way.ok) return;
    _way.v = Math.max(0, +stag.speed || 0);
    const water = stag.places && Number.isFinite(stag.places.drink) ? stag.places.drink : Infinity;
    _way.n = stag.along <= water + 0.75 ? Math.max(1, Math.min(WAY, Math.ceil(water - stag.along) + 1)) : WAY;
    for (let k = 0; k < _way.n; k++) { const pg = stag.pageOf(Math.min(stag.along + k, stag.along <= water + 0.75 ? Math.max(water, stag.along) : Infinity), _pg), p = plan.xz(pg.s, pg.d); _way.x[k] = p[0]; _way.z[k] = p[1]; }
  };
  const stagAway = (stag, x, z, t) => {                         // how near (x, z) is to wherever he can be t seconds from now
    if (!_way.ok) { const ts = Math.min(t, 6); return Math.hypot(x - stag.position.x - vel.sx * ts, z - stag.position.z - vel.sz * ts); }
    const k0 = Math.min(_way.n - 1, Math.floor(_way.v * 0.7 * t)), k1 = Math.min(_way.n - 1, Math.ceil(Math.max(_way.v, 0.8) * 1.3 * t + 2));
    let m = 1e9;
    for (let k = k0; k <= k1; k++) { const q = Math.hypot(x - _way.x[k], z - _way.z[k]); if (q < m) m = q; }
    return m;
  };
  const weigh = (b, to, lane) => {
    const via = egretRoute(b.i, b.bird.station, to, lane); if (!via) return null;
    const boat = ctx.boat, stag = stagOf(), P = b.bird.position;
    let L = 0, px = P.x, pz = P.z, boatMin = 1e9, stagMin = 1e9;
    const end = b.places[to], pts = [...via, [end.x, 0, end.z]];
    let whole = 0; for (const q of pts) { whole += Math.hypot(q[0] - px, q[2] - pz); px = q[0]; pz = q[2]; }
    px = P.x; pz = P.z;
    const look = (x, z, len) => {
      const t = 0.6 + len / 5.8, tb = Math.min(t, 4);
      if (len > 2.5) boatMin = Math.min(boatMin, Math.hypot(x - boat.x - vel.bx * tb, z - boat.z - vel.bz * tb));
      // (where it comes down and will stand it may be a metre nearer his way than where it flies: a bird that stands
      // lets a stag wade by, and the second bird's mound of (138.5, -19) is 6.1 m from his aisle)
      if (stag) stagMin = Math.min(stagMin, stagAway(stag, x, z, t) + (whole - len < 3 ? 1 : 0));
    };
    for (const q of pts) {
      const seg = Math.hypot(q[0] - px, q[2] - pz), n = Math.max(1, Math.ceil(seg / 2));
      for (let k = 1; k <= n; k++) look(px + (q[0] - px) * k / n, pz + (q[2] - pz) * k / n, L + seg * k / n);
      L += seg; px = q[0]; pz = q[2];
    }
    return { lane, via, boat: boatMin, stag: stagMin, score: Math.min(boatMin / 6, stagMin / STAG_CLEAR), length: L };
  };
  /** A way a bird may take without being forced: 4.8 m from where the boat will be, 6 m from wherever the stag can be. */
  const clearWay = (w) => w.score >= 0.8 && w.stag >= STAG_CLEAR;
  const choose = (b, to, lane) => {
    let lanes = lane && egretRoute(b.i, b.bird.station, to, lane) ? [lane] : egretLanes(b.i, b.bird.station, to);
    // (reduced motion: the lane that passes close to the boat is the last to be taken, not the first)
    if (calm && lanes.length > 1) lanes = [...lanes.filter((k) => !CLOSE_LANES.has(k)), ...lanes.filter((k) => CLOSE_LANES.has(k))];
    let best = null, fit = null;
    stagWay(stagOf());
    for (const k of lanes) {
      const w = weigh(b, to, k); if (!w) continue;
      if (w.score >= 1) return w;
      if (clearWay(w) && (!fit || w.score > fit.score)) fit = w;          // not the best of ways, but one it may take unforced
      if (!best || w.score > best.score) best = w;
    }
    return fit || best;
  };
  /** Seconds from the word to the landing for a flight of so many metres (the ride's logs: 27 m 5.65 s, 47 m 8.8 s, 60 m
   *  10.8 s, 84 m 14.5 s; with reduced motion 6.35, 10.2, 12.8 and 17.4 s). */
  const flightTime = (metres) => (calm ? 1.1 + metres / 5.16 : 1.45 + metres / 6.44);
  /** The first of its places after the one it stands on that is CLEAR of the boat; -1: none. */
  const nextClear = (b) => { const boat = ctx.boat; for (let j = b.bird.station + 1; j < b.places.length; j++) if (Math.hypot(b.places[j].x - boat.x, b.places[j].z - boat.z) >= CLEAR) return j; return -1; };
  // (`force`: a flush: it goes now, whatever it is doing and whatever is in its way. Otherwise it goes only from standing
  // still, so that no flight begins in the middle of a preen, and only when its way is clear: the caller asks again.)
  const go = (b, to, o = {}) => {
    if (b.sent || !(b.bird.state === 'stand' || b.bird.state === 'act') || to <= b.bird.station || to >= b.places.length) return false;
    if (!o.force && !idle(b)) return false;
    if (!o.force) { if (b.clock < b.tryAt) return false; b.tryAt = b.clock + 0.2; }      // (asked every frame by whoever waits for a clear way: weighed five times a second)
    const w = choose(b, to, o.lane || Q.get('wdlane'));
    if (!w) return false;
    if (!o.force && !clearWay(w)) return false;                 // the boat or the stag is in its way: not now
    b.sent = { to, lane: w.lane, at: b.clock, length: w.length };
    b.bird.flyTo(to, { via: w.via, wait: o.wait || 0 });
    note('bird', b.i, 'sent to', to, 'by', w.lane, 'boat', w.boat.toFixed(1), 'stag', w.stag > 1e8 ? '-' : w.stag.toFixed(1), 'length', w.length.toFixed(0));
    return true;
  };
  // A bird flushed from its last place of all (the fourth bird's mound, if the boat is taken right up to it and the wall
  // is too near the boat to land on): it goes for good, low down its aisle, over the wall and into the mist.
  const goForGood = (b) => {
    if (b.sent || !(b.bird.state === 'stand' || b.bird.state === 'act')) return false;
    const P = b.bird.position, l = plan.locate(P.x, P.z), side = l.d < 0 ? -1 : 1, at = (s, d, y) => { const p = plan.xz(s, d); return [p[0], y, p[1]]; };
    const via = l.s < 204 ? [at(Math.min(206, l.s + 9), side * 23.5, 1.7), at(214, side * 26, 2.6)] : [at(l.s + 6, l.d + side * 2, 2.6)];
    b.sent = { to: -1, lane: 'away', at: b.clock };
    b.bird.leave({ via, to: at(246, side * 44, 5), speed: 6.5 });
    note('bird', b.i, 'gone for good');
    return true;
  };

  Object.assign(api, {
    whiteTrunk() {
      // (asked while it is doing something else, it does this next: the family keeps what it is told until the bird stands idle)
      const b = birds[0]; life.trunk = true;
      if (!b || b.bird.station !== 0 || b.sent || !(b.bird.state === 'stand' || b.bird.state === 'act')) return false;
      b.bird.do(...(canStep(b, 2) ? ['step', 'step', 'strike'] : canStep(b, 1) ? ['step', 'strike'] : ['strike'])); b.steps = b.clock + 40;
      return true;
    },
    sendOn(i, o = {}) { const b = birds[i]; if (!b) return false; const to = o.to != null ? o.to : b.bird.station + 1; return go(b, to, o); },
    toWall(o = {}) {
      // THE NEAREST BEHIND THE BOAT FIRST, then those further behind, then any that stand ahead of it. (The first holder
      // sent the furthest first: a bird 45 m behind and one 21 m behind, sent 3.6 s apart, then came abreast of the boat
      // in the same second, one behind the other, with the third two seconds after: a fly-past. Nearest first, each has
      // further to come than the one before it and they pass 4 to 5 s apart.) Each goes when its turn has come AND it
      // stands idle AND its way is clear of the boat and the stag (asked every frame).
      // AND NO TWO COME DOWN ON THE WALL TOGETHER: lifted 1.8 s apart from where they stand, three of the four touched
      // down within 1.4 s of one another (within 0.8 s with reduced motion). Each one's turn is put back until its
      // landing falls `apart` seconds from every other's (how long a flight takes: FLIGHT, measured on the ride's log).
      const gap = o.gap != null ? o.gap : 1.8, apart = o.apart != null ? o.apart : 2.5, last = (b) => b.places.length - 1;
      const behind = (b) => { const k = here.s - plan.locate(b.bird.position.x, b.bird.position.z).s; return k >= 0 ? k : 1e3 - k; };
      const lands = birds.filter((b) => b.sent && b.sent.to === last(b) && b.bird.state !== 'gone').map((b) => b.sent.at + flightTime(b.sent.length || 60) - b.clock);
      const list = birds.filter((b) => b.bird.state !== 'gone' && b.bird.station < last(b) && !(b.sent && b.sent.to === last(b))).sort((p, q) => behind(p) - behind(q));
      let turn = -gap;
      list.forEach((b) => {
        const w = choose(b, last(b)), takes = flightTime(w ? w.length : 60);
        let at = turn + gap;
        for (let k = 0; k < 8; k++) { const clash = lands.find((t) => Math.abs(at + takes - t) < apart); if (clash === undefined) break; at = clash + apart - takes + 0.01; }
        lands.push(at + takes); turn = at;
        b.wall = { at: b.clock + at, force: !!o.force };
      });
      return list.length;
    },
    /** Seconds from the word to the open wings for the k-th of the two that roost, as it stands now (1.4 standing, 2.7 hunched; with reduced motion the same). */
    stretchLead(k = STRETCHER) { const h = api.high[k]; return h && (h.clip === 'hunch' || h.clip === 'sink') ? OPEN.hunch : OPEN.stand; },
    stretch(k = STRETCHER) { const h = api.high[k]; if (!h) return false; const lead = api.stretchLead(k); h.do('stretch'); if (k === STRETCHER) hi.stretched = true; return lead; },
    settle(s = here.s) {
      birds.forEach((b, i) => { const j = s >= FOUND[i][1] ? b.places.length - 1 : s >= FOUND[i][0] ? 1 : 0; b.sent = null; b.wall = null; b.moved = j > 0; b.bird.place(j); b.bird.where = whereOf(b); });
      life.trunk = s > 40; life.earlyR = s >= EARLY_R; life.early = s >= EARLY; life.wall = s >= WALLED; life.roost = s >= ROOST ? 0 : -1;
      return api;
    },
  });
  cast.waders = api;

  // ---------------------------------------------------------------------------------------------- developer: lines in the air
  if (Q.has('wdroutes')) {
    const pick = (Q.get('wdroutes') || '').split(':').map(Number), mat = new THREE.LineBasicMaterial({ color: '#ffe060', fog: false });
    for (let i = 0; i < 4; i++) for (const [a, c] of [[0, 1], [1, 2], [0, 2]]) for (const lane of egretLanes(i, a, c)) {
      if (pick.length === 3 && !(pick[0] === i && pick[1] === a && pick[2] === c)) continue;
      const A = birds[i].places[a], Z = birds[i].places[c], via = egretRoute(i, a, c, lane);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(A.x, Math.max(0.3, A.y + 0.5), A.z), ...via.map((p) => new THREE.Vector3(p[0], p[1], p[2])), new THREE.Vector3(Z.x, Math.max(0.3, Z.y + 0.5), Z.z)], false, 'centripetal');
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(via.length * 12)), mat); line.name = 'study: an egret\'s way'; line.frustumCulled = false; ctx.add(line);
    }
  }

  // ---------------------------------------------------------------------------------------------- developer: where a bird could roost
  // &wdprobe=sk_sw,west:4:12  (study only) a row of markers the size of a bird's body standing on a named limb of the
  // oldest tree, one a metre (from 4 m to 12 m from its root): magenta and yellow in turn, every fifth one cyan, so that
  // they can be counted from the root in a picture. What hides a marker would hide a bird.
  if (Q.has('wdprobe') && shared.tree && shared.tree.paths) {
    const geo = new THREE.SphereGeometry(0.2, 10, 8); geo.scale(0.8, 1.6, 0.8);
    const mats = ['#ff20e0', '#ffe020', '#20e8ff'].map((c) => new THREE.MeshBasicMaterial({ color: c, fog: false }));
    for (const item of Q.get('wdprobe').split(',')) {
      const [name, from, to] = item.split(':'), w = shared.tree.paths.find((p) => p.name === name); if (!w) continue;
      const len = [0]; for (let i = 1; i < w.path.length; i++) len.push(len[i - 1] + w.path[i].distanceTo(w.path[i - 1]));
      for (let m = Math.max(1, +from || 1), n = 0; m <= Math.min(len[len.length - 1] - 0.2, +to || 99); m += 1, n++) {
        let i = 0; while (i < w.path.length - 2 && len[i + 1] < m) i++;
        const t = (m - len[i]) / Math.max(1e-6, len[i + 1] - len[i]), r = w.radius[i] + (w.radius[i + 1] - w.radius[i]) * t, p = w.path[i].clone().lerp(w.path[i + 1], t);
        const mk = new THREE.Mesh(geo, mats[Math.round(m) % 5 === 0 ? 2 : n % 2]); mk.position.set(p.x, p.y + r + 0.5, p.z); mk.name = `study: ${name} ${m} m`; ctx.add(mk);
      }
    }
  }

  // ---------------------------------------------------------------------------------------------- every frame
  const life = { first: true, trunk: false, earlyR: false, early: false, wall: false, roost: -1, lastS: 0, told: false, went: false, played: false, logNext: 0, sentLog: false };
  const hi = { clock: 0, next: 5 + ctx.rng(4311)() * 12, rnd: ctx.rng(4312), stretched: false, kept: 0 };      // the stretching rooster's own life (see STRETCHER)
  const devAt = num('wdat', 0.5), devDo = (Q.get('wddo') || '').split(':'), devGo = Q.has('wdgo') ? (Q.get('wdgo') || '0').split(':').map(Number) : null, devPlay = Q.get('wdplay');
  const watch = Q.has('wdwatch') ? num('wdwatch', 0) : -1, fov = num('wdfov', 0), cam = Q.has('wdcam') ? (Q.get('wdcam') || '').split(',').map(Number) : null;
  if (Q.has('wdeye')) { const q = Q.get('wdeye').split(',').map(Number), c = ctx.engine.camera; if (q.length === 3 && q.every(Number.isFinite)) { c.position.set(q[0], q[1], q[2]); ctx.onDispose(() => c.position.set(0, 0, 0)); } }
  if (cam) ctx.onDispose(() => ctx.engine.camera.position.set(0, 0, 0));
  const _eye = new THREE.Vector3(), _b = new THREE.Vector3(), _qc = new THREE.Quaternion();
  const rows = [];

  return {
    update(dt) {
      const boat = ctx.boat, bs = here.s, stag = stagOf();
      // how the boat and the stag are moving (for weighing a way)
      if (dt > 1e-4) {
        if (prev.has) { const k = Math.min(1, dt / 0.4); vel.bx += ((boat.x - prev.bx) / dt - vel.bx) * k; vel.bz += ((boat.z - prev.bz) / dt - vel.bz) * k; if (stag) { vel.sx += ((stag.position.x - prev.sx) / dt - vel.sx) * k; vel.sz += ((stag.position.z - prev.sz) / dt - vel.sz) * k; } }
        prev.bx = boat.x; prev.bz = boat.z; if (stag) { prev.sx = stag.position.x; prev.sz = stag.position.z; } prev.has = true;
      }

      // ---- the first frame: a boat set down part-way finds each bird where it would be
      if (life.first) {
        life.first = false; life.lastS = bs;
        if (bs > 45) api.settle(bs); else { life.trunk = bs > 40; }
        for (const kv of (Q.get('wdset') || '').split(',')) { const [i, j] = kv.split(':').map(Number); if (birds[i] && birds[i].places[j]) { birds[i].bird.place(j); birds[i].moved = j > 0; birds[i].bird.where = whereOf(birds[i]); } }
      }

      // ---- their ordinary life
      for (const b of birds) {
        b.clock += dt;
        const bird = b.bird;
        if (bird.state === 'gone') continue;
        const grounded = bird.state === 'stand' || bird.state === 'act';
        // it leaves when the boat comes too near (the page: 14 m; 10 m while the boat moves slower than 1 m/s), for the
        // first of its places ahead that is 30 m or more from the boat. On the wall it lets the boat pass.
        // Before that, as a heron does: with the boat inside half as far again it stands tall, once, if it was only standing.
        // And it does not leap out of the middle of a preen or a reach (the head is over its shoulder, or the neck is
        // cocked: the family would cross-fade that into the crouch): it finishes, unless the boat comes inside the nearer
        // of the page's two distances first.
        if (api.flushing && grounded && !b.sent && b.def.stations[bird.station].flush !== 0) {
          // (a place may have distances of its own: on the plank walk, 14.3 m from the lane's middle, it lets a boat on the
          // lane go by. Reduced motion: 1.2 times as far. The family's own 1.4 would be 19.6 m, and the first two birds
          // stand 18.5 m from the lane: every calm rider would flush the first in the middle of its two steps at s 44)
          const st = b.def.stations[bird.station], far = st.flush ?? FLUSH, near = st.flushSlow ?? Math.min(FLUSH_SLOW, far);
          const away = Math.hypot(bird.position.x - boat.x, bird.position.z - boat.z), k = calm ? CALM_FAR : 1, slow = (boat.speed ?? 2) < 1;
          const busy = bird.state === 'act' && /^(preen|reach|strike|stretch)/.test(bird.clip);
          if (away < (slow || busy ? near : far) * k) { const j = nextClear(b); if (j > 0) go(b, j, { force: true }); else goForGood(b); }
          // (the first bird does not stand tall before its moment at s 40: the boat on the lane comes inside this distance
          // at s 40.1, a tenth of a metre after the moment's line, and a boat a little to the right of the lane before it:
          // the bird would be standing tall when it is asked to step, and step five seconds late)
          // (and only for a boat that is COMING: one that has gone by is no reason to stand tall. The first bird, its strike
          // done as the boat comes abreast, stood tall for five seconds after it and flew on only at s 63)
          else if (api.wary && !b.wary && !slow && away < far * 1.5 * k && idle(b) && !(b.i === 0 && bird.station === 0 && !life.trunk)
            && (vel.bx * (bird.position.x - boat.x) + vel.bz * (bird.position.z - boat.z)) / Math.max(1, away) > 0.3) { b.wary = true; bird.do('alert'); }
        } else if (api.flushing && grounded && !b.sent && Math.hypot(bird.position.x - boat.x, bird.position.z - boat.z) < TOO_NEAR) {
          // on the wall's top and on the stile it lets the boat go by (the page: a boat in the gap comes no nearer than 5 m).
          // A boat brought right up under its stone is another matter: it goes, over the wall into the mist, and for good
          goForGood(b);
        }
        // its turn to go to the wall
        if (b.wall && grounded && !b.sent && b.clock >= b.wall.at) { if (bird.station >= b.places.length - 1) b.wall = null; else if (go(b, b.places.length - 1, { force: b.wall.force && idle(b), lane: b.wall.lane })) b.wall = null; }
        // a stalking step or two, where there is ground for it
        if (lifeOn && grounded && !b.sent && b.clock >= b.steps && b.places[bird.station].wet) {
          if (idle(b)) { const two = b.rnd() < 0.45; if (two && canStep(b, 2)) bird.do('step', 'step'); else if (canStep(b, 1)) bird.do('step'); b.steps = b.clock + 40 + b.rnd() * 32; }
        }
        // the stag wades by: it stands tall, once
        if (stag && grounded && !b.sent && !b.minded && idle(b) && Math.hypot(bird.position.x - stag.position.x, bird.position.z - stag.position.z) < 9) { b.minded = true; bird.do('alert'); }
      }

      // ---- the one of the two that roost that keeps its stretch for the starlings: its own life, given from here (see STRETCHER)
      const hb = api.high[STRETCHER];
      if (hb && lifeOn && hb.state !== 'gone') {
        hi.clock += dt;
        const there = bs > KEEPS[0] && bs < KEEPS[1] && !hi.stretched;
        hi.kept = there ? hi.kept + dt : 0;
        const kept = there && hi.kept < 40;                     // (a rider who stops there and no roost comes: after 40 s it has its life again)
        if (kept) hi.next = Math.max(hi.next, hi.clock + 3);
        else if (hi.clock >= hi.next && hb.state === 'stand') {
          hi.next = hi.clock + 14 + hi.rnd() * 12;
          const r = hi.rnd() * 5.2;                             // as often as the first: preen 2, shift 2, stretch 0.7, the other way of standing 0.5
          hb.do(r < 2 ? 'preen' : r < 4 ? 'shift' : r < 4.7 ? 'stretch' : hb.clip === 'hunch' ? 'stand' : 'hunch');
        }
      }

      // ---- the page's moments, as they play by themselves until the staging takes them (staged = true)
      if (!api.staged && !stay) {
        if (!life.trunk && bs >= 40) api.whiteTrunk();
        // the roost: one of the two that roost opens both wings 5 s after it begins. Hunched, it brings its neck up first
        // and its wings are open 2.7 s after it is told: so it is told 2.3 s after the boat passes the roost's line
        if (life.roost < 0 && life.lastS < ROOST && bs >= ROOST) life.roost = ctx.time + Math.max(0.1, ROOST_AT - api.stretchLead(STRETCHER));
        if (life.roost > 0 && ctx.time >= life.roost) { life.roost = 0; api.stretch(STRETCHER); }
        // the first and the second bird stand 18 m off the boat's line and are never flushed from it: once the boat is
        // well past, each flies on down its aisle (and is tried again every frame until its way is clear)
        for (let i = 0; i < MOVE_ON.length; i++) { const b = birds[i]; if (!b.moved && b.bird.station === 0 && bs >= MOVE_ON[i] && bs < MOVE_ON[i] + 60 && !b.sent && go(b, nextClear(b))) b.moved = true; }
        // the wall: the second bird first (see EARLY), by its lane down the avenue's edge; the others when the page says
        // (the third first, down the right edge; the second when the third has been APART seconds in the air, or has not gone)
        const b3 = birds[2], b2 = birds[1];
        if (!life.earlyR && bs >= EARLY_R) { life.earlyR = true; if (!calm && bs < EARLY_R + LATE && b3.bird.station === 1 && !b3.sent && b3.bird.state !== 'gone') b3.wall = { at: b3.clock, force: false, lane: 'RA', until: EARLY_R + LATE }; }
        if (b3.wall && b3.wall.until && bs >= b3.wall.until) b3.wall = null;        // (it could not go in time: with the others, at s 184)
        if (!life.early && bs >= EARLY) {
          const pending = !!(b3.wall && b3.wall.until), young = !!(b3.sent && b3.sent.lane === 'RA' && b3.clock - b3.sent.at < APART);
          if (!pending && !young) { life.early = true; if (bs < WALL + 4 && b2.bird.station === 1 && !b2.sent && b2.bird.state !== 'gone') b2.wall = { at: b2.clock, force: false, lane: calm ? null : 'LA' }; }
        }
        if (!life.wall && bs >= WALL) { life.wall = true; api.toWall(); }
      }
      life.lastS = bs;

      // ---- developer: orders, the eye, the log
      if (!life.told && ctx.time >= devAt && devDo.length === 2) { life.told = true; const b = api.egrets[+devDo[0]]; if (b) b.do(devDo[1].split(',')); }
      if (!life.went && ctx.time >= devAt && devGo) { life.went = true; const b = birds[devGo[0] || 0]; if (b) note('wdgo', go(b, devGo.length > 1 ? devGo[1] : b.bird.station + 1, { force: true })); }
      if (!life.played && ctx.time >= devAt && devPlay) { life.played = true; if (devPlay === 'trunk') api.whiteTrunk(); else if (devPlay === 'wall') api.toWall(); else if (devPlay === 'stretch') api.stretch(); else if (devPlay === 'stretch1') api.stretch(1); }
      if (fov) { const c = ctx.engine.camera; if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); } }
      const seen = watch >= 0 ? api.egrets[watch] : cam ? api.egrets[cam[0] || 0] : null;
      if (seen && seen.state !== 'gone') {
        const eng = ctx.engine, c = eng.camera, P = seen.position, mid = 0.55;
        if (cam) {
          const h = seen.heading, fx = Math.sin(h), fz = Math.cos(h), r = cam[1] ?? 6, up = cam[2] ?? 1.2, back = cam[3] ?? 0;
          _eye.set(P.x - fz * r - fx * back, up, P.z + fx * r - fz * back);
          _b.set(P.x - _eye.x, P.y + mid - _eye.y, P.z - _eye.z);
          c.parent.updateWorldMatrix(true, false);
          ctx.group.localToWorld(_eye); c.parent.worldToLocal(c.position.copy(_eye));
          _b.applyQuaternion(c.parent.getWorldQuaternion(_qc).invert());
          const yaw = Math.atan2(-_b.x, -_b.z), pitch = Math.atan2(_b.y, Math.hypot(_b.x, _b.z));
          eng.input.lookYaw = yaw; eng.input.lookPitch = pitch; c.rotation.y = yaw; c.rotation.x = pitch;
        } else {
          const eye = eng.shared.uCameraPos.value; ctx.group.localToWorld(_b.set(P.x, P.y + mid, P.z));
          const dx = _b.x - eye.x, dy = _b.y - eye.y, dz = _b.z - eye.z, yaw = Math.atan2(-dx, -dz) - eng.boat.heading, pitch = Math.atan2(dy, Math.hypot(dx, dz));
          eng.input.lookYaw = yaw; eng.input.lookPitch = pitch; c.rotation.y = yaw; c.rotation.x = pitch;
        }
      }
      if (logName && ctx.time >= life.logNext) {
        life.logNext = ctx.time + 0.5;
        const eye = ctx.engine.shared.uCameraPos.value;
        const sl = stag ? plan.locate(stag.position.x, stag.position.z) : null;
        rows.push([+ctx.time.toFixed(2), +bs.toFixed(1), ...api.egrets.map((e) => { const l = plan.locate(e.position.x, e.position.z); ctx.group.localToWorld(_b.copy(e.position)); return [+l.s.toFixed(2), +l.d.toFixed(2), +e.position.y.toFixed(2), e.state, e.clip, e.station, +Math.hypot(_b.x - eye.x, _b.y + 0.54 - eye.y, _b.z - eye.z).toFixed(1)]; }),
          sl ? [+sl.s.toFixed(1), +sl.d.toFixed(1), +(+stag.along || 0).toFixed(1), +(+stag.speed || 0).toFixed(2)] : null, [+here.d.toFixed(1), +(boat.speed ?? 0).toFixed(2)]]);
        fetch('/__shot/' + logName, { method: 'POST', body: JSON.stringify({ found, log, columns: ['t', 'boat s', 'each bird: s, d, y, state, clip, place, metres from the eye', 'the stag: s, d, metres along his route, m/s', 'the boat: d, m/s'], rows }) }).catch(() => {});
      }
    },
  };
}
