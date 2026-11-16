// The theatre of leaves: the hero pieces of the stage and the orchestra pit (stage 2, "the other hero pieces").
// The log is docs/build/theatre/2-heroes-stage.md: what stands where, what was changed from the page, what the cast and the
// staging need to know.
//
// What is here:
//   PAINTED SCENERY, hanging     the backcloth the boat pushes through (six sewn widths, two pictures, its seams opening round
//                                the prow), five blossom borders with cut hems, three old cloths in the fly tower. One mesh and
//                                one draw call each; cloth is `scenery()` below: canvas with a weave, seams, a tide line, a raw
//                                back the paint shows through, and light coming through it from behind.
//   the wash through the backcloth (the eye's distance from the cloth; the staging owns the rest of that moment)
//   MODELS (source-art/models/theatre/, assets/models/theatre/): see PIECES below; each takes its stand-in out when it stands.
//   THE RIG                      every line that carries a load (cloud cars, the moon's wire, cloth lines, counterweight
//                                lines, each sandbag's rope) is one mesh rebuilt each frame from the loads' own named points:
//                                no line moves without its load and no load without its line. (makeLines; drawn crisp)
//   THE ROPE WALLS               the fly tower's hanging ropes and the last rope: one static mesh that sways and is pushed
//                                aside by the hull in the vertex shader (makeRopes)
//   THE PIT'S WATERLINE AND LIGHT   what stands in the orchestra's water is dark and slimed below it, wet at it, and lit by
//                                the stage boxes' candles above it (PIT_PARS, PIT_ALBEDO, PIT_LIGHT); each piece sinks into the
//                                water in its own way (pit(): sink, line, gain, through)
//   THE FLY TOWER BY LANTERN LIGHT  what hangs and stands beyond the backcloth takes the bow lantern as a flame's light in a dark
//                                room, from the tower's first metre (towerExt, dressT)
// Five people have held this module: the log says who made what. What each pass needs: a cloth's close detail (threads, creases,
// cracks, mends) is drawn only in the rider's own picture (uScPass), not in the engine's first picture or the water's mirror.
//
// A first, slow motion for everything that turns, hangs or travels is in update(); the cast and the staging take it from
// there through shared.stageRig (see the end of build()).
//
// Developer switches (with ?realm=theatre):  &hs=cloths,flats  build only these of this module's parts (cloths, flats, pit, cars, moon, kit, ropes, rollers);
//   &roll=<degrees>  hold the wave rollers at an angle (two stills prove which way they turn);  &car=<0..1>  hold the cloud cars
//   at a share of their travel;  &fly=<0..1>  hold the fly cloths;  &moonu=<0..1>  hold the stage moon on its wire.
//   &harpsoft=1  the harp under the painter's filter from everywhere (it is drawn as carved within six metres).
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';
import { NOISE_GLSL } from '../../engine/kit.js';
import { at, house, dev } from './lib.js';

const M = 'models/theatre/';
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const f4 = (n) => Number(n).toFixed(4);

// ================================================================================================ stage moonlight
// The stage is the cool half of the picture: its key is the paper moon on its wire. heroes.js carries a small ctx.light with its
// stand-in moon (radius 17 m), which leaves borders and flats black. So everything this module builds takes the moon's light
// from its own uniforms as well: a broad pearl light from where the moon box is, on what faces it; painted cloth lets it through.
const MOON_FRAG_PARS = /* glsl */`
  uniform vec4 uSmPos, uSmP; uniform vec3 uSmCol;           // where the stage moon is and how far it reaches; its colour times how brightly it burns; (the fill it gives the stage, the route's s where the backcloth stops it)
  float smStage() { return smoothstep(-uSmP.y - 0.9, -uSmP.y - 0.2, vWPos.z) * (1.0 - smoothstep(-90.5, -86.0, vWPos.z)); }      // the stage: from the proscenium to the backcloth (the route runs down -z)
  vec3 stageMoon(vec3 n) {
    vec3 d = uSmPos.xyz - vWPos; float dist = length(d); float att = 1.0 - smoothstep(uSmPos.w * 0.15, uSmPos.w, dist);
    return uSmCol * (att * att * max(dot(n, d / max(dist, 1e-3)) * 0.6 + 0.4, 0.0)) * smStage();
  }
  vec3 stageFill() { return uSmCol * uSmP.x * smStage(); }  // moonlight come back off the water and the cloths: the stage is never black once the moon is lit`;
const MOON_LIGHT = /* glsl */`
    c += albedo * (stageMoon(N) + stageFill());`;

// ================================================================================================ the pit: its waterline and its light
// The instruments stand in 1.2 m of water. The water near the hull is clear, so what is under it showed as bright as what is over
// it and nothing said where the surface was: here everything of the pit is dark and slimed below the water, wet and darker in the
// hand's breadth the ripples keep wet, and carries the pale line the water leaves as it falls. Its light: before the hour the
// house's own (pearl and green, the wet gleam); once the stage boxes' candle branches burn four metres over it (show clock 18 to
// 21), their gold on what stands out of the water, most on what looks up; and polished metal gives the bow lantern back from
// further off than the room's paint does.
// (Fifth holder: EACH PIECE SINKS IN ITS OWN WAY: uPitD. The harp and the bass stand a metre out of the water and their drowned halves are ghosts.
// A music stand's whole desk is in the first hand's breadth under the surface, where the ride's clear water shows the cast's page on it at its
// full value: sunk to black there, the brass lyre lay on a pale card like a sign on a target. A stand's brass now goes down through the water as
// brass, halved a hand under and gone by the floor. And the pale line the water leaves is drawn a hand above the surface: just where a
// kettledrum's tap handles and a stand's volutes are, which it painted cream from end to end. Those two wear the mark their own models carry.)
const PIT_PARS = /* glsl */`
  uniform vec4 uPit, uPitD; uniform vec3 uPitCol, uPitMen, uPitK;      // (the stage boxes' candles' share, the lantern's, the kindled house's, ); how it sinks: (its paint just under the water, per metre of depth, its light just under, per metre); the candles' colour; the light the water's edge holds; (the pale line a hand above the water, how much of the pit's candlelight this thing gives back: polished brass strap more than a carved gilt harp, 1: that light goes down through the water with it and dies as it sinks, 0: it stops at the surface)`;
const PIT_ALBEDO = /* glsl */`
    { float pY = vWPos.y, pUnder = 1.0 - smoothstep(-0.05, 0.03, pY), pWet = (1.0 - smoothstep(0.05, 0.12, pY)) * (1.0 - pUnder);
      float pLine = exp(-pow((pY - 0.135) / 0.013, 2.0)) * (0.5 + 0.5 * sin(vWPos.x * 37.0 + vWPos.z * 23.0)) * uPitK.x;
      albedo = mix(albedo, albedo * vec3(0.8, 1.13, 1.0) * uPitD.x * exp(uPitD.y * min(pY + 0.04, 0.0)), pUnder * 0.92);      // (and darker with every hand's breadth of depth: what stands out of the water is the thing, what is under it a ghost of it)
      albedo = mix(albedo, albedo * 0.5, pWet);
      albedo = mix(albedo, albedo * 0.6 + vec3(0.34, 0.36, 0.31), clamp(pLine, 0.0, 1.0) * 0.5); }`;
const PIT_LIGHT = /* glsl */`
    { float pAbove = mix(smoothstep(-0.02, 0.10, vWPos.y), 1.0, uPitK.z);
      vec3 pL = normalize(vec3(sign(vWPos.x) * 0.55, 0.72, -0.42));                                 // (the stage box stands outward of each group, toward the stage, and above)
      c += albedo * uPitCol * (uPit.x * uPitK.y * pAbove * (0.2 + 0.8 * max(dot(N, pL), 0.0)));
      // (Fourth holder.) and the kindled house itself: five tiers of flame behind the pit and above it, a broad amber on what looks back up the
      // room. The stage boxes light the far side of everything as it is seen from the composed line: without this the harp, eleven metres off,
      // was a dim brown shape and the pale pages on the stands were what the eye found.
      vec3 pH = normalize(vec3(-sign(vWPos.x) * 0.3, 0.5, 0.82));
      c += albedo * uPitCol * (uPit.z * uPitK.y * pAbove * (0.15 + 0.85 * max(dot(N, pH), 0.0)));
      c += albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * (uPit.y * pAbove);
      // under the water everything sinks into the dark with depth (the room's own light gives every surface a floor of the air's colour,
      // and the water near the hull is clear: without this a stand a metre down was as bright as its candle cup)
      c *= mix(1.0, uPitD.z * exp(uPitD.w * min(vWPos.y, 0.0)), 1.0 - smoothstep(-0.05, 0.0, vWPos.y));
      // and where the water stands against it, the thread of light a meniscus holds: the one line that says where the surface is
      c += uPitMen * (exp(-pow((vWPos.y - 0.006) / 0.009, 2.0)) * (0.55 + 0.45 * sin(vWPos.x * 53.0 + vWPos.z * 41.0 + uTime * 0.7))); }`;

// ================================================================================================ painted cloth
// Scenery cloth is gouache in the house's light with one more extension. What it adds:
//   in the vertex shader   the slow stir of hanging cloth and soft pleats that shade; a rise or fall of the whole cloth on its
//                          lines (uRise, per cloth); seams that open round the hull (SC_PART), or a hem that rides up over it (SC_LIFT)
//   in the picture         the canvas itself: a weave that shows only close to, slubs, each sewn width a shade apart, the seam's
//                          lapped edge and its line of stitches, the tide line where it stands in the water, and on its back the
//                          raw cloth with the paint showing through, reversed
//   in the light           what the lights on its far side send through it (the lantern once the boat is behind it, the lamp and
//                          the stage moon seen from the fly tower), and from behind, the lit house as a warm ground
const SC_VERT_PARS = /* glsl */`
  attribute vec4 aCloth;                      // how free it hangs (0 pinned .. 1 hem), phase, v (0 top .. 1 hem), which cloth
  attribute vec2 aAcross;                     // metres across from its own middle; metres down from its top
  uniform vec2 uScAcross; uniform vec3 uScSway; uniform float uRise[8]; uniform vec4 uPartA, uPartB;
  varying vec4 vSc; varying float vScFold;`;
const SC_VERT = /* glsl */`{
      float free = aCloth.x, ph = aCloth.y, vv = aCloth.z, a = aAcross.x;
      vec2 acr = uScAcross, alo = vec2(acr.y, -acr.x);                                   // across the route (to the right), and down it
      wp.y += uRise[int(aCloth.w + 0.5)];
      // slow folds travelling down the cloth, a lazy stir of the hem; and the hang of old cloth: soft bags and pleats, deeper toward the
      // hem, that stay where they are and shade as folds do
      float fold = sin(uTime * uScSway.y * 6.3 + ph + vv * 5.0 + a * 0.31) * 0.6 + sin(uTime * uScSway.y * 3.9 + ph * 1.7 + vv * 2.2 - a * 0.17) * 0.4;
      float k = (0.3 + 0.7 * vv) * uScSway.z, pa = a * 2.3 + ph * 1.7 + vv * 1.5, pb = a * 5.9 + ph * 4.1 - vv * 2.0, pc = a * 0.83 + ph + vv * 0.6;
      float slope = (0.030 * 2.3 * cos(pa) + 0.013 * 5.9 * cos(pb) + 0.05 * 0.83 * cos(pc)) * k;         // how the cloth leans across, from its pleats (and below, from the folds it gathers in)
      wp.xz += alo * (fold * uScSway.x * free + (0.030 * sin(pa) + 0.013 * sin(pb) + 0.05 * sin(pc)) * k);
      wn.xz += acr * slope;                                                              // (the normal looks back up the route: it leans across by the fold's slope)
      #ifdef SC_PART
      if (uPartA.w > 0.0) {
        // The hull meets the cloth: the seam nearest the boat opens like a tent flap and the widths either side are pushed
        // aside whole (they gather in folds; nothing stretches). x: where along the hull the cloth's plane cuts it.
        float xs = uPartA.x, ba = uPartA.y, x = -uPartA.z;
        float hull = 0.84 * sqrt(max(0.0, 1.0 - pow((x - 0.35) / 2.3, 2.0)));
        float top = abs(xs) < 0.1 ? uPartB.y : uPartB.z;                                 // the middle seam is split to its top; the others have opened from the hem
        // A tent door, not a sliding one: the hull holds the cloth aside up to the gunwale; above it the flaps fall back in, to a pointed
        // arch a little over the rider's head, and from there a slit that closes toward the top of the split.
        float tall = clamp((top - wp.y) / top, 0.0, 1.0), low = 1.0 - smoothstep(0.15, 2.2, wp.y);
        float sd = a < xs ? -1.0 : 1.0, taper = mix(0.16 * tall, 1.0, low) * (1.0 + 0.07 * sin(wp.y * 2.3 + sd * 1.3) + 0.04 * sin(wp.y * 5.3 + sd * 0.6));
        float h = hull * 1.12 + 0.08 * smoothstep(0.0, 0.2, hull), e = smoothstep(0.0, 0.35, hull);
        float c0 = mix(xs, ba, e), hold = uPartB.x * pow(tall, 0.7);                       // (after the stern is through the halves hang apart from the water to the top of the split: a seam of gold)
        hold = max(hold, abs(xs) < 0.1 ? (0.011 + 0.03 * exp(-max(wp.y, 0.0) / 1.3)) * (1.0 + 0.5 * sin(wp.y * 1.3 + 0.7) + 0.25 * sin(wp.y * 3.7 + 2.0)) * (1.0 - smoothstep(1.0, top, wp.y)) : 0.0);       // at rest the split seam hangs a finger apart, more here and less there, and gapes a hand at the water where the current has worked at it: a dark slit
        // (a boat that arrives beside the seam drags that width's edge across its bow to its far side: the whole of that is drawn aside like a swag, not slid like a door)
        float A = a < xs ? max(max(0.0, xs - c0 + h) * taper, hold) : max(max(0.0, c0 - xs + h) * taper, hold);
        float dist = abs(a - xs), L = max(0.8, 1.4 * A), sh = A * exp(-dist / L), g = sh / L;
        wp.xz += acr * (sd * sh);
        float belly = 0.34 * hull * taper * exp(-dist / 0.9), fa = dist * 11.0 + sd * 1.1 + wp.y * 0.9, fb = dist * 6.1 + sd * 2.3 - wp.y * 0.5;      // the cloth bellies ahead of the bow; what is pushed aside gathers in folds that lean as they fall, no two alike
        float gather = ((cos(fa) * 0.8 + cos(fb) * 0.33) * g - belly / 0.9) * sd;
        wp.xz += alo * ((sin(fa) * 0.073 + sin(fb) * 0.054) * g + belly);
        wn.xz += acr * gather; slope += gather;
        // (Sixth holder.) THE TWO EDGES OF A SPLIT DO NOT HANG IN ONE PLANE. A cut edge of old painted cloth curls: here it stands a hand toward the house and
        // there it falls away from it, and the other edge does the opposite, so that the two lap over one another by turns. Hanging dead flat, edge to edge, the
        // split was a ruled dark line from the top of postcard 8 to the water; now the lantern lays one lip light and the other in its shade, the gap shows and is
        // covered by turns, and where a lip stands forward its raw back shows a finger wide. (Only the seam nearest the boat: the one that is drawn.)
        float cz = wp.y * 1.15 + xs * 1.7;
        float lip = exp(-dist / 0.17) * (1.0 - smoothstep(top - 1.6, top - 0.2, wp.y)) * smoothstep(-0.2, 0.5, wp.y) * (0.040 * sin(cz) + 0.024 * sin(cz * 2.3 + 1.3) + 0.012 * sin(cz * 5.1 + 0.4)) * (1.0 - 0.8 * e);
        wp.xz += alo * (sd * lip);
        wn.xz += acr * (-lip / 0.17); slope += -lip / 0.17;
        // ... nor is either edge a ruled line: each wanders a finger's breadth of its own as it falls, so the gap is here a thread, there a thumb, there shut
        float lenv = (1.0 - smoothstep(top - 1.6, top - 0.2, wp.y)) * smoothstep(-0.3, 0.4, wp.y) * exp(-dist / 0.55) * (1.0 - 0.8 * e);
        wp.xz += acr * (lenv * (0.013 * sin(wp.y * 3.7 + sd * 1.9 + xs) + 0.008 * sin(wp.y * 8.3 + sd * 0.7) + 0.005 * sin(wp.y * 17.0 + sd * 2.6)));
      }
      #endif
      #ifdef SC_LIFT
      { // a hem that hangs in the boat's way rides up over it and falls back behind
        vec2 rel = wp.xz - uBoat.xz; float near = exp(-dot(rel, rel) / 3.4) * smoothstep(2.8, 0.4, wp.y) * free;
        wp.y += near * 1.7; wp.xz += alo * (near * 0.5);
      }
      #endif
      vSc = vec4(a, aAcross.y, vv, aCloth.w); vScFold = slope;
    }`;
const SC_FRAG_PARS = /* glsl */`
  varying vec4 vSc; varying float vScFold;
  uniform vec4 uScSeam, uScWet, uScThrough, uScAge, uScEdge, uScRake, uScSide; uniform vec3 uScCanvas, uScGlow, uScNight; uniform sampler2D tScL, tScR; uniform float uScPass, uScMoonK; uniform vec2 uScAcross, uScFoldK; uniform vec3 uScNightK;       // uScFoldK: how far the panels between its old creases lean (down, across); uScNightK: the first, second and third cloth of a group's share of the night through its pale paint
  float scReliefA, scReliefV;                                  // how the cloth's surface leans, across and downward, for a light that rakes it: its pleats, a lapped seam's two edges, the creases of old folding
  ${NOISE_GLSL}
  ${MOON_FRAG_PARS}`;
