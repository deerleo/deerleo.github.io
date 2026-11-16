// The town below: the cast, group "Deep" (stage 3): the old carp and the lantern-jellies.
// docs/build/town/3-cast-deep.md is this module's log; docs/art/town.md, section 5, is its brief (the rows "The old
// carp" and "Lantern-jellies", and "Anatomy"); docs/life/swimmers.md and docs/life/lights.md are the two families.
//
//   the old carp   one wild carp, 3.2 m, unmarked, its eye a dark bead (makeSwimmer, species 'carp'). It patrols a
//                  closed way of 235 m (plan.deep.carp.patrol): down the square 6.5 m to port of the composed line,
//                  round before the poplars, back behind the tower in front of the terrace's drowned windows, up the
//                  lane between the skiffs and the right bank's houses, one turn in the water at the street's end
//                  before the church (across it from right to left, 9 m down), back down the lane, and across the
//                  composed line to the port side again: 0.6 m/s, a beat in four seconds, long glides with the fans
//                  out (the family's gait). It never faces, follows or waits for the hull: every way lies across the
//                  composed line well ahead of a boat that comes down it, or past it the other way. It wears the
//                  town's light (light.extendFor), so it takes the water's colour, shows its own only in lamplight and
//                  dissolves with distance. On the water: a slow bulge once a tail beat while its back is within a
//                  metre and a half of the surface, and the family's ring for the sip of its rise.
//   the lantern-jellies   comb jellies (makeCombJellies of the lights family): 560 at high quality (300 at medium, 200 at
//                  low). 68 RESIDENTS drift in open water from where the street deepens (s 76) to the church, each tried
//                  against everything that stands in the water and wandering only as far as its own place has room. 106
//                  are THE SQUARE'S OWN: they hang in its open water as residents do, 5 to 16 m down, most of them along
//                  the composed line through its second half, and let go at the stroke with the rest (to the family they
//                  are roosts in mid-water). 386 ROOST round the square in COLONIES (a swarm hanging under its ledge, 2 to
//                  14 together, few and of unequal size, long bare ledge between), at places taken from the set's own
//                  numbers: the tower's two string courses and the feet of its lit slits, the gutter of the market hall's
//                  eaves, the terrace's sill band and the sills of its lit windows, the skirts and open ends of the twelve
//                  stalls (read from the kit's cloth), the ladder bars of the street lamps, the eaves of the houses
//                  beyond the poplars, the lips of the fountain's bowls. Let go (the staging's stroke), each climbs as the
//                  family climbs it, in a spiral of this module's (beside its wall, never into it), slanting toward a place
//                  of its own; there it lies, at a depth of its own under the ceiling, and all but still (0.03 to 0.12
//                  m/s): the places stand evenly over the open water, drawn a little to the middle of the square. They stay
//                  as the family has it, go out of sight as they sink away, and are put back where they hung unseen
//                  (lanterns.home, called here twice a second). THEIR LIGHT: a lantern is light in the water. Its jelly
//                  is filled with a rose-gold light typed far more saturated than it is to be seen (the picture's tone
//                  curve pales a warm light); it throws a soft glow into the water round it (one more draw call a system);
//                  below a few metres it is drawn as its light alone, and comes up out of that into the clear ribbed
//                  animal as it climbs; it writes no depth (a small thing that does is cut apart by this water's bending).
//                  They wear the town's water (laid into the family's finished material from here: it takes no extend),
//                  and swing aside from the carp where it is SEEN. On the water they write nothing (the page).
//
// IN shared.cast AFTER THIS MODULE (nothing here plays a sound or places a cue):
//   carp      the family's handle with this group's own beside it:
//               swim(route, { in, at, speed, from, jump, onDone }), rise(opts), sink(depth, seconds), speedTo(v, seconds),
//               hide(): the family's own (docs/life/swimmers.md)
//               routes     { patrol, under, shallow, turn, stroke }: SwimRoutes laid from plan.deep.carp
//               at, underAt, strokeAt   the routes' points by name (plan.deep.carp), for swim(route, { in, at })
//               go(name, opts)   swim one of the routes and come back to the patrol when it is done. A timed way begins by
//                          putting the fish on it unseen: if it is within 18 m of the hull just then, nothing is done and
//                          carp.skipped names the way (force: true overrides):
//                          'street'  the patrol itself, timed: go('street') has it ten seconds INTO its turn at the
//                                    street's end (the page's s 96: a boat left to the current then has it 12 m off the
//                                    starboard beam, crossing right to left 9 m down); go('street', { in: seconds }) has
//                                    its snout at the START of that turn so many seconds from now
//                          'under'   the pass beside the keel (the page's s 146): it comes UP the square, 4.3 m to port
//                                    and 3 m down, and turns away before the church: go('under') (= { in: 3, at: underAt.ahead })
//                          'stroke'  the rising turn round the shaft, the shallow leg, the avenue: go('stroke', { in, at })
//                          'shallow' the shallow leg and the avenue alone, for a carp that is already up
//               back()     to its patrol now, by a smooth run-in (never a jump)
//               body       an Object3D that rides on its middle WHERE IT IS SEEN (for the fish's threat(), and for
//                          anything that must keep clear of the fish the rider sees); place: { x, y, z, s, d, depth,
//                          speed, heading } now, its TRUE place
//               onTouch    ASSIGN (x, z, kind) => {}: 'sip' (its lips at the surface: the page's `drop`, pitch 0.6,
//                          gain 0.5), 'bulge' (each slow bulge over its back), 'emerge', 'wake', 'submerge' (the family's)
//               onNear     ASSIGN (x, z, info) => {}: once each time it comes within 7 m of the hull (the page's
//                          `breath` with the carp beside the keel); info: { distance, depth, side: -1 port | 1 starboard }
//               near       while it is within 12 m of the hull: { distance, depth, side, abeam, ahead } live; else null
//               limeLift   true: the lime's fry are told to lift (the Fish group's fishes.lift()) each time it passes over their tree
//   lanterns  the family's handle for the SQUARE's system (every roosting one, and the square's residents), with this
//             group's own beside it:
//               tick(T)                the show clock (releases are timed on it); nothing here ticks it
//               release(when, rag), releaseAll(T), hold(), sink(when, rag), positionOf(i, out), nearSurface(depth, fn):
//                                      the family's own (docs/life/lights.md); positionOf and nearSurface give the place
//                                      this module draws them at
//               releaseBehind({ at, speed, rag, from })   the page's letting go: release behind a ring that leaves the
//                                      tower (`from`: [x, z]) at clock time `at` (6) at `speed` (10) m/s, ragged by `rag` (1) s
//               risen(depth)           how many lie shallower than `depth` (2.2 m: all that lie under the surface) now:
//                                      the page's `shimmer` layer follows it
//               home()                 those that have sunk out of sight are put back on their roosts (this module calls it)
//               onStartle              ASSIGN (x, y, z, i) => {}: one has flared and drawn in (the hull, the carp); the
//                                      street's system calls the same function
//               street                 the family's handle for the street's residents (no roosting ones)
//               systems, total, places { residents, free, ledge, roosts (= free then ledge: the square's system, in its order) }, sites, zones, tower [x, z]
//               glow, glowUpdate()     the mesh of the glows in the water round each (this module moves it every frame)
//               rest                   [[x, z], ...] where each roosting one lies when it is up, in the roosts' order
//               level, far             live numbers: level.x the share of the water's swallowing a lantern takes, level.z its light; far.x, far.y the metres over which a far one is gone
//               soft, glowLevel        live: soft.x, soft.y the depths from and to which a lantern is drawn as its light alone, soft.z that light; glowLevel.x the glows' strength, .y their size
//
// Developer switches (address):
//   &dp=carp,lanterns          build only these
//   &dpcam=right,up,back       a crane: the eye moved that many metres from the rider's own (pictures only; up -10: under the water)
//   &dpfrom=<metres>           where on its patrol the carp is when the realm begins
//   &dpabeam=<metres>          put the carp on its patrol abeam of the boat, plus so many metres along (pictures)
//   &dpput=<route>:<metres>    put the carp on one of its routes, so many metres along it, when the realm begins
//   &dpplay=street|under|stroke|shallow|rise|sink   fire a control of the carp's half a second in (&dpin=<seconds>, &dpat=<point>, &dpforce=1)
//   &dpplay=release|sinkback   the lanterns let go behind a ring from the tower (&dpspeed=10 m/s), told to sink (&dpsinkat=20 s on): on a clock of this module's own
//   &dprisen=<seconds>         the lanterns as they lie that many seconds after all were let go
//   &dpmarks=patrol,under,...,roosts,residents   beads along those routes (red: every 5 m; white: the plan's points) and at the lanterns' places
//   &dplog=carp|lanterns|speeds|stalls|arrivals   print where it is, its speed and its beats; the lanterns' counts, how many lie under the surface, how fast they go; what was read of the stalls: every &dpevery=<seconds> (default 4)
//   &dpdump=<name>.json        where every lantern lives and where each roosting one lies when it is up, written to .shots/ (for maps)
//   &dpraw=1                   the families' own look (the town's light and water not laid on; the family's own spiral)
//   &dpall=1                   both lantern systems drawn wherever the boat is
//   &dpdepth=1                 the lanterns write their depth, as the family has them (to compare: see buildLanterns)
//   &dpfull=1                  the family's whole mesh for every lantern always (no plainer mesh while they are deep)
//   numbers: &dpn= (how many lanterns) &dpglow= &dpbody= &dprim= &dprib= &dpshimmer= &dpburn= &dpfar0= &dpfar= &dpbehind= &dpspread= &dplie= &dpturn= &dpwander= &dpmid= &dpshove= &dptoll= &dplevel=
//            &dphalo= (the glows' strength; 0: none) &dphalosize= &dphalocol= &dpcrowd= &dpsoft=<from>,<to> &dpfarlight= &dpfill=
import * as THREE from 'three';
import { makeSwimmer, SwimRoute, seenY } from '../../engine/life/swimmers.js';
import { makeCombJellies } from '../../engine/life/jellies.js';
import { ensureLight } from './light.js';

const Q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const ONLY = (Q.get('dp') || '').split(',').map((v) => v.trim()).filter(Boolean);
const want = (k) => !ONLY.length || ONLY.includes(k);
const num = (k, d) => (Q.has(k) && Q.get(k) !== '' && !Number.isNaN(+Q.get(k)) ? +Q.get(k) : d);
const list = (k) => (Q.get(k) || '').split(',').map((v) => v.trim()).filter(Boolean);
const note = (msg) => console.error('INVALID_ note (cast_deep): ' + msg);
const RAW = Q.has('dpraw');
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const TAU = Math.PI * 2;

// ====================================================================================================== the old carp
// What is laid on the family's material, in this order: the family's own hooks (the bones, the lift toward where the
// eye sees it, the veil), then CARP_BEFORE, then the town's light, then CARP_AFTER.
//   The family takes away what the eye could not see through the surface by mixing the fish's lit colour toward the
// water's own (its veil). The town's light, laid after it, keeps whatever the plain material's sum does not account
// for as "other light" and adds it again under water: a veiled carp near the surface came out black. So the veil is
// taken out again before the town's light (the mix is undone exactly) and put back after it.
//   Out of the water: the town lights whatever stands above the surface from below, warm and strong at the line (a
// wall standing in lit water). A fish's back is not a wall: the light from below does not reach over it. Lit as a wall
// it was an ember lying on the water, the hottest thing in view; it takes half of that light, most of its redness
// taken out: a dark wet shape with a dusky fin.
//   And the fins. The family lets the realm's key light through the webs of the fins from the far side; here the light
// comes from the lamps below, and only where they burn near: the webs take the street's own light as it reaches them.
const CARP_BEFORE = (U) => ({
  uniforms: U,
  fragmentPars: 'uniform vec4 uDpCarp;',
  // (its paint for this water: the town's light falls from the surface on whatever faces up, and a pale fish seen from
  // above came out one light slate from snout to tail, the brightest plain thing in the picture. A fish is dark along
  // its back and pale below: its back is drawn down, by the way its skin faced as it was modelled, so that from above
  // it is a dim shape with paler flanks and fans)
  albedo: /* glsl */`{ float dpUp = smoothstep(-0.25, 0.85, normalize(vSwimRestN).y); albedo *= uDpCarp.y * mix(1.0, uDpCarp.z, dpUp); }`,
  light: /* glsl */`
    float dpVeil = swimLost * 0.86;
    vec3 dpWater = mix(uSwimWaterDeep, uSwimWaterShallow, pow(clamp(V.y, 0.0, 1.0), 1.5) * (1.0 - smoothstep(4.0, 70.0, length(uCameraPos - vWPos))));
    if (dpVeil > 0.0) c = (c - dpWater * dpVeil) / (1.0 - dpVeil);`,
});
const CARP_AFTER = () => ({
  light: /* glsl */`
    c += albedo * mix(uTownStreet, uTownJade, clamp(gTown.g * 1.4, 0.0, 1.0)) * (swimMask * uDpCarp.x * gTownLamp * (1.0 - swimLost));
    if (dpVeil > 0.0) c = mix(max(c, vec3(0.0)), dpWater, dpVeil);
    { float dpOut = smoothstep(0.0, 0.05, vWPos.y), dpL = dot(c, vec3(0.3, 0.5, 0.2)); c = mix(c, mix(c, vec3(dpL) * vec3(1.06, 0.86, 0.98), 0.62) * uDpCarp.w, dpOut); }`,
});

