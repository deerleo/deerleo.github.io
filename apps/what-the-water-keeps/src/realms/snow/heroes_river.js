// The orchard in snow: the river's hero pieces (stage 2, group "River"). docs/art/snow.md sections 3 and 9; the log,
// with every piece's pictures, is docs/build/snow/2-heroes-river.md.
//
//   cliff_icefall   the cliff the cave comes out of: rock SHARED; rime, the three icefalls and the lip's icicles WINTER
//   the cave's winter: frozen seep on the last 8 m of both walls, a tongue of blown snow on the ledges from s 18 (WINTER)
//   bridge          the plank bridge at s 46: timber SHARED (in the water it has no snow on it)
//   bridge_snow     the snow on it, the icicles under it, the ice collars on its piles (WINTER)
//
// The models are made by the scripts in source-art/models/snow/ and live in assets/models/snow/. The stand-ins they
// replace are made in heroes_b.js and set.js, which are other people's: they are taken out from here once the real
// thing stands (removeStandIn), and their lines are deleted later.
//
// For those who bring the area to life (cast, staging): shared.river
//   .bridge        the bridge's model ({ group, point(name) }). Named points: hook (where a lantern's ring would rest on
//                  the empty hook), sift_1..3 (the widest gaps between planks: where powder sifts through), under_mid
//                  (the beams' underside over the middle of the river), pile_Lu / pile_Ld / pile_Ru / pile_Rd (where the
//                  four river piles stand in the water: a pan's knock)
//
// Developer switches: &rvprobe=1 writes the land's heights where these pieces stand to .shots/snow_rv_probe.json;
// &keepstand=1 leaves the stand-ins standing beside the models; &rvgrain=0 shows timber as plain vertex paint;
// &rvcrisp=0 puts the thin timber back in the painter's filter; &rvrock=<hex> the rock's tint; &rvair= how much of the
// fog the cliff takes (0.4); &rvhaze= the haze with height (0.22); &rvdeep= what is left of the sky's light 6 m inside the
// mouth (0.3); &rvdrums=0 the rock without its wash, drums and joints; &rvflutes=0 the ice without its streaks.
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';

const Q = new URLSearchParams(location.search);
const DIR = 'models/snow/';

// TIMBER, WORKED: the flood orchard's way (src/realms/orchard/heroes_b.js, copied so that the two orchards' timber is one
// family and this module does not hang on that file). Vertex paint cannot draw grain on a board, which has points only
// at its corners: every timber carries in its UVs where a place lies along and across its own grain, in metres
// (source-art/models/orchard/orch.py, grain_uv: u > 0.5 means timber), and this draws what forty winters leave: the
// figure of the grain as long bands, checks, a knot now and then with the grain parting round it.
const TIMBER_PARS = `float tbH(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float tbN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(tbH(i), tbH(i + vec2(1.0, 0.0)), f.x), mix(tbH(i + vec2(0.0, 1.0)), tbH(i + vec2(1.0, 1.0)), f.x), f.y); }`;
const TIMBER = { fragmentPars: TIMBER_PARS, albedo: `{
    vec2 tg = vUv0;
    if (tg.x > 0.5) {
      vec2 tcell = vec2(0.9, 0.25), tci = floor(tg / tcell), tcf = tg / tcell - tci;
      float tHas = step(0.7, tbH(tci + 7.7));
      vec2 tkd = (tcf - vec2(0.3 + 0.4 * tbH(tci + 1.3), 0.36 + 0.28 * tbH(tci + 4.1))) * tcell;
      float tkr = 0.011 + 0.014 * tbH(tci + 9.2), tke = length(vec2(tkd.x * 0.45, tkd.y)) / tkr;
      float tKnot = tHas * (1.0 - smoothstep(0.5, 1.0, tke));
      tg.y -= tkd.y * 0.72 * tHas * (1.0 - smoothstep(0.9, 2.2, tke));
      float ty = tg.y + (tbN(vec2(tg.x * 0.8, tg.y * 4.0)) - 0.5) * 0.03;
      float tFig = 0.5 * tbN(vec2(tg.x * 0.22, ty * 24.0)) + 0.32 * tbN(vec2(tg.x * 0.55 + 5.0, ty * 66.0)) + 0.18 * tbN(vec2(tg.x * 1.7 + 9.0, ty * 190.0));
      albedo *= mix(vec3(0.62, 0.60, 0.64), vec3(1.22, 1.21, 1.22), smoothstep(0.30, 0.70, tFig));
      float tCk = tbN(vec2(tg.x * 0.9 + 31.0, ty * 120.0)) * (0.5 + 0.5 * tbN(vec2(tg.x * 0.3 + 3.0, ty * 9.0)));
      albedo *= 1.0 - 0.6 * smoothstep(0.66, 0.76, tCk);
      albedo = mix(albedo, albedo * vec3(0.40, 0.36, 0.39), tKnot);
    } }` };

