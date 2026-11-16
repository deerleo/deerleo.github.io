// The answering sea (realm 5 of 8): a moonless strait of basalt organ pipes where nothing shines until it is touched.
// Art direction: docs/art/sea.md. How it is built, stage by stage: docs/build/sea/. Its numbers: src/realms/sea/plan.js.
//
// The path's centre line is the page's composed line (a boat left alone is carried along it). The edges are soft:
// colliders stop the boat at everything solid, and beyond the channel the water leans the boat back (set.js).
// Light and water change along the way by the number L (the sea's light), which set.js drives from the showstopper's
// clock and the boat's distance along: this file gives only the state the area is entered in.
//
// Switches for looking (besides the engine's): &play=answering&t=26 is the showstopper 26 s in (postcard 7);
// &play=firstlight skips the first dark; &play=whale starts the whale beneath; &rest=1 shows the sea as it is before the
// rain wherever the boat is put; &labels=1 names every stand-in; &counts=1 writes what the kit grew to
// .shots/sea_counts.json; &only=set,kit / &skip=cast build some modules.
// &tune=w.touch.amount:1.2,l.bloom.strength:0.5,lit.exposure:0.8 tries other numbers without editing the plan
// (w. = the water, l. = the look at rest, lit. / air. / dark. = the other light states; colours as %23rrggbb).
import { buildModules } from '../engine/modules.js';
import { PLAN } from './sea/plan.js';

// (No trial copy of the kit is left: the reefs' second pass, terraces of columns, was finished and went into kit.js on 9 November with its switch
// &kitnext (docs/build/sea/6-reefs.md); cast_deep.next.js, the jellies drawn as light, went into cast_deep.js the same night. The other five trial
// copies, of set, light, air, heroes and heroes_b, were the live files line for line and went at stage 5 with their switches.)

{ // the developer's &tune= switch
  const tune = new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('tune');
  const roots = { w: PLAN.water, l: PLAN.look.rest, lit: PLAN.look.lit, air: PLAN.look.air, dark: PLAN.look.dark, sky: PLAN.sky, sl: PLAN.seaLight, p: PLAN };
  if (tune) for (const pair of tune.split(',')) {
    const [key, raw] = pair.split(':'), parts = (key || '').split('.'), root = roots[parts.shift()];
    if (!root || raw === undefined || !parts.length) continue;
    let o = root;
    while (parts.length > 1) { const k = parts.shift(); o = o[k] || (o[k] = {}); }
    o[parts[0]] = raw !== '' && !Number.isNaN(+raw) ? +raw : raw;
  }
}

export default {
  id: 'sea', name: 'The answering sea',
  path: PLAN.path,
  // (the rower, src/engine/rower.js: in the ride's darkest place she is edged with the sea's own light, or she is a hole in the night)
  look: { ...PLAN.look.rest, rower: { tone: '#8A93B4', rim: '#63c7d6', rimStrength: 0.3, rimPower: 3.2, own: 0.3 } },
  water: {
    ...PLAN.water,
    // the rain front: rain falls only behind this line. set.js moves it (and gives it its true direction: to the
    // right and 15 degrees up the route); here it waits far off to the left.
    front: { normal: [1, 0.15], offset: -1e5, width: PLAN.front.width, rain: 1, calm: 0 },
  },
  // (the page's section 8; the layers that move with the route are staging's: src/realms/sea/stage.js)
  audio: {
    // only the half-speed drone, until the rain. (Stage 4, measured: the page's { gain: 0.55, half: 1 } is the half-speed copy at the
    // music's FULL level, since `gain` sets the track's own voice and `half` the copy's: -17.5 dBFS, the loudest music on the ride,
    // in its darkest place. The copy alone at the level the page's 0.55 meant: -23.6 dBFS, two decibels under a realm's usual music;
    // the whole bed -22.0 dBFS with peaks at -5.1. docs/build/sea/4-staging.md has the table.)
    music: { gain: 0.2, half: 0.62, lowpass: 420, reverb: 0.5, width: 1.3 },
    space: { size: 'open', mix: 0.3 },
    ambience: { water: 0.45, surf: 0.5, wind: { level: 0.28, tone: 0.3 }, deep: { level: 0.3, note: 26 } },
  },
  async build(ctx) {
    await buildModules(ctx, PLAN, [
      ['set', () => import('./sea/set.js')],      // the place and its light: sky, far headlands, air, light states, the water, the rain front, L
      ['heroes', () => import('./sea/heroes.js')],    // the lighthouse and the kept lamp, the skerry, the gate's crown, the wreck, the buoy, the rowing boat, the whale
      ['heroes_b', () => import('./sea/heroes_b.js')],      // the other hero pieces as models: the gate's crown and vault, the wreck, the bell buoy, the rowing boat
      ['kit', () => import('./sea/kit.js')],      // the columns (pipes, gate, wall, cave, far pipes), kit pieces, multitudes, the close band, colliders
      ['cast', () => import('./sea/cast.js')],        // everything alive and moving
      ['cast_birds', () => import('./sea/cast_birds.js')],      // the cast: birds (docs/build/sea/3-cast-birds.md)
      ['cast_whale', () => import('./sea/cast_whale.js')],      // the cast: whale (docs/build/sea/3-cast-whale.md)
      ['cast_deep', () => import('./sea/cast_deep.js')],      // the cast: deep (docs/build/sea/3-cast-deep.md)
      ['cast_weather', () => import('./sea/cast_weather.js')],      // the cast: weather (docs/build/sea/3-cast-weather.md)
      ['cast_edge', () => import('./sea/cast_edge.js')],      // the cast: edge (docs/build/sea/3-cast-edge.md)
      ['stage', () => import('./sea/stage.js')],      // the route of moments, the showstopper, sound; the passage in
      ['air', () => import('./sea/air.js')],      // the air: rain round the eye, far rain, the wall of the front; the hull's own light (it runs last)
    ]);
  },
};