async function buildCarp(ctx, plan, shared, light, env) {
  const C = plan.deep && plan.deep.carp;
  if (!C) { note('plan.deep.carp is missing: no carp'); return null; }
  const town = light.town;
  const P = (p) => { const [x, z] = town.xz(p[0], p[1]); return p[3] ? [x, p[2], z, p[3]] : [x, p[2], z]; };
  const routes = {};
  for (const name of ['patrol', 'under', 'shallow', 'turn', 'stroke']) if (C[name]) routes[name] = new SwimRoute(C[name].map(P), { closed: name === 'patrol' });
  const U = { uDpCarp: { value: new THREE.Vector4(num('dpthin', 0.9), num('dpvalue', 0.82), num('dpback', 0.5), num('dpout', 0.5)) } };      // x: how much of the street's light the fins' webs let through; y: its paint's value in this water; z: how far its back is drawn down; w: how much of the town's light from below a wet back takes when it stands out of the water
  const api = { onTouch: null, onNear: null, near: null, place: { x: 0, y: 0, z: 0, s: 0, d: 0, depth: 0, speed: 0, heading: 0 } }, SIPREF = { v: null };
  const handle = await makeSwimmer(ctx, {
    species: 'carp', route: routes.patrol, from: num('dpfrom', C.from ?? 168), speed: C.speed, thin: C.thin, mirror: false,
    material: RAW ? {} : { extend: [CARP_BEFORE(U), light.extendFor(num('dplit', 1.0)), CARP_AFTER()] },
    onTouch: (x, z, kind) => { if (kind === 'sip' && SIPREF.v && SIPREF.v.strength > 0) ctx.water.ripple(x, z, SIPREF.v.strength, SIPREF.v.radius); if (api.onTouch) api.onTouch(x, z, kind); },
  });
  handle.object.name = 'town-old-carp';
  // (not drawn while it is more than 85 m from the boat: the water between has long taken it, and it is 31,000 triangles a
  // frame. The family shows its mesh every frame in an update of its own, registered before this one)
  ctx.onUpdate((dt, c) => { const sw0 = handle.swimmers[0]; if (sw0 && sw0.active && Math.hypot(sw0.head.x - c.boat.x, sw0.head.z - c.boat.z) > 85) handle.object.visible = false; });
  const sw = handle.swimmers[0];
  // an object that rides on its middle (the fish keep clear of it; the lanterns swing aside from it)
  const body = new THREE.Object3D(); body.name = 'town-old-carp-body'; ctx.add(body);
  const mid = new THREE.Vector3(), fore = new THREE.Vector3(), aft = new THREE.Vector3();
  const station = (k, out) => { const b = sw.body, n = b.length / 4, i = clamp(Math.round(k * (n - 1)), 0, n - 1) * 4; return out.set(b[i], b[i + 1], b[i + 2]); };
  const back = () => handle.swim(routes.patrol);
  Object.assign(api, {
    handle, object: handle.object, material: handle.material, swimmers: handle.swimmers, length: handle.length, routes, at: C.at, strokeAt: C.strokeAt, underAt: C.underAt, body, skipped: null,
    parts: { fore, mid, aft },
    swim: (route, opts) => { handle.swim(route, opts); return api; },
    rise: (opts) => { handle.rise(opts); return api; },
    sink: (depth, seconds) => { handle.sink(depth, seconds); return api; },
    speedTo: (v, seconds) => { handle.speedTo(v, seconds); return api; },
    hide: () => { handle.hide(); return api; },
    back,
    /**
     * Swim one of the plan's ways and come back to the patrol by itself. opts: as the family's swim (in, at, speed, from, jump).
     * A way that is timed (`in`) begins by putting the fish on it at once, which must not be seen: if the fish is within
     * 18 m of the hull at that moment (inside the water's clear window) the moment is let go, api.skipped names it, and
     * the fish swims on where it was (force: true overrides).
     */
    go(name, opts = {}) {
      const r = name === 'street' ? routes.patrol : routes[name];
      if (!r) { note(`carp.go: no route called ${name}`); return api; }
      // (second look: what each staged way is timed to when the staging gives no time of its own. street: the fish is ten
      // seconds past the start of its turn at the street's end, so that a boat left to the current, 1.5 m/s there, has it
      // 12 m off the starboard beam, crossing; under: its snout at `ahead` three seconds on)
      const o = name === 'street' ? { at: C.at.street, in: -10, ...opts } : name === 'under' ? { in: 3, at: (C.underAt || {}).ahead ?? 1, onDone: back, ...opts } : { onDone: back, ...opts };
      api.skipped = null;
      if (o.in != null && !o.force && sw.active && Math.hypot(sw.head.x - ctx.boat.x, sw.head.z - ctx.boat.z) < 18) { api.skipped = name; return api; }
      delete o.force;
      handle.swim(r, o);
      return api;
    },
  });

  // ---- what it writes on the water, and where it is (every frame)
  const st = { beat: -1, nearArmed: true, logAt: 0, overLime: false };
  const lime = shared.kitLime || (() => { const li = plan.square.lime, [x, z] = town.xz(li.s, li.d); return { x, z }; })();
  api.limeLift = true;
  const LOG = Q.get('dplog') === 'carp', EVERY = num('dpevery', 4);
  const BULGE = { strength: 0.2, radius: 1.5, depth: 1.9, ...(C.bulge || {}) };
  { const v = list('dpbulge').map(Number); if (Number.isFinite(v[0])) BULGE.strength = v[0]; if (Number.isFinite(v[1])) BULGE.radius = v[1]; }      // (&dpbulge=<strength>,<radius>: to try others)
  const SIP = { strength: 0, radius: 0.8, ...(C.sip || {}) }; SIPREF.v = SIP;      // a ring of this module's own on top of the family's at the sip (0: the family's alone)
  api.update = (dt, c) => {
    if (!sw.active) { api.near = null; return; }
    station(0.5, mid); station(0.1, fore); station(0.85, aft);
    // (the object others keep clear of rides where the fish is SEEN: the family draws a deep fish up to 1.7 m higher than it is,
    // and a school that parted round the true place would part under the fish the rider sees. place, below, is the true one)
    body.position.set(mid.x, seenY(ctx, mid.x, mid.y, mid.z, handle.lift ?? 1.2), mid.z);
    // the lime's fry lift off as it passes over their tree (the page; the Fish group's own control), once a pass
    if (api.limeLift && lime) { const near = Math.hypot(mid.x - lime.x, mid.z - lime.z) < 4.5; if (near && !st.overLime) { const F = shared.cast && shared.cast.fishes; if (F && typeof F.lift === 'function') { try { F.lift(); } catch (e) { /* the fish are another group's */ } } } st.overLime = near; }
    const q = town.sd(mid.x, mid.z), pl = api.place;
    pl.x = mid.x; pl.y = mid.y; pl.z = mid.z; pl.s = q.s; pl.d = q.d; pl.depth = -mid.y; pl.speed = sw.speed; pl.heading = Math.atan2(sw.dir.x, sw.dir.z);
    // the slow bulge: once a tail beat while its back is within a metre and a half of the surface, over its tail
    if (sw.head.y > -BULGE.depth && Math.floor(sw.phase) !== st.beat) {
      st.beat = Math.floor(sw.phase);
      c.water.ripple(aft.x, aft.z, BULGE.strength, BULGE.radius);
      if (api.onTouch) api.onTouch(aft.x, aft.z, 'bulge');
    }
    // beside the hull
    const boat = c.boat, dx = mid.x - boat.x, dz = mid.z - boat.z, dist = Math.hypot(dx, dz);
    if (dist < 12) {
      const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading), ahead = dx * fx + dz * fz, abeam = dx * -fz + dz * fx;      // (the boat's nose is its -Z; its right is (-fz, fx))
      api.near = { distance: dist, depth: -mid.y, side: abeam >= 0 ? 1 : -1, abeam, ahead };
      if (st.nearArmed && dist < 7) { st.nearArmed = false; if (api.onNear) api.onNear(mid.x, mid.z, api.near); }
    } else { api.near = null; if (dist > 14) st.nearArmed = true; }
    if (LOG && c.time >= st.logAt) { st.logAt = c.time + EVERY; note(`carp t ${c.time.toFixed(1)}: s ${q.s.toFixed(1)} d ${q.d.toFixed(1)} y ${mid.y.toFixed(2)} (snout ${sw.head.y.toFixed(2)}) speed ${sw.speed.toFixed(2)} m/s, strokes ${sw.phase.toFixed(2)}, hull ${dist.toFixed(1)} m`); }
  };
  return api;
}

// ====================================================================================================== the lantern-jellies
// One more gouache extension for a gouache material that already exists (the lights family builds its own and takes no
// `extend`): the hooks stay in a gouache shader as comments, so this fills them as makeGouache does, after whatever
// the family put there. All or nothing: if the material is not what this expects, the animals keep the family's look.
const HOOKS_V = ['vertexPars', 'vertexLocal', 'vertexWorld'], HOOKS_F = ['fragmentPars', 'albedo', 'light', 'fog', 'final'];
function canWear(material, hooks) {
  if (!material || !material.isGouache || typeof material.fragmentShader !== 'string') return false;
  for (const h of hooks) if (!(HOOKS_V.includes(h) ? material.vertexShader : material.fragmentShader).includes(`//@${h}`)) return false;
  return true;
}
function wear(material, ex) {
  for (const h of HOOKS_V) if (ex[h]) material.vertexShader = material.vertexShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`);
  for (const h of HOOKS_F) if (ex[h]) material.fragmentShader = material.fragmentShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`);
  if (ex.uniforms) Object.assign(material.uniforms, ex.uniforms);
  material.needsUpdate = true;
}
// The town's water on a lantern. A lantern is clear jelly with light in it: the family adds its light to what is behind
// it. So it cannot be mixed toward the water's colour as a wall is (light.js, waterFinal): what the water between takes
// is taken from the light itself, and from the little the body hides of what is behind it, so that far off there is
// simply no lantern. A light burns through water that a wall is lost in (uDpLan.x: the share of the water's swallowing
// a lantern takes). No air fog under the surface; in the veil between areas the mist stands in the water too.
//   DEEP, a lantern is a small rose light and no more (second look, taken over). The standing water wavers everything
// under it, the more the deeper it lies, in wavelets a hand's breadth to a metre long: a window is large and wavers
// whole; a hard-edged egg a third of a metre across is folded into crescents and commas that change four times a
// second: a petal tumbling. And a lone one some metres down showed its comb rows as four broad bands: a striped ball.
// So below a few metres (uDpSoft.x to .y, and only for an eye above the water) the animal's drawing gives way to its
// light alone: brightest through its middle, nothing at its outline, no rows, hiding nothing of what is behind it. It
// comes up out of that into the clear ribbed animal as it climbs: a light that turns out to be alive.
const LANTERN_FOG = 'if (vWPos.y < 0.0) fog *= 1.0 - smoothstep(0.0, 0.25, -vWPos.y);';
const LANTERN_FINAL = /* glsl */`{
      float dD = max(-vWPos.y, 0.0), dPath = length(vViewPos) * dD / (max(uCameraPos.y, 0.05) + dD);
      float dT = exp(-uDpLan.x * (uTownWater.w * dPath + uTownPool.w * dD));
      float dV = uTownVeil.w * uTownVeil.w; dT *= exp(-dV * 0.5 * dPath) * (1.0 - 0.85 * dV);
      dT *= smoothstep(0.0, 0.08, dD) * (1.0 - smoothstep(uDpFar.x, uDpFar.y, length(vViewPos))) * vDpFade;
      // (how much jelly the eye's ray crosses, as the family reckons it: 0 at the outline .. 1 through the middle)
      vec3 dVd = -V, dDl = normalize(vec3(dVd.x * vJS.x + dVd.z * vJS.y, dVd.y, -dVd.x * vJS.y + dVd.z * vJS.x) / vec3(0.17, 0.21, 0.17));
      float dThick = clamp(-dot(vJP, dDl) / max(length(vJP), 1e-3), 0.0, 1.0);
      float dSoft = smoothstep(uDpSoft.x, uDpSoft.y, dD) * smoothstep(-0.4, 0.2, uCameraPos.y);
      vec3 dLight = uBodyJ * (uDpSoft.z * dThick * dThick * (0.35 + 0.65 * dThick));
      // (and near: the family's animal holds its light in a small core, and a body that writes no depth is seen through
      // the engine's water as the ground behind it is: over the square, 22 m of it. Its jelly is filled with its own light)
      vec3 dFill = uBodyJ * (uDpFill * dThick * dThick);
      gl_FragColor = vec4(mix(gl_FragColor.rgb + dFill, dLight, dSoft) * (uDpLan.z * dT), uDpLan.y * dT * mix(1.0, dThick * dThick, dSoft));
    }`;
// The light a lantern throws into the water round it (second look, taken over). A lantern is a light IN water: it stands
// in a small ball of lit water, as every lamp and window of the town does (light.halos). The family draws the animal and
// nothing round it, and so a lantern some metres down was a pale shell beside lamps that burn: an egg, a petal. One soft
// glow for each, facing the rider, standing in the water just in front of the animal (so the wall it hangs on never
// cuts it), swallowed by the water between as the lantern itself is, gone at the surface (nothing is lit above the
// waterline), thin at arm's length (there the animal is the picture). One draw call a system, before the water, so the
// surface bends it; never in the mirror. aDpAt: where the lantern is drawn, and its level (thinned where they hang
// together: a colony is one warm light, not a white blot). uDpGlow: x its strength, y metres across, z how far in front
// of the animal it stands, w what is left of it at arm's length.
const GLOW_VERT = /* glsl */`
      attribute vec4 aDpAt; uniform vec3 uCameraPos; uniform vec4 uTownWater, uTownPool, uTownVeil, uDpLan, uDpGlow; uniform vec2 uDpFar;
      varying vec2 vQ; varying float vLv, vY, vDist;
      void main() {
        vec3 c = aDpAt.xyz, toCam = uCameraPos - c; float d = length(toCam); toCam /= max(d, 1e-3);
        c += toCam * min(uDpGlow.z, 0.4 * d);
        vec3 right = abs(toCam.y) > 0.98 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), toCam)), up = cross(toCam, right);
        vec3 wp = c + (right * position.x + up * position.y) * uDpGlow.y;
        float depth = max(-aDpAt.y, 0.0), path = d * depth / (max(uCameraPos.y, 0.05) + depth);
        float through = exp(-uDpLan.x * (uTownWater.w * path + uTownPool.w * depth));
        float dV = uTownVeil.w * uTownVeil.w; through *= exp(-dV * 0.5 * path) * (1.0 - 0.85 * dV);
        through *= 1.0 - smoothstep(uDpFar.x, uDpFar.y, d);
        vLv = aDpAt.w * uDpGlow.x * through * mix(uDpGlow.w, 1.0, smoothstep(0.8, 3.4, d / uDpGlow.y));
        vQ = position.xy * 2.0; vY = wp.y; vDist = d;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`;
