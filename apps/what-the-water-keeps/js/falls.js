// Falls: things that fall. Petals, beech leaves, snow (flakes, powder, slabs that slide from boughs), seed down,
// feathers, spent wings, salt dust, lint and drips. The page is docs/life/falls.md; what floats is in floaters.js.
//
//   makeFall(ctx, opts)      one kind of falling thing: a field that follows the boat (or keeps to one place), a pool for
//                            bursts (a great fall, a sift, a bumped trunk), fixed points that drip or stream; its landings
//                            found on the CPU (a ring, a sound, a floater); a twin drawn only in the water's mirror
//   makeSlabs(ctx, opts)     loads of snow lying on boughs, which crack, roll off, break and are powder within three metres
//   canopyMask(ctx, opts)    where falling things are born: under blossom only, from the crown's underside
//   cardGeometry(shape)      the small bent cards themselves (petal, leaf, feather, wing), shared with the floaters
//   lifeHull(ctx)            the rider's hull and the lane it has just left, for anything that must make way for it
//
// How it works. Nothing is simulated. Every instance carries four random numbers; where it is at any moment is a
// closed function of those numbers and the realm's time, evaluated in the vertex shader. The same function, written
// again in script below (it needs no trigonometry: a fall is built so that it ends exactly over the place it began,
// carried only by the wind), says when and where each one lands, so a landing can be a ring on the water, a tick and
// a floating thing. Three ways an instance can live:
//   field    born again and again somewhere in a box (a new place every time, from an integer hash that script and
//            shader share), falling from the ceiling, or from under the canopy where a mask says there is blossom
//   burst    let go once, at a time and a place written into its attributes by burst()
//   point    one of a fixed place's own: a drop that swells, lets go and falls; a grain of dust carried off on the wind
// Each kind falls in its own way (FALL_KINDS below): a petal rocks and slips sideways, a leaf tumbles and stalls,
// a flake drifts, down hangs, powder starts fast and close and then spreads and thins, a drop falls as drops do.
import * as THREE from 'three';
import { FOG_PARS } from '../kit.js';

const TAU = Math.PI * 2;
const col = (c) => (c && c.isColor ? c : new THREE.Color(c ?? '#ffffff'));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { if (a === b) return x >= b ? 1 : 0; const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pair = (v, d) => (Array.isArray(v) ? v : v == null ? d : [v, v]);
const BOX = -1e9, POINT = -1e8, IDLE = 1e9;        // what aBirth.w says when it is not a time: of the field; of a fixed point; a burst slot not in use

// ------------------------------------------------------------------------------------------------ the realm's clock
// The realm's own time as a uniform, so that what the shader draws and what the script works out are the same moment.
const CLOCKS = new WeakMap();
export function lifeTime(ctx) {
  let c = CLOCKS.get(ctx);
  if (!c) {
    // uLifeBloom: the brightest that paint may be without glowing, which is just under the realm's bloom threshold
    // (look.bloom.threshold: 0.82 by default, 0.93 in the snow orchard, 0.7 in the orchard's blue hour)
    const post = ctx.engine && ctx.engine.post, bloom = () => 0.95 * (post && post.bloom && post.bloom.threshold > 0 ? post.bloom.threshold : 0.82);
    c = { uLifeNow: { value: ctx.time || 0 }, uLifeBloom: { value: bloom() } };
    CLOCKS.set(ctx, c);
    ctx.onUpdate(() => { c.uLifeNow.value = ctx.time; c.uLifeBloom.value = bloom(); });
  }
  return c;
}

// ------------------------------------------------------------------------------------------------ the hull and its lane
// Where the rider's boat lies on the water (a line from stern to stem and a half width), and the track it has left
// behind it: a short list of places with the time it was there. Falling things land on the boat instead of going through
// it; floating things are shouldered aside along the line and close in behind as the track ages.
export const LANE_N = 20;
const LANE_STEP = 2.4;                             // metres between two places remembered on the track
const HULLS = new WeakMap();
/**
 * The hull and its lane for this engine: { uniforms: { uLifeHull, uLifeHullB, uLifeLane }, bow, stern, half, deck, update(ctx) }.
 * uLifeHull = stern x, z, stem x, z (at the waterline); uLifeHullB = half width, places in use on the track, the boat's
 * speed, the realm's time; uLifeLane[i] = x, z, when the boat's middle was there, weight (the oldest fade out).
 */
export function lifeHull(ctx) {
  const engine = ctx.engine;
  let H = HULLS.get(engine);
  if (!H) {
    H = {
      uniforms: {
        uLifeHull: { value: new THREE.Vector4(0, 1.5, 0, -1.84) }, uLifeHullB: { value: new THREE.Vector4(0.42, 0, 0, 0) },
        uLifeLane: { value: Array.from({ length: LANE_N }, () => new THREE.Vector4(0, 0, -1e6, 0)) },
      },
      bow: 1.84, stern: -1.5, half: 0.42, deck: 0.2, n: 0, stamp: null, owner: null, lastX: 0, lastZ: 0, fx: 0, fz: -1,
      /** Once a frame (whichever of the family's things asks first). */
      update(c) {
        const t = c.time;
        if (H.stamp === t && H.owner === c) return H;
        const fresh = H.owner !== c;
        H.stamp = t; H.owner = c;
        const boat = c.boat, sim = c.water && c.water.sim, hull = sim && sim.hull, U = H.uniforms, L = U.uLifeLane.value;
        if (hull && hull.bow > hull.stern) { H.bow = hull.bow; H.stern = hull.stern; H.half = hull.half; }
        const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading);
        H.fx = fx; H.fz = fz;
        U.uLifeHull.value.set(boat.x + fx * H.stern, boat.z + fz * H.stern, boat.x + fx * H.bow, boat.z + fz * H.bow);
        // the track: a new place whenever the boat has gone far enough from the last one; a jump (another realm) clears it
        const jump = fresh || Math.hypot(boat.x - H.lastX, boat.z - H.lastZ) > 12;
        if (jump) { H.n = 0; for (const v of L) v.set(boat.x, boat.z, -1e6, 0); }
        H.lastX = boat.x; H.lastZ = boat.z;
        if (H.n === 0 || Math.hypot(boat.x - L[0].x, boat.z - L[0].y) > LANE_STEP) {
          for (let i = LANE_N - 1; i > 0; i--) L[i].copy(L[i - 1]);
          L[0].set(boat.x, boat.z, t, 1);
          H.n = Math.min(LANE_N, H.n + 1);
        }
        for (let i = 0; i < LANE_N; i++) L[i].w = i < H.n ? clamp((LANE_N - 1 - i) / 3, 0, 1) : 0;      // the last three places fade, so none is dropped with a jump
        U.uLifeHullB.value.set(H.half, H.n, boat.speed || 0, t);
        return H;
      },
      /** Is this place on the boat? (script side: for a landing) */
      onBoat(x, z, margin = 0.2) {
        const A = H.uniforms.uLifeHull.value, bx = A.z - A.x, bz = A.w - A.y, px = x - A.x, pz = z - A.y;
        const k = clamp((px * bx + pz * bz) / Math.max(bx * bx + bz * bz, 1e-4), -0.12, 1.3);     // the hull overhangs its waterline at both ends
        return Math.hypot(px - bx * k, pz - bz * k) < H.half + margin;
      },
    };
    HULLS.set(engine, H);
  }
  return H;
}

// ------------------------------------------------------------------------------------------------ the kinds
// What each kind is, in numbers. Lengths in metres, speeds in metres a second, angles in radians. Where an area's
// page gives other numbers, pass them as options: every key here can be overridden in makeFall's options.
//   draw      'card' (a small bent card with two sides and a true outline, in gouache) or 'point' (a soft point)
//   model     how it falls: 'flutter' (rocks and slips sideways), 'tumble' (turns over and stalls), 'drift' (hangs and
//             wanders), 'plume' (starts fast and close, slows, spreads, thins), 'drop' (swells, lets go, falls)
//   size      its length (a card) or its width (a point); vary: how much sizes differ; clump: the share twice the size
//   minPixels, farAlpha, farLight   (points) the smallest it is ever drawn; drawn up to that size it is fainter instead,
//             to no less than farAlpha (its own colour) and farLight (the light it gives: down against the sun)
//   speed     [slowest, fastest] fall. ceiling: the height the field falls from when the area gives no box
//   sway      how far it swings to either side; swings: [fewest, most] whole swings a second; stall: 0..1 how much it
//             hesitates (at the end of a swing, or when it lies flat) and dives between
//   rock      how far it tips as it swings; turns: [fewest, most] turns a second (a petal about the vertical, a leaf over itself)
//   spread    how far the ones of a burst drift apart; spreadOver: in about how many seconds (a puff of down shaken from a
//             spike opens in a second or two, 1.6; petals and leaves let go together only wander apart, 4: nothing is ever THROWN)
//   far       (cards) [metres, times]: drawn up to `times` larger beyond that distance (a stage convention, kept small);
//   crisp     (cards) true: kept out of the painter's filter (gouache's `crisp`), which would wipe a far petal or swell it
//             into a dab: a petal twenty metres off is a fleck of its true size. minPixels: the smallest a card is drawn
//   veil, grain   (powder) the share drawn as soft spreading puffs of `size`, and [size, opacity] of the grains among them
//   plume: life [shortest, longest] seconds; slowTo: its speed once the air has slowed it; slow: how soon it slows (1/s); turb: how
//             far the air moves it about; grow: how many times larger a grain has become by the end (a puff spreading)
export const FALL_KINDS = {
  // An apple petal, drawn four times life as stage snow is: it rocks like a small dish, slips a hand's width to one
  // side, hangs, and slips back; white inside, pink outside, so it flickers as it turns.
  petal: { draw: 'card', shape: 'petal', model: 'flutter', size: 0.06, vary: 0.22, speed: [0.35, 0.7], ceiling: 16, sway: 0.125, swings: [0.125, 0.21], stall: 0.5, rock: 0.85,
    turns: [0.3, 0.9], spread: 0.5, spreadOver: 4, inside: ['#F4E6E3', '#F6ECE8', '#EFDDE0'], outside: ['#E3A8B0', '#E8B8BE', '#DC9EAA'], backlight: 0.35, brush: 0.25, shade: 0.75, curl: [0.25, 0.1],
    far: [14, 1.2], crisp: true, ring: [0.045, 0.12] },
  // A beech leaf in autumn: it never falls straight. It lets go lying flat, turns over lazily, hangs each time it comes
  // flat, dives edge-on, and swings half a metre to either side all the way down.
  leaf: { draw: 'card', shape: 'leaf', model: 'tumble', size: 0.085, vary: 0.2, speed: [0.9, 1.3], ceiling: 20, sway: 0.5, swings: [0.4, 0.6], stall: 0.45, rock: 0.3,
    turns: [0.33, 0.67], spread: 0.8, spreadOver: 3, inside: ['#B5522A', '#7A3B22', '#C08A3A', '#B5522A', '#5A2630', '#9C4526'], outside: ['#9A5A34', '#6E3E2A', '#A8804A', '#9A5A34', '#523038', '#8A4A2E'], backlight: 0.7,
    backColor: '#ff6a3a', brush: 0.45, shade: 0.9, curl: [0.5, 0.35], flat: true, far: [12, 1.2], crisp: true, ring: [0.15, 0.4] },
  // A body feather: a shallow curved boat that swings like a pendulum, thirty degrees either way, turning slowly.
  feather: { draw: 'card', shape: 'feather', model: 'flutter', size: 0.115, vary: 0.22, speed: [0.45, 0.55], ceiling: 20, sway: 0.2, swings: [0.55, 0.65], stall: 0.35, rock: 0.52,
    turns: [0.04, 0.14], spread: 0.6, spreadOver: 4, inside: ['#F2B8C2', '#F3C6CC', '#EFAAB8'], outside: ['#F6D2D6', '#F8DCDE', '#F2C0CA'], backlight: 0.4, brush: 0.2, shade: 0.8, curl: [0.2, 0.1],
    vertexColors: true, far: [8, 1.4], minPixels: 3, crisp: true, ring: [0.08, 0.14] },
  // A spent mayfly: it comes down with its wings out flat, turning a little, and lies on the water as a pale cross.
  // (The insects family lets its own swarm fall spent, makeMayflies(...).spend(); this kind is for a place with no swarm.)
  wing: { draw: 'card', shape: 'wing', model: 'flutter', size: 0.12, vary: 0.12, speed: [0.5, 0.8], ceiling: 6, sway: 0.07, swings: [0.5, 0.8], stall: 0.3, rock: 0.22,
    turns: [0.03, 0.12], spread: 0.4, spreadOver: 4, inside: ['#EDE5C8'], outside: ['#E2D8B6'], backlight: 0.6, backColor: '#FFE7A8', brush: 0.15, shade: 0.6, curl: [0, 0],
    vertexColors: true, far: [8, 1.3], crisp: true, ring: [0.04, 0.1] },
  // Snow: a flake drifts. One in seven is a clump twice the size.
  flake: { draw: 'point', shape: 'flake', model: 'drift', size: 0.04, vary: 0.35, clump: 1 / 7, minPixels: 6.5, farAlpha: 0.72, speed: [0.7, 0.9], ceiling: 28, sway: 0.15, swings: [0.16, 0.24], stall: 0, rock: 0,
    turns: [0, 0], spread: 0.3, spreadOver: 3, color: ['#F3ECE8'], opacity: 0.85, ring: [0.03, 0.08] },
  // Powder: snow shaken from a bough. It leaves as a close curtain at the speed of the lumps it came from (1.6 to 3.4 m/s:
  // it has 3 to 6 m behind it after two and a half seconds, the snow orchard's numbers), is slowed by the air to under
  // a metre a second, spreads into a veil, and thins to nothing in three to seven seconds.
  // It is drawn as two things in one: nearly half are soft puffs 0.7 m across, each so faint that only where many
  // overlap is there a veil (fewer and stronger, they were seen one by one, as balls of cotton); the rest are grains
  // of 5 cm inside it, which are what is seen near.
  powder: { draw: 'point', shape: 'grain', model: 'plume', size: 0.7, vary: 0.4, grow: 2.2, veil: 0.45, grain: [0.05, 0.8], speed: [1.6, 3.4], slowTo: 0.9, slow: 0.5, life: [2.5, 7], turb: 0.35, spread: 1.5,
    color: ['#F3ECE8', '#EAE4EC'], opacity: 0.13 },
  // Reedmace down: a seed under a parachute of hairs. It hangs, wanders, and sinks a hand's width in three seconds.
  // (A puff shaken from a spike would be eighty seconds coming down: after twelve it has thinned away among the rest.)
  down: { lit: 0, draw: 'point', shape: 'down', model: 'drift', size: 0.034, vary: 0.3, minPixels: 6, farAlpha: 0.3, farLight: 0.85, speed: [0.03, 0.03], ceiling: 12, sway: 0.4, swings: [0.12, 0.18], stall: 0, rock: 0,
    turns: [0, 0], spread: 0.9, spreadOver: 1.6, lasts: 12, color: ['#B9A56E'], intensity: 0.55, opacity: 0.9, scatter: { color: '#FFE7A8', gain: 1.1, power: 6 }, ring: [0.03, 0.08] },
  // Salt dust: white, brief; it streams from a point on the wind and is gone in two seconds. A little of it is lifted off
  // the crest before it sinks (a speed above zero is downward, below zero upward).
  dust: { draw: 'point', shape: 'grain', model: 'plume', size: 0.2, vary: 0.5, grow: 3.2, speed: [-0.2, 0.25], slowTo: 0.25, slow: 1.2, life: [1.2, 2.4], turb: 0.35, spread: 0.3,
    color: ['#F7ECD2', '#FFFFFF'], opacity: 0.11 },
  // Lint: fibres in the air, carried slowly; they show only where a shaft of light crosses them.
  lint: { lit: 0, draw: 'point', shape: 'lint', model: 'plume', size: 0.02, vary: 0.4, speed: [0.0, 0.02], slowTo: 0.01, slow: 0.2, life: [10, 20], turb: 0.6, spread: 0.2,
    color: ['#ffffff'], opacity: 0.8 },
  // A drop: it swells at the hem for most of a second, lets go, and falls as water falls (never faster than nine
  // metres a second); a bead with a short tail.
  drip: { lit: 0, draw: 'point', shape: 'bead', model: 'drop', size: 0.04, vary: 0.25, minPixels: 4, speed: [0, 9], every: [2, 9], swell: 0.7, color: ['#cfd6e6'], opacity: 0.9,
    scatter: { color: null, gain: 1.4, power: 5 }, ring: [0.25, 0.2] },
};
const MODEL = { flutter: 0, tumble: 1, drift: 2, plume: 3, drop: 4 };

