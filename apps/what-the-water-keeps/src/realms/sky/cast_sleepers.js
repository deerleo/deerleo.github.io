// The standing sky: THE CAST, group "Sleepers" (stage 3; docs/build/sky/3-cast-plan.md, rows 6 and 7 of the page's cast
// table; log: docs/build/sky/3-cast-sleepers.md).
//
//   the sleepers (row 7)   36 flamingos of the toolkit (makeFlamingos, docs/life/flamingo.md) at plan.sleepers: four in the
//                          channel itself, 8 to 12 m from the line (ROOTED: they move the neck and nothing else, and are
//                          solid), ten in the pan mouth, twelve on the left (B), ten further on to the right (C). They
//                          sleep on one leg; one or two at a time wake for a thing of their own (a look, a preen, a
//                          shake; a stretch or a spell of feeding only far from the boat); two of group C feed. Within
//                          10 m of the boat the nearest three draw their heads out and look about; within 6 m a bird
//                          stands tall. In the area's light: lilac-grey below the sunline, no pink (uSunline).
//   the terns (row 6)      6 terns of the toolkit (makeTern, docs/life/seabirds.md) asleep on the stakes that
//                          shared.stakes marks `tern`, 3 m from the line. Each draws its head out when the rider's eye is
//                          within 5 m and settles behind the boat; now and then one shuffles or resettles its head.
//
// The stand-ins 'the sleepers (36 flamingos)' and 'terns (6)' of cast.js are taken out here, by name. cast.js's four soft
// colliders for the channel birds STAY (they are cast.js's own); this module adds only the hard core inside each.
//
// FOR THE STAGER (shared.cast; nothing here follows the showstopper's clock by itself):
//   shared.cast.sleepers = {
//     flock                        the makeFlamingos handle (flock.birds, flock.stats(), flock.wake / sleep / act / put ...)
//     lift({ front, delay, jitter, ribbons, lead })
//                                  the letting go: 24 of the 36 run into the wind and lift; the 12 that stay (the four in
//                                  the channel and eight marked `stay`) draw their heads out and stand watching. front:
//                                  { from: [x, z], dir: [0, 1], speed } (default: the area's own wind line if it is
//                                  running, else a line 60 m ahead of the boat at plan.show.wind's speed); delay: (bird)
//                                  => seconds instead of a front; ribbons: [right, left] (default: the Flock group's R1
//                                  and R3 if they are there, else two of this module's own)
//     heads()                      only the heads: every sleeper draws its head out (the wave of waking without the lift)
//     put(state)                   at once, for a cue's settle: 'gone' (the 24 gone, the 12 standing), 'sleep'
//     on: { preen, wake, run, air, touch, event }      callbacks for sound, all null: preen(bird) (a rustle), wake(bird)
//                                  (a head drawn out), run(bird), air(bird), touch(x, z, kind, strength, metres from
//                                  the boat), event(name, bird) (everything the family reports)
//     groups                       { channel, A, B, C }: indices into flock.birds
//   }
//   shared.cast.terns = {
//     birds                        the six makeTern handles, in the order of the stakes (the first is the nearest the lamp)
//     leave({ to, speed, gap, force })   they leave one by one from the far end (the stake furthest along the route first),
//                                  `gap` seconds apart (1.1), low and east at `speed` (8 m/s). to: (k) => [x, y, z] for the
//                                  k-th to go. A tern the rider is within 20 m of waits until the rider is clear
//     put(state)                   'gone' (hidden, for a settle) or 'asleep' (back on the stakes)
//     on: { shuffle, wake, leave, event }      callbacks for sound, all null: shuffle(bird), wake(bird) (its head comes
//                                  out), leave(bird) (its feet let go), event(name, bird)
//   }
//   shared.cast.birdPaint          { gouache, sunline, lantern, deep }: the paint these birds wear (the area's light, its
//                                  sunline, the bow lantern's law, deeper in the dawn's shade, the page's pink in the
//                                  sun), for the Flock group's near ribbon
//
// Developer switches: &play=sleeperslift (the lift now; with &play=lettinggo,sleeperslift it waits for the wind on the
// show's own clock), &play=ternsleave (the terns go now; with the show, at t 30), &sleepers=0 / &terns=0 leave a kind out.
// For trying other paint: &birdlantern=6 (the lantern's share: this over 1 + the distance squared), &birddeep=9e99bd (what
// multiplies the paint in the dawn's shade), &birdpink=0.85 (how far toward the page's pink in the sun), &ternlift=1.3
// (the terns' paint lifted), &terncap=0 (the family's own sheen on the tern's cap: amber by this lantern).
import { makeFlamingos } from '../../engine/life/flamingo.js';
import { makeTern } from '../../engine/life/seabirds.js';
import { removeStandIn } from '../../engine/modules.js';

