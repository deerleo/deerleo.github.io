// The theatre of leaves: the cast, group "Cloth" (stage 3). The log is docs/build/theatre/3-cast-cloth.md: what lives where,
// what the page asked that was changed, the handles and hooks left for the staging, what it costs.
//
// What is here:
//   THE HOUSE CURTAIN   the ribbons family's festoon (src/engine/cloth.js makeFestoon: a 96 by 56 grid on nine lines 2.9 m apart)
//                       in the house's velvet, with a surface of its own (pleats, the folds of what is gathered, an embroidered
//                       hem, a lining with its tapes and rings), hung behind the proscenium so that nothing of it comes through
//                       the arch or the pelmet. Its travel is a function of the show clock (shared.show.c): it rises once.
//   its hem             given to the 160 tassels of kit_tiers.js (shared.horseshoe.tassels.hem)
//   ITS RIGGING         a batten at its head, nine lines up its back, three counterweights on guide wires on the stage-left wall
//                       (counterweight.glb, the stage builder's model; the family's counterweight() on each group's line): one mesh
//                       whose moving ends follow the lines' own travel in the vertex shader. No line moves without its load.
//   THE PAGES           fourteen parts on the music stands and the score's page (blank ruled card): they turn, stir, fall back when the
//                       wake knocks their stand; the stands the hull can touch lean away; the harp's strings ring the water.
//   ONE AIR             for the cloth other modules hang (box curtains, swags, tassels, borders, backcloth, fly cloths): gust, stream.
// Everything it publishes for the staging is in shared.cast.cloth (see the end of build()). It plays no sound itself.
// Held twice: the second holder's changes are marked "second look" (the curtain's surface and light, its scallops, the card).
//
// Developer switches (with ?realm=theatre):  &cc=<clock>  hold the curtain's own clock (13 down .. 27 up, 28.2 all lines home);
//   &ccpleat=0  no pleats or folds painted on it (the family's cloth as it comes);  &ccgust=1, &ccstream=1  hold the gust, the fall's
//   draught, on all cloth;  &ccturn=4  every page turns every four or five seconds (to see one);  &ccring=2  the trailing corner's ring, stronger;
//   &ccpage=1.57&ccbend=0.5  every page held at an angle;  &ccharp=3  the harp's rings every three seconds;  &ccbreathe=6  the backcloth's breath every six;
//   &ccplain=1  the curtain without its own surface and light (to measure them);  &cclog=30  after thirty seconds, every hook fired so far (what, when),
//   printed by tools/shot.py as "NOT AN ERROR": the way to check what the staging will hear.
import * as THREE from 'three';
import { makeFestoon } from '../../engine/cloth.js';
import { counterweight } from '../../engine/life/machines.js';
import { at, house, dev } from './lib.js';
import { KEEP } from './light.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ================================================================================================ the curtain's own surface
// The family's festoon gives the cloth its mechanics: nine lines, the scallops between them, the cloth below each ring gathered
// ring upon ring, a nap that is fixed to the cloth. At 96 by 56 its grid cannot carry pleats half a metre apart or folds a hand
// deep, so those are painted here, for every pixel, from the cloth's own coordinates (metres across, metres above the hem as
// the cloth was cut): they never slide or stretch, and they fade to their own average where a pixel can no longer hold them.
const CURTAIN_FRAG_PARS = /* glsl */`
  uniform vec4 uCcA;          // which pass this is (0 the picture, 1 the picture without the water, 2 the mirror); metres between two lines; the cloth's height; metres between rings
  uniform vec4 uCcC;          // how deep its hanging folds are modelled (0 flat .. 1); how far a gathered roll turns the light; how dark a crease is; how much its pile lights where it turns from the eye
  uniform vec4 uCcD;          // half the width between its outermost lines; metres it stirs at the hem (3 cm at rest, 12 in a gust); metres its scallops swing toward the stage as the lines stop; metres the fall's draught streams them
  uniform vec3 uCcGold, uCcLining, uCcLit, uCcKey;       // gilt thread; the lining; the light of the kindled house on its face; the way to the house's one broad light (the moon's column, then the tree's fire: up and to the left)
  uniform vec4 uCcKeep;       // how velvet behaves in the house's light (light.js KEEP)
  uniform vec4 uCcE;          // (metres the scallops bob: the vertex shader's); how much of the moon's column falls on its face; how far that light models its folds (0 flat .. 1); how dark the pelmet's shadow lies on its head
  vec4 ccKeep;                // ... and how each pixel of it does (gilt thread is not velvet): the house's light reads this instead of its one number for the whole cloth
  float ccAo, ccGold;         // how far down in a fold this pixel is (1 open .. 0 deep in a crease); how much of it is gilt thread: the light below reads them
  #define uKeep ccKeep
`;
// SECOND LOOK (19:50). As first built the folds were drawn as fine even lines on a flat ground (the room's dark, which is most of
// what velvet shows of itself here, took no shading at all): a corrugated shutter before the kindling, a quilt after it. Velvet
// is big soft shapes of light and dark. So now: BROAD hanging folds (0.9 to 1.6 m, no two alike) with finer ones riding on them
// only where a pixel can hold them; what is gathered hangs in ROLLS, one to each pair of rings, each lit on its shoulder, dark
// under its lip, and laying a shadow on the roll below; and one light models all of it, from up and to the left where the moon's
// column stands and, later, the fire in the tree (the light block below multiplies everything the house gives by it).
const CURTAIN_ALBEDO = /* glsl */`
    { // ---- the house curtain's own surface (src/realms/theatre/cast_cloth.js)
      ccKeep = uCcKeep; ccAo = 1.0; ccGold = 0.0;
      if (uCcA.x > 0.5 && uCcA.x < 1.5) { gl_FragColor = vec4(albedo * 0.1, 1.0); return; }      // the picture without the water: only its depth is read up here
      float cx = vFest.x, ch = vFest.y, cg = clamp(vFest.w, 0.0, 1.0);        // metres across; metres above the hem, in the cloth; how far into what is gathered
      float ccFace = gl_FrontFacing ? 1.0 : -1.0;
      float pxx = max(length(vec2(dFdx(cx), dFdy(cx))), 1e-5), pxh = max(length(vec2(dFdx(ch), dFdy(ch))), 1e-5);      // metres of cloth under one pixel
      // where it is between two lines: 0 at a line, 1 midway; metres to the nearest line
      float clu = fract((cx + uCcD.x) / uCcA.y), cin = step(abs(cx), uCcD.x);
      float cscal = 4.0 * clu * (1.0 - clu) * cin, clt = mix(abs(cx) - uCcD.x, min(clu, 1.0 - clu) * uCcA.y, cin);
      float cgath = smoothstep(0.0, 0.45, cg);                                 // 0 where it hangs free .. 1 well into what is gathered
      float cpinch = exp(-clt * clt / 0.07) * cgath;                           // at a line the gathered cloth is pinched together on its tape
      float chem = 1.0 - clamp(ch / uCcA.z, 0.0, 1.0);                         // 0 at its head .. 1 at its hem
      // the cloth's face, worked out here and not taken from the grid (which is too coarse to carry it): the tangents of how far
      // it is turned aside (tX) and up (tY) from looking straight into the house; and how deep in a fold it lies (ao)
      float tX = 0.0, tY = 0.0, ao = 1.0;
      // HANGING FOLDS. Heavy cloth cut half as full again as its track hangs from its head in broad round folds, no two the same
      // width: a back that takes the light, a crease that is round at its bottom too. Where a swag hangs, the fullness is drawn out into the swag.
      float bq = cx * 5.46 + 1.4 * sin(cx * 1.31 + 0.4) + 0.8 * sin(cx * 0.53 + 2.0) + 0.6 * sin(ch * 0.31 + 1.7 * sin(cx * 0.23));      // (no fold runs plumb: each wanders a hand's breadth on its way down)
      float bx = 2.0 * fract(bq / 6.2832) - 1.0;                               // -1 at a crease .. 0 on a fold's back .. 1 at the next crease
      float drawn = 1.0 - 0.7 * smoothstep(0.0, 0.45, cg * cscal);
      float bamp = uCcC.x * (0.8 + 0.2 * chem) * drawn * (0.74 + 0.26 * sin(0.37 * bq + 1.1));      // (some folds deeper than their neighbours)
      tX += bamp * 1.15 * bx * inversesqrt(1.0 - 0.72 * bx * bx) * (1.0 - smoothstep(0.82, 1.0, abs(bx)));
      ao *= 1.0 - 0.55 * bamp * smoothstep(0.45, 1.0, abs(bx));
      // finer folds ride on the broad ones; they come and go across the cloth, and are there only where a pixel can hold them
      float fq = cx * 14.96 + 1.5 * sin(cx * 1.9 + 0.4) + 0.7 * sin(cx * 0.71 + 2.0), fdq = 14.96 + 2.85 * cos(cx * 1.9 + 0.4) + 0.497 * cos(cx * 0.71 + 2.0);
      float fxs = 2.0 * fract(fq / 6.2832) - 1.0;
      float fhold = (1.0 - smoothstep(0.08, 0.26, pxx * fdq / 6.2832)) * drawn * uCcC.x * (0.55 + 0.45 * sin(cx * 0.9 + 1.3 * sin(ch * 0.21 + cx * 0.17))) * step(uCcA.x, 1.5);      // (not in the water's mirror)
      tX += 0.42 * fxs * (1.0 - smoothstep(0.8, 1.0, abs(fxs))) * fhold;
      ao *= 1.0 - 0.2 * smoothstep(0.5, 1.0, abs(fxs)) * fhold;
      // it is never quite still: a slow wave three metres long crosses it, a hand deep at the hem (the same wave the vertex shader
      // moves it by), and what turns with it is the light on every fold
      tX -= uCcD.y * (0.25 + 0.75 * chem) * 2.1 * cos(uTime * 1.15 + cx * 2.1 + 1.7 * sin(cx * 0.31));
      // at a line the gathered cloth is crushed small on its tape; a swag hangs between two lines like a hammock: its face looks
      // outward toward each line
      tX += 0.8 * cpinch * (1.0 - smoothstep(0.1, 0.3, pxx * 9.5)) * cos(cx * 61.0 + 2.0 * sin(ch * 3.1)) - 0.3 * cgath * (1.0 - 2.0 * clu) * cin;
      ao *= 1.0 - 0.45 * cpinch;
      // WHAT IS GATHERED hangs in rolls, one to each pair of rings, each lapping the one below like a tile: its shoulder looks up
      // and out, its lip turns under, and under the lip of the roll above it lies in that roll's shadow. Broad in the middle of a
      // swag, tight at the lines; no two swags' rolls quite level with one another.
      float fv = fract(ch / uCcA.w + 0.09 * cscal * sin(cx * 2.3 + 1.7 * floor((cx + uCcD.x) / uCcA.y)));      // 0 at a roll's lip .. 1 under the lip of the roll above
      float fdeep = cgath * (0.4 + 0.6 * cscal) * (1.0 - 0.5 * cpinch);
      float fsee = (1.0 - smoothstep(0.16, 0.42, pxh / uCcA.w)) * fdeep;
      tY += uCcC.y * (2.3 * fv - 0.95) * fsee + 0.12 * cgath * cscal;
      // a swag that swings toward the stage turns its face up to the light, and down again as it comes back: from the house, where
      // a swing along the line of sight cannot be seen, that is what shows of the stop and of the fall's draught
      tY += 1.3 * cgath * cscal * (uCcD.z + uCcD.w * (0.72 + 0.2 * sin(uTime * 1.9 + cx * 0.83) + 0.08 * sin(uTime * 3.3 - cx * 2.1)));
      float fsh = smoothstep(0.6, 1.0, fv);
      ao *= 1.0 - uCcC.z * mix(0.4 * fdeep, fsh * fsh + 0.35 * (1.0 - smoothstep(0.0, 0.05, fv)), fsee);
      N = normalize(vec3(tX, tY, 1.0)) * ccFace;
      ccAo = ao;
      if (gl_FrontFacing) {
        ccKeep.z *= 0.04;                                                      // velvet is not wet: the house's hard gleam on every fold was a row of pinstripes
        if (ch < 0.93) {                                                       // (only the lowest metre of the cloth pays for its embroidery)
        // the hem: bullion braid along the edge, and between two rules a running stem of beech leaves in tarnished gilt thread
        float braid = 1.0 - smoothstep(0.09, 0.1125 + pxh, ch), band = step(0.225, ch) * step(ch, 0.8325), gold, motif = 0.4, fine = 0.0;
        if (uCcA.x > 1.5) gold = clamp(braid + 0.94 * step(0.1725, ch) * step(ch, 0.885), 0.0, 1.0);      // (the water's mirror: a band of old gold is all it can hold)
        else {
        fine = 1.0 - smoothstep(0.018, 0.0675, max(pxx, pxh));
        float rules = smoothstep(0.1725 - pxh, 0.1875, ch) * (1.0 - smoothstep(0.21, 0.225 + pxh, ch)) + smoothstep(0.8325 - pxh, 0.8475, ch) * (1.0 - smoothstep(0.87, 0.885 + pxh, ch));
        float sx = cx * 2.8888, stemY = 0.5175 + 0.1125 * sin(sx);
        float stem = 1.0 - smoothstep(0.0135, 0.021 + pxh, abs(ch - stemY) * inversesqrt(1.0 + 0.1056 * cos(sx) * cos(sx)));
        float lk = floor(cx / 0.271875 + 0.5), lxk = lk * 0.271875, lsd = mod(lk, 2.0) < 0.5 ? 1.0 : -1.0;
        float la = atan(0.325 * cos(lxk * 2.8888)) + lsd * 0.95;                 // each leaf leaves the stem at 55 degrees, up and down by turns
        vec2 lp = vec2(cx - lxk, ch - (0.5175 + 0.1125 * sin(lxk * 2.8888)));
        vec2 lq = vec2(lp.x * cos(la) + lp.y * sin(la), -lp.x * sin(la) + lp.y * cos(la));      // along the leaf from its foot, across it
        float lu = lq.x / 0.22, lw = 0.07 * sin(3.1416 * clamp(lu, 0.0, 1.0)) * (1.2 - 0.55 * lu);      // a pointed oval, widest below its middle: a beech leaf
        float leaf = step(0.0, lu) * step(lu, 1.0) * (1.0 - smoothstep(lw - 0.0045, lw + pxx, abs(lq.y)));
        leaf *= 1.0 - 0.6 * (1.0 - smoothstep(0.00225, 0.0075 + pxx, abs(lq.y)));          // its midrib is left in the velvet
        // (the band between the rules is a woven gold galloon, duller than the thread laid on it: from the house it is a band of
        // old gold, from under the arch a stem of leaves on it; as bare velvet with a thin stem it was a pale gauze)
        motif = max(stem, leaf);
        gold = clamp(braid + rules + band * 0.94, 0.0, 1.0);
        }
        vec3 thread = uCcGold * (0.7 + 0.6 * festN(vFest.xy * vec2(70.0, 70.0))) * (0.8 + 0.4 * festN(vFest.xy * vec2(1.3, 9.0))) * (1.0 - 0.12 * band) * mix(vec3(1.0), vec3(0.74, 0.55, 0.36), band * fine * motif);      // (the galloon is the bright thing; the stem and its leaves are worked on it in a deeper, redder gold)
        albedo = mix(albedo, thread, gold);
        ccKeep = mix(ccKeep, vec4(0.8, 1.0, 0.3, 0.85), gold);                  // gilt thread keeps its own colour in the dark and gives a flame back; velvet does not
        ccGold = gold;
        }
      } else {
        // its lining: drab sateen, a tape down the back at every line with a brass ring where the cloth is sewn to it
        float tape = 1.0 - smoothstep(0.03, 0.036 + pxx, clt);
        float ring = 1.0 - smoothstep(0.017, 0.024 + max(pxx, pxh), length(vec2(clt, (fract(ch / uCcA.w + 0.5) - 0.5) * uCcA.w)));
        vec3 lin = uCcLining * (0.84 + 0.32 * festN(vFest.xy * vec2(2.6, 0.9)));
        lin = mix(lin, lin * 1.5 + 0.015, tape);
        albedo = mix(lin, vec3(0.36, 0.27, 0.12), ring * (1.0 - smoothstep(0.004, 0.02, max(pxx, pxh))));
        // seen from the stage every roll hangs away from the eye: its valley is what shows
        albedo *= (1.0 - 0.22 * bamp * smoothstep(0.45, 1.0, abs(bx))) * (1.0 - 0.42 * cpinch) * (1.0 - 0.42 * mix(0.5 * fdeep, 0.5 - 0.5 * cos(fv * 6.2832), fsee));
      }
    }`;
