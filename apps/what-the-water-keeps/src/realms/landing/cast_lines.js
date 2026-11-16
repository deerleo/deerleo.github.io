// The landing: the cast, group "Lines" (stage 3): everything that hangs, swings and drips. None of it is alive; all of
// it is cast. Plan: docs/build/landing/3-cast-plan.md (group "Lines"); log: docs/build/landing/3-cast-lines.md.
// Families: ribbons (docs/life/ribbons.md: makeRopes) and falls (docs/life/falls.md: the drip kind of makeFall).
// Rows 5, 9 and 11 of the page's cast table (docs/art/landing.md, section 5).
//
//   the wet rope    hangs from the upper neck of mooring post M2 (shared.heroes.staithe), on the face the mooring sees,
//                   its turns under the iron pin, its tail a forearm above the water (a tail IN the water is held by it
//                   and is still in two seconds: docs/life/ribbons.md). On a first ride it is wet and swinging across
//                   the water: 0.35 m either way at 0.42 Hz, most of it gone in 20 s, all but still in 40 (a first kick of
//                   0.74). The boat's wake kicks it (the family's). On a later ride it hangs dry and still
//   its drops       from three places down the wet length, falling 0.3 to 0.9 m: about one every 1.5 s at rest and
//                   quicker the harder it swings (ropes.energy). EVERY DROP HEARD IS THE DROP THAT DREW THE RING: one
//                   ring of 0.25 / 0.2 and one `drop` (pitch 1.3, gain 0.25) from the same landing
//   the painter     from the boat's ring to the upper neck of M1 while the boat lies moored (the boat's own modelled
//                   coil stays on the foredeck: the painter's spare turns). letGo(): it slips off the post, falls
//                   (0.6 / 0.5), trails (0.2 along 1.5 m) and is drawn in over the bow. If nobody lets it go it slips
//                   by itself when the boat pulls it taut
//   the eel traps   are kit_pilings.js's (nine, each on a pendulum of its own: shared.kit.trapSwing). Here: the kick
//                   that travels: struck one after another as a flock's wind reaches them, never in step; and the
//                   swifts' party sets it off each time its leader shoots the span (shared.cast.swifts.onSpan)
//   the cloth       is kit.js's (the engine's draped cloth). Here: the drops from the nine hems
//
// FOR THE STAGER: shared.cast.lines = { ropes, traps, drips, painter, wet } (the list is at the end of build, and in the log).
//
// Developer switches (&ln= with commas): kick (the traps are struck from mid span at 2 s, as the swifts will), go (the
// painter is let go at 2 s), dry (the rope as on a second ride), still (no first kick), say (prints what was made);
// &skip=cast_lines leaves all of it out.
import * as THREE from 'three';
import { makeRopes } from '../../engine/life/ropes.js';
import { makeFall } from '../../engine/life/falls.js';

const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');