// ------------------------------------------------------------------------------------------------ the cards
/**
 * The small bent cards, each with a true outline. Modelled lying flat with the upper (inner) face toward +Y and the
 * tip toward +Z; one unit long. A `color` attribute carries the little painting each one has (a paler claw, a darker
 * midrib, a white shaft and downy base).   shape: 'petal' | 'leaf' | 'feather' | 'wing', and 'kite' and
 * 'leafkite': the petal as it lies on the water, and the leaf in nine triangles, which is what the thousands afloat are made of
 * To look at them enlarged, from both sides and lying on the water: /?realm=lifetest&w=falls&k=shapes&s=40&yaw=90
 */
export function cardGeometry(shape = 'petal') {
  const P = [], C = [], I = [];
  const v = (x, y, z, c = 1) => { P.push(x, y, z); const k = Array.isArray(c) ? c : [c, c, c]; C.push(k[0], k[1], k[2]); return P.length / 3 - 1; };
  const up = (a, b, c) => {                          // a triangle, whichever way round faces up
    const ux = P[b * 3] - P[a * 3], uz = P[b * 3 + 2] - P[a * 3 + 2], wx = P[c * 3] - P[a * 3], wz = P[c * 3 + 2] - P[a * 3 + 2];
    if (uz * wx - ux * wz > 0) I.push(a, b, c); else I.push(a, c, b);
  };
  if (shape === 'petal' || shape === 'kite') {
    // An apple petal: broadly obovate, 1.4 times as long as wide and widest a little beyond the middle; its sides are
    // CONVEX all the way (it opens out at once from a short claw and comes round to a blunt, round end: an egg with a
    // stalk end, never a teardrop or a pick); cupped like a shallow spoon: the sides and the end stand a little above
    // the middle. Six triangles: there are fifteen thousand in the air in the orchard's great fall and nine thousand
    // afloat, none ever drawn more than fifty pixels long, and at that size eight triangles could not be told from six.
    // ('kite' is the same petal lying on the water: a little flatter.)
    const cup = shape === 'kite' ? 0.26 : 0.3, a = v(0, 0, -0.5, [0.86, 0.88, 0.8]), ring = [];
    const side = [[0.2, -0.3, 0.97], [0.35, 0.02, 1], [0.27, 0.37, 1]];
    for (const [x, z, c] of side) ring.push(v(-x, cup * x, z, c));
    ring.push(v(0, 0.055, 0.48, 1));
    for (const [x, z, c] of side.slice().reverse()) ring.push(v(x, cup * x, z, c));
    for (let i = 0; i + 1 < ring.length; i++) up(a, ring[i], ring[i + 1]);
  } else if (shape === 'leaf') {
    // A beech leaf: ovate, 1.5 times as long as wide, widest just below the middle, a rounded base, a short point, an
    // entire margin (four points to a side make it a smooth curve: never a tooth) that is faintly wavy, a short stalk;
    // folded 14 degrees on the midrib, which is painted darker; one side a little fuller than the other, as leaves
    // are. Thirteen triangles.
    const f = Math.tan(7 * Math.PI / 180);
    const mid = [v(0, 0, -0.44, 0.58), v(0, 0, -0.14, 0.62), v(0, 0, 0.14, 0.66), v(0, 0, 0.5, 0.8)];
    const side = (k) => [[0.19, -0.34, 0.92], [0.3, -0.12, 1], [0.29, 0.12, 1], [0.15, 0.34, 1]].map(([x, z, c], i) => v(k * x * (k > 0 ? 0.93 : 1), x * f + (i % 2 ? 0.012 : -0.008), z, c));
    for (const m of [side(-1), side(1)]) { up(mid[0], m[0], mid[1]); up(m[0], m[1], mid[1]); up(m[1], mid[2], mid[1]); up(m[1], m[2], mid[2]); up(m[2], m[3], mid[2]); up(m[3], mid[3], mid[2]); }
    up(v(-0.02, 0, -0.44, 0.5), v(0.02, 0, -0.44, 0.5), v(0, 0.012, -0.58, 0.45));
  } else if (shape === 'leafkite') {
    // (the same leaf in nine triangles, three points to a side, for the thousands lying on the water)
    const f = Math.tan(7 * Math.PI / 180);
    const s0 = v(0, 0, -0.44, 0.6), c = v(0, 0, 0.0, 0.66), t = v(0, 0, 0.5, 0.82);
    const side = (k) => [[0.22, -0.3], [0.31, -0.02], [0.2, 0.28]].map(([x, z]) => v(k * x * (k > 0 ? 0.93 : 1), x * f, z, 1));
    for (const m of [side(-1), side(1)]) { up(s0, m[0], c); up(m[0], m[1], c); up(m[1], m[2], c); up(m[2], t, c); }
    up(v(-0.02, 0, -0.44, 0.5), v(0.02, 0, -0.44, 0.5), v(0, 0.012, -0.58, 0.45));
  } else if (shape === 'feather') {
    // A contour feather of a large wader: a bare quill (an eighth of its length), a white downy base, a vane 2.9 times
    // as long as wide and widest past the middle, a ROUND end (a body feather is never pointed), a pale shaft, one
    // split in the vane where the barbs have come unzipped; bowed along its length (its two ends stand a tenth of its
    // length above its middle: lying on water it rides on its curve, hollow side up) and cupped across. Twenty triangles.
    const bow = (z) => 0.36 * z * z, cup = (x) => 0.24 * Math.abs(x), QUILL = [1.05, 1.3, 1.2];
    const q0 = v(0, bow(-0.5), -0.5, QUILL), qa = v(-0.014, bow(-0.37), -0.37, QUILL), qb = v(0.014, bow(-0.37), -0.37, QUILL);
    up(q0, qa, qb);
    const sh = [[-0.37, QUILL], [-0.15, [1.04, 1.2, 1.15]], [0.1, [1.03, 1.1, 1.08]], [0.32, [1.02, 1.04, 1.03]]].map(([z, c]) => v(0, bow(z), z, c));
    const tip = v(0, bow(0.5) + 0.01, 0.5, 0.93);
    const edge = [[0.105, -0.31, [1.04, 1.22, 1.16]], [0.155, -0.12, [1, 1.08, 1.06]], [0.17, 0.12, 0.97], [0.14, 0.33, 0.95], [0.075, 0.455, 0.93]];
    const L = edge.map(([x, z, c]) => v(-x, bow(z) + cup(x), z, c)), R = edge.map(([x, z, c]) => v(x, bow(z) + cup(x), z, c));
    up(sh[0], L[0], sh[1]); up(L[0], L[1], sh[1]); up(L[1], sh[2], sh[1]); up(L[1], L[2], sh[2]); up(L[2], sh[3], sh[2]); up(L[2], L[3], sh[3]); up(L[3], L[4], sh[3]); up(L[4], tip, sh[3]);
    // the other side has the split: a narrow V cut in from the edge almost to the shaft
    const ra = v(0.165, bow(0.2) + cup(0.165), 0.2, 0.97), rn = v(0.06, bow(0.235) + cup(0.06), 0.235, 1), rb = v(0.155, bow(0.275) + cup(0.155), 0.275, 0.96);
    up(sh[0], sh[1], R[0]); up(R[0], sh[1], R[1]); up(R[1], sh[1], sh[2]); up(R[1], sh[2], R[2]);
    up(sh[2], R[2], ra); up(sh[2], ra, rn); up(sh[2], rn, sh[3]); up(sh[3], rn, rb); up(sh[3], rb, R[3]);
    up(R[3], sh[3], R[4]); up(R[4], sh[3], tip);
  } else if (shape === 'wing') {
    // A spent mayfly (the May dun, Ephemera danica, in the proportions the insects family models it: body 4, tails 8
    // of 12, wings 7.5 across): a dark body; two fore wings out flat at right angles to it, each a long TRIANGLE twice
    // as long as wide (a straight leading edge, a blunt point, the widest place half way out), never a paddle; two
    // small hind wings behind them, a third as long; three hair-fine tails spread. One unit from the head to the tips
    // of the tails. Thirteen triangles; nothing overlaps, so nothing can flicker.
    const body = [0.2, 0.16, 0.12], tail = [0.34, 0.28, 0.2];
    const hd = v(0, 0.012, 0.5, body), bl = v(-0.03, 0.012, 0.41, body), br = v(0.03, 0.012, 0.41, body), at = v(0, 0.008, 0.17, body);
    up(hd, bl, br); up(bl, at, br);
    for (const sd of [-1, 1]) {
      const root = v(sd * 0.028, 0.012, 0.44, [0.78, 0.74, 0.58]), tipw = v(sd * 0.32, 0.004, 0.425, 0.94), out = v(sd * 0.27, 0.004, 0.36, 1), torn = v(sd * 0.14, 0.006, 0.3, 1), back = v(sd * 0.03, 0.01, 0.377, [0.82, 0.78, 0.64]);
      up(root, tipw, out); up(root, out, torn); up(root, torn, back);
      up(v(sd * 0.026, 0.009, 0.36, [0.8, 0.76, 0.62]), v(sd * 0.1, 0.004, 0.275, 0.92), v(sd * 0.03, 0.007, 0.3, 0.9));
      up(v(sd * 0.004, 0.008, 0.18, tail), v(sd * 0.02, 0.008, 0.17, tail), v(sd * 0.17, 0.002, -0.5, tail));
    }
    up(v(-0.008, 0.008, 0.17, tail), v(0.008, 0.008, 0.17, tail), v(0, 0.002, -0.5, tail));
  } else throw new Error(`cardGeometry: no shape called '${shape}'`);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}

// ------------------------------------------------------------------------------------------------ where they are born
/**
 * A canopy: where falling things are born, and from what height. opts:
 *   crowns    [{ x, z, r, under, soft }]   discs of blossom: centre, radius, the height of the crown's underside there
 *             (metres above the water) and how many metres of soft edge (default a fifth of the radius)
 *   paint     (put) => {...}                or paint it yourself: put(x, z, presence 0..1, underside height)
 *   rect      [x0, z0, x1, z1]              what it covers (default: the crowns' own bounds)
 *   size      cells on its longer side (default 256);  ceiling: the greatest underside height it can hold (default 40)
 * Returns { texture, data, width, height, rect, ceiling, at(x, z, out) } with at() reading it exactly as the shader does
 * (out.cover 0..1, out.under metres). One mask can serve several falls.
 */
export function canopyMask(ctx, opts = {}) {
  const o = { crowns: [], paint: null, rect: null, size: 256, ceiling: 40, ...opts };
  let [x0, z0, x1, z1] = o.rect || [Infinity, Infinity, -Infinity, -Infinity];
  if (!o.rect) {
    for (const c of o.crowns) { x0 = Math.min(x0, c.x - c.r - 1); x1 = Math.max(x1, c.x + c.r + 1); z0 = Math.min(z0, c.z - c.r - 1); z1 = Math.max(z1, c.z + c.r + 1); }
    if (!(x1 > x0)) { x0 = -1; x1 = 1; z0 = -1; z1 = 1; }
  }
  const sx = x1 - x0, sz = z1 - z0, k = o.size / Math.max(sx, sz), W = Math.max(2, Math.round(sx * k)), H = Math.max(2, Math.round(sz * k));
  const data = new Uint8Array(W * H * 4);
  const put = (i, j, cover, under) => {
    const q = (j * W + i) * 4, c = Math.round(clamp(cover, 0, 1) * 255);
    if (c >= data[q]) { data[q] = c; data[q + 1] = Math.round(clamp(under / o.ceiling, 0, 1) * 255); data[q + 3] = 255; }
  };
  for (const c of o.crowns) {
    const soft = c.soft ?? c.r * 0.2, i0 = Math.max(0, Math.floor((c.x - c.r - x0) / sx * W)), i1 = Math.min(W - 1, Math.ceil((c.x + c.r - x0) / sx * W));
    const j0 = Math.max(0, Math.floor((c.z - c.r - z0) / sz * H)), j1 = Math.min(H - 1, Math.ceil((c.z + c.r - z0) / sz * H));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const x = x0 + (i + 0.5) / W * sx, z = z0 + (j + 0.5) / H * sz, d = Math.hypot(x - c.x, z - c.z);
      if (d < c.r) put(i, j, 1 - smooth(c.r - soft, c.r, d), c.under ?? 8);
    }
  }
  if (o.paint) o.paint((x, z, cover, under) => { const i = Math.floor((x - x0) / sx * W), j = Math.floor((z - z0) / sz * H); if (i >= 0 && j >= 0 && i < W && j < H) put(i, j, cover, under); });
  const texture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  texture.minFilter = texture.magFilter = THREE.LinearFilter; texture.generateMipmaps = false; texture.colorSpace = THREE.NoColorSpace; texture.needsUpdate = true;
  const rect = new THREE.Vector4((x0 + x1) / 2, (z0 + z1) / 2, sx, sz);
  ctx.onDispose(() => texture.dispose());
  const tx = (i, j, ch) => data[(clamp(j, 0, H - 1) * W + clamp(i, 0, W - 1)) * 4 + ch];
  return {
    texture, data, width: W, height: H, rect, ceiling: o.ceiling,
    /** The mask at a place, read as the shader reads it (bilinear, clamped): out.cover 0..1, out.under metres. */
    at(x, z, out = {}) {
      const u = (x - rect.x) / rect.z + 0.5, w = (z - rect.y) / rect.w + 0.5;
      if (u < 0 || u > 1 || w < 0 || w > 1) { out.cover = 0; out.under = 0; return out; }
      const a = u * W - 0.5, b = w * H - 0.5, i = Math.floor(a), j = Math.floor(b), fa = a - i, fb = b - j;
      const mix = (ch) => (tx(i, j, ch) * (1 - fa) + tx(i + 1, j, ch) * fa) * (1 - fb) + (tx(i, j + 1, ch) * (1 - fa) + tx(i + 1, j + 1, ch) * fa) * fb;
      out.cover = mix(0) / 255; out.under = mix(1) / 255 * o.ceiling;
      return out;
    },
  };
}

