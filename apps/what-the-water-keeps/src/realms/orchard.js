// The orchard in flood (area 2): docs/art/orchard.md is what is built here, docs/building-an-area.md is how.
// In the last light after sunset a flooded apple orchard stands in full blossom over still water skinned with fallen
// petals; a colonnade of white trunks leads to one tree as tall as a cathedral.
//
// This file is the realm: its waterway, its light at the start, its water, its sound, and the list of modules that
// build it (src/realms/orchard/). Every number comes from src/realms/orchard/plan.js: read its header first, because
// the page's (s, d) and the engine's path (s, d) are two different things from the pond onward.
//
//   set     the place and its light: sky, backdrops, bed, mist, the light states, the water and its petal skin
//   heroes  the oldest tree and the hero pieces (the loft's door, the wall's gap, the cart, the hives), the kept lamp
//   kit     the avenue trees and every repeated thing; the loft we are entered through
//   cast    everything alive (stage 3)
//   stage   the route of moments and the two set pieces (stage 4)
//
// Developer switches (besides the engine's): &labels=1 names every stand-in; &only=set,kit / &skip=cast;
//   &dusk=0..1          holds the light at one point of the dusk wherever the boat is (0 afterglow, 1 blue hour)
//   &w=key:value,...    overrides keys of the water's look in every light state (&w=mirrorDarken:0.15,clarity:4)
//   &petals=0           the water without the petals lying on it;  &cover=<x> multiplies how much of it they cover
//   &lastlight=0        without the last light on what stands above the avenue;  &sky=plain  the sky without its painting
//   &bank=0             without the afterglow's bank (the band of lit mist in the west);  &limit=0  without the hold under the bloom
//   &keep=0             the mirror without the white trunks given back (set.js, "THE WATER KEEPS THE WHITE TRUNKS")
//   &gapmist=<x>        how far the water beyond the wall goes into the mist of the way out (0: not at all);  &bandmirror=0  the band in the mirror as the grade leaves it
//   &rings=<seconds>    something touches the water 9 m ahead of the boat every so many seconds (to watch a ring travel)
//   &crowd=1            adds the cast's multitudes as still stand-ins at the planned counts (for measuring cost)
//   &lamp=hero          hangs the remodelled kept lamp (src/engine/lamp-hero.js) on its smith's hook and chain, in place
//                       of the ride's present one; the area takes it by itself the day lamp.js becomes that file
//   &counts=1           writes what the modules grew to .shots/orchard_counts.json
//   &navlog=<name>.json writes where the boat went during &t seconds (with &drift=1) to .shots/ (page s and d, path s
//                       and d, speed, bumps): how the edges, the wall and the things in the water were tested
import { buildModules } from '../engine/modules.js';
import { PLAN } from './orchard/plan.js';

