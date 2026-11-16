// Small birds in numbers: swifts, swallows, starlings and their murmuration, storm petrels, waxwings, bats, and the
// far forms of a tern and a flamingo. docs/life/birds.md is the manual (the real animals, every option, staging,
// cost); src/realms/lifetest/birds.js is the demo (/?realm=lifetest&w=birds).
//
//   import { makeFlock, makeMurmuration } from '../engine/life/birds.js';
//   const swifts = makeFlock(ctx, { species: 'swift', count: 12, route: [[x, y, z], ...] });        // a party on a closed route
//   const wax = makeFlock(ctx, { species: 'waxwing', count: 9, perches: [...] });                    // perch, flit, lift
//   const flock = makeMurmuration(ctx, { count: 16000, path: [[x, y, z], ...], mirror: { count: 4000 } });
//
// One bird is one small mesh: a body with real thickness, two wings each of two planes (arm and hand) hinged at the
// shoulder and at the wrist, a tail in two halves that spreads and forks. It is built here in code, so that every
// point knows which part it belongs to; the pose is made in the vertex shader (an extension of the ride's gouache
// material, so a bird takes the realm's light, fog and veil like everything else). One draw call per flock and form.
//
// Bird space: +Z is forward (the bill), +Y is up (the back), +X is the bird's own left. The origin is between the
// shoulders. Metres. In its rest pose the wings are spread flat and the tail is closed.
import * as THREE from 'three';
import { CRISP_ALPHA } from '../gouache.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180, G = 9.81;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const wrapPi = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
/** The options that were really given: one passed as `undefined` (a realm's `x: cond ? 5 : undefined`) leaves the default standing. */
const given = (options) => { const out = {}; for (const k in options) if (options[k] !== undefined) out[k] = options[k]; return out; };
const _c = new THREE.Color();
const rgb = (hex) => { _c.set(hex); return [_c.r, _c.g, _c.b]; };                // linear working-space values, as the ride's vertex paint is stored

// =====================================================================================================================
// The species. Every number is a measurement of the living bird (docs/life/birds.md, section 1), in metres and degrees.
//   ref        wingspan: what `minPixels` is measured against, and the reach of the keep-out
//   body       nose [z, y]; rings [z, half width, up, down, centre y] from the head back; tail [z, y] (where the body ends)
//   wing       y of the wing plane; root, wrist: [x, leading edge z, trailing edge z]; hand: [[t, x, le, te], ...] to the tip
//              (t = 0..1 along the hand); split: where the coverts end and the flight feathers begin, 0..1 of the chord
//   tail       base [z, y, half width]; tips [[x, z, weight], ...] from the outer feather in (weight: how far it swings
//              when the tail spreads); notch [z] on the centre line; spread: degrees the outer feather opens; far: how many
//              of the tips the far form keeps (1; a swallow 3: its fork must show far off)
//   stroke     rate (beats a second); up, down (degrees the arm reaches above and below level); frac (share of the beat
//              that is downstroke); lag (how late the hand follows, in beats); gain (how far the hand trails); flex
//              (degrees the wrist flexes on the upstroke: the hand swings back and the arm draws in by about half as
//              much); bob (metres the body is lifted by each downstroke)
//   glide      dihedral (degrees the gliding wing is held above level), hand, arm (degrees swept back at wrist and shoulder)
//   fold       how a wing shuts: arm (degrees the arm is swept back), shrink (how far the wrist comes in to the shoulder),
//              rest (degrees the shut blade tips down onto the flank); hand (degrees the hand turns back) is worked out
//              from the wing's outline so that its leading edge lies straight back along the body, unless given
//   rhythm     'glide' (flicker, then glide on stiff wings), 'bound' (whirr, then shut wings for an instant) or 'steady';
//              flap: [min, max] beats or seconds; rest: [min, max] seconds
//   speed      [slow, fast] m/s; bank: the steepest bank, degrees; silhouette: 0..1, how far the bird darkens when it is
//              small in the picture (a pale bird far off against the sky is a dark shape, not a grey one)
//   paint      colours (sRGB hex)
// =====================================================================================================================
export const SPECIES = {
  swift: {
    ref: 0.42,
    body: { nose: [0.056, 0.001], rings: [[0.050, 0.0095, 0.008, 0.007, 0.002], [0.038, 0.0155, 0.0125, 0.011, 0.002], [0.016, 0.0175, 0.014, 0.013, 0.001], [-0.012, 0.018, 0.016, 0.016, 0], [-0.036, 0.0148, 0.012, 0.013, 0], [-0.056, 0.0105, 0.007, 0.008, 0.001]], tail: [-0.068, 0.002], far: [1, 3, 4], grain: 3 },
    wing: { y: 0.004, root: [0.012, 0.020, -0.030], wrist: [0.058, 0.028, -0.026], hand: [[0.25, 0.098, 0.021, -0.031], [0.5, 0.136, 0.002, -0.041], [0.75, 0.172, -0.028, -0.058], [0.92, 0.198, -0.059, -0.076], [1, 0.210, -0.084, -0.086]], split: 0.5 },
    tail: { base: [-0.058, 0.003, 0.0115], tips: [[0.0125, -0.113, 1], [0.008, -0.101, 0.6], [0.0035, -0.093, 0.25]], notch: -0.090, spread: 22 },
    stroke: { rate: 8, up: 22, down: -28, frac: 0.55, lag: 0.08, gain: 0.9, flex: 10, bob: 0.003 },
    glide: { dihedral: -7, hand: 9, arm: -3 }, fold: { arm: 6, shrink: 0.8, rest: -25 },
    rhythm: { kind: 'glide', flap: [4, 7], rest: [0.8, 2.0] }, speed: [10, 15], bank: 70,
    paint: { top: '#2c2622', belly: '#2e2824', throat: '#6e645b', throatUp: -0.3, throatZ: 0.044, wingTop: '#28221f', wingTrail: '#2e2824', wingUnder: '#3a332e', wingUnderTrail: '#4a423b', tail: '#27211e', tailUnder: '#3a332e' },
  },
  swallow: {
    ref: 0.33,
    body: { nose: [0.050, 0.000], rings: [[0.045, 0.0055, 0.0055, 0.005, 0.001], [0.038, 0.0105, 0.0095, 0.0085, 0.001], [0.029, 0.0128, 0.011, 0.0095, 0.001], [0.010, 0.015, 0.0125, 0.012, 0], [-0.012, 0.016, 0.014, 0.014, 0], [-0.034, 0.012, 0.010, 0.011, 0], [-0.050, 0.0085, 0.005, 0.006, 0.001]], tail: [-0.060, 0.002], far: [2, 4, 5], grain: 4, head: 0.029, neck: 0.010 },
    wing: { y: 0.004, root: [0.011, 0.016, -0.034], wrist: [0.060, 0.026, -0.024], hand: [[0.3, 0.095, 0.016, -0.030], [0.6, 0.128, -0.004, -0.040], [0.85, 0.152, -0.026, -0.048], [1, 0.165, -0.045, -0.050]], split: 0.45 },
    // the tail is one deep fork: the feathers lengthen evenly from the short middle pair (3.8 cm) to the outer pair (8.4 cm), whose last
    // 3 cm are the streamers, tapering to nothing. (It was a 5 cm plank with two prongs stuck on its corners: a tuning fork.)
    tail: { base: [-0.050, 0.003, 0.0098], tips: [[0.0100, -0.136, 1], [0.0060, -0.108, 0.62], [0.0030, -0.097, 0.3]], notch: -0.090, spread: 36, far: 3 },
    stroke: { rate: 5, up: 35, down: -40, frac: 0.55, lag: 0.14, gain: 1.0, flex: 30, bob: 0.004 },
    glide: { dihedral: 4, hand: 25, arm: -6 }, fold: { arm: 6, shrink: 0.8, rest: -25 },
    rhythm: { kind: 'glide', flap: [4, 6], rest: [0.5, 1.4] }, speed: [9, 11], bank: 65,
    // chestnut on the forehead and on the chin and throat only (the first two rings of the head), then the dark breast band, then cream:
    // carried further back it was a robin's red breast. Seen from above nothing of the cream shows (topDown: where the back's colour ends)
    paint: { top: '#1C2244', belly: '#EBD9B4', topDown: -0.2, forehead: '#8C3A28', foreheadZ: 0.042, foreheadUp: 0.6, throat: '#8C3A28', throatUp: -0.3, throatZ: 0.034, cheek: '#1C2244', band: '#1a1f3a', bandZ: [0.004, 0.034], wingTop: '#1b2040', wingTrail: '#171b34', wingUnder: '#e2cfab', wingUnderTrail: '#3d3c4c', tail: '#181c36', tailUnder: '#33333f', bill: '#15161f' },
    perch: { posture: 35, feet: [-0.016, -0.014], wrist: 0.020, tip: -0.100, tipY: 0.012, cross: 0.004, fluff: 0.35, drop: 0.3 },     // (drop: metres it falls off its perch, head first, before it flies)
  },
  starling: {
    ref: 0.38,
    body: { nose: [0.076, 0], rings: [[0.060, 0.006, 0.006, 0.006, 0], [0.044, 0.016, 0.015, 0.013, 0.002], [0.018, 0.022, 0.020, 0.019, 0], [-0.014, 0.026, 0.023, 0.024, -0.001], [-0.048, 0.022, 0.017, 0.019, 0], [-0.076, 0.0145, 0.009, 0.011, 0.002]], tail: [-0.090, 0.003], far: [1, 3, 4], grain: 3, neck: 0.028 },
    wing: { y: 0.005, root: [0.018, 0.030, -0.045], wrist: [0.085, 0.040, -0.032], hand: [[0.35, 0.125, 0.027, -0.036], [0.7, 0.162, 0.004, -0.039], [0.9, 0.181, -0.018, -0.039], [1, 0.190, -0.035, -0.038]], split: 0.45 },
    tail: { base: [-0.078, 0.004, 0.0145], tips: [[0.019, -0.127, 1], [0.012, -0.130, 0.6], [0.005, -0.130, 0.25]], notch: -0.129, spread: 30 },
    stroke: { rate: 11, up: 46, down: -42, frac: 0.52, lag: 0.12, gain: 1.0, flex: 32, bob: 0.003 },
    glide: { dihedral: 2, hand: 20, arm: -4 }, fold: { arm: 6, shrink: 0.8, rest: -25 },
    rhythm: { kind: 'bound', flap: [0.34, 0.46], rest: [0.13, 0.17] }, speed: [10, 20], bank: 60,
    paint: { top: '#2A1E2C', belly: '#2e2230', throat: '#2A1E2C', wingTop: '#281c2a', wingTrail: '#2c2030', wingUnder: '#3a2e3a', wingUnderTrail: '#463a46', tail: '#261a28', tailUnder: '#382c38', bill: '#5c4a38' },
    perch: { posture: 42, feet: [-0.026, -0.020], wrist: 0.022, tip: -0.105, tipY: 0.014, cross: 0.003, fluff: 0.3 },      // (the bend of the shut wing lies behind the neck: on it, it stood up as a spike when the head nodded)
  },
  petrel: {
    ref: 0.38,
    body: { nose: [0.052, 0], rings: [[0.042, 0.005, 0.005, 0.005, 0], [0.030, 0.0125, 0.012, 0.010, 0.001], [0.010, 0.016, 0.014, 0.013, 0], [-0.012, 0.017, 0.015, 0.015, 0], [-0.034, 0.014, 0.011, 0.012, 0], [-0.052, 0.008, 0.006, 0.007, 0.001]], tail: [-0.062, 0.002], far: [1, 3, 4], grain: 3 },
    wing: { y: 0.004, root: [0.012, 0.018, -0.038], wrist: [0.072, 0.030, -0.030], hand: [[0.35, 0.115, 0.020, -0.036], [0.7, 0.155, 0.000, -0.040], [0.9, 0.178, -0.018, -0.040], [1, 0.190, -0.031, -0.038]], split: 0.5 },
    tail: { base: [-0.055, 0.003, 0.008], tips: [[0.014, -0.106, 1], [0.009, -0.108, 0.6], [0.004, -0.108, 0.25]], notch: -0.107, spread: 32 },
    legs: { hip: [0.006, -0.011, -0.028], length: 0.046, foot: 0.014, hidden: true },
    stroke: { rate: 5.5, up: 36, down: -34, frac: 0.52, lag: 0.2, gain: 1.0, flex: 20, bob: 0.004 },
    glide: { dihedral: -8, hand: 12, arm: -3 }, fold: { arm: 6, shrink: 0.8, rest: -25 },
    rhythm: { kind: 'steady' }, speed: [0.5, 9], bank: 55,
    paint: { top: '#1f1b22', belly: '#221e25', throat: '#1f1b22', rump: '#d6d3cd', rumpZ: [-0.064, -0.034], wingTop: '#2a252b', wingTrail: '#1c181e', wingUnder: '#77706f', wingUnderTrail: '#2a252b', tail: '#19161c', tailUnder: '#221e25', legs: '#17141a' },
  },
  waxwing: {
    ref: 0.33,
    body: { nose: [0.070, 0.002], rings: [[0.060, 0.006, 0.006, 0.005, 0.002], [0.044, 0.017, 0.016, 0.013, 0.003], [0.020, 0.022, 0.019, 0.019, 0], [-0.012, 0.027, 0.023, 0.025, -0.001], [-0.044, 0.022, 0.017, 0.020, 0], [-0.070, 0.0145, 0.008, 0.010, 0.002]], tail: [-0.082, 0.003], far: [1, 3, 4], grain: 3 },
    crest: { front: [0.056, 0.013], back: [0.030, 0.018], tip: [0.012, 0.030], halfWidth: 0.008 },
    wing: { y: 0.005, root: [0.020, 0.028, -0.040], wrist: [0.075, 0.036, -0.028], hand: [[0.35, 0.110, 0.024, -0.032], [0.7, 0.142, 0.002, -0.034], [1, 0.165, -0.022, -0.030]], split: 0.45 },
    tail: { base: [-0.072, 0.004, 0.014], tips: [[0.018, -0.127, 1], [0.012, -0.130, 0.6], [0.005, -0.130, 0.25]], notch: -0.129, spread: 30, band: -0.119 },
    stroke: { rate: 9, up: 32, down: -30, frac: 0.52, lag: 0.12, gain: 1.0, flex: 30, bob: 0.003 },
    glide: { dihedral: 2, hand: 20, arm: -4 }, fold: { arm: 6, shrink: 0.8, rest: -25 },
    rhythm: { kind: 'bound', flap: [0.42, 0.6], rest: [0.12, 0.16] }, speed: [9, 13], bank: 55, silhouette: 0.8,
    paint: { top: '#8f7d7a', belly: '#A9958F', head: '#b08a78', mask: '#14111E', maskUp: [-0.35, 0.55], maskZ: 0.040, throat: '#14111E', throatUp: -0.45, throatZ: 0.046, armEdge: '#e9e4de', handEdge: '#cdae5c', rump: '#8b8894', rumpZ: [-0.074, -0.046], vent: '#7d3f2c', wingTop: '#7a6e6c', wingTrail: '#2c2832', handTop: '#1c1a22', wingUnder: '#9a9298', wingUnderTrail: '#77707a', tail: '#3a3640', tailTip: '#D9B24C', tailUnder: '#4a4650', wax: '#A8242A', bar: '#e9e4de', edge: '#D9B24C' },
    perch: { posture: 58, feet: [-0.0325, -0.016], wrist: 0.026, tip: -0.108, tipY: 0.014, cross: 0.003 },
    // perched it is seen at 5 to 20 m and studied: a fuller body of its own, plump and round-headed, with a short bill
    perchBody: { nose: [0.070, 0.004], rings: [[0.064, 0.0052, 0.0048, 0.0042, 0.004], [0.058, 0.0138, 0.0130, 0.0105, 0.005], [0.048, 0.0200, 0.0190, 0.0160, 0.005], [0.034, 0.0228, 0.0200, 0.0195, 0.003],
      [0.014, 0.0275, 0.0235, 0.0270, 0], [-0.012, 0.0315, 0.0255, 0.0315, -0.002], [-0.042, 0.0265, 0.0195, 0.0255, -0.001], [-0.066, 0.0150, 0.0105, 0.0135, 0.002]], tail: [-0.080, 0.004], head: 0.048, neck: 0.030, sides: 10,
      maskUp: [9, 9], eyeStripe: [[0.0655, 78, 104], [0.055, 66, 98], [0.045, 56, 80], [0.036, 50, 62]], throatZ: 0.052, ventZ: -0.050, crest: { front: [0.061, 0.0175], back: [0.034, 0.0225], tip: [0.012, 0.036], halfWidth: 0.010 } },
  },
  bat: {
    ref: 0.28,
    body: { nose: [0.030, 0], rings: [[0.024, 0.006, 0.006, 0.005, 0], [0.014, 0.010, 0.010, 0.008, 0.001], [0, 0.012, 0.011, 0.010, 0], [-0.016, 0.010, 0.009, 0.009, 0]], tail: [-0.032, 0], far: [1, 2, 3], grain: 2 },
    ears: { z: 0.016, x: 0.006, tip: [0.0105, 0.0165, 0.013] },                   // short and blunt: nubs, never horns
    // the membrane's trailing edge is scalloped between the finger tips, but shallowly (a tenth of the chord): deep notches are the
    // bat of a paper cut-out, not of the air
    wing: { y: 0.002, root: [0.008, 0.012, -0.041], arm: [[0.034, 0.017, -0.037]], wrist: [0.066, 0.023, -0.046], hand: [[0.30, 0.090, 0.014, -0.040], [0.55, 0.112, 0.002, -0.046], [0.78, 0.128, -0.011, -0.039], [1, 0.140, -0.030, -0.034]], split: 0 },
    tail: { base: [-0.012, 0.001, 0.013], tips: [[0.013, -0.039, 0.4], [0.005, -0.052, 0.2]], notch: -0.058, spread: 10, ridge: 0 },      // the membrane between the legs: it starts under the body, so no sky shows between body and wing
    stroke: { rate: 10, up: 55, down: -50, frac: 0.5, lag: 0.083, gain: 1.2, flex: 40, bob: 0.004 },
    glide: { dihedral: 10, hand: 10, arm: 0 }, fold: { arm: 6, shrink: 0.8, rest: -20 },
    rhythm: { kind: 'steady' }, speed: [4, 7], bank: 70,
    paint: { top: '#3a2c28', belly: '#40312c', throat: '#3a2c28', wingTop: '#241b1f', wingTrail: '#241b1f', wingUnder: '#2a2024', wingUnderTrail: '#2a2024', tail: '#241b1f', tailUnder: '#2a2024' },
  },
  tern: {
    ref: 0.80,
    body: { nose: [0.125, -0.004], rings: [[0.092, 0.006, 0.006, 0.006, 0], [0.070, 0.020, 0.019, 0.016, 0.002], [0.030, 0.027, 0.024, 0.023, 0], [-0.020, 0.030, 0.026, 0.027, 0], [-0.070, 0.022, 0.017, 0.020, 0], [-0.105, 0.010, 0.007, 0.009, 0.002]], tail: [-0.118, 0.003], far: [1, 3, 4], grain: 3 },
    wing: { y: 0.006, root: [0.022, 0.040, -0.045], wrist: [0.170, 0.075, -0.005], hand: [[0.3, 0.245, 0.050, -0.022], [0.6, 0.315, 0.005, -0.045], [0.85, 0.370, -0.045, -0.072], [1, 0.400, -0.088, -0.094]], split: 0.5 },
    tail: { base: [-0.108, 0.004, 0.012], tips: [[0.012, -0.215, 1], [0.008, -0.180, 0.6], [0.003, -0.162, 0.25]], notch: -0.158, spread: 30 },
    stroke: { rate: 3.2, up: 40, down: -36, frac: 0.55, lag: 0.16, gain: 1.0, flex: 22, bob: 0.018 },
    glide: { dihedral: 3, hand: 14, arm: -5 }, fold: { arm: 6, shrink: 0.8, rest: -25 },
    rhythm: { kind: 'steady' }, speed: [8, 13], bank: 50,
    paint: { top: '#a9adb6', belly: '#c9c8c4', throat: '#c9c8c4', cap: '#15162E', capZ: 0.046, bill: '#7a2a26', wingTop: '#a6aab3', wingTrail: '#9a9ea8', handTip: '#6f7480', wingUnder: '#c6c5c2', wingUnderTrail: '#b6b6ba', tail: '#c4c4c0', tailUnder: '#c9c8c4' },
  },
  flamingo: {
    ref: 1.5,
    body: { nose: [0.21, 0.02], rings: [[0.18, 0.035, 0.035, 0.035, 0.02], [0.09, 0.075, 0.075, 0.085, 0], [-0.06, 0.09, 0.085, 0.105, -0.005], [-0.20, 0.06, 0.05, 0.07, 0]], tail: [-0.30, 0.01], far: [0, 1, 2, 3], grain: 2 },
    neck: { base: [0.02, 0.19], length: 0.68, r0: 0.030, r1: 0.021, head: 0.036, bill: 0.11, drop: 0.05 },
    legs: { hip: [0.0, -0.065, -0.20], length: 0.76, foot: 0.05, hidden: false, thick: 0.013 },
    wing: { y: 0.03, root: [0.06, 0.11, -0.10], wrist: [0.40, 0.12, -0.08], hand: [[0.5, 0.60, 0.06, -0.09], [1, 0.75, -0.03, -0.07]], split: 0.42 },
    tail: { base: [-0.26, 0.02, 0.04], tips: [[0.035, -0.33, 1]], notch: -0.34, spread: 12 },
    stroke: { rate: 2.8, up: 30, down: -25, frac: 0.55, lag: 0.14, gain: 0.8, flex: 10, bob: 0.03 },
    glide: { dihedral: 4, hand: 8, arm: 0 }, fold: { arm: 6, shrink: 0.8, rest: -30 },
    rhythm: { kind: 'steady' }, speed: [14, 16], bank: 35, stand: { pitch: 20 },
    paint: { top: '#d9a9ae', belly: '#ddb3b8', throat: '#ddb3b8', neck: '#ddb3b8', bill: '#1A1420', wingTop: '#d8647a', wingTrail: '#1A1420', wingUnder: '#D5405F', wingUnderTrail: '#1A1420', tail: '#d9a9ae', tailUnder: '#d9a9ae', legs: '#d97a8c' },
  },
};

// =====================================================================================================================
// Geometry
// =====================================================================================================================
const Z3 = [0, 0, 0];
class Builder {
  constructor() { this.p = []; this.c = []; this.u = []; this.a = []; this.b = []; this.n = []; this.f = []; this.fixed = []; this.idx = []; this.fat = Z3; }
  /** A point: position, top colour, underside colour, part weights (4), limb weights (4), and optionally a normal of its own.
   *  `this.fat` (set it before the call) is the way the point moves when the bird is drawn bolder, far off. */
  v(pos, col, under, part, limb = [0, 0, 0, 0], normal = null) {
    const i = this.p.length / 3;
    this.p.push(pos[0], pos[1], pos[2]); this.c.push(col[0], col[1], col[2]); const un = under || col; this.u.push(un[0], un[1], un[2]);
    this.a.push(part[0], part[1], part[2], part[3]); this.b.push(limb[0], limb[1], limb[2], limb[3]); this.f.push(this.fat[0], this.fat[1], this.fat[2]);
    if (normal) { this.n.push(normal[0], normal[1], normal[2]); this.fixed.push(1); } else { this.n.push(0, 0, 0); this.fixed.push(0); }
    return i;
  }
  /** A triangle whose front is turned toward `hint` (a direction). */
  tri(i, j, k, hint) {
    const P = this.p, ax = P[i * 3], ay = P[i * 3 + 1], az = P[i * 3 + 2];
    const ux = P[j * 3] - ax, uy = P[j * 3 + 1] - ay, uz = P[j * 3 + 2] - az, vx = P[k * 3] - ax, vy = P[k * 3 + 1] - ay, vz = P[k * 3 + 2] - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (nx * nx + ny * ny + nz * nz < 1e-16) return;                              // no area: leave it out
    if (hint && nx * hint[0] + ny * hint[1] + nz * hint[2] < 0) this.idx.push(i, k, j); else this.idx.push(i, j, k);
  }
  quad(i, j, k, l, hint) { this.tri(i, j, k, hint); this.tri(i, k, l, hint); }
  /** Smooth normals for the points that have none of their own. */
  finish() {
    const P = this.p, N = this.n, I = this.idx;
    for (let t = 0; t < I.length; t += 3) {
      const i = I[t], j = I[t + 1], k = I[t + 2];
      const ux = P[j * 3] - P[i * 3], uy = P[j * 3 + 1] - P[i * 3 + 1], uz = P[j * 3 + 2] - P[i * 3 + 2], vx = P[k * 3] - P[i * 3], vy = P[k * 3 + 1] - P[i * 3 + 1], vz = P[k * 3 + 2] - P[i * 3 + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const q of [i, j, k]) if (!this.fixed[q]) { N[q * 3] += nx; N[q * 3 + 1] += ny; N[q * 3 + 2] += nz; }
    }
    for (let q = 0; q < N.length; q += 3) { const l = Math.hypot(N[q], N[q + 1], N[q + 2]) || 1; N[q] /= l; N[q + 1] /= l; N[q + 2] /= l; }
    return { position: new Float32Array(P), normal: new Float32Array(N), color: new Float32Array(this.c), under: new Float32Array(this.u), part: new Float32Array(this.a), limb: new Float32Array(this.b), fat: new Float32Array(this.f),
      index: this.p.length / 3 > 65535 ? new Uint32Array(I) : new Uint16Array(I), triangles: I.length / 3 };
  }
}

const NONE = [0, 0, 0, 0];

