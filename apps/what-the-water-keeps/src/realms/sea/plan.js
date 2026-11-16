// The answering sea: the area's numbers, taken from docs/art/sea.md. Plain data and small functions, no three.js.
// Every module of the area reads this, so that a thing is in the same place in all of them.
//
// Reading the numbers: `s` is metres along the path from its first point, `d` metres to the RIGHT of the centre line
// (negative = left), heights are above still water. Convert with kit.at(s, d, y). The path's centre line IS the
// composed line: a boat left alone is carried along it. Where a thing is given in the realm's own x, z (the far
// pipes, the far strips) the page gives it that way too.
//
// ADD to this file under a heading of your own; change a number that is here only when the page says it is wrong,
// and say so in your log (docs/build/sea/).

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ------------------------------------------------------------------------------------------------ layout (stage 1)
export const PLAN = {
  // ---- the route (the page's, unchanged). With the engine's spline it is 259.2 m long; its control points fall at
  // s 0, 28, 50.5, 68.8, 87.5, 107.6, 141.5, 177.6, 208, 234.2 and 259.2.
  path: { softEdges: true, points: [
    [0, 0, 9], [0, -28, 9], [-5, -50, 13], [-8, -68, 13], [-3, -86, 12], [-1, -106, 11],
    [-2, -140, 29], [-5, -176, 30], [0, -206, 18], [4, -232, 8.5], [11, -256, 8],
  ] },
  length: 259.2,
  zones: { dark: [0, 26], reach: [26, 44], pipes: [44, 86], gate: [86, 106], sound: [106, 196], tower: [196, 232], wall: [232, 260] },

  // ---- open water. The edges are soft: nothing stops the boat at the half width. Beyond it the engine's own lean
  // tops out at about 2.7 m/s, which a rider who paddles hard can beat, so the realm adds its own (set.js): from
  // `lean` metres outside the half width the water leans the boat back harder and harder, and by `stop` metres no
  // paddling beats it. Reachable water is therefore the channel and at most about `stop` metres either side of it,
  // and everything within 150 m of THAT is modelled. West of the Prow (outside the cave, beyond s `endStop`) the
  // water leans the boat back up the route: the path may only be left through the cave.
  limits: { lean: 24, stop: 46, endStop: 238 },

  // ---- colours (the page's chips and local colours)
  colors: {
    night: '#070C1E', basalt: '#17142A', slate: '#2A3552', ember: '#0E5E6E', aqua: '#3FE0D0', core: '#D2FBF2', violet: '#6F55E6', greenGold: '#B4E86A',
    amber: '#FFB45E', amberCore: '#FFE2A8', dyingEmber: '#2E2A78',
    basaltWet: '#100E20', lichen: '#2B2A45', barnacle: '#59627E', kelp: '#0A1A18', granite: '#34405E', timber: '#221C2E', iron: '#2A1A2E', copper: '#27504A', boatPaint: '#8C95AA',
  },

  // ---- light. `L` is the sea's light: 0 until the rain front arrives, 1 behind it, eased by the boat's distance
  // along (lightBy). The table is the page's (section 2), state by state. `dark` is the first seconds in the veil.
  look: {
    rest: {
      // (the page's fog is #080D1C: with the sky as it must be drawn here, rock in that fog stands BLACK against the low sky
      // at any distance; in the low sky's own colour it is lost beyond 100 m and known only by its lit foot, as the page wants)
      background: '#04060D', fog: { color: '#121B31', density: 0.008 }, veil: '#05070f', exposure: 1.30,
      bloom: { strength: 0.5, radius: 0.5, threshold: 0.9 },      // the page: 0.95, 0.8, 0.70 (a cyan fog over the whole frame: see the log)
      grade: { tint: '#EAF4FF', saturation: 1.0, contrast: 1.05, lift: '#03050C', vignette: 0.42, grain: 0.04 },      // the page: saturation 1.08 (the tone curve's toe already enriches the darks)
      paint: 0.55, paintRadius: 4.0,
      light: { key: [0.15, 1, 0.1], keyColor: '#3FE0D0', gain: 0.12, shadow: '#0A0D22', lit: '#0E5E6E', sky: '#080C1C', ground: '#0B2A36', lanternRadius: 6 },
      lantern: 2.6, lanternLit: 0.25, mirrorScale: 0.5, current: 1.8, currentNarrow: 2.2,
    },
    dark: { exposure: 0.55 },                                   // s 0: eased to `rest` over 8 s from the first bow light at s 14
    // (the page's lit fog is #0E1B33; as with the fog at rest, it has to be the colour of the low sky behind what it hides,
    // and the lit sky is paler than that: in #0E1B33 the far headlands stood as a black wall along the horizon)
    air: { background: '#070A18', fog: { color: '#17345C', density: 0.0048 } },      // the air opens ahead of the front (set.js says why this is a state of its own)
    lit: {
      background: '#070A18', fog: { color: '#17345C', density: 0.0048 }, exposure: 1.0,      // the page: 0.90
      bloom: { strength: 0.70, radius: 0.9, threshold: 0.82 },
      grade: { saturation: 1.0, contrast: 1.08, vignette: 0.34 },      // the page: saturation 1.12
      paint: 0.70, paintRadius: 4.5,
      light: { gain: 1.25, shadow: '#1B1750', lit: '#8FF2E4', sky: '#141040', ground: '#1C93A0' },
    },
  },
  sky: {
    // The page: at rest #04060D / #080D1C / #101830 with panorama A at 0.2; lit #080B1C / #161C40 / #1F3350, A at 0.8
    // and B added at 1.0. As built: the engine's tone curve has a toe that takes everything under about #101830 to black
    // and makes dark blues bluer, so at rest A stands at 0.65 (or the sky is a black hole and the rocks have nothing to
    // be darker than), and lit the gradient is darker and B at 0.55 (or the sky is brighter than the sea).
    rest: { top: '#04060D', mid: '#080D1C', horizon: '#101830', a: 0.65, b: 0 },
    lit: { top: '#06070F', mid: '#0E1026', horizon: '#172238', a: 0.9, b: 0.8 },
    midAt: 0.28,
    shelfBearing: 75,            // degrees left of the route at s 150 that the shelf cloud's centre bears
    // In the packed panorama the shelf cloud's centre is at 0.198 of the width (108.8 degrees left of the picture's
    // middle). Turned -27.3 degrees it bears 75 degrees left of the route at s 150; the dome starts 8.6 degrees short of
    // that and drifts there in the 86 s a boat left alone takes to reach s 150.
    turn: -18.7,                 // degrees at the start (positive moves the picture to the rider's left)
    drift: -0.1,                 // degrees a second: the ceiling moves to the right, as the front does
    grey: 0.5,                   // how far the paintings are pulled from ultramarine toward slate (the standing sky owns ultramarine)
    ceiling: 420,                // metres: the height at which the cloud is taken to hang, for the edge of the underlight
    underlightTop: 30,           // degrees: the underlight is gone by this elevation
  },
  firstLight: 14,                // s at which the water first answers (the cue 'firstlight'); exposure rises over 8 s from there
  // the sea's light by the boat's distance along: 1 until s 196, 0.45 by s 216, 0 by s 250
  lightBy(s) { return s < 196 ? 1 : s < 216 ? lerp(1, 0.45, smooth(196, 216, s)) : lerp(0.45, 0, smooth(216, 250, s)); },
  // the rain's share by the boat's distance along: full to s 196, 35 per cent by s 212, 15 by s 228, none inside the cleft (s 236)
  rainBy(s) { return s < 196 ? 1 : s < 212 ? lerp(1, 0.35, smooth(196, 212, s)) : s < 228 ? lerp(0.35, 0.15, smooth(212, 228, s)) : s < 236 ? 0.15 : 0; },
  // the current, m/s, by the boat's distance along (the showstopper's 0.8 is set by the show clock in set.js)
  // (stage 5, the critique: the page has 1.8 (2.2 narrow) to s 106. At that pace a boat left alone was through the gate's twenty metres of vault in
  // nine seconds and met one of its three great crests, or two: the area's canopy was hardly seen. The water now slackens to the sound's 1.2 as the
  // gate is neared (s 72 to 82), so that the 24 s of moment 5 are all spent before and under the vault. Before: 1.8 / 2.2 to s 100, eased to 1.2 by s 112)
  currentBy(s) {
    const gate = smooth(72, 82, s);
    const wide = s < 190 ? lerp(1.8, 1.2, gate) : s < 202 ? lerp(1.2, 1.6, smooth(190, 202, s)) : s < 230 ? 1.6 : lerp(1.6, 2.2, smooth(230, 240, s));
    const narrow = s < 190 ? lerp(2.2, 1.2, gate) : wide;
    return { wide, narrow };
  },

  // ---- the water (the page's section 7, in the words of docs/water.md)
  water: {
    deep: '#03060F', shallow: '#082230', glow: '#000000', sparkle: 0,
    reflectFloor: 0.03, reflectivity: 0.70, fresnel: 4, roughness: 0.40, streak: 1.6, waveHeight: 0.35,
    // three waves 18 / 24 / 30 m long (the engine's are 0.75, 1 and 1.25 of swellLength), 0.65 m in all, 7 s for the
    // longest, travelling toward local (+0.9, +0.42): a head sea from ahead-left
    swell: 0.65, swellLength: 24, swellPeriod: 6.3, swellDir: [0.9, 0.42],
    // light from touch. The water's own `touch` is kept next to nothing: it lays and feeds the trace (written at up to 0.73 and fading over 28 s, so
    // that the wake is a road 45 m long), and the realm draws the flecks itself, so that they cool as they age (seaLight below, light.js)
    touch: { amount: 0.002, color: '#3FE0D0', hold: 28, fleck: 1, wake: 0.3, wakeSlow: 0.55 },
    // what the water still draws itself: a thin line of core light along every crest of a ripple, the churned lane
    // astern, the rings of rain. (The page asked 3.2; with it the bloom floods the frame: docs/build/sea/1-layout.md)
    rippleGlow: '#D2FBF2', rippleGlowStrength: 0.5,
    clarity: 8.5, seeDistance: 15, absorb: '#c4c0ff', absorbDepth: 9, underglow: 0.05,
    foam: 0.3, rippleSize: 64, rippleLife: 4,
    rain: 9, rainStrength: 1,
    trace: { texel: 0.125, margin: 46 },
  },
  swellWaves: [0.75, 1, 1.25],   // the engine's three waves as shares of swellLength (their periods go with the square root)
  // the realm's own sheet of light on the water (light.js, sea.sheet): how bright the water the hull is touching now
  // is (the churned lane at the stern and the bow wave: this is where the core colour comes from), how strongly the
  // sea answers the rain behind the front (0..1: the share of the flecks that light), and the sizes of its flecks
  // (repeats per metre of the fleck picture: fine, coarse, and the far mottle)
  seaLight: { wake: 1.0, rain: 0.84, fleck: [0.37, 0.16, 0.047] },

  // ---- the rain front (the showstopper's light). It comes from ahead-left: its line travels to the right and 15
  // degrees up the route; at t 0 it stands 150 m short of the trigger point (s 150, d 0) and advances 12.5 m/s
  // (7.5 with reduced motion: 20 s instead of 12).
  front: { trigger: [150, 0], turn: 15, short: 150, speed: 12.5, calmSpeed: 7.5, width: 14, parked: 360 },
  // the show clock: the cue's name, where it fires, and the least the clock reads at a distance along
  show: { cue: 'answering', s: 150, length: 36, current: 0.8, by: (s) => (s - 150) * 0.5 },

  // ---- the pipes: eleven stacks of hexagonal columns (footprint along the route by across it)
  stacks: [
    { n: 1, name: 'the outlier', s: 44, d: 36, along: 9, across: 8, h: 12 },
    { n: 2, name: 'the gatepost', s: 52, d: -22, along: 11, across: 10, h: 20, kelp: true },
    { n: 3, name: 'stack 3', s: 58, d: 21, along: 10, across: 9, h: 15, kelp: true },
    { n: 4, name: 'the stump', s: 60, d: -40, along: 8, across: 8, h: 9 },
    { n: 5, name: 'stack 5', s: 66, d: 34, along: 12, across: 10, h: 23 },
    { n: 6, name: 'the tall pipe', s: 70, d: -22, along: 14, across: 12, h: 34, kelp: true },
    { n: 7, name: 'the table', s: 74, d: 19, along: 8, across: 8, h: 8, flat: true, kelp: true },
    { n: 8, name: 'stack 8', s: 78, d: -44, along: 15, across: 12, h: 29 },
    { n: 9, name: 'the leaning pair', s: 82, d: 20, along: 11, across: 9, h: 25, slit: 1.5, kelp: true },
    { n: 10, name: 'left shoulder', s: 86, d: -27, along: 14, across: 12, h: 27 },
    { n: 11, name: 'right shoulder', s: 86, d: 38, along: 12, across: 12, h: 26 },
  ],
  columns: { pitch: 0.78, across: [0.55, 0.9], lean: [2, 6], below: 2.5 },      // hex pitch, column widths, lean in degrees, metres they go down under the water
  // counts the page plans for the far column unit, by draw group (kit.js reports what it grew)
  columnCounts: { pipes: 1900, gate: 1400, wall: 1500, farPipes: 360, skerry: 240, near: 520 },

  // ---- the gate: a curtain of columnar basalt across the route with a pointed arch through it. Its frame: centre
  // plane at s 96, `d` across. crest: [d, height] pairs; thick: [d, thickness].
  gate: {
    s: 96, from: -62, to: 50,
    crest: [[-62, 16], [-30, 30], [-18, 36], [18, 36], [30, 30], [50, 16]],
    thick: [[-62, 12], [-12, 20], [12, 20], [50, 12]],
    open: 12, apex: 22, steps: 1.5,                        // the opening: half width at the waterline, apex, causeway steps at each foot
    crown: { half: 35, from: 24, over: 1.5 },              // gate_crown: the cap and keystone mass over the opening (70 m), with its overhang
    hang: { count: 150, len: [0.4, 3.5] },                 // broken column ends hanging from the vault
    stumps: { count: 9, d: [-10.5, -12], top: [0.4, 2.8] },
    reefs: [[-70, -62], [50, 58]],                         // reefs awash at its two ends (d from, to)
    col: 1.0,                                              // its columns are about a metre across
    // the vault's height above the water at d (a pointed arch of two arcs through (+-12, 0) and (0, 22))
    arch(d) { const a = Math.abs(d); if (a >= 12) return 0; const c = 340 / 24, R = 12 + c; return Math.sqrt(Math.max(0, R * R - (a + c) * (a + c))); },
    crestAt(d) { const c = this.crest; if (d <= c[0][0]) return c[0][1]; for (let i = 1; i < c.length; i++) if (d <= c[i][0]) return lerp(c[i - 1][1], c[i][1], (d - c[i - 1][0]) / (c[i][0] - c[i - 1][0])); return c[c.length - 1][1]; },
    thickAt(d) { const c = this.thick; if (d <= c[0][0]) return c[0][1]; for (let i = 1; i < c.length; i++) if (d <= c[i][0]) return lerp(c[i - 1][1], c[i][1], (d - c[i - 1][0]) / (c[i][0] - c[i - 1][0])); return c[c.length - 1][1]; },
  },

  // ---- the wall: the cliff that ends the sea. Its frame: origin on the centre line at s 236, x = d (to the right),
  // z = metres down the route from the face. The face runs from the Prow's corner (d -22) to d +110 and then bends
  // away down the route so that its end is never seen (the page: "to beyond d +110"; layout's decision).
  wall: {
    s: 236,
    face: [[-22, 0], [-8, 0], [8, 0], [60, 0], [110, 0], [150, 10], [190, 34], [226, 76], [250, 130]],      // [d, z] in the wall's frame
    height: [[-22, 45], [0, 45], [60, 52], [110, 48], [250, 44]],                                             // [d, height]
    plinth: 3, colonnade: 32, col: 1.4,                    // three tiers: stumps to 3 m, columns 1.2 to 1.6 m across to 32 m, a cap of rough rock above
    prow: { from: -22, to: -8, out: 5, height: 45, coast: [-30, -300], beyond: [[-24, -344], [6, -384]] },      // the buttress; beyond it the coast runs to local (x, z)
    cleft: { half: 8, closeAt: 248, closeHeight: 20, bendAt: 250 },           // 16 m wide at the water; closed overhead at 20 m by s 248
    heightAt(d) { const c = this.height; if (d <= c[0][0]) return c[0][1]; for (let i = 1; i < c.length; i++) if (d <= c[i][0]) return lerp(c[i - 1][1], c[i][1], (d - c[i - 1][0]) / (c[i][0] - c[i - 1][0])); return c[c.length - 1][1]; },
  },

  // ---- far pipes: three lone stacks in the open sea to the left, in the realm's own x, z (they cannot be reached)
  farPipes: [{ x: -78, z: -249, h: 24, w: 9 }, { x: -61, z: -284, h: 30, w: 10 }, { x: -55, z: -324, h: 20, w: 8 }],

  // ---- the skerry (hero) and what stands on it. Its outline in [s, d], channel side first.
  skerry: {
    outline: [[198, 9], [202, 6.2], [206, 4.2], [218, 4.2], [224, 7.5], [230, 12], [233, 24], [229, 36], [216, 40], [204, 37], [197.5, 24]],
    height: [0.8, 4],
    ledge: { s: [206, 218], d: [4.2, 5.8], y: 0.8 },
    slip: { s: 223, d: [7.5, 12.5], pitch: 12 },           // two greased skids at 12 degrees; the rowing boat on them, bow inland, stern 1.5 m from the water
    creels: [220, 7.5], pools: 9, reefToWall: [230, 236, 13],
  },
  tower: {
    at: [216, 11], height: 34,
    // the tower's outline from the rock up: [radius, height]
    profile: [[5.2, 0], [4.75, 1.6], [4.3, 3.4], [4.1, 5], [2.8, 26.4], [3.0, 26.7], [3.7, 26.8], [3.7, 27.05], [2.15, 27.1], [2.1, 27.6], [2.1, 31.2], [2.25, 31.3], [1.5, 32.2], [0.35, 32.6], [0.2, 33.1], [0.06, 33.3], [0.06, 34]],
    gallery: 27, glazing: [27.6, 31.2], lens: { across: 1.84, height: 2.6, y: 28.1, turn: 28 },
    door: { turn: 40, sill: 2.6, w: 0.9, h: 1.9, reveal: 1.3 },      // on the channel side, turned 40 degrees toward up-route
    rungs: 6, windows: 6,
  },
  // the kept lamp: in the open door, on the wrought bracket (the same piece as the town's clock tower)
  // lee: within 26 m of it the sea's light is held down by 70 per cent (the page's own remedy for a stroke washed out by bright water)
  lamp: { at: [212.8, 7.2], y: 3.3, note: 72, near: 8, reach: 12, moths: 2, lee: [26, 0.7] },

  // ---- the other great things
  wreck: { stern: [160, -36], stem: [178, -47], length: 21, frames: 14, high: 4.2, reef: { s: [156, 182], d: [-52, -32] } },
  buoy: { at: [138, -29], across: 2.4, tall: 5.8, above: 4.1 },
  dans: [[141, -30.5], [159, -34.5]],
  floats: [[144, -31], [147.5, -31.8], [151, -32.6], [154.5, -33.3], [157, -34]],
  eastReef: { at: [150, 38], along: 14, across: 8, stumps: 5 },
  rowboat: { at: [223, 10], length: 4.2 },
  rope: { at: [3, -2.5], length: 6 },                      // the last rope from the fly tower (the passage in, our half)

  // ---- under the keel
  jellies: {
    small: { count: 2600, sound: 2200, thin: 400, across: [0.25, 0.45], depth: [1, 22] },
    great: [[118, -4, 2.2], [130, 8, 3.0], [136, 22, 2.6], [146, -9, 2.5], [158, 7, 3.4], [164, 24, 3.0], [172, -6, 2.2], [176, -22, 2.8], [192, 3, 2.8]],      // [s, d, depth]
  },
  whale: {
    length: 25, girth: 4.2,
    beneath: { from: [132, 46], to: [144, -40], depth: [11, 7], speed: 2.5, startS: 112 },      // moment 7
    surface: [187, -13], flukes: [198, -26], flukeSpan: 6.2, flukeHigh: 4.5,                    // the showstopper, t 16 to 30
  },
  kelp: { fronds: 900, beds: 12, len: [3, 6] },
  clumps: 1200,

  // ---- painted art that exists (assets/art/sea/): set true as each is generated and packed, so that nothing asks
  // the server for a file that is not there
  art: { sky: true, skyglow: true, far: true },

  // ---- far backdrops: three painted strips on a curved rail centred on local (0, -180), from yaw +10 to +125
  // (art/sea/far.webp holds the three strips one above another; uv: the part of the picture each takes, v = 0 at the bottom)
  far: { centre: [0, -180], yaw: [10, 125], strips: [
    { r: 470, high: 30, uv: [0, 0.792, 1, 0.922] },      // the farthest and palest: a long low headland with a stepped cliff
    { r: 380, high: 40, uv: [0, 0.458, 1, 0.722] },      // a higher headland ending in a sheer cliff, two stacks off its end
    { r: 300, high: 36, uv: [0, 0.028, 1, 0.372] },      // the nearest and darkest: a wall of organ-pipe cliffs
  ] },
};

