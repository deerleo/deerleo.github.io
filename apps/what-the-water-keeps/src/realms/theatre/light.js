// The theatre of leaves: THE HOUSE'S LIGHT, second version (stage 2, "the place, its light and its water").
// docs/build/theatre/2-light.md says why it is as it is; lib.js `house()` builds every paint of the area from it.
//
// The first version (lib.js `ext`, still there behind `&light=1`) dimmed the realm's general light and added the moon's
// shaft, the candle rows and water-light. It gave two faults the director named: kindled, every wall was one yellow-gold
// (a wide pool round each bracket, a yellow fill, and the local colour of gilt in every shadow); before the kindling, a
// wall away from the shaft was black. This version paints the room the way the key painting does:
//
//   1. THE ROOM'S DARK. A surface no light reaches is not black and not a dimmed local colour: it is the air's colour, a
//      petrol and bottle green, a little lighter on pale things and on planes that look up, sinking to the house dark in
//      the recesses of the boxes and toward the top of the room. Gilt in the dark is green-black; only light makes it gold.
//   2. THE MOON. What stands in the shaft is lit from above. The lit rain is itself a column of light 20 m across: it
//      reaches the whole house, strongest on what faces it, falling off as from a column and not as from a point, and it
//      greys what it falls on (moonlight takes the colour out of gold). So the house shows, dim, in pearl and green,
//      before a single candle burns.
//   3. THE WET GLEAM. Rails, fronts, bark and seat backs are wet or rubbed: they catch the pale opening of the dome as a
//      broken line of pearl along every edge that looks up toward it, and the column of rain as a soft upright streak.
//      It moves as the boat moves.
//   4. THE CANDLES. Each bracket lights a pool that dies within two metres, FROM where the flames are: the faces and
//      carved edges that look at the flames catch it, what looks away stays green-dark, and gilt gives the flame back as
//      a glint. Between two brackets the wall falls back to the room's dark. Caught tier by tier on the show clock.
//   5. A little warm bounce when the house is lit (the dome and the cove take most of it), and the lights other people
//      make with ctx.light (lustres, the fire in the tree, the stage moon), taken at a share the light state gives.
//   6. WATER-LIGHT up the walls from the waterline, as before (the walls' own record of the wake arriving, lib.js).
//   THE SECOND ROUND (2-light.md, "The second round") added:
//   7. WARM LIGHT ON GREEN THINGS: under a flame a cool surface is taken toward a warm grey of its own value (amber times
//      bottle green is a sour yellow-green); the pool takes the PLACE of the room's dark instead of lying over it (amber over
//      petrol is olive); and a pool's core is capped (an amber that burns out goes lemon). The candle's colour on things is a
//      deeper amber than the flame.
//   8. THE COVE'S WASH: above the top tier its candles light the cove from below, dying upward.
//   9. THE OPEN END of the fly tower: a cold breath of the night on what looks toward it.
//   10. Surfaces: brick with limewash to a man's reach, putlog holes, a chalk tally, salt as a bloom; the foyer's walls hung
//      with the house's damask (DETAIL).
//   THIS FILE HAS A TWIN, light_next.js, loaded instead of it with &next=1: change the light there, look, then copy it here.
//
// Everything is worked out from where a surface IS (the page's COLOR_1 is not needed): a model painted in true local
// colours is right the moment it is dressed with H.dress(kind).
import * as THREE from 'three';
import { frontArcAtS, frontD } from './plan.js';

const f = (n) => Number(n).toFixed(4);

/**
 * How each kind of paint behaves in the house's light: keep = [hue, dark, gleam, metal]
 *   hue    0..1  how much of its own colour a thing keeps where no light reaches it (0: the room's dark alone; leaves keep theirs)
 *   dark   0..1+ how much of the room's dark it takes (1; less for things that must stay black, more for pale cloth)
 *   gleam  0..1  how wet or rubbed it is: the pearl line it catches from the moon
 *   metal  0..1  how much it gives a flame back as a glint (gilt, brass, copper)
 */
export const KEEP = {
  gilt: [0.12, 1, 1.0, 1.0], giltHigh: [0.12, 1, 1.0, 1.0], brass: [0.2, 1, 0.9, 0.9], copper: [0.5, 1, 0.9, 0.8],
  velvet: [0.6, 1, 0.4, 0.12], damask: [0.45, 1, 0.3, 0.2], plaster: [0.2, 1, 0.35, 0.08], ceiling: [0.2, 1, 0.3, 0.08], stone: [0.3, 1, 0.3, 0.08],
  brick: [0.5, 1, 0.25, 0.04], dark: [0.2, 0.6, 0.1, 0], boards: [0.3, 1, 0.5, 0.08], floor: [0.3, 0.8, 0.2, 0], runner: [0.8, 1, 0.1, 0],
  bark: [0.3, 1, 0.8, 0.1], leaf: [0.85, 1, 0.5, 0.12], mound: [0.4, 1, 0.5, 0.15], pearl: [0.3, 1, 0.5, 0.3], sky: [0.5, 1, 0.1, 0],
  rose: [0.6, 1, 0.1, 0], canvas: [0.4, 1, 0.1, 0], timber: [0.4, 1, 0.3, 0.08], petrol: [0.6, 1, 0.3, 0.08], rope: [0.3, 1, 0.2, 0], iron: [0.2, 1, 0.5, 0.3],
  canvasBag: [0.3, 1, 0.1, 0], wax: [0.3, 1, 0.3, 0.1], card: [0.3, 1, 0.2, 0],
};
export const KEEP_DEFAULT = [0.35, 1, 0.3, 0.1];

