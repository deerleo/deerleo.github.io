// The orchard in flood: its painted art, as the ride loads it (assets/art/orchard/). Each is null until it is painted
// and packed; set.js then uses its stand-in. Page section 10 lists the pictures; tools/art.py makes them.
//
//   sky       the all-round sky panorama (stage 1: made)
//   far       the far rails: windbreak, meadow, the meadow's edge (stage 1: made)
//   petals    the petals on the water. set.js draws their picture itself, petal by petal (petalTile): it is DATA, not a
//             painting (R a petal's own light, G its hue, B its threshold, A where it is: see set.js), so a painted
//             `petals.webp` cannot stand in for it. Leave PETALS_ART null.
// STAGE 2D: the display is neutral now (plan.js, LIGHT), so a painted picture is seen as it was painted and NOTHING IS
// BAKED any more: assets/art/orchard/sky.webp and far.webp are the pictures exactly as packed (the first pass put them
// through source-art/orchard/bake_seen.py; the packed originals it kept are what is in assets/ now, and that script is
// retired). Textures that lie on lit models (blossom, bark, stone, bed) never were baked.
// The sky (source-art/orchard/sky.png, 3840 x 1280; wrapped with `art.py seamless orchard sky --blend 0.04`, which keeps
// the chimney at its east end). set.js does not wrap it round the rider as a panorama: it shows the west as a flat
// picture and only the picture's foot round the east (see "THE SKY" there). Its west stands 7.5 degrees right of the
// picture's middle (rotation), and its painted horizon 48 px above its bottom edge (band).
export const SKY_ART = { url: 'art/orchard/sky.webp', rotation: 0.131, band: -4.68 };
// The far rails (source-art/orchard/far.png, 3840 x 1280, three strips on nothing; `art.py pack orchard far --max 2048
// --soft`). Each strip: its rows in the picture (v from the bottom), how many metres of country its
// whole width stands for and how tall that makes it, the radius of its rail about (s 170, d 0), where its foot stands.
// `once` (the meadow): the stretch of its width that holds the one barn, shown a single time, `at` degrees from west.
export const FAR_ART = {
  url: 'art/orchard/far.webp',
  bands: [
    { name: 'the meadow (pollard willows, hedges, one barn)', v: [0.2135, 0.4100], metres: 166, height: 11, radius: 330, foot: -0.4, once: { u: [0, 0.36], at: -7 } },
    { name: 'the windbreak (poplars and elms)', v: [0.4750, 0.9590], metres: 205, height: 33.3, radius: 250, foot: -0.8 },
    { name: "the meadow's edge (sedge, reeds, fence posts)", v: [0.0110, 0.1490], metres: 77, height: 3.6, radius: 240, foot: -0.25 },
  ],
};
export const PETALS_ART = null;      // (see above: drawn in code)
