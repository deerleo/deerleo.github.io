// The standing sky: the area's numbers, taken from docs/art/sky.md. Plain data and small functions, no three.js.
// Every module of the area reads this, so that a thing is in the same place in all of them.
//
// Reading the numbers: `s` is metres along the path from its first point, `d` metres to the RIGHT of the centre line
// (negative = left), heights are above still water. Convert with kit.at(s, d, y). East is dead ahead (-z), north is
// to the left (-x), the west and the snow cloud are behind. The path's centre line IS the composed line: a boat left
// alone is carried along it.
//
// ADD to this file under a heading of your own; change a number that is here only when the page says it is wrong,
// and say so in your log (docs/build/sky/).

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
/** Piecewise-linear table lookup: pts = [[x, y], ...] in rising x. */
export const table = (pts, x) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); }
  return pts[pts.length - 1][1];
};

// ------------------------------------------------------------------------------------------------ the route
// The page's route is straight, with the kept lamp ON the line at s 136. A lamp on the line is wrong for a ride that
// carries the boat along the line (docs/build/sky/1-layout.md, "does not work as written", 1): a boat left to the
// current runs its bow into the post. (With the ride's first boat there was a second reason: the point dead ahead on
// the seam lay behind the boat's own iron crook. The remodelled boat's lantern hangs lower and to starboard, and that
// reason is gone; the first stands.) So the route stays the page's straight line and the LAMP moves: its flame hangs
// 3 m left of the line, at the head of the line of stakes (which stand at d -3 already). From the reveal it is 1.7
// degrees left of dead ahead, at the foot of the Milky Way (which rises 4 degrees left); the boat passes 3 m to its
// right and hears its note.
// (A step in the line was tried first: straight at the lamp until s 96, then 3 m to the right. `by` is its size; 0 = none.)
const JOG = { from: 96, to: 132, by: 0 };
const lineX = (s) => JOG.by * smooth(JOG.from, JOG.to, s);
// [s, half width]. The page: 18 m widening to 28 m in the mist; 70 m of open mirror to s 150; 44 m between the
// causeways to s 232; 60 m across the flats. The engine stops a boat 6 m short of the end of a path that has an end
// stop, and slows it over the 24 m before that: the path runs 6 m past the page's 316 so that the page's "the boat
// stops being carried at s 316" is true and the current holds its 1.0 m/s past the far jetty.
const WIDTHS = [[0, 9], [26, 14], [44, 35], [70, 35], [96, 35], [102, 35], [108, 35], [114, 35], [120, 35], [126, 35], [132, 35], [144, 35], [153, 22], [190, 22], [229, 22], [240, 30], [280, 30], [322, 30]];

