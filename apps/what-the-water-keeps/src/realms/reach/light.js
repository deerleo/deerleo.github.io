// The dyers' reach: the sun, and the light it sends through cloth. (The area's own light helper: set.js makes it and
// publishes it as shared.sun; every module that hangs cloth registers it here.)
//
// The page's rule (docs/art/reach.md, section 2 and the director's first "must not get wrong"): THE SUN AND THE PICTURE
// MUST AGREE. The light is dyed only while a cloth is visibly across the sun from where the rider is; the sun sinks
// only with the rider's furthest progress; it never shows through timber.
//
// What is here:
//   the sun itself     a painter's disc, drawn with the sky at the far plane WITH the depth test, so every solid thing
//                      hides it (timber, stone, cloth, the boat). Its height follows the furthest s reached.
//   its glow           the sun's light in the haze: drawn over the picture after the water, as much of it as there is
//                      haze in front of each pixel (the scene's depth; for the water, the distance to its surface). The
//                      sky glows in full, far things dissolve into gold, near things stand dark against it.
//   the coin           cloth is opaque, so cloth hides the disc; instead every cloth fragment that lies within a few
//                      degrees of the sun's direction adds the sun as seen through that dye (sun.dress(material)).
//                      How much comes through is read from the sun mask.
//   the sun mask       a small picture (128 px, 7 degrees) taken from the eye straight at the sun before every frame:
//                      red = something solid stands on that line of sight, green = how many cloths hang on it. One
//                      cloth: the coin at full strength. Two: 0.35. Three, or timber anywhere behind: none. So a mast
//                      or a wheel arm behind a glowing cloth shows as a dark bar across the coin: no sun through timber.
//   the cover test     on the CPU, five rays across the disc against every registered bolt (a rectangle) and the
//                      wheel's gores (makeGores.covers): what the nearest cloth on each ray is dyed. From it the
//                      light eases (1.2 s) toward mix(bare, dyed, cover): look.light.keyColor, the water's sun path,
//                      the glow, the light behind cloth.
//   the dyed bar       a cloth across the sun shadows only what stands behind it. So the dyed light falls in a bar
//                      along the sun's direction, `sun.spread` metres either side of the rider (14 m: the whole nave),
//                      and only on the lagoon side of that cloth; beyond the bar the sun is bare. (The key colour in
//                      ctx.look is the dyed one: the boat, the water's film and anything that does not know better take
//                      it. Things built with shared.mat.solid, or a model given `extend: shared.sun.extend`, and all
//                      dressed cloth work out the bar for themselves.) Staging can widen the bar to the whole reach
//                      for the showstopper's dusk: stage.tween(shared.sun, 'spread', 400, 3).
//   lit from behind    the engine's cloth multiplies its back-light by the key colour, which is right for one sun but
//                      turns violet and indigo cloth to brown under a red one. Dressed cloth glows in its dye's own
//                      lit-from-behind colour (PLAN.dyes[].back, .through), scaled by the strength of the light, and
//                      by how much sun reaches it past the cloth that hangs between it and the sun (`aReachLit`).
//
// For builders:  shared.sun.cloth(handle, bolts)   after makeCloth(ctx, bolts, ...): coin, back-light, mask, cover test
//                shared.sun.gores(handle, dyes)    after makeGores: the same for the wheel's cloth (dyes: () => [{top, hem}])
//                shared.sun.drape(handle)          swags, silks, any other cloth made on kit.gouache: coin, back-light, mask
//                shared.sun.extend                 a kit.gouache `extend` for solid things: kit.model(url, { extend: shared.sun.extend })
//                shared.sun.solid(mesh, false)     leave a solid thing out of the mask (a thing that moves in its own vertex
//                                                  shader must be left out, or registered as cloth)
//                shared.sun.dir, .elevation, .bare, .light (the eased colour of the light), .strength, .cover, .far, .spread
// Developer switches: &far=<s> pretends the rider has been as far as s (sets the sun's height); &sunmask=1 shows the mask;
// &bare=1 no cloth ever dyes the light; &spread=<m> the half width of the dyed bar.
import * as THREE from 'three';
import { PLAN, sunElevation, sunSize } from './plan.js';

const RAD = Math.PI / 180;
const L_SOLID = 10, L_CLOTH = 11;                                 // layers only the mask's camera sees
const QS = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
const col = (c) => new THREE.Color(c);
const norm = (c) => { const m = Math.max(c.r, c.g, c.b, 1e-4); return [c.r / m, c.g / m, c.b / m]; };
const DYES = PLAN.dyes.map((d) => ({ ...d, c: col(d.color), n: norm(col(d.color)), b: col(d.back), k: col(d.coin).multiplyScalar(d.coinGain), l: col(d.light) }));
const f3 = (v) => `vec3(${v.map((x) => x.toFixed(4)).join(', ')})`;

/** How near a colour is to each dye of the scale (weights that add up to 1). The same sum the shader does. */
export function dyeWeights(color, out = []) {
  const q = norm(color); let sum = 0;
  for (let i = 0; i < DYES.length; i++) { const n = DYES[i].n, d = (q[0] - n[0]) ** 2 + (q[1] - n[1]) ** 2 + (q[2] - n[2]) ** 2, w = 1 / ((d + 0.002) * (d + 0.002)); out[i] = w; sum += w; }
  for (let i = 0; i < DYES.length; i++) out[i] /= sum;
  return out;
}

