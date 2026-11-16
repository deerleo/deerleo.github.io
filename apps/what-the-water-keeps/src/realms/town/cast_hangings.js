// The town below: the cast, group "Hangings" (stage 3): cloth and weed, the skiffs, vanes and poplar leaves.
// docs/build/town/3-cast-hangings.md is this module's log; docs/art/town.md, section 5, is its brief.
//
// Most of what hangs in the drowned town is the kit's: the washing, the curtains, the awnings, the eaves' weed, the
// poplar leaves and the skiff models (kit_street.js); the weed from the pots and the arrow vane (kit_roofs.js); the
// tower's vane and the weathercock (heroes.js, heroes_b.js). None of those files is touched. What this module does:
//
//   the skiffs   seven kites on their lines. Each is moored UP the current and lies BOW to it: its painter leads
//                forward and down from inside its sharp end to a ring on the basin's quay (a stone on the basin's
//                floor, a ring stone on the head of the up-route wall, or one of the ring stones the model has along
//                the far wall). (Which end is the bow is read from the model's own shape, bowOf below: as the model
//                stands its named stem is its bluff end, and made fast by that the fleet lay tails to the stream.) It
//                sways as an inverted pendulum about that ring (the bolt keeps the painter's length exactly: the
//                line is always taut), 0.6 to 0.8 m either way over 9 to 13 s with a small surge at twice that
//                pace (a moored boat sheers in a slow figure of eight), nosing and leaning into its way, each on a
//                clock of its own, every movement turning about its bolt. The hull answers in it twice: the water
//                the hull pushes aside eases a near skiff a hand or two away as it passes, and two seconds after
//                the hull's wash has reached the water over it, it rolls, slowly, and settles. The painters are the
//                ribbons family's ropes (makeRopes), six-sided, dark, re-fitted every frame, in the town's light
//                (bare: nothing grows on them); the kit's still painters and their stones are hidden and the
//                mooring stones are made again here.
//   cloth        the kit's mesh, paint and places; its SHAPE is this module's, whole (one more gouache extension laid
//                on the kit's material after it was made). Washing HANGS from its line and leans down the town's one
//                current, 41 to 50 degrees from the plumb line at the line and about 30 at its heavier hem (it is
//                told by its hang: laid near level it was flags on a string); it is built from its line outward and
//                keeps its length; one slow wave runs from line to hem (5 to 9 s, 0.2 to 0.5 m at the hem); the
//                water's light shows through it, so both its faces are pale. The answer to the boat: when the hull,
//                under way, has passed within 6 m of a piece that hangs shallower than -6 m, one larger wave runs
//                through it 1.5 s later; and lift(line): the three lines across the street (s 78, 84, 92) rise on
//                the water the hull draws after it to the level of their lines, tops first and hems after, filling
//                from underneath like sails (middles first, edges and corners trailing), their faces turned up to
//                the rider, and sink back through where they hung, once.
//                A curtain is a pleated panel gathered on its rod: it comes out of its window and lies down the
//                current along its wall, its slow wave slower and smaller than a sheet's (it does not flap).
//                A piece the kit pegged where cloth cannot hang (on the raised walk's deck, through its parapet) is
//                not drawn, or is laid as much flatter as clears the stone. cloth.lies says where every piece hangs
//                and how far it reaches, for whoever must keep clear of it.
//   weed         the kit's fringes on eaves and copings are built the same way: each strand streams down the current,
//                a wave running root to tip, dark, never kinked; the hull's passing sends one swell through them, and
//                one hump up each ribbon of the family's weed (kit_roofs.js) from its root to its tip.
//   vanes, leaves   nothing of this module's lies on them: they are looked at and published.
//
// Everything is published in shared.cast.hangings (see the end of build()). Nothing here plays a sound or places a
// cue: the staging calls lift(), wave() and rock() and hangs its sounds on the hooks (onLift, onWave, onRock).
//
// Developer switches (address):
//   &hg=skiffs,cloth,weed     build only these parts (the kit's things then stay as the kit left them)
//   &hglog=skiffs | cloth | curtains | weed | rock | wave | walk | lies | handles     print where things hang (handles:
//                             what shared.cast.hangings holds); for the skiffs also
//                             the painters' lengths and the least room a painter and a hull ever have from one another
//                             over ten minutes of sway; rock, wave: say when the hull's passing rocks each skiff,
//                             sends each wave, lifts each line (with &drift=1); walk: the washing pegged over the
//                             raised walk and what became of each piece; lies: where the sheets lie as they stream
//   &hglog=skiffs&hgfoot=1    print what stands under each mooring ring (a ray cast down on the set's own models)
//   &hgplay=lift | lift0 | lift1 | lift2 | wave | rock     fire a control half a second in, for pictures and strips
//                             (lift: the three lines in turn, 2.5 s apart); several with commas
//   &hgcam=right,up,back      a crane for pictures only: the eye that many metres from the rider's, in the boat's frame
//                             (&yaw and &pitch still turn it): for looking at what hangs under the water from beside it
//   &hglean=1.25&hgdroop=0.28 how the washing lies (radians from the plumb line at its line; how far its hem hangs back)
//   &hgr=0.028&hgc=3a3542&hgpx=2.5   the painters' radius (m), colour and least width (pixels)
import * as THREE from 'three';
import { ensureLight } from './light.js';
import { makeRopes } from '../../engine/life/ropes.js';

const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const ONLY = (Q.get('hg') || '').split(',').filter(Boolean);
const want = (part) => !ONLY.length || ONLY.includes(part);
const LOG = Q.get('hglog') || '';                     // one topic at a time: the shot tool prints eight lines
const PLAY = (Q.get('hgplay') || '').split(',').filter(Boolean);
const TAU = Math.PI * 2, RAD = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const note = (text) => console.error('INVALID_ note (cast_hangings, &hglog): ' + text);

// A damped swing stepped exactly, so that the answer does not depend on the frame rate: x'' + 2 g x' + w^2 (x - rest) = 0.
function springStep(st, k, w, g, rest, dt) {
  const wd = Math.sqrt(Math.max(w * w - g * g, 1e-6)), e = Math.exp(-g * dt), c = Math.cos(wd * dt), s = Math.sin(wd * dt);
  const x = st[k] - rest, v = st[k + 1];
  st[k] = rest + e * (x * c + ((v + g * x) / wd) * s);
  st[k + 1] = e * (v * c - ((w * w * x + g * v) / wd) * s);
}

// One more gouache extension for a gouache material that already exists (someone else's, or a family's that takes
// none): the hooks stay in a gouache shader as comments, so this fills them exactly as makeGouache does, after
// whatever is there. Returns false, and changes nothing, if the material is not gouache or lacks a hook.
const HOOKS_V = ['vertexPars', 'vertexLocal', 'vertexWorld'], HOOKS_F = ['fragmentPars', 'albedo', 'light', 'fog', 'final'];
function wear(material, ex) {
  if (!material || !material.isGouache || typeof material.vertexShader !== 'string') return false;
  for (const h of HOOKS_V) if (ex[h] && !material.vertexShader.includes(`//@${h}`)) return false;
  for (const h of HOOKS_F) if (ex[h] && !material.fragmentShader.includes(`//@${h}`)) return false;
  for (const h of HOOKS_V) if (ex[h]) material.vertexShader = material.vertexShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`);
  for (const h of HOOKS_F) if (ex[h]) material.fragmentShader = material.fragmentShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`);
  if (ex.defines) Object.assign(material.defines || (material.defines = {}), ex.defines);
  if (ex.uniforms) Object.assign(material.uniforms, ex.uniforms);
  material.needsUpdate = true;
  return true;
}

// The hull passing. An item answers once each time the hull, under way, has come within `reach` metres of it (on the
// level) and begins to draw away again; it can answer again when the hull has gone `rearm` metres off.
function makeTracker(n, reach, rearm) {
  const armed = new Uint8Array(n).fill(1), prev = new Float32Array(n).fill(1e12), least = new Float32Array(n).fill(1e12), r2 = reach * reach, a2 = rearm * rearm;
  return {
    /** d2: the square of the hull's distance now; under way: is the boat moving. Returns the nearest it came (metres) when the item should answer now, else -1. */
    step(i, d2, underWay) {
      let out = -1;
      if (armed[i]) {
        if (d2 < r2) { if (d2 < least[i]) least[i] = d2; if (underWay && d2 > prev[i] + 1e-5) { armed[i] = 0; out = Math.sqrt(least[i]); } }
        else if (least[i] < r2 && underWay) { armed[i] = 0; out = Math.sqrt(least[i]); }      // (it crossed the whole reach between two frames)
      } else if (d2 > a2) { armed[i] = 1; least[i] = 1e12; }
      prev[i] = d2;
      return out;
    },
  };
}

// ====================================================================================================== the skiffs
// What each of the seven is, in numbers: how far its painter leans down the current from the plumb line (degrees: a
// kite's line never stands upright), how far off the current's own line it lies, the period of its sway and how far
// it sways either way (metres at the bolt). No two alike; no period a simple share of its neighbour's.
// `move`: metres it hangs from where the kit's own pattern would put it ([down the route, to the right]), so that no
// painter ever comes near another skiff's hull.
const SKIFF = [
  { lean: 13.5, off: 3, period: 9.4, sway: 0.72, move: [0, 0] }, { lean: 20, off: -4, period: 12.6, sway: 0.8, move: [0, 0] }, { lean: 22.5, off: 2, period: 10.7, sway: 0.66, move: [0, 0] },
  { lean: 17, off: -5, period: 11.9, sway: 0.8, move: [0, 0] }, { lean: 14.5, off: -2, period: 9.9, sway: 0.6, move: [0, 0] }, { lean: 21.5, off: 5, period: 13.0, sway: 0.78, move: [0.8, -0.58] },
  { lean: 19, off: 1, period: 11.2, sway: 0.7, move: [0, 0] },
];
const WAKE = 3.2;                                     // metres a second the hull's wash is taken to spread sideways under the water (at the 1.6 of the first holders a skiff 7 m off the track answered six seconds after the hull had gone by, eight metres astern of the rider, where nobody looks: the page's two seconds are kept, the wash reaches it sooner)
const ROCK = 0.28;                                    // radians a skiff rolls either way when a wake at full strength reaches it (a hull left to the current rocks the nearest about half of that)
const STEM = new THREE.Vector3(0, 0.62, 1.87);        // the model's named point "painter": the ring bolt on its stem post, in the model's own ride axes (town_square.py)
// Which end of a skiff is its BOW, read from the model's own shape: the fine end. (town_square.py gives the hull its half
// breadths the wrong way along: the end that carries the stem post and the ring bolt, the model's +Z, is bluff, closing
// from a metre's breadth to the post in a hand's length, and the other end runs out long and sharp. Made fast by the
// model's "stem", as the kit and five holders of this stage had them, all seven lay with their sharp ends DOWN the
// current and their painters on a blunt end with a post: boats moored by the stern, tails to the stream. A boat lies to
// its painter with its sharp end up the current. So the cast works in a frame of its own, bow at +Z, and says where in
// that frame the painter is made fast; `end` is -1 when the model must be turned end for end to stand in it. If the
// model is mended, its own stem and ring bolt are used again, by themselves.)
const bowCache = new Map();
function bowOf(api) {
  if (bowCache.has(api)) return bowCache.get(api);
  const P = []; let zmin = 1e9, zmax = -1e9, out = { end: 1, bolt: STEM.clone() };
  for (const mesh of (api && api.meshes) || []) { const p = mesh.geometry && mesh.geometry.attributes.position; if (p) P.push(p); }
  for (const p of P) for (let i = 0; i < p.count; i++) { const z = p.getZ(i); if (z < zmin) zmin = z; if (z > zmax) zmax = z; }
  if (P.length && zmax > 0.5 && zmin < -0.5) {
    let fore = 0, aft = 0, top = -1e9;                   // the hull's half breadth a fifth of its length from either end; the top of its aft end
    for (const p of P) for (let i = 0; i < p.count; i++) {
      const z = p.getZ(i), x = Math.abs(p.getX(i));
      if (z > 0.72 * zmax && z < 0.9 * zmax) fore = Math.max(fore, x); else if (z < 0.72 * zmin && z > 0.9 * zmin) aft = Math.max(aft, x);
      if (z < zmin + 0.06) top = Math.max(top, p.getY(i));
    }
    if (aft < fore * 0.8 && top > -1e8) out = { end: -1, bolt: new THREE.Vector3(0, top - 0.05, -(zmin + 0.04)) };      // (the painter is made fast inside the sharp end, a hand under the gunwale, where the planks meet)
  }
  bowCache.set(api, out);
  return out;
}