// ------------------------------------------------------------------------------------------------ kit and close band (stage 2b)
// The kit's own numbers (src/realms/sea/kit.js; docs/build/sea/2-kit.md). Nothing above is changed by them.
PLAN.kit = {
  // the surface paintings (assets/art/sea/<file>.webp, each made to repeat) and the mean colour of each (linear),
  // by which it is divided so that a painting changes a surface's paint and never its value
  art: {
    side: { file: 'basalt', mean: [0.0448, 0.0445, 0.1474] },          // the weathered side of a column: joints, cracks, lichen, salt
    face: { file: 'basalt_face', mean: [0.0357, 0.0363, 0.1226] },     // the side of ONE prism, no joints: damp and salt running down, steep cracks, lichen (the kit's columns wear this; `side` has six level joints to a repeat and coursed every column like masonry)
    tide: { file: 'shore_tide', mean: [0.0388, 0.0543, 0.1469] },      // the tide zone: barnacle crust, mussels, wrack
    tops: { file: 'shore_tops', mean: [0.0254, 0.0446, 0.1445] },      // column tops from straight above (reefs, plates)
    rough: { file: 'shore_rough', mean: [0.0286, 0.0477, 0.1592] },    // rough uncolumned basalt (caps, the wall's brow)
    ledge: { file: 'shore_ledge', mean: [0.0461, 0.0597, 0.1834] },    // a face under a seabird ledge: guano streaks, tufts of thrift
    // the page's `tower` sheet, for the heroes (the kit lays none of these itself). Granite, oak and paint have level
    // courses, grain and seams: repeat them mirrored across (THREE.MirroredRepeatWrapping on wrapS) if the seam shows.
    granite: { file: 'tower_granite', mean: [0.0496, 0.0906, 0.2294] }, // coursed granite, five courses to a repeat
    oak: { file: 'tower_oak', mean: [0.0937, 0.0817, 0.17] },           // weathered ship's oak, trenail heads, stains
    boatpaint: { file: 'tower_paint', mean: [0.2016, 0.2821, 0.4496] }, // worn pale boat paint over planking
    copper: { file: 'tower_copper', mean: [0.0324, 0.1588, 0.1741] },   // verdigris sheet with standing seams, rust weeping
  },
  tile: { side: 3.4, tide: 1.25, tops: 2.6, rough: 5.5, ledge: 7 },   // metres one repeat of each covers
  show: 0.85,                                                          // how much of a surface's paint is carried into the sea's added light (0..1)
  tide: { top: 1.35, gain: 1.15, amount: 0.92, ragged: 0.45 },        // the tide zone's upper line (m), how pale its crust, how much of it, how ragged its edge
  // the painted basalt on a face: how much of the painting's own light and dark; a drum's usual length (m, for a column
  // 0.78 m across); how dark its joints; how far one drum's colour may stand from the next
  paint: { amount: 0.8, drum: 1.3, seam: 0.6, drums: 0.2, lip: 0.35 },      // (drum was 0.8: with the jointless painting the drawn joints are the only ones on a far column, and they are few; lip: how pale the chipped lip at a joint)
  base: '#7c7892',                                                     // the colour dry basalt is painted in the kit's models (source-art/models/sea/basalt.py): the ride brings it down to colors.basalt
  cap: { under: 0.9, across: 0.27 },                                   // a stack's columns stop at this share of its height (the cap's crest is about the height); a cap is this share of the stack's foot across (0.44 at first: wider than the columns under it, a hammer head against the sky)
  low: 0.55,                                                           // how readily the kit's LOW rock (steps, reefs, fallen drums, stumps: all of it within a man's height of the water) takes the sky's slate and the lit sea's fill: at 1 a reef behind the rain front was a block of pale ice
  cave: { reach: 15 },                                                 // inside the cleft the light that comes in at the mouth falls as exp(-(metres in / reach)^1.6)
  // the lit foot (kit.js, "THE LIT FOOT": the kit's own shaping of the sea's light on its rock within about 40 m of the eye). amount: how much of it (0 leaves the light
  // as light.js gives it); film: the brightest a film of light between marks is (linear; what is brighter counts as a mark); breath: how much of a film is kept just over
  // the water; thin: how few marks are left high up (the cut their clusters must pass: 0.5 leaves half, 0.66 about an eighth); over: metres above the water as it stands
  // NOW over which they thin (inside the gate, as a crest floods it, two and a half times this)
  foot: { amount: 1, film: 0.075, breath: 0.4, thin: 0.66, over: 0.45 },
  // the weed's zone, under the crust's band: its upper line (m above still water), what wet rock is multiplied by there, and how much of it (0: the crust on everything under the tide line, as first laid);
  // crust: metres one repeat of the tide painting covers on the kit's own rock (tile.tide above is still what the monument's copy of this paint reads)
  weed: { top: 0.5, tint: '#a9b6b2', amount: 1, crust: 0.7 },
};
// (kit, sixth holder: added to PLAN.kit; nothing above is changed)
// The sea's light as the kit's rock takes it near the eye (kit.js, "THE LIGHT'S OWN TEXT, CHANGED FOR THE KIT'S ROCK"; amount 0 leaves the light as light.js gives it).
// big: metres from the eye between which the wash's large dabs come in (none nearer: they are as large as a stump's face); mid: the same for the small commas'
// thinning right under the eye; line: metres over the water as it stands NOW within which the commas keep to the waterline near the eye; above: the share of them
// left higher up; under: metres under the surface below which nothing of the sea's light lies on rock; wander: how far a draining thread jogs (1 = a finger or two)
PLAN.kit.near = { amount: 1, big: [12, 30], mid: [1.5, 4.5], line: 0.4, above: 0.2, under: 0.18, wander: 1 };