// (N is already turned toward the eye for a two-sided material; `scBack` is true when the eye is on the raw side)
const SC_ALBEDO = (two) => /* glsl */`
    bool scBack = dot(vWNormal, uCameraPos - vWPos) < 0.0;
    vec3 scPic = albedo;
    scReliefA = vScFold; scReliefV = 0.0;
    {
      ${two ? 'vec4 scL = texture2D(tScL, vUv0), scR = texture2D(tScR, vec2(vUv0.x - 1.0, vUv0.y)); scPic *= mix(scL.rgb, scR.rgb, step(1.0, vUv0.x));' : ''}
      bool scTape = vColor.r > 1.5;                                        // (a tape sewn to it: its vertex colour is its own cotton plus two)
      if (scTape) scPic = (vColor.rgb - 2.0) * 0.8;                        // (fifth holder: 0.8, was 0.5. Unbleached cotton tape is the palest thing on an old cloth: at half its value the ties read as scratches in the paint)
      float a = vSc.x, dn = vSc.y, px = max(fwidth(a), fwidth(dn));                     // metres across, metres down, metres a pixel covers
      // the sewn widths: each a shade apart, a lapped edge 5 cm wide, a line of stitches
      float seamOn = step(0.01, uScSeam.x), sw = mix(1000.0, uScSeam.x, seamOn);                    // (no seams: one width a kilometre wide)
      float sq = (a - uScSeam.y) / sw, sdist = abs(fract(sq + 0.5) - 0.5) * sw, wid = floor(sq + 0.5);
      float shadeW = 0.94 + 0.12 * hash11(wid * 7.31 + vSc.w * 3.7 + 1.3);
      float lap = (1.0 - smoothstep(0.045, 0.055 + px, sdist)) * step(0.0, fract(sq + 0.5) - 0.5);
      float line = 1.0 - smoothstep(0.004 + px * 0.5, 0.011 + px, sdist);
      float st = smoothstep(0.25, 0.4, abs(fract(dn / 0.028) - 0.5)) * (1.0 - smoothstep(0.012, 0.02, abs(sdist - 0.03))) * (1.0 - smoothstep(0.004, 0.012, px));
      vec3 cloth = scPic * mix(1.0, shadeW * (1.0 - 0.10 * lap) * (1.0 - 0.5 * line) * (1.0 + 0.25 * st), seamOn);
      { // (a lapped seam is two thicknesses of cloth a thumb wide: under a raking light its two edges are a lit line and a shadowed one)
        float lw = max(0.006, 1.5 * px), lside = step(0.0, fract(sq + 0.5) - 0.5);
        scReliefA += uScRake.w * seamOn * (exp(-(sdist - 0.05) * (sdist - 0.05) / (lw * lw)) * lside - exp(-sdist * sdist / (lw * lw))) * (scBack ? -1.0 : 1.0); }
      // (WHAT EACH PASS NEEDS: the picture the engine takes first, without the water, and the water's mirror show a cloth as its picture
      // and its light; threads, slubs, creases, cracks and mends are for the picture the rider sees: uScPass 0)
      #ifdef SC_FAR
      bool scFull = false;                                                 // (a cloth that hangs ten metres up: none of this can be seen there)
      #else
      bool scFull = uScPass < 0.5;
      #endif
      // the canvas: threads (seen only close to), slubs along warp and weft, a soft unevenness
      float th = 0.0052, fine = (1.0 - smoothstep(0.35, 0.9, px / th));
      float weave = sin(a * 6.2832 / th) * sin(dn * 6.2832 / th);
      float slub = 0.0, cloud = 0.0;
      if (scFull) {
        slub = (vnoise(vec2(a * 9.0, dn * 260.0)) - 0.5) + (vnoise(vec2(a * 260.0 + 7.0, dn * 9.0)) - 0.5);
        slub *= 1.0 - smoothstep(0.004, 0.03, px);
        cloud = vnoise(vec2(a * 0.9 + vSc.w * 5.0, dn * 0.7)) - 0.5;
      }
      cloth *= 1.0 + uScSeam.z * (0.10 * weave * fine + 0.09 * slub) + 0.10 * cloud;
      // the raw back: unpainted cloth, the paint showing through it, reversed and greyed
      if (scBack) { float l = dot(scPic, vec3(0.3, 0.55, 0.15)); cloth = uScCanvas * mix(vec3(0.55 + 0.9 * l), 0.4 + 1.2 * scPic, 0.45) * (1.0 + 0.16 * weave * fine + 0.14 * slub + 0.12 * cloud) * mix(1.0, shadeW * (1.0 - 0.3 * line), seamOn); }
      // mends: here and there a patch sewn on, a shade off, its edge a line of stitches
      if (uScSeam.w > 0.0 && scFull) {
        vec2 pg = vec2(a / 3.3 + 0.37, dn / 2.6 + 0.21), pi = floor(pg), pf = fract(pg) - 0.5;
        float ph1 = hash21(pi + vSc.w * 17.0), ph2 = hash21(pi + 3.7 + vSc.w * 5.0);
        vec2 pHalf = vec2(0.055 + 0.07 * ph2, 0.04 + 0.09 * fract(ph2 * 7.3)) * vec2(3.3, 2.6), pq = (pf - (vec2(ph1, fract(ph1 * 5.1)) - 0.5) * 0.5) * vec2(3.3, 2.6);
        pq = abs(pq) - pHalf;                                       // metres outside the patch (negative inside)
        float inside = step(max(pq.x, pq.y), 0.0) * step(1.0 - uScSeam.w, ph1), edge = -max(pq.x, pq.y);
        float stitch = (1.0 - smoothstep(0.008, 0.016 + px, abs(edge - 0.02))) * smoothstep(0.2, 0.35, abs(fract((pq.x > pq.y ? dn : a) / 0.03) - 0.5));
        cloth = mix(cloth, (cloth * 0.55 + 0.45 * dot(cloth, vec3(0.34)) * vec3(1.04, 1.0, 0.92)) * (0.9 + 0.3 * ph2), inside);
        cloth *= 1.0 - inside * (0.35 * stitch + 0.25 * (1.0 - smoothstep(0.0, 0.006 + px, edge)));
      }
      // ---- age. It lay folded for years between its seasons: creases where the paint cracked and rubbed pale, a grid of them, none
      // quite straight, here cracked through and there only a ghost of a fold
      float scTint = scTape ? 1.0 : dot(vColor.rgb, vec3(0.3333));         // (a cloth hung dim is dim in everything: its bare canvas too)
      if (uScAge.x > 0.0 && scFull) {
        float cH = (dn + 0.16 * (vnoise(vec2(a * 0.31, vSc.w * 3.1)) - 0.5)) / 1.31, cV = (a + 0.14 * (vnoise(vec2(dn * 0.27, 7.0 + vSc.w)) - 0.5)) / 1.87;
        float dH = abs(fract(cH) - 0.5) * 1.31, dV = abs(fract(cV) - 0.5) * 1.87;
        float crease = max(1.0 - smoothstep(0.003, 0.011 + px, dH), 0.55 * (1.0 - smoothstep(0.003, 0.010 + px, dV)));
        float ghost = max(1.0 - smoothstep(0.0, 0.08, dH), 0.75 * (1.0 - smoothstep(0.0, 0.07, dV)));
        float gone = 0.12 + 0.88 * smoothstep(0.35, 0.75, vnoise(vec2(a * 2.3 + 5.0, dn * 2.3)));
        cloth = mix(cloth, cloth * 0.72 + uScCanvas * (0.34 * scTint), crease * gone * uScAge.x * (scBack ? 0.3 : 1.0));
        cloth *= 1.0 - 0.08 * ghost * uScAge.x;
        // (a crease is a ridge or a valley across the cloth, by turns: a light from below lays one side of it light and the other dark)
        scReliefV = (fract(cH) > 0.5 ? 1.0 : -1.0) * (mod(floor(cH), 2.0) < 1.0 ? 1.0 : -1.0) * exp(-dH / 0.045) * (0.3 + 0.7 * gone) * 0.09 * uScAge.x;
        // (Seventh holder.) IT LAY FOLDED LIKE A MAP, concertina-wise, for years between its seasons: the panels between its creases still lean by turns,
        // this one a little toward the stage floor and the next toward the grid, this one toward the prompt side and the next away from it. Under a light
        // that rakes it (the bow lantern, close and low) they are bands of light and shade a pace broad that turn over at every crease: the page's
        // "fold shadows". Without them a cloth six metres off was as flat as a wall, and one seen from under its hem was a painted slab.
        { float zV = mod(floor(cH), 2.0) < 1.0 ? 1.0 : -1.0, zA = mod(floor(cV), 2.0) < 1.0 ? 1.0 : -1.0, zK = 0.5 + 0.5 * gone;
          scReliefV += 0.22 * zV * smoothstep(0.0, 0.14, dH) * uScFoldK.x * zK;
          scReliefA += 0.22 * zA * smoothstep(0.0, 0.18, dV) * uScFoldK.y * zK;
          // (and under the stage's broad lights, which rake nothing: a panel that leans up is a shade lighter than its neighbour that leans down)
          cloth *= 1.0 + 0.28 * zK * (zV * smoothstep(0.0, 0.14, dH) * uScFoldK.x + zA * smoothstep(0.0, 0.18, dV) * uScFoldK.y) * (scBack ? -0.35 : 1.0); }      // (on its raw back, one plain tone, a third of that is plenty: at full strength the back was a tartan)
      }
      // close to, the distemper itself: a net of fine cracks in patches, and low down, where the water has been at it, flakes gone to the bare cloth
      float nearC = scFull ? (1.0 - smoothstep(0.0025, 0.011, px)) * uScAge.y : 0.0;
      if (nearC > 0.002 && !scBack) {
        vec2 cq = vec2(a, dn) / 0.05, ci = floor(cq), cf = fract(cq); float d1 = 8.0, d2 = 8.0;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)); float d = length(g + vec2(hash21(ci + g), hash21(ci + g + 17.3)) - cf); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; } }
        float crack = 1.0 - smoothstep(0.015, 0.06 + px * 12.0, d2 - d1);
        float patchy = smoothstep(0.35, 0.75, vnoise(vec2(a * 1.7 + 3.0, dn * 1.7)));
        cloth *= 1.0 - 0.36 * crack * patchy * nearC;
        float low = 1.0 - smoothstep(0.25, 1.3, vWPos.y);
        float fl = smoothstep(0.6, 0.7, vnoise(vec2(a * 41.0, dn * 41.0))) * smoothstep(0.52, 0.72, vnoise(vec2(a * 3.3 + 9.0, dn * 3.3)) + 0.22 * low) * (0.4 + 0.6 * crack);
        cloth = mix(cloth, uScCanvas * (scTint * (0.72 + 0.2 * hash21(ci))), fl * uScAge.z * nearC * (0.12 + 0.88 * low));
      }
      // the side hems: the cloth turned over a hand's breadth and sewn down; and the webbing its head is sewn into: jute, a brass eye every foot
      if (uScEdge.y > 0.0 && scFull) {
        float la = a - uScEdge.x * floor(a / uScEdge.x + 0.5), ed = uScEdge.y - abs(la);
        float hemE = 1.0 - smoothstep(0.045, 0.05 + px, ed);
        float stE = smoothstep(0.25, 0.4, abs(fract(dn / 0.028) - 0.5)) * (1.0 - smoothstep(0.004, 0.011, abs(ed - 0.04))) * (1.0 - smoothstep(0.004, 0.012, px));
        cloth *= (1.0 - 0.14 * hemE) * (1.0 + 0.3 * stE);
        if (dn < uScEdge.z) {
          float gx = abs(fract(a / 0.3) - 0.5) * 0.3, gr = length(vec2(gx, dn - uScEdge.z * 0.6));
          vec3 web = uScCanvas * (scTint * vec3(0.80, 0.72, 0.58)) * (1.0 + 0.22 * sin(a * 6.2832 / 0.009) * (1.0 - smoothstep(0.002, 0.009, px)));
          web = mix(web, vec3(0.40, 0.32, 0.15) * scTint, 1.0 - smoothstep(0.012, 0.015 + px, gr));
          web = mix(web, vec3(0.03, 0.03, 0.035), 1.0 - smoothstep(0.006, 0.008 + px, gr));
          cloth = mix(cloth, web, 1.0 - smoothstep(uScEdge.z - 0.004, uScEdge.z + px, dn));
        }
      }
      // folds shade: a pleat's far side is darker, its near side a little lighter (the stage's lights are broad and frontal; without
      // this old cloth hangs as flat as a wall)
      cloth *= 1.0 + clamp(vScFold * 1.5, -0.42, 0.26);
      // the tide line: wet and dark where it stands in the water, the damp creeping higher up the seams; where it ends, a thin
      // broken line of scum; the old high-water mark above it, faint
      if (uScWet.y > 0.0 && vWPos.y < 1.6) {                               // (only where the water can have reached)
        float wick = 0.10 * exp(-sdist / 0.12) * seamOn + 0.035 * (vnoise(vec2(a * 6.0, vSc.w * 9.0)) - 0.5) + 0.02 * (vnoise(vec2(a * 31.0, 1.7)) - 0.5);
        float hgt = vWPos.y - wick, wet = 1.0 - smoothstep(uScWet.x - 0.05, uScWet.x + 0.02, hgt);
        float broken = smoothstep(0.35, 0.7, vnoise(vec2(a * 4.3, 7.7 + vSc.w)));
        float scum = exp(-pow((hgt - uScWet.x - 0.012) / 0.011, 2.0)) * broken, old = exp(-pow((hgt - uScWet.x - 0.37) / 0.02, 2.0)) * (1.0 - broken) * 0.5;
        cloth = mix(cloth, cloth * vec3(0.50, 0.60, 0.58), wet * uScWet.y);
        cloth = mix(cloth, cloth * 0.8 + vec3(0.115, 0.12, 0.105) * (scTint * (0.6 + 0.8 * vnoise(vec2(a * 23.0, 3.1)))), (scum * 0.5 + old * 0.3) * uScWet.y);      // (a bloom of salt, uneven: as a pale line of one strength it read from the boat as a white scribble)
      }
      albedo = cloth;
    }`;
// (second: with the house's second light (light.js), whose uniforms uWarmP, uLanternK and uLampMore are read here)
const SC_LIGHT = (second) => /* glsl */`
    { // painted cloth takes the lantern and the lamp at a share: a pool of warm light on a cool picture, not a picture washed amber
      float scLs = uScThrough.z * (vSc.w > 2.5 ? uScAge.w : vSc.w > 1.5 ? uScSide.w : 1.0);          // (the second and the third of a group of cloths take less of the lantern: the fly tower's pictures go back into the cold dark one after another, and the last hangs almost dark)
      vec3 scLan = pointLight(uLanternPos, uLanternColor, uLanternRadius, N), scLamp = pointLight(uLampPos, uLampColor, uLampRadius, N);
      ${second ? /* glsl */`
      if (uScRake.z > 0.5) {
        // (Fourth holder.) THE LANTERN ON A PAINTING. The house lays the bow lantern on cool things as a warm grey of their own value, drawn in to a
        // pool (right for velvet and lacquer). Taking a share of the engine's lantern off again, as this did, left a painted sea brown wherever the
        // lantern reached and darker than before it came. So: what the house laid is taken off whole, and the lantern is laid on the paint's OWN
        // colour, at this cloth's share: petrol stays petrol and rose stays rose in a pool of warm light. And the lantern is close and low: it
        // RAKES the cloth, so that what leans toward it is lit and what leans away is not (pleats, a seam's lap, the creases of old folding).
        float scLum = dot(albedo, vec3(0.3, 0.55, 0.15)), scCool = clamp((max(albedo.g, albedo.b) - albedo.r) / max(scLum, 0.03) * 2.0, 0.0, 1.0);
        vec3 scWas = mix(albedo, vec3(scLum) * vec3(1.14, 0.95, 0.76), uWarmP.y * scCool);            // what the house laid the lantern on
        vec3 scLv = uLanternPos - vWPos; float scK = 1.0 - uLanternK * (1.0 - 1.0 / (1.0 + dot(scLv, scLv) / 6.0));      // and the pool it drew it in to
        vec3 scLh = normalize(scLv);
        float scRk = clamp(1.0 + uScRake.x * (scReliefA * dot(scLh.xz, uScAcross) - scReliefV * scLh.y) * (scBack ? -1.0 : 1.0), 0.3, 1.9);
        c += scLan * (albedo * (scLs * mix(1.0, scK, uScRake.y) * scRk) - scWas * scK);
      } else c -= albedo * scLan * (1.0 - scLs);
      // the kept lamp, which the house counts for more on the stage: at this cloth's share, and falling away to one side of it (uScSide: the
      // backcloth is amber on its right from the lamp and pearl on its left from the moon)
      { float scHs = smoothstep(91.0, 94.0, -vWPos.z) * (1.0 - smoothstep(119.3, 121.0, -vWPos.z)) * step(91.0, -vWPos.z) * step(-vWPos.z, 121.0);
        c += albedo * scLamp * ((1.0 + scHs * uLampMore) * (uScThrough.w * mix(uScSide.z, 1.0, smoothstep(uScSide.x, uScSide.y, vSc.x)) - 1.0)); }` : /* glsl */`
      c -= albedo * (scLan * (1.0 - scLs) + scLamp * (1.0 - uScThrough.w));`}
      // light through the cloth from its far side: the paint is the filter, the canvas warms it
      vec3 scNb = -N;
      vec3 scFar = pointLight(uLanternPos, uLanternColor, uLanternRadius, scNb) + pointLight(uLampPos, uLampColor, uLampRadius, scNb);
      for (int i = 0; i < ${8}; i++) { if (i >= uLightCount) break; scFar += pointLight(uLights[i].xyz, uLightColors[i], uLights[i].w, scNb) * uScThrough.y; }
      vec3 scThin = pow(max(mix(vec3(dot(scPic, vec3(0.3, 0.55, 0.15))), scPic, 0.5), vec3(0.02)), vec3(1.25)) * vec3(1.0, 0.86, 0.66);      // (distemper is nearly opaque: what comes through is the canvas's own warm light, thinned by the paint, with half its colour)
      c += scThin * scFar * uScThrough.x;
      c += albedo * (stageMoon(N) * uScMoonK + stageFill() * (scBack ? 0.25 : 1.0)) + scThin * stageMoon(scNb) * uScThrough.x;      // stage moonlight on it (uScMoonK: at a strength of its own), and through it
      if (scBack) c += scThin * uScGlow * (0.55 + 0.45 * smoothstep(9.0, 0.0, vWPos.y));          // the lit house beyond it, strongest low where the proscenium opens
      // the fly tower stands open to the night at its far end: that comes through an old cloth from behind and lies on its back. PALE PAINT
      // IS THIN PAINT: the painted moon, the foam, a snow sky let it by and glow cold, the dark sea stops it; more of it high on the cloth than
      // low (it comes in over the walls' ragged end), so the lantern's gold has the foot of the picture and the night its head; and a cloth hung
      // dimmer shows less of it. (Third holder: it was a breath, 0.09 of a slate, through the warm canvas: nothing glowed and postcard 9 was one dim brown-blue.)
      { float scT2 = vColor.r > 1.5 ? 1.0 : dot(vColor.rgb, vec3(0.3333));
        float scPale = clamp(dot(scPic, vec3(0.3, 0.55, 0.15)) / max(scT2, 0.05), 0.0, 1.0);
        c += scBack ? albedo * 0.55 * uScNight : uScNight * ((0.16 * scPale + 1.3 * smoothstep(0.42, 0.85, scPale)) * (0.3 + 0.7 * smoothstep(3.5, 9.5, vWPos.y)) * min(scT2 * 2.0, 1.0) * (vSc.w > 2.5 ? uScNightK.z : vSc.w > 1.5 ? uScNightK.y : uScNightK.x)); }      // (uScEdge.w: the second cloth of a group takes more of it: fifth holder, below)
    }`;

