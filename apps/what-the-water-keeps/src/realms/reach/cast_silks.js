// The dyers' reach: the cast, group "Silks" (stage 3). Everything of cloth that the wind or the river moves, made on
// the toolkit's ribbons (docs/life/ribbons.md). Plan: docs/build/reach/3-cast-plan.md. Log: docs/build/reach/3-cast-silks.md.
//
//   flying silks   26, 0.8 m by 22 to 36 m, tied where kit.js put the ties (shared.silkTies: the frames' tethers end there),
//                  one makeRibbons of kind 'silk'. Each streams a little ACROSS the wind, on its own bearing: the nave's
//                  outward of the mast line (a silk straight down the wind runs through the next mast, the next rank and
//                  the west front's wings), the rest within nine degrees of it. Dyed by where they fly, warm first.
//   lighter cloths 34, not there until the unpegging: they lie on lines where bolts hang and lift off them (lift()).
//   strays         4, kind 'stray': [0] the nave's vault (a long loop above the yards and the swags), [1] the lagoon's
//                  (caught half way up the bank mast at s 120 until it is sent: crossing()), [2] round the wheel's upper
//                  half, [3] far over the tenter grounds. A tail in the water writes rings and a line of its dye.
//   under water    6 streaming bolts made fast to the rinsing posts, fanned under the composed line; 4 lost on the bed.
//   high tails     5, kind 'tail', 64 to 118 m up over the tenter grounds. The first thing to cut: &silks=notails.
//
// The stand-ins 'flying silks' and 'underwater cloth' (kit.js) are taken out here.
//
// FOR THE STAGER: shared.cast.silks = {
//   flying, lighter, strays, under, tails     the toolkit's handles (release, gone, reset, set, head, tail, travelling)
//   own: true          while true this module sends the lagoon stray itself, the first time the boat passes s 116
//                      (set it false to send it from a cue)
//   letGo({ seconds = 3, speed = [8, 13], near = 3, drag = false })
//                      the 26 slip their mast heads, east to west over `seconds`, each on a way of its own that goes
//                      round the west front, low over the lagoon, over the wheel and out along the sun road; `near` of
//                      them pass within 5 m of the boat; with drag: true one crimson one trails its tail 20 m across the lagoon
//   lift({ seconds = 5, speed = [8, 13] })     the 34 lighter cloths lift off their lines
//   settle()           every mast head bare, nothing in the air (a cue's settle); bare is then true
//   reset()            tied again (for looking)
//   crossing({ speed = 4.6 })   the lagoon stray slips the mast, trails its tail for 8 m near d 6 (s 155 to 164), crosses the
//                      line at s 168, climbs in front of the wheel, goes over the weir and away down the sun road
//   last({ ahead = 13, d = 8.5, at, rest })   the last silk, pale violet, 14 m: comes down across the bow from the indigo side and lays
//                      itself on the water across the current, `ahead` metres in front of where the boat will be when its head
//                      touches (never beyond s 190), its middle `d` right of the line, and stays: a violet source in the film.
//                      `at`: the s of its line outright; `rest: true`: lying there from the first frame (a cue's settle)
//   bare, crossed, lastAt     state to read
// }
// Switches for looking: &silks=go (the unpegging's release at once: add &t=), &silks=bare, &silks=cross, &silks=last,
// &silks=notails, &silks=nostrays.
import * as THREE from 'three';
import { makeRibbons } from '../../engine/life/ribbons.js';
import { removeStandIn } from '../../engine/modules.js';

const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const RAD = Math.PI / 180;

