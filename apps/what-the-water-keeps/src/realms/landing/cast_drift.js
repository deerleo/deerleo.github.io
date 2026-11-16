// The landing: the cast, group "Drift" (stage 3): what the wind carries, and what lies and stands in it.
// Plan: docs/build/landing/3-cast-plan.md (group "Drift"); log: docs/build/landing/3-cast-drift.md. Family: falls
// (docs/life/falls.md). Rows 1, 10, 12 and 13 of the page's cast table (docs/art/landing.md, section 5).
//
//   seed down, in the air   2,600 in a box of 26 by 8 by 26 m that goes with the boat (makeFall, kind 'down'). It goes
//                           where the area's wind goes (shared.landing.wind: its way, and its strength, so the hush of the
//                           crossing stills the seed with the reeds), at 0.3 to 0.5 m/s, quicker as each crest of the reed
//                           wave passes the boat; it sinks 0.03 m/s, wanders 0.4 m, never rises. THE FORWARD-SCATTER RULE
//                           is the family's own for this kind (dull straw at 0.55, plus a pale gold x cos^6 to the sun):
//                           here it is given the AREA'S sun (shared.landing.toSun, followed as it sinks). It is not put in
//                           the reeds' shade: what burns in front of the dark bank is lit by the light that comes through
//                           the bed, as the fire in the reeds is
//   puffs                   30 to 50 from each of the nine reedmace stands (shared.kit.stands) each time a crest of the
//                           reed wave passes THAT stand (the same wave the plants' paint draws: one stand after another as
//                           it crosses the water at 4 m/s), from three of its heads, leaned as the heads are leaned
//   seed down, afloat       280 strewn on open water (makeFloaters, kind 'down'), and room for what lands within 10 m of
//                           the boat; in the area's shade (L.extend); it makes way for the bow, rides the rings, takes the
//                           prow lantern's light when that is lit (gouache's own)
//   the lily pads           are kit_plants.js's (they ARE the family's floaters: they rock on every ring, part round the
//                           bow and close in six seconds). Here: the turned lane of eighteen, on a first ride only
//   the reed wave           the crest at a place as a function, for the staging (the wind's sound) and for the puffs
//
// On the water: one seed landing in twenty, within 12 m, writes a ring of 0.03 / 0.08 (the family's landings).
//
// FOR THE STAGER: shared.cast.drift (the list is at the end of build, and in the log).
//
// Developer switches: &dr=hush (no seed leaves the stands), &dr=ring (a fish-rise ring every 3 s in the middle of raft A:
// to watch the leaves rock), &dr=lane / &dr=nolane (the turned lane whatever the ride's number), &dr=bare (no seed in the
// air at large: puffs only), &dr=noseed (none of the seed, to compare cost), &dr=thick (twelve times the seed afloat: to
// find and look at the tufts), &dr=say (prints the counts); several with commas; &skip=cast_drift leaves all of it out.
import { makeFall } from '../../engine/life/falls.js';
import { makeFloaters } from '../../engine/life/floaters.js';

const TAU = Math.PI * 2;
const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');