const A = PLAN.light.afterglow, W = PLAN.water;
// the rower (docs/life/rower.md, "Her light"): the blue hour's figure, not a daylight one; edged faintly with the blossom's light.
// IN THE LOFT (stage 5, the critique): the loft is night inside and the area's light does not know it, so with the orchard's
// tone she stood in it lit like the avenue, the brightest thing in the dark (orchard_crit_rower_loft.png). Her look is read
// once, as the area is entered, so update() below gives her the loft's tone by place and eases it to the orchard's between
// s 14 and s 28, as the door's light comes onto her.
const ROWER = { tone: '#A4A8CC', own: 0.3, rim: '#CBBEF2', rimStrength: 0.2, rimPower: 3.0 }, ROWER_LOFT = { tone: '#565C7C', rimStrength: 0.08, from: 14, to: 28 };
const mixHex = (a, b, t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
const QS = new URLSearchParams(location.search), NAV = /^[\w-]+\.json$/.test(QS.get('navlog') || '') ? QS.get('navlog') : null, NAV_T = Math.min(60, +(QS.get('t') || 2)), NAV_DT = +(QS.get('navdt') || 0.5);

export default {
  id: 'orchard', name: 'The orchard in flood',
  path: PLAN.path,
  look: {
    ...A.look,
    veil: PLAN.light.veil,
    veilIn: 16,                    // the loft is night inside: its own dark hides the join, and the door must show from s 8
    current: 2.0, currentNarrow: 2.0,                // (set.js sets both every frame from the boat's place: PLAN.current)
    rower: { ...ROWER },                             // (the director's, judged at s 40; the loft's is given by place in update(): ROWER_LOFT)
  },
  water: {
    ...W.both, ...W.afterglow,
    wake: 0.6, edge: 0.05,
    clarity: W.lookIn.clarity, absorb: W.lookIn.tint, absorbDepth: 1.2, seeDistance: W.lookIn.seeDistance, refraction: 0.8,
    // the petals: set.js lays them itself, as a sheet on the water with a standing map of where they gather (the water's
    // own skin has none). The skin stays on at almost nothing, with an empty picture: that keeps the trace laid over the
    // orchard, the hull writing its lane into it, and `skin.close` the time a lane takes to close (the cast and the
    // staging write and read the trace exactly as for the engine's skin)
    skin: { amount: 0.004, kind: 'petal', scale: 2.6, close: W.lane.close, tint: '#ffffff', light: 1 },
    // (seventh pass) `lay` with `touch.hold`: the trace also keeps a QUICK channel ('glow': nothing of the water's is drawn
    // from it here, touch.amount stays 0, and with `wake: 0` nothing writes it but the cast): a mark written there is gone
    // again after `hold` seconds, where a lane takes skin.close. set.js's petals part for both. For the small marks of
    // living things (a carp's back, a bat's dip): ctx.water.trace.line(x0, z0, x1, z1, { channel: 'glow', radius, strength })
    trace: { texel: 0.125, margin: 14, lay: true }, touch: { hold: W.lane.quick ?? 8, wake: 0 },
  },
  audio: {
    // close to silence, with small dry sounds in it; nothing is tuned but the lamp (page section 8). These are the
    // page's levels, as the area is entered. What moves them (measured in every state: docs/build/orchard/4-staging.md):
    //   music    stage.js: 0.3 in the loft until the reveal (s 26) brings it back as one phrase; 0.45 for the flock's pass;
    //            0.3 for the tide's hush, then 0.82 with the high-pass opened to 140 under wave 3: the fullest it is here
    //   space    update() below, by place: the loft's room, the open orchard from s 24
    //   wind     stage.js: to 0.6 (tone 0.6) for the flock's pass, to 0.1 for the tide
    //   night    update() below, by place (0 until s 134, 0.45 by s 176); stage.js: 0.15 louder at the hives, 0.15 for the hush
    //   shimmer  stage.js: with each firefly front as it passes the boat (to 0.4)
    //   water    stage.js: to 0.42 over the fallen stones at the gap
    music: { gain: 0.7, highpass: 300, reverb: 0.35, width: 1.1 },
    space: { size: 'room', mix: 0.5 },               // the loft; 'open', 0.3 from s 24 (below)
    ambience: { water: 0.3, wind: { level: 0.2, tone: 0.35 }, night: 0, shimmer: 0 },
  },

  async build(ctx) {
    ctx.state.colliders = PLAN.colliders();
    for (const c of ctx.state.colliders) ctx.addCollider(c);
    // (stage 6) THE FALLEN LADDER in the second avenue (page (175.5, +9.5) to (177, +6.5)) was a row the water did not part
    // round: a boat left to the current 6 to 9 m right of the lane lay against it and slid to its inner end, where it was
    // held for good, in the middle of the tide (orchard_crit_nav7_c.json: from 31 s on at page (173.9, +6.5)). Its four
    // circles are now things the water parts round, with the tree it fell from: one thing, gone round on the lane's side.
    { const _p = {}; for (const c of ctx.state.colliders) { if (c.flow || c.r > 0.45) continue; const q = PLAN.locate(c.x, c.z, _p); if (q.s > 174.8 && q.s < 177.8 && q.d > 5.8 && q.d < 10.2) { c.flow = true; c.inside = true; } } }
    // (stage 6) THE ARCH'S FOOT. Where the arch goes into the water, its daughter stem and the crutch beside them stand 1.7 m
    // apart: too little for a hull, enough for a bow. A boat that the current brought round the pond's south side from the
    // first avenue's left-hand aisles put its bow between the crutch and the foot and lay there for good, pressed in by the
    // very water that parts round a single trunk (orchard_crit_nav_cart.json: held at page (112.6, -21.6) from 23 s on;
    // five lines across the avenue tried, three held). The three are one thing to the water: one round collider over them,
    // which has no pocket and is gone round like a trunk. (Not over 3 m: from there on update() takes a thing for an islet
    // and parts the water 20 m off and 2.7 m wide of it, which closed the lane between this and the islet to a boat a
    // metre off the composed line and pressed it onto the islet: tried.) Nothing navigable is lost: the limb is under
    // 2.6 m there, lower than the rower stands.
    // `inside`: the water goes round it on the pond's side only. Outside it there are 1.6 m to the growth at the band's edge:
    // a boat carried that way lay pressed between the two (tried: held at page (111.5, -26.4)).
    { const q = PLAN.xz(113.75, -23.1), c = { x: q[0], z: q[1], r: 3.0, flow: true, inside: true }; ctx.state.colliders.push(c); ctx.addCollider(c); }
    await buildModules(ctx, PLAN, [
      ['set', () => import('./orchard/set.js')],
      ['heroes', () => import('./orchard/heroes.js')],
      ['trees', () => import('./orchard/kit_trees.js')],       // the wood (before kit and the blossom: it publishes shared.wood)
      ['heroes_b', () => import('./orchard/heroes_b.js')],     // everything people made and left (after the wood: ladders, labels and the cart stand against it)
      ['plants', () => import('./orchard/kit_plants.js')],     // what grows in the flood: cow parsley, grass, narcissus, bluebells
      ['kit', () => import('./orchard/kit.js')],
      ['kit_blossom', () => import(QS.get('bltry') === '1' ? './orchard/kit_blossom_try.js' : './orchard/kit_blossom.js')],      // (&bltry=1: the blossom's trial copy, while its maker works; goes when they are done)
      ['cast', () => import('./orchard/cast.js')],
      ['cast_birds', () => import('./orchard/cast_birds.js')],      // the cast: birds (docs/build/orchard/3-cast-birds.md)
      ['cast_waders', () => import('./orchard/cast_waders.js')],      // the cast: waders (docs/build/orchard/3-cast-waders.md)
      ['cast_fish', () => import('./orchard/cast_fish.js')],      // the cast: swimmers (docs/build/orchard/3-cast-swimmers.md)
      ['cast_lights', () => import('./orchard/cast_lights.js')],      // the cast: lights (docs/build/orchard/3-cast-lights.md)
      ['cast_falls', () => import('./orchard/cast_falls.js')],      // the cast: falls (docs/build/orchard/3-cast-falls.md)
      ['cast_stag', () => import('./orchard/cast_stag.js')],      // the cast: presences (docs/build/orchard/3-cast-presences.md)
      ['stage', () => import('./orchard/stage.js')],
    ]);
    // &counts=1 (developer): what the modules grew, to .shots/orchard_counts.json
    if (QS.has('counts')) fetch('/__shot/orchard_counts.json', { method: 'POST', body: JSON.stringify({ ...(ctx.state.shared.counts || {}), colliders: ctx.state.colliders.length, pathLength: +ctx.path.length.toFixed(1) }, null, 1) }).catch(() => {});
  },

  update(dt, ctx) {
    const boat = ctx.boat, st = ctx.state, here = PLAN.locate(boat.x, boat.z, st.here || (st.here = {}));
    // ---- the band of navigable water, kept in the page's frame. The path has soft edges: what holds the hull at the
    // sides of the avenues is the growth, and beyond the wall the mist. The engine only leans a boat back; this makes
    // sure nobody can paddle out to an unfinished edge of the world. Never a wall: the push grows over three metres.
    // (stage 6) AT THE ARCH'S FOOT the band is drawn in on the pond's south side: between the foot (d -25.5) and the growth
    // at the band's edge there is no way for a hull, and a boat the current brought along that edge was carried outside the
    // foot and lay pressed there (orchard_crit_nav5_d18.json). The water leans it in, so that it comes to the foot on the
    // pond's side (d -18.5 from s 108 to s 117), and lets it out again by s 127. Never a wall, like the rest. It begins
    // at s 86 with 3.5 m (the page's pond: 16.5 m of water either side of the islet): the pond's current sets south-west
    // there, and a boat at the band's very edge was pressed nose-on to the trunk at (93.5, -28) (orchard_crit_nav6_d25.json).
    const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const rim = here.d < 0 ? (3.5 * sm(86, 95, here.s) + 5.5 * sm(97, 108, here.s)) * (1 - sm(117, 127, here.s)) : 0;
    // (9 November) ALONG THE PLANK WALK the band ends on the walk's near side. Behind the walk lay sixty metres of open
    // water that ended at the wall with no way through ("comes to rest against the stones until it is paddled out",
    // below): a rider who wandered in had forty metres to back out of, against the current, and one who only held the
    // paddle down stayed at the wall for good (tools/forward.py, the line d -4.9). The water leans a boat in before the
    // walk begins, as it does at every other edge of this band; the walk is the edge anyone sees there.
    const PW = PLAN.left.plankWalk, lim = PLAN.halfWidth(here.s) - rim - 0.95;
    const edge = here.d > 0 ? lim + (Math.min(lim, PW.d - 3.5) - lim) * sm(PW.from - 18, PW.from - 2, here.s) : lim;
    const over = Math.abs(here.d) - edge;
    if (over > 0 && !ctx.engine.frozen) {
      const k = Math.min(1, over / 3), push = 14 * k * k * (3 - 2 * k) * dt, turn = PLAN.turned(here.s), side = Math.sign(here.d);
      boat.slipX -= Math.cos(turn) * side * push; boat.slipZ -= Math.sin(turn) * side * push;
    }
    // ---- the water parts round what stands in it. The engine's current runs straight down the channel and knows
    // nothing of the islet or the trunks, so a boat left to it noses into them and is held there by its bow (the bow has
    // no way round a collider: see 1-layout.md, "Asked of the engine"). So a boat that the current is carrying AT a thing
    // standing alone in the water (a trunk, a prop, the islet) is carried a little sideways as it comes up to it, to the
    // side it was already on, and goes by. Nothing happens beside a thing or below it, nor to a boat on the composed line.
    const loc = ctx.path.locate(boat.x, boat.z, boat.s, st.loc || (st.loc = {})), U = ctx.engine.frozen || ctx.engine.realms.holding ? 0 : PLAN.currentAt(here.s);
    // (9 November: only a boat left to the water. One that is being paddled goes round what it meets by the engine's own
    // rule (the hull slides round the thing, the way it was already going; src/engine/boat.js), and the two rules chose
    // different sides: a boat paddled straight at the trunk at s 128 with nobody steering was carried one way by this
    // and slid the other by that, and stayed there for good. tools/forward.py rows every line to look for that.)
    if (U > 0 && boat.idle > 0.6) {
      // What lies across the boat's way, as one stretch [lo, hi] of its beam (right is +): things that stand side by side
      // (the arch's foot and its daughter stem) are one thing to go round, or a boat would be held between them.
      // (the boat is its middle and its bow: a bow that has swung across the current reaches 1.85 m to one side)
      const bx = -Math.sin(boat.heading) * 1.85, bz = -Math.cos(boat.heading) * 1.85, latB = bx * -loc.tz + bz * loc.tx, mine = [Math.min(0, latB), Math.max(0, latB)];
      let lo = mine[0], hi = mine[1], first = 1e9, big = false, mustIn = false, n = 0;
      const span = st.span || (st.span = []); span.length = 0;
      for (const c of st.colliders) {
        if (!c.flow) continue;
        const rx = c.x - boat.x, rz = c.z - boat.z, isBig = c.r > 3, a = c.r + (isBig ? 2.7 : 1.55), ahead = rx * loc.tx + rz * loc.tz, reach = isBig ? 20 : 6;
        if (ahead < -0.3 || ahead > reach) continue;
        const lat = rx * -loc.tz + rz * loc.tx;
        if (Math.abs(lat) < a + 3.2) span.push(lat - a, lat + a, ahead, (isBig ? 1 : 0) + (c.inside ? 2 : 0));
      }
      for (let pass = 0; pass < 3; pass++) for (let i = 0; i < span.length; i += 4) {
        if (span[i] < hi && span[i + 1] > lo && (span[i] < lo || span[i + 1] > hi || !n)) { lo = Math.min(lo, span[i]); hi = Math.max(hi, span[i + 1]); first = Math.min(first, span[i + 2]); big = big || !!(span[i + 3] & 1); mustIn = mustIn || !!(span[i + 3] & 2); n++; }
      }
      // (not on the composed line itself: a boat left alone from the start stays exactly on it)
      const off = Math.min(1, Math.max(0, (Math.abs(loc.d) - 0.5) / 2));
      if (n && off > 0) {
        // to the nearer side; at the edge of the band, to the inside. Just enough to be clear by the time the boat is there
        const turn = PLAN.turned(here.s), rightIsIn = (-loc.tz * Math.cos(turn) + loc.tx * Math.sin(turn)) * -Math.sign(here.d) >= 0;
        const toRight = hi - mine[0], toLeft = mine[1] - lo, needIn = rightIsIn ? toRight : toLeft, needOut = rightIsIn ? toLeft : toRight, room = PLAN.halfWidth(here.s) - 1.2 - Math.abs(here.d);
        const goIn = mustIn || needOut > room || needIn < needOut * 1.6;                            // the inside unless the outside is much the nearer, and never out of the band (nor outside the arch's foot)
        const way = goIn === rightIsIn ? 1 : -1, need = goIn ? needIn : needOut, reach = big ? 20 : 6;
        const carry = way * Math.min(1.5, need / Math.max(1.2, first - (big ? 3 : 1))) * Math.min(1, (reach - first) / (reach * 0.25)) * U * off * off * (3 - 2 * off);
        boat.x += -loc.tz * carry * dt; boat.z += loc.tx * carry * dt;
        st.dbg = [+carry.toFixed(2), +lo.toFixed(2), +hi.toFixed(2), n, +first.toFixed(2)];
      } else st.dbg = [0, 0, 0, n, 0];
    }
    // ---- the orchard wall (s 216, hedge to hedge, with its 17 m gap). The page draws the water in to the gap from s 206.
    // A boat the current presses against the wall is not held there: it is slid along it toward the gap, and led out
    // round the pier (and, on the left, round the gate leaf that stands open toward it). Between the plank walk and the
    // wall there is no way through; a boat that drifts in there comes to rest against the stones until it is paddled out.
    // (Kept here and not as a row of colliders, because a row of circles has cusps that a drifting boat sits in.)
    if (!ctx.engine.frozen) {
      const wall = PLAN.left.wall, half = Math.abs(wall.gap[0]) + 0.25, leaf = 6.6, east = (st.wallSide ?? (here.s < wall.s ? -1 : 1));      // (leaf: on the left the open gate leaf closes the gap's first two metres to a hull)
      st.wallSide = Math.abs(here.s - wall.s) > 1.4 ? (here.s < wall.s ? -1 : 1) : east;          // which side of the wall the boat is on
      const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading), turn = PLAN.turned(wall.s), tx = Math.sin(turn), tz = -Math.cos(turn);
      let back = 0, where = 0;
      for (const [ox, oz, r] of [[0, 0, 1.0], [fx * 1.85, fz * 1.85, 0.6]]) {                       // the hull's middle and its bow
        const p = PLAN.locate(boat.x + ox, boat.z + oz, st.wallAt || (st.wallAt = {})), ad = Math.abs(p.d);
        if (ad < (p.d < 0 && east < 0 ? leaf : half)) continue;
        // the line it may not cross stands off from the stones near the gap, further on the left where the gate leaf is
        const lead = east < 0 ? (p.d < 0 ? 2.6 : 0.7) * Math.min(1, Math.max(0, (11.2 - ad) / 1.8)) : 0;
        const pen = east < 0 ? p.s - (wall.s - 0.3 - r - lead) : (wall.s + 0.3 + r) - p.s;
        if (pen > back && pen < 5) { back = pen; where = p.d; }
      }
      if (back > 0) {
        const step = Math.min(back, 0.25);
        boat.x += tx * step * east; boat.z += tz * step * east;                                    // out of the stones (eased: never a jump)
        // the water against the wall is still: take the current off the boat while it lies there
        const still = U * (1 - Math.exp(-dt * 2.2)); boat.slipX += tx * still * east; boat.slipZ += tz * still * east;
        const pocket = where > PLAN.left.plankWalk.d + 0.6 && east < 0;                             // (beyond the plank walk: no way to the gap)
        if (!pocket) { const side = Math.sign(where) || 1, slide = 3.4 * dt; boat.slipX -= Math.cos(turn) * side * slide; boat.slipZ -= Math.sin(turn) * side * slide; }
        if (boat.u > 0 && east < 0) boat.u *= Math.exp(-dt * 1.5);
      }
    }
    // ---- &navlog=<name>.json (developer): where the boat went, twice a second, posted to .shots/ after &t seconds
    if (NAV) {
      const nv = st.nav || (st.nav = { t: 0, next: 0, rows: [], sent: false });
      nv.t += dt;
      if (nv.t >= nv.next) { nv.next += NAV_DT; nv.rows.push([+nv.t.toFixed(1), +here.s.toFixed(2), +here.d.toFixed(2), +boat.s.toFixed(1), +boat.d.toFixed(2), +boat.speed.toFixed(2), +(boat.bumped || 0).toFixed(2), +((((boat.heading - Math.atan2(-loc.tx, -loc.tz) + Math.PI * 3) % (Math.PI * 2) - Math.PI) * 180 / Math.PI)).toFixed(0), +Math.hypot(boat.slipX, boat.slipZ).toFixed(2), +(Math.atan2(-loc.tx, -loc.tz) * 180 / Math.PI).toFixed(0), ...(st.dbg || [])]); }
      if (!nv.sent && nv.t >= NAV_T - 0.3) { nv.sent = true; fetch('/__shot/' + NAV, { method: 'POST', body: JSON.stringify({ columns: ['t', 'page s', 'page d', 'path s', 'path d', 'speed', 'bumped', 'head', 'slip', 'flow'], rows: nv.rows }) }).catch(() => {}); }
    }
    // ---- the rower's light in the loft (ROWER_LOFT, above): nothing is said to her once the boat is out in the avenue
    // (nor after the area is left)
    const rower = boat.model && boat.model.rower;
    if (rower && rower.setLook) {
      const t = Math.min(1, Math.max(0, (here.s - ROWER_LOFT.from) / (ROWER_LOFT.to - ROWER_LOFT.from))), k = Math.round(t * t * (3 - 2 * t) * 40) / 40;
      // (in the loft every frame: the engine gives her the area's look when the area becomes the present one, whenever that falls)
      if (k < 1 || st.rowerK !== k) { st.rowerK = k; rower.setLook({ ...ROWER, tone: mixHex(ROWER_LOFT.tone, ROWER.tone, k), rimStrength: ROWER_LOFT.rimStrength + (ROWER.rimStrength - ROWER_LOFT.rimStrength) * k }); }
    }
    // ---- the sound that goes by distance (the staged sounds are stage.js's)
    const a = ctx.audio;
    if (a && a.space && !a.silent) {
      a.space(here.s < 24 ? { size: 'room', mix: 0.5 } : { size: 'open', mix: 0.3 }, 3);
      const night = here.s < 134 ? 0 : here.s < 176 ? 0.45 * (here.s - 134) / 42 : here.s < 216 ? 0.45 : 0.45 * Math.max(0, 1 - (here.s - 216) / 20);
      a.layer('night', night, 2);
    }
  },
};
