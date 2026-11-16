// The town below: the area's numbers, taken from docs/art/town.md (the page). Plain data and small functions, no three.js.
// Every module reads this, so that a thing is where the page says in all of them. ADD to it under a heading of your own;
// change someone else's number only when the page says it is wrong, and say so in your log (docs/build/town/).
//
// Conventions (the page's): s = metres along the centre line from the entrance, d = metres to the RIGHT of it as the
// boat faces down the route (negative = left), y = metres above the water (negative = below). Depths are TRUE depths:
// stage 1 found that the look-through needs no squeeze (docs/build/town/1-layout.md), so nothing here is squeezed.
// Convert with the kit: kit.at(s, d, y).
const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { if (!(b > a)) return x >= b ? 1 : 0; const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
/** Piecewise-linear table lookup: table = [[x0, y0], [x1, y1], ...] with x rising. */
export const table = (tab, x) => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) return lerp(tab[i - 1][1], tab[i][1], (x - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]));
  return tab[tab.length - 1][1];
};

// ------------------------------------------------------------------------------------------------ the route
// The centre line IS the page's composed line: a boat left alone is carried along it. Arc lengths of the control
// points as the engine measures them: 0, 30.1, 70.4, 121.1, 148.5, 163.9, 194.5, 210.7, 226.7, 236.8, 239.8, 258.8.
// (One point is mine: [-34, -232, 17], so that the navigable water under the portico stays as wide as the portico
// until just before the door wall, instead of tapering through thin air.)
const PATH = {
  points: [[0, 0, 9], [0, -30, 10], [-3, -70, 12], [-12, -120, 22], [-20, -146, 26], [-26, -160, 30], [-32, -190, 30], [-34, -206, 22], [-34, -222, 18], [-34, -232, 17], [-34, -235, 10], [-34, -254, 10]],
  softEdges: false,
};

// The street floor under the route, and the ridges of the houses directly below it (the page's "Depth under the route").
const FLOOR = [[0, -9], [60, -9], [121, -17], [146, -17], [150, -22], [204, -22], [212, -12], [224, -1], [300, -1]];
const RIDGE = [[0, -1], [60, -1], [121, -9]];

// How fast the water carries a boat left alone, by s (the page gives the show's length and its places, not the speed:
// these are the speeds at which a hands-off rider gets every moment whole; see the log). The engine has one speed for
// wide water and one for narrow: set.js writes this value into both.
const CURRENT = [[0, 2.2], [22, 2.0], [40, 1.5], [112, 1.5], [124, 1.3], [146, 1.2], [158, 0.9], [200, 0.9], [214, 1.3], [232, 1.7], [259, 2.0]];

