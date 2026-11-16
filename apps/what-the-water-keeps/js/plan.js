// The landing: the area's numbers, taken from its page (docs/art/landing.md). Plain data and small functions; no
// three.js objects. Every module reads this, so that a thing is where the page says in all of them.
//
// Conventions (the page's): s = metres along the centre line from the start of the path, d = metres to the RIGHT of
// it (negative is left), heights are metres above the water (y = 0). Bearings are degrees to the right of the
// starting heading. Convert with at(ctx.path, s, d, y) below (or shared.landing.at): it is kit.at, except that it
// runs straight on beyond both ends of the path, because the page places things at s -9 (the head of the backwater)
// and at s 123 (the last masts in the haze), and kit.at stops at the ends.
//
// ADD to this file under a heading of your own; change a number here only when the page says it is wrong
// (docs/building-an-area.md), and say so in your log.

// ============================================================================================ the frame
const _f = {}, _g = {}, _h = {};
/** The path's frame at s (x, z, tx, tz, rx, rz, halfWidth, heading), running straight on beyond both ends. */
export function frame(path, s, out = {}) {
  const c = Math.min(path.length, Math.max(0, s)), p = path.at(c, out), over = s - c;
  if (over) { p.x += p.tx * over; p.z += p.tz * over; }
  p.s = s;
  return p;
}
/** [x, y, z] in the realm's own coordinates of the page's (s, d, height). */
export function at(path, s, d = 0, y = 0) { const p = frame(path, s, _f); return [p.x + p.rx * d, y, p.z + p.rz * d]; }
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** A value from a table of [s, value] rows, eased between them. */
const table = (rows, s) => { if (s <= rows[0][0]) return rows[0][1]; for (let i = 1; i < rows.length; i++) if (s <= rows[i][0]) return lerp(rows[i - 1][1], rows[i][1], sm(rows[i - 1][0], rows[i][0], s)); return rows[rows.length - 1][1]; };

// ============================================================================================ colours (section 2)
export const C = {
  honey: '#E8B24A', cream: '#FFE7A8', straw: '#8F6A2C', tea: '#4A2E18', amber: '#A5651F', olive: '#6B6E32', oliveShade: '#2B3018',
  grey: '#9A8770', blue: '#2C9FD8',
  skyCool: '#B9C2AE', putty: '#A39A84',
  // local colours of things (paint these; the light does the rest)
  reedStem: '#C9A24B', reedShade: '#7A5A2A', plume: '#B58A4A', shoot: '#74712F',      // (the page's shoots, #7C8136, are a vivid green when the sun is on them)
  plumeLit: '#F2C25E',                    // the pale side of a plume. (#E6CC8E, as first laid out, came out paler and greyer than the sky behind it: white blots along the reed tops)
  timber: '#9A8770', timberWet: '#5C4A36', timberOld: '#7E6A52', board: '#A8957A', boardNew: '#C4B190',
  reedmaceHead: '#5A3A22', reedmaceLeaf: '#7E7A3A', iris: '#6B7434', irisFlower: '#E8C23A', sedge: '#77763A',
  pad: '#6B6E32', padUnder: '#7A4424', withy: '#6E5A3A', stone: '#B8A98A', wicker: '#8F6A2C', bundle: '#9C7E3C', rick: '#A8863C', thatch: '#8F7434',
  turf: '#6E5E36', mud: '#4A3A1C', sand: '#C4AE80', bed: '#3A2814', fenBed: '#5E4C22', stubble: '#A8893E',      // (sand: #A89060 as laid out; paler since stage 2: it is seen through a hand of tea water, in shade)
  cloth: '#F0EEE6',                       // undyed cloth. The reach's cream is #F3DDB0; here it is painted white, because the light that
                                          // comes through it is already flame cream: a cream cloth in this light is yellow
  heron: '#4E483C',                       // (weathered grey #9A8770 in the light; this is its stand-in's, darker, to be seen at 47 m against the bright fen)
};

