// The orchard in flood: what grows in the flood and stands still or only sways (module `plants`).
//   umbel          cow parsley standing in the water to the neck: three designs, about 3,200 plants, each in three
//                  weights by how far the boat is. Near, a head is modelled umbellet by umbellet: a dozen small cards
//                  (cut out of a drawn picture: drawn here, in code) each on its own ray from the stalk's end; far off
//                  the picture closes up, so that a head is still a pale spot at 40 m
//   grass_tip      tufts of drowned meadow grass standing out of the water: three designs, about 1,900 tufts
//   narcissus      clumps still in flower on the planting mounds, under the water: 600
//   bluebell       sprigs on the oldest tree's islet: 500 (set on the islet's own surface, whoever shapes it)
//   drowned_grass  the combed meadow on the bed, a field of blades that goes with the boat: 5,000
// All of it is grown here by rule, instanced, one draw to a design. Everything that stands in the water leans away
// from the hull as it comes by, tilts with the slope of a passing wake and shivers while the water is disturbed
// (the water's own ripple field, read where the plant stands); nothing here is alive.
// The log: docs/build/orchard/2-kit-trees.md.   Developer switches: &plants=0 (none of it), &umbels=<n>,
// &umbel=near | mid | far (every cow parsley plant in one weight), &umbelr=<metres> (where the near weight ends: 9.5),
// &reach=0 (the small things drawn everywhere always, however far off), &gold=<x> (how much more of the bow lantern
// the narcissus gives back: 1.4), &umbellamp=<share>,<to white> (a cow parsley head's share of a lamp: 0.62,0.75),
// &longgrass=0 (the margins' grass as it was before the tussocks), &plantpass=0 (everything in every picture).
import * as THREE from 'three';

const Q = new URLSearchParams(location.search);
const TAU = Math.PI * 2;
const lcg = (seed) => { let s = (Math.imul(Math.floor(seed) ^ 0x9e3779b9, 0x85ebca6b) >>> 0) % 2147483646 + 1; return () => (s = (s * 48271) % 2147483647) / 2147483647; };
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ------------------------------------------------------------------------------------------------ a small mesh builder
function mesh() {
  const pos = [], nor = [], uv = [], col = [], idx = [];
  return {
    v(p, n, t, c) { pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]); uv.push(t[0], t[1]); col.push(c[0], c[1], c[2]); return pos.length / 3 - 1; },
    tri(a, b, c) { idx.push(a, b, c); },
    quad(a, b, c, d) { idx.push(a, b, c, a, c, d); },
    get triangles() { return idx.length / 3; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeBoundingSphere();
      return g;
    },
  };
}
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// ------------------------------------------------------------------------------------------------ the umbel's picture
// One picture, 512 x 512, cut out by its alpha, drawn here in code:
//   head   a whole head of cow parsley seen from above: eighteen SEPARATE umbellets with air between them (lace, never
//          a plate). Far off, a head is two of these;
//   umb    four umbellets, each a dozen florets round a green heart: near the boat every umbellet of a head is a card
//          of its own on its own ray;
//   arc    two groups of three umbellets: in the middle distance four of these make a head;
//   plain  a square of plain paint for stems and rays (the material knows thin wood by it: it keeps out of the
//          painter's filter, which would wipe it out).
// A cut-out drawn small loses its dots, so every smaller copy of the picture is made here too, each a little more
// closed than the last: a head 40 m off is a pale spot, not nothing.
const UMBEL = {
  head: { c: [0.25, 0.25], h: 0.235 },
  umb: [[0.625, 0.125], [0.875, 0.125], [0.625, 0.375], [0.875, 0.375]].map((c) => ({ c, h: 0.117 })),
  arc: [[0.125, 0.625], [0.375, 0.625]].map((c) => ({ c, h: 0.117 })),
  plain: [0.9, 0.9],
};
function umbelPicture() {
  const W = 512, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const rnd = lcg(71);
  const tones = ['#ffffff', '#f4f1f8', '#fbf7ee', '#ece8f4', '#ffffff', '#f6f4ea'];
  // one umbellet: a ring of florets round a few more, a small green heart showing between them
  const umbellet = (x, y, R) => {
    g.fillStyle = '#b9c6a4'; g.beginPath(); g.arc(x, y, R * 0.36, 0, TAU); g.fill();
    const dot = (dx, dy, r) => { g.fillStyle = tones[Math.floor(rnd() * tones.length)]; g.beginPath(); g.arc(x + dx, y + dy, r, 0, TAU); g.fill(); };
    const n = 7 + Math.floor(rnd() * 3), a0 = rnd() * TAU;
    for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU + (rnd() - 0.5) * 0.3, rr = R * (0.6 + rnd() * 0.12); dot(Math.cos(a) * rr, Math.sin(a) * rr, R * (0.25 + rnd() * 0.09)); }
    for (let i = 0; i < 4; i++) { const a = a0 + i / 4 * TAU + 0.6, rr = R * (0.2 + rnd() * 0.08); dot(Math.cos(a) * rr, Math.sin(a) * rr, R * (0.2 + rnd() * 0.06)); }
  };
  const px = (cell) => [cell.c[0] * W, cell.c[1] * H, cell.h * W];
  // the whole head, from above
  {
    const [cx, cy, R] = px(UMBEL.head), ring = (n, r, jit, a0, size) => { for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU + (rnd() - 0.5) * jit, rr = r * (0.94 + rnd() * 0.12); umbellet(cx + Math.cos(a) * rr * R, cy + Math.sin(a) * rr * R, R * size * (0.85 + rnd() * 0.3)); } };
    ring(11, 0.8, 0.22, 0.2, 0.15); ring(6, 0.44, 0.4, 0.7, 0.14); ring(1, 0.04, 0, 0, 0.13);
  }
  for (const cell of UMBEL.umb) { const [cx, cy, R] = px(cell); umbellet(cx, cy, R * 0.74); }
  UMBEL.arc.forEach((cell, k) => {
    const [cx, cy, R] = px(cell), a0 = k * 1.1 + 0.4;
    for (let i = 0; i < 3; i++) { const a = a0 + i / 3 * TAU + (rnd() - 0.5) * 0.4, rr = R * (0.47 + rnd() * 0.08); umbellet(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, R * (0.42 + rnd() * 0.07)); }
  });
  g.fillStyle = '#ffffff'; g.fillRect(W * 0.8, H * 0.8, W * 0.2, H * 0.2);        // plain paint, for stems and rays
  // every size of it, smaller ones closing up; and the colour kept under what is transparent (no dark fringes)
  const levels = [];
  let w = W, h = H, k = 0;
  for (;;) {
    let c = cv;
    if (k) { c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d', { willReadFrequently: true }); q.imageSmoothingQuality = 'high'; q.drawImage(cv, 0, 0, w, h); }
    const img = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h), d = img.data, gain = 1 + 1.15 * k;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 12) { d[i] = 244; d[i + 1] = 243; d[i + 2] = 240; }
      d[i + 3] = Math.min(255, d[i + 3] * gain);
    }
    levels.push({ data: new Uint8Array(d.buffer.slice(0)), width: w, height: h });
    if (w === 1 && h === 1) break;
    w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); k++;
  }
  const tex = new THREE.DataTexture(levels[0].data, W, H, THREE.RGBAFormat);
  tex.mipmaps = levels; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4; tex.needsUpdate = true;
  return tex;
}

// ------------------------------------------------------------------------------------------------ cow parsley
// A plant is drawn once as a SKELETON (umbelPlan: its stem, where each head stands and how it tips, and every
// umbellet of every head) and given flesh three ways, for three distances (umbelFlesh):
//   near   within about ten metres of the boat: the stem and every stalk round, every ray a hair from the stalk's
//          end to its own umbellet, every umbellet a small card of its own, tipped the way its ray points. Seen level
//          from the boat a head is a shallow dome of separate dots on a fan of rays: lace;
//   mid    to about twenty-four metres: each head four cards of three umbellets (one on top, three round its rim tipped
//          outward), on one blade of stalk;
//   far    beyond: each head two discs of the whole head's picture, tipped two ways, so that one of them is never
//          edge-on.
// In its own space the middle of the main head is the origin (y up); the stem goes down into the water and the bed.
function umbelPlan(seed) {
  const rnd = lcg(seed);
  const root = [(rnd() - 0.5) * 0.12, -0.8, (rnd() - 0.5) * 0.12], node = [(rnd() - 0.5) * 0.03, -0.25 - rnd() * 0.1, (rnd() - 0.5) * 0.03];
  const heads = [{ P: [0, 0, 0], n: norm([(rnd() - 0.5) * 0.3, 1, (rnd() - 0.5) * 0.3]), R: 0.09 + rnd() * 0.02, from: node }];
  const more = 2 + Math.floor(rnd() * 2.5), a0 = rnd() * TAU;
  for (let i = 0; i < more; i++) {                              // the others on stalks that lean out from the node, each a little lower
    const a = a0 + i * 2.2 + rnd() * 0.7, out = 0.14 + rnd() * 0.1;
    heads.push({ P: [Math.cos(a) * out, -0.03 - rnd() * 0.14, Math.sin(a) * out], n: norm([Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5]), R: 0.062 + rnd() * 0.026, from: [node[0], node[1] + 0.05 * rnd(), node[2]] });
  }
  if (rnd() < 0.65) {                                           // a branch from lower down the stem, with a young head not yet open (often under the water)
    const a = a0 + 1.2, out = 0.2 + rnd() * 0.09, low = [root[0] * 0.3 + node[0] * 0.7, node[1] - 0.2, root[2] * 0.3 + node[2] * 0.7];
    heads.push({ P: [Math.cos(a) * out, -0.2 - rnd() * 0.12, Math.sin(a) * out], n: norm([Math.cos(a) * 0.7, 1, Math.sin(a) * 0.7]), R: 0.04 + rnd() * 0.016, from: low, young: true });
  }
  for (const h of heads) {
    const n = h.n, ref = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], u = norm(cross(ref, n)), w = cross(n, u);
    h.u = u; h.w = w; h.O = add(h.P, n, -0.66 * h.R); h.turn = rnd() * TAU; h.umb = [];
    const ring = (count, rho, jit) => {
      const t0 = rnd() * TAU;
      for (let i = 0; i < count; i++) {
        const a = t0 + i / count * TAU + (rnd() - 0.5) * jit, r = rho * (0.92 + rnd() * 0.16) * h.R, c = Math.cos(a), s = Math.sin(a);
        const D = add(add(add(h.P, u, c * r), w, s * r), n, 0.3 * h.R * (1 - (r / h.R) ** 2) + (rnd() - 0.5) * 0.03 * h.R);
        h.umb.push({ D, half: h.R * (0.33 + rnd() * 0.09) * (h.young ? 0.8 : 1), cell: Math.floor(rnd() * 4), turn: rnd() * TAU, out: [u[0] * c + w[0] * s, u[1] * c + w[1] * s, u[2] * c + w[2] * s] });
      }
    };
    ring(h.young ? 5 : 7 + Math.floor(rnd() * 3), 0.8, 0.3);
    if (!h.young) { ring(3 + Math.floor(rnd() * 2), 0.4, 0.5); if (rnd() < 0.6) ring(1, 0.03, 0); }
  }
  return { root, node, heads };
}