// GLSL: the dyed bar. The sun stands on world -z, so the bar lies along z through the rider's x.
const BAND_GLSL = /* glsl */`
  uniform vec3 uReachBare; uniform vec4 uReachBand;        // the bare sun's colour; the rider's x, the bar's half width, the z of the cloth across the sun, the light's strength inside the bar
  float reachIn(vec3 p) { return (1.0 - smoothstep(uReachBand.y, uReachBand.y * 2.0, abs(p.x - uReachBand.x))) * smoothstep(uReachBand.z - 4.0, uReachBand.z + 2.0, p.z); }
  vec3 reachKey(vec3 p, vec3 dyed) { return mix(uReachBare, dyed, reachIn(p)); }
`;
// GLSL shared by every dressed cloth: its dye's lit-from-behind colour and its coin, and the sun's coin itself
const DYE_GLSL = BAND_GLSL + /* glsl */`
  uniform vec3 uReachSunDir, uReachBack, uReachAmbient, uReachCoinTint, uReachRib, uReachHeart; uniform vec4 uReachCoin, uReachCoinB, uReachHalo; uniform float uReachMaskOn, uReachVeil, uReachDeep, uReachPre, uReachHot, uReachTau, uReachUp, uReachFlat; uniform vec2 uReachInto, uReachCap, uReachNext; uniform vec3 uReachFace;
  uniform sampler2D tReachMask; uniform mat4 uReachMaskMat;
  vec3 gReachNext, gReachNextChip, gReachPrev;             // (reachDye leaves them) the next dye of the scale: what it is lit from behind, and its own hue; the dye before it, lit from behind
  float gReachDeepK, gReachUpK;                            // (fifth look, dye by dye) how much of the rib's deepening this dye takes; how far its open cloth glows toward the dye before it
  float gReachTop, gReachFloor, gReachRun;                 // (reachDye leaves them) how light the cloth's own dye is (its chip's brightest channel); how far down its shade may go (a share of that); how far its shade runs toward the next dye
  void reachDye(vec3 a, out vec3 back, out vec3 coin, out float gl) {
    float m = max(max(a.r, a.g), max(a.b, 1e-4));
    vec3 q = a / m;
    vec3 chip[6]; vec3 bk[6]; vec3 cn[6]; vec2 mx[6]; vec3 nb[6]; vec3 nc[6]; vec2 fl[6]; vec3 pv[6]; vec2 du[6];
    ${DYES.map((d, i) => { const q = DYES[Math.max(i - 1, 0)]; return `pv[${i}] = ${f3([q.b.r, q.b.g, q.b.b])}; du[${i}] = vec2(${(((PLAN.sun.ribDeepBy || [])[i]) ?? 1).toFixed(3)}, ${(((PLAN.sun.glowUpBy || [])[i]) ?? 0).toFixed(3)});`; }).join(' ')}
    ${DYES.map((d, i) => `fl[${i}] = vec2(${(((PLAN.sun.faceFloor || [])[i]) ?? 0.4).toFixed(3)}, ${(((PLAN.sun.faceNext || [])[i]) ?? 0.5).toFixed(3)});`).join(' ')}
    ${DYES.map((d, i) => `chip[${i}] = ${f3(d.n)}; bk[${i}] = ${f3([d.b.r, d.b.g, d.b.b])}; cn[${i}] = ${f3([d.k.r, d.k.g, d.k.b])}; mx[${i}] = vec2(${Math.max(d.c.r, d.c.g, d.c.b).toFixed(4)}, ${d.through.toFixed(3)});`).join('\n    ')}
    ${DYES.map((d, i) => { const n = DYES[Math.min(i + 1, DYES.length - 1)], k = i + 1 < DYES.length ? 1 : 0.55; return `nb[${i}] = ${f3([n.b.r * k, n.b.g * k, n.b.b * k])}; nc[${i}] = ${f3(n.n)};`; }).join('\n    ')}
    back = vec3(0.0); coin = vec3(0.0); float sum = 0.0; vec2 top = vec2(0.0); gReachNext = vec3(0.0); gReachNextChip = vec3(0.0); gReachFloor = 0.0; gReachRun = 0.0; gReachPrev = vec3(0.0); gReachDeepK = 0.0; gReachUpK = 0.0;
    for (int i = 0; i < 6; i++) { vec3 d = q - chip[i]; float w = 1.0 / (dot(d, d) + 0.002); w *= w; back += bk[i] * w; coin += cn[i] * w; top += mx[i] * w; gReachNext += nb[i] * w; gReachNextChip += nc[i] * w; gReachFloor += fl[i].x * w; gReachRun += fl[i].y * w; gReachPrev += pv[i] * w; gReachDeepK += du[i].x * w; gReachUpK += du[i].y * w; sum += w; }
    gReachTop = top.x / sum; gReachFloor /= sum; gReachRun /= sum; gReachDeepK /= sum; gReachUpK /= sum;
    // the cloth's own unevenness (the dye never takes evenly, the wet band, the brush) carries into what comes through it
    float mod_ = clamp(m * sum / max(top.x, 1e-4), 0.3, 1.3);
    back *= mod_ / sum; coin *= mix(1.0, mod_, 0.5) / sum; gl = top.y / sum; gReachNext *= mod_ / sum; gReachNextChip /= sum; gReachPrev *= mod_ / sum;
  }
  // THE DYER'S SCALE RUNS INTO THE SHADOWS (third look). The shade of a cloth is not a darker cloth: it is the NEXT DYE of
  // the scale (the key painting: gold cloth has orange and red folds, red cloth crimson ones, violet cloth blue ones).
  // The face of a cloth where the engine's draped cloth has modelled it dark (d: 0..1) goes that far toward the next dye's hue.
  vec3 reachShade(vec3 a, float d) {
    float m = max(max(a.r, a.g), max(a.b, 1e-4)), nm = max(max(gReachNextChip.r, gReachNextChip.g), max(gReachNextChip.b, 1e-4));
    return mix(a, gReachNextChip * (m / nm), clamp(uReachNext.y * d, 0.0, 1.0));
  }
  // THE FACE OF A CLOTH (fourth look). A dye is not a paint. What a dyed cloth shows of the light that falls on it is its
  // own colour from full value down to a FLOOR (gReachFloor: a share of its dye's own value, set dye by dye), and as it
  // goes into its shade its HUE runs down the dyer's scale: gold cloth is orange in its folds and red in its deepest,
  // red cloth crimson, violet cloth blue. Multiplied down like paint, saffron in the rose shade of this sky is rust and
  // its folds are brown: a nave of planks. a: the cloth's painted colour here (its dye times all the engine has painted
  // into it: mottle, water line, the form of its folds); Lv: the light that falls on it; amb: the sky's share of that.
  // (Call reachDye(a, ...) first.)
  vec3 reachFace(vec3 a, vec3 Lv, vec3 amb) {
    float m = max(max(a.r, a.g), max(a.b, 1e-4));
    float k = m / max(gReachTop, 1e-3);                               // the paint's own value beside its dye's chip: 1 = the chip; less in a fold, a water line, a streak
    float dk = 1.0 - smoothstep(uReachFace.x, 1.0, k);                // how far into its own shade
    vec3 hue = mix(a / m, gReachNextChip, clamp(uReachNext.y * gReachRun * dk, 0.0, 1.0));
    hue /= max(max(hue.r, hue.g), max(hue.b, 1e-4));
    float val = gReachTop * (gReachFloor + (1.0 - gReachFloor) * min(k, 1.0) + max(k - 1.0, 0.0));
    float ls = dot(Lv, vec3(0.3, 0.5, 0.2));
    return hue * val * ls * mix(vec3(1.0), Lv / max(ls, 1e-3), uReachFace.z);      // (the light as a level, and a little of its own colour: not all of it)
  }
  // how much of the light behind a cloth comes through toward the eye: most along the line to the sun, less to the
  // sides; and less where a fold turns the weave edge-on to the light
  float reachThrough(vec3 V, vec3 N, vec3 keyDir) {
    float vd = max(dot(V, keyDir), 0.0), fold = pow(abs(dot(N, keyDir)), 4.0);
    return (0.42 * vd * vd + 0.58 * pow(vd, 7.0)) * (0.28 + 0.72 * fold);
  }
  // what a cloth gives off, lit from behind: what the sky and the cloth behind it send through it (most toward an eye
  // that looks into the light, and in RIBS: where a fold turns the weave edge-on, less comes through), and the sun's
  // own light as far as it reaches it. THIS IS THE AREA'S LIGHT: cloth that hangs between the eye and the west is
  // brighter than the sky behind it, in its dye's own lit colour, and its folds are drawn in it as darker, deeper ribs.
  // form: how much this place of the cloth lets through beside its neighbours (its ribs): the coin wears it too.
  // thru: what the cloth itself says of this place (1: plain single cloth; less in a pleat, in the valley of a fold, where
  // it lies double; more where it is soaked, at its frayed hem, on the middle of a lobe): the engine's draped cloth's
  // clothThru, a gore's or a swag's CLOTH_THRU, 1 for any other cloth.
  vec3 reachGlow(vec3 back, float gl, vec3 V, vec3 N, vec3 keyDir, float lit, float uBack_, vec3 p, float thru, out float form) {
    vec3 kh = normalize(vec3(keyDir.x, 0.0, keyDir.z) + vec3(0.0, 0.0, 1e-5)), vh = normalize(vec3(V.x, 0.0, V.z) + vec3(1e-5, 0.0, 0.0));
    // What stands behind the cloth, seen from here: the west (into = 1), the sky to the side (0.5), the dusk in the east (0).
    // An eye that looks UP through a cloth looks at the high sky, which is not the west: less comes through (uReachInto.y)
    float into = 0.5 + 0.5 * dot(normalize(vec3(V.x, V.y * uReachInto.y, V.z) + vec3(1e-5, 0.0, 0.0)), kh);
    float f = max(abs(dot(N, kh)), abs(dot(N, vh)) * 0.8);
    // (sixth look) CLOTH THAT LIES LEVEL OVERHEAD (a slung silk, a streamer) stands open to an eye that looks up THROUGH it at
    // the sky: as found it counted as edge-on to everything (both terms above are level) and was one flat rib from tie to tie
    f = max(f, abs(dot(N, V)) * uReachFlat);
    // HOW OPEN THE CLOTH STANDS TO THE LIGHT HERE (third look): square to it, single, thin = 1; turned edge-on, in a valley,
    // in a pleat, double = toward 0. One number draws the fold: where it is open the cloth is its dye's lit colour, and a
    // little hotter than that on the middle of a lobe; where it is closed it is a RIB: darker, and deeper in the dye's own
    // colour (the rib of a saffron cloth is orange, then red; of a madder cloth wine)
    // (fourth look) by the length of the light's way through the weave, exp(-tau (1 / f - 1)), not by f squared: with the
    // square only the very crest of a fold was open and its whole flank was rib: dark boards with bright gaps, the inverse
    // of the page's picture (glowing cloth, and in it ribs of darker colour)
    float open = exp(-uReachTau * (1.0 / max(f, 0.06) - 1.0)) * min(thru, 1.0), rib = uReachRib.x + (1.0 - uReachRib.x) * open;
    vec3 deep = pow(max(mix(back, gReachNext, clamp(uReachNext.x * gReachRun * (1.0 - open), 0.0, 1.0)), vec3(1e-3)), vec3(1.0 + uReachDeep * gReachDeepK * (1.0 - open)));
    // (fifth look) AND THE SCALE RUNS UP INTO THE LIGHT: where the cloth stands wholly open to the light (square to it, single,
    // thin) what comes through is a step toward the dye BEFORE it: red cloth glows orange where it is thinnest, violet cloth
    // rose, gold cloth pale (the key painting's curtains: orange lights, crimson folds, wine in the deepest)
    deep = mix(deep, gReachPrev, clamp(uReachUp * gReachUpK * open * open, 0.0, 1.0));
    float hot = smoothstep(0.55, 1.0, f * f) * smoothstep(0.9, 1.3, thru);
    vec3 light_ = pow(max(back, vec3(1e-3)), vec3(0.75));
    deep = mix(deep, light_, uReachHot * hot) * (1.0 + 0.45 * uReachHot * hot + 0.3 * max(thru - 1.0, 0.0));
    form = rib;
    vec3 g = deep * (uReachAmbient * sqrt(gl) * (uReachRib.y * (0.6 + 0.8 * into) + uReachRib.z * pow(into, uReachInto.x)) * rib + uReachBack * (reachThrough(V, N, keyDir) * lit * gl * uBack_ * 1.7 * mix(1.0, uReachBand.w, reachIn(p))) * (0.35 + 0.65 * min(thru, 1.2)));
    // (the page: backlit cloth up to 1.35 times its lit-from-behind colour and never to white; cream up to 1.5)
    // (a SOFT top: clipped hard, every cloth that looked into the light was one flat poster colour from edge to edge)
    vec3 cap_ = max(mix(back, light_, uReachHot) * (uReachCap.x + uReachCap.y * gl * gl), vec3(1e-3));
    return cap_ * (1.0 - exp(-1.5 * g / cap_));
  }
  // The sun seen through this cloth: p is the fragment's place in the world, eye the camera of the pass in progress.
  // NEVER A FLAT DISC (a sticker on the cloth): where the sun stands the cloth is lighter, most at the disc's middle, with
  // the sun's own gold in its heart; round it the weave scatters the light into a halo of the dye's lit colour that
  // reaches several discs out; and the cloth's own folds and streaks lie across all of it (form).
  vec3 reachCoin(vec3 p, vec3 eye, vec3 coin, vec3 back, float form) {
    vec3 rd = normalize(p - eye);
    float ca = dot(rd, uReachSunDir);
    if (ca < uReachHalo.x) return vec3(0.0);
    float ang = acos(min(ca, 1.0));
    float disc = 1.0 - smoothstep(uReachCoinB.x, uReachCoinB.y, ang);       // full within the inner angle, gone by the outer
    float heart = max(1.0 - ang / uReachCoinB.y, 0.0);                      // 1 at the sun's middle .. 0 at the disc's edge
    float halo = 0.7 * exp(-ang * ang / (uReachHalo.y * uReachHalo.y)) + 0.3 * exp(-ang * ang / (uReachHalo.y * uReachHalo.y * 7.0));
    float T = 1.0;
    if (uReachMaskOn > 0.5) {
      vec4 h = uReachMaskMat * vec4(eye + rd, 1.0);
      vec4 m = texture2D(tReachMask, clamp(h.xy / h.w * 0.5 + 0.5, 0.0, 1.0));
      float layers = m.g * 8.0;                                           // this cloth counts as one
      T = (1.0 - smoothstep(0.2, 0.8, m.r)) * mix(1.0, uReachCoin.z, smoothstep(1.25, 1.85, layers)) * (1.0 - smoothstep(2.25, 2.85, layers));
    }
    float lum = max(max(coin.r, coin.g), coin.b);
    vec3 core = mix(coin * (uReachCoinB.w + (1.0 - uReachCoinB.w) * heart * heart), uReachHeart * lum, clamp(uReachCoinB.z * pow(heart, uReachCoin.x), 0.0, 1.0));      // its limb in the dye's colour, its heart the sun's own gold
    vec3 c = core * uReachCoinTint * disc * disc + back * (halo * uReachHalo.z * (0.35 + 0.65 * lum));
    return c * (T * mix(1.0, form, uReachHalo.w) * uReachCoin.w * (1.0 - uReachVeil));
  }
`;
const SHADE_KEY = 'uRampLight * uKeyColor, smoothstep(0.5, 1.0, w)';        // in the engine's two shade lines (gouache and cloth)

