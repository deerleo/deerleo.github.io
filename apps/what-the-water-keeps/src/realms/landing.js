// The landing (the prologue, 81 m): the last gold of a May evening in a great reed bed. A tea-brown backwater, a long
// crooked footbridge wading across it, the sun burning behind the reeds, and the boat let go. Gilded, level, teeming.
// The only daylight of the ride; the title is shown over its first view.
//
// What is built here: docs/art/landing.md. How, stage by stage: docs/build/landing/. Every number: src/realms/landing/plan.js.
//
// The path's centre line is the page's composed line. The boat waits moored at the staithe (titleView, departure);
// on 'Push off' the flame crosses from the kept lamp, the boat is let go and the water eases it out to the line
// (stage.js). Light and water turn from `look` / `water` into `lookEnd` / `waterEnd` by distance (the engine's blend);
// set.js drives what the engine does not: the current, the sinking sun, the sun's path on the last 26 m.
//
//   light    the area's own light and paints, shared by every module (shared.landing): the shade, the rim, plants,
//            and since stage 2 the three tiles (timber, reed, wicker) laid along the grain of every member, with the
//            wet band and dry line where timber meets the water (docs/build/landing/2-light.md says how to wear them)
//   set      the place and its light: sky, sun (in the sky, in the reeds, through the door's cloth), far planes, the
//            ground and bed and what is laid on them, the grass on the turf, mist; the current
//   heroes   the monument: the long bridge
//   heroes_b the other hero pieces: staithe, rick, gangway, jetty, sunk punt, gate masts
//   kit      the reeds, the far reed mass, stubble, the cloths of the door (and what of the layout's kit still stands in)
//   kit_plants   reedmace, iris, sedge, lily pads, hornwort (stage 2, Plants)
//   kit_pilings  pilings and revetment, traps, bundles, low ricks, withies (stage 2, Pilings)
//   cast     everything alive (stage 3); the heron's stand-in
//   stage    the route of moments (stage 4); the passages in (the crossing and the release) and out (the door)
//
// Developer switches (besides the engine's): &labels=1 names the stand-ins; &only=set,kit / &skip=cast;
//   &play=crossing sends the flame across (with &t=3.5 it is half-way: postcard 2);
//   &at_s=70 holds the light, air and water of that place wherever the boat is;
//   &counts=1 writes what was grown to .shots/landing_counts.json; &crowd=1 adds the cast's multitudes as still
//   stand-ins at the planned counts (for measuring cost); &stems=painted puts the far reed stems back under the
//   painter's filter (to compare);
//   &tune=l.exposure:1.1,e.fog.density:0.006,w.mirror:0.2,we.sparkle:0.4 tries other numbers without editing the plan
//   (l. the look, e. lookEnd, w. the water, we. waterEnd, s. the sky, sun. the sun, p. the plan; colours as %23rrggbb;
//   an entry of a list by its number: p.lamp.daylight.halo.1:0.9, p.sunGlow.reeds:2, p.gate.backlight:0.4,
//   p.gate.shade.to:60, p.plantLight.glow.1:0.3).
import { buildModules } from '../engine/modules.js';
import { makeKeptLamp } from '../engine/lamp.js';
import { PLAN } from './landing/plan.js';

const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
{ // the developer's &tune= switch
  const roots = { l: PLAN.look, e: PLAN.lookEnd, w: PLAN.water, we: PLAN.waterEnd, s: PLAN.sky, sun: PLAN.sun, p: PLAN };
  for (const pair of (QS.get('tune') || '').split(',')) {
    const [key, raw] = pair.split(':'), parts = (key || '').split('.'), root = roots[parts.shift()];
    if (!root || raw === undefined || !parts.length) continue;
    let o = root;
    while (parts.length > 1) { const k = parts.shift(); o = o[k] || (o[k] = {}); }
    o[parts[0]] = raw !== '' && !Number.isNaN(+raw) ? +raw : raw;
  }
}

export default {
  id: 'landing', name: 'The landing',
  path: PLAN.path,
  titleView: PLAN.title, departure: true,          // src/ui.js: the boat waits here under the title and is held until the realm lets it go
  // (the rower, src/engine/rower.js: in this bright evening her pale things, hair, cuffs, boots, would be the lightest in the
  //  frame: one warm tone over her brings them a step under the sky, and she takes the evening's own colour almost wholly,
  //  as its timber does: skin sun-warmed, hair straw, the shade on her tea-brown. Judged over the left shoulder at the
  //  mooring, under the bridge and at the door: docs/build/landing/5-critique.md. It was { tone: '#D2BFA3', own: 0.45 }:
  //  a pale pink face and cream hair lighter than anything but the cloud. &tune=l.rower.own:0.3,l.rower.tone:%23b89a78 tries others)
  look: { ...PLAN.look, rower: { tone: '#BCA07E', own: 0.15, ...(PLAN.look.rower || {}) } }, lookEnd: PLAN.lookEnd,
  water: PLAN.water, waterEnd: PLAN.waterEnd,
  audio: PLAN.audio,

  async build(ctx) {
    for (const [s, d, r, soft] of PLAN.colliders(ctx.path)) { const p = PLAN.at(ctx.path, s, d, 0); ctx.addCollider(soft ? { x: p[0], z: p[2], r, soft } : { x: p[0], z: p[2], r }); }
    const shared = ctx.state.shared = {};
    // The kept lamp: the engine's, unchanged, at the head of the jetty (the page, section 2). It stands here and not
    // in a module so that no unfinished module can take the ride's one motif out of the picture. Its arm is turned out
    // toward the channel (turn = the path's heading), so that from the mooring the lantern hangs beside its post, not
    // behind it, and the flame is at the page's place, PLAN.lamp.at. It glows as in the dark (PLAN.lamp.night; the
    // developer's &lampnight=0 shows it as the engine shows a lamp by day).
    const K = PLAN.lamp;
    shared.lamp = makeKeptLamp(ctx.engine, ctx, { at: K.post, note: K.note, near: K.near, reach: K.reach, moths: K.moths, intensity: K.intensity, turn: ctx.path.at(K.post[0]).heading,
      night: QS.has('lampnight') ? QS.get('lampnight') === '1' : !!K.night });
    await buildModules(ctx, PLAN, [
      ['light', () => import('./landing/light.js')],
      ['set', () => import('./landing/set.js')],
      ['heroes', () => import('./landing/heroes.js')],
      ['heroes_b', () => import('./landing/heroes_b.js')],
      ['kit', () => import('./landing/kit.js')],
      ['kit_plants', () => import('./landing/kit_plants.js')],
      ['kit_pilings', () => import('./landing/kit_pilings.js')],
      ['cast', () => import('./landing/cast.js')],
      ['cast_mayflies', () => import('./landing/cast_mayflies.js')],      // the cast: mayflies (docs/build/landing/3-cast-mayflies.md)
      ['cast_insects', () => import('./landing/cast_insects.js')],      // the cast: insects (docs/build/landing/3-cast-insects.md)
      ['cast_fish', () => import('./landing/cast_fish.js')],      // the cast: fish (docs/build/landing/3-cast-fish.md)
      ['cast_drift', () => import('./landing/cast_drift.js')],      // the cast: drift (docs/build/landing/3-cast-drift.md)
      ['cast_lines', () => import('./landing/cast_lines.js')],      // the cast: lines (docs/build/landing/3-cast-lines.md)
      ['stage', () => import('./landing/stage.js')],
    ]);
    if (QS.has('counts') && shared.counts) fetch('/__shot/landing_counts.json', { method: 'POST', body: JSON.stringify(shared.counts, null, 1) }).catch(() => {});
  },
};