/**
 * What the plain building's own paints carry on their surface, painted in the shader (no picture, no memory): so that a wall
 * the boat drifts along is worth the look. Only for things made with H.paint(kind); a model dressed with H.dress(kind)
 * brings its own paint and gets none of this unless it asks ({ detail: true }).
 *   1 brick    courses of brick, each its own tone, pale mortar, soot running down, the wet rising from the water with a salt line
 *   2 boards   stage boards running across the stage, butt joints, scuffs along the grain, the grooves the wings run in
 *   3 timber   planks and grain
 *   4 plaster  old plaster and stone: mottling, runs of damp, hair cracks, a tide mark
 */
export const DETAIL = { brick: 1, boards: 2, timber: 3, plaster: 4, ceiling: 4, stone: 4 };

// What the plain building's paints carry on their surface (DETAIL above). World space, so nothing swims; every pattern fades
// to its own average where a pixel can no longer hold it, so far walls do not crawl.
const DETAIL_GLSL = /* glsl */`
    { // ---- the surface of the plain building (src/realms/theatre/light.js)
      bool dFlat = abs(N.y) > 0.7;                                          // a floor or a ceiling
      float dU = dFlat ? vWPos.x : (abs(N.x) > abs(N.z) ? vWPos.z : vWPos.x), dV = dFlat ? vWPos.z : vWPos.y;
      float dPx = max(length(vec2(dFdx(dU), dFdy(dU))), length(vec2(dFdx(dV), dFdy(dV))));      // metres under one pixel
      #if HOUSE_DETAIL == 1
        float dRow = floor(dV / 0.075); vec2 dQ = vec2(dU / 0.225 + 0.5 * mod(dRow, 2.0), dV / 0.075), dId = floor(dQ), dF = fract(dQ);
        float dSee = 1.0 - smoothstep(0.02, 0.07, dPx), dTone = hseHash(dId);
        float dMortar = max(smoothstep(0.86, 0.96, dF.y), smoothstep(0.94, 0.98, dF.x)) * dSee;
        albedo *= mix(1.0, mix(0.8 + 0.36 * dTone * dTone, 1.18, dMortar), dSee);                     // every brick its own tone, the mortar a little paler
        albedo = mix(albedo, albedo * vec3(1.12, 0.92, 0.88), step(0.86, dTone) * dSee * (1.0 - dMortar));   // a few redder ones
        albedo = mix(albedo, vec3(dot(albedo, vec3(0.3, 0.55, 0.15))) * vec3(0.95, 0.9, 1.0), 0.35);          // old brick under soot: greyed, a little plum
        float dRise = 0.9 * hseFbm(vec2(dU * 0.3, 1.7));                                            // the wet rises from the water, unevenly
        albedo *= (0.72 + 0.5 * hseFbm(vec2(dU * 0.7, dV * 0.1 + 3.0)));                              // soot in long runs
        // putlog holes, where the scaffold stood when the wall was built: a dark square every six feet
        vec2 dPl = vec2(dU / 1.8, (dV - 0.9) / 1.5), dPf = abs(fract(dPl) - 0.5) * vec2(1.8, 1.5);
        albedo *= 1.0 - 0.72 * step(dPf.x, 0.055) * step(dPf.y, 0.04) * step(0.3, hseHash(floor(dPl) + 3.0)) * dSee;
        // limewash to a man's reach, as backstage walls are: old, thin, the courses showing through it, flaked off in sheets
        // (fourth holder: it flaked brick by brick at full contrast, which the painter's filter turned into a checker of pale and dark blocks, like a damaged
        // picture. Sixth: their soft, thin patches came out of the same filter as pale blotches with blocky edges, a low-resolution picture of a wall. A painter
        // would put it down as SHAPES: one band of old limewash along the foot of the wall, brushed up to a line a man can reach, opaque, and come away in sheets
        // that leave islands of bare brick with edges of their own; near the eye those edges keep the bricks' outline, a finger's breadth)
        float dBrk = (hseHash(dId + 31.0) - 0.5) * dSee;
        float dWashTop = 2.12 + 0.2 * hseNoise(vec2(dU * 0.55, 4.0)) + 0.05 * hseNoise(vec2(dU * 4.7, 9.0));
        float dBand = 1.0 - smoothstep(-0.025, 0.025, dV + 0.07 * dBrk - dWashTop);                 // a brushed edge
        float dIsl = hseFbm(vec2(dU * 0.33, dV * 0.5) + 21.0) + 0.26 * hseNoise(vec2(dU * 1.9, dV * 1.6) + 5.0) + 0.05 * dBrk;
        float dCut = mix(0.60, 0.70, smoothstep(0.3, 2.0, dV));                                    // more of it has gone low down, where the damp is
        float dWash = dBand * (1.0 - smoothstep(dCut - 0.01, dCut + 0.01, dIsl)) * 0.84;
        vec3 dLime = vec3(0.155, 0.148, 0.130) * (0.86 + 0.28 * hseNoise(vec2(dU * 13.0, dV * 1.1) + 13.0)) * (0.84 + 0.32 * mix(0.5, dTone, dSee)) * (1.0 - 0.26 * dMortar);      // the brush's own streaks in it; the bricks under it, each a breath its own tone, and their joints as fine dark lines
        albedo = mix(albedo, dLime, dWash);
        albedo *= mix(1.0, 0.5, smoothstep(2.6, 15.0, dV));                                            // a hundred years of lamp smoke: the wall goes up into soot
        // chalk on the limewash: a stage hand's tally, four strokes and one across, here and there along the wall
        float dCell = floor(dU / 6.3), dCx = dU - (dCell + 0.25 + 0.5 * hseHash(vec2(dCell, 7.0))) * 6.3, dCy = dV - 1.52 - 0.2 * hseHash(vec2(dCell, 9.0));
        float dN = 2.0 + floor(3.0 * hseHash(vec2(dCell, 11.0)));                                 // two to four fives
        float dGr = floor(dCx / 0.42), dGx = dCx - dGr * 0.42;                                     // one five: four strokes 5 cm apart and a slant across them
        float dStroke = step(0.0, dGr) * step(dGr, dN - 0.5) * step(abs(dCy), 0.085) * (
          step(dGx, 0.2) * (1.0 - smoothstep(0.006, 0.012, abs(fract(dGx / 0.05 + 0.5) - 0.5) * 0.05 + 0.004 * sin(dCy * 40.0 + dGr))) +
          (1.0 - smoothstep(0.006, 0.013, abs(dCy - (dGx - 0.1) * 0.62))) * step(-0.02, dGx) * step(dGx, 0.24));
        albedo = mix(albedo, vec3(0.62, 0.62, 0.58), min(dStroke, 1.0) * 0.6 * (1.0 - smoothstep(0.006, 0.02, dPx)) * step(0.35, hseHash(vec2(dCell, 5.0))));
        // (the third holder tried dabs of scene paint here, at a man's height between s 122 and 160: flat pastel shapes, all level, which read as stickers
        // on the wall. Taken out by the fourth: the wall is soot, limewash, chalk, damp and salt, and what stands in front of it is the stage builder's.)
        // rust and wet run down from some of the putlog holes, a long thin stain under each
        { vec2 dRl = vec2(dU / 1.8, (dV - 0.9) / 1.5), dRi = floor(dRl + vec2(0.0, 1.0)); float dRh = hseHash(dRi + 3.0);
          float dRx = (fract(dRl.x) - 0.5) * 1.8 + 0.012 * sin(dV * 9.0 + dRh * 30.0), dRy = (dRi.y + 0.5) * 1.5 + 0.9 - dV;      // metres beside the hole above, metres below it
          float dRun = step(0.55, dRh) * (1.0 - smoothstep(0.012, 0.05 + 0.03 * dRh, abs(dRx))) * smoothstep(0.0, 0.08, dRy) * (1.0 - smoothstep(0.3, 0.5 + 1.6 * fract(dRh * 7.3), dRy));
          albedo = mix(albedo, albedo * vec3(0.62, 0.5, 0.46), dRun * 0.7 * (1.0 - smoothstep(0.02, 0.06, dPx))); }
        // the damp below, and the salt it leaves where it dries: a bloom in patches, never a drawn line
        // (sixth: the wet stands half a metre up the wall, as on everything in the house (the kit's tide), with an edge; above it the damp fades out by a man's knee)
        float dWetAt = dV + 0.22 * (dRise - 0.4);
        albedo *= (1.0 - 0.34 * smoothstep(1.5, 0.3, dWetAt)) * mix(vec3(1.0), vec3(0.50, 0.58, 0.54), 1.0 - smoothstep(0.44, 0.52, dWetAt));
        float dSalt = smoothstep(0.10, 0.0, abs(dWetAt - 0.56)) * smoothstep(0.42, 0.62, hseFbm(vec2(dU * 1.9, dV * 0.6) + 5.0)) + 0.4 * smoothstep(0.4, 0.0, abs(dWetAt - 0.95)) * smoothstep(0.6, 0.85, hseNoise(vec2(dU * 5.0, dV * 3.0)));
        albedo += vec3(0.10, 0.11, 0.105) * dSalt * (0.5 + 0.5 * hseNoise(vec2(dU * 14.0, dV * 11.0)));
      #elif HOUSE_DETAIL == 2
        float dRow = floor(dV / 0.14), dF = fract(dV / 0.14), dSee = 1.0 - smoothstep(0.03, 0.1, dPx);
        float dJoint = smoothstep(0.988, 0.998, fract(dU / 3.2 + hseHash(vec2(dRow, 1.0))));
        albedo *= mix(1.0, (0.8 + 0.4 * hseHash(vec2(dRow, 3.0))) * (1.0 - 0.6 * max(smoothstep(0.9, 0.98, dF), dJoint)), dSee);      // boards across the stage, each its own tone, the gaps dark
        albedo *= 0.82 + 0.5 * hseFbm(vec2(dU * 0.6, dV * 5.0));                                    // scuffed pale along the grain
        float dGr = abs(mod(-vWPos.z - 94.0 + 2.75, 5.5) - 2.75);                                   // the grooves the wings run in, at each pair of flats
        albedo *= 1.0 - 0.7 * smoothstep(0.035, 0.012, abs(dGr - 0.05)) * step(6.2, abs(vWPos.x)) * step(92.0, -vWPos.z) * step(vWPos.z, -92.0) * step(-118.0, vWPos.z);
      #elif HOUSE_DETAIL == 3
        float dSee = 1.0 - smoothstep(0.03, 0.1, dPx);
        float dPl = dFlat ? fract(dU / 0.19) : fract(dV / 0.21), dId = dFlat ? floor(dU / 0.19) : floor(dV / 0.21);
        albedo *= mix(1.0, (0.82 + 0.36 * hseHash(vec2(dId, 5.0))) * (1.0 - 0.5 * smoothstep(0.92, 0.985, dPl)), dSee);              // planks
        albedo *= 0.8 + 0.45 * (dFlat ? hseFbm(vec2(dU * 9.0, dV * 0.7)) : hseFbm(vec2(dU * 0.7, dV * 9.0)));                          // grain along them
      #elif HOUSE_DETAIL == 4
        // the foyer's walls are hung with silk between the dado and the cornice: the house's own damask (the kit's painted swatch), on the
        // wall's own plane only (the pilasters, the mouldings and the dado stay plaster), faded in long runs and stained by the damp
        { float dFs = -vWPos.z, dW = 10.0 + 3.5 * clamp((dFs - 20.0) / 10.0, 0.0, 1.0);
          float dOn = (dFlat || dFs > 30.4) ? 0.0 : step(dW - abs(vWPos.x), dFs > 20.3 ? 0.085 : 0.028) * smoothstep(1.26, 1.32, dV) * (1.0 - smoothstep(8.9, 8.96, dV));      // (the flared wall's face stands 7 cm inside its line: measured)
          if (dOn > 0.0 && uHouseSilk > 0.5) {
            vec3 dSilk = texture2D(tHouseSilk, vec2(dU / 1.3, dV / 1.3)).rgb;
            // the figure is faint in the painting: here it is woven in two tones, leaves and garlands in old green-gold on a deep green ground,
            // so that it reads by the lantern and, as a difference of value, in the foyer's dark
            float dFig = smoothstep(0.075, 0.17, dot(dSilk, vec3(0.3, 0.55, 0.15)));
            vec3 dWove = mix(vec3(0.050, 0.105, 0.085), vec3(0.34, 0.33, 0.17), dFig) * (0.75 + 0.5 * dSilk / 0.11);
            albedo = mix(albedo, dWove * (0.8 + 0.36 * hseFbm(vec2(dU * 0.8, dV * 0.13) + 9.0)), dOn);
          } }
        float dMot = hseFbm(vec2(dU, dV) * 0.45 + 11.0), dRun = hseFbm(vec2(dU * 0.9, dV * 0.07 + 5.0));
        albedo *= (0.8 + 0.4 * dMot) * (dFlat ? 1.0 : 0.78 + 0.44 * dRun);                             // old plaster: mottled, with runs of damp down the walls
        float dCr = abs(hseNoise(vec2(dU, dV) * 0.55 + 3.0) - 0.5);                                   // hair cracks, where a pixel can hold them
        albedo *= 1.0 - 0.4 * smoothstep(0.012, 0.004, dCr) * (1.0 - smoothstep(0.01, 0.05, dPx)) * step(0.5, hseNoise(vec2(dU, dV) * 0.13 + 7.0));
        if (!dFlat) { float dRise = 0.7 * hseFbm(vec2(dU * 0.3, 1.7));                                // the tide mark the water has left
          albedo *= 1.0 - 0.38 * smoothstep(1.2, 0.1, dV + dRise); albedo += vec3(0.06, 0.07, 0.066) * smoothstep(0.06, 0.0, abs(dV + dRise - 1.15)); }
      #endif
    }`;