const CURTAIN_LIGHT = /* glsl */`
    { // (cast_cloth.js) ONE LIGHT MODELS THE CLOTH. Whatever the house gives it (the room's dark, the moon's scatter, the fill of a
      // lit house, the lantern, water-light) falls on folds: full on the faces that look up and to the left, where the moon's
      // column stands and later the fire in the tree; less on the faces that look away; least in the creases and under each
      // roll's lip. Without this the room's dark, which is most of what shows, lay on the cloth as one flat tone.
      if (gl_FrontFacing) {
        float ccDw = clamp(dot(N, uCcKey) * 0.6 + 0.4, 0.0, 1.0); ccDw *= ccDw;
        float ccHead = 11.0 + 5.0 * sqrt(max(1.0 - vWPos.x * vWPos.x / 144.0, 0.0));            // the arch's head here (plan.archHead): the pelmet hangs under it and shades the cloth's head
        float ccPel = 1.0 - uCcE.w * smoothstep(ccHead - 3.6, ccHead - 1.0, vWPos.y);
        c *= mix(1.0, ccAo * (0.33 + 0.82 * ccDw), uCcE.z) * ccPel;                               // (flat cloth facing the house: 1)
        // the kindled house falls on its face: a room full of flames is one broad light (the house's candle pools do not reach
        // behind the arch); warm on green as the house's own light is
        c += albedo * uCcLit * (ccAo * ccPel * (0.15 + 0.85 * ccDw) * (1.0 + 1.1 * ccGold));      // (gilt thread answers candlelight far more than velvet: tarnish before the hour, gold after it)
        // before the kindling the lit rain is the house's one broad light: it lays a soft pearl on the shoulder of every fold
        float ccLum = dot(albedo, vec3(0.3, 0.55, 0.15));
        c += uMoonCol * mix(albedo, vec3(ccLum * 1.1), 0.6) * (uShaft.w * uCcE.y * ccAo * ccPel * ccDw);
      }
      // velvet: its pile catches whatever light there is where the cloth turns away from the eye
      float ccGraze = 1.0 - clamp(abs(dot(N, V)), 0.0, 1.0);
      c *= 1.0 + uCcC.w * ccGraze * ccGraze * (gl_FrontFacing ? 1.0 : 0.3);
    }`;