// ---- the group's own numbers (the page's, the plan's; plan.js has the places)
const NUMBERS = {
  // box: the field that goes with the boat. The family's recipe for this area is 44 by 12 by 44 m, which is one seed
  // to nine cubic metres: from postcard 4 a dozen were near enough to be seen, and most of the box was against the
  // sky, where a lit seed is light on light. The same 2,600 in 26 by 8 by 26 m is one to two cubic metres, most of it
  // below the line of the reed tops as the rider sees them; beyond thirteen metres the seed is the stands' own puffs
  // (what is seen before the far bank is the seed between the eye and the bank, which is still there)
  // sky: the colour a seed takes where it is seen against the sky (the family's `sky`: from/to are the sine of the
  // elevation over which it comes in). The client's rule of 8 November: dull straw on a bright sky is nothing at all
  // (.shots/landing_drift_sky_away_a_crop.png); a shade deeper it is a dark speck on the light
  // (_sky_away_b_crop.png). Toward the sun nothing changes: there the seed is its light. (&seedsky=0: without)
  air: { count: 2600, box: [26, 8, 26], wind: [0.3, 0.5], within: 12, share: 0.05,      // wind: metres a second in a trough and on a crest
    sky: { color: '#6A5A36', from: 0.06, to: 0.24 },
    // how a far seed is drawn (the family's: 6 pixels at the least, keeping 0.85 of its light, sizes differing by 0.3).
    // So drawn, a puff twenty metres off was a cluster of equal cream discs, each thirty times brighter than a seed
    // that size could be: fairy lights (.shots/landing_drift_p4_a_crop.png). Smaller, fainter, no two alike: dust
    // (0.45 of its light was still a row of white dots along the far reeds, from the mooring: .shots/landing_drift_moor.png;
    // spread: one of a puff wanders this far from the rest, over about this many seconds: a smoke, not a bunch)
    // scatter: the light a seed takes toward the sun. The page's is #FFE7A8 at 1.1; added over a dark reed that comes
    // out cream, nearly white: a bank of white dots (.shots/landing_drift_gold_a_crop.png). A step deeper, #FFD27A at
    // 1.0, it is gold in a gold evening (_gold_b_crop.png). The rule itself is the page's: the sixth power of the
    // cosine, dull straw at 0.55 away from the sun. (&seedgold=FFE7A8&seedgain=1.1 shows the page's own, to compare)
    look: { minPixels: 4.5, farLight: 0.22, vary: 0.5, spread: 1.5, spreadOver: 3,
      scatter: { color: '#' + (QS.get('seedgold') || 'FFD27A'), gain: +(QS.get('seedgain') || 1.0), power: 6 } } },
  // a puff: how many leave a stand on one crest; from how many of its heads; how far up a clump its heads are; the
  // puff's radius and height at a head; seconds over which one head lets go; how ragged the heads' starts are; how
  // far a head is leaned down the wind on a crest; the pool (the page's rule: what leaves in the 12 s one lasts and
  // the 2.7 s a puff takes, and one crest more: 9 x 40 x 14.7 / 7 + 9 x 50 = 1,200, and room)
  puff: { count: [30, 50], heads: 3, high: 0.8, radius: 0.35, tall: 0.5, over: 1.2, ragged: 1.5, lean: 0.2, pool: 1400, lasts: 12 },
  // size: the family's tuft is 2.2 to 3.4 cm across, which from the rider's seat (the nearest water is 1.5 m from the
  // eye) is four pixels: twelve times the count showed two specks beside the hull (.shots/landing_drift_afloat_thick_crop.png).
  // Drawn 5 to 8 cm, as the ride draws a petal four times life
  afloat: { count: 280, pool: 120, drift: 0.05, s: [-8, 80.5], d: [-17, 17], deep: 0.06, size: [0.05, 0.08],
    near: [4.5, 9, 0.2, 0.04] },                                 // within 4.5 m of the course all of them; to 9 m a fifth; beyond, one in twenty-five
  lamp: { radius: 1.5, gain: 0.9 },                              // seed within this of the LIT prow lantern takes its amber
  wavePhase: 0.4,                                                // the plants' own jitter (light.js: 0 to 0.8): its middle
};