function buildSkiffs(ctx, plan, shared, light, env) {
  const list = shared.kitSkiffs;
  if (!list || !list.length) return null;
  const town = light.town, B = plan.street.basin, rnd = ctx.rng(5151);
  // the basin's own frame, as town_street.py built its quay: ls metres down the route from its middle, ld to the right
  const sm = (B.s0 + B.s1) / 2, dm = (B.d0 + B.d1) / 2, [mx, mz] = town.xz(sm, dm), a0 = town.along(sm), ca = Math.cos(a0), sa = Math.sin(a0);
  const local = (x, z) => [(x - mx) * ca - (z - mz) * sa, (x - mx) * sa + (z - mz) * ca];
  const world = (ls, ld) => [mx + ls * ca + ld * sa, mz - ls * sa + ld * ca];
  const halfS = (B.s1 - B.s0) / 2, halfD = (B.d1 - B.d0) / 2, floor = plan.floorAt(sm) + 0.04, head = plan.floorAt(sm) + 1.1;
  // the town's one slow current (kit_roofs.js makes it for the weed): down the street, a little toward the channel
  let cx, cz;
  { const d = shared.current && shared.current.direction, a = town.along(90);
    const x = d ? d.x : Math.cos(a) - 0.22 * Math.sin(a), z = d ? d.y : -Math.sin(a) - 0.22 * Math.cos(a), l = Math.hypot(x, z) || 1; cx = x / l; cz = z / l; }
  const qx = -cz, qz = cx;                              // across the current, to its right
  const e = new THREE.Euler(), quat = new THREE.Quaternion(), v = new THREE.Vector3();

  const S = list.map((sk, i) => {
    const tune = SKIFF[i % SKIFF.length], [ls0, ld0] = local(sk.at[0], sk.at[2]);
    // Where it hangs. The kit hung the seven over the basin with their painters led back under their own hulls to
    // stones down the current. A thing on a line lies DOWN the current from where it is made fast, so the fleet is
    // drawn 2.5 m down the route (a little closer together along it, a quarter wider apart across it, for room to
    // sway) so that every mooring is inside the basin; none hangs shallower than 3.3 m, so that no painter is longer
    // than the page's 14 m.
    const ls = ls0 * 0.93 + 2.5 + tune.move[0], ld = clamp(ld0 * 1.25 + tune.move[1], -halfD + 1.3, halfD - 1.3), y = Math.min(sk.at[1], -3.3);
    const lean = tune.lean * RAD, off = tune.off * RAD;
    const hx = cx * Math.cos(off) + qx * Math.sin(off), hz = cz * Math.cos(off) + qz * Math.sin(off);      // the way its painter leans, on the level
    // its bearing: the bow is drawn toward its mooring (up the current), a little raised; it heels a little, its open top
    // toward the channel (the kit's own variety between the seven is kept: a part of each one's turn, pitch and heel)
    const yaw = Math.atan2(-hx, -hz) + (sk.rot[1] - (a0 - Math.PI / 2)) * 0.4, pitch = sk.rot[0], roll = -sk.rot[2] * 0.6;
    const bow = bowOf(sk.api), b = bow.bolt.clone().applyQuaternion(quat.setFromEuler(e.set(pitch, yaw, roll, 'YXZ'))), [wx, wz] = world(ls, ld);
    const boltY = y + b.y;
    // its mooring, up the current from the bolt and down: a ring on a stone standing on the basin's floor; or, where
    // that stone would stand in the up-route quay wall, a ring stone on the head of that wall; or, beside the quay's
    // far wall, one of the five ring stones the model already has along that wall's head (town_street.py; the set
    // publishes no points for them: their places are taken from the model's own numbers)
    const stone = 0.92 + 0.2 * rnd();
    let ringY = floor + stone + 0.07, wall = 0;                              // wall: 0 a floor stone, 1 the up-route wall's head, 2 a ring stone of the model
    const run = (boltY - ringY) * Math.tan(lean);
    let M = new THREE.Vector3(wx + b.x - hx * run, ringY, wz + b.z - hz * run);
    const [mls, mld] = local(M.x, M.z);
    if (mls < -halfS + 0.75) {
      wall = 1; ringY = head + 0.26 + 0.07;
      const [x, z] = world(-halfS, clamp(mld, -halfD + 0.6, halfD - 0.6)); M = new THREE.Vector3(x, ringY, z);
    } else if (mld > halfD - 1.3) {
      wall = 2; ringY = plan.floorAt(sm) + 1.34 + 0.07;
      const gap = (2 * halfS - 3) / 4, k = clamp(Math.round((mls + halfS - 1.5) / gap), 0, 4), [x, z] = world(-halfS + 1.5 + k * gap, halfD); M = new THREE.Vector3(x, ringY, z);
    }
    const L = (boltY - ringY) / Math.cos(lean);
    const tint = new THREE.Color('#ffffff'); { const m0 = sk.api.meshes && sk.api.meshes[0]; if (m0 && m0.instanceColor) m0.getColorAt(sk.index, tint); }
    return {
      sk, i, M, L, wall, stone, hx, hz, end: bow.end, boltV: bow.bolt, turned: [0, 0, 0], turn: rnd() * TAU, tilt: [(rnd() - 0.5) * 0.06, (rnd() - 0.5) * 0.06], tone: 0.94 + 0.12 * rnd(),
      a0: Math.sin(lean) * Math.cos(off), b0: Math.sin(lean) * Math.sin(off),          // its lean along the current and across it, as the horizontal parts of a unit vector
      w: TAU / tune.period, ph: rnd() * TAU, ph2: rnd() * TAU, sway: tune.sway, yaw, pitch, roll, tint,
      rock: new Float32Array(6), wr: TAU / (3.3 + 0.8 * rnd()), wp: TAU / (2.5 + 0.5 * rnd()), ws: TAU / (5.2 + 0.9 * rnd()), kicks: [],      // rock: its roll, its nod and how far the wake has shoved it aside (each with its speed)
      bolt: new THREE.Vector3(), pos: new THREE.Vector3(), rot: [pitch, yaw, roll],
    };
  });

  // ---- the painters: the family's ropes, taut (a painter is its own length and never stretches: the bolt rides a
  // sphere about the ring), six-sided, never thinner than two pixels; they wear the town's light
  const pose = (s, t, out, still = false) => {
    // the kite's weave: across the current and back, with a surge along it at twice the pace (a slow figure of eight)
    // (and it does not keep one measure: over a minute or so each one's weave dies to under half and comes back, at its
    // own time, so the seven are never seven metronomes: a moored boat lies nearly quiet for a while and then sheers wide)
    const A = t * s.w + s.ph, wide = 0.72 + 0.28 * Math.sin(0.19 * A + 1.7 * s.ph2);
    const s1 = (0.8 * Math.sin(A) + 0.2 * Math.sin(1.618 * A + s.ph2)) * wide, d1 = (0.8 * Math.cos(A) + 0.324 * Math.cos(1.618 * A + s.ph2)) * wide;
    const s2 = Math.sin(2 * A + 0.9), d2 = Math.cos(2 * A + 0.9), k = still ? 0 : api.sway * env.calm;
    const a = s.a0 + 0.16 * s.sway / s.L * s2 * k, b = s.b0 + (s.sway * s1 * k + (still ? 0 : s.rock[4])) / s.L, up = Math.sqrt(Math.max(1 - a * a - b * b, 0.25));
    out.bolt.set(s.M.x + s.L * (cx * a + qx * b), s.M.y + s.L * up, s.M.z + s.L * (cz * a + qz * b));
    // it noses into its way and leans into it; the wake's rocking is laid over that
    out.rot[0] = s.pitch - 0.022 * d2 * k + s.rock[2];
    out.rot[1] = s.yaw + 0.11 * d1 * k + 0.2 * s.rock[0];
    out.rot[2] = s.roll - 0.05 * d1 * k + s.rock[0];
    v.copy(s.boltV).applyQuaternion(quat.setFromEuler(e.set(out.rot[0], out.rot[1], out.rot[2], 'YXZ')));
    out.pos.copy(out.bolt).sub(v);
    return out;
  };
  const api = {
    count: S.length, sway: 1, ropes: null, stones: null, onRock: null,
    /** Where skiff i is now (the middle of its keel), its ring bolt, its mooring ring; the length of its painter. */
    position: (i, out = new THREE.Vector3()) => out.copy(S[i].pos), bolt: (i, out = new THREE.Vector3()) => out.copy(S[i].bolt),
    mooring: (i, out = new THREE.Vector3()) => out.copy(S[i].M), painter: (i) => S[i].L,
    /** Rock skiff i (or 'all') as a wake does: strength 0..1, after `delay` seconds, from the side `from` [x, z] if given. */
    rock(which = 'all', strength = 1, delay = 0, from = null) {
      for (const s of S) {
        if (which !== 'all' && which !== s.i) continue;
        const side = from ? Math.sign((from[0] - s.pos.x) * qx + (from[1] - s.pos.z) * qz) || 1 : (s.i % 2 ? 1 : -1);
        const k = clamp(strength, 0, 1.5) * env.calm;
        s.kicks.push({ at: ctx.time + delay + (which === 'all' ? 0.35 * ((s.i * 0.618) % 1) * 4 : 0), roll: ROCK * k * side, shove: -0.24 * k * side, over: 0.7, told: false });
      }
      return api;
    },
  };
  for (const s of S) pose(s, ctx.time || 0, s);
  const ropes = makeRopes(ctx, {
    ropes: S.map((s) => ({ from: [s.M.x, s.M.y, s.M.z], to: [s.bolt.x, s.bolt.y, s.bolt.z], length: s.L * 1.0003, idle: 0 })),
    radius: +(Q.get('hgr') || 0.028), color: '#' + (Q.get('hgc') || '3a3542'), sides: 6, segments: 8, wetLine: -1, idle: 0, hull: false, rings: false, fray: false, wind: shared.current || null, minPixels: +(Q.get('hgpx') || 2.5),
  });
  ropes.object.name = 'town-skiff-painters-live';
  ctx.only(ropes.object, 'direct');
  const lit = wear(ropes.material, light.extendFor(0.6));          // (makeRopes takes no material or extend: the town's light is laid on afterwards)
  if (!lit) console.error('INVALID_ note cast_hangings: the painters could not be given the town light (the ropes material is not gouache as expected)');
  api.ropes = ropes;

  // ---- nothing grows on the painters. (The second holder grew short tufts of the family's weed along the upper half of each
  // rope, the third made them fine and dark. At arm's length (skiff 0, three to five metres under the gunwale) they were still
  // seven to nine small green barbs at even steps down a taut line: thorns on a wire, the rungs of a rope ladder; from the
  // composed line a row of ticks. A taut rope is a ruled line and is right as one: the tufts are taken out, with their draw
  // call and their roots moved every frame. Pictures in the log, "Second look, continued (the fourth holder)".)
  // ---- the mooring stones (hiding the kit's still painters hides the kit's): a squared post with a worn cap on the
  // floor, or a ring stone on the up-route wall's head (as the model's own along the far wall), each with an iron ring
  // let into its top; no two alike. A painter made fast to one of the model's ring stones gets its iron ring only.
  { const pos = [], col = [], c0 = new THREE.Color(), c1 = new THREE.Color();
    const tri = (a, b, c, ka, kb, kc) => { pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); col.push(ka.r, ka.g, ka.b, kb.r, kb.g, kb.b, kc.r, kc.g, kc.b); };
    const quad = (a, b, c, d, ka, kb, kc, kd) => { tri(a, b, c, ka, kb, kc); tri(a, c, d, ka, kc, kd); };
    for (const s of S) {
      const top = s.M.y - 0.07, foot = s.wall ? head - 0.02 : floor - 0.04, base = new THREE.Color('#8f879b').multiplyScalar(s.tone), iron = new THREE.Color('#2c2634');
      const lv = s.wall === 2 ? [] : s.wall ? [[foot, 0.2, 0.15, 0.82], [top - 0.05, 0.19, 0.14, 1.0], [top, 0.13, 0.09, 1.1]] : [[foot, 0.2, 0.2, 0.55], [foot + 0.3, 0.185, 0.185, 0.8], [top - 0.09, 0.15, 0.15, 1.0], [top, 0.085, 0.085, 1.12]];
      const rings = lv.map(([yy, wa, wb, k]) => {
        const f = (yy - foot) / Math.max(top - foot, 0.01), ox = s.wall ? 0 : s.tilt[0] * f, oz = s.wall ? 0 : s.tilt[1] * f, tr = s.wall ? a0 : s.turn, cs = Math.cos(tr), sn = Math.sin(tr);
        return { k, p: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, w]) => new THREE.Vector3(s.M.x + ox + (u * wa * cs + w * wb * sn), yy, s.M.z + oz + (-u * wa * sn + w * wb * cs))) };
      });
      for (let r = 0; r + 1 < rings.length; r++) for (let j = 0; j < 4; j++) {
        const A = rings[r], Bq = rings[r + 1], j2 = (j + 1) % 4;
        c0.copy(base).multiplyScalar(A.k); c1.copy(base).multiplyScalar(Bq.k);
        quad(A.p[j], A.p[j2], Bq.p[j2], Bq.p[j], c0.clone(), c0.clone(), c1.clone(), c1.clone());
      }
      if (rings.length) { const T = rings[rings.length - 1]; c1.copy(base).multiplyScalar(T.k); quad(T.p[0], T.p[1], T.p[2], T.p[3], c1.clone(), c1.clone(), c1.clone(), c1.clone()); }
      // the ring: iron, standing in the plane of its painter, its lower third let into the stone
      const R = 0.065, r = 0.012, N = 8, J = 4, ux = s.hx, uz = s.hz, nx = -uz, nz = ux, cyy = s.M.y - R;
      const at = (i, j) => { const a = i / N * TAU, bb = j / J * TAU, rx = Math.cos(a), ry = Math.sin(a), k = R + r * Math.cos(bb);
        return new THREE.Vector3(s.M.x + ux * rx * k + nx * r * Math.sin(bb), cyy + ry * k, s.M.z + uz * rx * k + nz * r * Math.sin(bb)); };
      for (let i = 0; i < N; i++) for (let j = 0; j < J; j++) quad(at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1), iron, iron, iron, iron);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    const stones = new THREE.Mesh(g, light.mat({ color: '#ffffff', vertexColors: true, lit: 0.55, side: THREE.DoubleSide }));
    stones.name = 'town-skiff-moorings'; stones.frustumCulled = false; ctx.add(stones); ctx.only(stones, 'direct');
    api.stones = stones;
  }
  if (shared.kitSkiffPainters) shared.kitSkiffPainters.visible = false;      // the kit's still painters (and its stones): the live ones stand in their place

  // what the kit published stays true for whoever reads it after this module: where each hangs at rest, and its ring
  { const tmp = { bolt: new THREE.Vector3(), pos: new THREE.Vector3(), rot: [0, 0, 0] };
    for (const s of S) { pose(s, 0, tmp, true); s.rest = tmp.pos.clone(); s.sk.at[0] = s.rest.x; s.sk.at[1] = s.rest.y; s.sk.at[2] = s.rest.z; s.sk.ring[0] = s.M.x; s.sk.ring[1] = s.M.y; s.sk.ring[2] = s.M.z; } }
  api.rest = (i, out = new THREE.Vector3()) => out.copy(S[i].rest);
  if (shared.skiffs && shared.skiffs.length === S.length) S.forEach((s, i) => { const o = shared.skiffs[i]; if (o && o.at && o.ring) { o.at[0] = s.rest.x; o.at[1] = s.rest.y; o.at[2] = s.rest.z; o.ring[0] = s.M.x; o.ring[1] = s.M.y; o.ring[2] = s.M.z; } });      // (stage 1's list of the same seven)

  if (LOG === 'skiffs') {
    const sd = (p) => { const q = town.sd(p.x, p.z); return `s ${q.s.toFixed(1)} d ${q.d.toFixed(1)} y ${p.y.toFixed(2)}`; };
    // The least room, over ten minutes of sway, between any painter and any other skiff's hull, and between any two
    // hulls (a hull: its keel line from stem to stern, 0.3 m up, taken 0.7 m thick), and between a painter and a lamp post.
    const segseg = (p1, q1, p2, q2) => {                       // the least distance between two straight pieces
      const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2), a = d1.dot(d1), ee = d2.dot(d2), f = d2.dot(r);
      let sN, tN; const c = d1.dot(r), bb = d1.dot(d2), den = a * ee - bb * bb;
      sN = den > 1e-9 ? clamp((bb * f - c * ee) / den, 0, 1) : 0; tN = (bb * sN + f) / ee;
      if (tN < 0) { tN = 0; sN = clamp(-c / a, 0, 1); } else if (tN > 1) { tN = 1; sN = clamp((bb - c) / a, 0, 1); }
      return p1.clone().addScaledVector(d1, sN).distanceTo(p2.clone().addScaledVector(d2, tN));
    };
    const T = S.map(() => ({ bolt: new THREE.Vector3(), pos: new THREE.Vector3(), rot: [0, 0, 0], bow: new THREE.Vector3(), stern: new THREE.Vector3() }));
    let rope = 1e9, ropeAt = '', hull = 1e9, hullAt = '', lamp = 1e9, lampAt = '';
    for (let t = 0; t < 600; t += 0.37) {
      S.forEach((s2, k) => { const o = T[k]; pose(s2, t, o); quat.setFromEuler(e.set(o.rot[0], o.rot[1], o.rot[2], 'YXZ')); o.bow.set(0, 0.3, 1.8).applyQuaternion(quat).add(o.pos); o.stern.set(0, 0.3, -1.8).applyQuaternion(quat).add(o.pos); });
      for (let i = 0; i < S.length; i++) for (let j = 0; j < S.length; j++) {
        if (i === j) continue;
        const d = segseg(S[i].M, T[i].bolt, T[j].bow, T[j].stern) - 0.7; if (d < rope) { rope = d; ropeAt = `painter ${i}, skiff ${j}, t ${t.toFixed(0)}`; }
        if (j > i) { const h = segseg(T[i].bow, T[i].stern, T[j].bow, T[j].stern) - 1.4; if (h < hull) { hull = h; hullAt = `${i} and ${j}, t ${t.toFixed(0)}`; } }
      }
    }
    const A = new THREE.Vector3(), Bv = new THREE.Vector3();
    for (const s2 of S) for (const l of town.lamps) { A.set(l.x, l.foot, l.z); Bv.set(l.x, l.y + 0.3, l.z); const d = segseg(s2.M, s2.bolt, A, Bv) - 0.35; if (d < lamp) { lamp = d; lampAt = `painter ${s2.i}, lamp s ${l.s.toFixed(0)} d ${l.d.toFixed(0)}`; } }
    if (Q.has('hgfoot')) {
      // what stands under each ring: the first surface of the set straight below it (the stones must stand on the
      // basin's floor or on a wall's head, not in the water and not sunk)
      const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), from = new THREE.Vector3();
      ctx.group.updateMatrixWorld(true); ray.layers.enableAll();          // (things kept out of the mirror are on a layer of their own)
      note('under each ring: ' + S.map((s2) => { from.set(s2.M.x, s2.M.y + 0.5, s2.M.z); ctx.group.localToWorld(from); ray.set(from, down); ray.far = 6;
        const hits = ray.intersectObjects(ctx.group.children, true).filter((h) => h.object !== api.stones && h.object !== ropes.object && h.object.visible);
        return hits.length ? `[${s2.i}] ring y ${s2.M.y.toFixed(2)}, ${hits[0].object.name || hits[0].object.parent.name || 'a mesh'} at y ${(s2.M.y + 0.5 - hits[0].distance).toFixed(2)}` : `[${s2.i}] nothing within 6 m`; }).join('; '));
    }
    for (const s2 of S) note(`skiff ${s2.i} at rest ${sd(s2.rest)}; painter ${s2.L.toFixed(2)} m, ${SKIFF[s2.i % SKIFF.length].lean} deg, to ${['a floor stone', 'the up-route wall head', 'a ring stone of the model'][s2.wall]} at ${sd(s2.M)}`);
    note(`least room in 600 s: painter to hull ${rope.toFixed(2)} m (${ropeAt}); hull to hull ${hull.toFixed(2)} m (${hullAt}); painter to lamp post ${lamp.toFixed(2)} m (${lampAt}); lit by the town: ${lit}`);
  }

  // ---- every frame
  const track = makeTracker(S.length, 18, 22);
  const update = (dt, t, boat, underWay) => {
    for (const s of S) {
      // the hull's wake: it reaches the water over a skiff a moment after the hull has gone by (the further off, the
      // later and the less), and the skiff, some metres down, answers two seconds after that
      if (hangings.answer) {
        const dx = boat.x - s.pos.x, dz = boat.z - s.pos.z, near = track.step(s.i, dx * dx + dz * dz, underWay);
        if (near >= 0) {
          const k = clamp((boat.speed || 0) / 1.5, 0.5, 1) * Math.pow(1 - 0.6 * near / 18, 1.5), side = Math.sign(dx * qx + dz * qz) || 1;      // (a hull left to the current rolls the nearest 11 degrees, the farthest 4)
          // first the water the hull itself pushes aside: a skiff within a few metres of the track gives way a hand or two
          // and heels a little from the hull, at once and slowly (what a rider abeam of it can see as he passes)
          const kp = (1 - smooth(3.5, 9, near)) * clamp((boat.speed || 0) / 1.3, 0.6, 1.2) * env.calm;
          if (kp > 0.02) s.kicks.push({ at: t + 0.3 + near / 6, roll: 0.24 * ROCK * kp * side, shove: -0.22 * kp * side, over: 1.5, told: true });
          // then its wash, and two seconds after that has reached the water over the skiff, the roll
          s.kicks.push({ at: t + near / WAKE + 2.0, roll: ROCK * k * env.calm * side, shove: -0.24 * k * env.calm * side, over: 0.7, told: false });
        }
      }
      // a kick is a push that lasts most of a second (a boat does not start to roll in an instant), mostly into its roll
      for (let q = s.kicks.length - 1; q >= 0; q--) {
        const kk = s.kicks[q], u = (t - kk.at) / kk.over;
        if (u < 0) continue;
        if (u >= 1) { s.kicks.splice(q, 1); continue; }
        if (!kk.told) { kk.told = true; if (api.onRock) api.onRock(s.pos.x, s.pos.z, s.i, Math.abs(kk.roll) / ROCK); }
        const push = (1 - Math.cos(TAU * u)) * dt / kk.over;
        if (kk.roll) { s.rock[1] += kk.roll * s.wr * push; s.rock[3] -= 0.28 * Math.abs(kk.roll) * s.wp * push; }
        s.rock[5] += kk.shove * s.ws * push;      // (it is shoved a hand or two away from the hull's side, and swings back)
      }
      const rocking = Math.abs(s.rock[0]) + Math.abs(s.rock[1]) + Math.abs(s.rock[2]) + Math.abs(s.rock[3]) + Math.abs(s.rock[4]) + Math.abs(s.rock[5]) > 1e-6;
      if (rocking) { springStep(s.rock, 0, s.wr, 1 / 4.5, 0, dt); springStep(s.rock, 2, s.wp, 1 / 3.5, 0, dt); springStep(s.rock, 4, s.ws, 1 / 5, 0, dt); }
      // (the page's cut list, sixth: with skiffs.sway = 0 the fleet hangs still on fixed painters and costs nothing here)
      if (api.sway === 0 && !rocking && !s.kicks.length) { if (s.still) continue; s.still = true; } else s.still = false;
      pose(s, t, s);
      // (the cast's frame has the bow at +Z; a model whose sharp end is its -Z is turned end for end to stand in it:
      // half a turn about the upright, which turns its pitch and its heel about with it)
      if (s.end < 0) { s.turned[0] = -s.rot[0]; s.turned[1] = s.rot[1] + Math.PI; s.turned[2] = -s.rot[2]; }
      s.sk.api.place(s.sk.index, { position: s.pos, rotation: s.end < 0 ? s.turned : s.rot, tint: s.tint });
      ropes.setEnd(s.i, s.bolt.x, s.bolt.y, s.bolt.z);
    }
  };
  let hangings = { answer: true };
  if (LOG === 'rock') api.onRock = (x, z, i, k) => note(`skiff ${i} rocks at t ${ctx.time.toFixed(1)} s, strength ${k.toFixed(2)}, the hull ${Math.hypot(ctx.boat.x - x, ctx.boat.z - z).toFixed(1)} m off at s ${ctx.s.toFixed(0)}`);
  return { api, update, bind(h) { hangings = h; }, play(what) { if (what === 'rock') api.rock('all', 1); } };
}

