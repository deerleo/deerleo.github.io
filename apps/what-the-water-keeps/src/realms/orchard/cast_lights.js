// The orchard in flood: the cast, group "Lights" (stage 3). The log is docs/build/orchard/3-cast-lights.md.
//
// What lives here (docs/art/orchard.md, section 5; docs/life/lights.md and docs/life/insects.md are the families' pages):
//   FIREFLIES        the area's reserved thing: 7,000, and the 2,520 of them the mirror draws larger. They take over the
//                    light when the afterglow has gone, and they stay only by being cool, slow, uneven, ragged and dark
//                    for longer than they are lit. Their places are strewn HERE, in the page's frame, in the page's four
//                    shares (low along the rows, margins, plank walk and wall of the second avenue; in the skirts of the
//                    oldest tree to 20 m; in the first avenue; in the second avenue's crowns). The front that crosses
//                    them is made here too (makeFront, name `tide`) and handed to the family, so that the set's keeper
//                    can put its light on paint and petals from the same uniforms.
//                    WHAT THEY LIGHT (the family lights nothing but itself): the trunks' feet and the crowns' undersides
//                    near the rider (small ctx.lights that are as bright as the front is at their place), the oldest
//                    tree's face (three that ride a front up it), the lime wash of every trunk however far down the
//                    colonnade (a light of its own inside each trunk: "their light on the white trunks"), and the
//                    petals on the water wherever a front passes (one term more in the set's own sheet of petals:
//                    "their light on the petals").
//   MIDGE COLUMNS    six of 250 at plan.midges, 2 to 4 m up, pale only against the band; they fade with the boat's place
//   BEES COMING HOME dark motes that come out of the last blossom east of the hives, heavy, and walk in; none after s 170
//   THE LAMP'S MOTHS the engine's, with the kept lamp (heroes.js): nothing is added here
//
// THEIR ORDINARY LIFE runs by itself: no firefly at all until the boat has passed s 140; sixty scouts from there; from
// s 160 the steady waves the page leaves behind the tide (one every 8.5 s at 60 per cent), on a clock of this module's
// own. The midges fade between s 120 and 170; the bees stop at s 170. THE STAGING TAKES THE FIREFLIES OVER with
//     const L = shared.cast.fireflies;  L.staged = true;          // in its build(): from then on this module gives them
//                                                                 // no level, no scouts and no clock
//     L.flies.level(...), .scouts(...), .tick(T), .call(...), .wave(...), .repeat(...), .litNear(...)      (the family's)
//     L.one(at), L.three(at), L.forty(at)      the tide's three calls        L.fromWall({ at }), L.fromTree({ at }),
//     L.meet({ at, when, x, z })               its waves                     L.steady({ from })   the waves that stay
// and everything it needs to know is listed at the foot of build(), where shared.cast.fireflies is filled.
// NOTHING HERE PLAYS A SOUND AND NOTHING HERE PLACES A CUE. (shared.cast.fireflies.shimmer is the number the `shimmer`
// layer follows; .hives.near the one the `night` layer follows.)
//
// The page's frame everywhere (shared.frame.at / plan.xz), never the families' own [s, d], which are the engine's path.
//
// Developer switches of this module (in the address):
//   &lion=1          the fireflies as if the boat had passed s 140, wherever it is
//   &liwaves=<s>     the steady waves' clock reads 0 at that many seconds of the realm's time, wherever the boat is
//   &litide=<s>      the page's tide, beat by beat, on a clock that reads 0 at that many seconds of the realm's time (it
//                    only shows what the handles give the staging: the hush, one, three, forty, waves 1 to 4, the steady ones)
//   &lisize=a,b &liminpx=<px> &liint=<x> &limirror=<share> &limirrorsize=<x>      the fireflies' size, floor in pixels, strength, and their mirror set (to try)
//   &liglow=<x>      the light the fronts throw on trunks, crowns and petals near the rider (the realm's own lights), times x (0: none)
//   &litrunks=<x>    the light the fronts throw on the lime wash of every trunk, near or far (0.55; 0: none)
//   &lipetals=<x>    the light the fronts throw on the petals under them, everywhere (0.5; 0: the sheet is not touched)
//   &lieye=x,y,z     the developer's eye moved off the rider's seat: metres to starboard, up, aft (to look down on a front)
//   &liskip=flies,midges,bees,glow,trunks,petals      leave some of it out (for measuring what each costs)
//   &lidebug=<s>     writes .shots/orchard_li_debug.json at that many seconds (how many were strewn where, the columns,
//                    the hives, the bees in the air, the pools of dark as they stand)      &lifov=<degrees>   a long lens (study only)
//   &liall=1         every firefly lit, again and again (study only: where they were strewn, what stands in front of them)
import { makeFireflies, makeFront } from '../../engine/life/lights.js';
import { makeMidges, makeBees } from '../../engine/life/insects.js';
import { FOG_PARS } from '../../engine/kit.js';

const Q = new URLSearchParams(location.search);
const num = (k, d) => (Q.has(k) && Q.get(k) !== '' && isFinite(+Q.get(k)) ? +Q.get(k) : d);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const SKIP = new Set((Q.get('liskip') || '').split(',').map((v) => v.trim()).filter(Boolean));

// ---- the numbers (the page's, and what was settled in pictures: see the log)
const FLY = {
  count: 7000, mirror: 0.36, mirrorSize: 1.7,             // 7,000, and 2,520 of them drawn in the mirror, 1.7 times larger: the page's 2,500
  color: '#d6ee8c', intensity: 3.5,                        // the page's chip, x 3.5
  // metres across, and the smallest a far one is drawn, in pixels. THE PAGE HAS 4 TO 7 CM (the family's default, with a
  // floor of 2.2 px): in this orchard's blue hour, against pale blossom and a bright teal water, those are specks of two
  // or three pixels that cannot be found (pictures: the log). Twice the size and a floor of 3.5 px carry.
  size: [0.09, 0.15], minPixels: 3.5,
  // THE OLDEST TREE'S OWN (its hem and its skirts: the page's 20 per cent) are a second system on the same front. They are
  // only ever seen from the second avenue, 35 to 100 m off through the blue hour's fog (which takes half of a light at
  // 70 m), and at the size above they were two-pixel specks at a fifth of their strength: the wave that climbs the tree
  // could not be found (pictures: the log). A third wider and half as strong again, they read from postcard 7 as the
  // avenue's own do from 35 m. (Wider still, [0.17, 0.28], they carried better but were orbs of 10 to 13 px for a rider
  // who turns back under the tree: lanterns hung in it, which is the one thing this tree must never have.)
  tree: { size: [0.12, 0.2], intensity: 5.5, minPixels: 3.5 },
  // what rides a front up the tree's face: three wide soft lights (see "what the fireflies light")
  climb: { radius: 22, off: 9, gain: 0.15, heights: [1, 5, 9, 13, 17, 20] },
  glow: 1.4, glowColor: '#cfe873',                                            // what a front throws on trunks, crowns and petals (see "what the fireflies light")
  // what a front throws on the petals under it, everywhere (see "their light on the petals"): its strength (in the
  // petals' own measure: 0.5 about doubles a blue-hour petal), its colour, and the field it follows: fireflies that live under
  // `under` metres, counted on squares of `cell` metres, blurred over `blur` metres; `full` of them to the square metre
  // light a petal fully, fewer by the power `curve`
  petals: { gain: 0.5, color: '#cfe873', under: 3.2, cell: 1.0, blur: 2.4, full: 0.45, curve: 0.7 },
  // what a front throws on the lime wash of every trunk the realm's own eight lights do not reach (see "their light on
  // the white trunks"): its strength, its colour, the light's own form inside a trunk (metres across at the water and at
  // its top, the heights of its rings, its sides), how far in front of that form the paint it lights may stand (metres),
  // and the fireflies that count for a trunk: those under `under` metres within `within` of its foot, `full` of them for all of it
  trunks: { gain: 0.55, color: '#d6ee8c', across: [0.38, 0.30], round: 0.6, heights: [0.05, 1.0, 2.0], sides: 6, bias: 0.35, under: 3.2, within: 3.9, full: 9, got: 1.0, top: [0.7, 2.0] },
  share: { low: 0.55, tree: 0.20, first: 0.15, crowns: 0.10 },
  low: { rows: 0.40, margins: 0.36, walk: 0.09, wall: 0.15 },      // how the low 55 per cent is dealt out
  firstRows: 0.52,                                         // of the first avenue's share: at the rows; the rest in its margins
  hem: 0.25,                                               // of the oldest tree's share: low, under the hem of its crown; the rest on its skirts
  scouts: 60, scoutEvery: [5, 9], scoutBelow: 0.42, scoutPool: 300,      // (see "the scouts" in strew())
  lit: 140, waves: 160,                                    // the page's s: none before the first; the waves from the second
  lamp: 7, stag: 4, egret: 2,                              // pools of dark, metres
  lampClear: 10.6,                                         // none is given a place nearer the kept lamp than its pool's soft edge
  speed: 14, back: 21,                                     // a front's speed; metres behind the wall (or the tree) a wave is started, so that its line has crossed nothing when it leaves
  steady: { from: 5, every: 8.5, strength: 0.6 },          // in their ordinary life the first wave leaves the wall 5 s after the boat has passed s 160
};
const MIDGE = { count: 250, width: 1.2, middle: 3.0, height: 2.0, rise: 0.4, period: 1.43, fade: [120, 170],
  // pale against the band (the band's own warm white), a dim plum speck against anything else; at blue hour, what is left of them is lilac
  // (pale: the band's own light on them, a warm peach. As a cream white (#f6e2c8, the first try) a column could not be told
  // from the blossom and the falling petals behind it: pictures in the log.)
  // (opacity above 1: the family draws a far midge as a faint fleck, the fainter the farther, and at 25 to 45 m (the
  // columns ahead, from the reveal) nothing of a column could be found. A near fleck is already whole and stays as it
  // was; a far column is now a haze that can be found, and at 2.4 it was a pale clot. `dull` is brought down by as much,
  // so that seen away from the band they are the dim specks they were.)
  pale: '#f8d6a8', paleBlue: '#b9b4d4', dim: '#3a3344', dimBlue: '#2a2a40', opacity: 1.6, power: 2.5, dull: 0.15, size: 0.010, minPixels: 6.5 };
const BEE = { homing: 40, walkers: 12, every: 1.5, speed: [1.5, 2.5], stop: 170, board: [0.3, 0.12], size: 2.4, minPixels: 7, maxGrow: 6,
  // a bee seen from further off than the family's own form carries: a round dark mote (see "the bees coming home"): pixels across, from and to how many metres, its colour in the afterglow and at blue hour
  mote: { px: 4.6, from: [5.5, 8.5], to: [30, 42], color: '#2a2218', colorBlue: '#161a2a' } };      // (size: drawn 4.8 cm, under four times life, as the petals (7.5 cm) and the fireflies are drawn large: at the family's 2 cm not one could be found from three metres, and at 3.2 cm they were flecks of four pixels on the hives' faces from five)

