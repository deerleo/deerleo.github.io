// The landing: the reeds and the close band's standing things (stage 2c's module, the Reeds group:
// docs/build/landing/2-kit-reeds.md). docs/art/landing.md, section 3 (the close band; "Reeds, for the builder") and
// section 9 (kit pieces; multitudes).
//
// EVERYTHING HERE IS THE REAL THING (the layout's stand-ins that stood in this file are gone: those of the reeds were
// regrown in place; those of reedmace, the lamp tuft, iris and the lilies were replaced by kit_plants.js; those of the
// timber kit, the traps and the bundles by kit_pilings.js). In the order of the file:
//
//   reeds             2,400 single stems in a band 1.6 m deep along the right bank, the left bank as far as s 17 (and 12 m
//                     of its cut face) and round the head of the backwater: five kinds (three of last year's gold, each
//                     with a feathered plume that every copy nods, turns and sizes its own way; an old bare one; a broken
//                     one), in clumps that lean out over the water, with this year's shoots at their feet; 9,000 tufts
//                     behind them, thinning over 40 m, three kinds by how deep in the bed (half of them left out of the
//                     mirror), the near ones splayed sheaves; all grown in code. Stems and tufts are drawn nearest the
//                     water first (L.grow's `front`), the stems as lines from 15 m (their plumes stay paint): keep both
//   the reeds' feet   what is lodged where they meet the water: dead blades, a length of stem, a fallen stem, stubs, the
//                     pale rhizome with its rootlets (not in the mirror)
//   cut reed afloat   nine rafts of spilled reed in the staithe's lee and against the jetty (not in the mirror)
//   gossamer          60 threads between gold stems of the right bank, some with caught seed (the engine's hairlines)
//   the far mass      one mesh round the whole area from 41 m out, wearing the `reed` tile, with a fringe of blades
//   the cut fen       3,600 stubble tufts (two kinds), none in the heron's shallows nor in the open lead behind the heron
//                     as the mooring sees it (PLAN.inLead: keep both open)
//   sedge             90 tussocks along the open left edge                                        -> models/landing/sedge.glb
//   hornwort          420 fronds lying along the water a hand under it: in drifts over the deep water, and lodged against
//                     the staithe's posts over the sand (not in the mirror; pressed down under the hull)
//   the ford          44 stones 0.55 m down under the bridge                                      -> models/landing/ford_stone.glb
//   the door          the nine bolts at s 75 and twelve more beyond: the engine's draped cloth, sewn of loom widths
//
// shared.kit = { zone, stems, shoots, stemsAt, stemPoint, tufts, feet, afloat, afloatAt, gossamer, mass, stubble, sedge,
// hornwort, hornwortDrifts, ford, cloth, hull } gives the cast and the staging their places and their meshes (hull: a uniform, the rider's boat as
// x, z, sin and cos of its heading; kit_plants.js and kit_pilings.js add their own to shared.kit after this module).
// stemsAt are the gold stems of kinds a and b only (their plumes' feet are where stemPoint(it, 1) says, whatever the
// plume above does).
// What was grown, with counts and triangles: &counts=1 writes .shots/landing_counts.json.
// Switches for looking: &stems=painted (the far stems under the painter's filter), &plumes=crisp (the far plumes as
// lines), &plumes=same (every plume as its kind was grown), &plumeglow=0.4, &tuftglow=0.2 | off (the light through the
// plumes and the tufts' tassels), &answer=0 (the stems do not answer the hull), &gossamer=3 (its brightness), &door=1
// (the cloth as first dressed), &door=2 (without the bled stain), &seams=0, &pleat=0, &linen=RRGGBB.
import * as THREE from 'three';

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