// ------------------------------------------------------------------------------------------------ the shared function
// The integer hash that shader and script share: the four random numbers of one instance's n-th fall.
const hash32 = (x) => { x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15; x = Math.imul(x, 0x846ca68b); x ^= x >>> 16; return x >>> 0; };
function rand4(id, n, out) {
  const a = hash32((Math.imul(id, 0x9E3779B9) ^ (Math.imul(n, 0x85EBCA6B) + 0x27D4EB2F)) >>> 0), b = hash32((a ^ 0x68E31DA4) >>> 0);
  out[0] = (a & 0xffff) / 65536; out[1] = (a >>> 16) / 65536; out[2] = (b & 0xffff) / 65536; out[3] = (b >>> 16) / 65536;
  return out;
}
const G = 9.81;
/** Seconds a drop takes to fall h metres, never going faster than vmax. */
const dropTime = (h, vmax) => { const tc = vmax / G, hc = 0.5 * G * tc * tc; return h <= hc ? Math.sqrt(2 * Math.max(h, 0) / G) : tc + (h - hc) / vmax; };

// The same in GLSL. `model` is one of MODEL. Everything a fall needs is in here; cards and points both use it.
const CORE = (model) => /* glsl */`
  attribute vec4 aSeed;                    // four random numbers, 0..1
  attribute vec4 aBirth;                   // a burst: where and when it was let go (x, y, z, time). w = ${BOX.toExponential()}: of the field; ${POINT.toExponential()}: of a fixed point (x, y, z)
  uniform float uLifeNow;                  // the realm's time
  uniform vec4 uFallA;                     // slowest and fastest fall, the ceiling it falls from, the level it lands on
  uniform vec4 uFallB;                     // sway, fewest and most swings a second, how much it stalls
  uniform vec4 uFallC;                     // rock, fewest and most turns a second, how far a burst is thrown apart
  uniform vec4 uFallD;                     // how many of the field are out (0..1), the room kept round the eye, the deck's height, motion (1, or less when calm)
  uniform vec4 uFallE;                     // plume: shortest and longest life, speed once settled, how soon it slows. drop: shortest and longest wait, -, -
  uniform vec4 uFallF;                     // plume: turbulence, how much a grain grows, flow (0..1). drop: -, seconds it swells, flow. w: 1 / seconds the ones of a burst take to drift apart
  uniform vec4 uFallBox;                   // the field's box: size x, size z, centre x, centre z
  uniform vec4 uFallWind;                  // how far the wind has carried things so far (x, z); the wind now (x, z)
  uniform vec4 uFallCol;                   // a column of turning air: x, z, radius, seconds a turn (0 = none)
  uniform vec4 uFallUp;                    // the share that rise in it, how far, for how many seconds; w: the longest one of a burst stays in the air (0 = until it lands)
  uniform vec4 uFallSweep;                 // a front that sets points streaming: direction x, z, where its line is, 1 / its speed (0 = none)
  uniform vec4 uFallSweepB;                // seconds they stream, seconds they take to thin, seconds to come up
  uniform vec4 uLifeHull, uLifeHullB;      // the rider's hull: stern x, z, stem x, z; half width, -, -, -
  uniform sampler2D tFallMask; uniform vec4 uFallMaskRect; uniform vec4 uFallMaskB;     // where they are born: its rect (centre, size); on, ceiling, metres between one fall and the next from the same place, -
  const float F_TAU = 6.2831853, F_PI = 3.14159265;
  struct Fall { vec3 pos; float tau; float P; float live; float h; float land; vec3 att; vec4 rc; float fade; float speed; };

  uint fallHash(uint x) { x ^= x >> 16; x *= 0x7feb352dU; x ^= x >> 15; x *= 0x846ca68bU; x ^= x >> 16; return x; }
  vec4 fallRand(int id, int n) {
    uint a = fallHash((uint(id) * 0x9E3779B9U) ^ (uint(n) * 0x85EBCA6BU + 0x27D4EB2FU)), b = fallHash(a ^ 0x68E31DA4U);
    return vec4(float(a & 0xFFFFU), float(a >> 16), float(b & 0xFFFFU), float(b >> 16)) * (1.0 / 65536.0);
  }
  vec2 fallWrap(vec2 q) { vec2 b = uFallBox.xy; return mod(q - uFallBox.zw + 0.5 * b, b) - 0.5 * b + uFallBox.zw; }
  vec4 fallMask(vec2 q) {
    vec2 uv = (q - uFallMaskRect.xy) / uFallMaskRect.zw + 0.5;
    return (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? vec4(0.0) : texture2D(tFallMask, uv);
  }
  // Round the eye nothing comes nearer than the room kept (it is eased aside, never switched off); on the boat it
  // lands on the deck instead of going through it.
  void fallClear(inout Fall F) {
    vec3 e = F.pos - uCameraPos; float d2 = dot(e, e), R = uFallD.y;
    if (d2 < 16.0 * R * R) {
      float d = sqrt(d2), k = 1.0 - smoothstep(0.0, 4.0 * R, d);
      F.pos = uCameraPos + e * (sqrt(d2 + R * R * k * k) / max(d, 1e-3));
      F.live *= smoothstep(0.0, 0.25 * R, d);
    }
    vec2 hb = uLifeHull.zw - uLifeHull.xy, hp = F.pos.xz - uLifeHull.xy;
    float hd = length(hp - hb * clamp(dot(hp, hb) / max(dot(hb, hb), 1e-4), -0.12, 1.3));
    float deck = uFallD.z * (1.0 - smoothstep(uLifeHullB.x + 0.1, uLifeHullB.x + 0.3, hd));
    if (deck > 0.005) F.live *= smoothstep(deck, deck + 0.07, F.pos.y - uFallA.w);
  }
${model <= 2 ? /* glsl */`
  // What it does on the way down. tm: seconds since it began to fall; Pm: seconds the whole fall takes.
  // lat: how far to the side it is (the caller eases it in and out, so that a fall ends over the place it began);
  // prog: how many seconds' worth of falling it has done (prog(Pm) == Pm, however it stalls and dives between);
  // att: how it lies (yaw, tilt or roll, the bearing it swings along).
  void fallMove(float tm, float Pm, vec4 s, vec4 rc, out vec2 lat, out float prog, out vec3 att) {
    float calm = uFallD.w, a = rc.w * F_TAU; vec2 dir = vec2(cos(a), sin(a)), across = vec2(-dir.y, dir.x);
    float A = uFallB.x * (0.6 + 0.8 * fract(s.z * 3.17)) * calm;
${model === 0 ? /* glsl */`
    // flutter: a pendulum. It begins and ends at the end of a swing, where it hangs; half way across it is level and quickest.
    float f = mix(uFallB.y, uFallB.z, s.z);
    float k = max(1.0, floor(2.0 * Pm * f + 0.5)), w = F_PI * k / Pm;              // a whole number of half swings fits the fall
    float psi = rc.z < 0.5 ? 0.5 * F_PI : 1.5 * F_PI, x = w * tm + psi;
    float g = sin(x + 0.35 * sin(2.0 * x));
    lat = dir * (A * g) + across * (0.3 * A * sin(0.5 * x + rc.z * 9.0));
    prog = tm + uFallB.w / (2.0 * w) * sin(2.0 * x);
    float spin = mix(uFallC.y, uFallC.z, fract(s.z * 7.31)) * (s.w < 0.5 ? -1.0 : 1.0) * mix(0.5, 1.0, calm);
    att = vec3(s.w * 40.0 + F_TAU * spin * tm, uFallC.x * g * calm, a);` : model === 1 ? /* glsl */`
    // tumble: it turns over about its own length, a whole number of half turns, hanging each time it comes flat and
    // diving edge-on between; and all the while it swings round an oval.
    float w = F_TAU * mix(uFallB.y, uFallB.z, s.z), x = w * tm + rc.z * F_TAU;
    lat = dir * (A * sin(x)) + across * (0.45 * A * cos(x));
    float r = mix(uFallC.y, uFallC.z, fract(s.z * 7.31)) * mix(0.5, 1.0, calm);
    float k = max(1.0, floor(2.0 * Pm * r + 0.5)), W = F_PI * k / Pm;
    float beta = W * tm + (rc.z < 0.5 ? 0.0 : F_PI);
    prog = tm - uFallB.w / (2.0 * W) * sin(2.0 * beta);
    att = vec3(s.w * 40.0 + F_TAU * 0.09 * (s.x - 0.5) * tm + 0.5 * sin(x), beta - 0.31 * sin(2.0 * beta), uFallC.x * sin(0.7 * x + s.w * 20.0));` : /* glsl */`
    // drift: it hangs in the air and wanders
    float f = mix(uFallB.y, uFallB.z, s.z);
    float x1 = F_TAU * f * tm + rc.z * F_TAU, x2 = F_TAU * f * 0.71 * tm + rc.w * F_TAU;
    lat = A * vec2(sin(x1) + 0.4 * sin(2.3 * x2), cos(x2) + 0.4 * sin(1.7 * x1 + 1.0));
    prog = tm; att = vec3(0.0);`}
  }
  Fall fallAt(vec4 s, vec4 birth, int id) {
    Fall F; F.pos = vec3(0.0, -60.0, 0.0); F.tau = 0.0; F.P = 1.0; F.live = 0.0; F.h = 0.0; F.land = 1.0; F.att = vec3(0.0); F.rc = vec4(0.0); F.fade = 1.0; F.speed = 0.0;
    float t = uLifeNow, v = mix(uFallA.x, uFallA.y, s.x), tm, Pm, live = 1.0; vec2 q0;
    if (birth.w < -5.0e8) {
      // of the field: born again and again, each time somewhere else in the box. Under a canopy lower than the
      // ceiling there is time for several falls in one turn: they leave the same blossom one after another.
      float P = uFallA.z / v, tt = t + s.y * P, n = floor(tt / P), tau = tt - n * P;
      vec4 rb = fallRand(id, int(n) * 64);
      vec2 q = fallWrap(rb.xy * uFallBox.xy + uFallWind.xy);
      vec2 e = abs(q - uFallBox.zw) / (0.5 * uFallBox.xy); live = 1.0 - smoothstep(0.84, 1.0, max(e.x, e.y));
      q0 = q - uFallWind.zw * tau; Pm = P;
      if (uFallMaskB.x > 0.5) { vec4 m = fallMask(q0); live *= smoothstep(0.4, 0.6, m.r); Pm = clamp(m.g * uFallMaskB.y / v, 0.5, P); }
      float sub = floor(tau / Pm);
      if (sub >= min(floor(P / Pm + 1.0e-3), 60.0)) live = 0.0;
      tm = tau - sub * Pm;
      F.rc = fallRand(id, int(n) * 64 + int(sub) + 1);
      live *= smoothstep(0.0, uFallMaskB.x > 0.5 ? 0.5 : 0.05 * P, tm) * clamp((uFallD.x * 1.05 - s.w) * 20.0, 0.0, 1.0);
      q0 += (F.rc.xy - 0.5) * uFallMaskB.z + uFallWind.zw * tm;
    } else {
      // one of a burst: let go once
      tm = t - birth.w;
      if (birth.w > 5.0e8) tm = -1.0;
      F.rc = fallRand(id, 7);
      Pm = max(birth.y - uFallA.w, 0.05) / v;
      float thrown = uFallC.w * sqrt(F.rc.y) * (1.0 - exp(-uFallF.w * max(tm, 0.0)));      // they wander apart; they are not thrown
      q0 = birth.xz + uFallWind.xy + vec2(cos(F.rc.x * F_TAU), sin(F.rc.x * F_TAU)) * thrown;
      live = smoothstep(0.0, 0.3, tm);
      if (uFallUp.w > 0.0) live *= 1.0 - smoothstep(0.75 * uFallUp.w, uFallUp.w, tm);     // (it has gone into the air at large: it thins away, it is never switched off)
    }
    if (tm <= 0.0 || tm >= Pm || live <= 0.0) return F;
    vec2 lat; float prog; vec3 att;
    fallMove(tm, Pm, s, F.rc, lat, prog, att);
    lat *= smoothstep(0.0, 1.2, tm) * smoothstep(0.0, 1.2, Pm - tm);
    vec2 xz = q0 + lat; float h = v * (Pm - prog);
    if (uFallCol.w > 0.0) {
      // a column of turning air: within it everything rides round the axis, and some are lifted for a few seconds
      vec2 rel = q0 - uFallCol.xy; float inside = 1.0 - smoothstep(0.7 * uFallCol.z, uFallCol.z, length(rel));
      float ang = F_TAU * tm / uFallCol.w * inside * uFallD.w, ca = cos(ang), sa = sin(ang);
      xz = uFallCol.xy + vec2(rel.x * ca - rel.y * sa, rel.x * sa + rel.y * ca) + lat;
      float dur = uFallUp.z, t1 = 1.0 + F.rc.y * max(Pm - dur - 3.0, 0.0);
      if (fract(s.w * 13.7) < uFallUp.x && Pm > dur + 3.0) { float u = clamp((tm - t1) / dur, 0.0, 1.0); h += uFallUp.y * inside * sin(F_PI * u) * sin(F_PI * u) * uFallD.w; }
    }
    F.pos = vec3(xz.x, uFallA.w + h, xz.y); F.tau = tm; F.P = Pm; F.h = h; F.live = live; F.att = att;
    F.land = smoothstep(0.0, 0.3, h);
    fallClear(F);
    return F;
  }` : model === 3 ? /* glsl */`
  // plume: it starts fast and close, slows, spreads and thins. A burst (powder from a bough) or a fixed point that
  // streams (dust from a heap, lint in a shaft).
  Fall fallAt(vec4 s, vec4 birth, int id) {
    Fall F; F.pos = vec3(0.0, -60.0, 0.0); F.tau = 0.0; F.P = 1.0; F.live = 0.0; F.h = 0.0; F.land = 1.0; F.att = vec3(0.0); F.rc = vec4(0.0); F.fade = 0.0; F.speed = 0.0;
    float t = uLifeNow, life = mix(uFallE.x, uFallE.y, s.x), tm; vec2 carried; float live = 1.0;
    if (birth.w < -5.0e7) {
      // of a fixed point: one grain after another, for as long as the point streams
      float tt = t + s.y * life, n = floor(tt / life); tm = tt - n * life;
      F.rc = fallRand(id, int(n));
      carried = uFallWind.zw * tm * (0.6 + 0.8 * F.rc.x);
      float flow = uFallF.z;
      if (uFallSweep.w > 0.0) {
        float since = (uFallSweep.z - dot(uFallSweep.xy, birth.xz)) * uFallSweep.w - tm;      // seconds since the front passed this point, when this grain left it
        flow *= smoothstep(0.0, uFallSweepB.z, since) * (1.0 - 0.8 * smoothstep(uFallSweepB.x, uFallSweepB.x + uFallSweepB.y, since));
      }
      live = clamp((flow * 1.05 - s.w) * 20.0, 0.0, 1.0);
    } else {
      tm = t - birth.w;
      if (birth.w > 5.0e8 || tm <= 0.0) return F;
      F.rc = fallRand(id, 7);
      carried = uFallWind.xy;
    }
    if (tm >= life || live <= 0.0) return F;
    float v0 = mix(uFallA.x, uFallA.y, s.z), e = (1.0 - exp(-uFallE.w * tm)) / uFallE.w, u = tm / life;
    float fallen = uFallE.z * tm + (v0 - uFallE.z) * e;
    float a = F.rc.z * F_TAU, calm = uFallD.w;
    vec2 xz = birth.xz + carried + vec2(cos(a), sin(a)) * (uFallC.w * sqrt(F.rc.w) * e * uFallE.w * 0.55);
    // the air it falls through is never quite still
    float tb = uFallF.x * calm * u, x1 = tm * (0.7 + s.z) + s.w * 40.0, x2 = tm * (0.5 + s.x) + s.y * 40.0;
    xz += tb * vec2(sin(x1) + 0.5 * sin(2.3 * x2), cos(x2) + 0.5 * sin(1.9 * x1));
    float y = birth.y - fallen + 0.35 * tb * sin(1.3 * x1 + x2);
    if (y < uFallA.w) return F;
    F.pos = vec3(xz.x, y, xz.y); F.tau = tm; F.P = life; F.h = y - uFallA.w; F.live = live;
    F.fade = smoothstep(0.0, 0.08, u) * (1.0 - smoothstep(0.5, 1.0, u)) * smoothstep(0.0, 0.25, F.h);
    F.speed = 1.0 + uFallF.y * u;                                                // (a puff spreads as it thins)
    fallClear(F);
    return F;
  }` : /* glsl */`
  // drop: it swells where it hangs, lets go, and falls as water falls
  Fall fallAt(vec4 s, vec4 birth, int id) {
    Fall F; F.pos = vec3(0.0, -60.0, 0.0); F.tau = 0.0; F.P = 1.0; F.live = 0.0; F.h = 0.0; F.land = 1.0; F.att = vec3(0.0); F.rc = vec4(0.0); F.fade = 1.0; F.speed = 0.0;
    if (birth.w < -5.0e8 || birth.w > -5.0e7) return F;                         // drops come only from fixed points
    float g = 9.81, vmax = uFallA.y, tc = vmax / g, hc = 0.5 * g * tc * tc, h0 = max(birth.y - uFallA.w, 0.0);
    float Tf = h0 <= hc ? sqrt(2.0 * h0 / g) : tc + (h0 - hc) / vmax, swell = uFallF.y;
    float P = max(mix(uFallE.x, uFallE.y, s.x), Tf + swell + 0.1);
    float tt = uLifeNow + s.y * P, n = floor(tt / P), tcyc = tt - n * P;
    F.rc = fallRand(id, int(n));
    float tm = tcyc - (swell + F.rc.x * (P - Tf - swell - 0.05));            // it lets go somewhere in its turn, never at the same moment twice
    if (tm < -swell || tm >= Tf) return F;
    float fallen = tm <= 0.0 ? 0.0 : (tm < tc ? 0.5 * g * tm * tm : hc + vmax * (tm - tc));
    F.speed = tm <= 0.0 ? 0.0 : min(g * tm, vmax);
    F.live = (tm < 0.0 ? smoothstep(-swell, 0.0, tm) : 1.0) * clamp((uFallF.z * 1.05 - s.w) * 20.0, 0.0, 1.0);
    F.pos = vec3(birth.x, birth.y - fallen, birth.z); F.tau = tm; F.P = Tf; F.h = h0 - fallen;
    fallClear(F);
    return F;
  }`}
`;

