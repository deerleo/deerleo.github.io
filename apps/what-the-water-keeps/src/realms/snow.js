// The orchard in snow (area 6): docs/art/snow.md is what is built here, docs/building-an-area.md is how.
// A frozen flood before dawn, drawn in ink on white paper: a bare orchard stands in falling snow, and the one black
// thing in the picture, the water, still shows the same trees in blossom with the lamp alight.
//
// This file is the realm: its waterway, its look, its water, its sound, and the list of modules that build it
// (src/realms/snow/). Every number comes from src/realms/snow/plan.js: read its header first, because the page's (s, d)
// and the engine's path (s, d) are two different things from s 58 on (the path is the composed line: a metre right of the
// orchard's centre line, then left of the lamp and round the islet).
//
//   set       the place and its light: the two skies, the land, the cave, far things, fog, the light states, the water
//             and its black road, the snowfall (light.js: the area's light, its materials, the mirror's own evening)
//   heroes    the monument: the oldest tree bare and under snow, the same tree in blossom in the water, the two lamps
//   heroes_b  the other hero pieces: the cliff, the bridge, the outlier, the stumps, what was left for the night
//   kit       the orchard's trees (wood, snow, and blossom in the water), birches, pollards, fence, shelf, pans, small things
//   cast      everything alive (stage 3)
//   stage     the route of moments and the showstopper (stage 4)
//
// THREE WORDS, used strictly (page): WINTER = drawn only in the direct view (ctx.only(obj, 'direct')); MEMORY = drawn
// only in the water's reflection (ctx.only(obj, 'mirror')); SHARED = drawn in both. One object on the wrong layer
// spoils the area.
//
// Developer switches (besides the engine's): &labels=1 names every stand-in; &only=set,kit / &skip=cast;
//   &layer=winter | memory | shared   shows one layer alone (the page's debug key): winter = what only the direct view
//                       has, memory = what only the water has (shown above the water too, so that it can be looked at),
//                       shared = what both have
//   &state=cave | birch | plain | thaw   holds one light state wherever the boat is
//   &snow=0             no snowfall (to look at the geometry)
//   &proof=1            adds the proof of the lying mirror: one bare tree at (124, +5), in blossom in the water
//   &lamp=hero          hangs the remodelled kept lamp (src/engine/lamp-hero.js); the area takes it by itself the day
//                       lamp.js becomes that file
//   &mirror=1.25        another resolution for the water's mirror (look.mirrorScale; the area runs at 1)
//   &stroke=0           the lit lamp without the area's own stroke of light (as the water alone gives it back)
//   &counts=1           writes what every object of the area weighs (triangles, instances, layer) to .shots/snow_counts.json
//   &w=key:value,...    overrides the water's look for one picture (numbers and #colours; a dot reaches into skin):
//                       &w=mirror:0.75,streak:2,skin.width:1,deep:%23101020
//   &navlog=<name>.json writes where the boat went during &t seconds (with &drift=1) to .shots/
import { buildModules } from '../engine/modules.js';
import { PLAN } from './snow/plan.js';
import { LOOK, MIRROR_TINT } from './snow/light.js';

