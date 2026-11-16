// The orchard in flood: the cast, group "Falls" (stage 3). The log is docs/build/orchard/3-cast-falls.md.
//
// What lives here (docs/art/orchard.md, section 5; docs/life/falls.md is the family's page):
//   FALLING PETALS     6,000 in a box of 40 x 16 x 40 m that goes with the boat, born under blossom (a 512-cell canopy
//                      map made from shared.blossom.crowns), each from the underside of the blossom it hangs in, and
//                      thinly over the open water between crowns; a pin ring where one lands within 12 m of the boat
//                      (20 a second at most); the hour on their paint
//   THE GREAT FALL     a control (greatFall): 12,000 more under the oldest tree's crown, r 29 m: round the boat in showers,
//                      high in the vault over it, and under the whole crown over 4 + 6 + 6 s
//   A BUMPED TRUNK     shared.wood.onBump: sixty petals over three seconds from under that tree's crown
//   THE EVENING AIR    a control (eveningAir): shared.blossom.front run down the avenue from the west at 6 m/s, with a
//                      line of petals let go under it
//   ON THE FOREDECK    petals that have settled on the rider's own boat, sixty at most; they go over the side above 4 m/s
//   ROUND THE HULL     a petal that lands near the boat stays on the water: it lies where it was seen to land, rides the
//                      rings, is shouldered aside by the bow and closes in behind (the family's floaters, in the sheet's own pale)
// Boughs and blossom (kit_trees.js, kit_blossom.js) and the dusk (set.js) are other people's and stand: this module only
// calls them (shared.blossom.shake / front; shared.hour).
//
// FOR THE STAGING: everything is on shared.cast.falls. Nothing here plays a sound and nothing here places a cue: the
// two set pieces are controls, shown for pictures by the switches below.
//   density            0..1, the ordinary fall (the tide: stage.tween(shared.cast.falls, 'density', 0.25, 1.5), and back)
//   greatFall(o)       the roost, 12 s after s 98: returns about how many are let go. o: { count, radius, envelope, near, high, from, front }
//   greatFallSettled() the world after it, for a boat set down beyond the roost (the cue's `settle`): the foredeck white
//   eveningAir(o)      s 70: the front and its line of petals; returns the seconds it takes to pass. o: { at, from, to, speed, more, depth, petals }
//   air                where that front is while it runs: { on, s, speed, depth, reaches(s) }
//   bump(x, z)         the avenue tree nearest (x, z) shakes and lets sixty go (a boat that bumps a trunk does this by itself)
//   onTick, tickRate   SOUND: onTick(x, z, info) is called for a landing within 5 m of the boat, on water, tickRate times a
//                      second at most (3; the roost's hush sets 12): attach ctx.audio.play('tick', { x, z, gain: 0.3, pitch: 0.3 })
//   onLand             every landing within 12 m of the boat (a hundred and more a second under blossom): (x, z, info); info.onBoat, info.distance
//   petals             the family's own handle (burst, landings, wind, uniforms);  mask: the canopy map (mask.at(x, z) -> cover, under)
//   deck               the foredeck: { count, limit, settle(n), clear() };  afloat: the petals lying round the hull (cover 0..1, add(x, z), kept), or null
//
// Developer switches of this module (in the address):
//   &fgreat=<s>   let the great fall go <s> seconds after the area starts      &fair=<s>    the evening air, likewise
//   &fgreatn=<n>  the great fall of n petals (9000: the page's)
//   &fbump=<s>    bump the nearest avenue tree, likewise                        &fdeck=<n>   n petals lying on the foredeck at once
//   &fdensity=<x> the ordinary fall's density (0..1)                            &fafloat=0   WITHOUT the petals that stay on the water where they land (&fafloat=<n>: room for n of them)
//   &fdrift=<p>   the share of open water between crowns over which single petals drift down (default below; 0 = the page's rule)
//   &fdeckrate=<x> petals settle on the foredeck that many times as fast        &fpin=<x>    a pin ring of that strength beside the boat every 1.5 s
//   &ftone=<x> &ftoneb=<x> &fglare=<x>  how light the petals in the air are (afterglow, blue hour), and their brightest
//   &fring=<x>    the strength of a landing's pin ring beside the hull           &fdebug=<s>  writes .shots/orchard_fa_debug.json at <s> seconds
import { makeFall, canopyMask, cardGeometry, GLARE_PARS, GLARE_GLSL, glareUniforms } from '../../engine/life/falls.js';
import { makeFloaters } from '../../engine/life/floaters.js';

