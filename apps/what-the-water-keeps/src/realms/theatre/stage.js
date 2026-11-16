// The theatre of leaves: the route of moments, the showstopper, sound. STAGED (stage 4: docs/build/theatre/4-staging.md).
//
// THE CLOCK IS THE SET'S. The house's hour runs on shared.show.c (set.js: the cue 'hour' at s 54, then
// c = max(c + dt, plan.show.f(s)); -1 before; &c=27 in the address holds it) and shared.show.k (the share of the 890
// flames burning). The light, the flames, the curtain, the sitters, the moths, the leaves, the moon and cloud car A all
// read that one number by themselves. Nothing here starts a second clock: the staging reads shared.show.c for the few
// things that are nobody's (the rower's glance, the music coming into the room) and listens to the cast's hooks.
// &play=hour&t=20 shows the hour twenty seconds in; &c=20 holds it there.
//
// THE CUES (each begun by the boat's s, at any d; &play=<name>, several with commas; none adds anything to draw):
//   bow        s 27.4   the pearl moth crosses the bow. It goes by itself, timed by the boat's own way (pearls.auto.bow: a boat
//                       on the current sets it off at s 19.4, a slow one by about s 27); this cue is only the latest it may go,
//                       and what a picture asks for
//   arches     s 24     a drop from each keystone in turn, left, middle, right
//   first      s 30     the first image: the rower is given the tree in the rain to look at; the hall's sound opens
//   gust       s 38     wind crosses the tear: air.gust(1, { everyone: true }) (column, shaft, crown, chandelier, lustres,
//                       flames, cloth, 400 leaves, the drifts' wave, the moths); `rustle` x 3
//   drips      s 46     the row of drips takes a turn toward the stage
//   hour       s 54     (set.js) the house keeps its hour: see the clock above. The staging's own on that clock: the rower is given
//                       the starboard tiers at c 6.5 and the curtain at c 14; the music comes into the room between c 14 and 26
//   orchestra  s 78     the score's page turns; soft `rustle` (the stands' knocks are the wake's own: cloth.on.knock)
//   arch       s 90     the rollers are heard: `creak` from the front rank, then each within 12 m once a turn
//   painting   s 112    the draught in the backcloth (cloth.backcloth.breathe: the whole cloth swells toward the boat and settles)
//   through    s 120.6  the leaves that come through with the boat; the hanging ropes stir (if the machines are there); the door
//                       closes on the house's sound
//   waves      s 121    the first cloth (at s 128) comes down 3 m in 8 s, its counterweight climbs; the rower looks up at it
//   snow       s 132    the second cloth (at s 139) rises 3 m in 8 s (the page: s 124 and s 136, 10 s each: see the note at the cues)
//   sunrise    s 147    the third cloth's trailing corner: a ring and a `drop`
// By nearness, with no cue of their own (the cast does them where the boat is; the staging gives them their sound):
// the wake-light (s 32 to 40), the hem of the rain (s 51 to 65), the company losing hold (s 92 to 116), the kept
// lamp (s 104 to 115, the engine's), the last rope (s 160).
// SOUND (the page, section 8; measured: the log). `update` moves the bed by the boat's place and the show clock; every hook the cast
// left gets its one-shot through `snd`, rationed where it could come in a crowd; beyond the painting nothing of the house is played.
// &stlog=12 writes, among the tool's page errors 12 s in, the cues fired, every one-shot asked for (by what fired it) and the bed.
// &stlook=36,9,1.5 gives the rower a place (s, d, y) to look at for a minute, to try her head.
//
// The page's list of the route (docs/art/theatre.md, section 6; every moment is latched by the boat's s, at any d, then
// runs in time; none can be missed by going slowly, none resets; no stretch is longer than 13 m without one):
//   s 0 to 26   the foyer         rose water-light fades by s 18 while pearl grows (in the paint already); the first leaves
//                                 float in; one pearl moth crosses the bow. `rain` 0.2, the space low-passed at 1,500 Hz, opening by s 28
//   s 24        the three arches  a drop from each keystone in turn, left, middle, right (6 s, then repeating). `drop` x 3
//   s 30        first image       exposure 0.9 to 1.08 (set.js does it by distance, s 20 to 29); space mix to 0.55, `rain` 0.45
//   s 32 to 40  the wake arrives  water-light climbs the fronts to tier 3; the gilt moths there open. Light only
//   s 38        the gust          14 s: the column leans 5 degrees for 4 s; the shaft dims 30 % and returns at 120 %; 400 leaves
//                                 let go; the drifts on the rails lift in a wave at 9 m/s; lustres and swags swing. `wind`, `rustle` x 3
//   s 46        the row of drips, the fallen sky under the keel (s 48). `drop` in sequence
//   s 51 to 65  the hem of the rain  drops ring the hull, heavy drops from the limbs. `rain` to 0.75, `tick` on the planks
//   s 54        THE HOUSE KEEPS ITS HOUR (40 s on the show clock):
//                 c 0        the draught turns: the column leans 4 degrees toward the stage, floating leaves drift that way. `breath`
//                 c 1 to 6   the chandelier in the tree catches, ring by ring. `bloom` on D3 (50) at c 1.2, `sparkle` at c 4. Once each
//                 c 6 to 20  the tiers, each from the bracket nearest s 58 both ways at 8 m/s (tier 1 at 6, 2 at 8, 3 at 10, 4 at 12,
//                            5 at 14); a sitter rises in each box 1.5 s behind the flame. One `breath` per tier, `flutter`
//                 c 10 to 14 the lustres, in pairs from the rear
//                 c 13 to 27 the curtain: up 11 m in 14 s into nine scallops, the right half 1.2 s behind the left, one catch at 6 m
//                 c 18 to 20 the stage boxes and the twelve brackets on the arch
//                 c 20       the stage moon begins to rise; cloud car A starts down; the company forms
//                 c 25 to 29 the full house. Music 0.62 to 0.88 and reverb 0.6 to 0.45 between c 14 and 26
//                 c 29 to 40 the fall: from tier 5 down, 0.8 s apart, every sitter lets go. `tick` capped at 28 a second. No help from the music
//                 c 40 on    held: the lit house with its boxes empty; over two minutes about 30 boxes gather a sitter again
//   s 78        over the orchestra    the wake knocks the stands. `knock`, `rustle`
//   s 90        under the arch        `creak` from each roller within 12 m
//   s 92 to 116 the painted orchard   the company loses hold one after another and re-forms behind. `rustle`
//   s 104 to 115  the kept lamp       within 8 m both lamps brighten for a breath; A4 (the engine does this: shared.lamp)
//   s 112       the painting          the draught lifts the backcloth's hem 0.3 m. `rustle` at pitch 0.7
//   s 120       through the painting  ctx.wash('#17111A', ...) to 1 over 1 s and back over 1.5 s (heroes_stage.js, by the eye's distance);
//                                     about 60 leaves come through; `rain` and `shimmer` to 0 in 1.2 s, the space low-passed at 1,200 Hz for 2 s
//   s 124       the moon over waves   the first cloth comes down 3 m (hem 3.4 m above the water), its counterweight climbs. `creak` x 2
//   s 136       the tree in snow      the second cloth rises 3 m. `creak`
//   s 147       the sunrise           the third cloth by one corner, its low end drawing rings at d -8. `drop`
//   s 160       the last rope         space mix to 0.12 by s 150; `surf` rising from s 148 to 0.3
// Gaze cues for "Let the current take you": plan.gaze (the engine has no eased gaze yet: not staged). Reduce motion: see the log.
import { at, dev } from './lib.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const q2 = (v) => Math.round(v * 100) / 100;                 // levels move in hundredths: a layer is not retuned every frame

