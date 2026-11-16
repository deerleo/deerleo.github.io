// The orchard in flood: the WOOD of the orchard (module `trees`, built before `kit` and before the blossom).
//   - every tree of the orchard: the 110 of the avenues, the 80 of the rows the boat cannot enter, the 116 of the rows
//     in mist. All of them wear one of eight designs (six of an old pruned standard, assets/models/orchard/apple_A ..
//     apple_F, and two that keep a long low bough on a crutch, apple_low_A, apple_low_B: only in the avenues), each
//     in four weights from one skeleton: the near one within about 20 m of the boat, a lighter one to 55 m, a light one
//     to 115 m, the lightest beyond (the rows in mist: never heavier than the third). Instanced: a draw a weight;
//   - the lime wash, the grease band, the flood's marks: drawn by the wood's own material on every bole (an extension
//     of the ride's gouache, below) from two painted pictures (art/orchard/lime.webp: the wash brushed over bark;
//     limefoot.webp: a washed trunk's foot in the flood, with its tide line, the silt's stain, the wet and petals
//     stuck), over the bark's own picture;
//   - thin wood stays out of the painter's filter (which wipes out what is thinner than its brush): by how thick a
//     limb is ON THE SCREEN, so a twig is crisp at two metres and a scaffold limb at thirty;
//   - the 22 crutches: thirteen under the avenues' long low boughs and nine under the oldest tree's limbs, in eight
//     designs of worked timber (crutch_A .. _H): forked poles set aslant, and shear legs (two poles crossed under the
//     bough and lashed, as the key painting has them);
//   - the hawthorn hedge that closes the orchard (hawthorn_6m, and the sprays of may that stand out of it: cut cards
//     planted on the model's own surface), and prunings lodged against the trunks' upstream sides;
//   - a tree well outside what the rider can see is not drawn (sortGroves);
//   - what the blossom, the furniture and the cast need to hang things on these trees: shared.wood, shared.sway.
// The blossom is NOT here (kit_blossom.js): this is the bare wood, as the orchard in snow will show it.
// Models and their numbers are made by source-art/models/orchard/apple_trees.py; nothing is typed in from them by hand.
// The log: docs/build/orchard/2-kit-trees.md.
//
// Developer switches: &lod=near | lo | far | mote (every tree in one weight), &lodr=<metres> (where the near weight
// ends: 20), &wash=<metres> (the lime wash line), &nowash=1 (no lime wash: the bark alone), &flood=0..1 (how strongly
// the flood's marks show on the boles), &crisp=0 (thin wood goes through the painter's filter like everything else),
// &cull=0 (every tree drawn always, wherever the rider looks), &may=0 (the hedge without its sprays), &prunings=1.
import * as THREE from 'three';

const Q = new URLSearchParams(location.search);
const WOOD_JSON = 'assets/models/orchard/apple_wood.json';
// The lime wash's two pictures (source-art/orchard/limewash.png, cut in two): what the wash measures on average (linear),
// its own colour as painted on a trunk, and how the foot's picture is laid: its lower edge 0.13 m under the water, 1.05 m
// tall (its tide line then stands 0.555 m above the water, its wet and its petals just above the surface).
const LIME = { color: '#c9c5c8', mean: [0.4551, 0.3765, 0.4245], lum: 0.4097, foot: { y0: -0.13, tall: 1.05, wide: 1.05 * 449 / 1024, tide: 0.653 } };
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _v = new THREE.Vector3();

/** Boughs sway above 3 m only: the engine's own sway with the blossom's numbers (kit_blossom.js stirs by the same rule).
 *  It is a function of where a point IS, so anything given these options moves with the wood and its blossom: a label
 *  on its wire, a basket on a rung.  kit.gouache({ ..., sway: shared.sway }) */
export const SWAY = { strength: 0.18, speed: 0.57, from: 3, to: 9.5, dir: [1, 0.3] };

// The stir of the wood. THIS IS kit_blossom.js's `stirOf`, WORD FOR WORD (its STIR_GLSL), so that wood and blossom
// move as one thing: the slow sway above 3 m, a front of evening air, a bumped trunk's shake, the roost's shiver. The
// wood starts with uniforms of its own holding the same numbers; when the blossom has been built the wood takes the
// blossom's uniform objects (build().update below), and from then on whatever the staging does to the blossom
// (shared.blossom.front / gust / shake / shiver) it does to the wood. If one changes, change the other. (The blossom's
// own copy takes one more argument, `old`, for what grows on the oldest tree; this is that text with old = 0.)
const STIR_GLSL = /* glsl */`
  uniform vec4 uBlow;              // the way it leans (x, z), metres at the tips, radians a second
  uniform vec4 uBlowMore;          // from (m), to (m), gust (1 = none), -
  uniform vec4 uFrontB;            // a front of air crossing the orchard: its line's z, its depth (m), how much more it stirs, -
  uniform vec4 uShakeB;            // a bumped trunk: x, z, reach (m), metres now
  uniform vec4 uShiverB;           // the roost: the oldest tree's x, z; the height the shiver has come down to; metres
  vec3 stirOf(vec3 p) {
    float t = uTime * uBlow.w;
    float sw = sin(t + p.x * 0.21 + p.z * 0.17) * 0.6 + sin(t * 0.43 + p.z * 0.11 + 1.7) * 0.4;
    float more = uBlowMore.z * (1.0 + uFrontB.z * exp(-pow((p.z - uFrontB.x) / max(uFrontB.y, 0.1), 2.0)));
    vec3 d = vec3(uBlow.x, 0.0, uBlow.y) * (uBlow.z * sw * more * smoothstep(uBlowMore.x, uBlowMore.y, p.y));
    vec2 q = p.xz - uShakeB.xy; float near = 1.0 - smoothstep(uShakeB.z * 0.5, uShakeB.z, length(q));
    d += vec3(sin(uTime * 15.7 + p.y * 2.1 + p.x), 0.35 * sin(uTime * 19.0 + p.z * 1.7), cos(uTime * 13.9 + p.y * 1.3 + p.z)) * (uShakeB.w * near * smoothstep(2.6, 6.0, p.y));
    vec2 g = p.xz - uShiverB.xy; float band = exp(-pow((p.y - uShiverB.z) / 3.2, 2.0)) * (1.0 - smoothstep(26.0, 34.0, length(g)));
    d += vec3(sin(uTime * 15.7 + p.x * 0.9 + p.y), -0.5 * abs(sin(uTime * 15.7 + p.z * 0.7)), cos(uTime * 15.7 + p.z * 0.9)) * (uShiverB.w * band);
    return d;
  }`;
const STIR_UNIFORMS = ['uBlow', 'uBlowMore', 'uFrontB', 'uShakeB', 'uShiverB'];

/** Which design a tree of the plan wears: an avenue tree its own (the thirteen with a low bough, theirs); the trees of
 *  the far rows and of the rows in mist one of the six, by their own `variant`. */
export function modelOf(t) { return t.kind === 'sail' && t.low ? 'apple_low_' + t.low : 'apple_' + 'ABCDEF'[t.variant % 6]; }

/** A tree's place: exactly as the layout's stand-ins had it, and as kit_blossom.js places its crowns (a low-bough tree is
 *  not leaned or scaled: its bough, along its own +X, must point at the centre line and meet its crutch). */
export function matrixOf(t, plan, out = new THREE.Matrix4()) {
  const low = t.kind === 'sail' && t.low;
  if (low) _e.set(0, plan.heading(t.s) + (t.d > 0 ? Math.PI : 0), 0, 'XYZ'); else _e.set(Math.sin(t.leanDir) * t.lean, t.turn, Math.cos(t.leanDir) * t.lean, 'XYZ');
  return out.compose(_p.set(t.x, 0, t.z), _q.setFromEuler(_e), _s.setScalar(low ? 1 : t.scale));
}

/**
 * The wood's material: the ride's gouache, extended. Over the vertex paint it lays the bark's painted picture
 * (art/orchard/bark.webp) in the tree's own space, and on the bole (the model's UV u says where that is) it lays, from
 * the water up:
 *   - the foot's own picture (art/orchard/limefoot.webp, o.foot): the wet, petals stuck to it as the water fell, the
 *     silt's grey-green stain, and the tide line the flood stood at, half a metre up;
 *   - the lime wash's own picture (art/orchard/lime.webp, o.lime): chalky, brushed in long upright drags, thin over
 *     the bark (its cracks and flaked plates show), thinner where it has weathered in patches and where the brush ran
 *     dry toward its upper edge, older on some trunks than on others, that edge uneven as a hand leaves it and every
 *     trunk washed to its own height; darker and bluer where the trunk turns from the eye, so that a column is round;
 *   - splashes on the bark above, and the dark grease band with a run or two.
 * Everything is laid out in the tree's own metres, so it grows with the tree. Off the bole, wood that stands in the
 * water (a crutch) takes the flood's marks by its height above the water.
 * And in the last line: wood that is thin on the screen marks itself for the painter's filter to leave alone.
 * For anything made by apple_trees.py:  kit.models(url, list, woodOptions(ctx, shared, bark, { lime, foot })).
 *   o.wash   metres to the wash line (1.8);  o.bare: no lime wash and no grease band (the bark alone);
 *   o.lime, o.foot   the two pictures (without them: the bark alone);  o.limeColor   the wash's own colour, on average;
 *   o.flood  0..1: how strongly the flood's marks show (1);  o.still: it does not sway (a prop);  o.drink: see below;
 *   o.timber: worked timber (a crutch): weathered grey and checked where its bark is off;
 *   o.dusk: the hour's extension to put after it (shared.dusk; pass null for none)
 */