const CURTAIN_VERT_PARS = /* glsl */`
  uniform vec4 uCcB;          // the realm's z of the plane its lines hang in; how far toward the house anything of it may come (metres); metres it streams toward the stage; metres its hem stirs
  uniform vec4 uCcE;          // metres the scallops bob when the lines stop; (the moon on its face: the fragment shader's)
`;
const CURTAIN_VERT = /* glsl */`
    { // (after the festoon has placed the point: vFest = metres across, metres above the hem in the cloth, fold, how far into what is gathered)
      float ccHem = 1.0 - clamp(vFest.y / uFest.y, 0.0, 1.0), ccG = clamp(vFest.w, 0.0, 1.0);
      // nothing of it comes nearer the house than the back of the pelmet: its folds are pressed, not cut
      float ccD = wp.z - uCcB.x;
      if (ccD > 0.0) wp.z = uCcB.x + uCcB.y * (1.0 - exp(-ccD / uCcB.y));
      // a draught toward the stage: what hangs between two lines streams that way, the hem most, never two scallops alike
      // (at a line the cloth is held by its rings: it stays on the line)
      float ccU = fract((vFest.x + 0.5 * uFest.w * (uFest.z - 1.0)) / uFest.w), ccMid = pow(4.0 * ccU * (1.0 - ccU), 0.7) * step(abs(vFest.x), 0.5 * uFest.w * (uFest.z - 1.0));
      float ccFl = 0.72 + 0.2 * sin(uTime * 1.9 + vFest.x * 0.83) + 0.08 * sin(uTime * 3.3 - vFest.x * 2.1);
      wp.z -= uCcB.z * (0.25 + 0.75 * ccG) * ccHem * ccHem * ccFl * ccMid;
      // it is never quite still (the same wave the fragment shader lights it by)
      wp.z += uCcB.w * (0.25 + 0.75 * ccHem) * sin(uTime * 1.15 + vFest.x * 2.1 + 1.7 * sin(vFest.x * 0.31));
      // when its lines stop, what hangs between them runs on a hand's breadth, falls back and is still
      wp.y += uCcE.x * ccMid * ccHem * ccHem;
    }`;

// ================================================================================================ the pages
// A part on a music stand: one folded sheet. One leaf lies on the desk; the other is the page that turns, from lying open
// beside it to lying closed on top of it and, the next time, back: each a card of eight triangles, hinged at the spine in
// the vertex shader. (The stands turn their backs to the channel, and their desks are open lyres: a leaf that leaves its
// half of the desk bare is what a rider sees of a page turning.) A card never stretches: it is an arc of its own width,
// turned about the spine by its angle and curled by its bend. All fifteen (fourteen parts and the score's one page) are
// one draw call; each instance's matrix is its desk's own frame on its stand (spine foot, across, up the slope, out toward the reader).
const PAGE_VERT_PARS = /* glsl */`
  attribute float aSheet;                     // 0 the leaf that lies on the desk, 1 the page that turns
  attribute vec4 aPage;                       // the turning page's angle about the spine (0 lying open to the right .. pi closed on the other leaf), its bend, a leaf's width and height
  attribute vec2 aPageB;                      // a phase of its own; 1 if the lying leaf is drawn (the score's leaves are modelled)
  varying vec2 vPg;
`;
const PAGE_VERT_LOCAL = /* glsl */`
    {
      float pu = uv.x, pv = uv.y, pw = aPage.z, pth, pbd, pup;
      if (aSheet < 0.5) { pth = 3.14159265; pbd = -0.16 - 0.05 * sin(uTime * 0.6 + aPageB.x * 1.7); pup = 0.002; pw *= aPageB.y; }
      else { pth = aPage.x; pbd = aPage.y; pup = 0.006; }
      float pal = pth + pbd * pu;                                              // the way the card runs, this far from the spine
      vec2 pp = abs(pbd) > 0.001 ? (pw / pbd) * vec2(sin(pal) - sin(pth), cos(pth) - cos(pal)) : pw * pu * vec2(cos(pth), sin(pth));
      transformed = vec3(pp.x, pv * aPage.w, pp.y + pup);
      objectNormal = vec3(-sin(pal), 0.0, cos(pal));
      vPg = vec2(pu, pv * aPage.w);
    }`;
const PAGE_FRAG_PARS = /* glsl */`
  varying vec2 vPg;                           // 0 at the spine .. 1 at the fore edge; metres up the leaf
  uniform vec4 uPit; uniform vec3 uPitCol;    // the stage boxes' candles on the pit (their share, .., .., ..) and their colour: heroes_stage.js lights the stands with the same two
  float pgHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float pgNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(pgHash(i), pgHash(i + vec2(1.0, 0.0)), f.x), mix(pgHash(i + vec2(0.0, 1.0)), pgHash(i + vec2(1.0, 1.0)), f.x), f.y); }
`;
const PAGE_ALBEDO = /* glsl */`
    { // blank ruled card: staves of five faint lines and nothing on them; yellowed, darker where it has drunk the water
      float gpx = max(length(vec2(dFdx(vPg.y), dFdy(vPg.y))), 1e-5);            // metres of card under one pixel
      float gsys = fract(vPg.y / 0.0375 + 0.3), gin = step(0.3, gsys) * step(gsys, 0.7) * step(0.07, vPg.x) * step(vPg.x, 0.95);
      float gline = 1.0 - smoothstep(0.06, 0.16, abs(fract((gsys - 0.3) / 0.1 + 0.5) - 0.5));
      float gfine = 1.0 - smoothstep(0.0006, 0.0025, gpx), gband = 1.0 - smoothstep(0.004, 0.015, gpx);
      albedo *= 1.0 - gin * mix(0.16 * gband, 0.45 * gline, gfine);
      albedo *= 0.9 + 0.14 * pgNoise(vPg * vec2(9.0, 60.0) + 3.0);
      float gwet = 1.0 - smoothstep(0.0, 0.07, vWPos.y);
      albedo *= mix(vec3(1.0), vec3(0.62, 0.7, 0.62), gwet);
      albedo *= 1.0 - 0.18 * exp(-pow((vWPos.y - 0.085) / 0.012, 2.0));         // the line the water has left
    }`;
// (second look) The card was the one thing on a stand the pit's candles did not light: drab by candlelight, pale blue before it.
const PAGE_PIT = /* glsl */`
    { // once the stage boxes' candle branches burn four metres over the pit (show clock 18), their gold lies on the card as on the
      // brass beside it; card is the same on both its faces and takes a light from behind nearly as well as from in front
      vec3 gp = normalize(vec3(sign(vWPos.x) * 0.55, 0.72, -0.42));
      c += albedo * uPitCol * (uPit.x * smoothstep(-0.3, 0.08, vWPos.y) * (0.3 + 0.4 * abs(dot(N, gp))));
    }`;
const PAGE_LIGHT = /* glsl */`
    { // pale card a few metres from the bow lantern would be the brightest thing in the pit: it takes a quarter of it
      vec3 gl = uLanternPos - vWPos;
      c -= albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * (1.0 - uLanternK * (1.0 - 1.0 / (1.0 + dot(gl, gl) / 6.0))) * 0.72;
    }`;