// ------------------------------------------------------------------------------------------------ light
// The light of the page's four states, as tuned against the key painting at the real eye in stage 2d (the place, its
// light and its water: docs/build/town/2-light.md has the measurements and says where these leave the page's table).
// Colours are typed as they should be seen (the grade's toe is 1). set.js mixes them by the boat's distance along the
// route (stateWeights) and light.js lights everything with them. `plan.tone` is the same table.
//   (five states since the sixth holder: `mist` stands before the page's four. set.js and light.js read them by plan.toneNames.)
//   at                   where the page puts the state
//   sky, fog, exposure   the dome's three colours, the air, the picture's level; mist: the height in degrees of the band
//                        of mist that stands low all round, in the air's own colour. sky.low, sky.lowK (fourth holder): the
//                        low sky, a band of plum rose a few degrees up where the overcast, seen at a glance, is lit from
//                        beneath by the whole town (its colour; how much of it): the far hills are dark against it and
//                        the middle water mirrors it. footMist: [how much, over how many metres of height] of mist on
//                        the feet of things further than 40 m (the air itself is thinner than the page's: far things are
//                        dark shapes standing in low mist, as in the key painting, not pale shapes in a haze)
//   night                what things above the water sink to: nearly neutral, so that local colours stay themselves
//                        (lilac stone reads lilac, not magenta)
//   cloud                the little that the lit overcast gives back to what faces up, above the water
//   under                the town's light from below on things above the water: colour, strength, and `floor` = how
//                        much of it there is where nothing burns beneath
//   shallow, deep        the water's own light on things under the surface: green-teal in the top metres; in the deep a
//                        dark blue-teal (depth darkens: second holder of stage 2d, 7 November evening)
//   top                  what falls on things that face up under water (roofs are the fifth facade)
//   street               the colour of the town's own lamplight where it pools on walls and paving (orange-coral: it is
//                        a pool at the foot of what burns, not a wash over the street)
//   waterA, waterB       what a sight line dissolves into under water: a dark green-teal in the shallows, a darker
//                        blue-teal in the deep (never pale: depth darkens, it does not whiten); waterFog per metre
//   waterLit             the water where the town burns in it: an ember glow, low in the lit streets (at the height of
//                        their lamps and windows and under them); a sight line takes it by the length of lit water it
//                        passes through. Never pale: it is a glow between dark roofs, not a haze
//   line                 the line of light where the water meets a thing; nets: the moving nets under water; waterLight:
//                        the water-light on stone above the surface
//   hull                 the engine's own light (look.light) for what does not wear the area's material: the boat
// (third holder of stage 2d, 7 November 20:20: shallow, deep, top, waterA, waterB a step bluer and less saturated, and
// waterLit a dark old rose where it was a brown ember: measured against the key painting, whose water is hue 195 at
// saturation 0.4 where ours stood at hue 186 and 0.6. docs/build/town/2-light.md, "Second look".)
// (fifth holder, 23:00: waterA and waterB a step darker. Sixth holder, 8 November 01:00: nets 0.16 .. 0.17 -> 0.24 .. 0.3 with
// the nets drawn as a true caustic web: light.js, netTile. 02:05: waterB from a dark blue to a dark TEAL (#0a1e2e -> #0d3238) and
// waterA a step lighter: measured on postcard 6 the near water over the square stood at hue 217, saturation 0.28, where
// the key painting's water is hue 197 at 0.44; teal was 2 per cent of the picture's colour and is 5. The depths go dark teal.)
// (fourth holder, 21:40: shallow, top and waterA a step greener again: the mirror now lays the sky's plum over the middle
// water (water.fresnel 3), and under it the third holder's blue came out blue-violet, hue 245, where the key is 214.)
const STATES = {
  // (sixth holder, 8 November) THE MIST AT THE DOOR. The engine's veil is a film on everything, the water too: inside it
  // nothing can sharpen, and the page's first window was a lilac wash with smudges in it. So the veil itself is short here
  // (look.veilIn 14) and the page's "lilac blankness all round" is the AREA's own mist from there to s 28: thick air in
  // the veil's own lilac (nothing shows beyond thirty metres; sky.cloudK 0: no cloud is drawn in it), over water that
  // is clear at the gunwale: the first window is seen straight down through it, burning. It thins into `arrival`.
  mist: { at: 8,
    sky: { top: '#757092', mid: '#8682a2', horizon: '#8e8aa8', low: '#8e8aa8', lowK: 0, cloudK: 0 }, fog: { color: '#8e8aa8', density: 0.05 }, footMist: [0.3, 5], exposure: 1.0, mist: 40,
    night: '#5c5a72', cloud: '#34304c', under: { color: '#B9A6DA', gain: 0.4, floor: 1.0 },
    shallow: '#336a68', deep: '#122e42', top: '#589490', street: '#F59460',
    waterA: '#113e3c', waterB: '#0b2c32', waterLit: '#70445a', waterFog: 0.034,
    line: '#c4bade', nets: 0.3, waterLight: '#9c8fc0',
    hull: { shadow: '#3a3452', lit: '#c8b8dc', keyColor: '#b9a6da', sky: '#34304c', ground: '#5c5080' } },
  arrival: { at: 26,
    sky: { top: '#171029', mid: '#2c2246', horizon: '#62568a', low: '#62568a', lowK: 0 }, fog: { color: '#5a4e80', density: 0.012 }, footMist: [0.3, 5], exposure: 1.04, mist: 15,
    night: '#56546c', cloud: '#2c2942', under: { color: '#B9A6DA', gain: 0.45, floor: 1.0 },
    shallow: '#336a68', deep: '#122e42', top: '#589490', street: '#F59460',
    waterA: '#113e3c', waterB: '#0b2c32', waterLit: '#70445a', waterFog: 0.034,
    line: '#b7accf', nets: 0.28, waterLight: '#9c8fc0',
    hull: { shadow: '#2b2442', lit: '#c4b0d8', keyColor: '#b9a6da', sky: '#262040', ground: '#5c5080' } },
  street: { at: 90,
    sky: { top: '#0f0a1c', mid: '#1c122c', horizon: '#48365f', low: '#4e2e50', lowK: 0.8 }, fog: { color: '#44345a', density: 0.0036 }, footMist: [0.5, 3.5], exposure: 1.08, mist: 3.2,
    night: '#4d4a64', cloud: '#231f36', under: { color: '#F2906C', gain: 1.6, floor: 0.10 },
    shallow: '#3f8884', deep: '#16384e', top: '#6cb0aa', street: '#F59460',
    waterA: '#134642', waterB: '#0d3238', waterLit: '#7c4a58', waterFog: 0.026,
    line: '#a79cc4', nets: 0.3, waterLight: '#d98a6a',
    hull: { shadow: '#231834', lit: '#f0a887', keyColor: '#f3a06a', sky: '#1a152b', ground: '#a8665a' } },
  square: { at: [150, 204],
    sky: { top: '#0f0a1c', mid: '#1d122d', horizon: '#48365f', low: '#4e2e50', lowK: 0.85 }, fog: { color: '#433359', density: 0.0031 }, footMist: [0.5, 3.5], exposure: 1.06, mist: 2.8,
    night: '#4d4a64', cloud: '#262038', under: { color: '#F2906C', gain: 1.6, floor: 0.10 },
    shallow: '#3f8884', deep: '#16384e', top: '#6cb0aa', street: '#F59460',
    waterA: '#134642', waterB: '#0d3238', waterLit: '#7c4a58', waterFog: 0.022,
    line: '#a79cc4', nets: 0.3, waterLight: '#d98a6a',
    hull: { shadow: '#231834', lit: '#f0a887', keyColor: '#f3a06a', sky: '#1a152b', ground: '#a8665a' } },
  portico: { at: 226,
    sky: { top: '#0c0817', mid: '#160f24', horizon: '#30244a', low: '#38223e', lowK: 0.6 }, fog: { color: '#2c2040', density: 0.0055 }, footMist: [0.45, 3.5], exposure: 0.98, mist: 3.5,
    night: '#535069', cloud: '#221d34', under: { color: '#CF7C82', gain: 1.2, floor: 0.3 },
    shallow: '#326a66', deep: '#10283c', top: '#568e8a', street: '#E88860',
    waterA: '#10383a', waterB: '#0a2830', waterLit: '#643e4e', waterFog: 0.03,
    line: '#8f84ac', nets: 0.24, waterLight: '#c0767a',
    hull: { shadow: '#1c1329', lit: '#d99a90', keyColor: '#cf7c82', sky: '#151023', ground: '#7a505c' } },
};
const STATE_NAMES = ['mist', 'arrival', 'street', 'square', 'portico'];
/** Weights of the light states at distance s along the route (they add up to 1). The mist at the door stands to s 12
 *  and is gone by s 28; the arrival's mist thins between s 12 and s 46, so that the first image at s 26 already reaches
 *  the tower's warm foot, as the page's own moment asks (its table would keep the mist until s 90). */
function stateWeights(s, out = {}) {
  const m = 1 - smooth(12, 28, s), a = smooth(12, 46, s), b = smooth(90, 150, s), c = smooth(204, 226, s);
  out.mist = m; out.arrival = (1 - m) * (1 - a); out.street = (1 - m) * a * (1 - b); out.square = (1 - m) * b * (1 - c); out.portico = (1 - m) * c;
  return out;
}
// What the lit windows of light.windows() burn with (their shares are WINDOW_TONES', the commonest first): a rose-gold
// pushed toward orange, an ember, jade, pale gold; dark glass; the lamp in the room. The key painting's windows measure
// #eb9070 to #f8ab7b with coral halos; the page's rose-gold, typed flat, came out peach and pink. None is the kept
// lamp's amber (#FFB45E): these are redder, and the water tints them further.
const WINDOW_LIGHT = { tones: ['#F29A62', '#E2704E', '#4AA391', '#FFD9A8'], dark: '#2a1a3e', core: '#FFC08A' };

const LOOK = {
  background: '#150D26', veil: '#8e8aa8', veilIn: 14,      // (veilIn: the engine's veil is gone by s 14 and the area's own mist carries the door from there: STATES.mist)
  fog: { ...STATES.arrival.fog }, exposure: STATES.arrival.exposure,
  // (stage 2d: toe 1, so that dark colours are shown as typed; no tint: the page's lilac tint takes a fifth of the green out
  // of everything, and with it the water's teal; contrast 1.0: the page's 1.05 crushes the darks. See the logs.)
  grade: { tint: '#ffffff', saturation: 1.08, contrast: 1.0, lift: '#0B0616', vignette: 0.36, grain: 0.035, toe: 1 },
  bloom: { strength: 0.8, radius: 0.8, threshold: 0.9 },
  paint: 0.70, paintRadius: 4.5,
  lantern: 1.4,
  boat: { tone: '#b8b0c4' },      // (fifth holder of stage 2d: the rider's boat as worn wood in this light, never the lightest, warmest thing in a forward picture)
  current: 2.0, currentNarrow: 2.0,
  // the gouache light: the key travels UPWARD (the town burns under everything)
  // (this is the light on what does not wear the area's material: the boat. set.js drives its colours from STATES[*].hull;
  // heightFog: a little mist on the feet of far things)
  light: { key: [0.1, 0.92, -0.3], keyColor: '#b9a6da', lit: '#c4b0d8', shadow: '#2b2442', sky: '#262040', ground: '#5c5080', gain: 1.0, heightFog: 0.2, heightFogOver: 4.5 },
};
// Emissive gains (the page, section 2): multiply an emissive colour by these. (window and windowFlare: the page's 1.6 and
// 2.3 doubled, 7 November evening: seen through the water a window at 1.6 arrived at a third of the key painting's, and
// the windows are to be the brightest things in the picture. docs/build/town/2-light.md. Third holder, 20:20: 2.6 and
// 3.6 -> 3.2 and 4.4: the key painting's brightest fiftieth is value 0.96, ours stood at 0.75 to 0.89.)
const GAIN = { window: 3.2, windowFlare: 4.4, lampHead: 4, glassRidge: 2.2, jelly: 1.4, jellyRib: 2.2, lattice: 2.5, litSurfaceMax: 0.9 };