// ---- painted canvas on a frame (the wing flats): the same canvas, standing still. `front`: the painted face; `back`: the raw
// back, where the paint shows through reversed and the light on the painted side comes through.
const FLAT_PARS = /* glsl */`
  uniform vec4 uFlLight; uniform vec3 uFlGlow, uFlCanvas; uniform vec2 uFlBack; vec3 flPic;
  ${NOISE_GLSL}
  float flSlub() { vec2 q = vWPos.xy; float px = max(fwidth(q.x), fwidth(q.y));
    return ((vnoise(vec2(q.x * 9.0, q.y * 260.0)) - 0.5) + (vnoise(vec2(q.x * 260.0 + 7.0, q.y * 9.0)) - 0.5)) * (1.0 - smoothstep(0.004, 0.03, px)) + 0.9 * (vnoise(q * 0.8) - 0.5); }`;
const FLAT_FRONT = { fragmentPars: FLAT_PARS,
  albedo: /* glsl */`
    albedo *= 1.0 + 0.09 * flSlub();`,
  light: /* glsl */`
    c -= albedo * (pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * (1.0 - uFlLight.z) + pointLight(uLampPos, uLampColor, uLampRadius, N) * (1.0 - uFlLight.w));` };
const FLAT_BACK = { fragmentPars: FLAT_PARS,
  albedo: /* glsl */`
    flPic = albedo;
    albedo = uFlCanvas * mix(vec3(0.55 + 0.9 * dot(flPic, vec3(0.3, 0.55, 0.15))), 0.4 + 1.2 * flPic, 0.45) * (1.0 + 0.14 * flSlub());
    albedo *= mix(1.0, 0.55 + 1.5 * dot(flPic, vec3(0.3, 0.55, 0.15)), uFlBack.x);                 // (seventh holder: the painting shows through as a ghost of itself, dark where its paint is dark: a raw back was a pale blank)`,
  light: /* glsl */`
    { vec3 flNb = -N;
      vec3 flFar = pointLight(uLanternPos, uLanternColor, uLanternRadius, flNb) + pointLight(uLampPos, uLampColor, uLampRadius, flNb);
      for (int i = 0; i < ${8}; i++) { if (i >= uLightCount) break; flFar += pointLight(uLights[i].xyz, uLightColors[i], uLights[i].w, flNb) * uFlLight.y; }
      vec3 flThin = pow(max(mix(vec3(dot(flPic, vec3(0.3, 0.55, 0.15))), flPic, 0.5), vec3(0.02)), vec3(1.25)) * vec3(1.0, 0.86, 0.66);
      c -= albedo * (stageFill() * 0.75 + stageMoon(N) * uFlBack.y);                                // (a raw back takes little of the stage's fill: it is lit by what comes through it; and a share only of the paper moon, which hangs behind the flats: seen from upstage they were the palest shapes in the frame round the lit house)
      c += flThin * ((flFar + stageMoon(flNb)) * uFlLight.x + uFlGlow * smoothstep(-124.0, -92.0, vWPos.z) * (0.5 + 0.5 * smoothstep(10.0, 1.0, vWPos.y)));      // the lit house, through the proscenium, on its painted side
    }` };

/**
 * Hanging painted cloths as ONE mesh. list: [{ top: Vector3 (the middle of the top edge), width, drop, tilt (radians: one end
 * lower), nx, ny, low (2: its rows closer together toward the hem), uv(u, v) -> [U, V] (u 0 left .. 1 right as the house sees it, v 0 top .. 1 hem), tint, stiff 0..1, id (0..7:
 * which uRise it travels with), mid (metres of its own middle from the group's middle seam) }].
 * opts: kind (the house's paint), map | maps: [left, right] (two pictures side by side: U 0..1 the left, 1..2 the right),
 *       cutout, part: 'seams' | 'lift' | null, seam: [width of a sewn width, offset] | null, wet: 0..1, sway: [metres, speed],
 *       canvas: the raw back's colour, through: [how much light comes through, the share of local lights], weave: 0..1
 * Returns { mesh, material, U (its own uniforms) }.
 */
