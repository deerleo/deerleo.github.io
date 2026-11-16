// The orchard in flood: everything people made and left in it (stage 2b, "the other hero pieces"). It is how the rider
// knows the place was worked and loved: the loft's great door the boat comes in by, the gap in the wall it leaves by,
// the handcart, the hives on their stand, ladders left in the trees, baskets, a crate afloat, the plank walk, the wall,
// a zinc label on every tree. docs/art/orchard.md sections 3 and 9; the log, with every piece's pictures, is
// docs/build/orchard/2-heroes.md.
//
// The models are made by the scripts in source-art/models/orchard/ (orch.py is what they share) and live in
// assets/models/orchard/. Each stands where the page puts it, in the page's frame (shared.frame.at, never kit.at), and
// wears the area's paint (PAINT below: the hour of the dusk on it, and pale paint holding the light as limewash does).
// This module builds AFTER `trees` (kit_trees.js): ladders, labels and the cart stand against the real wood (shared.wood).
// The stand-ins these replace are made in heroes.js and kit.js, which are other people's: they are taken out from
// here once every module has built (see `takeOut`), and their lines are deleted later.
//
// For those who bring the area to life (cast, staging): shared.made
//   .door, .gap, .cart, .hives   the hero models ({ group, parts, point(name) }): door.parts.bar, gap.parts.gate move
//   .loft                        the cloth loft the door stands in: THE DYERS' REACH'S MODEL, placed here (models/reach/
//                                cloth_loft_west.glb; null if it could not be loaded or another module placed it). Points:
//                                rail0_l .. rail4_r (the ends of the five cloth rails, 9 m up, at s 3.5 .. 23.5), peak,
//                                vent (the louvred opening under the gable's peak: a way out for the bats), sill_l, sill_r
//   .entrances, .boards          the six hives' entrance slots and landing boards (Vector3, for the bees)
//   .ladders   [{ model, foot, head, name }]   the two 4 m ladders in their trees, the pole ladder, the fallen ladder
//   .floats    [{ name, x, z, exc, ... }]      things afloat (crate, loose plank): they ride the water, lag a wake, can be nudged
//   .hangs     [{ name, at, phi, exc }]        baskets hanging by their hooks: they swing when a wake reaches their ladder
//   .walk      [{ s, at, planks }]             the plank walk's spans (an egret's station is a span that has its planks)
//   .wake(x, z, strength, reach)               rock everything within reach of a place (a carp's boil, the stag's bow wave)
//   .removed                                   which stand-ins were taken out, and how many objects each was
//   .wall, .labels, .labelAt, .basketsSet      the instanced kit (kit.models results); where each label hangs
//   .paint     { PAINT, THIN, timber, timberLamp, ironDull, STONE, workedStone, stoneLamp }   this module's paint, for anything
//              else of worked wood, iron or stone (workedStone(ashlar) and stoneLamp: see "STONE, WORKED" below)
//   .cartAt    { tree, bole, out, position }   where the handcart leans: its tree, the bole as boleAt found it, the way out from it
//   .knocks    true: this module plays the page's `knock` for everything it moves (baskets on their rungs, the crate, the loose
//              plank, the basket afloat, the fallen ladder on its bole, a hull's touch): do not play it again from a cue
//
// Developer switches: &hbcrisp=0 (thin things back in the painter's filter), &hbwork=0 (the hives' lime wash and the
// piers' lichen as plain vertex paint), &hbstone=0 | <metres> (the rubble without its painted stone, or at another
// size; &hbwork=0 also shows the stone as it was before it was worked), &keepstand (leave the stand-ins standing beside the models), &hbdebug=1 (where every piece ended up, in the
// page's (s, d, y), to .shots/orchard_hb_debug.json), &hbwalk=crisp (the plank walk out of the painter's filter too),
// &hbgrain=0 (timber and wicker as plain vertex paint), &hbwake=0.8 (everything that floats, hangs or turns moves as if
// a wake had just reached it, and goes on: for strips of the gate, the bar, the baskets from a boat that lies still),
// &hbstonemix=0.3 (how much of the painted stone picture stays under the drawn stones), &hblichen=1 (how much lichen).
// Fifth pass: &hbloft=0 (the layout's stand-in for the loft instead of the reach's model), &hbwash=0 (the hives' wash in
// lamplight as it was: pink), &hbladder=page (the second ladder's foot where the page puts it), &hbcrust=0 (the wall's
// lichen as discs), &hbquarry=0 (every stone of the wall its own hue).
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';

const DIR = 'models/orchard/';

// TIMBER AND WICKER, WORKED (third pass). Vertex paint cannot draw grain on a board, which has points only at its
// corners: every timber here was one flat colour from end to end, and beside the boat it read as cardboard. Each
// timber now carries in its UVs where a place lies along and across its own grain, in metres (orch.py, grain_uv:
// u > 0.5 means timber), and this draws on it what forty winters leave: the figure of the grain as long bands, the
// soft wood worn down and dark, the hard wood standing silver; checks; a knot now and then with the grain parting
// round it; and, on boards that lie edge to edge (a door's, a deck's), the dark of the joint. Wicker (u < -0.5:
// weave_uv) is drawn as stakes with weavers passing in front of and behind them by turns. It is all in the piece's
// own surface, so it stays put when a thing floats, swings or is instanced. (&hbgrain=0 shows the plain paint.)
// EXPORTED, because the orchard in snow shares these models bare: `import { WORKED_TIMBER } from './orchard/heroes_b.js'`
// and kit.model(url, { extend: [WORKED_TIMBER, <its own light>] }) gives its timber the same grain. (A model made
// without UVs is left exactly as it was: u is 0 there.)
const TIMBER_PARS = `float tbH(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    float tbN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(tbH(i), tbH(i + vec2(1.0, 0.0)), f.x), mix(tbH(i + vec2(0.0, 1.0)), tbH(i + vec2(1.0, 1.0)), f.x), f.y); }`;
export const WORKED_TIMBER = { fragmentPars: TIMBER_PARS, albedo: `{
      vec2 tg = vUv0;
      if (tg.x > 0.5) {
        float tbJoint = step(100.0, tg.x) * (1.0 - smoothstep(0.004, 0.013, fract(tg.y)));   // boards that lie edge to edge (orch.py: u > 100) show the joint along their edge
        vec2 tcell = vec2(0.9, 0.25), tci = floor(tg / tcell), tcf = tg / tcell - tci;
        float tHas = step(0.7, tbH(tci + 7.7));
        vec2 tkd = (tcf - vec2(0.3 + 0.4 * tbH(tci + 1.3), 0.36 + 0.28 * tbH(tci + 4.1))) * tcell;      // metres from this cell's knot
        float tkr = 0.011 + 0.014 * tbH(tci + 9.2), tke = length(vec2(tkd.x * 0.45, tkd.y)) / tkr;
        float tKnot = tHas * (1.0 - smoothstep(0.5, 1.0, tke));
        tg.y -= tkd.y * 0.72 * tHas * (1.0 - smoothstep(0.9, 2.2, tke));                    // the grain parts round it
        float ty = tg.y + (tbN(vec2(tg.x * 0.8, tg.y * 4.0)) - 0.5) * 0.03;                 // the bands wander a little
        float tFig = 0.5 * tbN(vec2(tg.x * 0.22, ty * 24.0)) + 0.32 * tbN(vec2(tg.x * 0.55 + 5.0, ty * 66.0)) + 0.18 * tbN(vec2(tg.x * 1.7 + 9.0, ty * 190.0));
        albedo *= mix(vec3(0.62, 0.60, 0.64), vec3(1.22, 1.21, 1.22), smoothstep(0.30, 0.70, tFig));
        float tCk = tbN(vec2(tg.x * 0.9 + 31.0, ty * 120.0)) * (0.5 + 0.5 * tbN(vec2(tg.x * 0.3 + 3.0, ty * 9.0)));
        albedo *= 1.0 - 0.6 * smoothstep(0.66, 0.76, tCk);                                  // checks down the grain
        albedo = mix(albedo, albedo * vec3(0.40, 0.36, 0.39), tKnot);
        albedo *= 1.0 - 0.62 * tbJoint;
      } else if (tg.x < -0.5) {
        vec2 wv = vec2(-tg.x - 2.0, tg.y) / vec2(0.0444, 0.022);                            // a stake every 44 mm, a weaver every 22 (orch.py: STAKE, WEAVER)
        float wi = floor(wv.x), wj = floor(wv.y), wOver = mod(wi + wj, 2.0);                // this weaver passes in front of this stake (1), or behind it (0)
        vec2 wf = fract(wv);
        float wz = (wOver * 2.0 - 1.0) * cos(3.14159 * (wf.x - 0.5));                       // how far forward the weaver is here: +1 in front of a stake, -1 behind one
        float wRod = sin(wf.y * 3.14159);                                                   // a weaver is round: dark where it meets the next
        float wShade = (0.36 + 0.64 * wRod) * (0.74 + 0.30 * wz);
        float wStake = (1.0 - wOver) * (1.0 - smoothstep(0.13, 0.22, abs(wf.x - 0.5)));     // the stake shows where the weaver goes behind it
        wShade = mix(wShade, 0.82 + 0.3 * (1.0 - abs(wf.x - 0.5) * 6.0), wStake);
        albedo *= wShade * (0.86 + 0.28 * tbH(vec2(wi * 0.37 + 3.0, wj * 1.7)));            // every rod its own willow
      } }` };
const Q = new URLSearchParams(location.search);