// ------------------------------------------------------------------------------------------------ colour
const CHIP = { nightPlum: '#150D26', plum: '#3B1F4D', violet: '#7850A6', lilac: '#A994CC', oldRose: '#C76C8C', roseGold: '#F3A77E', jade: '#4AA391', turquoise: '#7ADCC6',
  core: '#FFD9B0', paleJade: '#B8E6CF', paleGold: '#FFE3C4', lampAmber: '#FFB45E' };
// window ramp, asleep to flaring
const WINDOW_RAMP = ['#3B1F4D', '#B4506E', '#D98A78', '#F3A77E', '#FFD9B0', '#B8E6CF'];
// what windows are lit with (share of all windows)
const WINDOW_TONES = [{ color: '#F3A77E', share: 0.70, jade: 0 }, { color: '#C76C8C', share: 0.15, jade: 0 }, { color: '#4AA391', share: 0.10, jade: 1 }, { color: '#FFE3C4', share: 0.05, jade: 0 }];
// local colours of the stand-ins (mid values; the light does the rest)
const LOCAL = {
  stone: '#9a8296',          // masonry above water: plum in shade, rose where the town burns under it
  paleStone: '#b8a8c8',      // the theatre front (reads #8E7AA8 in its light)
  brick: '#8c5f68', pot: '#a0685e',
  tile: '#7a4c66', slate: '#5a4a78', lead: '#6f6a86',
  plaster: ['#B8707E', '#C9936F', '#6F5C8E'],          // faded rose, ochre-pink, grey-violet (under water)
  roof: ['#5E3A52', '#3D3058'],                         // mossed tile, slate (under water)
  paving: '#6F5C8E', iron: '#2B1D30', gilt: '#9A7A44', bronze: '#7C5A3C',
  poplar: '#2a2440', silhouette: '#241536', hill: '#2a1c3e',
};

// ------------------------------------------------------------------------------------------------ the monument
// The clock tower: 46 m in all, 22 under the water and 24 above (25.2 with the vane). Centre at s 184, d +10.
const TOWER = {
  s: 184, d: 10, side: 7.0, wall: 0.9, foot: -22, top: 24, vane: 25.2,
  loggia: { to: 7.5, pier: 1.6, arch: 3.8, spring: 4.6, crown: 6.5, oculus: 2.0, tide: 0.6 },
  pendulum: { pivotY: 9.4, bob: 1.1, bobThick: 0.28, period: 6.0, amplitude: 7, kissY: -0.02 },      // swings ACROSS the route (along d)
  clock: { from: 7.5, to: 13.5, dial: 4.6, ringWidth: 0.32, opening: 4.0, centreY: 10.5, doorY: 7.8, rungs: 11 },
  belfry: { from: 13.5, to: 19.5, opening: [1.5, 3.8], bell: { mouth: 1.9, height: 1.6, y: 16.2 }, wheel: 2.6 },
  roof: { from: 19.5, to: 24, eaves: 0.5, finial: 0.4, vaneLength: 1.1 },
  below: { slits: 5, door: true },
  hourRing: { radius: 8.0, inner: 7.2, collar: 5.2, y: -22 + 1.1, lanterns: 12, standard: 2.6, period: 96 },
  // The boat may not enter the loggia (the pendulum sweeps it at the waterline): four piers and the bay between them.
  colliders: [{ ds: -2.7, dd: -2.7, r: 1.35 }, { ds: 2.7, dd: -2.7, r: 1.35 }, { ds: -2.7, dd: 2.7, r: 1.35 }, { ds: 2.7, dd: 2.7, r: 1.35 }, { ds: 0, dd: 0, r: 2.6 }],
};
// The kept lamp: on a wrought bracket on the tower's up-route, channel-side pier. Flame at s 180.2, d +5.6, y 2.3. Note G4.
const LAMP = { s: 180.2, d: 5.6, y: 2.3, hangY: 2.5, note: 67, moths: 3, near: 8, reach: 9 };