export async function build(ctx, plan, shared) {
  const stage = ctx.stage, C = shared.cast = shared.cast || {}, show = shared.show || { c: -1, k: 0 };
  const V = (s, d = 0, y = 0) => at(ctx, s, d, y), rnd = ctx.rng(4104);
  // the cast's handles (a group whose module failed is simply not there: every use is guarded)
  const air = C.air || null, leaves = C.leaves || null, moths = C.moths || null, pearls = C.pearls || null, pres = C.presences || null, cloth = C.cloth || null;
  const fly = cloth && cloth.fly ? cloth.fly : null;
  const tell = (what, fn) => { try { return fn(); } catch (err) { console.error(`theatre/stage: ${what} failed: ${(err && err.message) || err}`); } };

  // ============================================================================================ sound: the one-shots
  // Every one-shot goes through `snd`, which also counts it (&stlog: nobody here can listen). Nothing is louder than the
  // guide's levels: knocks at half, drops at 0.3 to 0.5, ticks at 0.25 to 0.5; what could come in a crowd is rationed.
  const heard = {}, tokens = { tick: 2, plank: 2, drop: 2, drip: 2, handful: 1 }, spot = { x: 0, z: 0 };
  const doorS = plan.backcloth.s;
  const snd = (name, p, o, what) => {
    if (p && p.z > -(doorS - 0.5) && ctx.s > doorS - 1 && stage.since('through') >= 0) return;      // the boat is beyond the painting: the door has closed on whatever sounds in the house
    const key = what ? name + ':' + what : name; heard[key] = (heard[key] || 0) + 1; const a = ctx.audio; if (a && a.play) a.play(name, p ? { x: p.x, z: p.z, ...(o || {}) } : (o || {}));
  };
  const far = (p) => Math.hypot(p.x - ctx.boat.x, p.z - ctx.boat.z);
  let fallK = 0;                                              // 0..1: how much of the fall is in the air (the show clock, 29 to about 44)
  // a leaf has landed (the Leaves group's and the Presences': the same sound): a `tick` low and soft, from where it landed
  const tick = (x, z, info) => {
    const dist = info && info.distance != null ? info.distance : Math.hypot(x - ctx.boat.x, z - ctx.boat.z);
    if (dist > (fallK > 0.02 ? 40 : 15) || tokens.tick < 1) return;
    tokens.tick -= 1; spot.x = x; spot.z = z;
    snd('tick', spot, { pitch: 0.25 + 0.15 * rnd(), gain: 0.25 + 0.25 * rnd() }, 'leaf');
  };
  if (air && air.on) {
    air.on.drop = (e) => {
      if (e.what === 'heavy') { if (far(e) > 22 || tokens.drop < 1) return; tokens.drop -= 1; snd('drop', e, { pitch: 0.6, gain: e.gain ?? 0.5 }, 'heavy'); }      // the limbs' heavy drops: heard in and near the hem of the rain
      else if (e.what === 'keystone') { if (far(e) < 40) snd('drop', e, { gain: e.gain ?? 0.4 }, 'keystone'); }                                                          // the keystones' three, in their turn
      else if (far(e) < 30 && tokens.drip >= 1) { tokens.drip -= 1; snd('drop', e, { gain: e.gain ?? 0.3 }, 'drip'); }                                                // the row of drips
    };
    air.on.tick = (e) => { if (tokens.plank < 1) return; tokens.plank -= 1; snd('tick', e, { pitch: e.pitch ?? 1.2, gain: Math.min(0.3, e.gain ?? 0.3) }, 'planks'); };      // rain on the rider's planks
    // the draught turning (c 0), then one breath as each tier's edge of flame sets off (c 6, 8, 10, 12, 14): ahead, on one side and the other
    air.on.breath = (e) => { if (e.what === 'kindle') snd('breath', V(Math.min(84, ctx.s + 10), (e.tier % 2 ? -1 : 1) * 13, e.y || 8), { gain: 0.9 }, 'tier'); else snd('breath', e, {}, 'draught'); };
    air.on.bloom = (e) => snd('bloom', e, { note: e.note ?? 50, gain: e.gain ?? 0.6 }, 'D3');           // the chandelier in the tree catches: D3, once
    air.on.sparkle = (e) => snd('sparkle', e, { gain: e.gain ?? 0.35 });                         // c 4, once
  }
  if (cloth && cloth.on) {
    cloth.on.rustle = (e) => snd('rustle', e, { pitch: e.pitch ?? 1 }, e.what);                         // the curtain on its way (0.6, four); the backcloth's breath (0.7)
    cloth.on.creak = (e) => snd('creak', e, { gain: e.what === 'curtain lines' ? 0.4 : 0.3 }, e.what);  // the curtain's lines (three); a fly cloth setting off
    cloth.on.knock = (e) => snd('knock', e, { gain: e.what === 'music stand' ? 0.18 + 0.2 * clamp(e.gain ?? 1, 0, 1) : e.what === 'curtain stop' ? 0.5 : 0.4 }, e.what);
    cloth.on.drop = (e) => snd('drop', e, { gain: 0.3, pitch: 0.8 }, 'cloth corner');                            // the third fly cloth's corner
  }
  if (moths) moths.onLift = (e) => snd('flutter', e, { gain: 0.9 });                             // moths leaving the gilt (the group itself: at most once a second)
  if (pres) {
    pres.onLetGo = (e) => {
      if (e.kind === 'tier') snd('rustle', V(clamp(ctx.s + 6, 40, 84), (e.tier % 2 ? -1 : 1) * 13, e.y || 8), { pitch: 0.8 + 0.06 * e.tier }, 'the fall');      // the fall: five, one as each tier lets go
      else if (e.kind === 'company') snd('rustle', e, { pitch: 0.9 }, 'company');                           // one of the company losing hold
      else if (tokens.handful >= 1) { tokens.handful -= 1; snd('rustle', e, { gain: 0.5, pitch: 1.1 }, 'handful'); }      // a handful shed over the boat
    };
    pres.onLand = tick;
  }
  if (leaves) leaves.onLand = tick;

  // The machines (cast_machines.js: it came in while this was being written, so it is met when it is there and not before; every use is
  // guarded). Its hooks: `creak` (a roller within 12 m, once a turn; a cloud car setting off; the moon beginning to rise), `knock` (a car at
  // its stop; the moon at the top; the hull touching a rope), `rustle` (leaves spilling from a car's bench). Until those hooks are there the
  // rollers' creak is counted here from the set's own turning (shared.stageRig.rollers).
  const RL = (shared.stageRig && shared.stageRig.rollers && shared.stageRig.rollers.list) || [], rollAt = RL.map((q) => V(q.s, q.d, 0.3)), rollTurn = RL.map(() => null);
  const mach = { met: false, creak: false };
  const meetMachines = () => {
    const M = C.machines; if (mach.met || !M) return; mach.met = true;
    const near = (e) => e && (e.near == null || e.near <= 40);
    if (M.on && typeof M.on === 'object') {
      if ('creak' in M.on && !M.on.creak) { M.on.creak = (e) => { if (near(e)) snd('creak', e, { gain: e.what === 'roller' ? 0.3 : 0.25 }, e.what); }; mach.creak = true; }
      if ('knock' in M.on && !M.on.knock) M.on.knock = (e) => { if (near(e)) snd('knock', e, { gain: 0.3 }, e.what); };
      if ('rustle' in M.on && !M.on.rustle) M.on.rustle = (e) => { if (near(e)) snd('rustle', e, { gain: 0.6, pitch: 1.1 }, e.what); };
    }
  };

  // ============================================================================================ the route
  const rower = () => { const m = ctx.boat && ctx.boat.model; return m && m.rower ? m.rower : null; };      // (nothing when she is ashore)
  const glances = { asked: 0, given: 0 };
  // (for &stlog: how her head bone is turned, in its own frame, so that a glance can be told from none without a picture)
  const headOf = () => { const r = rower(), g = r && r.group, h = g && g.getObjectByName ? g.getObjectByName('Head') : null; return h ? `, head [${h.quaternion.toArray().map((v) => v.toFixed(3)).join(' ')}]` : ''; };
  const glance = (p, seconds) => { const r = rower(); glances.asked++; if (r && r.lookAt) { glances.given++; tell('the rower', () => r.lookAt(p, seconds)); } };
  if (dev.has('stlook')) { const q = dev.get('stlook').split(',').map(Number); stage.after(0.05, () => glance(V(q[0], q[1], q[2]), 60)); }      // (&stlook=36,9,1.5: she is given a place (s, d, y) to look at, to try her head)
  const bow = pearls && pearls.auto ? pearls.auto.bow : null;
  stage.cue('bow', { s: (bow && bow.at ? bow.at : 19.4) + 8 }, () => { if (pearls && pearls.crossBow && !(bow && bow.done)) tell('the pearl moth', () => pearls.crossBow()); });
  stage.cue('arches', { s: 24 }, () => { if (air && air.keystones) tell('the keystones', () => air.keystones.turn()); });
  stage.cue('first', { s: 30 }, () => glance(V(plan.tear.s, plan.tear.d, 10), 7));
  stage.cue('gust', { s: 38 }, () => {
    if (air && air.gust) tell('the gust', () => air.gust(1, { everyone: true }));
    else {                                                    // (without the weather: each group by its own handle)
      if (leaves && leaves.burstCrown) tell('the crown', () => leaves.burstCrown({ count: 400, over: 4 }));
      if (pres && pres.sitters && pres.sitters.lift) tell('the drifts', () => pres.sitters.lift({ speed: 9 }));
      if (moths && moths.gust) tell('the moths', () => moths.gust(0.5, 5));
      if (cloth && cloth.gust) { tell('the cloth', () => cloth.gust(1, 0.5)); stage.after(4, () => tell('the cloth', () => cloth.gust(0, 3))); }
    }
    snd('rustle', V(plan.tear.s, plan.tear.d, 14), { pitch: 0.8 }, 'gust');                              // the crown, then round the horseshoe with the wave
    stage.after(1.4, () => snd('rustle', V(46, -15, 9), {}, 'gust'));
    stage.after(3.0, () => snd('rustle', V(50, 15, 9), { pitch: 1.15 }, 'gust'));
  });
  stage.cue('drips', { s: 46 }, () => { if (air && air.drips) tell('the row of drips', () => air.drips.turn()); });
  stage.cue('orchestra', { s: 78 }, () => {
    const pg = cloth && cloth.pages;
    if (pg && pg.list && pg.turn) { const i = pg.list.findIndex((q) => !q.stand); if (i >= 0) tell('the score', () => pg.turn(i)); }
    snd('rustle', V(79, 0, 1), { gain: 0.6, pitch: 1.2 }, 'score');
  });
  stage.cue('arch', { s: 90 }, () => { RL.forEach((q, i) => { if (q.s < 100) stage.after(0.3 + 0.9 * i, () => snd('creak', rollAt[i], { gain: 0.25 }, 'arch')); }); });
  stage.cue('painting', { s: 112 }, () => {
    if (cloth && cloth.backcloth) tell('the backcloth', () => cloth.backcloth.breathe(0.3, 4.5));      // (its own hook gives the rustle at pitch 0.7)
    else snd('rustle', V(plan.backcloth.s, 0, 2), { pitch: 0.7 });
  });
  // through the painting: the leaves that come with the boat are let go here (the Leaves group would do it by itself: taken over, so that it can be played)
  if (leaves && leaves.auto && leaves.through) leaves.auto.through = false;
  stage.cue('through', { s: plan.backcloth.s + 0.6 }, () => {
    if (leaves && leaves.through) tell('the leaves through the painting', () => leaves.through());
    const M = C.machines; if (M && M.ropes && M.ropes.stir) tell('the ropes', () => M.ropes.stir(1, 8));      // the draught through the parted cloth sets the hanging ropes swaying (if the machines are there)
  });
  // The fly tower's two travelling cloths wait for the boat: the first up, the second down (left alone they take turns behind the painting,
  // unseen). `put` sets one where it is to be without a sound; the cues send them on their way.
  // (The page begins them at s 124 and s 136 and gives each 10 s. The current in the tower is 2.4 m/s: the boat is under the first cloth 1.7 s
  // after s 124, when it has come down 0.1 m of its 3, and nobody sees it travel. So each begins as the boat comes in sight of it, 7 m short, and
  // takes 8 s: the first has come down 0.8 m when the boat passes under it and goes on down behind; the second is rising as the boat passes beneath.)
  const put = (i, up) => { if (!fly) return; fly.auto[i] = false; fly.moves[i] = null; fly.at[i] = up; };
  put(0, 1); put(1, 0);
  stage.cue('waves', { s: 121, settle: () => put(0, 0) }, () => {
    if (fly) tell('the first cloth', () => fly.to(0, 0, 8));                                    // (its hooks: `creak` as it sets off, `knock` at its stop)
    stage.after(3.5, () => snd('creak', V(128, 12.5, 8), { gain: 0.3 }, 'counterweight'));                        // its counterweight, climbing the right wall
    // (stage 5, 5-critique.md: she was given the cloth itself, at (128, 0, 6.5), for 7 s. The boat is under it in three seconds and ten metres past it in seven: from
    // the seat her head went back as far as a neck goes and stayed there, her face to the grid. She looks up the tower instead, at the far cloths, for four seconds:
    // twenty degrees up as the boat comes through the painting, under thirty when she lets go.)
    glance(V(150, 0, 12), 4);
  });
  stage.cue('snow', { s: 132, settle: () => put(1, 1) }, () => { if (fly) tell('the second cloth', () => fly.to(1, 1, 8)); });
  stage.cue('sunrise', { s: 147 }, () => { const p = V(150, -8, 0); ctx.water.ripple(p.x, p.z, 1.0, 0.6); snd('drop', p, { gain: 0.3, pitch: 0.8 }, 'sunrise'); });

  // ============================================================================================ every frame
  const axis = V(plan.tear.s, plan.tear.d, 0), eye = { s: 0 }, bed = {};
  const logAt = dev.has('stlog') ? +dev.get('stlog') || 0 : null;
  let said = false;
  return {
    update(dt) {
      const a = ctx.audio, s = ctx.s, c = show.c, k = show.k || 0, now = ctx.time, calm = stage.calm;
      meetMachines();

      // ---- the rations: the fall's landings rise for 3 s, hold and thin (the page: at most 28 a second; half that with reduced motion)
      fallK = c < 0 ? 0 : sm(29, 32, c) * (1 - sm(38, 44, c));
      const rate = lerp(3, calm ? 14 : 28, fallK);
      tokens.tick = Math.min(Math.max(2, rate * 0.25), tokens.tick + rate * dt);
      tokens.plank = Math.min(2, tokens.plank + 6 * dt); tokens.drop = Math.min(2, tokens.drop + 1.6 * dt); tokens.drip = Math.min(2, tokens.drip + 1.6 * dt); tokens.handful = Math.min(1, tokens.handful + dt / 1.5);

      // ---- the hour (shared.show.c): the cast keeps its times by itself; these are the staging's own
      if (c >= 0) {
        // (the rower cannot look at the fire in the tree as it catches: it is fifty degrees to port of the bow and she turns her head no further
        // than thirty-eight that way. She looks where the rider is shown the next thing: the edge of flame running up the starboard tiers.)
        if (stage.beat('hour.tiers', c, 6.5)) glance(V(Math.min(84, s + 14), 14, 7), 6);
        if (stage.beat('hour.curtain', c, 14)) glance(V(90.8, 0, 9), 8);                                        // and at the curtain as it goes up
      }

      // ---- the rollers: each within 12 m creaks once a turn (unless the machines have a hook of their own for it)
      if (!mach.creak && s > 84) for (let i = 0; i < RL.length; i++) {
        const n = Math.floor(now / RL[i].period + RL[i].phase);
        if (rollTurn[i] !== null && n !== rollTurn[i] && far(rollAt[i]) <= 12) snd('creak', rollAt[i], { gain: 0.3 }, 'roller');
        rollTurn[i] = n;
      }

      // ---- reduced motion: the wash at the painting is a longer, softer fade (the set's own is by the eye's distance: about a second up, a second and a half down)
      if (calm && s > 112 && s < 128) {
        const e = ctx.engine.shared.uCameraPos.value, q = ctx.path.locate(e.x, e.z, s, eye), s0 = plan.backcloth.s;
        const w = q.s < s0 ? sm(s0 - 4.6, s0 - 0.2, q.s) : 1 - sm(s0 + 0.1, s0 + 5.2, q.s);
        if (w > 0.002) ctx.wash('#17111A', w);
      }

      // ---- sound by place and by the clock (the page, section 8)
      const door = stage.since('through'), shut = door >= 0 && s > plan.backcloth.s - 1;        // the prow is through the painting: a door closes on the house (a rider who paddles back through it hears the house again)
      const dist = Math.hypot(ctx.boat.x - axis.x, ctx.boat.z - axis.z), fl = sm(122, 150, s);
      // rain by distance to the tree: 0.7 inside the column, 0.6 at its edge, 0.45 from the arches (the first image), 0.25 from the stage
      let rain = dist <= 8 ? 0.7 : dist <= 10.5 ? lerp(0.7, 0.6, (dist - 8) / 2.5) : dist <= 29 ? lerp(0.6, 0.45, (dist - 10.5) / 18.5) : lerp(0.45, 0.25, clamp((dist - 29) / 21, 0, 1));
      if (s < 28) rain = lerp(0.2, rain, sm(18, 28, s));                                         // heard through the foyer's wall
      if (shut) rain = 0;
      const mk = c < 0 ? 0 : sm(14, 26, c);                                                      // the music comes into the room with the kindling
      bed.rain = q2(rain);
      bed.wind = q2(lerp(0.22 + 0.28 * (air ? air.windNow || 0 : 0), 0.4, fl)); bed.tone = q2(lerp(0.3, 0.2, fl));
      bed.shimmer = shut ? 0 : q2(0.28 * k);                                                     // flame and glass, once the house is lit
      bed.surf = q2(0.3 * clamp((s - 148) / 22, 0, 1));                                          // the sea beyond the fly tower
      bed.gain = q2(lerp(lerp(0.62, 0.88, mk), 0.5, fl)); bed.reverb = q2(lerp(lerp(0.6, 0.45, mk), 0.2, fl));
      bed.musicLow = fl <= 0 ? 20000 : Math.round(600 * Math.pow(1400 / 600, 1 - fl) / 20) * 20;      // (the track has almost nothing above 1 kHz: the low-pass is only heard from about 1,400 down)
      bed.mix = q2(lerp(lerp(0.3, 0.55, sm(20, 30, s)), 0.12, fl));                              // the foyer is a smaller room; the hall opens at the arches; the fly tower is dry
      bed.low = shut && door < 2 ? 1200 : s < 28 ? Math.round(1500 * Math.pow(20000 / 1500, sm(18, 28, s)) / 10) * 10 : 20000;
      if (a && a.layer) {
        a.layer('rain', bed.rain, shut ? 1.2 : 2);
        a.layer('wind', { level: bed.wind, tone: bed.tone }, 1.5);
        a.layer('shimmer', bed.shimmer, shut ? 1.2 : 3);
        a.layer('surf', bed.surf, 3);
        a.music({ gain: bed.gain, reverb: bed.reverb, lowpass: bed.musicLow }, 2);
        a.space({ mix: bed.mix, lowpass: bed.low }, shut && door < 4 ? 1 : 2.5);
      }

      if (logAt != null && !said && now >= logAt) {
        said = true;
        const cues = Object.keys(stage.fired).map((n) => n + (stage.fired[n] === -Infinity ? '(settled)' : '@' + stage.fired[n].toFixed(1))).join(' ');
        const all = `at ${now.toFixed(1)} s: s ${s.toFixed(1)}, c ${c.toFixed(1)}, calm ${calm}; cues ${cues || 'none'}; one-shots ${JSON.stringify(heard)}; bed ${JSON.stringify(bed)}; cast ${['air', 'leaves', 'moths', 'pearls', 'presences', 'cloth', 'machines'].filter((n) => C[n]).join(',')}; rower ${rower() ? 'aboard' : 'ashore'}, glances ${glances.given} of ${glances.asked}${headOf()}`;
        for (let i = 0; i * 330 < all.length; i++) console.error(`NOT AN ERROR (&stlog): theatre/stage ${i + 1}: ` + all.slice(i * 330, (i + 1) * 330));      // (the tool cuts a long line: in pieces)
      }
    },
  };
}