// ====================================================================================================== cloth
// The washing and the curtains are the kit's mesh, the kit's material, the kit's paint and the kit's places. Their SHAPE
// is this module's, whole: one extension, laid on the kit's material after it was made, builds every piece from its line
// outward, stretch by stretch (each stretch keeps its length: cloth does not stretch), and puts that in the place of
// whatever the kit's own shader made of it. So a piece bends, bellies, trails its hem and turns its faces, instead of
// swinging as a board on a hinge. What it does:
//   - it HANGS, and leans. The town has one slow current (shared.current, down the street): washing hangs from its
//     line and leans down the current, 41 to 50 degrees from the plumb line (LEAN, below), its heavier hem hanging
//     back toward the plumb line and its edges lagging behind its middle. (Hung plumb, every piece was edge-on to one
//     who looked down over the side: a rope with tabs. Laid near level, it was flags on a string.);
//   - one slow wave runs through it from the line to the hem (period 5 to 9 s, a quarter to half a metre at the hem),
//     one side of the cloth leading the other; folds run from the pegs to the hem; the top edge dips between its pegs;
//   - a ring or a wake passing over it rocks it (the engine's ripple field), less the deeper it hangs;
//   - the answer to the boat: one larger wave, begun at the line 1.5 s after the hull has passed within 6 m of a piece
//     that hangs shallower than -6 m, running down to the hem;
//   - lift(line): the pieces of a line rise on the water the hull draws after it, tops first and hems after, to the
//     level of their line (their faces turned up to the rider), and sink back through where they hung, once, slowly;
//   - a curtain is gathered at its head, comes out through its window and lies down the current along its wall, a
//     forearm off it: it can never be inside the wall.
// Nothing of the kit's shader names is used: only the instance's matrix, the sheet's own shape (one wide, hanging from
// y 0 to -1), the engine's ripple field under names of this module's, and this module's attributes:
//   aHg    (it changes) x: when this piece's larger wave begins (the realm's clock), y: how far it swings the cloth
//          (radians at its crest), z, w: the lift of its top and of its hem now (radians: the hem follows the top)
//   aHgB   x: 1 for a curtain, y: how freely it moves (the quilt is stiff), z: its own random number, w: how far it
//          leans from the plumb line at rest (radians, at its line)
//   aHgC   xy: the way it streams, on the level (x, z: down the current; a curtain: out of its window and along its
//          wall), z: the period of its own slow wave (s), w: how far that wave swings it (radians, near the hem)
//   uHg    x: how fast the larger wave runs down cloth and fringes (m/s), y: its length on cloth (m), z: its length on
//          weed (m), w: how fast it runs up the family's weed (m/s)
//   uHgNow x: the realm's clock, y: 1, or 0.5 for a rider who asked for reduced motion
// How washing hangs in the current, left alone (&hglean=, &hgdroop= try others): LEAN radians from the plumb line at its
// line (each piece up to 0.16 more, small light cloths a little more again, the quilt less), and DROOP, the share of
// that its heavier hem hangs back toward the plumb line.
// (The second holder streamed it at 0.9 to 1.1, 52 to 63 degrees; the third at 1.25 to 1.45, 72 to 83 degrees, "as
// cloth lies in half a metre a second". The fifth holder brought it down to 0.72 to 0.88, 41 to 50 degrees at the line
// and about 30 at the hem. Lying near level, all one way, the pieces were FLAGS: pennants flying from a string over the
// side (postcard 4), slivers to a rider coming down the street, and washing only to one who looked back; and a pale
// sheet lying face up under one of the set's floating leaves was a white flag with a red disc. Washing is told by its
// HANG: rectangles of several sizes below a line, with weight. At 41 to 50 degrees a rider sees a face of it from
// every side he can look from (the sine of the two angles: 0.45 coming down the street, 0.45 over the side, 0.95
// looking back), it is unmistakably washing in a slow current, and the lift, which brings it up to the level of its
// line, has something to show.)
const LEAN = +(Q.get('hglean') || 0.72), DROOP = +(Q.get('hgdroop') || 0.3);
const CLOTH_EXT = (U) => ({
  uniforms: U,
  defines: { HG_DROOP: DROOP.toFixed(3) },
  vertexPars: /* glsl */`
    attribute vec4 aHg, aHgB, aHgC; uniform vec4 uHg; uniform vec2 uHgNow; uniform sampler2D tHgRipple; uniform vec4 uHgRippleRect; varying float vHgThru;
    // The cloth's angle from the plumb line (radians, toward the way it streams) at sh (0 at its line .. 1 at its hem)
    // and xh (-0.5 .. 0.5 across it). len: the piece's length (m); rock: what the water over it adds. dx: how the angle
    // changes across the piece (for its normal).
    float hgAngle(float sh, float xh, float len, float rock, out float dx) {
      float cur = aHgB.x, free = aHgB.y, ph = aHgB.z * 6.2831853, now = uHgNow.x;
      // at rest: down the current from its line; the hem (doubled, heavier) hangs lower, the edges lag behind the middle
      // (and a cloth that is lifted fills from underneath like a sail: its middle rises first and highest, its edges and its
      // corners trail, so the lifted hem is an arch and never the ruled end of a board)
      float edge = (mix(0.26, 0.10, cur) + 0.5 * clamp(max(aHg.z, aHg.w), 0.0, 1.2) * (1.0 - cur)) * sh;
      float droop = HG_DROOP * (1.0 - smoothstep(1.0, 1.3, aHgB.w));      // (a piece pegged close over a wall is laid flatter than it would hang, and the flatter it is laid the less its hem hangs back, or it would dip into the stone: hgDroopOf in the script is the same rule)
      float th = aHgB.w * mix(1.0 - droop * sh * sh, 0.25 + 0.75 * smoothstep(0.0, 0.75, sh), cur) - edge * 4.0 * xh * xh;      // (a curtain hangs from its rod and is swept out below it)
      dx = -edge * 8.0 * xh;
      // one slow wave from the line to the hem (2.2 lengths of the piece long: the hem is most of half a period behind
      // the line), growing as it goes, with a slower one under it so that it never repeats; one side leads the other
      float grow = pow(sh, 0.6) * aHgC.w * uHgNow.y * free;
      float a1 = now * 6.2831853 / aHgC.z - sh * 2.856 + ph + xh * 1.4, a2 = now * 6.2831853 / (aHgC.z * 1.64) - sh * 1.848 + ph * 1.7 - xh * 0.9;
      th += grow * (0.72 * sin(a1) + 0.28 * sin(a2));
      dx += grow * (1.008 * cos(a1) - 0.252 * cos(a2));
      // the answer to the boat: one larger wave, begun at the line, running down to the hem (a curtain's is one swell)
      float xi = ((now - aHg.x) * uHg.x - sh * len) / uHg.y;
      if (xi > 0.0 && xi < 1.0) { float sn = sin(3.14159265 * xi); th += aHg.y * free * mix(1.5396 * sin(6.2831853 * xi) * sn * sn, sn * sn, cur); }
      // the lift (its hem a moment after its top), and the water's own rocking
      th += (mix(aHg.z, aHg.w, sh) + rock * sh) * free;
      return clamp(th, -0.5, 2.5);
    }`,
  vertexWorld: /* glsl */`
    vHgThru = 0.0;
    #ifdef USE_INSTANCING
    {
      mat3 hgM = mat3(modelMatrix);
      vec3 hgO = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz, hgT = hgM * instanceMatrix[0].xyz, hgUp = vec3(0.0, 1.0, 0.0);
      float hgWd = length(hgT), hgLen = length(hgM * instanceMatrix[1].xyz); hgT /= hgWd;
      vec3 hgH = normalize(hgM * vec3(aHgC.x, 0.0, aHgC.y) + vec3(0.0, 0.0, 1e-5));
      float hgX = position.x, hgS = clamp(-position.y, 0.0, 1.0), hgCur = aHgB.x;
      // the water over it: a ring or a wake passing rocks whatever hangs under it, less the deeper it hangs
      vec3 hgR = hgO + hgT * (hgX * hgWd);
      vec2 hgUv = (hgR.xz - uHgRippleRect.xy) / uHgRippleRect.zw + 0.5;
      vec4 hgRp = (hgUv.x > 0.0 && hgUv.x < 1.0 && hgUv.y > 0.0 && hgUv.y < 1.0) ? texture2D(tHgRipple, hgUv) : vec4(0.0);
      float hgRock = clamp(dot(hgRp.xy, hgH.xz) * 2.5, -0.6, 0.6) * exp(min(hgO.y, 0.0) / 5.0) * uHgNow.y;
      // built from its line outward: eight stretches to this point, each as long as the last, each leaning as it must
      // (a curtain leaves its window straight out of the wall, clear of the shutters, and only then turns down the current)
      vec3 hgOut = normalize(hgM * instanceMatrix[2].xyz), hgP = vec3(0.0), hgPx = vec3(0.0), hgHs = hgH; float hgTh = 0.0, hgDx = 0.0, hgDs = hgS / 8.0;
      for (int hgI = 0; hgI < 8; hgI++) {
        float hgSi = (float(hgI) + 0.5) * hgDs;
        hgTh = hgAngle(hgSi, hgX, hgLen, hgRock, hgDx);
        if (hgCur > 0.5) hgHs = normalize(mix(hgOut, hgH, smoothstep(0.15, 0.85, hgSi)));
        hgP += (hgHs * sin(hgTh) - hgUp * cos(hgTh)) * hgDs; hgPx += (hgHs * cos(hgTh) + hgUp * sin(hgTh)) * (hgDx * hgDs);
      }
      hgTh = hgAngle(hgS, hgX, hgLen, hgRock, hgDx);
      if (hgCur > 0.5) hgHs = normalize(mix(hgOut, hgH, smoothstep(0.15, 0.85, hgS)));
      // (and its width turns with it, as a ribbon turns a corner: across the way it streams, never along it)
      vec3 hgWv = hgCur > 0.5 ? normalize(cross(hgUp, hgHs)) : hgT;
      vec3 hgDir = hgHs * sin(hgTh) - hgUp * cos(hgTh), hgN0 = normalize(cross(hgDir, hgWv));
      // a curtain is gathered at its head and full by its middle; folds run from the pegs to the hem and deepen as they
      // go; the top edge of washing dips between its pegs; the whole piece wanders a little along its line
      // (a curtain is a PANEL, half as wide again as the kit's strip, gathered to under half of that on its rod and opening
      // evenly to its hem: a fan of stuff. As it stood, a strip of 0.45 m with a neck a hand wide for its first third, it
      // was a necktie, a bottle, a fish's tail. Its gathers are pleats: two to its width, deep at the rod, opening to the hem)
      float hgGa = mix(1.0, mix(0.44, 1.0, smoothstep(0.0, 0.9, hgS)), hgCur), hgWide = mix(1.0, 1.5, hgCur);
      float hgXm = hgX * hgWd * hgWide, hgPh = aHgB.z * 40.0, hgFo = (0.35 + 0.65 * pow(hgS, 1.3)) * mix(1.0, 0.6, hgCur) * (0.4 + 0.6 * aHgB.y);
      float hgFold = (sin(hgXm * 7.5 + hgPh * 3.0) * 0.05 + sin(hgXm * 17.0 + hgPh * 1.3 + hgS * 1.5) * 0.018) * hgFo;
      float hgFoldX = (cos(hgXm * 7.5 + hgPh * 3.0) * 0.375 + cos(hgXm * 17.0 + hgPh * 1.3 + hgS * 1.5) * 0.306) * hgFo;
      { float hgPl = 0.075 * (1.0 - 0.62 * hgS) * hgCur, hgPa = hgX * 12.566 + hgPh * 2.0;
        hgFold += hgPl * sin(hgPa); hgFoldX += hgPl * 12.566 * cos(hgPa) / (hgWd * hgWide); }
      float hgPeg = sin(3.14159265 * (hgWd > 1.0 ? 2.0 : 1.0) * (hgX + 0.5)), hgSag = (1.0 - hgCur) * 0.05 * hgPeg * hgPeg * (1.0 - hgS) * (1.0 - hgS);
      float hgSide = 0.08 * hgLen * pow(hgS, 1.5) * sin(uHgNow.x * 6.2831853 / (aHgC.z * 1.31) + hgPh * 0.6) * uHgNow.y * aHgB.y;
      wp.xyz = hgO + hgWv * (hgXm * hgGa + hgSide) + hgP * hgLen + hgN0 * hgFold + hgDir * hgSag;
      wn = normalize(cross(hgDir, hgWv * hgGa + hgPx * (hgLen / hgWd) + hgN0 * hgFoldX));
      if (aHgB.w < -50.0) wp.xyz = hgO;      // (a piece that hangs where cloth cannot: drawn into one point, so not drawn)
      vHgThru = 1.0 - hgCur;
    }
    #endif`,
  // Washing is thin: the water's light that falls on one face of it shows through on the other. A cloth that hangs has a
  // face that looks up and a face that looks down, and a rider coming down the street sees the one that looks down: in
  // this water's light, which has a top and no side, that face was a dark teal card among the lit fronts ("three lines
  // of PALE washing", the page). It is lit as its other face is, a fifth less. A curtain is heavier stuff and is not.
  // (Nothing of the area's light is named here: the face is only turned before that light looks at it.)
  fragmentPars: 'varying float vHgThru;',
  albedo: 'if (vHgThru > 0.5 && vWPos.y < 0.0 && N.y < 0.0) { N = -N; albedo *= 0.8; }',
});

