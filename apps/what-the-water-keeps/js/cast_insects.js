// landing: the cast, group "Insects" (stage 3). docs/build/landing/3-cast-insects.md is its log; the plan is
// docs/build/landing/3-cast-plan.md; the family is docs/life/insects.md (makeDragonflies, makePondSkaters).
//
//   2. Dragonflies and damselflies: 5 hawkers (four blue, one tawny female) and 24 blue damselflies.
//        H1 on the crook of the boat's own lantern (2.9 m from the eye) until the stager's leave()
//        H4 on the top of M2 (6 m from the mooring, passed at 3 m)       H5 on the bridge's rail post at d -3
//        H2 on its beat along the right reed edge, s 6 to 34, 1.2 m up     H3, the tawny female, low over raft A, dabbing
//        damsels: 12 on the pads of raft A, 6 on the gangway's hand line, 6 low on reed stems on the right
//   3. Pond skaters: 140 in five flotillas on circles of open water: G1 (30, in three knots of ten along the lee of the
//      staithe, with their shadows on the sand), G2 (35, off raft A), G3 (25, between gangway and jetty), G4 (25, the
//      right edge), G5 (25, under the bridge by the inner left tower).
//
// Their light is the area's: the shade (shared.landing.extend, no rim: a rim on a beating wing twinkles) under the
// family's rule lit: 'sun' for the wings (they take the sun only when they stand between the eye and it; nothing
// glitters). The family's paint takes no `extend` of an area's, so it is handed a ctx whose kit adds it (wearing()).
//
// shared.cast.insects (for the stager; every call returns the handle):
//   hawkers, damsels, skaters   the family's own handles (docs/life/insects.md)
//   H                       the hawkers' numbers: { H1, H2, H3, H4, H5 } (hawkers.state(H.H1), hawkers.position(H.H4, v))
//   leave(i = H.H1)         it takes off and goes for good (H1, a second before the flame sets out)
//   lift(i = H.H4)          a perched one sallies now and comes back to its perch (H4 as the bow passes M2 at s 18)
//   flushAll(filter)        every perched damselfly lifts and flits (filter(agent): agent.pos is where it is)
//   flushNear(x, z, r)      the damselflies perched within r metres of a place lift (a pad that rocks)
//   scatter(x, z, r)        the skaters within r of a place row away and regroup
//   flotillas               the skaters' circles: [{ name, s, d, x, z, radius, count }]
//
// Developer switches: &insects=hawkers,damsels,skaters builds only those; &h1=M2 seats H1 on the mooring post M2
//   (and H4 on M1) instead of the boat's lantern; &insplay=leave | lift | flush | scatter fires that handle 0.3 s in
//   (with &t=); &insdebug=1 prints where everything was put.
import * as THREE from 'three';
import { makeDragonflies, makePondSkaters } from '../../engine/life/insects.js';

const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');

// ---- this group's own numbers (the plan's, and what was settled in the picture)
const M = {
  // H1's perch: 'crook' (the boat's lantern) or 'M2' (the mooring post, if it reads as a pet: then H4 sits on M1)
  // (yaw: from the boat's own forward, toward the sun, which stands 0.68 to the right of the bow at the mooring; pitch:
  // the abdomen raised, as a hawker sits in the sun. Level and at 0.4 it was a blue smudge twelve pixels wide from the
  // seat: end-on, at the eye's own height, its wings two lines the brush wiped away.)
  h1: QS.get('h1') === 'M2' ? 'M2' : 'crook', h1Yaw: +(QS.get('h1yaw') ?? -0.6), h1Pitch: +(QS.get('h1pitch') ?? -0.3),
  postRim: 0.075, postPitch: -0.3,                                           // a hawker on a mooring post: metres toward the channel from the head's middle; its abdomen raised
  // H2's beat: s along the right reed edge, how far inside the channel's edge it runs, its height and its width
  h2: { s: [6, 13, 20, 27, 34], inside: 2.3, y: 1.2, width: 1.0 },
  // H3's beat, low over the channel side of raft A: [s, d, height]
  h3: { beat: [[21, 3.5, 0.5], [27.5, 4.2, 0.5], [34, 3.8, 0.5]], width: 1.0, tint: '#b9853a' },
  // the wings' light (the family's 'sun' rule): the body keeps its own lit colour whole, a wing burns toward the sun
  lit: { rule: 'sun', dull: 1, thin: 0.12, gain: 0.9 }, wingCap: 0.24,
  damsels: { pads: 12, line: 6, stems: 6, padBand: 5.6, stemS: [20, 37], stemHeight: [0.14, 0.2] },
  // the skaters' circles of open water: [name, s, d, radius, count, shadows on the sand]
  flotillas: [
    // the lee of the staithe: three knots between the moored hull and the staithe's front piles, either side of the
    // step at s 13.4 to 14.7, whose two legs stand in the water half a metre out (a knot put abeam of the eye rowed
    // through them: .shots/landing_ins_03_skaters_side_crop.png)
    ['G1a', 10.5, -8.05, 0.7, 10, true], ['G1b', 12.3, -8.15, 0.55, 10, true], ['G1c', 15.9, -8.1, 0.6, 10, true],
    ['G2', 27.5, 0.0, 1.3, 35, false],                                       // off raft A, on the open water of its channel side
    ['G3', 25.5, -9.5, 0.9, 25, false],                                      // between gangway and jetty
    ['G4', 12.5, 6.8, 1.3, 25, false],                                       // the right edge, clear of iris and the stands of s 8 and 17
    ['G5', 39.0, -7.2, 1.1, 25, false],                                      // under the bridge, a metre inside the inner left tower
  ],
  sand: -0.35,
};