// ------------------------------------------------------------------------------------------------ the monument (stage 2a)
// The lighthouse and the skerry as modelled (src/realms/sea/heroes.js; docs/build/sea/2-monument.md). Nothing above
// is changed by these. The door: the kept lamp keeps the plan's place (lamp.at, which lies 40.5 degrees up-route of
// channel-ward from the tower's axis: the page's 40); the DOOR stands 0.70 m down-route of it, at 32.5 degrees, so
// that the wrought bracket is nailed to the doorcase's pier and the doorway is clear.
PLAN.monument = {
  // how the granite stands in the sea's light (shared.sea.extend: rest, top, run, pale); how much of its paint is carried into
  // added light (show); and the kept lamp on it (lamp: its light beyond its own pool, the pool's radius in metres, its gain inside the doorway)
  // streak, salt: how strong the broad streaks down the stone, and the fine runs of salt and wet (both laid by the material)
  // glow: behind the rain front, the colour of the lit sea's glow on the stone at its foot; high: what is left of it higher up, and the
  // heights (m) between which it dies; sheen: how strong the lit water's sheen on wet stone seen aslant (on the side turned to the open
  // sea), and what is left of it at the top
  // max: the palest colours the model is painted in, to 5 m (the doorcase, the crust) and above (a ceiling on its paint: stoneExt in heroes.js says why)
  // rough: how much of the kit's painting of rough rock lies on the bole's quarried faces (its light and dark only), and metres to a repeat
  // cap: a ceiling on the night's light on the stone above 15 m (twice the palest it is ever lit up there: stoneExt in heroes.js says why)
  // turn: the form turned: what the side turned away from the open sea keeps of its light, and what the side turned to it takes (heroes.js uses it from the fourth look on; without it 1, 1)
  tower: { rest: 0.42, top: 0.6, run: 2.0, pale: 0.55, show: 0.8, max: ['#7c88aa', '#38435f'], cap: '#3e5478', lamp: [0.2, 1.6, 1.4], streak: 0.5, salt: 0.45, glow: '#1b6c86', high: [0.12, 1.0, 12], sheen: [3.2, 0.2], rough: [0.6, 2.2], turn: [0.54, 1.44], under: ['#46c8c4', 1.3, 22, 0.16], dim: 0.6 },      // (under: the light under every course when the sea is lit: its colour, how strong, the height by which it has died, how much of it the surf at the foot gives at rest; dim: what is left of the wall's own light at 20 m then. Fifth look, heroes.js stoneExt)
  // the same for the copper and the broad iron above the gallery (the cupola, the murette). They take little of the sky: against the cloud the cupola is a dark cap,
  // and a cap that took the sky's own slate on its top was the sky's colour and could not be seen
  top: { rest: 0.34, top: 0.7, run: 2.0, pale: 0.28, show: 1.0, max: ['#4c7478', '#4c7478'], cap: '#3e5478', lamp: [0.2, 1.6, 1.4], streak: 0.3, salt: 0, glow: '#0c3446', high: [0.3, 2, 20], sheen: [1.2, 0.6], turn: [0.7, 1.25] },
  iron: { rest: 0.4, top: 0.8, pale: 0.22 },                             // the thin iron up there (railing, glazing bars, vane): darker still, a lattice against the glass
  lensBody: { rest: 0.36, top: 1, run: 0, pale: 0.12 },                   // the lens's glass at rest, before its own terms (lens, below)
  // the same for the skerry's basalt. It is DARK WET ROCK a step under its sky (pale: at 1 every top was a frosted lid, paler than the sky behind it, and behind the rain
  // front the whole rock was pale ice). topDark: the share of the night's light a top keeps; topWet: what a wet top keeps besides (a sheen here and there); topShare: the
  // share of tops that are not wet; carry: the most that pale paint may lift the night's light; crustTop, crustSide: how much of the tide zone's crust lies on tops and on
  // faces; seam: how much of the kit's DRAWN drum joints (the colonnade's are modelled)
  skerry: { rest: 0.42, top: 0.8, run: 2.0, pale: 0.62, show: 0.8, lamp: [0.3, 2.2, 1.0], streak: 0.5, topDark: 0.32, topWet: 0.6, topShare: 0.75, carry: 2.2, crustTop: 0.3, crustSide: 0.75, seam: 1.6, drums: 2.2 },      // (fifth look, 8 November: the model's columns are born in their own tones with dark joints and pale worn arrises, so paint may lift the light further (carry); their drums' joints are the paint's again, a little stronger than the kit's own (seam), and each drum a shade of its own (drums: how much more than the kit's); tops a shade darker (topDark): at 0.42 the ledge's tops were paler than the sky)
  // the water in the skerry's pools and dished tops: how dark it lies at rest (rest, and how much of the sky's slate it takes: pale); reach: how much lower than a
  // crest a pool may lie and still be filled by its run-up (a share of its own height: 0.85 fills only pools the crest itself tops); body: the soft light under its marks; gain
  pools: { rest: 0.7, pale: 0.3, reach: 0.55, body: 0.16, gain: 1.0 },
  // the lantern's glass: how much of itself a pane shows square-on (the rest is seen through), how much of the sky's slate (rock.sky) lies on it, the colour of the
  // lens's light in it when the lens is full, and how much of that a pane holds: everywhere, where the eye looks through it at the lens, and on its salt
  // near: what is left of the sky on a pane the eye looks through squarely on its own side of the lantern (clear glass: the lens is seen through it); far: the dim slate
  // of a pane on the far side, seen from within (the lens stands dark against it)
  panes: { hold: 0.12, sky: 0.7, glow: '#2a7f9c', haze: [0.1, 0.55, 0.5], near: 0.22, far: 0.75 },
  // the lens: seconds a turn; how bright a glint at rest, and seconds from one to the next; how bright when full; how much of the sky's slate its upward faces give
  // back at rest; how strongly a prism square to the eye burns when it is full
  lens: { turn: 28, glint: 5.5, every: 6.5, gain: 1.5, sky: 0.3, flash: 1.0 },      // (every: a glint lasts a little under a quarter of this)
  vane: { from: -18, veer: 9, shiver: 4 },                                // degrees: the azimuth the weather comes from (the vane's head points into it; 0 = channel-ward, + = up-route), how far it veers, how far it shivers
  shutter: { swing: 25, period: 5 },                                      // the fourth window's shutter: degrees, seconds
  door: { turn: 32.5 },                                                   // the door as built (tower.door.turn above is the lamp's line)
  columns: 0,                                                             // far column units grown on the skerry (the page: 240; skerry.json holds 31 sites for them, in clumps on the middle's tallest columns). Fifth look, 8 November: NONE are grown. The model's own pipes are slender now and stand on every hummock; among them the kit's unit read as pale leaning slabs in the kit's paint (sea_m6_j_slip2_crop.png) and as a town's round towers in the skerry's own (sea_m6_l_slip_crop.png). Set a number here to grow that many (heroes.js growColumns: the kit's geometry, the skerry's paint)
};