// The town's one slow current, on the level (kit_roofs.js makes it for the weed: down the street, a little toward the channel).
function currentOf(shared, town) {
  const d = shared.current && shared.current.direction, a = town.along(90);
  const x = d ? d.x : Math.cos(a) - 0.22 * Math.sin(a), z = d ? d.y : -Math.sin(a) - 0.22 * Math.cos(a), l = Math.hypot(x, z) || 1;
  return [x / l, z / l];
}

function buildCloth(ctx, plan, shared, light, U, env) {
  const K = shared.kitCloth;
  if (!K || !K.mesh || !K.mesh.isInstancedMesh || !K.pieces) return null;
  const mesh = K.mesh, geo = mesh.geometry, n = Math.min(mesh.count, K.pieces.length), town = light.town, rnd = ctx.rng(6262);
  const aCloth = geo.attributes.aCloth ? geo.attributes.aCloth.array : null, M4 = new THREE.Matrix4(), [cx, cz] = currentOf(shared, town);
  // ---- what each piece is: where it hangs, which way it faces, how long it is; curtains apart (the kit hangs them
  // last, narrower than any washing); the washing gathered into its lines (pieces in one upright plane, in a row)
  const P = [];
  for (let i = 0; i < n; i++) {
    mesh.getMatrixAt(i, M4); const m = M4.elements, nl = Math.hypot(m[8], m[10]) || 1, pc = K.pieces[i];
    P.push({ i, x: m[12], y: m[13], z: m[14], w: Math.hypot(m[0], m[1], m[2]), h: Math.hypot(m[4], m[5], m[6]), nx: m[8] / nl, nz: m[10] / nl, curtain: pc.w < 0.545,
      free: 1 - (aCloth ? aCloth[i * 4 + 2] : 0), line: -1, waveEnd: -1e9, lift: null, liftAt: -1e9, lean: 1, hx: 0, hz: 1 });
  }
  let lines = [], cur = null;
  for (const p of P) {
    if (p.curtain) { cur = null; continue; }
    const last = cur && cur.pieces[cur.pieces.length - 1];
    const same = last && Math.abs(last.nx * p.nx + last.nz * p.nz) > 0.999 && Math.hypot(p.x - last.x, p.z - last.z) < 7.5 && Math.abs(p.y - last.y) < 1.2 && Math.abs((p.x - last.x) * p.nx + (p.z - last.z) * p.nz) < 0.35;
    if (!same) { cur = { index: 0, pieces: [], s: 0, d: [1e9, -1e9], y: 0, x: 0, z: 0, lifting: -1e9, track: 0 }; lines.push(cur); }
    cur.pieces.push(p);
  }
  // (a line that can be lifted has three pieces or more. A pair on a short line is washing all the same: it streams as
  // washing does and takes the larger wave. It was taken for a pair of curtains, gathered at the head and led out of a
  // window that is not there: the line in the back lane at s 66. Curtains are told by their width alone.)
  lines = lines.filter((l) => l.pieces.length >= 3);
  lines.forEach((l, k) => { l.index = k; for (const p of l.pieces) p.line = k; });
  for (const l of lines) {
    for (const p of l.pieces) { const q = town.sd(p.x, p.z); l.s += q.s / l.pieces.length; l.y += p.y / l.pieces.length; l.x += p.x / l.pieces.length; l.z += p.z / l.pieces.length; l.d[0] = Math.min(l.d[0], q.d); l.d[1] = Math.max(l.d[1], q.d); }
  }
  // the page's three lines across the street
  const street = [78, 84, 92].map((s) => { let best = -1, bd = 2.6; for (const l of lines) { const d = Math.abs(l.s - s); if (l.pieces.length >= 3 && d < bd) { bd = d; best = l.index; } } return best; });
  const isStreet = new Uint8Array(lines.length); street.forEach((k) => { if (k >= 0) isStreet[k] = 1; });

  // ---- how each piece streams, and its own slow wave
  const aHg = new Float32Array(mesh.count * 4), aHgB = new Float32Array(mesh.count * 4), aHgC = new Float32Array(mesh.count * 4);
  for (let i = 0; i < mesh.count; i++) { aHg[i * 4] = -1e4; aHgB.set([0, 1, 0.5, 0], i * 4); aHgC.set([0, 1, 7, 0], i * 4); }
  for (const p of P) {
    const across = p.nx * cx + p.nz * cz;                                        // how squarely the current meets its face
    let period, swing;
    if (p.curtain) {
      // out of its window (the piece's own z looks out of the wall), then down the current along the wall: never into it
      const ax = cx - across * p.nx, az = cz - across * p.nz, out = 0.55 + Math.max(across, 0), hx = ax + out * p.nx, hz = az + out * p.nz, hl = Math.hypot(hx, hz) || 1;
      p.hx = hx / hl; p.hz = hz / hl; p.lean = 1.15 + 0.22 * rnd(); period = 6.5 + 2.5 * rnd(); swing = 0.2 + 0.12 * rnd();      // (the page: one slow wave of 5 to 9 s. A curtain is heavier stuff than a sheet and half its length: at a sheet's swing, in five seconds, the one at s 46 went from hanging to level and back, a metre at its hem: it flapped)
    } else {
      // washing hangs down the current from its line (a line that ran along the current would hang plumb): small light
      // cloths a little further out than sheets and towels, the quilt least; its slow wave swings its hem 0.2 to 0.5 m
      const sg = across >= 0 ? 1 : -1; p.hx = sg * p.nx; p.hz = sg * p.nz;
      p.lean = (LEAN + 0.16 * rnd() + (p.h < 0.9 ? 0.07 : 0)) * smooth(0.1, 0.6, Math.abs(across)) * (0.6 + 0.4 * p.free); period = 5 + 4 * rnd(); swing = 0.32 + 0.2 * rnd();
    }
    p.swing = swing;
    aHgB.set([p.curtain ? 1 : 0, p.free, rnd(), p.lean], p.i * 4); aHgC.set([p.hx, p.hz, period, swing], p.i * 4);
  }
  // (the shader's own arithmetic, for the script: how much of its lean a piece's heavier hem takes back, and how far below
  // its pegs its hem can come: at a corner, where the edges hang back, in the trough of its slow wave)
  const droopOf = (lean) => DROOP * (1 - smooth(1.0, 1.3, lean));
  const angleAt = (p, lean, sh, corner, wave) => clamp(lean * (1 - droopOf(lean) * sh * sh) - (corner ? 0.26 * sh : 0) + wave * p.free * Math.pow(sh, 0.6), -0.5, 2.5);
  const dropOf = (p, lean, swing) => { let y = 0; for (let k = 0; k < 10; k++) y += Math.cos(angleAt(p, lean, (k + 0.5) / 10, true, -swing)); return p.h * y / 10; };
  const reachOf = (p, lean, swing) => { let x = 0; for (let k = 0; k < 10; k++) x += Math.sin(angleAt(p, lean, (k + 0.5) / 10, false, swing)); return p.h * x / 10; };
  // ---- washing that hangs where cloth cannot. The lines that start at the left bank's eaves cross the raised walk on their
  // way out over the street (kit_street.js slings them so; plan.street.walk: its deck a storey above the carriageway, a
  // parapet of 0.9 m along its street edge, things left standing on it: shared.kitProps). A piece pegged over the walk
  // less than a metre above its deck lay ON the deck and through the handcart left there (the line at s 40, under the
  // gunwale, where a rider looks longest), or hung through the parapet's stone. Such a piece is not drawn (it is drawn
  // into one point) and takes no wave and no lift: the line is bare there, as it is for its first metre anyway. A piece
  // pegged higher, whose hem would still dip into the coping or onto the deck, lies level instead (no heavier hem).
  // If the kit raises a line its pieces come back by themselves. (&hglog=walk lists them.)
  { const ST = plan.street, W = ST && ST.walk, out = [];
    if (W) for (const p of P) {
      if (p.curtain) continue;
      const q = town.sd(p.x, p.z);
      if (q.s < ST.s0 - 1 || q.s > ST.s1 + 1 || q.d - p.w / 2 > W.d1 + 0.06 || q.d + p.w / 2 < W.d0) continue;      // clear of the walk and of its parapet
      const top = p.y - (plan.floorAt(q.s) + W.rise), overParapet = q.d + p.w / 2 > W.d1 - 0.34;                       // (how far above the deck it is pegged)
      const prop = (shared.kitProps || []).some((o) => o.s > q.s - 0.5 && o.s < q.s + p.h + 0.5 && Math.abs(o.d - q.d) < p.w / 2 + 0.4);
      let what = '';
      const room = top - (overParapet ? 1.0 : 0.12) - 0.06;                     // how far its hem may come down: to a hand above the coping, or the deck
      if (top < 1.0 || (prop && top < 1.7)) { p.gone = true; aHgB[p.i * 4 + 3] = -99; what = prop && top >= 1.0 ? 'taken out (a thing stands under it)' : 'taken out (pegged under the coping)'; }
      else if (dropOf(p, p.lean, p.swing) > room) {
        // it has come to rest over the stone: laid as much flatter as clears it, its slow wave made small
        let lean = p.lean, swing = Math.min(p.swing, 0.2);
        while (lean < 1.5 && dropOf(p, lean, swing) > room) lean += 0.04;
        if (dropOf(p, lean, swing) > room) swing = 0.08;
        if (dropOf(p, lean, swing) > room) { p.gone = true; aHgB[p.i * 4 + 3] = -99; what = 'taken out (no room to hang)'; }
        else { p.lean = lean; p.swing = swing; aHgB[p.i * 4 + 3] = lean; aHgC[p.i * 4 + 3] = swing; what = `laid flatter, ${(lean / RAD).toFixed(0)} degrees from the plumb line`; }
      }
      if (LOG === 'walk') out.push(`${p.i}: s ${q.s.toFixed(1)} d ${q.d.toFixed(1)}, ${p.w.toFixed(1)} by ${p.h.toFixed(1)}, pegged ${top.toFixed(2)} above the deck${what ? ': ' + what : ''}`);
    }
    if (LOG === 'walk') for (let k = 0; k < out.length; k += 3) note('washing over the raised walk: ' + out.slice(k, k + 3).join(' | '));
  }
  // ---- where each cloth LIES, for whoever must keep clear of it. The kit hung every piece plumb under its pegs and
  // published those places (shared.kitCloth.pieces, which this module leaves as they are); the cast lays the washing down
  // the current, so a sheet lies up to its own length away from where it is pegged. Published as cloth.lies (below): for
  // each piece the middle of it as it streams at rest, its reach down the current, its width, the heights it moves
  // between (its hem at the lowest of its slow wave; its top, or the hem of a lifted line), the way it streams, and
  // whether it is drawn at all.
  const lies = P.map((p) => {
    // (its reach: how far down the current its hem can come, at the crest of its slow wave; its middle: where the middle of it hangs at rest)
    const reach = p.gone ? 0 : p.curtain ? p.h * Math.sin(Math.min(Math.max(p.lean, 0), 1.5)) * 0.7 : reachOf(p, p.lean, p.swing), mid = p.gone ? 0 : p.curtain ? reach : reachOf(p, p.lean, 0);
    return { piece: p.i, x: p.x + p.hx * mid * 0.5, z: p.z + p.hz * mid * 0.5, y: p.y, reach, width: p.curtain ? p.w * 1.5 : p.w, low: p.gone ? p.y : p.y - (p.curtain ? 0.75 * p.h : dropOf(p, p.lean, p.swing)), high: p.y + 0.15,
      lifted: p.y + (p.line >= 0 && isStreet[p.line] ? 0.4 * p.h : 0.15), stream: [p.hx, p.hz], curtain: p.curtain, line: p.line, gone: !!p.gone };
  });
  if (LOG === 'lies') { const big = lies.filter((l) => !l.gone && l.width > 1.2).slice(0, 5); note('where the sheets lie (pegged at -> its middle): ' + big.map((l) => { const pp = P.find((q) => q.i === l.piece), a = town.sd(pp.x, pp.z), b2 = town.sd(l.x, l.z); return `s ${a.s.toFixed(1)} d ${a.d.toFixed(1)} -> s ${b2.s.toFixed(1)} d ${b2.d.toFixed(1)}, y ${l.low.toFixed(1)}..${l.lifted.toFixed(1)}`; }).join(' | ')); }
  const tHg = new THREE.InstancedBufferAttribute(aHg, 4); tHg.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aHg', tHg); geo.setAttribute('aHgB', new THREE.InstancedBufferAttribute(aHgB, 4)); geo.setAttribute('aHgC', new THREE.InstancedBufferAttribute(aHgC, 4));
  if (!wear(mesh.material, CLOTH_EXT(U))) { for (const k of ['aHg', 'aHgB', 'aHgC']) geo.deleteAttribute(k); console.error('INVALID_ note cast_hangings: the washing material is not gouache as expected: the cloth keeps the kit motion only'); return null; }

  const WAVE = +(Q.get('hgwave') || 0.85);               // radians a full wave swings a piece at its crest (washing; a curtain, heavier, half of it)
  const fwd = (boat) => [-Math.sin(boat.heading), -Math.cos(boat.heading)];
  let dirty = false;
  const sendWave = (p, strength, delay, t) => {
    if (p.gone || t < p.waveEnd || t - p.liftAt < 9) return false;             // one wave at a time, and none on top of a lift
    aHg[p.i * 4] = t + delay; aHg[p.i * 4 + 1] = WAVE * (p.curtain ? 0.5 : 1) * clamp(strength, 0, 1.3) * env.calm; dirty = true;
    p.waveEnd = t + delay + (p.h + U.uHg.value.y) / U.uHg.value.x + 0.5;
    if (api.onWave) api.onWave(p.x, p.z, p.i, strength, delay);
    return true;
  };
  const lifting = new Set();
  const api = {
    lines: lines.map((l) => ({ index: l.index, s: l.s, d: l.d, y: l.y, pieces: l.pieces.filter((p) => !p.gone).map((p) => p.i) })), street, pieces: P.length, curtains: P.filter((p) => p.curtain).length, lies,
    auto: true, onWave: null, onLift: null,
    /**
     * Lift a line of washing: every piece rises on the water the hull draws after it, nearest the hull first, tops
     * before hems, to a little above the level of its line, and sinks back.
     * which: 0, 1 or 2 (the page's lines at s 78, 84, 92) or { line: k } (any line of `lines`).
     * opts: amount (1 = all the way), hold (seconds the water holds it up, 1.2), from: [x, z] where the lift starts
     * (default: the hull). Returns the seconds it takes.
     */
    lift(which = 0, opts = {}) {
      const k = typeof which === 'number' ? street[which] : which.line, l = lines[k], t = ctx.time, boat = ctx.boat;
      if (!l) return 0;
      if (t - l.lifting < 9) return Math.max(0, 9 - (t - l.lifting));          // it is in the air already
      l.lifting = t;
      const from = opts.from || [boat.x, boat.z], hold = opts.hold ?? 1.2, amount = (opts.amount ?? 1) * env.calm;
      let longest = 0;
      for (const p of l.pieces) {
        if (p.gone) continue;
        const depth = clamp(1.3 + 0.07 * p.y, 0.7, 1), delay = Math.hypot(p.x - from[0], p.z - from[1]) / 6 + 0.35 * rnd(), T = 2.6 + 0.9 * p.h;
        // (from where it hangs up to the level of its line: its top to 86 degrees from the plumb line, its hem, which comes after,
        // to 102: for a moment the cloth streams level under the keel, its face turned up to the rider, and sinks back)
        p.lift = { t0: t + delay, top: Math.max(0, 1.5 - p.lean) * amount * depth, hem: Math.max(0, 1.78 - (1 - droopOf(p.lean)) * p.lean) * amount * depth, hold, w: TAU / T, lag: 0.25 + 0.3 * p.h, st: p.lift ? p.lift.st : new Float32Array(4) };      // (what is left of an earlier lift is carried on)
        p.liftAt = t;
        lifting.add(p); longest = Math.max(longest, delay + 0.8 + hold + 1.7 + T);
      }
      if (api.onLift) api.onLift(l.x, l.z, k, amount);
      return longest;
    },
    /** How far a line is lifted now, 0 as it hangs to about 1 (the greatest of its pieces): for light and sound that must agree. */
    lifted(which = 0) { const l = lines[typeof which === 'number' ? street[which] : which.line]; let m = 0; if (l) for (const p of l.pieces) if (p.lift) m = Math.max(m, p.lift.st[0] / Math.max(p.lift.top, 1e-3)); return m; },
    /** One larger wave through piece i, 'all', or everything within { near: [x, z], radius }: strength 0..1, after `delay` seconds. */
    wave(which = 'all', strength = 1, delay = 0) {
      const t = ctx.time; let sent = 0;
      for (const p of P) {
        if (typeof which === 'number' ? p.i !== which : (which !== 'all' && Math.hypot(p.x - which.near[0], p.z - which.near[1]) > which.radius)) continue;
        if (sendWave(p, strength, delay + (typeof which === 'number' ? 0 : 0.4 * rnd()), t)) sent++;
      }
      return sent;
    },
  };
  if (LOG === 'cloth') {
    note(`cloth: ${P.length} pieces, ${api.curtains} curtains, ${lines.length} lines; the street's three: ${street.join(', ')}; the current runs to (${cx.toFixed(2)}, ${cz.toFixed(2)})`);
    for (let k = 0; k < lines.length; k += 2) note(lines.slice(k, k + 2).map((l) => `line ${l.index}: s ${l.s.toFixed(1)} d ${l.d[0].toFixed(1)}..${l.d[1].toFixed(1)}, tops y ` + l.pieces.map((p) => p.y.toFixed(1)).join(' ') + ', lengths ' + l.pieces.map((p) => p.h.toFixed(1)).join(' ') + ', lean ' + l.pieces.map((p) => (p.lean / RAD).toFixed(0)).join(' ')).join(' || '));
  }
  if (LOG === 'curtains') {
    const cs = P.filter((p) => p.curtain).map((p) => { const q = town.sd(p.x, p.z); return `${q.s.toFixed(0)}/${q.d.toFixed(1)}/${p.y.toFixed(1)}`; });
    for (let k = 0; k < cs.length; k += 8) note('curtains (s/d/y of the head): ' + cs.slice(k, k + 8).join('  '));
  }

  const track = makeTracker(P.length, 6, 8.5);
  let hangings = { answer: true };
  const bump = (x, hold) => (x <= 0 ? 0 : smooth(0, 0.8, x) * (1 - smooth(0.8 + hold, 2.5 + hold, x)));
  const update = (dt, t, boat, underWay) => {
    if (hangings.answer) {
      const sp = boat.speed || 0;
      // the hull over one of the street's three lines lifts it (the page's washing street): as it comes over, not after
      if (api.auto) for (const k of street) {
        if (k < 0) continue; const l = lines[k]; let d2 = 1e12;
        for (const p of l.pieces) { const dx = boat.x - p.x, dz = boat.z - p.z; d2 = Math.min(d2, dx * dx + dz * dz); }
        // (the tracker answers as the hull draws away; a line is lifted as the hull ARRIVES within its reach, so it is asked the other way round)
        if (d2 < 25 && underWay && !l.track) { l.track = 1; api.lift({ line: k }, { amount: clamp(sp / 1.4, 0.7, 1) }); } else if (d2 > 100) l.track = 0;      // (5 m off: at the current's pace the tops are up as the hull comes over, the hems as it leaves)
      }
      for (const p of P) {
        if (p.y < -6 || p.gone) continue;                                     // deeper than the page's 6 m: the hull does not reach it
        const dx = boat.x - p.x, dz = boat.z - p.z, near = track.step(p.i, dx * dx + dz * dz, underWay);
        if (near < 0 || (api.auto && p.line >= 0 && isStreet[p.line])) continue;
        // (it reaches the pieces under the hull's track first and runs out along the line: no two begin together)
        // (the page: one LARGER wave. A hull left to the current, 1.7 m/s, is the usual hull: it sends a wave of 0.5 to 0.7, which
        // swings a sheet 0.4 to 0.6 radian, where its own slow wave swings it 0.3 to 0.5; as it stood, 0.25 to 0.3, it was the smaller of the two)
        sendWave(p, clamp(sp / 1.7, 0.6, 1) * (1 - 0.45 * near / 6) * clamp(1.3 + 0.1 * p.y, 0.7, 1), 1.5 + 0.25 * near + 0.25 * rnd(), t);
      }
    }
    if (lifting.size) {
      for (const p of lifting) {
        const L = p.lift, x = t - L.t0, g = (p.curtain ? 1 : 0.5) * L.w;
        springStep(L.st, 0, L.w, g, L.top * bump(x, L.hold), dt);
        springStep(L.st, 2, L.w * 0.85, g * 0.85, L.hem * bump(x - L.lag, L.hold), dt);
        aHg[p.i * 4 + 2] = L.st[0]; aHg[p.i * 4 + 3] = L.st[2];
        if (x > 2.5 + L.hold + L.lag && Math.abs(L.st[0]) + Math.abs(L.st[1]) + Math.abs(L.st[2]) + Math.abs(L.st[3]) < 2e-3) { aHg[p.i * 4 + 2] = 0; aHg[p.i * 4 + 3] = 0; p.lift = null; lifting.delete(p); }
      }
      dirty = true;
    }
    if (dirty) { tHg.needsUpdate = true; dirty = false; }
  };
  return { api, update, bind(h) { hangings = h; },
    play(what) {
      const b = ctx.boat;
      if (what === 'wave') api.wave({ near: [b.x, b.z], radius: 16 }, 1, 0);
      else if (what === 'lift') [0, 1, 2].forEach((k) => ctx.stage.after(k * 2.5, () => { const l = lines[street[k]]; if (l) api.lift(k, { from: [l.x, l.z] }); }));
      else if (/^lift[012]$/.test(what)) { const k = +what.slice(4), l = lines[street[k]]; if (l) api.lift(k, { from: [l.x, l.z] }); }
    } };
}