/** The colour of a point of the body: z along it, `up` = 1 on the back .. -1 on the belly. */
function bodyPaint(sp, z, up, body = sp.body) {
  const P = sp.paint, R = body.rings;
  let hex = up > (P.topDown ?? 0.15) ? P.top : P.belly;
  if (P.rump && z > P.rumpZ[0] && z < P.rumpZ[1] && up > -0.55) hex = P.rump;                       // a rump patch that wraps onto the flanks
  if (P.vent && z < (body.ventZ ?? R[R.length - 2][0] + 0.004) && up < -0.2) hex = P.vent;
  const head = body.head ?? R[1][0], neck = body.neck ?? R[2][0];
  if (P.head && z > head - 0.012) hex = P.head;
  if (P.band && up <= (P.topDown ?? 0.15) && (P.bandZ ? z > P.bandZ[0] && z <= P.bandZ[1] : z > neck - 0.004 && z <= head - 0.002)) hex = P.band;
  if (P.throat && up <= (P.throatUp ?? 0.15) && z > (body.throatZ ?? P.throatZ ?? head - 0.004)) hex = P.throat;
  if (P.cheek && z > head - 0.004 && up > (P.throatUp ?? 0.15) && up <= (P.foreheadUp ?? 0.15)) hex = P.cheek;      // the side of the head between throat and crown (a swallow's dark face)
  if (P.forehead && up > (P.foreheadUp ?? 0.15) && z > (P.foreheadZ ?? head + 0.006)) hex = P.forehead;
  if (P.mask) { const mu = body.maskUp || P.maskUp || [-0.5, 0.5]; if (up >= mu[0] && up <= mu[1] && z > (body.maskZ ?? P.maskZ ?? head - 0.006)) hex = P.mask; }   // a mask through the eye
  if (P.cap && up > 0.1 && z > P.capZ) hex = P.cap;
  if (P.neck && z > R[0][0] - 0.01) hex = P.neck;
  return hex;
}

/** The body: a loft through the rings, closed at the nose and at the tail. `sides` points round, `pick` which rings to keep. */
function addBody(B, sp, sides, pick, part = NONE, weight = null, body = sp.body) {
  const rings = pick.map((i) => body.rings[i]);
  const up = (k) => Math.cos(k / sides * TAU);                                   // 1 on the back, -1 on the belly
  const ringPoint = (r, k) => { const a = k / sides * TAU, c = Math.cos(a); return [Math.sin(a) * r[1], r[4] + (c >= 0 ? r[2] : r[3]) * c, r[0]]; };
  const wOf = (z, upv) => (weight ? weight(z, upv) : part);
  const rows = rings.map((r) => { const row = []; for (let k = 0; k < sides; k++) { const p = ringPoint(r, k); B.fat = [Math.sin(k / sides * TAU) * 0.7, Math.cos(k / sides * TAU) * 0.7, 0]; row.push(B.v(p, rgb(bodyPaint(sp, r[0], up(k), body)), null, wOf(r[0], up(k)))); } return row; });
  const noseCol = rgb((sides > 3 && sp.paint.bill) || bodyPaint(sp, body.nose[0], 0.5, body));      // (at grain level, three sides, the bill has no colour of its own)
  for (let k = 0; k < sides; k++) {                                              // the nose: one point per face, so the bill can keep its own colour
    B.fat = [0, 0, 0.7];
    const j = (k + 1) % sides, tip = B.v([0, body.nose[1], body.nose[0]], noseCol, null, wOf(body.nose[0], 0));
    B.tri(tip, rows[0][k], rows[0][j], [Math.sin((k + 0.5) / sides * TAU), Math.cos((k + 0.5) / sides * TAU), 0.4]);
  }
  for (let r = 0; r < rows.length - 1; r++) for (let k = 0; k < sides; k++) {
    const j = (k + 1) % sides, hint = [Math.sin((k + 0.5) / sides * TAU), Math.cos((k + 0.5) / sides * TAU), 0];
    B.quad(rows[r][k], rows[r + 1][k], rows[r + 1][j], rows[r][j], hint);
  }
  B.fat = [0, 0, -0.7];
  const last = rows[rows.length - 1], tail = B.v([0, body.tail[1], body.tail[0]], rgb(bodyPaint(sp, body.tail[0], 0.5, body)), null, wOf(body.tail[0], 0));
  for (let k = 0; k < sides; k++) { const j = (k + 1) % sides; B.tri(tail, last[k], last[j], [Math.sin((k + 0.5) / sides * TAU), Math.cos((k + 0.5) / sides * TAU), -0.4]); }
  B.fat = Z3;
}

/** The outline of one wing as sections from the body out: { x, le, te, hand: 0 on the arm .. 1 at the tip, arm: true|false }. */
function wingSections(sp, level) {
  const W = sp.wing, out = [{ x: W.root[0], le: W.root[1], te: W.root[2], h: 0, arm: true }];
  if (W.arm && level > 0) for (const a of W.arm) out.push({ x: a[0], le: a[1], te: a[2], h: 0, arm: true });
  out.push({ x: W.wrist[0], le: W.wrist[1], te: W.wrist[2], h: 0, arm: true });
  out.push({ x: W.wrist[0], le: W.wrist[1], te: W.wrist[2], h: 0, arm: false });                 // the same line again: the hand hinges on it
  const hand = level >= 2 ? W.hand : level === 1 ? (W.hand.length > 2 ? [W.hand[Math.floor((W.hand.length - 1) / 2)], W.hand[W.hand.length - 1]] : W.hand) : [W.hand[W.hand.length - 1]];
  for (const s of hand) out.push({ x: s[1], le: s[2], te: s[3], h: s[0], arm: false });
  return out;
}

/** Both wings. level 0 = grain (arm a quad, hand a triangle), 1 = far, 2 = near (two rows of feathers and a little camber). */
function addWings(B, sp, level) {
  const W = sp.wing, P = sp.paint, sec = wingSections(sp, level), rows = level >= 2 || (level === 1 && P.wingTop !== P.wingTrail) ? 2 : 1;
  const split = W.split > 0 ? W.split : 0.5;
  const colours = (s, row, tipward) => {
    let top = row === 0 ? P.wingTop : P.wingTrail, under = row === 0 ? P.wingUnder : P.wingUnderTrail;
    if (!s.arm && P.handTop) top = P.handTop;
    if (!s.arm && P.handTip && tipward > 0.55) top = P.handTip;
    return [rgb(top), rgb(under)];
  };
  for (const side of [1, -1]) {
    const half = W.hand[W.hand.length - 1][1], under = half * 0.006, lap = under * 3.5;
    const grid = sec.map((s, si) => {
      const chord = s.le - s.te, tip = chord < 0.012 && s.h >= 1, y = W.y - (s.arm ? 0 : under);           // the hand lies a hair under the arm: feathers slide over one another
      const over = s.arm && sec[si + 1] && !sec[si + 1].arm ? lap : 0;                                     // and the arm laps over the hinge, so no crack shows from the tip's side
      // drawn bold (far off), a wing reaches out a little as well as thickening; and it thickens less toward its tip, so
      // that a pointed wing stays pointed. fat = (outward along the span, -, +1 leading edge .. -1 trailing edge): the shader
      // turns the edges' share across the line of sight, so that a wing seen edge-on is still a stroke
      const out = side * (s.arm ? (si > 0 ? 0.6 : 0) : 0.6 + 0.5 * s.h), taper = s.arm ? 1 : 1 - 0.72 * s.h;
      const pt = (f, lift) => { B.fat = [out, 0, f < 0.01 ? taper : f > 0.99 ? -taper : 0]; return [side * (s.x + over), y + lift, s.le - chord * f]; };
      const part = [side, s.arm ? 0 : Math.max(s.h, 0), 0, 0];
      if (rows === 1) { const [t, u] = colours(s, 0, s.h); const [t1, u1] = colours(s, 1, s.h); return { tip, a: [B.v(pt(0, 0), t, u, part), B.v(pt(1, 0), level === 0 ? t : t1, level === 0 ? u : u1, part)] }; }
      const camber = level >= 2 ? chord * 0.045 : 0, [t0, u0] = colours(s, 0, s.h), [t1, u1] = colours(s, 1, s.h);
      const edge = s.arm ? P.armEdge : (P.handEdge && s.h > 0.5 ? P.handEdge : null), te = edge ? rgb(edge) : t1;        // pale tips to the secondaries, a coloured edge to the primaries
      return { tip, a: [B.v(pt(0, 0), t0, u0, part), B.v(pt(split, camber), t0, u0, part)], b: [B.v(pt(split + (edge ? 0.3 : 0), camber * (edge ? 0.4 : 1)), t1, u1, part), B.v(pt(1, 0), te, u1, part)], mid: edge ? B.v(pt(split, camber), t1, u1, part) : -1 };
    });
    B.fat = Z3;
    const hint = [0, 1, 0];
    for (let i = 0; i < grid.length - 1; i++) {
      if (sec[i].arm !== sec[i + 1].arm) continue;                                // the wrist line is doubled, not bridged
      const g0 = grid[i], g1 = grid[i + 1];
      B.quad(g0.a[0], g0.a[1], g1.a[1], g1.a[0], hint);
      if (g0.b) {
        B.quad(g0.b[0], g0.b[1], g1.b[1], g1.b[0], hint);
        if (g0.mid >= 0 && g1.mid >= 0) B.quad(g0.mid, g0.b[0], g1.b[0], g1.mid, hint);       // (the edge colour keeps to the last third of the feathers)
        else if (g0.mid >= 0) B.tri(g0.mid, g0.b[0], g1.b[0], hint); else if (g1.mid >= 0) B.tri(g0.b[0], g1.b[0], g1.mid, hint);
      }
    }
  }
}

/** The tail: two halves that swing apart about the tail's base. It is a shallow roof, not a sheet: its middle line stands a few
 *  millimetres above its edges (the tail coverts and the lie of the feathers), so that from the side a bird has a tail and not a hairline. */
function addTail(B, sp, level) {
  const T = sp.tail, P = sp.paint, y = T.base[1], zb = T.base[0], top = rgb(P.tail), under = rgb(P.tailUnder || P.tail), tipCol = P.tailTip ? rgb(P.tailTip) : top;
  const tips = level >= 2 ? T.tips : T.tips.slice(0, T.far ?? 1);
  const R = sp.body.rings, up = [0, 1, 0], ridge = T.ridge ?? Math.max(0.003, R[R.length - 1][2] * 0.8), wide = Math.max(T.tips[0][0], T.base[2]);
  const yAt = (x, z) => y + ridge * (1 - Math.min(1, Math.abs(x) / wide)) * lerp(1, 0.22, clamp((zb - z) / Math.max(1e-4, zb - T.notch), 0, 1));
  for (const side of [1, -1]) {
    const bIn = B.v([0, yAt(0, zb), zb], top, under, [0, 0, side * 1e-4, 0], NONE, up), bOut = B.v([side * T.base[2], y, zb], top, under, [0, 0, side * 1e-4, 0], NONE, up);
    const pts = tips.map((t) => ({ x: t[0], z: t[1], w: t[2] }));
    pts.push({ x: 0, z: T.notch, w: 1e-4 });
    let prev = bOut;
    if (T.band && level >= 1) {                                                   // a band of colour across the tip: the feathers are cut at the band
      const cut = pts.map((q) => ({ x: q.x * 0.97, z: T.band + (q.z - T.notch) * 0.3, w: q.w }));
      const ring0 = cut.map((q) => B.v([side * q.x, yAt(q.x, q.z), q.z], top, under, [0, 0, side * q.w, 0], NONE, up));
      const ring1 = cut.map((q) => B.v([side * q.x, yAt(q.x, q.z), q.z], tipCol, tipCol, [0, 0, side * q.w, 0], NONE, up));
      const end = pts.map((q) => { B.fat = [side * 0.4 * q.w, 0, -0.8]; return B.v([side * q.x, yAt(q.x, q.z), q.z], tipCol, tipCol, [0, 0, side * q.w, 0], NONE, up); }); B.fat = Z3;
      for (const v of ring0) { B.tri(bIn, prev, v, up); prev = v; }
      for (let i = 0; i < ring1.length - 1; i++) B.quad(ring1[i], end[i], end[i + 1], ring1[i + 1], up);
    } else {
      for (const q of pts) { B.fat = [side * 0.4 * q.w, 0, -0.8]; const v = B.v([side * q.x, yAt(q.x, q.z), q.z], top, under, [0, 0, side * q.w, 0], NONE, up); B.tri(bIn, prev, v, up); prev = v; } B.fat = Z3;
    }
  }
}

/** Things only some birds have: a crest, ears, legs, a long neck. */
function addExtras(B, sp, level, perched = false, body = null) {
  const P = sp.paint;
  const crest = (perched && body && body.crest) || sp.crest;
  if (crest && level >= 1) {                                                     // a narrow fin swept back from the forehead to a point over the nape
    const c = crest, col = rgb(P.head || P.top), base = perched ? [1, 0, 0, 0] : NONE, mz = (c.front[0] + c.back[0]) / 2, my = (c.front[1] + c.back[1]) / 2;
    const f = B.v([0, c.front[1], c.front[0]], col, null, base), l = B.v([c.halfWidth, my - 0.003, mz], col, null, base), rr = B.v([-c.halfWidth, my - 0.003, mz], col, null, base);
    const back = B.v([0, c.back[1], c.back[0]], col, null, base), tip = B.v([0, c.tip[1], c.tip[0]], col, null, perched ? [1, 1, 0, 0] : NONE);
    const ridge = B.v([0, my + (c.tip[1] - my) * 0.45, mz], col, null, perched ? [1, 0.35, 0, 0] : NONE);
    B.tri(f, l, ridge, [1, 1, 0.3]); B.tri(f, rr, ridge, [-1, 1, 0.3]); B.tri(l, tip, ridge, [1, 1, 0]); B.tri(rr, tip, ridge, [-1, 1, 0]); B.tri(l, back, tip, [1, -0.3, -1]); B.tri(rr, back, tip, [-1, -0.3, -1]);
  }
  if (sp.ears && level >= 1) {
    const e = sp.ears, col = rgb(P.top);
    for (const side of [1, -1]) {
      const a = B.v([side * e.x * 0.5, 0.008, e.z + 0.004], col, null, NONE), b = B.v([side * e.x * 1.5, 0.006, e.z - 0.003], col, null, NONE), c = B.v([side * e.tip[0], e.tip[1], e.tip[2]], col, null, NONE);
      B.tri(a, b, c, [0, 0.3, 1]);
    }
  }
  if (sp.legs && !perched) {
    const L = sp.legs, col = rgb(P.legs || P.top), th = L.thick || 0.0022;
    const sides = L.hidden ? [1, -1] : [0];                                       // a flamingo's legs trail as one line; a petrel's hang apart
    for (const side of sides) {
      const hx = side * L.hip[0], hy = L.hip[1], hz = L.hip[2], ze = hz - L.length;
      // in the rest pose a leg lies straight back from the hip; the shader swings it down (limb.x = 1 along the whole leg, limb.y = which leg)
      const k = [1, side, 0, 0];
      const fv = (fx, fy, pos) => { B.fat = [fx * 0.5, fy * 0.5, 0]; return B.v(pos, col, null, NONE, k); };
      const a = fv(-1, -0.5, [hx - th, hy, hz]), b = fv(1, -0.5, [hx + th, hy, hz]), c = fv(0, 1, [hx, hy + th * 1.6, hz]);
      const a1 = fv(-1, -0.5, [hx - th * 0.8, hy, ze]), b1 = fv(1, -0.5, [hx + th * 0.8, hy, ze]), c1 = fv(0, 1, [hx, hy + th * 1.3, ze]);
      B.quad(a, a1, c1, c, [-1, 1, 0]); B.quad(c, c1, b1, b, [1, 1, 0]); B.quad(b, b1, a1, a, [0, -1, 0]);
      const f0 = B.v([hx - L.foot * 0.45, hy, ze - L.foot], col, null, NONE, k), f1 = B.v([hx + L.foot * 0.45, hy, ze - L.foot], col, null, NONE, k);
      B.tri(a1, b1, f1, [0, 1, 0]); B.tri(a1, f1, f0, [0, 1, 0]);                  // the foot: a small web
    }
    B.fat = Z3;
  }
  if (sp.neck) {
    // a neck is a thin three-sided tube lying straight ahead in the rest pose; limb.z = how far along it a point is (0..1),
    // so that the shader can lay it in an arc: straight out in flight, a question mark when the head is up, tucked on the back asleep
    const N = sp.neck, col = rgb(P.neck || P.top), segs = level >= 2 ? 5 : 3, z0 = N.base[1], y0 = N.base[0];
    const ring = (t, r) => { const z = z0 + N.length * t, k = [0, 0, Math.max(t, 0.001), 0]; return [0, 1, 2].map((q) => { const a = q / 3 * TAU; B.fat = [Math.sin(a) * 0.6, Math.cos(a) * 0.6, 0]; return B.v([Math.sin(a) * r, y0 + Math.cos(a) * r, z], col, null, NONE, k); }); };
    let prev = ring(0, N.r0);
    for (let i = 1; i <= segs; i++) { const t = i / segs, cur = ring(t, lerp(N.r0, N.r1, t)); for (let q = 0; q < 3; q++) { const j = (q + 1) % 3, a = (q + 0.5) / 3 * TAU; B.quad(prev[q], cur[q], cur[j], prev[j], [Math.sin(a), Math.cos(a), 0]); } prev = cur; }
    const kh = [0, 0, 1, 0], zh = z0 + N.length;
    const head = [0, 1, 2].map((q) => { const a = q / 3 * TAU; B.fat = [Math.sin(a) * 0.7, Math.cos(a) * 0.7, 0]; return B.v([Math.sin(a) * N.head, y0 + Math.cos(a) * N.head, zh + N.head * 1.2], col, null, NONE, kh); });
    for (let q = 0; q < 3; q++) { const j = (q + 1) % 3, a = (q + 0.5) / 3 * TAU; B.quad(prev[q], head[q], head[j], prev[j], [Math.sin(a), Math.cos(a), 0]); }
    B.fat = [0, -0.3, 0.6];
    const bill = B.v([0, y0 - N.drop, zh + N.head * 1.2 + N.bill], rgb(P.bill), null, NONE, kh);
    B.fat = Z3;
    for (let q = 0; q < 3; q++) { const j = (q + 1) % 3, a = (q + 0.5) / 3 * TAU; B.tri(head[q], bill, head[j], [Math.sin(a), Math.cos(a), 0.3]); }
  }
}

const LEVEL = { grain: 0, far: 1, near: 2 };

/**
 * The flying bird. detail: 'grain' (about 12 triangles: birds in the tens of thousands), 'far' (about 50: thousands, or
 * anything beyond about 15 m), 'near' (about 200: birds in the tens that pass close).
 * Returns { geometry, triangles, joints } (joints: where the hinges are, for the shader).
 */
export function birdGeometry(species, detail = 'near') {
  const sp = typeof species === 'string' ? SPECIES[species] : species, level = LEVEL[detail] ?? 2, B = new Builder();
  const all = sp.body.rings.map((_, i) => i);
  if (level === 0) addBody(B, sp, 3, [sp.body.grain]);
  else if (level === 1) addBody(B, sp, sp.neck ? 5 : 6, sp.body.far);
  else addBody(B, sp, 8, all);
  addWings(B, sp, level);
  if (level >= 1) addTail(B, sp, level);
  addExtras(B, sp, level);
  return pack(B, sp);
}