export async function build(ctx, plan, shared) {
  const { kit } = ctx, F = shared.frame, L = plan.left, wood = shared.wood || null;
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const rnd = ctx.rng(262);

  // ---- the area's paint on a model: every material takes the hour (shared.dusk); pale paint (whitewash, petals lodged
  // on wood) holds what light is left exactly as the limewashed trunks do (shared.mat.wood has the same line)
  const holds = { uniforms: { uSelf: shared.blossomSelf }, fragmentPars: 'uniform vec3 uSelf;', light: 'glow += uSelf * 0.9 * smoothstep(0.45, 0.8, min(ownColour.r, min(ownColour.g, ownColour.b)));' };
  const timber = Q.get('hbgrain') === '0' ? null : WORKED_TIMBER;
  // SILVERED WOOD IN LAMPLIGHT. The prow lantern (and the kept lamp) is a strong amber: grey timber within its reach
  // came out the orange-brown of new pine, the one thing the director asked this wood not to be; and wrought iron
  // (the page's dark plum silhouette) came out orange, which is the ride's reserved apricot. So timber keeps three
  // fifths of a lamp's hue and gives the rest back as plain light (old grey wood, warmed), and the big ironwork keeps
  // a third of it and three quarters of its strength. These go AFTER shared.dusk in a material's list: set.js puts
  // all of a lamp's light on the thing's own colour ('ownColour * lamps') and says that whoever takes some off again
  // must come after it.
  const lampCool = (keep, gain, only) => ({ light: `${only ? 'if (vUv0.x > 0.5) ' : ''}{ vec3 hbLamp = ownColour * lamps; c += mix(vec3(dot(hbLamp, vec3(0.3, 0.55, 0.15))), hbLamp, ${keep.toFixed(2)}) * ${gain.toFixed(2)} - hbLamp; }` });
  const timberLamp = timber ? lampCool(0.6, 1, true) : null, ironDull = lampCool(0.32, 0.75, false);
  const PAINT = { extend: [timber, shared.dusk, holds, timberLamp], brush: 0.85, shade: 1 };
  // THIN THINGS (ladders, the gate's iron, labels on their wires): the painter's filter wipes out anything thinner than
  // its brush, about five pixels: a ladder 18 m off was two smudges and its rungs were gone. `crisp` keeps them out of
  // the filter, so they are drawn at their true thickness at any distance. For thin things only: boards, stone and
  // wicker stay painted. (&hbcrisp=0 shows them as they were.)
  const THIN = Q.get('hbcrisp') === '0' ? PAINT : { ...PAINT, crisp: true };
  // ---- two surfaces that vertex paint cannot draw (a hive's wall is a board with points at its corners only, a pier's
  // course a block): they are painted in the material, by a noise laid on each face in its own plane. Both go BEFORE
  // shared.dusk in a list, so that the hour and the light fall on the worked paint. (&hbwork=0 shows the plain paint.)
  const NOISE = `float hbHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float hbNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hbHash(i), hbHash(i + vec2(1.0, 0.0)), f.x), mix(hbHash(i + vec2(0.0, 1.0)), hbHash(i + vec2(1.0, 1.0)), f.x), f.y); }
    float hbFbm(vec2 p) { return 0.5 * hbNoise(p) + 0.3 * hbNoise(p * 2.03 + 11.7) + 0.2 * hbNoise(p * 4.1 + 3.1); }
    vec2 hbFace(vec3 n, vec3 p) { return abs(n.y) > 0.6 ? p.xz : vec2(dot(p.xz, normalize(vec2(n.z, -n.x) + 1e-5)), p.y); }`;      // across a face and up it, whichever way it looks
  const work = Q.get('hbwork') !== '0';
  // LIME WASH (the hives): chalky, grey-white, brushed on thin: the brush's ridges run up and down, the wash has worn
  // through to the grey board in patches, damp has greened it in broad clouds, and rain has greyed it under each roof.
  // Only on what the model marks as whitewash (its vertex colour's alpha is 0.75: orch.py, `mark`); never on petals.
  const chalk = !work ? null : { fragmentPars: NOISE, albedo: `{
      float hbWash = 0.0;
      #ifdef USE_COLOR_ALPHA
        hbWash = step(0.5, vColor.a) * (1.0 - step(0.88, vColor.a));
      #endif
      vec2 hq = hbFace(N, vWPos);
      float hbBrush = hbFbm(vec2(hq.x * 46.0, hq.y * 2.6)), hbPatch = hbFbm(hq * 7.0 + 3.7);
      float hbThin = smoothstep(0.50, 0.63, hbPatch * 0.62 + hbBrush * 0.38);
      albedo = mix(albedo, albedo * vec3(0.52, 0.50, 0.52), hbWash * hbThin * 0.9);
      albedo *= 1.0 + hbWash * (hbBrush - 0.5) * 0.3;
      albedo = mix(albedo, albedo * vec3(0.76, 0.84, 0.78), hbWash * smoothstep(0.52, 0.72, hbFbm(hq * 2.3 + 9.1)) * 0.55); }` };
  // LIME WASH IN LAMPLIGHT (fifth pass). Beside the boat the hives were salmon pink: six plaster boxes, the warmest
  // pale thing in their picture, while the limewashed trunks behind them stood chalk white. The trunks' wash gives
  // back a third of a lamp's light, as chalk does, and is eased in under the bloom (kit_trees.js, `cap`); the hives'
  // took all of it. So what the model marks as whitewash does as the trunks do; and the rest of a hive that is not
  // grained timber (bricks, zinc, webbing, landing boards: boxes with no grain UVs) keeps three fifths of a lamp's hue,
  // as the timber does. It goes AFTER shared.dusk in a list, like every extension that takes lamp light off again.
  const washLamp = { light: `{
      float hbW = 0.0;
      #ifdef USE_COLOR_ALPHA
        hbW = step(0.5, vColor.a) * (1.0 - step(0.88, vColor.a));
      #endif
      vec3 hbL = ownColour * lamps;
      if (vUv0.x <= 0.5) c += mix(mix(vec3(dot(hbL, vec3(0.3, 0.55, 0.15))), hbL, 0.6), hbL * 0.36, hbW) - hbL;
      float hbM = max(c.r, max(c.g, c.b));
      if (hbM > 0.58) c *= mix(1.0, (0.58 + 0.2 * (1.0 - exp(-(hbM - 0.58) / 0.2))) / hbM, hbW); }` };
  // STONE, WORKED (fourth pass). The wall's stones are boxes with points at their corners only, and until this pass they
  // wore the painted stone picture laid on from three sides, 1.3 m to a repeat: three times a model stone's size, so its
  // painted joints cut across every block in soft focus, and inside the lantern's reach the wall was a patchwork of
  // pink, mauve and olive; the piers were cream sponge with camouflage for lichen. Now every stone is drawn as stone
  // from its own faces (orch.py, Blocks: each face carries its size and where a place lies across it in its UVs):
  //   - a block of the wall is laid as two or three flat-bedded stones (the page's limestone): beds and perpends drawn
  //     as tight dark joints, each drawn stone its own tone; a stone marked whole (a cope, a tread) is one stone;
  //   - every stone's face is flat, and falls away at its arrises into the dark of the joint: the NORMAL is bent
  //     there, so the sky lights the top edge of each stone and the water's dark its foot (relief without points);
  //   - strata and pits in the stone itself; pale crusts of lichen in colonies, more of it the higher and drier; moss
  //     on what looks up; green in the damp near the water; the dark wet foot with a wandering edge.
  // The painted picture stays under it as a faint ground (STONE_MIX of it). Dressed stone (the piers: `ashlar`) gets
  // the same growth and wet, the mason's tooling instead of beds, and the runs that rain draws down from the cap.
  // It must come BEFORE shared.dusk in a list. (&hbwork=0: the stone as it was.)
  const STONE_MIX = +(Q.get('hbstonemix') ?? 0.3), LICHEN = +(Q.get('hblichen') ?? 1);      // (developer) &hbstonemix=0.3: how much of the painted picture stays; &hblichen=1: how much lichen
  const CRUST = +(Q.get('hbcrust') ?? 1), QUARRY = +(Q.get('hbquarry') ?? 0.5);             // (developer) &hbcrust=0: the wall's lichen as the discs it was; &hbquarry=0: every stone of the wall its own hue, as it was
  const workedStone = (ashlar) => (!work ? null : { fragmentPars: NOISE, albedo: `{
      float wsStone = 1.0;
      #ifdef USE_COLOR_ALPHA
        wsStone = step(0.5, vColor.a);                                                    // (not a petal lying on it)
      #endif
      vec3 wsPx = dFdx(vWPos), wsPy = dFdy(vWPos); vec2 wsUx = dFdx(vUv0), wsUy = dFdy(vUv0);
      vec3 wsFN = normalize(cross(wsPx, wsPy)); if (dot(wsFN, N) < 0.0) wsFN = -wsFN;      // the face's own way of looking (the model's normals are rounded like a cushion)
      // across a face and up it, in the world, for what grows across stones. (NOT hbFace: that lays the world's x and z
      // along the face by its normal, and a face normal taken from the picture's own differences trembles by a third of
      // a degree, which two hundred metres from the area's origin is most of a metre: every lichen was a scatter of
      // single pixels. The face is laid on whichever of the world's two upright planes it lies nearer.)
      vec2 wsQ = abs(wsFN.y) > 0.6 ? vWPos.xz : (abs(wsFN.x) > abs(wsFN.z) ? vec2(vWPos.z, vWPos.y) : vec2(vWPos.x, vWPos.y));
      float wsFar = smoothstep(12.0, 38.0, length(vViewPos));                             // fine drawing fades into the distance
      vec2 wsSt = vUv0;
      if (wsStone > 0.5) {
        #ifdef USE_COLOR
          albedo = mix(vColor.rgb, albedo, ${ashlar ? '1.0' : STONE_MIX.toFixed(2)});                               // the painted picture: a faint ground under the drawing
        #endif${ashlar || QUARRY === 0 ? '' : `
        // FIFTH PASS: ONE QUARRY. With the bow against it the wall was a quilt: a green stone beside a lilac one beside a
        // blue one, each a flat tint (the model's paint picks every stone from six chips and greens one in seven; the
        // painted ground under it is pink and olive). Stones of one wall differ in tone far more than in hue: each is
        // drawn half way to the wall's own blue-grey, keeping its lightness. Moss, lichen and the damp come after, in green.
        albedo = mix(albedo, dot(albedo, vec3(0.3, 0.5, 0.2)) * vec3(0.94, 1.0, 1.12), ${QUARRY.toFixed(2)});`}
        if (wsSt.x > 0.5) {
          float wsWhole = step(1000.0, wsSt.x); wsSt.x -= 1000.0 * wsWhole;
          vec2 wsSz = floor(wsSt) * 0.01, wsM = clamp((fract(wsSt) - 0.01) / 0.98, 0.0, 1.0) * wsSz;      // the face's size, and metres from its corner
          float wsId = hbHash(floor(wsSt) * vec2(0.37, 0.71) + 3.3);
          // beds: how many flat stones this block is laid as, and which one this is (the beds wander: nothing is ruled)
          float wsDiv = (wsWhole > 0.5 || wsSz.x < 0.2) ? 0.0 : 1.0;
          float wsNb = wsDiv < 0.5 ? 1.0 : clamp(floor(wsSz.y / 0.085 + 0.2 + 0.6 * wsId), 1.0, 3.0);
          wsM.y += (hbNoise(vec2(wsM.x * 6.0 + wsId * 9.0, wsId * 3.0)) - 0.5) * 0.026 * wsDiv * smoothstep(0.0, 0.035, min(wsM.y, wsSz.y - wsM.y));
          float wsLay = 0.0, wsY0 = 0.0, wsY1 = wsSz.y;
          for (int k = 1; k < 3; k++) { float fk = float(k); if (fk < wsNb) {
            float yb = wsSz.y * (fk + (hbHash(vec2(wsId * 91.0, fk * 7.1)) - 0.5) * 0.56) / wsNb;
            if (wsM.y >= yb) { wsLay = fk; wsY0 = yb; } else wsY1 = min(wsY1, yb); } }
          // perpends: the stones of this bed, long and short, their ends never square
          float wsNs = wsDiv < 0.5 ? 1.0 : clamp(floor(wsSz.x / (0.15 + 0.3 * hbHash(vec2(wsId * 53.0 + wsLay * 3.7, 1.3))) + 0.5), 1.0, 4.0);
          float wsCol = 0.0, wsX0 = 0.0, wsX1 = wsSz.x, wsMid = wsM.y - 0.5 * (wsY0 + wsY1);
          for (int k = 1; k < 4; k++) { float fk = float(k); if (fk < wsNs) {
            float xb = wsSz.x * (fk + (hbHash(vec2(wsId * 17.0 + wsLay * 5.3, fk * 3.9)) - 0.5) * 0.6) / wsNs + wsMid * (hbHash(vec2(wsId * 7.0 + fk, wsLay * 2.3)) - 0.5) * 0.7;
            if (wsM.x >= xb) { wsCol = fk; wsX0 = xb; } else wsX1 = min(wsX1, xb); } }
          float wsC = hbHash(vec2(wsId * 29.0 + wsLay * 11.0, wsCol * 7.0 + 0.7));                          // this drawn stone's own number
          vec2 wsLo = wsM - vec2(wsX0, wsY0), wsHi = vec2(wsX1, wsY1) - wsM;
          // how far inside this stone's outline, its corners rounded off (where four stones meet there is a dark hole: the mark of a dry wall)
          vec2 wsHs = 0.5 * (wsLo + wsHi); float wsR = min(0.02, 0.32 * min(wsHs.x, wsHs.y));
          vec2 wsP = abs(0.5 * (wsLo - wsHi)) - (wsHs - wsR);
          float wsD = wsR - length(max(wsP, 0.0)) - min(max(wsP.x, wsP.y), 0.0);
          float wsJoint = 1.0 - smoothstep(0.0015, 0.0075, wsD + (hbNoise(wsM * 60.0 + wsId * 40.0) - 0.5) * 0.007);      // a joint: tight, dark, never ruled
          // the stone's own colour, strata and pits
          albedo *= (0.84 + 0.32 * wsC) * mix(vec3(1.05, 0.99, 0.94), vec3(0.94, 0.99, 1.07), hbHash(vec2(wsC * 13.0, wsId * 5.0)));
          albedo *= mix(0.86 + 0.28 * hbFbm(vec2(wsM.x * 7.0 + wsC * 31.0, wsM.y * 55.0 + wsC * 17.0)), 1.0, wsFar);
          albedo *= 1.0 - 0.18 * smoothstep(0.72, 0.84, hbNoise(wsM * 55.0 + wsC * 23.0)) * (1.0 - wsFar);
          // its face falls away at the arrises: the normal bent toward the nearest edges, the paint darkened into the joint
          vec2 wsOut = vec2(exp(-wsHi.x * 70.0) - exp(-wsLo.x * 70.0), exp(-wsHi.y * 70.0) - exp(-wsLo.y * 70.0));
          float wsDet = wsUx.x * wsUy.y - wsUy.x * wsUx.y, wsSg = wsDet < 0.0 ? -1.0 : 1.0;
          vec3 wsTu = (wsPx * wsUy.y - wsPy * wsUx.y) * wsSg, wsTv = (wsPy * wsUx.x - wsPx * wsUy.x) * wsSg;
          float wsLu = length(wsTu), wsLv = length(wsTv);
          N = wsFN;
          if (wsLu > 1e-9 && wsLv > 1e-9) N = normalize(wsFN + (wsTu / wsLu * wsOut.x + wsTv / wsLv * wsOut.y) * 0.8 * (1.0 - wsFar));
          float wsRim = 1.0 - smoothstep(0.0, 0.03, wsD);
          albedo *= mix(1.0, 0.6, wsRim * wsRim);
          albedo = mix(albedo, vec3(0.012, 0.034, 0.05), wsJoint * (0.85 - 0.5 * wsFar));
        }${ashlar ? `
        // dressed stone: the mason's tooling (fine upright strokes), and the runs rain has drawn down each face
        float wsUpr = 1.0 - smoothstep(0.5, 0.7, abs(wsFN.y));
        albedo *= 1.0 + (hbFbm(vec2(wsQ.x * 95.0, wsQ.y * 3.2)) - 0.5) * 0.16 * wsUpr * (1.0 - wsFar);
        albedo *= 1.0 - 0.5 * smoothstep(0.5, 0.78, hbFbm(vec2(wsQ.x * 15.0, wsQ.y * 0.9 + 2.0))) * wsUpr * smoothstep(0.3, 2.2, vWPos.y);` : ''}
        // lichen: crusts from a thumb to a hand across, each with its own ragged edge, in colonies; more of it the higher and drier
        ${ashlar || CRUST === 0 ? `float wsDisc = 0.0, wsCore = 0.0;
        for (int k = 0; k < 2; k++) {
          vec2 g = wsQ * (k == 0 ? 6.3 : 13.7) + float(k) * 17.3, gi = floor(g), gf = fract(g);
          float rad = (k == 0 ? 0.2 : 0.14) + 0.26 * hbHash(gi + 7.7), dist = length(gf - (0.5 + 0.34 * (vec2(hbHash(gi + 1.3), hbHash(gi + 4.9)) - 0.5))) + (hbNoise(g * 3.3 + 2.0) - 0.5) * 0.2;
          float on = (1.0 - smoothstep(rad - 0.05, rad, dist)) * step(k == 0 ? 0.5 : 0.62, hbHash(gi + 3.1));
          wsCore = max(wsCore, on * (1.0 - smoothstep(rad * 0.3, rad * 0.9, dist))); wsDisc = max(wsDisc, on);
        }
        float wsLc = smoothstep(${ashlar ? '0.44, 0.58' : '0.5, 0.62'}, hbFbm(wsQ * 1.9 + 5.3)) * smoothstep(0.1, 0.6, vWPos.y) * wsDisc;
        vec3 wsLi = ${ashlar ? 'albedo * vec3(0.62, 0.74, 0.67)' : 'max(vec3(0.27, 0.33, 0.3), albedo * vec3(1.26, 1.38, 1.3))'};      // (on the wall's dark stones a step paler than its stone; on the piers' pale ones a grey-green step darker: pale on pale is lost in the dusk's hold)
        albedo = mix(albedo, wsLi * (1.0 - 0.14 * wsCore), min(1.0, wsLc * ${((ashlar ? 0.75 : 0.6) * LICHEN).toFixed(2)}));` : `
        // FIFTH PASS, on the wall: CRUSTS, NOT DISCS. With the bow against the wall its lichen was polka dots: round, soft,
        // see-through discs of two sizes on a grid. A crust is a rosette: a lobed outline that is never a circle, a crisp
        // edge, pale where it is growing (its rim) and greyer in its old heart, where the stone has begun to show again
        // (the page's "pale rings of lichen"). Three sizes, each on a grid turned its own way so that none lines up with
        // the courses, a place in two left empty, and all of it in colonies.
        float wsLrim = 0.0, wsLheart = 0.0;
        for (int k = 0; k < 3; k++) {
          float sc = k == 0 ? 5.1 : (k == 1 ? 9.7 : 17.3), ca = cos(0.5 + 1.1 * float(k)), sa = sin(0.5 + 1.1 * float(k));
          vec2 g = mat2(ca, sa, -sa, ca) * wsQ * sc + float(k) * 17.3, gi = floor(g), dv = fract(g) - (0.5 + 0.36 * (vec2(hbHash(gi + 1.3), hbHash(gi + 4.9)) - 0.5));
          float ang = atan(dv.y, dv.x + 1e-5), ph = hbHash(gi + 2.2) * 6.2832;
          float rad = (0.1 + 0.12 * hbHash(gi + 7.7)) * (1.0 + 0.13 * sin(ang * 2.0 + ph) + 0.1 * sin(ang * 5.0 + ph * 1.7)) + (hbNoise(g * 4.0 + 2.0) - 0.5) * 0.1;      // (lobed, never a circle, never a star)
          float dist = length(dv), on = (1.0 - smoothstep(rad - 0.03, rad, dist)) * step(k == 0 ? 0.5 : 0.56, hbHash(gi + 3.1));
          float heart = 1.0 - smoothstep(rad * 0.3, rad * 0.72, dist);
          wsLrim = max(wsLrim, on * (1.0 - heart)); wsLheart = max(wsLheart, on * heart);
        }
        float wsColony = smoothstep(0.46, 0.6, hbFbm(wsQ * 1.9 + 5.3)) * smoothstep(0.1, 0.6, vWPos.y);
        vec3 wsLi = max(vec3(0.25, 0.3, 0.285), albedo * vec3(1.3, 1.4, 1.34));                                      // a step paler than its stone, grey-green
        albedo = mix(albedo, wsLi, min(1.0, wsColony * (wsLrim * 0.9 + wsLheart * 0.42) * ${(CRUST * LICHEN).toFixed(2)}));`}
        // moss on what looks up
        float wsMoss = smoothstep(0.45, 0.8, wsFN.y) * smoothstep(0.38, 0.56, hbFbm(vWPos.xz * 3.1 + 9.1)) * step(0.12, vWPos.y);
        albedo = mix(albedo, vec3(0.05, 0.089, 0.058) * (0.8 + 0.5 * hbNoise(vWPos.xz * 37.0)), wsMoss * 0.8);
        // green in the damp near the water; the dark wet foot, its edge wandering
        // (both end a hand under the surface: what lies on the bed keeps its own paint, pale stones pale)
        float wsAir = smoothstep(-0.3, -0.04, vWPos.y);
        float wsDamp = (1.0 - smoothstep(0.1, 0.8, vWPos.y)) * smoothstep(0.35, 0.65, hbFbm(wsQ * 3.3 + 7.7)) * wsAir;
        albedo = mix(albedo, albedo * vec3(0.66, 0.86, 0.70), wsDamp * 0.7);
        albedo *= mix(1.0, 0.56, (1.0 - smoothstep(0.105, 0.15, vWPos.y + (hbFbm(wsQ * 4.5 + 2.2) - 0.5) * 0.07)) * wsAir);
      } }` });
  // stone keeps less than half of a lamp's hue (grey limestone within the lantern's reach came out pink and cream)
  const stoneLamp = lampCool(0.45, 0.92, false);

  // ---- where things stand
  const trees = plan.trees.trees;
  /** The tree the page names by its nominal place (the plan stands each one up to 0.4 m off its grid point). */
  const treeNear = (s, d) => trees.reduce((b, t) => (Math.hypot(t.s - s, t.d - d) < Math.hypot(b.s - s, b.d - d) ? t : b));
  /** A tree's own model as the wood's builder publishes it (shared.wood), or null while that module is out. */
  const woodOf = (t) => { const e = wood && wood.of && wood.of(t); return e && wood.models ? { ...e, design: wood.models[e.model] } : null; };
  /** Where a tree's trunk forks, in the realm (the real wood's crotch; else the page's 2.6 m of clear stem). */
  const crotchOf = (t) => { const w = woodOf(t); return w && w.design && w.design.crotch ? wood.toRealm(t, w.design.crotch, V()) : V(t.x, 2.6 * (t.scale || 1), t.z); };
  /** Where a tree's bole really is between two heights above the water (the wood leans, wanders and is never round):
   *  its middle there, and how far its bark reaches from that middle in any direction. Read from the wood's own mesh
   *  (the design's heaviest weight), so that what leans on a trunk touches it. Without the wood: the plan's place. */
  const boleAt = (t, y0, y1) => {
    const out = { x: t.x, z: t.z, found: false, reach: () => 0.21 };
    const e = wood && wood.of && wood.of(t), files = e && wood.models && wood.models[e.model] && wood.models[e.model].files;
    const stem = files && files.near && String(files.near.file).split('/').pop().replace(/\.glb$/, '');
    const mesh = stem && ctx.group.getObjectByName(stem + ':paint'), pos = mesh && mesh.geometry && mesh.geometry.attributes.position;
    if (!pos || !e.matrix) return out;
    const v = V(), pts = []; let sx = 0, sz = 0;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      if (v.x * v.x + v.z * v.z > 0.36 || v.y < y0 - 0.5 || v.y > y1 + 0.5) continue;      // (in the tree's own space: the bole, not its boughs)
      v.applyMatrix4(e.matrix);
      if (v.y < y0 || v.y > y1) continue;
      pts.push(v.x, v.z); sx += v.x; sz += v.z;
    }
    const n = pts.length / 2;
    if (n < 8 || Math.hypot(sx / n - t.x, sz / n - t.z) > 0.5) return out;
    out.x = sx / n; out.z = sz / n; out.found = true; out.points = n;
    out.reach = (dx, dz) => { let m = 0; for (let i = 0; i < pts.length; i += 2) m = Math.max(m, (pts[i] - out.x) * dx + (pts[i + 1] - out.z) * dz); return m; };
    return out;
  };
  const Mnd = plan.water.mound, bed = plan.water.bed;
  /** The bed's height at r metres from a trunk: its planting mound (as set.js builds it), or the flat bed. */
  const moundY = (r) => bed + (Mnd.top - bed) * Math.sqrt(Math.max(0, 1 - Math.pow(r / (Mnd.across / 2 * 1.25), 2)));
  /** rotation.y for a model made in the page's directions (its +X = d, its front looking back up the route). */
  const facing = (s, turn = 0) => plan.heading(s) + turn;
  /** rotation.y that points a model's Blender +Y (its ride -Z) along a direction in the water plane. */
  const yawAlong = (dx, dz) => Math.atan2(-dx, -dz);
  const settle = (g) => { g.updateMatrix(); g.updateMatrixWorld(true); };

  const made = shared.made = { ladders: [], floats: [], hangs: [], walk: [], points: {}, knocks: true };      // knocks: this module plays the page's `knock` for everything it moves (do not play it again from a cue)
  made.paint = { PAINT, THIN, timber, timberLamp, ironDull };      // how this module dresses a model (for the cast: an oar, a post, anything of worked wood or iron left here)
  const taken = [];                                            // stand-ins of other people's modules that these replace

  // ---- whatever stands in the water returns a soft ring of its own when a wake reaches it (the page, section 7)
  const feet = [];
  const foot = (p, strength = 0.14, radius = 0.45, knock = null) => feet.push({ x: p.x, z: p.z, s: strength, r: radius, exc: 0, armed: true, knock });      // knock: { gain, pitch }: wood on wood when the wake arrives
  /** A collider of this module's own, bent round by the current like the plan's (orchard.js reads ctx.state.colliders). */
  const collide = (p, r, flow = false) => { const c = { x: p.x, z: p.z, r, flow }; ctx.addCollider(c); if (ctx.state.colliders) ctx.state.colliders.push(c); return c; };

  // ================================================================================================ the loft's west door
  // The door the boat comes in by (hero `loft_door`): two posts 0.45 m square on stone pads, pegged; a lintel with a sag;
  // four plank leaves folded back outside, two to a side, like two half-open books; an iron drop-bar hanging on the
  // right-hand pair with its foot in the water (a moving part: it swings a hair on its pivot bolt). Made in the page's
  // directions, so it is simply set on the threshold.
  {
    // (its big ironwork is a slot of its own, `iron`: band hinges 2.3 m long, hooks, the lintel's straps, the ring, the bar.
    // They are thin things: kept out of the painter's filter, they are what says "doors" from the avenue.)
    const s0 = L.loft.door, door = made.door = await kit.model(DIR + 'loft_door.glb', { ...PAINT, materials: { iron: { crisp: THIN.crisp, extend: [shared.dusk, ironDull] } }, position: F.at(s0, 0, 0), rotation: [0, facing(s0), 0] });
    taken.push('loft_door');
    foot(door.point('post_L')); foot(door.point('post_R')); foot(door.point('bar_foot'), 0.08, 0.3);
    // the outer leaves stand out from the gable (the right-hand one by 2.3 m): a hull must not pass through them
    for (const side of ['L', 'R']) {
      const a = door.point('fold_' + side), b = door.point('leaf_' + side);
      for (const k of [0.15, 0.5, 0.88]) collide(V().lerpVectors(a, b, k), 0.45);
    }
  }

  // ================================================================================================ the cloth loft (the dyers' reach's model)
  // FIFTH PASS. The loft this door stands in is the dyers' reach's piece (docs/art/README.md: one shed in two halves, the
  // reach's section the master). Until 00:55 on 8 November it did not exist, and the layout's flat dark stand-in stood
  // behind the door (kit.js: "loft_bay x5, louvre_panel, the gable (the reach's model)"): postcard 10 was a handsome
  // pair of doors on a blank black box, which every holder of this stage named first. The reach has now made the
  // orchard's whole half as ONE model in the axes of this door (assets/models/reach/cloth_loft_west.glb;
  // docs/build/reach/2-heroes-houses.md, "FOR THE ORCHARD") and waits for the orchard to place it: the weatherboarded
  // west gable with the opening this door stands in, a louvred vent under the peak, five bents, cloth rails, louvred
  // walls, plank walks on piles, the roof, the shell on to s -34. docs/building-an-area.md: "use its file if it exists".
  // So it is placed here, with the door it frames, by the line the door is placed with, and the stand-in is taken out
  // with the others at the first frame. Nothing of it is made or changed here; kit.js is not touched; the indigo bolts
  // and `the dark of the loft` are kit.js's and stay. (&hbloft=0: the stand-in, as it was.)
  // It stands down by itself, and the stand-in or the other copy stays, if the file is not there (it is another area's
  // and may be renamed) or if somebody else's module turns out to have placed the same model (see the first frame).
  // Its paint: the hour (shared.dusk), as the reach tried it in this light; and its timber takes a lamp's light as the
  // door's does (three fifths of its hue), so that the frame overhead and the door's posts are one wood in the lantern.
  let loft = null;
  if (Q.get('hbloft') !== '0') {
    try {
      const s0 = L.loft.door;
      // (The reach paints its timber the warm brown of its own sunset. Beside this door's silvered posts, in this
      // orchard's cool dusk, the loft's frame stood as new brown wood: here its paint is drawn most of the way to its
      // own grey, a little plum, keeping its lightness (`&hbloftgrey=0`: as the reach painted it); and it gives back
      // three quarters of a lamp's light: the page's "night inside".)
      const loftGrey = { albedo: `albedo = mix(albedo, dot(albedo, vec3(0.3, 0.55, 0.15)) * vec3(0.98, 0.94, 1.07), ${(+(Q.get('hbloftgrey') ?? 0.7)).toFixed(2)});` };
      loft = await kit.model('models/reach/cloth_loft_west.glb', { brush: 0.85, shade: 1, extend: [loftGrey, shared.dusk, lampCool(0.6, +(Q.get('hbloftlamp') ?? 0.75), false)], position: F.at(s0, 0, 0), rotation: [0, facing(s0), 0] });
    } catch (e) { console.warn('heroes_b: the cloth loft (models/reach/cloth_loft_west.glb) could not be loaded: its stand-in stays.', e); loft = null; }
  }
  made.loft = loft;                                              // { group, point(name) }: rail0_l .. rail4_r (the cloth rails' ends), peak, vent, sill_l, sill_r; null when it is not this module's
  let loftSettled = !loft;

  // ================================================================================================ the wall and its gap
  // The gap the boat leaves by (hero `wall_gap`): two square gate piers with pyramid caps (the north one's chipped), the
  // wall's broken ends stepping down stone by stone into the water either side, the iron gate leaf on the south pier
  // swung open toward the boat and leaning (a moving part on its one pintle), the fallen stones pale on the bed. Then the
  // wall itself, hedge to hedge, in 6 m lengths of four designs (kit `wall_6m`): the first length north of the gap
  // carries the step-stile at d +14.5, where the plank walk ends.
  {
    const s0 = L.wall.s, turn = facing(s0);
    // The rubble wears the painted stone (the kit's half of the page's `bark_stone` sheet), projected from three sides,
    // 1.3 m to a repeat, over its own vertex paint: `color` is one over the picture's mean, so the paint keeps its
    // value and the picture gives each stone its broken face, its lichen and its moss. Petals keep their own colour
    // (they are marked in the vertex colour's alpha: source-art/models/orchard/orch.py).
    const stoneTex = await ctx.tex('art/orchard/stone.webp', { repeat: true }).catch(() => null);
    const keepPetals = { albedo: '#ifdef USE_COLOR_ALPHA\n albedo = mix(vColor.rgb, albedo, step(0.5, vColor.a));\n#endif' };
    const triScale = +(Q.get('hbstone') ?? 1.3);                  // (developer) &hbstone=0: the rubble in its vertex paint alone; &hbstone=2.2: another size of the picture
    const STONE = stoneTex && triScale > 0 ? { ...PAINT, extend: [keepPetals, workedStone(false), shared.dusk, holds, stoneLamp], map: stoneTex, triplanar: triScale, color: new THREE.Color().setRGB(9.95, 7.81, 5.03) }
      : { ...PAINT, extend: [keepPetals, workedStone(false), shared.dusk, holds, stoneLamp] };
    const plain = { map: null, triplanar: 0, color: '#ffffff' };
    made.paint.STONE = STONE; made.paint.stoneLamp = stoneLamp; made.paint.workedStone = workedStone;
    const gap = made.gap = await kit.model(DIR + 'wall_gap.glb', { ...STONE, materials: { ashlar: { ...plain, extend: [keepPetals, workedStone(true), shared.dusk, holds, stoneLamp] }, iron: { ...plain, crisp: THIN.crisp, extend: [keepPetals, shared.dusk, holds, ironDull] } }, position: F.at(s0, 0, 0), rotation: [0, turn, 0] });
    taken.push('wall_gap');
    // north of the gap the lengths run north from d +11.5; south of it they are turned end for end and run south from
    // d -11.5 (a length's courses are toothed to follow any other length laid the same way round)
    // The six lengths nearest the gap on each side (to d 47.5) are the four designs; beyond that the wall is never less
    // than 19 m from a boat and stands in the blue hour's mist, and from the first avenue all of it is 80 m off and
    // more: those twelve lengths are `wall_6m_far`, the same outline with a fifth of the stones (680 triangles for 3,100).
    const runs = { a: [], b: [], c: [], d: [], far: [] }, tints = ['#ffffff', '#f2f0f6', '#f6f4ee', '#eceef4'], NEAR = 6;
    for (let i = 0; i < 12; i++) {
      runs[i < NEAR ? 'dabcac'[i] : 'far'].push({ position: F.at(s0, 11.5 + 6 * i, 0), rotation: [0, turn, 0], tint: tints[i % 4] });
      runs[i < NEAR ? 'bcabac'[i] : 'far'].push({ position: F.at(s0, -11.5 - 6 * i, 0), rotation: [0, turn + Math.PI, 0], tint: tints[(i + 2) % 4] });
    }
    made.wall = {};
    // (the length with the stile carries its handpost in a slot of its own, `post`: worked timber, a thin thing)
    const withPost = { ...STONE, materials: { post: { ...plain, crisp: THIN.crisp, extend: [timber, shared.dusk, holds, timberLamp] } } };
    for (const k of ['a', 'b', 'c', 'd', 'far']) made.wall[k] = await kit.models(DIR + `wall_6m_${k}.glb`, runs[k], k === 'd' ? withPost : STONE);
    taken.push('wall_6m');
    foot(gap.point('pier_L'), 0.16, 0.6); foot(gap.point('pier_R'), 0.16, 0.6);
  }

  // ================================================================================================ the plank walk
  // Duckboards on trestles 0.35 m above the water along d +14.5 (kit `plank_span`, three designs): twenty spans of 3 m
  // from s 155.1 to the stile's lowest step at s 215.2. Each span owns one trestle, at its start, and its planks reach
  // onto the next; where the page has the planks missing (s 170 to 176, and by s 191) only the trestle stands.
  {
    const Wk = L.plankWalk, first = 155.1, n = 20, at = (k) => F.at(first + 3 * k, Wk.d, 0);
    const runs = { a: [], b: [], c: [] }, tints = ['#ffffff', '#f4f0f2', '#f0f2f6', '#f8f4ee'];
    for (let k = 0; k < n; k++) {
      const s = first + 3 * k, bare = Wk.missing.some(([a, b]) => s + 1.5 > a && s + 1.5 < b + 1.2);
      const p = at(k), q = at(k + 1), kind = bare ? 'c' : (k * 7 + 3) % 5 < 3 ? 'a' : 'b';
      runs[kind].push({ position: p, rotation: [(rnd() - 0.5) * 0.015, yawAlong(q.x - p.x, q.z - p.z) + (rnd() - 0.5) * 0.02, (rnd() - 0.5) * 0.03], tint: tints[k % 4] });
      made.walk.push({ s, at: p, planks: !bare });
      foot(p, 0.1, 0.5);
    }
    for (const k of 'abc') if (runs[k].length) await kit.models(DIR + `plank_span_${k}.glb`, runs[k], Q.get('hbwalk') === 'crisp' ? THIN : PAINT);
  }

  // ================================================================================================ the hives
  // Six white box hives on a trestle stand at (152, +13.5), their entrances to the channel (hero `hive_stand`): no two
  // roofs at the same tilt, a brick on each, one strapped, the cold smoker left between them.
  {
    const H = L.hives, hv = made.hives = await kit.model(DIR + 'hive_stand.glb', { ...PAINT, extend: [timber, chalk, shared.dusk, holds, timberLamp, Q.get('hbwash') === '0' ? null : washLamp], position: F.at(H.at[0], H.at[1], 0), rotation: [0, facing(H.at[0]), 0] });
    taken.push('hive_stand');
    made.entrances = [1, 2, 3, 4, 5, 6].map((i) => hv.point('entrance_' + i));
    made.boards = [1, 2, 3, 4, 5, 6].map((i) => hv.point('board_' + i));
    for (const dy of [-1.72, 0, 1.72]) for (const dx of [-0.48, 0.48]) foot(F.at(H.at[0] + dy, H.at[1] + dx, 0), 0.09, 0.4);
  }

  // ================================================================================================ the handcart
  // Tipped up against the tree at (84.5, -10) and left (hero `handcart`). FOURTH PASS: it stands on the trunk's UP-ROUTE
  // side, its wheels on the planting mound with their axle a finger above the water (so the upper half of each wheel
  // stands clear and its reflection closes the circle), its tail on the mound's foot toward the arriving boat, the front
  // edge of its bed leaning on the bole and its two shafts passing one either side of the trunk, 1.6 m out of the water.
  // The boat that comes down the lane looks into its open bed between two half wheels; abeam, ten metres off, it has
  // the cart in profile (a spoked wheel full face, the bed sloping up to the white trunk, the shafts above); looking
  // back, its underside and the axle. The wheels are kept out of the painter's filter: a spoke is two centimetres.
  // (Until this pass it stood on the mound's shoulder on the lane side, tipped to 64.5 degrees with its axle 13 cm under
  // the water and its wheels edge-on to the lane: a boarded panel leaning on a tree.)
  // NOT WHERE THE PAGE PUTS IT ((86.5, -11.8), behind the tree as the lane sees it, a metre down): see the log.
  {
    const H = L.handcart, t = treeNear(H.tree[0], H.tree[1]);
    const a = F.at(H.tree[0], H.tree[1], 0), b = F.at(H.tree[0] - 1, H.tree[1] + 0.2, 0), u = b.sub(a).normalize();      // out from the trunk: back up the route, a little toward the lane
    const bole = boleAt(t, 0.72, 1.06), turn = yawAlong(u.x, u.z), cx = -u.z, cz = u.x;                                     // (the bed's front edge meets the trunk 0.89 m up)
    const wheelPaint = { crisp: THIN.crisp, extend: [timber, shared.dusk, holds, timber ? lampCool(0.6, 1, false) : null] };
    const cart = made.cart = await kit.model(DIR + 'handcart.glb', { ...PAINT, materials: { wheel: wheelPaint }, position: [bole.x + u.x * 1.3, 0, bole.z + u.z * 1.3], rotation: [0, turn, 0] });      // (the file's own contract: its origin 1.3 m from a trunk's axis)
    // the model's `rest` (the middle of its bed's front edge) is brought against the bark, the trunk midway between the shafts
    const rest = cart.point('rest'), out = (rest.x - bole.x) * u.x + (rest.z - bole.z) * u.z - bole.reach(u.x, u.z) + 0.012, side = (rest.x - bole.x) * cx + (rest.z - bole.z) * cz;
    const pos = V(bole.x + u.x * (1.3 - out) - cx * side, 0, bole.z + u.z * (1.3 - out) - cz * side);
    cart.set({ position: pos, rotation: [0, turn, 0] });
    made.cartAt = { tree: t, bole, out: u.clone(), position: pos };
    taken.push('handcart');
    foot(cart.point('wheel_L'), 0.12, 0.5); foot(cart.point('wheel_R'), 0.12, 0.5);
    // the plan's collider for the cart is at the page's place: it is moved to where the cart stands
    const old = F.at(H.at[0], H.at[1], 0), pc = (ctx.state.colliders || []).find((c) => Math.hypot(c.x - old.x, c.z - old.z) < 0.05);
    const mid = cart.point('wheel_L').add(cart.point('wheel_R')).multiplyScalar(0.5);                                      // (the middle of its axle: what a hull must keep off is round that)
    if (pc) { pc.x = mid.x + u.x * 0.15; pc.z = mid.z + u.z * 0.15; pc.r = 1.0; } else collide(V(mid.x + u.x * 0.15, 0, mid.z + u.z * 0.15), 1.0, true);
  }

  // ================================================================================================ ladders
  // A ladder model is upright in its file: its own +Y runs foot to head, its rungs lie along X, its +Z is the side a
  // picker climbs. Lean it from foot to head with the climbing side uppermost.
  const lean = (m, at, head, roll = 0) => {
    const y = head.clone().sub(at).normalize(), up = V(0, 1, 0);
    const z = up.addScaledVector(y, -up.dot(y)).normalize(), x = V().crossVectors(y, z);
    if (roll) { const c = Math.cos(roll), sn = Math.sin(roll), x0 = x.clone(); x.multiplyScalar(c).addScaledVector(z, sn); z.multiplyScalar(c).addScaledVector(x0, -sn); }      // rolled about its own length
    m.group.position.copy(at); m.group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    settle(m.group);
    return { model: m, foot: at, head, across: x, face: z };
  };
  // ---- the two 4 m ladders left in the trees at (48.5, -10) and (75.5, +10): foot on the bed where the page puts it,
  // head come to rest in the fork, a hand off the trunk's axis (the real wood's crotch, when the trees are in)
  // FIFTH PASS: THE SECOND LADDER FACES THE ARRIVING BOAT. The page stands its foot at (76.6, +8.9), down-route of its
  // trunk at (75.5, +10): from the lane the boat then looks ALONG its rungs the whole way down the avenue (a pole with a
  // basket on it), and it opens into a ladder only when the boat is past it and the rider is looking at the lamp. Its
  // foot stands on the other side of the same trunk, up-route, at (74.4, +8.9): the same mound, the same fork, the same
  // lean, turned to the boat that comes down the lane, as the first ladder is by the page's own numbers. The plan's
  // collider for its foot is moved with it. (&hbladder=page: where the page puts it. NOT IN THE SHARED PLAN: the orchard
  // in snow keeps the page's place; the cast's firefly stake at plan.left.ladders[1].foot is two metres from the foot now:
  // made.ladders[1].foot is where it stands.)
  const footOf = (l, i) => (i === 1 && Q.get('hbladder') !== 'page' ? [2 * l.tree[0] - l.foot[0], l.foot[1]] : l.foot);
  for (const [i, l] of L.ladders.entries()) {
    const ft = footOf(l, i), t = treeNear(l.tree[0], l.tree[1]), at = F.at(ft[0], ft[1], 0), fork = crotchOf(t);
    if (ft !== l.foot) {
      const old = F.at(l.foot[0], l.foot[1], 0), pc = (ctx.state.colliders || []).find((c) => Math.hypot(c.x - old.x, c.z - old.z) < 0.05);
      if (pc) { pc.x = at.x; pc.z = at.z; }
    }
    at.y = moundY(Math.hypot(at.x - t.x, at.z - t.z)) - 0.03;
    const r = Math.hypot(at.x - fork.x, at.z - fork.z), ux = (at.x - fork.x) / r, uz = (at.z - fork.z) / r, off = 0.2, run = r - off;
    const head = V(fork.x + ux * off, at.y + Math.sqrt(l.length * l.length - run * run), fork.z + uz * off);
    made.ladders.push({ ...lean(await kit.model(DIR + 'ladder_4m.glb', THIN), at, head), tree: t, name: `ladder in the tree at (${l.tree})` });
    foot(at, 0.08, 0.35);
  }
  // ---- the 7 m pole ladder from the islet at (106.2, +2.5) up over the lamp limb: where the monument's model says it
  // stands and rests (shared.tree.ladder: its `ladder_foot` and `ladder_top`), or the page's places until that is in
  {
    const P = plan.tree.poleLadder, given = shared.tree && shared.tree.ladder && shared.tree.ladder.foot && shared.tree.ladder.top ? shared.tree.ladder : null;
    const at = given ? given.foot.clone() : F.at(P.foot[0], P.foot[1], P.foot[2] - 0.04), aim = given ? given.top.clone() : F.at(102.6, -0.4, 5.2);
    const head = at.clone().addScaledVector(aim.sub(at).normalize(), P.length);
    made.ladders.push({ ...lean(await kit.model(DIR + 'ladder_7m.glb', THIN), at, head), name: 'the pole ladder in the oldest tree', given: !!given });
  }
  // ---- the ladder fallen from the tree at (174.5, +10): it slid down its trunk. Its head has come to rest against the
  // bole half a metre above the water (the page: "its top end 0.5 m out of the water"), its lower half lies under it
  // and its foot is on the bed out toward the lane, where the page ends it (177, +6.5)
  {
    const Fl = L.fallenLadder, t = treeNear(Fl.tree[0], Fl.tree[1]), out = F.at(Fl.to[0], Fl.to[1], 0);
    const r = Math.hypot(out.x - t.x, out.z - t.z), ux = (out.x - t.x) / r, uz = (out.z - t.z) / r;
    const head = V(t.x + ux * 0.27, Fl.topOut, t.z + uz * 0.27), drop = Fl.topOut - (bed + 0.03), run = Math.sqrt(16 - drop * drop);
    const at = V(head.x + ux * run, bed + 0.03, head.z + uz * run);
    // It did not come to rest square: it lies rolled a third of the way over, its climbing side turned toward the lane
    // and back up the route. (Lying level it was seen edge-on from every place a boat can be, the eye being 1.1 m up:
    // two rails one above the other, a plank. Rolled, its rungs show to the boat that comes down the lane.)
    const mid = at.clone().lerp(head, 0.83), toBoat = F.at(Fl.tree[0] - 9, 0, 1.1).sub(mid).normalize();
    const flat = lean({ group: new THREE.Group() }, at, head), side = Math.sign(toBoat.dot(flat.across)) || 1;
    made.ladders.push({ ...lean(await kit.model(DIR + 'ladder_4m_fallen.glb', THIN), at, head, side * -0.6), tree: t, name: 'the fallen ladder' });
    // where its rails go under the water: a ring when a wake reaches it, and its head knocks once on the bole (the page's `knock`)
    foot(at.clone().lerp(head, (0 - at.y) / Math.max(0.05, head.y - at.y)), 0.1, 0.4, { gain: 0.22, pitch: 1.15 });
  }

  // ================================================================================================ baskets
  // Five picking baskets (the page): one on the ninth rung of each 4 m ladder, one on the pole ladder's top rung, two on
  // the hive stand; and one sunk on the bed at (78, +7). A hanging basket's origin is where its hook bears on the rung.
  const hung = [];
  const hangOn = (ld, rung, name) => {
    const at = ld.model.point(rung), yaw = Math.atan2(-ld.across.z, ld.across.x);
    // it hangs on the ladder's underside and its wall rests against the rungs below: tilted a little off plumb, that way
    const zx = Math.sin(yaw), zz = Math.cos(yaw), rest = (zx * ld.face.x + zz * ld.face.z > 0 ? 1 : -1) * 0.14;
    const h = { name, at, yaw, rest, phi: 0, vel: 0, exc: 0, armed: true, i: hung.length, next: 0, taps: 0 };
    hung.push(h); made.hangs.push(h);
    return { position: at, rotation: [rest, yaw, 0] };
  };
  const hangPlaces = [hangOn(made.ladders[0], 'rung_9', 'basket on the ladder at (48.5, -10)'), hangOn(made.ladders[1], 'rung_9', 'basket on the ladder at (75.5, +10)'),
    hangOn(made.ladders[2], 'rung_top', 'basket on the pole ladder')];
  const baskets = await kit.models(DIR + 'basket.glb', hangPlaces, PAINT);
  {
    const sb = F.at(L.sunkBasket[0], L.sunkBasket[1], bed + 0.21), bp = made.hives.point('baskets'), turn = facing(L.hives.at[0]);
    made.basketsSet = await kit.models(DIR + 'basket_set.glb', [
      { position: sb, rotation: [1.25, 0.6, 0.2] },                                                   // the sunk one, on its side on the bed
      { position: bp, rotation: [0, turn + 0.7, 0] },                                                 // two on the hive stand's free end, one set in the other
      { position: [bp.x, bp.y + 0.105, bp.z], rotation: [0.13, turn + 2.4, 0.06], scale: 0.97 },
      { position: [0, -5, 0] },                                                                       // the one afloat (below): placed every frame
    ], PAINT);
  }

  // ================================================================================================ things afloat
  // The crate at (58, +3), three metres from the lane, and the duckboard that has floated off the plank walk at (172, +11).
  // They ride the water (heightAt, slopeAt), bob 2 cm every 2.8 s, rock late and long when a wake reaches them (weight:
  // they lag the ripple and settle slowly), and a hull that touches them nudges them along.
  const floater = async (name, file, s, d, o) => {
    const p = F.at(s, d, 0), m = await kit.model(DIR + file, { ...PAINT, position: p, live: true });
    const f = { name, model: m, x: p.x, z: p.z, hx: p.x, hz: p.z, vx: 0, vz: 0, exc: 0, armed: true, ph: rnd() * 6.28, yaw: 0, spin: 0, r: 0.4, draft: 0, pitch: 0, roll: 0, rock: 0.05, bob: 0.01, period: 2.8, settle: 5, ...o };
    made.floats.push(f);
    return f;
  };
  // (knock: the page's sound for a thing afloat when a wake reaches it: a crate's loose slats, a board the water slaps, wicker on a cart's boards)
  await floater('crate', 'crate.glb', L.crate[0], L.crate[1], { yaw: facing(L.crate[0], 0.5), r: 0.42, draft: -0.01, pitch: 0.16, roll: 0.06, rock: 0.07, knock: { gain: 0.32, pitch: 0.85 } });
  await floater('loose plank', 'plank_loose.glb', L.plankWalk.afloat[0], L.plankWalk.afloat[1], { yaw: facing(L.plankWalk.afloat[0], 0.7), r: 0.5, long: 1.4, rock: 0.025, bob: 0.006, period: 3.4, settle: 7, knock: { gain: 0.22, pitch: 1.3 } });
  // ---- A BASKET AFLOAT, LODGED (third pass; the director: "baskets and a crate afloat or lodged"). The flood lifted it
  // and the slow current has carried it into the tipped cart, whose bed is a little dock open to the water that comes
  // down the orchard: it floats there between the cart's sides, half sunk, tipped, a few petals in it. It rides the water
  // and rocks with a wake like the crate, and cannot leave (it is penned: `pen`). It is one more copy of basket_set (no
  // draw call of its own). NOT ON THE PAGE'S LIST (five baskets and the sunk one): a seventh. (FOURTH PASS: it lay
  // against the cart's wheel, where it would now hide the wheel and its reflection.)
  {
    const p = made.cart.point('dock');
    made.floats.push({ name: 'basket afloat', x: p.x, z: p.z, hx: p.x, hz: p.z, vx: 0, vz: 0, exc: 0, armed: true, ph: rnd() * 6.28, yaw: 1.9, spin: 0, r: 0.3, draft: -0.135, pitch: 0.24, roll: 0.1,
      rock: 0.06, bob: 0.008, period: 3.1, settle: 5, leash: 0.03, pen: 0.07, knock: { gain: 0.15, pitch: 1.6 }, place: (x, y, z, rx, ry, rz) => made.basketsSet.place(3, { position: [x, y, z], rotation: [rx, ry, rz] }) });
  }

  // ================================================================================================ labels
  // A blank zinc label on a wire from the lowest bough of every avenue tree (kit `label`, 110): each turns slowly on its
  // wire, 60 degrees either way every 3 to 5 s, in the vertex shader (one draw; direct view only: it is 6 cm long).
  {
    const turnOnWire = { vertexPars: 'attribute float aTurn;', vertexLocal: `{ float lt = 1.05 * sin(uTime * (1.26 + 0.83 * fract(aTurn * 7.31)) + aTurn * 6.2832), lc = cos(lt), ls = sin(lt);
      transformed.xz = mat2(lc, ls, -ls, lc) * transformed.xz; objectNormal.xz = mat2(lc, ls, -ls, lc) * objectNormal.xz; }` };
    const places = trees.map((t) => {
      const w = woodOf(t), p = w && w.design && w.design.label ? wood.toRealm(t, w.design.label, V()) : V(t.x + 0.5, 2.55, t.z + 0.3);
      return { position: p, rotation: [0, rnd() * 6.283, 0] };
    });
    const labels = made.labels = await kit.models(DIR + 'label.glb', places, { ...THIN, extend: [shared.dusk, holds, turnOnWire] });
    const ph = new Float32Array(places.length); for (let i = 0; i < ph.length; i++) ph[i] = rnd();
    for (const m of labels.meshes) m.geometry.setAttribute('aTurn', new THREE.InstancedBufferAttribute(ph, 1));
    ctx.only(labels.group, 'direct');
    made.labelAt = places.map((q) => q.position);
    taken.push(/^label$/);
  }

  // ================================================================================================ stand-ins
  // heroes.js and kit.js are other people's files: their stand-ins for these pieces are taken out here, once, after
  // every module has built (kit.js builds after this one), and their lines are deleted later.
  taken.push('ladder_4m x2, ladder_7m, baskets, crate, plank_span');
  let takeOut = taken.length > 0 && !Q.has('keepstand');

  // &hbdebug=1 (developer): where every piece ended up, in the page's (s, d, y), to .shots/orchard_hb_debug.json
  if (Q.has('hbdebug')) {
    const pg = (v) => { const l = plan.locate(v.x, v.z, {}); return [+l.s.toFixed(2), +l.d.toFixed(2), +v.y.toFixed(2)]; };
    const out = { wood: !!wood, ladders: made.ladders.map((l) => ({ name: l.name, foot: pg(l.foot), head: pg(l.head), given: l.given })), hangs: made.hangs.map((h) => ({ name: h.name, at: pg(h.at) })),
      cart: { at: pg(made.cart.group.position), shafts: [pg(made.cart.point('shaft_L')), pg(made.cart.point('shaft_R'))], tail: pg(made.cart.point('tail')), rest: pg(made.cart.point('rest')), dock: pg(made.cart.point('dock')),
        bole: { found: made.cartAt.bole.found, points: made.cartAt.bole.points || 0, at: pg({ x: made.cartAt.bole.x, y: 0.89, z: made.cartAt.bole.z }), reach: +made.cartAt.bole.reach(made.cartAt.out.x, made.cartAt.out.z).toFixed(3) } },
      door: { leaf_L: pg(made.door.point('leaf_L')), leaf_R: pg(made.door.point('leaf_R')), lintel: pg(made.door.point('lintel')) },
      gap: { pier_L: pg(made.gap.point('pier_L')), pier_R: pg(made.gap.point('pier_R')), gate_tip: pg(made.gap.point('gate_tip')) },
      entrances: made.entrances.map(pg), labels: made.labelAt.map(pg), feet: feet.length, tree: shared.tree ? Object.keys(shared.tree) : null };
    fetch('/__shot/orchard_hb_debug.json', { method: 'POST', body: JSON.stringify(out, null, 1) }).catch(() => {});
  }

  // ================================================================================================ every frame
  const slope = { x: 0, z: 0 }, HOLD_WAKE = +(Q.get('hbwake') || 0);
  // the two parts that turn, and where each meets the water (a wake that arrives there sets it going: `tail` is how long it takes to settle)
  const barRest = made.door.parts.bar.quaternion.clone(), _qs = new THREE.Quaternion(), Z_AXIS = V(0, 0, 1);      // the bar as its file hangs it; it swings about its own bolt (its own Z)
  const swings = [made.door.point('bar_foot'), made.gap.point('gate_foot')].map((q, i) => ({ x: q.x, z: q.z, exc: 0, armed: true, tail: i ? 6 : 3.5 }));
  /** Rock everything within `reach` metres of a place, as a wake does (for the cast: a carp's boil, the stag's bow wave). */
  made.wake = (x, z, strength = 0.5, reach = 6) => {
    for (const f of made.floats) { const d = Math.hypot(f.x - x, f.z - z); if (d < reach) f.exc = Math.max(f.exc, strength * (1 - d / reach)); }
    for (const h of hung) { const d = Math.hypot(h.at.x - x, h.at.z - z); if (d < reach) h.exc = Math.max(h.exc, strength * (1 - d / reach)); }
    for (const sw of swings) { const d = Math.hypot(sw.x - x, sw.z - z); if (d < reach) sw.exc = Math.max(sw.exc, strength * (1 - d / reach)); }
  };
  return {
    update(dt) {
      if (!loftSettled) {
        // the reach's loft (above): every module has built by now. If another module has placed the same model, this
        // copy goes and theirs stays; else the layout's stand-in for it goes with the rest (unless &keepstand)
        loftSettled = true;
        let other = false;
        ctx.group.traverse((o) => { if (!other && o !== loft.group && o.name && o.name.startsWith('cloth_loft_west')) { let p = o; while (p && p !== loft.group) p = p.parent; if (!p) other = true; } });
        if (other) { if (loft.group.parent) loft.group.parent.remove(loft.group); loft = made.loft = null; }
        else if (!Q.has('keepstand')) { taken.push('loft_bay x5'); takeOut = true; }
      }
      if (takeOut) {
        takeOut = false;
        // (the stand-ins wear the area's SHARED materials: removeStandIn would dispose shared.mat.wood under every trunk
        // in the orchard, and the renderer then logs a GL error a frame. So each is parted from its material first.)
        const hit = (o, n) => (n instanceof RegExp ? n.test(o.name.slice(8)) : o.name.slice(8).includes(n));
        ctx.group.traverse((o) => { if (o.name && o.name.startsWith('standin:') && taken.some((n) => hit(o, n))) o.material = null; });
        made.removed = taken.map((n) => [String(n), removeStandIn(ctx, n)]);
      }
      const b = ctx.boat, t = ctx.time, sp = Math.min(1, Math.abs(b.speed || 0) / 3), still = ctx.engine.frozen;
      if (HOLD_WAKE > 0) { for (const o of [...made.floats, ...hung, ...swings]) o.exc = Math.max(o.exc, HOLD_WAKE); }      // (developer) &hbwake=0.8: as if a wake had just reached everything, held
      const bowX = b.x - Math.sin(b.heading) * 1.85, bowZ = b.z - Math.cos(b.heading) * 1.85;
      // how hard the boat's wake reaches a place, and how late (it travels about 1.5 m/s: the nearer, the sooner)
      const wakeAt = (x, z, o, tail) => {
        const d = Math.hypot(x - b.x, z - b.z), want = d < 12 ? sp * (1 - d / 12) * (1 - d / 12) : 0;
        o.exc += want > o.exc ? (want - o.exc) * (1 - Math.exp(-dt / (0.5 + d / 3))) : (want - o.exc) * (1 - Math.exp(-dt / tail));
        return d;
      };
      for (const f of made.floats) {
        wakeAt(f.x, f.z, f, f.settle);
        // a hull that touches it shoulders it aside (the hull's middle and its bow; a long thing is two circles)
        for (const [ox, oz] of f.long ? [[Math.cos(f.yaw) * f.long * 0.6, -Math.sin(f.yaw) * f.long * 0.6], [-Math.cos(f.yaw) * f.long * 0.6, Math.sin(f.yaw) * f.long * 0.6]] : [[0, 0]]) {
          for (const [hx, hz, hr] of [[b.x, b.z, 1.0], [bowX, bowZ, 0.65]]) {
            const dx = f.x + ox - hx, dz = f.z + oz - hz, d = Math.hypot(dx, dz), reach = hr + f.r;
            if (d < reach && d > 1e-3 && !still) {
              const push = (reach - d) * 9 * dt; f.vx += dx / d * push; f.vz += dz / d * push; f.exc = Math.max(f.exc, 0.55);
              if (f.knock && t > (f.bumped || 0)) { ctx.audio.play('knock', { x: f.x, z: f.z, gain: Math.min(0.45, f.knock.gain * 1.4), pitch: f.knock.pitch }); f.again = 0; }      // the hull's own knock on it
              f.bumped = t + 1.4;
              if (f.long) f.spin += (ox * dz - oz * dx) / (d * f.long) * push * 0.8;                 // pushed at one end, it swings
            }
          }
        }
        // it does not wander off: beyond three metres from where it was left, the still water brings it gently back
        const hd = Math.hypot(f.x - f.hx, f.z - f.hz), lsh = f.leash ?? 3; if (hd > lsh) { f.vx -= (f.x - f.hx) / hd * (hd - lsh) * 0.2 * dt; f.vz -= (f.z - f.hz) / hd * (hd - lsh) * 0.2 * dt; }
        const drag = Math.exp(-dt / 1.8); f.vx *= drag; f.vz *= drag; f.spin *= Math.exp(-dt / 2.5);
        f.x += f.vx * dt; f.z += f.vz * dt; f.yaw += f.spin * dt;
        if (f.pen) { const pd = Math.hypot(f.x - f.hx, f.z - f.hz); if (pd > f.pen) { f.x = f.hx + (f.x - f.hx) / pd * f.pen; f.z = f.hz + (f.z - f.hz) / pd * f.pen; f.vx *= 0.3; f.vz *= 0.3; } }      // (penned: between the cart's sides)
        if (f.armed && f.exc > 0.22) {                                                                 // its own ring when the wake reaches it, and its knock; once more, softer, as it rocks back
          f.armed = false; ctx.water.ripple(f.x, f.z, 0.22, 0.5);
          if (f.knock && t > (f.bumped || 0)) { ctx.audio.play('knock', { x: f.x, z: f.z, gain: f.knock.gain * Math.min(1, 0.5 + f.exc), pitch: f.knock.pitch }); f.again = t + 0.45 * f.period; }
        } else if (f.exc < 0.08) f.armed = true;
        if (f.again && t > f.again) { f.again = 0; if (f.exc > 0.12) ctx.audio.play('knock', { x: f.x, z: f.z, gain: f.knock.gain * 0.5, pitch: f.knock.pitch * 1.06 }); }
        const w = 2 * Math.PI / f.period, k = 1 + 2.2 * f.exc;
        if (f.place && Math.abs(f.x - b.x) + Math.abs(f.z - b.z) > 90 && f.placed) continue;            // (an instanced one out of sight is left where it is)
        if (ctx.water.slopeAt) ctx.water.slopeAt(f.x, f.z, slope);
        const fy = ctx.water.heightAt(f.x, f.z) + f.draft + f.bob * k * Math.sin(t * w + f.ph), rk = f.rock * (0.18 + f.exc);
        const frx = f.pitch + rk * Math.sin(t * w * 1.31 + f.ph * 2) - slope.z, frz = f.roll + rk * 0.8 * Math.sin(t * w * 0.83 + f.ph) + slope.x;
        if (f.place) { f.place(f.x, fy, f.z, frx, f.yaw, frz); f.placed = true; } else { const g = f.model.group; g.position.set(f.x, fy, f.z); g.rotation.set(frx, f.yaw, frz, 'YXZ'); }
      }
      // the door's drop-bar: iron, heavy, never quite still on its bolt; when a wake reaches its foot (which hangs in
      // the water) it swings on its bolt for a few seconds, a hand's breadth at the foot, and leaves a ring
      // the gate leaf, half open in the water on its one pintle: the current through the gap works it a hair, and a
      // wake that reaches it works it a hand's breadth at its tip, slowly (it is heavy, and half of it is under water)
      for (const sw of swings) {
        wakeAt(sw.x, sw.z, sw, sw.tail);
        if (sw.armed && sw.exc > 0.16) { sw.armed = false; ctx.water.ripple(sw.x, sw.z, 0.12, 0.3); } else if (sw.exc < 0.05) sw.armed = true;
      }
      // (THE BAR HUNG UPSIDE DOWN until the third pass: its rest turn in the file is 159 degrees about the vertical, which
      // three.js reads back as the angles (180, 21, 180), and `rotation.z = a little` threw the 180 away: it stood up from
      // its bolt like a flagstaff. A part with a rest turn of its own is swung from that rest, about its own axis.)
      if (made.door) made.door.parts.bar.quaternion.copy(barRest).multiply(_qs.setFromAxisAngle(Z_AXIS, 0.012 * Math.sin(t * 0.83) + 0.006 * Math.sin(t * 2.1 + 1) + swings[0].exc * 0.05 * Math.sin(t * 2.9 + 0.7)));
      if (made.gap) made.gap.parts.gate.rotation.y = 0.008 * Math.sin(t * 0.47) + 0.004 * Math.sin(t * 1.3 + 2) + swings[1].exc * 0.034 * Math.sin(t * 0.9 + 1.1);
      // posts, legs and piers: a soft ring of their own when the wake arrives
      for (const f of feet) {
        if (Math.abs(f.x - b.x) > 14 || Math.abs(f.z - b.z) > 14) { f.exc *= Math.exp(-dt / 2); continue; }
        wakeAt(f.x, f.z, f, 2);
        if (f.armed && f.exc > 0.16) { f.armed = false; ctx.water.ripple(f.x, f.z, f.s, f.r); if (f.knock) ctx.audio.play('knock', { x: f.x, z: f.z, gain: f.knock.gain, pitch: f.knock.pitch }); } else if (f.exc < 0.05) f.armed = true;
      }
      // THE HANGING BASKETS KNOCK ON THEIR RUNGS (the page). A basket hangs from its hook on the ladder's underside and
      // its wall leans against the rung below (that is its rest tilt). A wake that reaches the ladder's foot jolts it:
      // the basket hops a few degrees OFF the rung, away from the ladder, falls back against it with a dry tap, bounces
      // once, smaller, and is still. While a wake lasts it does so again every second and a half.
      // (It was a free pendulum about its rest until the third pass: driven near its own period it swung fifteen degrees
      // both ways, and on the way toward the ladder it passed THROUGH the rungs and a stile: orchard_h3_x_basket_strip.)
      for (const h of hung) {
        wakeAt(h.at.x, h.at.z, h, 1.2);
        const sg = Math.sign(h.rest) || 1;                                     // the way that is away from the ladder
        if (h.exc > 0.2 && h.phi === 0 && h.vel === 0 && t > h.next) { h.next = t + 1.25 + 0.4 * ((h.i * 0.37 + 0.2) % 1); h.vel = sg * Math.min(0.8, 0.3 + 0.55 * h.exc); h.taps = 0; }
        if (h.phi !== 0 || h.vel !== 0) {
          h.vel += (-21.8 * (h.phi + sg * 0.14) - 0.55 * h.vel) * dt; h.phi += h.vel * dt;      // its weight brings it back to the rung
          if (h.phi * sg <= 0) {                                               // against the rung again
            const v = Math.abs(h.vel);
            if (v > 0.25 && h.taps < 2) { ctx.audio.play('knock', { x: h.at.x, z: h.at.z, gain: Math.min(0.35, 0.45 * v) }); h.taps++; }
            h.phi = 0; h.vel = v > 0.22 ? sg * v * 0.3 : 0;
          }
          baskets.place(h.i, { position: h.at, rotation: [h.rest + h.phi, h.yaw, 0] });
        }
      }
    },
  };
}
