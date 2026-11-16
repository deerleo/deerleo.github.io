// The orchard in flood: the place itself, its light and its water (stage 2d; the log is docs/build/orchard/2-light.md).
//   - shared.frame: the page's frame for every module (see the header of plan.js)
//   - THE LIGHT: shared.dusk (the area's extension of the gouache: the hour on the paint, last light by height, the
//     oldest tree's vault in its own shade, the rim of the band, the hold under the bloom, the afterglow's bank),
//     shared.mat / shared.paint (the area's materials), the light states driven by where the boat is
//   - THE SKY: the painted west as a true picture (its cloud bars straight and level), the gradient above it, the first
//     stars; the far painted rails; the bed; the mist in layers
//   - THE AFTERGLOW'S BANK (BANK_GLSL): the band of peach the first avenue looks at, as lit mist lying on the water of
//     the second avenue, worked out along every ray; the air on the water; the band given back to the mirror
//   - THE WATER: a teal mirror (plan.water), and THE PETALS lying on it: violet drifts with edges on a standing map of
//     where they gather (the lee of every trunk, windrows along the rows, banks beside the lane, the islet's shore), open
//     mirror between them with a single petal here and there; drawn by this module as a sheet on the water, parted by
//     whatever opens the water's trace (the hull, the stag, a carp). (Fourth pass, the second look: coverMap and the
//     petals' shader; and a fourth light state, `mist`, for the way out beyond the wall.)
//     (Sixth pass, the third pair of eyes: the mirror clean again and on the green side (plan.water); beyond the wall the
//     water goes into the mist with the air (the air sheet's `gap`, the bank drawing in at the gap); the band's light
//     given back to the mirror in its own apricot (uBankMirror).)
// What other modules take from here is in `shared`: frame, here, dusk, paint, mat, holdsLight, blossomSelf, hour (0
// afterglow .. 1 blue hour), light (the look states: loft, afterglow, blue, mist), sky, skin (the petals' controls:
// zones, the lane, the great fall; `cover` is the standing map itself, R = how thick the petals lie),
// seen / seenBlue (kept as names: the display is neutral now and they return the colour as given).
//
// Developer switches of this module: &dusk=0..1 (hold the hour) &w=key:value,... (water look) &rings=<s> (touch the water)
//   &petals=0 (the water without its petals)  &cover=<x> (multiply the petals' cover)  &lastlight=0  &sky=plain (no painting)
//   &bank=0 (without the afterglow's bank)  &limit=0 (without the hold under the bloom)  &keep=0 (the mirror without
//   the white trunks given back)  &airsheet=0 (without the air on the water)  &zones=pond:0.2,pool:0 (the petals'
//   zones)  &covermap=1 (writes the petals' standing map to .shots/orchard_cover.png)
//   &af=key:value,... &bl=... (plan.light.afterglow / .blue)  &pt=... (plan.water.petals)  &wa=... &wb=... (plan.water.afterglow / .blue)
//   &keepall=<x> (the mirror's lift of all pale paint)  &gapmist=<x> (how far the water beyond the wall goes into the mist; 0: not at all)
//   &bandmirror=0 (the band's light in the mirror without its own grade undone)
import { PETALS_ART, SKY_ART, FAR_ART } from './art.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const Q = new URLSearchParams(location.search);

// The two maps below take a few hundred milliseconds of plain arithmetic, and an area is built while the one before it
// is still being ridden: so they give the frame back every few milliseconds instead of holding it.
const breather = () => { let t = performance.now(); return async () => { if (performance.now() - t > 5) { await new Promise((r) => setTimeout(r, 0)); t = performance.now(); } }; };

// ------------------------------------------------------------------------------------------------ THE AFTERGLOW'S BANK
// The band of peach that the first avenue looks at is mist lying on the water of the second avenue, lit from behind by
// the band in the sky (plan.js, LIGHT.bank). It is not cards: it is worked out, for every point that is drawn, as how much
// of the bank lies between the eye and that point, so the far colonnade goes into it trunk by trunk and whatever stands
// in front of it stands dark and sharp against it. Its density is
//     uBank.w * clamp((-z - uBank.x) * uBank.y, 0, 1) * exp(-y * uBank.z)
// (it begins uBank.x metres west, rises to its whole density over 1 / uBank.y metres, thins by e every 1 / uBank.z
// metres up), and bankDepth adds that up exactly along a ray. This text is shared by everything that stands in the
// orchard's air: the paint (shared.dusk), the sky, the far rails, and the sheet of air that lies on the water itself.
// It needs `uniform vec3 uWest;` declared before it.
const BANK_GLSL = /* glsl */`
  uniform vec4 uBank; uniform vec3 uBankWest, uBankSide, uBankMirror; uniform vec2 uBankLobe;
  float bankPhi1(float x) { return abs(x) < 0.02 ? 1.0 - 0.5 * x : (1.0 - exp(-x)) / x; }
  float bankPhi2(float x) { return abs(x) < 0.02 ? 0.5 - x / 3.0 : (1.0 - exp(-x) * (1.0 + x)) / (x * x); }
  float bankDepth(vec3 e, vec3 d, float len) {
    float u0 = (-e.z - uBank.x) * uBank.y, a = -d.z * uBank.y, h0 = max(e.y, 0.0) * uBank.z, b = d.y * uBank.z;
    if (b < 0.0) len = min(len, h0 / -b);                    // (never below the water)
    float rs = 0.0, re = 0.0, fs = 0.0, fe = 0.0;            // the stretch of the ray in the bank's rise, and the stretch in the whole bank
    if (a > 1e-6) { rs = clamp(-u0 / a, 0.0, len); re = clamp((1.0 - u0) / a, 0.0, len); fs = re; fe = len; }
    else if (a < -1e-6) { fe = clamp((1.0 - u0) / a, 0.0, len); rs = fe; re = clamp(-u0 / a, 0.0, len); }
    else { if (u0 >= 1.0) fe = len; else if (u0 > 0.0) re = len; }
    float sum = 0.0, dr = re - rs, df = fe - fs;
    if (dr > 1e-3) { float x = clamp(b * dr, -40.0, 80.0); sum += exp(-(h0 + b * rs)) * dr * (clamp(u0 + a * rs, 0.0, 1.0) * bankPhi1(x) + a * dr * bankPhi2(x)); }
    if (df > 1e-3) sum += exp(-(h0 + b * fs)) * df * bankPhi1(clamp(b * df, -40.0, 80.0));
    return max(sum, 0.0) * uBank.w;
  }
  // the bank's own colour, by the way the eye looks: into the band, the band's light; across it, the dusk's
  // (sixth pass: in the water's own picture of the world, the one drawn from under the surface, the band's light is
  // multiplied by uBankMirror, which undoes the mirror's grade channel by channel: the water gives the band back in the
  // band's own apricot, wherever it shows between the trunks, and not as a grey rose)
  vec3 bankColour(vec3 d) { float w = max(0.0, dot(normalize(d.xz + vec2(1e-5)), uWest.xz)); return mix(uBankSide, cameraPosition.y < 0.0 ? uBankWest * uBankMirror : uBankWest, pow(w, uBankLobe.x)); }
  // what a thing at p shows through the bank, seen from e
  vec3 bankVeil(vec3 c, vec3 e, vec3 p, float keep) { vec3 d = p - e; float len = max(length(d), 1e-3); d /= len; return mix(c, bankColour(d), (1.0 - exp(-bankDepth(e, d, len))) * keep); }
`;

// ------------------------------------------------------------------------------------------------ small noise, for the maps
// A wrapping lattice of random numbers and smooth value noise over it (the maps below are made once, at load).
function lattice(seed, n = 256) {
  let s = seed; const v = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) { s = (s * 16807) % 2147483647; v[i] = s / 2147483647; }
  const m = n - 1;
  return (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
    const a = v[(iy & m) * n + (ix & m)], b = v[(iy & m) * n + ((ix + 1) & m)], c = v[((iy + 1) & m) * n + (ix & m)], d = v[((iy + 1) & m) * n + ((ix + 1) & m)];
    return (a + (b - a) * u) * (1 - w) + (c + (d - c) * u) * w;
  };
}

// ------------------------------------------------------------------------------------------------ the petals' picture
// One tile of fallen petals, 3 m to a repeat, drawn petal by petal (each 5.5 to 9.5 cm long: five times life, as stage snow is).
// It is not a picture of rafts: every petal carries ITS OWN THRESHOLD, and the sheet on the water shows a petal only
// where the standing cover is above it. So a drift thins to single petals at its edge, whole petal by whole petal.
//   R  the petal's own light (its cupped shade, a paler edge, the dark it throws on the water beside it)
//   G  its hue: 0 white, 0.5 lilac in shade, 1 the pink of a petal lying on its face
//   B  its threshold, 0..1 (1 where there is no petal)
//   A  where it is
export async function petalTile(THREE, size = 1024, seed = 29) {
  const N = size, d = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) { d[i * 4] = 226; d[i * 4 + 1] = 40; d[i * 4 + 2] = 255; d[i * 4 + 3] = 0; }      // (the mean petal under the empty parts, so that far away it thins without going dark)
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const count = 1900, petals = [];
  for (let i = 0; i < count; i++) {
    // (third pass: fewer pure whites, more lilac, and a wider spread of light from petal to petal. All of one white, the
    // petals round the bow read as floes of ice)
    const hue = rnd() < 0.42 ? rnd() * 0.16 : rnd() < 0.76 ? 0.36 + rnd() * 0.22 : 0.86 + rnd() * 0.14;
    // (fifth pass: no two petals one size or one tone. They were all within a sixth of one length and a third of one
    // light, and round the bow they lay as a tiling of pale lozenges: now 5.5 to 9.5 cm, some slender and some broad, and
    // from half light to full. The numbers are drawn in the old order, so each petal keeps its place and its threshold.)
    const px = rnd() * N, py = rnd() * N, rot = rnd() * Math.PI * 2, ra = rnd(), rw = rnd(), thr = (i + rnd()) / count, rl = rnd(), cup = rnd() < 0.5 ? 1 : -1;
    petals.push({ x: px, y: py, rot, a: 12.8 * (0.74 + ra * 0.52), w: 0.6 + rw * 0.24, thr, lum: 0.5 + 0.5 * Math.pow(rl, 0.7), hue, cup, taper: 1.18 + 0.3 * ((ra * 7.31) % 1) });
  }
  // (seventh pass) PETALS LIE IN LITTLE RAFTS. Every petal's threshold used to be its own throw of the dice, so a drift at
  // any cover was an even scatter of separate petals: confetti. On still water petals cling together: so the thresholds
  // now run in patches a hand to an arm across (two octaves of a noise that wraps with the tile): where the cover falls,
  // whole clusters go and the ones that stay are dense, touching, with clean water between them. The first twentieth
  // keep their own throw: the single petals that lie alone on open water stay scattered. (CLUSTER = 0 is the old scatter.)
  const CLUSTER = Q.get('cluster') != null ? +Q.get('cluster') : 0.82;
  if (CLUSTER > 0) {
    const nA = lattice(seed + 101, 8), nB = lattice(seed + 211, 16);
    const rest = petals.filter((p) => p.thr >= 0.05).map((p) => ({ p, k: CLUSTER * (0.72 * nA(p.x / N * 8, p.y / N * 8) + 0.28 * nB(p.x / N * 16, p.y / N * 16)) + (1 - CLUSTER) * p.thr })).sort((u, v) => u.k - v.k);
    rest.forEach((q, j) => { q.p.thr = 0.05 + 0.95 * (j + 0.5) / rest.length; });
  }
  // (laid in order of threshold, the last to go on top: where a drift thins, what is left is never a petal with a bite out of it)
  petals.sort((p, q) => q.thr - p.thr);
  const put = (px, py, r, g, b, al) => {
    const o = ((py & (N - 1)) * N + (px & (N - 1))) * 4, k = al, a0 = d[o + 3] / 255;
    d[o] = Math.round(d[o] * (1 - k) + r * 255 * k); d[o + 1] = Math.round(d[o + 1] * (1 - k) + g * 255 * k);
    if (k > 0.35 || a0 < 0.02) d[o + 2] = Math.round(b * 255);
    d[o + 3] = Math.round(255 * (1 - (1 - a0) * (1 - k)));
  };
  const rest = breather(), prof = new Float32Array(50); let done = 0;
  for (const p of petals) {
    if (++done % 60 === 0) await rest();
    const c = Math.cos(p.rot), sn = Math.sin(p.rot), b0 = p.a * p.w, rx = Math.ceil(Math.hypot(p.a * c, b0 * sn) * 1.14 + 3), ry = Math.ceil(Math.hypot(p.a * sn, b0 * c) * 1.14 + 3);
    // (its outline, heel to tip, worked out once for the petal and read from this table at every texel)
    for (let k = 0; k <= 48; k++) prof[k] = Math.pow(Math.sin(Math.PI * Math.pow(k / 48, p.taper)), 0.72);
    // the dark it throws on the water beside it (the petal lies a little proud of the surface): a thin crescent
    for (let pass = 0; pass < 2; pass++) {
      const ox = pass ? 0 : 1.6, oy = pass ? 0 : 1.9;
      for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
        const u = (i - ox) * c + (j - oy) * sn, v = -(i - ox) * sn + (j - oy) * c;
        // (fifth pass) AN APPLE PETAL, not an oval: narrow at the heel where it was fixed, broadest three fifths of the way
        // to its tip, the tip round and whole. (A notch in the tip was tried: an apple's petal has none, and with one
        // every petal on the water was a little heart.) t runs heel to tip.
        const t = (u / p.a + 1) * 0.5;
        if (t <= 0.004 || t >= 1) continue;
        const tk = t * 48, k0 = tk | 0, half = b0 * (prof[k0] + (prof[k0 + 1] - prof[k0]) * (tk - k0)), f = Math.abs(v) / Math.max(half, 1e-3);
        if (f >= 1.12) continue;
        const edge = clamp01((half - Math.abs(v)) / 1.3) * clamp01(t * p.a * 2 / 1.6);
        if (edge <= 0) continue;
        if (!pass) { put(Math.round(p.x) + i, Math.round(p.y) + j, 0.2, 0.3, p.thr, edge * 0.5); continue; }
        // a cupped petal: one side of it turned to the light and the other away, a soft fold down its middle, a darker
        // heel, a pale rolled rim
        const across = v / Math.max(half, 1e-3), fold = Math.exp(-across * across * 9), lumi = p.lum * (0.92 + 0.15 * across * p.cup) * (1 - 0.1 * fold) * (1 - 0.2 * (1 - smooth(0.0, 0.42, t))) + 0.07 * smooth(0.7, 1.0, f) * smooth(0.25, 0.6, t);
        put(Math.round(p.x) + i, Math.round(p.y) + j, clamp01(lumi), p.hue, p.thr, edge);
      }
    }
  }
  let cover = 0; for (let i = 3; i < d.length; i += 4) cover += d[i];
  const tex = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  tex.colorSpace = THREE.NoColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4; tex.needsUpdate = true;
  tex.userData.cover = cover / (N * N) / 255;
  return tex;
}