// ====================================================================================================== weed
// The fringes of weed on eaves and copings (kit_street.js: six tapering ribbons side by side, about a metre long). The
// kit hung them plumb, as wet hair hangs in air; weed in water does not hang, it streams. As with the cloth, the kit's
// mesh, material, paint and places stay and the SHAPE is this module's: every ribbon is built from its root outward,
// stretch by stretch, lying down the town's current along its eaves (a little out from the wall, never into it), rising
// a little toward its tip, a wave running through it from root to tip (2.6 to 4 s: short weed is quick) that snakes it
// from side to side as well as up and down, rolling on its own length so that it shows a face and then an edge. Weed
// never leaves the water: what would rise through the surface lies along under it.
//   aHgV   (a point of the fringe's own shape) x: where its ribbon's middle is, across the fringe; y: how far this
//          point stands from that middle (its half width, signed); z: the ribbon's whole length (model units)
//   aHgW   (it changes) x: when this fringe's larger wave begins, y: how far it lifts the weed (radians at its crest)
//   aHgF   xy: the way it streams, level (x, z); z: its own random number; w: the period of its wave (s)
const FRINGE_EXT = (U) => ({
  uniforms: U,
  vertexPars: /* glsl */`
    attribute vec3 aHgV; attribute vec2 aHgW; attribute vec4 aHgF; uniform vec4 uHg; uniform vec2 uHgNow; uniform sampler2D tHgRipple; uniform vec4 uHgRippleRect;
    // a ribbon of weed at sh (0 at its root .. 1 at its tip): its angle from the plumb line, and how far it is turned aside
    vec2 hgWeed(float sh, float len, float ph, vec2 rock) {
      float now = uHgNow.x, w = 6.2831853 / aHgF.w, grow = sh * uHgNow.y;
      // (a strand is only five stretches long: with most of a wave lying along it, as it was, each joint turned up to 40
      // degrees and a strand was drawn as a zigzag. No more than a third of a wave lies along a strand now: it bends, it
      // is never kinked; the wave still runs from root to tip)
      float th = 1.0 + 0.42 * sh + 0.26 * grow * sin(now * w - sh * 2.1 + ph) + 0.10 * grow * sin(now * w * 0.47 - sh * 1.2 + ph * 1.7);
      float ps = 0.26 * grow * sin(now * w * 0.73 - sh * 2.3 + ph * 2.3) + 0.09 * grow * sin(now * w * 1.31 - sh * 2.9 + ph * 0.7);
      float xi = ((now - aHgW.x) * uHg.x - sh * len) / uHg.z;
      if (xi > 0.0 && xi < 1.0) { float sn = sin(3.14159265 * xi); th += aHgW.y * sn * sn; ps += 0.6 * aHgW.y * sn * sn * sin(ph * 5.0); }
      return vec2(th + rock.x * sh, ps + rock.y * sh);
    }`,
  vertexWorld: /* glsl */`
    #ifdef USE_INSTANCING
    {
      mat3 hgM = mat3(modelMatrix);
      vec3 hgO = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz, hgT = hgM * instanceMatrix[0].xyz, hgUp = vec3(0.0, 1.0, 0.0);
      float hgSx = length(hgT), hgSy = length(hgM * instanceMatrix[1].xyz); hgT /= hgSx;
      vec3 hgH = normalize(hgM * vec3(aHgF.x, 0.0, aHgF.y) + vec3(0.0, 0.0, 1e-5)), hgQ = normalize(cross(hgUp, hgH));
      float hgLen = max(aHgV.z * hgSy, 0.05), hgS = clamp(uv.y * hgSy / hgLen, 0.0, 1.0), hgPh = aHgF.z * 6.2831853 + aHgV.x * 9.0;
      vec3 hgRoot = hgO + hgT * (aHgV.x * hgSx) + (hgM * instanceMatrix[2].xyz) * position.z;
      // the water over it rocks it (the engine's ripple field), less the deeper it grows
      vec2 hgUv = (hgRoot.xz - uHgRippleRect.xy) / uHgRippleRect.zw + 0.5;
      vec4 hgRp = (hgUv.x > 0.0 && hgUv.x < 1.0 && hgUv.y > 0.0 && hgUv.y < 1.0) ? texture2D(tHgRipple, hgUv) : vec4(0.0);
      vec2 hgRock = clamp(vec2(dot(hgRp.xy, hgH.xz), dot(hgRp.xy, hgQ.xz)) * 3.0, -0.7, 0.7) * exp(min(hgO.y, 0.0) / 5.0) * uHgNow.y;
      vec3 hgP = vec3(0.0); vec2 hgA = vec2(0.0); float hgDs = hgS / 5.0;
      for (int hgI = 0; hgI < 5; hgI++) {
        hgA = hgWeed((float(hgI) + 0.5) * hgDs, hgLen, hgPh, hgRock);
        hgP += ((hgH * cos(hgA.y) + hgQ * sin(hgA.y)) * sin(hgA.x) - hgUp * cos(hgA.x)) * hgDs;
      }
      hgA = hgWeed(hgS, hgLen, hgPh, hgRock);
      vec3 hgDir = (hgH * cos(hgA.y) + hgQ * sin(hgA.y)) * sin(hgA.x) - hgUp * cos(hgA.x);
      // it lies face up and rolls on its own length
      vec3 hgWv = normalize(cross(hgDir, hgUp) + vec3(1e-5, 0.0, 0.0)), hgNv = cross(hgWv, hgDir);
      float hgTw = 0.7 * sin(hgPh * 1.3 + hgS * 2.4 + uHgNow.x * 0.4) * (0.3 + 0.7 * hgS);
      vec3 hgW2 = hgWv * cos(hgTw) + hgNv * sin(hgTw);
      wp.xyz = hgRoot + hgP * hgLen + hgW2 * (aHgV.y * hgSx);
      wp.y = min(wp.y, -0.03);
      // (weed is a thread, not a strip of paper: lying face up a hand under the surface every strand took the water's
      // whole top-light and its nets, and the fringe was the palest thing in its picture, a handful of straws. It is
      // shaded as the round thing it stands for: by its side, with only a little of what falls on it from above)
      wn = normalize(hgW2 + cross(hgDir, hgW2) * 0.22);
    }
    #endif`,
});