const W = PLAN.water, ST = PLAN.light.states;
const QS = new URLSearchParams(location.search), NAV = /^[\w-]+\.json$/.test(QS.get('navlog') || '') ? QS.get('navlog') : null, NAV_T = Math.min(60, +(QS.get('t') || 2));
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export default {
  id: 'snow', name: 'The orchard in snow',
  path: PLAN.path,
  look: {
    // the rower (src/engine/rower.js): under this flat paper light her own warm colours stood in the picture like a cut-out;
    // one cool tone over her and less of her own colour, so that she is a figure in the snow light
    rower: { tone: '#C6C4DA', own: 0.28 },
    ...LOOK,
    background: PLAN.light.background,
    fog: { ...ST.plain.fog },                        // (set.js gives every light state its own, as it must be drawn to be seen)
    veil: PLAN.light.veil,
    current: 2.0, currentNarrow: 2.0,                // (set.js sets both every frame from the boat's place: PLAN.current)
    ...(Number.isFinite(parseFloat(QS.get('mirror'))) ? { mirrorScale: parseFloat(QS.get('mirror')) } : {}),      // &mirror=1.25 (developer): another resolution for the water's mirror
  },
  water: {
    deep: W.deep, shallow: W.shallow,
    reflectivity: W.reflectivity, fresnel: W.fresnel, reflectFloor: W.reflectFloor, roughness: W.roughness,
    waveHeight: W.waveHeight, waveScale: W.waveScale, waveSpeed: W.waveSpeed, streak: W.streak, mirror: W.mirror,
    sparkle: W.sparkle, foam: W.foam, wake: W.wake, opacity: W.opacity, rippleLife: W.rippleLife,
    rain: W.rain, rainStrength: 0.1,                 // pin rings: about one for every flake that lands, a tenth of rain's weight
    // the mirror that lies: the water lays the remembered evening down as a dusk (light.js), a little richer
    reflectionTint: MIRROR_TINT, mirrorDarken: 0, mirrorSaturate: 0,
    // skin ice, wall to wall; set.js keeps the black road open in it. (Its picture, `skin_ice`, is the kit builder's.)
    skin: { amount: 1, kind: 'ice', scale: W.skin.scale, close: W.skin.close, lead: W.skin.lead, width: W.skin.width, plate: W.skin.plate, sheen: W.skin.sheen, tint: W.skin.tint, light: 1 },
    trace: { texel: 0.125, margin: 6 },
  },
  audio: {
    // after the sea, no room at all: everything dry, close and dulled (page section 8). The bed is the hull's water,
    // snow falling (shimmer), a breath of air (wind: there so that its going is heard) and the ice by stretch. `ice`,
    // `falls` and the space go by distance in update() below; stage.js moves the rest: the bed to half for the owl,
    // shimmer with the fireflies' front, `rain` 0.3 for the fall, `drone` (A3, at most 0.25) at the hives, and the
    // music opened (width 0.8, gain 0.65, reverb 0.12) from T+19 of the showstopper.
    // Measured (lab/audio-test.html's mix test, docs/build/snow/4-staging.md): the plain -26.0 dBFS RMS, peak -7.5;
    // the fall -25.9, peak -7.8; the thaw with everything up -23.5, peak -6.7; nothing clipped.
    music: { gain: 0.5, lowpass: 900, reverb: 0, width: 0.3 },
    space: { size: 'open', mix: 0, lowpass: 2500 },
    ambience: { water: 0.45, shimmer: 0.25, ice: { level: 0, rate: 0.15 }, wind: { level: 0.2, tone: 0.2 }, rain: 0, drone: { level: 0, notes: [57], colour: 0.2 } },
  },

  async build(ctx) {
    // &w=key:value,... (developer): the water's look, overridden before the light states take their copies of it
    for (const kv of (QS.get('w') || '').split(',').filter(Boolean)) {
      const [k, v] = kv.split(':'), keys = k.split('.'), last = keys.pop(); let o = ctx.waterLook;
      for (const key of keys) o = o && o[key];
      if (!o || !(last in o)) { console.warn(`snow: &w= knows no water key '${k}'`); continue; }
      if (o[last] && o[last].isColor) o[last].set(v); else if (Number.isFinite(+v)) o[last] = +v;
    }
    ctx.state.colliders = PLAN.colliders();
    for (const c of ctx.state.colliders) ctx.addCollider(c);
    await buildModules(ctx, PLAN, [
      ['set', () => import('./snow/set.js')],
      ['heroes', () => import('./snow/heroes.js')],
      ['heroes_b', () => import('./snow/heroes_b.js')],
      ['heroes_river', () => import('./snow/heroes_river.js')],
      ['trees', () => import('./snow/kit_trees.js')],      // the flood orchard's wood, this area's snow on it (before `kit`: it publishes shared.orchard)
      ['memory', () => import('./snow/memory.js')],        // the avenue in the water: the flood orchard's own blossom on the Trees group's wood, mirror only (the Light group's; after `trees`)
      ['close', () => import('./snow/kit_close.js')],      // the avenue's close band: cow parsley in winter, apples, ice collars, drifts, labels
      ['kit', () => import('./snow/kit.js')],
      ['kit_margins', () => import('./snow/kit_margins.js')],
      ['cast', () => import('./snow/cast.js')],
      ['cast_ice', () => import('./snow/cast_ice.js')],      // the cast: ice (docs/build/snow/3-cast-ice.md)
      ['cast_birds', () => import('./snow/cast_birds.js')],      // the cast: birds (docs/build/snow/3-cast-birds.md)
      ['cast_owl', () => import('./snow/cast_owl.js')],      // the cast: owl (docs/build/snow/3-cast-owl.md)
      ['cast_presences', () => import('./snow/cast_presences.js')],      // the cast: presences (docs/build/snow/3-cast-presences.md)
      ['cast_lights', () => import('./snow/cast_lights.js')],      // the cast: lights (docs/build/snow/3-cast-lights.md)
      ['stage', () => import('./snow/stage.js')],
    ]);
    // &layer=winter | memory | shared (developer; the page's debug key): one layer alone
    const layer = QS.get('layer');
    if (layer) ctx.group.traverse((o) => {
      if (!(o.isMesh || o.isPoints || o.isSprite || o.isLine)) return;
      const is = o.layers.mask === 2 ? 'winter' : o.layers.mask === 4 ? 'memory' : 'shared';
      if (is !== layer) o.visible = false; else if (layer === 'memory') o.layers.set(0);
    });
    // &counts=1 (developer): what the picture weighs, object by object, written to .shots/snow_counts.json
    if (QS.has('counts')) {
      const rows = [];
      ctx.group.traverse((o) => {
        if (!(o.isMesh || o.isPoints) || !o.geometry) return;
        const g = o.geometry, per = (g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0) / (o.isPoints ? 1 : 3), n = o.isInstancedMesh ? o.count : (g.isInstancedBufferGeometry && Number.isFinite(g.instanceCount) ? g.instanceCount : 1);
        rows.push({ name: o.name || o.type, layer: o.layers.mask === 2 ? 'winter' : o.layers.mask === 4 ? 'memory' : 'shared', each: Math.round(per), count: n, triangles: Math.round(per * n) });
      });
      rows.sort((a, b) => b.triangles - a.triangles);
      const sum = (l) => rows.filter((r) => r.layer === l).reduce((t, r) => t + r.triangles, 0), shared = sum('shared'), winter = sum('winter'), memory = sum('memory');
      fetch('/__shot/snow_counts.json', { method: 'POST', body: JSON.stringify({ objects: rows.length, shared, winter, memory, direct: shared + winter, mirror: shared + memory, counts: ctx.state.shared && ctx.state.shared.counts, rows }) }).catch(() => {});
    }
    // the painters' shared brush texture arrives a moment after the engine starts: wait for it, or a picture taken at once
    // shows flat paint, and paler (docs/water.md, "What trips people")
    await new Promise((r) => { const img = ctx.engine.shared.tBrush; let n = 0; const wait = () => { if ((img.value && img.value.image && img.value.image.width > 1) || ++n > 120) r(); else setTimeout(wait, 25); }; wait(); });
  },

  update(dt, ctx) {
    const boat = ctx.boat, st = ctx.state, here = (st.shared && st.shared.here) || { s: boat.s, d: boat.d };
    // ---- THE SHELF. From s 58 on the water's edge is kept here, in the page's frame (plan.waterRoom): the engine's own
    // wall is the true edge wherever the path is the reference line, but in the pond the path leaves it, and there the
    // engine's wall stands outside the rim. The shelf stops the hull with a knock and a ripple and eases it back.
    if (boat.z <= -PLAN.straight && !ctx.engine.frozen) {
      const fx = -Math.sin(boat.heading), fz = -Math.cos(boat.heading);
      for (const [ox, oz, r, bow] of [[0, 0, 0.95, false], [fx * 1.85, fz * 1.85, 0.55, true]]) {
        const px = boat.x + ox, pz = boat.z + oz, s = -pz, d = px, room = PLAN.waterRoom(s, d) - r;
        if (room >= 0) continue;
        const e = 0.25, gx = PLAN.waterRoom(s, d + e) - PLAN.waterRoom(s, d - e), gz = -(PLAN.waterRoom(s + e, d) - PLAN.waterRoom(s - e, d)), gl = Math.hypot(gx, gz) || 1, nx = gx / gl, nz = gz / gl;
        const push = Math.min(-room, 0.35) * (bow ? 0.6 : 1);
        boat.x += nx * push; boat.z += nz * push;
        const into = -(boat.vx * nx + boat.vz * nz);
        if (into > 0) {
          if (!bow) { boat.slipX += nx * into * 0.6; boat.slipZ += nz * into * 0.6; }
          boat.u *= Math.exp(-dt * 1.3);
          if (into > 0.5 && (st.knock || 0) <= 0) { st.knock = 0.9; boat.bumped = Math.max(boat.bumped, Math.min(1, into / 3)); ctx.water.ripple(px - nx * r, pz - nz * r, 0.5 + into * 0.2, 0.6); ctx.audio.play('knock', { x: px, z: pz, gain: Math.min(1, 0.35 + into * 0.2) }); }
        }
        if (bow) boat.yawRate += Math.sign(fz * nx - fx * nz) * Math.min(1.5, -room) * 2.2 * dt * 8;       // the nose swings off the ice
        // ... and a hull the current holds against the shelf is slid along it, downstream (on the north side of the islet
        // the engine's current, which runs with the composed line on the far side, sets straight on to the pond's rim, and
        // a boat left there lay with its nose on the ice for good)
        const tx = nz < 0 ? -nz : nz, tz = nz < 0 ? nx : -nx, down = tz <= 0 ? 1 : -1;                    // the shelf's own direction, turned to run toward the veil out (-z)
        boat.slipX += tx * down * 1.7 * dt; boat.slipZ += tz * down * 1.7 * dt;
      }
      st.knock = Math.max(0, (st.knock || 0) - dt);
    }
    // ---- THE WATER PARTS ROUND WHAT STANDS IN IT (the flood orchard's way, src/realms/orchard.js, for the same wood).
    // The engine's current runs straight down the channel and knows nothing of the trunks, the props or the islet, and a
    // bow has no way round a collider: a boat left to drift off the composed line noses into a trunk and is held there
    // (1-layout.md, "Asked of the engine"). So a boat that the current is carrying AT a thing standing in the water
    // (plan.colliders, `flow`) is carried a little sideways as it comes up to it, toward the composed line unless the
    // other side is much the nearer, and never on to the ice. Nothing happens to a boat on the line itself.
    // (9 November: only a boat left to the water, as in the flood orchard and for the same reason. A boat that is being
    // paddled goes round what it meets by the engine's own rule, and the two rules chose different sides: paddled
    // straight at the two trunks at s 125 with nobody steering, the boat stayed there. tools/forward.py looks for that.)
    if (boat.z <= -PLAN.straight && boat.idle > 0.6 && !ctx.engine.frozen && !(ctx.engine.realms && ctx.engine.realms.holding) && st.colliders) {
      const loc = ctx.path.locate(boat.x, boat.z, boat.s, st.loc || (st.loc = {})), U = PLAN.currentAt(here.s);
      // what lies across the boat's way, as one stretch [lo, hi] of its beam (right is +): things side by side are one thing to go round
      const bx = -Math.sin(boat.heading) * 1.85, bz = -Math.cos(boat.heading) * 1.85, latB = bx * -loc.tz + bz * loc.tx, mine0 = Math.min(0, latB), mine1 = Math.max(0, latB);
      let lo = mine0, hi = mine1, first = 1e9, big = false, n = 0;
      const span = st.span || (st.span = []); span.length = 0;
      for (const c of st.colliders) {
        if (!c.flow) continue;
        const rx = c.x - boat.x, rz = c.z - boat.z, isBig = c.r > 3, a = c.r + (isBig ? 2.7 : 1.55), ahead = rx * loc.tx + rz * loc.tz, reach = isBig ? 20 : 6;
        if (ahead < -0.3 || ahead > reach) continue;
        const lat = rx * -loc.tz + rz * loc.tx;
        if (Math.abs(lat) < a + 3.2) span.push(lat - a, lat + a, ahead, isBig ? 1 : 0);
      }
      for (let pass = 0; pass < 3; pass++) for (let i = 0; i < span.length; i += 4) {
        if (span[i] < hi && span[i + 1] > lo && (span[i] < lo || span[i + 1] > hi || !n)) { lo = Math.min(lo, span[i]); hi = Math.max(hi, span[i + 1]); first = Math.min(first, span[i + 2]); big = big || !!span[i + 3]; n++; }
      }
      const off = Math.min(1, Math.max(0, (Math.abs(loc.d) - 0.5) / 2));
      if (n && off > 0 && U > 0) {
        const toRight = hi - mine0, toLeft = mine1 - lo, inIsRight = loc.d < 0, needIn = inIsRight ? toRight : toLeft, needOut = inIsRight ? toLeft : toRight;
        // is there water to go out into? (the place the hull would be carried to, in the page's frame)
        const ox = boat.x + (inIsRight ? 1 : -1) * loc.tz * (needOut + 1.2), oz = boat.z - (inIsRight ? 1 : -1) * loc.tx * (needOut + 1.2);
        const goIn = PLAN.waterRoom(-oz, ox) < 1.3 || needIn < needOut * 1.6;
        const way = goIn === inIsRight ? 1 : -1, need = goIn ? needIn : needOut, reach = big ? 20 : 6;
        const carry = way * Math.min(1.5, need / Math.max(1.2, first - (big ? 3 : 1))) * Math.min(1, (reach - first) / (reach * 0.25)) * U * off * off * (3 - 2 * off);
        boat.x += -loc.tz * carry * dt; boat.z += loc.tx * carry * dt;
      }
    }
    // ---- the sound that goes by distance (page section 8; the staged sounds are stage.js's)
    const a = ctx.audio;
    if (a && a.layer && !a.silent) {
      const s = here.s, thaw = smooth(224, 246, s);
      const ice = s < 56 ? 0 : s < 100 ? 0.3 * smooth(56, 68, s) : s < 118 ? 0.4 : s < 224 ? 0.3 : 0.3 + 0.3 * thaw;      // none in the birch river, 0.3 on the plain, 0.4 in the bay, 0.6 in the thaw
      a.layer('ice', { level: ice, rate: 0.15 }, 3);
      a.layer('falls', 0.35 * thaw, 3);
      a.space({ size: 'open', mix: 0.15 * thaw, lowpass: 2500 + 3500 * thaw }, 3);                            // the world loses its muffling as the snow stops
    }
    // ---- &navlog=<name>.json (developer): where the boat went, twice a second, posted to .shots/ after &t seconds
    if (NAV) {
      const nv = st.nav || (st.nav = { t: 0, next: 0, rows: [], sent: false });
      nv.t += dt;
      if (nv.t >= nv.next) { nv.next += 0.5; nv.rows.push([+nv.t.toFixed(1), +here.s.toFixed(2), +here.d.toFixed(2), +boat.s.toFixed(1), +boat.d.toFixed(2), +boat.speed.toFixed(2), +(boat.bumped || 0).toFixed(2)]); }
      if (!nv.sent && nv.t >= NAV_T - 0.3) { nv.sent = true; fetch('/__shot/' + NAV, { method: 'POST', body: JSON.stringify({ columns: ['t', 'page s', 'page d', 'path s', 'path d', 'speed', 'bumped'], rows: nv.rows }) }).catch(() => {}); }
    }
  },
};