export function woodOptions(ctx, shared, bark, o = {}) {
  const V4 = (x, y, z, w) => ({ value: new THREE.Vector4(x, y, z, w) });
  const washed = !!(o.lime && o.foot) && !o.bare;
  const uniforms = {
    tBark: { value: bark }, tLime: { value: o.lime || bark }, tFoot: { value: o.foot || bark },
    uLime: { value: new THREE.Color(o.limeColor || LIME.color) }, uSelf: (shared && shared.blossomSelf) || { value: new THREE.Color(0, 0, 0) },
    uWash: V4(o.wash ?? 1.8, o.flood ?? 1, o.timber ? 1 : 0, washed ? 1 : 0),      // the wash line (m); how strongly the flood's marks show; 1 = worked timber (a crutch: weathered where its bark is off); 1 = washed
    uFoot: V4(LIME.foot.y0, LIME.foot.tall, LIME.foot.wide, LIME.foot.y0 + LIME.foot.tall * LIME.foot.tide),      // the foot's picture: where its lower edge is (m), how tall and how wide it is laid; the tide line (m)
    uCrispAt: { value: Q.get('crisp') === '0' ? 1e9 : 230 },         // a limb of radius r is thin on the screen beyond r * this metres (about seven pixels across at 1600 wide)
    uBlow: V4(SWAY.dir[0], SWAY.dir[1], ctx.reducedMotion ? 0.1 : SWAY.strength, SWAY.speed), uBlowMore: V4(SWAY.from, SWAY.to, 1, 0), uFrontB: V4(1e6, 12, 0, 0), uShakeB: V4(0, 0, 5, 0), uShiverB: V4(0, 0, 40, 0),
  };
  const fx = {
    uniforms,
    vertexPars: `varying vec3 vLocal; varying vec3 vLocalN; varying float vSeed; ${STIR_GLSL}`,
    vertexLocal: `vLocal = transformed; vLocalN = objectNormal;
      #ifdef USE_INSTANCING
        vSeed = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
      #else
        vSeed = 0.37;
      #endif`,
    vertexWorld: 'wp.xyz += stirOf(wp.xyz);',
    fragmentPars: /* glsl */`uniform sampler2D tBark, tLime, tFoot; uniform vec3 uLime, uSelf; uniform vec4 uWash, uFoot; uniform float uCrispAt;
      varying vec3 vLocal; varying vec3 vLocalN; varying float vSeed;
      float woodH(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
      float woodN3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(woodH(i), woodH(i + vec3(1.0, 0.0, 0.0)), f.x), mix(woodH(i + vec3(0.0, 1.0, 0.0)), woodH(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                   mix(mix(woodH(i + vec3(0.0, 0.0, 1.0)), woodH(i + vec3(1.0, 0.0, 1.0)), f.x), mix(woodH(i + vec3(0.0, 1.0, 1.0)), woodH(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
      // a petal stuck flat to wet wood: uv in metres on the surface; share: how many places carry one. An oval the size
      // of the ride's own petal (four times life), each turned its own way
      float woodPetal(vec2 uv, float most, float top) {
        vec2 g = uv / 0.09, c = floor(g), f = fract(g) - 0.5;
        float r1 = woodH(vec3(c, 3.1)), r2 = woodH(vec3(c, 7.7)), r3 = woodH(vec3(c, 11.3)), r4 = woodH(vec3(c, 17.9));
        float hc = (c.y + 0.5) * 0.09, share = most * (1.0 - smoothstep(0.1, top, hc)) * smoothstep(0.0, 0.07, hc);      // (by the place's own height: no petal is cut in two)
        f -= (vec2(r2, r3) - 0.5) * 0.3;
        float a = r1 * 40.0; vec2 d = vec2(cos(a) * f.x + sin(a) * f.y, cos(a) * f.y - sin(a) * f.x) / vec2(0.32, 0.19);
        return (1.0 - smoothstep(0.75, 1.0, dot(d, d))) * step(r4, share);
      }
      // petals stuck to a wet POST as the water fell: small (twice life, not four times: a post is a hand thick), each
      // its own size and turn, scattered and never in rows, thickest in the hand above the wet and thinning to nothing
      // by top. uv: metres round the post and up it; cell: the size of a place; salt: another scatter.
      // (They were three or four alike in a grid on every foot: the pips of a domino.)
      float woodFleck(vec2 uv, float cell, float most, float top, float salt) {
        vec2 g = uv / cell, c = floor(g), f = fract(g) - 0.5;
        float r1 = woodH(vec3(c, 3.1 + salt)), r2 = woodH(vec3(c, 7.7 + salt)), r3 = woodH(vec3(c, 11.3 + salt)), r4 = woodH(vec3(c, 17.9 + salt));
        float hc = (c.y + 0.5 + (r3 - 0.5) * 0.4) * cell, share = most * (1.0 - smoothstep(0.07, top, hc)) * smoothstep(0.0, 0.05, hc);
        f -= (vec2(r2, r3) - 0.5) * 0.4;
        float a = r1 * 40.0, sz = 0.55 + 0.45 * fract(r1 * 13.0);
        vec2 d = vec2(cos(a) * f.x + sin(a) * f.y, cos(a) * f.y - sin(a) * f.x) / (vec2(0.3, 0.17) * sz);
        return (1.0 - smoothstep(0.7, 1.0, dot(d, d))) * step(r4, share);
      }`,
    albedo: /* glsl */`float woodLime = 0.0, woodWet = 0.0; vec3 woodMark = vec3(1.0);      // how much of it is lime wash to the light; how wet it is at the water; the flood's marks ON the wash (laid on after the wash has been held under the bloom: see the last extension)
      {
        float bole = max(vUv0.x, 0.0), age = vUv0.y;
        // the bark's own picture, laid on in the tree's own space from three sides (it does not swim when the boughs sway)
        vec3 ln = normalize(vLocalN); vec3 bw = pow(abs(ln), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
        vec3 q = vLocal + vec3(vSeed * 7.0, vSeed * 3.0, vSeed * 5.0);
        vec2 bs = vec2(1.0 / 0.62, 1.0 / 1.25);
        vec3 bk = texture2D(tBark, q.zy * bs).rgb * bw.x + texture2D(tBark, q.xy * bs).rgb * bw.z + texture2D(tBark, q.xz * bs.xx).rgb * bw.y;
        albedo *= mix(vec3(1.0), clamp(bk / vec3(0.078, 0.052, 0.074), 0.3, 2.4), 1.0 - smoothstep(0.3, 0.8, age));
        // the wash's picture and the foot's, from the two sides (read for every fragment, bole or not: a picture read
        // inside a branch shows a seam where the branch begins)
        float sides = bw.x + bw.z + 1e-4;
        vec2 ls = vec2(1.0 / 0.6, 1.0 / 1.2);
        vec3 lw = (texture2D(tLime, q.zy * ls).rgb * bw.x + texture2D(tLime, q.xy * ls).rgb * bw.z) / sides;
        float fv = clamp((vLocal.y - uFoot.x) / uFoot.y, 0.004, 0.996);
        vec3 fw = (texture2D(tFoot, vec2(q.z / uFoot.z, fv)).rgb * bw.x + texture2D(tFoot, vec2(q.x / uFoot.z, fv)).rgb * bw.z) / sides;
        float h = vLocal.y, flood = uWash.y;
        if (bole > 0.004) {
          vec3 np = vLocal + vSeed * 13.0;
          float tide = uFoot.w + (woodN3(np * vec3(4.0, 1.2, 4.0) + 9.0) - 0.5) * 0.03 + (woodN3(np * vec3(1.3, 0.2, 1.3) + 2.0) - 0.5) * 0.09;      // (it wanders a hand round the trunk: ruled level, with its pale crust, it was the hem of a skirt)
          float under = (1.0 - smoothstep(tide - 0.03, tide + 0.04, h)) * flood;
          // bark that the flood has stood on: darker, greened by silt
          albedo *= mix(vec3(1.0), vec3(0.6, 0.74, 0.72), under * bole);
          if (uWash.w > 0.5) {
            float ll = dot(lw, vec3(0.3, 0.5, 0.2)) / ${LIME.lum.toFixed(3)};          // the brush: 0.4 in a crack, 1 on average, 1.4 where it lay thick
            float fresh = fract(vSeed * 7.31);                                          // washed this spring .. two springs ago
            float washAt = uWash.x + (vSeed - 0.5) * 0.3;                              // every trunk to its own height: give or take 0.15 m
            // a hand's uneven upper edge. THE BRUSH'S LAST STROKES REACH UP: each a finger or two wide, to a height of its
            // own (most end low, one in a few a hand or two higher), and each ends dry: broken, tapering, the bark showing
            // through its tip. (The edge was a slow wave, which the painter's filter rounds into scallops of bark hanging
            // DOWN over the wash: chocolate over ice cream.)
            float thA = atan(ln.z, ln.x);                                                // the way round the trunk, in its own space
            float st1 = woodN3(vec3(thA * 7.0 + vSeed * 20.0, 0.5, 1.0)), st2 = woodN3(vec3(thA * 17.0 + vSeed * 9.0, 0.5, 5.0));
            float edge = washAt - 0.13 + (woodN3(np * vec3(1.6, 0.3, 1.6) + 4.0) - 0.5) * 0.14 + pow(st1, 1.7) * 0.27 + st2 * 0.08 + (ll - 1.0) * 0.08;
            float cover = 1.0 - smoothstep(edge - 0.06, edge + 0.008, h);
            cover *= mix(1.0, smoothstep(0.2, 0.55, woodN3(vec3(thA * 23.0 + 3.0, h * 8.0, 2.0)) + (edge - h) * 3.5), smoothstep(edge - 0.2, edge - 0.02, h));
            // how thin it lies: older wash is thinner all over; weathered off in patches the size of a hand; dry-brushed toward its upper edge
            float thin = 0.26 * (1.0 - fresh) + 0.52 * smoothstep(0.48, 0.84, woodN3(np * vec3(2.3, 1.2, 2.3) + 7.0)) + 0.3 * smoothstep(washAt - 0.45, washAt, h);
            vec3 mean = vec3(${LIME.mean.map((v) => v.toFixed(4)).join(', ')});
            // the brush's own long upright drags, a hand wide and half a metre long: where it ran dry the wash is a grey
            // veil and the bark's tone comes through (broad enough to outlive the painter's filter, which turns the
            // picture's finer brush marks into scallops from three metres)
            float drag = woodN3(vec3(np.x * 19.0, np.y * 1.5, np.z * 19.0)) * 0.65 + woodN3(vec3(np.x * 43.0, np.y * 2.6 + 3.0, np.z * 43.0)) * 0.35;
            float dry = 1.0 - smoothstep(0.3, 0.56, drag);
            thin += 0.36 * dry;
            // THIN, NOT TORN. Where the brush ran dry or the wash has weathered it is a veil that still half covers, and
            // the bark's tone comes through it; only here and there (and on half the trunks hardly at all) has a plate of
            // bark the size of a palm come away with its wash and left a dark place. (It was bare bark wherever the
            // wash was thin: holes a forearm long on every trunk, and a piebald bole is a birch.)
            float solid = smoothstep(thin - 0.3, thin + 0.25, ll - 0.4);
            float veil = mix(0.76, 0.5, smoothstep(0.45, 1.15, thin));
            float plate = smoothstep(0.67, 0.75, woodN3(np * vec3(5.5, 2.6, 5.5) + 13.0)) * smoothstep(0.55, 0.95, thin) * (0.35 + 0.65 * step(0.5, fract(vSeed * 3.7)));
            float coat = cover * max(solid, veil) * (1.0 - 0.8 * plate);
            vec3 wash = uLime * clamp(lw / mean, 0.2, 1.7) * mix(0.9, 1.05, fresh);
            wash *= mix(vec3(0.8, 0.86, 1.0), vec3(1.1, 1.03, 0.96), smoothstep(0.55, 1.35, ll));      // thin wash is blue-grey, thick wash a warm white: the painting's two ends
            wash *= mix(vec3(1.0), vec3(0.7, 0.74, 0.87), dry) * mix(0.93, 1.05, smoothstep(0.5, 0.82, drag));
            // the foot, where the flood stands and has stood: its own picture, joined to the wash above the tide line.
            // Lime wash that is wet goes grey and lets the bark through: BELOW the tide line the wash is a shade darker and
            // cooler than the dry wash above it, streaked and petalled by the foot's own picture with half of its khaki
            // taken out (at full colour the avenue was white columns in khaki socks; held pale, the foot was a smooth
            // sock paler than the trunk above it); on the line itself, the pale crust the silt left
            float fk = (1.0 - smoothstep(uFoot.x + uFoot.y - 0.34, uFoot.x + uFoot.y - 0.05, h)) * flood;
            vec3 footC = uLime * clamp(fw / mean, 0.04, 1.7);
            // THE WASH RUNS TO THE WATER (the key painting's trunks: white to the waterline, a little bluer at the foot, a
            // dark line where they go in). Below the line the flood stood at it is THE SAME WASH with the same brush marks,
            // a shade darker and cooler where it is still damp; the silt's stain is a mark a hand wide under the line that
            // fades downward, and the line itself goes up and down in fingers where the wash drew the water up. (It was
            // the foot's own picture from the line to the water: half a metre of another material under a ruled edge, at
            // one height on every trunk in the orchard: a sock, grey-green in the open and custard in the lantern.)
            float lift = (pow(woodN3(vec3(thA * 9.0 + vSeed * 31.0, 0.5, 9.0)), 2.0) - 0.2) * 0.11 + (woodN3(vec3(thA * 27.0 + vSeed * 7.0, 0.5, 13.0)) - 0.5) * 0.04;
            float wetK = (1.0 - smoothstep(tide + lift - 0.04, tide + lift + 0.02, h)) * flood;           // how damp: nothing above the line, all of it three fingers below
            float silt = wetK * (1.0 - smoothstep(0.03, 0.2, tide + lift - h)) * (0.5 + 0.5 * woodN3(np * vec3(7.0, 2.0, 7.0) + 31.0));
            vec3 footGrey = vec3(dot(footC, vec3(0.3, 0.5, 0.2)));
            float lineK = (1.0 - smoothstep(0.01, 0.035, abs(h - tide - lift))) * smoothstep(0.34, 0.62, woodN3(np * vec3(5.0, 1.0, 5.0) + 21.0));      // (the crust in broken lengths)
            float own = smoothstep(0.035, 0.1, abs(h - uFoot.w));                       // (the picture's own crust is left out: it is ruled level at one height. The line is drawn here, where THIS trunk's water stood)
            wash = mix(wash, footC, fk * (1.0 - wetK) * 0.8 * own);                     // above the line: the foot's own picture of the wash, joined to the tiled wash over it
            wash = mix(wash, mix(footC, footGrey, 0.45) * vec3(0.94, 0.96, 0.98), wetK * 0.22 * own);      // the foot's own picture through it: its runs, its darkening toward the water
            // damp, under the silt's film: duller, hardly bluer (blue below a level line is a reflection, and the trunk ends
            // at the line); and THE TIDE LINE: the silt's mark, a dirty line where the water stood, fading downward over a
            // hand. Both are kept as a MARK and laid on after the wash has been held under the bloom (the last extension):
            // painted into the wash's own colour they were squeezed to nothing with everything else that is pale, in
            // the lantern and out of it
            woodMark = mix(vec3(1.0), vec3(0.8, 0.815, 0.835), wetK) * mix(vec3(1.0), vec3(0.62, 0.64, 0.6) * (0.85 + 0.3 * woodN3(np * vec3(9.0, 3.0, 9.0) + 17.0)), silt * 0.75);
            wash = mix(wash, uLime * 1.03, lineK * fk * 0.4);
            coat = mix(coat, max(coat, 0.9 * cover), lineK * flood);                    // (the crust lies on wash and bark alike)
            // a column is round: the wash goes darker and bluer where the trunk turns from the eye
            float facing = abs(dot(normalize(vWNormal), normalize(uCameraPos - vWPos)));
            wash *= mix(vec3(0.68, 0.76, 0.93), vec3(1.0), smoothstep(0.08, 0.78, facing));
            // splashes on the bark above
            float fleck = smoothstep(0.86, 0.9, woodN3(np * 37.0)) * (1.0 - smoothstep(washAt + 0.05, washAt + 0.5, h)) * (1.0 - cover);
            coat = max(coat, 0.8 * fleck);
            // a few petals of the ride's own size stuck above the wet, among the smaller ones of the picture
            // (and A COLLAR of smaller ones in the hand above the wet, where the water left them as it fell a little: the
            // page's collar of petals on everything that enters the water. A dozen large ovals round a whole trunk were no collar)
            vec2 puv = vec2(atan(ln.z, ln.x) * 0.23 + vSeed * 3.0, h);
            float pet = max(woodPetal(puv, 0.4, 0.42), woodFleck(puv + 0.31, 0.047, 0.62, 0.25, 3.0)) * flood;
            wash = mix(wash, vec3(0.6, 0.56, 0.66) * (0.85 + 0.3 * woodN3(np * 60.0)), pet);
            coat = max(coat, pet);
            albedo = mix(albedo, wash, coat * bole);
            // the grease band, above the wash, with a run or two below it
            // (a sticky band tied round by hand: its own height, width and tilt on every trunk, and one trunk in six has
            // lost it. It was a ruled black belt at one height through the whole orchard)
            float gs = fract(vSeed * 23.17), gt = fract(vSeed * 51.3);
            float gb = washAt + 0.1 + 0.2 * gs + (vLocal.x * (gt - 0.5) + vLocal.z * (fract(gt * 7.0) - 0.5)) * 0.5, gw = 0.026 + 0.03 * fract(vSeed * 91.7) + 0.008 * sin(np.x * 31.0 + np.z * 23.0);
            float runN = woodN3(vec3(np.x * 21.0, 1.0, np.z * 21.0));
            float run = smoothstep(0.76, 0.86, runN) * (0.04 + 0.22 * fract(runN * 17.0));
            float band = smoothstep(gb - gw - run - 0.006, gb - gw - run, h) * (1.0 - smoothstep(gb + gw, gb + gw + 0.006, h)) * step(0.17, fract(vSeed * 13.7));
            albedo = mix(albedo, vec3(0.05, 0.034, 0.04) * (0.7 + 0.6 * woodN3(np * 9.0)), band * bole * 0.88);
            woodLime = coat * bole * (1.0 - band) * smoothstep(0.45, 0.9, dot(wash, vec3(0.3, 0.5, 0.2)) / max(dot(uLime, vec3(0.3, 0.5, 0.2)), 0.01));
          }
          // wet where the water has just been
          // (a hand high, its upper edge uneven, and dark: the page's wet band on everything that enters the water)
          float wetTop = 0.07 + 0.04 * woodN3(np * vec3(2.1, 0.0, 2.1) + 3.0);
          woodWet = (1.0 - smoothstep(wetTop - 0.035, wetTop, h)) * flood * bole;
          albedo *= mix(vec3(1.0), vec3(0.3, 0.36, 0.43), woodWet);
          woodLime *= 1.0 - woodWet;                                                    // (what is wet is no longer lime wash to the light: it holds none of its own and is not held pale. As wash it was hardly darker than the wash, and there was no dark line where a trunk goes into the water: the key painting's waterline)
        } else {
         if (uWash.z > 0.5) {
          // WORKED TIMBER (a crutch, a prop). Where the bark is off (the model's v says where) the wood has stood out
          // for years: silvered, and checked along its length in streaks a finger or two wide, pale ridge and dark
          // crack, which follow the pole however it is set (they go by the way round it, in its own space). The model's
          // paint cannot hold this (a pole has a point every 40 cm): three metres off it was a smooth brown tube.
          float bareW = smoothstep(0.35, 0.8, age) * (1.0 - step(0.25, -vUv0.x));       // (not the sacking: its u is -0.3)
          float arc = atan(ln.z, ln.x) * clamp(-vUv0.x, 0.03, 0.2), up = vLocal.y;       // metres round the pole (the model's u is minus its radius): a stout prop has more checks, not wider ones
          // KNOTS: where a side shoot was trimmed off flush there is an eye a thumb across, dark, and the grain parts
          // round it; one to every two or three hands of pole, none in line with another
          vec2 kc = vec2(arc / 0.12, up / 0.58 + vSeed * 3.0), ki = floor(kc);
          float kr1 = woodH(vec3(ki, 5.3)), kr2 = woodH(vec3(ki, 9.1)), kr3 = woodH(vec3(ki, 14.7));
          vec2 kd = (fract(kc) - 0.5 - (vec2(kr2, kr3) - 0.5) * 0.5) * vec2(0.12, 0.58);      // metres from the knot's middle, round the pole and along it
          float kq = length(kd / vec2(0.011, 0.018)), kn = step(kr1, 0.42);
          float eye = (1.0 - smoothstep(0.6, 1.0, kq)) * kn, part = (1.0 - smoothstep(1.0, 4.5, kq)) * kn;
          // CHECKS are short: a hand to a forearm long, each dying out, wandering a little round the pole as the grain
          // does, bent aside by a knot. (They ran a metre and more, dead straight, in one weight: three metres off the
          // pole by the kept lamp was a pinstriped pipe.)
          float ga = arc + sign(kd.x) * part * 0.009 + up * 0.012;
          float chk = woodN3(vec3(ga * 52.0 + vSeed * 9.0, up * 3.1, 3.0)), fine = woodN3(vec3(ga * 140.0 + 5.0, up * 7.0 + vSeed * 4.0, 7.0));
          float broad = woodN3(vec3(arc * 9.0 + 2.0, up * 1.3 + vSeed * 6.0, 11.0));          // weathered more on one flank than another, in lengths of a pace
          float ridge = smoothstep(0.28, 0.72, 0.64 * chk + 0.36 * fine);
          vec3 grey = vec3(dot(albedo, vec3(0.3, 0.5, 0.2)));
          albedo = mix(albedo, grey * vec3(1.0, 0.96, 1.04), 0.38 * (1.0 - step(0.25, -vUv0.x)));      // (dead bark on a cut pole is greyer than a living tree's)
          vec3 worn = mix(albedo, grey * vec3(0.98, 0.98, 1.08), 0.5) * mix(0.62, 1.55, ridge) * mix(0.82, 1.12, broad);
          worn *= mix(1.0, 0.82, part * (1.0 - eye)); worn = mix(worn, grey * vec3(0.5, 0.4, 0.4), eye * 0.85);
          albedo = mix(albedo, worn, bareW);
         }
         if (vWPos.y < 0.75 && flood > 0.0) {
          // wood that is no bole and stands in the water (a crutch): the flood's marks, by its height above the water.
          // From the water up: a hand of wet, nearly black; a collar of petals stuck where the water fell from; the
          // silt's stain, greened; and at the height the flood stood at, a pale line of dried silt
          float wy = vWPos.y; vec3 wq = vec3(vWPos.x * 4.0, wy * 1.2, vWPos.z * 4.0);
          float tide = uFoot.w + (woodN3(wq + 9.0) - 0.5) * 0.06 + (woodN3(wq * 3.3 + 2.0) - 0.5) * 0.035;
          float stain = (1.0 - smoothstep(tide - 0.02, tide + 0.012, wy)) * flood;
          albedo = mix(albedo, albedo * vec3(0.56, 0.7, 0.62), stain * 0.8);
          float crust = (1.0 - smoothstep(0.0, 0.014, abs(wy - tide))) * smoothstep(0.38, 0.62, woodN3(wq * vec3(3.1, 7.0, 3.1) + 5.0)) * flood;      // (in broken lengths: an unbroken pale ring is a strip of tape)
          albedo = mix(albedo, vec3(0.25, 0.27, 0.28), crust * 0.36);
          float wetTop = 0.075 + 0.035 * woodN3(wq * vec3(1.7, 0.0, 1.7) + 3.0);
          albedo *= mix(vec3(1.0), vec3(0.3, 0.36, 0.38), (1.0 - smoothstep(wetTop - 0.03, wetTop, wy)) * flood);
          vec3 wn = normalize(vWNormal);
          // (round the post in true metres: the model's u is minus its radius. Two scatters of different sizes laid over
          // each other, so that no grid shows; a dim lilac grey, not white: bright petals on a dark post are eyes)
          vec2 puv = vec2(atan(wn.z, wn.x) * clamp(-vUv0.x, 0.03, 0.2) + vSeed * 5.0, wy - 0.02);
          float pet = max(woodFleck(puv, 0.052, 0.5, 0.27, 0.0), woodFleck(puv + 0.37, 0.036, 0.36, 0.19, 5.0)) * flood;
          albedo = mix(albedo, vec3(0.27, 0.255, 0.32) * (0.75 + 0.5 * woodN3(wq * 9.0)), pet * 0.85);
         }
        }
      }
      vec3 woodOwn = albedo;                                                          // the wood's own colour, before the hour is put on it (what a lamp lights)`,
    light: 'glow += uSelf * 0.9 * woodLime * (1.0 - 0.9 * woodWet) * dot(woodMark, vec3(0.3333));',                 // lime wash holds the last light, as blossom does (not where it is wet)
    // thin wood keeps out of the painter's filter: off the bole the model's u is minus the limb's radius
    final: 'if (vUv0.x < -0.0004 && -vUv0.x * uCrispAt < length(vViewPos)) gl_FragColor.a = -15.0;',
  };
  if (o.still) uniforms.uBlow.value.z = 0;                      // (a prop does not sway: and it keeps uniforms of its own)
  const dusk = o.dusk === undefined ? shared && shared.dusk : o.dusk;
  // LIME WASH NEVER BLOOMS (the page: "luminous without blooming"; "keep it under 0.85"). The hour's own hold leaves
  // lamp light out, on purpose, so a washed trunk a metre from the bow lantern burnt out and wore a halo. After
  // everything else has lit it, washed wood is eased in under 0.8 whatever lights it, keeping its hue; bark is left alone.
  // (And first it gives back less than half of a lamp's light, as chalk does: held under the bloom by the squeeze alone,
  // a washed trunk three metres from the bow lantern lost every brush mark and stood as a column of pink satin.)
  const cap = { light: `c -= woodOwn * (pointLight(uLanternPos, uLanternColor, uLanternRadius, N) + pointLight(uLampPos, uLampColor, uLampRadius, N)) * ${(o.limeDrink ?? 0.66).toFixed(2)} * woodLime;
    { float wm = max(c.r, max(c.g, c.b)); if (wm > 0.58) c *= mix(1.0, (0.58 + 0.2 * (1.0 - exp(-(wm - 0.58) / 0.2))) / wm, woodLime); }
    c *= mix(vec3(1.0), woodMark, clamp(woodLime * 1.6, 0.0, 1.0));` };      // (the flood's marks on the wash: after the hold, so that they keep their strength in any light)
  // o.drink (0..1): how much of the bow lantern's and the kept lamp's light the wood gives back LESS than its paint
  // would (old damp timber is matt and dark: a prop three metres from the lantern was the most saturated thing in
  // the picture, and the one that stands behind the kept lamp was a pale slab between the flame and the hollow)
  // (Taken off the wood's OWN colour, woodOwn: the hour darkens the paint and then gives a lamp's light back on the paint's
  // own colour, so taking it off the darkened paint left more than half of the kept lamp's light on a prop.)
  const drink = o.drink ? { light: `c -= woodOwn * (pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * ${(+o.drink).toFixed(2)} + pointLight(uLampPos, uLampColor, uLampRadius, N) * ${Math.min(0.92, o.drink * 1.7).toFixed(2)});` } : null;      // (the kept lamp more: it must be read against dark)
  // o.barkDrink (0..1): LIVING BARK IN THE BOW LANTERN STAYS DARK PLUM (the page: dark plum is every silhouette; wood
  // never glows). Plum-brown paint in amber light is brick orange: the trunk beside the boat was a terracotta pot, the
  // most saturated warm thing in the picture after the band, and it went with the boat. The bark (not the wash on it)
  // gives back that much less of the bow lantern's light, and what it does give back is drawn half way from the
  // lantern's amber to the bark's own plum: warm still, and dark. The kept lamp and the cast's lights are untouched.
  // (Left out, the wood is as it was: the orchard in snow, which wears this material, chooses for itself.)
  const barkLamp = o.barkDrink ? { light: `{ vec3 barkL = woodOwn * pointLight(uLanternPos, uLanternColor, uLanternRadius, N);
      c += (mix(barkL, dot(barkL, vec3(0.3, 0.5, 0.2)) * vec3(1.14, 0.9, 1.04), ${(o.barkHue ?? 0.5).toFixed(2)}) * ${(1 - o.barkDrink).toFixed(2)} - barkL) * (1.0 - woodLime); }` } : null;
  return { color: '#ffffff', brush: 0.75, shade: 0.85, extend: [fx, dusk, washed ? cap : null, barkLamp, drink].filter(Boolean), uniforms };
}