/**
 * For the `light` hook of a gouache extension: the paint itself is never brighter than uLifeGlare, and never bright
 * enough to reach the realm's bloom (uLifeBloom): pale paint stays paint, in every light. What shines through it from
 * behind (backlight) is left alone. Declare GLARE_PARS in `fragmentPars` and give the material glareUniforms(ctx, glare).
 */
export const GLARE_PARS = 'uniform float uLifeGlare, uLifeBloom;';
export const glareUniforms = (ctx, glare = 0.86) => ({ uLifeGlare: { value: glare }, uLifeBloom: lifeTime(ctx).uLifeBloom });
export const GLARE_GLSL = /* glsl */`
          #ifdef BACKLIGHT
            vec3 lBack = albedo * uBackColor * through * uBack;
          #else
            vec3 lBack = vec3(0.0);
          #endif
          vec3 lBase = c - lBack; float lTop = max(lBase.r, max(lBase.g, lBase.b)), lCap = max(min(uLifeGlare, uLifeBloom) - max(uEmissive.r, max(uEmissive.g, uEmissive.b)), 0.05);      // (its own lift of light counts too)
          float lKnee = 0.7 * lCap;                                                        // a soft shoulder: what is brighter is still the brighter, so a white rim on a pale plate stays a rim
          if (lTop > lKnee) lBase *= (lKnee + (lCap - lKnee) * (1.0 - exp(-(lTop - lKnee) / (lCap - lKnee)))) / lTop;      // pale paint stays paint: it never sparkles
          c = lBase + lBack;`;

// Turning a card: how it lies in the air. FLUTTER tips about the line across its swing and spins flat; TUMBLE rolls
// about its own length. `land` (1 in the air .. 0 at the water) lays a card flat as it comes down.
const CARD_GLSL = (model, twin) => /* glsl */`
  uniform vec4 uFallS;                     // size, how much sizes differ, how much larger it is drawn far off, and from what distance
  uniform vec4 uFallS2;                    // curl along its length, curl across it, smallest it may be drawn (pixels), its turn rate as a twin
  uniform float uFallPx;                   // pixels to a metre, one metre from the eye, in the pass being drawn
  uniform vec3 uFallPalA[16], uFallPalB[16]; uniform float uFallPalN;
  varying vec3 vFallIn, vFallOut;
  mat3 fallRotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
  mat3 fallRot(vec3 u, float a) {
    float c = cos(a), s = sin(a), k = 1.0 - c;
    return mat3(k * u.x * u.x + c, k * u.x * u.y + s * u.z, k * u.x * u.z - s * u.y, k * u.x * u.y - s * u.z, k * u.y * u.y + c, k * u.y * u.z + s * u.x, k * u.x * u.z + s * u.y, k * u.y * u.z - s * u.x, k * u.z * u.z + c);
  }
  mat3 fallTurn(Fall F, vec4 s) {
${twin ? /* glsl */`
    // a twin has no fall of its own to take its attitude from: it turns over slowly as it goes
    float a = s.w * 40.0 + uLifeNow * uFallS2.w * (0.6 + 0.8 * s.z) * (s.x < 0.5 ? -1.0 : 1.0), b = s.z * 30.0 + uLifeNow * uFallS2.w * 0.7 * (0.6 + 0.8 * s.x);
    return fallRot(vec3(cos(a * 0.37), 0.0, sin(a * 0.37)), 0.9 * sin(b)) * fallRotY(a);` : model === 0 ? /* glsl */`
    float a = F.att.z; vec3 u = vec3(-sin(a), 0.0, cos(a));
    return fallRot(u, F.att.y * F.land) * fallRotY(F.att.x);` : /* glsl */`
    return fallRotY(F.att.x) * fallRot(vec3(1.0, 0.0, 0.0), F.att.z * F.land) * fallRot(vec3(0.0, 0.0, 1.0), F.att.y);`}
  }
`;

// ------------------------------------------------------------------------------------------------ makeFall
const SHAPES = { flake: 0, grain: 1, down: 2, mote: 3, lint: 4, bead: 5 };
export const MAX_SHAFTS = 12;

/**
 * One kind of falling thing. opts (every key of FALL_KINDS[kind] may be overridden too: speed, sway, swings, size...):
 *   kind        'petal' | 'leaf' | 'feather' | 'wing' | 'flake' | 'powder' | 'down' | 'dust' | 'lint' | 'drip'
 *   count       how many are in the field at high quality (0 = no field: bursts or points only). Thinned by the
 *               quality setting and halved with reduced motion, unless `exact`
 *   pool        how many more are kept for bursts (see burst()): as many as can be in the air at once
 *   lasts       seconds after which one of a burst has thinned away, wherever it is (default 0: it stays until it lands).
 *               For things that hang in the air for a minute (seed down), so that a pool need not hold them all
 *   box         [width, ceiling, depth] of the field, metres: it follows the boat, and things falling out of one side
 *               come in at the other. With `centre: [x, z]` it stays in one place instead
 *   mask        a canopyMask: of the field, only those under blossom are born, and they come out at the crown's underside
 *   wind        [x, z] metres a second: what carries them sideways. Change it with handle.wind.set(x, z); it may change
 *               smoothly at any time. Or `air`: a wind from makeWind (ribbons.js), followed at `carry` of its speed
 *   ground      the level they land on (default 0, the water)
 *   points      fixed places that drip or stream: [{ x, y, z, color }] (drip, dust, lint); `per`: instances to a place
 *   shafts      for lint: [{ from: [x, y, z], to: [x, y, z], radius, color, strength }]: it shows only inside these
 *   column      { x, z, radius, seconds, share, rise, lasts }: a column of turning air round an axis (leaves round a trunk):
 *               one turn in `seconds`; `share` of them are lifted `rise` metres for `lasts` seconds on the way
 *   mirror      false (default): not in the water's reflection. true: in it. A number 0..1: that share of them, as a second draw
 *   twin        { kind, within, count, ...its own colours and size }: a second kind drawn ONLY in the mirror from the same
 *               buffers and the same function: where a flake comes down, its twin comes up to meet it at the surface.
 *               `within` (30): metres from the boat inside which there are twins. `count`: about how many twins are out
 *               (default: every one within `within`). Whatever the count, every one of the field that lands near the
 *               boat has its twin; only further off are they a share (handle.twin.userData.twin says what was worked out)
 *   landings    { within, perSecond, share, ring: [strength, radius] | false, onLand(x, z, info) }: the landings near the
 *               boat, found in script: each within `within` metres writes a ring and calls onLand (info: { distance,
 *               onBoat, turn, index, color }), `perSecond` at most; `share` 0..1: only that share of them (one seed in
 *               twenty: 0.05). Pass false for none
 *   settle      a handle from makeFloaters: what lands within `settleWithin` metres is handed to it
 *   colours     inside, outside (cards: lists, one picked per instance); color (points); opacity; backlight; backColor
 *   sky         a colour points take where they are seen against the sky's pale lower band (a snowflake is darker than
 *               a bright sky), or { color, from: 0.03, to: 0.3, overhead: [0.55, 0.85] }: from/to are the sine of the
 *               elevation over which the colour comes in; over `overhead` it goes again, because a snow sky is darkest
 *               at the zenith and flakes read pale against it (overhead: false keeps the colour all the way up)
 *   globe       { radius, color, gain, fill }: points within `radius` of the boat's lit lantern take its light. `fill`: how
 *               many more flakes there are that are seen ONLY by that light, in a small field of their own that goes
 *               with the lantern (snow too fine to see until a lamp is on it: it is what makes the lantern's reach a
 *               globe of gold snow and not a dozen gold flakes; about 400 for a radius of 3.5 m)
 *   scatter     { color, gain, power }: lit only against the light: bright when it hangs between the eye and the sun
 *               (the realm's key light, or `sun: [x, y, z]`, the way TO the light), a dull speck when it does not
 *   keepOut     metres kept clear round the rider's eye (default 0.9; 1.6 with reduced motion)
 *   seed, exact, parent
 * Returns { object, kind, count, pool, wind (THREE.Vector2), density (0..1: how many of the field are out), flow (0..1:
 *   how hard the points stream), burst(spec), sweep(spec), setPoints(list), setShafts(list), settleOn(floaters),
 *   landings (the live settings), uniforms, twin (its object) }.
 */
