// snow: the cast, group "Owl" (stage 3): the barn owl that crosses the birch river, the white egret that crosses under it
// in the water, and the two egrets that roost in the reflected crown of the oldest tree. The plan:
// docs/build/snow/3-cast-plan.md; the log: 3-cast-owl.md. None of them writes on the water: they are only seen.
//
//   the owl      WINTER (the direct view only). `makeOwl` (docs/life/seabirds.md) on the broken birch's own point
//                (shared.margins.owlPerch: 5.5 m up at s 40, d -10), its back to the river, its head turning away from it
//                every 6 to 9 s. Cue `owl` (in THIS module, at s 32: photograph it with &play=owl): it leans, drops, crosses
//                to (43, -3) at 2.8 m, goes under the bridge at 2.4 m and climbs into the right-hand birches at (60, +16, 9),
//                where it is gone. One glide, on the low stretch
//   its egret    MEMORY (the water only). `makeWader` egret, no life of its own, carried every frame at the owl's own place,
//                heading, bank and beat from the moment the owl's feet let go until it is gone: wing for wing
//   the roost    MEMORY. Two egrets on shared.tree.roosts ((186, +4) 15 m up, (193, -6) 20 m up), hunched on dry perches,
//                shifting now and then; one opens both wings when it is told
//
// FOR THE STAGER (shared.cast.owl): go(), settle(), reset(), owl (position, heading, bank, phase, gliding, state), egret,
// roost[i].do('stretch'), onEvent(name) for the six seconds of hush. The cue `owl` is here: hang sound on { after: 'owl' }.
import * as THREE from 'three';
import { makeOwl } from '../../engine/life/seabirds.js';
import { makeWader } from '../../engine/life/waders.js';