/** The uniforms the second version adds to the house's own (lib.js `U`); set.js drives them from look.house every frame. */
export function lightUniforms(plan) {
  const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
  // the box-front line as a texture: for s 30..90, r = how far the fronts stand from the centre line, g = the line's slope
  // (metres of d for a metre of s), b = metres along the front from its rear end. One fetch instead of two chains of ifs,
  // and the true curve instead of straight runs between its ten points.
  const N = 128, data = new Uint16Array(N * 4), h = THREE.DataUtils.toHalfFloat;
  for (let i = 0; i < N; i++) {
    const s = 30 + 60 * i / (N - 1), e = 0.05, d = frontD(s), slope = (frontD(Math.min(90, s + e)) - frontD(Math.max(30, s - e))) / (Math.min(90, s + e) - Math.max(30, s - e));
    data.set([h(d), h(slope), h(frontArcAtS(s)), h(1)], i * 4);
  }
  const tFront = new THREE.DataTexture(data, N, 1, THREE.RGBAFormat, THREE.HalfFloatType);
  tFront.magFilter = tFront.minFilter = THREE.LinearFilter; tFront.wrapS = tFront.wrapT = THREE.ClampToEdgeWrapping; tFront.needsUpdate = true;
  return {
    tFront: { value: tFront },
    tHouseSilk: { value: null }, uHouseSilk: { value: 0 },          // the house's damask, for the foyer's walls (set.js loads it; until then, and if it fails, the walls are plaster)
    uDark: { value: C('#12302A') },                         // the room's dark in the house (from the light state)
    uDarkFoyer: { value: C('#1a1420') },                    // the foyer's: the warm near-black the area is entered through
    uDarkStage: { value: C('#111c20') },                    // the stage: the cool half of the picture, a slate dark that the lamp's amber and the stage moon's pearl stand on
    uDarkFly: { value: C('#211829') },                      // the fly tower: plum (its brick takes half of this: the page's plum-black #17111A). (Fourth look: #2A2032 before. With the lantern's pool at the water and the night's cold light raking in from the open end the tower has two lights to be read by, and its dark can be a dark: against #2A2032 the night at the end was the darkest thing in the frame and the broken walls stood PALER than the sky)
    uMoonDir: { value: new THREE.Vector3(0.18, -0.86, 0.47).normalize() },      // the way the moon's light travels inside the shaft (set.js sets it from the shaft's lean, drawn out so that forms have a lit side)
    uStageCol: { value: C('#C4D6D0', 0.5) },                // the stage moon's wash on the painted orchard
    uLanternK: { value: 1 },                                // how far the bow lantern's light is drawn in to a pool (0: as the engine gives it)
    uLampMore: { value: 1.2 },                              // how much more the kept lamp's light counts on the stage than the engine gives it
    uDarkP: { value: new THREE.Vector4(0.42, 0.62, 0.22, 1) },      // how fast a recess sinks (per metre behind a front), the dark at the top of the room, how much planes that look up are lighter, strength
    uMoonP: { value: new THREE.Vector4(0.55, 1.4, 0.34, 0.6) },     // how far moonlight greys what it falls on, the falloff of the column's light, its strength, the wet gleam
    uPoolP: { value: new THREE.Vector4(1.2, 0.7, 0.55, 1) },        // a candle pool: its reach (metres), how much it wraps, the glint on metal, the share taken of other people's local lights
    uCoveP: { value: new THREE.Vector4(2.6, 0.0, 0, 0) },            // the top tier's candles on the cove above them: how high the wash climbs (metres), its strength
    uEndP: { value: new THREE.Vector4(0.0, 121, 160, 0.3) },           // the night at the fly tower's open end: its strength on what looks toward it, from where to where (s) it grows, its share where it begins (fourth look: it rakes the tower from s 121; it was a wash from s 130)
    uWarmP: { value: new THREE.Vector4(0.85, 0.6, 0.5, 4) },        // warm light on green things: how far a candle takes the green out of what it lights, the same for lamps and the bow lantern, the cap on a pool (its core cannot pass 1 / this), how fast a pool takes the place of the room's dark
    uHighP: { value: new THREE.Vector4(0, 1, 1, 0) },               // THE HIGH ROOM (second look): the night's own light on what stands above the cornice, the share of the lit room's warm bounce that paint keeps there, and that gilt takes there
    uHighCol: { value: C('#A9C6D0') },                              // ... its colour: the moonlit cloud in the tear, a blue pearl
    uFlyP: { value: new THREE.Vector4(0.42, 0.08, 3.2, 0.14) },     // THE FLY TOWER: how dark the room's dark is at the grid (1: as at the water); (fourth look) the share of the open end's cold light that a face square to it takes whichever way it looks, the metres over which the bow lantern's light dies upward on what stands away from the boat, and what is left of it high up
  };
}

