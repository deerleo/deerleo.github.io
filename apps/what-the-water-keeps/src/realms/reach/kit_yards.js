// The dyers' reach: THE DYE YARDS (stage 2, the kit and the close band). Page: docs/art/reach.md, sections 3 ("Close
// band"), 9 ("Kit pieces") and the director's note to this stage: the yards are where the colour runs into the river.
// Log: docs/build/reach/2-kit-yards.md. Models: source-art/models/reach/ (dy.py is their library), assets/models/reach/.
//
//   vats and pans      40 vats in four variants and the causeway's seven pans (vats.glb), each with its zone's dye
//                      standing in it and run down its stone
//   terrace walls      lengths of wall facing the land's three risers on both banks, stairs, the causeway's apron, a
//                      pier where the wall turns a sharp corner (walls.glb): tide marks in the place's two dyes, weeps
//   spouts             26 half-log troughs on forked posts (spouts.glb), each placed by its lip; a stain under each
//   racks and hanks    14 skein racks and the hanks on their poles (racks.glb): the hanks swing in the reach's wind
//   the launder        a plank trough on 23 trestles along the right bank (launder.glb)
//   props              what the dyers left and what the river left (props.glb), each put where it would have been
//   washes             dye soaked into what it lies on (steps, copings, wall faces): one blended mesh laid over the
//                      picture as a glaze: round every vat, from the vats to the edge and down the walls, under every
//                      spout, down every stair, along the copings, over the causeway (see "washes" below)
//
// HOW THE YARDS ARE DRAWN. Every piece is a named part of a family file (vats.glb holds vat_a .. vat_d and pan). The
// ride does not instance them one kind at a time: copies of the parts are MERGED, zone by zone along the route, into a
// handful of meshes that all wear one material (`yard`): one draw call for everything of the yards within sixty metres
// of route on one bank, whatever its kind, and a zone out of sight is not drawn. Nothing here moves as a body; what
// sways (hanks, weed) does so in the vertex shader by a weight baked into the merged mesh.
//
// THE DYE. A model's paint is its stone and timber. How much dye lies on each point is in its UVs (dy.py: u = the copy's
// own dye, v up to 0.5 = half the amount of its second dye, v = 1 a standing liquid), and each copy brings its two dyes
// (the merged mesh's `aDye`, `aDye2`), so one file gives a saffron vat and a crimson one. The paint's alpha says what a
// thing is made of (stone, timber): the reach's painted `timber` tiles are laid on it from three sides.
//
// shared (for the cast and staging; docs/build/reach/2-kit-yards.md says what each holds):
//   shared.vats, shared.spills, shared.spouts (pour and land of every one), shared.racks, shared.hankDrips,
//   shared.launder, shared.yards = { counts, land(s, side, out, y), level(s, side, out), toWater(s, side, out) }
// Stand-ins taken out here (they are made in kit.js): 'vats and pans', 'spouts', 'skein racks', 'hanks', 'launder',
//   'props', 'mud nests'.
// Switches: &only=set,kit_yards the yards alone; &yardtex=0 no painted texture; &counts=1 -> .shots/reach_ky_counts.json
//   (what stands, triangles by kind); &yardmark=0 no water's marks; &yardrun=0 no painted runs; &wash=0 no washes;
//   &yardlight=1 the lighter yards (far vats and walls everywhere but at the water: for low quality and for engineering)
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';

const QS = new URLSearchParams(location.search);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ZONE = 60;                                                    // metres of route to one merged mesh

