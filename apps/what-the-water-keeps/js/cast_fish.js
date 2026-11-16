// landing: the cast, group "Fish" (stage 3): what the tea-brown water lets the eye in to see (clear to 0.9 m).
// docs/build/landing/3-cast-fish.md; the plan: docs/build/landing/3-cast-plan.md; families: docs/life/fish.md, swimmers.md.
//
//   7. Fish: 60 rudd in two shoals (A, 34, beside the staithe; B, 26, at the edge of raft A), one pike beside the
//      staithe, and rises anywhere within 30 m, one every 2.5 s (2.5 a second in a hatching zone: (49, 0), (59, 0), (69, 0)).
//
// Everything here is drawn before the water and is left out of the mirror (the families do that). Nothing leaps and no
// mouth comes to the surface; every home is kept clear of the staithe's seven pairs of piles, its wet step, the sunk
// punt, the ford and the lily rafts.
//
// LEFT FOR THE STAGER: shared.cast.fish = { rudd, rises, zones, pike, burst(k), hatch(i, rate, seconds), settle(rate) }
// (see the end of build, and the log).
//
// Developer switches: &fish=rudd | pike | rises (a comma list: build only these; &fish=none builds none);
//   &fishlog=1 prints the beds' depths and what the pike says of its water.
import { makeSchool, makeRises } from '../../engine/life/fish.js';
import { makeSwimmer } from '../../engine/life/swimmers.js';

const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
// ONE WORD EACH to switch a thing off. Shoal B is among the first things to cut (the plan): SHOAL_B.
const RUDD = true, SHOAL_B = true, PIKE = true, RISES = true;
// the pike leaves when the boat's middle comes this near (the page: 2.5 m. But the moored boat's middle is 2.35 m from its lie, and
// postcard 3 is the pike seen from the mooring: at 2.5 it is gone to its refuge before the first picture. &shy=2.5 tries it)
const SHY = QS.has('shy') ? +QS.get('shy') : 1.8;
const PT = (QS.get('piketint') || '').split(',').map(Number), PIKE_TINT = PT.length === 3 && PT.every((v) => v === v) ? PT : [0.70, 0.55, 0.30];