// ------------------------------------------------------------------------------------------------ the other hero pieces (stage 2b)
// The gate's vault and crown, the wreck, the bell buoy and the rowing boat as modelled (src/realms/sea/heroes_b.js;
// docs/build/sea/2-heroes.md). Nothing above is changed by these. Try any of them in the address:
// &tune=p.heroesB.vault.wash:1.6
PLAN.heroesB = {
  // the gate's crown: runs: how strongly the pale run-off under its ledges and perches is drawn (0 none)
  crown: { runs: 0.8, mirror: 110 },                       // mirror: metres within which the crown is in the water's mirror
  // the vault's own light. mouth: how much of the sky's slate comes in at the two mouths at rest; wash: the marks of light a crest
  // throws on the hanging ends; stain: the flat stain under them; threads: what drains down the ends after it; breath: how much of
  // a crest's light the roof takes while the boat is NOT under it (the "opening of faint light that breathes", seen from the reveal)
  // mirror: metres within which the roof is in the water's mirror (from 56 m, postcard 4, taking it out changes no pixel by more than
  // a tenth); far: metres beyond which its far copy stands in for it (the same columns, plain ends, a third of the triangles)
  // (fourth holder: the light is flat tones first, `stain`, and marks over them, `wash`; sum: how much stronger the tones stand
  // where the marks cannot be told apart, so that the opening is drawn by its own light from the reveal; lit: how much the roof
  // holds of the sea that burns at both mouths behind the rain front; side: how much the side of a pipe takes near its tip)
  // (fifth holder: the tones are ember and never violet, which is only what the light turns to as it drains (age: how far); the side
  // of a pipe takes the light near its own tip and from where the crest is; wet: how readily an end that faces down gives back the
  // marks of light on the water it looks at; lit is low: behind the rain front the roof stays dark over a burning sea, and the crests carry it)
  // (sixth holder: the hanging ENDS are broken rock, not plain faces. endTile: metres one repeat of the painting of rough fractured
  // basalt covers on them (four or five facets to an end; at 2 m, two or three, the near ends wore a leopard's coat under a crest); endPaint: how much of it is in their paint; endSteep: how steeply that paint
  // is carried into the light; facet: how unevenly one end's facets take a crest's light (0: every end one flat plate, a cut gem);
  // facetRest: the same in the night that comes in at the mouths; sheen: the wet break's soft gleam on the facets it left turned to
  // the water (it replaced the mirrored marks, which were shards of foil); sheenFrom, sheenTo: how pale a facet must be to take it;
  // sheenVary: how much it differs from one column to the next; sheenAqua: how much of it is aqua while the crest is new)
  vault: { mouth: 0.42, wash: 1.0, stain: 1.0, threads: 0.4, breath: 0.5, sum: 0.9, lit: 0.2, dark: 0.6, side: 0.9, wet: 2.4, age: 0.7, mirror: 45, far: 110,      // dark: how much of the lit cloud's fill is kept OFF the roof behind the rain front
    // (seventh holder: the ends are broken rock in the MODEL now (gate_crown.py, tray: sockets, balls, breaks with a step, knocked-off
    // corners), so the painting laid on them and the facets read from it are turned far down (endPaint was 0.55, endSteep 0.6, facet 0.8,
    // facetRest 0.15: on real breaks they were a camouflage); facetLean: how much more of a crest an end's facet takes that leans toward where
    // the crest is, and how much less one that leans away (the light crosses each end as the crest passes); facetN: 0 the model's own shading
    // normals (a bowl one curve, a break's riser cut), 1 every triangle its own plane (cut gems: kept as a switch for looking);
    // sheenFrom, sheenTo: the gleam is now read from the form: how high the swell must stand (-1..1 of its greatest) at the place on
    // the water that the eye's ray, turned back by the wet surface, meets (they were thresholds of the painting's paleness: 1.12, 1.6))
    endTile: 1.5, endPaint: 0.15, endSteep: 0.3, facet: 0.1, facetRest: 0.05, sheen: 0.35, sheenFrom: 0.55, sheenTo: 0.9, sheenVary: 0.9, sheenAqua: 0.6,
    facetLean: 1.4, facetN: 0 },
  // the wreck: how much of her timber's colour she keeps unlit; the most that paler paint may lift it (she must stay a silhouette);
  // the night's cast over her (oak's plum reads as warm brown beside this sea's blue); deep: metres below the troughs over which
  // all light on her and on her bed dies (without it the bed stands in the lit sea as a glowing slab with a ruled outline)
  // breath: the light each swell lays on what looks into her hull as it runs through her (0 none)
  // (fifth holder) glaze: how much her wood and weed keep of the rock's flat breath of each wash (all of it was a pane of teal glass
  // over her lower half); run: metres the wash's marks climb her; weed: how much of its own green her wrack keeps
  // (sixth holder) bedPale: how much of the sky the column tops she lies on take (1: level wet tops stood in every trough as pale paving)
  // (seventh holder) wash: how much her wood and weed keep of the sea's own marks at her waterline (all of them, dense for half a metre, were
  // flat pale blocks between her ribs from the sound and took the feet of her frames); run is a hand now (was 0.45)
  wreck: { rest: 0.42, lift: 1.15, cast: '#c3cbee', deep: 1.0, breath: 1.0, glaze: 0.08, run: 0.16, weed: 0.35, bedPale: 0.4, wash: 0.22 },
  // the bell buoy: the same for its iron and bronze, and how much of their own hue they keep (rust read as brick red, bronze as bottle green)
  // list: degrees its head hangs down-swell of its mooring (the weather hammer then strikes once a swell, the lee one only in the
  // great ones); vmin: the speed, radians a second, under which a hammer only comes to rest on the lip
  buoy: { rest: 0.5, cast: '#b2bdea', sat: 0.38, list: 6, vmin: 0.12 },
  // the rowing boat: unlit, her paint stands at the page's slate; raise: metres above the sea she is taken to stand, so that none of
  // the sea's flecks are laid on her (she is hauled out); lamp: the kept lamp's touch on what she turns toward it, at 10 m
  rowboat: { rest: 0.27, pale: 1.0, raise: 2.5, lamp: 0.42 },
};

