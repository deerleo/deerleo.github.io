// The standing sky: the cast, group "Wind" (stage 3; docs/build/sky/3-cast-plan.md, rows 9, 14, 15, 17).
// Its log: docs/build/sky/3-cast-wind.md. Begun late in a helper's hour: everything here is in its plainest form.
//
// Until the wind comes all of it is still: that stillness is the point. The wind front is the set's (set.js:
// shared.sky.front.z is its line across the route, coming from the east, -z, on the showstopper's clock from t 22;
// plan.show.wind its numbers). Everything here answers that one line, by itself:
//   the sedge      (row 15) the Shallows group's blades carry their own bend (shared.sedge.wind = bow, shiver, front z,
//                  hull): this module only gives it the page's numbers; each tuft bows as the line passes it
//   the hut        (row 14) the Timber group's three moving parts (shared.hut.parts, shared.hut.turns): when the line
//                  reaches the hut the arrow swings 140 degrees to the east with one overshoot, the pail is pushed to 12
//                  degrees at 0.45 Hz and dies away, the shutter lifts off its prop once and knocks (on.knock)
//   the salt dust  (row 15) white, brief: it streams from the tops of the near cones and from the ridge's crest as the
//                  line reaches each (the falls family's dust and its sweep), for 10 s, then thins to a fifth
//   the feathers   (row 9) forty let fall along a line (the Flock group's shared.cast.flock.featherLine if it is there),
//                  which then lie on the water (the falls family's feather and its floaters)
//   one wind       of the ribbons family, sent from the set's own line at the set's own speed in the same frame, for
//                  whatever else is made with a wind (shared.cast.wind.wind)
// shared.cast.wind: the handles for staging (the log lists them).
import { makeFall } from '../../engine/life/falls.js';
import { makeFloaters } from '../../engine/life/floaters.js';
import { makeWind } from '../../engine/life/ribbons.js';
import { makePendulum } from '../../engine/life/machines.js';

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const { stage } = ctx, P = plan, sky = shared.sky, calm = !!stage.calm, TAU = Math.PI * 2;
  if (!sky || !sky.front) { console.warn('sky/cast_wind: no wind front from the set: nothing built'); return {}; }
  const Wn = P.show.wind, speed = calm ? Wn.calmSpeed : Wn.ahead / (Wn.reach - Wn.from), half = calm ? 0.5 : 1;
  const part = (name, fn) => { try { return fn(); } catch (err) { console.error('sky/cast_wind: ' + name + ' was left out: ' + ((err && err.stack) || err)); return null; } };
  const on = { knock: null, hut: null, feathers: null };

  // ---- one wind (it blows to the west, +z; dead still until the line comes)
  const wind = part('the wind', () => makeWind(ctx, { direction: [0, 1], speed, breeze: 0, gustiness: 0.25 }));

  // ---- the sedge: the page's numbers into the kit's own bend (25 degrees: 0.45 of a blade's height; 6 degrees: 0.1)
  if (shared.sedge && shared.sedge.wind) { const v = shared.sedge.wind.value; v.x = 0.45 * half; v.y = 0.1 * half; v.w = 0.3; }

  // ---- the hut's arrow, pail and shutter (still until the line reaches the hut)
  const hut = shared.hut, parts = hut && hut.parts, turns = hut && hut.turns;
  const vane = parts && turns ? part('the vane', () => makePendulum(ctx, { object: parts.vane, axis: 'y', period: 4, settle: 1.2, amplitude: 0 })) : null;
  const pail = parts && turns ? part('the pail', () => makePendulum(ctx, { object: parts.pail, axis: 'z', axis2: 'x', period: 1 / 0.45, settle: 9, amplitude: 0 })) : null;
  const shutter = parts && turns ? parts.shutter : null;

  // ---- the salt dust: from the tops of the near cones (s 150 to 232, within 60 m of the route) and along the ridge's crest
  const points = [];
  for (const c of (shared.cones && shared.cones.near) || []) if (c.s >= 150 && c.s <= 232 && Math.abs(c.d) <= 60) points.push({ x: c.x, y: c.top + 0.03, z: c.z });
  for (let s = 278; s <= 314; s += 3) { const p = sky.at(s, -92, 34), y = shared.ridge && shared.ridge.heightAt ? Math.max(20, shared.ridge.heightAt(s, -92)) : 34; points.push({ x: p.x, y: y + 0.05, z: p.z }); }
  // TAKEN OUT (critique, 8 November: DUST false). It could not be made to read: the wind reaches the near cones when the
  // carried boat is 19 m and more past the last of them, so it blows behind the rider; looked for from s 240 astern and
  // from a boat stopped at s 226 abeam of the cones (.shots/sky_crit_dust0_crop.png, sky_crit_dust_near.png) there is
  // nothing to see: white puffs a metre across on white cones under a pale sky, 22 m off and further. One word puts it back.
  const DUST = false;
  const dust = DUST && points.length ? part('the dust', () => { const d = makeFall(ctx, { kind: 'dust', count: 1500, points, wind: [0, 2.4], color: ['#FFFFFF', '#F3EEFF'] }); d.flow = 0; return d; }) : null;

  // ---- the feathers: most pink, one crimson, two ink; falling 0.5 m/s, drifting west 0.4 m/s; then afloat
  // (the pink is deeper than the page's pale pink: pale on the pale dawn water they could not be told from its sequins.
  // And twelve of the forty come down close ahead of the prow, from 5 m up: at the 20 m of the flock's line a feather is a speck.)
  const PINK = '#E58CA3', COLS = [...new Array(37).fill(PINK), '#D5405F', '#1A1420', '#1A1420'];
  const afloat = part('the feathers afloat', () => makeFloaters(ctx, { kind: 'feather', pool: 48, landed: 600, top: COLS, under: COLS }));
  const fall = part('the feathers', () => makeFall(ctx, { kind: 'feather', count: 0, pool: 48, size: 0.13, wind: [0, 0.4], inside: COLS, outside: COLS, ...(afloat ? { settle: afloat, settleWithin: 45 } : {}), landings: { within: 30, perSecond: 8 } }));
  let burstDone = false;
  const burst = (line, o = {}) => {
    if (!fall) return 0;
    const L = line || (shared.cast.flock && shared.cast.flock.featherLine) || [sky.at(262, 8, 0), sky.at(300, -12, 0)].map((p) => [p.x, p.z]);      // (the default: R1's crossing, along the route from s 262 to s 300, right to left, so that the boat is carried among them)
    const y = o.height ?? 10, a = [L[0][0], y, L[0][L[0].length - 1]], b = [L[1][0], y, L[1][L[1].length - 1]];
    burstDone = true; if (on.feathers) on.feathers(a, b);
    const n = o.count ?? 40, near = o.near ?? Math.round(n * 0.3), f = ctx.path.at(Math.min(ctx.s, ctx.path.length)), bt = ctx.boat;
    const at = (ahead, right) => [bt.x + f.tx * ahead + f.rx * right, 5, bt.z + f.tz * ahead + f.rz * right];
    if (near > 0) fall.burst({ line: [at(6, -3.5), at(10, 3.5)], radius: 1.5, height: 2, count: near, over: o.over ?? 6 });
    return near + fall.burst({ line: [a, b], radius: 2, height: 2, count: n - near, over: o.over ?? 6 });
  };

  const handle = shared.cast.wind = {
    wind, on, vane, pail, dust,
    armed: true,                                                 // false: everything here stays still whatever the set's front does
    auto: true,                                                  // false: the feathers wait for staging's feathers.burst(line)
    feathers: { fall, afloat, burst },                           // burst(line, { count, over, height }): line [[x, z], [x, z]] (default: the Flock group's featherLine)
    speed,                                                       // the line's speed (26 m/s; 14 with reduced motion)
  };

  let sent = false, hutDone = false;
  return {
    update(dt, c) {
      if (!handle.armed) return;
      const T = sky.T, fz = sky.front.z, boat = c.boat;
      // the set's line starts: the family's wind and the dust's sweep are sent from the same line at the same speed, in this frame
      if (!sent && T >= Wn.from) {
        sent = true;
        const from = [boat.x, fz], late = fz - boat.z > 600;        // (the area entered long after the wind: all of it as the wind left it)
        if (wind) { if (late) { wind.settle(1); wind.breeze = 1; } else { wind.front({ from, toward: [0, 1], speed, depth: 8, strength: 1 }); stage.tween(wind, 'breeze', 1, calm ? 6 : 3); } }
        if (dust) { if (late) dust.flow = 0.2; else { dust.flow = 1; dust.sweep({ from, toward: [0, 1], speed, lasts: 10, thins: 4 }); } }
      }
      // the line reaches the hut
      if (!hutDone && hut && T >= Wn.from && fz > hut.at.z) {
        hutDone = true;
        const late = fz - hut.at.z > speed * 25;
        if (vane) { vane.rest(turns.vane.east); if (late) vane.swingTo(turns.vane.east); }
        if (!late) {
          if (pail) pail.push(-turns.pail.east * 0.21 * TAU * 0.45 * half, 0.04 * half);
          if (shutter) stage.tween(shutter.rotation, 'x', turns.shutter.lift * 0.3 * half, 0.7).then(() => stage.tween(shutter.rotation, 'x', 0, 0.35).then(() => { if (on.knock) on.knock(hut.at); }));
          if (on.hut) on.hut(hut.at);
        }
      }
      // the feathers come down under the flock's first ribbon (staging may call feathers.burst itself: then set auto false)
      if (handle.auto && !burstDone && T >= 34 && T < 70) burst();
    },
  };
}
