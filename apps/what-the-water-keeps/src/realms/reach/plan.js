// The dyers' reach: the area's numbers, taken from docs/art/reach.md. Plain data and small functions, no three.js.
// Every module of the area reads this, so that a thing is in the same place in all of them.
//
// Reading the numbers. `s` is metres along the path from its first point, `d` metres to the RIGHT of the centre line
// (negative = left): convert with kit.at(s, d, y). "World" is the realm's own x, z: the boat starts at (0, 0) heading
// -z, +x is to its right. The sun stands in the west, which is -z; north is +x (the right bank, the madder side),
// south is -x (the left bank, the indigo side). Heights are above the water (y = 0). `out` is metres OUTSIDE the
// channel's edge (d = side * (halfWidth(s) + out)). The path's centre line IS the composed line: a boat left alone is
// carried along it. Where the page gives a thing in world coordinates (the wheel, the door, the sun road) it is given
// that way here too: those are the numbers to keep if the path is ever changed.
//
// ADD to this file under a heading of your own; change a number that is here only when the page says it is wrong, and
// say so in your log (docs/build/reach/).

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
/** Piecewise linear through [[x, y], ...] (x rising). */
const ramp = (stops, x) => {
  if (x <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) if (x <= stops[i][0]) return lerp(stops[i - 1][1], stops[i][1], (x - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  return stops[stops.length - 1][1];
};

// ------------------------------------------------------------------------------------------------ layout (stage 1)
// The dyer's scale, in the dyer's order, warm first. `color` is the cloth's local colour; `back` what it becomes lit
// from behind and `through` how much of the light it lets through (the dark dyes glow deep, not pale: the key painting's
// violet and indigo); `coin` what the sun's disc looks like through it and how bright; `light` the light of the whole picture
// while that cloth is across the sun, and its strength (page section 2).
// (AS BUILT: `back` for saffron, violet and indigo is not the page's chip. The page's #FFC64A comes out lemon, its #C860E0
// orchid pink and its #4C6AE0 a pure cobalt beside the key painting, whose backlit saffron is orange gold and whose violet
// and indigo are deep and dusty: #FFB040, #9C62C0, #5C6CC4.)
const DYES = [
  { name: 'cream', color: '#F3DDB0', back: '#FFF0C8', through: 1.00, coin: '#FFF1CC', coinGain: 3.5, light: '#FFEFD0', strength: 1.00 },
  { name: 'saffron', color: '#F4A21C', back: '#FFB040', through: 0.90, coin: '#FFC84A', coinGain: 3.5, light: '#FFC25A', strength: 0.95 },
  { name: 'madder', color: '#C4412B', back: '#FF6A3A', through: 0.70, coin: '#FF6A3A', coinGain: 3.0, light: '#FF7A4A', strength: 0.85 },
  { name: 'crimson', color: '#A4133C', back: '#F23A58', through: 0.55, coin: '#FF3E5C', coinGain: 2.6, light: '#FF5A6E', strength: 0.78 },
  { name: 'violet', color: '#6B2F8A', back: '#9C62C0', through: 0.36, coin: '#D660E0', coinGain: 2.2, light: '#C87AE6', strength: 0.68 },
  { name: 'indigo', color: '#26397A', back: '#5C6CC4', through: 0.24, coin: '#7C8CF0', coinGain: 1.6, light: '#8C9CF2', strength: 0.58 },
];
const CREAM = 0, SAFFRON = 1, MADDER = 2, CRIMSON = 3, VIOLET = 4, INDIGO = 5;

export const PLAN = {
  // ---- the route (the page's, unchanged). With the engine's spline it is 260.4 m long and its control points fall at
  // s 0, 28.1, 62.1, 92.2, 122.5, 153.4, 182.4, 208.0, 224.9, 238.5, 249.6, 260.4. The nave is straight on the sun
  // (it bows 0.3 m left at s 81, the spline's doing); the lagoon drifts 24 m right; the last 50 m make a shallow S.
  path: { softEdges: false, points: [
    [0, 0, 9], [0, -28, 10], [0, -62, 10.5], [0, -92, 12], [4, -122, 27], [11, -152, 33], [18.5, -180, 30],
    [24, -205, 9], [31.5, -220, 8.5], [35.5, -233, 8.5], [36.5, -244, 8], [36.5, -254.8, 8],
  ] },
  length: 260.4,
  zones: { narthex: [0, 26], nave: [26, 92], lagoon: [92, 204], door: [204, 212], terraces: [212, 240], loft: [240, 260.4] },
  // the water's pull (page: the nave deserves 28 seconds, not 22). The engine uses `narrow` where the half width is 10 m
  // or less and eases to `wide` by 24 m: the nave and the terraces run at 2.4, the lagoon at 2.0, on which the
  // showstopper's clock ((s - 126) / 2) is built. set.js writes both into the look every frame.
  current: { wide: 2.0, narrow: 2.4 },

  // ---- colours: the page's eight chips, its supporting values, and the local colours stand-ins wear
  colors: {
    cream: '#F3DDB0', saffron: '#F4A21C', madder: '#C4412B', crimson: '#A4133C', violet: '#6B2F8A', indigo: '#26397A', gold: '#FF8A2E', plum: '#2B1A2E',
    waterNear: '#A8685A', waterFar: '#4A2230', haze: '#F2BE90', hazeEnd: '#C97468', timberLit: '#8A5A50', stone: '#B89C94',
    amber: '#FFB45E', freshVat: '#B9B04A', teal: '#3F8A86',
    // local colours (what a thing is painted before the light falls on it). A level surface in this light shows about
    // 1.6 times its local colour in red, so stone that is to READ as the page's vat stone #B89C94 in the light is painted #62504E
    oak: '#5A4250', oakWet: '#2B1A2E', oakNew: '#8A6C5C', shingle: '#4E3846', setts: '#54464E', step: '#584A4E', stoneLocal: '#62504E', silt: '#5A3848', planks: '#4A3038', iron: '#2A1A2E',
    copper: '#8A4A3A', brick: '#7A4450', weed: '#3E5A3A', foamPink: '#E8A8A0', foamBlue: '#8C9AD0', field: '#6A4250', fieldFar: '#7A4E58',
  },
  dyes: DYES,
  dye: { CREAM, SAFFRON, MADDER, CRIMSON, VIOLET, INDIGO },
  // the dyes are zoned along the route in the dyer's order (the rule of three: no view holds more than three besides
  // cream and gold). `main` and `with`: the two dyes of the cloth overhead and beside; `edge`: a third, at the left edge only
  zoning: [
    { from: 0, to: 26, main: CREAM, with: CREAM },
    { from: 26, to: 48, main: CREAM, with: SAFFRON },
    { from: 48, to: 70, main: SAFFRON, with: MADDER },
    { from: 70, to: 92, main: MADDER, with: CRIMSON, edge: VIOLET },
    { from: 92, to: 204, left: INDIGO, right: MADDER, rightWith: CRIMSON, between: VIOLET },
    { from: 204, to: 240, main: VIOLET, with: INDIGO, crown: CRIMSON },
    { from: 240, to: 261, main: INDIGO, with: INDIGO },
  ],

  // ---- the sun (reserved to this realm; page section 2). It stands on world -z, and sinks only with the rider's
  // FURTHEST progress: stop and it stops, go back and it does not rise.
  sun: {
    azimuth: [0, -1],                               // world x, z of the way TO it
    elevation: [[28, 4.6], [240, 0.3]],             // degrees by furthest s (0.0203 degrees a metre)
    size: [[28, 2.6], [240, 3.2]],                  // degrees across by furthest s
    flatten: { below: 1.0, from: 1.8, to: 0.85 },   // its height is 0.85 of its width below 1 degree (eased from 1.8)
    core: '#FFF0C0', coreGain: 4.5,                 // it blooms (page: times 7, which is a white flare 20 degrees wide through the bloom)
    color: [[4.6, '#FFC65A'], [2.0, '#FF8A2E'], [0.3, '#E8432A']],   // its state colour by elevation: the limb, the bare light
    glow: { across: 28, strength: 0.2 },            // a soft additive glow, degrees across (STAGE 2, the light's take-over: 0.35, the page's, veiled the wheel and the whole sunward water in pale gold: the key painting's water toward the sun is its crispest)
    coin: { inner: 1.6, outer: 2.6, second: 0.35 }, // through cloth: full within `inner` degrees of the sun's direction, gone by `outer`; through a second cloth this much; through a third none
    ease: 1.2,                                      // seconds: no change of the light is quicker than a slow breath
    spread: 14,                                     // metres either side of the rider that the dyed light reaches: the bar a cloth's shadow is (the whole nave)
    samples: 5,                                     // rays across the disc that the cover test follows (the centre and four round it)
    floor: 0.58,                                    // the dyed light is never weaker than this
    ambient: 0.34,                                  // what the sky sends through cloth wherever it hangs (times its `back` colour)
    keySoft: 0.35,                                  // the key colour written to the look is the sun's pulled this far toward white (the engine multiplies it by `lit`:
                                                    // unsoftened, a white wall at the end is scarlet #F7260B and violet cloth in the sun is black)
    back: 0.5,                                     // how bright cloth is lit from behind (times 1.53 and the dye's `through`)
  },

  // ---- light: the page's table, start (s 28) and end (s 240), blended by furthest progress over `blend` (set.js).
  // `keyColor` here is the BARE sun's; light.js eases it toward the dye of whatever cloth is across the sun.
  light: {
    blend: [28, 240],
    veil: '#f3ddb0',
    // SECOND LOOK: the sun's core by its height (set.js): cream (plan.sun.core) above `from` degrees, this red-gold below `to`
    sunCore: { low: '#FF4A22', gain: 3.4, from: 3.0, to: 0.8 },
    // AS BUILT, where it differs from the page's table (docs/build/reach/1-layout.md says why, with pictures): the haze is
    // the rose of the painted sky's foot (and of the key painting's low sky, #D26C67), not pale peach (page: fog #F2BE90, background #F0B98C; in that fog everything beyond 60 m is pastel and
    // the picture's mean brightness is 0.52 against the key painting's 0.40); the gold near the sun is the sun's own
    // glow in the haze (light.js), not the fog's colour; the mist on the water is a little thinner (0.16; page 0.25); exposure 0.95 (page 1.0); saturation 0.84 (page 1.12).
    start: {
      background: '#DC6B5E', fog: { color: '#DC6B5E', density: 0.0038 }, exposure: 0.95,
      bloom: { strength: 0.42, radius: 0.8, threshold: 0.9 },
      // (page: saturation 1.12, lift #1C0E1A. With them the stamp's mean saturation is 0.84 against the key painting's 0.56, and
      // every dark is one pure hue with a channel at nothing; the key painting's darks are dusty: a plum lift gives them that)
      // toe 1: the tone curve's toe presses each channel of a dark colour by its own amount, and the darks came out as one pure
      // hue with a channel at nothing; with it they are shown as painted (plum, wine, indigo)
      // STAGE 2 (the darks, measured against the key painting: its near dark is #362431, ours was #4D0227, a channel at nothing):
      // contrast 1.0 (1.05 takes 0.025 off every channel of a dark before the lift is added: the green went under); the lift
      // a dustier, deeper plum (#261A26; was #34182C); saturation 0.94 (0.84: with the darks dusty the mid tones can be richer); and the light that reaches a shaded side less rose: `shadow`, `sky` and
      // `ground` each given back some green and blue (were #3A2140, #C98490, #5A3040)
      grade: { tint: '#FFF4E6', saturation: 1.0, contrast: 1.0, lift: '#261A26', vignette: 0.24, grain: 0.035, toe: 1 },      // (take-over: saturation 1.0, was 0.94)
      paint: 0.65, paintRadius: 4.0, lantern: 0.8,
      // SECOND LOOK (the director's notice of 19:55: the remodelled boat "should sit in the picture as worn wood, never the
      // lightest thing in the frame"). In this light its grey-blue paint and pale boards were the palest thing in every
      // forward view: one tone over all of it, a warm plum-brown, the works' own wet timber.
      boat: { tone: '#A07C74' },
      light: { key: [0, -0.080, 1], keyColor: '#FFC65A', shadow: '#3A2A42', lit: '#FFE6B4', sky: '#A87C8C', ground: '#463040', gain: 1.25, heightFog: 0.16, heightFogOver: 5 },
    },
    end: {
      background: '#B5584C', fog: { color: '#B5584C', density: 0.0048 }, exposure: 0.86,      // page: #C8706A, #C97468, 0.9 (the painted sky at 0.82 of its light)
      bloom: { strength: 0.5 },
      grade: { saturation: 1.0, lift: '#20162A', toe: 1 },      // page: 1.16, #160C20
      lantern: 1.6,
      light: { key: [0, -0.005, 1], keyColor: '#E8432A', shadow: '#2A1E42', lit: '#FFB080', sky: '#786088', ground: '#302438', gain: 1.5, heightFog: 0.22 },      // page: heightFog 0.35; lit #FF9C6E, gain 1.15 (with them timber in the last sun was dark red: the key painting's is a warm brown-rose)
    },
  },
  sky: {
    // (page: start #5B4E8E, #D98C7C, #F6C690, #C98C72; end #3B2F6C, #B8627C, #E87C5C, #8C4C58. The horizon is the fog's
    // colour, or the far water ends in a line; the painted panorama covers the gradient above it)
    start: { top: '#5B4E8E', mid: '#7A5488', horizon: '#DC6B5E', below: '#B4584E' },
    end: { top: '#3B2F6C', mid: '#5E4478', horizon: '#B5584C', below: '#8C4C58' },
    midAt: 0.28,
    // The painted panorama (assets/art/reach/sky.webp, 3303 x 1280) lies over the gradient as a layer of its own (set.js):
    // stretched into -3 to 46 degrees, so that its long bars lie flatter and its violet top stands in the top of a level
    // view (as in the key painting); turned so that its warmest third stands on the sun (`seamless` cuts a strip off the
    // right, which moves the middle 29 degrees to the right). As painted it is all fire: it is laid on at `alpha`, a
    // little greyed (`saturation`) and tinted, so that the gradient's mauve comes through it: [start, end].
    band: [-3, 46], turn: 0.51, fade: [0.10, 0.34], alpha: [0.72, 0.78], saturation: [1.02, 1.0], tint: ['#FFEFF4', '#E8C4CC'], glow: [1, 0.82],      // (take-over: saturation was [0.86, 0.9]: with the darks dusty and the water dyed, the stamp's saturation had fallen to 0.50 against the key's 0.56)
    // STAGE 2: violet into the sky below 40 degrees without a second painting. The painting's clouds are graded by height and
    // by value: from `from` to `to` of the band (7 to 27 degrees) their SHADED parts (below `dark` in value) are multiplied
    // toward `tint`, their lit undersides are left gold: mauve clouds with fire under them, as the key painting has.
    cool: { from: 0.2, to: 0.62, dark: [0.1, 0.45], tint: '#B8A0F0', amount: [0.6, 0.75] },
    // and above the painting (it ends at 46 degrees; overhead the sky was one flat violet): high mare's tails drawn in code
    // (set.js), long wisps along the evening wind: `low` their colour low and toward the sun, `high` overhead: [start, end]
    wisps: { amount: [0.85, 0.7], low: ['#F2A070', '#D8785C'], high: ['#C084A8', '#96649A'] },
    // TAKE-OVER: away from the sun the sky cools and darkens (set.js, in the painting's shader): the painting is multiplied
    // toward `tint` behind the rider, by `amount` [start, end], above `from` to `to` of the painting's band (its foot stays the fog's colour)
    east: { tint: '#8A84C4', amount: [0.7, 0.8], from: 0.08, to: 0.4 },
  },

  // ---- water (page section 7; docs/water.md's recipe for this area). The least mirror-like water of the ride.
  water: {
    // STAGE 2: `deep` is what the rider sees (from an eye 1.1 m up nearly all the water in a picture is the far colour; `shallow`
    // shows only beside the hull). The page's #4A2230 / #2A1430 gave clear water of #843A46 between the figures, where the key
    // painting's is #97546A to #AB535D: as built #783646 / #4A2440. The page's near colours are kept, a little redder.
    start: {
      // SECOND LOOK (measured against the key painting: its middle and far water are a bright rose-orange mirror, #AB535D to
      // #CD5952, ours was #884859 to #9E4B56; its near water is dark with figures). The page's mirror of 0.40 gives a flat
      // floor in which the nave's cloth does not stand: 0.62 at a glance (still the least mirror-like water of the ride;
      // looking down beside the hull it is 0.2), and the mirror is ROSE: `reflectionTint` takes the blue out of what the
      // water mirrors, so that the violet upper sky lies on it as wine-rose and the sun's column as orange. The sun's own
      // path is as long as the page asks only with a wide `spread` (3: its wavelets' lean), and then it needs the strength.
      // FOURTH HOLDER: THE CLEAR WATER IS A MIRROR (0.92 at a glance, 0.2 looking straight down, soft: roughness 0.12). With the
      // water a plain mirror the nave's cloth, the sky's fire and the wheel all stand in it (.shots/reach_l4q_mirror.jpg); at
      // 0.62 / 0.05 / rough 0.17 the clear water was a mauve mist. It is still the least mirror-like water of the ride: more
      // than half of it lies under the dye, which is a matte film now (glaze.film) and hides the mirror where it lies.
      shallow: '#A85C6E', deep: '#6A3850', reflectivity: 0.92, reflectFloor: 0.2, fresnel: 2.4, reflectionTint: '#E4CEE8', roughness: 0.12, streak: 1.7, mirrorDarken: 0.36, mirrorSaturate: 0.16, spareLights: 0.25,      // (the mirror darker, cooler and richer than the world: the key painting's clear water is #97546A under a sky of #C66168: water that is darker than its sky reads as deep; as bright as its sky it is a sheet of glass)      // (take-over: the mirror is no longer made rose (tint was #F8B6A8, deep #7E3049, shallow #B06074): the violet of the upper sky is what makes the dyed water near the boat indigo and not wine)      // (roughness: the page's 0.3 smears the cloth and the wheel out of the water altogether, and leaves the sun's path no glitter)
      waveHeight: 0.22, waveSpeed: 0.7, wind: [0, -1], clarity: 1.0, absorb: '#A0506C', absorbDepth: 0.45, sparkle: 0.35, sparkleColor: '#FFD9A0',      // (take-over: `absorb`: what stands in the water takes the water's colour a hand down: a wall's foot under water was a pale stripe)
      sun: { dir: [0, 0.08, -1], color: '#FFC65A', strength: 5, spread: 3, glitter: 0.6 },      // (take-over: 21 clipped to pale peach, #FCC193 where the key's road is #F28B45)      // (page: strength 1.0, 9 degrees wide. The first holder's 3.6 at spread 1 was a short stroke under the wheel: the road must come down to the bow)
    },
    end: {
      shallow: '#5E3258', deep: '#3E2042', reflectionTint: '#E6A8B4', waveHeight: 0.16,      // (second look: darker: the loft's mouth is night, and its water was the palest thing in postcard 11)
      sun: { dir: [0, 0.01, -1], color: '#E8432A', strength: 21, spread: 2.2, glitter: 0.6 },      // narrowing (page: 1.3)
    },
    // the water in the showstopper's dusk (set.js: when the dyed bar is as wide as the reach and the sun is covered): what its body and its mirror cool toward, and how far
    // FOURTH HOLDER: how far lights keep their own colour in the mirror, by where the boat is [s, amount] (set.js): whole where the kept lamp stands
    spare: { by: [[0, 0.25], [160, 0.25], [176, 0.85], [261, 0.85]] },
    dusk: { deep: '#3A3272', shallow: '#584C8A', tint: '#B4A4E0', amount: 0.85, mirror: 0.6 },      // (fourth holder: bluer, and `mirror`: what the water's mirror falls to in the dusk)
    // The sun's road. The water draws a long column out of whatever bright thing it mirrors: of the sun's own disc (core
    // #FFF0C0 x 4.5) a cream one, 12 degrees wide, which is what clipped pale. So the mirror is given a sun of its own
    // (set.js, `sun in the water`): the bare sun's colour with its green and blue cut by these, times `gain` [start, end];
    // `halo`: a little of it round the disc; `pathGreen`: the same cut for the water's own glitter path.
    // TAKE-OVER: THE MOLTEN ROAD's dabs (set.js): `dab`: metres across and deep of the smallest of three sizes (the others 2.7
    // and 7.3 times that); `lean`: how far a dab's facet leans as it wanders (a slope); `forgive`: how near its lean must be
    // to the one that throws the sun into the eye; `far`, `half`: the fan they are drawn on: metres long, metres half wide at
    // the eye and at its far end; `under`: the soft track under the dabs; `core`, `edge`: a dab's colour at its brightest and
    // at its edge (times the dyed light); `gain`: [start, end]
    // (FOURTH HOLDER: a dab was 0.8 m across and 0.2 m deep: seen from 1.1 m, fifteen metres off, that is a hairline a twentieth of a
    // degree deep, and at 960 px none was drawn at all: the road was the mirrored sun's smooth column and nothing else. A dab is now
    // DEEPER THAN IT IS WIDE on the water, [0.5, 1.1] m, so that the eye's low angle makes a level brushmark of it, four or five times
    // as wide as deep on the screen; the mirrored sun's column under them is half as strong and redder (`road`): the key painting's
    // road is gold dabs on red-orange water, not a pale bar.)
    // `dab`: [metres wide at 8 m off, the depth of a row as a share of its distance (rows are uniform in the logarithm of the distance), how fast a dab widens
    // with distance (a power)]; `bend`: how far rings and the wake push the dabs about; `reach`: metres toward the sun over which the dabs thicken from
    // `nearDens` (by the bow) to all of them; `dens`: how many are lit on the sun's own line; `sigma`: the road's breadth, of `wide` (degrees, [start, end]:
    // the page's 9 narrowing to 5); `least`: metres: it is never narrower than this; `under`: the soft track under the dabs and beyond them;
    // `core`, `edge`: a dab's heart and its rim (times the dyed light's hue); `gain`; `cover`: how much of the water under a dab it hides; `near`:
    // nothing nearer the eye than [0] metres, whole from [1]; `far`, `half`: the fan the road is drawn on
    gold: { dab: [0.9, 0.1, 0.5], bend: 3, reach: 14, nearDens: 0.6, dens: 1, sigma: 0.75, least: 0.32, far: 330, half: [5, 60], under: 0.45, trough: '#C0786A', core: '#FFF0B4', edge: '#FFA24A', gain: [1.25, 1.3], cover: 0.96, wide: [9, 5], near: [2.2, 4.5] },      // (`gain`: times the dyed light, which is about 1 at its brightest channel: a dab is paint, at most a little over white; `cover`: how much of the water under a dab it hides)      // (`near`: nothing nearer the eye than [0] metres, whole from [1]: the bow is not lit by it)      // (`wide`: degrees across, [start, end]: the page's)
    road: { green: 0.3, blue: 0.12, gain: [0.8, 1.6], halo: 0.05, pathGreen: 0.44, dimFrom: 0.5, dimTo: 0.07, dimCurve: 1.5 },      // (`dim..`: the path under a covered sun: from the light's strength `dimFrom` (where it is `dimTo` of itself) up to the bare sun's 1)
    // THE DYE ON THE WATER. (History, in docs/build/reach/2-light.md: the layout rested it on the engine's film; stage 2's
    // first holder drew some 11,000 capsules of pigment into that film; the second look laid a whole marbled sheet into it;
    // the take-over of the second look draws it as a GLAZE over the water, `glaze` below, and their numbers are gone.)
    // The engine's film is no longer what is SEEN: it is kept, at next to no amount, as the carrier of the hull's swirl and of
    // what the cast pours on the water (`stir`: how hard the hull curls it; its colours and its own resting pattern do not show).
    film: { amount: 0.004, a: '#0A1C62', b: '#7A1226', mix: '#4A2470', cover: 0, split: 0, scale: 1000, flow: 0, life: 10000, matte: 0, light: 1, stir: 1.4 },
    // the page's film palette, for the record: thin madder #E88A4A, dense madder #B0242E, thin indigo #5A6AA8, dense indigo #1E2C6E, both thin #9A6A9A, both dense #5A2A80
    // the page's three slow eddies of the lagoon (they are the first three of `glaze.turning`)
    eddies: [{ at: [128, -8], across: 40, seconds: 150 }, { at: [156, 9], across: 22, seconds: 110 }, { at: [176, -3], across: 14, seconds: 90 }],
    // ---- TAKE-OVER OF THE SECOND LOOK (docs/build/reach/2-light.md, "Second look, taken over"): THE DYE AS A GLAZE.
    // The engine's film is a matte, opaque coat: under it the mirror, the sun's road and every reflection are gone, and a
    // figure is a flat patch ("paint on a floor"). The dye is drawn instead by this area as a GLAZE: one sheet on the water
    // plane, drawn after the water, that multiplies what the water shows by what the dye lets through (set.js, "THE GLAZE";
    // its maps: dye.js, glazeMaps). The figure is worked out per pixel: fine bands that lie between the levels of a ground
    // (as the sheet's did), in broad figures, with half tones and clear veins; static swirls; EDDIES THAT TURN; far off,
    // where the bands are finer than a pixel, their mean.
    glaze: {
      // THE COMPOSITION (dye.js, glazeMaps): how rich in dye a place is. Masses [metres across, from, to (of the mixed noise),
      // the masses' share against the figures'] and figures (metres); how much of it along the route; fewer figures down the
      // sun's road in the nave; the SEAM between the banks' dyes (it wanders `wander` of the half width over `size` metres,
      // and group by group by `lot`; within `meet` of it a band is of both; along it, out to `width` of the half width, `open`
      // less of the water carries dye, where the half width is over `narrow`); BESIDE THE COMPOSED LINE the water is composed,
      // as the key painting's is: a lane of figures `at` metres either side of the line, `wide` across, this much richer,
      // and within `road` metres of the line itself this much opener; and POOLS by design: [s, d, metres, how much richer
      // (below 0: opener) the place is]
      // FOURTH HOLDER: THE COMPOSITION IS DECISIVE: a place is a MASS of dye or it is open water (the masses' field is cut
      // at a narrow threshold: 0.5 to 0.57; it was 0.3 to 0.75, and every place of middling richness was a ladder of dyed
      // and clear bands: zebra). `along` moves that threshold (`alongShift`) instead of thinning the masses. THE GREAT MASSES
      // ARE PLACED (`masses`: [s, d, metres, how much the field leans to dye there; below 0: to open water]): indigo down the
      // lagoon's left, crimson down its right, as the key painting has them. And A LEAD of clear water runs down the composed
      // line between them (`lead`: `half` metres either side along the route, wandering, its edge in lobes [metres deep,
      // metres across], swelling and narrowing along its length by `breath` [least, most, over metres]): the sun's road lies
      // in it, and the mirror shows there. (The third holder's `lane`, `naveRoad.thin`, `seam.open`, `rich.floor` are at 0.)
      mass: [26, 0.5, 0.57, 0.5], figure: 7, fadeIn: [[0, 0.1], [20, 0.1], [34, 1], [261, 1]],
      along: [[0, 0.3], [40, 0.45], [80, 0.6], [100, 1], [261, 1]], alongShift: 0.13, massAlong: [[0, 0.15], [84, 0.3], [104, 1], [261, 1]],      // (in the nave the masses are fewer and smaller: the cloth must stand in the water between them, and the banks in it at its edges)
      masses: [
        [112, -13, 10, 0.14], [128, -20, 13, 0.14], [148, -23, 14, 0.14], [168, -19, 12, 0.14], [186, -13, 9, 0.14], [197, -8, 6, 0.14],      // indigo, down the lagoon's left
        [108, 13, 10, 0.14], [125, 20, 13, 0.14], [146, 22, 13, 0.14], [166, 20, 12, 0.14], [185, 15, 9, 0.14],                          // crimson, down its right
        [138, -10, 5, -0.25], [156, 12, 5, -0.25], [176, -22, 5, -0.25], [118, 26, 5, -0.25],                                        // pools of open water in them
        [147, -36, 13, 0.3], [159, -41, 10, 0.3],                                                                                   // the blue yard and the water before it: under blue
        [33, -6, 4, 0.2], [43, 6.5, 4, 0.2], [54, -6.5, 4.5, 0.2], [70, 7.5, 4.5, 0.2], [80, -7, 6, 0.3], [87, -8, 5, 0.3], [83, 7.5, 5, 0.3], [90, 8, 5, 0.3],                             // the nave: figures to the left and to the right by turns
        [102, -7, 6, 0.25], [103, 7.5, 6, 0.32], [99, 6.5, 4, 0.3], [97, 9, 4, 0.2],                                                                    // postcard 4's foreground: indigo to the left of the bow, crimson to the right
        [197, -12, 6, 0.3], [193, 4, 5, 0.3],                                                                                       // dye either side of the lamp's lead (postcard 6)
      ],
      lead: { half: [[0, 1.8], [92, 2.4], [125, 5.5], [180, 5.0], [206, 2.2], [261, 1.8]], soft: 1.4, wander: 3, wanderOver: 40, lobes: [2.4, 8], breath: [0.25, 1.6, 15], open: 1 },
      naveRoad: { until: 100, half: 1.6, thin: 0 },
      seam: { wander: 0.2, size: 26, lot: 0.18, meet: 0.06, violet: 0.16, tinge: 0.22, second: 0.55, open: 0, width: 0.45, narrow: [11, 22] },
      lane: { at: 6, wide: 4.5, rich: 0, road: 2.4, open: 0 },
      pools: [
        // (fourth holder: the pools that made a place RICHER are `masses` now; these are the ones that keep water open)
        // [102, -6.5, 6, 0.45], [103, 7, 6, 0.4], [122, -17, 12, 0.5], [125, 17, 12, 0.5],           // postcard 4's foreground, and the lagoon's two shoulders seen from the west front (postcards 4 and 5)
        // [158, -14, 9, 0.4], [160, 15, 10, 0.5],                                                 // postcard 8, mid-lagoon
        // [147, -36, 13, 0.6], [159, -41, 10, 0.7],                                               // (take-over) the blue yard and the water before it: under blue
        // postcard 6, the lamp at the door. TAKE-OVER: its stroke lies on OPEN water (a glaze dyes a light that crosses it,
        // and the lamp's amber must stay the one warm thing on the water): a lead of clear water from the lamp toward the
        // coming boat, blue water either side of it (the sheet had one pool of dye in front of the lamp)
        [200.5, -5.6, 3.2, -0.9], [196, -4.2, 3.6, -0.9], [191, -2.8, 4, -0.85], [185.5, -1.4, 4.2, -0.7], [180, -0.4, 4.2, -0.5],
        [247, 0, 4, -0.7],                                                                      // postcard 11, the coin: its thread of light on open water
      ],
      cell: 1, warpCell: 0.5, margin: 20, y: 0.012,      // metres: the cells of the composition map and of the swirl map; how far beyond the waterway's bounds; how high over the water the sheet lies
      // the ground: a level every `tilt` metres down the river (-z), further in mid-stream (`bow` of the half width); three swells [metres, levels]:
      // a slow one, and two short ones that outrun the lean here and there, so that near the eye a band is an S, a hook or a closed eye and never a long straight line
      tilt: 0.5, lean: 1, bow: 0.14, ground: [[18, 16], [6, 7], [2.3, 2]], stretch: 1.2, warp: [10, 32],      // (fourth holder: was [[16, 8], [4.6, 5], [2.3, 3]]. The long swell now outruns the lean: the bands sweep round in S's ten metres long and run down the river in places. That was avoided while every band was a stripe of dark on pale (a wedge from the bow); inside a mass of one value it is a curl.)      // (the swells are kept gentler than the lean: where they outrun it the bands turn down the river, and from the low eye a band down the river is a wedge; a deep bow is a chevron pointing at the wheel)
      uneven: 0.36, soft: 0.16,                     // no two bands the same width; a band's soft edge, of its width
      carry: 0.6, carrySeam: 0.25, seamShift: 0.1,               // how far the swirls carry the composition with them (how rich a place is; and, less far, whose dye): tongues of one bank's dye in the other's
      // a band of dye is a STROKE: it begins and ends along its length (`amount`: how much of its lot goes by the place, over
      // `length` metres, `turns` times), tapering to a point (`taper`); its depth changes along it (`depth`)
      strokes: { amount: 0.4, length: 5.5, turns: 2.6, depth: 0.3, taper: 0.22 },      // (5.5 m, not 9: seen along its length, as when the rider looks across the lagoon, a long stroke is a road; a short one is a brushmark)
      striae: { amount: 0.45, fine: 3 },      // (fourth holder: 0.9 took the film down to nothing in streaks: pale lines through every mass)            // fine striations down every band, as a brush leaves them: how deep, how many to a band
      violet: [0.4, 0.03, 0.12],                    // near the seam the bands carry both dyes: how much of the other, within [1] of the seam (of the half width), none beyond [2]
      // what a band is. A new group of bands begins at one band in 1 / cut; `rich`: the share of groups that are dye, in a poor
      // place and in a rich one (`lotSoft`: how gradually a group comes and goes as the place changes); in a group of dye
      // `body` of the fine bands are dye, in open water `thread` of them; a band's depth runs from `pale` to `deep` (1 = the
      // dye's full colour: `depths` says how many bands are pale, middling and deep); `vein`: this many of the edges between two
      // bands carry a hairline of clear water, `veinWide` levels wide; `second`: bands that carry the other bank's dye too
      // (violet), and how much; `tinge`: and a little of it
      // (FOURTH HOLDER: a mass is one thing. Its bands differ a little in depth and hue and hardly in value: `pale` 0.8 (was 0.15: a
      // quarter of a mass's bands were all but clear water: stripes), nearly every band of a mass is dye (`body`), a group is five or
      // six bands (`cut`), few hairlines (`vein` 0.15, was 0.6), and a group is dye or open water outright (`rich`, `lotSoft`))
      kinds: { cut: 0.18, rich: [0.03, 1], lotSoft: 0.08, body: 0.97, thread: 0.05, pale: 0.45, deep: 2.0, depths: [0.2, 0.3, 0.45], vein: 0.15, veinWide: 0.12, second: [0.1, 0.5], tinge: [0.22, 0.2] },
      rich: { gain: 1.0, lane: 1.0, pools: 1.0, sunRoad: 0.25, banks: 0.1, banksAlong: [[0, 0], [84, 0.2], [104, 1], [261, 1]], floor: 0, depth: [0.5, 1.3] },      // (`depth`: the dye's depth in a poor place and in a rich one, of the band's own)      // (`banks`: how much richer the water is toward the banks and beyond the channel's edge: the dye comes from them)      // how much of the sheet's richness, lane and pools; and how much dye lies on the old river beyond the weir
      // THE EDDIES THAT TURN (the page's three in the lagoon, and a few of mine): [s, d] of the middle, metres across, seconds
      // to turn once at the middle, which way (unsaid: its bank's way). They wind and unwind the figure in two phases `cycle`
      // seconds long, half a cycle apart, each drawn by its weight: so the water turns for ever and is never wound to a blur.
      turning: [
        { at: [128, -8], across: 40, seconds: 150 }, { at: [156, 9], across: 22, seconds: 110 }, { at: [176, -3], across: 14, seconds: 90 },
        { at: [49, 3.5], across: 11, seconds: 80 }, { at: [79, -3], across: 12, seconds: 95 }, { at: [108, 15], across: 18, seconds: 120 },
        { at: [150, -24], across: 16, seconds: 100 }, { at: [138, 23], across: 14, seconds: 85 }, { at: [198, 4], across: 10, seconds: 70 }, { at: [229, -2.5], across: 9, seconds: 75 },
      ],
      cycle: 300,
      // THE STATIC SWIRLS: [s, d] of the middle, metres across, whole turns at the middle, which way. Small and tight (a
      // marbler's stylus: curls, hooks and feathers, not long bends), strewn by lot (scratch reach-light3/gen_swirls3.py,
      // seed 11), none with its middle on the composed line: a swirl there turns the bands down the river in front of the
      // bow, and from the low eye a band down the river is a wedge.
      swirls: [
        { at: [5.5, -8], across: 3.8, turns: 0.43, turn: 1 }, { at: [6.1, 9.9], across: 5.2, turns: 0.87, turn: 1 }, { at: [8.6, -10.2], across: 4.5, turns: 0.61, turn: -1 }, { at: [9.9, 8.3], across: 5.1, turns: 0.44, turn: 1 },
        { at: [10.1, -6.7], across: 4.4, turns: 0.86, turn: 1 }, { at: [12.8, 7.1], across: 4.2, turns: 0.91, turn: 1 }, { at: [13.7, -7.6], across: 5.3, turns: 0.38, turn: 1 }, { at: [14.3, -11], across: 4.5, turns: 0.74, turn: -1 },
        { at: [16.4, 7.8], across: 3.7, turns: 0.93, turn: 1 }, { at: [17.5, -8], across: 3.4, turns: 0.49, turn: -1 }, { at: [20.2, 5.2], across: 5.9, turns: 0.72, turn: -1 }, { at: [21.2, -5.8], across: 3.5, turns: 0.73, turn: -1 },
        { at: [24, -6.6], across: 5.6, turns: 0.85, turn: 1 }, { at: [25.7, 5.3], across: 3.6, turns: 0.72, turn: 1 }, { at: [26.8, 8.1], across: 5, turns: 0.93, turn: 1 }, { at: [28.6, -9.3], across: 3.8, turns: 0.6, turn: -1 },
        { at: [31.7, 10.5], across: 4.1, turns: 0.48, turn: 1 }, { at: [32, -8.3], across: 3.7, turns: 0.42, turn: -1 }, { at: [33.6, 8.1], across: 3.8, turns: 0.68, turn: -1 }, { at: [33.9, -5.6], across: 5.4, turns: 0.41, turn: -1 },
        { at: [37.8, -8.6], across: 5.9, turns: 0.4, turn: -1 }, { at: [38.1, 10.9], across: 5.8, turns: 0.87, turn: -1 }, { at: [40, -5.5], across: 4.2, turns: 0.44, turn: 1 }, { at: [40.2, 4.7], across: 4.4, turns: 0.45, turn: 1 },
        { at: [45, 4.6], across: 4.1, turns: 0.5, turn: 1 }, { at: [47.5, -7.8], across: 5.5, turns: 0.52, turn: -1 }, { at: [47.9, 11.4], across: 4, turns: 0.58, turn: 1 }, { at: [50.3, 8.2], across: 4, turns: 0.88, turn: -1 },
        { at: [52.2, -11.6], across: 5.4, turns: 0.64, turn: -1 }, { at: [52.6, 11], across: 6, turns: 0.76, turn: 1 }, { at: [55, 6], across: 4.1, turns: 0.63, turn: 1 }, { at: [56.2, -7.4], across: 5.4, turns: 0.7, turn: -1 },
        { at: [59.2, 10.2], across: 6.2, turns: 0.48, turn: 1 }, { at: [61.2, -7.7], across: 4.2, turns: 0.73, turn: -1 }, { at: [63.1, 10.3], across: 5.9, turns: 0.89, turn: 1 }, { at: [65.7, -9.3], across: 4.5, turns: 0.92, turn: 1 },
        { at: [68.8, -11.3], across: 3.7, turns: 0.45, turn: 1 }, { at: [68.8, 5.1], across: 4.9, turns: 0.84, turn: 1 }, { at: [70.3, 11.8], across: 5.5, turns: 0.89, turn: -1 }, { at: [70.7, -8.7], across: 5.7, turns: 0.7, turn: 1 },
        { at: [74.7, 8.2], across: 4.4, turns: 0.5, turn: -1 }, { at: [74.7, -9.7], across: 5, turns: 0.79, turn: -1 }, { at: [78.3, 10.1], across: 3.5, turns: 0.69, turn: 1 }, { at: [78.3, -11], across: 4.2, turns: 0.56, turn: 1 },
        { at: [81.2, 9.3], across: 3.8, turns: 0.77, turn: 1 }, { at: [81.7, -13], across: 4.2, turns: 0.52, turn: -1 }, { at: [81.9, 6.7], across: 3.9, turns: 0.94, turn: -1 }, { at: [84.1, -5.2], across: 5.1, turns: 0.9, turn: -1 },
        { at: [86.8, 9.8], across: 5.1, turns: 0.39, turn: 1 }, { at: [87.8, -6.6], across: 5.6, turns: 0.44, turn: -1 }, { at: [90.1, -11.9], across: 3.8, turns: 0.86, turn: -1 }, { at: [91.8, -9.2], across: 4.1, turns: 0.49, turn: -1 },
        { at: [95.2, 7.3], across: 5.7, turns: 0.81, turn: 1 }, { at: [96, 12.1], across: 7.1, turns: 0.61, turn: -1 }, { at: [98.5, 18], across: 7.2, turns: 0.42, turn: -1 }, { at: [99.5, -20.3], across: 4.6, turns: 0.76, turn: -1 },
        { at: [100.4, 7.3], across: 4.9, turns: 0.89, turn: -1 }, { at: [101.3, -7.5], across: 4, turns: 0.67, turn: -1 }, { at: [102.8, -16.1], across: 7.8, turns: 0.66, turn: -1 }, { at: [103, -22.8], across: 5.4, turns: 0.81, turn: 1 },
        { at: [105.8, 21], across: 3.5, turns: 0.61, turn: 1 }, { at: [105.9, -8.6], across: 6.5, turns: 0.5, turn: -1 }, { at: [108, -15.9], across: 7.2, turns: 0.86, turn: -1 }, { at: [108.1, 24.6], across: 7.3, turns: 0.71, turn: 1 },
        { at: [109.6, 7.5], across: 3.8, turns: 0.77, turn: 1 }, { at: [110.8, -23.2], across: 10.5, turns: 0.44, turn: -1 }, { at: [112.4, 9.8], across: 5.1, turns: 0.42, turn: -1 }, { at: [112.5, 5.9], across: 4.8, turns: 0.7, turn: 1 },
        { at: [112.7, -8.2], across: 7.5, turns: 0.43, turn: 1 }, { at: [113.6, 21.9], across: 12.5, turns: 0.36, turn: -1 }, { at: [114.5, 15.2], across: 3.7, turns: 0.82, turn: 1 }, { at: [116.4, -16.7], across: 4.4, turns: 0.65, turn: -1 },
        { at: [117, 10.7], across: 7.5, turns: 0.67, turn: 1 }, { at: [117.1, -31.5], across: 5.5, turns: 0.5, turn: 1 }, { at: [117.2, 27.3], across: 7.5, turns: 0.91, turn: 1 }, { at: [117.5, -24.8], across: 7.6, turns: 0.86, turn: 1 },
        { at: [119.4, 33.4], across: 6.2, turns: 0.42, turn: 1 }, { at: [119.6, -17.6], across: 3.5, turns: 0.7, turn: -1 }, { at: [120.7, -31.9], across: 4.4, turns: 0.91, turn: 1 }, { at: [121.7, -26.2], across: 3.4, turns: 0.59, turn: 1 },
        { at: [122.5, 18.2], across: 4.1, turns: 0.68, turn: 1 }, { at: [123.4, 8.4], across: 8.2, turns: 0.83, turn: -1 }, { at: [123.6, 33.9], across: 5.9, turns: 0.61, turn: -1 }, { at: [123.8, 24.1], across: 5, turns: 0.63, turn: 1 },
        { at: [124.2, -31.8], across: 4.7, turns: 0.72, turn: 1 }, { at: [124.4, 29.5], across: 5.5, turns: 0.7, turn: -1 }, { at: [125.3, -22.5], across: 6.1, turns: 0.56, turn: 1 }, { at: [127.1, 19.4], across: 4.8, turns: 0.93, turn: 1 },
        { at: [127.4, -33], across: 4.6, turns: 0.55, turn: -1 }, { at: [127.8, 7.3], across: 7.8, turns: 0.74, turn: 1 }, { at: [128, 23.8], across: 5.6, turns: 0.49, turn: -1 }, { at: [128.6, -22.2], across: 7.1, turns: 0.84, turn: -1 },
        { at: [130.1, -30.9], across: 6, turns: 0.92, turn: -1 }, { at: [131, 29.5], across: 9.8, turns: 0.39, turn: 1 }, { at: [132.6, 6], across: 8.4, turns: 0.43, turn: 1 }, { at: [132.6, -31.9], across: 4, turns: 0.51, turn: -1 },
        { at: [133.6, 34.9], across: 8.2, turns: 0.94, turn: -1 }, { at: [133.7, -20.1], across: 3.7, turns: 0.8, turn: 1 }, { at: [134, -25.1], across: 5.4, turns: 0.66, turn: -1 }, { at: [135.4, 18.4], across: 4.9, turns: 0.39, turn: 1 },
        { at: [135.9, 9.4], across: 4.6, turns: 0.47, turn: 1 }, { at: [136, -35.1], across: 4.2, turns: 0.79, turn: 1 }, { at: [136.6, 13.3], across: 5.9, turns: 0.5, turn: 1 }, { at: [137.2, -28.4], across: 4.5, turns: 0.87, turn: 1 },
        { at: [138.8, 18], across: 4.7, turns: 0.45, turn: 1 }, { at: [140.2, 4.7], across: 4.6, turns: 0.52, turn: 1 }, { at: [141.3, 9.6], across: 7.3, turns: 0.77, turn: -1 }, { at: [141.3, -36.7], across: 6.9, turns: 0.73, turn: -1 },
        { at: [141.4, -19.8], across: 4.8, turns: 0.79, turn: -1 }, { at: [142.3, 32.9], across: 6, turns: 0.52, turn: -1 }, { at: [143, 14.8], across: 7.8, turns: 0.94, turn: 1 }, { at: [143.4, -15.9], across: 4.8, turns: 0.77, turn: -1 },
        { at: [143.5, 21.1], across: 8.4, turns: 0.84, turn: 1 }, { at: [144.1, -12.7], across: 3.5, turns: 0.58, turn: -1 }, { at: [144.6, 28.7], across: 4.9, turns: 0.78, turn: 1 }, { at: [146.3, -32.3], across: 3.4, turns: 0.57, turn: -1 },
        { at: [146.5, -5.9], across: 6.1, turns: 0.9, turn: -1 }, { at: [146.5, -17.6], across: 5.7, turns: 0.57, turn: -1 }, { at: [147.1, -36.3], across: 6.2, turns: 0.47, turn: -1 }, { at: [147.6, 35.5], across: 8.2, turns: 0.86, turn: 1 },
        { at: [148, 10.4], across: 4.6, turns: 0.88, turn: -1 }, { at: [148.7, 15.5], across: 5.4, turns: 0.67, turn: 1 }, { at: [149.8, 24.3], across: 8.3, turns: 0.47, turn: 1 }, { at: [151, -32.2], across: 4, turns: 0.73, turn: -1 },
        { at: [151.7, -39.9], across: 3.9, turns: 0.52, turn: -1 }, { at: [152.9, -11.2], across: 7.7, turns: 0.93, turn: -1 }, { at: [153, 29.8], across: 5.9, turns: 0.7, turn: -1 }, { at: [153.1, 35.2], across: 3.7, turns: 0.69, turn: 1 },
        { at: [153.3, -36.1], across: 6.5, turns: 0.39, turn: -1 }, { at: [154, 17.5], across: 4.2, turns: 0.66, turn: -1 }, { at: [154.6, -7.1], across: 5.8, turns: 0.76, turn: -1 }, { at: [155.1, -15.3], across: 6.9, turns: 0.65, turn: 1 },
        { at: [155.5, 38.4], across: 7.5, turns: 0.43, turn: 1 }, { at: [157.6, 19.4], across: 6.2, turns: 0.82, turn: -1 }, { at: [158.9, 25.5], across: 7.5, turns: 0.87, turn: 1 }, { at: [159, -30.5], across: 6.6, turns: 0.95, turn: -1 },
        { at: [159.6, 33.4], across: 5.6, turns: 0.65, turn: 1 }, { at: [159.7, -19.6], across: 8.4, turns: 0.53, turn: -1 }, { at: [161.3, 16.8], across: 4.5, turns: 0.88, turn: 1 }, { at: [162.6, -7.1], across: 8.2, turns: 0.77, turn: -1 },
        { at: [162.9, 26], across: 3.8, turns: 0.8, turn: -1 }, { at: [164.3, -12.1], across: 5.5, turns: 0.94, turn: 1 }, { at: [164.5, -27.1], across: 11.7, turns: 0.31, turn: -1 }, { at: [165.2, 36], across: 5.4, turns: 0.59, turn: 1 },
        { at: [167.5, 6.5], across: 3.5, turns: 0.68, turn: 1 }, { at: [168, 28.9], across: 5.2, turns: 0.49, turn: 1 }, { at: [168, -17.2], across: 12.9, turns: 0.5, turn: -1 }, { at: [168.1, 24.7], across: 3.8, turns: 0.44, turn: 1 },
        { at: [168.1, -33.3], across: 9.8, turns: 0.37, turn: 1 }, { at: [168.1, 19.1], across: 7.4, turns: 0.53, turn: 1 }, { at: [169.2, -6.5], across: 7.6, turns: 0.42, turn: -1 }, { at: [170, 12.5], across: 8.1, turns: 0.49, turn: -1 },
        { at: [170.5, 8.5], across: 3.8, turns: 0.62, turn: -1 }, { at: [171.8, -36.6], across: 7.1, turns: 0.45, turn: -1 }, { at: [172.1, 24.5], across: 4, turns: 0.81, turn: 1 }, { at: [172.9, 37.5], across: 7.8, turns: 0.45, turn: 1 },
        { at: [173.6, 18.6], across: 5.7, turns: 0.91, turn: 1 }, { at: [173.8, -21.2], across: 3.5, turns: 0.42, turn: -1 }, { at: [175.1, -15.7], across: 4.2, turns: 0.52, turn: -1 }, { at: [176, 28.3], across: 5, turns: 0.75, turn: -1 },
        { at: [176.7, 35.3], across: 8.4, turns: 0.79, turn: -1 }, { at: [177, -35.3], across: 6.3, turns: 0.56, turn: 1 }, { at: [177.6, -23.5], across: 6.3, turns: 0.6, turn: -1 }, { at: [178.1, -10.9], across: 6.6, turns: 0.65, turn: -1 },
        { at: [180.4, 11.2], across: 6.6, turns: 0.87, turn: 1 }, { at: [181.2, 31.7], across: 8.1, turns: 0.62, turn: 1 }, { at: [181.3, 25.6], across: 7.9, turns: 0.66, turn: 1 }, { at: [181.3, 17.3], across: 8, turns: 0.93, turn: 1 },
        { at: [182.6, -19.2], across: 5.7, turns: 0.56, turn: -1 }, { at: [183.7, -7.9], across: 6.5, turns: 0.41, turn: -1 }, { at: [184, 13.5], across: 6.1, turns: 0.47, turn: 1 }, { at: [184.6, 27.4], across: 6.2, turns: 0.52, turn: -1 },
        { at: [184.8, -30.1], across: 4.7, turns: 0.91, turn: 1 }, { at: [185.3, 35.8], across: 5.4, turns: 0.41, turn: -1 }, { at: [187.1, -34.7], across: 7.1, turns: 0.63, turn: -1 }, { at: [187.4, 9.6], across: 6.6, turns: 0.69, turn: 1 },
        { at: [188.2, 30.9], across: 6, turns: 0.42, turn: -1 }, { at: [188.4, 24], across: 7.3, turns: 0.79, turn: 1 }, { at: [188.8, -6.7], across: 6.6, turns: 0.41, turn: -1 }, { at: [190.5, 11.6], across: 5.9, turns: 0.76, turn: -1 },
        { at: [190.9, -23.1], across: 5.4, turns: 0.81, turn: 1 }, { at: [190.9, -16.5], across: 7.4, turns: 0.54, turn: 1 }, { at: [191.8, 29.7], across: 5, turns: 0.48, turn: 1 }, { at: [194.3, 22.3], across: 4.5, turns: 0.88, turn: 1 },
        { at: [194.6, -15], across: 6.5, turns: 0.87, turn: -1 }, { at: [195.1, -19.8], across: 4.6, turns: 0.42, turn: -1 }, { at: [195.2, -6.6], across: 7, turns: 0.54, turn: 1 }, { at: [196.6, 16.2], across: 6.9, turns: 0.67, turn: 1 },
        { at: [197.4, -22.9], across: 5.5, turns: 0.4, turn: -1 }, { at: [199.8, -8.7], across: 4.8, turns: 0.4, turn: -1 }, { at: [201.7, 7.5], across: 4.8, turns: 0.77, turn: -1 }, { at: [203.8, 10.4], across: 5.4, turns: 0.89, turn: -1 },
        { at: [205.9, -6.8], across: 3.6, turns: 0.67, turn: -1 }, { at: [208.5, -8.7], across: 5, turns: 0.75, turn: 1 }, { at: [209.3, 8.6], across: 4.7, turns: 0.7, turn: 1 }, { at: [212.4, -6.6], across: 3.9, turns: 0.42, turn: -1 },
        { at: [212.7, 8.6], across: 3.8, turns: 0.69, turn: 1 }, { at: [213.5, -8.9], across: 4.1, turns: 0.9, turn: 1 }, { at: [217.7, 10.1], across: 3.6, turns: 0.59, turn: -1 }, { at: [218.7, 6.3], across: 3.9, turns: 0.8, turn: 1 },
        { at: [219.1, -8.1], across: 4.2, turns: 0.6, turn: 1 }, { at: [220.9, 9.4], across: 5.2, turns: 0.46, turn: -1 }, { at: [222.6, -4.3], across: 3.4, turns: 0.95, turn: -1 }, { at: [224.1, -6.9], across: 3.8, turns: 0.86, turn: -1 },
        { at: [226.2, 7.4], across: 5, turns: 0.56, turn: 1 }, { at: [228.1, -9.6], across: 4.1, turns: 0.64, turn: -1 }, { at: [229.1, 5.3], across: 5, turns: 0.64, turn: 1 }, { at: [232.4, 8.2], across: 4.3, turns: 0.93, turn: 1 },
        { at: [234.5, -8.3], across: 3.5, turns: 0.71, turn: -1 }, { at: [235.2, 7.1], across: 5, turns: 0.62, turn: 1 }, { at: [238.2, 4.6], across: 4.2, turns: 0.72, turn: 1 }, { at: [240.2, -8.6], across: 4.9, turns: 0.82, turn: -1 },
        { at: [241.4, 8], across: 3.5, turns: 0.93, turn: 1 }, { at: [242.1, 5.4], across: 3.5, turns: 0.94, turn: 1 }, { at: [243.7, 9.1], across: 4.4, turns: 0.78, turn: 1 }, { at: [245.2, -9.5], across: 4.9, turns: 0.44, turn: -1 },
        { at: [247.8, -6.3], across: 4, turns: 0.5, turn: 1 }, { at: [249.3, -9.1], across: 3.6, turns: 0.76, turn: -1 }, { at: [249.4, 5.4], across: 4.5, turns: 0.65, turn: 1 }, { at: [250.4, 9.4], across: 3.7, turns: 0.78, turn: 1 },
        { at: [253.6, 8], across: 3.7, turns: 0.92, turn: -1 }, { at: [254, -9.1], across: 4.6, turns: 0.55, turn: -1 },
      ],
      // WHAT THE DYES LET THROUGH (linear light, 0 to 1, at depth 1), along the route [s, [r, g, b]]: the left bank's dye, the
      // right bank's, and what the two make together. Chosen so that the clear water of this area (a rose mirror) seen
      // through them is the key painting's indigo-violet #382B5E, crimson #9B344B and plum.
      // (measured: the key's dark figure over its clear water is x (0.11, 0.33, 1.1) in linear light: indigo takes the red
      // and leaves the blue whole; its crimson is x (0.75, 0.25, 0.45). At depth 1.7, the deepest band, that is these.)
      left: [[0, [0.94, 0.68, 0.38]], [52, [0.92, 0.54, 0.34]], [66, [0.52, 0.4, 0.7]], [84, [0.14, 0.43, 0.93]], [261, [0.14, 0.43, 0.93]]],      // (fourth holder: indigo was [0.23, 0.42, 0.84]: as a film it showed #65355E, a red-violet, where the key's is #4E3766)
      right: [[0, [0.94, 0.7, 0.38]], [40, [0.92, 0.56, 0.34]], [72, [0.86, 0.4, 0.4]], [112, [0.84, 0.42, 0.5]], [196, [0.84, 0.42, 0.5]], [224, [0.56, 0.36, 0.8]], [250, [0.34, 0.4, 0.86]]],
      mix: [[0, [1.0, 0.5, 0.32]], [52, [0.96, 0.44, 0.34]], [84, [0.52, 0.34, 0.86]], [261, [0.5, 0.34, 0.88]]],
      // how the glaze sits in the picture: `glance`: at a grazing angle the water is a mirror and shows less of what is in
      // it (this much less, by the power `glancePow` of one minus the sine of the angle); `wobble`: how far the ripples bend the figure; `pour`: how deep what the cast
      // pours on the water (trace.inject 'a' / 'b') shows; `forget`: seconds until it is gone
      glance: 0.3, glancePow: 3, wobble: 0.25, pour: 1, forget: 65,
      ambient: [[0, 0.15], [50, 0.13], [72, 0.07], [90, 0.035], [261, 0.035]],      // (third holder's; no longer read) the dye's own body in the light, along the route [s, amount]: saffron is a LIGHT colour, and no filter makes gold of rose water: in the first bays the dye gives light of its own hue; indigo and crimson only take light away
      // FOURTH HOLDER: THE DYE IS A MATTE FILM ON THE WATER (set.js, the glaze's composite). `cover`: how fast a film hides the
      // water as it deepens (cover = 1 - exp(-cover x depth)); `most`: the most it ever hides (a little of the mirror's
      // glitter always comes through: it is wet); `light`: the light on the film along the route, [s, [r, g, b]] in linear
      // light: what a film that took nothing away would show (the colours a film shows are this times `left` / `right` /
      // `mix` above to the power of its depth): gold under the nave's cloth, the rose of the sky in the open lagoon;
      // `state`: that light at the start of the evening, at its end, and in the showstopper's dusk (multipliers)
      // `depth`: how deep the dye lies along the route (times every band's own depth). (Tried at 0.22 to 0.42 in the nave, to make
      // washes of the saffron and madder there: a thin film is a pale one, and the nave's water went milky peach,
      // .shots/reach_l4q_h7.jpg. It is the composition that keeps the nave's water open, not the dye's depth.)
      // THE LOFT'S NIGHT (fourth holder; set.js, the end of the glaze's shader): a shade on the water under the loft's roof, from `from` to
      // `to` metres along the route, in `color` (linear light), hiding at most `most` of the water; it does not thin with the veil
      loft: { from: 236, to: 245, color: [0.03, 0.026, 0.085], most: 0.86 },
      film: { cover: 3, most: 0.93, sheenFar: 0, depth: [[0, 0.85], [60, 0.9], [92, 1], [261, 1]],
        light: [[0, [0.66, 0.31, 0.15]], [44, [0.62, 0.27, 0.15]], [70, [0.46, 0.17, 0.15]], [92, [0.36, 0.105, 0.15]], [261, [0.36, 0.105, 0.15]]],
        state: { start: [1, 1, 1], end: [0.6, 0.5, 0.62], dusk: [0.5, 0.56, 0.9] } },
      // FIFTH HOLDER: THE DYE IS COLOUR IN THE WATER (set.js, the glaze's composite, `DYE_IN`; docs/build/reach/2-light.md, "Second
      // look, taken over a third time"). The picture is multiplied by what the dye lets through, hue by hue, and takes the dye's own
      // colour back by its body: out = picture x S + S x a. `on`: this is what the ride shows (&dye=film: the fourth holder's film).
      // `left`, `right`, `mix`: what the left bank's dye, the right bank's and the two together let through at depth 1, along the
      // route [s, [r, g, b]], linear light (a band's depth runs from kinds.pale x rich.depth[0] x group[0] to kinds.deep x
      // rich.depth[1] x group[1]: the deepest indigo of the lagoon is [0.08, 0.11, 0.45], the deepest crimson [0.4, 0.07, 0.12]);
      // `cover`: how fast a dye's body grows with its depth; `most`: the most of it that ever shows; `bodyGain` times `body`
      // (along the route: the nave stands in gold light) times `state` (the evening's start, its end, the showstopper's dusk):
      // the level of light the body gives back; `depth`: how deep the dye lies along the route; `glance`, `glancePow`: at a
      // grazing angle the water is a mirror and shows less of what is in it; `near`: [from, to, how much] the dye is deeper under
      // the eye than at `to` metres (the key painting's richest water is its nearest); `group`: THE RIBBONS: a group of bands is
      // [this shallow .. this deep] of its place by its own lot, [2] of the groups are clear water, [3] the lots' curve
      inwater: { on: false,
        left: [[0, [0.98, 0.62, 0.2]], [52, [0.9, 0.38, 0.2]], [66, [0.45, 0.22, 0.4]], [84, [0.12, 0.2, 0.6]], [261, [0.12, 0.2, 0.6]]],
        right: [[0, [0.98, 0.62, 0.2]], [40, [0.9, 0.38, 0.2]], [72, [0.6, 0.12, 0.14]], [112, [0.42, 0.07, 0.15]], [196, [0.42, 0.07, 0.15]], [224, [0.3, 0.1, 0.42]], [250, [0.16, 0.18, 0.56]]],
        mix: [[0, [1.0, 0.45, 0.16]], [52, [0.9, 0.3, 0.16]], [84, [0.3, 0.1, 0.42]], [261, [0.26, 0.12, 0.48]]],
        cover: 4, most: 1, bodyGain: 0.25, body: [[0, 1], [44, 1], [70, 1], [92, 1], [261, 1]], depth: [[0, 0.85], [60, 0.9], [92, 1], [261, 1]],
        state: { start: [1, 1, 1], end: [0.6, 0.6, 0.6], dusk: [0.5, 0.5, 0.5] },
        glance: 0.3, glancePow: 3, near: [4, 16, 0], group: [0.45, 1.7, 0.12, 1.0],
        // THE FIGURE IS DRAWN OUT DOWN THE RIVER (set.js, levelAt; dye.js). `k`: how many times (1: not at all, the fourth holder's figure).
        // In figure space (the river's length drawn in k times): a level every `tilt` metres, the ground's three swells [metres, levels],
        // the slow warp [metres, over metres], `bow`; and the swirls, strewn by lot: `count` of them, `size` metres in radius (most
        // small: `sizePow`), `turns` at the middle, no two nearer than `apart` of their radii, to `beyond` metres past the channel's edge
        fig: { k: 4, tilt: 0.25, lean: 1, bow: 0.04, ground: [[9, 3], [3.0, 6], [1.4, 2.2]], stretch: 1, warp: [1.2, 6], uneven: 0.36,
          count: 170, seed: 5, size: [0.9, 4.2], sizePow: 1.7, turns: [0.25, 0.8], apart: 0.55, beyond: 14 } },
    },
  },

  // ---- the place, its light and water (stage 2): THE AIR (set.js). A thin warm haze between the nave's arches; lint round the rider
  air: {
    nave: { count: 14, from: 30, to: 96, spread: 9, y: [1.5, 9], size: 22, opacity: 0.04, color: '#F0B48C' },
    lint: { count: 700, box: [36, 11, 36], y: [0.6, 11.6], velocity: [0, -0.015, -0.3], size: 0.045, color: '#FFC890', opacity: 0.36 },
    // SECOND LOOK: the shafts (the page's ten): light that has come under a rank's hems, lying in the nave's air. Each:
    // [s of the rank it comes from, d, the height it starts at (just under that hem), metres long, metres half wide]; it runs
    // from there back toward the start of the route, sinking as the sun does. `gain`: how much of the dyed light it adds.
    shafts: { gain: 0.16, at: [
      [92, -1.5, 13.2, 60, 1.3], [92, 4.3, 10.6, 54, 1.1], [81, -4.2, 9.0, 50, 1.0], [81, 1.4, 11.2, 56, 1.2], [70, 6.9, 5.4, 44, 0.9],
      [70, -1.3, 11.4, 50, 1.2], [59, -6.9, 5.2, 38, 0.9], [59, 4.1, 9.2, 44, 1.1], [48, 1.2, 11.0, 36, 1.1], [48, -4.1, 9.0, 34, 1.0],
    ] },
  },

  // ---- the wind: a breeze of 2 m/s from the east all the time (it blows TO the west), and two fronts on cue (staging)
  wind: { direction: [0, -1], speed: 2, breeze: 1, gustiness: 0.35 },
  gusts: {
    breath: { at: 40, from: 14, speed: 9, depth: 12, strength: 0.45, seconds: 9 },
    great: { at: 126, from: 30, speed: 17, depth: 8, strength: 1, clock: [126, 2] },                // the unpegging: c = max(seconds since release, (s - 126) / 2)
  },

  // ---- the kept lamp (page section 3): at the foot of the west door, in front of its two low indigo curtains
  lamp: { at: [204.6, -6.7], world: [16.8, -203.5], note: 62, near: 8, reach: 12, moths: 4, collide: 0.6 },

  // ---- the nave of cloth -----------------------------------------------------------------------------------------
  // Every rank hangs square to the nave's axis (its cloth faces along the route). `line` is the height its bolts hang
  // from, `hems` the height of each hem from the middle outward (0 = it trails in the water), `d` where the bolts hang.
  veil: { s: 2, bolts: 9, width: 2.4, length: 9, step: 2.4, top: 9.0 },
  narthex: {
    frames: [{ s: 9, line: 11.4 }, { s: 18, line: 11.8 }],
    mast: { d: 11, height: 12.5, thick: 0.4 },
    d: [0, 3.5, 7], hems: [4.5, 3.4, 0], width: 2.6,
  },
  nave: {
    // six frames; with the west front, seven arches. Masts stand `out` metres outside the channel edge
    frames: [
      { s: 26, line: 17.0, mast: 19.5, dyes: [CREAM, CREAM, SAFFRON] },
      { s: 37, line: 17.3, mast: 20.2, dyes: [SAFFRON, CREAM, SAFFRON] },
      { s: 48, line: 17.6, mast: 21.0, dyes: [SAFFRON, MADDER, SAFFRON] },
      { s: 59, line: 17.9, mast: 19.5, dyes: [MADDER, SAFFRON, MADDER] },
      { s: 70, line: 18.2, mast: 20.2, dyes: [MADDER, CRIMSON, MADDER], edge: VIOLET },
      { s: 81, line: 18.5, mast: 21.0, dyes: [CRIMSON, MADDER, CRIMSON], edge: INDIGO },
    ],
    mast: { out: 1.6, thick: 0.55 },
    d: [0, 2.75, 5.5, 8.25, 10.8], hems: [12.0, 9.8, 6.0, 0, 0], width: 2.6, vary: 0.6,
    // aisle walls: cloth between the masts along both sides, from wall plates at 15 m, hems in the water. Each bay has
    // three openings; `fill` says how many of them carry a cloth, bay by bay from s 26 (the bay with none is where a
    // wringer is seen through it: postcard 3 on the right, its twin on the left)
    aisle: { plate: 15, width: 2.6, length: 15.5, slots: [1.9, 5.5, 9.1], right: [2, 2, 2, 0, 2, 1], left: [2, 2, 2, 2, 0, 1] },
    // outer aisles: masts 14 m tall at d 20, posts 10 m tall at d 29, every 11 m; two bolts on each cross line
    outer: { stations: [31.5, 42.5, 53.5, 64.5, 75.5, 86.5], mast: { d: 20, height: 14 }, post: { d: 29, height: 10 }, d: [22.4, 26.2], width: 2.4, lengths: [11.5, 8.5] },
    // the vault: twelve swags, silks 1.2 by 26 m from each mast head to the opposite mast head of the next frame
    swags: { width: 1.2, sag: 3 },
    terraces: { out: [4, 9, 15], height: [0.9, 1.9, 3.0] },                                         // the side aisles' three steps
    ford: { depth: [0.3, 0.8] },
  },
  westFront: {
    s: 92, line: 20.5, mast: { d: 13.6, height: 23, thick: 0.6 },
    d: [0, 2.85, 5.7, 8.55, 11.4], hems: [14.0, 11.5, 7.5, 3.0, 0], width: 2.7, wing: { d: 15.2, hem: 2.2 },
  },
  // masts on the lagoon's banks that fly a silk: s, d, height (with the nave's twelve, the west front's and the door's two
  // each and the tenter grounds' six, the twenty-six mast heads of the flying silks)
  silkMasts: [[104, -24.5, 22], [146, -39.5, 21], [120, 31.5, 22], [183, 37, 20]],
  rinsing: [{ at: [62, -4], collide: 1.8, dyes: [SAFFRON, SAFFRON, MADDER] }, { at: [78, 3], collide: 1.8, dyes: [MADDER, CRIMSON, CRIMSON] }],
  lostBolts: [[52, 6], [88, -5], [126, 10], [172, -8]],

  // ---- the lagoon ------------------------------------------------------------------------------------------------
  indigoHouse: { at: [124, -37], size: [28, 14], ridge: 12, eaves: 6.5, floor: 0.8, vats: 6, beams: 4, bolts: 8, quay: { from: 108, to: 140, steps: 5 } },
  blueYard: { back: { s: 166, d: [-32.5, -48.5] }, south: { d: -48.5, s: [150, 166] }, ret: { s: 150, d: [-43, -48.5] }, width: 2.7, length: 10, mast: 11, hem: -0.3 },
  madderSteps: { from: 96, to: 128, out: [3, 7, 11], height: [0.9, 1.9, 3.0], vats: 10 },
  copper: { tub: [108, 37], foot: [108, 23], across: 3.6, deep: 2.4, slip: 2.4, period: 48 },
  liftingWheel: { at: [130, 32], across: 9, header: 8.5 },
  launder: { from: 100, to: 236, out: 6.5, height: 7.5, trough: [0.6, 0.5], trestleEvery: 6.2 },
  gallery: { at: [159, 36], size: [40, 5], floor: 1.2, roof: 6, piles: 18, wringers: 5 },
  redYard: { d: [42, 47, 52, 57], s: [140, 176], top: 13, width: 2.7, length: 11 },
  wringers: [[66, 15.5], [78, -15.5], [214, 12], [236, 12]],                                         // and five in the gallery
  dippingBeams: { house: 4, terrace: [[221, 15], [227, 15]] },

  // ---- the monument: the great wheel (world coordinates; page section 3) -------------------------------------------
  wheel: {
    hub: [-3, 15.2, -206],                          // s 202.7, d -26.2
    axle: [0, 1],                                   // the axle lies along z: the wheel stands broadside to the nave
    period: 120,                                    // seconds a turn; anticlockwise seen from the lagoon (the north, right-hand side rises)
    phase: 0.35,                                    // radians at the realm's time 0
    rim: { radius: 15, apart: 3.2, section: [0.45, 0.6] }, floats: { count: 48, size: [3.6, 0.85], reach: 15.6, under: 0.4 },
    arms: { pairs: 12, square: 0.42, bare: [4, 9] }, chords: [6, 10.5], hubAcross: 3.2, axleThick: 0.9,
    gores: { rail: [4.5, 14], length: [2.6, 12], lanes: [1.85, 2.15, 2.45], sway: 0.25 },
    frames: { apart: 6.6, leg: 0.9, legLength: 17, feet: 13, apex: 16.4 },
    pier: { x: [-21, 14], z: [-201, -211], top: 0.9, pit: 5.4 },
    // the gores' dye by progress: the evening has reached place e = 1 + 4 * clamp((furthest s - 60) / 140) of the dyer's scale
    place: { from: 60, over: 140, lags: [0, 1, 2, 0, 1, 2, 0, 1, 2, 0], lag: 0.6, top: 0.4 },      // a lag is 0.6 of a place, a top 0.4 behind its hem: three neighbouring dyes at once, never four
    // the pier's north end lies inside the corridor (the boat passes that close): three colliders (page section 11)
    colliders: [[13, -202.5, 2.2], [13.5, -206, 2.2], [13, -209.5, 2.2]],
    // the boom: chained baulks 3 m off the pier at its north end, 9 m off in front of the hub, made fast to the blue
    // yard's corner post. World x, z of the chain's joints; a collider (r 1.6) every 3 m stands 1.3 m behind it
    boom: [[13.2, -199.2], [8, -197.2], [2, -194.6], [-3, -192.2], [-7.5, -188.6], [-11, -184], [-13.5, -179], [-16.5, -173.5]],
    weir: { from: [-21, -206], to: [-34, -197] },
  },
  westDoor: {
    masts: [[13.4, -206], [35.4, -206]], mast: 23, line: 19, z: -206, width: 2.7,
    x: [14.8, 17.55, 20.3, 23.05, 25.8, 28.55, 31.3, 34.05], hems: [0, 0.5, 0.5, 9.5, 12.0, 9.5, 5.0, 0],
    dyes: [INDIGO, INDIGO, VIOLET, VIOLET, CRIMSON, VIOLET, VIOLET, INDIGO],
  },

  // ---- the terraces and the loft -----------------------------------------------------------------------------------
  // (AS BUILT: no undershot wheel on the causeway. The page puts one at (225, -10.4), which is world x 21.9: on the sun's
  // line for a boat between s 198 and s 207, where the page wants the sun bare in the open door, and against its own rule
  // that nothing taller than 1.6 m stands on world x 9 to 30. Anywhere on the causeway a 6 m wheel crosses the sun
  // for a few metres of the route. Both wheels stand on the right terrace: plan.rightTerrace.wheels.)
  causeway: { from: 212, to: 238, top: 0.5, edge: 9, pans: 7, panHeight: 0.45, spouts: 5 },
  rightTerrace: { from: 212, to: 240, out: [1.6, 6, 11], height: [0.9, 1.9, 3.0], vats: 8, spouts: 6, wheels: [[230, 10.4], [221.5, 10.4]], bolts: { s: [214, 236], d: 21, top: 8, width: 2.4, length: 6, count: 6 } },
  undershot: { across: 6, wide: 1.6 },
  // The cloth loft, first 20 m: THE MASTER SECTION for the shed's other half (the orchard's). 16 m of water, 19.2 m
  // between the post lines, a post pair every 5 m, tie beams at 9 m, ridge at 13 m, plank walks 0.6 m up outside the posts.
  loft: {
    from: 240, to: 260.4, water: 16, posts: 9.6, postEvery: [240, 245, 250, 255, 260], post: 0.35, tie: 9, ridge: 13, walk: 0.6, eaves: 6.2, wall: 11.4,
    ranks: [242, 247, 252, 257], bolts: 7, width: 2.4, length: 8.6, hem: 0.4,
    beyond: 26,                                     // metres of the same shed that are the orchard's (its roof is seen from our lagoon)
  },

  // ---- the vista (world coordinates) -------------------------------------------------------------------------------
  sunRoad: { x: [-15, 9], from: -211 },             // the old river, dead straight to the west, nothing on it but light
  farWheels: [[-17, -238, 5], [11, -260, 4.8], [-17, -288, 4.6], [11, -322, 4.3], [-17, -364, 4]],  // x, z, metres across
  tenter: { rows: 14, from: -227, every: 16, length: 24, height: 2, heightNorth: 1.6, gap: 2.5, north: { from: -330, to: 24 }, masts: [[-38, -246], [34, -262], [-30, -294], [40, -310], [-44, -342], [30, -358]], mast: 16 },
  chimney: { at: [-61, -386], height: 30, base: 3.2 },
  // The far band: two painted strips (assets/art/reach/farbank.webp, 2048 x 683) standing on rails all round, never
  // nearer than 150 m to water the boat can reach: the far hills with their poplars, and 40 m nearer the far edge of the
  // works. `v`: the strip's rows in the picture (0 = its bottom); `rail`: world x, z of the line it stands on, corners
  // rounded. BOTH LEAVE THE WEST OPEN where the sun road runs to the horizon (x -45 to 65): the sun must go down to 0.3
  // degrees with nothing in front of it, and painted hills 34 m tall at 540 m would hide it from s 100 on.
  farBand: { west: -540, side: 200, height: 30, fog: 0.45, edge: 0.9, pale: [0.52, 0.74, 0.2, 0.42], strips: [      // (second look. `edge`: how opaque the painting must be to be drawn: its pale half-transparent glow is cut away; `pale`: what is brighter than [0] to [1] AND less saturated than [3] to [2] is left out: the grey-white mist painted among the works' flags)
    { name: 'far hills', v: [0.571, 0.7482], aspect: 16.93, height: 34, base: 0, tint: '#B07684', rail: [[-45, -540], [-205, -540], [-205, 260], [205, 260], [205, -540], [65, -540]], corner: 95, taper: 100 },
    { name: 'far works', v: [0.0791, 0.2928], aspect: 14.03, height: 17, base: 0.4, tint: '#B88690', rail: [[-52, -500], [-190, -500], [-190, 240], [195, 240], [195, -500], [72, -500]], corner: 85, taper: 70 },
  ] },
  // painted art that exists (assets/art/reach/): set.js loads only what is listed here
  art: { sky: true, farbank: true },

  // ---- postcards (page section 4): s, d, yaw, pitch
  postcards: [
    { n: 1, name: 'the first arch', s: 28, d: 0, yaw: 0, pitch: 5 },
    { n: 2, name: 'up the vault', s: 53, d: -2, yaw: 0, pitch: 55 },
    { n: 3, name: 'the wringer', s: 62, d: 5, yaw: -68, pitch: 5 },
    { n: 4, name: 'the west front', s: 96, d: 0, yaw: 5, pitch: 9 },
    { n: '4a', name: 'through the last arch (added at layout: the stamp, between two curtains)', s: 76, d: 0, yaw: 2, pitch: 9 },
    { n: 5, name: 'the west front from outside', s: 112, d: 0, yaw: 180, pitch: 8 },
    { n: 6, name: 'the lamp at the door', s: 184, d: 0, yaw: 18, pitch: 2 },
    { n: 7, name: 'under the rose', s: 190, d: -22, yaw: 16, pitch: 45 },
    { n: 8, name: 'the unpegging', s: 150, d: 0, yaw: 21, pitch: 12 },
    { n: 9, name: 'the sun road', s: 210, d: -4, yaw: 32, pitch: 2 },
    { n: 10, name: 'looking back', s: 238, d: 0, yaw: 136, pitch: 14 },
    { n: 11, name: 'the coin', s: 240, d: 0, yaw: 8, pitch: 0 },
  ],
};

/** The sun's elevation in degrees when the rider's furthest progress is s. */
export const sunElevation = (s) => ramp(PLAN.sun.elevation, s);
/** Its width in degrees. */
export const sunSize = (s) => ramp(PLAN.sun.size, s);
/** 0 at the start light state, 1 at the end one (furthest progress). */
export const lightAt = (s) => clamp01((s - PLAN.light.blend[0]) / (PLAN.light.blend[1] - PLAN.light.blend[0]));
/** The place the evening has reached on the dyer's scale (1 saffron .. 5 indigo) at furthest progress s. */
export const dyePlace = (s) => 1 + 4 * clamp01((s - PLAN.wheel.place.from) / PLAN.wheel.place.over);
/** The cloth zone at s. */
export const zoneAt = (s) => PLAN.zoning.find((z) => s >= z.from && s < z.to) || PLAN.zoning[PLAN.zoning.length - 1];
export { ramp, lerp, clamp01 };

// ------------------------------------------------------------------------------------------------ the dye yards (stage 2: kit_yards.js; docs/build/reach/2-kit-yards.md)
// Where the vats, the pans, the spouts, the skein racks and the props of the yards stand. A place on a bank is
// [s, side, out]: s along the route, side 1 = the right bank (madder) or -1 = the left (indigo), out = metres OUTSIDE
// the channel's edge, measured the way the land is laid (set.js: `shared.reach.bank(side, s)` gives the three risers
// there). Heights come from the land: a thing stands on the step that `out` falls on. The vats and pans are where
// stage 1 stood them (its stand-ins computed the same numbers in kit.js).
{
  const { SAFFRON, MADDER, CRIMSON, VIOLET, INDIGO } = PLAN.dye;
  const aisle = (s, side) => (s < 48 ? SAFFRON : side < 0 && s > 70 ? INDIGO : s < 70 ? MADDER : CRIMSON);
  const vats = [];                                               // [s, side, out, metres across, dye]
  for (const side of [-1, 1]) {                                  // the side aisles: eleven a bank on the three steps
    for (const s of [30, 44, 58, 72]) vats.push([s, side, 6.5, 3, aisle(s, side)]);
    for (const s of [36, 52, 68, 84]) vats.push([s, side, 12, 3, aisle(s, side)]);
    for (const s of [42, 62, 82]) vats.push([s, side, 17.5, 2.4, aisle(s, side)]);
  }
  for (const s of [100, 114, 122]) vats.push([s, 1, 5, 3, MADDER]);              // the madder steps: ten
  for (const s of [99, 113, 119, 126]) vats.push([s, 1, 9, 3, MADDER]);
  for (const s of [98, 116, 124]) vats.push([s, 1, 13.5, 2.4, CRIMSON]);
  for (const s of [219, 224.5]) vats.push([s, 1, 3.8, 2.4, VIOLET]);             // the right terrace: eight
  for (const s of [215, 233, 238]) vats.push([s, 1, 8.5, 3, VIOLET]);
  for (const s of [218, 224, 231]) vats.push([s, 1, 13.5, 3, INDIGO]);
  PLAN.yards = {
    // what a dye looks like standing in a vat or run down stone (by the dyer's scale: cream .. indigo). Not the cloth's
    // chips: a stain is thinner than dyed cloth and the reach's red-gold light falls on it
    stain: ['#E6CC98', '#EE9A1E', '#C43A26', '#A4163A', '#6E3090', '#2C3E8A'],
    vats,
    // the causeway's seven shallow pans (0.45 m tall: plan.causeway.panHeight), on the apron: [s, out]
    pans: [214, 217.5, 221, 228.5, 232, 235.5, 238.5].map((s) => [s, 3.2 + (s - 212) * 0.12]),
    // The two dyes a place is stained with, by where it is: [its own, its second]. The page's route table: weld-yellow
    // stains in the first bays, madder from bay 3 on the right, indigo from bay 5 on the left; in the lagoon indigo on
    // the left bank and madder on the right; violet and indigo on the terraces. A wall's lowest tide mark is its bank's
    // own dye, its highest the other bank's, the middle one both (indigo, violet, madder from the water up on the left
    // bank; madder, violet, indigo on the right: the page's order).
    dyesAt: (s, side) => (s < 48 ? [SAFFRON, SAFFRON] : s < 70 ? (side > 0 ? [MADDER, SAFFRON] : [SAFFRON, MADDER])
      : s < 92 ? (side > 0 ? [CRIMSON, MADDER] : [INDIGO, MADDER]) : s < 204 ? (side > 0 ? [MADDER, INDIGO] : [INDIGO, MADDER])
        : (side > 0 ? [VIOLET, INDIGO] : [INDIGO, VIOLET])),
    // terrace walls: lengths of wall face the land's three risers. [side, riser (0 = the one in the water), from s, to s]
    // (the upper risers behind the wringing gallery and behind the indigo house are never seen from the water: left bare)
    // (THE SECOND LOOK: the left bank's wall in the water stops at s 123.5, where the indigo house's own frontage begins
    // (plan.houses.indigo.frontage: its water stair, piles and mooring posts, s 123.5 to 138.6): it ran on under the house
    // to 139.5 and a spout's run down it showed through the house's stair)
    walls: [[1, 0, 2, 240], [1, 1, 2, 139], [1, 2, 2, 139], [1, 1, 179, 240], [1, 2, 179, 240], [-1, 0, 2, 123.5], [-1, 1, 2, 108], [-1, 2, 2, 108]],
    apron: [209.5, 239.5],                                       // the causeway's edge (left bank), 0.35 m outside the channel
    // stairs: [side, riser, s]: down into the ford (riser 0) and from step to step. Clear of the racks, the spouts and the vats
    // (the madder steps' stairs keep clear of the copper's slipway, s 106.8 to 109.2; the terrace's of the dipping beams)
    stairs: [[1, 0, 39], [1, 0, 64], [1, 0, 79.5], [1, 1, 51], [1, 1, 79], [1, 2, 45], [1, 2, 76], [1, 0, 118], [1, 1, 105], [1, 2, 116],
      [-1, 0, 39], [-1, 0, 51], [-1, 0, 80], [-1, 1, 37], [-1, 1, 65], [-1, 2, 46], [-1, 2, 75], [1, 1, 233.5], [1, 2, 224],
      // (the second look: the right bank between the wringing gallery and the door, s 180 to 206, was thirty metres of three
      // bare walls: a stair into the lagoon there and one up to the second step)
      // (the upper one stands at 201.5, between the launder's trestles at s 198.4 and 204.6: at 199 a trestle's foot stood on it)
      [1, 0, 190.6], [1, 1, 201.5]],
    // Spouts: [s, side, out of the LIP, height of the lip above the water, part, dye]. A spout is placed by its lip: where
    // it pours from. The nave's and the madder steps' lie with their heels on the first step's coping (0.3 m behind the
    // riser) and reach 1.4 to 2 m out over the ford on a forked post; the quay's the same; the causeway's lie on the
    // apron with their lips at the channel's edge (stage 1's stood 0.3 m inside the channel: the hull would brush them);
    // the right terrace's three low ones pour from the first step, its three long ones from the second step, out over
    // the first, down past the wall (2.5 m). AS BUILT the terrace's six stand in the gaps between the two undershot
    // wheels (s 218.5 to 224.5 and 227 to 233: plan.machines), the two wringers (209 and 237.6, each reaching 3 m along
    // the bank), the door's mast (214.4) and the vats: stage 1's stood inside the wheels.
    spouts: [
      [34, 1, 2.7, 1.03, 'spout_c', SAFFRON], [52, 1, 2.3, 1.03, 'spout_d', MADDER], [76, 1, 2.9, 1.03, 'spout_b', MADDER], [88.5, 1, 2.7, 1.03, 'spout_c', CRIMSON],
      [34, -1, 2.3, 1.03, 'spout_d', SAFFRON], [63, -1, 2.7, 1.03, 'spout_c', MADDER], [76, -1, 2.9, 1.03, 'spout_b', INDIGO], [88, -1, 2.7, 1.03, 'spout_c', INDIGO],
      // (the quay's three: the page's s 112, 124, 136; AS BUILT 102.3, 112, 119.5: the last two of the page's stand in the
      // indigo house's own frontage. They keep clear of the two dipping beams east of the house (posts at s 104.8 and 110.4,
      // 1.1 and 1.8 m outside the edge; their cloths go down at s 99.6 and 115.6): plan.machines.dip)
      [102.3, -1, 1.7, 0.9, 'spout_c', INDIGO], [112, -1, 1.8, 0.9, 'spout_b', INDIGO], [119.5, -1, 1.6, 0.9, 'spout_b', INDIGO],
      [102, 1, 1.7, 1.03, 'spout_c', MADDER], [114, 1, 1.3, 1.03, 'spout_d', MADDER], [120, 1, 1.9, 1.03, 'spout_b', MADDER], [126, 1, 1.7, 1.03, 'spout_c', MADDER],
      [215, -1, 0.12, 0.69, 'spout_a', INDIGO], [219.5, -1, 0.12, 0.69, 'spout_a', INDIGO], [229, -1, 0.12, 0.69, 'spout_a', INDIGO], [233, -1, 0.12, 0.69, 'spout_a', INDIGO], [237, -1, 0.12, 0.69, 'spout_a', INDIGO],
      [213.2, 1, 0.5, 1.1, 'spout_b', VIOLET], [217.6, 1, 0.5, 1.1, 'spout_b', VIOLET], [225.4, 1, 0.5, 1.1, 'spout_b', VIOLET],
      [211.8, 1, 1.4, 2.48, 'spout_e', VIOLET], [216.3, 1, 1.4, 2.48, 'spout_e', INDIGO], [226.5, 1, 1.4, 2.48, 'spout_e', VIOLET],
    ],
    // Skein racks: [s, side, out, dye, length scale]. Ten stand in the nave's ford (the swallows perch on those at
    // (44, left) and (58, right)); two in the lagoon's ford either end of the wringing gallery (stage 1's at s 141 stood
    // inside the gallery); two on the right terrace's first step, between its vats (stage 1's stood through a vat).
    racks: [
      ...[-1, 1].flatMap((side) => [31, 44, 58, 70, 84].map((s) => [s, side, 2.6, s < 48 ? SAFFRON : side < 0 && s > 66 ? INDIGO : s < 66 ? MADDER : CRIMSON, 1])),
      [134, 1, 2.4, CRIMSON, 1], [183.5, 1, 2.4, CRIMSON, 1], [221.75, 1, 4.7, VIOLET, 0.72], [229.5, 1, 4.7, VIOLET, 1],
    ],
    // The launder (plan.launder: right bank, 6.5 m outside the edge, s 100 to 236): where its trestles stand. Not every
    // 6.2 m as stage 1 stood them: a trestle's feet are 2.2 m apart across the launder and would stand in a vat on the
    // madder steps and on the right terrace, in the copper's slipway (s 106.8 to 109.2) or on a dipping beam (221, 227).
    // Spans of 3.9 to 7.5 m; the trough is stretched to each.
    trestles: [102, 106.3, 110.2, 116.5, 124, 130.2, 136.4, 142.6, 148.8, 155, 161.2, 167.4, 173.6, 179.8, 186, 192.2, 198.4, 204.6, 211, 218, 224, 229.8, 235.5],
    troughUnder: 7.75,                                           // the height of the trough's underside above the water
    // Things put down in one place each: [part, s, side, out, turn (from facing the water; a lodged bough: from lying
    // with the river), dye (none: the place's own)]. Ladders lean on the wall or the trestle behind them (turn pi =
    // their heads away from the water); barrows stand where a load was left; a crock lies where it broke; a coping
    // stone lies in the ford under the place it fell from; a bough has lodged against the upstream side of a rack or a stair.
    props: [
      ['ladder_b', 56, 1, 8.72, Math.PI], ['ladder_b', 72.5, -1, 8.72, Math.PI], ['ladder_a', 121.2, 1, 10.72, Math.PI], ['ladder_b', 226, 1, 5.72, Math.PI],
      ['ladder_c', 116.5, 1, 4.6, Math.PI * 0.5 + 0.2], ['ladder_c', 211, 1, 5.1, Math.PI * 0.5 - 0.15], ['ladder_a', 38.5, -1, 14.72, Math.PI],
      ['barrow', 48, 1, 7.6, 1.9], ['barrow', 68, -1, 7.4, -2.2], ['barrow', 110.6, 1, 5.4, 0.4], ['barrow', 228.6, 1, 9.2, 2.6],
      ['crock', 55, 1, 4.75, 1.1], ['crock', 47, -1, 8.3, 4.0], ['crock', 121.4, 1, 3.7, 2.2], ['crock', 86.5, -1, 4.8, 0.3],
      ['stone', 46, 1, 3.3, 0.6], ['stone', 71.3, 1, 3.5, 2.8], ['stone', 60, -1, 3.4, 4.1], ['stone', 86, -1, 3.2, 1.2], ['stone', 123.2, 1, 2.3, 5.0], ['stone', 226.3, 1, 0.95, 0.9],
      ['drift', 41.4, 1, 2.6, 0.5], ['drift', 67.4, -1, 2.6, -0.4], ['drift', 61.5, 1, 2.05, 0.8], ['drift', 49.6, -1, 2.2, -0.7], ['drift', 131.2, 1, 2.4, 0.3],
      // a mooring post in the ford beside each stair that comes down into it (on the side away from a wringer's post)
      ['mooring', 40.9, 1, 2.0, 0], ['mooring', 62.1, 1, 2.0, 1.3], ['mooring', 81.4, 1, 2.0, 2.4], ['mooring', 119.9, 1, 1.0, 0.7],
      ['mooring', 40.9, -1, 2.0, 3.1], ['mooring', 52.9, -1, 2.0, 1.9], ['mooring', 81.9, -1, 2.0, 0.4],
      // a wet cloth left over the first wall (`out` is not used: it lies on that wall's coping, wherever it is)
      ['drape', 42.6, 1, 0, 0], ['drape', 61, 1, 0, 0, MADDER], ['drape', 77.2, 1, 0, 0],      // (s 61: beside the wringer of postcard 3: madder, not a saffron accent in that picture)
       ['drape', 36, -1, 0, 0], ['drape', 54.6, -1, 0, 0], ['drape', 83.2, -1, 0, 0], ['drape', 111.6, 1, 0, 0], ['drape', 104, -1, 0, 0],
      // the causeway's apron: only what lies low (the sun's line: nothing above a metre there)
      // (THE FIFTH LOOK: cloth laid out on the setts to take the air between the fourth and fifth pans and beyond the second
      // (`spread`: it lies along the kerb's own line, turned a little; `out` is its near end), the basket and the stack beside it)
      ['basket_b', 222.6, -1, 2.5, 0.8], ['rope', 217.3, -1, 1.1, 0], ['rope', 231, -1, 1.2, 0], ['stack_a', 227.3, -1, 1.3, 0.4], ['bucket', 234.6, -1, 1.0, 0],
      ['spread', 224.0, -1, 1.9, 0.12, 5], ['spread_b', 225.9, -1, 2.3, -0.1, 4], ['spread', 219.4, -1, 6.4, 0.3, 4], ['spread_b', 230.3, -1, 8.2, -0.25, 5], ['spread', 211.2, -1, 1.5, 0.05, 5],
      // THE SECOND LOOK. The right bank from the gallery to the door (s 180 to 206; its first riser swings in from 7 m outside
      // the edge to 2 m): a mooring post by its new stair, two cloths over the wall, cloth stacked and a barrow left on the
      // first step, a basket, a broken crock, a fallen coping stone, a ladder against the launder's trestle at s 198.4
      ['mooring', 192.7, 1, 1.7, 2.2], ['drape', 186.4, 1, 0, 0], ['drape', 202.6, 1, 0, 0], ['stack_c', 188.4, 1, 6.5, 0.3], ['stack_a', 204.4, 1, 3.6, -0.5],
      ['barrow', 196.4, 1, 3.9, 2.0], ['basket_a', 193.9, 1, 3.5, 1.0], ['crock', 205.2, 1, 3.0, 0.6], ['stone', 186.0, 1, 5.1, 0.8], ['ladder_a', 198.4, 1, 5.1, Math.PI],
      // the indigo quay east of the house (s 106 to 123.5: the page's six mooring posts; the house brings two): two posts in the
      // ford, clear of the two dipping beams (posts at s 104.8 and 110.4, a cloth going down at s 115.6), and a cloth over the wall
      // (and of the quay's spout at s 119.5)
      ['mooring', 117.6, -1, 1.4, 1.1], ['mooring', 121.9, -1, 1.7, 2.7], ['drape', 121.6, -1, 0, 0],
      // THE SIXTH LOOK. The indigo quay east of the house (s 93 to 114: a level five to fifteen metres deep behind the first
      // wall) had nothing on it: a bare floor behind thirty metres of wall, in front of the house (the survey, `reach_pc_k6s_18.png`).
      // What was carried out of the house and put down on the way to the racks: folded indigo under its boards, a barrow
      // left with its load, baskets, a crock, a coil of rope where the dipping beams' lines are made fast
      ['stack_b', 95.6, -1, 4.5, 0.3], ['stack_d', 101.8, -1, 5.3, -0.4], ['stack_a', 107.5, -1, 4.4, 0.2], ['stack_c', 113.4, -1, 6.2, -0.2],
      ['barrow', 98.6, -1, 6.1, 2.3], ['basket_a', 94.2, -1, 3.9, 1.0], ['basket_b', 103.9, -1, 4.3, 0.6], ['basket_c', 110.6, -1, 4.0, 2.0],
      ['crock', 100.2, -1, 3.8, 0.9], ['rope', 106.2, -1, 3.5, 0], ['bucket', 109.2, -1, 3.7, 0],
    ],
  };
}

// ------------------------------------------------------------------------------------------------ the machines (stage 2: heroes_c.js; docs/build/reach/2-heroes-machines.md)
// Where every machine of the works stands and how it runs (page section 5, "Machines": nothing starts from rest, nothing
// is in step with its neighbour: every one has a phase of its own here, and a cue may only set it).
// A place is `at: [s, d]` (d metres right of the centre line) and `y`, the height of what it stands on; `turn` is radians
// added to facing the channel (on the right bank a positive turn swings its front upstream; on the left bank, downstream).
{
  const { MADDER, CRIMSON, VIOLET } = PLAN.dye;
  PLAN.machines = {
    // ---- the wringers (page: nine; 3.5 turns in 5 s, hold 2 s, unwind in 4 s, rest 5 s; the skein shortens by an eighth
    // and its post leans in 0.3 m). `steps` is the toolkit's makeMachine cycle, in turns of twist. `file`: which staining.
    // (AS BUILT: the page's (66, 15.5) and (78, -15.5) stand 0.9 m and 0.2 m behind the first riser, with no room for a
    // trestle 3 m deep: both stand a little further in, and are turned so that the rider abreast sees wheel and skein both.)
    // (second look: the skein is one ridged hank now: `sag` is how far its middle hangs slack, `squeeze` how far its section is drawn in when wrung)
    // (third look: the skein is six cords of yarn round one middle line: `rope` is the radius of the rope they are wound into; `squeeze` is no longer read)
    wring: { steps: [[5, 3.5], [2, 3.5], [4, 0], [5, 0]], turns: 3.5, shorten: 0.125, lean: 0.3, length: 2.4, sag: 0.34, squeeze: 0.5, rope: 0.082 },
    // The gallery's five stand on its floor at the water's edge (`gallery: [u, v]`: metres along the gallery from its middle and
    // toward its back, in the gallery's own frame: plan.gallery.at, long side along the route); their posts stand in the lagoon,
    // 0.2 to 2.6 m inside the channel's edge, each with a collider (`collide`).
    // (second look: no longer one in the middle of each bay. The yards' launder comes down through the gallery: its legs stand at
    // u -15.7, 8.0 and 14.4 inside the room, and a wringer's trestle stood on two of them. As m_gallery.py now has its bents.)
    // (AS BUILT, the terrace's two: the page's (214, 12) is where the door's north mast stands (s 214.4); a wringer reaches 3.6 m
    // from its trestle to its post and the terrace's wall is 1.6 m from the channel's edge, so both are turned half along the
    // bank, their posts in the strip of water under the wall: (209, 12.0), the head of the terrace before the door, and (237.6, 11.4).)
    // (`tint`: nine copies of one model: each a shade of its own, so that no two neighbours are the same wood)
    wringers: [
      { name: 'nave right', tint: '#ffffff', at: [66, 15.8], y: 0.9, turn: -0.52, dye: CRIMSON, file: 'red', phase: 0.02, way: 1 },      // postcard 3: phased by staging to reach full twist as the boat is abreast
      { name: 'nave left', tint: '#f4e8e2', at: [78, -16.6], y: 0.9, turn: 0.38, dye: CRIMSON, file: 'red', phase: 0.55, way: -1 },
      { name: 'gallery 1', tint: '#f6ebe6', gallery: [-11.8, -1.7], turn: 0.05, dye: CRIMSON, file: 'red', phase: 0.31, way: 1, collide: 0.4 },
      { name: 'gallery 2', tint: '#e6dad8', gallery: [-4.5, -1.7], turn: -0.04, dye: MADDER, file: 'red', phase: 0.74, way: -1, collide: 0.4 },
      { name: 'gallery 3', tint: '#fff6ee', gallery: [3.4, -1.7], turn: 0.02, dye: CRIMSON, file: 'red', phase: 0.12, way: 1, collide: 0.4 },
      { name: 'gallery 4', tint: '#ecdfda', gallery: [11.2, -1.7], turn: -0.06, dye: MADDER, file: 'red', phase: 0.47, way: 1, collide: 0.4 },
      { name: 'gallery 5', tint: '#f9eee6', gallery: [17.3, -1.7], turn: 0.03, dye: CRIMSON, file: 'red', phase: 0.88, way: -1, collide: 0.4 },
      { name: 'terrace head', tint: '#f2e8ea', at: [209, 12.0], y: 0.9, turn: 0.9, dye: VIOLET, file: 'violet', phase: 0.2, way: 1 },
      { name: 'terrace foot', tint: '#ffffff', at: [237.6, 11.4], y: 0.9, turn: 0.9, dye: VIOLET, file: 'violet', phase: 0.63, way: -1 },
    ],
    // ---- the undershot wheels with their gears (page: 6 m across, 1.6 m wide, once in 16 s; a crown wheel of 48 pegs and a
    // lantern pinion of 12 staves on an upright shaft). The toolkit's makeWaterWheel turns them by the water: `flow` m/s past
    // them, the floats at `slip` of it (half: a wheel doing work), which is one turn in 16 s; the lantern by gear().
    // `wall`: the model is placed by the face of the terrace's wall, which stands this far outside the channel's edge (the
    // land's riser is at 1.6; the wall's stone stands a hand proud of it). The wheel is a metre wide and turns in the 1.6 m
    // of water between that wall and the boat's channel; its bridge beam stands 0.1 m outside the channel's edge.
    // (AS BUILT: both on the right terrace, as stage 1 left them: plan.rightTerrace.wheels and the note above it.)
    undershot: {
      radius: 3.0, width: 0.96, floats: 16, flow: 2.4, slip: 0.4909, teeth: [48, 12], wall: 1.72,
      drips: 220, dripColor: '#b08ab4',                             // what the floats shed: the terrace's violet water, a little paler
      near: [{ name: 'terrace wheel', s: 230, phase: 0.08 }, { name: 'upper terrace wheel', s: 221.5, phase: 0.57, slip: 0.468 }],      // (the upper one a little slower: 16.8 s: the two are never in step)
      // the five far wheels down the sun road (plan.farWheels: x, z, metres across), each turned `turn` degrees toward the
      // lagoon so that it reads as a wheel from there (stage 1's choice, kept), each on its own period (page: 14 to 18 s)
      far: { turn: 35, periods: [14, 15.5, 17, 16, 18], phases: [0.1, 0.45, 0.8, 0.27, 0.62], tint: ['#ffffff', '#f4e6e6', '#ead8dc', '#e0ccd4', '#d8c4d0'] },
    },
    // ---- the dipping beams (page: six; a counterweighted beam 9 m long lowers a cradle of cloth in 4 s, soaks 10 s, lifts in
    // 5 s and holds it up 21 s while it turns from green-gold to teal to its blue, from the top down; the four 10 s apart).
    // `steps` is the toolkit's makeMachine cycle (0 = down in the dye, 1 = held up). A beam lies in one plane, ALONG the bank,
    // so that the lagoon sees the whole of it side on and its cloth face on. `toward`: 1 = its tip points down the route, -1 up.
    // (The four in the water lie along the channel's EDGE, tip and post the same `out` from it: the lagoon widens by a metre
    // in two at s 100, and laid along the centre line the first one's tip hung over the quay. heroes_c.js works that out.)
    // (AS BUILT. The indigo house keeps its own frontage (plan.houses.indigo.frontage) and all six of its vats lie under its
    // hanging bolts, so the house's four beams stand IN THE WATER in front of the quay, two east of the house and two in the
    // mouth of the blue yard, 1.1 to 1.9 m outside the channel's edge, and dip their cloth in the river itself, where the
    // indigo runs in: the page's own idea, the river dyes the cloth. They are in postcard 4's left, green on the yard's blue.
    // The terrace's two stand on its second step and dip into the kit's vats at (215, +8.5) and (233, +8.5); the page's
    // (221, 15) and (227, 15) are the middle of that step with no vat in reach.)
    // ---- the tipping copper (page: every 48 s tilts 55 degrees in 6 s, pours for 4 s, rights itself in 8 s, refills). `steps` is
    // the toolkit's makeMachine cycle, in degrees of tilt. plan.copper has its place: the tub 17 m outside the channel's edge
    // at s 108 on the top terrace, the slipway's three lips over the three risers (11, 7 and 3 m outside the edge).
    // (second look: `chine`: the foot of the tub's back, a rope's thickness outside it, behind and above the trunnions as `ring` is.
    // Tipped, the tub's back swings across the straight line from the windlass to the ring: the rope then lies up the tub's back from there.)
    copper: { steps: [[6, 55], [4, 55], [8, 0], [30, 0]], phase: 0.45, s: 108, out: 17, foot: 3, trunnion: 5.25, ring: [1.84, 0.98], drum: [2.75, 4.22], chine: [1.67, -1.35] },
    // ---- the lifting wheel (page: 9 m across, once in 20 s, a bucket into the launder every 1.25 s; its header trough at 8.5 m).
    // The toolkit's makeWaterWheel: the lagoon's 2 m/s past it and its floats at 0.707 of that is one turn in 20 s.
    // (AS BUILT: the page's (130, 32) lies 3 to 5 m outside the channel's edge and half inside the bank's first step, which
    // swings inland just there: the wheel stands IN THE WATER, its plane 1.5 m outside the channel's edge and parallel to
    // that edge (not to the centre line: the lagoon is widening), and its header runs back over the bank to the launder's line.)
    liftingWheel: { s: 130, out: 1.5, along: [126, 134], radius: 4.5, width: 1.1, floats: 16, buckets: 16, flow: 2.0, slip: 0.7069, phase: 0.3, drips: 320, dripColor: '#c08a8c' },
    // ---- the wringing gallery's line shaft (page: the whole length on hangers, nine wooden pulleys, rope belts): one turn in
    // `shaft` seconds; the counter pulley behind each wringer's axle turns by the belt (its radius to the driving pulley's)
    // (third look) `hanks`: the wrung hanks hung under its eaves on five poles (m_gallery's `hpole<i>a/b`; one model, m_hank, hung many
    // times): a place every `every` metres of pole, filled in bunches of `bunch` with `bare` places between; each `long` times the model's 1.25 m and `fat` times
    // its girth; its dye one of `dyes` at `tone` times the chip (deep: nothing here may read as a small warm light); `drip`: its
    // lowest point below the pole, for a hank of length 1
    gallery: { shaft: 6, drive: 0.5, counter: 0.35, hanks: { poles: 5, every: 0.29, bunch: [3, 7], bare: [2, 4], long: [0.74, 1.18], fat: [1.05, 1.5], dyes: [CRIMSON, CRIMSON, MADDER, CRIMSON], tone: [0.62, 0.98], drip: 1.55, seed: 613 } },
    dip: {
      steps: [[4, 0], [10, 0], [5, 1], [21, 1]],
      arm: 5.2, butt: [-3.72, -0.2], drum: [-0.38, 1.38], drumRadius: 0.13, bar: 1.0, clothTop: 0.97, cloth: 3.0, pin: 4.7,      // the model's own measures (m_dipbeam.py)
      fresh: '#B9B04A', teal: '#3F8A86', turns: 20,                 // green-gold as it leaves the dye, teal, then its own dye within 20 s
      swing: { period: 3.2, rest: 0.016, after: 0.055 },            // it hangs, and swings a little when the beam stops (radians)
      // (second look) THE TERRACE'S TWO ARE GEARED TO THE TERRACE'S WHEELS, as the page asks ("an undershot wheel ... geared to two
      // dipping beams"): each goes through its cycle in exactly `geared` turns of the wheel beside it (2.5 turns of 16 s is the
      // page's 40 s; the upper wheel's 16.8 s makes its beam's 42 s: the two are never in step). heroes_c.js.
      geared: 2.5,
      // (second look: the four in the river go down to 40 and 41 degrees: the bar comes to a hand above the water and nearly all
      // the cloth goes under. At 35 the 0.7 m of cloth left showing read as a flat blue panel.)
      beams: [
        { name: 'east quay 1', bank: -1, s: 104.8, out: 1.1, toward: -1, land: false, y: 0, level: -0.04, up: 24, down: -41, dye: 5, phase: 0.0 },
        { name: 'east quay 2', bank: -1, s: 110.4, out: 1.8, toward: 1, land: false, y: 0, level: -0.04, up: 22, down: -40, dye: 5, phase: 0.25 },
        { name: 'blue yard 1', bank: -1, s: 148.4, out: 1.2, toward: -1, land: false, y: 0, level: -0.04, up: 25, down: -41, dye: 5, phase: 0.5 },
        { name: 'blue yard 2', bank: -1, s: 153.6, out: 1.9, toward: 1, land: false, y: 0, level: -0.04, up: 23, down: -40, dye: 5, phase: 0.75 },
        { name: 'terrace 1', bank: 1, vat: [215, 8.5], reach: 4.3, toward: -1, land: true, y: 1.9, level: 2.91, up: 24, down: -23.5, dye: 4, phase: 0.4 },
        { name: 'terrace 2', bank: 1, vat: [233, 8.5], reach: 4.3, toward: 1, land: true, y: 1.9, level: 2.91, up: 22, down: -23.5, dye: 4, phase: 0.9 },
      ],
    },
  };
}

// ------------------------------------------------------------------------------------------------ the frames (stage 2: kit_frames.js; docs/build/reach/2-kit-frames.md)
// The timber the cloth hangs from. Rails are not placed by numbers here: kit_frames.js builds every rail from the bolts
// as kit.js hung them (a rail's axis lies in its cloth's plane, `rise` metres above the top edges).
// THE NAVE'S MASTS do not stand on the plan's points (half width + nave.mast.out, in the rank's plane): the rank's outer
// bolt reaches d 12.1 and hung through a mast there at four frames of six. A mast's FOOT stands `back` metres up-route of
// its rank's plane and `inside` metres nearer the channel than the plan's point (inside the aisle wall's cloth); it leans
// until it touches the yard (down-route) and the wall plate at nave.aisle.plate (outward). Mast heads as built:
// shared.frames.heads (about 0.3 m up-route and 0.25 m inside of the plan's axis).
{
  PLAN.frames = {
    rise: 0.035,                                                 // a rail's axis above the top edges it carries
    ring: 0.27,                                                  // metres between rope rings along a rail
    nave: { back: 0.75, inside: 0.56, inYard: 0.3, plate: 0.108, rise: 0.035 },      // inYard: how far inside the plan's d a mast is where its yard crosses it; plate: the wall plate's radius
  };
}

// ---------------------------------------------------------------------------------------- the houses (stage 2: heroes_b.js)
// Added by the builder of the indigo house, the cloth loft, the west front frame, the door masts and the chimney
// (docs/build/reach/2-heroes-houses.md). Nothing above is changed; these are facts of the models, for the kit and the cast.
PLAN.houses = {
  // THE INDIGO HOUSE in its own frame: u metres along the route from s 124 (downstream is +u), v metres toward the channel
  // from d -37 (the model's x = u, its -y = v). It stands on the 0.8 m quay with its water-side posts on v = +7. The land's
  // first riser (the quay wall, 3 m outside the channel edge) crosses that line at u = 0: from u = 0 westward the front
  // stands over the ford on piles. In the ride ask the model for its places: shared.indigoHouse (vats, poles, nests, stair, moor).
  indigo: {
    trusses: [-14, -7, 0, 7, 14],                   // u of the five bents: the eight hanging bolts (u -10.5, -3.5, 3.5, 10.5) hang mid-bay, on poles 6.87 m up
    floorTop: 0.86,                                 // top of the planks (they lie 6 cm proud of the quay)
    eavesEdge: [7.9, 6.5], ridge: 11.6, ventTop: 12.95,    // the eaves edge is 7.9 m from the middle and 6.5 m up; the ridge vent is a small roof riding over the ridge above the middle vats on posts 1.05 m tall (u -5.7 .. 3.95, 1.1 m between its post lines, 1.7 m wide at its eaves, the sky seen through its open sides from the water, its own ridge 12.95 m: sixth holder; it was 12.76)
    vats: [[-10.5, 3.4], [-3.5, 3.4], [3.5, 3.4], [10.5, 3.4], [-3.5, -3.2], [3.5, -3.2]],      // u, v of the six sunk vats (2.6 m across): four under the water-side bolts, two behind
    vatRim: 1.28,                                   // their lips stand 0.42 m above the floor; the liquor lies 0.14 m below the lip (NOT seen from the boat: the eye is 1.1 m up)
    poles: [-10.5, -3.5, 3.5, 10.5],
    // THE HOUSE'S OWN FRONTAGE: its water stair goes down into the ford between u 0.9 and u 6.3 (v 7.2 to 9.5, square to the
    // river), with a mooring post either side; piles carry the floor's edge from u 0 to u 14.3. Kit steps, wall modules, posts,
    // spouts and dipping beams: keep out of u -0.5 .. 14.6, v 6.9 .. channel edge (s 123.5 to 138.6 along the left edge).
    frontage: { u: [-0.5, 14.6], s: [123.5, 138.6] },
    // (the land's second and third risers cross the house's back upstream corner: from u -14 to -3.5 the 1.9 m terrace
    // lies inside the footprint beyond v = -2.8 .. -7; two of the racks stand on it)
  },
};

// ------------------------------------------------------------------------------------------------ the cloth (stage 2, the kit: docs/build/reach/2-kit-cloth.md)
// How the sun comes through cloth that hangs in folds (light.js, reachGlow). `passes`: what a cloth passes on to the
// next one behind it (the layout's 0.5 left the near arches without any of the sun; with folds to model them they can
// take more). The ribs: where a fold turns the weave edge-on, `ribDark` of the glow is left, and it is deeper in the
// dye's own colour by the power 1 + `ribDeep`; the glow that is not the sun's own is `ribAway` for an eye that looks away
// from the light and `ribAway + ribInto` for one that looks straight into it. (&tune=sun.ribDark:0.2 tries others.)
Object.assign(PLAN.sun, { passes: 0.62, ribDark: 0.3, ribAway: 0.55, ribInto: 1.5, ribDeep: 1.2 });

// ------------------------------------------------------------------------------------------------ the cloth, second look (docs/build/reach/2-kit-cloth.md, "Second look")
// THE GLOW. Cloth that hangs between the eye and the west must be brighter than the sky behind it (the key painting's
// backlit cloth measures 125 against a sky of 107; ours was 90 against 148: matte curtains). `ambient`: what the western
// sky sends through cloth (was 0.34); the glow is `ribAway` of that for an eye that looks away from the light and
// `ribAway + ribInto` for one that looks straight into it, gathered toward the light by the power `ribPow` (4 was a
// narrow cone: only the cloth round the wheel glowed; 3 lets a whole arch glow and leaves the nearest cloth, at the
// picture's edges, as its dark frame); `ribUp`: how much of that an eye that looks UP through a cloth loses (it looks at
// the high sky, not at the west: 0 = nothing, 1 = by the full angle); `ribDark`: what is left of the glow in a rib.
// (light.js, reachGlow: what stands behind a cloth is the west = 1, the sky to the side = 0.5, the dusk in the east = 0;
// the glow is ribAway * (0.6 + 0.8 * that) + ribInto * that ^ ribPow.) `cap`: the page's rule, backlit cloth never
// brighter than 1.35 times its lit-from-behind colour (cream 1.5).
// THE COIN is no longer a flat disc: `coin.heart` of the sun's own gold stands in its middle, its edge is `coin.edge` as
// bright as its middle, and the weave scatters a `halo` round it in the dye's lit colour (reach and width in degrees;
// `form`: how much of the cloth's own ribs lie across coin and halo).
Object.assign(PLAN.sun, { ambient: 0.62, ribAway: 0.45, ribInto: 1.9, ribPow: 5, ribUp: 0.6, ribDark: 0.2, ribDeep: 1.4, cap: [1.35, 0.15], halo: { reach: 18, width: 4, strength: 1.0, form: 1 } });
Object.assign(PLAN.sun.coin, { heart: 1.0, edge: 0.3, gold: '#FFD890' });

// ------------------------------------------------------------------------------------------------ the cloth, second look taken over (docs/build/reach/2-kit-cloth.md, "Second look, taken over")
// THE FOLD IN THE GLOW (light.js, reachGlow): one number says how OPEN the cloth stands to the light at a place (square to
// it, single, thin: 1; edge-on, in a valley, in a pleat, double: toward 0). Open cloth is its dye's lit colour; closed cloth
// is a rib: `ribDark` of the glow, deeper in the dye's own colour by the power 1 + `ribDeep`. `ribHot`: on the middle of a
// lobe, where the cloth is thin or soaked, it is lighter than its lit colour (toward that colour to the power 0.75).
// `ribNext`: THE DYER'S SCALE RUNS INTO THE SHADOWS: [how far a rib's glow goes toward the NEXT dye of the scale lit from
// behind, how far the shade on a cloth's face goes toward the next dye's hue]: gold cloth folds orange and red, red cloth
// crimson, violet cloth blue (the key painting's own shadows), never brown.
Object.assign(PLAN.sun, { ribHot: 0.35, ribNext: [0.7, 0.6] });

// ------------------------------------------------------------------------------------------------ the cloth, fourth look (docs/build/reach/2-kit-cloth.md, "Second look, taken over again")
// THE FACE OF A CLOTH (light.js, reachFace). A dye is not a paint: multiplied down by shade and by this sky's rose light,
// saffron is rust and its folds are brown (the first third of the nave was planking). A cloth's face keeps its own colour
// from full value down to a floor and runs down the dyer's scale as it goes into its shade (`ribNext[1]`).
// `faceFloor`: dye by dye (cream .. indigo), how far down its shade may go, as a share of its chip's own value: the pale
// dyes least (a dark yellow IS brown), the dark dyes deep. `face`: [the share of its chip's value in the open shade below
// which a place is wholly in its shade, how much lighter than its chip the sun makes it, how much of the light's own
// colour it takes]. `ribTau`: against the light a cloth is OPEN by the length of the light's way through its weave,
// exp(-ribTau (1 / f - 1)), f = how square the weave stands to the light (was f squared: bright gaps between dark boards).
// `faceNext`: dye by dye, how far its shade (and its rib against the light) runs toward the NEXT dye: gold to orange and red,
// madder to crimson, violet to indigo; crimson hardly at all (its next is violet, and half way there is a candy magenta).
// `ribNext` are now two multipliers on it ([the rib's glow, the face]).
Object.assign(PLAN.sun, { faceFloor: [0.5, 0.45, 0.3, 0.26, 0.26, 0.26], faceNext: [0.75, 0.65, 0.6, 0.16, 0.55, 0.0], face: [0.3, 0.6, 0.35], ribTau: 0.8, ribNext: [1, 1] });
// THE WHEEL'S GORES (the engine's makeGores().look, switched on from light.js): heavy wet cloth. `goreLook`: pegs to a metre
// of rail, metres the top edge sags between two pegs, metres the hem is bitten short, how soaked its long end is, and the
// mesh the sag and the bites are cut in (the monument's own call makes 20 by 10).
Object.assign(PLAN.sun, { goreTear: 1.0, goreRibs: 1.0, gorePleat: 0.5, goreLook: { pegs: 1.05, sag: 0.26, ragged: 1.1, wet: 1, segments: [56, 14] } });

// ------------------------------------------------------------------------------------------------ the cloth, fifth look (docs/build/reach/2-kit-cloth.md, "Second look, taken over a third time")
// GOLD CLOTH WAS STREAKED LIKE BACON: a rib's glow is raised to the power 1 + `ribDeep` and run toward the next dye, which
// for saffron is rust. `ribDeepBy`: dye by dye (cream .. indigo), how much of that deepening it takes (the pale dyes little:
// the rib of a gold cloth is amber, then orange); `faceNext` for saffron 0.45 (was 0.65).
// AND THE SCALE RUNS UP INTO THE LIGHT (light.js, reachGlow): `glowUp` times `glowUpBy` (dye by dye): how far wholly open
// cloth (square to the light, single, thin) glows toward the dye BEFORE its own: red cloth orange where it is thinnest,
// violet cloth rose. With the ribs running DOWN the scale a single cloth then holds three neighbouring hues, as the key
// painting's do. (&tune=sun.glowUp:0 switches it off.)
Object.assign(PLAN.sun, { faceNext: [0.75, 0.45, 0.6, 0.16, 0.55, 0.0], ribDeepBy: [0.4, 0.5, 1, 1, 1, 1], glowUp: 0.42, glowUpBy: [0, 0.6, 0.9, 1, 0.9, 0.7] });
// (and from a boat's length the runs and mottle of pale cloth were the grain of a plank: `faceFloor` for cream and saffron 0.68 and 0.6 (were 0.5, 0.45): its paint goes less far down)
PLAN.sun.faceFloor = [0.68, 0.6, 0.3, 0.26, 0.26, 0.26];
// THE WHEEL'S GORES were a sheet of corrugated iron from under the rose: a crease from every peg to the hem, folds as even as
// flutes. `uneven` (the engine's makeGores().look, new): most creases faint, each dying out at its own depth, one in four
// deep and whole; the folds flat here and gathered there.
PLAN.sun.goreLook = { ...PLAN.sun.goreLook, uneven: 1 };
// THE COIN'S HEART was the pale gold of the high sun (#FFD890): through indigo, times the coin's own brightness, a white moon.
// The page's last picture is "a dim blue-gold coin": the low sun's own deeper gold in its heart, the dye's blue at its limb.
PLAN.sun.coin.gold = '#E8A040';

// ------------------------------------------------------------------------------------------------ the cloth, sixth look (docs/build/reach/2-kit-cloth.md, "Second look, taken over a fourth time")
// THE WHEEL'S GORES WERE PALE FLAT PANES: against the light the colour of the sky behind them (from the west front the
// wheel stood bare), pastel sheets from under the rose. `goreLook6` (the engine's makeGores().look, new options; light.js
// lays them over `goreLook`; &oldgores=1 leaves them out): `runs`: the dye has run down them in streaks of three widths;
// `deep`: they are heavy with dye and let this much less of the light through (they glow deep, not pale); `strips`:
// metres of hem that hang in flaps and threads; `bleed`: their two dyes run into one another over metres; `lobe`,
// `fine`: metres the cloth stands out between each pair of pegs, and of finer folds on that (the lanes are 0.3 m apart
// and the frames' legs 0.4 m beyond the outer one: keep lobe + fine under 0.15).
PLAN.sun.goreLook6 = { runs: 1, deep: 0.42, strips: 1.5, bleed: 1, lobe: 0.1, fine: 0.04, lobeVary: 0.7, tear: 0.35, segments: [96, 16] };
// `ribFlat`: cloth that lies level overhead (the vault's swags, a streamer) stands open to an eye that looks up through it
// at the sky (light.js, reachGlow: as found it was edge-on to everything, one flat rib from tie to tie).
PLAN.sun.ribFlat = 0.85;

// ------------------------------------------------------------------------------------------------ the monument as built (stage 2: heroes.js; docs/build/reach/2-monument.md)
// Added by the builder of the great wheel (rotor, frames, pier). Nothing above is changed; these are facts of the three
// models, for the cloth, the cast and staging. Metres; `world` values are the realm's x, z. In the ride ask the models
// themselves for their places: shared.wheel.points.<rotor|frames|pier>.point(name), shared.wheel.rim(), shared.wheel.floatTip().
PLAN.monument = {
  // the rotor: its rims are two courses of felloes (the page's, and a second inside it), their outer faces 1.625 m from
  // the mid-plane; floats and cheeks reach 1.75 (the cloth's first lane is 1.85)
  rim: { inner: 13.85, outer: 15.0, face: 1.625, floatsTo: 1.75 },
  floats: { every: 7.5, first: 3.75, missing: [17, 38], split: 29, fresh: 6 },      // degrees in the wheel's own count; boards that are gone, split, new
  // a peg rail is held off its arm ONLY at these radii: worked out for every wheel angle, they (and anything inside 3.85 m
  // or beyond 10.2 m of the axle) are the only places where no other arm's cloth ever crosses the gap between arm and rail
  rails: { from: 3.35, to: 14.62, standoffs: [3.6, 10.5, 12.4, 14.3], clear: [[1.6, 3.85], [10.2, 15.75]], pegEvery: 0.475 },
  // the frames (rebuilt in the second look): two A-FRAMES, their legs meeting in a plumb joint under the axle (apex 14.9 m),
  // the bearing astride the apex: since the third look an eight-sided HEAD BLOCK 2.5 m across, its top 16.45 m (nothing of
  // the frames stands higher). Each stands on a ground tie (2.5 to 3.05 m above the water) laid across two stone footings
  // of the pier. Nothing joins the two across the wheel. (`top` was 15.8 until the third look.)
  frames: { apex: 14.9, top: 16.45, headBlock: 2.5, leanDegrees: 30.9, groundTie: [2.5, 3.05], ties: [6.4, 10.3], legAcross: [1.25, 1.02], legThick: 0.84 },
  // FOURTH LOOK: two moving parts besides the wheel's own turning (heroes.js turns them; ask shared.wheel.loose / .hoist).
  // `loose`: the broken half of float 29 hangs by a rope bridle on its start's old drift bolt, 14.62 m from the axle and
  // 0.66 m from the mid-plane on the far side, and stays plumb as the wheel turns: 1.25 m of board whose foot trails
  // 0.3 m deep through the pit for 8.5 s at the bottom of every turn. `hoist`: a gin block at the south end of the lagoon
  // frame's upper tie (metres from the hub along the pier, from the mid-plane toward the lagoon, above the water), a
  // basket of wet cloth hanging 5 m below it. `drapes`: wet cloth thrown over the lagoon frame's ground tie (metres along
  // the pier from the hub). FIFTH LOOK: remade as heavy cloth in pipe folds: an indigo bolt (hem 1.6 m above the water),
  // a violet piece (2.0 m), and between them `wrung`, a length twisted into a rope (its long end 1.7 m above the water)
  loose: { float: 29, radius: 14.62, axial: -0.66, board: 1.25, dipsFor: 8.5 },
  hoist: { block: [-3.1, 4.35, 9.9], basket: 5.1, rope: 5.0, period: 4.5 },
  drapes: [[1.15, 3.45], [-3.95, -2.85]], wrung: -1.85,
  // FIFTH LOOK: every arm is two lengths scarfed between the rings of chords (7.0 to 9.35 m from the axle, each at its
  // own radius), strapped and wedged; the wedges' ends stand 0.11 m out of the arm's edges IN THE WHEEL'S PLANE (no
  // timber was added toward the cloth). Float boards 0.125 m thick.
  arms: { scarf: [7.0, 9.35], wedgeOut: 0.11 }, floatThick: 0.125,
  // SIXTH LOOK: the hoist's basket is a wicker hamper 0.8 m across (rim 5.1 m above the water), a length of wet violet
  // cloth hanging 1.07 m out of it on its south-lagoon side: the point `hoist_drip` is that cloth's lowest corner now
  // (it was under the basket's foot). Its rope and sling are a slot of their own, `line`, drawn crisp. Each sluice's hand
  // wheel has a rim (1.9 m across) and six hand pegs. The weir's wattle is a hurdle of five rows, its lip 0.5 m above the
  // water (0.38 toward the bank), ragged, two stretches of its top rows gone: `weir.lip` below, points weir0 .. weir5.
  // the pier: both ends closed by an arch with a deck humped 0.3 m; a sluice frame (gates, racks, windlass) at the pit side
  // of each; the steps on the lagoon face. THE WEIR as built starts at the far (west) wall's south corner, not at the
  // middle of the south end (wheel.weir.from above), so that the south arch's mouth lies on the lagoon's side of it
  pier: { deckHump: 0.3, sluiceWorldX: [11.62, -18.62], sluiceHead: 2.95, rackTop: 5.9, steps: { worldX: [4.4, 7.4], footWorldZ: -198.6, treads: 7, rise: 0.15 },
    // four stone footings under the frames' feet (second look): metres either side of the hub along the pier and from the
    // wheel's mid-plane across it; their tops 2.5 m above the water. The cloth hangs no further out than 2.7 m
    footings: { along: [4.55, 7.75], across: [2.78, 4.28], top: 2.5 } },
  weir: { from: [-20.9, -210.45], to: [-34, -197], lip: 0.5 },      // (lip 0.3 until the sixth look)
};

// ---------------------------------------------------------------------------------------- the houses, second look (heroes_b.js)
// Added at the second look at the houses (docs/build/reach/2-heroes-houses.md, "Second look"). Nothing above is changed.
// In the ride ask the models for their places: shared.indigoHouse.tubs, shared.lampStanding, shared.loft.
Object.assign(PLAN.houses.indigo, {
  // two staved tubs standing IN THE FORD west of the stair, on the house's own frontage: [u, v, radius, rim above the water]
  // (the house's frame: u along the route from s 124, v toward the channel from d -37). Their liquor lies 5 cm below the rim
  // and IS seen from the boat, which the six vats' is not: foam rafts, drips and rings belong here first.
  tubs: [[8.55, 8.42, 0.8, 0.6], [11.85, 8.3, 0.66, 0.52]],
  // a boarded wall closes the land side (v = -7.2) from the floor to the plate, with a doorway at u -2.3 .. 0.15
  backWall: { v: -7.2, door: [-2.3, 0.15], top: 5.97 },
});
PLAN.houses.lampStanding = {
  // a king pile 2 m out of the water, 0.25 m west of the lamp's pole, and two rakers: they reach 0.8 m either side of the pole at
  // the waterline. One collider: world (lamp x - 0.05, lamp z - 0.36), r 0.95.
  collider: [-0.05, -0.36, 0.95], kingTop: 1.98,
};
PLAN.houses.loft = {
  // on the reach's half only: a HAY HOOD (fourth holder: the main roof's two slopes run on past the gable to a point; `out`: its
  // point stands that far beyond the roof's front edge, which is 0.85 m in front of the first bent: 3.3 m in all; `half`: half
  // its width where it leaves the roof; `top`: the top of the pendant at its point), a louvred lantern on the ridge
  // over s 243 .. 250 (to 14.2 m: the master section's ridge stays 13 m), NO far end (the sun's line runs down the shed)
  hood: { out: 2.45, half: 2.3, top: 13.25 }, lantern: { s: [243, 250], top: 14.2 }, farEnd: false,
};
