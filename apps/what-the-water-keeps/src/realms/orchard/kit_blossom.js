// The orchard in flood: THE BLOSSOM of every tree (stage 2, kit and close band). What was made, how to see it, what
// was measured and what the next people must know: docs/build/orchard/2-kit-blossom.md.
//
// A crown is a mass of flowers. It is built once, here, and worn by every tree at every distance:
//   the CLUMPS   a tree's blossom stands where its wood ends. The twig ends and flowering spurs of every design of
//                tree (shared.wood, kit_trees.js; shared.tree.tips for the oldest tree) are gathered here into a few
//                CLUMPS, each with its own middle, lie and reach: nine to an avenue tree, five to a far one, sixty
//                to the oldest tree's dome. Between clumps there is no blossom: boughs and sky show.
//   the MASS     lobe_01 .. lobe_12 (source-art/models/orchard/lobes.py): one rounded billow to a clump, stretched and
//                turned to it. A lobe is only the mass underneath. Its surface is A MOSAIC OF DABS (the third making):
//                every dab the size of a flower or a small cluster, ONE FLAT TONE, about twelve pixels on the screen
//                at any distance (a dab's own size doubles with every doubling of the distance beyond eight metres),
//                as the key painting lays a crown. Tone borders run dab by dab; the edge that turns from the eye is
//                worn dab by dab; open patches are missing dabs; and as the eye comes near the mass comes apart dab
//                by dab (each shrinks, then goes) until inside eleven metres none is left: under a bough there are
//                only flowers on twigs. (The second making laid a photograph of flowers on it and four tones by
//                noise: a camouflage. The dab texture is made here, in code: dabTexture.)
//   the HEAPS    between the dab and the clump (the fourth making): PADS of blossom a metre or two across (and four,
//                for what is seen from far), each light on its upper side and dark beneath, with shade between pads.
//                One field of the world, read by mass and sprays alike (HEAP_GLSL).
//   the TONE     is ONE for mass and sprays, and it is laid BY THE FORM: by the round of each clump first (a ball's
//                normal), a little by its own heaps, a little by where it looks out of its crown; wrapped, so that a
//                crown seen from the side is mostly in the light: blossom white where it looks up, a pale lilac white
//                on its flanks, lilac below, periwinkle where it looks down or into the crown. Chance moves a dab by
//                less than a step. (The second making's shade was half chance: no clump read as a round thing.)
//   the SPRAYS   cut cards carrying the modelled spray (assets/art/orchard/sprays.webp: sixteen of them, photographed
//                from the flowers modelled in source-art/models/orchard/blossom_spray.py), in their tens of thousands,
//                in ONE draw: a spray continues every tuft of twig ends, a cluster sits on every flowering spur, and
//                more stand out of every mass along its normals. They break every outline, and they are the light
//                dabs on the lilac body. None is ever seen edge-on: it turns about its own twig, or shrinks away.
//   the DISTANCE one rule for all of it: near the eye every spray stands at its own size (a flower is 12 cm, four
//                times life, as the ride's falling petal is); beyond eight metres fewer are drawn and each is drawn
//                larger. From 5 m a flower has five petals; from 50 m the crown is a soft dabbed mass. The water's
//                mirror gets the same crowns with fewer, larger sprays.
//
// shared.blossom (for the cast and the staging): crowns (where petals are shed from: discs for canopyMask), all (every
// lobe), trees, uniforms, sway, shake(), front(), shiver(), gust(), show(). The wood takes its stir from here (kit_trees.js).
// Developer switches:
//   &blossom=a | b       the two ways that were compared (the log): a = the mass, dabbed and ragged, clothed in sprays
//                        along its normals, with sprays on the real twigs as well (as built); b = sprays alone on the
//                        real twigs round a small soft inner mass.   &blossom=none: the wood alone (stand-ins gone too)
//   &sprays=0.5     draws that share of the sprays      &lobes=0     hides the mass      &cards=0     hides the sprays
//   &lod=8,2        metres inside which sprays stand at their own size; the most a far spray grows (beyond, it is its true size)
//   &sizeup=1.8     the most a spray on the oldest tree's dome is enlarged
//   &dab=20         metres inside which a dab of the mass is its own size (beyond, it keeps its size on the screen)
//   &nearwear=11,20 the mass comes wholly apart inside the first, not at all beyond the second (metres from the eye); &nearold=13,38 on the oldest tree
//   &grid=0.4       metres: how fine an avenue tree's twig ends are gathered (one spray to a cell)
//   &tone=0.5,0.42,0.2,0.14    the tone by the form: a base, how much looking up counts, looking out of the crown, chance; &toneo= the oldest tree
//   &heap=1.8,4.5,0.4,0.25     the pads of blossom: the small ones' size (m), the great ones', how far each moves the tone; &heapr=0.7,0.2,0.6 the shade between pads
//   &form=0.85,0.9,0.1         how much of the form is the clump's own round; where the form's tone stops; how far the mass sits below its sprays
//   &lo=aab0cc &deep=6878a2 &hi=fff0dc &hib=e6f0ff   lilac, periwinkle, blossom white in the afterglow and at blue hour
//   &pull=0.8,0.95,9,17        the blossom drawn toward the eye: metres for the mass, for the sprays; from, to (m from the eye)
//   &wear=0.55,1.15 &holes=0.1,2.4 &hollow=0.44,0.7,0.36,0.4 &wall=0.34 &round=0.8,0.76 &chance=0.14   (each is explained where it is read)
//   &thru=0.5       how much of the sky comes through blossom looked up at
//   &clumps=9       clumps to an avenue tree      &dome=60     clumps to the oldest tree's dome
import * as THREE from 'three';
import { removeStandIn } from '../../engine/modules.js';

const Q = new URLSearchParams(location.search);
const DIR = 'models/orchard/';
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const nums = (key, dflt) => { if (!Q.has(key)) return dflt; const v = Q.get(key).split(','); return dflt.map((d, i) => (v[i] !== undefined && v[i] !== '' && Number.isFinite(+v[i]) ? +v[i] : d)); };

// ------------------------------------------------------------------------------------------------ clumps of twig ends
/** The lie of a cloud of points: eigenvalues (largest first) and unit axes of a symmetric 3 x 3 matrix (Jacobi). */
function eig3(m) {
  const a = m.map((r) => r.slice()), v = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let sweep = 0; sweep < 16; sweep++) {
    let off = 0;
    for (const [p, q] of [[0, 1], [0, 2], [1, 2]]) {
      off += a[p][q] * a[p][q];
      if (Math.abs(a[p][q]) < 1e-14) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]), t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      const apq = a[p][q]; a[p][p] -= t * apq; a[q][q] += t * apq; a[p][q] = a[q][p] = 0;
      const r = 3 - p - q, arp = a[r][p], arq = a[r][q];
      a[r][p] = a[p][r] = c * arp - s * arq; a[r][q] = a[q][r] = s * arp + c * arq;
      for (let k = 0; k < 3; k++) { const vp = v[k][p], vq = v[k][q]; v[k][p] = c * vp - s * vq; v[k][q] = s * vp + c * vq; }
    }
    if (off < 1e-18) break;
  }
  return [0, 1, 2].map((k) => ({ val: a[k][k], vec: [v[0][k], v[1][k], v[2][k]] })).sort((x, y) => y.val - x.val);
}

/**
 * Gather points (x, y, z, x, y, z, ...) into at most K clumps (k-means from seeds that are the same every run: the
 * highest point, then each time the point farthest from every seed). Each clump: { c: [x, y, z] its middle, ax: three
 * unit axes (its lie, longest first), r: its three half lengths along them, n: how many points it holds }.
 *   reach, pad   a half length is `reach` standard deviations and `pad` metres more
 *   least, flat  no half length under `least` metres, none under `flat` of the middle one (no pancakes: no shelves);
 *   long         the longest at most `long` times the middle one
 */
export function clumpsOf(P, K, { reach = 1.7, pad = 0.3, least = 0.7, flat = 0.62, long = 2.4, iters = 16, few = 5 } = {}) {
  const n = Math.floor(P.length / 3);
  if (!n) return [];
  K = Math.max(1, Math.min(K, Math.floor(n / few) || 1));
  const cen = [], d2 = new Float64Array(n).fill(1e18);
  let pick = 0; for (let i = 1; i < n; i++) if (P[i * 3 + 1] > P[pick * 3 + 1]) pick = i;
  for (let k = 0; k < K; k++) {
    const c = [P[pick * 3], P[pick * 3 + 1], P[pick * 3 + 2]]; cen.push(c);
    let best = 0, bd = -1;
    for (let i = 0; i < n; i++) {
      const dx = P[i * 3] - c[0], dy = P[i * 3 + 1] - c[1], dz = P[i * 3 + 2] - c[2], d = dx * dx + dy * dy + dz * dz;
      if (d < d2[i]) d2[i] = d;
      if (d2[i] > bd) { bd = d2[i]; best = i; }
    }
    pick = best;
  }
  const lab = new Int32Array(n), sum = cen.map(() => [0, 0, 0, 0]);
  for (let it = 0; it < iters; it++) {
    for (const s of sum) s.fill(0);
    for (let i = 0; i < n; i++) {
      let b = 0, bd = 1e18;
      for (let k = 0; k < K; k++) { const c = cen[k], dx = P[i * 3] - c[0], dy = P[i * 3 + 1] - c[1], dz = P[i * 3 + 2] - c[2], d = dx * dx + dy * dy + dz * dz; if (d < bd) { bd = d; b = k; } }
      lab[i] = b; const s = sum[b]; s[0] += P[i * 3]; s[1] += P[i * 3 + 1]; s[2] += P[i * 3 + 2]; s[3]++;
    }
    for (let k = 0; k < K; k++) if (sum[k][3]) cen[k] = [sum[k][0] / sum[k][3], sum[k][1] / sum[k][3], sum[k][2] / sum[k][3]];
  }
  const out = [];
  for (let k = 0; k < K; k++) {
    const m = sum[k][3]; if (m < Math.min(few, n)) continue;
    const c = cen[k], cov = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (let i = 0; i < n; i++) if (lab[i] === k) {
      const d = [P[i * 3] - c[0], P[i * 3 + 1] - c[1], P[i * 3 + 2] - c[2]];
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) cov[a][b] += d[a] * d[b] / m;
    }
    const e = eig3(cov), r = e.map((q) => reach * Math.sqrt(Math.max(q.val, 0)) + pad);
    r[1] = Math.max(r[1], least); r[0] = clamp(r[0], r[1], long * r[1]); r[2] = Math.max(r[2], flat * r[1], least);
    out.push({ c, ax: e.map((q) => q.vec), r, n: m });
  }
  return out;
}

// Where the wood is not modelled (the module built alone: &only=set,kit_blossom): twig ends by rule, on the goblet of a
// pruned standard, so that there is something to gather. x, y, z, dx, dy, dz in the tree's own space.
function ruleEnds(variant, low, rnd) {
  const ends = [], n = 420, height = 8.4 + (variant % 3) * 0.3, spread = 4.4 + (variant % 4) * 0.15;
  for (let i = 0; i < n; i++) {
    const a = rnd() * TAU, u = Math.sqrt(rnd()), r = spread * (0.35 + 0.65 * u), y = 4.3 + (height - 4.3) * (1 - u * u) * (0.55 + 0.45 * rnd()) + rnd() * 0.8;
    ends.push(Math.cos(a) * r, y, Math.sin(a) * r, Math.cos(a) * 0.6, 0.6, Math.sin(a) * 0.6);
  }
  if (low) for (let i = 0; i < 60; i++) { const x = 1.6 + rnd() * 4, y = (low === 'A' ? 3.9 : 3.6) + rnd() * 0.7; ends.push(x, y, (rnd() - 0.5) * 1.2, 0.3, 0.8, (rnd() - 0.5)); }
  return ends;
}

// ------------------------------------------------------------------------------------------------ the shader's own words
// One slow stir for wood, mass and sprays alike, worked out from where a point IS (the gouache's own `sway`, to the
// number), with what the staging can add to it: a front of evening air, a bumped trunk, the shiver of a roost. Nothing
// below 3 m moves. kit_trees.js carries this same text for the wood and takes these uniforms: change both or neither.
const STIR_GLSL = /* glsl */`
  uniform vec4 uBlow;              // the way it leans (x, z), metres at the tips, radians a second
  uniform vec4 uBlowMore;          // from (m), to (m), gust (1 = none), -
  uniform vec4 uFrontB;            // a front of air crossing the orchard: its line's z, its depth (m), how much more it stirs, -
  uniform vec4 uShakeB;            // a bumped trunk: x, z, reach (m), metres now
  uniform vec4 uShiverB;           // the roost: the oldest tree's x, z; the height the shiver has come down to; metres
  uniform vec4 uBlowOld, uBlowOldH; // the oldest tree's own wood (heroes.js sways it by other numbers: shared.tree.sway): as uBlow; from (m), to (m)
  varying vec3 vRest;
  vec3 stirOf(vec3 p, float old) {  // old: 1 for what grows on the oldest tree
    vec4 blow = mix(uBlow, uBlowOld, old); vec2 span = mix(uBlowMore.xy, uBlowOldH.xy, old);
    float t = uTime * blow.w;
    float sw = sin(t + p.x * 0.21 + p.z * 0.17) * 0.6 + sin(t * 0.43 + p.z * 0.11 + 1.7) * 0.4;
    float more = mix(uBlowMore.z * (1.0 + uFrontB.z * exp(-pow((p.z - uFrontB.x) / max(uFrontB.y, 0.1), 2.0))), 1.0, old);
    vec3 d = vec3(blow.x, 0.0, blow.y) * (blow.z * sw * more * smoothstep(span.x, span.y, p.y));
    vec2 q = p.xz - uShakeB.xy; float near = 1.0 - smoothstep(uShakeB.z * 0.5, uShakeB.z, length(q));
    d += vec3(sin(uTime * 15.7 + p.y * 2.1 + p.x), 0.35 * sin(uTime * 19.0 + p.z * 1.7), cos(uTime * 13.9 + p.y * 1.3 + p.z)) * (uShakeB.w * near * smoothstep(2.6, 6.0, p.y));
    vec2 g = p.xz - uShiverB.xy; float band = exp(-pow((p.y - uShiverB.z) / 3.2, 2.0)) * (1.0 - smoothstep(26.0, 34.0, length(g)));
    d += vec3(sin(uTime * 15.7 + p.x * 0.9 + p.y), -0.5 * abs(sin(uTime * 15.7 + p.z * 0.7)), cos(uTime * 15.7 + p.z * 0.9)) * (uShiverB.w * band);
    return d;
  }`;

// The light that is the blossom's own (fragment, after the ride's): it holds what light is left; thin petals between the
// eye and the band take the afterglow through themselves, most along the edge of a mass; and the last light of the sky
// lies on what stands high (the oldest tree's upper lobes are warm while the avenue is already in shade).
const LIGHT_PARS = /* glsl */`
  uniform vec3 uSelf, uBackB, uTopColB, uSkyThruB; uniform vec4 uBl, uTopB; uniform float uLampB; varying vec3 vRest;`;
