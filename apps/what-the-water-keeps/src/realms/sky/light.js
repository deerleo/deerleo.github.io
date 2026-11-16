// The standing sky's own light, shared by every module of the area (set.js makes it and publishes it as shared.sky).
//
//   const sky = shared.sky;
//   sky.paint({ color, ... })                      // kit.gouache in the area's light: use it for everything the area builds
//   sky.extend()                                   // the same as an `extend` for kit.model / kit.models / kit.animated
//   sky.adopt(object)                              // put a thing that is already dressed in plain gouache (the engine's lamp post) into the area's light
//   sky.standIn({ name, at, size, shape, color })  // the engine's stand-in (src/engine/modules.js), in the area's light
//   sky.at(s, d, y)                                // kit.at that runs on past the path's ends (kit.at holds s inside the path: the ridge reaches s 356, the path ends at 322)
//   sky.paint({ ..., air: 'far' })                 // THE NIGHT AIR (below): 'near' (the default), 'far', or false for things under the surface
//   sky.adopt(model, { air: 'far' })               // the same for a model loaded with kit.model / kit.models / kit.animated
//   sky.dabs(list, opts)                           // points of light: stars, the constellations' stars, the lights on the bed
//   sky.hairlines(segments, opts)                  // the constellations' lines: straight hairs of light between two points
//   sky.uniforms                                   // uSunline and the rest, for a shader of your own (the birds': SUNLINE_GLSL)
//   sky.e, sky.aurora, sky.T, sky.wind, sky.sunlineY, sky.state      numbers set.js keeps up to date every frame (see set.js)
//
// THE SALT, THE TIMBER, THE WATERLINE (stage 2d; options of sky.paint AND of sky.extend, so a loaded model wears them too):
//   sky.paint({ salt: 'raked' })                   // painted salt over the thing's own colour (give it chalk, #F7ECD2, or paint it chalk in Blender)
//   kit.model(url, { extend: sky.extend({ salt: 'old', air: 'far' }) })        // the same on a model
//       salt: 'raked'    fresh raked salt, furrows 14 cm apart and LEVEL on every face (the ridge's faces, a cone's flank)
//             'old'      slumped and crusted, with faint level strata and a grey dusting (old cones, slump terraces)
//             'crust'    lobes like cauliflower, 4 to 5 cm (collars, socks, skirts, tide lines, pan rims' edges)
//             'pan'      flat hard crust with pits and hairline cracks (terrace tops, rim tops, anything walked on)
//             true       the same as 'raked'
//             { kind, tile, strength, glints, strata, dusting }      kind may be a mixture [raked, old, crust, pan]; tile: metres
//                        to a repeat; strength 0..1 (how lilac the hollows: default 0.8); glints 0..1 (a few crystals
//                        that catch a star by night: default 0.55, 0 for none); strata, dusting 0..1
//       What it does: the hollows of the paint go to the page's greyed lilac (#8E86B0 on chalk), the crests stay chalk.
//       The picture is laid from three sides in the realm's own metres (for things that stay put), its strokes level;
//       far off the same strokes are drawn broader so that a furrow is about as wide on the picture at 10 m and at
//       200 m. By starlight it all but disappears (blue light has no lilac in it), which is what the night wants.
//   sky.paint({ timber: true })                    // salt-bleached timber: the area's grey (#8C8494 unless a colour is given)
//   kit.model(url, { extend: sky.extend({ timber: true }) })                   // with the ride's dry-brush tile drawn out long as
//       its grain (down every upright face, along the route on every level one) and salt bloomed white in the grain,
//       more of it on faces that look at the sky. { grain, bloom } 0..1 to change them. Since the night of the 7th the
//       landing's `timber` tile (assets/art/landing/timber.webp, one picture for both areas) is laid over it too, as a
//       neutral figure of weathered boards, checks and nail weep: { figure } 0..1 to change how strongly (plan.timberPaint.tile).
//       Nobody's call changed.
//   UNDER THE SURFACE (bed: true), second pass: such a thing also takes the stars' own white light and the pale core of the
//       bow lantern's pool, as the lake bed does (plan.lakeBed.starlight, .pool): nothing to ask for.
//   AGAINST THE FALSE DAWN, second pass: everything that wears the light is edged with jade where it stands between the eye
//       and the north (plan.light.rim.aurora): nothing to ask for.
//   salt AND timber together (a hut with crust socks, a stake with its collar, a cone with a shovel in it): the paint's
//       own paleness decides, pixel by pixel: chalk and near-chalk are salt, everything darker is timber.
//   waterline: true                                // (with salt, timber or alone) where the thing stands in the lake: a dark wet
//       band to 11 cm above the water, ragged, and above it a white dry line of crust. Default OFF: a model that has
//       its waterline painted in Blender should not have a second one. { wet, crust } metres to change the heights.
// Thin things: `crisp: true` now works together with the night air (it used to discard the whole thing: a crisp pixel's
// alpha is a mark, not an opacity). While a thing's air is closed (it is blended into the night) it cannot be crisp.
//
// WHY the area has a light of its own. The ride's gouache ramp shows a thing's local colour, untouched, on every face
// that stands side-on to the key light; so a night is only as dark as its local colours, and one object cannot be blue
// salt by starlight (#5C6DB4), jade-rimmed under the aurora and chalk (#F7ECD2) at first light. Here light is a COLOUR
// that multiplies the local colour, so everything is painted in its daylight colour and the hour does the rest:
//   starlight    one shadowless blue, as much from the mirror below as from the sky above
//   false dawn   plus a cold jade key from the north, 35 degrees up, in the ramp's own three flat steps (the aurora's rim)
//   first light  the blue pales to lilac, and above the SUNLINE (a level plane that comes down through the air as the
//                boat advances: uSunline.x metres, eased over uSunline.y) an apricot key from dead ahead, 4 degrees up
// Fog, veil, brushwork, the bow lantern, the kept lamp and local lights stay the ride's own.
//
// THE NIGHT AIR. The page keeps the first image empty (stars, their twins, one amber light) and the salt works unseen
// until the false dawn shows them. Fog cannot do that: a thing standing in the lake lies almost wholly BELOW the seam
// (the eye is 1.1 m up, a cone is 2 m tall), so however faint it is, a row of them draws the horizon the page forbids;
// and a tall thing in fog is a fog-coloured block in front of the stars. So everything the area builds also thins to
// NOTHING with distance (alpha, not fog), by two rules that set.js drives from the light state (plan.air):
//   'near' (the default: stakes, causeways, sluices, the 64 cones, tools, sedge, the jetty, the sleepers)
//          by starlight nothing is there beyond about 70 m; the false dawn opens the air in its first six seconds,
//          and from then on these are ordinary solid things
//   'far'  (the ridge and what stands on it, the hut, the 400 far cones, the pan rims, the flock)
//          the same by starlight; under the false dawn they are solid within 200 m and thin away into the night
//          between 200 and 440 m (not fog-coloured slabs in front of the stars); first light makes them solid
//          everywhere (by dawn progress 0.45, about s 225)
//   false  things under the surface (the bed, the pan floors, the drowned things): seen only where a lamp lights them
// While a rule's air is closed its materials are blended (drawn after the water); when it is open they are opaque again.
//
// THE NIGHT'S DEPTH (stage 2d). Three more things happen to whatever wears this light, by distance, and all three are
// taken away by first light (set.js drives them; the numbers are plan.light.depth and plan.air.ghost):
//   - the false dawn's GLOW (its fill, what makes near salt #5C6DB4) dies with distance: all there within 40 m, about a
//     quarter of it at 190 m. Its jade rim is kept. Near things are lit; far things keep only starlight.
//   - FAR THINGS TAKE THE AIR'S COLOUR: beyond 40 m a built thing goes toward the fog's colour (which by night is the
//     low sky's own), half of the way by 200 m, whatever the ride's fog would give it.
//   - a thing of the 'far' rule is a GHOST by night: beyond 125 m at most half of it is there and the stars show
//     through the rest. (A whole pale ridge 150 m off under the false dawn was a flat polygon lying on the mirror.)
// And in every hour: LIGHT POOLS AT THE FOOT of whatever stands in the lake and dies upward over a metre (the lake gives
// it back: violet by starlight, jade under the false dawn, pale at first light, apricot once the glitter path is
// open; plan.light.foot); and AGAINST FIRST LIGHT a form the eye sees toward the east is edged with it
// (plan.light.rim). Nothing to ask for: everything that wears the light has them.
//
// The exact mirror. The water's mirror is a picture a little coarser than the view, read back between its pixels, so a
// point or a hair of light is softer in the water than in the sky. dabs() and hairlines() draw themselves that much
// softer in the direct view (and no dimmer in sum), so that a star and its twin are the same star: see `uPass`.
import * as THREE from 'three';
import { standIn } from '../../engine/modules.js';