/** The extension itself (GLSL for gouache's `extend`). wake: whether the paint takes water-light; detail: what it carries on its surface (DETAIL, 0 for nothing). */
export function lightExtension(plan, wake, detail = 0) {
  const A = plan.arc, face = plan.archWall.face, bay = plan.bay, dEdge = frontD(face);
  const mid84 = (A.at84 + A.end) / 2;
  return {
    defines: { ...(wake ? { HOUSE_WAKE: '' } : {}), HOUSE_DETAIL: detail | 0 },
    albedo: detail ? DETAIL_GLSL : '',
    fragmentPars: /* glsl */`
  uniform float uHouse, uShow, uWakeLen, uStir, uLampMore, uLanternK; uniform vec4 uShaft, uTake, uWakeP, uKeep, uDarkP, uMoonP, uPoolP, uWarmP, uCoveP, uEndP, uHighP, uFlyP; uniform vec2 uShaftLean, uWakeH; uniform sampler2D tWake, tFront, tHouseSilk; uniform float uHouseSilk;
  uniform vec3 uMoonCol, uCandleCol, uFillCol, uWakeCol, uWakeStage, uWakeRose, uDark, uDarkFoyer, uDarkStage, uDarkFly, uMoonDir, uStageCol, uHighCol;
  // the light of a few flames on what stands by them: bright at arm's length, gone within two metres
  float housePool(float d2, float reach) { return exp(-d2 / (reach * reach)) / (1.0 + d2); }
  float hseHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float hseNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hseHash(i), hseHash(i + vec2(1.0, 0.0)), f.x), mix(hseHash(i + vec2(0.0, 1.0)), hseHash(i + vec2(1.0, 1.0)), f.x), f.y); }
  float hseFbm(vec2 p) { return hseNoise(p) * 0.55 + hseNoise(p * 2.3 + 7.1) * 0.3 + hseNoise(p * 5.1 + 3.3) * 0.15; }`,
    light: /* glsl */`
    { // ---- the house's own light, second version (src/realms/theatre/light.js)
      vec3 hBase = albedo * mix(vec3(1.0), shade, uShade) + albedo * ambient;
      c -= hBase * (1.0 - uHouse);                                         // the room is dark: only a share of the general light reaches in
      float hS = -vWPos.z, hD = abs(vWPos.x), hY = vWPos.y, hSide = vWPos.x < 0.0 ? -1.0 : 1.0;
      float hLum = dot(albedo, vec3(0.3, 0.55, 0.15));
      vec3 hOwn = min(albedo / max(hLum, 0.03), vec3(2.4));               // its own hue, at a luminance of one (held in: a stray face painted pure blue on a model's cornice came out of the wet gleam as a row of blue dashes)
      // WARM LIGHT ON GREEN THINGS. Amber light times bottle green is a sour yellow-green: multiplied out honestly, every pool of
      // candlelight on lacquer and velvet came out lemon, and so did its reflection. A painter puts the pool down in the LIGHT's
      // colour. So under a flame a cool surface is taken toward a warm grey of its own value (gilt, copper and leaves, which are
      // warm already, keep their own colour and go deeper amber by themselves).
      float hCool = clamp((max(albedo.g, albedo.b) - albedo.r) / max(hLum, 0.03) * 2.0, 0.0, 1.0);
      vec3 hNeut = vec3(hLum) * vec3(1.14, 0.95, 0.76);
      vec3 hAlbC = mix(albedo, hNeut, uWarmP.x * hCool), hAlbL = mix(albedo, hNeut, uWarmP.y * hCool);
      float hHouse = smoothstep(27.0, 31.0, hS) * (1.0 - smoothstep(89.5, 93.0, hS));      // 1 in the auditorium
      float hHigh = smoothstep(19.2, 21.6, hY) * hHouse;                                    // 1 above the cornice: the cove, the dome, their ribs
      // where it stands by the fronts: the tier whose candle row is nearest, and the line that tier's front follows
      vec4 hF = texture2D(tFront, vec2((hS - 30.0) / 60.0, 0.5));          // r: the fronts' d here, g: the line's slope, b: metres along it
      float hTier = clamp(floor((hY - 1.5) / 3.2 + 0.5), 1.0, 5.0);
      float hInv = inversesqrt(1.0 + hF.g * hF.g);
      float hOutSide = (hF.r + 0.25 * hTier - hD) * hInv, hOutRear = hS - ${f(face)};      // metres into the room from the side front, from the rear front (negative: behind it, in a box)
      bool hRear = hOutRear < hOutSide;
      float hOut = hRear ? hOutRear : hOutSide;

      // ---- 1. the room's dark: the air's colour on everything no light reaches
      vec3 hDk = mix(uDarkFoyer, uDark, smoothstep(10.0, 30.0, hS));
      hDk = mix(hDk, uDarkStage, smoothstep(90.5, 97.0, hS));
      hDk = mix(hDk, uDarkFly, smoothstep(118.5, 123.0, hS));
      hDk = mix(hDk, hOwn * dot(hDk, vec3(0.3, 0.55, 0.15)), uKeep.x);     // how much of its own colour a thing keeps in the dark
      float hValue = clamp(sqrt(hLum / 0.2), 0.5, 1.45);                   // pale things stay paler than dark ones
      float hRecess = mix(1.0, exp(clamp(hOut, -5.0, 0.0) * uDarkP.x), hHouse);      // the boxes sink toward the house dark
      float hTop = mix(1.0, uDarkP.y, smoothstep(3.0, 22.0, hY) * hHouse);          // and the room goes up into the dark
      float hFly = smoothstep(118.5, 123.0, hS);                                   // 1 in the fly tower
      hTop *= mix(1.0, uFlyP.x, hFly * smoothstep(2.5, 24.0, hY));                 // (so does the fly tower: thirty metres of rope going up into plum-black; by lantern the light is at the water)
      vec3 hDarkAdd = hDk * (hValue * hRecess * hTop * (1.0 - uDarkP.z + uDarkP.z * (0.5 + 0.5 * N.y)) * uDarkP.w * uKeep.y);
      c += hDarkAdd;

      // ---- 2. the moon: the shaft, and the lit rain as a column of light that reaches the whole house
      vec2 hQ = vWPos.xz - (uShaft.xy + uShaftLean * hY);
      float hR = length(hQ);
      float hIn = 1.0 - smoothstep(uShaft.z * 0.8, uShaft.z * 1.2, hR);
      // (the moon's light comes down the shaft toward the arches: what looks up or toward the stage is lit, what looks at the arriving boat is the shadow side)
      float hUp = max(dot(N, -uMoonDir) * 0.75 + 0.25, 0.0);
      float hTy = min(hY + 5.0 + 0.25 * hR, 22.0) - hY;                    // the column is tall: far walls are lit from higher up, the dome from below
      vec3 hToCol = normalize(vec3(-hQ.x, hTy, -hQ.y));
      float hNlM = max(dot(N, hToCol) * 0.6 + 0.4, 0.0);
      float hFall = uShaft.z / (uShaft.z + uMoonP.y * max(hR - uShaft.z, 0.0));
      float hReach = smoothstep(6.0, 30.0, hS) * (1.0 - smoothstep(90.0, 99.0, hS)) * mix(1.0, hRecess, 0.7);      // through the arches a little, up the stage a little, less into the boxes
      float hScat = uMoonP.z * hFall * hNlM * hReach * (1.0 - hIn);
      vec3 hGrey = mix(albedo, vec3(hLum * 1.1), uMoonP.x * (1.0 - 0.7 * hHigh));      // moonlight takes the colour out of what it falls on (but a painted sky is painted in its colours: above the cornice it keeps them)
      float hMoon = uShaft.w * uTake.z, hMoonS = uShaft.w * min(uTake.z, 1.0);
      c += uMoonCol * (hMoon * albedo * hIn * (0.16 + 0.84 * hUp) + hMoonS * hGrey * hScat);

      // ---- 3. the wet gleam: the pale opening of the dome along every edge that looks up toward it, the column as an upright streak; an edge of light on what stands in the shaft
      float hWetK = hMoonS * hReach * uKeep.z * uMoonP.w;
      float hCarved = mix(0.28, 1.0, clamp(length(fwidth(N)) * 40.0, 0.0, 1.0));      // a carved or rounded thing takes the gleam whole; a broad flat face only a breath of it (or a plain wall would go pale all over)
      if (hWetK > 0.004) {
        vec3 hRf = reflect(-V, N);
        vec3 hTear = normalize(vec3(uShaft.x + uShaftLean.x * 30.0, 30.0, uShaft.y + uShaftLean.y * 30.0) - vWPos);
        float hG = max(dot(hRf, hTear), 0.0); hG *= hG; hG *= hG; hG *= hG * sqrt(hG);      // (to the tenth: the opening is wide, and so is what it lays on a wet edge)
        vec2 hRh = hRf.xz / max(length(hRf.xz), 1e-3);
        float hGc = max(dot(hRh, -hQ / max(hR, 1e-3)), 0.0); hGc *= hGc; hGc *= hGc; hGc *= hGc; hGc *= hGc * hGc;      // (to the twenty-fourth)
        hG = max(hG, 0.4 * hGc * (1.0 - hRf.y * hRf.y) * smoothstep(-0.3, 0.1, hRf.y));
        float hE = 1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), hRim = hE * hE * hE * (0.7 * hIn + 0.3 * hFall);
        float hWet = hG * (0.6 + 0.4 * sqrt(hFall)) * (0.7 + 0.5 * stroke) * hCarved + hRim * 0.6;
        c += uMoonCol * (hWetK * hWet) * mix(vec3(1.0), hOwn, 0.15) * (0.35 + 0.65 * hValue);
      }

      // ---- 4. the candles: a row of three-armed brackets on every tier front, a pool round each, lit FROM the flames;
      // caught by an edge of flame that runs both ways from s 58 (the stage boxes and the arch last). The arch wall carries rows only from tier 3 up.
      if (uShow > 0.0 && hS > 29.0 && hS < 91.0 && uTake.y > 0.0) {       // (nothing of this before the hour, or outside the house)
      vec3 hT, hNr; float hAl;                                             // along the front toward the stage, into the room; metres along the front
      if (hRear) { hT = vec3(hSide, 0.0, 0.0); hNr = vec3(0.0, 0.0, -1.0); hAl = ${f(A.rearFace)} - max(${f(dEdge)} - hD, 0.0); }
      else { hT = vec3(hSide * hF.g, 0.0, -1.0) * hInv; hNr = vec3(-hSide, 0.0, -hF.g) * hInv; hAl = hF.b - (hF.r + 0.25 * hTier - hD) * hF.g * hInv; }
      float hBay = hRear ? hD - ${f(4 * bay)} : hAl - ${f(A.bay0)};          // metres along the front from a pier
      float hA = hBay - ${f(bay)} * floor(hBay / ${f(bay)} + 0.5);            // ... to the nearest pier, where the bracket is
      bool hBox = !hRear && hAl > ${f(A.at84 + 0.6)};                      // the stage boxes: one five-candle branch on each level
      if (hBox) hA = hAl - ${f(mid84)};
      float hWhen = hBox ? 18.0 + 0.3 * hTier : ${f(plan.show.tierStart[1])} + 2.0 * (hTier - 1.0) + abs(hAl - ${f(A.at58)}) / ${f(plan.show.speed)};
      vec3 hL = hT * (-hA) + hNr * (0.46 - hOut) + vec3(0.0, 3.2 * hTier + 1.5 - hY, 0.0);      // from here to the flames
      float hD2 = dot(hL, hL);
      vec3 hLd = hL * inversesqrt(max(hD2, 1e-4));
      float hOk = step(29.0, hS) * (1.0 - step(91.0, hS)) * ((hRear && hTier < 2.5) ? 0.0 : 1.0) * smoothstep(0.0, 0.9, uShow - hWhen);
      float hPool = housePool(hD2, uPoolP.x * (hBox ? 1.25 : 1.0)) * hOk * (1.0 + 0.3 * stroke);
      float hCandle = hPool * max(dot(N, hLd) * uPoolP.y + 1.0 - uPoolP.y, 0.0);
      float hGl = max(dot(N, normalize(hLd + V)), 0.0); hGl *= hGl; hGl *= hGl; hGl *= hGl; hGl *= hGl;      // (to the sixteenth)
      float hGlint = hPool * hGl;
      // the proscenium's own twelve brackets stand round the opening, from the springing up to the crown
      float hEdge = hY < 11.0 ? abs(hD - 12.4) : abs(length(vec2(hD / 12.4, (hY - 11.0) / 5.4)) - 1.0) * 8.5;
      float hPhi = hY < 11.0 ? (hY - 11.0) / 2.7 : atan((hY - 11.0) / 5.4, hD / 12.4) / 0.29;
      float hAa = (hPhi - floor(hPhi + 0.5)) * 2.7;
      float hArch = 0.7 * step(hD, 15.2) * step(10.0, hY) * housePool(hAa * hAa + hEdge * hEdge + (hS - 88.8) * (hS - 88.8), uPoolP.x)
        * smoothstep(0.0, 0.9, uShow - (18.2 + 1.8 * clamp((hY - 11.0) / 5.0, 0.0, 1.0))) * max(N.z * 0.6 + 0.4, 0.0);
      hCandle = max(hCandle, hArch);
      // above the top tier its candles light the cove from below: a wash that is strongest at the cove's foot over each bracket
      // and dies upward (the brackets stand two metres under the cornice: the pools themselves do not reach it)
      if (hY > 19.2 && uCoveP.y > 0.0) hCandle = max(hCandle, uCoveP.y * hOk * exp(-max(hY - 19.6, 0.0) / uCoveP.x) * (0.45 + 0.55 * exp(-hA * hA / 2.2)) * max(0.6 - 0.5 * N.y, 0.0));
      c -= hDarkAdd * min(hCandle * uWarmP.w * uTake.y, 0.92);             // where a flame's light falls it REPLACES the room's dark (amber laid over petrol goes olive; a painter puts the pool down clean and lets it die into the dark at its edge)
      vec3 hCl = uCandleCol * uTake.y * (hAlbC * hCandle + mix(vec3(1.0), hOwn, 0.5) * (hGlint * uPoolP.z * uKeep.w));
      c += hCl / (1.0 + max(hCl.r, max(hCl.g, hCl.b)) * uWarmP.z);         // (capped: an amber that burns out turns lemon on its way to white; by the flame it stays amber)
      }

      // ---- the stage has a moon of its own: from c 19, as it begins to rise, the painted orchard stands in cool pearl light
      // (what faces the house most), the cool half of the picture; the lamp's amber is then the one warm thing on it
      if (hS > 91.0 && hS < 121.0) {
        float hSt = smoothstep(91.0, 94.0, hS) * (1.0 - smoothstep(119.3, 121.0, hS));
        // (second look: it falls from the house, on what the house sees. Backs of flats, the side walls behind the wings and whatever looks upstage
        // take none of it: seen from the stage they are the dark frame the lit house stands in.)
        // (and it comes with the curtain's last metres, c 16.5 to 23: when the curtain stands half up the orchard under it is already in its moonlight)
        if (uShow > 16.5) c += albedo * uStageCol * (hSt * smoothstep(16.5, 23.0, uShow) * smoothstep(0.05, 0.75, N.z) * min(uTake.z, 1.0));
        // and the kept lamp counts for more there: before the hour its pool on the painted orchard, seen under the curtain's hem from the arches, is the one warm thing in the house
        c += albedo * pointLight(uLampPos, uLampColor, uLampRadius, N) * (hSt * uLampMore);
      }
      // ---- the fly tower is open to the night at its far end: a cold breath of it on whatever looks that way, growing toward the end.
      // With the lantern's pool near the boat it makes three depths of the tower: amber by the hull, plum between, slate at the end.
      // (it falls as on a mid grey: soot-dark brick gave back so little of it that the last twenty metres were a black frame)
      // (fourth look: IT RAKES. It was a wash on everything that did not look away from the end, walls square to the route included: a flat blue-grey over
      // the whole tower, which with the lantern's even brown made the murk. The night comes in at the end and travels up the tower: what looks toward the
      // end is lit, a wall it runs along takes only a breath, so that every pier, strut, rope and bag has a cold side and the wall between them stays plum.
      // Near the broken end it comes down through the missing roof too. It begins at s 121 at a third of its strength: the whole tower has its second light.)
      if (hS > uEndP.y - 4.0 && uEndP.x > 0.0) {
        float hEa = smoothstep(uEndP.y - 4.0, uEndP.y, hS) * mix(uEndP.w, 1.0, smoothstep(uEndP.y, uEndP.z, hS));
        float hEf = max(-N.z, 0.0); hEf = hEf * sqrt(hEf);
        float hEr = hEf + uFlyP.y + 0.5 * max(N.y, 0.0) * smoothstep(150.0, 160.0, hS);
        c += mix(albedo, vec3(max(hLum, 0.10) * 1.2), 0.75) * vec3(0.40, 0.52, 0.74) * (uEndP.x * hEa * hEr * (0.6 + 0.4 * hValue));
      }
      // ---- 5. the house lit: a little warm bounce in the auditorium; other people's local lights at the share the light state gives
      // THE HIGH ROOM (second look). The key painting's ceiling is the cool half of the picture: a blue-green night with pearl cloud between gold
      // ribs, over the amber of the tiers. Ours took the lit room's warm bounce and little else, and a painted sky under amber is brown. So above
      // the cornice the warm bounce is held back and the night's own light takes its place: the moonlit cloud that stands in the tear, a blue
      // pearl, on everything up there by the share of the moon it takes. The water mirrors this ceiling: it is what makes the glass green.
      // (gilt up there takes the candles' bounce instead, and more of it than paint does: a rib is a line of old gold across the blue, never a green one)
      float hGilt = clamp(uKeep.w * 1.6, 0.0, 1.0);
      c += albedo * uFillCol * (uTake.w * hHouse * mix(1.0, mix(uHighP.y, uHighP.z, hGilt), hHigh));
      c += albedo * uHighCol * (uHighP.x * hHigh * (1.0 - hGilt) * min(uTake.z, 2.4) * (0.6 + 0.4 * min(uShaft.w, 1.3)));
      vec3 hLan = pointLight(uLanternPos, uLanternColor, uLanternRadius, N);
      vec3 hOthers = lamps - hLan - pointLight(uLampPos, uLampColor, uLampRadius, N);      // lustres, the fire in the tree, the stage moon
      float hShare = hS < 93.0 ? mix(uPoolP.w, 1.0, smoothstep(89.0, 93.0, hS)) : 1.0;     // (on the stage the stage moon is taken whole)
      c -= albedo * hOthers * (1.0 - hShare);
      c += (hAlbL - albedo) * hOthers * (hShare * (1.0 - smoothstep(89.0, 93.0, hS)));      // in the house their light is candlelight too: warm on green things (the stage moon's pearl is left as it is)
      // the bow lantern: a pool, not a wash. The engine lights everything within seven metres at nearly full strength, which turns
      // a pier three metres off into an orange slab; here it is whole at arm's length and a third by three and a half metres
      vec3 hLv = uLanternPos - vWPos;
      float hLanK = 1.0 - uLanternK * (1.0 - 1.0 / (1.0 + dot(hLv, hLv) / 6.0));
      // (fourth look: in the fly tower the lantern is the only warm light and it hangs a metre over the water. On what stands away from the boat (the walls, the rope
      // walls, the galleries) its light lies at the water and dies upward: a warm pool along the foot of the wall nearest the boat, plum above it. It lit the wall
      // five metres off and the wall twenty metres off the same brown from the water to the gallery. What hangs over the boat itself, the cloths, takes it whole.)
      hLanK *= mix(1.0, uFlyP.w + (1.0 - uFlyP.w) * exp(-max(hY - 1.0, 0.0) / uFlyP.z), hFly * smoothstep(4.5, 9.0, length(hLv.xz)));
      c += hLan * (hAlbL * hLanK - albedo);
      #ifdef HOUSE_WAKE
      { // ---- 6. water-light: the web moving water throws up a wall from the waterline, higher and brighter where the water is lively
        vec2 hUv = (vWPos.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
        float hE = (hUv.x > 0.0 && hUv.x < 1.0 && hUv.y > 0.0 && hUv.y < 1.0) ? texture2D(tRipple, hUv).a : 0.0;
        // the walls keep a record of the wake arriving (the wake record in lib.js); what stands in the open water answers a moving boat near it
        vec4 hRec = texture2D(tWake, vec2(clamp(hS / uWakeLen, 0.0, 1.0), 0.5));
        bool hWall = hD > ((hS > 30.0 && hS < 90.0) ? 0.55 * hF.r : 6.0);
        float hBy = uStir * (1.0 - smoothstep(3.0, 13.0, distance(vWPos.xz, uBoat.xz)));
        float hLive = clamp(max(hE * 4.0, hWall ? (vWPos.x < 0.0 ? hRec.r : hRec.g) : hBy), 0.0, 1.0);
        float hBand = smoothstep(mix(uWakeH.x, uWakeH.y, hLive), 0.0, hY) * smoothstep(-2.5, -0.2, hY) * smoothstep(0.55, 0.0, N.y);      // never on low level surfaces
        if (hBand > 0.002) {
          vec3 hCw = pow(abs(N), vec3(4.0)); hCw /= (hCw.x + hCw.y + hCw.z);
          vec3 hCq = vWPos * uWakeP.z; float hCt = uTime * uWakeP.w;
          float hCst = min(causticAt(hCq.zy, hCt) * hCw.x + causticAt(hCq.xz, hCt) * hCw.y + causticAt(hCq.xy, hCt) * hCw.z, 4.0);
          vec3 hWc = mix(uWakeCol, uWakeStage, smoothstep(88.0, 93.0, hS) * (1.0 - smoothstep(118.0, 123.0, hS)));
          hWc = uWakeRose * (1.0 - smoothstep(2.0, 18.0, hS)) + hWc * smoothstep(8.0, 28.0, hS);       // the foyer: the town's rose fails, the house's pearl grows
          c += hWc * hCst * uWakeP.x * hBand * (uWakeP.y + (1.0 - uWakeP.y) * hLive) * (0.35 + 0.65 * albedo) * uTake.x;
        }
      }
      #endif
    }`,
  };
}
