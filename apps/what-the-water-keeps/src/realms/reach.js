// The dyers' reach (area 1 of 8): a dye works left running at sunset. A nave of wet cloth lit from behind like stained
// glass leads to a wooden wheel thirty metres tall that dips the day's cloth in the river and lifts it across the sun.
// Art direction: docs/art/reach.md. How it is built, stage by stage: docs/build/reach/. Its numbers: src/realms/reach/plan.js.
//
// The path's centre line is the page's composed line: a boat left alone is carried along it. The edges are hard (the
// page's softEdges: false): the lagoon is 66 m of open water inside them. Light and water change with the rider's
// FURTHEST progress, never with the clock (set.js); the colour of the light follows what cloth is across the sun
// (light.js). This file gives only the state the area is entered in.
//
//   set       the place, its light and its water: wind, sun, sky, land, far band, air, light states, the water and the
//             figures the dye draws on it                                                      (set.js, light.js, dye.js)
//   heroes    the monument: the great wheel, its frames, pier, pit and weir, its ten gores              (heroes.js)
//   heroes_b  the other one-of-a-kind pieces: west front, indigo house, gallery, copper, lifting wheel, loft
//   kit       kit pieces and multitudes: frames and masts, 206 bolts of cloth, swags, vats, the close band
//   cast      everything alive and moving (stage 3; empty)
//   stage     the route of moments, the showstopper, sound (stage 4); now: the kept lamp and the passages in and out
//
// Switches for looking (besides the engine's): &labels=1 names every stand-in; &only=set,kit / &skip=cast;
//   &far=<s> the evening as if the rider had been as far as s (the sun's height, the light, the wheel's dyes);
//   &gust=1 every cloth held up by the wind (the unpegging's held state); &wheel=<degrees> the wheel's angle;
//   &sunmask=1 shows the sun mask; &bare=1 no cloth ever dyes the light; &spread=<m> the half width of the dyed bar;
//   &sky=0 the plain gradient sky; &counts=1 writes what was grown to .shots/reach_counts.json;
//   &nofig=1 the water without its dye; &dyeonly=1 the dye alone; &nostir=1; &noroad=1; &mirrorsun=1 the sun's own disc in the water's mirror;
//   &tune=f.light:0.8,l.exposure:0.9 tries other numbers without editing the plan (see below);
//   &sunlog=1 &relog=1 &shade=<z> &suneye=x,y,z print or hold what the sun's light does (light.js; the critique's looking aids), &silks=log, &birds=log.
import { buildModules } from '../engine/modules.js';
import { PLAN } from './reach/plan.js';

{ // the developer's &tune= switch: &tune=w.film.amount:0.6,l.bloom.strength:0.3,e.exposure:0.8,sun.back:0.7,p.sky.start.top:%235B4E8E
  // (w. the water at the start, we. at the end, f. the film, l. the look at the start, e. at the end, sun. the sun, p. the whole plan)
  const tune = new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('tune');
  const roots = { w: PLAN.water.start, we: PLAN.water.end, f: PLAN.water.film, l: PLAN.light.start, e: PLAN.light.end, sun: PLAN.sun, p: PLAN };
  if (tune) for (const pair of tune.split(',')) {
    const [key, raw] = pair.split(':'), parts = (key || '').split('.'), root = roots[parts.shift()];
    if (!root || raw === undefined || !parts.length) continue;
    let o = root;
    while (parts.length > 1) { const k = parts.shift(); o = o[k] || (o[k] = {}); }
    o[parts[0]] = raw !== '' && !Number.isNaN(+raw) ? +raw : raw;
  }
}
const A = PLAN.light.start, W = PLAN.water;

export default {
  id: 'reach', name: "The dyers' reach",
  path: PLAN.path,
  look: {
    ...A,
    // the rower (src/engine/rower.js): this place is lit from behind by a red sun, and in her own colours she stood in it
    // evenly lit, like a cut-out: one warm tone over her, less of her own colour, and the sun's edge round her
    rower: { tone: '#E2BBA0', own: 0.3, rim: '#FFAE6A', rimStrength: 0.22, rimPower: 2.8 },
    veil: PLAN.light.veil,
    current: PLAN.current.wide, currentNarrow: PLAN.current.narrow,
  },
  water: {
    ...W.start,
    opacity: 0.97, wake: 1, foam: 0.12, edge: 0.06,
    film: { ...W.film },
    trace: { texel: 0.125, margin: 14 },
  },
  // (page section 8: the bed the reach rests on. The layers that move with the route, the wind following the gusts, the
  // falls and rain by the wheel, its D2 drone, the loft's room, are staging's: src/realms/reach/stage.js. Measured,
  // with the three states staging moves it to: docs/build/reach/4-staging.md: the bed -19.9 dBFS with the music,
  // the world 8.3 dB under it; the gust's peak -18.2; under the rim -19.7; the loft -24.4; nothing clipped.)
  audio: {
    music: { gain: 0.9, reverb: 0.12, width: 1.15 },          // the full track, warm, dry, present
    space: { size: 'open', mix: 0.22 },                       // cloth swallows sound: nearly dry
    ambience: { water: 0.4, wind: { level: 0.3, tone: 0.45 }, drips: { level: 0.4, rate: 0.6 } },
  },
  async build(ctx) {
    await buildModules(ctx, PLAN, [
      ['set', () => import('./reach/set.js')],
      ['heroes', () => import('./reach/heroes.js')],
      ['heroes_b', () => import('./reach/heroes_b.js')],
      ['heroes_c', () => import('./reach/heroes_c.js')],
      ['kit', () => import('./reach/kit.js')],
      ['kit_frames', () => import('./reach/kit_frames.js')],
      ['kit_yards', () => import('./reach/kit_yards.js')],
      ['cast', () => import('./reach/cast.js')],
      ['cast_machines', () => import('./reach/cast_machines.js')],      // the cast: machines (docs/build/reach/3-cast-machines.md)
      ['cast_falls', () => import('./reach/cast_falls.js')],      // the cast: falls (docs/build/reach/3-cast-falls.md)
      ['cast_silks', () => import('./reach/cast_silks.js')],      // the cast: silks (docs/build/reach/3-cast-silks.md)
      ['cast_air', () => import('./reach/cast_air.js')],      // the cast: airs (docs/build/reach/3-cast-airs.md)
      ['cast_birds', () => import('./reach/cast_birds.js')],      // the cast: birds (docs/build/reach/3-cast-birds.md)
      ['stage', () => import('./reach/stage.js')],
    ]);
  },
};