// ============================================================================================ the plan
export const PLAN = {
  id: 'landing',
  C,
  at, frame,

  // ---- the waterway (section 3). Its centre line is the composed line. 81.1 m; straight for 28 m, bends right
  // through 39 degrees between s 30 and s 64, straight to the end. 18 m wide to s 20, 28 m at s 40 (the mere),
  // 20 m from s 56. The engine's veil out takes the last 30 per cent: from s 56.8.
  path: { points: [[0, 0, 9], [0, -20, 9], [1.5, -40, 14], [8.5, -53, 10], [24.6, -73.6, 10]], startStop: true, softEdges: false },
  length: 81.1,
  veilFrom: 56.8,

  // ---- the mooring: where the boat waits under the title, on its painter, its side 1.3 m off the staithe
  // (the page: d -8.05, hard against the boardwalk. The rider's eye is on the boat's centre line, 1.12 m up, and the
  // gunwale hides all water nearer than 1.03 m: at -8.05 there are 19 cm of water between hull and staithe and none
  // of it can be seen; at -7.5, as first laid out, a strip 0.4 m wide, and postcard 3, "over the side", was a picture
  // of boards. At -7.0 the strip is 0.9 m wide and lies in the middle of that postcard. 1-layout.md)
  title: { s: 14, d: -7.0, heading: 0, yaw: -17, pitch: 4 },
  // the release: the boat left alone is eased from the staithe to d -4 over its first 10 m (so that it passes the lamp
  // at 5 to 6 m and the lamp tuft at more than 3 m), and on to the centre line by the bridge. [s, d] rows.
  line: [[14, -7.0], [24, -4], [30, -4], [38, 0], [200, 0]],
  lineAt(s) { return table(this.line, s); },
  // the mote's 14 m of water; then the painter slips and the boat is let go. low: the height it skims the water at
  // (it comes down from the lamp in the first 40 per cent of the way and rises to the prow lantern in the last 30):
  // the engine's own path arcs UP 0.6 m, which from the boat puts the flame 20 degrees above its reflection; skimming,
  // the two are a pair. halo, stroke: its daylight aids, as the lamp's ([size, strength, colour]; stroke: mirror only)
  crossing: { seconds: 7, release: 2.6, low: 0.62, halo: [1.3, 1.2, '#FF8E30'], stroke: [0.9, 5, '#FF8A28'] },
  // the current, m/s, by distance (the page: 1.2 through the backwater and the mere, 1.6 down the straight)
  current: [[0, 1.2], [50, 1.2], [58, 1.6], [200, 1.6]],
  currentAt(s) { return table(this.current, s); },

  // ---- the sun: light on the sky, never an object. Its azimuth is the heading of the last straight
  // (ctx.path.at(78).heading): 38.8 degrees right of the bow.
  sun: {
    headingAt: 78, elevation: 4.6, elevationEnd: 4.0,
    // (third holder: core 0.5 across 2.4 degrees; the page and the first two holders: 3.5 across 1.2. A pale heart
    // 3.5 times over, a degree wide, is a point of light: from the mooring it sat on the bridge's deck like a second lamp
    // (.shots/landing_l3_p1_before.png), and "nothing else in the area is a point of light" is the page's own first
    // reason the kept lamp can be read. The sun is the GOLD: its aureole here, the fire in the reeds, the light through the cloth.)
    core: 0.5, coreAcross: 2.4, radius: 9, coreColor: '#FFEFC4', rimColor: '#FFD98A',
    // (stage 2, Light: 2-light.md) the spot's aureole is GOLD and takes the place of the sky it lies on, instead of
    // cream added to it: aura = how bright that gold (linear), auraTake = how much of the sky it takes at its middle.
    // rimColor above is no longer read by the sky; auraColor is. The page's pale core stays, small, and blooms.
    // (third holder: aura 2.4 in '#FF9330'; it was 1.25 in '#FFBE4A', which the final pass shows as a pale straw. Typed
    // this red and this bright it is SHOWN as the key painting's deep yellow, about #F5BA44, and it glows.)
    aura: 2.4, auraTake: 0.7, auraColor: '#FF9330',
  },
  // the sun's fire in the reeds (light.js: every plant between the eye and the sun takes it): the strengths of its
  // three lobes: honey within 14 degrees, deep gold within 7, the pale heart within 3
  // (as first laid out these were cream and strong, 0.8 and 1.5, and made a bank of pale fog: now they only warm the
  // reeds that stand toward the sun, and the sun's bloom itself is a light in the bed: sunGlow)
  // (stage 2, Light, second holder: stems: how much of it the single stems of the front rank take (they are what the
  // fire is seen through); wideColor, midColor: the two lobes' colours, linear)
  // (it was wide 0.2, mid 0.25 on every reed alike, in paler golds [1, 0.68, 0.26] and [1, 0.60, 0.19]: from the
  // mooring and from the head of the backwater the right bank was a grey-olive haze. Now the bed BEHIND the front rank
  // burns, in a deeper gold, and the front stems stand dark before it: .shots/landing_l2_fire_c.png, _cC.png)
  // (third holder: the middle lobe is no longer ADDED to the reeds, it takes their place: mid = how bright the gold the
  // bed is gone into where the sun stands behind it (linear), take = how much of the reed it takes at the lobe's middle,
  // power = how tight the lobe (90: half its strength seven degrees off the sun), low = the share of it that plants
  // lower than a reed take (reedmace, iris, sedge: they stand BEFORE the bed). wide is the old added warmth and is all
  // but off: at 1.0 with mid 1.6, both added, the bank toward the sun was a khaki haze: .shots/landing_l3_C4_crop.png)
  // (midColor is typed far redder than the gold it is SHOWN as: the final pass shows linear (1.7, 0.53, 0.06) as #F2B63E,
  // the key painting's sun; (1.25, 0.62, 0.12), as first tried, is shown as a pale straw, #EDC25F: docs/build/landing/display.py)
  // (heart: the brightness of the paler gold the bed is gone into within about three degrees of the sun; heartColor, heartPower)
  fire: { wide: 0.2, mid: 2.0, take: 0.9, power: 90, low: 0.3, heart: 2.6, heartColor: [1.0, 0.45, 0.08], heartPower: 480, stems: 0.1, wideColor: [1.0, 0.55, 0.12], midColor: [1.0, 0.31, 0.035] },
  // the sun's bloom in the reeds and behind the cloth (set.js): one soft light on the line from the eye to the sun,
  // `inset` metres inside the reed bed, so that the outer stems stand dark against it. radius: degrees, as the sun's
  // spot on the sky; heart: the pale heart's share of that radius; reeds: its strength there; veil: the strength of
  // the faint veil of the same light that lies over everything where the sun is. Behind the cloth it is another
  // light: wider (clothRadius), with no heart, and weak enough (cloth) that the linen never passes paper white
  // (heart 0.14 and reeds 2.2, a small white-hot heart, showed between the stems as a spray of white specks that would
  // twinkle as the reeds sway: glitter. A wide heart that never passes paper white is a glow.)
  // (reeds 1.3 and veil 0.3, as the second builder left them, still laid a milk over the bridge's right tower and the
  // nearer reeds as the mooring sees them; at 1.0 and 0.15 the tower stands a clear step darker in the fire and the
  // heart is still the brightest thing in the picture: .shots/landing_postcards_c_sun.jpg)
  // (stage 2, Light: 2-light.md. The light in the reeds is now a GLARE: it takes the place of what stands behind it
  // (take), in gold (reeds: the brightness of its body; rim: its colour at the edge), and only a small heart (heart: its
  // share of the radius; reedsHeart: its brightness) is pale and blooms. Added in cream to forty metres of olive reed,
  // as it was (heart 0.4, reeds 1.0, veil 0.15, rim #FFB84A), it was a bank of grey-white fog over the bridge's right
  // end and the right bank: .shots/landing_l_t4_crop.png. The veil is off: it lay on every dark where the sun is.)
  // (second holder: far: what is left of it where the line to the sun finds nothing nearer than about 60 m, and the light
  // would stand bare; mirror: what the water shows of it)
  // (third holder: reeds 0 and reedsHeart 0: THE GLARE IN THE REEDS IS OFF. It was 2.6 with a heart of 3.5: a white-hot
  // ball. Near to, the bed's own reeds hid all but a white blot of it (.shots/landing_l3_C5_crop.png); from the mooring
  // its upper half stood in the open sky on the bridge's deck (.shots/landing_l3_sunB_crop.png) and took the door's masts
  // and the bridge's end with it. The sun's fire is now in the reeds' own paint (fire, above): it cannot leave the reeds,
  // cannot be a disc, and the water mirrors it by itself. The glare's code stands in set.js: reeds: 1.1, reedsHeart: 0.3,
  // heart: 0.3, core '#FFC86A' gives a gentle gold one; inReedsOnly (1) keeps it below the reeds' tops.)
  sunGlow: { radius: 9, heart: 0.16, inset: 2.5, reeds: 0, reedsHeart: 0, take: 0.9, veil: 0, core: '#FFE6A8', rim: '#FF9A28', far: 0.4, mirror: 0.45, inReedsOnly: 1,
    // (stage 2: behind the cloth the light comes THROUGH it: the cloth's own picture is multiplied by 1 + light, so its
    // folds stay. cloth: the wide swell's strength; clothHeart: a broad pale middle where the sun stands (clothHeartAt:
    // its share of the radius), never a disc; the lit linen may reach 1.6 there, the page's limit for thin things.
    // As laid out: cloth 0.5, added, no middle.)
    // (cloth 0.9 with clothHeart 1.5, as first tried, took the linen to 2 and more: its bloom lay orange over the water
    // and the boat's bow)
    cloth: 0.5, clothHeart: 0.6, clothHeartAt: 0.34, clothRadius: 24, clothCore: '#FFEFD0', clothRim: '#FFC870' },
  // how a plant takes the light by its height (light.js, plantExt; heights as shares of the plant's `tall`):
  //   feet: [darkest, from, to]  its paint is `darkest` of itself at the foot and whole from `to` up
  //   glow: [floor, from, to]    the backlight (cream through blades and plumes) is `floor` of itself below `from`
  //                              and whole from `to` up
  // (as first laid out: feet [0.55, 0, 0.6], glow [0.1, 0.3, 0.9]: the whole upper two thirds of every reed glowed,
  // and seen against the sun the right bank was one pale value from the water to the plumes, where the page wants
  // "reed in the shade 0.22 to 0.32" under "plumes alight": a dark body with a burning crown. 1-layout.md)
  // (stage 2, Light: feet [0.25, 0.05, 0.9], glow [0.04, 0.65, 0.97]; they were [0.4, 0.05, 0.75] and [0.04, 0.5, 0.95].
  // Seen against the sun from the mooring the regrown right bank was still one pale straw value from the water up;
  // now its body is the darker mass the sun's glare and the plumes stand on: .shots/landing_postcards_l_r1.jpg)
  // (third holder) crown: [gain, from, to]: the backlight once more at the very top of a plant (its plume, its blade
  // tips), from `from` to `to` of its height: a plume against a sky of 0.5 must stand ABOVE the sky to be alight
  plantLight: { feet: [0.25, 0.05, 0.9], glow: [0.04, 0.65, 0.97], crown: [1.8, 0.85, 1.05] },
  // the wind in the reeds (cast, row 12): from the sun's quarter toward the left rear
  wind: { length: 28, period: 7, lean: 0.42, shiver: 0.015 },

  // ---- light and air (section 2: the two states, blended by distance over blend)
  look: {
    // (the page: background and fog #E9C886, end fog #F0D7A2. The fog must be the sky's colour at the horizon, or a
    // line shows where the far water meets it; the painted sky is a step deeper than the page's numbers.)
    // Typed #EF984E, it is SHOWN as #E3A04C, the painted sky's colour at the horizon (the final pass lightens and yellows).
    background: '#EF984E',
    fog: { color: '#EF984E', density: 0.0038 },                 // 300 m still reads; the far backdrops use fog: 0.4
    veil: '#EF984E', veilIn: 0,                                  // nothing to come out of: the picture fades up on the title view
    exposure: 0.98,
    // (the page: threshold 0.9. A cream surface is brighter than 0.9 before the final pass, so at 0.9 the whole cloth
    // blooms into a glare; at 1.05 only the sun, the flames and the nearest plumes do.)
    bloom: { strength: 0.42, radius: 0.85, threshold: 1.05 },
    // (the page: tint #FFF3DC, saturation 1.04, contrast 1.05, no toe. As typed every dark loses its blue channel
    // and the area is a gold filter: 1-layout.md. With these the darks come out as the key painting's.)
    grade: { tint: '#FFF8EA', saturation: 1.0, contrast: 1.0, lift: '#120C05', vignette: 0.26, grain: 0.035, toe: 0.7 },
    paint: 0.8, paintRadius: 5.0,                                // broad strokes: the reeds must read as massed paint
    current: 1.2, currentNarrow: 1.2,                            // (set.js sets both every frame from the boat's distance: currentAt)
    lantern: 1.5, lanternLit: 0,                                 // the prow lantern is cold until the flame has crossed
    // the rider's boat (the engine's, remodelled: docs/life/boat.md). As the engine gives it, its paint is a pale slate
    // blue and its gunwale the lightest near thing in the title view, in an area that has no blue but the dragonflies'.
    // `tone` multiplies the whole boat: here it is worn wood in the evening's own brown, a step under the staithe
    boat: { tone: '#C2A277' },
    // (the page: keyColor #FFD98A, lit #FFE9B8. Their product has almost no blue, so nothing the sun lights can be
    // cream: the cloth came out yellow. The light itself is flame cream, #FFE7A8.)
    light: { key: [-0.625, -0.080, 0.777], keyColor: '#FFE7A8', shadow: '#6B5540', lit: '#FFF1D0', gain: 1.3,
      sky: '#7E7A60', ground: '#5C4222', lanternRadius: 4.5, heightFog: 0.3, heightFogOver: 1.4 },      // (stage 2: the page's 0.22 over 3.5 m veiled the whole height of the far reeds; lower and thicker it is mist LYING ON THE WATER: the feet of far things stand in it and their bodies stay dark)
    blend: [0.3, 0.95],
  },
  lookEnd: {
    fog: { color: '#FFAF5B', density: 0.0052 },                  // shown as #EBAE58: the sky's horizon at the door
    exposure: 1.06,
    bloom: { strength: 0.5, radius: 0.9, threshold: 1.0 },       // (the page: 0.88)
    light: { key: [-0.627, -0.070, 0.776], keyColor: '#FFE2A0', lit: '#FFEDC8', gain: 1.38, heightFog: 0.5, heightFogOver: 2.4 },      // (the page: #FFCF7C, #FFE3A8; heightFog 0.34. Stage 2: toward the door the mist thickens and stands higher)
  },
  sky: {
    // The gradient the painted sky stands in, by elevation. (The page: top #B9C2AE, mid #DCC998, horizon #EFCB80, midAt
    // 0.3. These are the painting's own colours at its edges, so that it melts into the gradient; they are a step deeper
    // than the page's, as the key painting is: 1-layout.md.)
    horizon: '#E3A04C', mid: '#CFA766', top: '#B0A780', below: '#B98C46', stops: [13, 30],        // mid at 13 degrees, top from 30 degrees up
    panoramaGlow: 1.05,
    end: { horizon: '#EBAE58', mid: '#D6AE6A', top: '#B0A780', panoramaGlow: 1.18 },
    east: '#A39A84',                                             // the quiet side: putty and grey-green, a darker low band
    eastBand: '#938A6C', eastBelt: '#BFB08C',                    // (stage 2) that low band (to about ten degrees: the bridge's height from the straight), and the pale warm belt above it
    // the painting (image 2, source-art/landing/sky.png): the western sky as a window 99 degrees wide, which puts its
    // cloud tower at bearing +9 and its sun's bloom on the sun (sunAt: where the bloom is in the picture, 0..1)
    // (stage 2, Light: span 130, not 99. The painting stands a third larger: its cloud tower is then 27 degrees wide and
    // 28 tall at bearing -2, a mountain of cloud over the bridge, left of the middle of the title view as in the key
    // painting; at 99 it was a cloud beside the bridge. The page asks 15 by 24 at bearing +10. 2-light.md)
    pano: { sunAt: 0.692, span: 130, lo: 1.5, fadeSide: 0.12, fadeTop: 0.3, fadeBottom: 0.03, tint: '#FFFFFF' },
    tower: 10, towerWide: 15, towerTall: 24,                     // the cloud tower as the page asks for it: bearing, width, height in degrees
    ceiling: 0.85, ceilingScale: 0.3, ceilingDrift: 0.4,         // the drifting layer (image 6): strength, size, degrees a second overhead
  },

  // ---- the water (section 7): tea-coloured and still; it holds the sky, lets the eye in, and is written on
  water: {
    deep: '#2E1D10', shallow: '#8E6026',                         // (the page's shallow is #9A5E1E: over the sand it came out red-orange)
    reflectivity: 0.95, fresnel: 2.6, reflectFloor: 0.14, roughness: 0.05,          // (stage 2: the page's 0.9 and 0.07; a step more of a mirror, a step stiller: the bridge must be DOUBLED in it)
    // (third holder: fresnel 2.6 and reflectFloor 0.14; the page's 3.4, and the engine's floor of 0.02. THE WATER HAD NO
    // SURFACE WHERE THE EYE LOOKS DOWN INTO IT: at 36 degrees down (postcard 3) it mirrored 7 per cent, and from the jetty
    // (postcard D) the bed 'read as dry sand' (the Mooring's words). Now the water a boat's length off gives back the
    // staithe's pole, the jetty's posts and the sky as well as showing its bed: looking straight down it is still four
    // fifths window (the sand, the punt, the ford and the fish are seen), and from the mooring the near water holds the
    // cloud: .shots/landing_postcards_l3_b1.jpg (3 and D, three steps), .shots/landing_postcards_l3_b2.jpg)
    waveHeight: 0.10, waveScale: 1.3, waveSpeed: 0.5, wind: [-0.77, 0.64],
    streak: 1.4, sparkle: 0.10, sparkleColor: '#FFE9B0',
    // (the page: reflectionTint #FFF1D6 and the water's own 15 per cent darker, 10 per cent richer. A small step
    // darker and warmer than that: sampled against the key painting, the far and middle water then have its value
    // (0.67 to 0.69) and its hue (29 to 31 degrees), and the lamp's stroke has a ground: 1-layout.md)
    // (stage 2, Light: the mirror gives the sky back. As laid out (tint #FFEACC, darker by 0.22) the water held the key
    // painting's DARKS (the bridge's and the reeds' reflections) but not its LIGHTS: the sky's gold in the middle water
    // was 0.27 where the painting has 0.39, and the whole water lay between 0.06 and 0.27, a brown board. Now the
    // reflection is 5 per cent darker and 20 per cent richer than the world: the gold stands in the water at 0.35, the
    // reeds' mirror stays at 0.07, and the range is the painting's. 2-light.md)
    // (opacity 0.64, the page's 0.8: a hand of water over the sand must show the sand: at 0.4 m three fifths of it
    // comes through, at 0.9 m a third, at 1.3 m a quarter, and the pool's bed at 1.1 m is a dark shape and no more)
    opacity: 0.64, mirror: 0.5, rain: 0, wake: 1.0, foam: 0.06, reflectionTint: '#FFF2DC', mirrorDarken: 0.05, mirrorSaturate: 0.2,
    // (not on the page's list; its words: a ring must travel 25 m and take about 7 seconds to heal; clear to 0.9 m,
    // tea brown below; soft edges at every pile and stem)
    rippleSize: 64, rippleLife: 7, rippleSpeed: 1.2,
    absorb: '#A8743A', absorbDepth: 0.9, seeDistance: 16, edge: 0.07,
    sun: { dir: [0.627, 0.08, -0.776], color: '#FFE2A0', strength: 0, spread: 1.1, glitter: 0.3 },   // set.js brings it up to 0.5 over the last 26 m
    // (stage 2, Light, second holder: three things the water learnt on the evening of 7 November, docs/water.md "What
    // the areas asked for". Where the eye looks INTO this water (beside the staithe, round the jetty, over the fen's
    // lip) nothing said where its surface was: sand under glass, piles going down into amber air.
    //   rest       the moored boat breathes on the water: a fine ring from the bow and the stern in turn
    //   sheen      sky-light on the far face of every ring (rings), so a ring crossing clear water over sand is seen;
    //              `still` (patches of fine crests on water at rest) is all but off: in this light they are pale scum
    //   waterline  the meniscus: a hair of sky where the water meets a pile, a stem, the hull
    // All three were tried three times as strong first (.shots/landing_l2_w3_b.png, _wD_b.png): white tape round every
    // pile, milk-white arcs, floes of foam. In a bright picture a third is enough.)
    //   column     the long columns under lights, which `mirror` had stilled away with the waves: the kept lamp's stroke
    //              is one line from the jetty to the bow again (the page: "one stroke, 16 m long"), the sun's a column
    //              of fire in the reeds' dark mirror. (At 2.5 the sun's column is a white stripe down to the pads.)
    // (third holder: still 0.2, it was 0.06 ('pale scum'): with the stronger mirror the fine crests lie on the reeds' and
    // the tuft's DARK reflections as strokes of sky, which is what says still water in a painting; on the bright mirror
    // they do not show at all. waterline gain 0.06, it was 0.2: at 0.2 the meniscus was chalk round every pile at arm's
    // length (the Mooring's finding) and a row of white stitches along four thousand reed stems (the Reeds')
    rest: 0.4, column: 1.6,
    sheen: { color: '#E9C987', rings: 0.14, still: 0.2, hide: 0.2, lamps: 0.3 },
    waterline: { color: '#FFDFA0', width: 0.008, gain: 0.06, reach: 25 },
  },
  // (third holder: at the door the water is a darker, richer mirror than the world, and stiller than the page's
  // (mirror 0.45 and sparkle 0.12, the page 0.25 and 0.3; mirrorDarken 0.42, mirrorSaturate 0.45, a honey tint). What the
  // water shows there is the lit foot of the cloth, the brightest thing in the picture: mirrored true it was a blank
  // beige floor from the hems to the bow (postcard I). Deeper and stiller, every bolt stands in it down to the bow, in
  // honey: .shots/landing_postcards_l3_c5.jpg)
  waterEnd: { deep: '#3A2612', shallow: '#B8792A', sparkle: 0.12, mirror: 0.45, mirrorDarken: 0.42, mirrorSaturate: 0.45, reflectionTint: '#FFE6BC' },
  sunPath: { from: 55, to: 81, strength: 1.2 },                 // (stage 2: the page's 0.5 could not be seen at all under the cloth; the water's own page calls 2 to 3 a molten track)
  // the gold mist lying on the water (the page: start state): a few great soft cards over the mere and the fen (set.js)
  // (opacity 0.075, as first laid out, was the area's milk: sixteen pale cards over the mere took the bridge, the fen and
  // every dark with them, and postcard 5 was grey. Off: the height fog of look.light is the gold mist. 1-layout.md)
  mist: { count: 16, from: 26, to: 80, spread: 46, y: [0.3, 1.4], size: 30, color: '#F4DDA6', opacity: 0, drift: 0.12, seed: 8 },

  // ---- sound (section 8). The layers that move with the route are staging's (stage.js): the wind's level goes with the
  // reed wave at the boat's place (level - 0.1 in a trough to level + 0.1 on a crest) and falls to 0.1, with `night`,
  // for the hush of the crossing; the music is silent until a second after the lantern catches, comes in as written
  // here, and opens from s 34 to s 54 (gain 0.72, no low-pass, full width); `shimmer` rises to 0.35 with the hatch;
  // `birds` stops with the vesper flight. Measured (docs/build/landing/4-staging.md): the bed alone, the boat drifting,
  // -32.2 dBFS RMS (a trough -34.2, a crest -30.2, the hush -36.8); the whole mix at the hatch -22.0, peaks -6.3, nothing clipped.
  // (wind: the page has 0.4, which measured -33.2: two decibels under the quietest bed the sound guide calls typical)
  audio: {
    music: { gain: 0.5, lowpass: 520, reverb: 0.3, width: 0.5 },     // heard from beyond the reeds, where the boat is going
    space: { size: 'open', mix: 0.25 },
    ambience: { water: 0.45, wind: { level: 0.45, tone: 0.6 }, night: 0.3, birds: { level: 0.3, rate: 0.08 }, shimmer: 0.15 },
  },

  // ============================================================================================ set pieces
  // ---- the monument: the long bridge (section 3). At s 39, at right angles to the path, d -42.5 to +42.5.
  bridge: {
    s: 39, from: -42.5, to: 42.5, width: 1.5,
    towers: [9.25, 15.9, 22.55, 29.2, 35.85, 42.5],             // and their mirrors: twelve
    foot: [1.3, 1.2],                                            // a tower's footprint: along the bridge, across it
    pile: [0.26, 0.34], lean: [4, 7], waling: 0.9, depth: 1.5,   // pile thickness, inward lean in degrees, the waling's height, piles below water
    deck: 3.4, hump: 0.5, humpHalf: 17,
    /** The top of the deck at d: 3.4 m, rising in a slow hump to 3.9 m over the centre. */
    deckTop(d) { return this.deck + (Math.abs(d) < this.humpHalf ? this.hump * Math.cos(Math.PI * d / (2 * this.humpHalf)) ** 2 : 0); },
    baulk: [0.26, 0.32], board: 0.05, soffitCentre: 3.45,
    span: { strutFoot: 1.0, strutReach: 4.6, clear: 3.1, clearHalf: 4 },      // the central span: raking struts, and nothing below 3.1 m within |d| < 4
    rail: { side: -1, post: 2.2, height: 1.05, kerb: 0.12 },     // upstream side only (side -1 = the side the mooring sees)
    traps: [-31, -27.5, -20, -13.5, -12.9, 10.6, 11.4, 12.8, 13.5], cord: [0.5, 0.9],
    bundlesAt: -24, coilAt: 5, missingBoard: 2.2,
    left: { bank: -44, bankHeight: 0.8, steps: 4 },              // four plank steps down to the turf bank
    rightInReeds: 14,                                            // from d +14 only its rail and posts show among the plumes
  },

  // ---- the other hero pieces
  staithe: { s: [8.0, 19.6], d: [-8.95, -9.95], deck: 0.55, pairs: 7, M1: [16.9, -9.0], M2: [19.2, -9.0], post: 0.22, postTop: 1.5, step: 14 },
  rick: { s: [3, 9], d: [-10.6, -13.0], height: 2.6 },           // 6 by 2.4 by 2.6 m, butt ends to the water
  gangway: { line: [[19.6, -9.45], [24, -10.6], [28.4, -13.4]], width: 0.45, deck: 0.6, trestles: 7, handLine: 0.9 },
  jetty: { s: 29.0, d: [-15.0, -9.0], width: 1.3, deck: 0.6, bents: 4, headPosts: 0.9 },
  // the kept lamp. `at` is the page's place and is where the FLAME hangs; the post stands 0.71 m further in along the
  // jetty's down-route flank with its arm out toward the channel (see 1-layout.md: with the arm down the path, as the
  // engine sets it by default, the post hides its own lantern from the mooring)
  // night: the engine's remodelled lamp shows a lit lantern BY DAY as clear glass with a flame in it and no halo, which
  // is true to life and, seven metres off on a gold evening, a cold grey lantern: the ride's one motif unlit as the
  // rider passes it and hears its note. Here it glows as in the dark (its amber globe and its own small halo), which
  // is the page's "its amber is redder than the day" (.shots/landing_postcards_c_lamp.jpg)
  lamp: { at: [29.8, -9.2], post: [29.8, -9.91], note: 57, near: 8, reach: 9, moths: 3, intensity: 1.3, night: true,
    // the lamp in daylight (set.js): [size in metres, intensity] of a halo and a core for the direct view and of a halo
    // for the water's mirror alone; whole when the boat is further off than fade[1] metres, gone within fade[0]
    // (each may carry its own colour as a third entry: the halo is a step redder than the lamp's own amber, so that on
    // the dark tuft it is plainly not the day's pale yellow: the page's "its amber is redder than the day")
    daylight: { halo: [2.3, 1.35, '#FF8E30'], core: [0.5, 3.5, '#FFD08A'], stroke: [1.5, 8, '#FF7A1C'], fade: [6, 13] } },
  punt: { at: [22.5, -6.0], size: [5.2, 1.1], turn: 20, gunwale: -0.3 },
  // (backlight: the engine's cloth takes the page's 0.9 to 2.0 before the final pass, a searchlight in the bridge's span.
  // At 0.75, as first laid out, it was still paper white from end to end, with no room left for the sun behind it; at
  // 0.2 it is honey linen, the sun's bloom (sunGlow) is the bright thing on it, and from the mooring the part of it
  // that stands above the bridge's deck is the sky's own tone and leaves the bridge its line: 1-layout.md)
  // shade: the shade of the nine cloths (light.js's shade map). The sun's azimuth is the straight's own heading: seen
  // from the staithe, the jetty, the lamp tuft, the middle 22 m of the bridge and the whole straight, the sun stands
  // BEHIND THE CLOTH, not behind the reeds. As first laid out the cloth was opaque to its line: its shade lay more than
  // 4 m deep over all of that, which gives the mooring its tea-brown side and the lamp its dark, but leaves the bridge
  // a brown silhouette where the page wants it "front-lit straw gold, its rail a line of light" when the rider looks
  // back (postcard 7). Linen with the sun behind it is a great lit sheet: what stands near it is lit by it, and only
  // what stands far behind it is in its shade. So: nearer than `from` metres behind the cloth nothing is shaded by it;
  // further than `to` metres everything is, up to (height - distance x the sun's slope). The bridge (35 to 44 m
  // behind it) is in the sun; the lamp tuft (47 m), the jetty (49 m) and the staithe (56 to 61 m) are in the shade.
  gate: { s: 75, mast: 11.3, mastHeight: 11.5, mastThick: 0.36, line: 9.2, sag: 0.35, cloths: 9, cloth: [2.4, 9], backlight: 0.2, shade: { height: 8.9, from: 43, to: 48 } },
  // four more pairs of masts 14 to 18 m tall with pale cloth, in the haze beyond the door (s 87 to 123): [s, half spacing, height]
  beyond: [[87, 11.8, 14], [99, 12.6, 15.5], [111, 13.4, 17], [123, 14.2, 18]],
  // the heron (the page: (50, -12.2), which bears 4.3 degrees from the mooring). The prow's crook now carries its lantern
  // below the horizon, and the top of its arc lies along the far waterline from bearing 2.5 to 6.5 degrees, exactly
  // across a bird that stands there; the lantern hangs at 7.1. So the heron stands 6 m further down the same edge, where
  // it bears 9.0: just right of the crook's shoulder, inside the bridge's central span, 47 m off, in the same 0.2 m of
  // water, 31 m from the boat when it lifts at s 26 (1-layout.md)
  heron: { at: [55.9, -11.3], height: 0.95 },

  // ---- the close band (kit pieces and multitudes)
  // the lamp tuft: the dark thing the lamp is seen against. The page has it 2.4 to 2.8 m tall; from the mooring the line
  // of sight through the lantern crosses it at 2.45 m, level with its tips, so it is grown 3.0 to 3.4 m (1-layout.md)
  // tone: how dark its paint is (a multiplier on its olive: it must be the darkest thing in the open water); rim: none
  // leaf: its two leaf colours (greener than the reedmace of the stands: the warm shade and the final pass turn a plain
  // olive brown, and a brown tuft under an amber lamp is one colour)
  tuft: { at: [32.6, -10.4], across: 3.8, along: 2.2, height: [3.0, 3.4], clumps: 20, tone: [0.5, 0.66], rim: 0, leaf: ['#6A8236', '#2E4218'] },
  withies: { s: [21, 25, 34, 43, 47, 52, 56], out: 0.3, height: [2.6, 3.4], total: 20 },
  pads: {
    A: { s: [19, 36], d: [1.5, null], count: 190 },              // to the reed edge
    B: { s: [20, 28], d: [-7.4, -3.5], count: 40 },              // the turned lane crosses it; a metre of clear water between it and the gangway for the lamp's stroke
    C: { s: [1, 8], d: [-8, -2], count: 30 },
    size: [0.28, 0.46], buds: 14, flowers: 4,
  },
  // (the page's left stands are at s -1, 37 and 45. From postcard 5, "the whole bridge" (s 33, d +1, looking left), a
  // stand on the left edge anywhere from s 34.5 to 37.5 covers the bridge's second to sixth left towers, the very
  // towers that picture is of: "tower after tower growing smaller, every one doubled in the water". The stand of s 37
  // is grown at s 33.2 instead, behind the lamp tuft as the channel sees it, where it also thickens the dark the lamp
  // is seen against and slides aside with the tuft at s 31. 1-layout.md)
  reedmace: { right: [8, 17, 27, 35, 46, 53], left: [-1, 33.2, 45], clumps: [12, 24], total: 186, height: [2.2, 2.8] },
  iris: { count: 22, s: [4, 52], height: [0.9, 1.1] },
  sedge: { count: 90, height: 0.7 },
  ford: { s: 39, d: [-8, 8], count: 44, depth: 0.55, size: [0.3, 0.6] },
  pilings: { s: [57, 75], d: 10.3, count: 13, step: 1.5, height: [1.2, 6.5], thick: 0.3 },
  farRicks: { at: [[58, -46], [67, -60], [48, -78]], size: [4, 1.5, 1.6] },                  // low_rick: 4 long, 1.5 high, 1.6 wide; flat-topped, never cones
  traps: { size: [1.4, 0.4], onStaithe: 5, onJetty: 2 },         // and nine on the bridge: 16
  bundles: { size: [2.0, 0.34], onStaithe: 8, onBridge: 4, onJetty: 2, total: 34 },

  // ---- reeds (section 3, "Reeds, for the builder")
  reeds: {
    stems: 2400, stemBand: 1.6, stemsPerM2: 14, stemTris: 46,
    tufts: 9000, tuftBand: 40, tuftsPerM2: [2.2, 0.6], tuftTris: 22,
    leftFrom: -10.2, leftTo: 17,                                 // the left bank is reed only as far as s 17, from d -10.2 outward
    head: -1.0,                                                  // round the head of the backwater
    height: { left: [3.6, 4.5], right: [3.9, 4.4], tallest: [4.5, 4.8], tallestS: [44, 54] },
    rightEnd: 57,                                                // the reeds give way to the palisade
    farFrom: 41, farTris: 9000,                                  // behind the tufts, the far mass (110 to 170 m on the page's planes)
  },
  // ---- the cut fen: stubble shallows left of the channel from s 17, out to d -115
  // heronPool: metres of open water round the heron's stand (the page's "heron's shallows"). lead: an open lead of
  // shining water running away from the bird, as seen from the mooring ([half its width in degrees, metres it begins in
  // front of the bird]): from an eye 1.1 m above the water everything that stands on the fen for a hundred metres
  // behind the heron lies in the same half degree as its body, so a heron among stubble is a heron nobody sees
  // (inLead, below; 1-layout.md)
  fen: { from: 17, to: -115, floor: -0.14, stubble: 3600, stubbleHeight: 0.3, heronPool: 3.0, lead: [3.2, 3] },
  // depths (section 3): 0.35 m under the staithe and along the left edge, 0.9 to 1.3 m in the backwater and the mere,
  // 0.55 m over the ford, 1.8 m beyond it
  depth: { edge: 0.35, pool: 1.1, ford: 0.55, beyond: 1.8 },

  // ---- far planes (section 3, the vista): painted backdrops beyond 190 m
  far: {
    willows: { from: 190, to: 240, bearings: [-70, 20] },
    hills: { from: 300, to: 450 }, dyeWorks: { bearings: [45, 80] },
    // image 3 (source-art/landing/far.png: three strips, each the full width): the strips on curved rails about the
    // mere. uv: the part of the picture (v = 0 at its foot); r: metres; bearings: degrees right of the start heading;
    // copies: how many times the strip is laid side by side (every second one mirrored); high: its height in metres
    strips: [
      // (tint: as painted the strips are the sky's own value and cannot be seen against it; each is taken a clear step
      // darker and a little cooler, the nearer the darker)
      { name: 'hills', uv: [0.004, 0.690, 0.996, 0.850], about: [39, 0], r: 400, bearings: [-124, 100], copies: 3, high: 28, y: -1.2, fog: 0.4, flip: true, tint: '#B4B498' },
      { name: 'willows', uv: [0.004, 0.384, 0.996, 0.560], about: [39, 0], r: 215, bearings: [-92, 27], copies: 2, high: 12, y: -0.7, fog: 0.5, flip: true, tint: '#7E8468' },
      // (stage 2, Light: the dye works stood at bearings +45 to +80, as the page has it: behind the right bank's reeds
      // from every place on the water, a picture nobody saw. It stands left of the door now, over the open fen: from the
      // mere on, the far frames and one chimney of where the river is going; from the mooring the lamp tuft and the
      // staithe's gear still hide it, so the title view is as it was. .shots/landing_l2_farG.png, _farH.png)
      { name: 'dye works', uv: [0.2, 0.052, 0.5, 0.217], about: [39, 0], r: 340, bearings: [-34, -6], copies: 1, high: 30, y: -1.2, fog: 0.4, tint: '#8E9078' },
    ],
  },

  // ---- the passage out: the door. The veil is the reach's cream; our wash joins it over the last 6 m.
  door: { s: 75, wash: '#f6e2b8', over: 6 },

  // ---- painted art as the ride loads it (assets/art/landing/): null until a picture is generated and packed
  art: { sky: 'art/landing/sky.webp', far: 'art/landing/far.webp', ceiling: 'art/landing/ceiling.webp',
    timber: 'art/landing/timber.webp', reed: 'art/landing/reed.webp', wicker: 'art/landing/wicker.webp' },      // the three tiles of light.js's paints (stage 2, Light)

  // ============================================================================================ STAGE 2, LIGHT
  // (docs/build/landing/2-light.md. The numbers of the paints, the ground, the air and the water that light.js and
  // set.js read. Added under this heading; the look, the sky and the water above are tuned in place, with a note.)
  // ---- the three tiles (page images 4 and 5; source-art/landing/cut_tiles.py). Each is NEUTRAL: its mean is 0.5 in
  // linear light in every channel, and a paint lays it over a thing's own colour as albedo *= tile / 0.5, so it
  // neither darkens nor tints what wears it (the standing sky tints the same timber salt-grey).
  //   across, along: metres to one repeat across the grain and along it (timber: five painted boards to 1.1 m, so a
  //   pile's facet or a deck board shows about one board's figure; at 1.4 m a waling seen from a metre off was bare)
  //   grain: 0..1, how strongly the tile shows; through (wicker): the light that comes through the weave against the sun
  tiles: {
    timber: { across: 1.1, along: 1.6, grain: 1.0 },
    reed: { across: 0.27, along: 0.9, grain: 1.0 },
    wicker: { across: 0.30, along: 0.80, grain: 1.0, through: 0.5 },
    farReed: { across: 5.5, along: 9, grain: 0.5 },             // the reed tile on the far reed mass (L.plant with rooted: 'world'): broad upright strokes
  },
  // ---- where timber meets the water (light.js, by world height; no model paints it). wet: the band's top, between
  // these two heights, ragged round every pile; tint: what wet does to silver-grey oak, as multipliers of its paint
  // in linear light (darker by a third, and warmer: tea brown, the page's "wet timber"); slime: the same for the
  // green-black of the lowest hand above the water and of all that is under it, to `slimeTo` metres; line: the
  // strength of the pale dry line above the band (dried silt, broken here and there)
  waterline: { wet: [0.36, 0.52], tint: [0.70, 0.60, 0.48], slime: [0.60, 0.74, 0.48], slimeTo: 0.16, line: 1.3 },
  // ---- what is laid on the ground (set.js: painted in the shader over PLAN.ground's kinds). straw: the cut reed and
  // litter lying on peat, fen and hard; root: the pale reed roots at the washed peat edge; ripple: the depth of the
  // sand's ripple marks (0..1); litter: how much litter (0..1); play: the light of the water on the bed in shallow
  // water, playShade: its share where the sun does not reach; playColor
  // (second holder) sky, skyColor: the western sky's own light on a shallow bed that the sun does not reach (as a
  // share of the bed's paint: the sand beside the staithe is lit by the sky, not by the shade's ambient); deck: how
  // much of that light, and of the bed's whole light, a deck standing over the water keeps off (the staithe, the jetty)
  groundPaint: { straw: '#C2A050', root: '#D9C79A', ripple: 0.3, litter: 1, play: 2.0, playShade: 0.8, playColor: '#FFD890', sky: 0.5, skyColor: '#FFD9A0', deck: 0.75 },      // (playShade 0.8, third holder: it was 0.3, and no net of light could be seen on the sand at all; the whole backwater is in shade)
  // ---- the grass on the turf (set.js): tufts to the square metre on the banks of the last straight (near), and on
  // the far turf bank at the bridge's left end and the hard (far: larger tufts); height: a tuft's, in metres
  turfGrass: { near: 15, far: 1.4, height: 0.36 },
  // ---- the mist and the plants (light.js, L.plant): plants nearer than to[0] metres are spared `spare` of the height
  // fog (look.light.heightFog), plants further than to[1] metres none of it
  plantMist: { spare: 0.75, to: [35, 80] },
  // ---- the light through the door's cloth (set.js, "the light through the door's cloth"; it takes the place of
  // sunGlow.cloth, clothHeart, clothRadius, clothCore and clothRim above, which are no longer read). How bright a place
  // on the cloth is, by the angle between the eye's ray to it and the way to the sun:
  //   behind x (shade + skirt + heart) + cream glare
  // shade: what the cloth keeps of itself far from the sun's line (its own shaded side: the tops, the far bolts);
  // skirt, heart: [gain, degrees] of the broad honey glow and of the burning middle; cream: [gain, degrees, colour] of
  // the light that is ADDED there (the glare: it is what turns the heart from yellow to cream); haze: [gain, degrees] of
  // the same cream added thinly and widely (the lit air before the cloth: it lifts the linen from mustard toward
  // cream without flattening its folds); off: metres this side of the cloth's line that the sheet hangs
  // shadeTint, skirtTint, heartTint: what each does to the linen's colour, as multipliers of red, green and blue
  // (the shade is warmer than the linen: tea, not khaki; the heart gives back the blue the gold light took: cream)
  // (third holder: the light is now IN the cloth's own paint (set.js, "THE SAME LIGHT, IN THE CLOTH ITSELF"), so its glare
  // no longer lies over the bow, the lantern and the gaps of sky, and the heart can be what it should: heart 1.15 over 7
  // degrees, cream 0.14, skirt 1.4. They were 0.45 over 6, 0.05 and 1.3, held down because the sheets' glare bloomed
  // over the boat: .shots/landing_postcards_l3_c1.jpg (in the cloth, above; on the sheets, below), _l3_c2.jpg)
  doorLight: { shade: 0.42, shadeTint: [1, 0.9, 0.74], skirt: [1.4, 22], skirtTint: [1, 0.97, 0.9], heart: [1.15, 7], heartTint: [1, 1.1, 1.45],
    cream: [0.14, 7, '#FFF0D0'], haze: [0.06, 26], off: 0.5,
    // (heart 0.8 to 1.2 with cream 0.1 to 0.5, as first tried: a ball of white fog three bolts wide in which the folds
    // were lost, and its bloom lay like milk over the bow and the prow lantern: .shots/landing_l2_p8_j.png, _door_j.png)
    // near: the linen's own glow (the engine's `backlight`, gate.backlight from afar) rises to this as the boat comes
    // from s `from` to s `to`: at arm's length the cloth is a wall of light, lighter than the veil it hangs in. (At
    // 0.2 to the end, nine khaki cloths hung in a white haze: washing, not light.)
    near: { backlight: 0.7, from: 61, to: 72 } },

  // ============================================================================================ STAGE 2, REEDS
  // (docs/build/landing/2-kit-reeds.md: the reeds regrown, the fen's stubble, the sedge, the hornwort, the ford and the
  // gossamer, and the dressing of the door's cloth. kit.js reads these. Nothing above is changed: where the reeds stand,
  // how tall, and how many are still `reeds`, `reedBed` and `reedHeight`.)
  grown: {
    shoots: 700,                   // clusters of this year's olive shoots at the clumps' feet (three spears of 0.9 to 1.6 m each), beside the page's 2,400 stems
    plumeGlow: 0.8, tuftGlow: 0.5, // the light that comes through a stem's plume and through the tassels of the mass behind (kit.js, softLight: at 0.4 a plume against the sun is the sky's own value; the page's backlight 0.9 on the whole reed was white specks)
    sedgeTall: 0.24,               // the height at which a tussock's paint is whole (the plant paint darkens a plant's foot: at the tussock's own 0.8 its straw skirt was a dark pot)
  },

  // ============================================================================================ STAGE 2, PLANTS
  // (docs/build/landing/2-kit-plants.md: reedmace and the lamp tuft, yellow flag, the water lilies. kit_plants.js reads
  // these over its own defaults, where the colours and the paint's numbers are. Nothing above is changed: the stands'
  // places and counts are still `reedmace`, the tuft is still `tuft`, the rafts are still `pads`, the iris `iris`.)
  plants: {
    reedmace: {
      // a stand is an oval of clumps (half lengths, metres). On the right bank its middle lies `out` inside the channel's
      // edge, so that it stands in the reeds' foot and a metre out into the water, and the boat is kept off it by three
      // circles (collide: [metres along the stand], how far inside the edge, radius). On the left it stands `leftOut`
      // OUTSIDE the edge, as the layout put it: the stand of s 45 must leave the heron's sight line open.
      along: 2.3, across: 0.85, out: 0.15, leftOut: 0.85, apart: 0.46,
      collide: { at: [-1.5, 0, 1.5], inside: 0.25, r: 0.85 },
    },
    iris: {
      margin: 17, e: [-0.62, -0.32],                            // along the right bank: how many, how far outside the channel's edge: in the shallow water before the reeds' front rank, which stands at -0.3 (the hull's side reaches -0.2: they lean from it)
      // the page's others ([s, d]): both ends of the staithe, the jetty's root, and the layout's two at the head. (The
      // layout's (20.0, -9.7) was under the gangway's plank and its (29.3, -15.3) in the middle of the jetty's end.)
      at: [[7.6, -9.5], [20.45, -10.45], [29.98, -15.3], [0.4, -8.9], [1.6, -9.1]],
    },
    lily: {
      // raft C is the page's (`pads.C`) and runs on down the water to the rider's right hand at the mooring (the
      // director's note): twenty-two of its thirty pads lie there, in three groups; eight stay at the page's place.
      // A group: its bounds (s, d), its plants (crowns: [s, d]), and either pads: n (strewn round the crowns) or
      // set: [[s, d, size, variant], ...] (leaves put down one by one).
      //   abeam   one plant under the rider's right hand (seen over the side, yaw -80)
      //   foot    THE FOOT OF THE TITLE VIEW, composed leaf by leaf against the key painting: two knots of leaves off
      //           the bow (near the gunwale, and further right), touching and nearly touching, large and small, young
      //           and old, and a looser trail leading up the picture toward raft A. (The places were worked out from
      //           the picture: the eye at s 13.55, d -7.0, 1.12 m up, looking 17 degrees right and 4 up. Whoever moves
      //           the title view must lay these out again.)
      //   buds    three of the raft's four, standing where the key painting has them: by the bow, between the two
      //           knots, beyond the right-hand one ([s, d, size])
      tailC: {
        reach: [0.3, 1.15],
        groups: [
          { s: [11.6, 15.0], d: [-5.9, -2.8], pads: 6, crowns: [[13.3, -4.6]] },
          { s: [15.2, 19.6], d: [-6.0, -2.0], crowns: [[16.15, -5.3], [15.95, -3.95], [17.7, -3.4]],
            set: [[16.27, -5.64, 0.44, 'a'], [16.04, -5.31, 0.38, 'c'], [16.55, -5.23, 0.30, 'b'], [15.68, -5.67, 0.42, 'a'],
              [16.29, -4.18, 0.46, 'a'], [15.83, -4.19, 0.36, 'b'], [15.75, -4.98, 0.40, 'c'], [15.97, -3.43, 0.33, 'a'], [15.41, -4.00, 0.44, 'c'], [15.67, -3.24, 0.30, 'b'],
              [17.57, -3.89, 0.42, 'a'], [17.92, -2.66, 0.36, 'c'], [19.00, -3.34, 0.40, 'a'], [16.95, -4.07, 0.31, 'b'], [16.85, -3.26, 0.38, 'a'], [17.12, -2.24, 0.34, 'c']] },
        ],
        buds: [[16.95, -5.5, 1.2], [16.30, -4.74, 1.32], [16.37, -3.12, 1.12]],
      },
      crown: 9, reach: [0.32, 1.5],                             // pads to a plant, about; metres a leaf lies from its plant's crown
      stroke: 0.7,                                              // clear water kept either side of the line from the mooring's eye to the kept lamp (its stroke)
      buds: { A: 7, B: 3, C: 4 }, flowers: { A: 2, B: 1, C: 1 },   // the page's 14 and 4
      lane: 18,                                                 // the pads of raft B along the line from M2 toward the bridge's wide span (shared.kit.pads.lane)
    },
    // what stands near the hull leans away from it: clear room beyond the hull's half width at the waterline (the
    // toolkit's 0.42 m; the gunwale is 0.35 m wider), how far out the leaning is felt, the shiver a wake gives (metres)
    hull: { room: 0.42, reach: 0.9, shiver: 0.014 },
  },

  // ============================================================================================ the ground
  /**
   * Height of the bed and the land at a place, and what it is made of: { y, kind } with kind one of 'bed', 'sand',
   * 'fen', 'turf', 'peat', 'hard'. path: the realm's Waterway.
   */
  ground(path, x, z, out = {}) {
    const q = path.locate(x, z, null, _f), hw = q.halfWidth, D = this.depth;
    let s = q.s, d = q.d;
    const left = d < 0, e = Math.abs(d) - hw;                    // metres outside the channel's edge (negative: inside)
    // ---- the bed of the channel: shallow along the edges, a pool in the backwater and the mere, the ford, deep beyond
    const ford = Math.exp(-(((s - this.ford.s) / 3.2) ** 2)) * sm(11, 7.5, Math.abs(d));
    let deep = lerp(D.pool, D.beyond, sm(42, 50, s));
    deep = lerp(deep, D.ford, ford);
    let y = -lerp(left ? D.edge : 0.3, deep, sm(0, left ? 5.5 : 3.5, -e)), kind = 'bed';
    if (-y < 0.6 && e < 0) kind = 'sand';
    if (e >= 0) {
      const fen = left ? sm(this.fen.from - 2.5, this.fen.from + 2.5, s) : 0;      // 0 = reed bed, 1 = the cut fen
      const piled = sm(55.5, 58, s);                                                // the revetted banks of the last straight
      // the reed bed: just awash at the edge, firm peat behind
      const peat = lerp(-0.3, 0.16, sm(0, 3, e)) + 0.18 * sm(3, 30, e);
      // the fen: 14 cm of water over the stubble; it ends at the uncut reed, 115 m out
      const far = sm(-this.fen.to - 4, -this.fen.to + 3, -d);
      let fy = lerp(-D.edge, this.fen.floor, sm(0, 2.2, e));
      fy = lerp(fy, 0.3, far);
      // the bank behind the revetment: 0.45 m, three metres wide
      const bank = 0.45 * sm(0.2, 0.5, e) * sm(left ? 5.5 : 9, left ? 3 : 4, e);
      y = lerp(peat, fy, fen);
      kind = fen > 0.5 ? (far > 0.5 ? 'peat' : 'fen') : 'peat';
      if (piled > 0 && bank > 0.005) { const by = Math.max(y, bank); if (bank * piled > 0.12 && by > y) kind = 'turf'; y = lerp(y, by, piled); }
      if (fen > 0.5) {
        // the turf bank: 0.8 m high, running away across the fen from the bridge's left end
        const B = this.bridge, bankD = sm(-B.left.bank - 1.2, -B.left.bank + 0.6, -d), across = Math.abs(s - B.s);
        const turfBank = B.left.bankHeight * sm(4.2, 1.5, across) * bankD;
        // the hard: firm turf just above the water, under the three low ricks
        let hard = 0;
        for (const [rs, rd] of this.farRicks.at) { const dist = Math.hypot((s - rs), (d - rd)); hard = Math.max(hard, sm(9, 5, dist)); }
        if (hard > 0.01) { const hy = fy + (0.3 - fy) * hard; if (hy > y) { y = hy; if (hy > 0) kind = 'hard'; } }
        if (turfBank > 0.005 && turfBank > y) { y = turfBank; if (turfBank > 0) kind = 'turf'; }
      }
    }
    // ---- the head of the backwater closes behind the mooring
    if (s < 0) { const k = sm(0.5, 3.5, -s); const hy = lerp(-0.3, 0.2, sm(0.5, 4, -s)); if (hy > y) { y = lerp(y, hy, k); if (k > 0.5) kind = 'peat'; } }
    out.y = y; out.kind = kind; out.s = s; out.d = d; out.hw = hw;
    return out;
  },

  // ---- where reeds stand (kit.js grows them here; light.js takes their shade from here)
  /**
   * How far into the reed bed a place is from open water: { e (metres), side: 'right' | 'left' | 'head', s }, or null
   * where no reed stands (the channel, the fen, the front of the rick, the lane under the bridge).
   */
  reedBed(path, x, z, out = {}) {
    const q = path.locate(x, z, null, _f), s = q.s, d = q.d, h = q.halfWidth, R = this.reeds;
    if (s > 2.3 && s < 9.7 && d < -9 && d > -13.4) return null;           // nothing grows in front of the rick
    const b = frame(path, this.bridge.s, _g), bo = (x - b.x) * b.tx + (z - b.z) * b.tz, bd = (x - b.x) * b.rx + (z - b.z) * b.rz;
    if (Math.abs(bo) < 1.35 && bd > 0 && bd < 47) return null;            // nor under the bridge, where it walks into the reeds
    out.s = s; out.d = d;
    if (s < R.head) { out.e = Math.hypot(Math.max(0, Math.abs(d) - (d < 0 ? 9.3 : h)), R.head - s); out.side = 'head'; return out; }
    if (d >= 0) { out.e = d - this.reedEdgeRight(s, h); out.side = 'right'; return out; }
    if (s < R.leftTo) { out.e = Math.min(-d - this.reedEdgeLeft(s), R.leftTo - s); out.side = 'left'; return out; }
    return null;
  },
  reedEdgeRight(s, halfWidth) { return halfWidth + 3.4 * sm(55.5, 58, s); },      // from s 57 the reeds stand behind the revetted bank
  reedEdgeLeft(s) { return lerp(9.3, -this.reeds.leftFrom, sm(-1, 2, s)); },
  /** The height of the reeds at a place in the bed (k: 0..1 picks within the range): left 3.6 to 4.5, right 3.9 to 4.4, the tallest 4.5 to 4.8 at s 44 to 54. */
  reedHeight(bed, k = 0.5) {
    const H = this.reeds.height, base = bed.side === 'right' ? H.right : H.left;
    const tall = bed.side === 'right' ? sm(H.tallestS[0] - 3, H.tallestS[0] + 1, bed.s) * sm(H.tallestS[1] + 3, H.tallestS[1] - 1, bed.s) : 0;
    return lerp(lerp(base[0], H.tallest[0], tall), lerp(base[1], H.tallest[1], tall), k);
  },
  /**
   * How high the thing that stands at a place reaches, for the shade it throws (light.js): the reed bed and the far
   * reed mass, the rick. 0 over open water and the fen. (The cloth of the door has a rule of its own: clothAt, gate.shade.)
   */
  occluder(path, x, z) {
    if (!this.inner(path, x, z)) return 4.2;                                               // the far mass
    const bed = this.reedBed(path, x, z, _h);
    if (bed && bed.e > -0.2) return this.reedHeight(bed, 0.5) * sm(-0.2, 1.2, bed.e) * 0.97;
    const q = path.locate(x, z, null, _f), K = this.rick;
    if (q.s > K.s[0] && q.s < K.s[1] && q.d < K.d[0] && q.d > K.d[1]) return K.height;
    return 0;
  },

  /** Is this place on the line of the door's nine cloths? */
  clothAt(path, x, z) {
    const G = this.gate, g = frame(path, G.s, _g), go = (x - g.x) * g.tx + (z - g.z) * g.tz, gd = (x - g.x) * g.rx + (z - g.z) * g.rz;
    return Math.abs(go) < 1.0 && Math.abs(gd) < G.mast;
  },

  /** Is this place inside the built area (the channel, the reed band and its tufts, the fen)? Beyond it stands the far reed mass. */
  inner(path, x, z) {
    const q = path.locate(x, z, null, _f), s = q.s, d = q.d, e = Math.abs(d) - q.halfWidth, R = this.reeds;
    if (s > 134) return false;
    if (s < 0) return Math.hypot(Math.max(0, -s - 2.6), Math.max(0, e)) < R.farFrom;
    if (d < 0 && s >= R.leftTo) return d > this.fen.to;
    return e < R.farFrom;
  },

  /** Is this place in the open lead behind the heron (no stubble, sedge or stand grows there)? */
  inLead(path, x, z) {
    const e = at(path, this.title.s - 0.45, this.title.d, 0), h = at(path, this.heron.at[0], this.heron.at[1], 0), F = this.fen;
    const hd = Math.hypot(h[0] - e[0], h[2] - e[2]), d = Math.hypot(x - e[0], z - e[2]);
    if (Math.hypot(x - h[0], z - h[2]) < F.heronPool) return true;
    if (d < hd - F.lead[1]) return false;
    let a = Math.atan2(x - e[0], -(z - e[2])) - Math.atan2(h[0] - e[0], -(h[2] - e[2]));
    a = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) * 180 / Math.PI;
    return a < F.lead[0];
  },

  // ---- solid things in the channel (the page's list). [s, d, r]; r already holds the 0.3 m of grace. A fourth entry
  // makes a circle soft (the engine's shallows: the boat is slowed and eased back out, not stopped)
  colliders(path) {
    const out = [], B = this.bridge, J = this.jetty, S = this.staithe, T = this.tuft;
    out.push([S.M1[0], S.M1[1], 0.42], [S.M2[0], S.M2[1], 0.42]);                           // both mooring posts
    for (let d = J.d[1] - 0.35; d >= -11.6; d -= 0.75) out.push([J.s, d, 0.95]);            // the jetty's head, which stands 2 m into the channel
    out.push([this.lamp.post[0], this.lamp.post[1], 0.45]);                                  // the lamp post
    for (const k of [-1, 0, 1]) out.push([T.at[0], T.at[1] + k * (T.across / 2 - 0.9), 1.25]);   // the lamp tuft
    for (const t of B.towers) for (const side of [-1, 1]) for (const k of [-1, 1]) out.push([B.s + k * 0.55, side * t, 0.95]);   // each tower: two circles
    // the open left edge, s 21 to 56: no bank stands there, only withies, sedge and 14 cm of water over the stubble. The
    // channel's edge is a wall the eye cannot see; these shallows slow the boat over its last metre and a half, so that
    // it grounds softly on the fen's lip instead of striking nothing
    if (path) for (let s = 21; s <= 56; s += 2.5) out.push([s, -(frame(path, s, _g).halfWidth + 0.6), 2.0, 0.7]);
    return out;
  },
};