const REF_PX_PER_RAD = 779.42;      // sizes in "pixels" are pixels of a 900-line picture with the ride's 60 degree view

/** For a shader of your own (the birds'): `float sunlit = skySunlit(worldY);` is 0 below the sunline and 1 above it. */
export const SUNLINE_GLSL = /* glsl */`
  uniform vec4 uSunline;         // height of the sunline (m), the height it is eased over (m), how strong first light is (0..1), the dawn's progress e (0..1)
  float skySunlit(float y) { return smoothstep(uSunline.x - 0.5 * uSunline.y, uSunline.x + 0.5 * uSunline.y, y) * uSunline.z; }
`;

const PARS = /* glsl */`
  ${SUNLINE_GLSL}
  uniform vec3 uSkyAmb, uGroundAmb, uAurKey, uAurDir, uSunKey, uSunDir; uniform float uBedLight, uKeyRim; uniform vec3 uKeyFrom;
  uniform vec3 uFillAmb, uFootLight, uRimLight, uAerial; uniform vec4 uNightFar, uFootRim;
  uniform vec3 uRimAur, uBedStar; uniform vec4 uBedPool;      // (things under the surface, bed: true) the stars' own white light on pale sand; the bow lantern's pool: metres, gain, paleness
  float skyStep(float w) { return mix(w, floor(w * 3.0) / 3.0 + smoothstep(0.42, 0.58, fract(w * 3.0)) / 3.0, 0.85); }
`;
// (inside gouache's main(): albedo, N, V, shade, ambient, lamps, stroke and c are there to read)
const LIGHT = /* glsl */`
  {
    vec3 keep = c - albedo * mix(vec3(1.0), shade, uShade) - albedo * ambient - albedo * lamps;      // what the material added by itself (water-light, rim, backlight)
    float sDist = length(vViewPos);
    // THE NIGHT'S DEPTH. The false dawn's glow is the light of the near things; it dies with distance, and what is far
    // keeps only starlight: a far heap of salt is a paler darkness on the sky, not a pale shape (uNightFar: from, to, the share left)
    float farK = mix(1.0, uNightFar.z, smoothstep(uNightFar.x, uNightFar.y, sDist));
    vec3 amb = (mix(uGroundAmb, uSkyAmb, N.y * 0.5 + 0.5) + uFillAmb * farK) * SKY_AMB;
    #ifdef SKY_BED
      // UNDER THE SURFACE (bed: true), by night. The sky's light on built things is a deep cobalt (it makes chalk the colour
      // of the low sky); on pale sand a hand under the water that alone is one electric blue from the hull to the mirror.
      // What lights the sand is the stars' own light, which is white: a breath of it (uBedStar) and the sand is a slate
      // blue with periwinkle crests. And the bow lantern's light POOLS: the ride's lantern is even over two metres and
      // dies at seven; on the bed it also has a pale core under the lantern itself that dies in a couple of metres, so
      // the sand is palest and warmest beside the bow and the light is seen to fall away. (Added to the ride's light,
      // never taken from it: other modules subtract a share of the ride's own lantern from things of theirs.)
      amb += uBedStar;
      { vec3 bl = uLanternPos - vWPos; lamps += mix(uLanternColor, vec3(dot(uLanternColor, vec3(0.3, 0.5, 0.2))), uBedPool.z) * (uBedPool.y * exp(-dot(bl, bl) / (uBedPool.x * uBedPool.x))); }
    #endif
    // LIGHT POOLS AT THE FOOT OF THINGS and dies upward: what the lake gives back to whatever stands in it (the Milky Way's
    // twin by night, the glitter at first light), on faces that look down at the water or along it (uFootRim.x: metres it dies over)
    // (second pass: a face that looks at the SKY takes next to none of it. It took a third, and behind the wind the lake's apricot
    // lay on every level thing: the crust terraces, the pan rims and the bed itself were a pink milk at first light)
    amb += uFootLight * (exp(-max(vWPos.y, 0.0) / uFootRim.x) * (0.06 + 0.94 * clamp(0.95 - N.y, 0.0, 1.0)) * SKY_AMB);
    float wa = skyStep(clamp(dot(N, uAurDir) * 0.5 + 0.5 + stroke * 0.10 * uBrush, 0.0, 1.0));
    float ws = skyStep(clamp(dot(N, uSunDir) * 0.5 + 0.5 + stroke * 0.10 * uBrush, 0.0, 1.0));
    float rim = mix(uKeyRim, 1.0, pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 1.6));      // the false dawn is a rim: strongest where a lit face turns away from the eye
    vec3 key = uAurKey * smoothstep(uKeyFrom.x, 1.0, wa) * rim * mix(1.0, uNightFar.w, smoothstep(uNightFar.x, uNightFar.y, sDist)) + uSunKey * smoothstep(uKeyFrom.y, uKeyFrom.z, ws) * skySunlit(vWPos.y);
    c = albedo * (amb + key + lamps) + keep;
    // AGAINST FIRST LIGHT a thing is edged with it: a thin rim on forms that stand between the eye and the east
    // (uFootRim.y: how sharp; .z: how much it needs the eye to look toward the light)
    // (second pass) and AGAINST THE FALSE DAWN the same: whatever stands between the eye and the north is edged with jade, and
    // level salt seen at a glance gives the curtain back (the page: "the rim it puts on salt, stakes, hull and birds". The key
    // above lights only faces turned to the north, and from the channel the rider sees the south side of everything on the
    // north causeway: plain blue shapes in front of the aurora). Not on things under the surface, neither rim.
    #ifndef SKY_BED
    { float edge = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), uFootRim.y);
      c += uRimLight * (edge * mix(1.0, smoothstep(-0.2, 0.7, -dot(V, uSunDir)), uFootRim.z) * (0.3 + 0.7 * albedo));
      c += uRimAur * (edge * smoothstep(-0.1, 0.75, -dot(V, normalize(vec3(uAurDir.x, 0.0, uAurDir.z)))) * (0.3 + 0.7 * albedo) * mix(1.0, 0.12, smoothstep(uNightFar.x, uNightFar.y, sDist))); }      // (it dies with distance as the glow does: the far ridge keeps no outline)
    #endif
  }
`;