export async function build(ctx, plan, shared) {
  const { path } = ctx, P = plan, L = shared.landing, C = P.C, R = P.reeds;
  const counts = shared.counts || (shared.counts = {});
  const A = (s, d, y = 0) => P.at(path, s, d, y);
  const gq = {}, fr = {};
  const groundY = (x, z) => P.ground(path, x, z, gq).y;
  const hw = (s) => L.frame(s, fr).halfWidth;
  const windTurn = Math.atan2(-L.wind.value.y, L.wind.value.x);            // the rotation.y that turns a thing's +x down the wind
  const hex = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
  const tint = (rnd, lo = 0.84, hi = 1.12) => { const k = lo + (hi - lo) * rnd(); return new THREE.Color(k, k * (0.96 + 0.06 * rnd()), k * (0.9 + 0.12 * rnd())); };
  const K = shared.kit = {};
  K.hull = { value: new THREE.Vector4(0, 1e5, 0, 1) };      // the rider's boat for shaders of things that float: x, z, sin and cos of its heading (set every frame, below)
  const QS = new URLSearchParams(location.search);          // (&stems=painted: the reed stems under the painter's filter, to compare)

  // ============================================================================================ where reeds stand
  // (PLAN.reedBed: how far into the bed a place is from open water; light.js takes the reeds' shade from the same rule)
  const zone = K.zone = (x, z) => P.reedBed(path, x, z, {});
  const edgeR = (s, h) => P.reedEdgeRight(s, h), edgeL = (s) => P.reedEdgeLeft(s);
  const tallAt = (bed, rnd) => P.reedHeight(bed, rnd());

  // ============================================================================================ reeds
  // GROWN, NOT COUNTED (stage 2, the Reeds group: docs/build/landing/2-kit-reeds.md). The page's numbers and the
  // layout's findings stand (2,400 stems in a band 1.6 m deep, 9,000 tufts thinning over 40 m, both drawn nearest the
  // water first, half the tufts left out of the mirror, the stems drawn as lines from 15 m: 1-layout.md). What is new
  // is that no stem is the stem beside it:
  //   stems    four kinds, each grown at 4 m and scaled to its place: two of last year's gold stems (a finger thick at
  //            the foot, six or seven dry leaves all blown one way, a one-sided plume that nods down the wind), an old
  //            bare one, and a broken one (snapped at half its height, its top hanging). They stand in CLUMPS of three
  //            to seven, each clump leaning out over the water and each stem a little its own way; the old ones lean
  //            across their neighbours; a few have fallen outward and lie over the water
  //   shoots   this year's: three olive spears of 0.9 to 1.6 m with their leaves held up, at the clumps' feet
  //   tufts    two kinds (stalks, nodding plumes, leaves streaming down the wind, a dead blade across the rest)
  // Everything is grown with +x down the wind and turned by `windTurn`: leaves and plumes are all blown one way.
  // Their paint is the area's (L.plant: the wind's travelling lean, the light by height, the sun's fire), with one thing
  // of the kit's own added at the engine's hooks (ANSWER): stems lean away from the hull and shiver when a wake
  // reaches their feet.

  // ---- a small builder for things grown in code: tubes (stems) and ribbons (leaves, tassels, blades), indexed, with a
  // colour at every point and normals that are smooth along each form
  const _t = new THREE.Vector3(), _u = new THREE.Vector3(), _w = new THREE.Vector3(), _ref = new THREE.Vector3(0.31, 0.12, 0.94).normalize(), _ref2 = new THREE.Vector3(0.9, 0.1, 0.42).normalize();
  class Grown {
    constructor() { this.p = []; this.c = []; this.i = []; this.m = []; this.q = []; this.mark = 0; this.pivot = [0, 0, 0]; }      // (mark: a number given to every point made while it is set: aSoft, below; pivot: the point such a part hangs from: aPivot)
    get triangles() { return this.i.length / 3; }
    tri(a, b, c) { this.i.push(a, b, c); return this; }
    v(p, color) { const q = color && color.isColor ? color : new THREE.Color(color); this.p.push(p[0], p[1], p[2]); this.c.push(q.r, q.g, q.b); this.m.push(this.mark); this.q.push(this.pivot[0], this.pivot[1], this.pivot[2]); return this.p.length / 3 - 1; }
    /** A tube of `sides` sides through pts; radii and colours per point; a radius of 0 closes it to a point there. */
    tube(pts, radii, sides, colors) {
      const rings = [];
      for (let k = 0; k < pts.length; k++) {
        const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)], p = pts[k], col = Array.isArray(colors) ? colors[k] : colors, ring = [];
        _t.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
        _u.crossVectors(_t, Math.abs(_t.dot(_ref)) > 0.95 ? _ref2 : _ref).normalize(); _w.crossVectors(_u, _t);
        if (!(radii[k] > 0)) { const i = this.v(p, col); for (let s = 0; s < sides; s++) ring.push(i); }
        else for (let s = 0; s < sides; s++) { const an = s / sides * Math.PI * 2, cs = Math.cos(an) * radii[k], sn = Math.sin(an) * radii[k]; ring.push(this.v([p[0] + _u.x * cs + _w.x * sn, p[1] + _u.y * cs + _w.y * sn, p[2] + _u.z * cs + _w.z * sn], col)); }
        rings.push(ring);
      }
      for (let k = 0; k < rings.length - 1; k++) for (let s = 0; s < sides; s++) { const s2 = (s + 1) % sides, A0 = rings[k][s], B0 = rings[k][s2], C0 = rings[k + 1][s2], D0 = rings[k + 1][s];
        if (C0 === D0) this.i.push(A0, B0, D0); else if (A0 === B0) this.i.push(A0, C0, D0); else this.i.push(A0, B0, C0, A0, C0, D0); }
      return this;
    }
    /** A ribbon through pts, `half` its half width at each across `side` (one unit vector, or one per point); a width of 0 is a point (its tip, or where it begins). */
    ribbon(pts, half, side, colors) {
      let prev = null;
      for (let k = 0; k < pts.length; k++) {
        const sd = Array.isArray(side[0]) ? side[k] : side, col = Array.isArray(colors) ? colors[k] : colors, p = pts[k], h = half[k];
        const cur = h > 0 ? [this.v([p[0] - sd[0] * h, p[1] - sd[1] * h, p[2] - sd[2] * h], col), this.v([p[0] + sd[0] * h, p[1] + sd[1] * h, p[2] + sd[2] * h], col)] : [this.v(p, col)];
        if (prev) { if (prev.length === 2 && cur.length === 2) this.i.push(prev[0], prev[1], cur[1], prev[0], cur[1], cur[0]); else if (prev.length === 2) this.i.push(prev[0], prev[1], cur[0]); else if (cur.length === 2) this.i.push(prev[0], cur[1], cur[0]); }
        prev = cur;
      }
      return this;
    }
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.i);
      g.setAttribute('aSoft', new THREE.Float32BufferAttribute(this.m, 1)); g.setAttribute('aPivot', new THREE.Float32BufferAttribute(this.q, 3));
      g.computeVertexNormals(); g.computeBoundingSphere();
      return g;
    }
  }
  const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  // a leaf: a ribbon that leaves its node up and out, arches, and hangs down the wind. az: its bearing off the wind
  // (+x), len, w: its half width, lift: how steeply it leaves the stem, droop: how far its tip hangs, roll: how its
  // blade is turned about its own length; n: 3 (five triangles) or 2 (three)
  const leaf = (g, o, az, len, w, lift, droop, roll, c0, c1, c2, n = 3, stiff = 0) => {
    const dx = Math.cos(az), dz = Math.sin(az), side = unit([-dz * Math.cos(roll), Math.sin(roll), dx * Math.cos(roll)]);
    // (THIRD LOOK: as a parabola through four points a leaf that left its stem steeply and hung low had an elbow of fifty
    // degrees a third of the way along it and was as wide there as a thumb to within a quarter of its tip: a bank of
    // them seen from two metres was scaffolding, bars with elbows: .shots/landing_kr3_R_1_crop.png. A reed's leaf is a
    // BLADE: it leaves its node at `lift`, runs nearly straight, and comes over toward its tip (the further the lower
    // `droop` hangs it); no bend in it is sharper than half a right angle shared between its joints; it is widest a
    // third of the way along and narrows from there to a point.)
    const t0 = Math.atan(lift), turn = Math.min(n === 3 ? 0.95 : 0.5, Math.max(0.08, (t0 + Math.atan(droop) * 1.3) * (stiff ? 0.5 : 1)));
    const at = (u) => { let x = 0, y = 0; for (let k = 0; k < 8; k++) { const s = (k + 0.5) / 8 * u, th = t0 - turn * Math.pow(s, 1.7); x += Math.cos(th); y += Math.sin(th); } return [o[0] + dx * len * u * x / 8, o[1] + len * u * y / 8, o[2] + dz * len * u * x / 8]; };
    if (n === 3) g.ribbon([o, at(0.3), at(0.64), at(1)], [w * 0.42, w, w * 0.62, 0], side, [c0, c1, c1, c2]);
    else g.ribbon([o, at(0.45), at(1)], [w * 0.5, w, 0], side, [c0, c1, c2]);
  };
  // a plume: a loose one-sided panicle on a rachis q(u), 0..1, that rises out of the stem, arches over down the wind
  // and nods. From the rachis hang `barbs` fine pointed branches, longest about its middle, down and to the lee, each a
  // little its own way across the wind and every third one set across the rest (so that from no side is the plume a
  // line); under the rachis's first two thirds lies the dense heart of the panicle (a narrow vane). Colours: c0 at the
  // rachis (the dark heart), c1 the branches' body, c2 their tips, which is where the light comes through.
  // (SECOND LOOK. As first grown a plume was two broad vanes and five streaks: a paper pennant on a stick, the same
  // pennant on every stem, all level: .shots/landing_kr2_A0.png. A plume is fine things massed, and it hangs.)
  // Every point of a plume is marked (aSoft): it stays paint at every distance (SOFT, below).
  // (THIRD LOOK. As the second look left it a plume was still a comb: a dozen separate teeth, each a finger wide at its
  // foot with a gap to the next, hanging plumb from a level rachis: from two metres, against the sky, strings of yellow
  // pennants, and the same string on every stem: .shots/landing_kr3_R_0.png, _A_0.png. A reed's panicle is a FEATHER.
  // Its branches leave the rachis toward its tip, as close as the barbs of a feather: their feet overlap into one vane,
  // widest about a third of the way along, and only their tips part; they open from the rachis to the lee and down, most
  // at the plume's foot and least at its tip; a few short ones lie forward along its weather side, so it is not bare
  // above. The rachis and the dense heart of the panicle are one narrow vane along it. o.open: how far the branches
  // have opened from the rachis (0.5 a closed spear .. 1.2 a loose flag); o.over: the short ones above.
  // And no two plumes are alike: every point of a plume also carries the point it hangs from (aPivot: the top of its
  // stem), and each copy turns its plume about that point by its own angles and gives it its own size (PLUMES, below).)
  const plume = (g, q, r, c0, c1, c2, o = {}) => {
    const barbs = o.barbs ?? 14, size = o.size ?? 1, heart = o.heart ?? 1, open = o.open ?? 1, over = o.over ?? 3, was = g.mark, wasP = g.pivot; g.mark = 1; g.pivot = q(0);
    const tan = (u) => { const a = q(Math.max(0, u - 0.03)), b = q(Math.min(1, u + 0.03)); return unit([b[0] - a[0], b[1] - a[1], b[2] - a[2] + 1e-6]); };
    { const us = [0, 0.3, 0.62, 1], w = 0.004 + 0.014 * size * heart;
      g.ribbon(us.map(q), [0.004, w, w * 0.8, 0], us.map((u) => { const t = tan(u); return unit([t[1], -t[0], 1e-4]); }), [c0, c0, hex(c0, c1, 0.4), c1]); }
    const barb = (u, D, len, hb, across, cb) => { const c = q(u), b = across ? unit([0.2, 0.1, 1]) : tan(u);
      // (one colour across its foot: a thin triangle with two colours across its two centimetres is drawn, where it is
      // smaller than a pixel, in a colour reckoned far beyond either, and the far bank's crown was peppered with black
      // pixels: .shots/landing_kr2_dots.png. Colour changes ALONG thin things only.)
      g.tri(g.v([c[0] - b[0] * hb, c[1] - b[1] * hb, c[2] - b[2] * hb], cb), g.v([c[0] + b[0] * hb, c[1] + b[1] * hb, c[2] + b[2] * hb], cb), g.v([c[0] + D[0] * len, c[1] + D[1] * len - 0.12 * len, c[2] + D[2] * len], c2)); };
    for (let k = 0; k < barbs; k++) {
      const u = 0.09 + 0.87 * (k + 0.7 * r()) / barbs, T = tan(u), body = Math.pow(Math.sin(Math.PI * (0.14 + 0.8 * u)), 0.7), across = k % 3 === 2;
      const m = Math.min(0.92, (0.42 + 0.3 * r()) * open * (1.15 - 0.4 * u)), N = unit([0.25, -1, (r() - 0.5) * (across ? 1.6 : 0.7)]);      // (it opens from the rachis toward the lee and down)
      barb(u, unit([T[0] * (1 - m) + N[0] * m, T[1] * (1 - m) + N[1] * m, T[2] * (1 - m) + N[2] * m]), (0.12 + 0.13 * r()) * body * size * (across ? 0.75 : 1), (0.02 + 0.014 * r()) * size * (0.55 + 0.45 * body), across, hex(c0, c1, 0.3 + 0.5 * r()));
    }
    for (let k = 0; k < over; k++) { const u = 0.13 + 0.45 * (k + r()) / Math.max(1, over), T = tan(u);
      barb(u, unit([T[0] + 0.1, T[1] + 0.4 + 0.3 * r(), T[2] + (r() - 0.5) * 0.5]), (0.06 + 0.05 * r()) * size, (0.016 + 0.008 * r()) * size, false, hex(c0, c1, 0.5 + 0.4 * r())); }
    g.mark = was; g.pivot = wasP;
  };
  // the colours of a plume: its heart at the rachis, its body, its tips. (As first grown its pale side was the plan's
  // plumeLit, which against the low orange sky of the title view is shown paler AND greener than the sky behind it
  // (#EAC368 on #E7AC50): a row of pale ticks where the page has "reeds blazing to the edge". These are hotter: the
  // key painting's plume against the sun is #F7BC61.)
  const PLUME = (P.grown && P.grown.plume) || ['#9A6426', '#D8943A', '#F4B44E'];
  const SHOOT = (P.grown && P.grown.shoot) || ['#5F7A30', '#93A050'];                 // this year's green: greener than the page's olive, which the shade at the reeds' feet and the warm light turn brown
  const GREY = '#8E826A';                                                              // old reed, a winter and a summer in the weather
  const stemGeometry = (kind, seed) => {
    const g = new Grown(), r = ctx.rng(seed), root = -0.5;
    const gold = (t) => hex(C.reedShade, C.reedStem, 0.2 + 0.8 * t), pale = hex(C.plume, C.plumeLit, 0.6), dry = () => hex('#B88E42', '#D2A650', r()), curl = hex(C.plume, C.straw, 0.5);      // (a dry leaf: honey-buff. Toward the plan's pale plume colour, as first grown, the sunlit leaves were the yellowest things in the picture)
    if (kind === 'shoots') {
      // this year's: three spears, olive, their leaves held up and a little down the wind
      for (let i = 0; i < 3; i++) {
        const a = i * 2.2 + r(), d = 0.05 + 0.12 * r(), bx = Math.cos(a) * d, bz = Math.sin(a) * d, h = [1.5, 1.15, 0.85][i] * (0.9 + 0.2 * r()), lx = bx * 0.5 + 0.06 * h, lz = bz * 0.5;
        const ax = (t) => [bx + lx * t, root + 0.1 + (h - root - 0.1) * t, bz + lz * t], green = hex(SHOOT[0], SHOOT[1], 0.5 * r()), tip = hex(SHOOT[1], C.honey, 0.2);
        g.tube([ax(0), ax(1)], [0.0078, 0.0018], 3, [hex(SHOOT[0], C.oliveShade, 0.4), tip]);
        for (let k = 0; k < 3; k++) { const t = 0.42 + 0.19 * k + 0.05 * r(); leaf(g, ax(t), (k % 2 ? 1 : -1) * (0.5 + 0.7 * r()) + 0.2, (0.36 - 0.07 * k) * (0.85 + 0.3 * r()), 0.013 + 0.004 * r(), 1.1 + 0.6 * r(), 0.05 + 0.2 * r(), (r() - 0.5) * 1.2, green, green, tip, 2, 1); }
      }
      return g.build();
    }
    if (kind === 'broken') {
      // snapped at half its height: the foot stands, the top hangs from the break down the wind, its plume still on it
      const ax = (t) => [0.05 * t * t + 0.02 * Math.sin(t * 5 + seed), root + (1.95 - root) * t, 0.02 * Math.sin(t * 4 + seed)], K0 = ax(1);
      g.tube([ax(0), ax(0.5), K0], [0.011, 0.0098, 0.0086], 3, [gold(0), gold(0.3), gold(0.5)]);
      const hang = [K0, [K0[0] + 0.2, K0[1] + 0.06, K0[2] + 0.02], [K0[0] + 0.74, K0[1] - 0.5, K0[2] + 0.1], [K0[0] + 1.12, K0[1] - 1.2, K0[2] + 0.13]];
      g.tube(hang, [0.0082, 0.0074, 0.0056, 0.003], 3, [gold(0.5), gold(0.6), gold(0.85), gold(1)]);
      const E = hang[3]; plume(g, (u) => [E[0] + 0.12 * u + 0.05 * u * u, E[1] - 0.36 * u, E[2] + 0.02 * u], r, PLUME[0], PLUME[1], PLUME[2], { barbs: 8, size: 0.85, heart: 0.8, open: 0.8, over: 0 });
      leaf(g, hang[2], 0.3, 0.42, 0.016, -0.4, 0.5, 0.6, gold(0.8), dry(), curl, 2); leaf(g, [K0[0] + 0.45, K0[1] - 0.22, K0[2] + 0.06], -0.5, 0.38, 0.015, -0.2, 0.6, -0.5, gold(0.8), dry(), curl, 2);
      leaf(g, ax(0.78), 0.2, 0.46, 0.017, 0.7, 0.35, 0.4, gold(0.4), dry(), curl, 3);
      return g.build();
    }
    if (kind === 'old') {
      // a bare stem of the year before last: grey, its plume worn to two tassels, two dead leaves hanging down it
      const ax = (t) => [0.3 * t * t + 0.05 * t * Math.sin(t * 4.1 + seed), root + (3.55 - root) * t, 0.04 * t * Math.sin(t * 3 + seed)], grey = (t) => hex(gold(t), GREY, 0.45), top = ax(1);
      g.tube([ax(0), ax(0.45), top], [0.0105, 0.0088, 0.004], 3, [grey(0), grey(0.45), grey(1)]);
      plume(g, (u) => [top[0] + 0.22 * u, top[1] + 0.1 * u - 0.16 * u * u, top[2]], r, hex(PLUME[0], GREY, 0.5), hex(PLUME[1], GREY, 0.45), hex(PLUME[2], GREY, 0.35), { barbs: 5, size: 0.7, heart: 0.2, open: 1.1, over: 0 });      // (worn to a few threads)
      for (let k = 0; k < 3; k++) leaf(g, ax(0.5 + 0.15 * k + 0.05 * r()), (r() - 0.5) * 2.4, 0.4 + 0.2 * r(), 0.014 + 0.005 * r(), -0.9 - 0.8 * r(), 0.55 + 0.3 * r(), (r() - 0.5) * 2, grey(0.6), hex(dry(), GREY, 0.35), hex(curl, GREY, 0.3), k < 2 ? 3 : 2);
      return g.build();
    }
    // last year's gold: 'a' seven leaves, 'b' six, more bowed, a longer plume that nods lower. The two lowest leaves of
    // each are dead and hang down the stem, twisted; the rest stream down the wind, the largest about the middle
    // (THIRD LOOK: a third, 'c': five leaves, a stem that sways back before it comes over, its plume not yet come down:
    // a closed spear standing up the wind's way. Three gold stems, and each copy's plume its own: PLUMES, below.)
    const isB = kind === 'b', isC = kind === 'c', nL = isB ? 6 : isC ? 5 : 7, bow = isB ? 0.26 : isC ? 0.2 : 0.13, top = 3.74;
    const ax = (t) => [bow * t * t - (isC ? 0.14 * Math.sin(t * 3.0) : 0) + 0.035 * t * Math.sin(t * 4.6 + seed), root + (top - root) * t, 0.03 * t * Math.sin(t * 3.3 + seed * 1.7) + (isC ? 0.05 * Math.sin(t * 5.2) : 0)], P3 = ax(1);
    // the rachis: up out of the stem, over, and down the wind (a curve through three points)
    const R1 = isB ? [0.15, 0.2, 0.01] : isC ? [0.05, 0.2, 0] : [0.1, 0.21, 0], R2 = isB ? [0.5 + 0.06 * r(), -0.1, 0.03] : isC ? [0.24 + 0.05 * r(), 0.3, 0.02] : [0.42 + 0.05 * r(), 0.07, 0.02];
    const q = (u) => [P3[0] + 2 * u * (1 - u) * R1[0] + u * u * R2[0], P3[1] + 2 * u * (1 - u) * R1[1] + u * u * R2[1], P3[2] + 2 * u * (1 - u) * R1[2] + u * u * R2[2]];
    if (isC) g.tube([ax(0), ax(0.3), ax(0.64), P3], [0.011, 0.0098, 0.0082, 0.0048], 3, [gold(0), gold(0.3), gold(0.65), gold(1)]);
    else g.tube([ax(0), ax(0.42), P3], [0.011, 0.0093, 0.0048], 3, [gold(0), gold(0.45), gold(1)]);
    for (let i = 0; i < nL; i++) {
      const t = 0.3 + 0.62 * (i + 0.6 * r()) / nL, big = i >= 2 && i <= (isB ? 4 : 3), small = 1 - 0.4 * t * t;
      if (i < (isB ? 1 : 2)) { const c = hex(dry(), GREY, 0.3 + 0.3 * r()); leaf(g, ax(t), (r() - 0.5) * 2.2, 0.3 + 0.22 * r(), 0.011 + 0.006 * r(), -0.7 - 0.8 * r(), 0.3 + 0.35 * r(), (r() - 0.5) * 2.6, gold(t), c, hex(curl, GREY, 0.3), 2); continue; }
      // (a long blade, narrower toward the top of the stem: as wide at the plume as at the middle, and three triangles
      // long, the upper leaves were yellow pennants: .shots/landing_kr2_p4b_crop.png)
      leaf(g, ax(t), (i % 2 ? 0.25 : -0.25) + (r() - 0.5) * 0.9, (0.5 + 0.34 * r()) * small, (0.011 + 0.006 * r()) * (0.55 + 0.45 * small) * (big ? 1 : 0.8), 0.25 + 0.65 * r(), 0.15 + 0.45 * r(), (r() - 0.5) * 1.7, gold(t), dry(), curl, 3);
    }
    plume(g, q, r, PLUME[0], PLUME[1], PLUME[2], isB ? { barbs: 15, size: 1.08, open: 1.1 } : isC ? { barbs: 11, size: 0.92, open: 0.6, over: 4 } : { barbs: 13, size: 1, open: 0.9 });
    return g.build();
  };
  // ---- a tuft of the mass behind them. Three kinds, by how far into the bed it stands (SECOND LOOK: as first grown every
  // tuft of the nine thousand was the same 22 triangles, and those behind the front rank, which the rider sees from five
  // metres, showed their one-triangle leaves as yellow pennants: .shots/landing_kr2_R1.png. The triangles are now spent
  // where they are seen):
  //   'a', 'b'  within NEAR metres of the water: four stalks, each with a plume (an arched tassel as wide as a hand, a lens
  //             along a rachis that rises, goes over and nods, with two threads hanging from it), two long leaves
  //             streaming down the wind, and in 'a' a dead blade across the rest: 44 and 42 triangles
  //   'far'     deeper in: three stalks and their tassels, 18 triangles. From the water only their tops are ever seen: in
  //             their thousands they are the bed's golden crown
  const tuftGeometry = (kind, seed) => {
    const g = new Grown(), r = ctx.rng(seed), root = -0.3, far = kind === 'far', n = far ? 3 : 4;
    for (let i = 0; i < n; i++) {
      // (THIRD LOOK: the near tufts' stalks were four straight strips of one height that all leaned one way, and a bank of
      // them seen from the mooring, two metres off and from below, was a comb: .shots/landing_kr3_A_0.png. A tuft is a
      // sheaf: its stalks splay from its foot, some far enough to cross their neighbours'; each is bowed its own way; one
      // stands to the bed's full height and the rest to every height above the rider's head, so that plumes hang at
      // every level of the bed and not along one line.)
      const a = r() * 6.28, d = 0.07 + 0.3 * r(), bx = Math.cos(a) * d, bz = Math.sin(a) * d, h = far || i === 0 ? 3.2 + 0.8 * r() : 2.5 + 1.5 * r();
      const spl = far ? 1.5 : 1.0 + 3.2 * r() * r(), tx = bx * spl + 0.2 + 0.44 * r(), tz = bz * spl + (r() - 0.5) * (far ? 0.16 : 0.6), w = 0.019 + 0.011 * r(), sa = r() * Math.PI, side = [Math.cos(sa), 0, Math.sin(sa)];
      const c0 = hex(C.reedShade, C.reedStem, 0.15 + 0.3 * r()), c1 = hex(C.reedStem, C.plume, 0.5 * r());
      let M = null, UM = 1;                                                       // (its bow: the point its middle stands at, and how far up it that is)
      if (far) g.ribbon([[bx, root, bz], [tx, h, tz]], [w, w * 0.34], side, [c0, c1]);
      else { const ba = r() * 6.28, bw = 0.04 + 0.13 * r(); UM = 0.42 + 0.2 * r(); M = [bx + (tx - bx) * UM + Math.cos(ba) * bw, root + (h - root) * UM, bz + (tz - bz) * UM + Math.sin(ba) * bw];
        g.ribbon([[bx, root, bz], M, [tx, h, tz]], [w, w * 0.72, w * 0.34], side, [c0, hex(c0, c1, 0.5), c1]); }
      const pl = 0.36 + 0.2 * r(), pw = 0.034 + 0.02 * r(), nod = 0.04 + 0.2 * r(), zs = (i % 2 ? 1 : -1) * (0.2 + 0.4 * r()), ps = unit([0.1, 0.92, zs]), zo = 0.05 * zs;
      const T = [[tx, h - 0.02, tz], [tx + pl * 0.3, h + 0.26 * pl - pw * 0.5, tz + zo * 0.3], [tx + pl * 0.68, h + 0.2 * pl - nod * 0.4 - pw * 0.6, tz + zo * 0.7], [tx + pl, h - nod - 0.1 * pl, tz + zo]];
      g.mark = 1;
      g.ribbon(T, [0, pw, pw * 0.86, 0], ps, [PLUME[0], hex(PLUME[0], PLUME[1], 0.7), hex(PLUME[1], PLUME[2], 0.5), PLUME[2]]);
      if (!far) for (const k of [1, 2]) { const p = T[k], len = 0.1 + 0.09 * r(), dd = unit([0.25 + 0.3 * r(), -1, (r() - 0.5) * 0.9]), cb = hex(PLUME[0], PLUME[1], 0.6);      // two threads of the panicle, hanging
        g.tri(g.v([p[0] - 0.012, p[1] - pw * 0.7, p[2]], cb), g.v([p[0] + 0.012, p[1] - pw * 0.7, p[2]], cb), g.v([p[0] + dd[0] * len, p[1] - pw * 0.7 + dd[1] * len, p[2] + dd[2] * len], PLUME[2])); }
      g.mark = 0;
      if (!far && i < 2) { const t = 0.5 + 0.36 * r(), B0 = [bx, root, bz], T0 = [tx, h, tz], o = t <= UM ? B0.map((v, j) => lerp(v, M[j], t / UM)) : M.map((v, j) => lerp(v, T0[j], (t - UM) / (1 - UM)));      // (on the bowed stalk, not on the straight line from its foot to its top)
        leaf(g, o, (r() - 0.5) * 0.9, 0.45 + 0.3 * r(), 0.012 + 0.006 * r(), 0.2 + 0.6 * r(), 0.15 + 0.4 * r(), (r() - 0.5) * 1.6, c1, hex('#B88E42', '#D2A650', r()), hex(C.plume, C.straw, 0.5), 3); }
    }
    if (kind === 'a') { const dead = hex(C.reedShade, GREY, 0.5); g.ribbon([[-0.1, root, 0.05], [0.5 + 0.4 * r(), 1.5 + 0.9 * r(), (r() - 0.5) * 0.7]], [0.017, 0.005], [0, 0, 1], [dead, dead]); }
    return g.build();
  };
  // ---- the reeds' feet: what lies lodged among the stems where they meet the water (the close band: a rider drifting
  // along the bank looks down into this). Dead leaves and lengths of old stem afloat, a fallen stem with one end still
  // up on its neighbours and the other under water, the hollow stubs of two that broke off at the surface, and the pale
  // roots sprawling under it
  const footGeometry = (seed) => {
    // (SECOND LOOK: as first laid the litter was the palest thing at the reeds' feet, four times as light as the stems it
    // lay among (they wear the area's plant paint, which darkens a reed's foot; this does not), and every piece of it
    // straight and of one width: pick-up sticks, .shots/landing_kr2_F0.png. Dead reed afloat is wet and brown; a leaf
    // is a blade, curled; a length of stem lies half under.)
    const g = new Grown(), r = ctx.rng(seed), straw = () => hex('#7C6A44', '#6A6250', r()), wet = (c) => hex(c, C.tea, 0.6);
    // afloat: three dead leaves, curled blades lying together against the stems that hold them
    for (let i = 0; i < 3; i++) {
      const a = 0.7 * i + r() * 1.2 + seed, len = 0.26 + 0.34 * r(), ox = (r() - 0.5) * 0.4, oz = (r() - 0.5) * 0.4, dx = Math.cos(a), dz = Math.sin(a), bend = (r() - 0.5) * 0.34, w = 0.011 + 0.01 * r(), c = straw(), y = 0.008 + 0.012 * r();
      const at = (u) => [ox + dx * len * (u - 0.5) - dz * bend * Math.sin(u * 3.14), y + 0.02 * Math.max(0, u - 0.7), oz + dz * len * (u - 0.5) + dx * bend * Math.sin(u * 3.14)];
      g.ribbon([at(0), at(0.3), at(0.68), at(1)], [0, w, w * 0.8, 0], [-dz, 0, dx], [wet(c), c, hex(c, '#9A8A5C', 0.5 * r()), wet(c)]);
    }
    // a length of old stem afloat, half under, a little bent
    { const a = r() * 6.28, len = 0.45 + 0.5 * r(), ox = (r() - 0.5) * 0.3, oz = (r() - 0.5) * 0.3, dx = Math.cos(a), dz = Math.sin(a), k = (r() - 0.5) * 0.08, c = hex('#8A7240', GREY, 0.5 * r());
      g.tube([[ox - dx * len / 2, -0.004, oz - dz * len / 2], [ox - dz * k, 0.004, oz + dx * k], [ox + dx * len / 2, -0.012, oz + dz * len / 2]], [0.0075, 0.008, 0.0065], 3, [wet(c), c, wet(c)]); }
    // a fallen stem, one end still up on its neighbours, the other under water
    { const a = r() * 6.28, len = 0.5 + 0.5 * r(), ox = (r() - 0.5) * 0.3, oz = (r() - 0.5) * 0.3, dx = Math.cos(a), dz = Math.sin(a), c = hex('#94783E', GREY, 0.4 * r()), top = 0.06 + 0.16 * r(), k = (r() - 0.5) * 0.12;
      g.tube([[ox, top, oz], [ox + dx * len * 0.55 - dz * k, top * 0.25 - 0.012, oz + dz * len * 0.55 + dx * k], [ox + dx * len, -0.1, oz + dz * len]], [0.008, 0.0072, 0.0065], 3, [c, hex(c, C.tea, 0.3), wet(c)]); }      // (it sags where the water takes its weight)
    // the hollow stubs of two that broke off at the surface
    for (let i = 0; i < 2; i++) {
      const x = (r() - 0.5) * 0.5, z = (r() - 0.5) * 0.5, h = 0.05 + 0.15 * r(), c = hex(C.reedShade, C.reedStem, 0.3 * r());
      g.tube([[x, -0.3, z], [x + 0.06 * (r() - 0.5), h, z + 0.06 * (r() - 0.5)]], [0.011, 0.0095], 3, [wet(c), c]);
    }
    // the rhizome: reed spreads by a pale creeping stem as thick as a thumb, a hand under the water at the bed's washed
    // edge, jointed, with a fringe of roots hanging from every joint. (THIRD LOOK: as first laid the roots were three
    // pale straight spears thrown under each foot, the palest things in the water: pick-up sticks again,
    // .shots/landing_kr3_F_0.png. One rhizome, bent, wandering out from among the stems and back; from two of its
    // joints a tuft of rootlets that hang and trail; and at its end the pale spike of next year's shoot, turned up.)
    { const a = r() * 6.28, len = 0.5 + 0.4 * r(), ox = (r() - 0.5) * 0.3, oz = (r() - 0.5) * 0.3, dx = Math.cos(a), dz = Math.sin(a), bend = (r() - 0.5) * 0.36, y0 = -0.05 - 0.05 * r();
      // (one slow bow in plan and one slow dip: sampled at four points with a quick wave in it, it was a bent wire)
      const at = (u) => [ox + dx * len * (u - 0.5) - dz * bend * Math.sin(u * 3.14) * len, y0 - 0.025 * Math.sin(u * 2.6 + seed), oz + dz * len * (u - 0.5) + dx * bend * Math.sin(u * 3.14) * len];
      const pale = ['#D9CBA2', '#CDBD90', '#C4B282', '#D6C89C'].map((c) => hex(c, C.tea, 0.12 * r()));
      const tip = at(1), near = at(0.93), up = [tip[0] + (tip[0] - near[0]) * 1.6, tip[1] + 0.03, tip[2] + (tip[2] - near[2]) * 1.6];      // (next year's shoot: a pale spike, only a little turned up: turned up short it was a tick)
      g.tube([at(0), at(0.2), at(0.4), at(0.6), at(0.8), tip, up], [0.005, 0.011, 0.012, 0.0115, 0.011, 0.0095, 0], 3, [hex(pale[0], C.tea, 0.4), pale[0], pale[1], pale[2], pale[1], pale[3], '#E4DCB4']);
      for (const u of [0.4, 0.8]) { const o = at(u);
        for (let k = 0; k < 3; k++) { const b = r() * 6.28, l = 0.09 + 0.1 * r(), hx = Math.cos(b) * 0.05, hz = Math.sin(b) * 0.05;
          g.ribbon([o, [o[0] + hx * 0.6, o[1] - l * 0.55, o[2] + hz * 0.6], [o[0] + hx * 1.5 + 0.02, o[1] - l, o[2] + hz * 1.5]], [0.0045, 0.003, 0], [Math.cos(b + 1.57), 0, Math.sin(b + 1.57)], ['#C9BB90', '#A89A72', '#7E7054']); } }
    }
    return g.build();
  };
  // ---- ANSWER: what the reeds do when the boat comes. A stem within 1.8 m of the hull leans away from it, most where
  // it is touched (its plume a third of its height aside), falling with the square of height, and comes back as the
  // hull leaves; and when a wake reaches its foot (the water's ripple field) it shivers. Added to the area's own plant
  // paint AFTER it, at the engine's hooks (src/engine/gouache.js keeps its `//@hook` marks in the finished shader for
  // exactly this), so the wind and the light stay light.js's.
  const answer = (tall) => (QS.get('answer') === '0' ? {} : {      // (&answer=0: without it, to measure what it costs)
    uniforms: { uKHull: K.hull, uKTall: { value: tall } },
    vertexPars: /* glsl */`uniform vec4 uKHull, uRippleRect; uniform float uKTall; uniform sampler2D tRipple;`,
    vertexWorld: /* glsl */`
      {
        #ifdef USE_INSTANCING
          vec2 kRoot = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xz;
        #else
          vec2 kRoot = wp.xz;
        #endif
        vec2 kRel = kRoot - uKHull.xy, kFwd = vec2(-uKHull.z, -uKHull.w);
        vec2 kOff = kRel - kFwd * clamp(dot(kRel, kFwd), -1.5, 1.9); float kD = length(kOff);
        float kNear = 1.0 - smoothstep(0.85, 2.6, kD), kH = clamp(wp.y / uKTall, 0.0, 1.25), kTop = kNear * kNear * 0.5 * uKTall;
        wp.xz += (kD > 1e-3 ? kOff / kD : kFwd) * (kTop * kH * kH); wp.y -= 0.667 * kTop * kTop * kH * kH * kH / uKTall;
        vec2 kUv = (kRoot - uRippleRect.xy) / uRippleRect.zw + 0.5;
        float kWake = (kUv.x > 0.01 && kUv.x < 0.99 && kUv.y > 0.01 && kUv.y < 0.99) ? clamp(texture2D(tRipple, kUv).a * 4.0, 0.0, 1.0) : 0.0;
        float kJ = fract(sin(dot(kRoot, vec2(41.31, 289.13))) * 43758.5453);
        wp.xz += vec2(sin(uTime * 12.7 + kJ * 50.0), cos(uTime * 10.9 + kJ * 37.0)) * (0.03 * kH * kWake);
      }`,
  });
  /** Add an extension of the kit's own to a gouache material that is already made (the engine's hooks, after whatever is in them). */
  const also = (mat, ex) => {
    for (const h of ['vertexPars', 'vertexLocal', 'vertexWorld']) if (ex[h]) mat.vertexShader = mat.vertexShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`);
    for (const h of ['fragmentPars', 'albedo', 'light', 'fog', 'final']) if (ex[h]) mat.fragmentShader = mat.fragmentShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`);
    if (ex.uniforms) Object.assign(mat.uniforms, ex.uniforms);
    if (ex.defines) Object.assign(mat.defines, ex.defines);
    mat.needsUpdate = true;
    return mat;
  };
  /** L.grow under the thing's own name (what L.grow makes is named 'standin:<name>'; these are the real thing). */
  const grown = (name, geometry, material, list, o) => { const meshes = L.grow(name, geometry, material, list, o); for (const m of meshes) m.name = name; counts[name] = { count: list.length, triangles: Math.round(list.length * (geometry.index ? geometry.index.count : geometry.attributes.position.count) / 3), ...(o && o.mirror === false ? { mirror: false } : {}) }; return meshes; };
  // which way the open water lies from a place in the bed, and a lean toward a place in the world for one copy
  const fr2 = {}, outward = (zn) => { const f = L.frame(zn.s, fr2); return zn.side === 'right' ? [-f.rx, -f.rz] : zn.side === 'left' ? [f.rx, f.rz] : [f.tx, f.tz]; };
  const leanTo = (it, wx, wz, ang) => { const c = Math.cos(it.turn), s = Math.sin(it.turn), xl = wx * c - wz * s, zl = wx * s + wz * c; it.tiltZ = (it.tiltZ || 0) - xl * ang; it.tiltX = (it.tiltX || 0) + zl * ang; return it; };

  // the single stems of the water's edge are kept out of the painter's filter from 15 m off (crispFrom): a stem is one
  // pixel wide at 20 m, and the filter, which wipes out whatever is thinner than its brush, turned the far front rank
  // into a smear with blots of plume on top. Nearer than 7 m they are paint, as everything is; and the tufts behind
  // them stay paint at every distance: the mass is painted, the rank in front of it is drawn. (&stems=painted: as it was)
  // SOFT: but their PLUMES stay paint at every distance (every point of a plume carries aSoft): drawn as lines, the far
  // rank's plumes were pale ticks on wires; painted, they are a row of soft gold dabs, which is what a painter puts along
  // the top of a reed bed. (&plumes=crisp: as it was)
  // (and the paint of a thing thinner than a pixel is kept above nothing: where the picture's sample lies outside a thin
  // triangle its colour is reckoned on beyond the triangle's own, and can pass zero)
  // PLUMES: and no plume is its neighbour's. Every copy turns its plume about the top of its own stem (aPivot): it nods
  // further or less far (about the wind's cross axis), stands off the wind's line to one side or the other (about the
  // upright), and is two thirds to four thirds the size, each from a number of the copy's own place. One geometry a
  // kind, as before; the stem below the plume is not touched (the gossamer and the cast's perches are tied to it).
  // (&plumes=same: every plume as its kind was grown, to compare.)
  const PLUME_GLOW = QS.has('plumeglow') ? +QS.get('plumeglow') : (P.grown && P.grown.plumeGlow) ?? 0.8, TUFT_GLOW = QS.has('tuftglow') ? +QS.get('tuftglow') : (P.grown && P.grown.tuftGlow) ?? 0.5;
  const PLUMES = QS.get('plumes') === 'same' ? '' : /* glsl */`
    #ifdef USE_INSTANCING
      if (aSoft > 0.5) {
        vec2 kI = instanceMatrix[3].xz;
        float kA = fract(sin(dot(kI, vec2(91.7, 37.3))) * 43758.5453), kB = fract(sin(dot(kI, vec2(17.1, 63.9))) * 24634.63), kC = fract(kA * 7.31 + kB * 3.17);
        vec3 kP = (transformed - aPivot) * (0.68 + 0.64 * kC);
        float kN = (kA - 0.4) * 1.0, kT = (kB - 0.5) * 1.3;
        kP.xy = vec2(kP.x * cos(kN) + kP.y * sin(kN), kP.y * cos(kN) - kP.x * sin(kN));
        kP.xz = vec2(kP.x * cos(kT) - kP.z * sin(kT), kP.x * sin(kT) + kP.z * cos(kT));
        transformed = aPivot + kP;
      }
    #endif`;
  // (and a plume is lit as one soft mass, not facet by facet: every branch of it is a flat triangle with a face of its
  // own, and with each lit by its own face a plume seen up the wind was a handful of dark and light flags:
  // .shots/landing_kr3_p4_2_crop.png. Its paint takes the way to the eye for its normal, a little lifted: lit where
  // the sun is behind the rider, half shaded with the light coming through it where the rider looks into the sun
  // (`glow`: that light, beside the paint's own backlight: at 0 a plume against the sun is darker than the sky behind
  // it, a brown rag; at 0.4 it is the sky's own value; at 0.8 the crown of the bank burns, gold, not white: the page's
  // "plumes alight", "reeds blazing to the edge": .shots/landing_kr3_p1_g11_crop.png. PLUME_GLOW the stems' plumes,
  // TUFT_GLOW the tassels of the mass behind them: &plumeglow=, &tuftglow= try others.)
  const softLight = (glow) => ({ fragmentPars: /* glsl */`varying float vKSoft;`,
    albedo: /* glsl */`albedo = clamp(albedo, vec3(0.012, 0.008, 0.003), vec3(1.0)); if (vKSoft > 0.5) N = normalize(0.5 * normalize(uCameraPos - vWPos) + vec3(0.0, 1.0, 0.0));`,
    light: /* glsl */`if (vKSoft > 0.5) c += albedo * uLCream * (pow(max(dot(V, uKeyDir), 0.0), 2.5) * ${glow.toFixed(3)} * mix(0.3, 1.0, lSun));` });
  const SOFT = { ...softLight(PLUME_GLOW), vertexPars: /* glsl */`attribute float aSoft; attribute vec3 aPivot; varying float vKSoft;`, vertexLocal: /* glsl */`vKSoft = aSoft;${PLUMES}`, final: /* glsl */`if (vKSoft > 0.5) gl_FragColor.a = 1.0;` };
  // the tufts of the mass: their tassels take the same soft light (their stalks and leaves are lit as they were)
  const reedPaint = also(also(L.plant({ tall: 4.2, backlight: 0.6 }), answer(4.2)), QS.get('tuftglow') === 'off' ? {} : { ...softLight(TUFT_GLOW), vertexPars: /* glsl */`attribute float aSoft; varying float vKSoft;`, vertexLocal: /* glsl */`vKSoft = aSoft;` });         // (backlight, the page: 0.9; with it every plume is a white speck: 1-layout.md)
  const stemPaint = QS.get('stems') === 'painted' ? reedPaint : also(also(L.plant({ tall: 4.2, backlight: 0.6, crispFrom: [7, 15] }), answer(4.2)), QS.get('plumes') === 'crisp' ? {} : SOFT);
  {
    const rnd = ctx.rng(240), lists = { a: [], b: [], c: [], old: [], broken: [], shoots: [] }, oldTint = new THREE.Color(0.86, 0.84, 0.8);
    // the banks, by length: the right bank, the left bank to s 17, round the head, and the first 12 m of the cut face
    const runs = [
      { len: 58, at: (u, e) => { const s = R.head + u * (R.rightEnd - R.head), f = L.frame(s, fr), d = edgeR(s, f.halfWidth) + e; return [f.x + f.rx * d, f.z + f.rz * d]; } },
      { len: 18, at: (u, e) => { const s = R.head + u * (R.leftTo - R.head), f = L.frame(s, fr), d = -(edgeL(s) + e); return [f.x + f.rx * d, f.z + f.rz * d]; } },
      { len: 20, at: (u, e) => { const f = L.frame(R.head - e, fr), d = -9.6 + u * 19.2; return [f.x + f.rx * d, f.z + f.rz * d]; } },
      { len: 12, at: (u, e) => { const f = L.frame(R.leftTo - e, fr), d = R.leftFrom - u * 12; return [f.x + f.rx * d, f.z + f.rz * d]; } },
    ], total = runs.reduce((a, b) => a + b.len, 0), SH = (P.grown && P.grown.shoots) ?? 700;
    for (const run of runs) {
      const want = Math.round(R.stems * run.len / total), wantShoots = Math.round(SH * run.len / total);
      let n = 0, ns = 0;
      for (let tries = 0; n < want && tries < want * 3; tries++) {
        // a clump: three to seven stems that grew from one length of rhizome, leaning together out over the water
        const [cx, cz] = run.at(rnd(), -0.2 + rnd() * R.stemBand), zc = zone(cx, cz);
        if (!zc || zc.e < -0.3 || zc.e > 1.6) continue;
        const out = outward(zc), front = 1 - sm(0.2, 1.1, zc.e), tall = tallAt(zc, rnd) * (0.93 + 0.1 * rnd());
        const la = Math.atan2(out[1], out[0]) + (rnd() - 0.5) * 1.4, lean0 = (0.03 + 0.08 * rnd()) * (0.5 + front), lx = Math.cos(la), lz = Math.sin(la);
        const size = 3 + Math.floor(rnd() * 5), rad = 0.16 + 0.24 * rnd();
        for (let k = 0; k < size && n < want; k++) {
          const a = rnd() * 6.28, d = rad * Math.sqrt(rnd()), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, zn = zone(x, z);
          if (!zn || zn.e < -0.3) continue;
          const p = rnd(), kind = p < 0.34 ? 'a' : p < 0.64 ? 'b' : p < 0.81 ? 'c' : p < 0.94 ? 'old' : 'broken', girth = 0.9 + 0.4 * rnd(), h = tall * (0.9 + 0.14 * rnd());
          const it = { x, y: Math.max(groundY(x, z), -0.05), z, e: zn.e, turn: windTurn + (rnd() - 0.5) * 0.9, scale: [girth, h / 4, girth], color: tint(rnd) };
          leanTo(it, lx, lz, lean0); leanTo(it, Math.cos(a), Math.sin(a), 0.015 + 0.045 * rnd());      // with its clump, and a little out of it
          if (kind === 'old') { const b = rnd() * 6.28; leanTo(it, Math.cos(b), Math.sin(b), 0.12 + 0.3 * rnd()); it.color.multiply(oldTint); }      // it leans across its neighbours
          lists[kind].push(it); n++;
        }
        // this year's shoots at its feet, most where the clump meets the water
        for (let k = rnd() < 0.55 + 0.45 * front ? (rnd() < 0.5 ? 2 : 1) : 0; k > 0 && ns < wantShoots; k--) {
          const a = rnd() * 6.28, d = rad * (0.7 + 0.8 * rnd()), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, zn = zone(x, z);
          if (!zn || zn.e < -0.3) continue;
          const k2 = 0.8 + 0.4 * rnd(), it = { x, y: Math.max(groundY(x, z), -0.05), z, e: zn.e, turn: windTurn + (rnd() - 0.5) * 1.6, scale: [k2, k2 * (0.9 + 0.2 * rnd()), k2], color: tint(rnd, 0.9, 1.1) };
          lists.shoots.push(leanTo(it, Math.cos(a), Math.sin(a), 0.04 + 0.1 * rnd())); ns++;
        }
      }
      // a few have fallen outward and lie over the water, their plumes near it (old stems; they cross the rest)
      for (let k = Math.round(run.len / 7); k > 0; k--) {
        const [x, z] = run.at(rnd(), -0.1 + 0.5 * rnd()), zn = zone(x, z); if (!zn || zn.e < -0.3) continue;
        const out = outward(zn), la = Math.atan2(out[1], out[0]) + (rnd() - 0.5) * 1.5, it = { x, y: Math.max(groundY(x, z), -0.05), z, e: zn.e, turn: windTurn + (rnd() - 0.5) * 2, scale: [1, tallAt(zn, rnd) / 4 * 0.86, 1], color: tint(rnd, 0.8, 1.0).multiply(oldTint) };
        lists[rnd() < 0.7 ? 'old' : 'b'].push(leanTo(it, Math.cos(la), Math.sin(la), 0.75 + 0.45 * rnd()));
      }
    }
    // (Stage 6: the reeds stand in chunks REED_CELL metres square, each culled by its own sphere. As first grown each kind
    // was ONE chunk (cell 0), drawn whole in all three passes of every frame wherever the rider looked: the bed behind
    // the boat cost what the bed ahead did, and the area stood at 4.3 million triangles a frame at the mooring and 3.7
    // million on the last straight, where almost no reed is in sight. three.js draws the chunks nearest first and each
    // chunk's copies nearest-the-water first, as before. &reedcell=0: as it was. 5-critique.md)
    const REED_CELL = QS.has('reedcell') ? +QS.get('reedcell') : 40;
    K.stems = [];
    for (const [kind, seed] of [['a', 7], ['b', 12], ['c', 21], ['old', 5], ['broken', 9]]) K.stems.push(...grown('reed stems ' + kind, stemGeometry(kind, seed), stemPaint, lists[kind], { cell: REED_CELL, margin: 2.6, front: 'e' }));
    K.shoots = grown('reed shoots', stemGeometry('shoots', 3), stemPaint, lists.shoots, { cell: REED_CELL, margin: 1.2, front: 'e', mirror: false });      // (stage 6: not in the mirror: spears a metre tall at the foot of a wall of reed four metres tall)
    // for the cast and for the gossamer: the gold stems of the water's edge, and where a point t (0 at the water .. 1 at the
    // foot of its plume) of one of them is, in its own lean (the wind's lean, up to 0.4 m at the plume, is not in it)
    { const _p = new THREE.Vector3(), _e = new THREE.Euler();
      K.stemsAt = [...lists.a.map((it) => ({ ...it, bow: 0.13 })), ...lists.b.map((it) => ({ ...it, bow: 0.26 }))].filter((it) => Math.abs(it.tiltX || 0) + Math.abs(it.tiltZ || 0) < 0.4);
      K.stemPoint = (it, t, out = []) => { _p.set(it.bow * t * t * it.scale[0], 3.74 * t * it.scale[1], 0).applyEuler(_e.set(it.tiltX || 0, it.turn || 0, it.tiltZ || 0, 'YXZ')); out[0] = it.x + _p.x; out[1] = it.y + _p.y; out[2] = it.z + _p.z; return out; }; }

    // the tufts: thrown evenly over the bed and kept by its density, which thins from the bank over 40 m
    const tufts = [{ a: [], b: [], far: [] }, { a: [], b: [], far: [] }], x0 = -64, x1 = 88, z0 = -152, z1 = 46, NEAR = (P.grown && P.grown.tuftNear) ?? 7;      // (two sets: the second is left out of the mirror)
    const FAR_KEEP = QS.has('farkeep') ? +QS.get('farkeep') : (((ctx.quality && ctx.quality.density) || 1) >= 0.75 ? 2 : 1);      // (of four; &farkeep=4: all of them, as first grown)
    for (let n = 0, tries = 0; n < R.tufts && tries < 600000; tries++) {
      const x = x0 + (x1 - x0) * rnd(), z = z0 + (z1 - z0) * rnd(), zn = zone(x, z);
      if (!zn || zn.e < 1.4 || zn.e > 1.4 + R.tuftBand || zn.s > 134) continue;
      if (rnd() > lerp(1, R.tuftsPerM2[1] / R.tuftsPerM2[0], (zn.e - 1.4) / R.tuftBand)) continue;
      const k = 0.85 + 0.4 * rnd(), a = rnd() * 6.28;
      const it = { x, y: Math.max(groundY(x, z), -0.05) - 0.02, z, e: zn.e, turn: windTurn + (rnd() - 0.5) * 1.7, scale: [k, tallAt(zn, rnd) / 4.0 * (0.94 + 0.12 * rnd()), k], color: tint(rnd, 0.8, 1.1) };
      const pick = rnd() < 0.55 ? 'a' : 'b', kind = zn.e < NEAR ? pick : 'far', leaned = leanTo(it, Math.cos(a), Math.sin(a), 0.02 + 0.09 * rnd() * rnd());
      // (stage 6: of the tufts that stand 7 m and more behind the water's edge every second one stands, and at low quality
      // every fourth (the page: "at low quality halve the tufts, not the fringe"). They are behind the front rank from
      // every place the boat can be: five postcards with all of them and with half differ in less than a thousandth of
      // their pixels (.shots/landing_crit_25_far_tufts_all_or_half.jpg). Every tuft is still thrown, so none of the
      // others moves.)
      if (kind !== 'far' || ((n >> 1) % 4) < FAR_KEEP) tufts[n % 2][kind].push(leaned);
      n++;
    }
    K.tufts = [];
    for (const [kind, seed] of [['a', 11], ['b', 23], ['far', 37]]) { const tg = tuftGeometry(kind, seed);
      // (stage 6: of the tufts that stand 7 m and more behind the water's edge NONE is in the mirror now, where half were: the
      // mirror looks up at the bank from under the water and sees its front rank, all the stems and half the near tufts)
      K.tufts.push(...grown('reed tufts ' + kind, tg, reedPaint, tufts[0][kind], { cell: REED_CELL, margin: 2.6, front: 'e', ...(kind === 'far' && !QS.has('farmirror') ? { mirror: false } : {}) }), ...grown('reed tufts ' + kind + ' (not in the mirror)', tg, reedPaint, tufts[1][kind], { cell: REED_CELL, margin: 2.6, mirror: false, front: 'e' })); }

    // the reeds' feet, along every bank where they meet the water (two kinds; not in the mirror: they lie on it)
    const feet = [[], []], FEET = (P.grown && P.grown.feet) ?? 260;
    for (const run of runs) for (let k = Math.round(FEET * run.len / total); k > 0; k--) {
      const [x, z] = run.at(rnd(), -0.3 + 0.9 * rnd() * rnd()), zn = zone(x, z); if (!zn || zn.e < -0.4 || zn.e > 0.7) continue;
      const s = 0.75 + 0.5 * rnd(); feet[k % 2].push({ x, y: 0, z, turn: rnd() * 6.28, scale: [s, 1, s], color: tint(rnd, 0.7, 1.05) });
    }
    // (what floats goes under the hull: the boat's floor is below the waterline, and a leaf lying where the boat floats
    // would show INSIDE the boat, as the layout found of the pads. Within the hull's outline it is pressed down 45 cm.)
    // And it rides the water: when a ring or a wake reaches a piece of litter (the water's ripple field) what floats of
    // it lifts and falls a finger's breadth and slides a little, each piece in its own time; in still water it lies still.
    const underHull = { uniforms: { uKHull: K.hull }, vertexPars: /* glsl */`uniform vec4 uKHull, uRippleRect; uniform sampler2D tRipple;`, vertexWorld: /* glsl */`
      { vec2 kRel = wp.xz - uKHull.xy, kFwd = vec2(-uKHull.z, -uKHull.w); float kA = dot(kRel, kFwd) - 0.45, kS = dot(kRel, vec2(-kFwd.y, kFwd.x));
        #ifdef USE_INSTANCING
          vec2 kRoot = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xz;
        #else
          vec2 kRoot = wp.xz;
        #endif
        vec2 kUv = (kRoot - uRippleRect.xy) / uRippleRect.zw + 0.5;
        float kWake = (kUv.x > 0.01 && kUv.x < 0.99 && kUv.y > 0.01 && kUv.y < 0.99) ? clamp(texture2D(tRipple, kUv).a * 4.0, 0.0, 1.0) : 0.0;
        float kJ = fract(sin(dot(kRoot, vec2(41.31, 289.13))) * 43758.5453), kAfloat = smoothstep(-0.06, -0.01, wp.y) * (1.0 - smoothstep(0.03, 0.09, wp.y));
        wp.y += 0.014 * kWake * kAfloat * sin(uTime * 4.3 + kJ * 30.0 + dot(wp.xz, vec2(3.1, 2.3)));
        wp.xz += 0.012 * kWake * kAfloat * vec2(sin(uTime * 1.9 + kJ * 17.0), cos(uTime * 1.6 + kJ * 23.0));
        wp.y -= 0.45 * (1.0 - smoothstep(0.7, 1.05, abs(kS))) * (1.0 - smoothstep(1.9, 2.5, abs(kA))); }` };
    const footPaint = ctx.kit.gouache({ color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, brush: 0.6, extend: [L.extend({ rim: 0.35, soft: 0.8 }), underHull] });
    K.feet = [...grown('reed feet a', footGeometry(31), footPaint, feet[0], { cell: 0, margin: 0.3, mirror: false }), ...grown('reed feet b', footGeometry(47), footPaint, feet[1], { cell: 0, margin: 0.3, mirror: false })];

    // ---- cut reed afloat (THIRD LOOK; the close band at the mooring: postcard 3, over the side). The staithe is where
    // the cut reed is landed and the rick is built: what falls from a bundle lies on the water in its lee, lodged along
    // its face and against its posts, and the slow current has laid it all one way. A raft of it: four cut stems of
    // different lengths, half sunk, each with the pale slant of the scythe's cut at its butt; one with its plume still
    // on, sodden and flat on the water; two dead blades. Seven along the staithe's face and under its deck, two against
    // the jetty's upstream flank. Each hugs the timber (the hull stops 24 cm short of the staithe: none lies where the
    // boat can float over it and show inside it). Not in the mirror: they lie on it.
    { const raftGeometry = (seed) => { const g = new Grown(), r = ctx.rng(seed), pith = '#D6C48C';
        // (as first laid the four lay a finger apart and parallel, and were as thin as pencil lines: ruled paper,
        // .shots/landing_kr3_side_4.png. Spilled reed lies across itself: each stem its own way within a hand's turn of
        // the current's, a finger thick, one end of some gone under.)
        for (let i = 0; i < 5; i++) {
          const len = i === 4 ? 0.22 + 0.2 * r() : 0.5 + 0.85 * r(), an = (r() - 0.5) * 0.75, dx = Math.cos(an), dz = Math.sin(an), x0 = (r() - 0.5) * 0.6, z0 = (r() - 0.5) * 0.22, c = hex('#A8904E', GREY, 0.6 * r()), wc = hex(c, C.tea, 0.6), y = 0.004 + 0.006 * r(), rad = 0.0065 + 0.0025 * r(), sunk = r() < 0.4;
          const a = [x0, y, z0], b = [x0 + dx * len, sunk ? -0.03 : y, z0 + dz * len], k = (r() - 0.5) * 0.05;
          g.tube([a, [x0 + dx * len * 0.5 - dz * k, y - 0.006, z0 + dz * len * 0.5 + dx * k], b], [rad, rad, rad * 0.85], 3, [c, hex(c, C.tea, 0.3), sunk ? wc : c]);
          g.tri(g.v([a[0] - dx * 0.016, a[1] + rad, a[2] - dz * 0.016], pith), g.v([a[0] + dx * 0.004 - dz * rad * 1.1, a[1] - rad * 0.4, a[2] + dz * 0.004 + dx * rad * 1.1], pith), g.v([a[0] + dx * 0.004 + dz * rad * 1.1, a[1] - rad * 0.4, a[2] + dz * 0.004 - dx * rad * 1.1], pith));      // the cut, slantwise: pale pith
          if (i === 1 && !sunk) { const wet0 = hex('#6A5632', C.tea, 0.3), wet1 = '#927C4A';      // its plume still on, sodden, flat on the water
            for (let q = 0; q < 7; q++) { const u = q / 7, cx = b[0] + dx * 0.26 * u, cz = b[2] + dz * 0.26 * u, sg = q % 2 ? 1 : -1, l = (0.035 + 0.035 * r()) * (1 - 0.5 * u);
              g.tri(g.v([cx - dx * 0.028, 0.004, cz - dz * 0.028], wet0), g.v([cx + dx * 0.03, 0.004, cz + dz * 0.03], wet0), g.v([cx + dx * (0.03 + l * 0.9) - dz * sg * l * 0.6, 0.003, cz + dz * (0.03 + l * 0.9) + dx * sg * l * 0.6], wet1)); } }
        }
        for (let i = 0; i < 2; i++) { const a = (r() - 0.5) * 0.9, len = 0.25 + 0.3 * r(), ox = (r() - 0.5) * 0.7, oz = (r() - 0.5) * 0.16, dx = Math.cos(a), dz = Math.sin(a), bend = (r() - 0.5) * 0.3, w = 0.01 + 0.008 * r(), c = hex('#7C6A44', '#6A6250', r());
          const at = (u) => [ox + dx * len * u - dz * bend * Math.sin(u * 3.14) * len, 0.006 + 0.012 * Math.max(0, u - 0.7), oz + dz * len * u + dx * bend * Math.sin(u * 3.14) * len];
          g.ribbon([at(0), at(0.3), at(0.68), at(1)], [0, w, w * 0.8, 0], [-dz, 0, dx], [hex(c, C.tea, 0.6), c, hex(c, '#9A8A5C', 0.4), hex(c, C.tea, 0.5)]); }
        return g.build(); };
      const rnd = ctx.rng(803), S = P.staithe, J = P.jetty, lists = [[], []], f = L.frame(14, {}), down = Math.atan2(-f.tz, f.tx), face = S.d[0];
      K.afloatAt = [];                                                               // for the cast: where each raft lies ({ x, z, r })
      const lay = (s, d, turn, k) => { const [x, , z] = A(s, d, 0); if (groundY(x, z) > -0.08) return; const sc = 0.8 + 0.5 * rnd(); lists[k % 2].push({ x, y: 0, z, turn, scale: [sc, 1, sc], color: tint(rnd, 0.75, 1.05) }); K.afloatAt.push({ x, z, r: 0.75 * sc }); };
      [[8.9, 0.1], [10.8, 0.16], [12.6, 0.08], [14.9, 0.14], [16.4, 0.07], [18.3, 0.12], [19.3, 0.2]].forEach(([s, out], k) => lay(s, face + out, down + (rnd() - 0.5) * 0.36, k));
      [[11.9, -0.45], [15.7, -0.5]].forEach(([s, out], k) => lay(s, face + out, down + (rnd() - 0.5) * 1.6, k + 1));
      if (J && J.d) { const jf = L.frame(J.s, {}), jdown = Math.atan2(-jf.tz, jf.tx), flank = J.s - (J.width ?? 1.3) / 2 - 0.12;
        [[-12.6], [-10.7]].forEach(([d], k) => lay(flank, d, jdown + Math.PI / 2 + (rnd() - 0.5) * 0.4, k)); }
      K.afloat = [...grown('cut reed afloat a', raftGeometry(17), footPaint, lists[0], { cell: 0, margin: 0.2, mirror: false }), ...grown('cut reed afloat b', raftGeometry(29), footPaint, lists[1], { cell: 0, margin: 0.2, mirror: false })]; }
  }

  // ---- gossamer: sixty threads strung from stem to stem along the water's edge, a few of them strung with caught seed
  // (the page: the reed bank in its last 10 m). The engine's hairlines, `against`: seen only against the sun, so they
  // are strung along the right bank and round the head's right, the banks the rider sees with the sun behind them
  // (looking away from the light there is nothing there). Each runs between two gold stems that stand within a
  // stride of one another, a third to two thirds of the way up them, and sags a hand; one in three has a second
  // strand blown from the same stem.
  // SECOND LOOK. As first strung they were white wires across the right bank in the title view, 25 m off (a hairline is
  // never drawn thinner than a pixel and a half, however far, and these were 4 mm thick and as bright at 30 m as at 3):
  // .shots/landing_kr2_p1_crop.png. Gossamer is seen within a few metres or not at all: here it is gone by GOSSAMER.far
  // metres and a third as thick. And it hung still in the air while the stems it is tied to leaned in the wind: it
  // now takes the same wind and the same lean from the hull as the stems do. Both are added to the hairlines' shader
  // from here (asked of the engine in the log: a `far` and a `sway` hook for hairlines); if the engine's shader ever
  // changes so that they cannot be added, the gossamer is left out, not shown as wires.
  try {
    const { makeHairlines } = await import('../../engine/life/ribbons.js');
    const GO = { count: 60, far: [4.5, 10], width: 0.0016, seed: 0.011, intensity: 1.0, ...((P.grown && P.grown.gossamer) || {}) };
    const rnd = ctx.rng(60), front = K.stemsAt.filter((it) => { if (it.e > 1.0) return false; const zn = zone(it.x, it.z); return zn && (zn.side === 'right' || (zn.side === 'head' && zn.d > -2)); }), lines = [], a = [], b = [];
    const strand = (A0, ta, B0, tb, sag) => {
      K.stemPoint(A0, ta, a); K.stemPoint(B0, tb, b);
      const pts = []; for (let k = 0; k <= 6; k++) { const f = k / 6; pts.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f) - sag * 4 * f * (1 - f), lerp(a[2], b[2], f)]); }
      lines.push({ points: pts });
      return pts;
    };
    let seeds = 0;
    for (let tries = 0; lines.length - seeds < GO.count && tries < 6000 && front.length > 2; tries++) {
      const A0 = front[Math.floor(rnd() * front.length)], B0 = front[Math.floor(rnd() * front.length)], d = Math.hypot(A0.x - B0.x, A0.z - B0.z);
      if (A0 === B0 || d < 0.35 || d > 1.6) continue;
      const ta = 0.3 + 0.35 * rnd(), tb = Math.min(0.75, Math.max(0.25, ta + (rnd() - 0.5) * 0.24));
      const pts = strand(A0, ta, B0, tb, (0.03 + 0.09 * rnd()) * d);
      if (rnd() < 0.34 && lines.length - seeds < GO.count) strand(A0, ta + 0.012, B0, Math.min(0.8, tb + 0.05 + 0.1 * rnd()), (0.05 + 0.1 * rnd()) * d);      // a second strand from the same hold
      // caught seed: one to three tufts of down on about half of them, each a fleck a centimetre across
      if (rnd() < 0.5) for (let k = 1 + Math.floor(rnd() * 2.6); k > 0; k--) {
        const f = 0.15 + 0.7 * rnd(), i = Math.min(5, Math.floor(f * 6)), u = f * 6 - i, p = pts[i], q = pts[i + 1], len = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) || 1, h = 0.5 * GO.seed / len;
        lines.push({ points: [[lerp(p[0], q[0], u - h), lerp(p[1], q[1], u - h), lerp(p[2], q[2], u - h)], [lerp(p[0], q[0], u + h), lerp(p[1], q[1], u + h), lerp(p[2], q[2], u + h)]], width: GO.seed * (0.8 + 0.8 * rnd()), color: '#FFE7A8' }); seeds++;
      }
    }
    const G = makeHairlines(ctx, { lines, color: '#FFF1CC', width: GO.width, intensity: QS.has('gossamer') ? +QS.get('gossamer') : GO.intensity, against: 1, sag: 0, mirror: false });
    // the wind and the hull, as the stems take them (light.js, plantExt; ANSWER above), and gone by GO.far metres
    const W = P.wind; let vs = G.material.vertexShader, done = 0;
    const put = (find, text) => { if (vs.includes(find)) { vs = vs.replace(find, text); done++; } };
    put('uniform float uLifeTime;', 'uniform float uLifeTime, uTime; uniform vec4 uLWind, uKHull; uniform vec2 uKFar;');
    // (the engine's hairlines cut each segment where it passes behind the eye, since 9 November: both drawn ends of a
    // segment are placed before they are turned to the eye's space, so the wind and the hull move both of them)
    put('void main() {', /* glsl */`vec3 gSway(vec3 P) {
          float gH = clamp(P.y / 4.2, 0.0, 1.25), gCrest = 0.5 + 0.5 * sin(dot(P.xz, uLWind.xy) * ${(2 * Math.PI / W.length).toFixed(4)} - uTime * ${(2 * Math.PI / W.period).toFixed(4)} + 0.4);
          P.xz += uLWind.xy * ((0.24 + 0.76 * gCrest) * ${W.lean.toFixed(3)} * uLWind.z * gH * gH);
          vec2 gRel = P.xz - uKHull.xy, gFwd = vec2(-uKHull.z, -uKHull.w), gOff = gRel - gFwd * clamp(dot(gRel, gFwd), -1.5, 1.9); float gD = length(gOff);
          float gNear = 1.0 - smoothstep(0.85, 2.6, gD), gTop = gNear * gNear * 2.1;
          P.xz += (gD > 1e-3 ? gOff / gD : gFwd) * (gTop * gH * gH); P.y -= 0.667 * gTop * gTop * gH * gH * gH / 4.2;
          return P; }
      void main() {`);
    put('vec3 va = (viewMatrix * vec4(Pa, 1.0)).xyz,', 'Pa = gSway(Pa); Pb = gSway(Pb);\n        vec3 va = (viewMatrix * vec4(Pa, 1.0)).xyz,');
    // (and it does not shine evenly: the light catches a stretch of a thread and slides along it as it stirs, slowly)
    put('float ag = mix(1.0,', 'float ag = (1.0 - smoothstep(uKFar.x, uKFar.y, length(uCameraPos - P))) * (0.2 + 0.8 * pow(0.5 + 0.5 * sin(dot(P, vec3(6.1, 8.3, 4.7)) + uTime * 0.55), 2.0)) * mix(1.0,');
    if (done === 4) {
      G.material.vertexShader = vs; G.material.needsUpdate = true;
      Object.assign(G.material.uniforms, { uTime: ctx.engine.shared.uTime, uLWind: L.wind, uKHull: K.hull, uKFar: { value: new THREE.Vector2(GO.far[0], GO.far[1]) } });
    } else { G.object.visible = false; console.warn('landing: the gossamer is left out (the hairlines\' shader has changed: kit.js, "gossamer")'); }
    K.gossamer = G; G.object.name = 'gossamer';
    counts.gossamer = { count: lines.length - seeds, seeds };
  } catch (err) { console.error('landing: the gossamer could not be strung (src/engine/life/ribbons.js): ' + ((err && err.message) || err)); }
  // ---- the far mass: beyond the tufts the reed is one mesh, a wall of reed 4 m high that runs round the whole area
  // (its inner edge is found by looking outward from the middle of the area: PLAN.inner). Its paint lays the `reed`
  // tile on it in broad upright strokes (light.js: L.plant with rooted: 'world'), and the wind's waves cross it.
  // From the boat only two stretches of it are ever seen bare: across the cut fen (115 m off, where the fen ends) and
  // along the cut face of the left bed beyond its tufts (60 to 110 m off). A FRINGE stands along it: pointed blades from
  // the ground to above its top, leaning down the wind, three rows deep where the land before it is open and one row
  // elsewhere, so that its top is the ragged top of a reed bed and no seam shows where the tufts end and the wall begins.
  // (Its top surface, which ran on to the horizon in five rings, is never seen from an eye 1.1 m above the water: two.)
  {
    const rnd = ctx.rng(41), cx = -14, cz = -50, N = 720, rings = [[0, -0.3], [0, 1], [6, 1.03], [300, 0.86]];
    const pos = [], col = [], idx = [], c = new THREE.Color(), edge = [];
    const lit = new THREE.Color(C.reedStem), dark = new THREE.Color(C.reedShade), plumeC = new THREE.Color(C.plume), pale = hex(C.plume, C.plumeLit, 0.5);
    const put = (x, y, z, color, k = 1) => { pos.push(x, y, z); col.push(color.r * k, color.g * k, color.b * k); return pos.length / 3 - 1; };
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2, ux = Math.sin(a), uz = -Math.cos(a);
      let lo = 12, hi = 12;
      while (hi < 330 && P.inner(path, cx + ux * hi, cz + uz * hi)) { lo = hi; hi += 2; }
      for (let k = 0; k < 6; k++) { const m = (lo + hi) / 2; if (P.inner(path, cx + ux * m, cz + uz * m)) lo = m; else hi = m; }
      const r0 = (lo + hi) / 2, x = cx + ux * r0, z = cz + uz * r0, h = 4.0 + 0.5 * ctx.kit.fbm(x * 0.07, z * 0.07, 3) + 0.12 * rnd();
      edge.push([x, z, h, !zone(cx + ux * (r0 - 4), cz + uz * (r0 - 4))]);      // (open: no reed stands before this stretch of it)
      rings.forEach(([out, k], j) => { const far = out > 60 ? Math.min(1, (330 - r0) / 300) : 1; put(cx + ux * (r0 + out * far), k < 0 ? k : h * k, cz + uz * (r0 + out * far), j === 0 ? dark : j === 1 ? lit : plumeC, j === 0 ? 0.8 : 0.9 + 0.2 * rnd()); });
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < rings.length - 1; j++) { const i2 = (i + 1) % N, p = i * rings.length + j, q = i2 * rings.length + j; idx.push(p, q, p + 1, q, q + 1, p + 1); }
    // the fringe
    const wx0 = L.wind.value.x, wz0 = L.wind.value.y; let blades = 0;
    for (let i = 0; i < N; i++) {
      const A0 = edge[i], B0 = edge[(i + 1) % N], len = Math.hypot(B0[0] - A0[0], B0[1] - A0[1]);
      if (len > 12 || len < 1e-3) continue;                                       // (a step from one face of it to another)
      const open = A0[3] && B0[3], step = open ? 0.36 : 1.3, rows = open ? 3 : 1, tx = (B0[0] - A0[0]) / len, tz = (B0[1] - A0[1]) / len;
      let nx = -tz, nz = tx; if ((cx - A0[0]) * nx + (cz - A0[1]) * nz < 0) { nx = -nx; nz = -nz; }      // toward the middle of the area: its near side
      for (let row = 0; row < rows; row++) for (let u = rnd() * step; u < len; u += step * (0.7 + 0.6 * rnd())) {
        const k = u / len, off = row * 0.75 + 0.1 + 0.5 * rnd(), bx = A0[0] + (B0[0] - A0[0]) * k + nx * off, bz = A0[1] + (B0[1] - A0[1]) * k + nz * off;
        const h = (A0[2] + (B0[2] - A0[2]) * k) * (1.03 + 0.2 * rnd() - 0.07 * row), w = 0.18 + 0.28 * rnd(), an = Math.atan2(tz, tx) + (rnd() - 0.5) * 1.2, wx = Math.cos(an) * w, wz = Math.sin(an) * w;
        const lean = 0.15 + 0.5 * rnd(), lx = wx0 * lean, lz = wz0 * lean, y0 = Math.max(groundY(bx, bz), -0.1) - 0.15, tone = 0.82 + 0.3 * rnd();
        const v0 = put(bx - wx, y0, bz - wz, dark, 0.8), v1 = put(bx + wx, y0, bz + wz, dark, 0.8);
        const v2 = put(bx + wx * 0.5 + lx * 0.45, h * 0.62, bz + wz * 0.5 + lz * 0.45, lit, tone), v3 = put(bx - wx * 0.5 + lx * 0.45, h * 0.62, bz - wz * 0.5 + lz * 0.45, lit, tone), v4 = put(bx + lx, h, bz + lz, pale, tone);
        idx.push(v0, v1, v2, v0, v2, v3, v3, v2, v4); blades++;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const mass = new THREE.Mesh(geo, L.plant({ tall: 4.2, backlight: 0.55, rooted: 'world' }));
    mass.name = 'far reed mass'; mass.frustumCulled = false; ctx.add(mass); K.mass = mass;
    counts['far reed mass'] = { triangles: idx.length / 3, fringeBlades: blades };
  }

  // ============================================================================================ the cut fen
  // Stubble: the reed cut slantwise at 0.3 m, standing in 14 cm of water, with this year's shoots through it. Two kinds:
  // within eight metres of the channel (where the rider, aground on the fen's lip, looks down at it) each is two hollow
  // stubs as thick as a finger with their pale slanted cuts, a shoot with its leaves, and a cut length lying in the
  // water; further off, four cut blades and a shoot. None in the heron's shallows nor in the open lead behind the heron
  // as the mooring sees it (PLAN.inLead: keep both open when the fen is regrown).
  { const rnd = ctx.rng(36), F = P.fen, lists = [[], []], pith = '#D2BE86';
    const near = (seed) => { const g = new Grown(), r = ctx.rng(seed);
      for (let i = 0; i < 2; i++) {
        const a = r() * 6.28, d = 0.04 + 0.1 * r(), x = Math.cos(a) * d, z = Math.sin(a) * d, h = 0.19 + 0.15 * r(), rad = 0.008 + 0.003 * r(), cut = 0.05 + 0.05 * r(), ca = r() * 6.28, lx = (r() - 0.5) * 0.04, lz = (r() - 0.5) * 0.04;
        const c0 = hex(C.reedShade, C.tea, 0.4), c1 = hex(C.reedShade, C.stubble, 0.5 + 0.5 * r()), bot = [], top = [];
        for (let k = 0; k < 3; k++) { const an = k * 2.094 + a; bot.push(g.v([x + Math.cos(an) * rad, -0.18, z + Math.sin(an) * rad], c0)); top.push(g.v([x + lx + Math.cos(an) * rad, h + cut * Math.cos(an - ca), z + lz + Math.sin(an) * rad], c1)); }
        for (let k = 0; k < 3; k++) { const k2 = (k + 1) % 3; g.i.push(bot[k], bot[k2], top[k2], bot[k], top[k2], top[k]); }
        const cap = top.map((_, k) => g.v([g.p[top[k] * 3], g.p[top[k] * 3 + 1], g.p[top[k] * 3 + 2]], pith)); g.i.push(cap[0], cap[1], cap[2]);      // the cut: pale pith, slantwise
      }
      { const x = 0.05 - 0.1 * r(), z = 0.06 - 0.12 * r(), h = 0.38 + 0.34 * r(), tip = [x + 0.05, h, z + 0.02], green = hex(SHOOT[0], SHOOT[1], 0.5 * r());      // this year's shoot through it
        g.tube([[x, -0.18, z], tip], [0.0065, 0], 3, [hex(SHOOT[0], C.oliveShade, 0.4), hex(SHOOT[1], C.honey, 0.2)]);
        leaf(g, [x + 0.02, h * 0.45, z + 0.01], 0.3 + r(), 0.2 + 0.1 * r(), 0.009, 1.2, 0.1, 0.4, green, green, hex(SHOOT[1], C.honey, 0.2), 2, 1); leaf(g, [x + 0.03, h * 0.66, z + 0.01], 3.2 + r(), 0.17 + 0.08 * r(), 0.008, 1.3, 0.1, -0.5, green, green, hex(SHOOT[1], C.honey, 0.2), 2, 1); }
      { const a = r() * 6.28, len = 0.3 + 0.35 * r(), x = (r() - 0.5) * 0.2, z = (r() - 0.5) * 0.2, c = hex('#A8915C', GREY, 0.5); g.ribbon([[x, 0.012, z], [x + Math.cos(a) * len, 0.012, z + Math.sin(a) * len]], [0.008, 0.006], [-Math.sin(a), 0, Math.cos(a)], [c, hex(c, C.tea, 0.5)]); }      // a cut length afloat
      return g.build(); };
    const far = (seed) => { const g = new Grown(), r = ctx.rng(seed);
      for (let i = 0; i < 4; i++) { const a = r() * 6.28, d = 0.03 + 0.14 * r(), bx = Math.cos(a) * d, bz = Math.sin(a) * d, h = 0.2 + 0.14 * r(), sa = r() * 3.14, side = [Math.cos(sa), 0, Math.sin(sa)], w = 0.011;
        const k0 = g.v([bx - side[0] * w, -0.16, bz - side[2] * w], C.reedShade), k1 = g.v([bx + side[0] * w, -0.16, bz + side[2] * w], C.reedShade), k2 = g.v([bx + side[0] * w + 0.012, h, bz + side[2] * w + 0.01], C.stubble), k3 = g.v([bx - side[0] * w + 0.012, h - 0.045, bz - side[2] * w + 0.01], pith);
        g.i.push(k0, k1, k2, k0, k2, k3); }
      g.ribbon([[-0.01, -0.16, 0.02], [0.065, 0.36 + 0.3 * r(), 0.05]], [0.011, 0.004], [1, 0, 0], [hex(SHOOT[0], C.oliveShade, 0.4), SHOOT[1]]);            // a new shoot through it
      return g.build(); };
    for (let n = 0, tries = 0; n < F.stubble && tries < F.stubble * 8; tries++) {
      const s = F.from + 0.6 + rnd() * 96, e = 0.5 + 76 * rnd() ** 2.2, [x, , z] = A(s, -(hw(s) + e), 0), q = P.ground(path, x, z, gq);
      if (q.kind !== 'fen' || q.y > -0.04) continue;
      if (P.inLead(path, x, z)) continue;                                            // the heron's shallows and the open lead behind it (PLAN.fen.lead)
      lists[e < 8 ? 0 : 1].push({ x, y: 0, z, turn: rnd() * 6.28, scale: 0.85 + 0.5 * rnd(), color: tint(rnd, 0.8, 1.15) }); n++;
    }
    const paint = L.plant({ tall: 0.8, backlight: 0.6 });
    // (stage 6: in chunks, culled when out of sight; and the stubble more than 8 m from the channel is not in the mirror:
    // a hand high, twenty metres off and more, it has no reflection to speak of)
    K.stubble = [...grown('stubble (near)', near(8), paint, lists[0], { cell: 48, margin: 0.3 }), ...grown('stubble', far(2), paint, lists[1], { cell: 48, margin: 0.3, mirror: false })]; }
  // ============================================================================================ sedge
  // (The stand-ins for reedmace, the lamp tuft and the iris stood here; the real things are kit_plants.js's: 2-kit-plants.md.)
  // ---- a model whose file holds several shapes in a row along x (source-art/models/landing/sedge.py, ford_stone.py:
  // shape k stands on x = k x spacing): its geometry with the number of the shape each point belongs to (aShape), and
  // the extension that leaves each copy only the shape it picks (aPick: one number a copy) and brings that shape to
  // the copy's own place. One file, one draw call, as many shapes as the script made.
  const rowModel = async (url, spacing) => {
    const m = await ctx.kit.model(url, { position: [0, -500, 0] });
    m.group.updateMatrixWorld(true);
    const g = m.body.geometry.clone().applyMatrix4(m.body.matrixWorld).translate(0, 500, 0), pos = g.attributes.position, shape = new Float32Array(pos.count);
    m.group.removeFromParent();
    let shapes = 0; for (let i = 0; i < pos.count; i++) { shape[i] = Math.round(pos.getX(i) / spacing); shapes = Math.max(shapes, shape[i] + 1); }
    g.setAttribute('aShape', new THREE.BufferAttribute(shape, 1)); g.computeBoundingSphere();
    return { geometry: g, shapes, triangles: Math.round((g.index ? g.index.count : pos.count) / 3 / shapes),
      pick: { vertexPars: /* glsl */`attribute float aShape, aPick;`, vertexLocal: /* glsl */`transformed.x -= aPick * ${spacing.toFixed(3)}; if (abs(aShape - aPick) > 0.5) transformed = vec3(0.0);` },
      /**
       * One copy in every item of `list` (each with its `pick`), one draw call a shape. (Stage 6: as first built every
       * copy drew ALL the shapes of the row and its shader folded away the ones it had not picked: one draw call, but
       * three times the sedge's triangles (156,600 for 52,200) and six times the ford's in every pass. Now each shape
       * is a geometry of its own triangles, over the same points, and its copies pick it as before. 5-critique.md)
       */
      grow(name, material, list, o = {}) {
        const idx = g.index ? g.index.array : null, n = idx ? idx.length : pos.count, meshes = [];
        for (let k = 0; k < shapes; k++) {
          const items = list.filter((it) => it.pick === k); if (!items.length) continue;
          const keep = [];
          for (let i = 0; i < n; i += 3) { const a = idx ? idx[i] : i; if (shape[a] === k) keep.push(a, idx ? idx[i + 1] : i + 1, idx ? idx[i + 2] : i + 2); }
          const gk = g.clone(); gk.setIndex(keep); gk.boundingSphere = g.boundingSphere.clone();
          gk.setAttribute('aPick', new THREE.InstancedBufferAttribute(new Float32Array(items.length).fill(k), 1));
          const made = grown(name + ' ' + k, gk, material, items, { ...o, cell: 0 }); delete counts[name + ' ' + k];
          for (const m of made) m.name = name; meshes.push(...made);
        }
        counts[name] = { count: list.length, triangles: list.length * this.triangles, shapes, ...(o.mirror === false ? { mirror: false } : {}) };
        return meshes;
      } };
  };
  { // sedge tussocks along the open left edge and the fen's margin: the model (sedge.py: three tussocks: a full
    // fountain, one combed by the wind, a young upright one), ninety of them, each its own tussock, turn, size and tone;
    // the combed ones are turned down the wind. They sway with the reeds and lean from the hull.
    const rnd = ctx.rng(90), list = [];
    // (none within 3.5 m of the heron's stand: a tussock is as tall as the bird's back, and from the mooring's low eye one
    // tussock in front of it leaves a bill and nothing else. Its legs are hidden by the shoots of the stubble, to the joint.)
    const [hx, , hz] = A(P.heron.at[0], P.heron.at[1], 0);
    for (let i = 0; i < P.sedge.count; i++) { const near = i < 60; let x, z;
      for (let tries = 0; tries < 12; tries++) { const s = P.fen.from + 0.5 + rnd() * (near ? 40 : 46), e = near ? 0.1 + 1.5 * rnd() : 1.5 + 5 * rnd(); [x, , z] = A(s, -(hw(s) + e), 0); if (Math.hypot(x - hx, z - hz) > 3.5 && !P.inLead(path, x, z)) break; }
      const pick = (i * 2 + Math.floor(rnd() * 2)) % 3, k = 0.8 + 0.5 * rnd();
      list.push({ x, y: Math.max(0, groundY(x, z)), z, turn: pick === 1 ? windTurn + (rnd() - 0.5) * 0.9 : rnd() * 6.28, scale: [k, k * (0.9 + 0.25 * rnd()), k], color: tint(rnd, 0.82, 1.08), pick }); }
    try {
      const M = await rowModel('models/landing/sedge.glb', 1.5);
      // (tall: 0.24, not the tussock's own 0.8: the area's plant paint shows a plant's foot at a quarter of its paint and
      // comes to the whole of it at `tall`; with the tussock's height the straw skirt was a dark khaki pot on the water
      // and the tussocks further off a row of turnips: .shots/landing_kr3_fen_1.png. A tussock's skirt is dead leaf, pale;
      // its foot is dark only at the water. The wind's lean comes out the same: 5 cm at the leaves' tips.)
      K.sedge = M.grow('sedge', also(also(L.plant({ tall: (P.grown && P.grown.sedgeTall) ?? 0.24, backlight: 0.5 }), M.pick), answer(0.9)), list, { margin: 1.0 });
    } catch (err) { console.error('INVALID_MODEL landing: the sedge (assets/models/landing/sedge.glb) could not be planted: ' + ((err && err.message) || err)); K.sedge = []; }
  }

  // ============================================================================================ under the water
  // (The stand-in pads, buds and flowers lay here; the real ones are kit_plants.js's, which also parts them round the hull.)
  // ---- hornwort: rootless weed that lies in drifts just under the surface of the still water, trailing down it. Seen
  // from a boat a frond is a soft bottle-brush, whorl upon whorl of forked needles, as long as an arm. (Its history:
  // as laid out the fronds stood on the bed, a metre down, where the tea water hides them. Then whorls of separate
  // needles, and toothed blades: under water they were shards. Then a slim spindle standing in the water, and the
  // same with two side shoots: seen from above, a dark fish and then a dark crack: .shots/landing_kr2_hw1.png, _hw2.png.)
  // THIRD LOOK. A frond LIES ALONG THE WATER, a hand under it, and it is looked down on. So it is a brush laid on its
  // side: whorls a few fingers apart along a curved axis, each two bundles of needles opposite one another (a pointed
  // triangle each, its foot along the axis and as long as the gap to the next whorl, so the feet make the frond's dark
  // body and the points its soft edge), every second whorl set upright so that it is a brush from the side too; a side
  // shoot or two; dark at its heart and its foot, a paler green at its points and its growing end. Every point knows
  // how far along its frond it is (aSoft): a slow wave runs down each frond to its tip, quicker and wider when a wake
  // reaches it, and under the hull it is pressed down (it never shows in the boat). Where: in drifts over the deep
  // water of the backwater, as before; and LODGED IN THE SHALLOWS BESIDE THE STAITHE, against the upstream side of its
  // posts, trailing down the water over the rippled sand a hand deep, which is where the moored rider looks over the
  // side (the director's third point; postcard 3). Not in the mirror.
  { const rnd = ctx.rng(420), list = [], want = 420, heart = '#2B3A1C', tipC = '#A2AC62';
    const brushGeometry = (seed, shoots) => { const g = new Grown(), r = ctx.rng(seed);
      // a brush along at(u), n whorls, `rad` its radius at its thickest, m0..m1 how far along the whole frond it runs.
      // (As first laid, fifteen whorls of broad teeth: a saw, or holly: .shots/landing_kr3_side_1.png. The water is not
      // under the painter's filter, so nothing softens a tooth: the whorls are close and their needles slender, lying
      // forward along the frond as a fir twig's do, and its edge is pale, so that against pale sand it is soft.)
      const brush = (at, n, rad, m0, m1, pale) => {
        for (let k = 0; k < n; k++) {
          const u = (k + 0.5) / n, c = at(u), e = at(Math.min(1, u + 0.7 / n)), b = at(Math.max(0, u - 0.7 / n)), T = unit([e[0] - b[0], e[1] - b[1], e[2] - b[2]]);
          const sd = unit([-T[2], 0, T[0]]), up = [sd[1] * T[2] - sd[2] * T[1], sd[2] * T[0] - sd[0] * T[2], sd[0] * T[1] - sd[1] * T[0]];
          const body = rad * Math.pow(Math.sin(Math.PI * (0.08 + 0.84 * u)), 0.5);
          g.mark = lerp(m0, m1, u);
          const cb = hex(heart, tipC, 0.05 + 0.2 * u + pale * 0.2), ct = hex(heart, tipC, Math.min(1, 0.62 + 0.38 * u + pale * 0.3));
          for (const ang of k % 3 === 1 ? [(r() - 0.5) * 0.6, Math.PI / 2 + (r() - 0.5) * 0.8] : [(r() - 0.5) * 0.6]) { const ca = Math.cos(ang), sa = Math.sin(ang);
            for (const sg of [1, -1]) { const len = body * (0.7 + 0.6 * r()), fw = len * (0.7 + 0.6 * r());
              g.tri(g.v(b, cb), g.v(e, cb), g.v([c[0] + (sd[0] * ca + up[0] * sa) * sg * len + T[0] * fw, c[1] + (sd[1] * ca + up[1] * sa) * sg * len + T[1] * fw, c[2] + (sd[2] * ca + up[2] * sa) * sg * len + T[2] * fw], ct)); } }
        }
      };
      // the frond: a unit long down +x, a slow S in plan, its growing end rising toward the surface
      const ph = r() * 6.28, bend = 0.1 + 0.12 * r(), ax = (u) => [u, 0.07 * u * u + 0.012 * Math.sin(u * 7 + ph), bend * Math.sin(u * 2.6 + ph) - bend * Math.sin(ph)];
      brush(ax, 27, 0.072, 0, 1, 0);
      for (let i = 0; i < shoots; i++) { const u0 = 0.2 + 0.5 * (i + r()) / shoots, o = ax(u0), sg = i % 2 ? 1 : -1, out = 0.45 + 0.5 * r(), len = 0.3 + 0.22 * r();
        brush((t) => [o[0] + len * t * (0.85 - 0.1 * t), o[1] + 0.04 * t, o[2] + sg * out * len * t * (1 - 0.25 * t)], 11, 0.054, u0, Math.min(1, u0 + 0.5), 0.5); }
      g.mark = 0;
      return g.build(); };
    K.hornwortDrifts = [];                                                           // for the cast: where each drift lies ({ x, z, r, top, bottom }: its middle, its radius, how far under the surface)
    const [px, , pz] = A(P.punt.at[0], P.punt.at[1], 0), drift = (cx, cz, n, down, spread, deep) => {
      if (list.length < want) K.hornwortDrifts.push({ x: cx, z: cz, r: spread + 0.5, top: deep[0], bottom: deep[1] + 0.1 });
      for (let k = n; k > 0 && list.length < want; k--) { const a = rnd() * 6.28, d = spread * Math.sqrt(rnd()), sc = 0.42 + 0.5 * rnd(), kind = rnd() < 0.5 ? 0 : 1;
        list.push({ x: cx + Math.cos(a) * d, y: -(deep[0] + (deep[1] - deep[0]) * rnd()), z: cz + Math.sin(a) * d, turn: down + (rnd() - 0.5) * 1.1, tiltZ: (rnd() - 0.5) * 0.12, tiltX: (rnd() - 0.5) * 0.5, scale: [sc, sc * (0.8 + 0.4 * rnd()), sc * (0.85 + 0.4 * rnd())], color: tint(rnd, 0.8, 1.15), kind }); } };
    // lodged beside the staithe: against the upstream side of M1 and M2 and of three more of its posts, and a few loose
    // on the sand between the hull and its face (open sand is left between them: the skaters' shadows and the pike are the cast's)
    { const S = P.staithe, f = L.frame(14, {}), down = Math.atan2(-f.tz, f.tx), face = S.d[0];
      for (const [s, d, n, spread] of [[S.M1[0] + 0.14, face + 0.13, 7, 0.24], [S.M2[0] + 0.14, face + 0.15, 6, 0.26], [14.75, face + 0.3, 5, 0.3], [11.4, face + 0.24, 6, 0.36], [9.3, face + 0.34, 4, 0.3], [13.1, face + 0.95, 2, 0.25], [16.0, face + 0.8, 2, 0.3], [12.4, face - 0.4, 3, 0.3], [17.9, face - 0.35, 3, 0.3]]) {
        const [x, , z] = A(s, d, 0), gy = groundY(x, z); if (gy > -0.16) continue;
        drift(x, z, n, down, spread, [0.13, Math.min(0.28, -gy - 0.04)]); } }
    for (let tries = 0; list.length < want && tries < 600; tries++) {
      // a drift over the deep water: six to fourteen fronds lying together
      const s = 2 + rnd() * 34.5, [cx, , cz] = A(s, -7.6 + rnd() * (hw(s) + 6.6), 0); if (groundY(cx, cz) > -0.7 || Math.hypot(cx - px, cz - pz) < 3) continue;      // (deep water only, and clear of the sunk punt)
      const f = L.frame(s, fr); drift(cx, cz, 6 + Math.floor(rnd() * 9), Math.atan2(-f.tz, f.tx), 0.8, [0.14, 0.4]);      // (the rotation.y that turns a frond's +x down the water)
    }
    const stream = {
      uniforms: { uKHull: K.hull },
      vertexPars: /* glsl */`attribute float aSoft; uniform vec4 uRippleRect, uKHull; uniform sampler2D tRipple;`,
      vertexLocal: /* glsl */`
        {
          #ifdef USE_INSTANCING
            vec3 hRoot = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz;
          #else
            vec3 hRoot = modelMatrix[3].xyz;
          #endif
          vec2 hUv = (hRoot.xz - uRippleRect.xy) / uRippleRect.zw + 0.5;
          float hWake = (hUv.x > 0.01 && hUv.x < 0.99 && hUv.y > 0.01 && hUv.y < 0.99) ? clamp(texture2D(tRipple, hUv).a * 4.0, 0.0, 1.0) : 0.0;
          float hJ = fract(sin(dot(hRoot.xz, vec2(12.99, 78.23))) * 43758.5453), hM = aSoft;
          transformed.z += hM * (0.05 + 0.11 * hWake) * sin(uTime * (0.7 + 1.5 * hWake) - hM * 3.2 + hJ * 6.28) + hM * hM * 0.07 * sin(uTime * 0.31 + hJ * 17.0);
          transformed.y += hM * (0.012 + 0.03 * hWake) * sin(uTime * 0.9 - hM * 2.4 + hJ * 11.0);
        }`,
      vertexWorld: /* glsl */`
        { vec2 kRel = wp.xz - uKHull.xy, kFwd = vec2(-uKHull.z, -uKHull.w); float kA = dot(kRel, kFwd) - 0.45, kS = dot(kRel, vec2(-kFwd.y, kFwd.x));
          wp.y -= 0.45 * (1.0 - smoothstep(0.7, 1.2, abs(kS))) * (1.0 - smoothstep(1.9, 2.7, abs(kA))); }`,
    };
    // (under water nothing stands in the sun: with the ride's plain paint the fronds were pale green shards in the tea water)
    const paint = ctx.kit.gouache({ color: (P.grown && P.grown.hornwort) || '#C8C8A8', vertexColors: true, side: THREE.DoubleSide, brush: 0.4, extend: [L.extend({ rim: 0, sun: 0 }), stream] });
    K.hornwort = [0, 1].flatMap((kind) => grown('hornwort ' + 'ab'[kind], brushGeometry(420 + kind * 7, 1 + kind), paint, list.filter((it) => it.kind === kind), { cell: 0, margin: 0.5, mirror: false })); }

  // ============================================================================================ the ford
  // (The stand-in withies, pilings, revetment, far masts and low ricks stood here as one draw; the real ones are kit_pilings.js's.)
  // ---- the ford: 44 flat pale stones 0.55 m down, the crossing the bridge replaced. The model (ford_stone.py: six
  // stones laid by hand and trodden flat: a slab, a kidney, a block with a corner gone, a long one, a cobble, a wedge
  // that has tipped), set as stepping stones are: two wandering rows a stride apart from d -8 to d +8, the long ones
  // across the way one walked, a few knocked out of line downstream by floods. Clear of the towers' feet (d +-8.6).
  { const rnd = ctx.rng(44), F = P.ford, list = [], f = L.frame(F.s, {}), across = Math.atan2(-f.rz, f.rx);      // (the rotation.y that turns a stone's length across the path)
    for (let i = 0; i < F.count; i++) {
      const row = i % 2, k = Math.floor(i / 2) / (F.count / 2 - 1), d = lerp(F.d[0] + 0.25, F.d[1] - 0.25, k) + (rnd() - 0.5) * 0.3 + (row ? 0.35 : 0);
      const strayed = rnd() < 0.14, s = F.s + (row ? 0.34 : -0.34) + 0.35 * Math.sin(d * 0.55) + (rnd() - 0.5) * 0.22 + (strayed ? 0.6 + 0.9 * rnd() : 0);
      const [x, , z] = A(s, d, 0), pick = (i * 5 + Math.floor(rnd() * 3)) % 6, sc = 0.85 + 0.3 * rnd();
      list.push({ x, y: -F.depth - 0.02 - (strayed ? 0.05 : 0), z, turn: across + (pick === 3 ? Math.PI / 2 : 0) + (rnd() - 0.5) * (strayed ? 3 : 0.7), tiltX: (rnd() - 0.5) * (strayed ? 0.3 : 0.06), tiltZ: (rnd() - 0.5) * (strayed ? 0.3 : 0.06), scale: [sc, 0.9 + 0.3 * rnd(), sc], color: tint(rnd, 0.86, 1.1), pick });
    }
    try {
      const M = await rowModel('models/landing/ford_stone.glb', 1.0);
      // (under water: no rim, and half the sun: they are pale, but a stone lit like one on the bank shines through the tea water like a lamp)
      K.ford = M.grow('ford stones', ctx.kit.gouache({ color: '#ffffff', vertexColors: true, brush: 0.8, extend: [L.extend({ rim: 0, sun: 0.5 }), M.pick] }), list, { margin: 0.2, mirror: false });
    } catch (err) { console.error('INVALID_MODEL landing: the ford (assets/models/landing/ford_stone.glb) could not be laid: ' + ((err && err.message) || err)); K.ford = []; }
  }

  // (The stand-in eel traps, their cords and the reed bundles were here; the real ones are kit_pilings.js's: 2-kit-pilings.md.)

  // ============================================================================================ the door
  // The passage out, our half of it: nine cream bolts 2.4 m wide on the gate's line at s 75 (the reach hangs the same
  // nine at its s 2), and twelve more beyond, in the haze.
  //
  // THEY ARE CLOTH (the director's first point: as laid out they were nine pale boards). Each bolt is the engine's
  // DRAPED cloth (docs/life/ribbons.md, "Draped cloth"; docs/build/reach/2-kit-cloth.md): undyed linen cut fuller than
  // the line it is pegged to, hanging in deep folds from its pegs and sagging between them, heavy with the water its hem
  // trails in. No two alike, and each for a reason:
  //   - the hems go INTO the water (the page's bolt is 9 m and brushes it; these are 9.2 to 9.9 m: `under` metres of each
  //     would hang below the surface) and stream with the current there (the engine's `water`), torn: bitten, cut on
  //     the slant, two of them in rags, two with a rent; one (the eighth) hangs clear and drips;
  //   - where a hem has stood in the fen's water the linen is stained tea, in a level line that has wicked up in fingers
  //     (the engine's second dye, `hem` and `band`), and it is wet above that (`wet`: darker, and it lets more of the
  //     light behind it through: `thru`);
  //   - the third has a corner off its pegs; the eighth is bunched toward the mast; the ninth is swept aside and tied
  //     to the right mast (someone went through before the rider);
  //   - widths 0.92 to 1.0 of the plan's and a taper toward the hem: slots of the western light between them.
  // Its weave is the reach's linen (the same cloth hangs on the other side of this door: art/reach/cloth.webp, green:
  // linen with knots; every bolt's `phase` is chosen so that it wears the linen and not the silk).
  { const G = P.gate, heading = path.at(Math.min(G.s, path.length)).heading, bolts = [], lineY = (d) => G.line - G.sag * (1 - (d / G.mast) ** 2);
    const haze = new THREE.Color(P.lookEnd.fog.color), cream = new THREE.Color(QS.get('linen') ? '#' + QS.get('linen') : '#F1E4C4'), rnd = ctx.rng(75), gf = L.frame(G.s, {});
    const linen = (k) => 0.4 + k * 2 / 1.7 + (rnd() - 0.5) * 0.12;                     // (fract(phase x 1.7) > 0.5: the engine's linen)
    const TEA = '#93825F';                                                             // linen that has stood in the fen's water
    // (how much of the tea each bolt's hem has taken. The middle bolt is the one the rider's prow lifts and the rider passes
    // under, with the sun dead behind it: stained as deep as the rest, the last thing seen at arm's length before the
    // light was a brown rag: .shots/landing_kr3_pass_1.png. It is the newest bolt on the line: hardly stained, and wet
    // linen with the sun behind it is the brightest cloth there is. Its neighbours between.)
    const STAIN = [1, 0.9, 1, 0.6, 0.3, 0.6, 1, 0.8, 1];
    const OLD = new THREE.Color('#DACBA6');                                            // linen that has hung through more summers: greyer, a step deeper (no two bolts are one cloth)
    const HANG = [
      { k: 0.96, full: 0.26, pegs: 4, sag: 0.85, fine: 0.60, gather: -0.45, tear: 0.55, skew: 0.55, taper: 0.10, wet: 0.34, under: 0.45 },
      { k: 0.93, full: 0.15, pegs: 5, sag: 0.55, fine: 0.40, rag: 0.7, tear: 0.30, skew: -0.3, taper: 0.07, wet: 0.22, under: 0.05 },
      { k: 0.98, full: 0.21, pegs: 3, sag: 0.70, fine: 0.50, drop: -0.3, tear: 0.30, skew: 0.2, taper: 0.09, wet: 0.30, under: 0.60 },
      { k: 1.00, full: 0.30, pegs: 5, sag: 0.90, fine: 0.70, tear: 0.20, skew: -0.4, taper: 0.12, wet: 0.40, under: 0.85 },
      { k: 0.97, full: 0.17, pegs: 6, sag: 0.60, fine: 0.45, tear: 0.35, skew: 0.3, taper: 0.08, wet: 0.36, under: 0.50 },
      { k: 0.94, full: 0.12, pegs: 4, sag: 0.70, fine: 0.30, rag: 0.45, tear: 0.30, skew: 0.4, taper: 0.06, wet: 0.24, under: 0.15 },
      { k: 1.00, full: 0.24, pegs: 3, sag: 0.85, fine: 0.65, tear: 0.60, skew: -0.5, taper: 0.11, wet: 0.38, under: 0.70 },
      { k: 0.92, full: 0.34, pegs: 4, sag: 0.75, fine: 0.55, gather: 0.7, tear: 0.25, skew: 0.2, taper: 0.10, wet: 0.20, under: -0.12 },
      { k: 0.97, full: 0.24, pegs: 5, sag: 0.65, fine: 0.50, tear: 0.40, skew: -0.6, taper: 0.09, wet: 0.30, under: 0.40, tie: { at: 0.46, side: 1, out: 0.22, tight: 0.3, slack: 0.4 }, stiff: 0.7 },
    ];
    // SECOND LOOK: what the engine's cloth learnt after the door was first dressed (its "third look": docs/life/ribbons.md;
    // the reach's half of this door wears it). Folds CREASED at the pegs (a broad lobe between two pegs, a sharp valley on
    // the peg's own line: against the light one dark rib a fold), no fold as deep as its neighbour (`uneven`), the form of
    // every fold PAINTED as drapery is painted (`form`, below), and from the hems that hang clear of the water or just
    // brush it a FRINGE of tatters and threads. [crease, uneven, fringe] for each of the nine. (&door=1: as first dressed.)
    const LOOK3 = QS.get('door') !== '1', THIRD = [[0.45, 0.8, 0], [0.3, 0.6, 0.9], [0.55, 0.9, 0], [0.35, 0.7, 0], [0.5, 0.55, 0.25], [0.25, 0.85, 0.8], [0.6, 0.6, 0], [0.4, 0.75, 1.0], [0.3, 0.9, 0.3]];
    for (let i = 0; i < G.cloths; i++) { const d = (i - (G.cloths - 1) / 2) * 2.51, y = lineY(d) - 0.02, [x, , z] = A(G.s, d, 0);
      const { k, under, ...hang } = HANG[i % HANG.length], length = y + under;
      if (LOOK3) { const [crease, uneven, fringe] = THIRD[i % THIRD.length]; Object.assign(hang, { crease, uneven, fringe }); }
      bolts.push({ position: [x, y, z], width: G.cloth[0] * k, length, turn: heading + (rnd() - 0.5) * 0.05, color: cream.clone().lerp(OLD, [0.1, 0.55, 0, 0.35, 0, 0.6, 0.05, 0.4, 0.25][i % 9]).multiplyScalar(i === 4 ? 1 : 0.9 + 0.1 * rnd()), phase: linen(i),
        hem: STAIN[i % STAIN.length] < 1 ? cream.clone().lerp(new THREE.Color(TEA), STAIN[i % STAIN.length]) : TEA, band: under > 0 ? 1 - (under + 0.35 + 0.35 * rnd()) / length : 0.95, ...hang,
        ...(STAIN[i % STAIN.length] < 0.5 ? { wet: hang.wet * 0.6 } : {}) }); }
    P.beyond.forEach(([s, half, h], k) => { for (let i = -1; i <= 1; i++) { const d = i * half * 0.62 + (k % 2 ? 1.3 : -1.3), [x, , z] = A(s, d, 0), len = 6.5 + 2.2 * ((k + i + 4) % 3);
      bolts.push({ position: [x, h - 1.7, z], width: 2.6, length: len, turn: heading, color: cream.clone().lerp(haze, 0.35 + 0.12 * k), stiff: 0.7, phase: linen(9 + k * 3 + i + 1),
        full: 0.16 + 0.12 * rnd(), pegs: 4 + (i + k + 5) % 2, sag: 0.4 + 0.4 * rnd(), tear: 0.15 + 0.4 * rnd(), skew: (rnd() - 0.5) * 1.2, taper: 0.06, wet: 0.2 }); } });
    // (the engine's cloth is loaded here and not at the top of the file, so that the day it does not load the reeds still stand)
    try {
      const { makeCloth } = await import('../../engine/cloth.js');
      let paint = {};
      try {
        const [weave, wet] = await Promise.all([ctx.tex('art/reach/cloth.webp', { data: true, repeat: true }), ctx.tex('art/reach/cloth_wet.webp', { data: true, repeat: true })]);
        wet.wrapT = THREE.ClampToEdgeWrapping; wet.needsUpdate = true;
        paint = { weave: { map: weave, fine: 0.35, broad: 3.6, strength: 0.6, mottle: 0.3 }, wetMap: { map: wet, width: 2.4, height: 2.4, line: 0.607 } };
      } catch (err) { console.warn('landing: the painted linen (art/reach/cloth.webp) did not load: the door hangs unpainted'); }
      K.cloth = makeCloth(ctx, bolts, { ...paint, backlight: G.backlight, sway: 0.3, speed: 0.45, part: true, segments: [36, 20], steps: 16, hem: true, wet: 0.3, selvedge: 0.6, thru: 0.85,
        water: { current: [gf.tx, gf.tz], strength: 0.6, wake: 0.6, float: 0.55 }, drape: { rod: false }, pleat: { amount: QS.has('pleat') ? +QS.get('pleat') : LOOK3 ? 0.35 : 0.5, every: 1.5, edge: 0.07 },      // (&pleat=0: without the painted pleats)
        ...(LOOK3 ? { form: { dark: 0.9, lobe: 0.12, deep: 0.5, thru: 0.65, lobeThru: 0.2, hem: 0.5, tatter: 0.6 }, fringe: { count: 14, length: 0.6, width: 0.045 } } : {}),
        // THIRD PERSON: the engine's cloth learnt to BLEED after the door was last dressed (its fifth look): the tea of the
        // fen's water does not end at a line with a comb of fingers above it (.shots/landing_kr3_dI_0.png): it has wicked
        // up the linen over two hands, running further up a fold here and less far there, with a stain where wet and
        // dry lie over one another. (&door=2: without, as the second person left it.)
        ...(LOOK3 && QS.get('door') !== '2' ? { bleed: { width: +(QS.get('bleedw') ?? 0.6), runs: +(QS.get('bleedr') ?? 1.2), stain: +(QS.get('bleeds') ?? 0.3) } } : {}) });
      K.cloth.mesh.name = 'cloth: the door';
      // SEAMS (third person; the director: "weave and seams showing"). A bolt 2.4 m wide never came off one loom: it is
      // sewn of loom widths of 84 cm, selvedge to selvedge, and of two lengths joined across. A felled seam is three
      // layers of linen a finger wide: from the front a ridge that is hardly darker, against the light a thin dark line
      // that follows every fold. They are laid IN the cloth (its own metres across and down, so they hang and move with
      // it), a different set on every bolt. The engine's cloth has no hook for an area's own paint, so they are written
      // into its fragment shader beside its selvedge (asked of the engine in the log); if that line is ever changed the
      // cloth hangs unseamed, as it did, and a warning says so. (&seams=0: without.)
      { const m = K.cloth.material, find = 'albedo *= 1.0 - uRod.w * 0.3 * smoothstep(0.468, 0.495, abs(vAcross));';
        if (QS.get('seams') !== '0') {
          if (m && m.defines && 'DRAPE' in m.defines && m.fragmentShader.includes(find)) {
            m.fragmentShader = m.fragmentShader.replace(find, find + /* glsl */`
        { float kS = abs(fract(cU / 0.84 + sd * 0.61) - 0.5) * 0.84, kJ = abs(cR - (0.3 + 0.42 * fract(sd * 2.3)) * lenF - 0.012 * sin(cU * 7.0 + sd * 3.0));
          float kW = 0.0055, kSeam = max(1.0 - smoothstep(kW, kW + 0.004 + fwidth(cU) * 1.5, kS), 1.0 - smoothstep(kW, kW + 0.004 + fwidth(cR) * 1.5, kJ));
          albedo *= 1.0 - 0.13 * kSeam; clothThru *= 1.0 - 0.5 * kSeam; }`);
            m.needsUpdate = true;
          } else console.warn('landing: the door hangs unseamed (the engine\'s cloth shader has changed: kit.js, "SEAMS")');
        } }
    } catch (err) { console.error('landing: the cloths of the door could not be hung (src/engine/cloth.js): ' + ((err && err.message) || err)); }
    counts.cloth = { count: bolts.length };
    L.label('the door: nine cloths', ...A(G.s, 0, G.line + 1.2)); }

  return {
    update() { const b = ctx.boat; K.hull.value.set(b.x, b.z, Math.sin(b.heading), Math.cos(b.heading)); },
  };
}
