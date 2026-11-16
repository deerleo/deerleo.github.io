// The town below (area 3 of 8): a whole town burns on under black glass. Depth, underglow, tremor.
// docs/art/town.md is what is built here; docs/build/town/ holds each stage's log. The area is built from modules
// (src/realms/town/): plan.js the numbers, layout.js the town's plan grown from them, light.js the area's light,
// then set, heroes, kit, cast, stage.
import { buildModules } from '../engine/modules.js';
import { PLAN } from './town/plan.js';

export default {
  id: 'town', name: 'The town below',
  path: PLAN.path,
  // (the rower, src/engine/rower.js: under the town's rose light from below she keeps half of her own colours)
  look: { ...PLAN.look, rower: { tone: '#9C88B4', own: 0.34, rim: '#F2A27E', rimStrength: 0.22, rimPower: 2.8 } },      // (the critique's trial, a little lighter: she belongs to the violet night, edged with the lanterns' rose)
  water: PLAN.water,
  // Stillness with a floor under it; a clock; a town heard through its own ceiling (the page, section 8). No bells
  // layer and no chimes: the only bell is the stroke. stage.js moves `deep`, the music and the space along the route.
  audio: {
    music: { gain: 0.62, lowpass: 700, half: 0.5, waver: 0.6, reverb: 0.3, width: 0.9 },
    space: { size: 'hall', mix: 0.45, lowpass: 1400 },
    ambience: { water: 0.2, deep: 0.35, night: 0.25, drips: { level: 0.25, rate: 0.2 }, drone: { level: 0.3, notes: [38, 45, 53], colour: 0.25 } },
  },
  async build(ctx) {
    await buildModules(ctx, PLAN, [
      ['set', () => import('./town/set.js')],          // the place and its light: sky, bed, backdrops, mist, light states, the far water's glow
      ['heroes', () => import('./town/heroes.js')],    // the clock tower and the hero pieces; the kept lamp; the passage out
      ['heroes_clock', () => import('./town/heroes_clock.js')],   // the monument's clockwork: the movement behind the dials, the pendulum, the hour ring (they replace heroes.js's stand-ins)
      ['heroes_b', () => import('./town/heroes_b.js')],   // the other hero pieces as models: church, market hall, theatre front, fountain (they replace heroes.js's stand-ins)
      ['kit_houses', () => import('./town/kit_houses.js')],   // the town itself: the houses within sight of the water (shells and their dressing) and every window (it builds before kit, which leaves their stand-ins out)
      ['kit_street', () => import('./town/kit_street.js')],   // the street and the square: stonework, lamps, washing, trees, stalls, skiffs, the vista's kit (before kit, which leaves their stand-ins out)
      ['kit', () => import('./town/kit.js')],          // houses, roofs awash, stacks, lamps, poplars, the vista's kit; windows and the other multitudes
      ['kit_roofs', () => import('./town/kit_roofs.js')],   // the roofs at the waterline: tiles and slates, stacks and pots, gables, the small things that break the surface, weed
      ['cast', () => import('./town/cast.js')],        // everything alive and moving
      ['cast_birds', () => import('./town/cast_birds.js')],      // the cast: birds (docs/build/town/3-cast-birds.md)
      ['cast_deep', () => import('./town/cast_deep.js')],      // the cast: deep (docs/build/town/3-cast-deep.md)
      ['cast_presences', () => import('./town/cast_presences.js')],      // the cast: presences (docs/build/town/3-cast-presences.md)
      ['cast_small', () => import('./town/cast_small.js')],      // the cast: small (docs/build/town/3-cast-small.md)
      ['cast_hangings', () => import('./town/cast_hangings.js')],      // the cast: hangings (docs/build/town/3-cast-hangings.md)
      ['stage', () => import('./town/stage.js')],      // the route of moments, the showstopper, sound
      // &ballast=1 (measuring only): still solids with the triangle counts the page plans, to time the finished picture
      ...(new URLSearchParams(location.search).has('ballast') ? [['ballast', () => import('./town/ballast.js')]] : []),
    ]);
  },
};