// adding to a gouache material after it has been made (the floaters make their own): the same thing kit.gouache's
// `extend` does, at the marks gouache leaves in its shaders (as kit_plants.js does for the pads)
function extendMaterial(mat, ex) {
  for (const h of ['vertexPars', 'vertexLocal', 'vertexWorld']) if (ex[h]) { if (!mat.vertexShader.includes(`//@${h}`)) throw new Error(`cast_drift: gouache has no mark ${h}`); mat.vertexShader = mat.vertexShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`); }
  for (const h of ['fragmentPars', 'albedo', 'light', 'fog', 'final']) if (ex[h]) { if (!mat.fragmentShader.includes(`//@${h}`)) throw new Error(`cast_drift: gouache has no mark ${h}`); mat.fragmentShader = mat.fragmentShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`); }
  if (ex.defines) Object.assign(mat.defines, ex.defines);
  if (ex.uniforms) Object.assign(mat.uniforms, ex.uniforms);
  mat.needsUpdate = true;
  return mat;
}

export async function build(ctx, plan, shared) {
  const cast = shared.cast = shared.cast || {};
  const L = shared.landing, P = plan, K = shared.kit || {}, path = ctx.path, S = ctx.engine.shared;
  if (!L) throw new Error('cast_drift needs shared.landing (light.js)');
  const N = NUMBERS, want = new Set((QS.get('dr') || '').split(',').filter(Boolean));
  const rnd = ctx.rng(1201), updates = [];

  // ============================================================================================ the reed wave
  // The wave the plants' paint draws (light.js, plantExt): crest = 0.5 + 0.5 sin(k (root . way) - w t + jitter), on the
  // engine's clock. Here as a function of a place, for the puffs and for the staging.
  const W = P.wind, kWave = TAU / W.length, wWave = TAU / W.period, wv = L.wind.value;      // wv.x, .y: the way the wind travels (x, z); wv.z: its strength
  const phaseAt = (x, z) => kWave * (x * wv.x + z * wv.y) - wWave * S.uTime.value + N.wavePhase;
  const wave = {
    length: W.length, period: W.period, speed: W.length / W.period, way: [wv.x, wv.y],
    /** 0..1: how far the reeds at (x, z) are leaned by the wave now (1 on the crest), times the wind's strength. */
    crest: (x, z) => (0.5 + 0.5 * Math.sin(phaseAt(x, z))) * wv.z,
    /** Seconds until the next crest passes (x, z). */
    next: (x, z) => ((((phaseAt(x, z) - Math.PI / 2) % TAU) + TAU) % TAU) / wWave,
    /** The wind's strength now, 0..1 (the staging hushes it for the crossing: shared.landing.wind). */
    get strength() { return wv.z; },
  };

  // ============================================================================================ seed down
  let down = null, tufts = null, leaving = !want.has('hush');
  const stands = K.stands || [];
  if (!want.has('noseed')) {
    // ---- afloat: on open water only (not on the turf, the hards or the peat of the bed)
    const loc = {}, gq = {};
    // (and mostly along the boat's own course, where a tuft can be seen at all: it is a thing of six centimetres, and
    // strewn evenly over the whole water there was one to eight square metres, none in most pictures. The course: from
    // the mooring out to the line by about s 26, then the line)
    const T = P.title, near = N.afloat.near;
    const open = (x, z) => {
      const q = path.locate(x, z, null, loc);
      if (!(q.s > N.afloat.s[0] - 1 && q.s < N.afloat.s[1] + 1) || !(P.ground(path, x, z, gq).y < -N.afloat.deep)) return 0;
      const k = Math.min(1, Math.max(0, (q.s - T.s - 2) / 10)), off = Math.abs(q.d - T.d * (1 - k * k * (3 - 2 * k)));
      return off < near[0] ? 1 : off < near[1] ? near[2] : near[3];
    };
    tufts = makeFloaters(ctx, { kind: 'down', scatter: { count: N.afloat.count * (want.has('thick') ? 12 : 1), s: N.afloat.s, d: N.afloat.d, where: open }, pool: N.afloat.pool, drift: N.afloat.drift, size: N.afloat.size, seed: 1203 });
    // (the area's shade: without it the tufts in the backwater's shade were as pale as those in the sun)
    extendMaterial(tufts.object.material, L.extend({ rim: 0, soft: 0.5 }));
    tufts.object.name = 'cast: seed down afloat';

    // ---- in the air
    const lampColor = ctx.engine.lanternColor ? ctx.engine.lanternColor.clone() : '#FFC27A';
    const SKY = QS.get('seedsky') === '0' || !N.air.sky ? null : QS.get('seedsky') ? '#' + QS.get('seedsky') : N.air.sky.color;
    down = makeFall(ctx, { kind: 'down', count: want.has('bare') ? 0 : N.air.count, pool: N.puff.pool, lasts: N.puff.lasts, box: N.air.box,
      wind: [wv.x * N.air.wind[0] * wv.z, wv.y * N.air.wind[0] * wv.z], sun: L.toSun.toArray(),
      globe: { radius: N.lamp.radius, color: lampColor, gain: N.lamp.gain },
      settle: tufts, settleWithin: 10, landings: { within: N.air.within, share: N.air.share }, seed: 1202, ...N.air.look,
      ...(SKY ? { sky: { color: SKY, from: N.air.sky.from, to: N.air.sky.to, overhead: false } } : {}) });
    down.object.name = 'cast: seed down';
    const sunU = [];
    down.object.traverse((o) => { const u = o.material && o.material.uniforms && o.material.uniforms.uFallSun; if (u) sunU.push(u); });

    // ---- a puff from one stand: from a few of its heads, where the wave has leaned them
    const puff = (i, age = 0, count = null) => {
      const st = stands[i]; if (!st || !st.clumps || !st.clumps.length) return 0;
      const C = N.puff, n = count ?? Math.round((C.count[0] + rnd() * (C.count[1] - C.count[0])) * Math.min(1, wv.z)), heads = Math.min(C.heads, st.clumps.length);
      let out = 0;
      for (let h = 0; h < heads; h++) {
        const c = st.clumps[Math.floor(rnd() * st.clumps.length)], k = C.lean * wv.z;
        out += down.burst({ at: [c.x + wv.x * k, (c.height || 2.4) * C.high, c.z + wv.y * k], radius: C.radius, height: C.tall, count: Math.max(1, Math.round(n / heads)), over: C.over, delay: rnd() * C.ragged - age });
      }
      return out;
    };
    // (a picture taken four seconds in must not show a world in which no seed has ever left a stand: the crests that
    // passed each stand in the last ten seconds have their puffs already in the air, as old as they would be)
    if (leaving) stands.forEach((st, i) => { const a = W.period - wave.next(st.x, st.z); for (const age of [a, a + W.period]) if (age < 10.5) puff(i, age); });
    const due = stands.map((st) => wave.next(st.x, st.z));

    updates.push(() => {
      // the wind: the area's, quicker on the crest that is passing the boat; stilled with the reeds
      const b = ctx.boat, c = 0.5 + 0.5 * Math.sin(phaseAt(b.x, b.z)), sp = (N.air.wind[0] + (N.air.wind[1] - N.air.wind[0]) * c) * wv.z;
      down.wind.set(wv.x * sp, wv.y * sp);
      for (const u of sunU) u.value.set(L.toSun.x, L.toSun.y, L.toSun.z, 1);
      // a crest has just passed a stand: its seconds-to-the-next have jumped from nothing to a whole period
      for (let i = 0; i < stands.length; i++) {
        const nx = wave.next(stands[i].x, stands[i].z);
        if (nx > due[i] + 0.5 * W.period && leaving && wv.z > 0.35) puff(i);
        due[i] = nx;
      }
    });
    cast.drift = { seed: down, afloat: tufts, puff };
  } else cast.drift = { seed: null, afloat: null, puff: () => 0 };

  // ============================================================================================ the lily pads
  // (kit_plants.js: shared.kit.pads. The lane of eighteen across raft B, from M2 toward the bridge's wide span, lies
  // bronze side up and still rocking on a first ride: something has just gone through. On a later ride it lies as the
  // rest do.)
  const firstRide = (ctx.engine.rides || 0) === 0;
  const lane = {
    pads: K.pads ? K.pads.lane : [], firstRide, turned: false,
    /** Lay the lane wrong side up (or back), and set it rocking (0..1: it dies away over thirty seconds). */
    set(on, rock = 0) { if (!K.pads) return; K.pads.turn(this.pads, { flip: !!on, rock }); this.turned = !!on; },
  };
  if (K.pads && !QS.has('lane') && !want.has('nolane') && (firstRide || want.has('lane'))) lane.set(true, 1);
  if (want.has('ring') && K.pads) {                             // (developer: a ring through raft A, to watch the leaves rock)
    const A = K.pads.rafts.A, mid = A.reduce((m, p) => { m.x += p.x / A.length; m.z += p.z / A.length; return m; }, { x: 0, z: 0 });
    ctx.stage.every(3, () => ctx.water.ripple(mid.x, mid.z, 0.5, 0.35), 0);
  }

  // ============================================================================================ for the stager
  //   drift.seed      the fall (makeFall's handle): density 0..1, wind (this module sets it every frame), burst(spec)
  //   drift.afloat    the floating seed (makeFloaters' handle): cover 0..1, drift, add(x, z)
  //   drift.leaving   true / false: does seed leave the stands on each crest (false: the hush). drift.hush(on) sets it
  //   drift.puff(i)   let stand i (shared.kit.stands) puff now, whatever the wave
  //   drift.wave      { crest(x, z) 0..1, next(x, z) seconds, strength, length, period, speed, way }: the reed wave
  //   drift.crest(x, z)   short for wave.crest: drive the wind's sound from it at the listener's place
  //   drift.lane      { pads, firstRide, turned, set(on, rock) }: the turned lane of eighteen
  Object.assign(cast.drift, {
    wave, crest: wave.crest, lane, stands, pads: K.pads || null,
    hush(on = true) { leaving = !on; },
  });
  Object.defineProperty(cast.drift, 'leaving', { get: () => leaving, set: (v) => { leaving = !!v; }, enumerable: true });

  if (want.has('say')) console.error(`DRIFT seed in the air ${down ? down.count : 0}, pool ${down ? down.pool : 0}; afloat ${tufts ? tufts.count : 0}, pool ${tufts ? tufts.pool : 0}; stands ${stands.length}; lane ${lane.pads.length} pads, turned ${lane.turned}, first ride ${firstRide}; wind way ${wv.x.toFixed(2)}, ${wv.y.toFixed(2)}, strength ${wv.z}; stands (s, d) ${stands.map((st) => `(${st.s}, ${(+st.d).toFixed(1)})`).join(' ')}`);

  return { update(dt) { for (const f of updates) f(dt); } };
}