export async function build(ctx, plan, shared) {
  const { kit } = ctx, F = shared.frame, land = shared.land, L = shared.light;
  const keep = Q.has('keepstand');
  const river = shared.river = {};

  // &rvprobe=1 (developer): what the land does where the bridge and the cliff stand
  if (Q.has('rvprobe') && land) {
    const B = plan.bridge, out = { zFace: shared.zFace, xFace: land.xFace, bridge: [], cliffFoot: [], cave: [] };
    for (const s of [B.s - 1.5, B.s, B.s + 1.5]) for (let d = -17; d <= 17.01; d += 0.5) {
      const p = F.at(s, d, 0), side = d < 0 ? -1 : 1, xe = land.waterEdge(side, p.z), o = (p.x - xe) * side;
      out.bridge.push([s, +d.toFixed(1), +p.x.toFixed(2), +p.z.toFixed(2), +o.toFixed(2), o >= 0 ? +land.snowHeight(p.x, p.z, o, side).toFixed(2) : null]);
    }
    for (let x = -40; x <= 40.01; x += 2) for (const dz of [-6, -3, -1, 0, 1, 3, 6, 12]) {
      const px = land.xFace + x, pz = shared.zFace + dz, side = x < 0 ? -1 : 1, xe = land.waterEdge(side, pz), o = (px - xe) * side;
      out.cliffFoot.push([x, dz, +xe.toFixed(2), +o.toFixed(2), o >= 0 ? +land.snowHeight(px, pz, o, side).toFixed(2) : null]);
    }
    const tmp = {};
    for (let s = 10; s <= 30; s += 1) { const a = ctx.path.at(s, tmp); out.cave.push([s, +a.x.toFixed(3), +a.z.toFixed(3), +a.tx.toFixed(4), +a.tz.toFixed(4), +plan.band(s).toFixed(2)]); }
    fetch('/__shot/snow_rv_probe.json', { method: 'POST', body: JSON.stringify(out) }).catch(() => {});
  }

  // ---- the area's paint on a model: the hour of the dusk on everything the water shows (light.js, `dusk`); timber
  // worked along its grain; thin timber and iron (posts, rails, braces, the hook) kept out of the painter's filter,
  // which wipes out anything thinner than its brush
  const grain = Q.get('rvgrain') === '0' ? null : TIMBER;
  // SILVERED WOOD IN LAMPLIGHT (the flood orchard found it): the bow lantern is a strong amber, and grey timber within
  // its reach comes out the orange-brown of new pine. Timber keeps three fifths of the lantern's hue and gives the
  // rest back as plain light: old grey wood, warmed. (After the lighting: `lamps` is what the lantern and the kept
  // lamp gave; the material has already added albedo * lamps.)
  const lampCool = { light: '{ vec3 rvLamp = albedo * lamps; c += mix(vec3(dot(rvLamp, vec3(0.3, 0.55, 0.15))), rvLamp, 0.6) - rvLamp; }' };
  const TIMBER_PAINT = { extend: [grain, L.dusk, lampCool], brush: 0.85 };
  const THIN = Q.get('rvcrisp') === '0' ? {} : { crisp: true };

  const M = shared.mat;
  const winter = (o) => ctx.only(o, 'direct');
  /** Give a model's slots materials of the area's own (instead of the ones kit.model made for it). */
  const wear = (model, bySlot) => {
    const made = new Set(Object.values(model.materials));
    model.group.traverse((o) => { if (o.isMesh && bySlot[o.userData.slot || 'paint']) o.material = bySlot[o.userData.slot || 'paint']; });
    for (const m of made) m.dispose();
  };
  // ---- icicles (WINTER, instanced: assets/models/snow/icicle_a.glb is one, icicle_b.glb two grown together; each is a
  // metre long and is scaled to its place). list: [{ at: Vector3 (where it hangs from), len, girth }]. An icicle is
  // thinner than the painter's brush: crisp.
  const ICE_PAINT = { brush: 0.3, steps: 4, ...THIN };
  const icicles = async (list, seed) => {
    const rnd = ctx.rng(seed), sets = { a: [], b: [] };
    for (const it of list) {
      const g = (0.022 + 0.07 * it.len) / 0.11 * (it.girth || 1), twin = it.len > 0.16 && rnd() < 0.3;
      sets[twin ? 'b' : 'a'].push({ position: [it.at.x, it.at.y + 0.01, it.at.z], rotation: [(rnd() - 0.5) * 0.1, rnd() * 6.283, (rnd() - 0.5) * 0.1], scale: [g, it.len, g] });
    }
    const out = [];
    for (const k of ['a', 'b']) if (sets[k].length) { const m = await kit.models(DIR + `icicle_${k}.glb`, sets[k], ICE_PAINT); winter(m.group); out.push(m); }
    return out;
  };

  // ================================================================================================ the plank bridge
  // One span of 22 m square across the river at s 46 (the page). The model is made in the page's own directions:
  // +X = d, its front (-Y in Blender) looks back up the river at the arriving boat; so it stands at the page's (46, 0)
  // turned by the path's heading there and nothing else.
  {
    const B = plan.bridge;
    const bridge = await kit.model(DIR + 'bridge.glb', { position: F.at(B.s, 0, 0), rotation: [0, F.heading(B.s), 0], ...TIMBER_PAINT, materials: { thin: THIN } });
    river.bridge = bridge;
    // the four piles that stand in the water: the boat steers round them (a pile's own radius and a hand more)
    for (const name of ['pile_Lu', 'pile_Ld', 'pile_Ru', 'pile_Rd']) { const p = bridge.point(name); ctx.addCollider({ x: p.x, z: p.z, r: 0.45 }); }
    if (!keep) removeStandIn(ctx, 'bridge (shared)');

    // ---- bridge_snow (WINTER): 0.15 m on the deck, 0.2 m on the rails, a line on every lath and brace, and the ice
    // collars round the four river piles. One file with two slots: the snow wears the area's own snow paint
    // (shared.mat.snowPaint, whatever the light's holder makes of it) and the collars its ice.
    const snow = await kit.model(DIR + 'bridge_snow.glb', { position: F.at(B.s, 0, 0), rotation: [0, F.heading(B.s), 0] });
    wear(snow, { paint: M.snowPaint, ice: M.ice });
    winter(snow.group);
    river.bridgeSnow = snow;
    // ---- the icicles under it (WINTER; instanced): they hang from the snow's lip along the plank ends, from the beams
    // and one from the empty hook, longest where the deck sags and the day's melt gathers. Places: the snow model's
    // named points; lengths: bridge.json, written by the same script.
    const info = await fetch('assets/' + DIR + 'bridge.json').then((r) => r.json()).catch(() => ({ icicles: {} }));
    const hang = Object.entries(info.icicles || {}).map(([name, [len, girth]]) => ({ at: snow.point(name), len, girth }));
    river.bridgeIcicles = await icicles(hang, 46);
    if (!keep) removeStandIn(ctx, 'bridge_snow');
  }

  // ================================================================================================ the cliff and the cave's mouth
  // `cliff_icefall`: the face at s 26, 70 m wide and 34 m high, grown from the sea's column unit; its face lies in the
  // plane z = shared.zFace and looks down the river. The model's own axes are the realm's about (xFace, 0, zFace), so
  // it is placed there with no turn. Rock SHARED (the water shows a dark cliff with no ice on it); the snow on every
  // top and at its foot, the three icefalls and the icicles (the lip's fringe, the brow's, the falls' own) WINTER. The
  // cave's winter (frozen seep, the tongue of blown snow on the ledges inside the mouth) is a file of its own in the
  // same place.
  {
    const at = [land.xFace, 0, shared.zFace];
    const info = await fetch('assets/' + DIR + 'cliff.json').then((r) => r.json()).catch(() => ({ icicles: {} }));
    if (info.frame && (Math.abs(info.frame.xFace - land.xFace) > 0.15 || Math.abs(info.frame.zFace - shared.zFace) > 0.15))
      console.error(`INVALID_PLAN snow/heroes_river: the cliff was modelled for a face at (${info.frame.xFace}, ${info.frame.zFace}) and the path now puts it at (${land.xFace.toFixed(2)}, ${shared.zFace.toFixed(2)}): write the frame again (&rvprobe=1) and rerun source-art/models/snow/cliff_icefall.py`);
    const uFace = { value: new THREE.Vector2(land.xFace, shared.zFace) };
    // WHAT THE AIR DOES TO THE CLIFF (rock and ice alike). Inside the rock there is no bright air: what stands behind
    // the face takes a tenth of the fog, or from the river the door is a pale tunnel. And the snowfall thickens with
    // height: the top of the cliff goes up into it (the page: "a dark cliff fading into the snowfall").
    // (FOURTH HOLDER: TWO THINGS MORE, both seen from inside the cave at s 11. (1) THE VEIL IS FOG. A tenth of the fog was
    // a tenth of the veil: coming in from the sea the ice and the roof stood bright in front of a world still dark.
    // Whatever the air spares, the veil takes whole (uRvVeil is the engine's own veil amount). (2) IT IS DARK IN A CAVE.
    // The snow light reached in as far as the model goes: the hanging ends were lit as if they stood outdoors. What the
    // sky gives falls away with depth into the rock, to three tenths 6 m in; the lantern's light does not.)
    const AIR = { uniforms: { uRvFace: uFace, uRvVeil: ctx.engine.shared.uVeil }, fragmentPars: 'uniform vec2 uRvFace; uniform float uRvVeil;',
      light: `{ float rvDeep = smoothstep(uRvFace.y + 0.5, uRvFace.y + 6.5, vWPos.z) * (1.0 - smoothstep(10.0, 13.5, vWPos.y)) * (1.0 - smoothstep(10.5, 13.0, abs(vWPos.x - uRvFace.x)));
                // (fifth holder: and an eye that stands OUTSIDE in the snow light sees less still of what is inside: from the river the
                // ice and the hanging ends go down into the door's dark with their depth; from inside they are as they were)
                float rvOutEye = smoothstep(0.5, 6.5, uRvFace.y - uCameraPos.z);
                vec3 rvLit = albedo * lamps; c = (c - rvLit) * mix(1.0, mix(${(+(Q.get('rvdeep') || 0.3)).toFixed(3)}, 0.04, rvOutEye), rvDeep) + rvLit; }`,
      fog: `{ float rvIn = smoothstep(uRvFace.y - 0.4, uRvFace.y + 2.4, vWPos.z) * (1.0 - smoothstep(10.0, 13.5, vWPos.y)) * (1.0 - smoothstep(10.5, 13.0, abs(vWPos.x - uRvFace.x)));
              fog *= mix(mix(${(+(Q.get('rvair') || 0.4)).toFixed(3)}, 0.1, rvIn), 1.0, uRvVeil);
              fog = 1.0 - (1.0 - fog) * (1.0 - ${(+(Q.get('rvhaze') || 0.22)).toFixed(3)} * smoothstep(10.0, 36.0, vWPos.y) * (1.0 - rvIn)); }` };
    // THE ROCK'S PAINT. The sea's kit paints basalt at a mid value (its form can then be read on a sheet) and the ride
    // tints it down: `color` here. The model's own paint carries its RANKS (the front rank ink, each rank behind it a
    // tone paler: a cliff laid in with washes), lichen, and the shade where columns crowd. Here:
    //   - DRUMS. Vertex paint cannot draw a joint on a shaft that has points only at its two ends, so on plain shafts
    //     (the model marks them: u < 1.5) the drums are drawn by height: every column stacked of drums of its own
    //     length (its own number is in u), each drum a tone of its own, an open joint between them.
    //   - ORGAN PIPES. The snow light has no direction: every upright face takes the same light, and a wall of columns
    //     is one flat tone. So (1) every face is a rib (v runs across it): ink at its two arrises, where it meets the
    //     next face or the next column; (2) the light LEANS, as the area's snow has it (the brighter quarter is down
    //     the river and to the left): of a column's three faces that look at the river one is a tone lighter and one
    //     a tone darker, and it is seen to be a prism; (3) every column is a tone of its own.
    // (FOURTH HOLDER: AN INK WASH, COLUMN BY COLUMN. As found the wall was one flat lilac sheet ruled with faint
    // lines: a tone a column of fourteen parts in a hundred, a lean of a third, and joints a twelfth of a face wide,
    // which at 26 m are under a pixel and which the painter's filter wipes out. What the filter and the river's thick
    // air leave standing is a whole FACE (20 pixels) and a whole COLUMN (40). So: every column is laid in at a
    // strength of its own, as a brush loaded once for each (most at the wash's own strength, one in five wet and near
    // ink, one in seven dry and pale); of the faces a column shows the river, the one turned up the left bank is a
    // tone and a half lighter than the one turned to the right, so that a column is a prism from 60 m; a joint is
    // never drawn thinner than a pixel and a half; the wall is wet and near ink at the water and dries upward; and
    // long stains of melt run down it from the ledges.)
    const ROCK = { fragmentPars: `float rvRh(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
        float rvRn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(rvRh(i), rvRh(i + vec2(1.0, 0.0)), f.x), mix(rvRh(i + vec2(0.0, 1.0)), rvRh(i + vec2(1.0, 1.0)), f.x), f.y); }`,
      albedo: `if (abs(N.y) < 0.6) {
        float rvSeed = fract(vUv0.x), rvT1 = fract(rvSeed * 13.7), rvT2 = fract(rvSeed * 71.3);
        if (vUv0.x < 1.5) {
          float rvLen = mix(1.3, 3.4, fract(rvSeed * 7.31));
          float rvH = (vWPos.y + rvSeed * 37.0) / rvLen, rvK = floor(rvH), rvF = fract(rvH);
          float rvTone = fract(sin(rvK * 12.9898 + rvSeed * 78.233) * 43758.5453);
          albedo *= 0.84 + 0.32 * rvTone;
          float rvJw = max(0.07, 1.5 * fwidth(vWPos.y)) / rvLen;
          albedo *= 1.0 - 0.42 * (1.0 - smoothstep(0.0, rvJw, min(rvF, 1.0 - rvF))) * step(0.4, fract(rvTone * 5.3));
        }
        float rvAcross = min(vUv0.y, 1.0 - vUv0.y);
        albedo *= mix(0.3, 1.0, smoothstep(0.0, max(0.1, 1.5 * fwidth(vUv0.y)), rvAcross));
        albedo *= mix(0.86, 1.0, smoothstep(0.1, 0.5, rvAcross));
        vec2 rvN = normalize(N.xz + vec2(1e-5));
        albedo *= 1.0 - 0.42 * rvN.x + 0.12 * max(-rvN.y, 0.0);
        albedo *= mix(0.62, 1.2, rvT1) * mix(1.0, 0.5, step(0.8, rvT2)) * mix(1.0, 1.32, step(rvT2, 0.14));
        albedo *= mix(0.5, 1.0, smoothstep(0.3, 8.0, vWPos.y)) * mix(1.0, 1.16, smoothstep(9.0, 30.0, vWPos.y));
        float rvStain = rvRn(vec2(vWPos.x * 0.55 + vWPos.z * 0.3, vWPos.y * 0.045)) * 0.65 + rvRn(vec2(vWPos.x * 1.7, vWPos.y * 0.11 + 9.0)) * 0.35;
        albedo *= mix(0.66, 1.08, smoothstep(0.32, 0.62, rvStain));
      } else if (N.y < -0.6) albedo *= 0.6;
      // (inside the mouth the ledge's stumps are rimed from the water up: a corner of bare basalt that comes through the
      // ice at the ledge's foot was a black arrow in the white, 3 m from the eye, and read as a hole)
      // (the stumps only: they are plain shafts, u under 1.5. A jamb, which is one of the sea's columns, rimed to a metre was a pale bar standing in the water at the door's corner)
      { float rvRime = smoothstep(uRvFace.y + 0.3, uRvFace.y + 1.1, vWPos.z) * (1.0 - smoothstep(0.8, 1.2, vWPos.y)) * smoothstep(-0.4, 0.0, vWPos.y) * step(vUv0.x, 1.5);
        // (rime is WINTER and the rock is SHARED: the water shows the ledge bare and dark, uSnowDusk is 1 only in the direct view)
        float rvDirect = step(0.99, uSnowDusk);
        albedo = mix(albedo * mix(0.3, 1.0, max(rvDirect, 1.0 - rvRime)), vec3(0.78, 0.8, 0.9), 0.92 * rvRime * rvDirect); }` };
    const rock = await kit.model(DIR + 'cliff_icefall.glb', { position: at, color: Q.get('rvrock') ? '#' + Q.get('rvrock') : '#c4bcda', flat: true, brush: 0.7,
      extend: [Q.get('rvdrums') === '0' ? null : ROCK, AIR, L.dusk] });
    river.cliff = rock;
    // ICE that is more than a rim (the icefalls, the seep): frost blue paint; the long streaks down every flute are
    // drawn here (paint has points only every half metre); a paler edge all round its silhouette, as ice has where
    // the light comes through it; seen from both sides (a curtain that hangs clear of the rock is a skin).
    // (FIFTH HOLDER: ICE IS PAINTED IN ITS OWN TONES, AS THEY ARE TO BE SEEN. Laid in as blue paint under the area's
    // light, every groove and every flank multiplied the blue again, and in the cave's dim the whole of it was one
    // saturated periwinkle: plastic. Ice is the page's COLD WHITE (chip 2, frost #D6DDEF): so everything the model and
    // the lines below say about a place (its own paint, the pipe's tone, the groove, the streaks, how far it turns
    // from the eye) is gathered into ONE number, rvIceT, and that is laid through a ramp of four seen colours: frost
    // white on a pipe's back, a cold blue-white, lavender-blue in the grooves, a deep blue only in the deepest
    // hollows and where it stands in the water. What looks up carries settled snow. The lantern then warms it.)
    const seenC = shared.seen || ((h) => new THREE.Color(h));
    const hexQ = (k, d) => (/^[0-9a-fA-F]{6}$/.test(Q.get(k) || '') ? '#' + Q.get(k) : d);
    const uIce = { uIceLit: { value: seenC(hexQ('icelit', '#E4E9F6')) }, uIceMid: { value: seenC(hexQ('icemid', '#C3CCE8')) }, uIceDeep: { value: seenC(hexQ('icedeep', '#98A3CE')) },
      uIceDark: { value: seenC(hexQ('icedark', '#6C78AC')) }, uIceSnow: { value: seenC('#EEEAEE') } };
    const ICE = { uniforms: uIce, fragmentPars: `uniform vec3 uIceLit, uIceMid, uIceDeep, uIceDark, uIceSnow; float rvIceT;
        float rvIh(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
        float rvIn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(rvIh(i), rvIh(i + vec2(1.0, 0.0)), f.x), mix(rvIh(i + vec2(0.0, 1.0)), rvIh(i + vec2(1.0, 1.0)), f.x), f.y); }`,
      light: `{ rvIceT = clamp((dot(albedo, vec3(0.3, 0.5, 0.2)) - ${(+(Q.get('icet0') || 0.07)).toFixed(3)}) / ${(+(Q.get('icet1') || 0.5)).toFixed(3)} + stroke * 0.04, 0.0, 1.0);
          vec3 rvTone = mix(uIceDark, uIceDeep, smoothstep(0.0, 0.3, rvIceT));
          rvTone = mix(rvTone, uIceMid, smoothstep(0.3, 0.62, rvIceT));
          rvTone = mix(rvTone, uIceLit, smoothstep(0.62, 0.95, rvIceT));
          rvTone = mix(rvTone, uIceSnow, 0.85 * smoothstep(0.5, 0.86, N.y) * (1.0 - step(1.5, vUv0.x)));                                      // snow has settled on what looks up (not on bare clear ice at the water: the model marks it, u = 2)
          rvTone *= mix(1.0, 0.8, smoothstep(0.25, 0.9, -N.y));                                                   // and what looks down is in its own shade
          albedo = vec3(0.26, 0.36, 0.6);                                                                         // (what a lamp finds: ice gives a flame's light back cold and white, where snow beside it goes to peach)
          c = rvTone + albedo * lamps; }`,
      // (the model marks its flutes in the UVs: u = 0 in the groove between two pipes, 1 on a pipe's back; v = the pipe's own tone)
      albedo: `{ float rvA = dot(vWPos.xz, vec2(0.94, 0.34));
          float rvS = rvIn2(vec2(rvA * 9.0, vWPos.y * 0.5)) * 0.6 + rvIn2(vec2(rvA * 23.0 + 7.0, vWPos.y * 1.1)) * 0.4;
          float rvSteep = 1.0 - smoothstep(0.45, 0.8, abs(N.y));                                                  // (streaks run down what stands: a plate on the water has none)
          albedo *= 1.0 + rvSteep * (0.32 * smoothstep(0.2, 0.8, rvS) - 0.16);                                    // streaks down every pipe
          albedo *= 1.0 + rvSteep * (0.12 * smoothstep(0.3, 0.7, rvIn2(vec2(rvA * 1.3 + 3.0, vWPos.y * 2.6))) - 0.06);   // where it swelled and thinned as it grew
          albedo = mix(albedo, vec3(0.84, 0.86, 0.93), 0.3 * rvSteep * smoothstep(0.64, 0.8, rvIn2(vec2(rvA * 31.0 + 11.0, vWPos.y * 0.8))));   // threads of white frost
          albedo *= mix(vec3(0.5, 0.53, 0.76), vec3(1.06), smoothstep(0.08, 0.72, vUv0.x)) * mix(vec3(0.66, 0.7, 0.9), vec3(1.08), vUv0.y);      // (fourth holder: deeper and bluer in every groove, and a wider step from pipe to pipe: at 26 m a fall was one pale sheet)
          // A PIPE IS ROUND. The snow light has no direction, so a rank of pipes is one flat tone: every pipe is turned
          // as a painter turns a cylinder, deeper and bluer toward its two edges, whichever way it is looked at.
          float rvTurn = abs(dot(N, normalize(uCameraPos - vWPos)));
          albedo *= mix(vec3(0.6, 0.63, 0.82), vec3(1.0), smoothstep(${(+(Q.get('rvt0') || 0.3)).toFixed(2)}, ${(+(Q.get('rvt1') || 0.92)).toFixed(2)}, rvTurn)); }` };
    // ICE HOLDS A LAMP'S LIGHT (fifth holder; the page, moment s 0: "frozen seep ... and a tongue of snow on the ledges
    // catch the lantern"). After the cave's dark has been laid (AIR): within the bow lantern's reach the edges of ice
    // that turn from the eye take its light as if it came through them. Rock and snow do not: it is what tells ice
    // from snow in the dark.
    const ICE_LAMP = { light: `{ vec3 rvLd = uLanternPos - vWPos; float rvLr = length(rvLd), rvAtt = 1.0 - smoothstep(uLanternRadius * 0.2, uLanternRadius * 1.25, rvLr); rvAtt *= rvAtt;
          float rvEdge = 1.0 - abs(dot(N, V));
          c += uLanternColor * rvAtt * ${(+(Q.get('icelamp') || 0.5)).toFixed(3)} * (0.2 + rvEdge * rvEdge) * vec3(0.92, 0.96, 1.0); }` };
    const iceFall = shared.paint({ color: '#ffffff', vertexColors: true, brush: 0.35, steps: 4, side: THREE.DoubleSide,
      extend: [Q.get('rvflutes') === '0' ? null : ICE, AIR, ICE_LAMP] });
    const snowHigh = shared.paint({ color: '#ffffff', vertexColors: true, brush: 0.35, steps: 4, extend: [L.lift, AIR] });      // the area's snow, in the cliff's own air: it goes up into the snowfall with the rock it lies on
    const frost = await kit.model(DIR + 'cliff_icefall_winter.glb', { position: at });
    wear(frost, { paint: snowHigh, ice: iceFall });
    winter(frost.group);
    river.cliffWinter = frost;
    const cave = await kit.model(DIR + 'cave_winter.glb', { position: at });
    // (fourth holder: the drift's skin is seen from both sides. Where the ledge's rim steps from one stump to the next the
    // drift's lip folds over itself, and with one side drawn the fold was a black arrow-shaped hole in the white, 3 m
    // from the eye. The area's snow paint, in a copy that draws both sides.)
    const snowSkin = shared.paint({ color: '#ffffff', vertexColors: true, brush: 0.35, steps: 4, side: THREE.DoubleSide, extend: [L.lift, AIR] });
    wear(cave, { paint: snowSkin, ice: iceFall });
    winter(cave.group);
    river.caveWinter = cave;
    // the icicles (WINTER, instanced, one set for all of them): the fringe on the cave's lip, 0.4 to 2.2 m, hanging
    // from the broken ends of the columns over the cave; those under the snow's lip along the brow; those hung from
    // every rim of the three icefalls; and in the cave the seep's own and the points of what never reached the water
    const hang = Object.entries(info.icicles || {}).map(([name, [len, girth]]) => ({ at: frost.point(name), len, girth }));
    for (const [name, [len, girth]] of Object.entries(info.seep || {})) hang.push({ at: cave.point(name), len, girth });
    river.lipIcicles = await icicles(hang, 26);
    // the fall at the door's right corner stands in the water: the hull is eased off its skirt (shallows, not a wall)
    if (info.skirt_b) ctx.addCollider({ x: land.xFace + info.skirt_b.x, z: shared.zFace - info.skirt_b.y, r: info.skirt_b.r, soft: true });
    if (!keep) { removeStandIn(ctx, /^cliff_icefall/); removeStandIn(ctx, 'cave seep and blown snow'); }

    // ---- THE DARK OF THE DOOR (fifth holder). The page, postcard 2: "the cave a black door at its foot". Seen from the
    // river, what stood inside the mouth was the cave's stand-in (set.js: a smooth tube, lit by the snow light as if it
    // stood outdoors) with a hard-edged black shape in it (the dark plane that closes its far end): a pale tunnel
    // with a hole in it. An eye that stands in snow light cannot see into a cave: so the cave's own dark hangs across
    // it, 6.7 m inside the rock (behind this module's hanging ends, ledges and seep, which stay to be seen), a sheet
    // of the veil's colour that looks only toward the river and is the darker the further OUTSIDE the eye stands:
    // nothing at the lip, all of it from 6.5 m out. From inside the cave it is not there at all. (Not below the water:
    // the water writes no depth, and a sheet under it would be drawn over it.) &rvdoor=0 takes it out.
    if (Q.get('rvdoor') !== '0') {
      const S = ctx.engine.shared, sIn = plan.cliff.s - 6.7, a = ctx.path.at(sIn), p = F.at(sIn, 0, 0);
      const geo = new THREE.PlaneGeometry(21, 13.4); geo.translate(0, 6.7, 0);
      const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.FrontSide,
        uniforms: { uDark: { value: new THREE.Color(plan.light.veil) }, uFaceZ: { value: shared.zFace }, uFogColor: S.uFogColor, uFogDensity: S.uFogDensity },
        vertexShader: 'varying float vDist; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = length(mv.xyz); gl_Position = projectionMatrix * mv; }',
        fragmentShader: `uniform vec3 uDark, uFogColor; uniform float uFogDensity, uFaceZ; varying float vDist;
          void main() { float rvOut = uFaceZ - cameraPosition.z;
            float rvFog = 0.1 * (1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist));
            gl_FragColor = vec4(mix(uDark, uFogColor, rvFog), ${(+(Q.get('rvdoor') || 1)).toFixed(3)} * smoothstep(0.5, 6.5, rvOut)); }` });
      const dark = new THREE.Mesh(geo, mat);
      dark.position.set(p.x, 0.0, p.z); dark.lookAt(p.x + a.tx, 0.0, p.z + a.tz); dark.name = 'the dark of the door'; dark.renderOrder = 1;
      ctx.add(dark);
      river.doorDark = dark;
    }
  }

  return {};
}