const Q = new URLSearchParams(location.search);
const num = (k, d) => (Q.has(k) && Q.get(k) !== '' && isFinite(+Q.get(k)) ? +Q.get(k) : d);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ---- the numbers (the page's, and what was settled in pictures: see the log)
const FALL = {
  count: 6000, box: [40, 16, 40],
  pond: [88, 134],                     // the page's s between which there is no avenue (the pond, the oldest tree)
  size: 0.075,                         // a petal's length: the page's 6 cm, drawn as long as the petals set.js lays on the water (7.5 cm), which it joins when it lands
  far: [7, 1.5],                       // beyond 7 m drawn up to half as large again (the family's stage convention: or under the far crowns the fall is not seen at all)
  // (the cards stand in the engine's own ramp, whose key is the band's apricot: at the family's 0.75 a petal turned to the
  // west is a salmon fleck and one turned to the eye is the palest thing in the picture after the flame. A third of the
  // ramp leaves a faint warmth on the side toward the band and a third less light on the side turned away)
  shade: 0.3, backlight: 0.2,
  deckAt: 0.03,                        // over the rider's own boat a petal is gone at this height: the bottom boards (the family's 0.2 m let one vanish a hand above them; whatever stands higher hides it as it passes)
  pink: [0.95, 0.96, 1.13],            // the back's pink, by channel, against the page's (see "the hour on their paint")
  glare: 0.56, keepOut: 1.2,           // the brightest their paint may be: within two metres of the prow lantern a petal at the family's 0.86 is a flat white shape, the palest thing in the picture
  drift: 0.3, driftFrom: 8,            // single petals over open water: the share of its cells they come down over, and from what height
  greatCount: 12000, greatRadius: 29, greatEnvelope: [4, 6, 6], greatFront: 2.5,       // (the page: 9,000. See "the great petal fall" below, and the log)
  // round the boat: the share of the great fall let go there, within how many metres of it, in clumps of `greatEach`,
  // each between these shares of the height of the blossom over it (taken as `greatCap` metres at most)
  greatNear: 0.6, greatNearRadius: 13, greatEach: 40, greatFrom: [0.1, 1], greatCap: 9, greatShowers: [0.28, 0.24, 0.2, 0.16, 0.12],
  // THE VAULT: the share let go high in the air over the boat (`greatHigh`), in `rounds`, in clusters of `each` petals
  // `cluster` metres across, within `reach` metres of the place the boat will be in `lead` seconds, between the heights
  // `y` (and `height` metres up and down round each cluster's own), each cluster over `over` seconds
  greatHigh: 0.25, greatVault: { rounds: 4, reach: 16, lead: 5, y: [8.5, 14.5], height: 4, cluster: 4, each: 45, over: 2.5 },
  spare: 5200,                         // room in the pool beside the great fall: the evening air's line (4,600), bumped trunks. (Both at once: a rider who races from s 70 to the roost has the air's petals still coming down)
  ring: [0.14, 0.04, 0.12],            // a landing's pin ring: the strength of one that is seen (beside the hull; `seen` a second at most), the strength of all the others (the page's 0.03 to 0.05), its radius
  within: 12, perSecond: 20, seen: 4, told: 400,  // rings: within 12 m, twenty a second at most; `told`: how many landings a second the family may tell this module of (all of them)
  tickWithin: 5, tickRate: 3,          // a tick for a landing within 5 m, 3 a second at most (12 in the roost's hush: the staging sets it)
  bump: { count: 60, over: 3, reach: 4.6, high: 6.2, each: 2, beyond: 1 },      // a bumped trunk: sixty over three seconds (the page), `each` from under each of the tree's own clumps of blossom within `reach` metres of its trunk and no higher than `high`, the nearest first to a place `beyond` metres past the trunk as the boat sees it
  // petals that have landed and stay on the water: how many can lie at once; seconds one lies before it has soaked and
  // gone; its length (the sheet's own petals are 7.5 cm); which landings stay: all round the boat within `near` metres,
  // thinning to `round`, and in the water the bow is coming to (`lane` metres either side of its heading, `ahead` metres on)
  // (`beside`, `before`: how many a second may stay beside the boat and in the bow's way; `great`: times as many while the great fall is landing)
  // `strew`: single petals lying in the bow's way that were not seen to fall (the lane ahead of a boat is half healed,
  // the page says: petals have drifted back into it): to the square metre on open water and in the thick of a drift,
  // laid this far ahead of the boat (where one is a sliver under a pixel high), this far to either side of its heading
  lying: { pool: 3000, landed: 42, size: [0.066, 0.082], lift: 0.007, within: 12, near: 4.5, round: 8, lane: 2.4, ahead: 12, patch: 1.3, beside: 10, before: 5, great: 6,
    strew: { open: 1.1, drift: 3.2, far: [13, 16.5], wide: 1.9 } },
  // the foredeck: sixty at most (the page); how many the ordinary fall leaves there before the great fall; a petal's
  // length; petals a second that settle under blossom and under open sky, and in the great fall (far more than a deck
  // of a fifth of a square metre would catch in life: petals four times life, on a stage); the speed over the ground
  // above which they go; the brightest their paint may be (they lie half a metre from the prow lantern)
  deck: { max: 60, ordinary: 22, size: 0.062, under: 0.5, open: 0.045, great: 3.4, slide: 4.0, glare: 0.5 },
  // (`puff`: how many a crown of the inner row and of the next row lets go, in `over` seconds, from within `crown` metres
  // of its trunk; a place has the whole of its share if it lies `full` metres ahead of the boat when the air is let go,
  // `far` of it nearer or further ahead, `back` of it behind; `petals`: about how many it is in all for a boat at s 70,
  // so that eveningAir({ petals }) can ask for more or fewer)
  air: { speed: 6, depth: 12, more: 2, ahead: 45, behind: 22, petals: 5250, reach: 21, puff: [420, 110], back: 0.3, far: 0.5, full: [8, 33], over: 1.2, crown: 5.2, from: [0.55, 1],
    // the oldest tree's skirt, where it hangs over the way: clumps at places `step` metres apart, out to `half` metres
    // either side of the lane (`each`: how many, within `mid` metres of the lane's middle and beyond), each between
    // `from` of the height of the blossom over it (`cap` metres at most)
    skirt: { each: [120, 55], mid: 8, step: 6, half: 12, cap: 7, from: [0.45, 1], across: 4 },
    // over the lane itself (carried out from the crowns' shoulders): a line across it every `step` metres, `each` petals,
    // `half` metres either side of the middle, from `y` metres (and `height` up and down)
    lane: { step: 4.5, each: 120, half: 5, y: 6.2, height: 2.4 } },
};

export async function build(ctx, plan, shared) {
  const { THREE } = ctx, F = shared.frame;
  const cast = shared.cast = shared.cast || {};
  const here = shared.here || { s: 0, d: 0 };
  const calm = !!ctx.reducedMotion;
  const rnd = ctx.rng(4177);

  // ---------------------------------------------------------------------------------------------- where petals are born
  // One disc to every clump of blossom, with the height of its underside (kit_blossom.js). If the blossom has not been
  // built (a module left out), a plain crown to every tree stands in, so that the fall is never without its trees.
  let crowns = shared.blossom && shared.blossom.crowns && shared.blossom.crowns.length ? shared.blossom.crowns : null;
  if (!crowns) {
    crowns = [];
    for (const t of plan.trees.trees) crowns.push({ x: t.x, z: t.z, r: 4.4, under: 3.4 });
    for (const t of plan.trees.far) crowns.push({ x: t.x, z: t.z, r: 4.2, under: 3.4 });
    const c = F.at(plan.tree.at[0], plan.tree.at[1]);
    crowns.push({ x: c.x, z: c.z, r: 27, under: 7 });
  }
  // AND A THIN DRIFT OVER OPEN WATER. The page has petals born under blossom only. In this orchard that leaves the lane
  // itself empty: the avenue's crowns stop 5 m short of the centre line on either hand, and a petal 5 m off is nine
  // pixels, one 12 m off a fleck (pictures: the log). A petal let go from the top of a crown is twenty seconds coming
  // down, and the least air carries it metres: so over the open water between crowns single petals come down too,
  // far thinner than under blossom (`drift`: the share of that water they come down over), from the height of the
  // crowns' shoulders. They thin away beyond the wall: the page's "single petals beyond".
  // (no underside is taken higher than the fall's own ceiling: the field is born at 16 m at most whatever the mask
  // says, and a petal of the great fall let go from the dome's top, 28 m up, would be a minute coming down)
  crowns = crowns.map((c) => (c.under > FALL.box[1] ? { ...c, under: FALL.box[1] } : c));
  const drift = clamp(num('fdrift', FALL.drift), 0, 0.9), wallS = plan.left.wall.s;
  const only = canopyMask(ctx, { crowns, size: 512 });           // the blossom alone (with no drift this is the fall's map; with drift it only says where the open water is)
  let mask = only;
  if (drift > 0) {
    const R = only.rect, out = F.at(wallS + 26, 0), x0 = Math.min(R.x - R.z / 2, out.x - 12), x1 = Math.max(R.x + R.z / 2, out.x + 12), z0 = Math.min(R.y - R.w / 2, out.z - 12), z1 = Math.max(R.y + R.w / 2, out.z + 12);
    const cell = Math.max(x1 - x0, z1 - z0) / 512, loc = {}, m = {}, rd = ctx.rng(90210);
    mask = canopyMask(ctx, { crowns, size: 512, rect: [x0, z0, x1, z1], paint: (put) => {
      for (let z = z0 + cell / 2; z < z1; z += cell) for (let x = x0 + cell / 2; x < x1; x += cell) {
        const r = rd();
        if (r > drift) continue;
        plan.locate(x, z, loc);
        const ad = Math.abs(loc.d);
        // (inside the orchard, out to its standing growth; nothing inside the loft; thinning away beyond the wall, over the water of the gap only)
        const share = smooth(26.5, 30, loc.s) * (loc.s < wallS ? 1 - smooth(44, 54, ad) : (1 - smooth(wallS + 2, wallS + 24, loc.s)) * (1 - smooth(8, 16, ad)));
        if (r > drift * share) continue;
        if (only.at(x, z, m).cover > 0.02) continue;
        put(x, z, 1, FALL.driftFrom);
      }
    } });
    only.texture.dispose();                                      // (only its numbers were needed)
  }

  // ---------------------------------------------------------------------------------------------- the petals in the air
  const api = { onTick: null, onLand: null, tickRate: FALL.tickRate, landed: 0, rings: 0, ticks: 0, bumps: 0 };      // (landed, rings, ticks, bumps: counters, for checking)
  let nextTick = 0;
  const ringNear = num('fring', FALL.ring[0]), ringFar = num('fringfar', FALL.ring[1]), seenRate = num('fseen', FALL.seen);
  const rings = { tokens: 4, seen: 1, at: 0 };
  const onLand = (x, z, info) => {
    api.landed++;
    // ITS PIN RING, twenty a second at most (the page). Under blossom about a hundred petals a second land within 12 m
    // of the boat: if the twenty were taken as they come (the family's own cap does that), five landings in six beside
    // the hull would write nothing. So every landing is told (the family's cap is set far above the fall), and the
    // twenty are spent here on the nearest: one within 5 m has its ring while any are left; one further off only when
    // few near ones are asking.
    // HOW STRONG. The page gives 0.03 to 0.05, which on this water cannot be seen at all (pictures: the log). But this
    // water keeps a ring for ten seconds (it must: the page's rings travel 50 m), so twenty a second that CAN be seen
    // are two hundred at once round the hull, and the mirror there is never clean (tried: the log). So four a second
    // at most (`seen`) are rings that can just be seen opening, beside the hull, where the rider is looking; all the
    // others are the page's: a shiver in the mirror and no more.
    const now = ctx.time, d = info.distance, dt = Math.max(0, now - rings.at);
    rings.tokens = Math.min(6, rings.tokens + dt * FALL.perSecond); rings.seen = Math.min(2, rings.seen + dt * seenRate); rings.at = now;
    if (!info.onBoat && rings.tokens >= 1 + 3.5 * smooth(5, FALL.within, d)) {
      rings.tokens -= 1; api.rings++;
      let strength = ringFar;
      if (d < 7 && rings.seen >= 1) { rings.seen -= 1; strength = ringFar + (ringNear - ringFar) * (1 - smooth(2.5, 7, d)); }
      ctx.water.ripple(x, z, strength * (0.75 + 0.5 * ((info.index * 0.618034) % 1)), FALL.ring[2]);
    }
    if (d < FALL.tickWithin && !info.onBoat && now >= nextTick) { nextTick = now + 1 / Math.max(0.05, api.tickRate); api.ticks++; if (api.onTick) api.onTick(x, z, info); }
    if (api.onLand) api.onLand(x, z, info);
  };
  const treeAt = shared.tree && shared.tree.centre ? shared.tree.centre : F.at(plan.tree.at[0], plan.tree.at[1]);
  const GREAT_N = Math.max(100, num('fgreatn', FALL.greatCount)), POOL_N = GREAT_N + FALL.spare;      // (developer) &fgreatn=<n>: the great fall of n petals
  // (while the great fall is landing, far more of what lands stays: it whitens the water round the boat as it whitens the foredeck)
  const lying = makeLying(ctx, plan, shared, { treeAt, boost: () => { const tg = ctx.time - great.t0; return 1 + (FALL.lying.great - 1) * smooth(2, 6, tg) * (1 - smooth(great.len + 6, great.len + 14, tg)); } });
  const petals = makeFall(ctx, {
    kind: 'petal', count: FALL.count, pool: POOL_N, box: FALL.box, mask, size: FALL.size, far: FALL.far, shade: FALL.shade, backlight: FALL.backlight, glare: num('fglare', FALL.glare), keepOut: calm ? 1.8 : FALL.keepOut, deck: FALL.deckAt,
    landings: { within: FALL.within, perSecond: FALL.told, ring: false, onLand },
    ...(lying ? { settle: lying.gate, settleWithin: FALL.lying.within } : {}),
    seed: 2671,
  });
  const cards = petals.object.children.find((c) => c.isMesh) || null;
  petals.density = clamp(num('fdensity', 1), 0, 1);

  // ---- the pool is not drawn while it is empty. The family draws every instance every frame, the pool's idle ones as
  // points of no size: here that is the great fall's 9,000 and the evening air's 5,000 (84,000 triangles a picture)
  // for the minute and a half of the ride in which they exist. So every burst is noted as it is let go (through the
  // handle itself, so that a burst the staging lets go is noted too), and the geometry's instance count covers the
  // pool only until the last of them can have landed (reckoned generously: nothing is ever cut short in the air).
  const geo = cards ? cards.geometry : null, nField = petals.count, nPool = petals.pool, pool = { head: 0, wrapped: false, until: -1 };
  const rawBurst = petals.burst;
  petals.burst = (spec = {}) => {
    const n = rawBurst(spec);
    if (n > 0) {
      const env = spec.envelope, over = env ? env[0] + env[1] + env[2] : spec.over ?? 1, high = Math.max(FALL.box[1], spec.at ? spec.at[1] : 0, spec.line ? Math.max(spec.line[0][1], spec.line[1][1]) : 0, spec.disc && !spec.mask ? spec.disc.y ?? FALL.box[1] : 0);
      if (pool.head + n >= nPool) pool.wrapped = true;
      pool.head = (pool.head + n) % nPool;
      pool.until = Math.max(pool.until, ctx.time + (spec.delay || 0) + over + (spec.order ? 25 : 0) + high / 0.35 + 2);
    }
    return n;
  };
  const trimPool = () => {
    if (!geo) return;
    if (ctx.time > pool.until) { pool.wrapped = false; geo.instanceCount = nField; } else geo.instanceCount = nField + (pool.wrapped ? nPool : pool.head);
  };
  // ---- and nothing in the air is drawn into the engine's picture of the scene without the water (&fpre=1 puts them
  // back, to compare). That picture is what the water reads as lying beneath it and what tells the painter's filter
  // where the water is; a petal in the air is neither, and it is kept out of the filter already (it is `crisp`).
  // PROVED IN PICTURES (the log, fourth holder): with them in it, a petal seen against water wears a thin dark fringe on
  // its lower edge (the water's own soft edge against "a thing standing in it"); without, its edge is clean; nothing
  // else in the picture changes (333 pixels of 1.44 million), and one of the fall's two drawings a frame is saved.
  if (cards && num('fpre', 0) !== 1) {
    const was = cards.onBeforeRender, engine = ctx.engine;
    let kept = -1;
    cards.onBeforeRender = function (renderer, ...rest) {
      if (renderer.getRenderTarget() === engine.pre) { kept = geo.instanceCount; geo.instanceCount = 0; }
      if (was) was.call(this, renderer, ...rest);
    };
    cards.onAfterRender = () => { if (kept >= 0) { geo.instanceCount = kept; kept = -1; } };
  }

  // ---- the hour on their paint. The family's cards take no extension, so they cannot wear shared.dusk: they stand in
  // the engine's own ramp (the page's light table), in which pale paint at blue hour is brighter than the blossom it
  // fell from. So the hour is put on their two palettes instead: each colour times the air pale paint stands in
  // (shared.dusk's own uAir, which set.js moves with the dusk), and they hold a little of the light as blossom does.
  const palA = cards ? cards.material.uniforms.uFallPalA.value : [], palB = cards ? cards.material.uniforms.uFallPalB.value : [];
  // (the pink of a petal's back is laid a little to the cool side: `fpink`, by channel. Within the prow lantern's reach its
  // amber falls on that pink, and the page's own #E3A8B0 measured #c59b8e there, a salmon, hue 12: too near the apricot the
  // page keeps for the band alone. A cooler pink comes out a rose under the lamp and a lilac-pink away from it)
  const PINK = (Q.get('fpink') || '').split(',').map(Number).filter((v) => isFinite(v) && v > 0);
  const cool = PINK.length === 3 ? PINK : FALL.pink;
  const baseA = palA.map((c) => c.clone()), baseB = palB.map((c) => c.clone().multiply(new THREE.Color(cool[0], cool[1], cool[2])));
  const air = new THREE.Color(1, 1, 1), tone = new THREE.Color(), TONE = [num('ftone', 0.95), num('ftoneb', 0.92)];      // (how light, of the air pale paint stands in: afterglow, blue hour)
  const duskOnPetals = () => {
    const U = shared.dusk && shared.dusk.uniforms;
    if (U && U.uAir) air.copy(U.uAir.value); else air.setRGB(1, 1, 1);
    // (a step down at blue hour, when they would be the palest things in the picture after the lantern. And the pink of a
    // petal's back is taken most of the way to its white as the dusk goes: the prow lantern burns brighter then, and
    // amber light on the page's pink is an orange-red fleck, the one colour the page keeps for the band)
    const k = shared.hour || 0;
    // (not the whole of the air's blue in the afterglow: the engine's own sky light is on them already, and a petal in the
    // lantern's reach must come out warm, which a blue paint under an amber lamp does not)
    tone.setScalar(0.3 * air.r + 0.55 * air.g + 0.15 * air.b).lerp(air, 0.3 + 0.7 * k).multiplyScalar(TONE[0] + (TONE[1] - TONE[0]) * k);
    for (let i = 0; i < palA.length; i++) { palA[i].copy(baseA[i]).multiply(tone); palB[i].copy(baseB[i]).lerp(baseA[i], 0.3 + 0.4 * k).multiply(tone); }
    if (cards && cards.material.uniforms.uEmissive && shared.blossomSelf) cards.material.uniforms.uEmissive.value.copy(shared.blossomSelf.value).multiplyScalar(0.5);
  };

  // ---------------------------------------------------------------------------------------------- the great petal fall
  // A control, for the roost (the staging fires it twelve seconds after s 98): the oldest tree lets go under its whole
  // crown. Nothing is thrown and nothing flies: every petal leaves the air it hung in and comes down at a petal's own
  // speed. Returns about how many will have been let go.
  //   UNDER THE WHOLE CROWN (`wide`): from every height up to the blossom's own underside, on the page's envelope, the
  //   highest first, beginning over the bole (where the birds pour in) and at the skirts a second and a half later.
  //   ROUND THE BOAT (`near`). The page's nine thousand strewn evenly under a crown 58 m across are three or four to the
  //   square metre, hardly more than the tree sheds all evening: from the boat the great fall could not be told from
  //   the ordinary one (pictures: the log). So most of it is let go round the boat, in five showers one after another,
  //   each over where the boat then is and is making for, under the tree's own blossom. A shower is made of clumps: each
  //   a few metres across, let go between the water and the blossom over it (never from higher than `cap` metres, or
  //   under the open vault the fall would be six seconds reaching the water), the highest of it first and the lower
  //   only as the fall reaches them (`front` m/s), so that it is SEEN TO COME DOWN and is landing all round the boat by
  //   the page's hush, six seconds in.
  //   THE VAULT (`high`). All of that is low: a rider who looked UP saw an empty vault with a few petals at the foot of
  //   the picture (postcard 6), and one who looked back from the second avenue half a minute later saw nothing left in
  //   the air. So a part is let go HIGH, in the air between the low boughs and the dome over where the boat is: it
  //   comes down from there at a petal's own speed, which is twenty to forty seconds, so the vault is full from the
  //   fourth second on and empties from the top down long after the low fall has thinned (the page: "petals come down
  //   the whole height of it"; "the fall thins").
  const m0 = {};
  const great = { t0: -1e9, len: 16, env: FALL.greatEnvelope, showers: 0, each: 0, rounds: 0, vaultEach: 0, next: 0, front: FALL.greatFront, from: FALL.greatFrom, radius: FALL.greatRadius };
  const mg = {}, hh = [0, 0, 0];
  // one clump: `n` petals let go round (x, z), `across` metres wide, between the heights lo and hi, the highest of it
  // first and the lower ones only as the fall reaches them (`front` m/s). Nothing is thrown: they wander apart as they fall
  const clump = (x, z, lo, hi, n, across, over, delay, front) => petals.burst({ at: [x, (lo + hi) / 2, z], radius: across, height: hi - lo, count: n, over, delay, order: (px, py) => Math.max(0, hi - py) / front });
  // `count` petals round (cx, cz) within R metres, under the oldest tree's blossom, in clumps of `each`:
  // heights(under, out) says between which two heights a clump is let go, and after how long
  const clumps = (cx, cz, R, count, each, across, over, heights) => {
    let left = count, done = 0;
    for (let i = 0; i < 1200 && left > 0; i++) {
      const a = rnd() * 6.2832, rr = Math.sqrt(rnd()) * R, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      if (Math.hypot(x - treeAt.x, z - treeAt.z) > great.radius || mask.at(x, z, mg).cover < 0.5) continue;
      heights(mg.under, hh);
      const n = Math.min(left, each); left -= n;
      done += clump(x, z, hh[0], hh[1], n, across, over, hh[2], great.front);
    }
    return done;
  };
  const greatFall = (o = {}) => {
    const env = o.envelope || FALL.greatEnvelope, r = o.radius ?? FALL.greatRadius, V = FALL.greatVault;
    great.t0 = ctx.time; great.len = env[0] + env[1] + env[2]; great.env = env;
    const front = o.front ?? FALL.greatFront, m = {}, total = o.count ?? GREAT_N, share = clamp(o.near ?? FALL.greatNear, 0, 0.8), high = clamp(o.high ?? FALL.greatHigh, 0, 0.9 - share);
    great.front = front; great.from = o.from || FALL.greatFrom; great.radius = r;
    great.showers = share > 0 ? 5 : 0; great.each = Math.round(total * share); great.next = ctx.time;
    great.rounds = high > 0 ? V.rounds : 0; great.vaultEach = Math.round(total * high / V.rounds);
    const wide = petals.burst({ disc: { x: treeAt.x, z: treeAt.z, r }, mask: true, count: Math.round(total * (1 - share - high)), envelope: env, from: [Math.min(0.05, great.from[0]), 1],
      order: (x, y, z) => { mask.at(x, z, m); return Math.max(0, m.under - y) / front + 1.5 * Math.min(1, Math.hypot(x - treeAt.x, z - treeAt.z) / r); } });
    return wide + Math.round((great.each + great.vaultEach * great.rounds) * (petals.pool / Math.max(1, POOL_N)));
  };
  const runGreat = () => {
    if ((great.showers <= 0 && great.rounds <= 0) || ctx.time < great.next) return;
    great.next = ctx.time + great.len / 16;        // (five showers in the envelope's first quarter, the first the heaviest: the page has the fall at its fullest six to twelve seconds in)
    // round the boat and a little ahead of it, the way it is going; or, if the boat has left the tree (a rider who raced
    // on), under the whole crown with the rest: the fall is the tree's, whoever is watching
    const b = ctx.boat, far = Math.hypot(b.x - treeAt.x, b.z - treeAt.z) > great.radius + 6, vx = b.vx || 0, vz = b.vz || 0, V = FALL.greatVault;
    if (great.showers > 0) {
      great.showers--;
      clumps(far ? treeAt.x : b.x + vx * 2.5, far ? treeAt.z : b.z + vz * 2.5, far ? great.radius : FALL.greatNearRadius, Math.round(great.each * FALL.greatShowers[4 - great.showers]), FALL.greatEach, 3.5, 1.5,
        (under, out) => { const c = clamp(under, 2.5, FALL.greatCap); out[0] = great.from[0] * c; out[1] = great.from[1] * c; out[2] = 2 * rnd(); });
    }
    if (great.rounds > 0) {
      great.rounds--;
      clumps(far ? treeAt.x : b.x + vx * V.lead, far ? treeAt.z : b.z + vz * V.lead, far ? great.radius - 3 : V.reach, great.vaultEach, V.each, V.cluster, V.over,
        (under, out) => { const y = V.y[0] + (V.y[1] - V.y[0]) * rnd(); out[0] = y - V.height / 2; out[1] = y + V.height / 2; out[2] = (V.y[1] - y) / (2 * great.front); });
    }
  };

  // ---------------------------------------------------------------------------------------------- a bumped trunk
  // (kit_trees.js finds the tree and shakes its crown, wood and blossom together; this lets its petals go)
  // WHERE THE SIXTY COME DOWN. Asked for anywhere in a disc under the crown, THIRTEEN were let go (counted): the family
  // lets a petal go only where the canopy map says blossom hangs, and a pruned apple's blossom is clumps at its boughs'
  // ends with open air between and round the trunk (two fifths of the disc: `roundTree` in the debug file). And those
  // were anywhere under a crown of sixty square metres: three seconds after the knock a rider had FOUR in the picture
  // (the same strip with and without the bump, laid over one another: the log), and nobody could have said that the
  // tree had answered. So the places are found here: under this tree's own clumps (never the drift over open water,
  // never a clump higher than `high` metres, from which a petal is ten seconds coming down), the lowest and the
  // nearest the trunk first, and of those rather the ones a little beyond it as the boat sees it (the boat that gave the
  // knock lies against the trunk, and what hangs straight over the rider's head comes down behind the eye: tried, the
  // sixty were let go and three were seen), `each` petals from the underside of each: all sixty, over three seconds.
  const bumpAt_ = [], bm = {};
  const bump = (t) => {
    const B = FALL.bump, b = ctx.boat, dx = t.x - b.x, dz = t.z - b.z, d = Math.hypot(dx, dz) || 1, cx = t.x + dx / d * B.beyond, cz = t.z + dz / d * B.beyond;
    bumpAt_.length = 0;
    for (let k = 0; k < 420; k++) {
      const a = rnd() * 6.2832, r = Math.sqrt(rnd()) * B.reach, x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r;
      if (mask.at(x, z, bm).cover < 0.5 || bm.under > B.high) continue;
      bumpAt_.push({ x, z, under: bm.under, w: Math.hypot(x - cx, z - cz) + 0.5 * bm.under });
    }
    bumpAt_.sort((p, q) => p.w - q.w);
    let n = 0;
    for (let i = 0, places = Math.min(bumpAt_.length, Math.ceil(B.count / B.each)); i < places; i++) { const p = bumpAt_[i]; n += clump(p.x, p.z, 0.8 * p.under, p.under, B.each, 0.9, B.over, 0, 3); }
    return n;
  };
  if (shared.wood && shared.wood.onBump) shared.wood.onBump((tree) => { api.bumps++; bump(tree); });
  /** Bump the avenue tree nearest (x, z) by hand (the staging, or a picture): its crown shakes for 3 s and lets sixty go. */
  const bumpAt = (x, z) => {
    let best = null, bd = 1e9;
    for (const t of plan.trees.trees) { const d = Math.hypot(t.x - x, t.z - z); if (d < bd) { bd = d; best = t; } }
    if (!best) return null;
    if (shared.blossom && shared.blossom.shake) shared.blossom.shake(best.x, best.z, { seconds: 3, amount: 0.07 });
    bump(best);
    return best;
  };

  // ---------------------------------------------------------------------------------------------- the evening air
  // Once, at s 70 (the staging's cue): a front of air comes down the avenue from the west at 6 m/s. Every crown it
  // passes stirs three times as much for about four seconds (shared.blossom.front moves wood and blossom together), and
  // lets a line of petals go as it arrives. The air itself carries nothing: the petals only fall.
  //   THE LINE OF PETALS is let go place by place, each in the second the front reaches it: (a) every tree of the two
  //   rows either side of the lane lets a puff go from under its crown; (b) the oldest tree's skirt, where it hangs over
  //   the way in (the front crosses it first: a veil comes down before the mouth of the vault and round the lamp, 30 m
  //   ahead of a boat at s 70, where it is seen against the dark under the crown); (c) over the lane itself a thin line
  //   from the height of the crowns' shoulders (the air carries a petal metres: without it the line had a gap 9 m wide
  //   exactly where the rider is). WHERE IT IS THICKEST: the boat and the front close at 8 m/s, and a petal is five to
  //   fifteen seconds coming down: what the rider sails through as it reaches the water was let go 8 to 33 m ahead of
  //   where the boat was when the air set out. That stretch has the whole of it; nearer, further and behind, less.
  //   (The first holder strewed 5,000 evenly, each petal at the front's own time: more petals in the air afterwards, no
  //   line seen coming. The second: 2,800 in puffs from the trees alone: beside the boat the fall doubled for six seconds
  //   and nobody could have said that anything had passed. Pictures: the log.)
  const airNow = { on: false, t0: 0, z0: 0, z1: 0, speed: 6, more: 2, depth: 12, petals: 0, from: 0, to: 0 };
  const inAvenue = (ps) => (ps > 27 && ps < FALL.pond[0]) || (ps > FALL.pond[1] && ps < wallS - 2);
  const eveningAir = (o = {}) => {
    const A = FALL.air, s = o.at ?? here.s, from = o.from ?? s + A.ahead, to = o.to ?? s - A.behind, speed = o.speed ?? A.speed;
    // (the front's line is a line of the realm's z, which is the avenue's own cross line as far as the bend at s 172)
    airNow.on = true; airNow.t0 = ctx.time; airNow.z0 = -from; airNow.z1 = -to; airNow.speed = speed; airNow.more = (o.more ?? A.more) * (calm ? 0.5 : 1); airNow.depth = o.depth ?? A.depth; airNow.from = from; airNow.to = to;
    const lo = Math.min(from, to), hi = Math.max(from, to), k = (o.petals ?? A.petals) / A.petals, when = (ps) => Math.abs(from - ps) / speed;
    const part = (ps) => { const ahead = (ps - s) * Math.sign(from - to); return (ahead < -2 ? A.back : ahead >= A.full[0] && ahead <= A.full[1] ? 1 : A.far) * k; };
    let n = 0;
    // (a) crown by crown
    for (const t of plan.trees.trees) {
      const ad = Math.abs(t.d);
      if (t.s < lo || t.s > hi || ad > A.reach) continue;
      n += petals.burst({ disc: { x: t.x, z: t.z, r: A.crown }, mask: true, from: A.from, count: Math.round((ad < 14 ? A.puff[0] : A.puff[1]) * part(t.s)), over: A.over, delay: when(t.s) });
    }
    // (b) the oldest tree's skirt, over the way
    const K = A.skirt, m = {}, tr = plan.tree.at, reachT = FALL.greatRadius;
    for (let ps = Math.max(lo, tr[0] - reachT); ps <= Math.min(hi, tr[0] + reachT); ps += K.step) for (let d = -K.half; d <= K.half; d += K.step) {
      const q = F.at(ps + (rnd() - 0.5) * K.step, d + (rnd() - 0.5) * K.step), x = q.x, z = q.z, off = Math.hypot(x - treeAt.x, z - treeAt.z);
      if (off > reachT || off < 7.5 || mask.at(x, z, m).cover < 0.5) continue;
      const c = clamp(m.under, 2.5, K.cap);
      n += clump(x, z, K.from[0] * c, K.from[1] * c, Math.round(K.each[Math.abs(d) <= K.mid ? 0 : 1] * part(ps)), K.across, A.over, when(ps) + 0.4 * rnd(), 3);
    }
    // (c) over the lane itself
    const Ln = A.lane;
    for (let ps = hi; ps >= lo; ps -= Ln.step) {
      if (!inAvenue(ps)) continue;
      const a = F.at(ps, -Ln.half), ax = a.x, az = a.z, b = F.at(ps, Ln.half);
      n += petals.burst({ line: [[ax, Ln.y, az], [b.x, Ln.y, b.z]], radius: Ln.step * 0.55, height: Ln.height, count: Math.round(Ln.each * part(ps)), over: 1.6, delay: when(ps) });
    }
    airNow.petals = n;
    return Math.abs(from - to) / speed;                              // seconds it takes to pass
  };
  const runAir = () => {
    if (!airNow.on || !shared.blossom || !shared.blossom.front) return;
    const t = ctx.time - airNow.t0, T = (airNow.z1 - airNow.z0) / airNow.speed, z = airNow.z0 + airNow.speed * t;
    if (t >= T + 1.5) { shared.blossom.front(z, airNow.depth, 0); airNow.on = false; return; }
    // (it comes out of the still air and goes back into it: never a line switched on)
    shared.blossom.front(z, airNow.depth, airNow.more * smooth(0, 1.5, t) * (1 - smooth(T - 0.5, T + 1.5, t)));
  };

  // ---------------------------------------------------------------------------------------------- on the foredeck
  const deck = await makeDeck(ctx, plan, shared, { mask, petals, great, here, wallS, treeAt }).catch((err) => { console.error('INVALID_DECK orchard/cast_falls: the petals on the foredeck were left out: ' + ((err && err.stack) || err)); return null; });
  if (deck && Q.has('fdeck')) deck.settle(num('fdeck', 30));

  // ---------------------------------------------------------------------------------------------- for the staging
  Object.assign(api, {
    /** The petals that have landed and lie on the water round the boat: the family's handle (docs/life/falls.md, makeFloaters: `cover` 0..1 thins them, `add(x, z)` puts one down), with `kept` (how many have been laid so far), or null. */
    afloat: lying,
    /** The petals lying on the rider's foredeck: { count, limit, settle(n), clear() } (null if the boat's model could not be read). */
    deck,
    /** The family's own handle for the petals in the air (docs/life/falls.md): burst, landings, wind, uniforms. */
    petals, mask,
    greatFall, bump: bumpAt, eveningAir,
    /** Where the evening air is while it runs (for whoever shivers the water or leans the midges under it): `on`; `s`, the page's s of its line now; `speed` (m/s, toward lower s); `depth` (m); reaches(s): seconds until the line is at that s (below zero: it has passed). */
    air: { get on() { return airNow.on; }, get s() { return airNow.from + Math.sign(airNow.to - airNow.from) * airNow.speed * (ctx.time - airNow.t0); }, get speed() { return airNow.speed; }, get depth() { return airNow.depth; },
      reaches: (ps) => Math.abs(airNow.from - ps) / airNow.speed - (ctx.time - airNow.t0) },
    /** The world after the great fall, for a boat set down beyond the roost (the cue's `settle`): the foredeck white. (The pond's cover and the lamp's stroke are set.js's: shared.skin.set, shared.lampStroke.) */
    greatFallSettled: () => { if (deck) deck.settle(FALL.deck.max); },
  });
  /** How many of the ordinary fall are out, 0..1 (the tide thins it to a quarter: stage.tween(shared.cast.falls, 'density', 0.25, 1.5)). */
  Object.defineProperty(api, 'density', { enumerable: true, get: () => petals.density, set: (v) => { petals.density = v; } });
  cast.falls = api;

  // ---------------------------------------------------------------------------------------------- developer's switches
  const due = (k) => (Q.has(k) ? Math.max(0.05, num(k, 0.5)) : -1);
  const dev = { great: due('fgreat'), air: due('fair'), bump: due('fbump'), pin: num('fpin', 0), pinAt: 6 };
  // (developer) &fdebug=<seconds>: what the module made and what it has done by then, to .shots/orchard_fa_debug.json
  let debugAt = Q.has('fdebug') ? Math.max(0.2, num('fdebug', 1)) : -1;
  const writeDebug = () => {
    const hist = {}, near = [];
    let covered = 0, all = 0;
    for (let i = 0; i < 4000; i++) {
      const a = rnd() * 6.2832, r = Math.sqrt(rnd()) * FALL.greatRadius, x = treeAt.x + Math.cos(a) * r, z = treeAt.z + Math.sin(a) * r;
      mask.at(x, z, m0); all++;
      if (m0.cover > 0.5) { covered++; const b = Math.floor(m0.under / 2) * 2; hist[b] = (hist[b] || 0) + 1; }
    }
    for (let s = 30; s <= 210; s += 20) for (const d of [0, 3, 6, 9]) { const p = F.at(s, d); mask.at(p.x, p.z, m0); near.push([s, d, +m0.cover.toFixed(2), +m0.under.toFixed(1)]); }
    let lane = 0, laneAll = 0;                                    // how much of the open lane the drift really comes down over
    for (let i = 0; i < 6000; i++) { const p = F.at(32 + rnd() * 50, (rnd() - 0.5) * 7); mask.at(p.x, p.z, m0); laneAll++; if (m0.cover > 0.5) lane++; }
    // (for checking the others' rows: the labels nearest the boat, in the page's frame, with their height)
    const labels = [], lb = {};
    if (shared.made && shared.made.labelAt) for (const q of shared.made.labelAt) { plan.locate(q.x, q.z, lb); labels.push([+Math.hypot(q.x - ctx.boat.x, q.z - ctx.boat.z).toFixed(1), +lb.s.toFixed(1), +lb.d.toFixed(1), +q.y.toFixed(2)]); }
    labels.sort((a, b) => a[0] - b[0]);
    // (the canopy map round the avenue tree nearest the boat, 0.75 m to a cell, rows from 3.75 m before it to 3.75 m beyond along the page's s, columns across: where its blossom hangs, and how high its underside is)
    const roundTree = [];
    { let best = null, bd = 1e9; for (const t of plan.trees.trees) { const d = Math.hypot(t.x - ctx.boat.x, t.z - ctx.boat.z); if (d < bd) { bd = d; best = t; } }
      if (best) for (let i = -5; i <= 5; i++) { const row = []; for (let j = -5; j <= 5; j++) { const p = F.at(best.s + i * 0.75, best.d + j * 0.75); mask.at(p.x, p.z, m0); row.push(m0.cover > 0.5 ? +m0.under.toFixed(1) : 0); } roundTree.push(row); } }
    const was = api.density; api.density = 0.37; const densityIsLive = Math.abs(petals.density - 0.37) < 1e-6; api.density = was;
    fetch('/__shot/orchard_fa_debug.json', { method: 'POST', body: JSON.stringify({ at: +ctx.time.toFixed(1), landed: api.landed, rings: api.rings, ticks: api.ticks, bumps: api.bumps, onDeck: deck ? deck.count : 0, labelsNear: labels.slice(0, 4), airPetals: airNow.petals, poolHead: pool.head, poolUntil: +pool.until.toFixed(1), lying: lying ? lying.kept : 0, strewn: lying ? lying.strewn : 0, lyingRoom: lying ? lying.pool : 0, deckRate: deck ? +deck.rate.toFixed(3) : 0, drawn: geo ? geo.instanceCount : 0,
      densityIsLive, deckSpots: deck ? deck.spots : 0, crowns: crowns.length, roundTree, mask: [mask.width, mask.height, [mask.rect.x, mask.rect.y, mask.rect.z, mask.rect.w].map((v) => +v.toFixed(1))],
      field: petals.count, pool: petals.pool, driftOverTheLane: +(lane / laneAll).toFixed(3), underTheTree: { covered: +(covered / all).toFixed(3), underHistogram: hist }, alongTheLane: near }, null, 1) }).catch(() => {});
  };

  return {
    update(dt) {
      duskOnPetals();
      runAir();
      runGreat();
      trimPool();
      if (deck) deck.update(dt);
      if (lying) lying.strew();
      if (debugAt >= 0 && ctx.time >= debugAt) { debugAt = -1; writeDebug(); }
      const t = ctx.time;
      if (dev.great >= 0 && t >= dev.great) { dev.great = -1; greatFall(); }
      if (dev.air >= 0 && t >= dev.air) { dev.air = -1; eveningAir(Q.has('fairmore') ? { more: num('fairmore', 2) } : {}); }      // (&fairmore=0: the line of petals with no more sway than usual, to see it by itself)
      if (dev.bump >= 0 && t >= dev.bump) { dev.bump = -1; bumpAt(ctx.boat.x, ctx.boat.z); }
      // (developer) &fpin=<strength>: a pin ring of that strength 3.6 m ahead of the boat and to its left, every 1.5 s: how strong must a landing's ring be to be seen?
      if (dev.pin > 0 && t >= dev.pinAt) { dev.pinAt = t + 1.5; const h = ctx.boat.heading; ctx.water.ripple(ctx.boat.x - Math.sin(h) * 3 - Math.cos(h) * 2, ctx.boat.z - Math.cos(h) * 3 + Math.sin(h) * 2, dev.pin, FALL.ring[2]); }
    },
  };
}

// ------------------------------------------------------------------------------------------------ PETALS THAT HAVE LANDED
// A petal that reaches the water near the boat stays on it (the family's `settle`): a real petal, lying where it was
// seen to land and the way the card lay. It rides the rings (its own first), is shouldered aside by the bow and closes
// in behind the stern, and where something opens the water's trace (the hull's lane, a carp's sip, the stag) it goes
// with the sheet's own petals. After `landed` seconds it has soaked and gone, grown small first.
//   WHICH STAY. About a hundred petals a second land within 12 m of a boat in the avenues. The ones that stay are those
//   beside the boat (all within `near` metres, thinning to `round`) and those that come down on the water the bow is
//   about to cross, so that there are single real petals for the bow to part. None is ever taken away before its time
//   to make room: when all of them are lying, the next landing leaves nothing.
//   COLOUR. Nothing is measured from pictures. Every time it is drawn, the family's three numbers of light are set from
//   the uniforms of set.js's own sheet of petals (shared.skin.mesh), so that a landed petal is shown exactly as the
//   sheet shows a petal that lies alone (its uPale, which follows the hour; a lamp's light at the sheet's own share).
//   The picture handed to the family is not the sheet's: it only says how light each one is (no petal is quite its
//   neighbour's tone; one in four has begun to go the wet lilac of the drifts; a few lie on their faces).
function makeLying(ctx, plan, shared, o) {
  const { THREE } = ctx, LY = FALL.lying, want = num('fafloat', 1);
  if (!(want > 0)) return null;
  const SK = shared.skin && shared.skin.mesh && shared.skin.mesh.material ? shared.skin.mesh.material.uniforms : null;
  const pale0 = SK && SK.uPale ? SK.uPale.value : new THREE.Color('#d0cee2'), tint0 = SK && SK.uTint ? SK.uTint.value : new THREE.Color('#7c7ea0');
  const lil = SK && SK.uLilac ? SK.uLilac.value : new THREE.Vector3(0.86, 0.82, 1), pink = SK && SK.uPink ? SK.uPink.value : new THREE.Vector3(1, 0.88, 0.94);
  // (what a petal of a drift is to a petal lying alone, by the sheet's own numbers)
  const wet = [tint0.r * lil.x / Math.max(pale0.r, 0.01), tint0.g * lil.y / Math.max(pale0.g, 0.01), tint0.b * lil.z / Math.max(pale0.b, 0.01)];
  const n = 32, px = new Uint8Array(n * n * 4), rp = ctx.rng(733);
  for (let i = 0; i < n * n; i++) {
    const r = rp(), v = 0.78 + 0.2 * rp(), k = r < 0.45 ? 0 : r < 0.92 ? 0.3 + 0.5 * rp() : -1;
    for (let c = 0; c < 3; c++) px[i * 4 + c] = Math.round(255 * clamp(v * (k < 0 ? [pink.x, pink.y, pink.z][c] : 1 + (wet[c] - 1) * k), 0, 1));
    px[i * 4 + 3] = 255;
  }
  const tile = new THREE.DataTexture(px, n, n, THREE.RGBAFormat); tile.colorSpace = THREE.NoColorSpace; tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.needsUpdate = true;
  ctx.onDispose(() => tile.dispose());
  const flo = makeFloaters(ctx, { kind: 'petal', pool: want > 1 ? want : LY.pool, landed: LY.landed, size: LY.size, lift: LY.lift, rafts: 0, close: plan.water.lane.close, skin: { map: tile, scale: LY.patch }, seed: 9127 });
  const mesh = flo.object, FU = flo.uniforms, N = flo.pool;
  if (!N) return null;
  // (a petal lying 8 m off is a sliver a pixel high: it keeps out of the painter's filter as the falling card it was did.
  // The family leaves `crisp` off whenever it is given a `skin`: asked of the toolkit, in the log)
  mesh.material.defines = { ...(mesh.material.defines || {}), CRISP: '' }; mesh.material.needsUpdate = true;
  mesh.name = 'falls: petals that have landed';
  const own = new THREE.Color(), pale = new THREE.Color(), was = mesh.onBeforeRender;
  mesh.onBeforeRender = function (...args) {
    if (SK && SK.uOwn && SK.uLampOn && SK.uPale) { own.copy(SK.uOwn.value).multiplyScalar(SK.uLampOn.value); pale.copy(SK.uPale.value); }
    else { own.setRGB(0.1, 0.1, 0.1); pale.set('#d0cee2'); if (shared.dusk && shared.dusk.uniforms && shared.dusk.uniforms.uAir) pale.multiply(shared.dusk.uniforms.uAir.value); }
    // the family's rule: colour = picture x tone x (paint + lamps + 0.048)  ->  picture x (the sheet's pale + the sheet's share of the lamps)
    FU.uFloTone.value.copy(own);
    FU.uFloPaint.value.setRGB(pale.r / own.r - 0.048, pale.g / own.g - 0.048, pale.b / own.b - 0.048);
    FU.uFloGlance.value.w = 1e-4;                                  // (nothing of the mirror: the sheet's petals take none near the boat)
    if (was) was.apply(this, args);
  };
  // ---- which landings stay
  const times = new Float64Array(N).fill(-1e9), loc = {}, isletR = (plan.tree.islet ? plan.tree.islet.across / 2 : 6.5) - 0.3;
  const share = N / Math.max(1, want > 1 ? want : LY.pool);        // (low quality and reduced motion thin the ring: the rates go with it)
  let head = 0, at = -1e9, used = 0, beside = 3, before = 2;
  flo.kept = 0; flo.strewn = 0;
  // one more petal lies on the water at (x, z), if there is room for it and water there
  const put = (x, z, turn, when) => {
    const now = ctx.time;
    if (now - times[head] < LY.landed) return false;               // (every one of them is lying: this one leaves nothing)
    if (Math.hypot(x - o.treeAt.x, z - o.treeAt.z) < isletR) return false;                                 // (the islet is ground)
    plan.locate(x, z, loc);
    if (loc.s < 27 || Math.abs(loc.d) > plan.halfWidth(loc.s) + 1) return false;                           // (nothing lies inside the loft, or out in the standing growth)
    times[head] = now; head = (head + 1) % N;
    if (used < N) { used++; mesh.geometry.instanceCount = Math.max(1, used); }       // (the ring is not drawn beyond what has been used)
    flo.add(x, z, { turn });
    return true;
  };
  flo.gate = { add(x, z, p) {
    const now = ctx.time, b = ctx.boat, dx = x - b.x, dz = z - b.z, d = Math.hypot(dx, dz);
    const fx = -Math.sin(b.heading), fz = -Math.cos(b.heading), al = dx * fx + dz * fz, la = Math.abs(dx * fz - dz * fx);
    const near = 1 - smooth(LY.near, LY.round, d), way = al > 1.5 ? (1 - smooth(LY.lane, LY.lane + 1.6, la)) * (1 - smooth(LY.ahead - 2.5, LY.ahead, al)) : 0;
    if (near < 0.03 && way < 0.03) return;
    const more = share * (o.boost ? o.boost() : 1), dt = Math.max(0, now - at); at = now;
    beside = Math.min(LY.beside * more * 0.6 + 2, beside + dt * LY.beside * more); before = Math.min(LY.before * more * 0.6 + 2, before + dt * LY.before * more);
    // (the nearest first, while any are left; one in the bow's way has a share of its own)
    const mine = way > near && before >= 1 + 3 * (1 - way) ? 1 : beside >= 1 + 5 * (1 - near) && near >= 0.03 ? 0 : -1;
    if (mine < 0 || !put(x, z, p ? p.turn : undefined)) return;
    if (mine) before -= 1; else beside -= 1;
    flo.kept++;
  } };
  // ---- and in the bow's way. The lane ahead of a boat is always half healed (the page): single petals have drifted
  // back into it. So the water the boat is making for is strewn with single real petals, thinly, far enough ahead that
  // one is laid unseen (a sliver under a pixel high), thicker where set.js's standing map says a drift lies: these are
  // what the bow is seen to part. By how far the boat has come, never by the clock: a boat lying still strews nothing.
  const ST = LY.strew, cov = shared.skin && shared.skin.cover && shared.skin.cover.image && shared.skin.cover.image.data ? shared.skin.cover.image : null, R = SK && SK.uRect ? SK.uRect.value : null;
  const thick = (x, z) => {                                        // how thick the sheet's petals lie there, 0..1 (set.js's standing map, read as its shader reads it)
    if (!cov || !R) return 0.3;
    const i = Math.floor(((x - R.x) / R.z + 0.5) * cov.width), j = Math.floor(((z - R.y) / R.w + 0.5) * cov.height);
    return i < 0 || j < 0 || i >= cov.width || j >= cov.height ? 0 : cov.data[(j * cov.width + i) * 4] / 255;
  };
  const rs = ctx.rng(4421), was2 = { x: 0, z: 0, set: false };
  let owed = 0;
  const lay = (al0, al1, n) => {
    const b = ctx.boat, sp = Math.hypot(b.vx || 0, b.vz || 0), fx = sp > 0.4 ? b.vx / sp : -Math.sin(b.heading), fz = sp > 0.4 ? b.vz / sp : -Math.cos(b.heading);
    for (let k = 0; k < n; k++) {
      const al = al0 + (al1 - al0) * rs(), la = (rs() + rs() - 1) * ST.wide, x = b.x + fx * al - fz * la, z = b.z + fz * al + fx * la;
      if (rs() * ST.drift > ST.open + (ST.drift - ST.open) * smooth(0.25, 0.8, thick(x, z))) continue;
      if (put(x, z, rs() * 6.2832)) flo.strewn++;
    }
  };
  flo.strew = () => {
    const b = ctx.boat, per = ST.drift * 2 * ST.wide * 0.5 * share;     // petals to a metre of the way, at the thickest (a strip `wide` either side, thinning to its edges)
    if (!was2.set) { was2.set = true; was2.x = b.x; was2.z = b.z; lay(2.6, ST.far[1], Math.round(per * (ST.far[1] - 2.6))); return; }      // (a boat set down part-way has its way strewn already)
    const step = Math.hypot(b.x - was2.x, b.z - was2.z); was2.x = b.x; was2.z = b.z;
    if (step > 2.5) return;
    owed += step * per;
    if (owed >= 1) { const n = Math.floor(owed); owed -= n; lay(ST.far[0], ST.far[1], n); }
  };
  mesh.geometry.instanceCount = 1;
  return flo;
}

// ------------------------------------------------------------------------------------------------ PETALS ON THE FOREDECK
// The family does not leave anything lying on the boat (docs/life/falls.md, "Not provided"), so this is the area's own:
// sixty petals at most, lying on the rider's own foredeck and riding it (the mesh is a child of the boat's model, so it
// pitches and bobs with the hull, and it is taken off again when the area is thrown away).
//   WHERE THEY LIE is read from the boat's own triangles, never from numbers: a picture of the bow from straight above
//   (the highest surface in every 12 mm cell, and which of the boat's colour families it is) gives the foredeck's
//   planks, the breasthook and the coiled painter; a petal rests ON whatever is under it (a plane fitted to the cells
//   under its own footprint, raised until it clears them all), tipped as the deck is tipped.
//   HOW THEY COME is not the family's landings (those are found where a petal reaches the WATER, a second after it
//   passed the deck's height, by which time a boat under way has moved two metres on): the fall that is in the air over
//   the bow sets how fast they settle (under blossom, under open sky, in the great fall), and each one is seen to come
//   down its last half metre, straight down in the world's air, so that on a boat under way it comes in from ahead.
//   HOW THEY GO: above 4 m/s over the ground the boat's own wind takes them, one by one, over the side; and beyond the
//   wall, where the current quickens into the mist, the last of them go, so that the next area is entered with a clean deck.
async function makeDeck(ctx, plan, shared, o) {
  const { THREE, engine } = ctx, D = FALL.deck, boat = ctx.boat;
  const model0 = engine.boat && engine.boat.model;
  if (!model0 || !model0.ready) return null;
  await Promise.race([model0.ready, new Promise((r) => setTimeout(r, 5000))]);
  const body = model0.group.children.find((c) => c.name === 'boat-body');
  if (!body || !body.geometry || !body.geometry.attributes.position) return null;

  // ---- the bow from straight above
  const G = body.geometry, P = G.attributes.position, UV = G.attributes.uv, IX = G.index;
  const cell = 0.0125, x0 = -0.5, z0 = -2.46, W = 80, H = 62, hf = new Float32Array(W * H).fill(-9), fam = new Int8Array(W * H).fill(-1);
  const nTri = IX ? IX.count / 3 : P.count / 3, A = [0, 0, 0], B = [0, 0, 0], C = [0, 0, 0];
  for (let t = 0; t < nTri; t++) {
    const ia = IX ? IX.getX(t * 3) : t * 3, ib = IX ? IX.getX(t * 3 + 1) : t * 3 + 1, ic = IX ? IX.getX(t * 3 + 2) : t * 3 + 2;
    A[2] = P.getZ(ia); B[2] = P.getZ(ib); C[2] = P.getZ(ic);
    const zmin = Math.min(A[2], B[2], C[2]), zmax = Math.max(A[2], B[2], C[2]);
    if (zmin > z0 + H * cell || zmax < z0) continue;
    A[1] = P.getY(ia); B[1] = P.getY(ib); C[1] = P.getY(ic);
    if (Math.max(A[1], B[1], C[1]) < 0.3) continue;
    A[0] = P.getX(ia); B[0] = P.getX(ib); C[0] = P.getX(ic);
    const den = (B[2] - C[2]) * (A[0] - C[0]) + (C[0] - B[0]) * (A[2] - C[2]);
    if (Math.abs(den) < 1e-12) continue;
    const i0 = Math.max(0, Math.floor((Math.min(A[0], B[0], C[0]) - x0) / cell)), i1 = Math.min(W - 1, Math.floor((Math.max(A[0], B[0], C[0]) - x0) / cell));
    const j0 = Math.max(0, Math.floor((zmin - z0) / cell)), j1 = Math.min(H - 1, Math.floor((zmax - z0) / cell)), f = UV ? Math.round(UV.getX(ia)) : 6;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const xc = x0 + (i + 0.5) * cell, zc = z0 + (j + 0.5) * cell;
      const l1 = ((B[2] - C[2]) * (xc - C[0]) + (C[0] - B[0]) * (zc - C[2])) / den, l2 = ((C[2] - A[2]) * (xc - C[0]) + (A[0] - C[0]) * (zc - C[2])) / den, l3 = 1 - l1 - l2;
      if (l1 < -1e-3 || l2 < -1e-3 || l3 < -1e-3) continue;
      const y = l1 * A[1] + l2 * B[1] + l3 * C[1], q = j * W + i;
      if (y > hf[q]) { hf[q] = y; fam[q] = f; }
    }
  }
  // ---- places to lie. Families (boat-hero.js): 4 rim (the breasthook), 6 thwart (the foredeck's planks), 9 rope (the
  // painter coiled down on it). The planks first, so that the first petals lie where a petal would be looked for
  const rnd = ctx.rng(60606), spots = [], R = 2;
  const tryAt = (i, j, planksOnly) => {
    const q = j * W + i, f = fam[q];
    if (!(f === 6 || (!planksOnly && (f === 4 || f === 9)))) return;
    // a plane through the cells under its footprint (least squares), raised until it clears every one of them
    let n = 0, sx = 0, sz = 0, sy = 0, sxx = 0, szz = 0, sxz = 0, sxy = 0, szy = 0;
    for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
      if (Math.abs(di) + Math.abs(dj) > 3) continue;
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= W || jj >= H) return;
      const h = hf[jj * W + ii];
      if (h < 0.3) return;                                               // (it would hang over an edge)
      const x = di * cell, z = dj * cell;
      n++; sx += x; sz += z; sy += h; sxx += x * x; szz += z * z; sxz += x * z; sxy += x * h; szy += z * h;
    }
    const mx = sx / n, mz = sz / n, my = sy / n, cxx = sxx / n - mx * mx, czz = szz / n - mz * mz, cxz = sxz / n - mx * mz, cxy = sxy / n - mx * my, czy = szy / n - mz * my, det = cxx * czz - cxz * cxz;
    if (Math.abs(det) < 1e-14) return;
    const bx = (cxy * czz - czy * cxz) / det, bz = (czy * cxx - cxy * cxz) / det, a = my - bx * mx - bz * mz;
    if (Math.abs(bx) > 0.45 || Math.abs(bz) > 0.45) return;             // (too steep to lie on)
    let over = 0, under = 0;
    for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
      if (Math.abs(di) + Math.abs(dj) > 3) continue;
      const res = hf[(j + dj) * W + i + di] - (a + bx * di * cell + bz * dj * cell);
      over = Math.max(over, res); under = Math.min(under, res);
    }
    if (over - under > 0.03) return;                                     // (across a step: it would stand on one corner)
    const x = x0 + (i + 0.5) * cell, z = z0 + (j + 0.5) * cell;
    for (const sp of spots) if (Math.hypot(sp.x - x, sp.z - z) < 0.03) return;       // (they may overlap, but not lie one on another)
    const l = Math.hypot(bx, 1, bz);
    spots.push({ x, y: a + over + 0.002, z, nx: -bx / l, ny: 1 / l, nz: -bz / l });
  };
  for (let k = 0; k < 2600 && spots.length < Math.round(D.max * 0.7); k++) tryAt(Math.floor(rnd() * W), Math.floor(rnd() * H), true);
  for (let k = 0; k < 2600 && spots.length < D.max; k++) tryAt(Math.floor(rnd() * W), Math.floor(rnd() * H), false);
  const N = spots.length;
  if (N < 8) return null;

  // ---- the petals: the family's own floating petal (six triangles, cupped, hollow side up), in the area's paint
  const base = cardGeometry('kite'), geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index; for (const name of ['position', 'normal', 'color']) geo.setAttribute(name, base.attributes[name]);
  const aSpot = new Float32Array(N * 4), aNrm = new Float32Array(N * 3), aLife = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { const sp = spots[i]; aSpot.set([sp.x, sp.y, sp.z, rnd() * 6.2832], i * 4); aNrm.set([sp.nx, sp.ny, sp.nz], i * 3); aLife.set([1e9, 1e9, rnd(), D.size * (0.85 + 0.3 * rnd())], i * 4); }
  const lifeAttr = new THREE.InstancedBufferAttribute(aLife, 4); lifeAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aSpot', new THREE.InstancedBufferAttribute(aSpot, 4)); geo.setAttribute('aNrm', new THREE.InstancedBufferAttribute(aNrm, 3)); geo.setAttribute('aLife', lifeAttr);
  geo.instanceCount = N;
  const U = { uDeckNow: { value: 0 }, uDeckVel: { value: new THREE.Vector3() }, uDeckShow: { value: 1 },
    uDeckIn: { value: ['#F4E6E3', '#F6ECE8', '#EFDDE0'].map((c) => new THREE.Color(c)) }, uDeckOut: { value: new THREE.Color('#E8BCC1') }, ...glareUniforms(ctx, D.glare) };
  const ext = {
    uniforms: U,
    vertexPars: /* glsl */`
      attribute vec4 aSpot, aLife; attribute vec3 aNrm;
      uniform float uDeckNow, uDeckShow; uniform vec3 uDeckVel, uDeckIn[3];
      varying vec3 vDeckIn;`,
    vertexLocal: /* glsl */`
      float dSeed = aLife.z;
      float dTo = aLife.x - uDeckNow;                    // seconds until it touches down (below zero: it lies there)
      float dGo = max(uDeckNow - aLife.y, 0.0);          // seconds since the boat's own wind took it
      float dAir = clamp(dTo, 0.0, 0.9);
      // it comes out of the air as the family's petals do, and is gone again when it has gone over the side
      float dLive = step(dTo, 0.9) * (1.0 - smoothstep(0.62, 0.9, dTo)) * (1.0 - smoothstep(0.55, 0.95, dGo)) * uDeckShow;
      // the last of its fall: straight down in the world's air at a petal's speed, so in the boat's own frame it comes in
      // from the way the boat is going; rocking like a dish, less and less, and flat as it touches
      vec3 dOff = uDeckVel * dAir + vec3(0.0, 0.5 * dAir, 0.0);
      float dTilt = 0.7 * sin(dAir * 6.5 + dSeed * 30.0) * smoothstep(0.0, 0.4, dAir);
      float dYaw = aSpot.w + dAir * 2.2 * (dSeed < 0.5 ? -1.0 : 1.0);
      // going: lifted, turned over and carried out over the nearer side and astern
      float dSide = aSpot.x + (dSeed - 0.5) * 0.3 < 0.0 ? -1.0 : 1.0;
      dOff += vec3(dSide * 0.9, 0.0, 0.55) * (1.5 * dGo * dGo) + vec3(0.0, 0.3 * dGo - 0.35 * dGo * dGo, 0.0);
      dTilt += 7.0 * dGo * (dSeed < 0.5 ? -1.0 : 1.0); dYaw += 3.0 * dGo;
      float dc = cos(dYaw), ds = sin(dYaw), dtc = cos(dTilt), dts = sin(dTilt);
      vec3 dP = vec3(dc * position.x + ds * position.z, position.y, -ds * position.x + dc * position.z);
      dP = vec3(dP.x, dtc * dP.y - dts * dP.z, dts * dP.y + dtc * dP.z);
      vec3 dN = vec3(dc * normal.x + ds * normal.z, normal.y, -ds * normal.x + dc * normal.z);
      dN = vec3(dN.x, dtc * dN.y - dts * dN.z, dts * dN.y + dtc * dN.z);
      // lying as the deck lies under it
      vec3 du = normalize(mix(vec3(0.0, 1.0, 0.0), aNrm, 1.0 - smoothstep(0.0, 0.5, dAir + dGo))), dt_ = normalize(cross(du, vec3(0.0, 0.0, 1.0))), db = cross(dt_, du);
      transformed = aSpot.xyz + dOff + (dt_ * dP.x + du * dP.y + db * dP.z) * (aLife.w * dLive);
      objectNormal = dt_ * dN.x + du * dN.y + db * dN.z;
      vDeckIn = uDeckIn[int(dSeed * 2.999)];`,
    fragmentPars: `varying vec3 vDeckIn; uniform vec3 uDeckOut; ${GLARE_PARS}`,
    albedo: 'albedo *= gl_FrontFacing ? vDeckIn : uDeckOut;',
  };
  // (it lies within a metre of the prow lantern: pale paint there would bloom and go the lamp's own orange. It stays
  // paint, as the family's petals do, and keeps two thirds of the lamp's colour)
  const after = { light: `${GLARE_GLSL}
      c = mix(c, vec3(dot(c, vec3(0.3, 0.55, 0.15))), 0.33);` };
  // (its own colour first, then the hour, then the cap: shared.dusk must see the petal's colour, and the cap must see the lamps)
  const mat = ctx.kit.gouache({ color: '#ffffff', side: THREE.DoubleSide, vertexColors: true, brush: 0.2, shade: 0.7, crisp: true, extend: shared.dusk ? [ext, shared.dusk, after] : [ext, after] });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'falls: petals on the foredeck'; mesh.frustumCulled = false; mesh.layers.set(1);      // (seen by the rider, absent from the mirror, as the boat is)
  // (it is compiled with the area: it stands in the area's own group until the first frame, then rides the boat)
  ctx.add(mesh);
  mesh.onBeforeRender = () => { const show = ctx.active ? 1 : 0; if (U.uDeckShow.value !== show) { U.uDeckShow.value = show; mat.uniformsNeedUpdate = true; } };
  ctx.onDispose(() => { mesh.removeFromParent(); geo.dispose(); mat.dispose(); });

  // ---- which of them lie, come and go
  const state = new Uint8Array(N), freeAt = new Float64Array(N), over = new Float32Array(N);      // 0 free, 1 there, 2 going
  let lying = 0, acc = 0.6, limit = D.ordinary, lastGo = -10, dirty = false, first = true, tNow = 0;
  const m = {}, RATE = num('fdeckrate', 1);                         // (developer) &fdeckrate=6: they settle six times as fast, to watch them come
  const put = (i, tLand) => { state[i] = 1; aLife[i * 4] = tLand; aLife[i * 4 + 1] = 1e9; lying++; dirty = true; };
  const free = () => { const k0 = Math.floor(rnd() * N); for (let k = 0; k < N; k++) { const i = (k0 + k) % N; if (state[i] === 0 && tNow >= freeAt[i]) return i; } return -1; };
  const handle = {
    object: mesh, spots: N, rate: 0,
    /** How many lie there now. */
    get count() { return lying; },
    /** How many the ordinary fall may leave (22); the great fall raises it to all sixty by itself. */
    get limit() { return limit; }, set limit(v) { limit = clamp(Math.round(v), 0, N); },
    /** Put n petals there at once, already lying (a moment already past: a picture taken beyond the roost). */
    settle(n) { for (let k = Math.min(N, Math.round(n)) - lying; k > 0; k--) { const i = free(); if (i < 0) break; put(i, -100); } limit = Math.max(limit, Math.min(N, Math.round(n))); },
    /** Let them all go over the side, one after another. */
    clear() { for (let i = 0; i < N; i++) if (state[i] === 1) over[i] = 1e9; },
    update(dt) {
      tNow = ctx.time;
      const model = engine.boat.model;
      if (model && model.group && mesh.parent !== model.group) { model.group.add(mesh); mesh.position.set(0, 0, 0); mesh.rotation.set(0, 0, 0); }
      const h = boat.heading, ch = Math.cos(h), sh = Math.sin(h), vx = boat.vx || 0, vz = boat.vz || 0, speed = Math.hypot(vx, vz), here = o.here;
      U.uDeckNow.value = tNow; U.uDeckVel.value.set(ch * vx - sh * vz, 0, sh * vx + ch * vz);
      // a boat set down part-way has come under the trees to get there
      if (first) { first = false; handle.settle(Math.min(D.ordinary - 4, Math.max(0, (here.s - 30) * 0.11))); }
      // ---- they settle as fast as the fall that is in the air over the bow
      const inOrchard = here.s > 27 && here.s < o.wallS + 4, bx = boat.x - sh * 2.0, bz = boat.z - ch * 2.0;
      let rate = 0;
      if (inOrchard && speed < D.slide - 0.4) rate = (o.mask.at(bx, bz, m).cover > 0.5 && m.under < 7.5 ? D.under : D.open) * o.petals.density;
      const tg = tNow - o.great.t0;
      if (tg > 1.5 && tg < o.great.len + 5 && Math.hypot(boat.x - o.treeAt.x, boat.z - o.treeAt.z) < o.great.radius + 6) {
        // the great fall lands on the boat as on everything: by its end the foredeck is white
        limit = N; rate += D.great * smooth(1.5, 1.5 + o.great.env[0], tg) * (1 - smooth(o.great.len - 2, o.great.len + 5, tg));
      }
      handle.rate = rate;                                          // (petals a second settling now: for checking)
      acc += rate * dt * RATE;
      while (acc >= 1) { acc -= 1; if (lying < limit) { const i = free(); if (i >= 0) put(i, tNow + 0.9); } }
      // ---- they go: above 4 m/s over the ground, each at its own speed; and beyond the wall, where the current
      // quickens into the mist, the last of them
      const out = smooth(o.wallS + 6, o.wallS + 22, here.s);
      if (tNow - lastGo > 0.16) for (let i = 0; i < N; i++) {
        if (state[i] !== 1 || aLife[i * 4] > tNow) continue;
        const need = (D.slide + 0.9 * aLife[i * 4 + 2]) * (1 - out) + (1.6 + 1.2 * aLife[i * 4 + 2]) * out;
        over[i] = speed > need ? over[i] + 0.16 : Math.min(over[i], 1e8) * 0.5;
        if (over[i] > 0.3) { state[i] = 2; aLife[i * 4 + 1] = tNow; freeAt[i] = tNow + 1.1; over[i] = 0; lying--; dirty = true; lastGo = tNow; break; }
      }
      for (let i = 0; i < N; i++) if (state[i] === 2 && tNow >= freeAt[i]) { state[i] = 0; aLife[i * 4] = 1e9; aLife[i * 4 + 1] = 1e9; dirty = true; }
      if (dirty) { dirty = false; lifeAttr.needsUpdate = true; }
    },
  };
  return handle;
}