// FAR THINGS TAKE THE AIR'S COLOUR. By night the air between the eye and a far thing is the low sky's own blue, and there is
// more of it than the ride's fog knows: beyond uAerial.x metres a built thing goes toward the fog's colour, by uAerial.z
// of the way at uAerial.y. So the far rows, the hut and the white ridge are the sky's colour a shade paler, layer behind
// layer, and never a pale shape cut out of the night. First light takes it away (set.js).
const AERIAL = 'fog = max(fog, uAerial.z * smoothstep(uAerial.x, uAerial.y, dist));';
// ---- THE SALT, THE TIMBER, THE WATERLINE: what a thing is painted with, before any light falls on it (the header says how to ask)
const DRESS_PARS = /* glsl */`
  uniform sampler2D tSalt, tCrust, tTimber; uniform vec3 uTimberB;
  uniform vec4 uSaltMix, uSaltA, uSaltB, uSaltC, uWaterline; uniform vec3 uSaltHollow, uSaltChalk, uWetTint, uTimberA;
  // how the paint is laid from three sides. level = 1: its strokes are LEVEL on every face that is not nearly flat (a furrow
  // raked across a slope follows the slope's contour, it does not run down it); level = 0: the plain three sides.
  vec3 dressSides(vec3 n, float level) {
    vec3 a = pow(abs(n), vec3(4.0)); a /= (a.x + a.y + a.z);
    float flatness = smoothstep(0.88, 0.97, abs(n.y)); vec2 s = vec2(n.x * n.x, n.z * n.z); s /= max(s.x + s.y, 1e-4);
    return mix(a, vec3(s.x * (1.0 - flatness), flatness, s.y * (1.0 - flatness)), level);
  }
  // the height of the paint (0 in a hollow .. 1 on a crest) of the four swatches at p: raked, old, crust lobes, crust pan
  vec4 saltAt(vec3 p, vec3 bw) {
    vec4 h = vec4(texture2D(tSalt, p.zy).rgb * bw.x + texture2D(tSalt, p.xz).rgb * bw.y + texture2D(tSalt, p.xy).rgb * bw.z, 0.5);
    #ifdef SKY_SALT_PAN
      h.a = texture2D(tCrust, p.zy).r * bw.x + texture2D(tCrust, p.xz).r * bw.y + texture2D(tCrust, p.xy).r * bw.z;
    #endif
    return h;
  }
  float dressHash(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
  float gSaltW = 0.0;                                         // how much of this pixel is salt (the glints ask)
`;
const DRESS_ALBEDO = /* glsl */`
  {
    float dDist = max(length(vViewPos), 0.5);
    #ifdef USE_COLOR
      float dPale = dot(uColor * vColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    #else
      float dPale = dot(uColor, vec3(0.2126, 0.7152, 0.0722));
    #endif
    float saltW = 0.0, timberW = 0.0;
    #ifdef SKY_SALT
      saltW = 1.0;
    #endif
    #ifdef SKY_TIMBER
      timberW = 1.0;
    #endif
    #if defined(SKY_SALT) && defined(SKY_TIMBER)
      saltW = smoothstep(0.36, 0.52, dPale); timberW = 1.0 - saltW;      // the paint's own paleness decides: chalk is salt, the rest timber
    #endif
    #ifdef SKY_SALT
    {
      vec3 bw = dressSides(N, uSaltB.y);
      // nearer than uSaltA.y the paint is its true size; further off the same strokes are drawn broader, octave by octave
      float lod = max(log2(dDist / uSaltA.y), 0.0), l0 = floor(lod), k0 = uSaltA.x * exp2(-l0);
      // (each octave keeps its own place as the boat comes nearer: the two that are mixed change over, never jump)
      vec4 hA = saltAt(vWPos * k0 + 0.37 * mod(l0, 2.0), bw), hB = saltAt(vWPos * (k0 * 0.5) + 0.37 * mod(l0 + 1.0, 2.0), bw);
      float h = mix(dot(hA, uSaltMix), dot(hB, uSaltMix), smoothstep(0.2, 0.8, lod - l0));
      vec3 slow = texture2D(tCrust, vWPos.xz * 0.011 + 0.21).rgb;
      // strata: faint level bands of older seasons, sagging a little with the heap
      float sy = (vWPos.y + 2.2 * (slow.b - 0.5)) * 0.045, band = texture2D(tCrust, vec2(0.37, sy)).b;
      h -= uSaltC.x * (smoothstep(0.52, 0.66, band) * (1.0 - smoothstep(0.66, 0.74, band))) * 0.8;
      h = clamp(h, 0.0, 1.0);
      vec3 tint = mix(uSaltHollow, vec3(1.0), h) * uSaltA.w;                       // lilac in the hollow, chalk (and a shade over) on the crest
      tint *= 1.0 - uSaltC.y * 0.3 * smoothstep(0.45, 0.8, texture2D(tCrust, vWPos.xz * 0.043 + vWPos.y * 0.017).b);      // a grey dusting in slow patches
      albedo *= mix(vec3(1.0), tint, uSaltA.z * saltW);
      gSaltW = saltW;
    }
    #endif
    #ifdef SKY_TIMBER
    {
      vec3 bw = pow(abs(N), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
      // the grain: the ride's dry-brush tile drawn out long, down every upright face and along the route on every level one
      float g = texture2D(tBrush, vec2(vWPos.z * 1.9, vWPos.y * 0.2)).r * bw.x + texture2D(tBrush, vec2(vWPos.x * 1.9, vWPos.y * 0.2)).r * bw.z + texture2D(tBrush, vec2(vWPos.x * 1.9, vWPos.z * 0.2)).r * bw.y;
      float gk = clamp((g - 0.52) * 6.0, -1.0, 1.0);
      albedo *= 1.0 + uTimberA.x * gk * timberW;                                   // checks, and paler ridges between them
      // (second pass) the landing's timber tile, which exists since the evening of the 7th (assets/art/landing/timber.webp:
      // a NEUTRAL layer, its mean a half in every channel, so a thing keeps the colour it was painted): the figure of
      // weathered boards, their checks and the weep under a nail, laid as the strokes are (its grain down every upright
      // face, along the route on every level one). The page's item 8; uTimberB = 1 / across, 1 / along, how strongly.
      if (uTimberB.z > 0.0) {
        vec3 tw = texture2D(tTimber, vWPos.zy * uTimberB.xy).rgb * bw.x + texture2D(tTimber, vWPos.xy * uTimberB.xy).rgb * bw.z + texture2D(tTimber, vWPos.xz * uTimberB.xy).rgb * bw.y;
        albedo *= mix(vec3(1.0), tw * 2.0, uTimberB.z * timberW);
      }
      float bloom = smoothstep(0.25, 1.0, gk + uTimberA.z * max(N.y, 0.0)) * uTimberA.y;      // salt in the grain, more of it on what looks at the sky
      albedo = mix(albedo, uSaltChalk * 0.9, bloom * timberW);
    }
    #endif
    #ifdef SKY_WATERLINE
    {
      // where the thing stands in the lake: a dark wet band, ragged, and a white dry line of crust above it
      float wn = texture2D(tBrush, vWPos.xz * 2.3 + vWPos.y * 0.37).r;            // about 0.42 .. 0.62
      float wy = vWPos.y + (wn - 0.52) * uWaterline.z;
      float wet = 1.0 - smoothstep(uWaterline.x * 0.7, uWaterline.x, wy);
      float dry = smoothstep(uWaterline.x * 0.75, uWaterline.x * 1.05, wy) * (1.0 - smoothstep(uWaterline.x * 1.35, uWaterline.y, wy));
      albedo *= mix(vec3(1.0), uWetTint, wet);
      albedo = mix(albedo, uSaltChalk * 0.95, dry * uWaterline.w * (1.0 - 0.7 * saltW));
    }
    #endif
  }
`;
// (after the area's light: `glow` is light the thing gives off, added after everything and fogged with it)
const DRESS_LIGHT = /* glsl */`
  #ifdef SKY_GLINTS
  {
    // "A few glints": by night a salt crystal here and there catches a star. Cells that grow with the distance, so that
    // there are as many of them on a patch of the picture near and far; one cell in many holds a crystal; each comes
    // and goes slowly as the boat moves and as the star it holds scintillates. Gone as first light comes.
    float gd = max(length(vViewPos), 1.0), lv = log2(gd), g0 = floor(lv), gf = lv - g0, lit = 0.0;
    for (int i = 0; i < 2; i++) {
      float cell = uSaltB.z * exp2(g0 + float(i)), wgt = i == 0 ? 1.0 - gf : gf;
      vec3 q = vWPos / cell, id = floor(q), f = fract(q) - 0.5;
      float r1 = dressHash(id), r2 = dressHash(id + 17.3), r3 = dressHash(id + 41.7);
      float on = step(1.0 - uSaltB.w, r1);
      float spot = 1.0 - smoothstep(0.02, 0.11, length(f - 0.5 * (vec3(r2, r3, fract(r1 * 57.0)) - 0.5)));
      lit += on * wgt * spot * (0.55 + 0.45 * sin(uTime * (1.2 + 1.6 * r2) + r3 * 40.0));
    }
    glow += vec3(0.86, 0.91, 1.0) * (lit * uSaltB.x * gSaltW * (1.0 - smoothstep(uSaltC.z, uSaltC.w, uSunline.w)));
  }
  #endif
`;