const LIGHT_GLSL = /* glsl */`
  { vec3 Vb = normalize(uCameraPos - vWPos);
    glow += uSelf * (0.55 + 0.45 * ownColour) * (0.3 + 0.7 * smoothstep(-0.7, 0.35, N.y)) * uBl.x;
    float thru = pow(max(dot(Vb, uKeyDir), 0.0), 2.5), rimB = pow(1.0 - abs(dot(N, Vb)), 1.5);
    c += albedo * uBackB * (thru * (0.08 + 0.92 * rimB) * uBl.y);
    float high = smoothstep(uTopB.x, uTopB.y, vWPos.y) * smoothstep(-0.35, 0.55, N.y);
    c += albedo * uTopColB * (high * uTopB.z);
    // (a lamp's light on blossom: shell pink, the page says, where the bow lantern comes within its seven metres. All of
    // it on petals as pale as these was salmon. Blossom takes about half; the hour's own hold, after this, knows nothing of it)
    c -= ownColour * (pointLight(uLanternPos, uLanternColor, uLanternRadius, N) + pointLight(uLampPos, uLampColor, uLampRadius, N)) * uLampB; }`;
const NOISE_B = /* glsl */`
  float hashB(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noiseB(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hashB(i), hashB(i + vec2(1.0, 0.0)), f.x), mix(hashB(i + vec2(0.0, 1.0)), hashB(i + vec2(1.0, 1.0)), f.x), f.y); }`;
// BETWEEN THE DAB AND THE CLUMP there are HEAPS of blossom, a metre across (and, for what is seen from far, three):
// each light on its upper side and dark in the crease beneath it. One field of the world, read by the mass (in its
// fragments) and by every spray (where it is planted), so that both show the same heaps. Without them a clump is a
// smooth cloud. It stands still in the world: only how much each size counts changes with the distance.
// (The fourth making: a heap is a PAD about its own middle, one of a scatter of middles, and a point of blossom belongs
// to the nearest. It is light on its pad's upper side and dark beneath it, so where one pad stands over another the
// lit top of the lower meets the shade under the upper along a crisp, lumpy line: the key painting's crowns are laid
// exactly so. The third making's heaps were the up-and-down slope of a noise: level streaks, snow lying on a rock.)
const HEAP_GLSL = /* glsl */`
  uniform vec4 uHeapB;             // the small heaps' size (m), the great heaps' size (m), how far the small ones move the tone, how far the great ones
  uniform vec4 uHeapRB;            // between pads: how far down the tones; from, to (the square of the way out from a pad's middle, in pads)
  vec3 hash33B(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  float heapOneB(vec3 q) {         // + on the upper side of the pad a point belongs to, - beneath it
    q.y *= 1.3;                    // (a pad is wider than it is tall)
    vec3 i = floor(q - 0.5), f = q - i; float best = 1e9, tone = 0.0;
    for (int n = 0; n < 8; n++) {
      vec3 o = vec3(float(n & 1), float((n >> 1) & 1), float((n >> 2) & 1)), h = hash33B(i + o);
      vec3 d = f - (o + 0.5 + (h - 0.5) * 0.64);
      float dd = dot(d, d) * (0.75 + 0.6 * h.y);                                                  // (no two pads one size)
      // (each a little out of true, and a little lighter or darker as a whole; and beyond its pad's own ROUND a point lies
      // between pads, in their shade: so what is lit is a bun, level beneath and round above, never a level band)
      if (dd < best) { best = dd; tone = (d.y + 0.3 * (h.x - 0.5) * d.x + 0.3 * (h.z - 0.5) * d.z) * 2.4 + 0.5 * (h.y - 0.4) - uHeapRB.x * smoothstep(uHeapRB.y, uHeapRB.z, dd); }
    }
    return clamp(tone, -1.0, 1.0);
  }
  float heapB(vec3 p, float far) {
    float small = 1.0 - smoothstep(22.0, 55.0, far), great = smoothstep(14.0, 45.0, far), t = 0.0;
    if (small * uHeapB.z > 0.002) t += uHeapB.z * small * heapOneB(p / uHeapB.x);
    if (great * uHeapB.w > 0.002) t += uHeapB.w * great * heapOneB(p / uHeapB.y + 7.7);
    return t;
  }`;
// The ramp of blossom, for mass and sprays alike: periwinkle (0) .. lilac (0.5) .. blossom white (1)
const RAMP_GLSL = /* glsl */`
  uniform vec3 uShadeLoB, uShadeHiB, uDeepB;
  vec3 rampB(float t) { return t < 0.5 ? mix(uDeepB, uShadeLoB, t * 2.0) : mix(uShadeLoB, uShadeHiB, t * 2.0 - 1.0); }
  // laid in flat tones with crisp borders, as a brush lays them (five tones; each border a quarter of a tone wide)
  float stepsB(float t) { t = clamp(t, 0.0, 1.0) * 4.0; return (floor(t) + smoothstep(0.38, 0.62, fract(t))) * 0.25; }`;

/**
 * The DABS: a picture that repeats, G x G dabs of C texels each way. A dab is a ROSETTE about a scattered point (five
 * shallow petals, no two turned alike, no two one size), so that where dabs meet their border is scalloped and where
 * three or four fail to meet there is a GAP: the shade between clusters of flowers. Each texel: R its dab's own chance
 * (its tone, give or take); G how far inside its dab it lies (1 deep inside, 0.5 at the rosette's own edge, 0 well
 * outside every rosette: a gap); B a second chance (the few that are bud); A the dab's place in the order of going
 * (those with the least go first: at a worn edge, in an open patch, as the eye comes near).
 */
function dabTexture(rnd, G = 16, C = 24) {
  const n = G * C, data = new Uint8Array(n * n * 4), N = G * G;
  const px = new Float32Array(N), py = new Float32Array(N), r1 = new Float32Array(N), r2 = new Float32Array(N), r3 = new Float32Array(N), rad = new Float32Array(N), phi = new Float32Array(N), lob = new Float32Array(N);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const k = j * G + i;
    px[k] = (i + 0.12 + 0.76 * rnd()) * C; py[k] = (j + 0.12 + 0.76 * rnd()) * C; r1[k] = rnd(); r2[k] = rnd(); r3[k] = rnd();
    rad[k] = (0.43 + 0.22 * rnd()) * C; phi[k] = rnd() * TAU; lob[k] = 0.14 + 0.12 * rnd();
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const ci = Math.floor(x / C), cj = Math.floor(y / C);
    let d1 = 1e9, best = 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const i = (ci + di + G) % G, j = (cj + dj + G) % G, k = j * G + i;
      const ex = x + 0.5 - (px[k] + (ci + di - i) * C), ey = y + 0.5 - (py[k] + (cj + dj - j) * C);      // (the picture repeats: a neighbour across its edge)
      const d = Math.hypot(ex, ey) / (rad[k] * (1 + lob[k] * Math.cos(5 * Math.atan2(ey, ex) + phi[k])));
      if (d < d1) { d1 = d; best = k; }
    }
    const o = (y * n + x) * 4;
    data[o] = Math.round(r1[best] * 255);
    data[o + 1] = Math.round(255 * clamp(1.5 - d1, 0, 1));
    data[o + 2] = Math.round(r3[best] * 255);
    data[o + 3] = Math.round(r2[best] * 255);
  }
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

/**
 * The DABS of the third way (the fifth making): the same four channels, but a dab LIES OVER its neighbours (each has
 * a place in an order, and a texel belongs to the uppermost dab that covers it), so the border between two dabs is
 * the upper one's own outline: a scalloped arc of a five-lobed rosette, as a brush lays one cluster of flowers over
 * the last. (The dabs above are the cells of a net: each texel the nearest dab's, their borders nearly straight. With
 * every dab one flat tone, a mass seen from twenty metres was a sheet of crumpled paper.) No two one size: some are a
 * single flower, some a cluster three times as wide.
 */
function dabTextureC(rnd, G = 16, C = 24) {
  const n = G * C, data = new Uint8Array(n * n * 4), mid = new Uint8Array(n * n * 4), N = G * G;
  const px = new Float32Array(N), py = new Float32Array(N), r1 = new Float32Array(N), r2 = new Float32Array(N), r3 = new Float32Array(N), rad = new Float32Array(N), phi = new Float32Array(N), lob = new Float32Array(N), pri = new Float32Array(N);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const k = j * G + i, big = rnd();
    px[k] = (i + 0.1 + 0.8 * rnd()) * C; py[k] = (j + 0.1 + 0.8 * rnd()) * C; r1[k] = rnd(); r2[k] = rnd(); r3[k] = rnd();
    rad[k] = (big < 0.2 ? 0.95 + 0.4 * rnd() : 0.52 + 0.3 * rnd()) * C; phi[k] = rnd() * TAU; lob[k] = 0.16 + 0.14 * rnd(); pri[k] = rnd() + (big < 0.2 ? -0.35 : 0);      // (the wide ones lie mostly underneath)
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const ci = Math.floor(x / C), cj = Math.floor(y / C);
    let top = -1, tp = -1e9, td = 0, d1 = 1e9, near = 0, tx = 0, ty = 0, nx = 0, ny = 0;
    for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
      const i = (ci + di + G) % G, j = (cj + dj + G) % G, k = j * G + i;
      const ex = x + 0.5 - (px[k] + (ci + di - i) * C), ey = y + 0.5 - (py[k] + (cj + dj - j) * C);
      const d = Math.hypot(ex, ey) / (rad[k] * (1 + lob[k] * Math.cos(5 * Math.atan2(ey, ex) + phi[k])));
      if (d < d1) { d1 = d; near = k; nx = ex; ny = ey; }
      if (d < 1 && pri[k] > tp) { tp = pri[k]; top = k; td = d; tx = ex; ty = ey; }
    }
    const k = top >= 0 ? top : near, d = top >= 0 ? td : d1, o = (y * n + x) * 4;
    // (the second picture: the way from this texel to the middle of ITS dab, in dabs (0.5 +/- 2 dabs), and the dab's chance:
    // read unsmoothed, so that a whole dab can be given the tone the form has at its middle: one flat tone to a dab)
    mid[o] = Math.round(255 * clamp(0.5 - (top >= 0 ? tx : nx) / C / 4, 0, 1)); mid[o + 1] = Math.round(255 * clamp(0.5 - (top >= 0 ? ty : ny) / C / 4, 0, 1));
    mid[o + 2] = Math.round(r1[k] * 255); mid[o + 3] = 255;
    data[o] = Math.round(r1[k] * 255);
    data[o + 1] = Math.round(255 * clamp(1.5 - d, 0, 1));      // (0.5 at a dab's own edge; less: nothing covers it: a gap)
    data[o + 2] = Math.round(r3[k] * 255);
    data[o + 3] = Math.round(r2[k] * 255);
  }
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  const m = new THREE.DataTexture(mid, n, n, THREE.RGBAFormat);
  m.wrapS = m.wrapT = THREE.RepeatWrapping; m.minFilter = m.magFilter = THREE.NearestFilter; m.generateMipmaps = false; m.needsUpdate = true;
  t.userData = { middles: m, G };
  return t;
}

/**
 * The PUFFS: the heaps a mass of blossom is made of, a metre or so across, as a painter lays them: each a rounded
 * shape wider than tall with a lobed outline, LIGHT AT ITS TOP AND DARK AT ITS FOOT, and each lying over the one
 * above it, so that the lit top of a lower puff meets the shaded foot of the one behind along a crisp scalloped
 * arc. This is how the key painting draws every crown, and it is drawn here on the mass's own surface (on what
 * stands upright of it). G x G puffs, C texels each way, repeating. R: how high in its puff a texel lies (0 its
 * foot .. 1 its top); G: how far inside its puff (0 at its edge .. 1); B: the puff's own chance.
 * (The fourth making's pads were the cells of a net in space, lit top and bottom: their borders were planes, and a
 * mass was faceted rock. The third's were the slope of a noise: level streaks.)
 */
function puffTexture(rnd, G = 8, C = 32) {
  const n = G * C, data = new Uint8Array(n * n * 4), N = G * G;
  const px = new Float32Array(N), py = new Float32Array(N), rx = new Float32Array(N), ry = new Float32Array(N), phi = new Float32Array(N), lob = new Float32Array(N), ch = new Float32Array(N);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    const k = j * G + i, s = 0.62 + 0.5 * rnd();
    px[k] = (i + 0.08 + 0.84 * rnd()) * C; py[k] = (j + 0.08 + 0.84 * rnd()) * C;
    rx[k] = s * (0.95 + 0.3 * rnd()) * C; ry[k] = s * (0.68 + 0.22 * rnd()) * C; phi[k] = rnd() * TAU; lob[k] = 0.1 + 0.1 * rnd(); ch[k] = rnd();
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const ci = Math.floor(x / C), cj = Math.floor(y / C);
    let top = -1, lowest = 1e9, th = 0, td = 0, d1 = 1e9, near = 0, nh = 0;
    for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
      const i = (ci + di + G) % G, j = (cj + dj + G) % G, k = j * G + i;
      const ex = (x + 0.5 - (px[k] + (ci + di - i) * C)) / rx[k], ey = (y + 0.5 - (py[k] + (cj + dj - j) * C)) / ry[k];
      const d = Math.hypot(ex, ey) / (1 + lob[k] * Math.cos(6 * Math.atan2(ey, ex) + phi[k]));
      const cy = py[k] + (cj + dj - j) * C;                      // (v runs upward on the mass: the lowest puff that covers a texel lies over the rest)
      if (d < d1) { d1 = d; near = k; nh = ey; }
      if (d < 1 && cy < lowest) { lowest = cy; top = k; th = ey; td = d; }
    }
    const k = top >= 0 ? top : near, h = top >= 0 ? th : nh, d = top >= 0 ? td : Math.min(d1, 1.6), o = (y * n + x) * 4;
    data[o] = Math.round(255 * clamp(0.5 + 0.5 * h, 0, 1));
    data[o + 1] = Math.round(255 * clamp(1 - d, 0, 1));
    data[o + 2] = Math.round(ch[k] * 255);
    data[o + 3] = 255;
  }
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}