/** The picture a spray of may is cut from: four corymbs (close clusters of small white flowers, each cluster its own
 *  shape), 256 x 256, cut out by its alpha. Smaller copies close up, so that far off a spray is a pale dab, not nothing. */
function mayPicture() {
  const W = 256, cv = document.createElement('canvas'); cv.width = cv.height = W;
  const g = cv.getContext('2d', { willReadFrequently: true });
  let sd = 4177; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const tones = ['#ffffff', '#f3eef6', '#faf5f0', '#e9e4f1', '#ffffff'];
  for (let cell = 0; cell < 4; cell++) {
    const cx = (cell % 2) * 128 + 64, cy = Math.floor(cell / 2) * 128 + 64, lumps = 4 + Math.floor(rnd() * 3);
    for (let l = 0; l < lumps; l++) {
      const a = rnd() * 6.283, r = l ? 18 + rnd() * 20 : 0, lx = cx + Math.cos(a) * r, ly = cy + Math.sin(a) * r * 0.8, R = 13 + rnd() * 8;
      for (let i = 0; i < 9; i++) { const b = rnd() * 6.283, q = Math.sqrt(rnd()) * R; g.fillStyle = tones[Math.floor(rnd() * tones.length)]; g.beginPath(); g.arc(lx + Math.cos(b) * q, ly + Math.sin(b) * q, 4.2 + rnd() * 2.6, 0, 6.283); g.fill(); }
    }
  }
  const levels = [];
  let w = W, k = 0;
  for (;;) {
    let c = cv;
    if (k) { c = document.createElement('canvas'); c.width = c.height = w; const q = c.getContext('2d', { willReadFrequently: true }); q.imageSmoothingQuality = 'high'; q.drawImage(cv, 0, 0, w, w); }
    const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, w).data, gain = 1 + 0.9 * k;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 12) { d[i] = 240; d[i + 1] = 236; d[i + 2] = 244; } d[i + 3] = Math.min(255, d[i + 3] * gain); }
    levels.push({ data: new Uint8Array(d.buffer.slice(0)), width: w, height: w });
    if (w === 1) break;
    w = Math.max(1, w >> 1); k++;
  }
  const tex = new THREE.DataTexture(levels[0].data, W, W, THREE.RGBAFormat);
  tex.mipmaps = levels; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4; tex.needsUpdate = true;
  return tex;
}