// ---- the group's own numbers (the page's and the plan's; plan.js has the places)
const NUMBERS = {
  post: 0.085,                                                   // a mooring post's radius at its upper neck (2-heroes-mooring.md: 17 cm thick there)
  wet: { length: 1.0, radius: 0.016, hz: 0.42, settle: 20, kick: 0.74, share: [0.12, 1], color: '#c2ae7e', turns: 3,      // (paler than the family's hemp: the wet length is drawn a third darker, and what stands behind it from the mooring is a post's shaded face and dark water. As deep as #9a8558 the wet rope could not be told from its post: .shots/landing_lines_rope_strip_crop.png against _dry_calm_crop.png)
    // its drops: at these shares of its length; so many drops to a place; seconds between one place's drops; how many
    // of them are out when the rope hangs still (all of them when it swings its hardest); their colour
    drips: { at: [0.4, 0.7, 1.0], per: 3, every: [3.2, 7.6], rest: 0.4, color: '#EAD9A6' },
    tail: [0.08, 0.15, 0.1] },                                   // what the swinging tail flings on the water each swing: strength, radius; and the least swing that does
  // hideOwn: hide the boat's own modelled rope (the coil on the foredeck) while the painter is ashore, as the plan has
  // it. It is NOT hidden: the coil is in the title's picture as it was composed, it reads as the painter's spare turns
  // (coil, ring, post: one rope), and shown again after the release it appeared on the bare foredeck between one frame
  // and the next, 2.3 m from the eye (.shots/landing_lines_haul_strip_crop.png)
  painter: { radius: 0.012, color: '#a39474', slack: 1.07, turns: 2, splash: [0.6, 0.5], trail: [0.2, 0.3, 1.5], aboard: 5, haul: 2.2, hideOwn: false },
  traps: { degrees: 12, seconds: 6, radius: 36, speed: 15, apart: 0.3 },
  // (lift: a hem that hangs in the water drips from a fold this far above it. color: the door stands in the brightest
  // light of the area, the sun dead behind it: a pale bead that takes the sun, the family's drop, could not be found
  // there at all (.shots/landing_lines_hems_strip_crop.png, first take). These are beads of the fen's tea, dark on the
  // lit cloth, and they do not take the sun)
  hems: { every: [3, 6], lift: [0.16, 0.5], color: '#5E4A28', size: 0.05 },
  drop: { ring: [0.25, 0.2], pitch: 1.3, gain: 0.25, within: 14, perSecond: 12 },
};