function umbelFlesh(plan, tier) {
  const m = mesh(), plain = UMBEL.plain;
  const STEM_LO = lin('#33453f'), STEM_HI = lin('#647a6c'), RAY = lin('#93a48e'), HEAD = lin('#e6ebe2'), HEAD_LOW = lin('#cfd8d2');      // (a cream white: in the lantern's warmth it goes to cream, where a lilac white would go pink)
  // a card of the picture, its middle at C, lying square to `nrm`, lit as `lit` says (a head is lit as one dome, not card by card)
  const card = (C, nrm, half, turn, cell, lit, col) => {
    const ref = Math.abs(nrm[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], u = norm(cross(ref, nrm)), w = cross(nrm, u), cu = Math.cos(turn), su = Math.sin(turn);
    const corner = (x, y) => m.v(add(add(C, u, (x * cu - y * su) * half), w, (x * su + y * cu) * half), lit, [cell.c[0] + x * cell.h, cell.c[1] + y * cell.h], col);
    m.quad(corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1));
  };
  // a round stalk of three sides; a hair (one sliver, lying in the plane of `flat`)
  const stalk = (a, b, r0, r1, c0, c1) => {
    const d = norm(add(b, a, -1)), ref = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], u = norm(cross(ref, d)), w = cross(d, u);
    const ringAt = (p, r, c) => [0, 1, 2].map((i) => { const an = i / 3 * TAU, o = add(add([0, 0, 0], u, Math.cos(an)), w, Math.sin(an)); return m.v(add(p, o, r), o, plain, c); });
    const A = ringAt(a, r0, c0), B = ringAt(b, r1, c1);
    for (let i = 0; i < 3; i++) m.quad(A[i], A[(i + 1) % 3], B[(i + 1) % 3], B[i]);
  };
  const hair = (a, b, wide, flat, c0, c1) => {
    const d = norm(add(b, a, -1)), s = norm(cross(d, flat)), nn = norm(cross(s, d));
    m.tri(m.v(add(a, s, wide), nn, plain, c0), m.v(add(a, s, -wide), nn, plain, c0), m.v(b, nn, plain, c1));
  };
  const { root, node, heads } = plan;
  if (tier === 'near') stalk(root, node, 0.0115, 0.008, STEM_LO, STEM_HI); else hair(root, node, 0.009, [0.3, 0, 1], STEM_LO, STEM_HI);
  heads.forEach((h, hi) => {
    const up = norm(add(h.n, [0, 1, 0], 0.8));                  // the head's light: the dome's own lie, a little toward the sky
    if (tier === 'near') {
      stalk(h.from, h.O, 0.0062, 0.0046, STEM_HI, RAY);
      for (const q of h.umb) {
        const ray = norm(add(q.D, h.O, -1));
        hair(h.O, add(q.D, ray, -0.004), 0.0028, h.n, RAY, RAY);
        card(q.D, norm(add(add([0, 0, 0], ray, 0.62), h.n, 0.5)), q.half, q.turn, UMBEL.umb[q.cell], norm(add(up, q.out, 0.45)), h.young ? HEAD_LOW : HEAD);
      }
    } else if (tier === 'mid') {
      // (as full as the near weight at the distance where one takes over from the other: the whole head's picture
      // lying on the dome, and three groups of umbellets round its rim tipped outward, which are what a level eye sees)
      // (THE SAME SHAPE AS THE NEAR WEIGHT, or a plant is seen to change as the boat comes up to it: a shallow dome on a
      // fan of rays. The rim's groups lie on the dome's shoulder, tipped out by a hand's tilt, and a ray runs from the
      // stalk's end to each and to the dome between them. They were tipped half way to upright with no rays under
      // them: a level eye saw a blot where the near weight is a flat lace lens on its fan.)
      hair(h.from, h.O, 0.006, [0.2, 0, 1], STEM_HI, RAY);
      card(add(h.P, h.n, 0.16 * h.R), h.n, h.R * 1.02, h.turn, UMBEL.head, up, HEAD);
      const k = h.young ? 2 : 3;
      for (let i = 0; i < k; i++) {
        const a = h.turn + i / k * TAU, out = add(add([0, 0, 0], h.u, Math.cos(a)), h.w, Math.sin(a));
        const C = add(add(h.P, out, 0.7 * h.R), h.n, -0.03 * h.R);
        card(C, norm(add(add([0, 0, 0], h.n, 0.92), out, 0.4)), h.R * 0.6, a * 1.7, UMBEL.arc[(hi + i) % 2], norm(add(up, out, 0.45)), i ? HEAD : HEAD_LOW);
        hair(h.O, add(C, out, 0.3 * h.R), 0.0034, h.n, RAY, RAY);
        if (!h.young) { const b = a + TAU / (2 * k), mid = add(add([0, 0, 0], h.u, Math.cos(b)), h.w, Math.sin(b)); hair(h.O, add(add(h.P, mid, 0.86 * h.R), h.n, 0.06 * h.R), 0.0034, h.n, RAY, RAY); }
      }
    } else {
      hair(h.from, h.O, 0.007, [0.2, 0, 1], STEM_HI, RAY);
      card(h.P, h.n, h.R * 1.04, h.turn, UMBEL.head, up, HEAD);
      if (!h.young) {                                           // the second disc, tipped another way: whichever way it is looked at one of them is not edge-on
        const a = h.turn + 1.3, out = add(add([0, 0, 0], h.u, Math.cos(a)), h.w, Math.sin(a));
        card(add(h.P, h.n, 0.1 * h.R), norm(add(add([0, 0, 0], h.n, 0.8), out, 0.6)), h.R * 0.86, h.turn + 2.1, UMBEL.head, norm(add(up, out, 0.3)), HEAD_LOW);
      }
    }
  });
  return m;
}

// ------------------------------------------------------------------------------------------------ grass
// A tuft standing out of the water: the origin is on the water, its foot a hand under it. Every blade is three
// stretches (it bends as it rises); most stand, one in four arches over until its tip is at the water again.
function grassTuft(seed, { blades = 4, tall = 0.3, lo = '#24453d', hi = '#84a595', under = -0.34, width = 0.011, reach = 0.12, droop = 0.25, stretches = 3, out0 = 0.03 } = {}) {
  const m = mesh(), rnd = lcg(seed), LO = lin(lo), HI = lin(hi), t = [0.5, 0.5];
  for (let b = 0; b < blades; b++) {
    const a = rnd() * TAU, out = out0 + rnd() * reach, hgt = tall * (0.45 + rnd() * 0.75), wide = width * (1 + rnd() * 0.8), over = rnd() < droop;      // (out0: the least a blade leans out: none stands plumb)
    const dir = [Math.cos(a), 0, Math.sin(a)], sideV = [-dir[2], 0, dir[0]], nrm = norm([dir[0], 0.4, dir[2]]);
    const far = out * (over ? 2.6 + rnd() : 1.5 + rnd());
    const pts = [[dir[0] * 0.02, under, dir[2] * 0.02], [dir[0] * out * 0.3, hgt * 0.38, dir[2] * out * 0.3], [dir[0] * out * 0.75, hgt * (over ? 0.86 : 0.72), dir[2] * out * 0.75],
      [dir[0] * far, hgt * (over ? 0.42 + 0.25 * rnd() : 0.92 + 0.2 * rnd()), dir[2] * far]];
    const cols = [LO, mixc(LO, HI, 0.35), mixc(LO, HI, 0.75), HI], wid = [1, 0.9, 0.62];
    let p0 = m.v(add(pts[0], sideV, wide), nrm, t, cols[0]), p1 = m.v(add(pts[0], sideV, -wide), nrm, t, cols[0]);
    for (let k = stretches === 3 ? 1 : 2; k < 3; k++) { const q0 = m.v(add(pts[k], sideV, wide * wid[k]), nrm, t, cols[k]), q1 = m.v(add(pts[k], sideV, -wide * wid[k]), nrm, t, cols[k]); m.quad(p0, p1, q1, q0); p0 = q0; p1 = q1; }      // (two stretches for what is never seen from nearer than a boat's length: three triangles a blade, not five)
    m.tri(p0, p1, m.v(pts[3], nrm, t, cols[3]));
  }
  return m;
}