export async function build(ctx, plan, shared) {
  const { kit } = ctx;
  const data = await (await fetch(WOOD_JSON)).json(), models = data.models;
  const [bark, lime, foot] = await Promise.all([ctx.tex('art/orchard/bark.webp', { repeat: true }), ctx.tex('art/orchard/lime.webp', { repeat: true }), ctx.tex('art/orchard/limefoot.webp', { repeat: true })]);
  for (const t of [lime, foot]) t.anisotropy = 4;
  const washOpts = { lime, foot, wash: Q.has('wash') ? +Q.get('wash') : undefined, bare: Q.get('nowash') === '1', flood: Q.has('flood') ? +Q.get('flood') : undefined,
    barkDrink: Q.has('barkdrink') ? +Q.get('barkdrink') : 0.5, barkHue: Q.has('barkhue') ? +Q.get('barkhue') : undefined };      // (&barkdrink=0: the bark gives the bow lantern back in full, as it did)
  const wood = woodOptions(ctx, shared, bark, washOpts);
  const tints = ['#ffffff', '#efe9f2', '#f6eee6', '#e4e7ee'];                      // one of four wear tints
  const materials = [];

  // ---------------------------------------------------------------------------------------------- every tree and its place
  const entries = [], byTree = new Map();
  for (const [kind, list] of [['sail', plan.trees.trees], ['far', plan.trees.far], ['mote', plan.trees.motes]]) for (const t of list) {
    const e = { t, kind, model: modelOf(t), matrix: matrixOf(t, plan), tint: tints[t.tint || 0] };
    entries.push(e); byTree.set(t, e);
  }
  const groups = {};
  for (const e of entries) (groups[e.model] || (groups[e.model] = [])).push(e);
  const spot = (list) => list.map((e) => ({ position: [e.t.x, 0, e.t.z], tint: e.tint }));        // (where each stands, for the batch's bounds; the true matrices are written below)
  const put = (mesh, k, e) => { mesh.setMatrixAt(k, e.matrix); mesh.setColorAt(k, _c.set(e.tint)); };
  const flush = (mesh, n) => { mesh.count = n; mesh.visible = n > 0; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  const batch = async (file, list, name) => { const mesh = (await kit.models(file, spot(list), { ...wood, name })).meshes[0]; mesh.boundingSphere.radius += 2; materials.push(mesh.material); return mesh; };

  // ---------------------------------------------------------------------------------------------- four weights of every design
  // One skeleton, four weights of flesh (apple_X: about 7,800 triangles; apple_X_lo: about 1,900; apple_X_far: under
  // 600; apple_X_mote: about 130). Which one a tree wears goes by how far the boat is from it, and by its row:
  //   an avenue tree           the heavy one within 20 m, the second to 55 m, the third to 115 m, the lightest beyond
  //   the rows nobody enters   the same, but the second only to 45 m (they are seen across the growth, never from under)
  //   the rows in mist         the third within 62 m (the boat at the edge of its water), the lightest beyond
  // A tree changes weight as the boat comes and goes, with three metres of slack so that it does not flicker; each
  // weight of each design is one draw for the whole orchard, and an empty one is not drawn.
  const WEIGHT = ['near', 'lo', 'far', 'mote'], forced = WEIGHT.indexOf(Q.get('lod')), R_IN = +(Q.get('lodr') || 20), SLACK = 3;
  const REACH = { sail: [R_IN, 55, 115], far: [R_IN, 45, 115], mote: [0, 0, 62] };
  const weightAt = (R, d) => (d < R[0] ? 0 : d < R[1] ? 1 : d < R[2] ? 2 : 3);
  const levelOf = (kind, d, was) => {
    if (forced >= 0) return forced;
    const R = REACH[kind];
    return was <= 3 && was >= weightAt(R, d - SLACK) && was <= weightAt(R, d + SLACK) ? was : weightAt(R, d);
  };
  const groves = [];
  for (const name of Object.keys(groups)) {
    const list = groups[name], files = models[name].files, meshes = [];
    for (const w of WEIGHT) meshes.push(await batch(files[w].file, list, name + (w === 'near' ? '' : '_' + w)));
    groves.push({ name, list, meshes, level: new Uint8Array(list.length).fill(9), seen: new Uint8Array(list.length), dirty: true });
  }
  // A tree that stands well outside what the rider can see is not drawn at all (the engine draws a whole instanced
  // batch or none of it, so without this every tree of the orchard was drawn in each of a frame's three pictures
  // wherever the rider looked). "Well outside": further than 16 m from the boat AND more than 26 degrees beyond the
  // edge of the picture, measured round the horizon; the more the rider looks up or down the wider that grows, and
  // looking steeply up nothing is left out (the picture then reaches most of the way round the horizon). The mirror
  // and the picture without the water are drawn from the same eye, so one test serves all three. &cull=0 (developer)
  // draws every tree always.
  const CULL = Q.get('cull') !== '0', fwd = new THREE.Vector3(), invG = new THREE.Matrix4();
  const sortGroves = () => {
    const bx = ctx.boat.x, bz = ctx.boat.z, cam = ctx.engine.camera;
    let fx = 0, fz = 0, cosLimit = -2;
    if (CULL && cam) {
      cam.getWorldDirection(fwd); fwd.transformDirection(invG.copy(ctx.group.matrixWorld).invert());
      const fl = Math.hypot(fwd.x, fwd.z), half = Math.atan(Math.tan(cam.fov * Math.PI / 360) * cam.aspect), limit = half + 0.45 + Math.abs(Math.asin(Math.max(-1, Math.min(1, fwd.y)))) * 1.25;
      if (fl > 0.3 && limit < Math.PI) { fx = fwd.x / fl; fz = fwd.z / fl; cosLimit = Math.cos(limit); }
    }
    for (const g of groves) {
      for (let i = 0; i < g.list.length; i++) {
        const e = g.list[i], dx = e.t.x - bx, dz = e.t.z - bz, d = Math.hypot(dx, dz), now = levelOf(e.kind, d, g.level[i]);
        const seen = d < 16 || dx * fx + dz * fz > cosLimit * d ? 1 : 0;
        if (now !== g.level[i] || seen !== g.seen[i]) { g.level[i] = now; g.seen[i] = seen; g.dirty = true; }
      }
      if (!g.dirty) continue;
      const k = [0, 0, 0, 0];
      for (let i = 0; i < g.list.length; i++) if (g.seen[i]) put(g.meshes[g.level[i]], k[g.level[i]]++, g.list[i]);
      for (let w = 0; w < 4; w++) flush(g.meshes[w], k[w]);
      g.dirty = false;
    }
  };
  for (const g of groves) for (const m of g.meshes) flush(m, 0);                  // (nothing is drawn until the boat is somewhere: the first frame sorts them)

  const world = (e, x, y, z, target = new THREE.Vector3()) => target.set(x, y, z).applyMatrix4(e.matrix);

  // ---------------------------------------------------------------------------------------------- the crutches
  // source-art/models/orchard/crutch.py: worked timber, each placed by its CRADLE (where the bough's underside rests)
  // and turned to its bough (the bough runs along the crutch's own X). Two kinds (assets/models/orchard/crutches.json
  // says how each design stands; nothing about them is typed in here):
  //   a forked pole (crutch_A; crutch_B, pieced out of two poles; crutch_H, a young tree's whole stem): modelled
  //     upright and SET ASLANT here, as a prop is: 7 to 12 degrees in its bough's own plane;
  //   shear legs (crutch_C .. _G): two poles crossed under the bough and lashed where they cross, their feet apart
  //     ALONG the bough: the key painting's leaning pairs.
  // Thirteen stand under the avenues' long low boughs (the tree's own design says where its cradle is): pairs (C, D),
  // each either way about, and three forked poles (A) set well aslant, so that the two that face each other across
  // the lane are never alike and none is a post under a bar. Nine stand under the
  // oldest tree's limbs, where heroes.js says each limb bears (shared.tree.props: a level facet on the limb's
  // underside), turned to the limb that passes over them (shared.tree.paths; without that module, by the plan's own
  // numbers): stout pairs under the four heavy limbs (F, G), taller pairs with a pole lashed across them under the
  // skirt boughs (D; and E, in this year's pale timber, under two: the page), and one tall forked pole (H) under the
  // bough the lane passes, where two feet have no room (its outer foot would stand half a metre from the composed line).
  // Where each leg goes into the water is worked out here from the design's own numbers: every foot answers a wake
  // with a ring, keeps the hull off (a small collider of its own wherever it stands away from the plan's), and
  // catches what floats.
  const propFeet = [];                                             // the oldest tree's nine: where each one's legs stand in the water
  {
    const F = shared.frame, T = plan.tree, rc = ctx.rng(4617);
    const how = (await (await fetch('assets/models/orchard/crutches.json')).json()).designs;
    const lists = Object.fromEntries(Object.keys(how).map((k) => [k, []])), feet = [];
    const wear = ['#ffffff', '#ece8f1', '#f5f0ea', '#e3e5ee', '#f8f3f5'];
    const P0 = new THREE.Vector3(), W = new THREE.Vector3();
    // name: the design; at: its cradle; way: the bough's heading there; lean: how far a forked pole is set aslant
    // (radians; +: its foot stands toward the bough's own +X end); tilt: how far it leans to one SIDE of its bough
    // (radians, about the bough's own line; left out: plumb that way, give or take a degree)
    const add = (name, at, way, lean = 0, tilt = null) => {
      const d = how[name];
      if (at.y > d.reach + 0.05) console.error(`orchard/kit_trees: ${name} is made for a cradle up to ${d.reach} m and stands under one at ${at.y.toFixed(2)} m`);
      const own = (rc() - 0.5) * 0.05;
      const m = new THREE.Matrix4().compose(at, _q.setFromEuler(_e.set(tilt === null ? own : tilt, way, d.kind === 'single' ? lean : (rc() - 0.5) * 0.04, 'YXZ')), _s.setScalar(1));
      lists[name].push({ matrix: m, tint: wear[Math.floor(rc() * wear.length)], t: { x: at.x, z: at.z } });
      // where it meets the water: down the pole (or down each leg from where the two cross) to y = 0, in the realm
      const foot = (px, py, pz, dx, dy, dz) => { P0.set(px, py, pz).applyMatrix4(m); W.set(dx, dy, dz).transformDirection(m); const k = P0.y / -W.y; return { x: P0.x + W.x * k, z: P0.z + W.z * k, r: d.radius || 0.07 }; };
      const mine = d.kind === 'single' ? [foot(0, 0, 0, 0, -1, 0)] : [foot(0, -d.cross, -d.radius, -Math.sin(d.rake[0]), -Math.cos(d.rake[0]), 0), foot(0, -d.cross, d.radius, Math.sin(d.rake[1]), -Math.cos(d.rake[1]), 0)];
      // The plan's own collider stands under the cradle. A forked pole set aslant goes into the water somewhere else: the
      // plan's collider GOES WITH ITS FOOT (the engine keeps the very object the realm gave it), or the hull would be
      // held off a place where nothing stands. A pair's two feet stand either side of the cradle: each foot that is
      // away from it keeps the hull off by itself, and the plan's stays between them.
      const planned = d.kind === 'single' && ctx.state.colliders ? ctx.state.colliders.find((c) => c.r < 1 && Math.hypot(c.x - at.x, c.z - at.z) < 0.5) : null;
      for (const f of mine) {
        feet.push(f);
        if (planned) { planned.x = f.x; planned.z = f.z; continue; }
        if (Math.hypot(f.x - at.x, f.z - at.z) > 0.3) {
          const c = { x: f.x, z: f.z, r: 0.25, flow: true };
          ctx.addCollider(c); if (ctx.state.colliders) ctx.state.colliders.push(c);      // (and the realm bends the current round it, as round every post: orchard.js)
        }
      }
      return mine;
    };
    // ---- the avenues: by their place up the orchard. SHEAR LEGS, MOSTLY: a bough on one upright pole is a T against the
    // blossom (the look back, postcard 7, had a telegraph pole either side of it: the plain forked pole on the left, the
    // pieced one, thick and banded, on the right). So ten of the thirteen are pairs: the slim pair (C) and the tall pair
    // with a pole lashed across its legs a metre above the water (D), each also turned about (its other leg toward the
    // lane: a different crook, a different kink), and never two alike facing each other across the lane; three are the
    // forked pole (A), set well aslant (10 to 15 degrees: a prop leaning, not a post standing). The pieced pole (B) is
    // not used here any more (its file stays: the orchard in snow stands it by rules of its own).
    const low = entries.filter((e) => models[e.model].crutch).sort((p, q) => (p.t.s - q.t.s) || (p.t.d - q.t.d));
    const TURN = [['crutch_C', 0], ['crutch_D', 0], ['crutch_A', 0], ['crutch_C', 1], ['crutch_D', 1], ['crutch_C', 0], ['crutch_A', 0], ['crutch_D', 0], ['crutch_C', 1], ['crutch_D', 1], ['crutch_C', 0], ['crutch_A', 0], ['crutch_D', 0]];
    low.forEach((e, k) => {
      const c = models[e.model].crutch, [name, about] = TURN[k % TURN.length];
      _e.setFromRotationMatrix(e.matrix, 'YXZ');
      // (a forked pole leans back against the weight: three in five with the foot out toward the lane, the rest the other way)
      add(name, world(e, c.top[0], c.top[1], c.top[2]), _e.y + about * Math.PI, (rc() < 0.6 ? 1 : -1) * (0.17 + rc() * 0.09));
    });
    // ---- the oldest tree's nine
    const given = shared.tree && shared.tree.props, paths = (shared.tree && shared.tree.paths) || [];
    const lines = [T.lampLimb.line, T.arch.line, T.westLimb.line];
    // THE FIRST PROP STANDS BEHIND THE KEPT LAMP (the page puts it at (100, -1), four metres beyond the flame on the lamp's
    // own limb: from the whole lane the two are in line). A stout pair stood there with its legs in line with the lane:
    // one pale slab a forearm wide from the limb to the water, lit by the lamp, between the flame and the hollow: the
    // kept lamp on a fence post. It is one dark forked pole now (H), leaning to the SOUTH side of the limb with its
    // foot half a metre out, so that from the lane it stands clear to the left of the flame and falls away from it as the
    // boat comes on (further out and its foot stands in the edge of the eleventh postcard, two metres from the eye);
    // and every prop gives back only a fifteenth of the kept lamp's light (woodOptions, drink).
    const PROPS = ['crutch_H', 'crutch_G', 'crutch_F', 'crutch_G', 'crutch_E', 'crutch_D', 'crutch_H', 'crutch_E', 'crutch_D'];
    T.props.forEach(([s, d, h], i) => {
      const g = given && given[i], at = g && Number.isFinite(g.x) ? new THREE.Vector3(g.x, g.y, g.z) : F.at(s, d, h);
      // which way the limb runs here: along the modelled limb that passes over the prop (shared.tree.paths); else along
      // the plan's own line if the prop stands under one; else out from the bole
      let way = null, best = 2.5;
      for (const q of paths) for (let k = 0; k + 1 < q.path.length; k++) {
        const a = q.path[k], b = q.path[k + 1], L2 = (b.x - a.x) ** 2 + (b.z - a.z) ** 2 || 1, u = Math.min(1, Math.max(0, ((at.x - a.x) * (b.x - a.x) + (at.z - a.z) * (b.z - a.z)) / L2));
        const off = Math.hypot(at.x - a.x - (b.x - a.x) * u, at.z - a.z - (b.z - a.z) * u, (at.y - (a.y + (b.y - a.y) * u)) * 0.5);
        if (off < best) { best = off; way = Math.atan2(-(b.z - a.z), b.x - a.x); }
      }
      if (way === null) {
        let ds = s - T.at[0], dd = d - T.at[1], near = 1.5;
        for (const line of lines) for (let k = 0; k < line.length - 1; k++) {
          const [s0, d0] = line[k], [s1, d1] = line[k + 1], L2 = (s1 - s0) ** 2 + (d1 - d0) ** 2, u = Math.min(1, Math.max(0, ((s - s0) * (s1 - s0) + (d - d0) * (d1 - d0)) / L2));
          const off = Math.hypot(s - s0 - (s1 - s0) * u, d - d0 - (d1 - d0) * u);
          if (off < near) { near = off; ds = s1 - s0; dd = d1 - d0; }
        }
        const a = F.at(s, d), b = F.at(s + ds * 0.1, d + dd * 0.1); way = Math.atan2(-(b.z - a.z), b.x - a.x);
      }
      let tilt = null;
      if (i === 0) {                                               // (the side of the limb that is the lane's: the page's -d)
        rc();                                                      // (a pair stood here and drew one number more: the eight after it keep theirs)
        const a = Math.asin(Math.min(0.5, 0.5 / Math.max(at.y, 1))), dAt = plan.locate(at.x, at.z, {}).d;
        const probe = new THREE.Vector3(0, -at.y, 0).applyEuler(_e.set(a, way, 0, 'YXZ')).add(at);
        tilt = plan.locate(probe.x, probe.z, {}).d < dAt ? a : -a;
      }
      propFeet[i] = add(PROPS[i], at, way, (i % 2 ? 1 : -1) * (0.07 + rc() * 0.05), tilt);
    });
    const still = woodOptions(ctx, shared, bark, { still: true, timber: Q.get('timber') !== '0', flood: washOpts.flood, drink: Q.has('drink') ? +Q.get('drink') : 0.55 });      // (no lime wash on a prop; the flood's marks by its height above the water)
    for (const [name, list] of Object.entries(lists)) {
      if (!list.length) continue;
      const mesh = (await kit.models(`models/orchard/${name}.glb`, spot(list), { ...still, name })).meshes[0];
      mesh.boundingSphere.radius += 2;                                                        // (a pair's feet stand well away from its cradle)
      list.forEach((e, k) => put(mesh, k, e)); flush(mesh, list.length);
    }
    shared.counts = { ...(shared.counts || {}), crutches: Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, v.length])) };
    shared.crutchFeet = feet;                                       // where each leg goes into the water: for its ring
  }

  // ---------------------------------------------------------------------------------------------- prunings, lodged
  // Not on the page's list: mine, for the close band. The flood runs west; what floats fetches up against the east
  // side of whatever stands in it. Against forty-odd trunks and a few crutches lies a little raft of cut twigs (this
  // winter's prunings, left where they fell) with petals caught among them: three designs grown here, one draw each.
  {
    const rl = ctx.rng(7741), lin = (hex) => { _c.set(hex); return [_c.r, _c.g, _c.b]; };
    const raft = (seed) => {
      const r = ctx.rng(seed), pos = [], nor = [], col = [], idx = [], WET = lin('#2c2429'), DRY = lin('#4a4046'), PETAL = lin('#d9d1de');
      const stick = (a, b, rad, c0, c1) => {
        const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]) || 1, u = [d[0] / l, d[1] / l, d[2] / l], v = [-u[2], 0, u[0]], w = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const base = pos.length / 3;
        for (const [p, k, c] of [[a, 1, c0], [b, 0.6, c1]]) for (let i = 0; i < 3; i++) { const an = i / 3 * 6.283, cx = Math.cos(an), sx = Math.sin(an), n = [v[0] * cx + w[0] * sx, v[1] * cx + w[1] * sx, v[2] * cx + w[2] * sx]; pos.push(p[0] + n[0] * rad * k, p[1] + n[1] * rad * k, p[2] + n[2] * rad * k); nor.push(n[0], n[1], n[2]); col.push(c[0], c[1], c[2]); }
        for (let i = 0; i < 3; i++) { const j = (i + 1) % 3; idx.push(base + i, base + j, base + 3 + j, base + i, base + 3 + j, base + 3 + i); }
      };
      const n = 3 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        // a cut twig lying across the water's way, a little bent, with a side twig or two that lift out of the water
        const a0 = (r() - 0.5) * 0.7, len = 0.3 + r() * 0.55, x = (r() - 0.5) * 0.45, z = 0.03 + i * 0.07 + r() * 0.05, y = 0.012 + r() * 0.015, rad = 0.006 + r() * 0.005;
        const a = [x - Math.cos(a0) * len / 2, y, z - Math.sin(a0) * len / 2], bend = a0 + (r() - 0.5) * 0.5;
        const m = [x + (r() - 0.5) * 0.04, y + 0.006, z + (r() - 0.5) * 0.03], b = [m[0] + Math.cos(bend) * len / 2, y + (r() - 0.5) * 0.02, m[2] + Math.sin(bend) * len / 2];
        const tone = r() < 0.5 ? DRY : WET;
        stick(a, m, rad, WET, tone); stick(m, b, rad * 0.85, tone, tone);
        for (let q = 0; q < 1 + Math.floor(r() * 2); q++) {
          const u = 0.25 + r() * 0.6, from = u < 0.5 ? [a[0] + (m[0] - a[0]) * u * 2, y + 0.004, a[2] + (m[2] - a[2]) * u * 2] : [m[0] + (b[0] - m[0]) * (u - 0.5) * 2, y + 0.004, m[2] + (b[2] - m[2]) * (u - 0.5) * 2];
          const a1 = a0 + (r() < 0.5 ? 1 : -1) * (0.5 + r() * 0.5), l2 = len * (0.2 + r() * 0.22);
          stick(from, [from[0] + Math.cos(a1) * l2, from[1] + 0.02 + r() * 0.05, from[2] + Math.sin(a1) * l2], rad * 0.6, tone, DRY);
        }
      }
      for (let i = 0; i < 7; i++) {                                // petals caught among them
        const x = (r() - 0.5) * 0.7, z = 0.02 + r() * 0.42, a = r() * 6.283, base = pos.length / 3, y = 0.016;
        for (let k = 0; k < 3; k++) { const an = a + k * 2.094; pos.push(x + Math.cos(an) * 0.026, y, z + Math.sin(an) * (k ? 0.02 : 0.034)); nor.push(0, 1, 0); col.push(PETAL[0], PETAL[1], PETAL[2]); }
        idx.push(base, base + 1, base + 2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
      return g;
    };
    const mat = shared.paint({ color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, brush: 0.3, shade: 0.7 });
    const per = [[], [], []];
    const lodge = (x, z, s, r = 0.26) => {                       // (the raft's own +Z is upstream: it lies against the east side of a thing r metres thick there)
      const h = plan.heading(s);
      per[Math.floor(rl() * 3)].push({ position: [x + Math.sin(h) * r, 0, z + Math.cos(h) * r], rotation: [0, h + (rl() - 0.5) * 0.5, 0], scale: 0.8 + rl() * 0.5 });
    };
    const share = Q.has('prunings') ? +Q.get('prunings') : 0.4;      // (&prunings=1: against every trunk, to look at them)
    for (const t of plan.trees.trees) if (rl() < share) lodge(t.x, t.z, t.s);
    plan.tree.props.forEach(([ps, pd], i) => {                   // (against one leg of every other prop: where the timber is, not under its cradle)
      if (i % 2) return;
      const f = propFeet[i] && propFeet[i][0], p = f ? [f.x, f.z] : plan.xz(ps, pd);
      lodge(p[0], p[1], ps, f ? f.r + 0.03 : 0.12);
    });
    per.forEach((list, k) => { if (list.length) { const m = kit.instances(raft(300 + k * 17), mat, list); m.name = `prunings ${'abc'[k]} x${list.length}`; ctx.only(m, 'direct'); } });
    shared.counts = { ...(shared.counts || {}), prunings: per.reduce((n, l) => n + l.length, 0) };
  }

  // ---------------------------------------------------------------------------------------------- the hedge
  // hawthorn_6m (source-art/models/orchard/hawthorn.py): a laid hedge let go, in may blossom, 82 m either side of the
  // centre line, walked in 6 m pieces (the bend lengthens the outside hedge and shortens the inside one; on the inside
  // the two straights meet in a corner). Never nearer than 50 m to the boat: a pale ragged band and its reflection.
  {
    const H = plan.hedge, list = [], rh = ctx.rng(8233), tintH = ['#ffffff', '#f1edf6', '#f8f1ee', '#e9e9f2'];
    const piece = (k, d, sx = 1) => { const p = plan.xz(k, d + (rh() - 0.5) * 0.9); list.push({ position: [p[0], -0.05 - rh() * 0.15, p[1]], rotation: [0, plan.heading(k) + Math.PI / 2 + (rh() < 0.5 ? Math.PI : 0) + (rh() - 0.5) * 0.14, 0], scale: [sx * (0.98 + rh() * 0.08), 0.8 + rh() * 0.32, 0.9 + rh() * 0.3], tint: tintH[Math.floor(rh() * 4)] }); };
    const run = (d, from, to) => { for (let s0 = from; s0 < to; s0 += H.piece) piece(s0 + H.piece / 2, d); };
    run(H.left.d, H.left.from, plan.bend.from);
    { const R = (plan.bend.to - plan.bend.from) / (plan.bend.deg * Math.PI / 180), n = Math.ceil((R + 82) * (plan.bend.deg * Math.PI / 180) / H.piece); for (let i = 0; i < n; i++) piece(plan.bend.from + (i + 0.5) / n * (plan.bend.to - plan.bend.from), H.left.d, 1.03); }
    run(H.left.d, plan.bend.to, H.left.to);
    for (const r of H.right) run(r.d, r.from, r.to);
    const holds = { uniforms: { uSelf: shared.blossomSelf || { value: new THREE.Color(0, 0, 0) } }, fragmentPars: 'uniform vec3 uSelf;', light: 'glow += uSelf * ownColour * 0.6;' };
    const hedge = await kit.models('models/orchard/hawthorn_6m.glb', list, { color: '#ffffff', brush: 0.85, steps: 2, shade: 0.62, name: 'hawthorn_6m', extend: [shared.dusk, holds].filter(Boolean) });
    shared.counts = { ...(shared.counts || {}), hedge: hedge.count };
    // ---- sprays of may: cut cards (a drawn picture of a corymb: a close cluster of small flowers) standing a hand or two
    // out of the mass all over its top and flanks, so that the hedge's outline against the mist is ragged with separate
    // dabs and its surface is dabbed, as the trees' blossom is. Planted on the model's own surface (found by sampling
    // its triangles), eighteen to a piece, all of them one mesh.
    if (Q.get('may') !== '0') {
      const picture = mayPicture(); ctx.onDispose(() => picture.dispose());
      const geo = hedge.meshes[0].geometry, pos = geo.attributes.position, colA = geo.attributes.color, idx = geo.index;
      const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), N = new THREE.Vector3(), U = new THREE.Vector3(), V = new THREE.Vector3(), Pw = new THREE.Vector3();
      const tris = [], cum = []; let area = 0;
      const nt = (idx ? idx.count : pos.count) / 3, vi = (i) => (idx ? idx.getX(i) : i);
      for (let f = 0; f < nt; f++) {
        const a = vi(f * 3), b = vi(f * 3 + 1), c = vi(f * 3 + 2);
        if (colA && colA.getX(a) + colA.getY(a) + colA.getZ(a) < 0.5) continue;      // (the mass only: not the dark pleachers and stakes under it)
        A.fromBufferAttribute(pos, a); B.fromBufferAttribute(pos, b); C.fromBufferAttribute(pos, c);
        N.subVectors(B, A).cross(V.subVectors(C, A)); const ar = N.length() / 2; N.normalize();
        if (N.y < -0.3 || ar < 1e-6) continue;                                        // (nothing flowers on its underside)
        area += ar * (0.3 + Math.max(0, N.y)); cum.push(area); tris.push([A.clone(), B.clone(), C.clone(), N.clone()]);
      }
      const PER = 18, P = [], NN = [], UV = [], COL = [], IDX = [], rm = ctx.rng(9311);
      const m = new THREE.Matrix4(), nm = new THREE.Matrix3(), TOPC = new THREE.Color('#e6dde9'), FLK = new THREE.Color('#9d98c0'), tintC = new THREE.Color();
      for (const it of tris.length ? list : []) {
        const sc = Array.isArray(it.scale) ? it.scale : [it.scale, it.scale, it.scale];
        m.compose(_p.set(it.position[0], it.position[1], it.position[2]), _q.setFromEuler(_e.set(it.rotation[0], it.rotation[1], it.rotation[2], 'XYZ')), _s.set(sc[0], sc[1], sc[2]));
        nm.getNormalMatrix(m); tintC.set(it.tint || '#ffffff');
        for (let k = 0; k < PER; k++) {
          const x = rm() * area; let lo = 0, hi = cum.length - 1;
          while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < x) lo = mid + 1; else hi = mid; }
          const t = tris[lo]; let u = rm(), v = rm(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
          Pw.copy(t[0]).multiplyScalar(1 - u - v).addScaledVector(t[1], u).addScaledVector(t[2], v).applyMatrix4(m);
          N.copy(t[3]).applyMatrix3(nm).normalize();
          const half = 0.3 + rm() * 0.34, out = 0.08 + rm() * 0.3, light = Math.min(1, Math.max(0, (N.y + 0.1) / 0.8));
          Pw.addScaledVector(N, out); Pw.y += rm() * 0.12;
          // the card: square to the mass's own normal there, turned and tipped its own way
          N.x += (rm() - 0.5) * 0.9; N.y += (rm() - 0.5) * 0.6; N.z += (rm() - 0.5) * 0.9; N.normalize();
          U.set(rm() - 0.5, rm() - 0.5, rm() - 0.5); U.addScaledVector(N, -U.dot(N)); if (U.lengthSq() < 1e-4) U.set(N.z, 0, -N.x); U.normalize(); V.crossVectors(N, U);
          const cell = Math.floor(rm() * 4), cu = (cell % 2) * 0.5 + 0.25, cv = Math.floor(cell / 2) * 0.5 + 0.25, base = P.length / 3, tone = 0.86 + rm() * 0.28;
          for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
            P.push(Pw.x + (U.x * dx + V.x * dy) * half, Pw.y + (U.y * dx + V.y * dy) * half, Pw.z + (U.z * dx + V.z * dy) * half);
            NN.push(N.x * 0.5, N.y * 0.5 + 0.6, N.z * 0.5);                             // (lit as part of the hedge's top, not card by card)
            UV.push(cu + dx * 0.235, cv + dy * 0.235);
            COL.push((FLK.r + (TOPC.r - FLK.r) * light) * tone * tintC.r, (FLK.g + (TOPC.g - FLK.g) * light) * tone * tintC.g, (FLK.b + (TOPC.b - FLK.b) * light) * tone * tintC.b);
          }
          IDX.push(base, base + 1, base + 2, base, base + 2, base + 3);
        }
      }
      if (P.length) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(NN, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(COL, 3));
        g.setIndex(IDX); g.computeBoundingSphere();
        const may = new THREE.Mesh(g, shared.paint({ color: '#ffffff', map: picture, cutout: true, side: THREE.DoubleSide, vertexColors: true, brush: 0.4, steps: 2, shade: 0.62, extend: holds }));
        may.name = `may sprays x${IDX.length / 6}`; ctx.add(may);
        shared.counts.may = IDX.length / 6;
      }
    }
  }

  // ---------------------------------------------------------------------------------------------- what the others hang things on
  const list6 = (e, a) => { const out = []; for (let i = 0; i < a.length; i += 6) { const p = world(e, a[i], a[i + 1], a[i + 2]), d = _v.set(a[i + 3], a[i + 4], a[i + 5]).transformDirection(e.matrix); out.push({ x: p.x, y: p.y, z: p.z, dx: d.x, dy: d.y, dz: d.z }); } return out; };
  const bumpFns = [];
  shared.sway = SWAY;
  shared.wood = {
    models, trees: entries, options: wood, bark, materials,
    /** Where the blossom's masses belong on each design, as kit_blossom.js reads a crown: { A: { lobes: [{ x, y, z, w, tall, turn, role, az }], height, spread }, ... F, low_A, low_B, far }. */
    crowns: Object.fromEntries(Object.entries(models).filter(([, m]) => m.crown).map(([name, m]) => [name.replace('apple_', ''), m.crown])),
    of: (t) => byTree.get(t),
    /** One tree's own crown (the suggested lobes) and its masses (a few rounded irregular masses of twig ends: [{ x, y, z, rx, ry, rz, n }]), in ITS OWN space: put them in the realm with its matrix (of(t).matrix). */
    crownOf: (t) => models[byTree.get(t).model].crown, massesOf: (t) => models[byTree.get(t).model].masses || [],
    toRealm: (t, p, target) => world(byTree.get(t), p[0], p[1], p[2], target),
    ends: (t) => list6(byTree.get(t), models[byTree.get(t).model].ends),
    spurs: (t) => list6(byTree.get(t), models[byTree.get(t).model].spurs),
    perches: (t) => { const e = byTree.get(t), a = models[e.model].perch, out = []; for (let i = 0; i < a.length; i += 3) out.push(world(e, a[i], a[i + 1], a[i + 2])); return out; },
    /** fn(tree, strength): called when the boat bumps a trunk (the crown shakes; the cast lets petals go). */
    onBump: (fn) => { bumpFns.push(fn); },
  };
  shared.counts = { ...(shared.counts || {}), wood: { designs: Object.keys(groups).length, sail: plan.trees.trees.length, far: plan.trees.far.length, motes: plan.trees.motes.length } };

  // ---------------------------------------------------------------------------------------------- a ring from every trunk a wake reaches
  // "Everything that enters the water has ... a ring of its own when a wake reaches it" (the page's close band). The
  // water's ripples do not know what stands in them, so the wood answers for itself: when a moving hull passes within
  // seven metres of a trunk or a crutch, its wake reaches that trunk a moment later (a wake travels at about a metre
  // and a half a second) and the trunk gives back one soft ring, on the side the wake came from. One ring a passing.
  const standing = [];
  for (const e of entries) if (e.kind === 'sail') standing.push({ x: e.t.x, z: e.t.z, r: 0.26, due: -1, quiet: 0 });
  for (const c of shared.crutchFeet || []) standing.push({ x: c.x, z: c.z, r: c.r || 0.09, due: -1, quiet: 0 });
  const ringOf = (o, now, boat) => {
    const dx = boat.x - o.x, dz = boat.z - o.z, d = Math.hypot(dx, dz);
    if (o.due >= 0) {
      if (now >= o.due) { o.due = -1; o.quiet = now + 7; ctx.water.ripple(o.x + o.ax * (o.r + 0.05), o.z + o.az * (o.r + 0.05), 0.2, 0.3 + o.r); }
    } else if (d < 7 && d > 1.2 && now > o.quiet && boat.speed > 0.5) { o.due = now + (d - 1) / 1.5; o.ax = dx / d; o.az = dz / d; }
  };

  let adopted = false, lastBump = -10;
  const own = { t: -1 };                                         // the wood's own shake, used only while there is no blossom to share one with
  return {
    update(dt) {
      sortGroves();
      // the blossom's stir becomes the wood's, the first frame both exist: one sway, one front, one shake for the two
      if (!adopted && shared.blossom && shared.blossom.uniforms) { adopted = true; for (const m of materials) for (const k of STIR_UNIFORMS) if (shared.blossom.uniforms[k]) m.uniforms[k] = shared.blossom.uniforms[k]; }
      // a bumped trunk shakes its crown
      const boat = ctx.boat;
      if (boat.bumped > 0.04 && ctx.time - lastBump > 2.5) {
        const fx = boat.x - Math.sin(boat.heading) * 1.85, fz = boat.z - Math.cos(boat.heading) * 1.85;
        let hit = null, best = 2.1;
        for (const t of plan.trees.trees) { const d = Math.min(Math.hypot(t.x - boat.x, t.z - boat.z), Math.hypot(t.x - fx, t.z - fz) + 0.6); if (d < best) { best = d; hit = t; } }
        if (hit) {
          lastBump = ctx.time;
          if (shared.blossom && shared.blossom.shake) shared.blossom.shake(hit.x, hit.z, { seconds: 3, amount: 0.04 + 0.05 * boat.bumped });
          else { wood.uniforms.uShakeB.value.set(hit.x, hit.z, 5.5, 0); own.t = 0; own.amount = 0.04 + 0.05 * boat.bumped; }
          for (const fn of bumpFns) { try { fn(hit, boat.bumped); } catch (err) { console.error(err); } }
        }
      }
      if (ctx.water && ctx.water.ripple && !ctx.engine.frozen) for (const o of standing) ringOf(o, ctx.time, boat);
      if (own.t >= 0) { own.t += dt; const u = own.t / 3; wood.uniforms.uShakeB.value.w = u >= 1 ? 0 : own.amount * Math.min(1, u * 8) * (1 - u) * (1 - u); if (u >= 1) own.t = -1; }
    },
  };
}