const GLOW_FRAG = /* glsl */`
      uniform vec3 uDpGlowCol; uniform float uFogDensity, uVeil; varying vec2 vQ; varying float vLv, vY, vDist;
      void main() {
        float r = length(vQ), a = max(0.0, 1.0 - r); a = a * a * mix(1.0, a, 0.5) * smoothstep(0.0, -0.12, vY) * vLv;
        if (a < 0.002) discard;
        gl_FragColor = vec4(uDpGlowCol * (a * exp(-uFogDensity * uFogDensity * vDist * vDist) * (1.0 - 0.55 * uVeil) * (1.0 - smoothstep(0.75, 1.0, uVeil))), 1.0);
      }`;
// Where a lantern that was let go swims. The family climbs it (0.55 m/s, eased off its roost and eased to rest under the
// surface) and winds it in a spiral round the place it left; this module keeps the climb and takes the spiral for its
// own (the family's is taken out again, term for term), because three things in it could not stand here:
//   From a WALL. The family winds each one's spiral round the place it left: right in open water, but round a place a
// hand's breadth off a wall half of every turn is inside the stone. Every roosting lantern carries the way out of what
// it hangs on (aDpOut.xy: a wall's face, or away from its lamp post), and the middle of its spiral is carried that way
// by a little more than the spiral's own reach: it leaves along the wall, swings out, and comes back to touch the
// wall's plane once a turn, never crossing it.
//   AWAY, and to a place of its own. The family leaves a risen lantern over the place it left, so the lights lay over the
// eaves they came from (festoons at the surface, dark water round the boat), and all on one level, where two whose ways
// cross swim through each other. The page: they "reach y -0.6 and spread flat under the surface". Each has a place of
// its own to lie (buildLanterns: aDpGo, a way and a distance; aDpLie.x, how far under the ceiling), found so that the
// places stand evenly over the open water and no two are near; it slants toward it as it climbs (a fifth of a metre
// sideways for each second of climbing at the most, so the deep ones travel furthest), its spiral closing as it comes.
//   SLOW, once it lies. The family's spiral "breathes" (a quarter of its reach, out and back every nine seconds) and goes
// on turning and widening for ever: lying, the lanterns went at 0.19 m/s (the page: 0.05 to 0.15) and shuttled. Lying,
// each now keeps to its own place: a small slow round (0.2 to 0.4 m out, a turn in a minute and more) and a wander of
// under half a metre: measured, a median of 0.057 m/s, nine in ten under 0.085, the fastest 0.12; its own turning, its
// shimmer and its lean are the family's still.
//   Gone, and home again. The family sinks a lantern back to the depth of its roost and leaves it there in open water.
// The page: they "sink away in ones and twos". Each one goes out of sight as it sinks (between 18 and 40 s after it
// begins: some 2 to 4.5 m down); unseen, it is put back on its roost (buildLanterns, every half second), and is there
// again over six seconds. So the world after the stroke is the world before it, whatever the staging does.
//   And the carp shoulders aside the lantern the rider SEES: the family pushes each animal from where the family has it,
// which, for one that has let go, is metres from where it is drawn. The family's push is taken out and given again at
// the true place.
// (The same lines are in buildLanterns for the script's side, `wayOf`: change both or neither. uDpWay: x the most a
// spiral's turning may carry it, m/s; y how far a lying one wanders, m.)
const LANTERN_PARS = /* glsl */`attribute vec3 aDpOut, aDpGo; attribute vec2 aDpLie; attribute float aDpBack; attribute vec4 aDpFree; uniform vec4 uDpWay; varying float vDpFade;
      vec3 dpShove(vec3 c) { vec3 s = vec3(0.0); for (int i = 0; i < 4; i++) { vec4 dz = uDisJ[i]; if (dz.w > 0.0) { vec3 dd = c + s - dz.xyz; float dl = max(length(dd), 0.05); s += dd / dl * dz.w * 0.7 * (1.0 - smoothstep(dz.w * 0.5, dz.w * 2.2, dl)); } } return s; }`;
const LANTERN_WAY = /* glsl */`{
      float dTau = uClockJ - aTimes.x;
      vDpFade = smoothstep(0.0, 6.0, uClockJ - aDpBack);
      float dSd = aSeed.x * 6.2831853, dGap = max(uRiseJ.y - 0.22 * aHome.w - aHome.y, 0.0), dTc = 1.2 + dGap / max(uRiseJ.x, 0.01);
      // one of the square's own, hanging in open water (aDpFree: how far it wanders along x and z, how fast, how far up and
      // down): it wanders as a resident does until it lets go; then its wander stands where it was, and is given up as it
      // climbs, so that it comes to its own place under the surface
      vec3 dW = vec3(0.0);
      if (aDpFree.z > 0.0) {
        float dTw = (uTime - max(dTau, 0.0)) * aDpFree.z;
        dW = vec3(aDpFree.x * sin(dTw + dSd * 1.3), aDpFree.w * sin(dTw * 0.61 + dSd * 2.1), aDpFree.y * sin(dTw * 0.83 + dSd * 2.9)) * (1.0 - smoothstep(0.0, dTc + 3.0, dTau));
      }
      if (dTau > 0.0) {
        // (seconds since it began to sink away: its stay is over, or it was told to. The family's own line)
        float dTs = max(max(dTau - dTc - uRiseJ.z - aTimes.z, uClockJ - uSinkJ.x - aTimes.z * uSinkJ.y), 0.0);
        vDpFade *= 1.0 - smoothstep(18.0, 40.0, dTs);
        // the family's spiral, as the family has it (taken out below)
        float dTurn = (aSeed.y < 0.5 ? -1.0 : 1.0) * (0.20 + 0.16 * aSeed.z);
        float dAng = dSd + dTurn * (min(dTau, dTc) + 0.25 * max(dTau - dTc, 0.0));
        float dRho = aTimes.w * (1.0 - exp(-dTau / 5.0)) * (1.0 + 0.25 * sin(dTau * 0.7 + dSd * 3.0)) + 0.014 * max(dTau - dTc, 0.0);
        vec2 dE = vec2(cos(dAng), sin(dAng));
        // this module's: the same turning, a reach that closes as it comes to rest, the way out of its wall, the slant to its own place
        float dS = smoothstep(dTc - 6.0, dTc + 10.0, dTau);
        float dR = mix(min(aTimes.w, uDpWay.x / abs(dTurn)) * (1.0 - exp(-dTau / 5.0)), 0.18 + 0.22 * aSeed.x, dS);
        vec2 dP = aDpGo.xy * (aDpGo.z * smoothstep(1.0, dTc + 5.0, dTau)) + aDpOut.xy * (aDpOut.z * 1.05 * dR) + dE * (dR - dRho);
        dP += dS * uDpWay.y * vec2(sin(uTime * 0.14 + dSd * 5.0), sin(uTime * 0.105 + dSd * 9.0));
        vec3 dD = vec3(dP.x, -aDpLie.x * smoothstep(dTc - 5.0, dTc + 3.0, dTau), dP.y);
        vec3 dC = combCentre(aHome, aSeed, aWay, aTimes, uRiseJ, uSinkJ, uTime, uClockJ);
        // (the push from a great swimmer, at the true place; and never up through the ceiling: a carp that passes under a
        // lying lantern pushed it out of the water)
        vec3 dV = dpShove(dC + dD + dW);
        dV.y = min(dV.y, max(uRiseJ.y - 0.22 * aHome.w - dC.y - dD.y - dW.y, 0.0));
        transformed += dD + dW + dV - dpShove(dC);
      } else if (aDpFree.z > 0.0) {
        vec3 dC = combCentre(aHome, aSeed, aWay, aTimes, uRiseJ, uSinkJ, uTime, uClockJ);
        transformed += dW + dpShove(dC + dW) - dpShove(dC);
      }
    }`;

// ---- what stands in the water, from the layout and the plan (for the residents: how much clear water a place has)
function makeRoom(plan, shared, town) {
  const F = plan.floorAt, O = [];
  const circle = (x, z, r, top, bottom = -99) => O.push({ k: 1, x, z, r, top, bottom });
  const rect = (s0, s1, d0, d1, top, bottom = -99) => O.push({ k: 2, s0, s1, d0, d1, top, bottom });
  for (const h of town.houses) O.push({ k: 0, x: h.x, z: h.z, c: Math.cos(h.yaw), s: Math.sin(h.yaw), hw: h.w / 2 + 0.4, hd: h.dep / 2 + 0.4, top: h.ridge + 0.5, bottom: -99 });
  for (const h of town.upper || []) O.push({ k: 0, x: h.x, z: h.z, c: Math.cos(h.yaw), s: Math.sin(h.yaw), hw: h.w / 2 + 0.4, hd: h.dep / 2 + 0.4, top: 99, bottom: -99 });      // the upper town's houses that stand in the shallows
  for (const st of town.stacks) circle(st.x, st.z, 0.7, st.y1 + 0.4, st.y0 - 1);
  rect(118, 153.6, -12.6, 2.6, 99);                                  // the church
  rect(129.6, 150.2, 4.6, 18.0, -2.5);                               // the skiffs and their painters
  rect(150, 204, 29.6, 70, 99);                                      // the terrace and the wall it stands on
  rect(150.8, 197.2, -60, -20.2, 99);                                // the market hall
  rect(27, 134, -7.7, -4.3, (s) => F(s) + 8.2);                      // the raised walk, its rail, and the school that runs two metres over it
  rect(30, 117, 5.6, 10.4, -3.4);                                    // the leat and its walls; the schools that go up the street's right side and down the leat
  rect(111, 117.5, -6, 6, -7.6, -10.4);                              // where the first school turns before the church
  rect(102.3, 105.7, 5.3, 12.7, -12.6);                              // the footbridge
  rect(221.5, 320, -400, 400, 99);                                   // the theatre's steps (they rise to a metre under the surface), its stylobate and columns, the far shore
  // (second look: the tower is its own square, not a circle round its corners: a lantern let go from one of its faces climbs
  // a hand's breadth off the stone, and a circle of 5.1 m called that "inside the tower". At the surface the same square is
  // the loggia: the lake runs through it under the pendulum, and no lantern lies there. The hour ring turns round its foot)
  { const [x, z] = town.xz(plan.tower.s, plan.tower.d), yaw = town.along(plan.tower.s), h = plan.tower.side / 2 + 0.15;
    O.push({ k: 0, x, z, c: Math.cos(yaw), s: Math.sin(yaw), hw: h, hd: h, top: 99, bottom: -99 });
    circle(x, z, 8.9, plan.square.floor + 4.4); }
  { const [x, z] = town.xz(plan.fountain.s, plan.fountain.d); circle(x, z, 1.7, 99); }
  { const li = plan.square.lime, [x, z] = town.xz(li.s, li.d); circle(x, z, 2.7, plan.square.floor + 7.7); }
  for (let i = 0; i < plan.poplars.count; i++) for (const side of [-1, 1]) { const [x, z] = town.xz(plan.poplars.s0 + i * plan.poplars.step, side * plan.poplars.d); circle(x, z, 1.4, 99); }
  for (const l of town.lamps) circle(l.x, l.z, 0.5, l.plinth !== undefined ? 0.2 : l.y + 0.6);
  for (const c of town.copings) O.push({ k: 0, x: c.x, z: c.z, c: Math.cos(c.yaw), s: Math.sin(c.yaw), hw: c.len / 2 + 0.2, hd: 0.6, top: 0.3, bottom: -2.4 });
  for (const g of town.gables) circle(g.x, g.z, 3.4, g.apex + 0.3, g.floor);
  const cloth = shared.kitCloth && shared.kitCloth.pieces;
  if (cloth) for (const pc of cloth) circle(pc.x, pc.z, Math.max(pc.w, 0.6) / 2 + 0.4, pc.y + 0.5, pc.y - pc.h - 0.6);
  return {
    /** Metres of clear water round (x, z) at height y (to the nearest thing that stands within `band` metres of that height). */
    free(x, y, z, band = 1.1) {
      const q = town.sd(x, z); let m = 99;
      if (town.ground(q.s, q.d) > y - band - 0.4) return -1;         // (the lake's own bed: it rises to the shore on the right, and to the theatre's steps)
      for (const o of O) {
        const top = typeof o.top === 'function' ? o.top(q.s) : o.top;
        if (y - band > top || y + band < o.bottom) continue;
        let h;
        if (o.k === 1) h = Math.hypot(x - o.x, z - o.z) - o.r;
        else if (o.k === 0) { const dx = x - o.x, dz = z - o.z, ax = Math.abs(dx * o.c - dz * o.s) - o.hw, az = Math.abs(dx * o.s + dz * o.c) - o.hd; h = ax < 0 && az < 0 ? Math.max(ax, az) : Math.hypot(Math.max(ax, 0), Math.max(az, 0)); }
        else { const as = Math.max(o.s0 - q.s, q.s - o.s1), ad = Math.max(o.d0 - q.d, q.d - o.d1); h = as < 0 && ad < 0 ? Math.max(as, ad) : Math.hypot(Math.max(as, 0), Math.max(ad, 0)); }
        if (h < m) m = h;
      }
      return m;
    },
  };
}