function pack(B, sp) {
  const d = B.finish(), geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(d.position, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(d.normal, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(d.color, 3)); geo.setAttribute('aUnder', new THREE.BufferAttribute(d.under, 3));
  geo.setAttribute('aPart', new THREE.BufferAttribute(d.part, 4)); geo.setAttribute('aLimb', new THREE.BufferAttribute(d.limb, 4)); geo.setAttribute('aFat', new THREE.BufferAttribute(d.fat, 3));
  geo.setIndex(new THREE.BufferAttribute(d.index, 1));
  return { geometry: geo, triangles: d.triangles, species: sp };
}

/**
 * The perched bird: the same body with the wings shut along its flanks (their tips crossed over the tail), the tail
 * closed, no feet (they are under the belly). Its own space: the same as the flying bird's; the shader stands it on
 * its feet. Part weights: x = head (turns and nods), y = crest, z = tail (signed, as in flight), w = how far it fluffs.
 */
export function perchedGeometry(species, detail = 'near') {
  const sp = typeof species === 'string' ? SPECIES[species] : species, level = LEVEL[detail] ?? 2, B = new Builder();
  const body = (level >= 2 && sp.perchBody) || sp.body, R = body.rings;
  const pc = sp.perch || { posture: 45, feet: [-R[3][3], -0.02], wrist: 0.02, tip: -0.1, tipY: 0.012, cross: 0.003 };
  const headZ = body.head ?? R[1][0], neckZ = body.neck ?? R[2][0], zEnd = R[R.length - 1][0];
  const weight = (z, upv) => [smooth(neckZ - 0.004, headZ - 0.004, z), 0, 0, smooth(zEnd, neckZ, z) * (1 - smooth(headZ - 0.004, body.nose[0], z)) * (0.75 + 0.25 * -upv)];
  addBody(B, sp, level >= 2 ? (body.sides || 8) : 6, level >= 2 ? R.map((_, i) => i) : sp.body.far, NONE, weight, body);
  addTail(B, sp, Math.max(1, level));                                            // the tail keeps its flying weights (z): it can still be cocked and fanned
  addExtras(B, sp, Math.max(1, level), true, body);
  // ---- the shut wings: a blade along each flank from the bend of the wing back to the tips of the primaries, which cross over the tail
  const P = sp.paint, ringAt = (z) => {                                          // the body's section at z, between rings
    if (z >= R[0][0]) return R[0]; if (z <= zEnd) return R[R.length - 1];
    for (let i = 0; i < R.length - 1; i++) if (z <= R[i][0] && z >= R[i + 1][0]) { const t = (R[i][0] - z) / (R[i][0] - R[i + 1][0]); return R[i].map((v, k) => lerp(v, R[i + 1][k], t)); }
    return R[R.length - 1];
  };
  const steps = level >= 2 ? [0, 0.22, 0.45, 0.66, 0.84, 1] : [0, 0.5, 1];
  const aUp = (t) => lerp(40, 12, t), aLo = (t) => lerp(118, 46, Math.pow(t, 0.85));
  for (const side of [1, -1]) {
    const surf = (t, aDeg, puff) => {
      const z = lerp(pc.wrist, pc.tip, t), r = ringAt(z), fade = smooth(zEnd - 0.008, zEnd + 0.026, z);       // 1 where it lies on the body .. 0 where the tips are free
      const a = aDeg * DEG, c = Math.cos(a), sn = Math.sin(a);
      B.fat = [side * sn, c, 0];                                                 // (the shut wing thickens with the body it lies on)
      const bx = sn * (r[1] + puff), by = r[4] + (c >= 0 ? r[2] : r[3]) * c + c * puff;
      const fx = pc.cross + (aDeg - 12) * 0.00007, fy = pc.tipY - (aDeg - 12) * 0.00006;
      return [side * lerp(fx, bx, fade), lerp(fy, by, fade), z];
    };
    // (the forward end of the shut wing lies on the neck: it takes the neck's share of the head's turn and nod, or it is left standing
    // as a spike when the head goes down: from behind, two ears)
    const wOf = (t) => { const z = lerp(pc.wrist, pc.tip, t); return [smooth(neckZ - 0.004, headZ - 0.004, z), 0, 0, smooth(zEnd, neckZ, z) * 0.9]; };
    const feather = (t) => (t < 0.3 ? P.wingTop : t < 0.6 ? P.wingTrail : (P.handTop || P.wingTrail));
    const rows = steps.map((t) => {
      const u = aUp(t), l = aLo(t), m = (u + l) / 2, col = rgb(feather(t)), w = wOf(t);
      if (t === 0) return [B.v(surf(t, u, 0.0008), rgb(P.top), null, w), B.v(surf(t, m, 0.002), rgb(P.top), null, w), B.v(surf(t, l, 0.0008), rgb(P.belly), null, w)];
      return [B.v(surf(t, u, 0.0012), rgb(t < 0.3 ? P.top : feather(t)), null, w), B.v(surf(t, m, level >= 2 ? 0.0052 : 0.004), col, null, w), B.v(surf(t, l, 0.0015), col, null, w)];
    });
    for (let i = 0; i < rows.length - 1; i++) { B.quad(rows[i][0], rows[i][1], rows[i + 1][1], rows[i + 1][0], [side, 0.5, 0]); B.quad(rows[i][1], rows[i][2], rows[i + 1][2], rows[i + 1][1], [side, -0.2, 0]); }
    if (P.bar && level >= 2) {                                                   // the waxwing's marks: white tips to the coverts, white and red wax on the secondaries, a yellow edge to the primaries
      const mark = (t0, t1, a0, a1, hex) => { const q = [[t0, a0], [t0, a1], [t1, a1], [t1, a0]].map(([t, a]) => B.v(surf(t, a, 0.0062), rgb(hex), null, wOf(t))); B.quad(q[0], q[1], q[2], q[3], [side, 0.4, 0]); };
      mark(0.27, 0.305, 74, 100, P.bar); mark(0.50, 0.535, 58, 84, P.bar); mark(0.535, 0.575, 60, 80, P.wax);
      mark(0.66, 0.80, aLo(0.66) - 9, aLo(0.66) - 1, P.edge); mark(0.80, 0.94, aLo(0.80) - 8, aLo(0.80) - 1, P.edge);
    }
  }
  // a mask through the eye: a narrow band laid on the side of the head from the base of the bill back and up toward the crest
  // (painted on points of the body it could only be a hood: the head has too few points to draw a stripe)
  if (P.mask && body.eyeStripe && level >= 2) {
    const col = rgb(P.mask);
    for (const side of [1, -1]) {
      const nS = body.sides || 8, facet = (a) => { const w = TAU / nS, l = ((a % w) + w) % w; return Math.cos(w / 2) / Math.cos(l - w / 2); };      // how far in a flat facet lies from the round
      const at = (z, aDeg) => { const r = ringAt(z), a = aDeg * DEG, c = Math.cos(a), puff = 0.0004, k = facet(a); return B.v([side * Math.sin(a) * (r[1] * k + puff), r[4] + (c >= 0 ? r[2] : r[3]) * c * k + c * puff, z], col, null, weight(z, c)); };
      const rows = body.eyeStripe.map(([z, a0, a1]) => [at(z, a0), at(z, a1)]);
      for (let i = 0; i < rows.length - 1; i++) B.quad(rows[i][0], rows[i][1], rows[i + 1][1], rows[i + 1][0], [side, 0.2, 0.2]);
    }
  }
  B.fat = Z3;
  const out = pack(B, sp); out.perch = pc; out.body = body; return out;
}

// =====================================================================================================================
// The shader: an extension of the ride's gouache material
// =====================================================================================================================
const GLSL_POSE = /* glsl */`
  attribute vec3 aUnder, aFat; attribute vec4 aPart; attribute vec4 aLimb;
  varying vec3 vBirdUnder; varying float vBirdTint, vBirdCrisp, vBirdSil;
  uniform float uSil;                                                            // how far a bird that is small in the picture darkens toward a silhouette (0 = not at all)
  uniform vec3 uCrisp;                                                           // 1 = the bird may keep out of the painter's filter; it does so wholly while its thinnest measure is under .y pixels, and is painted like everything else above .z
  uniform vec4 uBold;                                                            // least thickness of a stroke in pixels; the bird's own thinnest measure in metres; cap as a share of its span; how far a wing's stroke turns across the line of sight
  uniform vec3 uShoulder, uWrist, uTailBase, uHip;
  uniform vec4 uStroke, uStroke2, uGlide, uFoldK, uTailK, uNeckK, uLegK;
  uniform float uBirdTime, uPxScale, uMinPx, uRef, uMaxGrow, uGuard, uBirdScale;
  vec3 bWingX, bWingZ;                                                           // for a point of a wing, after birdPose: the way the span runs (outward) and the chord (forward), in bird space
  vec3 bRotX(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c); }
  vec3 bRotY(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }
  vec3 bRotZ(vec3 v, float a) { float c = cos(a), s = sin(a); return vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z); }
  // where the arm is in its stroke: u = 0 at the top of the beat; the downstroke takes uStroke.z of it
  float bStroke(float u) { float s = u < uStroke.z ? u / uStroke.z : 1.0 - (u - uStroke.z) / (1.0 - uStroke.z); s = 0.5 - 0.5 * cos(3.14159265 * s); return mix(uStroke.x, uStroke.y, s); }
  // heading, pitch (nose up), bank (left wing up), in that order from the outside in; and the way back
  vec3 bOrient(vec3 v, vec3 ypr) { return bRotY(bRotX(bRotZ(v, ypr.z), -ypr.y), ypr.x); }
  vec3 bUnorient(vec3 v, vec3 ypr) { return bRotZ(bRotX(bRotY(v, -ypr.x), ypr.y), -ypr.z); }
  float bFat; vec3 bSee;
  // flap: phase (radians), depth (0 = still .. 1 = a full beat), glide (0..1), fold (0..1: wings shut)
  // misc: tail spread (0..1), legs (0 = trailed or hidden .. 1 = down), vee (radians both wings are raised), stand (0..1)
  void birdPose(inout vec3 p, inout vec3 n, vec4 flap, vec4 misc) {
    float side = aPart.x;
    float u = fract(flap.x * 0.15915494);
    if (side != 0.0) {
      float a0 = bStroke(u), a1 = bStroke(fract(u - uStroke.w + 1.0)), mid = 0.5 * (uStroke.x + uStroke.y);
      float alpha = mid + (a0 - mid) * flap.y;
      float beta = (a1 - a0) * flap.y * uStroke2.x;                              // the hand follows the arm late: tips trail up on the way down, hang on the way up
      float rise = u < uStroke.z ? 0.0 : sin(3.14159265 * (u - uStroke.z) / (1.0 - uStroke.z));
      // Two different things happen at the wrist, and they are kept apart:
      //   flex: on every upstroke the hand swings back a little and the arm draws in (uStroke2.y radians at most);
      //   shut: the wing closes against the body (flap.w). The wrist comes in to the shoulder, the hand turns until its
      //         leading edge lies straight back along the flank (uFoldK.y: worked out from the wing's own outline), and the
      //         whole blade tips down a little to lie on the flank (uFoldK.w). A shut wing is a sliver beside the body:
      //         it never crosses the back, hangs under the belly or stands out like a fin.
      float shut = clamp(flap.w, 0.0, 1.0), open = 1.0 - shut;
      float flex = rise * uStroke2.y * flap.y * (1.0 - flap.z) * open;
      alpha = mix(alpha, uGlide.x, flap.z); beta *= 1.0 - flap.z;
      #ifndef BIRD_NECK
        alpha += misc.z;
      #endif
      alpha = mix(alpha, uFoldK.w, smoothstep(0.25, 1.0, shut)); beta *= open;
      float sweepH = uGlide.y * flap.z * open + flex + shut * uFoldK.y, sweepA = uGlide.z * flap.z * open + shut * uFoldK.x;
      float draw = 1.0 - uFoldK.z * shut - 0.45 * flex;                          // how far out the wrist still stands (1 = spread)
      vec3 S = vec3(side * uShoulder.x, uShoulder.y, uShoulder.z), W = vec3(side * uWrist.x, uWrist.y, uWrist.z);
      float hw = aPart.y;
      bWingX = vec3(side, 0.0, 0.0); bWingZ = vec3(0.0, 0.0, 1.0);
      if (hw > 0.0) {
        float bend = beta * (0.45 + 0.55 * hw);                                  // the feathers bend: the tip most
        vec3 q = bRotZ(bRotY(p - W, side * sweepH), side * bend);
        n = bRotZ(bRotY(n, side * sweepH), side * bend);
        bWingX = bRotZ(bRotY(bWingX, side * sweepH), side * bend); bWingZ = bRotZ(bRotY(bWingZ, side * sweepH), side * bend);
        p = W + q;
      }
      vec3 q = p - S;
      q.x *= draw;                                                               // as the wing shuts the wrist comes in toward the shoulder
      #ifdef BIRD_NECK
        q *= 1.0 - 0.72 * misc.w; q.y -= 0.03 * misc.w;                           // (a standing bird's shut wings lie small against its flanks)
      #endif
      q = bRotZ(bRotY(q, side * sweepA), side * alpha);
      n = bRotZ(bRotY(n, side * sweepA), side * alpha);
      bWingX = bRotZ(bRotY(bWingX, side * sweepA), side * alpha); bWingZ = bRotZ(bRotY(bWingZ, side * sweepA), side * alpha);
      p = S + q;
    }
    float tw = aPart.z;
    if (tw != 0.0) {
      vec3 q = bRotY(p - uTailBase, -tw * misc.x * uTailK.x);                    // the halves swing apart
      q = bRotX(q, -misc.x * uTailK.y * step(0.01, abs(tw)));                    // and the spread tail is pressed down a little
      p = uTailBase + q;
    }
    #ifdef BIRD_LEGS
    if (aLimb.x > 0.0) {
      vec3 hip = uHip * vec3(aLimb.y, 1.0, 1.0);
      #ifdef BIRD_NECK
        hip.z += uLegK.w * misc.w;                                                // a standing bird's leg is under the middle of its body
      #endif
      vec3 q = p - uHip * vec3(aLimb.y, 1.0, 1.0);
      float down = misc.y;
      #ifdef BIRD_LEGS_HIDDEN
        q *= smoothstep(0.0, 0.25, down);                                        // drawn up into the feathers when not in use
        q = bRotX(q, -down * uLegK.x + aLimb.y * uLegK.y * sin(uBirdTime * uLegK.z) * down);       // and pattering, each foot in turn
      #else
        q = bRotX(q, -down * uLegK.x);
      #endif
      p = hip + q;
    }
    #endif
    #ifdef BIRD_NECK
    if (aLimb.z > 0.0) {
      // The neck is laid along a curve whose bend grows toward the head: angle(s) = th0 + th1 * s * s (s = 0 at the body, 1 at
      // the head; angles from straight ahead, upward). Straight out and a little drooped in flight; a question mark when the
      // head is up; a tight coil on the back asleep; down and under when it feeds. uNeckK = (base y, base z, -, length).
      float t = aLimb.z, stand = misc.w, hd = misc.z, hu = max(hd, 0.0), hf = max(-hd, 0.0);     // misc.z of a standing bird: -1 feeding, 0 asleep, 1 head up
      float th0 = mix(-0.07, mix(2.3, 1.27, hu) + hf * -3.5, stand), th1 = mix(-0.10, mix(2.5, -1.27, hu) + hf * -3.4, stand), len = uNeckK.w * mix(1.0, mix(0.34, 1.0, max(hu, hf)), stand);
      vec2 off = vec2(p.x, p.y - uNeckK.x);                                      // where the point sits round the neck's own line
      float zr = (p.z - uNeckK.y) - t * uNeckK.w;                                // and how far past its ring (the head and the bill)
      vec2 arc = vec2(0.0);
      for (int i = 0; i < 6; i++) { float sq = t * (float(i) + 0.5) / 6.0, a = th0 + th1 * sq * sq; arc += vec2(cos(a), sin(a)); }
      arc *= len * t / 6.0;
      float th = th0 + th1 * t * t;
      arc += zr * vec2(cos(th), sin(th));
      p = vec3(off.x, uNeckK.x + arc.y + off.y * cos(th), uNeckK.y + arc.x - off.y * sin(th));
      n = bRotX(n, -th);
    }
    #endif
    p.y += uStroke2.w * flap.y * (1.0 - flap.z) * sin(6.2831853 * (u - uStroke.z) + 1.5708);     // each downstroke lifts the body
  }
`;

// what every bird does once its centre, attitude and pose are known
const GLSL_PLACE = /* glsl */`
    {
      vec3 cw = (modelMatrix * vec4(bC, 1.0)).xyz, toB = cw - uCameraPos; float bd = length(toB);
      // far off, a bird is drawn no smaller than a few pixels across (and no larger than uMaxGrow times life) ...
      bS *= clamp(uMinPx * bMin * bd / max(uPxScale * uRef * uBirdScale, 1e-4), 1.0, uMaxGrow);
      // ... and no thinner than the painter's brush will keep: its body and the chord of its wings are thickened to uBold.x
      // pixels (a far bird is one bold stroke of the brush, not a hairline that the painter's filter would wipe away)
      bFat = clamp(0.5 * (bBold * bd / uPxScale - uBold.y * bS), 0.0, uBold.z * uRef * bS) / max(bS, 1e-5);
      if (aPart.x == 0.0) bp += aFat * bFat;                                     // body, tail, legs, neck: outward from the part's own line
      // a small or far bird is a thin thing: it marks itself in the picture's alpha and the painter's filter leaves it as drawn
      { float kc = uCrisp.x * (1.0 - smoothstep(uCrisp.y, uCrisp.z, uBold.y * bS * uPxScale / max(bd, 1e-3))); vBirdCrisp = 0.1 * kc + 0.9 * smoothstep(0.7, 1.0, kc); }
      vBirdSil = uSil * (1.0 - smoothstep(10.0, 30.0, uRef * bS * uPxScale / max(bd, 1e-3)));       // (full when its wings span ten pixels, none at thirty)
      bSee = bd > 1e-3 ? bUnorient((toB / bd) * mat3(modelMatrix), bYpr) : vec3(0.0, -1.0, 0.0);      // the line of sight, in the bird's own space
      // the last guard: nothing of a bird nearer the lens than 0.7 m, whatever the flock's own steering did
      float need = uGuard + 0.55 * uRef * bS;
      if (bd < need && bS > 0.0) bC += (bd > 1e-3 ? toB / bd : vec3(0.0, 1.0, 0.0)) * (need - bd);
    }
    birdPose(bp, bn, bFlap, bMisc);
    if (aPart.x != 0.0 && bFat > 0.0) {
      // a wing is thickened across the line of sight: seen from above its chord grows, seen edge-on (a bird coming straight
      // at the rider, a petrel hanging into the wind) it gains the thickness it has not got, and stays a stroke
      vec3 e = cross(bWingX, bSee); float el = length(e);
      e = el > 0.05 ? e / el : bWingZ; if (dot(e, bWingZ) < 0.0) e = -e;
      e = normalize(mix(bWingZ, e, uBold.w));                                    // (uBold.w: 1 for birds that are watched; less for a flock, whose tone must follow its birds' aspect)
      bp += (e * aFat.z + bWingX * abs(aFat.x)) * bFat;
    }
    transformed = bC + bOrient(bp, bYpr) * bS;
    objectNormal = bOrient(bn, bYpr);
    vBirdUnder = aUnder;
`;

const VERT_CPU = /* glsl */`
    vec3 bp = position, bn = normal;
    vec3 bC = aPos.xyz, bYpr = aRot.xyz; float bS = aPos.w * uBirdScale, bBold = uBold.x, bMin = 1.0; vec4 bFlap = aFlap, bMisc = aMisc;
    vBirdTint = aRot.w;
    ${GLSL_PLACE}
`;

// ---------------------------------------------------------------------------------------------------------------------
// The murmuration: every bird's place is worked out here, in the vertex shader, from four numbers of its own (aSeed)
// and a handful of values the realm drives. Nothing is simulated and nothing is stored: 16,000 birds cost the CPU a few
// uniforms a frame.
//   - its place in the flock: a point in a thin plate (uShape: half length, half width, half depth) that is a lens in
//     section and has an arc for a leading edge, with more birds toward the head and a little more at the side borders,
//     and a tail that thins;
//   - the plate is strung along a path (32 points, evenly spaced; a second path to ease over to) at uAt metres, so a long
//     flock bends with its path: a cloud, drawn out, is a ribbon; and it banks as a whole where the path turns, so it
//     shows now its face (a pale veil) and now its edge (a dark bar);
//   - folds: five waves that travel through the plate (sideways and up and down, never along: a divergence-free field,
//     the Fourier form of curl noise), so that it folds over itself and unfolds;
//   - waves of bank that cross it: every bird in the band rolls over and jinks, and the band shows dark;
//   - a pour: birds leave the flock head first (or in any order), swing in over a mouth and spiral down to their own
//     places in a tree, shrinking to nothing over the last three metres; run backwards, they lift out of it;
//   - homes (FLOCK_HOMES): birds that stand on the ground until their moment, run into the wind, climb, and join the ribbon.
const GLSL_FLOCK = /* glsl */`
  attribute vec4 aSeed;
  #ifdef FLOCK_HOMES
    attribute vec4 aHome; attribute float aRel;
    uniform vec4 uRun;                                                           // the way they run (x, z), seconds of the run, seconds to join the ribbon
    uniform float uClock;
  #endif
  uniform vec3 uPathA[32], uPathB[32], uInto, uIntoR;
  uniform vec4 uPathK, uShape, uFold, uSkew, uPour, uMouth, uWave[2], uWaveK, uFlockFlap, uGrain, uObst[4];
  uniform vec2 uAt, uWaveC; uniform float uVel, uKeep, uShow; uniform vec3 uDab, uWaveD[2], uCentre;
  vec3 flCR(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t, out vec3 d) {
    vec3 b = p2 - p0, c = 2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3, e = -p0 + 3.0 * p1 - 3.0 * p2 + p3;
    d = 0.5 * (b + 2.0 * c * t + 3.0 * e * t * t);
    return 0.5 * (2.0 * p1 + b * t + c * t * t + e * t * t * t);
  }
  // a point of path A (which = 0) or B (1) at s metres: uPathK = (metres between points of A, of B, how far over to B, -);
  // uSkew.zw: 1 = that path is closed. An open path runs straight on past its ends.
  vec3 flPathOne(int which, float s, out vec3 T) {
    float seg = which == 0 ? uPathK.x : uPathK.y, closed = which == 0 ? uSkew.z : uSkew.w, u = s / seg; vec3 d, P;
    if (closed > 0.5) {
      u = mod(u, 32.0); int i = int(floor(u)); float f = u - float(i);
      if (which == 0) P = flCR(uPathA[(i + 31) % 32], uPathA[i % 32], uPathA[(i + 1) % 32], uPathA[(i + 2) % 32], f, d);
      else P = flCR(uPathB[(i + 31) % 32], uPathB[i % 32], uPathB[(i + 1) % 32], uPathB[(i + 2) % 32], f, d);
      T = d / seg; return P;
    }
    float uc = clamp(u, 0.0, 30.999); int i = int(floor(uc)); float f = uc - float(i);
    if (which == 0) P = flCR(uPathA[max(i - 1, 0)], uPathA[i], uPathA[min(i + 1, 31)], uPathA[min(i + 2, 31)], f, d);
    else P = flCR(uPathB[max(i - 1, 0)], uPathB[i], uPathB[min(i + 1, 31)], uPathB[min(i + 2, 31)], f, d);
    T = d / seg;
    return P + T * ((u - uc) * seg);
  }
  vec3 flPath(float along, out vec3 T) {
    vec3 P = flPathOne(0, uAt.x + along, T);
    if (uPathK.z > 0.001) { vec3 Tb; vec3 Pb = flPathOne(1, uAt.y + along, Tb); float m = uPathK.z * uPathK.z * (3.0 - 2.0 * uPathK.z); P = mix(P, Pb, m); T = mix(T, Tb, m); }
    return P;
  }
  vec3 flBall(vec4 sd) { float z = sd.x * 2.0 - 1.0, a = sd.y * 6.2831853, r = sqrt(max(0.0, 1.0 - z * z)); return vec3(r * cos(a), r * sin(a), z) * pow(sd.z, uSkew.y); }
  // where a bird that is pouring is, tau = 0 (still in the flock, at P0) .. 1 (in its place Q): in over the mouth, round and down
  vec3 flFunnel(vec4 sd, float tau, float t, vec3 P0, vec3 Q) {
    float g1 = smoothstep(0.0, 0.42, tau), g2 = smoothstep(0.34, 1.0, tau);
    float ang = sd.y * 6.2831853 + uPour.w * (3.2 * g2 + 0.6 * t);
    // (pouring in, the funnel narrows to a neck over the crown; lifting out, uPour.z of 2 or more, there is no neck: the birds
    // leave the whole crown at once and close up above it. Through a neck they rose as a jet: a fountain)
    float neck = uPour.z > 1.5 ? 0.85 : 0.22;
    float disc = mix(0.3, 1.0, sqrt(fract(sd.w * 7.31 + sd.x * 3.7)));           // (the mouth is a disc of birds, never a hoop: on a circle they came out of the crown as a wreath)
    vec3 rim = uMouth.xyz + vec3(cos(ang), 0.0, sin(ang)) * uMouth.w * disc * mix(1.0, neck, g2) + vec3(0.0, (sd.z - 0.3) * uMouth.w * 0.5 * (1.0 - g2), 0.0);
    return mix(P0, mix(rim, Q, g2 * g2), g1);
  }
`;
const VERT_FLOCK = /* glsl */`
    vec3 bp = position, bn = normal;
    vec4 sd = aSeed; float t = uBirdTime;
    // ---- its place in the plate. Along: -1 at the tail .. 1 at the head, crowded toward the head (but the crowding is capped:
    // left to itself it piles a black knot of birds on the very tip of a ribbon), with a few stragglers behind. Across: -1..1,
    // a little more crowded at the two side borders than in the middle (a real flock is densest at its edge; but twice as dense
    // there, a ribbon passing overhead was two strands with sky between). Through: crowded toward
    // the middle of the plate's thickness, which thins toward the side borders: a lens in section, never a hollow tube (a
    // shell of birds showed from below as two strands, and its pole as a dense dart flying ahead of the flock).
    float fa = 1.0 - 2.0 * mix(sd.x, pow(sd.x, uSkew.x), 0.65);
    fa -= 0.3 * pow(sd.w, 5.0) * (1.0 - smoothstep(-1.0, 0.2, fa));
    float ua = sd.y * 2.0 - 1.0, xa = mix(ua, sin(ua * 1.5707963), 0.2);
    float va = sd.z * 2.0 - 1.0, ya = va * (0.35 + 0.65 * abs(va)) * sqrt(1.0 - 0.7 * xa * xa);
    float taper = mix(uShape.w, 1.0, smoothstep(-1.0, 0.3, fa));
    vec3 q = vec3(fa * uShape.x, xa * uShape.y * taper, ya * uShape.z * taper);                // along, across, up: metres
    // its leading edge is an arc, never a wall: the birds at the sides fly a little behind those in the middle (by as much as
    // the flock is wide, at most), and no two are level
    q.x -= min(uShape.y, 0.6 * uShape.x) * (1.0 - sqrt(1.0 - 0.96 * xa * xa)) + min(uShape.z, 0.3 * uShape.x) * 0.6 * ya * ya + 0.03 * uShape.x * sd.w * sd.w;
    float bS = uBirdScale * (0.88 + 0.24 * sd.w), fold = 0.0, stand = 0.0, head = 0.0, legs = 0.0, depth = 1.0;
    #ifdef FLOCK_HOMES
      float ts = uClock - aRel;                                                  // seconds since this bird let go of the ground
      q.x = uVel * max(ts - uRun.z, 0.0) - sd.x * 0.3 * uShape.x;                 // they string out along the path from the moment each leaves
    #endif
    // ---- the path under it, and how the path turns there
    vec3 T0, T1; vec3 C = flPath(q.x, T0); flPath(q.x + 8.0, T1);
    vec3 T = normalize(T0), Tn = normalize(T1);
    float kappa = (T.z * Tn.x - T.x * Tn.z) / 8.0;                                // the turn, radians a metre
    float bank = -atan(uVel * uVel * kappa / 9.81);
    vec3 N = normalize(vec3(-T.z, 0.0, T.x) + vec3(1e-5, 0.0, 0.0)), B = cross(N, T);
    float ro = bank * uFold.w; float cr = cos(ro), sr = sin(ro);                  // the whole plate banks with the turn
    vec3 N1 = N * cr - B * sr, B1 = B * cr + N * sr;
    // ---- the folds: waves through the plate, sideways and up and down
    float k1 = 6.2831853 / uFold.y, A = uFold.x, w = uFold.z;
    float p1 = k1 * (q.x + 0.35 * q.y) + w * 0.62 * t, p2 = k1 * 1.37 * q.x - w * 0.48 * t + 1.7, p3 = k1 * 1.9 * (0.5 * q.x - 0.85 * q.y) + w * 0.81 * t + 4.1;
    float p4 = k1 * 3.7 * (0.9 * q.x + 0.4 * q.y) - w * 1.5 * t + 2.3, p5 = k1 * 4.9 * q.x + w * 1.9 * t + 0.6;
    vec2 F = A * vec2(0.8 * sin(p2) + 0.2 * sin(p5), sin(p1) + 0.6 * sin(p3) + 0.25 * sin(p4));
    vec2 dF = A * w * vec2(-0.384 * cos(p2) + 0.38 * cos(p5), 0.62 * cos(p1) + 0.486 * cos(p3) - 0.375 * cos(p4));
    float ddAcross = A * w * w * (-0.184 * sin(p2) - 0.72 * sin(p5));
    // ---- a wave of bank crossing the flock. Its front is a plane in the world that sweeps through the flock where it is (set
    // from the flock's own heading when the wave begins), so that it crosses the whole mass the rider sees as one band,
    // however the flock is folded or wound round its path; the birds in the band roll over and jink. Far off, where a bird is
    // three pixels and its roll cannot be seen, the band is made of ink: the birds close up toward its middle (two and a half
    // times as many there, fewer at its two edges) and each is drawn a third larger, as a bird is that turns its wings to the eye. (A band
    // that ran along the flock's own length changed thousands of pixels and could not be seen at all.)
    // uWave: start, strength, half the flock's extent along the wave's way (metres), where its middle is; uWaveD: the way it goes.
    vec3 P0 = C + N1 * (q.y + F.x) + B1 * (q.z + F.y);
    float wv = 0.0; vec3 wsh = vec3(0.0);
    for (int i = 0; i < 2; i++) {
      float tt = (t - uWave[i].x) / uWaveK.x;
      if (tt > -0.2 && tt < 1.3) {
        float xw = (dot(P0 - uCentre, uWaveD[i]) - uWave[i].w) / uWave[i].z, d = (xw - (-1.4 + 2.8 * tt)) / uWaveK.y, g = exp(-d * d) * uWave[i].y;
        wv += g; wsh -= uWaveD[i] * (d * g * uWave[i].z);
      }
    }
    float wfar = smoothstep(40.0, 110.0, distance(P0, uCameraPos));               // (within 40 m a bird is seen to roll, and is not moved)
    bS *= 1.0 + uWaveC.y * min(wv, 1.5) * wfar;
    vec3 P = P0 + wsh * (uWaveK.y * uWaveC.x * wfar) + N1 * (wv * uWaveK.z * 0.6) - B1 * (wv * uWaveK.z);
    vec3 V = T * uVel + N1 * dF.x + B1 * dF.y;
    float roll = bank + atan(ddAcross / 9.81) + wv * uWaveK.w * (0.7 + 0.6 * sd.w);
    // ---- the wings: a whirr, and shut for an instant
    float cyc = fract(t / (uFlockFlap.y * (0.9 + 0.2 * sd.y)) + sd.z * 7.0);
    fold = uFlockFlap.z > 0.0 ? smoothstep(1.0 - uFlockFlap.z, 1.0 - uFlockFlap.z + 0.08, cyc) * (1.0 - smoothstep(0.94, 1.0, cyc)) : 0.0;
    // ---- the pour into the tree (or out of it)
    if (uPour.x > 0.0) {
      float order = mix((1.0 - fa) * 0.5, sd.w, uPour.z - 2.0 * step(1.5, uPour.z)), share = uPour.y;
      float tau = clamp((uPour.x - order * (1.0 - share)) / share, 0.0, 1.0);
      if (tau > 0.0) {
        vec3 Q = uInto + uIntoR * flBall(sd.wzyx);
        vec3 Pa = flFunnel(sd, tau, t, P, Q), Pb = flFunnel(sd, min(1.0, tau + 0.03), t, P, Q);
        V = mix(V, (Pb - Pa) / 0.03 * (uGrain.z / share), smoothstep(0.0, 0.2, tau));
        P = Pa;
        bS *= smoothstep(0.0, 3.0, distance(P, Q)) * step(tau, 0.9995);          // gone between the leaves over its last three metres
        fold = max(fold, 0.45 * smoothstep(0.3, 0.6, tau));                      // wings half shut in the stoop
        roll += sin(sd.x * 40.0 + t * 5.0) * 0.6 * smoothstep(0.2, 0.6, tau);
      }
    }
    #ifdef FLOCK_HOMES
      // ---- standing, then a run into the wind, then the climb to its place in the ribbon
      {
        vec3 H = aHome.xyz, run = vec3(uRun.x, 0.0, uRun.y);
        float r = clamp(ts / uRun.z, 0.0, 1.0), air = max(ts - uRun.z, 0.0);
        vec3 Pf = H + run * (5.0 * r * r + 12.0 * air) + vec3(0.0, 1.0, 0.0) * min(3.0 * air, 60.0);
        float join = smoothstep(0.0, uRun.w, air);
        P = mix(Pf, P, join);
        V = mix(run * mix(0.5, 12.0, r) + vec3(0.0, 3.0 * step(0.001, air), 0.0), V, join);
        roll *= join;
        stand = 1.0 - smoothstep(0.15, 0.9, r); legs = 1.0 - smoothstep(0.7, 1.0, r) * smoothstep(0.0, 0.8, air + 0.2);
        float feeds = step(sd.w, uGrain.w);                                      // some feed, head down, until the heads come up
        head = mix(-feeds, 1.0, smoothstep(-0.5, 0.0, ts));
        fold = max(fold * join, 1.0 - smoothstep(0.0, 0.25, r));
        depth = smoothstep(0.0, 0.2, r);
        if (ts < 0.0) { V = vec3(sin(aHome.w), 0.0, cos(aHome.w)); }
        float sway = ts < -0.5 ? 0.0087 * sin(t * 1.05 + sd.x * 40.0) : 0.0;     // asleep, it sways half a degree
        roll += sway;
      }
    #endif
    // ---- never near the rider, never through what the realm names
    { vec3 e = P - uCameraPos; float d = length(e); if (d < uKeep) P += e / max(d, 1e-3) * (uKeep - d); }
    for (int i = 0; i < 4; i++) { if (uObst[i].w > 0.0) { vec3 e = P - uObst[i].xyz; float d = length(e); if (d < uObst[i].w) P += e / max(d, 1e-3) * (uObst[i].w - d) * (1.0 - step(0.001, uPour.x)); } }
    // ---- which way it faces: along the way it goes; pitch from climb and dive; bank from its turn and from the waves
    float sp = length(V); vec3 Vn = V / max(sp, 1e-4);
    vec3 bC = P, bYpr = vec3(atan(Vn.x, Vn.z), asin(clamp(Vn.y, -0.95, 0.95)), clamp(roll, -1.5, 1.5));
    #ifdef FLOCK_HOMES
      bYpr.y = mix(bYpr.y, uGrain.y, stand);                                     // (a standing bird's body is tipped tail-down)
    #endif
    vec4 bFlap = vec4((t * uFlockFlap.x * (0.92 + 0.16 * sd.w) + sd.x * 7.0) * 6.2831853, depth, 0.0, fold);
    vec4 bMisc = vec4(clamp(abs(roll) * 0.8, 0.0, 1.0), legs, head, stand);
    // How a flock is drawn. The painter's filter (src/engine/post.js) keeps a mark only if it is about as thick as its brush and
    // twice as long; anything finer it turns to tone. And at every distance the birds of a murmuration stand about as far apart,
    // in the picture, as they are wide. So a far flock cannot be drawn bird for bird: true to size it is dust that the filter
    // turns to a faint smoke, and bold, bird for bird, it is one blot. It is drawn as a painter would:
    //   - the VEIL: every bird, left as fine as it is but larger than life far off (uDab.y times beyond about 200 m, life size
    //     within 50 m). The filter melts these to a tone that is deepest where the flock is thick or seen edge-on and where a
    //     wave of bank turns the wings to the eye: the flock's body, its hard edge and its travelling bands;
    //   - MARKS: a share of the birds, drawn as one dab of the brush each (never less than uDab.x pixels across the wings, and
    //     as thick as the brush will keep). As many as lay down the ink that all of them would at their own size (uGrain.x = 1:
    //     more is more), so the flock keeps one weight from 300 m to 30 m: at 300 m two or three birds in a hundred, at 140 m
    //     one in nine, at 80 m a third, and from about 45 m every bird, which is then simply a bird, drawn a little boldly;
    //   - the marks are taken first from the flock's rim as the rider sees it and from its thin tail: its outline is stippled
    //     with birds, its middle is tone.
    float dd = max(length(P - uCameraPos), 1.0);
    float lifePx = uRef * uBirdScale * uPxScale / dd;                            // its wingspan in pixels, at the size this flock is drawn
    float markPx = max(lifePx, uDab.x);
    float fr = min(uGrain.x * lifePx * lifePx / (markPx * markPx), uDab.z);
    vec3 see = (P - uCameraPos) / dd;
    vec3 sw = normalize(vec3(dot(see, T) / max(uShape.x, 1.0), dot(see, N1) / max(uShape.y, 1.0), dot(see, B1) / max(uShape.z, 1.0)) + 1e-6);
    vec3 ub = vec3(fa, xa * taper, ya * taper);
    float rim = length(ub - sw * dot(ub, sw));                                   // 0 in the middle of the flock as it is seen .. 1 on its outline
    float rank = sd.w / mix(0.55, 3.2, max(smoothstep(0.86, 1.0, rim), smoothstep(-0.55, -0.95, fa)));
    float dab = clamp((fr - rank) / (0.25 * fr + 0.02), 0.0, 1.0);
    float bBold = uBold.x * dab, bMin = dab * markPx;
    bS *= mix(1.0, uDab.y, (1.0 - dab) * smoothstep(50.0, 220.0, dd) * (1.0 - stand));       // (a bird that stands on the ground is never drawn larger than it is: it would sink into it)
    bS *= uShow;
    vBirdTint = 0.9 + 0.2 * sd.y;
    ${GLSL_PLACE}
`;

// the perched bird: x = head, y = crest, z = tail, w = fluff (see perchedGeometry)
const GLSL_PERCH = /* glsl */`
  attribute vec4 aPos, aRot, aPerch;
  uniform vec4 uPerchK, uPerchK2;                                                // feet (y, z), neck (y, z); tail fan, crest base (y, z), spare
  void perchPose(inout vec3 p, inout vec3 n, vec4 perch, float crest) {
    float fl = aPart.w * perch.w;                                                // fluffed: rounder, the head drawn in
    p.xy = vec2(p.x, p.y) * (1.0 + 0.30 * fl) - vec2(0.0, 0.004 * fl);
    p.z -= 0.012 * perch.w * aPart.x;
    if (aPart.y > 0.0) { vec3 cb = vec3(0.0, uPerchK2.y, uPerchK2.z); vec3 q = p - cb; q = bRotX(q, (crest - 0.5) * 0.9 * aPart.y); p = cb + q; }
    if (aPart.x > 0.0) { vec3 nk = vec3(0.0, uPerchK.z, uPerchK.w); vec3 q = p - nk; q = bRotX(bRotY(q, perch.x * aPart.x), perch.y * aPart.x); n = bRotX(bRotY(n, perch.x * aPart.x), perch.y * aPart.x); p = nk + q; }
    float tw = aPart.z;
    if (tw != 0.0) { vec3 q = p - uTailBase; q = bRotX(q, perch.z * step(0.01, abs(tw))); p = uTailBase + q; }
    p -= vec3(0.0, uPerchK.x, uPerchK.y);                                        // onto its feet
  }
`;
const VERT_PERCH = /* glsl */`
    vec3 bp = position, bn = normal;
    vec3 bC = aPos.xyz, bYpr = vec3(aRot.x, aRot.y, 0.0); float bS = aPos.w * uBirdScale;
    vBirdTint = aRot.w;
    {
      vec3 cw = (modelMatrix * vec4(bC, 1.0)).xyz; float bd = length(cw - uCameraPos);
      bS *= clamp(0.75 * uMinPx * bd / max(uPxScale * uRef * 0.55 * uBirdScale, 1e-4), 1.0, uMaxGrow);       // (a perched bird is as long as half its span: its least size goes by its length)
      bp += aFat * clamp(0.5 * (uBold.x * bd / uPxScale - uBold.y * bS), 0.0, uBold.z * uRef * bS) / max(bS, 1e-5);
      { float kc = uCrisp.x * (1.0 - smoothstep(uCrisp.y, uCrisp.z, uBold.y * bS * uPxScale / max(bd, 1e-3))); vBirdCrisp = 0.1 * kc + 0.9 * smoothstep(0.7, 1.0, kc); }
      vBirdSil = uSil * (1.0 - smoothstep(10.0, 30.0, uRef * bS * uPxScale / max(bd, 1e-3)));
    }
    perchPose(bp, bn, aPerch, aRot.z);
    transformed = bC + bOrient(bp, bYpr) * bS;
    objectNormal = bOrient(bn, bYpr);
    vBirdUnder = aUnder;
`;

const FRAG_PARS = /* glsl */`
  varying vec3 vBirdUnder; varying float vBirdTint, vBirdCrisp, vBirdSil;
  uniform float uBirdFog, uVeil; uniform vec4 uSunline; uniform vec3 uPreSun;
`;
// a bird that is small in the picture is seen against the sky, and whatever its plumage it is a dark shape there: a pale bird
// lit like a wall was a grey ghost on a pale sky
const FRAG_LIGHT = /* glsl */`
    #ifdef BIRD_SHADOW
      // a far flock of dark birds is a silhouette: it wears the colour the realm gives a thing turned from the light, whichever
      // way a wing faces (half-lit it went pale where wings caught the key light, and at night it glowed against the sky)
      c = albedo * (mix(vec3(1.0), uRampShadow, 0.85) + 0.5 * (uGroundLight + uSkyLight));
    #endif
    c *= 1.0 - 0.68 * vBirdSil;
`;
// the mark that keeps a thin thing out of the painter's filter (CRISP_ALPHA of src/engine/gouache.js; the filter, src/engine/post.js,
// reads anything under 0.5 as a share of it and leaves a pixel wholly alone from a tenth of it, so a bird can ease from painted
// to crisp as it goes away: vBirdCrisp runs 0 .. 0.07 over that easing and then jumps to 1)
const FRAG_FINAL = /* glsl */`
    if (vBirdCrisp > 0.0) gl_FragColor.a = 0.5 - ${(0.5 - CRISP_ALPHA).toFixed(1)} * vBirdCrisp;
`;
const FRAG_ALBEDO = /* glsl */`
    // (clamped: on a bird smaller than a pixel the paint is read outside its triangle, and what is read there can be less than
    // nothing: a bill's colour running backwards gave single electric-blue pixels in a far flock)
    albedo = uColor * clamp(gl_FrontFacing ? vColor.rgb : vBirdUnder, 0.0, 1.0) * vBirdTint;
    #ifdef BIRD_SUNLINE
      { float lit = smoothstep(uSunline.x - uSunline.y, uSunline.x + uSunline.y, vWPos.y);        // below the line of first light a bird keeps the colour of the night
        float lum = dot(albedo, vec3(0.3, 0.6, 0.1)); albedo = mix(uPreSun * (0.5 + 0.5 * smoothstep(0.02, 0.35, lum)), albedo, lit); }
    #endif
`;
const FRAG_FOG = /* glsl */`
    fog = mix(fog * uBirdFog, fog, uVeil);                                       // a far flock may ask to be spared some of the realm's fog; the veil between areas still takes it
`;

/** Degrees the hand must turn about the wrist for its leading edge to lie straight back along the body: 90 less the sweep it has when spread. */
function shutAngle(sp) { const W = sp.wing, tip = W.hand[W.hand.length - 1]; return 90 - Math.atan2(W.wrist[1] - tip[2], tip[1] - W.wrist[0]) / DEG; }

/** The chord of the wing half-way along the hand: with the body's depth, the thinnest thing about a bird. */
function thinChord(sp) { const h = sp.wing.hand[Math.floor((sp.wing.hand.length - 1) / 2)]; return Math.max(0.01, h[2] - h[3]); }

function speciesUniforms(sp, geoInfo) {
  const W = sp.wing, s = sp.stroke, g = sp.glide, f = sp.fold, T = sp.tail, L = sp.legs, N = sp.neck;
  return {
    uShoulder: { value: new THREE.Vector3(W.root[0] + 0.003, W.y, W.root[1] - 0.3 * (W.root[1] - W.root[2])) },
    uWrist: { value: new THREE.Vector3(W.wrist[0], W.y, W.wrist[1] - 0.002) },
    uTailBase: { value: new THREE.Vector3(0, T.base[1], T.base[0]) },
    uHip: { value: L ? new THREE.Vector3(L.hip[0] || 1, L.hip[1], L.hip[2]) : new THREE.Vector3() },
    uStroke: { value: new THREE.Vector4(s.up * DEG, s.down * DEG, s.frac, s.lag) },
    uStroke2: { value: new THREE.Vector4(s.gain, (s.flex ?? 20) * DEG, 0, s.bob) },
    uGlide: { value: new THREE.Vector4(g.dihedral * DEG, g.hand * DEG, g.arm * DEG, 0) },
    uFoldK: { value: new THREE.Vector4(f.arm * DEG, (f.hand ?? shutAngle(sp)) * DEG, f.shrink, f.rest * DEG) },
    uTailK: { value: new THREE.Vector4(T.spread * DEG, 0.22, 0, 0) },
    uNeckK: { value: N ? new THREE.Vector4(N.base[0], N.base[1], 0, N.length) : new THREE.Vector4() },
    uLegK: { value: new THREE.Vector4(L ? (L.hidden ? 1.45 : 1.57 - (sp.stand ? sp.stand.pitch * DEG : 0)) : 0, 0.5, 38, sp.neck ? 0.17 : 0) },
    uRef: { value: sp.ref },
    uBold: { value: new THREE.Vector4(2.6, Math.min(2 * sp.body.rings[Math.min(3, sp.body.rings.length - 1)][2], thinChord(sp)), 0.16, 1) },
  };
}

/** The material of one flock: gouache with the bird's pose in its vertex shader. kind: 'cpu' | 'perch' | 'flock'. */
function birdMaterial(ctx, sp, kind, o, extra = {}) {
  const sh = ctx.engine.shared, defines = {};
  if (sp.legs) { defines.BIRD_LEGS = ''; if (sp.legs.hidden) defines.BIRD_LEGS_HIDDEN = ''; }
  if (sp.neck) defines.BIRD_NECK = '';
  if (o.sunline != null) defines.BIRD_SUNLINE = '';
  if (kind === 'flock' && (o.lit != null ? !o.lit : (() => { const [r, g, b] = rgb(sp.paint.top); return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.05; })())) defines.BIRD_SHADOW = '';      // (dark birds; a flock of pale ones keeps the realm's light: flamingos must take first light)
  const uniforms = {
    ...speciesUniforms(sp), uBirdTime: { value: 0 }, uPxScale: { value: 780 }, uMinPx: { value: o.minPixels ?? 0 }, uMaxGrow: { value: o.maxGrow ?? 3 }, uGuard: { value: 0.75 }, uBirdScale: { value: o.scale ?? 1 },
    uCrisp: { value: new THREE.Vector3(o.crisp === false ? 0 : 1, o.crispBelow ?? 8, o.crispAbove ?? 16) }, uSil: { value: o.silhouette ?? sp.silhouette ?? 0 },
    uBirdFog: { value: o.fog ?? 1 }, uVeil: sh.uVeil, uSunline: { value: new THREE.Vector4(o.sunline?.y ?? -1e4, o.sunline?.soft ?? 1.2, 0, 0) }, uPreSun: { value: new THREE.Color(o.sunline?.color ?? '#9A93B8') },
    ...(extra.uniforms || {}),
  };
  if (kind === 'perch') {
    const body = extra.body || sp.body, pc = sp.perch || { feet: [-body.rings[3][3], -0.02] }, R = body.rings;
    const near = (z) => R.reduce((a, r) => (Math.abs(r[0] - z) < Math.abs(a[0] - z) ? r : a), R[0]);
    const r1 = near(body.head ?? R[1][0]), r2 = near(body.neck ?? R[2][0]), cr = body.crest || sp.crest;
    uniforms.uPerchK = { value: new THREE.Vector4(pc.feet[0], pc.feet[1], r2[4], r2[0]) };
    uniforms.uPerchK2 = { value: new THREE.Vector4(0, cr ? cr.front[1] : r1[4] + r1[2] - 0.004, cr ? cr.front[0] : r1[0] + 0.004, 0) };
  }
  const pars = kind === 'perch' ? GLSL_POSE + GLSL_PERCH : kind === 'cpu' ? `attribute vec4 aPos, aRot, aFlap, aMisc;\n${GLSL_POSE}` : GLSL_POSE + GLSL_FLOCK;
  const mat = ctx.kit.gouache({
    // (a far flock is a silhouette: it takes half of the realm's light ramp, so that wings turned to the light do not go pale)
    color: o.color ?? '#ffffff', brush: kind === 'perch' ? 0.5 : kind === 'flock' ? 0 : 0.2, shade: kind === 'flock' ? 0.5 : 1, ...(o.material || {}), side: THREE.DoubleSide, vertexColors: true,
    extend: { defines: { ...defines, ...(extra.defines || {}) }, uniforms, vertexPars: pars, vertexLocal: kind === 'perch' ? VERT_PERCH : kind === 'cpu' ? VERT_CPU : VERT_FLOCK, fragmentPars: FRAG_PARS, albedo: FRAG_ALBEDO, light: FRAG_LIGHT, fog: FRAG_FOG, final: FRAG_FINAL },
  });
  return mat;
}

/**
 * Give a mesh what each pass needs.
 * - Sizes in pixels are pixels of the picture being drawn (the main picture, or the smaller one the water mirrors).
 * - How bold a far bird is drawn follows the painter's filter: the filter wipes out anything thinner than its brush, so
 *   where it is at work a far bird's strokes are thickened to about the width of that brush (and it leaves them looking
 *   like one stroke of dark paint); in the water's mirror, which the filter does not touch, they stay fine.
 * - A bird sits out the engine's scene pre-pass (the view without the water, kept for the water to look through and for
 *   the filter to tell paint from water) unless `inPre`: a third less to draw for a large flock. Birds that fly low over
 *   the water near the rider should be in it (`prePass: true`), or the filter takes them for water and leaves them crisp.
 */
function perPass(ctx, mesh, geo, count, inPre = false, bold = null, each = null, stroke = 1.05, crisp = true) {
  const size = new THREE.Vector2(), engine = ctx.engine;
  mesh.frustumCulled = false;
  mesh.onBeforeRender = (renderer, scene, camera, geometry, material) => {
    const full = renderer.getDrawingBufferSize(size).y, rt = renderer.getRenderTarget(), h = rt ? rt.height : full, u = material.uniforms;
    u.uPxScale.value = h * 0.5 * camera.projectionMatrix.elements[5];
    // the mark that keeps a bird out of the painter's filter is written in the picture itself only: never in the water's mirror
    // or in the engine's picture of what lies under the water, which the filter does not touch
    const picture = !engine.reflecting && !(rt && rt === engine.pre);
    if (u.uCrisp) u.uCrisp.value.x = crisp && picture && (engine.paintAmount || 0) > 0.01 ? 1 : 0;
    if (bold != null) u.uBold.value.x = bold;
    else if (crisp) u.uBold.value.x = 1.6 * h / 900;                             // (crisp birds need no more than a hairline's keep: a pixel and a half at 900 lines)
    else { const brush = (engine.paintRadius || 4.5) * h / 1080; u.uBold.value.x = engine.reflecting ? 1.6 : Math.max(1.6, smooth(0.15, 0.7, engine.paintAmount || 0) * brush * stroke); }
    if (each) each(u, u.uBold.value.x, h / Math.max(1, full));
    material.uniformsNeedUpdate = true;
    geo.instanceCount = !inPre && rt && rt === engine.pre ? 0 : count();
  };
}

// =====================================================================================================================
// Routes: closed (or open) curves through points, walked by distance
// =====================================================================================================================
export class Route {
  /** points: [[x, y, z], ...] in the realm's coordinates; closed: it joins its end to its start. */
  constructor(points, closed = true) {
    this.pts = points.map((p) => (p.isVector3 ? [p.x, p.y, p.z] : [p[0], p[1], p[2]])); this.closed = closed;
    const n = this.pts.length, segs = closed ? n : n - 1, per = 24;
    this.segs = segs; this.per = per; this.table = new Float32Array(segs * per + 1);
    let len = 0; const a = [0, 0, 0], b = [0, 0, 0];
    this.raw(0, 0, a);
    for (let i = 0; i < segs; i++) for (let k = 1; k <= per; k++) { this.raw(i, k / per, b); len += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); this.table[i * per + k] = len; a[0] = b[0]; a[1] = b[1]; a[2] = b[2]; }
    this.length = len;
  }
  pt(i) { const n = this.pts.length; return this.closed ? this.pts[((i % n) + n) % n] : this.pts[clamp(i, 0, n - 1)]; }
  /** Catmull-Rom on segment i at t (0..1); out = [x, y, z]; with `d` also the derivative. */
  raw(i, t, out, d = null) {
    const p0 = this.pt(i - 1), p1 = this.pt(i), p2 = this.pt(i + 1), p3 = this.pt(i + 2), t2 = t * t, t3 = t2 * t;
    for (let k = 0; k < 3; k++) {
      const a = 2 * p1[k], b = p2[k] - p0[k], c = 2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k], e = -p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k];
      out[k] = 0.5 * (a + b * t + c * t2 + e * t3);
      if (d) d[k] = 0.5 * (b + 2 * c * t + 3 * e * t2);
    }
    return out;
  }
  /** Position at distance s along it (a closed route goes round; an open one runs straight on past its ends). out: { x, y, z, tx, ty, tz }. */
  at(s, out) {
    const L = this.length; let over = 0;
    if (this.closed) { s %= L; if (s < 0) s += L; } else if (s < 0) { over = s; s = 0; } else if (s > L) { over = s - L; s = L; }
    const T = this.table; let lo = 0, hi = T.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m] <= s) lo = m; else hi = m; }
    const f = T[hi] > T[lo] ? (s - T[lo]) / (T[hi] - T[lo]) : 0, u = (lo + f) / this.per, i = Math.min(this.segs - 1, Math.floor(u));
    this.raw(i, u - i, _ra, _rd);
    const l = Math.hypot(_rd[0], _rd[1], _rd[2]) || 1;
    out.tx = _rd[0] / l; out.ty = _rd[1] / l; out.tz = _rd[2] / l;
    out.x = _ra[0] + out.tx * over; out.y = _ra[1] + out.ty * over; out.z = _ra[2] + out.tz * over;
    return out;
  }
  /** The distance along the route of the point on it nearest to (x, y, z) (y may be left out: then nearest in plan). */
  nearest(x, y, z) {
    let best = 0, bd = Infinity; const n = Math.max(64, Math.ceil(this.length / 1.5));
    for (let i = 0; i < n; i++) { const s = i / n * this.length; this.at(s, _rp); const d = (x - _rp.x) ** 2 + (z - _rp.z) ** 2 + (y == null ? 0 : (y - _rp.y) ** 2); if (d < bd) { bd = d; best = s; } }
    return best;
  }
  /** `n` points evenly spaced along it (for the flock shader). */
  resample(n) { const out = []; for (let i = 0; i < n; i++) { this.at(this.closed ? i / n * this.length : i / (n - 1) * this.length, _rp); out.push(new THREE.Vector3(_rp.x, _rp.y, _rp.z)); } return out; }
}
const _ra = [0, 0, 0], _rd = [0, 0, 0], _rp = {};
/** A point as [x, y, z], whether it was given so or as a Vector3 (what kit.at(s, d, y) returns). */
const xyz = (p) => (p && p.isVector3 ? [p.x, p.y, p.z] : p);