// ------------------------------------------------------------------------------------------------ light and water (stage 2)
// FOR EVERYONE WHO MODELS: the swell is now 1.4 m (water.swell below; the director asked for a sea that heaves), so the
// water stands anywhere from -0.75 m to +0.75 m of still water. Model what meets the water from 1.5 m under it; float
// things on ctx.water.heightAt. And the tone curve's toe is out (look.grade.toe 1): dark colours are shown as typed.
// More in docs/build/sea/2-light.md.
// The light numbers as they stand after stage 2 (docs/build/sea/2-light.md), laid over the layout's numbers above.
// LIGHT is what everybody gets. LIGHT_NEXT is what is being worked on: it is laid on top only with &next=1 in the
// address, together with set.next.js and light.next.js (src/realms/sea.js), and is moved into LIGHT when it is right.
const merge = (a, b) => { for (const k in b) { const v = b[k]; if (v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) merge(a[k], v); else a[k] = v; } return a; };
/*LIVE-BEGIN*/
const LIGHT = {
  look: {
    rest: {
      background: '#0A0E1C', fog: { color: '#141A2E', density: 0.0075 }, exposure: 1.0,
      bloom: { strength: 0.4, radius: 0.15, threshold: 0.95 },
      grade: { tint: '#F4F6FF', saturation: 1.0, contrast: 1.0, lift: '#04050B', vignette: 0.3, grain: 0.024, toe: 1 },
      light: { key: [0.15, 1, 0.1], keyColor: '#3FE0D0', gain: 0.12, shadow: '#0C0F24', lit: '#0E5E6E', sky: '#161C30', ground: '#070B16', lanternRadius: 6 },
      // the rider's own boat in this light (the remodelled boat, docs/life/boat.md: it takes the area's light by itself). Its own colours as its
      // family paints them (the overrides chosen for the first boat are dropped), and one tone over all of it: worn wood sunk toward the night and
      // cooled, so that in a cold picture the lantern and the kept lamp are the only warm things and the boat is never the lightest thing in the frame
      boat: { inside: '#544a3f', rib: '#74644e', rim: '#80786c', floor: '#6c5f4c', thwart: '#766752', oar: '#69645b', rope: '#a39474', tone: '#a6aecb' },
    },
    dark: { exposure: 0.5 },
    cave: { fog: '#0B0F1D', from: 236, to: 249 },      // inside the cleft: the air's colour, and the metres along over which it takes the place of the sea's
    air: { background: '#101A30', fog: { color: '#223A5E', density: 0.0048 } },
    lit: {
      background: '#101A30', fog: { color: '#24466C', density: 0.0048 }, exposure: 1.0,
      bloom: { strength: 0.35, radius: 0.15, threshold: 1.0 },
      grade: { saturation: 1.0, contrast: 1.0, vignette: 0.26 },
      light: { gain: 1.25, shadow: '#1B1750', lit: '#8FF2E4', sky: '#1B2450', ground: '#1C6F80' },
    },
  },
  sky: {
    rest: { top: '#04060D', mid: '#080D1C', horizon: '#262F4C', a: 2.1, b: 0 },
    lit: { top: '#05070F', mid: '#0A1020', horizon: '#16233C', a: 1.25, b: 1.5 },
    grey: 0.6, hueRest: [0.72, 0.95, 1.5], hueLit: [0.82, 0.86, 1.6], glowTint: [1.8, 0.78, 1.1], haze: 0.3,
    gamma: 1.25, underlightFrom: 19, underlightHigh: 0.15, soften: 14,
    softenLit: 3,      // behind the front a little of that softening stays (sharp, the painting's strokes are white scratches over the whole low sky); and the underlight stands higher (from 19 degrees: the low sky stays dark, so that the sea is the brightest thing in the picture)
    hueHigh: [1.02, 0.9, 1.5], hueAt: [0.02, 0.09],      // the ceiling's lights lean to violet: their hue, and the brightness (of the painting) between which the hue turns
  },
  // the air (air.js). Rain round the eye: how many streaks, the box they fill, m/s, degrees of slant, their lengths, how
  // strong, and the height over which the sea's light on them falls to a third
  rainAir: { count: 20000, box: [40, 15, 40], speed: 9, slant: 12, len: [0.5, 0.9], opacity: 0.9, reach: 3.2 },
  // far rain: veils along the front's line. out: metres upwind of the trigger point; side: metres along the line; drift m/s
  curtains: { high: 120, color: '#2E3458', fog: 0.7, drift: 1,
    list: [{ out: 236, side: -70, len: 360, opacity: 0.28 }, { out: 304, side: 130, len: 430, opacity: 0.24 }, { out: 382, side: -160, len: 500, opacity: 0.24 }, { out: 468, side: 50, len: 460, opacity: 0.2 }],
    wall: { len: 900, high: 150, side: -40, opacity: 0.5 } },
  // the hull's own light: written into the trace from this speed, fully by that one (m/s); half width of its lane; how new the light is (0.6 = new)
  hullLight: { from: 0.25, full: 1.2, radius: 2.3, strength: 0.6 },
  lamp: { strokeCap: [2.8, 6.5, 15], strokeDeep: [0.7, 0.45] },      // the most the lamp's mirror-only halo may shine: at rest; on the lit sea from near by; on the lit sea from 45 m and more (the lit sea's mirror is a third of the resting one's: the stroke must survive it). And what is left of its green and blue on the lit sea (it lies under added aqua)
  // far headlands: how far the air takes them, their tint, and at which ends each comes down to the sea (shares of its length; 0 = the painting ends by itself there)
  far: { fog: 0.8, tint: '#8f96b8', strips: [
    { r: 470, high: 30, uv: [0, 0.792, 1, 0.922], ends: [0.2, 0] },
    { r: 380, high: 40, uv: [0, 0.458, 1, 0.722], ends: [0.18, 0] },
    { r: 300, high: 36, uv: [0, 0.028, 1, 0.372], ends: [0.16, 0.2] },
  ] },
  // how rock stands in this light (light.js, the seaRock material)
  // sky / skyLit: what the sky gives tops and edges; fillLow: the glow that climbs from the lit sea and dies over rim[2] metres; fillHigh: what the lit cloud leaves on the mass above
  // rim: [sky on a face seen edge-on, how much more sky a wet face gives back, metres the lit sea's glow climbs, gain of all light at a foot]
  // cast, local: what local colour is multiplied by at rest (the basalt's plum), and how much of it shows
  rock: { sky: '#34406A', skyLit: '#34406A', fillLow: '#0E6A7E', fillHigh: '#0F2746', rim: [0.16, 1.15, 4.8, 1.0], cast: '#ffffff', local: 1.3,
    // inland: metres over which the sea's light dies going inland on the low land (the skerry); cave: inside the cleft, how much of the sky's light is lost, and how much further the surge's light runs up its walls
    inland: 3.6, cave: [0.55, 1.2] },
  // the sheet's marks: repeats per metre of the dabs (fine, coarse, patches) and of the stipple
  seaLight: { wake: 1.0, rain: 0.84, fleck: [0.37, 0.16, 0.047, 0.75] },
  water: {
    deep: '#050A18', shallow: '#0A2230',
    reflectFloor: 0.03, reflectivity: 0.9, fresnel: 6, roughness: 0.28, streak: 1.6, waveHeight: 0.8, mirrorDarken: 0.05,
    swell: 1.4, swellLength: 30, swellPeriod: 7.5,
    rippleGlow: '#8FEEDF', rippleGlowStrength: 0.08,
    // light from touch: the trace holds what is written into it for 45 s (written at 0.6, gone after 27 s: a road 45 m long at the current's pace); and the water's own
    // wake feeds it next to nothing: the hull writes its own lane (hullLight below, air.js), so that the light's age is the time since the hull passed. (Fed by the wake's
    // ripples, which run on for seconds, the whole road stayed new: one aqua from stern to horizon)
    touch: { amount: 0.002, color: '#3FE0D0', hold: 45, fleck: 1, wake: 0.06, wakeSlow: 0.12 },
  },
  // the water behind the rain front: a deeper, bluer body under the light, and a mirror that leans to teal (the key painting's navy, never grey)
  // (the mirror is weak behind the front: the lit cloud would turn the whole sea one mid blue; the key painting's sea is navy between its lights)
  waterLit: { deep: '#04202E', shallow: '#07303E', reflectionTint: '#55B5AC', mirrorSaturate: 0.1, reflectivity: 0.45, mirrorDarken: 0.3 },
  waterAir: { deep: '#06182C', shallow: '#0A2C40' },
  // the sky on the backs of the swell (the sheet draws it): its colour, how much at rest and behind the front
  // (meet: how squarely the eye may meet a back and still have the sky from it, about radians; far: how much less of it far off, where the water's own mirror has the low sky already)
  // (aslant: how much of it a back gives that falls away from the eye; high: how much a back gives by standing high, whichever way the eye looks)
  seaSheen: { color: '#2F3B60', rest: 0.8, lit: 0.25, meet: 0.26, far: 0.7, aslant: 0.45, high: 0.9 },
  // the short sea that rides the swell, drawn in light only (waves 5.5 to 13 m long): its share in where light gathers and the long swell's share, its height in metres (for the sheen)
  seaChop: { share: 0.5, swell: 0.8, high: 0.3 },
  // the ridge lines of the swell (the line along each back where the water stands highest): half their width in metres; how strongly the sky draws them at rest; how strongly the sea's light does behind the front
  seaRidge: { width: 0.16, rest: 0.3, lit: 1.0 },
  // the lit sea too far off to tell marks apart, drawn as level dashes: how bright, how many, and how bright the band they close into under the horizon
  seaGlint: { bright: 1.35, many: 1.8, band: 1.1 },
  // the air at rest: low mist (set.js; kit.mist). Its colour (a step lighter than rock, a step darker than the low sky), its drift in m/s, and where it lies:
  // metres along the route from .. to, cards, metres either side of the centre line, heights of their centres, metres across, how dense one card
  mist: { color: '#28324F', drift: 0.2, list: [
    { from: 82, to: 110, count: 12, spread: 16, y: [0.3, 2.2], size: 15, opacity: 0.26, seed: 5 },      // in the gate
    { from: 228, to: 256, count: 10, spread: 9, y: [0.3, 2.0], size: 12, opacity: 0.24, seed: 7 },       // in the cleft
    { from: 112, to: 200, count: 26, spread: 85, y: [0.5, 3.5], size: 30, opacity: 0.14, seed: 9 },     // low over the sound and the open sea
    { from: 30, to: 84, count: 14, spread: 46, y: [0.4, 3.0], size: 24, opacity: 0.12, seed: 11 },      // among the pipes
  ] },
  // splash crowns (air.js): where a drop strikes near the boat. How tall the tallest (m), the share of its ring's life it stands for, gain, and how far from the eye they are drawn (m)
  crowns: { tall: 0.16, life: 0.3, gain: 1.0, reach: 14 },
  // spray thrown where a crest strikes a foot (light.js, in sea.surf): metres of waterline to a place, the most places one call may have, flecks to a place,
  // metres a plume may stand, m/s a fleck is thrown at most, gravity (gentler than the world's: the spray hangs), how far the weather carries it (m/s), gain
  spray: { every: 4.5, max: 150, flecks: 40, high: 4.2, throw: 8.5, gravity: 7.5, wind: 0.9, gain: 1.0 },
};
/*LIVE-END*/
/*NEXT-BEGIN*/
const LIGHT_NEXT = {
  look: {
    rest: {
      background: '#0A0E1C', fog: { color: '#141A2E', density: 0.0075 }, exposure: 1.0,
      bloom: { strength: 0.4, radius: 0.15, threshold: 0.95 },
      grade: { tint: '#F4F6FF', saturation: 1.0, contrast: 1.0, lift: '#04050B', vignette: 0.3, grain: 0.024, toe: 1 },
      light: { key: [0.15, 1, 0.1], keyColor: '#3FE0D0', gain: 0.12, shadow: '#0C0F24', lit: '#0E5E6E', sky: '#161C30', ground: '#070B16', lanternRadius: 6 },
      // the rider's own boat in this light (the remodelled boat, docs/life/boat.md: it takes the area's light by itself). Its own colours as its
      // family paints them (the overrides chosen for the first boat are dropped), and one tone over all of it: worn wood sunk toward the night and
      // cooled, so that in a cold picture the lantern and the kept lamp are the only warm things and the boat is never the lightest thing in the frame
      boat: { inside: '#544a3f', rib: '#74644e', rim: '#80786c', floor: '#6c5f4c', thwart: '#766752', oar: '#69645b', rope: '#a39474', tone: '#a6aecb' },
    },
    dark: { exposure: 0.5 },
    cave: { fog: '#0B0F1D', from: 236, to: 249 },      // inside the cleft: the air's colour, and the metres along over which it takes the place of the sea's
    air: { background: '#101A30', fog: { color: '#223A5E', density: 0.0048 } },
    lit: {
      background: '#101A30', fog: { color: '#24466C', density: 0.0048 }, exposure: 1.0,
      bloom: { strength: 0.35, radius: 0.15, threshold: 1.0 },
      grade: { saturation: 1.0, contrast: 1.0, vignette: 0.26 },
      light: { gain: 1.25, shadow: '#1B1750', lit: '#8FF2E4', sky: '#1B2450', ground: '#1C6F80' },
    },
  },
  sky: {
    rest: { top: '#04060D', mid: '#080D1C', horizon: '#262F4C', a: 2.1, b: 0 },
    lit: { top: '#05070F', mid: '#0A1020', horizon: '#16233C', a: 1.25, b: 1.5 },
    grey: 0.6, hueRest: [0.72, 0.95, 1.5], hueLit: [0.82, 0.86, 1.6], glowTint: [1.8, 0.78, 1.1], haze: 0.3,
    gamma: 1.25, underlightFrom: 19, underlightHigh: 0.15, soften: 14,
    softenLit: 3,      // behind the front a little of that softening stays (sharp, the painting's strokes are white scratches over the whole low sky); and the underlight stands higher (from 19 degrees: the low sky stays dark, so that the sea is the brightest thing in the picture)
    hueHigh: [1.02, 0.9, 1.5], hueAt: [0.02, 0.09],      // the ceiling's lights lean to violet: their hue, and the brightness (of the painting) between which the hue turns
  },
  // the air (air.js). Rain round the eye: how many streaks, the box they fill, m/s, degrees of slant, their lengths, how
  // strong, and the height over which the sea's light on them falls to a third
  rainAir: { count: 20000, box: [40, 15, 40], speed: 9, slant: 12, len: [0.5, 0.9], opacity: 0.9, reach: 3.2 },
  // far rain: veils along the front's line. out: metres upwind of the trigger point; side: metres along the line; drift m/s
  curtains: { high: 120, color: '#2E3458', fog: 0.7, drift: 1,
    list: [{ out: 236, side: -70, len: 360, opacity: 0.28 }, { out: 304, side: 130, len: 430, opacity: 0.24 }, { out: 382, side: -160, len: 500, opacity: 0.24 }, { out: 468, side: 50, len: 460, opacity: 0.2 }],
    wall: { len: 900, high: 150, side: -40, opacity: 0.5 } },
  // the hull's own light: written into the trace from this speed, fully by that one (m/s); half width of its lane; how new the light is (0.6 = new)
  hullLight: { from: 0.25, full: 1.2, radius: 2.3, strength: 0.6 },
  lamp: { strokeCap: [2.8, 6.5, 15], strokeDeep: [0.7, 0.45] },      // the most the lamp's mirror-only halo may shine: at rest; on the lit sea from near by; on the lit sea from 45 m and more (the lit sea's mirror is a third of the resting one's: the stroke must survive it). And what is left of its green and blue on the lit sea (it lies under added aqua)
  // far headlands: how far the air takes them, their tint, and at which ends each comes down to the sea (shares of its length; 0 = the painting ends by itself there)
  far: { fog: 0.8, tint: '#8f96b8', strips: [
    { r: 470, high: 30, uv: [0, 0.792, 1, 0.922], ends: [0.2, 0] },
    { r: 380, high: 40, uv: [0, 0.458, 1, 0.722], ends: [0.18, 0] },
    { r: 300, high: 36, uv: [0, 0.028, 1, 0.372], ends: [0.16, 0.2] },
  ] },
  // how rock stands in this light (light.js, the seaRock material)
  // sky / skyLit: what the sky gives tops and edges; fillLow: the glow that climbs from the lit sea and dies over rim[2] metres; fillHigh: what the lit cloud leaves on the mass above
  // rim: [sky on a face seen edge-on, how much more sky a wet face gives back, metres the lit sea's glow climbs, gain of all light at a foot]
  // cast, local: what local colour is multiplied by at rest (the basalt's plum), and how much of it shows
  rock: { sky: '#34406A', skyLit: '#34406A', fillLow: '#0E6A7E', fillHigh: '#0F2746', rim: [0.16, 1.15, 4.8, 1.0], cast: '#ffffff', local: 1.3,
    // inland: metres over which the sea's light dies going inland on the low land (the skerry); cave: inside the cleft, how much of the sky's light is lost, and how much further the surge's light runs up its walls
    inland: 3.6, cave: [0.55, 1.2] },
  // the sheet's marks: repeats per metre of the dabs (fine, coarse, patches) and of the stipple
  seaLight: { wake: 1.0, rain: 0.84, fleck: [0.37, 0.16, 0.047, 0.75] },
  water: {
    deep: '#050A18', shallow: '#0A2230',
    reflectFloor: 0.03, reflectivity: 0.9, fresnel: 6, roughness: 0.28, streak: 1.6, waveHeight: 0.8, mirrorDarken: 0.05,
    swell: 1.4, swellLength: 30, swellPeriod: 7.5,
    rippleGlow: '#8FEEDF', rippleGlowStrength: 0.08,
    // light from touch: the trace holds what is written into it for 45 s (written at 0.6, gone after 27 s: a road 45 m long at the current's pace); and the water's own
    // wake feeds it next to nothing: the hull writes its own lane (hullLight below, air.js), so that the light's age is the time since the hull passed. (Fed by the wake's
    // ripples, which run on for seconds, the whole road stayed new: one aqua from stern to horizon)
    touch: { amount: 0.002, color: '#3FE0D0', hold: 45, fleck: 1, wake: 0.06, wakeSlow: 0.12 },
  },
  // the water behind the rain front: a deeper, bluer body under the light, and a mirror that leans to teal (the key painting's navy, never grey)
  // (the mirror is weak behind the front: the lit cloud would turn the whole sea one mid blue; the key painting's sea is navy between its lights)
  waterLit: { deep: '#04202E', shallow: '#07303E', reflectionTint: '#55B5AC', mirrorSaturate: 0.1, reflectivity: 0.45, mirrorDarken: 0.3 },
  waterAir: { deep: '#06182C', shallow: '#0A2C40' },
  // the sky on the backs of the swell (the sheet draws it): its colour, how much at rest and behind the front
  // (meet: how squarely the eye may meet a back and still have the sky from it, about radians; far: how much less of it far off, where the water's own mirror has the low sky already)
  // (aslant: how much of it a back gives that falls away from the eye; high: how much a back gives by standing high, whichever way the eye looks)
  seaSheen: { color: '#2F3B60', rest: 0.8, lit: 0.25, meet: 0.26, far: 0.7, aslant: 0.45, high: 0.9 },
  // the short sea that rides the swell, drawn in light only (waves 5.5 to 13 m long): its share in where light gathers and the long swell's share, its height in metres (for the sheen)
  seaChop: { share: 0.5, swell: 0.8, high: 0.3 },
  // the ridge lines of the swell (the line along each back where the water stands highest): half their width in metres; how strongly the sky draws them at rest; how strongly the sea's light does behind the front
  seaRidge: { width: 0.16, rest: 0.3, lit: 1.0 },
  // the lit sea too far off to tell marks apart, drawn as level dashes: how bright, how many, and how bright the band they close into under the horizon
  seaGlint: { bright: 1.35, many: 1.8, band: 1.1 },
  // the air at rest: low mist (set.js; kit.mist). Its colour (a step lighter than rock, a step darker than the low sky), its drift in m/s, and where it lies:
  // metres along the route from .. to, cards, metres either side of the centre line, heights of their centres, metres across, how dense one card
  mist: { color: '#28324F', drift: 0.2, list: [
    { from: 82, to: 110, count: 12, spread: 16, y: [0.3, 2.2], size: 15, opacity: 0.26, seed: 5 },      // in the gate
    { from: 228, to: 256, count: 10, spread: 9, y: [0.3, 2.0], size: 12, opacity: 0.24, seed: 7 },       // in the cleft
    { from: 112, to: 200, count: 26, spread: 85, y: [0.5, 3.5], size: 30, opacity: 0.14, seed: 9 },     // low over the sound and the open sea
    { from: 30, to: 84, count: 14, spread: 46, y: [0.4, 3.0], size: 24, opacity: 0.12, seed: 11 },      // among the pipes
  ] },
  // splash crowns (air.js): where a drop strikes near the boat. How tall the tallest (m), the share of its ring's life it stands for, gain, and how far from the eye they are drawn (m)
  crowns: { tall: 0.16, life: 0.3, gain: 1.0, reach: 14 },
  // spray thrown where a crest strikes a foot (light.js, in sea.surf): metres of waterline to a place, the most places one call may have, flecks to a place,
  // metres a plume may stand, m/s a fleck is thrown at most, gravity (gentler than the world's: the spray hangs), how far the weather carries it (m/s), gain
  spray: { every: 4.5, max: 150, flecks: 40, high: 4.2, throw: 8.5, gravity: 7.5, wind: 0.9, gain: 1.0 },
};
/*NEXT-END*/
merge(PLAN, LIGHT);
if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('next')) merge(PLAN, LIGHT_NEXT);

export { smooth, lerp, clamp01 };