// ------------------------------------------------------------------------------------------------ long grass
// A tussock standing in the flood, where a hull cannot push through: a few long blades, each ONE curve from its foot
// to a hair's point, as a fountain's jet goes (up and out, over its highest point two thirds of the way along, and
// down a little or a good deal: none ends higher than nine tenths of its height, and two in five hang their tips half
// way back to the water); short leaves lying out round their feet; and on one design in four a flowering stem that
// leans out over everything in one slow bow, its panicle nodding. One blade in five is last year's, bleached grey.
// (The margins' grass was tall straight olive lines, each bent once near its top like a walking stick: tufts made a
// span tall and then stretched to a metre. Mended part way three times; this is the form made new.)
const LONG_GRASS = [{ long: 4, short: 3, tall: 0.6 }, { long: 4, short: 2, tall: 0.5 }, { long: 3, short: 4, tall: 0.7, head: true }, { long: 3, short: 3, tall: 0.44 }];      // (how far its blades stand out of the water: this is meadow grass in most of a metre of flood, in to the neck, not a reed bed)
function grassLong(seed, { long = 3, short = 3, tall = 0.75, head = false, lo = '#1c3239', hi = '#5b7d80', straw = '#7c8388', width = 0.0052, under = -0.34 } = {}) {
  const m = mesh(), rnd = lcg(seed), LO = lin(lo), HI = lin(hi), STRAW = lin(straw), t = [0.5, 0.5];
  // one blade: a curve through three points (its foot under the water; a knee standing over a third of its reach, as
  // high as it must be for the blade's highest point to be `hgt`; its tip), cut into n stretches, narrowing all the
  // way. old: 0..1, how far it has gone to straw. Returns its tip.
  const blade = (a, hgt, out, tipH, wide, n, old) => {
    const dir = [Math.cos(a), 0, Math.sin(a)], sideV = [-dir[2], 0, dir[0]], nrm = norm([dir[0], 0.4, dir[2]]);
    const knee = hgt * (1 + Math.sqrt(Math.max(0, 1 - tipH)) * 0.9 + 0.08);
    const P0 = [dir[0] * 0.015, under, dir[2] * 0.015], P1 = [dir[0] * out * 0.34, knee, dir[2] * out * 0.34], P2 = [dir[0] * out, hgt * tipH, dir[2] * out];
    // (and it CURLS: it swings to one side as it goes, more toward its tip, and its face turns with it. A blade that bends
    // in one upright plane only is a ruled line to whoever looks along that plane, and of a field of them a third are
    // looked along: the straight sticks among the lace, three times over.)
    const curl = (rnd() < 0.5 ? -1 : 1) * (0.1 + rnd() * 0.26) * out, turnF = (rnd() - 0.5) * 1.6;
    let prev = null, last = P0;
    for (let k = 0; k <= n; k++) {
      const u = k / n, e = Math.pow(u, 0.8), q = add([0, 1, 2].map((i) => (1 - e) * (1 - e) * P0[i] + 2 * (1 - e) * e * P1[i] + e * e * P2[i]), sideV, curl * e * e);
      const col = mixc(mixc(LO, HI, Math.min(1, u * 1.3)), STRAW, old);
      last = q;
      if (k === n) { m.tri(prev[0], prev[1], m.v(q, nrm, t, col)); break; }
      const face = norm(add(sideV, dir, turnF * u)), w = wide * (1 - 0.72 * Math.pow(u, 1.3)), cur = [m.v(add(q, face, w), nrm, t, col), m.v(add(q, face, -w), nrm, t, col)];
      if (prev) m.quad(prev[0], prev[1], cur[1], cur[0]);
      prev = cur;
    }
    return last;
  };
  const a0 = rnd() * TAU;
  for (let b = 0; b < long; b++) {
    const a = a0 + b / long * TAU + (rnd() - 0.5) * 1.4, hgt = tall * (0.6 + rnd() * 0.42), over = rnd() < 0.4;
    blade(a, hgt, hgt * (over ? 0.7 + rnd() * 0.35 : 0.42 + rnd() * 0.3), over ? 0.36 + rnd() * 0.24 : 0.7 + rnd() * 0.2, width * (1 + rnd() * 0.7), 5, rnd() < 0.2 ? 0.7 : rnd() * 0.12);
  }
  for (let b = 0; b < short; b++) {                               // the leaves round its feet: short, lying well out over the water
    const a = a0 + 1.1 + b / short * TAU + (rnd() - 0.5) * 1.2, hgt = tall * (0.2 + rnd() * 0.16);
    blade(a, hgt, hgt * (0.9 + rnd() * 0.7), 0.3 + rnd() * 0.5, width * (1.2 + rnd() * 0.8), 2, rnd() < 0.25 ? 0.6 : rnd() * 0.15);
  }
  if (head) {                                                     // the flowering stem: taller than any leaf, bowed one way from foot to head; its panicle nods the way the stem leans
    const a = a0 + 2.6, hgt = tall * (1.1 + rnd() * 0.1), tip = blade(a, hgt, hgt * (0.3 + rnd() * 0.14), 0.93, width * 0.75, 5, 0.45);
    const dir = [Math.cos(a), 0, Math.sin(a)], sideV = [-dir[2], 0, dir[0]], nrm = norm([dir[0], 0.4, dir[2]]), col = mixc(HI, STRAW, 0.8);
    const mid = add(add(tip, dir, 0.02), [0, 1, 0], 0.05), end = add(add(tip, dir, 0.055), [0, 1, 0], 0.085);
    const p0 = m.v(tip, nrm, t, col), l = m.v(add(mid, sideV, 0.011), nrm, t, col), r = m.v(add(mid, sideV, -0.011), nrm, t, col), p1 = m.v(end, nrm, t, col);
    m.tri(p0, l, r); m.tri(l, p1, r);
  }
  return m;
}

// ------------------------------------------------------------------------------------------------ narcissus
// A clump on a planting mound, under the water: strap leaves, and five to seven flowers on stalks of their own
// lengths, each turned outward and up to the surface. A flower is six pointed petals (each a kite: narrow at the
// heart, widest short of half way, drawn to a point, lying over its neighbours' edges) set a little back from a
// short cup with a darker throat: from the boat a pale flower with a gold eye, never a star. `tall`: how high its
// flowers stand over its foot (the mound falls away from its trunk: a clump further down it is taller, so that
// every clump holds its flowers a hand under the surface).
// (It was three flowers of six slivers each, a hand across, cream that the water turned to its own teal: beside a
// trunk, with the lantern on it, a rider saw two orange specks.)
function narcissusClump(seed, tall = 0.3) {
  const m = mesh(), rnd = lcg(seed), LEAF_LO = lin('#2f4a44'), LEAF_HI = lin('#5f7f6c'), PETAL = lin('#efe8c6'), PETAL_IN = lin('#d3ca9c'), CUP = lin('#e0a83a'), CUP_IN = lin('#9a6a24'), STEM = lin('#5a7560'), t = [0.5, 0.5];
  for (let b = 0; b < 5; b++) {                                    // strap leaves, two stretches, arching out; the longest reach to the flowers
    const a = b / 5 * TAU + rnd(), dir = [Math.cos(a), 0, Math.sin(a)], sideV = [-dir[2], 0, dir[0]], hgt = tall * (0.62 + rnd() * 0.36), nrm = norm([dir[0], 0.5, dir[2]]);
    const a0 = m.v(add([0, 0, 0], sideV, 0.009), nrm, t, LEAF_LO), a1 = m.v(add([0, 0, 0], sideV, -0.009), nrm, t, LEAF_LO);
    const mid = [dir[0] * 0.04, hgt * 0.62, dir[2] * 0.04], b0 = m.v(add(mid, sideV, 0.008), nrm, t, LEAF_HI), b1 = m.v(add(mid, sideV, -0.008), nrm, t, LEAF_HI);
    const c = m.v([dir[0] * (0.07 + tall * 0.14), hgt, dir[2] * (0.07 + tall * 0.14)], nrm, t, LEAF_HI);
    m.quad(a0, a1, b1, b0); m.tri(b0, b1, c);
  }
  const flowers = 5 + Math.floor(rnd() * 2.6), a0 = rnd() * TAU;
  for (let f = 0; f < flowers; f++) {
    const a = a0 + f / flowers * TAU + (rnd() - 0.5) * 0.8, dir = [Math.cos(a), 0, Math.sin(a)], out = 0.035 + rnd() * 0.085 + tall * 0.06, hgt = tall * (0.74 + rnd() * 0.26);
    const C = [dir[0] * out, hgt, dir[2] * out], n = norm([dir[0], 1.0 + rnd() * 1.1, dir[2]]), u = norm(cross([0, 1, 0], n)), w = cross(n, u), R = 0.054 + rnd() * 0.014;
    const s0 = m.v([dir[0] * 0.012 - 0.0035, 0, dir[2] * 0.012], n, t, STEM), s1 = m.v([dir[0] * 0.012 + 0.0035, 0, dir[2] * 0.012], n, t, STEM), s2 = m.v(add(C, n, -0.014), n, t, STEM);
    m.tri(s0, s1, s2);
    const at = (ang, r, lift) => add(add(add(C, u, Math.cos(ang) * r), w, Math.sin(ang) * r), n, lift);
    const turn = rnd() * TAU;
    for (let k = 0; k < 6; k++) {                                  // the six petals: every other one lies a hair under its neighbours
      const ang = turn + k / 6 * TAU + (rnd() - 0.5) * 0.12, rr = R * (0.9 + rnd() * 0.2), low = k % 2 ? -0.003 : 0;
      const h = m.v(at(ang, R * 0.13, low), n, t, PETAL_IN), l = m.v(at(ang - 0.46, R * 0.52, low - 0.002), n, t, PETAL), r = m.v(at(ang + 0.46, R * 0.52, low - 0.002), n, t, PETAL), tip = m.v(at(ang, rr, low - 0.009), n, t, PETAL);
      m.tri(h, l, r); m.tri(l, tip, r);
    }
    const heart = m.v(at(0, 0, 0.003), n, t, CUP_IN);               // the cup: a short open funnel, darker in its throat
    const rim = [0, 1, 2, 3, 4, 5].map((k) => m.v(at(turn + (k + 0.5) / 6 * TAU, R * 0.27, 0.017), n, t, CUP));
    for (let k = 0; k < 6; k++) m.tri(heart, rim[k], rim[(k + 1) % 6]);
  }
  return m;
}