/** Points of a figure of eight (a lazy eight for birds that quarter a place): { at: [x, y, z], size: [length, width], turn (radians), rise (metres the far ends lift) }. */
export function figureEight({ at = [0, 10, 0], size = [40, 16], turn = 0, rise = 0, points = 12 } = {}) {
  at = xyz(at);
  const out = [], c = Math.cos(turn), s = Math.sin(turn);
  for (let i = 0; i < points; i++) {
    const a = i / points * TAU, lx = Math.sin(a) * size[0] * 0.5, lz = Math.sin(a * 2) * size[1] * 0.5;
    out.push([at[0] + lx * c + lz * s, at[1] + rise * Math.abs(Math.sin(a)), at[2] - lx * s + lz * c]);
  }
  return out;
}
/** Points of a loop (an oval): { at, size: [length, width], turn, tilt (metres one end is higher) }. */
export function loop({ at = [0, 10, 0], size = [40, 30], turn = 0, tilt = 0, points = 10 } = {}) {
  at = xyz(at);
  const out = [], c = Math.cos(turn), s = Math.sin(turn);
  for (let i = 0; i < points; i++) {
    const a = i / points * TAU, lx = Math.cos(a) * size[0] * 0.5, lz = Math.sin(a) * size[1] * 0.5;
    out.push([at[0] + lx * c + lz * s, at[1] + tilt * Math.cos(a) * 0.5, at[2] - lx * s + lz * c]);
  }
  return out;
}