export function makeFall(ctx, opts = {}) {
  const { kit, engine } = ctx, S = engine.shared;
  const K = FALL_KINDS[opts.kind || 'petal'];
  if (!K) throw new Error(`makeFall: no kind called '${opts.kind}'`);
  const o = { kind: 'petal', count: 0, pool: 0, box: null, centre: null, mask: null, wind: [0, 0], air: null, carry: 0.2, ground: 0, points: null, per: 1, shafts: null, column: null,
    mirror: false, twin: null, landings: {}, settle: null, settleWithin: 10, sky: null, globe: null, keepOut: null, seed: 71, exact: false, parent: null, sun: null, deck: null, ...K, ...opts };
  const model = MODEL[o.model], calm = !!ctx.reducedMotion, rnd = ctx.rng(o.seed);
  const thin = (n) => (o.exact || n <= 0 ? Math.max(0, Math.round(n)) : Math.max(1, Math.round(kit.count(n) * (calm ? 0.5 : 1))));
  const hull = lifeHull(ctx), clock = lifeTime(ctx);
  const speed = pair(o.speed, [0.5, 0.5]), swings = pair(o.swings, [0.2, 0.2]), turns = pair(o.turns, [0, 0]), life = pair(o.life, [2, 4]), every = pair(o.every, [2, 9]);
  const box = o.box || [40, o.ceiling || 16, 40];

  // ---- the instances: the field first, then the fixed points, then the pool for bursts
  const nField = model <= 2 ? thin(o.count) : 0;
  let points = (o.points || []).slice();
  const per = Math.max(1, Math.round(o.per));
  const nPoints = model >= 3 ? (points.length ? (o.count > 0 ? thin(o.count) : points.length * per) : 0) : 0;
  const nPool = model === 4 ? 0 : thin(o.pool);
  const N = Math.max(1, nField + nPoints + nPool);
  const seeds = new Float32Array(N * 4), birth = new Float32Array(N * 4), tint = model >= 3 && o.pointColors !== false ? new Float32Array(N * 3).fill(1) : null;
  for (let i = 0; i < N * 4; i++) seeds[i] = rnd();
  for (let i = 0; i < N; i++) { birth[i * 4 + 1] = -60; birth[i * 4 + 3] = i < nField ? BOX : IDLE; }
  const aSeed = new THREE.InstancedBufferAttribute(seeds, 4), aBirth = new THREE.InstancedBufferAttribute(birth, 4);
  aBirth.setUsage(THREE.DynamicDrawUsage);
  const aTint = tint ? new THREE.InstancedBufferAttribute(tint, 3) : null;
  const palette = (list, d) => { const cs = (list || d).map(col); return Array.from({ length: 16 }, (_, i) => cs[i % cs.length].clone()); };
  const writePoints = () => {
    for (let j = 0; j < nPoints; j++) {
      const i = nField + j, p = points.length ? points[j % points.length] : null;
      birth[i * 4] = p ? p.x : 0; birth[i * 4 + 1] = p ? p.y : -60; birth[i * 4 + 2] = p ? p.z : 0; birth[i * 4 + 3] = p ? POINT : IDLE;
      if (tint) { const c = p && p.color ? col(p.color) : null; tint[i * 3] = c ? c.r : 1; tint[i * 3 + 1] = c ? c.g : 1; tint[i * 3 + 2] = c ? c.b : 1; }
    }
    aBirth.needsUpdate = true; if (aTint) aTint.needsUpdate = true;
  };
  writePoints();

  // ---- uniforms (shared by the main draw, the mirror's share and the twin)
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); blank.needsUpdate = true;
  const wind = new THREE.Vector2(o.wind[0], o.wind[1]);
  const U = {
    uLifeNow: clock.uLifeNow, uCameraPos: S.uCameraPos,
    uFallA: { value: new THREE.Vector4(speed[0], speed[1], box[1], o.ground) },
    uFallB: { value: new THREE.Vector4(o.sway || 0, swings[0], swings[1], o.stall || 0) },
    uFallC: { value: new THREE.Vector4(o.rock || 0, turns[0], turns[1], o.spread || 0) },
    uFallD: { value: new THREE.Vector4(1, o.keepOut ?? (calm ? 1.6 : 0.9), o.deck ?? hull.deck, calm ? 0.5 : 1) },
    uFallE: { value: model === 4 ? new THREE.Vector4(every[0], every[1], 0, 0) : new THREE.Vector4(life[0], life[1], o.slowTo ?? 0.3, o.slow ?? 1) },
    uFallF: { value: new THREE.Vector4(o.turb ?? 0, model === 3 ? (o.grow ?? 1) - 1 : o.swell ?? 0.7, 1, 1 / Math.max(0.05, o.spreadOver ?? 4)) },
    uFallBox: { value: new THREE.Vector4(box[0], box[2], o.centre ? o.centre[0] : 0, o.centre ? o.centre[1] : 0) },
    uFallWind: { value: new THREE.Vector4(0, 0, wind.x, wind.y) },
    uFallCol: { value: new THREE.Vector4(0, 0, 1, 0) }, uFallUp: { value: new THREE.Vector4(0, 0, 4, 0) },
    uFallSweep: { value: new THREE.Vector4(1, 0, 0, 0) }, uFallSweepB: { value: new THREE.Vector4(10, 4, 1, 0) },
    uLifeHull: hull.uniforms.uLifeHull, uLifeHullB: hull.uniforms.uLifeHullB,
    tFallMask: { value: o.mask ? o.mask.texture : blank }, uFallMaskRect: { value: o.mask ? o.mask.rect : new THREE.Vector4(0, 0, 1, 1) },
    uFallMaskB: { value: new THREE.Vector4(o.mask ? 1 : 0, o.mask ? o.mask.ceiling : 1, o.mask ? 1.6 : 0, 0) },
    uFallPx: { value: 800 },
  };
  if (o.column) { const c = o.column; U.uFallCol.value.set(c.x, c.z, c.radius ?? 12, c.seconds ?? 14); U.uFallUp.value.set(c.share ?? 0.25, c.rise ?? 1.2, c.lasts ?? 4, 0); }
  const lasts = model <= 2 && o.lasts > 0 ? o.lasts : 0;        // the longest one of a burst stays in the air (0: until it lands)
  U.uFallUp.value.w = lasts;
  const perPass = (mesh) => {            // point sizes and smallest sizes are in pixels of whatever is being drawn into
    const size = new THREE.Vector2();
    mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
      const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(size).y;
      material.uniforms.uFallPx.value = h * 0.5 * camera.projectionMatrix.elements[5]; material.uniformsNeedUpdate = true;
    };
  };
  const brushed = [];                                      // the smallest a point is drawn follows the realm's brush (see the per-frame work below)
  const group = new THREE.Group(); group.name = `fall:${o.kind}`;
  (o.parent || ctx.group).add(group);
  const layer = (obj, where) => { if (where) ctx.only(obj, where); return obj; };

  // ---- a card kind: a small bent card in gouache, turned and carried in the vertex shader
  const makeCards = (k, count, isTwin, uniforms) => {
    const base = cardGeometry(k.shape), geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; for (const name of ['position', 'normal', 'color']) geo.setAttribute(name, base.attributes[name]);
    geo.setAttribute('aSeed', aSeed); geo.setAttribute('aBirth', aBirth); geo.instanceCount = count;
    const far = k.far || [12, 1], curl = k.curl || [0, 0];
    const Uc = { ...uniforms,
      uFallS: { value: new THREE.Vector4(k.size, k.vary ?? 0.2, far[1], far[0]) }, uFallS2: { value: new THREE.Vector4(curl[0], curl[1], k.minPixels ?? 2, (k.turn ?? 0.5) * TAU) },
      uFallPalA: { value: palette(k.inside, ['#ffffff']) }, uFallPalB: { value: palette(k.outside || k.inside, ['#ffffff']) }, uFallPalN: { value: Math.min(16, (k.inside || ['#fff']).length) },
      uFallTwin: { value: new THREE.Vector4(k.within ?? 1e6, k.core ?? 1e6, k.share ?? 1, 0) }, ...glareUniforms(ctx, k.glare ?? 0.86) };
    const mat = kit.gouache({ color: '#ffffff', side: THREE.DoubleSide, backlight: k.backlight ?? 0.3, backColor: k.backColor ?? '#ffffff', brush: k.brush ?? 0.3, shade: k.shade ?? 0.8,
      vertexColors: true, emissive: k.emissive ?? '#000000', emissiveIntensity: k.emissiveIntensity ?? 1, crisp: !!k.crisp,
      extend: {
        uniforms: Uc,
        vertexPars: CORE(model) + CARD_GLSL(model, isTwin) + 'uniform vec4 uFallTwin;',
        vertexLocal: /* glsl */`
          Fall fF = fallAt(aSeed, aBirth, gl_InstanceID);
          float fSize = uFallS.x * (1.0 + uFallS.y * (aSeed.y * 2.0 - 1.0));
          float fDist = length(fF.pos - uCameraPos);
          fSize *= mix(1.0, uFallS.z, smoothstep(0.5 * uFallS.w, uFallS.w, fDist));
          fSize = max(fSize, uFallS2.z * fDist / uFallPx);                                   // never under a couple of pixels
          ${isTwin ? /* glsl */`
          float fTd = length(fF.pos.xz - uBoat.xz);                                           // all of them near the boat, a share of them further off, none beyond
          float fTp = mix(1.0, uFallTwin.z, smoothstep(0.8 * uFallTwin.y, 1.2 * uFallTwin.y, fTd)) * (1.0 - smoothstep(0.85 * uFallTwin.x, uFallTwin.x, fTd));
          fF.live *= smoothstep(0.0, 0.08, fTp - 0.92 * fract(aSeed.w * 7.77 + aSeed.x));` : ''}
          vec3 fP = position;
          fP.y += (uFallS2.x * fP.z * fP.z + uFallS2.y * abs(fP.x)) * (aSeed.z * 2.0 - 0.6);  // no two are bent alike
          mat3 fR = fallTurn(fF, aSeed);
          transformed = fR * (fP * fSize * fF.live) + fF.pos;
          objectNormal = fR * normal;
          int fK = int(fract(aSeed.z * 5.37 + aSeed.x) * uFallPalN);
          vFallIn = uFallPalA[fK]; vFallOut = uFallPalB[fK];`,
        fragmentPars: `varying vec3 vFallIn, vFallOut; ${GLARE_PARS}`,
        light: GLARE_GLSL,
        // a thin card is lit from whichever side is seen${k.flat ? ', and a folded one shows its fold' : ''}
        albedo: `albedo *= gl_FrontFacing ? vFallIn : vFallOut;${k.flat ? ' N = normalize(cross(dFdx(vWPos), dFdy(vWPos)));' : ''}`,
      } });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = `fall:${isTwin ? 'twin:' : ''}${k.shape}`;
    perPass(mesh);
    return mesh;
  };

  // ---- a point kind: soft points, sized in metres, that take the fog
  const makePoints = (k, count, uniforms) => {
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
    geo.setAttribute('aSeed', aSeed); geo.setAttribute('aBirth', aBirth); if (aTint) geo.setAttribute('aTint', aTint);
    geo.instanceCount = count;
    const shape = SHAPES[k.shape] ?? 0, pal = palette(k.color, ['#ffffff']), sc = k.scatter || null, gl = o.globe || null;
    const sky = !o.sky ? null : (typeof o.sky === 'object' && !o.sky.isColor ? o.sky : { color: o.sky });
    const Up = { ...uniforms, uFogColor: S.uFogColor, uFogDensity: S.uFogDensity, uVeil: S.uVeil, uVeilColor: S.uVeilColor,
      uKeyDir: S.uKeyDir, uLanternPos: S.uLanternPos, uLanternColor: S.uLanternColor, uKeyColor: S.uKeyColor, uRampShadow: S.uRampShadow, uRampLight: S.uRampLight, uSkyLight: S.uSkyLight, uGroundLight: S.uGroundLight,
      uFallLit: { value: k.lit ?? 1 }, uFallMin: { value: k.minPixels ?? 4.5 }, uFallMinA: { value: new THREE.Vector2(k.farAlpha ?? 0.3, k.farLight ?? k.farAlpha ?? 0.3) }, uLifeBloom: clock.uLifeBloom,
      uFallS: { value: new THREE.Vector4(k.size, k.vary ?? 0.3, k.clump ?? 0, k.opacity ?? 0.9) },
      uFallVeil: { value: new THREE.Vector3(k.grain ? k.veil ?? 0.3 : 1, k.grain ? k.grain[0] / k.size : 1, k.grain ? k.grain[1] / (k.opacity ?? 0.9) : 1) },
      uFallPalA: { value: pal }, uFallPalN: { value: Math.min(16, (k.color || ['#fff']).length) },
      uFallSky: { value: new THREE.Vector4(...(sky ? col(sky.color).toArray() : [1, 1, 1]), sky ? 1 : 0) },
      uFallSkyB: { value: new THREE.Vector4(sky ? sky.from ?? 0.03 : 0, sky ? sky.to ?? 0.3 : 1, sky && sky.overhead === false ? 2 : sky && sky.overhead ? sky.overhead[0] : 0.55, sky && sky.overhead === false ? 3 : sky && sky.overhead ? sky.overhead[1] : 0.85) },
      uFallGlobe: { value: new THREE.Vector4(...(gl ? col(gl.color ?? '#FFD79A').toArray() : [1, 1, 1]), gl ? gl.radius ?? 3.5 : 0) }, uFallGlobeB: { value: new THREE.Vector2(gl ? gl.gain ?? 1.6 : 0, gl && gl.only ? 1 : 0) },
      uFallScat: { value: new THREE.Vector4(...(sc && sc.color ? col(sc.color).toArray() : [1, 1, 1]), sc ? sc.gain ?? 1 : 0) },
      uFallScatB: { value: new THREE.Vector4(sc ? sc.power ?? 6 : 1, sc && sc.color ? 1 : 0, o.intensity ?? 1, 0) },
      uFallSun: { value: o.sun ? new THREE.Vector4(...new THREE.Vector3(...o.sun).normalize().toArray(), 1) : new THREE.Vector4(0, 1, 0, 0) },
      uShaftA: { value: Array.from({ length: MAX_SHAFTS }, () => new THREE.Vector4()) }, uShaftB: { value: Array.from({ length: MAX_SHAFTS }, () => new THREE.Vector4()) },
      uShaftC: { value: Array.from({ length: MAX_SHAFTS }, () => new THREE.Vector3()) }, uShaftN: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: Up, transparent: true, depthWrite: false, fog: false, premultipliedAlpha: true,
      vertexShader: /* glsl */`
        uniform vec3 uCameraPos;
        ${CORE(model)}
        uniform vec4 uFallS, uFallSky, uFallSkyB, uFallGlobe, uFallScat, uFallScatB, uFallSun; uniform vec3 uFallVeil, uFogColor; uniform vec2 uFallMinA, uFallGlobeB; uniform float uFallPx, uFallPalN, uFallMin;
        uniform vec3 uFallPalA[16], uKeyDir, uLanternPos, uLanternColor, uKeyColor, uRampShadow, uRampLight, uSkyLight, uGroundLight; uniform float uFallLit, uLifeBloom;
        uniform vec4 uShaftA[${MAX_SHAFTS}], uShaftB[${MAX_SHAFTS}]; uniform vec3 uShaftC[${MAX_SHAFTS}]; uniform int uShaftN;
        ${aTint ? 'attribute vec3 aTint;' : ''}
        varying vec3 vColor, vGlow; varying float vAlpha, vDist, vPx, vSeed; varying vec2 vAxis; varying float vLong;
        void main() {
          Fall F = fallAt(aSeed, aBirth, gl_InstanceID);
          vec4 mv = viewMatrix * vec4(F.pos, 1.0); vDist = length(mv.xyz);
          gl_Position = projectionMatrix * mv;
          float size = uFallS.x * (1.0 + uFallS.y * (aSeed.y * 2.0 - 1.0)) * (fract(aSeed.y * 17.3) < uFallS.z ? 2.0 : 1.0);
          vec3 c = uFallPalA[int(fract(aSeed.z * 5.37 + aSeed.x) * uFallPalN)] * uFallScatB.z;
          ${aTint ? 'c *= aTint;' : ''}
          // it stands in the realm's light as a painted thing does (gouache: its own colour between the shadow and the lit
          // step, seen from every side at once, plus the light of sky and ground), so that a flake, the powder and the
          // snow on the bough are one white; and like all pale paint here it stays under the realm's bloom
          c *= mix(vec3(1.0), 0.25 * uRampShadow + 0.5 + 0.25 * uRampLight * uKeyColor + mix(uGroundLight, uSkyLight, 0.6), uFallLit);
          float top = max(c.r, max(c.g, c.b)); if (uFallLit > 0.0 && top > uLifeBloom) c *= uLifeBloom / top;
          float a = uFallS.w * F.live * F.fade;
          vec3 toIt = (F.pos - uCameraPos) / max(vDist, 1e-3);
          // against a bright sky a pale thing is dark; straight overhead, where a snow sky is darkest, it is pale again
          c = mix(c, uFallSky.rgb, uFallSky.a * smoothstep(uFallSkyB.x, uFallSkyB.y, toIt.y) * (1.0 - smoothstep(uFallSkyB.z, uFallSkyB.w, toIt.y)));
          // lit only against the light: bright when it hangs between the eye and the sun
          vec3 glow = vec3(0.0);
          if (uFallScat.a > 0.0) {
            vec3 sun = uFallSun.w > 0.5 ? uFallSun.xyz : -uKeyDir;
            float fs = pow(max(dot(toIt, sun), 0.0), uFallScatB.x);
            glow = mix(c, uFallScat.rgb, uFallScatB.y) * (uFallScat.a * fs);              // light, added: it does not thin with the speck
          }
          // inside the lantern's reach it takes the lantern's light
          if (uFallGlobe.a > 0.0) {
            float lit = clamp(dot(uLanternColor, vec3(0.6)), 0.0, 1.0);
            float g = (1.0 - smoothstep(0.3 * uFallGlobe.a, uFallGlobe.a, length(F.pos - uLanternPos))) * lit;
            c = mix(c, uFallGlobe.rgb * uFallGlobeB.x, g); a = mix(a, min(1.0, a * 1.3), g);
            if (uFallGlobeB.y > 0.5) a *= g;                                              // (fine snow: seen only where the lantern lights it)
          }
          // seen only where a shaft of light crosses it
          if (uShaftN > 0) {
            vec3 lit = vec3(0.0);
            for (int i = 0; i < ${MAX_SHAFTS}; i++) {
              if (i >= uShaftN) break;
              vec3 ab = uShaftB[i].xyz - uShaftA[i].xyz, ap = F.pos - uShaftA[i].xyz;
              float d = length(ap - ab * clamp(dot(ap, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0));
              lit += uShaftC[i] * (uShaftB[i].w * (1.0 - smoothstep(0.55 * uShaftA[i].w, uShaftA[i].w, d)));
            }
            float most = max(lit.r, max(lit.g, lit.b));
            a *= clamp(most, 0.0, 1.0); c *= lit / max(most, 1e-3); glow += c * min(most, 2.0) * 0.6;
          }
          // a drop is drawn out along its fall
          vLong = ${shape === 5 ? '1.0 + min(F.speed * 0.45, 4.0)' : '1.0'};
          ${model === 3 ? (shape === 1 ? /* glsl */`
          float isVeil = step(fract(aSeed.y * 13.7), uFallVeil.x);       // a puff of the veil, or one of the grains in it
          size *= mix(uFallVeil.y, F.speed, isVeil);                     // (a puff spreads as it thins; a grain does not)
          a *= mix(uFallVeil.z, 1.0, isVeil);` : 'size *= F.speed;') : ''}
          float px = size * vLong * uFallPx / max(0.1, -mv.z);
          // Far off it is drawn no smaller than a few pixels, and fainter instead: a soft dim dot. (A crisp speck of a
          // pixel or two would be wiped away by the painter's filter, which flattens whatever is smaller than its brush.)
          // How small and how faint may a far one be? Only as far as it can still be told from the air behind it.
          // Against pale air of nearly its own value (a lavender flake on a paper sky) it keeps the whole floor the
          // kind asks, in size and in strength, or the painter's filter loses it; against air far from its own value
          // (snow at dusk or at night) it may be two thirds the size and under half as strong. Between here and
          // there it thins by the root of its true size, so that a snowfall has depth and is never a field of
          // equal dots.
          float tell = abs(dot(c, vec3(0.3, 0.55, 0.15)) - dot(uFogColor, vec3(0.3, 0.55, 0.15)));
          float drawn = max(px, uFallMin * mix(1.0, 0.64, smoothstep(0.34, 0.62, tell)) * (0.8 + 0.45 * fract(aSeed.y * 31.7)) * vLong * uFallPx / 780.0);      // (no two the same size, even at the smallest)
          gl_PointSize = min(drawn, 128.0); vPx = gl_PointSize;
          float faint = clamp(uFallMinA.x * 0.34 / max(tell, 0.34), 0.45 * uFallMinA.x, uFallMinA.x), thin = px / drawn;
          a *= clamp(sqrt(thin), faint, 1.0);
          vGlow = glow * F.live * F.fade * clamp(thin, uFallMinA.y, 1.0);
          vec4 up = projectionMatrix * viewMatrix * vec4(F.pos + vec3(0.0, 0.25, 0.0), 1.0);
          vec2 dir = (up.xy / up.w - gl_Position.xy / gl_Position.w) * vec2(projectionMatrix[1][1] / projectionMatrix[0][0], 1.0);
          vAxis = dot(dir, dir) > 1e-10 ? normalize(dir) : vec2(0.0, 1.0);
          vColor = c; vAlpha = a; vSeed = aSeed.z;
          if (a < 0.004 && dot(vGlow, vec3(1.0)) < 0.004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        }`,
      fragmentShader: /* glsl */`
        ${FOG_PARS}
        varying vec3 vColor, vGlow; varying float vAlpha, vDist, vPx, vSeed; varying vec2 vAxis; varying float vLong;
        void main() {
          vec2 q = gl_PointCoord - 0.5; q.y = -q.y; float r = length(q) * 2.0, a = 0.0, dark = 0.0;
          ${shape === 0 ? /* glsl */`
          // a flake: a soft clump, never quite round, and softer the nearer it is (it is out of focus there)
          float th = atan(q.y, q.x), lump = 1.0 + (0.1 * sin(th * 2.0 + vSeed * 40.0) + 0.07 * sin(th * 3.0 + vSeed * 70.0)) * smoothstep(4.0, 12.0, vPx);
          a = smoothstep(1.0, mix(0.35, 0.05, smoothstep(10.0, 48.0, vPx)), r * lump) * mix(1.0, 0.7, smoothstep(14.0, 60.0, vPx));` : shape === 1 ? /* glsl */`
          a = smoothstep(1.0, 0.0, r); a *= a;` : shape === 2 ? /* glsl */`
          // reedmace down: far off a soft speck; near, a soft puff of fine hairs standing up and out from a seed that hangs
          // below it. Never a star: the hairs are many and faint, and the puff is what is seen
          float close = smoothstep(7.0, 22.0, vPx);
          vec2 root = vec2(q.x, q.y + 0.14) * 2.0; float rr = length(root), ang = atan(root.x, root.y);
          float up = smoothstep(-0.55, 0.1, root.y / max(rr, 1e-3));                      // the parachute opens upward
          float puff = smoothstep(1.15, 0.2, rr) * up * 0.5;
          float fine = 0.5 + 0.5 * sin(ang * 23.0 + vSeed * 40.0) * sin(ang * 9.0 + vSeed * 70.0);
          float hairs = puff * (0.55 + 0.45 * fine) + smoothstep(1.0, 0.75, rr) * smoothstep(0.6, 0.95, rr) * up * 0.12;
          float seed = smoothstep(0.17, 0.06, length(vec2(q.x * 1.8, q.y + 0.3)));
          float speck = smoothstep(1.0, 0.15, r);                                         // (far off: a soft round mote with a full middle, so that the painter's filter leaves it)
          dark = seed * close;
          a = mix(speck, max(hairs, seed), close);` : shape === 3 ? /* glsl */`
          a = smoothstep(1.0, 0.0, r); a = a * a * a;` : shape === 4 ? /* glsl */`
          // lint: a short curved fibre, each at its own angle
          float th = vSeed * 31.0, cs = cos(th), sn = sin(th); vec2 p = vec2(q.x * cs - q.y * sn, q.x * sn + q.y * cs) * 2.0;
          float fibre = smoothstep(0.28, 0.0, abs(p.y - 0.35 * p.x * p.x + 0.1)) * smoothstep(1.0, 0.7, abs(p.x));
          float speck = smoothstep(1.0, 0.0, r);
          a = mix(speck * speck, fibre, smoothstep(3.0, 9.0, vPx));` : /* glsl */`
          // a bead with a short tail, lying along the way it falls: the bead below, the tail thinning above it
          vec2 ax = vAxis; float sd = dot(q, vec2(-ax.y, ax.x)) * 2.0 * vLong, hh = (dot(q, ax) * 2.0 + 1.0) * vLong;
          float bead = smoothstep(1.0, 0.6, length(vec2(sd, hh - 1.0)));
          float top = max(2.0 * vLong - 1.0, 1.001), uu = clamp((hh - 1.0) / (top - 1.0), 0.0, 1.0), wd = 0.85 * (1.0 - uu);
          float tail = hh > 1.0 ? smoothstep(wd, wd * 0.4, abs(sd)) * (1.0 - 0.6 * uu) * step(0.02, wd) : 0.0;
          a = max(bead, tail);`}
          float near = smoothstep(0.6, 1.3, vDist), fogged = fogAmount(vDist);
          vec3 light = vGlow * (a * near * (1.0 - fogged) * (1.0 - dark));
          a *= vAlpha * near;
          if (a < 0.004 && dot(light, vec3(1.0)) < 0.004) discard;
          gl_FragColor = vec4(mix(vColor * (1.0 - 0.6 * dark), uFogColor, fogged) * a + light, a);      // (premultiplied: its own colour covers, its light is added)
        }`,
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 4; pts.name = `fall:${k.shape}`;
    perPass(pts);
    brushed.push({ u: Up.uFallMin, base: k.minPixels ?? 4.5 });
    return pts;
  };

  const make = (k, count, isTwin) => (k.draw === 'card' ? makeCards(k, count, isTwin, U) : makePoints(k, count, U));
  let main, mirrorPart = null, twin = null;
  if (o.mirror === true) main = make(o, N, false);
  else {
    main = layer(make(o, N, false), 'direct');
    if (typeof o.mirror === 'number' && o.mirror > 0) { mirrorPart = layer(make(o, Math.max(1, Math.round(N * Math.min(1, o.mirror))), false), 'mirror'); group.add(mirrorPart); }
  }
  group.add(main);
  if (o.twin) {
    // Every one of the field that comes down NEAR the boat has its twin: a flake that lands beside the hull with no
    // petal coming up to meet it gives the lie away. So the twin is drawn for the whole field and shown by distance:
    // all of them inside a core, and beyond it, out to `within`, only a share, so that about `count` are out in all
    // (4,000 of the 15,700 flakes within 30 m: every one within 10.6 m, and one in seven from there to 30 m).
    const tk = { ...FALL_KINDS[o.twin.kind || 'petal'], crisp: false, ...o.twin };      // (the mirror is not painted: nothing to keep out of)
    const all = nField || N, within = Math.min(o.twin.within ?? 30, 0.5 * Math.min(box[0], box[2]));
    const inside = Math.min(all, all * Math.PI * within * within / (box[0] * box[2])), want = o.twin.count ? Math.min(inside, o.twin.count) : inside;
    const core = want >= inside ? within : within * 0.7 * Math.sqrt(want / inside), share = want >= inside ? 1 : clamp(0.51 * want / (inside * (1 - (core / within) ** 2)), 0, 1);
    tk.within = within; tk.core = core; tk.share = share;
    if (!o.twin.shape && tk.shape === 'petal') tk.shape = 'kite';
    twin = layer(make({ ...tk, model: o.model }, all, true), 'mirror');
    twin.userData.twin = { within, core, share, about: Math.round(want) };
    group.add(twin);
  }
  const setShafts = (list) => {
    const m = main.material; if (!m.uniforms.uShaftA) return;
    const n = Math.min(MAX_SHAFTS, (list || []).length);
    for (let i = 0; i < n; i++) {
      const s = list[i], c = col(s.color ?? '#ffffff');
      m.uniforms.uShaftA.value[i].set(s.from[0], s.from[1], s.from[2], s.radius ?? 2); m.uniforms.uShaftB.value[i].set(s.to[0], s.to[1], s.to[2], s.strength ?? 1); m.uniforms.uShaftC.value[i].set(c.r, c.g, c.b);
    }
    m.uniforms.uShaftN.value = n;
  };
  if (o.shafts) setShafts(o.shafts);

  // ---- landings, found in script from the same numbers
  const L = o.landings === false ? null : { within: 12, perSecond: 20, share: 1, ring: o.ring ?? [0.05, 0.12], onLand: null, ...(o.landings || {}) };
  let settle = o.settle, budget = 0, cursor = 0;
  const lastN = new Int32Array(N).fill(-1), rc = [0, 0, 0, 0], m = {}, info = { distance: 0, onBoat: false, turn: 0, index: 0, color: null, kind: o.kind }, loc = {};
  const pend = { n: 0, t: new Float64Array(256), i: new Int32Array(256), x: new Float32Array(256), z: new Float32Array(256), p: new Float32Array(256) };
  const pendPush = (t, i, x = NaN, z = NaN, Pm = 0) => {
    if (pend.n >= pend.t.length) for (const k of ['t', 'i', 'x', 'z', 'p']) { const a = new pend[k].constructor(pend.n * 2); a.set(pend[k]); pend[k] = a; }
    pend.t[pend.n] = t; pend.i[pend.n] = i; pend.x[pend.n] = x; pend.z[pend.n] = z; pend.p[pend.n++] = Pm;
  };
  const W = { x: 0, z: 0 };                                // how far the wind has carried things so far
  const land = (x, z, i, turn) => {
    const boat = ctx.boat, d = Math.hypot(x - boat.x, z - boat.z);
    if (settle && d <= o.settleWithin && !hull.onBoat(x, z)) { ctx.path.locate(x, z, boat.s, loc); if (Math.abs(loc.d) < loc.halfWidth + 1) settle.add(x, z, { turn, seed: seeds[i * 4 + 2] }); }
    if (!L || d > L.within || seeds[i * 4 + 3] * 0.999 + seeds[i * 4] * 0.001 > L.share) return;      // (only a share of them, the same ones every time)
    if (budget < 1) return;
    budget -= 1;
    const onBoat = hull.onBoat(x, z);
    if (L.ring && !onBoat) {
      ctx.path.locate(x, z, boat.s, loc);
      if (Math.abs(loc.d) < loc.halfWidth + 0.5) ctx.water.ripple(x, z, L.ring[0] * (0.7 + 0.6 * seeds[i * 4 + 1]), L.ring[1]);
    }
    if (L.onLand) { info.distance = d; info.onBoat = onBoat; info.turn = turn; info.index = i; info.color = points.length && i >= nField && i < nField + nPoints ? points[(i - nField) % points.length].color || null : null; L.onLand(x, z, info); }
  };
  const wrap = (q, c, b) => ((((q - c + 0.5 * b) % b) + b) % b) - 0.5 * b + c;
  const fieldLanding = (i, t, dtAhead) => {
    // when instance i of the field next lands, and where (the same arithmetic as the shader's, at the end of a fall):
    // queued once for each fall
    const s0 = seeds[i * 4], s1 = seeds[i * 4 + 1], s3 = seeds[i * 4 + 3];
    if (!((U.uFallD.value.x * 1.05 - s3) * 20 > 0.5)) return;
    const v = speed[0] + (speed[1] - speed[0]) * s0, P = box[1] / v, tt = t + s1 * P, n = Math.floor(tt / P), tau = tt - n * P;
    if (!o.mask && P - tau > dtAhead) return;
    rand4(i, n * 64, rc);
    const B = U.uFallBox.value, wv = U.uFallWind.value;
    const qx = wrap(rc[0] * B.x + wv.x, B.z, B.x), qz = wrap(rc[1] * B.y + wv.y, B.w, B.y);
    if (Math.max(Math.abs(qx - B.z) / (0.5 * B.x), Math.abs(qz - B.w) / (0.5 * B.y)) > 0.9) return;
    let x = qx - wind.x * tau, z = qz - wind.y * tau, Pm = P;
    if (o.mask) { o.mask.at(x, z, m); if (m.cover < 0.5) return; Pm = clamp(m.under / v, 0.5, P); }
    const sub = Math.floor(tau / Pm);
    if (sub >= Math.min(Math.floor(P / Pm + 1e-3), 60)) return;
    const left = (sub + 1) * Pm - tau, key = n * 64 + sub;
    if (left > dtAhead || lastN[i] === key) return;
    lastN[i] = key;
    rand4(i, n * 64 + sub + 1, rc);
    x += (rc[0] - 0.5) * U.uFallMaskB.value.z + wind.x * Pm; z += (rc[1] - 0.5) * U.uFallMaskB.value.z + wind.y * Pm;
    if (o.column) {
      const c = o.column, R = c.radius ?? 12, rx = x - c.x, rz = z - c.z, inside = 1 - smooth(0.7 * R, R, Math.hypot(rx, rz));
      const a = TAU * Pm / (c.seconds ?? 14) * inside * U.uFallD.value.w, ca = Math.cos(a), sa = Math.sin(a);
      x = c.x + rx * ca - rz * sa; z = c.z + rx * sa + rz * ca;
    }
    if (L && L.onForesee) L.onForesee(x, z, left);       // (for checking that script and shader agree: the demo marks the place before the thing arrives)
    pendPush(t + left, i, x, z, Pm);
  };
  const burstPlace = (i, tL, out) => {
    const s0 = seeds[i * 4], v = speed[0] + (speed[1] - speed[0]) * s0, Pm = Math.max(birth[i * 4 + 1] - o.ground, 0.05) / v;
    rand4(i, 7, rc);
    const thrown = (o.spread || 0) * Math.sqrt(rc[1]) * (1 - Math.exp(-U.uFallF.value.w * Pm)), a = rc[0] * TAU;
    out.x = birth[i * 4] + U.uFallWind.value.x + Math.cos(a) * thrown; out.z = birth[i * 4 + 2] + U.uFallWind.value.y + Math.sin(a) * thrown; out.Pm = Pm;
    if (o.column) {
      const c = o.column, rx = out.x - c.x, rz = out.z - c.z, inside = 1 - smooth(0.7 * (c.radius ?? 12), c.radius ?? 12, Math.hypot(rx, rz));
      const b = TAU * Pm / (c.seconds ?? 14) * inside * U.uFallD.value.w, cb = Math.cos(b), sb = Math.sin(b);
      out.x = c.x + rx * cb - rz * sb; out.z = c.z + rx * sb + rz * cb;
    }
    return true;
  };
  const dropLanding = (i, t, dtAhead) => {
    const s0 = seeds[i * 4], s1 = seeds[i * 4 + 1], s3 = seeds[i * 4 + 3];
    if (birth[i * 4 + 3] !== POINT || !((U.uFallF.value.z * 1.05 - s3) * 20 > 0.5)) return;
    const h0 = Math.max(birth[i * 4 + 1] - o.ground, 0), Tf = dropTime(h0, speed[1]), swell = o.swell ?? 0.7, P = Math.max(every[0] + (every[1] - every[0]) * s0, Tf + swell + 0.1);
    const tt = t + s1 * P, n = Math.floor(tt / P);
    for (let k = n; k <= n + 1; k++) {
      rand4(i, k, rc);
      const tL = k * P - s1 * P + swell + rc[0] * (P - Tf - swell - 0.05) + Tf;
      if (tL > t && tL - t <= dtAhead && lastN[i] !== k) { lastN[i] = k; pendPush(tL, i, birth[i * 4], birth[i * 4 + 2], 0); }
    }
  };
  const yawAt = (i, Pm) => {
    // how a card lies as it lands (so that the floating thing that takes its place lies the same way)
    const sz = seeds[i * 4 + 2], sw = seeds[i * 4 + 3], sx = seeds[i * 4], k = U.uFallD.value.w, f = (x) => x - Math.floor(x);
    if (model === 0) return sw * 40 + TAU * (turns[0] + (turns[1] - turns[0]) * f(sz * 7.31)) * (sw < 0.5 ? -1 : 1) * (0.5 + 0.5 * k) * Pm;
    if (model === 1) return sw * 40 + TAU * 0.09 * (sx - 0.5) * Pm;
    return sw * 40;
  };
  const place = { x: 0, z: 0, Pm: 0 };

  ctx.onUpdate((dt) => {
    hull.update(ctx);
    const t = ctx.time, boat = ctx.boat;
    if (o.air && o.air.direction) wind.set(o.air.direction.x, o.air.direction.y).multiplyScalar((o.air.speed ?? 2) * (o.air.breeze ?? 1) * o.carry);
    W.x += wind.x * dt; W.z += wind.y * dt;
    U.uFallWind.value.set(W.x, W.z, wind.x, wind.y);
    if (o.follow === 'lantern') { const lp = S.uLanternPos.value; U.uFallBox.value.z = lp.x; U.uFallBox.value.w = lp.z; }
    else if (!o.centre) { U.uFallBox.value.z = boat.x; U.uFallBox.value.w = boat.z; }
    // the painter's filter wipes whatever is smaller than its brush: a point's smallest size follows the realm's brush
    // (look.paintRadius: 4.5 by default, 3.2 in the snow orchard), and with the filter off it may be half as large
    const brush = engine.paintAmount > 0.01 ? clamp((engine.paintRadius || 4.5) / 4.5, 0.5, 1.4) : 0.5;
    for (const b of brushed) b.u.value = b.base * brush;
    if (!L && !settle) return;
    budget = Math.min(budget + (L ? L.perSecond : 30) * dt, Math.max(2, (L ? L.perSecond : 30) * 0.25));
    // look a little ahead for the landings of a share of the field every frame; every instance is seen four times a second
    const ahead = 0.5, share = Math.min(1, dt / 0.25);
    if (model <= 2 && nField) { const n = Math.ceil(nField * share); for (let k = 0; k < n; k++) { fieldLanding(cursor, t, ahead); cursor = (cursor + 1) % nField; } }
    if (model === 4 && nPoints) { const n = Math.ceil(nPoints * share); for (let k = 0; k < n; k++) { dropLanding(nField + cursor, t, ahead); cursor = (cursor + 1) % nPoints; } }
    const reach = Math.max(L ? L.within : 0, settle ? o.settleWithin : 0) + 1;
    for (let k = 0; k < pend.n;) {
      if (pend.t[k] > t) { k++; continue; }
      const i = pend.i[k], tL = pend.t[k], px = pend.x[k], pz = pend.z[k], pp = pend.p[k];
      const e = --pend.n; pend.t[k] = pend.t[e]; pend.i[k] = pend.i[e]; pend.x[k] = pend.x[e]; pend.z[k] = pend.z[e]; pend.p[k] = pend.p[e];
      let ok = true;
      if (px === px) { place.x = px; place.z = pz; place.Pm = pp; }
      else ok = burstPlace(i, tL, place);
      if (ok && Math.abs(place.x - boat.x) < reach && Math.abs(place.z - boat.z) < reach) land(place.x, place.z, i, yawAt(i, place.Pm));
    }
  });

  // ---- bursts
  let head = 0;                                          // the next pool slot to use (the oldest is taken when the pool is full)
  const poolAt = nField + nPoints, tmp = {};
  const ends = new Float64Array(Math.max(1, nPool)).fill(-1e9);      // when each pool slot's present tenant will be out of the air
  let told = false;
  /**
   * Let a number of them go at once, from the pool. spec:
   *   at: [x, y, z] with radius (and `height`: metres of spread up and down)     round one place
   *   disc: { x, z, r, y }                                                      anywhere in a level disc
   *   line: [[x, y, z], [x, y, z]] with radius                                   along a line (a bough, a tier's front)
   *   mask: true                    with `disc`: only under blossom, each from the crown's underside there (times a number
   *                                 between from[0] and from[1], default [0.35, 1]: blossom hangs at every height)
   *   count                         how many (thinned by quality like everything else; `exact: true` for all of them)
   *   over                          seconds over which they let go, evenly; or envelope: [rise, hold, fall] seconds
   *   delay                         seconds before the first;  order: (x, y, z) => extra seconds (from the top down, say)
   * Returns how many were let go. The pool is a ring: size it for everything that can be in the air at once (what is let
   * go in the time one takes to come down: a petal from 5 m is ten seconds in the air, seed down from 2.4 m is eighty),
   * or give makeFall `lasts`: the seconds after which one of a burst has thinned away into the air.
   */
  const burst = (spec = {}) => {
    if (!nPool) return 0;
    const n = Math.min(nPool, spec.exact ? Math.round(spec.count ?? 60) : thin(spec.count ?? 60)), t = ctx.time;
    const env = spec.envelope || null, over = env ? env[0] + env[1] + env[2] : spec.over ?? 1, area = env ? env[0] / 2 + env[1] + env[2] / 2 : 1;
    const when = () => {
      if (!env) return rnd() * over;
      const u = rnd() * area;
      if (u < env[0] / 2) return env[0] * Math.sqrt(u / (env[0] / 2));
      if (u < env[0] / 2 + env[1]) return env[0] + (u - env[0] / 2);
      return env[0] + env[1] + env[2] * (1 - Math.sqrt(Math.max(0, 1 - (u - env[0] / 2 - env[1]) / (env[2] / 2))));
    };
    const from = spec.from || [0.35, 1], start = head;
    let done = 0, early = 0;
    for (let k = 0; k < n; k++) {
      let x, y, z, ok = true;
      if (spec.disc) {
        const d = spec.disc, a = rnd() * TAU, r = Math.sqrt(rnd()) * d.r;
        x = d.x + Math.cos(a) * r; z = d.z + Math.sin(a) * r; y = d.y ?? box[1];
        if (spec.mask && o.mask) { o.mask.at(x, z, tmp); ok = tmp.cover > 0.5; y = tmp.under * (from[0] + (from[1] - from[0]) * rnd()); }
      } else if (spec.line) {
        const [a, b] = spec.line, u = rnd(), r = (spec.radius ?? 0.2), ang = rnd() * TAU, rr = Math.sqrt(rnd()) * r;
        x = a[0] + (b[0] - a[0]) * u + Math.cos(ang) * rr; y = a[1] + (b[1] - a[1]) * u + (rnd() - 0.5) * (spec.height ?? 0.1); z = a[2] + (b[2] - a[2]) * u + Math.sin(ang) * rr;
      } else {
        const p = spec.at || [0, 4, 0], ang = rnd() * TAU, rr = Math.sqrt(rnd()) * (spec.radius ?? 0.3);
        x = p[0] + Math.cos(ang) * rr; y = p[1] + (rnd() - 0.5) * (spec.height ?? 0.3); z = p[2] + Math.sin(ang) * rr;
      }
      const dly = when() + (spec.delay || 0) + (spec.order ? spec.order(x, y, z) : 0);
      if (!ok || !(y > o.ground + 0.05)) continue;
      const i = poolAt + head;
      // (how long it will be in the air: until it lands, or until it has thinned away; a grain of a plume, for its life)
      const high = Math.max(y - o.ground, 0.05), settled = o.slowTo ?? 0.3;
      const air = model <= 2 ? high / (speed[0] + (speed[1] - speed[0]) * seeds[i * 4])
        : Math.min(life[0] + (life[1] - life[0]) * seeds[i * 4], speed[0] >= settled && settled > 0 ? high / settled : Infinity);      // (a grain is never slower than the speed it settles to)
      if (ends[head] > t + (lasts > 0 ? 0.1 * lasts : 0.05)) early++;      // (one that is already thinning away, in the last tenth of its `lasts`, is not missed)
      ends[head] = t + dly + (lasts > 0 ? Math.min(air, lasts) : air);
      head = (head + 1) % nPool;
      // the wind's carrying so far is taken off, so that the shader can add all of it back
      birth[i * 4] = x - W.x - wind.x * dly; birth[i * 4 + 1] = y; birth[i * 4 + 2] = z - W.z - wind.y * dly; birth[i * 4 + 3] = t + dly;
      if (model <= 2 && (L || settle) && !(lasts > 0 && air > lasts)) pendPush(t + dly + air, i);
      done++;
    }
    // The pool is a ring: when it is full the oldest are taken back, and if they were still in the air they vanish
    // between one frame and the next. That is a fault in the picture, so it is said (once): tools/shot.py prints it.
    if (early > 0 && !told) { told = true; console.warn(`INVALID_POOL falls: a burst of '${o.kind}' took ${early} of its pool of ${nPool} back out of the air before they had landed (they vanish at once). Give makeFall a larger \`pool\` (what is let go in the time one takes to come down), or \`lasts\`: seconds after which one of a burst has thinned away.`); }
    // send only what changed
    if (done) {
      if (head > start) aBirth.addUpdateRange((poolAt + start) * 4, (head - start) * 4);
      else { aBirth.addUpdateRange((poolAt + start) * 4, (nPool - start) * 4); if (head > 0) aBirth.addUpdateRange(poolAt * 4, head * 4); }
      aBirth.needsUpdate = true;
    }
    return done;
  };

  /**
   * Send a front across the fixed points: each begins to stream as the line reaches it, goes on for `lasts` seconds
   * and thins over `thins` more (dust from heaps as the wind arrives). spec: { from: [x, z], toward: [x, z], speed,
   * lasts, thins, rise }. sweep(null) takes the front away.
   */
  let sweepState = null;
  const sweep = (spec) => {
    if (!spec) { sweepState = null; U.uFallSweep.value.w = 0; return; }
    const d = new THREE.Vector2(spec.toward[0], spec.toward[1]).normalize();
    sweepState = { nx: d.x, nz: d.y, q0: d.x * spec.from[0] + d.y * spec.from[1], speed: spec.speed ?? 12, t0: ctx.time };
    U.uFallSweepB.value.set(spec.lasts ?? 10, spec.thins ?? 4, spec.rise ?? 1, 0);
  };
  ctx.onUpdate(() => { if (sweepState) { const f = sweepState; U.uFallSweep.value.set(f.nx, f.nz, f.q0 + f.speed * (ctx.time - f.t0), 1 / f.speed); } });

  ctx.onDispose(() => blank.dispose());
  // the globe's own fine snow: flakes too small to be seen until the lantern lights them, in a small field of their
  // own that goes with the lantern. It shares this fall's wind and thins with it
  let fine = null;
  if (o.globe && o.globe.fill > 0 && model <= 2 && o.draw === 'point') {
    const R = o.globe.radius ?? 3.5, side = 2 * R + 1.5;
    fine = makeFall(ctx, { ...opts, count: o.globe.fill, pool: 0, size: 0.6 * o.size, clump: 0, box: [side, Math.min(box[1], R + 3), side], centre: null, follow: 'lantern', globe: { ...o.globe, fill: 0, only: true },
      twin: null, landings: false, settle: null, mirror: false, mask: null, column: null, air: null, wind: [0, 0], seed: o.seed + 7, parent: group });
    fine.wind = wind; ctx.onUpdate(() => fine.uniforms.uFallWind.value.copy(U.uFallWind.value));
  }
  const handle = {
    object: group, kind: o.kind, count: nField, pool: nPool, points: nPoints, wind, uniforms: U, twin, landings: L, mirror: mirrorPart, fine,
    /** How many of the field are out, 0..1 (thin a snowfall along the route; each comes and goes softly). */
    get density() { return U.uFallD.value.x; }, set density(v) { U.uFallD.value.x = clamp(v, 0, 1); if (fine) fine.density = v; },
    /** How hard the fixed points stream or drip, 0..1. */
    get flow() { return U.uFallF.value.z; }, set flow(v) { U.uFallF.value.z = clamp(v, 0, 1); },
    burst, sweep, setShafts,
    /** Give it other fixed points: [{ x, y, z, color }]. */
    setPoints(list) { points = (list || []).slice(); writePoints(); },
    /** Hand what lands near the boat to a floating thing (a handle from makeFloaters). */
    settleOn(floaters, within) { settle = floaters; if (within != null) o.settleWithin = within; return handle; },
  };
  return handle;
}