// ------------------------------------------------------------------------------------------------ the monument's shell (stage 2a, the modelled tower: docs/build/town/2-monument.md)
// The tower as it is MODELLED (source-art/models/town/tower_*.py, clock_dials.py, bell_great.py), for whoever puts
// anything in it or on it: the clockwork, the cast, the staging. Agree openings through these numbers. Metres; y above
// the water; `ls` = metres down the route from the tower's axis, `ld` = metres to the right of it
// (shared.tower.frame.at(ls, y, ld)). Faces: 0 up-route (-ls), 1 uphill (+ld), 2 down-route (+ls), 3 channel (-ld).
// Every tower model has ONE origin (the axis at the waterline) and one turn: shared.tower.place.
TOWER.shell = {
  inside: 2.6,                                        // the walls' inner faces above the loggia: a room 5.2 m square on every stage
  loggiaFloor: -0.9,                                  // the loggia is flagged, under 0.9 m of clear water (the page gives it no floor): the bob's rings bend its joints
  vault: { springY: 4.6, radius: 2.687 },             // a sail vault: part of a sphere on the four arches, its centre on the axis at the springing
  oculus: { radius: 1.0, lipY: 7.09, floorY: 7.5 },   // open, on the axis, a plain stone curb: the pendulum's rod passes through it
  chamber: { floorY: 7.5, ceilingY: 13.2 },           // the clock stage inside: a flat stone floor from the oculus (radius 1.0) to the walls, for the movement's
                                                      // frame to stand on; the underside of the belfry floor's joists is at 13.2
  dial: { y: 10.5, opening: 2.0, face: 3.5, ring: [3.75, 3.87], hands: [3.89, 4.0], arbor: [2.6, 4.03] },
                                                      // on each face, metres from the axis along the face's normal: the wall's face; the gilt ring's back and
                                                      // front; the hands; and the hands' arbor as modelled (a 7 cm rod from the hands' boss in to the wall's inner
                                                      // face at 2.6: bring the lead-off rods to there, on the line through the middle of the opening at y 10.5)
  door: { face: 0, ld: [-2.6, -1.98], y: [7.6, 9.01] }, // the plank door, round-headed, ajar INWARD on its corner-side hinges (the page: sill at 7.8; the dial's stone ring leaves room for 0.62 by 1.41 m and no more)
  rungs: { face: 0, ld: -2.25, y: [1.2, 7.2], n: 11 },
  belfry: { floorY: 13.5, sillY: 14.5, springY: 17.55, crownY: 18.3, lights: 0.89, louvresFrom: 16.88 },   // paired lights 1.5 m wide, their centre lines 0.89 m either side of the face's;
                                                      // louvre boards only above 16.88 (and a few stragglers below): under that the lights are open, and the bell is seen through them
  bell: { axisY: 18.3, mouthY: 16.35, along: 'ld', wheel: { ld: 2.27, radius: 1.3 }, wire: { ld: 2.27, ls: 1.95 } },
                                                      // the great bell hangs on the axis; its gudgeons lie across the route, so it swings along it (mouth up-route
                                                      // first: shared.tower.setBell(lift, clapper)). Its wheel stands outside the frame at ld 2.27, where the movement's
                                                      // bell wire comes up (ls 1.95). (axisY was 17.35 until the second pass: the sill then hid the bell from the lake.)
  smallBells: [{ face: 3, ld: -3.05, ls: 0.89, mouthY: 16.76, mouth: 0.70 }, { face: 1, ld: 3.05, ls: -0.89, mouthY: 16.82, mouth: 0.63 }],
                                                      // the two small fixed bells (bell_great.glb; named points small_bell_a, small_bell_b). Each hangs in the OPENING
                                                      // of one light, in the middle of the wall's thickness under the arch, from a deadstock at the springing: the
                                                      // channel face's down-route light, the uphill face's up-route light. A boat under the wall sees a mouth from
                                                      // beneath. Never hang one in each light of a pair: two mouths in two arched lights are a pair of eyes
  lamp: { face: 3, ls: -3.18, wallY: 2.605 },         // the bracket's place on the channel-side face of the up-route pier, 0.32 m from the arris: the flame burns
                                                      // 0.80 m off the stone at y 2.3 (s 180.8, d 5.7; the page's s 180.2, d 5.6 hangs in the air off the corner)
  slits: { y: [-3, -6.6, -10.2, -13.8, -17.4], off: 1.4, strings: [-8.4, -15.6] },     // under water: five lit slits a face, two string courses
};

// ------------------------------------------------------------------------------------------------ hero pieces
const CHURCH = { s0: 119, s1: 147, d: -5, width: 12, floor: -17, ridge: 1.2, pitch: 52, nave: 30,
  lancets: { perSide: 8, top: -0.4, bottom: -3.6, width: 1.1, out: 2.6 },          // out: metres from the ridge line to the lit faces
  fleche: { s: 127, top: 6.5, base: 1.2 }, apse: { s: 147 }, finial: { s: 148.2 } };
// The market hall on the left of the square: its lantern roof breaks the surface (the glass ridge). The page puts the
// ridge at d -31; it stands at -31.6 here so that its near face is exactly the navigable edge (d -30) and the hull
// cannot ride into the glass.
const HALL = { s0: 152, s1: 196, d: -31.6, width: 22, floor: -22, eaves: -12, ridgeWidth: 3.2, clear: 0.9, lanternFoot: -1.6, panes: 146, missing: 9, barEvery: 0.6, finialEvery: 2.4, stalls: 3 };
const FOUNTAIN = { s: 170, d: -13, basin: 6, height: 4.5, floor: -22, boil: 1.5 };
// The theatre front (the passage out; the theatre's page continues it). Stylobate 1 m under water.
const THEATRE = {
  portico: { s: 226, columns: [-17, -10.75, -4.5, 4.5, 10.75, 17], height: 14, base: 1.6, neck: 1.35, floor: -1, entablature: 2.2, pediment: 4, depth: 13 },
  wall: { s: 239, arches: [{ d: -7.5, w: 5 }, { d: 0, w: 7 }, { d: 7.5, w: 5 }], piers: [-4.25, 4.25], pier: 1.5, archTop: 8.2 },
  foyer: { s0: 239, s1: 251, width: 20, height: 10 },
  bulk: { s0: 239, s1: 292, width: 34, wall: 18, dome: 24, tree: 30 },
  steps: { s0: 212, s1: 224, from: -12, to: -1, width: 30 },
  stepLamps: [{ s: 214, d: -8 }, { s: 214, d: 8 }],
};

// ------------------------------------------------------------------------------------------------ the close band
// The street: the carriageway under the route, a raised walk on its left carrying the lamp row, the leat on its right.
const STREET = {
  s0: 26, s1: 119, carriage: [-4.5, 5.5],
  walk: { d0: -7.5, d1: -4.5, rise: 4.4 },                       // an arcaded walk a storey above the carriageway
  leat: { s0: 30, s1: 130, d0: 6.0, d1: 11.0, deep: 1.6 },       // a walled channel along the right of the street
  footbridge: { s: 104, d: 9, span: 7, y: -14 },
  basin: { s0: 130, s1: 146, d0: 5, d1: 17 },                    // the boat basin beside the church
  skiffs: 7,
};
// The lamp row: nine cast-iron standards on the raised walk, d -6. Heads just under the surface for the first three.
const LAMP_ROW = { d: -6, s: [36, 48, 60, 72, 84, 96, 108, 120, 132], headY: [-0.4, -0.4, -0.4, -2.0, -3.6, -5.1, -6.7, -8.3, -8.4], height: 4.2, dome: 3 };
const SQUARE = { s0: 150, s1: 210, floor: -22, left: -21, right: 29.5,
  terrace: { s0: 152, s1: 202, d0: 31, d1: 38, floor: -14, sill: -0.7, sillTop: 0.7, roofTop: 3.4, houses: 5, windows: 9 },    // the uphill terrace: half-lit sashes
  stalls: { rows: 2, perRow: 6, from: [171, -8], to: [181, 3] },
  lime: { s: 198, d: -6, height: 7 },
  steps: { s0: 176, s1: 196, d0: 40, d1: 62, lamps: 6 },         // the street of steps coming down the hill into the lake
};
const POPLARS = { s0: 204, step: 3.6, count: 6, d: 15.5, clear: [3, 6] };
// things a cormorant perches on (cast): stack at s 62, the church ridge end, a stack at s 204
const PERCHES = [{ name: 'stack at s 62', s: 62, d: 14.5 }, { name: 'church ridge end', s: 120, d: -5, y: 1.2 }, { name: 'stack at s 204', s: 204, d: 32 }];

// ------------------------------------------------------------------------------------------------ the vista
const VISTA = {
  viaduct: { from: [110, -170], to: [250, -250], arches: 11, span: 14, pier: 3, deck: 21, foot: -20 },
  upperTown: { houses: 40, from: 45, to: 150 },
  backdrops: { town: 260, hillsNear: 420, hillsFar: 600 },
  cloud: 70,                                                       // height of the overcast's underside
  mistBank: { s: -6 },                                             // the lilac bank lying where the orchard was
};