// The family's weed (kit_roofs.js): one hump that travels from a ribbon's root to its tip, laid on the family's own
// material after it. Only this module's attributes and the ribbon's own shape (0 at its root to 1 at its tip) are used.
//   aHgR   x: when this ribbon's wave begins, y: how far it is thrown aside at its crest (metres), zw: which way (x, z)
//   aHgL   its length (metres)
const RIBBON_EXT = (U) => ({
  uniforms: U,
  vertexPars: 'attribute vec4 aHgR; attribute float aHgL; uniform vec4 uHg; uniform vec2 uHgNow;',
  vertexWorld: /* glsl */`
    {
      float hgX = ((uHgNow.x - aHgR.x) * uHg.w - position.y * aHgL) / (uHg.z * 2.2);      // (a long low hump, 2.4 m: at 1.1 m it ran up the weed as a knee)
      if (hgX > 0.0 && hgX < 1.0) { float hgB = sin(3.14159265 * hgX); wp.xz += aHgR.zw * (aHgR.y * hgB * hgB * smoothstep(0.0, 0.3, position.y)); }
    }`,
});

function buildWeed(ctx, plan, shared, light, U, env) {
  const rnd = ctx.rng(7373), systems = [];
  let hangings = { answer: true };
  const api = { fringes: 0, ribbons: 0, onWave: null,
    /** One larger wave through all the weed within { near: [x, z], radius } (or 'all'): strength 0..1, after `delay` seconds. */
    wave(which = 'all', strength = 1, delay = 0) { let sent = 0; for (const sys of systems) sent += sys.wave(which, strength, delay); return sent; } };

  // ---- the fringes on eaves and copings
  const F = shared.kitFringe;
  if (F && F.mesh && F.mesh.isInstancedMesh) {
    const mesh = F.mesh, geo = mesh.geometry, n = mesh.count, a = new Float32Array(n * 2), aF = new Float32Array(n * 4), M4 = new THREE.Matrix4(), items = [], [cx, cz] = currentOf(shared, light.town);
    // the fringe's own shape, read once: its points come in pairs (the two edges of a ribbon at one place along it), ribbon
    // after ribbon, each beginning where the distance along it is 0 (kit_street.js, "weed on the eaves")
    const pos = geo.attributes.position, uv = geo.attributes.uv, nv = pos ? pos.count : 0, aV = new Float32Array(nv * 3);
    let shaped = !!(pos && uv) && nv % 2 === 0 && nv > 3;
    for (let i = 0, start = 0; shaped && i < nv; i += 2) {
      if (Math.abs(uv.getY(i) - uv.getY(i + 1)) > 1e-4 || uv.getX(i) === uv.getX(i + 1)) { shaped = false; break; }
      if (uv.getY(i) < 1e-5) start = i;
      const mid = (pos.getX(i) + pos.getX(i + 1)) / 2;
      aV.set([mid, pos.getX(i) - mid, 0], i * 3); aV.set([mid, pos.getX(i + 1) - mid, 0], i * 3 + 3);
      for (let k = start; k <= i + 1; k++) aV[k * 3 + 2] = Math.max(aV[k * 3 + 2], uv.getY(i));      // (the ribbon's length: the farthest of its points, written back over the whole ribbon as it grows)
      if (i + 2 >= nv || uv.getY(i + 2) < 1e-5) for (let k = start; k <= i + 1; k++) aV[k * 3 + 2] = uv.getY(i);
    }
    for (let i = 0; i < n; i++) {
      a[i * 2] = -1e4; mesh.getMatrixAt(i, M4); const m = M4.elements, nl = Math.hypot(m[8], m[10]) || 1, ox = m[8] / nl, oz = m[10] / nl, tl = Math.hypot(m[0], m[2]) || 1;
      items.push({ x: m[12], y: m[13], z: m[14], len: Math.hypot(m[4], m[5], m[6]), end: -1e9 });
      // down the current along its eaves or its wall (the fringe's own z looks out from it): never into it, a little out
      const across = ox * cx + oz * cz; let ax = cx - across * ox, az = cz - across * oz;
      if (Math.hypot(ax, az) < 0.3) { ax = m[0] / tl * 0.6; az = m[2] / tl * 0.6; }                  // (the current meets this face squarely: the weed lies along it)
      const out = 0.25 + Math.max(across, 0), hx = ax + out * ox, hz = az + out * oz, hl = Math.hypot(hx, hz) || 1;
      aF.set([hx / hl, hz / hl, rnd(), 2.6 + 1.4 * rnd()], i * 4);
    }
    const attr = new THREE.InstancedBufferAttribute(a, 2); attr.setUsage(THREE.DynamicDrawUsage);
    if (shaped) { geo.setAttribute('aHgW', attr); geo.setAttribute('aHgF', new THREE.InstancedBufferAttribute(aF, 4)); geo.setAttribute('aHgV', new THREE.BufferAttribute(aV, 3)); }
    if (shaped && wear(mesh.material, FRINGE_EXT(U))) {
      const track = makeTracker(n, 6, 8.5);
      const send = (i, strength, delay, t) => {
        const it = items[i]; if (t < it.end) return 0;
        a[i * 2] = t + delay; a[i * 2 + 1] = 0.7 * clamp(strength, 0, 1.3) * env.calm; attr.needsUpdate = true;
        it.end = t + delay + (it.len + U.uHg.value.z) / U.uHg.value.x + 0.5;
        if (api.onWave) api.onWave(it.x, it.z, 'fringe', strength, delay);
        return 1;
      };
      systems.push({
        update(dt, t, boat, underWay) {
          if (!hangings.answer) return;
          for (let i = 0; i < n; i++) { const it = items[i]; if (it.y < -6) continue; const dx = boat.x - it.x, dz = boat.z - it.z, near = track.step(i, dx * dx + dz * dz, underWay);
            if (near >= 0) send(i, clamp((boat.speed || 0) / 2.2, 0.45, 1) * (1 - 0.45 * near / 6), 1.5 + 0.25 * near + 0.25 * rnd(), t); }
        },
        wave(which, strength, delay) { const t = ctx.time; let k = 0; for (let i = 0; i < n; i++) { const it = items[i]; if (which !== 'all' && Math.hypot(it.x - which.near[0], it.z - which.near[1]) > which.radius) continue; k += send(i, strength, delay + 0.4 * rnd(), t); } return k; },
      });
      api.fringes = n;
    } else { for (const k of ['aHgW', 'aHgF', 'aHgV']) if (geo.attributes[k]) geo.deleteAttribute(k); console.error('INVALID_ note cast_hangings: the fringes are not shaped or dressed as expected (kit_street.js, weed on the eaves): they keep the kit motion only'); }
  }

  // ---- the family's weed (kit_roofs.js: long weed from the pots, short weed on eaves and gutters): one hump runs up
  // each ribbon from its root to its tip, thrown aside away from the hull, each a little its own way and at its own
  // moment (the family has no control that sends one wave through one ribbon: see the log, "Asked of the toolkit")
  const W = shared.kitRoofWeed;
  for (const h of W ? [W.smoke, W.fringe] : []) {
    const g = h && h.object && h.object.geometry, A = g && g.attributes.aAnchor, D = g && g.attributes.aDir;
    if (!h || !A || !h.material) continue;
    const n = A.count, aR = new Float32Array(n * 4), aL = new Float32Array(n), end = new Float32Array(n).fill(-1e9), track = makeTracker(n, 6, 8.5);
    for (let i = 0; i < n; i++) { aR[i * 4] = -1e4; aL[i] = D ? D.array[i * 4 + 3] : 1; }
    const attr = new THREE.InstancedBufferAttribute(aR, 4); attr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aHgR', attr); g.setAttribute('aHgL', new THREE.InstancedBufferAttribute(aL, 1));
    if (!wear(h.material, RIBBON_EXT(U))) { g.deleteAttribute('aHgR'); g.deleteAttribute('aHgL'); console.error('INVALID_ note cast_hangings: the weed material is not gouache as expected: the weed keeps the family motion only'); continue; }
    const send = (i, strength, delay, t, fx, fz) => {
      if (t < end[i]) return 0;
      // away from where the hull is (or from the middle of what was asked), turned a little its own way
      let dx = A.array[i * 3] - fx, dz = A.array[i * 3 + 2] - fz; const dl = Math.hypot(dx, dz) || 1, turn = (rnd() - 0.5) * 1.2, c = Math.cos(turn), sn = Math.sin(turn);
      dx /= dl; dz /= dl;
      aR[i * 4] = t + delay; aR[i * 4 + 1] = Math.min(0.3, 0.12 * aL[i]) * clamp(strength, 0, 1.3) * env.calm; aR[i * 4 + 2] = dx * c - dz * sn; aR[i * 4 + 3] = dx * sn + dz * c; attr.needsUpdate = true;
      end[i] = t + delay + (aL[i] + U.uHg.value.z * 2.2) / U.uHg.value.w + 0.5;
      if (api.onWave) api.onWave(A.array[i * 3], A.array[i * 3 + 2], 'weed', strength, delay);
      return 1;
    };
    systems.push({
      update(dt, t, boat, underWay) {
        if (!hangings.answer) return;
        for (let i = 0; i < n; i++) {
          if (A.array[i * 3 + 1] < -6) continue;
          const dx = boat.x - A.array[i * 3], dz = boat.z - A.array[i * 3 + 2], near = track.step(i, dx * dx + dz * dz, underWay);
          if (near >= 0) send(i, clamp((boat.speed || 0) / 2.2, 0.45, 1) * (1 - 0.45 * near / 6), 1.5 + 0.25 * near + 0.25 * rnd(), t, boat.x, boat.z);
        }
      },
      wave(which, strength, delay) { const t = ctx.time, fx = which === 'all' ? ctx.boat.x : which.near[0], fz = which === 'all' ? ctx.boat.z : which.near[1]; let k = 0;
        for (let i = 0; i < n; i++) { if (which !== 'all' && Math.hypot(A.array[i * 3] - fx, A.array[i * 3 + 2] - fz) > which.radius) continue; k += send(i, strength, delay + 0.4 * rnd(), t, fx, fz); } return k; },
    });
    api.ribbons += n;
  }
  if (!systems.length) return null;
  if (LOG === 'weed' && W && W.smoke) {
    const A = W.smoke.object.geometry.attributes.aAnchor.array, D = W.smoke.object.geometry.attributes.aDir.array, town = light.town, out = [];
    for (let i = 0; i < W.smoke.count; i += 5) { const q = town.sd(A[i * 3], A[i * 3 + 2]); out.push(`${q.s.toFixed(0)}/${q.d.toFixed(1)}/${A[i * 3 + 1].toFixed(1)}/${D[i * 4 + 3].toFixed(1)}`); }
    for (let k = 0; k < out.length; k += 12) note('long weed, one of each pot (s/d/y of the mouth/length): ' + out.slice(k, k + 12).join('  '));
  }
  if (LOG === 'weed') note(`weed: ${api.fringes} fringes on eaves, ${api.ribbons} ribbons of the family's weed answer the hull`);
  return { api, update(dt, t, boat, underWay) { for (const sys of systems) sys.update(dt, t, boat, underWay); }, bind(h) { hangings = h; },
    play(what) { if (what === 'wave') api.wave({ near: [ctx.boat.x, ctx.boat.z], radius: 16 }, 1, 0); } };
}