// ------------------------------------------------------------------------------------------------ snow on boughs
/**
 * One lump of a load of snow: a soft rounded hump one unit long (z), one wide (x), one deep (y), lying on y = 0 with its
 * underside a little below it (it sits ON the limb, never a hair above it). Round in section and rounded at both ends,
 * so that a row of them reads as one scalloped ridge and a falling one as a clod of snow, never a bar. 76 triangles.
 */
export function loafGeometry() {
  const P = [], I = [], sec = [[-0.5, -0.1], [-0.46, 0.36], [-0.28, 0.8], [0, 1], [0.28, 0.8], [0.46, 0.36], [0.5, -0.1], [0, -0.28]], rings = [[-0.5, 0.42], [-0.34, 0.86], [0, 1], [0.34, 0.86], [0.5, 0.42]], n = sec.length;
  // paint: paper white above, lavender beneath (a snow sky lights undersides as brightly as tops: without its lavender
  // underside a load seen from the water against that sky is white on white)
  const C = [];
  for (const [z, k] of rings) for (const [x, y] of sec) { P.push(x * k, y > 0 ? y * (0.5 + 0.5 * k) : y * k, z); const u = smooth(0.55, -0.15, y); C.push(1 - 0.27 * u, 1 - 0.29 * u, 1 - 0.13 * u); }
  for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < n; i++) { const a = r * n + i, b = r * n + (i + 1) % n, c = a + n, d = b + n; I.push(a, c, b, b, c, d); }
  for (let i = 1; i < n - 1; i++) { I.push(0, i, i + 1); const e = (rings.length - 1) * n; I.push(e, e + i + 1, e + i); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}