function scenery(ctx, H, SM, list, opts = {}) {
  const o = { kind: 'rose', map: null, maps: null, cutout: false, part: null, seam: null, wet: 0, sway: [0.04, 0.2], hang: 1, patches: 0, lights: [1, 1], canvas: '#8f866f', through: [0.5, 1], weave: 1, take: [0, 0, 1, 0],
    age: [0, 0, 0], edge: [0, 0, 0], night: null, tapes: null, moonK: 1, rake: [0, 0, 0, 0], side: [-1000, -999, 1], ...opts };      // rake: [how strongly a raking lantern shows the cloth's relief, 1: the lantern in the house's pool, 1: the lantern laid on the paint's own colour (SC_LIGHT), a seam's relief]; side: the kept lamp's share falls to side[2] of itself from side[1] to side[0] metres across
  const pos = [], nor = [], uv = [], col = [], cloth = [], across = [], idx = [], c = new THREE.Color(), HEM = 6;
  for (const b of list) {
    const q = ctx.path.at(Math.min(ctx.path.length, Math.max(0, b.s))), base = pos.length / 3, nx = b.nx, ny = b.ny, tan = b.tilt ? Math.tan(b.tilt) : 0;
    const rows = ny + (b.hem ? HEM : 0);                                   // (hem: the radius of the batten sewn into its foot: six more rows wrap the pocket round it)
    c.set(b.tint || '#ffffff');
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= nx; i++) {
      const u = i / nx, r = Math.min(1, j / ny), v = b.low ? 1 - Math.pow(1 - r, b.low) : r, x = (u - 0.5) * b.width, y = -v * b.drop + tan * x, t = b.uv(u, v);      // (low: rows closer together toward the hem)
      // the pocket: the cloth comes down, goes round the batten behind it and is sewn back on itself
      const th = j > ny ? ((j - ny) / HEM) * 5.4 : 0, hr = b.hem || 0, nn = Math.cos(th), ny2 = -Math.sin(th);
      let off = hr * (Math.cos(th) - 1), dy = -hr * Math.sin(th);
      // (Seventh holder.) ITS HEAD IS TIED TO ITS BATTEN, and half the ties have rotted through: where they hold, the head is up against the timber; where a run of
      // them has gone it hangs away in a bight (b.head.sag: a dark crescent under the batten), and the cloth under a bight has that much length to spare, which
      // it carries as a swag bellying out of its plane a pace below (b.head.belly). Cloth gives by folding, never by stretching.
      let xe = x;
      if (b.head) { const down = v * b.drop; dy -= b.head.sag(x) * Math.exp(-down / 1.5); off += b.head.belly(x, down); if (b.head.edge) xe += b.head.edge(x, v); }
      pos.push(b.top.x + q.rx * xe - q.tx * off, b.top.y + y + dy, b.top.z + q.rz * xe - q.tz * off); nor.push(-q.tx * nn, ny2, -q.tz * nn); uv.push(t[0], t[1]); col.push(c.r, c.g, c.b);
      cloth.push(Math.pow(v, 1.4) * (1 - (b.stiff || 0)), (b.phase ?? 0) + (b.mid || 0) * 0.37, v, b.id || 0);
      across.push((b.mid || 0) + x * 0.9999, v * b.drop + hr * th);        // (a hair inside its own width: at a seam the two widths' edges know which side they are on)
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < nx; i++) { const a = base + j * (nx + 1) + i, d = a + nx + 1; idx.push(a, d, a + 1, a + 1, d, d + 1); }
    if (b.head) {                                                          // a cloth that bellies wants its true normals (down to its pocket, which keeps its own)
      const P = (j, i) => { const o = (base + j * (nx + 1) + i) * 3; return [pos[o], pos[o + 1], pos[o + 2]]; };
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
        const a = P(j, Math.max(0, i - 1)), e = P(j, Math.min(nx, i + 1)), f = P(Math.max(0, j - 1), i), g2 = P(Math.min(ny, j + 1), i);
        const ux = e[0] - a[0], uy = e[1] - a[1], uz = e[2] - a[2], vx = g2[0] - f[0], vy = g2[1] - f[1], vz = g2[2] - f[2];
        let nx3 = uy * vz - uz * vy, ny3 = uz * vx - ux * vz, nz3 = ux * vy - uy * vx; const l = Math.hypot(nx3, ny3, nz3) || 1, sg = (nx3 * -q.tx + nz3 * -q.tz) < 0 ? -1 : 1;
        const o = (base + j * (nx + 1) + i) * 3; nor[o] = sg * nx3 / l; nor[o + 1] = sg * ny3 / l; nor[o + 2] = sg * nz3 / l;
      }
    }
  }
  // Tapes: the ties sewn down the edges of a split, hanging loose now. Each is a narrow strip of two lengths that carries the cloth numbers
  // of the point it is sewn to, so it goes wherever that point of the cloth goes. [{ panel, u (0 or 1: which edge), v (0..1 down it), len, width, lean, back }]
  for (const t of o.tapes || []) {
    const b = list[t.panel], q = ctx.path.at(Math.min(ctx.path.length, Math.max(0, b.s))), x = (t.u - 0.5) * b.width, tan = b.tilt ? Math.tan(b.tilt) : 0, y = -t.v * b.drop + tan * x, uvp = b.uv(t.u, t.v);
    const base = pos.length / 3, off = t.back ? -0.007 : 0.007, inn = t.u > 0.5 ? -1 : 1;           // (sewn a finger in from the edge, on the painted side or the raw one)
    c.set(t.tint || '#ffffff').multiply(new THREE.Color(b.tint || '#ffffff')); c.r += 2; c.g += 2; c.b += 2;      // (plus two: the cloth's shader knows a tape by it)
    // (Third holder: a tape is cotton, not a chalk stroke: five rows down its length, a half turn or more of twist so that it shows its edge
    // somewhere, a bow out from the cloth, a drift to one side toward its end; grubby, darker where it is sewn in the seam's shadow, paler at its frayed end.)
    const TR = 4, c0 = c.clone();
    for (let j = 0; j <= TR; j++) for (const e of [-1, 1]) {
      const f = j / TR, tw = f * (t.twist ?? 0), cw = Math.cos(tw), sw = Math.sin(tw);
      const xx = x + inn * 0.03 + e * (t.width / 2) * cw + f * f * t.lean + 0.012 * Math.sin(f * 5 + (t.twist ?? 0)), yy = y - f * t.len * (1 - 0.06 * Math.abs(sw));
      const out = off * (1 + 2.2 * Math.sin(Math.PI * Math.min(1, f * 1.15))) + (t.back ? -1 : 1) * e * (t.width / 2) * sw * 0.9;      // (it bows out in its middle; twisted, one edge stands off the cloth)
      const k = (0.66 + 0.4 * f) * (1 - 0.14 * e * sw);
      pos.push(b.top.x + q.rx * xx + q.tx * -out, b.top.y + yy, b.top.z + q.rz * xx + q.tz * -out); nor.push(-q.tx, 0, -q.tz); uv.push(uvp[0], uvp[1]); col.push(2 + (c0.r - 2) * k, 2 + (c0.g - 2) * k, 2 + (c0.b - 2) * k);
      cloth.push(Math.pow(t.v, 1.4) * (1 - (b.stiff || 0)), (b.phase ?? 0) + (b.mid || 0) * 0.37, t.v, b.id || 0);
      across.push((b.mid || 0) + x * 0.9999 + inn * 0.07, t.v * b.drop);       // (a hand in from the seam, where the cloth's own paint has no stitching to darken it)
    }
    for (let j = 0; j < TR; j++) { const a = base + j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aCloth', new THREE.Float32BufferAttribute(cloth, 4)); g.setAttribute('aAcross', new THREE.Float32BufferAttribute(across, 2));
  g.setIndex(idx);
  const down = ctx.path.at(Math.min(ctx.path.length, list[0].s));
  const U = {
    ...SM,
    uScAcross: { value: new THREE.Vector2(down.rx, down.rz) }, uScSway: { value: new THREE.Vector3(o.sway[0], o.sway[1], o.hang) }, uRise: { value: [0, 0, 0, 0, 0, 0, 0, 0] },
    uPartA: { value: new THREE.Vector4(0, 0, -99, 0) }, uPartB: { value: new THREE.Vector4(0, 7.5, 4.6, 0) },
    uScSeam: { value: new THREE.Vector4(o.seam ? o.seam[0] : 0, o.seam ? o.seam[1] : 0, o.weave, o.patches) }, uScWet: { value: new THREE.Vector4(0.44, o.wet, 0, 0) },
    uScThrough: { value: new THREE.Vector4(o.through[0], o.through[1], o.lights[0], o.lights[1]) }, uScCanvas: { value: new THREE.Color(o.canvas) }, uScGlow: o.glow || { value: new THREE.Color(0, 0, 0) },
    tScL: { value: o.maps ? o.maps[0] : null }, tScR: { value: o.maps ? o.maps[1] : null },
    uScAge: { value: new THREE.Vector4(o.age[0], o.age[1], o.age[2], o.last ?? 1) }, uScEdge: { value: new THREE.Vector4(o.edge[0], o.edge[1], o.edge[2], o.nightSecond ?? 1) },
    uScNight: o.night || { value: new THREE.Color(0, 0, 0) }, uScPass: { value: 0 }, uScMoonK: { value: o.moonK ?? 1 }, uScRake: { value: new THREE.Vector4(...o.rake) }, uScFoldK: { value: new THREE.Vector2(...(o.folded || [0, 0])) }, uScNightK: { value: new THREE.Vector3(o.nightFirst ?? 1, o.nightSecond ?? 1, o.nightLast ?? 1) }, uScSide: { value: new THREE.Vector4(o.side[0], o.side[1], o.side[2], o.second ?? 1) },
  };
  const material = H.paint(o.kind, { color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, map: o.map, cutout: o.cutout, brush: 0.3, wake: false, take: o.take, extend: {
    defines: { ...(o.part === 'seams' ? { SC_PART: '' } : {}), ...(o.part === 'lift' ? { SC_LIFT: '' } : {}), ...(o.far ? { SC_FAR: '' } : {}) }, uniforms: U,
    vertexPars: SC_VERT_PARS, vertexWorld: SC_VERT, fragmentPars: SC_FRAG_PARS, albedo: SC_ALBEDO(!!o.maps), light: SC_LIGHT(dev.second) } });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  // which pass is drawing it: 0 the picture, 1 the engine's first picture (without the water), 2 the water's mirror
  mesh.onBeforeRender = (renderer) => { U.uScPass.value = ctx.engine.reflecting ? 2 : renderer.getRenderTarget() === ctx.engine.pre ? 1 : 0; material.uniformsNeedUpdate = true; };
  ctx.add(mesh);
  return { mesh, material, U };
}

// ================================================================================================ laid rope
// (Fourth holder.) EVERY ROPE IS LAID ROPE. Until now a rope was a flat tan stick: at arm's length in the fly tower, and as the last
// thing the area shows (one rope to the water, 2.5 m off the line), a broomstick. Rope here is a tube that knows, at every point, how
// far round it that point is and how far along (in its own diameters: its uv). From those two numbers the paint lays three strands
// round it, each a round back with a dark groove between it and the next, the yarns of each strand lying the other way; and the rope
// is round: it darkens where it turns from the eye. Far off, where a pixel can no longer hold a strand, it goes to its mean tone and
// nothing crawls. A plain thing drawn with the ropes (a whipping, a wire, a traveller) says so with a length below -1.
const LAY_PARS = /* glsl */`
  uniform vec4 uLay;                                          // strands; a strand's pitch along the rope, in rope diameters; how round it is shaded; its tone where the lay can no longer be seen`;
const LAY_ALBEDO = /* glsl */`
    { float lBroad = 1.0 - smoothstep(0.12, 0.42, fwidth(vUv0.y));                               // 1 where the rope is some pixels broad, 0 where it is a line (its own diameters under one pixel)
      if (vUv0.y > -0.5) {
        float lA = 6.2832 * vUv0.x, lP = uLay.x * lA + 6.2832 * vUv0.y / uLay.y;
        float lW = (fwidth(sin(lP)) + fwidth(cos(lP))) / 8.0;                                      // strands under one pixel (measured through sine and cosine, so that the tube's seam does not show)
        float lSee = 1.0 - smoothstep(0.2, 0.55, lW);
        float lCrest = abs(sin(0.5 * lP));                                                         // 0 in the groove between two strands .. 1 on a strand's back
        float lYarn = 0.5 + 0.5 * sin(5.0 * uLay.x * lA - 15.0 * vUv0.y);                          // the yarns of a strand lie the other way
        float lY = 0.22 * (1.0 - smoothstep(0.05, 0.16, lW));
        albedo *= mix(uLay.w, (0.34 + 0.84 * pow(lCrest, 0.8)) * (1.0 - lY + 1.7 * lY * lYarn * lCrest), lSee);
      }
      albedo *= mix(1.0, 0.38 + 0.62 * smoothstep(0.0, 0.8, abs(dot(N, normalize(uCameraPos - vWPos)))), uLay.z * lBroad);
    }`;
const layExt = (U) => ({ uniforms: U, fragmentPars: LAY_PARS, albedo: LAY_ALBEDO });

// ================================================================================================ lines
/**
 * Every line that carries a load, as ONE mesh rebuilt as its loads move: up to `max` straight stretches, each a five-sided
 * tube from a to b (a thick short one is a block: a traveller, a weight). add(a, b, radius, color, fade) -> its number;
 * set(i, a, b) moves it; flush() after the frame's moves. A stretch of rope's thickness is laid rope (see "laid rope": its lay is
 * counted from its a end, so it travels with its load); wires, tracks and blocks are plain.
 */
function makeLines(ctx, material, max) {
  const S = 5, R = S + 1, per = R * 2;                                     // (a ring's first point is doubled: the lay needs the way round to run 0..1 without a jump)
  const pos = new Float32Array(max * per * 3), nor = new Float32Array(max * per * 3), col = new Float32Array(max * per * 3), uv = new Float32Array(max * per * 2), idx = [], rad = new Float32Array(max), plain = new Uint8Array(max);
  for (let i = 0; i < max; i++) for (let k = 0; k < S; k++) { const a = i * per + k, b = a + 1; idx.push(a, b, a + R, b, b + R, a + R); }
  const g = new THREE.BufferGeometry();
  const P = new THREE.BufferAttribute(pos, 3), N = new THREE.BufferAttribute(nor, 3), T = new THREE.BufferAttribute(uv, 2); P.setUsage(THREE.DynamicDrawUsage); N.setUsage(THREE.DynamicDrawUsage); T.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', P); g.setAttribute('normal', N); g.setAttribute('uv', T); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.setDrawRange(0, 0);
  const mesh = new THREE.Mesh(g, material); mesh.name = 'stage lines'; mesh.frustumCulled = false; ctx.add(mesh);
  const d = new THREE.Vector3(), u = new THREE.Vector3(), v = new THREE.Vector3(), c = new THREE.Color();
  let n = 0;
  const api = {
    mesh,
    set(i, a, b) {
      d.subVectors(b, a); const len = d.length(); if (len < 1e-5) d.set(0, 1, 0); d.normalize();
      u.set(Math.abs(d.y) > 0.9 ? 1 : 0, Math.abs(d.y) > 0.9 ? 0 : 1, 0).cross(d).normalize(); v.crossVectors(d, u);
      const r = rad[i], along = len / (2 * r), vb = plain[i] ? -2 - along : along, va = plain[i] ? -2 : 0;
      for (let k = 0; k < R; k++) {
        const t = k / S * Math.PI * 2, cx = Math.cos(t), sx = Math.sin(t), nx = u.x * cx + v.x * sx, ny = u.y * cx + v.y * sx, nz = u.z * cx + v.z * sx, o = (i * per + k) * 3, q = o + R * 3, w = (i * per + k) * 2;
        pos[o] = a.x + nx * r; pos[o + 1] = a.y + ny * r; pos[o + 2] = a.z + nz * r; pos[q] = b.x + nx * r; pos[q + 1] = b.y + ny * r; pos[q + 2] = b.z + nz * r;
        nor[o] = nor[q] = nx; nor[o + 1] = nor[q + 1] = ny; nor[o + 2] = nor[q + 2] = nz;
        uv[w] = uv[w + R * 2] = k / S; uv[w + 1] = va; uv[w + R * 2 + 1] = vb;
      }
    },
    add(a, b, radius = 0.012, color = '#b3a47e', fade = 0) {                // fade: how far its b end (the upper one) has gone into the dark of the flies, 0..1
      if (n >= max) throw new Error('heroes_stage: more lines than makeLines was given');
      const i = n++; rad[i] = radius; plain[i] = radius < 0.0075 || radius > 0.019 ? 1 : 0; c.set(color);      // (wire is thinner than any rope here, a track or a block thicker)
      for (let k = 0; k < per; k++) { const f = k < R ? 1 : 1 - fade; col.set([c.r * f, c.g * f, c.b * f], (i * per + k) * 3); }
      api.set(i, a, b); g.setDrawRange(0, n * S * 6); g.attributes.color.needsUpdate = true;
      return i;
    },
    flush() { P.needsUpdate = true; N.needsUpdate = true; T.needsUpdate = true; },
  };
  return api;
}

// ================================================================================================ hanging ropes
// The fly tower's rope walls, the pin rails' own rope (every line's belay round its pin and its coil hung on it) and the last rope are
// ONE static mesh. A free rope hangs from its own point up at the grid (aRope), sways as the long pendulum it is, and is pushed aside
// low down where the hull comes against it; a rope made fast on a pin stands still. (Lines that carry a moving load are makeLines.)
const ROPE_VERT_PARS = /* glsl */`
  attribute vec4 aRope; attribute float aRopeAmp;             // where it hangs from (x, z, y) and its phase; how freely it swings (0: made fast)
  uniform vec4 uRopeP;                                        // metres of sway at its lower end for every 28 m of length, speed, metres the hull pushes it, the hull's reach
  uniform vec3 uRopeHer;                                      // where the rower stands (x, z) and the metres a rope gives way to her (0: she is ashore)`;
const ROPE_VERT = /* glsl */`
    if (aRopeAmp > 0.0) {
      float below = max(aRope.z - wp.y, 0.0), ph = aRope.w;
      vec2 sw = vec2(sin(uTime * uRopeP.y + ph), 0.6 * sin(uTime * uRopeP.y * 0.83 + ph * 1.7)) * (uRopeP.x * aRopeAmp * below / 28.0);
      vec2 away = wp.xz - uBoat.xz; float dist = length(away);
      float push = (1.0 - smoothstep(0.7, uRopeP.w, dist)) * (1.0 - smoothstep(0.5, 4.5, wp.y)) * uRopeP.z;
      wp.xz += sw + away / max(dist, 0.05) * push;
      // (stage 5, 5-critique.md) AND ROUND THE ROWER. The hull's push is round the boat's middle; she stands a metre and a half aft of it, on the port side, and
      // a rope that the middle had let go swung back through her: the last rope for a boat that steers by it, the left rope wall for one that hugs it. A rope
      // gives way to her as to the hull: two thirds of a metre where she stands, nothing a metre and a half off, and to above her head.
      vec2 awayHer = wp.xz - uRopeHer.xy; float distHer = length(awayHer);
      wp.xz += awayHer / max(distHer, 0.01) * ((1.0 - smoothstep(0.3, 1.5, distHer)) * (1.0 - smoothstep(1.3, 4.5, wp.y)) * uRopeHer.z);
    }`;

/** The buffers of the one rope mesh, and `tube`, which fills them. */
function ropeBuffers() {
  const B = { pos: [], nor: [], col: [], uv: [], ra: [], rb: [], idx: [] };
  const T = new THREE.Vector3(), Nn = new THREE.Vector3(), Bn = new THREE.Vector3(), pT = new THREE.Vector3(), qt = new THREE.Quaternion(), ax = new THREE.Vector3(), c = new THREE.Color(), tip = new THREE.Vector3();
  /**
   * A tube along `pts` (Vector3s), every ring square to the line and none twisted against the last (its frame is carried along it).
   * o: r (one radius, or one for each point), rLay (the radius its lay is counted in: default the first), color(j, p, c) (set c to the
   * paint at point j), sides (5), plain (true: no lay), anchor [x, z, y, phase] and amp (how it swings: ROPE_VERT), capA / capB (close
   * that end to a point).
   */
  B.tube = (pts, o) => {
    const S = o.sides || 5, R = S + 1, n = pts.length, base = B.pos.length / 3, dia = 2 * (o.rLay || (typeof o.r === 'number' ? o.r : o.r[0]));
    const an = o.anchor || [0, 0, 0, 0], amp = o.amp || 0;
    let len = 0, rings = 0;
    const ring = (p, rr) => {
      const v = o.plain ? -2 - len / dia : len / dia;
      for (let i = 0; i <= S; i++) {                                         // (the first point is doubled at the seam: the lay needs the way round to run 0..1 without a jump)
        const t = (i / S) * Math.PI * 2, cx = Math.cos(t), sx = Math.sin(t), nx = Nn.x * cx + Bn.x * sx, ny = Nn.y * cx + Bn.y * sx, nz = Nn.z * cx + Bn.z * sx;
        B.pos.push(p.x + nx * rr, p.y + ny * rr, p.z + nz * rr); B.nor.push(nx, ny, nz); B.col.push(c.r, c.g, c.b); B.uv.push(i / S, v);
        B.ra.push(an[0], an[1], an[2], an[3]); B.rb.push(amp);
      }
      if (rings) for (let i = 0; i < S; i++) { const a0 = base + (rings - 1) * R + i; B.idx.push(a0, a0 + 1, a0 + R, a0 + 1, a0 + 1 + R, a0 + R); }
      rings++;
    };
    for (let j = 0; j < n; j++) {
      const p = pts[j]; T.subVectors(pts[Math.min(n - 1, j + 1)], pts[Math.max(0, j - 1)]).normalize();
      if (j === 0) { ax.set(Math.abs(T.y) > 0.9 ? 1 : 0, Math.abs(T.y) > 0.9 ? 0 : 1, 0); Nn.copy(ax).addScaledVector(T, -ax.dot(T)).normalize(); }
      else { qt.setFromUnitVectors(pT, T); Nn.applyQuaternion(qt).addScaledVector(T, -Nn.dot(T)).normalize(); }
      pT.copy(T); Bn.crossVectors(T, Nn);
      if (j) len += p.distanceTo(pts[j - 1]);
      const rr = typeof o.r === 'number' ? o.r : o.r[j];
      o.color(j, p, c);
      if (j === 0 && o.capA) { const keep = c.clone(); c.multiplyScalar(0.45); ring(tip.copy(p).addScaledVector(T, -0.35 * rr), 0.06 * rr); c.copy(keep); }
      ring(p, rr);
      if (j === n - 1 && o.capB) { c.multiplyScalar(0.45); len += 0.35 * rr; ring(tip.copy(p).addScaledVector(T, 0.35 * rr), 0.06 * rr); }
    }
  };
  return B;
}

/**
 * One hanging rope and its end. q: { bottom, top (Vector3), r, free, phase, amp, color, wet (0..1 below half a metre), fade (how dark it
 * goes up in the flies), sides, end }. Its end: 'wet' it trails in the water;  'knot' a stopper knot a hand above a whipped end;
 * 'whip' a whipped end and nothing more;  'eye' an eye spliced in it;  null: it goes on (it is made fast below: a rail's line).
 * An old rope's end keeps the curve it lay coiled in: the last half metre of one that ends in the air hangs a little out of plumb.
 */
function hangRope(B, q, rnd) {
  const len = q.top.y - q.bottom.y, r = q.r, anchor = [q.top.x, q.top.z, q.top.y, q.phase || 0], amp = q.free ? (q.amp ?? 1) : 0, inAir = q.end && q.end !== 'wet';
  const base = new THREE.Color(q.color || '#b3a47e'), wet = new THREE.Color('#4a4638'), pale = new THREE.Color('#d6c9a6'), tar = new THREE.Color('#40352a');
  const paint = (y, c, k = 1) => { c.copy(base); if (y < 0.55) c.lerp(wet, (q.wet ?? 1) * (1 - smooth(0.3, 0.55, y))); c.multiplyScalar(k * (1 - (q.fade ?? 0.86) * smooth(4.5, 24, y))); };      // it goes up into the dark of the flies (a rope as pale thirty metres up as at the water made a net of hairs of the tower)
  const cd = rnd() * 6.2832, curl = inAir ? 0.025 + 0.075 * rnd() : 0, cl = 0.45 + 0.4 * rnd();
  const at = (h, ox = 0, oz = 0) => { const t = h / len, e = Math.max(0, 1 - h / cl), k = curl * e * e;
    return new THREE.Vector3(q.bottom.x + (q.top.x - q.bottom.x) * t + Math.cos(cd) * k + ox, q.bottom.y + h, q.bottom.z + (q.top.z - q.bottom.z) * t + Math.sin(cd) * k + oz); };
  let hs = [];                                                             // its rings: height above its lower end, radius in rope radii, how far out of line (the knot's two lobes)
  for (const h of inAir ? [0, 0.022, 0.06, 0.11, 0.17, 0.25, 0.35, 0.47, 0.62, 0.8] : [0, 0.2, 0.42, 0.62, 0.85]) if (h < len - 1) hs.push({ h, k: 1 });
  for (let h = 1.4; h < Math.min(len - 0.5, 5.2); h += 0.75) hs.push({ h, k: 1 });
  for (const y of [9, 14, 20]) if (y - q.bottom.y > 5.6 && y - q.bottom.y < len - 1) hs.push({ h: y - q.bottom.y, k: 1 });      // (points for its paint to darken on)
  hs.push({ h: len, k: 1 });
  if (q.end === 'knot' || q.end === 'whip') { hs[0].k = 1.34; hs[1].k = 1.12; }       // the fag end has opened a little below its whipping
  if (q.end === 'knot') {                                                  // a stopper knot: a lump three ropes across, of two lobes, one a little to this side and one to that
    const h0 = 0.13 + 0.09 * rnd(), a = rnd() * 6.2832, lump = [[0, 1, 0], [0.7, 1.75, 0.5], [1.9, 2.5, 0.4], [3.1, 2.55, -0.3], [4.5, 1.95, -0.55], [5.5, 1.2, -0.12], [6.1, 1, 0]];
    hs = hs.filter((e) => e.h < h0 - 0.01 || e.h > h0 + 6.1 * r + 0.01);
    for (const [dh, k, off] of lump) hs.push({ h: h0 + dh * r, k, ox: Math.cos(a) * off * r, oz: Math.sin(a) * off * r, knot: true });
  }
  if (q.end === 'eye') {                                                   // the splice above an eye: the rope half as thick again where its strands are tucked back into it
    hs = hs.filter((e) => e.h > 0.2);
    for (const [h, k] of [[0, 1.25], [0.03, 1.5], [0.09, 1.45], [0.15, 1.2], [0.19, 1]]) hs.push({ h, k });
  }
  hs.sort((x, y) => x.h - y.h);
  B.tube(hs.map((e) => at(e.h, e.ox, e.oz)), { r: hs.map((e) => e.k * r), rLay: r, sides: q.sides || 5, anchor, amp, capA: inAir && q.end !== 'eye',
    color: (j, p, c) => { paint(p.y, c, hs[j].knot ? 0.9 : 1); if ((q.end === 'knot' || q.end === 'whip') && hs[j].h < 0.03) c.lerp(pale, 0.5); } });
  if (q.end === 'knot' || q.end === 'whip')                                // the whipping: a hand of tarred twine round it, an inch above its end
    B.tube([at(0.03), at(0.03 + 1.3 * r), at(0.03 + 2.6 * r)], { r: 1.14 * r, sides: q.sides || 5, plain: true, anchor, amp, color: (j, p, c) => { c.copy(tar).multiplyScalar(1 - (q.fade ?? 0.86) * smooth(4.5, 24, p.y)); } });
  if (q.end === 'eye') {                                                   // the eye: a loop a hand and a half long, hanging open below the splice
    const a = rnd() * 6.2832, L = 0.17 + 0.1 * rnd(), w = 0.038 + 0.02 * rnd(), th = at(0.02), pts = [];
    for (let i = 0; i <= 16; i++) { const t = 0.3 + (i / 16) * (6.2832 - 0.6), dn = (1 - Math.cos(t)) / 2, x = w * Math.sin(t) * (0.3 + 0.7 * Math.pow(dn, 0.7)); pts.push(new THREE.Vector3(th.x + Math.cos(a) * x, th.y - L * dn, th.z + Math.sin(a) * x)); }
    B.tube(pts, { r, sides: q.sides || 5, anchor, amp, color: (j, p, c) => paint(p.y, c, 0.96) });
  }
}

/**
 * The rope of one pin rail (it is not in the rail's model: see fly_kit.py). For each pin that carries a line: THE LINE, from the grid
 * down behind the rail and round its pin in a figure of eight, as a fly man belays (through the points the model's own belay went
 * through); and ITS FALL, coiled and hung on the pin: a hank of several turns of different lengths, bound round its neck, held by a
 * bight dropped over the pin's head. One hank on a rail that stands in the water has slipped and trails in it. All of it stands still.
 *   F(x, y, z)   a point of the rail's model (x along it, y behind it, z up from its own zero) as a point of the realm
 *   o: RAIL (the rail's top above the model's zero), top(x) (where the line of the pin at x comes from, up at the grid), tints, rnd,
 *      near (false: a rail seen from far below: fewer turns, coarser), slip (the pin whose hank has slipped, or -1), wetTo (the water's height in the model, or null), fade
 */
function railRope(B, F, o, RL) {
  const { RAIL, rnd, tints } = o, LB = RL.lineBack, LU = RL.lineUp, r = 0.0135, wet = new THREE.Color('#4a4638'), base = new THREE.Color();
  const TT = o.near ? [0.0, 0.42, 0.85, 1.3, 1.75, 2.2, 2.62, 2.98, 3.3, 3.66, 4.08, 4.53, 4.98, 5.43, 5.86] : [0.0, 0.6, 1.3, 2.05, 2.6, 2.95, 3.33, 3.7, 4.2, 4.95, 5.7];      // round a turn: closer together at its foot, where it bends
  for (let i = 0; i < RL.pins; i++) {
    if (RL.bare.includes(i)) continue;
    const x = RL.first + RL.pitch * i, jx = (rnd() - 0.5) * 0.016; base.set(tints[(i * 3 + o.tint) % tints.length]);
    const tone = 0.86 + 0.24 * rnd(), ph = rnd() * 6.28;
    const paint = (p, c, k = 1) => { c.copy(base); if (o.wetTo != null && p.y < o.wetTo + 0.45) c.lerp(wet, 1 - smooth(o.wetTo + 0.2, o.wetTo + 0.45, p.y)); c.multiplyScalar(k * tone * (1 - (o.fade ?? 0.86) * smooth(4.5, 24, p.y))); };
    // ---- the line and its belay
    const eight = [[x + jx, LB, RAIL + LU], [x + 0.008, LB - 0.01, RAIL - 0.13], [x + 0.016, 0.05, RAIL - 0.178], [x + 0.03, -0.075, RAIL - 0.165], [x + 0.01, -0.108, RAIL - 0.05], [x - 0.03, -0.05, RAIL + 0.08],
      [x - 0.006, 0.016, RAIL + 0.092], [x + 0.03, -0.04, RAIL + 0.07], [x + 0.004, -0.11, RAIL - 0.07], [x - 0.028, -0.07, RAIL - 0.17], [x + 0.0, -0.014, RAIL - 0.2]].map(([a, b, c]) => F(a, b, c));
    const top = o.top(x), up = F(x + jx, LB, RAIL + LU + 0.7);
    const pts = [top];
    for (const y of [20, 14, 9, 5.2]) if (y < top.y - 1 && y > up.y + 0.6) pts.push(top.clone().lerp(up, (top.y - y) / (top.y - up.y)));      // (points for its paint to darken on)
    pts.push(...new THREE.CatmullRomCurve3([up, ...eight], false, 'centripetal').getPoints(o.near ? 22 : 14));
    B.tube(pts, { r, sides: o.near ? 5 : 4, capB: true, color: (j, p, c) => paint(p, c, 0.94) });
    // ---- its fall, coiled and hung on the pin: a coil of five to eight turns, a forearm across, round at its head as at its foot (it hangs
    // in a sling, like a ring on a hook); the turns lie in three layers before the rail's face, no two the same size, crossing one another,
    // so that the coil is a band three ropes broad; and the whole goes on as one rope from turn to turn. (Two earlier tries, a few narrow
    // turns drawn to a point at the pin, one of them bound round its neck, hung along the rail as a row of nooses.)
    // (Sixth holder: NO TWO FALLS THE SAME LENGTH. A line's fall is what is left of it when its load hangs where it hangs: a cloth flown high leaves an armful, one
    // let right in leaves a few turns. They were twelve ovals of one size at one height. `sz`: from a small hank of three turns to a heavy coil of ten that reaches
    // nearly to the water, which darkens its foot.)
    const slipped = i === o.slip, sz = slipped ? 1 : o.near ? [0.7, 1, 1.3, 0.88, 1.75, 1.1, 0.78, 1.5][Math.floor(rnd() * 8)] : [0.85, 1, 1.2][Math.floor(rnd() * 3)];
    const n = slipped ? 2 : o.near ? Math.max(3, Math.round((4.2 + 2.6 * rnd()) * Math.pow(sz, 0.8))) : 4, head = RAIL - 0.045, skew = (rnd() - 0.5) * 0.06, lean = (rnd() - 0.5) * 0.05;
    const l0 = slipped ? RAIL - (o.wetTo ?? 0) + 0.2 : (0.3 + 0.2 * rnd()) * sz, w0 = slipped ? 0.05 : (0.105 + 0.045 * rnd()) * Math.pow(sz, 0.55), turn = [];
    for (let k = 0; k <= n; k++) { const e = Math.min(k, n - 1); turn.push({ l: l0 * (slipped && e ? 0.55 : 1) + (slipped ? 0.03 : 0.11 * sz) * (rnd() - 0.5), w: w0 + (slipped ? 0.01 : 0.07) * (rnd() - 0.5), y: -0.108 - 0.027 * [0, 1, 2, 0, 1, 2, 1, 0][e % 8] - 0.008 * rnd(), x: (rnd() - 0.5) * (slipped ? 0.01 : 0.05) }); }
    const hank = [], layer = [];
    for (let k = 0; k < n; k++) for (const t of TT) {
      if ((k === 0 && t < 0.3) || (k === n - 1 && t > 5.6)) continue;       // (its two ends are in the bunch at its head)
      const f = t / 6.2832, A = turn[k], Bq = turn[k + 1], l = A.l + (Bq.l - A.l) * f, w = A.w + (Bq.w - A.w) * f, y = A.y + (Bq.y - A.y) * f, xo = A.x + (Bq.x - A.x) * f;
      const dn = (1 - Math.cos(t)) / 2, wide = w * (slipped ? 0.3 + 0.7 * Math.pow(dn, 0.55) : 0.62 + 0.38 * Math.pow(dn, 0.6));
      hank.push(F(x + xo + wide * Math.sin(t) + skew * dn, y + 0.01 * Math.cos(2 * t + k * 1.3) + lean * dn, head - l * dn)); layer.push(y);
    }
    B.tube(hank, { r, sides: o.near ? 5 : 4, capA: true, capB: true, color: (j, p, c) => paint(p, c, (0.84 + 0.16 * Math.sin(j * 0.37 + ph)) * (layer[j] > -0.12 ? 0.78 : layer[j] > -0.15 ? 0.9 : 1)) });      // (the turns that lie against the rail are in the others' shade)
    // ---- the sling that holds it: a bight of the line's own end, from behind the pin under its head, over the capping, down before the
    // coil's head, under it, up behind it and back round the pin
    if (!slipped) {
      const sling = [[x - 0.012, 0.014, RAIL + 0.112], [x - 0.03, -0.045, RAIL + 0.1], [x - 0.034, -0.11, RAIL - 0.005], [x - 0.03, -0.185, head + 0.0], [x - 0.014, -0.17, head - 0.06], [x + 0.012, -0.1, head - 0.062],
        [x + 0.028, -0.09, head + 0.005], [x + 0.03, -0.045, RAIL + 0.1], [x + 0.012, 0.014, RAIL + 0.112]].map(([a, b, c]) => F(a, b, c));
      B.tube(new THREE.CatmullRomCurve3(sling, false, 'centripetal').getPoints(o.near ? 16 : 10), { r: 0.0125, sides: 4, capA: true, capB: true, color: (j, p, c) => paint(p, c, 0.9) });
    }
  }
}

/**
 * list: the hanging ropes (see hangRope). more(B): add what else is rope and stands still (the rails' rope). Returns { mesh, material, U, list, triangles }.
 */
function makeRopes(ctx, H, list, LAY, more = null, ext = []) {
  const B = ropeBuffers(), rnd = ctx.rng(9127);
  for (const q of list) hangRope(B, q, rnd);
  if (more) more(B);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(B.col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
  g.setAttribute('aRope', new THREE.Float32BufferAttribute(B.ra, 4)); g.setAttribute('aRopeAmp', new THREE.Float32BufferAttribute(B.rb, 1)); g.setIndex(B.idx);
  const U = { uRopeP: { value: new THREE.Vector4(0.16, 0.55, 0.55, 1.9) }, uRopeHer: { value: new THREE.Vector3(0, 0, 0) } };
  const material = H.paint('rope', { color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, wake: false, brush: 0.2, crisp: true, extend: [{ uniforms: U, vertexPars: ROPE_VERT_PARS, vertexWorld: ROPE_VERT }, ...ext, layExt(LAY)] });
  const mesh = new THREE.Mesh(g, material); mesh.name = 'stage ropes'; mesh.frustumCulled = false; ctx.add(mesh);
  // (stage 6, 5-critique.md: 87,000 triangles, drawn three times a frame from anywhere in the area. Until the boat is ten metres up the stage every rope is sixteen
  // metres and more away behind the wings or beyond the painting: no reflection of one can be seen and none is looked down on, so the mirror and the engine's
  // first picture go without them; the picture itself keeps them. A draw range below zero leaves the draw out. &ropesall=1: in every pass, always.)
  if (!dev.has('ropesall')) {
    const range = g.drawRange;
    mesh.onBeforeRender = (renderer) => { if (ctx.s < 100 && (ctx.engine.reflecting || renderer.getRenderTarget() === ctx.engine.pre)) range.count = -1; };
    mesh.onAfterRender = () => { range.count = Infinity; };
  }
  return { mesh, material, U, list, triangles: B.idx.length / 3 };
}

export async function build(ctx, plan, shared) {
  const { kit } = ctx, H = house(ctx, plan, shared), V = (s, d, y = 0) => at(ctx, s, d, y), show = shared.show || { c: -1 };
  const R = plan.stageRig, stageY = plan.levels.stage;
  const only = (dev.get('hs') || '').split(',').filter(Boolean), want = (k) => !only.length || only.includes(k);
  const later = [];                                                        // stand-ins made in modules that build after this one: taken out on the first frame
  const hold = (k) => (dev.has(k) && dev.get(k) !== '' ? +dev.get(k) : null);      // a developer switch that holds a machine still
  /** Take a stand-in out (removeStandIn), first letting go of its material: most stand-ins wear one of the house's SHARED paints
   *  (lib.js caches them), and disposing that under the things still wearing it makes the browser log GL errors while it recompiles. */
  const takeOut = (name) => { ctx.group.traverse((o) => { if (o.name && o.name.startsWith('standin:') && o.name.slice(8).includes(name)) o.material = null; }); return removeStandIn(ctx, name); };
  const rig = shared.stageRig = { cloths: {}, fly: [], rollers: null, cars: [], moon: null, weights: {}, bags: null, lines: null };
  const cells = await fetch(R.art.cells).then((r) => r.json());
  // the stage moon's light, for this module's materials (MOON_FRAG_PARS): uniforms shared by them all, driven in update()
  const SM = { uSmPos: { value: new THREE.Vector4(0, -100, 0, R.moon.reach) }, uSmCol: { value: new THREE.Color(0, 0, 0) }, uSmP: { value: new THREE.Vector4(R.moon.fill, plan.backcloth.s, 0, 0) } };
  const moonExt = { uniforms: SM, fragmentPars: MOON_FRAG_PARS, light: MOON_LIGHT };
  const NIGHT = { value: new THREE.Color(R.night.color).multiplyScalar(R.night.through) };      // what comes in at the fly tower's open end, for what hangs across it
  const GLOW = { value: new THREE.Color(0, 0, 0) };                        // the lit house as it comes through canvas from the far side (driven by the share of flames burning)
  /** Gouache options for a model of this module: the house's light for `kind`, and the stage moon's. */
  const dress = (kind, over = {}) => H.dress(kind, { ...over, extend: [moonExt, ...[].concat(over.extend || [])] });
  // THE FLY TOWER BY LANTERN LIGHT (fifth holder). The area's light gives the bow lantern the house's short reach until the boat is half way
  // through the tower (it grows to 18 m by s 150): for its first ten metres, straight after the cloth is drawn aside, thirty ropes a side, the
  // bags, the rails and the weights were grey hairs on plum-black and the picture all but black. What this module hangs and stands in the tower
  // takes the lantern from the first metre past the backcloth as a flame's light in a dark room: PLAN.stageRig.tower.gain of its strength at the flame, a third of that every
  // .reach metres, no edge; only what the engine's own lantern does not already give is added (the walls stay the light's own: warm rope before dark brick).
  const TWR = { uTwr: { value: new THREE.Vector4(R.tower.reach, R.tower.gain, R.tower.from[0], R.tower.from[1]) } };
  const towerExt = { uniforms: TWR, fragmentPars: 'uniform vec4 uTwr;                                          // the lantern in the fly tower: the metres in which its light falls to a third, its strength on these things at the flame, from which s to which it comes in', light: /* glsl */`
    { float tIn = smoothstep(uTwr.z, uTwr.w, -vWPos.z);
      if (tIn > 0.0) { vec3 tD = uLanternPos - vWPos; float tL = length(tD);                      // (it dies by distance as a flame's light does in a dark room, with no edge: every rope a little dimmer than the one before it, to thirty metres)
        c += albedo * max(uLanternColor * (uTwr.y * exp(-tL / uTwr.x) * max(dot(N, tD / max(tL, 1e-3)) * 0.6 + 0.4, 0.0)) - pointLight(uLanternPos, uLanternColor, uLanternRadius, N), vec3(0.0)) * tIn; } }` };
  const dressT = (kind, over = {}) => dress(kind, { ...over, extend: [towerExt, ...[].concat(over.extend || [])] });      // ... for a model that stands in the tower

  // ============================================================================================ painted scenery, hanging
  if (want('cloths')) {
    const [bcL, bcR, borderTex, flyTex] = await Promise.all([ctx.tex(R.art.backcloth[0]), ctx.tex(R.art.backcloth[1]), ctx.tex(R.art.border), ctx.tex(R.art.fly)]);
    // ---- the backcloth: 26 by 12 m in six sewn widths, standing in the water at s 120; one picture across all six (two files).
    // The middle seam is split to its top; the other four have opened from the hem up, where the stitching stood in the water:
    // whichever is nearest the prow opens round it (the page splits the middle one only: a boat arriving off the line needs a way through).
    const Bc = plan.backcloth, bw = Bc.width / Bc.widths, drop = Bc.height + 0.25, top = stageY + Bc.height;
    const panels = [];
    for (let i = 0; i < Bc.widths; i++) panels.push({ s: Bc.s, top: V(Bc.s, (i - (Bc.widths - 1) / 2) * bw, top), width: bw, drop, nx: 40, ny: 64, low: 1.6, stiff: 0.72, id: 0, mid: (i - (Bc.widths - 1) / 2) * bw, phase: 0.7,      // (a column every 11 cm: the folds it gathers in round the hull are 57 cm apart)
      uv: (u, v) => [2 * (i + u) / Bc.widths, 1 - v] });
    // the split was tied shut with tapes, a pair every two feet down its two edges (and three pairs up each seam that has opened from the hem):
    // they hang loose now, on the painted side and on the raw one, and go where their edge goes when the hull draws it aside
    const tapes = [], trnd = ctx.rng(1207), mid = Bc.widths / 2;
    for (let seam = 1; seam < Bc.widths; seam++) for (const [panel, u] of [[seam - 1, 1], [seam, 0]]) {
      const middle = seam === mid, top = middle ? 10.6 : 3.4;
      for (let y = 0.75 + trnd() * 0.3; y < top; y += middle ? 0.8 : 1.05) for (const backSide of [false, true]) {
        if (trnd() < 0.12) continue;                                       // here and there one has torn away
        tapes.push({ panel, u, v: (stageY + Bc.height - (y + (trnd() - 0.5) * 0.12)) / drop, len: 0.24 + trnd() * 0.2, width: 0.026, lean: (u ? -1 : 1) * (0.01 + trnd() * 0.07), back: backSide,
          twist: (trnd() < 0.5 ? -1 : 1) * (0.5 + trnd() * 2.4), tint: ['#d6cab0', '#c6ba9e', '#ded3b8', '#b8ac90'][Math.floor(trnd() * 4)] });
      }
    }
    const back = scenery(ctx, H, SM, panels, { maps: [bcL, bcR], part: 'seams', seam: [bw, 0], wet: 1, sway: [0.045, 0.2], hang: R.backcloth.hang, through: [0.55, 1], patches: 0.3, lights: R.backcloth.lights, moonK: R.backcloth.moon, glow: GLOW, rake: R.backcloth.rake, side: R.backcloth.side, folded: R.backcloth.folded, ...(R.backcloth.night ? { night: NIGHT, nightFirst: R.backcloth.night } : {}),
      age: [0.9, 1, 1], edge: [1000, Bc.width / 2, 0.1], tapes });
    back.mesh.name = 'backcloth';
    rig.cloths.backcloth = back;

    // ---- five blossom borders, 31 m wide, hanging from 14 m to a cut hem at 9.5 m (the first) to 11 m (the last). Their picture
    // is the blossom vault along the top of the backcloth's own painting, cut along a scalloped hem (the alpha of border.webp): the
    // two halves of that strip are laid end to end and turned about at each end, so the blossom never jumps; each border starts
    // somewhere else along it.
    const Bo = plan.borders, cellB = cells.border.cells, seg = [];
    Bo.s.forEach((s, bi) => {
      const D = Bo.top - (Bo.edge[0] + (Bo.edge[1] - Bo.edge[0]) * (bi / (Bo.s.length - 1))), dropB = D / 0.86, k = dropB / R.border.cellHeight, stripW = 2 * R.border.cellWidth * k;      // the hem's lowest scallop is 0.86 of the way down the strip
      let U0 = [0.13, 1.42, 0.71, 1.9, 0.36][bi], x = -Bo.width / 2;                              // where along the strip this border begins (in strips; 0..2 is there and back)
      while (x < Bo.width / 2 - 1e-3) {
        const next = (Math.floor(U0 * 2 + 1e-6) + 1) / 2, w = Math.min((next - U0) * stripW, Bo.width / 2 - x), U1 = U0 + w / stripW;
        const tri = (U) => { const m = ((U % 2) + 2) % 2; return m <= 1 ? m : 2 - m; };          // there and back along the strip
        const ta = tri(U0 + 1e-5), tb = tri(U1 - 1e-5), cell = cellB[Math.min(ta, tb) < 0.5 ? 0 : 1], f0 = (ta < 0.5 ? ta : ta - 0.5) * 2, f1 = (tb < 0.5 ? tb : tb - 0.5) * 2;
        seg.push({ s, top: V(s, x + w / 2, Bo.top), width: w, drop: dropB, nx: Math.max(2, Math.round(w / 1.3)), ny: 5, stiff: 0.55, id: 0, mid: x + w / 2 + bi * 40, phase: bi * 1.9,
          tint: ['#ffffff', '#f4f0f0', '#ecebee', '#e6e6ec', '#dfe1e8'][bi],
          uv: (u, v) => [cell[0] + (cell[2] - cell[0]) * (f0 + (f1 - f0) * u), cell[3] - (cell[3] - cell[1]) * v] });
        x += w; U0 = U1;
      }
    });
    const borders = scenery(ctx, H, SM, seg, { map: borderTex, cutout: true, sway: [0.05, 0.17], through: [0.8, 0.8], weave: 0.6, far: true });
    borders.mesh.name = 'borders';
    rig.cloths.borders = borders;

    // ---- three old cloths in the fly tower, 14 by 9 m, each dimmer than the last (shade 0.5, 0.25, 0.1): a moon over waves,
    // a tree in snow, a sunrise. The third hangs by one corner, its low end trailing in the water at d -8.
    const F = plan.fly, fc = cells.flycloths.cells, names = ['moon', 'snow', 'sunrise'];
    // (Seventh holder.) Which ties still hold along each batten: one every half metre when the cloth was hung; a share of them (R.fly.head.gone, more on each
    // cloth further back) has rotted through since, never more than maxGap metres in a run. Between two that hold the head hangs away from the batten in a
    // bight, `sag` metres deep at the middle of a one-metre gap and deeper as the gap to the power 1.7; the cloth under a bight bellies out of plane (scenery()).
    const headOf = (i) => {
      const Hd = R.fly.head, rn = ctx.rng(3310 + i * 7), W = F.cloth[0], ties = [-W / 2];
      for (let x = -W / 2 + 0.5; x < W / 2 - 0.01; x += 0.5) if (x - ties[ties.length - 1] >= Hd.maxGap || rn() > Hd.gone[i] || (i === 0 && Math.abs(x) < 2.3)) ties.push(x);      // (the ties over the painted moon hold: a swag across it drew it into a heart)
      ties.push(W / 2);
      const gap = (x) => { for (let k = 0; k < ties.length - 1; k++) if (x <= ties[k + 1]) return [ties[k], ties[k + 1]]; return [ties[ties.length - 2], ties[ties.length - 1]]; };
      const sag = (x) => { const [a, b] = gap(x), w = b - a, t = Math.min(1, Math.max(0, (x - a) / w)); return w < 0.75 ? 0 : Hd.sag * Math.pow(w, 1.7) * 4 * t * (1 - t); };
      const belly = (x, down) => { const sg = sag(x); if (sg < 1e-4) return 0; const [a] = gap(x), side = Math.sin(a * 12.9898 + i * 4.1) > 0.3 ? -1 : 1, f = down / (1.0 + 2.5 * sg); return side * Hd.belly * Math.sqrt(sg) * f * Math.exp(1 - f); };
      // its two side hems hang free: they draw in toward the cloth's middle, most at two thirds of its height, and wander as they fall (a cloth whose sides are
      // two ruled lines is a board)
      const edge = (x, v) => { const e = Math.abs(x) - (W / 2 - 1.5); if (e <= 0) return 0; const k = e / 1.5, sd = x > 0 ? 1 : -1, ph = i * 2.3 + sd * 1.1;
        return -sd * k * k * (Hd.edge * Math.sin(Math.PI * Math.pow(v, 0.8)) * (0.7 + 0.3 * Math.sin(v * 9.0 + ph)) + 0.035 * Math.sin(v * 21.0 + ph * 2.0) * Math.min(1, v * 4)); };
      return { sag, belly, edge, ties };
    };
    const flies = F.cloths.map((cl, i) => {
      const cell = fc[names[i]], third = i === 2, k = 0.86;                                          // the picture is wider than the cloth: its middle 86 % is shown
      return { s: cl.s, top: V(cl.s, 0, third ? R.fly.thirdTop : R.fly.top), width: F.cloth[0], drop: F.cloth[1], tilt: third ? R.fly.thirdTilt : 0, nx: 56, ny: 18, stiff: 0.5, id: i + 1, mid: i * 30, phase: i * 2.1, hem: 0.04, head: headOf(i),
        tint: new THREE.Color().setScalar(R.fly.shade[i]),
        uv: (u, v) => [cell[0] + (cell[2] - cell[0]) * (0.5 + (u - 0.5) * k), cell[3] - (cell[3] - cell[1]) * (0.006 + 0.985 * v)] };      // (a hair inside its own cell of the sheet: the next picture must not bleed into its hem)
    });
    const fly = scenery(ctx, H, SM, flies, { kind: 'canvas', map: flyTex, part: 'lift', seam: [F.cloth[0] / 6, 0], wet: 1, sway: [0.06, 0.16], hang: R.fly.hang, through: [0.5, 1], take: [0, 0, 0, 0], lights: [R.fly.lantern, 1],
      age: [0.7, 0.6, 0.3], edge: [30, F.cloth[0] / 2, 0.1], night: NIGHT, last: R.fly.last, second: R.fly.second, nightSecond: R.fly.nightSecond, rake: R.fly.rake, folded: R.fly.folded, nightFirst: R.fly.nightFirst, nightLast: R.fly.nightLast });      // (fifth holder: nightSecond. The tree in snow was a sepia print: its snow the lantern's brown. It takes less of the lantern and more of the night through its pale paint than the first cloth: a cold dusk, warm only at its foot)
    fly.mesh.name = 'fly cloths';
    rig.cloths.fly = fly;
    plan.standIn.cloths = false;                                           // kit.js (which builds after this module) leaves its stand-in cloths and its wash out
  }

  // ============================================================================================ the wing flats
  // Ten, in five pairs (wing_flats.glb holds them all, set out from the page's numbers: its origin is the middle of the stage).
  // Slots: `scene` the painted faces (the wings picture on their UVs), `back` the raw canvas inside each frame, `paint` the rest.
  if (want('flats')) {
    const wingsTex = await ctx.tex(R.art.wings);
    const FL = { uFlLight: { value: new THREE.Vector4(0.6, 1, 0.55, 0.8) }, uFlGlow: GLOW, uFlCanvas: { value: new THREE.Color(R.flats.canvas) }, uFlBack: { value: new THREE.Vector2(...R.flats.back) } };      // light through the canvas, the share of local lights in it; the lantern's and the lamp's share on the painted face
    await kit.model(M + 'wing_flats.glb', { at: [105, 0, 0], face: 'back', ...dress('timber', { color: R.flats.timber, detail: false }), materials: {      // (seventh holder: R.flats.timber. The sawn profile boards' raw backs were cream in the paper moon's light)
      // (a model's own options, its tint among them, are handed down to every slot that does not say otherwise: the painted faces and the raw backs say white)
      scene: dress('rose', { color: '#ffffff', detail: false, map: wingsTex, brush: 0.3, wake: false, take: [0, 0, 1, 0], extend: { ...FLAT_FRONT, uniforms: FL } }),
      back: dress('canvas', { color: '#ffffff', detail: false, map: wingsTex, brush: 0.3, wake: false, take: [0, 0, 1, 0], extend: { ...FLAT_BACK, uniforms: FL } }) } });
    later.push('wing_flat');
  }

  // ============================================================================================ the orchestra pit
  // The instruments stand where they were played, in 1.2 m of water (their models' z = 0 is the waterline): the harp, the one the
  // eye finds, broadside to the channel; the double bass in its stand; two kettledrums brim-full; fourteen music stands in two
  // arcs, each turned its own way toward where the conductor stood; his rostrum under the keel on the centre line.
  if (want('pit')) {
    const O = plan.orchestra, rnd = ctx.rng(7814);
    const PIT = rig.pitLight = { uPit: { value: new THREE.Vector4(0, R.pit.lantern, 0, 0) }, uPitCol: { value: new THREE.Color(R.pit.color) }, uPitMen: { value: new THREE.Color(0, 0, 0) } };
    // (each piece sinks in its own way: `sink` = [its paint just under the water, per metre of depth, its light just under, per metre], `line`: the shader's pale line a hand above the water)
    const pit = (kind, { sink = R.pit.sink, line = 1, gain = 1, through = 0, ...over } = {}) => dress(kind, { brush: 0.35, ...over, extend: [{ uniforms: { ...PIT, uPitD: { value: new THREE.Vector4(...sink) }, uPitK: { value: new THREE.Vector3(line, gain, through) } }, fragmentPars: PIT_PARS, albedo: PIT_ALBEDO, light: PIT_LIGHT }, ...[].concat(over.extend || [])] });
    rig.pitPaint = pit;                                                  // for the cast: gouache options for a thing that stands in the pit's water, dressed as this module's are: pit(kind, { sink, line, gain, through, ...gouache options })
    const HARP = { uHarpN: { value: new THREE.Vector3(0, 0, 1) }, uHarpT: { value: new THREE.Vector3(1, 0, 0) }, uHarpP: { value: new THREE.Vector3() } };
    rig.harp = await kit.model(M + 'harp.glb', { at: [O.harp[0], O.harp[1], 0], face: 'channel', turn: 0.3, ...pit('gilt', { keep: [0.55, 1, 0.7, 1], crisp: !dev.has('harpsoft'), line: 0.6, extend: dev.has('harpsoft') ? [] : { final: 'gl_FragColor.a = 0.5 - 1.55 * (1.0 - smoothstep(5.5, 9.5, length(vViewPos)));' } }),      // (fifth holder: drawn as it is carved, within six metres. The painter's filter laid its fluting, its pins and its leaves down as one flat orange; it is a thing of thin carved parts, a hand across at most, and the one the eye is meant to find. Beyond ten metres it is painted like everything else: carving smaller than a pixel would glitter. The mark in alpha is read by the filter as a share: 0.5 is painted, -1.05 and below is left as drawn. &harpsoft=1 shows it painted from everywhere)
      materials: { strings: pit('gilt', { keep: [0.8, 1, 0, 0], crisp: true, brush: 0, extend: {      // (its strings are thinner than the painter's brush: drawn as they are; gut, so no glint: a glint on a hairline is a row of beads)
        // From the composed line the harp is eleven metres off and its strings stand a pixel and a half apart: thirty-four hairlines there are a crawling
        // net. So: within eight metres a string is never drawn thinner than a pixel and a half; beyond, each becomes a flat ribbon in the plane
        // of the strings, wide enough to meet its neighbours, in the one tone a fan of strings has when the eye can no longer part them: a dim veil
        // between the column and the sound-box.
        // (the red and the dark strings, every octave's C and F, stay narrow lines in front of that veil: ten of them, a hand apart, can still be told)
        uniforms: HARP, vertexPars: 'uniform vec3 uHarpN, uHarpT, uHarpP; varying float vHarpC;',
        vertexWorld: `{ float hd = distance(wp.xyz, uCameraPos), hv = smoothstep(8.0, 10.5, hd); vec3 hn = normalize(wn);
          float hmx = max(vColor.r, max(vColor.g, vColor.b)), hmn = min(vColor.r, min(vColor.g, vColor.b));
          vHarpC = smoothstep(0.4, 0.6, (hmx - hmn) / max(hmx, 1e-3));                              // a dyed string (gut is nearly grey)
          wp.xyz += hn * (max(0.0, hd * 0.0011 - 0.003) * (1.0 - hv)) + uHarpT * (sign(dot(hn, uHarpT)) * mix(0.016, 0.0065, vHarpC) * hv);
          wp.xyz -= uHarpN * ((dot(wp.xyz - uHarpP, uHarpN) - sign(dot(uCameraPos - uHarpP, uHarpN)) * 0.004 * vHarpC) * hv); wn = mix(wn, uHarpN, hv); }`,
        fragmentPars: 'varying float vHarpC;',
        albedo: 'albedo = mix(albedo, mix(vec3(0.115, 0.12, 0.10), albedo * 1.15, 0.75 * vHarpC), smoothstep(8.0, 10.5, length(vViewPos)));' } }) } });
    { const q = rig.harp.group.getWorldQuaternion(new THREE.Quaternion());      // the plane its strings lie in: the model's own z = 0
      HARP.uHarpN.value.set(0, 0, 1).applyQuaternion(q); HARP.uHarpT.value.set(1, 0, 0).applyQuaternion(q); rig.harp.group.getWorldPosition(HARP.uHarpP.value); }
    rig.bass = await kit.model(M + 'bass.glb', { at: [O.bass[0], O.bass[1], 0], face: 'channel', turn: -0.45, ...pit('timber', { wake: true, keep: [0.6, 1, 0.5, 0.3] }) });
    rig.timpani = await kit.model(M + 'timpani.glb', { at: [O.timpani[0], O.timpani[1], 0], face: 'channel', turn: 0.35, ...pit('copper', { keep: [0.7, 1, 0.8, 0.9], line: 0 }) });      // (line 0: its tap handles stand just where the shader's pale line is drawn, and came out cream; its model carries the water's mark)
    rig.rostrum = await kit.model(M + 'rostrum.glb', { at: [O.rostrum[0], O.rostrum[1], 0], face: 'back', turn: 0.06, ...pit('timber', { wake: false, sink: R.pit.rostrumSink, line: 0 }) });      // (seventh holder: it sinks into the water as the rest of the pit does, gently: its brass rail was bone-pale beside the hull, the one thing down there the water had not touched)
    ctx.only(rig.rostrum.group, 'direct');                               // wholly under the water: not in the mirror
    const stands = O.stands.map(([sv, d], i) => {
      const p = V(sv, d, 0), c = V(O.rostrum[0], 0, 0);
      return { position: [p.x, 0, p.z], rotation: [(rnd() - 0.5) * 0.05, Math.atan2(p.x - c.x, p.z - c.z) + (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.06], scale: 0.97 + rnd() * 0.05,
        tint: ['#ffffff', '#f1ead8', '#e6e4d6', '#f6ecd6'][i % 4] };
    });
    rig.stands = await kit.models(M + 'music_stand.glb', stands, pit('brass', { brush: 0.3, keep: [0.5, 1, 0.8, 0.9], crisp: true, sink: R.pit.standSink, line: 0, gain: R.pit.standGain, through: 1 }));      // (brass strap and candle ends: thin things, drawn as they are; a stand's desk goes down through the water as brass: PIT_PARS)
    rig.standsAt = stands;
    for (const name of ['harp', 'bass', 'timpani', 'rostrum']) takeOut(name);
    later.push('music_stand');
  }

  // ============================================================================================ lines, cloud cars, the stage moon
  // (crisp: a line is thinner than the painter's brush, which used to wipe it out or leave a hair; now it is drawn its true thickness)
  const LAY = { uLay: { value: new THREE.Vector4(...R.rope.lay) } };          // how rope is laid and shaded (see "laid rope"): the lines' and the hanging ropes'
  // (Seventh holder: LINES GO UP INTO THE DARK. The stage's moonlight and its fill have no height in them: looking up from the stage every line was as pale twenty
  // metres up as at its load, a diagram of ruled hairs on the flat dark of the flies. What a line takes of any light falls away above the borders' battens.)
  const linesUp = { light: `c *= 1.0 - ${f4(R.rope.up[2])} * smoothstep(${f4(R.rope.up[0])}, ${f4(R.rope.up[1])}, vWPos.y);` };
  const lines = rig.lines = makeLines(ctx, H.paint('rope', { color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, wake: false, brush: 0.2, crisp: true, extend: [moonExt, towerExt, layExt(LAY), linesUp] }), 240);
  const ROPE = '#a8997a', WIRE = '#3b3d40', faceBack = kit.faceAngle('back', 105, 0);
  // ---- three cloud cars: scalloped boards on four lines each, from a traveller on a track up in the flies. A (4.6 m) and
  // B, C (3.4 m, the same model; C its mirror image). The page's cycle: 18 s down, 10 s held, 18 s up, 14 s out of sight.
  // A keeps the show clock (it starts down at c 20); B and C keep the realm's.
  if (want('cars')) {
    const cloudsTex = await ctx.tex(R.art.clouds);
    const CL = { uFlLight: { value: new THREE.Vector4(0, 1, 0.6, 0.85) }, uFlGlow: GLOW, uFlCanvas: { value: new THREE.Color('#8f866f') }, uFlBack: { value: new THREE.Vector2(0, 0) } };
    // (Seventh holder.) RAW TIMBER BY THE BOW LANTERN. A car's back and its bench, three metres from the flame, came out a saturated orange, like new pine under a
    // sodium lamp: the brightest thing in its frame after the chandelier. It is old grey deal: it takes the lantern at a share (R.cars.lantern) and a cooler tint.
    const CAR_LANTERN = `c -= albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * ${f4(1 - R.cars.lantern)};`;
    for (const car of plan.cloudCars) {
      const C = R.cars[car.name], sAt = C.s ?? car.s;
      const model = await kit.model(M + (car.name === 'A' ? 'cloud_car_a.glb' : 'cloud_car_b.glb'), { position: [0, -60, 0], live: true, scale: C.mirror ? [-1, 1, 1] : 1, ...dress('timber', { color: R.cars.timber, detail: false, extend: { light: CAR_LANTERN } }),      // (seventh holder: R.cars.timber, CAR_LANTERN)
        materials: { cloud: dress('pearl', { color: '#ffffff', detail: false, map: cloudsTex, brush: 0.25, wake: false, extend: { ...FLAT_FRONT, uniforms: CL } }) } });      // (the painted cloud keeps its own paint: the timber's tint is not for it)
      model.group.rotation.order = 'ZYX';
      const q = { car, C, s: sAt, model, picks: ['pick_fl', 'pick_fr', 'pick_bl', 'pick_br'], line: [], top: new THREE.Vector3(), u: 0, swing: 0 };
      // its track across the stage, the traveller on it, four lines
      lines.add(V(sAt + 0.3, -15.6, R.cars.track + 0.2), V(sAt + 0.3, 15.6, R.cars.track + 0.2), 0.055, '#5c4f42');
      q.block = lines.add(V(sAt + 0.3, 0, R.cars.track), V(sAt + 0.3, 1, R.cars.track), 0.1, '#4a4038');
      for (let k = 0; k < 4; k++) q.line.push(lines.add(V(sAt, 0, 0), V(sAt, 0, 1), 0.011, ROPE, 0.45));
      rig.cars.push(q);
    }
    takeOut('cloud_car');
  }
  // ---- the stage moon on its wire (moon_box.glb: the carriage is the body; `drum` swings under it; two sheaves turn). The wire
  // runs from a ring on the left wall up to a sheave in the flies; a hauling line goes on over that sheave, across to the right
  // wall and down to a small weight, which falls as the moon climbs.
  if (want('moon')) {
    const Sm = plan.stageMoon, faceGlow = { value: new THREE.Color(0, 0, 0) };
    const model = await kit.model(M + 'moon_box.glb', { position: [0, -60, 0], rotation: [0, faceBack, 0], live: true, ...dress('iron', { brush: 0.3 }),
      materials: { face: dress('pearl', { brush: 0.2, wake: false, extend: { uniforms: { uFaceGlow: faceGlow }, fragmentPars: 'uniform vec3 uFaceGlow;', light: 'glow += albedo * uFaceGlow;' } }) } });
    const hang = -(model.point('centre').y + 60);                        // the drum's middle hangs this far under the wire
    const p0 = V(Sm.s, Sm.from[0], Sm.from[1] + hang), p1 = V(Sm.s, Sm.to[0], Sm.to[1] + hang), dir = p1.clone().sub(p0), len = dir.length(); dir.normalize();
    const anchor = p0.clone().addScaledVector(dir, -(Sm.from[0] + 15.9) / (dir.x || 1e-6)), topSheave = p1.clone().addScaledVector(dir, (1.6 - Sm.to[0]) / (dir.x || 1e-6));
    const wall = V(Sm.s, 15.55, topSheave.y + 0.1);
    const m = rig.moon = { model, p0, p1, dir, len, anchor, topSheave, wall, faceGlow, wire: [], haul: [], light: null, tmp: new THREE.Vector3(), tmp2: new THREE.Vector3() };
    for (let k = 0; k < 10; k++) m.wire.push(lines.add(anchor, topSheave, 0.006, WIRE));           // five stretches below the carriage, five above: it sags a little either side of its load
    for (let k = 0; k < 3; k++) m.haul.push(lines.add(topSheave, wall, 0.008, ROPE));                // carriage to the top sheave; across to the wall; down to its weight
    lines.add(anchor, anchor.clone().add(new THREE.Vector3(-0.12, 0.02, 0)), 0.03, '#2f3133');       // the ring bolt in the wall
    lines.add(topSheave.clone().add(new THREE.Vector3(0, 0.02, 0)), topSheave.clone().add(new THREE.Vector3(0, 0.9, 0)), 0.02, '#2f3133');      // the hanger of the top sheave
    removeStandIn(ctx, 'moon wire');
    // heroes.js carries a ctx.light with its stand-in moon: while that stand-in exists its light is the moon's; when it is gone this module makes the light
    if (!removeStandIn(ctx, 'moon_box')) m.light = ctx.light({ position: p0, color: '#C4D6D0', radius: 17, intensity: 0 });
  }

  // ============================================================================================ the stage's working kit
  // Battens, lines and loft sheaves for every cloth; counterweights in their guides on the fly tower's walls; sandbags; pin rails;
  // the ladder behind the proscenium; the footlights and the prompter's hood under the water at the stage's edge.
  if (want('kit')) {
    const F = plan.fly, SH = plan.stageHouse, Bo = plan.borders, Bc = plan.backcloth, grid = F.grid - 0.3, sheaves = [];
    const loft = (s, d) => { sheaves.push({ at: [s, d, grid], face: 'back' }); return V(s, d, grid - 0.34); };      // a loft block under the grid: the line runs over its wheel
    // ---- battens: three for the old cloths (14.6 m: the model's own length), one each for the backcloth and the five borders (the same batten, longer)
    const flyTop = (i) => (i === 2 ? R.fly.thirdTop : R.fly.top), bat = [];
    F.cloths.forEach((cl, i) => bat.push({ at: [cl.s, 0, flyTop(i)], face: 'back', rotation: [0, 0, i === 2 ? R.fly.thirdTilt : 0] }));
    bat.push({ at: [Bc.s, 0, stageY + Bc.height], face: 'back', scale: [(Bc.width + 0.6) / 14.6, 1, 1] });
    Bo.s.forEach((s) => bat.push({ at: [s, 0, Bo.top], face: 'back', scale: [(Bo.width + 0.6) / 14.6, 1, 1] }));
    rig.battens = await kit.models(M + 'batten.glb', bat, dressT('timber'));
    ctx.only(rig.battens.group, 'direct');
    // ---- the cloths' lines, each over a loft block. The two travelling cloths have five; the third hangs by its last two; the backcloth five; a border three
    const xs5 = [-6.7, -3.35, 0, 3.35, 6.7];
    rig.fly = F.cloths.map((cl, i) => {
      const q = { i, s: cl.s, rise: 0, lines: [], xs: i === 2 ? xs5.slice(3) : xs5, batten: bat[i], tilt: i === 2 ? R.fly.thirdTilt : 0, top: flyTop(i) };
      for (const x of q.xs) q.lines.push({ x, top: loft(cl.s, x), n: lines.add(V(cl.s, x, q.top + 0.12 + Math.tan(q.tilt) * x), V(cl.s, x, grid - 0.34), 0.011, ROPE, 0.82) });
      return q;
    });
    for (const x of [-11, -5.5, 0, 5.5, 11]) lines.add(V(Bc.s, x, stageY + Bc.height + 0.12), loft(Bc.s, x), 0.011, ROPE, 0.7);
    Bo.s.forEach((s) => { for (const x of [-12.5, 0, 12.5]) lines.add(V(s, x, Bo.top + 0.12), loft(s, x), 0.011, ROPE, 0.7); });
    // ---- ten counterweights in guides on the fly tower's walls, at uneven heights; two of them are the travelling cloths' and move as their cloths move
    const cw = [], guides = [];
    for (let i = 0; i < F.counterweights; i++) {
      const s = 125 + i * 3.6, side = i % 2 ? 1 : -1, y = 1.7 + ((i * 37) % 9) * 0.68;
      guides.push({ at: [s, side * F.wall, 0], face: 'channel', tint: ['#ffffff', '#efe9e0', '#e4e2da'][i % 3] });
      const q = { i, s, d: side * (F.wall - 0.076), y, base: y, link: null, n: lines.add(V(s, side * (F.wall - 0.14), y + 0.74), loft(s, side * (F.wall - 0.14)), 0.011, ROPE, 0.85) };
      cw.push(q);
    }
    cw[1].link = 0; cw[1].base = 2.0; cw[4].link = 1; cw[4].base = 2.2;                           // (s 128.6 on the right wall: the moon cloth's; s 139.4 on the left: the snow cloth's)
    await kit.models(M + 'cw_guide.glb', guides, dressT('timber'));
    rig.weights = { list: cw, models: await kit.models(M + 'counterweight.glb', cw.map((q) => ({ at: [q.s, q.d, q.y], face: 'channel', tint: (q.tint = ['#c2bab2', '#b0a9a3', '#cdc4ba'][q.i % 3]) })), dressT('iron', { brush: 0.3 })) };      // (fifth holder: tinted down. Cast iron under the lantern came out a stack of pale pink slabs, like soap: it is dark, and rust where it is not)
    // ---- fourteen sandbags turning at head height (they hang on the ropes kit.js draws: the same places), and a fifteenth on the moon's hauling line
    const bags = Array.from({ length: F.sandbags }, (_, i) => ({ s: 123 + i * 2.7, d: (i % 2 ? 1 : -1) * (8 + ((i * 53) % 26) / 10), y: 2.5 + ((i * 29) % 66) / 10, period: 12 + ((i * 7) % 9), phase: i * 1.7 }));
    // each bag hangs on its own rope from the grid and swings on it as the long pendulum it is (two degrees either way, along the route, where
    // nothing is in its way); the rope is rebuilt with it: no bag moves without its line
    Object.assign(bags[1], { s: 126.5, d: 4.3, y: 5.2 });                  // (one of the fourteen hangs before the moon cloth, where the page's own postcard 9 looks: "a sandbag turning" against the painted sea)
    // (Seventh holder.) THREE MORE OVER THE WATER, where the rider passes under them: a spare line is kept from running through its block by a bag of sand,
    // so these are the tower's own order, not its neglect. Their lowest canvas is two and a half metres over the water, a metre and a half over the rider's head;
    // each turns and swings on its own rope like the rest. R.bagsOver: [s, d, the height of its middle, seconds for a turn there and back, phase].
    for (const [s, d, y, period, phase] of R.bagsOver) bags.push({ s, d, y, period, phase, over: true });
    for (const b of bags) { b.top = V(b.s, b.d, grid); b.len = grid - (b.y + 0.4); b.line = lines.add(V(b.s, b.d, b.y + 0.4), b.top, 0.0125, ROPE, 0.9); }
    if (rig.moon) bags.push({ moon: true, s: plan.stageMoon.s, d: 15.55, y: 10, period: 17, phase: 0.4 });
    bags.forEach((b, i) => { b.scale = b.moon ? 0.8 : [1.0, 1.18, 0.88, 1.08, 0.94, 1.25, 1.0, 0.84, 1.12][i % 9]; });      // (no two the same weight: a bag is made up to what its line carries)
    rig.bags = { list: bags, models: await kit.models(M + 'sandbag.glb', bags.map((b) => ({ at: [b.s, b.d, b.y], scale: b.scale, tint: (b.tint = ['#ffffff', '#ece6d6', '#dfdccf', '#f4eede'][(b.s * 3 | 0) % 4]) })), dressT('canvasBag', { brush: 0.4 })) };
    // ---- (seventh holder) two tackles the fly men left hanging over the water, between the cloths: two iron-strapped wooden blocks each (tackle_block.glb, the same
    // block twice: the upper hung by its hook, the lower with its hook down, over the rider's head) and one rope rove through them: from the grid to the upper
    // block's hook; the standing part from the upper block's becket down round the lower sheave and up over the upper; the fall hanging free beside it. The whole
    // swings as the long pendulum it is and the lower block turns a little on its two parts; every part of the rope is rebuilt from where its blocks are.
    // R.tackle: the block's own measures (keep them the same as tackle.py's), and each tackle: [s, d, the height of the lower hook's bowl, the distance between
    // the two sheaves, the height the fall ends at, its phase].
    { const TK = R.tackle, list = TK.at.map(([sT, dT, hookY, drop, fall, ph], k) => {
        const top = V(sT, dT, grid), lowY = hookY + TK.hook, upY = lowY + drop - 2 * TK.sheave;
        const t = { k, s: sT, d: dT, top, lowY, upY, fall, ph, turn: 0.6 + k * 1.9, n: [] };
        t.n.push(lines.add(V(sT, dT, upY + TK.hook), top, 0.0125, ROPE, 0.92));                // the grid to the upper block's hook
        for (let j = 0; j < 3; j++) t.n.push(lines.add(V(sT, dT, lowY), V(sT, dT, upY), 0.011, ROPE, 0));      // the standing part, the running part, the fall
        return t; });
      const places = []; for (const t of list) places.push({ at: [t.s, t.d, t.upY], rotation: [Math.PI, t.turn, 0] }, { at: [t.s, t.d, t.lowY], rotation: [0, t.turn, 0] });
      const models = await kit.models(M + 'tackle_block.glb', places, dressT('timber', { brush: 0.3, color: TK.tint, detail: false, wake: false }));
      for (const m of models.meshes) m.frustumCulled = false;
      rig.tackles = { list, models }; }
    // ---- pin rails: four standing in the water of the fly tower, two on the stage's fly galleries
    // (Fourth holder: the rails' rope, every line's belay and its hank, is not in these files any more: it is laid rope, made with the hanging ropes: "the rope walls" below)
    rig.rails = [];                                                        // where each rail stands, for its rope: { s, d (of its middle), y (of its model's zero), sg, RAIL (its top above that), wet }
    for (const s of R.rail.s) for (const sg of [-1, 1]) rig.rails.push({ s, sg, d: sg * R.rail.d, y: 0, RAIL: R.rail.height, wet: true });
    for (const sg of [-1, 1]) rig.rails.push({ s: R.rail.dry.s, sg, d: sg * (SH.wall - 1.0), y: SH.gallery.y + 0.18, RAIL: R.rail.dry.height, wet: false });
    await kit.models(M + 'pin_rail.glb', rig.rails.filter((q) => q.wet).map((q) => ({ at: [q.s, q.d, q.y], face: 'channel', tint: ['#ffffff', '#f1ebdf'][(q.s > 140 ? 1 : 0) ^ (q.sg > 0 ? 1 : 0)] })), dressT('timber', { wake: true }));
    const dryRails = await kit.models(M + 'pin_rail_dry.glb', rig.rails.filter((q) => !q.wet).map((q) => ({ at: [q.s, q.d, q.y], face: 'channel' })), dress('timber'));
    ctx.only(dryRails.group, 'direct');
    // ---- the ladder leaning on the back of the proscenium
    await kit.model(M + 'ladder.glb', { at: [92.4, -13.45, 0], face: 'back', ...dress('timber', { wake: true }) });
    // ---- the footlights along the stage's edge and the prompter's hood behind them: under the water, never lit
    const tin = dress('brass', { color: '#b9c4c0', side: THREE.DoubleSide, wake: false, brush: 0.3 });
    const foot = await kit.model(M + 'footlight_trough.glb', { at: [plan.footlights.s, 0, 0], face: 'back', ...dress('brass', { wake: false }), materials: { tin } });
    const hood = await kit.model(M + 'prompt_shell.glb', { at: [plan.footlights.s + 0.3, 0, 0], face: 'back', ...dress('timber', { wake: false }), materials: { tin } });
    ctx.only(foot.group, 'direct'); ctx.only(hood.group, 'direct');
    // ---- loft blocks: one over every line above (and the moon's two)
    if (rig.moon) { const m = rig.moon, q = ctx.path.locate(m.topSheave.x, m.topSheave.z); sheaves.push({ position: [m.topSheave.x, m.topSheave.y + 0.34, m.topSheave.z], face: 'back' }, { position: [m.wall.x, m.wall.y + 0.34, m.wall.z], face: 'back' }); void q; }
    const sh = await kit.models(M + 'sheave.glb', sheaves, dress('iron', { brush: 0.3 }));
    ctx.only(sh.group, 'direct');
    later.push('pin_rail', 'counterweight', 'sandbag', 'sheave', 'batten', 'ladder', 'footlight_trough');
  }

  // ============================================================================================ the rope walls
  // The fly tower's walls of rope (the page: 30 a side, 25 mm, d 10.3 to 11.5, s 122 to 160) and the last rope, to the water at s 160.
  // Where a pin rail stands, every pin that carries a coil has its line coming down to it from the grid, made fast and still (railRope:
  // the line, its belay, its hank); the rest hang free: a third trail in the water (dark where they have drunk it), the others end at
  // head height and above: in a stopper knot over a whipped end, in a whipped end alone, or in a spliced eye. They sway as long
  // pendulums and the hull pushes them aside (the cast's damped swing takes it from here: rig.ropes.U.uRopeP = sway, speed, push, reach).
  if (want('ropes')) {
    const F = plan.fly, grid = F.grid - 0.3, rnd = ctx.rng(4160), list = [], tints = ['#b3a47e', '#a8997a', '#bdb08c', '#9c8f72', '#b0a380', '#8f8068'];
    const rails = R.rail.s, ends = ['wet', 'wet', 'eye', 'whip', 'knot', 'knot'];
    for (const sg of [-1, 1]) for (let i = 0; i < F.ropes.perSide; i++) {
      const s = F.ropes.s[0] + (F.ropes.s[1] - F.ropes.s[0]) * (i + 0.5 * ((i * 13) % 3)) / F.ropes.perSide, d = sg * (F.ropes.d[0] + (F.ropes.d[1] - F.ropes.d[0]) * (((i * 17) % 10) / 9));
      if (rails.some((rs) => Math.abs(s - rs) < 3.3)) continue;            // a rail's own lines stand there
      const end = ends[(i * 7 + (sg > 0 ? 3 : 0)) % 6], low = end === 'wet' ? -0.4 : 0.5 + ((i * 31 + (sg > 0 ? 7 : 0)) % 21) / 10;
      list.push({ bottom: V(s, d, low), top: V(s + 0.05, d, grid), r: 0.0125, free: true, phase: rnd() * 6.28, amp: 0.6 + rnd() * 0.8, end, color: tints[(i * 3 + (sg > 0 ? 1 : 0)) % 6] });
    }
    // (Seventh holder.) ROPE OVER THE CHANNEL. Everything this stage hung in the tower was at its walls, nine metres and more from the composed line: from the
    // middle of the water the lantern had nothing near it to light, and the tower was black water under a fan of hairlines. A fly tower's lines do not keep to
    // its walls: spot lines and spare falls hang wherever a piece was last flown from. A dozen hang over the water here, between the cloths, their ends well
    // over the rider's head (the boat goes under them): each a rope's thickness in the lantern's light with its lay, its knot or its eye, swaying as the long
    // pendulum it is. R.rope.over: [s, d, the height of its end, how it ends, its radius, which tint].
    for (const [s, d, low, end, r, ti] of R.rope.over) list.push({ bottom: V(s, d, low), top: V(s + 0.04, d + 0.03, grid), r, free: true, phase: rnd() * 6.28, amp: 0.7 + rnd() * 0.7, end, color: tints[ti % 6], over: true });
    const Lr = F.lastRope;                                                 // the last rope: a hawser, the one thing the area shows as it is left; it trails in the water
    list.push({ bottom: V(Lr.s, Lr.d, -0.45), top: V(Lr.s - 0.3, Lr.d + 0.1, grid), r: R.rope.last, sides: 8, free: true, phase: 1.3, amp: 2.6, end: 'wet', color: '#a39675', last: true });
    rig.ropes = makeRopes(ctx, H, list, LAY, (B) => {
      (rig.rails || []).forEach((q, k) => {                                 // each rail's own rope (the stage's two gallery rails are seen from nine metres below: fewer turns, darker)
        const top = q.wet ? grid : plan.stageHouse.roof - 1, rr = ctx.rng(5300 + k * 17);
        railRope(B, (x, y, z) => V(q.s - q.sg * x, q.d + q.sg * y, q.y + z), { RAIL: q.RAIL, rnd: rr, tints: q.wet ? tints : ['#8a8470', '#7d7866', '#93897a'], tint: k, near: q.wet, slip: q.wet ? [7, 4, 9, 6][k % 4] : -1, wetTo: q.wet ? 0 : null,
          fade: q.wet ? 0.86 : 0.93, top: (x) => V(q.s - q.sg * x + (rr() - 0.5) * 0.3, q.d + q.sg * (-0.2 + rr() * 0.4), top) }, R.rail);
      });
    }, [towerExt]);
    rig.lastRope = { q: list[list.length - 1], next: 0 };
    later.push('rope walls');
  }

  // ============================================================================================ the wave rollers
  // Eight, across the wings, half in the water: wave_roller.glb on two trestle.glb each, a crank.glb on the journal toward the
  // middle of the stage. A roller turns about its own length (its model's X) by a NEGATIVE angle, so that the steep front of its
  // wave leads and the crests travel toward its +X; alternate ranks are set end for end, so neighbours turn opposite ways and
  // their waves run opposite ways. All eight are one draw call: their instance matrices are rewritten each frame.
  if (want('rollers')) {
    const Ro = plan.rollers, mid = (Ro.d[0] + Ro.d[1]) / 2, list = [], tr = [];
    Ro.s.forEach((s, r) => { for (const side of [-1, 1]) {
      const turn = (r % 2 === 0) === (side > 0) ? 0 : Math.PI, inner = side > 0 ? 0 : Math.PI;       // the crank's own turn puts it on the end toward the middle
      list.push({ s, d: side * mid, turn, inner, period: Ro.periods[r], phase: (r * 0.37 + (side > 0 ? 0.21 : 0.66)) % 1, n: 0, next: 0.2 + 0.11 * list.length });
      for (const e of [-1, 1]) tr.push({ at: [s, side * mid + e * 2.1, 0], turn: e * side > 0 ? 0 : Math.PI, tint: ['#ffffff', '#efe9e2', '#e3e6dc', '#f4efe4'][(r + (e > 0 ? 1 : 0) + (side > 0 ? 2 : 0)) % 4] });
    } });
    // (Third holder: wave_roller.glb rebuilt: every hoop the outline of one breaking wave, the foam on its lip; 2-heroes-stage.md.)
    // (Sixth holder: rebuilt again: the wave has a body. A fat twisted column whose crest is a rounded shoulder, not a thin lip: from the centre line a row of small
    // breaking waves at the flats' feet, from behind three swells; foam in dabs along the crest, two faded stripes down the back. Same axis, same handedness, same size.)
    // SCENE PAINT UNDER THE BOW LANTERN. The house's light lays lantern light on green things as a warm grey of their own value (right for
    // velvet and lacquer). On a painted wave two metres from the gunwale that turned petrol and pearl into grey-brown: the roller takes the
    // lantern at a share (uRollP.x) and keeps its petrol under it (uRollP.y). Only with the house's second light, whose uniforms these are.
    const ROLL = dev.second ? { uniforms: { uRollP: { value: new THREE.Vector4(R.rollers.lantern, R.rollers.hue, R.rollers.lampGrey, R.rollers.lamp) } }, fragmentPars: 'uniform vec4 uRollP;', light: /* glsl */`
    { vec3 rLan = pointLight(uLanternPos, uLanternColor, uLanternRadius, N);
      float rLum = dot(albedo, vec3(0.3, 0.55, 0.15)), rCool = clamp((max(albedo.g, albedo.b) - albedo.r) / max(rLum, 0.03) * 2.0, 0.0, 1.0);
      vec3 rWas = mix(albedo, vec3(rLum) * vec3(1.14, 0.95, 0.76), uWarmP.y * rCool);               // what the house laid the lantern on
      vec3 rLv = uLanternPos - vWPos; float rK = 1.0 - uLanternK * (1.0 - 1.0 / (1.0 + dot(rLv, rLv) / 6.0));
      c += rLan * rK * (mix(rWas, albedo * 1.2, uRollP.y) * uRollP.x - rWas);
      // and the kept lamp, the other way about: on the stage the house counts it for more, and amber times petrol is lime (from the stalls, before the
      // hour, the roller by the lamp was the one lemon-green thing in the house). It falls on the roller at a share, half as a warm grey of the paint's own value.
      vec3 rLamp = pointLight(uLampPos, uLampColor, uLampRadius, N) * (1.0 + uLampMore);
      c += rLamp * (mix(albedo, vec3(rLum) * vec3(1.14, 0.95, 0.76), uRollP.z) * uRollP.w - albedo); }` } : [];
    const o = dress('petrol', { brush: 0.18, take: [R.rollers.waterLight, 0, 1, 0], extend: ROLL });      // (water-light at a share: a third of it falls whatever the paint, and at full strength it laid a brown web over the petrol)
    const tints = ['#ffffff', '#eef2ea', '#f6efe2', '#e6ece8', '#fbf7ee', '#e9eee6', '#f2ece0', '#f4f6f0'];      // no two faded alike
    const rollers = await kit.models(M + 'wave_roller.glb', list.map((q, i) => ({ at: [q.s, q.d, Ro.axisY], rotation: [0, q.turn, 0], tint: (q.tint = tints[i % tints.length]) })), o);
    const cranks = await kit.models(M + 'crank.glb', list.map((q) => ({ at: [q.s, q.d, Ro.axisY], rotation: [0, q.inner, 0] })), dress('iron', { brush: 0.18 }));
    await kit.models(M + 'trestle.glb', tr, dress('timber'));
    for (const m of [...rollers.meshes, ...cranks.meshes]) m.frustumCulled = false;
    rig.rollers = { list, rollers, cranks, hold: hold('roll') };
    later.push('wave_roller', 'trestle');
  }

  // ============================================================================================ every frame
  const part = { seam: null, passedAt: -1e9, was: -99 }, eye = new THREE.Vector3();
  const moonHold = hold('moonu'), carHold = hold('car'), flyHold = hold('fly'), tmp = new THREE.Vector3(), tmp2 = new THREE.Color(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  rig.moonAt = new THREE.Vector3();
  let first = true;
  return {
    update(dt) {
      const time = ctx.time, c = show.c;
      if (first) { first = false; for (const name of later) takeOut(name); }
      const back = rig.cloths.backcloth;
      if (back) {
        // ---- through the painting. Where the boat is, in the cloth's own terms: ba metres across from the middle seam, bn metres past its plane.
        const Bc = plan.backcloth, bw = Bc.width / Bc.widths, b = ctx.boat, q = ctx.path.locate(b.x, b.z, ctx.s), ba = q.d, bn = q.s - Bc.s;
        if (part.seam == null || Math.abs(bn) > 3.4) part.seam = Math.max(-2, Math.min(2, Math.round(ba / bw))) * bw;      // the seam nearest the prow; held while the hull is in the cloth
        if (part.was < 1.7 && bn >= 1.7 && part.was > -90) part.passedAt = time;                       // the stern is through: the halves hang apart, a seam of gold, then swing shut
        part.was = bn;
        const since = time - part.passedAt, gap = since < 8 ? 0.2 * smooth(0, 0.6, since) : 0.2 * (1 - smooth(8, 11.5, since));
        back.U.uPartA.value.set(part.seam, ba, bn, 1); back.U.uPartB.value.x = gap;
        // as the cloth sweeps over the eye the picture washes to the fly tower's plum-black (the page: to 1 over 1 s and back over 1.5 s; here by the eye's distance from the cloth)
        eye.copy(ctx.engine.shared.uCameraPos.value); const e = ctx.path.locate(eye.x, eye.z, ctx.s), s0 = Bc.s;
        const w = e.s < s0 ? smooth(s0 - 2.4, s0 - 0.2, e.s) : 1 - smooth(s0 + 0.1, s0 + 3.4, e.s);
        if (w > 0.002 && Math.abs(e.d) < Bc.width / 2 + 0.5) ctx.wash('#17111A', w);
      }
      GLOW.value.set('#FFD27A').multiplyScalar(R.glow * (shared.show ? shared.show.k : 0));
      if (rig.pitLight) {
        const lit = smooth(17.5, 21, c);                                                         // the stage boxes' branches catch at show clock 18 to 19.5
        rig.pitLight.uPit.value.x = R.pit.candles * lit;
        rig.pitLight.uPit.value.z = R.pit.house * (shared.show ? shared.show.k : 0);                 // the share of the house's flames that burn
        rig.pitLight.uPitMen.value.set(R.pit.edge[0]).lerp(tmp2.set(R.pit.edge[1]), lit).multiplyScalar(R.pit.edge[2]);      // the water's edge: pearl before the hour, gold after
      }
      // ---- the wave rollers: once round in 6, 7, 8.5 and 10 s (front rank to back), with a slight catch once a turn and a pace that wanders
      if (rig.rollers) {
        const W = rig.rollers, Ro = plan.rollers;
        W.list.forEach((q, i) => {
          const u = time / q.period + q.phase, turns = u + 0.012 * Math.sin(2 * Math.PI * u) + 0.006 * Math.sin(0.37 * time + i);
          const a = W.hold != null ? -W.hold * Math.PI / 180 : -2 * Math.PI * turns;
          W.rollers.place(i, { at: [q.s, q.d, Ro.axisY], rotation: [a, q.turn, 0], tint: q.tint });
          W.cranks.place(i, { at: [q.s, q.d, Ro.axisY], rotation: [q.turn === q.inner ? a : -a, q.inner, 0] });
          // where a crest breaks the surface it writes on the water: the stage is never still
          if (time >= q.next) { q.next = time + 0.45; q.n++; const x = (((q.n * 0.618) % 1) - 0.5) * 3.6, w = at(ctx, q.s + (q.n % 2 ? 0.3 : -0.3), q.d + x, 0, eye); ctx.water.ripple(w.x, w.z, 0.25, 0.6); }
        });
      }
      // ---- the old cloths travel on their lines (3 m in 12 s, then rest); each one's counterweight goes the other way by the same
      // amount; battens and lines go with them. A first slow motion on the realm's clock: the staging latches the page's moments
      // (rig.fly[i].want = 0..1 takes a cloth over: 0 down, 1 up).
      if (rig.fly.length) {
        const tr = R.fly.travel, cyc = (ph) => { const p = (time + ph) % 60; return p < 14 ? 0 : p < 26 ? smooth(14, 26, p) : p < 44 ? 1 : p < 56 ? 1 - smooth(44, 56, p) : 0; };
        rig.fly.forEach((q, i) => {
          const u = i === 2 ? 0 : flyHold != null ? flyHold : q.want != null ? q.want : cyc(i ? 34 : 4);      // the first is down while the second is up
          q.rise = u * tr;
          if (rig.cloths.fly) rig.cloths.fly.U.uRise.value[i + 1] = q.rise;
          if (i < 2 && rig.battens) rig.battens.place(i, { at: [q.s, 0, q.top + q.rise], face: 'back' });
          for (const l of q.lines) { at(ctx, q.s, l.x, q.top + q.rise + 0.12 + Math.tan(q.tilt) * l.x, eye); lines.set(l.n, eye, l.top); }
        });
      }
      if (rig.weights.list) {
        const W = rig.weights, tr = R.fly.travel;
        for (const q of W.list) {
          if (q.link == null) continue;
          const y = q.base + (tr - rig.fly[q.link].rise);
          if (Math.abs(y - q.y) < 1e-4) continue;
          q.y = y; W.models.place(q.i, { at: [q.s, q.d, y], face: 'channel', tint: q.tint });      // (fifth holder: place() writes a copy's tint with its place: without it here a travelling weight, bag or roller went back to untinted on its first frame)
          at(ctx, q.s, q.d - Math.sign(q.d) * 0.064, y + 0.74, eye); tmp.copy(eye); tmp.y = plan.fly.grid - 0.64; lines.set(q.n, eye, tmp);
        }
      }
      if (rig.bags) {
        const B = rig.bags;
        const calm = ctx.reducedMotion ? 0.35 : 1;
        B.list.forEach((b, i) => {                                         // bags turn on their ropes, 40 degrees either way in 12 to 20 s
          const turn = 0.7 * Math.sin(time * 2 * Math.PI / b.period + b.phase);
          if (b.moon) { if (rig.moon) { b.y = rig.moon.wall.y - 1.2 - rig.moonU * rig.moon.len - 0.4 * b.scale; } B.models.place(i, { at: [b.s, b.d, b.y], rotation: [0, turn, 0], scale: b.scale, tint: b.tint }); return; }
          // ... and swing: a pendulum as long as its rope (about ten seconds there and back), two degrees either way, along the route
          const th = 0.035 * calm * Math.sin(time * Math.sqrt(9.81 / b.len) + b.phase * 2.3), sn = Math.sin(th), cs = Math.cos(th);
          const hang = 0.4 * b.scale, L0 = b.len + 0.4 - hang;                                       // (the bag's own knot stands `hang` above its middle: a bigger bag hangs lower by the difference, on the same rope)
          B.models.place(i, { at: [b.s + (L0 + hang) * sn, b.d, b.top.y - (L0 + hang) * cs], rotation: [th, turn, 0], scale: b.scale, tint: b.tint });
          at(ctx, b.s + L0 * sn, b.d, b.top.y - L0 * cs, eye); lines.set(b.line, eye, b.top);
        });
      }
      // ---- the tackles: each swings from the grid as one long pendulum; its lower block turns a little on its two parts; its rope goes with its blocks
      if (rig.tackles) {
        const TK = R.tackle, calm = ctx.reducedMotion ? 0.35 : 1, a = tmpA, b = tmpB;
        rig.tackles.list.forEach((t, i) => {
          const L = t.top.y - t.lowY, w = Math.sqrt(9.81 / L), th = TK.swing * calm * Math.sin(time * w + t.ph), th2 = 0.6 * TK.swing * calm * Math.sin(time * w * 0.87 + t.ph * 1.7);
          const hd = t.turn, tw = hd + TK.twist * calm * Math.sin(time * 0.23 + t.ph * 2.3);
          const at2 = (y, lx, heading, out) => { const o = t.top.y - y; out.set(t.top.x + o * th + lx * Math.cos(heading), y, t.top.z + o * th2 - lx * Math.sin(heading)); return out; };      // a point y high, lx along a block's own sheave
          at2(t.upY, 0, hd, a); rig.tackles.models.place(2 * i, { position: [a.x, a.y, a.z], rotation: [Math.PI, hd, 0] });
          at2(t.lowY, 0, tw, b); rig.tackles.models.place(2 * i + 1, { position: [b.x, b.y, b.z], rotation: [0, tw, 0] });
          lines.set(t.n[0], at2(t.upY + TK.hook, 0, hd, a), t.top);
          lines.set(t.n[1], at2(t.lowY - TK.sheave, -TK.lead, tw, a), at2(t.upY, 0, hd, b));                          // the standing part: the upper block's becket to the lower sheave
          lines.set(t.n[2], at2(t.lowY - TK.sheave, TK.lead, tw, a), at2(t.upY + TK.sheave, TK.lead, hd, b));         // up the other side to the upper sheave
          lines.set(t.n[3], at2(t.fall, -TK.lead - 0.34, hd, a), at2(t.upY + TK.sheave, -TK.lead, hd, b));             // and over it: the fall, hanging free, a little out of plumb
        });
      }
      // ---- the cloud cars: down, held, up, out of sight; they swing on their lines like the long pendulums they are
      for (const q of rig.cars) {
        const C = q.C, tau = C.clock === 'show' ? (c >= C.from ? c - C.from + (show.held ? time : 0) : -1) : time + C.phase;
        const cyc = R.cars.cycle, T = cyc[0] + cyc[1] + cyc[2] + cyc[3], p = tau < 0 ? T - 1 : tau % T;
        const u = carHold != null ? carHold : p < cyc[0] ? smooth(0, cyc[0], p) : p < cyc[0] + cyc[1] ? 1 : p < cyc[0] + cyc[1] + cyc[2] ? 1 - smooth(cyc[0] + cyc[1], cyc[0] + cyc[1] + cyc[2], p) : 0;
        const stop = p < cyc[0] ? 99 : p < cyc[0] + cyc[1] ? p - cyc[0] : p < cyc[0] + cyc[1] + cyc[2] ? 99 : p - cyc[0] - cyc[1] - cyc[2];      // seconds since it last stopped
        const dd = q.car.from[0] + (q.car.to[0] - q.car.from[0]) * u, y = q.car.from[1] + (q.car.to[1] - q.car.from[1]) * u, L = R.cars.track - y;
        const w = 2 * Math.PI * 0.17, calm = ctx.reducedMotion ? 0.4 : 1;
        const sw = (0.026 * Math.sin(w * time + q.s) + (stop < 14 ? 0.052 * Math.exp(-stop / 5.5) * Math.sin(w * stop) : 0)) * calm, pitch = 0.006 * Math.sin(0.83 * time + q.s * 2);
        at(ctx, q.s, dd, R.cars.track, q.top);
        q.model.group.position.set(q.top.x + L * Math.sin(sw), q.top.y - L * Math.cos(sw), q.top.z);
        q.model.group.rotation.set(pitch, faceBack, sw);
        q.model.group.updateMatrixWorld(true);
        eye.set(q.top.x - 0.5, q.top.y + 0.02, q.top.z - 0.3); tmp.set(q.top.x + 0.5, q.top.y + 0.02, q.top.z - 0.3); lines.set(q.block, eye, tmp);
        q.picks.forEach((name, k) => { q.model.point(name, tmp); eye.set(q.top.x + (k % 2 ? 0.38 : -0.38) * (C.mirror ? -1 : 1), q.top.y - 0.08, q.top.z + (k < 2 ? 0.16 : -0.16) - 0.3); lines.set(q.line[k], tmp, eye); });
        q.u = u; q.swing = sw;
      }
      // ---- the stage moon: it begins to rise at c 20 and takes 80 s (the same law as the light heroes.js carries); its light on this module's things
      {
        const Sm = plan.stageMoon, u = moonHold != null ? moonHold : smooth(0, 1, Math.min(1, Math.max(0, (c - R.moon.from) / R.moon.takes))), on = smooth(R.moon.from - 1, R.moon.from + 3, c);
        rig.moonAt = at(ctx, Sm.s, Sm.from[0] + (Sm.to[0] - Sm.from[0]) * u, Sm.from[1] + (Sm.to[1] - Sm.from[1]) * u, rig.moonAt); rig.moonU = u; rig.moonOn = on;
        SM.uSmPos.value.set(rig.moonAt.x, rig.moonAt.y, rig.moonAt.z, R.moon.reach); SM.uSmCol.value.set(R.moon.color).multiplyScalar(R.moon.light * on);
      }
      if (rig.moon) {
        const m = rig.moon, g = m.model.group, u = rig.moonU, on = rig.moonOn, travelled = u * m.len;
        g.position.copy(m.p0).addScaledVector(m.dir, travelled);
        const sway = 0.009 * Math.sin(time * 0.9) * (ctx.reducedMotion ? 0.4 : 1) + 0.004 * Math.sin(time * 0.37 + 1);
        m.model.parts.drum.rotation.z = sway;
        m.model.parts.sheave_a.rotation.z = m.model.parts.sheave_b.rotation.z = -travelled / 0.085;       // they roll up the wire
        g.updateMatrixWorld(true);
        m.faceGlow.value.set('#C4D6D0').multiplyScalar(R.moon.face * on);
        // the wire: anchor to carriage, carriage to the top sheave, each sagging a finger for every metre of its length
        const a0 = m.model.point('tail', m.tmp), a1 = m.model.point('haul', m.tmp2);
        for (let half = 0; half < 2; half++) {
          const A = half ? g.position : m.anchor, B = half ? m.topSheave : g.position, span = A.distanceTo(B), sag = 0.004 * span;
          for (let k = 0; k < 5; k++) {
            const t0 = k / 5, t1 = (k + 1) / 5;
            eye.lerpVectors(A, B, t0); eye.y -= sag * 4 * t0 * (1 - t0); tmp.lerpVectors(A, B, t1); tmp.y -= sag * 4 * t1 * (1 - t1);
            lines.set(m.wire[half * 5 + k], eye, tmp);
          }
        }
        // the hauling line and its weight: what the moon climbs, the weight falls
        lines.set(m.haul[0], a1, m.topSheave); lines.set(m.haul[1], m.topSheave, m.wall);
        eye.copy(m.wall); eye.y = m.wall.y - 1.2 - travelled; lines.set(m.haul[2], m.wall, eye);                  // (a sandbag hangs on its end: `the stage's working kit`)
        if (m.light) { m.model.point('centre', m.light.position); m.light.intensity = 0.55 * on; }
        void a0;
      }
      // ---- where the rower stands, for the ropes that give way to her (ROPE_VERT): 0.22 m to port of the boat's middle and 1.38 m aft of it (docs/build/news.md)
      if (rig.ropes && rig.ropes.U.uRopeHer) {
        const b = ctx.boat, h = b.heading, aboard = !!(b.model && b.model.rower) && !dev.has('ropeher');
        rig.ropes.U.uRopeHer.value.set(b.x - 0.22 * Math.cos(h) + 1.38 * Math.sin(h), b.z + 0.22 * Math.sin(h) + 1.38 * Math.cos(h), aboard ? 0.65 : 0);
      }
      // ---- the last rope trails in the water and draws a small ring there as it swings (the same sway as its shader's)
      if (rig.lastRope && time >= rig.lastRope.next) {
        const L = rig.lastRope, q = L.q, P = rig.ropes.U.uRopeP.value, k = P.x * q.amp * q.top.y / 28;
        L.next = time + 1.4;
        ctx.water.ripple(q.bottom.x + Math.sin(time * P.y + q.phase) * k, q.bottom.z + 0.6 * Math.sin(time * P.y * 0.83 + q.phase * 1.7) * k, 0.14, 0.3);
      }
      if (lines) lines.flush();
      void kit; void M; void f4; void dress;
    },
  };
}