// ====================================================================================================== the stalls' awnings
// Nothing of this module's lies on the awnings (kit_street.js: one still mesh, 'town-stalls:cloth', breathing 7 cm up and
// down over 7.4 s where the page has a wave of 0.25 to 0.6 m). (The fourth holder tried the page's wave on them: one slow
// wave along each slope's eaves that carried the free edge 0.24 m, then 0.5 m, out over its rail and back, since only
// what moves sideways can be seen from 22 m straight above. Enlarged twice from the boat, over the fountain, it could not
// be told from the tremor of the water it is seen through; at 0.5 m it showed only as dark slits opening along the
// ridge poles. Taken out again; the pictures are in the log.)

// ====================================================================================================== poplar leaves
// Nothing of this module's lies on the leaves. (The second holder laid a stir on them: air in wandering patches, each
// card rocking up to 43 degrees either way at 1.5 Hz. It was made for the kit's first leaves, three small leaves to a
// card. The kit's own second look then remade them: a card is now a whole SPRAY, a twig half a metre to a metre long
// with eleven leaves, which shivers 7 degrees at 1.5 Hz on its twig while each leaf turns between its two faces. On
// those the stir threw whole twigs about like flags in a gale, in air that has no wind, and from the 15 m the trees
// are passed at it added nothing that could be measured to what the kit's own tremble already shows. Taken out; the
// pictures are in the log, "Second look, continued".) The leaves are published as their maker left them.

