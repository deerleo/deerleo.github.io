// The standing sky (realm 7 of 8, and the ending): a lake a hand deep that holds the whole night sky and every star
// that has fallen out of it; star-birds standing round the horizon; then first light, the wind, and the far jetty.
// Art direction: docs/art/sky.md. How it is built, stage by stage: docs/build/sky/. Its numbers: src/realms/sky/plan.js.
//
// The path's centre line is the page's composed line (a boat left alone is carried along it). The edges are soft:
// colliders stop the boat at everything solid, and beyond the channel the water leans the boat back. The ride ends
// here: the path has an end stop and no veil out. Light and water change along the way with the boat's distance
// (set.js: the dawn clock `e`, the sunline, the wind front); this file gives the state the area is entered in.
//
// Switches for looking (besides the engine's): &play=lettinggo&t=33 is the showstopper 33 s in; &play=falsedawn&t=6 the
// aurora half unrolled; &labels=1 names every stand-in; &only=set,kit / &skip=cast build some modules;
// &blur=0 draws the stars as sharp as the view allows (what the matching with the mirror does: light.js);
// &tune=w.reflectFloor:0.7,l.exposure:1.3,dn.fog.density:0.003,p.sky.milkyway.gain:1.4 tries other numbers without
// editing the plan (w. = the water at night, wd. = at dawn, l. = the starlight look, a. = the aurora's, dn. = the dawn's,
// p. = the whole plan; colours as %23rrggbb).
import { buildModules } from '../engine/modules.js';
import { PLAN } from './sky/plan.js';

{ // the developer's &tune= switch
  const tune = new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('tune');
  const roots = { w: PLAN.water.night, wd: PLAN.water.dawn, l: PLAN.look.star, a: PLAN.look.aurora, dn: PLAN.look.dawn, p: PLAN };
  if (tune) for (const pair of tune.split(',')) {
    const [key, raw] = pair.split(':'), parts = (key || '').split('.'), root = roots[parts.shift()];
    if (!root || raw === undefined || !parts.length) continue;
    let o = root;
    while (parts.length > 1) { const k = parts.shift(); o = o[k] || (o[k] = {}); }
    o[parts[0]] = raw !== '' && !Number.isNaN(+raw) ? +raw : raw;
  }
}

export default {
  id: 'sky', name: 'The standing sky',
  path: PLAN.path,
  look: { ...PLAN.look.star },
  water: { ...PLAN.water.night },
  // (the page's section 8: the theme whole, bare and wide in a long dark room. The layers that move with the route
  // are staging's: src/realms/sky/stage.js lists them)
  audio: {
    music: { gain: 0.85, reverb: 0.6, width: 1.4 },
    space: { size: 'cavern', mix: 0.5 },
    ambience: { water: 0.3, shimmer: 0.2 },
  },
  async build(ctx) {
    await buildModules(ctx, PLAN, [
      ['set', () => import('./sky/set.js')],            // the place and its light: the sky's sphere, the bed, the light states, the dawn clock, the sunline, the water, the wind front
      ['heroes', () => import('./sky/heroes.js')],      // the monument: the great wader, the ring of standers and the skein (one system of stars and hairlines on one rig)
      ['heroes_b', () => import('./sky/heroes_b.js')],  // the other hero pieces that are not timber: the far jetty (a stand-in: it is the landing's) and its cold lamp, the kept lamp and its stroke; the ridge's stand-in only if heroes.js gave none
      ['timber', () => import('./sky/timber.js')],      // the Timber group: the warden's hut and the barrow run with its tipping stage, laid on the ridge as heroes.js publishes it
      ['kit', () => import('./sky/kit.js')],            // kit pieces and standing multitudes: stakes, causeways, sluices, cones, pans, tools, the drowned things, sedge; colliders
      ['kit_shallows', () => import('./sky/kit_shallows.js')],      // the Shallows group: the real mooring stakes and crust collars, the lamp's collar and ring, pebbles, sedge, the crust terraces
      ['kit_tools', () => import('./sky/kit_tools.js')],            // the Tools group: rakes, shovels, barrows, baskets, the yoke and pails, the plank run; the drowned plank walk, wheel and rake
      ['cast', () => import('./sky/cast.js')],          // everything alive and moving (now: the standing cast as stand-ins: the lights on the bed, the flock, the sleepers, the terns)
      ['cast_starbirds', () => import('./sky/cast_starbirds.js')],      // the cast: starbirds (docs/build/sky/3-cast-starbirds.md)
      ['cast_sleepers', () => import('./sky/cast_sleepers.js')],      // the cast: sleepers (docs/build/sky/3-cast-sleepers.md)
      ['cast_flock', () => import('./sky/cast_flock.js')],      // the cast: flock (docs/build/sky/3-cast-flock.md)
      ['cast_wind', () => import('./sky/cast_wind.js')],      // the cast: wind (docs/build/sky/3-cast-wind.md)
      ['cast_shallows', () => import('./sky/cast_shallows.js')],      // the cast: shallows (docs/build/sky/3-cast-shallows.md)
      ['stage', () => import('./sky/stage.js')],        // the route of moments, the showstopper, sound, the ending
    ]);
  },
};