export function makeSkyLight(ctx, plan) {
  const { kit, engine } = ctx, P = plan, sh = engine.shared;
  const col = (c) => new THREE.Color(c);
  const U = {
    uSunline: { value: new THREE.Vector4(400, P.sunlineSoft, 0, 0) },
    uSkyAmb: { value: col(P.light.star.sky) }, uGroundAmb: { value: col(P.light.star.ground) },
    uAurKey: { value: new THREE.Color(0, 0, 0) }, uAurDir: { value: new THREE.Vector3(-Math.cos(P.light.aurora.elevation * Math.PI / 180), Math.sin(P.light.aurora.elevation * Math.PI / 180), 0) },
    uSunKey: { value: new THREE.Color(0, 0, 0) }, uSunDir: { value: new THREE.Vector3(0, Math.sin(P.light.sun.elevation * Math.PI / 180), -Math.cos(P.light.sun.elevation * Math.PI / 180)) },
    uBedLight: { value: 0 }, uKeyRim: { value: P.light.aurora.rim }, uKeyFrom: { value: new THREE.Vector3(P.light.aurora.from, P.light.sun.from, P.light.sun.to) },      // how far a face must be turned toward each key before it takes any (and, for first light, all of it)
    // (stage 2d) the false dawn's glow apart from the sky's light (it dies with distance: uNightFar = from, to, the share of the
    // glow left far off, the share of its rim left); what the lake gives back at the foot of things; the rim against first
    // light. set.js sets the three colours every frame; the numbers are plan.light.depth / foot / rim.
    uFillAmb: { value: new THREE.Color(0, 0, 0) }, uFootLight: { value: new THREE.Color(0, 0, 0) }, uRimLight: { value: new THREE.Color(0, 0, 0) },
    uNightFar: { value: new THREE.Vector4(...((P.light.depth || {}).fill || [30, 150, 0.25]), (P.light.depth || {}).rim ?? 0.6) },
    uAerial: { value: new THREE.Vector3(...((P.light.depth || {}).aerial || [28, 160, 0.7])) },      // (set.js eases the third away with the dawn)
    uFootRim: { value: new THREE.Vector4((P.light.foot || {}).over ?? 0.9, (P.light.rim || {}).power ?? 3, (P.light.rim || {}).toward ?? 1, 0) },
    // (things under the surface: set.js sets both every frame from plan.lakeBed.starlight and .pool; nothing until then)
    uBedStar: { value: new THREE.Color(0, 0, 0) }, uBedPool: { value: new THREE.Vector4(2.2, 0, 0.45, 0) }, uRimAur: { value: new THREE.Color(0, 0, 0) },      // (uRimAur: the rim against the false dawn; set.js, plan.light.rim.aurora)
    // per pass (set in onBeforeRender): pixels per radian of the picture being drawn; extra softness (pixels squared) the
    // direct view takes on to match the mirror; 1 in the direct views and 0 in the mirror; the picture's height in pixels
    uPass: { value: new THREE.Vector4(REF_PX_PER_RAD, 0, 1, 900) },
    uPassSize: { value: new THREE.Vector2(1600, 900) },
  };
  const extension = (amb = '1.0') => ({ defines: { SKY_AMB: amb, ...(amb !== '1.0' ? { SKY_BED: '' } : {}) }, uniforms: U, fragmentPars: PARS, light: LIGHT, fog: AERIAL });
  // ---- THE SALT, THE TIMBER, THE WATERLINE (the header says how to ask). set.js loads the two pictures and puts them in
  // `tiles`; until they arrive a flat mid grey stands in (a thing is then plain chalk a shade lilac, never black).
  const flatTile = new THREE.DataTexture(new Uint8Array([140, 140, 140, 255]), 1, 1); flatTile.needsUpdate = true;
  const halfTile = new THREE.DataTexture(new Uint8Array([188, 188, 188, 255]), 1, 1); halfTile.colorSpace = THREE.SRGBColorSpace; halfTile.needsUpdate = true;      // (a half in linear light: the timber tile's own mean, so nothing changes until it arrives)
  const tiles = { tSalt: { value: flatTile }, tCrust: { value: flatTile }, tTimber: { value: halfTile } };
  const SP = P.salt || {}, TP = P.timberPaint || {}, WP = P.waterline || {}, C0 = P.colors;
  const KINDS = { raked: [1, 0, 0, 0], old: [0, 1, 0, 0], crust: [0, 0, 1, 0], pan: [0, 0, 0, 1] };
  const chalk = col(C0.chalk), hollow = col(SP.hollow || '#8E86B0');
  const dressShared = { uSaltHollow: { value: new THREE.Vector3(hollow.r / chalk.r, hollow.g / chalk.g, hollow.b / chalk.b) }, uSaltChalk: { value: chalk } };
  /** The extension that paints a thing as salt, as timber, or both, with or without a waterline; null if none is asked. */
  const dress = (o) => {
    if (!o || (!o.salt && !o.timber && !o.waterline)) return null;
    const defines = {}, uniforms = { ...tiles, ...dressShared };
    const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
    if (o.salt) {
      const s = obj(o.salt), kind = s.kind ?? (typeof o.salt === 'string' || Array.isArray(o.salt) ? o.salt : 'raked');
      const mix = Array.isArray(kind) ? [kind[0] || 0, kind[1] || 0, kind[2] || 0, kind[3] || 0] : (KINDS[kind] || KINDS.raked);
      const sum = Math.max(1e-4, mix[0] + mix[1] + mix[2] + mix[3]), w = mix.map((v) => v / sum);
      const T0 = SP.tile || {}, tile = s.tile ?? (w[0] * (T0.raked ?? 1.8) + w[1] * (T0.old ?? 3.4) + w[2] * (T0.crust ?? 0.55) + w[3] * (T0.pan ?? 1.3));
      const strength = s.strength ?? SP.strength ?? 0.8, lift = SP.lift ?? 0.5, G = SP.glints || {};
      // (the hollows darken the paint by about a third of the way to lilac in sum; `lift` gives that share of it back on the crests)
      const crest = 1 / (1 - lift * 0.31 * strength), old = w[1], level = w[0] + w[1];
      const glints = s.glints ?? (G.level ?? 0.55);
      defines.SKY_SALT = '';
      if (w[3] > 0) defines.SKY_SALT_PAN = '';
      if (glints > 0) defines.SKY_GLINTS = '';
      uniforms.uSaltMix = { value: new THREE.Vector4(w[0], w[1], w[2], w[3]) };
      uniforms.uSaltA = { value: new THREE.Vector4(1 / tile, s.trueWithin ?? SP.trueWithin ?? 9, strength, crest) };
      uniforms.uSaltB = { value: new THREE.Vector4(glints, level > 0.5 ? 1 : 0, G.cell ?? 0.02, 1 / (G.one ?? 70)) };
      uniforms.uSaltC = { value: new THREE.Vector4(s.strata ?? (SP.strata ?? 0.5) * old, s.dusting ?? (SP.dusting ?? 0.3) * old, (G.until || [0.08, 0.35])[0], (G.until || [0.08, 0.35])[1]) };
    }
    if (o.timber) {
      const t = obj(o.timber);
      defines.SKY_TIMBER = '';
      uniforms.uTimberA = { value: new THREE.Vector3(t.grain ?? TP.grain ?? 0.2, t.bloom ?? TP.bloom ?? 0.3, TP.bloomUp ?? 0.5) };
      { const TT = TP.tile || {}; uniforms.uTimberB = { value: new THREE.Vector3(1 / (TT.across ?? 1.1), 1 / (TT.along ?? 1.6), t.figure ?? TT.strength ?? 0) }; }
    }
    if (o.waterline) {
      const l = obj(o.waterline), wet = col(o.timber || !o.salt ? (WP.timberWet || '#9088A0') : (WP.saltWet || '#D9C2C4'));
      defines.SKY_WATERLINE = '';
      uniforms.uWaterline = { value: new THREE.Vector4(l.wet ?? WP.wet ?? 0.11, l.crust ?? WP.crust ?? 0.24, WP.ragged ?? 0.2, WP.crustGain ?? 0.7) };
      uniforms.uWetTint = { value: new THREE.Vector3(1, 1, 1).lerp(new THREE.Vector3(wet.r, wet.g, wet.b), WP.wetGain ?? 0.55) };
    }
    return { defines, uniforms, fragmentPars: DRESS_PARS, albedo: DRESS_ALBEDO, light: DRESS_LIGHT };
  };
  // ---- the night air (see the header): two rules, each [all there within, nothing beyond] and whether its air is open
  // (the fourth number: by night a FAR thing is at most this much there beyond the distances in uGhost, a ghost the stars
  // show through, however near the rule's own distances put it: plan.air.ghost; set.js eases it to 1 with first light)
  const A = P.air, airU = { near: { value: new THREE.Vector4(A.star[0], A.star[1], 0, 1) }, far: { value: new THREE.Vector4(A.star[0], A.star[1], 0, 1) } };
  const ghostU = { value: new THREE.Vector2(...((A.ghost || {}).over || [50, 130])) };
  const airMats = { near: [], far: [] }, airOpen = { near: false, far: false };
  // (a pixel that marks itself for the painter's filter, `crisp`, carries a mark in its alpha and not an opacity: -15. While
  // the rule's air is open the thing is opaque and keeps its mark; while it is closed it is blended, and takes the air's
  // alpha instead. Before this a crisp thing in the night air was discarded whole, every pixel of it.)
  const AIR_PARS = 'uniform vec4 uAir; uniform vec2 uGhost;', AIR_FINAL = '{ float airA = (1.0 - smoothstep(uAir.x, uAir.y, dist)) * mix(1.0, uAir.w, smoothstep(uGhost.x, uGhost.y, dist)); if (airA < 0.004) discard; gl_FragColor.a = gl_FragColor.a < 0.0 ? mix(airA, gl_FragColor.a, step(0.5, uAir.z)) : gl_FragColor.a * airA; }';
  const airExt = (rule) => ({ uniforms: { uAir: airU[rule], uGhost: ghostU }, fragmentPars: AIR_PARS, final: AIR_FINAL });
  const airRule = (o) => (o.air === false || o.bed ? null : o.air === 'far' ? 'far' : 'near');
  const enrol = (m, rule) => { m.userData.air = rule; m.transparent = !airOpen[rule]; airMats[rule].push(m); return m; };
  /** set.js, every frame: within `near` metres a thing of this rule is all there, beyond `far` there is nothing. */
  const setAir = (rule, near, far, ghost = 1) => {
    // (the last stretch is taken in one step: once a rule's air reaches 0.85 of open it IS open, and its materials are opaque
    // in the same frame. Other modules write the painter's mark, -15, into alpha when they see the air open, each by a
    // threshold of its own (900 m, 999 m); while the air crept from 880 to 1000 m a material could be told "open" and
    // still be blended, and a blended -15 is a white flare: the works flashed five seconds into the false dawn.)
    if (near >= 0.85 * A.open[0]) { near = A.open[0]; far = A.open[1]; }
    const open = near >= A.open[0] - 1;
    airU[rule].value.set(near, far, open ? 1 : 0, open ? 1 : ghost);
    if (open !== airOpen[rule]) { airOpen[rule] = open; for (const m of airMats[rule]) m.transparent = !open; }
  };
  // What is wholly beyond the air is not drawn at all: every separate object costs three draws a frame (the picture,
  // the mirror, the scene without the water), and in the first act that is every piece of the works for nothing.
  // set.js calls this every frame with the eye's place. Only things this hid are shown again (userData.airHidden).
  let culled = null, culledFor = -1;
  const _box = new THREE.Box3();
  const cullAir = (eye) => {
    const count = airMats.near.length + airMats.far.length;
    if (!culled || culledFor !== count) {                        // (again whenever something new has been enrolled: a model that arrived late)
      culled = []; culledFor = count;
      ctx.group.updateMatrixWorld(true);
      ctx.group.traverse((o) => {
        const m = o.material && !Array.isArray(o.material) ? o.material : null;
        if (!m || !m.userData || !m.userData.air || !(o.isMesh || o.isPoints)) return;
        // (its box, not its sphere: the flock is one mesh 180 m across, and a sphere round that reaches the first image)
        if (o.isInstancedMesh) { if (!o.boundingBox) o.computeBoundingBox(); _box.copy(o.boundingBox); }
        else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); _box.copy(o.geometry.boundingBox); }
        culled.push({ o, rule: m.userData.air, box: _box.clone().applyMatrix4(o.matrixWorld) });
      });
    }
    for (const k of culled) {
      const far = airU[k.rule].value.y, hide = !airOpen[k.rule] && k.box.distanceToPoint(eye) > far;
      if (hide && k.o.visible) { k.o.visible = false; k.o.userData.airHidden = true; }
      else if (!hide && k.o.userData.airHidden) { k.o.visible = true; k.o.userData.airHidden = false; }
    }
  };
  /** As an `extend` for kit.model / kit.models / kit.animated; then sky.adopt(model, { air }) enrols what was loaded. */
  const extend = (opts = {}) => { const rule = airRule(opts), d = dress(opts); return [extension(opts.bed ? 'uBedLight' : '1.0'), ...(d ? [d] : []), ...(rule ? [airExt(rule)] : [])]; };
  const paint = (o = {}) => {
    const { bed, air, salt, timber, waterline, extend: more, ...rest } = o, rule = airRule(o), d = dress(o);
    if (rest.color === undefined && !rest.vertexColors) { if (timber && !salt) rest.color = C0.timber; else if (salt) rest.color = C0.chalk; }      // (a thing asked for as timber or as salt and given no colour takes the page's)
    const m = kit.gouache({ ...rest, extend: [extension(bed ? 'uBedLight' : '1.0'), ...(d ? [d] : []), ...(rule ? [airExt(rule)] : []), ...[].concat(more || [])] });
    return rule ? enrol(m, rule) : m;
  };
  // a thing already dressed in gouache (the engine's lamp post, a loaded model): give its materials the area's light, in
  // place, and (opts.air: 'near' | 'far') put them under the night air. The engine's lamps take the light and no air.
  // (opts.salt / timber / waterline dress a thing that was loaded without them: the same options as paint and extend)
  const adopt = (object, opts = {}) => {
    const rule = opts.air ? airRule(opts) : null, d = dress(opts);
    object.traverse((o) => {
      for (const m of [].concat(o.material || [])) {
        if (!m || !m.isGouache || !m.fragmentShader.includes('//@light')) continue;
        if (!m.userData.skyLight && !m.fragmentShader.includes('uSkyAmb')) {
          m.fragmentShader = m.fragmentShader.replace('//@fragmentPars', `${PARS}\n    //@fragmentPars`).replace('//@light', `${LIGHT}\n    //@light`).replace('//@fog', `${AERIAL}\n    //@fog`);
          Object.assign(m.uniforms, U); m.defines = { ...(m.defines || {}), SKY_AMB: '1.0' }; m.needsUpdate = true;
        }
        m.userData.skyLight = true;
        if (d && !m.fragmentShader.includes('uniform sampler2D tSalt')) {
          m.fragmentShader = m.fragmentShader.replace('//@fragmentPars', `${d.fragmentPars}\n    //@fragmentPars`).replace('//@albedo', `${d.albedo}\n    //@albedo`).replace('//@light', `${d.light}\n    //@light`);
          Object.assign(m.uniforms, d.uniforms); m.defines = { ...(m.defines || {}), ...d.defines }; m.needsUpdate = true;
        }
        if (rule && !m.userData.air) {
          if (!m.fragmentShader.includes('uniform vec4 uAir;')) { m.fragmentShader = m.fragmentShader.replace('//@fragmentPars', `${AIR_PARS}\n    //@fragmentPars`).replace('//@final', `${AIR_FINAL}\n    //@final`); m.needsUpdate = true; }
          m.uniforms.uAir = airU[rule]; m.uniforms.uGhost = ghostU; enrol(m, rule);
        }
      }
    });
    return object;
  };
  const skyStandIn = (o) => {
    const m = standIn(ctx, o);
    m.material.dispose();
    m.material = paint({ color: o.color || '#8a8494', emissive: o.emissive || '#000000', emissiveIntensity: o.emissiveIntensity ?? 1, brush: 0.5, ...(o.paint || {}) });
    return m;
  };

  // Light is ADDED to the picture, and the picture's alpha is left as it was: the sky marks itself there as something the
  // painter's filter must leave alone (set.js, "the crisp sky"), and a star laid over it must not rub the mark out.
  const ADD = { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor };

  // ------------------------------------------------------------------------------------------ what pass is being drawn
  // Point and line sizes are in pixels of whatever is being drawn into: the picture, or the smaller picture the water
  // mirrors. In the direct views a dab is drawn softer by what the mirror's coarser pixels and its reading-back add.
  const size2 = new THREE.Vector2();
  let mirrorPxPerRad = 0;
  const tune = { blur: 1.0 };                                    // how much of the computed softening is applied (looked at: 1 matches)
  const pass = (renderer, camera, material) => {
    const rt = renderer.getRenderTarget(), w = rt ? rt.width : renderer.getDrawingBufferSize(size2).x, h = rt ? rt.height : renderer.getDrawingBufferSize(size2).y;
    const pxPerRad = h * 0.5 * camera.projectionMatrix.elements[5];
    let extra = 0;
    if (engine.reflecting) mirrorPxPerRad = pxPerRad;
    else if (mirrorPxPerRad > 0) { const k = pxPerRad / mirrorPxPerRad; extra = Math.max(0, k * k / 4 - 1 / 12) * tune.blur; }      // a mirror pixel is k of ours: its box (k*k/12) and the tent it is read back through (k*k/6), less our own box
    U.uPass.value.set(pxPerRad, extra, engine.reflecting ? 0 : 1, h); U.uPassSize.value.set(w, h);
    material.uniformsNeedUpdate = true;
  };

  // ------------------------------------------------------------------------------------------ points of light
  /**
   * Points of light in one draw: soft round dabs, no flares.
   *   list: [{ x, y, z,                 where (the realm's own metres); or dir: [x, y, z] for a star on the dome
   *            size,                    its width (full width at half its light): pixels at 900 lines (opts.metres: metres)
   *            light,                   how bright its middle is (above 1 it blooms)
   *            color,                   its tint (default opts.color)
   *            halo,                    a wide soft skirt as well: 1 = the forty brightest stars (twice the width, a tenth of the light); 2 = a pool of light (four times, a fifth)
   *            phase, rate, rank,       scintillation: phase 0..1, cycles a second; rank 0 (the faintest) .. 1 (they go out in that order at dawn)
   *            t0 }]                    a time of its own (the lights on the bed: when it lifts)
   *   opts: sky (true: the list is directions on the dome, drawn behind everything), metres (sizes are metres; maxPx: never wider than this on the picture),
   *         twinkle 0..1, fog 0..1 (how much of the realm's fog it takes: 0 for things of the sky), after (true: drawn
   *         after the water, for lights on or under it), extend: { uniforms, pars, vertex, fragment } (GLSL of your own:
   *         `vertex` may change p (world position), light (float), tint (vec3); `fragment` may change a and c)
   * Returns { points, material, geometry, set(i, x, y, z), setLight(i, v), count }.
   */
  const dabs = (list, o = {}) => {
    const n = list.length, pos = new Float32Array(n * 3), a = new Float32Array(n * 4), b = new Float32Array(n * 4), tints = new Float32Array(n * 3), base = col(o.color || P.colors.starWhite), c = new THREE.Color();
    const rnd = ctx.rng(o.seed || 911);
    list.forEach((s, i) => {
      if (s.dir) pos.set(s.dir, i * 3); else pos.set([s.x, s.y, s.z], i * 3);
      a.set([s.size ?? 2.2, s.light ?? 1, s.halo ?? 0, s.rank ?? rnd()], i * 4);
      b.set([s.phase ?? rnd(), s.rate ?? 0.3, s.t0 ?? 0, s.tintTo ?? 0], i * 4);
      if (s.color) c.set(s.color); else c.copy(base);
      tints.set([c.r, c.g, c.b], i * 3);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aDab', new THREE.BufferAttribute(a, 4)); geo.setAttribute('aDabB', new THREE.BufferAttribute(b, 4)); geo.setAttribute('aTint', new THREE.BufferAttribute(tints, 3));
    const ex = o.extend || {};
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...U, uTime: sh.uTime, uVeil: sh.uVeil, uFogDensity: sh.uFogDensity, uTwinkle: { value: o.twinkle ?? 0 }, uFog: { value: o.fog ?? 0 }, uGain: { value: o.gain ?? 1 }, uFade: { value: new THREE.Vector2(...(o.fade || [2, 3])) },
        uLow: { value: new THREE.Vector2(Math.sin((o.low ?? -90) * Math.PI / 180), o.veilTear ?? 0) }, ...(ex.uniforms || {}) },
      transparent: true, depthWrite: false, depthTest: true, ...ADD, fog: false,
      vertexShader: /* glsl */`
        attribute vec4 aDab, aDabB; attribute vec3 aTint;
        uniform vec4 uPass, uSunline; uniform vec2 uFade, uLow; uniform float uTime, uTwinkle, uVeil, uFogDensity, uFog, uGain;
        varying vec3 vCol; varying vec4 vShape;
        ${ex.pars || ''}
        void main() {
          vec3 p = position; float light = aDab.y; vec3 tint = aTint;
          ${ex.vertex || ''}
          ${o.sky ? /* glsl */`
          vec4 clip = projectionMatrix * viewMatrix * vec4(p * 900.0 + cameraPosition, 1.0); gl_Position = clip.xyww;
          float dist = 1.0e6, up = p.y;` : /* glsl */`
          vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
          float dist = length(mv.xyz), up = (p.y - cameraPosition.y) / max(dist, 1e-3);`}
          // width: full width at half light -> sigma, in the pixels of this pass
          float fwhm = ${o.metres ? 'aDab.x * uPass.x / max(dist, 0.3)' : 'aDab.x * uPass.x / ' + REF_PX_PER_RAD.toFixed(2)};
          ${o.maxPx ? 'fwhm = min(fwhm, ' + Number(o.maxPx).toFixed(1) + ' * uPass.x / ' + REF_PX_PER_RAD.toFixed(2) + ');' : ''}
          float st = fwhm / 2.355, s0 = max(st, 0.35), s2 = s0 * s0 + uPass.y;
          light *= min(1.0, st * st / 0.1225) * s0 * s0 / s2;                // too small to draw: fainter, never a hard bright dot; softer, and no brighter in sum
          // scintillation; and at dawn the faintest go first
          light *= 1.0 + uTwinkle * sin(6.2831853 * (aDabB.y * uTime + aDabB.x));
          float span = uFade.y - uFade.x, lo = uFade.x + aDab.w * 0.6 * span;
          light *= 1.0 - smoothstep(lo, lo + 0.4 * span, uSunline.w);
          // the air: fog for things of the lake, the veil for everything (it tears from the top down for things of the sky)
          light *= 1.0 - uFog * (1.0 - exp(-uFogDensity * uFogDensity * dist * dist));
          light *= 1.0 - clamp(uVeil - uLow.y * clamp(up, 0.0, 1.0) * (1.0 - uVeil), 0.0, 1.0);
          light *= smoothstep(uLow.x, uLow.x + 0.012, up);
          float halo = aDab.z, sh = s2 * (1.0 + 4.0 * halo * halo);                // the skirt's sigma squared
          float size = clamp(ceil(sqrt(sh) * (halo > 0.0 ? 4.6 : 7.0)) + 1.0, 3.0, 96.0);
          vCol = tint * light * uGain; vShape = vec4(size, 0.5 / s2, 0.5 / sh, halo);
          gl_PointSize = size;
          if (light * uGain < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vCol; varying vec4 vShape;
        ${ex.fragmentPars || ''}
        void main() {
          vec2 q = (gl_PointCoord - 0.5) * vShape.x; float r2 = dot(q, q);
          float a = exp(-r2 * vShape.y) + vShape.w * 0.1 * exp(-r2 * vShape.z);
          a *= 1.0 - smoothstep(0.4, 0.5, length(gl_PointCoord - 0.5));     // the sprite's own edge
          vec3 c = vCol * a;
          ${ex.fragment || ''}
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false; pts.renderOrder = o.sky ? -999 : (o.after === false ? -3 : 3);
    pts.onBeforeRender = (renderer, scene, camera) => pass(renderer, camera, mat);
    ctx.add(pts);
    return { points: pts, material: mat, geometry: geo, count: n,
      set(i, x, y, z) { geo.attributes.position.setXYZ(i, x, y, z); geo.attributes.position.needsUpdate = true; },
      setLight(i, v) { geo.attributes.aDab.setY(i, v); geo.attributes.aDab.needsUpdate = true; } };
  };

  // ------------------------------------------------------------------------------------------ hairlines of light
  /**
   * Straight hairs of light between pairs of points, in one draw (the constellations' lines): camera-facing strips,
   * never thinner than the picture can draw, soft-edged, the same in the water as in the air.
   *   segments: [{ a: [x, y, z], b: [x, y, z], light, width (pixels at 900 lines, default 1.6), color, t0 }]
   *   opts: short (the share of its length each end stops short of its star, default 0.02), fog, gain, color
   * Returns { mesh, material, geometry, set(i, a, b), setLight(i, v), count }; material.uniforms.uDraw (0..1) draws them in.
   */
  const hairlines = (segments, o = {}) => {
    const n = segments.length, A = new Float32Array(n * 3), B = new Float32Array(n * 3), D = new Float32Array(n * 4), base = col(o.color || P.colors.starWhite), c = new THREE.Color();
    const short = o.short ?? 0.02;
    segments.forEach((s, i) => {
      const ax = s.a[0] + (s.b[0] - s.a[0]) * short, ay = s.a[1] + (s.b[1] - s.a[1]) * short, az = s.a[2] + (s.b[2] - s.a[2]) * short;
      const bx = s.b[0] + (s.a[0] - s.b[0]) * short, by = s.b[1] + (s.a[1] - s.b[1]) * short, bz = s.b[2] + (s.a[2] - s.b[2]) * short;
      A.set([ax, ay, az], i * 3); B.set([bx, by, bz], i * 3);
      if (s.color) c.set(s.color); else c.copy(base);
      const l = s.light ?? 0.5; D.set([c.r * l, c.g * l, c.b * l, s.width ?? 1.6], i * 4);
    });
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 0, 1, 0, 1, 1, 0]), 3)); geo.setIndex([0, 1, 2, 2, 1, 3]);
    geo.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 3)); geo.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 3)); geo.setAttribute('aHair', new THREE.InstancedBufferAttribute(D, 4));
    geo.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...U, uVeil: sh.uVeil, uFogDensity: sh.uFogDensity, uFog: { value: o.fog ?? 0 }, uGain: { value: o.gain ?? 1 }, uDraw: { value: 1 }, uFade: { value: new THREE.Vector2(...(o.fade || [2, 3])) } },
      transparent: true, depthWrite: false, depthTest: true, ...ADD, fog: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec3 aA, aB; attribute vec4 aHair;
        uniform vec4 uPass, uSunline; uniform vec2 uPassSize, uFade; uniform float uVeil, uFogDensity, uFog, uGain, uDraw;
        varying vec3 vCol; varying vec2 vAcross;
        void main() {
          vec3 a = aA, b = mix(aA, aB, clamp(uDraw, 0.0, 1.0));              // a line draws itself in along its length
          vec4 va = viewMatrix * vec4(a, 1.0), vb = viewMatrix * vec4(b, 1.0);
          float near = 0.12;                                                   // keep both ends in front of the eye
          if (va.z > -near && vb.z < -near) va = mix(vb, va, (-near - vb.z) / (va.z - vb.z));
          if (vb.z > -near && va.z < -near) vb = mix(va, vb, (-near - va.z) / (vb.z - va.z));
          vec4 ca = projectionMatrix * va, cb = projectionMatrix * vb;
          vec2 dir = (cb.xy / max(cb.w, 1e-4) - ca.xy / max(ca.w, 1e-4)) * uPassSize;
          dir = dot(dir, dir) > 1e-8 ? normalize(dir) : vec2(1.0, 0.0);
          float s0 = max(aHair.w * uPass.x / ${REF_PX_PER_RAD.toFixed(2)} / 2.355, 0.4), s2 = s0 * s0 + uPass.y, halfW = sqrt(s2) * 2.6 + 0.5;
          vec4 mv = mix(va, vb, position.x), p = mix(ca, cb, position.x);
          p.xy += vec2(-dir.y, dir.x) * position.y * halfW * 2.0 / uPassSize * p.w;
          gl_Position = (va.z > -near && vb.z > -near) || uDraw <= 0.0 ? vec4(2.0, 2.0, 2.0, 1.0) : p;
          float dist = length(mv.xyz), light = s0 / sqrt(s2);                // softer across, and no brighter in sum
          light *= 1.0 - uFog * (1.0 - exp(-uFogDensity * uFogDensity * dist * dist));
          light *= (1.0 - uVeil) * (1.0 - smoothstep(uFade.x, uFade.y, uSunline.w));
          vCol = aHair.rgb * light * uGain; vAcross = vec2(position.y * halfW, 0.5 / s2);
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vCol; varying vec2 vAcross;
        void main() { gl_FragColor = vec4(vCol * exp(-vAcross.x * vAcross.x * vAcross.y), 1.0); }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false; mesh.renderOrder = 3;
    mesh.onBeforeRender = (renderer, scene, camera) => pass(renderer, camera, mat);
    ctx.add(mesh);
    return { mesh, material: mat, geometry: geo, count: n,
      set(i, a, b) { geo.attributes.aA.setXYZ(i, a[0], a[1], a[2]); geo.attributes.aB.setXYZ(i, b[0], b[1], b[2]); geo.attributes.aA.needsUpdate = true; geo.attributes.aB.needsUpdate = true; },
      setLight(i, v) { const h = geo.attributes.aHair; h.setXYZ(i, base.r * v, base.g * v, base.b * v); h.needsUpdate = true; } };
  };

  // kit.at(s, d, y) holds s inside the path: every place asked for beyond the path's last metre (s 322) comes back ON its
  // last metre. The white ridge, the pans, the far cones and the flock all run on to s 352 or 356, past the boat's last
  // water; placed with kit.at, the ridge was 86 m long with a cliff for its east end and everything beyond lay piled on
  // one line. sky.at is kit.at that runs straight on past either end of the path. Use it for anything that may lie beyond.
  const pathEnd = ctx.path.at(ctx.path.length), pathStart = ctx.path.at(0);
  const at = (s, d = 0, y = 0, target = new THREE.Vector3()) => {
    const L = ctx.path.length; kit.at(s, d, y, target);
    if (s > L) { target.x += pathEnd.tx * (s - L); target.z += pathEnd.tz * (s - L); }
    else if (s < 0) { target.x += pathStart.tx * s; target.z += pathStart.tz * s; }
    return target;
  };

  return { uniforms: U, extend, paint, adopt, setAir, cullAir, air: airU, ADD, standIn: skyStandIn, dabs, hairlines, pass, tune, REF_PX_PER_RAD, at,
    tiles,                                                       // { tSalt, tCrust, tTimber }: the salt's two pictures and the landing's timber tile as uniforms (set.js fills them)
    e: 0, aurora: 0, T: -1, wind: 0, sunlineY: 400, state: {} };
}