// ------------------------------------------------------------------------------------------------ the town's light as a field
// One map of everything that burns under the water, in the realm's own x and z (see light.js). It lights the far
// water (the glow sheet), the mist, the cloud, the underlight on things above the water and the streets themselves.
const GLOW = { centre: [-30, -128], size: 448, pixels: 1024, sMin: -100, sMax: 300 };

// Waking and sleeping, as numbers (light.js holds the function, in GLSL and in JS):
const WAKE = { drowse: 0.6, wakeFrom: 70, wakeTo: 40, sleepFrom: 30, sleepTo: 60, stay: 0.2, breath: 0.12, breathPeriod: 14, breathLength: 90,
  square: { s0: 148, s1: 212, sleepAt: 212, sleepOver: 12 } };

// ------------------------------------------------------------------------------------------------ the eye
// The rider's eye stays 1.1 m above the water. Looking down over the side, he leans toward that gunwale by up to `lean`
// metres (set.js), beginning when the view pitches below `from` radians and full by `full`: without it the boat's own
// side hides everything steeper than 48 degrees, and this is the area that is looked down into.
const EYE = { lean: 0.42, from: 0.2, full: 0.6 };

// ------------------------------------------------------------------------------------------------ water
// The water's character, as made in stage 2d (docs/build/town/2-light.md says what moved from stage 1 and from the
// page, and why). In short:
//   the mirror   no clear window: the mirror grows with the glancing angle alone. fresnel 3 (fourth holder; it was 9,
//                then 6.5): from an eye 1.1 m up, whatever stands taller than two metres is mirrored within a few metres
//                of the hull, 15 to 35 degrees under the horizon, and at 6.5 the water was a window there (the tower's dial
//                came back at a tenth): nothing lay on the lake but its last two degrees. Now the mirror is a tenth looking
//                down at 35 degrees, a third at 18 (the dial's reflection), a half at 12, three quarters at 4: the tower
//                and the dark of the sky lie on the middle water over the town beneath, as in the key painting, and
//                what it mirrors is a little richer than the world (mirrorSaturate). A ring or a wake shows in it as
//                leaning water does.
//   the glass breathes   mirror 0, long low swells (waveScale 4, waveHeight 0.2) that sway the reflections and, through
//                a stronger refraction (1.8 over 12 m), everything under the surface: the tremor. The wake is gentler
//                (0.13) so that it still moves an eave by less than half a metre.
//   the body     green-teal looking down, a dark blue-teal away (the key painting's water against the plum air); the
//                tint by depth is nearly neutral and clarity is 110 (third holder: it was 60, and the square 22 m down
//                lay under four tenths of the body's colour), because the area's own material swallows the town
//                with the distance sight travels through water (light.js) and twice would be too much.
//   crests       a faint line of sky-light along the crests of rings and the wake (rippleGlow); the body of that light
//                is surface.js's sheet over the living water.
// (fifth and sixth holders of stage 2d, 7 to 8 November, night. What changed, and why, is in docs/build/town/2-light.md:
//   the mirror   fresnel 4.5 (it was 3): half a mirror ten metres out, two thirds at fifteen, a twentieth looking down over
//                the side: "from about 15 m outward the sky and the tower lie on the water over the town beneath", and near
//                the boat the water is a window and the town its own teal (at 3 the sky's plum lay over every picture
//                that looks down). THINGS keep the gentler curve: light.js strengthens what stands above the water in the
//                mirror's own picture (uTownMirror2), so the tower is still doubled to the hull.
//   the tremor   tremor 2.8 over a reach of 5 m: what lies beneath wavers with the standing water, eaves and window rows
//                lean and sway (0.5 bent a sight nine metres long by two centimetres: there was none). The bending
//                grows with the length of water the sight passes through up to refractReach, and that was 12 m: seen
//                at a glance a row of windows fifteen metres off melted into flames while a roof under the keel hardly
//                stirred. At 5 m with a stronger tremor the near roofs waver more and the far windows keep their
//                shape. The wavelets themselves are finer and a little higher (waveScale 1.6, waveHeight 0.24). The
//                wake bends by `refraction` over the same reach. Reduced motion: half.
//   on the water sheen: sky-light on leaning water, drawn by the water itself (rings and wake as fine arcs; on water at
//                rest a few pale strokes, each hiding a little of what lies under it; a breath at a glance; the lamps'
//                share), and rest: the fine ring a boat lying still sheds. Both were this area's own, by hand.
//   the line     waterline: the water's own line of light where it meets a wall, a stack, a roof awash, the rider's hull:
//                continuous and as thin on a slope as at a wall. The area's material keeps only a breath of warm light
//                at the line where the town burns under it (light.js uTownSurf.w 0.25; it was the whole line, at 0.7).)
const WATER = {
  deep: '#1d4450', shallow: '#1f5e5a', reflectivity: 0.96, fresnel: 4.5, reflectFloor: 0.03, reflectionTint: '#f1e9fb', mirrorDarken: 0.04, mirrorSaturate: 0.25,
  roughness: 0.05, mirror: 0, waveHeight: 0.24, waveScale: 1.6, waveSpeed: 0.8, streak: 1.5, sparkle: 0.12, sparkleColor: '#ffe6c4', foam: 0, rain: 0, glow: '#000000', wake: 0.13,
  clarity: 110, underglow: 0.3, absorb: '#eef4f2', absorbDepth: 6, seeDistance: 70, clearRadius: 0, clearSoft: 14, clearFloor: 0.12,
  refraction: 1.8, refractReach: 5, tremor: 2.8, rest: 0.5, rippleSize: 96, rippleLife: 9, rippleSpeed: 1.2, rippleGlow: '#9d94c4', rippleGlowStrength: 0.12, edge: 0.05,
  sheen: { color: '#584a78', rings: 0.22, still: 0.16, glance: 0.22, hide: 0.3, lamps: 0.5 },
  waterline: { color: '#c8b8e8', width: 0.012, gain: 0.6, reach: 50 },
};

export const PLAN = {
  id: 'town', name: 'The town below', length: 258.8,
  path: PATH,
  stretch: { mist: [0, 26], street: [26, 119], church: [119, 147], square: [150, 210], poplars: [204, 224], portico: 226, doorWall: 239, foyer: [239, 251], veilOut: 232 },
  floorAt: (s) => table(FLOOR, s),
  ridgeAt: (s) => table(RIDGE, s),
  currentAt: (s) => table(CURRENT, s),
  look: LOOK, water: WATER, states: STATES, tone: STATES, toneNames: STATE_NAMES, stateWeights, gain: GAIN, chip: CHIP, windowRamp: WINDOW_RAMP, windowTones: WINDOW_TONES, windowLight: WINDOW_LIGHT, local: LOCAL,
  tower: TOWER, lamp: LAMP, church: CHURCH, hall: HALL, fountain: FOUNTAIN, theatre: THEATRE,
  street: STREET, lampRow: LAMP_ROW, square: SQUARE, poplars: POPLARS, perches: PERCHES, vista: VISTA,
  glow: GLOW, wake: WAKE, eye: EYE,
};