// ------------------------------------------------------------------------------------------------ bluebell
// A sprig on the islet: two or three strap leaves and one arching stem with its bells hung down one side.
function bluebellSprig(seed) {
  const m = mesh(), rnd = lcg(seed), LEAF_LO = lin('#27433b'), LEAF_HI = lin('#4f755f'), STEM = lin('#3f5a52'), BELL = lin('#5b63a2'), BELL_LIP = lin('#858cc0'), t = [0.5, 0.5];
  const lean = rnd() * TAU, L = [Math.cos(lean), 0, Math.sin(lean)], S = [-L[2], 0, L[0]];
  for (let b = 0; b < 2 + (rnd() < 0.5 ? 1 : 0); b++) {
    const a = lean + 1.5 + b * 2.1 + rnd(), dir = [Math.cos(a), 0, Math.sin(a)], sideV = [-dir[2], 0, dir[0]], hgt = 0.14 + rnd() * 0.08, nrm = norm([dir[0], 0.6, dir[2]]);
    const a0 = m.v(add([0, 0, 0], sideV, 0.008), nrm, t, LEAF_LO), a1 = m.v(add([0, 0, 0], sideV, -0.008), nrm, t, LEAF_LO), c = m.v([dir[0] * 0.1, hgt, dir[2] * 0.1], nrm, t, LEAF_HI);
    m.tri(a0, a1, c);
  }
  const hgt = 0.24 + rnd() * 0.1, pts = [[0, 0, 0], add([0, hgt * 0.6, 0], L, 0.01), add([0, hgt * 0.95, 0], L, 0.05), add([0, hgt * 0.92, 0], L, 0.115)];
  for (let i = 0; i < 3; i++) {
    const a0 = m.v(add(pts[i], S, 0.0045), L, t, STEM), a1 = m.v(add(pts[i], S, -0.0045), L, t, STEM), b0 = m.v(add(pts[i + 1], S, 0.004), L, t, STEM), b1 = m.v(add(pts[i + 1], S, -0.004), L, t, STEM);
    m.quad(a0, a1, b1, b0);
  }
  for (let k = 0; k < 5; k++) {                                  // the bells: small flared tubes seen as blades, hung under the arch
    const u = 0.42 + k * 0.13, i = Math.min(2, Math.floor(u * 3)), f = u * 3 - i, P = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f, pts[i][2] + (pts[i + 1][2] - pts[i][2]) * f];
    const sgn = k % 2 ? 1 : -1, len = 0.034 + rnd() * 0.012, off = add(add(P, L, 0.012), S, sgn * 0.008);
    const top0 = m.v(add(off, S, 0.006), norm(add(L, S, sgn)), t, BELL), top1 = m.v(add(off, S, -0.006), norm(add(L, S, sgn)), t, BELL);
    const lip0 = m.v(add(add(off, [0, -len, 0], 1), S, 0.011), L, t, BELL_LIP), lip1 = m.v(add(add(off, [0, -len, 0], 1), S, -0.011), L, t, BELL_LIP);
    m.quad(top0, top1, lip1, lip0);
  }
  return m;
}

// ------------------------------------------------------------------------------------------------ the drowned meadow's tuft
// Three blades from one foot, lying over along the tuft's own +Z (the water's way), each a little off the others:
// broad at the foot, bending as it goes, its tip lifted where the slow water carries it. Paler than the bed it grows
// from, or it is seen through a metre of teal water as scratches on glass.
function meadowTuft(seed) {
  const m = mesh(), rnd = lcg(seed), LO = lin('#1f4f50'), MID = lin('#3f7a70'), HI = lin('#6a9c8c'), t = [0.5, 0.5], n = [0, 0.85, 0.5];
  for (let b = 0; b < 3; b++) {
    const fan = (b - 1) * 0.3 + (rnd() - 0.5) * 0.2, c = Math.cos(fan), sn = Math.sin(fan), len = 0.42 + rnd() * 0.24, w = 0.016 + rnd() * 0.008, x0 = (b - 1) * 0.03, rise = 0.16 + rnd() * 0.1;
    const at = (side, u, y) => [x0 + sn * len * u + c * side, y, c * len * u - sn * side];
    const a0 = m.v(at(w, 0, 0), n, t, LO), a1 = m.v(at(-w, 0, 0), n, t, LO), b0 = m.v(at(w * 0.9, 0.33, rise * 0.8), n, t, MID), b1 = m.v(at(-w * 0.9, 0.33, rise * 0.8), n, t, MID);
    const c0 = m.v(at(w * 0.6, 0.7, rise), n, t, HI), c1 = m.v(at(-w * 0.6, 0.7, rise), n, t, HI), tip = m.v(at(0, 1, rise * 0.82), n, t, HI);
    m.quad(a0, a1, b1, b0); m.quad(b0, b1, c1, c0); m.tri(c0, c1, tip);
  }
  return m;
}