export async function build(ctx, plan, shared) {
  const cast = shared.cast = shared.cast || {};
  const { kit } = ctx, wind = shared.wind, sun = shared.sun, D = plan.dyes, HUB = plan.wheel.hub;
  const { SAFFRON, MADDER, CRIMSON, VIOLET, INDIGO } = plan.dye;
  const want = (QS.get('silks') || '').split(',');
  const P = (s, d, y = 0) => { const p = kit.at(s, d, y); return [p.x, p.y, p.z]; };
  const lineX = (z) => kit.at(Math.max(0, Math.min(204, -z)), 0, 0).x;            // the composed line's x where the route is at z (the route runs down -z as far as the door)
  const _c = new THREE.Color(), rc = ctx.rng(2611);
  // a dye of the scale, never quite evenly taken
  const dye = (i, k = 1) => '#' + _c.set(D[i].color).multiplyScalar(k * (0.86 + 0.2 * rc())).getHexString();
  const S = { bare: false, crossed: false, last: null };

  // ================================================================================================ the 26 flying silks
  const heads = shared.mastHeads || [], ties = shared.silkTies || [];
  // (critique, the client's rule about value: over the nave's saffron ranks the silks were saffron, gold on gold. Each
  // now flies in the dye a step or two DOWN the scale from the cloth under it: madder and crimson over saffron, crimson
  // over madder: dark bands against the gold cloth and against the sky, warm first as before.)
  const dyesAt = (s, side) => {
    if (s < 45) return [MADDER, CRIMSON];
    if (s < 55) return side > 0 ? [MADDER, CRIMSON] : [MADDER, MADDER];
    if (s < 65) return side > 0 ? [CRIMSON, CRIMSON] : [MADDER, CRIMSON];
    if (s < 75) return side > 0 ? [CRIMSON, CRIMSON] : [CRIMSON, CRIMSON];
    if (s < 90) return side > 0 ? [CRIMSON, CRIMSON] : [CRIMSON, VIOLET];
    if (s < 100) return side > 0 ? [CRIMSON, CRIMSON] : [CRIMSON, VIOLET];                                       // the west front
    if (s < 200) return side > 0 ? (s < 150 ? [MADDER, CRIMSON] : [CRIMSON, CRIMSON]) : (s < 120 ? [VIOLET, VIOLET] : [VIOLET, INDIGO]);      // the lagoon's banks: madder side, indigo side
    if (s < 250) return [VIOLET, VIOLET];                                                                        // the door
    return [SAFFRON, SAFFRON];                                                                                   // the tenter grounds, far: gold lines on the sky
  };
  const rs = ctx.rng(2626), flyItems = [], flyMeta = [];
  ties.forEach((t, i) => {
    const h = heads[i] || [t.at[0], t.at[1], t.at[2], 300, Math.sign(t.at[0]) || 1], s = h[3], side = h[4] || 1;
    // its bearing off the wind (degrees, + = toward +x, the right bank) and how much it is carried up
    let out, up;
    if (s < 78) { out = side * (20 + 7 * rs()); up = 0.09 + 0.05 * rs(); }          // the nave: clear of the mast line and the ranks, above the wall plates
    else if (s < 90) { out = side * (34 + 4 * rs()); up = 0.2; }                    // its last frame: outside the west front's wings
    else if (s < 100) { out = side * (7 + 6 * rs()); up = 0.02; }                   // the west front: out over the lagoon
    else { out = (rs() * 2 - 1) * 9; up = 0; }
    const a = out * RAD, [c, tip] = dyesAt(s, side);
    flyItems.push({ at: [t.at[0], t.at[1], t.at[2]], length: t.length || 22 + 14 * rs(), width: 0.8, color: dye(c), tip: dye(tip, 0.92), direction: [Math.sin(a), up, -Math.cos(a)] });
    flyMeta.push({ s, side, dye: c });
  });
  const flying = makeRibbons(ctx, { kind: 'silk', items: flyItems, wind, paths: flyItems.length, clear: 3, exact: true, seed: 2626 });
  flying.object.name = 'cast:flying silks';
  if (sun) sun.drape(flying);
  if (want.includes('nofly')) flying.object.visible = false;
  removeStandIn(ctx, 'flying silks');
  shared.silks = flying;

  // ================================================================================================ the 34 lighter cloths
  // Not there until the unpegging. Each lies where a bolt hangs high on a line, so that in the held gust (every bolt
  // streaming from its line) it is one more cloth on that line until it slides off it.
  const lightItems = [];
  // (critique: they were taken evenly from every high bolt of the reach, so two in three lifted in the nave, 60 to 120 m
  // behind a rider who is in the lagoon by then, and eight to ten silks were in view at once. Now they lift where the
  // unpegging is watched: from the lines of the lagoon's banks and the west front, ahead of the boat and beside it; only
  // what is still wanting comes from the nave's last ranks.)
  { const high = ((shared.cloth && shared.cloth.bolts) || []).filter((b) => b.position && b.position[1] > 6.5 && b.position[2] < -24 && b.position[2] > -200);
    const ahead = high.filter((b) => b.position[2] < -90), nave = high.filter((b) => b.position[2] >= -90 && b.position[1] > 9).sort((p, q) => p.position[2] - q.position[2]);
    const bolts = ahead.length >= 34 ? ahead : ahead.concat(nave.slice(0, 34 - ahead.length));
    if (want.includes('log')) console.info('INVALID_ (log) lighter cloths: ' + ahead.length + ' high bolts past the west front, ' + nave.length + ' in the nave; taken ' + Math.min(34, bolts.length));
    const rl = ctx.rng(3434), N = Math.min(34, bolts.length), step = bolts.length / Math.max(1, N);
    for (let i = 0; i < N; i++) {
      const b = bolts[Math.min(bolts.length - 1, Math.floor((i + 0.8 * rl()) * step))];
      lightItems.push({ at: [b.position[0] + (rl() - 0.5) * 1.2, b.position[1] - 0.12, b.position[2] - 0.2], length: Math.max(7, Math.min(15, (b.length || 10) * (0.8 + 0.3 * rl()))), width: 1.0 + 0.4 * rl(),
        color: b.color || dye(MADDER), direction: [(rl() - 0.5) * 0.3, 0.04, -1] });
    } }
  const lighter = lightItems.length && !want.includes('nolight') ? makeRibbons(ctx, { kind: 'silk', items: lightItems, wind, paths: lightItems.length, clear: 3, exact: true, seed: 3434 }) : null;
  if (lighter) { lighter.object.name = 'cast:lighter cloths'; if (sun) sun.drape(lighter); lighter.gone('all'); lighter.object.visible = false; }      // (not drawn at all until they lift: 3 draw calls and 52,000 triangles a frame)

  // ================================================================================================ the four strays
  const pathLength = (pts, loop) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); if (loop) { const a = pts[pts.length - 1], b = pts[0]; L += Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); } return L; };
  // [0] the vault: down the nave above its yards (17 to 18.5 m) and the swags' crossings, over the west front's line,
  // round over the head of the lagoon, back high above the right-hand yards (above every mast and flying silk), round over the narthex
  const vault = [[24, -3, 21.6], [37, -2.6, 20.8], [48, -1, 21.8], [59, 1.5, 20.8], [70, 2.6, 21.4], [81, 2.6, 21.9], [92, 2, 23.4], [102, 5, 24.2], [110, 12, 25.2], [112, 20, 26.2], [105, 27, 27],
    [92, 29, 27.5], [70, 28, 27], [48, 27, 26.5], [30, 26, 26], [18, 20, 25], [12, 10, 23.8], [14, 1, 22.6]].map((q) => P(q[0], q[1], q[2]));
  // [2] round the wheel's upper half (world): 9 m in front of it, round its south rim over the weir, 15 m behind it, back over the door's line
  const round = [[18, 24.5, -198.5], [8, 22.5, -196.5], [-4, 21, -196], [-14, 20, -197], [-22, 19.2, -200], [-27.5, 19, -206], [-27.5, 19.6, -213], [-22, 21, -219], [-8, 23.2, -221.5], [4, 25.2, -221.5],
    [14, 26.8, -219.5], [21, 27.6, -214], [24, 27.6, -207], [22.5, 26.6, -201.5]];
  // [3] far over the tenter grounds
  const far = []; for (let a = 0; a < 14; a++) { const th = a / 14 * Math.PI * 2; far.push([6 + Math.cos(th) * 36 + Math.sin(th * 2) * 6, 31 + 7 * Math.sin(th + 0.7), -300 + Math.sin(th) * 48]); }
  // [1] the lagoon's: caught half way up the bank mast at s 120 on the right bank, lying on the wind toward the water
  const mastAt = P(120, 31.5, 11.2), b1 = 28 * RAD;
  const vaultLen = pathLength(vault, true);
  const strayItems = [
    // (critique, value: the vault's was saffron over saffron swags, the lagoon's madder and crimson over red water. The vault's is now crimson
    // (dark on the gold cloth and on the sky), the lagoon's saffron, as the page has it: light on the red water)
    { path: vault, loop: true, travel: 3.8, length: 14, width: 0.9, color: dye(CRIMSON), tip: dye(CRIMSON, 0.85), start: Math.max(0, vaultLen - 14 - 61) },      // it comes into the nave behind the rider and overtakes slowly overhead
    { at: [mastAt[0] - 0.1, mastAt[1], mastAt[2] - 0.28], length: 14, width: 0.9, color: dye(SAFFRON, 1.12), tip: dye(SAFFRON), direction: [-Math.sin(b1), 0.02, -Math.cos(b1)] },
    { path: round, loop: true, travel: 4.2, length: 12, width: 0.9, color: dye(CRIMSON), tip: dye(CRIMSON, 0.9), start: 30 },
    { path: far, loop: true, travel: 5.5, length: 16, width: 0.9, color: dye(SAFFRON), tip: dye(SAFFRON), start: 80 },
  ];
  // a tail in the water: the toolkit has just rung it; here its dye goes into the film as a line (channel b is the
  // right bank's pigment of the moment; both channels show violet). Before s 58 there is no indigo yet.
  const touched = new Map();
  const mark = (x, z, both) => {
    const tr = ctx.water && ctx.water.trace; if (!tr) return;
    const key = both ? 'v' : 'w', last = touched.get(key), o = { channel: 'b', radius: 0.32, strength: 0.5 };
    if (last && Math.hypot(last[0] - x, last[1] - z) < 3.5 && ctx.time - last[2] < 1) { tr.line(last[0], last[1], x, z, o); if (both && ctx.s > 58) tr.line(last[0], last[1], x, z, { ...o, channel: 'a' }); }
    else { tr.inject(x, z, o); if (both && ctx.s > 58) tr.inject(x, z, { ...o, channel: 'a' }); }
    touched.set(key, [x, z, ctx.time]);
  };
  const strays = want.includes('nostrays') ? null : makeRibbons(ctx, { kind: 'stray', items: strayItems, wind, paths: 4, clear: 3, exact: true, seed: 4141, onTouch: (x, z) => mark(x, z, false) });
  if (strays) { strays.object.name = 'cast:strays'; if (sun) sun.drape(strays); }

  // ================================================================================================ cloth under the water
  // Six bolts 2.2 by 25 m made fast to the rinsing posts (the frames' lines end at shared.frames.rinsing[k].ties), a hand's
  // depth down, fanned toward the composed line so that the keel rides over them; four lost bolts on the bed.
  const wet = (i, k) => '#' + _c.set(D[i].color).multiplyScalar(k).getHexString();
  const underItems = [], rin = (shared.frames && shared.frames.rinsing) || [];
  plan.rinsing.forEach((R, k) => {
    const c = kit.at(R.at[0], R.at[1]), toLine = -Math.sign(R.at[1] || 1);
    for (let i = 0; i < 3; i++) {
      const t = rin[k] && rin[k].ties && rin[k].ties[i], at = t ? [t.x, Math.max(-0.45, Math.min(-0.25, t.y)), t.z] : [c.x + [0, 0.9, -0.8][i], -0.25 - i * 0.1, c.z + [0, 0.5, 0.6][i] - 0.3];
      const fan = toLine * [0.03, 0.11, 0.19][(i + k) % 3];
      underItems.push({ at, length: 25, width: 2.2, color: wet(R.dyes[i], 0.62), tip: wet(R.dyes[i], 0.5), direction: [fan, -0.006, -1], phase: (i * 0.37 + k * 0.21) % 1 });
    }
  });
  for (const [s, d] of plan.lostBolts) {
    const q = kit.at(s, d, -0.8 - 0.3 * rc()), sunk = s < 70 ? SAFFRON : s < 100 ? CRIMSON : s < 150 ? MADDER : VIOLET;
    underItems.push({ at: [q.x, q.y, q.z], length: 9, width: 2.2, color: wet(sunk, 0.5), tip: wet(sunk, 0.42), direction: [0.2 * Math.sign(d), 0, -1], amp: 0.4, speed: 0.6 });
  }
  const under = makeRibbons(ctx, { kind: 'cloth', items: underItems, wind, exact: true, seed: 7711 });
  under.object.name = 'cast:underwater cloth';
  removeStandIn(ctx, 'underwater cloth');

  // ================================================================================================ the five high tails
  // No kite has a shape: only the tails, thin and gold, 50 to 70 m long. Each head weaves a figure of eight of 30 to 50 s
  // and the tail streams down the wind from it.
  let tails = null;
  if (want.includes('tails')) {
    const rt = ctx.rng(5151), items = [];
    for (const [x, y, z] of [[-34, 64, -262], [24, 78, -292], [-8, 96, -322], [42, 108, -304], [-50, 118, -344]]) {
      const R = 14 + 6 * rt(), pts = [], period = 30 + 20 * rt();
      for (let a = 0; a < 16; a++) { const th = a / 16 * Math.PI * 2; pts.push([x + Math.sin(th) * R * 1.6, y + Math.sin(th * 2) * R * 0.45, z + Math.sin(th * 2) * R * 0.5 + Math.cos(th) * 4]); }
      items.push({ path: pts, loop: true, travel: pathLength(pts, true) / period, length: 50 + 20 * rt(), width: 0.9, color: '#ffc65a', start: 200 * rt() });
    }
    tails = makeRibbons(ctx, { kind: 'tail', items, wind, exact: true, seed: 5151 });
    tails.object.name = 'cast:high tails';
  }

  // ================================================================================================ the unpegging's ways
  const V3 = () => new THREE.Vector3();
  // A way of its own for a silk let go from where its free end is (e): round the outside of the west front if it leaves
  // the nave, low over the lagoon (6 to 21 m: 4 to 20 m over the boat), over the wheel above its rim and its streaming
  // gores (or round its south end, or over the door's line, if it is too near to climb that far), out along the sun road.
  // Every number from the silk's own seed: nothing mirrored, no two alike.
  // (critique: every way ran into one lane 20 m wide that climbed to 46 to 80 m beyond the wheel, and from the lagoon the sixty stood as
  // one plume over the wheel, a bouquet. The road out is now 70 to 120 m wide and stays low, 26 to 64 m: they scatter across the sky beyond
  // the wheel, behind its arms and to both sides of it, toward the sun.)
  const roadOut = (r, pts) => { pts.push([HUB[0] + (r() - 0.5) * 70, 26 + 22 * r(), -300 - 30 * r()], [HUB[0] + (r() - 0.5) * 120, 24 + 40 * r(), -480]); return pts; };
  const wayOf = (i, e, special) => {
    const r = ctx.rng(7000 + i * 31), pts = [];
    if (e.z < -214) return null;                                              // beyond the wheel already (the door's, the tenter grounds'): the toolkit's own way down the wind
    if (e.z > -90) { const side = Math.sign(e.x - lineX(-92)) || 1, w = kit.at(93 + 3 * r(), side * (19 + 6 * r()), 15.8 + 4 * r()); pts.push([w.x, w.y, w.z]); }      // outside the west front's wings, above the yards
    const from = pts.length ? pts[pts.length - 1] : [e.x, e.y, e.z];
    if (special) for (const q of special(from)) pts.push(q);
    const here = pts.length ? pts[pts.length - 1] : from, run = here[2] - HUB[2];
    if (!special && run > 70) {                                               // low over the lagoon, drawn toward its middle
      const zc = here[2] - run * (0.3 + 0.3 * r()), lx = lineX(zc), x = Math.max(lx - 22, Math.min(lx + 22, here[0] + (lx - here[0]) * (0.3 + 0.5 * r()) + (r() - 0.5) * 14));
      pts.push([x, 6 + 15 * r(), zc]);
    }
    const p = pts.length ? pts[pts.length - 1] : from, room = Math.hypot(p[0] - HUB[0], p[2] - HUB[2]), top = p[1] + 0.6 * room;
    if (p[2] > HUB[2] + 4) {
      if (top > 36 && r() < 0.6) pts.push([HUB[0] + (r() - 0.5) * 30, Math.min(top, 35 + 14 * r()), HUB[2] + (r() - 0.5) * 8]);      // over the wheel (three in five of those that can climb that far; the rest go round it, by the two lanes below)
      else if (p[0] < HUB[0]) pts.push([-31 + (r() - 0.5) * 6, Math.max(p[1] + 3, 19 + 4 * r()), HUB[2]]);               // round its south end, over the weir
      else pts.push([19 + 12 * r(), Math.max(p[1] + 3, 25 + 3 * r()), HUB[2]]);                                          // over the door's line
    }
    return roadOut(r, pts);
  };
  // the three that pass within 5 m of the boat: beside it, a little above the rider's head, never over the stern
  const nearWay = (k) => (from) => {
    const side = k === 1 ? -1 : 1, off = [4.4, 4.2, 5][k], h = [3.5, 4.2, 3.3][k], v = Math.max(0, ctx.boat.speed || 0);
    const T = Math.max(10, ctx.s + from[2]) / Math.max(4, 10 - v) + 1.5 + k * 1.3, sp = Math.min(196, ctx.s + v * T + 2 + k * 3);
    return [P(sp - 28, side * (off + 6), h + 7), P(sp - 9, side * (off + 0.8), h + 0.9), P(sp + 7, side * off, h), P(sp + 24, side * (off + 3.5), h + 4.5)];
  };
  // the crimson one that trails its tail 20 m across the lagoon, right to left, well ahead of the boat
  const dragWay = (from) => {
    const v = Math.max(0, ctx.boat.speed || 0), sb = Math.max(-from[2] + 22, Math.min(128, ctx.s + v * 8 + 26));
    return [P(sb, 17, 3.2), P(sb + 8, 13.5, 0.05), P(sb + 18, 9.5, 0.03), P(sb + 28, 5.5, 0.05), P(sb + 36, 2.5, 2.6), P(sb + 46, -2, 7)];
  };

  const api = {
    flying, lighter, strays, under, tails, own: true,
    get bare() { return S.bare; }, get crossed() { return S.crossed; }, get lastAt() { return S.last ? S.last.at : null; },
    letGo(o = {}) {
      if (S.bare) return api;
      S.bare = true;
      const ends = flyItems.map((_, i) => flying.head(i, V3()));
      // who comes near: the silks whose free ends are at least 30 m up the route from the boat, the nearest first, by turns from either side
      const upRoute = flyItems.map((_, i) => i).filter((i) => -ends[i].z < ctx.s - 30 && flyMeta[i].s < 200).sort((p, q) => ends[p].z - ends[q].z);
      const special = new Map();
      let drag = -1;
      // (critique: the crimson one that trailed its tail was laid from s 128 whatever the boat's place, so for a boat in the lagoon it
      // crossed the line low and large at the bow. Off unless asked for: the lagoon's stray draws the page's line on the water before the gust.)
      if (o.drag === true) { drag = upRoute.find((i) => flyMeta[i].dye === CRIMSON && -ends[i].z < 150); if (drag != null && drag >= 0) special.set(drag, dragWay); }
      let k = 0; for (const i of upRoute) { if (k >= (o.near ?? 3)) break; if (special.has(i)) continue; special.set(i, nearWay(k++)); }
      flying.release('all', { stagger: o.seconds ?? 3, speed: o.speed || [8, 13], ramp: 3, drift: { rise: [8, 40], wander: 24, floor: 15 },
        path: (i) => wayOf(i, ends[i], special.get(i)) });
      return api;
    },
    lift(o = {}) {
      if (!lighter || S.lifted) return api;
      S.lifted = true; lighter.object.visible = true;
      const ends = lightItems.map((_, i) => { lighter.reset(i); return lighter.head(i, V3()); });
      lighter.release('all', { stagger: o.seconds ?? 5, speed: o.speed || [8, 13], ramp: 3, path: (i) => wayOf(100 + i, ends[i], null) });
      return api;
    },
    settle() { S.bare = true; S.lifted = true; flying.gone('all'); if (lighter) lighter.gone('all'); return api; },
    reset() { S.bare = false; S.lifted = false; flying.reset('all'); if (lighter) lighter.gone('all'); return api; },
    crossing(o = {}) {
      if (!strays || S.crossed) return api;
      S.crossed = true;
      const pts = [[140, 18, 5.5], [147, 12.5, 2.6], [152, 9, 0.9], [155.5, 7.2, 0.05], [159.5, 5.2, 0.03], [163.5, 3, 0.05], [167, 0.6, 1.2], [171, -3, 4], [178, -10, 8]].map((q) => P(q[0], q[1], q[2]))
        .concat([[-4, 11.5, -187], [-16, 13.5, -195], [-26, 15, -203], [-31, 17, -216], [-27, 19.5, -234], [-15, 22, -258], [-6, 24, -292], [-3, 28, -370]]);
      strays.release(1, { path: pts, speed: o.speed ?? 4.6, ramp: 3 });
      return api;
    },
    last(o = {}) {
      if (S.last) {
        if (!S.last.rest || o.rest) return api;
        S.last.handle.gone('all'); S.last.handle.object.visible = false; S.last = null;      // (a settled world's, lying at rest: the show sends its own)
      }
      // (critique) It came down the wind from 74 m astern at 5 m/s, its last 33 m under 5 m: to a boat on the current it was never
      // ahead while it was in the air, and slid into the picture along the water. Now it comes off the indigo side, across the
      // wind, and comes down IN FRONT of the rider: over the lagoon to the left of the bow at 14 m, down across the line 13 m
      // ahead of the boat at 1 to 3 m, and lays itself on the water across the current, its near end 1.5 m right of the line
      // (the keel passes beside it). Its line is never beyond s 190 (short of the boom, the wheel's rain and the door).
      // Pale violet, not the full dye: light on the dusk's dark water, and light against the wheel and the door's indigo
      // behind it while it is in the air (the client's rule about value; the full violet lay on violet water as a thin streak).
      const v = Math.max(0, ctx.boat.speed || 0), travel = 4.4, L = 14, d0 = o.d ?? 8.5;
      const sL = o.at ?? Math.min(ctx.s + v * 9.4 + (o.ahead ?? 13), 190), at = kit.at(sL, d0, 0);
      const way = [[-30, -27, 21], [-13, -24, 17.5], [-2, -19.5, 14], [-1.4, -13.5, 10], [-0.9, -8.5, 6.6], [-0.5, -4, 3.4], [-0.2, -0.9, 1.0], [0, 1.8, 0.12], [0, d0, 0.03], [0.3, d0 + 7, 0.03], [0.5, d0 + 10, 0.03]];
      // (rest: for a cue's settle: only the last of the way, all of it on the water: it lies there from the first frame, a metre and a half short of its place, and creeps home)
      const pts = (o.rest ? [[0, d0 - 8.5, 0.04], [0, d0 - 4, 0.03], [0, d0, 0.03], [0.3, d0 + 7, 0.03], [0.5, d0 + 10, 0.03]] : way).map((q) => P(sL + q[0], q[1], q[2])), STOP = o.rest ? 2 : 8;
      if (want.includes('log')) console.info('INVALID_ (log) last silk: rest ' + !!o.rest + ' at time ' + ctx.time.toFixed(2) + ' boat s ' + ctx.s.toFixed(1) + ' speed ' + v.toFixed(2) + ' its line at s ' + sL.toFixed(1));
      const pale = '#' + _c.set(D[VIOLET].color).lerp(new THREE.Color('#E6D2F0'), 0.16).getHexString(), paleTip = '#' + _c.set(D[VIOLET].color).lerp(new THREE.Color('#E6D2F0'), 0.08).getHexString();
      const handle = makeRibbons(ctx, { kind: 'stray', items: [{ path: pts, travel, length: L, width: 0.9, color: pale, tip: paleTip, start: 0, stops: [{ point: STOP, seconds: 1e7 }] }],
        wind, paths: 1, clear: 0, exact: true, seed: 2828, onTouch: (x, z) => mark(x, z, true) });
      handle.object.name = 'cast:last silk';
      if (sun) sun.drape(handle);
      S.last = { handle, at: [at.x, at.z], head: V3(), tail: V3(), rest: !!o.rest };
      return api;
    },
  };
  cast.silks = api;
  // (the switches for looking act on the first frame, when the boat is where the address put it)
  let asked = want.length ? want : null;

  return {
    update(dt) {
      if (asked) {
        if (asked.includes('go')) { api.letGo(); api.lift(); }
        if (asked.includes('bare')) api.settle();
        if (asked.includes('cross')) api.crossing();
        if (asked.includes('last')) api.last();
        asked = null;
      }
      // the lagoon stray's crossing, the first time the boat passes s 116 (until staging takes it over: own = false)
      // (critique: with reduced motion a stray flies at 0.7 of its speed, the boat does not: sent at s 116 it crossed the line two metres
      // ahead of the bow, low and large. With reduced motion it is sent 12 m sooner and crosses as far ahead as for anyone else.)
      if (api.own && !S.crossed && ctx.s >= (ctx.reducedMotion ? 104 : 116) && ctx.s < 150) api.crossing();
      // the last silk lying on the water bleeds violet into the film for the rest of the visit
      const L = S.last;
      if (L && ctx.water && ctx.water.trace) {
        L.handle.head(0, L.head); L.handle.tail(0, L.tail);
        if (L.head.y < 0.2) for (const f of [0.1, 0.5, 0.9]) {
          const x = L.tail.x + (L.head.x - L.tail.x) * f, z = L.tail.z + (L.head.z - L.tail.z) * f;
          ctx.water.trace.inject(x, z, { channel: 'a', radius: 1.5, strength: 0.03 * dt });
          ctx.water.trace.inject(x, z, { channel: 'b', radius: 1.5, strength: 0.03 * dt });
        }
      }
    },
  };
}