// ------------------------------------------------------------------------------------------------ the clockwork (stage 2a, clockwork: docs/build/town/2-monument-clockwork.md)
// The movement, the pendulum and the hour ring are modelled (source-art/models/town/clock_plan.py holds every wheel and
// ratio; the models' sidecars assets/models/town/clock_movement.json and hour_ring.json carry them into the ride).
// What is set HERE is only what a builder of the area may want to turn:
//   swingPhase   where in its swing the pendulum is when the realm begins (0..1; 0 = upright, going toward +d)
//   ringPhase    where in its turn the ring's second arbor is when the realm begins (0..1)
//   kiss         the ring the bob writes on the lake at the bottom of each swing (the page's 0.45 and 0.7 do not read: stage 1);
//                skim: the small rings it draws while its rim is under the water, a second each swing (0 for none);
//                furrow: the fine furrow the rating nut ploughs the whole swing through (it never leaves the lake);
//                swell, swellRadius: the broad low ring each kiss sends out as well (see kissLight, below)
// The trains' periods are the models': pendulum 6.0 s; escape wheel 180 s; centre arbor and the minute hands 240 s; the
// going barrel and its great wheel 1920 s; the ring's second arbor, upright shaft and crown wheel 24 s; its great wheel
// 115.2 s; the hour ring 96 s.
//   works        the works' mirror glints, for the last twenty metres only (brass and steel show the lit lake and the two
//                lamps): lake = how brightly the lake, points = the lamps as points of light (power: how small). What
//                lights the works from the water is `room`, below
//   thin         metres beyond which the pendulum's rod, and its bob, are kept out of the painter's filter (thin things)
// (Until the second look there were also fill, works.matte, works.out and gilt here: the first way of lighting metal, as a
// mirror of the lake. They are gone with it: room and bob, below, took their place.)
PLAN.clockwork = { swingPhase: 0.07, ringPhase: 0.21, kiss: { strength: 1.0, radius: 0.7, skim: 0.16, furrow: 0.05, swell: 0.3, swellRadius: 2.4 },
  works: { lake: 1.4, points: 0.5, power: 20 }, thin: { rod: 11, bob: 26 } };
//   room         (second look) the light that comes up into the clock room through the four round openings and the oculus:
//                fill = how much of it; matte = the share iron, oak and rope take of it (brass takes all); sheen, lobe = the
//                pale answer of metal turned between that light and the eye, and how broad it is; warm = 0 the town's own
//                orange .. 1 gold; glint = the mirror glints of `works` (the last twenty metres only); oculus = the share that
//                comes straight up through the oculus; cap = the brightest the works may be from far off (nothing blooms);
//                fail = how fast the light fails into the room from an opening
// (second look, second time: fill 1.0 -> 0.6, cap 0.6 -> 0.42, warm 0.5 -> 0.55. The works stood as bright as the dial's own
// ring and hands and of one gold with them, and the hands were lost against spokes of their own value. They are the
// key painting's now: dark bronze wheels in a dark dial, a step under the hands, their rims and teeth still catching.)
// (second look, a third time: fill 0.6 -> 0.5, sheen 0.5 -> 0.45, warm 0.55 -> 0.45, cap 0.42 -> 0.3; and the cap now comes on
// between 6 and 12 m from the eye (it was 9 to 21: under the clock, 11 to 15 m from the works, it had not come on at all and
// the wheels stood a step brighter than the dial's ring and hands, which the tower's fourth holder had meanwhile made a dull
// gilt). Hands pale over bronze wheels, at every distance the ride allows.)
// (second look, a fifth time: the light is followed as it comes, up through four holes in a wall 0.9 m thick, and nothing is
// clamped: heroes_clock.js, works(). `cap` and `fail` are gone. shafts = the three slopes of light that are followed back to
// each opening, metres outward for a metre down (steep from the bright water at the tower's foot, middling, shallow from
// the far lake); amb = the room's own bounce, where no light reaches; knee, ceil = the shoulder: above knee what the lights
// give climbs ever more slowly toward ceil, far under what blooms, and keeps its order (the cap scaled every lit face to one
// value: flat orange card); gold = how far lit brass is drawn from the town's coral to gold (the dial's own gilding is
// drawn so); crisp, crispTo = the works are kept out of the painter's filter, which blots what is finer than its brush, from
// `crisp` metres off (coming in over two metres) until crispTo[0], and are painted again by crispTo[1] (from the square a tooth
// is a pixel and a half: drawn as cut it is a dotted scribble that crawls); was = how much of the area's own light for things in the open air the works keep; shares = each slope's share
// of the light (the water at the tower's foot is the brightest).)
PLAN.clockwork.room = { fill: 0.55, matte: 0.2, sheen: 0.45, lobe: 7, warm: 0.45, glint: 0.7, oculus: 0.7, knee: 0.34, ceil: 0.7, amb: 0.07, gold: 0.6, crisp: 8, crispTo: [26, 36], was: 0.12, shafts: [0.55, 1.2, 2.6], shares: [0.66, 0.22, 0.12] };
//   flyRest      turns of the fly at which the striking train stands until the staging runs it (shared.clock.strike.fly begins there):
//                its vanes then stand 31 degrees askew to the up-route and down-route dials, plates seen in the round
PLAN.clockwork.flyRest = 0.085;
//   ring         the hour ring's lanterns (second look; and a second time, when the wheel was a diagram on an orange disc and the
//                lanterns pale blobs): glass = what the glass gives off (times its colour: the lantern is the thing, an orange
//                hexagon on its crook with a flame's heart); halo = the light in the water round each, heart and skirt = how much
//                of it stands close round the lantern and how much reaches the ball's rim (no hot heart: it hid the lantern);
//                pool = their light on the paving straight under a lantern, tight = how fast it fails away from the lantern's
//                foot (the power of (height / distance) squared: 1.5 is a bare point in clear air, and twelve of those run
//                together into one band that cannot be seen to turn; 4.5 leaves twelve pools apart on dark stone), warm and
//                hot = the colour of lit stone at a pool's rim and at its heart, jade = under the jade one; soft, shade = how
//                soft and how deep the wheel's shadow in the pools is (a lantern half a metre across: a blur, not a pen line);
//                iron = how much of its lanterns' light the wheel's own iron takes from above (it is drawn by its own lights);
//                take = how much of what the water's own light showed there the lantern's light replaces
// (second look, a third time, after the water was deepened and the wheel had sunk into it. What can be held of a thing 21 m
// down is light on stone, in area. glass 5.5 -> 2.6 and core 2.8: every part of a lantern gives off its glass's colour,
// `core` times as much at its own axis (the flame, pale gold in the picture) and `glass` at its six corners, which the
// picture keeps orange: at 5.5 all of it was a pale speck blotched with the dark of its own crown and bars. pool 1.15 ->
// 2.2, tight 4.5 -> 3.6, and band 0.22: each pool has a tight hot heart and a broad low skirt (band = the skirt's share);
// the skirts run together into one warm band under the whole wheel, against which the iron is a dark wheel. flags = how
// plainly the lit stone shows the square's own flags, joints, rail and hour stones (1 = as the lake bed draws them;
// they are drawn by its rule so that they lie on its own). wall = the lanterns' light on the tower's foot (soft, no
// shadow drawn; strongest at the foot and gone by the sill of the lowest slit; the foot's ashlar is drawn in it, and
// the door on the up-route face is left out of it), takeWall = how much of the wall's own picture it replaces. take
// 0.72 -> 0.85: lit stone is the lantern's colour, since the stone is now drawn in the light itself. iron 3.2 -> 5.)
PLAN.clockwork.ring = { glass: 2.6, core: 2.8, halo: 1.6, heart: 0.3, skirt: 0.25, pool: 2.2, tight: 3.6, band: 0.22, flags: 1.4, wall: 0.7,
  warm: [1.0, 0.19, 0.035], hot: [1.0, 0.31, 0.07], jade: [0.07, 0.60, 0.40], soft: 0.10, shade: 0.8, iron: 5, take: 0.85, takeWall: 0.8 };
