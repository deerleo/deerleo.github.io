// The theatre of leaves (area 4 of 8). Art direction: docs/art/theatre.md. How it was built and what is still a
// stand-in: docs/build/theatre/ (one log per stage; 1-layout.md first).
//
// A drowned opera house keeps its hour without us: a copper beech in a column of moonlit rain where the dome fell in,
// five tiers that kindle as the boat goes down the aisle, a curtain that rises on old machines, and then the fall.
//
// The area's numbers are in theatre/plan.js; what its modules share (the house's light, stand-ins) is in theatre/lib.js.
//   theatre/set.js      the place and its light: the plain building, sky, the far lake, the shaft, the three light states,
//                       the show clock, the water's rain, the kept lamp
//   theatre/cove.js     the cove between the top tier and the dome: the painted sky, the ribs, the round windows
//   theatre/air.js      the glow in the air round every bracket (and what the flames count for in the water)
//   theatre/heroes.js   the monument and the hero pieces
//   theatre/kit.js      kit pieces, multitudes, the close band
//   theatre/cast.js     everything alive and moving
//   theatre/stage.js    the route of moments, the showstopper, sound
// Developer switches (see theatre/lib.js): &c=27 holds the show clock; &ballast=0; &raw=1; &labels=1; &only= / &skip= modules.
import { buildModules } from '../engine/modules.js';
import { PLAN } from './theatre/plan.js';
import { at, dev } from './theatre/lib.js';

// The light table in use: PLAN.light2 (stage 2: 2-light.md). `&light=1` (and `&raw=1`) give the page's own table, PLAN.light.
const A = dev.second ? PLAN.light2.A : PLAN.light.A;