// ---- where the lanterns live
// Roosts: places beside and just under the lip of something that overhangs, round the square, taken from the set's own
// numbers: the tower's two string courses (its roost_<face>_<n> points give their heights), the gutter of the market
// hall's eaves, the sills of the terrace's lit windows, the valances of the square's twelve stalls (the awnings' own
// places, read from the kit's cloth), the ladder bars of the street lamps round the square, the eaves of the houses
// beyond the poplars. They hang in COLONIES of two to fourteen with long bare ledge between (a row at even spacing is a
// string of fairy lights; bunches in ranks at even intervals are festoons). Each carries the way out of what it hangs on.
// Residents: places in open water with room to wander, each tried against everything that stands in the water.
// Both lists come back in an order that thins evenly, the roosts colony by colony: the first 150 of them are whole
// colonies spread over every site as the 420 are.
function lanternPlaces(ctx, plan, shared, light) {
  const town = light.town, F = plan.floorAt, rnd = ctx.rng(4107), notes = [];
  const room = makeRoom(plan, shared, town), roomFor = (x, y, z) => room.free(x, y, z, 0.8);
  const sites = [];
  const site = (name, share) => { const s = { name, share, clusters: [] }; sites.push(s); return s; };
  // A COLONY of k lanterns at a place on a ledge (second look: the bunches were ranks, lanterns side by side a hand apart
  // in one or two rows; three in a row is a rank, and bunches at even intervals along a gutter are festoon lighting in
  // bunches instead of singles). Animals that gather under an overhang press together as a swarm hangs: widest under
  // the ledge, each row below it one shorter and set in the gaps of the row above, none level with its neighbour, the
  // whole a little askew. `ax`: along the ledge; `n`: the way out of the wall. wide: the most in its top row; taper:
  // false keeps every row as wide (a narrow place: beside a post, under a small bowl).
  const rowsOf = (k, wide = 5, taper = true) => {
    const rows = []; let left = k;
    if (!taper) { while (left > 0) { rows.push(Math.min(left, wide)); left -= wide; } return rows; }
    const holds = (m) => { let t = 0; for (let r = 0, c = m; r < 4 && c > 0; r++, c--) t += c; return t; };
    let m = 1; while (m < wide && holds(m) < k) m++;
    for (let c = m; left > 0; c = Math.max(1, c - 1)) { rows.push(Math.min(left, c)); left -= c; }
    return rows;
  };
  const colony = (x, y, z, ax, n, k, o = {}) => {
    const rows = rowsOf(k, o.wide ?? 5, o.taper !== false), c = [], lean = (rnd() - 0.5) * 0.36, pitch = 0.39 + rnd() * 0.04;
    // (no two colonies the same shape: a neat triangle of rows is a bunch of grapes drawn with a ruler. One of the lowest
    // moves up beside an upper row, as often as not)
    if (rows.length >= 3 && rnd() < 0.6) { const r = Math.floor(rnd() * (rows.length - 1)); if (rows[r] <= (o.wide ?? 5)) { rows[r]++; if (--rows[rows.length - 1] === 0) rows.pop(); } }
    let shift = 0;
    rows.forEach((m, r) => {
      if (r) shift += lean + (rnd() - 0.5) * 0.16 + (m === rows[r - 1] ? (rnd() < 0.5 ? -0.2 : 0.2) : 0);
      for (let i = 0; i < m; i++) {
        const u = (i - (m - 1) / 2) * pitch + shift + (rnd() - 0.5) * 0.1, off = 0.02 + rnd() * 0.09 + r * 0.02;
        c.push({ x: x + ax[0] * u + n[0] * off, y: y - r * 0.335 - rnd() * 0.09, z: z + ax[1] * u + n[1] * off, nx: n[0], nz: n[1], k: 1, post: !!o.post });
      }
    });
    c.width = rows[0] * pitch;
    return c;
  };
  // colonies along a ledge from a to b (the water's plane): few, of very different sizes (most small, one in a while large),
  // with long and unequal stretches of bare ledge between. gap: [least, most] metres of bare ledge; size: [fewest, most]
  const ledge = (s, a, b, y, n, o = {}) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ax = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], gap = o.gap ?? [2.5, 8], size = o.size ?? [3, 12];
    let u = 0.4 + rnd() * gap[1] * 0.7;
    while (u < L - 0.6) {
      const k = size[0] + Math.floor(Math.pow(rnd(), 1.5) * (size[1] - size[0] + 1)), w = rowsOf(k, o.wide ?? 5)[0] * 0.41;
      if (u + w > L - 0.2) break;
      s.clusters.push(colony(a[0] + ax[0] * (u + w / 2), y, a[1] + ax[1] * (u + w / 2), ax, n, k, o));
      u += w + gap[0] + (gap[1] - gap[0]) * Math.pow(rnd(), 1.3);
    }
  };
  const T = plan.tower, [tx, tz] = town.xz(T.s, T.d);

  // (1) the tower's two string courses, on all four faces
  { const s = site('tower', 0.22), tw = shared.tower, f = tw && tw.frame && tw.frame.at ? tw.frame : (() => { const yaw = town.along(T.s), c = Math.cos(yaw), sn = Math.sin(yaw); return { at: (ls, y, ld) => [tx + ls * c + ld * sn, y, tz - ls * sn + ld * c] }; })();
    const R = T.side / 2 + 0.36, o = f.at(0, 0, 0);
    for (const n of [1, 0]) for (let k = 0; k < 4; k++) {
      const a = [-1, 0, 1, 0][k], b = [0, 1, 0, -1][k];                          // the face's way out, in the tower's own frame (down the route, to its right)
      let y = (T.shell && T.shell.slits && T.shell.slits.strings ? T.shell.slits.strings[n ? 0 : 1] : (n ? -8.4 : -15.6)) - 0.27;
      if (tw && tw.point && tw.models) { const p = tw.point(`roost_${k}_${n}`); if (p && p.y < -1) { y = p.y; const q = f.at(a * (T.side / 2 + 0.08), y, b * (T.side / 2 + 0.08)); if (Math.hypot(p.x - q[0], p.z - q[2]) > 1.6) notes.push(`the tower's roost_${k}_${n} is not on the face this module expects (${Math.hypot(p.x - q[0], p.z - q[2]).toFixed(1)} m off)`); } }
      const p0 = f.at(a * R - b * -3.1, 0, b * R + a * -3.1), p1 = f.at(a * R - b * 3.1, 0, b * R + a * 3.1), q = f.at(a, 0, b);
      ledge(s, [p0[0], p0[2]], [p1[0], p1[2]], y - 0.2, [q[0] - o[0], q[2] - o[2]], { gap: [1.2, 3.6], size: [3, 11], wide: 4 });
    }
    // ... and under the feet of its lit slits, the second to the fourth down each face (moths at a lit window)
    if (tw && tw.point && tw.models) for (let k = 0; k < 4; k++) for (const i of [1, 2, 3]) {
      if (rnd() > 0.5) continue;
      const a = [-1, 0, 1, 0][k], b = [0, 1, 0, -1][k], p = tw.point(`slit_${k}_${i}`), ex = f.at(1, 0, 0), ez = f.at(0, 0, 1);
      const ls = (p.x - o[0]) * (ex[0] - o[0]) + (p.z - o[2]) * (ex[2] - o[2]), ld = (p.x - o[0]) * (ez[0] - o[0]) + (p.z - o[2]) * (ez[2] - o[2]), u = -b * ls + a * ld;
      if (p.y > -5 || Math.abs(a * ls + b * ld - T.side / 2) > 0.8 || Math.abs(u) > 3) continue;      // (not a slit of the face this module expects: none)
      const c = f.at(a * R - b * u, 0, b * R + a * u), q = f.at(a, 0, b), tq = f.at(-b, 0, a);
      s.clusters.push(colony(c[0], p.y - 0.75 - 0.3, c[2], [tq[0] - o[0], tq[2] - o[2]], [q[0] - o[0], q[2] - o[2]], 2 + Math.floor(rnd() * 4), { wide: 3 }));
    } }
  // (2) the gutter of the market hall's eaves, on the square's side
  { const s = site('hall', 0.11), H = plan.hall, G = shared.glassRidge, hf = G && G.frame && G.frame.at && G.frame.local ? G.frame : null;
    const y = H.eaves - 0.31 - 0.25, half = H.width / 2 + 0.34 + 0.22;
    if (hf) { const side = Math.sign(hf.local(...town.xz(174, 0))[1]) || 1, a = hf.at(-21.4, 0, side * half), b = hf.at(21.4, 0, side * half), o = hf.at(0, 0, 0), q = hf.at(0, 0, side);
      ledge(s, [a[0], a[2]], [b[0], b[2]], y, [q[0] - o[0], q[2] - o[2]], { gap: [2.6, 9], size: [4, 14] }); }
    else { const d = H.d + half, a = town.xz(H.s0 + 0.6, d), b = town.xz(H.s1 - 0.6, d), o = town.xz(174, 0), q = town.xz(174, 1); ledge(s, a, b, y, [q[0] - o[0], q[1] - o[1]], { gap: [2.6, 9], size: [4, 14] }); } }
  // (3) the terrace's drowned front: along the sill band under its top windows, and under the sills of the lit windows of
  // the two storeys below (moths at a lit window). Not its ground floor (shop fronts and their awnings), and not its
  // cornice (0.9 m down: at the stroke they would be under the surface at once, and at arm's length before it)
  { const s = site('terrace', 0.13), te = plan.square.terrace, STOREY = 2.7;
    for (const h of town.houses) {
      if (h.row !== 'terrace') continue;
      const sg = h.d > 0 ? -1 : 1, c = Math.cos(h.yaw), sn = Math.sin(h.yaw), off = h.dep / 2 + 0.3, W = (lx) => [h.x + lx * c + sg * off * sn, h.z - lx * sn + sg * off * c];
      ledge(s, W(-h.w / 2 + 0.7), W(h.w / 2 - 0.7), h.floor + 0.9 + 3 * STOREY - 0.14 - 0.24, [sg * sn, sg * c], { gap: [2.4, 7.5], size: [3, 12] });
    }
    for (const w of town.windows) {
      if (w.y > te.floor + 1.65 + 2.5 * STOREY || w.y < te.floor + 3.0 || w.pitch) continue;
      const q = town.sd(w.x, w.z); if (q.s < te.s0 - 0.5 || q.s > te.s1 + 0.5 || Math.abs(q.d - te.d0) > 0.6) continue;
      if (rnd() > 0.45) continue;
      const ox = Math.sin(w.yaw), oz = Math.cos(w.yaw), k = 2 + Math.floor(rnd() * rnd() * 5);
      s.clusters.push(colony(w.x + ox * 0.3 + Math.cos(w.yaw) * (rnd() - 0.5) * 0.3, w.y - w.h / 2 - 0.36, w.z + oz * 0.3 - Math.sin(w.yaw) * (rnd() - 0.5) * 0.3, [Math.cos(w.yaw), -Math.sin(w.yaw)], [ox, oz], k, { wide: 3 }));
    } }
  // (4) the valances of the square's twelve stalls. The kit pours its awnings into one mesh and publishes no places, so
  // each stall is found in that cloth where the plan stands it: its ridge gives its turn, its skirts their width, and
  // a corner of cloth that has come adrift and hangs (one stall in three) is given a wide berth
  { const s = site('stalls', 0.26), fl = plan.square.floor, st = plan.square.stalls, centres = [];
    for (let r = 0; r < st.rows; r++) for (let i = 0; i < st.perRow; i++) { const t = (r ? -0.4 : -0.05) + (r ? 0.84 : 0.85) * i / (st.perRow - 1); centres.push(town.xz(st.from[0] + (st.to[0] - st.from[0]) * t + r * 1.6, st.from[1] + (st.to[1] - st.from[1]) * t + (r ? 5.2 : 0))); }
    let cloth = null; ctx.group.traverse((o) => { if (!cloth && o.isMesh && !o.isInstancedMesh && o.material && o.material.uniforms && o.material.uniforms.uKsAwn && o.geometry && o.geometry.attributes.position) cloth = o; });
    const P3 = cloth ? cloth.geometry.attributes.position : null, frames = [];
    for (const [cx, cz] of centres) {
      // (the kit's stalls stand end to end in two chains, each awning's end inside the next: a stall's own cloth is told from
      // its neighbours' by its ridge, which is level and at a height of its own: every stall is a little taller or shorter)
      const pts = [];
      if (P3) for (let i = 0; i < P3.count; i++) { const x = P3.getX(i), z = P3.getZ(i); if (Math.abs(x - cx) < 2.2 && Math.abs(z - cz) < 2.2) { const y = P3.getY(i); if (y < fl + 3.6) pts.push([x, y, z]); } }
      let top = -99; for (const p of pts) if (Math.hypot(p[0] - cx, p[2] - cz) < 0.45 && p[1] > top) top = p[1];
      const own = pts.filter((p) => Math.abs(p[1] - top) < 0.012 && Math.hypot(p[0] - cx, p[2] - cz) < 1.7);
      if (top < fl + 2 || own.length < 8) { frames.push({ cx, cz, lost: true }); continue; }
      let sxx = 0, szz = 0, sxz = 0, half = 0; for (const p of own) { const dx = p[0] - cx, dz = p[2] - cz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz; }
      const ang = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(ang), uz = Math.sin(ang), wx = -uz, wz = ux;
      for (const p of own) half = Math.max(half, Math.abs((p[0] - cx) * ux + (p[2] - cz) * uz));
      if (half < 1.3) { frames.push({ cx, cz, lost: true }); continue; }
      half = Math.min(half, 1.66);
      const sy = (top - fl - 0.02) / 2.83, hem = fl + 0.02 + 1.81 * sy, skirt = 1.19;      // (the model: its ridge cloth 2.83 m up, the valance's hem 1.81, its skirts 1.16 m out)
      let ha = 0, hb = 0, hung = 0;
      for (const p of pts) { const a2 = (p[0] - cx) * ux + (p[2] - cz) * uz, b2 = (p[0] - cx) * wx + (p[2] - cz) * wz; if (Math.abs(a2) < half - 0.75 && Math.abs(b2) < skirt + 0.1 && p[1] < hem - 0.25) { ha += a2; hb += b2; hung++; } }
      frames.push({ mx: cx, mz: cz, ux, uz, wx, wz, hem, half, skirt, ha, hb, hung: hung > 1 ? hung : 0 });
    }
    if ((Q.get('dplog') || '').includes('stalls')) notes.push('stalls: ' + (cloth ? cloth.name + ' ' + P3.count + ' points; ' : 'no cloth; ') + frames.map((f, i) => (f.lost ? `${i} lost` : `${i} half ${f.half.toFixed(2)} hem ${f.hem.toFixed(2)} turn ${(Math.atan2(f.uz, f.ux) * 57.3).toFixed(0)} hung ${f.hung}`)).join(' | '));
    // (is this place under another stall's cloth? Second look: the test stood a hand's breadth outside each neighbour's awning,
    // and the stalls stand end to end, each awning's end inside the next: most skirts were refused. A lantern under its own
    // skirt hangs below the hems, a neighbour's too: only one truly inside another awning's plan is refused)
    const inCloth = (x, z, but) => frames.some((f) => f !== but && !f.lost && Math.abs((x - f.mx) * f.ux + (z - f.mz) * f.uz) < f.half - 0.05 && Math.abs((x - f.mx) * f.wx + (z - f.mz) * f.wz) < f.skirt - 0.05);
    let read = 0;
    for (const f of frames) {
      if (f.lost) {
        // (this stall's cloth was not found: beyond its corners, whatever its turn)
        const k = 2 + Math.floor(rnd() * 2), a0 = rnd() * TAU, c = [];
        for (let j = 0; j < k; j++) { const a2 = a0 + j * 0.25; c.push({ x: f.cx + Math.cos(a2) * 2.1, y: fl + 1.58, z: f.cz + Math.sin(a2) * 2.1, nx: Math.cos(a2), nz: Math.sin(a2), k: 1 }); }
        s.clusters.push(c); continue;
      }
      read++;
      // one or two colonies a stall, and some skirts bare (second look: a bunch under each skirt and each end of every
      // stall was a trimming): under a skirt (a long side), along its middle (its ends lie inside the next awning), or at
      // an end that is open (the two ends of each chain), under the end rail between the corner posts. None where the hour
      // ring's lanterns come round (the two chains end beside it)
      const sides = [[0, -1], [0, 1], [1, -1], [1, 1]]; let hung = 0;
      for (let i = sides.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [sides[i], sides[j]] = [sides[j], sides[i]]; }
      for (const [end, sg] of sides) {
        if (hung >= 2 || (hung === 1 && rnd() < 0.3)) break;
        for (let tries = 0; tries < 4; tries++) {
          const k = (end ? 3 : 4) + Math.floor(Math.pow(rnd(), 1.2) * (end ? 7 : 8)), w = rowsOf(k, 4)[0] * 0.41; let c;
          if (!end) {
            const room2 = Math.max(0, f.half - 0.8 - w / 2); let a2 = (rnd() * 2 - 1) * room2;
            if (f.hung && Math.sign(f.hb) === sg) a2 = -Math.sign(f.ha) * (0.3 + w / 2 + rnd() * Math.max(0, room2 - 0.3 - w / 2));      // (not under cloth that hangs: the other half of that skirt)
            c = colony(f.mx + f.ux * a2 + f.wx * sg * (f.skirt + 0.22), f.hem - 0.24, f.mz + f.uz * a2 + f.wz * sg * (f.skirt + 0.22), [f.ux, f.uz], [f.wx * sg, f.wz * sg], k, { wide: 4 });
          } else {
            const b2 = (rnd() * 2 - 1) * Math.max(0, 0.85 - w / 2);
            c = colony(f.mx + f.ux * sg * (f.half + 0.24) + f.wx * b2, f.hem - 0.02, f.mz + f.uz * sg * (f.half + 0.24) + f.wz * b2, [f.wx, f.wz], [f.ux * sg, f.uz * sg], k, { wide: 4 });
          }
          if (c.some((q) => inCloth(q.x, q.z, f) || Math.hypot(q.x - tx, q.z - tz) < 9.3)) continue;
          s.clusters.push(c); hung++; break;
        }
      }
    }
    if (read < centres.length) notes.push(`the awnings of ${centres.length - read} of the ${centres.length} stalls were not found in the kit's cloth: their lanterns hang beyond the stall's corners`);
  }
  // (5) the ladder bars of the street lamps round the square: a few together under one arm of the bar, on one side of the
  // post (second look: three or four at even angles round every post were a necklace). Each carries the way out from its
  // post, so that its spiral winds beside the post and never through it
  { const s = site('lamps', 0.12), SQ = plan.square;
    for (const l of town.lamps) {
      if (l.kind !== 'street' || l.s < SQ.s0 || l.s > SQ.s1 || l.d < -19.5 || l.d > 29.4) continue;
      // (on the side of the post that has open water before it: a colony between its post and a wall two metres off would
      // wind its spirals into the wall. And none on the lamp that stands under the lime's crown: they would rise through its boughs)
      const k = 3 + Math.floor(rnd() * 4), li = plan.square.lime, [lx, lz] = town.xz(li.s, li.d); let a = rnd() * TAU, open = false;
      if (Math.hypot(l.x - lx, l.z - lz) < 3.8) continue;
      for (let t = 0; t < 8 && !open; t++) { if (roomFor(l.x + Math.cos(a) * 2.6, l.y - 0.4, l.z + Math.sin(a) * 2.6) > 1.9) open = true; else a += TAU / 8; }
      if (!open) continue;
      s.clusters.push(colony(l.x + Math.cos(a) * 0.44, l.y - 1.2, l.z + Math.sin(a) * 0.44, [-Math.sin(a), Math.cos(a)], [Math.cos(a), Math.sin(a)], k, { wide: 2, taper: false, post: true }));
    } }
  // (6) the eaves of the houses beyond the poplars (the square's far side), front and back
  { const s = site('eaves', 0.11);
    for (const h of town.houses) {
      if (h.row !== 'SQ' || h.eaves > -3) continue;
      const c = Math.cos(h.yaw), sn = Math.sin(h.yaw), off = h.dep / 2 + 0.35 + 0.24;
      for (const sg of [-1, 1]) { const W = (lx) => [h.x + lx * c + sg * off * sn, h.z - lx * sn + sg * off * c]; ledge(s, W(-h.w / 2 + 0.5), W(h.w / 2 - 0.5), h.eaves - 0.3, [sg * sn, sg * c], { gap: [1.6, 5], size: [3, 11] }); }
    } }
  // (7) under the lips of the fountain's two bowls (its spout is above them: the plume rises from over their heads)
  { const s = site('fountain', 0.05), Fo = plan.fountain, fx = shared.fountain && Number.isFinite(shared.fountain.x) ? shared.fountain.x : town.xz(Fo.s, Fo.d)[0], fz = shared.fountain && Number.isFinite(shared.fountain.z) ? shared.fountain.z : town.xz(Fo.s, Fo.d)[1];
    for (const [r, y] of [[1.5 + 0.22, Fo.floor + 2.42 - 0.26], [0.76 + 0.22, Fo.floor + 3.5 - 0.26]]) {
      const nb = r > 1.2 ? 2 : 1, a0 = rnd() * TAU;
      for (let j = 0; j < nb; j++) { const a = a0 + (j + (rnd() - 0.5) * 0.6) * TAU / nb, k = r > 1.2 ? 5 + Math.floor(rnd() * 5) : 2 + Math.floor(rnd() * 3); s.clusters.push(colony(fx + Math.cos(a) * r, y, fz + Math.sin(a) * r, [-Math.sin(a), Math.cos(a)], [Math.cos(a), Math.sin(a)], k, { wide: r > 1.2 ? 3 : 2 })); }
    } }

  // ---- 420 of them, site by site by its share, WHOLE colonies at a time; then in an order that thins evenly, colony by
  // colony (second look: thinned lantern by lantern, a colony at medium quality was the same clump with holes in it)
  const WANT = 420, roosts = [];
  for (const s of sites) {
    // (colonies in a fixed shuffled order; a site that has too few gives its shortfall to the others)
    for (let i = s.clusters.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [s.clusters[i], s.clusters[j]] = [s.clusters[j], s.clusters[i]]; }
    s.clusters = s.clusters.filter((c) => c.every((p) => { const q = town.sd(p.x, p.z); return town.ground(q.s, q.d) < p.y - 0.6; }));      // (none where the bed has risen to the eaves: the far houses' backs stand in the hillside)
    s.found = s.clusters.reduce((a, c) => a + c.length, 0); s.want = Math.min(s.found, Math.round(WANT * s.share)); s.take = 0; s.kept = [];
  }
  { let short = WANT - sites.reduce((a, s) => a + s.want, 0), guard = 0;
    while (short > 0 && guard++ < 2000) { let any = false; for (const s of sites) if (short > 0 && s.want < s.found) { s.want++; short--; any = true; } if (!any) break; }
    while (short < 0) { const s = sites.reduce((a, b) => (b.want > a.want ? b : a)); s.want--; short++; } }
  for (const s of sites) {
    for (const c of s.clusters) { if (s.take >= s.want) break; if (s.take + c.length > s.want + 2) continue; s.kept.push(c); s.take += c.length; }
    s.kept.forEach((c, ci) => c.forEach((p, i) => roosts.push({ ...p, site: s.name, colony: `${s.name}:${ci}`, rank: (ci + 0.5) / s.kept.length + 1e-4 * sites.indexOf(s) + 1e-6 * i })));
  }
  roosts.sort((a, b) => a.rank - b.rank);

  // ---- the residents: 140 in open water, from where the street deepens (s 76) to the square
  const residents = [], hw = town.hw;
  const zones = [
    // the street's carriageway: most of them deep, under the washing and the schools ("deeper, small rose lanterns drifting")
    { name: 'street', n: 44, reach: 3.2, pick: () => { const s = 76 + rnd() * 35, d = -3.8 + rnd() * 8.2, f = F(s), r = rnd(); return [s, d, r < 0.58 ? f + 1.6 + rnd() * 3.4 : r < 0.8 ? lerp(-6.2, f + 5, rnd()) : -4.4 - 1.8 * rnd()]; } },      // (a fifth of them high, 4.4 to 6.2 m down, where a rider who looks ahead finds them beside the bow)
    // the water to the right of the church: before the boat basin, and the lane between the skiffs and the houses
    { name: 'church right', n: 16, reach: 3.2, pick: () => (rnd() < 0.55 ? [120.5 + rnd() * 8.5, 3.6 + rnd() * 13.5, -5 - rnd() * 7] : [130 + rnd() * 20, 18.8 + rnd() * 3.6, -4.5 - rnd() * 7.5]) },
    // the passage to the left of the church (a rider who roams finds them there)
    { name: 'church left', n: 8, reach: 3.5, pick: () => { const s = 121 + rnd() * 26; return [s, -13.8 - rnd() * Math.max(1, hw(s) - 15.5), -5 - rnd() * 8]; } },
    // THE SQUARE'S OWN (second look, taken over). They hang in its open water as the street's do, and at the stroke they let
    // go with the roosting ones: they are given to the family as roosts that hang in mid-water (a resident cannot be let
    // go), and wander by this module's lines (LANTERN_WAY, aDpFree). Why: every ledge near the composed line in the square's
    // second half is 18 to 20 m down (stalls, lamps), and from there a lantern climbs for 36 s: a rider left to the current
    // had the ceiling come up astern, and at postcard 8's own place, looking ahead, six lanterns in the picture. These hang
    // 7 to 12 m down where the boat will be, and are under the surface 14 to 22 s after they let go: the page's "from t 20".
    //   the line: along the composed line through the square's second half, to the foot of the steps
    { name: 'line', free: true, n: 64, reach: 2.2, pick: () => { const s = 176 + rnd() * 37; return [s, -13 + rnd() * 18.5, Math.max(-7 - 5.5 * rnd(), F(s) + 3)]; } },
    //   the rest of the square: open water 22 m deep; more of them high than low; none in the tower, the plume, the hall or the terrace
    { name: 'square', free: true, n: 42, reach: 2.2, pick: () => [153 + rnd() * 52, -19 + rnd() * 47.5, -5 - 11 * Math.pow(rnd(), 1.35)] },
  ];
  for (const zn of zones) {
    let made = 0, tries = 0; zn.list = [];
    while (made < zn.n && tries++ < zn.n * 80) {
      const [s, d, y0] = zn.pick(), y = clamp(y0, -16, -4), [x, z] = town.xz(s, d), free = room.free(x, y, z);
      if (free < 1.5) continue;
      let near = false; for (const r of residents) if (Math.hypot(r.x - x, r.z - z) < 2.4 && Math.abs(r.y - y) < 1.6) { near = true; break; }
      if (near) continue;
      const p = { x, y, z, reach: clamp(free - 0.6, 0.9, zn.reach), zone: zn.name, free: !!zn.free }; residents.push(p); zn.list.push(p); made++;
    }
    if (made < zn.n) notes.push(`only ${made} of ${zn.n} residents found room in "${zn.name}"`);
    zn.list.forEach((p, i) => { p.rank = (i + 0.5) / Math.max(1, zn.list.length) + 1e-4 * zones.indexOf(zn); });
  }
  residents.sort((a, b) => a.rank - b.rank);
  // (where each roosting one lies once it is up is settled in buildLanterns, when the family has given every animal its own
  // spiral: each way is then tried as that animal will swim it)
  for (const p of roosts) { const l = Math.hypot(p.nx, p.nz) || 1; p.nx /= l; p.nz /= l; }
  return { roosts, residents: residents.filter((p) => !p.free), free: residents.filter((p) => p.free), room, sites: sites.map((s) => ({ name: s.name, found: s.found, taken: s.take, colonies: s.kept.length })), zones: zones.map((zn) => ({ name: zn.name, taken: zn.list.length })), tower: [tx, tz], notes };
}