/** A ctx for a toolkit family whose paints wear the area's light: every kit.gouache the family makes gets `first` before its own extensions. */
function wearing(ctx, first, last = null) {
  const kit = Object.create(ctx.kit);
  kit.gouache = (o = {}) => ctx.kit.gouache({ ...o, extend: [first, ...[].concat(o.extend || []), last].filter(Boolean) });
  const c = Object.create(ctx); c.kit = kit;
  return c;
}
const CRISP = QS.get('inscrisp') === '0' ? {} : { crisp: true };
const xyz = (p) => (p && p.isVector3 ? { x: p.x, y: p.y, z: p.z } : { x: p[0], y: p[1], z: p[2] });

export async function build(ctx, plan, shared) {
  shared.cast = shared.cast || {};
  const L = shared.landing, P = plan, K = shared.kit || {}, heroes = shared.heroes || {}, br = shared.bridge, rnd = ctx.rng(4203);
  const want = (name) => !QS.has('insects') || QS.get('insects').split(',').includes(name);
  const worn = wearing(ctx, L.extend({ rim: 0, soft: 0.5 }));
  // The hawkers and the damselflies are drawn crisp (bodies, abdomens and legs are a pixel or two wide). Their wing
  // membranes the family stipples (a hashed fan when they beat); in this light a pale membrane in the sun was brighter
  // than paper, and the hatching was a grid of white sparks that jumped with every beat
  // (.shots/landing_ins_13_fliers_first_crop.png). So a membrane is never brighter than M.wingCap: a hatched veil, not a light.
  const wornCrisp = wearing(ctx, L.extend({ rim: 0, soft: 0.5 }), { uniforms: { uLWingCap: { value: +(QS.get('wingcap') ?? M.wingCap) } },
    fragmentPars: /* glsl */`uniform float uLWingCap;`,
    light: /* glsl */`if (vThin > 0.5) c = min(c, vec3(uLWingCap) * vec3(1.0, 0.93, 0.78));` });
  const hw = (s) => L.frame(s, {}).halfWidth;
  const H = shared.cast.insects = { H: { H2: 0, H3: 1, H1: 2, H4: 3, H5: 4 }, hawkers: null, damsels: null, skaters: null, flotillas: [] };
  const say = {};

  // ============================================================================================ the hawkers
  if (want('hawkers')) {
    const st = heroes.staithe || {};
    // The boat's model that the engine holds while a realm builds is not the one that sails (H1 first sat at the world's
    // origin, on the crook of a boat that was not there): so the perch's `object` is a stand-in that asks the engine for
    // the boat it has NOW every time the family reads it, and the crook's top is read from that boat's own points.
    const crookAt = new THREE.Vector3(0.215, 1.415, -2.335);
    const liveBoat = {
      updateWorldMatrix(parents, children) { const m = ctx.engine.boat.model; if (m.points && m.points.crookTop) crookAt.copy(m.points.crookTop); m.group.updateWorldMatrix(parents, children); },
      get matrixWorld() { return ctx.engine.boat.model.group.matrixWorld; },
    };
    liveBoat.updateWorldMatrix(true, false);
    const crook = { object: liveBoat, offset: crookAt, yaw: M.h1Yaw, pitch: M.h1Pitch };
    // On the head of a mooring post: at its channel-side rim, the abdomen raised. (The post is 22 cm thick and its head
    // stands above the rider's eye: a hawker lying flat on the middle of it was hidden by the head's own near rim, a
    // blue sliver two pixels thick: .shots/landing_ins_06_h4_m2_first_crop.png.)
    const post = (p) => { if (!p) return null; const q = xyz(p), f = L.frame(P.staithe.M2[0], {}); return { x: q.x + f.rx * M.postRim, y: q.y + 0.004, z: q.z + f.rz * M.postRim, pitch: M.postPitch }; };
    const m2 = post(st.M2 || L.at(P.staithe.M2[0], P.staithe.M2[1], P.staithe.postTop));
    const m1 = post(st.M1 || L.at(P.staithe.M1[0], P.staithe.M1[1], P.staithe.postTop));
    const h5 = br && br.perch ? { ...xyz(br.perch) } : { ...xyz(L.at(P.bridge.s, -3, P.bridge.deckTop(-3) + 1.1)) };
    const perchers = [
      // H1 does nothing but flick its wings: it never sallies (and one on the boat never lifts for the bow)
      { perch: M.h1 === 'crook' ? crook : m2, sally: [1e7, 1e7] },
      { perch: M.h1 === 'crook' ? m2 : m1 },                                 // H4
      { perch: h5 },                                                         // H5
    ];
    const fliers = [
      { beat: M.h2.s.map((s) => L.at(s, hw(s) - M.h2.inside, M.h2.y).toArray()), width: M.h2.width },                 // H2
      { beat: M.h3.beat.map(([s, d, y]) => L.at(s, d, y).toArray()), width: M.h3.width, tint: M.h3.tint, dab: true }, // H3
    ];
    // crisp: the painter's filter leaves them as drawn (wing edges, legs and the abdomen are a pixel or two wide at every distance)
    H.hawkers = await makeDragonflies(CRISP.crisp ? wornCrisp : worn, { fliers, perchers, tint: P.C.blue, lit: M.lit, seed: 51, material: CRISP });
    say.hawkers = { H1: M.h1, m2, h5, h2: fliers[0].beat.map((q) => q.map((v) => +v.toFixed(1))) };
  }

  // ============================================================================================ the damselflies
  if (want('damsels')) {
    const perches = [], D = M.damsels;
    // the pads of raft A nearest the channel, spread along the raft: almost twice as many as sit there, so each has somewhere to flit to
    const pads = ((K.pads && K.pads.rafts && K.pads.rafts.A) || []).filter((p) => p.d < D.padBand).sort((a, b) => a.s - b.s);
    const nPads = Math.min(pads.length, D.pads * 2 - 2);
    for (let i = 0; i < nPads; i++) { const p = pads[Math.floor((i + 0.5) * pads.length / nPads)]; perches.push({ x: p.x, y: (p.y ?? 0) + 0.012, z: p.z, water: true, yaw: rnd() * Math.PI * 2, on: 'pad' }); }
    // the gangway's hand line: twelve places along the rope itself, sag and all; it sits along the rope
    const rope = (heroes.gangway && heroes.gangway.rope) || [];
    rope.forEach((q, i) => { const a = rope[Math.max(0, i - 1)], b = rope[Math.min(rope.length - 1, i + 1)];
      perches.push({ x: q[0], y: q[1] + 0.012, z: q[2], yaw: Math.atan2(b[0] - a[0], b[2] - a[2]) + (i % 2 ? Math.PI : 0), on: 'line' }); });
    // reed stems of the front rank on the right: low on the stem (the wind's lean there is under a centimetre), on its
    // channel side, head up, facing the stem
    // (not behind a reedmace stand: the first two were put behind the stand of s 27 and could not be seen from the water)
    const stands = ((P.reedmace && P.reedmace.right) || []).map((s) => ({ s }));
    const stems = (K.stemsAt || []).map((it) => ({ it, q: ctx.path.locate(it.x, it.z, null, {}) })).filter((o) => o.q.d > 0 && o.q.s > D.stemS[0] && o.q.s < D.stemS[1] && (o.it.e ?? 0) < 0.5 && !stands.some((st) => Math.abs(st.s - o.q.s) < 2.9))
      .sort((a, b) => (a.it.e ?? 0) - (b.it.e ?? 0)).slice(0, 60).sort((a, b) => a.q.s - b.q.s);
    const nStems = Math.min(stems.length, D.stems * 2);
    for (let i = 0; i < nStems && K.stemPoint; i++) {
      const { it, q } = stems[Math.floor((i + 0.5) * stems.length / nStems)], p = K.stemPoint(it, D.stemHeight[0] + rnd() * (D.stemHeight[1] - D.stemHeight[0]), []);
      const f = L.frame(q.s, {}), a = Math.atan2(-f.rx, -f.rz);                // toward the channel
      perches.push({ x: p[0] + Math.sin(a) * 0.011, y: p[1], z: p[2] + Math.cos(a) * 0.011, pitch: 1.05, yaw: a + Math.PI, on: 'stem' });
    }
    const count = Math.min(perches.length, D.pads + D.line + D.stems);
    if (count) H.damsels = await makeDragonflies(CRISP.crisp ? wornCrisp : worn, { species: 'damselfly', count, perches, tint: P.C.blue, lit: M.lit, seed: 52, material: CRISP });
    say.damsels = { count, pads: nPads, line: rope.length, stems: nStems };
  }

  // ============================================================================================ the pond skaters
  if (want('skaters')) {
    const flotillas = M.flotillas.map(([name, s, d, radius, count, shadow]) => { const v = L.at(s, d, 0); H.flotillas.push({ name, s, d, x: v.x, z: v.z, radius, count }); return { position: [v.x, v.z], radius, count, shadow }; });
    H.skaters = await makePondSkaters(worn, { flotillas, shadows: { y: M.sand }, seed: 61 });
    say.skaters = { count: H.skaters.count };
  }

  // ---- the handles
  const _v = new THREE.Vector3();
  Object.assign(H, {
    leave(i = H.H.H1) { if (H.hawkers) H.hawkers.leave(i); return H; },
    lift(i = H.H.H4) { if (H.hawkers) { const a = H.hawkers.agents[i]; H.hawkers.flushAll((q) => q === a); } return H; },
    flushAll(filter = null) { if (H.damsels) H.damsels.flushAll(filter); return H; },
    flushNear(x, z, r = 1.5) { if (H.damsels) H.damsels.flushAll((a) => Math.hypot(a.pos.x - x, a.pos.z - z) < r); return H; },
    scatter(x, z, r = 3) { if (H.skaters) H.skaters.scatter(x, z, r); return H; },
  });

  // ---- developer switches
  const play = QS.get('insplay');
  if (play) ctx.stage.after(0.3, () => { for (const k of play.split(',')) { if (k === 'leave') H.leave(); else if (k === 'lift') H.lift(); else if (k === 'flush') H.flushAll(); else if (k === 'scatter') H.scatter(ctx.boat.x, ctx.boat.z, 4); } });
  if (QS.has('insdebug')) for (const when of [1, 5]) ctx.stage.after(when, () => {
    const hk = H.hawkers ? H.hawkers.agents.slice(0, 5).map((a, i) => [H.hawkers.state(i), ...H.hawkers.position(i, _v).toArray().map((v) => +v.toFixed(2))]) : null;
    console.error('INSECTS states ' + JSON.stringify(hk) + ' eye ' + JSON.stringify(ctx.engine.shared.uCameraPos.value.toArray().map((v) => +v.toFixed(2))));
    console.error('INSECTS ' + JSON.stringify({ damsels: say.damsels, skaters: say.skaters, H1: M.h1 }));
    if (H.damsels) console.error('INSECTS damsels on stems ' + JSON.stringify(H.damsels.agents.filter((a) => a.perch && a.perch.on === 'stem').slice(0, 4).map((a) => { const q = ctx.path.locate(a.pos.x, a.pos.z, null, {}); return [+q.s.toFixed(1), +q.d.toFixed(1), +a.pos.y.toFixed(2), H.damsels.state(H.damsels.agents.indexOf(a))]; })));
  });
  (shared.counts || (shared.counts = {})).insects = { hawkers: H.hawkers ? H.hawkers.count : 0, damsels: H.damsels ? H.damsels.count : 0, skaters: H.skaters ? H.skaters.count : 0 };
  return {};
}