// ------------------------------------------------------------------------------------------------ where the petals lie
// The standing cover the page asks for (how much of the water the petals cover, changing along the route), as one small
// picture over the whole orchard, made from the plan.
// FOURTH PASS (the second look): DRIFTS WITH EDGES, AND OPEN MIRROR BETWEEN THEM. The third pass's map was an even
// speckle thinned by noise: from the boat a floor of pale streaks, and round the bow a confetti of petals, with nowhere
// a stretch of clean mirror. The key painting's petals lie in RAFTS: a raft is all there or not there, its edge a
// hand wide in which the petals thin out one by one (each petal of the tile has its own threshold: see petalTile), and
// between the rafts the water is open, with a single petal to the square metre. Petals gather where still water
// gathers them:
//   in the lee of every trunk and prop (a collar round it and a tongue drawn out down the current), in windrows along
//   the rows of trunks, in banks either side of the lane a hull has pushed through them, lodged against the islet's
//   shore and along the pond's rim, thick in the standing growth at the sides, piled against the wall and torn to
//   rafts through its gap; in the second avenue the night's fall lies in long drifts with leads between them.
//   R  the cover (0 open water .. 1 the thick of a drift)
//   G  how far outside the lane of whoever went ahead (and the pool under the lamp), over 4 m
//   B  the page's s, over 256 m        A  how much of the pond this is (for the great fall)
export async function coverMap(THREE, plan) {
  const cell = 0.25, x0 = -56, x1 = 80, z0 = -274, z1 = 12, W = Math.ceil((x1 - x0) / cell / 4) * 4, H = Math.ceil((z1 - z0) / cell / 4) * 4;
  const cov = new Float32Array(W * H), data = new Uint8Array(W * H * 4);
  const n1 = lattice(41), n2 = lattice(97), n3 = lattice(7), n4 = lattice(1213), n5 = lattice(2741);
  const T = plan.tree.at, rows = [-28, -19, -10, 10, 19, 28], wall = plan.left.wall.s, loc = {};
  const P = plan.pool, rest = breather(), CV = plan.water.drifts || {};
  const loose = CV.loose ?? 0.715, drifts2 = CV.avenue2 ?? 0.53, lone = CV.single ?? 0.0016;
  for (let j = 0; j < H; j++) {
    if (j % 8 === 0) await rest();
    const z = z0 + (j + 0.5) * cell;
    for (let i = 0; i < W; i++) {
      const x = x0 + (i + 0.5) * cell, o = j * W + i;
      plan.locate(x, z, loc);
      const s = loc.s, d = loc.d, ad = Math.abs(d);
      if (ad > 58 || s < 14 || s > 262) { data[o * 4 + 1] = 255; data[o * 4 + 2] = Math.round(clamp01(s / 256) * 255); continue; }      // (nothing lies out there: mist)
      // noise in the water's own frame, stretched down the current
      const fine = n1(s * 2.3, d * 3.1), mid = n2(s * 0.42, d * 0.95), wide = n3(s * 0.11, d * 0.23), streak = n4(s * 0.16, d * 1.6);
      const rp = Math.hypot(s - T[0], d - T[1]), pond = 1 - smooth(21, 25, rp);
      const av2 = smooth(128, 150, s);
      // every outline is frayed: the fields below are read a little to one side, by a wandering metre or so (tongues
      // and bays in a drift's edge), and inside a drift small leads stay open
      const wx = n2(s * 0.83 + 13.1, d * 0.83 + 7.7) - 0.5, wd = n1(s * 0.71 + 3.3, d * 0.71 + 9.1) - 0.5, sw = s + 2.4 * wx, dw = d + 1.0 * wd;
      const leads = 1 - 0.95 * smooth(0.6, 0.66, n2(sw * 0.9 + 5.5, dw * 1.7 + 2.5) * 0.6 + fine * 0.4);
      // what a loose raft is cut from: shapes four or five metres long and a metre or two wide, drawn out down the current
      const R = n5(sw * 0.21 + 7.7, dw * 0.52 + 1.3) * 0.6 + n4(sw * 0.16, dw * 1.6) * 0.25 + n2(sw * 0.42, dw * 0.95) * 0.15;
      let rowNear = 0; for (const r of rows) rowNear = Math.max(rowNear, 1 - smooth(1.5, 6.5, Math.abs(d - r)));
      // ---- between the drifts: single petals, about one to the square metre (three in the second avenue, after the night's fall)
      let c = lone * (1 + 2 * av2);
      // ---- loose rafts: few down the middle of the first avenue (the mirror there holds the oldest tree), more toward the rows
      const at1 = loose - 0.03 * rowNear;
      c = Math.max(c, smooth(at1, at1 + 0.045, R) * leads);
      // ---- the second avenue: THE NIGHT'S FALL LIES IN LONG DRIFTS, 15 to 30 m long and a few metres wide, thick, with
      // small leads in them and long leads of open mirror between them: under half of the water. (The page's 0.8 to 0.95 is
      // a floor from an eye 1.1 m up; the fireflies still have a pale ground to light, and the lane is cut through it.)
      if (av2 > 0) {
        const big = n5(sw * 0.05 + 3.1, dw * 0.17 + 0.7), D = big * 0.62 + wide * 0.2 + n4(sw * 0.16, dw * 1.6) * 0.18, at2 = drifts2 + 0.3 * (1 - av2);
        c = Math.max(c, smooth(at2, at2 + 0.04, D) * leads);
      }
      // ---- windrows along the rows of trunks: a wandering band, half a metre to two and a half wide, broken by gaps
      for (const r of rows) {
        const dr = d - r; if (Math.abs(dr) > 5) continue;
        const off = Math.abs(dr + 1.3 * wd - (n3(s * 0.07 + r, 3.3) - 0.5) * 2.0), half = (0.45 + 1.7 * n2(s * 0.09 + r * 0.7, 1.7)) * (1 + 0.45 * av2);
        const there = smooth(0.4, 0.47, n2(sw * 0.11 + r * 1.3, 9.1) * 0.75 + streak * 0.25);
        c = Math.max(c, (1 - smooth(half - 0.3, half + 0.15 + 0.4 * fine, off)) * there * leads);
      }
      // ---- the standing growth at the sides (cow parsley and long grass from d 29): the petals lie thick among the stems
      if (ad > 27) c = Math.max(c, smooth(27, 31, ad) * smooth(0.4, 0.44, mid * 0.55 + streak * 0.45) * (1 - 0.6 * smooth(44, 56, ad)));
      // ---- the pond: the loosest water in the orchard (the oldest tree stands on its own reflection): a few rafts,
      // petals lodged against the islet's shore most of the way round, and broken arcs along the rim where the avenues'
      // slow water turns
      if (pond > 0.5) {
        const ang = Math.atan2(d - T[1], s - T[0]);
        let pc = lone * 1.4;
        pc = Math.max(pc, smooth(loose + 0.03, loose + 0.075, R) * leads);
        const lodge = 0.45 + 1.5 * n2(ang * 3.4, 2.2), shore = 6.75 + (n3(ang * 2.1, 5.5) - 0.5) * 0.7;
        pc = Math.max(pc, smooth(shore - 0.5, shore, rp) * (1 - smooth(shore + lodge - 0.25, shore + lodge + 0.15 + 0.35 * fine, rp)) * smooth(0.36, 0.42, n2(ang * 2.3 + 4.0, 7.7)));
        const rim = 21.6 + (n3(ang * 3.3, 8.5) - 0.5) * 2.6, rimW = 0.4 + 1.1 * n2(ang * 5.1, 6.2);
        pc = Math.max(pc, (1 - smooth(rimW - 0.2, rimW + 0.15 + 0.3 * fine, Math.abs(rp - rim))) * smooth(0.52, 0.57, n2(ang * 7.1, 6.2)));
        c = pc;
      }
      // ---- the loft: black water, with an apron of rafts drifted in across the threshold from s 18, thicker toward the door
      if (s < 26.4) {
        const atL = loose - 0.2 * smooth(17, 26, s);
        c = ad < 8.2 && s > 17 ? Math.max(lone * smooth(17, 22, s), smooth(atL, atL + 0.03, R) * smooth(17, 19, s)) : 0;
      }
      // ---- the wall: petals pile against its east face; through the gap the current tears them to rafts; beyond, rafts
      // thinning out to single petals on open water
      if (s > 200) {
        // (sixth pass: the rafts torn off by the quickened current were cut from a field drawn out six metres long and half a
        // metre wide: from a boat coming up to the gap, which looks straight along them, they lay on the water beyond the
        // wall as thin white slashes running to the vanishing point. A torn raft is now a raft: two or three metres long, a
        // metre or more wide, ragged, a little drawn out in the gap itself; and they thin to nothing by thirty metres out)
        const gap = 1 - smooth(7.2, 9.4, ad), tornOf = R * 0.55 + streak * 0.25 + mid * 0.2, tornOut = R * 0.72 + mid * 0.28;
        const pile = (1 - smooth(0.5, 1.9 + 1.6 * mid, wall - 0.4 - s)) * (s < wall - 0.3 ? 1 : 0) * (1 - gap);
        if (gap * smooth(204, 212, s) > 0.5) c = Math.max(lone * 2, smooth(0.585, 0.625, tornOf) * leads);
        c = Math.max(c, pile);
        if (s > wall + 0.4) { const at3 = 0.6 + 0.2 * smooth(wall + 4, wall + 30, s); c = Math.max(lone * 2 * (1 - smooth(wall + 12, wall + 36, s)), smooth(at3, at3 + 0.035, tornOut) * leads); }
      }
      cov[o] = c;
      // ---- the lane of whoever went ahead, and the pool under the lamp: how far outside them this place is
      const laneD = Math.abs(d - plan.lineD(s)), poolW = (P.width / 2 - 0.75) * smooth(P.from - 1, P.from + 3, s) * (1 - smooth(P.to - 3, P.to + 1, s));
      const out = s < plan.left.loft.door - 8 || s > wall + 10 ? 4 : Math.max(0, laneD - poolW);
      data[o * 4 + 1] = Math.round(255 * clamp01(out / 4));
      data[o * 4 + 2] = Math.round(clamp01(s / 256) * 255);
      data[o * 4 + 3] = Math.round(pond * 255);
      // ---- THE LANE'S BANKS: the petals a hull shouldered aside lie either side of the lane (and round the pool) as a
      // bank a metre or two deep, thick, with a ragged outer edge and a gap now and then. From an eye 1.1 m up two pale
      // banks running to the vanishing point with clean dark water between them are what makes the lane ONE LINE to the
      // lamp. (Thinner and more broken across the pond, where the page wants the loosest water; none inside the loft.)
      if (s > 22 && s < wall + 6) {
        const side = Math.sign(d - plan.lineD(s)) || 1, inPond = pond > 0.5;
        const from = 0.86 + 0.26 * n2(s * 0.33, 4.4 + side * 3), reach = (inPond ? 0.35 + 0.6 * n3(s * 0.12 + side * 11, 6.6) : 0.5 + 1.1 * n3(s * 0.12 + side * 11, 6.6)) * (1 + 0.5 * av2);
        const lo = (inPond ? 0.52 : 0.4) + 0.6 * (1 - smooth(24, 30, s));
        const there = smooth(lo, lo + 0.06, n2(s * 0.085 + side * 5.3, 2.9) * 0.75 + n3(s * 0.31, side * 2.0 + 0.7) * 0.25);
        const outw = out + 0.9 * wd * smooth(from, from + 0.6, out);                                    // (its inner edge keeps to the lane; its outer edge is frayed)
        const bank = smooth(from - 0.14, from + 0.1, out) * (1 - smooth(from + reach - 0.3, from + reach + 0.15 + 0.4 * fine, outw)) * there * leads;
        cov[o] = Math.max(cov[o], bank);
      }
    }
  }
  // ---- the lee of every trunk, prop and post: a collar of petals round it and a tongue drawn out down the current (west),
  // widest at the trunk and running out to a point: the thickest petals in the orchard
  const stamp = (ps, pd, r, len, k) => {
    const wide0 = 0.55 + 0.11 * len + r, p = plan.xz(ps + len * 0.5 - 0.6, pd), reach = len * 0.5 + 2.6, i0 = Math.max(0, Math.floor((p[0] - reach - x0) / cell)), i1 = Math.min(W - 1, Math.ceil((p[0] + reach - x0) / cell)), j0 = Math.max(0, Math.floor((p[1] - reach - z0) / cell)), j1 = Math.min(H - 1, Math.ceil((p[1] + reach - z0) / cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      plan.locate(x0 + (i + 0.5) * cell, z0 + (j + 0.5) * cell, loc);
      const u = loc.s - ps, v = loc.d - pd;
      if (v > wide0 * 1.5 + 0.8 || v < -wide0 * 1.5 - 0.8 || u < -1.7 || u > len + 0.5) continue;
      const rr = Math.hypot(u, v), nz = n1(loc.s * 2.3, loc.d * 3.1), nw = n2(loc.s * 0.55 + ps * 0.37, loc.d * 0.55 + pd * 0.61), lead = 1 - 0.9 * smooth(0.62, 0.68, n2(loc.s * 0.9 + 5.5, loc.d * 1.7 + 2.5) * 0.6 + nz * 0.4) * smooth(1.2, 2.2, rr);
      let c = 1 - smooth(r + 0.15, r + 0.5 + 0.45 * nz, rr);                                             // the collar
      if (u > -0.3) {                                                                                    // the tongue, in its lee
        const t = clamp01(u / len), halfw = wide0 * Math.sqrt(1 - t) * (0.62 + 0.76 * nw), bend = (nw - 0.5) * 1.4 * t;
        c = Math.max(c, (1 - smooth(halfw - 0.3, halfw + 0.12 + 0.35 * nz, Math.abs(v - bend))) * lead);
      } else c = Math.max(c, 1 - smooth(0.45, 0.8 + 0.4 * nz, Math.hypot(u * 1.2, v)));                  // a cushion on the side the current comes from
      const o = j * W + i; cov[o] = Math.max(cov[o], c * k);
    }
  };
  let q = 77; const rnd = () => (q = (q * 16807) % 2147483647) / 2147483647;
  await rest();
  for (const t of plan.trees.trees) stamp(t.s, t.d, 0.3, 3 + rnd() * 5.5, 0.86 + rnd() * 0.14);
  await rest();
  for (const t of plan.trees.far) stamp(t.s, t.d, 0.3, 2 + rnd() * 3, 0.9);
  for (const [ps, pd] of plan.tree.props) stamp(ps, pd, 0.2, 1.4 + rnd() * 2.2, 0.9);
  for (const t of plan.trees.trees) if (t.low) stamp(t.s, t.d + (t.d > 0 ? -4.6 : 4.6), 0.15, 1.2 + rnd() * 2, 0.86);
  for (const [ps, pd] of [plan.left.crate, plan.left.handcart.at, plan.tree.arch.daughter.at, [89, 4], [114, -25.5]]) stamp(ps, pd, 0.45, 2 + rnd() * 2, 0.92);
  for (let ps = plan.left.plankWalk.from; ps < plan.left.plankWalk.to; ps += 3) stamp(ps, plan.left.plankWalk.d, 0.2, 0.9 + rnd() * 1.4, 0.8);      // the walk's trestles
  // ---- inside a drift the petals lie unevenly, thinning to three fifths (far off that is what breaks a drift into touches of paint); and the picture is kept as it is, not
  // as a root (far away it is averaged, and the average of a drift must be the drift thinned, not gone); the low end,
  // where single petals lie, is dithered into its few steps
  await rest();
  const fineN = lattice(555); let dq = 12345;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const o = j * W + i, c = cov[o];
    if (c <= 0) continue;
    const f = fineN(i * 0.37, j * 0.37), ragged = c > 0.04 ? clamp01(c * (0.6 + 0.62 * f)) : c;
    dq = (dq * 16807) % 2147483647;
    // (single petals: one cell in a dozen holds a few, the rest of the open water is exactly empty, and the sheet lets it go at once)
    data[o * 4] = ragged < 0.019 ? (dq / 2147483647 < ragged / 0.0196 ? 5 : 0) : Math.min(255, Math.floor(255 * ragged + dq / 2147483647));
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  // (anisotropy: the map is looked at from an eye 1.1 m up, nearly edge-on; without it a far drift is averaged away
  // along the line of sight AND across it, and every edge is lost)
  tex.colorSpace = THREE.NoColorSpace; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true; tex.anisotropy = 8; tex.needsUpdate = true;
  let sum = 0; for (let o = 0; o < W * H; o++) sum += cov[o];
  return { tex, rect: [(x0 + x1) / 2, (z0 + z1) / 2, W * cell, H * cell], width: W, height: H, mean: sum / (W * H) };
}

export async function build(ctx, plan, shared) {
  const { THREE, kit, engine } = ctx;
  const AF = plan.light.afterglow, BL = plan.light.blue;
  const col = (c) => new THREE.Color(c);
  // (developer) &af=key:value,...  &bl=...  &pt=...  &wa=...  &wb=...: for this page only, override top-level colours and
  // numbers of plan.light.afterglow / plan.light.blue / plan.water.petals / plan.water.afterglow / plan.water.blue
  // (colours as %23rrggbb), to try a light or a water without editing plan.js under the others' pictures
  for (const [qs, obj] of [['af', AF], ['bl', BL], ['pt', plan.water.petals], ['wa', plan.water.afterglow], ['wb', plan.water.blue]]) for (const kv of (Q.get(qs) || '').split(',')) { const i = kv.indexOf(':'); if (i > 0) { const v = decodeURIComponent(kv.slice(i + 1)); obj[kv.slice(0, i)] = /^#/.test(v) ? v : v.includes('|') ? v.split('|').map(Number) : +v; } }      // (a list of numbers as a|b|c)
  // (the display is neutral: a colour is seen as it is typed. These two are kept as names for whoever calls them.)
  shared.seen = (hex) => col(hex); shared.seenBlue = (hex) => col(hex);
  // developer's switch &w=key:value,... overrides keys of the water's look in every light state (numbers, or colours as %23rrggbb)
  const wOver = {}; for (const kv of (Q.get('w') || '').split(',')) { const i = kv.indexOf(':'); if (i > 0) { const v = kv.slice(i + 1); wOver[kv.slice(0, i)] = /^#|^%23/.test(v) ? decodeURIComponent(v) : +v; } }

  // ---------------------------------------------------------------------------------------------- the page's frame
  const F = shared.frame = {
    /** The page's (s, d, y) as a Vector3 in the realm. Use this, not kit.at: the path leaves the page's frame at the pond. */
    at: (s, d = 0, y = 0, target = new THREE.Vector3()) => { const p = plan.xz(s, d); return target.set(p[0], y, p[1]); },
    heading: plan.heading, face: plan.face, locate: plan.locate,
    /** The page's (s, d) as { s, d } on the engine's path (a picture's address, a `near` cue). */
    toPath: (s, d = 0) => { const p = plan.xz(s, d), l = ctx.path.locate(p[0], p[1], null, {}); return { s: l.s, d: l.d }; },
    /** The path's arc length where the composed line reaches the page's s (for stage cues). */
    pathS: (s) => F.toPath(s, plan.lineD(s)).s,
  };
  const here = shared.here = { s: 0, d: 0 };                 // the boat in the page's frame, kept up to date every frame
  {                                                          // the table in plan.js must stay true to the built path
    const off = plan.pathS.map(([s, ps]) => Math.abs(F.pathS(s) - ps)), worst = Math.max(...off);
    if (worst > 1.5) console.error(`INVALID_PLAN orchard: PATH_S in plan.js is ${worst.toFixed(1)} m off the built path (${plan.pathS.map(([s]) => `[${s}, ${F.pathS(s).toFixed(1)}]`).join(', ')})`);
  }

  // ---------------------------------------------------------------------------------------------- THE LIGHT ON THE PAINT
  // The gouache ramp runs shadow -> the thing's own colour -> lit, and an upright face shows its own colour at full
  // strength whatever the hour. In this orchard nothing is lit that brightly: the sky is the lamp and it is going out.
  // So the hour is put on the paint. shared.dusk is an extension that EVERY material of the area wears:
  //   - PAINT IS THE COLOUR A THING SHOWS on an upright face in the open afterglow (white above, lilac below, as the
  //     page asks of blossom). Pale paint (blossom, limewash, anything lighter than a mid grey) is then multiplied by the
  //     hour's air: `uAir` under the last light's line, `uAirHigh` above it; the engine's ramp darkens faces turned to
  //     the water and lightens faces turned to the sky;
  //   - dark paint (boughs, bark, timber, the stag) keeps its own colour: every silhouette stays dark plum, never black;
  //   - LAST LIGHT: above a line (9.5 to 16 m in the afterglow, climbing as the dusk goes) what faces the sky is
  //     warmed. The avenue's trees stand under the line, in blue shade; the oldest tree's dome stands in the light;
  //   - a thin rim of the band's apricot on what is seen against the band;
  //   - lamp light is not dimmed: inside the prow lantern's reach or the kept lamp's a thing shows its true colour.
  // USE: shared.mat.*, or shared.paint({...}), or kit.model(url, { extend: shared.dusk }) (a list works: [shared.dusk, yours]).
  // Two names, two things: shared.dusk is this extension and never changes; shared.hour is the NUMBER, how far the
  // dusk has gone (0 afterglow .. 1 blue hour), written every frame below. It advances only with travel.
  shared.hour = 0;
  const white = col(plan.chip.white);
  const lastOn = Q.get('lastlight') !== '0';
  const airA = col(AF.shade), airB = col(BL.shade), highA = col(AF.high), highB = col(BL.high);
  const U = {
    uAir: { value: airA.clone() }, uAirHigh: { value: highA.clone() },
    uDark: { value: new THREE.Vector4(1, 1, 1, AF.dark) },               // rgb: what dark paint keeps on a face turned from the light; a: how much of dark paint shows at all
    uLast: { value: new THREE.Vector4(0, 0, 0, AF.last.wrap) },          // rgb: the last light; a: how far it wraps round to faces turned west
    uLastLine: { value: new THREE.Vector2(AF.last.line[0], AF.last.line[1]) },
    uRimC: { value: new THREE.Color(0, 0, 0) },                          // (kept as a name, and kept at nothing: the rim is uRimLit now. heroes.js takes uRimC off level ground again; with this at nothing that does nothing)
    uRimLit: { value: new THREE.Color(0, 0, 0) },                        // the thin rim of the band on what stands upright against it
    // the oldest tree's vault: under its crown the sky is shut out (its place x, z; the crown's radius; the height its shade reaches), and what pale paint keeps there
    uVault: { value: new THREE.Vector4(plan.xz(plan.tree.at[0], plan.tree.at[1])[0], plan.xz(plan.tree.at[0], plan.tree.at[1])[1], plan.light.vault.radius, plan.light.vault.height) },
    uVaultShade: { value: col(AF.vault) },
    uKeep: { value: new THREE.Vector3(Q.get('keep') != null ? +Q.get('keep') : AF.mirrorKeep, plan.light.mirrorKeep[0], plan.light.mirrorKeep[1]) },      // in the water's picture: how much pale paint low over the water is given back; below this height wholly, above this not at all
    uKeepAll: { value: Q.get('keepall') != null ? +Q.get('keepall') : (AF.mirrorCrowns ?? 0) },      // (fifth pass) in the water's picture: how much ALL pale paint is given back, whatever its height (the mirror looks at the crowns from below, at their shade side: this is what lets the blossom be found in the water)
    // (seventh pass) THE MIRROR'S SPLIT TONE: in the water's picture of the world the darks of pale paint (the crowns' shade side) are multiplied by the
    // first colour and its lights by the second, between the two luminances of uMirrorSplit (x, y; z: how much of it)
    uMirrorShade: { value: new THREE.Vector3(1, 1, 1) }, uMirrorLight: { value: new THREE.Vector3(1, 1, 1) }, uMirrorSplit: { value: new THREE.Vector3(0.1, 0.3, 0) },
    uLimit: { value: Q.get('limit') === '0' ? new THREE.Vector2(1e3, 1e3 + 1) : new THREE.Vector2(plan.light.limit[0], plan.light.limit[1]) },      // lit paint is eased in from the first of these so that it never passes the second (under the bloom)
    uSkyKey: { value: new THREE.Vector3(...AF.key).normalize() },         // the way the orchard's own light travels (the sky is the lamp)
    uTop: { value: col(AF.top) }, uUnder: { value: col(AF.under) },      // what a face turned to the sky, and one turned to the water, is multiplied by
    uWest: { value: new THREE.Vector3(0, 0, -1) },                       // toward the band (the reference line runs west)
    uFogWest: { value: new THREE.Color(0, 0, 0) },                       // (second pass: a warm tint on the fog toward the band. Kept as a name; the bank took its place)
    // the afterglow's bank (BANK_GLSL above; plan.light.bank): where it begins (m west), 1 / its rise, 1 / its height, its density
    uBank: { value: new THREE.Vector4(plan.light.bank.from, 1 / plan.light.bank.rise, 1 / plan.light.bank.height, plan.light.bank.density) },
    uBankWest: { value: col(AF.bankLight.west) }, uBankSide: { value: col(AF.bankLight.side) }, uBankLobe: { value: new THREE.Vector2(plan.light.bank.lobe, 0) },
    uBankMirror: { value: new THREE.Vector3(1, 1, 1) },                  // what the band's light is multiplied by in the water's picture of the world (plan.light.bank.mirror.rgb, failing with the dusk)
    uDuskVeil: engine.shared.uVeil,
  };
  const bankOn = Q.get('bank') !== '0';                                  // (developer) &bank=0: the orchard without the afterglow's bank
  const NOTONE = [1, 1, 1, 1, 1, 1, 0.1, 0.3, 0], MT = Q.get('mtone') ? Q.get('mtone').split('|').map(Number) : null;      // (developer) &mtone=sr|sg|sb|lr|lg|lb|lo|hi|amount: the mirror's split tone
  const dusk = shared.dusk = {
    uniforms: U,
    fragmentPars: 'uniform vec3 uAir, uAirHigh, uRimC, uRimLit, uWest, uFogWest, uSkyKey, uTop, uUnder, uVaultShade; uniform vec4 uDark, uLast, uVault; uniform vec2 uLastLine, uLimit; uniform vec3 uKeep, uMirrorShade, uMirrorLight, uMirrorSplit; uniform float uDuskVeil, uKeepAll;' + BANK_GLSL,
    albedo: `vec3 ownColour = albedo;
      float duskPale = smoothstep(0.06, 0.5, max(albedo.r, max(albedo.g, albedo.b)));
      float lastHi = smoothstep(uLastLine.x, uLastLine.y, vWPos.y);
      // under the oldest tree's crown the sky is shut out: what stands there stands in the crown's own shade (dark paint a
      // little, pale paint a good deal). Not at its foot: the light of the horizon comes in under the crown's skirt and
      // off the water, so the white drum of the bole stays the palest thing under the tree, as the page asks
      float vaultIn = (1.0 - smoothstep(uVault.z * 0.7, uVault.z, length(vWPos.xz - uVault.xy))) * (1.0 - smoothstep(uVault.w * 0.45, uVault.w, vWPos.y)) * smoothstep(1.4, 3.6, vWPos.y);
      vec3 duskAir = mix(vec3(uDark.a), mix(uAir, uAirHigh, lastHi), duskPale) * mix(vec3(1.0), mix(vec3(0.86), uVaultShade, duskPale), vaultIn);
      albedo *= duskAir;`,
    light: `{ vec3 lampsAll = pointLight(uLanternPos, uLanternColor, uLanternRadius, N) + pointLight(uLampPos, uLampColor, uLampRadius, N);
      for (int i = 0; i < 8; i++) { if (i >= uLightCount) break; lampsAll += pointLight(uLights[i].xyz, uLightColors[i], uLights[i].w, N); }
      c += ownColour * (vec3(1.0) - duskAir) * lampsAll;
      // the orchard's own ramp, in place of the engine's (which stays the page's table, for the boat, the lamps and the
      // cloth): the same painted steps, about the sky's own direction
      float w2 = clamp(dot(N, -uSkyKey) * 0.5 + 0.5 + stroke * 0.10 * uBrush, 0.0, 1.0);
      { float st2 = max(uSteps, 1.0), q2 = floor(w2 * st2) / st2, f2 = fract(w2 * st2); w2 = mix(w2, q2 + smoothstep(0.42, 0.58, f2) / st2, 0.85); }
      vec3 shadeE = w < 0.5 ? mix(uRampShadow, vec3(1.0), smoothstep(0.0, 0.5, w)) : mix(vec3(1.0), uRampLight * uKeyColor, smoothstep(0.5, 1.0, w));
      vec3 underM = mix(uDark.rgb, uUnder, duskPale);
      vec3 shadeM = w2 < 0.5 ? mix(underM, vec3(1.0), smoothstep(0.0, 0.5, w2)) : mix(vec3(1.0), uTop, smoothstep(0.5, 1.0, w2));
      c += albedo * (uShade * (shadeM - shadeE) - mix(uGroundLight, uSkyLight, N.y * 0.5 + 0.5));
      float lastFace = smoothstep(-0.75, 0.45, N.y + uLast.a * max(0.0, dot(N, uWest)));
      c += ownColour * uLast.rgb * (lastHi * lastFace * (0.35 + 0.65 * duskPale));
      // (the rim is for what stands UPRIGHT against the band. Level ground seen from an eye 1.1 m up is edge-on everywhere:
      // with a rim on it the oldest tree's whole islet went orange. So nothing that faces the sky takes it)
      float rimE = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 3.0) * smoothstep(0.15, 0.8, dot(-V, uWest)) * (1.0 - smoothstep(0.1, 0.34, abs(V.y))) * (1.0 - smoothstep(0.2, 0.6, abs(N.y)));
      c += uRimLit * rimE * (0.3 + 0.7 * ownColour);
      // NOTHING THE SKY LIGHTS BLOOMS (the page: blossom, limewash and petals are luminous without it). Whatever the sky's
      // light adds up to on a pale thing (the hour, the last light, and what a module adds of its own before this), it
      // is eased in under the bloom, keeping its hue: the dome's top is a warm white, never a lamp. LAMP LIGHT IS LEFT
      // OUT OF IT, whole (a module that takes some of a lamp's light off again after this, as the drowned grass does,
      // must find all of it there); and what a thing gives off itself (glow) is added after this and is not held.
      vec3 duskLamps = ownColour * lampsAll, duskSky = c - duskLamps;
      float duskMax = max(duskSky.r, max(duskSky.g, duskSky.b));
      if (duskMax > uLimit.x) c = duskSky * ((uLimit.x + (uLimit.y - uLimit.x) * (1.0 - exp(-(duskMax - uLimit.x) / (uLimit.y - uLimit.x)))) / duskMax) + duskLamps;
      // THE WATER KEEPS THE WHITE TRUNKS. The mirror is graded deep (it must be, under this roof of blossom), and the
      // grade takes the limewash down with the crowns. So in the water's own picture of the world (the one drawn from
      // under the surface: its eye is below the water) pale paint that stands low over the water is given back most of
      // what the grade takes: the colonnade stands in the water full length, white.
      if (cameraPosition.y < 0.0) {
        c *= 1.0 + duskPale * (uKeep.x * (1.0 - smoothstep(uKeep.y, uKeep.z, vWPos.y)) + uKeepAll);
        // (seventh pass) THE MIRROR'S SPLIT TONE. Water gives a dark thing back in its own colour and a light thing in the
        // thing's: the key painting's mirrored crowns run from a petrol navy in their shade to a lilac grey in their
        // lights, where one grade for the whole mirror made them one slate. So in the water's picture the shade side of
        // pale paint leans to the water's petrol and its lights keep their lilac (plan.light.*.mirrorTone).
        float duskMl = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c *= mix(vec3(1.0), mix(uMirrorShade, uMirrorLight, smoothstep(uMirrorSplit.x, uMirrorSplit.y, duskMl)), duskPale * uMirrorSplit.z);
      } }`,
    // the afterglow's bank: whatever stands in it, or beyond it, goes into its light by how much of it lies between
    final: 'gl_FragColor.rgb = bankVeil(gl_FragColor.rgb, uCameraPos, vWPos, 1.0 - uDuskVeil);',
  };
  const topA = col(AF.top).multiplyScalar(AF.topGain || 1), topB = col(BL.top).multiplyScalar(BL.topGain || 1), underA = col(AF.under), underB = col(BL.under);
  const keyA = new THREE.Vector3(...AF.key).normalize(), keyB = new THREE.Vector3(...BL.key).normalize();

  // ---------------------------------------------------------------------------------------------- materials
  // One blossom, one wood, one timber for the whole area. (The models bring their own vertex paint and textures.)
  const uSelf = { value: white.clone().multiplyScalar(AF.blossomGlow) };
  const paint = (o) => kit.gouache({ ...o, extend: o.extend ? [dusk, ...[].concat(o.extend)] : dusk });
  shared.paint = paint;                                      // kit.gouache with the light of the hour on it
  shared.mat = {
    /** blossom masses: vertex-painted white above and lilac below; holds what light is left (self-light), lit along its edge against the band */
    blossom: paint({ color: '#f1eeee', vertexColors: true, brush: 0.9, steps: 3, shade: 1, backlight: 0.3, backColor: plan.chip.apricot,
      extend: { uniforms: { uSelf }, fragmentPars: 'uniform vec3 uSelf;', light: 'glow += uSelf * (0.55 + 0.45 * ownColour) * (0.3 + 0.7 * smoothstep(-0.7, 0.35, N.y));' } }),      // (less from its undersides: they are the dark of the crown)
    /** trunks, boughs and timber: vertex paint carries limewash, bark and the dark plum of everything above the wash line. Limewash holds the light as blossom does; bark and timber do not */
    wood: paint({ color: '#ffffff', vertexColors: true, brush: 0.85, shade: 1,
      extend: { uniforms: { uSelf }, fragmentPars: 'uniform vec3 uSelf;', light: 'glow += uSelf * 0.9 * smoothstep(0.45, 0.8, min(ownColour.r, min(ownColour.g, ownColour.b)));' } }),
    plum: paint({ color: plan.chip.plum, brush: 0.6 }),
    timber: paint({ color: '#5d5058', brush: 0.9 }),
    stone: paint({ color: plan.chip.stone, brush: 0.9 }),
    grass: paint({ color: '#1f3b38', brush: 0.6 }),
    bed: paint({ color: '#1d4a52', brush: 0.6, shade: 0.4 }),
  };
  shared.blossomSelf = uSelf;
  /** for any pale thing that should hold the light as blossom does: shared.paint({ color, extend: shared.holdsLight }) */
  shared.holdsLight = { uniforms: { uSelf }, fragmentPars: 'uniform vec3 uSelf;', light: 'glow += uSelf * (0.55 + 0.45 * ownColour);' };

  // ---------------------------------------------------------------------------------------------- THE SKY
  // The painting (source-art/orchard/sky.png) was painted as a view: a low band of apricot with long level bars of cloud
  // over it. Wrapped round the rider as a cylinder its bars became rings that bowed across the avenue and closed in a
  // target overhead. So it is shown as what it is: in the WEST as a flat picture (a far bar of cloud is a straight
  // line), about 100 degrees wide, its band of apricot standing 8 degrees high (over the far windbreak, which is 5 to
  // 7 degrees) and its bars pressed into thin slivers from 8 to 13 degrees; round the EAST only its lowest part, wrapped (the dusty
  // rose over the blue earth-shadow, the chimney); and everywhere else, and above, a gradient taken from the painting's
  // own column, carrying the painting's brush marks. As the dusk goes the picture sinks and dims to a thread.
  const pano = SKY_ART && Q.get('sky') !== 'plain' ? await ctx.tex(SKY_ART.url) : null;
  if (pano) { pano.wrapS = THREE.RepeatWrapping; pano.wrapT = THREE.ClampToEdgeWrapping; pano.needsUpdate = true; }
  const gradient = (stops) => {
    const n = 256, d = new Uint8Array(n * 4), cs = stops.map(([e, h]) => [e, col(h).convertLinearToSRGB()]);
    for (let i = 0; i < n; i++) {
      const e = -10 + 100 * i / (n - 1); let k = 0; while (k < cs.length - 2 && e > cs[k + 1][0]) k++;
      const t = smooth(cs[k][0], cs[k + 1][0], e) * 0.5 + clamp01((e - cs[k][0]) / (cs[k + 1][0] - cs[k][0])) * 0.5, a = cs[k][1], b = cs[k + 1][1];
      d.set([Math.round(255 * (a.r + (b.r - a.r) * t)), Math.round(255 * (a.g + (b.g - a.g) * t)), Math.round(255 * (a.b + (b.b - a.b) * t)), 255], i * 4);
    }
    const t = new THREE.DataTexture(d, n, 1, THREE.RGBAFormat); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = t.magFilter = THREE.LinearFilter; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = false; t.needsUpdate = true;
    return t;
  };
  const gradA = gradient(AF.sky.stops), gradB = gradient(BL.sky.stops);
  ctx.onDispose(() => { gradA.dispose(); gradB.dispose(); });
  const aspect = pano && pano.image && pano.image.width ? pano.image.width / pano.image.height : 2.88;
  const skyU = {
    uVeil: engine.shared.uVeil, uVeilColor: engine.shared.uVeilColor,
    tPano: { value: pano }, tGradA: { value: gradA }, tGradB: { value: gradB }, uHour: { value: 0 }, uPanoGlow: { value: AF.sky.panoramaGlow },
    // the west as a picture: how much of its width a unit of tangent takes, the same for its height, where its horizon and its west are
    uWin: { value: new THREE.Vector4(0.25, 0.6, 0.0375, 0.5 + (SKY_ART ? SKY_ART.rotation : 0) / (Math.PI * 2)) },
    uKnee: { value: new THREE.Vector2(0.1375, 1.5) },             // above this tangent (the band's top, 7.8 degrees) the picture is pressed together by this much
    uBand: { value: new THREE.Vector2(Math.atanh(Math.sin((SKY_ART ? SKY_ART.band : -4.68) * Math.PI / 180)), Math.PI * 2 / aspect) },      // the wrapped (east) part: Mercator foot and height
    uSink: { value: 0 }, uThread: { value: col(plan.chip.apricot) }, uThreadGain: { value: 0 }, uDim: { value: col('#ffffff') },
    uSkyEast: { value: new THREE.Vector3(...(AF.sky.east || [1, 1, 1])) }, uSkyWest: { value: new THREE.Vector3(...(AF.sky.west || [1, 1, 1])) },      // what the sky's own colour is multiplied by toward the east and toward the west
    // kept under the names kit.sky gives its own, for anyone who drives the sky by them
    uTop: { value: col(AF.sky.top) }, uMid: { value: col(AF.sky.mid) }, uHorizon: { value: col(AF.sky.horizon) }, uBelow: { value: col(AF.sky.below) },
    // the afterglow's bank lies in front of the sky's foot
    uEye: engine.shared.uCameraPos, uWest: U.uWest, uBank: U.uBank, uBankWest: U.uBankWest, uBankSide: U.uBankSide, uBankLobe: U.uBankLobe, uBankMirror: U.uBankMirror,
  };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, defines: pano ? { PANO: '' } : {},
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); gl_Position = p.xyww; }',
    fragmentShader: /* glsl */`
      uniform sampler2D tPano, tGradA, tGradB; uniform float uHour, uPanoGlow, uVeil, uSink, uThreadGain; uniform vec3 uVeilColor, uThread, uDim, uEye, uWest, uSkyEast, uSkyWest; uniform vec4 uWin; uniform vec2 uBand, uKnee;
      ${BANK_GLSL}
      varying vec3 vDir;
      vec3 grad(float e) { float t = clamp((e + 10.0) / 100.0, 0.0, 1.0); return mix(texture2D(tGradA, vec2(t, 0.5)).rgb, texture2D(tGradB, vec2(t, 0.5)).rgb, uHour); }
      void main() {
        vec3 d = normalize(vDir);
        float e = degrees(asin(clamp(d.y, -1.0, 1.0)));
        vec3 c = grad(e);
        // (fourth pass) the sky is not one colour all round: over the afterglow it is a little lighter and greener,
        // toward the east deeper and bluer (the earth's shadow is rising there); nothing at the zenith, so no seam
        c *= mix(vec3(1.0), mix(uSkyEast, uSkyWest, 0.5 - 0.5 * d.z / max(1e-4, length(d.xz))), 1.0 - smoothstep(30.0, 86.0, e));
        #ifdef PANO
          float az = atan(d.x, -d.z);                                    // 0 = west (ahead), positive to the right
          // ---- the painting's brush marks on the plain sky: its upper half, wrapped low down and laid flat overhead
          vec2 uc = vec2(az / 6.2831853 + uWin.w, 0.5 + 0.45 * clamp(e / 60.0, 0.0, 1.0)), up = d.xz * 0.21 + vec2(uWin.w, 0.72);
          float flat_ = smoothstep(38.0, 62.0, e);
          vec2 ud = mix(uc, up, flat_);
          vec2 gx = dFdx(up), gy = dFdy(up);
          vec3 fineC = mix(textureGrad(tPano, uc, gx, gy).rgb, textureGrad(tPano, up, gx, gy).rgb, flat_), broad = mix(textureGrad(tPano, uc, gx * 24.0, gy * 24.0).rgb, textureGrad(tPano, up, gx * 24.0, gy * 24.0).rgb, flat_);
          c *= mix(vec3(1.0), clamp(fineC / max(broad, vec3(0.004)), 0.82, 1.22), 0.85 * smoothstep(2.0, 9.0, e));
          // ---- the west, as a flat picture
          float fz = -d.z;
          if (fz > 0.03) {
            vec2 g = d.xy / fz;
            float gyv = g.y + uSink;
            vec2 uv = vec2(uWin.w + uWin.x * g.x, uWin.z + (gyv < uKnee.x ? uWin.y * gyv : uWin.y * uKnee.x + uKnee.y * (gyv - uKnee.x)));
            float top = mix(0.36, 0.13, uHour);
            float m = (1.0 - smoothstep(0.25, 0.4, abs(uv.x - uWin.w))) * (1.0 - smoothstep(top, top + 0.16, uv.y)) * smoothstep(0.03, 0.3, fz) * step(0.0, uv.y);
            if (m > 0.002) { vec3 p = texture2D(tPano, uv, 1.6 * smoothstep(uKnee.x * 0.7, uKnee.x * 1.3, gyv)).rgb * uPanoGlow * uDim; c = mix(c, p, m); }      // (the bars a little soft: slivers of cloud, not stripes)
          }
          // ---- round the east: only the painting's foot, wrapped (the rose over the earth-shadow, the far hills, the chimney)
          float back = smoothstep(1.75, 2.3, abs(az));
          if (back > 0.002) {
            float ua = az / 6.2831853, ub = fract(ua);
            float v = (0.5 * log((1.0 + d.y) / max(1e-5, 1.0 - d.y)) - uBand.x) / uBand.y + uSink * 0.5;
            vec2 uvA = vec2(ua + uWin.w, v), uvB = vec2(ub + uWin.w, v);
            vec2 ax = dFdx(uvA), ay = dFdy(uvA), bx = dFdx(uvB), by = dFdy(uvB);
            if (dot(bx, bx) + dot(by, by) < dot(ax, ax) + dot(ay, ay)) { ax = bx; ay = by; }
            float m = back * (1.0 - smoothstep(0.15, 0.27, v)) * step(0.0, v);
            if (m > 0.002) c = mix(c, textureGrad(tPano, uvA, ax, ay).rgb * mix(1.0, uPanoGlow, 0.5) * uDim, m);
          }
        #endif
        // ---- the thread the band has sunk to at blue hour
        float west = smoothstep(-0.1, 0.95, -d.z / max(1e-4, length(d.xz)));
        c += uThread * (smoothstep(-0.6, 0.3, e) * (1.0 - smoothstep(0.4, 2.6, e)) * west * uThreadGain);
        // ---- the afterglow's bank, in front of the sky's foot
        c = mix(c, bankColour(d), 1.0 - exp(-bankDepth(uEye, d, 4000.0)));
        gl_FragColor = vec4(mix(c, uVeilColor, uVeil), 1.0);
      }`,
  }));
  sky.name = 'sky'; sky.renderOrder = -1000; sky.frustumCulled = false; ctx.add(sky);
  shared.sky = sky;
  { const k0 = kit.sky({ top: AF.sky.top, mid: AF.sky.mid, horizon: AF.sky.horizon, below: AF.sky.below, midAt: AF.sky.midAt }); k0.visible = false; k0.name = 'sky (the kit\'s, unseen: it only tells the kit\'s mist the tone low in the sky)'; }

  // ---------------------------------------------------------------------------------------------- the first stars
  // About 40, large and soft, most of them east and overhead: the first stars of a dusk, never a star field. None in
  // the afterglow; the first nine come out one per 8 m of travel from s 96, the rest by the blue hour.
  const stars = (() => {
    const S = plan.light.stars, n = S.count, rnd = ctx.rng(96), pos = new Float32Array(n * 3), aux = new Float32Array(n * 4);
    // the first nine are placed: over the lane ahead where the rider is looking, then east; two stand in each of the
    // oldest tree's sky windows as they are seen in the look back from s 172 (heroes.js keeps those windows clear)
    const placed = [[-12, 58], [20, 66], [172, 44], [-164, 36], [8, 47], [150, 62], [-30, 74], [-172.5, 23.5], [171, 21.5], [-169, 20.5], [174.5, 25], [-176, 30], [178, 33]];
    for (let i = 0; i < n; i++) {
      let az, el;                                              // azimuth: degrees from west (ahead) toward north; elevation
      if (i < placed.length) [az, el] = placed[i];
      else { el = 24 + 60 * Math.pow(rnd(), 0.8); az = rnd() < 0.72 ? 180 + (rnd() - 0.5) * 170 : (rnd() - 0.5) * 360; if (Math.abs(az) < 60 && el < 46) el = 46 + rnd() * 30; }
      const a = az * Math.PI / 180, e = el * Math.PI / 180;
      pos.set([Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)], i * 3);
      const outAt = i < S.first ? S.firstAt + S.every * i : 162 + (i - S.first) * (26 / (n - S.first));
      aux.set([i < placed.length ? 1.25 + 0.5 * rnd() : 0.7 + rnd() * 0.9, rnd() * 6.283, 0.55 + 0.45 * rnd(), outAt], i * 4);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aAux', new THREE.BufferAttribute(aux, 4));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: engine.shared.uTime, uVeil: engine.shared.uVeil, uS: { value: 0 }, uIntensity: { value: 1 }, uTwinkle: { value: S.twinkle }, uPixel: { value: 1 } },
      transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: `attribute vec4 aAux; uniform float uTime, uS, uTwinkle, uPixel; varying float vA;
        void main() { vec4 p = projectionMatrix * viewMatrix * vec4(position * 900.0 + cameraPosition, 1.0); gl_Position = p.xyww;
          float tw = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * (0.5 + aAux.z) + aAux.y));
          vA = tw * aAux.z * smoothstep(aAux.w, aAux.w + 5.0, uS);          // each comes out over five metres of travel
          gl_PointSize = max(2.0, 10.0 * aAux.x * uPixel); }`,
      fragmentShader: `uniform float uVeil, uIntensity; varying float vA;
        void main() { float r = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.0, r); a = a * a * a * 0.5 + smoothstep(0.34, 0.0, r); gl_FragColor = vec4(vec3(0.86, 0.93, 1.0) * uIntensity * a * vA * (1.0 - uVeil), 1.0); }`,
    });
    const pts = new THREE.Points(geo, mat); pts.name = 'first stars'; pts.frustumCulled = false; pts.renderOrder = -999;
    pts.onBeforeRender = (renderer) => { const rt = renderer.getRenderTarget(); mat.uniforms.uPixel.value = (rt ? rt.height : renderer.getDrawingBufferSize(new THREE.Vector2()).y) / 900; mat.uniformsNeedUpdate = true; };
    ctx.add(pts);
    return mat;
  })();

  // ---------------------------------------------------------------------------------------------- the far painted rails
  // Planes 5 and 6 of the vista and the meadow's edge: painted, further than 150 m from any water the boat can reach,
  // on curved rails about (s 170, d 0), 200 degrees of arc centred on the west. They darken with the dusk.
  const rails = [];
  if (FAR_ART) {
    const tex = await ctx.tex(FAR_ART.url);
    const centre = F.at(plan.backdrops.about[0], plan.backdrops.about[1]), half = plan.backdrops.arc / 2 * Math.PI / 180;
    for (const band of FAR_ART.bands) {
      // One strip of scenery per rail (one draw). The picture is walked along the rail there and back again (mirrored at
      // each end, so there is no seam), in its true proportions: `metres` of country to its width.
      const R = band.radius, total = R * half * 2, passes = [];           // passes: [u from, u to] laid left (south-west) to right
      if (band.once) {
        // the stretch with the barn once, where it is wanted; the rest of the picture there and back on either hand
        const [b0, b1] = band.once.u, mid = total / 2 + band.once.at * Math.PI / 180 * R, w = band.metres;
        let x = mid - (b0 + b1) / 2 * w;                                    // where u = 0 of the whole pass falls
        const left = []; let lx = x, flip = false;
        while (lx > 0) { left.unshift(flip ? [b1, 1] : [1, b1]); lx -= (1 - b1) * w; flip = !flip; }
        passes.push(...left, [0, 1]);
        let rx = x + w; flip = false;
        while (rx < total) { passes.push(flip ? [b1, 1] : [1, b1]); rx += (1 - b1) * w; flip = !flip; }
        passes.offset = lx;                                                 // metres along the rail where the first pass begins (at or before 0)
      } else { let x = 0, flip = false; while (x < total) { passes.push(flip ? [1, 0] : [0, 1]); x += band.metres; flip = !flip; } passes.offset = 0; }
      const pos = [], uv = [], idx = [];
      let x = passes.offset;
      for (const [u0, u1] of passes) {
        const len = Math.abs(u1 - u0) * band.metres, n = Math.max(2, Math.ceil(len / 14));
        for (let i = 0; i <= n; i++) {
          const m = x + len * i / n, a = -half + Math.min(total, Math.max(0, m)) / R, u = u0 + (u1 - u0) * i / n, base = pos.length / 3;
          const px = centre.x + Math.sin(a) * R, pz = centre.z - Math.cos(a) * R;
          pos.push(px, band.foot, pz, px, band.foot + band.height, pz); uv.push(u, 0, u, 1);
          if (i < n) idx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
        }
        x += len;
      }
      // (a material of the set's own, not kit.flat's: a soft painted layer that takes a fifth of the fog, the veil between
      // areas, and the afterglow's bank, which lies in front of it)
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeBoundingSphere();
      const flat = new THREE.Mesh(geo, new THREE.ShaderMaterial({
        uniforms: { map: { value: tex }, uTint: { value: col('#ffffff') }, uV: { value: new THREE.Vector2(band.v[0], band.v[1]) }, uFogAmount: { value: 0.2 },
          uFogColor: engine.shared.uFogColor, uFogDensity: engine.shared.uFogDensity, uVeil: engine.shared.uVeil, uVeilColor: engine.shared.uVeilColor, uEye: engine.shared.uCameraPos,
          uWest: U.uWest, uBank: U.uBank, uBankWest: U.uBankWest, uBankSide: U.uBankSide, uBankLobe: U.uBankLobe, uBankMirror: U.uBankMirror },
        side: THREE.DoubleSide, transparent: true, depthWrite: false, forceSinglePass: true, fog: false,
        vertexShader: 'varying vec2 vUv; varying vec3 vW; void main() { vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
        fragmentShader: /* glsl */`
          uniform sampler2D map; uniform vec3 uTint, uFogColor, uVeilColor, uEye, uWest; uniform vec2 uV; uniform float uFogDensity, uVeil, uFogAmount;
          ${BANK_GLSL}
          varying vec2 vUv; varying vec3 vW;
          void main() {
            vec4 t = texture2D(map, vec2(vUv.x, mix(uV.x, uV.y, vUv.y)));
            if (t.a < 0.004) discard;
            float dist = distance(vW, uEye);
            vec3 c = mix(t.rgb * uTint, uFogColor, (1.0 - exp(-uFogDensity * uFogDensity * dist * dist)) * uFogAmount);
            c = bankVeil(c, uEye, vW, 1.0);
            gl_FragColor = vec4(mix(c, uVeilColor, uVeil), t.a);
          }`,
      }));
      flat.frustumCulled = false; flat.renderOrder = 2; flat.name = 'far rail: ' + band.name; ctx.add(flat);
      rails.push(flat);
    }
  }
  const railFrom = col(AF.backdropTint), railTo = col(BL.backdropTint);

  // ---------------------------------------------------------------------------------------------- the bed
  // A metre down, dim and teal: the drowned meadow (its texture, `bed`, is the kit's). Every tree stands on its own
  // planting mound, 2.6 m across with its top 0.25 m under the surface.
  {
    // (the drowned meadow, until the kit's `bed` texture: grass combed one way by the water, darker hollows, and drifts of
    // sunken petals lying pale in them, drawn in the paint)
    const meadow = paint({ color: '#1d4a52', brush: 0.6, shade: 0.4, extend: {
      fragmentPars: 'float bedH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float bedN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(bedH(i), bedH(i + vec2(1.0, 0.0)), f.x), mix(bedH(i + vec2(0.0, 1.0)), bedH(i + vec2(1.0, 1.0)), f.x), f.y); }',
      albedo: `{ vec2 bp = vWPos.xz; float comb = bedN(vec2(bp.x * 9.0, bp.y * 0.7)) * 0.6 + bedN(vec2(bp.x * 21.0 + 3.0, bp.y * 1.3)) * 0.4;
        float lie = bedN(bp * 0.45 + 7.0) * 0.6 + bedN(bp * 1.3) * 0.4;
        albedo *= 0.62 + 0.7 * comb * (0.5 + 0.5 * lie);
        float drift = smoothstep(0.58, 0.72, lie) * (0.45 + 0.55 * bedN(bp * 6.0));
        albedo = mix(albedo, vec3(0.42, 0.5, 0.58), drift * 0.75); }`,
    } });
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), meadow);
    bed.rotation.x = -Math.PI / 2; bed.position.set(10, plan.water.bed, -150); bed.name = 'bed'; ctx.add(bed);
    const mound = new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const M = plan.water.mound, list = [];
    for (const t of [...plan.trees.trees, ...plan.trees.far]) list.push({ position: [t.x, plan.water.bed, t.z], scale: [M.across / 2 * 1.25, M.top - plan.water.bed, M.across / 2 * 1.25] });
    kit.instances(mound, shared.mat.bed, list).name = 'planting mounds';
  }

  // ---------------------------------------------------------------------------------------------- THE AIR: mist in layers
  // kit.mist's cards, set out in the page's frame (its own placing follows the engine's path, which is not the grid's).
  // Layers, each at its own distance and height, so that the orchard recedes in steps of air:
  //   in the side aisles from 25 m out (lilac); creeping in to the avenue's edges at blue hour; in the second avenue a
  //   low bank and a thin sheet lying on the water, at blue hour only; and beyond the wall, lilac mist paler than anything
  //   behind (our half of the passage out).
  // THIRD PASS: in the afterglow THE FIRST AVENUE AND THE POND ARE CLEAR AIR. The second pass laid a sheet of mist down the
  // lane and across the pond, and it hid the oldest tree's white drum from the reveal. And the low bank lit apricot in
  // the second avenue is no longer cards: it is the afterglow's bank (BANK_GLSL, above), which veils what stands in it
  // and leaves what stands in front of it sharp. Cards cannot do that.
  const mistAt = (opts, places) => {
    const m = kit.mist({ ...opts, count: places.length });
    const a = m.geometry.attributes.aOffset, n = Math.min(a.count, places.length);
    for (let i = 0; i < n; i++) { const [s, d, y, size] = places[Math.floor(i * places.length / n)], p = plan.xz(s, d); a.setXYZW(i, p[0], y, p[1], size); }
    a.needsUpdate = true; m.userData.opacity0 = m.material.uniforms.uOpacity.value / Math.max(1e-4, opts.opacity);
    return m;
  };
  const rm = ctx.rng(216);
  const sideMist = mistAt({ color: AF.mist.color, opacity: AF.mist.opacity, drift: 0.15, seed: 5 },
    Array.from({ length: 64 }, (_, i) => [28 + rm() * 196, (i % 2 ? 1 : -1) * (25 + rm() * 58), 0.6 + rm() * 2.6, 20 + rm() * 16]));
  const creepMist = mistAt({ color: BL.mist.color, opacity: BL.mist.opacity, drift: 0.12, seed: 6 },                 // creeping in to the avenue's edges at blue hour
    Array.from({ length: 30 }, (_, i) => [118 + rm() * 100, (i % 2 ? 1 : -1) * (11 + rm() * 14), 0.5 + rm() * 1.6, 15 + rm() * 10]));
  const bankMist = mistAt({ color: AF.mist.bank.color, opacity: AF.mist.bank.opacity, drift: 0.1, seed: 7 },         // the low bank lit apricot in the second avenue, seen under the great crown
    Array.from({ length: 22 }, () => [140 + rm() * 70, (rm() * 2 - 1) * 22, 0.5 + rm() * 1.5, 22 + rm() * 14]));
  const gapMist = mistAt({ color: plan.chip.lilac, opacity: 0.3, drift: 0.2, seed: 8 },                              // beyond the wall: lilac mist, paler than anything behind (our half of the passage out)
    Array.from({ length: 34 }, () => [219 + rm() * 34, (rm() * 2 - 1) * 46, 0.8 + rm() * 4.5, 22 + rm() * 18]));
  const laneMist = mistAt({ color: '#7d93a8', opacity: 0.10, drift: 0.06, seed: 9 },                                 // a thin sheet on the water far down the lane and across the pond: the trunks' feet soften with distance
    Array.from({ length: 26 }, () => [138 + rm() * 76, (rm() * 2 - 1) * 16, 0.35 + rm() * 0.5, 16 + rm() * 10]));
  const mistU = (m) => m.material.uniforms;
  const gapLilac = col(plan.chip.lilac), gapTone = col(plan.chip.lilac).multiplyScalar((plan.light.mistOnWater.gap || {}).tone ?? 0.9);
  const mistA = col(AF.mist.color), mistB = col(BL.mist.color), bankA = col(AF.mist.bank.color), bankB = col(BL.mist.bank.color), laneA = col('#7d93a8'), laneB = col('#3f5580');
  mistU(creepMist).uColor.value.copy(mistB); mistU(gapMist).uColor.value.copy(col(plan.chip.lilac));

  // ---------------------------------------------------------------------------------------------- the light states
  const WA = plan.water.afterglow, WB = plan.water.blue, MI = plan.light.mist || { from: 1e9, to: 1e9 + 1, look: {}, water: {} };
  const waterOf = (w) => ({ ...w, absorb: plan.water.lookIn.tint, clarity: plan.water.lookIn.clarity, ...wOver });
  const L = ctx.lookStates({
    afterglow: { look: { ...AF.look }, water: waterOf(WA) },
    blue: { look: { ...BL.look }, water: waterOf(WB) },
    // (inside the loft the water lies under a roof: its body is night, not the open orchard's teal)
    loft: { look: { ...AF.look, exposure: plan.light.loft.exposure }, water: waterOf({ ...WA, ...plan.water.loft }) },
    // (beyond the wall: the way out, in lilac mist. plan.light.mist)
    mist: { look: { ...BL.look, ...MI.look }, water: waterOf({ ...WB, ...MI.water }) },
  });
  shared.light = L;
  const held = Q.has('dusk') ? clamp01(+Q.get('dusk')) : null;                     // &dusk=0..1: hold the dusk (for looking at a light state anywhere)

  // ---------------------------------------------------------------------------------------------- THE PETALS ON THE WATER
  // The water's own skin (docs/water.md) is one picture repeated wall to wall and opened by the trace; it has no
  // standing cover, and it thins by fading, not petal by petal. So the petals are laid by this module instead: one
  // sheet just over the water, drawn after it, that shows the tile above petal by petal against the standing map above.
  // It reads the water's own trace and ripples: whatever opens the water (the hull, and the cast with
  // ctx.water.trace.line(...), exactly as for the engine's skin) parts these petals, whole petals leaving one by one
  // and coming back as the lane closes; a ring passing under a drift moves it and tilts it to the light.
  // The engine's skin stays switched on at almost nothing (orchard.js: skin.amount), which is what keeps the trace laid
  // and the hull writing its lane. shared.skin is the handle, with the names the first pass gave it.
  const tile = PETALS_ART ? await ctx.tex(PETALS_ART.url, { repeat: true, data: true }) : await petalTile(THREE);
  const cover = await coverMap(THREE, plan);
  if (Q.has('covermap')) {                                       // (developer) the standing map, seen from above, to .shots/orchard_cover.png: west is up, white = the thickest drift
    const cv = document.createElement('canvas'); cv.width = cover.width; cv.height = cover.height;
    const g2 = cv.getContext('2d'), im = g2.createImageData(cover.width, cover.height), src = cover.tex.image.data;
    for (let i = 0; i < cover.width * cover.height; i++) { const c = src[i * 4] / 255, lane = src[i * 4 + 1] < 40 ? 0.35 : 0, v = Math.round(255 * c * c); im.data.set([Math.max(v, lane * 255 * 0.3), Math.max(v, lane * 120), Math.min(255, v + src[i * 4 + 3] * 0.12 + 20), 255], i * 4); }
    g2.putImageData(im, 0, 0); cv.toBlob((b) => fetch('/__shot/orchard_cover.png', { method: 'POST', body: b }).catch(() => {}));
  }
  const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 0]), 1, 1, THREE.RGBAFormat); blank.needsUpdate = true;
  ctx.onDispose(() => { if (!PETALS_ART) tile.dispose(); cover.tex.dispose(); blank.dispose(); });
  for (const name of L.names) L.state(name).water.skin.map = blank;
  ctx.waterLook.skin.map = blank;
  const ES = engine.shared;
  if (!ES.tRipple) ES.tRipple = { value: null }; if (!ES.uRippleRect) ES.uRippleRect = { value: new THREE.Vector4(0, 0, 64, 64) };
  if (!ES.tTrace) ES.tTrace = { value: null }; if (!ES.uTraceRect) ES.uTraceRect = { value: new THREE.Vector4(0, 0, 1, 1) };
  const PT = plan.water.petals, treeAt = F.at(plan.tree.at[0], plan.tree.at[1]);
  // how open each zone stands (1 = as laid out; 0 = healed over, a crust). The great petal fall takes `pond` to about 0.2.
  const zones = { loft: 1, avenue1: 1, pond: 1, pool: 1, avenue2: 1, beyond: 1 };
  for (const kv of (Q.get('zones') || '').split(',')) { const [zn, zv] = kv.split(':'); if (zn in zones && isFinite(+zv)) zones[zn] = +zv; }      // (developer) &zones=pond:0.2,pool:0
  const petalU = {
    uTime: ES.uTime, uFogColor: ES.uFogColor, uFogDensity: ES.uFogDensity, uVeil: ES.uVeil, uCameraPos: ES.uCameraPos,
    tRipple: ES.tRipple, uRippleRect: ES.uRippleRect, tTrace: ES.tTrace, uTraceRect: ES.uTraceRect,
    uLanternPos: ES.uLanternPos, uLanternColor: ES.uLanternColor, uLanternRadius: ES.uLanternRadius, uLampPos: ES.uLampPos, uLampColor: ES.uLampColor, uLampRadius: ES.uLampRadius,
    uLights: ES.uLights, uLightColors: ES.uLightColors, uLightCount: ES.uLightCount,
    tCover: { value: cover.tex }, tPetal: { value: tile }, uRect: { value: new THREE.Vector4(...cover.rect) },
    uTile: { value: PT.tile }, uTexels: { value: (tile.image && tile.image.width) || 1024 }, uPetalPx: { value: PT.length / PT.tile * ((tile.image && tile.image.width) || 1024) },
    uTint: { value: col(PT.afterglow) }, uOwn: { value: col('#efe6ea') }, uGlance: { value: col('#000000') }, uWest: U.uWest,
    // (fourth pass) the petals' own paint, as multipliers of the tint: a petal in shade, a petal lying on its face; the
    // pale of a petal that lies alone; what a drift keeps of its colour far off, and how much of the water it hides there
    uLilac: { value: new THREE.Vector3(...(PT.lilac || [0.74, 0.77, 1.0])) }, uPink: { value: new THREE.Vector3(...(PT.pink || [1.0, 0.8, 0.85])) }, uPale: { value: col(PT.pale || '#d9d0e2') },
    uFarTone: { value: col(PT.farTone || '#ffffff') }, uFarAlpha: { value: PT.farAlpha ?? 0.84 },
    uZone: { value: [1, 1, 1, 1, 1, 1] }, uLane: { value: new THREE.Vector4(1, 0, plan.water.lane.near, plan.water.lane.far) },      // x: the lane is there; y: the boat's s (page); z, w: half healed at this far ahead .. fully open from here
    uCover: { value: +(Q.get('cover') || 1) }, uHide: { value: 0 }, uLampOn: { value: PT.lantern ?? 0.17 },
    // (seventh pass) how the far touches are laid: x: how many petal lengths to a pixel (along the view) before the next larger touch takes over;
    // y: the last level of touches (each 2.2 times the one before); z, w: how much of the drift's own wash is left under the touches, and beyond the last of them
    uFarLay: { value: new THREE.Vector4(...(Q.get('farlay') ? Q.get('farlay').split('|').map(Number) : (PT.farLay || [0.3, 2, 1, 1]))) },
  };
  const petals = new THREE.Mesh(new THREE.PlaneGeometry(cover.rect[2], cover.rect[3]), new THREE.ShaderMaterial({
    uniforms: petalU, transparent: true, depthWrite: false, depthTest: true, fog: false,
    vertexShader: /* glsl */`uniform float uHide; varying vec3 vW;
      void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mv = viewMatrix * wp; gl_Position = uHide > 0.5 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform sampler2D tCover, tPetal, tRipple, tTrace;
      uniform vec4 uRect, uRippleRect, uTraceRect, uLane; uniform vec3 uTint, uOwn, uGlance, uWest, uFogColor, uCameraPos, uLilac, uPink, uPale, uFarTone;
      uniform float uTile, uTexels, uPetalPx, uZone[6], uCover, uFogDensity, uVeil, uLampOn, uFarAlpha; uniform vec4 uFarLay;
      uniform vec3 uLanternPos, uLanternColor, uLampPos, uLampColor; uniform float uLanternRadius, uLampRadius;
      uniform vec4 uLights[8]; uniform vec3 uLightColors[8]; uniform int uLightCount;
      varying vec3 vW;
      vec4 waterRipple(vec2 xz) { vec2 uv = (xz - uRippleRect.xy) / uRippleRect.zw + 0.5, e = min(uv, 1.0 - uv); return min(e.x, e.y) > 0.0 ? texture2D(tRipple, uv) * smoothstep(0.0, 0.08, min(e.x, e.y)) : vec4(0.0); }
      // (seventh pass: the trace's lane channel, which closes in skin.close seconds, and its quick channel ('glow': orchard.js lays it with a life of plan.water.lane.quick seconds), for the small marks of living things)
      float waterOpen(vec2 xz) { vec2 uv = (xz - uTraceRect.xy) / uTraceRect.zw + 0.5, e = min(uv, 1.0 - uv); if (min(e.x, e.y) <= 0.0) return 0.0; vec4 tr = texture2D(tTrace, uv); return max(tr.a, tr.b); }
      // a lamp on a thing lying level on the water (the gouache's own falloff, so that petals and trunks agree)
      vec3 lampOn(vec3 pos, vec3 color, float radius) { vec3 d = pos - vec3(vW.x, 0.0, vW.z); float dist = length(d); float att = 1.0 - smoothstep(radius * 0.25, radius, dist); att *= att; return color * att * max(d.y / max(dist, 1e-3) * 0.6 + 0.4, 0.0); }
      float hash1(float x) { return fract(sin(x * 91.7 + 0.37) * 43758.5453); }
      void main() {
        vec2 p = vW.xz;
        // (fifth pass) HOW FAR OFF THIS PLACE IS, WORKED OUT HERE. It used to be handed down from the sheet's four corners
        // (the sheet is one quad, 136 m by 286 m) and read between them: 100 m and more everywhere, also beside the hull.
        // So every petal stood nine tenths in the fog (grey-teal in the afterglow, near black at blue hour, whatever
        // its tint), took its far tone at the bow, and never rode a ring (ripples were read only inside 46 m).
        float vDist = distance(vW, uCameraPos);
        vec4 cov = texture2D(tCover, (p - uRect.xy) / uRect.zw + 0.5);
        float C = cov.r * uCover, s = cov.b * 256.0, pond = cov.a;
        // ---- the zones (the great fall closes the pond): 1 as laid out, 0 healed over
        float z = mix(mix(mix(uZone[0], uZone[1], smoothstep(25.0, 29.0, s)), uZone[4], smoothstep(132.0, 136.0, s)), uZone[5], smoothstep(214.0, 218.0, s));
        z = mix(z, uZone[2], pond);
        C = 1.0 - (1.0 - C) * clamp(z, 0.0, 1.0);
        // (fourth pass: what this sheet costs. Most of the water in view is open: it is let go here, after the one reading
        // of the map; open water with single petals on it is let go as soon as it is too far off for a petal to be drawn;
        // and beyond eighteen metres or so a drift is drawn from the map alone, with no reading of the petals' picture.
        // The picture's slopes are taken before the first of these, because they may not be taken after a pixel is let go.)
        vec2 uv1 = p / uTile, uv2 = mat2(0.326, -0.945, 0.945, 0.326) * p / uTile + vec2(0.37, 0.61);
        vec2 dx1 = dFdx(uv1), dy1 = dFdy(uv1), dx2 = dFdx(uv2), dy2 = dFdy(uv2);
        float fw = max(length(dx1), length(dy1)) * uTexels / uPetalPx;      // petals to a pixel, along the view
        float farP = smoothstep(0.2, 0.6, fw);
        if (C < 0.0015 || (C < 0.05 && farP > 0.98)) discard;
        // ---- the lane of whoever went ahead: half healed just ahead of the bow, wide open from 70 m (it widens with
        // distance, which holds it against perspective: from the eye it is one line all the way to the lamp)
        float ahead = s - uLane.y, far = smoothstep(uLane.z, uLane.w, ahead);
        float out_ = cov.g * 4.0, half_ = mix(0.42, 0.9, far);
        float inPool = smoothstep(82.0, 85.0, s) * (1.0 - smoothstep(97.0, 100.0, s));
        float lane = (1.0 - smoothstep(half_, half_ + 0.45, out_)) * mix(0.86, 1.0, far) * smoothstep(-2.0, 1.0, ahead) * uLane.x * mix(1.0, uZone[3], inPool) * mix(1.0, clamp(z, 0.0, 1.0), pond);
        // ---- what has opened the water: the hull, a stag, a carp (the water's own trace)
        float open = waterOpen(p);
        if (C * (1.0 - smoothstep(0.55, 0.95, max(open, lane))) < 0.0015) discard;      // open water: nothing lies here
        // ---- the petals: two layings of the one tile, each petal with its own threshold (a passing ring moves them)
        vec4 rip = vDist < 46.0 ? waterRipple(p) : vec4(0.0);
        { vec2 q = rip.xy * 0.35 / uTile; uv1 += q; uv2 += mat2(0.326, -0.945, 0.945, 0.326) * q; }
        // ---- THE PETALS' PICTURE IS LAID LARGER THE FURTHER OFF IT IS. Near the eye a petal is a petal (7.5 cm). Further
        // off than a petal can be drawn the same picture is laid 2.2 times larger, and again, and again: touches of 17, 37
        // and 82 cm, each still with its own threshold and its own tone, so a drift ten or fifteen metres off is still
        // made of separate touches with edges and still thins touch by touch (the key painting's far rafts are painted so).
        // Beyond about 19 m the touches run together into the drift's own veil. Two levels are read only where one is
        // giving way to the next.
        float gone = max(open, lane), meanKeep = 1.0 - smoothstep(0.2, 0.75, gone), Cd = C * meanKeep;
        float lv = max(0.0, log2(max(fw, 1e-4) / uFarLay.x) * 0.868);      // 0: a petal; 1, 2, 3 ...: the touches (0.868 = 1 / log2(1 / 0.45))
        float n0 = min(floor(lv), uFarLay.y), fr = smoothstep(0.55, 1.0, clamp(lv - n0, 0.0, 1.0)), farV = smoothstep(uFarLay.y + 1.0, uFarLay.y + 1.6, lv);
        float k0 = pow(0.45, n0), k1 = k0 * 0.45;
        vec4 MEAN = vec4(0.8, 0.38, 0.5, 0.45);                       // (what the picture gives when it is too far off to be read: its mean)
        vec4 a = MEAN, b = MEAN, da = MEAN, db = MEAN;
        if (farV < 0.999) {
          if (fr < 0.999) { a = textureGrad(tPetal, uv1 * k0 + vec2(0.53, 0.17) * n0, dx1 * k0, dy1 * k0); b = textureGrad(tPetal, uv2 * k0 + vec2(0.11, 0.71) * n0, dx2 * k0, dy2 * k0); }
          if (fr > 0.001) { da = textureGrad(tPetal, uv1 * k1 + vec2(0.53, 0.17) * (n0 + 1.0), dx1 * k1, dy1 * k1); db = textureGrad(tPetal, uv2 * k1 + vec2(0.11, 0.71) * (n0 + 1.0), dx2 * k1, dy2 * k1); }
        }
        // each petal or touch is there if the cover is above its own threshold, and goes, one by one, where the water has been opened
        // (seventh pass: a fifth of the petals used to keep a tenth of themselves however wide the water stood open: faint pale
        // lozenges on a carp's dark back. Where the water is wide open, above about 0.75 of the trace, every petal has left whole.)
        #define THERE(X, salt) (X.a * smoothstep(X.b * 0.86, X.b * 1.14 + 0.003, C) * (1.0 - smoothstep(0.3, 0.62, gone + (hash1(X.b + salt) - 0.5) * 0.45) * mix(0.9 + 0.1 * step(0.2, hash1(X.b * 3.7 + salt)), 1.0, smoothstep(0.7, 0.85, gone))))
        float alA = mix(THERE(a, 0.0), THERE(da, 0.17), fr), alB = mix(THERE(b, 0.31), THERE(db, 0.53), fr);
        alA = mix(alA, MEAN.a * Cd, farV); alB = mix(alB, MEAN.a * Cd, farV);
        float alpha = 1.0 - (1.0 - alA) * (1.0 - alB);
        // its own paint: white, lilac in shade, the pink of a petal on its face; tilted to the light by a passing ring
        vec2 rgA = mix(a.rg, da.rg, fr), rgB = mix(b.rg, db.rg, fr);
        vec2 rg = (rgA * alA * (1.0 - alB) + rgB * alB) / max(alpha, 1e-4);
        // (fourth pass) THE FIRST PETALS TO LIE ANYWHERE ARE THE PALE ONES: a petal with one of the lowest thresholds is
        // the single petal on open water and the last petal at a drift's edge, and it is nearly white (the key painting's
        // single petals); inside a drift the same few make its scattered lights, near and far
        float loneA = mix(1.0 - smoothstep(0.0, 0.035, a.b), 1.0 - smoothstep(0.0, 0.035, da.b), fr), loneB = mix(1.0 - smoothstep(0.0, 0.035, b.b), 1.0 - smoothstep(0.0, 0.035, db.b), fr);
        float lone = (1.0 - farV) * (loneA * alA * (1.0 - alB) + loneB * alB) / max(alpha, 1e-4);
        // Under its touches a far drift has a body of its own (the petals too small and too many to be drawn): a thin wash
        // from the first touches on, the whole of the drift beyond the last. Open water stays open; what the body hides of
        // the mirror is uFarAlpha (the trunks' reflections cross a far drift faintly, as they cross the key painting's rafts).
        float farU = smoothstep(0.5, 1.5, lv);
        float solid = farU * smoothstep(0.35, 0.85, Cd) * uFarAlpha * mix(0.5 * uFarLay.z, 0.84 * uFarLay.w, farV);
        rg.r = mix(rg.r, max(rg.r, 0.66), farU);
        if (solid > alpha) { rg = mix(vec2(0.76, 0.42), rg, alpha / max(solid, 1e-4)); alpha = solid; }
        if (alpha < 0.004) discard;
        vec3 hue = rg.g < 0.5 ? mix(vec3(1.0), uLilac, rg.g * 2.0) : mix(uLilac, uPink, rg.g * 2.0 - 1.0);
        float lumi = rg.r * (1.0 + clamp(dot(rip.xy, uWest.xz) * 2.2, -0.3, 0.4)) * mix(1.0, 0.94, farP);
        // ---- its light: the hour's (the tint is the colour a white petal shows), the lamps', and toward the band a little of the band
        vec3 lamps = lampOn(uLanternPos, uLanternColor, uLanternRadius) + lampOn(uLampPos, uLampColor, uLampRadius);
        for (int i = 0; i < 8; i++) { if (i >= uLightCount) break; lamps += lampOn(uLights[i].xyz, uLightColors[i], uLights[i].w); }
        vec3 V = normalize(uCameraPos - vW);
        float glance = pow(1.0 - clamp(V.y, 0.0, 1.0), 5.0) * smoothstep(0.2, 0.9, dot(-normalize(V.xz), uWest.xz));
        // (inside the loft it is night: the petals that have drifted in over the threshold lie in the roof's dark, a pale
        // apron only as the door is neared)
        float roof = mix(0.2, 1.0, smoothstep(21.0, 27.5, s));
        vec3 c = mix(hue * uTint, uPale, lone) * lumi * roof * mix(vec3(1.0), uFarTone, smoothstep(8.0, 40.0, vDist))
               + hue * lumi * (uOwn * lamps * uLampOn + uGlance * glance * roof);
        // ---- fog and the veil, as the water under it takes them
        #ifdef FLAT_PETALS
          vec3 dbgC = c, dbgL = lamps;
        #endif
        c = mix(c, uFogColor, uVeil * uVeil * 0.9);
        c = mix(c, uFogColor, 1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist));
        #ifdef FLAT_PETALS
          c = FLAT_PETALS == 1 ? vec3(0.5) : FLAT_PETALS == 2 ? vec3(lumi) : FLAT_PETALS == 3 ? hue * uTint : FLAT_PETALS == 4 ? vec3(roof) : FLAT_PETALS == 5 ? mix(hue * uTint, uPale, lone) * lumi : FLAT_PETALS == 6 ? dbgC : FLAT_PETALS == 7 ? vec3(uVeil) : FLAT_PETALS == 8 ? vec3(1.0 - exp(-uFogDensity * uFogDensity * vDist * vDist)) : FLAT_PETALS == 9 ? dbgL * 0.1 : FLAT_PETALS == 11 ? texture2D(tTrace, (p - uTraceRect.xy) / uTraceRect.zw + 0.5).rgb : FLAT_PETALS == 12 ? vec3(texture2D(tTrace, (p - uTraceRect.xy) / uTraceRect.zw + 0.5).a) : mix(vec3(1.0), uFarTone, smoothstep(8.0, 40.0, vDist));
        #endif
        gl_FragColor = vec4(c, alpha);
      }`,
  }));
  if (Q.has('petalflat')) petals.material.defines = { FLAT_PETALS: Math.round(+Q.get('petalflat')) || 1 };      // (developer) every petal one mid grey: to tell what the display does to them from what their own light does
  petals.rotation.x = -Math.PI / 2; petals.position.set(cover.rect[0], 0.004, cover.rect[1]); petals.name = 'the petals on the water'; petals.frustumCulled = false; petals.renderOrder = -0.5;      // (straight after the water, before anyone's own transparent things)
  petals.visible = Q.get('petals') !== '0';
  // (not in the engine's picture of the scene without the water, or the water would take them for things lying beneath it)
  petals.onBeforeRender = (renderer) => { const hide = renderer.getRenderTarget() === engine.pre ? 1 : 0; if (petalU.uHide.value !== hide) { petalU.uHide.value = hide; petals.material.uniformsNeedUpdate = true; } };
  ctx.only(petals, 'direct'); ctx.add(petals);
  // ---------------------------------------------------------------------------------------------- THE AIR ON THE WATER
  // The afterglow's bank lies on the water itself, and far water in the west is seen through it (the water's own shader
  // knows only the fog). So one more sheet lies just over the surface, drawn after the water and the petals, in the
  // direct view only: nothing but the bank's veil over what is under it. In front of the bank the open water mirrors the
  // bank (the mirror draws the trees, the sky and the rails already veiled): that is the warm line on the water.
  // The same sheet carries THE MIST OF THE SIDE AISLES where it lies on the water: beyond the avenue's own corridor (from
  // `corridor` metres off the reference line) far water goes into the side mist's colour instead of the fog's teal, so
  // the trunks' feet out there stand in mist and no bright line of fogged water runs along the horizon. The corridor of
  // the avenues and the pond stays clear: the mirror there must hold the band and the trunks whole.
  const MW = plan.light.mistOnWater, bendTh = plan.bend.deg * Math.PI / 180, bendR = (plan.bend.to - plan.bend.from) / bendTh;
  // (sixth pass) And BEYOND THE WALL the same sheet takes the water into the mist of the way out. The mist there is cards
  // (gapMist), and cards cannot lie on water: the bed hides whatever of them hangs below the surface, so the mist stood
  // on the far water as on a shelf, pale over navy, with a hard line under it (postcards 9 and 9b). Now water further
  // beyond the wall's line than a few metres goes into the mist's own colour with its distance from the eye
  // (plan.light.mistOnWater.gap): from the avenue the wall stands in front of a pale nothing, water and air alike.
  const MG = MW.gap || { amount: 0, rise: 12, range: 26, tone: 0.92 }, wallTh = plan.turned(plan.left.wall.s), wallAt = plan.xz(plan.left.wall.s, 0);
  const airU = { uEye: ES.uCameraPos, uVeil: ES.uVeil, uWest: U.uWest, uBank: U.uBank, uBankWest: U.uBankWest, uBankSide: U.uBankSide, uBankLobe: U.uBankLobe, uBankMirror: U.uBankMirror,
    uFar: { value: new THREE.Vector4(MW.amount, 1 / (MW.range * MW.range), MW.corridor[0], MW.corridor[1]) }, uFarColor: { value: col(AF.mist.water) },
    // the wall's line (the way the reference line runs there, and where it crosses the wall), how much, 1 / the metres over which it comes in, 1 / range squared
    uGap: { value: new THREE.Vector4(Math.sin(wallTh), -Math.cos(wallTh), -(wallAt[0] * Math.sin(wallTh) - wallAt[1] * Math.cos(wallTh)), Q.get('gapmist') != null ? +Q.get('gapmist') : MG.amount) }, uGapK: { value: new THREE.Vector2(1 / MG.rise, 1 / (MG.range * MG.range)) }, uGapColor: { value: col(plan.chip.lilac) },
    uBend: { value: new THREE.Vector4(plan.bend.from, bendR, bendTh, 0) }, uBendC: { value: new THREE.Vector2(bendR * (1 - Math.cos(bendTh)), -plan.bend.from - bendR * Math.sin(bendTh)) }, uBendR: { value: new THREE.Vector2(Math.cos(bendTh), Math.sin(bendTh)) } };
  const air = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600), new THREE.ShaderMaterial({
    uniforms: airU, transparent: true, depthWrite: false, depthTest: true, fog: false,
    vertexShader: 'varying vec3 vW; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3 uEye, uWest, uFarColor, uGapColor; uniform float uVeil; uniform vec4 uFar, uBend, uGap; uniform vec2 uBendC, uBendR, uGapK;
      ${BANK_GLSL}
      varying vec3 vW;
      // how far a place is from the orchard's reference line (the page's d: plan.js, locate)
      float pageD(vec2 p) {
        if (p.y >= -uBend.x) return p.x;
        vec2 v = p - vec2(uBend.y, -uBend.x); float f = atan(-v.y, -v.x);
        if (f >= 0.0 && f <= uBend.z) return uBend.y - length(v);
        return dot(p - uBendC, uBendR);
      }
      void main() {
        vec3 d = vW - uEye; float len = max(length(d), 1e-3); d /= len;
        if (len < 6.0) discard;
        // (most of the water in view is neither in the bank, nor out in the side aisles, nor beyond the wall: those pixels are let go at once)
        bool inBank = max(-vW.z, -uEye.z) > uBank.x;
        float side = abs(pageD(vW.xz));
        float past = dot(vW.xz, uGap.xy) + uGap.z;                                                     // metres beyond the wall's line
        float g = past > 0.0 ? uGap.w * smoothstep(0.0, 1.0, past * uGapK.x) * (1.0 - exp(-len * len * uGapK.y)) : 0.0;      // the mist of the way out, lying on the water beyond the wall
        if (g < 0.003 && (len < 14.0 || (!inBank && side < uFar.z))) discard;
        float m = len < 14.0 ? 0.0 : uFar.x * smoothstep(uFar.z, uFar.w, side) * (1.0 - exp(-len * len * uFar.y));      // the side aisles' mist, lying on far water
        float v = inBank && len >= 14.0 ? 1.0 - exp(-bankDepth(uEye, d, len)) : 0.0;                    // the afterglow's bank, over it
        float a1 = v + (1.0 - v) * m, a = g + (1.0 - g) * a1;
        if (a < 0.003) discard;
        gl_FragColor = vec4((uGapColor * g + (bankColour(d) * v + uFarColor * (1.0 - v) * m) * (1.0 - g)) / a, a * (1.0 - uVeil));
      }`,
  }));
  air.rotation.x = -Math.PI / 2; air.position.set(0, 0.012, -130); air.name = 'the air on the water (the afterglow\'s bank, the side aisles\' mist)'; air.frustumCulled = false; air.renderOrder = -0.4;
  air.visible = Q.get('airsheet') !== '0';                     // (developer) &airsheet=0: without this sheet, to measure what it costs
  ctx.only(air, 'direct'); ctx.add(air);

  // ---------------------------------------------------------------------------------------------- THE WARM LINE ON THE WATER
  // The water keeps a darker, cooler copy of the world (it must: under a roof of pale blossom a true mirror is as pale as
  // the petals lying on it), and that grade takes the band's light down with everything else. So the band is given back
  // to the mirror: a curtain of the band's own light standing in the bank, seen ONLY in the water's picture of the
  // world. Trunks, props and the islet in front of it are still drawn in front of it there, so they stand dark in the
  // warm water; and being brighter than white in that picture, it grows the water's own long soft columns, toward the
  // boat: the warm line on the water. It follows the bank (it stands in it) and fails with it.
  const glowU = { uEye: ES.uCameraPos, uVeil: ES.uVeil, uWest: U.uWest, uBankLobe: U.uBankLobe, uGlow: { value: new THREE.Color(0, 0, 0) }, uGlowH: { value: 1 / plan.light.bank.mirror.height } };
  const glowCurtain = new THREE.Mesh(new THREE.PlaneGeometry(700, 30), new THREE.ShaderMaterial({
    uniforms: glowU, transparent: true, depthWrite: false, depthTest: true, fog: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vW; void main() { vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3 uEye, uWest, uGlow; uniform vec2 uBankLobe; uniform float uVeil, uGlowH;
      varying vec3 vW;
      void main() {
        vec3 d = normalize(vW - uEye);
        float w = pow(max(0.0, dot(normalize(d.xz + vec2(1e-5)), uWest.xz)), uBankLobe.x);
        gl_FragColor = vec4(uGlow * (w * exp(-max(vW.y, 0.0) * uGlowH) * (1.0 - uVeil)), 1.0);
      }`,
  }));
  glowCurtain.position.set(0, 15, -(plan.light.bank.from + plan.light.bank.mirror.into)); glowCurtain.name = 'the band, given back to the mirror'; glowCurtain.frustumCulled = false; glowCurtain.renderOrder = 3;
  ctx.only(glowCurtain, 'mirror'); ctx.add(glowCurtain);

  shared.skin = {
    tile, cover: cover.tex, mesh: petals, zones,
    /** (the first pass held the skin's leads open through the trace: there are none now, and all 512 lines a frame are the cast's) */
    leads: [],
    /** Ease a zone open or shut: zone 'pond' to 0.2 over 10 s is the great fall closing the pond. Zones: loft, avenue1, pond, pool, avenue2, beyond. */
    set(zone, to, seconds = 0) { if (!(zone in zones)) return; if (seconds > 0) ctx.stage.tween(zones, zone, to, seconds); else zones[zone] = to; },
    /** The lane of whoever went ahead: 1 = there, 0 = let it heal. */
    lane: 1,
    /** Lines a frame this module writes into the trace: none (only once, when a boat is set down part-way). */
    budget: 0,
  };
  shared.counts = { ...(shared.counts || {}), skin: { tileCover: tile.userData && tile.userData.cover != null ? +tile.userData.cover.toFixed(3) : null, coverMap: [cover.width, cover.height], meanCover: +cover.mean.toFixed(3), leads: 0, linesAFrame: 0 } };
  let first = true;
  const pathDoor = F.pathS(plan.left.loft.door), a2 = {}, b2 = {};
  const writeSkin = () => {
    const tr = ctx.water.trace; if (!tr || !tr.active) { first = true; return; }
    // a boat that is set down part-way (a rider coming back in; a picture taken at &s=120) has come by the lane: its own
    // wake lies open behind it, healing with distance, as if it had been carried there
    const bs = ctx.boat.s;
    if (first && bs > pathDoor + 4) for (let s = bs; s > Math.max(pathDoor, bs - 56); s -= 3.4) {
      ctx.path.at(s, a2); ctx.path.at(Math.max(pathDoor, s - 3.6), b2);
      tr.line(a2.x, a2.z, b2.x, b2.z, { radius: 1.05, strength: Math.max(0, 1 - (bs - s) / 52), soft: 0.55 });
    }
    first = false;
  };

  // &rings=<seconds> (developer): something touches the water 9 m ahead of the boat and a little to its left every so
  // many seconds, so that a ring's travel and what it does to the petals can be looked at before anything lives here
  const ringEvery = +(Q.get('rings') || 0); let ringIn = 0.4;
  // &quick=<seconds> (developer): every so many seconds a bar is written into the trace's quick channel 4.5 m ahead of the
  // boat, from 1.5 to 6 m to its left, and one into the lane channel 8 m ahead, to compare how each closes
  const quickEvery = +(Q.get('quick') || 0); let quickIn = 0.4;
  // ---------------------------------------------------------------------------------------------- every frame
  const tmp = new THREE.Color(), tmp2 = new THREE.Color(), lastA = col(AF.last.color).multiplyScalar(AF.last.gain), lastB = col(BL.last.color).multiplyScalar(BL.last.gain);
  const darkA = col(AF.darkShade), darkB = col(BL.darkShade), rimA = col(AF.rim.color).multiplyScalar(AF.rim.gain), rimB = col(BL.rim.color).multiplyScalar(BL.rim.gain);
  const tintA = col(PT.afterglow), tintB = col(PT.blue), paleA = col(PT.pale || '#d9d0e2'), paleB = col(PT.paleBlue || PT.pale || '#d9d0e2'), glanceA = col(PT.warm).sub(col(PT.afterglow)).multiplyScalar(PT.glance ?? 0.9), gradeA = col(AF.sky.grade || '#ffffff'), dimB = col('#7d94c4');
  const amber = col(plan.chip.amber), toLamp = new THREE.Vector3(), fogWestA = col(AF.fogWest.color);
  const ZONES = ['loft', 'avenue1', 'pond', 'pool', 'avenue2', 'beyond'];
  const vaultA = col(AF.vault), vaultB = col(BL.vault), farMistA = col(AF.mist.water), farMistB = col(BL.mist.water);
  const mirrorGain = new THREE.Color(...plan.light.bank.mirror.rgb);
  const BK = plan.light.bank, bankWestA = col(AF.bankLight.west), bankWestB = col(BL.bankLight.west), bankSideA = col(AF.bankLight.side), bankSideB = col(BL.bankLight.side);
  return {
    update(dt) {
      plan.locate(ctx.boat.x, ctx.boat.z, here);
      // the dusk advances only with travel
      const k = shared.hour = held ?? smooth(plan.light.blend[0], plan.light.blend[1], here.s);
      const inLoft = 1 - smooth(plan.light.loft.until, plan.light.loft.by, here.s);
      const out = smooth(MI.from, MI.to, here.s);                                    // the way out: beyond the wall, into the mist
      L.set({ loft: inLoft, afterglow: (1 - inLoft) * (1 - k) * (1 - out), blue: (1 - inLoft) * k * (1 - out), mist: out });
      // (after L.set, which writes the whole look: the current follows the page's stretches)
      ctx.look.current = ctx.look.currentNarrow = plan.currentAt(here.s);
      // ---- the kept lamp's one long stroke on the water. The mirror is cooled and deep: it gives the flame back as a dim
      // olive point. So while the lamp is ahead of the boat a path of its own amber is laid on the water toward it (the
      // water's sun path, aimed at the lamp from wherever the boat is); close to, the true reflection takes over.
      const lamp = shared.lamp, sun = ctx.waterLook.sun;
      if (lamp && lamp.position && sun) {
        toLamp.set(lamp.position.x - ctx.boat.x, 0, lamp.position.z - ctx.boat.z);
        const dist = toLamp.length() || 1, lit = (lamp.lit ?? 1) * (shared.lampStroke ?? 1);
        // (aimed at where the flame's image lies in the water)
        sun.dir = [toLamp.x / dist, Math.min(0.13, Math.max(0.012, (lamp.position.y + 1.1) / dist)), toLamp.z / dist];      // (never so steep that the stroke lies under the bow: it is painted light, laid where it can be seen)
        sun.color.copy(amber); sun.spread = 1.25; sun.glitter = 0.22;
        sun.strength = 2.6 * lit * smooth(2.5, 7, dist) * (1 - smooth(plan.lamp.flame[0] - 3, plan.lamp.flame[0] - 0.5, here.s)) * (1 - 0.35 * k);
      }
      // ---- the light on the paint
      U.uAir.value.copy(airA).lerp(airB, k); U.uAirHigh.value.copy(highA).lerp(highB, k);
      U.uTop.value.copy(topA).lerp(topB, k); U.uUnder.value.copy(underA).lerp(underB, k); U.uSkyKey.value.copy(keyA).lerp(keyB, k).normalize();
      U.uDark.value.set(darkA.r + (darkB.r - darkA.r) * k, darkA.g + (darkB.g - darkA.g) * k, darkA.b + (darkB.b - darkA.b) * k, AF.dark + (BL.dark - AF.dark) * k);
      // the last light fails early in the dusk and its line climbs: by the middle of the pond only the dome's top holds it
      const fail = smooth(0, 0.7, k);
      tmp.copy(lastA).lerp(lastB, fail); if (!lastOn) tmp.setRGB(0, 0, 0);
      U.uLast.value.set(tmp.r, tmp.g, tmp.b, AF.last.wrap);
      U.uLastLine.value.set(AF.last.line[0] + (BL.last.line[0] - AF.last.line[0]) * fail, AF.last.line[1] + (BL.last.line[1] - AF.last.line[1]) * fail);
      U.uRimLit.value.copy(rimA).lerp(rimB, k);
      if (Q.get('keep') == null) U.uKeep.value.x = AF.mirrorKeep + (BL.mirrorKeep - AF.mirrorKeep) * k;
      if (Q.get('keepall') == null) U.uKeepAll.value = (AF.mirrorCrowns ?? 0) + ((BL.mirrorCrowns ?? 0) - (AF.mirrorCrowns ?? 0)) * k;
      { const ta = MT || AF.mirrorTone || NOTONE, tb = MT || BL.mirrorTone || ta, mx = (i) => ta[i] + (tb[i] - ta[i]) * k;
        U.uMirrorShade.value.set(mx(0), mx(1), mx(2)); U.uMirrorLight.value.set(mx(3), mx(4), mx(5)); U.uMirrorSplit.value.set(mx(6), mx(7), mx(8)); }
      U.uVaultShade.value.copy(vaultA).lerp(vaultB, k);
      U.uFogWest.value.copy(fogWestA).sub(ctx.look.fog.color).multiplyScalar(AF.fogWest.gain * (1 - smooth(0.1, 0.8, k)));
      uSelf.value.copy(white).multiplyScalar(AF.blossomGlow + (BL.blossomGlow - AF.blossomGlow) * k);
      // ---- the afterglow's bank: always over there (never nearer than `ahead` metres to the boat); it cools and thins as the dusk goes
      // (sixth pass) AT THE GAP THE BANK IS THE MIST OF THE WAY OUT. As the boat comes up to the wall the bank draws in to
      // stand just behind it, thickens a little and pales to the lilac of the way out: so the air over the far water, the
      // sky's foot, the rails and the water itself (the air sheet's `gap`) are one pale mist, where the mist cards alone
      // stood over a mauve bank and the far water lay under them as a paler bar with a hard upper edge.
      const nearGap = smooth(plan.left.wall.s - 20, plan.left.wall.s - 2, here.s), GB = BK.gap || { ahead: BK.ahead, thicken: 0 };
      U.uBank.value.set(Math.max(BK.from, -ctx.boat.z + BK.ahead + (GB.ahead - BK.ahead) * nearGap), 1 / BK.rise, 1 / BK.height, bankOn ? BK.density * (AF.bankLight.density + (BL.bankLight.density - AF.bankLight.density) * k) * (1 + GB.thicken * nearGap) : 0);
      U.uBankWest.value.copy(bankWestA).lerp(bankWestB, k).lerp(gapTone, nearGap); U.uBankSide.value.copy(bankSideA).lerp(bankSideB, k).lerp(gapTone, nearGap * 0.85);
      airU.uFarColor.value.copy(farMistA).lerp(farMistB, k);
      glowCurtain.position.z = -(U.uBank.value.x + BK.mirror.into);
      glowU.uGlow.value.copy(U.uBankWest.value).multiply(mirrorGain).multiplyScalar(bankOn ? BK.mirror.gain * (1 - smooth(0.15, 0.9, k)) : 0);
      { const f = bankOn && Q.get('bandmirror') !== '0' ? (BK.mirror.veil ?? 0) * (1 - smooth(0.15, 0.9, k)) * (1 - nearGap) : 0; U.uBankMirror.value.set(1 + (mirrorGain.r - 1) * f, 1 + (mirrorGain.g - 1) * f, 1 + (mirrorGain.b - 1) * f); }
      // ---- sky, stars, rails, mist
      skyU.uHour.value = k; skyU.uPanoGlow.value = AF.sky.panoramaGlow + (BL.sky.panoramaGlow - AF.sky.panoramaGlow) * k;
      skyU.uSink.value = 0.075 * k; skyU.uThreadGain.value = 0.3 * smooth(0.45, 1, k); skyU.uDim.value.copy(gradeA).lerp(dimB, k);
      { const ea = AF.sky.east || [1, 1, 1], eb = BL.sky.east || ea, wa = AF.sky.west || [1, 1, 1], wb = BL.sky.west || wa;
        skyU.uSkyEast.value.set(ea[0] + (eb[0] - ea[0]) * k, ea[1] + (eb[1] - ea[1]) * k, ea[2] + (eb[2] - ea[2]) * k); skyU.uSkyWest.value.set(wa[0] + (wb[0] - wa[0]) * k, wa[1] + (wb[1] - wa[1]) * k, wa[2] + (wb[2] - wa[2]) * k); }
      for (const key of ['top', 'mid', 'horizon', 'below']) skyU['u' + key[0].toUpperCase() + key.slice(1)].value.set(AF.sky[key]).lerp(tmp2.set(BL.sky[key]), k);
      stars.uniforms.uS.value = held != null ? 96 + held * 110 : here.s;
      stars.uniforms.uIntensity.value = 1.1 * BL.stars;
      tmp.copy(railFrom).lerp(railTo, k);
      for (const r of rails) r.material.uniforms.uTint.value.copy(tmp);
      mistU(sideMist).uColor.value.copy(mistA).lerp(mistB, k); mistU(sideMist).uOpacity.value = sideMist.userData.opacity0 * (AF.mist.opacity + (BL.mist.opacity - AF.mist.opacity) * k);
      mistU(creepMist).uOpacity.value = creepMist.userData.opacity0 * BL.mist.opacity * k;
      mistU(bankMist).uColor.value.copy(bankA).lerp(bankB, k); mistU(bankMist).uOpacity.value = bankMist.userData.opacity0 * (AF.mist.bank.opacity + (BL.mist.bank.opacity - AF.mist.bank.opacity) * k);
      mistU(laneMist).uColor.value.copy(laneA).lerp(laneB, k); mistU(laneMist).uOpacity.value = laneMist.userData.opacity0 * 0.16 * smooth(0.3, 1, k);
      // (beyond the wall the mist is the bank's own colour: the band's light in the afterglow, its dregs at blue hour. Only
      // as the boat comes up to the gap does it pale to the lilac of the way out: the next area's veil)
      mistU(gapMist).uColor.value.copy(U.uBankWest.value).lerp(gapLilac, nearGap);
      airU.uGapColor.value.copy(mistU(gapMist).uColor.value).multiplyScalar(MG.tone ?? 0.9);      // (the water beyond the wall, under that mist)
      // ---- the petals
      petalU.uTint.value.copy(tintA).lerp(tintB, k); petalU.uPale.value.copy(paleA).lerp(paleB, k);
      petalU.uGlance.value.copy(glanceA).multiplyScalar(1 - 0.85 * k);
      petalU.uLampOn.value = (PT.lantern ?? 0.17) + ((PT.lanternBlue ?? PT.lantern ?? 0.17) - (PT.lantern ?? 0.17)) * k;
      petalU.uLane.value.x = shared.skin.lane; petalU.uLane.value.y = here.s;
      for (let i = 0; i < 6; i++) petalU.uZone.value[i] = zones[ZONES[i]];
      writeSkin();
      // (developer) &setdebug=<name>.json: this module's uniforms as they stand, once, to .shots/
      if (Q.has('setdebug') && !shared._setDebugSent && ctx.time > 1) { shared._setDebugSent = true; const hex = (c) => '#' + c.getHexString(); fetch('/__shot/' + Q.get('setdebug').replace(/[^\w.-]/g, ''), { method: 'POST', body: JSON.stringify({ hour: k, here, tint: hex(petalU.uTint.value), tintLinear: petalU.uTint.value.toArray(), pale: hex(petalU.uPale.value), glance: petalU.uGlance.value.toArray(), lampOn: petalU.uLampOn.value, air: hex(U.uAir.value), top: hex(U.uTop.value), under: hex(U.uUnder.value), keepAll: U.uKeepAll.value, keep: U.uKeep.value.toArray(), fog: hex(ctx.look.fog.color), fogDensity: ctx.look.fog.density, exposure: ctx.look.exposure, water: { deep: hex(ctx.waterLook.deep), mirror: ctx.waterLook.mirror, darken: ctx.waterLook.mirrorDarken, tint: hex(ctx.waterLook.reflectionTint), roughness: ctx.waterLook.roughness, streak: ctx.waterLook.streak, reflectivity: ctx.waterLook.reflectivity, fresnel: ctx.waterLook.fresnel, floor: ctx.waterLook.reflectFloor } }, null, 1) }).catch(() => {}); }
      if (quickEvery > 0 && (quickIn -= dt) <= 0 && ctx.water.trace) { quickIn = quickEvery; const h = ctx.boat.heading, at = (f, l) => [ctx.boat.x - Math.sin(h) * f - Math.cos(h) * l, ctx.boat.z - Math.cos(h) * f + Math.sin(h) * l], q1 = at(4.5, 1.5), q2 = at(4.5, 6), q3 = at(8, 1.5), q4 = at(8, 6); ctx.water.trace.line(q1[0], q1[1], q2[0], q2[1], { channel: 'glow', radius: 0.5, strength: 0.95, soft: 0.3 }); ctx.water.trace.line(q3[0], q3[1], q4[0], q4[1], { radius: 0.5, strength: 0.95, soft: 0.3 }); }
      if (ringEvery > 0 && (ringIn -= dt) <= 0) { ringIn = ringEvery; const h = ctx.boat.heading; ctx.water.ripple(ctx.boat.x - Math.sin(h) * 9 - Math.cos(h) * 2.5, ctx.boat.z - Math.cos(h) * 9 + Math.sin(h) * 2.5, 1.6, 0.7); }
    },
  };
}