/**
 * The lantern-jellies: makeCombJellies (the lights family), 560 at high quality (300 at medium, 200 at low: the page's
 * own numbers; 68 residents, 106 of the square's own, 386 on ledges), the carp among what disturbs them, wearing the town's water.
 * They are two of the family's systems, so that the half of the area that is out of sight costs nothing: `square` (every
 * one that lets go: the square's own and the roosting ones: the handle that is published, with every control) and
 * `street` (the residents of the street and round the church). A lantern is gone into the water by 50 m; each system is drawn only
 * while the boat is within reach of it.
 */
function buildLanterns(ctx, plan, shared, light, carp) {
  const L = { body: '#f3a77e', rim: '#4aa391', rib: '#7adcc6', glow: 1.4, edge: 1, ribGlow: 0.9, shimmer: 1.3, behind: 5, burn: 0.45, far: [34, 50], ...((plan.deep && plan.deep.lanterns) || {}) };
  const level = ctx.quality.level, total = Math.round(num('dpn', level === 'low' ? 200 : level === 'medium' ? 300 : 560));
  const P = lanternPlaces(ctx, plan, shared, light);
  for (const m of P.notes) note(m);
  // of 560: 68 residents (the street, round the church), 106 of the square's own in its open water (they let go at the
  // stroke), 386 on ledges; thinned alike at medium and low quality
  const nRes = Math.min(P.residents.length, Math.round(total * 68 / 560)), nFree = Math.min(P.free.length, Math.round(total * 106 / 560)), nRoost = Math.min(P.roosts.length, total - nRes - nFree);
  const residents = P.residents.slice(0, nRes), free = P.free.slice(0, nFree), ledge = P.roosts.slice(0, nRoost);
  const roosts = free.map((q) => ({ ...q, nx: 1, nz: 0, k: 0, post: true, site: 'free', colony: 'free:' + q.zone })).concat(ledge);
  // what disturbs them besides the hull: the old carp, where it is SEEN (the swimmers family draws a deep fish higher than
  // it is; the lanterns are drawn where they are, and must swing aside from the fish the rider sees)
  const seen = new THREE.Vector3(0, -1000, 0);
  const U = { uDpLan: { value: new THREE.Vector4(num('dpburn', L.burn), 0.1, num('dplevel', 1), 0) }, uDpFar: { value: new THREE.Vector2(num('dpfar0', L.far[0]), num('dpfar', L.far[1])) } };      // uDpLan x: the share of the water's swallowing a lantern takes; y: how much of what is behind it the body hides; z: its light's level. uDpFar: the metres over which a far lantern is gone
  const town = light.town, MID = num('dpmid', L.mid ?? 0.7);      // how much the middle of the square draws a risen lantern (in metres of room to its neighbours it will give up for it)
  const SPREAD = num('dpspread', 1), LIE = num('dplie', L.lie ?? 1.15);      // how far it may slant as it climbs (a share of the rule's); how far under the ceiling the deepest lie, metres
  const WAY = new THREE.Vector4(num('dpturn', L.turn ?? 0.3), num('dpwander', L.wander ?? 0.45), 0, 0);      // x: the most a spiral's turning may carry a lantern, m/s; y: how far a lying one wanders, m
  U.uDpWay = { value: WAY };
  // (second look, taken over) below how many metres a lantern is drawn as its light alone, and how strong that light is;
  // the glow in the water round each: strength, metres across, how far before the animal it stands, its share at arm's length
  const SOFT = L.soft || [2.4, 6.0, 0.62], GLOW = L.halo || {};
  { const v = list('dpsoft').map(Number); U.uDpSoft = { value: new THREE.Vector3(Number.isFinite(v[0]) ? v[0] : SOFT[0], Number.isFinite(v[1]) ? v[1] : SOFT[1], num('dpfarlight', SOFT[2])) }; }
  U.uDpFill = { value: num('dpfill', L.fill ?? 0.25) };      // how much of its light fills the jelly of a near one
  U.uDpGlow = { value: new THREE.Vector4(num('dphalo', GLOW.gain ?? 0.5), num('dphalosize', GLOW.size ?? 1.5), GLOW.push ?? 0.35, GLOW.near ?? 0.35) };
  U.uDpGlowCol = { value: new THREE.Color('#' + (Q.get('dphalocol') || (GLOW.color || '#ff815e').replace('#', ''))) };
  const CROWD = num('dpcrowd', GLOW.crowd ?? 2.2), sh = ctx.engine.shared;
  const system = (name, res, roo, seed) => {
    const handle = makeCombJellies(ctx, {
      residents: res.map((p) => [p.x, p.y, p.z]), roosts: roo.map((p) => [p.x, p.y, p.z]), exact: true, seed,
      roam: [0.5, 1.0],                                               // (a share of each one's own room: see below)
      // (its light in this water: see the log. The family's glow multiplies the warm light inside AND the jade of its edge:
      // the edge is given back what the glow adds, so that only the light inside is raised)
      body: '#' + (Q.get('dpbody') || L.body.replace('#', '')), rim: new THREE.Color('#' + (Q.get('dprimc') || L.rim.replace('#', ''))).multiplyScalar(num('dprim', L.edge) * 1.4 / num('dpglow', L.glow)), rib: '#' + (Q.get('dpribc') || L.rib.replace('#', '')),
      glow: num('dpglow', L.glow), ribGlow: num('dprib', L.ribGlow), shimmer: num('dpshimmer', L.shimmer), behind: num('dpbehind', L.behind),
      disturb: carp ? [{ position: seen, radius: num('dpshove', 1.9) }] : [],
    });
    const mesh = handle.object, geo = mesh.geometry, mat = mesh.material, n = handle.count;
    mesh.name = 'town-lantern-jellies-' + name;
    // each resident wanders as far as its own place has room (the family's reach is one range for all of them)
    { const way = geo.attributes.aWay.array;
      for (let i = 0; i < handle.residents; i++) {
        const R = res[i].reach; way[i * 4] *= R; way[i * 4 + 1] *= R; way[i * 4 + 2] /= R;
        // (and none faster than the page's 0.15 m/s, all three of its sways together: one with little room would else hurry)
        way[i * 4 + 2] = Math.min(way[i * 4 + 2], 0.15 / Math.hypot(way[i * 4], 0.83 * way[i * 4 + 1], 0.61 * way[i * 4 + 3]));
      }
      geo.attributes.aWay.needsUpdate = true; }
    // the way out of what it hangs on, for each roosting one; where each lies once it is up (a way, a distance, and how far
    // under the ceiling: settled below); and the clock time at which each was last put back on its roost
    const out = new Float32Array(n * 3), go = new Float32Array(n * 3), lie = new Float32Array(n * 2);
    roo.forEach((p, j) => { const i = handle.residents + j; if (p.k) { out[i * 3] = p.nx; out[i * 3 + 1] = p.nz; out[i * 3 + 2] = 1; } });
    const aGo = new THREE.InstancedBufferAttribute(go, 3), aLie = new THREE.InstancedBufferAttribute(lie, 2);
    geo.setAttribute('aDpOut', new THREE.InstancedBufferAttribute(out, 3)); geo.setAttribute('aDpGo', aGo); geo.setAttribute('aDpLie', aLie);
    const back = new Float32Array(n).fill(-1e9), aBack = new THREE.InstancedBufferAttribute(back, 1); aBack.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aDpBack', aBack);
    // the square's own, hanging in open water: how each wanders until it lets go (as the family has a resident wander: a
    // reach along x and z within its own room, a pace of 0.05 to 0.15 m/s, a little up and down; none faster than 0.15 m/s,
    // its three sways together)
    const fr = new Float32Array(n * 4);
    { const rf = ctx.rng(4300 + seed);
      roo.forEach((q, j) => {
        if (!q.free) return;
        const f = (handle.residents + j) * 4, R = Math.max(0.6, q.reach || 1), rx = (0.5 + 0.5 * rf()) * R, rz = rx * (0.55 + 0.45 * rf()), ry = 0.25 + 0.5 * rf(), pace = 0.05 + 0.1 * rf();
        fr[f] = rx; fr[f + 1] = rz; fr[f + 3] = ry; fr[f + 2] = Math.min(pace / rx, 0.13 / Math.hypot(rx, 0.83 * rz, 0.61 * ry));      // (0.13: the stir the family gives a roosting one rides on top)
      }); }
    geo.setAttribute('aDpFree', new THREE.InstancedBufferAttribute(fr, 4));
    let dressed = false;
    if (!RAW) {
      const vs = mat.vertexShader || '', fs = mat.fragmentShader || '';
      if (canWear(mat, ['vertexPars', 'vertexLocal', 'fragmentPars', 'fog', 'final']) && ['combCentre', 'aTimes', 'uClockJ', 'aSeed', 'aWay', 'uRiseJ', 'uSinkJ', 'aHome', 'uDisJ[4]', 'uTime'].every((w) => vs.includes(w)) && ['vJS', 'vJP', 'uBodyJ'].every((w) => fs.includes(w)) && mat.uniforms.uRiseJ && mat.uniforms.uSinkJ && mat.uniforms.uDisJ && mat.transparent && light.U.uTownWater && light.U.uTownPool && light.U.uTownVeil) {
        wear(mat, { uniforms: { ...U, uTownWater: light.U.uTownWater, uTownPool: light.U.uTownPool, uTownVeil: light.U.uTownVeil },
          vertexPars: LANTERN_PARS, vertexLocal: LANTERN_WAY,
          fragmentPars: 'uniform vec4 uTownWater, uTownPool, uTownVeil, uDpLan; uniform vec2 uDpFar; uniform vec3 uDpSoft; uniform float uDpFill; varying float vDpFade;', fog: LANTERN_FOG, final: LANTERN_FINAL });
        // its light is added, and what is behind it is dimmed by the alpha this module writes (the family dims it by one
        // constant colour, which cannot fail with distance: a far lantern was a dark egg)
        mat.blendSrc = THREE.OneFactor; mat.blendDst = THREE.OneMinusSrcAlphaFactor; mat.blendSrcAlpha = THREE.ZeroFactor; mat.blendDstAlpha = THREE.OneFactor;
        // (second look, taken over) The family's body writes its depth, so that the engine's water tints and swallows the animal
        // by its own depth. In this water that makes a hole: the water bends what lies beneath by the depth of water over
        // it, pixel by pixel, and the egg-shaped patch of shallower "ground" that a lantern leaves in the depth picture is
        // drawn apart from the water round it: wherever the standing water leaned (and since the light's holder raised its
        // tremor it leans everywhere), each lantern some metres down was its light on one side and an egg-shaped hole in
        // the street's light on the other, changing four times a second: a crescent, a comma, a petal tumbling. A lantern
        // is light in the water, not ground: it writes no depth here, wavers whole with the street it hangs over, and
        // the town's own water (LANTERN_FINAL) does its swallowing. &dpdepth=1: the family's way, to compare.
        if (!Q.has('dpdepth')) mat.depthWrite = false;
        dressed = true;
      } else note('the lights family\'s comb jelly material is not what this module expects: the lantern-jellies keep the family\'s own look (fogged as things in air, swallowed by the engine\'s water only) and the family\'s own spiral (those on walls wind it through the stone; risen, they lie over their eaves on one level)');
    }
    if (dressed && roo.length) {
      const times = geo.attributes.aTimes, tt = times.array, sdv = geo.attributes.aSeed.array, home = geo.attributes.aHome.array;
      const clock = mat.uniforms.uClockJ, rise = mat.uniforms.uRiseJ.value, sinkJ = mat.uniforms.uSinkJ.value, sharedT = ctx.engine.shared.uTime, base = handle.positionOf;
      const SM = (a, b2, x) => { const t = clamp((x - a) / (b2 - a), 0, 1); return t * t * (3 - 2 * t); };
      const climbOf = (o) => 1.2 + Math.max(rise.y - 0.22 * home[o + 3] - home[o + 1], 0) / Math.max(rise.x, 0.01);
      // THE SCRIPT'S SIDE OF LANTERN_WAY (change both or neither): what is added to the family's place for animal i, tau
      // seconds after it let go, at the realm's time t
      const wayOf = (i, tau, t, v) => {
        const o = i * 4, sd = sdv[o] * TAU, tc = climbOf(o), turn = (sdv[o + 1] < 0.5 ? -1 : 1) * (0.20 + 0.16 * sdv[o + 2]);
        const ang = sd + turn * (Math.min(tau, tc) + 0.25 * Math.max(tau - tc, 0)), grown = 1 - Math.exp(-tau / 5);
        const rho = tt[o + 3] * grown * (1 + 0.25 * Math.sin(tau * 0.7 + sd * 3)) + 0.014 * Math.max(tau - tc, 0);
        const S = SM(tc - 6, tc + 10, tau), R = lerp(Math.min(tt[o + 3], WAY.x / Math.abs(turn)) * grown, 0.18 + 0.22 * sdv[o], S);
        const g = go[i * 3 + 2] * SM(1, tc + 5, tau), w = out[i * 3 + 2] * 1.05 * R, k = R - rho;
        v.x = go[i * 3] * g + out[i * 3] * w + Math.cos(ang) * k + S * WAY.y * Math.sin(t * 0.14 + sd * 5);
        v.z = go[i * 3 + 1] * g + out[i * 3 + 1] * w + Math.sin(ang) * k + S * WAY.y * Math.sin(t * 0.105 + sd * 9);
        v.y = -lie[i * 2] * SM(tc - 5, tc + 3, tau);
        return v;
      };
      // (and the wander of one of the square's own: LANTERN_WAY's dW)
      const wanderOf = (i, tau, t, v) => {
        const f = i * 4; if (!(fr[f + 2] > 0)) return v.set(0, 0, 0);
        const sd = sdv[f] * TAU, tw = (t - Math.max(tau, 0)) * fr[f + 2], k = 1 - SM(0, climbOf(f) + 3, tau);
        return v.set(fr[f] * Math.sin(tw + sd * 1.3) * k, fr[f + 3] * Math.sin(tw * 0.61 + sd * 2.1) * k, fr[f + 1] * Math.sin(tw * 0.83 + sd * 2.9) * k);
      };
      const _w = new THREE.Vector3();
      handle.positionOf = (i, v = new THREE.Vector3()) => {
        base(i, v);
        const tau = clock.value - tt[i * 4], t = Math.fround(sharedT.value);
        if (fr[i * 4 + 2] > 0) { wanderOf(i, tau, t, _w); v.x += _w.x; v.y += _w.y; v.z += _w.z; }
        if (tau > 0) { wayOf(i, tau, t, _w); v.x += _w.x; v.y += _w.y; v.z += _w.z; }
        return v;
      };
      // ---- where each lies once it is up. One after another (in the order that thins evenly), each tries a handful of
      // places within its own reach (the deeper its roost, the longer its climb and the further it can slant: a fifth of a
      // metre sideways for each second of the climb), out from its wall; takes the one that stands furthest from the
      // places already taken (so the field fills evenly and no two lie together); and swims the way there in the script
      // first, as it will in the water, to see that it passes through nothing. The places are the same whoever rides:
      // nothing here knows where the boat is.
      {
        const room = P.room, rnd = ctx.rng(4200 + seed), taken = [], top0 = rise.y - 0.22;
        // (where it is tau seconds after letting go, without the wander: the family's climb, this module's way)
        const pathAt = (i, tau, v) => {
          const o = i * 4, gap = Math.max(rise.y - 0.22 * home[o + 3] - home[o + 1], 0), climb = rise.x * (tau - 1.2 * (1 - Math.exp(-tau / 1.2)));
          const up = -Math.log(Math.exp(-2.2 * climb) + Math.exp(-2.2 * gap)) / 2.2, sd = sdv[o] * TAU, tc = climbOf(o), turn = (sdv[o + 1] < 0.5 ? -1 : 1) * (0.20 + 0.16 * sdv[o + 2]);
          const ang = sd + turn * (Math.min(tau, tc) + 0.25 * Math.max(tau - tc, 0)), S = SM(tc - 6, tc + 10, tau), R = lerp(Math.min(tt[o + 3], WAY.x / Math.abs(turn)) * (1 - Math.exp(-tau / 5)), 0.18 + 0.22 * sdv[o], S);
          const g = go[i * 3 + 2] * SM(1, tc + 5, tau), w = out[i * 3 + 2] * 1.05 * R;
          return v.set(home[o] + go[i * 3] * g + out[i * 3] * w + Math.cos(ang) * R, home[o + 1] + up - lie[i * 2] * SM(tc - 5, tc + 3, tau), home[o + 2] + go[i * 3 + 1] * g + out[i * 3 + 1] * w + Math.sin(ang) * R);
        };
        const clearWay = (i) => {
          const o = i * 4, tc = climbOf(o);
          for (let tau = 3; tau < tc + 9; tau += 2.2) {
            pathAt(i, tau, _w);
            if (out[i * 3 + 2] > 0 && (_w.x - home[o]) * out[i * 3] + (_w.z - home[o + 2]) * out[i * 3 + 1] < 1.2) continue;      // (beside its own wall, which its way out keeps it clear of)
            if (room.free(_w.x, _w.y, _w.z, 0.6) < 0.15) return false;
          }
          return true;
        };
        let stayed = 0;
        for (let j = 0; j < roo.length; j++) {
          const i = handle.residents + j, o = i * 4, pl = roo[j], gap = Math.max(top0 - home[o + 1], 0), reach = clamp(1 + 0.22 * (1.2 + gap / 0.55), 1.5, 9) * SPREAD;
          lie[i * 2] = LIE * Math.pow(rnd(), 1.7);
          const cands = [], a0 = Math.atan2(pl.nz, pl.nx);
          for (let q = 0; q < 14; q++) {
            const a = a0 + (rnd() * 2 - 1) * (pl.post ? Math.PI : 1.35), d = reach * Math.sqrt(0.03 + 0.97 * rnd()), cx = Math.cos(a), cz = Math.sin(a);      // (out from its wall, fanned by up to 77 degrees either way; from a post, any way)
            const off = pl.free ? 0 : 0.32, x = home[o] + cx * d + pl.nx * off, z = home[o + 2] + cz * d + pl.nz * off;
            if (room.free(x, top0 - lie[i * 2], z, 1.0) < 1.0) continue;
            let near = 9; for (const r of taken) { const dd = Math.hypot(r[0] - x, r[1] - z); if (dd < near) near = dd; }
            // (and the open middle of the square, where the composed line runs, draws them a little: the lights gather over the
            // deepest water. A place, not the boat: it is the same field wherever the rider is)
            const q = town.sd(x, z), mid = q.s > 156 && q.s < 199 ? MID * Math.exp(-(q.d + 2) * (q.d + 2) / 60) : 0;
            cands.push({ cx, cz, d, x, z, score: Math.min(near, 2.6) - 0.03 * d + mid + rnd() * 0.05 });
          }
          cands.sort((p1, p2) => p2.score - p1.score);
          let best = null;
          for (const c of cands.slice(0, 4)) { go[i * 3] = c.cx; go[i * 3 + 1] = c.cz; go[i * 3 + 2] = c.d; if (clearWay(i)) { best = c; break; } }
          if (!best) { const off = pl.free ? 0 : 0.32; go[i * 3] = pl.nx; go[i * 3 + 1] = pl.nz; go[i * 3 + 2] = 0; stayed++; taken.push([home[o] + pl.nx * off, home[o + 2] + pl.nz * off]); } else taken.push([best.x, best.z]);
          pl.rest = taken[taken.length - 1];
        }
        aGo.needsUpdate = true; aLie.needsUpdate = true;
        handle.rest = taken; handle.stayed = stayed;
      }
      // those that have sunk out of sight are put back on their roosts (see LANTERN_WAY, "Gone, and home again")
      handle.home = () => {
        const T = clock.value; let any = false;
        for (let i = handle.residents; i < n; i++) {
          const tau = T - tt[i * 4]; if (!(tau > 0)) continue;
          if (Math.max(tau - climbOf(i * 4) - rise.z - tt[i * 4 + 2], T - sinkJ.x - tt[i * 4 + 2] * sinkJ.y) > 44) { tt[i * 4] = 1e9; back[i] = T; any = true; }
        }
        if (any) { times.needsUpdate = true; aBack.needsUpdate = true; }
      };
    }
    // the light each throws into the water round it (GLOW_VERT): one soft glow for each, put where the animal is DRAWN every
    // frame (one pass over the animals on the processor: its place as the family and this module have it, the carp's shove)
    if (dressed && U.uDpGlow.value.x > 0) {
      const tt = geo.attributes.aTimes.array, home = geo.attributes.aHome.array, clock = mat.uniforms.uClockJ, rise = mat.uniforms.uRiseJ.value, sinkJ = mat.uniforms.uSinkJ.value, dis = mat.uniforms.uDisJ.value;
      const at = new Float32Array(n * 4), aAt = new THREE.InstancedBufferAttribute(at, 4); aAt.setUsage(THREE.DynamicDrawUsage);
      const pg = new THREE.PlaneGeometry(1, 1), gg = new THREE.InstancedBufferGeometry();
      gg.index = pg.index; gg.setAttribute('position', pg.attributes.position); gg.setAttribute('aDpAt', aAt); gg.instanceCount = n;
      const gm = new THREE.ShaderMaterial({
        uniforms: { uDpLan: U.uDpLan, uDpFar: U.uDpFar, uDpGlow: U.uDpGlow, uDpGlowCol: U.uDpGlowCol, uTownWater: light.U.uTownWater, uTownPool: light.U.uTownPool, uTownVeil: light.U.uTownVeil, uCameraPos: sh.uCameraPos, uFogDensity: sh.uFogDensity, uVeil: sh.uVeil },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG });
      const glow = new THREE.Mesh(gg, gm); glow.frustumCulled = false; glow.renderOrder = -2; glow.name = 'town-lantern-glow-' + name; glow.layers.set(1);      // (direct view only: nothing under the surface is in the mirror)
      ctx.add(glow);
      // where they hang together each one's glow is thinned: a colony of twelve is one warm light, not twelve laid on one another
      const crowd = new Float32Array(n).fill(1);
      roo.forEach((p, j) => { let k = 0; for (const q of roo) if (q !== p && Math.abs(q.y - p.y) < 0.9 && Math.hypot(q.x - p.x, q.z - p.z) < 0.9) k++; crowd[handle.residents + j] = Math.min(1, CROWD / (1 + k)); });
      const SMf = (a, b2, x) => { const t = clamp((x - a) / (b2 - a), 0, 1); return t * t * (3 - 2 * t); }, _g = new THREE.Vector3();
      // A PLAINER MESH WHILE EVERY ONE OF THEM IS DEEP (second look, taken over). The family's lantern is 320 triangles (192
      // at low quality), right at arm's length; the page counted 120, and 560 of them were 179,000 triangles in view where
      // it planned 67,000. Until the stroke every lantern is metres down, drawn as its light alone or nearly (LANTERN_FINAL),
      // and no eye can tell sixteen meridians from eight: every other meridian and every other ring of the family's own
      // mesh, the same vertices (96 triangles, 64 at low quality: 54,000 in view for all of them). From the moment one lets
      // go until the last is home again, and for an eye under the water (a crane), the family's whole mesh.
      const fullIndex = geo.index; let plainIndex = null, midIndex = null;
      { const nv = geo.attributes.position.count, COLS = 16, rings = fullIndex ? (fullIndex.count / 3 - 2 * COLS) / (2 * COLS) + 1 : 0;
        if (!Q.has('dpfull') && Number.isInteger(rings) && rings >= 4 && nv === 1 + rings * (COLS + 1) + (COLS + 1) + 1) {
          const R = (j, i) => 1 + j * (COLS + 1) + i, lip = (i) => 1 + rings * (COLS + 1) + i, throat = nv - 1, keep = [], idx = [];
          for (let j = 0; j < rings; j += 2) keep.push(j);
          if (keep[keep.length - 1] !== rings - 1) keep.push(rings - 1);
          for (let i = 0; i < COLS; i += 2) idx.push(0, R(0, i + 2), R(0, i));
          for (let q = 0; q < keep.length - 1; q++) for (let i = 0; i < COLS; i += 2) { const a = R(keep[q], i), b = R(keep[q], i + 2), c = R(keep[q + 1], i), d = R(keep[q + 1], i + 2); idx.push(a, b, c, b, d, c); }
          for (let i = 0; i < COLS; i += 2) idx.push(throat, lip(i), lip(i + 2));
          plainIndex = new THREE.BufferAttribute(new Uint16Array(idx), 1);
          geo.setIndex(plainIndex);
          // A MIDDLE MESH WHILE THEY ARE OUT (critique, stage 6). The whole mesh for every one of them from the moment the
          // first lets go was the area's heaviest step: 252,000 triangles a frame more at the stroke, in a view that
          // already stood at 1.74 million. Every meridian and every other ring: 192 triangles, which is the family's own
          // lantern at low quality, round in outline at arm's length (.shots/town_crit_lan_mid_crop.png against
          // town_crit_lan_full_crop.png). The whole mesh is kept for an eye under the water. &dpmid=0: as it was.
          if (Q.get('dpmid') !== '0' && rings >= 10) { const idm = [];      // (not at low quality, where the family's own mesh is already this one: half of that would show its bands)
            for (let i = 0; i < COLS; i++) idm.push(0, R(0, i + 1), R(0, i));
            for (let q = 0; q < keep.length - 1; q++) for (let i = 0; i < COLS; i++) { const a = R(keep[q], i), b = R(keep[q], i + 1), c = R(keep[q + 1], i), d = R(keep[q + 1], i + 1); idm.push(a, b, c, b, d, c); }
            for (let i = 0; i < COLS; i++) idm.push(throat, lip(i), lip(i + 1));
            midIndex = new THREE.BufferAttribute(new Uint16Array(idm), 1); }
        } }
      handle.plain = !!plainIndex;
      handle.glow = glow;
      handle.glowUpdate = () => {
        const T = clock.value; let anyOut = false;
        for (let i = 0; i < n; i++) {
          handle.positionOf(i, _g);
          const o = i * 4, tau = T - tt[o]; let lv = 1;
          if (tau > 0) anyOut = true;
          if (i >= handle.residents) {
            lv = SMf(0, 6, T - back[i]);                               // (as the animal itself: vDpFade in LANTERN_WAY)
            if (tau > 0) {
              const tc = 1.2 + Math.max(rise.y - 0.22 * home[o + 3] - home[o + 1], 0) / Math.max(rise.x, 0.01);
              const ts = Math.max(tau - tc - rise.z - tt[o + 2], T - sinkJ.x - tt[o + 2] * sinkJ.y, 0);
              lv *= (1 - SMf(18, 40, ts)) * lerp(crowd[i], 1, SMf(2, 14, tau));
            } else lv *= crowd[i];
          }
          // the carp shoulders it aside (the vertex shader's dpShove, at the place it is drawn)
          let sx = 0, sy = 0, sz = 0;
          for (let k = 0; k < dis.length; k++) {
            const dz = dis[k]; if (!(dz.w > 0)) continue;
            const dx = _g.x + sx - dz.x, dy = _g.y + sy - dz.y, dzz = _g.z + sz - dz.z, dl = Math.max(Math.hypot(dx, dy, dzz), 0.05);
            if (dl > dz.w * 2.2) continue;
            const f = dz.w * 0.7 * (1 - SMf(dz.w * 0.5, dz.w * 2.2, dl)) / dl; sx += dx * f; sy += dy * f; sz += dzz * f;
          }
          if (tau > 0) sy = Math.min(sy, Math.max(rise.y - 0.22 * home[o + 3] - _g.y, 0));
          at[o] = _g.x + sx; at[o + 1] = _g.y + sy; at[o + 2] = _g.z + sz; at[o + 3] = lv;
        }
        aAt.needsUpdate = true;
        if (plainIndex) { const want = sh.uCameraPos.value.y < 0 ? fullIndex : anyOut ? (midIndex || fullIndex) : plainIndex; if (geo.index !== want) geo.setIndex(want); }
      };
    }
    handle.dressed = dressed;
    return handle;
  };
  const resSq = [], resSt = residents;
  const handle = system('square', resSq, roosts, 77), street = resSt.length ? system('street', resSt, [], 78) : null;
  if (street) street.onStartle = (x, y, z, i) => { if (handle.onStartle) handle.onStartle(x, y, z, i); };
  // where each system's animals are, along the route (for drawing it only while the boat is within reach)
  const span = (list) => { let a = 1e9, b = -1e9; for (const p of list) { const s = light.town.sd(p.x, p.z).s; if (s < a) a = s; if (s > b) b = s; } return [a, b]; };
  const st = { at: -1, count: 0, depth: 0 };
  Object.assign(handle, {
    street, systems: street ? [handle, street] : [handle], total: handle.count + (street ? street.count : 0),
    spans: [span(resSq.concat(roosts)), street ? span(resSt) : null], reach: U.uDpFar.value.y + 3,
    places: { residents, roosts, free, ledge }, sites: P.sites, zones: P.zones, tower: P.tower, level: U.uDpLan.value, far: U.uDpFar.value, hide: L.hide ?? 0.06, soft: U.uDpSoft.value, glowLevel: U.uDpGlow.value,
    /** The page's letting go: each roosting lantern lets go as a ring that left `from` ([x, z]: the tower) at clock time `at`, at `speed` m/s, reaches it; up to `rag` seconds late. */
    releaseBehind({ at = 6, speed = 10, rag = 1, from = P.tower } = {}) { return handle.release((x, y, z) => at + Math.hypot(x - from[0], z - from[1]) / speed, rag); },
    /** How many lie shallower than `depth` metres now (the page's `shimmer` layer follows it; 2.2: every one that lies under the surface, the deepest of the layer too); counted at most four times a second. */
    risen(depth = 2.2) {
      const t = ctx.time;
      if (t - st.at > 0.25 || t < st.at || depth !== st.depth) { let k = 0; handle.nearSurface(depth, () => { k++; }); st.at = t; st.count = k; st.depth = depth; }
      return st.count;
    },
  });
  handle.seen = seen;
  return handle;
}