// =====================================================================================================================
// makeFlock: the birds that are watched. Each has a place, an attitude and a little state on the CPU; the pose is the shader's.
// =====================================================================================================================
const NO_FLUSH = Object.freeze({});
const ST = { ROUTE: 0, PERCHED: 1, CROUCH: 2, TRANSIT: 3, WHEEL: 4, PATTER: 5, SHEAR: 6, WANDER: 8, GONE: 9, MANUAL: 10, TOWER: 11, AWAY: 12 };
const ACT = { NONE: 0, PECK: 1, GULP: 2, FLUFF: 3, SIDLE: 4, FLICK: 5, PREEN: 6 };
// what a perched bird does with itself, and how often (weights)
const IDLE = {
  waxwing: [[ACT.PECK, 4], [ACT.GULP, 1.5], [ACT.FLUFF, 1], [ACT.SIDLE, 1.5], [ACT.NONE, 3]],
  swallow: [[ACT.FLICK, 2], [ACT.PREEN, 1.5], [ACT.SIDLE, 1], [ACT.NONE, 4]],
  starling: [[ACT.SIDLE, 2], [ACT.FLUFF, 1], [ACT.PREEN, 1], [ACT.NONE, 4]],
  bird: [[ACT.PREEN, 1], [ACT.NONE, 3]],
};

/**
 * A flock of birds that are steered one by one (tens, a few hundred at most).
 *
 * options (all but `species` optional):
 *   species        'swift' | 'swallow' | 'starling' | 'petrel' | 'waxwing' | 'bat' | 'tern' | 'flamingo', or a species record
 *   count          how many at high quality (thinned by the quality setting unless `exact`)
 *   detail         'near' (about 200 triangles) | 'far' (about 50); default: near for 120 birds or fewer
 *   scale          draw them this much larger than life (1.3 for a swallow that must read at 40 m)
 *   minPixels      far off, never draw a bird smaller than this many pixels across the wings (default 8), up to `maxGrow`
 *                  times life (3)
 *   crisp          default true: a bird that is small in the picture marks itself so that the painter's filter leaves it as
 *                  drawn, at its true size (wholly while its thinnest measure is under 8 pixels, not at all above 16);
 *                  false = the bird is painted like everything else, and thickened to the brush's width to survive it
 *   bold           the least thickness of a far bird's strokes, pixels. Default 1.6 (a pixel and a half at 900 lines); with
 *                  crisp: false it follows the realm's painter's filter (about the width of its brush); 0 = never thickened
 *   silhouette     0..1: how far a bird darkens when it is small in the picture (default: the species': 0.8 for the pale
 *                  waxwing, 0 for the others; a far flamingo or tern must keep its colour)
 *   route / routes one closed route, or several: [[x, y, z], ...] each (kit.at(s, d, y) gives such points); the birds
 *                  are strung along them as parties with slack between them
 *   speed          m/s along a route (default: the species' fast speed); spacing: metres between birds of a party (2.2);
 *                  jitter: metres each wanders about its place (1.2); start: 0..1, where on its route a party begins
 *   dip            { every: seconds, below: metres, where: (x, z) => bool }: on stretches of route lower than `below` a bird
 *                  comes down and touches the water with its bill about every `every` seconds (bats: with habit 'wander')
 *   perches        where birds sit: [{ x, y, z, along: [dx, dy, dz] (the way the bough runs), face: radians, look: [x, y, z] (an apple
 *                  to lean to), group: 'name', room: how many may sit there, within: its own flush distance, to: the group
 *                  its birds flee to, hide: true (not flitted to) }, ...], Object3Ds (the named empties of a model), or
 *                  { line: [[x, y, z], [x, y, z]], count, sag, group, within, to, hide }.
 *                  There must be at least as many places as birds (birds without a place stay hidden). Places belong to
 *                  one flock: two flocks given the same place will each put a bird on it
 *   habit          'route' | 'perch' | 'patter' (storm petrels) | 'wander' (bats) | 'manual': default by what else is given
 *   flit           { every: seconds, range: [min, max] metres }: now and then one perched bird flits to another free perch
 *   zone / zones   { x, z, r, y: [lo, hi] }: where a party of petrels feeds or bats hunt (several: birds are dealt out)
 *   wind           [x, z]: the way the wind blows (petrels feed facing into it; birds that tower hang into it)
 *   keepOut        metres every bird keeps from the rider's eye (default 3; with reduced motion at least 8: calmKeepOut)
 *   avoid          [{ x, y, z, r }, ...] other things to fly round
 *   flush          { within: metres, to: 'group', back: seconds, past: metres }: perched birds leave when the boat is this
 *                  near: to perches of another group, or up into a loose wheel until the boat has gone `past` metres on and
 *                  `back` seconds have passed. Petrels: { within } (they shear away and settle 20 to 30 m off)
 *   hidden         true: the birds are not there until release() or appear()
 *   only           'mirror' | 'direct': show them only in the water's reflection, or only in the direct view
 *   touch          false = do not write rings on the water (onTouch is still called);  mark: { channel, radius, strength }:
 *                  also write this into the water's trace at every touch (a petrel's stitches: { channel: 'glow', radius: 0.09, strength: 0.5 })
 *   onTouch(x, z, kind, i)   a bill ('bill'), a foot ('foot') or a wingtip ('wingtip') touched the water
 *   onLeave(i, x, y, z), onLand(i, x, y, z), onPass(distance, x, y, z)   for sound
 *   prePass        false = leave the birds out of the engine's scene pre-pass (see perPass above; saves a third of their cost)
 *   seed, exact, parent, color (a tint), fog (0..1 of the realm's fog), material ({...} more gouache options), sunline
 */