export async function build(ctx, plan, shared) {
  const cast = shared.cast = shared.cast || {};
  const { kit } = ctx, P = plan, sky = shared.sky, S = P.sleepers, C = P.colors, W = P.show.wind;
  const params = new URLSearchParams(location.search);
  const dev = { lift: false, terns: false };

  // ---- THE BOW LANTERN'S LIGHT ON THE BIRDS: by the square of the distance, as the stakes they sit on take it
  // (kit_shallows.js), but more of it: 0.6 of it at 3 m where a stake keeps 0.22. Left to the ride's own law (even to its
  // reach) a pale bird 3 m off was lit as if it hung in the lantern; at the stakes' own share it was the lilac of the
  // salt cones behind it and sank into them. A pale bird on a dark stake must be the lighter thing (the client: by value).
  const LANTERN = { light: `{ vec3 slL = uLanternPos - vWPos; c += albedo * pointLight(uLanternPos, uLanternColor, uLanternRadius, N) * (min(${Number(params.get('birdlantern') || 6).toFixed(2)} / (1.0 + dot(slL, slL)), 1.0) - 1.0); }` };
  // IN THE DAWN'S SHADE A BIRD IS THE DARKER THING. By night a sleeper is pale against dark water (it is taken for a salt
  // cone). As the mirror pales (dawn progress 0.3 to 0.55, about s 216 to 236) a bird below the sunline stood pale on pale
  // and was lost at 40 m: there its paint deepens, so that it is a lilac-grey shape against the bright water until the
  // sun reaches it. uSunline.w is the dawn's progress.
  // IN THE SUN A BIRD IS THE PAGE'S PINK. The real bird is white with rose in the wing: above the sunline, lit, it was a
  // white bird on a pale sky and only its ink carried it. Above the sunline its paint is taken toward the page's flamingo
  // pink (plan.colors.flamingo), which is deeper than the dawn sky behind it; the ink stays ink.
  const DEEP = { uniforms: { uSlDeep: { value: new ctx.THREE.Color(params.get('birddeep') ? '#' + params.get('birddeep') : '#9e99bd') }, uSlPink: { value: new ctx.THREE.Color(C.flamingo) }, uSlPinkK: { value: Number(params.get('birdpink') ?? 0.85) } },
    fragmentPars: 'uniform vec3 uSlDeep, uSlPink; uniform float uSlPinkK;',
    albedo: `{ float slSun = skySunlit(vWPos.y);
      albedo *= mix(vec3(1.0), uSlDeep, smoothstep(0.3, 0.55, uSunline.w) * (1.0 - slSun));
      albedo *= mix(vec3(1.0), uSlPink, uSlPinkK * slSun); }` };
  // The birds are made WITHOUT the night air and then adopted into it (sky.adopt): the air's last word on a pixel's alpha
  // must come after the bird's own mark for the painter's filter, or a marked pixel is blended as if the mark were an opacity.
  const gouache = (o) => sky.paint({ ...o, air: false, extend: [...[].concat(o.extend || []), DEEP, LANTERN] });
  const sunline = { uniform: sky.uniforms.uSunline, color: C.plumage };       // out of the sun a bird is its pale plumage, which the area's light makes the page's lilac-grey
  cast.birdPaint = { gouache, sunline, lantern: LANTERN, deep: DEEP };

  // ---------------------------------------------------------------------------------------------- the sleepers
  if (params.get('sleepers') !== '0') {
    const rnd = ctx.rng(57), birds = [], taken = [];
    const hasSoft = !!shared.sleepers;                                          // cast.js built: its four soft colliders are there
    for (const [s, d] of S.A.channel) { birds.push({ at: [s, d], group: 'channel', depth: P.depth.line, keep: true, collide: hasSoft ? { soft: 0, hard: 0.6 } : S.soft }); taken.push([s, d]); }
    // a place is free if no bird stands within a neck's length, no pan rim runs under it and no salt cone stands on it
    const free = (s, d) => {
      for (const [ts, td] of taken) if (Math.hypot(ts - s, td - d) < 1.15) return false;
      for (const b of shared.pans || []) {
        if (!Array.isArray(b.s) || !Array.isArray(b.d)) continue;
        const s0 = Math.min(...b.s), s1 = Math.max(...b.s), d0 = Math.min(...b.d), d1 = Math.max(...b.d);
        if (s > s0 - 1 && s < s1 + 1) for (const rd of b.d) if (Math.abs(d - rd) < 1.0) return false;
        if (d > d0 - 1 && d < d1 + 1) for (const rs of b.s) if (Math.abs(s - rs) < 1.0) return false;
      }
      const p = kit.at(s, d);
      for (const c of (shared.cones && shared.cones.near) || []) if (Math.hypot(p.x - c.bx, p.z - c.bz) < (c.r || 1) + 0.8) return false;
      return true;
    };
    const scatter = (g, name) => {
      const made = [];
      for (let i = 0, tries = 0; i < g.n && tries < 4000; tries++) {
        const s = g.s[0] + rnd() * (g.s[1] - g.s[0]), d = g.d[0] + rnd() * (g.d[1] - g.d[0]);
        if (!free(s, d)) continue;
        const b = { at: [s, d], group: name, depth: P.depth.edge, keep: true };
        birds.push(b); made.push(b); taken.push([s, d]); i++;
      }
      return made;
    };
    scatter(S.A.pan, 'A'); scatter(S.B, 'B');
    const far = scatter(S.C, 'C');
    birds.filter((b) => b.group !== 'channel').forEach((b, i) => { b.stay = i % 4 === 0; });        // 8 of the 32 never lift: with the four in the channel, the twelve that stay
    // two feed in the deeper pan, the two of group C that stand furthest from the line (never one within 20 m of it)
    far.slice().sort((a, b) => Math.abs(b.at[1]) - Math.abs(a.at[1])).slice(0, 2).forEach((b) => { b.state = 'feed'; });

    const on = { preen: null, wake: null, run: null, air: null, touch: null, event: null };
    const flock = await makeFlamingos(ctx, {
      birds, seed: 7, safe: 20,
      wind: [0, 1],                                                             // the wind will come from the east (ahead, -z) and blow toward +z: they face it, their backs to the boat
      // (the page: no more than one bird in eight awake at night. Two feed; of the sleepers one or two more are awake at a time)
      life: { awake: [1, 2], every: [4, 9], acts: { look: 3, preen: 3, shake: 1, feed: 0.5, stretch: 0.4 }, far: 20 },
      near: { within: 10, count: 3, away: 14, linger: 6, alert: 6 },
      gouache, sunline,
      onEvent: (name, b) => {
        if (on.event) on.event(name, b);
        if (name === 'act:preen' && on.preen) on.preen(b); else if (name === 'act:untuck' && on.wake) on.wake(b);
        else if (name === 'run' && on.run) on.run(b); else if (name === 'air' && on.air) on.air(b);
      },
      onTouch: (x, z, kind, strength, metres) => { if (on.touch) on.touch(x, z, kind, strength, metres); },
    });
    sky.adopt(flock.object, { air: 'near' });
    flock.object.name = 'the sleepers (36 flamingos)';
    removeStandIn(ctx, 'the sleepers');

    const way = (pts) => pts.map(([s, d, y]) => { const p = sky.at(s, d, 0); return [p.x, y, p.z]; });
    // where the lifted go if the Flock group's ribbons are not there: the right-hand birds bank left across the route far
    // ahead and go west along the ridge; the left-hand ones rise in front of the ridge and turn over its summit
    const own = [
      { path: way([[214, 40, 2], [250, 46, 9], [276, 32, 18], [290, 0, 26], [296, -40, 32], [280, -84, 40], [230, -104, 46], [150, -112, 50]]), speed: 14, width: 12, depth: 6 },
      { path: way([[226, -33, 2], [256, -40, 10], [286, -56, 20], [306, -80, 30], [302, -106, 40], [270, -122, 46], [200, -128, 50]]), speed: 14, width: 12, depth: 6 },
    ];
    const windLine = () => ({ from: [ctx.boat.x, sky.front && sky.front.z > -5e4 ? sky.front.z : ctx.boat.z - 60], dir: [0, 1], speed: ctx.stage.calm ? W.calmSpeed : W.speed });
    const groups = { channel: [], A: [], B: [], C: [] };
    for (const b of flock.birds) if (groups[b.group]) groups[b.group].push(b.i);
    cast.sleepers = {
      flock, on, groups,
      lift({ front, delay = null, jitter = 2, ribbons = null, lead = 1.5 } = {}) {
        const R = cast.flock && cast.flock.ribbons, calm = ctx.stage.calm;
        const rs = ribbons || (R && R.R1 && R.R3 ? [calm && R.R1calm ? R.R1calm : R.R1, R.R3] : own);
        flock.lift({ front: delay ? null : (front || windLine()), delay, jitter, lead, wind: [0, 1], ribbons: rs, ribbon: (b) => (b.group === 'B' && rs.length > 1 ? 1 : 0) });
      },
      heads() { flock.wake({ to: 'one', front: windLine(), jitter: 1.4 }); },
      put(state) { flock.put(state); },
    };
    ctx.stage.cue('sleeperslift', {}, () => { dev.lift = true; });
  }

  // ---------------------------------------------------------------------------------------------- the terns
  if (params.get('terns') !== '0') {
    const stakes = (shared.stakes || []).filter((st) => st.tern), terns = [];
    const on = { shuffle: null, wake: null, leave: null, event: null };
    const TERN_LIFT = Number(params.get('ternlift') || 1.3);
    // THE CAP IS INK. The family gives black paint a twentieth of a lamp's light so that a cap is seen against the night; by
    // this area's amber lantern that made the cap a red-brown beside the red bill. The same share is kept, in the cap's own
    // cold ink: the amber of it is taken out here, a line before the family adds it.
    const CAP = params.get('terncap') === '0' ? [] : [{ light: '{ float slDark = 1.0 - smoothstep(0.02, 0.12, max(albedo.r, max(albedo.g, albedo.b))); c += (dot(lamps, vec3(0.3, 0.6, 0.1)) * vec3(0.62, 0.66, 1.0) - lamps) * 0.05 * slDark; }' }];
    for (const [i, st] of stakes.entries()) {
      const t = await makeTern(ctx, {
        seed: 40 + i, position: [st.x, st.top, st.z], face: 'along', turn: (i % 3 - 1) * 0.9,      // (seeds 40 to 45: one dozing, three with the bill tucked to the right, two to the left)
        life: { every: [120, 300] },                                            // the page: every 20 to 50 s ONE of the six stirs
        wake: 5, clear: 20, speed: 8, beats: 3.2,
        // (the paint lifted a step: by starlight a tern at the salt's own value sank into the cone rows behind the stakes)
        material: { color: new ctx.THREE.Color(TERN_LIFT, TERN_LIFT, TERN_LIFT * 1.03), extend: [...sky.extend({ air: false }), LANTERN, ...CAP] },
        onEvent: (name, b) => {
          if (on.event) on.event(name, b);
          if (name === 'shuffle' && on.shuffle) on.shuffle(b); else if (name === 'wake' && on.wake) on.wake(b); else if (name === 'lift' && on.leave) on.leave(b);
        },
      });
      sky.adopt(t.object, { air: 'near' });
      t.object.name = `tern on stake ${i + 1}`;
      terns.push(t);
    }
    if (terns.length) removeStandIn(ctx, 'terns (6)');
    const east = (k) => { const p = sky.at(340, -24 - 5 * k, 0); return [p.x, 2.2 + 0.5 * k, p.z]; };      // low and east, on their own side of the line
    cast.terns = {
      birds: terns, on,
      leave({ to = east, speed = 8, gap = 1.1, force = false } = {}) { terns.slice().reverse().forEach((t, k) => t.leave({ to: to(k), speed, wait: gap * k, force })); },
      put(state) { for (const t of terns) { if (state === 'gone') t.hide(); else { t.place(); t.show(); } } },
    };
    ctx.stage.cue('ternsleave', {}, () => { dev.terns = true; });
  }

  return {
    update() {
      // the developer's cues: at once, or (with &play=lettinggo as well) at their moment on the show's own clock
      const T = sky.T;
      if (dev.lift === true && (T < 0 || T >= W.from)) { dev.lift = 'done'; cast.sleepers.lift(); }
      if (dev.terns === true && (T < 0 || T >= 30)) { dev.terns = 'done'; cast.terns.leave(); }
    },
  };
}
