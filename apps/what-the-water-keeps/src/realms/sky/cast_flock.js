// The standing sky: THE CAST, group "Flock" (stage 3; docs/build/sky/3-cast-plan.md, row 8 of the page's cast table;
// log: docs/build/sky/3-cast-flock.md). The three thousand flamingos of the dawn.
//
//   the near 300 (ribbon R1)   rigged birds of the toolkit (makeFlamingos, docs/life/flamingo.md) in the nearer part of the
//                              right pans, in the sleepers' paint (shared.cast.birdPaint). Asleep, one in twelve feeding;
//                              a boat within 30 m wakes the nearest twenty. They lift by real pattering runs, a ring a
//                              footfall, and fly ribbon R1: left across the route far ahead, then west along the ridge.
//   the far 2,700              the birds family's far flamingo (makeMurmuration with homes, docs/life/birds.md), two flocks:
//                              `right` (the rest of the right pans: ribbon R2, climbing to 60 m and wheeling away south) and
//                              `left` (the left pans and the ridge's foot: ribbon R3, rising in front of the ridge and
//                              turning back over its summit). Asleep, one in twelve head-down; halved in the mirror.
//   Lilac-grey until the sun reaches each bird: below the sunline (shared.sky.sunlineY, every frame) no pink. In the
//   area's own light and night air ('far': not there by starlight, found by the false dawn, solid at first light).
//
// The stand-in 'the flock (3,000 flamingos asleep)' of cast.js is taken out here, by name.
//
// FOR THE STAGER (shared.cast.flock; nothing here follows the showstopper's clock by itself):
//   lift({ ribbon, front, jitter, join })   the lift. ribbon: 'R1' | 'R2' | 'R3' (left out: all three). front: { from: [x, z],
//                              dir: [0, 1], speed } (left out: the area's own wind line, shared.sky.front.z, at
//                              plan.show.wind's speed; 14 m/s with reduced motion). Each bird goes when the line reaches
//                              it, plus 0 to `jitter` (1.4) s. A far bird the line has ALREADY passed is put where it
//                              would be by now (so a clock entered part-way shows the ribbons part-way); a near one
//                              starts its run at once. With reduced motion R1 takes its calm route (60 m ahead).
//   heads({ front })           only the near 300's wave of heads (they draw their heads out and stand)
//   back({ share, over })      from t 70: one in `share` (6) of the near 300 come back over `over` (25) s, land where they
//                              stood and sleep
//   put(state)                 at once, for a cue's settle: 'gone' (every ribbon long gone, the 300 that stay standing) | 'sleep'
//   centre(out)                the middle of R1's birds in the air (a Vector3; returns how many): for the flutters
//   ribbons                    { R1, R1calm, R2, R3 }: each { path: [[x, y, z], ...], speed, width, depth }
//   featherLine                [[x, z], [x, z]]: the line on the water under R1 where it crosses the route (right to left):
//                              for the Wind group's feathers.burst({ line })
//   on: { touch, run, air, event }   callbacks for sound, all null: touch(x, z, kind, strength, metres) (every footfall
//                              of the near 300's runs: kind 'run'), run(bird), air(bird), event(name, bird)
//   stay                       { R2, R3 }: the share of each far flock that never lifts (300 birds in all; change it before
//                              lift() if another share is wanted); near, far: the families' handles
//
// Developer switches: &play=flocklift (the lift now, the line starting 80 m ahead; with &play=lettinggo,flocklift it
// waits for the wind, t 22, on the show's own clock, and entered later it shows the ribbons part-way);
// &play=flockgone (the settle state: put('gone')); &play=flocklift,flockback (back() twenty seconds after the lift);
// &flocklog=30 writes what every bird is doing at that second to .shots/sky_flock_log.json;
// &flock=0 leaves the whole flock out, &flock=near / &flock=far one half of it.
import { makeFlamingos } from '../../engine/life/flamingo.js';
import { makeMurmuration } from '../../engine/life/birds.js';
import { removeStandIn } from '../../engine/modules.js';
import { smooth, lerp } from './plan.js';