const Q = new URLSearchParams(location.search);

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const F = shared.frame, T = shared.tree, here = shared.here, O = plan.owl;
  if (!F) return {};
  const P = (s, d, y) => { const p = F.at(s, d, 0); return [p.x, y, p.z]; };      // (the river bends: every place through the page's frame)
  const api = shared.cast.owl = { onEvent: null, roost: [] };

  // ================================================================================================ the owl and its egret
  const mp = shared.margins && shared.margins.owlPerch, at0 = F.at(O.perch[0], O.perch[1], O.perch[2]);
  const perch = mp && Number.isFinite(mp.x) ? [mp.x, mp.y, mp.z] : [at0.x, at0.y, at0.z];
  // THE OWL IS PAINTED DOWN. The family's owl is paper white below and pale lavender-grey above; in this area's light (gain
  // 1.52) it is white on white birches against a white sky: on its perch at 13 m it could not be found (the director's
  // rule of 8 November: a thing must part from its ground by value). Its whole paint is multiplied by a slate lavender, so
  // that it is a grey bird on the pale wood and a pale bird over the black water. &owltint=ffffff shows the family's own.
  const tint = '#' + (Q.get('owltint') || '8f8a99');
  const egret = await makeWader(ctx, { species: 'egret', seed: 12, life: false, only: 'mirror', ripples: false, gaze: false });
  const c = { position: [perch[0], perch[1], perch[2]], heading: 0, bank: 0, phase: 0, clip: 'fly' };
  egret.carry(c); egret.hide();
  const owl = await makeOwl(ctx, {
    seed: 2, position: perch, face: 'channel', turn: Math.PI, only: 'direct',         // its back to the river; in the picture only, never in the water
    gaze: { every: [6, 9], angle: [0.3, 0.4] }, speed: O.speed,
    glide: Q.get('owlglide') === '0' ? false : { flap: [1.0, 1.2], glide: [1.0, 1.3] },      // (the family's own staging of this moment: one glide on the low stretch across the bow)
    material: { color: tint },
    onEvent: (name) => {
      if (name === 'lift') egret.show(); else if (name === 'gone') egret.hide();      // the egret is there from the moment the owl lets go
      if (api.onEvent) api.onEvent(name);
    },
  });
  const via = O.path.slice(1, -1).map(([s, d, y]) => P(s, d, y)), to = P(...O.path[O.path.length - 1]);
  let went = false;
  /** The owl leaves its birch and crosses (about 8 s from the lean to the birches). */
  api.go = () => {
    if (went && owl.state !== 'perch') return api;
    went = true;
    if (owl.state !== 'perch') owl.place();
    owl.show(); owl.leave({ via, to, speed: O.speed });
    return api;
  };
  /** The after-state at once: the perch empty, nothing in the water (for a cue's settle). */
  api.settle = () => { went = true; owl.hide(); egret.hide(); return api; };
  /** Back on its birch, to play it again (out of sight). */
  api.reset = () => { went = false; egret.hide(); owl.place(); owl.show(); return api; };
  api.owl = owl; api.egret = egret; api.perch = perch; api.via = via; api.to = to;
  // WHERE THE CUE IS: 5 m before the plan's s 32. The owl needs 3.4 s from its lean to the middle of the river, and the
  // current carries the boat 8 m in that time: sent at s 32 it crosses 5 to 6 m ahead (the page: 10 m), and the egret under
  // it, which the water shows a third of the way from the eye, flies under the rider's own bow and is never seen. Sent at
  // s 27 it crosses 10 m ahead and the egret is in the black water beside the bow for a second and a half. &owlgo=32 tries another.
  const goAt = Q.has('owlgo') ? +Q.get('owlgo') : O.go - 5;
  api.goAt = goAt;
  ctx.stage.cue('owl', { s: goAt, settle: api.settle }, api.go);

  // ================================================================================================ the two that roost
  const given = (T && T.roosts && T.roosts.length ? T.roosts : plan.tree.roosts.map(([s, d, y]) => F.at(s, d, y))).slice(0, 2);
  // WHERE THEY ROOST: NOT THE PLAN'S PLACES. The plan's two ((186, +4) 15 m up, (193, -6) 20 m up) are inside the reflected
  // crown, and the water shows that crown from underneath as a ceiling of blossom: painted red for one picture, neither
  // bird could be found in the water from anywhere on the boat's line. They stand instead on two of the tree's long
  // level limbs UNDER that ceiling, on the far side of the bole from the boat's way round the islet: the north-east limb
  // (seen as the boat comes in, s 160 to 178) and the north limb (seen across the islet, s 180 to 205), about 6 m up and
  // 15 to 27 m from the line: there the water shows them 15 to 26 degrees down, inside an ordinary look ahead.
  // &roostat=plan keeps the plan's places.
  const onLimb = (name, f) => { const q = T && T.paths && T.paths.find((l) => l.name === name); if (!q) return null; const k = Math.round(f * (q.path.length - 1)), a = q.path[k]; return a.clone().setY(a.y + q.radius[k]); };
  const lower = [onLimb('sk_ne', Q.has('roostne') ? +Q.get('roostne') : 0.62), onLimb('sk_n', Q.has('roostn') ? +Q.get('roostn') : 0.55)];
  const roosts = Q.get('roostat') !== 'plan' && lower[0] && lower[1] ? lower : given;
  api.roostAt = roosts.map((r) => [+r.x.toFixed(2), +r.y.toFixed(2), +r.z.toFixed(2)]);
  if (/^[\w-]+\.json$/.test(Q.get('owllog') || '')) fetch('/__shot/' + Q.get('owllog'), { method: 'POST', body: JSON.stringify({ perch, goAt, roosts: api.roostAt, plan: given.map((g) => g.toArray()) }) }).catch(() => {});
  for (const [i, r] of roosts.entries()) {
    const bird = await makeWader(ctx, {
      species: 'egret', seed: 31 + i * 7, position: [r.x, r.y, r.z], dry: true, idle: 'hunch', only: 'mirror', ripples: false, flush: 0,
      // (seen only in the water, 15 to 27 m off, and the water lays its mirror down darker, softer and more violet: at life
      // size and in their own paint they were two blue-grey smudges 12 pixels long. As the birds' family says of a flock
      // that lives in the mirror, they are drawn larger than life, and their white is lifted so that it is the lightest
      // thing in the water after the lamp. &roosttint=ff2020 paints them to be found; &roostscale=1 is life size)
      scale: Q.has('roostscale') ? +Q.get('roostscale') : 1.6,
      material: { color: Q.has('roosttint') ? '#' + Q.get('roosttint') : new THREE.Color(1.7, 1.62, 1.5) },
      face: Math.PI + (i ? -0.7 : 0.5),                                               // down the route, each a little its own way: side-on from the pond's south water
      life: { every: [14, 26], actions: { step: 0, reach: 0, strike: 0, preen: 0, alert: 0, shift: 3, stretch: 1, hunch: 0 } },
    });
    api.roost.push(bird);
  }

  // &roost=stretch@2 (developer): the first roosting egret is told to stretch at that second of the realm's clock (&roost=1:stretch@2 the second)
  const todo = (Q.get('roost') || '').split(',').filter(Boolean).map((w) => { const m = /^(?:(\d):)?(\w+)@([\d.]+)$/.exec(w); return m ? { i: +(m[1] || 0), what: m[2], at: +m[3], done: false } : null; }).filter(Boolean);
  let roostOn = true;
  return {
    update() {
      for (const w of todo) if (!w.done && ctx.time >= w.at) { w.done = true; if (api.roost[w.i]) api.roost[w.i].do(w.what); }
      // the egret keeps the owl's place and beat exactly
      if (owl.state === 'launch' || owl.state === 'fly') {
        c.position[0] = owl.position.x; c.position[1] = owl.position.y; c.position[2] = owl.position.z;
        c.heading = owl.heading; c.bank = owl.bank; c.phase = owl.gliding ? undefined : owl.phase;
        const clip = owl.gliding ? 'glide' : 'fly';
        if (clip !== c.clip) { c.clip = clip; egret.carry(c); }                        // (a wader reads `clip` only when carry() is called)
      }
      // the roost is a memory: it goes with the water's lie through the thaw, and is not kept moving while the pond is far off
      const s = here ? here.s : 0, on = s > 120 && (!shared.memory || shared.memory.amount > 0.4);
      if (on !== roostOn) { roostOn = on; for (const b of api.roost) { if (on) b.show(); else b.hide(); } }
    },
  };
}