export async function build(ctx, plan, shared) {
  const { kit, engine } = ctx, F = shared.frame;
  const WAY = Q.get('blossom') === 'b' ? 'b' : Q.get('blossom') === 'a' ? 'a' : 'c';
  const WC = WAY === 'c';                                         // the third way (the fifth making): the mass forward as heaps, the cards only breaking its outline from where it stands
  const NONE = Q.get('blossom') === 'none';                      // (developer: the orchard bare, with the stand-ins gone too: the wood alone, as the orchard in snow shows it)
  const SHARE = Q.has('sprays') ? clamp(+Q.get('sprays'), 0, 4) : 1;
  // (8 m: a flower keeps to about twelve pixels from ten metres to forty, the size of the key painting's dabs. The first
  // making kept sprays their own size to 15 m: at 25 m a crown was a fizz of six-pixel flowers that the painter's
  // filter chewed into scraps)
  // (the fourth making: a far spray grows to TWICE its size and no more, where it grew to four times: a flower twelve
  // pixels across on a tree eighty metres off said that the tree was small. The key painting's flowers shrink with
  // distance as true ones do; so do these beyond twenty metres, and the oldest tree stands as large as it is)
  const lodQ = nums('lod', WC ? [8, 1.35] : [8, 2]);
  const LOD = { near: lodQ[0] > 0 ? lodQ[0] : 8, grow: lodQ[1] > 0 ? lodQ[1] : 2, mirror: 0.6 };
  // THE TONE of a point of blossom, 0 periwinkle .. 0.5 lilac .. 1 blossom white, by its form: a base; how much its
  // looking UP counts (the clump's round, wrapped: a flank is still in the light); how much its looking OUT of its
  // crown; and how far chance moves a dab (under a step and a half of the five)
  // (the fourth making: looking UP counts for more than looking out, and chance for half of what it did: with the heaps
  // now PADS, each lit on its own upper side, a crown is white above and lilac beneath pad by pad and no lobe is a
  // shelf; and a dab's chance at 0.24 was still a camouflage at middle distance)
  // (the sixth making, way c: a cap is seen from the boat by its FLANK, and the key painting's heap is white on the
  // upper half of its flank, lilac on the lower, deeper under its lip: measured there, half of a crown is shade (its
  // median is lilac, 0.54; its lights 0.74). So looking up counts for most, and the base sits at lilac)
  const TONE = nums('tone', WC ? [0.52, 0.7, 0.12, 0.2] : [0.5, 0.42, 0.2, 0.14]);
  const TONEO = nums('toneo', WC ? [0.52, 0.66, 0.15, 0.16] : [0.5, 0.45, 0.3, 0.12]);          // the same for the oldest tree
  const FORM = nums('form', WC ? [0.75, 1.0, 0.12] : [0.85, 0.9, 0.1]);                   // how much of the form is the clump's own round (a ball's) and not its heaps'; where the form's tone stops (short of white: the dabs speckle it); how far the mass sits below its sprays
  const HEAP = nums('heap', WC ? [1.8, 4.5, 0, 0] : [1.8, 4.5, 0.4, 0.25]);
  const HEAPR = nums('heapr', [0.7, 0.2, 0.6]);                // between pads: how far down the tones a point there is; from, to (the square of its way out from the pad's middle, in pads)              // the heaps between the dab and the clump: the small ones' size (m: within about forty metres), the great ones' (m: beyond about twenty), how far a small heap moves the tone, a great one
  // (a clump is a ROUND thing: its least half width no less than this share of its middle one, on an avenue tree and on
  // the oldest. Flatter, and with its top in the light and its foot in shade, a clump is a shelf: the director's word)
  const ROUNDQ = nums('round', [0.8, 0.76]);
  const PULL = nums('pull', [0.8, 0.95, 9, 17]);                 // the blossom drawn toward the eye: metres for the mass, for the sprays; from, to (m from the eye)
  const WALL = nums('wall', [0.34]);                             // how far down the tones a spray on the FAR side of its clump is (seen through the crown, from behind: it stands in the crown's own shade)
  const HOLLOW = nums('hollow', WC ? [0.44, 0.7, 0.2, 0.4] : [0.44, 0.7, 0.36, 0.4]);         // the gaps between dabs: how far inside a rosette's own edge (0.5) they reach in the light, in the shade (more is wider); how far down the tones a hollow is; how pink in the light
  const WEARQ = nums('wear', WC ? [0.75, 1.15] : [0.55, 1.15]);                      // how far in from the edge that turns from the eye a mass is worn (dab by dab); how hard
  const TUFT = nums('tuft', [3.7, 0.6]);                         // the near mass comes apart in handfuls: how many to a tile of dabs (2.4 m), how far a dab goes with its handful (0: each by its own chance)
  const HOLEQ = nums('holes', WC ? [0.03, 2.4] : [0.1, 2.4]);                       // the share of dabs that are missing (one looks through); times as many in a clump's far wall
  const MASSQ = nums('mass', WC ? [0.85] : [1]);                  // how large a mass stands in its clump of twig ends (under 1: gaps between heaps, where boughs and sky show; the twigs left outside carry their own sprays)
  const PUFFQ = nums('puff', [9.6, 0, 0.08, 0.1]);             // way c: the puffs of a mass: metres to a repeat of their picture (eight puffs: 1.2 m each); how far a puff moves the tone between its foot and its top; its own chance; the crease at its edge
  const TWIGQ = nums('twig', WC ? [5, 9] : [1e5, 2e5]);            // way c: metres from the eye between which a card's own twig is cut out of it
  const LAMPQ = nums('lampb', WC ? [0.6] : [0]);                  // way c: the share of a lamp's light blossom does not take (amber at full strength on pale petals is a candy pink)
  const RIMQ = nums('rim', [10, 17, 0.52, 0.55]);
  // (the sixth making: A HEAP IS A CAP over its own boughs, open beneath. In the key painting every heap of blossom is
  // cream on top, and under its lip one looks into a violet hollow where dark boughs fork up into it: that is what says
  // "tree" and not "cloud". A closed lobe swallowed its wood: no bough showed above a tree's first fork.)
  const CAPQ = nums('cap', WC ? [-0.12, 0.5, 1.15, 0.45] : [9, 10, 0, 0]);      // way c: a mass is OPEN where it looks down (and a little toward the low middle of its crown): from, to (the cosine to that way), how hard, how much "toward the middle" counts                 // way c: from .x m to .y m from the eye the cards withdraw to their mass's outline (where it turns from the eye by more than .z) and to one in 1/.w on its face
  const MOSQ = nums('mosaic', WC ? [1, 0.1, 0.5] : [0, 0, 1]);      // way c: every dab of a mass ONE flat tone, the form's at its own middle (1; 0: the form runs through the dabs); how much darker four dabs in ten are than their neighbours (0.1: seven per cent); a dab's size on the oldest tree (of an avenue tree's)
  const INNERQ = nums('inner', WC ? [1] : [0]);                    // way c: the share of the sprays UNDER a cap (on twigs in its hollow and beneath it) that go between rim.x and rim.y metres from the eye: there the boughs are what is seen
  const DABQ = nums('dab', WC ? [14] : [20]), NEARQ = nums('nearwear', WC ? [9, 15] : [11, 20]), NEAROQ = nums('nearold', [13, 38]), HIK = Q.has('hik') ? +Q.get('hik') : 1.12, THRU = nums('thru', [0.5]);
  const HI_A = new THREE.Color(Q.get('hi') ? '#' + Q.get('hi') : WC ? '#ffeed2' : '#fff0dc').multiplyScalar(Q.has('hik') ? HIK : WC ? 1.2 : 1.18), HI_B = new THREE.Color(Q.get('hib') ? '#' + Q.get('hib') : '#e6f0ff').multiplyScalar(1.12);
  const K_TREE = Q.has('clumps') ? clamp(+Q.get('clumps') | 0, 3, 24) : WC ? 14 : 9, K_DOME = Q.has('dome') ? clamp(+Q.get('dome') | 0, 12, 140) : 60;
  const rnd = ctx.rng(2026);
  const col = (c) => new THREE.Color(c);
  const WOOD = shared.wood && shared.wood.models && shared.wood.of ? shared.wood : null;      // the modelled wood, when it is there to plant on
  const density = engine.quality.density;

  // ============================================================================================== the two pictures
  // (the second making's tile of photographed flowers, assets/art/orchard/blossom.webp, is no longer loaded: at the
  // sizes a mass is seen at, the painter's filter left nothing of it. The dabs are made here.)
  const dabs = WC ? dabTextureC(ctx.rng(515)) : dabTexture(ctx.rng(515)), puffs = puffTexture(ctx.rng(616));
  const SPRAYART = /^[\w-]+$/.test(Q.get('sprayart') || '') ? Q.get('sprayart') : 'sprays';      // (developer: &sprayart=<name> loads assets/art/orchard/<name>.webp and .json in place of the cards: pack_blossom.py --name)
  const [atlas, cut, sizes] = await Promise.all([
    ctx.tex(`art/orchard/${SPRAYART}.webp`),
    fetch(`assets/art/orchard/${SPRAYART}.json`).then((r) => { if (!r.ok) throw new Error('sprays.json: ' + r.status); return r.json(); }),
    fetch('assets/' + DIR + 'lobes.json').then((r) => { if (!r.ok) throw new Error('lobes.json: ' + r.status); return r.json(); }),
  ]);
  const CELL = cut.cell;                                         // metres to a cell of the cards' picture, at a spray's own size
  const SIZE = Array.from({ length: 12 }, (_, i) => sizes[`lobe_${String(i + 1).padStart(2, '0')}`].size);      // [x, y, z] of each unit shape, about its own middle
  const AXES = SIZE.map((s) => [0, 1, 2].sort((a, b) => s[b] - s[a]));                                          // each shape's own axes, longest first

  // ============================================================================================== what moves it, what lights it
  const sway = shared.sway || { strength: 0.18, speed: 0.57, from: 3, to: 9.5, dir: [1, 0.3] };
  const Tr = shared.tree || {}, old = Tr.sway || sway;           // (the oldest tree: its wood's own sway)
  const U = {
    uBlow: { value: new THREE.Vector4(sway.dir[0], sway.dir[1], sway.strength, sway.speed) },      // 18 cm at the tips, a period of 11 s (and 26 s): the page's sway
    uBlowMore: { value: new THREE.Vector4(sway.from, sway.to, 1, 0) },
    uFrontB: { value: new THREE.Vector4(1e6, 12, 0, 0) },
    uShakeB: { value: new THREE.Vector4(0, 0, 5, 0) },
    uShiverB: { value: new THREE.Vector4(0, 0, 40, 0) },
    uBlowOld: { value: new THREE.Vector4(old.dir[0], old.dir[1], old.strength, old.speed) }, uBlowOldH: { value: new THREE.Vector4(old.from, old.to, 0, 0) },
    uSelf: shared.blossomSelf || { value: col(plan.chip.white).multiplyScalar(0.08) },
    uBl: { value: new THREE.Vector4(1, 0.22, THRU[0], 0) },      // how much it holds the light; how much of the band comes through it; how much of the sky, looked up at
    uSkyThruB: { value: col('#e9eefc') },
    uBackB: { value: col(plan.chip.apricot) },
    // (the last light of the sky on what stands high is the LIGHT'S to give, and it gives it: shared.dusk, set.js, above its
    // line of height. This is only a handle for the staging, at nothing: with both, the dome burnt out and bloomed)
    uTopB: { value: new THREE.Vector4(13, 27, Q.has('toplight') ? +Q.get('toplight') : 0, 0) },      // from this height to this, more light lies on it; how much
    uTopColB: { value: col('#ffd9b4') },
    tDabB: { value: dabs }, tPuffB: { value: puffs }, tMidB: { value: (dabs.userData && dabs.userData.middles) || dabs },
    uPuffB: { value: new THREE.Vector4(1 / PUFFQ[0], WC ? PUFFQ[1] : 0, PUFFQ[2], PUFFQ[3]) },      // 1 / metres to a repeat of the puffs (eight across); how far a puff moves the tone from its foot to its top; how far its own chance; how dark the crease at its edge
    uTileB: { value: new THREE.Vector4(1 / 2.4, WEARQ[0], WEARQ[1], 0) },      // 1 / metres to a repeat of the dabs at their own size (sixteen dabs across: 15 cm each); how far in from its edge a mass is worn; how hard
    uDabB: { value: new THREE.Vector4(DABQ[0], NEARQ[0], NEARQ[1], 0) },      // metres inside which a dab is its own size (beyond, it keeps its size on the SCREEN); the mass comes apart from .z m in to .y m
    uHoleB: { value: new THREE.Vector4(HOLEQ[0], HOLEQ[1], TUFT[0], TUFT[1]) },      // .zw: as the near mass comes apart, the size of the handfuls that go together (1 / tiles), and how far a dab goes with its handful
    uNearOldB: { value: new THREE.Vector4(NEAROQ[0], NEAROQ[1], 0, 0) },
    uToneB: { value: new THREE.Vector4(TONE[0], TONE[1], TONE[2], TONE[3]) }, uToneOldB: { value: new THREE.Vector4(TONEO[0], TONEO[1], TONEO[2], TONEO[3]) },
    uFormB: { value: new THREE.Vector4(FORM[0], FORM[1], FORM[2], WC ? (Q.has('wave') ? +Q.get('wave') : 0.3) : 0) },      // .w: how far a slow unevenness moves the form's tone (way c)
    uHollowB: { value: new THREE.Vector4(HOLLOW[0], HOLLOW[1], HOLLOW[2], HOLLOW[3]) },
    uHeapB: { value: new THREE.Vector4(HEAP[0], HEAP[1], HEAP[2], HEAP[3]) }, uHeapRB: { value: new THREE.Vector4(HEAPR[0], HEAPR[1], HEAPR[2], 0) },
    uCells: { value: cut.cards.map((c) => new THREE.Vector4(c.uv[0], c.uv[1], c.uv[2], c.uv[3])) },
    uCellGeo: { value: cut.cards.map((c) => new THREE.Vector4(c.size[0], c.size[1], c.anchor[0], c.anchor[1])) },
    uLodB: { value: new THREE.Vector4(LOD.near, LOD.grow, CELL, WAY === 'b' ? 2.0 : 2.5) },      // metres inside which a spray stands at its own size; the most it grows; a cell; how fast they thin (the power of the growth)
    uPassB: { value: new THREE.Vector4(1, 1, 0, 0) },            // 1 where the picture is drawn with many samples (its edges are cut by cover); 1 in the direct view
    uStirB: { value: new THREE.Vector4(0.011, 0.02, 1, 0) },     // a spray's tremble (radians), its slow nod (radians), how much of both
    // the ramp (RAMP_GLSL): tone 0, periwinkle (what looks down or into the crown, the hollows, the far wall); tone 0.5,
    // lilac (blossom in shade); tone 1, blossom white (what looks up at the sky), a little above white
    // (the fourth making: blossom white is a WARM white in the afterglow, the page's chip seen in that light, and the key
    // painting's: its lights measured #cab9be, pinkish cream, where the ride's were #c0baca, violet; and a COOL white at blue
    // hour, when nothing warm is left in the sky: with one white for both, the blue hour's crowns were pink. HI_A to HI_B
    // by the hour, in update)
    uDeepB: { value: col(Q.get('deep') ? '#' + Q.get('deep') : WC ? '#6d708a' : '#6878a2') }, uShadeLoB: { value: col(Q.get('lo') ? '#' + Q.get('lo') : WC ? '#acaec4' : '#aab0cc') }, uShadeHiB: { value: HI_A.clone() },
    uCoolB: { value: new THREE.Color(1, 1, 1) },                 // what the sprays' own picture (a pinkish white) is multiplied by: nothing in the afterglow, a little toward blue at blue hour
    uPinkB: { value: col('#f3bcc6') },
    uHeartB: { value: WC ? new THREE.Color(0.89, 0.71, 0.74) : new THREE.Color(0.85, 0.58, 0.62) },      // a flower's heart near the eye (the page's blossom pink, a breath of it: eighty pixels of flower with a rose heart was candy)
    uMassB: { value: col(Q.get('masstint') ? '#' + Q.get('masstint') : WC ? '#f6eeec' : '#ffffff') },      // the mass takes the petals' own white (the cards' picture is a pinkish white: beside it a pure white mass was snow)
    // THE BLOSSOM IS DRAWN A LITTLE TOWARD THE EYE (along each point's own line of sight: nothing moves in the picture,
    // only what hides what): the wood's thin twigs, kept sharp at their true thickness, lay ACROSS the pale masses as
    // short black scratches wherever a twig stood out of its mass with its own spray not drawn at that distance. A twig
    // lying on blossom is IN it. .x metres for the mass, .y for the sprays (they stand on the mass); from .z m to .w m
    // from the eye (near the eye nothing is drawn forward: there every twig carries its own spray)
    uPullB: { value: new THREE.Vector4(PULL[0], PULL[1], PULL[2], PULL[3]) },
    uCardB: { value: new THREE.Vector4(WC ? 0.12 : 0.3, WC ? 16 : 8, WC ? 30 : 16, WALL[0]) },
    uLampB: { value: LAMPQ[0] },
    uCapB: { value: new THREE.Vector4(CAPQ[0], CAPQ[1], CAPQ[2], CAPQ[3]) },
    uHighB: { value: new THREE.Vector4(1e4, 1e4 + 1, 0, 0) }, uHighColB: { value: new THREE.Color(1, 1, 1) },      // the light's line of last light (from, to: metres), and what shade above it is multiplied by to keep its hue (update)
    uVaultC: { value: new THREE.Vector4(...nums('shell', WC ? [0.82, 0.6, 1, 29] : [0.8, 0, 0, 29])) },      // the vault, seen from under the oldest tree: the tone its tones draw toward; how far; how far its lights keep the shade's hue; the crown's reach (m): inside it the eye is under the shell (&shell=0.82,0.6,1,29)
    uOldAtB: { value: new THREE.Vector2(0, 0) },                 // the oldest tree's bole (x, z): set below
    uVaultB: { value: Q.has('vault') ? +Q.get('vault') : WC ? 0.22 : 0 },      // how much more of the sky comes through the oldest tree's shell, looked up at from under it (the page's "pale shell")
    uBellyB: { value: col(Q.get('belly') ? '#' + Q.get('belly') : WC ? '#d0cce6' : '#ffffff') },      // what the inside of a cap is multiplied by
    uMosB: { value: new THREE.Vector4(MOSQ[0], MOSQ[1], MOSQ[2], WC ? 0.05 : 0.12) },      // .w: half the width of the border between two tones (of a tone)
    uTwigB: { value: new THREE.Vector4(TWIGQ[0], TWIGQ[1], 0, 0) },
    uWayB: { value: new THREE.Vector4(RIMQ[0], RIMQ[1], RIMQ[2], WC ? 1 : 0) }, uWayC: { value: new THREE.Vector4(RIMQ[3], WC ? 26 : 14, WC ? 52 : 30, INNERQ[0]) },   // the sprays far off: how far chance moves a dab of a card's own tone; from, to (m): where a card's tone begins to be laid in dabs and steps; how far down the tones the far wall is
  };
  if (ctx.reducedMotion) { U.uStirB.value.z = 0.35; U.uBlow.value.z = Math.min(U.uBlow.value.z, 0.1); }

  // ---- the mass
  const lobeExt = {
    uniforms: U,
    vertexPars: `${STIR_GLSL} uniform vec4 uPullB; attribute float aOld; attribute vec4 aCrown; varying vec4 vCrownB; varying vec3 vBallB; varying float vOldF;`,
    vertexLocal: /* glsl */`
      vBallB = normalize(transformed);
      #ifdef USE_INSTANCING
        // (a lobe is stretched to its clump: its normals are stretched the other way; vBallB: the way the CLUMP faces here, as a ball would)
        vec3 s2B = vec3(dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz), dot(instanceMatrix[1].xyz, instanceMatrix[1].xyz), dot(instanceMatrix[2].xyz, instanceMatrix[2].xyz));
        objectNormal /= s2B;
        vBallB = mat3(modelMatrix) * (mat3(instanceMatrix) * (vBallB / s2B));
      #endif`,
    vertexWorld: /* glsl */`vRest = wp.xyz; vCrownB = aCrown; vOldF = aOld; wp.xyz += stirOf(wp.xyz, aOld);
      { vec3 toE = cameraPosition - wp.xyz; float dE = max(length(toE), 0.01); wp.xyz += toE * (uPullB.x * smoothstep(uPullB.z, uPullB.w, dE) / dE); }`,
    fragmentPars: /* glsl */`${LIGHT_PARS} ${NOISE_B} ${RAMP_GLSL} ${HEAP_GLSL} uniform sampler2D tDabB, tPuffB, tMidB; uniform vec4 uTileB, uPassB, uDabB, uHoleB, uToneB, uToneOldB, uFormB, uHollowB, uNearOldB, uPuffB, uCapB, uMosB; uniform vec3 uPinkB, uMassB, uBellyB, uHighColB; uniform vec4 uHighB, uVaultC; uniform vec2 uOldAtB; uniform float uVaultB; varying vec4 vCrownB; varying vec3 vBallB; varying float vOldF; float gCover;`,
    albedo: /* glsl */`
    { vec3 toEye = cameraPosition - vWPos; float farB = length(toEye);
      vec3 Nout = gl_FrontFacing ? N : -N;
      float facing = abs(dot(N, toEye / farB));
      // THE DABS, where the lobe STANDS (so that its stir does not slide them on it), from the ONE side it most nearly
      // faces (upright: the dabs' own up is the world's)
      vec3 an = abs(Nout), q = vRest * uTileB.x, qx = dFdx(q), qy = dFdy(q);
      vec2 tq, gx, gy; float upright = 1.0;
      if (an.y >= an.x && an.y >= an.z) { tq = q.xz + 0.37; gx = qx.xz; gy = qy.xz; upright = 0.0; } else if (an.x >= an.z) { tq = q.zy; gx = qx.zy; gy = qy.zy; } else { tq = q.xy + 0.71; gx = qx.xy; gy = qy.xy; }
      // AT A SIZE THAT GROWS WITH DISTANCE: within uDabB.x metres a dab is its own size (a flower); beyond, the dabs are
      // laid twice as large for every doubling of the distance, so a dab stays about twelve pixels and a far crown is
      // dabbed, never smooth. Between two sizes the larger comes in by patches, never as a ghost over the smaller.
      float lodB = log2(max(farB / (uDabB.x * mix(1.0, 1.0 / uMosB.z, vOldF)), 1.0)), l0 = floor(lodB), k0 = exp2(-l0);      // (a dab on the oldest tree is smaller: its flowers are no larger than another tree's, and it is seen from further)
      float big = step(0.12 + 0.76 * noiseB(tq * 1.3 * k0 + 3.1), lodB - l0);
      float kk = k0 * (1.0 - 0.5 * big);
      vec2 dabUV = tq * kk + 0.43 * (l0 + big), dabX = gx * kk, dabY = gy * kk;
      vec4 dabT = textureGrad(tDabB, dabUV, dabX, dabY);      // r: the dab's chance; g: how far inside it (0.5 its edge; less: a gap between dabs); b: a second chance; a: its place in the order of going
      // THE TONE, BY THE FORM: by the round of the whole clump (a ball's normal) more than by its heaps; up, wrapped (a
      // flank is still in the light); and out of the crown (what looks into it is in its shade)
      vec3 Ns = normalize(mix(Nout, normalize(vBallB), uFormB.x));
      vec4 tn = mix(uToneB, uToneOldB, vOldF);
      float formL = tn.x + tn.y * Ns.y + tn.z * dot(Ns, normalize(vRest - vCrownB.xyz));
      // and the HEAPS between the dab and the clump (HEAP_GLSL). (Looked up at from beneath, a heap shows only its under
      // side: there they count for little, or the roof is a camouflage of their creases)
      float lookUpB = smoothstep(0.25, 0.85, -toEye.y / farB);
      formL += heapB(vRest, farB) * (1.0 - 0.7 * lookUpB);
      // (the third way: PUFFS, drawn on what stands upright of the mass: each light at its top and dark at its foot, the
      // lower lying over the upper. In the world's own metres, where the lobe stands)
      if (uPuffB.y > 0.001) {
        vec2 pq = (upright > 0.5 ? (an.x >= an.z ? vRest.zy : vRest.xy + 3.7) : vRest.xz + 1.9) * uPuffB.x * mix(1.0, 0.45, vOldF);
        vec4 pf = texture2D(tPuffB, pq);
        float sideB = mix(0.25, 1.0, upright) * (1.0 - 0.7 * lookUpB);
        formL += (uPuffB.y * (pf.r - 0.42) * 2.0 + uPuffB.z * (pf.b - 0.5) * 2.0 - uPuffB.w * (1.0 - smoothstep(0.0, 0.16, pf.g))) * sideB;
      }
      // (looked UP at from under it, against the sky, blossom is lit through: the vault of the oldest tree is a luminous
      // lilac with deeper gaps, not a dark roof. Not in the water's mirror: there the crowns' undersides stay deep)
      formL += (uBl.z + uVaultB * vOldF) * uPassB.y * lookUpB;
      // (the seventh making: THE VAULT IS ONE PALE SHELL. Looked up at from under the oldest tree its tones draw together
      // about a pale lilac white: with the whole run of tones up there it was a camouflage of periwinkle and peach, and
      // the page's vault is "the pale shell with sky in it". Its dabs still differ by their own chance)
      // (from anywhere UNDER its crown, whatever of it stands more than a few degrees above the eye: the eye is inside the shell)
      float vaultK = uPassB.y * vOldF * max(lookUpB, (1.0 - smoothstep(uVaultC.w * 0.62, uVaultC.w, length(cameraPosition.xz - uOldAtB))) * smoothstep(0.08, 0.3, -toEye.y / farB));
      formL = mix(formL, uVaultC.x, uVaultC.y * vaultK);
      // (far off the tones draw together a little, as the air draws them: a far crown is pale puffs with soft undersides,
      // never a row of white caps on dark bodies)
      formL = mix(formL, 0.62, 0.3 * smoothstep(35.0, 100.0, farB));
      // a dab is ONE tone: the form's, give or take its own chance. (The form's tone stops short of white: in full
      // light the dabs are white and pale lilac by turns, never one white sheet; and in the deepest shade a dab is still
      // a dab, lilac on periwinkle, never one blue sheet)
      // (a cap lit only by how it looks up has LEVEL borders all round it: a white layer on a violet layer, tree after tree:
      // the director's shelves. A slow unevenness of the world's own, and the lobe's own lumps, bend them)
      formL += uFormB.w * (noiseB(vRest.xz * 0.83 + vRest.y * 0.47) + 0.5 * noiseB(vRest.zy * 1.9 + vRest.x * 1.3) - 0.75);
      // (THE MOSAIC, the sixth making: a dab is ONE tone all over, the tone the form has AT THE DAB'S OWN MIDDLE (the second
      // picture says which way that is; the form is carried there along its own slope across the screen). So where two
      // tones meet, their border is the outline of a dab: a scalloped arc, as a brush lays one flower over the next;
      // with the form running THROUGH the dabs its borders were soft level bands and a mass was an airbrushed ball)
      float chanceB = dabT.r;
      if (uMosB.x > 0.5 && uPassB.y > 0.5) {
        vec4 midT = texture2D(tMidB, dabUV);
        vec2 toMid = (midT.rg - 0.5) * (4.0 / 16.0);              // (in the picture's own measure: sixteen dabs across)
        float det = dabX.x * dabY.y - dabY.x * dabX.y;
        if (abs(det) > 1e-12) {
          vec2 st = vec2(toMid.x * dabY.y - dabY.x * toMid.y, dabX.x * toMid.y - toMid.x * dabX.y) / det;      // (pixels across, pixels up, to the dab's middle)
          formL += clamp(st.x * dFdx(formL) + st.y * dFdy(formL), -0.3, 0.3);
        }
        chanceB = midT.b;
      }
      // (none of a dab's own chance in the water's picture: at the mirror's grain every dab that differs from its neighbour is a block)
      float tone = max(min(formL - uFormB.z, uFormB.y) + tn.w * (chanceB - 0.5) * uPassB.y, 0.2);      // (the mass a little under its sprays: lilac flowers on a deeper lilac, white on white at the top)
      // between dabs, and a dab here and there, is HOLLOW: the shade between clusters of flowers (a few whole dabs in
      // the light, more in the shade; the gaps between dabs wider in the shade too)
      float shadeB = 1.0 - clamp(formL, 0.0, 1.0);
      float gap = 1.0 - smoothstep(-0.05, 0.05, dabT.g - mix(uHollowB.x, uHollowB.y, shadeB));
      float hollow = max(gap, 1.0 - smoothstep(-0.03, 0.03, dabT.r - 0.22 * shadeB));
      hollow *= uPassB.y;
      tone -= uHollowB.z * hollow;
      // (the far wall of a clump, seen through an open patch: in the crown's own shade, its dabs still dabs)
      // (and the INSIDE of a cap, seen from under its lip: the same shade, deepest of all; looked up at steeply, from
      // under the tree, it is lit through like everything overhead: the vault is a pale shell, not a dark roof)
      if (!gl_FrontFacing) tone = mix(min(tone, 0.6) - 0.42, min(tone, 0.85) - 0.15, max(lookUpB * uPassB.y, vaultK));
      float stepW = mix(0.45, uMosB.w, uPassB.y);              // (in the mirror the tones run into one another: water does not keep a brush's edge)
      float T = clamp(tone, 0.0, 1.0) * 4.0; T = (floor(T) + smoothstep(0.5 - stepW, 0.5 + stepW, fract(T))) * 0.25;      // (stepsB, its borders as crisp as the way asks)
      vec3 colB = rampB(T);
      // (the inside of a cap is the deepest shade of the crown: its boughs are drawn against it. Not looked up at from under the tree)
      if (!gl_FrontFacing) colB *= mix(uBellyB, vec3(1.0), max(lookUpB * uPassB.y, vaultK));
      // (ABOVE THE LINE OF THE LAST LIGHT the hour's air is a warm white for all pale paint (set.js), shade and all: the upper
      // dome's undersides went mauve and the whole top was one peach cloud. Shade keeps the hue it has below the line:
      // the warmth lies on what is lit, as in the key painting)
      // (and from under the tree ALL of it keeps the shade's hue: what one looks up at is lit through by a teal sky, not by the west)
      colB *= mix(vec3(1.0), uHighColB, smoothstep(uHighB.x, uHighB.y, vWPos.y) * max(1.0 - smoothstep(0.6, 0.95, T), uVaultC.z * vaultK));
      // (no two dabs quite one white: four in ten a breath darker and cooler. It is what says "flowers" in a field of one tone)
      colB *= mix(vec3(1.0), vec3(0.93, 0.925, 0.985), uMosB.y / 0.1 * step(0.6, fract(chanceB * 7.31)) * uPassB.y);

      // pink only where warmth touches blossom: in the creases of the light side, and a dab in sixty that is nearly all bud
      // (and only near the eye: from twenty metres a bud is a speck, and a dab of the mass there is a whole cluster: pink
      // dabs that size were salmon blots all over a crown. The page rations pink)
      colB = mix(colB, colB * uPinkB, max(uHollowB.w * hollow * smoothstep(0.45, 0.8, formL), 0.7 * step(0.984, dabT.b) * step(0.5, T)) * (1.0 - smoothstep(9.0, 20.0, farB)));
      albedo *= colB * uMassB;
      // (the light that falls on it afterwards goes by the clump's round too: a lobe is a few great facets, and light
      // laid by their own normals draws them)
      N = normalize(mix(N, normalize(vBallB) * (gl_FrontFacing ? 1.0 : -1.0), uFormB.x));
      // WORN AWAY DAB BY DAB, those with the least place in the order first:
      // at its edge, wherever it turns from the eye (more than wholly, at the very edge: a dab seen along the surface is a streak);
      float thr = (1.0 - smoothstep(0.0, uTileB.y, facing)) * uTileB.z;
      // in open patches all over it: one looks into the clump, at its far wall in shade, at a bough, at the sky (fewer
      // far off: there the gaps BETWEEN clumps are the crown's openings; and more of the far wall than of the near: a
      // clump is a shell of flowers on its twigs, not a bag);
      thr = max(thr, uHoleB.x * (gl_FrontFacing ? 1.0 : uHoleB.y) * (1.0 - 0.5 * smoothstep(28.0, 70.0, farB)));
      // THE CAP: open beneath, dab by dab from its lip (its boughs and the inside of its far wall show under it)
      float underB = dot(normalize(vBallB), normalize(vec3(0.0, -1.0, 0.0) + uCapB.w * normalize(vCrownB.xyz - vRest)));
      // (only the side toward the eye: the far wall stays whole behind the boughs, in shade: the heap's violet belly)
      // (and only in the direct view: the water looks up INTO every cap, and at its own coarser grain an open cap was a
      // heap of dark blocks. In the mirror a crown is a whole pale mass, as the key painting's reflections are)
      if (gl_FrontFacing && uPassB.y > 0.5) thr = max(thr, smoothstep(uCapB.x, uCapB.y, underB) * uCapB.z);
      // and as the eye comes near the whole mass comes apart into its dabs: under a bough it is no surface at all
      // (the oldest tree's great heaps from further off: a boat passes under them at ten to twenty-five metres, and a
      // heap ten metres across, whole, at that distance is a cloud)
      // (IN PATCHES, the fourth making: where every other dab had gone, evenly, the half-open mass was fish scales. A slow
      // unevenness says which handfuls of dabs go first, so what is left stands in tufts with open gaps between)
      vec2 nearW = mix(uDabB.yz, uNearOldB.xy, vOldF);
      float thrN = 1.06 * (1.0 - smoothstep(nearW.x, nearW.y, farB));
      float ordN = mix(dabT.a, noiseB(tq * uHoleB.z + 1.7), uHoleB.w);
      // (a dab about to go has drawn in from its border: it shrinks, then it is gone; one that is safe fills its place)
      // (in the water's picture a mass is worn by a slow unevenness, not dab by dab: at the mirror's coarser grain a dab is
      // a block, and the reflection of a crown's edge was a staircase)
      float ordA = uPassB.y > 0.5 ? dabT.a : 0.15 + 0.85 * noiseB(tq * 2.6 + 9.1);
      float room = min(ordA - thr, mix(1.0, ordN - thrN, smoothstep(0.0, 0.12, thrN)));
      gCover = smoothstep(0.0, 0.03, room) * mix(1.0, smoothstep(-0.03, 0.05, dabT.g - clamp(0.82 - 2.6 * room, 0.0, 0.82)), uPassB.y);
      alpha = uPassB.x > 0.5 ? step(0.04, gCover) : gCover;
    }`,
    light: LIGHT_GLSL,
    final: 'if (uPassB.x > 0.5) gl_FragColor.a = gCover;',
  };
  // ---- the sprays
  const cardExt = {
    uniforms: U,
    vertexPars: /* glsl */`${STIR_GLSL} ${HEAP_GLSL}
      attribute vec4 aPlace, aTurn, aMass, aLook;
      uniform vec4 uCells[16], uCellGeo[16], uLodB, uPassB, uStirB, uCardB, uPullB, uWayB, uWayC;
      varying vec4 vSpray; varying vec2 vDabB, vCardB; varying float vOldC; float vOldB;
      vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }`,
    vertexLocal: /* glsl */`
    { int ci = int(aMass.w + 0.5);
      vec4 rect = uCells[ci], geo = uCellGeo[ci];
      vUv0 = rect.xy + uv * rect.zw; vCardB = uv;
      vDabB = uv * geo.xy * 0.3333 + vec2(aLook.z * 13.0, aLook.x * 7.0);      // (a card's own dabs: one about the size of one of its flowers)
      // near the eye every spray stands at its own size; further off fewer are drawn and each is drawn larger
      vec3 atB = (modelMatrix * vec4(aPlace.xyz, 1.0)).xyz, toEyeB = uCameraPos - atB;
      float far = length(toEyeB);
      float grow = clamp(far / (uLodB.x * aPlace.w / uLodB.z), 1.0, uLodB.y);
      float keep = uWayB.w > 0.5 ? 1.0 : pow(grow, -uLodB.w);      // (the third way thins them by where they stand on their mass, below, not by chance)                         // (a little fewer than would keep their whole cover: far off, the mass under them carries the crown)
      float shown = clamp((keep * 1.3 - aLook.x) / (0.3 * keep + 0.02), 0.0, 1.0); shown = shown * shown * (3.0 - 2.0 * shown);
      // (what is planted on a MASS and not on a twig comes in only where the mass is: from six metres to twelve)
      // (and a spray on a twig that stands well outside every mass is the tree's lace near the eye; far off, its twig
      // too thin to be seen, it is a flake afloat in the sky: it goes between fourteen metres and thirty)
      float innB = step(15.5, aLook.w), look0B = aLook.w - 16.0 * innB;
      float outB = step(7.5, look0B), look1B = look0B - 8.0 * outB, onMassB = step(3.5, look1B), lookB = look1B - 4.0 * onMassB;
      shown *= mix(1.0, smoothstep(6.0, 12.0, far), onMassB) * mix(1.0, 1.0 - smoothstep(uWayC.y, uWayC.z, far), outB);
      // (the third way: from where the mass stands, a card only BREAKS ITS OUTLINE (it is kept where its mass turns from
      // the eye) and dabs its face here and there: the heap under it, lit by its own round, is what is seen, with the
      // gaps between heaps and the boughs in them. Every card over every mass was a wall of chips.)
      if (uWayB.w > 0.5) {
        float rimC = 1.0 - abs(dot(normalize(aMass.xyz), normalize(toEyeB * mat3(modelMatrix))));
        float keepC = max(smoothstep(uWayB.z - 0.12, uWayB.z + 0.12, rimC), step(fract(aLook.z * 17.31 + aLook.x * 5.7), uWayC.x));
        shown *= mix(1.0, keepC, smoothstep(uWayB.x, uWayB.y, far) * (1.0 - outB));
      }
      // (and what flowers UNDER a cap, in its hollow, goes from where the mass stands: there one sees the boughs)
      shown *= 1.0 - innB * uWayC.w * smoothstep(uWayB.x, uWayB.y, far);
      float size = aPlace.w * grow * shown;
      vec3 at = vec3((uv.x - geo.z) * geo.x, (uv.y - geo.w) * geo.y, 0.0) * size;
      // it trembles about where it is held, the tip most, each to its own time; and nods, slowly
      float ph = aLook.z * 6.2832;
      float nod = (sin(uTime * (13.0 + 6.0 * aLook.z) + ph) * uStirB.x + sin(uTime * (1.9 + 1.3 * aLook.z) + ph * 1.7) * uStirB.y) * uStirB.z;
      at.z += at.y * nod; at.x += at.y * nod * 0.6 * sin(ph * 3.0);
      vec3 bx = qrot(aTurn, vec3(1.0, 0.0, 0.0)), by = qrot(aTurn, vec3(0.0, 1.0, 0.0)), bz = qrot(aTurn, vec3(0.0, 0.0, 1.0));
      // A card is never shown edge-on (seen along itself it is a smear): where the eye comes within thirty-eight
      // degrees of its plane it turns about its own upright (a spray about its twig), just far enough to keep
      // that much of its face to the eye. It keeps still for every other eye. Looked at along its upright it cannot be saved by turning: there
      // it SHRINKS away (it is never thinned to a veil: half-covered pixels over a whole card are a gauze).
      {
        vec3 vL = normalize(toEyeB * mat3(modelMatrix)), vp = vL - by * dot(vL, by);
        float vl = length(vp);
        if (vl > 0.05) {
          vp /= vl; float a = dot(vp, bz);
          if (abs(a) < 0.62) {
            vec3 w = cross(by, vp); if (dot(w, bz) < 0.0) w = -w;
            bz = normalize((a >= 0.0 ? 0.62 : -0.62) * vp + 0.785 * w); bx = cross(by, bz);
          }
        }
        at *= smoothstep(0.14, 0.36, abs(dot(vL, bz)));
      }
      transformed = aPlace.xyz + bx * at.x + by * at.y + bz * at.z;
      objectNormal = aMass.xyz;
      vOldB = step(1.5, lookB); vOldC = vOldB;
      // its tone: the form's, where it was planted; the heap's it stands in; and, seen THROUGH its crown (it grows on the far
      // side of its clump and shows between nearer sprays), the crown's own shade: this is what gives a crown of sprays
      // its depth. (Not looked up at steeply: there it stands against the sky and is lit through.)
      vec3 vLB = normalize(toEyeB * mat3(modelMatrix));
      float wallB = smoothstep(0.1, 0.75, -dot(normalize(aMass.xyz), vLB)) * (1.0 - smoothstep(0.35, 0.8, -vLB.y));
      vSpray = vec4(aLook.y + heapB(atB, far) - uCardB.w * wallB, lookB - 2.0 * vOldB, shown, far);
    }`,
    vertexWorld: /* glsl */`vRest = wp.xyz; wp.xyz += stirOf(vec3(aPlace.x, wp.y, aPlace.z), vOldB);
      { vec3 toE = cameraPosition - wp.xyz; float dE = max(length(toE), 0.01); wp.xyz += toE * (uPullB.y * smoothstep(uPullB.z, uPullB.w, dE) / dE); }`,
    fragmentPars: /* glsl */`${LIGHT_PARS} ${RAMP_GLSL} uniform sampler2D tDabB; uniform vec4 uPassB, uCardB, uTwigB, uHighB, uWayB, uVaultC; uniform vec2 uOldAtB; uniform vec3 uPinkB, uCoolB, uHeartB, uHighColB; varying vec4 vSpray; varying vec2 vDabB, vCardB; varying float vOldC; float gCover;
      float bayer2B(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
      float bayerB(vec2 a) { return bayer2B(0.5 * a) * 0.25 + bayer2B(a); }`,
    albedo: /* glsl */`
    { if (!gl_FrontFacing) N = -N;                               // the light is the mass's, whichever side of a card is seen
      // The heart of a flower: near the eye it is blossom pink (the page: pink is for buds and flower hearts), not the
      // grey-violet of its own shade; far off it is filled to the petal's colour (at eight pixels a flower with its
      // heart is a dotted cloth). The twig keeps its dark (a heart is about 0.15 in the picture, a twig 0.02).
      float lumB = dot(tx.rgb, vec3(0.3, 0.5, 0.2)), farH = smoothstep(4.0, 12.0, vSpray.w);
      float heartB = (1.0 - smoothstep(0.22, 0.5, lumB)) * smoothstep(0.035, 0.09, lumB);
      // (THE SCRATCHES: every card carries its own twig, drawn dark, and from ten metres on those twigs lay across the pale
      // crowns as short black dashes: thousands of them. Near the eye a spray's twig joins it to its wood; from uTwigB.x
      // to uTwigB.y metres it is cut out of the card, and only the flowers are left)
      alpha *= 1.0 - (1.0 - smoothstep(0.05, 0.12, lumB)) * smoothstep(uTwigB.x, uTwigB.y, vSpray.w);
      // (the seventh making: the GRAPHIC cards carry their own heart, a straw dot in a shallow throat, and their own shade,
      // flower by flower. Near the eye the picture is shown as it was painted; only far off are its darks filled)
      albedo *= (uWayB.w > 0.5 ? mix(tx.rgb, vec3(0.94, 0.88, 0.87), heartB * 0.95 * farH) : mix(tx.rgb, mix(uHeartB, vec3(0.94, 0.88, 0.87), farH), heartB * (0.55 + 0.4 * farH))) / max(tx.rgb, vec3(1e-3));
      // ITS TONE is the crown's, by the form, as the mass's is (worked out where it was planted). Near the eye a spray is
      // one even tone; far off, where it is a dab among dabs, its tone is laid as the mass's is: dab by dab, in steps
      float farT = smoothstep(uCardB.y, uCardB.z, vSpray.w);
      float toneC = min(vSpray.x, 0.94) + uCardB.x * (texture2D(tDabB, vDabB).r - 0.5) * farT;
      // (the vault, as the mass: from under the oldest tree its sprays overhead are lit through, one pale shell)
      vec3 toEyeC = cameraPosition - vWPos; float sinC = -toEyeC.y / max(length(toEyeC), 0.01);
      float vaultK = uPassB.y * vOldC * max(smoothstep(0.25, 0.85, sinC), (1.0 - smoothstep(uVaultC.w * 0.62, uVaultC.w, length(cameraPosition.xz - uOldAtB))) * smoothstep(0.08, 0.3, sinC));
      toneC = mix(toneC, uVaultC.x, uVaultC.y * vaultK);
      albedo *= rampB(mix(clamp(toneC, 0.0, 1.0), stepsB(toneC), farT)) * uCoolB;
      albedo *= mix(vec3(1.0), uHighColB, smoothstep(uHighB.x, uHighB.y, vWPos.y) * max(1.0 - smoothstep(0.6, 0.95, toneC), uVaultC.z * vaultK));      // (shade keeps its hue above the line of the last light: as the mass)
      if (!gl_FrontFacing) albedo *= mix(vec3(1.0), uPinkB, 0.14);      // a petal is pink outside: a spray seen from behind shows a breath of it
      albedo = mix(albedo, albedo * uPinkB, vSpray.y);         // the few that are nearly all bud
      // (in the water's picture a card is a ROUND dab: at the mirror's coarser grain the cut cards were half-covered
      // rectangles, and the reflection of a crown was a heap of blocks)
      if (uPassB.y < 0.5) alpha = max(alpha, 0.55) * (1.0 - smoothstep(0.3, 0.46, length(vCardB - 0.5)));
      // the cut. Near, it is the picture's own edge, a pixel soft; far, where the picture is small, it is its cover
      float wide = max(fwidth(alpha), 1e-3), farB = smoothstep(0.12, 0.45, wide);
      gCover = mix(clamp((alpha - 0.5) / wide + 0.5, 0.0, 1.0), min(1.0, alpha * 1.25), farB);
      alpha *= step(0.2, gCover / max(alpha, 1e-3) + farB);
      alpha = uPassB.x > 0.5 ? step(0.03, gCover) : mix(alpha, step(bayerB(gl_FragCoord.xy), alpha * 1.25), farB);
    }`,
    // (and looked UP at, against the sky, a petal is lit through: the sprays over a rider's head, and those of the
    // oldest tree's vault, are luminous, not dull. Only the sprays, and only steeply: a crown looked at from the
    // side keeps its lilac underside)
    light: LIGHT_GLSL + /* glsl */`
    c += albedo * uSkyThruB * (smoothstep(0.05, 0.75, -normalize(uCameraPos - vWPos).y) * uBl.z * (1.0 - smoothstep(12.0, 34.0, vSpray.w)));`,
    final: 'if (uPassB.x > 0.5) gl_FragColor.a = gCover;',
  };
  const dress = { brush: 0.4, steps: 2, shade: 0.62, cutout: true };
  const duskExt = shared.dusk || { albedo: 'vec3 ownColour = albedo;' };      // (the hour's light on the paint: set.js. Without it, the module built alone, the blossom still draws)
  // (the mass takes little of the light's own ramp: its form is laid in its dabs, and a smooth run of light across a
  // lobe would lie over the mosaic as a second, softer drawing)
  const lobeOpts = { ...dress, shade: Q.has('lshade') ? +Q.get('lshade') : 0.3, color: '#ffffff', side: THREE.DoubleSide, extend: [lobeExt, duskExt] };
  // (the sprays take less of the key's shadow than the mass does: the whole sky is their lamp, and they are what holds it)
  const cardMat = kit.gouache({ ...dress, shade: 0.34, color: '#ffffff', map: atlas, side: THREE.DoubleSide, extend: [cardExt, duskExt] });
  cardMat.uniforms.uColor.value.setScalar(1.04);

  // ============================================================================================== the lobes of every crown
  // Each is { shape (0..11), m (its matrix in the realm), inv, c (its middle), rad (its mean half width), area (square
  // metres of its surface), kind, tint, old, crown (Vector4: the middle of its crown and how far the crown reaches),
  // cards (how it is clothed), size (what a spray's own size is multiplied by on it), mates (the lobes of its crown) }.
  const lobes = [];
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _m = new THREE.Matrix4();
  const tints = ['#f4f1f8', '#ebe7f3', '#f6f0f1', '#e6e3ef'];    // one of four wear tints to a tree
  let group = [];                                                // the lobes of one crown
  let OLD = 0;                                                   // 1 while what is being made grows on the oldest tree
  const cols = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], cross = new THREE.Vector3();
  /** One lobe on one clump. tree: the tree's matrix (tree space -> realm); cl: a clump in the tree's own space;
   *  g: how much larger or smaller than its clump; shift: metres it is moved (tree space). */
  const put = (tree, cl, shape, kind, tint, cards, crown, { g = 1, shift = null, flip = false, size = 1 } = {}) => {
    const ax = AXES[shape], sz = SIZE[shape];
    for (let j = 0; j < 3; j++) cols[ax[j]].set(cl.ax[j][0], cl.ax[j][1], cl.ax[j][2]);
    if (flip) { cols[ax[0]].negate(); cols[ax[1]].negate(); }                                      // half a turn about its shortest axis
    if (cross.crossVectors(cols[0], cols[1]).dot(cols[2]) < 0) cols[ax[1]].negate();               // (a turn, never a mirror; its shortest axis keeps its way)
    const sc = [0, 0, 0]; for (let j = 0; j < 3; j++) sc[ax[j]] = 2 * cl.r[j] * g / sz[ax[j]];
    const m = new THREE.Matrix4().makeBasis(cols[0].clone().multiplyScalar(sc[0]), cols[1].clone().multiplyScalar(sc[1]), cols[2].clone().multiplyScalar(sc[2]));
    m.setPosition(cl.c[0] + (shift ? shift[0] : 0), cl.c[1] + (shift ? shift[1] : 0), cl.c[2] + (shift ? shift[2] : 0)).premultiply(tree);
    const k = Math.cbrt(Math.abs(tree.determinant())) * g, a = cl.r[0] * k, b = cl.r[1] * k, c = cl.r[2] * k, pw = 1.6075;
    const lobe = { shape, m, inv: m.clone().invert(), c: new THREE.Vector3().setFromMatrixPosition(m), rad: (a + b + c) / 3, rmax: a,
      area: 1.12 * 4 * Math.PI * Math.pow((Math.pow(a * b, pw) + Math.pow(a * c, pw) + Math.pow(b * c, pw)) / 3, 1 / pw),
      kind, tint, cards, size, crown, mates: group, old: OLD };
    lobes.push(lobe); group.push(lobe);
    return lobe;
  };
  const pick = (list, k) => list[((k % list.length) + list.length) % list.length];
  const treeMatrix = (t, low) => new THREE.Matrix4().compose(_p.set(t.x, 0, t.z),
    _q.setFromEuler(low ? _e.set(0, plan.heading(t.s) + (t.d > 0 ? Math.PI : 0), 0, 'XYZ') : _e.set(Math.sin(t.leanDir) * t.lean, t.turn, Math.cos(t.leanDir) * t.lean, 'XYZ')),
    _s.setScalar(low ? 1 : t.scale));
  // which of the twelve shapes a clump may wear, by its lie
  const ROUND = [0, 1, 2, 3, 5, 4], LONG = [6, 7];
  const shapeFor = (cl, k, far) => (far ? (cl.r[0] > 1.45 * cl.r[1] ? 9 : 8) : cl.r[0] > 1.5 * cl.r[1] ? pick(LONG, k) : pick(ROUND, k));
  // How a lobe is clothed: sprays to a square metre of its surface [clusters lying on it, sprays standing out of it],
  // and a spray's own size there (1 = a 12 cm flower).
  const NEAR = { lie: 0.6, stand: 0.4, size: 1.3 }, LOW = { lie: 0.7, stand: 0.6, size: 1.05 }, FAR = { lie: 0.28, stand: 0.16, size: 1.9 }, MOTE = { lie: 0.06, stand: 0.03, size: 3.6 };
  const DOME = { lie: 0.7, stand: 0.4, size: 1.3 };
  // ---- every design of tree: its clumps (in the tree's own space), the middle of its crown, how far it reaches
  const designs = {};
  const designOf = (name, model, kind, variant, low) => {
    const key = kind + ':' + name;                                // (the far rows and the motes wear the avenue's six designs too: each kind gathers them its own way)
    if (designs[key]) return designs[key];
    const ends = model && model.ends ? model.ends : ruleEnds(variant, low, ctx.rng(31 + variant * 7 + (low ? 3 : 0))), spurs = (model && model.spurs) || [];
    const P = []; let lo = 1e9, hi = -1e9, cx = 0, cz = 0, n = 0;
    for (const a of [ends, spurs]) for (let i = 0; i < a.length; i += 6) { P.push(a[i], a[i + 1], a[i + 2]); lo = Math.min(lo, a[i + 1]); hi = Math.max(hi, a[i + 1]); cx += a[i]; cz += a[i + 2]; n++; }
    cx /= n; cz /= n;
    let reachOut = 0; for (let i = 0; i < P.length; i += 3) reachOut = Math.max(reachOut, Math.hypot(P[i] - cx, P[i + 2] - cz));
    const K = kind === 'near' ? K_TREE + (low ? 2 : 0) : kind === 'far' ? 5 : 1;
    const clumps = kind === 'mote'
      ? [{ c: [cx, lo + 0.42 * (hi - lo), cz], ax: [[1, 0, 0], [0, 0, 1], [0, 1, 0]], r: [reachOut * 0.92, reachOut * 0.92, 0.5 * (hi - lo)], n }]
      : clumpsOf(P, K, kind === 'far' ? { pad: 0.45, least: 1.0, flat: ROUNDQ[0], long: 1.9 } : { pad: 0.3, least: 0.75, flat: ROUNDQ[0], long: WC ? 1.5 : 2.0 });
    return (designs[key] = { key, kind, ends, spurs, clumps, centre: [cx, lo + 0.22 * (hi - lo), cz], reach: Math.max(reachOut, hi - lo), lo, hi });
  };
  const stands = [];                                             // every tree: { t, kind, m (its matrix), lobes, crown, design, entry (the wood's own record of it) }
  const crownOf = (D, M) => { _p.set(D.centre[0], D.centre[1], D.centre[2]).applyMatrix4(M); return new THREE.Vector4(_p.x, _p.y, _p.z, D.reach * Math.cbrt(Math.abs(M.determinant()))); };
  const addStand = (t, kind, cards, ti) => {
    const entry = WOOD && WOOD.of(t), model = entry && WOOD.models[entry.model];
    const key = entry ? entry.model : kind === 'near' ? (t.low ? `low_${t.low}` : 'ABCDEF'[t.variant]) : kind;
    const D = designOf(key, model, kind, t.low ? (t.low === 'A' ? 2 : 4) : (t.variant || 0), t.low);
    const M = (entry && entry.matrix) || treeMatrix(t, kind === 'near' && !!t.low);
    const crown = crownOf(D, M), r = ctx.rng(7000 + ti * 13 + (kind === 'far' ? 5000 : kind === 'mote' ? 9000 : 0));
    group = [];
    // no two trees alike: each wears its design's clumps a little larger or smaller, shifted, in other shapes turned
    // other ways; and one tree in three has lost a clump (its twigs still flower: that side of it is lace)
    const lost = kind === 'near' && r() < 0.34 ? 1 + Math.floor(r() * (D.clumps.length - 1)) : -1;
    D.clumps.forEach((cl, i) => {
      const g = (0.9 + 0.26 * r()) * MASSQ[0], shift = [(r() - 0.5) * 0.5, (r() - 0.5) * 0.4, (r() - 0.5) * 0.5], flip = r() < 0.5, k = Math.floor(r() * 12);
      if (i === lost) return;
      if (kind === 'mote') { put(M, cl, 10, kind, tints[t.tint], cards, crown, { g, flip }); put(M, { ...cl, c: [cl.c[0] + shift[0], cl.c[1] + 0.3 * cl.r[2], cl.c[2] + shift[2]], r: [cl.r[0] * 0.55, cl.r[1] * 0.5, cl.r[2] * 0.75] }, 8, kind, tints[t.tint], cards, crown, { g, flip }); return; }
      put(M, cl, shapeFor(cl, k, kind === 'far'), kind, tints[t.tint], cards, crown, { g, shift, flip });
    });
    stands.push({ t, kind, m: M, lobes: group, crown, design: D, entry });
  };
  // ---- the avenue: 110 trees in the six sailable rows. A boat can lie under any of them.
  plan.trees.trees.forEach((t, ti) => addStand(t, 'near', NEAR, ti));
  // ---- rows +/-37 and +/-46: never nearer than nine metres to a boat
  plan.trees.far.forEach((t, ti) => addStand(t, 'far', FAR, ti));
  // ---- rows +/-55 to +/-73: low shapes in mist
  plan.trees.motes.forEach((t, ti) => addStand(t, 'mote', MOTE, ti));

  // ---- the oldest tree. Where its twigs end is the wood's to say (heroes.js: shared.tree.tips, every twig end and the
  // way it points, `low` on the low limbs). The dome's ends are gathered into great clumps, the low limbs' into
  // garlands. Until that wood is modelled, the layout's lobes on their rings and the page's limb lines serve.
  group = [];                                                    // (its dome and its limbs' garlands are one crown)
  const dome = group, limbLobes = [];
  const T = plan.tree, treeAt = F.at(T.at[0], T.at[1]);
  const ident = new THREE.Matrix4();
  const bare = !!Tr.bare;                                        // (&bare=1, heroes.js: the tree without its blossom)
  const domeCrown = new THREE.Vector4(treeAt.x, 3.5, treeAt.z, 31);
  U.uOldAtB.value.set(treeAt.x, treeAt.z);
  // (the two sky windows of the look back, kept by heroes.js: nothing of mine may close them)
  const WIN = Tr.windows, _w = new THREE.Vector3(), _d = new THREE.Vector3();
  const inWindow = (x, y, z, r) => !!WIN && WIN.through.some((th) => {
    _d.subVectors(th, WIN.eye); const l = _d.length(); _d.divideScalar(l); _w.set(x, y, z).sub(WIN.eye);
    const t = _w.dot(_d); return t > l * 0.3 && _w.addScaledVector(_d, -t).length() < r + 1.5;
  });
  // a spray's own size up there: nothing of it is ever nearer the eye than its height (less the rider's own)
  const SIZEUP = nums('sizeup', [1.8]);                          // (it was 3.2: flowers a third of a metre across on the dome)
  const sizeUp = (y) => clamp((y - 1.1) / LOD.near, 1.0, SIZEUP[0]);
  let highTips = null, lowTips = null;
  if (!bare && Array.isArray(Tr.tips) && Tr.tips.length) {
    const flowers = Tr.flowers || [];                            // (the dipped tip's flowers are modelled one by one: no card is hung on them)
    highTips = []; lowTips = [];
    for (const t of Tr.tips) {
      if (t.low && flowers.some((f) => (f.x - t.x) ** 2 + (f.y - t.y) ** 2 + (f.z - t.z) ** 2 < 0.3)) continue;
      if (Math.hypot(t.x - treeAt.x, t.z - treeAt.z) < 3.3 && t.y < 9) continue;      // (nothing flowers flat against the bole: a card there is a sticker)
      (t.low ? lowTips : highTips).push(t.x, t.y, t.z, t.dx, t.dy, t.dz);
    }
  }
  OLD = 1;
  if (!bare && highTips && highTips.length) {
    const P = []; for (let i = 0; i < highTips.length; i += 6) P.push(highTips[i], highTips[i + 1], highTips[i + 2]);
    const cl = clumpsOf(P, K_DOME, { reach: 1.75, pad: 0.9, least: 2.2, flat: ROUNDQ[1], long: 1.8, few: 8 });
    const rd = ctx.rng(4242);
    cl.forEach((c, i) => {
      const [x, y, z] = c.c, high = y > 24;
      if (inWindow(x, y, z, c.r[1] * 0.8)) return;               // (the two sky windows stay open)
      const cards = { ...DOME, lie: DOME.lie / sizeUp(y - c.r[2]) ** 2, stand: DOME.stand / sizeUp(y - c.r[2]) ** 2 };
      put(ident, c, 11, 'dome', '#ffffff', cards, domeCrown, { g: 0.96 + 0.16 * rd(), flip: rd() < 0.5, size: sizeUp(y - c.r[2]) });
      // a great heap has shoulders: smaller heaps riding on its outer side, so that the dome's outline is heaps on heaps
      const nS = c.r[1] > 3.6 ? 2 : 1, out = _w.set(x - treeAt.x, (y - 6) * 1.3, z - treeAt.z).normalize().clone();
      for (let k = 0; k < nS; k++) {
        const a = rd() * TAU, side = _d.set(Math.cos(a), 0.3 * (rd() - 0.3), Math.sin(a)).addScaledVector(out, -_d.dot(out)).normalize();
        const d = c.r[1] * (0.45 + 0.3 * rd()), lift = c.r[2] * (0.55 + 0.25 * rd()), ww = c.r[1] * (0.42 + 0.16 * rd());
        const sx = x + side.x * d + out.x * lift, sy = y + side.y * d + out.y * lift, szz = z + side.z * d + out.z * lift;
        if (inWindow(sx, sy, szz, ww * 0.6)) continue;
        put(ident, { c: [sx, sy, szz], ax: c.ax, r: [ww * (1.1 + 0.3 * rd()), ww, ww * (0.8 + 0.15 * rd())] }, pick(high ? [4, 0, 3] : ROUND, i + k), 'dome', '#ffffff', cards, domeCrown, { flip: rd() < 0.5, size: sizeUp(sy - ww) });
      }
    });
  } else if (!bare && Tr.lobes) {
    Tr.lobes.forEach((L, i) => { if (!inWindow(L.x, L.y + L.r * 0.4, L.z, L.r * 0.7)) put(ident, { c: [L.x, L.y + L.r * 0.45, L.z], ax: [[1, 0, 0], [0, 0, 1], [0, 1, 0]], r: [L.r * 1.0, L.r * 0.95, L.r * 0.7 * (L.tall || 1)] }, pick([11, 0, 3], i), 'dome', '#ffffff', DOME, domeCrown, { size: sizeUp(L.y) }); });
  }
  if (!bare && lowTips && lowTips.length) {
    // a garland wherever the low limbs' twigs end in tufts: gathered into clumps two or three metres long
    const P = []; for (let i = 0; i < lowTips.length; i += 6) P.push(lowTips[i], lowTips[i + 1], lowTips[i + 2]);
    const cl = clumpsOf(P, Math.max(8, Math.round(P.length / 3 / 26)), { reach: 1.6, pad: 0.25, least: 0.6, flat: 0.7, long: 2.6, few: 6 });
    const rl = ctx.rng(4343);
    cl.forEach((c) => limbLobes.push(put(ident, c, shapeFor(c, Math.floor(rl() * 12), false), 'near', '#ffffff', LOW, domeCrown, { g: 0.92 + 0.2 * rl(), flip: rl() < 0.5 })));
  } else if (!bare) {
    const limbs = [[T.lampLimb.line.slice(0, 6), T.lampLimb.thick], [T.arch.line.slice(0, 5), T.arch.thick], [T.westLimb.line, T.westLimb.thick]];
    limbs.forEach(([line, thick]) => {
      for (let k = 0; k < line.length - 1; k++) {
        const a = line[k], b = line[k + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(1, Math.round(len / 2.6));
        for (let j = 0; j < n; j++) {
          const u = (j + 0.25 + 0.5 * rnd()) / n, s = a[0] + (b[0] - a[0]) * u, d = a[1] + (b[1] - a[1]) * u, y = a[2] + (b[2] - a[2]) * u;
          if (Math.hypot(s - T.at[0], d - T.at[1]) < 3.6) continue;                                  // (not on the bole)
          const p = F.at(s, d, 0), p2 = F.at(s + (b[0] - a[0]) / len, d + (b[1] - a[1]) / len, 0), w = 0.9 + 0.4 * rnd();
          const dir = [p2.x - p.x, 0, p2.z - p.z], dl = Math.hypot(dir[0], dir[2]) || 1;
          limbLobes.push(put(ident, { c: [p.x, y + thick * 0.7, p.z], ax: [[dir[0] / dl, 0, dir[2] / dl], [-dir[2] / dl, 0, dir[0] / dl], [0, 1, 0]], r: [w * 1.5, w, w * 0.8] }, pick(LONG, j + k), 'near', '#ffffff', LOW, domeCrown));
        }
      }
    });
  }
  OLD = 0;

  // ============================================================================================== the mass, drawn
  // One instanced draw to a shape (twelve for the whole orchard). In way b it is only a small soft core.
  const core = WAY === 'b' ? 0.6 : 1;
  const byShape = Array.from({ length: 12 }, () => []);
  for (const L of lobes) byShape[L.shape].push(L);
  const geos = [], meshes = [], _c = new THREE.Color(), shrink = new THREE.Matrix4().makeScale(core, core, core);
  for (let k = 0; k < 12; k++) {
    const list = byShape[k];
    if (!list.length) { geos.push(null); continue; }
    const res = await kit.models(`${DIR}lobe_${String(k + 1).padStart(2, '0')}.glb`, list.map((L) => ({ position: [L.c.x, L.c.y, L.c.z], tint: L.tint })), lobeOpts);
    const mesh = res.meshes[0], g = mesh.geometry;
    list.forEach((L, i) => { mesh.setMatrixAt(i, core === 1 ? L.m : _m.multiplyMatrices(L.m, shrink)); mesh.setColorAt(i, _c.set(L.tint)); });
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    g.setAttribute('aOld', new THREE.InstancedBufferAttribute(Float32Array.from(list, (L) => L.old), 1));
    const cr = new Float32Array(list.length * 4); list.forEach((L, i) => L.crown.toArray(cr, i * 4));
    g.setAttribute('aCrown', new THREE.InstancedBufferAttribute(cr, 4));
    geos.push(g);
    for (const m of res.meshes) { m.frustumCulled = false; m.name = `blossom: lobe_${String(k + 1).padStart(2, '0')} x${list.length}`; meshes.push(m); }
    if (Q.get('lobes') === '0' || NONE) res.group.visible = false;
  }

  // ============================================================================================== the sprays, planted
  const SPRAYS = [0, 1, 2, 3, 0, 1, 2, 3, 4, 5, 4, 5, 7, 7, 6], FULL = [8, 9, 10, 11, 8, 9, 10, 11, 8, 9, 10, 11, 12, 13, 12, 13, 14, 15];
  const buf = [];                                                // every spray: [x, y, z, size, qx, qy, qz, qw, nx, ny, nz, cell, rank, shade, phase, bud]
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), N = new THREE.Vector3(), Pw = new THREE.Vector3(), D = new THREE.Vector3(), J = new THREE.Vector3(), basis = new THREE.Matrix4(), nm = new THREE.Matrix3();
  const jitter = (k) => J.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(2 * k);
  let ON_MASS = 0;                                               // 1 while what is planted stands on a mass (not on a twig)
  let OUT = 0;                                                   // 1 while what is planted stands on a twig well outside every mass
  let INNER = 0;                                                 // 1 while what is planted stands under a cap: in its hollow, or beneath it (way c)
  const _dn = new THREE.Vector3();
  /** How far a point of a clump looks DOWN its cap's opening (1: straight down it): n the way the clump faces there, C its crown. The lobes' shader says the same. */
  const underOf = (P, n, C) => { _dn.set(C.x - P.x, C.y - P.y, C.z - P.z).normalize().multiplyScalar(CAPQ[3]); _dn.y -= 1; _dn.normalize(); return n.x * _dn.x + n.y * _dn.y + n.z * _dn.z; };
  /** The tone of a point of blossom by its form: 0 periwinkle .. 0.5 lilac .. 1 blossom white. n: the way its clump faces there; C: its crown. The lobes' shader says the same. */
  const toneAt = (P, n, C) => {
    const dx = P.x - C.x, dy = P.y - C.y, dz = P.z - C.z, l = Math.hypot(dx, dy, dz) || 1, t = OLD ? TONEO : TONE;
    return t[0] + t[1] * n.y + t[2] * (n.x * dx + n.y * dy + n.z * dz) / l;
  };
  const CHANCE = Q.has('chance') ? +Q.get('chance') : 0.14;       // how far chance moves a whole spray's tone (the second making's: 0.5, half the range: neighbours were two species)
  /** A spray standing by its twig's foot at P and growing the way `way` (it hangs if that is downward). */
  const standAt = (P, way, mass, size, shade, wild = 0.3) => {
    Y.copy(way).add(jitter(wild)).normalize();
    Z.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).addScaledVector(Y, -Z.dot(Y));
    if (Z.lengthSq() < 1e-4) Z.set(Y.z, 0, -Y.x); Z.normalize();
    X.crossVectors(Y, Z);
    _q.setFromRotationMatrix(basis.makeBasis(X, Y, Z));
    const cell = SPRAYS[Math.floor(rnd() * SPRAYS.length)], k = 0.05 * size;
    N.copy(mass).multiplyScalar(0.78).addScaledVector(Y, 0.32).normalize();          // its light is the mass's, a little toward where it points
    buf.push([P.x - Y.x * k, P.y - Y.y * k, P.z - Y.z * k, size, _q.x, _q.y, _q.z, _q.w, N.x, N.y, N.z, cell, rnd(), shade, rnd(), (cell === 6 ? 0.5 : 0) + 2 * OLD + 4 * ON_MASS + 8 * OUT + 16 * INNER]);
  };
  /** A cluster facing the way `way`, its middle `off` metres beyond P along it. */
  const lieAt = (P, way, mass, size, shade, off = 0, wild = 0.4) => {
    const ox = way.x * off, oy = way.y * off, oz = way.z * off;
    Z.copy(way).add(jitter(wild)).normalize();
    X.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).addScaledVector(Z, -X.dot(Z));
    if (X.lengthSq() < 1e-4) X.set(Z.z, 0, -Z.x); X.normalize();
    Y.crossVectors(Z, X);
    _q.setFromRotationMatrix(basis.makeBasis(X, Y, Z));
    const cell = FULL[Math.floor(rnd() * FULL.length)];
    N.copy(mass).multiplyScalar(0.78).addScaledVector(Z, 0.32).normalize();
    buf.push([P.x + ox, P.y + oy, P.z + oz, size, _q.x, _q.y, _q.z, _q.w, N.x, N.y, N.z, cell, rnd(), shade, rnd(), 2 * OLD + 4 * ON_MASS + 8 * OUT + 16 * INNER]);
  };

  // ---- on a mass: places on each shape to plant by (a point of its surface and its normal there), found once
  const samples = geos.map((g, k) => {
    if (!g) return null;
    const pos = g.attributes.position, nor = g.attributes.normal, idx = g.index, r = ctx.rng(900 + k);
    const tri = [], cum = []; let area = 0;
    const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), n1 = new THREE.Vector3();
    const count = idx ? idx.count / 3 : pos.count / 3, vi = (i) => (idx ? idx.getX(i) : i);
    for (let f = 0; f < count; f++) {
      const a = vi(f * 3), b = vi(f * 3 + 1), c = vi(f * 3 + 2);
      A.fromBufferAttribute(pos, a); B.fromBufferAttribute(pos, b); C.fromBufferAttribute(pos, c);
      area += n1.subVectors(B, A).cross(C.clone().sub(A)).length() / 2; cum.push(area); tri.push([a, b, c]);
    }
    const out = [];
    for (let i = 0; i < 600; i++) {
      const x = r() * area; let lo = 0, hi = cum.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < x) lo = mid + 1; else hi = mid; }
      const [a, b, c] = tri[lo]; let u = r(), v = r(); if (u + v > 1) { u = 1 - u; v = 1 - v; } const w = 1 - u - v;
      const mixv = (attr, t) => t.set(attr.getX(a) * w + attr.getX(b) * u + attr.getX(c) * v, attr.getY(a) * w + attr.getY(b) * u + attr.getY(c) * v, attr.getZ(a) * w + attr.getZ(b) * u + attr.getZ(c) * v);
      out.push({ p: mixv(pos, new THREE.Vector3()), n: mixv(nor, new THREE.Vector3()).normalize() });
    }
    return out;
  });
  const _in = new THREE.Vector3();
  const buried = (P, L) => {                                      // inside another lobe of the same crown?
    for (const o of L.mates) {
      if (o === L || P.distanceToSquared(o.c) > o.rmax * o.rmax) continue;
      _in.copy(P).applyMatrix4(o.inv);
      const sz = SIZE[o.shape], a = _in.x / (sz[0] * 0.5), b = _in.y / (sz[1] * 0.5), c = _in.z / (sz[2] * 0.5);
      if (a * a + b * b + c * c < 0.6) return true;
    }
    return false;
  };
  /** Clothe one lobe with sprays planted on its own surface: clusters lying on it, sprays standing out of it (they hang on its under side). */
  const Bl = new THREE.Vector3();
  const plantOn = (L, more = 1) => {
    const S = samples[L.shape]; if (!S) return;
    nm.getNormalMatrix(L.m); ON_MASS = 1;
    const size0 = CELL * L.cards.size * L.size;
    for (let kind = 0; kind < 2; kind++) {
      let n = L.area * (kind ? L.cards.stand : L.cards.lie) * density * SHARE * more;
      n = Math.floor(n) + (rnd() < n - Math.floor(n) ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const sm = S[Math.floor(rnd() * S.length)];
        Pw.copy(sm.p).applyMatrix4(L.m); D.copy(sm.n).applyMatrix3(nm).normalize();
        if (buried(Pw, L) || (L.old && L.kind === 'dome' && inWindow(Pw.x, Pw.y, Pw.z, 0.4))) continue;      // (counted: a crown's inside is not clothed)
        if (L.old && Pw.y < 12 && Math.hypot(Pw.x - treeAt.x, Pw.z - treeAt.z) < 4.6) continue;             // (nothing flowers flat against the bole: a card there is a sticker)
        const size = size0 * (kind ? 0.72 + 0.34 * rnd() : 0.9 + 0.4 * rnd());
        Bl.copy(sm.p).normalize().applyMatrix3(nm).normalize().lerp(D, 1 - FORM[0]).normalize();      // (the way the CLUMP faces here, more than the heap: as the lobes' shader)
        if (WC && underOf(Pw, Bl, L.crown) > CAPQ[0] + 0.3) continue;                                  // (nothing is planted in a cap's opening: only along its lip, where sprays hang)
        // (a spray stands out of its mass and catches a little more of the sky than the mass does: the mass sits FORM[2] below)
        const shade = clamp(toneAt(Pw, Bl, L.crown) + (rnd() - 0.5) * CHANCE + (kind ? 0.05 : 0), 0, 1);
        if (kind) {
          if (D.y > -0.3) { Y.copy(D); Y.y += 0.3; } else { Y.copy(D).multiplyScalar(0.5); Y.y -= 0.85; }       // on its under side it hangs
          standAt(Pw, Y.normalize(), D, size, shade, 0.5);
        } else lieAt(Pw, D, D, size, shade, (0.05 + 0.28 * rnd()) * size);
      }
    }
    ON_MASS = 0;
  };
  // ---- on the wood: one spray to every tuft of twig ends (it grows on the way the twigs point), one cluster to every
  // flowering spur. `ends` and `spurs` are x, y, z, dx, dy, dz in the tree's own space (apple_wood.json).
  const thinned = new Map();
  const thin = (key, arr, cell) => {                              // one to a cell of `cell` metres: the mean place and way of what falls in it
    const id = key + '|' + cell; let out = thinned.get(id);
    if (!out) {
      const map = new Map();
      for (let i = 0; i < arr.length; i += 6) {
        const k = Math.floor(arr[i] / cell) + ',' + Math.floor(arr[i + 1] / cell) + ',' + Math.floor(arr[i + 2] / cell);
        let o = map.get(k); if (!o) map.set(k, o = [0, 0, 0, 0, 0, 0, 0]);
        for (let j = 0; j < 6; j++) o[j] += arr[i + j]; o[6]++;
      }
      out = [...map.values()].map((o) => { const n = o[6], l = Math.hypot(o[3], o[4], o[5]) || 1; return [o[0] / n, o[1] / n, o[2] / n, o[3] / l, o[4] / l, o[5] / l]; });
      thinned.set(id, out);
    }
    return out;
  };
  const massAt = (P, crown, out) => {                             // the way the crown's nearest mass faces at P, and how deep inside it P lies (0 its middle .. 1 its surface and beyond)
    let best = null, bd = 1e9;
    for (const L of crown) { const d = P.distanceTo(L.c) / L.rad; if (d < bd) { bd = d; best = L; } }
    if (!best) { out.set(0, 1, 0); return 1; }
    out.subVectors(P, best.c).normalize();
    return Math.min(2, bd);
  };
  const Mn = new THREE.Vector3();
  const plantWood = (m, crown, C, ends, spurs, cfg) => {
    for (const [list, isEnd] of [[ends, true], [spurs, false]]) for (const a of list) {
      if (rnd() > cfg.keep * density * SHARE) continue;
      Pw.set(a[0], a[1], a[2]).applyMatrix4(m); D.set(a[3], a[4], a[5]).transformDirection(m);
      if (cfg.window && inWindow(Pw.x, Pw.y, Pw.z, 0.6)) continue;
      const deep = massAt(Pw, crown, Mn);
      OUT = deep > 1.22 && !cfg.keepOut ? 1 : 0;
      INNER = WC && underOf(Pw, Mn, C) > CAPQ[0] ? 1 : 0;
      // white where the sky reaches it, lilac in the crown's own shade: by how its place in the crown faces, and how deep in a clump it stands
      const shade = clamp(toneAt(Pw, Mn, C) - 0.25 * (1 - smooth(0.5, 1.0, deep)) + (rnd() - 0.5) * CHANCE, 0, 1);
      const sz = cfg.sizeAt ? cfg.sizeAt(Pw.y) : cfg.size;
      // (the sixth making: what hangs LOW, where a boat passes within arm's reach, is sprays on twigs with air between them.
      // A cluster there, seen face-on from three metres, is a plate; a dozen lying on one another were scales)
      const lowK = WC ? smooth(4.3, 5.6, Pw.y) : 1;
      if (isEnd) {
        standAt(Pw, D, Mn, CELL * sz * (0.78 + 0.4 * rnd()), shade, 0.3);
        if (rnd() < cfg.caps * (0.25 + 0.75 * lowK)) lieAt(Pw, D, Mn, CELL * sz * (1.0 + 0.4 * rnd()) * (0.8 + 0.2 * lowK), Math.min(1, shade + 0.05), 0.12 * sz, 0.45);       // the same blossom, seen tip-on
      } else if (rnd() < 0.35 + 0.65 * lowK) {
        Y.copy(D).lerp(Mn, 0.45).normalize();
        lieAt(Pw, Y, Mn, CELL * sz * (1.0 + 0.45 * rnd()) * (0.8 + 0.2 * lowK), shade, 0.1 * sz, 0.4);
      } else standAt(Pw, D, Mn, CELL * sz * (0.7 + 0.3 * rnd()), shade, 0.5);
    }
    OUT = 0; INNER = 0;
  };
  const B = WAY === 'b', NEARGRID = Q.has('grid') ? +Q.get('grid') : 0.4;      // (metres: how fine an avenue tree's twig ends are gathered: one spray to a cell)
  const ON_WOOD = {                                               // how fine the wood's tufts are gathered, what share is planted, a spray's own size, how many ends also get a cluster
    near: { ends: NEARGRID, spurs: NEARGRID, keep: 1, size: 1.25, caps: B ? 0.5 : 0.4 },
    far: { ends: B ? 1.0 : 1.6, spurs: B ? 1.2 : 2.0, keep: 0.75, size: 1.9, caps: 0.3 },
    mote: { ends: 2.6, spurs: 9, keep: B ? 0.9 : 0.5, size: 3.6, caps: 0.3 },
  };
  if (B) for (const c of Object.values(ON_WOOD)) c.keepOut = true;      // (way b has no masses to stand outside of)
  const tally = {}; let mark = 0;
  const count = (k) => { tally[k] = (tally[k] || 0) + buf.length - mark; mark = buf.length; };
  for (const st of stands) {
    const cfg = ON_WOOD[st.kind], key = st.design.key;
    plantWood(st.m, st.lobes, st.crown, thin(key + '/e', st.design.ends, cfg.ends), cfg.spurs < 5 ? thin(key + '/s', st.design.spurs, cfg.spurs) : [], cfg);
    count(st.kind + ' on wood');
    if (!B) for (const L of st.lobes) plantOn(L);
    count(st.kind + ' on mass');
  }
  // the oldest tree: its dome's masses are clothed on their own surfaces (its twigs up there stand a metre and more
  // apart: each carries a spray, the masses carry the blossom); its low limbs' twigs, which a rider passes under, carry their own
  OLD = 1;
  if (!B || !highTips) for (const L of dome) if (L.kind === 'dome') plantOn(L, B ? 2 : 1);
  count('dome on mass');
  if (highTips && highTips.length) { plantWood(ident, dome, domeCrown, thin('oldest/high', highTips, B ? 0.7 : 1.0), [], { keep: 1, caps: 0.5, window: true, keepOut: B, sizeAt: (y) => 1.25 * sizeUp(y) }); count('dome on wood'); }
  if (lowTips && lowTips.length) {
    plantWood(ident, limbLobes.length ? limbLobes : dome, domeCrown, thin('oldest/low', lowTips, 0.6), [], { keep: 1, size: 1.1, caps: 0.5, keepOut: B });
    count('limbs on wood');
  }
  if (!B || !lowTips) for (const L of limbLobes) plantOn(L, lowTips ? 0.6 : 1);
  count('limbs on mass');
  OLD = 0;

  // sorted by rank: whatever is drawn first is what stays longest as sprays thin with distance (the mirror draws a share)
  buf.sort((a, b) => a[12] - b[12]);
  const n = buf.length, aPlace = new Float32Array(n * 4), aTurn = new Float32Array(n * 4), aMass = new Float32Array(n * 4), aLook = new Float32Array(n * 4);
  buf.forEach((b, i) => { aPlace.set(b.slice(0, 4), i * 4); aTurn.set(b.slice(4, 8), i * 4); aMass.set(b.slice(8, 12), i * 4); aLook.set([b[12], b[13], b[14], b[15]], i * 4); });
  const cardGeo = new THREE.InstancedBufferGeometry();
  cardGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(12), 3));      // (the shader places every corner)
  cardGeo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  cardGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  cardGeo.setIndex([0, 1, 2, 0, 2, 3]);
  cardGeo.setAttribute('aPlace', new THREE.InstancedBufferAttribute(aPlace, 4)); cardGeo.setAttribute('aTurn', new THREE.InstancedBufferAttribute(aTurn, 4));
  cardGeo.setAttribute('aMass', new THREE.InstancedBufferAttribute(aMass, 4)); cardGeo.setAttribute('aLook', new THREE.InstancedBufferAttribute(aLook, 4));
  cardGeo.instanceCount = n;
  cardGeo.boundingSphere = new THREE.Sphere(treeAt.clone(), 400);
  const cards = new THREE.Mesh(cardGeo, cardMat);
  cards.name = `blossom: ${n} sprays`; cards.frustumCulled = false; cards.renderOrder = 1;         // (after the mass and the wood: what they hide is not drawn)
  if (Q.get('cards') !== '0' && !NONE) ctx.add(cards);

  // ---- each of the three pictures of a frame gets its own: how edges are cut (by cover where the picture has many
  // samples, by a threshold where it has one), and in the water's mirror fewer, larger sprays
  // (and nothing of the blossom is drawn into the engine's picture of the scene without the water: that picture is for
  // what lies under the surface and for telling paint from water below the horizon, and no blossom hangs lower than the
  // rider's eye. A third of its cost, saved.)
  const pass = (mesh, isCards) => {
    const all = isCards ? n : mesh.count;
    mesh.onBeforeRender = (renderer) => {
      const rt = renderer.getRenderTarget(), mirror = !!engine.reflecting, under = rt === engine.pre && !Q.has('prepass');
      U.uPassB.value.set(rt && rt.samples > 0 ? 1 : 0, mirror ? 0 : 1, 0, 0);
      U.uLodB.value.x = LOD.near * (mirror ? LOD.mirror : 1);
      if (isCards) cardGeo.instanceCount = under ? 0 : mirror ? Math.ceil(n * 0.45) : n; else mesh.count = under ? 0 : all;
      mesh.material.uniformsNeedUpdate = true;
    };
    mesh.onAfterRender = () => { if (isCards) cardGeo.instanceCount = n; else mesh.count = all; };
  };
  pass(cards, true); for (const m of meshes) pass(m, false);
  // (the orchard in snow shows the blossom in its mirror only: shared.blossomLayer = 'mirror' before this module builds)
  if (shared.blossomLayer) for (const o of [cards, ...meshes]) ctx.only(o, shared.blossomLayer);

  // ============================================================================================== what this replaces
  // The stand-in lobes and sprays live in other people's modules (kit.js, heroes.js): taken out here, now that the real
  // blossom stands; their lines there can go.
  const gone = removeStandIn(ctx, '(lobes)') + removeStandIn(ctx, /^spray$/);

  // ============================================================================================== for the cast and the staging
  const crowns = [];                                             // where petals are shed from: { x, z, r, under } (discs, for canopyMask)
  for (const L of lobes) {
    if (L.kind === 'mote') continue;
    crowns.push({ x: L.c.x, z: L.c.z, r: L.rad * 1.05, under: Math.max(0.5, L.c.y - L.rad * 0.8) });
  }
  crowns.sort((a, b) => b.under - a.under);                      // (the lowest last: where clumps overlap, canopyMask keeps the last one's underside, and a petal must leave from under the LOWEST blossom)
  const shake = { t: -1, len: 3, amount: 0.07 };
  shared.blossom = {
    way: WAY, count: n, lobes: lobes.length,
    /** Where petals are shed from: [{ x, z, r, under }], one disc to a clump of blossom (not the motes): canopyMask(ctx, { crowns, size: 512 }). `under` is the height of its underside. */
    crowns,
    /** Every lobe: { shape, m (Matrix4), c (its middle), rad (its mean half width), kind: 'near' | 'far' | 'mote' | 'dome', old (1 on the oldest tree) }. */
    all: lobes,
    /** Every tree's crown: { t (the plan's tree), kind, lobes, crown (Vector4: its middle, its reach) }. */
    trees: stands,
    uniforms: U, materials: { card: cardMat, lobe: meshes.length ? meshes[0].material : null }, dabs, atlas,
    /** Everything drawn here (twelve instanced masses and the sprays), apart from the wood: hide them and the orchard is bare. */
    objects: [...meshes, cards],
    show(on) { for (const o of [...meshes, cards]) o.visible = !!on; },
    /** The sway's numbers, for anything that must move with the blossom: kit.gouache({ sway: shared.blossom.sway }). */
    sway,
    /** A bumped trunk shakes its crown: at (x, z) in the realm, for `seconds`, `amount` metres at its outside. */
    shake(x, z, { seconds = 3, amount = 0.07, reach = 5.5 } = {}) { U.uShakeB.value.set(x, z, reach, 0); shake.t = 0; shake.len = seconds; shake.amount = amount; },
    /** A front of air across the orchard: its line at realm z, `depth` metres deep, stirring `more` times as much (2 = three times the sway). Call it every frame it moves; more = 0 ends it. */
    front(z, depth = 12, more = 2) { U.uFrontB.value.set(z, depth, more, 0); },
    /** The roost: the great crown shivers where the birds are coming down: `height` of the band (metres), `amount` metres (0 = still). */
    shiver(height, amount = 0.25) { U.uShiverB.value.set(treeAt.x, treeAt.z, height, amount * 0.25); },
    /** All of it stirring more or less: 1 = the page's sway. */
    gust(k) { U.uBlowMore.value.z = k; },
  };
  shared.counts = { ...(shared.counts || {}), blossom: { way: WAY, onWood: !!WOOD, oldestTips: [highTips ? highTips.length / 6 : 0, lowTips ? lowTips.length / 6 : 0], lobes: lobes.length, sprays: n, spraysBy: tally, standInsRemoved: gone,
    byKind: lobes.reduce((o, L) => { const k = L.old ? (L.kind === 'dome' ? 'dome' : 'limbs') : L.kind; o[k] = (o[k] || 0) + 1; return o; }, {}),
    triangles: byShape.reduce((s, list, k) => s + list.length * (sizes[`lobe_${String(k + 1).padStart(2, '0')}`].triangles || 0), 0),
    clumps: Object.fromEntries(Object.values(designs).map((d) => [d.key, d.clumps.length])) } };

  const backA = col(plan.chip.apricot), backB = col('#9cc4e0'), topA = col('#ffd9b4'), topB = col('#c9dcf0'), top0 = U.uTopB.value.z;
  // (the sixth making: the shade goes cooler with the hour too. Beside a white gone cool, the afterglow's lilac was mauve:
  // pinkish-grey flanks on the blue hour's crowns)
  const loA = U.uShadeLoB.value.clone(), loB = col(Q.get('lob') ? '#' + Q.get('lob') : WC ? '#a8b2d4' : '#' + loA.getHexString()), deepA = U.uDeepB.value.clone(), deepB = col(WC ? '#6e789e' : '#' + deepA.getHexString());
  const massA = U.uMassB.value.clone(), massB = col(WC ? '#eef1f8' : '#ffffff');
  // (what shade above the light's line is multiplied by: the hour's air below the line over its air above it, hue only)
  const LA = plan.light && plan.light.afterglow, LB = plan.light && plan.light.blue, highOn = WC && Q.get('highshade') !== '0' && LA && LB && LA.shade && LA.high && LA.last && LB.shade && LB.high && LB.last;
  const hueOf = (L) => { const a = col(L.shade), b = col(L.high), c = new THREE.Color(a.r / b.r, a.g / b.g, a.b / b.b), l = 0.3 * c.r + 0.5 * c.g + 0.2 * c.b; return c.multiplyScalar(0.96 / l); };
  const hiA = highOn ? hueOf(LA) : null, hiB = highOn ? hueOf(LB) : null;
  return {
    update(dt) {
      const k = shared.hour || 0;                                // how far the dusk has gone (0 afterglow .. 1 blue hour)
      U.uBackB.value.copy(backA).lerp(backB, k); U.uBl.value.y = 0.22 - 0.08 * k; U.uBl.value.z = THRU[0] * (1 - 0.45 * k);
      U.uShadeHiB.value.copy(HI_A).lerp(HI_B, k); U.uCoolB.value.setRGB(1 - 0.06 * k, 1 - 0.02 * k, 1 + 0.05 * k);
      if (highOn) { U.uHighColB.value.copy(hiA).lerp(hiB, k); U.uHighB.value.set(LA.last.line[0] + (LB.last.line[0] - LA.last.line[0]) * k, LA.last.line[1] + (LB.last.line[1] - LA.last.line[1]) * k, 0, 0); }
      U.uShadeLoB.value.copy(loA).lerp(loB, k); U.uDeepB.value.copy(deepA).lerp(deepB, k); U.uMassB.value.copy(massA).lerp(massB, k);
      U.uTopColB.value.copy(topA).lerp(topB, k); U.uTopB.value.z = top0 * ((1 - k) * (1 - k) + 0.6 * k);      // warm in the afterglow; at blue hour a pale blue mountain
      if (shake.t >= 0) {
        shake.t += dt; const u = shake.t / shake.len;
        U.uShakeB.value.w = u >= 1 ? 0 : shake.amount * Math.min(1, u * 8) * (1 - u) * (1 - u);
        if (u >= 1) shake.t = -1;
      }
    },
  };
}