export async function build(ctx, plan, shared) {
  const cast = shared.cast = shared.cast || {};
  const { THREE, kit } = ctx, P = plan, sky = shared.sky, C = P.colors, W = P.show.wind, Fl = P.flock, Rd = P.ridge;
  const params = new URLSearchParams(location.search), which = params.get('flock');
  if (which === '0') return {};
  const dev = { lift: false, back: false, since: 0, logged: false };

  // ---------------------------------------------------------------------------------------------- who stands where
  // (the layout's own rule, as its stand-in had it: loose crowds by a noise, 1,700 in the right pans, 500 in the left
  // pans, 800 along the ridge's foot; nothing within 57 m of the line past the causeways' end, nothing on the hut)
  const rnd = ctx.rng(157), dens = (s, d) => kit.fbm(s * 0.045 + 3, d * 0.045 + 7, 3, 5);
  const nearRecs = [], homesR = [], homesL = [];
  const home = (s, d, y) => { const p = sky.at(s, d, 0); return [p.x, y, p.z, Math.PI + (rnd() - 0.5) * 0.8]; };       // facing into the wind (east), give or take
  for (let n = 0, tries = 0; n < Fl.right.n && tries < 60000; tries++) {
    const s = lerp(Fl.right.s[0], Fl.right.s[1], rnd()), d = lerp(Fl.right.d[0], Fl.right.d[1], Math.pow(rnd(), 1.25));
    if (s > 232 && d < 57) continue;
    if (rnd() > smooth(0.36, 0.62, dens(s, d))) continue;
    // THE JOIN: no line between the rigged birds and the simple ones. Across the band d 60 to 105 a place is kept by one
    // family or the other with a chance that changes across the band
    // (the rigged 300 stand abreast of and ahead of where the boat is when the wind comes, s 225 on: they are the first of
    // the right pans to lift and the nearest to where R1 crosses the route)
    if (nearRecs.length < 300 && s > 225 && rnd() < 1 - smooth(60, 105, d)) nearRecs.push({ at: [s, d], state: nearRecs.length % 12 === 5 ? 'feed' : 'sleep' });
    else homesR.push(home(s, d, 0));
    n++;
  }
  for (let n = 0, tries = 0; n < Fl.left.pans && tries < 60000; tries++) {
    const s = lerp(Fl.left.s[0], 231, rnd()), d = lerp(Fl.left.d[1], Fl.left.d[0], Math.pow(rnd(), 1.2));
    if (Math.hypot(s - P.hut.at[0], d - P.hut.at[1]) < 4) continue;
    if (rnd() > smooth(0.36, 0.62, dens(s, d))) continue;
    homesL.push(home(s, d, 0)); n++;
  }
  for (let n = 0, tries = 0; n < Fl.left.foot && tries < 60000; tries++) {
    const s = lerp(Rd.s[0] + 2, Rd.s[1] - 4, rnd()), d = lerp(-27, Rd.d[1] + Rd.skirt + 1, Math.pow(rnd(), 0.8));
    if (rnd() > smooth(0.3, 0.6, dens(s * 1.7, d * 1.7))) continue;
    homesL.push(home(s, d, 0.06)); n++;                                          // along the ridge's foot, on the crust terraces
  }
  const stay = { R2: 200 / Math.max(1, homesR.length), R3: 100 / Math.max(1, homesL.length) };      // the 300 that never lift

  // ---------------------------------------------------------------------------------------------- the three ribbons
  // [s, d, height]. A far ribbon begins low over the upwind part of its birds' ground and first runs east, into the wind,
  // climbing 3 m in every 14: each bird flies its own way for a moment and is then drawn onto the ribbon from its start.
  const way = (pts) => pts.map(([s, d, y]) => { const p = sky.at(s, d, 0); return [p.x, y, p.z]; });
  const R1 = { path: way([[226, 74, 3], [246, 68, 8], [264, 52, 16], [282, 20, 24], [290, -20, 30], [286, -60, 36], [262, -92, 42], [215, -100, 48], [150, -104, 54], [40, -110, 58]]), speed: 14, width: 12, depth: 6 };
  const R1calm = { ...R1, path: way([[226, 74, 3], [250, 72, 8], [285, 60, 16], [312, 30, 24], [320, -10, 30], [312, -55, 36], [280, -92, 42], [215, -100, 48], [150, -104, 54], [40, -110, 58]]) };      // the same ribbon 60 m ahead of the boat instead of overhead
  // (a far bird is drawn onto its ribbon from up to 0.3 of the ribbon's `length` behind its start: the first stretch is low
  // and nearly level, so that the birds strung out behind the start are over the water and not under it)
  const R2 = { path: way([[262, 108, 6], [318, 110, 13], [362, 128, 24], [396, 168, 38], [404, 228, 52], [376, 290, 60], [306, 340, 62], [204, 380, 64], [60, 420, 66], [-150, 470, 70]]), speed: 14, width: 18, depth: 6, length: 300 };
  const R3 = { path: way([[296, -37, 6], [332, -46, 11], [362, -66, 19], [374, -96, 29], [354, -120, 40], [314, -114, 46], [270, -110, 50], [200, -125, 56], [100, -150, 62], [-20, -185, 66], [-200, -240, 70]]), speed: 14, width: 16, depth: 6, length: 300 };
  const cross = way([[284, 26, 0], [290, -26, 0]]);
  const windLine = (ahead) => ({ from: [ctx.boat.x, ahead != null ? ctx.boat.z - ahead : sky.front && sky.front.z > -5e4 ? sky.front.z : ctx.boat.z - 80], dir: [0, 1], speed: ctx.stage.calm ? W.calmSpeed : W.speed });
  const on = { touch: null, run: null, air: null, event: null };

  // ---------------------------------------------------------------------------------------------- the near 300
  let near = null;
  if (which !== 'far' && nearRecs.length) {
    const paint = cast.birdPaint || {};
    near = await makeFlamingos(ctx, {
      birds: nearRecs, seed: 11, safe: 20, depth: P.depth.edge, collide: false,
      wind: [0, 1],                                                             // it will blow from the east: they face it, and run into it
      near: { within: 30, count: 20, away: 34, linger: 10, alert: 0 },          // a boat within 30 m of them wakes the nearest twenty for ten seconds
      gouache: paint.gouache || ((o) => sky.paint({ ...o, air: false })), sunline: paint.sunline || { uniform: sky.uniforms.uSunline, color: C.plumage },
      ribbons: [R1],
      onEvent: (name, b) => { if (on.event) on.event(name, b); if (name === 'run' && on.run) on.run(b); else if (name === 'air' && on.air) on.air(b); },
      onTouch: (x, z, kind, strength, metres) => { if (on.touch) on.touch(x, z, kind, strength, metres); },
    });
    sky.adopt(near.object, { air: 'far' });
    near.object.name = 'the flock: the near 300 (ribbon R1)';
  }

  // ---------------------------------------------------------------------------------------------- the far 2,700
  // The far family's shader has a sunline of its own under the area's name for its own (uSunline): it is given another
  // name before the flock is adopted into the area's light, or the two meet in one shader (asked of the engine: the log).
  const farSun = [], farPre = [], far = {};
  const intoTheAreasLight = (flock) => {
    for (const m of [flock.mesh, flock.mirror]) {
      const mat = m && m.material;
      if (!mat || !mat.uniforms || !mat.uniforms.uSunline || mat.uniforms.uFarSunline) continue;
      mat.vertexShader = mat.vertexShader.replace(/\buSunline\b/g, 'uFarSunline'); mat.fragmentShader = mat.fragmentShader.replace(/\buSunline\b/g, 'uFarSunline');
      mat.uniforms.uFarSunline = mat.uniforms.uSunline; delete mat.uniforms.uSunline; mat.needsUpdate = true;
      farSun.push(mat.uniforms.uFarSunline); if (mat.uniforms.uPreSun) farPre.push(mat.uniforms.uPreSun);
    }
    sky.adopt(flock.object, { air: 'far' });
  };
  if (which !== 'near') {
    const make = (homes, ribbon, seed, name) => {
      if (!homes.length) return null;
      const f = makeMurmuration(ctx, { species: 'flamingo', count: homes.length, homes, feeding: 1 / 12, scale: 1, fog: 1, material: { shade: 1 }, seed,
        length: ribbon.length, width: ribbon.width, depth: ribbon.depth, speed: ribbon.speed, path: ribbon.path, closed: false,
        sunline: { y: 400, soft: P.sunlineSoft / 2, color: C.plumage }, mirror: { count: Math.round(homes.length / 2) } });
      intoTheAreasLight(f); f.object.name = name;
      return f;
    };
    far.right = make(homesR, R2, 31, 'the flock: the far right pans (ribbon R2)');
    far.left = make(homesL, R3, 37, 'the flock: the left pans and the ridge foot (ribbon R3)');
  }
  if (near || far.right || far.left) removeStandIn(ctx, 'the flock');

  const lifted = { R1: false, R2: false, R3: false };
  const lateBy = (f) => { const l = Math.hypot(f.dir[0], f.dir[1]) || 1, dx = f.dir[0] / l, dz = f.dir[1] / l, v = f.speed || 26; return (i, x, z) => ((x - f.from[0]) * dx + (z - f.from[1]) * dz) / v; };
  cast.flock = {
    near, far, on, stay, ribbons: { R1, R1calm, R2, R3 }, featherLine: cross.map((p) => [p[0], p[2]]),
    counts: { near: nearRecs.length, right: homesR.length, left: homesL.length },
    lift({ ribbon = null, front = null, jitter = 1.4, farJitter = 3, join = 9, again = false } = {}) {
      const f = front || windLine(), calm = ctx.stage.calm, go = (name) => (!ribbon || ribbon === name) && (again || !lifted[name]) && (lifted[name] = true);
      // (a ribbon lifts once: a second call would put a far flock back on the ground and raise it again. `again: true` insists.
      // The far birds' own delay is longer than the page's 1.4 s: it is what strings a far ribbon out along its way)
      if (far.left && go('R3')) far.left.lift({ delay: lateBy(f), jitter: farJitter, stay: stay.R3, wind: [0, 1], join });
      if (far.right && go('R2')) far.right.lift({ delay: lateBy(f), jitter: farJitter, stay: stay.R2, wind: [0, 1], join });
      if (near && go('R1')) near.lift({ front: f, jitter, wind: [0, 1], ribbons: [calm ? R1calm : R1] });
    },
    heads({ front = null } = {}) { if (near) near.wake({ front: front || windLine(), jitter: 1.4 }); },
    back({ share = 6, over = 25 } = {}) { if (near) near.land({ who: (b) => b.i % share === 0, then: 'sleep', jitter: over }); },
    // at once, for a cue's settle. 'gone': every ribbon long gone and the 300 that stay standing; 'sleep': all of them home
    put(state) {
      const gone = state === 'gone';
      if (near) near.put(gone ? 'gone' : state);
      for (const [fl, share] of [[far.right, stay.R2], [far.left, stay.R3]]) if (fl) fl.lift(gone ? { delay: () => -600, jitter: 0, stay: share, wind: [0, 1], join: 9 } : { stay: 1 });
      lifted.R1 = lifted.R2 = lifted.R3 = gone;
    },
    centre(out) { return near ? near.centre(out) : 0; },
  };
  ctx.stage.cue('flocklift', {}, () => { dev.lift = true; });
  ctx.stage.cue('flockgone', {}, () => cast.flock.put('gone'));                    // (developer: the settle state)
  ctx.stage.cue('flockback', {}, () => { dev.back = true; });                     // (developer: twenty seconds after the lift, back())
  const logAt = params.has('flocklog') ? Number(params.get('flocklog')) || 10 : null;      // &flocklog=30: what every bird is doing then, to .shots/sky_flock_log.json

  // (critique, 8 November: the area's heaviest view is the one back at the wind, 1.75 million triangles. Once the wind's
  // line is four seconds past the boat the whole lake is chop and nothing as small as a bird is to be found in it: from
  // then on the flock is not drawn for the mirror. Until the wind every bird keeps its twin in the water.)
  let windSince = -1, unmirrored = false;
  const pre = new THREE.Color(), plum = new THREE.Color(C.plumage), deep = new THREE.Color(params.get('birddeep') ? '#' + params.get('birddeep') : '#9e99bd'), one = new THREE.Color(1, 1, 1);
  return {
    update(dt) {
      // the far birds' own sunline follows the area's; and in the dawn's shade they deepen as the sleepers do (pale by
      // night against the dark water, the darker thing once the water pales)
      const k = smooth(0.3, 0.55, sky.e || 0);
      pre.copy(one).lerp(deep, k).multiply(plum);
      for (const u of farSun) u.value.x = sky.sunlineY ?? 400;
      for (const u of farPre) u.value.copy(pre);
      if (!unmirrored && (sky.wind || 0) > 0.98) {
        if (windSince < 0) windSince = ctx.time;
        if (ctx.time - windSince > 4) { unmirrored = true; if (near) ctx.only(near.object, 'direct'); for (const f of [far.right, far.left]) if (f && f.mirror) f.mirror.visible = false; }
      }
      // the developer's cue: at once, or (with &play=lettinggo as well) at the wind on the show's own clock
      const T = sky.T;
      if (dev.lift === true && (T < 0 || T >= W.from)) { dev.lift = 'done'; cast.flock.lift(T < 0 ? { front: windLine(80) } : {}); }
      if (dev.lift === 'done') { dev.since += dt || 0; if (dev.back === true && dev.since > 20) { dev.back = 'done'; cast.flock.back(); } }
      if (logAt != null && !dev.logged && ctx.time >= logAt) {
        dev.logged = true;
        const out = { time: +ctx.time.toFixed(2), showClock: +(+T).toFixed(2), counts: cast.flock.counts, near: near ? near.stats() : null, sleepers: cast.sleepers ? cast.sleepers.flock.stats() : null, sunlineY: sky.sunlineY };
        fetch('/__shot/sky_flock_log.json', { method: 'POST', body: JSON.stringify(out, null, 1) }).catch(() => {});
      }
    },
  };
}