// ================================================================================================ the curtain's rigging
// One mesh, made once: every stretch of line, the batten, its blocks, the head sheaves and the guide wires. The ends that
// move (a line's foot at the hem, a weight's line at its eye) carry which travel they follow and how far (aMove), and the
// vertex shader moves them: nothing is rebuilt.
const RIG_VERT_PARS = /* glsl */`
  attribute vec2 aMove;                       // which travel it follows (0..8 a line of the curtain, 9..11 a counterweight), and by how much (0 fixed, 1 with it)
  uniform float uCcRig[12];                   // metres each has moved up (a line of the curtain) or down (a weight: negative)
`;
const RIG_VERT_LOCAL = /* glsl */`
    transformed.y += aMove.y * uCcRig[int(aMove.x + 0.5)];`;

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const H = house(ctx, plan, shared), V = (s, d, y = 0) => at(ctx, s, d, y), show = shared.show || { c: -1 };
  const P = plan.castCloth, hold = (k) => (dev.has(k) && dev.get(k) !== '' ? +dev.get(k) : null);
  const calm = () => (ctx.reducedMotion ? 0.5 : 1);
  const cloth = shared.cast.cloth = { on: { rustle: null, creak: null, knock: null, drop: null } };
  /** A sound the staging may play: the hook, if one is attached, gets the place and what it is. */
  const fire = (name, p, info = {}) => { const fn = cloth.on[name]; if (fn) fn({ x: p.x, y: p.y, z: p.z, ...info }); };

  // ============================================================================================ the house curtain
  // A festoon (the ribbons family's): 25 by 14.5 m, its hem at 3 m in the first image and sagging 0.3 m between its nine lines;
  // drawn up 11 m it hangs in nine scallops 1.6 m deep under the pelmet, the cloth below every ring gathered into folds.
  const Cu = P.curtain, N = Cu.lines, top = V(Cu.s, 0, Cu.top);
  const CU = {
    uCcA: { value: new THREE.Vector4(0, Cu.gap, Cu.height, Cu.rings) },
    uCcB: { value: new THREE.Vector4(top.z, Cu.forward, 0, 0) },
    uCcC: { value: dev.get('ccpleat') === '0' ? new THREE.Vector4(0, 0, 0, 0) : new THREE.Vector4(Cu.folds[0], Cu.folds[1], Cu.folds[2], Cu.folds[3]) },
    uCcD: { value: new THREE.Vector4(0.5 * Cu.gap * (N - 1), 0, 0, 0) },
    uCcKeep: { value: new THREE.Vector4(...KEEP.velvet) },
    uCcE: { value: new THREE.Vector4(0, dev.second ? Cu.moon : 0, dev.get('ccpleat') === '0' ? 0 : Cu.model, Cu.pelmetShade) },
    uCcGold: { value: new THREE.Color('#B4904A') }, uCcLining: { value: new THREE.Color('#5c6252') }, uCcLit: { value: new THREE.Color(0, 0, 0) },
    uCcKey: { value: new THREE.Vector3(...Cu.key).normalize() },
  };
  // (&ccplain=1: the cloth in the house's velvet without its own surface and light, to measure what those cost)
  const finish = dev.has('ccplain') ? { uniforms: CU, vertexPars: CURTAIN_VERT_PARS, vertexWorld: CURTAIN_VERT }
    : { uniforms: CU, vertexPars: CURTAIN_VERT_PARS, vertexWorld: CURTAIN_VERT, fragmentPars: CURTAIN_FRAG_PARS, albedo: CURTAIN_ALBEDO, light: CURTAIN_LIGHT };
  // The family overwrites `material.extend` with its own, so the factory is given a ctx whose kit.gouache dresses whatever it
  // asks for in the house's velvet (the house's light first, then the family's own extension, then the surface above).
  const velvetCtx = Object.create(ctx);
  velvetCtx.kit = Object.create(ctx.kit);
  velvetCtx.kit.gouache = (o = {}) => { const { extend, ...rest } = o; return ctx.kit.gouache(H.dress('velvet', { ...rest, wakeH: Cu.waterLight, extend: [...[].concat(extend || []), finish] })); };
  const festoon = makeFestoon(velvetCtx, { at: [top.x, Cu.top, top.z], turn: 0, width: Cu.width, height: Cu.height, lines: N, margin: (Cu.width - Cu.gap * (N - 1)) / 2,
    travel: Cu.travel, rise: 0, sag: Cu.sag, color: '#1F4A3E', trim: null, rings: Cu.rings, pleat: 0, stir: 0, segments: [96, 56] });
  // (no `wind` is given: the family then makes one for this ctx alone, so the area's shared wind is left for whoever makes it, and a front
  // sent down it does not stream the curtain a second time: its stir and its stream are the ones below)
  const FU = festoon.material.uniforms, lines = FU.uFestLines.value;      // (the lines' own array: metres each is drawn up. Written here every frame; the family's rise() is not used)
  // (second look) A scallop is cut into the cloth: it is as deep as it will ever be once its lines have come in a few metres, not only
  // at the top of the travel. The family deepens it evenly over the whole 11 m, and half up the curtain was a blind with a wavy edge.
  FU.uFestB.value.z = Cu.sagBy;
  festoon.object.name = 'house curtain (festoon)';
  festoon.object.onBeforeRender = (renderer) => { CU.uCcA.value.x = ctx.engine.reflecting ? 2 : renderer.getRenderTarget() === ctx.engine.pre ? 1 : 0; festoon.material.uniformsNeedUpdate = true; };

  // ---- its travel. One clock of its own, `cc`, which follows the show clock but never faster than would bring the curtain up in
  // `least` seconds; every line's height is a function of that clock alone, so a held clock (&c=20) shows it half up, and the
  // same clock twice gives the same picture.
  const RATE = Cu.takes / Cu.least, HOME = Cu.from + Cu.takes + Math.max(...Cu.lag), half = 0.5 * Cu.gap * (N - 1);
  const lineAt = (i, cc) => plan.curtainHem(cc - Cu.lag[i]) - 3;
  const swingAt = (cc) => { const tau = cc - HOME; return tau > 0 && tau < 9 ? Cu.swing * Math.exp(-tau / 1.5) * Math.sin(tau * Math.PI * 2 / 2.4) : 0; };
  // (each group's swags bob as its own lines stop: seen from the house, where a swing toward the stage cannot be)
  const bobAt = (cc) => { let b = 0; for (const lag of [0, 0.6, 1.2]) { const tau = cc - (Cu.from + Cu.takes + lag); if (tau > 0 && tau < 6) b += Math.exp(-tau / 1.1) * Math.sin(tau * Math.PI * 2 / 1.3); } return Cu.bob * b / 3; };
  /** The hem's height above the water at `x` metres right of the centre line (the festoon's own arithmetic for its hem row). */
  const hemAt = (x) => {
    const fx = (x + half) / Cu.gap, k = Math.max(0, Math.min(N - 2, Math.floor(fx))), u = fx - k, uc = clamp01(u), us = uc * uc * (3 - 2 * uc);
    let lift = lines[k] + (lines[k + 1] - lines[k]) * us;
    const out = Math.max(-u, u - 1, 0) * Cu.gap, tail = smooth(0, 1, out / Math.max(0.5 * (Cu.width - 2 * half), 0.05));
    lift -= Math.min(0.15 * lift * tail, 0.7 * out);
    const S = Cu.sag[0] + (Cu.sag[1] - Cu.sag[0]) * clamp01(lift / Cu.sagBy);
    return Cu.top - Cu.height + lift + Cu.sag[0] * (1 - tail) - S * 4 * uc * (1 - uc) + CU.uCcE.value.x * (out > 0 ? 0 : Math.pow(4 * uc * (1 - uc), 0.7));
  };
  const curtain = cloth.curtain = {
    object: festoon.object, festoon,
    /** true: it follows the show clock (shared.show.c). Set it false to drive it by hand with `clock`, set() or rise(). */
    auto: true,
    /** Its own clock: 13 down, 27 the first lines home, 28.2 all home, then the scallops swing twice. */
    clock: hold('cc') ?? -1,
    /** Put it at a clock value at once (a cue's settle): set(13) down, set(40) up and still. */
    set(c) { curtain.auto = false; curtain.clock = c; curtain.running = 0; return curtain; },
    /** Raise it by hand in `seconds` (never under the plan's least), from where it is. */
    rise(seconds = Cu.takes) { curtain.auto = false; curtain.clock = Math.max(curtain.clock, Cu.from); curtain.running = Cu.takes / Math.max(Cu.least, seconds); return curtain; },
    running: 0,
    /** Metres line i (0 on the left .. 8) is drawn up now: what its counterweight has come down. */
    line: (i) => lines[Math.max(0, Math.min(N - 1, i))],
    lines: N,
    /** The hem's height above the water at d = across: what the stage has uncovered there. */
    hemAt,
    /** 0 down .. 1 up: the share of its travel done (the mean of its lines). */
    get up() { let a = 0; for (let i = 0; i < N; i++) a += lines[i]; return a / (N * Cu.travel); },
    /** true while any line travels. */
    get moving() { return curtain.clock > Cu.from && curtain.clock < HOME; },
    /** 0..1: how hard the draught streams its scallops toward the stage (the fall). null: it follows the show clock (c 29 to 40). */
    stream: null,
  };
  if (hold('cc') != null) curtain.auto = false;

  // ---- the tassels (kit_tiers.js) take their hem from it, and hang in its plane instead of the pelmet's
  const tassels = shared.horseshoe && shared.horseshoe.tassels;
  if (tassels) {
    tassels.hem = (x) => hemAt(x);
    if (tassels.mesh) tassels.mesh.position.copy(V(Cu.tassels, 0, 0).sub(V(plan.curtain.s - 0.04, 0, 0)));
  }
  const tasselZ = tassels && tassels.mesh ? tassels.mesh.position.z : 0;

  // ============================================================================================ the curtain's rigging
  // (The festoon draws no lines and the ten modelled counterweights all stand in the fly tower: the page has the curtain's come
  // down the stage-left wall. Everything here is behind the proscenium: seen from the stage, looking back.)
  const Rg = P.rig, rigU = { uCcRig: { value: new Array(12).fill(0) } };
  {
    const pos = [], col = [], mov = [], idx = [], c = new THREE.Color(), a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), d3 = new THREE.Vector3(), u3 = new THREE.Vector3(), v3 = new THREE.Vector3();
    /** A straight member from a to b ([s, d, y] each): `sides` round (4: a square bar, set flat), radius r; ma, mb: [which travel, how much] for either end. */
    const member = (a, b, r, color, { sides = 4, ma = [0, 0], mb = [0, 0], caps = false, flat = 1 } = {}) => {
      at(ctx, a[0], a[1], a[2], a3); at(ctx, b[0], b[1], b[2], b3);
      d3.subVectors(b3, a3).normalize(); u3.set(Math.abs(d3.y) > 0.9 ? 1 : 0, Math.abs(d3.y) > 0.9 ? 0 : 1, 0).cross(d3).normalize(); v3.crossVectors(d3, u3);
      const base = pos.length / 3; c.set(color);
      for (const [q, m] of [[a3, ma], [b3, mb]]) for (let k = 0; k < sides; k++) {
        const t = (k + (sides === 4 ? 0.5 : 0)) / sides * Math.PI * 2, cx = Math.cos(t) * r, sx = Math.sin(t) * r * flat;
        pos.push(q.x + u3.x * cx + v3.x * sx, q.y + u3.y * cx + v3.y * sx, q.z + u3.z * cx + v3.z * sx); col.push(c.r, c.g, c.b); mov.push(m[0], m[1]);
      }
      for (let k = 0; k < sides; k++) { const k1 = (k + 1) % sides; idx.push(base + k, base + k1, base + sides + k, base + k1, base + sides + k1, base + sides + k); }
      if (caps) for (const [o, flip] of [[base, true], [base + sides, false]]) for (let k = 1; k < sides - 1; k++) idx.push(o, o + (flip ? k + 1 : k), o + (flip ? k : k + 1));
    };
    const ROPE = '#a8997a', TIMBER = '#5c4e42', IRON = '#34363a', WIRE = '#4a4c50';
    const sB = Cu.s + Rg.batten, yB = Cu.top + 0.05, xs = Array.from({ length: N }, (_, i) => (i - (N - 1) / 2) * Cu.gap);
    // the batten its head is tied to, a little longer than the cloth, and a block on it over every line
    member([sB, -Cu.width / 2 - 0.25, yB], [sB, Rg.end + 0.25, yB], 0.075, TIMBER, { caps: true, flat: 0.8 });
    xs.forEach((x, i) => {
      member([sB + 0.02, x, yB - 0.2], [sB + 0.02, x, yB + 0.02], 0.05, IRON, { caps: true });                                  // its block
      // the line: from its ring at the hem (which rises) up the back of the cloth to its block, then along the batten to its end
      member([Cu.s + Rg.clear, x, Cu.top - Cu.height + Cu.sag[0] + 0.04], [sB + 0.02, x, yB - 0.18], 0.011, ROPE, { ma: [i, 1] });
      member([sB + 0.02 + 0.014 * (i % 3), x, yB + 0.1 + 0.012 * Math.floor(i / 3)], [sB + 0.02 + 0.014 * (i % 3), Rg.end, yB + 0.1 + 0.012 * Math.floor(i / 3)], 0.011, ROPE);
    });
    member([sB + 0.02, Rg.end, yB - 0.12], [sB + 0.02, Rg.end, yB + 0.2], 0.07, IRON, { caps: true });                           // the block at the batten's end that turns them upward
    Rg.groups.forEach((g, k) => {
      const sk = Rg.s[k];
      member([sB + 0.03, Rg.end, yB + 0.16], [sk, Rg.d, Rg.head], 0.014, ROPE);                                                    // three lines as one, up to their head sheave
      member([sk - 0.035, Rg.d, Rg.head], [sk + 0.035, Rg.d, Rg.head], 0.17, IRON, { sides: 8, caps: true });                     // the sheave
      member([sk, Rg.d, Rg.head], [sk, plan.stageHouse.wall + 0.02, Rg.head + 0.22], 0.035, IRON);                                // its bracket, into the wall
      member([sk, Rg.d + 0.01, Rg.top + 0.74], [sk, Rg.d + 0.01, Rg.head - 0.15], 0.014, ROPE, { ma: [9 + k, 1] });               // down to the weight's eye (which comes down)
      for (const e of [-0.27, 0.27]) member([sk + e, Rg.d, plan.stageHouse.gallery.y + 0.2], [sk + e, Rg.d, Rg.head + 0.25], 0.007, WIRE);      // the two wires it slides on
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aMove', new THREE.Float32BufferAttribute(mov, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const rig = new THREE.Mesh(g, H.paint('rope', { color: '#ffffff', vertexColors: true, wake: false, brush: 0.2, crisp: true, extend: { uniforms: rigU, vertexPars: RIG_VERT_PARS, vertexLocal: RIG_VERT_LOCAL } }));
    rig.name = "the house curtain's rigging"; rig.frustumCulled = false;
    ctx.only(rig, 'direct'); ctx.add(rig);
    curtain.rig = rig;
  }
  // ---- the three counterweights: each comes down as far as its three lines go up (the family's counterweight on the group's line)
  try {
    const weights = await ctx.kit.models('models/theatre/counterweight.glb', Rg.s.map((sk, k) => ({ at: [sk, Rg.d, Rg.top], face: 'channel', tint: ['#ffffff', '#ece8e0', '#f4efe6'][k] })), H.dress('iron', { brush: 0.3 }));
    ctx.only(weights.group, 'direct');
    for (const m of weights.meshes) m.frustumCulled = false;
    curtain.weights = weights;
    curtain.weightAt = Rg.s.map(() => Rg.top);
    Rg.groups.forEach((g, k) => {
      // (an instanced model has no object to move: the family's counterweight is given a stand-in whose height it sets)
      const slide = { position: { get y() { return curtain.weightAt[k]; }, set y(v) { if (Math.abs(v - curtain.weightAt[k]) > 1e-4 || !slide.placed) { slide.placed = true; curtain.weightAt[k] = v; weights.place(k, { at: [Rg.s[k], Rg.d, v], face: 'channel' }); } } } };
      counterweight(ctx, { travel: () => lines[g[1]], weight: slide, top: Rg.top });
    });
  } catch (err) { console.warn(`theatre/cast_cloth: the curtain's counterweights are not in (${(err && err.message) || err})`); }

  // ============================================================================================ the cloth other modules hang
  // Box curtains (kit_floor.js), the twelve great swags and the pelmet's tassels (heroes_house.js), the tassels on the hem
  // (kit_tiers.js), borders, backcloth and fly cloths (heroes_stage.js) hang and stir in their own modules; here they are given
  // one air. gust(k): everything of cloth stirs up to four times as wide (the page: 3 cm at rest, 12 cm in a gust).
  // stream(k): the fall's draught (what kit_floor's box curtains do by the show clock, the curtain's scallops and the swags do
  // with this). Both are eased here; the staging only says how much and how fast.
  const KF = shared.kitFloor, hang = shared.houseHang, SR = shared.stageRig || {}, sway0 = {};
  for (const name of ['borders', 'backcloth', 'fly']) { const q = SR.cloths && SR.cloths[name]; if (q && q.U && q.U.uScSway) sway0[name] = q.U.uScSway.value.x; }
  const hang0 = hang ? hang.value : 1;
  const air = { gust: hold('ccgust') ?? 0, gustTo: hold('ccgust') ?? 0, gustRate: 1, stream: 0, streamTo: hold('ccstream'), streamRate: 0.5, wroteGust: false, breathe: null };
  /** Everything of cloth stirs wider: k 0 (rest) .. 1 (the page's gust: four times), reached in `seconds`. */
  cloth.gust = (k = 1, seconds = 1.5) => { air.gustTo = clamp01(k); air.gustRate = 1 / Math.max(0.05, seconds); return cloth; };
  /** The fall's draught on cloth: k 0..1, reached in `seconds`; stream(null) hands it back to the show clock (c 29 to 40). */
  cloth.stream = (k = 1, seconds = 2) => { air.streamTo = k == null ? null : clamp01(k); air.streamRate = 1 / Math.max(0.05, seconds); return cloth; };
  Object.defineProperties(cloth, { gustNow: { get: () => air.gust }, streamNow: { get: () => air.stream } });
  /** The draught lifts the backcloth's hem `metres` and lets it fall, over `seconds` (the page's moment at s 112). */
  cloth.backcloth = { breathe(metres = 0.3, seconds = 4.5) { air.breathe = { t0: ctx.time, metres, seconds }; fire('rustle', V(plan.backcloth.s, 0, 2), { what: 'backcloth', pitch: 0.7 }); return cloth; } };

  // ---- the two travelling cloths of the fly tower (heroes_stage.js hangs them; shared.stageRig.fly[i].want takes one over).
  // The page: they travel 3 m in 10 s. Left to themselves they take turns, so that in the fly tower a cloth is nearly always
  // on its way with its counterweight going the other way: the first up, the second down, the first down, the second up, 48 s round.
  const ease = (t) => { t = clamp01(t); return t * t * t * (t * (6 * t - 15) + 10); };
  const flyCycle = (i, time) => {
    const q = time % 48;
    if (i === 0) return q < 10 ? ease(q / 10) : q < 24 ? 1 : q < 34 ? 1 - ease((q - 24) / 10) : 0;
    return q < 12 ? 1 : q < 22 ? 1 - ease((q - 12) / 10) : q < 36 ? 0 : q < 46 ? ease((q - 36) / 10) : 1;
  };
  const fly = cloth.fly = {
    /** true: cloth i takes its turns by itself. to() sets it false for that cloth. */
    auto: [true, true],
    /** 0 down (its hem 3.4 m above the water) .. 1 up (6.4 m). */
    at: [flyCycle(0, 0), flyCycle(1, 0)],
    moves: [null, null],
    /** Send cloth i (0 the moon over waves, 1 the tree in snow) to `up` (0 down .. 1 up) over `seconds` (default: 10 s for the whole 3 m). */
    to(i, up, seconds) { up = clamp01(up); fly.auto[i] = false; fly.moves[i] = { from: fly.at[i], to: up, t0: ctx.time, seconds: seconds ?? Math.max(0.5, 10 * Math.abs(up - fly.at[i])) }; return fly; },
    moving: (i) => Math.abs(fly.speed[i]) > 1e-4,
    speed: [0, 0],
  };
  // ---- the third fly cloth hangs by one corner: its low end trails in the water and draws a ring there at each swing
  const F3 = (() => {
    const R = plan.stageRig && plan.stageRig.fly, F = plan.fly;
    if (!R || !F) return null;
    const tan = Math.tan(R.thirdTilt), hemAt0 = R.thirdTop - F.cloth[1];            // the hem's height at the cloth's middle
    const x1 = Math.max(-F.cloth[0] / 2, -hemAt0 / tan);                             // where its hem meets the water (metres right of the centre line)
    return { s: F.cloths[2].s, x0: -F.cloth[0] / 2, x1, n: -1, k: 0 };
  })();

  // ============================================================================================ the pages
  // Fourteen open parts on the music stands (heroes_stage.js: shared.stageRig.stands, standsAt) and one page of the score on
  // the rostrum (its model's point `score`). A page lifts and turns every 20 to 50 s; when the boat's wake reaches a stand it
  // is knocked (the hook `knock`), shivers, and its page falls back; the stands the hull can touch lean away from it and come
  // home; when the wake reaches the harp each of its fourteen strings draws a pin ring, one after another.
  const Pg = { ...P.pages, ...(hold('ccturn') ? { every: [hold('ccturn'), hold('ccturn') + 1] } : {}) }, pages = cloth.pages = { list: [], mesh: null };
  const m4 = new THREE.Matrix4(), mA = new THREE.Matrix4(), mB = new THREE.Matrix4(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), q1 = new THREE.Quaternion(), ax = new THREE.Vector3();
  let standMeshes = null, harpStrings = null, harpAt = null;
  try {
    const stands = SR.stands, where = SR.standsAt;
    if (stands && stands.meshes && stands.meshes.length && where) {
      standMeshes = stands.meshes;
      // ---- the desk of a stand, from the model itself (it names no points): its plane holds the model's own x axis, so a line is
      // fitted to its lyre and bars in (y, z); the ledge sticks out of that plane on the side the part stands on
      const posA = standMeshes[0].geometry.attributes.position; let n = 0, sy = 0, sz = 0, syy = 0, syz = 0;
      for (let i = 0; i < posA.count; i++) { const x = posA.getX(i), y = posA.getY(i), z = posA.getZ(i); if (y > -0.17 && Math.abs(x) < 0.235) { n++; sy += y; sz += z; syy += y * y; syz += y * z; } }
      if (n < 10) throw new Error('the music stand has no desk where one was expected');
      const y0 = sy / n, z0 = sz / n, slope = (syz - n * y0 * z0) / Math.max(1e-9, syy - n * y0 * y0), inv = 1 / Math.hypot(1, slope);
      let side = 0, ledgeTop = -1e9;
      for (let i = 0; i < posA.count; i++) { const x = posA.getX(i), y = posA.getY(i), z = posA.getZ(i); if (y > -0.27 && y <= -0.17 && Math.abs(x) < 0.235) { const dist = (z - (z0 + slope * (y - y0))) * inv; if (Math.abs(dist) > 0.02) { side += dist; ledgeTop = Math.max(ledgeTop, y); } } }
      const sg = side >= 0 ? 1 : -1, yO = (ledgeTop > -1e8 ? ledgeTop : -0.2) + 0.002;
      const Zd = new THREE.Vector3(0, -slope * inv * sg, inv * sg), Yd = new THREE.Vector3(0, inv, slope * inv), Xd = new THREE.Vector3().crossVectors(Yd, Zd);
      const O = new THREE.Vector3(0, yO, z0 + slope * (yO - y0)).addScaledVector(Zd, 0.009);
      const desk = new THREE.Matrix4().makeBasis(Xd, Yd, Zd).setPosition(O);
      where.forEach((w, i) => {
        const M0 = new THREE.Matrix4(); standMeshes[0].getMatrixAt(i, M0);
        pages.list.push({ i, stand: true, M0, desk, foot: new THREE.Vector3(0, -1.2, 0).applyMatrix4(M0), top: new THREE.Vector3(0, 0.1, 0).applyMatrix4(M0),
          lean: new THREE.Vector2(), leanV: new THREE.Vector2(), leanWas: new THREE.Vector2(1e9, 0), live: 0, armed: true, size: Pg.part, rest: 1 });
      });
    }
    // ---- the score: one page that turns on the leaves the rostrum's model has, at its point `score`; the board's slope is fitted from the model
    const ro = SR.rostrum;
    if (ro && ro.points && ro.points.score && ro.group) {
      ro.group.updateMatrixWorld(true);
      const local = ro.points.score.position.clone(); let o = ro.points.score.parent; while (o && o !== ro.group) { local.applyMatrix4(o.matrix); o = o.parent; }      // the point in the model's own space
      let n = 0, sy = 0, sz = 0, szz = 0, syz = 0; const inv4 = new THREE.Matrix4().copy(ro.group.matrixWorld).invert();
      ro.group.traverse((mesh) => { if (!mesh.isMesh) return; const pa = mesh.geometry.attributes.position; mB.multiplyMatrices(inv4, mesh.matrixWorld);
        for (let i = 0; i < pa.count; i++) { v1.fromBufferAttribute(pa, i).applyMatrix4(mB); if (Math.abs(v1.x) < 0.3 && Math.hypot(v1.y - local.y, v1.z - local.z) < 0.24) { n++; sy += v1.y; sz += v1.z; szz += v1.z * v1.z; syz += v1.y * v1.z; } } });
      if (n >= 8) {
        // (the board slopes down the model's z: the line is fitted as height over z)
        const zM = sz / n, yM = sy / n, rise = (syz - n * yM * zM) / Math.max(1e-9, szz - n * zM * zM), inv = 1 / Math.hypot(1, rise), up = rise < 0 ? -1 : 1;
        const Yd = new THREE.Vector3(0, rise * inv * up, inv * up), Zd = new THREE.Vector3(0, inv, -rise * inv), Xd = new THREE.Vector3().crossVectors(Yd, Zd);      // up the board toward its high end; out of it
        const mid = new THREE.Vector3(0, yM + rise * (local.z - zM), local.z);      // the board under the point
        const O = mid.clone().addScaledVector(Yd, -Pg.score[1] / 2).addScaledVector(Zd, 0.03);
        const desk = new THREE.Matrix4().makeBasis(Xd, Yd, Zd).setPosition(O);
        pages.list.push({ i: pages.list.length, stand: false, M0: ro.group.matrixWorld.clone(), desk, top: mid.clone().applyMatrix4(ro.group.matrixWorld), live: 0, armed: true, size: Pg.score, rest: 0 });
      }
    }
    // ---- the harp's fourteen strings, where they pass through the water
    const hp = SR.harp;
    if (hp && hp.points) { const pts = []; for (let k = 0; k < 14; k++) if (hp.points['string_' + k]) pts.push(hp.point('string_' + k)); if (pts.length) { harpStrings = pts; harpAt = pts[Math.floor(pts.length / 2)].clone(); } }
  } catch (err) { console.warn(`theatre/cast_cloth: the pages are not in (${(err && err.message) || err})`); pages.list.length = 0; }
  const NP = pages.list.length, harp = { live: 0, armed: true, run: -1, t0: 0 };
  const pageRnd = ctx.rng(1416);
  let pageAttr = null;
  if (NP) {
    const rnd = ctx.rng(1415), g = new THREE.InstancedBufferGeometry(), pos = [], uv = [], sheet = [], idx = [];
    for (let sh = 0; sh < 2; sh++) { const base = pos.length / 3; for (let j = 0; j < 2; j++) for (let i = 0; i <= 4; i++) { pos.push(0, 0, 0); uv.push(i / 4, j); sheet.push(sh); }
      for (let i = 0; i < 4; i++) { const a = base + i, b = base + i + 1, c = base + 5 + i, d = base + 5 + i + 1; idx.push(a, b, c, b, d, c); } }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aSheet', new THREE.Float32BufferAttribute(sheet, 1));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).fill(0), 3)); g.setIndex(idx);
    const aPage = new Float32Array(NP * 4), aPageB = new Float32Array(NP * 2);
    pages.list.forEach((pg, k) => {
      pg.side = rnd() < 0.5 ? 0 : 1; pg.rest0 = 0.1 + 0.08 * rnd(); pg.angle = pg.side ? Math.PI - pg.rest0 : pg.rest0; pg.bend = (pg.side ? -1 : 1) * 0.3; pg.anim = null;
      pg.next = (hold('ccturn') ? 1 : 4) + rnd() * Pg.every[1]; pg.seed = rnd() * 6.28; pg.stirNext = 2 + rnd() * Pg.stir[1];
      pg.sAt = -pg.top.z; pg.dAt = pg.top.x; pg.sideWas = null; pg.knockAt = Infinity; pg.knockedAt = -1e9; pg.knockK = 0;      // (the route is one straight line: x is d, -z is s)
      pg.jit = Pg.wake.late[0] + (Pg.wake.late[1] - Pg.wake.late[0]) * rnd();
      aPage.set([pg.angle, pg.bend, pg.size[0], pg.size[1]], k * 4); aPageB.set([pg.seed, pg.rest], k * 2);
    });
    pageAttr = new THREE.InstancedBufferAttribute(aPage, 4); pageAttr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aPage', pageAttr); g.setAttribute('aPageB', new THREE.InstancedBufferAttribute(aPageB, 2));
    g.instanceCount = NP;
    // (the pit's own candlelight: heroes_stage.js drives these two; without that module the card has the house's light alone)
    const pit = SR.pitLight || { uPit: { value: new THREE.Vector4(0, 0, 0, 0) }, uPitCol: { value: new THREE.Color(0, 0, 0) } };
    const mesh = new THREE.InstancedMesh(g, H.paint('card', { color: Pg.color, side: THREE.DoubleSide, wake: false, brush: 0.15, keep: Pg.keep,
      extend: { uniforms: { uPit: pit.uPit, uPitCol: pit.uPitCol }, vertexPars: PAGE_VERT_PARS, vertexLocal: PAGE_VERT_LOCAL, fragmentPars: PAGE_FRAG_PARS, albedo: PAGE_ALBEDO,
        light: PAGE_PIT + (dev.second ? PAGE_LIGHT : '') } }), NP);
    pages.list.forEach((pg, k) => mesh.setMatrixAt(k, m4.multiplyMatrices(pg.M0, pg.desk)));
    mesh.name = 'pages x ' + NP; mesh.frustumCulled = false; ctx.only(mesh, 'direct'); ctx.add(mesh);
    pages.mesh = mesh;
  }
  /** Turn page k now (the staging may; by itself each turns every 20 to 50 s). */
  pages.turn = (k) => { const pg = pages.list[k]; if (pg && !pg.anim) pg.anim = { kind: 'turn', t0: ctx.time, from: pg.angle, to: pg.side ? pg.rest0 : Math.PI - pg.rest0 }; return pages; };
  /** How lively the water at each stand is taken to be now (0..1), and at the harp: what the wake has brought. */
  pages.live = (k) => (pages.list[k] ? pages.list[k].live : 0);

  // (&cclog=<seconds>: after so many seconds the page logs every hook this module has fired, what and when, as console errors, which the picture tool prints)
  const logAt = hold('cclog'), logged = [];
  if (logAt != null) for (const name of Object.keys(cloth.on)) cloth.on[name] = (e) => logged.push(`${name}:${(e.what || '').replace(/ /g, '-')}${e.i != null ? e.i : ''}@${ctx.time.toFixed(1)}`);
  let first = true, ccWas = -1, heard = 1e9;
  const applyCurtain = (cc) => {
    for (let i = 0; i < N; i++) lines[i] = lineAt(i, cc);
    FU.uFestC.value.z = -swingAt(cc) * calm();                          // (the family's swing is toward the house, where this cloth is pressed against the pelmet's back: its first swing goes toward the stage)
    CU.uCcD.value.z = swingAt(cc) * calm();
    CU.uCcE.value.x = bobAt(cc) * calm();
    const R = rigU.uCcRig.value;
    for (let i = 0; i < N; i++) R[i] = lines[i];
    Rg.groups.forEach((g, k) => { R[9 + k] = -lines[g[1]]; });
  };
  applyCurtain(curtain.clock);

  // ============================================================================================ for the staging
  // shared.cast.cloth (nothing here plays a sound or places a cue):
  //   .curtain    { auto, clock, set(c), rise(seconds), line(i), lines, hemAt(d), up, moving, weightAt[3], object, festoon, rig, weights }
  //               auto true: it follows the show clock (13 to 27, never under 6 s). By hand: curtain.rise(14), or curtain.set(13 | 40)
  //   .gust(k, seconds), .gustNow          one gust for all cloth (curtain, tassels, box curtains, swags, borders, backcloth, fly cloths)
  //   .stream(k | null, seconds), .streamNow   the fall's draught on the scallops, swags, borders, tassels (null: by the show clock, c 29 to 40)
  //   .backcloth.breathe(metres, seconds)  the draught lifts the backcloth's hem and lets it fall
  //   .fly        { auto[2], at[2], to(i, up, seconds), moving(i) }      the two travelling cloths (0 down .. 1 up; 3 m in 10 s)
  //   .pages      { list, mesh, turn(k), live(k) }                       the fourteen parts and the score's page
  //   .on         { rustle, creak, knock, drop }: each null until the staging attaches fn({ x, y, z, what, pitch?, i? }):
  //               rustle   the curtain on its way (four in its travel, pitch 0.6); the backcloth's breath (pitch 0.7)
  //               creak    the curtain's lines (three in its travel); a fly cloth setting off
  //               knock    the curtain's weights reaching their stop; a fly cloth reaching its stop; a music stand met by the wake
  //               drop     the third fly cloth's trailing corner (every fourth swing)
  return {
    update(dt) {
      const c = show.c;
      if (logAt != null && ctx.time >= logAt && logged.length >= 0 && !logged.done) { logged.done = true; const all = logged.join(' ') || 'nothing'; for (let i = 0; i < 6; i++) if (all.length > i * 360) console.error(`NOT AN ERROR (&cclog): cast_cloth hooks ${i + 1}: ` + all.slice(i * 360, (i + 1) * 360)); }
      // ---- the curtain's clock
      if (curtain.auto) {
        if (first || c <= Cu.from || curtain.clock >= HOME + 9) curtain.clock = c;
        else if (c > curtain.clock) curtain.clock = Math.min(c, Math.max(curtain.clock, Cu.from) + dt * RATE);
      } else if (curtain.running > 0) curtain.clock = Math.min(HOME + 10, curtain.clock + dt * curtain.running);
      first = false;
      const cc = curtain.clock;
      if (cc !== ccWas) applyCurtain(cc);
      ccWas = cc;
      CU.uCcLit.value.set(Cu.lit).multiplyScalar(Cu.litGain * (shared.show ? shared.show.k : 0));
      // ---- what the staging hears of it (the hooks in shared.cast.cloth.on; nothing is played here)
      if (cc > heard && cc - heard < 3) {
        const pass = (t) => heard < t && cc >= t, mid = V(Cu.s, 0, 8), wall = V(Rg.s[1], Rg.d, 12);
        if (pass(Cu.from + 0.05) || pass(Cu.from + 4.2) || pass(Cu.from + 12.5)) fire('creak', wall, { what: 'curtain lines' });
        if (pass(Cu.from + 0.3) || pass(Cu.from + 3.9) || pass(Cu.from + 7.5) || pass(Cu.from + 11)) fire('rustle', mid, { what: 'curtain', pitch: 0.6 });
        if (pass(HOME)) fire('knock', wall, { what: 'curtain stop' });
      }
      heard = cc;

      // ---- one air for all the cloth
      const time = ctx.time, k = calm();
      air.gust += Math.max(-dt * air.gustRate, Math.min(dt * air.gustRate, air.gustTo - air.gust));
      const streamWant = air.streamTo != null ? air.streamTo : curtain.stream != null ? clamp01(curtain.stream) : smooth(29, 31, c) * (1 - smooth(36, 40, c));
      air.stream += Math.max(-dt * air.streamRate, Math.min(dt * air.streamRate, streamWant - air.stream));
      const g = air.gust * k, st = air.stream * k;
      CU.uCcB.value.z = CU.uCcD.value.w = 0.55 * st;                    // the curtain's scallops stream toward the stage
      CU.uCcB.value.w = CU.uCcD.value.y = Cu.stir * (1 + 3 * air.gust) * k;      // its stir: 3 cm at the hem, 12 in a gust (the family's own, which is square to the eye, is left at rest)
      if (KF && KF.gust && (air.gust > 1e-3 || air.wroteGust)) { KF.gust.value = air.gust; air.wroteGust = air.gust > 1e-3; }      // box curtains (kit_floor applies its own calm)
      if (hang) hang.value = hang0 * (1 + 2.4 * g + 2.0 * st);            // swags and the pelmet's tassels
      if (tassels) {
        tassels.swing = 0.07 * g + 0.09 * st;
        if (tassels.mesh) tassels.mesh.position.z = tasselZ - 0.3 * st - 0.5 * CU.uCcD.value.z;   // the hem streams, and swings as the lines stop: they go with it (z is toward the house: the stage is the other way)
      }
      if (hold('ccbreathe') && !air.breathe && time - (air.breathedAt ?? -1e9) > hold('ccbreathe')) { air.breathedAt = time; cloth.backcloth.breathe(); }      // (&ccbreathe=6: the backcloth's breath every six seconds, to look at it)
      for (const name in sway0) {
        const U = SR.cloths[name].U.uScSway.value; let m = 1 + 3 * g + (name === 'borders' ? 1.5 * st : 0);
        if (name === 'backcloth' && air.breathe) {                        // the draught lifts its hem and lets it fall
          const b = air.breathe, u = (time - b.t0) / b.seconds;
          if (u >= 1) air.breathe = null; else m += (b.metres / 0.22) / sway0[name] * Math.pow(Math.sin(Math.PI * u), 2);
        }
        U.x = sway0[name] * m;
      }
      // ---- the fly cloths take their turns (or go where the staging sent them)
      if (SR.fly && SR.fly.length >= 2) for (let i = 0; i < 2; i++) {
        const was = fly.at[i], mv = fly.moves[i];
        if (fly.auto[i]) fly.at[i] = flyCycle(i, time);
        else if (mv) { const u = (time - mv.t0) / mv.seconds; fly.at[i] = mv.from + (mv.to - mv.from) * ease(u); if (u >= 1) fly.moves[i] = null; }
        const sp = (fly.at[i] - was) / Math.max(dt, 1e-3);
        // (second look: heard only from the stage on: as first built these two spoke every ten seconds of the whole ride, sixty metres from the boat)
        if (ctx.s > P.fly.heardFrom && Math.abs(sp) > 1e-4 && Math.abs(fly.speed[i]) <= 1e-4) fire('creak', V(SR.fly[i].s, 0, 9), { what: 'fly cloth', i });
        if (ctx.s > P.fly.heardFrom && Math.abs(sp) <= 1e-4 && Math.abs(fly.speed[i]) > 1e-4) fire('knock', V(SR.fly[i].s, i ? -12.5 : 12.5, 3), { what: 'fly cloth stop', i });
        fly.speed[i] = sp;
        SR.fly[i].want = fly.at[i];
      }
      // ---- the third cloth's trailing corner: a ring where it lies in the water, at each swing (heroes_stage.js sways it: the same clock and pace)
      if (F3 && sway0.fly != null) {
        const W = SR.cloths.fly.U.uScSway.value.y * 6.3, n = Math.floor((ctx.engine.shared.uTime.value * W + 47.9 - Math.PI / 2) / Math.PI);
        if (F3.n < 0) F3.n = n;
        else if (n !== F3.n) {
          F3.n = n; F3.k++;
          const u = (F3.k * 0.618) % 1, w = V(F3.s + (n % 2 ? 0.06 : -0.06), F3.x0 + (F3.x1 - F3.x0) * (0.15 + 0.8 * u), 0);
          if (ctx.s > P.fly.cornerFrom) {                             // (second look: only when the boat is in the fly tower)
            ctx.water.ripple(w.x, w.z, hold('ccring') ?? 1.0, 0.6);    // (the page: 0.3; on this dark water nothing of that shows by lantern light)
            if (F3.k % 4 === 0) fire('drop', w, { what: 'fly cloth corner' });
          }
        }
      }

      // ---- the pages
      if (NP && hold('ccpage') != null) { for (let kk = 0; kk < NP; kk++) { pageAttr.array[kk * 4] = hold('ccpage'); pageAttr.array[kk * 4 + 1] = hold('ccbend') ?? 0.3; } pageAttr.needsUpdate = true; }      // (&ccpage=1.57&ccbend=-0.5: every page held at an angle)
      else if (NP) {
        const b = ctx.boat, near = Math.abs(ctx.s - 84) < 14, rm = ctx.reducedMotion;
        const head = ctx.engine.boat.heading, fx = -Math.sin(head), fz = -Math.cos(head);
        let moved = false;
        for (let kk = 0; kk < NP; kk++) {
          const pg = pages.list[kk];
          // THE WAKE ARRIVING: a knock, a shiver, and the page falls back. (second look) A wake trails: it reaches a stand after the
          // boat has passed abeam of it, sooner if the boat passes close, and never at the same moment as it reaches the stand's
          // twin across the pit. (As first built it took the walls' record of the wake, which is felt 16 m ahead of the boat and
          // alike on both sides: the two arcs were knocked in mirrored pairs, a pair every second and a half, before the boat came.)
          if (near) {
            const side = ctx.s >= pg.sAt ? 1 : -1;
            if (pg.sideWas == null) pg.sideWas = side;
            else if (side !== pg.sideWas) {                                // the boat has just passed abeam, either way
              pg.sideWas = side;
              const across = Math.abs(b.x - pg.dAt), k = 1 - smooth(Pg.wake.reach[0], Pg.wake.reach[1], across);
              if (Math.abs(b.speed || 0) > Pg.wake.least && k > Pg.wake.knock && time - pg.knockedAt > 3) { pg.knockAt = time + across / Pg.wake.speed + pg.jit; pg.knockK = k; }
            }
            if (time >= pg.knockAt) {
              pg.knockAt = Infinity; pg.knockedAt = time; pg.live = pg.knockK;
              if (pg.stand) { fire('knock', pg.top, { what: 'music stand', i: pg.i, gain: pg.knockK }); const dx = pg.top.x - b.x, dz = pg.top.z - b.z, l = Math.hypot(dx, dz) || 1; pg.leanV.x += 0.07 * pg.knockK * dx / l; pg.leanV.y += 0.07 * pg.knockK * dz / l; }
              const rest = pg.side ? Math.PI - pg.rest0 : pg.rest0;
              if (pg.anim && pg.anim.kind === 'turn') pg.anim = { kind: 'back', t0: time, from: pg.angle, to: rest, bend0: pg.bend };      // caught on its way over: it falls back
              else if (!pg.anim) pg.anim = { kind: 'flutter', t0: time, from: rest, to: rest + (pg.side ? -1 : 1) * 0.75 * (0.5 + 0.5 * pg.knockK) };      // lifted by the water, and falls back
              pg.next = Math.max(pg.next, time + 6); pg.stirNext = Math.max(pg.stirNext, time + 5);
            }
          } else pg.sideWas = null;
          if (pg.live > 0) pg.live = Math.max(0, pg.live - dt / 4);
          // by itself: it lifts and turns; and between two turns the water lifts its fore edge now and then and lets it fall back
          if (!pg.anim && time >= pg.next) { pg.anim = { kind: 'turn', t0: time, from: pg.angle, to: pg.side ? pg.rest0 : Math.PI - pg.rest0 }; }
          else if (!pg.anim && time >= pg.stirNext) {
            pg.stirNext = time + Pg.stir[0] + (Pg.stir[1] - Pg.stir[0]) * pageRnd();
            if (pg.next - time > 4) { const rest = pg.side ? Math.PI - pg.rest0 : pg.rest0; pg.anim = { kind: 'flutter', t0: time, from: rest, to: rest + (pg.side ? -1 : 1) * (Pg.stir[2] + (Pg.stir[3] - Pg.stir[2]) * pageRnd()) }; }
          }
          // the score lies under the keel: with the hull over it its page stays down
          if (!pg.stand && pg.anim && pg.anim.kind === 'turn' && Math.hypot(pg.top.x - b.x, pg.top.z - b.z) < 2.6) pg.anim = { kind: 'back', t0: time, from: pg.angle, to: pg.side ? Math.PI - pg.rest0 : pg.rest0, bend0: pg.bend };
          const A = pg.anim;
          if (A) {
            // A card half in the water moves slowly, and its fore edge is left behind by the way it is going: `lag` bends it back.
            // At rest it lies a little off its stack with its fore edge curled up (restBend).
            const tau = time - A.t0, dir = Math.sign(A.to - A.from) || 1, restBend = (pg.side ? -1 : 1) * 0.3;
            let ang, bend, done = false;
            if (A.kind === 'turn') {
              // it lifts a hand's breadth, hangs there, and goes over
              const T1 = Pg.lift, T2 = T1 + 0.35, T3 = T2 + Pg.turn, liftTo = A.from + dir * 0.55;
              if (tau < T1) { const e = ease(tau / T1); ang = A.from + (liftTo - A.from) * e; bend = -dir * (-0.3 + 0.5 * e); }
              else if (tau < T2) { ang = liftTo + dir * 0.025 * Math.sin((tau - T1) * 9); bend = -dir * 0.2; }
              else if (tau < T3) { const u = (tau - T2) / Pg.turn; ang = liftTo + (A.to - liftTo) * ease(u); bend = -dir * (0.2 + 0.7 * Math.sin(Math.PI * u) + 0.1 * u); }
              else { ang = A.to; bend = -dir * 0.3; done = true; pg.side = 1 - pg.side; pg.next = time + Pg.every[0] + (Pg.every[1] - Pg.every[0]) * pageRnd(); }
            } else if (A.kind === 'flutter') {
              // the water lifts it and lets it fall back
              const u = tau / 2.1;
              if (u < 1) { const e = u < 0.3 ? ease(u / 0.3) : 1 - ease((u - 0.3) / 0.7); ang = A.from + (A.to - A.from) * e; bend = restBend * (1 - 1.7 * e); }
              else { ang = A.from; bend = restBend; done = true; }
            } else {
              // caught on its way over: it falls back to where it came from
              const u = tau / 1.3;
              if (u < 1) { ang = A.from + (A.to - A.from) * ease(u); bend = restBend + (A.bend0 - restBend) * (1 - ease(Math.min(1, u * 2))) - dir * 0.6 * Math.sin(Math.PI * u); }
              else { ang = A.to; bend = restBend; done = true; }
            }
            pg.angle = ang; pg.bend = bend; if (done) pg.anim = null;
            pageAttr.array[kk * 4] = ang; pageAttr.array[kk * 4 + 1] = bend; moved = true;
          }
          // the hull: a stand it would touch leans away from it, and comes home when it has passed
          if (pg.stand) {
            let wantX = 0, wantZ = 0;
            if (near) {
              const rx = pg.top.x - b.x, rz = pg.top.z - b.z, along = Math.max(-1.5, Math.min(2.4, rx * fx + rz * fz)), nx = rx - fx * along, nz = rz - fz * along, dist = Math.hypot(nx, nz) || 1e-3;
              const hull = along < 0.6 ? 0.85 : 0.85 - 0.55 * (along - 0.6) / 1.8, push = hull + Pg.lean.clear - dist;
              if (push > 0) { const ang = Math.min(Pg.lean.max, Math.asin(Math.min(0.95, push / 1.3))); wantX = ang * nx / dist; wantZ = ang * nz / dist; }
            }
            const L = pg.lean, Vv = pg.leanV, pushed = wantX * wantX + wantZ * wantZ > 1e-6;
            if (pushed && !pg.pushedWas && time - pg.knockedAt > 3) { pg.knockedAt = time; pg.knockAt = Infinity; pg.live = 1; fire('knock', pg.top, { what: 'music stand', i: pg.i, gain: 1, hull: true }); }      // the hull itself: it knocks as it is touched
            pg.pushedWas = pushed;
            if (pushed) { const kq = Math.min(1, dt * 10); Vv.set((wantX - L.x) * kq / Math.max(dt, 1e-3) * 0.5, (wantZ - L.y) * kq / Math.max(dt, 1e-3) * 0.5); L.x += (wantX - L.x) * kq; L.y += (wantZ - L.y) * kq; }
            else if (L.lengthSq() > 1e-9 || Vv.lengthSq() > 1e-9) {          // home again: a slow spring in water, one small swing past upright
              const w0 = 2.4, zeta = 0.5, steps = dt > 0.03 ? 2 : 1, h = dt / steps;
              for (let q = 0; q < steps; q++) { Vv.x += (-w0 * w0 * L.x - 2 * zeta * w0 * Vv.x) * h; Vv.y += (-w0 * w0 * L.y - 2 * zeta * w0 * Vv.y) * h; L.x += Vv.x * h; L.y += Vv.y * h; }
              if (L.lengthSq() < 1e-8 && Vv.lengthSq() < 1e-7) { L.set(0, 0); Vv.set(0, 0); }
            }
            if (Math.abs(L.x - pg.leanWas.x) + Math.abs(L.y - pg.leanWas.y) > 2e-5) {
              pg.leanWas.copy(L);
              const ang = L.length() * (rm ? 1 : 1);
              if (ang > 1e-6) { ax.set(L.y, 0, -L.x).normalize(); q1.setFromAxisAngle(ax, ang); mA.makeRotationFromQuaternion(q1); mB.makeTranslation(pg.foot.x, pg.foot.y, pg.foot.z); m4.multiplyMatrices(mB, mA); mB.makeTranslation(-pg.foot.x, -pg.foot.y, -pg.foot.z); m4.multiply(mB).multiply(pg.M0); }
              else m4.copy(pg.M0);
              for (const mesh of standMeshes) { mesh.setMatrixAt(pg.i, m4); mesh.instanceMatrix.needsUpdate = true; }
              pages.mesh.setMatrixAt(kk, mA.multiplyMatrices(m4, pg.desk)); pages.mesh.instanceMatrix.needsUpdate = true;
            }
          }
        }
        if (moved) pageAttr.needsUpdate = true;
      }
      // ---- the harp: when the wake reaches it each string draws a pin ring, one after another
      if (harpStrings) {
        if (Math.abs(ctx.s - 83) < 14) {                                  // (as the stands: after the boat has passed abeam, by how far across it passed)
          const side = ctx.s >= -harpAt.z ? 1 : -1;
          if (harp.sideWas == null) harp.sideWas = side;
          else if (side !== harp.sideWas) {
            harp.sideWas = side;
            const across = Math.abs(ctx.boat.x - harpAt.x), k = 1 - smooth(Pg.wake.reach[0], Pg.wake.reach[1], across);
            if (Math.abs(ctx.boat.speed || 0) > Pg.wake.least && k > Pg.wake.knock) { harp.due = time + across / Pg.wake.speed + 0.5; harp.live = k; }
          }
          if (harp.due != null && time >= harp.due && harp.run < 0) { harp.due = null; harp.run = 0; harp.t0 = time; }
        } else harp.sideWas = null;
        if (hold('ccharp') && harp.run < 0 && time - harp.t0 > hold('ccharp')) { harp.run = 0; harp.t0 = time; }      // (&ccharp=3: the strings' rings every three seconds, to look at them)
        while (harp.run >= 0 && time >= harp.t0 + harp.run * Pg.harp.gap) {
          const q = harpStrings[harp.run]; ctx.water.ripple(q.x, q.z, hold('ccharpk') ?? Pg.harp.ring[0], Pg.harp.ring[1]);
          if (++harp.run >= harpStrings.length) harp.run = -1;
        }
      }
    },
  };
}