export async function build(ctx, plan, shared) {
  const { kit, path } = ctx, Y = plan.yards;
  if (!shared.reach || !shared.reach.bank) { console.warn('reach/kit_yards: the land (set.js) is not built: the yards stand on it and are left out'); return {}; }
  const rnd = ctx.rng(4217);
  // THE LIGHTER YARDS (for the engineering stage, and for low quality): &yardlight=1, or a quality whose density is under
  // 0.75. Every vat is the far variant (a third of the triangles), the walls between the first and second steps are the
  // far lengths (a half), and the third step's walls are left to the land's own painted risers. From the boat's water
  // the first wall, the stairs, the racks and every prop are as they were. Measured: 251,000 triangles against 284,000.
  // (&yardlight=0 forces the full yards.)
  const LIGHT = QS.has('yardlight') ? QS.get('yardlight') !== '0' : ((ctx.quality && ctx.quality.density) || 1) < 0.75;
  const bankOf = shared.reach.bank, hw = (s) => kit.halfWidth(s);
  const stainHex = Y.stain;
  // THE OTHER DYE a cloth, a hank or a fold of a stack may take instead of its place's own. In the nave it is the
  // place's second dye (the route table gives each stretch two). In the lagoon the second dye is the OTHER BANK'S
  // (indigo on the left bank, madder and crimson on the right: the page's zoning; it belongs in the river's marks on
  // a wall, not in a blue hank on the red bank): there a thing takes its neighbour on the dyer's scale instead.
  const near = (dye) => { const D = plan.dye; return dye === D.CRIMSON ? D.MADDER : dye === D.MADDER ? D.CRIMSON : dye === D.VIOLET ? D.INDIGO : dye === D.INDIGO ? D.VIOLET : dye; };      // (the sixth look: a pile of folded cloth is one dye, or that and its neighbour of nearly the same depth: never lemon folds in a red pile, a striped toy)
  const other = (s, dye, second) => (s < 92 || s >= 204 ? second : dye === plan.dye.CRIMSON ? plan.dye.MADDER : dye === plan.dye.MADDER ? plan.dye.CRIMSON : dye);
  const bytes = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };      // a dye as it is typed (the shader takes it to linear light)
  // DIPPED TWICE (the fourth look): a hank or a cloth whose lower part went into a second bath takes the next dye DOWN
  // the dyer's scale, as the page's cloths do (the wheel's gores: "a gore never goes back up the scale"), and only
  // dyes the route already shows there: cream into saffron in the first bays, saffron into madder from bay 3, madder
  // into crimson on the red bank, violet into indigo on the terraces; on the indigo bank nothing is dipped twice.
  const dipPair = (s, side) => { const D = plan.dye; return s < 48 ? [D.CREAM, D.SAFFRON] : s < 70 ? [D.SAFFRON, D.MADDER] : s >= 204 ? [D.VIOLET, D.INDIGO] : side > 0 ? [D.MADDER, D.CRIMSON] : null; };

  // ================================================================================================ places on the banks
  // A place on a bank, laid exactly as the land is laid (set.js, `ribbon`): out metres outside the channel's edge; far
  // from the water the land follows the broad sweep of the waterway, and so must everything that stands on it.
  const _P = {}, _Q = {};
  const land = (s, side, out, y = 0, target = new THREE.Vector3()) => {
    const sc = Math.min(path.length, Math.max(0, s)), p = path.at(sc, _P), over = s - sc;
    let ax = p.rx, az = p.rz;
    if (out > 6) {
      let sx = 0, sz = 0;
      for (let j = -4; j <= 4; j++) { const q = path.at(Math.min(path.length, Math.max(0, sc + out * 1.5 * j / 4)), _Q); sx += q.rx; sz += q.rz; }
      const l = Math.hypot(sx, sz) || 1, k = smooth(6, 30, out);
      ax = lerp(p.rx, sx / l, k); az = lerp(p.rz, sz / l, k);
    }
    return target.set(p.x + p.tx * over + side * (p.rx * p.halfWidth + ax * out), y, p.z + p.tz * over + side * (p.rz * p.halfWidth + az * out));
  };
  /** The height of the step that `out` falls on (the ford's water where it is short of the first riser). */
  const level = (s, side, out) => { const b = bankOf(side, side < 0 ? Math.min(s, 139) : s); return out > b.out[2] ? b.y[2] : out > b.out[1] ? b.y[1] : out > b.out[0] ? b.y[0] : 0; };
  /** rotation.y that turns a model's front (+Z) to the water from a place on a bank. */
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  const toWater = (s, side, out) => { land(s, side, out, 0, _a); land(s, side, Math.max(0, out - 1), 0, _b); return Math.atan2(_b.x - _a.x, _b.z - _a.z); };

  // ================================================================================================ the batch
  const families = {};
  /** A family file: its named parts' geometry and its named points (in the model's own ride axes). */
  const family = async (name) => {
    if (families[name]) return families[name];
    const m = await kit.model(`models/reach/${name}.glb`, { position: [0, 0, 0] });
    ctx.group.remove(m.group);                                      // never drawn as it is: only read
    for (const k in m.materials) m.materials[k].dispose();
    m.group.updateMatrixWorld(true);
    const parts = {}, points = {};
    m.group.traverse((o) => { if (o.isMesh && o.name !== name) parts[o.name] = { geo: o.geometry, matrix: o.matrixWorld.clone() }; });
    for (const k in m.points) points[k] = new THREE.Vector3().setFromMatrixPosition(m.points[k].matrixWorld);
    return (families[name] = { parts, points });
  };
  const zones = new Map();                                          // key -> [{ geo, matrix, tint, dye, sway }]
  const triBy = {};                                                 // triangles stood, by kind of part (for &counts=1)
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), WHITE = new THREE.Color(1, 1, 1);
  /**
   * Stand a copy of a part. o: { position: Vector3 (the realm's own), s (for its zone), turn (rotation.y), lean: [x, z]
   * radians, scale: number | [x, y, z], tint: colour over its paint, dye and dye2: 0..5 on the dyer's scale or a colour
   * (its own dye and a second: a wall's upper tide mark is the other bank's), raw: true (a hank: its paint's green and
   * blue are where a point lies in it, not colour: the tint falls on the red alone), sway: { top, length, amount } (a hanging
   * thing: it swings below `top` in its own space) or { up: true, base, length, amount } (a growing thing: above `base`) }.
   * Returns the copy's matrix (for its named points).
   */
  const put = (fam, part, o) => {
    const src = fam.parts[part];
    if (!src) { console.error(`INVALID_MODEL reach/kit_yards: no part "${part}"`); return null; }
    const sc = o.scale == null ? 1 : o.scale;
    if (typeof sc === 'number') _s.setScalar(sc); else _s.set(sc[0], sc[1], sc[2]);
    _q.setFromEuler(_e.set(o.lean ? o.lean[0] : 0, o.turn || 0, o.lean ? o.lean[1] : 0, 'YXZ'));
    const matrix = new THREE.Matrix4().compose(o.position, _q, _s).multiply(src.matrix);
    const key = (o.side < 0 ? 'L' : 'R') + Math.floor(Math.max(0, o.s) / ZONE);
    if (!zones.has(key)) zones.set(key, []);
    const dyeOf = (d) => (d == null ? null : typeof d === 'number' ? stainHex[d] : d);
    const d1 = dyeOf(o.dye) || '#ffffff';
    { const fam0 = part.split('_')[0], t3 = (src.geo.index ? src.geo.index.count : src.geo.attributes.position.count) / 3; triBy[fam0] = (triBy[fam0] || 0) + t3; }
    zones.get(key).push({ geo: src.geo, matrix, tint: o.tint ? new THREE.Color(o.tint) : WHITE, dye: bytes(d1), dye2: bytes(dyeOf(o.dye2) || d1), sway: o.sway || null, raw: !!o.raw, phase: ((ph) => (o.sway ? ph : (o.mark === false ? 0 : 255)))(Math.floor(rnd() * 256)) });      // (phase: a swaying thing's own; for anything else: whether it takes the water's marks)
    return matrix;
  };

  // the material everything of the yards wears: the area's solid paint (set.js), with the dye laid on
  const wind = shared.wind;
  // (the painted textures: source-art/reach/timber.png cut in four; this module made them: the log says how)
  const texOpt = QS.get('yardtex');                                 // &yardtex=0: the paint alone
  let tStone = null, tOak = null, tCloth = null;
  if (texOpt !== '0') { try { [tStone, tOak] = await Promise.all([ctx.tex('art/reach/timber_stone.webp', { repeat: true }), ctx.tex('art/reach/timber_oak.webp', { repeat: true })]); } catch (e) { tStone = tOak = null; console.error('reach/kit_yards: the timber textures did not load: ' + e); }
    // (THE SIXTH LOOK: the cloth-maker's own weave, for the yards' cloths: red = slub silk, blue = the dyer's mottle: kit.js, "THE PAINTED CLOTH")
    try { tCloth = await ctx.tex('art/reach/cloth.webp', { data: true, repeat: true }); } catch (e) { tCloth = null; console.error('reach/kit_yards: the cloth weave did not load: ' + e); } }
  // ---- WET (the fifth look). The reach is "backlit, drenched, turning", and nothing of the yards was wet: dye standing in
  // a pan was a dark patch, a step awash a pink wedge. A wet thing takes the sky: seen square on it is only darker; seen
  // aslant (a pan's liquor from the boat, a wet flag, the foot of a wall looked along) it shows the haze at the horizon,
  // the mauve above, and the sun's glow where the eye looks toward the sun across it. Soft and broad, never a sparkle,
  // and always under the bloom's threshold (the page: the water alone glitters, and only on the sun's path).
  const YARD_SKY = { value: new THREE.Color(plan.sky.start.mid) }, skyA = new THREE.Color(plan.sky.start.mid), skyB = new THREE.Color(plan.sky.end.mid);
  const YARD_WET = { value: new THREE.Vector4(QS.has('yardwet') ? +QS.get('yardwet') : 1, 1, QS.has('washsky') ? +QS.get('washsky') : 0.18, 0) };      // (z: how much of the sky a wash takes: &washsky=1 as the fifth look had it)
  const WET_GLSL = /* glsl */`uniform vec3 uYardSky; uniform vec4 uYardWet; float gYardWet;
      ${shared.sun ? 'vec3 yardKey(vec3 p) { return reachKey(p, uKeyColor); }' : 'vec3 yardKey(vec3 p) { return uKeyColor; }'}
      // what a wet face shows of the sky along the mirrored line of sight R
      vec3 yardSkyAt(vec3 R, vec3 sunC) {
        float upw = clamp(R.y, 0.0, 1.0), sd = max(dot(R, -uKeyDir), 0.0);
        vec3 sky = mix(uFogColor * 1.08, uYardSky, smoothstep(0.04, 0.5, upw));
        float s2 = sd * sd, s8 = s2 * s2 * s2 * s2;
        return sky + sunC * (0.16 * s8 + 0.42 * s8 * s8 * s8 * s8) * uYardWet.y;       // the glow round the sun, and nearer it the gold
      }
      // c: the lit colour; N: the face; k: how wet (0..1). Returns c with the sky laid on by the angle it is seen at.
      vec3 yardSheen(vec3 c, vec3 Nn, vec3 Vv, float k, vec3 sunC) {
        float F = 0.03 + 0.97 * pow(1.0 - clamp(dot(Nn, Vv), 0.0, 1.0), 5.0);
        vec3 sk = min(yardSkyAt(reflect(-Vv, Nn), sunC), vec3(0.86));
        return mix(c, sk * 0.94, clamp(F * k, 0.0, 0.9) * uYardWet.x);
      }`;
  const dyeExt = {
    // uYardTex: stone repeats per metre, oak repeats per metre, the stone's strength, the whole thing's strength
    // uYardMark: the water's marks (their strength; their height, 1 = as the plan has them), the painted runs' strength
    uniforms: { ...(wind ? wind.uniforms : {}), tYardStone: { value: tStone }, tYardOak: { value: tOak }, tYardCloth: { value: tCloth }, uYardCloth: { value: tCloth ? 1 : 0 }, uYardTex: { value: new THREE.Vector4(1 / 2.4, 1 / 1.7, 0.8, tStone && tOak ? (texOpt ? +texOpt : 0.7) : 0) },
      uYardMark: { value: new THREE.Vector4(QS.has('yardmark') ? +QS.get('yardmark') : 1, 1, QS.has('yardrun') ? +QS.get('yardrun') : 0.6, 0) },
      // THE FIFTH LOOK: WET. uYardSky: the sky a wet thing shows above the haze (the plan's sky, by the evening: set in update);
      // uYardWet: how strongly wet things take the sky (&yardwet=0: the yards dry, as they were), how much of the sun's glow
      uYardSky: YARD_SKY, uYardWet: YARD_WET },
    // aDye: the copy's own dye (rgb as typed) and, in w, how far this point swings in the wind; aDye2: its second dye
    // aCol: the point's paint (times its copy's tint), as bytes; its alpha says what the thing is made of (dy.py, `kind`:
    // 1 nothing in particular, 0.6 stone, 0.2 timber), for the painted texture laid on it
    // (vYRest: where a point is before it swings: a swaying thing's strands are fixed to it, not to the air it swings through)
    vertexPars: /* glsl */`attribute vec4 aCol; attribute vec4 aDye; attribute vec4 aDye2; varying vec4 vCol; varying vec3 vDye; varying vec3 vDye2; varying float vMark; varying vec3 vYRest; varying vec2 vYarn;
      uniform sampler2D tRipple; uniform vec4 uRippleRect; ${wind ? wind.glsl : 'uniform vec4 uLifeWind; uniform vec4 uLifeWindB; float lifeBreeze(vec2 p) { return 1.0; } float lifeFront(vec2 p) { return 0.0; }'}`,
    // (vYarn: on a hank the paint's green and blue are not colour: where the point lies ROUND the hank and how far DOWN it: racks.py)
    vertexLocal: 'vCol = vec4(pow(aCol.rgb, vec3(2.2)), aCol.a); vDye = pow(aDye.rgb, vec3(2.2)); vDye2 = pow(aDye2.rgb, vec3(2.2)); vMark = aDye2.w; vYarn = aCol.gb;',
    // what hangs (aDye.w: how far down it this point is) swings in the reach's one wind, and is thrown out by a front;
    // aDye2.w is the copy's own phase, so no two hanks swing together
    // THE THIRD LOOK: what stands or trails IN THE WATER (weed, the end of a wrung cloth, a rag on a lodged bough) answers the
    // water and not the wind: a slow stream, and the hull's wake when it arrives (the ripple field's own slope: it leans
    // with each wavelet that passes and shivers after the boat has gone by)
    vertexWorld: /* glsl */`vYRest = wp.xyz;
    if (aDye.w > 0.001) {
      float sw = aDye.w, br = lifeBreeze(wp.xz), fr = lifeFront(wp.xz), tt = uLifeWind.w, ph = aDye2.w * 6.2832;
      float wet = 1.0 - smoothstep(0.03, 0.3, wp.y), dry = 1.0 - wet;
      float swing = (0.05 * br + 0.022 * br * sin(tt * 1.15 + ph) + 0.3 * fr * (0.85 + 0.15 * sin(tt * 2.3 + ph))) * uLifeWindB.z * dry;      // wet yarn is heavy: a gust swings it a third of the way out
      wp.xz += uLifeWind.xy * (swing * sw * sw * 1.3) + vec2(-uLifeWind.y, uLifeWind.x) * (0.022 * sin(tt * 0.83 + ph * 1.7) * sw * uLifeWindB.z);
      wp.y += 0.1 * fr * sw * sw * uLifeWindB.z * dry;
      if (wet > 0.0) {
        vec2 ruv = (wp.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
        vec4 rip = (ruv.x > 0.0 && ruv.x < 1.0 && ruv.y > 0.0 && ruv.y < 1.0) ? texture2D(tRipple, ruv) : vec4(0.0);
        vec2 lean = clamp(rip.xy, -1.0, 1.0) * 0.3 + vec2(sin(tt * 0.9 + ph), cos(tt * 0.63 + ph * 1.3)) * 0.035;
        wp.xz += lean * (wet * sw * uLifeWindB.z);
      }
    }`,
    // ---- THE DYE, as the picture shows it (the second look: 2-kit-yards.md). Three ways dye comes to lie on a thing:
    //   (a) LAID ON in the model (the UVs: u = how much of the copy's first dye, v up to 0.5 = half the amount of its
    //       second, v = 1 a standing liquid). Where the amount is neither none nor all a noise decides, so that a
    //       stain's edge is never a ruled line, and a stain is thin here and thick there;
    //   (b) THE WATER'S MARKS, by height above the water, on everything of stone or timber that stands in it: three
    //       levels the river has stood at, each a wash below its line and darkest AT its line, where the dye dried;
    //       the line wicks upward in fingers, wanders along the route, and the two older marks are missing for
    //       stretches. Lowest the copy's own dye, highest its second, between them both (the page's order on each
    //       bank). Below them the stone is wet and dark, and at the very water green;
    //   (c) THE PAINTED STAINS of the reach's `timber` sheet (dressed stone with runs of red and blue): its light
    //       and dark is laid on stone from three sides, and its red runs are shown in the copy's first dye, its blue
    //       runs in the second: so a saffron bay has saffron runs and the lagoon's left bank indigo and madder ones.
    // On stone and timber a dye is a GLAZE (the ground shows through, darker and tinted) that thickens to the dye's own
    // body; on anything else (cloth, yarn, liquid) the paint under it is read as a grey: mid grey = the dye as it is.
    fragmentPars: /* glsl */`varying vec4 vCol; varying vec3 vDye; varying vec3 vDye2; varying float vMark; varying vec3 vYRest; varying vec2 vYarn; float gYarnKeep; uniform sampler2D tYardStone, tYardOak, tYardCloth; uniform float uYardCloth; uniform vec4 uYardTex; uniform vec4 uYardMark;
      ${WET_GLSL}
      float yH(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
      float yN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(yH(i), yH(i + vec2(1.0, 0.0)), f.x), mix(yH(i + vec2(0.0, 1.0)), yH(i + vec2(1.0, 1.0)), f.x), f.y); }
      vec3 yDye(vec3 ground, vec3 dye, float a) {
        float g = pow(max(dot(ground, vec3(0.3333)), 1e-4), 0.4545);
        vec3 tint = dye / max(max(dye.r, max(dye.g, dye.b)), 1e-3);
        vec3 glaze = ground * (0.25 + 0.95 * tint), body = dye * (1.7 * g);
        return mix(ground, mix(glaze, body, 0.05 + 0.3 * a), a);
      }`,
    albedo: /* glsl */`albedo *= vCol.rgb; gYardWet = 0.0; gYarnKeep = 0.0;
      { float kind = vCol.a, up = abs(N.y), h = vWPos.y;
        bool liquid = vUv0.y > 0.75, ground = kind < 0.8 && !liquid, isStone = kind > 0.4, yarn = kind > 0.84 && kind < 0.96, wicker = kind > 0.27 && kind < 0.39;
        // (a hank is a soft mass of threads: it takes the light as one, lit or shaded by where the eye stands to the sun,
        // not split down each side like a turned rod: its normal is rounded off toward the eye)
        if (yarn) N = normalize(mix(N, normalize(uCameraPos - vWPos), 0.3));
        // (THE SIXTH LOOK: and so is a wet cloth. The sun rakes ALONG the walls: the far flank of every fold of a cloth hung
        // over one fell into the ramp's full shadow, flat and hard-edged: three brown slashes in a saffron cloth, like tears
        // with the wall in them. The cloth-maker's bolts in the same light have soft ribs: half the way to the eye.)
        else if (!ground && !liquid && vUv0.x + vUv0.y * 2.0 > 0.5) N = normalize(mix(N, normalize(uCameraPos - vWPos), 0.5));
        // where a point is on its own face: along it and up it (on a level face: where it lies)
        // (the fourth look: on anything ROUND the along-the-face measure jumps from facet to facet, and every edge of a
        // stain on a trough or a post was a fringe of fur. Timber is round: it is measured along one fixed line instead)
        vec2 fq = up > 0.7 ? vWPos.xz : isStone ? vec2(dot(vWPos.xz, normalize(vec2(N.z, -N.x) + 1e-5)), h) : vec2((vWPos.x + vWPos.z) * 0.7071, h);
        // (the fourth look: the fingers a mark wicks up in were 4 cm apart and sharp: at two metres every tide mark ended
        // upward in a seismograph's trace. Broad slow tongues a hand or two wide, with a little of the fine among them)
        float fing = up > 0.7 ? yN(fq * 6.0) * 0.6 + yN(fq * 15.0 + 2.0) * 0.4 : yN(fq * vec2(3.6, 1.1)) * 0.74 + yN(fq * vec2(13.0, 2.4) + 7.3) * 0.26;
        float n3 = yN(fq * 0.9 + 3.1);
        float runR = 0.0, runB = 0.0;
        if (ground && uYardTex.w > 0.0) {
          if (isStone) {
            vec3 tx = tri(tYardStone, vWPos * uYardTex.x, N) / vec3(0.381, 0.1275, 0.150);
            albedo *= clamp(mix(1.0, dot(tx, vec3(0.3333)), uYardTex.z * uYardTex.w), 0.45, 1.7);
            runB = clamp((tx.b - tx.r - 0.15) * 1.6, 0.0, 1.0); runR = clamp((tx.r - tx.g - 0.12) * 1.6 - runB, 0.0, 1.0);
          } else if (wicker) {
            // (the fifth look: a basket is WOVEN: rows of withies two fingers high lapped over and under upright stakes a hand
            // apart, each row the other way: the dark is where a withy goes behind its stake)
            float rw = h * 24.0, ia = (vWPos.x + vWPos.z) * 0.7071 * 10.0 + floor(rw) * 0.5;
            float wv = sin(fract(rw) * 3.1416) * (0.5 + 0.5 * sin(ia * 6.2832));
            albedo *= 0.56 + 0.7 * wv;
          } else {
            vec3 tx = tri(tYardOak, vWPos * uYardTex.y, N) / vec3(0.179, 0.054, 0.086);
            albedo *= clamp(mix(vec3(1.0), mix(vec3(dot(tx, vec3(0.3333))), tx, 0.45), uYardTex.w), 0.3, 2.0);
          }
        }
        if (ground) {
          // (c) the painted runs, in the place's own two dyes; they come and go along the route
          float gate = smoothstep(0.45, 0.75, yN(vec2(fq.x * 0.21, 4.7))), gate2 = smoothstep(0.5, 0.8, yN(vec2(fq.x * 0.17, 13.1)));
          float lvlK = 1.0 - 0.75 * smoothstep(0.5, 0.9, up);               // (the fifth look: on a level face the tile's stains are cloud blotches: a quarter there)
          albedo = yDye(albedo, vDye, runR * (0.08 + 0.92 * gate) * uYardMark.z * lvlK);
          albedo = yDye(albedo, vDye2, runB * (0.05 + 0.95 * gate2) * uYardMark.z * lvlK);
          // (b) the water's marks
          if (h < 1.05 && uYardMark.x > 0.0 && vMark > 0.5) {
            float along = fq.x, lift = uYardMark.y;
            float e1 = (0.17 + 0.07 * yN(vec2(along * 0.13, 1.7))) * lift + 0.07 * (fing - 0.5);
            float e2 = (0.36 + 0.09 * yN(vec2(along * 0.09, 9.3))) * lift + 0.08 * (fing - 0.5);
            float e3 = (0.56 + 0.12 * yN(vec2(along * 0.06, 21.7))) * lift + 0.10 * (fing - 0.5);
            float p2 = smoothstep(0.2, 0.42, yN(vec2(along * 0.045, 31.0))), p3 = smoothstep(0.3, 0.55, yN(vec2(along * 0.037, 57.0)));
            float flatTop = mix(1.0, 0.4, smoothstep(0.35, 0.9, up));                 // (a top takes less of a mark than a face: it is walked dry)
            float a3 = (1.0 - smoothstep(e3 - 0.022, e3 + 0.022, h)) * p3 * (0.16 + 0.42 * exp(-max(e3 - h, 0.0) / 0.05));
            float a2 = (1.0 - smoothstep(e2 - 0.022, e2 + 0.022, h)) * p2 * (0.2 + 0.42 * exp(-max(e2 - h, 0.0) / 0.05));
            float a1 = (1.0 - smoothstep(e1 - 0.022, e1 + 0.022, h)) * (0.26 + 0.44 * exp(-max(e1 - h, 0.0) / 0.05));
            float under = smoothstep(-0.45, -0.05, h);                              // (under the water the marks are lost in weed)
            albedo = yDye(albedo, vDye2, a3 * flatTop * under * uYardMark.x);
            albedo = yDye(albedo, 0.5 * (vDye + vDye2), a2 * flatTop * under * uYardMark.x);
            albedo = yDye(albedo, vDye, a1 * flatTop * under * uYardMark.x);
            // (the fifth look: what the river licks is WET: darker for a hand and a half above the water, in tongues, and it
            // takes the sky where it is seen aslant: see the light hook below)
            float wet = 1.0 - smoothstep(0.03, 0.2 + 0.16 * fing, h);
            albedo *= mix(1.0, 0.6, wet * uYardMark.x);
            gYardWet = wet * smoothstep(-0.12, 0.0, h);
            float slime = (1.0 - smoothstep(-0.02, 0.05 + 0.06 * fing, h)) * smoothstep(-0.6, -0.1, h);
            albedo = mix(albedo, vec3(0.042, 0.07, 0.028) * (0.6 + 0.8 * n3), 0.42 * slime * uYardMark.x);
          }
        }
        // (a) what was laid on in the model
        float d1 = clamp(vUv0.x, 0.0, 1.0), d2 = liquid ? 0.0 : clamp(vUv0.y * 2.0, 0.0, 1.0);
        if (d1 + d2 > 0.002) {
          float nz = up > 0.7 ? yN(fq * 7.0) * 0.55 + yN(fq * 19.0 + 4.0) * 0.45 : yN(fq * vec2(13.0, 2.6)) * 0.55 + yN(fq * vec2(31.0, 6.0) + 4.0) * 0.45;
          if (ground) {
            d1 = smoothstep(0.3, 0.7, d1 + (nz - 0.5) * 4.8 * d1 * (1.0 - d1)) * (0.4 + 0.6 * d1); d2 = smoothstep(0.3, 0.7, d2 + (nz - 0.5) * 4.8 * d2 * (1.0 - d2)) * (0.4 + 0.6 * d2);
            float dt = d1 + d2;
            if (dt > 0.002) albedo = yDye(albedo, (vDye * d1 + vDye2 * d2) / dt, min(dt, 1.0) * (0.7 + 0.3 * n3));
          } else if (yarn) {
            // THE SIXTH LOOK: YARN IS THREADS. Five hanks were one smooth form each and read as felt, tongues, socks. A hank
            // carries WHERE EACH POINT LIES ROUND IT (vYarn.x: 0 at one side, 1 at the other) and how far down it (vYarn.y):
            // the threads are laid by those, so they spread where the hank spreads on its pole, gather where it is gathered,
            // wind where it was wrung and turn under with it at the foot. LOCKS (five across, no two a width, each its own
            // tone, dark between) are seen from across the nave; STRANDS (three or four to a lock, each wandering) inside
            // eight metres, where the painter's filter is told to leave most of them (gYarnKeep: threads are thin things).
            // Both fade before they are finer than the picture can draw.
            float dt = d1 + d2, g = pow(max(vCol.r, 1e-4), 0.4545);              // (its shade is the paint's red alone)
            float yu = vYarn.x, yf = vYarn.y, dc = distance(uCameraPos, vWPos), sd = vMark * 61.0;
            vec3 rp = vYRest;
            float take = yN(vec2(rp.x + rp.z, rp.y) * 2.7 + 11.0) * 0.6 + yN(vec2(rp.x - rp.z, rp.y) * 6.1) * 0.4;
            float uw = yu + 0.07 * (yN(vec2(yu * 4.0 + sd, yf * 2.6 + sd)) - 0.5) + 0.04 * (yN(vec2(yu * 11.0 + sd * 2.0, yf * 13.0)) - 0.5), fwU = fwidth(yu);      // (yarn is kinked: no thread runs ruled)
            float cL = uw * 5.0 + sd, pL = fract(cL), iL = floor(cL);
            float lockTone = yH(vec2(iL, sd + 1.7));
            float lockGap = smoothstep(0.0, 0.16, pL) * (1.0 - smoothstep(0.84, 1.0, pL));
            float cS = uw * 17.0 + sd * 3.0 + 0.3 * (yN(vec2(iL * 3.1 + sd, yf * 8.0)) - 0.5), pS = fract(cS), iS = floor(cS);
            float strandTone = yH(vec2(iS, sd + 5.3));
            float strandGap = smoothstep(0.0, 0.32, pS) * (1.0 - smoothstep(0.68, 1.0, pS));
            float nearS = (1.0 - smoothstep(4.5, 8.0, dc)) * (1.0 - smoothstep(0.3, 0.62, fwU * 17.0));
            float nearL = (1.0 - smoothstep(12.0, 24.0, dc)) * (1.0 - smoothstep(0.3, 0.62, fwU * 5.0));
            float fib = (1.0 + 0.5 * (lockTone - 0.5) * nearL) * mix(1.0, 0.5 + 0.5 * lockGap, nearL) * mix(1.0, (0.66 + 0.34 * strandGap) * (0.78 + 0.44 * strandTone), nearS) * (1.0 + 0.3 * (take - 0.5));
            vec3 dyeC = (vDye * d1 + vDye2 * d2) / dt;
            vec3 dyeDeep = dyeC * dyeC / max(max(dyeC.r, max(dyeC.g, dyeC.b)), 1e-3);
            float sh2 = 2.0 * g * fib;
            albedo = mix(albedo, mix(dyeDeep, dyeC, smoothstep(0.26, 0.72, sh2)) * sh2, min(dt, 1.0));
            gYarnKeep = 0.5 * (1.0 - smoothstep(5.0, 9.0, dc));
          } else {
            // YARN AND CLOTH (the third look: a dyed thing was one flat tone, a cut-out beside the cloth-maker's bolts).
            // Strands run down the hang: two sets of upright sheets through the thing, so that whichever way a face
            // looks some of them cross it; finer threads among them near the eye; and the dye taken unevenly, in clouds.
            // All fixed to the thing's own place (vYRest), so that nothing swims when it swings.
            float dt = d1 + d2, g = pow(max(dot(albedo, vec3(0.3333)), 1e-4), 0.4545);
            vec3 rp = vYRest; float dc = distance(uCameraPos, vWPos);
            float st = yN(vec2(rp.x * 19.0 + rp.z * 8.0, rp.y * 0.9)) * 0.5 + yN(vec2(rp.z * 19.0 - rp.x * 8.0, rp.y * 0.9 + 5.0)) * 0.5;
            float fine = yN(vec2(rp.x * 64.0 + rp.z * 27.0, rp.y * 2.4)) * 0.5 + yN(vec2(rp.z * 64.0 - rp.x * 27.0, rp.y * 2.4 + 3.0)) * 0.5;
            float take = yN(vec2(rp.x + rp.z, rp.y) * 2.7 + 11.0) * 0.6 + yN(vec2(rp.x - rp.z, rp.y) * 6.1) * 0.4;
            st = smoothstep(0.28, 0.72, st); fine = smoothstep(0.3, 0.7, fine);
            float fib = 1.0 + 0.5 * (st - 0.5) * (1.0 - smoothstep(12.0, 28.0, dc)) + 0.3 * (fine - 0.5) * (1.0 - smoothstep(4.0, 9.0, dc)) + 0.36 * (take - 0.5);
            // THE SIXTH LOOK: IT IS THE SAME CLOTH AS THE BOLTS. The cloth-maker's weave (raw silk: its slubs, a metre to a
            // repeat as on the bolts) and the dyer's mottle (3.6 m) are laid on every cloth of the yards, fixed to the cloth
            // itself: a cloth over the wall was a sheet of rubber beside the bolts drying over it.
            if (uYardCloth > 0.5) {
              float wvn = tri(tYardCloth, rp * 1.0, N).r / 0.62, mot = tri(tYardCloth, rp / 3.6 + 0.37, N).b / 0.62;
              fib *= mix(1.0, wvn, 0.95 * (1.0 - smoothstep(9.0, 20.0, dc))) * mix(1.0, mot, 0.6);
            }
            // THE FIFTH LOOK: THE SHADE OF DYED CLOTH IS DEEPER IN ITS OWN HUE, never greyer (the cloth-maker's ribs: a fold
            // of saffron is orange-red in its valley, of madder a dark pure red): the model's shade (2g: about 0.7 on a
            // crest, 0.3 in a valley) turns the dye toward its own square as it darkens it. Folds read from the boat.
            vec3 dyeC = (vDye * d1 + vDye2 * d2) / dt;
            vec3 dyeDeep = dyeC * dyeC / max(max(dyeC.r, max(dyeC.g, dyeC.b)), 1e-3);
            float sh2 = 2.0 * g * fib;
            albedo = mix(albedo, mix(dyeDeep, dyeC, smoothstep(0.26, 0.72, sh2)) * sh2, min(dt, 1.0));
          }
        }
      }`,
    // a standing liquid takes the colour of the haze where it is seen at a low angle
    // (THE FIFTH LOOK: it takes the SKY: the haze where it is seen aslant, the mauve above it, and the sun's glow where
    // the eye looks toward the sun across it: `yardSheen`. So does stone the river has wetted, more faintly.)
    light: /* glsl */`{ float lq = step(0.85, vUv0.y), wk = max(lq, gYardWet);
      // (the sixth look: liquor in a spout's trough, level with the eye, was all sky: a tongue of pale pink plastic. Above the
      // causeway's pans a standing liquid keeps most of its dye)
      if (wk > 0.01) c = yardSheen(c, lq > 0.5 ? vec3(0.0, 1.0, 0.0) : N, V, wk * mix(0.5, mix(0.62, 0.22, smoothstep(0.88, 1.0, vWPos.y)), lq), yardKey(vWPos)); }`,
    // (the painter's filter is told how much of a pixel to leave as drawn by the picture's alpha: 0.5 and above all of its
    // brush, -1.05 and below none: src/engine/post.js. Yarn near the eye keeps most of its threads.)
    final: 'if (gYarnKeep > 0.0) gl_FragColor.a = 0.5 - 1.55 * gYarnKeep;',
  };
  const material = kit.gouache({ color: '#ffffff', brush: 0.6,
    rim: { color: '#FFB878', strength: 0.22, power: 4.5, toward: 1 }, caustics: { intensity: 0.3, height: 0.8, scale: 0.4, color: '#FFD2A6' },
    extend: [shared.sun ? shared.sun.extend : null, dyeExt] });

  // ================================================================================================ washes
  // Dye that has SOAKED INTO what it lies on: slopped round a vat, carried dripping along a coping and down a stair,
  // run from a vat's foot to the terrace's edge, lying in the low places of the causeway. A wash is a few flat
  // triangles a finger above the ground with an amount of dye on each point; the material lays it as a GLAZE over
  // whatever is already in the picture there (the land's treads, the copings, a wall's face: it multiplies them by
  // the dye's tint, so stone stays stone, darker and coloured) and, where it lies thick, adds the dye's own body in
  // the place's light. Its edge is a noise's, never the triangles'. One mesh for all of them, one draw call.
  // (Nothing of it may lie below the water: the water is drawn before it and does not hide it.)
  const washes = { pos: [], uv: [], dye: [], dye2: [], nor: [], idx: [], n: 0 }, wrnd = ctx.rng(9133);      // (their own chance: adding a wash moves nothing else)
  const _wd = (d) => bytes((d == null ? null : typeof d === 'number' ? stainHex[d] : d) || '#ffffff');
  const washPoint = (x, y, z, a1, a2, d1, d2, nx = 0, ny = 1, nz = 0, wet = 1) => {
    washes.pos.push(x, y, z); washes.uv.push(clamp01(a1), clamp01(a2)); washes.dye.push(d1[0], d1[1], d1[2], Math.round(255 * clamp01(wet))); washes.dye2.push(d2[0], d2[1], d2[2], 255); washes.nor.push(nx, ny, nz);
    return washes.n++;
  };
  /** A patch on level ground: its middle at p (y = the ground), half sizes rx by rz turned by `turn`, `amount` of dye
   *  at its middle (0..1), in `dye` (and `second` of dye2: 0..1 of the amount). wet 0..1: how much it shines. */
  const washPatch = (p, rx, rz, turn, amount, dye, dye2 = null, second = 0, wet = 1) => {
    const n = 9 + Math.floor(wrnd() * 4), c = Math.cos(turn), s = Math.sin(turn), d1 = _wd(dye), d2 = _wd(dye2 == null ? dye : dye2), y = p.y + 0.016;
    const a1 = amount * (1 - second), a2 = amount * second;
    const mid = washPoint(p.x, y, p.z, a1, a2, d1, d2, 0, 1, 0, wet), inner = [], outer = [];
    for (let i = 0; i < n; i++) {
      const a = (i + wrnd() * 0.5) / n * Math.PI * 2, f = 0.72 + 0.56 * wrnd(), lx = Math.cos(a) * rx * f, lz = Math.sin(a) * rz * f, k = 0.5 + 0.2 * wrnd();
      inner.push(washPoint(p.x + (lx * c + lz * s) * k, y, p.z + (-lx * s + lz * c) * k, a1 * (0.65 + 0.3 * wrnd()), a2 * (0.65 + 0.3 * wrnd()), d1, d2, 0, 1, 0, wet));
      outer.push(washPoint(p.x + lx * c + lz * s, y, p.z - lx * s + lz * c, 0, 0, d1, d2, 0, 1, 0, wet));
    }
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; washes.idx.push(mid, inner[j], inner[i], inner[i], inner[j], outer[j], inner[i], outer[j], outer[i]); }
  };
  /** A wash along a line of points on the ground (a path worn along a coping, a run from a vat to the edge, a trail of
   *  drips): half width w (a number or a function of 0..1 along), amount (the same). up: the ground's normal (a wall's
   *  face for a stain that runs down it: then the points are on the face and the line runs down). */
  const washPath = (pts, w, amount, dye, dye2 = null, second = 0, up = null, wet = 1) => {
    const d1 = _wd(dye), d2 = _wd(dye2 == null ? dye : dye2), nx = up ? up.x : 0, ny = up ? up.y : 1, nz = up ? up.z : 0, lift = 0.016;
    let prev = null;
    for (let i = 0; i < pts.length; i++) {
      const t = pts.length > 1 ? i / (pts.length - 1) : 0, a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y, tz = b.z - a.z; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      // across the line, in the ground's own plane
      let sx = ty * nz - tz * ny, sy = tz * nx - tx * nz, sz = tx * ny - ty * nx; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
      const hw2 = (typeof w === 'function' ? w(t) : w) * (0.8 + 0.4 * wrnd()), am = (typeof amount === 'function' ? amount(t) : amount) * (0.75 + 0.25 * wrnd()), off = (wrnd() - 0.5) * hw2 * 0.5;
      const p = pts[i], px = p.x + nx * lift + sx * off, py = p.y + ny * lift + sy * off, pz = p.z + nz * lift + sz * off;
      const row = [washPoint(px - sx * hw2, py - sy * hw2, pz - sz * hw2, 0, 0, d1, d2, nx, ny, nz, wet), washPoint(px, py, pz, am * (1 - second), am * second, d1, d2, nx, ny, nz, wet), washPoint(px + sx * hw2, py + sy * hw2, pz + sz * hw2, 0, 0, d1, d2, nx, ny, nz, wet)];
      if (prev) washes.idx.push(prev[0], row[0], prev[1], prev[1], row[0], row[1], prev[1], row[1], prev[2], prev[2], row[1], row[2]);
      prev = row;
    }
  };
  const washExt = {
    uniforms: { uYardSky: YARD_SKY, uYardWet: YARD_WET },
    vertexPars: 'attribute vec4 aDye; attribute vec4 aDye2; varying vec3 vDye; varying vec3 vDye2; varying float vWet;',
    vertexLocal: 'vDye = pow(aDye.rgb, vec3(2.2)); vDye2 = pow(aDye2.rgb, vec3(2.2)); vWet = aDye.w;',
    fragmentPars: /* glsl */`varying vec3 vDye; varying vec3 vDye2; varying float vWet;
      ${WET_GLSL}
      float wH(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
      float wN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(wH(i), wH(i + vec2(1.0, 0.0)), f.x), mix(wH(i + vec2(0.0, 1.0)), wH(i + vec2(1.0, 1.0)), f.x), f.y); }`,
    // (the amounts are worked out before the light: `albedo` is left white, so that `c` is the place's light itself)
    albedo: /* glsl */`float wA1 = clamp(vUv0.x, 0.0, 1.0), wA2 = clamp(vUv0.y, 0.0, 1.0), wAt = wA1 + wA2;
      vec2 wq = abs(N.y) > 0.7 ? vWPos.xz : vec2(dot(vWPos.xz, normalize(vec2(N.z, -N.x) + 1e-5)) * 2.4, vWPos.y * 0.6);      // (down a wall the noise is drawn out: runs)
      float wNz = wN(wq * 3.3) * 0.5 + wN(wq * 9.0 + 4.0) * 0.3 + wN(wq * 25.0 + 9.0) * 0.2;
      float wCover = smoothstep(0.26, 0.56, wAt + (wNz - 0.5) * 0.85) * smoothstep(0.0, 0.08, wAt);
      float wCore = smoothstep(0.5, 0.92, wAt + (wNz - 0.5) * 0.5);
      float wEdge = wCover * (1.0 - smoothstep(0.56, 0.7, wAt + (wNz - 0.5) * 0.85));             // where it dried last: a darker line
      vec3 wDye = (vDye * wA1 + vDye2 * wA2) / max(wAt, 1e-3);
      float wAmt = wCover * (0.42 + 0.4 * wCore + 0.18 * wEdge) * smoothstep(0.1, 0.28, vWPos.y);
      albedo = vec3(1.0);`,
    final: /* glsl */`{ vec3 tint = wDye / max(max(wDye.r, max(wDye.g, wDye.b)), 1e-3);
      vec3 T = mix(vec3(1.0), 0.16 + 0.9 * tint, wAmt);
      float body = wAmt * wCore * 0.7 * min(dot(c, vec3(0.3333)), 1.3) * max(wDye.r, max(wDye.g, wDye.b));
      // (THE FIFTH LOOK: a wash that still stands wet takes the SKY where it is seen aslant, like every wet thing of the
      // yards. This pass can only multiply what is there by one colour and add that colour times a number: so the
      // colour leans from the dye's tint toward the sky's, and the number carries the sky's brightness.)
      // (THE SIXTH LOOK: at half its strength a wash seen aslant was a blot of WHITE PAINT: on every stair's treads, in a pale
      // strip behind every coping, at the foot of every spout's post. Nothing else of the yards shines: a stain is DYE first,
      // a darker wetter stone, and takes a breath of the sky only where it is thickest. A sixth of what it was.)
      float wF = min((0.03 + 0.97 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0)) * (0.25 + 0.75 * vWet) * wCover * (0.5 + 0.5 * wCore) * 0.6, 0.5) * uYardWet.x * uYardWet.z;
      vec3 wSky = min(yardSkyAt(reflect(-V, N), yardKey(vWPos)), vec3(0.86)) * 0.94;
      float wMag = max(wSky.r, max(wSky.g, wSky.b));
      T = mix(T, wSky / max(wMag, 1e-3) * 0.36, wF);
      body = mix(body, wMag / 0.36, wF);
      gl_FragColor = vec4(mix(T, vec3(1.0), fog), body * (1.0 - fog)); }`,
  };

  /** Merge every zone's copies into one mesh each. A point is 29 bytes: its place as floats, the rest as bytes. */
  const flush = () => {
    const v = new THREE.Vector3(), nm = new THREE.Matrix3(), enc = (c) => Math.round(255 * Math.pow(Math.min(1, Math.max(0, c)), 1 / 2.2));
    const encS = (c) => Math.round(255 * Math.min(1, Math.max(0, c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)));      // (a number as the model wrote it: a hank's green and blue)
    let tris = 0, meshes = 0, points = 0;
    for (const [key, list] of zones) {
      let nv = 0, ni = 0;
      for (const it of list) { nv += it.geo.attributes.position.count; ni += it.geo.index ? it.geo.index.count : it.geo.attributes.position.count; }
      const pos = new Float32Array(nv * 3), nor = new Int8Array(nv * 3), col = new Uint8Array(nv * 4), uv = new Uint8Array(nv * 2), dye = new Uint8Array(nv * 4), dye2 = new Uint8Array(nv * 4);
      const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
      let v0 = 0, i0 = 0;
      for (const it of list) {
        const g = it.geo, A = g.attributes, n = A.position.count, K = A.color, U = A.uv, sw = it.sway;
        nm.getNormalMatrix(it.matrix);
        for (let i = 0; i < n; i++) {
          const j = v0 + i;
          let weight = 0;
          if (sw) weight = (sw.up ? clamp01((A.position.getY(i) - sw.base) / sw.length) : clamp01((sw.top - A.position.getY(i)) / sw.length)) * sw.amount;
          v.fromBufferAttribute(A.position, i).applyMatrix4(it.matrix); pos[j * 3] = v.x; pos[j * 3 + 1] = v.y; pos[j * 3 + 2] = v.z;
          v.fromBufferAttribute(A.normal, i).applyMatrix3(nm).normalize(); nor[j * 3] = Math.round(v.x * 127); nor[j * 3 + 1] = Math.round(v.y * 127); nor[j * 3 + 2] = Math.round(v.z * 127);
          if (K) { col[j * 4] = enc(K.getX(i) * it.tint.r); if (it.raw) { col[j * 4 + 1] = encS(K.getY(i)); col[j * 4 + 2] = encS(K.getZ(i)); } else { col[j * 4 + 1] = enc(K.getY(i) * it.tint.g); col[j * 4 + 2] = enc(K.getZ(i) * it.tint.b); } col[j * 4 + 3] = K.itemSize > 3 ? Math.round(255 * K.getW(i)) : 255; }
          else { col[j * 4] = enc(it.tint.r); col[j * 4 + 1] = enc(it.tint.g); col[j * 4 + 2] = enc(it.tint.b); col[j * 4 + 3] = 255; }
          if (U) { uv[j * 2] = Math.round(255 * clamp01(U.getX(i))); uv[j * 2 + 1] = Math.round(255 * clamp01(U.getY(i))); }
          dye[j * 4] = it.dye[0]; dye[j * 4 + 1] = it.dye[1]; dye[j * 4 + 2] = it.dye[2]; dye[j * 4 + 3] = Math.round(weight * 255);
          dye2[j * 4] = it.dye2[0]; dye2[j * 4 + 1] = it.dye2[1]; dye2[j * 4 + 2] = it.dye2[2]; dye2[j * 4 + 3] = it.phase;
        }
        if (g.index) { const I = g.index; for (let i = 0; i < I.count; i++) idx[i0 + i] = I.getX(i) + v0; i0 += I.count; } else { for (let i = 0; i < n; i++) idx[i0 + i] = v0 + i; i0 += n; }
        v0 += n;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3, true));
      geo.setAttribute('aCol', new THREE.BufferAttribute(col, 4, true)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2, true));
      geo.setAttribute('aDye', new THREE.BufferAttribute(dye, 4, true)); geo.setAttribute('aDye2', new THREE.BufferAttribute(dye2, 4, true)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
      geo.computeBoundingSphere(); geo.computeBoundingBox();
      const mesh = new THREE.Mesh(geo, material);
      mesh.name = 'yard ' + key; mesh.matrixAutoUpdate = false;
      ctx.add(mesh);
      tris += ni / 3; meshes++; points += nv;
    }
    zones.clear();
    return { tris, meshes, points };
  };

  // ================================================================================================ vats and pans
  const counts = {};
  const tints = ['#ffffff', '#f4e9e0', '#fff3e6', '#ece2e2', '#f8ecdc'];      // no two neighbours quite the same stone
  const spills = [];                                                 // where a brim-full vat runs over: a thin fall for the cast
  const vats = [], stood = [];                                       // (stood: how each vat stands, for what is put down beside it)
  {
    const F = await family('vats');
    Y.vats.forEach(([s, side, out, across, dye], i) => {
      const y = level(s, side, out), p = land(s, side, out, y);
      const big = across > 2.7, part = big ? ((i * 7 + 3) % 5 < 3 ? 'vat_a' : 'vat_b') : (i % 2 ? 'vat_c' : 'vat_d');
      const k = across / (big ? 3 : 2.4) * (0.95 + 0.1 * rnd());
      // its front (the notch, the heaviest run, the lid stood against it) looks at the water, give or take
      const turn = toWater(s, side, out) + (rnd() - 0.5) * 1.5;
      // (a vat of the second or third step is 13 m and more from any eye: the same vat in a third of the triangles; its named points are the near one's)
      const m = put(F, out > (LIGHT ? 0 : 8) ? part + '_f' : part, { position: p, s, side, turn, scale: [k, 0.96 + 0.08 * rnd(), k], tint: tints[Math.floor(rnd() * tints.length)], dye });
      const steam = F.points[part + '_steam'].clone().applyMatrix4(m);
      vats.push({ x: p.x, y: y + 1.3, z: p.z, across, dye, s, d: side * (hw(s) + out), part, steam: [steam.x, steam.y, steam.z] });
      stood.push({ p, y, R: across / 2 * (k / (across / (big ? 3 : 2.4))), turn, face: toWater(s, side, out), part, dye, s, side, out });
      if (part === 'vat_a') { const a = F.points.vat_a_spill.clone().applyMatrix4(m), b = F.points.vat_a_land.clone().applyMatrix4(m); spills.push({ pour: [a.x, a.y, a.z], land: [b.x, b.y, b.z], dye, s, side }); }
    });
    const K = plan.causeway;
    // THE FIFTH LOOK: A PAN'S DYE IS SEEN. At 0.45 m (the layout's height, for the sun's line) a pan's rim stood 0.95 m above
    // the water and the rider's eye 1.1 m: its liquor was hidden behind its own rim from everywhere, and a pan was a dark
    // drum. A dyers' pan is a shallow basin: its kerb stands 0.3 m proud of the apron (PAN_H; &panh=0.45: as it was), the
    // liquor a finger under the rim, and from the boat every pan is a pool that holds the sky.
    const PAN_H = QS.has('panh') ? +QS.get('panh') : 0.3;
    Y.pans.forEach(([s, out], i) => {
      const p = land(s, -1, out, K.top), k = 0.96 + 0.08 * rnd();
      const m = put(F, 'pan', { position: p, s, side: -1, turn: rnd() * 6.283, scale: [k, PAN_H / 0.45, k], tint: tints[i % tints.length], dye: i % 3 === 1 ? plan.dye.VIOLET : plan.dye.INDIGO, dye2: plan.dye.INDIGO, mark: false });      // (it stands on the apron: the river's marks are not on it)
      const steam = F.points.pan_steam.clone().applyMatrix4(m);
      vats.push({ x: p.x, y: K.top + PAN_H, z: p.z, across: 3.4, R: 1.7 * k, dye: i % 3 === 1 ? plan.dye.VIOLET : plan.dye.INDIGO, pan: true, s, d: -(hw(s) + out), part: 'pan', steam: [steam.x, steam.y, steam.z] });
    });
    counts.vats = Y.vats.length; counts.pans = Y.pans.length;
    removeStandIn(ctx, 'vats and pans');
  }
  shared.vats = vats; shared.spills = spills;

  // ================================================================================================ terrace walls and steps
  // Lengths of wall face the land's risers (walls.glb): the one that stands in the water with its three tide marks, the
  // ones between the steps, the causeway's edge. Each length is a chord of the riser (6 m; halved where the bank bends
  // away from it), stretched to fit, its height the riser's own. A stair's length is laid first, so that the stair
  // comes down exactly where the plan says; the stretches between are divided evenly.
  {
    const F = await family('walls');
    const A = new THREE.Vector3(), Bv = new THREE.Vector3(), Mv = new THREE.Vector3(), W = new THREE.Vector3(), Q3 = new THREE.Vector3();
    let shifted = 0;
    const riserAt = (side, k, s) => { const b = bankOf(side, s); return { out: b.out[k], top: b.y[k], base: k ? b.y[k - 1] : 0 }; };
    let n = 0, stairs = 0, quoins = 0, laid = [];
    const length = (side, k, sa, sb, stair, apron) => {
      const sm = (sa + sb) / 2;
      const ra = apron || riserAt(side, k, sa), rb = apron || riserAt(side, k, sb), rm = apron || riserAt(side, k, sm);
      land(sa, side, ra.out, 0, A); land(sb, side, rb.out, 0, Bv); land(sm, side, rm.out, 0, Mv);
      const bend = Math.hypot(Mv.x - (A.x + Bv.x) / 2, Mv.z - (A.z + Bv.z) / 2);
      if (bend > 0.07 && sb - sa > 3.5 && !stair) { length(side, k, sa, sm, false, apron); length(side, k, sm, sb, false, apron); return; }
      let dx = Bv.x - A.x, dz = Bv.z - A.z; const chord = Math.hypot(dx, dz) || 1; dx /= chord; dz /= chord;
      land(sm, side, Math.max(-1, rm.out - 1), 0, W); W.sub(Mv);
      // A length is straight and the land's riser is not (the land is laid through every second metre of the route, and
      // where the channel narrows fast its edge is a curve). A stair's length is never halved, and a short length is not
      // halved again: where the riser stands in front of such a length by more than the stones' own standing-off, the
      // length is set that much nearer the water. (The second look: the land's bare riser showed either side of a stair
      // at s 199, right bank.)
      let shift = 0;
      { const wl = Math.hypot(W.x, W.z) || 1, wx = W.x / wl, wz = W.z / wl;
        for (let q = Math.ceil(sa / 2) * 2; q <= sb; q += 2) {
          const rq = apron || riserAt(side, k, q); land(q, side, rq.out, 0, Q3);
          const t = (Q3.x - A.x) * dx + (Q3.z - A.z) * dz;
          shift = Math.max(shift, (Q3.x - (A.x + dx * t)) * wx + (Q3.z - (A.z + dz * t)) * wz);
        }
        shift = shift > 0.03 ? shift + 0.04 : 0;                          // (and a little more: the two faces lean, and not quite alike)
        if (shift) { A.x += wx * shift; A.z += wz * shift; Bv.x += wx * shift; Bv.z += wz * shift; shifted++; } }
      // the model runs along its +X and faces +Z (= X x up): turn it so that its face looks at the water
      let O = A; if (-dz * W.x + dx * W.z < 0) { O = Bv; dx = -dx; dz = -dz; }
      const sea = k === 0, h = rm.top - rm.base, [d1, d2] = Y.dyesAt(sm, side);
      // (a length that follows a bend is a half length: its own 3 m models, so that its stones are the size of their neighbours')
      const half = sea && !stair && !apron && chord < 4.3;
      const part = apron ? (n % 2 ? 'apron_b' : 'apron') : sea ? (stair ? (stairs % 3 === 1 ? 'wall_wsb' : 'wall_ws') : half ? ['wall_h1', 'wall_h2', 'wall_h3'][n % 3] : (n % 3 === 1 ? 'wall_w2' : 'wall_w1')) : (stair ? 'wall_ds' : (k === 2 || LIGHT) ? (n % 2 ? 'wall_f2' : 'wall_f1') : (n % 2 ? 'wall_d2' : 'wall_d1'));      // (the third step's walls are 16 m and more away: lighter lengths)
      put(F, part, { position: new THREE.Vector3(O.x, rm.base + 0.012, O.z), s: sm, side, turn: Math.atan2(-dz, dx), scale: [chord / (half ? 3 : 6), h / (apron ? 0.5 : sea ? 0.9 : 1.0), 1], tint: apron ? ['#c2b2b8', '#b9aab2', '#c8b8bc'][n % 3] : tints[(n * 3 + k) % tints.length], dye: d1, dye2: d2 });      // (the causeway's kerb: darker: it was the palest thing in its picture)
      n++; if (stair) stairs++;
      laid.push({ ax: A.x, az: A.z, bx: Bv.x, bz: Bv.z, base: rm.base, h, sea, apron: !!apron, s: sa, side });
    };
    const run = (side, k, s0, s1, apron) => {
      // a stair stands at 3.1 m along its length: lay those lengths first (the model runs upstream on the right bank)
      const fixed = apron ? [] : Y.stairs.filter((q) => q[0] === side && q[1] === k && q[2] > s0 + 4 && q[2] < s1 - 4).map((q) => q[2] - (side > 0 ? 2.9 : 3.1)).sort((a, b) => a - b);
      let at = s0;
      const fill = (g0, g1) => { const m = Math.max(1, Math.round((g1 - g0) / 6)); if (g1 - g0 < 0.6) return; for (let i = 0; i < m; i++) length(side, k, g0 + (g1 - g0) * i / m, g0 + (g1 - g0) * (i + 1) / m, false, apron); };
      laid = [];
      for (const f of fixed) { if (f < at) continue; fill(at, f); length(side, k, f, f + 6, true); at = f + 6; }
      fill(at, s1);
      // where the wall turns a corner too sharp for two lengths to meet (the lagoon's shoulders): a round pier on the corner
      laid.sort((p, q) => p.s - q.s);
      for (let i = 1; i < laid.length; i++) {
        const p = laid[i - 1], q = laid[i], a1 = Math.atan2(p.bz - p.az, p.bx - p.ax), a2 = Math.atan2(q.bz - q.az, q.bx - q.ax);
        let turn = Math.abs(a2 - a1); if (turn > Math.PI) turn = 2 * Math.PI - turn;
        if (turn < 0.27 || q.apron) continue;
        const [d1, d2] = Y.dyesAt(q.s, side);
        put(F, q.sea ? 'quoin' : 'quoin_d', { position: new THREE.Vector3(q.ax, q.base + 0.012, q.az), s: q.s, side, turn: rnd() * 6.3, scale: [1, q.h / (q.sea ? 0.9 : 1.0), 1], tint: tints[i % tints.length], dye: d1, dye2: d2 });
        quoins++;
      }
    };
    for (const [side, k, s0, s1] of Y.walls) if (!(LIGHT && k === 2)) run(side, k, s0, s1);
    run(-1, 0, Y.apron[0], Y.apron[1], { out: 0.35, top: plan.causeway.top, base: 0 });
    // (the fifth look: the kerb's first length ended in its own sawn end at the door, a pale box over the water: a round
    // pier closes it there, where the causeway's edge turns away from the channel, and one at its far end by the loft)
    if (laid.length) {
      const [d1, d2] = Y.dyesAt(212, -1), h = plan.causeway.top, a0 = laid[0], aN = laid[laid.length - 1];
      for (const [x, z, sq] of [[a0.ax, a0.az, a0.s], [aN.bx, aN.bz, aN.s]]) { put(F, 'quoin', { position: new THREE.Vector3(x, 0.012, z), s: sq, side: -1, turn: rnd() * 6.3, scale: [0.82, (h + 0.02) / 0.9, 0.82], tint: ['#c2b2b8', '#b9aab2'][quoins % 2], dye: d1, dye2: d2 }); quoins++; }
    }
    counts.walls = n; counts.stairs = stairs; counts.quoins = quoins; counts.wallsSetOut = shifted;
  }

  // ================================================================================================ spouts
  // A spout is placed by its lip (spouts.glb: the origin of every variant is its pour point), the liquor runs to the
  // water. The falling dye itself is the cast's (docs/life/falls.md): `pour` and `land` say where from and where to.
  const spouts = [];
  {
    const F = await family('spouts');
    for (const [s, side, out, y, part, dye] of Y.spouts) {
      const p = land(s, side, out, y), turn = toWater(s, side, Math.max(1.2, out)) + (rnd() - 0.5) * 0.12;
      put(F, part, { position: p, s, side, turn, lean: [(rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.06], scale: 0.95 + 0.1 * rnd(), tint: tints[Math.floor(rnd() * tints.length)], dye });
      const ground = level(s, side, out);                                // 0 = it falls into the water of the ford (or of the channel's edge)
      spouts.push({ x: p.x, y, z: p.z, fall: y - ground, dye, side, s, part, pour: [p.x, y, p.z], land: [p.x + Math.sin(turn) * 0.12, ground, p.z + Math.cos(turn) * 0.12] });
    }
    counts.spouts = spouts.length;
    removeStandIn(ctx, 'spouts');
  }
  shared.spouts = spouts;

  // ================================================================================================ skein racks and their hanks
  // The hanks hang on the racks' poles (racks.glb gives each pole's two ends as named points) and swing below them.
  const racks = [], hankDrips = [];
  {
    const F = await family('racks');
    const greys = ['#ffffff', '#e4e4e4', '#f2f2f2', '#d4d4d4', '#ececec'];
    const a = new THREE.Vector3(), b = new THREE.Vector3(), q = new THREE.Vector3();
    let hanks = 0;
    Y.racks.forEach(([s, side, out, dye, k], i) => {
      const y = level(s, side, out), p = land(s, side, out, y), turn = toWater(s, side, Math.max(1.2, out)) + (rnd() - 0.5) * 0.14 + (i % 2 ? Math.PI : 0);
      const part = ['rack_a', 'rack_b', 'rack_c'][(i * 2 + (side > 0 ? 1 : 0)) % 3];
      const m = put(F, part, { position: p, s, side, turn, lean: [(rnd() - 0.5) * 0.04, (rnd() - 0.5) * 0.04], scale: [k, 0.97 + 0.06 * rnd(), 1], tint: tints[i % tints.length], dye });
      a.copy(F.points[part + '_pole0']).applyMatrix4(m); b.copy(F.points[part + '_pole1']).applyMatrix4(m);
      const mine = [];
      const [, second] = Y.dyesAt(s, side);
      // THE FOURTH LOOK. A hank is one fat wet tress (racks.py); they are hung as a dyer hangs them: two to four pushed
      // together, then a hand's gap or an arm's, so that a rack is a few broad masses of colour with air between and
      // not a comb of single things; no two neighbours alike in kind, length and girth. About ten to a four-metre pole.
      const poleLen = a.distanceTo(b), KINDS = ['hank_a', 'hank_c', 'hank_b', 'hank_a', 'hank_d', 'hank_f', 'hank_c', 'hank_e', 'hank_a', 'hank_b'];
      const dip = dipPair(s, side);                                    // (the dipped kind's two dyes here; none on the indigo bank)
      let x = 0.16 + 0.2 * rnd(), last = '';
      while (x < poleLen - 0.16) {
        const cluster = 2 + Math.floor(rnd() * 3.4);
        for (let c = 0; c < cluster && x < poleLen - 0.16; c++) {
          let hp = KINDS[Math.floor(rnd() * KINDS.length)];
          if (hp === last || (hp === 'hank_f' && !dip)) hp = hp === 'hank_a' ? 'hank_c' : 'hank_a';
          last = hp;
          const len = 0.86 + 0.3 * rnd(), fat = 0.9 + 0.3 * rnd(), t = x / poleLen;
          q.lerpVectors(a, b, t); q.y -= 0.03 * Math.sin(Math.PI * t);      // (the pole bows a little under them)
          const d = hp === 'hank_f' ? dip[0] : rnd() < 0.12 ? other(s, dye, second) : dye;
          put(F, hp, { position: q.clone(), s, side, turn: turn + (rnd() - 0.5) * 0.44, lean: [0, (rnd() - 0.5) * 0.05], scale: [fat, len, fat], tint: d === plan.dye.CREAM ? '#b4aca4' : greys[Math.floor(rnd() * greys.length)], dye: d, dye2: hp === 'hank_f' ? dip[1] : d, raw: true, sway: { top: 0, length: 1.3, amount: 1 } });      // (undyed yarn is ecru, and wet: it may not be the palest thing in its picture)
          const bottom = q.y + F.points[hp + '_drip'].y * len;           // (the foot of the tress, where it drips from: the model names it)
          mine.push([q.x, bottom, q.z]); hankDrips.push({ x: q.x, y: bottom, z: q.z, dye: hp === 'hank_f' ? dip[1] : d, s });
          hanks++;
          x += (0.135 + 0.04 * rnd()) * fat;
        }
        x += 0.2 + 0.3 * rnd() + (rnd() < 0.14 ? 0.45 : 0);                // (now and then one has been taken down)      // (the fifth look: closer: a pole carried six or seven; the page hangs a dozen on it)
      }
      racks.push({ s, d: side * (hw(s) + out), dye, side, y, face: turn, pole: [[a.x, a.y, a.z], [b.x, b.y, b.z]], hanks: mine });
    });
    counts.racks = racks.length; counts.hanks = hanks;
    removeStandIn(ctx, 'skein racks'); removeStandIn(ctx, 'hanks');
  }
  shared.racks = racks; shared.hankDrips = hankDrips;

  // ================================================================================================ the launder
  // A plank trough on tall trestles along the right bank (launder.glb). Every part's origin is the underside of the
  // trough over a trestle's head; the legs go down into whatever is there (the ford, a step). The trough between two
  // trestles is stretched to their distance.
  const launder = { drips: [], troughs: [] };
  {
    const F = await family('launder'), Ld = plan.launder, yT = Y.troughUnder;
    const T = Y.trestles.map((s) => land(s, 1, Ld.out, yT));
    const q = new THREE.Vector3();
    T.forEach((p, i) => {
      const s = Y.trestles[i], a = T[Math.max(0, i - 1)], b = T[Math.min(T.length - 1, i + 1)];
      const along = Math.atan2(-(b.z - a.z), b.x - a.x);                 // rotation.y that lays the model's +X along the launder
      put(F, i % 3 === 1 ? 'trestle_b' : 'trestle_a', { position: p, s, side: 1, turn: along + (i % 2 ? Math.PI : 0) + (rnd() - 0.5) * 0.06, lean: [(rnd() - 0.5) * 0.02, (rnd() - 0.5) * 0.02], scale: [1, 1, 0.94 + 0.12 * rnd()], tint: tints[i % tints.length] });
      if (i < T.length - 1) {
        const n = T[i + 1], dist = Math.hypot(n.x - p.x, n.z - p.z), turn = Math.atan2(-(n.z - p.z), n.x - p.x), part = i % 3 === 2 ? 'trough_b' : 'trough_a';
        const m = put(F, part, { position: p, s: (s + Y.trestles[i + 1]) / 2, side: 1, turn, scale: [dist / 6.2, 1, 1], tint: tints[(i * 2 + 1) % tints.length] });
        for (let k = 0; k < 4; k++) { q.copy(F.points[`${part}_drip${k}`]).applyMatrix4(m); launder.drips.push([q.x, q.y, q.z]); }
        launder.troughs.push({ from: [p.x, yT, p.z], to: [n.x, yT, n.z] });
      }
    });
    // its two ends: a short length stopped with a board, beyond the first and the last trestle
    const end = (p, toward) => put(F, 'trough_end', { position: p, s: 100, side: 1, turn: Math.atan2(-(p.z - toward.z), p.x - toward.x), tint: tints[2] });
    end(T[0], T[1]); end(T[T.length - 1], T[T.length - 2]);
    counts.trestles = T.length;
    removeStandIn(ctx, 'launder');
  }
  shared.launder = launder;

  // ================================================================================================ props, and the small things of the close band
  // What the dyers put down and left (props.glb), each where it would have been put down: a paddle stood against the vat
  // it stirred, stained to the depth it was dipped in THAT vat's dye; a bucket at its foot; folded cloth under a weighted
  // board a step along from it; a coil of rope and a ring where a stair comes down to the water; a basket of wet cloth
  // at the stair's head; pegs and a tally stick hung on a rack's post. And what the river left: a fallen coping stone
  // in the ford, a bough lodged against the upstream side of whatever stands in the water, with a rag on it, weed at
  // the foot of every wall. Fewer of the small ones at low quality.
  {
    const F = await family('props');
    const dens = (ctx.quality && ctx.quality.density) || 1, some = (chance) => rnd() < chance * Math.min(1, dens + 0.15);
    const n = {}, prop = (part, o) => { n[part] = (n[part] || 0) + 1; return put(F, part, { tint: tints[Math.floor(rnd() * tints.length)], ...o }); };
    const by = (v, angle, radius, lift = 0) => new THREE.Vector3(v.p.x + Math.sin(angle) * radius, v.y + lift, v.p.z + Math.cos(angle) * radius);
    const tangent = (s) => { const a = path.at(Math.min(path.length, Math.max(0, s)), _P); return Math.atan2(-a.tz, a.tx); };      // rotation.y that lays a model's +X downstream
    // ---- beside the vats
    stood.forEach((v, i) => {
      const rel = ({ vat_a: 1.05, vat_b: -0.9, vat_c: 1.4, vat_d: -1.2 })[v.part] + (rnd() - 0.5) * 0.3, a = v.turn + rel;
      if (some(0.72)) prop('paddle', { position: by(v, a, v.R + 0.27), s: v.s, side: v.side, turn: a, lean: [(rnd() - 0.5) * 0.05, (rnd() - 0.5) * 0.12], scale: 0.92 + 0.16 * rnd(), dye: v.dye });
      if (some(0.22)) prop('paddle', { position: by(v, a + 0.42, v.R + 0.27), s: v.s, side: v.side, turn: a + 0.42, lean: [0, 0.14], scale: 0.86 + 0.1 * rnd(), dye: v.dye });
      if (some(0.5)) prop('bucket', { position: by(v, a - 0.55, v.R + 0.42), s: v.s, side: v.side, turn: rnd() * 6.3, scale: 0.9 + 0.25 * rnd(), dye: v.dye });
      // folded cloth a step along the terrace from the vat (never toward the water: the steps are narrow)
      if (some(0.62)) {
        const along = v.face + (i % 2 ? 1 : -1) * Math.PI / 2, [, second] = Y.dyesAt(v.s, v.side);
        prop(['stack_a', 'stack_b', 'stack_c', 'stack_d'][Math.floor(rnd() * 4)], { position: by(v, along + (rnd() - 0.5) * 0.25, v.R + 0.75 + rnd() * 0.5), s: v.s, side: v.side, turn: v.face + (rnd() - 0.5) * 0.7,
          scale: [0.9 + 0.2 * rnd(), 0.8 + 0.45 * rnd(), 0.9 + 0.2 * rnd()], dye: v.dye, dye2: rnd() < 0.35 ? near(v.dye) : v.dye });
      }
    });
    // ---- where a stair comes down to the water: a coil of rope and a basket at its head, a ring in the wall beside it
    for (const [side, k, s] of Y.stairs) {
      const b = bankOf(side, s), face = toWater(s, side, b.out[k]);
      if (k === 0) {
        prop('rope', { position: land(s + 1.75, side, b.out[0] + 0.28, b.y[0] + 0.02), s, side, turn: rnd() * 6.3, scale: 0.9 + 0.25 * rnd(), tint: '#a8927e' });
        prop('ring', { position: land(s - 1.85, side, b.out[0] - 0.135, 0.56), s, side, turn: face });
        prop(rnd() < 0.5 ? 'basket_a' : 'basket_b', { position: land(s - 1.6, side, b.out[0] + 0.95, b.y[0]), s, side, turn: rnd() * 6.3, scale: 0.9 + 0.2 * rnd(), dye: Y.dyesAt(s, side)[0] });
      } else if (some(0.7)) prop('basket_c', { position: land(s + 1.7, side, b.out[k] + 0.8, b.y[k]), s, side, turn: rnd() * 6.3, lean: [0, (rnd() - 0.5) * 0.2], scale: 0.9 + 0.2 * rnd() });
    }
    // ---- under every spout: what has run down the wall under its heel (a wash on the wall's own face, from under the
    // coping to a hand above the water, where the water's own marks take over) and what was slopped on the coping
    const wallNormal = (s, side, out) => { const a = land(s, side, out, 0), b2 = land(s, side, out - 1, 0); return new THREE.Vector3(b2.x - a.x, 0, b2.z - a.z).normalize(); };
    /** A stain down a wall's face at s: from `from` down to `to` (heights), on the riser that stands `out0` outside the edge. */
    const wallRun = (s, side, out0, from, to, w, amount, dye, dye2 = null, second = 0) => {
      const nrm = wallNormal(s, side, out0), pts = [], n = Math.max(3, Math.round((from - to) / 0.16) + 1);
      for (let i = 0; i < n; i++) { const y = from + (to - from) * i / (n - 1); pts.push(land(s + (wrnd() - 0.5) * 0.05, side, out0 - 0.14 + 0.03 * y, y)); }
      washPath(pts, w, amount, dye, dye2, second, nrm, 0.3);
    };
    for (const sp of spouts) {
      const b = bankOf(sp.side, sp.s), apron = sp.side < 0 && sp.s > 205, out0 = apron ? 0.35 : b.out[0], top = apron ? plan.causeway.top : b.y[0];
      if (top - 0.2 > 0.3) wallRun(sp.s + (wrnd() - 0.5) * 0.15, sp.side, out0, top - 0.18, 0.27, (t) => 0.2 + 0.2 * t, (t) => 0.95 - 0.25 * t, sp.dye);
      washPatch(land(sp.s, sp.side, out0 + 0.22, top + (apron ? 0.03 : 0)), 0.5 + 0.3 * wrnd(), 0.3, toWater(sp.s, sp.side, Math.max(1.2, out0)) + Math.PI / 2, 0.85, sp.dye);      // (the causeway's kerb stands 3 cm proud of the land's top)
      if (sp.part === 'spout_e' && top - 0.2 > 0.3) wallRun(sp.s + 0.4, sp.side, out0, top - 0.18, 0.27, 0.22, 0.7, sp.dye);
    }
    // ---- on the racks' posts: a bag of pegs, a tally stick; a basket beside a rack that stands on a step
    racks.forEach((rk, i) => {
      const [a, b] = rk.pole, hang = (e, part) => prop(part, { position: new THREE.Vector3(e[0] + (rnd() - 0.5) * 0.06, e[1] - 0.42 - rnd() * 0.2, e[2] + (rnd() - 0.5) * 0.06).add(new THREE.Vector3(Math.sin(rk.face), 0, Math.cos(rk.face)).multiplyScalar(0.1)), s: rk.s, side: rk.side, turn: rk.face + (rnd() - 0.5) * 0.6, dye: rk.dye });
      if (i % 2 === 0 || some(0.4)) hang(a, 'pegbag');
      if (i % 3 !== 1) hang(b, 'tally');
      if (rk.y > 0.5) prop('basket_b', { position: new THREE.Vector3((a[0] + b[0]) / 2 + Math.sin(rk.face) * 0.9, rk.y, (a[2] + b[2]) / 2 + Math.cos(rk.face) * 0.9), s: rk.s, side: rk.side, turn: rk.face + 1.3, dye: rk.dye });
    });
    // ---- ladders, barrows, crocks, fallen stones, lodged boughs: each by its place in the plan
    let drapes = 0;
    for (const [part, s, side, out, turn, dye] of Y.props) {
      const [own, second] = Y.dyesAt(s, side), d = dye == null ? own : dye;
      if (part === 'drape') {                                            // it lies on the first wall's coping and hangs down its face
        const b = bankOf(side, s);
        // (four kinds: thrown over doubled and dipped twice; wrung and hung to drain, its end in the water; spread to dry
        // under stones; a narrow length with one long corner. Its height is the wall's: a cloth that reaches the water on a
        // 0.9 m wall does so on a 0.8 m one. A cloth is DARKER than the hanks and bolts: it lies wet in the open)
        // (THE SIXTH LOOK: the wrung rope, `drape_b`, is no longer hung: a tight red spiral standing against the wall in postcard 3
        // read as a twisted candle, and no one wrings a length to a rope and then hangs it to dry. It stays in the file.)
        const kind = ['drape', 'drape_d', 'drape_c', 'drape_d', 'drape', 'drape_c', 'drape_d', 'drape'][drapes++ % 8];
        const dip = dipPair(s, side), dipped = kind === 'drape' && dip && dip[0] !== plan.dye.CREAM && dye == null;      // (a dye given in the plan is kept; no cream cloth lies wet on a wall: it would be the palest thing in its picture)
        prop(kind, { position: land(s, side, b.out[0] - 0.1, b.y[0] + 0.014), s, side, turn: toWater(s, side, Math.max(1.2, b.out[0])) + (rnd() - 0.5) * 0.1, scale: [0.9 + 0.3 * rnd(), (b.y[0] / 0.9) * (kind === 'drape_b' ? 1 : 0.9 + 0.12 * rnd()), 1], tint: ['#ffffff', '#e6e6e6', '#f4f4f4'][Math.floor(rnd() * 3)],
          dye: dipped ? dip[0] : d, dye2: dipped ? dip[1] : d,
          sway: { top: -0.08, length: 0.8, amount: kind === 'drape_b' ? 0.3 : 0.16 } });      // (what hangs below the coping stirs in the reach's wind: wet cloth, a sixth of a hank's swing)
        continue;
      }
      const onCauseway = side < 0 && s > 205;                           // (the fifth look: `level` knows the banks' steps, not the causeway: what was put down there stood at the water's height, inside the stone)
      const y = part === 'stone' || part === 'drift' || part === 'mooring' ? 0 : onCauseway ? plan.causeway.top + 0.012 : level(s, side, out);
      const face = toWater(s, side, Math.max(1.2, out));
      if (part.startsWith('spread')) {                                  // cloth laid out on the setts: it lies away from the water from its near end, a little askew
        const D = plan.dye;
        prop(part, { position: land(s, side, out, y + 0.004), s, side, turn: face + turn, scale: [0.9 + 0.25 * rnd(), 1, 0.9 + 0.2 * rnd()], tint: ['#ffffff', '#e8e8e8', '#f4f4f4'][Math.floor(rnd() * 3)], dye: d, dye2: d === D.VIOLET ? D.INDIGO : D.VIOLET, mark: false });
        continue;
      }
      prop(part, { position: land(s, side, out, y), s, side, turn: part === 'drift' ? tangent(s) + turn : face + turn, lean: part === 'mooring' ? [(rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.12] : null, scale: (0.92 + 0.16 * rnd()) * (onCauseway && part.startsWith('basket') ? 0.74 : 1), dye: d, dye2: part.startsWith('stack') ? (Math.round(s * 10) % 3 === 0 ? near(d) : d) : second, ...(part === 'rope' ? { tint: '#a8927e' } : null) });      // (a coil of rope was the palest thing on the floor: a straw hat)
    }
    // ---- THE FIFTH LOOK: cloth pulled out of a pan and left over its rim to drain (four of the seven): it lies on the
    // kerb and hangs down its outer face to the setts, on the side the rider sees (toward the channel, give or take)
    { const D = plan.dye, hangs = { drape: 0.8, drape_c: 0.42, drape_d: 0.74 }, PR = ctx.rng(7411);
      vats.filter((v) => v.pan).forEach((pn, i) => {
        if (i % 2 === 1 && i !== 5) return;
        const kind = ['drape_c', 'drape', 'drape_d', 'drape_c'][Math.floor(i / 2) % 4], toward = toWater(pn.s, -1, 3) + (PR() - 0.5) * 1.7;
        const R = (pn.R || 1.7) + 0.012, rim = pn.y;
        const own = pn.dye === D.VIOLET ? D.INDIGO : (PR() < 0.5 ? D.VIOLET : D.INDIGO);      // (not always the pan's own: it went through another bath first)
        prop(kind, { position: new THREE.Vector3(pn.x + Math.sin(toward) * R, rim + 0.006, pn.z + Math.cos(toward) * R), s: pn.s, side: -1, turn: toward, scale: [0.85 + 0.3 * PR(), (rim - plan.causeway.top - 0.03) / hangs[kind], 1], tint: ['#ffffff', '#e6e6e6', '#f4f4f4'][i % 3], dye: own, dye2: pn.dye, mark: false });
      });
    }
    // ---- DYE ON THE GROUND (washes: they lie on the land's own treads and on the copings and colour them).
    // Round every vat the step is wet with its dye; from the foot of every vat that runs over, and of every second one
    // besides, the dye has found its way across the step to the edge, down the wall, and so toward the river.
    stood.forEach((v, i) => {
      const b = bankOf(v.side, v.s), k = v.out > b.out[2] ? 2 : v.out > b.out[1] ? 1 : 0, [, second] = Y.dyesAt(v.s, v.side);
      washPatch(new THREE.Vector3(v.p.x, v.y, v.p.z), v.R + 0.55 + 0.5 * wrnd(), v.R + 0.45 + 0.5 * wrnd(), wrnd() * 6.3, 0.8, v.dye, second, 0.12 * wrnd());
      if (v.part === 'vat_a' || i % 2 === 0) {
        // its run: from its foot on the water side, wandering to the step's edge
        const foot = by(v, v.face + (v.part === 'vat_a' ? 0 : (wrnd() - 0.5) * 0.8), v.R * 0.9), sEdge = v.s + (wrnd() - 0.5) * 1.2, edge = land(sEdge, v.side, b.out[k] + 0.12, v.y);
        const pts = [foot]; const n = 4;
        for (let j = 1; j <= n; j++) { const t = j / n; pts.push(new THREE.Vector3(lerp(foot.x, edge.x, t) + (wrnd() - 0.5) * 0.3 * (1 - t), v.y, lerp(foot.z, edge.z, t) + (wrnd() - 0.5) * 0.3 * (1 - t))); }
        washPath(pts, (t) => 0.34 - 0.12 * t, (t) => 0.95 - 0.15 * t, v.dye);
        // down the wall under it, and a stain where it lands on the step below
        const foot0 = k ? b.y[k - 1] : 0.27;
        wallRun(sEdge, v.side, b.out[k], v.y - 0.17, foot0 + (k ? 0.03 : 0), (t) => 0.2 + 0.16 * t, (t) => 0.9 - 0.25 * t, v.dye);
        if (k) washPatch(land(sEdge, v.side, b.out[k] - 0.55, b.y[k - 1]), 0.5 + 0.3 * wrnd(), 0.4 + 0.2 * wrnd(), wrnd() * 6.3, 0.8, v.dye);
      }
    });
    // down every stair the cloth was carried dripping: a patch at its head, one on each of its steps that is out of the water
    for (const [side, k, s] of Y.stairs) {
      const b = bankOf(side, s), [d, second] = Y.dyesAt(s, side), face = toWater(s, side, Math.max(1.2, b.out[k]));
      washPatch(land(s + (wrnd() - 0.5) * 0.6, side, b.out[k] + 0.9 + wrnd() * 0.4, b.y[k]), 0.8 + 0.4 * wrnd(), 0.6 + 0.3 * wrnd(), wrnd() * 6.3, 0.75, d, second, 0.3 * wrnd());
      const base = k ? b.y[k - 1] : 0, rise = 0.18 * (b.y[k] - base) / (k ? 1.0 : 0.9), going = 0.31;
      for (let i = 0; i < 6; i++) {
        const y = b.y[k] - (i + 1) * rise;
        if (y < Math.max(0.3, base + 0.1)) break;
        washPatch(land(s + (wrnd() - 0.5) * 0.5, side, b.out[k] - 0.12 - (i + 0.5) * going, y), 0.55 + 0.35 * wrnd(), 0.13, face + Math.PI / 2, 0.62, wrnd() < 0.3 ? second : d);
      }
    }
    // under a rack that stands on a step: what has dripped from its hanks
    racks.forEach((rk) => { if (rk.y > 0.5) washPatch(new THREE.Vector3((rk.pole[0][0] + rk.pole[1][0]) / 2, rk.y, (rk.pole[0][2] + rk.pole[1][2]) / 2), 2.0, 0.42, Math.atan2(-(rk.pole[1][2] - rk.pole[0][2]), rk.pole[1][0] - rk.pole[0][0]), 0.7, rk.dye); });
    // along the first step's coping on both banks, where everything is carried: a path of old dye, broken, in the place's own
    for (const side of [-1, 1]) for (let s0 = 27; s0 < (side > 0 ? 239 : 116); s0 += 7.5) {
      if (side > 0 && s0 > 138 && s0 < 178) continue;                     // (behind the wringing gallery nothing is seen)
      const [d, second] = Y.dyesAt(s0 + 3, side), pts = [], k0 = wrnd() * 6.3;
      for (let ds = 0; ds <= 7.5; ds += 1.25) { const sq = s0 + ds, b = bankOf(side, sq); pts.push(land(sq, side, b.out[0] + 0.3 + 0.1 * Math.sin(sq * 0.9 + k0), b.y[0])); }
      washPath(pts, 0.3, (t) => 0.3 + 0.5 * Math.max(0, Math.sin(t * 6.3 * 1.3 + k0)), d, second, 0.25, null, 0.2);
    }
    // the causeway: the apron is wet with indigo round every pan, and from each pan a run goes to the edge
    if (QS.get('yardfloor') === '0') { const K = plan.causeway, I = plan.dye.INDIGO, V = plan.dye.VIOLET;      // (the fifth look: the causeway's floor is paved now and carries its own dye: see "the causeway's floor")
      Y.pans.forEach(([sq, out], i) => {
        const c = land(sq, -1, out, K.top);
        washPatch(c, 2.5 + 0.5 * wrnd(), 2.4 + 0.5 * wrnd(), wrnd() * 6.3, 0.8, I, V, 0.2 * wrnd());
        const edge = land(sq + (wrnd() - 0.5) * 2.5, -1, 0.5, K.top), pts = [];
        for (let j = 0; j <= 4; j++) { const t = j / 4; pts.push(new THREE.Vector3(lerp(c.x, edge.x, t) + (wrnd() - 0.5) * 0.3, K.top, lerp(c.z, edge.z, t) + (wrnd() - 0.5) * 0.3)); }
        washPath(pts, (t) => 0.4 - 0.15 * t, 0.9, i % 3 === 1 ? V : I);
      });
      for (let s0 = 211; s0 < 238; s0 += 6.5) {
        const pts = [], k0 = wrnd() * 6.3;
        for (let ds = 0; ds <= 6.5; ds += 1.3) pts.push(land(s0 + ds, -1, 1.1 + 0.4 * Math.sin((s0 + ds) * 0.7 + k0), K.top));
        washPath(pts, 0.55, (t) => 0.35 + 0.5 * Math.max(0, Math.sin(t * 6.3 + k0)), I, V, 0.3);
      }
    }
    // ---- weed: a hand of it at the foot of the walls that stand in the water, streaming with the river
    for (const side of [-1, 1]) for (let s = 28; s < (side > 0 ? 238 : 122); s += 6.2 + rnd() * 3) {      // (the left bank: to where the indigo house's own frontage begins)
      if (!some(0.85)) continue;
      const b = bankOf(side, s), out = Math.max(0.5, b.out[0] - 0.3 - rnd() * 0.7);
      prop('weed', { position: land(s, side, out, -0.44 + rnd() * 0.1), s, side, turn: tangent(s) + (rnd() - 0.5) * 0.5, scale: [0.8 + 0.6 * rnd(), 0.8 + 0.4 * rnd(), 0.9 + 0.3 * rnd()], tint: ['#ffffff', '#dfe8d8', '#f0e8d0'][Math.floor(rnd() * 3)], sway: { up: true, base: 0.02, length: 0.4, amount: 0.45 } });
    }
    // ---- the swallows' mud nests: under the indigo house's eaves and on the loft's first beam (stage 1's places)
    { const H = plan.indigoHouse, t = toWater(H.at[0], -1, 3), given = shared.indigoHouse && shared.indigoHouse.nests;      // (the house's model names the places under its eaves)
      for (let i = 0; i < 8; i++) {
        const g = given && given[i], p = g ? new THREE.Vector3(g.x ?? g[0], g.y ?? g[1], g.z ?? g[2]) : kit.at(H.at[0] - 12 + i * 3.4 + (rnd() - 0.5) * 0.8, H.at[1] + H.size[1] / 2 + 0.5, H.eaves - 0.3);
        prop('nest', { position: p, s: H.at[0], side: -1, turn: t + Math.PI, scale: 0.85 + 0.35 * rnd() });
      }
      const beam = shared.loft && shared.loft.nests;                    // (the loft's model names its two)
      [-3.1, 4.4].forEach((d, i) => { const g = beam && beam[i]; prop('nest', { position: g ? new THREE.Vector3(g.x, g.y, g.z) : kit.at(plan.loft.from, d, plan.loft.tie - 0.22), s: plan.loft.from, side: Math.sign(d), turn: kit.headingAt(plan.loft.from) + Math.PI, scale: 0.9 + 0.3 * rnd() }); });
    }
    counts.props = n;
    removeStandIn(ctx, 'props'); removeStandIn(ctx, 'mud nests');
  }

  // ================================================================================================ the causeway's floor
  // THE FIFTH LOOK. The causeway is the one floor of the yards the rider looks down on (the eye 0.6 m above it, for 28 m
  // of the ride, and it is the foreground of postcard 9): it was three rows of pale flags and then the land's bare
  // ground. Now the whole apron is PAVED, from the kerb to the sun road's bank: wet stone setts (the page's `ground`
  // picture, its setts tile, laid at last: its light and dark, its joints), darker than the walls (a level face shows
  // 1.6 times its paint in this light), raked by the low sun (the tile's relief turns each sett's shoulder to the light),
  // DRENCHED: damp round every pan and in every hollow, dye standing in the joints and in puddles, and from every pan
  // a GUTTER cut in the floor runs to its spout at the kerb, full of liquor that holds the sky: the colour runs into
  // the river, and the rider sees it go. The paving ends raggedly toward the sun road's bank, where the ground is the
  // land's own. One mesh, one draw call, a material of its own (the yards' wet, the reach's sun). &yardfloor=0: none.
  const FLOOR = QS.get('yardfloor') !== '0';
  if (FLOOR) {
    const K = plan.causeway, yF = K.top + 0.012, D = plan.dye;
    let tSetts = null;
    try { tSetts = await ctx.tex('art/reach/ground_setts.webp', { repeat: true }); if (tSetts) tSetts.anisotropy = 8; } catch (e) { console.error('reach/kit_yards: the setts tile did not load: ' + e); }
    // where the ground it lies on ends (set.js, the low ground north of the sun road): a shore along the sun road
    // (world x = roadX), upright along world z = -212.5 and from there to where its edge meets the channel
    const roadX = plan.sunRoad.x[1], c0 = land(209, -1, 0.35, 0), cx = 14.6, cz = -212.5;
    const segDist = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = clamp01(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
    const sideOf = (x, z) => (c0.x - cx) * (z - cz) - (c0.z - cz) * (x - cx), ref = land(216, -1, 3, 0), inSide = Math.sign(sideOf(ref.x, ref.z)) || 1;      // (which side of that last edge the causeway lies on)
    const pansAt = vats.filter((v) => v.pan).map((v) => ({ x: v.x, z: v.z, R: 1.74, violet: v.dye === D.VIOLET ? 1 : 0, s: v.s }));
    // the gutters: from each pan to the heel of the nearest spout (the causeway's five lie on the kerb, 1.3 m long)
    const heels = spouts.filter((sp) => sp.side < 0 && sp.s > 205).map((sp) => ({ s: sp.s, p: land(sp.s, -1, 1.42, 0) }));
    const gutters = pansAt.map((pn) => {
      let best = heels[0]; for (const h of heels) if (Math.abs(h.s - pn.s) < Math.abs(best.s - pn.s)) best = h;
      const dx = best.p.x - pn.x, dz = best.p.z - pn.z, l = Math.hypot(dx, dz) || 1;
      return new THREE.Vector4(pn.x + dx / l * (pn.R - 0.05), pn.z + dz / l * (pn.R - 0.05), best.p.x, best.p.z);
    });
    const NG = gutters.length;
    const pos = [], att = [], idx = [], DS = 0.5, DO = 0.5, S0 = Y.apron[0] + 0.1, S1 = Y.apron[1] - 0.1, O0 = 0.35 + 0.3, O1 = 20;
    const rows = Math.round((S1 - S0) / DS) + 1, cols = Math.round((O1 - O0) / DO) + 1, q = new THREE.Vector3(), edge = new Float32Array(rows * cols);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const sq = S0 + (S1 - S0) * r / (rows - 1), out = O0 + c * DO;
      land(sq, -1, out, yF, q);
      // how far inside the ground this point is: 1 well inside, 0 at the paving's end
      const shore = clamp01((q.x - roadX - 1.1) / 1.7);                       // the sun road's bank: the paving gives way over a stride or two
      const wall = q.x < cx ? (cz - q.z) : (sideOf(q.x, q.z) * inSide > 0 ? segDist(q.x, q.z, cx, cz, c0.x, c0.z) : -1);      // the upright edge toward the pier
      const e = Math.min(shore, wall > 0.12 ? 1 : 0, clamp01((O1 - out) / 1.5));
      edge[r * cols + c] = e;
      let slop = 0, vio = 0, wsum = 0;
      for (const pn of pansAt) { const d = Math.hypot(q.x - pn.x, q.z - pn.z) - pn.R, k = Math.exp(-Math.max(d, 0) / 0.8); slop = Math.max(slop, k); vio += pn.violet * k * k; wsum += k * k; }
      const worn = Math.exp(-(((out - 1.15) / 0.62) ** 2)) * (0.55 + 0.45 * kit.noise(sq * 0.37, 7.7));
      pos.push(q.x, q.y, q.z); att.push(e, slop, worn, wsum > 0 ? vio / wsum : 0);
    }
    for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c, b = a + 1, d = a + cols, e2 = d + 1;
      if (edge[a] + edge[b] + edge[d] + edge[e2] <= 0) continue;
      idx.push(a, b, d, b, e2, d);                                         // (the left bank: out grows toward -x: wound to face up; checked below)
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aFloor', new THREE.Float32BufferAttribute(att, 4));
    geo.setIndex(idx); geo.computeVertexNormals();
    if (geo.attributes.normal.getY(0) < 0) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } geo.setIndex(idx); geo.computeVertexNormals(); }
    geo.computeBoundingSphere();
    // the courses run across the causeway (the way a quay is paved): the tile is turned to the channel's own direction there
    const tq = path.at(224, _P), ang = Math.atan2(tq.tx, tq.tz);
    const floorExt = {
      defines: { YARD_GUT: NG },
      uniforms: { tYardSetts: { value: tSetts }, uYardGut: { value: gutters }, uYardSky: YARD_SKY, uYardWet: YARD_WET,
        uFloorDye: { value: [new THREE.Color(stainHex[D.INDIGO]), new THREE.Color(stainHex[D.VIOLET])] }, uFloorStone: { value: new THREE.Color(QS.get('floorc') ? '#' + QS.get('floorc') : '#573840') },
        uFloorRot: { value: new THREE.Vector4(Math.cos(ang), Math.sin(ang), tSetts ? 1 : 0, 1 / 1.35) } },
      vertexPars: 'attribute vec4 aFloor; varying vec4 vFloor;',
      vertexLocal: 'vFloor = aFloor;',
      fragmentPars: /* glsl */`varying vec4 vFloor; uniform sampler2D tYardSetts; uniform vec4 uYardGut[YARD_GUT]; uniform vec3 uFloorDye[2]; uniform vec3 uFloorStone; uniform vec4 uFloorRot;
        ${WET_GLSL}
        float fH(vec2 p) { p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
        float fN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(fH(i), fH(i + vec2(1.0, 0.0)), f.x), mix(fH(i + vec2(0.0, 1.0)), fH(i + vec2(1.0, 1.0)), f.x), f.y); }
        float fSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0); return length(pa - ba * h); }
        vec3 fTile(vec2 uv) { return uFloorRot.z > 0.5 ? texture2D(tYardSetts, uv).rgb / vec3(0.388, 0.0725, 0.140) : vec3(1.0); }
        float fVal(vec2 uv) { return dot(fTile(uv), vec3(0.3333)); }`,
      albedo: /* glsl */`{ vec2 fp = vWPos.xz;
        float nE = fN(fp * 1.1) * 0.55 + fN(fp * 3.7) * 0.45;
        if (vFloor.x < 0.995 && vFloor.x < nE * 0.95 + 0.04) discard;               // the paving's ragged end
        vec2 uv = vec2(fp.x * uFloorRot.x - fp.y * uFloorRot.y, fp.x * uFloorRot.y + fp.y * uFloorRot.x) * uFloorRot.w;
        vec3 tx = fTile(uv); float val = dot(tx, vec3(0.3333));
        float ex = 0.0035, vx = fVal(uv + vec2(ex, 0.0)), vz = fVal(uv + vec2(0.0, ex));
        float jt = 1.0 - smoothstep(0.6, 0.88, val);                               // a joint between two setts
        float broad = fN(fp * 0.19 + 3.0), low = fN(fp * 0.43) * 0.62 + fN(fp * 1.27 + 5.0) * 0.38;      // the stone's own unevenness; the floor's hollows
        float dG = 1e3; for (int i = 0; i < YARD_GUT; i++) dG = min(dG, fSeg(fp, uYardGut[i].xy, uYardGut[i].zw));
        dG += (fN(fp * 6.0) - 0.5) * 0.02;
        float gut = 1.0 - smoothstep(0.078, 0.098, dG);                            // the liquor in a gutter
        float lip = smoothstep(0.098, 0.115, dG) * (1.0 - smoothstep(0.15, 0.2, dG));      // its two kerbs: long dark stones
        float slop = vFloor.y, nearG = exp(-dG / 0.5);
        float damp = smoothstep(0.3, 0.72, slop * 0.95 + 0.55 * nearG + (low - 0.5) * 1.0 + 0.1);
        // the liquor stands to a LEVEL: first in the joints, then over the low stones; the high setts stand out of it as
        // islands (the tile's light and dark read as the stones' height); deepest where the floor is lowest
        float hgt = smoothstep(0.55, 1.12, val);                                   // 0 in a joint .. 1 on a sett's crown
        float lvl = slop * 0.62 + 0.42 * nearG + (0.5 - low) * 1.25 + (broad - 0.5) * 0.3 - 0.02;
        float pf = smoothstep(hgt - 0.06, hgt + 0.06, lvl);
        float film = max(gut, pf) * (1.0 - lip * (1.0 - gut));
        float jf = pf * jt;
        vec3 dye = mix(uFloorDye[0], uFloorDye[1], clamp(vFloor.w + (broad - 0.5) * 0.5, 0.0, 1.0));
        // the stone
        vec3 st = uFloorStone * mix(vec3(val), tx, 0.22) * (0.8 + 0.42 * broad);
        st = mix(st, st * 1.22 + vec3(0.016, 0.01, 0.01), vFloor.z * 0.55 * (1.0 - damp));      // the trodden way along the kerb: paler, drier
        st *= mix(1.0, 0.72, lip);
        float stain = smoothstep(0.15, 0.85, slop * 0.9 + 0.7 * nearG + (fN(fp * 1.9 + 9.0) - 0.5) * 0.6 + 0.25 * damp) * 0.7;
        vec3 tint = dye / max(max(dye.r, max(dye.g, dye.b)), 1e-3);
        st = mix(st, st * (0.3 + 0.9 * tint), stain);                             // dye soaked into the stone: a glaze
        st *= mix(1.0, 0.6, damp);
        albedo = mix(st, dye * 0.42, film * 0.88);
        // the tile's relief turns each sett's shoulder to the low sun (none under a film: a liquid lies level)
        vec2 gr = vec2(vx - val, vz - val) / ex * 0.0034 * (1.0 - film);
        vec3 bx = vec3(uFloorRot.x, 0.0, -uFloorRot.y), bz = vec3(uFloorRot.y, 0.0, uFloorRot.x);
        N = normalize(vec3(0.0, 1.0, 0.0) - (bx * gr.x + bz * gr.y) * 1.0);
        gYardWet = max(film, damp * 0.34);
      }`,
      light: /* glsl */`c = yardSheen(c, N, V, gYardWet * 0.66, yardKey(vWPos));`,
    };
    const fm = kit.gouache({ color: '#ffffff', brush: 0.5, extend: [shared.sun ? shared.sun.extend : null, floorExt] });
    fm.polygonOffset = true; fm.polygonOffsetFactor = -1; fm.polygonOffsetUnits = -2;
    const mesh = new THREE.Mesh(geo, fm); mesh.name = 'yard floor'; mesh.matrixAutoUpdate = false;
    ctx.add(mesh);
    if (shared.sun && shared.sun.solid) shared.sun.solid(mesh, false);
    counts.floor = { points: pos.length / 3, triangles: idx.length / 3, gutters: NG };
    shared.gutters = gutters.map((g) => ({ from: [g.x, yF, g.y], to: [g.z, yF, g.w] }));      // (for the cast: where liquor runs to each of the causeway's spouts)
  }

  const made = flush();
  // the washes: one mesh, laid over the picture as a glaze (see `washes`)
  if (washes.n) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(washes.pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(washes.nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(washes.uv, 2));
    geo.setAttribute('aDye', new THREE.BufferAttribute(new Uint8Array(washes.dye), 4, true)); geo.setAttribute('aDye2', new THREE.BufferAttribute(new Uint8Array(washes.dye2), 4, true));
    geo.setIndex(washes.idx); geo.computeBoundingSphere();
    const wm = kit.gouache({ color: '#ffffff', brush: 0, transparent: true, extend: [shared.sun ? shared.sun.extend : null, washExt] });
    // out = what is there x the tint  +  the tint x (the dye's body in the light); the picture's alpha (the painter's marks) is left as it is
    wm.blending = THREE.CustomBlending; wm.blendEquation = THREE.AddEquation; wm.blendSrc = THREE.SrcAlphaFactor; wm.blendDst = THREE.SrcColorFactor; wm.blendSrcAlpha = THREE.ZeroFactor; wm.blendDstAlpha = THREE.OneFactor;
    wm.depthWrite = false; wm.polygonOffset = true; wm.polygonOffsetFactor = -2; wm.polygonOffsetUnits = -2;
    const mesh = new THREE.Mesh(geo, wm); mesh.name = 'yard washes'; mesh.matrixAutoUpdate = false; mesh.frustumCulled = false; mesh.renderOrder = 2;
    if (QS.get('wash') !== '0') ctx.add(mesh);
    if (shared.sun && shared.sun.solid) shared.sun.solid(mesh, false);
    counts.washes = { points: washes.n, triangles: washes.idx.length / 3 };
  }
  counts.triangles = made.tris; counts.meshes = made.meshes; counts.points = made.points; counts.trianglesBy = triBy; counts.light = LIGHT;
  if (QS.has('counts')) fetch('/__shot/reach_ky_counts.json', { method: 'POST', body: JSON.stringify(counts, null, 1) }).catch(() => {});      // &counts=1: what was stood, to .shots/reach_ky_counts.json
  shared.yards = { counts, land, level, toWater };
  ctx.state.yardCounts = counts;
  return { update() { const k = (shared.reach && shared.reach.k) || 0; YARD_SKY.value.copy(skyA).lerp(skyB, k); } };
}