// adding to a gouache material after it has been made (the ropes make their own): the same thing kit.gouache's
// `extend` does, at the marks gouache leaves in its shaders (as kit_plants.js does for the pads)
function extendMaterial(mat, ex) {
  for (const h of ['vertexPars', 'vertexLocal', 'vertexWorld']) if (ex[h]) { if (!mat.vertexShader.includes(`//@${h}`)) throw new Error(`cast_lines: gouache has no mark ${h}`); mat.vertexShader = mat.vertexShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`); }
  for (const h of ['fragmentPars', 'albedo', 'light', 'fog', 'final']) if (ex[h]) { if (!mat.fragmentShader.includes(`//@${h}`)) throw new Error(`cast_lines: gouache has no mark ${h}`); mat.fragmentShader = mat.fragmentShader.replace(`//@${h}`, `${ex[h]}\n    //@${h}`); }
  if (ex.defines) Object.assign(mat.defines, ex.defines);
  if (ex.uniforms) Object.assign(mat.uniforms, ex.uniforms);
  mat.needsUpdate = true;
  return mat;
}

// A rope is 3 cm: from the mooring the wet rope is four pixels wide, and the painter's filter, whose brush is five,
// washed it into the post behind it (.shots/landing_lines_posts_crop.png, first take). From NEAR metres it is marked
// for the filter to leave alone, wholly from FAR (the engine's own mark, as light.js marks the reed stems).
const CRISP = { final: /* glsl */`{ float lnK = smoothstep(2.2, 4.5, dist); if (lnK > 0.0) gl_FragColor.a = 0.5 - 1.55 * lnK - 13.95 * smoothstep(0.8, 1.0, lnK); }` };

export async function build(ctx, plan, shared) {
  const cast = shared.cast = shared.cast || {};
  const L = shared.landing, P = plan, K = shared.kit || {}, H = shared.heroes || {}, path = ctx.path, stage = ctx.stage, engine = ctx.engine;
  if (!L) throw new Error('cast_lines needs shared.landing (light.js)');
  const N = NUMBERS, want = new Set((QS.get('ln') || '').split(',').filter(Boolean));
  const rnd = ctx.rng(1301), updates = [], v = new THREE.Vector3(), w = new THREE.Vector3();
  const firstRide = (engine.rides || 0) === 0, dry = !firstRide || want.has('dry');
  const lines = cast.lines = { ropes: null, traps: null, drips: { rope: null, hems: null }, painter: null, wet: null };
  const drop = (x, z) => ctx.audio.play('drop', { x, z, pitch: N.drop.pitch, gain: N.drop.gain });
  const landings = () => ({ within: N.drop.within, perSecond: N.drop.perSecond, ring: N.drop.ring, onLand: (x, z, info) => { if (!info.onBoat) drop(x, z); } });

  // ============================================================================================ the ropes
  const S = H.staithe;
  if (S && S.grooves) {
    const WET = 0, PAINTER = 1, f = L.frame(P.staithe.M2[0], {});
    // the wet rope: from the UP-ROUTE face of M2's upper neck (the post's own line, its radius and the rope's out): the
    // face the mooring sees. It swings ACROSS the water there, beside its post and clear of it on both sides. (Hung on
    // the channel face and swung along the staithe, as first made, it swung toward the moored rider and away: a line
    // that did not move, .shots/landing_lines_rope_near_crop.png)
    // (and a hand toward the channel: from the mooring it then hangs down the post's right-hand edge, half against the
    // water, where a dark wet rope can be told from a dark post)
    const g2 = S.grooves.M2[0], out2 = N.post + N.wet.radius + 0.004, from2 = [g2[0] - f.tx * out2 + f.rx * 0.06, g2[1], g2[2] - f.tz * out2 + f.rz * 0.06];
    // the painter: the boat is not placed while the area is built, so it is fitted at the first frame (below)
    const g1 = S.grooves.M1[0];
    const ropes = lines.ropes = makeRopes(ctx, { ropes: [
      { from: from2, length: N.wet.length, radius: N.wet.radius, color: N.wet.color, hz: N.wet.hz, settle: N.wet.settle, ...(dry ? {} : { wet: N.wet.share }) },
      { from: [g1[0], -60, g1[2]], to: [g1[0] + 0.5, -60, g1[2]], length: 0.6, radius: N.painter.radius, color: N.painter.color },
    ], wetLine: 0.12 });
    // (the area's light: the shade of the reeds and the cloth, and the rim. The staithe lies in the backwater's shade)
    extendMaterial(ropes.material, L.extend({ rim: 0.4, soft: 0.5 }));
    extendMaterial(ropes.material, CRISP);
    ropes.object.name = 'cast: ropes';

    // ---- the turns that make each rope fast: three round M2 under its pin, two round M1 (they go when the painter
    // slips). One mesh for all five: a turn of the thinner rope is the same ring, flattened
    const dark = (hex, k) => new THREE.Color(hex).multiplyScalar(k);
    const turnGeo = new THREE.TorusGeometry(N.post + N.wet.radius * 0.8, N.wet.radius, 6, 20); turnGeo.rotateX(Math.PI / 2);
    const turnMesh = new THREE.InstancedMesh(turnGeo, ctx.kit.gouache({ color: '#ffffff', brush: 0, extend: [L.extend({ rim: 0.4, soft: 0.5 }), CRISP] }), N.wet.turns + N.painter.turns);
    const tm = new THREE.Matrix4(), tq = new THREE.Quaternion(), te = new THREE.Euler(), tilt = [];
    const setTurn = (i, g, k, n, r, flat, on) => { te.set(tilt[i] ?? (tilt[i] = (rnd() - 0.5) * 0.12), 0, tilt[i] * 0.7); turnMesh.setMatrixAt(i, tm.compose(v.set(g[0], g[1] + (k - (n - 1) / 2) * r * 1.9, g[2]), tq.setFromEuler(te), w.set(on ? 1 : 0, on ? flat : 0, on ? 1 : 0))); };
    for (let k = 0; k < N.wet.turns; k++) { setTurn(k, g2, k, N.wet.turns, N.wet.radius, 1, true); turnMesh.setColorAt(k, dry ? dark(N.wet.color, 1) : dark(N.wet.color, 0.67)); }      // (wet rope is darker by a third)
    const showTurns1 = (on) => { for (let k = 0; k < N.painter.turns; k++) setTurn(N.wet.turns + k, g1, k, N.painter.turns, N.painter.radius, N.painter.radius / N.wet.radius, on); turnMesh.instanceMatrix.needsUpdate = true; };
    for (let k = 0; k < N.painter.turns; k++) turnMesh.setColorAt(N.wet.turns + k, dark(N.painter.color, 1));
    showTurns1(false);
    turnMesh.instanceColor.needsUpdate = true; turnMesh.name = 'cast: rope turns'; turnMesh.frustumCulled = false; ctx.add(turnMesh);

    // ---- the wet rope's drops: three places down its wet length, which move with it
    let ropeDrips = null;
    const places = N.wet.drips.at.map(() => ({ x: from2[0], y: 0.6, z: from2[2], color: N.wet.drips.color }));
    const place = () => { N.wet.drips.at.forEach((share, i) => { ropes.point(WET, share, v); places[i].x = v.x; places[i].y = Math.max(0.08, v.y); places[i].z = v.z; }); return places; };
    if (!dry) {
      ropeDrips = lines.drips.rope = makeFall(ctx, { kind: 'drip', points: place(), per: N.wet.drips.per, every: N.wet.drips.every, sun: L.toSun.toArray(), landings: landings(), seed: 1302 });
      ropeDrips.flow = N.wet.drips.rest; ropeDrips.object.name = 'cast: the wet rope\'s drops';
    }
    // (the first kick: across the water, so that the rope swings beside its post and not through it)
    if (!dry && !want.has('still')) ropes.kick(WET, [f.rx * N.wet.kick, f.rz * N.wet.kick]);
    let tailAt = 0;
    updates.push(() => {
      if (ropeDrips) { ropeDrips.setPoints(place()); ropeDrips.flow = N.wet.drips.rest + (1 - N.wet.drips.rest) * ropes.energy(WET); }
      // the swinging tail flings a little water each swing (it hangs clear of the surface, or it could not swing)
      const e = ropes.energy(WET);
      if (!dry && e > N.wet.tail[2] && ctx.time >= tailAt) { tailAt = ctx.time + 0.5 / N.wet.hz; ropes.point(WET, 1, v); ctx.water.ripple(v.x, v.z, N.wet.tail[0], N.wet.tail[1]); }
    });
    lines.wet = {
      index: WET, dry,
      /** Set it swinging: radians a second at its tail (0.74 is 0.35 m either way), across the water. */
      kick(strength = N.wet.kick) { ropes.kick(WET, [f.rx * strength, f.rz * strength]); return lines.wet; },
      /** How hard it swings now, 0..1. */
      get energy() { return ropes.energy(WET); },
    };

    // ---- the painter
    const PN = N.painter, boatModel = () => (engine.boat && engine.boat.model) || null;      // (asked for when it is needed: the boat may be given its model after the area is built)
    const st = { state: 'unset', L: 0, at: 0, end: [g1[0], g1[1], g1[2]] };      // 'moored' | 'slipped' | 'hauling' | 'aboard'
    const ring = (out) => { const m = boatModel(); return m && m.worldPoint ? m.worldPoint('painterRing', out) : out.set(ctx.boat.x, 0.5, ctx.boat.z); };
    const showOwn = (on) => { const m = boatModel(); if (PN.hideOwn && m && m.show) m.show('rope', on); };
    const away = () => { ropes.setFrom(PAINTER, g1[0], -60, g1[2]); ropes.setEnd(PAINTER, g1[0] + 0.5, -60, g1[2]); ropes.setLength(PAINTER, 0.6); };
    const painter = lines.painter = {
      index: PAINTER,
      get state() { return st.state; },
      /** The painter slips off M1: it falls, splashes, trails behind the boat, and is drawn in over the bow. */
      letGo() {
        if (st.state !== 'moored') return painter;
        st.state = 'slipped'; st.at = ctx.time; showTurns1(false);
        ropes.letGo(PAINTER);
        // where it falls: along the line it hung on, from under the post toward the boat
        ring(v);
        const mx = (st.end[0] + v.x) / 2, mz = (st.end[2] + v.z) / 2;
        stage.after(0.45, () => ctx.water.ripple(mx, mz, PN.splash[0], PN.splash[1]));
        for (let i = 0; i < 3; i++) stage.after(0.6 + 0.22 * i, () => { ring(w); const k = 0.25 + 0.25 * i, dx = st.end[0] - w.x, dz = st.end[2] - w.z, d = Math.hypot(dx, dz) || 1, a = Math.min(1, PN.trail[2] * k * 2 / d); ctx.water.ripple(w.x + dx * a, w.z + dz * a, PN.trail[0], PN.trail[1]); });
        stage.after(PN.aboard, () => { if (st.state === 'slipped') { st.state = 'hauling'; st.at = ctx.time; } });
        return painter;
      },
      /** Put it aboard at once, with no show (the boat's own coiled painter is shown): for a boat that starts further on. */
      stow() { st.state = 'aboard'; showTurns1(false); away(); showOwn(true); return painter; },
    };
    let fitted = false;
    updates.push(() => {
      if (!fitted) {
        // the first frame: the boat is in its place. It is moored if it lies at the title's place
        fitted = true;
        const T = P.title, tp = P.at(path, T.s, T.d, 0), moored = Math.hypot(ctx.boat.x - tp[0], ctx.boat.z - tp[2]) < 1.5;
        if (want.has('say')) { ring(v); console.error(`LINES painter: boat ${ctx.boat.x.toFixed(2)}, ${ctx.boat.z.toFixed(2)}; title ${tp[0].toFixed(2)}, ${tp[2].toFixed(2)}; moored ${moored}; model ${!!boatModel()}; ring ${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}; M1 ${g1.map((n) => n.toFixed(2))}; M2 ${g2.map((n) => n.toFixed(2))}`); }
        if (!moored || !boatModel()) { painter.stow(); return; }
        ring(v);
        const dx = v.x - g1[0], dz = v.z - g1[2], d = Math.hypot(dx, dz) || 1, off = N.post + PN.radius;
        st.end = [g1[0] + dx / d * off, g1[1], g1[2] + dz / d * off];
        st.L = Math.hypot(v.x - st.end[0], v.y - st.end[1], v.z - st.end[2]) * PN.slack;
        ropes.setFrom(PAINTER, v.x, v.y, v.z); ropes.setEnd(PAINTER, st.end[0], st.end[1], st.end[2]); ropes.setLength(PAINTER, st.L);
        showOwn(false);
        showTurns1(true); st.state = 'moored';
        return;
      }
      if (st.state === 'aboard' || st.state === 'unset') return;
      ring(v); ropes.setFrom(PAINTER, v.x, v.y, v.z);
      if (st.state === 'moored') {
        // nobody has let it go and the boat is leaving: it slips by itself as it comes taut
        if (Math.hypot(v.x - st.end[0], v.y - st.end[1], v.z - st.end[2]) > st.L * 0.985) painter.letGo();
      } else if (st.state === 'hauling') {
        const k = Math.min(1, (ctx.time - st.at) / PN.haul), e = k * k * (3 - 2 * k);
        ropes.setLength(PAINTER, Math.max(0.12, st.L * (1 - e)));
        if (k >= 1) painter.stow();
      }
    });
    ctx.onDispose(() => showOwn(true));
    if (want.has('go')) stage.after(2, () => painter.letGo());
  } else console.warn('landing/cast_lines: the staithe is not there (shared.heroes.staithe): no wet rope, no painter');

  // ============================================================================================ the eel traps
  // (kit_pilings.js hung them and gave each a pendulum: at rest they turn 25 degrees in 5 to 8 s and swing 4. Here the
  // kick that TRAVELS: each is struck as the thing that passes reaches it, a little late or early, never in step.)
  const TR = N.traps;
  const kickTraps = (o = {}) => {
    if (!K.trapSwing || !K.traps) return 0;
    const { near = null, radius = TR.radius, speed = TR.speed, degrees = TR.degrees, seconds = TR.seconds } = o;
    let n = 0;
    K.traps.forEach((t, i) => {
      const d = near ? Math.hypot(t.at[0] - near[0], t.at[2] - near[2]) : 0;
      if (d > radius) return;
      const deg = degrees * (1 - 0.45 * d / radius) * (0.8 + 0.4 * rnd());
      stage.after(d / Math.max(1, speed) + rnd() * TR.apart, () => K.trapSwing.kick(i, deg, seconds));
      n++;
    });
    return n;
  };
  lines.traps = { list: K.traps || [], swing: K.trapSwing || null, kick: kickTraps };
  // the swifts' party shoots the span: its wind sets them swinging (cast.js leaves the call for whoever wants it; the
  // stager may take it over: then call lines.traps.kick({ near: [x, z], speed }) from there)
  const swifts = cast.swifts;
  if (swifts && 'onSpan' in swifts) {
    const before = swifts.onSpan;
    swifts.onSpan = (x, y, z, speed) => { if (before) before(x, y, z, speed); const n = kickTraps({ near: [x, z], speed: speed || TR.speed }); if (want.has('say')) console.error(`LINES the swifts shot the span at ${ctx.time.toFixed(1)} s (${(+x).toFixed(1)}, ${(+y).toFixed(1)}, ${(+z).toFixed(1)}; ${speed} m/s): ${n} traps struck`); };
  }
  if (want.has('kick')) stage.after(2, () => { const b = shared.bridge, p = b && b.pt ? b.pt(0, 2, 0) : null; kickTraps({ near: p ? [p[0], p[2]] : null }); });

  // ============================================================================================ the hems' drops
  // (kit.js hung the nine bolts; most of their hems trail in the water. A hem that hangs clear drips from its lowest
  // tip; one that stands in the water drips from a fold a little above it, where the wet linen sheds what it has drawn up.)
  if (K.cloth && K.cloth.hemPoints) {
    const pts = [];
    for (let i = 0; i < P.gate.cloths; i++) {
      const tip = K.cloth.hemPoints(i, 1)[0]; if (!tip) continue;
      pts.push({ x: tip.x, y: tip.y > 0.1 ? tip.y : N.hems.lift[0] + rnd() * (N.hems.lift[1] - N.hems.lift[0]), z: tip.z, color: N.hems.color });
    }
    if (pts.length) {
      const hems = lines.drips.hems = makeFall(ctx, { kind: 'drip', points: pts, every: N.hems.every, scatter: null, size: N.hems.size, opacity: 1, landings: landings(), seed: 1303 });
      hems.object.name = 'cast: the hems\' drops';
      if (want.has('say')) console.error('LINES hems ' + pts.map((q) => { const o = path.locate(q.x, q.z, null, {}); return `(${o.s.toFixed(1)}, ${o.d.toFixed(1)}, ${q.y.toFixed(2)})`; }).join(' '));
    }
  }

  // ============================================================================================ for the stager
  //   lines.ropes            makeRopes' handle (rope 0 the wet rope, rope 1 the painter): kick, energy, point, letGo
  //   lines.wet              { kick(strength), energy, dry }: the wet rope; dry is the second-ride state (no wet, no drops, no kick)
  //   lines.painter          { letGo(), stow(), state }: 'moored' at the title's place, then 'slipped', 'hauling', 'aboard'
  //   lines.traps            { kick({ near: [x, z], radius, speed, degrees, seconds }), list, swing }
  //   lines.drips            { rope, hems }: makeFall's handles (flow 0..1; the rope's follows its energy)
  if (want.has('say')) console.error(`LINES ropes ${lines.ropes ? lines.ropes.count : 0}, dry ${dry}; rope drips ${lines.drips.rope ? lines.drips.rope.points : 0}, hem drips ${lines.drips.hems ? lines.drips.hems.points : 0}; traps ${lines.traps.list.length}, swing ${!!lines.traps.swing}; swifts.onSpan ${!!(swifts && swifts.onSpan)}`);

  return { update(dt) { for (const f of updates) f(dt); } };
}