export async function build(ctx, plan, shared) {
  if (Q.get('plants') === '0') return {};
  const { kit } = ctx, F = shared.frame, S = ctx.engine.shared;
  const rnd = ctx.rng(5113);

  // ---------------------------------------------------------------------------------------------- how a standing plant moves
  // In the world: a plant bends from its foot, the more the higher. It leans away from the hull (the boat's own length,
  // not a point), tilts with the slope of the rippled water where it stands, shivers while that water is disturbed, and
  // is never wholly still. uPlant: (the height at which nothing moves, the height at which everything does, how far it
  // leans from the hull, how much it answers the water: 0 for what stands on dry ground).
  const uHull = { value: new THREE.Vector4(0, 0, 0, 1) };       // the boat: x, z, and the way its bow points (sin, cos of its heading)
  const uMeadow = { value: new THREE.Vector4(10, -1, 1, 0) };   // the drowned meadow's field (set where it is made)
  // (lo below -50: the plant stands on ground of its own, and bends over `hi` metres from its own foot. air: how far
  // its top stirs in the evening's air, metres.)
  const airs = [];                                              // every plant material's own stir in the air: [uniform, its resting value]
  const airOf = (air) => { const u = { value: ctx.reducedMotion ? air * 0.4 : air }; airs.push([u, u.value]); return u; };
  const moves = (lo, hi, lean, water = 1, air = 0.006, hold = 0.7) => ({
    uniforms: { uHull, uPlant: { value: new THREE.Vector4(lo, hi, lean, water) }, uAirStir: airOf(air), tRipple: S.tRipple, uRippleRect: S.uRippleRect, uSelf: shared.blossomSelf || { value: new THREE.Color(0, 0, 0) } },
    vertexPars: /* glsl */`uniform vec4 uHull, uPlant; uniform float uAirStir; uniform sampler2D tRipple; uniform vec4 uRippleRect;
      vec4 plantRipple(vec2 xz) { vec2 uv = (xz - uRippleRect.xy) / uRippleRect.zw + 0.5, e = min(uv, 1.0 - uv); return min(e.x, e.y) > 0.0 ? texture2D(tRipple, uv) * smoothstep(0.0, 0.08, min(e.x, e.y)) : vec4(0.0); }`,
    vertexWorld: /* glsl */`{
      #ifdef USE_INSTANCING
        vec3 foot = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      #else
        vec3 foot = wp.xyz;
      #endif
      float hgt = uPlant.x < -50.0 ? clamp((wp.y - foot.y) / max(uPlant.y, 0.01), 0.0, 1.0) : smoothstep(uPlant.x, uPlant.y, wp.y); hgt *= hgt;
      float ph = fract(foot.x * 0.37 + foot.z * 0.73) * 6.2832;
      // the hull: a line from its stern to its bow; what stands within a metre and a half of it leans away and is pressed down
      vec2 fwd = vec2(-uHull.z, -uHull.w), rel = foot.xz - uHull.xy;
      float along = clamp(dot(rel, fwd), -1.7, 2.3);
      vec2 away = rel - fwd * along; float d = length(away);
      float push = (1.0 - smoothstep(0.75, 2.3, d)) * uPlant.z;
      wp.xz += away / max(d, 0.05) * push * hgt; wp.y -= 0.35 * push * hgt;
      // WHAT THE HULL RIDES OVER GOES UNDER IT. A plant whose foot is inside the hull's own plan (0.7 m to either side
      // amidships, drawn in to nothing at the stem and a little at the transom) is laid down under the keel, all of it,
      // and comes up again when the boat has passed; one that stands in the hand's breadth beside the planking is half
      // pressed over. (Leaning half a metre was all a plant did: one that stood where the boat came to rest at a
      // trunk's foot came up through the bottom boards, a head of cow parsley standing in the boat.)
      float beam = 0.72 * (1.0 - pow(clamp((along - 0.1) / 2.25, 0.0, 1.0), 1.7)) * mix(0.74, 1.0, smoothstep(-1.7, -0.5, along));
      float ridden = (1.0 - smoothstep(beam + 0.05, beam + 0.36, d)) * step(0.001, uPlant.z);
      wp.y = mix(wp.y, min(wp.y, -0.27), ridden);
      // AND NO PART OF A PLANT IS INSIDE THE BOAT. A plant that stands beside the hull may still reach over it: a blade
      // of a tussock arches out as far as it is tall, a head of cow parsley nods a hand or two from its stem. Whatever
      // of a plant would lie within the hull's own plan, below the height of the gunwale, is put back outside the
      // planking (the blade is bent back along the boat's side, as a hull does bend grass).
      { vec2 relV = wp.xz - uHull.xy; float alV = clamp(dot(relV, fwd), -1.7, 2.3); vec2 awV = relV - fwd * alV; float dV = length(awV);
        float beamV = 0.72 * (1.0 - pow(clamp((alV - 0.1) / 2.25, 0.0, 1.0), 1.7)) * mix(0.74, 1.0, smoothstep(-1.7, -0.5, alV)) + 0.08;
        float inV = step(dV, beamV) * (1.0 - smoothstep(0.6, 0.85, wp.y)) * step(-0.2, wp.y) * step(0.001, uPlant.z);
        wp.xz += awV / max(dV, 0.03) * ((beamV - dV) * inV); }
      // the water it stands in: it tilts with the slope of a wake and shivers while the water is lively
      vec4 rp = plantRipple(foot.xz) * uPlant.w;
      wp.xz += rp.xy * (0.55 * hgt) + vec2(sin(uTime * 19.0 + ph), cos(uTime * 23.0 + ph * 1.7)) * (0.014 * clamp(rp.w, 0.0, 1.5) * hgt);
      wp.xz += (vec2(sin(uTime * 0.83 + ph), sin(uTime * 0.61 + ph * 2.3)) + vec2(0.8, 0.5) * sin(uTime * 0.52 + foot.x * 0.33 + foot.z * 0.21)) * (uAirStir * hgt);
    }`,
    fragmentPars: 'uniform vec3 uSelf;',
    light: `glow += uSelf * ownColour * ${hold.toFixed(2)};`,          // pale heads hold the last light as blossom does; dark stems none
  });

  // ---------------------------------------------------------------------------------------------- which of the frame's three pictures a thing is drawn in
  // A frame is three pictures: the scene without the water (engine.pre: what the water shows beneath itself, and how
  // the painter's filter tells water from paint), the mirror, and the picture itself. What is small needs fewer:
  //   (nothing)  all three: what stands near the lane with its feet in the water and its head doubled in it (cow parsley)
  //   'direct'   not the mirror: what is too small for a reflection, but is seen going down into the water or lies
  //              under it (grass at the trees' feet, narcissus, the drowned meadow)
  //   'above'    the picture alone: what stands on dry ground, or far enough off that its feet are never looked for
  //              (the islet's turf and bluebells, the long grass of the margins). CUT OFF AT THE WATER: a thing the
  //              water was not told about shows through it as a dark blue ghost, so nothing of these is drawn below
  //              the surface (CLIP below). Left out of the picture without the water, they are taken for water by the
  //              painter's filter and left as drawn: they are fine blades, which is what they want.
  //   'heads'    the same, and the mirror as well (the cow parsley of the margins: white heads doubled in the water)
  // &plantpass=0 (developer) draws everything in every picture, to compare.
  const eng = ctx.engine, everywhere = Q.get('plantpass') === '0';
  const CLIP = { albedo: 'if (vWPos.y < -0.012) discard;' };
  const clipped = (how) => !everywhere && (how === 'above' || how === 'heads');
  const drawnIn = (mesh, how, count, set) => {                  // count: a number, or a function that gives how many of it are in reach now
    if (everywhere || !how) return mesh;
    const live = typeof count === 'function' ? count : () => count;
    if (how !== 'heads') ctx.only(mesh, 'direct');
    if (how === 'direct') return mesh;
    mesh.onBeforeRender = (renderer) => { if (renderer.getRenderTarget() === eng.pre) set(0); else if (eng.reflecting) set(Math.ceil(live() * 0.55)); };      // (and the mirror gets a little over half of them: a reflection of lace among petals needs no more)
    mesh.onAfterRender = () => set(live());
    return mesh;
  };

  // ---------------------------------------------------------------------------------------------- what is too far off to be seen is not drawn
  // A batch of copies is drawn whole or not at all, and these stand all over the orchard: every blade of grass at the
  // wall was drawn for a boat at the loft's door, in each of the frame's pictures it belongs to. A blade a finger wide
  // is thinner than a pixel beyond some forty metres, and a flower under the water cannot be seen at all beyond the
  // lantern's reach. So a system may be given a REACH: its copies within that of the boat are packed to the front of
  // its batch and only those are drawn; packed again whenever the boat has moved two metres (the reach is two metres
  // more than it is called, so nothing comes or goes inside it). &reach=0 (developer) draws everything always.
  const REACH_ON = Q.get('reach') !== '0', nearSets = [];
  const near = (meshI, list, reach) => {
    if (!REACH_ON || !reach) return { live: list.length };
    const m4 = new THREE.Matrix4(), c3 = new THREE.Color(), mats = [], cols = [];
    for (let i = 0; i < list.length; i++) { meshI.getMatrixAt(i, m4); mats.push(m4.clone()); if (meshI.instanceColor) { meshI.getColorAt(i, c3); cols.push(c3.clone()); } }
    const set = { mesh: meshI, list, mats, cols, reach: reach + 2, live: 0 };
    meshI.count = 0; nearSets.push(set);
    return set;
  };
  let packedAt = null;
  const packNear = () => {
    const bx = ctx.boat.x, bz = ctx.boat.z;
    if (packedAt && Math.hypot(bx - packedAt[0], bz - packedAt[1]) < 2) return;
    packedAt = [bx, bz];
    for (const s of nearSets) {
      const me = s.mesh, r = s.reach; let k = 0;
      for (let i = 0; i < s.list.length; i++) {
        const it = s.list[i], dx = it.x - bx, dz = it.z - bz;
        if (dx > r || dx < -r || dz > r || dz < -r || dx * dx + dz * dz > r * r) continue;
        me.setMatrixAt(k, s.mats[i]); if (s.cols.length) me.setColorAt(k, s.cols[i]); k++;
      }
      s.live = k; me.count = k; me.visible = k > 0; me.instanceMatrix.needsUpdate = true; if (me.instanceColor) me.instanceColor.needsUpdate = true;
    }
  };

  const lists = {};
  const instanced = (name, geos, items, matOpts, how, reach = 0) => {
    // items: [{ x, y, z, turn, lean: [x, z], scale: s | [x, y, z], tint }], dealt out among the designs in `geos`
    // reach: metres from the boat beyond which a copy is not drawn (0: all of them always)
    const mat = shared.paint(clipped(how) ? { ...matOpts, extend: [CLIP, ...[].concat(matOpts.extend || [])] } : matOpts), per = geos.map(() => []), made = [];
    lists[name] = { meshes: made };
    items.forEach((it, i) => per[it.design ?? Math.floor((it.pick ?? rnd()) * geos.length) % geos.length].push(it));
    let tris = 0;
    geos.forEach((geo, k) => {
      const list = per[k]; if (!list.length) return;
      const meshI = kit.instances(geo, mat, list.map((it) => ({ position: [it.x, it.y, it.z], rotation: [it.lean ? it.lean[0] : 0, it.turn || 0, it.lean ? it.lean[1] : 0], scale: it.scale ?? 1, color: it.tint })));
      meshI.name = `${name} ${'abcdef'[k]} x${list.length}`;
      const set = near(meshI, list, reach);
      if (how) drawnIn(meshI, how, () => set.live, (c) => { meshI.count = c; });
      made.push(meshI);
      tris += list.length * (geo.index.count / 3);
    });
    lists[name] = { count: items.length, triangles: tris, meshes: made };
    return mat;
  };

  // ---------------------------------------------------------------------------------------------- where things stand
  const trees = plan.trees.trees, farTrees = plan.trees.far;
  const round = (t, r0, r1) => { const a = rnd() * TAU, r = r0 + rnd() * (r1 - r0); return [t.x + Math.cos(a) * r, t.z + Math.sin(a) * r]; };
  const wallFoot = () => { const d = (rnd() < 0.5 ? -1 : 1) * (9.6 + Math.pow(rnd(), 1.3) * 32); return plan.xz(plan.left.wall.s - 0.7 - rnd() * 1.6, d); };

  // ---------------------------------------------------------------------------------------------- cow parsley
  // (The page counts HEADS: 1,200. A plant here carries three to five, so two thirds as many plants stand round the
  // trees and along the edge of the sailable water; and more fill the growth beyond it, which the page describes
  // ("stand in it to the neck") but does not count.)
  // Every plant is one of three designs, and wears one of three weights of flesh by how far the boat is from it
  // (umbelFlesh: near, mid, far), changing as the boat comes and goes, with a metre and a half of slack so that
  // nothing flickers. A weight of a design is one draw.
  const patchy = (p) => kit.fbm(p[0] * 0.09, p[1] * 0.09, 2, 23);
  const marginAt = (lo, hi, pow = 1.5) => { for (let k = 0; k < 8; k++) { const s = 28 + rnd() * 186, d = (rnd() < 0.5 ? -1 : 1) * (lo + Math.pow(rnd(), pow) * (hi - lo)), p = plan.xz(s, d); if (patchy(p) > 0.3 + 0.16 * rnd()) return p; } return plan.xz(28 + rnd() * 186, (rnd() < 0.5 ? -1 : 1) * (lo + rnd() * (hi - lo))); };
  const umbelSets = []; let sortUmbels = () => {};
  {
    const want = Q.has('umbels') ? +Q.get('umbels') : plan.count.umbels, n = kit.count(Math.round(want * 0.67));
    const tintOf = () => ['#ffffff', '#f1eef6', '#f7f3ea', '#e6e6ee'][Math.floor(rnd() * 4)];
    const items = [], put = (p, k = 1) => items.push({ x: p[0], y: 0.14 + rnd() * 0.3 * k, z: p[1], turn: rnd() * TAU, lean: [(rnd() - 0.5) * 0.46, (rnd() - 0.5) * 0.46], scale: 0.86 + rnd() * 0.44, tint: tintOf() });
    const shares = [0.42, 0.06, 0.44, 0.08];                      // at the avenue trees' feet, at the far trees' feet, along the edge of the sailable water, at the wall's foot
    for (let i = 0; i < Math.round(n * shares[0]); i++) put(round(trees[i % trees.length], 0.5, 1.5));
    for (let i = 0; i < Math.round(n * shares[1]); i++) put(round(farTrees[i % farTrees.length], 0.5, 1.7));
    for (let i = 0; i < Math.round(n * shares[2]); i++) put(marginAt(29, 33.5, 1.2), 1.3);
    for (let i = 0; i < Math.round(n * shares[3]); i++) put(wallFoot());
    // the standing growth beyond, in drifts: thickest just beyond the edge of the sailable water, where a rider lying at the edge looks into it
    const nf = kit.count(Math.round(want * 2.0));
    for (let i = 0; i < nf; i++) { const p = marginAt(30.5, 45, 2.1); items.push({ x: p[0], y: 0.24 + rnd() * 0.46, z: p[1], turn: rnd() * TAU, lean: [(rnd() - 0.5) * 0.46, (rnd() - 0.5) * 0.46], scale: 0.82 + rnd() * 0.5, tint: tintOf() }); }      // (heads a hand to a span across, tipped every way: at half as large again and all one tilt, the middle distance was a field of pale pies)
    const picture = umbelPicture(); ctx.onDispose(() => picture.dispose());
    // (their heads hold the light: away from a lantern they were the petals' own grey, and read as more petals. The
    // whole material is `crisp`, which is how a cut-out may keep thin things out of the painter's filter; the last
    // line gives everything but stems and rays back to the painter, so that a head is dabs like the blossom over it)
    const painted = { final: 'if (vUv0.x < 0.78 || vUv0.y < 0.78) gl_FragColor.a = 1.0;' };
    // IN A LANTERN'S LIGHT A HEAD IS CREAM, as the blossom over it is shell pink (the blossom takes two fifths of a
    // lamp's light). White paint in an amber lamp took all of it: at blue hour, when the bow lantern is strongest and
    // everything else is blue, the cow parsley round the boat was salmon pink (measured #cfb6ac beside #878fa1 for the
    // heads out of its reach): a candy colour. A head now takes three fifths of the bow lantern's light and of the kept lamp's,
    // and that drawn three quarters of the way from the lamp's amber to a cream (peach is amber on white; cream has
    // more green in it and less red: with too little yellow the heads went the blossom's own lilac pink). &umbellamp=<share>,<how far to white> (developer; 1,0 is as it was). This is my paint, nobody's light.
    const UL = (Q.get('umbellamp') || '0.62,0.75').split(',').map(Number);
    const lampShare = { light: `{ vec3 umbL = ownColour * (pointLight(uLanternPos, uLanternColor, uLanternRadius, N) + pointLight(uLampPos, uLampColor, uLampRadius, N));
      float umbPale = smoothstep(0.25, 0.55, max(ownColour.r, max(ownColour.g, ownColour.b)));
      c += (mix(umbL, dot(umbL, vec3(0.3, 0.5, 0.2)) * vec3(1.02, 1.04, 0.7), ${(UL[1] ?? 0.75).toFixed(2)}) * ${(UL[0] ?? 0.62).toFixed(2)} - umbL) * umbPale;
      c += (mix(umbL, dot(umbL, vec3(0.3, 0.5, 0.2)) * vec3(0.95, 1.0, 0.97), 0.65) * 0.45 - umbL) * (1.0 - umbPale); }` };      // (and its stems and rays, as the grass: green paint in amber light is a yellow-green wire)
    const opts = { color: '#c6cace', map: picture, cutout: true, crisp: true, side: THREE.DoubleSide, vertexColors: true, brush: 0.15, shade: 0.75, steps: 2 };
    const mat = shared.paint({ ...opts, extend: [moves(-0.55, 0.3, 0.5, 1, 0.006, 1.5), lampShare, painted] });
    const matFar = everywhere ? mat : shared.paint({ ...opts, extend: [CLIP, moves(-0.55, 0.3, 0.5, 1, 0.006, 1.5), lampShare, painted] });      // (the far weight is drawn in the picture and the mirror only: cut off at the water, see above)
    const TIERS = ['near', 'mid', 'far'], forced = TIERS.indexOf(Q.get('umbel')), R_NEAR = +(Q.get('umbelr') || 9.5), REACH = [R_NEAR, 20], SLACK = 1.5;      // (the middle weight ends at 20 m, not 24: it carries its rays now, and at twenty metres a head is four pixels across)
    const m4 = new THREE.Matrix4(), e3 = new THREE.Euler(), q4 = new THREE.Quaternion(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3();
    let tris = 0;
    [11, 23, 37].forEach((seed, k) => {
      const list = items.filter((it, i) => i % 3 === k); if (!list.length) return;
      const design = umbelPlan(seed), geos = TIERS.map((t) => umbelFlesh(design, t).build());
      const spots = list.map((it) => ({ position: [it.x, it.y, it.z] }));
      const meshes = TIERS.map((t, ti) => { const me = kit.instances(geos[ti], ti === 2 ? matFar : mat, spots); me.name = `umbel ${'abc'[k]} ${t}`; me.count = 0; me.visible = false; return me; });
      const mats = list.map((it) => new THREE.Matrix4().compose(p3.set(it.x, it.y, it.z), q4.setFromEuler(e3.set(it.lean[0], it.turn, it.lean[1])), s3.setScalar(it.scale)));
      const cols = list.map((it) => new THREE.Color(it.tint));
      const set = { list, meshes, mats, cols, level: new Uint8Array(list.length).fill(9), live: [0, 0, 0], tris: geos.map((g) => g.index.count / 3) };
      // the far weight: not in the picture without the water, and a little over half of it in the mirror
      if (!everywhere) {
        const far = meshes[2];
        far.onBeforeRender = (renderer) => { if (renderer.getRenderTarget() === eng.pre) far.count = 0; else if (eng.reflecting) far.count = Math.ceil(set.live[2] * 0.55); };
        far.onAfterRender = () => { far.count = set.live[2]; };
      }
      umbelSets.push(set);
      tris += list.length * set.tris[2];
    });
    const weightAt = (d) => (d < REACH[0] ? 0 : d < REACH[1] ? 1 : 2);
    // (every plant changes weight at a distance of its own, three metres either way, so that the change never
    // crosses the growth as a line that the rider could watch coming)
    const own = (i) => ((i * 0.6180339887) % 1 - 0.5) * 3;
    const _c = new THREE.Color();
    sortUmbels = () => {
      const bx = ctx.boat.x, bz = ctx.boat.z;
      for (const set of umbelSets) {
        let dirty = false;
        for (let i = 0; i < set.list.length; i++) {
          const it = set.list[i], d = Math.hypot(it.x - bx, it.z - bz) + own(i), was = set.level[i];
          const now = forced >= 0 ? forced : (was <= 2 && was >= weightAt(d - SLACK) && was <= weightAt(d + SLACK) ? was : weightAt(d));
          if (now !== was) { set.level[i] = now; dirty = true; }
        }
        if (!dirty) continue;
        const k = [0, 0, 0];
        for (let i = 0; i < set.list.length; i++) { const lv = set.level[i], me = set.meshes[lv]; me.setMatrixAt(k[lv], set.mats[i]); me.setColorAt(k[lv], set.cols[i]); k[lv]++; }
        set.meshes.forEach((me, lv) => { set.live[lv] = k[lv]; me.count = k[lv]; me.visible = k[lv] > 0; me.instanceMatrix.needsUpdate = true; if (me.instanceColor) me.instanceColor.needsUpdate = true; });
      }
    };
    lists.umbel = { count: items.length, triangles: tris, meshes: umbelSets.flatMap((s) => s.meshes) };
    // (for whoever lights or lands on them; and gust(k): every plant's stir in the air times k, for the evening air at s 70: gust(3), and back to gust(1))
    shared.plants = { umbels: items.map((it) => ({ x: it.x, y: it.y, z: it.z })), gust: (k = 1) => { for (const [u, rest] of airs) u.value = rest * k; } };
  }

  // ---------------------------------------------------------------------------------------------- grass tips
  // (The page counts blades: 6,000. Tufts of five to seven stand round the trees and along the edge of the sailable
  // water; tufts of three long blades fill the growth beyond.)
  {
    const n = kit.count(Math.round(plan.count.grassTips / 6));
    const tintOf = () => ['#ffffff', '#e9f0ea', '#f3efe4'][Math.floor(rnd() * 3)];
    const items = [], put = (list, p, k = 1) => list.push({ x: p[0], y: -0.02 - rnd() * 0.06, z: p[1], turn: rnd() * TAU, lean: [(rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.2], scale: [0.8 + rnd() * 0.5, (0.6 + rnd() * 0.9) * k, 0.8 + rnd() * 0.5], tint: tintOf() });
    for (let i = 0; i < Math.round(n * 0.52); i++) put(items, round(trees[i % trees.length], 0.38, 1.65));
    for (let i = 0; i < Math.round(n * 0.1); i++) put(items, round(farTrees[i % farTrees.length], 0.4, 1.8));
    for (let i = 0; i < Math.round(n * 0.32); i++) put(items, marginAt(28.8, 33.5, 1.2), 1.3);
    for (let i = 0; i < Math.round(n * 0.06); i++) put(items, wallFoot());
    // (fine blades, kept out of the painter's filter: at their true width it wiped them out, so they used to be made four fingers wide)
    // (grass is a grey teal here, never a leaf green: the key painting has no saturated green anywhere; and it takes
    // two thirds of a lantern's light off again, because amber on green paint is a crayon yellow-green beside the boat)
    const dimLantern = { light: `{ vec3 grL = ownColour * pointLight(uLanternPos, uLanternColor, uLanternRadius, N);
      c += mix(grL, dot(grL, vec3(0.3, 0.5, 0.2)) * vec3(0.95, 1.0, 0.97), 0.65) * 0.3 - grL; }` };      // (a third of it, and that greyed: teal paint in amber light is olive, and at blue hour the grass beside the boat was the greenest thing in the orchard. Off the paint's OWN colour: the hour darkens paint and gives a lamp's light back on the paint's own colour, so what was taken off the darkened paint left most of it)
    const opts = { color: '#ffffff', side: THREE.DoubleSide, vertexColors: true, brush: 0.2, shade: 0.7, crisp: true, extend: [moves(-0.3, 0.3, 0.45, 1, 0.008), dimLantern] };
    // (the tufts at the trees' feet are the tussocks' own blades, shorter and closer: one curve each. They were polylines of three stretches: seen from a metre, bent pipes)
    if (Q.get('longgrass') === '0') instanced('grass_tip', [3, 7, 13].map((sd, k) => grassTuft(sd, { blades: 7 + k, tall: 0.34 + 0.05 * k, width: 0.0055, lo: '#1b3238', hi: '#547579', out0: 0.05 }).build()), items, opts, 'above', 42);
    else instanced('grass_tip', [3, 7, 13].map((sd, k) => grassLong(sd, { long: 5 + k, short: 4, tall: 0.4 + 0.05 * k, width: 0.0056, lo: '#1b3238', hi: '#547579' }).build()), items, opts, 'above', 42);
    const far = [], nf = kit.count(Math.round(plan.count.grassTips * 0.5));       // (the long grass a hull cannot push through: thickest at the edge of the sailable water)
    for (let i = 0; i < nf; i++) put(far, marginAt(29.6, 45, 2.0), 1.6);
    // TUSSOCKS (grassLong, above): four designs, each its own size and turn. A tussock is no longer stretched tall (a tuft
    // a span high drawn out to a metre was four poles); its own blades are long. Their sizes and leans come from a
    // stream of their own, so that everything placed after this stands where it stood.
    const rg = ctx.rng(7331);
    for (const it of far) { const s = 0.8 + rg() * 0.42; it.scale = [s, s * (0.85 + rg() * 0.3), s]; it.lean = [(rg() - 0.5) * 0.16, (rg() - 0.5) * 0.16]; }
    if (Q.get('longgrass') === '0') instanced('grass_far', [19, 29, 31].map((sd) => grassTuft(sd, { blades: 4, tall: 0.44, lo: '#1c3239', hi: '#5b7d80', width: 0.0046, reach: 0.3, droop: 0.55, stretches: 3, out0: 0.09 }).build()), far.map((it) => ({ ...it, scale: [it.scale[0], it.scale[1] * 1.6, it.scale[2]] })), opts, 'above', 50);      // (developer: the tufts as they were, to compare)
    else instanced('grass_far', [19, 31, 43, 55].map((sd, k) => grassLong(sd, LONG_GRASS[k]).build()), far, { ...opts, extend: [moves(-0.3, 0.62, 0.45, 1, 0.026), dimLantern] }, 'above', 50);      // (a tussock bends from the water to its tips, which stir an inch in the evening's air: at a third of an inch a field of long grass stood like wire)
  }

  // ---------------------------------------------------------------------------------------------- narcissus on the mounds
  // The page: "on every planting mound ... clumps of narcissus still in flower. They have no light of their own; inside
  // the prow lantern's reach they come up pale gold for as long as the boat is near."
  // Five or six clumps to a tree (the page's 600), on the mound's shoulder (0.6 to 1.4 m from the trunk: where a hull comes by, and clear of
  // the collar of petals that lies thickest against the bole), each of five to seven flowers held a hand under the
  // surface whatever depth it stands in (three designs of three heights: the mound falls away from its trunk). They
  // are seen between the floating petals and wherever a hull has parted them.
  // GOLD IN THE LANTERN: under a roof of blossom the water's face is a pale mirror and a cream flower a hand under it
  // is lost in that (they were two orange specks beside a trunk, with the lantern on them). So their petals and cups
  // answer the BOW LANTERN, and no other light, three and a half times as strongly as paint does, and hold hardly any
  // of the dusk: dim shapes under the petals until the boat comes, pale gold while it is there, gone again behind it.
  // (Measured by eye beside a trunk and from three and a half metres, with the petals and without: at 1.4 they were
  // still cream ghosts; at 7 they bloomed through the water like lamps.)
  // &gold=<x> (developer): how much more of the lantern they give back (2.6; 0: as plain paint).
  // And none of them is drawn beyond thirteen metres from the boat: nothing under this water can be seen from further.
  {
    const n = kit.count(plan.count.narcissus), M = plan.water.mound, bed = plan.water.bed, R = M.across / 2 * 1.25;
    for (let i = 0, was = kit.count(Math.round(plan.count.narcissus * 0.7)) * 6; i < was; i++) rnd();      // (the placing stream kept in step with what this block drew from it before: the islet's turf, its bluebells and the meadow, placed after it, stand where they stood)
    const rn = ctx.rng(6217), TALL = [0.24, 0.34, 0.46], items = [], NARC_UP = +(Q.get('narcup') || 0);      // (&narcup=<m>, developer: every clump lifted so much, to look at them out of the water)
    for (let i = 0; i < n; i++) {
      const t = trees[i % trees.length], a = rn() * TAU, r = 0.62 + rn() * 0.75;
      const ground = bed + (M.top - bed) * Math.sqrt(Math.max(0, 1 - (r / R) ** 2));
      const need = (-0.045 - rn() * 0.05) - ground;                 // how far over its foot its highest flower must stand, to lie a hand under the surface
      let design = 0; for (let d = 1; d < TALL.length; d++) if (Math.abs(TALL[d] - need) < Math.abs(TALL[design] - need)) design = d;
      items.push({ x: t.x + Math.cos(a) * r, y: ground - 0.01 + NARC_UP, z: t.z + Math.sin(a) * r, turn: rn() * TAU, scale: Math.min(1.25, Math.max(0.8, need / TALL[design])), design, tint: ['#ffffff', '#f6f1dc', '#eef0e6'][Math.floor(rn() * 3)] });
    }
    const GOLD = Q.has('gold') ? +Q.get('gold') : 2.6;
    const gold = { light: `{ float narPale = smoothstep(0.3, 0.6, max(ownColour.r, max(ownColour.g, ownColour.b)));
      vec3 narL = pointLight(uLanternPos, uLanternColor, uLanternRadius, N);
      c += ownColour * mix(narL, dot(narL, vec3(0.3, 0.5, 0.2)) * vec3(1.5, 1.12, 0.62), 0.6) * (${GOLD.toFixed(2)} * narPale);      // (PALE gold: the lamp's own amber on cream paint, this strong, is an orange-yellow star)
      // NOTHING UNDER THE WATER BLOOMS (the page: "Never: anything under the water"): a clump a metre from the lantern at
      // blue hour shone up through the water like a lamp of its own. Eased in under 0.64, keeping its hue.
      float narM = max(c.r, max(c.g, c.b)); if (narM > 0.46) c *= (0.46 + 0.18 * (1.0 - exp(-(narM - 0.46) / 0.18))) / narM; }` };
    const geos = TALL.map((tall, k) => narcissusClump(5 + 4 * k, tall).build());
    instanced('narcissus', geos, items, { color: '#ffffff', side: THREE.DoubleSide, vertexColors: true, brush: 0.15, shade: 0.5, extend: [moves(-0.75, -0.2, 0.25, 1, 0.006, 0.2), gold] }, 'direct', 13);
  }

  // ---------------------------------------------------------------------------------------------- the islet: grass, and a haze of bluebells
  // The oldest tree's islet is ground the rider comes within two metres of: dark wet grass in tufts all over it,
  // thinning at the shore to tufts that stand in the water, and bluebells in drifts between the roots. Everything is
  // set on the islet's own modelled surface, and nothing grows through a root or through the bole's flare: the
  // surface (the roots' model and the foot of the trunk's) is read once into a grid of heights, and a place that
  // stands more than a hand above the islet's own ground is wood.
  {
    const c = F.at(plan.tree.at[0], plan.tree.at[1]), Tr = shared.tree || {};
    const SIDE = 17, CELL = 0.1, N = Math.round(SIDE / CELL), top = new Float32Array(N * N).fill(-9);
    const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), mat4 = new THREE.Matrix4();
    ctx.group.updateWorldMatrix(true, false);
    const inv = new THREE.Matrix4().copy(ctx.group.matrixWorld).invert();
    const read = (model, below) => {
      if (!model || !model.group) return;
      model.group.updateWorldMatrix(true, true);
      model.group.traverse((o) => {
        if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
        mat4.multiplyMatrices(inv, o.matrixWorld);
        const pos = o.geometry.attributes.position, idx = o.geometry.index, nt = (idx ? idx.count : pos.count) / 3;
        for (let t = 0; t < nt; t++) {
          va.fromBufferAttribute(pos, idx ? idx.getX(t * 3) : t * 3).applyMatrix4(mat4); vb.fromBufferAttribute(pos, idx ? idx.getX(t * 3 + 1) : t * 3 + 1).applyMatrix4(mat4); vc.fromBufferAttribute(pos, idx ? idx.getX(t * 3 + 2) : t * 3 + 2).applyMatrix4(mat4);
          if (Math.min(va.y, vb.y, vc.y) > below) continue;
          const den = (vb.z - vc.z) * (va.x - vc.x) + (vc.x - vb.x) * (va.z - vc.z); if (Math.abs(den) < 1e-9) continue;
          const x0 = Math.max(0, Math.floor((Math.min(va.x, vb.x, vc.x) - c.x + SIDE / 2) / CELL)), x1 = Math.min(N - 1, Math.floor((Math.max(va.x, vb.x, vc.x) - c.x + SIDE / 2) / CELL));
          const z0 = Math.max(0, Math.floor((Math.min(va.z, vb.z, vc.z) - c.z + SIDE / 2) / CELL)), z1 = Math.min(N - 1, Math.floor((Math.max(va.z, vb.z, vc.z) - c.z + SIDE / 2) / CELL));
          for (let iz = z0; iz <= z1; iz++) for (let ix = x0; ix <= x1; ix++) {
            const px = c.x - SIDE / 2 + (ix + 0.5) * CELL, pz = c.z - SIDE / 2 + (iz + 0.5) * CELL;
            const u = ((vb.z - vc.z) * (px - vc.x) + (vc.x - vb.x) * (pz - vc.z)) / den, v = ((vc.z - va.z) * (px - vc.x) + (va.x - vc.x) * (pz - vc.z)) / den, w = 1 - u - v;
            if (u < -0.05 || v < -0.05 || w < -0.05) continue;
            const y = Math.min(below, u * va.y + v * vb.y + w * vc.y), k = iz * N + ix; if (y > top[k]) top[k] = y;
          }
        }
      });
    };
    read(Tr.wood && Tr.wood.roots, 1.2); read(Tr.wood && Tr.wood.trunk, 1.2);
    const layout = (x, z) => { const r = Math.hypot(x - c.x, z - c.z); return r < 2.4 ? 0.5 : r < 4.4 ? 0.5 - (r - 2.4) * 0.09 : r < 6.5 ? 0.32 - (r - 4.4) * 0.143 : 0.02 - (r - 6.5) * 0.52; };
    const groundAt = (x, z) => (Tr.islet && Tr.islet.heightAt ? Tr.islet.heightAt(x, z) : layout(x, z));       // the islet's own ground, without what lies on it
    const topAt = (x, z) => { const ix = Math.floor((x - c.x + SIDE / 2) / CELL), iz = Math.floor((z - c.z + SIDE / 2) / CELL); return ix < 0 || iz < 0 || ix >= N || iz >= N ? -9 : top[iz * N + ix]; };
    /** Where a plant may stand at (x, z): the height of the modelled ground there, or null where wood lies (a root, the bole). */
    const stand = (x, z) => {
      const g = groundAt(x, z); let t = -9;
      for (const [dx, dz] of [[0, 0], [0.09, 0], [-0.09, 0], [0, 0.09], [0, -0.09]]) t = Math.max(t, topAt(x + dx, z + dz));
      if (t > g + 0.085) return null;
      const here = topAt(x, z); return here > -8 ? Math.max(here, g - 0.05) : g;
    };

    // ---- the grass: three designs of tuft, fine blades (they keep out of the painter's filter, which would melt them into the ground)
    {
      const n = kit.count(2300), items = [], shoreAt = (a) => (Tr.islet && Tr.islet.shore ? Tr.islet.shore(a) : 6.5);
      const tintOf = () => ['#ffffff', '#e2ecf0', '#f0efdc', '#d6e2f2', '#eaf2e4'][Math.floor(rnd() * 5)];
      const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
      for (let i = 0, guard = 0; i < n && guard < n * 5; guard++) {
        const a = rnd() * TAU, r = 2.2 + Math.pow(rnd(), 0.75) * 5.0, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
        const y = stand(x, z); if (y === null || y < -0.16) continue;
        const thin = kit.fbm(x * 0.6, z * 0.6, 2, 41);                         // (worn bare in places: under the ladder's foot, where the picker stands)
        if (thin < 0.3 && rnd() < 0.7) continue;
        const wet = y < 0.03;                                                   // at the shore and in the water: taller, sparser
        if (wet && rnd() < 0.45) continue;
        // short turf where it is trodden, long where nobody steps: against a root, at the water's edge, in a few rank clumps
        const rank = wet ? 1.15 : 0.42 + 0.5 * smooth(0.35, 0.7, thin) + (rnd() < 0.08 ? 0.5 : 0);
        items.push({ x, y: y - 0.015, z, turn: rnd() * TAU, lean: [(rnd() - 0.5) * 0.36, (rnd() - 0.5) * 0.36], scale: [0.8 + rnd() * 0.5, rank * (0.75 + rnd() * 0.5), 0.8 + rnd() * 0.5], tint: tintOf() }); i++;
      }
      // (turf drinks the kept lamp's light, as the islet's ground does: heroes.js; and a blade seen edge-on toward the
      // band takes only a breath of its apricot rim, or the whole islet is drawn in orange wire. This stands after
      // shared.dusk, whose uRimC, uWest and ownColour it reads.)
      // (And the BOW lantern's: a boat lying at the islet's shore turned the turf beside it emerald, the one saturated
      // green in the orchard, where the director asked for dark wet grass. It gives back two fifths of it.)
      const drinksLamp = { light: `c -= albedo * pointLight(uLampPos, uLampColor, uLampRadius, N) * 0.45;
        c -= ownColour * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * 0.6;
        { float rimT = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), 3.0) * smoothstep(0.15, 0.8, dot(-V, uWest)) * (1.0 - smoothstep(0.1, 0.34, abs(V.y)));
          c -= uRimC * rimT * (0.3 + 0.7 * ownColour) * 0.8; }` };
      const opts = { color: '#ffffff', side: THREE.DoubleSide, vertexColors: true, brush: 0.2, shade: 0.7, crisp: true, extend: [moves(-99, 0.32, 0, 0, 0.014), drinksLamp] };
      instanced('islet_grass', [43, 47, 53].map((sd, k) => grassTuft(sd, { blades: 7 + k, tall: 0.3 + 0.04 * k, lo: '#11252a', hi: '#2f5c58', under: -0.04, width: 0.0055, reach: 0.1, stretches: 2 }).build()), items, opts, 'above');
    }

    // ---- the bluebells: sprigs in drifts, thickest a little way out from the bole and on the side the boat passes
    {
      const n = kit.count(plan.count.bluebells), items = [];
      for (let i = 0, guard = 0; i < n && guard < n * 12; guard++) {
        const a = rnd() * TAU, r = 2.6 + Math.pow(rnd(), 0.8) * 3.5, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
        if (kit.fbm(x * 0.5, z * 0.5, 2, 7) < 0.47 + 0.08 * rnd()) continue;
        const y = stand(x, z); if (y === null || y < 0.07) continue;
        items.push({ x, y: y - 0.01, z, turn: rnd() * TAU, lean: [(rnd() - 0.5) * 0.25, (rnd() - 0.5) * 0.25], scale: 1.0 + rnd() * 0.55, tint: ['#ffffff', '#eeeaf6', '#e2e6f4'][Math.floor(rnd() * 3)] }); i++;
      }
      const geos = [2, 6, 10].map((sd) => bluebellSprig(sd).build());
      instanced('bluebell', geos, items, { color: '#ffffff', side: THREE.DoubleSide, vertexColors: true, brush: 0.15, shade: 0.7, crisp: true, extend: moves(-99, 0.4, 0, 0, 0.012) }, 'above');
    }
  }

  // ---------------------------------------------------------------------------------------------- the drowned meadow, round the boat
  // Tufts of three blades on the bed in a square of 10 m that goes with the boat (each keeps its own place in the
  // world: the field wraps), combed one way by the water, streaming a little, and only where it can be seen: looking
  // in (the water shows its bed within four to six metres of the eye, no further). The page counts blades: 5,000 to
  // begin with, 8,000 at most; these are 2,600 tufts.
  {
    const n = kit.count(Math.round(plan.count.drownedGrass * 0.52)), SIDE = 10, base = meadowTuft(4).build();
    uMeadow.value.set(SIDE, plan.water.bed + 0.01, 1, 0);       // the field's side, the bed's height, how much of the meadow is here (none under the loft's floor of black water), -
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index; for (const k of ['position', 'normal', 'uv', 'color']) geo.setAttribute(k, base.attributes[k]);
    const off = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) off.set([rnd() * SIDE, rnd() * SIDE, Math.PI + (rnd() - 0.5) * 0.9, 0.65 + rnd() * 0.8], i * 4);      // x, z, its turn (combed west, give or take), its length
    geo.setAttribute('aBlade', new THREE.InstancedBufferAttribute(off, 4));
    geo.instanceCount = n; geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    const mat = shared.paint({ color: '#ffffff', side: THREE.DoubleSide, vertexColors: true, brush: 0.1, shade: 0.35, extend: {
      uniforms: { uField: uMeadow, tRipple: S.tRipple, uRippleRect: S.uRippleRect },
      vertexPars: /* glsl */`attribute vec4 aBlade; uniform vec4 uField; uniform sampler2D tRipple; uniform vec4 uRippleRect;
        vec4 bladeRipple(vec2 xz) { vec2 uv = (xz - uRippleRect.xy) / uRippleRect.zw + 0.5, e = min(uv, 1.0 - uv); return min(e.x, e.y) > 0.0 ? texture2D(tRipple, uv) : vec4(0.0); }`,
      vertexLocal: /* glsl */`{
        vec2 w = mod(aBlade.xy - uBoat.xz + uField.x * 0.5, uField.x) - uField.x * 0.5;
        float edge = (1.0 - smoothstep(uField.x * 0.36, uField.x * 0.48, max(abs(w.x), abs(w.y)))) * uField.z;
        float c = cos(aBlade.z), s = sin(aBlade.z), tip = clamp(transformed.z / 0.5, 0.0, 1.3);
        vec3 q = transformed * vec3(1.0, aBlade.w, aBlade.w) * edge;
        vec2 foot = uBoat.xz + w;
        // it streams: the tip wanders with the slow water and lifts when a wake goes over
        vec4 rp = bladeRipple(foot);
        q.x += tip * tip * (0.06 * sin(uTime * 0.7 + foot.x * 1.3 + foot.y * 0.9) + rp.x * 0.5);
        q.y += tip * tip * (0.035 * sin(uTime * 0.53 + foot.x * 0.7 + foot.y * 1.7) + 0.06 * clamp(rp.w, 0.0, 1.0));
        transformed = vec3(foot.x + q.x * c + q.z * s, uField.y + q.y, foot.y - q.x * s + q.z * c);
        objectNormal = vec3(objectNormal.x * c + objectNormal.z * s, objectNormal.y, -objectNormal.x * s + objectNormal.z * c);
      }`,
      // (a metre of water lies between it and the prow lantern: it takes a third of that light, or the bed shines up through the dark)
      light: 'c -= albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * 0.68;',
    } });
    const field = new THREE.Mesh(geo, mat); field.name = `drowned_grass x${n}`; field.frustumCulled = false;
    ctx.add(field); ctx.only(field, 'direct');
    lists.drowned_grass = { count: n, triangles: n * (base.index.count / 3) };
  }

  // (the islet's turf and bluebells are blades a finger wide: beyond sixty metres they are not drawn at all)
  const isletGrowth = [...((lists.islet_grass || {}).meshes || []), ...((lists.bluebell || {}).meshes || [])], isletAt = F.at(plan.tree.at[0], plan.tree.at[1]);
  shared.counts = { ...(shared.counts || {}), plants: Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, { count: v.count, triangles: v.triangles }])) };

  return {
    update() {
      const b = ctx.boat;
      uHull.value.set(b.x, b.z, Math.sin(b.heading), Math.cos(b.heading));
      sortUmbels();                                              // which weight of flesh each cow parsley plant wears, by how far the boat is
      packNear();                                                // which copies of the small things are within reach of the boat, and so drawn
      // the meadow begins outside the loft's door: under the loft the water is black and there is a floor of mud, not grass
      const hs = shared.here ? shared.here.s : 60, k = Math.min(1, Math.max(0, (hs - 25) / 7));
      uMeadow.value.z = k * k * (3 - 2 * k);
      const seen = Math.hypot(b.x - isletAt.x, b.z - isletAt.z) < 60;
      for (const m of isletGrowth) m.visible = seen;
    },
  };
}