export function makeFlock(ctx, options = {}) {
  const o = { species: 'swift', count: 12, seed: 1, speed: null, spacing: 2.2, jitter: 1.2, keepOut: 3, touch: true, minPixels: 8, maxGrow: 3, ...given(options) };
  const sp = typeof o.species === 'string' ? SPECIES[o.species] : o.species;
  if (!sp) throw new Error(`birds: no species called '${o.species}'`);
  const name = typeof o.species === 'string' ? o.species : 'bird';
  const n = o.exact ? o.count : ctx.kit.count(o.count), rnd = ctx.rng(o.seed * 7 + 3), rndD = ctx.rng(o.seed * 13 + 5), calm = !!ctx.reducedMotion, K = o.scale ?? 1;
  const detail = o.detail || (n <= 120 ? 'near' : 'far');
  const group = new THREE.Group(); group.name = `birds:${name}`;
  (o.parent || ctx.group).add(group);

  // ---- the flying form
  const fly = birdGeometry(sp, detail), geo = fly.geometry;
  const aPos = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), aRot = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
  const aFlap = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), aMisc = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
  for (const a of [aPos, aRot, aFlap, aMisc]) a.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aPos', aPos); geo.setAttribute('aRot', aRot); geo.setAttribute('aFlap', aFlap); geo.setAttribute('aMisc', aMisc);
  geo.instanceCount = n;
  const mat = birdMaterial(ctx, sp, 'cpu', o);
  const mesh = new THREE.Mesh(geo, mat); mesh.name = `${name}:flying`;
  perPass(ctx, mesh, geo, () => n, o.prePass !== false, o.bold, null, 1.05, o.crisp !== false);
  group.add(mesh);

  // ---- the perched form (only if there is anywhere to sit)
  const perchList = normalisePerches(ctx, o.perches, rnd);
  let pGeo = null, pMat = null, pMesh = null, pPos = null, pRot = null, pPose = null, perchInfo = null, perchTris = 0;
  if (perchList.length || o.perched) {
    const pg = perchedGeometry(sp, detail === 'near' ? 'near' : 'far'); pGeo = pg.geometry; perchInfo = pg.perch; perchTris = pg.triangles;
    pPos = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4); pRot = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4); pPose = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    for (const a of [pPos, pRot, pPose]) a.setUsage(THREE.DynamicDrawUsage);
    pGeo.setAttribute('aPos', pPos); pGeo.setAttribute('aRot', pRot); pGeo.setAttribute('aPerch', pPose); pGeo.instanceCount = n;
    pMat = birdMaterial(ctx, sp, 'perch', o, { body: pg.body });
    pMesh = new THREE.Mesh(pGeo, pMat); pMesh.name = `${name}:perched`;
    perPass(ctx, pMesh, pGeo, () => n, o.prePass !== false, o.bold, null, 1.05, o.crisp !== false);
    group.add(pMesh);
  }
  if (o.only) ctx.only(group, o.only);

  // ---- the birds
  const routes = (o.routes || (o.route ? [o.route] : [])).map((r) => (r instanceof Route ? r : new Route(r, true)));
  const zones = (o.zones || (o.zone ? [o.zone] : [])).map((z) => ({ x: z.x, z: z.z, r: z.r ?? 20, y: z.y || [1.5, 6] }));
  const habit = o.habit || (routes.length ? 'route' : perchList.length ? 'perch' : sp === SPECIES.petrel ? 'patter' : zones.length ? 'wander' : 'manual');
  const speed0 = o.speed ?? sp.speed[1], posture = (perchInfo ? perchInfo.posture : 45) * DEG;
  const wl = Math.hypot(o.wind ? o.wind[0] : 0.6, o.wind ? o.wind[1] : 0.8) || 1, wind = { x: (o.wind ? o.wind[0] : 0.6) / wl, z: (o.wind ? o.wind[1] : 0.8) / wl };
  const idle = IDLE[name] || IDLE.bird, idleSum = idle.reduce((a, q) => a + q[1], 0);
  const legLen = sp.legs ? sp.legs.length * K : 0.03 * K, halfSpan = sp.ref * 0.5 * K;
  const birds = [];
  for (let i = 0; i < n; i++) {
    birds.push({
      i, state: ST.MANUAL, x: 0, y: -50, z: 0, px: 0, py: -50, pz: 0, vx: 0, vy: 0, vz: 1, yaw: 0, pitch: 0, roll: 0, scale: 0, show: 1, showTo: 1,
      phase: rnd() * TAU, depth: 1, glide: 0, fold: 0, tail: 0, legs: 0, vee: 0, stand: 0, tint: 0.9 + rnd() * 0.2, rate: sp.stroke.rate * (0.94 + rnd() * 0.12), rate0: 0,
      flapLeft: sp.rhythm.flap ? rnd() * sp.rhythm.flap[1] : 0, restLeft: 0, resting: false, fresh: true, turn: 0,
      // a party's slack: where it flies in its string, and how it wanders about that place
      route: 0, gap: 0, w1: 0.25 + rnd() * 0.3, w2: 0.5 + rnd() * 0.5, f1: rnd() * TAU, f2: rnd() * TAU, f3: rnd() * TAU, f4: rnd() * TAU, lane: (rnd() - 0.5) * 2, side: rnd() < 0.5 ? -1 : 1, wr: rnd(), wr2: rnd(),
      // perching
      launch: 0, offT: -1, faceTo: null, turning: 0, turnFrom: 0, turnBy: 0, turnWait: 0, react: 0, perch: -1, home: -1, timer: 0.5 + rnd() * 3, act: 0, actT: 0, actD: 1, headT: rnd() * 2, headTo: 0, headYaw: 0, headNod: 0, cock: 0, fluff: 0, crest: 0.5, pYaw: 0, pPitch: posture, hop: 0, alert: 0, sidled: 0, back: 0, away: false,
      // a flight from one place to another
      t: 0, dur: 1, ax: 0, ay: 0, az: 0, bx: 0, by: 0, bz: 0, cx: 0, cy: 0, cz: 0, dx: 0, dy: 0, dz: 0, dest: -1, then: ST.PERCHED, hide: false, flare: 0, nose: 0,
      blend: 1, fromMode: 0, fromX: 0, fromY: 0, fromZ: 0, wheelA: rnd() * TAU, goneAt: 1e9, wait: 0,
      dipT: 2 + rndD() * (o.dip && o.dip.every ? o.dip.every : 12), dip: 0, dipped: false, speed: speed0 * (0.96 + rnd() * 0.08),
      // petrels and bats
      zone: 0, spd: 1, step: 0, stepN: 0, tipT: 0, hdg: rnd() * TAU, hdgTo: 0, yTo: 3, jink: rnd() * 1.2, flushed: false, lift: 0,
    });
    birds[i].rate0 = birds[i].rate;
  }
  const S = { time: 0, head: routes.map(() => 0), speed: speed0, keepOut: calm ? Math.max(o.keepOut, o.calmKeepOut ?? 8) : o.keepOut, wheel: null, lastDip: -10, passMin: 1e9, passBest: 1e9, passed: false, nearest: 1e9, timeScale: 1, flitT: 1 + rnd() * 2, retime: null };

  const eye = ctx.engine.shared.uCameraPos.value, _o = {}, _q = {}, _w = {}, _al = [0, 0, 1];
  const water = ctx.water, boat = ctx.boat;
  const waterY = (x, z) => (water && water.heightAt ? water.heightAt(x, z) : 0);
  const touch = (x, z, kind, i, strength, radius) => {
    if (o.touch !== false && strength > 0 && water && water.ripple) water.ripple(x, z, strength, radius);
    if (o.mark && water && water.trace && water.trace.inject) water.trace.inject(x, z, o.mark);
    if (o.onTouch) o.onTouch(x, z, kind, i);
  };

  /** Push a bird out of a sphere it must not enter, sideways to the way it is going, so that a party divides round it. */
  function fend(b, cx, cy, cz, r, dirx, diry, dirz) {
    const dx = b.x - cx, dy = b.y - cy, dz = b.z - cz, R2 = 2 * r;
    const al = dx * dirx + dy * diry + dz * dirz;                                 // how far past the centre, along the way it flies
    if (al > R2 || al < -R2) return;
    let px = dx - dirx * al, py = dy - diry * al, pz = dz - dirz * al;            // and how far to the side
    let bl = Math.hypot(px, py, pz);
    if (bl > r * 2.2) return;
    if (bl < 0.05) {                                                              // dead on: each bird has a side it takes (most go round, a few go over)
      const sx = -dirz, sz = dirx, sl = Math.hypot(sx, sz) || 1, over = Math.abs(b.lane) > 0.75 ? 1 : 0.25;
      px = sx / sl * b.side; py = over; pz = sz / sl * b.side; const l = Math.hypot(px, py, pz); px /= l; py /= l; pz /= l; bl = 0.05;
    } else { px /= bl; py /= bl; pz /= bl; }
    if (py < -0.2 && cy < 2.5) { py = -0.2; const l = Math.hypot(px, py, pz); px /= l; py /= l; pz /= l; }      // never ducked under the eye into the water
    // a bulge in its path: full within r of the line through the centre, gone by 2.2 r, and eased in and out along the way
    const k = 1 - (al * al) / (R2 * R2), m = 1 - smooth(r, r * 2.2, bl), want = Math.sqrt(bl * bl + r * r * 1.15 * k * k * m);
    b.x = cx + dirx * al + px * want; b.y = cy + diry * al + py * want; b.z = cz + dirz * al + pz * want;
  }

  /** Keep a bird from the rider's eye and from what the realm names. rEye: how far from the eye (the flock's keep-out, unless a
   *  flight asks for less); along: the way it is going, if that is known better than from its last steps ([x, y, z], a unit). */
  function avoidAll(b, rEye = S.keepOut, along = null) {
    const l = Math.hypot(b.vx, b.vy, b.vz) || 1, dx = along ? along[0] : b.vx / l, dy = along ? along[1] : b.vy / l, dz = along ? along[2] : b.vz / l;
    if (rEye > 0) fend(b, eye.x, eye.y, eye.z, rEye, dx, dy, dz);
    if (o.avoid) for (const a of o.avoid) fend(b, a.x, a.y ?? 0, a.z, a.r, dx, dy, dz);
    {                                                                             // and a plain floor under it all: never within 0.7 m of the lens, wingtips included
      const ex = b.x - eye.x, ey = b.y - eye.y, ez = b.z - eye.z, d = Math.hypot(ex, ey, ez), min = Math.max(0.75 + halfSpan, Math.min(S.keepOut, 1.0 + sp.ref * K));
      if (d < min) { const k = d > 1e-3 ? min / d : 0; if (k) { b.x = eye.x + ex * k; b.y = eye.y + ey * k; b.z = eye.z + ez * k; } else b.y = eye.y + min; }
    }
    const d = Math.hypot(b.x - eye.x, b.y - eye.y, b.z - eye.z);
    if (d < S.passMin) S.passMin = d;
    if (d < S.nearest) S.nearest = d;                                              // (the nearest any bird of this flock has ever come: for checking)
  }

  /** From where a bird was and is: its heading, pitch and bank, with the lag that gives it weight. Returns its speed. */
  function attitude(b, dt, bankMax = sp.bank, nose = 0) {
    const vx = (b.x - b.px) / dt, vy = (b.y - b.py) / dt, vz = (b.z - b.pz) / dt;
    if (b.fresh) { b.vx = vx; b.vy = vy; b.vz = vz; }
    const k = 1 - Math.exp(-dt / 0.07);
    b.vx += (vx - b.vx) * k; b.vy += (vy - b.vy) * k; b.vz += (vz - b.vz) * k;
    const sh = Math.hypot(b.vx, b.vz), v = Math.hypot(sh, b.vy);
    let rate = 0;
    if (b.launch > 0) {                                                           // just off a perch: it turns from the way it sat into the way it goes, over a fifth of a second
      b.launch -= dt;
      if (sh > 0.3) { const d = wrapPi(Math.atan2(b.vx, b.vz) - b.yaw) * (1 - Math.exp(-dt / 0.07)); b.yaw += d; rate = d / dt; }
    } else if (sh > 0.6) { const yaw = Math.atan2(b.vx, b.vz); rate = b.fresh ? 0 : wrapPi(yaw - b.yaw) / dt; b.yaw = yaw; }
    b.turn += (clamp(rate, -6, 6) - b.turn) * (1 - Math.exp(-dt / 0.16));
    const bank = clamp(-Math.atan(v * b.turn / G), -bankMax * DEG, bankMax * DEG);            // a turn is a bank: tan(bank) = speed x rate of turn / g
    b.roll += (bank - b.roll) * (1 - Math.exp(-dt / 0.12));
    const pitch = v > 0.6 ? Math.asin(clamp(b.vy / v, -0.9, 0.9)) : 0;
    b.pitch += (pitch + nose - b.pitch) * (1 - Math.exp(-dt / 0.09));
    b.fresh = false;
    return v;
  }

  /** Flicker and glide, or whirr and shut: when a bird beats its wings. `want` > 0 asks for flapping (a climb), < 0 for a glide (a steep turn). */
  function rhythm(b, dt, want = 0, R = sp.rhythm) {
    b.phase = (b.phase + dt * b.rate * TAU * (1 - 0.92 * b.glide)) % TAU;
    if (R.kind === 'steady') { b.glide += (0 - b.glide) * Math.min(1, dt * 10); b.fold += (0 - b.fold) * Math.min(1, dt * 14); return; }
    if (!b.resting) {
      b.flapLeft -= R.kind === 'glide' ? dt * b.rate : dt;
      const level = Math.abs(((b.phase / TAU) - sp.stroke.frac * 0.5 + 1.5) % 1 - 0.5) < 0.12;      // near the middle of a downstroke: the wings are level
      if ((b.flapLeft <= 0 && want <= 0.5 && (R.kind !== 'glide' || level)) || (want < -0.5 && R.kind === 'glide' && level)) { b.resting = true; b.restLeft = lerp(R.rest[0], R.rest[1], rnd()); }
    } else {
      b.restLeft -= dt;
      if (b.restLeft <= 0 || want > 0.5) { b.resting = false; b.flapLeft = lerp(R.flap[0], R.flap[1], rnd()); if (R.kind === 'glide') b.phase = sp.stroke.frac * 0.5 * TAU; }
    }
    if (R.kind === 'glide') { b.glide += ((b.resting ? 1 : 0) - b.glide) * Math.min(1, dt * 12); b.fold += (0 - b.fold) * Math.min(1, dt * 14); }
    else { b.fold += ((b.resting ? 1 : 0) - b.fold) * Math.min(1, dt * 26); b.glide += (0 - b.glide) * Math.min(1, dt * 10); }
  }
  const settlePose = (b, dt) => { b.vee += (0 - b.vee) * Math.min(1, dt * 8); b.legs += (0 - b.legs) * Math.min(1, dt * 8); b.depth += (1 - b.depth) * Math.min(1, dt * 8); b.rate += (b.rate0 - b.rate) * Math.min(1, dt * 6); };
  const stepTo = (b, x, y, z) => { b.px = b.x; b.py = b.y; b.pz = b.z; b.x = x; b.y = y; b.z = z; };
  /** Do something to a bird a little later (birds never all start at once). */
  const defer = (b, delay, fn) => { if (delay <= 0) fn(b); else b.later = { t: delay, fn }; };

  // ------------------------------------------------------------------------------------------- routes: parties on closed curves
  function routePlace(b, t, out) {
    const r = routes[b.route], s = S.head[b.route] - b.gap + 1.1 * Math.sin(t * b.w1 * 0.6 + b.f3) * Math.min(1, o.jitter);
    r.at(s, _o);
    // a little to the side and above or below its place, wandering: no two keep station
    const j = o.jitter, sx = -_o.tz, sz = _o.tx, sl = Math.hypot(sx, sz) || 1;
    const side = j * (0.62 * Math.sin(t * b.w1 + b.f1) + 0.38 * Math.sin(t * b.w2 + b.f2)) + b.lane * j * 0.5, up = j * 0.55 * (0.6 * Math.sin(t * b.w2 * 0.8 + b.f4) + 0.4 * Math.sin(t * b.w1 * 1.3 + b.f3));
    out.x = _o.x + sx / sl * side; out.y = _o.y + up; out.z = _o.z + sz / sl * side; out.base = _o.y; out.tx = _o.tx; out.ty = _o.ty; out.tz = _o.tz;
    return out;
  }
  /** Where a bird is coming from, while it eases over to a new pattern. */
  function blendFrom(b, t, x, y, z, dt) {
    if (b.blend >= 1) { _w.x = x; _w.y = y; _w.z = z; return _w; }
    b.blend = Math.min(1, b.blend + dt / b.dur);
    const e = smooth(0, 1, b.blend);
    let fx = b.fromX, fy = b.fromY, fz = b.fromZ;
    if (b.fromMode === 1 && routes.length) { routePlace(b, t, _q); fx = _q.x; fy = _q.y; fz = _q.z; }
    _w.x = lerp(fx, x, e); _w.y = lerp(fy, y, e); _w.z = lerp(fz, z, e);
    return _w;
  }

  function updateRoute(b, dt, t) {
    routePlace(b, t, _q);
    let x = _q.x, y = _q.y, z = _q.z, vee = 0;
    const tx = _q.tx, ty = _q.ty, tz = _q.tz;
    // ---- a dip: down to the water, the bill in for a tenth of a second, and up
    if (o.dip) {
      const D = o.dip, low = _q.base < (D.below ?? 1.4);
      if (b.dip <= 0) {
        b.dipT -= dt;
        if (b.dipT <= 0 && low && t - S.lastDip > 1.0 && b.blend >= 1 && Math.hypot(x - eye.x, z - eye.z) > S.keepOut * 2.3 + 1 && (!D.where || D.where(x, z))) { b.dip = 1e-4; b.dipT = (D.every ?? 14) * (0.7 + rndD() * 0.6); S.lastDip = t; b.dipped = false; }
      } else {
        b.dip += dt / (D.seconds ?? 1.3);
        const k = b.dip, down = k < 0.5 ? smooth(0, 0.5, k) : 1 - smooth(0.5, 1, k);          // down over 0.65 s, up over 0.65 s
        const bill = sp.body.nose[0] * K, touchY = waterY(x, z) + 0.012 + bill * 0.34;        // the bill's tip just in the water, the body tipped down a little
        y = lerp(y, touchY, down); vee = 0.38 * down;                                        // wings held up out of the wet
        // the bill is in the water for about a tenth of a second: one ring where it goes in (and the callback, once), then a short
        // scratch of small rings along its way while it is in (at 10 m/s, a metre and a bit)
        const sec = D.seconds ?? 1.3, inFor = 0.06 / sec;
        if (k >= 0.5 - inFor && k <= 0.5 + inFor) {
          const fx = Math.sin(b.yaw), fz = Math.cos(b.yaw), bx = x + fx * bill, bz = z + fz * bill;
          if (!b.dipped) { b.dipped = true; touch(bx, bz, 'bill', b.i, 0.35, 0.5); }
          else if (o.touch !== false && water && water.ripple) water.ripple(bx, bz, 0.07, 0.12);
        }
        if (k >= 1) b.dip = 0;
      }
    }
    const p = blendFrom(b, t, x, y, z, dt);
    stepTo(b, p.x, p.y, p.z);
    if (b.fresh) { b.px = b.x - tx * 0.2; b.py = b.y - ty * 0.2; b.pz = b.z - tz * 0.2; }
    avoidAll(b);
    attitude(b, dt, sp.bank, b.dip > 0 ? -0.2 * Math.sin(Math.min(1, b.dip) * Math.PI) : 0);
    rhythm(b, dt, b.dip > 0 ? -1 : b.pitch > 0.16 ? 1 : Math.abs(b.roll) > 0.75 ? -1 : 0);
    settlePose(b, dt); b.vee = vee;
    b.tail += (clamp(Math.abs(b.roll) / 0.9, 0, 1) * 0.9 - b.tail) * Math.min(1, dt * 7);
  }

  // ------------------------------------------------------------------------------------------- a wheel: gathering, lifting, waiting in the air
  function wheelPlace(b, t, out) {
    const W = S.wheel, tt = Math.max(0, t - W.t0), k = smooth(0, W.grow, tt);
    const r = lerp(W.r0, W.r1, k) * (0.7 + 0.55 * b.wr) + 1.0 * Math.sin(t * b.w1 + b.f1);
    const a = b.wheelA + W.dir * TAU * tt / W.turn * (0.95 + 0.1 * b.wr2);
    out.x = W.cx + Math.cos(a) * r; out.z = W.cz + Math.sin(a) * r;
    out.y = W.cy + Math.min(W.climb * tt, W.top - W.cy) + b.lane * W.spread + 0.7 * Math.sin(t * b.w2 + b.f2);
    return out;
  }
  /** Into the wheel from wherever it is: off its perch, off its route, out of the air. */
  function enterWheel(b, seconds = 4) {
    const W = S.wheel; if (!W) return;
    const sat = b.state === ST.PERCHED || b.state === ST.CROUCH;
    if (sat) {
      if (b.perch >= 0 && perchList[b.perch] && perchList[b.perch].taken === b.i) perchList[b.perch].taken = -1;
      b.yaw = b.pYaw; b.launch = 0.35; b.pitch = Math.min(b.pPitch, 0.5); b.roll = 0; b.fold = 1; b.lift = 0; b.fresh = true; b.fromMode = 0; b.phase = 0; b.offT = 0;
      if (o.onLeave) o.onLeave(b.i, b.x, b.y, b.z);
    } else { b.fromMode = b.state === ST.ROUTE ? 1 : 0; b.lift = 1; b.offT = -1; }
    b.fromX = b.x; b.fromY = b.y; b.fromZ = b.z; b.blend = 0; b.dur = seconds * (0.75 + 0.5 * b.wr);
    const a0 = Math.atan2(b.z - W.cz, b.x - W.cx);
    b.wheelA = Math.hypot(b.x - W.cx, b.z - W.cz) < W.r0 * 0.4 ? rnd() * TAU : a0 + W.dir * (0.5 + 0.7 * rnd());
    b.state = ST.WHEEL; b.scale = 1;
  }
  function updateWheel(b, dt, t) {
    wheelPlace(b, t, _q);
    const p = blendFrom(b, t, _q.x, _q.y, _q.z, dt);
    if (b.offT >= 0) {
      // Off the perch at once, the way it faces: a push forward and (a swallow, whose legs are no use for jumping) a drop of a
      // foot, head first, before the climb. Without it a bird hung at its perch for a third of a second, whirring, and then rose.
      b.offT += dt; const k = smooth(0, 0.22, b.offT) * (1 - smooth(0.4, 1.5, b.offT)), drop = (perchInfo && perchInfo.drop != null ? perchInfo.drop : 0.06) * K, out = Math.max(0.3 * K, drop * 1.6);
      p.x += Math.sin(b.pYaw) * out * k; p.z += Math.cos(b.pYaw) * out * k; p.y -= drop * k;
      if (b.offT > 1.5) b.offT = -1;
    }
    stepTo(b, p.x, p.y, p.z);
    if (b.fresh) { b.px = b.x - Math.sin(b.yaw) * 0.01; b.py = b.y + 0.004; b.pz = b.z - Math.cos(b.yaw) * 0.01; }
    avoidAll(b);
    const v = attitude(b, dt);
    b.lift = Math.min(1, b.lift + dt * 2.5);
    rhythm(b, dt, b.lift < 1 || b.pitch > 0.14 ? 1 : Math.abs(b.roll) > 0.8 ? -1 : 0);
    if (b.lift < 0.3) b.fold = Math.max(0, 1 - b.lift / 0.18);                    // the wings open on the first downstroke
    settlePose(b, dt);
    b.tail += (clamp(Math.abs(b.roll) / 0.9 + (v < 3 ? 0.6 : 0), 0, 1) - b.tail) * Math.min(1, dt * 7);
    if (t > b.goneAt) { b.showTo = 0; if (b.show < 0.02) b.state = ST.GONE; }       // climbed out of sight
    if (b.back > 0 && t > b.back) {                                               // time to come down: but not while the boat is still by its perch
      const hp = b.home >= 0 ? perchList[b.home] : null, F = o.flush;
      if (hp && F && boat && Math.hypot(boat.x - hp.x, boat.z - hp.z) < (F.within ?? 0) + (F.past ?? 8)) b.back = t + 1; else homeward(b);
    }
  }

  // ------------------------------------------------------------------------------------------- perches
  function freePerch(test) { let best = -1, bs = -1; for (let k = 0; k < perchList.length; k++) { const p = perchList[k]; if (p.taken >= 0) continue; const s = test(p, k); if (s > bs) { bs = s; best = k; } } return best; }
  function sit(b, k, yaw) {
    const p = perchList[k];
    if (b.perch >= 0 && perchList[b.perch].taken === b.i) perchList[b.perch].taken = -1;
    p.taken = b.i; b.perch = k; b.state = ST.PERCHED; b.x = p.x; b.y = p.y; b.z = p.z; b.pPitch = posture; b.act = 0; b.timer = 0.4 + rnd() * 2.5; b.sidled = 0; b.hop = 0; b.scale = 1; b.fresh = true;
    // Which way it faces. It lands facing the way it came. A perch on a bough or a line is sat on across it (whichever way round is
    // nearer); a perch with something to look at (an apple) or a facing of its own is turned to. It never pivots like a weathercock:
    // if it has to turn it does so in quick hops (see updatePerched).
    let face = yaw ?? p.face;
    if (p.look) face = Math.atan2(p.look[0] - p.x, p.look[2] - p.z);
    else if (p.fixed || yaw == null) face = p.face;
    else if (p.along) face = Math.abs(wrapPi(yaw - p.face)) < Math.PI / 2 ? p.face : p.face + Math.PI;
    b.pYaw = yaw ?? face; b.faceTo = face; b.turnWait = 0.15 + rnd() * 0.5;
  }
  /** Fly from where it is to a point. opt: { perch: index to sit on, then: state on arrival, hide: vanish on arrival, speed, sag, from: 'perch' } */
  function goTo(b, x, y, z, opt = {}) {
    const fromPerch = b.state === ST.PERCHED || b.state === ST.CROUCH;
    if (b.perch >= 0 && perchList[b.perch] && perchList[b.perch].taken === b.i) perchList[b.perch].taken = -1;
    if (opt.perch != null && opt.perch >= 0) perchList[opt.perch].taken = b.i;
    b.dest = opt.perch ?? -1; b.then = opt.then ?? ST.PERCHED; b.hide = !!opt.hide;
    b.ax = b.x; b.ay = b.y; b.az = b.z; b.dx = x; b.dy = y; b.dz = z;
    const ex = x - b.x, ey = y - b.y, ez = z - b.z, D = Math.hypot(ex, ey, ez) || 0.01, hl = Math.hypot(ex, ez) || 0.01, hx = ex / hl, hz = ez / hl;
    const sag = opt.sag ?? Math.min(1.1, 0.09 * D + 0.08);
    if (fromPerch) {                                                              // off a perch: a small drop, head first, the way it faces (a little toward where it is going); it turns in the air
      let lx = Math.sin(b.pYaw) * 0.7 + hx * 0.3, lz = Math.cos(b.pYaw) * 0.7 + hz * 0.3; const ll = Math.hypot(lx, lz) || 1, reach = Math.min(D * 0.35, 1.4); lx /= ll; lz /= ll;
      b.bx = b.x + lx * reach; b.by = b.y + ey * 0.2 - sag * 0.7; b.bz = b.z + lz * reach;
    }
    else { const v = Math.hypot(b.vx, b.vy, b.vz) || 1, k = D * 0.35 / v; b.bx = b.x + b.vx * k; b.by = b.y + b.vy * k; b.bz = b.z + b.vz * k; }   // in the air: on as it was going
    if (b.dest >= 0) { b.cx = x - hx * D * 0.3; b.cy = y - ey * 0.15 - sag; b.cz = z - hz * D * 0.3; }                     // to a perch: up to it from below, to lose speed
    else { b.cx = x - ex * 0.3; b.cy = y - ey * 0.3; b.cz = z - ez * 0.3; }
    const v = opt.speed ?? clamp(4.5 + D * 0.5, 4.5, sp.speed[1]);
    b.t = 0; b.dur = D / v + (fromPerch ? 0.22 : 0) + (b.dest >= 0 ? 0.2 : 0); b.state = ST.TRANSIT; b.fresh = fromPerch; b.scale = 1; b.offPerch = fromPerch;
    if (fromPerch) { b.yaw = b.pYaw; b.launch = 0.3; b.pitch = Math.min(b.pPitch, 0.9); b.roll = 0; b.fold = 1; b.vx = Math.sin(b.pYaw); b.vy = 0; b.vz = Math.cos(b.pYaw); b.phase = 0; if (o.onLeave) o.onLeave(b.i, b.x, b.y, b.z); }
  }
  function updateTransit(b, dt, t) {
    b.t += dt;
    const u = clamp(b.t / b.dur, 0, 1), e = lerp(u, smooth(0, 1, u), b.dest >= 0 ? 0.55 : 0.25), i = 1 - e;
    const x = i * i * i * b.ax + 3 * i * i * e * b.bx + 3 * i * e * e * b.cx + e * e * e * b.dx;
    const y = i * i * i * b.ay + 3 * i * i * e * b.by + 3 * i * e * e * b.cy + e * e * e * b.dy;
    const z = i * i * i * b.az + 3 * i * i * e * b.bz + 3 * i * e * e * b.cz + e * e * e * b.dz;
    stepTo(b, x, y, z);
    if (b.fresh) { b.px = x - (b.bx - b.ax) * 0.02; b.py = y - (b.by - b.ay) * 0.02; b.pz = z - (b.bz - b.az) * 0.02; }
    if (b.dest < 0) avoidAll(b);
    else {
      // On its way to a perch it goes round the rider's head only if its line would bring it within arm's length of it (the two
      // perches are where the realm put them, and a flit between them is no nearer than they are). The whole keep-out bulged a
      // flit of a metre and a half, three metres off, into a loop a metre and a half high, and the bulge turned with every wingbeat.
      const w = smooth(0.05, 0.3, u) * (1 - smooth(0.7, 0.95, u)), cx = b.dx - b.ax, cy = b.dy - b.ay, cz = b.dz - b.az, cl = Math.hypot(cx, cy, cz) || 1;
      if (w > 0) { const x0 = b.x, y0 = b.y, z0 = b.z; _al[0] = cx / cl; _al[1] = cy / cl; _al[2] = cz / cl; avoidAll(b, Math.min(S.keepOut, 1.3 + halfSpan), _al); b.x = lerp(x0, b.x, w); b.y = lerp(y0, b.y, w); b.z = lerp(z0, b.z, w); }
    }
    const flare = b.dest >= 0 ? smooth(0.72, 0.97, u) : 0;                        // the last instant before a perch: body up, tail fanned, wings braking
    attitude(b, dt, sp.bank, flare * (posture - 0.15));
    rhythm(b, dt, 1);
    settlePose(b, dt);
    if (b.offPerch && b.t < 0.09) b.fold = Math.max(0, 1 - b.t / 0.07); else if (flare > 0.9) b.fold = Math.max(b.fold, (flare - 0.9) * 6);       // open on the first downstroke; shut as it lands
    b.depth = 1 + 0.25 * flare; b.tail += (Math.max(flare, clamp(Math.abs(b.roll) / 0.9, 0, 1)) - b.tail) * Math.min(1, dt * 10);
    if (b.hide) b.show = Math.min(b.show, smooth(0, 1.5, Math.hypot(b.dx - x, b.dy - y, b.dz - z)));       // into a crevice, into the leaves: gone over its last metre and a half
    if (u >= 1) {
      if (b.dest >= 0) { const k = b.dest; b.dest = -1; sit(b, k, b.yaw); b.alert = 1.5; if (o.onLand) o.onLand(b.i, b.x, b.y, b.z); }
      else if (b.hide) { b.state = ST.GONE; b.show = 0; b.showTo = 0; }
      else arrive(b, t);
    }
  }
  /** What a bird does when a flight that was not to a perch ends. */
  function arrive(b, t) {
    if (b.then === ST.PATTER) startPatter(b);
    else if (b.then === ST.WHEEL && S.wheel) { b.state = ST.WHEEL; b.fromMode = 0; b.fromX = b.x; b.fromY = b.y; b.fromZ = b.z; b.blend = 0; b.dur = 2.5; b.wheelA = Math.atan2(b.z - S.wheel.cz, b.x - S.wheel.cx); b.lift = 1; }
    else if (b.then === ST.ROUTE && routes.length) { b.state = ST.ROUTE; b.fromMode = 0; b.fromX = b.x; b.fromY = b.y; b.fromZ = b.z; b.blend = 0; b.dur = 3; }
    else if (b.then === ST.WANDER) { b.state = ST.WANDER; b.hdg = b.yaw; b.hdgTo = b.yaw; }
    else { b.state = ST.GONE; b.show = 0; }
  }
  /** Back to a perch from the air: its own if it is free, or the nearest free one. */
  function homeward(b) {
    let k = b.home >= 0 && perchList[b.home].taken < 0 ? b.home : -1;
    if (k < 0) k = freePerch((p) => -Math.hypot(p.x - b.x, p.y - b.y, p.z - b.z) + (o.flush && boat ? Math.min(0, Math.hypot(p.x - boat.x, p.z - boat.z) - (o.flush.within ?? 0)) * 10 : 0));
    b.back = 0;
    if (k >= 0) goTo(b, perchList[k].x, perchList[k].y, perchList[k].z, { perch: k });
  }

  function updatePerched(b, dt, t) {
    const p = perchList[b.perch]; if (!p) return;
    let lean = posture, nod = 0, cock = 0, fluff = o.fluff ?? (perchInfo && perchInfo.fluff) ?? 0, crest = b.alert > 0 ? 0.95 : 0.5, hop = 0;
    b.alert = Math.max(0, b.alert - dt);
    b.headT -= dt;                                                               // the head looks about in quick small turns, never smoothly
    if (b.headT <= 0) { b.headTo = clamp((rnd() - 0.5) * 2.2, -1.2, 1.2) * (b.act === ACT.NONE ? 1 : 0.3); b.headT = 0.35 + rnd() * 2.4; }
    if (b.act !== ACT.NONE) {
      b.actT += dt; const k = Math.min(1, b.actT / b.actD), bell = Math.sin(k * Math.PI);
      if (b.act === ACT.PECK) { const w = Math.pow(bell, 0.6); lean = lerp(posture, 0.1, w); nod = 0.55 * w; cock = 0.55 * w; crest = 0.15; }
      else if (b.act === ACT.GULP) nod = -0.5 * bell;
      else if (b.act === ACT.FLUFF) { fluff = Math.max(fluff, smooth(0, 0.15, k) * (1 - smooth(0.85, 1, k))); crest = 0.3; }
      else if (b.act === ACT.SIDLE) { const w = smooth(0, 1, k); b.x = lerp(b.ax, b.bx, w); b.y = lerp(b.ay, b.by, w); b.z = lerp(b.az, b.bz, w); hop = 0.02 * K * bell; }
      else if (b.act === ACT.FLICK) cock = 0.5 * Math.abs(Math.sin(k * TAU));
      else if (b.act === ACT.PREEN) { const w = smooth(0, 0.2, k) * (1 - smooth(0.8, 1, k)); b.headTo = 1.15 * b.side; nod = 0.35 * w; fluff = Math.max(fluff, 0.4 * w); }
      if (k >= 1) { b.act = ACT.NONE; b.timer = 0.7 + rnd() * 3.2; }
    } else {
      b.timer -= dt;
      if (b.timer <= 0) {
        let pick = rnd() * idleSum, act = ACT.NONE;
        for (const q of idle) { pick -= q[1]; if (pick <= 0) { act = q[0]; break; } }
        b.act = act; b.actT = 0;
        if (act === ACT.PECK) b.actD = 0.5 + rnd() * 0.7; else if (act === ACT.GULP) b.actD = 0.35; else if (act === ACT.FLUFF) b.actD = 3 + rnd() * 4; else if (act === ACT.FLICK) b.actD = 0.36; else if (act === ACT.PREEN) b.actD = 1.2 + rnd() * 1.5;
        else if (act === ACT.SIDLE) {                                             // a hop of a few centimetres along the bough, never a slide
          const dir = (rnd() < 0.5 ? -1 : 1) * (Math.abs(b.sidled) >= 2 ? -Math.sign(b.sidled) * (rnd() < 0.5 ? -1 : 1) : 1), al = p.along;
          if (!al || Math.abs(b.sidled + dir) > 2) { b.act = ACT.NONE; b.timer = 0.5 + rnd(); } else { b.sidled += dir; b.actD = 0.15; b.ax = b.x; b.ay = b.y; b.az = b.z; b.bx = b.x + al[0] * 0.06 * K * dir; b.by = b.y + al[1] * 0.06 * K * dir; b.bz = b.z + al[2] * 0.06 * K * dir; }
        } else if (act === ACT.NONE) b.timer = 0.5 + rnd() * 2;
      }
    }
    const q = Math.min(1, dt * 16);
    b.pPitch += (lean - b.pPitch) * Math.min(1, dt * 12); b.headNod += (nod - b.headNod) * q; b.cock += (cock - b.cock) * Math.min(1, dt * 22); b.fluff += (fluff - b.fluff) * Math.min(1, dt * 3);
    b.crest += (crest - b.crest) * Math.min(1, dt * 5); b.headYaw += (b.headTo - b.headYaw) * Math.min(1, dt * 20); b.hop = hop;
    // turning on the perch: a hop of a seventh of a second and up to seventy degrees, with a centimetre and a half of lift; then a pause
    if (b.turning > 0) {
      b.turning = Math.max(0, b.turning - dt / 0.14); const w = smooth(0, 1, 1 - b.turning);
      b.pYaw = b.turnFrom + b.turnBy * w; b.hop = Math.max(b.hop, 0.015 * K * Math.sin(w * Math.PI));
    } else {
      const d = wrapPi((b.faceTo ?? p.face) - b.pYaw);
      if (Math.abs(d) > 0.06) { b.turnWait -= dt; if (b.turnWait <= 0 && b.act === ACT.NONE) { b.turning = 1; b.turnFrom = b.pYaw; b.turnBy = clamp(d, -1.25, 1.25); b.turnWait = 0.25 + rnd() * 0.6; } }
    }
    // ---- something large comes near: it leaves, without hurry and without looking
    if ((o.flush || p.within != null) && boat) {                                 // (a place may have its own distance and its own group to flee to)
      const F = o.flush || NO_FLUSH, d = Math.hypot(boat.x - b.x, boat.z - b.z), within = p.within ?? F.within;
      if (d < within) { b.react += dt; if (b.react > 0.15 + b.wr * 1.1 * clamp(d / within, 0.3, 1)) { b.react = 0; startle(b, t, { ...F, to: p.to ?? F.to }); } } else b.react = 0;      // each in its own moment, the nearest first
    }
    if (b.state === ST.PERCHED && Math.hypot(eye.x - b.x, eye.y - b.y, eye.z - b.z) < 1.5 + halfSpan) startle(b, t, { ...(o.flush || {}), to: p.to ?? (o.flush || {}).to });      // and never at the end of the rider's nose
  }
  function startle(b, t, F = {}) {
    let k = -1;
    if (F.to) k = freePerch((p) => (p.group === F.to ? 100 - Math.hypot(p.x - b.x, p.y - b.y, p.z - b.z) * 0.1 + rnd() : -1));
    b.home = F.to ? -1 : b.perch;
    b.state = ST.CROUCH; b.t = 0; b.dest = k; b.away = k < 0;
    if (k >= 0) perchList[k].taken = b.i;
    if (k < 0 && (!S.wheel || !birds.some((q) => q.state === ST.WHEEL))) {       // nowhere to go: up into a loose wheel over where it sat, until the boat has passed
      const top = b.y + 5 + rnd() * 3;
      S.wheel = { cx: b.x, cy: b.y + 2, cz: b.z, r0: 5, r1: 9, turn: 7, climb: 1.6, top, grow: 4, dir: b.side, spread: 1.2, t0: t };
    }
    if (b.away) b.back = t + (F.back ?? 10);
  }
  function updateCrouch(b, dt, t) {
    b.t += dt; b.pPitch += (posture - 0.28 - b.pPitch) * Math.min(1, dt * 30); b.crest += (0.2 - b.crest) * Math.min(1, dt * 20);      // a crouch of a tenth of a second
    const tx = b.dest >= 0 ? perchList[b.dest].x : S.wheel ? S.wheel.cx : b.x, tz = b.dest >= 0 ? perchList[b.dest].z : S.wheel ? S.wheel.cz : b.z;
    if (Math.hypot(tx - b.x, tz - b.z) > 0.3) { const d = clamp(wrapPi(Math.atan2(tx - b.x, tz - b.z) - b.pYaw), -6 * dt, 6 * dt); b.pYaw += d; }      // and the beginning of a turn toward where it will go (at most forty degrees: the rest is made in the air)
    if (b.t < 0.11) return;
    if (b.dest >= 0) { const k = b.dest, p = perchList[k]; goTo(b, p.x, p.y, p.z, { perch: k }); }
    else if (S.wheel) { enterWheel(b, 3.4); b.goneAt = 1e9; }
    else b.state = ST.PERCHED;
  }

  // ------------------------------------------------------------------------------------------- storm petrels: patter, shear, flutter
  function inZone(b, tries = 8) {
    const Z = zones[b.zone] || { x: b.x, z: b.z, r: 25 };
    for (let k = 0; k < tries; k++) {
      const a = rnd() * TAU, r = Math.sqrt(rnd()) * Z.r, x = Z.x + Math.cos(a) * r, z = Z.z + Math.sin(a) * r;
      const d = Math.hypot(x - b.x, z - b.z), eb = boat ? Math.hypot(x - boat.x, z - boat.z) : 99;
      if ((d > 12 && d < 32 || k > 5) && eb > (o.flush ? (o.flush.within ?? 9) + 3 : 8)) { _q.x = x; _q.z = z; return _q; }
    }
    _q.x = Z.x; _q.z = Z.z; return _q;
  }
  function startPatter(b) { b.state = ST.PATTER; b.t = 0; b.dur = 4 + rnd() * 5; b.spd = 0.5 + rnd(); b.step = 0; b.stepN = 0; b.fresh = true; b.flushed = false; }
  function updatePatter(b, dt, t) {
    b.t += dt;
    const sway = 0.3 * Math.sin(t * b.w2 * 1.3 + b.f1), x = b.x + (-wind.x * b.spd - wind.z * sway) * dt, z = b.z + (-wind.z * b.spd + wind.x * sway) * dt;
    const y = waterY(x, z) + legLen * 0.9 + 0.008 * K * Math.sin(t * 9 + b.f2);          // it hangs on its wings with both feet on the water
    stepTo(b, x, y, z);
    const want = Math.atan2(-wind.x, -wind.z) + 0.3 * Math.sin(t * b.w1 + b.f3), q = Math.min(1, dt * 6);
    b.yaw += wrapPi(want - b.yaw) * q; b.pitch += (0.35 - b.pitch) * q; b.roll += (0.12 * Math.sin(t * b.w2 + b.f4) - b.roll) * q;
    b.vx = -wind.x * b.spd; b.vy = 0; b.vz = -wind.z * b.spd;
    b.rate += (12 - b.rate) * q; b.phase = (b.phase + dt * b.rate * TAU) % TAU;         // wings up in a V of thirty degrees, quivering
    b.depth += (0.24 - b.depth) * q; b.vee += (0.5 - b.vee) * q; b.legs += (1 - b.legs) * Math.min(1, dt * 9); b.glide += (0 - b.glide) * q; b.fold += (0 - b.fold) * q; b.tail += (0.6 - b.tail) * q;
    b.step += dt * 6;                                                            // six steps a second, the feet in turn, a hand's breadth apart
    if (Math.floor(b.step) > b.stepN) {
      b.stepN = Math.floor(b.step); const s = b.stepN % 2 ? 1 : -1, rx = Math.cos(b.yaw), rz = -Math.sin(b.yaw);
      touch(b.x + rx * 0.1 * K * s, b.z + rz * 0.1 * K * s, 'foot', b.i, b.stepN % 3 === 0 ? 0.08 : 0, 0.2);
    }
    const near = boat && o.flush !== false && Math.hypot(boat.x - b.x, boat.z - b.z) < ((o.flush && o.flush.within) ?? 9);
    if (b.t > b.dur || near) startShear(b, near);
  }
  function startShear(b, flushed, to) {
    let x, z;
    if (to) { x = to[0]; z = to[2]; }
    else if (flushed && boat) {                                                  // away from the boat, to settle 20 to 30 m off
      const a = Math.atan2(b.x - boat.x, b.z - boat.z) + (rnd() - 0.5) * 1.6, d = 20 + rnd() * 10; x = b.x + Math.sin(a) * d; z = b.z + Math.cos(a) * d;
    } else { const p = inZone(b); x = p.x; z = p.z; }
    b.ax = b.x; b.ay = b.y; b.az = b.z; b.dx = x; b.dz = z; b.dy = to ? to[1] : 0;
    const ex = x - b.x, ez = z - b.z, D = Math.hypot(ex, ez) || 1, bow = (0.18 + 0.2 * rnd()) * D * b.side;
    b.cx = b.x + ex * 0.5 - ez / D * bow; b.cz = b.z + ez * 0.5 + ex / D * bow;   // a bowed path, banking one way
    b.t = 0; b.dur = D / 8.2 + 1.0; b.state = ST.SHEAR; b.flushed = !!flushed; b.hide = !!(to && to.hide); b.toPoint = !!to;
    b.resting = true; b.restLeft = 0.4 + rnd() * 0.6;
    if (o.onLeave) o.onLeave(b.i, b.x, b.y, b.z);
  }
  const SHEAR_RHYTHM = { kind: 'glide', flap: [1, 2], rest: [0.5, 1.1] };
  function updateShear(b, dt, t) {
    b.t += dt;
    const u = clamp(b.t / b.dur, 0, 1), e = lerp(smooth(0, 1, u), 1 - (1 - u) * (1 - u), 0.55), i = 1 - e, flutter = smooth(0.7, 0.9, u);
    let x = i * i * b.ax + 2 * i * e * b.cx + e * e * b.dx, z = i * i * b.az + 2 * i * e * b.cz + e * e * b.dz;
    x += 0.28 * flutter * (1 - smooth(0.93, 1, u)) * Math.sin(t * 7.3 + b.f1); z += 0.28 * flutter * (1 - smooth(0.93, 1, u)) * Math.cos(t * 6.1 + b.f2);      // the flutter: weak, with sudden turns
    const base = waterY(x, z) + legLen * 0.9, hop = (0.3 + 0.6 * b.wr) * Math.pow(Math.sin(Math.min(1, u * 1.12) * Math.PI), 0.8);
    const y = lerp(b.ay, b.toPoint ? lerp(base + hop, b.dy, smooth(0.5, 1, u)) : base + hop, smooth(0, 0.25, u));
    stepTo(b, x, y, z);
    avoidAll(b);
    attitude(b, dt, sp.bank, 0.3 * flutter);
    if (flutter > 0.3) { b.phase = (b.phase + dt * b.rate * TAU) % TAU; b.glide += (0 - b.glide) * Math.min(1, dt * 10); }
    else rhythm(b, dt, u < 0.12 ? 1 : 0, SHEAR_RHYTHM);
    const q = Math.min(1, dt * 7);
    b.rate += (b.rate0 - b.rate) * q; b.depth += (1 - b.depth) * q; b.vee += (0.5 * smooth(0.85, 1, u) - b.vee) * q; b.legs += ((u > 0.86 && !b.toPoint ? 1 : 0) - b.legs) * Math.min(1, dt * 9);
    b.tail += (Math.max(flutter * 0.7, clamp(Math.abs(b.roll) / 0.9, 0, 1)) - b.tail) * q;
    // a wingtip cuts the water in a low banked turn
    b.tipT -= dt;
    if (b.tipT <= 0 && Math.abs(b.roll) > 0.5 && b.y - Math.sin(Math.abs(b.roll)) * halfSpan * 0.92 < base - legLen * 0.9 + 0.012) {
      b.tipT = 0.6; const s = b.roll > 0 ? -1 : 1, rx = Math.cos(b.yaw) * s, rz = -Math.sin(b.yaw) * s; touch(b.x + rx * halfSpan * 0.8, b.z + rz * halfSpan * 0.8, 'wingtip', b.i, 0.12, 0.25);
    }
    if (b.hide) b.show = Math.min(b.show, smooth(0, 1.5, Math.hypot(b.dx - x, b.dz - z)));
    if (u >= 1) { if (b.hide) { b.state = ST.GONE; b.show = 0; b.showTo = 0; } else startPatter(b); }
  }

  // ------------------------------------------------------------------------------------------- hanging into the wind (a tower), and going away
  function updateTower(b, dt, t) {
    const k = Math.min(1, b.lift += dt * 0.8), sway = Math.sin(t * b.w2 + b.f1);
    const x = b.x + (wind.x * 0.6 - wind.z * sway * 0.8) * dt * k, z = b.z + (wind.z * 0.6 + wind.x * sway * 0.8) * dt * k, y = b.y + clamp((b.yTo - b.y) * 0.9, -1, 2.6) * dt * k;
    stepTo(b, x, y, z); avoidAll(b);
    const want = Math.atan2(-wind.x, -wind.z) + 0.35 * sway, q = Math.min(1, dt * 4);
    b.yaw += wrapPi(want - b.yaw) * q; b.pitch += (0.3 - b.pitch) * q; b.roll += (0.25 * Math.sin(t * b.w1 * 2 + b.f2) - b.roll) * q;
    b.vx = -wind.x * 6; b.vy = 1; b.vz = -wind.z * 6;
    b.phase = (b.phase + dt * b.rate * TAU) % TAU; b.glide += (0 - b.glide) * q; b.fold += (0 - b.fold) * q; settlePose(b, dt); b.tail += (0.5 - b.tail) * q;
  }
  function updateAway(b, dt, t) {
    b.t += dt;
    const sp1 = Math.min(b.speed, 4 + b.t * 6), sway = Math.sin(t * b.w1 + b.f1) * 0.25;
    const x = b.x + (b.dx - b.dz * sway) * sp1 * dt, z = b.z + (b.dz + b.dx * sway) * sp1 * dt, y = b.y + b.dy * sp1 * dt;
    stepTo(b, x, y, z); avoidAll(b); attitude(b, dt); rhythm(b, dt, b.t < 1.5 ? 1 : 0); settlePose(b, dt);
    b.tail += (0 - b.tail) * Math.min(1, dt * 5);
    if (b.t > b.dur) { b.showTo = 0; if (b.show < 0.02) b.state = ST.GONE; }
  }

  // ------------------------------------------------------------------------------------------- bats (and anything that hunts a volume): never straight for a second
  function updateWander(b, dt, t) {
    const Z = zones[b.zone] || zones[0];
    b.jink -= dt;
    if (b.jink <= 0) {                                                            // a jink of up to seventy degrees, every 0.6 to 1.4 s
      b.jink = (0.6 + rnd() * 0.8) * (calm ? 1.6 : 1);
      b.hdgTo = b.hdg + (rnd() - 0.5) * 2 * 1.22 * (calm ? 0.5 : 1); b.yTo = lerp(Z.y[0], Z.y[1], rnd()); b.spd = lerp(sp.speed[0], sp.speed[1], rnd());
    }
    const dx = b.x - Z.x, dz = b.z - Z.z, d = Math.hypot(dx, dz), out = smooth(Z.r * 0.7, Z.r * 1.15, d);
    if (out > 0) b.hdgTo += wrapPi(Math.atan2(-dx, -dz) - b.hdgTo) * Math.min(1, dt * 3 * out);        // turned back toward its beat as it nears the edge
    const rate = (calm ? 2.6 : 5) * dt;
    b.hdg += clamp(wrapPi(b.hdgTo - b.hdg), -rate, rate);
    let yT = b.yTo;
    if (o.dip) {                                                                 // down to the water for a sip: a pin ring
      const D = o.dip;
      if (b.dip <= 0) { b.dipT -= dt; if (b.dipT <= 0 && (!D.where || D.where(b.x, b.z))) { b.dip = 1e-4; b.dipped = false; b.dipT = (D.every ?? 12) * (0.75 + rndD() * 0.5); } }
      else {
        b.dip += dt / 1.6; const lowY = waterY(b.x, b.z) + 0.1 * K;
        yT = b.dip < 0.6 ? lowY : b.yTo;
        if (!b.dipped && b.y < lowY + 0.05) { b.dipped = true; touch(b.x, b.z, 'bill', b.i, 0.12, 0.15); b.dip = Math.max(b.dip, 0.6); }
        if (b.dip >= 1) b.dip = 0;
      }
    }
    const vy = clamp((yT - b.y) * 3, -3.2, 3.2);
    stepTo(b, b.x + Math.sin(b.hdg) * b.spd * dt, Math.max(b.y + vy * dt, waterY(b.x, b.z) + 0.08 * K), b.z + Math.cos(b.hdg) * b.spd * dt);
    avoidAll(b);
    attitude(b, dt); rhythm(b, dt, 1); settlePose(b, dt);
    b.tail += (clamp(Math.abs(b.roll) / 0.9, 0, 1) - b.tail) * Math.min(1, dt * 7);
  }

  // ------------------------------------------------------------------------------------------- setting out
  if (routes.length) {
    const per = Math.ceil(n / routes.length);
    for (const b of birds) { b.route = Math.min(routes.length - 1, Math.floor(b.i / per)); const k = b.i % per; b.gap = k * o.spacing * (0.7 + rnd() * 0.6) + (k ? rnd() * o.spacing * 0.5 : 0); }
    routes.forEach((r, k) => { S.head[k] = (o.start != null ? o.start : rnd()) * r.length; });
  }
  if (zones.length) for (const b of birds) b.zone = b.i % zones.length;
  for (const b of birds) {
    if (habit === 'route') { b.state = ST.ROUTE; b.scale = 1; }
    else if (habit === 'perch') { const k = freePerch(() => rnd()); if (k >= 0) { sit(b, k); b.home = k; } else { b.state = ST.GONE; b.show = 0; b.showTo = 0; } }
    else if (habit === 'patter') { const Z = zones[b.zone] || { x: 0, z: 0, r: 20 }, a = rnd() * TAU, r = Math.sqrt(rnd()) * Z.r; b.x = Z.x + Math.cos(a) * r; b.z = Z.z + Math.sin(a) * r; b.y = 0.05; b.yaw = Math.atan2(-wind.x, -wind.z); b.scale = 1; startPatter(b); b.t = rnd() * 4; }
    else if (habit === 'wander') { const Z = zones[b.zone] || { x: 0, z: 0, r: 20, y: [2, 6] }, a = rnd() * TAU, r = Math.sqrt(rnd()) * Z.r * 0.8; b.x = Z.x + Math.cos(a) * r; b.z = Z.z + Math.sin(a) * r; b.y = lerp(Z.y[0], Z.y[1], rnd()); b.yTo = b.y; b.hdgTo = b.hdg; b.spd = sp.speed[0]; b.scale = 1; b.state = ST.WANDER; }
    if (o.hidden) { b.resume = b.state; b.state = ST.GONE; b.show = 0; b.showTo = 0; if (b.perch >= 0) { perchList[b.perch].taken = -1; } }
  }

  // ------------------------------------------------------------------------------------------- the frame
  function write(b) {
    const i = b.i, sat = b.state === ST.PERCHED || b.state === ST.CROUCH, gone = b.state === ST.GONE, flying = !sat && !gone, show = Math.max(0, b.show);
    const P = aPos.array, R = aRot.array, F = aFlap.array, M = aMisc.array, k = i * 4;
    P[k] = b.x; P[k + 1] = b.y; P[k + 2] = b.z; P[k + 3] = flying ? b.scale * show : 0;
    R[k] = b.yaw; R[k + 1] = b.pitch; R[k + 2] = b.roll; R[k + 3] = b.tint;
    F[k] = b.phase; F[k + 1] = b.depth; F[k + 2] = b.glide; F[k + 3] = b.fold;
    M[k] = b.tail; M[k + 1] = b.legs; M[k + 2] = b.vee; M[k + 3] = b.stand;
    if (pPos) {
      const Q = pPos.array, A = pRot.array, E = pPose.array;
      Q[k] = b.x; Q[k + 1] = b.y + b.hop; Q[k + 2] = b.z; Q[k + 3] = sat ? b.scale * show : 0;
      A[k] = b.pYaw; A[k + 1] = b.pPitch; A[k + 2] = b.crest; A[k + 3] = b.tint;
      // (a perched bird carries its head level, however upright its body: the head is bent down on the neck by most of the body's lean)
      E[k] = b.headYaw; E[k + 1] = b.headNod + 0.85 * b.pPitch; E[k + 2] = b.cock; E[k + 3] = b.fluff;
    }
  }
  const behaviours = { [ST.ROUTE]: updateRoute, [ST.PERCHED]: updatePerched, [ST.CROUCH]: updateCrouch, [ST.TRANSIT]: updateTransit, [ST.WHEEL]: updateWheel, [ST.PATTER]: updatePatter, [ST.SHEAR]: updateShear, [ST.WANDER]: updateWander, [ST.TOWER]: updateTower, [ST.AWAY]: updateAway };
  function update(dtReal) {
    const dt = Math.min(0.05, dtReal) * S.timeScale;
    if (dt <= 0) return;
    S.time += dt; const t = S.time;
    S.passMin = 1e9;
    if (S.retime) { const R = S.retime; R.left -= dt; for (let k = 0; k < routes.length; k++) S.head[k] += R.extra[k] * dt; if (R.left <= 0) S.retime = null; }
    for (let k = 0; k < routes.length; k++) S.head[k] += S.speed * (calm ? 0.8 : 1) * dt;
    // now and then one perched bird flits to another perch
    if (o.flit !== false && perchList.length > 1 && (o.flit || habit === 'perch')) {
      S.flitT -= dt;
      if (S.flitT <= 0) {
        const F = o.flit || {}; S.flitT = (F.every ?? 3) * (0.5 + rnd());
        const b = birds[Math.floor(rnd() * n)], lo = F.range ? F.range[0] : 2, hi = F.range ? F.range[1] : 6;
        if (b.state === ST.PERCHED && b.act === ACT.NONE && !S.wheel) {
          const g = perchList[b.perch].group, k = freePerch((p) => { const d = Math.hypot(p.x - b.x, p.y - b.y, p.z - b.z); return d >= lo && d <= hi && p.group === g && !p.hide ? rnd() : -1; });
          if (k >= 0) { b.state = ST.CROUCH; b.t = 0; b.dest = k; perchList[k].taken = b.i; b.home = k; }
        }
      }
    }
    for (const b of birds) {
      b.show += clamp(b.showTo - b.show, -dt / 2.2, dt / 0.6);
      if (b.later) { b.later.t -= dt; if (b.later.t <= 0) { const fn = b.later.fn; b.later = null; fn(b); } }
      const fn = behaviours[b.state]; if (fn) fn(b, dt, t); write(b);
    }
    // the birds have just passed the rider at their nearest: say so once (for a sound)
    if (o.onPass) {
      if (S.passMin < S.passBest) S.passBest = S.passMin;
      if (!S.passed && S.passBest < 14 && S.passMin > S.passBest + 2.5) { S.passed = true; const b = birds[0]; o.onPass(S.passBest, b.x, b.y, b.z); }
      if (S.passMin > 40) { S.passed = false; S.passBest = 1e9; }
    }
    aPos.needsUpdate = aRot.needsUpdate = aFlap.needsUpdate = aMisc.needsUpdate = true;
    if (pPos) pPos.needsUpdate = pRot.needsUpdate = pPose.needsUpdate = true;
    mat.uniforms.uBirdTime.value = t; if (pMat) pMat.uniforms.uBirdTime.value = t;
  }
  ctx.onUpdate((dt) => update(dt));

  const pick = (who) => (who == null ? birds : typeof who === 'string' ? birds.filter((b) => b.perch >= 0 && perchList[b.perch].group === who) : typeof who === 'function' ? birds.filter(who) : who.map((i) => birds[i]));
  const vec = xyz;
  const handle = {
    object: group, mesh, perched: pMesh, species: sp, count: n, birds, state: S, routes, perches: perchList, material: mat, triangles: fly.triangles, perchedTriangles: perchTris,
    /** Where bird i is now. */
    position(i, out = new THREE.Vector3()) { const b = birds[i]; return out.set(b.x, b.y, b.z); },
    /** The indices of the `count` birds nearest a point (in plan), nearest first. */
    nearest(x, z, count = 1) { return birds.filter((b) => b.state !== ST.GONE).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z)).slice(0, count).map((b) => b.i); },
    /** How far the eye keeps them (metres). */
    set keepOut(r) { S.keepOut = calm ? Math.max(r, o.calmKeepOut ?? 8) : r; }, get keepOut() { return S.keepOut; },
    /** The speed of the parties along their routes, m/s. */
    set speed(v) { S.speed = v; }, get speed() { return S.speed; },

    /** Put the head of party `k` at a place on its route: 0..1 round it. */
    place(u, k = 0) { if (routes[k]) S.head[k] = u * routes[k].length; for (const b of birds) if (b.route === k) b.fresh = true; return handle; },
    /**
     * Time a party so that its head reaches the point of its route nearest to `at` ([x, y, z]) in `seconds` from now. If that needs
     * no more than a third more or less speed it hurries or dawdles; otherwise it is put where it needs to be (do that while
     * it is out of sight). `k`: which party.
     */
    arrive(at, seconds = 4, k = 0) {
      const r = routes[k]; if (!r) return handle;
      const p = vec(at), target = r.nearest(p[0], p[1], p[2]), v = S.speed * (calm ? 0.8 : 1);
      let gap = (target - S.head[k] - v * seconds) % r.length; if (gap > r.length / 2) gap -= r.length; if (gap < -r.length / 2) gap += r.length;
      if (Math.abs(gap) <= v * seconds * 0.34) { S.retime = S.retime || { left: seconds, extra: routes.map(() => 0) }; S.retime.left = seconds; S.retime.extra[k] = gap / seconds; }
      else { S.head[k] += gap; for (const b of birds) if (b.route === k && b.state === ST.ROUTE) { b.fresh = true; b.show = 0; } }
      return handle;
    },
    /** Send the birds onto other routes (as many as there were, or one for all), easing over in `seconds`. */
    follow(newRoutes, { seconds = 6 } = {}) {
      // (one route, or a list of them; a route is a Route or a list of points, and a point is [x, y, z] or a Vector3)
      const isRoute = (r) => r instanceof Route || (Array.isArray(r) && r.length > 0 && (Array.isArray(r[0]) || (r[0] && r[0].isVector3)));
      const list = (newRoutes instanceof Route || !isRoute(newRoutes[0]) ? [newRoutes] : newRoutes).map((r) => (r instanceof Route ? r : new Route(r, true)));
      S.retime = null;
      for (const b of birds) if (b.state !== ST.GONE && b.state !== ST.PERCHED) { b.fromMode = 0; b.fromX = b.x; b.fromY = b.y; b.fromZ = b.z; b.blend = 0; b.dur = seconds * (0.8 + 0.4 * b.wr); b.state = ST.ROUTE; b.route = Math.min(list.length - 1, b.route); }
      routes.length = 0; list.forEach((r) => routes.push(r)); S.head = list.map((r, k) => { const b = birds.find((q) => q.route === k) || birds[0]; return r.nearest(b.x, b.y, b.z) + S.speed * 0.5; });
      return handle;
    },
    /**
     * Gather into one wheel and (if asked) climb: the swifts' vesper flight, a flock lifting from a tree, a knot of birds waiting.
     *   at: [x, y, z] the wheel's centre;  radius: r or [r0, r1] (it widens over `grow` seconds);  turn: seconds for one round;
     *   climb: m/s;  top: the height it stops climbing at;  seconds: how long each bird takes to join;  stagger: seconds over
     *   which perched birds leave their perches;  vanish: seconds after which they are out of sight and gone;  who: a perch
     *   group, a list of indices, or a test;  clockwise: true | false;  spread: metres of height between the lowest and highest
     */
    gather(g = {}) {
      const at = vec(g.at || [0, 20, 0]), r = Array.isArray(g.radius) ? g.radius : [g.radius ?? 12, g.radius ?? 12], t = S.time;
      S.wheel = { cx: at[0], cy: at[1], cz: at[2], r0: r[0], r1: r[1], turn: (g.turn ?? 10) * (calm ? 1.3 : 1), climb: g.climb ?? 0, top: g.top ?? 1e6, grow: g.grow ?? 12, dir: g.clockwise ? -1 : 1, spread: g.spread ?? 2.5, t0: t };
      const list = pick(g.who).filter((b) => b.state !== ST.GONE), stagger = g.stagger ?? 0.8;
      list.forEach((b, k) => {
        const sat = b.state === ST.PERCHED || b.state === ST.CROUCH;
        if (sat) b.home = b.perch;
        b.back = 0; b.goneAt = g.vanish != null ? t + g.vanish + k * 0.35 : 1e9;
        defer(b, sat ? 0.02 + rnd() * stagger : 0, (q) => enterWheel(q, g.seconds ?? 8));
      });
      return handle;
    },
    /** The same for birds that are perched: they lift together. */
    lift(g = {}) { return handle.gather({ seconds: 5, stagger: 0.8, ...g }); },
    /** Come down from the wheel to the perches in ones and twos over `over` seconds (their own perch if it is free). who as in gather. */
    settle({ over = 20, who } = {}) {
      const list = pick(who).filter((b) => b.state === ST.WHEEL || b.state === ST.TOWER), t = S.time;
      let at = 0;
      list.forEach((b, k) => { if (k % 2 === 0 || rnd() < 0.4) at = over * (k + rnd()) / Math.max(1, list.length); if (b.state === ST.TOWER) defer(b, at, homeward); else b.back = t + 0.3 + at + rnd() * 0.5; });
      return handle;
    },
    /** Put birds on free perches at once, with no flight: { who, to: 'group' } (any free perch without `to`). For a cue's `settle`,
     *  when the realm is entered part-way and the birds must already be where the moment left them. */
    seat({ who, to } = {}) {
      for (const b of pick(who)) {
        if (b.perch >= 0 && perchList[b.perch] && perchList[b.perch].taken === b.i) perchList[b.perch].taken = -1;
        const k = freePerch((q) => (to == null || q.group === to ? rnd() : -1));
        if (k < 0) continue;
        b.later = null; b.back = 0; b.show = 1; b.showTo = 1; sit(b, k); b.home = k;
      }
      return handle;
    },
    /** Make one or several perched birds leave now, as if the boat had come too near: { who, to: 'group' }. */
    flush({ who, to, back } = {}) { for (const b of pick(who)) if (b.state === ST.PERCHED) startle(b, S.time, { to, back }); return handle; },
    /** Birds that were hidden come out of places, one after another: { from: [[x, y, z], ...], stagger: seconds, who }. Without `from` they simply appear where their habit puts them. */
    release({ from, stagger = 0.5, who, toward } = {}) {
      const list = pick(who).filter((b) => b.state === ST.GONE);
      list.forEach((b, k) => {
        defer(b, k * stagger * (0.6 + 0.8 * rnd()), (q) => {
          q.showTo = 1; q.fresh = true; q.scale = 1;
          if (from && from.length) { const p = vec(from[k % from.length]); q.x = p[0]; q.y = p[1]; q.z = p[2]; q.show = 0.05; } else q.show = 0;
          if (habit === 'wander') { const Z = zones[q.zone], tx = toward ? toward[0] : Z.x, tz = toward ? toward[2] : Z.z; q.state = ST.WANDER; q.hdg = q.hdgTo = q.yaw = Math.atan2(tx - q.x, tz - q.z); q.yTo = toward ? toward[1] : lerp(Z.y[0], Z.y[1], rnd()); q.jink = 0.8 + rnd(); q.spd = sp.speed[1]; }
          else if (habit === 'patter') { q.yaw = Math.atan2(-wind.x, -wind.z); if (from) startShear(q, false); else startPatter(q); }
          else if (habit === 'route') { q.state = ST.ROUTE; q.fromMode = 0; q.fromX = q.x; q.fromY = q.y; q.fromZ = q.z; q.blend = from ? 0 : 1; q.dur = 4; }
          else if (habit === 'perch') {
            const kk = q.home >= 0 && perchList[q.home].taken < 0 ? q.home : freePerch(() => rnd());
            if (kk < 0) { q.showTo = 0; return; }
            if (from) { q.state = ST.MANUAL; goTo(q, perchList[kk].x, perchList[kk].y, perchList[kk].z, { perch: kk }); } else { sit(q, kk); }
            q.home = kk;
          }
        });
      });
      return handle;
    },
    /** Perched birds that were hidden appear over `over` seconds (a roost filling). */
    appear({ over = 4, who } = {}) { handle.release({ who, stagger: 0 }); let k = 0; for (const b of pick(who)) { b.show = -over * (k++ / Math.max(1, n)) / 0.6; b.showTo = 1; } return handle; },
    /**
     * Go, and do not come back: { to: [[x, y, z], ...] } into places (crevices, a loft: each bird shrinks to nothing as it arrives),
     * or { toward: [x, y, z] } away in a direction until out of sight (`seconds`, default 14). stagger: seconds between birds. who.
     */
    leave({ to, toward, stagger = 0.6, seconds = 14, who } = {}) {
      const list = pick(who).filter((b) => b.state !== ST.GONE);
      list.forEach((b, k) => {
        defer(b, k * stagger * (0.6 + 0.8 * rnd()), (q) => {
          if (q.state === ST.GONE) return;
          if (to && to.length) {
            const p = vec(to[k % to.length]);
            if (habit === 'patter') { const dst = [p[0], p[1], p[2]]; dst.hide = true; startShear(q, false, dst); }
            else { q.home = -1; goTo(q, p[0], p[1], p[2], { hide: true, then: ST.GONE, speed: sp.speed[1] * 0.8 }); }
          } else {
            const p = vec(toward || [q.x + Math.sin(q.yaw) * 100, q.y + 30, q.z + Math.cos(q.yaw) * 100]), ex = p[0] - q.x, ey = p[1] - q.y, ez = p[2] - q.z, l = Math.hypot(ex, ey, ez) || 1;
            if (q.state === ST.PERCHED || q.state === ST.CROUCH) { if (q.perch >= 0 && perchList[q.perch]) perchList[q.perch].taken = -1; q.yaw = q.pYaw; q.launch = 0.35; q.pitch = 0.5; q.fresh = true; q.fold = 0; if (o.onLeave) o.onLeave(q.i, q.x, q.y, q.z); }
            q.dx = ex / l; q.dy = ey / l; q.dz = ez / l; q.t = 0; q.dur = seconds; q.state = ST.AWAY; q.scale = 1;
          }
        });
      });
      return handle;
    },
    /** Lift where they are and hang into the wind, climbing `height` metres ([min, max]), one after another over `stagger` seconds (weather coming). resume() ends it. */
    tower({ height = [6, 10], stagger = 2, who } = {}) {
      for (const b of pick(who)) if (b.state !== ST.GONE && b.state !== ST.PERCHED) defer(b, rnd() * stagger, (q) => { q.state = ST.TOWER; q.lift = 0; q.yTo = q.y + lerp(height[0], height[1], rnd()); if (o.onLeave) o.onLeave(q.i, q.x, q.y, q.z); });
      return handle;
    },
    /** After tower(): back to what they were doing. */
    resume({ who } = {}) {
      for (const b of pick(who)) if (b.state === ST.TOWER) {
        if (habit === 'patter') startShear(b, false);
        else if (habit === 'route') { b.state = ST.ROUTE; b.fromMode = 0; b.fromX = b.x; b.fromY = b.y; b.fromZ = b.z; b.blend = 0; b.dur = 5 + 2 * b.wr; }
        else if (habit === 'wander') { b.state = ST.WANDER; b.hdg = b.hdgTo = b.yaw; }
        else homeward(b);
      }
      return handle;
    },
    /** Pose one bird yourself (for a pose sheet, or a bird a realm wants to hold somewhere): any of
     *  { position: [x, y, z], yaw, pitch, roll, phase (0..1 of a beat), depth, glide, fold, tail, legs, vee, stand, scale, perched: bool, lean, head, nod, cock, fluff, crest }. */
    pose(i, p) {
      const b = birds[i]; if (!b) return handle;
      b.state = ST.MANUAL;
      if (p.position) { b.x = p.position[0]; b.y = p.position[1]; b.z = p.position[2]; }
      if (p.phase != null) b.phase = p.phase * TAU;
      for (const key of ['yaw', 'pitch', 'roll', 'depth', 'glide', 'fold', 'tail', 'legs', 'vee', 'stand', 'fluff', 'crest', 'cock']) if (p[key] != null) b[key] = p[key];
      if (p.head != null) b.headYaw = p.head; if (p.nod != null) b.headNod = p.nod;
      if (p.perched) { b.pYaw = p.yaw ?? b.pYaw; b.pPitch = (p.lean != null ? p.lean : posture); b.state = ST.PERCHED; b.perch = -1; }
      b.scale = p.scale ?? 1; b.show = 1; b.showTo = 1;
      write(b); aPos.needsUpdate = aRot.needsUpdate = aFlap.needsUpdate = aMisc.needsUpdate = true;
      if (pPos) pPos.needsUpdate = pRot.needsUpdate = pPose.needsUpdate = true;
      return handle;
    },
  };
  return handle;
}