// ====================================================================================================== the module
export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const light = ensureLight(ctx, plan, shared), town = light.town, env = {};
  const made = {};
  if (want('carp')) {
    try { made.carp = await buildCarp(ctx, plan, shared, light, env); } catch (e) { note('the carp could not be made: ' + (e && e.message)); }
    if (made.carp) {
      shared.cast.carp = made.carp;
      // the fish keep clear of it (the Fish group's own rule: ribbons part, the lime's fry lift off)
      const F = shared.cast.fishes;
      if (F && typeof F.threat === 'function') { try { made.carp.threat = F.threat(made.carp.body, { radius: 1.6, scare: false, fry: true }); } catch (e) { note('the fish could not be told of the carp: ' + (e && e.message)); } }
    }
  }
  if (want('lanterns')) {
    try { made.lanterns = buildLanterns(ctx, plan, shared, light, made.carp); } catch (e) { note('the lantern-jellies could not be made: ' + (e && e.message)); }
    if (made.lanterns) shared.cast.lanterns = made.lanterns;
  }

  // ---- a developer's crane (pictures only): the eye moved in the boat's own frame
  if (Q.has('dpcam') && ctx.engine && ctx.engine.camera) { const v = Q.get('dpcam').split(',').map(Number); ctx.engine.camera.position.set(v[0] || 0, v[1] || 0, v[2] || 0); }
  // ---- beads along the routes and at the lanterns' places (pictures only)
  { const names = list('dpmarks'), carp = made.carp, lan = made.lanterns, pts = [], v = new THREE.Vector3();
    if (names.length) {
      if (carp) for (const name of names) { const r = carp.routes[name]; if (!r) continue;
        for (let s = 0; s <= r.length; s += 1) { r.at(s, v); pts.push([v.x, v.y, v.z, s % 5 === 0 ? 0.16 : 0.07, '#ff5a4a']); }
        for (const p of r.points) pts.push([p[0], p[1], p[2], 0.2, '#ffffff']); }
      if (lan && names.includes('roosts')) { const COL = { tower: '#ffd060', hall: '#60ffd0', terrace: '#ff70c0', stalls: '#70a0ff', lamps: '#ffffff', eaves: '#c0ff60', fountain: '#ff9040', free: '#ff3030' }; for (const p of lan.places.roosts) pts.push([p.x, p.y, p.z, 0.12, COL[p.site] || '#ff0000']); }
      if (lan && names.includes('residents')) for (const p of lan.places.residents) pts.push([p.x, p.y, p.z, 0.2, '#ff3030']);
    }
    if (pts.length) {
      const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ fog: false }), pts.length), M = new THREE.Matrix4(), col = new THREE.Color();
      pts.forEach((p, i) => { mesh.setMatrixAt(i, M.makeScale(p[3], p[3], p[3]).setPosition(p[0], p[1], p[2])); mesh.setColorAt(i, col.set(p[4])); });
      mesh.frustumCulled = false; mesh.name = 'dp-marks'; ctx.add(mesh); ctx.only(mesh, 'direct');
    } }
  if (made.lanterns && (Q.get('dplog') || '').includes('lanterns')) {
    const L = made.lanterns;
    note(`lanterns: ${L.total} (${L.places.residents.length} residents of the street, ${L.places.free.length} of the square's own in open water, ${L.places.ledge.length} roosting on ledges; the square's system ${L.count}, the street's ${L.street ? L.street.count : 0}), town's water ${L.dressed ? 'laid in' : 'NOT laid in'}; roosts found/taken (colonies): ${L.sites.map((s) => `${s.name} ${s.found}/${s.taken} (${s.colonies})`).join(', ')}; ${L.stayed || 0} found no way to a place of their own and lie over their roosts; residents found: ${L.zones.map((z) => `${z.name} ${z.taken}`).join(', ')}`);
  }

  // &dplog=arrivals: when each site's lanterns are under the surface if they let go behind the page's ring (from the tower at
  // clock time 6, 10 m/s, half a second late on average), at the family's 0.55 m/s: for the staging's timing
  if (made.lanterns && (Q.get('dplog') || '').includes('arrivals')) {
    const L = made.lanterns, by = {};
    for (const q of L.places.roosts) { const t = 6.5 + Math.hypot(q.x - L.tower[0], q.z - L.tower[1]) / 10 + 1.2 + Math.max(-0.82 - q.y, 0) / 0.55, k = q.site === 'free' ? 'own:' + q.zone : q.site; (by[k] = by[k] || []).push(t); }
    note('lanterns under the surface, by site (seconds on the stroke\'s clock: first, middle, last; how many): ' + Object.keys(by).map((k) => { const a = by[k].sort((x, y) => x - y); return `${k} ${a[0].toFixed(0)} ${a[a.length >> 1].toFixed(0)} ${a[a.length - 1].toFixed(0)} (${a.length})`; }).join('; '));
  }

  // &dpdump=<name>.json: where every lantern lives and where each roosting one lies when it is up, as [s, d, ...] (written
  // to .shots/ by the dev server: for maps)
  if (made.lanterns && Q.get('dpdump')) {
    const L = made.lanterns, r2 = (v) => Math.round(v * 100) / 100, sdOf = (x, z) => { const q = town.sd(x, z); return [r2(q.s), r2(q.d)]; };
    const data = { roosts: L.places.roosts.map((p) => [...sdOf(p.x, p.z), r2(p.y), p.site, p.colony, ...(p.rest ? sdOf(p.rest[0], p.rest[1]) : [null, null])]), residents: L.places.residents.map((p) => [...sdOf(p.x, p.z), r2(p.y), p.zone, r2(p.reach)]) };
    try { fetch('/__shot/' + Q.get('dpdump'), { method: 'POST', body: JSON.stringify(data) }).catch(() => {}); } catch (e) { /* no dev server: nothing to write to */ }
  }

  const PLAY = list('dpplay'); let played = !PLAY.length;
  // (a clock of this module's own, for trying the lanterns' controls without a staging: it runs only with &dpplay or &dprisen)
  const T0 = num('dpt', 0), ownClock = !!made.lanterns && (Q.has('dprisen') || PLAY.some((w) => w === 'release' || w === 'sinkback'));
  if (ownClock && Q.has('dprisen')) { made.lanterns.tick(T0); made.lanterns.releaseAll(T0 - num('dprisen', 40)); }
  const play = (what, c) => {
    const carp = made.carp, lan = made.lanterns, o = {};
    if (Q.has('dpin')) o.in = num('dpin', 4); if (Q.has('dpat')) o.at = num('dpat', 0); if (Q.has('dpforce')) o.force = true;
    if (carp && (what === 'street' || what === 'under' || what === 'stroke' || what === 'shallow')) carp.go(what, o);
    else if (carp && what === 'rise') carp.rise();
    else if (carp && what === 'sink') carp.sink(num('dpsink', 1.5), 4);
    else if (lan && what === 'release') lan.releaseBehind({ at: T0 + c.time + num('dpwait', 0.3), speed: num('dpspeed', 10) });
    else if (lan && what === 'sinkback') lan.sink(T0 + c.time + num('dpsinkat', 20), 20);
  };
  // &dpabeam: the carp on its patrol abeam of the boat (the nearest point of the patrol to the boat, plus so many metres)
  let abeam = Q.has('dpabeam'), put = Q.get('dpput'), logAt = 0, homeAt = 0;
  const ALLSYS = Q.has('dpall');      // (&dpall=1: both systems drawn wherever the boat is)
  const LOGL = (Q.get('dplog') || '').includes('lanterns'), EVERY = num('dpevery', 4), SPEEDS = (Q.get('dplog') || '').includes('speeds'); let spWas = null, spT = 0, spAt = 0;
  return {
    update(dt, c) {
      if (abeam && made.carp) { abeam = false;
        const r = made.carp.routes.patrol, v = new THREE.Vector3(); let best = 1e9, at = 0;
        for (let s = 0; s < r.length; s += 0.5) { r.at(s, v); const d2 = (v.x - c.boat.x) ** 2 + (v.z - c.boat.z) ** 2; if (d2 < best) { best = d2; at = s; } }
        made.carp.swim(r, { jump: true, from: at + num('dpabeam', 0) });
      }
      if (put && made.carp) { const [name, m] = put.split(':'), r = made.carp.routes[name]; put = null; if (r) made.carp.swim(r, { jump: true, from: +m || 0, onDone: name === 'patrol' ? null : made.carp.back }); }
      if (!played && c.time > 0.5) { played = true; for (const w of PLAY) play(w, c); }
      if (made.carp) made.carp.update(dt, c);
      const L = made.lanterns;
      if (L) {
        // the carp, where the rider sees it (the lanterns swing aside from that fish, not from the place 1.7 m under it)
        const carp = made.carp;
        if (carp && carp.swimmers[0].active) { const m = carp.parts.mid; L.seen.set(m.x, seenY(ctx, m.x, m.y, m.z, carp.handle.lift ?? 1.2), m.z); } else L.seen.set(0, -1000, 0);
        // how much of what is behind it a clear body hides: the family's own number for this water, as one share
        // (a body that writes its depth must dim what shows through it, or the engine's water shows the street behind it as if
        // it lay only as deep as the animal: the family's number. One that writes none, as here, hides only what jelly hides)
        const bc = L.object.material.blendColor; if (Q.has('dptoll')) L.level.y = num('dptoll', 0.1); else if (bc && L.object.material.depthWrite) L.level.y = clamp(1 - (bc.r + bc.g + bc.b) / 3, 0, 0.5); else L.level.y = L.hide;
        if (ownClock) L.tick(T0 + c.time);
        if (L.home && c.time >= homeAt) { homeAt = c.time + 0.5; L.home(); }
        // each system is drawn only while the boat is within reach of some animal of it (a lantern is gone into the water by 50 m)
        { const bs = light.town.sd(c.boat.x, c.boat.z).s; L.systems.forEach((h, k) => { const sp = L.spans[k]; h.object.visible = !!sp && (ALLSYS || (bs > sp[0] - L.reach && bs < sp[1] + L.reach)); if (h.glow) { h.glow.visible = h.object.visible; if (h.glow.visible) h.glowUpdate(); } }); }
        if (SPEEDS && c.time >= spAt) {      // (how fast they go: every one's travel over a second: the street's residents, the square's own, the roosting kind)
          const v = new THREE.Vector3(), S = L.street, nS = S ? S.count : 0, nF = L.places.free.length, now = new Float32Array((L.count + nS) * 3);
          for (let i = 0; i < L.count; i++) { L.positionOf(i, v); now[i * 3] = v.x; now[i * 3 + 1] = v.y; now[i * 3 + 2] = v.z; }
          for (let i = 0; i < nS; i++) { S.positionOf(i, v); const o = (L.count + i) * 3; now[o] = v.x; now[o + 1] = v.y; now[o + 2] = v.z; }
          if (spWas) { const dt2 = c.time - spT, say = (a, b, name) => { const sp = []; for (let i = a; i < b; i++) sp.push(Math.hypot(now[i * 3] - spWas[i * 3], now[i * 3 + 1] - spWas[i * 3 + 1], now[i * 3 + 2] - spWas[i * 3 + 2]) / dt2); if (!sp.length) return `${name}: none`; sp.sort((x, y) => x - y); return `${name}: median ${sp[Math.floor(sp.length / 2)].toFixed(3)}, nine in ten under ${sp[Math.floor(sp.length * 0.9)].toFixed(3)}, fastest ${sp[sp.length - 1].toFixed(3)} m/s`; };
            note(`lantern speeds t ${c.time.toFixed(1)}: ${say(L.count, L.count + nS, "the street's residents")}; ${say(0, nF, "the square's own")}; ${say(nF, L.count, 'the roosting kind')}`); }
          if (spWas) { spWas = null; spAt = c.time + Math.max(0, EVERY - 1); } else { spWas = now; spT = c.time; spAt = c.time + 1; }
        }
        if (LOGL && c.time >= logAt) { logAt = c.time + EVERY; let lo = 0, hi = -99; const v = new THREE.Vector3(); for (let i = L.residents; i < L.count; i++) { L.positionOf(i, v); if (v.y > hi) hi = v.y; if (v.y > -1.2) lo++; } let away = 0; { const tt = L.object.geometry.attributes.aTimes.array; for (let i = L.residents; i < L.count; i++) if (tt[i * 4] < 1e8) away++; } note(`lanterns t ${c.time.toFixed(1)}: ${away} off their roosts, ${lo} of them within 1.2 m of the surface (risen() says ${L.risen()}), the highest at y ${hi.toFixed(2)}`); }
      }
    },
  };
}