export async function build(ctx, plan, shared) {
  const cast = shared.cast = shared.cast || {};
  const P = plan, path = ctx.path, stage = ctx.stage, boat = ctx.boat;
  const at = (s, d, y = 0) => P.at(path, s, d, y);                              // the page's (s, d, height) as [x, y, z]
  const want = (name) => { const q = QS.get('fish'); return q == null ? true : q.split(',').includes(name); };
  const bed = (s, d) => { const [x, , z] = at(s, d); return P.ground(path, x, z).y; };      // the bed's height there (negative)
  const fish = cast.fish = { rudd: null, rises: null, zones: [], pike: null, burst() { return fish; }, hatch() { return fish; }, settle() { return fish; } };

  // ---- what stands in the water beside the mooring: the staithe's seven pairs of piles (staithe.py: PAIRS, the rows
  // 0.02 and 0.98 m in from its channel edge), and the wet step abeam of the moored boat (two stakes)
  const S = P.staithe, timber = [];
  for (const x of [0.36, 2.14, 3.92, 5.60, 7.40, S.M1[0] - S.s[0], S.M2[0] - S.s[0]]) for (const d of [S.d[0] - 0.02, S.d[0] - 0.98]) { const [px, , pz] = at(S.s[0] + x, d); timber.push([px, pz, 0.11]); }
  const stepAt = shared.heroes && shared.heroes.staithe && shared.heroes.staithe.step ? path.locate(shared.heroes.staithe.step[0], shared.heroes.staithe.step[2], null, {}) : { s: S.step, d: S.d[0] + 0.2 };
  for (const ds of [-0.32, 0.32]) { const [px, , pz] = at(stepAt.s + ds, stepAt.d); timber.push([px, pz, 0.14]); }

  // ================================================================================================ rises
  // A ring of 0.5 / 0.35, one in five showing a back and a dorsal fin (adds 0.3 / 0.5): one every 2.5 s within 30 m of
  // the boat. Their places are chosen here, not by the family, so that no fish comes up through a lily pad, a pile,
  // the sunk punt or a stone of the ford. Each rise within 12 m is a `drop` from the ring's own callback.
  if (RISES && want('rises')) {
    const A = P.pads, loc = {};
    const taken = (s, d) =>
      (s > A.A.s[0] - 0.6 && s < A.A.s[1] + 0.6 && d > A.A.d[0] - 0.6) ||                               // raft A, to the reed edge
      (s > A.B.s[0] - 0.6 && s < A.B.s[1] + 0.6 && d > A.B.d[0] - 0.6 && d < A.B.d[1] + 0.6) ||         // raft B
      (s > A.C.s[0] - 0.6 && s < A.C.s[1] + 0.6 && d > A.C.d[0] - 0.6 && d < A.C.d[1] + 0.6) ||         // raft C
      (s > 6.5 && s < 31.5 && d < -7.4) ||                                                             // the staithe, the gangway, the jetty and their water
      Math.hypot(s - P.punt.at[0], d - P.punt.at[1]) < 3.4 ||                                          // the sunk punt
      Math.abs(s - P.bridge.s) < 2.2;                                                                  // the ford's stones and the bridge's piles
    const area = (rnd) => {
      for (let k = 0; k < 10; k++) {
        const a = rnd() * 6.2832, r = 3 + Math.sqrt(rnd()) * 27, x = boat.x + Math.sin(a) * r, z = boat.z + Math.cos(a) * r, q = path.locate(x, z, null, loc);
        if (q.s < 0.5 || q.s > path.length - 0.5 || Math.abs(q.d) > q.halfWidth - 1.3 || taken(q.s, q.d)) continue;
        return [x, z];
      }
      return [1e5, 1e5];                                                           // nowhere fit this time: the family skips it
    };
    const rises = fish.rises = makeRises(ctx, {
      every: 2.5, near: 30, area, backs: 0.2, ring: [0.5, 0.35], backRing: [0.3, 0.5],
      onTouch: (x, z) => { if (Math.hypot(x - boat.x, z - boat.z) < 12) ctx.audio.play('drop', { x, z, pitch: 0.7, gain: 0.35 }); },
    });
    // the three hatching zones of the showstopper: they stand at rate 0 until the stager sets them going
    for (const [zs, zd] of [[49, 0], [59, 0], [69, 0]]) { const [x, , z] = at(zs, zd); fish.zones.push(rises.zone({ x, z, radius: 9.5, rate: 0 })); }
    /** Zone i (0, 1, 2) climbs to `rate` rises a second over `seconds` (the page: 2.5 over 4 s). */
    fish.hatch = (i, rate = 2.5, seconds = 4) => { const zn = fish.zones[i]; if (zn) stage.tween(zn, 'rate', rate, seconds); return fish; };
    /** For a cue's settle: every zone at `rate` at once (0 puts them out). */
    fish.settle = (rate = 2.5) => { for (const zn of fish.zones) zn.rate = rate; return fish; };
    if (QS.has('hatch')) fish.settle(+QS.get('hatch') || 2.5);                     // (&hatch=1: the three zones at their full from the start, for a picture)
  }

  // ================================================================================================ rudd
  // Drawn 22 cm, deep-bodied, rust-amber fins. Shoal A (34) lives in the strip of water between the staithe's face and
  // the moored hull, from the wet step down to M2 (under the wet rope): 1 to 3 m from the rider's eye at the mooring
  // (postcard 3). Shoal B (26) wanders the near edge of raft A, where the released boat passes within about 4 m.
  // Each follows a wandering point, turns together with a straw flash, parts round the hull and bursts from it.
  if (RUDD && want('rudd')) {
    const [sx, , sz] = at(stepAt.s, stepAt.d);
    // (A: the point keeps 1.5 m from the step and the shoal is 2.4 m long, so no fish reaches the step's stakes at s 14.3)
    const schools = [{ count: 34, home: { s: [15.6, 19.0], d: [-8.5, -7.9] }, depth: [0.1, 0.26], spread: [0.3, 0.07, 1.2],
      avoid: [{ x: sx, z: sz, r: 1.5 }, ...timber.map(([x, z]) => ({ x, z, r: 0.45 }))] }];
    // (B: in the open water beside raft A, whose edge is at d 1.5, ALONG THE RELEASED BOAT'S OWN LINE (d -2.3 at s 30.5,
    // -0.8 at s 36): this water mirrors the pale sky, and a rudd 2.5 m off under it cannot be seen at all
    // (.shots/landing_fish_11_shoalB_log.png: the shoal is in that picture). So the hull comes to them: they are seen
    // under the bow's right side, burst from it with their boils, and regroup behind)
    if (SHOAL_B) schools.push({ count: 26, home: { s: [30.5, 36], d: [-1.6, 1.0] }, depth: [0.12, 0.3] });
    const rudd = fish.rudd = makeSchool(ctx, {
      species: 'rudd', schools, seed: 7, floor: bed(16.5, -8.2) + 0.05,            // (the bed beside the staithe: a fish pushed down by the hull stops there)
      colors: { fin: '#9A4E22' }, flash: { color: '#E9C877' },
      // the page's boil, a dozen of them (34 at once read as rain: the family's page); a dart of 0.6 m, not the
      // family's 1.0: shoal A has 0.5 to 1.1 m of water between it and the staithe's piles, and a fright from the hull
      // sends it that way
      burst: { radius: 0.6, boil: [0.25, 0.3] },
    });
    /**
     * A fright in shoal k (0: beside the staithe; 1: by raft A), away from a place [x, z]. Left out, shoal 0 flees the
     * foot of M2 (the wet rope's moment at s 18: the fish go up the staithe's face, not into its piles) and shoal 1 the boat.
     */
    const m2 = at(S.M2[0], S.M2[1] + 0.5);
    fish.burst = (k = 0, from) => { const q = from || (k === 0 ? [m2[0], m2[2]] : [boat.x, boat.z]); rudd.burst(k, { x: q[0], z: q[1] }); return fish; };
    if (QS.has('burst')) stage.after(+QS.get('burst') || 2, () => fish.burst(0));      // (&burst=2: the fright two seconds in, for a picture)
    if (QS.has('fishlog')) stage.every(2.5, () => console.info(`INVALID_ (log) t=${stage.time.toFixed(1)} rudd: ` + rudd.schools.map((sc, k) => { const q = path.locate(sc.centre.x, sc.centre.z, null, {}); return `shoal ${k} at s ${q.s.toFixed(1)}, d ${q.d.toFixed(1)}, ${(-sc.centre.y).toFixed(2)} m down`; }).join('; ')));
  }

  // ================================================================================================ the pike
  // 0.85 m, hanging still along the staithe's face in the strip of water beside the moored boat, its head up the
  // route (the page's place, (12.6, -9.5), is under the deck between the two rows of piles, where it has no room to
  // turn and 0.27 m of water: the log). Its refuge, 6 m ahead of it, is among the stems of raft C. It is never told to
  // strike. The staithe's piles and the step are its `clear`; its open side is the channel's.
  if (PIKE && want('pike')) {
    const lieS = 12.3, lieD = -8.62, y = Math.min(-0.16, bed(lieS, lieD) + 0.16), ry = Math.min(-0.2, bed(6.5, -7.0) + 0.15);
    const lie = at(lieS, lieD, y), face = at(lieS - 2.6, lieD), refuge = at(6.5, -7.0, ry), open = at(lieS - 0.6, -7.7);
    const pike = fish.pike = await makeSwimmer(ctx, {
      species: 'pike', at: lie, toward: [face[0], face[2]], refuge, open: [open[0], open[2]], clear: timber, shy: SHY,
      // the family's pike is a clear mint green with pink fins, a cut-out in this amber water: its paint is taken to
      // the landing's olive bronze and rust (&piketint=r,g,b tries others)
      material: { color: new ctx.THREE.Color(...PIKE_TINT), caustics: { intensity: 0.3 } },
    });
    // the shoal beside it keeps a hole round it while it hangs, and bursts if it moves in
    if (fish.rudd && pike.swimmers && pike.swimmers[0]) { const h = pike.swimmers[0].head; fish.rudd.threat(() => [h.x, h.y, h.z], { radius: 0.9 }); }
    if (QS.has('fishlog')) console.info(`INVALID_ (log) pike: lies ${(-y).toFixed(2)} m down over a bed ${(-bed(lieS, lieD)).toFixed(2)} m down; room ${JSON.stringify(pike.room ? pike.room() : null)}`);
  }
  if (QS.has('fishlog')) console.info(`INVALID_ (log) beds: rudd A ${(-bed(16.5, -8.2)).toFixed(2)} m, rudd B ${(-bed(30, 1.5)).toFixed(2)} m, the page's pike place ${(-bed(12.6, -9.5)).toFixed(2)} m; the step at s ${stepAt.s.toFixed(2)}, d ${stepAt.d.toFixed(2)}`);
  return {};
}