// =====================================================================================================================
// makeMurmuration: birds in their thousands, placed by the vertex shader (see GLSL_FLOCK)
// =====================================================================================================================
/**
 * A flock in closed form: a murmuration of starlings, a ribbon of flamingos. The realm drives it with a few values.
 *
 * options:
 *   species        default 'starling';  count: how many at high quality (thinned by the quality setting unless `exact`)
 *   detail         'grain' (12 triangles a bird: the default) | 'far' (about 50)
 *   path           [[x, y, z], ...] the way its centre goes (closed: true by default); speed: m/s along it (default 10)
 *   length, width, depth    metres: the flock's size along its path, across, and through (a cloud 120 x 40 x 14;
 *                  a ribbon 200 x 12 x 6)
 *   fold           metres the waves that fold it throw it about (default 0.28 x width); foldLength: their wavelength
 *                  (default 0.7 x length); foldRate: how fast they run (1 = folds and unfolds about every 10 s)
 *   plate          0..1: how far the whole flock banks where its path turns (default 0.8): this is what shows its
 *                  face and then its edge
 *   skew           how far the birds crowd toward the head (1 = even, default 1.5); tail: how thin the tail is (0.4)
 *   waves          { every: [3, 4], seconds: 2, strength: 1, ink: 1 } waves of bank that cross it by themselves (false = none;
 *                  flock.wave() sends one). ink: how dark the band is far off (1: two and a half times the birds at its
 *                  middle, each a third larger; 0: only the roll, which shows near and is lost far off); waveInk: the same, with waves: false
 *   dabs           the weight of the far flock's marks (see VERT_FLOCK: "How a flock is drawn"): 1 = as much ink as its birds
 *                  would lay down at their own size (the default); more is darker and more stippled. The rest of the birds
 *                  are the veil: drawn as fine as they are, `veil` times life size beyond about 200 m (default 2.4), they
 *                  make its tone. minPixels: the least width of a mark (default: twice the painter's brush; a flock of large
 *                  birds seen far may ask for more); dabCap: the largest share of the birds that are ever marks (1);
 *                  bold: the least thickness of a mark's strokes, pixels (default: two thirds of the brush)
 *   scale          draw every bird this much larger than life (default 1.3: a flock reads by its tone)
 *   crisp          default true: the birds keep out of the painter's filter (see makeFlock); false = they are painted, and
 *                  the marks are as thick as the brush
 *   lit            a flock of dark birds (starlings) is drawn as a silhouette in the realm's shadow colour, a flock of pale
 *                  ones (flamingos) takes half of the realm's light: true or false says which, whatever the plumage
 *   keepOut        metres from the rider's eye no bird comes (default 12; calmKeepOut: the same with reduced motion)
 *   avoid          up to four spheres to keep out of: [{ x, y, z, r }]
 *   mirror         { count, scale }: a second flock drawn only in the water's mirror, fewer and larger, in the same places
 *                  (then the flock itself is drawn only in the direct view);  only: 'mirror' | 'direct'
 *   homes          [[x, y, z, facing], ...] or (i, rnd) => [x, y, z, facing]: where each bird stands until lift()
 *                  (species with a standing pose: the flamingo); feeding: the share that stand with the head down (0.08)
 *   fog            0..1 of the realm's fog (default 0.3: a far flock must not drown in it; the veil still takes it)
 *   color, material, sunline: { y, soft, color }, seed, exact, parent
 */