/**
 * Loads of snow lying along boughs. When one is released it cracks along its crest, peels off its limb from one end to
 * the other, each lump rolling over to the heavier side, falling as things fall and crumbling as it goes; within three
 * metres it is powder (a burst of the `powder` fall), which comes down as a curtain, slows and thins. Nothing solid ever
 * reaches the boat. opts:
 *   loads      [{ from: [x, y, z], to: [x, y, z], width, depth, side, peel }]  each along the top of a limb, end to end;
 *              width (default 0.3) and depth (0.16) of the ridge; side: +1 or -1, the side it rolls off (default:
 *              either); peel: seconds the release takes to run from `from` to `to` (default 0.16 s a metre, 1.4 at most:
 *              give 1.6 for one long slide toward a bough's tip)
 *   powder     a fall of kind 'powder' (makeFall) to burst into, which several sets of loads may share; or options for
 *              the one that is made if you give none ({ globe, sky }: the same as the snowfall's, so that powder turns
 *              gold in the lantern's reach as the flakes do);  grains: its pool
 *   perMetre   grains of powder to a metre of load (default 110)
 *   color, shade, glare   the snow's own (default paper white with a lift of its own light; never bright enough to bloom)
 *   onRelease  (index, load) when one starts to go (the whump). `load.clear` is how many seconds later the last of it
 *              has left the limb, which is when the bough should spring up (the bough is the tree's own to move);
 *              onLand(x, z, strength) when its powder reaches the water (rings are written for you: `rings: false` to
 *              do it yourself)
 * Returns { object, count, loads, powder, release(index, delay), releaseAll({ over, order }), reset(), clear() }.
 *   releaseAll   order: 'top' (the highest first, default), 'out' (from the first load's place outward) or (load, i) => 0..1
 */