export async function build(ctx, plan, shared) {
  const { THREE, kit } = ctx, F = shared.frame, here = shared.here || { s: 0, d: 0 };
  const cast = shared.cast = shared.cast || {};
  const V = (s, d, y = 0) => F.at(s, d, y);
  const lampAt = shared.lamp && shared.lamp.position ? shared.lamp.position.clone() : V(plan.lamp.flame[0], plan.lamp.flame[1], plan.lamp.flame[2]);
  const treeAt = V(plan.tree.at[0], plan.tree.at[1]), wallMid = V(plan.left.wall.s, 0);
  const debug = { strewn: {}, notes: [] };

  // The first builder's still fireflies (cast.js, with &crowd=1 only: 'crowd:firefly' and its mirror set, discs strewn
  // along s 120 to 216 for measuring the multitude's weight) stood for these. The real ones live and are measured (the
  // log): the stand-ins go, so that a picture taken with &crowd=1 does not count the fireflies twice. (Their geometry and
  // their paint are their own: nothing else wears them.)
  { const gone = []; ctx.group.traverse((o) => { if (o.name === 'crowd:firefly' || o.name === 'crowd:firefly (mirror)') gone.push(o); });
    for (const o of gone) { if (o.parent) o.parent.remove(o); if (typeof o.dispose === 'function') o.dispose(); }
    if (gone.length) { if (gone[0].geometry) gone[0].geometry.dispose(); if (gone[0].material && gone[0].material.dispose) gone[0].material.dispose(); } }

  // &lieye=x,y,z (developer): the eye moved off the rider's seat
  if (Q.has('lieye')) { const q = Q.get('lieye').split(',').map(Number), cam = ctx.engine.camera; if (q.length === 3 && q.every(Number.isFinite)) { cam.position.set(q[0], q[1], q[2]); ctx.onDispose(() => cam.position.set(0, 0, 0)); } }

  // ============================================================================================== what stands in the way
  // Trunks, the bole, props and crutches, the hives, the wall and its piers, the cart: no firefly is given a place in
  // or against any of them (each strays up to 0.9 m from its place), nor on the lane a hull keeps open, nor within
  // reach of the kept lamp.
  const CELL = 6, grid = new Map();
  const stake = (x, z, r, top) => { const k = Math.floor(x / CELL) + ',' + Math.floor(z / CELL); (grid.get(k) || grid.set(k, []).get(k)).push([x, z, r, top]); };
  for (const t of plan.trees.trees) stake(t.x, t.z, 1.0, 3.4);
  for (const t of plan.trees.far) stake(t.x, t.z, 0.9, 3.4);
  const posts = shared.crutchFeet && shared.crutchFeet.length ? shared.crutchFeet.map((c) => [c.x, c.z])
    : [...plan.tree.props.map(([s, d]) => plan.xz(s, d)), ...plan.trees.trees.filter((t) => t.low).map((t) => plan.xz(t.s, t.d + (t.d > 0 ? -4.6 : 4.6)))];
  for (const [x, z] of posts) stake(x, z, 0.7, 6.5);
  for (const l of plan.left.ladders) { const p = plan.xz(l.foot[0], l.foot[1]); stake(p[0], p[1], 0.7, 4.2); }
  { const p = plan.xz(plan.tree.arch.daughter.at[0], plan.tree.arch.daughter.at[1]); stake(p[0], p[1], 1.3, 6); }      // where the arch has rooted: its foot and the daughter stem
  const standsIn = (x, y, z) => {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const list = grid.get((cx + i) + ',' + (cz + j)); if (list) for (const [px, pz, r, top] of list) if (y < top && (x - px) * (x - px) + (z - pz) * (z - pz) < r * r) return true; }
    return false;
  };
  const H = plan.left.hives.at, W = plan.left.wall, CART = plan.left.handcart, walkOf = plan.left.plankWalk, _l = {};
  const free = (x, y, z) => {
    const p = plan.locate(x, z, _l), s = p.s, d = p.d;
    if (s < 27.5) return false;                                                                    // nothing inside the loft or in its door
    if (standsIn(x, y, z)) return false;
    if (y < 6.5 && Math.hypot(x - treeAt.x, z - treeAt.z) < 4.6) return false;                     // the bole and its roots
    if (y < 1.5 && Math.abs(s - H[0]) < 2.7 && Math.abs(d - H[1]) < 1.1) return false;             // the hives on their stand
    if (Math.abs(s - W.s) < 0.5 && Math.abs(d) > 8.3 && y < 1.4) return false;                     // the wall
    if (Math.abs(s - W.s) < 0.8 && Math.abs(d) > 8.2 && Math.abs(d) < 9.6 && y < 2.8) return false;      // its piers
    if (y < 2.2 && Math.hypot(s - (CART.at[0] + CART.tree[0]) / 2, d - (CART.at[1] + CART.tree[1]) / 2) < 1.8) return false;      // the cart
    if (y < 2.6 && s < W.s + 0.5 && Math.abs(d - plan.lineD(s)) < 2.6) return false;               // the lane: a hull keeps it, and it stays black
    if (Math.hypot(x - lampAt.x, y - lampAt.y, z - lampAt.z) < FLY.lampClear) return false;        // the kept lamp is the only light where it hangs
    return true;
  };

  // ============================================================================================== the fireflies' places
  // 55 per cent within 2.5 m of the water along the rows, margins, plank walk and wall from s 120 to 216; 20 per cent in
  // the skirts of the oldest tree up to 20 m; 15 per cent in the first avenue; 10 per cent in the second avenue's
  // crowns (the page). UNEVEN: they gather where the cow parsley stands (shared.plants.umbels: round every trunk's
  // mound, thick in the margins, along the wall's foot) and thin out in patches between.
  const oldLobes = ((shared.blossom && shared.blossom.all) || []).filter((b) => b.old);      // the blossom of the oldest tree, mass by mass
  const strew = () => {
    const rnd = ctx.rng(7140), N = FLY.count, out = new Float32Array(N * 3), tally = {};
    let n = 0;
    const gauss = () => (rnd() + rnd() + rnd() - 1.5) * 2;
    const patch = (x, z) => 0.12 + 0.88 * smooth(0.36, 0.6, kit.fbm(x * 0.05, z * 0.05, 2, 311));
    const put = (name, x, y, z) => { out[n * 3] = x; out[n * 3 + 1] = y; out[n * 3 + 2] = z; n++; tally[name] = (tally[name] || 0) + 1; };
    // `count` places from a maker of candidates ([x, y, z] or null); `patchy`: thinned in patches
    const fill = (name, count, make, patchy = true) => {
      const from = n; let tries = 0;
      while (n - from < count && n < N && tries++ < count * 60) {
        const c = make(); if (!c) continue;
        if (!free(c[0], c[1], c[2])) continue;
        if (patchy && rnd() > patch(c[0], c[2])) continue;
        put(name, c[0], c[1], c[2]);
      }
      if (n - from < count) debug.notes.push(`${name}: ${n - from} of ${count} placed`);
      return [from, n];
    };
    const low = (h = 2.07, k = 2.0) => 0.43 + h * Math.pow(rnd(), k);                              // within 2.5 m of the water, most of them low
    const rowsOf = (s0, s1) => plan.trees.trees.filter((t) => t.s >= s0 && t.s <= s1);
    const umbels = (shared.plants && shared.plants.umbels) || [];
    const marginOf = (s0, s1) => umbels.filter((u) => { const p = plan.locate(u.x, u.z, _l); return p.s >= s0 && p.s <= s1 && Math.abs(p.d) >= 28 && Math.abs(p.d) <= 41; });
    // at a row: round a trunk's foot (its mound, its cow parsley, its collar of petals), or along the row between trunks
    const atRows = (trees, s0, s1) => () => {
      if (rnd() < 0.56 && trees.length) { const t = trees[Math.floor(rnd() * trees.length)], a = rnd() * 6.2832, r = 1.05 + 2.7 * Math.pow(rnd(), 1.5); return [t.x + Math.cos(a) * r, low(), t.z + Math.sin(a) * r]; }
      // (the rows next to the lane spill a little way out over the avenue's own water: a hull on the lane carries its
      // five metres of dark through the thin edge of them)
      const row = [-28, -19, -10, 10, 19, 28][Math.floor(rnd() * 6)], inner = Math.abs(row) === 10 && rnd() < 0.5;
      const p = plan.xz(s0 + rnd() * (s1 - s0), inner ? row - Math.sign(row) * 3.4 * Math.abs(gauss()) : row + 1.4 * gauss());
      return [p[0], low(), p[1]];
    };
    // in a margin: over the cow parsley that stands there (or, should the plants not be built, anywhere along it)
    const atMargin = (list, s0, s1) => () => {
      if (list.length) { const u = list[Math.floor(rnd() * list.length)]; return [u.x + 1.5 * gauss(), Math.min(2.5, Math.max(0.43, u.y + 0.25 + 1.9 * rnd() * rnd())), u.z + 1.5 * gauss()]; }
      const p = plan.xz(s0 + rnd() * (s1 - s0), (rnd() < 0.5 ? -1 : 1) * (28.5 + 9.5 * Math.pow(rnd(), 1.5))); return [p[0], low(), p[1]];
    };

    // ---- the ones the tide calls by name (the staging's first beats): one by the fallen ladder, three that answer
    const named = { one: null, three: [] };
    { const p = V(176, 8, 0.6); if (free(p.x, p.y, p.z)) { named.one = p; put('named', p.x, p.y, p.z); } else debug.notes.push('the one by the fallen ladder has no free place'); }
    for (const [s, d, y] of [[173.8, -8.6, 0.7], [176.6, -11.3, 0.9], [179.2, -9.2, 0.6]]) { const p = V(s, d, y); if (free(p.x, p.y, p.z)) { named.three.push(p); put('named', p.x, p.y, p.z); } }

    // ---- low, the second avenue (s 120 to 216)
    const lowAll = Math.round(N * FLY.share.low), nLow = lowAll - n, L = FLY.low;
    const rows = fill('rows', Math.round(nLow * L.rows), atRows(rowsOf(120, 216), 120, 215.2));
    fill('margins', Math.round(nLow * L.margins), atMargin(marginOf(120, 216), 120, 215.2), false);      // (the cow parsley stands in drifts of its own: no second thinning)
    // the plank walk: just over and beside its boards, from the hives' end to the stile (it is drawn in points when a front passes)
    const walk = plan.left.plankWalk;
    fill('walk', Math.round(nLow * L.walk), () => { const p = plan.xz(walk.from + 0.6 + rnd() * (walk.to - walk.from - 0.6), walk.d + clamp(0.75 * gauss(), -1.7, 1.7)); return [p[0], 0.6 + 1.3 * Math.pow(rnd(), 1.8), p[1]]; }, false);
    // the wall's foot, hedge to hedge, on the orchard's side of the stones (and a few over its coping)
    fill('wall', lowAll - n, () => {
      const d = (rnd() < 0.5 ? -1 : 1) * (9.6 + 46 * Math.pow(rnd(), 1.25)), p = plan.xz(W.s - 0.55 - 1.7 * Math.pow(rnd(), 1.4), d);
      return [p[0], 0.43 + 1.5 * Math.pow(rnd(), 1.6), p[1]];
    }, false);
    // ---- THE SCOUTS. The family lets the first sixty of its (shuffled) list that live under `scoutBelow` pulse alone.
    // The page has them "low in the side aisles" of the second avenue, ahead of a boat that has just left the pond: so
    // only places there are given a height under that line (0.34 to 0.42 m: a hand over the petals), three hundred of
    // them, and the sixty are drawn from those. Every other firefly lives at 0.43 m or higher.
    { let made = 0;
      for (let i = rows[0]; i < rows[1] && made < FLY.scoutPool; i++) {
        const p = plan.locate(out[i * 3], out[i * 3 + 2], _l);
        if (p.s > 138 && p.s < 214 && Math.abs(p.d) > 6 && Math.abs(p.d) < 27) { out[i * 3 + 1] = 0.34 + 0.075 * rnd(); made++; }
      }
      tally.scoutPool = made; }

    // ---- the first avenue (s 28 to the pond's east rim)
    const nFirst = Math.round(N * FLY.share.first);
    fill('first rows', Math.round(nFirst * FLY.firstRows), atRows(rowsOf(28, 104), 28, 100));
    fill('first margins', nFirst - Math.round(nFirst * FLY.firstRows), atMargin(marginOf(28, 108), 28, 108), false);

    // ---- the skirts of the oldest tree, up to 20 m: low under the hem of its crown, and on the outsides and
    // undersides of its lower blossom (a front climbs it from there: later by a second for every five metres)
    const nTree = Math.round(N * FLY.share.tree), nHem = Math.round(nTree * FLY.hem), treeFrom = n;
    // (No firefly exists until the boat has left the pond, so the tree's are only ever seen from the second avenue, or
    // by a rider who has turned back: three in four of them are on the side of the tree that the second avenue sees.)
    const seen = (x, z) => { const ox = x - treeAt.x, oz = z - treeAt.z, l = Math.hypot(ox, oz) || 1; return 0.25 + 0.75 * smooth(-0.35, 0.45, (ox * west.x + oz * west.z) / l); };
    fill('tree hem', nHem, () => { const a = rnd() * 6.2832, r = 19 + 10.5 * rnd(), x = treeAt.x + Math.cos(a) * r, z = treeAt.z + Math.sin(a) * r; return rnd() < seen(x, z) ? [x, 0.43 + 2.6 * Math.pow(rnd(), 1.5), z] : null; });
    const old = oldLobes.filter((b) => b.c.y - b.rad < 20);
    // a place a little outside a mass of blossom, on its side or its underside; (bx, bz): the side it is seen from
    const onLobe = (b, up, bx = 0, bz = 0) => {
      // (the blossom is drawn up to 0.95 m nearer the eye than it stands, from 17 m off: a light less than a metre in front
      // of a far mass is hidden by it. So: well clear of the mass.)
      let y = -0.95 + (0.95 + up) * rnd(); const h = Math.sqrt(Math.max(0, 1 - y * y)), a = rnd() * 6.2832, r = b.rad * (1.05 + 0.3 * rnd()) + 0.6;
      let dx = Math.cos(a) * h + bx, dz = Math.sin(a) * h + bz; const l = Math.hypot(dx, y, dz) || 1; dx /= l; y /= l; dz /= l;
      const p = [b.c.x + dx * r, b.c.y + y * r, b.c.z + dz * r];
      for (const m of b.mates || []) if (m !== b && Math.hypot(p[0] - m.c.x, p[1] - m.c.y, p[2] - m.c.z) < m.rad * 0.92) return null;      // inside its neighbour: never seen
      return p;
    };
    if (old.length) {
      // (more of them low and on the outside of the crown: the skirts)
      const w = old.map((b) => b.rad * b.rad * (0.25 + 0.75 * smooth(7, 24, Math.hypot(b.c.x - treeAt.x, b.c.z - treeAt.z))) * (1 - 0.6 * smooth(8, 20, b.c.y)) * seen(b.c.x, b.c.z)), sum = w.reduce((a, b) => a + b, 0);
      const pick = () => { let r = rnd() * sum; for (let i = 0; i < old.length; i++) { r -= w[i]; if (r <= 0) return old[i]; } return old[old.length - 1]; };
      // (on the outside of each mass: the side turned away from the bole)
      fill('tree skirts', nTree - nHem, () => { const b = pick(), ox = b.c.x - treeAt.x, oz = b.c.z - treeAt.z, l = Math.hypot(ox, oz) || 1, p = onLobe(b, 0.35, 0.9 * ox / l, 0.9 * oz / l); return p && p[1] > 2.4 && p[1] <= 20.5 && rnd() > smooth(12.5, 21, p[1]) ? p : null; }, false);      // (they thin away upward from 12 m: a front that climbs the tree dissolves toward its top, and does not end in a row of lights at 20 m)
    } else {
      // (the blossom is not built: the crown's own outline stands in, a dome 29 m across at the water, drawn in to its top)
      fill('tree skirts', nTree - nHem, () => { const y = 5 + 15 * Math.pow(rnd(), 1.4), a = rnd() * 6.2832, r = (29 - 0.022 * y * y) * (0.82 + 0.2 * rnd()); return [treeAt.x + Math.cos(a) * r, y, treeAt.z + Math.sin(a) * r]; }, false);
    }
    const treeTo = n;

    // ---- the second avenue's crowns: on the sides and undersides of its blossom, most in the rows the lane runs between
    const stands = ((shared.blossom && shared.blossom.trees) || []).filter((st) => st.kind === 'near' && st.t.s >= 134 && st.t.s <= 216 && st.lobes && st.lobes.length);
    if (stands.length) {
      const ws = stands.map((st) => (Math.abs(st.t.row) === 10 ? 1 : Math.abs(st.t.row) === 19 ? 0.75 : 0.45)), sum = ws.reduce((a, b) => a + b, 0);
      const pick = () => { let r = rnd() * sum; for (let i = 0; i < stands.length; i++) { r -= ws[i]; if (r <= 0) return stands[i]; } return stands[stands.length - 1]; };
      // (more of them on the side of a crown that is turned to the lane)
      fill('crowns', N - n, () => { const st = pick(), side = -Math.sign(st.t.d) * 0.6, h = plan.turned(st.t.s), p = onLobe(st.lobes[Math.floor(rnd() * st.lobes.length)], 0.5, Math.cos(h) * side, Math.sin(h) * side); return p && p[1] > 2.3 ? p : null; }, false);
    } else {
      const trees = rowsOf(134, 216);
      fill('crowns', N - n, () => { const t = trees[Math.floor(rnd() * trees.length)], a = rnd() * 6.2832, r = 2.2 + 2.6 * rnd(); return [t.x + Math.cos(a) * r, 2.9 + 4.5 * rnd() * rnd(), t.z + Math.sin(a) * r]; }, false);
    }
    // two lists: the oldest tree's own, and all the rest (the ones called by name are the first of the rest)
    const tree = out.slice(treeFrom * 3, treeTo * 3), points = new Float32Array((n - (treeTo - treeFrom)) * 3);
    points.set(out.subarray(0, treeFrom * 3), 0); points.set(out.subarray(treeTo * 3, n * 3), treeFrom * 3);
    return { points, tree, n, low: points.length / 3, tally, named };
  };

  // ============================================================================================== the front, and the fireflies
  // One front for every wave of the tide (the page: 19 m deep at 14 m/s; later by |d| / 40 s to the sides and by
  // height / 5 s upward; each firefly up to 0.35 s off and 6 in 100 out of step; 1.5 times where two cross; with reduced
  // motion a slow swell of the whole field, 10 s, 60 per cent). Made here and handed to the family, so that anything
  // else that must take the passing light reads the same uniforms (front.glsl, front.uniforms: docs/life/lights.md).
  const east = treeAt.clone().sub(wallMid).setY(0).normalize(), west = east.clone().negate();      // the way the tide travels: from the wall's middle toward the oldest tree (the avenue bends 25 degrees between them: this chord is 7 degrees off the first straight and 18 off the second)
  // where a wave from the wall is started (behind it, in the mist), and one from the tree (behind its bole, on the first avenue's side)
  const wallBack = wallMid.clone().addScaledVector(east, -FLY.back), treeBack = treeAt.clone().addScaledVector(east, FLY.back);
  let flies = null, front = null, strewn = null, steady = null;
  const dark = Array.from({ length: 8 }, () => ({ who: null, position: new THREE.Vector3(0, -1000, 0), radius: 0, source: null, given: false }));
  if (!SKIP.has('flies')) {
    strewn = strew(); debug.strewn = strewn.tally; debug.count = strewn.n;
    // (Should the set's keeper want the front's light in the paint itself, pixel by pixel, the front must exist before the
    // paint is made: let set.js make it with these same options, with no clock, and publish it as shared.tide: it is taken
    // from there. Then set shared.cast.fireflies.glow.gain to 0, or the trunks are lit twice.)
    front = shared.tide && shared.tide.glsl && shared.tide.launch ? shared.tide : makeFront(ctx, { name: 'tide', shape: 'line', speed: FLY.speed, lateral: 1 / 40, climb: 1 / 5, rag: 0.35, stray: 0.06, strayBy: 1.4,
      profile: 'pulse', rise: 0.3, hold: 0.15, fall: 0.9, cap: 1.5, waves: 6, origin: wallBack.toArray(), dir: east.toArray(), calm: { swell: 10, max: 0.6 } });
    const size = Q.has('lisize') ? Q.get('lisize').split(',').map(Number) : FLY.size, sizeTree = Q.has('litreesize') ? Q.get('litreesize').split(',').map(Number) : FLY.tree.size;
    const mirror = num('limirror', FLY.mirror), mirrorSize = num('limirrorsize', FLY.mirrorSize);
    const low = makeFireflies(ctx, { points: strewn.points, front, color: FLY.color, intensity: num('liint', FLY.intensity), size, minPixels: num('liminpx', FLY.minPixels), mirror, mirrorSize,
      scouts: FLY.scouts, scoutEvery: FLY.scoutEvery, scoutBelow: FLY.scoutBelow, avoid: dark, seed: 3140 });
    low.object.name = 'fireflies';
    const high = strewn.tree.length ? makeFireflies(ctx, { points: strewn.tree, front, color: FLY.color, intensity: num('litreeint', FLY.tree.intensity), size: sizeTree, minPixels: num('litreepx', FLY.tree.minPixels), mirror, mirrorSize,
      scouts: 0, avoid: dark, seed: 3141 }) : null;
    if (high) high.object.name = 'fireflies (the oldest tree)';
    // ONE HANDLE for the two: everything the family's handle gives (docs/life/lights.md), acting on both
    flies = {
      object: low.object, objects: high ? [low.object, high.object] : [low.object], parts: { low, tree: high },
      front, avoid: dark, count: low.count + (high ? high.count : 0), direct: low.direct, mirrored: low.mirrored,
      tick(T) { front.tick(T); return flies; },
      wave(w = {}) { return front.launch(w); },
      repeat(r = {}) { return front.repeat(r); },
      /** As the family's call. One firefly (or the few nearest a place) is looked for among the low ones, or, for a place in
       *  the oldest tree's crown, among the tree's; a call by `radius` alone goes to both. Returns the low system's call number. */
      call(c = {}) {
        const q = c.near || [0, 0, 0], x = q.x ?? q[0] ?? 0, y = q.y ?? q[1] ?? 0, z = q.z ?? q[2] ?? 0;
        const inTree = !!high && y > 2.4 && Math.hypot(x - treeAt.x, z - treeAt.z) < 31;
        if (c.count == null && c.radius != null) { if (high) high.call(c); return low.call(c); }
        return inTree ? high.call(c) : low.call(c);
      },
      scouts(level, seconds) { low.scouts(level, seconds); return flies; },
      level(v, seconds) { low.level(v, seconds); if (high) high.level(v, seconds); return flies; },
      litNear(x, y, z, radius) { return low.litNear(x, y, z, radius); },
    };
    flies.level(0, 0.5);                                           // none at all before the lamp has been passed
  }

  // ============================================================================================== the pools of dark
  // No firefly lights within 7 m of the kept lamp, 4 m of the stag, 2 m of an egret (the hull's 5 m, soft to 8, and its
  // six seconds of track are the family's own). Eight places: 0 the lamp, 1 the stag, 2 to 7 the six egrets. They are
  // read every frame from whoever has published them in shared.cast (this module need not build after the others).
  dark[0].who = 'lamp'; dark[0].position.copy(lampAt); dark[0].radius = FLY.lamp;
  dark[1].who = 'stag';
  for (let i = 2; i < 8; i++) dark[i].who = 'egret ' + (i - 1);
  // whatever in shared.cast is a wader (the family's handle: a position, stations, flyTo), wherever its group put it
  const isWader = (o) => o && typeof o === 'object' && o.position && o.position.isVector3 && (typeof o.flyTo === 'function' || Array.isArray(o.stations)) && o !== cast.stag;
  const isBats = (o) => o && typeof o === 'object' && o.species === 'bat' && typeof o.position === 'function' && typeof o.nearest === 'function';
  const found = { waders: [], bats: [] };
  const seek = () => {
    found.waders.length = 0; found.bats.length = 0;
    const seen = new Set(), look = (o, depth) => {
      if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
      if (isWader(o)) { if (found.waders.length < 6) found.waders.push(o); return; }
      if (isBats(o)) { found.bats.push(o); return; }
      // (only plain objects and short lists are looked into: never a buffer, a model or a vector)
      const plain = Array.isArray(o) ? o.length <= 64 : Object.getPrototypeOf(o) === Object.prototype;
      if (depth >= 2 || !plain) return;
      for (const v of Array.isArray(o) ? o : Object.values(o)) if (v && typeof v === 'object') look(v, depth + 1);
    };
    for (const [key, v] of Object.entries(cast)) { if (key === 'fireflies' || key === 'lights' || key === 'midges' || key === 'bees' || key === 'stag' || key === 'falls') continue; look(v, 0); }
  };
  const keepDarkNow = () => {
    const st = cast.stag;
    if (!dark[1].given) { if (st && st.dark) { dark[1].position.set(st.dark.x, st.dark.y, st.dark.z); dark[1].radius = FLY.stag; } else dark[1].radius = 0; }
    for (let i = 2; i < 8; i++) {
      const sl = dark[i]; if (sl.given) continue;
      const b = found.waders[i - 2];
      if (b && b.state !== 'gone') { sl.position.copy(b.position); sl.radius = FLY.egret; } else sl.radius = 0;
    }
    for (const sl of dark) if (sl.given && sl.source) { const p = typeof sl.source === 'function' ? sl.source() : sl.source; if (p) sl.position.set(p.x, p.y, p.z); }
  };

  // ============================================================================================== published
  const api = cast.fireflies = cast.lights = {
    /** The family's handle (docs/life/lights.md): level, scouts, call, wave, repeat, tick, litNear, front, avoid, count, object. */
    flies,
    /** The tide's front (makeFront, name `tide`): glsl and uniforms for a shader, launch, arrival, level, distance ... */
    front,
    /** false: the fireflies live by themselves (see the top of this file). true: the staging gives level, scouts and the clock. */
    staged: false,
    /** The eight pools of dark: [{ who, position (Vector3), radius }]: 0 the kept lamp, 1 the stag, 2..7 the egrets. */
    dark,
    /** Give a pool of dark a source of your own: keepDark('egret 3', bird.position, 2), keepDark('stag', () => vector, 4). Returns the pool, or null if no such pool. */
    keepDark(who, source, radius) { const sl = dark.find((q) => q.who === who) || dark.find((q) => !q.given && q.radius === 0 && q.who !== 'lamp'); if (!sl) return null; sl.who = who; sl.source = source; sl.radius = radius; sl.given = true; return sl; },
    /** Places and ways, in the realm: where a wave from the wall and from the tree is started, and the way the tide travels. */
    places: { wall: wallMid, tree: treeAt, wallBack, treeBack, lamp: lampAt, one: strewn && strewn.named.one, three: strewn ? strewn.named.three : [] },
    east, west, speed: FLY.speed,
    /** How lit the air round the boat is, 0..1, every frame: what the `shimmer` layer follows (0.4 times this). */
    shimmer: 0,
  };
  if (flies) {
    // ---- the tide's calls and waves, as the page words them. `at` is a time on the clock the staging ticks the
    // fireflies with (flies.tick(T)); left out: now.
    const now = () => Math.max(0, front.T);
    // (the family calls by a sphere: four of them, two along the walk and one on the wall's foot either side of the gap,
    // ten or so to answer in each)
    const forty = [[183, 14.5, 0.9, 9.5, 0], [201, 14.5, 0.9, 9.5, 0.15], [215, 21, 0.8, 9.5, 0.35], [215, -19, 0.8, 10.5, 0.3]].map(([fs, fd, fy, radius, delay]) => {
      const near = V(fs, fd, fy); let inside = 0;
      for (let i = 0; i < strewn.low; i++) if (Math.hypot(strewn.points[i * 3] - near.x, strewn.points[i * 3 + 1] - near.y, strewn.points[i * 3 + 2] - near.z) <= radius) inside++;
      return { near, radius, delay, share: clamp(10 / Math.max(10, inside), 0.02, 1), inside };
    });
    debug.forty = forty.map((f) => f.inside);
    Object.assign(api, {
      /** One firefly on the right by the fallen ladder at (176, +8), 0.6 m up: one pulse. */
      one(at = now()) { return api.places.one ? flies.call({ at, near: api.places.one, count: 1 }) : -1; },
      /** Three answer on the left, between s 172 and s 180, one after another over 0.6 s. */
      three(at = now()) { return api.places.three.map((p, i) => flies.call({ at: at + [0, 0.25, 0.6][i], near: p, count: 1 })); },
      /** About forty along the plank walk and the foot of the wall, over 1.2 s. */
      forty(at = now()) { return forty.map((f) => flies.call({ at: at + f.delay, near: f.near, radius: f.radius, share: f.share, over: 1.0 })); },
      /** A wave that leaves the wall at clock time `at` and travels east (it is started 21 m behind the wall, 1.5 s
       *  before: ask for it at least that long ahead, or it leaves late by what is missing). Returns its number. */
      fromWall({ at = now() + FLY.back / FLY.speed, strength = 1 } = {}) { const t0 = Math.max(now(), at - FLY.back / FLY.speed); return flies.wave({ at: t0, origin: wallBack, dir: east, strength }); },
      /** A wave that leaves the oldest tree's western skirt at `at` and travels west (started behind the bole, 3.6 s before). */
      fromTree({ at = now() + (29 + FLY.back) / FLY.speed, strength = 1 } = {}) { const t0 = Math.max(now(), at - (29 + FLY.back) / FLY.speed); return flies.wave({ at: t0, origin: treeBack, dir: west, strength }); },
      /** Two fronts at once, one from the west and one from the east, that leave at `at` and cross at (x, z) at `when`
       *  (wave 3: where the boat is). 1.5 times where they cross, not twice. Returns their two numbers. */
      meet({ at = now(), when = now() + 2.5, x = ctx.boat.x, z = ctx.boat.z, strength = 1 } = {}) {
        const reach = { x, y: 0, z, at: Math.max(when, at + 0.5) };
        return [flies.wave({ at, dir: east, reach, strength }), flies.wave({ at, dir: west, reach, strength })];
      },
      /** The waves that stay: one from the wall every 8.5 s at 60 per cent from clock time `from`, for as long as the clock runs. Returns { stop() }. */
      steady({ from = 37, every = FLY.steady.every, strength = FLY.steady.strength } = {}) { return flies.repeat({ from: from - FLY.back / FLY.speed, every, origin: wallBack, dir: east, strength }); },
    });
    // their ordinary life: the steady waves, on this module's own clock (it reads 0 as the boat passes s 160)
    steady = api.steady({ from: FLY.steady.from });
  }

  // ============================================================================================== what the fireflies light
  // The family lights nothing but itself. The page (section 6, the tide; section 7): as a front passes, every near trunk
  // is a white column lit from below, the undersides of the crowns are green-gold, and the petals take the colour for as
  // long as the fireflies are lit. The area's paint and its sheet of petals both take the realm's local lights
  // (ctx.light: the eight that matter most from where the rider is), so: a small light of the fireflies' own colour low
  // at the foot of every avenue tree (where they gather), along the plank walk, along the wall's foot, and round and up
  // the skirts of the oldest tree. Each is as bright as the front is at its place, just now (the script's twin of the
  // shader's formula, taken at a few places round it, so that it comes up no faster than the fireflies do), times the
  // fireflies' own level, and dark where they are dark: round the hull, the lamp, the stag, an egret.
  // (Whoever would rather put the light on the paint itself, pixel by pixel, has the front in shared.cast.fireflies.front
  // and the pools of dark in .dark: then set .glow.gain to 0.)
  const glow = { gain: num('liglow', FLY.glow), climbGain: num('liclimb', FLY.climb.gain), stations: [], climb: [], lit: 0 };      // (gain, climbGain: read every frame)
  if (flies && !SKIP.has('glow')) {
    const colour = new THREE.Color(Q.get('liglowc') ? '#' + Q.get('liglowc') : FLY.glowColor);      // (a little deeper than the fireflies' own chip, which on white paint washes out to mint)
    const station = (x, y, z, radius, k = 1) => { const l = ctx.light({ position: [x, y, z], color: colour, radius, intensity: 0 }); l.on = false; glow.stations.push({ l, x, y, z, k, v: 0, to: 0 }); };
    // at each avenue tree's foot, a little toward the lane (the side of its trunk the rider sees)
    for (const t of plan.trees.trees) if (t.s > 29) { const p = plan.xz(t.s, t.d - Math.sign(t.d) * num('ligoff', 1.6)); station(p[0], num('ligy', 1.0), p[1], num('ligr', 7.5)); }
    // the plank walk, between its trestles; the wall's foot, either side of the gap
    for (let s = walkOf.from + 4.5; s < walkOf.to; s += 9) { const p = plan.xz(s, walkOf.d - 0.9); station(p[0], 0.7, p[1], 6); }
    for (const d of [-44, -36, -28, -20, -13, 13, 20, 28, 36, 44]) { const p = plan.xz(W.s - 1.3, d); station(p[0], 0.5, p[1], 6.5); }
    // the oldest tree: under the hem of its crown, and up its skirts (a front climbs it: a second later for every five metres)
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * 6.2832, x = treeAt.x + Math.cos(a) * 24, z = treeAt.z + Math.sin(a) * 24; if (Math.hypot(x - lampAt.x, z - lampAt.z) > 14) station(x, 0.6, z, 9); }
    // THE TREE'S FACE, as the look back has it. (The first try: nine standing lights round its western face at 7 and 16 m,
    // each as bright as the front was at its place. They came up as pale spots on the blossom, the upper ones where hardly
    // a firefly is: floodlights. Pictures: the log.) Now three wide soft lights, well off the blossom, that RIDE each front
    // up the face: each stands at the height where the front is, on its own side of the face, and is as bright as the front
    // is there, so the blossom round the climbing points takes a breath of their colour and lets it go as they pass.
    const wa = Math.atan2(west.z, west.x), C = FLY.climb;
    for (const az of [-0.8, 0, 0.8]) {
      const a = wa + az, ca = Math.cos(a), sa = Math.sin(a);
      // how far out the crown reaches on this side at each height (from its masses; its plain outline if the blossom is not built)
      const reach = C.heights.map((h) => {
        let r = 0;
        for (const b of oldLobes) { const ox = b.c.x - treeAt.x, oz = b.c.z - treeAt.z, l = Math.hypot(ox, oz); if (l < 1 || Math.abs(b.c.y - h) > b.rad + 2) continue; const along = (ox * ca + oz * sa) / l; if (along > 0.9) r = Math.max(r, l * along + 0.7 * b.rad); }
        return r || 29 - 0.022 * h * h;
      });
      const l = ctx.light({ position: [treeAt.x + ca * 36, 4, treeAt.z + sa * 36], color: colour, radius: num('liclimbr', C.radius), intensity: 0 }); l.on = false;
      glow.climb.push({ ca, sa, reach, l, v: 0, to: 0, y: 4 });
    }
    debug.glowStations = glow.stations.length; debug.climb = glow.climb.map((c) => c.reach.map((r) => +r.toFixed(1)));
  }
  const levelU = flies ? (flies.direct || flies.mirrored).material.uniforms.uLevel : { value: 0 };
  // (three places a station is asked at: itself, and a little way up and down the tide's own way, each a little early or
  // late as a firefly would be: together they come up over most of a second)
  const SAMPLES = [[0, 0, 0.5], [east.x * 1.8, east.z * 1.8, 0.2], [-east.x * 1.8, -east.z * 1.8, 0.8]];
  const waveS = flies ? front.uniforms[front.name + 'S'].value : [];      // (the front's own record of its waves: z is 1 while one is on its way)
  const waveOn = () => { for (let k = 0; k < waveS.length; k++) if (waveS[k].z > 0.5) return true; return false; };
  let glowTurn = 0;
  const glowNow = (dt) => {
    const b = ctx.boat, g = glow.gain * levelU.value, on = g > 0.002 && front.T >= 0 && waveOn(), turn = glowTurn ^= 1;
    let lit = 0;
    for (let i = 0; i < glow.stations.length; i++) {
      const st = glow.stations[i];
      // (asked every other frame, half of them a frame: the script's twin of the front is not free, and a light moves slowly)
      if (on && (i & 1) === turn) {
        let lv = front.level(st.x, st.y, st.z, 0.5);
        if (lv > 0 || st.v > 0.004) {
          for (let j = 1; j < SAMPLES.length; j++) lv += front.level(st.x + SAMPLES[j][0], st.y, st.z + SAMPLES[j][1], SAMPLES[j][2]);
          lv = Math.min(1.5, lv / SAMPLES.length);
          let dk = smooth(5, 8.5, Math.hypot(st.x - b.x, st.z - b.z));
          for (const q of dark) if (q.radius > 0) dk *= smooth(q.radius, q.radius * 1.35 + 2.6, Math.hypot(st.x - q.position.x, st.y - q.position.y, st.z - q.position.z));
          st.to = g * st.k * lv * dk;
        } else st.to = 0;
      } else if (!on) st.to = 0;
      // (no brightness of a place rises in under half a second: a light climbs no faster than that, and falls as the fireflies fall)
      // (the pace is kept when the gain is taken to nothing in the middle of a wave: the lights then go out, they do not stand)
      const pace = Math.max(glow.gain, 0.3);
      st.v += clamp(st.to - st.v, -dt * pace / 0.45, dt * pace / 0.5);
      if (st.v > 0.004) { st.l.intensity = st.v; st.l.on = true; lit++; } else { st.v = Math.max(0, st.v); st.l.intensity = 0; st.l.on = false; }
    }
    // the three that ride a front up the oldest tree's face
    const C = FLY.climb, HS = C.heights, G = Math.max(0, glow.gain * glow.climbGain), paceC = Math.max(G, 0.05), off = num('liclimboff', C.off);
    for (const c of glow.climb) {
      let sum = 0, sy = 0, top = 0;
      if (on) for (let i = 0; i < HS.length; i++) { const r = c.reach[i], lv = front.level(treeAt.x + c.ca * r, HS[i], treeAt.z + c.sa * r, 0.5); sum += lv; sy += lv * HS[i]; if (lv > top) top = lv; }
      if (sum > 0.01) {
        const y = sy / sum;
        c.y = c.v < 0.004 ? y : c.y + clamp(y - c.y, -9 * dt, 9 * dt);      // (it climbs with the front; a new front finds it dark and takes it from the foot again)
        const f = clamp((c.y - HS[0]) / (HS[HS.length - 1] - HS[0]), 0, 1) * (HS.length - 1), i0 = Math.min(HS.length - 2, Math.floor(f)), r = c.reach[i0] + (c.reach[i0 + 1] - c.reach[i0]) * (f - i0) + off;
        c.l.position.set(treeAt.x + c.ca * r, c.y, treeAt.z + c.sa * r);
      }
      c.to = sum > 0.01 ? G * levelU.value * Math.min(1.2, top) : 0;
      c.v += clamp(c.to - c.v, -dt * paceC / 0.6, dt * paceC / 0.5);
      if (c.v > 0.004) { c.l.intensity = c.v; c.l.on = true; lit++; } else { c.v = Math.max(0, c.v); c.l.intensity = 0; c.l.on = false; }
    }
    glow.lit = lit;
  };

  // ============================================================================================== their light on the white trunks
  // The page (postcard 8, and the tide's sixth beat): "every white trunk lit from below". The lights above are the
  // realm's own (ctx.light), of which the engine uses the eight that matter most from the rider's seat: two or three
  // trunks beside the boat. Down the colonnade a front arrived as points alone, among trunks that stayed blue. So every
  // trunk a firefly lives near is given a light of its own that needs no place among the eight: a slender form of six
  // sides standing INSIDE the trunk's lime wash (so that nothing of it can show beside the trunk, whatever the bole's
  // burrs and lean), drawn as light added to whatever paint stands within a hand or two in front of it (its depth is
  // taken 35 cm nearer the eye than it stands: the trunk's own face passes, a nearer tree or the boat does not). It is as
  // bright as the fireflies round that trunk's foot are just now (the front at its foot, three fireflies' worth of timing;
  // how many live there; the pools of dark; the fireflies' own level), brightest near the water and gone by the wash's
  // upper edge, and it stands back by as much as the realm's own eight lights already put on that trunk: near the rider
  // the paint is lit by those (brushwork and all), further off by this, and no trunk twice. In the mirror too: a lit
  // trunk stands in the open water full length. One draw; nothing is done a frame.
  //     shared.cast.fireflies.glow.trunkGain   its strength (0.55; 0: none; read every frame)      &litrunks=<x>: the same, to compare
  const trunks = { on: false, count: 0, mesh: null };
  glow.trunkGain = num('litrunks', FLY.trunks.gain);
  const trunkGainU = { value: 0 };
  if (flies && glow.trunkGain > 0 && !SKIP.has('trunks')) {
    try {
      const TR = FLY.trunks, W = shared.wood, fam = (flies.parts.low.direct || flies.parts.low.mirrored).material.uniforms, ES = ctx.engine.shared;
      // every tree a hull can come near and the two rows of standing growth behind them: where it stands, how its bole leans
      const list = [];
      // (only where the wood itself stands, shared.wood: without a trunk in front of it this light would hang in the air)
      if (W && W.trees && W.models) for (const e of W.trees) if ((e.kind === 'sail' || e.kind === 'far') && e.matrix && W.models[e.model]) list.push({ m: e.matrix, c: W.models[e.model].crotch || [0, 2.6, 0] });
      // how many fireflies live low round each foot
      const P = strewn.points, feet = list.map((q) => new THREE.Vector3(0, 0.6, 0).applyMatrix4(q.m)), near = new Float32Array(list.length), cell = 8, grid2 = new Map();
      feet.forEach((f, k) => { const key = Math.floor(f.x / cell) + ',' + Math.floor(f.z / cell); (grid2.get(key) || grid2.set(key, []).get(key)).push(k); });
      for (let i = 0; i < P.length; i += 3) {
        if (P[i + 1] > TR.under) continue;
        const cx = Math.floor(P[i] / cell), cz = Math.floor(P[i + 2] / cell);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const here2 = grid2.get((cx + a) + ',' + (cz + b)); if (here2) for (const k of here2) if (Math.hypot(P[i] - feet[k].x, P[i + 2] - feet[k].z) < TR.within) near[k]++; }
      }
      const wide = num('litrunkwide', 1);
      const HS = TR.heights, SIDES = TR.sides, pos = [], nor = [], foot = [], tree = [], idx = [], _p = new THREE.Vector3(), _n = new THREE.Vector3(), rndT = ctx.rng(7177);
      list.forEach((q, k) => {
        const dens = Math.min(1, Math.pow(near[k] / TR.full, 0.7)), seed = rndT();
        if (dens < 0.1) return;
        const base = pos.length / 3, f = feet[k], top = q.c[1] > 1 ? q.c[1] : 2.6;
        for (let j = 0; j < HS.length; j++) {
          const y = HS[j], u = y / top, r = wide * (TR.across[0] + (TR.across[1] - TR.across[0]) * j / (HS.length - 1)) / 2;
          for (let a = 0; a < SIDES; a++) {
            const an = a / SIDES * 6.2832, ca = Math.cos(an), sa = Math.sin(an);
            _p.set(q.c[0] * u + ca * r, y, q.c[2] * u + sa * r).applyMatrix4(q.m); _n.set(ca, 0, sa).transformDirection(q.m);
            pos.push(_p.x, _p.y, _p.z); nor.push(_n.x, _n.y, _n.z); foot.push(f.x, 0.6, f.z); tree.push(seed, dens);
          }
        }
        for (let j = 0; j < HS.length - 1; j++) for (let a = 0; a < SIDES; a++) {
          const a1 = (a + 1) % SIDES, p0 = base + j * SIDES + a, p1 = base + j * SIDES + a1, p2 = base + (j + 1) * SIDES + a, p3 = base + (j + 1) * SIDES + a1;
          idx.push(p0, p2, p1, p1, p2, p3);
        }
        trunks.count++;
      });
      if (trunks.count) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        geo.setAttribute('aFoot', new THREE.Float32BufferAttribute(foot, 3)); geo.setAttribute('aTree', new THREE.Float32BufferAttribute(tree, 2));
        geo.setIndex(idx);
        const mat = new THREE.ShaderMaterial({
          uniforms: { ...front.uniforms, uFogColor: ES.uFogColor, uFogDensity: ES.uFogDensity, uVeilColor: ES.uVeilColor, uVeil: ES.uVeil, uBoat: ES.uBoat,
            uLights: ES.uLights, uLightColors: ES.uLightColors, uLightCount: ES.uLightCount, uKeep: fam.uKeep, uHull: fam.uHull, uTail: fam.uTail, uLevel: fam.uLevel,
            uTrunkGain: trunkGainU, uTrunkBias: { value: num('litrunkbias', TR.bias) }, uTrunkGot: { value: num('litrunkgot', TR.got) }, uTrunkTop: { value: new THREE.Vector3(TR.top[0], TR.top[1], num('litrunkround', TR.round)) },
            uTrunkColor: { value: new THREE.Color(Q.get('litrunkc') ? '#' + Q.get('litrunkc') : TR.color) } },
          vertexShader: /* glsl */`
            attribute vec3 aFoot; attribute vec2 aTree;
            uniform vec3 uBoat, uTail, uHull; uniform vec4 uKeep[8]; uniform float uLevel, uTrunkGain, uTrunkBias;
            ${FOG_PARS}
            ${front.glsl}
            varying float vLit, vAir; varying vec3 vN, vW;
            float trunkSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0)); }
            void main() {
              // how lit the fireflies round this foot are just now: three of them, early, on time and late
              float lv = (${front.name}Level(aFoot, fract(aTree.x + 0.11)) + ${front.name}Level(aFoot, fract(aTree.x + 0.45)) + ${front.name}Level(aFoot, fract(aTree.x + 0.79))) / 3.0, b = 0.0;
              if (lv > 0.002 && uTrunkGain > 0.0) {
                float dark = uHull.z > 0.5 ? smoothstep(uHull.x, uHull.y, trunkSeg(aFoot.xz, uBoat.xz, uTail.xz)) : 1.0;
                for (int i = 0; i < 8; i++) { vec4 k = uKeep[i]; if (k.w > 0.0) dark *= smoothstep(k.w, k.w * 1.35 + 0.6, distance(aFoot, k.xyz)); }
                b = uTrunkGain * uLevel * aTree.y * min(lv, 1.5) * dark;
              }
              if (b < 0.003) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
              vec4 wp = modelMatrix * vec4(position, 1.0), mv = viewMatrix * wp;
              gl_Position = projectionMatrix * mv;
              // its depth is taken a little nearer the eye than it stands: it is light ON the paint in front of it
              float away = max(length(mv.xyz), 0.5);
              vec4 nearer = projectionMatrix * vec4(mv.xyz * (1.0 - min(uTrunkBias / away, 0.5)), 1.0);
              gl_Position.z = nearer.z / nearer.w * gl_Position.w;
              vN = normalize(mat3(modelMatrix) * normal); vW = wp.xyz;
              vLit = b; vAir = 1.0 - fogAmount(away);
            }`,
          fragmentShader: /* glsl */`
            uniform vec3 uTrunkColor, uTrunkTop; uniform vec4 uLights[8]; uniform vec3 uLightColors[8]; uniform int uLightCount; uniform float uTrunkGot;
            varying float vLit, vAir; varying vec3 vN, vW;
            void main() {
              vec3 N = normalize(vN);
              // what the realm's own lights already put on this side of this trunk (the paint's own rule): this stands back by as much
              float got = 0.0;
              for (int i = 0; i < 8; i++) {
                if (i >= uLightCount) break;
                vec3 d = uLights[i].xyz - vW; float dist = length(d), att = 1.0 - smoothstep(uLights[i].w * 0.25, uLights[i].w, dist);
                got += att * att * max(dot(N, d / max(dist, 1e-3)) * 0.6 + 0.4, 0.0) * dot(uLightColors[i], vec3(0.3, 0.6, 0.1));
              }
              // round as the trunk is round, brightest near the water (lit from below), gone by the wash's upper edge
              float face = pow(clamp(dot(N, normalize(cameraPosition - vW)), 0.0, 1.0), uTrunkTop.z);
              float up = smoothstep(0.0, 0.22, vW.y) * (1.0 - smoothstep(uTrunkTop.x, uTrunkTop.y, vW.y));
              gl_FragColor = vec4(uTrunkColor * clamp(max(0.0, vLit - uTrunkGot * got) * face * up * vAir, 0.0, 4.0), 1.0);
            }`,
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.name = 'fireflies (their light on the trunks)'; mesh.frustumCulled = false; mesh.renderOrder = 3;
        ctx.add(mesh);
        trunks.on = true; trunks.mesh = mesh;
      }
      debug.trunks = { trees: list.length, lit: trunks.count, triangles: idx.length / 3 };
    } catch (err) {
      console.warn('INVALID_LIGHTS orchard: the fireflies\' light on the trunks was left out: ' + (err && err.message));
      debug.notes.push('the trunks take no light of the fireflies: ' + (err && err.message));
    }
  }
  glow.trunks = trunks;

  // ============================================================================================== their light on the petals
  // The page (section 7): under a firefly front the petal skin takes their green-gold for as long as they are lit; the
  // lane, the stag's lane and every lead stay black across it. The lights above reach only the eight places that matter
  // most from the rider's seat (a trunk's foot each): the petals want it wherever a front passes. The skin is the set's own
  // sheet (shared.skin.mesh, a shader of set.js, which is built before any front exists), so the term is added HERE, to
  // that sheet's shader, at the one place where it sums its lamps, read from this module's front (the same uniforms the
  // fireflies read) and from the family's own pools of dark. Whoever keeps the sheet can have it or leave it:
  //     shared.skin.takesTide = false          (in set.js, at build) the sheet is left alone: its keeper lights it himself
  //                                            (a sheet whose own shader already reads `tideLevel` is left alone too)
  //     shared.cast.fireflies.petals.gain = 0  none (read every frame);   &lipetals=0 in the address: the same, to compare
  // If the sheet's shader has changed so that the place is not found, nothing is touched and the console says so once.
  // WHAT LIGHTS A PETAL: how many fireflies live low over it (a field made once from their places and blurred over a few
  // metres: none over the lane a hull keeps, most in the margins and round the feet of the rows), times the front at that
  // place (one soft edge pushed to and fro by a slow noise: the sum of many ragged pulses, never a bar), times the pools
  // of dark (the hull and its track, the lamp, the stag, the egrets), times the fireflies' own level. Open water takes
  // none of it: the sheet draws petals only, so a lane is a black line across lit petals by itself.
  const petalsLit = { gain: num('lipetals', FLY.petals.gain), on: false, why: '' }, tideOn = { value: 0 };
  if (flies && petalsLit.gain > 0 && !SKIP.has('petals')) {
    const sheet = shared.skin && shared.skin.takesTide !== false ? shared.skin.mesh : null, mat = sheet && sheet.material;
    const loop = /for \(int i = 0; i < 8; i\+\+\) \{[^\n]*lamps \+= lampOn\(uLights\[i\][^\n]*\}/;
    const fam = (flies.parts.low.direct || flies.parts.low.mirrored).material.uniforms;
    if (!mat || !mat.isShaderMaterial || typeof mat.fragmentShader !== 'string') petalsLit.why = shared.skin && shared.skin.takesTide === false ? 'the sheet lights itself (shared.skin.takesTide is false)' : 'no sheet of petals (shared.skin.mesh)';
    else if (mat.fragmentShader.includes('tidePetals') || mat.fragmentShader.includes(front.name + 'Level') || /\buTide|\btideN\b/.test(mat.fragmentShader)) petalsLit.why = 'the sheet already reads a front of that name';
    else if (mat.fragmentShader.lastIndexOf('void main()') < 0 || !loop.test(mat.fragmentShader) || !mat.fragmentShader.includes('vW') || !fam.uKeep || !fam.uTail || !fam.uHull) {
      petalsLit.why = 'the place in the petal sheet\'s shader was not found';
      console.warn('INVALID_LIGHTS orchard: the petal sheet\'s shader (set.js) no longer has the line that sums its lamps: the fireflies\' light on the petals is left out (cast_lights.js, "their light on the petals").');
    } else try {
      // ---- the field: fireflies to the square metre, low over the water (those under 3.2 m; the lower, the more), blurred
      const P = FLY.petals, lists = [strewn.points, strewn.tree];
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const L of lists) for (let i = 0; i < L.length; i += 3) if (L[i + 1] < P.under) { x0 = Math.min(x0, L[i]); x1 = Math.max(x1, L[i]); z0 = Math.min(z0, L[i + 2]); z1 = Math.max(z1, L[i + 2]); }
      x0 -= 9; x1 += 9; z0 -= 9; z1 += 9;
      const fw = Math.min(512, Math.max(8, Math.ceil((x1 - x0) / P.cell))), fh = Math.min(512, Math.max(8, Math.ceil((z1 - z0) / P.cell))), cx = (x1 - x0) / fw, cz = (z1 - z0) / fh;
      let acc = new Float32Array(fw * fh), tmp = new Float32Array(fw * fh);
      for (const L of lists) for (let i = 0; i < L.length; i += 3) if (L[i + 1] < P.under) {
        const ix = Math.min(fw - 1, Math.floor((L[i] - x0) / cx)), iz = Math.min(fh - 1, Math.floor((L[i + 2] - z0) / cz));
        acc[ix + iz * fw] += (1 - 0.55 * L[i + 1] / P.under) / (cx * cz);
      }
      const blur = (src, dst, step, span, cellSize) => {      // one pass of a bell, P.blur metres wide, along one axis
        const r = Math.max(1, Math.ceil(2.6 * P.blur / cellSize)), w = []; let sum = 0;
        for (let k = -r; k <= r; k++) { const v = Math.exp(-0.5 * (k * cellSize / P.blur) ** 2); w.push(v); sum += v; }
        for (let j = 0; j < fw * fh / span; j++) for (let i = 0; i < span; i++) {
          let s = 0; const base = step === 1 ? j * fw : j;
          for (let k = -r; k <= r; k++) { const q = i + k; if (q >= 0 && q < span) s += src[base + q * step] * w[k + r]; }
          dst[base + i * step] = s / sum;
        }
      };
      blur(acc, tmp, 1, fw, cx); blur(tmp, acc, fw, fh, cz);
      const data = new Uint8Array(fw * fh); let lit = 0;
      for (let i = 0; i < data.length; i++) { const v = Math.min(1, Math.pow(acc[i] / P.full, P.curve)); data[i] = Math.round(255 * v); if (v > 0.05) lit++; }
      acc = tmp = null;
      const field = new THREE.DataTexture(data, fw, fh, THREE.RedFormat, THREE.UnsignedByteType);
      field.unpackAlignment = 1; field.minFilter = field.magFilter = THREE.LinearFilter; field.wrapS = field.wrapT = THREE.ClampToEdgeWrapping; field.generateMipmaps = false; field.needsUpdate = true;
      ctx.onDispose(() => field.dispose());
      // ---- the term, in the sheet's own shader (its names all begin `tide` or `uTide`: the sheet has none such)
      const pars = /* glsl */`
      ${front.glsl}
      uniform sampler2D tTideField; uniform vec4 uTideRect, uTideKeep[8]; uniform vec3 uTideHull, uTideTail, uTideBoat, uTidePetal; uniform vec2 uTideWay; uniform float uTideOn;
      float tideN(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453), b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
        float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453), d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      // the fireflies' light on a petal lying at w: their colour, as lit as the fireflies that live over it are just now
      vec3 tidePetals(vec3 w) {
        if (uTideOn < 0.002) return vec3(0.0);
        vec2 uv = (w.xz - uTideRect.xy) / uTideRect.zw;
        if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec3(0.0);
        float field = texture2D(tTideField, uv).r;
        if (field < 0.004) return vec3(0.0);
        float n = (tideN(w.xz * 0.19) - 0.5) * 7.0 + (tideN(w.xz * 0.83 + 3.1) - 0.5) * 2.0;
        // (three fireflies' worth of timing, a quarter of a second early, on time and late: the light of the many that
        // hang over one petal comes up over most of a second, never with the 0.3 s of a single pulse: the law's half second)
        vec3 q = vec3(w.x + uTideWay.x * n, 0.3, w.z + uTideWay.y * n);
        float lv = (tideLevel(q, 0.15) + tideLevel(q, 0.5) + tideLevel(q, 0.85)) / 3.0;
        if (lv < 0.002) return vec3(0.0);
        vec2 pa = w.xz - uTideBoat.xz, ba = uTideTail.xz - uTideBoat.xz;
        float dark = uTideHull.z > 0.5 ? smoothstep(uTideHull.x, uTideHull.y, length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0))) : 1.0;
        for (int i = 0; i < 8; i++) { vec4 k = uTideKeep[i]; if (k.w > 0.0) dark *= smoothstep(k.w, k.w * 1.35 + 0.6, distance(vec3(w.x, 0.4, w.z), k.xyz)); }
        return uTidePetal * (uTideOn * field * min(lv, 1.5) * dark);
      }
      `;
      const fs = mat.fragmentShader, at = fs.lastIndexOf('void main()');
      // (the sheet takes its lamps at a share that changes with the hour, uLampOn: the boat's lantern on petals, the
      // set's own tuning. The fireflies' light is not a lamp's: it is given in the petals' own measure, so that share is taken out again)
      const share = /uniform float[^;]*\buLampOn\b/.test(fs) ? ' / max(uLampOn, 0.001)' : '';
      mat.fragmentShader = (fs.slice(0, at) + pars + fs.slice(at)).replace(loop, (m) => m + '\n        lamps += tidePetals(vW)' + share + ';');
      Object.assign(mat.uniforms, front.uniforms, {
        tTideField: { value: field }, uTideRect: { value: new THREE.Vector4(x0, z0, x1 - x0, z1 - z0) }, uTideKeep: { value: fam.uKeep.value }, uTideHull: { value: fam.uHull.value },
        uTideTail: { value: fam.uTail.value }, uTideBoat: ctx.engine.shared.uBoat, uTidePetal: { value: new THREE.Color(Q.get('lipetalc') ? '#' + Q.get('lipetalc') : P.color) },
        uTideWay: { value: new THREE.Vector2(east.x, east.z) }, uTideOn: tideOn,
      });
      mat.needsUpdate = true;
      petalsLit.on = true; petalsLit.field = field; petalsLit.material = mat;
      debug.petals = { field: [fw, fh], cell: [+cx.toFixed(2), +cz.toFixed(2)], litShare: +(lit / data.length).toFixed(3) };
    } catch (err) {
      petalsLit.why = 'it failed: ' + (err && err.message);
      console.warn('INVALID_LIGHTS orchard: the fireflies\' light on the petals was left out: ' + (err && err.message));
    }
    if (!petalsLit.on) debug.notes.push('the petals take no light of the fireflies: ' + petalsLit.why);
  }

  // ============================================================================================== the midge columns
  // Six columns of 250, 1.2 m wide, 2 to 4 m above the water, at the page's places (plan.midges): specks of air that
  // hold station, each darting in its own loop, the whole column rising and sinking 0.4 m at 0.7 Hz. LIT ONLY AGAINST THE
  // BAND: pale where they hang between the eye and the afterglow (looking west), all but nothing looking any other way;
  // never sparkle. They part round the hull (the family's) and round a passing bat (below), and close in 3 s. They fade
  // with the boat's place between s 120 and 170, as the band fails. lean() is left to the evening air.
  // A column that would stand in blossom or against wood is moved to the nearest clear air (the low boughs of the trees
  // at (39.5, -10) and (165.5, -10) reach through two of the page's places).
  let midges = null; const columns = [];
  if (!SKIP.has('midges')) {
    const masses = ((shared.blossom && shared.blossom.all) || []).filter((m) => m.kind !== 'mote' && m.c.y - m.rad < MIDGE.middle + MIDGE.height / 2 + 0.5);
    const clearAt = (x, z) => {
      for (const m of masses) { const r = (m.rmax || m.rad) + MIDGE.width / 2 + 0.4; if ((x - m.c.x) * (x - m.c.x) + (z - m.c.z) * (z - m.c.z) < r * r && m.c.y + m.rad > MIDGE.middle - MIDGE.height / 2 - 0.5) return false; }
      for (const t of plan.trees.trees) if (Math.hypot(x - t.x, z - t.z) < 1.9) return false;
      for (const [px, pz] of posts) if (Math.hypot(x - px, z - pz) < 1.4) return false;
      return true;
    };
    for (const [s, d] of plan.midges) {
      let at = null, moved = 0;
      search: for (let r = 0; r <= 5.01; r += 0.5) for (let k = 0; k < (r ? 12 : 1); k++) {
        const a = k / 12 * 6.2832, p = plan.xz(s + r * Math.cos(a), d + 0.7 * r * Math.sin(a));
        if (clearAt(p[0], p[1])) { at = p; moved = r; break search; }
      }
      if (!at) { at = plan.xz(s, d); debug.notes.push(`midges (${s}, ${d}): no clear air within 5 m, left where the page puts it`); }
      const pg = plan.locate(at[0], at[1], {});
      columns.push({ x: at[0], y: MIDGE.middle, z: at[1], s: pg.s, d: pg.d, page: [s, d], moved });
    }
    midges = makeMidges(ctx, {
      columns: columns.map((c) => ({ position: [c.x, c.y, c.z], count: MIDGE.count, width: MIDGE.width, height: MIDGE.height })),
      breathe: { rise: MIDGE.rise, period: MIDGE.period },
      // the band's light travels east and a little down: a midge is pale when the eye looks at it toward the west
      lit: { rule: 'sun', dir: [0, -0.06, 1], power: num('limpower', MIDGE.power), dull: num('limdull', MIDGE.dull) },
      color: MIDGE.pale, dark: MIDGE.dim, opacity: num('limopacity', MIDGE.opacity), size: num('limsize', MIDGE.size), minPixels: num('limminpx', MIDGE.minPixels), seed: 1760,
    });
    midges.object.name = 'midge columns';
    midges.columns = columns; midges.places = columns.map((c) => new THREE.Vector3(c.x, c.y, c.z));
    cast.midges = midges; api.midges = midges;
    debug.midges = columns.map((c) => ({ page: c.page, at: [+c.s.toFixed(1), +c.d.toFixed(1)], moved: c.moved }));
  }
  const midgeCols = midges ? columns.map((_, i) => midges.column(i)) : [], paleA = new THREE.Color(Q.get('limcol') ? '#' + Q.get('limcol') : MIDGE.pale), paleB = new THREE.Color(MIDGE.paleBlue), dimA = new THREE.Color(MIDGE.dim), dimB = new THREE.Color(MIDGE.dimBlue);
  const _b = new THREE.Vector3(); let batIn = 0; const partedAt = columns.map(() => -10);
  const midgesNow = (dt) => {
    // they fade as the band fails (by the boat's place: the dusk advances only with travel), and take the hour
    const k = 1 - smooth(MIDGE.fade[0], MIDGE.fade[1], here.s), hour = shared.hour || 0;
    for (const c of midgeCols) c.strength = k;
    midges.uniforms.uColor.value.copy(paleA).lerp(paleB, hour); midges.uniforms.uDark.value.copy(dimA).lerp(dimB, hour);
    midges.object.visible = k > 0.003;
    // a passing bat opens a hole a column closes in 3 s (the Birds group's bats, when they exist: any flock of species 'bat' in shared.cast)
    if (k > 0.01 && found.bats.length && (batIn -= dt) <= 0) {
      batIn = 0.12;
      for (const flock of found.bats) for (let i = 0; i < columns.length; i++) {
        const c = columns[i]; if (ctx.time - partedAt[i] < 0.3) continue;
        if (Math.hypot(c.x - ctx.boat.x, c.z - ctx.boat.z) > 70) continue;      // (a column that far off is a haze: nobody sees it part, and the flock's answer is not free)
        // (another group's handle, which may change under this module: whatever it throws, the midges carry on)
        try {
          const near = flock.nearest(c.x, c.z, 1), j = Array.isArray(near) ? near[0] : near;
          if (j == null || !(j >= 0)) continue;
          flock.position(j, _b);
          if (Math.hypot(_b.x - c.x, _b.z - c.z) < MIDGE.width / 2 + 0.9 && Math.abs(_b.y - c.y) < MIDGE.height / 2 + 0.8) { midges.part(_b.x, _b.y, _b.z, 0.7, 3); partedAt[i] = ctx.time; }
        } catch (err) { /* no bat to part them */ }
      }
    }
  };

  // ============================================================================================== the bees coming home
  // The last bees of the day: dark motes, heavy and slightly sinking, at 1.5 to 2.5 m/s, one arrival every 1.5 s, that
  // land on the boards and walk in; twelve more walking on the boards. No stripes, no loops, and they stop: none sets
  // out once the boat has passed s 170 (those in the air come in; those on the boards go in one by one).
  // THEIR LINE HOME. The family flies each bee down one straight line and knows no scenery, and the hives face the
  // channel: a line from behind them goes through the hive itself, and one from across the avenue crosses the lane at
  // the rider's head. So they come out of the blossom of the tree east of the stand (the one at (138.5, +10): the last
  // blossom they worked), fourteen metres off, pass north of the next trunk and come in along the front of the stand,
  // under the next crown: all of it on the right of the lane, where the page has the hives seen from. (The page's
  // "from the east" is kept; its 45 m of flight is not: see the log.)
  let bees = null; const hiveAt = V(H[0], H[1], 0.6);
  if (!SKIP.has('bees') && shared.made && shared.made.entrances && shared.made.entrances.length > 1) {
    const E = shared.made.entrances, B = shared.made.boards || E;
    const row = E[E.length - 1].clone().sub(E[0]).setY(0).normalize(), out = new THREE.Vector3(-row.z, 0, row.x);
    const mid = E.reduce((a, e) => a.add(e), new THREE.Vector3()).multiplyScalar(1 / E.length);
    if (out.dot(V(plan.locate(mid.x, mid.z, {}).s, 0).sub(mid).setY(0)) < 0) out.negate();      // the hives look to the channel
    hiveAt.copy(mid);
    const hives = E.map((e, i) => ({ entrance: [e.x, (B[i] || e).y - 0.014, e.z], face: [out.x, out.z], board: BEE.board }));
    // the tree they come out of: the nearest avenue tree east of the stand in its own row (the page's (138.5, +10))
    const pm = plan.locate(mid.x, mid.z, {});
    const tree = plan.trees.trees.filter((t) => t.row === Math.sign(pm.d) * 10 && t.s < pm.s - 9 && t.s > pm.s - 20).sort((a, b) => b.s - a.s)[0];
    const from = tree ? V(tree.s + 0.4, tree.d + 0.8, 4.5) : V(pm.s - 13.5, pm.d - 2.7, 4.5), far = Math.hypot(from.x - mid.x, from.z - mid.z);
    // (the hour on them: the family builds their paint itself and takes no extension, so the kit it is handed is the
    // area's kit with one call wrapped: the area's light is laid on after the family's own. Asked of the toolkit.)
    // One name collides: the family's own `uKeep` (a float: how far a bee keeps from the lens) and the dusk's `uKeep` (a
    // vec3: what the mirror gives back to pale paint). The dusk is handed over with that one name changed; its values
    // are the same live ones.)
    const kitOfTheHour = Object.create(kit), ctxOfTheHour = Object.create(ctx); ctxOfTheHour.kit = kitOfTheHour;
    if (shared.dusk && Q.get('libeedusk') !== '0') {
      const D = shared.dusk, re = /\buKeep\b/g, uniforms = { ...D.uniforms, uDuskKeep: D.uniforms.uKeep }; delete uniforms.uKeep;
      const duskOfTheBees = { ...D, uniforms }; for (const k of Object.keys(D)) if (typeof D[k] === 'string') duskOfTheBees[k] = D[k].replace(re, 'uDuskKeep');
      kitOfTheHour.gouache = (o = {}) => kit.gouache({ ...o, extend: [...[].concat(o.extend || []), duskOfTheBees] });
    }
    // (crisp: a bee is smaller than the painter's brush, which would wipe it out: it is left as drawn)
    bees = makeBees(ctxOfTheHour, { hives, homing: BEE.homing, walkers: BEE.walkers, every: num('libeeevery', BEE.every), speed: BEE.speed, from: [from.x, from.y, from.z], far, seed: 1520,
      size: num('libeesize', BEE.size), minPixels: num('libeepx', BEE.minPixels), maxGrow: num('libeegrow', BEE.maxGrow), material: Q.get('libeecrisp') === '0' ? {} : { crisp: true },
      ...(Q.get('libeecol') ? { color: '#' + Q.get('libeecol') } : {}) });      // (&libeecol=ff2020, developer: the bees in a colour that can be found)
    bees.object.name = 'bees coming home';
    bees.from = from; bees.far = far; bees.hives = hives;
    // SEEN FROM THE LANE. The family's bee keeps its length on the screen but not its girth: from the lane's 13 m it is a
    // sliver of seven pixels by two, which cannot be found (pictures: the log). The page has "dark motes": so every bee
    // on its line home is also drawn, from 8 m off and more, as one round dark mote where the family has it (its place
    // is read from the family's own agents, so the flight is the family's: heavy, sinking, slowing). Nearer than 5.5 m
    // there is no mote: the modelled bee is large enough by itself. Not in the mirror. (&libeemotes=0: without, to compare.)
    if (Q.get('libeemotes') !== '0') {
      const fliers = bees.agents.filter((a) => a.kind === 0), M = BEE.mote, ES = ctx.engine.shared, v2 = new THREE.Vector2();
      const at = new Float32Array(Math.max(1, fliers.length) * 3), g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(at, 3)); g.setDrawRange(0, 0);
      const mat = new THREE.ShaderMaterial({
        uniforms: { uFogColor: ES.uFogColor, uFogDensity: ES.uFogDensity, uVeilColor: ES.uVeilColor, uVeil: ES.uVeil, uPx: { value: 800 },
          uMote: { value: new THREE.Vector4(M.from[0], M.from[1], M.to[0], M.to[1]) }, uMotePx: { value: num('libeemotepx', M.px) }, uMoteColor: { value: new THREE.Color(M.color) } },
        vertexShader: /* glsl */`
          uniform vec4 uMote; uniform float uMotePx, uPx;
          ${FOG_PARS}
          varying float vFog;
          void main() {
            vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.0);
            float dist = length(mv.xyz), k = smoothstep(uMote.x, uMote.y, dist) * (1.0 - smoothstep(uMote.z, uMote.w, dist));
            if (k < 0.05) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 1.0; return; }
            gl_Position = projectionMatrix * mv;
            gl_PointSize = max(1.5, uMotePx * k * uPx / 800.0);
            vFog = fogAmount(dist);
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uMoteColor;
          ${FOG_PARS}
          varying float vFog;
          void main() {
            vec2 q = gl_PointCoord - 0.5;
            if (dot(q, q) > 0.23) discard;
            gl_FragColor = vec4(mix(uMoteColor, uFogColor, vFog), -15.0);      // (the alpha is the mark that tells the painter's filter to leave so small a thing as it is drawn)
          }`,
      });
      const pts = new THREE.Points(g, mat);
      pts.name = 'bees coming home (as motes, from the lane)'; pts.frustumCulled = false;
      pts.onBeforeRender = (renderer, scene, camera) => { const rt = renderer.getRenderTarget(), h = rt ? rt.height : renderer.getDrawingBufferSize(v2).y; mat.uniforms.uPx.value = h * 0.5 * camera.projectionMatrix.elements[5]; mat.uniformsNeedUpdate = true; };
      ctx.only(pts, 'direct'); ctx.add(pts);
      const cA = new THREE.Color(M.color), cB = new THREE.Color(M.colorBlue);
      bees.motes = { object: pts, now() {
        let n = 0;
        for (const a of fliers) if (a.state === 0 && a.pos.y > -10) { at[n * 3] = a.pos.x; at[n * 3 + 1] = a.pos.y; at[n * 3 + 2] = a.pos.z; n++; }
        g.setDrawRange(0, n); g.attributes.position.needsUpdate = true;
        mat.uniforms.uMoteColor.value.copy(cA).lerp(cB, shared.hour || 0);
        return n;
      } };
    }
    cast.bees = bees; api.bees = bees;
    debug.bees = { from: (() => { const p = plan.locate(from.x, from.z, {}); return [+p.s.toFixed(1), +p.d.toFixed(1)]; })(), far: +far.toFixed(1), face: [+out.x.toFixed(2), +out.z.toFixed(2)], entrances: E.map((e) => { const p = plan.locate(e.x, e.z, {}); return [+p.s.toFixed(2), +p.d.toFixed(2), +e.y.toFixed(3)]; }), tree: tree ? [+tree.s.toFixed(1), +tree.d.toFixed(1)] : null };
  }
  /** The hives: where they stand, and how near the boat is to them (1 within 9 m, 0 beyond 15 m): what the `night` layer follows (0.15 louder). */
  api.hives = { position: hiveAt, near: 0 };
  api.glow = glow; api.columns = columns;
  /** The fireflies' light on the petals under a front: { gain (0.5; 0: none; read every frame), on (false: the sheet was not there, or lights itself), why }. */
  api.petals = petalsLit;
  let beesDone = false;
  const beesNow = (first) => {
    if (beesDone || here.s < BEE.stop || api.beesStay) return;
    beesDone = true; bees.stop();
    // (a boat set down beyond s 170 finds the night already come: nobody in the air, nobody on the boards)
    if (first) for (const a of bees.agents) { if (a.kind === 0) { a.state = -1; a.t = -1e9; a.pos.y = -50; } else if (a.kind === 1) a.hidden = 1e9; }
  };

  // ---------------------------------------------------------------------------------------------- developer's switches
  const forceOn = Q.get('lion') === '1', wavesAt = Q.has('liwaves') ? num('liwaves', 0) : null, tideAt = Q.has('litide') ? num('litide', 0) : null;
  const lifov = num('lifov', 0);                                   // (developer) a long lens, for study only
  const showAll = Q.get('liall') === '1';
  let debugAt = Q.has('lidebug') ? num('lidebug', 1) : -1;
  const sendDebug = () => {
    const pg = (v) => { const q = plan.locate(v.x, v.z, {}); return [+q.s.toFixed(1), +q.d.toFixed(1), +v.y.toFixed(2)]; };
    debug.time = +ctx.time.toFixed(2); debug.boat = [+here.s.toFixed(1), +here.d.toFixed(1)];
    debug.dark = dark.map((q) => ({ who: q.who, radius: q.radius, at: q.radius > 0 ? pg(q.position) : null }));
    debug.found = { waders: found.waders.length, bats: found.bats.length };
    debug.glowLit = glow.lit;
    if (bees) debug.beesNow = bees.agents.filter((a) => a.kind === 0 && a.state >= 0).map((a) => ({ state: a.state, at: pg(a.pos) }));
    fetch('/__shot/orchard_li_debug.json', { method: 'POST', body: JSON.stringify(debug, null, 1) }).catch(() => {});
  };

  // ============================================================================================== every frame
  const life = { first: true, lit: false, t0: null, wasStaged: false, seekIn: 0, mock: {} };
  return {
    update(dt) {
      const s = here.s, first = life.first; life.first = false;
      if (lifov) { const c = ctx.engine.camera; if (c.fov !== lifov) { c.fov = lifov; c.updateProjectionMatrix(); } }
      if (debugAt >= 0 && ctx.time >= debugAt) { debugAt = -1; sendDebug(); }
      // ---- who must be left in the dark, and whose bats part the midges (found when they exist; looked for again now and then)
      if ((life.seekIn -= dt) <= 0) { life.seekIn = found.waders.length >= 6 && found.bats.length ? 4 : 1; seek(); }
      keepDarkNow();
      if (midges) midgesNow(dt);
      if (bees) { beesNow(first); if (bees.motes) bees.motes.now(); }
      api.hives.near = 1 - smooth(9, 15, Math.hypot(ctx.boat.x - hiveAt.x, ctx.boat.z - hiveAt.z));
      if (!flies) return;
      // ---- the staging has taken the fireflies over: this module's own waves stop, at once (take them over in build(),
      // before anything is lit)
      if (api.staged && !life.wasStaged) { life.wasStaged = true; if (steady) steady.stop(); if (life.t0 !== null) front.clear(); }
      if (showAll) {
        // (developer) every firefly lit, again and again: where they were strewn, and what hides them
        if (life.allNext === undefined) { life.allNext = 0; if (steady) steady.stop(); front.clear(); flies.level(1, 0.5); }
        flies.tick(ctx.time);
        if (ctx.time >= life.allNext) { life.allNext = ctx.time + 0.55; flies.call({ at: ctx.time, near: treeAt, radius: 1e4, share: 1, over: 0 }); }
      } else if (tideAt !== null) mockTide(ctx.time - tideAt);
      else if (!api.staged) {
        // none before the boat has passed s 140; then all of them may light, and sixty scouts do
        if (!life.lit && (s >= FLY.lit || forceOn)) { life.lit = true; flies.level(1, first ? 0.5 : 4); flies.scouts(1, first ? 0.5 : 3); }
        // from s 160 the steady waves (a boat set down beyond it finds them long under way)
        if (life.t0 === null) { if (wavesAt !== null) life.t0 = wavesAt; else if (s >= FLY.waves) life.t0 = first ? ctx.time - 1000 : ctx.time; }
        if (life.t0 !== null && ctx.time >= life.t0) flies.tick(ctx.time - life.t0);
      }
      if (debugAt >= 0) { const t0 = performance.now(); glowNow(dt); debug.glowMs = (debug.glowMs || 0) * 0.95 + (performance.now() - t0) * 0.05; } else glowNow(dt);
      api.shimmer = flies.litNear(ctx.boat.x, 1, ctx.boat.z);
      tideOn.value = petalsLit.on ? levelU.value * Math.max(0, petalsLit.gain) : 0;      // (the petals under a front: as lit as the fireflies may be)
      trunkGainU.value = trunks.on ? Math.max(0, glow.trunkGain) : 0;                           // (the trunks: read every frame)
    },
  };

  // &litide=<s> (developer): the page's tide on a clock of its own, to see that the handles give the staging what it
  // needs. Not a cue: nothing of this runs in the ride.
  function mockTide(T) {
    const m = life.mock, once = (key, at) => { if (!m[key] && T >= at) { m[key] = true; return true; } return false; };
    if (!m.begun) { m.begun = true; if (steady) steady.stop(); front.clear(); flies.level(1, 0.5); flies.scouts(1, 0.5); m.steady = api.steady({ from: 37 }); }
    if (T < 0) return;
    flies.tick(T);
    if (once('hush', 0)) flies.scouts(0, 1.5);
    if (once('one', 3 - 0.02)) api.one(3);
    if (once('three', 4.6 - 0.02)) api.three(4.6);
    if (once('forty', 5.8 - 0.02)) api.forty(5.8);
    if (once('w1', 7 - 1.5)) api.fromWall({ at: 7 });
    if (once('w2', 14 - 1.5)) api.fromWall({ at: 14 });
    if (once('w3', 21)) api.meet({ at: 21, when: 23.5 });
    if (once('w4', 28.5 - 1.5)) api.fromWall({ at: 28.5, strength: 0.8 });
  }
}