//   kissLight    the tower's warm light on the rings the bob leaves (second look; drawn anew the second time: one ring to a
//                kiss, widening steadily, where it was a hairline on every short ripple within 8.5 m): strength; reach = metres
//                from the kiss over which the tower's light on the water fails; speed = metres a second the ring widens by
//                (the pace of the swell the kiss sends out: kiss.swell, kiss.swellRadius above); life = seconds over which it
//                fades; width = metres across the line when it is new (never thinner than the screen can draw); lamp = the
//                kept lamp's own light on the rings near it (what is left when the square sleeps)
PLAN.clockwork.kissLight = { strength: 3.2, reach: 13, speed: 1.2, life: 9, width: 0.006, lamp: 0.5 };
//   bob          (second look) the bob's gilding, lit from below by the lake: body = how much of that light; sheen = its pale
//                answer on what is turned between the lake and the eye; points, power = the two lamps in it and how small;
//                warm as above; matte = how much of its painted light gilding gives up; cap = where the shoulder that keeps
//                it from blooming begins (it is lit, it is not a lamp)
// (second look, a third time: limb0, limb1 = far off the bob is a moon lit from below, not a coin of one orange: its light is
// limb0 at its head and limb0 + limb1 at its foot, the more plainly the further off)
// (second look, a fourth time: warm 0.55 -> 0.95, matte 0.5 -> 0.7, limb0 0.32 -> 0.5, limb1 1.25 -> 1.7. The bob was not gilt: in
// the town's own coral light its gilding came out orange-copper at arm's length, and from the square a rose-orange coin of the
// same hue as the lit stone behind it (measured (200,122,86) at its middle; the key painting's bob is (251,176,90)). Gold leaf
// turns that light to gold: the light it is lit by is drawn nearly all the way to gold (warm), it gives up more of the
// area's own painted light (matte), and from far its head keeps half its light where it kept a third (limb0, limb1).)
PLAN.clockwork.bob = { body: 1.7, sheen: 0.55, points: 0.6, power: 44, warm: 0.95, matte: 0.7, cap: 0.82, limb0: 0.5, limb1: 1.7 };

