// The orchard in snow: which painted art is in (page section 10). null = not generated yet (a coded stand-in is drawn).
//   sky        the winter sky dome (winter layer): assets/art/snow/sky.webp, made with tools/art.py seamless
//   far_shore  the ring of far shore at 480 m: assets/art/snow/far_shore.webp
//   snow       every snow surface: assets/art/snow/snow.webp (1024, tiles): the snow's own light lays it (light.js, `lift`)
//   skin_ice   the water's skin: assets/art/snow/skin_ice.webp (1024, greys, tiles): frost feathers on unbroken ice
// (birch and clear_ice, the other two tiles of the page's list, are the Margins group's and are loaded in their module.)
export const SKY_ART = {
  url: 'art/snow/sky.webp',            // 3303 x 1280 after `art.py seamless`: wrapped once it stands from 4 degrees under the horizon to 79 degrees up
  rotation: 0, band: [-4], glow: 0.96, fadeBottom: 0.24,      // (its painted pearl is only its lowest twentieth: the picture is faded in over its first quarter, to about 28 degrees up, so that the page's pearl stands at the horizon and the painted cloud comes in above it)
};
export const FAR_ART = {
  url: 'art/snow/far_shore.webp',      // 2048 x 683, transparent; the shore is the middle band of the picture (the generator takes nothing wider than 3:1)
  v: [0.27, 0.61],                     // that band, as v (0 = the bottom of the picture)
  metres: 470,                         // metres of shore to the picture's width: its poplars then stand 26 m tall
  height: 48, foot: -6,                // the band's height in metres, and where its lower edge stands (its mist lies over the plain's last line)
};
/** `snow`: wind-packed snow, its scallops lying across the wind; the picture covers about three metres. Its mean luminance, measured in linear light (as the shader reads it): 0.751 (5th to 95th percentile 0.655 to 0.830). */
export const SNOW_ART = { url: 'art/snow/snow.webp', metres: 3.2, mean: 0.751 };
/** `skin_ice`: frost feathers, in greys, high key (mean 0.88); the picture covers about three metres. */
export const SKIN_ART = { url: 'art/snow/skin_ice.webp', metres: 3.0 };