export function makeSun(ctx) {
  const { engine, kit } = ctx, S = PLAN.sun, renderer = engine.renderer;
  const sun = {
    far: QS.has('far') ? +QS.get('far') : 0,          // the furthest s the rider has reached
    elevation: S.elevation[0][1], size: S.size[0][1],
    dir: new THREE.Vector3(0, 0, -1),                 // the way TO the sun
    bare: col(S.color[0][1]),                         // its own colour now (by height)
    light: col(S.color[0][1]),                        // the colour of the light now (bare, or dyed by the cloth across it), eased
    strength: 1, cover: 0,                            // eased
    spread: QS.has('spread') ? +QS.get('spread') : S.spread,      // half width of the dyed bar, metres (staging may tween it)
    shadeZ: -1e4,                                     // the z of the cloth across the sun: the bar lies on the lagoon side of it
    now: { cover: 0, strength: 1, light: col(S.color[0][1]), z: -1e4 },      // what the cover test found this frame, before easing
    bolts: [], goreSets: [], wind: null,
  };
  const stops = S.color.map(([e, c]) => [e, col(c)]);
  const colorAt = (e, out) => {
    if (e >= stops[0][0]) return out.copy(stops[0][1]);
    for (let i = 1; i < stops.length; i++) if (e >= stops[i][0]) return out.copy(stops[i][1]).lerp(stops[i - 1][1], (e - stops[i][0]) / (stops[i - 1][0] - stops[i][0]));
    return out.copy(stops[stops.length - 1][1]);
  };

  // ---------------------------------------------------------------------------------------------- uniforms
  const U = {
    uReachSunDir: { value: sun.dir },
    uReachBare: { value: new THREE.Color(1, 1, 1) },
    uReachBand: { value: new THREE.Vector4(0, S.spread, -1e4, 1) },
    uReachBack: { value: new THREE.Color(1, 1, 1) },                     // the light behind cloth: a tint times a level
    uReachAmbient: { value: new THREE.Color(0.3, 0.3, 0.3) },            // what the sky sends through cloth wherever it hangs
    uReachCoinTint: { value: new THREE.Color(1, 1, 1) },
    uReachHeart: { value: col(S.coin.gold || '#FFD890') },                // the sun's own gold in the heart of its coin
    uReachRib: { value: new THREE.Vector3(S.ribDark ?? 0.3, S.ribAway ?? 0.55, S.ribInto ?? 1.5) }, uReachDeep: { value: S.ribDeep ?? 1.2 }, uReachHot: { value: S.ribHot ?? 0 }, uReachNext: { value: new THREE.Vector2((S.ribNext && S.ribNext[0]) ?? 0, (S.ribNext && S.ribNext[1]) ?? 0) },      // how far a rib's glow, and the shade of a cloth's face, go toward the next dye of the scale      // how dark a rib is; the glow toward an eye that looks away from the light; and more of it looking into the light
    uReachCoin: { value: new THREE.Vector4(S.coin.heartPow ?? 2, 0, S.coin.second, S.coin.gain ?? 1) },      // how narrowly the gold gathers in its heart (a power: 2 a point, 1 most of the disc); (free); through a second cloth; its strength
    // the coin as a soft disc: its inner and outer angle (radians), how much of the sun's own gold stands in its heart, how bright its edge is beside its middle
    uReachCoinB: { value: new THREE.Vector4(S.coin.inner * RAD, S.coin.outer * RAD, S.coin.heart ?? 0, S.coin.edge ?? 1) },
    // the halo the weave scatters round it: the cosine of how far it reaches, its width (radians), its strength, how much of the cloth's own form lies across coin and halo
    uReachHalo: { value: new THREE.Vector4(Math.cos(((S.halo && S.halo.reach) ?? S.coin.outer) * RAD), ((S.halo && S.halo.width) ?? 3) * RAD, (S.halo && S.halo.strength) ?? 0, (S.halo && S.halo.form) ?? 0) },
    uReachInto: { value: new THREE.Vector2(S.ribPow ?? 4, S.ribUp ?? 0) },
    uReachUp: { value: S.glowUp ?? 0 },                                  // how far wholly open cloth glows toward the dye before its own (times glowUpBy, dye by dye)
    uReachFlat: { value: S.ribFlat ?? 0 },                               // how open cloth that lies level stands to an eye that looks up through it (0: as it was)
    uReachTau: { value: S.ribTau ?? 0.5 },                               // how fast the light dies as the weave turns edge-on (the weave's thickness)
    uReachFace: { value: new THREE.Vector3((S.face && S.face[0]) ?? 0.25, (S.face && S.face[1]) ?? 0.6, (S.face && S.face[2]) ?? 0.35) },      // the face of a cloth: below this share of its chip's value in the open shade it is wholly in its shade; how much lighter than its chip the sun makes it; how much of the light's own colour it takes
    uReachCap: { value: new THREE.Vector2((S.cap && S.cap[0]) ?? 1.35, (S.cap && S.cap[1]) ?? 0.15) },      // the brightest a backlit cloth may be, times its lit-from-behind colour; and that much more for cream      // how narrowly the glow gathers toward an eye that looks into the light; how much an eye that looks up loses of it
    uReachMaskOn: { value: 1 }, uReachVeil: engine.shared.uVeil,      // the coin dies with the veil between areas
    uReachPre: { value: 0 },                                           // 1 while the engine draws the scene without the water (the picture the water looks down into)
    tReachMask: { value: null }, uReachMaskMat: { value: new THREE.Matrix4() },
  };
  sun.uniforms = U;
  /** For solid things (kit.gouache({ extend: sun.extend }), kit.model(url, { extend: sun.extend })): the bare sun outside the dyed bar. */
  sun.extend = {
    uniforms: { uReachBare: U.uReachBare, uReachBand: U.uReachBand },
    fragmentPars: BAND_GLSL,
    light: 'c += albedo * (smoothstep(0.5, 1.0, w) * uShade) * uRampLight * (reachKey(vWPos, uKeyColor) - uKeyColor);',
  };

  // ---------------------------------------------------------------------------------------------- the disc and its glow
  const EXT = Math.tan(S.glow.across * 0.5 * RAD);
  const sunVert = /* glsl */`
    uniform vec3 uDir, uRight, uUp; uniform vec4 uDisc; varying vec2 vQ; varying vec3 vRay;
    void main() {
      vQ = position.xy * uDisc.z;                                         // the tangent of the angle from the sun's centre
      vRay = uDir + uRight * vQ.x + uUp * vQ.y;
      vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + vRay * 400.0, 1.0);
      gl_Position = p.xyww;                                               // at the far plane
    }`;
  const haloGLSL = /* glsl */`
    float sunHalo(vec2 q, float ext) { float g = length(q) / ext; return pow(max(1.0 - g, 0.0), 2.6) + 0.9 * exp(-g * g * 60.0); }`;
  const sunU = { uVeil: engine.shared.uVeil, uDir: { value: sun.dir }, uRight: { value: new THREE.Vector3(1, 0, 0) }, uUp: { value: new THREE.Vector3(0, 1, 0) },
    uCore: { value: col(S.core).multiplyScalar(S.coreGain) }, uLimb: { value: new THREE.Color() }, uGlow: { value: new THREE.Color() }, uDisc: { value: new THREE.Vector4(0.02, 1, EXT, 0) } };
  const discMat = new THREE.ShaderMaterial({
    uniforms: { ...sunU, uMirror: { value: 0 } },
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: sunVert,
    fragmentShader: /* glsl */`
      uniform vec3 uCore, uLimb, uGlow; uniform vec4 uDisc; uniform float uVeil, uMirror; varying vec2 vQ;
      ${haloGLSL}
      void main() {
        float r = length(vec2(vQ.x, vQ.y / uDisc.y)) / uDisc.x;           // 1 at the limb
        float disc = 1.0 - smoothstep(0.93, 1.05, r);
        vec3 c = mix(uCore, uLimb, smoothstep(0.25, 1.0, r)) * disc;
        if (uMirror > 0.5) c += uGlow * sunHalo(vQ, uDisc.z);             // in the water's mirror the sky carries its glow itself
        gl_FragColor = vec4(c * (1.0 - uVeil), 1.0);
      }`,
  });
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), discMat);
  disc.name = 'sun'; disc.frustumCulled = false; disc.renderOrder = -998;      // after the sky and the stars, before the water
  disc.onBeforeRender = () => { discMat.uniforms.uMirror.value = engine.reflecting ? 1 : 0; discMat.uniformsNeedUpdate = true; };
  ctx.add(disc);
  sun.disc = disc;
  const hazeMat = new THREE.ShaderMaterial({
    uniforms: { ...sunU, tDepth: { value: null }, uHas: { value: 0 }, uRes: { value: new THREE.Vector2(1600, 900) }, uNearFar: { value: new THREE.Vector2(0.08, 1800) },
      uFwd: { value: new THREE.Vector3(0, 0, -1) }, uFogDensity: engine.shared.uFogDensity },
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: sunVert,
    fragmentShader: /* glsl */`
      uniform vec3 uGlow, uFwd; uniform vec4 uDisc; uniform float uVeil, uHas, uFogDensity; uniform vec2 uRes, uNearFar; uniform sampler2D tDepth;
      varying vec2 vQ; varying vec3 vRay;
      ${haloGLSL}
      void main() {
        vec3 rd = normalize(vRay);
        float dist = 1.0e5;
        if (uHas > 0.5) {
          float d = texture2D(tDepth, gl_FragCoord.xy / uRes).r;
          if (d < 0.99999) dist = (uNearFar.x * uNearFar.y) / (uNearFar.y - d * (uNearFar.y - uNearFar.x)) / max(dot(rd, uFwd), 0.05);
        }
        if (rd.y < -1.0e-4) dist = min(dist, cameraPosition.y / -rd.y);     // the water's own surface
        float haze = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
        gl_FragColor = vec4(uGlow * sunHalo(vQ, uDisc.z) * haze * (1.0 - uVeil), 1.0);
      }`,
  });
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), hazeMat);
  haze.name = 'sun haze'; haze.frustumCulled = false; haze.renderOrder = 1;    // after the water
  const _size = new THREE.Vector2(), _fwd = new THREE.Vector3();
  haze.onBeforeRender = (r, sc, cam) => {
    const rt = r.getRenderTarget(), pre = engine.pre, u = hazeMat.uniforms;
    // never read the scene's depth while it is being drawn (the engine's pass without the water)
    const ok = !!(pre && pre.depthTexture) && rt !== pre && (engine.paintAmount > 0 || engine.water.needsScene);
    u.tDepth.value = ok ? pre.depthTexture : null; u.uHas.value = ok ? 1 : 0;
    if (rt) u.uRes.value.set(rt.width, rt.height); else u.uRes.value.copy(r.getDrawingBufferSize(_size));
    u.uNearFar.value.set(cam.near, cam.far); cam.getWorldDirection(_fwd); u.uFwd.value.copy(_fwd);
    hazeMat.uniformsNeedUpdate = true;
  };
  ctx.add(haze); ctx.only(haze, 'direct');
  sun.haze = haze;

  // ---------------------------------------------------------------------------------------------- the sun mask
  const MASK = 128, HALF = S.coin.outer + 0.9;
  const maskRT = new THREE.WebGLRenderTarget(MASK, MASK, { depthBuffer: false, type: THREE.UnsignedByteType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
  maskRT.texture.name = 'reach sun mask'; maskRT.texture.wrapS = maskRT.texture.wrapT = THREE.ClampToEdgeWrapping;
  U.tReachMask.value = maskRT.texture;
  ctx.onDispose(() => maskRT.dispose());
  const maskCam = new THREE.PerspectiveCamera(HALF * 2, 1, 0.4, 1600);
  const solidMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, fog: false, depthTest: false, depthWrite: false });
  const twins = new Map();                                             // a cloth's material -> the one that only counts it
  const draped = new Set();                                            // meshes that hang as cloth
  const left = new WeakSet();                                          // solid things told to stay out of the mask
  // a gouache vertex shader with nothing of anyone's own in it (an extension that only adds to the fragment shader leaves it so)
  const plainVertex = kit.gouache({}).vertexShader;
  const twinOf = (mat) => {
    let t = twins.get(mat);
    if (!t) {
      t = new THREE.ShaderMaterial({ uniforms: mat.uniforms, defines: mat.defines, vertexShader: mat.vertexShader, vertexColors: mat.vertexColors,
        fragmentShader: 'void main() { gl_FragColor = vec4(0.0, 0.125, 0.0, 0.0); }',
        side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, fog: false });
      twins.set(mat, t);
    }
    return t;
  };
  ctx.onDispose(() => { for (const t of twins.values()) t.dispose(); solidMat.dispose(); });
  // Which things of the realm stand in the mask, and as what. Looked over again now and then (things are added and
  // taken away while an area is being built, and ctx.only() resets an object's layers).
  let swept = -1, children = -1;
  const sweep = () => {
    ctx.group.traverse((o) => {
      if (!o.isMesh || !o.material || Array.isArray(o.material)) return;
      if (o.userData.reachMaskOnly) { o.layers.set(L_CLOTH); return; }                   // a cloth's coarse twin: the mask's camera alone sees it
      o.layers.disable(L_SOLID); o.layers.disable(L_CLOTH);
      if (!o.layers.isEnabled(0) && !o.layers.isEnabled(1)) return;                    // it exists only in the water's mirror
      if (draped.has(o)) { o.layers.enable(L_CLOTH); return; }
      const m = o.material;
      if (left.has(o) || o === disc || o === haze || o.name === 'sky' || o.name === 'water') return;
      if (m.transparent || m.blending !== THREE.NormalBlending || m.depthWrite === false || m.depthTest === false || m.visible === false) return;
      if (m.isShaderMaterial && !(m.isGouache && m.vertexShader === plainVertex)) return;      // it moves in a vertex shader of its own: not ours to draw
      o.layers.enable(L_SOLID);
    });
  };
  const _eye = new THREE.Vector3(), _t = new THREE.Vector3(), _clear = new THREE.Color();
  const renderMask = () => {
    const scene = engine.scene;
    let n = 0; ctx.group.traverse(() => { n++; });
    if (n !== children || ctx.time - swept > 2) { children = n; swept = ctx.time; sweep(); }
    maskCam.position.copy(_eye); maskCam.up.set(0, 1, 0); maskCam.lookAt(_t.copy(_eye).add(sun.dir)); maskCam.updateMatrixWorld();
    U.uReachMaskMat.value.multiplyMatrices(maskCam.projectionMatrix, maskCam.matrixWorldInverse);
    const prevTarget = renderer.getRenderTarget(), prevAuto = renderer.autoClear, prevBg = scene.background, prevOver = scene.overrideMaterial, prevAlpha = renderer.getClearAlpha();
    renderer.getClearColor(_clear);
    scene.background = null; renderer.autoClear = false;
    renderer.setRenderTarget(maskRT); renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false);
    // solid things: anything on the line of sight
    maskCam.layers.set(L_SOLID); scene.overrideMaterial = solidMat;
    renderer.render(scene, maskCam);
    // cloth: one count for every cloth on the line of sight
    scene.overrideMaterial = null; maskCam.layers.set(L_CLOTH);
    const swapped = [];
    for (const o of draped) { if (!o.parent || o.userData.reachMaskOnly) continue; swapped.push(o, o.material); o.material = twinOf(o.material); }
    renderer.render(scene, maskCam);
    for (let i = 0; i < swapped.length; i += 2) swapped[i].material = swapped[i + 1];
    scene.background = prevBg; scene.overrideMaterial = prevOver; renderer.autoClear = prevAuto;
    renderer.setClearColor(_clear, prevAlpha); renderer.setRenderTarget(prevTarget);
  };
  /** Leave a solid thing out of the mask (keep = false), or put it back. */
  sun.solid = (mesh, keep = true) => { mesh.traverse((o) => { if (keep) left.delete(o); else left.add(o); }); swept = -1e9; return mesh; };

  // ---------------------------------------------------------------------------------------------- dressing cloth
  const perPass = (mesh) => {
    const before = mesh.onBeforeRender;
    mesh.onBeforeRender = function (r, sc, cam, geo, m, group) {
      if (before) before.call(this, r, sc, cam, geo, m, group);
      if (m.uniforms && m.uniforms.uReachMaskOn) { m.uniforms.uReachMaskOn.value = engine.reflecting ? 0 : 1; if (m.uniforms.uReachPre) m.uniforms.uReachPre.value = engine.pre && r.getRenderTarget() === engine.pre ? 1 : 0; m.uniformsNeedUpdate = true; }
    };
  };
  let warned = false;
  const miss = (what) => { if (!warned) { warned = true; console.error(`reach/light.js: could not dress ${what}: the engine's cloth shader has changed; the sun's coin and the dyes' back-light are off for it`); } };
  /**
   * Give a cloth material the sun's coin, the dye's own lit-from-behind colour and the dyed bar. Works on the engine's
   * makeCloth material and on anything made with kit.gouache({ backlight }) (makeGores, makeSwags, makeRibbons). Call
   * it before the first frame. Returns the material.
   */
  sun.dress = (mat) => {
    if (!mat || mat.userData.reachDressed) return mat;
    let frag = mat.fragmentShader;
    // lit from the front a dye keeps more of its own colour than paint would (the light's tint at 0.6), and the light is the bar's
    const softKey = 'uRampLight * mix(vec3(1.0), reachKey(vWPos, uKeyColor), 0.6), smoothstep(0.5, 1.0, w)';
    if (mat.isGouache) {
      const a = 'c += albedo * uBackColor * through * uBack;';
      if (!frag.includes(a) || !frag.includes('//@light') || !frag.includes('//@fragmentPars') || !frag.includes('//@albedo') || !frag.includes(SHADE_KEY)) { miss('a gouache cloth'); return mat; }
      frag = frag.replace('//@fragmentPars', DYE_GLSL + '\n  //@fragmentPars')
        .replace(SHADE_KEY, softKey)
        .replace(a, 'vec3 rBack, rCoin; float rGl, rForm; reachDye(albedo, rBack, rCoin, rGl);\n    c = reachFace(albedo, mix(vec3(1.0), shade, uShade) + ambient, ambient) + albedo * lamps;      // (the face of a dyed cloth: the scale of the dyes runs into its shadows)\n    #ifdef CLOTH_THRU\n      c += reachGlow(rBack, rGl, V, N, uKeyDir, 1.0, uBack, vWPos, CLOTH_THRU, rForm);      // (a cloth that says what each place of it lets through: the gores, the swags)\n    #else\n      c += reachGlow(rBack, rGl, V, N, uKeyDir, 1.0, uBack, vWPos, 1.0, rForm);\n    #endif\n    ')
        .replace('//@light', '#ifdef BACKLIGHT\n      glow += reachCoin(vWPos, cameraPosition, rCoin, rBack, rForm);\n    #endif\n    //@light')
        // cloth has two faces and no inside: the normal looks at the eye (as the engine's hanging cloth does), or the face
        // seen against the sun is painted as if the sun fell on it
        .replace('//@albedo', 'if (dot(N, uCameraPos - vWPos) < 0.0) N = -N;\n    //@albedo');
    } else {
      // the engine's hanging cloth. Besides the coin and the dye's own back-light it takes `aReachLit`: how much of the
      // sun reaches the top and the hem of each bolt past the cloth that hangs between it and the sun
      const a = 'c += albedo * uRampLight * uKeyColor * through * uBack * 1.7;', b = 'c += albedo * lamps;', base = 'vec3 c = albedo * shade * 0.85 +';
      let vert = mat.vertexShader;
      const va = 'attribute vec3 aPos, aColor; attribute vec4 aSize;', vb = 'vWPos = w; vColor = aColor;';
      if (!frag.includes(a) || !frag.includes(b) || !frag.includes(base) || !frag.includes(SHADE_KEY) || !frag.includes('void main() {') || !vert.includes(va) || !vert.includes(vb)) { miss('hanging cloth'); return mat; }
      vert = vert.replace(va, va + ' attribute vec2 aReachLit; varying float vReachLit;').replace(vb, vb + ' vReachLit = mix(aReachLit.x, aReachLit.y, clamp(down, 0.0, 1.0));');
      const head = frag.lastIndexOf('void main() {');
      // In the engine's picture of the scene without the water only what lies in or just over the water is ever looked at
      // (the water refracts it); cloth higher up is in it for its depth alone: there it is painted flat, at a fraction of the cost
      frag = frag.slice(0, head) + 'varying float vReachLit;\n' + DYE_GLSL + '\n      ' + frag.slice(head).replace('void main() {', 'void main() {\n        if (uReachPre > 0.5 && vWPos.y > 2.0) { gl_FragColor = vec4(vColor * 0.4, 1.0); return; }');
      frag = frag.replace(SHADE_KEY, softKey)
        .replace(base, 'shade = mix(uRampShadow * 1.5, shade, vReachLit);\n        ' + (QS.has('nowick') ? '' : '{ float rWick = (1.0 - smoothstep(0.1, 0.45 + 0.75 * vn(vec2(vUv2.x * 1.7, 3.0)), vWPos.y)) * (1.0 - vRod); albedo = pow(max(albedo, vec3(1e-4)), vec3(1.0 + 0.6 * rWick)) * (1.0 - 0.26 * rWick); }      // (fifth look: THE RIVER WICKS UP into cloth that hangs in it: a hand to an arm above the water it is soaked: deeper in its dye, darker, its edge uneven)\n        ') + 'vec3 rBack, rCoin; float rGl, rForm; reachDye(albedo, rBack, rCoin, rGl); if (vRod > 0.5) { rCoin = vec3(0.0); rBack = vec3(0.0); }\n        ' + base)
        .replace(a, '#ifdef DRAPE\n          { vec3 rAmb = mix(uGroundLight, uSkyLight, N.y * 0.5 + 0.5); if (vRod < 0.5) c = reachFace(albedo, shade * 0.85 + rAmb * 0.8, rAmb); }      // (the face of a dyed cloth: the scale of the dyes runs into its shadows)\n          c += reachGlow(rBack, rGl, V, N, uKeyDir, vReachLit, uBack, vWPos, clothThru, rForm);\n        #else\n          c += reachGlow(rBack, rGl, V, N, uKeyDir, vReachLit, uBack, vWPos, 1.0, rForm);\n        #endif\n        ')
        .replace(b, b + ' c += reachCoin(vWPos, cameraPosition, rCoin, rBack, rForm);');
      mat.vertexShader = vert;
    }
    mat.fragmentShader = frag; Object.assign(mat.uniforms, U); mat.userData.reachDressed = true; mat.needsUpdate = true;
    return mat;
  };
  const hang = (mesh) => { if (!mesh) return; mesh.traverse((o) => { if (o.isMesh) { draped.add(o); perPass(o); } }); swept = -1e9; };

  /**
   * Hanging cloth from makeCloth(ctx, bolts, ...): `handle` is what it returned, `bolts` the list it was given.
   * opts.mask: false leaves it out of the sun mask (the loft's ranks: the coin shows in the first although three more
   * hang behind it, and dies with the veil as the boat goes in: the page's own telling).
   */
  sun.cloth = (handle, bolts, opts = {}) => {
    sun.dress(handle.material);
    // (sixth look) opts.coin: { gain, heart, heartPow, gold }: THIS cloth's own coin (the loft's: the reach's last picture is the sun as a
    // blue-gold coin in a wall of indigo, already half in the veil of the passage out: stronger, and gold over most of its disc;
    // the door's stays the cold coin beside the kept lamp)
    if (opts.coin && handle.material.uniforms.uReachCoin) {
      const u = handle.material.uniforms, c = opts.coin;
      u.uReachCoin = { value: U.uReachCoin.value.clone() }; if (c.gain != null) u.uReachCoin.value.w = c.gain; if (c.heartPow != null) u.uReachCoin.value.x = c.heartPow;
      u.uReachCoinB = { value: U.uReachCoinB.value.clone() }; if (c.heart != null) u.uReachCoinB.value.z = c.heart; if (c.edge != null) u.uReachCoinB.value.w = c.edge;
      if (c.gold) u.uReachHeart = { value: col(c.gold) };
      if (c.halo != null) { u.uReachHalo = { value: U.uReachHalo.value.clone() }; u.uReachHalo.value.z = c.halo; }
    }
    // In the mask a draped cloth is drawn as a coarse twin of itself (the engine's cloth.coarse: the same bolts, hanging the
    // same way, on a tenth of the vertices: the mask is 128 pixels wide and needs no folds)
    const twin = opts.mask !== false && typeof handle.coarse === 'function' && handle.hung;
    if (opts.mask !== false && !twin) hang(handle.mesh); else handle.mesh.traverse((o) => { if (o.isMesh) { perPass(o); left.add(o); } });      // (mask: false: it takes the coin but does not count as a cloth in front of the sun)
    const mirror = handle.mesh && handle.mesh.parent ? handle.mesh.parent.children.find((o) => o.name === 'cloth-mirror' && o.material === handle.material) : null;
    if (mirror) perPass(mirror);
    sun.wind = handle.wind || sun.wind;
    const w = [], first = sun.bolts.length;
    for (const b of bolts) {
      const t = b.turn ?? 0, c = col(b.color ?? '#ffffff'); dyeWeights(c, w);
      const rec = { x: b.position[0], y: b.position[1], z: b.position[2], w: b.width, len: b.length, taper: b.taper || 0, skew: b.over ? 0 : (b.skew || 0), ux: Math.cos(t), uz: -Math.sin(t), nx: Math.sin(t), nz: Math.cos(t), stiff: b.stiff || 0, light: new THREE.Color(0, 0, 0), strength: 0,
        tie: b.tie && !b.over && !b.drop ? { at: b.tie.at ?? 0.5, side: (b.tie.side ?? 1) < 0 ? -1 : 1, out: b.tie.out ?? 0.3, tight: b.tie.tight ?? 0.22, tail: b.tie.tail ?? 0.62 } : null };      // (a bolt swept aside and tied covers only where it has been swept to: `within` below)
      for (let i = 0; i < DYES.length; i++) { rec.light.r += DYES[i].l.r * w[i]; rec.light.g += DYES[i].l.g * w[i]; rec.light.b += DYES[i].l.b * w[i]; rec.strength += DYES[i].strength * w[i]; }
      // a bolt dipped in a second dye toward its hem (the engine's draped cloth: hem, band): below that line the sun takes the hem's dye
      if (b.hem != null && (b.band ?? 2) < 1.2) {
        dyeWeights(col(b.hem), w); rec.band = b.band ?? 0.5; rec.light2 = new THREE.Color(0, 0, 0); rec.strength2 = 0;
        for (let i = 0; i < DYES.length; i++) { rec.light2.r += DYES[i].l.r * w[i]; rec.light2.g += DYES[i].l.g * w[i]; rec.light2.b += DYES[i].l.b * w[i]; rec.strength2 += DYES[i].strength * w[i]; }
      }
      sun.bolts.push(rec);
    }
    // how much sun reaches each bolt (top, hem): an attribute of the cloth's own, kept up to date a few bolts a frame
    const n = bolts.length, lit = new Float32Array(n * 2).fill(1), attr = new THREE.InstancedBufferAttribute(lit, 2);
    handle.mesh.geometry.setAttribute('aReachLit', attr);
    let mAttr = null;
    if (mirror) { const m = mirror.geometry.instanceCount, arr = new Float32Array(m * 2).fill(1); mAttr = new THREE.InstancedBufferAttribute(arr, 2); mirror.geometry.setAttribute('aReachLit', mAttr); }
    litSets.push({ first, n, lit, attr, mAttr, next: 0 });
    if (twin) {
      const m = new THREE.Mesh(handle.coarse(S.maskSegments || [14, 10]), twinOf(handle.material));
      m.name = 'cloth-sun-mask'; m.frustumCulled = false; m.userData.reachMaskOnly = true; m.layers.set(L_CLOTH);
      ctx.add(m); m.layers.set(L_CLOTH); draped.add(m); swept = -1e9;
    }
    return handle;
  };
  /** The wheel's cloth from makeGores: `dyes` is a function giving [{ top, hem }] (THREE.Color) for its gores now; `hub` [x, y, z]. */
  sun.gores = (handle, dyes, hub = PLAN.wheel.hub) => {
    // (the look of the wheel's cloth: heavy and wet: a fold from every peg, runs of dye, a torn hem: the engine's makeGores.look)
    const lookOf = (h) => { if (typeof h.look === 'function' && !QS.has('plaingores')) h.look({ tear: S.goreTear ?? 0.6, ribs: S.goreRibs ?? 1, pleat: S.gorePleat ?? 0.85, ...(S.goreLook || {}), ...(QS.has('oldgores') || !h.material.uniforms.uGoreLookD ? {} : (S.goreLook6 || {})) }); };      // (goreLook6: the sixth look's options, for an engine cloth that has them)
    lookOf(handle);
    sun.dress(handle.material); hang(handle.object); sun.goreSets.push({ handle, dyes, hub }); return handle;
  };
  /** Any other cloth made on kit.gouache (swags, flying silks): the coin, the back-light, and a place in the mask. */
  sun.drape = (handle, opts = {}) => { sun.dress(handle.material); if (opts.mask !== false) hang(handle.object || handle.mesh); return handle; };

  // ---------------------------------------------------------------------------------------------- how much sun reaches each bolt
  // Light crosses the nave almost level, so a cloth deep in it is lit only by what has come through the ranks between
  // it and the sun: half for each cloth on the way. Rays from six places on each bolt (its top and its hem), against
  // every other bolt as it hangs now (a wind front holds cloth up and lets the light in). A few bolts each frame.
  const RELOG = QS.has('relog') ? { n: 0 } : null;      // (&relog=1, a looking aid: every bolt whose share of the sun changes by more than a twentieth in one look)
  const litSets = [], PASS =QS.has('pass') ? +QS.get('pass') : (S.passes ?? 0.5);      // what a cloth passes on to the next behind it (&pass=0.6 tries another)
  const dropOf = (b) => {
    const wind = sun.wind;
    if (!wind) return b.len;
    const held = Math.min(1.3, wind.frontAt(b.x, b.z)) * (1 - b.stiff);
    if (held <= 0.02) return b.len;
    const phi = 1.3 * held; return b.len * (0.6 * Math.sin(phi) / phi + 0.4 * Math.cos(phi));
  };
  /**
   * Does a bolt cover the place `lx` metres along its line (from its middle) and `dy` metres below it? A bolt that hangs
   * straight: its rectangle. A bolt swept aside and tied (the engine's `tie`): the wedge from its line to the tie, and the
   * tail under the tie (the same shape the shader hangs, without its sag).
   */
  const within = (b, lx, dy) => {
    if (dy < 0 || dy > (b.drop ?? b.len)) return false;
    const T = b.tie; if (!T) {
      // (fifth look) a bolt CUT ON THE SLANT covers nothing where its hem has been cut away (the engine's `skew`: the same line the shader cuts)
      if (b.skew) { const u = Math.min(1, Math.max(0, lx / b.w + 0.5)); if (dy > (b.drop ?? b.len) - Math.abs(b.skew) * 0.08 * b.len * (b.skew > 0 ? u : 1 - u)) return false; }
      const v = Math.min(1, Math.max(0, (dy / b.len - 0.15) / 0.85)); return Math.abs(lx) <= b.w * 0.5 * (1 - b.taper * v * v * (3 - 2 * v));      // (it hangs narrower toward its hem: the engine's `taper`, the same curve)
    }
    const hT = T.at * b.len, wT = T.tight * b.w, xc = T.side * (0.5 * b.w + T.out - 0.5 * wT);
    if (dy < hT) { const u = dy / hT, far = -T.side * 0.5 * b.w * (1 - u) + (xc - T.side * 0.5 * wT) * u, near = T.side * 0.5 * b.w * (1 - u) + (xc + T.side * 0.5 * wT) * u; return lx >= Math.min(far, near) && lx <= Math.max(far, near); }
    const k = Math.min(1, (dy - hT) / 2.6), wB = b.w * (T.tight + (Math.max(T.tail, T.tight) - T.tight) * k * k * (3 - 2 * k));      // (its tail as wide as its tie says: the engine's `tie.tail`)
    return Math.abs(lx - (xc - T.side * 0.35 * (wB - wT))) <= wB * 0.5;
  };
  const reaches = (b, fx, fy) => {
    const D = sun.dir, px = b.x + b.ux * fx * b.w, pz = b.z + b.uz * fx * b.w, py = b.y - fy * b.len;
    let through = 1;
    for (const o of sun.bolts) {
      if (o === b) continue;
      const dn = D.x * o.nx + D.z * o.nz;
      if (Math.abs(dn) < 0.05) continue;
      const t = ((o.x - px) * o.nx + (o.z - pz) * o.nz) / dn;
      if (t < 0.05) continue;
      const hx = px + D.x * t, hy = py + D.y * t, hz = pz + D.z * t;
      if (!within(o, (hx - o.x) * o.ux + (hz - o.z) * o.uz, o.y - hy)) continue;
      through *= PASS;
      if (through < 0.03) break;
    }
    return through;
  };
  const relight = (count) => {
    for (const b of sun.bolts) b.drop = dropOf(b);
    for (const set of litSets) {
      const m = Math.min(count, set.n);
      for (let k = 0; k < m; k++) {
        const i = set.next; set.next = (set.next + 1) % set.n;
        const b = sun.bolts[set.first + i];
        const top = (reaches(b, -0.3, 0.12) + reaches(b, 0, 0.12) + reaches(b, 0.3, 0.12)) / 3, hem = (reaches(b, -0.3, 0.88) + reaches(b, 0, 0.88) + reaches(b, 0.3, 0.88)) / 3;
        if (RELOG && count < 1e5 && (Math.abs(top - set.lit[i * 2]) > 0.05 || Math.abs(hem - set.lit[i * 2 + 1]) > 0.05) && RELOG.n++ < 60) console.info('INVALID_ (relight) t ' + ctx.time.toFixed(3) + ' s ' + ctx.s.toFixed(2) + ' bolt ' + (set.first + i) + ' at z ' + b.z.toFixed(1) + ' x ' + b.x.toFixed(1) + ' w ' + b.w.toFixed(1) + ' len ' + b.len.toFixed(1) + ' top ' + set.lit[i * 2].toFixed(2) + '>' + top.toFixed(2) + ' hem ' + set.lit[i * 2 + 1].toFixed(2) + '>' + hem.toFixed(2));
        // (critique: a bolt's share of the sun was SET each time it was looked at, so a bolt went from 0.62 to 0.38 in one frame when another's
        // hem came between it and the sun, the one thing in this light that was not eased. It now goes three tenths of the way at each look,
        // about every ninth frame: most of the way in a second, as everything else here. The first frame still sets it outright.)
        const ease = count > 1e5 ? 1 : 0.3, top1 = set.lit[i * 2] + (top - set.lit[i * 2]) * ease, hem1 = set.lit[i * 2 + 1] + (hem - set.lit[i * 2 + 1]) * ease;
        set.lit[i * 2] = top1; set.lit[i * 2 + 1] = hem1;
        if (set.mAttr && i % 2 === 0) { set.mAttr.array[i] = top1; set.mAttr.array[i + 1] = hem1; }
      }
      set.attr.needsUpdate = true; if (set.mAttr) set.mAttr.needsUpdate = true;
    }
  };
  sun.relight = relight;

  // ---------------------------------------------------------------------------------------------- the cover test
  const _d = new THREE.Vector3(), _c = new THREE.Color(), _w = [];
  const lightOf = (color, out) => { dyeWeights(color, _w); out.light.setRGB(0, 0, 0); out.strength = 0; for (let i = 0; i < DYES.length; i++) { out.light.r += DYES[i].l.r * _w[i]; out.light.g += DYES[i].l.g * _w[i]; out.light.b += DYES[i].l.b * _w[i]; out.strength += DYES[i].strength * _w[i]; } return out; };
  const _lo = { light: new THREE.Color(), strength: 1 };
  /** What cloth the ray from `eye` along `dir` meets first: fills `hit` ({ light, strength, z }) and returns true, or false. */
  const firstCloth = (eye, dir, hit) => {
    let best = Infinity, found = false;
    for (const b of sun.bolts) {
      const dn = dir.x * b.nx + dir.z * b.nz;
      if (Math.abs(dn) < 0.05) continue;                                 // edge-on to the sun: it covers nothing
      const t = ((b.x - eye.x) * b.nx + (b.z - eye.z) * b.nz) / dn;
      if (t < 0.3 || t >= best) continue;
      const hx = eye.x + dir.x * t, hy = eye.y + dir.y * t, hz = eye.z + dir.z * t;
      if (!within(b, (hx - b.x) * b.ux + (hz - b.z) * b.uz, b.y - hy)) continue;      // (as it hangs now: a wind front holds it up; swept aside, where it has been swept to)
      const low = b.light2 && (b.y - hy) > b.band * b.len;                // (the line of sight crosses it below its dip line)
      best = t; found = true; hit.light.copy(low ? b.light2 : b.light); hit.strength = low ? b.strength2 : b.strength; hit.z = hz;
    }
    for (const g of sun.goreSets) {
      const r = g.handle.covers(eye, dir);
      if (!r) continue;
      // (the gores hang in the wheel's plane: nearer than any cloth behind the wheel, farther than cloth in front of it)
      const tg = (g.hub[0] - eye.x) * dir.x + (g.hub[2] - eye.z) * dir.z;
      if (tg >= best) continue;
      const d = g.dyes()[r.gore]; if (!d) continue;
      lightOf(r.v < 0.5 ? d.top : d.hem, _lo);
      best = tg; found = true; hit.light.copy(_lo.light); hit.strength = _lo.strength; hit.z = g.hub[2];
    }
    return found;
  };
  sun.firstCloth = firstCloth;
  const OFF = [[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]].slice(0, S.samples);
  const _hit = { light: new THREE.Color(), strength: 1, z: 0 }, _right = new THREE.Vector3(), _up = new THREE.Vector3();
  const never = QS.has('bare');
  const coverTest = () => {
    const rad = Math.tan(sun.size * 0.5 * RAD), flat = discMat.uniforms.uDisc.value.y, now = sun.now;
    let n = 0, s = 0, z = 0; _c.setRGB(0, 0, 0);
    if (!never) for (const [ox, oy] of OFF) {
      _d.copy(sun.dir).addScaledVector(_right, ox * rad).addScaledVector(_up, oy * rad * flat).normalize();
      if (firstCloth(_eye, _d, _hit)) { n++; s += _hit.strength; z += _hit.z; _c.r += _hit.light.r; _c.g += _hit.light.g; _c.b += _hit.light.b; }
    }
    now.cover = n / OFF.length;
    if (n) { now.strength = s / n; now.z = z / n; now.light.setRGB(_c.r / n, _c.g / n, _c.b / n); } else { now.strength = 1; now.light.copy(sun.bare); }
  };

  // ---------------------------------------------------------------------------------------------- debug: the mask on screen
  let debug = null;
  if (QS.has('sunmask')) {
    debug = new THREE.Sprite(new THREE.SpriteMaterial({ map: maskRT.texture, depthTest: false, fog: false, sizeAttenuation: false }));
    debug.scale.set(0.3, 0.3, 1); debug.renderOrder = 998; ctx.add(debug);
  }

  // ---------------------------------------------------------------------------------------------- every frame
  let first = true;
  const SHADE_AT = QS.has('shade') ? +QS.get('shade') : null;
  const SUNLOG = QS.has('sunlog') ? { last: null, n: 0, eye: QS.has('suneye') ? new THREE.Vector3(...QS.get('suneye').split(',').map(Number)) : null } : null;
  const _q = new THREE.Quaternion(), _n = new THREE.Color();
  /**
   * Called by set.js after it has laid the light states into ctx.look: moves the sun, takes the mask, runs the cover
   * test, eases the light, and writes the key light, the water's sun path and the cloth's light.
   */
  sun.update = (dt) => {
    sun.far = Math.max(sun.far, ctx.s);
    const e = sunElevation(sun.far); sun.elevation = e; sun.size = sunSize(sun.far);
    sun.dir.set(S.azimuth[0] * Math.cos(e * RAD), Math.sin(e * RAD), S.azimuth[1] * Math.cos(e * RAD)).normalize();
    _right.set(-sun.dir.z, 0, sun.dir.x).normalize(); _up.crossVectors(_right, sun.dir).normalize();
    colorAt(e, sun.bare);
    relight(first ? 1e6 : 24);
    // the eye, as the frame about to be drawn will have it
    engine.boat.rig.updateMatrixWorld(true); engine.camera.getWorldPosition(_eye);
    if (SUNLOG && SUNLOG.eye) _eye.add(SUNLOG.eye);      // (&suneye=x,y,z with &sunlog=1: the light as an eye that far from the rider's would have it, in metres of the area: a film camera behind the boat)
    coverTest();
    const k = first ? 1 : 1 - Math.exp(-dt / S.ease);
    sun.cover += (sun.now.cover - sun.cover) * k;
    _c.copy(sun.bare).lerp(sun.now.light, sun.now.cover);
    sun.light.lerp(_c, k);
    sun.strength += (Math.max(S.floor, 1 + (sun.now.strength - 1) * sun.now.cover) - sun.strength) * k;
    if (sun.now.cover > 0) sun.shadeZ = first || sun.cover < 0.05 ? sun.now.z : sun.shadeZ + (sun.now.z - sun.shadeZ) * k;
    if (SHADE_AT !== null) sun.shadeZ = SHADE_AT;      // (&shade=<z>, a looking aid: the shade line held at that z)
    first = false;
    // ---- the disc and the glow
    const u = discMat.uniforms, flatK = Math.min(1, Math.max(0, (S.flatten.from - e) / (S.flatten.from - S.flatten.below)));
    u.uRight.value.copy(_right); u.uUp.value.copy(_up);
    u.uDisc.value.set(Math.tan(sun.size * 0.5 * RAD), 1 + (S.flatten.to - 1) * flatK * flatK * (3 - 2 * flatK), EXT, 0);
    u.uLimb.value.copy(sun.bare).multiplyScalar(2.6);
    u.uGlow.value.copy(sun.light).multiplyScalar(S.glow.strength * sun.strength);
    // ---- the light of the picture (set.js has just laid the state's own values into ctx.look)
    const L = ctx.look.light, t = Math.tan(e * RAD);
    L.key[0] = 0; L.key[1] = -t; L.key[2] = 1;
    L.keyColor.copy(sun.light).lerp(_n.setRGB(1, 1, 1), S.keySoft).multiplyScalar(sun.strength);
    U.uReachBare.value.copy(sun.bare).lerp(_n, S.keySoft);
    U.uReachBand.value.set(_eye.x, sun.spread, sun.shadeZ, 0.35 + 0.65 * sun.strength);
    if (SUNLOG) {      // (&sunlog=1, a looking aid: every frame in which the cover test's answer changes, the shade line moves more than half a metre or the key light more than 0.4 per cent; it prints through the page's error channel only when asked for)
      const r3 = (v) => Math.round(v * 1000) / 1000, row = [ctx.time, ctx.s, sun.now.cover, sun.cover, sun.strength, sun.shadeZ, sun.now.z, L.keyColor.r + L.keyColor.g + L.keyColor.b], p = SUNLOG.last;
      if (p) { const dz = Math.abs(row[5] - p[5]), dl = Math.abs(row[7] - p[7]) / Math.max(1e-4, p[7]); if ((dz > 0.5 || dl > 0.004 || row[2] !== p[2]) && SUNLOG.n++ < 70) console.info('INVALID_ (sunlog) t ' + r3(row[0]) + ' s ' + r3(row[1]) + ' now.cover ' + row[2] + ' cover ' + r3(row[3]) + ' strength ' + r3(row[4]) + ' shadeZ ' + r3(row[5]) + ' now.z ' + r3(row[6]) + ' key ' + r3(row[7]) + ' dz ' + r3(dz) + ' dkey ' + r3(dl)); }
      SUNLOG.last = row;
    }
    // when the bar is as wide as the reach (the showstopper's dusk) what is not in the sun dims and takes a little of the dye too
    const wide = Math.min(1, Math.max(0, (sun.spread - 60) / 240));
    _n.copy(sun.light).multiplyScalar(1 / Math.max(sun.light.r, sun.light.g, sun.light.b, 1e-4));
    if (wide > 0) { const dim = 1 + (0.55 + 0.45 * sun.strength - 1) * wide, cv = sun.cover * 0.35 * wide; for (const key of ['sky', 'ground']) { const a = L[key]; a.r *= dim * (1 + (_n.r - 1) * cv); a.g *= dim * (1 + (_n.g - 1) * cv); a.b *= dim * (1 + (_n.b - 1) * cv); } }
    // ---- the water's sun path
    const W = ctx.waterLook.sun;
    if (W) { W.dir[0] = 0; W.dir[1] = Math.max(0.012, t); W.dir[2] = -1; W.color.copy(sun.light); W.color.g *= 0.82; W.color.b *= 0.55; W.strength *= sun.strength; }      // (molten: a little redder than the light, or its core shows white)
    // ---- the light behind cloth: mostly the dye's own colour, a little of the sun's; and what the sky sends through it
    _c.copy(sun.bare).multiplyScalar(1 / Math.max(sun.bare.r, sun.bare.g, sun.bare.b, 1e-4));
    U.uReachBack.value.setRGB(1, 1, 1).lerp(_c, 0.22).multiplyScalar(S.back);
    _c.copy(L.sky).multiplyScalar(1 / Math.max(L.sky.r, L.sky.g, L.sky.b, 0.05));
    U.uReachAmbient.value.setRGB(1, 1, 1).lerp(_c, 0.4).multiplyScalar(S.ambient * (1 + (0.4 + 0.6 * sun.strength - 1) * wide));
    U.uReachCoinTint.value.setRGB(1, 1, 1).lerp(_c.copy(sun.bare).multiplyScalar(1 / Math.max(sun.bare.r, sun.bare.g, sun.bare.b, 1e-4)), 0.2);
    // ---- the mask, for the frame about to be drawn (only when the sun's direction can be in the picture)
    _d.set(0, 0, -1).applyQuaternion(engine.camera.getWorldQuaternion(_q));
    if (_d.dot(sun.dir) > -0.2) renderMask();
    if (debug) debug.position.copy(_eye).addScaledVector(_d, 2).addScaledVector(_t.set(_d.z, 0, -_d.x).normalize(), -1.25).add(_t.set(0, 0.62, 0));
  };
  return sun;
}