// ------------------------------------------------------------------------------------------------ the deep cast (stage 3, group "Deep": docs/build/town/3-cast-deep.md)
// The old carp's ways, for cast_deep.js and for whoever stages them. Places are [s, d, y] (the page's: metres along
// the route, to the right of it, above the water); y is the height of the carp's SPINE as it truly is. The swimmers
// family draws a deep fish higher than it is (0.45 m seen from straight above, 1.0 m from 4 m off, 1.5 m from 10 m,
// 1.7 m from 25 m and more), so every line here lies that much LOWER than the fish is seen; near other things it lies
// where the fish, raised by 1.7 m, still clears them. A fourth entry { speed } is metres a second from that point on
// (0.6 where none is given). Every line was checked against the layout (houses, church, tower, hour ring, hall,
// terrace, skiffs and painters, lamps, washing, poplars, lime, the fountain's plume): the log says how.
//   patrol   closed, about 235 m, clockwise seen from above. Down-route along the port side of the composed line,
//            6.5 m off it (points 0 to 2); round the end of the square, short of the poplars (2 to 6); back up-route
//            behind the tower, in front of the terrace's drowned windows (6 to 9); up the lane between the skiffs and
//            the right bank's houses (10 to 12); one turn in the water at the street's end, before the church's west
//            front: across it from right to left 9 m down (15 to 19: the page's moment at s 96), then down-route
//            along the church's flank, 6 m to starboard of the composed line (19 to 21); back down the lane, deeper
//            (25 to 27); and across the composed line, away from a boat that comes down it (28 to 31)
//   under    the page's moment at s 146 ("straight under the keel at y -2.5"). Straight under the keel no fish can be
//            seen, so the line runs ALONGSIDE the composed one, 4.2 to 4.6 m to port and 3 m down: and (second look) the
//            OTHER way. The first line ran the boat's own way: the water carries a boat left alone at 0.9 to 1.2 m/s
//            here and the carp does 0.6, so the fish swam ahead of the bow for a minute and its line ended before the
//            boat was level with it: a pilot fish. Now it comes UP the square: it shows out of the water's veil some
//            20 m ahead on the port bow, passes beside the keel 4.3 m off, its line drawing away from the boat's all
//            the while (it never points at the hull), and is astern; then it turns away to port before the church's
//            apse (a turn 14 m across), goes back down the square before the hall, 5 to 6 m down, and into its
//            patrol. A boat left to the current meets it at s 168, twenty seconds after the cue; one that is paddled,
//            sooner and further down; a rider who has stopped at the cue sees it come to within 14 m and turn away
//   shallow  the showstopper's last part: the shallow leg, drawing away from the composed line to 8.5 m to port of it
//            (the rise is taken here), then down into the mouth of the avenue between the poplars, round, and back
//            up-route to the patrol behind the tower
//   turn     the showstopper's first part, for a carp that is deep and far: up from behind the tower in one rising
//            turn round its shaft (9.5 m from its axis, from 15 m down), across the composed line 4 to 5 m down, ahead
//            of a boat that is still up-route of the tower; `stroke` below is turn + shallow, one line
PLAN.deep = {
  carp: {
    speed: 0.6, thin: 0.8,
    // what it writes on the water (second look, taken over). bulge: once a tail beat while its snout is within `depth` of the
    // surface, over its tail. The page gives it 0.2 at a radius of 1.5 m: a swell that wide cannot be seen on this water
    // (tried at 0.2 and at 0.45: nothing in the picture); at 0.8 m it is a soft ring that tells where the fish is, and
    // the surface with it. sip: a ring of this module's own on the family's (0.35, 0.45) as its lips touch: the size of
    // the pendulum's kiss, which is what reads from eight metres
    bulge: { strength: 0.34, radius: 0.8, depth: 1.9 }, sip: { strength: 0.45, radius: 0.7 },
    patrol: [
      [174, -6.5, -4.6], [182, -6.5, -4.6], [189.6, -6.5, -4.8], [195.95, -4.8, -5.43], [200.6, -0.15, -6.07], [202.3, 6.2, -6.7],
      [200.6, 12.55, -7.33], [195.95, 17.2, -7.97], [189.6, 18.9, -8.6], [180, 20.6, -9.2], [168, 20.8, -8.6], [158, 21, -7.2],
      [149, 21.1, -5.8], [140, 21.1, -5.5], [133, 20.8, -6.3], [127.5, 19.6, -7.5], [122.5, 18.2, -8.5], [116.2, 17.9, -9.2],
      [113.83, 17.43, -9.2], [111.82, 16.08, -9.2], [110.47, 14.07, -9.2], [110, 11.7, -9.2], [110.47, 9.33, -9.2], [111.82, 7.32, -9.2],
      [113.83, 5.97, -9.2], [116.2, 5.5, -9.2], [122.84, 6.03, -8.8], [125.08, 7.52, -8.6], [126.57, 9.76, -8.4], [127.1, 12.4, -8.2],
      [127.1, 13.2, -8], [127.63, 15.84, -7.83], [129.12, 18.08, -7.65], [131.36, 19.57, -7.47], [134, 20.1, -7.3], [141, 20.2, -7.1],
      [147, 20.2, -7], [153, 20.2, -6.8], [157.59, 19.29, -6.55], [161.49, 16.69, -6.3], [164.09, 12.79, -6.05], [165, 8.2, -5.8],
      [165, 2.5, -5.5], [166.21, -2, -5.2], [169.5, -5.29, -4.9],
    ],
    at: { port: 0, end: 2, terrace: 8, lane: 12, street: 17, flank: 25, back: 34, cross: 41 },      // the patrol's points, by name, for swim(patrol, { in, at })
    // (points 3 to 11 are a true half circle of 7 m in the WORLD, turned into [s, d] by the layout: the route bends here, and a
    // circle drawn in s and d is an egg whose sharp end turns in 3 m)
    under: [[188.0, -5.0, -3.6], [180.0, -4.6, -3.2], [172.0, -4.3, -3.0], [163.5, -4.5, -3.0], [161.15, -5.32, -3.1], [159.39, -7.18, -3.3], [158.48, -9.69, -3.6],
      [158.48, -12.42, -3.9], [159.28, -14.95, -4.25], [160.67, -16.94, -4.6], [162.34, -18.16, -4.95], [164.28, -18.47, -5.3], [171.0, -18.8, -5.8], [178.0, -17.4, -6.0],
      [184.4, -14.2, -5.6], [190.0, -10.2, -5.1]],
    underAt: { lead: 0, ahead: 1, beside: 2, turn: 3, hall: 11, home: 15 },      // its points, by name: go('under', { in: 3, at: 1 }) has its snout at `ahead`, 34 m down-route of the cue's place, three seconds after the cue
    shallow: [[170.0, -4.2, -3.1], [178.0, -6.2, -2.6], [186.0, -8.3, -2.0], [194.5, -8.6, -1.9], [202.5, -8.6, -2.9], [209.6, -5.7, -4.4],
      [212.5, 1.4, -5.9], [209.6, 8.5, -7.2], [202.5, 11.4, -8.5], [195.5, 13.2, -8.9], [189.5, 17.2, -9.0], [183.5, 20.2, -9.1]],
    // (the turn's first two points lie in sight of a boat up-route of the tower: they only lead the line in. Put the carp
    // on it at or after point 2, behind the shaft: swim(stroke, { in, at }) with `at` 3 or more)
    turn: [[184, 0.5, -15.6, { speed: 0.9 }], [190.72, 3.28, -14.3], [193.5, 10, -13], [190.72, 16.72, -11.7], [184, 19.5, -10.4], [177.28, 16.72, -9.1],
      [174.5, 10, -7.8], [177.28, 3.28, -6.2], [182.6, -2.6, -4.6, { speed: 0.6 }], [188.6, -6.6, -3.0]],
    strokeAt: { hidden: 2, terrace: 4, upRoute: 6, cross: 7, shallow: 10, avenue: 13, done: 18 },      // the stroke's points, by name (turn + shallow from its fourth point)
  },
};
PLAN.deep.carp.stroke = PLAN.deep.carp.turn.concat(PLAN.deep.carp.shallow.slice(3));
// The lantern-jellies' light in this water, for cast_deep.js (the lights family's makeCombJellies; the log says how each
// number was found by looking):
//   body, rim, rib   the light inside (a rose-gold a step rosier than the windows' orange, so that a lantern is never
//                    taken for a window or a lamp), the jade of its edge, the jade of its comb rows
//   glow             the family's `glow` (1.4 on its test stage; the town's windows were doubled for this water, and so are
//                    these); edge: how much of that the jade edge takes (the family raises both together)
//   behind           metres of water taken to lie behind a clear body (a hand's breadth for one on a wall, a street's
//                    depth for one adrift: one number for all)
//   burn             the share of the water-between's swallowing that a lantern takes (a light burns through water that a
//                    wall is lost in: light.js gives a window a fifth)
//   far              the metres from the eye over which a lantern is gone into the water (the page: seen from 3 to 30 m)
// (second look, taken over, 8 November. body and glow were '#ee8e80' at 3.8: the picture's tone curve shows that light as
// (237,196,183), a pale pink: shells, not lights. A warm light keeps its colour through that curve only if it is typed
// far more saturated than it is to be seen (the light's builders push every window to (1, 0.25, 0.07) for the same
// reason): '#ff815e' is (1, 0.22, 0.11) and shows as the page's rose-gold; 2.5 keeps its core under a window's.
//   halo    the light a lantern throws into the water round it (cast_deep.js, GLOW_VERT): its colour (a step rosier
//           than the body: the page's "water light at 6 to 12 m" is old rose, and a lamp's halo is orange), strength,
//           metres across, how far before the animal it stands, what is left of it at arm's length, and how many
//           overlapping glows a colony's are thinned to
//   soft    from and to how many metres down a lantern is drawn as its light alone, and that light's strength
//   hide    how much of what is behind it a clear body hides)
PLAN.deep.lanterns = { body: '#ff815e', rim: '#4aa391', rib: '#7adcc6', glow: 2.5, edge: 0.9, ribGlow: 0.9, shimmer: 1.3, behind: 5, burn: 0.3, far: [34, 50],
  halo: { color: '#ff7868', gain: 0.42, size: 1.5, push: 0.35, near: 0.2, crowd: 2.2 }, soft: [2.4, 6.0, 0.62], hide: 0.06 };