export default {
  id: 'theatre',
  name: 'The theatre of leaves',
  // One straight line down the axis of the building. The centre line is the composed line: the current carries a boat
  // left alone through the middle arch, 9 m past the trunk, under the chandelier's rim, over the orchestra and up the stage.
  path: PLAN.path,

  // Light state A, moon and water. States B (kindled) and C (the fly tower) are made in set.js with ctx.lookStates;
  // `house` holds this area's own light values (theatre/light.js says what each does), blended with the rest.
  look: {
    veil: PLAN.light.veil,
    background: A.background, fog: { ...A.fog }, exposure: A.exposure, bloom: { ...A.bloom }, grade: { ...A.grade },
    paint: A.paint, paintRadius: A.paintRadius, lantern: A.lantern, light: { ...A.light },
    current: 2.6, currentNarrow: 2.6,                      // set live from the boat's distance (plan.current)
    mirrorScale: 1,                                        // the candle strokes need the whole mirror
    // (the director's notice of 19:55: the remodelled boat must sit in the picture as worn wood, never the lightest thing in the frame.
    // In this dark room its pale planking was. `tone` multiplies the whole boat; &boattone=8A9088 tries another.)
    boat: { tone: dev.has('boattone') ? '#' + dev.get('boattone') : '#8A9088' },
    rower: { ...PLAN.rower.A },                            // her light in this room (plan.js, "the rower in this room"; states B and C: set.js)
    house: dev.second ? { ...PLAN.light2.house.A } : { level: 0.14, shaft: 0.42, moon: 1.0, fill: 0, cloud: 1, wake: '#CFE3DC', wakeBase: 0.2 },
  },

  // Black-green lacquer: a truthful mirror that carries the room, and that lights the room when it moves. Rain is data,
  // under the tear only (set.js). Within 4 m of the hull the seat backs show; beyond 12 m it is all mirror.
  // (Stage 2, 2-light.md "The water": the page's mirror 0.7 gave a sheet so still that 890 flames lay on it as dots. At 0.6 with
  // a longer streak they stand in it as long broken columns of gold, as in the key painting; the body is a deeper, greener glass,
  // and the mirror keeps a darker and richer copy of the room.)
  // (Second look, 2-light.md: BEFORE THE HOUR THE WATER IS GLASS. At mirror 0.6 the dark house lay on it as a soft murk; at 0.86 with a short streak the
  // arches, the royal box and five tiers of wet rails stand in it upside down: the water shows the whole house before a candle burns. It comes alive
  // with the kindling: state B, plan.js "SECOND LOOK", has mirror 0.45 and streak 3.0, so that the flames stand in it as long columns.)
  water: {
    deep: '#03130F', shallow: '#0F3F3A', reflectivity: 0.95, fresnel: 4.4, roughness: 0.05,
    waveHeight: 0.10, waveScale: 0.6, waveSpeed: 0.5, mirror: 0.86, streak: 1.3, sparkle: 0,
    opacity: 0.86, clarity: 1.1, absorb: '#6fae9a', absorbDepth: 1.4, seeDistance: 10, foam: 0.04, rain: 0,      // (clarity and absorb: see 1-layout.md, "the seats")
    reflectionTint: '#DCEEE6', mirrorDarken: 0.25, mirrorSaturate: 0.32, rippleLife: 5, wake: 0.8,
    ...(PLAN.light4 && PLAN.light4.waterA ? PLAN.light4.waterA : {}),      // (second look, continued: plan.js says why the columns' strength is said outright in every state)
    ...(PLAN.light6 && PLAN.light6.waterA ? PLAN.light6.waterA : {}),      // (fourth look: sky-light on leaning water, the lantern's light on it; plan.js, "FOURTH LOOK")
  },

  // The page, section 8: the hall as it sounds from the arches before the hour (the first image). Four layers: the rain
  // is the bed, water and wind are traces, the drips ring in the hall. Measured (stage 4, docs/build/theatre/4-staging.md,
  // the guide's standard run): everything -23.2 dBFS RMS, peak -7.0, music -25.3, world -27.5; nothing clipped.
  // The staging (stage.js, update) moves it along the route, and these are only where it starts:
  //   rain     0.2 behind the foyer's wall, 0.45 from the arches, 0.6 at the column's edge, 0.7 inside it, 0.25 from the
  //            stage; 0 in 1.2 s when the prow goes through the painting
  //   space    mix 0.3 and a 1,500 Hz low-pass in the foyer, opening to 0.55 by s 30; 1,200 Hz for 2 s at the painting (a
  //            door closing); mix 0.12 by s 150 (the fly tower is dry)
  //   music    gain 0.62 to 0.88 and reverb 0.6 to 0.45 between show clock 14 and 26 (it comes into the room with the
  //            kindling); gain 0.5, reverb 0.2 and a 600 Hz low-pass by s 150
  //   wind     0.22 to 0.5 with the gust and the fall; 0.4 at tone 0.2 in the fly tower
  //   shimmer  0 to 0.28 with the share of flames burning; surf 0 at s 148 to 0.3 at s 170 (neither is in the bed)
  audio: {
    music: { gain: 0.62, reverb: 0.6, highpass: 60, width: 1.25 },
    space: { size: 'hall', mix: 0.55 },
    ambience: { water: 0.3, rain: 0.45, drips: { level: 0.5, rate: 0.5 }, wind: { level: 0.22, tone: 0.3 } },
  },

  async build(ctx) {
    ctx.state.plan = PLAN;
    for (const c of PLAN.colliders) { const p = at(ctx, c.s, c.d); ctx.addCollider({ x: p.x, z: p.z, r: c.r }); }
    await buildModules(ctx, PLAN, [
      ['set', () => import('./theatre/set.js')],
      ['cove', () => import('./theatre/cove.js')],                    // the cove between the top tier and the dome: the painted sky, the ribs, the round windows (2-light.md)
      ['heroes', () => import('./theatre/heroes.js')],
      ['heroes_house', () => import('./theatre/heroes_house.js')],          // the architecture of the house: proscenium, stage boxes, pelmet, arch wall and royal box, dome, foyer stairs (2-heroes-house.md)
      ['heroes_stage', () => import('./theatre/heroes_stage.js')],          // the stage and the pit: painted cloths, flats, machines, instruments (2-heroes-stage.md)
      ['tree', () => import('./theatre/tree.js')],                    // the monument: the copper beech, its crown, its mound, the chandelier it carries (2-monument.md)
      ['kit', () => import('./theatre/kit.js')],
      ['kit_tiers', () => import('./theatre/kit_tiers.js')],          // the horseshoe: tier fronts bay by bay, piers, girandoles, lustres, the flames, beads and tassels (2-kit-tiers.md)
      ['kit_floor', () => import('./theatre/kit_floor.js')],          // the kit at the water: parterre boxes, chairs, seats, the fallen sky, trinkets, ferns (2-kit-floor.md)
      ['air', () => import('./theatre/air.js')],                      // the air: the glow of every bracket, and what else light does in the room's air (2-light.md)
      ['cast', () => import('./theatre/cast.js')],
      ['cast_machines', () => import('./theatre/cast_machines.js')],      // the cast: machines (docs/build/theatre/3-cast-machines.md)
      ['cast_weather', () => import('./theatre/cast_weather.js')],      // the cast: weather (docs/build/theatre/3-cast-weather.md)
      ['cast_moths', () => import('./theatre/cast_moths.js')],      // the cast: moths (docs/build/theatre/3-cast-moths.md)
      ['cast_presences', () => import('./theatre/cast_presences.js')],      // the cast: presences (docs/build/theatre/3-cast-presences.md)
      ['cast_cloth', () => import('./theatre/cast_cloth.js')],      // the cast: cloth (docs/build/theatre/3-cast-cloth.md)
      ['stage', () => import('./theatre/stage.js')],
    ]);
    // (Stage 6, docs/build/theatre/5-critique.md.) THE HOUSE IS PUT AWAY BEYOND THE PAINTING. Thirty metres into the fly tower the painting has closed behind the
    // boat and nothing of the auditorium or the stage can be seen, over the cloth or round it; but most of the house is drawn as one batch wherever the eye looks,
    // and from s 152, looking out at the night, a frame still drew 2.9 million triangles of it. Beyond s 150 what is named here is in no pass (its layers are
    // emptied, and given back when the boat comes back below s 148: twenty-eight metres before it could reach the painting again). Not on the list, and so always
    // drawn: the building itself, the backcloth, the borders, every rope, the leaves in the air and on the water, whatever belongs to the tower. &houseall=1: never.
    if (!dev.has('houseall')) {
      const AWAY = /^(presences: |beech sprays|beech_|leaves on the mound|tree_chandelier|chandelier beads|lustre|tier_|girandole|hart's-tongue|cove|house curtain|parterre_|chair_|beads x|tassels x|seat_|drops and their crowns|wave_roller|music_stand|mound_|royal_|stage_box|baluster|lamp_standard|rosette|foyer_stairs)/;
      const put = [], masks = [];
      let away = false;
      ctx.onUpdate(() => {
        if (!put.length) ctx.group.traverse((o) => { if ((o.isMesh || o.isPoints) && AWAY.test(o.name || '')) put.push(o); });      // (found on the first frame: some modules name their batches after building)
        const now = away ? ctx.s > 148 : ctx.s > 150;
        if (now === away) return;
        away = now;
        for (let i = 0; i < put.length; i++) { if (away) { masks[i] = put[i].layers.mask; put[i].layers.mask = 0; } else put[i].layers.mask = masks[i]; }
      });
    }
    if (dev.has('census')) census(ctx, dev.get('census') || 'theatre_census.json');
  },
};

// &census=name.json (stage 6, docs/build/theatre/5-critique.md): what every object costs in each of the frame's three passes (the picture the
// water reads, the mirror, the picture itself), written to .shots/name.json, heaviest first, as triangles a frame. The probe (&perf=) gives
// only the sum. It counts what is really drawn (after culling, with each pass's own instance counts); it draws and changes nothing.
function census(ctx, file) {
  const eng = ctx.engine, tally = new Map();
  let frames = 0, last = '', sent = false;
  const inRealm = (o) => { for (let p = o; p; p = p.parent) if (p === ctx.group) return true; return false; };
  const nameOf = (o) => { if (o.name) return o.name; for (let p = o.parent; p && p !== eng.scene && p !== ctx.group; p = p.parent) if (p.name) return p.name + ' > ' + ((o.material && o.material.name) || o.type); return (o.material && o.material.name) || o.type; };
  const send = () => {
    sent = true;
    const n = Math.max(1, frames), rows = [...tally].map(([name, e]) => ({ name, pre: Math.round(e.pre / n), mirror: Math.round(e.mirror / n), main: Math.round(e.main / n), draws: +(e.calls / n).toFixed(1) }));
    rows.sort((a, b) => (b.pre + b.mirror + b.main) - (a.pre + a.mirror + a.main));
    const sum = (k) => rows.reduce((a, r) => a + r[k], 0), total = { pre: sum('pre'), mirror: sum('mirror'), main: sum('main'), draws: Math.round(sum('draws')), objects: rows.length };
    fetch('/__shot/' + file, { method: 'POST', body: JSON.stringify({ total, rows }) }).catch(() => {});
    console.error(`NOT AN ERROR (&census): triangles a frame: pre ${total.pre}, mirror ${total.mirror}, main ${total.main}; ${total.draws} draws of ${total.objects} kinds; .shots/${file}`);
  };
  const seen = new WeakSet(), hook = (o) => {
    if (!(o.isMesh || o.isPoints || o.isLine) || seen.has(o)) return;
    seen.add(o);
    const prev = o.onBeforeRender, key = (inRealm(o) ? '' : 'engine: ') + nameOf(o);
    o.onBeforeRender = function (r, sc, cam, g, m, group) {
      prev.call(this, r, sc, cam, g, m, group);
      const pass = cam !== eng.camera ? 'mirror' : r.getRenderTarget() === eng.pre ? 'pre' : 'main';
      if (pass === 'pre' && last !== 'pre') { if (frames >= 2 && !sent) send(); if (!sent) frames++; }
      last = pass;
      if (sent) return;
      let k = group ? group.count : g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0;
      if (!group && Number.isFinite(g.drawRange.count)) k = Math.max(0, Math.min(k - g.drawRange.start, g.drawRange.count));
      const inst = o.isInstancedMesh ? o.count : g.isInstancedBufferGeometry ? Math.min(g.instanceCount, g._maxInstanceCount ?? Infinity) : 1;
      const e = tally.get(key) || tally.set(key, { pre: 0, mirror: 0, main: 0, calls: 0 }).get(key);
      if (o.isMesh) e[pass] += k / 3 * (Number.isFinite(inst) ? inst : 1);
      e.calls++;
    };
  };
  ctx.group.traverse(hook); eng.scene.traverse(hook);      // (the area's own objects are not in the scene until it is entered)
}