// ====================================================================================================== the module
export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const light = ensureLight(ctx, plan, shared), env = { calm: ctx.reducedMotion ? 0.5 : 1 };      // reduced motion: everything this module moves is halved, nothing is removed
  // one clock and one wave for everything this module sends through cloth and weed
  // (and the engine's ripple field under names of this module's, so that nothing here leans on what another module's shader declares)
  const ES = (ctx.engine && ctx.engine.shared) || {};
  // (the larger wave on cloth is 3.4 m long: nearly six seconds to pass a point, a sheet rising toward the level of its line
  // over a second and a half and swinging back through its hang. At 1.6 m and the strength a drifting hull gave it, it swung
  // the cloth LESS than the cloth's own slow wave does: no answer at all; at 2.4 m and full strength it flapped: a metre at
  // the hem in under a second. &hgwlen=, &hgwave= try others)
  const U = { uHg: { value: new THREE.Vector4(0.6, +(Q.get('hgwlen') || 3.4), 1.1, 0.8) }, uHgNow: { value: new THREE.Vector2(ctx.time || 0, env.calm) },
    tHgRipple: ES.tRipple || { value: null }, uHgRippleRect: ES.uRippleRect || { value: new THREE.Vector4(0, 0, 64, 64) } };
  const parts = [], made = {};
  const tryPart = (name, fn) => {
    if (!want(name)) return;
    try { const p = fn(); if (p) { parts.push(p); made[name] = p.api; } }
    catch (err) { console.error(`INVALID_ note cast_hangings: ${name} failed and was left out: ${(err && err.stack) || err}`); }
  };
  tryPart('skiffs', () => buildSkiffs(ctx, plan, shared, light, env));
  tryPart('cloth', () => buildCloth(ctx, plan, shared, light, U, env));
  tryPart('weed', () => buildWeed(ctx, plan, shared, light, U, env));

  // ---- what the staging gets (docs/build/town/3-cast-hangings.md says which moment drives which)
  const hangings = {
    answer: true,                 // the hull's passing sends the waves, lifts the street's lines and rocks the skiffs by itself; false mutes all of it
    skiffs: made.skiffs || null,  // { count, position(i), rest(i), bolt(i), mooring(i), painter(i), rock(which, strength, delay, from), sway, ropes, stones, onRock }
    cloth: made.cloth || null,    // { lines, street, lift(which, opts), lifted(which), wave(which, strength, delay), auto, onWave, onLift }
    weed: made.weed || null,      // { wave(which, strength, delay), onWave }
    // nothing of this module's making, published so that the cast is in one place: the three vanes and the leaves
    vanes: { tower: shared.tower ? shared.tower.vane : null, towerPart: shared.tower && shared.tower.parts ? shared.tower.parts.vane : null, weathercock: shared.church ? shared.church.vane : null,
      arrow: shared.roofs && shared.roofs.uniforms ? shared.roofs.uniforms.uKrVane : null },
    leaves: shared.kitPoplars ? { mesh: shared.kitPoplars.leaves, sprays: shared.kitPoplars.sprays } : null,      // the kit's own (kit_street.js): they tremble by themselves; nothing of this module's lies on them
    awnings: null,                // (the stalls' awnings breathe in kit_street.js; nothing of this module's lies on them: see above)
  };
  for (const p of parts) p.bind(hangings);
  shared.cast.hangings = hangings;
  if (LOG === 'handles') {                               // what is published, said plainly (so that the log's table can be checked against the module)
    const keys = (o) => (o ? Object.keys(o).map((k) => k + (typeof o[k] === 'function' ? '()' : o[k] == null ? ':null' : '')).join(' ') : 'MISSING');
    note('shared.cast.hangings: ' + keys(hangings));
    note('  skiffs: ' + keys(hangings.skiffs)); note('  cloth: ' + keys(hangings.cloth)); note('  weed: ' + keys(hangings.weed));
    note('  vanes: ' + keys(hangings.vanes) + ' | leaves: ' + keys(hangings.leaves));
  }
  if (LOG === 'wave') {                                  // (with &drift=1: what the hull's passing sends, and when)
    let seen = 0; const say = (what) => (x, z, i, strength, delay) => { if (seen++ < 8) note(`${what} ${i}: wave of ${(+strength).toFixed(2)} begins ${(+delay).toFixed(1)} s after t ${ctx.time.toFixed(1)} s; the hull at s ${ctx.s.toFixed(1)}, ${Math.hypot(ctx.boat.x - x, ctx.boat.z - z).toFixed(1)} m off`); };
    if (hangings.cloth) { hangings.cloth.onWave = say('cloth piece'); hangings.cloth.onLift = (x, z, k) => { if (seen++ < 8) note(`line ${k} lifts at t ${ctx.time.toFixed(1)} s; the hull at s ${ctx.s.toFixed(1)}`); }; }
    if (hangings.weed) hangings.weed.onWave = say('weed');
  }

  // (a developer's crane, for looking at what hangs under the water from the side and from above: &hgcam=right,up,back
  // moves the eye that many metres from the rider's own, in the boat's frame; &yaw and &pitch still turn it. Pictures only.)
  if (Q.has('hgcam') && ctx.engine && ctx.engine.camera) { const v = Q.get('hgcam').split(',').map(Number); ctx.engine.camera.position.set(v[0] || 0, v[1] || 0, v[2] || 0); }

  let played = !PLAY.length;
  return {
    update(dt, c) {
      const boat = c.boat, underWay = (boat.speed || 0) > 0.3, t = c.time;
      env.calm = c.reducedMotion ? 0.5 : 1; U.uHgNow.value.set(t, env.calm);
      if (!played && t > 0.5) { played = true; for (const what of PLAY) for (const p of parts) p.play(what); }
      for (const p of parts) p.update(dt, t, boat, underWay);
    },
  };
}