export function makeSlabs(ctx, opts = {}) {
  const { kit } = ctx;
  const o = { loads: [], powder: null, grains: null, perMetre: 110, color: '#F3ECE8', shade: 0.7, onRelease: null, onLand: null, rings: true, seed: 29, parent: null, ...opts };
  const rnd = ctx.rng(o.seed), clock = lifeTime(ctx), calm = !!ctx.reducedMotion;
  // every load is a row of lumps that overlap into one scalloped ridge, each with a shape of its own
  const pieces = [], loads = o.loads.map((l, i) => {
    const a = new THREE.Vector3(...l.from), b = new THREE.Vector3(...l.to), len = a.distanceTo(b), n = Math.max(1, Math.round(len / 0.42)), side = l.side || (rnd() < 0.5 ? -1 : 1);
    const peel = l.peel ?? Math.min(1.4, 0.16 * len);
    // (clear: seconds after its release by which the last of it has left the limb: the moment for the bough to spring up)
    const load = { index: i, a, b, len, width: l.width ?? 0.3, depth: l.depth ?? 0.16, side, peel, clear: peel + 1.2, first: pieces.length, n, released: false };
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n;
      pieces.push({ load, u, len: len / n * (1.3 + 0.25 * rnd()), wide: load.width * (0.82 + 0.38 * rnd()), deep: load.depth * (0.75 + 0.5 * rnd()), lag: u * load.peel + rnd() * 0.2, seed: rnd() });
    }
    return load;
  });
  const N = Math.max(1, pieces.length), A = new Float32Array(N * 4), B = new Float32Array(N * 4), C = new Float32Array(N * 4);
  pieces.forEach((p, i) => {
    const L = p.load, c = L.a.clone().lerp(L.b, p.u), d = L.b.clone().sub(L.a).normalize();
    A.set([c.x, c.y, c.z, Math.atan2(d.x, d.z)], i * 4);                     // where it lies, and which way the limb runs
    B.set([p.len, p.wide, p.deep, IDLE], i * 4);                             // its size, and when its load was let go
    C.set([p.seed, L.side, Math.asin(clamp(d.y, -1, 1)), p.lag], i * 4);     // a random number, the side it goes, the limb's slope, how late it follows
  });
  const geo = new THREE.InstancedBufferGeometry(), base = loafGeometry();
  geo.index = base.index; for (const name of ['position', 'normal', 'color']) geo.setAttribute(name, base.attributes[name]);
  const aB = new THREE.InstancedBufferAttribute(B, 4); aB.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aSlabA', new THREE.InstancedBufferAttribute(A, 4)); geo.setAttribute('aSlabB', aB); geo.setAttribute('aSlabC', new THREE.InstancedBufferAttribute(C, 4));
  geo.instanceCount = pieces.length;
  const mat = kit.gouache({ color: o.color, shade: o.shade, brush: 0.3, emissive: o.color, emissiveIntensity: 0.08, vertexColors: true,
    extend: {
      uniforms: { uLifeNow: clock.uLifeNow, ...glareUniforms(ctx, o.glare ?? 0.9) }, fragmentPars: GLARE_PARS, light: GLARE_GLSL,
      vertexPars: /* glsl */`
        attribute vec4 aSlabA, aSlabB, aSlabC; uniform float uLifeNow;
        mat3 slabRot(vec3 u, float a) { float c = cos(a), s = sin(a), k = 1.0 - c;
          return mat3(k * u.x * u.x + c, k * u.x * u.y + s * u.z, k * u.x * u.z - s * u.y, k * u.x * u.y - s * u.z, k * u.y * u.y + c, k * u.y * u.z + s * u.x, k * u.x * u.z + s * u.y, k * u.y * u.z - s * u.x, k * u.z * u.z + c); }`,
      vertexLocal: /* glsl */`
        // a soft lump, no two alike
        vec3 sP = position * vec3(aSlabB.y, aSlabB.z, aSlabB.x);
        sP.y *= 1.0 + 0.22 * sin(position.z * 5.0 + aSlabC.x * 40.0); sP.x *= 1.0 + 0.12 * sin(position.z * 4.0 + aSlabC.x * 70.0);
        float sT = uLifeNow - aSlabB.w - aSlabC.w, sR = 0.5 * aSlabB.y;                  // seconds since it was let go; the limb it lies on is about as thick as it is wide
        float sRoll = 0.0, sFall = 0.0, sOut = 0.0, sGone = 0.0, sSpin = 0.0;
        if (aSlabB.w < 5.0e8 && sT > 0.0) {
          // it cracks and settles a little (0.4 s), rolls round the limb to its heavier side (0.6 s, gathering speed), comes
          // away, and falls as a clod falls (the air holds loose snow back a little: 8.4 m/s2), turning over and crumbling
          float crack = smoothstep(0.0, 0.4, sT), go = max(sT - 0.4, 0.0), away = max(go - 0.62, 0.0);
          sRoll = aSlabC.y * min(0.14 * crack + 2.6 * go * go, 1.15 + 3.2 * away);
          sFall = 4.2 * away * away + 0.6 * away; sOut = aSlabC.y * 0.5 * away;
          sGone = smoothstep(0.25, 2.8, sFall);
          sSpin = away * (1.2 + 3.0 * aSlabC.x) * (fract(aSlabC.x * 7.3) < 0.5 ? -1.0 : 1.0);
          // in the air it is no longer a smooth loaf: every corner of it crumbles at its own rate, and a long lump breaks short
          float sCr = smoothstep(0.0, 0.4, away), sH = fract(sin(dot(position, vec3(12.9898, 78.233, 37.719)) + aSlabC.x * 91.7) * 43758.5453);
          sP *= 1.0 - sCr * (0.2 + 0.55 * sH); sP.z *= 1.0 - 0.4 * sCr;
        }
        vec3 sAxis = vec3(0.0, 0.0, 1.0), sN = normal;
        sP *= 1.0 - sGone;
        if (sSpin != 0.0) { mat3 sm = slabRot(vec3(1.0, 0.0, 0.0), sSpin); vec3 sC = vec3(0.0, 0.4 * aSlabB.z, 0.0) * (1.0 - sGone); sP = sm * (sP - sC) + sC; sN = sm * sN; }   // end over end, about its own middle
        sP = slabRot(sAxis, -sRoll) * (sP + vec3(0.0, sR, 0.0)) - vec3(0.0, sR, 0.0);     // about the middle of the limb under it
        sP.x += sOut;
        // onto the limb: along it, tipped to its slope
        float sy = aSlabA.w, sc = cos(sy), ss = sin(sy);
        sP = slabRot(vec3(1.0, 0.0, 0.0), -aSlabC.z) * sP;
        sN = slabRot(vec3(1.0, 0.0, 0.0), -aSlabC.z) * (slabRot(sAxis, -sRoll) * sN);
        transformed = vec3(sc * sP.x + ss * sP.z, sP.y - sFall, -ss * sP.x + sc * sP.z) + aSlabA.xyz;
        objectNormal = vec3(sc * sN.x + ss * sN.z, sN.y, -ss * sN.x + sc * sN.z);`,
    } });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'fall:slabs';
  (o.parent || ctx.group).add(mesh);
  const total = loads.reduce((s, l) => s + l.len, 0);
  // (a fall of the area's own, or one made here: with the area's options for it, so that it takes the lantern's gold and the sky's grey as the flakes do)
  const powder = o.powder && o.powder.burst ? o.powder
    : makeFall(ctx, { kind: 'powder', pool: o.grains ?? Math.min(30000, Math.ceil(total * o.perMetre * 1.2) + 200), seed: o.seed + 1, parent: o.parent, ...(o.powder || {}) });
  const events = [];                                      // rings and callbacks to come: [time, x, z, strength]
  const release = (index, delay = 0) => {
    const L = loads[index]; if (!L || L.released) return;
    L.released = true;
    const t = ctx.time + delay;
    for (let k = 0; k < L.n; k++) { B[(L.first + k) * 4 + 3] = t; }
    aB.addUpdateRange(L.first * 4, L.n * 4); aB.needsUpdate = true;
    // the powder leaves where the lumps come apart, a little under the limb and to the side they go, each stretch of
    // the load as the release reaches it, over most of a second
    const drop = 0.45, a = [L.a.x, L.a.y - drop, L.a.z], b = [L.b.x, L.b.y - drop, L.b.z], dx = (L.b.x - L.a.x) / L.len, dz = (L.b.z - L.a.z) / L.len, dy = (L.b.y - L.a.y) / L.len;
    const along = (x, y, z) => clamp(((x - a[0]) * dx + (y - a[1]) * dy + (z - a[2]) * dz) / L.len, 0, 1) * L.peel;
    powder.burst({ line: [a, b], radius: L.width * 0.9, height: 0.5, count: Math.round(L.len * o.perMetre), over: 0.9, delay: delay + 1.0, order: along });
    const h = Math.max(0.2, Math.min(L.a.y, L.b.y)), tFall = 1.2 + h / 2.3;                 // its heaviest part comes down at a little over two metres a second
    for (let k = 0; k < 3; k++) { const u = (k + 0.5) / 3; events.push([t + tFall + u * L.peel + k * 0.07, L.a.x + (L.b.x - L.a.x) * u + L.side * 0.4, L.a.z + (L.b.z - L.a.z) * u, clamp(0.35 + 0.25 * L.len, 0.4, 1.0)]); }
    events.push([t, NaN, index, 0]);
  };
  ctx.onUpdate(() => {
    const t = ctx.time;
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i]; if (e[0] > t) continue;
      events.splice(i, 1);
      if (e[1] !== e[1]) { if (o.onRelease) o.onRelease(e[2], loads[e[2]]); continue; }
      if (o.rings) ctx.water.ripple(e[1], e[2], e[3], 0.5);
      if (o.onLand) o.onLand(e[1], e[2], e[3]);
    }
  });
  return {
    object: mesh, count: loads.length, loads, powder, release,
    /** Let them all go over `over` seconds (9; 16 with reduced motion, the snow orchard's number): from the top down by default, slowly at first and most of them late. */
    releaseAll({ over = calm ? 16 : 9, order = 'top' } = {}) {
      const ys = loads.map((l) => Math.max(l.a.y, l.b.y)), y0 = Math.min(...ys), y1 = Math.max(...ys), c = loads[0] ? loads[0].a : new THREE.Vector3();
      const ds = loads.map((l) => Math.hypot((l.a.x + l.b.x) / 2 - c.x, (l.a.z + l.b.z) / 2 - c.z)), d1 = Math.max(1e-3, ...ds);
      loads.forEach((l, i) => {
        const u = typeof order === 'function' ? order(l, i) : order === 'out' ? ds[i] / d1 : (y1 - ys[i]) / Math.max(1e-3, y1 - y0);
        release(i, over * clamp(0.75 * Math.sqrt(u) + 0.25 * rnd(), 0, 1));            // the square root gathers most of them toward the end
      });
    },
    /** Put every load back on its bough (for a realm entered again). */
    reset() { for (const l of loads) l.released = false; for (let i = 0; i < pieces.length; i++) B[i * 4 + 3] = IDLE; aB.clearUpdateRanges(); aB.needsUpdate = true; events.length = 0; },
    /** Take every load off at once, with no show: the boughs are bare (the `settle` of a moment that is already past). */
    clear() { for (const l of loads) l.released = true; for (let i = 0; i < pieces.length; i++) B[i * 4 + 3] = -1e5; aB.clearUpdateRanges(); aB.needsUpdate = true; events.length = 0; },
  };
}