export const PLAN = {
  path: { softEdges: true, endStop: true, points: WIDTHS.map(([s, hw]) => [lineX(s), -s, hw]) },
  jog: JOG,
  end: 316,                                    // the page's last metre; the path itself is 322 m long (see above)
  zones: { mist: [0, 26], mirror: [26, 150], works: [150, 232], flats: [232, 316] },
  acts: { plumbLine: [26, 96], falseDawn: [96, 196], firstLight: [196, 316] },
  depth: { line: 0.18, edge: 0.05 },           // the lake: a hand deep along the line, a finger at the soft edges

  // ---- painted art that exists (tools/art.py; flipped on as each picture is packed into assets/art/sky/)
  art: { milkyway: true, horizonNight: true, horizonDawn: true },

  // ---- the page's chips and the colours the cast carries
  colors: {
    ink: '#0B1034', ultramarine: '#1C2C7C', violet: '#6A509C', rose: '#C06A98', jade: '#58C49C', jadeCore: '#B4F0D2', starWhite: '#E6EEFF',
    apricot: '#F2A769', chalk: '#F7ECD2', dawnShadow: '#8E86B0', greenGold: '#E6DFA2',
    amber: '#FFB45E', amberCore: '#FFE2A8',
    saltNight: '#5C6DB4', saltRim: '#84D6BA',                     // what chalk looks like by starlight and under the aurora (the light makes them: see light.js)
    flamingo: '#F3879B', covert: '#D5405F', flightInk: '#1A1420', flamingoUnlit: '#9A93B8', plumage: '#EDE3EA',      // plumage: a bird's local colour out of the sun (the light makes flamingoUnlit of it)
    brine: '#A9583A', brineShallow: '#C98A86', timber: '#8C8494', timberDawn: '#B9A692', ternCap: '#15162E',
    sand: '#CFC6BE', iron: '#3A3440', sedge: '#8E9484',
  },

  // ---- the dawn clock: everything follows the boat's distance along, never the clock (the page's section 2)
  dawn: (s) => smooth(170, 290, s),                               // the page's `e`
  // the seam: the hairline of apricot dead ahead is there at s 170 (the dawn clock itself has hardly begun: e is 0.001 at
  // postcard 5's s 172), so it comes in by distance over these 8 m
  seamIn: (s) => smooth(166, 174, s),
  // the mirror's grade (15 per cent darker, 10 per cent richer) is nothing to s 170 and back by s 230: the first horizon
  mirrorGrade: (s) => smooth(170, 230, s),
  // the sunline: a level plane of first sunlight coming down through the air as the boat advances (metres above the water)
  sunline: (s) => table([[196, 400], [200, 260], [208, 120], [216, 64], [250, 30], [286, 12], [316, 6], [322, 5.2]], s),
  sunlineSoft: 3,                                                 // eased over this many metres of height
  auroraOut: (s) => 1 - smooth(170, 200, s),                      // the false dawn fails as the true one begins
  // the current: 1.8 m/s to s 200, easing to 1.0 by s 226, held to the end
  current: (s) => lerp(1.8, 1.0, smooth(200, 226, s)),
  // the snow cloud's wall behind: 9 degrees high at the reveal, 5 by the end
  cloudWall: (s) => lerp(9, 5, smooth(26, 316, s)),

  // ---- cues that set.js owns (the light and the water hang on them; staging hangs its beats on the same names)
  cues: {
    reveal: 26,                                                   // the eye opens: exposure 0.5 to 0.72 over 4 s (the page: 0.8 to 1.15; see look.star)
    falsedawn: 96,                                                // the aurora unrolls from west to east in 12 s
    seam: 170,
    lettinggo: 216,                                               // the showstopper's clock starts (38 s; the boat reaches about s 258)
  },
  show: {
    cue: 'lettinggo', s: 216, length: 38, by: (s) => (s - 216) / 1.1,
    rising: [0, 18],                                              // the fallen stars lift
    wind: { from: 22, reach: 32, speed: 26, ahead: 260, width: 52, calmSpeed: 14 },      // the front: from 260 m ahead of the boat at t 22 to the boat at t 32
    flock: [26, 34], waderGone: 21,
  },

  // ---- light states, exactly as the page's table gives them, with what looking changed (each change says why)
  look: {
    star: {
      // (the page's fog is #1F2D78, a step darker than the sky's horizon #243583: the seam then shows as a dark line
      // across the first image. In the low sky's own colour the seam is only where the lowest stars go out.)
      // (the page's density is 0.0032 in all three states. By starlight that leaves the hut, the stakes and the cone rows
      // standing as dark shapes along the seam from the first image, which the page keeps empty: at 0.0075 the night's air
      // holds everything beyond about 120 m, and the false dawn clears it to 0.0042: the aurora SHOWS the works.)
      background: '#070A24', fog: { color: '#22327F', density: 0.0075 }, veil: '#aab4d6', veilOut: 0,
      // the page: exposure 1.15, bloom 0.8 / 0.85 at threshold 0.72. The tone curve lifts mid-darks by half and the bloom
      // of 2,600 stars lays a veil over the frame: the sky's chips came out twice as bright as typed (#28368B where the
      // page types #101A55 and the key painting has #162560). At 0.72 they are shown as typed; only what is brighter
      // than 1.8 blooms (the forty brightest stars, the lamps).
      exposure: 0.72, exposureAtReveal: 0.5, bloom: { strength: 0.38, radius: 0.5, threshold: 1.8 },
      // the page: paint 0.5, radius 4. The painter's filter runs over the picture and never over the water, so a filtered
      // sky and its reflection are two pictures. The sky therefore keeps out of the filter while the mirror must be exact
      // (set.js, "the crisp sky"), and the page's 0.5 runs over everything built: the boat, the lamp, the works.
      paint: 0.5, paintRadius: 4,
      // the page: saturation 1.06, contrast 1.05, lift #05061A. With the tone curve's toe taken out (toe 1) the darks are
      // shown as typed; contrast above 1 is applied after the curve and puts the two darkest chips back to black.
      grade: { tint: '#ffffff', saturation: 0.96, contrast: 1.0, lift: '#03040F', vignette: 0.4, grain: 0.04, toe: 1 },
      lantern: 2.2, lanternLit: 1, current: 1.8, currentNarrow: 1.8, mirrorScale: 1.5,
      // the rider's boat (the remodelled one, since 19:49 on 7 November) follows the area's light by itself; by starlight its
      // foredeck, lit by its own lantern, was still the largest pale thing in the first image. `tone` multiplies the whole
      // boat: worn wood in a blue night, never the lightest thing in the frame. (One tone for the whole area: it is taken
      // once, on entry. At first light the same tone keeps the boat a cool middle grey under the pale sky.)
      // (second pass: follow: true, new in the engine on the evening of the 7th: the boat's colours are read on every look
      // change, so the dawn's look gives it a tone of its own, below. With the night's tone at first light it was a
      // slate-blue silhouette on a pale lake; in #C4BCCC it is weathered wood in the dawn's shade, still the darkest thing.)
      boat: { tone: '#8C90B8', follow: true },
      // the rower (src/engine/rower.js): in the blue night she is cooled and brought down with the boat; the dawn gives her colours back
      // (critique, 8 November: #A9AED6 at own 0.45 left her a lamplit daylight figure against the night, her scarf the
      // most saturated thing in the sphere after the lamp. At #6F7CC0 and 0.2 she is a dim figure in the starlight, hair
      // lilac, scarf burnt, and her face still reads: .shots/sky_crit_rower_trials1.jpg, top row, left and middle)
      rower: { tone: '#6F7CC0', own: 0.2, follow: true },
      // light for what is NOT dressed in the area's own material (the rider's boat, the engine's lamp post). Everything
      // the area builds takes light.js instead, where starlight is one shadowless blue from above and from the mirror.
      light: { key: [0, 0.35, 0.94], keyColor: '#ffffff', shadow: '#161C55', lit: '#B9C6F5', gain: 0.55, sky: '#1C2C7C', ground: '#1C2C7C', lanternRadius: 7 },
    },
    aurora: {
      fog: { color: '#22367F', density: 0.0042 },
      light: { key: [0.82, -0.57, 0], keyColor: '#86E2C0', shadow: '#161C55', lit: '#B9F0DA', gain: 0.9, sky: '#1C2C7C', ground: '#1C2C7C' },
    },
    dawn: {
      // The page: exposure 0.92, bloom threshold 0.88, fog #D9B7A6. The tone curve squeezes pale colours: at 0.92 the
      // page's apricot #F2A769 is shown as #E0B07D and chalk #F7ECD2 as #E3DDD0. So the pale things are typed brighter
      // than 1 (the sky's dawn stops below, the first light on salt in `light`), exposure is 0.8, and only what is
      // brighter than 3.2 blooms (the two lanterns, the sequins).
      // The page's fog is #D9B7A6, a warm chalk. The engine has ONE fog colour for the whole circle, and the far water takes
      // it: a warm line right round the horizon is a second sunrise in the west (docs/build/sky/1-layout.md). A chalk with
      // no warmth in it, seen as #D4C9D0, is mist against the apricot ahead and against the lilac behind.
      background: '#3C55A8', fog: { color: '#DBCBD3', density: 0.0042 }, fogWest: '#7980B8',      // fogWest: the mist's colour looking away from the light (set.js)      // (third pass: #B4ABD4 -> #7980B8, seen as #858BC0: the far water and the mist under the west's bars are in the earth's shadow, sky.dawn.west; pale, they were a glowing band under a flat sky. sky.dawn.westBars)
      exposure: 0.8, bloom: { strength: 0.3, radius: 0.7, threshold: 3.2 }, paint: 0.8, paintRadius: 4.5,
      grade: { tint: '#ffffff', saturation: 0.94, contrast: 1.0, lift: '#231C33', vignette: 0.25, grain: 0.035, toe: 0.4 },
      // (critique: the rower. The engine's light for what is not the area's own is near white at dawn (lit #E9E2EE), while
      // everything the area builds stands in the lilac shade below the sunline (light.js): at #E4D9DC she stood in daylight
      // colours in the ride's last picture, her scarf brighter than the lamp she has just lit. #8F90C6 at own 0.1 puts her
      // in the same shade as the jetty, darker than the sky behind her, her face still read: .shots/sky_crit_rower_trials1.jpg
      // (bottom row: given, then #A9A6D2 at 0.15, which was the first step) and sky_crit_rower_dawn_nowF.jpg (that step, and
      // this one). `follow` is written out; it was already inherited from the star look, which is why the old tone did take
      // effect: tried with a red one.)
      lantern: 1.2, boat: { tone: '#C4BCCC' }, rower: { tone: '#8F90C6', own: 0.1, follow: true },
      // below the sunline there is only sky light: the page's apricot key (from dead ahead, 4 degrees up, #FFD3A0, lit
      // #FFF0D8, gain 1.15) falls only on what stands above the sunline, and the boat never does. light.js adds it there.
      light: { key: [0, -0.07, 1], keyColor: '#E6DCE6', shadow: '#8079A2', lit: '#E9E2EE', gain: 0.9, sky: '#4E5A96', ground: '#57557E', heightFog: 0.3, heightFogOver: 2.4 },      // (stage 2d: heightFog. At first light what stands far off stands with its feet in the lake's mist: the cone rows, the jetty's piles, the ridge's foot)
    },
  },

  // ---- the area's own light on everything it builds (light.js). Colours are light, not paint: a thing's local colour
  // is multiplied by them. Chalk (#F7ECD2) is the low sky's own blue by starlight, #5C6DB4 under the false dawn, #8E86B0
  // in the dawn's shade and pale apricot chalk above the sunline.
  light: {
    // starlight: shadowless (the mirror lights from below as much as the sky from above), and no brighter than the low
    // sky itself: chalk by starlight is the colour of the sky behind it, so the works are unseen until the false dawn
    // (the page types #5C6DB4 for salt at night: that is what the aurora's fill makes of it, from s 96)
    star: { sky: '#263CAA', ground: '#263CAA', gain: 1.0 },
    // first light, below the sunline: sky light only. Chalk in this shade is seen as #8E86B0 (the page's dawn shadow)
    dawn: { sky: '#8C8ACB', ground: '#7E7DC0', gain: 1.0 },
    dawnLead: 0.6,                                                // the light on built things is all the dawn's by this e (it leads the sky: set.js, `ea`)
    // the false dawn: from the north, 35 degrees up, #86E2C0. The page's gain is 0.9 on the whole lit side; here it is a
    // rim (only faces turned well toward it take it: `from`), or the cones on the south causeway stand as lamps.
    // fill: what its glow adds from all round (it is what makes salt #5C6DB4 under it)
    aurora: { color: '#86E2C0', gain: 0.5, from: 0.6, rim: 0.12, elevation: 35, breathe: 14, depth: 0.15, fill: '#4C5A8C' },
    // first light, above the sunline: from dead ahead, 4 degrees up, the page's #FFD3A0 and lit #FFF0D8. The page's gain is
    // 1.15; for salt in it to be SEEN as pale apricot chalk (#F7DBC1) the gain must be 3.2 (see the dawn look, above)
    // (from, to: first light is broad, not a beam: a face turned a little away from it already takes some (0.15 of the
    // way round) and a face side-on to it takes nearly all (0.62), or the ridge's long south face, which the route looks
    // at, would stay lilac while only its far end kindled)
    // (second pass: #FFD3A0 x #FFF0D8 at 3.2 -> #FFE2A2 x #FFF3CC at 4.0. The painted salt is chalk with LILAC hollows, and the
    // page's own light on that was seen as a rose, #DFC1C1: pink icing on a lilac cake, the sweetness the page forbids.
    // Yellower and a little stronger it is seen as apricot chalk, #E3CABF near and #DCC5BD from the end of the ride.)
    sun: { color: '#FFE2A2', lit: '#FFF3CC', gain: 4.0, from: 0.15, to: 0.62, elevation: 4 },
    // (second pass: star 1.15 -> 0.7, with the stars' own white light and the lantern's pale core added in plan.lakeBed:
    // at 1.15 of the sky's cobalt the sand was one electric blue-violet sheet, lighter than the mirror above it)
    // (stage 2d: star 0.22 -> 1.15, lantern 1.5 -> -0.45, lanternDawn 0.25 -> -0.6. With the window the water now has round
    // the boat (plan.water.night.clearRadius) the bed is seen by starlight, cool, as the key painting has it along its
    // bottom edge; the lantern's amber on it is then a peach desert, so the sand takes LESS of a lamp's light than the
    // ride gives everything else: a negative number takes that share away)
    // (third pass: wind 0.42 -> 0.75. At 0.42 the bed behind the wind was the darkest thing in the lake, a hole round the boat
    // where the page has the sand come up with the light; with the nets drawn fine, plan.lakeBed.caustics, it is no zebra)
    bed: { star: 0.7, dawn: 0.85, wind: 0.75, lantern: -0.58, lanternDawn: -0.6 },                 // how much of the sky's light the sand takes (at night it is seen only where a lamp lights it); lantern: how many times more of a lamp's light (the mirror over it lets 3 to 14 per cent through)
    // (stage 2d) THE NIGHT'S DEPTH: the false dawn's glow (`aurora.fill`) is the light of the near things. It is all there
    // within fill[0] metres and down to the share fill[2] by fill[1]: far salt keeps only starlight and is a paler
    // darkness on the sky, not a pale polygon (the director's point 1). rim: the share of the jade rim left far off.
    // aerial: beyond aerial[0] metres a built thing goes toward the night air's colour (the fog's, which is the low sky's),
    // aerial[2] of the way at aerial[1]; gone between the two values of the dawn's progress in aerialUntil
    depth: { fill: [40, 190, 0.28], rim: 0.7, aerial: [40, 200, 0.5], aerialUntil: [0.08, 0.4] },      // (first tried from 28 m and 26 m: the cone rows on the causeways, 60 to 110 m off in the key view, fell under the key painting's salt)
    // LIGHT POOLS AT THE FOOT OF THINGS and dies upward over `over` metres: what the lake gives back to whatever stands
    // in it. By starlight the Milky Way's twin, a breath of violet; under the false dawn a little jade; at first light
    // the water's own pale light (and, once the wind has opened the glitter path, a little of its apricot: `glitter`)
    foot: { over: 0.9, star: '#2A2C6E', aurora: '#2C5A66', dawn: '#6E6A9E', glitter: '#B8805E' },
    // AGAINST FIRST LIGHT a form is edged with it: only when the eye looks toward the east (toward 1), thin (power)
    // (second pass) aurora: the same against the FALSE dawn: a jade edge on whatever stands between the eye and the north,
    // and on level salt seen at a glance (typed as the aurora's own light, yellower than it is seen: see sky.aurora)
    rim: { dawn: '#FFC9A0', gain: 0.55, power: 3.2, toward: 1, aurora: '#8FE2B4', auroraGain: 0.3 },
  },

  // ---- the sky
  sky: {
    night: { top: '#070A24', mid: '#101A55', horizon: '#243583' },
    // first light: `see` is the page's chip, `lin` what is typed (linear light) so that the chip is what the screen shows at the dawn's exposure
    dawn: {
      // the page's stops: top #3C55A8, 25 degrees #93A6DA, horizon #F2A769 ahead and #B9A9CC behind. (The first layout took
      // the 25 degree stop from the painted band instead, #6468B6 ahead: a violet sky under pink cirrus over lavender
      // water, which is the sweet dawn the page forbids. The page's periwinkle stands; the painting gives the lowest six
      // degrees and, above that, its cirrus at part strength: `band`, below.) midBehind: a shade deeper away from the light.
      top: { see: '#3C55A8', lin: [0.0276, 0.0751, 0.3258] }, mid: { see: '#93A6DA', lin: [0.2633, 0.3665, 0.8547] }, midBehind: { see: '#7088CA', lin: [0.132, 0.2121, 0.591] },
      // (horizonBehind: the page's #B9A9CC is the lavender of the snow cloud's wall, which the painted band brings; the west's own
      // low sky is a dusk lilac-blue, #8D90C6: a pale horizon right round under a sky still dark was a lid)
      horizonAhead: { see: '#F2A769', lin: [2.4544, 0.4865, 0.1164] }, horizonBehind: { see: '#8D90C6', lin: [0.2214, 0.2367, 0.5387] },
      // (hairline: the page's pale green-gold #E6DFA2 laid thinly over periwinkle is a turquoise wire; a paler cream-gold, #EDE4C4)
      hairline: { see: '#EDE4C4', lin: [1.5793, 1.3376, 0.6869] }, lilac: { see: '#A99FC8', lin: [0.3464, 0.2989, 0.5533] },      // lilac: the page's "greyed lilac", the bar between the seam and the periwinkle
      bleed: { see: '#DDC6BC', lin: [0.9055, 0.6144, 0.5018] },      // a pale chalk warmth over the seam, thinning upward into the lilac over ten degrees (apricot straight into lilac is pink; a wide green-gold is a rainbow)
      seam: [0.3, 3.0],                                           // the apricot seam: a hairline at s 170, three degrees high at the end
      // first light does not come to the whole sky at once. A part of the sky starts to turn at e = early + high * (a rising
      // function of its height), never later than `latest`, and takes `takes` of e to turn; away from the light
      // the low sky starts at early + west and the high sky as everywhere. As laid out:
      //   s 216 (e 0.31, the letting go begins)   a night sky with a low glow at its foot (the seam and four degrees)
      //   s 232 (e 0.52, the wave)                the glow has climbed to eight degrees; above twelve it is night:
      //                                           the lake's stars rise against a dark sky (on a pale one they are nothing)
      //   s 245 (e 0.68, the wind is coming)      pale to ten degrees, a quarter turned at twenty, night above thirty
      //   s 253 (e 0.77, the wind has come)       two thirds turned at twenty, a third at thirty: the wind brings the morning
      //   s 280 (e 0.96)                          first light all round
      // (The page turns everything by e alone, which has the sky more than half pale at s 236, in the middle of the rising.)
      // (third pass) THE WEST AT FIRST LIGHT IS A SKY IN BARS TOO. Away from the light the low sky was one flat lilac-blue from
      // the seam to 25 degrees, and the ride's last picture (the lamp you lit, looking back) had a hazy blank behind it.
      // Before sunrise the sky opposite the light stands in two bars: the earth's own shadow, a band of slate blue on the
      // horizon, and over it the belt of rose-lilac that the page types for the low sky behind, #B9A9CC. (The second
      // layout took that chip out because a pale horizon right round under a sky still dark was a lid: this is a belt, not
      // a horizon. It lies only within about 75 degrees of dead behind, it comes last of all, between `from` of the dawn's
      // progress, when the sky over it has turned, and under it the horizon is the darkest part of the west.)
      // at: the belt's middle, degrees up; below, above: how fast it dies downward and upward (degrees); under: the top of
      // the shadow band; strength: of the belt and of the shadow. The lit lamp on the far jetty hangs in the shadow band.
      westBars: { belt: { see: '#B9A9CC', lin: [0.4486, 0.3512, 0.5965] }, shade: { see: '#7F86BC', lin: [0.1701, 0.1966, 0.4473] }, at: 7, below: 2.8, above: 5.5, under: 3.4, strength: [0.9, 0.85], from: [0.72, 0.95] },
      mirrorLift: 24,                                             // (stage 2d) behind the wind the water gives back the sky above this many degrees for everything below them (set.js, skyAt)
      early: 0.05, high: 0.65, by: 12, west: 0.5, latest: 0.7, takes: 0.26,      // (three quarters of `high` are spent in the first `by` degrees, the rest up to 60: 4 degrees starts at 0.27, 10 at 0.52, 20 at 0.6, 30 at 0.64, the zenith at 0.7)
    },
    midAt: 25,                                                    // degrees
    paintAfterWind: 0,                                            // (stage 2d) 0: the sky keeps out of the painter's filter to the end. 1: once the wind has let the mirror go it is painted like the rest (as the layout built it). Measured at postcard 10: 13.3 and 15.4 ms painted, 10.8 and 11.1 kept out (reference 8.8, 7.1); the two pictures differ in 2 pixels in a thousand (sky_l_skycrisp.jpg)
    mist: { top: 1.7, night: 0.92, dawn: 0.85, dawnColor: '#E8DCCB' },     // a line of mist all round (the page: 1 degree; at 1.7 the thin dark notch the far water's fog makes at the seam is lost in it)
    veilTear: 1.3,                                                // the entry mist clears from the zenith downward
    stars: {
      count: 2600, seed: 71,
      // four sizes (pixels across at 900 lines, as the page gives them), how many of each, and their light
      sizes: [{ px: 1.4, n: 1700, light: [0.35, 0.8] }, { px: 2.2, n: 620, light: [0.7, 1.3] }, { px: 3.2, n: 240, light: [1.2, 1.9] }, { px: 4.6, n: 40, light: [2.2, 3.8], halo: 1 }],
      colors: ['#E6EEFF', '#E6EEFF', '#E6EEFF', '#DCE6FF', '#F2F0FF', '#FFF2E6'],
      twinkle: 0.25, rate: [0.2, 0.5], breathers: 1 / 12,
      fade: [0.3, 0.92],                                          // the faintest first, forty bright ones last (the page: 0.12 to 0.7; here the sky above fifteen degrees is night until e 0.62, and it keeps its stars)
      low: 0.6,                                                   // none below this many degrees
    },
    // the Milky Way's great circle: it rises from the horizon 4 degrees left of dead ahead, passes 12 degrees north of
    // the zenith and sets behind; 30 to 44 degrees wide; the painted band is laid along it
    // (the painting is 3840 by 1280: 176 degrees along by 58.7 across at one scale; its plain ground is #0B164F, taken off before it is added)
    // tint: its pink knots pulled toward the page's greyed rose; foot: its light dissolves over these degrees above the seam
    // (the dark lane the lamp stands on); density: stars are this many times as thick in it
    milkyway: { rise: 4, lean: 12, from: -14, span: 176, width: 58.7, gain: 0.42, tint: [0.9, 0.9, 1.1], ground: '#0E1A55', density: 2, foot: [0.6, 5.5] },      // (gain: sampled against the key painting, whose star-cloud is #514B87 as a whole: at 0.62 this one was #6D5AA1, at 0.42 it is #5A4D92)
    // the painted horizon band: a full circle from the seam to 30 degrees up, in two halves (ahead, behind)
    // (the dawn's is stored as a quarter of the light that the dawn's look shows as the painted colour: source-art/sky/pack_horizon.py)
    // fade: the night's painting is the sky to 12 degrees and gone by 18 (as shares of `top`: above its ranges and the
    // cloud's wall it is the plain ultramarine of the gradient); fadeDawn: the dawn's to 1.5 and gone by 2.7 at the sides (its far ranges, its mist and the foot of its glow; behind, as high as the cloud's wall); cirrus: how much of
    // the dawn painting's cirrus is laid, greyed, over the page's sky above that (the page: "high cirrus feathers lit pink
    // at the top of the band": feathers, not a pink sky)
    // (second pass) westCirrus: how much of the eastern half's cirrus is laid, turned over and greyed, in the WEST (the painting's
    // western half is bare above its cloud, and the ride's last picture looks that way)
    band: { top: 30, night: 1.0, dawn: 4.0, fade: [0.4, 0.6], fadeDawn: [0.05, 0.09], cirrus: 0.6, westCirrus: 0.4, wall: [10.8, 9] },      // wall: the snow cloud's height as painted, and as the page wants it at the reveal
    // the aurora (the false dawn): north, 40 to 140 degrees left of ahead, 6 to 42 degrees up
    // The colours are LIGHT, added to the night's blue, so they are typed much yellower than they are seen. Sampled on the key
    // painting (its greenest two thousand pixels #77A790, its brightest rays #8FC0A0, its rose #7B5C88): to be seen as that
    // over this sky the rays must add light in the proportions 0.45 : 1 : 0.45, which typed as a colour is the yellow-green
    // below; the page's own chips (#58C49C, cores #B4F0D2) added to ultramarine come out as the answering sea's aqua.
    // (the page: ray cores 0.9; here `core` 0.5 of that light: bright by area, never brighter than the lamp)
    // fringe: the rose light of the rays' upper ends, above 30 degrees only (linear; seen over the sky as #7B5C88)
    // (third pass, 8 November: MEASURED AGAINST THE SEA'S AQUA. README fixes the jade on the green side of the answering sea's
    // #3FE0D0, which is hue 174. As found the curtain's greenest fiftieth was seen at hue 174 to 176 and its brightest green
    // at hue 168, saturation 0.20 (the key painting: 170 and 149, 0.25; the page's chip #58C49C: 158): the sea's light hung in
    // the sky after all, and paler. Less blue in the light it adds, and cores that are not so white: #A4EBA4 -> #98EB80,
    // #CDF6C4 -> #A7F6A0, core 0.5 -> 0.52. Seen now at hue 161 and 157, saturation 0.32 and 0.29: sky_l3_aurora_side.jpg)
    // (third pass: az 40 -> 27. The page's own postcard 4 says "aurora left" and the key painting gives the curtain the left
    // quarter of the picture; with its east end at 40 degrees a rider who looks down the route never has it in the picture
    // at all (the key view's left edge is 42 degrees left of ahead): the false dawn was something to turn the head for.
    // From 27 it stands in the left of every forward view from s 100 to s 190, beside the Milky Way, as painted.)
    aurora: { az: [27, 140], el: [6, 42], unroll: 12, drift: 1.5, travel: 8, breathe: 14, core: 0.52, color: '#98EB80', coreColor: '#A7F6A0', fringe: [0.15, 0.072, 0.115], roseAbove: 30, arc: [10, 20] },
  },

  // ---- the water (docs/water.md, recipe 7, and the page's section 7). Ahead of the wind front the water is an exact
  // mirror whatever the wave numbers say (front.calm); behind it they blow.
  water: {
    night: {
      deep: '#060A26', shallow: '#111C58',
      reflectivity: 1, reflectFloor: 0.86, fresnel: 1.0, mirrorDarken: 0, mirrorSaturate: 0, streak: 0.6,
      // (second pass: waveHeight 0.5 -> 1.3, waveScale 0.8 -> 1.0 (at 1.3 the dashes near the boat were blotches a metre long), the wavelets running west with the wind. At 0.5 the lake behind
      // the wind was still glass with a ragged edge to the seam's reflection: at 1.3 the apricot is drawn out over the blue in
      // long level strokes, "small bright waves", which is the page's sentence and the whole of the ending's water.)
      // (sheen: the water's sky-light on leaning water; nothing by itself: set.js drives it, plan.water.windSheen and nightRings)
      // (waveHeight: the page's 0.18 behind the wind leaves a smooth pink mirror; docs/water.md's recipe for this area has 0.6:
      // at 0.5 the reflected sky breaks into small bright waves, as the page's own sentence asks. Ahead of the front it is a mirror whatever this says.)
      roughness: 0.12, waveHeight: 1.3, waveScale: 1.0, wind: [0.2, 1], sparkle: 0.5, sparkleColor: '#FFE3BE', foam: 0, wake: 0.22,      // (wake: at 0.5 a boat merely drifting corrugates the mirror astern like a washboard and no star is left in it; at 0.22 the stars bend and draw straight)
      // (the recipe: life 32, speed 1.6. At that the wake stands astern as a washboard for half a minute; the page asks for
      // rings that go far and heal in about ten seconds: quicker rings, a shorter life)
      rippleSize: 96, rippleLife: 11, rippleSpeed: 2.1,
      opacity: 0.3, underglow: 1, edge: 0, seeDistance: 26, refraction: 1, refractReach: 0.4, tremor: 1,      // (tremor: how far the standing wavelets bend the bed, apart from the living rings; as refraction by night, where there are none; see dawn)
      // (stage 2d) A WINDOW ROUND THE BOAT: within 1.6 m the mirror is two thirds of itself, whole again 4.5 m further out.
      // "Near the boat there is only water" (the director, point 3): through the page's floor of 0.86 the bed gave back a
      // seventh of its light and nothing was seen of it but the lantern's own stain. The key painting has rippled sand
      // under the stars' twins along its whole bottom edge. The mirror test is taken at the seam and is not touched.
      clearRadius: 1.6, clearSoft: 4.5, clearFloor: 0.68,
      sun: { dir: [0, 0.06, -1], color: '#FFC98F', strength: 0, spread: 1.4, glitter: 0.85 },
      front: { normal: [0, 1], offset: -1e5, width: 52, calm: 1, rain: 0 },
      sheen: { color: '#000000', rings: 0, still: 0, glance: 0, rain: 0, hide: 0, lamps: 0 },
    },
    // (deep: typed so that it is seen as the page's #5E78B8. shallow: the page's #CDBFAE is warm sand; under a periwinkle sky
    // warm sand and reflected blue make lavender, and the lake must stay blue until the end: a cool pale grey instead.
    // sun.spread: at 3.2 the glitter path was a pink wash over half the lake; at 1.5 it is a path of sequins toward the east)
    // (third pass: tremor 0.3. Behind the wind every wavelet bent the bed as hard as a wake does: the caustic nets and the ripple
    // marks were smeared into khaki blotches on dark water, the foreground of the ride's last pictures. Now the wind's water
    // only breathes on the bed and the boat's own rings still waver it: sky_l3_west_a.png before, sky_l3_west_t1.png after)
    dawn: { deep: '#4A69B2', shallow: '#8E9DC6', reflectFloor: 0.45, seeDistance: 60, sparkle: 0.35, sparkleColor: '#FFD2A0', sun: { spread: 0.8, glitter: 1 }, tremor: 0.3 },      // (stage 2d: the path narrower and all sequins: at 1.5 and 0.85 its smooth part was a mauve wedge on the blue; the sparks of the seam's own reflection fewer and warmer)      // (while the mirror holds: the page's floor 0.45; what the wind does to it: below)
    glitter: 1.0,                                                 // the sun path's strength once the wind has opened it (sequins toward dead ahead)      // (second pass: was 2.2. The engine's sequins are round points; scattered over the lake at that strength they were white dust on the picture. The glitter is now the sheen, below; a few sequins stay)
    // (second pass) BEHIND THE WIND THE LAKE IS RUFFLED, and ruffled water under a sky like this one is drawn in level dashes
    // of that sky's light: the water's `sheen` (docs/water.md), which lies on the fine crests in drifting patches, sparse
    // under the eye and closing up toward the horizon. Its colour is the light of the low sky the rider is looking toward
    // (first light's pale apricot ahead, the west's lavender behind: one sheen, so it follows the gaze as the fog does).
    // This is the page's glitter path, as a painter lays it. still, glance: the water's own numbers, at full wind.
    windSheen: { east: '#F4CDB0', west: '#CFC8EC', still: 0.18, glance: 0.25, hide: 0, from: [0.2, 0.6] },      // from: it comes with the dawn's progress, as the glitter does
    // by night the same sheen lies only on the far face of the living water's rings (the boat's own, a landing star's): fine
    // pale arcs going out across the mirror, as the key painting draws them. Nothing on water at rest: the mirror test is not touched.
    nightRings: { color: '#5E6EC2', rings: 0.09 },      // (at 0.5 the wake astern was a target of fat pale bands; at 0.09 its arcs can just be told on the mirror)
    // Behind the wind the water is ORDINARY WATER: "the reflected sky is gone" (the page). The second layout kept it 72 parts
    // in a hundred a mirror, with the sand showing through the rest out to 60 m: every mixture of the seam's apricot with
    // periwinkle sky or lavender sand is pink, and the whole lake from 5 m to 50 m was salmon (#EAA6A2 sampled), the candy
    // pastel the page warns of. So behind the wind the water is at most a third a mirror (a fifth looking down), the sand
    // shows only beside the boat (all there to 4 m, gone by 14: the page's caustics are "within 12 m") and beyond that the
    // lake is its own blue, the page's #5E78B8: the apricot keeps to the seam, its narrow reflection and the glitter path.
    // (And how: a mirror only where the eye looks along it. Nine tenths at the far water, where the seam's reflection lies
    // and should stay apricot; under a third within 8 m. An even third everywhere made the seam's reflection a hard pink
    // bar on blue. windStreak: the water draws long columns under whatever is brighter than 1, and the seam is typed at 2.4
    // so that the screen shows the page's apricot: at the night's 0.6 its columns were a rose wash over the whole lake
    // 120 degrees wide; at 0.2 they are short. The glitter PATH toward dead ahead is the water's own sun path: `glitter`.)
    windReflectivity: 0.9, windFresnel: 6, windFloor: 0.15, windSee: 10, windStreak: 0.2,      // (stage 2d: windSee was 14)
    windDarken: 0.27, windSaturate: 0.13,                          // (stage 2d) the mirror's grade behind the wind: the usual 0.15 and 0.10 left the lake as pale as its sky
    fogDawnFrom: 0.4,                                             // the fog's colour starts toward the dawn's at this e (not before: a warm line of far water behind the boat reads as a dawn in the west)
    mirrorScale: { exact: 1.5, wind: 0.5 },                       // the mirror's resolution: as fine as the engine allows while it must be exact, half after the wind
  },

  // ---- the night air (light.js, "THE NIGHT AIR"): how far a built thing can be and still be there. [all there within, nothing beyond], metres
  air: {
    star: [35, 70],                  // by starlight: the first image is empty and the works are unseen (the page: "at first unseen"); the sedge abeam (35 m) is there
    aurora: [200, 440],              // the 'far' rule under the false dawn: solid within 200 m; the far cone rows, the far flock and the ridge's far end thin away into the night beyond
    open: [1000, 2000],              // open air: solid, ordinary things
    find: 6,                         // the false dawn's jade light finds the 'near' things in its first six seconds (it takes twelve to unroll)
    dawn: [0.1, 0.45],               // first light makes the 'far' things solid between these values of the dawn's progress e
    // (stage 2d) by night a FAR thing is a ghost: at most `share` of it is there beyond over[1] metres (all of it within
    // over[0]), the stars showing through the rest. The page's own word for the ridge by night, three times; solid, it
    // was a flat pale polygon lying on the mirror (the director's point 1). First light makes it solid with the rule.
    ghost: { share: 0.5, over: [45, 125] },
  },

  // ---- the kept lamp and the far lamp
  lamp: { at: [136, -3.7], note: 76, near: 8, reach: 12, moths: 3, lane: 4, intensity: 1.5, halo: [2.4, 1.7], hero: { intensity: 1.0, haloGain: 1.5 },      // intensity, halo, stroke, spark: for the ride's first lamp file (src/engine/lamp-first.js); hero: for the remodelled lamp, which is the ride's lamp since 19:49 on 7 November
       // the page: d 0 (see the route, above). The post stands 0.7 m left of the stakes' line so that the FLAME hangs on it (d -3). E5
    stroke: { height: 5.2, width: 0.34, gain: 0.85 }, spark: { size: 13, near: 55, light: 26 } },      // (spark: at size 9 and light 10 the one amber light of the first image was a dull red dot, dimmer than a hundred stars: half of it is lost in 104 m of night air, and a faint amber added to blue is rose)
  jetty: { s: 286, head: 2.5, root: 8.5, width: 1.4, deck: 0.6, post: 0.9 },      // the landing's jetty: 6 by 1.4 m, its head toward the line
  farLamp: { at: [286.93, 3.41], note: 81, near: 3.9, reach: 9, moths: 3 },       // cold until the flame crosses. A5. (The Timber group, 8 November: the layout had it at [286.7, 2.7], near 3.2, on the stand-in's head corner. The landing's jetty.glb has come, and on it the lamp's post is lashed to the fender pile 0.9 m back from the head: that is where it stands now, on the down-route flank, its flame 2.7 m right of the line; `near` grew by the same 0.7 m, so the same boats still pass inside it. heroes_b.js takes the place from the model's own point `lamp_post` and writes it here at build, so whoever reads this after it has the post's true foot.)

  // ---- the great wader (monument 1): a constellation 72 m tall standing in the lake at s 196, d +14.
  // (Stage 2: the wader's own magnitudes, held poses and dust are now plan.monument.wader, below. `poses`, `mags` and
  // `dust` HERE are the layout's: the ring of standers is still drawn from this asleep pose and these magnitudes.)
  // Stars are [u, y, w] metres from the middle of its stance: u toward the right of the route (south; the bird faces
  // north, -u), y up, w along the route. Lines are pairs of star indices. Three poses stand in for the rig's clips.
  wader: {
    at: [196, 14], height: 72, ring: 3, pool: 8,
    sleepUntil: 100, bowFrom: 150,
    asleepGain: 0.5,                                              // until its lines draw (s 84 to 92) only its principal stars are there, as ordinary stars at this share of their light: the first image is empty (heroes.js)
    lines: [[0, 2], [2, 4], [1, 3], [3, 5], [6, 7], [7, 8], [8, 5], [5, 4], [4, 9], [9, 6], [6, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19], [19, 20], [20, 21]],
    // 0,1 feet  2,3 ankles  4,5 hips (where the legs leave the body)  6 shoulder  7 back  8 tail  9 keel of the breast
    // 10..18 neck  19 crown  20 bend of the bill  21 its tip
    poses: {
      awake: [[-3, 0, 4], [3, 0, -4], [-1.2, 16, 4], [4.8, 16, -4], [-3.2, 34, 1.2], [2.6, 34, -1.2], [-11.5, 42.5, 0], [0.5, 47, 0], [14, 39.5, 0], [-9.5, 35.5, 0],
        [-14.6, 46.2, 0], [-17.4, 50.1, 0], [-19.3, 54.4, 0], [-19.9, 59, 0], [-18.9, 63.3, 0], [-16.8, 66.7, 0], [-15.2, 69.2, 0], [-15.4, 71, 0], [-16.6, 71.9, 0], [-18.2, 72, 0], [-20.8, 71, 0], [-22.6, 68.6, 0]],
      asleep: [[0, 0, 0], [3.4, 31.2, -1], [1.6, 16, 0], [5.6, 29.6, -1], [-0.4, 34, 0.6], [3.2, 33.4, -0.6], [-10.5, 42.6, 0], [1.5, 46.6, 0], [14.2, 37.4, 0], [-8.6, 36.2, 0],
        [-9.6, 46.4, 0], [-6.8, 49.2, 0], [-2.8, 50, 0], [1.2, 49.3, 0], [4.6, 47.6, 0], [6.4, 45.4, 0], [5.2, 43.8, 0], [2.4, 44, 0], [0.2, 45.2, 0], [-0.8, 46.4, 0], [0.4, 46.9, 0], [1.6, 46.3, 0]],
      bowed: [[-3, 0, 4], [3, 0, -4], [-1.2, 16, 4], [4.8, 16, -4], [-3.4, 33.6, 1.2], [2.6, 35, -1.2], [-15.5, 36.6, 0], [-3, 42, 0], [12, 41.5, 0], [-14, 30, 0],
        [-18.4, 33.6, 0], [-21.6, 29.8, 0], [-24.4, 25.6, 0], [-26.4, 21.2, 0], [-27.7, 16.8, 0], [-28.3, 12.4, 0], [-28.3, 8.2, 0], [-27.9, 4.4, 0], [-27.4, 1.8, 0], [-27.2, 0.9, 0], [-25.6, 0.4, 0], [-23.6, 0.25, 0]],
    },
    mags: [3.2, 3.2, 1.4, 1.4, 1.9, 1.9, 2.2, 1.6, 2.4, 1.8, 1.0, 1.0, 1.1, 1.0, 1.1, 1.0, 1.1, 1.0, 1.1, 2.6, 1.3, 1.9],      // each star's light, set by hand
    dust: [[-2, 40.5, 15, 5.2], [6, 39.8, 9, 4.2], [-7, 39.2, 6, 3.6]],      // nebula dust inside the kite only: [u, y, half length, half height]
    grounded: { awake: [0, 1], asleep: [0], bowed: [0, 1] },                  // which feet stand on the water (a ring and a pool of light under each)
  },
  // the ring of standers: twelve more star-birds asleep on one leg, 30 to 46 m tall, 240 to 420 m out, seen from the
  // centre of the lake (s 170, d 0) at these bearings off dead ahead (positive = right). [bearing, distance, height, lean]
  standers: {
    centre: [170, 0], drawFrom: 76, drawTo: 90, fade: [0.25, 0.6], asleepGain: 0.45,     // (the same: fourteen stars in three degrees are a thing on the horizon; four are not)
    birds: [[26, 310, 38, 0.02], [44, 265, 44, -0.03], [67, 345, 32, 0.04], [92, 285, 46, -0.02], [121, 385, 36, 0.03], [147, 325, 40, -0.04],
      [-31, 290, 42, 0.03], [-55, 365, 34, -0.02], [-80, 250, 46, 0.02], [-106, 405, 30, -0.04], [-131, 305, 38, 0.03], [-154, 420, 44, -0.02]],
  },
  // the skein: nine star-birds in flight along the Milky Way at 260 m, a slack line 300 m long, 34 m span
  skein: { count: 9, span: 34, length: 300, height: 260, abreast: 1.8, from: [86, 30], to: [196, 20] },      // [s, degrees above the west / the east]

  // ---- the white ridge (monument 2): raked salt, 120 by 84 by 34 m
  ridge: { s: [236, 356], d: [-134, -50], crest: [[278, -92], [314, -92]], height: 34, skirt: 6, undercut: 0.2 },
  barrowRun: { foot: [262, -52], stage: [280, -90], legs: 5, width: 0.5, stageSize: [4, 3], frame: 5 },
  hut: { at: [186, -42], legs: 5, splay: 4, cabin: [3.2, 2.6], ridge: 8.6 },
  // ---- TIMBER (stage 2, the other hero pieces: the warden's hut and the barrow run. docs/build/sky/2-heroes-timber.md;
  // read by src/realms/sky/timber.js). The page's numbers for both stand above (hut, barrowRun) and are not changed.
  timber: {
    // THE BARROW RUN'S LINE is the layout's: the five legs the stand-in drew, which the Monument group's ridge has trodden
    // ledges along (source-art/models/sky/ridge.py, RUN). `turns` are its corners as [s, height of the line on the face];
    // the line's d at any height is wherever shared.ridge.faceAt(s, height) says the face is, so the run follows the
    // sculpt. The deck stands `clear` above the line on trestles whose legs are sunk in the salt to whatever depth the
    // face leaves them. `spans` are the trestle bays of each leg (45, and the foot: the page's 46 trestles).
    // (Their slopes: 12, 14, 15 and 17 degrees, and the last pitch to the stage 31: a cleated ramp, with the hoist over it.)
    // (what keeps it from being a ruled zigzag at 30 to 90 m, where a post is a pixel wide: `wander` the deck's height over
    // the ledge wanders by amp either way, slowly, and is nothing within `taper` metres of a landing; `uneven` a trestle
    // stands up to this share of a bay off its place; `cranks` the share of trestles at which the deck changes slope (the
    // planks between two such are straight: one bay long or two); `sway` the share of bays with a sway brace along the
    // run; `slipped` [leg, bay] of the one plank whose far end has dropped onto the ledge; `brokenRail` the landing whose
    // hand rail hangs by one end)
    run: { turns: [[262, 0], [292, 6.8], [266, 13.6], [290, 20.4], [270, 27.2], [280, 34]], clear: 0.7, spans: [12, 10, 10, 8, 5], width: 0.5,
      wander: { amp: 0.3, taper: 3, lift: 0.04 }, uneven: 0.5, cranks: 0.5, sway: 0.42, slipped: [2, 5], brokenRail: 1 },
    // the tipping stage: 4 m along the crest by 3 m, where the stand-in stood (the Tools group's shovel stands on it at
    // s 280.9, d -87.6): its deck is level with the crest, on posts sunk in the near face
    stage: { at: [280, -88.5], deck: 34.12, size: [4, 3] },
    // the hut. rim: how much of the false dawn's light whatever turns away from the eye takes while the eye looks toward
    // the curtain (the hut is seen from the south and lit from the north: without it, it has no part in that light)
    hut: { rim: 1.6 },
    // THE FAR JETTY (heroes_b.js): the landing's jetty.glb, the ride's one jetty, standing where plan.jetty puts it (its
    // length, width and deck are the landing's: 6.0 by 1.3 m, 0.6 m), MIRRORED, so that the flank with the fender pile
    // and the lamp is the down-route one here as it is there. The file is painted in the landing's fen oak; here it is
    // salt-bleached in the material (the page, section 10, item 8): `bleach` [how far the paint goes to the area's
    // timber grey, the paleness of fen oak that becomes exactly that grey (linear), how much of the paint's own
    // contrast is kept], for the timber and for the rope; `rope` the colour dry rope goes to; `windward` how much salt
    // has bloomed on the planks toward the down-route flank and on every face that looks down the route. `crook`: the lamp's post
    // is crooked, and beside a mirrored jetty its crook is the other way: its foot stands this far down the route from
    // the model's point, so that post and fender pile touch where they are lashed. `crisp` [from, to] metres: beyond
    // these it keeps out of the painter's filter (its timber; its ropes and rings). `lantern`: the bow lantern's light on it by the square
    // of the distance (the Shallows group's law and number). `collide`: circles in the model's own axes [x, z, r].
    // `coil`: the coil of dry rope hung on the second mooring post (`rope_coil.glb`): how far under the post's head its
    // neck is (metres, off the landing's model), how far round from the line toward the oncoming boat it hangs (degrees),
    // how far it swings when the wind has come (radians), how slowly (radians a second), how long that takes to die (seconds).
    jetty: { bleach: { timber: [0.86, 0.17, 0.72], rope: [0.6, 0.3, 0.8] }, rope: '#B5A78C', windward: 0.5, crook: 0.067, crisp: { timber: [8, 20], rope: [4, 10] }, lantern: 2.2,
      collide: [[0, -0.5, 0.8], [0.5, -0.9, 0.8], [0, -1.8, 0.8], [0, -3.1, 0.8], [0, -4.4, 0.8], [0, -5.7, 0.8]],
      coil: { under: 0.28, toward: 18, swing: 0.11, rate: 2.6, settle: 9 },
      // `lamp`: the far lamp ONCE IT IS LIT (the fourth holder, 8 November; nothing of it shows while the lamp is cold).
      // stroke: how broad its shine in the water's mirror is (the engine's 1 gave a few pale flecks on the ruffled water
      // at first light: at 2 the water draws a broken stroke out of it); haloGain: its glow (the kept lamp's is 1.5:
      // plan.lamp.hero; at the engine's 1 the lamp you lit was dimmer than the kept lamp 170 m behind it).
      lamp: { stroke: 2, haloGain: 1.8 } },
  },

  // ---- the salt works
  causeway: { from: 150, to: 232, inner: 22, width: 3, top: 0.3,
    sluices: [{ side: 1, s: 162 }, { side: 1, s: 206 }, { side: -1, s: 178 }, { side: -1, s: 222 }], mouth: 6, gatePost: 1.8,
    cones: { perSide: 16, step: 4.6, from: 155.5, height: [1.5, 2.5] },
    tools: [{ s: 168, side: 1, what: 'rake leaning in a cone, shovel stuck in its side' }, { s: 190, side: -1, what: 'flat barrow on a plank run, stacked baskets' }, { s: 214, side: 1, what: 'yoke and two pails, a rake laid down' }],
    // (the model list counts 5 rakes, 4 shovels, 2 barrows and 8 baskets; the page's three groups and its lost rake place
    // 3 rakes, 1 shovel, 1 barrow and one stack. The rest have no place on the page: these are the layout's, by the
    // people's other work. [s, d] of the foot, height of the foot, then where the upper end is)
    toolsElsewhere: [
      { what: 'barrow', name: 'flat barrow (the second, at the foot of the barrow run)', at: [259.6, -48.4], y: 0.08, turn: 0.9 },
      { what: 'shovel', name: 'shovel laid across the second barrow', at: [259.2, -48.0], y: 0.56, to: [260.2, -48.9], toY: 0.62 },
      { what: 'baskets', at: [261.4, -47.2], y: 0.07, n: 3 }, { what: 'baskets', at: [262.1, -47.5], y: 0.07, n: 2 },
      { what: 'shovel', name: 'shovel standing on the tipping stage', at: [280.9, -87.6], y: 34.1, to: [281.0, -87.5], toY: 35.4 },
      { what: 'shovel', name: 'shovel leaning in the hut ladder', at: [186.6, -39.0], y: 0.0, to: [186.4, -39.7], toY: 1.2 },
      { what: 'rake', name: 'rake hung under the hut', at: [185.2, -42.6], y: 4.7, to: [187.2, -42.2], toY: 4.75, turn: 1.57 },
      { what: 'rake', name: 'rake left standing in the crust of the flats', at: [244, -27], y: 0.05, to: [244.3, -27.5], toY: 2.1, turn: 0.4 },
    ] },
  pans: { size: [20, 30], rim: 1.0, rimHigh: 0.14, floor: -0.05,
    right: { s: [150, 352], d: [25, 175] }, left: { s: [150, 230], d: [-115, -25] } },
  cones: { near: 64, far: 400, farReach: 300, farStep: 7.5 },
  // ---- THE WORKS (stage 2, the Works group: kit.js; docs/build/sky/2-kit-works.md). The places stay above (causeway,
  // pans, cones); this is how the real pieces stand in them. The Tools group may read `walk`, `clear`, `toolCone` and
  // `flank` to lay its things where the real bank and cones leave room.
  works: {
    // ACROSS THE BANK'S TOP (3 m, d 22 to 25 either side; 0.3 m above the water): the revetment's top board at d 22, a
    // TRODDEN PATH along the channel side of the top (its middle at `walk.d`, `walk.half` either side of it, `walk.y` high),
    // and the salt heaps along the pan side: each stands HALF ON THE BANK AND HALF IN THE PAN (second version, 7 November:
    // a heap of damp salt lies at 45 degrees and is 4 m across), its foot on the bank coming to the path's pan edge
    // (d 23.0) and no nearer, its axis about on `coneLine`.
    walk: { d: 22.7, half: 0.5, y: 0.29 },
    coneLine: 24.9,
    // top kept clear of heaps for the Tools group: [side, s from .. to, clear on the channel side of this d].
    // left, s 181 to 202.5: their plank run and barrow (the heaps there stand further out over the pan's edge);
    // right, s 212.3 to 218: their yoke, pails and laid rake (no heap at all: one was carted away)
    clear: [{ side: -1, s: [181, 202.5], d: 23.85 }, { side: 1, s: [212.3, 218], d: 25.5 }],
    // the heap that the rake leans in and the shovel is stuck in (the page's tool group at s 168, right): cone_c at its own
    // size, with its shovelled bay facing up-route and toward the channel (`cut.toward` is [along, across]: -1 = up-route,
    // -1 = toward the channel). d: where its axis stands; base: the bank's top under it; h: its top above `base`; r: the
    // radius of its foot on the bank along the line 80 degrees round from the bay, down-route (where a rake leans).
    // cut: the bay is a round bite about `depth` across, its wall `wall` from the axis at its middle, its floor at
    // base + 0.05, its brow `height` above the floor. (The Tools group no longer copies any of this: it stands the heap's
    // own file where shared.cones.near says it stands and feels it with rays. The numbers are here for whoever else needs them.)
    toolCone: { side: 1, s: 169.3, d: 24.9, h: 2.09, r: 2.056, base: 0.29, cut: { toward: [-0.8, -0.6], halfAngle: 35, depth: 2.1, wall: 0.83, height: 1.2 } },      // (third version of the heaps, 8 November: h was 1.86, r 1.912)
    // the tool cone's radius at the height y above its foot on the line the rake lies on (h: its height, r: the radius of
    // its foot there): cone_c's own flank, as source-art/models/sky/cone.py prints it (`-- numbers`): a patted facet
    flank: (y, h, r) => { const F = [1, 0.9241, 0.8473, 0.7724, 0.6975, 0.6216, 0.5399, 0.4572, 0.3735, 0.2947, 0.2082, 0.1148, 0], t = Math.min(0.9999, Math.max(0, y / h)) * 12, i = Math.floor(t); return r * (F[i] + (F[i + 1] - F[i]) * (t - i)); },
    // the five heaps as modelled (cone.py -- numbers: keep in step; third version, 8 November): h: the top above the
    // WATER; water, bank: the mean radius of the foot at the waterline (crust skirt and all) and at a bank's top; top: where
    // the top stands off the middle (toward the model's right, toward its front); foot: how far the foot reaches at a
    // bank's top in twelve directions round the model (0 = its right, 90 = its back, 270 = its front; the realm turns a
    // heap and asks how far its foot then comes toward the path); how often each is used on the banks, in the pans near
    // the works' up-route end, and in its far form (a, b and e have one)
    variants: {
      a: { h: 2.45, water: 2.57, bank: 2.25, top: [0.21, -0.06], foot: [2.64, 2.62, 2.73, 2.52, 2.37, 2.22, 2.20, 2.15, 1.91, 2.10, 2.15, 2.64], onBank: 5, onRim: 4, far: 5 },      // fresh: a cap, a slip at its back, a barrow-load taken from its foot
      b: { h: 2.12, water: 2.71, bank: 2.32, top: [-0.23, -0.27], foot: [2.39, 2.45, 2.20, 2.27, 2.27, 2.54, 2.59, 2.84, 2.87, 2.64, 2.27, 2.03], onBank: 4, onRim: 3, far: 4 },    // slumped (toward its front-left), a second load tipped against its right
      c: { h: 2.38, water: 2.61, bank: 2.22, top: [0.01, -0.17], foot: [2.29, 2.71, 2.85, 2.63, 2.53, 2.19, 2.07, 2.17, 1.96, 1.94, 2.18, 2.38], onBank: 2, onRim: 1 },            // a shovelled bay (in its front)
      d: { h: 1.85, water: 2.44, bank: 2.05, top: [-0.28, -0.77], foot: [1.96, 2.17, 2.46, 2.74, 2.89, 2.96, 2.36, 1.98, 1.69, 1.68, 1.57, 1.79], onBank: 2, onRim: 1 },            // half shovelled away (from its front; most of these stand beside the plank run)
      e: { h: 1.58, water: 2.94, bank: 2.40, top: [0.00, -0.13], foot: [2.47, 2.12, 2.02, 2.08, 2.55, 3.02, 2.86, 2.93, 3.05, 2.92, 2.22, 2.29], onBank: 3, onRim: 2, far: 3 },      // old
    },
    // HOW LARGE the heaps of the banks stand (a share of the model's size), one after another along a bank, and where none
    // stands (0: a gap, the pan seen through it). No two neighbours of a size: tall, low, a gap, so that a bank is never a
    // range of equal peaks. The model's heights are 1.6 to 2.4 m: these stand 1.1 to 2.2 m above the water.
    heapSizes: { '1': [0.84, 0.6, 0.7, 0, 0.6, 0.9, 0.56, 0.78, 0, 0.88, 0.66, 0.74, 0.55, 0.94, 0.86, 0.6, 0.74], '-1': [0.62, 0.9, 0, 0.72, 0.58, 0.86, 0.7, 0.8, 0, 0.62, 0.94, 0.7, 0.76, 0.66, 0.88, 0.64, 0.74] },
    lantern: 2.2,                               // the works take the bow lantern's light by the square of the distance, as the Shallows and Timber groups' things do (plan.kitShallows.lantern): this much of it at arm's length, a fifth of it at 3 m. Even to its full reach it made everything within eight metres one mauve pink
    windward: [0, 0.25, -0.97],                 // the wind comes from the east (dead ahead): older grey on that side of every cone
    // the causeway's 12 m pieces (causeway_a, causeway_b) and the 8 m one (causeway_c: a 12 m piece cut to 8), by run
    // between the mouths: [side, from, to, pieces]. A run is filled by its pieces stretched or shrunk alike along the bank
    // (38 m by three: 5.6 per cent longer; 23 m by two: 4.2 per cent shorter; the two short runs by the 8 m piece)
    runs: [
      { side: 1, s: [150, 159], pieces: 'c' }, { side: 1, s: [165, 203], pieces: 'aba' }, { side: 1, s: [209, 232], pieces: 'ba' },
      { side: -1, s: [150, 175], pieces: 'ab' }, { side: -1, s: [181, 219], pieces: 'bab' }, { side: -1, s: [225, 232], pieces: 'c' },
    ],
    gate: 1.0,                                  // the sluice gate stands this far behind the inner face
    lift: { 162: 0.0, 206: 0.36, 178: 0.12, 222: 0.0 },      // how far each sluice's lifting board is drawn up, by the place of its mouth (0, 0.12 or 0.36: its peg holes are 12 cm apart)
    boardOff: 0.45,                             // the lifting board stands this far off the middle of its mouth (down-route on the right bank, up-route on the left)
  },
  stakes: { s: [138, 149, 160, 171, 182, 193, 204, 215, 226], d: -3, terns: [1, 2, 4, 5, 7, 8] },      // terns on the 2nd, 3rd, 5th, 6th, 8th and 9th
  plankWalk: { from: [60, -14], to: [84, 10], planks: 22, plank: [2.4, 0.3], top: -0.06 },
  drowned: { wheel: [104, 9], rake: [118, -12] },
  // ---- THE TOOLS (stage 2, the Tools group: kit_tools.js; docs/build/sky/2-kit-tools.md). The page's places stay above
  // (causeway.tools, plankWalk, drowned). causeway.toolsElsewhere is the layout's list and is read only by the stand-ins
  // in kit.js; what stands now is here. A place is [s, d] (d to the right of the line); a direction is [along the route,
  // to the right]; heights are metres. Everything on a causeway stands on the Works group's top (works.walk.y) and
  // against its cone (works.toolCone); what stands by the hut, on the stage and on the crust reads those groups' own.
  tools: {
    crisp: [5, 11],                  // thin parts (poles, teeth, spokes, ropes) are painted like the rest within 5 m and are wholly out of the painter's filter beyond 11 m
    // THE DROWNED THINGS. The walk lies from plankWalk.from to plankWalk.to; `high`/`head`: which way the wheel's high side
    // and the lost rake's head point; rings: the planks under the surface lift small rings as the boat's own rings pass
    // over them (strength, radius, seconds between, how near the boat must be)
    // silt: the silt that lies on a drowned piece is the bed's own sand, this much as bright (a skin of it is a shade darker than the bed); grain: how strong the ridges, the
    // long streaks and the open checks of drowned timber are; shade: how dark the bed is under a plank that stands clear
    // of it; wheelSoft: the wheel's high rim stands out of the water: shallows of this [radius, strength]
    // seen: what lies under the surface is drawn only while the boat is between these distances along (the walk begins
    // at s 60 and the lost rake lies at s 118; under a mirror nothing of them shows from further off)
    drowned: { wheelHigh: [0.95, 0.3], rakeHead: [0.75, 0.66], rings: { strength: 0.09, radius: 0.16, every: [1.5, 2.6], within: 7.5 },
      silt: 0.92, grain: [0.2, 4.5, 0.45], shade: 1.7, wheelSoft: [0.55, 0.6], seen: [42, 150] },
    // GROUP 1, s 168 right: a rake leaning in the heap, a shovel stuck in its side. `round`: where on the heap, as a
    // direction from its middle ([along, AWAY from the channel]: works.toolCone.cut.toward is given the same way).
    // Nothing here is a measure of the heap: kit_tools.js feels the heap's own model with rays (it was remade once under
    // these two). rake: its grip end stands `out` beyond the heap's foot on that line and it is leaned until its head
    // lies on the flank, its pole's end `clear` of the salt (its teeth go in). shovel: a level ray at `height` above the
    // bank's top finds the bay's wall on that line; the blade goes `into` it along the shaft, which rises `rise` degrees
    cone: { rake: { model: 'rake_a', round: [0.45, -0.89], out: 0.2, clear: 0.03 }, shovel: { model: 'shovel_a', round: [-0.8, -0.6], height: 0.15, into: 0.25, rise: 60 } },
    // GROUP 2, s 190 left: the plank run along the trodden path (the Works group cleared s 181 to 202.5 of cones for it),
    // a flat barrow standing on it, stacked baskets. planks: [model, turned end for end, d off the path's middle, yaw in
    // degrees, tint]; the first plank's up-route end is at `from`, each is `pitch` on from the last; the run's line lies
    // `off` from the path's middle (works.walk.d), toward the pan
    run: { from: 182.55, pitch: 3.05, off: 0.04,
      planks: [['plank_a', 0, 0.03, 0.8, '#ffffff'], ['plank_c', 1, -0.04, -1.3, '#f1eef4'], ['plank_b', 0, 0.02, 0.5, '#fbf7f0'], ['plank_a', 1, 0.05, 1.6, '#ece9f1'], ['plank_c', 0, -0.03, -0.9, '#ffffff'], ['plank_b', 1, 0.01, 0.4, '#f3efec']],
      barrow: { model: 'barrow_a', s: 189.75, yaw: 3, load: 'basket_c' },                                   // its wheel on the third plank, facing down the route; a full basket on its bed
      stack: { at: [192.35, -23.52], of: ['basket_a', 'basket_b', 'basket_a'] } },
    // GROUP 3, s 214 right (the Works group left s 212.3 to 218 bare: a cone was carted away): the yoke laid across its
    // two pails, a rake laid down, teeth up
    // print (third holder): what the carted heap left on the bank's top, so that the bare stretch says what happened: a
    // round floor of scraped clay and the ragged ring of the heap's last skirt (tl_print.py: its channel half only), laid
    // where the heap's axis stood (the works' cone line), `above` the bank's top; the yoke stands in its trodden gap
    yoke: { at: [214.15, 23.55], along: [0.89, 0.46], rake: { model: 'rake_b', grip: [215.3, 22.52], head: [217.32, 22.98] }, print: { at: [215.6, 24.9], above: 0.012, tint: '#ffffff' } },
    // ELSEWHERE (the model list counts 5 rakes, 4 shovels, 2 barrows and 8 baskets; the page places 3, 1, 1 and a stack):
    // at the foot of the barrow run, on the ridge's crust skirt: the second barrow parked, a shovel across it, four baskets
    // (heights come from shared.ridge.heightAt: the skirt's three tiers stand 0.1, 0.2 and 0.3 m; `y` only if that is not there)
    // (third holder: the four baskets here are the light far form, basket_far and basket_far_c: 24 m and more from the
    // nearest water, in the dawn's mist, a basket is ten pixels wide)
    foot: { barrow: { model: 'barrow_b', at: [259.7, -49.0], front: [0.995, 0.1] }, y: 0.3, baskets: { full: 'basket_far_c', empty: 'basket_far' },
      full: [260.75, -47.5], stack: { at: [261.55, -47.4], of: ['basket_far', 'basket_far'] }, fallen: { at: [259.95, -47.3], toward: [0.55, 0.84] } },      // (on the middle tier, clear of its scalloped rim at d -46.5)
    stageShovel: { model: 'shovel_a', blade: [280.9, -89.55], grip: [280.5, -88.3], above: 0.03 },          // on the tipping stage's deck (timber.stage), its grip over the edge
    // by the warden's hut, in the hut model's own Blender metres (x east, y north, z up from the brine): a shovel leaning in
    // the ladder; a rake leaning on the south-west leg (the layout hung it under the floor: nothing there to hang it on, and
    // 42 m off a hung rake cannot be read; here its head stands clear of the legs against the false dawn)
    hut: { shovel: { model: 'shovel_b', tip: [0.42, -2.95, -0.04], grip: [0.3, -2.47, 1.18] }, rake: { model: 'rake_a', grip: [-2.1, -1.86, -0.04], head: [-1.655, -1.355, 2.08] } },
    // left standing in the crust of the flats, its grip end pushed in. (Second holder: it stood all but plumb with the
    // drawing rake's plain board square to the channel: a T in front of the white ridge, which at first light is a
    // cross on a hill. Now the toothed rake with its missing tooth, leaned 17 degrees back up the route, its head turned
    // three-quarters to the channel: a tool somebody means to come back for.)
    flatsRake: { model: 'rake_b', at: [244, -27], lean: [-1, 0.15], degrees: 17, sunk: 0.16, teeth: [0.6, 0.8] },
    // spilt salt, where it was handled (it is what sits the tools down on the bank): [model, s, d, turn in degrees, scale].
    // near: on the causeway tops (under the stacked baskets, where the barrow was loaded, where the pails were set down,
    // by the laid rake); far: on the ridge's skirt (under the stack, at the mouth of the basket that fell, by the barrow)
    spilt: {
      near: [['spill_a', 192.35, -23.5, 25, 1.0], ['spill_b', 189.35, -23.42, 110, 1.15], ['clod_a', 190.7, -23.3, 0, 1.0], ['clod_b', 188.7, -22.28, 40, 1.0], ['clod_b', 192.9, -23.2, 200, 0.8],
        ['spill_b', 213.72, 23.33, 60, 1.25], ['spill_b', 214.6, 23.77, 190, 1.1], ['clod_b', 216.6, 23.3, 80, 1.0], ['clod_a', 215.0, 24.1, 300, 0.9]],
      far: [['spill_a', 261.55, -47.4, 70, 1.0], ['spill_b', 260.2, -47.0, 150, 1.3], ['clod_a', 260.45, -48.75, 20, 1.0], ['clod_b', 259.0, -48.55, 130, 1.0]],
    },
  },
  sedge: { groups: 30, tufts: 3, height: 0.8, thin: 2.2 },      // thin: thin blades go into the mist at this many times their distance
  flats: { terraces: { s: [232, 352], d: [-50, -22] } },      // they run on past the boat's last water (s 316) to the ridge's far end

  // ---- the cast that stands (stand-ins in cast.js until the cast is made)
  sleepers: {
    A: { channel: [[206, 8.4], [207.6, 11.6], [209.4, 9.2], [211, 12]], pan: { s: [204, 214], d: [28, 36], n: 10 } },
    B: { s: [220, 232], d: [-38, -28], n: 12 }, C: { s: [238, 250], d: [36, 46], n: 10 },
    soft: 1.6,
  },
  // (the page: 1,300 left at s 190 to 250, d -30 to -110, and along the ridge's foot. Postcard 10 asks for a thousand birds
  // rising IN FRONT of the ridge, seen from s 252: those must stand along its foot, ahead of the boat; the left pans are behind it by then)
  flock: { right: { n: 1700, s: [180, 300], d: [40, 160] }, left: { n: 1300, pans: 500, foot: 800, s: [190, 250], d: [-110, -30] }, stay: 300 },
  // (the page: 400 within 40 m of the route, one to every 8 by 8 m, thinning to 250 m. From 1.1 m that puts about twenty
  // within 20 m of the boat: too few to fill the air when they rise, and fewer than the key painting has on its sand.
  // The same 1,400 stand closer to the line: one to every 5 by 5 m within 20 m of it, 8 by 8 m to 40 m, the rest thinning out)
  fallen: { count: 1400, inner: { half: 20, cell: 5 }, near: { half: 40, cell: 8 }, reach: 250, depth: -0.13, lampThree: 4,
    pool: { radius: [1.0, 1.9], light: 0.26, color: '#C9D6FF', reach: 32 } },      // the pool of lit, ripple-marked sand round each (the key painting's bottom edge): metres, strength, and how far off it is still drawn

  // ---- the edge of the reachable water (open water: nothing stops the boat at the half width; the engine leans it
  // back harder the further out it goes, and these shallows slow it first)
  shallows: { from: 30, to: 146, step: 20, centre: 27, r: 28, strength: 0.5 },      // soft circles: centre this far beyond the half width, radius, strength

  // ---- THE LIGHT GROUP (stage 2d: set.js, light.js; docs/build/sky/2-light.md). The entries look, light, air, sky,
  // water, dawn, sunline, mirrorGrade, seamIn, cues, show and shallows above are this group's too; what is new is here.
  // THE SALT (light.js): the painted salt everything white wears. One picture, three heights of paint in its channels
  // (salt.webp: raked, old, crust lobes) and the crust pan in crust.webp; the colours are the page's chips.
  salt: {
    hollow: '#8E86B0',                             // what chalk is in a furrow, a pit, a gap between two lobes (the page's greyed lilac)
    brine: '#C98A86',                              // the rose of brine where salt stands in it (the page's rose shallows)
    tile: { raked: 1.8, old: 3.4, crust: 0.55, pan: 1.3 },      // metres to one repeat at its true size (furrows 14 cm apart; lobes 4 to 5 cm)
    trueWithin: 9,                                 // metres: nearer than this the paint is its true size; further off the same strokes are drawn broader, octave by octave, so that a furrow is always about as wide on the picture
    strength: 0.62, lift: 0.5,                     // how far the hollows go to lilac; how much of the darkening is given back on the crests (1 = salt as bright in sum as plain chalk)
    glints: { level: 0.55, one: 8, cell: 0.02, until: [0.08, 0.35] },      // "a few glints" by night: one crystal in `one` cells catches a star (a cell is `cell` of its distance across); gone between these values of the dawn's progress
    strata: 0.5, dusting: 0.3,                     // old salt only by default: faint level bands of older seasons; a grey dusting in slow patches
  },
  // THE LAKE BED (set.js): the `lakebed` picture's swatches on the bed, and the net of crust polygons toward the soft edges.
  lakeBed: {
    tile: { ripple: 1.33, hollows: 1.7, pebbles: 0.95, crazed: 0.85 },      // metres to a repeat (ripple marks 8 cm crest to crest; hollows a hand wide; pebbles a thumbnail to a walnut)
    nightSand: '#C4C5D2',                          // the sand's colour by night (a shade cooler than plan.colors.sand: under starlight and a little lantern the warm one was mauve)
    dawnSand: '#A9B6D4',                           // the sand's colour at first light and behind the wind (by night it is plan.colors.sand)
    crest: [1.3, 1.08],                            // how far over the sand's own colour a ripple's crest is painted: by night (in a lamp's pool), at first light
    trough: '#9CA2D8',                             // what pale sand is in a trough, as a colour that multiplies it: the lilac-blue of shade under water (second pass: was #96A0E0. A trough that kills red makes the marks six times as strong in a lamp's light as by starlight: between the kept lamp and the bow lantern the bed was loud pink corduroy. Less chromatic, and plan.light.bed.lantern -0.45 -> -0.58)
    // (stage 2d, second pass) THE FIRST IMAGE IS THE MIRROR AND NOTHING ELSE. Between these two distances along the route
    // the bed comes to be seen by starlight (the window round the boat opens, the sand takes the sky's light): before the
    // first, at postcard 1, the water is the stars' twins down to the bottom edge of the picture and only the lantern's own
    // stain lies on the sand, as the layout had it; by the second (where the drowned plank walk begins) the lake is a
    // hand deep. `before`: the share of the sky's light the sand takes until then (the layout's number).
    comesIn: { s: [40, 62], before: 0.22 },
    // the stars' own light on the sand, which is white (the sky's light on built things is a deep cobalt, and sand lit by
    // that alone was one electric blue from the hull out to the mirror): star white times `gain`, by night only
    starlight: { color: '#E6EEFF', gain: 0.07, until: [0.15, 0.6] },
    // the bow lantern's light pools on the sand: besides the ride's own lantern light (even to 2 m, gone at 7) a pale core
    // under the lantern, `radius` metres, `gain` times the lantern's colour made `pale` of the way to its own grey
    // (the page's amber is the kept lamp's: the pool is a lilac with warmth in it, never a peach desert). Gone by first light.
    pool: { radius: 2.3, gain: 0.6, pale: 0.45, until: [0.3, 0.8] },
    // the bed is not one even sheet of ripple marks. Across the current lie long low BARS of firmer sand where the marks
    // stand crisp, and between them hollows a pace wide where silt has settled: there the marks keep `keep` of their
    // height and the sand lies `deeper` (as a share of the paint's range). along, across: how long and how wide, as
    // repeats of the slow cloud per metre.
    bars: { along: 0.013, across: 0.085, keep: 0.25, deeper: 0.16 },
    // caustic nets on the sand from dawn progress 0.35 (the page's cast row 18): pale gold, faint; only where the water moves
    // until the wind has come (`still`: the share that lies on water nothing has touched), then everywhere and twice as quick
    caustics: { color: '#FFE9C4', gain: 0.36, from: [0.3, 0.6], speed: 0.35, size: 0.6, still: 0.12 },      // (third pass: size 1.25 -> 0.6 metres to a repeat: over a hand of water a net's meshes are a hand across, not a pace)
    // the net: cells of `cell` metres scattered by `jitter` of a cell (0.6 to 1.6 m across). |d| of: the first low ridge on
    // the sand, where they break the surface, to where, and where the last has sunk again ("beyond it the mirror runs on
    // unbroken"). mirror: both soft edges of the open mirror; flats: the right of the flats (the left is the crust
    // terraces' from d -22). A ridge stands at most `tall` above the sand and `above` over the water; under water it is a
    // soft strip width[0] (deep) to width[1] (at the surface) wide; where it breaks the surface it is a hairline never
    // thinner than minPx on the picture (fainter instead) and not drawn beyond `reach` metres.
    net: { cell: 1.15, jitter: 0.72, seed: 41, ends: 8, mirror: { s: [22, 158], d: [14, 31.5, 44, 53] }, flats: { s: [234, 332], d: [11, 28, 40, 49] }, flatsLeft: { d: [11, 30, 30, 22.5] },
      tall: 0.085, above: 0.014, width: [0.11, 0.045], crest: 0.02, minPx: 1.25, reach: 46, draw: 66, color: '#EFE6D8' },      // draw: the net is drawn only within this many metres of the boat along the route      // crest: how wide a ridge is where it stands out of the water
  },
  // THE AIR AT FIRST LIGHT (set.js): low banks of mist lying on the lake, far off, pale chalk with the lilac of the shade
  // in it. None by night (the mirror is exact and the air is clear); they come with the dawn's progress between `from`,
  // and drift west once the wind has come. One draw.
  // (third pass, 8 November: the banks are the area's own now, not kit.mist. The Shallows group found one lying where the
  // boat goes: its card cut the crust terraces in a ruled level line two metres from the eye, and everything on the near
  // side of it was tinted (sky_sh3_g_prints.png). A kit card is a tall soft ellipse hung over the water wherever chance
  // puts it; half of it hangs under the lake and veils the foreground. These lie ON the lake, each in a place that was
  // chosen: `banks` are [s from, s to, d from, d to, how many], never within 30 m of the line; each is `long` metres by
  // `high` above the water, thickest a metre up; it has gone before the eye comes within near[0] metres of it and is all
  // there beyond near[1]; where it meets anything solid it thins over `soft` metres (the engine's picture of the scene's
  // depth: the ridge's face, a causeway, the hull); `wind` m/s westward once the wind has come, round and round `range`.)
  mist: { color: '#D6D0E2', opacity: 0.34, from: [0.35, 0.85], drift: 0.3, wind: 1.1, near: [14, 36], soft: 5, long: [46, 92], high: [3.5, 8], range: [160, 460], seed: 17,
    banks: [[215, 340, 55, 150, 7],        // across the south pans, behind the cone rows
      [205, 232, -110, -45, 2],            // over the north pans
      [246, 330, -58, -46, 4],             // at the white ridge's foot, on its skirt
      [338, 400, -150, -40, 2],            // round the ridge's east end
      [345, 430, -100, 110, 5],            // far ahead on the open water, under the far ranges
      [190, 214, 40, 120, 1], [190, 214, -120, -40, 1]] },      // behind the works (looking back from the end)
  // THE TIMBER (light.js): salt-bleached wood. The landing's `timber` tile does not exist yet: the area's own grey with
  // the ride's dry-brush tile drawn out long as its grain, and salt bloomed white in the grain.
  // (second pass) tile: the landing's `timber` tile exists since 21:23 on the 7th (assets/art/landing/timber.webp) and is
  // worn here as the page's item 8 asks: metres to a repeat across and along the grain (the landing's own), and how
  // strongly its figure is laid over the thing's paint (0 = not at all, and the picture is then not loaded)
  timberPaint: { grain: 0.2, bloom: 0.3, bloomUp: 0.5, tile: { across: 1.1, along: 1.6, strength: 0.55 } },      // (plan.timber is the Timber group's) bloomUp: more of it on faces that look at the sky ("salt caked on every upper face")
  // where a thing stands in the lake (an option of both): a dark wet band, and a white dry line of crust above it
  waterline: { wet: 0.11, crust: 0.24, ragged: 0.2, timberWet: '#9088A0', saltWet: '#D9C2C4', wetGain: 0.55, crustGain: 0.7 },      // metres above the water; the wet colours multiply the paint

  // ---- THE MONUMENT (stage 2; heroes.js; docs/build/sky/2-monument.md). The places stay above (wader, standers, skein,
  // ridge); these are the monument's own numbers.
  monument: {
    // THE GREAT WADER as it stands. (plan.wader above keeps its place, its lines, its ring and pool and its cues; its
    // `poses` and `mags` there are still what the ring of standers is drawn from, and are left as the layout made them.)
    wader: {
      // each star's magnitude, set by hand against the key painting (the size of each of its stars measured there:
      // docs/build/sky/2-monument.md): the feet brightest, in their rings; the shoulder, where the neck leaves the kite, and
      // the hips next; the neck dimming upward to its seventh star and brightening again to the head; the bill's bend the
      // faintest, its tip bright. 0,1 feet  2,3 ankles  4,5 hips  6 shoulder  7 back  8 tail  9 keel  10..18 neck  19 crown  20 bend of the bill  21 its tip
      mags: [3.2, 3.2, 1.75, 1.7, 2.0, 1.85, 2.1, 1.7, 1.45, 1.65, 1.8, 1.7, 1.6, 1.55, 1.5, 1.4, 1.3, 1.35, 1.5, 1.65, 1.1, 1.8],
      // a star's light is [0] + [1] x its magnitude: the feet 1.6 where the lamp's flame is 6 (the page's rule 6), the
      // faintest 1.14 (every star of it brighter than its hairlines, which are 0.5); what a magnitude changes most is the
      // star's SIZE on the picture: [0] + [1] x magnitude pixels across (4.7 to 8.7), and its skirt: (magnitude - [0]) / [1]
      light: [0.9, 0.22], size: [2.6, 1.9], halo: [1.2, 2.0],
      folded: 0.42,                                              // the share of its light a foot keeps while it is folded under the belly (a foot is "one star in its ring")
      // star white, each a breath of its own (the sky's own three whites)
      tints: ['#F2F4FF', '#F2F4FF', '#E6EEFF', '#DCE6FF', '#E6EEFF', '#E6EEFF', '#F2F0FF', '#E6EEFF', '#DCE6FF', '#E6EEFF', '#E6EEFF', '#DCE6FF', '#E6EEFF', '#E6EEFF', '#F2F0FF', '#E6EEFF', '#DCE6FF', '#E6EEFF', '#E6EEFF', '#F2F0FF', '#DCE6FF', '#F2F4FF'],
      principal: [0, 1, 4, 6],                                   // the stars that are there before the lines draw (the feet, the forward hip, the shoulder), as ordinary stars: the first image is empty
      line: { light: 0.5, width: 1.5 },                          // the hairlines: half a star's light, a pixel and a half
      // THE THREE HELD POSES, each checked against the page's measures (the log has the table). [u, y, w] as plan.wader says.
      poses: {
        // head up, 72 m: body underside at 34, back at 47, ankles at 16, the neck 40 m along its S, the head and the bill's
        // first part one line of 6.4 m from the crown, the bill bent down for its last 2.4 m
        awake: [[-3, 0, 4], [3, 0, -4], [-1.2, 16, 4], [4.8, 16, -4], [-3.2, 34, 1.2], [2.6, 34, -1.2], [-11.5, 42.5, 0], [0.5, 47, 0], [14, 39.5, 0], [-9.5, 35.5, 0],
          [-15.2, 45.8, 0], [-19.0, 49.4, 0], [-22.0, 53.8, 0], [-23.2, 58.8, 0], [-22.0, 63.6, 0], [-19.0, 67.0, 0], [-15.8, 68.8, 0], [-13.6, 70.4, 0], [-14.4, 71.8, 0], [-16.6, 72.0, 0], [-22.8, 70.6, 0], [-23.8, 68.4, 0]],
        // asleep on one leg, 50 m: the body an egg tilted 20 degrees tail-down, the standing leg plumb under its middle, the
        // neck a flat coil on the shoulders with the head laid forward under it, the folded leg a small bump under the belly
        // (the layout's was an umbrella on a stick: a level kite under a tall loop)
        asleep: [[0, 0, 0], [4.0, 31.5, -1], [1.4, 16, 0], [6.3, 29.8, -1], [-0.2, 33.8, 0.6], [3.6, 33.0, -0.6], [-11.0, 44.4, 0], [-2.5, 48.0, 0], [12.8, 35.4, 0], [-9.4, 37.4, 0],
          [-11.9, 47.0, 0], [-10.0, 49.0, 0], [-6.2, 50.0, 0], [-2.0, 49.8, 0], [1.9, 48.6, 0], [4.4, 46.6, 0], [3.5, 44.9, 0], [0.9, 45.9, 0], [-1.5, 47.5, 0], [-3.7, 48.8, 0], [-6.0, 48.2, 0], [-7.6, 47.0, 0]],
        // bowed across the route to feed: the body tipped 18 degrees forward, the keel of the breast 30 m straight over the
        // line (u -14), the neck one curve of nine stars down to the head on the water 13 m left of the line, the bill
        // turned back toward the feet. With its reflection: a ring 60 m tall and 30 m wide
        bowed: [[-3, 0, 4], [3, 0, -4], [-1.2, 16, 4], [4.8, 16, -4], [-3.4, 33.6, 1.2], [2.6, 35.2, -1.2], [-15.0, 34.4, 0], [-2.6, 42.6, 0], [12.0, 43.0, 0], [-14, 30, 0],
          [-18.6, 35.2, 0], [-22.2, 33.6, 0], [-25.2, 30.4, 0], [-27.2, 26.2, 0], [-28.3, 21.6, 0], [-28.7, 16.8, 0], [-28.5, 12.0, 0], [-28.0, 7.4, 0], [-27.4, 3.2, 0], [-27.0, 0.9, 0], [-23.4, 0.45, 0], [-21.0, 0.25, 0]],
      },
      // THE DUST inside the kite of the body only. lobes: three soft ellipsoid shells in the kite's own frame (at: metres
      // along its long axis toward the tail and up from its middle; size: half length, half height, half depth), nebula
      // violet at 6 to 10 parts in a hundred, rose in the belly. soft: how fast a shell dies toward its rim. motes: the
      // sprinkle of small stars in the body (one in three rose); across: metres either side of the kite's plane
      // (light: the page says 6 to 10 per cent. Added to this night at that, the dust cannot be seen at all; the key painting's
      // dust measures as nebula violet light at 0.3 (#3F417E in the kite on a sky of #162459) and the layout's glows gave
      // #302D79 on #121A58. These are set between the page and the painting: faint, and there.)
      dust: { lobes: [{ at: [0.6, 1.0], size: [9.6, 4.0, 3.4], color: '#6A509C', light: 0.17 }, { at: [7.0, 0.7], size: [5.4, 2.6, 2.6], color: '#6A509C', light: 0.13 }, { at: [-4.6, -1.1], size: [4.6, 2.6, 2.8], color: '#C06A98', light: 0.065 }],
        soft: 1.6, breath: 0.14, motes: 58, moteSize: [1.3, 2.0], moteLight: [0.1, 0.34], across: 1.6, seed: 4107 },
      // a slow life while it stands: asleep the body rises and falls `breath` metres over `breathEvery` seconds; awake the
      // head turns `head` degrees and back in `headEvery` seconds; every `every` seconds one star (in this order) swells
      // by `by` of its light over `swell` seconds
      life: { breath: 0.12, breathEvery: 16, head: 1.0, headEvery: 120, every: 23, swell: 8, by: 0.5, order: [6, 19, 8, 4, 21, 7, 13, 9, 5, 2, 17, 0] },
    },
    ridge: {
      file: 'models/sky/ridge.glb', origin: [296, -92],            // the model's own origin: the middle of the footprint (source-art/models/sky/ridge.py: Blender x = d + 92, y = s - 296)
      lip: 0.52,                                                   // the level lip of its undercut, metres above the water
      brush: 0.9,
      // the painted salt (light.js) of its slots: crust of older seasons, raked and with its strata; salt that has lately
      // moved (tongues, scarps, aprons, the bay), all but plain; the skirt's rims and the undercut, lobed crust and pan
      // (second sculpt, 8 November: three slots of salt on the heap. work: the raked working face the barrow run climbs (slot
      // `paint`); old: crust of older seasons, the east half and the shoulders (slot `old`); fresh: salt that has lately moved)
      salt: { work: { kind: [0.78, 0.22, 0, 0], strength: 0.62, trueWithin: 24, strata: 0.35, dusting: 0.15 }, old: { kind: [0.3, 0.7, 0, 0], strength: 0.7, trueWithin: 24, strata: 0.8, dusting: 0.5 }, fresh: { kind: 'raked', strength: 0.3, strata: 0, dusting: 0, tile: 2.8, trueWithin: 24 }, crust: { kind: [0, 0, 0.6, 0.4], strength: 0.8, glints: 0.3 } },      // (trueWithin: a mountain's furrows stay their true size further off than a cone's)
      // FORM IN THE DAWN'S SHADE (heroes.js). Below the sunline there is only sky light, and the area's light gives every
      // face the same share of it: the south face was one flat lilac from the foot to the sunline. But the sky at first
      // light is not even: its east is the brighter and warmer half. A side of a heap turned east takes `color` more of
      // it and a side turned west gives a share back (`pivot`: 0 = nothing is ever taken away, 1 = only taken away), in
      // the same three flat steps in which first light itself falls on them, so the sunline comes down over facets
      // that are already there in a minor key. Only between these values of the dawn's progress, and only below the sunline.
      form: { tint: [0.52, 0.38, 0.2], gain: 1.0, pivot: 0.42, dawn: [0.1, 0.42], steep: 1.1, steepInSun: 0.6, floor: 0.3 },      // tint: the light a face has is multiplied by 1 + tint x (how far it is turned east, less the pivot): warmer and lighter toward the east, cooler and darker away from it; never under `floor` of what it had      // steep: and a face sees less of the sky the steeper it stands: a cut wall, a scarp, a rill's side are darker than a face at rest, a ledge or a terrace lighter (steepInSun: the share of that which first light takes away)
      // by night it has no edge (heroes.js): it is as thick as the eye's ray is long inside it, 1 - exp(-metres / length);
      // closed up between these values of the dawn's progress (before the 'far' air opens at 0.45). night: the share of
      // the night's light it takes
      ghost: { length: 11, until: [0.08, 0.4] }, night: 1.0,
      pale: '#131D5C',                                             // the breath of its own paleness it keeps by night, however far off (light, added)
      glints: { count: 46, seed: 2117, size: [1.5, 2.5], light: [0.5, 1.7], fade: [0.15, 0.45] },      // a few crystals that catch a star: sizes in pixels, their light, gone between these values of the dawn's progress
      brine: { sheen: 0.16, lift: 0.2, dawn: [0.1, 0.5] },         // how much of the low sky its brine holds where the eye looks along it; the even light it has of itself from first light (between these values of the dawn's progress)
      // THE MARKS OF THE RAKE AND OF THE RAIN (third holder, 8 November; heroes.js, "THE MARKS"). The boat is never nearer
      // the face than 26 m: at that distance the painted salt's furrows (14 cm) are under the painter's brush and the face
      // was a quiet sheet. So the ridge has a relief of its own, drawn in its material as form (it turns the face's own
      // normal, so first light and the dawn's shade fall on it as on anything modelled) and as paint (lilac in the hollows):
      //   rows    the working face is RAKED: rows combed across it, level, `every` metres apart up the slope and `depth`
      //           deep, in sweeps `panel` metres wide that do not quite meet (each tilted by up to `tilt` and bowed by up
      //           to `bow` metres); every `lift`-th row is the bench the raker stood on, `liftDepth` deep
      //   flutes  the old faces are FLUTED by the rain: rills straight down each side of each heap, `every` metres apart,
      //           to `depth` deep, wandering `wander` of their spacing; none on the loose foot (below `foot` metres)
      //   strata  the dust of older seasons: level lines [height, half thickness, strength], sagging `sag` metres
      // WHERE a face is raked and where it is fluted the MODEL says, face by face (ridge.py, marks(): its UVs); work / old /
      // fresh are how much of each the three slots of salt carry on top of that (the strata are theirs alone: none on fresh
      // salt). dawn: nothing of it by night (the ghost has no marks); it comes between these values of the dawn's progress.
      relief: { dawn: [0.06, 0.36], hollow: '#8E86B0', stratum: '#BDB3D2', tint: 0.5,
        rows: { every: 0.6, depth: 0.05, lift: 4, liftDepth: 0.12, panel: 5.2, tilt: 0.05, bow: 0.35 },
        flutes: { every: 1.15, depth: 0.2, wander: 0.22, foot: [1.4, 4.5] },
        strata: [[2.9, 0.12, 0.5], [5.4, 0.2, 0.8], [6.1, 0.09, 0.45], [9.6, 0.28, 1.0], [12.7, 0.11, 0.55], [13.9, 0.18, 0.8], [17.4, 0.26, 0.9], [21.2, 0.1, 0.5], [22.3, 0.22, 0.85], [26.6, 0.16, 0.7], [29.9, 0.13, 0.5]], sag: 0.6,
        work: { rows: 1, flutes: 1, strata: 0.45 }, old: { rows: 1, flutes: 1, strata: 1 }, fresh: { rows: 1, flutes: 1, strata: 0 } },
      grid: { s: [228, 364], d: [-142, -42], cell: 0.25 },         // the heap's height as sculpted, read off the model for shared.ridge.heightAt / faceAt
      collide: { from: 232, to: 324, step: 7, d: -47.5, r: 4.2 },  // the hull stops at the skirt's edge (the stand-in's own row of circles)
    },
  },

  // ---- THE SHALLOWS GROUP (stage 2; kit_shallows.js; docs/build/sky/2-kit-shallows.md). The places stay above
  // (stakes, lamp.at, sedge, flats.terraces, jetty); these are the kit's own numbers.
  kitShallows: {
    // which of the four stakes stands where (a plain, b split head and the one iron band, c the one ring, d burred and
    // short with a rotted line). The first, beside the lamp, is the plain one; the split heads stand where no tern sits.
    stakes: { variants: ['a', 'c', 'd', 'b', 'a', 'd', 'b', 'c', 'a'], lean: [0.5, 6], scatter: 0.16, seed: 83, first: '#b6b0c6' },
    collars: { variants: ['a', 'c', 'b', 'a', 'b', 'c', 'a', 'b', 'c'], fits: 0.085, scale: [0.92, 1.1], dress: 0.25, lamp: { scale: 0.84, high: 0.86, turn: 2.2 } },      // fits: the post radius a collar is modelled round (it has no hole: the post stands through it, so it is scaled a little with its post and never to it). lamp: the engine's post is 14 cm thick at the water; collar_c's sleeve stands 30 cm as modelled, 25 cm so (the page)
    sight: 80,                                    // small far things (the far jetty's collars, the crust rafts) are drawn only while the boat is within this many metres of them along the route
    lamp: 0.8,                                    // and the kept lamp's the same way: this much of it a metre off, a seventh of it 2 m off (the first stake stands there: it was a salmon stick beside the one warm light)
    lantern: 2.2,                                 // the kit takes the bow lantern's light by the square of the distance: this much of it at arm's length, a fifth of it at 3 m (kit_shallows.js, THE BOW LANTERN'S LIGHT)
    crisp: [14, 34],                              // thin things keep out of the painter's filter beyond these metres (all of it by the second)
    // the crust terraces (terraces.glb and terraces.json: the heights and the shore line travel with the model). cell: the
    // polygon ridges' cells, metres (drawn in the material); collide: the radius of the circles that keep the hull off the crust
    // brine: the skin of the brine's own colour over each pool (terraces_brine.glb): how thick it lies, how much of it gives
    // way to the mirror where the eye looks along it, and the values of the dawn's progress between which it comes
    terraces: { cell: 1.15, crisp: [9, 28], collide: 1.6, brine: { dense: 0.72, sheen: 0.55, dawn: [0.1, 0.5], tile: 2.6, art: 0.7 }, far: 188,      // tile, art: metres to a repeat of the painted brine on each pool's skin, and how much of the skin's colour is the painting's;      // far: before this metre of the route the far form is drawn (the nearest of the terraces is then 44 m off and more)
      // the crust's own painting (fourth holder; kit_shallows.js, THE CRUST'S OWN PAINTING). craze: metres to a repeat of the
      // Light group's crazed salt at its true size; trueWithin: nearer than this it is its true size, further off the same
      // strokes are drawn broader; light: the way first light comes from, on the ground (x, z), for the shade beside a welt;
      // plates, crazing, rim: how strongly each is laid; tide: metres of height between two tide lines on a pool's bank;
      // face: what the crust's own lip is multiplied by where it stands up from the water
      paint: { craze: 2.3, trueWithin: 4, light: [-0.41, -0.912], plates: 1, crazing: 0.7, tide: 0.007, rim: 0.7, face: [0.36, 0.35, 0.58] } },
    // the broken edge (third holder): crust rafts grown along the terraces' shore and round the shoal. reach: between these
    // metres of the route; cusp, lobe: how many of the shore's laps hold new crust and how many of its points have lost a
    // plate; drift: metres between the few that lie further out, awash; tol: how fine their outlines are kept (a share of a raft)
    rafts: { seed: 211, tol: 0.014, reach: [232, 331], cusp: 0.9, lobe: 0.85, drift: [8, 14], stretch: 33 },      // (lobe: no longer used: the pieces that left lie where terraces.json lists a break)
    // shed feathers at the waterline (the page's close band, the flats, left): afloat in the laps of the shore and on the
    // crust beside the lines of prints. laps, trails: how many of each hold one; length: metres; crisp: kept out of the
    // painter's filter beyond these metres (a feather is a thin thing)
    feathers: { seed: 223, reach: [234, 322], laps: 0.7, trails: 0.7, length: [0.1, 0.16], crisp: [3, 9] },
    // the fallen-star pebbles and their scour hollows (pebble.py). size: metres, the pebble's longest way; hollow: the range
    // of its scale (the model is 46 cm long and dips 3 cm: a hollow is 25 to 40 cm long; at its full size and larger an emptied one was a pale blot on the sand at first light); within: a star gets a pebble if it lies within this many metres
    // of water the boat can reach; near: beyond these metres from the eye a pebble is not drawn (all of it within the first:
    // 12 m off a pebble is five pixels wide under the cast's light); stretch: they are laid in stretches of the route this long,
    // and only the stretches round the boat are drawn;
    // glow: the pebble's own light (its paint times this); pool: the share of it that lies in its hollow; lantern: how
    // much more within 3 m of the prow lantern (the page: "brighten by half")
    pebbles: { size: [0.06, 0.09], hollow: [0.55, 0.85], within: 12, near: [12, 18], stretch: 44, glow: 4.5, pool: 0.14, lantern: 0.5, seed: 131 },      // (glow: the water over it is a mirror, and 14 parts in a hundred of the bed come through it looking straight down, 5 at 3 m: at 1.45 a pebble 3 m off was a grey ghost under its light)
    // sedge (grown in code): twelve groups a side between `from` and `to` at d `d`, never evenly; px: half the least width
    // of a blade on the picture, in pixels (a blade is a centimetre wide: far off it would be a dotted wire); `more`: the page's six
    // (causeway ends, the flats: the first of the flats' stands on the terraces' edge), [s, d]
    sedge: { seed: 97, tufts: 3, height: 0.8, px: 0.85, from: 30, to: 146, d: [35, 38], more: [[148, -27], [149, 28], [236.5, -25.2], [235, 28], [262, 29], [288.4, 12.4]] },      // (the last stands off the far corner of the shoal at the far jetty's root)
  },
};