export function makeMurmuration(ctx, options = {}) {
  const o = { species: 'starling', count: 12000, detail: 'grain', closed: true, speed: 10, length: 120, width: 40, depth: 14, foldRate: 1, plate: 0.8, skew: 1.5, tail: 0.4,
    waves: { every: [3, 4], seconds: 2, strength: 1 }, dabs: 1, minPixels: null, veil: 2.4, dabCap: 1, maxGrow: 8, scale: 1.3, keepOut: 12, fog: 0.3, seed: 1, feeding: 0.08, ...given(options) };
  if (o.homes && options.waves === undefined) o.waves = false;                   // (birds that stand and then lift in a ribbon have no waves of bank unless the realm asks for them)
  if (o.waves && o.waves !== true) o.waves = { every: [3, 4], seconds: 2, strength: 1, ...given(o.waves) }; else if (o.waves === true) o.waves = { every: [3, 4], seconds: 2, strength: 1 };
  const sp = typeof o.species === 'string' ? SPECIES[o.species] : o.species;
  if (!sp) throw new Error(`birds: no species called '${o.species}'`);
  const name = typeof o.species === 'string' ? o.species : 'bird', calm = !!ctx.reducedMotion;
  const n = o.exact ? o.count : ctx.kit.count(o.count), rnd = ctx.rng(o.seed * 11 + 5);
  const group = new THREE.Group(); group.name = `flock:${name}`;
  (o.parent || ctx.group).add(group);
  const base = birdGeometry(sp, o.detail);
  // ---- every bird's four numbers; and, for birds that stand somewhere first, where
  const seeds = new Float32Array(n * 4);
  for (let i = 0; i < n * 4; i++) seeds[i] = rnd();
  const aSeed = new THREE.InstancedBufferAttribute(seeds, 4);
  let aHome = null, aRel = null;
  if (o.homes) {
    const H = new Float32Array(n * 4), R = new Float32Array(n).fill(1e9);
    for (let i = 0; i < n; i++) { const h = xyz(typeof o.homes === 'function' ? o.homes(i, rnd) : o.homes[i % o.homes.length]); H[i * 4] = h[0]; H[i * 4 + 1] = h[1]; H[i * 4 + 2] = h[2]; H[i * 4 + 3] = h[3] ?? rnd() * TAU; }
    aHome = new THREE.InstancedBufferAttribute(H, 4); aRel = new THREE.InstancedBufferAttribute(R, 1);
  }
  const zero = () => Array.from({ length: 32 }, () => new THREE.Vector3());
  const U = {
    uPathA: { value: zero() }, uPathB: { value: zero() }, uPathK: { value: new THREE.Vector4(1, 1, 0, 0) }, uAt: { value: new THREE.Vector2(0, 0) }, uVel: { value: o.speed },
    uShape: { value: new THREE.Vector4(o.length / 2, o.width / 2, o.depth / 2, o.tail) }, uSkew: { value: new THREE.Vector4(o.skew, 0.3, 1, 1) },
    uFold: { value: new THREE.Vector4(o.fold ?? o.width * 0.28, o.foldLength ?? o.length * 0.7, o.foldRate * (calm ? 0.6 : 1), o.plate) },
    uPour: { value: new THREE.Vector4(0, 0.28, 0, 1) }, uMouth: { value: new THREE.Vector4(0, 40, 0, 8) }, uInto: { value: new THREE.Vector3(0, 20, 0) }, uIntoR: { value: new THREE.Vector3(10, 8, 10) },
    uWave: { value: [new THREE.Vector4(-100, 0, 1, 0), new THREE.Vector4(-100, 0, 1, 0)] }, uWaveK: { value: new THREE.Vector4(2, 0.22, 1.6, 1.25) },
    uWaveD: { value: [new THREE.Vector3(1, 0, 0), new THREE.Vector3(1, 0, 0)] }, uCentre: { value: new THREE.Vector3() },
    uWaveC: { value: new THREE.Vector2(0.6, 0.3).multiplyScalar((o.waves && o.waves.ink != null ? o.waves.ink : o.waveInk) ?? 1) },
    uFlockFlap: { value: new THREE.Vector4(sp.stroke.rate, sp.rhythm.kind === 'bound' ? sp.rhythm.flap[0] + sp.rhythm.rest[0] + 0.1 : 1, sp.rhythm.kind === 'bound' ? 0.27 : 0, 0) },
    uGrain: { value: new THREE.Vector4(o.dabs, sp.stand ? sp.stand.pitch * DEG : 0, 0, o.feeding) }, uObst: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 0)) },
    uKeep: { value: calm ? Math.max(o.keepOut, o.calmKeepOut ?? o.keepOut) : o.keepOut }, uShow: { value: o.hidden ? 0 : 1 },
    uRun: { value: new THREE.Vector4(0, -1, 1.3, 8) }, uClock: { value: 0 }, uDab: { value: new THREE.Vector3(5, o.veil, o.dabCap) },
  };
  (o.avoid || []).slice(0, 4).forEach((a, i) => U.uObst.value[i].set(a.x, a.y ?? 0, a.z, a.r));
  const make = (count, scale, dabs, where) => {
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.geometry.index; for (const k in base.geometry.attributes) geo.setAttribute(k, base.geometry.attributes[k]);
    geo.setAttribute('aSeed', aSeed); if (aHome) { geo.setAttribute('aHome', aHome); geo.setAttribute('aRel', aRel); }
    geo.instanceCount = count;
    const uniforms = { ...U, uGrain: where === 'mirror' ? { value: U.uGrain.value.clone().setX(dabs) } : U.uGrain };
    const mat = birdMaterial(ctx, sp, 'flock', { ...o, scale, minPixels: 1 }, { uniforms, defines: aHome ? { FLOCK_HOMES: '' } : {} });
    mat.uniforms.uBold.value.z = 0.3; mat.uniforms.uBold.value.w = 0.3;          // (a far mark may be a third as thick as it is wide: a dab; and a flock's wings keep most of their aspect)
    const mesh = new THREE.Mesh(geo, mat); mesh.name = `${name}:flock${where ? ':' + where : ''}`;
    // the least a mark can be: twice as long as the brush is wide (in the water's mirror, which is not painted, far less), or what the realm asks
    // (a flock's marks are thinner than the brush, two thirds of it: dashes that the filter softens a little, never blots)
    perPass(ctx, mesh, geo, () => count, !!o.prePass, o.bold, (u, boldNow, share) => { u.uDab.value.x = o.minPixels != null ? o.minPixels * share : 2.1 * boldNow; }, 0.68, o.crisp !== false);
    group.add(mesh);
    if (where) ctx.only(mesh, where);
    return { mesh, mat, geo };
  };
  const main = make(n, o.scale, o.dabs, o.mirror ? 'direct' : (o.only || null));
  const M = o.mirror ? { count: Math.min(n, o.exact ? (o.mirror.count ?? Math.round(n / 4)) : ctx.kit.count(o.mirror.count ?? Math.round(n / 4))), scale: o.scale * (o.mirror.scale ?? 2), dabs: 0 } : null;
  if (M) M.dabs = o.mirror.dabs ?? o.dabs;
  const mirror = M ? make(M.count, M.scale, M.dabs, 'mirror') : null;
  const mats = mirror ? [main.mat, mirror.mat] : [main.mat];

  // ---- the paths
  const S = { time: 0, at: 0, atB: 0, speed: o.speed, routeA: null, routeB: null, mix: 0, mixRate: 0, pour: 0, pourRate: 0, pourWas: 0, pourVel: 0, order: 0, swirl: 1, waveAt: 0, slot: 0, tweens: [], show: o.hidden ? 0 : 1, showTo: o.hidden ? 0 : 1 };
  const setPath = (which, pts, closed) => {
    const r = pts instanceof Route ? pts : new Route(pts, closed !== false), list = r.resample(32), arr = (which ? U.uPathB : U.uPathA).value;
    for (let i = 0; i < 32; i++) arr[i].copy(list[i]);
    if (which) { U.uPathK.value.y = r.length / (r.closed ? 32 : 31); U.uSkew.value.w = r.closed ? 1 : 0; S.routeB = r; } else { U.uPathK.value.x = r.length / (r.closed ? 32 : 31); U.uSkew.value.z = r.closed ? 1 : 0; S.routeA = r; }
    return r;
  };
  setPath(0, o.path || loop({ at: [0, 30, -100], size: [160, 90] }), o.closed);
  setPath(1, S.routeA, S.routeA.closed);
  if (o.at != null) S.at = o.at * S.routeA.length;
  const wrnd = ctx.rng(o.seed * 17 + 9);
  const _a = {}, _b = {}, _wc = new THREE.Vector3();
  const ease = (k) => k * k * (3 - 2 * k);

  function update(dtReal) {
    const dt = Math.min(0.05, dtReal);
    if (dt <= 0) return;
    S.time += dt; const t = S.time;
    if (!aHome) { S.at += S.speed * dt; S.atB += S.speed * dt; }                   // (birds with homes each walk the path from the moment they leave)
    if (S.mixRate > 0) { S.mix = Math.min(1, S.mix + S.mixRate * dt); if (S.mix >= 1) { setPath(0, S.routeB, S.routeB.closed); S.at = S.atB; S.mix = 0; S.mixRate = 0; } }
    for (let i = S.tweens.length - 1; i >= 0; i--) { const w = S.tweens[i]; w.t += dt; const k = ease(Math.min(1, w.t / w.dur)); w.set(w.from + (w.to - w.from) * k); if (w.t >= w.dur) S.tweens.splice(i, 1); }
    if (S.pourRate !== 0) { S.pour = clamp(S.pour + S.pourRate * dt, 0, 1); if (S.pour <= 0 || S.pour >= 1) S.pourRate = 0; }
    // how fast the pour is going, however it is driven (pour(), or `poured` set from a show clock): the birds in the funnel take their heading from it
    { const pv = Math.abs(S.pour - S.pourWas) / dt; S.pourWas = S.pour; S.pourVel += (pv - S.pourVel) * Math.min(1, dt * 6); }
    S.show += clamp(S.showTo - S.show, -dt / 1.5, dt / 1.5);
    // waves of bank by themselves
    if (o.waves && t > S.waveAt) { const W = o.waves; S.waveAt = t + lerp(W.every[0], W.every[1], wrnd()) * (calm ? 1.8 : 1); handle.wave({ strength: (W.strength ?? 1) * (0.7 + 0.5 * wrnd()), seconds: W.seconds }); }
    U.uAt.value.set(S.at, S.atB); U.uPathK.value.z = S.mix; U.uVel.value = S.speed; U.uPour.value.x = S.pour; U.uGrain.value.z = Math.max(Math.abs(S.pourRate), S.pourVel, 0.02); U.uShow.value = S.show; U.uClock.value = t;
    if (mirror) mirror.mat.uniforms.uGrain.value.z = U.uGrain.value.z;
    handle.centre(U.uCentre.value);
    for (const m of mats) m.uniforms.uBirdTime.value = t;
  }
  ctx.onUpdate((dt) => update(dt));
  const tween = (set, from, to, dur) => { if (!(dur > 0)) { set(to); return; } S.tweens.push({ set, from, to, dur, t: 0 }); };

  const handle = {
    object: group, mesh: main.mesh, mirror: mirror ? mirror.mesh : null, species: sp, count: n, mirrorCount: M ? M.count : 0, state: S, uniforms: U, triangles: base.triangles,
    /** Metres along its path of the flock's centre (set it to drive the flock from a show clock; otherwise it advances at `speed`). */
    get at() { return S.at; }, set at(v) { S.atB += v - S.at; S.at = v; },
    /** m/s along its path. */
    get speed() { return S.speed; }, set speed(v) { S.speed = v; },
    /** 0..1: how far the pour has gone (set it from a show clock, or use pour()). */
    get poured() { return S.pour; }, set poured(v) { S.pour = clamp(v, 0, 1); S.pourRate = 0; },
    /** Where its centre is now (for sound). */
    centre(out = new THREE.Vector3()) { S.routeA.at(S.at, _a); if (S.mix > 0) { S.routeB.at(S.atB, _b); const m = ease(S.mix); return out.set(lerp(_a.x, _b.x, m), lerp(_a.y, _b.y, m), lerp(_a.z, _b.z, m)); } return out.set(_a.x, _a.y, _a.z); },
    /** Ease over to another path in `seconds` (closed: false for one that leads away; at: 0..1 where on it to join, default nearest). */
    follow(points, { seconds = 8, closed = true, at = null } = {}) {
      if (S.mixRate > 0) { setPath(0, S.routeB, S.routeB.closed); S.at = S.atB; S.mix = 0; }
      const r = setPath(1, points, closed), c = handle.centre();
      S.atB = at != null ? at * r.length : r.nearest(c.x, c.y, c.z); S.mix = 0; S.mixRate = 1 / Math.max(0.05, seconds * (calm ? 1.4 : 1));
      return handle;
    },
    /** Change its shape over `seconds`: any of { length, width, depth, fold, foldLength, plate, speed, scale, dabs }. */
    shape(to, seconds = 4) {
      const sh = U.uShape.value, f = U.uFold.value;
      if (to.length != null) tween((v) => { sh.x = v / 2; }, sh.x * 2, to.length, seconds);
      if (to.width != null) tween((v) => { sh.y = v / 2; }, sh.y * 2, to.width, seconds);
      if (to.depth != null) tween((v) => { sh.z = v / 2; }, sh.z * 2, to.depth, seconds);
      if (to.fold != null) tween((v) => { f.x = v; }, f.x, to.fold, seconds);
      if (to.foldLength != null) tween((v) => { f.y = v; }, f.y, to.foldLength, seconds);
      if (to.plate != null) tween((v) => { f.w = v; }, f.w, to.plate, seconds);
      if (to.speed != null) tween((v) => { S.speed = v; }, S.speed, to.speed * (calm ? 0.6 : 1), seconds);
      if (to.dabs != null) tween((v) => { U.uGrain.value.x = v; }, U.uGrain.value.x, to.dabs, seconds);
      return handle;
    },
    /** A wave of bank crosses the flock now: { from: 'head' | 'tail' | 'side' | radians, strength: 1, seconds: 2 }. A dark band travels through it. */
    wave({ from = null, strength = 1, seconds = 2 } = {}) {
      const a = from === 'head' ? Math.PI : from === 'tail' ? 0 : from === 'side' ? Math.PI / 2 : typeof from === 'number' ? from : (wrnd() < 0.6 ? Math.PI : 0) + (wrnd() - 0.5) * 1.4;
      // the way the front goes, from the flock's heading at its centre (a = 0: from the tail forward; pi: from the head back);
      // and how far the flock reaches along that way, from five places down its length
      const c = handle.centre(_wc), L = U.uShape.value.x;
      S.routeA.at(S.at, _a); let tx = _a.tx, tz = _a.tz;
      if (S.mix > 0) { S.routeB.at(S.atB, _b); const m = ease(S.mix); tx = lerp(tx, _b.tx, m); tz = lerp(tz, _b.tz, m); }
      const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const dx = tx * Math.cos(a) - tz * Math.sin(a), dz = tz * Math.cos(a) + tx * Math.sin(a);
      let lo = 0, hi = 0;
      for (const u of [-1, -0.5, 0.5, 1]) { (S.mix > 0.5 ? S.routeB : S.routeA).at((S.mix > 0.5 ? S.atB : S.at) + u * L, _b); const e = (_b.x - c.x) * dx + (_b.z - c.z) * dz; lo = Math.min(lo, e); hi = Math.max(hi, e); }
      const pad = 0.5 * U.uShape.value.y, slot = S.slot++ % 2;
      U.uWave.value[slot].set(S.time, strength * (calm ? 0.5 : 1), Math.max(8, (hi - lo) / 2 + pad), (hi + lo) / 2);
      U.uWaveD.value[slot].set(dx, 0, dz); U.uWaveK.value.x = seconds * (calm ? 1.5 : 1);
      return handle;
    },
    /**
     * Pour into a tree (or a reed bed): { mouth: [x, y, z] the top of the funnel, radius: its width there, into: { at: [x, y, z],
     * radii: [rx, ry, rz] } where the birds end, seconds: 7 from the first bird to the last, order: 'head' | 'random',
     * swirl: 1, share: 0.28 (how much of the whole pour one bird's own descent takes) }. reverse: true lifts them out again.
     */
    pour({ mouth, radius, into, seconds = 7, order, swirl, share, reverse = false } = {}) {
      handle.funnel({ mouth, radius, into, order: order ?? 'head', swirl: swirl ?? 1, share: share ?? 0.28, reverse });
      S.pourRate = (reverse ? -1 : 1) / Math.max(0.1, seconds * (calm ? 2 : 1));
      if (reverse && S.pour <= 0) S.pour = 1;
      return handle;
    },
    /** Say where the funnel is without starting the pour: for a pour that the realm drives itself from a show clock, by setting
     *  `poured` (0..1) every frame. The same options as pour() but `seconds`; here what is left out stays as it was. */
    funnel({ mouth, radius, into, order, swirl, share, reverse = false } = {}) {
      const P = U.uPour.value;
      if (mouth) { const m = xyz(mouth); U.uMouth.value.set(m[0], m[1], m[2], radius ?? U.uMouth.value.w); } else if (radius != null) U.uMouth.value.w = radius;
      if (into) { U.uInto.value.set(...xyz(into.at)); U.uIntoR.value.set(...(into.radii || [10, 8, 10])); }
      if (share != null) P.y = share;
      if (order != null) S.order = order === 'random' ? 1 : 0;
      if (swirl != null) S.swirl = swirl;
      P.z = S.order + (reverse ? 2 : 0); P.w = S.swirl * (reverse ? -1 : 1);       // (uPour.z: 0 head first, 1 any order; and 2 more when it runs backwards)
      return handle;
    },
    /** Birds with homes: let them go. { front: { from: [x, z], dir: [dx, dz], speed: m/s } a line that sweeps over them (each goes as it
     *  passes), or delay: (i, x, z) => seconds; jitter: seconds; stay: the share that never lift; wind: [x, z] the way the wind blows
     *  (they run into it); join: seconds to reach the ribbon }. */
    lift({ front = null, delay = null, jitter = 1.4, stay = 0, wind = null, join = 8 } = {}) {
      if (!aRel) return handle;
      const H = aHome.array, R = aRel.array, lr = ctx.rng(o.seed * 23 + 1);
      let fx = 0, fz = 1; if (front) { const l = Math.hypot(front.dir[0], front.dir[1]) || 1; fx = front.dir[0] / l; fz = front.dir[1] / l; }
      for (let i = 0; i < n; i++) {
        const x = H[i * 4], z = H[i * 4 + 2];
        const d = delay ? delay(i, x, z) : front ? Math.max(0, ((x - front.from[0]) * fx + (z - front.from[1]) * fz) / (front.speed || 26)) : 0;
        R[i] = lr() < stay ? 1e9 : S.time + 0.5 + d + lr() * jitter;
      }
      aRel.needsUpdate = true;
      if (wind) { const l = Math.hypot(wind[0], wind[1]) || 1; U.uRun.value.x = -wind[0] / l; U.uRun.value.y = -wind[1] / l; }
      U.uRun.value.w = join;
      return handle;
    },
    /** Fade the whole flock out (1.5 s) or in. */
    hide() { S.showTo = 0; return handle; }, show() { S.showTo = 1; return handle; },
  };
  return handle;
}

/** Perches as plain records, whatever they were given as. */
function normalisePerches(ctx, list, rnd) {
  const out = [];
  if (!list) return out;
  const v = new THREE.Vector3();
  for (const p of [].concat(list)) {
    if (!p) continue;
    if (p.isVector3) { out.push({ x: p.x, y: p.y, z: p.z, face: rnd() * TAU, taken: -1 }); continue; }
    if (p.line) {                                                                // birds along a line or a rail, never evenly
      const a = xyz(p.line[0]), b = xyz(p.line[1]), len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), count = p.count ?? Math.max(1, Math.floor(len / 0.3));
      const face = p.face ?? Math.atan2(-(b[2] - a[2]), b[0] - a[0]);
      const ts = []; for (let i = 0; i < count; i++) ts.push((i + 0.15 + rnd() * 0.7) / count);
      for (const t of ts) { const sag = (p.sag ?? 0) * 4 * t * (1 - t); out.push({ x: lerp(a[0], b[0], t), y: lerp(a[1], b[1], t) - sag, z: lerp(a[2], b[2], t), along: [(b[0] - a[0]) / len, (b[1] - a[1]) / len, (b[2] - a[2]) / len], face: face + (rnd() < 0.12 ? Math.PI : 0) + (rnd() - 0.5) * 0.3, fixed: p.face != null, group: p.group, within: p.within, to: p.to, hide: p.hide, taken: -1 }); }
    } else if (p.isObject3D) {
      p.updateWorldMatrix(true, false); v.setFromMatrixPosition(p.matrixWorld); ctx.group.worldToLocal(v);
      out.push({ x: v.x, y: v.y, z: v.z, face: rnd() * TAU, group: (p.userData && p.userData.group) || undefined, name: p.name, taken: -1 });
    } else {
      const room = p.room ?? 1, al = p.along;
      for (let k = 0; k < room; k++) {                                           // (room: how many may sit at this place, side by side along the bough, never on top of one another)
        const off = room > 1 ? (k - (room - 1) / 2) * (p.spread ?? 0.11) * (0.8 + 0.4 * rnd()) : 0, a = rnd() * TAU;
        const dx = al ? al[0] * off : Math.cos(a) * off, dy = al ? al[1] * off : 0, dz = al ? al[2] * off : Math.sin(a) * off;
        const face = p.face ?? (al ? Math.atan2(-al[2], al[0]) + (rnd() < 0.5 ? Math.PI : 0) + (rnd() - 0.5) * 0.3 : rnd() * TAU);         // (on a bough: across it, either way round)
        out.push({ x: p.x + dx, y: p.y + dy, z: p.z + dz, along: p.along, face, fixed: p.face != null, look: p.look ? xyz(p.look) : undefined, group: p.group, hide: p.hide, within: p.within, to: p.to, taken: -1 });
      }
    }
  }
  return out;
}
